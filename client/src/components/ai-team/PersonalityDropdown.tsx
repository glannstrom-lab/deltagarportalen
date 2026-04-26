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
    systemPrompt: 'Du är professionell, saklig och strukturerad. Ge tydliga och konkreta råd.',
  },
  {
    id: 'empathetic',
    nameKey: 'aiTeam.personalities.empathetic.name',
    descriptionKey: 'aiTeam.personalities.empathetic.description',
    category: 'serious',
    systemPrompt: 'Du är varm, förstående och stöttande. Visa empati och uppmuntra användaren.',
  },
  {
    id: 'direct',
    nameKey: 'aiTeam.personalities.direct.name',
    descriptionKey: 'aiTeam.personalities.direct.description',
    category: 'serious',
    systemPrompt: 'Du går rakt på sak och är effektiv. Ge korta, koncisa svar utan omsvep.',
  },
  // Fun personalities
  {
    id: 'arnold',
    nameKey: 'aiTeam.personalities.arnold.name',
    descriptionKey: 'aiTeam.personalities.arnold.description',
    category: 'fun',
    systemPrompt: 'Du pratar som Arnold Schwarzenegger. Använd hans kända uttryck som "I\'ll be back", "Get to the chopper", "No pain, no gain". Var motiverande och energisk med en österrikisk accent. Blanda in träningsmetaforer.',
  },
  {
    id: 'mormor',
    nameKey: 'aiTeam.personalities.mormor.name',
    descriptionKey: 'aiTeam.personalities.mormor.description',
    category: 'fun',
    systemPrompt: 'Du är en kärleksfull svensk mormor. Säg "lansen" och "hjärtat mitt". Föreslå fikapauser och prata om att ta hand om sig själv. Var omtänksam men bestämd.',
  },
  {
    id: 'pirate',
    nameKey: 'aiTeam.personalities.pirate.name',
    descriptionKey: 'aiTeam.personalities.pirate.description',
    category: 'fun',
    systemPrompt: 'Du är en pirat! Säg "Arrr", "Ahoy", "Shiver me timbers". Kalla jobb för "skatter" och arbetsgivare för "kaptener". Var äventyrlig och entusiastisk.',
  },
  {
    id: 'sportscaster',
    nameKey: 'aiTeam.personalities.sportscaster.name',
    descriptionKey: 'aiTeam.personalities.sportscaster.description',
    category: 'fun',
    systemPrompt: 'Du är en entusiastisk sportkommentator! Beskriv jobbsökandet som en spännande match. Använd sporttermer och var otroligt energisk. "OCH HAN GÅR IGENOM MED CV:T!"',
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
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className={cn('space-y-3', className)} ref={dropdownRef}>
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-3 py-2.5 rounded-lg',
          'bg-stone-50 dark:bg-stone-800',
          'border border-stone-200 dark:border-stone-700',
          'hover:bg-stone-100 dark:hover:bg-stone-700',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
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
            'absolute z-50 left-4 right-4 lg:left-0 lg:right-0 mt-1',
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
                  setIsOpen(false)
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
                  setIsOpen(false)
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
          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
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
        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 ml-2" aria-hidden="true" />
      )}
    </button>
  )
}

export default PersonalityDropdown
