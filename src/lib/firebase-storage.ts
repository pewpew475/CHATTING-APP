// Firebase Storage service for file uploads
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata
} from 'firebase/storage'
import { storage } from './firebase'

// Image upload utility functions
export const uploadImage = async (file: File, userId: string, folder: string = 'chat-images') => {
  try {
    console.log('Starting image upload:', { fileName: file.name, fileSize: file.size, fileType: file.type, userId, folder })
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`
    
    console.log('Uploading to Firebase storage:', fileName)
    
    // Create a reference to the file
    const fileRef = ref(storage, fileName)
    
    // Upload the file
    const uploadResult = await uploadBytes(fileRef, file, {
      contentType: file.type
    })

    console.log('Upload successful, getting download URL for:', fileName)

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref)

    console.log('Download URL generated:', downloadURL)

    return {
      success: true,
      url: downloadURL,
      path: fileName
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export const uploadProfileImage = async (file: File, userId: string) => {
  // Upload to Firebase storage
  const result = await uploadImage(file, userId, 'profile-pictures')
  
  if (result.success) {
    return result
  }
  
  // Only use local API fallback in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase storage failed, trying local API fallback...')
    return await uploadImageLocal(file, userId)
  }
  
  // In production, return the Firebase error
  console.error('Firebase storage failed in production, no fallback available')
  return result
}

// Fallback upload using local API
const uploadImageLocal = async (file: File, userId: string) => {
  try {
    console.log('Uploading via local API fallback...')
    
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Local API upload successful:', result.fileUrl)
      return {
        success: true,
        url: result.fileUrl,
        path: result.fileName
      }
    } else {
      throw new Error(result.error || 'Local API upload failed')
    }
  } catch (error) {
    console.error('Local API upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Local API upload failed'
    }
  }
}

// Test storage bucket access
export const testStorageAccess = async () => {
  try {
    console.log('Testing Firebase storage access...')
    
    // Try to get metadata of a test file (this will fail but we can check the error)
    const testRef = ref(storage, 'test-access-check')
    
    try {
      await getMetadata(testRef)
    } catch (error: any) {
      // If it's a "not found" error, storage is working
      if (error.code === 'storage/object-not-found') {
        console.log('Firebase storage access successful')
        return { success: true, data: 'Storage accessible' }
      }
      throw error
    }
    
    console.log('Firebase storage access successful')
    return { success: true, data: 'Storage accessible' }
  } catch (error) {
    console.error('Firebase storage test error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Storage test failed' 
    }
  }
}

export const uploadChatImage = async (file: File, userId: string) => {
  return uploadImage(file, userId, 'chat-images')
}

export const deleteImage = async (path: string) => {
  try {
    const fileRef = ref(storage, path)
    await deleteObject(fileRef)

    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

// Get download URL for a file (if needed)
export const getDownloadURL = async (path: string) => {
  try {
    const fileRef = ref(storage, path)
    const url = await getDownloadURL(fileRef)

    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Error getting download URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    }
  }
}
