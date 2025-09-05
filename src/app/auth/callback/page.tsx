'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/firebase-auth-provider'
import { hasCompletedProfile } from '@/lib/profile-storage'

export default function AuthCallback() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (loading) return

      if (user) {
        // Successfully authenticated, check if profile is completed (async)
        const profileCompleted = await hasCompletedProfile(user.id)
        
        if (profileCompleted) {
          router.push('/')
        } else {
          // Profile completion now handled via a popup on home
          router.push('/')
        }
      } else {
        // No user, redirect to sign in
        router.push('/auth/signin')
      }
    }

    handleAuthCallback()
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}