"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { FriendService, type SearchResult } from "@/lib/friend-service"

interface FriendSearchProps {
  onFriendAdded?: () => void
}

export function FriendSearch({ onFriendAdded }: FriendSearchProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return

    setIsLoading(true)
    try {
      const results = await FriendService.searchUsers(searchQuery, user.id)
      setSearchResults(results)
      
      if (results.length === 0) {
        toast.info("No users found matching your search")
      }
    } catch (error) {
      toast.error("Failed to search for users")
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return

    try {
      const result = await FriendService.sendFriendRequest(user.id, userId)
      
      if (result.success) {
        setPendingRequests(prev => new Set([...prev, userId]))
        toast.success("Friend request sent!")
        
        // Update search results to show pending status
        setSearchResults(prev => prev.map(u => 
          u.id === userId ? { ...u, friendRequestStatus: 'pending' } : u
        ))
        
        if (onFriendAdded) {
          onFriendAdded()
        }
      } else {
        toast.error(result.error || "Failed to send friend request")
      }
    } catch (error) {
      toast.error("Failed to send friend request")
      console.error("Friend request error:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icons.user className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Icons.userPlus className="h-5 w-5" />
            Find Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} size="default">
              {isLoading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[400px]">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Icons.users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {searchQuery ? "No users found" : "Find new friends"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery 
                      ? "Try searching with a different name or username" 
                      : "Search for users by their name or username to send friend requests"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.realName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base truncate">{user.realName}</h4>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        {user.isOnline && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSendFriendRequest(user.id)}
                        disabled={user.isFriend || user.friendRequestStatus === 'pending' || pendingRequests.has(user.id)}
                        className="flex-shrink-0"
                      >
                        {user.isFriend ? (
                          <>
                            <Icons.check className="h-4 w-4 mr-1" />
                            Friends
                          </>
                        ) : user.friendRequestStatus === 'pending' || pendingRequests.has(user.id) ? (
                          <>
                            <Icons.refresh className="h-4 w-4 mr-1" />
                            Requested
                          </>
                        ) : (
                          <>
                            <Icons.userPlus className="h-4 w-4 mr-1" />
                            Add Friend
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}