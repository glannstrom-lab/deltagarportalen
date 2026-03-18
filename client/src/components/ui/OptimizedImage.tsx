/**
 * OptimizedImage Component
 * Serves WebP images with PNG fallback for older browsers
 */

import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
}

/**
 * Renders an image with WebP version and PNG fallback
 * Expects both .webp and .png versions to exist in public folder
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}: OptimizedImageProps) {
  // Convert .png to .webp for the optimized source
  const webpSrc = src.replace(/\.png$/i, '.webp')
  const isWebpAvailable = src.endsWith('.png')

  if (!isWebpAvailable) {
    // Not a PNG, just render regular image
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
      />
    )
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
      />
    </picture>
  )
}

export default OptimizedImage
