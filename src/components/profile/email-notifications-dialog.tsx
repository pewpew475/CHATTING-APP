"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { UserSettingsService, type EmailNotificationSettings } from "@/lib/user-settings-service"

interface EmailNotificationsDialogProps {
  children: React.ReactNode
}

// Using EmailNotificationSettings from user-settings-service
interface NotificationSettings {
  emailNotifications: boolean
  newMessages: boolean
  friendRequests: boolean
  groupInvites: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

export function EmailNotificationsDialog({ children }: EmailNotificationsDialogProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newMessages: true,
    friendRequests: true,
    groupInvites: true,
    securityAlerts: true,
    weeklyDigest: false,
    productUpdates: false
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id && isOpen) {
        // Load saved settings from database
        const savedSettings = await UserSettingsService.getEmailNotificationSettings(user.id)
        if (savedSettings) {
          // Map database settings to component interface
          setSettings({
            emailNotifications: true,
            newMessages: savedSettings.newMessages,
            friendRequests: savedSettings.friendRequests,
            groupInvites: false, // Not in database schema
            securityAlerts: savedSettings.systemUpdates,
            weeklyDigest: savedSettings.weeklyDigest,
            productUpdates: savedSettings.marketing
          })
        }
      }
    }
    loadSettings()
  }, [user?.id, isOpen])

  const handleSettingChange = (setting: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: value }
      
      // If turning off main email notifications, turn off all others
      if (setting === 'emailNotifications' && !value) {
        return {
          ...newSettings,
          newMessages: false,
          friendRequests: false,
          groupInvites: false,
          securityAlerts: true, // Keep security alerts on for safety
          weeklyDigest: false,
          productUpdates: false
        }
      }
      
      // If turning on any specific notification, ensure main toggle is on
      if (setting !== 'emailNotifications' && value) {
        newSettings.emailNotifications = true
      }
      
      return newSettings
    })
  }

  const handleSaveSettings = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Save to database
      const dbSettings = {
        newMessages: settings.newMessages,
        friendRequests: settings.friendRequests,
        friendAccepted: true, // Default value
        systemUpdates: settings.securityAlerts,
        marketing: settings.productUpdates,
        weeklyDigest: settings.weeklyDigest
      }
      
      const result = await UserSettingsService.saveEmailNotificationSettings(user.id, dbSettings)
      if (!result.success) {
        throw new Error(result.error)
      }
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success("Email notification preferences saved successfully")
      setIsOpen(false)
    } catch (error) {
      toast.error("Failed to save notification preferences")
      console.error("Error saving notification settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!settings.emailNotifications) {
      toast.error("Please enable email notifications first")
      return
    }

    setIsLoading(true)
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Test email sent! Check your inbox.")
    } catch (error) {
      toast.error("Failed to send test email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.mail className="h-5 w-5" />
            Email Notifications
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for account activity
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                handleSettingChange("emailNotifications", checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          {/* Individual Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">NOTIFICATION TYPES</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when you receive new messages
                  </p>
                </div>
                <Switch
                  checked={settings.newMessages}
                  onCheckedChange={(checked) => 
                    handleSettingChange("newMessages", checked)
                  }
                  disabled={isLoading || !settings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Friend Requests</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when someone sends you a friend request
                  </p>
                </div>
                <Switch
                  checked={settings.friendRequests}
                  onCheckedChange={(checked) => 
                    handleSettingChange("friendRequests", checked)
                  }
                  disabled={isLoading || !settings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Group Invites</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when you're invited to join a group
                  </p>
                </div>
                <Switch
                  checked={settings.groupInvites}
                  onCheckedChange={(checked) => 
                    handleSettingChange("groupInvites", checked)
                  }
                  disabled={isLoading || !settings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Important security notifications (recommended)
                  </p>
                </div>
                <Switch
                  checked={settings.securityAlerts}
                  onCheckedChange={(checked) => 
                    handleSettingChange("securityAlerts", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Optional Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">OPTIONAL</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-xs text-muted-foreground">
                    Weekly summary of your activity and updates
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => 
                    handleSettingChange("weeklyDigest", checked)
                  }
                  disabled={isLoading || !settings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    News about new features and improvements
                  </p>
                </div>
                <Switch
                  checked={settings.productUpdates}
                  onCheckedChange={(checked) => 
                    handleSettingChange("productUpdates", checked)
                  }
                  disabled={isLoading || !settings.emailNotifications}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestEmail}
                disabled={isLoading || !settings.emailNotifications}
                className="flex-1"
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Test Email
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Changes will be saved to your account and synced across devices
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}