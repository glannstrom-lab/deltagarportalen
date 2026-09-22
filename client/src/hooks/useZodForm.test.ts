import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useZodForm, formatZodError, validateWithZod } from './useZodForm'
import { z } from 'zod'

describe('useZodForm', () => {
  const testSchema = z.object({
    email: z.string().email('Ogiltig e-post'),
    password: z.string().min(6, 'Minst 6 tecken'),
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should update values on change', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.setValue('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
  })

  it('should validate on blur when field is touched', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    // Simulate blur with invalid email
    act(() => {
      result.current.handleBlur({
        target: { name: 'email', value: 'invalid' },
      } as React.FocusEvent<HTMLInputElement>)
    })

    expect(result.current.touched.email).toBe(true)
    expect(result.current.errors.email).toBe('Ogiltig e-post')
  })

  it('should not validate on blur for untouched fields', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: 'test@example.com', password: '' },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.setValue('password', '123')
    })

    // Password should not show error yet (not touched)
    expect(result.current.errors.password).toBeUndefined()
  })

  it('should validate all fields on submit', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit,
      })
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.errors.email).toBe('Ogiltig e-post')
    expect(result.current.errors.password).toBe('Minst 6 tecken')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should call onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit,
      })
    )

    // Set valid values
    act(() => {
      result.current.setValue('email', 'test@example.com')
      result.current.setValue('password', 'password123')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should handle form reset', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    // Set some values and errors
    act(() => {
      result.current.setValue('email', 'test@example.com')
      result.current.handleBlur({
        target: { name: 'email', value: 'invalid' },
      } as React.FocusEvent<HTMLInputElement>)
    })

    // Reset form
    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('should handle checkbox inputs', () => {
    const checkboxSchema = z.object({
      acceptTerms: z.boolean(),
    })

    const { result } = renderHook(() =>
      useZodForm({
        schema: checkboxSchema,
        initialValues: { acceptTerms: false },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.handleChange({
        target: { name: 'acceptTerms', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.values.acceptTerms).toBe(true)
  })

  it('should set isSubmitting during submission', async () => {
    const onSubmit = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit,
      })
    )

    act(() => {
      result.current.handleSubmit()
    })

    expect(result.current.isSubmitting).toBe(true)

    // Wait for submission to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('should update multiple values at once', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    act(() => {
      result.current.setValues({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(result.current.values).toEqual({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should validate field individually', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    const emailError = result.current.validateField('email', 'invalid')
    expect(emailError).toBe('Ogiltig e-post')

    const validEmailError = result.current.validateField('email', 'test@example.com')
    expect(validEmailError).toBeUndefined()
  })

  it('should return isValid based on errors', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        initialValues: { email: '', password: '' },
        onSubmit: vi.fn(),
      })
    )

    // Initially valid (no errors)
    expect(result.current.isValid).toBe(true)

    // Set invalid value and validate
    act(() => {
      result.current.handleBlur({
        target: { name: 'email', value: 'invalid' },
      } as React.FocusEvent<HTMLInputElement>)
    })

    expect(result.current.isValid).toBe(false)
  })

  // Regression (2026-09-22): zod 4 renamed ZodError.errors -> ZodError.issues.
  // Code that reads `.errors` directly throws `TypeError: Cannot read
  // properties of undefined (reading 'find')` / `(reading '0')` at runtime
  // against the real zod package — a mocked client would never catch this.
  it('formatZodError reads real zod 4 issues without throwing', () => {
    const result = testSchema.safeParse({ email: 'invalid', password: '1' })
    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected failure')

    expect(() => formatZodError(result.error)).not.toThrow()
    const formatted = formatZodError(result.error)
    expect(formatted.email).toBe('Ogiltig e-post')
    expect(formatted.password).toBe('Minst 6 tecken')
  })

  it('validateWithZod surfaces real zod 4 issues without throwing', () => {
    const outcome = validateWithZod(testSchema, { email: 'invalid', password: '1' })
    expect(outcome.success).toBe(false)
    if (!outcome.success) {
      expect(outcome.errors.email).toBe('Ogiltig e-post')
    }
  })

  it('validateField falls back to full-schema parsing without throwing when a field is not part of the shape', () => {
    // Reproduces the fallback branch in validateField (field not found on
    // schema.shape), which used to call the non-existent `.errors` property
    // on a zod 4 ZodError and crash with a TypeError.
    type FormValues = { email: string; password: string; confirmPassword: string }
    const { result } = renderHook(() =>
      useZodForm<FormValues>({
        schema: testSchema as unknown as z.ZodType<FormValues>,
        initialValues: { email: '', password: '', confirmPassword: '' },
        onSubmit: vi.fn(),
      })
    )

    let error: string | undefined
    expect(() => {
      error = result.current.validateField('confirmPassword', 'x')
    }).not.toThrow()
    // The underlying schema doesn't know about confirmPassword; it still
    // fails because email/password are invalid — the point is it doesn't throw.
    expect(typeof error === 'string' || error === undefined).toBe(true)
  })
})
