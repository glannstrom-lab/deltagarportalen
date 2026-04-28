import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  Plus,
} from '@/components/ui/icons'

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
        <div className="w-24 h-24 bg-gradient-to-br from-[var(--c-accent)]/40 to-[var(--c-bg)] dark:from-[var(--c-bg)]/40 dark:to-[var(--c-bg)]/30 rounded-full flex items-center justify-center">
          <IconComponent className="w-12 h-12 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
          <Plus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-stone-700 dark:text-stone-600 max-w-md mb-6">
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:bg-[var(--c-text)] transition-all hover:shadow-lg hover:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
          >
            {action.icon}
            {action.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
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
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="search"
      title={t('empty.noResultsFound')}
      description={t('empty.noResultsQuery', { query })}
      action={{
        label: t('empty.clearSearch'),
        onClick: onClear,
      }}
    />
  )
}

export function EmptyApplications() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="job"
      title={t('empty.noApplicationsYet')}
      description={t('empty.noApplicationsDesc')}
      action={{
        label: t('jobSearch.title'),
        onClick: () => (window.location.href = '/job-search'),
      }}
    />
  )
}

export function EmptySavedJobs() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="heart"
      title={t('empty.noSavedJobs')}
      description={t('empty.noSavedJobsDesc')}
      action={{
        label: t('jobSearch.exploreJobs'),
        onClick: () => (window.location.href = '/job-search'),
      }}
    />
  )
}

export function EmptyNotifications() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="inbox"
      title={t('empty.noNotifications')}
      description={t('empty.noNotificationsDesc')}
      action={{
        label: t('empty.createAlert'),
        onClick: () => {},
      }}
    />
  )
}

export function EmptyCV() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="document"
      title={t('empty.noCvYet')}
      description={t('empty.noCvDesc')}
      action={{
        label: t('cv.createCV'),
        onClick: () => (window.location.href = '/cv'),
      }}
    />
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="alert"
      title={t('errors.somethingWentWrong')}
      description={message}
      action={{
        label: t('common.tryAgain'),
        onClick: onRetry,
      }}
    />
  )
}
