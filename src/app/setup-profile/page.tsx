"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { uploadProfileImage } from "@/lib/supabase"
import { saveUserProfile, hasCompletedProfileSync } from "@/lib/profile-storage"
import { checkUsernameAvailability, generateUsernameSuggestions } from "@/lib/username-checker"

interface UserData {
  realName: string
  username: string
  email: string
  bio: string
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | ""
  mobileNumber: string
  location: string
  dateOfBirth: string
}

export default function SetupProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [profileImage, setProfileImage] = useState<string | null>((user?.user_metadata?.avatar_url as string | undefined) || (user?.user_metadata?.picture as string | undefined) || null)
  
  const [userData, setUserData] = useState<UserData>({
    realName: (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || "",
    username: "",
    email: user?.email || "",
    bio: "",
    gender: "",
    mobileNumber: "",
    location: "",
    dateOfBirth: ""
  })

  // Redirect if not authenticated or if profile is already completed
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
    
    if (user && !loading) {
      // Check if user has already completed their profile
      const profileCompleted = hasCompletedProfileSync(user.id)
      if (profileCompleted) {
        console.log('Profile already completed, redirecting to main app')
        router.push("/")
      }
    }
  }, [user, loading, router])

  // Auto-generate username from real name
  useEffect(() => {
    if (userData.realName && !userData.username) {
      const generatedUsername = userData.realName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20)
      
      if (generatedUsername) {
        setUserData(prev => ({ ...prev, username: generatedUsername }))
      }
    }
  }, [userData.realName, userData.username])

  // Check username availability
  const checkUsernameAvailabilityLocal = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      setUsernameSuggestions([])
      return
    }

    setIsCheckingUsername(true)
    try {
      const result = await checkUsernameAvailability(username)
      setUsernameAvailable(result.available)
      
      if (!result.available) {
        // Generate suggestions when username is taken
        const suggestions = generateUsernameSuggestions(username, 3)
        setUsernameSuggestions(suggestions)
      } else {
        setUsernameSuggestions([])
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
      setUsernameSuggestions([])
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userData.username) {
        checkUsernameAvailabilityLocal(userData.username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [userData.username])

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
    
    // Reset username availability when username changes
    if (field === 'username') {
      setUsernameAvailable(null)
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
        setProfileImage(result.url!)
        toast.success("Profile picture uploaded successfully")
      } else {
        toast.error(result.error || "Failed to upload profile picture")
      }
    } catch (error) {
      toast.error("Failed to upload profile picture")
      console.error("Avatar upload error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    if (!userData.realName.trim()) {
      toast.error("Please enter your full name")
      return false
    }
    if (!userData.username.trim()) {
      toast.error("Please enter a username")
      return false
    }
    if (userData.username.length < 3) {
      toast.error("Username must be at least 3 characters long")
      return false
    }
    if (usernameAvailable === false) {
      toast.error("Username is already taken. Please choose another one.")
      return false
    }
    if (userData.mobileNumber && !/^\+?[\d\s\-\(\)]+$/.test(userData.mobileNumber)) {
      toast.error("Please enter a valid phone number")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user?.id) return

    setIsLoading(true)
    try {
      const result = await saveUserProfile({
        userId: user.id,
        realName: userData.realName,
        username: userData.username,
        email: userData.email,
        bio: userData.bio || undefined,
        gender: userData.gender || undefined,
        mobileNumber: userData.mobileNumber || undefined,
        location: userData.location || undefined,
        dateOfBirth: userData.dateOfBirth || undefined,
        profileImageUrl: profileImage || undefined
      })

      if (result.success) {
        toast.success("Welcome to Fellowz! Your profile has been created.")
        // Small delay to ensure profile is saved before redirect
        setTimeout(() => {
          router.push("/") // Redirect to chat app
        }, 500)
      } else {
        toast.error(result.error || "Failed to create profile. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to create profile. Please try again.")
      console.error("Profile creation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Icons.spinner className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-2xl font-bold">F</span>
            </div>
            <CardTitle className="text-2xl">Complete Your Fellowz Profile</CardTitle>
            <CardDescription className="text-purple-100">
              Let's set up your profile to get started with Fellowz
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileImage || (user.user_metadata?.avatar_url as string | undefined) || (user.user_metadata?.picture as string | undefined)} />
                    <AvatarFallback className="text-2xl">
                      {userData.realName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Icons.camera className="h-5 w-5" />
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
                <p className="text-sm text-muted-foreground text-center">
                  Click the camera icon to upload a profile picture
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="realName">Full Name *</Label>
                  <Input
                    id="realName"
                    value={userData.realName}
                    onChange={(e) => handleInputChange("realName", e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={userData.username}
                      onChange={(e) => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder="Choose a unique username"
                      disabled={isLoading}
                      required
                      className={`pr-10 ${
                        usernameAvailable === true ? 'border-green-500' : 
                        usernameAvailable === false ? 'border-red-500' : ''
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCheckingUsername && (
                        <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!isCheckingUsername && usernameAvailable === true && (
                        <Icons.check className="h-4 w-4 text-green-500" />
                      )}
                      {!isCheckingUsername && usernameAvailable === false && (
                        <Icons.x className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usernameAvailable === false ? (
                      <span className="text-red-500">Username is already taken</span>
                    ) : usernameAvailable === true ? (
                      <span className="text-green-500">Username is available</span>
                    ) : (
                      "Letters and numbers only, minimum 3 characters"
                    )}
                  </p>
                  
                  {/* Username Suggestions */}
                  {usernameSuggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Try these suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {usernameSuggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => handleInputChange("username", suggestion)}
                            disabled={isLoading}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  placeholder="your.email@example.com"
                  disabled={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={userData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={userData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender (optional)" />
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
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={userData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Phone Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={userData.mobileNumber}
                    onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={userData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isLoading || isCheckingUsername || usernameAvailable === false}
                  className="px-8 py-3 text-lg"
                >
                  {isLoading && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
                  Complete Profile & Start Chatting
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}