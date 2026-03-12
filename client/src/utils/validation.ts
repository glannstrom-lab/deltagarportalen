/**
 * Validation Utilities
 * Defensiv validering för att förhindra krascher och felaktig data
 */

import { z } from 'zod'

// Grundläggande valideringsschema för CV-data
export const cvDataSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  workExperience: z.array(z.object({
    id: z.string().optional(),
    title: z.string().max(200),
    company: z.string().max(200),
    location: z.string().max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().max(2000).optional(),
  })).max(20).optional(),
  education: z.array(z.object({
    id: z.string().optional(),
    degree: z.string().max(200),
    field: z.string().max(200).optional(),
    school: z.string().max(200),
    location: z.string().max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().max(1000).optional(),
  })).max(10).optional(),
  skills: z.array(z.object({
    id: z.string().optional(),
    name: z.string().max(100),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  })).max(30).optional(),
  template: z.enum(['modern', 'classic', 'minimal', 'creative']).default('modern'),
  colorScheme: z.enum(['indigo', 'emerald', 'rose', 'amber', 'blue', 'violet']).default('indigo'),
  updatedAt: z.string().optional(),
})

// Validera och sanera CV-data
export function validateCVData(data: unknown): { valid: true; data: any } | { valid: false; error: string } {
  try {
    // Om data är null eller undefined, returnera default
    if (data == null) {
      return { valid: true, data: getDefaultCVData() }
    }

    // Om data är en sträng, försök parsa den
    let parsed = data
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data)
      } catch {
        return { valid: false, error: 'Ogiltig JSON-sträng' }
      }
    }

    // Validera mot schema
    const result = cvDataSchema.safeParse(parsed)
    
    if (result.success) {
      return { valid: true, data: result.data }
    } else {
      // Försök reparera data istället för att kasta bort den
      const repaired = repairCVData(parsed)
      return { valid: true, data: repaired }
    }
  } catch (error) {
    return { valid: false, error: 'Oväntat valideringsfel' }
  }
}

// Hämta default CV-data
export function getDefaultCVData() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    summary: '',
    location: '',
    workExperience: [],
    education: [],
    skills: [],
    template: 'modern',
    colorScheme: 'indigo',
    updatedAt: new Date().toISOString(),
  }
}

// Försök reparera felaktig CV-data
function repairCVData(data: any): any {
  const repaired = { ...getDefaultCVData() }
  
  if (typeof data === 'object' && data !== null) {
    // Kopiera över giltliga fält
    if (typeof data.firstName === 'string') repaired.firstName = data.firstName.substring(0, 100)
    if (typeof data.lastName === 'string') repaired.lastName = data.lastName.substring(0, 100)
    if (typeof data.email === 'string') repaired.email = data.email.substring(0, 255)
    if (typeof data.phone === 'string') repaired.phone = data.phone.substring(0, 50)
    if (typeof data.title === 'string') repaired.title = data.title.substring(0, 200)
    if (typeof data.summary === 'string') repaired.summary = data.summary.substring(0, 5000)
    if (typeof data.location === 'string') repaired.location = data.location.substring(0, 200)
    
    // Hantera arrays
    if (Array.isArray(data.workExperience)) {
      repaired.workExperience = data.workExperience.slice(0, 20).map((item: any) => ({
        id: String(item?.id || Date.now()),
        title: String(item?.title || '').substring(0, 200),
        company: String(item?.company || '').substring(0, 200),
        location: String(item?.location || '').substring(0, 200),
        startDate: String(item?.startDate || ''),
        endDate: String(item?.endDate || ''),
        current: Boolean(item?.current),
        description: String(item?.description || '').substring(0, 2000),
      }))
    }
    
    if (Array.isArray(data.education)) {
      repaired.education = data.education.slice(0, 10).map((item: any) => ({
        id: String(item?.id || Date.now()),
        degree: String(item?.degree || '').substring(0, 200),
        field: String(item?.field || '').substring(0, 200),
        school: String(item?.school || '').substring(0, 200),
        location: String(item?.location || '').substring(0, 200),
        startDate: String(item?.startDate || ''),
        endDate: String(item?.endDate || ''),
        current: Boolean(item?.current),
        description: String(item?.description || '').substring(0, 1000),
      }))
    }
    
    if (Array.isArray(data.skills)) {
      repaired.skills = data.skills.slice(0, 30).map((item: any) => ({
        id: String(item?.id || Date.now()),
        name: String(item?.name || '').substring(0, 100),
        level: ['beginner', 'intermediate', 'advanced', 'expert'].includes(item?.level) 
          ? item.level 
          : 'intermediate',
      }))
    }
  }
  
  return repaired
}

// Validera email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validera telefonnummer (svenskt format)
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^[\+]?[0-9]{8,15}$/.test(cleaned)
}

// Sanera text för att förhindra XSS
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

// Validera att ett objekt har alla obligatoriska fält
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })
  
  if (missing.length > 0) {
    return { valid: false, missing }
  }
  
  return { valid: true }
}

// Validera filtyp
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

// Validera filstorlek (i bytes)
export function validateFileSize(size: number, maxSizeMB: number): boolean {
  return size <= maxSizeMB * 1024 * 1024
}

// Deep clone för att undvika mutationer
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

// Validera datum
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// Validera att datum är i framtiden
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date > new Date()
}

// Validera att datum är i det förflutna
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date < new Date()
}

export default {
  validateCVData,
  getDefaultCVData,
  validateEmail,
  validatePhone,
  sanitizeText,
  validateRequiredFields,
  validateFileType,
  validateFileSize,
  deepClone,
  validateDate,
  isFutureDate,
  isPastDate,
}
