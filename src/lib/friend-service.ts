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

  // Find a single user by exact email
  static async findUserByEmail(email: string, currentUserId: string): Promise<SearchResult[]> {
    try {
      // Find profile by email
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, username, real_name, email, profile_image_url')
        .ilike('email', email)
        .limit(1)

      if (profileError) {
        console.error('Error finding user by email:', profileError)
        return []
      }

      if (!profiles || profiles.length === 0) {
        return []
      }

      const profile = profiles[0] as any
      const targetUserId = profile.user_id as string
      if (targetUserId === currentUserId) {
        return []
      }

      // Determine friendship status
      const { data: friendsA } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('friend_id', targetUserId)
        .limit(1)

      const { data: friendsB } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('friend_id', currentUserId)
        .limit(1)

      const isFriend = Boolean((friendsA && friendsA.length > 0) || (friendsB && friendsB.length > 0))

      // Determine pending request status
      const { data: outgoingReq } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('from_user_id', currentUserId)
        .eq('to_user_id', targetUserId)
        .in('status', ['pending'])
        .limit(1)

      const { data: incomingReq } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', currentUserId)
        .in('status', ['pending'])
        .limit(1)

      let friendRequestStatus = 'none'
      if (outgoingReq && outgoingReq.length > 0) friendRequestStatus = 'pending'
      if (incomingReq && incomingReq.length > 0) friendRequestStatus = 'incoming'

      const result: SearchResult = {
        id: targetUserId,
        username: profile.username,
        realName: profile.real_name,
        email: profile.email,
        profileImageUrl: profile.profile_image_url || undefined,
        isOnline: false,
        lastSeen: '',
        isFriend,
        friendRequestStatus,
      }

      return [result]
    } catch (error) {
      console.error('Error finding user by email:', error)
      return []
    }
  }

  // Send a friend request
  static async sendFriendRequest(fromUserId: string, toUserId: string, message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending friend request from:', fromUserId, 'to:', toUserId)
      
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message: message || null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error sending friend request:', error)
        return { success: false, error: error.message }
      }

      console.log('Friend request sent successfully:', data)
      return { success: true }
    } catch (error) {
      console.error('Error sending friend request:', error)
      return { success: false, error: 'Failed to send friend request' }
    }
  }

  // Accept a friend request
  static async acceptFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Accepting friend request:', requestId)
      
      // First get the request details
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single()

      if (requestError || !request) {
        console.error('Error getting friend request:', requestError)
        return { success: false, error: 'Friend request not found' }
      }

      // Create friendship in both directions
      const { error: friend1Error } = await supabase
        .from('friends')
        .insert({
          user_id: request.from_user_id,
          friend_id: request.to_user_id,
          created_at: new Date().toISOString()
        })

      const { error: friend2Error } = await supabase
        .from('friends')
        .insert({
          user_id: request.to_user_id,
          friend_id: request.from_user_id,
          created_at: new Date().toISOString()
        })

      if (friend1Error || friend2Error) {
        console.error('Error creating friendship:', friend1Error || friend2Error)
        return { success: false, error: 'Failed to create friendship' }
      }

      // Update request status to accepted
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating request status:', updateError)
        // Don't fail the whole operation if status update fails
      }

      console.log('Friend request accepted successfully')
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
      console.log('Loading friend requests for user:', userId)
      
      // Get incoming friend requests
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          created_at,
          status,
          from_user:user_profiles!friend_requests_from_user_id_fkey(
            user_id,
            username,
            real_name,
            profile_image_url
          )
        `)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (incomingError) {
        console.error('Error getting incoming friend requests:', incomingError)
        return []
      }

      console.log('Incoming friend requests:', incomingRequests)

      const requests: FriendRequest[] = (incomingRequests || []).map((req: any) => ({
        id: req.id,
        fromUserId: req.from_user_id,
        toUserId: req.to_user_id,
        username: req.from_user?.username || 'Unknown',
        realName: req.from_user?.real_name || 'Unknown User',
        profileImageUrl: req.from_user?.profile_image_url,
        message: req.message,
        createdAt: req.created_at,
        isIncoming: true
      }))

      return requests
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
