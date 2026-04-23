/**
 * CompactSelect - Accessible select component
 */

import { useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface CompactSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
  onChange?: (value: string) => void
}

export const CompactSelect = forwardRef<HTMLSelectElement, CompactSelectProps>(({
  label,
  options,
  error,
  hint,
  placeholder = 'Välj...',
  onChange,
  className,
  id: providedId,
  disabled,
  value,
  ...props
}, ref) => {
  const generatedId = useId()
  const selectId = providedId || generatedId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <div className="w-full">
      <label
        htmlFor={selectId}
        className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
      >
        {label}
        {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>

      <select
        ref={ref}
        id={selectId}
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
          'transition-all appearance-none cursor-pointer',
          error
            ? 'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-400'
            : 'border-stone-200 dark:border-stone-600',
          disabled && 'bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="mt-1 min-h-[1.25rem]">
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
    </div>
  )
})

CompactSelect.displayName = 'CompactSelect'
