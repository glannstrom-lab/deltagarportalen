/**
 * Continue Where You Left Component
 * Visar påbörjade aktiviteter och låter användaren fortsätta där de slutade
 * "Fortsätt där du slutade"-funktionalitet
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  FileText,
  Sparkles,
  BookHeart,
  Briefcase,
  ChevronRight,
  Clock,
  X,
  Play
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { interestGuideApi } from '@/services/cloudStorage'

interface InProgressActivity {
  id: string
  type: 'cv' | 'interest' | 'diary' | 'job-search' | 'cover-letter'
  title: string
  description: string
  progress: number
  lastActive: Date
  path: string
  icon: typeof FileText
}

interface CVData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  workExperience?: Array<{
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
  }>
  education?: Array<{
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
  skills?: Array<string | { name: string }>
  summary?: string
  updatedAt?: string
}

export function ContinueWhereYouLeft() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<InProgressActivity[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // Beräkna CV-progress
  const calculateCVProgress = (cv: CVData): number => {
    let total = 0
    let filled = 0

    // Personuppgifter (grundinfo)
    const basicFields = ['firstName', 'lastName', 'email'] as const
    total += basicFields.length
    filled += basicFields.filter(f => cv[f]).length

    // Arbetslivserfarenhet
    total += 1
    if (cv.workExperience?.length > 0) filled += 1

    // Utbildning
    total += 1
    if (cv.education?.length > 0) filled += 1

    // Kompetenser
    total += 1
    if (cv.skills?.length > 0) filled += 1

    // Sammanfattning
    total += 1
    if (cv.summary) filled += 1

    return Math.round((filled / total) * 100)
  }

  // Formatera tid sedan aktivitet
  const formatTimeSince = (date: Date): string => {
    const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'För mindre än en timme sedan'
    if (hours === 1) return 'För en timme sedan'
    if (hours < 24) return `För ${hours} timmar sedan`
    const days = Math.round(hours / 24)
    if (days === 1) return 'Igår'
    return `För ${days} dagar sedan`
  }

  useEffect(() => {
    const loadActivities = async () => {
      // Hämta alla påbörjade aktiviteter
      const inProgress: InProgressActivity[] = []

      // CV-progress
      const cvData = localStorage.getItem('cv-data')
      if (cvData) {
        try {
          const cv = JSON.parse(cvData)
          const cvProgress = calculateCVProgress(cv)
          if (cvProgress > 0 && cvProgress < 100) {
            inProgress.push({
              id: 'cv',
              type: 'cv',
              title: 'Fortsätt med ditt CV',
              description: `Du har fyllt i ${cvProgress}% av ditt CV`,
              progress: cvProgress,
              lastActive: new Date(cv.updatedAt || Date.now()),
              path: '/cv',
              icon: FileText
            })
          }
        } catch (cvParseError) {
          // Ignore CV parse errors
          console.debug('Could not parse CV data:', cvParseError)
        }
      }

      // Intresseguide-progress (from Supabase)
      try {
        const interestData = await interestGuideApi.getProgress()
        if (interestData && interestData.answers && !interestData.is_completed) {
          const answeredCount = Object.keys(interestData.answers).length
          if (answeredCount > 0) {
            const totalQuestions = 24 // Antal frågor i intresseguiden
            const progress = Math.round((answeredCount / totalQuestions) * 100)
            const lastActive = interestData.updated_at
              ? new Date(interestData.updated_at)
              : new Date()

            inProgress.push({
              id: 'interest',
              type: 'interest',
              title: 'Fortsätt intresseguiden',
              description: `Du har svarat på ${answeredCount} av ${totalQuestions} frågor`,
              progress,
              lastActive,
              path: '/interest-guide',
              icon: Sparkles
            })
          }
        }
      } catch (err) {
        console.error('Failed to load interest guide progress:', err)
      }

      // Dagbok - påbörjad entry
      const diaryDraft = localStorage.getItem('diary-draft')
      if (diaryDraft) {
        try {
          const draft = JSON.parse(diaryDraft)
          inProgress.push({
            id: 'diary',
            type: 'diary',
            title: 'Slutför dagboksinlägg',
            description: 'Du påbörjade ett inlägg men har inte sparat det',
            progress: 50,
            lastActive: new Date(draft.timestamp || Date.now()),
            path: '/diary',
            icon: BookHeart
          })
        } catch (diaryParseError) {
          // Ignore diary draft parse errors
          console.debug('Could not parse diary draft:', diaryParseError)
        }
      }

      // Sortera efter senast aktiv
      const sorted = inProgress.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      setActivities(sorted.slice(0, 3)) // Max 3 aktiviteter
    }

    loadActivities()
  }, [calculateCVProgress])

  // Beräkna CV-progress
  const calculateCVProgress = (cv: CVData): number => {
    let total = 0
    let filled = 0

    // Personuppgifter (grundinfo)
    const basicFields = ['firstName', 'lastName', 'email'] as const
    total += basicFields.length
    filled += basicFields.filter(f => cv[f]).length

    // Arbetslivserfarenhet
    total += 1
    if (cv.workExperience?.length > 0) filled += 1

    // Utbildning
    total += 1
    if (cv.education?.length > 0) filled += 1

    // Kompetenser
    total += 1
    if (cv.skills?.length > 0) filled += 1

    // Sammanfattning
    total += 1
    if (cv.summary) filled += 1

    return Math.round((filled / total) * 100)
  }

  // Formatera tid sedan aktivitet
  const formatTimeSince = (date: Date): string => {
    const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'För mindre än en timme sedan'
    if (hours === 1) return 'För en timme sedan'
    if (hours < 24) return `För ${hours} timmar sedan`
    const days = Math.round(hours / 24)
    if (days === 1) return 'Igår'
    return `För ${days} dagar sedan`
  }

  if (!isVisible || activities.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Fortsätt där du slutade</h3>
            <p className="text-sm text-slate-700">Du har påbörjat dessa aktiviteter</p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1.5 text-slate-600 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Dölj"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon
          
          return (
            <button
              key={activity.id}
              onClick={() => navigate(activity.path)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-500 transition-colors">
                <Icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-800">{activity.title}</h4>
                <p className="text-sm text-slate-700">{activity.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeSince(activity.lastActive)}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[100px]">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-indigo-600">{activity.progress}%</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Play className="w-5 h-5 text-indigo-600" />
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-600 text-center mt-4">
        💡 Vi sparar automatiskt ditt arbete så du inte förlorar något
      </p>
    </div>
  )
}

export default ContinueWhereYouLeft
