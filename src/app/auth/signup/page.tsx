"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      toast.success("Redirecting to Google for authentication...")
      toast.info("You'll be redirected back after signing in")
      
      await signInWithGoogle()
      // After successful Google auth, user will be redirected to setup-profile page
    } catch (error: any) {
      console.error("Google auth error:", error)
      toast.error("Authentication failed. Please try again.")
      setIsLoading(false)
    }
  }

  const handleEmailSignup = () => {
    // Redirect to email signup form page
    router.push("/auth/signup/email")
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
            <CardTitle className="text-2xl">Join Fellowz</CardTitle>
            <CardDescription className="text-purple-100">
              Create your account and start connecting with friends
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
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              {/* Email Signup Button */}
              <Button
                onClick={handleEmailSignup}
                className="w-full h-12"
                disabled={isLoading}
              >
                <Icons.mail className="mr-2 h-5 w-5" />
                Sign up with Email
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <Link href="/" className="text-sm text-muted-foreground hover:underline">
                  ← Back to home
                </Link>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="#" className="hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" className="hover:underline">Privacy Policy</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}