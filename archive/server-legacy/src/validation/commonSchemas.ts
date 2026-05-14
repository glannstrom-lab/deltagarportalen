/**
 * Common Validation Schemas
 * Zod-scheman för datavalidering
 * Används för att säkerställa datakvalitet tidigt i flödet
 */

import { z } from 'zod'

// Grundläggande fält som återanvänds
export const uuidSchema = z.string().uuid('Ogiltigt ID-format')

export const emailSchema = z
  .string()
  .email('Ogiltig e-postadress')
  .min(1, 'E-post krävs')
  .max(255, 'E-postadressen är för lång')

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]{8,}$/, 'Ogiltigt telefonnummer')
  .optional()
  .or(z.literal(''))

export const nameSchema = z
  .string()
  .min(1, 'Namn krävs')
  .max(100, 'Namnet är för långt')
  .regex(/^[\p{L}\s\-'\.]+$/u, 'Namnet innehåller ogiltiga tecken')

export const urlSchema = z
  .string()
  .url('Ogiltig URL')
  .optional()
  .or(z.literal(''))

export const dateSchema = z
  .string()
  .datetime('Ogiltigt datumformat')
  .optional()
  .or(z.literal(''))

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20)
})

// CV-relaterade scheman
export const workExperienceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Titel krävs').max(200),
  company: z.string().min(1, 'Företag krävs').max(200),
  location: z.string().max(200).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  current: z.boolean().default(false),
  description: z.string().max(2000).optional()
})

export const educationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, 'Examen krävs').max(200),
  field: z.string().max(200).optional(),
  school: z.string().min(1, 'Skola krävs').max(200),
  location: z.string().max(200).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  current: z.boolean().default(false),
  description: z.string().max(1000).optional()
})

export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Kompetens krävs').max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  category: z.string().max(100).optional()
})

// Huvud-CV-schema
export const cvSchema = z.object({
  id: uuidSchema.optional(),
  
  // Personuppgifter
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  title: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  linkedIn: urlSchema,
  website: urlSchema,
  
  // Erfarenheter
  workExperience: z.array(workExperienceSchema).max(20, 'Max 20 arbetserfarenheter'),
  education: z.array(educationSchema).max(10, 'Max 10 utbildningar'),
  skills: z.array(skillSchema).max(30, 'Max 30 kompetenser'),
  
  // Design
  template: z.enum(['modern', 'classic', 'minimal', 'creative']).default('modern'),
  colorScheme: z.enum(['indigo', 'emerald', 'rose', 'amber', 'blue', 'violet']).default('indigo'),
  
  // Metadata
  updatedAt: z.string().optional()
})

// Användarprofil-schema
export const profileSchema = z.object({
  id: uuidSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  location: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  avatar: urlSchema,
  preferences: z.object({
    newsletter: z.boolean().default(false),
    notifications: z.boolean().default(true),
    darkMode: z.boolean().default(false)
  }).optional()
})

// Jobbrelaterade scheman
export const savedJobSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(300),
  company: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  url: urlSchema,
  source: z.enum(['arbetsformedlingen', 'linkedin', 'other']).default('other'),
  savedAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  whyInterested: z.enum(['match', 'location', 'salary', 'new', 'other']).optional(),
  rating: z.number().int().min(1).max(5).optional()
})

// Dagboks-schema
export const diaryEntrySchema = z.object({
  id: uuidSchema.optional(),
  date: z.string().datetime(),
  content: z.string().max(5000),
  mood: z.enum(['terrible', 'bad', 'neutral', 'good', 'great']).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
})

// Intresseguide-schema
export const riasecAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.number().int().min(1).max(5)
})

export const interestResultSchema = z.object({
  id: uuidSchema.optional(),
  answers: z.array(riasecAnswerSchema).min(1),
  result: z.object({
    realistic: z.number().int().min(0).max(100),
    investigative: z.number().int().min(0).max(100),
    artistic: z.number().int().min(0).max(100),
    social: z.number().int().min(0).max(100),
    enterprising: z.number().int().min(0).max(100),
    conventional: z.number().int().min(0).max(100)
  }),
  topOccupations: z.array(z.string()).max(5),
  completedAt: z.string().datetime()
})

// Valideringshjälpare
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true
  data: T 
} | { 
  success: false
  errors: z.ZodError['issues']
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error.issues }
  }
}

// Saneringshjälpare - tar bort potentiellt farliga tecken
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Ta bort HTML-taggar
    .trim()
    .substring(0, 10000) // Maxlängd
}

// Exportera alla scheman
export default {
  uuid: uuidSchema,
  email: emailSchema,
  phone: phoneSchema,
  name: nameSchema,
  url: urlSchema,
  date: dateSchema,
  pagination: paginationSchema,
  cv: cvSchema,
  profile: profileSchema,
  workExperience: workExperienceSchema,
  education: educationSchema,
  skill: skillSchema,
  savedJob: savedJobSchema,
  diaryEntry: diaryEntrySchema,
  interestResult: interestResultSchema
}
