import type { ReactNode } from 'react'
import { 
  Search, 
  FileText, 
  Briefcase, 
  Calendar, 
  Heart, 
  Mail,
  Compass,
  Inbox,
  AlertCircle,
  Plus
} from 'lucide-react'

interface EmptyStateProps {
  icon?: 'search' | 'document' | 'job' | 'calendar' | 'heart' | 'mail' | 'compass' | 'inbox' | 'alert'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

const icons = {
  search: Search,
  document: FileText,
  job: Briefcase,
  calendar: Calendar,
  heart: Heart,
  mail: Mail,
  compass: Compass,
  inbox: Inbox,
  alert: AlertCircle
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  children
}: EmptyStateProps) {
  const IconComponent = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center">
          <IconComponent className="w-12 h-12 text-teal-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <Plus className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-slate-500 max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Custom content */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98]"
          >
            {action.icon}
            {action.label}
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

// Preset empty states for common scenarios
export function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="Inga resultat hittades"
      description={`Vi hittade inga jobb som matchar "${query}". Prova att ändra din sökning eller använd filter.`}
      action={{
        label: 'Rensa sökning',
        onClick: onClear
      }}
    />
  )
}

export function EmptyApplications() {
  return (
    <EmptyState
      icon="job"
      title="Inga ansökningar än"
      description="Du har inte skickat några ansökningar ännu. Börja söka jobb och spåra dina ansökningar här."
      action={{
        label: 'Sök jobb',
        onClick: () => window.location.href = '/job-search'
      }}
    />
  )
}

export function EmptySavedJobs() {
  return (
    <EmptyState
      icon="heart"
      title="Inga sparade jobb"
      description="När du hittar intressanta jobb kan du spara dem här för att gå tillbaka till dem senare."
      action={{
        label: 'Utforska jobb',
        onClick: () => window.location.href = '/job-search'
      }}
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="inbox"
      title="Inga notifikationer"
      description="När du skapar jobbbevakningar visas nya matchningar här."
      action={{
        label: 'Skapa bevakning',
        onClick: () => {}
      }}
    />
  )
}

export function EmptyCV() {
  return (
    <EmptyState
      icon="document"
      title="Inget CV än"
      description="Skapa ett professionellt CV för att öka dina chanser att få jobb."
      action={{
        label: 'Skapa CV',
        onClick: () => window.location.href = '/cv'
      }}
    />
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="Något gick fel"
      description={message}
      action={{
        label: 'Försök igen',
        onClick: onRetry
      }}
    />
  )
}
