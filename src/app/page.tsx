"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { ChatLayout } from "@/components/chat/chat-layout"
import { getUserProfile, hasCompletedProfileSync } from "@/lib/profile-storage"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if user needs to complete registration (Supabase-compatible)
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (user && !loading && isClient) {
        try {
          // Check if user has completed their profile
          const profileCompleted = hasCompletedProfileSync(user.id)
          
          if (!profileCompleted) {
            console.log('Profile not completed, redirecting to setup-profile')
            router.push('/setup-profile')
            return
          }
          
          console.log('Profile completed, user can access main app')
        } catch (error) {
          console.error('Error checking profile completion:', error)
          // If there's an error, redirect to setup profile to be safe
          router.push('/setup-profile')
        }
      }
    }

    checkProfileCompletion()
  }, [user?.id, loading, isClient, router])

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleGetStarted = () => {
    router.push('/auth/signup')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Icons.spinner className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        {/* Animated Background Elements (pointer-events disabled to not block clicks) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8 relative">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-1 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">F</span>
                  </div>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                Fellowz
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 font-light">
                Connect. Chat. Build Friendships.
              </p>
            </div>

            {/* Description */}
            <div className="mb-12 space-y-6">
              <p className="text-lg text-purple-100 leading-relaxed max-w-2xl mx-auto">
                Experience the future of real-time messaging with Fellowz. Connect with friends and family through seamless conversations, share moments instantly, and build lasting relationships in a beautifully designed digital space.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.messageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Real-time Chat</h3>
                  <p className="text-purple-100 text-sm">Instant messaging with typing indicators and read receipts</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.user className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Friend Network</h3>
                  <p className="text-purple-100 text-sm">Find friends, send requests, and build your community</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icons.paperclip className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Share Files</h3>
                  <p className="text-purple-100 text-sm">Share photos, videos, and documents instantly</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleSignIn} 
                size="lg"
                className="bg-black border border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3 text-lg transition-all duration-300"

              >
                Sign in to Fellowz
                <Icons.send className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={handleGetStarted} 
                variant="outline" 
                size="lg"
                className="bg-black border border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3 text-lg transition-all duration-300"
              >
                Get Started
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-purple-200 text-sm">
                Join thousands of users already connecting on Fellowz
              </p>
              <div className="flex justify-center items-center mt-4 space-x-6 text-purple-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">100% Free</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">No Ads</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    )
  }

  return <ChatLayout />
}