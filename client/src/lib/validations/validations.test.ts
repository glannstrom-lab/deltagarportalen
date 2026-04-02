import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  personalInfoSchema,
  workExperienceSchema,
  educationSchema,
  profileSchema,
  coverLetterSchema,
} from './index'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('accepts any password length (server-side validation)', () => {
      // Login schema intentionally doesn't validate password length
      // to avoid revealing whether an account exists
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('registerSchema', () => {
    // Strong password: 12+ chars, uppercase, lowercase, number, special char
    const validPassword = 'SecurePass123!'

    it('validates correct registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: validPassword,
        confirmPassword: validPassword,
        firstName: 'Anna',
        lastName: 'Andersson',
        acceptTerms: true,
        acceptPrivacy: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123!',
        confirmPassword: 'securepass123!',
        firstName: 'Anna',
        lastName: 'Andersson',
        acceptTerms: true,
        acceptPrivacy: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: validPassword,
        confirmPassword: 'DifferentPass1!',
        firstName: 'Anna',
        lastName: 'Andersson',
        acceptTerms: true,
        acceptPrivacy: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects short names', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: validPassword,
        confirmPassword: validPassword,
        firstName: 'A',
        lastName: 'Andersson',
        acceptTerms: true,
        acceptPrivacy: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('personalInfoSchema', () => {
    it('validates correct personal info', () => {
      const result = personalInfoSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
        email: 'anna@example.com',
        phone: '070-123 45 67',
        location: 'Stockholm',
      })
      expect(result.success).toBe(true)
    })

    it('validates without optional fields', () => {
      const result = personalInfoSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
        email: 'anna@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid phone', () => {
      const result = personalInfoSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
        email: 'anna@example.com',
        phone: 'abc',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('workExperienceSchema', () => {
    it('validates current job without end date', () => {
      const result = workExperienceSchema.safeParse({
        title: 'Utvecklare',
        company: 'Tech AB',
        startDate: '2020-01-01',
        current: true,
      })
      expect(result.success).toBe(true)
    })

    it('requires end date for non-current job', () => {
      const result = workExperienceSchema.safeParse({
        title: 'Utvecklare',
        company: 'Tech AB',
        startDate: '2020-01-01',
        current: false,
        endDate: null,
      })
      expect(result.success).toBe(false)
    })

    it('validates past job with end date', () => {
      const result = workExperienceSchema.safeParse({
        title: 'Utvecklare',
        company: 'Tech AB',
        startDate: '2020-01-01',
        current: false,
        endDate: '2022-12-31',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('educationSchema', () => {
    it('validates correct education data', () => {
      const result = educationSchema.safeParse({
        degree: 'Kandidatexamen',
        school: 'Stockholms Universitet',
        field: 'Datavetenskap',
        startDate: '2015-09-01',
        endDate: '2018-06-15',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('profileSchema', () => {
    it('validates correct profile data', () => {
      const result = profileSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
        phone: '070-123 45 67',
        bio: 'En kort bio om mig',
      })
      expect(result.success).toBe(true)
    })

    it('validates minimal profile data', () => {
      const result = profileSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
      })
      expect(result.success).toBe(true)
    })

    it('rejects too long bio', () => {
      const result = profileSchema.safeParse({
        firstName: 'Anna',
        lastName: 'Andersson',
        bio: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('coverLetterSchema', () => {
    it('validates correct cover letter', () => {
      const result = coverLetterSchema.safeParse({
        title: 'Personligt brev - Utvecklare',
        company: 'Tech AB',
        jobTitle: 'Frontend-utvecklare',
        content: 'Detta är ett personligt brev som är tillräckligt långt för att validera...',
      })
      expect(result.success).toBe(true)
    })

    it('rejects too short content', () => {
      const result = coverLetterSchema.safeParse({
        title: 'Personligt brev',
        content: 'För kort',
      })
      expect(result.success).toBe(false)
    })

    it('rejects too long content', () => {
      const result = coverLetterSchema.safeParse({
        title: 'Personligt brev',
        content: 'a'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })
  })
})
