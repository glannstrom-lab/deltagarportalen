import { GraduationCap, Brain, BookOpen, Languages } from '@/components/ui/icons'

interface DifficultyBadgeProps {
  level: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const config = {
  'easy-swedish': {
    label: 'Lätt svenska',
    description: 'Skriven på lätt svenska',
    color: 'bg-brand-100 text-brand-900',
    icon: Languages,
  },
  easy: {
    label: 'Enkelt',
    description: 'Lätt att förstå',
    color: 'bg-emerald-100 text-emerald-700',
    icon: BookOpen,
  },
  medium: {
    label: 'Medel',
    description: 'Standard',
    color: 'bg-blue-100 text-blue-700',
    icon: GraduationCap,
  },
  detailed: {
    label: 'Fördjupning',
    description: 'Fördjupad information',
    color: 'bg-purple-100 text-purple-700',
    icon: Brain,
  },
}

export default function DifficultyBadge({
  level,
  showLabel = true,
  size = 'sm'
}: DifficultyBadgeProps) {
  const { label, color, icon: Icon } = config[level]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${color} ${sizeClasses[size]}`}
      title={`Svårighetsgrad: ${label}`}
    >
      <Icon size={iconSizes[size]} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}
