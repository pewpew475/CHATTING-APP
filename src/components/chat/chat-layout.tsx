"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
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
import { MessagingService, type Chat } from "@/lib/messaging-service"

// User and Chat interfaces are imported from messaging-service

export function ChatLayout() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(true)

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

  // Load user's chats
  useEffect(() => {
    const loadChats = async () => {
      if (!user?.id) return

      try {
        const userChats = await MessagingService.getUserChats(user.id)
        setChats(userChats)
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setIsLoadingChats(false)
      }
    }

    loadChats()
  }, [user?.id])

  // Handle chat selection with refresh if needed
  const handleChatSelect = async (chatId: string) => {
    console.log('Chat selected:', chatId)
    setSelectedChat(chatId)
    
    // Check if the selected chat exists in our current chats
    const chatExists = chats.find(chat => chat.id === chatId)
    if (!chatExists && user?.id) {
      console.log('Selected chat not found in current chats, refreshing...')
      try {
        const userChats = await MessagingService.getUserChats(user.id)
        setChats(userChats)
      } catch (error) {
        console.error("Error refreshing chats:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/")
    return null
  }

  const selectedChatData = selectedChat 
    ? chats.find(chat => chat.id === selectedChat)
    : null

  console.log('Chat Layout - selectedChat:', selectedChat)
  console.log('Chat Layout - selectedChatData:', selectedChatData)
  console.log('Chat Layout - chats:', chats)

  // Mobile view: show either sidebar or chat area, not both
  if (isMobile) {
    return (
      <div className="flex h-screen bg-background">
        {sidebarOpen ? (
          <ChatSidebar
            chats={chats}
            selectedChat={selectedChat}
            onChatSelect={(chatId) => {
              handleChatSelect(chatId)
              setSidebarOpen(false)
            }}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            currentUserId={user.id}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile header with back button */}
            {selectedChatData && selectedChatData.otherUser && (
              <div className="flex items-center gap-3 p-4 border-b bg-card">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSidebarOpen(true)
                    setSelectedChat(null)
                  }}
                  className="p-2"
                >
                  <Icons.arrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedChatData.otherUser.profileImageUrl} />
                  <AvatarFallback className="text-xs">
                    {selectedChatData.otherUser.realName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {selectedChatData.otherUser.realName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    @{selectedChatData.otherUser.username}
                  </p>
                </div>
              </div>
            )}
            
            {selectedChatData && selectedChatData.otherUser ? (
              <ChatArea 
                chatId={selectedChatData.id} 
                otherUser={selectedChatData.otherUser}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <Icons.messageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Choose a chat from the sidebar or start a new conversation
                  </p>
                  <Button 
                    onClick={() => setSidebarOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Icons.messageSquare className="h-4 w-4 mr-2" />
                    View Chats
                  </Button>
                </div>
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
        chats={chats}
        selectedChat={selectedChat}
        onChatSelect={handleChatSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentUserId={user.id}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatData && selectedChatData.otherUser ? (
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