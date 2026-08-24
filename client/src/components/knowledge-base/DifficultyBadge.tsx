/**
 * Svårighetsbricka.
 *
 * En kulör, tre intensiteter (DESIGN.md §4). Tidigare hade `easy`, `medium`
 * och `detailed` var sin palettfamilj — emerald, blue, purple — som stod
 * bredvid varandra på samma artikelkort, på en sida som redan bar fem
 * hubbpasteller. Ingen av de tre hade `dark:`-variant heller, så de
 * renderades som ljusa pastellbrickor mitt på ett mörkt kort.
 *
 * "Lätt svenska" behåller sidans hubbfärg eftersom den kategorin faktiskt
 * betyder något annat än en gradering: den säger vilket SPRÅK texten har.
 *
 * Ordet "Svårighetsgrad" låg bara i `title`, som skärmläsare inte läser när
 * elementet redan har text. Det ligger nu i ett `sr-only`-prefix.
 */

import { useTranslation } from 'react-i18next'
import { GraduationCap, Brain, BookOpen, Languages } from '@/components/ui/icons'

interface DifficultyBadgeProps {
  level: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const NEUTRAL = 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200'

const config = {
  'easy-swedish': {
    label: 'Lätt svenska',
    color: 'bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]',
    icon: Languages,
  },
  easy: { label: 'Enkelt', color: NEUTRAL, icon: BookOpen },
  medium: { label: 'Medel', color: NEUTRAL, icon: GraduationCap },
  detailed: { label: 'Fördjupning', color: NEUTRAL, icon: Brain },
}

export default function DifficultyBadge({
  level,
  showLabel = true,
  size = 'sm',
}: DifficultyBadgeProps) {
  const { t } = useTranslation()
  const { label, color, icon: Icon } = config[level]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : 14} aria-hidden="true" />
      <span className="sr-only">{t('knowledgeBase.difficultyBadge.difficultyLevel')}</span>
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  )
}
