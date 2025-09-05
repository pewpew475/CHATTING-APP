'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { saveUserProfile, getUserProfile, deleteUserProfile } from '@/lib/profile-storage'

interface AuthContextType {
  user: (User & { id: string }) | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (email: string, password: string, userData?: { realName?: string; username?: string }) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  deleteAccount: () => Promise<{ success: boolean; error?: string }>
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle redirect result first
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('Redirect authentication successful:', result.user?.email)
        }
      } catch (error) {
        console.error('Error handling redirect result:', error)
      }
    }

    handleRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Firebase auth state changed:', user?.email)
      
      // Add id property for compatibility with existing code
      const userWithId = user ? { ...user, id: user.uid } : null
      setUser(userWithId)
      setLoading(false)

      // Handle user registration/login
      if (user) {
        await handleUserSignIn(user)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleUserSignIn = async (user: User) => {
    try {
      console.log('Handling user sign in for:', user.uid, user.email)
      
      // Check if user profile exists
      const existingProfile = await getUserProfile(user.uid)
      console.log('Existing profile found:', !!existingProfile)
      
      if (!existingProfile) {
        console.log('No existing profile found - creating new profile for user')
        // Create a new profile for the user
        const profileData = {
          userId: user.uid,
          email: user.email || '',
          realName: user.displayName || 'User',
          username: user.displayName?.toLowerCase().replace(/\s+/g, '') || user.email?.split('@')[0] || 'user',
          profileImageUrl: user.photoURL || getRandomAvatar(),
        }

        const result = await saveUserProfile(profileData)
        if (result.success) {
          console.log('Profile created successfully for new user')
        } else {
          console.error('Failed to create profile:', result.error)
        }
      } else {
        console.log('Profile exists, user is authenticated')
        // Profile exists and user is authenticated
      }

      // Set user as online when they sign in
      try {
        const { FriendService } = await import('@/lib/friend-service')
        await FriendService.updateOnlineStatus(user.uid, true)
        console.log('User online status updated to true')
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    } catch (error) {
      console.error('Error handling user sign in:', error)
      // If there's an error, don't sign out - just log the error
      console.log('Error handling user sign in, but continuing')
    }
  }

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      }
    }
  }

  // Helper function to detect Edge browser
  const isEdgeBrowser = (): boolean => {
    if (typeof window === 'undefined') return false
    return /Edg\//.test(navigator.userAgent) || /Edge\//.test(navigator.userAgent)
  }

  // Helper function to detect Firefox browser
  const isFirefoxBrowser = (): boolean => {
    if (typeof window === 'undefined') return false
    return /Firefox\//.test(navigator.userAgent)
  }

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider()
      
      // Try popup first, fallback to redirect if popup fails
      try {
        console.log('Attempting popup authentication')
        const result = await signInWithPopup(auth, provider)
        console.log('Popup authentication successful:', result.user.email)
        return { success: true }
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect:', popupError.message)
        
        // If popup fails (e.g., blocked by browser), use redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('popup')) {
          console.log('Using redirect authentication for reliable cross-browser compatibility')
          await signInWithRedirect(auth, provider)
          return { success: true }
        }
        
        // Re-throw other errors
        throw popupError
      }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign in with Google' 
      }
    }
  }

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    userData?: { realName?: string; username?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update user profile with display name
      if (userData?.realName) {
        await updateProfile(user, {
          displayName: userData.realName,
          photoURL: getRandomAvatar()
        })
      }

      return { success: true }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign up' 
      }
    }
  }

  const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Signing out user:', user?.uid)
      
      // Set user as offline before signing out
      if (user?.uid) {
        try {
          const { FriendService } = await import('@/lib/friend-service')
          await FriendService.updateOnlineStatus(user.uid, false)
          console.log('User online status updated to false')
        } catch (error) {
          console.error('Error updating offline status:', error)
        }
      }
      
      await signOut(auth)
      console.log('User signed out successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Sign out error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      }
    }
  }

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' }
      }

      console.log('Deleting account for user:', user.uid)

      // First delete all user data from database
      const profileResult = await deleteUserProfile(user.uid)
      if (!profileResult.success) {
        console.warn('Failed to delete profile data:', profileResult.error)
        return { success: false, error: profileResult.error || 'Failed to delete user data' }
      }

      // Delete the Firebase user account
      await deleteUser(user)

      console.log('Account deleted successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Delete account error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to delete account' 
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

      await updateProfile(user, {
        displayName: updates.displayName,
        photoURL: updates.photoURL || getRandomAvatar()
      })

      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      }
    }
  }

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut: signOutUser,
    deleteAccount,
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
    throw new Error('useAuth must be used within a FirebaseAuthProvider')
  }
  return context
}

// Gender-neutral avatar generator using DiceBear
const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=7&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=8&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=9&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=10&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=11&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=12&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=13&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=14&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=15&style=circle&backgroundColor=transparent&hairColor=262e&skinColor=fdbcb4&accessoriesProbability=0&facialHairProbability=0&clothingColor=262e&eyeColor=4a90e2&eyebrowColor=4a90e2&mouthColor=c9b037',
]

export function getRandomAvatar(): string {
  return avatars[Math.floor(Math.random() * avatars.length)]
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

// Convert Firebase user to app user format for compatibility
export function toAppUser(user: User | null): AppUser | null {
  if (!user) return null
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    metadata: {
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    }
  }
}
