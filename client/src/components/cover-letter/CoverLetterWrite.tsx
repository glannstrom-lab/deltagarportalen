/**
 * Cover Letter Write Tab - Komplett AI-driven brevskrivning
 * 
 * Funktioner:
 * - Hämtar CV-data automatiskt från Supabase
 * - Hämtar sparade jobb för enkel val
 * - AI-genererade personliga brev med CV-kontext
 * - Förhandsgranskning och redigering
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  FileText, 
  Building2, 
  Briefcase, 
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  Save,
  Loader2,
  Edit3,
  Lightbulb,
  Target,
  Award,
  Heart,
  Search,
  User,
  MapPin,
  Calendar
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { coverLetterTemplates, getTemplateById } from '@/data/coverLetterTemplates'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { showToast } from '@/components/Toast'
import { callAI } from '@/services/aiApi'
import { coverLetterApi } from '@/services/supabaseApi'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { CVData } from '@/services/supabaseApi'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

// Sparat jobb interface - matchar databasens struktur med job_data JSON
interface SavedJob {
  id: string
  job_id: string
  user_id: string
  job_data: {
    headline?: string
    employer?: {
      name?: string
    }
    description?: {
      text?: string
    }
    workplace_address?: {
      municipality?: string
      region?: string
    }
    publication_date?: string
  }
  created_at: string
}

// AI API-anrop för personligt brev - uses authenticated client
async function generateCoverLetterWithAI(data: {
  cvData: CVData | null
  jobData: {
    company: string
    jobTitle: string
    jobAd: string
  }
  tone: 'professional' | 'enthusiastic' | 'formal'
  extraMotivation?: string
}) {
  return callAI('personligt-brev', {
    cvData: data.cvData,
    companyName: data.jobData.company,
    jobTitle: data.jobData.jobTitle,
    jobDescription: data.jobData.jobAd,
    tone: data.tone,
    extraContext: data.extraMotivation
  });
}

export function CoverLetterWrite() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const editId = searchParams.get('edit')
  const templateId = searchParams.get('template')
  const initialJobId = searchParams.get('jobId')

  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState<string>('')
  const [editedLetter, setEditedLetter] = useState<string>('')

  // Data states
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loadingCV, setLoadingCV] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)

  // Form data
  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    jobAd: '',
    motivation: '',
    selectedTemplate: templateId || 'standard',
    tone: 'professional' as 'professional' | 'enthusiastic' | 'formal',
    selectedJobId: initialJobId || '',
    useManualInput: false,
  })

  // M2: Auto-save draft
  const autoSaveData = {
    formData,
    editedLetter,
    currentStep
  }

  const { lastSaved, clearSavedData } = useAutoSave({
    key: 'cover-letter-write-draft',
    data: autoSaveData,
    onRestore: (saved) => {
      if (saved.formData) setFormData(saved.formData)
      if (saved.editedLetter) setEditedLetter(saved.editedLetter)
      if (saved.currentStep) setCurrentStep(saved.currentStep)
    }
  })

  // Hämta CV-data från Supabase
  useEffect(() => {
    const fetchCVData = async () => {
      if (!user) {
        setLoadingCV(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Fel vid hämtning av CV:', error)
        } else if (data) {
          setCvData(data)
        }
      } catch (err) {
        console.error('Exception vid CV-hämtning:', err)
      } finally {
        setLoadingCV(false)
      }
    }
    
    fetchCVData()
  }, [user])

  // Hämta sparade jobb från Supabase
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!user) {
        setLoadingJobs(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('saved_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Fel vid hämtning av sparade jobb:', error)
        } else if (data) {
          setSavedJobs(data)
        }
      } catch (err) {
        console.error('Exception vid sparade-jobb-hämtning:', err)
      } finally {
        setLoadingJobs(false)
      }
    }
    
    fetchSavedJobs()
  }, [user])

  // Ladda jobbdata från query params (när man kommer från jobbsidan)
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const company = searchParams.get('company')
    const title = searchParams.get('title')
    const desc = searchParams.get('desc')

    if (jobId || company || title) {
      setFormData(prev => ({
        ...prev,
        selectedJobId: jobId || '',
        company: company ? decodeURIComponent(company) : prev.company,
        jobTitle: title ? decodeURIComponent(title) : prev.jobTitle,
        jobAd: desc ? decodeURIComponent(desc) : prev.jobAd,
      }))
    }
  }, [searchParams])

  // Välj ett sparat jobb - extrahera data från job_data JSON
  const selectSavedJob = (job: SavedJob) => {
    const title = job.job_data?.headline || 'Okänd titel'
    const company = job.job_data?.employer?.name || 'Okänt företag'
    const description = job.job_data?.description?.text || ''
    
    setFormData(prev => ({
      ...prev,
      selectedJobId: job.job_id,
      company: company,
      jobTitle: title,
      jobAd: description,
      useManualInput: false,
    }))
    showToast.success(`Valde: ${title} på ${company}`)
  }

  // Byt till manuell inmatning
  const switchToManual = () => {
    setFormData(prev => ({
      ...prev,
      selectedJobId: '',
      company: '',
      jobTitle: '',
      jobAd: '',
      useManualInput: true,
    }))
  }

  const handleNext = () => {
    if (currentStep < 5) {
      if (currentStep === 3) {
        generateLetter()
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateLetter = async () => {
    setIsGenerating(true)
    try {
      const result = await generateCoverLetterWithAI({
        cvData,
        jobData: {
          company: formData.company,
          jobTitle: formData.jobTitle,
          jobAd: formData.jobAd,
        },
        tone: formData.tone,
        extraMotivation: formData.motivation,
      })
      
      setGeneratedLetter(result.brev || result.result || '')
      setEditedLetter(result.brev || result.result || '')
    } catch (error) {
      console.error('Fel vid generering:', error)
      showToast.error('Kunde inte generera brev. Försök igen.')
      // Fallback till mock
      const fallback = await mockGenerateLetter({
        ...formData,
        background: cvData?.summary || '',
        skills: cvData?.skills?.join(', ') || '',
      })
      setGeneratedLetter(fallback.content)
      setEditedLetter(fallback.content)
    } finally {
      setIsGenerating(false)
    }
  }

  // M1: Actually save the letter to database
  const handleSave = async () => {
    if (!editedLetter.trim()) {
      showToast.error(t('coverLetter.write.errors.emptyLetter', 'Brevet kan inte vara tomt'))
      return
    }

    setIsSaving(true)
    try {
      const title = `${formData.company} - ${formData.jobTitle}`.trim() || t('coverLetter.write.untitledLetter', 'Namnlöst brev')

      await coverLetterApi.create({
        title,
        content: editedLetter,
        company: formData.company || undefined,
        job_title: formData.jobTitle || undefined,
        job_ad: formData.jobAd || undefined,
        ai_generated: true
      })

      clearSavedData() // Clear auto-saved draft
      showToast.success(t('coverLetter.write.saved', 'Brev sparat!'))
      navigate('/cover-letter/my-letters')
    } catch (error) {
      console.error('Failed to save letter:', error)
      showToast.error(t('coverLetter.write.errors.saveFailed', 'Kunde inte spara brevet. Försök igen.'))
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company && formData.jobTitle
      case 2:
        return formData.selectedTemplate
      case 3:
        return true
      case 4:
        return editedLetter.length > 50
      default:
        return true
    }
  }

  const steps = [
    { id: 1, title: 'Välj jobb', icon: Building2 },
    { id: 2, title: 'Välj mall', icon: FileText },
    { id: 3, title: 'Anpassa', icon: Target },
    { id: 4, title: 'Granska', icon: Edit3 },
    { id: 5, title: 'Klart!', icon: Check },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <nav aria-label="Brevskrivningssteg" className="mb-6 sm:mb-8">
        {/* Mobile: Compact step indicator */}
        <div className="flex sm:hidden items-center justify-center gap-2 mb-3" role="list">
          {steps.map((step) => {
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            return (
              <div
                key={step.id}
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.title}${isCompleted ? ' (slutfört)' : isActive ? ' (aktuellt)' : ''}`}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  isActive && 'bg-brand-900 w-8',
                  isCompleted && 'bg-emerald-500',
                  !isActive && !isCompleted && 'bg-slate-200'
                )}
              />
            )
          })}
        </div>
        <div className="sm:hidden text-center" role="status" aria-live="polite">
          <span className="text-sm font-medium text-brand-900">
            Steg {currentStep} av {steps.length}: {steps[currentStep - 1].title}
          </span>
        </div>

        {/* Desktop: Full step indicator */}
        <ol className="hidden sm:flex items-center justify-between" role="list">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <li
                key={step.id}
                className="flex items-center"
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={cn(
                  'flex flex-col items-center',
                  index < steps.length - 1 && 'flex-1'
                )}>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isActive && 'bg-brand-900 text-white',
                      isCompleted && 'bg-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-slate-100 text-slate-600'
                    )}
                    aria-hidden="true"
                  >
                    {isCompleted ? (
                      <Check size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-2 font-medium',
                    isActive && 'text-brand-900',
                    isCompleted && 'text-emerald-600',
                    !isActive && !isCompleted && 'text-slate-600'
                  )}>
                    {step.title}
                    {isCompleted && <span className="sr-only"> (slutfört)</span>}
                    {isActive && <span className="sr-only"> (aktuellt steg)</span>}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-full h-0.5 mx-2',
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* CV Status Banner */}
      {cvData && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-emerald-800 text-sm sm:text-base">
                  CV-data hämtad
                </h4>
                <p className="text-xs sm:text-sm text-emerald-700 truncate">
                  {cvData.first_name} {cvData.last_name} • {cvData.skills?.length || 0} kompetenser
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-emerald-600 sm:shrink-0 ml-11 sm:ml-0">
              AI använder detta
            </div>
          </div>
        </div>
      )}

      {!cvData && !loadingCV && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">
                Inget CV hittades
              </h4>
              <p className="text-sm text-amber-700">
                Skapa ett CV först för bästa resultat. AI kommer generera ett generiskt brev annars.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/cv')}
              className="text-amber-700 border-amber-300"
            >
              Skapa CV
            </Button>
          </div>
        </div>
      )}

      {/* Step content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <Step1SelectJob
            savedJobs={savedJobs}
            loadingJobs={loadingJobs}
            formData={formData}
            setFormData={setFormData}
            onSelectJob={selectSavedJob}
            onManual={switchToManual}
          />
        )}
        {currentStep === 2 && (
          <Step2Template 
            formData={formData} 
            setFormData={setFormData} 
          />
        )}
        {currentStep === 3 && (
          <Step3Customize
            formData={formData}
            setFormData={setFormData}
            cvData={cvData}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            formData={formData}
            generatedLetter={generatedLetter}
            editedLetter={editedLetter}
            setEditedLetter={setEditedLetter}
            isGenerating={isGenerating}
          />
        )}
        {currentStep === 5 && (
          <Step5Done 
            editedLetter={editedLetter}
            onSave={handleSave}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-1 sm:gap-2 flex-1 sm:flex-none"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Tillbaka</span>
          <span className="sm:hidden">Bakåt</span>
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Skapar brev...</span>
                <span className="sm:hidden">Skapar...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Nästa steg</span>
                <span className="sm:hidden">Nästa</span>
                <ChevronRight size={18} />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1 sm:gap-2 flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">{isSaving ? t('common.saving', 'Sparar...') : t('coverLetter.write.saveButton', 'Spara brev')}</span>
            <span className="sm:hidden">{isSaving ? '...' : t('common.save', 'Spara')}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Steg 1: Välj jobb (sparade eller manuell)
interface FormData {
  company: string
  jobTitle: string
  jobAd: string
  motivation: string
  selectedTemplate: string
  tone: 'professional' | 'enthusiastic' | 'formal'
  selectedJobId: string
  useManualInput: boolean
}

function Step1SelectJob({
  savedJobs,
  loadingJobs,
  formData,
  setFormData,
  onSelectJob,
  onManual,
}: {
  savedJobs: SavedJob[]
  loadingJobs: boolean
  formData: FormData
  setFormData: (data: FormData) => void
  onSelectJob: (job: SavedJob) => void
  onManual: () => void
}) {
  const hasSelectedJob = formData.selectedJobId || (formData.company && formData.jobTitle)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Välj jobb för brevet
        </h2>
        <p className="text-slate-600">
          Välj ett av dina sparade jobb eller fyll i information manuellt.
        </p>
      </div>

      {/* Sparade jobb */}
      {savedJobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Dina sparade jobb ({savedJobs.length})
          </h3>
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {savedJobs.map((job) => {
              // Extrahera data från job_data JSON
              const title = job.job_data?.headline || 'Okänd titel'
              const company = job.job_data?.employer?.name || 'Okänt företag'
              const location = job.job_data?.workplace_address?.municipality || 
                              job.job_data?.workplace_address?.region
              
              return (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={formData.selectedJobId === job.job_id}
                  onClick={() => onSelectJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectJob(job)
                    }
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2',
                    formData.selectedJobId === job.job_id
                      ? 'border-brand-700 bg-brand-50'
                      : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      formData.selectedJobId === job.job_id
                        ? 'bg-brand-100 text-brand-900'
                        : 'bg-slate-100 text-slate-700'
                    )}>
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{title}</h4>
                      <p className="text-sm text-slate-700">{company}</p>
                      {location && (
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {location}
                        </p>
                      )}
                    </div>
                    {formData.selectedJobId === job.job_id && (
                      <div className="flex items-center gap-1 text-brand-900 text-sm">
                        <Check size={16} />
                        <span>Vald</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loadingJobs && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600" />
          <p className="text-sm text-slate-700 mt-2">Laddar sparade jobb...</p>
        </div>
      )}

      {!loadingJobs && savedJobs.length === 0 && (
        <div className="text-center py-6 bg-slate-50 rounded-xl">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Du har inga sparade jobb än.</p>
          <p className="text-sm text-slate-700 mt-1">
            Spara jobb från jobbsökningen för att enkelt skriva brev till dem.
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white text-sm text-slate-700">eller</span>
        </div>
      </div>

      {/* Manuell inmatning */}
      <button
        onClick={onManual}
        className={cn(
          'w-full p-4 rounded-xl border-2 transition-all text-left',
          formData.useManualInput
            ? 'border-brand-700 bg-brand-50'
            : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            formData.useManualInput
              ? 'bg-brand-100 text-brand-900'
              : 'bg-slate-100 text-slate-700'
          )}>
            <Edit3 size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-800">Fyll i manuellt</h4>
            <p className="text-sm text-slate-700">Skriv företag och jobbinformation själv</p>
          </div>
        </div>
      </button>

      {/* Manuell form */}
      {formData.useManualInput && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <label htmlFor="cl-company" className="block text-sm font-medium text-slate-700 mb-1.5">
              Företag *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" aria-hidden="true" />
              <input
                id="cl-company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="t.ex. Acme AB"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cl-jobtitle" className="block text-sm font-medium text-slate-700 mb-1.5">
              Jobbtitel *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" aria-hidden="true" />
              <input
                id="cl-jobtitle"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="t.ex. Projektledare"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cl-jobad" className="block text-sm font-medium text-slate-700 mb-1.5">
              Jobbannons (valfritt men rekommenderat)
            </label>
            <textarea
              id="cl-jobad"
              value={formData.jobAd}
              onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
              placeholder="Klistra in texten från jobbannonsen här..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all resize-none"
            />
          </div>
        </div>
      )}

      {/* Vald jobb info */}
      {hasSelectedJob && !formData.useManualInput && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-emerald-800">Valt jobb:</span>
          </div>
          <p className="text-emerald-700">
            {formData.jobTitle} på {formData.company}
          </p>
          {formData.jobAd && (
            <p className="text-sm text-emerald-600 mt-1">
              Jobbannons inkluderad ({formData.jobAd.length} tecken)
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Steg 2: Välj mall (oförändrad)
function Step2Template({
  formData,
  setFormData
}: {
  formData: FormData
  setFormData: (data: FormData) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Välj en mall som passar
        </h2>
        <p className="text-slate-600">
          Mallen hjälper dig att strukturera brevet på ett sätt som passar din situation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4" role="listbox" aria-label="Välj brevmall">
        {coverLetterTemplates.map((template) => (
          <div
            key={template.id}
            role="option"
            aria-selected={formData.selectedTemplate === template.id}
            tabIndex={0}
            onClick={() => setFormData({ ...formData, selectedTemplate: template.id })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setFormData({ ...formData, selectedTemplate: template.id })
              }
            }}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2',
              formData.selectedTemplate === template.id
                ? 'border-brand-700 bg-brand-50'
                : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                formData.selectedTemplate === template.id
                  ? 'bg-brand-100 text-brand-900'
                  : 'bg-slate-100 text-slate-700'
              )}>
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{template.name}</h3>
                <p className="text-sm text-slate-700 mt-1">{template.description}</p>
                {formData.selectedTemplate === template.id && (
                  <div className="flex items-center gap-1 mt-2 text-brand-900 text-sm">
                    <Check size={14} />
                    <span>Vald</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Steg 3: Anpassa ton och motivation
function Step3Customize({
  formData,
  setFormData,
  cvData,
}: {
  formData: FormData
  setFormData: (data: FormData) => void
  cvData: CVData | null
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Anpassa ditt brev
        </h2>
        <p className="text-slate-600">
          Välj tonläge och lägg till extra information för att göra brevet personligt.
        </p>
      </div>

      {/* CV-info */}
      {cvData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Information från ditt CV som AI kommer använda:
          </h4>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• Namn: {cvData.first_name} {cvData.last_name}</li>
            <li>• Titel: {cvData.title || 'Ej angiven'}</li>
            <li>• Kompetenser: {cvData.skills?.slice(0, 5).join(', ')}{cvData.skills?.length > 5 ? '...' : ''}</li>
            {cvData.work_experience && cvData.work_experience.length > 0 && (
              <li>• Erfarenhet: {cvData.work_experience[0].title} på {cvData.work_experience[0].company}</li>
            )}
          </ul>
        </div>
      )}

      {/* Tonalternativ */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-3">
          Välj tonläge
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3" role="radiogroup">
          {[
            { id: 'professional', label: 'Professionell', desc: 'Balanserad och trygg' },
            { id: 'enthusiastic', label: 'Entusiastisk', desc: 'Energisk och passionerad' },
            { id: 'formal', label: 'Formell', desc: 'Traditionell och respektfull' },
          ].map((tone) => (
            <button
              key={tone.id}
              role="radio"
              aria-checked={formData.tone === tone.id}
              onClick={() => setFormData({ ...formData, tone: tone.id })}
              className={cn(
                'p-3 rounded-lg border-2 text-left transition-all',
                formData.tone === tone.id
                  ? 'border-brand-700 bg-brand-50'
                  : 'border-slate-200 hover:border-brand-200'
              )}
            >
              <div className="font-medium text-slate-800 text-sm sm:text-base">{tone.label}</div>
              <div className="text-xs text-slate-700 mt-0.5">{tone.desc}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Extra motivation */}
      <div>
        <label htmlFor="cl-motivation" className="block text-sm font-medium text-slate-700 mb-1.5">
          Varför vill du ha detta jobb? (valfritt)
        </label>
        <textarea
          id="cl-motivation"
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="t.ex. Jag vill jobba med hållbarhet och erfarenhet av att..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all resize-none"
        />
      </div>
    </div>
  )
}

// Steg 4: Granska (oförändrad)
function Step4Review({
  formData,
  generatedLetter,
  editedLetter,
  setEditedLetter,
  isGenerating,
}: {
  formData: FormData
  generatedLetter: string
  editedLetter: string
  setEditedLetter: (text: string) => void
  isGenerating: boolean
}) {
  const [showTips, setShowTips] = useState(true)

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-brand-900 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          AI skapar ditt personliga brev...
        </h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Vi analyserar ditt CV och jobbannonsen för att skapa ett skräddarsytt brev.
          Detta tar bara några sekunder.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-brand-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-brand-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-brand-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Granska och redigera
        </h2>
        <p className="text-slate-600">
          Här är AI:s förslag baserat på ditt CV och jobbinformation. Gör det personligt!
        </p>
      </div>

      {showTips && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Tips för att göra det personligt</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Lägg till ett specifikt skäl till varför just detta företag lockar dig</li>
                <li>• Nämn något unikt från din erfarenhet som matchar jobbet</li>
                <li>• Anpassa tonen så det låter som dig</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowTips(false)}
              className="text-amber-400 hover:text-amber-600"
            >
              Dölj
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Ditt personliga brev</span>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>{editedLetter.length} tecken</span>
            <span>•</span>
            <span>{editedLetter.split(/\s+/).filter(w => w.length > 0).length} ord</span>
          </div>
        </div>
        <textarea
          value={editedLetter}
          onChange={(e) => setEditedLetter(e.target.value)}
          className="w-full px-4 py-4 min-h-[300px] outline-none resize-none text-slate-700 leading-relaxed"
          placeholder="Ditt personliga brev visas här..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(editedLetter)}>
          <Copy size={16} />
          Kopiera
        </Button>
        <Button 
          variant="outline" 
          className="gap-2 ml-auto"
          onClick={() => setEditedLetter(generatedLetter)}
        >
          Återställ original
        </Button>
      </div>
    </div>
  )
}

// Steg 5: Klart! (oförändrad)
function Step5Done({ 
  editedLetter, 
  onSave 
}: { 
  editedLetter: string
  onSave: () => void 
}) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-slate-800 mb-3">
        Bra jobbat! 🎉
      </h2>
      
      <p className="text-slate-600 max-w-md mx-auto mb-6">
        Du har skapat ett personligt brev som visar ditt värde. 
        Kom ihåg: Det är okej att gå tillbaka och justera om du vill.
      </p>

      {/* Preview */}
      <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
        <p className="text-sm text-slate-600 font-mono whitespace-pre-wrap">
          {editedLetter.slice(0, 300)}...
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(editedLetter)}>
          <Copy size={16} />
          Kopiera text
        </Button>
        <Button onClick={onSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Save size={16} />
          Spara brev
        </Button>
      </div>

      <p className="text-sm text-slate-700 mt-6">
        💡 Tips: Spara brevet även om du inte skickar det direkt. 
        Du kan återanvända det för liknande jobb!
      </p>
    </div>
  )
}

// Mock AI-tjänst - fallback
const mockGenerateLetter = async (data: { jobTitle: string; company: string; background?: string; skills?: string; motivation?: string }) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return {
    content: `Hej,

Jag söker med stort intresse rollen som ${data.jobTitle} hos ${data.company}. Med min bakgrund inom ${data.background || 'relevanta områden'} och passion för ${data.motivation || 'att utvecklas'}, tror jag att jag skulle passa väl in i ert team.

Under min tidigare erfarenhet har jag utvecklat starka färdigheter inom ${data.skills || 'relevanta kompetenser'}. Jag ser fram emot möjligheten att bidra med min erfarenhet och samtidigt växa tillsammans med er organisation.

Jag ser fram emot att få diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
[ Ditt namn ]`,
    suggestions: [
      'Nämn ett specifikt projekt du beundrar hos företaget',
      'Lägg till ett konkret resultat från din erfarenhet',
    ],
    keywords: ['kommunikation', 'teamwork', 'resultatorienterad']
  }
}

export default CoverLetterWrite
