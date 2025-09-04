"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { uploadChatImage } from "@/lib/supabase"
import { useAuth } from "@/components/providers/supabase-auth-provider"

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string, imagePath: string) => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({ onImageUploaded, disabled, className }: ImageUploadProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.uid) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (10MB limit for chat images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB")
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadChatImage(file, user.uid)
      
      if (result.success) {
        onImageUploaded(result.url!, result.path!)
        toast.success("Image uploaded successfully")
      } else {
        toast.error(result.error || "Failed to upload image")
      }
    } catch (error) {
      toast.error("Failed to upload image")
      console.error("Image upload error:", error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={className}
        title="Upload image"
      >
        {isUploading ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.image className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </>
  )
}

// Image preview component for displaying uploaded images in chat
interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
  onLoad?: () => void
}

export function ImagePreview({ src, alt = "Uploaded image", className, onLoad }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-32 bg-muted rounded-lg border">
        <div className="text-center">
          <Icons.imageOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`max-w-full h-auto rounded-lg border ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        style={{ maxHeight: '300px' }}
      />
    </div>
  )
}