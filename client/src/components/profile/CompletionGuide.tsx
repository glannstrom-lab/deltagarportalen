/**
 * CompletionGuide - Guide som visar saknade fält och förbättringsförslag
 */

import { Link } from 'react-router-dom'
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
  const items: CompletionItem[] = [
    {
      id: 'name',
      label: 'Namn',
      description: 'Lägg till ditt för- och efternamn',
      completed: Boolean(profile?.first_name && profile?.last_name),
      priority: 'high',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'photo',
      label: 'Profilbild',
      description: 'Ladda upp en professionell profilbild',
      completed: Boolean(profile?.profile_image_url),
      priority: 'medium',
      icon: <Image className="w-4 h-4" />
    },
    {
      id: 'contact',
      label: 'Kontaktuppgifter',
      description: 'Lägg till telefon och ort',
      completed: Boolean(profile?.phone && profile?.location),
      priority: 'high',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'cv-summary',
      label: 'CV-sammanfattning',
      description: 'Skriv en kort sammanfattning i ditt CV',
      completed: Boolean(cv?.summary),
      priority: 'high',
      link: '/cv-builder',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'experience',
      label: 'Arbetslivserfarenhet',
      description: 'Lägg till din arbetslivserfarenhet i CV',
      completed: Boolean(cv?.workExperience?.length),
      priority: 'high',
      link: '/cv-builder',
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      id: 'education',
      label: 'Utbildning',
      description: 'Lägg till din utbildning i CV',
      completed: Boolean(cv?.education?.length),
      priority: 'medium',
      link: '/cv-builder',
      icon: <GraduationCap className="w-4 h-4" />
    },
    {
      id: 'skills',
      label: 'Kompetenser',
      description: 'Lägg till minst 3 kompetenser',
      completed: skillsCount >= 3,
      priority: 'medium',
      icon: <Star className="w-4 h-4" />
    },
    {
      id: 'ai-summary',
      label: 'AI-sammanfattning',
      description: 'Generera en professionell sammanfattning',
      completed: hasSummary,
      priority: 'low',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'documents',
      label: 'Dokument',
      description: 'Ladda upp certifikat eller intyg',
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
      <div className="p-4 bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-xl border border-teal-200 dark:border-teal-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-teal-800 dark:text-teal-300">
            Profilkomplettering
          </span>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {completionPercent}%
          </span>
        </div>

        <div className="h-2 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
          {completedCount} av {totalCount} steg klara
        </p>
      </div>

      {/* High priority alert */}
      {highPriorityIncomplete.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {highPriorityIncomplete.length} viktiga steg kvar
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Slutför dessa för att öka dina chanser att hitta jobb.
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
                className="p-2 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-lg transition-colors"
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
            Din profil är komplett!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Du har fyllt i all viktig information.
          </p>
        </div>
      )}
    </div>
  )
}
