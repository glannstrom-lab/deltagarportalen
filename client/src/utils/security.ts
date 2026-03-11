/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    // Remove script tags and their contents
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["']?[^"']*["']?/gi, '')
    // Remove potentially dangerous tags
    .replace(/<\s*(iframe|object|embed|form|input|textarea|button)[^>]*>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: URIs (can contain JavaScript)
    .replace(/data:[^;]*;base64,/gi, '')
    // Escape remaining < and > to prevent HTML injection
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Sanitize HTML content while allowing safe tags
 * Use for rich text that needs to preserve formatting
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // List of allowed tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  
  // First pass: remove script tags completely
  let sanitized = input.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  
  // Second pass: remove event handlers from all tags
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Third pass: remove javascript: and data: protocols
  sanitized = sanitized.replace(/(javascript|data):/gi, '')
  
  // Fourth pass: only allow specific safe tags
  const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi
  sanitized = sanitized.replace(tagRegex, (match, tag) => {
    const lowerTag = tag.toLowerCase()
    if (allowedTags.includes(lowerTag)) {
      // For allowed tags, still remove any attributes except specific safe ones
      if (lowerTag === 'a') {
        // Allow href but sanitize it
        const hrefMatch = match.match(/href="([^"]*)"/i)
        if (hrefMatch) {
          const href = hrefMatch[1]
          // Only allow http/https links
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/') || href.startsWith('#')) {
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">`
          }
        }
        return '<a>'
      }
      // Self-closing tags
      if (match.endsWith('/>')) {
        return `<${lowerTag} />`
      }
      return match.replace(/\s+\w+\s*=\s*["'][^"']*["']/g, '')
    }
    // Remove disallowed tags but keep content
    return ''
  })
  
  return sanitized
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  
  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>"']/g, '')
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  
  // Remove path traversal attempts
  return filename
    .replace(/[.]{2,}/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
}

/**
 * Escape special regex characters
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create a safe JSON string that won't cause XSS if embedded in HTML
 */
export function safeJsonStringify(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\//g, '\\/')
}

/**
 * Validate that a string is a safe URL (http/https only)
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    // Relative URLs are considered safe
    return url.startsWith('/') || url.startsWith('#')
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private limits = new Map<string, number>()
  
  checkLimit(key: string, limitMs: number = 1000): boolean {
    const now = Date.now()
    const last = this.limits.get(key) || 0
    
    if (now - last < limitMs) {
      return false
    }
    
    this.limits.set(key, now)
    return true
  }
  
  reset(key: string): void {
    this.limits.delete(key)
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter()
