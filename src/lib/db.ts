// src/lib/db.ts
// Database abstraction layer for Firebase and Supabase
import { firestore } from './firebase';
import { supabase } from './supabase';

// Dynamic imports for Firebase Firestore functions
let collection: any, doc: any, getDoc: any, getDocs: any, addDoc: any, updateDoc: any, query: any, where: any, orderBy: any, Timestamp: any;

try {
  const firestoreFunctions = require('firebase/firestore');
  collection = firestoreFunctions.collection;
  doc = firestoreFunctions.doc;
  getDoc = firestoreFunctions.getDoc;
  getDocs = firestoreFunctions.getDocs;
  addDoc = firestoreFunctions.addDoc;
  updateDoc = firestoreFunctions.updateDoc;
  query = firestoreFunctions.query;
  where = firestoreFunctions.where;
  orderBy = firestoreFunctions.orderBy;
  Timestamp = firestoreFunctions.Timestamp;
} catch (error) {
  console.error('Firebase Firestore functions import error:', error);
  // Create mock functions
  collection = () => ({});
  doc = () => ({});
  getDoc = () => Promise.resolve({ exists: () => false });
  getDocs = () => Promise.resolve({ docs: [] });
  addDoc = () => Promise.reject(new Error('Firebase not available'));
  updateDoc = () => Promise.reject(new Error('Firebase not available'));
  query = () => ({});
  where = () => ({});
  orderBy = () => ({});
  Timestamp = { fromDate: (date: Date) => date };
}

// Types
interface User {
  id: string;
  email?: string;
  name?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

interface Chat {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: Date;
}

// Database abstraction layer
export const db = {
  user: {
    async findUnique(options: { where: { id: string } }): Promise<User | null> {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', options.where.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            id: userDoc.id,
            email: data.email,
            name: data.name,
            isOnline: data.isOnline || false,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }
        return null;
      } catch (error) {
        console.error('Error finding user:', error);
        return null;
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { isOnline?: boolean, lastSeen?: Date } 
    }): Promise<User | null> {
      try {
        const userRef = doc(firestore, 'users', options.where.id);
        const updateData: any = {};
        
        if (options.data.isOnline !== undefined) {
          updateData.isOnline = options.data.isOnline;
        }
        if (options.data.lastSeen) {
          updateData.lastSeen = Timestamp.fromDate(options.data.lastSeen);
        }
        
        await updateDoc(userRef, updateData);
        
        // Return updated user
        return await this.findUnique({ where: { id: options.where.id } });
      } catch (error) {
        console.error('Error updating user:', error);
        return null;
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
        const chats: Chat[] = [];
        const userId = options.where.OR[0].participant1 || options.where.OR[1].participant2;
        
        // Query chats where user is participant1
        const q1 = query(
          collection(firestore, 'chats'),
          where('participant1', '==', userId)
        );
        const snapshot1 = await getDocs(q1);
        
        // Query chats where user is participant2
        const q2 = query(
          collection(firestore, 'chats'),
          where('participant2', '==', userId)
        );
        const snapshot2 = await getDocs(q2);
        
        // Combine results
        [...snapshot1.docs, ...snapshot2.docs].forEach(doc => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            participant1: data.participant1,
            participant2: data.participant2,
            lastMessageId: data.lastMessageId,
            lastMessageAt: data.lastMessageAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        
        return chats;
      } catch (error) {
        console.error('Error finding chats:', error);
        return [];
      }
    },

    async findUnique(options: { 
      where: { id: string },
      include?: { user1: boolean, user2: boolean }
    }): Promise<(Chat & { user1?: User, user2?: User }) | null> {
      try {
        const chatDoc = await getDoc(doc(firestore, 'chats', options.where.id));
        if (!chatDoc.exists()) return null;
        
        const data = chatDoc.data();
        const chat: Chat & { user1?: User, user2?: User } = {
          id: chatDoc.id,
          participant1: data.participant1,
          participant2: data.participant2,
          lastMessageId: data.lastMessageId,
          lastMessageAt: data.lastMessageAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
        
        // Include user data if requested
        if (options.include?.user1) {
          chat.user1 = await db.user.findUnique({ where: { id: data.participant1 } });
        }
        if (options.include?.user2) {
          chat.user2 = await db.user.findUnique({ where: { id: data.participant2 } });
        }
        
        return chat;
      } catch (error) {
        console.error('Error finding chat:', error);
        return null;
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { lastMessageId?: string, lastMessageAt?: Date } 
    }): Promise<Chat | null> {
      try {
        const chatRef = doc(firestore, 'chats', options.where.id);
        const updateData: any = {};
        
        if (options.data.lastMessageId) {
          updateData.lastMessageId = options.data.lastMessageId;
        }
        if (options.data.lastMessageAt) {
          updateData.lastMessageAt = Timestamp.fromDate(options.data.lastMessageAt);
        }
        
        await updateDoc(chatRef, updateData);
        
        // Return updated chat
        return await this.findUnique({ where: { id: options.where.id } });
      } catch (error) {
        console.error('Error updating chat:', error);
        return null;
      }
    }
  },

  message: {
    async create(options: { 
      data: {
        chatId: string;
        senderId: string;
        receiverId: string;
        content: string;
        type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        createdAt: Date;
      }
    }): Promise<Message> {
      try {
        // Use Supabase for message storage (better for real-time messaging)
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            chat_id: options.data.chatId,
            sender_id: options.data.senderId,
            receiver_id: options.data.receiverId,
            content: options.data.content,
            type: options.data.type,
            file_url: options.data.fileUrl,
            file_name: options.data.fileName,
            file_size: options.data.fileSize,
            is_read: false,
            created_at: options.data.createdAt.toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          chatId: data.chat_id,
          senderId: data.sender_id,
          receiverId: data.receiver_id,
          content: data.content,
          type: data.type,
          fileUrl: data.file_url,
          fileName: data.file_name,
          fileSize: data.file_size,
          isRead: data.is_read,
          createdAt: new Date(data.created_at),
        };
      } catch (error) {
        console.error('Error creating message:', error);
        throw error;
      }
    },

    async update(options: { 
      where: { id: string }, 
      data: { isRead?: boolean } 
    }): Promise<Message | null> {
      try {
        const { data, error } = await supabase
          .from('messages')
          .update({ is_read: options.data.isRead })
          .eq('id', options.where.id)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          chatId: data.chat_id,
          senderId: data.sender_id,
          receiverId: data.receiver_id,
          content: data.content,
          type: data.type,
          fileUrl: data.file_url,
          fileName: data.file_name,
          fileSize: data.file_size,
          isRead: data.is_read,
          createdAt: new Date(data.created_at),
        };
      } catch (error) {
        console.error('Error updating message:', error);
        return null;
      }
    },

    async findUnique(options: { 
      where: { id: string },
      select?: { senderId: boolean, chatId: boolean }
    }): Promise<Partial<Message> | null> {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', options.where.id)
          .single();

        if (error) throw error;

        const message: any = {
          id: data.id,
          chatId: data.chat_id,
          senderId: data.sender_id,
          receiverId: data.receiver_id,
          content: data.content,
          type: data.type,
          fileUrl: data.file_url,
          fileName: data.file_name,
          fileSize: data.file_size,
          isRead: data.is_read,
          createdAt: new Date(data.created_at),
        };

        // Return only selected fields if specified
        if (options.select) {
          const result: any = {};
          if (options.select.senderId) result.senderId = message.senderId;
          if (options.select.chatId) result.chatId = message.chatId;
          return result;
        }

        return message;
      } catch (error) {
        console.error('Error finding message:', error);
        return null;
      }
    }
  }
};