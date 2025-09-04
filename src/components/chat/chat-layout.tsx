"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"

interface User {
  id: string
  username: string
  realName: string
  profilePicture?: string
  isOnline: boolean
}

interface Chat {
  id: string
  participant1: string
  participant2: string
  lastMessageAt?: Date
  lastMessage?: string
  unreadCount?: number
  otherUser: User
}

export function ChatLayout() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Icons.spinner className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    router.push("/")
    return null
  }

  // Real chats will be loaded from API/database
  const mockChats: Chat[] = []

  const selectedChatData = selectedChat 
    ? mockChats.find(chat => chat.id === selectedChat)
    : null

  // Mobile view: show either sidebar or chat area, not both
  if (isMobile) {
    return (
      <div className="flex h-screen bg-background">
        {sidebarOpen ? (
          <ChatSidebar
            chats={mockChats}
            selectedChat={selectedChat}
            onChatSelect={(chatId) => {
              setSelectedChat(chatId)
              setSidebarOpen(false)
            }}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            currentUserId={user.id}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {selectedChatData ? (
              <ChatArea 
                chatId={selectedChatData.id} 
                otherUser={selectedChatData.otherUser}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Icons.messageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a chat from the sidebar or start a new conversation
                  </p>
                  <Button onClick={() => setSidebarOpen(true)}>
                    <Icons.messageSquare className="h-4 w-4 mr-2" />
                    View Chats
                  </Button>
                </div>
              </div>
            )}
            {/* Mobile back button */}
            {selectedChatData && (
              <div className="p-4 border-t bg-card">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSidebarOpen(true)
                    setSelectedChat(null)
                  }}
                >
                  <Icons.messageSquare className="h-4 w-4 mr-2" />
                  Back to Chats
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Desktop view: show both sidebar and chat area
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ChatSidebar
        chats={mockChats}
        selectedChat={selectedChat}
        onChatSelect={setSelectedChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentUserId={user.uid}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatData ? (
          <ChatArea 
            chatId={selectedChatData.id} 
            otherUser={selectedChatData.otherUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Icons.messageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a chat from the sidebar or start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}