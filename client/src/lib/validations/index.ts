/**
 * Zod Validation Schemas
 * Centraliserad validering för alla formulär
 */

import { z } from 'zod'

// ============================================
// AUTH VALIDATION
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-postadress är obligatorisk')
    .email('Ogiltig e-postadress'),
  password: z
    .string()
    .min(1, 'Lösenord är obligatoriskt')
    .min(6, 'Lösenordet måste vara minst 6 tecken'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'E-postadress är obligatorisk')
    .email('Ogiltig e-postadress'),
  password: z
    .string()
    .min(1, 'Lösenord är obligatoriskt')
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav')
    .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
  confirmPassword: z.string().min(1, 'Bekräfta lösenord'),
  firstName: z
    .string()
    .min(1, 'Förnamn är obligatoriskt')
    .min(2, 'Förnamnet måste vara minst 2 tecken')
    .max(50, 'Förnamnet får vara max 50 tecken'),
  lastName: z
    .string()
    .min(1, 'Efternamn är obligatoriskt')
    .min(2, 'Efternamnet måste vara minst 2 tecken')
    .max(50, 'Efternamnet får vara max 50 tecken'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
})

// ============================================
// CV VALIDATION
// ============================================

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Förnamn är obligatoriskt')
    .min(2, 'Minst 2 tecken')
    .max(50, 'Max 50 tecken'),
  lastName: z
    .string()
    .min(1, 'Efternamn är obligatoriskt')
    .min(2, 'Minst 2 tecken')
    .max(50, 'Max 50 tecken'),
  email: z
    .string()
    .min(1, 'E-post är obligatoriskt')
    .email('Ogiltig e-postadress'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\+\(\)]{8,}$/.test(val), {
      message: 'Ogiltigt telefonnummer',
    }),
  location: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  title: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  summary: z
    .string()
    .max(2000, 'Max 2000 tecken')
    .optional(),
})

export const workExperienceSchema = z.object({
  title: z
    .string()
    .min(1, 'Jobbtitel är obligatorisk')
    .min(2, 'Minst 2 tecken')
    .max(100, 'Max 100 tecken'),
  company: z
    .string()
    .min(1, 'Företag är obligatoriskt')
    .min(2, 'Minst 2 tecken')
    .max(100, 'Max 100 tecken'),
  location: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  startDate: z
    .string()
    .min(1, 'Startdatum är obligatoriskt'),
  endDate: z
    .string()
    .optional()
    .nullable(),
  current: z.boolean().default(false),
  description: z
    .string()
    .max(2000, 'Max 2000 tecken')
    .optional(),
}).refine((data) => {
  // Om inte current, måste endDate finnas
  if (!data.current && !data.endDate) {
    return false
  }
  return true
}, {
  message: 'Slutdatum krävs om inte pågående',
  path: ['endDate'],
})

export const educationSchema = z.object({
  degree: z
    .string()
    .min(1, 'Examen är obligatorisk')
    .min(2, 'Minst 2 tecken')
    .max(100, 'Max 100 tecken'),
  school: z
    .string()
    .min(1, 'Skola är obligatorisk')
    .min(2, 'Minst 2 tecken')
    .max(100, 'Max 100 tecken'),
  field: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  location: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  startDate: z
    .string()
    .min(1, 'Startdatum är obligatoriskt'),
  endDate: z
    .string()
    .optional()
    .nullable(),
  current: z.boolean().default(false),
})

export const skillSchema = z.object({
  skill: z
    .string()
    .min(1, 'Kompetens är obligatorisk')
    .min(2, 'Minst 2 tecken')
    .max(50, 'Max 50 tecken'),
})

// ============================================
// PROFILE VALIDATION
// ============================================

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Förnamn är obligatoriskt')
    .min(2, 'Minst 2 tecken')
    .max(50, 'Max 50 tecken'),
  lastName: z
    .string()
    .min(1, 'Efternamn är obligatoriskt')
    .min(2, 'Minst 2 tecken')
    .max(50, 'Max 50 tecken'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\+\(\)]{8,}$/.test(val), {
      message: 'Ogiltigt telefonnummer',
    }),
  bio: z
    .string()
    .max(500, 'Max 500 tecken')
    .optional(),
})

// ============================================
// COVER LETTER VALIDATION
// ============================================

export const coverLetterSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel är obligatorisk')
    .min(2, 'Minst 2 tecken')
    .max(100, 'Max 100 tecken'),
  company: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  jobTitle: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  content: z
    .string()
    .min(1, 'Innehåll är obligatoriskt')
    .min(50, 'Brevet bör vara minst 50 tecken')
    .max(5000, 'Max 5000 tecken'),
})

// ============================================
// JOB SEARCH VALIDATION
// ============================================

export const jobSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
  location: z
    .string()
    .max(100, 'Max 100 tecken')
    .optional(),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type WorkExperienceInput = z.infer<typeof workExperienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type CoverLetterInput = z.infer<typeof coverLetterSchema>
export type JobSearchInput = z.infer<typeof jobSearchSchema>
