import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider";
import { ProfileCompletionDialog } from "@/components/profile/profile-completion-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fellowz - Real-time Messaging & Friend Connections",
  description: "Connect with friends and family in real-time. Experience seamless messaging with our modern chat application built for meaningful connections.",
  keywords: ["chat", "messaging", "real-time", "friends", "social", "connections", "Fellowz", "Next.js", "Socket.io", "Prisma"],
  authors: [{ name: "Fellowz Team" }],
  openGraph: {
    title: "Fellowz - Connect. Chat. Build Friendships.",
    description: "Real-time messaging application designed for meaningful connections",
    url: "",
    siteName: "Fellowz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fellowz - Real-time Messaging",
    description: "Connect with friends and family through seamless conversations",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`} suppressHydrationWarning
      >
        <SupabaseAuthProvider>
          {children}
          <ProfileCompletionDialog />
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
