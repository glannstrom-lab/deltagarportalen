/**
 * Hook for uploading images to Vercel Blob Storage
 * Simpler and more reliable than Supabase Storage
 *
 * 2026-05-15: /api/upload-image kräver Bearer-token (säkerhetsfix).
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

      setProgress(20)

      // Hämta auth-token — /api/upload-image kräver Bearer (2026-05-15)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { url: null, error: 'Du måste vara inloggad för att ladda upp bilder' }
      }

      setProgress(40)

      const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Authorization': `Bearer ${session.access_token}`,
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
