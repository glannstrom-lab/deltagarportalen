/**
 * OptimizedImage Component
 * Serves WebP images with PNG fallback for older browsers
 */

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  /**
   * `high` för den bild som är sidans LCP-element. (K13, 2026-08-12)
   *
   * `loading="eager"` räcker inte: attributet påverkar bara om bilden hämtas
   * direkt när elementet finns — inte hur tidigt webbläsaren hittar det. På
   * startsidan renderas hjältebilden av en lazy-laddad chunk, så bilden
   * upptäcktes först efter att elva skript hunnit köra. `fetchpriority` styr
   * köordningen när den väl är upptäckt; preload-taggen i index.html är det
   * som flyttar själva upptäckten.
   */
  fetchPriority?: 'high' | 'low' | 'auto'
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
  fetchPriority,
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
        fetchPriority={fetchPriority}
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
        fetchPriority={fetchPriority}
      />
    </picture>
  )
}

export default OptimizedImage
