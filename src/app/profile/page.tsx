"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { ArrowLeft, Edit, Mail, Phone, User, Calendar, MapPin, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { getRandomAvatar } from "@/components/providers/firebase-auth-provider"
import { getUserProfile, updateUserProfile, getProfileCompletionPercentageAsync } from "@/lib/profile-storage"
import { EmailNotificationsDialog } from "@/components/profile/email-notifications-dialog"
import { PrivacySettingsDialog } from "@/components/profile/privacy-settings-dialog"
import { TwoFactorAuthDialog } from "@/components/profile/two-factor-auth-dialog"

interface ProfileData {
  realName: string
  username: string
  email: string
  bio?: string
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"
  mobileNumber?: string
  location?: string
  website?: string
  joinedDate?: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    realName: "",
    username: "",
    email: "",
    bio: "",
    gender: undefined,
    mobileNumber: "",
    location: "",
    website: "",
    joinedDate: ""
  })
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(null)

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        console.log('Loading profile for user:', user.id)
        
        // Generate random avatar if none exists
        
        // Load saved profile data
        const savedProfile = await getUserProfile(user.id)
        console.log('Saved profile from database:', savedProfile)
        const completion = await getProfileCompletionPercentageAsync(user.id)
        console.log('Profile completion percentage:', completion)
        
        setProfileCompletion(completion)
        
        if (savedProfile) {
          const profileData = {
            realName: savedProfile.realName,
            username: savedProfile.username,
            email: savedProfile.email,
            bio: savedProfile.bio || "",
            gender: savedProfile.gender,
            mobileNumber: savedProfile.mobileNumber || "",
            location: savedProfile.location || "",
            website: "",
            joinedDate: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Recently"
          }
          setProfileData(profileData)
          setOriginalProfileData(profileData)
          setCurrentProfileImage(savedProfile.profileImageUrl || getRandomAvatar())
        } else {
          // Use Firebase user data as fallback
          const fallbackData = {
            realName: user.displayName || "Anonymous User",
            username: user.email?.split('@')[0] || "user",
            email: user.email || "",
            bio: "",
            gender: undefined,
            mobileNumber: "",
            location: "",
            website: "",
            joinedDate: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Recently"
          }
          setProfileData(fallbackData)
          setOriginalProfileData(fallbackData)
          setCurrentProfileImage(getRandomAvatar())
        }
      }
    }
    
    if (isClient && user) {
      loadProfile()
    }
  }, [user, isClient])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await updateUserProfile(user.id, {
        realName: profileData.realName,
        username: profileData.username,
        email: profileData.email,
        bio: profileData.bio,
        gender: profileData.gender,
        mobileNumber: profileData.mobileNumber,
        location: profileData.location,
        profileImageUrl: currentProfileImage || undefined
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        setOriginalProfileData(profileData)
        setIsEditing(false)
        
        // Update profile completion percentage
        const newCompletion = await getProfileCompletionPercentageAsync(user.id)
        setProfileCompletion(newCompletion)
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

  const handleCancelEdit = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData)
    }
    setIsEditing(false)
  }

  const handleGenerateNewAvatar = () => {
    const newAvatar = getRandomAvatar()
    setCurrentProfileImage(newAvatar)
    if (user?.id) {
      updateUserProfile(user.id, {
        profileImageUrl: newAvatar
      })
      toast.success("New avatar generated!")
    }
  }

  const getGenderDisplay = (gender?: string) => {
    switch (gender) {
      case "MALE": return "Male"
      case "FEMALE": return "Female"
      case "OTHER": return "Other"
      case "PREFER_NOT_TO_SAY": return "Prefer not to say"
      default: return "Not specified"
    }
  }

  
  // Show loading state during hydration or auth loading
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            variant={isEditing ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={currentProfileImage || getRandomAvatar()} />
                      <AvatarFallback className="text-2xl">
                        {profileData.realName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleGenerateNewAvatar}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                      disabled={isLoading}
                    >
                      <Icons.refresh className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">{profileData.realName}</h1>
                    <p className="text-muted-foreground">@{profileData.username}</p>
                    {profileData.bio && (
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {profileData.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {profileData.joinedDate}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-medium">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-muted-foreground">
                    Complete your profile to unlock all features
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Update your personal details" : "Your personal details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="realName">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="realName"
                        value={profileData.realName}
                        onChange={(e) => handleInputChange("realName", e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.realName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <span>@{profileData.username}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    {isEditing ? (
                      <Input
                        id="mobileNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={profileData.mobileNumber}
                        onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.mobileNumber || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditing ? (
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
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <span>{getGenderDisplay(profileData.gender)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={profileData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.location || "Not provided"}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      disabled={isLoading}
                      rows={4}
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-muted/50 min-h-[100px]">
                      <p className="text-sm whitespace-pre-wrap">
                        {profileData.bio || "No bio provided"}
                      </p>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account
                    </p>
                  </div>
                  <EmailNotificationsDialog>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </EmailNotificationsDialog>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Privacy Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile information
                    </p>
                  </div>
                  <PrivacySettingsDialog>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </PrivacySettingsDialog>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <TwoFactorAuthDialog>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </TwoFactorAuthDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}