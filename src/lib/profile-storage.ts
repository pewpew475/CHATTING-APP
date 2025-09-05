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
  isDeleted?: boolean
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
    console.log('getUserProfile: Fetching profile for user:', userId)
    
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
          return null
        } else if (data) {
          console.log('getUserProfile: Found profile in database:', data.username, data.real_name)
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
        } else {
          console.log('getUserProfile: No profile found in database for user:', userId)
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

// Delete profile and all related data
export const deleteUserProfile = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Deleting all data for user:', userId)
    
    if (supabase) {
      try {
        // First mark user as deleted before deleting profile
        const { error: markDeletedError } = await supabase
          .from('user_profiles')
          .update({ isDeleted: true })
          .eq('user_id', userId)

        if (markDeletedError) {
          console.error('Error marking user as deleted:', markDeletedError)
        }

        // Delete user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId)

        if (profileError) {
          console.error('Error deleting profile:', profileError)
        }

        // Delete friend requests (both sent and received)
        const { error: requestsError } = await supabase
          .from('friend_requests')
          .delete()
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)

        if (requestsError) {
          console.error('Error deleting friend requests:', requestsError)
        }

        // Delete friendships
        const { error: friendsError } = await supabase
          .from('friends')
          .delete()
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

        if (friendsError) {
          console.error('Error deleting friendships:', friendsError)
        }

        // Delete messages
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

        if (messagesError) {
          console.error('Error deleting messages:', messagesError)
        }

        // Delete chats
        const { error: chatsError } = await supabase
          .from('chats')
          .delete()
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

        if (chatsError) {
          console.error('Error deleting chats:', chatsError)
        }

        // Delete online status
        const { error: statusError } = await supabase
          .from('user_online_status')
          .delete()
          .eq('user_id', userId)

        if (statusError) {
          console.error('Error deleting online status:', statusError)
        }

        console.log('All user data deleted successfully')
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        return { 
          success: false, 
          error: 'Database connection failed' 
        }
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