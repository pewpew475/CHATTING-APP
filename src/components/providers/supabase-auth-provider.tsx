'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { saveUserProfile, getUserProfile } from '@/lib/profile-storage'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (email: string, password: string, userData?: { realName?: string; username?: string }) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state changed:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle user registration/login
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSignIn(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSignIn = async (user: User) => {
    try {
      // Check if user profile exists
      const existingProfile = await getUserProfile(user.id)
      
      if (!existingProfile) {
        // Create basic profile from auth data
        const profileData = {
          userId: user.id,
          email: user.email || '',
          realName: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          username: user.email?.split('@')[0] || 'user',
          profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        }

        await saveUserProfile(profileData)
      }
    } catch (error) {
      console.error('Error handling user sign in:', error)
    }
  }

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in with Google' 
      }
    }
  }

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in' 
      }
    }
  }

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    userData?: { realName?: string; username?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.realName,
            username: userData?.username,
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // If user is created and confirmed, save profile
      if (data.user && !data.user.email_confirmed_at) {
        return { 
          success: true, 
          error: 'Please check your email to confirm your account' 
        }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign up' 
      }
    }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign out' 
      }
    }
  }

  const updateUserProfile = async (updates: { 
    displayName?: string; 
    photoURL?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' }
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.displayName,
          avatar_url: updates.photoURL,
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// Compatibility types for existing code
export type { User }
export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  metadata?: {
    creationTime?: string
    lastSignInTime?: string
  }
}

// Convert Supabase user to app user format for compatibility
export function toAppUser(user: User | null): AppUser | null {
  if (!user) return null
  
  return {
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || null,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    metadata: {
      creationTime: user.created_at,
      lastSignInTime: user.last_sign_in_at || undefined,
    }
  }
}