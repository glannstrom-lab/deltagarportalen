/**
 * CreateApplicationModal - "Skapa Ansökan"-flöde
 * 
 * En modal som guidar användaren genom ansökningsprocessen:
 * 1. Förbered CV (visa matchningspoäng)
 * 2. Skriv personligt brev
 * 3. Lägg till i jobbtracker
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  X, FileText, Briefcase, CheckCircle2, 
  ChevronRight, Sparkles, Save, Loader2,
  ArrowRight, Building2, MapPin, ExternalLink
} from '@/components/ui/icons'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { workflowApi, type JobData, type ApplicationWorkflow } from '@/services/workflowApi'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { showToast } from '@/components/Toast'
import { analyzeCVForJob, type CVOptimizationResult } from '@/services/cvOptimizer'
import { supabase } from '@/lib/supabase'

interface CreateApplicationModalProps {
  job: PlatsbankenJob
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 1 | 2 | 3

export function CreateApplicationModal({ 
  job, 
  isOpen, 
  onClose,
  onSuccess 
}: CreateApplicationModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [currentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [cvMatchScore, setCvMatchScore] = useState<number | null>(null)
  /** UX14: matchningen gick inte att beräkna — säg det, gissa inte. */
  const [matchFailed, setMatchFailed] = useState(false)
  const [cvAnalysis, setCvAnalysis] = useState<CVOptimizationResult | null>(null)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [workflow, setWorkflow] = useState<ApplicationWorkflow>({
    step1_cv: { optimize: false },
    step2_letter: { 
      generateAI: false, 
      tone: 'professional',
      content: '' 
    },
    step3_tracker: { 
      status: 'APPLIED', 
      notes: '' 
    }
  })

  // Hämta CV-matchning när modal öppnas
  useEffect(() => {
    if (isOpen && job) {
      checkCVMatch()
    }
  }, [isOpen, job])

  const checkCVMatch = async () => {
    setMatchFailed(false)
    try {
      const jobData: JobData = {
        jobId: job.id,
        headline: job.headline,
        employer: job.employer?.name || t('common.employerNotSpecified'),
        description: job.description?.text || '',
        url: job.application_details?.url || '',
        location: job.workplace_address?.municipality || job.workplace_address?.city,
        employmentType: job.employment_type?.label
      }
      
      // Hämta CV-data för avancerad analys
      const { data: cv } = await supabase
        .from('cvs')
        .select('*')
        .maybeSingle()
      
      if (cv && job.description?.text) {
        // Använd avancerad analys
        const analysis = analyzeCVForJob(cv, `${job.headline} ${job.description.text}`)
        setCvAnalysis(analysis)
        if (analysis.matchScore === null) {
          // Annonsen gav inga sökbara nyckelord alls — då finns ingen siffra
          // att visa. Tidigare blev det NaN% (UX14).
          setMatchFailed(true)
        } else {
          setCvMatchScore(analysis.matchScore)
          setWorkflow(prev => ({
            ...prev,
            step1_cv: { ...prev.step1_cv, matchScore: analysis.matchScore as number }
          }))
        }
      } else {
        // Fallback till enkel matchning. null = gick inte att räkna ut (UX14).
        const score = await workflowApi.getCVMatchScore(jobData)
        if (score === null) {
          setMatchFailed(true)
        } else {
          setCvMatchScore(score)
          setWorkflow(prev => ({
            ...prev,
            step1_cv: { ...prev.step1_cv, matchScore: score }
          }))
        }
      }
    } catch (error) {
      // UX14: hit hamnade ALLA analyser (extractKeywords kastade på 'c++'),
      // och 50 % presenterades som "Din matchning — God match, kan förbättras".
      // En påhittad siffra får folk att söka utan att förbättra sitt CV. Nu
      // säger vi att den inte gick att räkna ut.
      console.error('Fel vid CV-matchning:', error)
      setCvMatchScore(null)
      setMatchFailed(true)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const jobData: JobData = {
        jobId: job.id,
        headline: job.headline,
        employer: job.employer?.name || t('common.employerNotSpecified'),
        description: job.description?.text || '',
        url: job.application_details?.url || '',
        location: job.workplace_address?.municipality || job.workplace_address?.city,
        employmentType: job.employment_type?.label
      }

      await workflowApi.createApplication({ jobData, workflow })

      onSuccess?.()
      setSaved(true)
    } catch {
      showToast.error(
        t('common.error'),
        t('applications.create.saveErrorMessage')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoverLetter = () => {
    // Navigera till cover letter-sidan med förifylld data
    navigate(`/cover-letter?jobId=${job.id}&company=${encodeURIComponent(job.employer?.name || '')}&title=${encodeURIComponent(job.headline)}&desc=${encodeURIComponent(job.description?.text?.substring(0, 500) || '')}&autoGenerate=true`)
    onClose()
  }

  const goToCV = () => {
    navigate('/cv')
    onClose()
  }

  if (!isOpen) return null

  // Success-vy efter sparad ansökan
  if (saved) {
    const applied = workflow.step3_tracker.status === 'APPLIED'
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-8 text-center">
          <img
            src="/illustrations/success-ansokan.webp"
            alt=""
            aria-hidden="true"
            className="w-28 h-28 mx-auto mb-4 select-none"
          />
          <h2 className="text-xl font-semibold text-stone-900 mb-1">
            {applied ? t('applications.create.successApplied') : t('applications.create.successSaved')}
          </h2>
          <p className="text-sm text-stone-600 mb-6">
            {applied
              ? t('applications.create.successAppliedDesc')
              : t('applications.create.successSavedDesc')}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[var(--c-solid)] hover:bg-[var(--c-text)] text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              {t('applications.create.title')}
            </h2>
            <p className="text-sm text-stone-700 mt-0.5 line-clamp-1">
              {job.headline}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} className="text-stone-700" />
          </button>
        </div>

        {/* Job Info Card */}
        <div className="p-4 bg-stone-50 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--c-accent)]/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-[var(--c-text)]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-stone-900 line-clamp-1">{job.headline}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-stone-600">
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {job.employer?.name || t('common.employerNotSpecified')}
                </span>
                {job.workplace_address?.municipality && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.workplace_address.municipality}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-4">
          {/* Step 1: CV */}
          <StepCard 
            number={1}
            title={t('applications.create.step1Title')}
            isActive={currentStep === 1}
            isCompleted={workflow.step1_cv.optimize}
          >
            <div className="space-y-3">
              {cvMatchScore !== null ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold",
                      cvMatchScore >= 70 ? "bg-green-100 text-green-700" :
                      cvMatchScore >= 40 ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {cvMatchScore}%
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{t('applications.create.yourMatch')}</p>
                      <p className="text-sm text-stone-700">
                        {cvMatchScore >= 70 ? t('applications.create.matchExcellent') :
                         cvMatchScore >= 40 ? t('applications.create.matchGood') :
                         t('applications.create.matchLow')}
                      </p>
                      {cvAnalysis && (
                        <p className="text-xs text-stone-600 mt-0.5">
                          {t('applications.create.keywordsMatched', { matched: cvAnalysis.matchedKeywords, total: cvAnalysis.totalKeywords })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detaljerad analys (expandable) */}
                  {cvAnalysis && cvAnalysis.missingKeywords.length > 0 && (
                    <div className="bg-stone-50 rounded-lg p-3">
                      <button
                        onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                        className="flex items-center justify-between w-full text-sm font-medium text-stone-700"
                      >
                        <span>{t('applications.create.missingKeywords')}</span>
                        <ChevronRight size={16} className={cn("transition-transform", showDetailedAnalysis && "rotate-90")} />
                      </button>
                      
                      {showDetailedAnalysis && (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {cvAnalysis.missingKeywords.slice(0, 8).map((keyword, idx) => (
                              <span 
                                key={idx}
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  keyword.importance === 'high' 
                                    ? "bg-rose-100 text-rose-700" :
                                  keyword.importance === 'medium'
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-stone-200 text-stone-600"
                                )}
                              >
                                {keyword.word}
                              </span>
                            ))}
                            {cvAnalysis.missingKeywords.length > 8 && (
                              <span className="text-xs text-stone-700 px-1">
                                {t('applications.create.moreCount', { count: cvAnalysis.missingKeywords.length - 8 })}
                              </span>
                            )}
                          </div>
                          
                          {/* Förbättringsförslag */}
                          {cvAnalysis.suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-stone-200">
                              <p className="text-xs font-medium text-stone-600 mb-2">{t('applications.create.improvementTips')}</p>
                              <ul className="space-y-1.5">
                                {cvAnalysis.suggestions.slice(0, 3).map((suggestion, idx) => (
                                  <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5">
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                                      suggestion.priority === 'high' ? "bg-rose-500" :
                                      suggestion.priority === 'medium' ? "bg-amber-500" : "bg-stone-400"
                                    )} />
                                    {suggestion.message}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : matchFailed ? (
                /* UX14: ärligt besked i stället för en siffra vi inte har.
                   Steget är inte blockerat — man kan söka jobbet ändå. */
                <div className="text-sm text-stone-700">
                  <p className="font-medium text-stone-900">{t('applications.create.matchFailedTitle')}</p>
                  <p className="mt-0.5 text-stone-600">
                    {t('applications.create.matchFailedDesc')}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-stone-700">
                  <Loader2 size={18} className="animate-spin" />
                  {t('applications.create.calculatingMatch')}
                </div>
              )}
              
              <button
                onClick={goToCV}
                className="flex items-center gap-2 text-sm text-[var(--c-text)] hover:text-[var(--c-text)] font-medium"
              >
                <Sparkles size={16} />
                {cvAnalysis && cvAnalysis.matchScore !== null && cvAnalysis.matchScore < 60
                  ? t('applications.create.improveCvLink')
                  : t('workflow.common.optimizeCvForJob')
                }
                <ArrowRight size={14} />
              </button>
            </div>
          </StepCard>

          {/* Step 2: Cover Letter */}
          <StepCard 
            number={2}
            title={t('applications.create.step2Title')}
            isActive={currentStep === 2}
            isCompleted={workflow.step2_letter.generateAI}
          >
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                {t('applications.create.coverLetterHint')}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateCoverLetter}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--c-solid)] text-white rounded-lg font-medium hover:bg-[var(--c-solid)] transition-colors"
                >
                  <Sparkles size={18} />
                  {t('applications.create.writeWithAi')}
                </button>
                <button
                  onClick={() => navigate(`/cover-letter?jobId=${job.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors"
                >
                  <FileText size={18} />
                  {t('applications.create.writeYourself')}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 size={14} />
                {t('applications.create.jobInfoPrefilled')}
              </div>
            </div>
          </StepCard>

          {/* Step 3: Tracker */}
          <StepCard 
            number={3}
            title={t('applications.create.step3Title')}
            isActive={currentStep === 3}
            isCompleted={false}
          >
            <div className="space-y-3">
              <div>
                <label htmlFor="createapplicationmodal-f1" className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('applications.create.statusLabel')}
                </label>
                <select
                  id="createapplicationmodal-f1"
                  value={workflow.step3_tracker.status}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    step3_tracker: { ...prev.step3_tracker, status: e.target.value as 'SAVED' | 'APPLIED' | 'INTERVIEW' }
                  }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] text-sm"
                >
                  <option value="SAVED">{t('applications.create.statusSaved')}</option>
                  <option value="APPLIED">{t('applications.create.statusApplied')}</option>
                  <option value="INTERVIEW">{t('applications.create.statusInterview')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="createapplicationmodal-f2" className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t('applications.create.notesLabel')}
                </label>
                <textarea
                  id="createapplicationmodal-f2"
                  value={workflow.step3_tracker.notes}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    step3_tracker: { ...prev.step3_tracker, notes: e.target.value }
                  }))}
                  placeholder={t('applications.create.notesPlaceholder')}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>
          </StepCard>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-stone-100 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium"
          >
            {t('common.cancel')}
          </button>
          
          <div className="flex items-center gap-3">
            {job.application_details?.url && (
              <a
                href={job.application_details.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Spara automatiskt när användaren klickar på ansök-länk
                  handleSave()
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-[var(--c-text)] hover:text-[var(--c-text)] font-medium"
              >
                <ExternalLink size={16} />
                {t('applications.create.applyDirectly')}
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-lg font-medium hover:bg-[var(--c-solid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {workflow.step3_tracker.status === 'APPLIED' 
                    ? t('applications.create.saveAndSend')
                    : t('applications.create.saveJob')
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Card Component
interface StepCardProps {
  number: number
  title: string
  isActive: boolean
  isCompleted: boolean
  children: React.ReactNode
}

function StepCard({ number, title, isActive, isCompleted, children }: StepCardProps) {
  return (
    <div className={cn(
      "border rounded-xl p-4 transition-all",
      isActive
        ? "border-[var(--c-accent)] bg-[var(--c-bg)]/50"
        : "border-stone-200 bg-white"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
          isCompleted
            ? "bg-green-500 text-white"
            : isActive
              ? "bg-[var(--c-solid)] text-white"
              : "bg-stone-200 text-stone-600"
        )}>
          {isCompleted ? (
            <CheckCircle2 size={16} />
          ) : (
            number
          )}
        </div>
        <h4 className={cn(
          "font-medium",
          isActive ? "text-stone-900" : "text-stone-600"
        )}>
          {title}
        </h4>
      </div>
      
      <div className={cn(
        "pl-10",
        !isActive && "opacity-70"
      )}>
        {children}
      </div>
    </div>
  )
}
