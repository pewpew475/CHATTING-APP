"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
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
      <div className="flex-shrink-0 p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 min-w-0">
            <Icons.users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Friends</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {friends.length}
              </Badge>
            )}
          </h2>
          <div className="flex gap-1 flex-shrink-0">
            <FriendSearch onFriendAdded={loadFriends} />
            <Button
              variant={showRequests ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRequests(!showRequests)}
              className="text-xs"
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
            className="pl-10 h-9"
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
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <Icons.user className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-sm px-4">
                  {searchQuery ? "No friends found" : "No friends yet. Add some friends to get started!"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                      selectedFriendId === friend.id ? "bg-accent" : ""
                    }`}
                    onClick={() => onFriendSelect?.(friend)}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.profileImageUrl} />
                            <AvatarFallback className="text-xs">
                              {friend.realName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm">{friend.realName}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.isOnline ? (
                              <span className="text-green-600">Online</span>
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
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                            <Icons.settings className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onFriendSelect?.(friend)}>
                            <Icons.messageSquare className="h-4 w-4 mr-2" />
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveFriend(friend.id)}
                            className="text-red-600"
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