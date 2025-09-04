// src/lib/supabase.ts
// Initialize Supabase client for messages storage and file uploads
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Image upload utility functions
export const uploadImage = async (file: File, userId: string, folder: string = 'chat-images') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

export const uploadProfileImage = async (file: File, userId: string) => {
  return uploadImage(file, userId, 'profile-pictures');
};

export const uploadChatImage = async (file: File, userId: string) => {
  return uploadImage(file, userId, 'chat-images');
};

export const deleteImage = async (path: string) => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

// Get signed URL for private images (if needed)
export const getSignedUrl = async (path: string, expiresIn: number = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return {
      success: true,
      url: data.signedUrl
    };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get signed URL'
    };
  }
};