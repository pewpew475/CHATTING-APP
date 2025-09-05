"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/ui/icons"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { toast } from "sonner"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "signin" | "signup"
}

export function AuthDialog({ isOpen, onClose, defaultTab = "signin" }: AuthDialogProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  // Removed legacy post-Google basic info form; profile completion handled elsewhere
  
  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  })
  
  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    realName: "",
    username: ""
  })

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      
      // Show redirect message
      toast.success("Redirecting to Google for authentication...")
      toast.info("You'll be redirected back after signing in")
      
      const result = await signInWithGoogle()
      
      // Since we always use redirect now, result will always be undefined
      // The redirect will handle the authentication
      // Don't close the dialog or set loading to false, as we're redirecting
      return
      
    } catch (error: any) {
      console.error("Google auth error:", error)
      toast.error("Authentication failed. Please try again.")
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signInWithEmail(signInData.email, signInData.password)
      onClose()
      toast.success("Welcome back!")
    } catch (error) {
      toast.error("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (signUpData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    setIsLoading(true)
    
    try {
      await signUpWithEmail(
        signUpData.email, 
        signUpData.password, 
        {
          realName: signUpData.realName,
          username: signUpData.username
        }
      )
      onClose()
      toast.success("Account created successfully!")
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Email is already registered. Please sign in instead.")
        setActiveTab("signin")
      } else {
        toast.error("Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Update user profile with additional details
      // This would typically involve updating the user's profile in your database
      console.log("Updating user profile:", signUpData)
      
      onClose()
      toast.success("Profile completed successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForms = () => {
    setSignInData({ email: "", password: "" })
    setSignUpData({ email: "", password: "", confirmPassword: "", realName: "", username: "" })
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  // Removed legacy showUserForm UI

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            Sign in to Fellowz
          </DialogTitle>
          <DialogDescription>
            Connect with friends and start chatting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Social Auth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Icons.mail className="mr-2 h-4 w-4" />
              Continue with Microsoft
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          {/* Email/Password Forms */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      value={signUpData.realName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, realName: e.target.value }))}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      value={signUpData.username}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                      placeholder="username"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}