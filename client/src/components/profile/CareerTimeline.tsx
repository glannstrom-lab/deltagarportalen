/**
 * CareerTimeline - Visualisering av karriärhistorik
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase, GraduationCap, Award, Calendar, MapPin,
  ChevronRight, Loader2, Plus
} from '@/components/ui/icons'
import { cvApi } from '@/services/supabaseApi'
import { cn } from '@/lib/utils'

interface TimelineItem {
  id: string
  type: 'work' | 'education' | 'certificate'
  title: string
  subtitle: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

interface Props {
  className?: string
}

export function CareerTimeline({ className }: Props) {
  const { t } = useTranslation()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [])

  const loadTimeline = async () => {
    try {
      const cv = await cvApi.getCV()
      if (!cv) {
        setItems([])
        return
      }

      const timelineItems: TimelineItem[] = []

      // Add work experience
      if (cv.workExperience) {
        cv.workExperience.forEach(job => {
          timelineItems.push({
            id: job.id || `work-${job.company}-${job.startDate}`,
            type: 'work',
            title: job.title,
            subtitle: job.company,
            location: job.location,
            startDate: job.startDate,
            endDate: job.endDate,
            current: job.current,
            description: job.description
          })
        })
      }

      // Add education
      if (cv.education) {
        cv.education.forEach(edu => {
          timelineItems.push({
            id: edu.id || `edu-${edu.school}-${edu.startDate}`,
            type: 'education',
            title: edu.degree,
            subtitle: edu.school,
            location: edu.location,
            startDate: edu.startDate,
            endDate: edu.endDate,
            description: edu.description
          })
        })
      }

      // Add certificates
      if (cv.certificates) {
        cv.certificates.forEach(cert => {
          if (cert.date) {
            timelineItems.push({
              id: cert.id || `cert-${cert.name}`,
              type: 'certificate',
              title: cert.name,
              subtitle: cert.issuer || '',
              startDate: cert.date,
              endDate: cert.expiryDate
            })
          }
        })
      }

      // Sort by start date (most recent first)
      timelineItems.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime()
        const dateB = new Date(b.startDate).getTime()
        return dateB - dateA
      })

      setItems(timelineItems)
    } catch (err) {
      console.error('Error loading timeline:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' })
  }

  const formatDateRange = (item: TimelineItem) => {
    const start = formatDate(item.startDate)
    if (item.current) return `${start} - Nu`
    if (item.endDate) return `${start} - ${formatDate(item.endDate)}`
    return start
  }

  const getTypeIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'work': return Briefcase
      case 'education': return GraduationCap
      case 'certificate': return Award
    }
  }

  const getTypeColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'work': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'education': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      case 'certificate': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    }
  }

  const getLineColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'work': return 'bg-blue-200 dark:bg-blue-800'
      case 'education': return 'bg-purple-200 dark:bg-purple-800'
      case 'certificate': return 'bg-amber-200 dark:bg-amber-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400 dark:bg-blue-500" />
          <span className="text-stone-600 dark:text-stone-400">Arbete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-400 dark:bg-purple-500" />
          <span className="text-stone-600 dark:text-stone-400">Utbildning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500" />
          <span className="text-stone-600 dark:text-stone-400">Certifikat</span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="relative">
          {/* Timeline */}
          {items.map((item, index) => {
            const Icon = getTypeIcon(item.type)
            const isLast = index === items.length - 1

            return (
              <div key={item.id} className="relative pl-8 pb-6">
                {/* Vertical line */}
                {!isLast && (
                  <div className={cn(
                    'absolute left-3 top-8 bottom-0 w-0.5',
                    getLineColor(item.type)
                  )} />
                )}

                {/* Icon dot */}
                <div className={cn(
                  'absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  getTypeColor(item.type)
                )}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-stone-800 dark:text-stone-200">
                        {item.title}
                      </h4>
                      <p className="text-sm text-teal-600 dark:text-teal-400">
                        {item.subtitle}
                      </p>
                    </div>
                    {item.current && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                        {t('profile.careerTimeline.current')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateRange(item)}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            {t('profile.careerTimeline.emptyState')}
          </p>
          <Link
            to="/cv-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('profile.careerTimeline.goToCVBuilder')}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <Link
          to="/cv-builder"
          className="flex items-center justify-center gap-2 p-3 text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors"
        >
          {t('profile.careerTimeline.editInCVBuilder')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
