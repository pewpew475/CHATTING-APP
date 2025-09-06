"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/ui/icons"
import { FriendSearch } from "./friend-search"
import { FriendRequests } from "./friend-requests"
import { toast } from "sonner"
import { FriendService, type Friend } from "@/lib/friend-service"

interface FriendsListProps {
  onFriendSelect?: (friend: Friend) => void
  selectedFriendId?: string
}

export function FriendsList({ onFriendSelect, selectedFriendId }: FriendsListProps) {
  const { user } = useAuth()
  const { isUserOnline } = useSocket()
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showRequests, setShowRequests] = useState(false)

  useEffect(() => {
    loadFriends()
  }, [user?.id])

  const loadFriends = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const friends = await FriendService.getUserFriends(user.id)
      setFriends(friends)
    } catch (error) {
      console.error("Error loading friends:", error)
      toast.error("Failed to load friends")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRemoveFriend = async (friendId: string) => {
    try {
      // Mock remove friend - will be replaced with API call
      setFriends(prev => prev.filter(friend => friend.id !== friendId))
      toast.success("Friend removed")
    } catch (error) {
      toast.error("Failed to remove friend")
    }
  }

  const formatLastSeen = (date?: string) => {
    if (!date) return ""
    
    const now = new Date()
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return ""
    const diffInMinutes = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-muted/20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Icons.users className="h-4 w-4 text-white" />
            </div>
            <span className="truncate">Friends</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs bg-primary/10 text-primary border-primary/20">
                {friends.length}
              </Badge>
            )}
          </h2>
          <div className="flex gap-2 flex-shrink-0">
            <FriendSearch onFriendAdded={loadFriends} />
            <Button
              variant={showRequests ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRequests(!showRequests)}
              className="text-xs h-8"
            >
              <Icons.userCheck className="h-3 w-3 mr-1" />
              Requests
            </Button>
          </div>
        </div>
        <div className="relative">
          <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-2 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Friend Requests */}
      {showRequests && (
        <div className="flex-shrink-0 p-3 border-b max-h-64 overflow-hidden">
          <FriendRequests onRequestHandled={loadFriends} />
        </div>
      )}

      {/* Friends List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading friends...</p>
                </div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Icons.users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">
                  {searchQuery ? "No friends found" : "No friends yet"}
                </h3>
                <p className="text-muted-foreground text-sm px-4 max-w-sm mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Add some friends to get started chatting!"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm ${
                      selectedFriendId === friend.id 
                        ? "bg-primary/10 border border-primary/20 shadow-sm" 
                        : "hover:border-border/50"
                    }`}
                    onClick={() => onFriendSelect?.(friend)}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <AvatarImage src={friend.profileImageUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {friend.realName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isUserOnline(friend.id) && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-base">{friend.realName}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {isUserOnline(friend.id) ? (
                              <span className="text-green-600 font-medium">Online</span>
                            ) : friend.lastSeen ? (
                              <span>Last seen {formatLastSeen(friend.lastSeen)}</span>
                            ) : (
                              <span>Offline</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icons.settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onFriendSelect?.(friend)}>
                            <Icons.messageSquare className="h-4 w-4 mr-2" />
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveFriend(friend.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Icons.logout className="h-4 w-4 mr-2" />
                            Remove Friend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}