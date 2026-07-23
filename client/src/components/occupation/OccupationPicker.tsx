/**
 * OccupationPicker — Autocomplete-picker för yrken mot AF Taxonomy.
 *
 * Återanvändbar komponent som söker mot ~5000 yrken i AF:s taxonomi via
 * `autocompleteOccupations`. Returnerar valt yrke som { conceptId, label }.
 *
 * Används i:
 *   - Profil → önskade yrken
 *   - JobSearch → strukturerat yrkesfilter
 *   - CV / CoverLetter / SpontaneousApplication (framöver)
 */

import { useState, useRef, useEffect, useId, useCallback, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Loader2, AlertTriangle } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { autocompleteOccupations, type AutocompleteSuggestion } from '@/services/afTaxonomyApi'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export interface OccupationSelection {
  conceptId: string
  label: string
}

export interface OccupationPickerProps {
  /** Aktuellt val (om kontrollerad). Lämna ofyllt för okontrollerad. */
  value?: OccupationSelection | null
  /** Anropas när användaren väljer ett yrke från listan. */
  onSelect: (occupation: OccupationSelection) => void
  /** Anropas vid Enter-tryck utan vald rad — för att tillåta fritext-fallback. */
  onFreeText?: (label: string) => void
  /** Existerande conceptIds som ska markeras som "redan tillagd". */
  excludeConceptIds?: string[]
  placeholder?: string
  /** Auto-fokus vid mount. */
  autoFocus?: boolean
  /** Visa fritext-fallback-knapp när inga träffar hittas? Default false. */
  allowFreeText?: boolean
  className?: string
  disabled?: boolean
}

export function OccupationPicker({
  value,
  onSelect,
  onFreeText,
  excludeConceptIds = [],
  placeholder = 'Sök yrke — t.ex. lager, sjuksköterska, kock',
  autoFocus = false,
  allowFreeText = false,
  className,
  disabled,
}: OccupationPickerProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const listboxId = `${inputId}-listbox`

  const [input, setInput] = useState(value?.label ?? '')
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<number | undefined>()

  const debouncedQuery = useDebounce(input, 250)

  // Sync external value → internal input
  useEffect(() => {
    if (value?.label !== undefined && value.label !== input) {
      setInput(value.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.conceptId])

  // Auto-fokus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Sök yrken när användaren skriver
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    autocompleteOccupations(debouncedQuery)
      .then((results) => {
        if (cancelled) return
        setSuggestions(results)
        setActiveIndex(results.length > 0 ? 0 : -1)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Kunde inte hämta yrken')
        setSuggestions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      onSelect({ conceptId: suggestion.id, label: suggestion.label })
      setInput('')
      setSuggestions([])
      setOpen(false)
      setActiveIndex(-1)
    },
    [onSelect],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (suggestions.length > 0) {
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
            setOpen(true)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (suggestions.length > 0) {
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
            setOpen(true)
          }
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            handleSelect(suggestions[activeIndex])
          } else if (allowFreeText && onFreeText && input.trim().length >= 2) {
            onFreeText(input.trim())
            setInput('')
            setOpen(false)
          }
          break
        case 'Escape':
          setOpen(false)
          setActiveIndex(-1)
          break
      }
    },
    [activeIndex, suggestions, handleSelect, allowFreeText, onFreeText, input],
  )

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      setActiveIndex(-1)
    }, 150)
  }
  const handleFocus = () => {
    if (blurTimeoutRef.current) window.clearTimeout(blurTimeoutRef.current)
    setOpen(true)
  }

  const showDropdown = open && (loading || suggestions.length > 0 || error !== null)
  const excluded = new Set(excludeConceptIds)

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'w-full pl-9 pr-9 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700',
            'bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100',
            'placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
        {input && !disabled && (
          <button
            type="button"
            onClick={() => {
              setInput('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            aria-label={t('common.clear', 'Rensa')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
          >
            <X size={14} />
          </button>
        )}
        {loading && (
          <Loader2
            size={14}
            className="absolute right-9 top-1/2 -translate-y-1/2 animate-spin text-stone-400"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('occupation.aria.suggestionsAria', 'Yrkesförslag')}
          className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-72 overflow-y-auto py-1"
        >
          {error && (
            <li className="px-3 py-2 text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </li>
          )}
          {!error && loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-stone-500 dark:text-stone-400">Söker yrken…</li>
          )}
          {!error && !loading && input.length >= 2 && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-stone-500 dark:text-stone-400">
              Inga yrken matchade "{input}".
              {allowFreeText && onFreeText && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onFreeText(input.trim())
                    setInput('')
                    setOpen(false)
                  }}
                  className="ml-1 underline text-stone-700 hover:text-stone-900"
                >
                  Lägg till som fritext
                </button>
              )}
            </li>
          )}
          {suggestions.map((sug, idx) => {
            const isExcluded = excluded.has(sug.id)
            const isActive = idx === activeIndex
            return (
              <li
                key={sug.id}
                id={`${listboxId}-${idx}`}
                role="option"
                aria-selected={isActive}
                aria-disabled={isExcluded}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (!isExcluded) handleSelect(sug)
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2',
                  isActive && !isExcluded && 'bg-stone-100 dark:bg-stone-800',
                  isExcluded && 'opacity-60 cursor-not-allowed',
                  !isActive && !isExcluded && 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
                )}
              >
                <span className="text-stone-800 dark:text-stone-200">{sug.label}</span>
                {isExcluded && (
                  <span className="text-[11px] text-stone-500 italic">redan tillagd</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
