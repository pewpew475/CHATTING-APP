// Real-time friend management service
import { supabase } from './supabase'

export interface Friend {
  id: string
  username: string
  realName: string
  email: string
  profileImageUrl?: string
  isOnline: boolean
  lastSeen: string
  friendshipCreatedAt: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  username: string
  realName: string
  profileImageUrl?: string
  message?: string
  createdAt: string
  isIncoming: boolean
}

export interface SearchResult {
  id: string
  username: string
  realName: string
  email: string
  profileImageUrl?: string
  isOnline: boolean
  lastSeen: string
  isFriend: boolean
  friendRequestStatus: string
}

export class FriendService {
  // Search for users by username, real name, or email
  static async searchUsers(searchTerm: string, currentUserId: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: currentUserId
      })

      if (error) {
        console.error('Error searching users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  // Send a friend request
  static async sendFriendRequest(fromUserId: string, toUserId: string, message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message: message || null
        })

      if (error) {
        console.error('Error sending friend request:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending friend request:', error)
      return { success: false, error: 'Failed to send friend request' }
    }
  }

  // Accept a friend request
  static async acceptFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        request_id: requestId
      })

      if (error) {
        console.error('Error accepting friend request:', error)
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'Failed to accept friend request' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      return { success: false, error: 'Failed to accept friend request' }
    }
  }

  // Decline a friend request
  static async declineFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)

      if (error) {
        console.error('Error declining friend request:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error declining friend request:', error)
      return { success: false, error: 'Failed to decline friend request' }
    }
  }

  // Get user's friends
  static async getUserFriends(userId: string): Promise<Friend[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_friends', {
        user_uuid: userId
      })

      if (error) {
        console.error('Error getting user friends:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting user friends:', error)
      return []
    }
  }

  // Get user's friend requests
  static async getUserFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_friend_requests', {
        user_uuid: userId
      })

      if (error) {
        console.error('Error getting friend requests:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting friend requests:', error)
      return []
    }
  }

  // Remove a friend
  static async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete both directions of the friendship
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId)

      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', userId)

      if (error1 || error2) {
        console.error('Error removing friend:', error1 || error2)
        return { success: false, error: 'Failed to remove friend' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error removing friend:', error)
      return { success: false, error: 'Failed to remove friend' }
    }
  }

  // Update user online status
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_online_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating online status:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating online status:', error)
      return { success: false, error: 'Failed to update online status' }
    }
  }

  // Subscribe to friend requests changes
  static subscribeToFriendRequests(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('friend_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `or(from_user_id.eq.${userId},to_user_id.eq.${userId})`
        },
        callback
      )
      .subscribe()
  }

  // Subscribe to friends changes
  static subscribeToFriends(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('friends')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `or(user_id.eq.${userId},friend_id.eq.${userId})`
        },
        callback
      )
      .subscribe()
  }

  // Subscribe to online status changes
  static subscribeToOnlineStatus(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('online_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status'
        },
        callback
      )
      .subscribe()
  }
}
