// Profile storage utilities for managing user profile data
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

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

// Save profile to Firebase Firestore
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
    
    // Save to Firebase Firestore
    try {
      const userRef = doc(db, 'users', merged.userId)
      const dbProfile: Record<string, any> = {
        userId: merged.userId,
        username: merged.username,
        realName: merged.realName,
        email: merged.email,
        updatedAt: serverTimestamp()
      }
      
      if (merged.bio !== undefined) dbProfile.bio = merged.bio
      if (merged.gender !== undefined) dbProfile.gender = merged.gender
      if (merged.mobileNumber !== undefined) dbProfile.mobileNumber = merged.mobileNumber
      if (merged.location !== undefined) dbProfile.location = merged.location
      if (merged.dateOfBirth !== undefined) dbProfile.dateOfBirth = merged.dateOfBirth
      if (merged.profileImageUrl !== undefined) dbProfile.profileImageUrl = merged.profileImageUrl
      if (merged.profileImagePath !== undefined) dbProfile.profileImagePath = merged.profileImagePath

      // Set the document (creates if doesn't exist, updates if exists)
      await setDoc(userRef, dbProfile, { merge: true })
      
      console.log('Profile saved successfully to Firebase')
    } catch (dbError) {
      console.error('Firebase database error:', dbError)
      
      // If it's a network error, provide a more helpful message
      if (dbError instanceof Error && dbError.message.includes('Failed to get document because the client is offline')) {
        return { 
          success: false, 
          error: 'Unable to connect to database. Please check your internet connection.' 
        }
      }
      
      return { 
        success: false, 
        error: 'Database connection failed' 
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

// Get profile from Firebase Firestore
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('getUserProfile: Fetching profile for user:', userId)
    
    // Get from Firebase Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))

      if (!userDoc.exists()) {
        console.log('getUserProfile: No profile found in database for user:', userId)
        return null
      }

      const data = userDoc.data()
      console.log('getUserProfile: Found profile in database:', data.username, data.realName)
      
      // Convert database format to UserProfile format
      const profile: UserProfile = {
        userId: data.userId,
        realName: data.realName,
        username: data.username,
        email: data.email,
        bio: data.bio,
        gender: data.gender,
        mobileNumber: data.mobileNumber,
        location: data.location,
        dateOfBirth: data.dateOfBirth,
        profileImageUrl: data.profileImageUrl,
        profileImagePath: data.profileImagePath,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
      
      return profile
    } catch (dbError) {
      console.error('Firebase database error:', dbError)
      
      // If it's a network error, return null but don't crash the app
      if (dbError instanceof Error && dbError.message.includes('Failed to get document because the client is offline')) {
        console.log('getUserProfile: Client is offline, returning null')
        return null
      }
      
      return null
    }
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
    
    try {
      // Delete user profile
      await deleteDoc(doc(db, 'users', userId))

      // Delete friend requests (both sent and received)
      const requestsQuery1 = query(collection(db, 'friendRequests'), where('fromUserId', '==', userId))
      const requestsQuery2 = query(collection(db, 'friendRequests'), where('toUserId', '==', userId))
      
      const [requests1, requests2] = await Promise.all([
        getDocs(requestsQuery1),
        getDocs(requestsQuery2)
      ])
      
      const deleteRequests = [
        ...requests1.docs.map(doc => deleteDoc(doc.ref)),
        ...requests2.docs.map(doc => deleteDoc(doc.ref))
      ]
      await Promise.all(deleteRequests)

      // Delete friendships
      const friendsQuery1 = query(collection(db, 'friendships'), where('userId', '==', userId))
      const friendsQuery2 = query(collection(db, 'friendships'), where('friendId', '==', userId))
      
      const [friends1, friends2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2)
      ])
      
      const deleteFriends = [
        ...friends1.docs.map(doc => deleteDoc(doc.ref)),
        ...friends2.docs.map(doc => deleteDoc(doc.ref))
      ]
      await Promise.all(deleteFriends)

      // Delete messages
      const messagesQuery1 = query(collection(db, 'messages'), where('senderId', '==', userId))
      const messagesQuery2 = query(collection(db, 'messages'), where('receiverId', '==', userId))
      
      const [messages1, messages2] = await Promise.all([
        getDocs(messagesQuery1),
        getDocs(messagesQuery2)
      ])
      
      const deleteMessages = [
        ...messages1.docs.map(doc => deleteDoc(doc.ref)),
        ...messages2.docs.map(doc => deleteDoc(doc.ref))
      ]
      await Promise.all(deleteMessages)

      // Delete chats
      const chatsQuery1 = query(collection(db, 'chats'), where('participant1', '==', userId))
      const chatsQuery2 = query(collection(db, 'chats'), where('participant2', '==', userId))
      
      const [chats1, chats2] = await Promise.all([
        getDocs(chatsQuery1),
        getDocs(chatsQuery2)
      ])
      
      const deleteChats = [
        ...chats1.docs.map(doc => deleteDoc(doc.ref)),
        ...chats2.docs.map(doc => deleteDoc(doc.ref))
      ]
      await Promise.all(deleteChats)

      console.log('All user data deleted successfully')
    } catch (dbError) {
      console.error('Firebase database error:', dbError)
      return { 
        success: false, 
        error: 'Database connection failed' 
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