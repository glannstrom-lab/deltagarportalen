/**
 * Hook for uploading images to Vercel Blob Storage
 * Simpler and more reliable than Supabase Storage
 */

import { useState, useCallback } from 'react'

interface UploadResult {
  url: string | null
  error: string | null
}

interface UseVercelImageUploadReturn {
  upload: (file: File) => Promise<UploadResult>
  isUploading: boolean
  progress: number
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(file: File): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  return `cv-profile-${timestamp}-${random}.${extension}`
}

/**
 * Hook for image uploads to Vercel Blob
 */
export function useVercelImageUpload(): UseVercelImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setProgress(0)

    try {
      // Generate unique filename
      const filename = generateUniqueFilename(file)
      
      setProgress(30)

      // Upload directly to Vercel Blob
      // Note: This requires a Vercel Blob token set in environment variables
      const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      setProgress(80)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Uppladdning misslyckades')
      }

      const { url } = await response.json()
      setProgress(100)

      return { url, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Uppladdning misslyckades'
      return { url: null, error: message }
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 500)
    }
  }, [])

  return {
    upload,
    isUploading,
    progress,
  }
}

export default useVercelImageUpload
