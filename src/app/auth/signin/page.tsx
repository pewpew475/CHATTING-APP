"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/firebase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function SignInPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  })

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      toast.success("Starting Google authentication...")
      
      const result = await signInWithGoogle()
      
      if (result.success) {
        toast.info("Authentication successful! Redirecting...")
        // Redirect will be handled by the auth provider or redirect flow
      } else {
        toast.error(result.error || "Authentication failed. Please try again.")
        setIsLoading(false)
      }
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
      toast.success("Welcome back!")
      router.push("/")
    } catch (error) {
      toast.error("Invalid email or password")
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
            <CardTitle className="text-2xl">Sign in to Fellowz</CardTitle>
            <CardDescription className="text-purple-100">
              Welcome back! Connect with friends and start chatting
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Social Auth Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <Icons.google className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  <Icons.mail className="mr-2 h-5 w-5" />
                  Continue with Microsoft
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
              
              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
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
                    value={signInData.password}
                    onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
                <Link href="/" className="text-sm text-muted-foreground hover:underline">
                  ← Back to home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}