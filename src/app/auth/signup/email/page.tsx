"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function EmailSignUpPage() {
  const { signUpWithEmail } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

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
      // Create account with minimal info, full profile setup will happen on next page
      await signUpWithEmail(
        signUpData.email, 
        signUpData.password
        // userData will be filled in profile setup
      )
      toast.success("Account created successfully!")
      // Profile completion will be shown as a popup on home
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Email is already registered. Please sign in instead.")
      } else if (error.code === 'auth/weak-password') {
        toast.error("Password is too weak. Please choose a stronger password.")
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.")
      } else {
        toast.error("Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-4 py-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-2xl font-bold">F</span>
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription className="text-purple-100">
              Sign up with your email to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <Link href="/auth/signup" className="text-sm text-muted-foreground hover:underline">
                ← Other signup options
              </Link>
            </div>

            <div className="mt-4 text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="#" className="hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="hover:underline">Privacy Policy</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}