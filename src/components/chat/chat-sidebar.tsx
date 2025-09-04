"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/ui/icons"
import { FriendsList } from "@/components/friends/friends-list"
import { SettingsDialog } from "@/components/profile/settings-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { getUserProfile } from "@/lib/profile-storage"
import { type Chat } from "@/lib/messaging-service"

interface ChatSidebarProps {
  chats: Chat[]
  selectedChat: string | null
  onChatSelect: (chatId: string) => void
  isOpen: boolean
  onToggle: () => void
  currentUserId: string
}

export function ChatSidebar({
  chats,
  selectedChat,
  onChatSelect,
  isOpen,
  onToggle,
  currentUserId
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("chats")
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        console.log('Chat sidebar loading profile for user:', user.id)
        const profile = await getUserProfile(user.id)
        console.log('Chat sidebar profile data:', profile)
        setUserProfile(profile)
      }
    }
    loadProfile()
  }, [user?.id])
  
  const displayName = userProfile?.realName || user?.user_metadata?.full_name || user?.user_metadata?.name || "User"
  const username = userProfile?.username || user?.email?.split('@')[0] || "user"
  const email = user?.email || "user@example.com"
  const profileImage = userProfile?.profileImageUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""

  const filteredChats = chats.filter(chat =>
    chat.otherUser?.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatLastMessageTime = (date?: string) => {
    if (!date) return ""
    
    const now = new Date()
    const messageDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' })
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleFriendSelect = (friend: { id: string }) => {
    // Find or create chat with this friend
    const existingChat = chats.find(chat => chat.otherUser?.id === friend.id)
    if (existingChat) {
      onChatSelect(existingChat.id)
    } else {
      // Create new chat (mock implementation)
      const newChatId = `chat_${currentUserId}_${friend.id}`
      onChatSelect(newChatId)
    }
  }

  if (!isOpen) {
    return (
      <div className="w-16 border-r bg-gradient-to-b from-purple-600 to-blue-600 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="mb-4 text-white hover:bg-white/20"
        >
          <Icons.messageSquare className="h-5 w-5" />
        </Button>
        <Avatar 
          className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/profile")}
        >
          <AvatarImage src={profileImage} />
          <AvatarFallback className="bg-white text-purple-600">
            {displayName[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-sm font-bold">F</span>
            </div>
            <h2 className="text-lg font-semibold text-white truncate">Fellowz</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle} 
            className="text-white hover:bg-white/20 flex-shrink-0"
          >
            <Icons.messageSquare className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/20">
              <TabsTrigger 
                value="chats" 
                className="text-white data-[state=active]:bg-white/30 text-sm truncate"
              >
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                className="text-white data-[state=active]:bg-white/30 text-sm truncate"
              >
                Friends
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search Input */}
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 z-10" />
            <Input
              placeholder={activeTab === "chats" ? "Search conversations..." : "Search friends..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "chats" ? (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Icons.messageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                      selectedChat === chat.id ? "bg-accent" : ""
                    }`}
                    onClick={() => onChatSelect(chat.id)}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.otherUser?.profileImageUrl} />
                          <AvatarFallback>
                            {chat.otherUser?.realName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {chat.otherUser?.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                        {/* Unread badge intentionally removed until supported by Chat type */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate text-sm">
                            {chat.otherUser?.realName}
                          </h3>
                          {chat.lastMessageAt && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatLastMessageTime(chat.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          @{chat.otherUser?.username}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full overflow-hidden">
            <FriendsList 
              onFriendSelect={handleFriendSelect}
              selectedFriendId={selectedChat ? chats.find(c => c.id === selectedChat)?.otherUser?.id : undefined}
            />
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex items-center space-x-3 min-w-0">
          <Avatar 
            className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => router.push("/profile")}
          >
            <AvatarImage src={profileImage} />
            <AvatarFallback>
              {displayName[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email}
            </p>
          </div>
          <SettingsDialog>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Icons.settings className="h-4 w-4" />
            </Button>
          </SettingsDialog>
        </div>
      </div>
    </div>
  )
}