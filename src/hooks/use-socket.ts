"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
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
  createdAt: Date
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
    })

    // Handle authentication success
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
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

  return {
    isConnected,
    messages,
    sendMessage,
    sendTyping,
    markMessageAsRead,
    isUserOnline,
    isUserTyping,
    socket: socketRef.current,
  }
}