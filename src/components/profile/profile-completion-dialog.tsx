"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { updateUserProfile } from "@/lib/profile-storage"
import { hasCompletedProfile } from "@/lib/profile-storage"

interface ProfileData {
  realName: string
  username: string
  email: string
  bio?: string
}

export function ProfileCompletionDialog() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    realName: "",
    username: "",
    email: "",
    bio: ""
  })

  useEffect(() => {
    const checkProfileCompletion = async () => {
      console.log('ProfileCompletionDialog: Checking for user:', user?.id, user?.email)
      
      if (user?.id) {
        // Check if user needs to complete profile
        const needsProfile = !(await hasCompletedProfile(user.id))
        console.log('ProfileCompletionDialog: Needs profile completion:', needsProfile)
        
        if (needsProfile) {
          console.log('ProfileCompletionDialog: Opening dialog for user:', user.email)
          // Pre-fill with Supabase user data
          setProfileData({
            realName: user.user_metadata?.full_name || user.user_metadata?.name || "",
            username: user.email?.split('@')[0] || "",
            email: user.email || "",
            bio: ""
          })
          setIsOpen(true)
        } else {
          console.log('ProfileCompletionDialog: Profile already completed, not showing dialog')
        }
      } else {
        console.log('ProfileCompletionDialog: No user, not checking profile')
      }
    }
    
    checkProfileCompletion()
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return

    // Basic validation
    if (!profileData.realName.trim()) {
      toast.error("Please enter your full name")
      return
    }

    if (!profileData.username.trim()) {
      toast.error("Please enter a username")
      return
    }

    if (!profileData.email.trim()) {
      toast.error("Please enter your email")
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserProfile(user.id, {
        realName: profileData.realName.trim(),
        username: profileData.username.trim(),
        email: profileData.email.trim(),
        bio: profileData.bio?.trim(),
        profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture
      })

      if (result.success) {
        toast.success("Profile completed successfully! You can now discover and add friends.")
        setIsOpen(false)
      } else {
        toast.error(result.error || "Failed to complete profile")
      }
    } catch (error) {
      toast.error("Failed to complete profile")
      console.error("Profile completion error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.user className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome! Please complete your profile to start discovering and adding friends.
          </p>

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
              <AvatarFallback className="text-lg">
                {profileData.realName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <Separator />

          <form onSubmit={handleCompleteProfile} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="realName">Full Name *</Label>
                <Input
                  id="realName"
                  value={profileData.realName}
                  onChange={(e) => handleInputChange("realName", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Choose a username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Your email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself..."
                  value={profileData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Profile
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}