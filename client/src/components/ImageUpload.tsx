/**
 * Image Upload Component for Profile Picture
 * 
 * Features:
 * - Drag & drop support
 * - Image preview
 * - File validation (type, size)
 * - Image cropping/resize option
 * - Upload progress
 * - Error handling
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, User, Loader2, Camera, Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string | null>
  className?: string
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const DEFAULT_MAX_SIZE = 5 // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
  maxSizeMB = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Ogiltigt filformat. Tillåtna format: ${acceptedTypes.map(t => t.replace('image/', '.')).join(', ')}`
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Filen är för stor. Max storlek: ${maxSizeMB}MB`
    }
    
    return null
  }

  // Handle file selection
  const handleFile = async (file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Create local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    // Upload if handler provided
    if (onUpload) {
      setIsUploading(true)
      try {
        const uploadedUrl = await onUpload(file)
        if (uploadedUrl) {
          onChange(uploadedUrl)
          setPreviewUrl(uploadedUrl)
        } else {
          throw new Error('Uppladdning misslyckades')
        }
      } catch (err) {
        setError('Kunde inte ladda upp bilden. Försök igen.')
        setPreviewUrl(value || null)
      } finally {
        setIsUploading(false)
      }
    } else {
      // Just use local URL if no upload handler
      onChange(localUrl)
    }
  }

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  // Handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault()
    
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          await handleFile(file)
          break
        }
      }
    }
  }, [])

  // Add paste event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('paste', handlePaste)
    return () => container.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        className={cn(
          'relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden',
          'border-2 border-dashed',
          isDragging && 'border-violet-500 bg-violet-50 scale-[1.02]',
          !isDragging && !previewUrl && 'border-slate-300 hover:border-violet-400 hover:bg-slate-50',
          previewUrl && 'border-solid border-violet-200'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Ladda upp profilbild"
        />

        {/* Preview State */}
        {previewUrl ? (
          <div className="relative aspect-square max-w-[200px] mx-auto">
            <img
              src={previewUrl}
              alt="Profilbild förhandsvisning"
              className="w-full h-full object-cover rounded-xl"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
                className="text-white bg-white/20 hover:bg-white/30 border-0"
              >
                <Camera className="w-4 h-4 mr-1" />
                Ändra
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Ta bort
              </Button>
            </div>

            {/* Uploading overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white text-sm mt-2">Laddar upp...</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? 'Släpp bilden här' : 'Ladda upp profilbild'}
              </p>
              <p className="text-xs text-slate-500">
                Klicka, dra och släpp, eller klistra in (Ctrl+V)
              </p>
              <p className="text-xs text-slate-400">
                {acceptedTypes.map(t => t.replace('image/', '.').toUpperCase()).join(', ')} upp till {maxSizeMB}MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Välj bild
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {previewUrl && !error && (
        <p className="text-xs text-slate-500 text-center">
          Rekommenderad storlek: 400x400px
        </p>
      )}
    </div>
  )
}

/**
 * Compact version for use in forms
 */
export function CompactImageUpload({
  value,
  onChange,
  onUpload,
  className,
  maxSizeMB = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasteMessage, setPasteMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Ogiltigt filformat'
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Filen är för stor (max ${maxSizeMB}MB)`
    }
    return null
  }

  const handleFile = async (file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    if (onUpload) {
      setIsUploading(true)
      try {
        const uploadedUrl = await onUpload(file)
        if (uploadedUrl) {
          onChange(uploadedUrl)
        }
      } catch (err) {
        setError('Uppladdning misslyckades')
      } finally {
        setIsUploading(false)
      }
    } else {
      const localUrl = URL.createObjectURL(file)
      onChange(localUrl)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // Handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault()
    
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          setPasteMessage('Bild inklistrad!')
          setTimeout(() => setPasteMessage(null), 2000)
          await handleFile(file)
          break
        }
      }
    }
  }, [])

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div ref={containerRef} className={cn('flex items-center gap-4', className)}>
      {/* Avatar Preview */}
      <div className="relative">
        <div className={cn(
          'w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center',
          value ? 'ring-2 ring-violet-500 ring-offset-2' : 'border-2 border-dashed border-slate-300'
        )}>
          {value ? (
            <img
              src={value}
              alt="Profilbild"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-slate-400" />
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            {value ? 'Ändra bild' : 'Ladda upp'}
          </Button>
          
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Ta bort
            </Button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        
        {pasteMessage && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Clipboard className="w-3 h-3" />
            {pasteMessage}
          </p>
        )}
        
        <p className="text-xs text-slate-500">
          JPG, PNG eller WebP, max {maxSizeMB}MB
        </p>
        <p className="text-xs text-slate-400">
          Tips: Kopiera en bild och tryck Ctrl+V för att klistra in
        </p>
      </div>
    </div>
  )
}

export default ImageUpload
