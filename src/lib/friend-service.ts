// Real-time friend management service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { io } from 'socket.io-client'

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
      // Search in users collection by email
      const searchLower = searchTerm.toLowerCase()
      
      const q = query(
        collection(db, 'users'),
        where('email', '==', searchLower),
        limit(10)
      )

      const snapshot = await getDocs(q)
      const results: SearchResult[] = []

      for (const docSnapshot of snapshot.docs) {
        const userData = docSnapshot.data()
        const userId = docSnapshot.id

        if (userId === currentUserId) continue

        // Check if already friends
        const friendsQuery = query(
          collection(db, 'friendships'),
          where('userId', '==', currentUserId),
          where('friendId', '==', userId)
        )
        const friendsSnapshot = await getDocs(friendsQuery)
        const isFriend = !friendsSnapshot.empty

        // Check for pending friend requests
        const outgoingQuery = query(
          collection(db, 'friendRequests'),
          where('fromUserId', '==', currentUserId),
          where('toUserId', '==', userId),
          where('status', '==', 'pending')
        )
        const incomingQuery = query(
          collection(db, 'friendRequests'),
          where('fromUserId', '==', userId),
          where('toUserId', '==', currentUserId),
          where('status', '==', 'pending')
        )

        const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
          getDocs(outgoingQuery),
          getDocs(incomingQuery)
        ])

        let friendRequestStatus = 'none'
        if (!outgoingSnapshot.empty) friendRequestStatus = 'pending'
        if (!incomingSnapshot.empty) friendRequestStatus = 'incoming'

        results.push({
          id: userId,
          username: userData.username,
          realName: userData.realName,
          email: userData.email,
          profileImageUrl: userData.profileImageUrl,
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen?.toDate?.()?.toISOString() || '',
          isFriend,
          friendRequestStatus
        })
      }

      return results
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  // Find a single user by exact email
  static async findUserByEmail(email: string, currentUserId: string): Promise<SearchResult[]> {
    try {
      // Find profile by email
      const q = query(
        collection(db, 'users'),
        where('email', '==', email),
        limit(1)
      )

      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return []
      }

      const docSnapshot = snapshot.docs[0]
      const userData = docSnapshot.data()
      const targetUserId = docSnapshot.id

      if (targetUserId === currentUserId) {
        return []
      }

      // Determine friendship status
      const friendsQuery1 = query(
        collection(db, 'friendships'),
        where('userId', '==', currentUserId),
        where('friendId', '==', targetUserId)
      )
      const friendsQuery2 = query(
        collection(db, 'friendships'),
        where('userId', '==', targetUserId),
        where('friendId', '==', currentUserId)
      )

      const [friendsSnapshot1, friendsSnapshot2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2)
      ])

      const isFriend = !friendsSnapshot1.empty || !friendsSnapshot2.empty

      // Determine pending request status
      const outgoingQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', targetUserId),
        where('status', '==', 'pending')
      )
      const incomingQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', targetUserId),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      )

      const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
        getDocs(outgoingQuery),
        getDocs(incomingQuery)
      ])

      let friendRequestStatus = 'none'
      if (!outgoingSnapshot.empty) friendRequestStatus = 'pending'
      if (!incomingSnapshot.empty) friendRequestStatus = 'incoming'

      const result: SearchResult = {
        id: targetUserId,
        username: userData.username,
        realName: userData.realName,
        email: userData.email,
        profileImageUrl: userData.profileImageUrl,
        isOnline: userData.isOnline || false,
        lastSeen: userData.lastSeen?.toDate?.()?.toISOString() || '',
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
      
      const requestData = {
        fromUserId,
        toUserId,
        message: message || null,
        status: 'pending',
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'friendRequests'), requestData)

      // Emit real-time event via Socket.IO
      const socket = io({ path: '/api/socketio' })
      socket.emit('send_friend_request', {
        requestId: docRef.id,
        fromUserId,
        toUserId,
        message: message || null,
        status: 'pending',
        createdAt: new Date()
      })
      socket.disconnect()

      console.log('Friend request sent successfully')
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
      const requestDoc = await getDoc(doc(db, 'friendRequests', requestId))
      
      if (!requestDoc.exists()) {
        console.error('Friend request not found')
        return { success: false, error: 'Friend request not found' }
      }

      const requestData = requestDoc.data()
      if (requestData.status !== 'pending') {
        return { success: false, error: 'Friend request is not pending' }
      }

      // Create friendship in both directions
      const friendship1 = {
        userId: requestData.fromUserId,
        friendId: requestData.toUserId,
        createdAt: serverTimestamp()
      }

      const friendship2 = {
        userId: requestData.toUserId,
        friendId: requestData.fromUserId,
        createdAt: serverTimestamp()
      }

      await Promise.all([
        addDoc(collection(db, 'friendships'), friendship1),
        addDoc(collection(db, 'friendships'), friendship2)
      ])

      // Update request status to accepted
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' })

      // Emit real-time event via Socket.IO
      const socket = io({ path: '/api/socketio' })
      socket.emit('friend_request_accepted', {
        requestId,
        fromUserId: requestData.fromUserId,
        toUserId: requestData.toUserId,
        status: 'accepted',
        createdAt: new Date()
      })
      socket.disconnect()

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
      // First get the request details for Socket.IO
      const requestDoc = await getDoc(doc(db, 'friendRequests', requestId))
      const requestData = requestDoc.data()
      
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' })

      // Emit real-time event via Socket.IO
      const socket = io({ path: '/api/socketio' })
      socket.emit('friend_request_rejected', {
        requestId,
        fromUserId: requestData?.fromUserId,
        toUserId: requestData?.toUserId,
        status: 'declined',
        createdAt: new Date()
      })
      socket.disconnect()

      return { success: true }
    } catch (error) {
      console.error('Error declining friend request:', error)
      return { success: false, error: 'Failed to decline friend request' }
    }
  }

  // Get user's friends
  static async getUserFriends(userId: string): Promise<Friend[]> {
    try {
      const q = query(
        collection(db, 'friendships'),
        where('userId', '==', userId)
      )

      const snapshot = await getDocs(q)
      const friends: Friend[] = []

      for (const docSnapshot of snapshot.docs) {
        const friendshipData = docSnapshot.data()
        const friendId = friendshipData.friendId

        // Get friend's profile
        const friendDoc = await getDoc(doc(db, 'users', friendId))
        if (friendDoc.exists()) {
          const friendData = friendDoc.data()
          friends.push({
            id: friendId,
            username: friendData.username,
            realName: friendData.realName,
            email: friendData.email,
            profileImageUrl: friendData.profileImageUrl,
            isOnline: friendData.isOnline || false,
            lastSeen: friendData.lastSeen?.toDate?.()?.toISOString() || '',
            friendshipCreatedAt: friendshipData.createdAt?.toDate?.()?.toISOString() || ''
          })
        }
      }

      return friends
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
      const q = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      )

      const snapshot = await getDocs(q)
      const requests: FriendRequest[] = []

      for (const docSnapshot of snapshot.docs) {
        const requestData = docSnapshot.data()
        
        // Get sender's profile
        const senderDoc = await getDoc(doc(db, 'users', requestData.fromUserId))
        if (senderDoc.exists()) {
          const senderData = senderDoc.data()
          requests.push({
            id: docSnapshot.id,
            fromUserId: requestData.fromUserId,
            toUserId: requestData.toUserId,
            username: senderData.username,
            realName: senderData.realName,
            profileImageUrl: senderData.profileImageUrl,
            message: requestData.message,
            createdAt: requestData.createdAt?.toDate?.()?.toISOString() || '',
            isIncoming: true
          })
        }
      }

      // Sort by creation date (newest first) on the client side
      requests.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })

      console.log('Incoming friend requests:', requests)
      return requests
    } catch (error) {
      console.error('Error getting friend requests:', error)
      return []
    }
  }

  // Remove a friend
  static async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find and delete both directions of the friendship
      const q1 = query(
        collection(db, 'friendships'),
        where('userId', '==', userId),
        where('friendId', '==', friendId)
      )
      const q2 = query(
        collection(db, 'friendships'),
        where('userId', '==', friendId),
        where('friendId', '==', userId)
      )

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ])

      const deletePromises = [
        ...snapshot1.docs.map(doc => deleteDoc(doc.ref)),
        ...snapshot2.docs.map(doc => deleteDoc(doc.ref))
      ]

      await Promise.all(deletePromises)

      return { success: true }
    } catch (error) {
      console.error('Error removing friend:', error)
      return { success: false, error: 'Failed to remove friend' }
    }
  }

  // Update user online status
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOnline,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating online status:', error)
      return { success: false, error: 'Failed to update online status' }
    }
  }

  // Subscribe to friend requests changes
  static subscribeToFriendRequests(userId: string, callback: (payload: any) => void) {
    const q1 = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', userId)
    )
    const q2 = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId)
    )

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          eventType: change.type,
          new: change.doc.data(),
          old: change.type === 'removed' ? change.doc.data() : undefined
        })
      })
    })

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          eventType: change.type,
          new: change.doc.data(),
          old: change.type === 'removed' ? change.doc.data() : undefined
        })
      })
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }

  // Subscribe to friends changes
  static subscribeToFriends(userId: string, callback: (payload: any) => void) {
    const q1 = query(
      collection(db, 'friendships'),
      where('userId', '==', userId)
    )
    const q2 = query(
      collection(db, 'friendships'),
      where('friendId', '==', userId)
    )

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          eventType: change.type,
          new: change.doc.data(),
          old: change.type === 'removed' ? change.doc.data() : undefined
        })
      })
    })

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          eventType: change.type,
          new: change.doc.data(),
          old: change.type === 'removed' ? change.doc.data() : undefined
        })
      })
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }

  // Subscribe to online status changes
  static subscribeToOnlineStatus(userId: string, callback: (payload: any) => void) {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true)
    )

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          eventType: change.type,
          new: change.doc.data(),
          old: change.type === 'removed' ? change.doc.data() : undefined
        })
      })
    })
  }
}
