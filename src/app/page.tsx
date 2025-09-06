"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { ChatLayout } from "@/components/chat/chat-layout"
import { getUserProfile } from "@/lib/profile-storage"
import { ProfileCompletionDialog } from "@/components/profile/profile-completion-dialog"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Handle client-side hydration
  useEffect(() => {
    console.log('Home: Setting isClient to true')
    setIsClient(true)
  }, [])

  // Debug user state changes
  useEffect(() => {
    console.log('Home: User state changed - user:', user?.id, 'loading:', loading, 'isClient:', isClient)
  }, [user, loading, isClient])

  // Remove redirect-based profile setup. A lightweight dialog will handle completion.
  useEffect(() => {
    // No redirect; dialog mounts when needed.
  }, [user?.id, loading, isClient])

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleGetStarted = () => {
    router.push('/auth/signup')
  }

  if (loading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_50%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8 relative">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground text-3xl font-bold">F</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
                Fellowz
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 font-light">
                Connect. Chat. Build Friendships.
              </p>
            </div>

            {/* Description */}
            <div className="mb-12 space-y-6">
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Experience the future of real-time messaging with Fellowz. Connect with friends and family through seamless conversations, share moments instantly, and build lasting relationships in a beautifully designed digital space.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.messageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-2 text-sm">Real-time Chat</h3>
                  <p className="text-muted-foreground text-xs">Instant messaging with typing indicators and read receipts</p>
                </div>
                
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.user className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-2 text-sm">Friend Network</h3>
                  <p className="text-muted-foreground text-xs">Find friends, send requests, and build your community</p>
                </div>
                
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.paperclip className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-2 text-sm">Share Files</h3>
                  <p className="text-muted-foreground text-xs">Share photos, videos, and documents instantly</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                onClick={handleSignIn} 
                size="lg"
                className="w-full sm:w-auto font-semibold px-8 py-3 text-base"
              >
                Sign in to Fellowz
                <Icons.send className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={handleGetStarted} 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto font-semibold px-8 py-3 text-base"
              >
                Get Started
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground text-sm">
                Join thousands of users already connecting on Fellowz
              </p>
              <div className="flex justify-center items-center mt-4 space-x-6 text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs">100% Free</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs">No Ads</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ChatLayout />
      {/* Show small completion popup for new users */}
      <ProfileCompletionDialog />
    </>
  )
}