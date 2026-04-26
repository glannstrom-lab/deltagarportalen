/**
 * CompactInput - Accessible input component with validation
 */

import { useState, useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { validateTextLength, type ValidationResult } from '@/lib/validators'
import { VALIDATION } from '../constants'

export interface CompactInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  error?: string
  hint?: string
  maxChars?: number
  showCharCount?: boolean
  validate?: (value: string) => ValidationResult
  onChange?: (value: string) => void
}

export const CompactInput = forwardRef<HTMLInputElement, CompactInputProps>(({
  label,
  error: externalError,
  hint,
  maxChars = VALIDATION.MAX_INPUT_LENGTH,
  showCharCount = false,
  validate,
  onChange,
  className,
  id: providedId,
  disabled,
  value,
  ...props
}, ref) => {
  const generatedId = useId()
  const inputId = providedId || generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const [internalError, setInternalError] = useState<string | undefined>()
  const error = externalError || internalError

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Validate max length
    const lengthResult = validateTextLength(newValue, maxChars, label)
    if (!lengthResult.valid) {
      setInternalError(lengthResult.error)
      return // Don't allow exceeding max
    }

    // Custom validation
    if (validate) {
      const result = validate(newValue)
      setInternalError(result.valid ? undefined : result.error)
    } else {
      setInternalError(undefined)
    }

    onChange?.(newValue)
  }

  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
      >
        {label}
        {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>

      <input
        ref={ref}
        id={inputId}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={cn(
          error && errorId,
          hint && !error && hintId
        ) || undefined}
        className={cn(
          'w-full px-3 py-2 bg-white dark:bg-stone-800 border rounded-lg text-sm text-stone-900 dark:text-stone-100',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500',
          'placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all',
          error
            ? 'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-400'
            : 'border-stone-200 dark:border-stone-600',
          disabled && 'bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 cursor-not-allowed',
          className
        )}
        {...props}
      />

      <div className="flex justify-between items-start mt-1 min-h-[1.25rem]">
        <div className="flex-1">
          {error && (
            <p id={errorId} role="alert" className="text-xs text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
          {hint && !error && (
            <p id={hintId} className="text-xs text-stone-500 dark:text-stone-400">
              {hint}
            </p>
          )}
        </div>

        {showCharCount && (
          <span
            className={cn(
              'text-xs ml-2',
              currentLength >= maxChars * 0.9
                ? 'text-amber-500'
                : 'text-stone-400 dark:text-stone-500'
            )}
            aria-live="polite"
          >
            {currentLength}/{maxChars}
          </span>
        )}
      </div>
    </div>
  )
})

CompactInput.displayName = 'CompactInput'
