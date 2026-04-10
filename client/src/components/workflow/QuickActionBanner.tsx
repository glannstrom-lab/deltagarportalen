/**
 * QuickActionBanner - Kontextuella snabbåtgärder
 * 
 * Visas på olika sidor för att förenkla vanliga arbetsflöden
 */

import { 
  X, ArrowRight, Sparkles, Search, FileText, 
  Briefcase, CheckCircle2, ExternalLink
} from '@/components/ui/icons'
import { Link, useNavigate } from 'react-router-dom'
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
      title: 'CV:t är sparat!',
      message: 'Nu är det dags att hitta jobb som matchar dina kompetenser.',
      primaryAction: {
        label: 'Sök jobb med detta CV',
        to: '/job-search'
      },
      secondaryAction: {
        label: 'Optimera CV:t ytterligare',
        to: '/cv'
      },
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    job_saved: {
      icon: <Briefcase size={20} className="text-teal-600" />,
      title: `Jobbet "${data?.title?.substring(0, 30) || ''}..." sparat!`,
      message: 'Vill du skriva ett personligt brev medan du har jobbet i minnet?',
      primaryAction: {
        label: 'Skriv personligt brev',
        onClick: () => {
          if (data?.id) {
            navigate(`/dashboard/cover-letter?jobId=${data.id}&company=${encodeURIComponent(data.employer || '')}&title=${encodeURIComponent(data.title || '')}`)
          }
        }
      },
      secondaryAction: {
        label: 'Se sparade jobb',
        to: '/job-search'
      },
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    letter_saved: {
      icon: <FileText size={20} className="text-teal-600" />,
      title: 'Personligt brev sparat!',
      message: 'Bra jobbat! När du hittar fler intressanta jobb kan du använda detta som mall.',
      primaryAction: {
        label: 'Sök fler jobb',
        to: '/job-search'
      },
      secondaryAction: {
        label: 'Se alla brev',
        to: '/cover-letter'
      },
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    profile_complete: {
      icon: <Sparkles size={20} className="text-amber-600" />,
      title: 'Profilen är komplett!',
      message: 'Du har allt du behöver för att börja söka jobb på allvar.',
      primaryAction: {
        label: 'Börja söka jobb',
        to: '/job-search'
      },
      secondaryAction: {
        label: 'Se intresseguiden',
        to: '/interest-guide'
      },
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    application_reminder: {
      icon: <Search size={20} className="text-blue-600" />,
      title: 'Påminnelse: Sök jobb idag',
      message: 'Regelbunden jobbsökning ökar dina chanser. Sätt av 30 minuter nu!',
      primaryAction: {
        label: 'Hitta jobb nu',
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
          <h4 className="font-semibold text-slate-900">
            {config.title}
          </h4>
          <p className="text-sm text-slate-600 mt-0.5">
            {config.message}
          </p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {config.primaryAction.to ? (
              <Link
                to={config.primaryAction.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                {config.primaryAction.label}
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={config.primaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                {config.primaryAction.label}
                <ArrowRight size={14} />
              </button>
            )}
            
            {config.secondaryAction?.to && (
              <Link
                to={config.secondaryAction.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors"
              >
                {config.secondaryAction.label}
              </Link>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-slate-600 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
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
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(`/cover-letter?jobId=${jobId}&company=${encodeURIComponent(employer)}&title=${encodeURIComponent(jobTitle)}`)}
        className="p-1.5 text-slate-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        title="Skriv personligt brev"
      >
        <FileText size={16} />
      </button>
      
      <button
        onClick={() => navigate(`/cv?optimizeFor=${jobId}`)}
        className="p-1.5 text-slate-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        title="Optimera CV för detta jobb"
      >
        <Sparkles size={16} />
      </button>
      
      {status !== 'APPLIED' && (
        <button
          onClick={() => onStatusChange?.('APPLIED')}
          className="p-1.5 text-slate-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Markera som ansökt"
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
  label = 'Tillbaka till jobbsökning',
  to 
}: FloatingBackButtonProps) {
  return (
    <Link
      to={to}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 hover:shadow-xl transition-all hover:-translate-y-0.5"
    >
      <ArrowRight size={18} />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  )
}
