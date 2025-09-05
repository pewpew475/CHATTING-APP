// Firebase Firestore database service
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// Export db for direct use
export { db }

// Types
export interface User {
  id: string
  email?: string
  name?: string
  isOnline: boolean
  lastSeen: Date
  createdAt: Date
}

export interface Chat {
  id: string
  participant1: string
  participant2: string
  lastMessageId?: string
  lastMessageAt?: Date
  createdAt: Date
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  receiverId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isRead: boolean
  createdAt: Date
}

// Database abstraction layer
export const firebaseDb = {
  user: {
    async findUnique(options: { where: { id: string } }): Promise<User | null> {
      try {
        const userDoc = await getDoc(doc(db, 'users', options.where.id))
        
        if (!userDoc.exists()) {
          return null
        }

        const data = userDoc.data()
        return {
          id: data.userId,
          email: data.email,
          name: data.realName,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      } catch (error) {
        console.error('Error finding user:', error)
        return null
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { isOnline?: boolean, lastSeen?: Date } 
    }): Promise<User | null> {
      try {
        const userRef = doc(db, 'users', options.where.id)
        const updateData: any = {}
        
        if (options.data.isOnline !== undefined) {
          updateData.isOnline = options.data.isOnline
        }
        if (options.data.lastSeen) {
          updateData.lastSeen = Timestamp.fromDate(options.data.lastSeen)
        }
        
        await updateDoc(userRef, updateData)
        
        // Return updated user
        return await this.findUnique({ where: { id: options.where.id } })
      } catch (error) {
        console.error('Error updating user:', error)
        return null
      }
    }
  },

  chat: {
    async findMany(options: { 
      where: { 
        OR: Array<{ participant1: string } | { participant2: string }> 
      } 
    }): Promise<Chat[]> {
      try {
        const userId = (options.where.OR[0] as any).participant1 || (options.where.OR[1] as any).participant2
        
        // Query chats where user is participant1 or participant2
        const q = query(
          collection(db, 'chats'),
          where('participant1', '==', userId)
        )
        
        const q2 = query(
          collection(db, 'chats'),
          where('participant2', '==', userId)
        )

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q),
          getDocs(q2)
        ])

        const chats: Chat[] = []
        
        snapshot1.forEach(doc => {
          const data = doc.data()
          chats.push({
            id: doc.id,
            participant1: data.participant1,
            participant2: data.participant2,
            lastMessageId: data.lastMessageId,
            lastMessageAt: data.lastMessageAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        snapshot2.forEach(doc => {
          const data = doc.data()
          chats.push({
            id: doc.id,
            participant1: data.participant1,
            participant2: data.participant2,
            lastMessageId: data.lastMessageId,
            lastMessageAt: data.lastMessageAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        return chats
      } catch (error) {
        console.error('Error finding chats:', error)
        return []
      }
    },

    async findUnique(options: { 
      where: { id: string },
      include?: { user1: boolean, user2: boolean }
    }): Promise<(Chat & { user1?: User, user2?: User }) | null> {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', options.where.id))
        
        if (!chatDoc.exists()) return null
        
        const data = chatDoc.data()
        const chat: Chat & { user1?: User, user2?: User } = {
          id: chatDoc.id,
          participant1: data.participant1,
          participant2: data.participant2,
          lastMessageId: data.lastMessageId,
          lastMessageAt: data.lastMessageAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        }
        
        // Include user data if requested
        if (options.include?.user1) {
          chat.user1 = await firebaseDb.user.findUnique({ where: { id: data.participant1 } }) || undefined
        }
        if (options.include?.user2) {
          chat.user2 = await firebaseDb.user.findUnique({ where: { id: data.participant2 } }) || undefined
        }
        
        return chat
      } catch (error) {
        console.error('Error finding chat:', error)
        return null
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { lastMessageId?: string, lastMessageAt?: Date } 
    }): Promise<Chat | null> {
      try {
        const chatRef = doc(db, 'chats', options.where.id)
        const updateData: any = {}
        
        if (options.data.lastMessageId) {
          updateData.lastMessageId = options.data.lastMessageId
        }
        if (options.data.lastMessageAt) {
          updateData.lastMessageAt = Timestamp.fromDate(options.data.lastMessageAt)
        }
        
        await updateDoc(chatRef, updateData)
        
        // Return updated chat
        return await this.findUnique({ where: { id: options.where.id } })
      } catch (error) {
        console.error('Error updating chat:', error)
        return null
      }
    }
  },

  message: {
    async create(options: { 
      data: {
        chatId: string
        senderId: string
        receiverId: string
        content: string
        type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'
        fileUrl?: string
        fileName?: string
        fileSize?: number
        createdAt: Date
      }
    }): Promise<Message> {
      try {
        const messageData = {
          chatId: options.data.chatId,
          senderId: options.data.senderId,
          receiverId: options.data.receiverId,
          content: options.data.content,
          type: options.data.type,
          fileUrl: options.data.fileUrl || null,
          fileName: options.data.fileName || null,
          fileSize: options.data.fileSize || null,
          isRead: false,
          createdAt: Timestamp.fromDate(options.data.createdAt),
        }

        const docRef = await addDoc(collection(db, 'messages'), messageData)

        return {
          id: docRef.id,
          chatId: options.data.chatId,
          senderId: options.data.senderId,
          receiverId: options.data.receiverId,
          content: options.data.content,
          type: options.data.type,
          fileUrl: options.data.fileUrl,
          fileName: options.data.fileName,
          fileSize: options.data.fileSize,
          isRead: false,
          createdAt: options.data.createdAt,
        }
      } catch (error) {
        console.error('Error creating message:', error)
        throw error
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { isRead?: boolean } 
    }): Promise<Message | null> {
      try {
        const messageRef = doc(db, 'messages', options.where.id)
        await updateDoc(messageRef, { isRead: options.data.isRead })

        const messageDoc = await getDoc(messageRef)
        if (!messageDoc.exists()) return null

        const data = messageDoc.data()
        return {
          id: messageDoc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          isRead: data.isRead,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      } catch (error) {
        console.error('Error updating message:', error)
        return null
      }
    },

    async findUnique(options: { 
      where: { id: string },
      select?: { senderId: boolean, chatId: boolean }
    }): Promise<Partial<Message> | null> {
      try {
        const messageDoc = await getDoc(doc(db, 'messages', options.where.id))
        
        if (!messageDoc.exists()) return null

        const data = messageDoc.data()
        const message: any = {
          id: messageDoc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          isRead: data.isRead,
          createdAt: data.createdAt?.toDate() || new Date(),
        }

        // Return only selected fields if specified
        if (options.select) {
          const result: any = {}
          if (options.select.senderId) result.senderId = message.senderId
          if (options.select.chatId) result.chatId = message.chatId
          return result
        }

        return message
      } catch (error) {
        console.error('Error finding message:', error)
        return null
      }
    }
  }
}

// Real-time subscriptions
export const subscribeToChatMessages = (chatId: string, callback: (message: Message) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
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
          isRead: data.isRead,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
        callback(message)
      }
    })
  })
}

export const subscribeToUserChats = (userId: string, callback: (chat: Chat) => void) => {
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
          participant1: data.participant1,
          participant2: data.participant2,
          lastMessageId: data.lastMessageId,
          lastMessageAt: data.lastMessageAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
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
          participant1: data.participant1,
          participant2: data.participant2,
          lastMessageId: data.lastMessageId,
          lastMessageAt: data.lastMessageAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
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
