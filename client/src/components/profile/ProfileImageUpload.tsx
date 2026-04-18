/**
 * ProfileImageUpload - Profilbildsuppladdning med förhandsgranskning
 */

import { useState, useRef } from 'react'
import { Camera, Loader2, X, Upload } from '@/components/ui/icons'
import { profileImageApi } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

interface Props {
  currentImage?: string | null
  onImageChange: (url: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProfileImageUpload({ currentImage, onImageChange, size = 'md', className }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Välj en bildfil')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Bilden måste vara mindre än 5MB')
      return
    }

    setError(null)

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const url = await profileImageApi.upload(file)
      onImageChange(url)
      setPreview(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Kunde inte ladda upp bilden')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Vill du ta bort din profilbild?')) return

    setUploading(true)
    try {
      await profileImageApi.delete()
      onImageChange(null)
    } catch (err) {
      console.error('Delete error:', err)
      setError('Kunde inte ta bort bilden')
    } finally {
      setUploading(false)
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className={cn('relative inline-block p-2', className)}>
      <div
        className={cn(
          'rounded-2xl overflow-hidden bg-gradient-to-br from-teal-400 to-sky-400 dark:from-teal-500 dark:to-sky-500 flex items-center justify-center shadow-lg',
          sizeClasses[size]
        )}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profilbild"
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className={cn(
            'text-white',
            size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'
          )} />
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload button - bottom right, outside image */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'absolute bottom-0 right-0 bg-white dark:bg-stone-700 text-teal-600 dark:text-teal-400',
          'rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform',
          'border border-teal-200 dark:border-teal-700 disabled:opacity-50',
          size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'
        )}
        title="Ladda upp bild"
      >
        <Upload className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      </button>

      {/* Remove button - top right, outside image */}
      {displayImage && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            'absolute top-0 right-0 bg-red-500 text-white',
            'rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors',
            size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
          )}
          title="Ta bort bild"
        >
          <X className={size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="absolute top-full mt-1 text-xs text-red-500 dark:text-red-400 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  )
}
