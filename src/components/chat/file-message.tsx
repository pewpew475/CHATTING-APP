"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface FileMessageProps {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  isOwnMessage?: boolean
}

export function FileMessage({ 
  fileUrl, 
  fileName, 
  fileSize, 
  fileType, 
  isOwnMessage = false 
}: FileMessageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Icons.image className="h-5 w-5" />
    } else if (type.startsWith("video/")) {
      return <Icons.video className="h-5 w-5" />
    } else if (type.includes("pdf")) {
      return <Icons.file className="h-5 w-5 text-red-500" />
    } else if (type.includes("word")) {
      return <Icons.file className="h-5 w-5 text-blue-500" />
    } else {
      return <Icons.file className="h-5 w-5" />
    }
  }

  const isImage = fileType.startsWith("image/")
  const isVideo = fileType.startsWith("video/")

  if (isImage) {
    return (
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "ml-auto" : "mr-auto"}`}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer group relative">
              <img
                src={fileUrl}
                alt={fileName}
                className="rounded-lg max-w-full h-auto max-h-64 object-cover shadow-md group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                <Icons.search className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{fileName}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = fileUrl
                    link.download = fileName
                    link.click()
                  }}
                >
                  <Icons.download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full h-auto max-h-[80vh] object-contain mx-auto"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {fileName} • {formatFileSize(fileSize)}
        </p>
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "ml-auto" : "mr-auto"}`}>
        <div className="rounded-lg overflow-hidden shadow-md">
          <video
            src={fileUrl}
            controls
            className="max-w-full h-auto max-h-64"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {fileName} • {formatFileSize(fileSize)}
        </p>
      </div>
    )
  }

  // For other file types, show as card
  return (
    <Card className={`max-w-xs ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          {getFileIcon(fileType)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs opacity-70">{formatFileSize(fileSize)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              const link = document.createElement("a")
              link.href = fileUrl
              link.download = fileName
              link.click()
            }}
          >
            <Icons.download className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}