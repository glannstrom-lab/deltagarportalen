import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  Heart,
  Target,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Sparkles
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type: 'cv' | 'jobs' | 'wellness' | 'quests' | 'insights' | 'learning'
  title?: string
  description?: string
  actionLabel?: string
  actionLink?: string
  onAction?: () => void
}

const emptyStateConfig = {
  cv: {
    icon: FileText,
    color: 'violet',
    defaultTitle: 'Inget CV än',
    defaultDescription: 'Skapa ditt CV för att komma igång med jobbsökandet',
    defaultAction: 'Skapa CV',
    defaultLink: '/cv'
  },
  jobs: {
    icon: Search,
    color: 'blue',
    defaultTitle: 'Inga sparade jobb',
    defaultDescription: 'Sök och spara jobb som intresserar dig',
    defaultAction: 'Hitta jobb',
    defaultLink: '/job-search'
  },
  wellness: {
    icon: Heart,
    color: 'rose',
    defaultTitle: 'Inga aktiviteter än',
    defaultDescription: 'Börja logga ditt humör och dina aktiviteter',
    defaultAction: 'Logga välmående',
    defaultLink: '/wellness'
  },
  quests: {
    icon: Target,
    color: 'amber',
    defaultTitle: 'Inga quests idag',
    defaultDescription: 'Dagens quests visas här när de är tillgängliga',
    defaultAction: 'Se alla aktiviteter',
    defaultLink: '/activity'
  },
  insights: {
    icon: Lightbulb,
    color: 'amber',
    defaultTitle: 'Inga insikter än',
    defaultDescription: 'Vi analyserar din data för att ge personliga rekommendationer',
    defaultAction: 'Utforska insikter',
    defaultLink: '/insights'
  },
  learning: {
    icon: BookOpen,
    color: 'teal',
    defaultTitle: 'Inga lektioner påbörjade',
    defaultDescription: 'Börja din utvecklingsresa med våra mikro-lektioner',
    defaultAction: 'Börja lära',
    defaultLink: '/learning'
  }
}

const colorClasses: Record<string, { bg: string; text: string; border: string; button: string }> = {
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    button: 'bg-violet-600 hover:bg-violet-700'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    button: 'bg-rose-600 hover:bg-rose-700'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    button: 'bg-teal-600 hover:bg-teal-700'
  }
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionLink,
  onAction
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon
  const colors = colorClasses[config.color]
  
  const finalTitle = title || config.defaultTitle
  const finalDescription = description || config.defaultDescription
  const finalAction = actionLabel || config.defaultAction
  const finalLink = actionLink || config.defaultLink

  const content = (
    <div className={cn(
      "flex flex-col items-center text-center p-6 rounded-2xl border-2 border-dashed transition-all duration-200",
      colors.bg,
      colors.border,
      "hover:border-solid hover:shadow-md"
    )}>
      {/* Icon */}
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
        "bg-white",
        colors.text
      )}>
        <Icon size={32} />
      </div>
      
      {/* Decorative sparkles */}
      <div className="relative mb-4">
        <Sparkles 
          size={16} 
          className={cn(
            "absolute -top-6 -left-8 opacity-50",
            colors.text
          )} 
        />
        <Sparkles 
          size={12} 
          className={cn(
            "absolute -top-4 -right-6 opacity-30",
            colors.text
          )} 
        />
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {finalTitle}
      </h3>
      <p className="text-sm text-slate-600 mb-5 max-w-xs">
        {finalDescription}
      </p>
      
      {/* Action */}
      {onAction ? (
        <button
          onClick={onAction}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200",
            "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            colors.button
          )}
        >
          {finalAction}
          <ArrowRight size={16} />
        </button>
      ) : (
        <Link
          to={finalLink}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200",
            "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            colors.button
          )}
        >
          {finalAction}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )

  return content
}

// Compact version for widgets
export function EmptyStateCompact({
  type,
  description
}: Omit<EmptyStateProps, 'title' | 'actionLabel' | 'actionLink' | 'onAction'>) {
  const config = emptyStateConfig[type]
  const Icon = config.icon
  const colors = colorClasses[config.color]

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border",
      colors.bg,
      colors.border
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm",
        colors.text
      )}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-600">
        {description || config.defaultDescription}
      </p>
    </div>
  )
}

export default EmptyState
