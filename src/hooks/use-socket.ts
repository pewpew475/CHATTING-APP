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

    // For now, disable Socket.IO and use Firebase-only mode
    console.log('Using Firebase-only mode for real-time features')
    setIsConnected(false) // Indicate we're not using Socket.IO
    
    // Set user as online in Firebase
    const setUserOnline = async () => {
      try {
        const { FriendService } = await import('@/lib/friend-service')
        await FriendService.updateOnlineStatus(user.id, true)
        console.log('User online status set in Firebase')
      } catch (error) {
        console.error('Error setting user online status:', error)
      }
    }
    
    setUserOnline()

    // Return cleanup function
    return () => {
      const setUserOffline = async () => {
        try {
          const { FriendService } = await import('@/lib/friend-service')
          await FriendService.updateOnlineStatus(user.id, false)
          console.log('User offline status set in Firebase')
        } catch (error) {
          console.error('Error setting user offline status:', error)
        }
      }
      setUserOffline()
    }

    // Comment out Socket.IO for now
    /*
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
      // socket.disconnect() // Commented out for Firebase-only mode
    }
    */
  }, [user?.id, autoConnect])

  const sendMessage = (data: {
    chatId: string
    content: string
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
    fileUrl?: string
    fileName?: string
    fileSize?: number
  }) => {
    // In Firebase-only mode, messages are sent through MessagingService
    // This function is kept for compatibility but doesn't use Socket.IO
    console.log('Message sending handled by MessagingService (Firebase-only mode)')
  }

  const sendTyping = (data: { chatId: string; isTyping: boolean }) => {
    // In Firebase-only mode, typing indicators are not supported
    console.log('Typing indicators not supported in Firebase-only mode')
  }

  const markMessageAsRead = (messageId: string) => {
    // In Firebase-only mode, read receipts are handled by MessagingService
    console.log('Read receipts handled by MessagingService (Firebase-only mode)')
  }

  const isUserOnline = async (userId: string) => {
    // In Firebase-only mode, check online status from Firebase
    try {
      const { FriendService } = await import('@/lib/friend-service')
      // This would need to be implemented to check Firebase for online status
      // For now, return false as we don't have real-time online status
      return false
    } catch (error) {
      console.error('Error checking user online status:', error)
      return false
    }
  }

  const isUserTyping = (userId: string, chatId: string) => {
    // In Firebase-only mode, typing indicators are not supported
    return false
  }

  const sendFriendRequest = (toUserId: string) => {
    // In Firebase-only mode, friend requests are handled by FriendService
    console.log('Friend requests handled by FriendService (Firebase-only mode)')
  }

  const acceptFriendRequest = (requestId: string) => {
    // In Firebase-only mode, friend request acceptance is handled by FriendService
    console.log('Friend request acceptance handled by FriendService (Firebase-only mode)')
  }

  const rejectFriendRequest = (requestId: string) => {
    // In Firebase-only mode, friend request rejection is handled by FriendService
    console.log('Friend request rejection handled by FriendService (Firebase-only mode)')
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