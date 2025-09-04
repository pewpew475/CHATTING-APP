// Profile storage utilities for managing user profile data
import { supabase } from './supabase'

export interface UserProfile {
  userId: string
  realName: string
  username: string
  email: string
  bio?: string
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"
  mobileNumber?: string
  location?: string
  dateOfBirth?: string
  profileImageUrl?: string
  profileImagePath?: string
  createdAt: string
  updatedAt: string
}

// Save profile to localStorage (for demo) and to database
export const saveUserProfile = async (profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string }> => {
  try {
    const now = new Date().toISOString()
    const existingProfile = await getUserProfile(profileData.userId)
    
    const profile: UserProfile = {
      ...profileData,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now
    }
    
    // Save to localStorage with user-specific key (for offline access)
    localStorage.setItem(`userProfile_${profileData.userId}`, JSON.stringify(profile))
    
    // Save to Supabase database
    if (supabase) {
      try {
        const dbProfile = {
          user_id: profile.userId,
          username: profile.username,
          real_name: profile.realName,
          email: profile.email,
          bio: profile.bio || null,
          gender: profile.gender || null,
          mobile_number: profile.mobileNumber || null,
          location: profile.location || null,
          date_of_birth: profile.dateOfBirth || null,
          profile_image_url: profile.profileImageUrl || null,
          profile_image_path: profile.profileImagePath || null,
          updated_at: profile.updatedAt
        }

        const { error } = await supabase
          .from('user_profiles')
          .upsert(dbProfile, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          })

        if (error) {
          console.error('Database error saving profile:', error)
          // Don't fail completely if database save fails, localStorage is still saved
          if (error.code === 'PGRST205') {
            console.warn('user_profiles table not found. Please run the database setup.')
          }
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        // Continue with localStorage save even if database fails
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error saving user profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save profile' 
    }
  }
}

// Get profile from localStorage and database
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // First try to get from database
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          console.error('Database error getting profile:', error)
          if (error.code === 'PGRST205') {
            console.warn('user_profiles table not found. Please run the database setup.')
          }
        } else if (data) {
          // Convert database format to UserProfile format
          const profile: UserProfile = {
            userId: data.user_id,
            realName: data.real_name,
            username: data.username,
            email: data.email,
            bio: data.bio,
            gender: data.gender,
            mobileNumber: data.mobile_number,
            location: data.location,
            dateOfBirth: data.date_of_birth,
            profileImageUrl: data.profile_image_url,
            profileImagePath: data.profile_image_path,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          }
          
          // Update localStorage with database data
          localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile))
          return profile
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
      }
    }
    
    // Fallback to localStorage
    const profileData = localStorage.getItem(`userProfile_${userId}`)
    if (!profileData) return null
    
    const profile = JSON.parse(profileData) as UserProfile
    return profile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Synchronous version for backward compatibility
export const getUserProfileSync = (userId: string): UserProfile | null => {
  try {
    // First check localStorage
    const profileData = localStorage.getItem(`userProfile_${userId}`)
    if (profileData) {
      const profile = JSON.parse(profileData) as UserProfile
      return profile
    }
    
    // If not in localStorage, return null (will trigger profile completion)
    // The async getUserProfile will handle database lookup when needed
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Update specific profile fields
export const updateUserProfile = async (userId: string, updates: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error?: string }> => {
  try {
    const existingProfile = await getUserProfile(userId)
    const now = new Date().toISOString()
    
    let updatedProfile: UserProfile
    
    if (!existingProfile) {
      // Create new profile if none exists
      updatedProfile = {
        userId,
        realName: updates.realName || '',
        username: updates.username || '',
        email: updates.email || '',
        bio: updates.bio,
        gender: updates.gender,
        mobileNumber: updates.mobileNumber,
        location: updates.location,
        dateOfBirth: updates.dateOfBirth,
        profileImageUrl: updates.profileImageUrl,
        profileImagePath: updates.profileImagePath,
        createdAt: now,
        updatedAt: now
      }
    } else {
      // Update existing profile
      updatedProfile = {
        ...existingProfile,
        ...updates,
        updatedAt: now
      }
    }
    
    return await saveUserProfile(updatedProfile)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}

// Delete profile
export const deleteUserProfile = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.removeItem(`userProfile_${userId}`)
    
    // Delete from Supabase database
    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId)

        if (error) {
          console.error('Database error deleting profile:', error)
          if (error.code === 'PGRST205') {
            console.warn('user_profiles table not found. Please run the database setup.')
          }
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        // Continue even if database delete fails
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting user profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete profile' 
    }
  }
}

// Check if user has completed profile
export const hasCompletedProfile = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId)
  if (!profile) return false
  
  // Check if essential fields are filled
  return !!(
    profile.realName &&
    profile.username &&
    profile.email
  )
}

// Synchronous version for backward compatibility
export const hasCompletedProfileSync = (userId: string): boolean => {
  const profile = getUserProfileSync(userId)
  if (!profile) return false
  
  // Check if essential fields are filled and not empty
  return !!(
    profile.realName && profile.realName.trim() !== '' &&
    profile.username && profile.username.trim() !== '' &&
    profile.email && profile.email.trim() !== ''
  )
}

// Get profile completion percentage
export const getProfileCompletionPercentage = (userId: string): number => {
  const profile = getUserProfileSync(userId)
  if (!profile) return 0
  
  const fields = [
    'realName',
    'username', 
    'email',
    'bio',
    'gender',
    'mobileNumber',
    'location',
    'dateOfBirth',
    'profileImageUrl'
  ]
  
  const completedFields = fields.filter(field => {
    const value = profile[field as keyof UserProfile]
    return value && value.toString().trim() !== ''
  })
  
  return Math.round((completedFields.length / fields.length) * 100)
}