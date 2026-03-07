/**
 * Hook for uploading images to Supabase Storage
 * 
 * Features:
 * - Upload to Supabase Storage
 * - Generate unique filenames
 * - Image compression/resize
 * - Progress tracking
 * - Error handling
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UploadOptions {
  bucket?: string
  folder?: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

interface UploadResult {
  url: string | null
  error: string | null
}

interface UseImageUploadReturn {
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>
  uploadCVProfileImage: (file: File, userId: string) => Promise<UploadResult>
  deleteImage: (url: string, bucket?: string) => Promise<{ error: string | null }>
  isUploading: boolean
  progress: number
}

/**
 * Compress and resize image before upload
 */
async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not create blob'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('Could not load image'))
    }
  })
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(file: File): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${random}.${extension}`
}

/**
 * Hook for image uploads
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Upload image to Supabase Storage
   */
  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    const {
      bucket = 'cv-images',
      folder = 'profiles',
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.85,
    } = options

    setIsUploading(true)
    setProgress(0)

    try {
      // Compress image
      setProgress(10)
      const compressedBlob = await compressImage(file, { maxWidth, maxHeight, quality })
      setProgress(30)

      // Generate unique filename
      const filename = generateUniqueFilename(file)
      const path = folder ? `${folder}/${filename}` : filename

      // Upload to Supabase
      setProgress(50)
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setProgress(80)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      setProgress(100)
      
      return { url: publicUrl, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Uppladdning misslyckades'
      return { url: null, error: message }
    } finally {
      setIsUploading(false)
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 500)
    }
  }, [])

  /**
   * Upload CV profile image
   * Organized by user ID for easy management
   */
  const uploadCVProfileImage = useCallback(async (
    file: File,
    userId: string
  ): Promise<UploadResult> => {
    return upload(file, {
      bucket: 'cv-images',
      folder: `profiles/${userId}`,
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.9,
    })
  }, [upload])

  /**
   * Delete image from storage
   */
  const deleteImage = useCallback(async (
    url: string,
    bucket: string = 'cv-images'
  ): Promise<{ error: string | null }> => {
    try {
      // Extract path from URL
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`))
      
      if (!pathMatch) {
        throw new Error('Invalid image URL')
      }
      
      const path = pathMatch[1]
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        throw new Error(error.message)
      }

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ta bort bilden'
      return { error: message }
    }
  }, [])

  return {
    upload,
    uploadCVProfileImage,
    deleteImage,
    isUploading,
    progress,
  }
}

export default useImageUpload
