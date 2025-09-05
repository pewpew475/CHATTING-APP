import { Server } from 'socket.io';
import { db } from './db';

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: Date;
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export const setupSocket = (io: Server) => {
  // Store online users
  const onlineUsers = new Map<string, string>(); // userId -> socketId
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user authentication and join rooms
    socket.on('authenticate', async (data: { userId: string; token?: string }) => {
      try {
        console.log('Authenticating user:', data.userId);
        
        if (data.userId) {
          // Store user socket mapping
          onlineUsers.set(data.userId, socket.id);
          socket.userId = data.userId;
          
          // Update user online status in Firebase
          try {
            const { FriendService } = await import('./friend-service');
            await FriendService.updateOnlineStatus(data.userId, true);
          } catch (error) {
            console.error('Error updating online status:', error);
          }
          
          // Join user to their personal room for direct messages
          socket.join(`user_${data.userId}`);

          // Get user's actual chat rooms from Firebase
          try {
            const { MessagingService } = await import('./messaging-service');
            const userChats = await MessagingService.getUserChats(data.userId);
            const chatIds = userChats.map(chat => chat.id);
            
            chatIds.forEach(chatId => {
              socket.join(chatId);
            });

            // Notify friends that user is online
            socket.broadcast.emit('user_status', {
              userId: data.userId,
              isOnline: true,
              lastSeen: new Date()
            } as UserStatus);

            // Send authentication success
            socket.emit('authenticated', { 
              success: true, 
              userId: data.userId,
              joinedRooms: chatIds.length + 1 
            });

            console.log(`User ${data.userId} authenticated and joined ${chatIds.length} chat rooms`);
          } catch (error) {
            console.error('Error loading user chats:', error);
            // Fallback to basic authentication
            socket.emit('authenticated', { 
              success: true, 
              userId: data.userId,
              joinedRooms: 1 
            });
          }
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
    socket.on('send_message', async (data: {
      chatId: string;
      content: string;
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        console.log('Sending message:', data);

        // For now, create a mock message without database
        // In production, you would save to database
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageData: ChatMessage = {
          id: messageId,
          chatId: data.chatId,
          senderId: socket.userId,
          receiverId: 'mock_receiver', // In production, get from chat participants
          content: data.content,
          type: data.type as any,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          createdAt: new Date()
        };

        // Broadcast message to chat room
        io.to(`chat_${data.chatId}`).emit('new_message', messageData);
        
        // Also send to sender for confirmation
        socket.emit('message_sent', { messageId, success: true });

        console.log('Message broadcasted to chat room:', `chat_${data.chatId}`);

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      if (!socket.userId) return;
      
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId,
        isTyping: data.isTyping
      });
    });

    // Handle mark message as read
    socket.on('mark_read', async (data: { messageId: string }) => {
      try {
        if (!socket.userId) return;

        console.log('Marking message as read:', data.messageId);

        // For now, just broadcast the read receipt without database
        // In production, you would update the database
        socket.broadcast.emit('message_read', {
          messageId: data.messageId,
          readBy: socket.userId
        });

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.userId) {
        // Remove from online users
        onlineUsers.delete(socket.userId);
        
        // Update user offline status in Firebase
        try {
          const { FriendService } = await import('./friend-service');
          await FriendService.updateOnlineStatus(socket.userId, false);
        } catch (error) {
          console.error('Error updating offline status:', error);
        }
        
        // Notify others that user went offline
        socket.broadcast.emit('user_status', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        } as UserStatus);

        console.log(`User ${socket.userId} went offline`);
      }
    });
  });
};