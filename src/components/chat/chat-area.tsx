"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { TypingIndicator } from "./typing-indicator"
import { EmojiPickerComponent } from "./emoji-picker"
import { MessagingService, type Message, type Chat } from "@/lib/messaging-service"
import { getRandomAvatar } from "@/components/providers/firebase-auth-provider"

// Message interface is imported from messaging-service

interface ChatAreaProps {
  chatId: string
  otherUser: {
    id: string
    username: string
    realName: string
    isOnline: boolean
  }
}

export function ChatArea({ chatId, otherUser }: ChatAreaProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { 
    isConnected, 
    messages: socketMessages,
    sendMessage, 
    sendTyping, 
    isUserOnline,
    isUserTyping,
    joinChat,
    leaveChat,
    getChatMessages
  } = useSocket()

  // Load initial messages and join chat
  useEffect(() => {
    if (chatId && isConnected) {
      // Join the chat room
      joinChat(chatId)
      
      // Get messages from Socket.IO server
      getChatMessages(chatId)
    }
    
    return () => {
      if (chatId) {
        leaveChat(chatId)
      }
    }
  }, [chatId, isConnected, joinChat, leaveChat, getChatMessages])

  // Socket.IO handles real-time messages automatically

  // Sync Socket.IO messages with local messages for real-time updates
  useEffect(() => {
    if (socketMessages && socketMessages.length > 0) {
      // Filter messages for this specific chat
      const chatMessages = socketMessages.filter(msg => msg.chatId === chatId)
      if (chatMessages.length > 0) {
        setMessages(prevMessages => {
          // Merge with existing messages, avoiding duplicates
          const existingIds = new Set(prevMessages.map(m => m.id))
          const newMessages = chatMessages.filter(m => !existingIds.has(m.id))
          return [...prevMessages, ...newMessages].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
      }
    }
  }, [socketMessages, chatId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-mark messages as read when they're visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id')
            if (messageId && user?.id) {
              // Mark message as read
              MessagingService.markMessageAsRead(messageId)
              
              // Update local state
              setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, isRead: true } : msg
              ))
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    // Observe all message elements
    const messageElements = document.querySelectorAll('[data-message-id]')
    messageElements.forEach(el => observer.observe(el))

    return () => {
      messageElements.forEach(el => observer.unobserve(el))
    }
  }, [messages, user?.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return

    try {
      // Use Socket.IO for real-time messaging
      if (isConnected) {
        sendMessage({
          chatId,
          content: message.trim(),
          type: "TEXT",
          receiverId: otherUser.id
        })
        setMessage("")
        console.log('Message sent via Socket.IO')
      } else {
        // Fallback to Firebase if Socket.IO is not connected
        const result = await MessagingService.sendMessage(
          chatId,
          user.id,
          otherUser.id,
          message.trim(),
          "TEXT"
        )

        if (result.success && result.message) {
          setMessages(prev => [...prev, result.message!])
          setMessage("")
        } else {
          toast.error(result.error || "Failed to send message")
        }
        console.log('Message sent via Firebase fallback')
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }


  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    
    // Send typing indicator
    sendTyping({ chatId, isTyping: true })
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ chatId, isTyping: false })
    }, 1000)
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
  }

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOtherUserTyping = isUserTyping(otherUser.id, chatId)

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getRandomAvatar()} />
                <AvatarFallback>
                  {otherUser.realName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isUserOnline(otherUser.id) && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{otherUser.realName}</h3>
              <p className="text-sm text-muted-foreground">
                {isOtherUserTyping ? "Typing..." : isUserOnline(otherUser.id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Icons.search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Icons.settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              data-message-id={msg.id}
              className={`flex ${
                msg.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <p
                    className={`text-xs ${
                      msg.senderId === user?.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                  {msg.senderId === user?.id && (
                    <span className="text-xs ml-2">
                      {msg.isRead ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isOtherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <TypingIndicator isTyping={true} />
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Sending...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            className="flex-1"
          />
          <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || isLoading}
          >
            <Icons.send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}