/**
 * TagInput - Accessible tag input with autocomplete and improved UX
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
  colorScheme?: 'teal' | 'amber' | 'sky'
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
  colorScheme = 'teal',
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
    teal: {
      tag: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-accent)] border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50',
      tagHover: 'hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-solid)]',
      button: 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] focus:ring-[var(--c-solid)]',
      focus: 'focus:ring-[var(--c-solid)] focus:border-[var(--c-solid)]',
      suggestion: 'hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/40'
    },
    amber: {
      tag: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      tagHover: 'hover:bg-amber-100 dark:hover:bg-amber-800',
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
      focus: 'focus:ring-amber-400 focus:border-amber-400',
      suggestion: 'hover:bg-amber-50 dark:hover:bg-amber-900/40'
    },
    sky: {
      tag: 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
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

      {/* Tags - improved styling */}
      <div
        role="list"
        aria-label={t('common.tagsCount', { label: label || t('common.tags'), count: tags.length, max: maxTags })}
        className="flex flex-wrap gap-1.5 mb-3 min-h-[1.75rem]"
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            role="listitem"
            className={cn(
              'inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border',
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
                'w-4 h-4 flex items-center justify-center rounded-full transition-colors',
                'focus:outline-none focus:ring-1 focus:ring-current',
                colors.tagHover,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-stone-400 dark:text-stone-500 italic py-1">
            Inga tillagda ännu
          </span>
        )}
      </div>

      {/* Input */}
      {canAddMore && !disabled && (
        <div className="relative">
          <div className="flex gap-2">
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
                'flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100',
                'placeholder:text-stone-400 dark:placeholder:text-stone-500',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                colors.focus
              )}
            />
            <button
              type="button"
              onClick={() => handleAdd(input)}
              disabled={!input.trim() || disabled}
              aria-label={t('common.add')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                colors.button
              )}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Lägg till</span>
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
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map(({ label }, index) => (
                <li
                  key={label}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => handleSuggestionClick(label)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 cursor-pointer',
                    colors.suggestion,
                    index === activeIndex && 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40'
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
      <div className="flex justify-between items-center mt-2 min-h-[1.25rem]">
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
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          tags.length >= maxTags
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
        )}>
          {tags.length} av {maxTags}
        </span>
      </div>
    </div>
  )
}
