/**
 * ProgressSlider - Accessible range slider component
 */

import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressSliderProps {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  unit?: string
  showValue?: boolean
  colorScheme?: 'teal' | 'amber' | 'sky'
  disabled?: boolean
  hint?: string
  className?: string
}

export function ProgressSlider({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 5,
  unit = '%',
  showValue = true,
  colorScheme = 'teal',
  disabled = false,
  hint,
  className
}: ProgressSliderProps) {
  const sliderId = useId()
  const hintId = `${sliderId}-hint`

  const colorClasses = {
    teal: 'accent-teal-500',
    amber: 'accent-amber-500',
    sky: 'accent-sky-500'
  }

  const valueColorClasses = {
    teal: 'text-teal-600 dark:text-teal-400',
    amber: 'text-amber-600 dark:text-amber-400',
    sky: 'text-sky-600 dark:text-sky-400'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10))
  }

  // Calculate value text for screen readers
  const valueText = `${value}${unit}`

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <label
          htmlFor={sliderId}
          className="text-xs font-medium text-stone-600 dark:text-stone-400"
        >
          {label}
        </label>
        {showValue && (
          <span
            className={cn('text-xs font-bold', valueColorClasses[colorScheme])}
            aria-hidden="true"
          >
            {valueText}
          </span>
        )}
      </div>

      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          'w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-2',
          colorClasses[colorScheme],
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />

      {hint && (
        <p id={hintId} className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {hint}
        </p>
      )}
    </div>
  )
}
