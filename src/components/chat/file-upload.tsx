"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import Image from "next/image"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { uploadChatImage } from "@/lib/supabase"

interface FileUploadProps {
  onFileUpload: (fileData: {
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
  }) => void
  disabled?: boolean
}

interface SelectedFile {
  file: File
  preview: string
  type: string
}

export function FileUpload({ onFileUpload, disabled = false }: FileUploadProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mpeg",
      "video/webm",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not allowed")
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedFile({
          file,
          preview: e.target?.result as string,
          type: file.type
        })
      }
      reader.readAsDataURL(file)
    } else {
      // For non-images, just store the file
      setSelectedFile({
        file,
        preview: "",
        type: file.type
      })
    }
  }

  const uploadFile = async () => {
    if (!selectedFile || !user?.id) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      let result;
      
      // Use Supabase for images, fallback to API for other files
      if (selectedFile.type.startsWith("image/")) {
        result = await uploadChatImage(selectedFile.file, user.id)
        
        if (!result.success) {
          throw new Error(result.error || "Upload failed")
        }
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        // Call parent callback
        onFileUpload({
          fileUrl: result.url!,
          fileName: selectedFile.file.name,
          fileSize: selectedFile.file.size,
          fileType: selectedFile.file.type
        })
      } else {
        // For non-images, use the API endpoint (you can implement this later)
        const formData = new FormData()
        formData.append("file", selectedFile.file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const apiResult = await response.json()
        
        // Call parent callback
        onFileUpload({
          fileUrl: apiResult.fileUrl,
          fileName: apiResult.fileName,
          fileSize: apiResult.fileSize,
          fileType: apiResult.fileType
        })
      }

      toast.success("File uploaded successfully")
      
      // Clear selected file
      setSelectedFile(null)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      // Create a proper file list and call handleFileSelect directly
      const fileList = new DataTransfer()
      fileList.items.add(file)
      const input = document.createElement('input')
      input.type = 'file'
      input.files = fileList.files
      
      const changeEvent = {
        target: input
      } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(changeEvent)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Icons.image className="h-8 w-8" />
    } else if (fileType.startsWith("video/")) {
      return <Icons.video className="h-8 w-8" />
    } else {
      return <Icons.file className="h-8 w-8" />
    }
  }

  // Show file preview if file is selected
  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-card">
          {selectedFile.type.startsWith("image/") ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-sm mx-auto">
                <Image
                  src={selectedFile.preview}
                  alt="Preview"
                  width={300}
                  height={200}
                  className="rounded-lg object-cover w-full h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium truncate">{selectedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.file.size)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="text-muted-foreground">
                {getFileIcon(selectedFile.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.file.size)}
                </p>
              </div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icons.spinner className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={uploadFile} 
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icons.send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            <Icons.x className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Show file selection interface
  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,.pdf,.txt,.doc,.docx"
        disabled={disabled}
      />
      
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-3">
          <Icons.paperclip className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Images, videos, PDFs, documents (max 10MB)
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Icons.paperclip className="h-4 w-4 mr-2" />
          Choose File
        </Button>
      </div>
    </div>
  )
}