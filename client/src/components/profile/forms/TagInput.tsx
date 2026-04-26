/**
 * TagInput - Accessible tag input with autocomplete
 */

import { useState, useRef, useId, useCallback, useEffect, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { validateTag, sanitizeInput } from '@/lib/validators'
import { VALIDATION } from '../constants'

export interface SuggestionItem {
  value: string
  labelKey?: string
  label?: string
}

export interface TagInputProps {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (index: number) => void
  suggestions?: readonly (string | SuggestionItem)[]
  placeholder?: string
  maxTags?: number
  maxLength?: number
  label?: string
  hint?: string
  error?: string
  colorScheme?: 'brand' | 'amber' | 'sky'
  disabled?: boolean
  className?: string
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
  placeholder,
  maxTags = VALIDATION.MAX_TAGS,
  maxLength = VALIDATION.MAX_TAG_LENGTH,
  label,
  hint,
  error: externalError,
  colorScheme = 'brand',
  disabled = false,
  className
}: TagInputProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const defaultPlaceholder = placeholder || t('common.addTag')
  const listboxId = `${inputId}-listbox`
  const labelId = `${inputId}-label`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [internalError, setInternalError] = useState<string | undefined>()
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>()

  const error = externalError || internalError

  const colorClasses = {
    brand: {
      tag: 'bg-brand-50 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300',
      tagHover: 'hover:bg-brand-100 dark:hover:bg-brand-900/60',
      button: 'bg-brand-900 hover:bg-brand-900/90 focus:ring-brand-900',
      focus: 'focus:ring-brand-900 focus:border-brand-900',
      suggestion: 'hover:bg-brand-50 dark:hover:bg-brand-900/40'
    },
    amber: {
      tag: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      tagHover: 'hover:bg-amber-100 dark:hover:bg-amber-800',
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
      focus: 'focus:ring-amber-400 focus:border-amber-400',
      suggestion: 'hover:bg-amber-50 dark:hover:bg-amber-900/40'
    },
    sky: {
      tag: 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
      tagHover: 'hover:bg-sky-100 dark:hover:bg-sky-800',
      button: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400',
      focus: 'focus:ring-sky-400 focus:border-sky-400',
      suggestion: 'hover:bg-sky-50 dark:hover:bg-sky-900/40'
    }
  }
  const colors = colorClasses[colorScheme]

  // Helper to get suggestion label
  const getSuggestionLabel = useCallback((s: string | SuggestionItem): string => {
    if (typeof s === 'string') return s
    if (s.labelKey) return t(s.labelKey)
    return s.label || s.value
  }, [t])

  // Filter suggestions
  const filteredSuggestions = suggestions
    .map(s => ({
      original: s,
      label: getSuggestionLabel(s)
    }))
    .filter(({ label }) =>
      label.toLowerCase().includes(input.toLowerCase()) &&
      !tags.some(tag => tag.toLowerCase() === label.toLowerCase())
    )
    .slice(0, 5)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [])

  const handleAdd = useCallback((tag: string) => {
    const sanitized = sanitizeInput(tag.trim())
    const validation = validateTag(sanitized, tags, maxTags, maxLength)

    if (!validation.valid) {
      setInternalError(validation.error)
      return
    }

    setInternalError(undefined)
    onAdd(sanitized)
    setInput('')
    setShowSuggestions(false)
    setActiveIndex(-1)
  }, [tags, maxTags, maxLength, onAdd])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setInput(value)
      setInternalError(undefined)
      setShowSuggestions(true)
      setActiveIndex(-1)
    }
  }, [maxLength])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
          handleAdd(filteredSuggestions[activeIndex].label)
        } else if (input.trim()) {
          handleAdd(input)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (showSuggestions && filteredSuggestions.length > 0) {
          setActiveIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (showSuggestions && filteredSuggestions.length > 0) {
          setActiveIndex(prev =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          )
        }
        break
      case 'Backspace':
        if (!input && tags.length > 0) {
          onRemove(tags.length - 1)
        }
        break
    }
  }, [activeIndex, filteredSuggestions, input, showSuggestions, tags.length, handleAdd, onRemove])

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion
    suggestionTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }, 150)
  }, [])

  const handleSuggestionClick = useCallback((suggestionLabel: string) => {
    handleAdd(suggestionLabel)
    inputRef.current?.focus()
  }, [handleAdd])

  const canAddMore = tags.length < maxTags

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={inputId}
          className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
        >
          {label}
        </label>
      )}

      {/* Tags */}
      <div
        role="list"
        aria-label={t('common.tagsCount', { label: label || t('common.tags'), count: tags.length, max: maxTags })}
        className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]"
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            role="listitem"
            className={cn(
              'inline-flex items-center gap-0.5 pl-2 pr-1 py-0.5 rounded text-xs font-medium leading-tight',
              colors.tag
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={disabled}
              aria-label={t('common.removeTag', { tag })}
              className={cn(
                'w-4 h-4 flex items-center justify-center rounded ml-0.5 transition-colors',
                'focus:outline-none focus:ring-1 focus:ring-current',
                colors.tagHover,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <X className="w-2.5 h-2.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      {canAddMore && !disabled && (
        <div className="relative">
          <div className="flex gap-1">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              value={input}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={defaultPlaceholder}
              disabled={disabled}
              aria-expanded={showSuggestions && filteredSuggestions.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
              aria-describedby={cn(
                error && errorId,
                hint && !error && hintId,
                `${inputId}-instructions`
              )}
              className={cn(
                'flex-1 px-2 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded text-xs text-stone-900 dark:text-stone-100',
                'placeholder:text-stone-400 dark:placeholder:text-stone-500',
                'focus:outline-none focus:ring-1',
                colors.focus
              )}
            />
            <button
              type="button"
              onClick={() => handleAdd(input)}
              disabled={!input.trim() || disabled}
              aria-label={t('common.add')}
              className={cn(
                'px-2 py-1 text-white rounded text-xs transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                colors.button
              )}
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          <span id={`${inputId}-instructions`} className="sr-only">
            {t('common.tagInputInstructions')}
          </span>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t('common.suggestions')}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded shadow-lg z-10 py-0.5 max-h-40 overflow-y-auto"
            >
              {filteredSuggestions.map(({ label }, index) => (
                <li
                  key={label}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => handleSuggestionClick(label)}
                  className={cn(
                    'w-full px-2 py-1.5 text-left text-xs text-stone-700 dark:text-stone-300 cursor-pointer',
                    colors.suggestion,
                    index === activeIndex && 'bg-brand-50 dark:bg-brand-900/40'
                  )}
                >
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-1 min-h-[1rem]">
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
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {tags.length}/{maxTags}
        </span>
      </div>
    </div>
  )
}
