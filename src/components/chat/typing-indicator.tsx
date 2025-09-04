"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  isTyping: boolean
  className?: string
}

export function TypingIndicator({ isTyping, className }: TypingIndicatorProps) {
  if (!isTyping) return null

  return (
    <div className={cn("flex items-center space-x-1 px-3 py-2", className)}>
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: ["0%", "-50%", "0%"],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: ["0%", "-50%", "0%"],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: ["0%", "-50%", "0%"],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  )
}