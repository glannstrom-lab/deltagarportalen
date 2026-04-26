/**
 * Smart Job Matches - Fas 3
 * 
 * Visar semantiskt matchade jobb och "utforska liknande roller"
 */

import { useState, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, TrendingUp, Lightbulb, ChevronRight,
  Target, Briefcase, Loader2, CheckCircle2, Zap
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { embeddingsApi, type SemanticMatch, type SimilarRole } from '@/services/ai/embeddings'
import type { CVData } from '@/services/supabaseApi'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

interface SmartJobMatchesProps {
  cv: CVData
  jobs: PlatsbankenJob[]
  className?: string
}

export function SmartJobMatches({ cv, jobs, className }: SmartJobMatchesProps) {
  const { t } = useTranslation()
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([])
  const [similarRoles, setSimilarRoles] = useState<SimilarRole[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'matches' | 'roles'>('matches')

  useEffect(() => {
    analyzeJobs()
  }, [cv, jobs])

  const analyzeJobs = async () => {
    setLoading(true)
    try {
      // Find semantic matches
      const matches = embeddingsApi.findSemanticMatches(cv, jobs, 0.25)
      setSemanticMatches(matches.slice(0, 5))

      // Find similar roles
      const roles = embeddingsApi.exploreSimilarRoles(cv)
      setSimilarRoles(roles.slice(0, 4))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-6",
        className
      )}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-700" />
        </div>
      </div>
    )
  }

  const hasMatches = semanticMatches.length > 0
  const hasSimilarRoles = similarRoles.length > 0

  if (!hasMatches && !hasSimilarRoles) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-brand-50 to-sky-50 dark:from-brand-900/30 dark:to-sky-900/30 rounded-xl border border-brand-200 dark:border-brand-900 p-6",
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/50 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-brand-900 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-stone-100">{t('ai.smartMatches.title')}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          {t('ai.smartMatches.fillCVDescription')}
        </p>
        <Link
          to="/cv"
          className="inline-flex items-center gap-2 mt-3 text-sm text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-medium"
        >
          {t('ai.smartMatches.completeCV')}
          <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-700 to-sky-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('ai.smartMatches.title')}</h3>
            <p className="text-sm text-white/80">
              {hasMatches
                ? t('ai.smartMatches.jobsMatchCount', { count: semanticMatches.length })
                : t('ai.smartMatches.exploreCareer')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {(hasMatches && hasSimilarRoles) && (
        <div className="flex border-b border-slate-200 dark:border-stone-700">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'matches'
                ? "text-brand-900 dark:text-brand-400 border-b-2 border-brand-900 dark:border-brand-400"
                : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100"
            )}
          >
            {t('ai.smartMatches.tabs.matchedJobs')}
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'roles'
                ? "text-brand-900 dark:text-brand-400 border-b-2 border-brand-900 dark:border-brand-400"
                : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100"
            )}
          >
            {t('ai.smartMatches.tabs.similarRoles')}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === 'matches' && hasMatches && (
          <div className="space-y-3">
            {semanticMatches.map((match) => (
              <JobMatchCard key={match.jobId} match={match} unknownEmployerLabel={t('common.employerNotSpecified')} />
            ))}

            <Link
              to="/job-search"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
            >
              {t('ai.smartMatches.seeAllJobs')}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {activeTab === 'roles' && hasSimilarRoles && (
          <div className="space-y-3">
            {similarRoles.map((role) => (
              <SimilarRoleCard key={role.role} role={role} overlapLabel={t('ai.smartMatches.overlap')} toLearnLabel={t('ai.smartMatches.toLearn')} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// JOB MATCH CARD (memoized for performance)
// ============================================

const JobMatchCard = memo(function JobMatchCard({ match, unknownEmployerLabel }: { match: SemanticMatch; unknownEmployerLabel: string }) {
  const { job, similarity, matchedKeywords, explanation } = match

  // Safety check - if job is undefined or missing headline, don't render
  if (!job || !job.headline) {
    return null
  }

  const matchPercentage = Math.round(similarity * 100)

  const getMatchColor = (score: number) => {
    if (score >= 70) return 'text-brand-900 bg-brand-50 border-brand-200'
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-slate-600 bg-slate-50 border-slate-200'
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 line-clamp-1">
            {job.headline}
          </h4>
          <p className="text-sm text-slate-700">
            {job.employer?.name || unknownEmployerLabel}
          </p>
          
          {/* Match score */}
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium border",
              getMatchColor(matchPercentage)
            )}>
              {matchPercentage}% match
            </span>
            
            {matchedKeywords.length > 0 && (
              <span className="text-xs text-slate-700">
                {matchedKeywords.slice(0, 2).join(', ')}
                {matchedKeywords.length > 2 && ` +${matchedKeywords.length - 2}`}
              </span>
            )}
          </div>
          
          {/* Explanation */}
          <p className="text-xs text-slate-600 mt-2">
            {explanation}
          </p>
        </div>
        
        <Link
          to={`/job-search?highlight=${job.id}`}
          className="flex-shrink-0 p-2 text-brand-900 hover:bg-brand-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  )
})

// ============================================
// SIMILAR ROLE CARD (memoized for performance)
// ============================================

const SimilarRoleCard = memo(function SimilarRoleCard({ role, overlapLabel, toLearnLabel }: { role: SimilarRole; overlapLabel: string; toLearnLabel: string }) {
  const matchPercentage = Math.round(role.similarity * 100)

  return (
    <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900">{role.role}</h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              matchPercentage >= 60
                ? "bg-brand-100 text-brand-900" :
              matchPercentage >= 40
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            )}>
              {matchPercentage}% {overlapLabel}
            </span>
          </div>
          
          <p className="text-sm text-slate-600 mt-1">
            {role.reason}
          </p>
          
          {/* Transferable skills */}
          {role.transferableSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {role.transferableSkills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 bg-brand-100 text-brand-900 rounded text-xs"
                >
                  <CheckCircle2 size={10} className="inline mr-1" />
                  {skill}
                </span>
              ))}
            </div>
          )}
          
          {/* Missing skills */}
          {role.requiredSkills.length > role.transferableSkills.length && (
            <div className="mt-2">
              <p className="text-xs text-slate-700 mb-1">{toLearnLabel}:</p>
              <div className="flex flex-wrap gap-1">
                {role.requiredSkills
                  .filter(s => !role.transferableSkills.includes(s))
                  .slice(0, 3)
                  .map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <Link
          to={`/job-search?query=${encodeURIComponent(role.role)}`}
          className="flex-shrink-0 p-2 text-brand-900 hover:bg-brand-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  )
})

// ============================================
// SKILL GAP ANALYSIS COMPONENT
// ============================================

interface SkillGapAnalysisProps {
  cv: CVData
  jobs: PlatsbankenJob[]
  className?: string
}

export function SkillGapAnalysis({ cv, jobs, className }: SkillGapAnalysisProps) {
  const [gaps, setGaps] = useState<ReturnType<typeof embeddingsApi.analyzeSkillGaps>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyzeGaps()
  }, [cv, jobs])

  const analyzeGaps = () => {
    setLoading(true)
    try {
      const analyzedGaps = embeddingsApi.analyzeSkillGaps(cv, jobs)
      setGaps(analyzedGaps)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "bg-white rounded-xl border border-slate-200 p-6",
        className
      )}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-700" />
        </div>
      </div>
    )
  }

  if (gaps.length === 0) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200 p-6",
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} className="text-brand-900" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Bra kompetensprofil!</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Dina nuvarande kompetenser matchar väl mot tillgängliga jobb. 
          Fortsätt söka jobb med dina nuvarande skills!
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Utöka dina möjligheter</h3>
            <p className="text-sm text-white/80">
              Med dessa kompetenser skulle du matcha fler jobb
            </p>
          </div>
        </div>
      </div>

      {/* Skill Gaps */}
      <div className="p-4 space-y-3">
        {gaps.map((gap) => (
          <div 
            key={gap.skill}
            className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900 capitalize">
                    {gap.skill}
                  </h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    gap.importance === 'critical'
                      ? "bg-rose-100 text-rose-700" :
                    gap.importance === 'recommended'
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {gap.importance === 'critical' ? 'Högprioriterat' :
                     gap.importance === 'recommended' ? 'Rekommenderat' : 'Valfritt'}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mt-1">
                  {gap.reason}
                </p>
                
                {(gap.learningTime || gap.newJobsIfLearned) && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {gap.learningTime && (
                      <span className="flex items-center gap-1 text-slate-700">
                        <Zap size={12} />
                        Lär dig på: {gap.learningTime}
                      </span>
                    )}
                    {gap.newJobsIfLearned && (
                      <span className="flex items-center gap-1 text-brand-900 font-medium">
                        <Target size={12} />
                        +{gap.newJobsIfLearned} nya jobb
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <button className="flex-shrink-0 p-2 text-brand-900 hover:bg-brand-100 rounded-lg transition-colors">
                <Lightbulb size={18} />
              </button>
            </div>
          </div>
        ))}
        
        <div className="bg-amber-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-amber-800">
            <strong>Tips:</strong> Börja med en "critical" kompetens. 
            Mikro-utbildningar på 15 min/dag ger resultat över tid!
          </p>
        </div>
      </div>
    </div>
  )
}
