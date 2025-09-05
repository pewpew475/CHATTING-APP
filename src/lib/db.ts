// src/lib/db.ts
// Database abstraction layer for Firebase
import { firebaseDb } from './firebase-db';

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
export const db = firebaseDb;