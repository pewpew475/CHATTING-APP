// Real-time messaging service
import { supabase } from './supabase'

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
      const { data, error } = await supabase.rpc('get_or_create_chat', {
        user1_uuid: user1Id,
        user2_uuid: user2Id
      })

      if (error) {
        console.error('Error getting/creating chat:', error)
        return { success: false, error: error.message }
      }

      return { success: true, chatId: data }
    } catch (error) {
      console.error('Error getting/creating chat:', error)
      return { success: false, error: 'Failed to get or create chat' }
    }
  }

  // Get user's chats with last message
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // 1) Load chats without joins to avoid FK name coupling
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (chatsError) {
        console.error('Error getting user chats (base):', chatsError)
        return []
      }

      const chatRows = chats || []
      if (chatRows.length === 0) return []

      // 2) Gather other user IDs and last message IDs
      const otherUserIds = Array.from(new Set(chatRows.map(c => c.user1_id === userId ? c.user2_id : c.user1_id)))
      const lastMessageIds = Array.from(new Set(chatRows.map(c => c.last_message_id).filter(Boolean)))

      // 3) Load profiles for other users
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, real_name, profile_image_url')
        .in('user_id', otherUserIds)

      if (profilesError) {
        console.error('Error loading chat user profiles:', profilesError)
      }

      const userIdToProfile = new Map<string, any>()
      ;(profiles || []).forEach((p: any) => userIdToProfile.set(p.user_id, p))

      // 4) Load last messages
      let messagesById = new Map<string, any>()
      if (lastMessageIds.length > 0) {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, type, file_name, created_at')
          .in('id', lastMessageIds)

        if (messagesError) {
          console.error('Error loading last messages:', messagesError)
        }
        (messages || []).forEach((m: any) => messagesById.set(m.id, m))
      }

      // 5) Compose result
      return chatRows.map((chat: any) => {
        const otherId = chat.user1_id === userId ? chat.user2_id : chat.user1_id
        const profile = userIdToProfile.get(otherId)
        const last = chat.last_message_id ? messagesById.get(chat.last_message_id) : undefined

        const composed: Chat = {
          id: chat.id,
          user1Id: chat.user1_id,
          user2Id: chat.user2_id,
          lastMessageId: chat.last_message_id || undefined,
          lastMessageAt: chat.last_message_at || undefined,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          otherUser: profile ? {
            id: otherId,
            username: profile.username,
            realName: profile.real_name,
            profileImageUrl: profile.profile_image_url,
            isOnline: false
          } : undefined,
          lastMessage: last ? {
            id: last.id,
            chatId: chat.id,
            senderId: '',
            receiverId: '',
            content: last.content,
            type: last.type,
            fileName: last.file_name,
            isRead: false,
            createdAt: last.created_at,
            updatedAt: last.created_at
          } : undefined
        }
        return composed
      })
    } catch (error) {
      console.error('Error getting user chats (unexpected):', error)
      return []
    }
  }

  // Get messages for a chat
  static async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error getting chat messages:', error)
        return []
      }

      return (data || []).reverse().map(msg => ({
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        type: msg.type,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        isRead: msg.is_read,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at
      }))
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          receiver_id: receiverId,
          content: content || null,
          type,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          file_type: fileType || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
      }

      const message: Message = {
        id: data.id,
        chatId: data.chat_id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: data.content,
        type: data.type,
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        fileType: data.file_type,
        isRead: data.is_read,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return { success: true, message }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) {
        console.error('Error marking message as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking message as read:', error)
      return { success: false, error: 'Failed to mark message as read' }
    }
  }

  // Mark all messages in a chat as read
  static async markChatAsRead(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)

      if (error) {
        console.error('Error marking chat as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking chat as read:', error)
      return { success: false, error: 'Failed to mark chat as read' }
    }
  }

  // Subscribe to new messages in a chat
  static subscribeToChatMessages(chatId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const message: Message = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            senderId: payload.new.sender_id,
            receiverId: payload.new.receiver_id,
            content: payload.new.content,
            type: payload.new.type,
            fileUrl: payload.new.file_url,
            fileName: payload.new.file_name,
            fileSize: payload.new.file_size,
            fileType: payload.new.file_type,
            isRead: payload.new.is_read,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at
          }
          callback(message)
        }
      )
      .subscribe()
  }

  // Subscribe to message read status updates
  static subscribeToMessageReadStatus(chatId: string, callback: (messageId: string) => void) {
    return supabase
      .channel(`chat_read_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            callback(payload.new.id)
          }
        }
      )
      .subscribe()
  }

  // Subscribe to chat updates (new chats, last message updates)
  static subscribeToUserChats(userId: string, callback: (chat: Chat) => void) {
    return supabase
      .channel(`user_chats_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        },
        async (payload) => {
          // Fetch the updated chat with all related data
          const { data, error } = await supabase
            .from('chats')
            .select(`
              *,
              user1:user_profiles!chats_user1_id_fkey(
                user_id,
                username,
                real_name,
                profile_image_url
              ),
              user2:user_profiles!chats_user2_id_fkey(
                user_id,
                username,
                real_name,
                profile_image_url
              ),
              last_message:messages!chats_last_message_id_fkey(
                id,
                content,
                type,
                file_name,
                created_at
              )
            `)
            .eq('id', (payload.new as any).id)
            .single()

          if (data && !error) {
            const chat: Chat = {
              id: data.id,
              user1Id: data.user1_id,
              user2Id: data.user2_id,
              lastMessageId: data.last_message_id,
              lastMessageAt: data.last_message_at,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              otherUser: data.user1_id === userId ? {
                id: data.user2.user_id,
                username: data.user2.username,
                realName: data.user2.real_name,
                profileImageUrl: data.user2.profile_image_url,
                isOnline: false
              } : {
                id: data.user1.user_id,
                username: data.user1.username,
                realName: data.user1.real_name,
                profileImageUrl: data.user1.profile_image_url,
                isOnline: false
              },
              lastMessage: data.last_message ? {
                id: data.last_message.id,
                chatId: data.id,
                senderId: '',
                receiverId: '',
                content: data.last_message.content,
                type: data.last_message.type,
                fileName: data.last_message.file_name,
                isRead: false,
                createdAt: data.last_message.created_at,
                updatedAt: data.last_message.created_at
              } : undefined
            }
            callback(chat)
          }
        }
      )
      .subscribe()
  }
}
