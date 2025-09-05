// User Settings Service - Uses Firebase Firestore database
import { db } from './firebase-db'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

export interface TwoFactorSettings {
  isEnabled: boolean
  method: "app" | "sms" | null
  backupCodes: string[]
  phoneNumber?: string
  lastUsed?: string
}

export interface EmailNotificationSettings {
  newMessages: boolean
  friendRequests: boolean
  friendAccepted: boolean
  systemUpdates: boolean
  marketing: boolean
  weeklyDigest: boolean
}

export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private"
  showOnlineStatus: boolean
  allowFriendRequests: boolean
  showLastSeen: boolean
  allowProfileSearch: boolean
  shareActivity: boolean
}

export class UserSettingsService {
  // Get user settings by type
  static async getUserSettings<T>(userId: string, settingType: string): Promise<T | null> {
    try {
      const settingsRef = doc(db, 'user_settings', `${userId}_${settingType}`)
      const settingsSnap = await getDoc(settingsRef)

      if (!settingsSnap.exists()) {
        return null
      }

      return settingsSnap.data() as T
    } catch (error) {
      console.error(`Error getting ${settingType} settings:`, error)
      return null
    }
  }

  // Save user settings by type
  static async saveUserSettings<T>(userId: string, settingType: string, settings: T): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsRef = doc(db, 'user_settings', `${userId}_${settingType}`)
      await setDoc(settingsRef, settings as any)

      return { success: true }
    } catch (error) {
      console.error(`Error saving ${settingType} settings:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save settings' 
      }
    }
  }

  // Delete user settings by type
  static async deleteUserSettings(userId: string, settingType: string): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsRef = doc(db, 'user_settings', `${userId}_${settingType}`)
      await deleteDoc(settingsRef)

      return { success: true }
    } catch (error) {
      console.error(`Error deleting ${settingType} settings:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete settings' 
      }
    }
  }

  // Two-Factor Authentication Settings
  static async get2FASettings(userId: string): Promise<TwoFactorSettings | null> {
    return this.getUserSettings<TwoFactorSettings>(userId, '2fa')
  }

  static async save2FASettings(userId: string, settings: TwoFactorSettings): Promise<{ success: boolean; error?: string }> {
    return this.saveUserSettings(userId, '2fa', settings)
  }

  // Email Notification Settings
  static async getEmailNotificationSettings(userId: string): Promise<EmailNotificationSettings | null> {
    return this.getUserSettings<EmailNotificationSettings>(userId, 'email_notifications')
  }

  static async saveEmailNotificationSettings(userId: string, settings: EmailNotificationSettings): Promise<{ success: boolean; error?: string }> {
    return this.saveUserSettings(userId, 'email_notifications', settings)
  }

  // Privacy Settings
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    return this.getUserSettings<PrivacySettings>(userId, 'privacy')
  }

  static async savePrivacySettings(userId: string, settings: PrivacySettings): Promise<{ success: boolean; error?: string }> {
    return this.saveUserSettings(userId, 'privacy', settings)
  }
}
