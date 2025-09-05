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
    
    // Merge with existing to avoid overwriting fields with null/undefined
    const merged: UserProfile = {
      userId: profileData.userId,
      realName: profileData.realName ?? existingProfile?.realName ?? '',
      username: profileData.username ?? existingProfile?.username ?? '',
      email: profileData.email ?? existingProfile?.email ?? '',
      bio: profileData.bio ?? existingProfile?.bio,
      gender: profileData.gender ?? existingProfile?.gender,
      mobileNumber: profileData.mobileNumber ?? existingProfile?.mobileNumber,
      location: profileData.location ?? existingProfile?.location,
      dateOfBirth: profileData.dateOfBirth ?? existingProfile?.dateOfBirth,
      profileImageUrl: profileData.profileImageUrl ?? existingProfile?.profileImageUrl,
      profileImagePath: profileData.profileImagePath ?? existingProfile?.profileImagePath,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now
    }
    
    // Profile will be saved to database only
    
    // Save to Supabase database
    if (supabase) {
      try {
        const dbProfile: Record<string, any> = {
          user_id: merged.userId,
          username: merged.username,
          real_name: merged.realName,
          email: merged.email,
          updated_at: merged.updatedAt
        }
        if (merged.bio !== undefined) dbProfile.bio = merged.bio
        if (merged.gender !== undefined) dbProfile.gender = merged.gender
        if (merged.mobileNumber !== undefined) dbProfile.mobile_number = merged.mobileNumber
        if (merged.location !== undefined) dbProfile.location = merged.location
        if (merged.dateOfBirth !== undefined) dbProfile.date_of_birth = merged.dateOfBirth
        if (merged.profileImageUrl !== undefined) dbProfile.profile_image_url = merged.profileImageUrl
        if (merged.profileImagePath !== undefined) dbProfile.profile_image_path = merged.profileImagePath

        const { error } = await supabase
          .from('user_profiles')
          .upsert(dbProfile, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          })

        if (error) {
          console.error('Database error saving profile:', error)
          // Database save failed
          if (error.code === 'PGRST205') {
            console.warn('user_profiles table not found. Please run the database setup.')
          }
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        // Database connection failed
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
          
          return profile
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
      }
    }
    
    // No fallback - return null if database is not available
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Synchronous version for backward compatibility - now always returns null
// Use async getUserProfile for database access
export const getUserProfileSync = (userId: string): UserProfile | null => {
  // Always return null to force async database lookup
  return null
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

// Get profile completion percentage (async version)
export const getProfileCompletionPercentageAsync = async (userId: string): Promise<number> => {
  const profile = await getUserProfile(userId)
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

// Get profile completion percentage (sync version for backward compatibility)
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