/**
 * QuickActionBanner - Kontextuella snabbåtgärder
 * 
 * Visas på olika sidor för att förenkla vanliga arbetsflöden
 */

import {
  X, ArrowRight, Sparkles, Search, FileText,
  Briefcase, CheckCircle2
} from '@/components/ui/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface JobData {
  id?: string
  title?: string
  employer?: string
}

interface QuickActionBannerProps {
  type: 'cv_saved' | 'job_saved' | 'letter_saved' | 'profile_complete' | 'application_reminder'
  data?: JobData
  onDismiss?: () => void
  className?: string
}

export function QuickActionBanner({ 
  type, 
  data, 
  onDismiss,
  className 
}: QuickActionBannerProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const configs: Record<string, {
    icon: React.ReactNode
    title: string
    message: string
    primaryAction: { label: string; to?: string; onClick?: () => void }
    secondaryAction?: { label: string; to?: string; onClick?: () => void }
    bgColor: string
    borderColor: string
  }> = {
    cv_saved: {
      icon: <CheckCircle2 size={20} className="text-green-600" />,
      title: t('workflow.quickAction.cvSaved.title'),
      message: t('workflow.quickAction.cvSaved.message'),
      primaryAction: {
        label: t('workflow.quickAction.cvSaved.primary'),
        to: '/job-search'
      },
      secondaryAction: {
        label: t('workflow.quickAction.cvSaved.secondary'),
        to: '/cv'
      },
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    job_saved: {
      icon: <Briefcase size={20} className="text-[var(--c-text)]" />,
      title: t('workflow.quickAction.jobSaved.title', { title: data?.title?.substring(0, 30) || '' }),
      message: t('workflow.quickAction.jobSaved.message'),
      primaryAction: {
        label: t('workflow.quickAction.jobSaved.primary'),
        onClick: () => {
          if (data?.id) {
            navigate(`/dashboard/cover-letter?jobId=${data.id}&company=${encodeURIComponent(data.employer || '')}&title=${encodeURIComponent(data.title || '')}`)
          }
        }
      },
      secondaryAction: {
        label: t('workflow.quickAction.jobSaved.secondary'),
        to: '/job-search'
      },
      bgColor: 'bg-[var(--c-bg)]',
      borderColor: 'border-[var(--c-accent)]/60'
    },
    letter_saved: {
      icon: <FileText size={20} className="text-[var(--c-text)]" />,
      title: t('workflow.quickAction.letterSaved.title'),
      message: t('workflow.quickAction.letterSaved.message'),
      primaryAction: {
        label: t('workflow.quickAction.letterSaved.primary'),
        to: '/job-search'
      },
      secondaryAction: {
        label: t('workflow.quickAction.letterSaved.secondary'),
        to: '/cover-letter'
      },
      bgColor: 'bg-[var(--c-bg)]',
      borderColor: 'border-[var(--c-accent)]/60'
    },
    profile_complete: {
      icon: <Sparkles size={20} className="text-amber-600" />,
      title: t('workflow.quickAction.profileComplete.title'),
      message: t('workflow.quickAction.profileComplete.message'),
      primaryAction: {
        label: t('workflow.quickAction.profileComplete.primary'),
        to: '/job-search'
      },
      secondaryAction: {
        label: t('workflow.quickAction.profileComplete.secondary'),
        to: '/interest-guide'
      },
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    application_reminder: {
      icon: <Search size={20} className="text-blue-600" />,
      title: t('workflow.quickAction.applicationReminder.title'),
      message: t('workflow.quickAction.applicationReminder.message'),
      primaryAction: {
        label: t('workflow.quickAction.applicationReminder.primary'),
        to: '/job-search'
      },
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  }

  const config = configs[type]
  if (!config) return null

  return (
    <div className={cn(
      "rounded-xl border p-4 animate-in slide-in-from-top-2",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-stone-900">
            {config.title}
          </h4>
          <p className="text-sm text-stone-600 mt-0.5">
            {config.message}
          </p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {config.primaryAction.to ? (
              <Link
                to={config.primaryAction.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
              >
                {config.primaryAction.label}
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={config.primaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
              >
                {config.primaryAction.label}
                <ArrowRight size={14} />
              </button>
            )}
            
            {config.secondaryAction?.to && (
              <Link
                to={config.secondaryAction.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors"
              >
                {config.secondaryAction.label}
              </Link>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-stone-600 hover:text-stone-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// Inline Quick Action för Jobbtracker-tabell
interface JobTrackerActionsProps {
  jobId: string
  jobTitle: string
  employer: string
  status: string
  onStatusChange?: (status: string) => void
}

export function JobTrackerActions({ 
  jobId, 
  jobTitle, 
  employer,
  status,
  onStatusChange 
}: JobTrackerActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(`/cover-letter?jobId=${jobId}&company=${encodeURIComponent(employer)}&title=${encodeURIComponent(jobTitle)}`)}
        className="p-1.5 text-stone-700 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] rounded-lg transition-colors"
        title={t('workflow.quickAction.jobSaved.primary')}
      >
        <FileText size={16} />
      </button>
      
      <button
        onClick={() => navigate(`/cv?optimizeFor=${jobId}`)}
        className="p-1.5 text-stone-700 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] rounded-lg transition-colors"
        title={t('workflow.common.optimizeCvForJob')}
      >
        <Sparkles size={16} />
      </button>
      
      {status !== 'APPLIED' && (
        <button
          onClick={() => onStatusChange?.('APPLIED')}
          className="p-1.5 text-stone-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title={t('workflow.quickAction.markApplied')}
        >
          <CheckCircle2 size={16} />
        </button>
      )}
    </div>
  )
}

// Floating Action Button för Kunskapsbanken
interface FloatingBackButtonProps {
  label?: string
  to: string
}

export function FloatingBackButton({ 
  label,
  to 
}: FloatingBackButtonProps) {
  const { t } = useTranslation()
  return (
    <Link
      to={to}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[var(--c-solid)] text-white rounded-full shadow-lg hover:bg-[var(--c-solid)] hover:shadow-xl transition-all hover:-translate-y-0.5"
    >
      <ArrowRight size={18} />
      <span className="font-medium text-sm">{label || t('workflow.quickAction.backToJobSearch')}</span>
    </Link>
  )
}
