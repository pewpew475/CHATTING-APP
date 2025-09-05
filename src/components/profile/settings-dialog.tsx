"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"

interface SettingsDialogProps {
  children: React.ReactNode
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  messageSound: boolean
  onlineStatus: boolean
  readReceipts: boolean
}

interface PrivacySettings {
  profileVisibility: "everyone" | "friends" | "only_me"
  messagePrivacy: "everyone" | "friends" | "only_me"
  lastSeenVisibility: "everyone" | "friends" | "only_me"
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { user, signOut, deleteAccount } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    messageSound: true,
    onlineStatus: true,
    readReceipts: true
  })
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "everyone",
    messagePrivacy: "friends",
    lastSeenVisibility: "friends"
  })

  const handleNotificationChange = (setting: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }))
  }

  const handlePrivacyChange = (setting: keyof PrivacySettings, value: string) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Mock settings save - will be replaced with API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Settings saved successfully")
      setIsOpen(false)
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteAccount()
      
      if (result.success) {
        toast.success("Account deleted successfully")
        setIsOpen(false)
      } else {
        toast.error(result.error || "Failed to delete account")
      }
    } catch (error) {
      toast.error("Failed to delete account")
      console.error("Delete account error:", error)
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
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    handleNotificationChange("emailNotifications", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => 
                    handleNotificationChange("pushNotifications", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Message Sound</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound for new messages
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.messageSound}
                  onCheckedChange={(checked) => 
                    handleNotificationChange("messageSound", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Online Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Show when you're online to others
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.onlineStatus}
                  onCheckedChange={(checked) => 
                    handleNotificationChange("onlineStatus", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Read Receipts</Label>
                  <p className="text-xs text-muted-foreground">
                    Let others know when you've read their messages
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.readReceipts}
                  onCheckedChange={(checked) => 
                    handleNotificationChange("readReceipts", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Privacy</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <div className="flex space-x-2">
                  {(["everyone", "friends", "only_me"] as const).map((option) => (
                    <Button
                      key={option}
                      variant={privacySettings.profileVisibility === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePrivacyChange("profileVisibility", option)}
                      disabled={isLoading}
                    >
                      {option === "everyone" ? "Everyone" : 
                       option === "friends" ? "Friends Only" : "Only Me"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Who can message you</Label>
                <div className="flex space-x-2">
                  {(["everyone", "friends", "only_me"] as const).map((option) => (
                    <Button
                      key={option}
                      variant={privacySettings.messagePrivacy === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePrivacyChange("messagePrivacy", option)}
                      disabled={isLoading}
                    >
                      {option === "everyone" ? "Everyone" : 
                       option === "friends" ? "Friends Only" : "No One"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Last Seen Status</Label>
                <div className="flex space-x-2">
                  {(["everyone", "friends", "only_me"] as const).map((option) => (
                    <Button
                      key={option}
                      variant={privacySettings.lastSeenVisibility === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePrivacyChange("lastSeenVisibility", option)}
                      disabled={isLoading}
                    >
                      {option === "everyone" ? "Everyone" : 
                       option === "friends" ? "Friends Only" : "Nobody"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Account</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  const result = await signOut()
                  if (result.success) {
                    toast.success("Signed out successfully")
                    setIsOpen(false)
                  } else {
                    toast.error(result.error || "Failed to sign out")
                  }
                }}
                disabled={isLoading}
              >
                <Icons.logout className="mr-2 h-4 w-4" />
                Sign Out
              </Button>

              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  Deleting your account will permanently remove all your data, including messages, 
                  friends, and profile information. This action cannot be undone.
                </AlertDescription>
              </Alert>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAccount}
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Account
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}