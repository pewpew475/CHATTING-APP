"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { uploadProfileImage } from "@/lib/supabase"
import { getUserProfile, updateUserProfile } from "@/lib/profile-storage"

interface ProfileDialogProps {
  children: React.ReactNode
}

interface ProfileData {
  realName: string
  username: string
  email: string
  bio?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  mobileNumber?: string
}

export function ProfileDialog({ children }: ProfileDialogProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    realName: "",
    username: "",
    email: "",
    bio: "",
    gender: undefined,
    mobileNumber: ""
  })
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id && isOpen) {
        // Load existing profile data
        const savedProfile = await getUserProfile(user.id)
        
        if (savedProfile) {
          setProfileData({
            realName: savedProfile.realName,
            username: savedProfile.username,
            email: savedProfile.email,
            bio: savedProfile.bio || "",
            gender: savedProfile.gender,
            mobileNumber: savedProfile.mobileNumber || ""
          })
          setCurrentProfileImage(savedProfile.profileImageUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture)
        } else {
          // Use Supabase user data as fallback
          setProfileData({
            realName: user.user_metadata?.full_name || user.user_metadata?.name || "",
            username: user.email?.split('@')[0] || "",
            email: user.email || "",
            bio: "",
            gender: undefined,
            mobileNumber: ""
          })
          setCurrentProfileImage(user.user_metadata?.avatar_url || user.user_metadata?.picture)
        }
      }
    }
    
    loadProfile()
  }, [user, isOpen])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
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
        gender: profileData.gender,
        mobileNumber: profileData.mobileNumber?.trim()
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        // Close dialog immediately
        setIsOpen(false)
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Failed to update profile")
      console.error("Profile update error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size must be less than 5MB")
      return
    }

    setIsLoading(true)
    try {
      const result = await uploadProfileImage(file, user.id)
      
      if (result.success) {
        // Update the profile with the new image URL
        await updateUserProfile(user.id, {
          profileImageUrl: result.url!,
          profileImagePath: result.path!
        })
        
        // Update local state to show the new image immediately
        setCurrentProfileImage(result.url!)
        
        toast.success("Avatar updated successfully")
      } else {
        toast.error(result.error || "Failed to upload avatar")
      }
    } catch (error) {
      toast.error("Failed to upload avatar")
      console.error("Avatar upload error:", error)
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
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentProfileImage || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
                <AvatarFallback className="text-lg">
                  {profileData.realName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Icons.camera className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to update your profile picture
            </p>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="realName">Full Name</Label>
              <Input
                id="realName"
                value={profileData.realName}
                onChange={(e) => handleInputChange("realName", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profileData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={profileData.mobileNumber}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}