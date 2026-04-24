/**
 * ChipSelect - Accessible chip-based selection component
 * Supports single and multiple selection with proper ARIA
 */

import { useId, useCallback, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface ChipOption {
  value: string
  label?: string
  labelKey?: string
}

export interface ChipSelectProps {
  options: ChipOption[]
  selected: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  size?: 'sm' | 'md'
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function ChipSelect({
  options,
  selected,
  onChange,
  multiple = false,
  size = 'sm',
  label,
  hint,
  error,
  disabled = false,
  className
}: ChipSelectProps) {
  const { t } = useTranslation()
  const groupId = useId()
  const labelId = `${groupId}-label`
  const hintId = `${groupId}-hint`
  const errorId = `${groupId}-error`

  // Helper to get translated label
  const getLabel = useCallback((opt: ChipOption) => {
    if (opt.labelKey) return t(opt.labelKey)
    return opt.label || opt.value
  }, [t])

  const isSelected = useCallback((value: string) => {
    if (multiple) {
      return (selected as string[]).includes(value)
    }
    return selected === value
  }, [selected, multiple])

  const toggle = useCallback((value: string) => {
    if (disabled) return

    if (multiple) {
      const arr = selected as string[]
      const newValue = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value]
      onChange(newValue)
    } else {
      // For single select, toggle off if already selected
      onChange(selected === value ? '' : value)
    }
  }, [selected, multiple, onChange, disabled])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, value: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(value)
    }
  }, [toggle])

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <span
          id={labelId}
          className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5"
        >
          {label}
        </span>
      )}

      <div
        role={multiple ? 'group' : 'radiogroup'}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={cn(error && errorId, hint && !error && hintId) || undefined}
        aria-invalid={error ? 'true' : undefined}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((opt) => {
          const checked = isSelected(opt.value)

          return (
            <button
              key={opt.value}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={checked}
              aria-pressed={checked}
              onClick={() => toggle(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, opt.value)}
              disabled={disabled}
              className={cn(
                'rounded-full border font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-1',
                size === 'sm' ? 'px-2.5 py-1 text-xs min-h-[32px]' : 'px-3 py-1.5 text-sm min-h-[40px]',
                checked
                  ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300',
                !disabled && !checked && 'hover:border-teal-200 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {getLabel(opt)}
            </button>
          )
        })}
      </div>

      <div className="mt-1 min-h-[1rem]">
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
}
