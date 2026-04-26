/**
 * CompletionGuide - Guide som visar saknade fält och förbättringsförslag
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle, Circle, ChevronRight, AlertTriangle,
  User, FileText, Star, Briefcase, GraduationCap, Image
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface CompletionItem {
  id: string
  label: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  link?: string
  action?: () => void
  icon: React.ReactNode
}

interface Props {
  profile: {
    first_name?: string
    last_name?: string
    phone?: string
    location?: string
    profile_image_url?: string
  } | null
  cv: {
    summary?: string
    workExperience?: unknown[]
    education?: unknown[]
    skills?: unknown[]
  } | null
  skillsCount: number
  documentsCount: number
  hasSummary: boolean
  className?: string
}

export function CompletionGuide({
  profile,
  cv,
  skillsCount,
  documentsCount,
  hasSummary,
  className
}: Props) {
  const { t } = useTranslation()

  const items: CompletionItem[] = [
    {
      id: 'name',
      label: t('profile.completionGuide.items.name.label'),
      description: t('profile.completionGuide.items.name.description'),
      completed: Boolean(profile?.first_name && profile?.last_name),
      priority: 'high',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'photo',
      label: t('profile.completionGuide.items.photo.label'),
      description: t('profile.completionGuide.items.photo.description'),
      completed: Boolean(profile?.profile_image_url),
      priority: 'medium',
      icon: <Image className="w-4 h-4" />
    },
    {
      id: 'contact',
      label: t('profile.completionGuide.items.contact.label'),
      description: t('profile.completionGuide.items.contact.description'),
      completed: Boolean(profile?.phone && profile?.location),
      priority: 'high',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'cv-summary',
      label: t('profile.completionGuide.items.cvSummary.label'),
      description: t('profile.completionGuide.items.cvSummary.description'),
      completed: Boolean(cv?.summary),
      priority: 'high',
      link: '/cv-builder',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'experience',
      label: t('profile.completionGuide.items.experience.label'),
      description: t('profile.completionGuide.items.experience.description'),
      completed: Boolean(cv?.workExperience?.length),
      priority: 'high',
      link: '/cv-builder',
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      id: 'education',
      label: t('profile.completionGuide.items.education.label'),
      description: t('profile.completionGuide.items.education.description'),
      completed: Boolean(cv?.education?.length),
      priority: 'medium',
      link: '/cv-builder',
      icon: <GraduationCap className="w-4 h-4" />
    },
    {
      id: 'skills',
      label: t('profile.completionGuide.items.skills.label'),
      description: t('profile.completionGuide.items.skills.description'),
      completed: skillsCount >= 3,
      priority: 'medium',
      icon: <Star className="w-4 h-4" />
    },
    {
      id: 'ai-summary',
      label: t('profile.completionGuide.items.aiSummary.label'),
      description: t('profile.completionGuide.items.aiSummary.description'),
      completed: hasSummary,
      priority: 'low',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'documents',
      label: t('profile.completionGuide.items.documents.label'),
      description: t('profile.completionGuide.items.documents.description'),
      completed: documentsCount > 0,
      priority: 'low',
      icon: <FileText className="w-4 h-4" />
    }
  ]

  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length
  const completionPercent = Math.round((completedCount / totalCount) * 100)

  const incompleteItems = items.filter(i => !i.completed)
  const highPriorityIncomplete = incompleteItems.filter(i => i.priority === 'high')

  const getPriorityColor = (priority: CompletionItem['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
      case 'low': return 'text-sky-500 bg-sky-50 dark:bg-sky-900/20'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress overview */}
      <div className="p-4 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-900/10 rounded-xl border border-brand-300 dark:border-brand-900/50">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-brand-900 dark:text-brand-300">
            {t('profile.completionGuide.title')}
          </span>
          <span className="text-2xl font-bold text-brand-900 dark:text-brand-400">
            {completionPercent}%
          </span>
        </div>

        <div className="h-2 bg-brand-100 dark:bg-brand-900/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-900 dark:bg-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <p className="text-xs text-brand-900 dark:text-brand-400 mt-2">
          {t('profile.completionGuide.stepsComplete', { completed: completedCount, total: totalCount })}
        </p>
      </div>

      {/* High priority alert */}
      {highPriorityIncomplete.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('profile.completionGuide.importantStepsLeft', { count: highPriorityIncomplete.length })}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('profile.completionGuide.completeToImproveChances')}
            </p>
          </div>
        </div>
      )}

      {/* Completion items */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors',
              item.completed
                ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 opacity-60'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              item.completed
                ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                : getPriorityColor(item.priority)
            )}>
              {item.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                item.icon
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                item.completed
                  ? 'text-stone-400 dark:text-stone-500 line-through'
                  : 'text-stone-800 dark:text-stone-200'
              )}>
                {item.label}
              </p>
              {!item.completed && (
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {item.description}
                </p>
              )}
            </div>

            {!item.completed && item.link && (
              <Link
                to={item.link}
                className="p-2 text-brand-900 hover:bg-brand-50 dark:hover:bg-brand-900/40 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {!item.completed && !item.link && (
              <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600" />
            )}
          </div>
        ))}
      </div>

      {completionPercent === 100 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t('profile.completionGuide.profileComplete')}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {t('profile.completionGuide.allInfoFilled')}
          </p>
        </div>
      )}
    </div>
  )
}
