// Real-time messaging service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

export interface Message {
  id: string
  chatId: string
  senderId: string
  receiverId: string
  content?: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface Chat {
  id: string
  user1Id: string
  user2Id: string
  lastMessageId?: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
  otherUser?: {
    id: string
    username: string
    realName: string
    profileImageUrl?: string
    isOnline: boolean
  }
  lastMessage?: Message
}

export class MessagingService {
  // Get or create a chat between two users
  static async getOrCreateChat(user1Id: string, user2Id: string): Promise<{ success: boolean; chatId?: string; error?: string }> {
    try {
      // First, check if a chat already exists between these users
      const q1 = query(
        collection(db, 'chats'),
        where('participant1', '==', user1Id),
        where('participant2', '==', user2Id)
      )
      
      const q2 = query(
        collection(db, 'chats'),
        where('participant1', '==', user2Id),
        where('participant2', '==', user1Id)
      )

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ])

      // Check if chat exists in either direction
      if (!snapshot1.empty) {
        return { success: true, chatId: snapshot1.docs[0].id }
      }
      
      if (!snapshot2.empty) {
        return { success: true, chatId: snapshot2.docs[0].id }
      }

      // Create new chat if none exists
      const chatData = {
        participant1: user1Id,
        participant2: user2Id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'chats'), chatData)
      return { success: true, chatId: docRef.id }
    } catch (error) {
      console.error('Error getting/creating chat:', error)
      return { success: false, error: 'Failed to get or create chat' }
    }
  }

  // Get user's chats with last message
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // 1) Load chats where user is participant1 or participant2
      const q1 = query(
        collection(db, 'chats'),
        where('participant1', '==', userId)
      )
      
      const q2 = query(
        collection(db, 'chats'),
        where('participant2', '==', userId)
      )

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ])

      const chatRows: any[] = []
      snapshot1.forEach(doc => {
        chatRows.push({ id: doc.id, ...doc.data(), user1Id: doc.data().participant1, user2Id: doc.data().participant2 })
      })
      snapshot2.forEach(doc => {
        chatRows.push({ id: doc.id, ...doc.data(), user1Id: doc.data().participant1, user2Id: doc.data().participant2 })
      })

      if (chatRows.length === 0) return []

      // 2) Gather other user IDs and last message IDs
      const otherUserIds = Array.from(new Set(chatRows.map(c => c.user1Id === userId ? c.user2Id : c.user1Id)))
      const lastMessageIds = Array.from(new Set(chatRows.map(c => c.lastMessageId).filter(Boolean)))

      // 3) Load profiles for other users
      const userIdToProfile = new Map<string, any>()
      for (const otherUserId of otherUserIds) {
        const userDoc = await getDoc(doc(db, 'users', otherUserId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          userIdToProfile.set(otherUserId, {
            userId: otherUserId,
            username: userData.username,
            realName: userData.realName,
            profileImageUrl: userData.profileImageUrl
          })
        }
      }

      // 4) Load last messages
      let messagesById = new Map<string, any>()
      for (const messageId of lastMessageIds) {
        const messageDoc = await getDoc(doc(db, 'messages', messageId))
        if (messageDoc.exists()) {
          const messageData = messageDoc.data()
          messagesById.set(messageId, {
            id: messageId,
            content: messageData.content,
            type: messageData.type,
            fileName: messageData.fileName,
            createdAt: messageData.createdAt?.toDate?.()?.toISOString()
          })
        }
      }

      // 5) Compose result
      const chats = chatRows.map((chat: any) => {
        const otherId = chat.user1Id === userId ? chat.user2Id : chat.user1Id
        const profile = userIdToProfile.get(otherId)
        const last = chat.lastMessageId ? messagesById.get(chat.lastMessageId) : undefined

        const composed: Chat = {
          id: chat.id,
          user1Id: chat.user1Id,
          user2Id: chat.user2Id,
          lastMessageId: chat.lastMessageId || undefined,
          lastMessageAt: chat.lastMessageAt?.toDate?.()?.toISOString() || undefined,
          createdAt: chat.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: chat.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          otherUser: profile ? {
            id: otherId,
            username: profile.username,
            realName: profile.realName,
            profileImageUrl: profile.profileImageUrl,
            isOnline: false
          } : undefined,
          lastMessage: last ? {
            id: last.id,
            chatId: chat.id,
            senderId: '',
            receiverId: '',
            content: last.content,
            type: last.type,
            fileName: last.fileName,
            isRead: false,
            createdAt: last.createdAt,
            updatedAt: last.createdAt
          } : undefined
        }
        return composed
      })
      
      // Sort chats by lastMessageAt in descending order (most recent first)
      return chats.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bTime - aTime
      })
    } catch (error) {
      console.error('Error getting user chats (unexpected):', error)
      return []
    }
  }

  // Get messages for a chat
  static async getChatMessages(chatId: string, messageLimit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        limit(messageLimit)
      )

      const snapshot = await getDocs(q)
      const messages: Message[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          isRead: data.isRead,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })
      })

      return messages.reverse() // Reverse to get chronological order
    } catch (error) {
      console.error('Error getting chat messages:', error)
      return []
    }
  }

  // Send a message
  static async sendMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content?: string,
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    fileType?: string
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      const messageData = {
        chatId,
        senderId,
        receiverId,
        content: content || null,
        type,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileType: fileType || null,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'messages'), messageData)

      const message: Message = {
        id: docRef.id,
        chatId,
        senderId,
        receiverId,
        content: content || '',
        type,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        fileType: fileType || undefined,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Update chat with last message info
      const chatRef = doc(db, 'chats', chatId)
      await updateDoc(chatRef, {
        lastMessageId: docRef.id,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return { success: true, message }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const messageRef = doc(db, 'messages', messageId)
      await updateDoc(messageRef, { isRead: true })

      return { success: true }
    } catch (error) {
      console.error('Error marking message as read:', error)
      return { success: false, error: 'Failed to mark message as read' }
    }
  }

  // Mark all messages in a chat as read
  static async markChatAsRead(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('senderId', '!=', userId)
      )

      const snapshot = await getDocs(q)
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      )

      await Promise.all(updatePromises)

      return { success: true }
    } catch (error) {
      console.error('Error marking chat as read:', error)
      return { success: false, error: 'Failed to mark chat as read' }
    }
  }

  // Subscribe to new messages in a chat
  static subscribeToChatMessages(chatId: string, callback: (message: Message) => void) {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          const message: Message = {
            id: change.doc.id,
            chatId: data.chatId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            type: data.type,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
            isRead: data.isRead,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }
          callback(message)
        }
      })
    })
  }

  // Subscribe to message read status updates
  static subscribeToMessageReadStatus(chatId: string, callback: (messageId: string) => void) {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    )

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data()
          if (data.isRead) {
            callback(change.doc.id)
          }
        }
      })
    })
  }

  // Subscribe to chat updates (new chats, last message updates)
  static subscribeToUserChats(userId: string, callback: (chat: Chat) => void) {
    const q1 = query(
      collection(db, 'chats'),
      where('participant1', '==', userId)
    )
    
    const q2 = query(
      collection(db, 'chats'),
      where('participant2', '==', userId)
    )

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data()
          const chat: Chat = {
            id: change.doc.id,
            user1Id: data.participant1,
            user2Id: data.participant2,
            lastMessageId: data.lastMessageId,
            lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString(),
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }
          callback(chat)
        }
      })
    })

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data()
          const chat: Chat = {
            id: change.doc.id,
            user1Id: data.participant1,
            user2Id: data.participant2,
            lastMessageId: data.lastMessageId,
            lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString(),
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }
          callback(chat)
        }
      })
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }
}
