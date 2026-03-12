/**
 * CreateApplicationModal - "Skapa Ansökan"-flöde
 * 
 * En modal som guidar användaren genom ansökningsprocessen:
 * 1. Förbered CV (visa matchningspoäng)
 * 2. Skriv personligt brev
 * 3. Lägg till i jobbtracker
 */

import { useState, useEffect } from 'react'
import { 
  X, FileText, Briefcase, CheckCircle2, 
  ChevronRight, Sparkles, Save, Loader2,
  ArrowRight, Building2, MapPin, ExternalLink
} from 'lucide-react'
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
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [cvMatchScore, setCvMatchScore] = useState<number | null>(null)
  const [cvAnalysis, setCvAnalysis] = useState<CVOptimizationResult | null>(null)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  
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
    try {
      const jobData: JobData = {
        jobId: job.id,
        headline: job.headline,
        employer: job.employer?.name || 'Arbetsgivare ej angiven',
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
        setCvMatchScore(analysis.matchScore)
        setWorkflow(prev => ({
          ...prev,
          step1_cv: { ...prev.step1_cv, matchScore: analysis.matchScore }
        }))
      } else {
        // Fallback till enkel matchning
        const score = await workflowApi.getCVMatchScore(jobData)
        setCvMatchScore(score)
        setWorkflow(prev => ({
          ...prev,
          step1_cv: { ...prev.step1_cv, matchScore: score }
        }))
      }
    } catch (error) {
      console.error('Fel vid CV-matchning:', error)
      setCvMatchScore(50)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const jobData: JobData = {
        jobId: job.id,
        headline: job.headline,
        employer: job.employer?.name || 'Arbetsgivare ej angiven',
        description: job.description?.text || '',
        url: job.application_details?.url || '',
        location: job.workplace_address?.municipality || job.workplace_address?.city,
        employmentType: job.employment_type?.label
      }

      await workflowApi.createApplication({ jobData, workflow })
      
      showToast.success(
        'Ansökan sparad!',
        workflow.step3_tracker.status === 'APPLIED' 
          ? 'Din ansökan har registrerats i jobbtrackern'
          : 'Jobbet har sparats för senare'
      )
      
      onSuccess?.()
      onClose()
    } catch (error) {
      showToast.error(
        'Något gick fel',
        'Kunde inte spara ansökan. Försök igen.'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Skapa ansökan
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
              {job.headline}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Job Info Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-slate-900 line-clamp-1">{job.headline}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {job.employer?.name || 'Arbetsgivare ej angiven'}
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
            title="Förbered CV"
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
                      <p className="font-medium text-slate-900">Din matchning</p>
                      <p className="text-sm text-slate-500">
                        {cvMatchScore >= 70 ? 'Utmärkt match!' :
                         cvMatchScore >= 40 ? 'God match - kan förbättras' :
                         'Lägg till mer relevant erfarenhet'}
                      </p>
                      {cvAnalysis && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cvAnalysis.matchedKeywords} av {cvAnalysis.totalKeywords} keywords matchade
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detaljerad analys (expandable) */}
                  {cvAnalysis && cvAnalysis.missingKeywords.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <button
                        onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                        className="flex items-center justify-between w-full text-sm font-medium text-slate-700"
                      >
                        <span>🔍 Saknade keywords från annonsen</span>
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
                                    : "bg-slate-200 text-slate-600"
                                )}
                              >
                                {keyword.word}
                              </span>
                            ))}
                            {cvAnalysis.missingKeywords.length > 8 && (
                              <span className="text-xs text-slate-500 px-1">
                                +{cvAnalysis.missingKeywords.length - 8} till
                              </span>
                            )}
                          </div>
                          
                          {/* Förbättringsförslag */}
                          {cvAnalysis.suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs font-medium text-slate-600 mb-2">💡 Förbättringstips:</p>
                              <ul className="space-y-1.5">
                                {cvAnalysis.suggestions.slice(0, 3).map((suggestion, idx) => (
                                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                                      suggestion.priority === 'high' ? "bg-rose-500" :
                                      suggestion.priority === 'medium' ? "bg-amber-500" : "bg-slate-400"
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
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Beräknar matchning...
                </div>
              )}
              
              <button
                onClick={goToCV}
                className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                <Sparkles size={16} />
                {cvAnalysis && cvAnalysis.matchScore < 60 
                  ? 'Förbättra CV för bättre matchning'
                  : 'Optimera CV för detta jobb'
                }
                <ArrowRight size={14} />
              </button>
            </div>
          </StepCard>

          {/* Step 2: Cover Letter */}
          <StepCard 
            number={2}
            title="Skriv personligt brev"
            isActive={currentStep === 2}
            isCompleted={workflow.step2_letter.generateAI}
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Ett personligt brev ökar dina chanser att bli kallad till intervju.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateCoverLetter}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors"
                >
                  <Sparkles size={18} />
                  Skriv med AI-hjälp
                </button>
                <button
                  onClick={() => navigate(`/cover-letter?jobId=${job.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  <FileText size={18} />
                  Skriv själv
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 size={14} />
                Jobbinfo förifylld automatiskt
              </div>
            </div>
          </StepCard>

          {/* Step 3: Tracker */}
          <StepCard 
            number={3}
            title="Lägg till i jobbtracker"
            isActive={currentStep === 3}
            isCompleted={false}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={workflow.step3_tracker.status}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    step3_tracker: { ...prev.step3_tracker, status: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="SAVED">💾 Sparat (skickar senare)</option>
                  <option value="APPLIED">📨 Ansökt (idag)</option>
                  <option value="INTERVIEW">📅 Intervju inbokad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Anteckningar (valfritt)
                </label>
                <textarea
                  value={workflow.step3_tracker.notes}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    step3_tracker: { ...prev.step3_tracker, notes: e.target.value }
                  }))}
                  placeholder="t.ex. Skickade via mejl, väntar på svar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>
          </StepCard>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Avbryt
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
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-violet-600 hover:text-violet-700 font-medium"
              >
                <ExternalLink size={16} />
                Ansök direkt
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {workflow.step3_tracker.status === 'APPLIED' 
                    ? 'Spara & Skicka ansökan'
                    : 'Spara jobb'
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
        ? "border-violet-300 bg-violet-50/50" 
        : "border-slate-200 bg-white"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
          isCompleted 
            ? "bg-green-500 text-white" 
            : isActive
              ? "bg-violet-500 text-white"
              : "bg-slate-200 text-slate-600"
        )}>
          {isCompleted ? (
            <CheckCircle2 size={16} />
          ) : (
            number
          )}
        </div>
        <h4 className={cn(
          "font-medium",
          isActive ? "text-slate-900" : "text-slate-600"
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
