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
import { useAuth } from "@/components/providers/firebase-auth-provider"
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
  
  const displayName = userProfile?.realName || user?.displayName || "User"
  const username = userProfile?.username || user?.email?.split('@')[0] || "user"
  const email = user?.email || "user@example.com"
  const profileImage = userProfile?.profileImageUrl || user?.photoURL || ""

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

  const handleFriendSelect = async (friend: { id: string }) => {
    try {
      console.log('Friend selected:', friend.id, 'Current user:', currentUserId)
      
      // Find or create chat with this friend
      const existingChat = chats.find(chat => chat.otherUser?.id === friend.id)
      console.log('Existing chat found:', existingChat)
      
      if (existingChat) {
        console.log('Selecting existing chat:', existingChat.id)
        onChatSelect(existingChat.id)
      } else {
        console.log('Creating new chat...')
        // Create new chat using MessagingService
        const { MessagingService } = await import('@/lib/messaging-service')
        const result = await MessagingService.getOrCreateChat(currentUserId, friend.id)
        
        console.log('Chat creation result:', result)
        
        if (result.success && result.chatId) {
          console.log('Selecting new chat:', result.chatId)
          onChatSelect(result.chatId)
        } else {
          console.error('Failed to create chat:', result.error)
        }
      }
    } catch (error) {
      console.error('Error handling friend selection:', error)
    }
  }

  if (!isOpen) {
    return (
      <div className="w-16 border-r bg-card flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-foreground hover:bg-accent rounded-lg"
        >
          <Icons.messageSquare className="h-5 w-5" />
        </Button>
        <div className="w-8 h-px bg-border" />
        <Avatar 
          className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-primary/20"
          onClick={() => router.push("/profile")}
        >
          <AvatarImage src={profileImage} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {displayName[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-lg font-bold">F</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white truncate">Fellowz</h2>
              <p className="text-xs text-white/70">Connect & Chat</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle} 
            className="text-white hover:bg-white/10 flex-shrink-0 rounded-lg"
          >
            <Icons.x className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-sm h-14 p-2 rounded-2xl border border-white/10">
              <TabsTrigger 
                value="chats" 
                className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-white/25 data-[state=active]:to-white/15 data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 text-sm font-bold h-10 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 data-[state=active]:scale-[1.02] hover:text-white hover:bg-white/10"
              >
                <Icons.messageSquare className="h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-white/25 data-[state=active]:to-white/15 data-[state=active]:shadow-lg data-[state=active]:shadow-white/10 text-sm font-bold h-10 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 data-[state=active]:scale-[1.02] hover:text-white hover:bg-white/10"
              >
                <Icons.users className="h-4 w-4" />
                Friends
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search Input */}
          <div className="relative">
            <Icons.search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 z-10" />
            <Input
              placeholder={activeTab === "chats" ? "Search conversations..." : "Search friends..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border border-white/10 text-white placeholder:text-white/60 focus:bg-white/10 focus:border-white/30 backdrop-blur-sm rounded-xl transition-all duration-300 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "chats" ? (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Icons.messageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery 
                      ? "Try adjusting your search terms" 
                      : "Start a conversation with your friends"
                    }
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm ${
                      selectedChat === chat.id 
                        ? "bg-primary/10 border border-primary/20 shadow-sm" 
                        : "hover:border-border/50"
                    }`}
                    onClick={() => onChatSelect(chat.id)}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                          <AvatarImage src={chat.otherUser?.profileImageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {chat.otherUser?.realName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {chat.otherUser?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate text-base">
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
      <div className="flex-shrink-0 p-4 border-t bg-muted/30">
        <div className="flex items-center space-x-3 min-w-0 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20"
            onClick={() => router.push("/profile")}
          >
            <AvatarImage src={profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {displayName[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email}
            </p>
          </div>
          <SettingsDialog>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0 hover:bg-accent rounded-lg"
            >
              <Icons.settings className="h-4 w-4" />
            </Button>
          </SettingsDialog>
        </div>
      </div>
    </div>
  )
}