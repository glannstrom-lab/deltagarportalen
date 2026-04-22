/**
 * Security utilities for input sanitization and validation
 * Protects against XSS, injection attacks, and other security vulnerabilities
 */

// Import and re-export DOMPurify-based sanitization from sanitize.ts (authoritative implementation)
import { sanitizeHTML, sanitizeHTMLWithLineBreaks, stripHTML, containsDangerousHTML } from './sanitize';
export { sanitizeHTML, sanitizeHTMLWithLineBreaks, stripHTML, containsDangerousHTML };

// XSS Sanitization - removes potentially dangerous HTML
type StringOrObject = string | object | null | undefined;

export function sanitizeInput(input: StringOrObject): string {
  if (input === null || input === undefined) return '';

  const str = typeof input === 'object' ? JSON.stringify(input) : String(input);

  return str
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["']?[^"'>]*["']?/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: URLs (can contain JavaScript)
    .replace(/data:[^;]*;base64,/gi, '')
    // Escape HTML entities
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Swedish personal number (YYMMDD-XXXX or YYYYMMDD-XXXX)
export function isValidPersonalNumber(pnr: string): boolean {
  const pnrRegex = /^(\d{2})?(\d{6})-?(\d{4})$/;
  return pnrRegex.test(pnr);
}

// Validate phone number (Swedish format)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+46|0)[\s\-]?[\d\s\-]{7,12}$/;
  return phoneRegex.test(phone);
}

// Prevent SQL injection patterns
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  canProceed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remaining = this.windowMs - (Date.now() - oldestAttempt);
    return Math.max(0, remaining);
  }
}

// CSRF Token generator
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Safe JSON parse with error handling
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Safe JSON stringify with error handling (handles circular references)
export function safeJsonStringify(value: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch {
    // Likely a circular reference error
    return fallback;
  }
}

// Export all security utilities
export default {
  sanitizeInput,
  sanitizeHTML,
  isValidEmail,
  isValidPersonalNumber,
  isValidPhoneNumber,
  containsSQLInjection,
  RateLimiter,
  generateCSRFToken,
  safeJSONParse,
  safeJsonStringify,
};
