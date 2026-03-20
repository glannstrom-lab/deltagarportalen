/**
 * Custom hook för Zod-formulärvalidering
 * Kombinerar React state med Zod-scheman för enkel validering
 */

import { useState, useCallback } from 'react'
import { z } from 'zod'

type FormErrors<T> = Partial<Record<keyof T, string>>

interface UseZodFormOptions<T> {
  schema: z.ZodType<T>
  initialValues: T
  onSubmit: (values: T) => void | Promise<void>
}

interface UseZodFormReturn<T> {
  values: T
  errors: FormErrors<T>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  validate: () => boolean
  validateField: <K extends keyof T>(field: K, value: T[K]) => string | undefined
  reset: () => void
  clearErrors: () => void
}

export function useZodForm<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseZodFormOptions<T>): UseZodFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validera hela formuläret
  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values)
    
    if (!result.success) {
      const formattedErrors: FormErrors<T> = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof T
        formattedErrors[path] = err.message
      })
      setErrors(formattedErrors)
      return false
    }
    
    setErrors({})
    return true
  }, [schema, values])

  // Validera enskilt fält
  const validateField = useCallback(<K extends keyof T>(field: K, value: T[K]): string | undefined => {
    // Skapa ett partial schema för endast detta fält
    // För ZodObject, försök plocka ut fältet, men hantera fel om det inte går (t.ex. pga refine)
    let fieldSchema: z.ZodType<unknown>

    if (schema instanceof z.ZodObject) {
      try {
        // @ts-ignore - shape finns på ZodObject
        const shape = schema.shape || schema._def?.shape?.()
        if (shape && field in shape) {
          fieldSchema = shape[field as string] as z.ZodType<unknown>
        } else {
          // Fallback: validera hela schemat och filtrera på fältet
          const result = schema.safeParse({ ...values, [field]: value })
          if (!result.success) {
            const error = result.error.errors.find((e) => e.path[0] === field)
            return error?.message
          }
          return undefined
        }
      } catch {
        // Fallback om pick/shape inte fungerar
        const result = schema.safeParse({ ...values, [field]: value })
        if (!result.success) {
          const error = result.error.errors.find((e) => e.path[0] === field)
          return error?.message
        }
        return undefined
      }
    } else {
      fieldSchema = schema
    }

    // Validera enskilt fält
    const result = fieldSchema.safeParse(value)

    if (!result.success) {
      // Handle both ZodError format and issues array
      const issues = result.error.errors || result.error.issues
      if (issues && issues.length > 0) {
        return issues[0].message
      }
    }

    return undefined
  }, [schema, values])

  // Sätt värde för enskilt fält
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    
    // Validera fältet om det har blivit touchat
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }, [touched, validateField])

  // Sätt flera värden
  const setAllValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }))
  }, [])

  // Hantera input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Hantera olika input-typer
    let parsedValue: T[keyof T]
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked as T[keyof T]
    } else if (type === 'number') {
      parsedValue = (value === '' ? '' : Number(value)) as T[keyof T]
    } else {
      parsedValue = value as T[keyof T]
    }

    setValue(name as keyof T, parsedValue)
  }, [setValue])

  // Hantera blur (markera som touchad)
  const handleBlur = useCallback((
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const field = name as keyof T
    
    setTouched((prev) => ({ ...prev, [field]: true }))
    
    // Validera fältet
    const error = validateField(field, value as T[keyof T])
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [validateField])

  // Hantera formulärsubmit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Markera alla fält som touchade
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Record<keyof T, boolean>)
    setTouched(allTouched)
    
    // Validera hela formuläret
    if (!validate()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [validate, values, onSubmit])

  // Återställ formulär
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Rensa fel
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Beräkna om formuläret är giltigt
  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues: setAllValues,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    validateField,
    reset,
    clearErrors,
  }
}

// Hjälpfunktion för att formattera Zod-fel till användarvänliga meddelanden
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })
  
  return formatted
}

// Hjälpfunktion för att validera utan hook
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown): 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: formatZodError(result.error) }
}
