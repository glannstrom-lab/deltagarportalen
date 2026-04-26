/**
 * Getting Started Tab
 * Shows real progress based on user's actual data in Supabase
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Rocket, CheckCircle2, ArrowRight, Sparkles, FileText, Compass, Briefcase, PenTool } from '@/components/ui/icons'
import { Card, LoadingState } from '@/components/ui'
import { cvApi, interestApi, coverLetterApi, savedJobsApi } from '@/services/api'

interface ProgressStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  checkFn: () => Promise<boolean>
  action: string
  actionLink: string
  category: 'profile' | 'career' | 'job-search'
}

export default function GettingStartedTab() {
  const { t } = useTranslation()

  // Fetch real data from Supabase
  const { data: cvData, isLoading: cvLoading } = useQuery({
    queryKey: ['cv-status'],
    queryFn: async () => {
      try {
        const cv = await cvApi.getCV()
        // Check if CV has meaningful content
        const hasContent = cv && (
          (cv.work_experience && cv.work_experience.length > 0) ||
          (cv.education && cv.education.length > 0) ||
          (cv.skills && cv.skills.length > 0)
        )
        return { hasCV: hasContent }
      } catch {
        return { hasCV: false }
      }
    },
    staleTime: 30000,
  })

  const { data: interestData, isLoading: interestLoading } = useQuery({
    queryKey: ['interest-status'],
    queryFn: async () => {
      try {
        const result = await interestApi.getResult()
        return { hasInterestResult: !!result }
      } catch {
        return { hasInterestResult: false }
      }
    },
    staleTime: 30000,
  })

  const { data: coverLetterData, isLoading: coverLetterLoading } = useQuery({
    queryKey: ['cover-letter-status'],
    queryFn: async () => {
      try {
        const letters = await coverLetterApi.getAll()
        return { hasCoverLetter: letters && letters.length > 0 }
      } catch {
        return { hasCoverLetter: false }
      }
    },
    staleTime: 30000,
  })

  const { data: savedJobsData, isLoading: savedJobsLoading } = useQuery({
    queryKey: ['saved-jobs-status'],
    queryFn: async () => {
      try {
        const jobs = await savedJobsApi.getAll()
        return { hasSavedJobs: jobs && jobs.length > 0 }
      } catch {
        return { hasSavedJobs: false }
      }
    },
    staleTime: 30000,
  })

  const isLoading = cvLoading || interestLoading || coverLetterLoading || savedJobsLoading

  // Define steps with real completion status
  const steps = [
    {
      id: 'cv',
      title: t('knowledgeBase.gettingStarted.steps.cv.title'),
      description: t('knowledgeBase.gettingStarted.steps.cv.description'),
      icon: FileText,
      isCompleted: cvData?.hasCV || false,
      action: t('knowledgeBase.gettingStarted.steps.cv.action'),
      actionLink: '/cv',
    },
    {
      id: 'interest',
      title: t('knowledgeBase.gettingStarted.steps.interest.title'),
      description: t('knowledgeBase.gettingStarted.steps.interest.description'),
      icon: Compass,
      isCompleted: interestData?.hasInterestResult || false,
      action: t('knowledgeBase.gettingStarted.steps.interest.action'),
      actionLink: '/interest-guide',
    },
    {
      id: 'jobs',
      title: t('knowledgeBase.gettingStarted.steps.jobs.title'),
      description: t('knowledgeBase.gettingStarted.steps.jobs.description'),
      icon: Briefcase,
      isCompleted: savedJobsData?.hasSavedJobs || false,
      action: t('knowledgeBase.gettingStarted.steps.jobs.action'),
      actionLink: '/jobs',
    },
    {
      id: 'cover-letter',
      title: t('knowledgeBase.gettingStarted.steps.coverLetter.title'),
      description: t('knowledgeBase.gettingStarted.steps.coverLetter.description'),
      icon: PenTool,
      isCompleted: coverLetterData?.hasCoverLetter || false,
      action: t('knowledgeBase.gettingStarted.steps.coverLetter.action'),
      actionLink: '/cover-letter',
    },
  ]

  const completedCount = steps.filter(step => step.isCompleted).length
  const progress = Math.round((completedCount / steps.length) * 100)

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState title={t('knowledgeBase.gettingStarted.loading')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {t('knowledgeBase.gettingStarted.title')}
            </h2>
            <p className="text-slate-600 mt-1">
              {t('knowledgeBase.gettingStarted.description', { completed: completedCount, total: steps.length })}
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-600 mt-2 font-medium">
                {progress}% {t('knowledgeBase.gettingStarted.complete')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isNext = !step.isCompleted &&
            (index === 0 || steps[index - 1].isCompleted)

          return (
            <Card
              key={step.id}
              className={`
                transition-all
                ${step.isCompleted ? 'opacity-60' : ''}
                ${isNext ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="shrink-0 mt-1">
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isNext
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300'}
                    `}>
                      <Icon className={`w-3 h-3 ${isNext ? 'text-blue-600' : 'text-slate-600'}`} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`
                        font-semibold text-lg
                        ${step.isCompleted ? 'text-slate-700 line-through' : 'text-slate-900'}
                      `}>
                        {step.title}
                      </h3>
                      <p className="text-slate-600 mt-1">
                        {step.description}
                      </p>
                      {step.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-sm mt-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('knowledgeBase.gettingStarted.completed')}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    {!step.isCompleted && (
                      <Link
                        to={step.actionLink}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        {step.action}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Completion celebration */}
      {completedCount === steps.length && (
        <Card className="bg-gradient-to-r from-emerald-50 to-brand-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {t('knowledgeBase.gettingStarted.allComplete')} 🎉
              </h3>
              <p className="text-slate-600">
                {t('knowledgeBase.gettingStarted.allCompleteDescription')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
