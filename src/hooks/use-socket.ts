"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { io, Socket } from "socket.io-client"

interface UseSocketProps {
  autoConnect?: boolean
}

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  receiverId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

interface UserStatus {
  userId: string
  isOnline: boolean
  lastSeen?: Date
}

interface TypingIndicator {
  userId: string
  chatId: string
  isTyping: boolean
}

interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export function useSocket({ autoConnect = true }: UseSocketProps = {}) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map())
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user?.id || !autoConnect) return

    console.log('Initializing socket connection for user:', user.id)

    const socket = io({
      path: '/api/socketio',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setIsConnected(true)
      // Authenticate with user ID
      socket.emit('authenticate', { userId: user.id })
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      // If Socket.IO fails, we'll fall back to Firebase-only mode
      console.log('Falling back to Firebase-only mode for real-time features')
    })

    // Handle authentication success
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
    })

    // Handle user status updates
    socket.on('user_status', (data: { userId: string; isOnline: boolean; lastSeen: Date }) => {
      console.log('User status update:', data)
      if (data.isOnline) {
        setOnlineUsers(prev => new Set([...prev, data.userId]))
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    })

    // Handle new messages
    socket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message)
      setMessages(prev => [...prev, message])
    })

    socket.on('message_sent', (message: ChatMessage) => {
      console.log('Message sent confirmation:', message)
      setMessages(prev => [...prev, message])
    })

    // Handle typing indicators
    socket.on('user_typing', (data: { userId: string; chatId: string; isTyping: boolean }) => {
      console.log('User typing:', data)
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(`${data.userId}_${data.chatId}`, data.isTyping)
        return newMap
      })
    })

    // Handle message read receipts
    socket.on('message_read', (data: { messageId: string }) => {
      console.log('Message read:', data)
    })

    // Handle authentication errors
    socket.on('auth_error', (error) => {
      console.error('Socket auth error:', error)
    })

    // Handle new messages
    socket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message)
      setMessages(prev => [...prev, message])
    })

    // Handle user status updates
    socket.on('user_status', (status: UserStatus) => {
      console.log('User status update:', status)
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        if (status.isOnline) {
          newSet.add(status.userId)
        } else {
          newSet.delete(status.userId)
        }
        return newSet
      })
    })

    // Handle typing indicators
    socket.on('user_typing', (typing: TypingIndicator) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(`${typing.userId}_${typing.chatId}`, typing.isTyping)
        return newMap
      })
    })

    // Handle message read receipts
    socket.on('message_read', (data: { messageId: string; chatId: string; readBy: string }) => {
      // Update message read status in state
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, isRead: true } : msg
      ))
    })

    // Handle friend requests
    socket.on('friend_request', (request: FriendRequest) => {
      console.log('Friend request received:', request)
      // You can add state management for friend requests here
    })

    socket.on('friend_request_accepted', (request: FriendRequest) => {
      console.log('Friend request accepted:', request)
      // You can add state management for accepted requests here
    })

    socket.on('friend_request_rejected', (request: FriendRequest) => {
      console.log('Friend request rejected:', request)
      // You can add state management for rejected requests here
    })

    // Handle errors
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    return () => {
      console.log('Cleaning up socket connection')
      socket.disconnect()
    }
  }, [user?.id, autoConnect])

  const sendMessage = (data: {
    chatId: string
    content: string
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
    fileUrl?: string
    fileName?: string
    fileSize?: number
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', data)
    } else {
      console.warn('Socket not connected, message not sent via Socket.IO')
    }
  }

  const sendTyping = (data: { chatId: string; isTyping: boolean }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', data)
    }
  }

  const markMessageAsRead = (messageId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', { messageId })
    }
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId)
  }

  const isUserTyping = (userId: string, chatId: string) => {
    return typingUsers.get(`${userId}_${chatId}`) || false
  }

  const sendFriendRequest = (toUserId: string) => {
    if (socketRef.current && user?.id) {
      socketRef.current.emit('send_friend_request', {
        fromUserId: user.id,
        toUserId: toUserId
      })
    }
  }

  const acceptFriendRequest = (requestId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('accept_friend_request', { requestId })
    }
  }

  const rejectFriendRequest = (requestId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('reject_friend_request', { requestId })
    }
  }

  return {
    isConnected,
    messages,
    sendMessage,
    sendTyping,
    markMessageAsRead,
    isUserOnline,
    isUserTyping,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    socket: socketRef.current,
  }
}