import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { Socket as NetSocket } from 'net'

interface SocketServer extends NetServer {
  io?: SocketIOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running')
  } else {
    console.log('Socket.IO initializing')
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    })
    res.socket.server.io = io

    // Store online users in memory
    const onlineUsers = new Map<string, { socketId: string, userId: string, lastSeen: Date }>()

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('authenticate', async (data: { userId: string; token?: string }) => {
        try {
          console.log('Authenticating user:', data.userId)
          
          if (data.userId) {
            socket.userId = data.userId
            socket.join(`user_${data.userId}`)

            // Add user to online users map
            onlineUsers.set(data.userId, {
              socketId: socket.id,
              userId: data.userId,
              lastSeen: new Date()
            })

            // Get user's actual chat rooms from Firebase
            try {
              const { MessagingService } = await import('@/lib/messaging-service')
              const userChats = await MessagingService.getUserChats(data.userId)
              const chatIds = userChats.map(chat => chat.id)
              
              chatIds.forEach(chatId => {
                socket.join(chatId)
              })

              // Notify friends that user is online
              socket.broadcast.emit('user_status', {
                userId: data.userId,
                isOnline: true,
                lastSeen: new Date()
              })

              socket.emit('authenticated', { 
                success: true, 
                userId: data.userId,
                joinedRooms: chatIds.length + 1 
              })

              console.log(`User ${data.userId} authenticated and joined ${chatIds.length} chat rooms`)
            } catch (error) {
              console.error('Error loading user chats:', error)
              socket.emit('authenticated', { 
                success: true, 
                userId: data.userId,
                joinedRooms: 1 
              })
            }
          } else {
            socket.emit('auth_error', { message: 'Invalid user ID' })
            socket.disconnect()
          }
        } catch (error) {
          console.error('Authentication error:', error)
          socket.emit('auth_error', { message: 'Authentication failed' })
          socket.disconnect()
        }
      })

      socket.on('send_message', async (data: {
        chatId: string
        content: string
        type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
        fileUrl?: string
        fileName?: string
        fileSize?: number
        fileType?: string
      }) => {
        try {
          console.log('Message received:', data)
          
          if (!socket.userId) {
            throw new Error('User not authenticated')
          }
          
          // Get chat info to determine receiver
          const { MessagingService } = await import('@/lib/messaging-service')
          const chat = await MessagingService.getChat(data.chatId)
          
          if (!chat) {
            throw new Error('Chat not found')
          }
          
          // Determine receiver ID
          const receiverId = chat.user1Id === socket.userId ? chat.user2Id : chat.user1Id
          
          // Save message to Firebase
          const result = await MessagingService.sendMessage(
            data.chatId,
            socket.userId, // senderId
            receiverId, // receiverId
            data.content,
            data.type,
            data.fileUrl,
            data.fileName,
            data.fileSize,
            data.fileType
          )
          
          if (!result.success || !result.message) {
            throw new Error(result.error || 'Failed to send message')
          }
          
          const message = result.message

          // Broadcast message to all users in the chat
          socket.to(data.chatId).emit('new_message', message)
          
          // Also send to sender for confirmation
          socket.emit('message_sent', message)
          
          console.log('Message broadcasted to chat:', data.chatId)
        } catch (error) {
          console.error('Error sending message:', error)
          socket.emit('message_error', { error: 'Failed to send message' })
        }
      })

      socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
        socket.to(data.chatId).emit('user_typing', {
          userId: socket.userId,
          chatId: data.chatId,
          isTyping: data.isTyping
        })
      })

      socket.on('mark_read', async (data: { messageId: string }) => {
        try {
          const { MessagingService } = await import('@/lib/messaging-service')
          await MessagingService.markMessageAsRead(data.messageId)
          
          socket.emit('message_read', { messageId: data.messageId })
        } catch (error) {
          console.error('Error marking message as read:', error)
        }
      })

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id)
        
        if (socket.userId) {
          // Remove user from online users map
          onlineUsers.delete(socket.userId)
          
          // Notify others that user went offline
          socket.broadcast.emit('user_status', {
            userId: socket.userId,
            isOnline: false,
            lastSeen: new Date()
          })

          console.log(`User ${socket.userId} went offline`)
        }
      })
    })

    // Add endpoint to check online users
    io.on('get_online_users', (callback) => {
      const users = Array.from(onlineUsers.values()).map(user => ({
        userId: user.userId,
        lastSeen: user.lastSeen
      }))
      callback(users)
    })
  }
  res.end()
}
