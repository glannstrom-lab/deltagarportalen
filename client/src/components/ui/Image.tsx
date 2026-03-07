/**
 * Optimized Image Component
 * - WebP/AVIF support with fallback
 * - Lazy loading
 * - Blur placeholder
 * - Responsive images
 */

import { useState, useEffect, useRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  width?: number
  height?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
  quality?: number
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  className?: string
  containerClassName?: string
  onLoad?: () => void
  onError?: () => void
}

/**
 * Check if browser supports WebP
 */
const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Check if browser supports AVIF
 */
const supportsAVIF = (): boolean => {
  // Simplified check - in production, use a more robust detection
  return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0
}

/**
 * Get optimized image URL
 * Converts image URL to WebP/AVIF format if supported
 */
const getOptimizedImageUrl = (src: string, format: 'webp' | 'avif' | 'original'): string => {
  // If it's already a data URL or external URL, return as-is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src
  }

  // For local images, we would typically use a service like Cloudinary, Imgix, or Sharp
  // This is a simplified example - in production, use a proper image optimization service
  if (format === 'original') {
    return src
  }

  // In a real implementation, you would:
  // 1. Use a CDN service like Cloudinary: `https://res.cloudinary.com/.../f_${format}/${src}`
  // 2. Or use Next.js Image component with optimization
  // 3. Or serve pre-generated images from /public with different extensions
  
  // For now, we'll append a query parameter that your server/CDN can use
  return `${src}?format=${format}`
}

/**
 * Optimized Image Component
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({
    src,
    alt,
    width,
    height,
    placeholder = 'empty',
    blurDataURL,
    loading = 'lazy',
    priority = false,
    quality = 75,
    sizes,
    objectFit = 'cover',
    className,
    containerClassName,
    onLoad,
    onError,
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [imageSrc, setImageSrc] = useState(src)
    const [supportsModernFormat, setSupportsModernFormat] = useState<'avif' | 'webp' | 'original'>('original')
    const imgRef = useRef<HTMLImageElement>(null)

    // Detect browser support for modern formats
    useEffect(() => {
      if (supportsAVIF()) {
        setSupportsModernFormat('avif')
      } else if (supportsWebP()) {
        setSupportsModernFormat('webp')
      }
    }, [])

    // Update image source when format support is detected
    useEffect(() => {
      if (supportsModernFormat !== 'original') {
        setImageSrc(getOptimizedImageUrl(src, supportsModernFormat))
      }
    }, [src, supportsModernFormat])

    // Handle image load
    const handleLoad = () => {
      setIsLoaded(true)
      onLoad?.()
    }

    // Handle image error
    const handleError = () => {
      setHasError(true)
      // Fallback to original format
      if (supportsModernFormat !== 'original') {
        setImageSrc(src)
        setSupportsModernFormat('original')
      }
      onError?.()
    }

    // Use Intersection Observer for lazy loading
    const [isInView, setIsInView] = useState(priority || loading === 'eager')
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (priority || loading === 'eager') {
        setIsInView(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: '50px', // Start loading 50px before image comes into view
        }
      )

      if (containerRef.current) {
        observer.observe(containerRef.current)
      }

      return () => observer.disconnect()
    }, [priority, loading])

    // Generate srcset for responsive images
    const generateSrcSet = () => {
      if (!width || width <= 0) return undefined

      const widths = [320, 640, 960, 1280, 1920]
      const relevantWidths = widths.filter(w => w <= width * 2)
      
      return relevantWidths
        .map(w => `${getOptimizedImageUrl(src, supportsModernFormat)}?w=${w} ${w}w`)
        .join(', ')
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden',
          containerClassName
        )}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
        }}
      >
        {/* Blur placeholder */}
        {placeholder === 'blur' && blurDataURL && !isLoaded && (
          <img
            src={blurDataURL}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 w-full h-full transition-opacity duration-500',
              objectFit === 'cover' && 'object-cover',
              objectFit === 'contain' && 'object-contain',
              isLoaded ? 'opacity-0' : 'opacity-100'
            )}
          />
        )}

        {/* Main image */}
        {isInView && (
          <img
            ref={(node) => {
              // Handle both forwarded ref and internal ref
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
              ;(imgRef as React.MutableRefObject<HTMLImageElement | null>).current = node
            }}
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={generateSrcSet()}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-500',
              objectFit === 'cover' && 'object-cover',
              objectFit === 'contain' && 'object-contain',
              objectFit === 'fill' && 'object-fill',
              objectFit === 'none' && 'object-none',
              objectFit === 'scale-down' && 'object-scale-down',
              !isLoaded && 'opacity-0',
              isLoaded && 'opacity-100',
              className
            )}
            loading={loading}
            decoding={priority ? 'sync' : 'async'}
            {...props}
          />
        )}

        {/* Error state */}
        {hasError && supportsModernFormat === 'original' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <span className="text-slate-400 text-sm">Kunde inte ladda bilden</span>
          </div>
        )}
      </div>
    )
  }
)

Image.displayName = 'Image'

/**
 * Picture component with multiple sources
 * Provides Art Direction and Format Fallback
 */
interface PictureProps {
  src: string
  alt: string
  sources?: Array<{
    srcSet: string
    media?: string
    type?: string
  }>
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  className?: string
  containerClassName?: string
}

export const Picture = ({
  src,
  alt,
  sources = [],
  width,
  height,
  loading = 'lazy',
  className,
  containerClassName,
}: PictureProps) => {
  return (
    <picture className={containerClassName}>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          media={source.media}
          type={source.type}
        />
      ))}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
      />
    </picture>
  )
}

/**
 * Avatar component with fallback
 */
interface AvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export const Avatar = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: AvatarProps) => {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallback ? getInitials(fallback) : '?'}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}

export default Image
