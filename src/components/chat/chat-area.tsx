"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { FileUpload } from "./file-upload"
import { FileMessage } from "./file-message"
import { TypingIndicator } from "./typing-indicator"

interface Message {
  id: string
  content?: string
  senderId: string
  createdAt: Date
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE"
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  isRead?: boolean
}

interface ChatAreaProps {
  chatId: string
  otherUser: {
    id: string
    username: string
    realName: string
    profilePicture?: string
    isOnline: boolean
  }
}

export function ChatArea({ chatId, otherUser }: ChatAreaProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const [showFileUpload, setShowFileUpload] = useState(false)
  
  const { 
    isConnected, 
    sendMessage, 
    sendTyping, 
    markMessageAsRead,
    isUserOnline,
    isUserTyping 
  } = useSocket()

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Real messages will be loaded from API/database
        const mockMessages: Message[] = []
        setMessages(mockMessages)
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }

    loadMessages()
  }, [chatId, user?.uid, otherUser.id])

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
            if (messageId && user?.uid) {
              // Mark message as read
              markMessageAsRead(messageId)
              
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
  }, [messages, user?.uid, markMessageAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !showFileUpload) || !user) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim() || undefined,
      senderId: user.id,
      createdAt: new Date(),
      type: message.trim() ? "TEXT" : "FILE"
    }

    // Add message to local state immediately (optimistic update)
    setMessages(prev => [...prev, newMessage])
    setMessage("")
    setShowFileUpload(false)
    setIsLoading(true)

    // Send message via socket
    sendMessage({
      chatId,
      content: message.trim() || "",
      type: message.trim() ? "TEXT" : "FILE"
    })

    // Simulate API call completion
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleFileUpload = (fileData: {
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
  }) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.uid || "",
      createdAt: new Date(),
      type: fileData.fileType.startsWith("image/") ? "IMAGE" : 
            fileData.fileType.startsWith("video/") ? "VIDEO" : "FILE",
      fileUrl: fileData.fileUrl,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      fileType: fileData.fileType
    }

    setMessages(prev => [...prev, newMessage])
    setShowFileUpload(false)

    // Send file message via socket
    sendMessage({
      chatId,
      content: "",
      type: newMessage.type,
      fileUrl: fileData.fileUrl,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize
    })
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

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                <AvatarImage src={otherUser.profilePicture} />
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
                msg.senderId === user?.uid ? "justify-end" : "justify-start"
              }`}
            >
              {msg.type === "TEXT" && msg.content ? (
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderId === user?.uid
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs ${
                        msg.senderId === user?.uid
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </p>
                    {msg.senderId === user?.uid && (
                      <span className="text-xs ml-2">
                        {msg.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <FileMessage
                  fileUrl={msg.fileUrl || ""}
                  fileName={msg.fileName || ""}
                  fileSize={msg.fileSize || 0}
                  fileType={msg.fileType || ""}
                  isOwnMessage={msg.senderId === user?.uid}
                />
              )}
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

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="p-4 border-t bg-card">
          <FileUpload
            onFileUpload={handleFileUpload}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={showFileUpload ? "text-primary" : ""}
          >
            <Icons.paperclip className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon">
            <Icons.smile className="h-4 w-4" />
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            disabled={(!message.trim() && !showFileUpload) || isLoading}
          >
            <Icons.send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}