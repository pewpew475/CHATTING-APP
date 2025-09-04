// User management utilities for real user discovery and friends system
import { getUserProfile, updateUserProfile } from './profile-storage'

export interface RegisteredUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  username?: string
  realName?: string
  profileImageUrl?: string
  isOnline: boolean
  lastSeen: string
  createdAt: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUser: RegisteredUser
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Friendship {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
}

// Register a new user in the system
export const registerUser = async (user: any): Promise<{ success: boolean; error?: string }> => {
  try {
    const registeredUser: RegisteredUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Anonymous User',
      photoURL: user.photoURL,
      username: user.email?.split('@')[0] || 'user',
      realName: user.displayName || 'Anonymous User',
      profileImageUrl: user.photoURL,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    // Store in localStorage for demo (in production, this would be in a database)
    const existingUsers = getRegisteredUsers()
    const userExists = existingUsers.some(u => u.uid === user.uid)
    
    if (!userExists) {
      existingUsers.push(registeredUser)
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers))
    }

    // Also create/update user profile
    await updateUserProfile(user.uid, {
      realName: registeredUser.realName,
      username: registeredUser.username,
      email: registeredUser.email,
      profileImageUrl: registeredUser.profileImageUrl
    })

    return { success: true }
  } catch (error) {
    console.error('Error registering user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register user' 
    }
  }
}

// Get all registered users
export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const users = localStorage.getItem('registeredUsers')
    return users ? JSON.parse(users) : []
  } catch (error) {
    console.error('Error getting registered users:', error)
    return []
  }
}

// Search for users by name or username
export const searchUsers = async (query: string, currentUserId: string): Promise<RegisteredUser[]> => {
  try {
    const allUsers = getRegisteredUsers()
    const friends = getFriends(currentUserId)
    const friendIds = friends.map(f => f.uid)
    
    // Filter out current user and existing friends
    const searchResults = allUsers.filter(user => 
      user.uid !== currentUserId && 
      !friendIds.includes(user.uid) &&
      (user.realName?.toLowerCase().includes(query.toLowerCase()) ||
       user.username?.toLowerCase().includes(query.toLowerCase()) ||
       user.displayName.toLowerCase().includes(query.toLowerCase()))
    )

    return searchResults.slice(0, 10) // Limit to 10 results
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

// Send friend request
export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const fromUser = getRegisteredUsers().find(u => u.uid === fromUserId)
    if (!fromUser) {
      return { success: false, error: 'User not found' }
    }

    const friendRequest: FriendRequest = {
      id: `${fromUserId}_${toUserId}_${Date.now()}`,
      fromUserId,
      toUserId,
      fromUser,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const existingRequests = getFriendRequests(toUserId)
    
    // Check if request already exists
    const requestExists = existingRequests.some(req => 
      req.fromUserId === fromUserId && req.status === 'pending'
    )
    
    if (requestExists) {
      return { success: false, error: 'Friend request already sent' }
    }

    existingRequests.push(friendRequest)
    localStorage.setItem(`friendRequests_${toUserId}`, JSON.stringify(existingRequests))

    return { success: true }
  } catch (error) {
    console.error('Error sending friend request:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send friend request' 
    }
  }
}

// Get friend requests for a user
export const getFriendRequests = (userId: string): FriendRequest[] => {
  try {
    const requests = localStorage.getItem(`friendRequests_${userId}`)
    return requests ? JSON.parse(requests) : []
  } catch (error) {
    console.error('Error getting friend requests:', error)
    return []
  }
}

// Accept friend request
export const acceptFriendRequest = async (requestId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const requests = getFriendRequests(userId)
    const request = requests.find(r => r.id === requestId)
    
    if (!request) {
      return { success: false, error: 'Friend request not found' }
    }

    // Update request status
    request.status = 'accepted'
    localStorage.setItem(`friendRequests_${userId}`, JSON.stringify(requests))

    // Create friendship
    const friendship: Friendship = {
      id: `${request.fromUserId}_${request.toUserId}`,
      user1Id: request.fromUserId,
      user2Id: request.toUserId,
      createdAt: new Date().toISOString()
    }

    // Add to both users' friends lists
    const user1Friends = getFriendships(request.fromUserId)
    const user2Friends = getFriendships(request.toUserId)
    
    user1Friends.push(friendship)
    user2Friends.push(friendship)
    
    localStorage.setItem(`friendships_${request.fromUserId}`, JSON.stringify(user1Friends))
    localStorage.setItem(`friendships_${request.toUserId}`, JSON.stringify(user2Friends))

    return { success: true }
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to accept friend request' 
    }
  }
}

// Reject friend request
export const rejectFriendRequest = async (requestId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const requests = getFriendRequests(userId)
    const updatedRequests = requests.filter(r => r.id !== requestId)
    localStorage.setItem(`friendRequests_${userId}`, JSON.stringify(updatedRequests))

    return { success: true }
  } catch (error) {
    console.error('Error rejecting friend request:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reject friend request' 
    }
  }
}

// Get friendships for a user
export const getFriendships = (userId: string): Friendship[] => {
  try {
    const friendships = localStorage.getItem(`friendships_${userId}`)
    return friendships ? JSON.parse(friendships) : []
  } catch (error) {
    console.error('Error getting friendships:', error)
    return []
  }
}

// Get friends list for a user
export const getFriends = (userId: string): RegisteredUser[] => {
  try {
    const friendships = getFriendships(userId)
    const allUsers = getRegisteredUsers()
    
    const friends = friendships.map(friendship => {
      const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id
      return allUsers.find(user => user.uid === friendId)
    }).filter(Boolean) as RegisteredUser[]

    return friends
  } catch (error) {
    console.error('Error getting friends:', error)
    return []
  }
}

// Remove friend
export const removeFriend = async (userId: string, friendId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Remove from both users' friendships
    const userFriendships = getFriendships(userId).filter(f => 
      !(f.user1Id === friendId || f.user2Id === friendId)
    )
    const friendFriendships = getFriendships(friendId).filter(f => 
      !(f.user1Id === userId || f.user2Id === userId)
    )
    
    localStorage.setItem(`friendships_${userId}`, JSON.stringify(userFriendships))
    localStorage.setItem(`friendships_${friendId}`, JSON.stringify(friendFriendships))

    return { success: true }
  } catch (error) {
    console.error('Error removing friend:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove friend' 
    }
  }
}

// Update user online status
export const updateUserOnlineStatus = (userId: string, isOnline: boolean): void => {
  try {
    const users = getRegisteredUsers()
    const userIndex = users.findIndex(u => u.uid === userId)
    
    if (userIndex !== -1) {
      users[userIndex].isOnline = isOnline
      users[userIndex].lastSeen = new Date().toISOString()
      localStorage.setItem('registeredUsers', JSON.stringify(users))
    }
  } catch (error) {
    console.error('Error updating user online status:', error)
  }
}