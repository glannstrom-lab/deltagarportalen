/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * Personality Dropdown Component - Clean Design
 * Allows users to select the AI agent's personality
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAITeamStore } from '@/stores/aiTeamStore'
import { ChevronDown, Check, Smile } from '@/components/ui/icons'
import type { Personality, PersonalityId } from './types'

// Personality definitions with system prompts
export const personalities: Personality[] = [
  // Serious personalities
  {
    id: 'professional',
    nameKey: 'aiTeam.personalities.professional.name',
    descriptionKey: 'aiTeam.personalities.professional.description',
    category: 'serious',
  },
  {
    id: 'empathetic',
    nameKey: 'aiTeam.personalities.empathetic.name',
    descriptionKey: 'aiTeam.personalities.empathetic.description',
    category: 'serious',
  },
  {
    id: 'direct',
    nameKey: 'aiTeam.personalities.direct.name',
    descriptionKey: 'aiTeam.personalities.direct.description',
    category: 'serious',
  },
  // Fun personalities
  {
    id: 'arnold',
    nameKey: 'aiTeam.personalities.arnold.name',
    descriptionKey: 'aiTeam.personalities.arnold.description',
    category: 'fun',
  },
  {
    id: 'mormor',
    nameKey: 'aiTeam.personalities.mormor.name',
    descriptionKey: 'aiTeam.personalities.mormor.description',
    category: 'fun',
  },
  {
    id: 'pirate',
    nameKey: 'aiTeam.personalities.pirate.name',
    descriptionKey: 'aiTeam.personalities.pirate.description',
    category: 'fun',
  },
  {
    id: 'sportscaster',
    nameKey: 'aiTeam.personalities.sportscaster.name',
    descriptionKey: 'aiTeam.personalities.sportscaster.description',
    category: 'fun',
  },
]

export function getPersonalityById(id: PersonalityId): Personality {
  return personalities.find((p) => p.id === id) || personalities[0]
}

interface PersonalityDropdownProps {
  className?: string
}

export function PersonalityDropdown({ className }: PersonalityDropdownProps) {
  const { t } = useTranslation()
  const { selectedPersonality, setPersonality } = useAITeamStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  /* Menyn avmonteras när den stängs. Stod fokus på ett alternativ försvann
     noden och fokus föll till <body> — WCAG 2.4.3. */
  const triggerRef = useRef<HTMLButtonElement>(null)
  const stäng = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const currentPersonality = getPersonalityById(selectedPersonality)
  const seriousPersonalities = personalities.filter((p) => p.category === 'serious')
  const funPersonalities = personalities.filter((p) => p.category === 'fun')

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        stäng()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    /* `relative` saknades, så panelen nedan (`absolute left-4 right-4`)
       positionerades mot sidan i stället för mot sin egen kolumn: uppmätt
       1440 px bred mot en 169 px trigger, utfälld över hela chatten. */
    <div className={cn('relative space-y-3', className)} ref={dropdownRef}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <Smile className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        </div>
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          {t('aiTeam.personality')}
        </span>
      </div>

      {/* Dropdown Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-3 py-2.5 rounded-lg',
          'bg-stone-50 dark:bg-stone-800',
          'border border-stone-200 dark:border-stone-700',
          'hover:bg-stone-100 dark:hover:bg-stone-700',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
          'transition-colors'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {t(currentPersonality.nameKey)}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
            {t(currentPersonality.descriptionKey)}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 left-0 right-0 mt-1',
            'bg-white dark:bg-stone-800',
            'border border-stone-200 dark:border-stone-700',
            'rounded-xl shadow-lg',
            'overflow-hidden'
          )}
          role="listbox"
          aria-label={t('aiTeam.selectPersonality')}
        >
          {/* Serious personalities */}
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              {t('aiTeam.personalityCategories.serious')}
            </div>
            {seriousPersonalities.map((personality) => (
              <PersonalityOption
                key={personality.id}
                personality={personality}
                isSelected={selectedPersonality === personality.id}
                onSelect={() => {
                  setPersonality(personality.id)
                  stäng()
                }}
              />
            ))}
          </div>

          <div className="border-t border-stone-100 dark:border-stone-700" />

          {/* Fun personalities */}
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              {t('aiTeam.personalityCategories.fun')}
            </div>
            {funPersonalities.map((personality) => (
              <PersonalityOption
                key={personality.id}
                personality={personality}
                isSelected={selectedPersonality === personality.id}
                onSelect={() => {
                  setPersonality(personality.id)
                  stäng()
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PersonalityOptionProps {
  personality: Personality
  isSelected: boolean
  onSelect: () => void
}

function PersonalityOption({ personality, isSelected, onSelect }: PersonalityOptionProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between',
        'px-2 py-2 rounded-lg',
        'transition-colors',
        isSelected
          ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)]'
          : 'hover:bg-stone-50 dark:hover:bg-stone-700'
      )}
      role="option"
      aria-selected={isSelected}
    >
      <div className="flex flex-col items-start text-left">
        <span className="text-sm font-medium">{t(personality.nameKey)}</span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {t(personality.descriptionKey)}
        </span>
      </div>
      {isSelected && (
        <Check className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0 ml-2" aria-hidden="true" />
      )}
    </button>
  )
}

export default PersonalityDropdown
