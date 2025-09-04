// This file has been removed - using Supabase instead
// All Firebase functionality has been migrated to Supabase

// Export empty functions for compatibility
export const checkProfileCompletion = () => false;
export const registerFirebaseUser = () => Promise.resolve({ success: true });
export const updateFirebaseUserOnlineStatus = () => {};
export const searchFirebaseUsers = () => Promise.resolve([]);
export const sendFirebaseFriendRequest = () => Promise.resolve({ success: true });
export const getFirebaseFriendRequests = () => [];
export const acceptFirebaseFriendRequest = () => Promise.resolve({ success: true });
export const getFirebaseFriends = () => [];

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  username: string;
  realName: string;
  profileImageUrl?: string;
  isOnline: boolean;
}

export {};