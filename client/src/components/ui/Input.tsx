/**
 * Input Components
 * Standardiserade input-komponenter med labels, felhantering och ikoner
 */

import { cn } from '@/lib/utils'
import { inputBase, labelBase, animations, touch } from '@/styles/design-system'
import { AlertCircle, Eye, EyeOff, ChevronDown } from '@/components/ui/icons'
import { useState, forwardRef, useId } from 'react'

// ============================================
// TEXT INPUT
// ============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  touchOptimized?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth = true,
    touchOptimized = false,
    className,
    id: providedId,
    ...props
  }, ref) => {
    const generatedId = useId()
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    // Bygg aria-describedby baserat på vilka hjälptexter som finns
    const describedBy = [
      error && errorId,
      hint && !error && hintId,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className={labelBase}>
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-400 pointer-events-none" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              inputBase,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              touchOptimized && touch.input,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ============================================
// PASSWORD INPUT
// ============================================
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrength?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-stone-700 dark:text-stone-300" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4 text-stone-700 dark:text-stone-300" aria-hidden="true" />
            )}
          </button>
        }
        className={className}
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

// ============================================
// TEXTAREA
// ============================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    hint,
    fullWidth = true,
    resize = 'vertical',
    className,
    id: providedId,
    ...props
  }, ref) => {
    const generatedId = useId()
    const textareaId = providedId || generatedId
    const errorId = `${textareaId}-error`
    const hintId = `${textareaId}-hint`

    const describedBy = [
      error && errorId,
      hint && !error && hintId,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className={labelBase}>
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputBase,
            'min-h-[100px]',
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">{hint}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ============================================
// SELECT
// ============================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    hint,
    options,
    placeholder,
    fullWidth = true,
    className,
    id: providedId,
    ...props
  }, ref) => {
    const generatedId = useId()
    const selectId = providedId || generatedId
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`

    const describedBy = [
      error && errorId,
      hint && !error && hintId,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className={labelBase}>
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              inputBase,
              'appearance-none bg-white dark:bg-stone-900 pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 dark:text-stone-400 pointer-events-none" aria-hidden="true" />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">{hint}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ============================================
// CHECKBOX
// ============================================
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={cn(
        'flex items-start gap-3 cursor-pointer',
        'group',
        className
      )}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'peer sr-only'
            )}
            {...props}
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 border-stone-300 dark:border-stone-600',
            'peer-checked:bg-sky-600 peer-checked:border-sky-600',
            'peer-focus:ring-2 peer-focus:ring-sky-500/20',
            'transition-all duration-200',
            'flex items-center justify-center'
          )}>
            <svg 
              className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100">
            {label}
          </span>
          {description && (
            <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{description}</p>
          )}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// ============================================
// TOGGLE/SWITCH
// ============================================
interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={cn(
        'flex items-center justify-between gap-4 cursor-pointer',
        className
      )}>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
            )}
            {description && (
              <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{description}</p>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            {...props}
          />
          <div className={cn(
            'w-11 h-6 bg-stone-200 dark:bg-stone-700 rounded-full',
            'peer-checked:bg-sky-600',
            'peer-focus:ring-2 peer-focus:ring-sky-500/20',
            'transition-colors duration-200',
            'after:content-[""] after:absolute after:top-0.5 after:left-0.5',
            'after:bg-white after:rounded-full after:w-5 after:h-5',
            'after:transition-transform after:duration-200',
            'peer-checked:after:translate-x-5'
          )} />
        </div>
      </label>
    )
  }
)
Toggle.displayName = 'Toggle'

export default Input
