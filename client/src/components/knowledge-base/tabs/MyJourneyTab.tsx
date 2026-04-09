/**
 * My Journey Tab
 * Shows real user statistics from Supabase
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, FileText, Compass, PenTool, ArrowRight, CheckCircle2 } from '@/components/ui/icons'
import { Card, LoadingState } from '@/components/ui'
import { cvApi, interestApi, coverLetterApi, savedJobsApi } from '@/services/api'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'

export default function MyJourneyTab() {
  const { t } = useTranslation()
  const { profile: riasecProfile } = useInterestProfile()

  // Fetch saved jobs count
  const { data: savedJobsData, isLoading: savedJobsLoading } = useQuery({
    queryKey: ['saved-jobs-count'],
    queryFn: async () => {
      try {
        const jobs = await savedJobsApi.getAll()
        return { count: jobs?.length || 0, jobs: jobs || [] }
      } catch {
        return { count: 0, jobs: [] }
      }
    },
    staleTime: 30000,
  })

  // Fetch CV data
  const { data: cvData, isLoading: cvLoading } = useQuery({
    queryKey: ['cv-data'],
    queryFn: async () => {
      try {
        const cv = await cvApi.getCV()
        if (!cv) return { hasCV: false, completeness: 0 }

        // Calculate CV completeness
        let score = 0
        if (cv.work_experience && cv.work_experience.length > 0) score += 25
        if (cv.education && cv.education.length > 0) score += 25
        if (cv.skills && cv.skills.length > 0) score += 25
        if (cv.summary) score += 25

        return { hasCV: true, completeness: score, cv }
      } catch {
        return { hasCV: false, completeness: 0 }
      }
    },
    staleTime: 30000,
  })

  // Fetch cover letters count
  const { data: coverLetterData, isLoading: coverLetterLoading } = useQuery({
    queryKey: ['cover-letters-count'],
    queryFn: async () => {
      try {
        const letters = await coverLetterApi.getAll()
        return { count: letters?.length || 0 }
      } catch {
        return { count: 0 }
      }
    },
    staleTime: 30000,
  })

  const isLoading = savedJobsLoading || cvLoading || coverLetterLoading

  // Get dominant RIASEC types for display
  const dominantTypes = riasecProfile.dominantTypes?.slice(0, 2) || []

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState title={t('knowledgeBase.myJourney.loading')} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Saved Jobs */}
        <Card className="bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{savedJobsData?.count || 0}</p>
              <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.savedJobs')}</p>
            </div>
          </div>
        </Card>

        {/* CV Status */}
        <Card className="bg-violet-50 border-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{cvData?.completeness || 0}%</p>
              <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.cvCompleteness')}</p>
            </div>
          </div>
        </Card>

        {/* Interest Profile */}
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              {riasecProfile.hasResult ? (
                <>
                  <p className="text-lg font-bold text-slate-900">
                    {dominantTypes.map(t => t.code.charAt(0).toUpperCase()).join('')}
                  </p>
                  <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.interestProfile')}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-400">—</p>
                  <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.noProfile')}</p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Cover Letters */}
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <PenTool className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{coverLetterData?.count || 0}</p>
              <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.coverLetters')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* RIASEC Profile Details */}
      {riasecProfile.hasResult && (
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t('knowledgeBase.myJourney.yourProfile')}
          </h3>
          <Card>
            <div className="space-y-4">
              {dominantTypes.map((type) => {
                const riasecType = RIASEC_TYPES[type.code]
                return (
                  <div key={type.code} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-amber-700 font-bold">
                        {type.code.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{riasecType?.nameSv}</h4>
                      <p className="text-sm text-slate-600">{riasecType?.description}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${type.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-1">{type.score}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <Link
                to="/interest-guide"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm mt-2"
              >
                {t('knowledgeBase.myJourney.viewFullProfile')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('knowledgeBase.myJourney.nextSteps')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!cvData?.hasCV && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-violet-600" />
                  <div>
                    <h4 className="font-medium text-slate-900">{t('knowledgeBase.myJourney.createCV')}</h4>
                    <p className="text-sm text-slate-500">{t('knowledgeBase.myJourney.createCVDescription')}</p>
                  </div>
                </div>
                <Link
                  to="/cv"
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  {t('knowledgeBase.myJourney.start')}
                </Link>
              </div>
            </Card>
          )}

          {!riasecProfile.hasResult && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-slate-900">{t('knowledgeBase.myJourney.takeInterestGuide')}</h4>
                    <p className="text-sm text-slate-500">{t('knowledgeBase.myJourney.takeInterestGuideDescription')}</p>
                  </div>
                </div>
                <Link
                  to="/interest-guide"
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                >
                  {t('knowledgeBase.myJourney.start')}
                </Link>
              </div>
            </Card>
          )}

          {savedJobsData?.count === 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-slate-900">{t('knowledgeBase.myJourney.searchJobs')}</h4>
                    <p className="text-sm text-slate-500">{t('knowledgeBase.myJourney.searchJobsDescription')}</p>
                  </div>
                </div>
                <Link
                  to="/job-search"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {t('knowledgeBase.myJourney.start')}
                </Link>
              </div>
            </Card>
          )}

          {/* All done state */}
          {cvData?.hasCV && riasecProfile.hasResult && savedJobsData && savedJobsData.count > 0 && (
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 md:col-span-2">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-slate-900">{t('knowledgeBase.myJourney.greatProgress')}</h4>
                  <p className="text-sm text-slate-600">{t('knowledgeBase.myJourney.greatProgressDescription')}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Saved Jobs Preview */}
      {savedJobsData && savedJobsData.count > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {t('knowledgeBase.myJourney.recentSavedJobs')}
            </h3>
            <Link
              to="/jobs?tab=saved"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('knowledgeBase.myJourney.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {savedJobsData.jobs.slice(0, 3).map((job: any) => (
              <Card key={job.id} className="hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {job.job_data?.headline || job.job_data?.title || t('knowledgeBase.myJourney.unknownJob')}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {job.job_data?.employer?.name || job.job_data?.company || ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === 'APPLIED' ? 'bg-blue-100 text-blue-700' :
                    job.status === 'INTERVIEW' ? 'bg-amber-100 text-amber-700' :
                    job.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {t(`knowledgeBase.myJourney.jobStatus.${job.status?.toLowerCase() || 'saved'}`)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
