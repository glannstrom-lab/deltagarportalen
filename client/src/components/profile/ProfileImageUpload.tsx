/**
 * ProfileImageUpload - Profilbildsuppladdning med text-knappar under bilden
 */

import { useState, useRef } from 'react'
import { Camera, Loader2 } from '@/components/ui/icons'
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
    lg: 'w-24 h-24'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Välj en bildfil')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max 5MB')
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const url = await profileImageApi.upload(file)
      onImageChange(url)
      setPreview(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Uppladdning misslyckades')
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
      setError('Kunde inte ta bort')
    } finally {
      setUploading(false)
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Image */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-400 to-sky-400 dark:from-teal-500 dark:to-sky-500 flex items-center justify-center shadow-lg flex-shrink-0',
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
            size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
          )} />
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Text buttons below image */}
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium disabled:opacity-50"
        >
          {displayImage ? 'Byt bild' : 'Ladda upp'}
        </button>
        {displayImage && !uploading && (
          <>
            <span className="text-stone-300 dark:text-stone-600">|</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Ta bort
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
