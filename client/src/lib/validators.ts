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

/**
 * Sanitize HTML content (allows basic formatting)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  })
}

// ============== VALIDATION RESULTS ==============

export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============== PHONE VALIDATION ==============

export function validatePhone(phone: string): ValidationResult {
  if (!phone) return { valid: true } // Optional field

  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  if (!/^[+]?[0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Endast siffror och + tillåtet' }
  }

  if (cleaned.length < 7) {
    return { valid: false, error: 'Telefonnummer för kort (minst 7 siffror)' }
  }

  if (cleaned.length > 15) {
    return { valid: false, error: 'Telefonnummer för långt (max 15 siffror)' }
  }

  return { valid: true }
}

// ============== EMAIL VALIDATION ==============

export function validateEmail(email: string): ValidationResult {
  if (!email) return { valid: true } // Optional field

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Ogiltig e-postadress' }
  }

  return { valid: true }
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

// ============== DATE VALIDATION ==============

export function validateDate(dateString: string): ValidationResult {
  if (!dateString) return { valid: true } // Optional field

  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Ogiltigt datumformat' }
  }

  const year = date.getFullYear()
  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'År måste vara mellan 1900 och 2100' }
  }

  return { valid: true }
}

export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  if (!startDate || !endDate) return { valid: true }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Ogiltigt datumformat' }
  }

  if (start > end) {
    return { valid: false, error: 'Startdatum måste vara före slutdatum' }
  }

  return { valid: true }
}

export function validateFutureDate(dateString: string): ValidationResult {
  if (!dateString) return { valid: true }

  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) {
    return { valid: false, error: 'Datum måste vara i framtiden' }
  }

  return { valid: true }
}

export function validatePastDate(dateString: string): ValidationResult {
  if (!dateString) return { valid: true }

  const date = new Date(dateString)
  const today = new Date()

  if (date > today) {
    return { valid: false, error: 'Datum kan inte vara i framtiden' }
  }

  return { valid: true }
}

// ============== NUMBER VALIDATION ==============

export function validateNumber(
  value: number | string | undefined,
  min?: number,
  max?: number
): ValidationResult {
  if (value === undefined || value === '') return { valid: true }

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return { valid: false, error: 'Måste vara ett nummer' }
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Minsta värde är ${min}` }
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Högsta värde är ${max}` }
  }

  return { valid: true }
}

// ============== FILE VALIDATION ==============

export function validateFileSize(
  file: File,
  maxSizeMB: number
): ValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Filen är för stor (max ${maxSizeMB}MB, din fil: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
    }
  }

  return { valid: true }
}

export function validateFileType(
  file: File,
  allowedTypes: string[]
): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Filtypen stöds inte. Tillåtna: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

// ============== FORM VALIDATION HELPER ==============

export interface FieldValidation {
  value: unknown
  validators: Array<(value: unknown) => ValidationResult>
}

export function validateForm(
  fields: Record<string, FieldValidation>
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {}

  for (const [fieldName, { value, validators }] of Object.entries(fields)) {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) {
        errors[fieldName] = result.error
        break
      }
    }
  }

  return errors
}

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
