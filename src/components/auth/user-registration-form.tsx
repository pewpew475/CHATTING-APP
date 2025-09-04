"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { uploadProfileImage } from "@/lib/supabase"
import { saveUserProfile } from "@/lib/profile-storage"

interface UserRegistrationFormProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    email?: string
    realName?: string
    photoURL?: string
  }
}

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

export function UserRegistrationForm({ isOpen, onClose, initialData }: UserRegistrationFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [profileImage, setProfileImage] = useState<string | null>(initialData?.photoURL || null)
  
  const [userData, setUserData] = useState<UserData>({
    realName: initialData?.realName || "",
    username: "",
    email: initialData?.email || "",
    bio: "",
    gender: "",
    mobileNumber: "",
    location: "",
    dateOfBirth: ""
  })

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate username from real name if username is empty
    if (field === "realName" && !userData.username) {
      const generatedUsername = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20)
      
      if (generatedUsername) {
        setUserData(prev => ({ ...prev, username: generatedUsername }))
      }
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

  const validateStep1 = () => {
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
    return true
  }

  const validateStep2 = () => {
    if (userData.mobileNumber && !/^\+?[\d\s\-\(\)]+$/.test(userData.mobileNumber)) {
      toast.error("Please enter a valid phone number")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!validateStep2() || !user?.id) return

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
        // Close the dialog immediately without any delays
        onClose()
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

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleOutsideClick = (e: Event) => {
    if (!isLoading) {
      e.preventDefault()
      onClose()
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information"
      case 2: return "Additional Details"
      case 3: return "Profile Picture"
      default: return "Setup Profile"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Let's start with the basics"
      case 2: return "Tell us more about yourself"
      case 3: return "Add a profile picture to complete your profile"
      default: return "Complete your profile setup"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto" 
        onPointerDownOutside={handleOutsideClick}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">F</span>
              </div>
              {getStepTitle()}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading}
              className="h-6 w-6"
            >
              <Icons.x className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step <= currentStep
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="realName">Full Name *</Label>
                <Input
                  id="realName"
                  value={userData.realName}
                  onChange={(e) => handleInputChange("realName", e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={userData.username}
                  onChange={(e) => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Choose a unique username"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  This will be your unique identifier on Fellowz (letters and numbers only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={true} // Email is usually from auth provider
                />
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
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
          )}

          {/* Step 3: Profile Picture */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileImage || initialData?.photoURL} />
                    <AvatarFallback className="text-2xl">
                      {userData.realName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
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
                <p className="text-sm text-muted-foreground text-center">
                  Click the camera icon to upload a profile picture
                </p>
              </div>

              {/* Profile Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Profile Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {userData.realName}</p>
                  <p><span className="font-medium">Username:</span> @{userData.username}</p>
                  <p><span className="font-medium">Email:</span> {userData.email}</p>
                  {userData.bio && <p><span className="font-medium">Bio:</span> {userData.bio}</p>}
                  {userData.location && <p><span className="font-medium">Location:</span> {userData.location}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              Back
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isLoading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Complete Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}