// src/lib/db.ts
// Database abstraction layer for Supabase
import { supabase } from './supabase';

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
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', options.where.id)
          .single();

        if (error) {
          console.error('Error finding user:', error);
          return null;
        }

        return {
          id: data.user_id,
          email: data.email,
          name: data.real_name,
          isOnline: data.is_online || false,
          lastSeen: data.last_seen ? new Date(data.last_seen) : new Date(),
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        };
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
        const updateData: any = {};
        
        if (options.data.isOnline !== undefined) {
          updateData.is_online = options.data.isOnline;
        }
        if (options.data.lastSeen) {
          updateData.last_seen = options.data.lastSeen.toISOString();
        }
        
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', options.where.id);

        if (error) {
          console.error('Error updating user:', error);
          return null;
        }
        
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
        const userId = (options.where.OR[0] as any).participant1 || (options.where.OR[1] as any).participant2;
        
        // Query chats where user is participant1 or participant2
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .or(`participant1.eq.${userId},participant2.eq.${userId}`);

        if (error) {
          console.error('Error finding chats:', error);
          return [];
        }

        return data.map(chat => ({
          id: chat.id,
          participant1: chat.participant1,
          participant2: chat.participant2,
          lastMessageId: chat.last_message_id,
          lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at) : undefined,
          createdAt: chat.created_at ? new Date(chat.created_at) : new Date(),
        }));
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
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('id', options.where.id)
          .single();

        if (error || !data) return null;
        
        const chat: Chat & { user1?: User, user2?: User } = {
          id: data.id,
          participant1: data.participant1,
          participant2: data.participant2,
          lastMessageId: data.last_message_id,
          lastMessageAt: data.last_message_at ? new Date(data.last_message_at) : undefined,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        };
        
        // Include user data if requested
        if (options.include?.user1) {
          chat.user1 = await db.user.findUnique({ where: { id: data.participant1 } }) || undefined;
        }
        if (options.include?.user2) {
          chat.user2 = await db.user.findUnique({ where: { id: data.participant2 } }) || undefined;
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
        const updateData: any = {};
        
        if (options.data.lastMessageId) {
          updateData.last_message_id = options.data.lastMessageId;
        }
        if (options.data.lastMessageAt) {
          updateData.last_message_at = options.data.lastMessageAt.toISOString();
        }
        
        const { error } = await supabase
          .from('chats')
          .update(updateData)
          .eq('id', options.where.id);

        if (error) {
          console.error('Error updating chat:', error);
          return null;
        }
        
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