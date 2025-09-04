"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"

interface FriendRequest {
  id: string
  requester: {
    id: string
    username: string
    realName: string
    profilePicture?: string
    isOnline: boolean
  }
  createdAt: Date
}

interface FriendRequestsProps {
  onRequestHandled?: () => void
}

export function FriendRequests({ onRequestHandled }: FriendRequestsProps) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFriendRequests()
  }, [user?.uid])

  const loadFriendRequests = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      // Real friend requests will be loaded from API/database
      const mockRequests: FriendRequest[] = []
      setRequests(mockRequests)
    } catch (error) {
      toast.error("Failed to load friend requests")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Mock accept request - will be replaced with API call
      setRequests(prev => prev.filter(req => req.id !== requestId))
      toast.success("Friend request accepted!")
      
      if (onRequestHandled) {
        onRequestHandled()
      }
    } catch (error) {
      toast.error("Failed to accept friend request")
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      // Mock decline request - will be replaced with API call
      setRequests(prev => prev.filter(req => req.id !== requestId))
      toast.success("Friend request declined")
    } catch (error) {
      toast.error("Failed to decline friend request")
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  if (requests.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icons.userCheck className="h-4 w-4" />
          Friend Requests
          {requests.length > 0 && (
            <Badge variant="default" className="ml-auto text-xs">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-48 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Icons.spinner className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Icons.userCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1 text-sm">No pending requests</h3>
                <p className="text-xs text-muted-foreground">
                  Friend requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-w-0"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.requester.profilePicture} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {request.requester.realName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {request.requester.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{request.requester.realName}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        @{request.requester.username} • {formatTimeAgo(request.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700 h-7 px-2 text-xs"
                      >
                        <Icons.check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(request.id)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 h-7 px-2 text-xs"
                      >
                        <Icons.x className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}