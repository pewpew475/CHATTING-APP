// Standalone Socket.IO Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Store online users and messages in memory
const onlineUsers = new Map();
const messages = new Map(); // chatId -> messages array
const typingUsers = new Map(); // userId -> { chatId, isTyping }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (data) => {
    try {
      console.log('Authenticating user:', data.userId);
      
      if (data.userId) {
        socket.userId = data.userId;
        socket.join(`user_${data.userId}`);
        
        // Add user to online users
        onlineUsers.set(data.userId, {
          socketId: socket.id,
          userId: data.userId,
          lastSeen: new Date(),
          isOnline: true
        });

        // Join user to their chat rooms
        socket.join(`chat_${data.userId}`);

        // Notify others that user is online
        socket.broadcast.emit('user_status', {
          userId: data.userId,
          isOnline: true,
          lastSeen: new Date()
        });

        socket.emit('authenticated', { 
          success: true, 
          userId: data.userId,
          onlineUsers: Array.from(onlineUsers.keys())
        });

        console.log(`User ${data.userId} authenticated and is online`);
      } else {
        socket.emit('auth_error', { message: 'Invalid user ID' });
        socket.disconnect();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    try {
      console.log('Message received:', data);
      
      if (!socket.userId) {
        socket.emit('message_error', { error: 'User not authenticated' });
        return;
      }

      // Create message object
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId: data.chatId,
        senderId: socket.userId,
        receiverId: data.receiverId || '',
        content: data.content,
        type: data.type || 'TEXT',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store message in memory
      if (!messages.has(data.chatId)) {
        messages.set(data.chatId, []);
      }
      messages.get(data.chatId).push(message);

      // Broadcast message to all users in the chat
      io.to(`chat_${data.chatId}`).emit('new_message', message);
      
      // Also send to sender for confirmation
      socket.emit('message_sent', message);
      
      console.log('Message broadcasted to chat:', data.chatId);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (!socket.userId) return;
    
    typingUsers.set(socket.userId, {
      chatId: data.chatId,
      isTyping: data.isTyping,
      timestamp: Date.now()
    });

    socket.to(`chat_${data.chatId}`).emit('user_typing', {
      userId: socket.userId,
      chatId: data.chatId,
      isTyping: data.isTyping
    });
  });

  // Handle message read receipts
  socket.on('mark_read', (data) => {
    try {
      if (!socket.userId) return;
      
      // Update message as read in memory
      const chatMessages = messages.get(data.chatId);
      if (chatMessages) {
        const message = chatMessages.find(m => m.id === data.messageId);
        if (message) {
          message.isRead = true;
          message.updatedAt = new Date().toISOString();
        }
      }
      
      socket.emit('message_read', { messageId: data.messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle joining a chat room
  socket.on('join_chat', (data) => {
    if (!socket.userId) return;
    
    socket.join(`chat_${data.chatId}`);
    console.log(`User ${socket.userId} joined chat ${data.chatId}`);
    
    // Send existing messages for this chat
    const chatMessages = messages.get(data.chatId) || [];
    socket.emit('chat_messages', { chatId: data.chatId, messages: chatMessages });
  });

  // Handle leaving a chat room
  socket.on('leave_chat', (data) => {
    if (!socket.userId) return;
    
    socket.leave(`chat_${data.chatId}`);
    console.log(`User ${socket.userId} left chat ${data.chatId}`);
  });

  // Handle getting online users
  socket.on('get_online_users', (callback) => {
    const users = Array.from(onlineUsers.values()).map(user => ({
      userId: user.userId,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline
    }));
    callback(users);
  });

  // Handle getting chat messages
  socket.on('get_chat_messages', (data, callback) => {
    const chatMessages = messages.get(data.chatId) || [];
    callback({ chatId: data.chatId, messages: chatMessages });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      // Remove user from online users
      onlineUsers.delete(socket.userId);
      
      // Remove typing status
      typingUsers.delete(socket.userId);
      
      // Notify others that user went offline
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        isOnline: false,
        lastSeen: new Date()
      });

      console.log(`User ${socket.userId} went offline`);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    onlineUsers: onlineUsers.size,
    totalMessages: Array.from(messages.values()).reduce((total, msgs) => total + msgs.length, 0)
  });
});

// Get online users endpoint
app.get('/api/online-users', (req, res) => {
  const users = Array.from(onlineUsers.values()).map(user => ({
    userId: user.userId,
    lastSeen: user.lastSeen,
    isOnline: user.isOnline
  }));
  res.json(users);
});

// Get chat messages endpoint
app.get('/api/chat/:chatId/messages', (req, res) => {
  const chatId = req.params.chatId;
  const chatMessages = messages.get(chatId) || [];
  res.json({ chatId, messages: chatMessages });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Online users: http://localhost:${PORT}/api/online-users`);
});

module.exports = { app, server, io };
