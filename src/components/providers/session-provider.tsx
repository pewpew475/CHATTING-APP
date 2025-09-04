"use client"

// Replaced NextAuth's SessionProvider with a simple passthrough
// since we're using Supabase Auth via useAuth hook.

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProviderWrapper({ children }: SessionProviderProps) {
  return <>{children}</>
}