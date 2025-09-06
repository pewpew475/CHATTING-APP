"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
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

    const email = searchQuery.trim()
    const isEmail = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email)
    if (!isEmail) {
      toast.error("Please enter a valid email")
      return
    }

    setIsLoading(true)
    try {
      const results = await FriendService.findUserByEmail(email, user.id)
      setSearchResults(results)
      
      if (results.length === 0) {
        toast.info("No user found with that email")
      }
    } catch (error) {
      toast.error("Failed to search for user")
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
        <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
          <Icons.userPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Icons.userPlus className="h-4 w-4 text-white" />
            </div>
            Find Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter friend's email address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11 border-2 focus:border-primary/50"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !searchQuery.trim()} 
              size="default"
              className="h-11 px-6 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Icons.search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[400px]">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-6">
                    <Icons.users className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">
                    {searchQuery ? "No users found" : "Find new friends"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                    {searchQuery 
                      ? "We couldn't find anyone with that email address. Make sure the email is correct and the user has an account." 
                      : "Search for users by their email address to send a friend request and start chatting."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="group flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card hover:bg-accent/30 hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {user.realName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate mb-1">{user.realName}</h4>
                        <p className="text-sm text-muted-foreground truncate mb-2">@{user.username}</p>
                        {user.isOnline && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                            Online
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSendFriendRequest(user.id)}
                        disabled={user.isFriend || user.friendRequestStatus === 'pending' || pendingRequests.has(user.id)}
                        className="flex-shrink-0 h-9 px-4"
                        variant={user.isFriend ? "secondary" : "default"}
                      >
                        {user.isFriend ? (
                          <>
                            <Icons.check className="h-4 w-4 mr-2" />
                            Friends
                          </>
                        ) : user.friendRequestStatus === 'pending' || pendingRequests.has(user.id) ? (
                          <>
                            <Icons.refresh className="h-4 w-4 mr-2" />
                            Requested
                          </>
                        ) : (
                          <>
                            <Icons.userPlus className="h-4 w-4 mr-2" />
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