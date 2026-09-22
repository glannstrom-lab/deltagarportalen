/**
 * Validation utilities for profile forms
 * Includes XSS sanitization and common validators
 */

import DOMPurify from 'dompurify'

// ============== XSS SANITIZATION ==============

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// ============== VALIDATION RESULTS ==============

export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============== TEXT LENGTH VALIDATION ==============

export function validateTextLength(
  text: string,
  maxLength: number,
  fieldName?: string
): ValidationResult {
  if (!text) return { valid: true }

  if (text.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName || 'Fältet'} får vara max ${maxLength} tecken (nu: ${text.length})`
    }
  }

  return { valid: true }
}

// validatePhone, validateEmail, validateDate(Range), validateFuture/PastDate,
// validateNumber, validateFileSize/Type, validateForm och sanitizeHtml
// borttagna 2026-09-22 — noll anropare. Formulären validerar med zod
// (`lib/validations/`, `hooks/useZodForm.ts`).

// ============== TAG VALIDATION ==============

export function validateTag(
  tag: string,
  existingTags: string[],
  maxTags: number = 5,
  maxLength: number = 50
): ValidationResult {
  const trimmed = tag.trim()

  if (!trimmed) {
    return { valid: false, error: 'Taggen kan inte vara tom' }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Max ${maxLength} tecken` }
  }

  if (existingTags.length >= maxTags) {
    return { valid: false, error: `Max ${maxTags} taggar tillåtna` }
  }

  // Case-insensitive duplicate check
  const lowerTags = existingTags.map(t => t.toLowerCase())
  if (lowerTags.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'Taggen finns redan' }
  }

  return { valid: true }
}
