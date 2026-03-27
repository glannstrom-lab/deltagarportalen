/**
 * Zod Validation Schemas
 * Centraliserad validering för alla formulär
 */

import { z } from 'zod'

// ============================================
// SHARED PASSWORD SCHEMA
// Strong password requirements for all auth flows
// ============================================

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const strongPasswordSchema = z
  .string()
  .min(1, 'Lösenord är obligatoriskt')
  .min(12, 'Lösenordet måste vara minst 12 tecken')
  .max(128, 'Lösenordet får vara max 128 tecken')
  .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav (A-Z)')
  .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav (a-z)')
  .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra (0-9)')
  .regex(/[^A-Za-z0-9]/, 'Lösenordet måste innehålla minst ett specialtecken (!@#$%^&* etc)')
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Lösenordet får inte innehålla samma tecken 3+ gånger i rad'
  )
  .refine(
    (password) => !['password', 'lösenord', '12345678', 'qwerty', 'abc123'].some(
      weak => password.toLowerCase().includes(weak)
    ),
    'Lösenordet innehåller vanliga osäkra mönster'
  );

// ============================================
// AUTH VALIDATION
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-postadress är obligatorisk')
    .email('Ogiltig e-postadress')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Lösenord är obligatoriskt'),
  // Note: Password length validation happens server-side for login
  // to avoid revealing whether account exists
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'E-postadress är obligatorisk')
    .email('Ogiltig e-postadress')
    .transform(email => email.toLowerCase().trim()),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Bekräfta lösenord'),
  firstName: z
    .string()
    .min(1, 'Förnamn är obligatoriskt')
    .min(2, 'Förnamnet måste vara minst 2 tecken')
    .max(50, 'Förnamnet får vara max 50 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖéÉüÜ\s\-']+$/, 'Förnamnet innehåller ogiltiga tecken'),
  lastName: z
    .string()
    .min(1, 'Efternamn är obligatoriskt')
    .min(2, 'Efternamnet måste vara minst 2 tecken')
    .max(50, 'Efternamnet får vara max 50 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖéÉüÜ\s\-']+$/, 'Efternamnet innehåller ogiltiga tecken'),
  // GDPR Consent fields
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'Du måste godkänna användarvillkoren'),
  acceptPrivacy: z
    .boolean()
    .refine(val => val === true, 'Du måste godkänna integritetspolicyn'),
  acceptAiProcessing: z
    .boolean()
    .optional()
    .default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
})

/**
 * Schema for invite-based registration
 * Uses same strong password requirements
 */
export const inviteRegisterSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Förnamn är obligatoriskt')
    .min(2, 'Förnamnet måste vara minst 2 tecken')
    .max(50, 'Förnamnet får vara max 50 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖéÉüÜ\s\-']+$/, 'Förnamnet innehåller ogiltiga tecken'),
  lastName: z
    .string()
    .min(1, 'Efternamn är obligatoriskt')
    .min(2, 'Efternamnet måste vara minst 2 tecken')
    .max(50, 'Efternamnet får vara max 50 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖéÉüÜ\s\-']+$/, 'Efternamnet innehåller ogiltiga tecken'),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Bekräfta lösenord'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
})

/**
 * Schema for password reset/change
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Nuvarande lösenord krävs'),
  newPassword: strongPasswordSchema,
  confirmNewPassword: z.string().min(1, 'Bekräfta nytt lösenord'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Nya lösenordet måste skilja sig från nuvarande',
  path: ['newPassword'],
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
  profileImage: z
    .string()
    .url('Ogiltig bild-URL')
    .optional()
    .nullable(),
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
