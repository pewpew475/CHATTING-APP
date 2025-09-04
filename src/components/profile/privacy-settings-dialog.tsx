"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { UserSettingsService, type PrivacySettings } from "@/lib/user-settings-service"

interface PrivacySettingsDialogProps {
  children: React.ReactNode
}

interface LocalPrivacySettings {
  profileVisibility: "everyone" | "friends" | "only_me"
  messagePrivacy: "everyone" | "friends" | "only_me"
  lastSeenVisibility: "everyone" | "friends" | "nobody"
  onlineStatus: boolean
  readReceipts: boolean
  profilePicture: "everyone" | "friends" | "only_me"
  phoneNumber: "everyone" | "friends" | "nobody"
  email: "everyone" | "friends" | "nobody"
  searchable: boolean
  allowFriendRequests: boolean
}

export function PrivacySettingsDialog({ children }: PrivacySettingsDialogProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<LocalPrivacySettings>({
    profileVisibility: "friends",
    messagePrivacy: "friends",
    lastSeenVisibility: "friends",
    onlineStatus: true,
    readReceipts: true,
    profilePicture: "everyone",
    phoneNumber: "friends",
    email: "nobody",
    searchable: true,
    allowFriendRequests: true
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id && isOpen) {
        // Load saved settings from database
        const savedSettings = await UserSettingsService.getPrivacySettings(user.id)
        if (savedSettings) {
          // Map database settings to local format
          setSettings({
            profileVisibility: savedSettings.profileVisibility === "public" ? "everyone" :
                             savedSettings.profileVisibility === "friends" ? "friends" : "only_me",
            messagePrivacy: "friends", // Default value
            lastSeenVisibility: savedSettings.showLastSeen ? "friends" : "nobody",
            onlineStatus: savedSettings.showOnlineStatus,
            readReceipts: true, // Default value
            profilePicture: "friends", // Default value
            phoneNumber: "nobody", // Default value
            email: "nobody", // Default value
            searchable: savedSettings.allowProfileSearch,
            allowFriendRequests: savedSettings.allowFriendRequests
          })
        }
      }
    }
    loadSettings()
  }, [user?.id, isOpen])

  const handleVisibilityChange = (setting: keyof LocalPrivacySettings, value: string) => {
    setSettings(prev => ({ ...prev, [setting]: value }))
  }

  const handleToggleChange = (setting: keyof LocalPrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Save to database - map local settings to database format
      const dbSettings: PrivacySettings = {
        profileVisibility: settings.profileVisibility === "everyone" ? "public" : 
                          settings.profileVisibility === "friends" ? "friends" : "private",
        showOnlineStatus: settings.onlineStatus,
        allowFriendRequests: settings.allowFriendRequests,
        showLastSeen: settings.lastSeenVisibility !== "nobody",
        allowProfileSearch: settings.searchable,
        shareActivity: true // Default value
      }
      
      const result = await UserSettingsService.savePrivacySettings(user.id, dbSettings)
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success("Privacy settings saved successfully")
      setIsOpen(false)
    } catch (error) {
      toast.error("Failed to save privacy settings")
      console.error("Error saving privacy settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVisibilityLabel = (value: string) => {
    switch (value) {
      case "everyone": return "Everyone"
      case "friends": return "Friends Only"
      case "only_me": return "Only Me"
      case "nobody": return "Nobody"
      default: return value
    }
  }

  const VisibilityButtons = ({ 
    value, 
    onChange, 
    options = ["everyone", "friends", "only_me"] 
  }: { 
    value: string
    onChange: (value: string) => void
    options?: string[]
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          variant={value === option ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option)}
          disabled={isLoading}
          className="text-xs"
        >
          {getVisibilityLabel(option)}
        </Button>
      ))}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.shield className="h-5 w-5" />
            Privacy Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">PROFILE VISIBILITY</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Who can see your profile</Label>
                <p className="text-xs text-muted-foreground">
                  Control who can view your profile information
                </p>
                <VisibilityButtons
                  value={settings.profileVisibility}
                  onChange={(value) => handleVisibilityChange("profileVisibility", value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Profile picture visibility</Label>
                <p className="text-xs text-muted-foreground">
                  Who can see your profile picture
                </p>
                <VisibilityButtons
                  value={settings.profilePicture}
                  onChange={(value) => handleVisibilityChange("profilePicture", value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">CONTACT INFORMATION</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Phone number visibility</Label>
                <p className="text-xs text-muted-foreground">
                  Who can see your phone number
                </p>
                <VisibilityButtons
                  value={settings.phoneNumber}
                  onChange={(value) => handleVisibilityChange("phoneNumber", value)}
                  options={["everyone", "friends", "nobody"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Email visibility</Label>
                <p className="text-xs text-muted-foreground">
                  Who can see your email address
                </p>
                <VisibilityButtons
                  value={settings.email}
                  onChange={(value) => handleVisibilityChange("email", value)}
                  options={["everyone", "friends", "nobody"]}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Messaging Privacy */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">MESSAGING</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Who can message you</Label>
                <p className="text-xs text-muted-foreground">
                  Control who can send you direct messages
                </p>
                <VisibilityButtons
                  value={settings.messagePrivacy}
                  onChange={(value) => handleVisibilityChange("messagePrivacy", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Read receipts</Label>
                  <p className="text-xs text-muted-foreground">
                    Let others know when you've read their messages
                  </p>
                </div>
                <Switch
                  checked={settings.readReceipts}
                  onCheckedChange={(checked) => 
                    handleToggleChange("readReceipts", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">ACTIVITY STATUS</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Last seen visibility</Label>
                <p className="text-xs text-muted-foreground">
                  Who can see when you were last active
                </p>
                <VisibilityButtons
                  value={settings.lastSeenVisibility}
                  onChange={(value) => handleVisibilityChange("lastSeenVisibility", value)}
                  options={["everyone", "friends", "nobody"]}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show online status</Label>
                  <p className="text-xs text-muted-foreground">
                    Let others see when you're currently online
                  </p>
                </div>
                <Switch
                  checked={settings.onlineStatus}
                  onCheckedChange={(checked) => 
                    handleToggleChange("onlineStatus", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Discovery */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">DISCOVERY</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow search</Label>
                  <p className="text-xs text-muted-foreground">
                    Let others find you by searching your name or username
                  </p>
                </div>
                <Switch
                  checked={settings.searchable}
                  onCheckedChange={(checked) => 
                    handleToggleChange("searchable", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow friend requests</Label>
                  <p className="text-xs text-muted-foreground">
                    Let others send you friend requests
                  </p>
                </div>
                <Switch
                  checked={settings.allowFriendRequests}
                  onCheckedChange={(checked) => 
                    handleToggleChange("allowFriendRequests", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Icons.info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              These settings control how your information is shared with other users. 
              Some information may still be visible to app administrators for security purposes.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Privacy Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}