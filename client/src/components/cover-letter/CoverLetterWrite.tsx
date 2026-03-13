/**
 * Cover Letter Write Tab - Komplett AI-driven brevskrivning
 * 
 * Funktioner:
 * - Hämtar CV-data automatiskt från Supabase
 * - Hämtar sparade jobb för enkel val
 * - AI-genererade personliga brev med CV-kontext
 * - Förhandsgranskning och redigering
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { coverLetterTemplates, getTemplateById } from '@/data/coverLetterTemplates'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { showToast } from '@/components/Toast'
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

// AI API-anrop för personligt brev
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
  const response = await fetch('/api/ai/personligt-brev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cvData: data.cvData,
      companyName: data.jobData.company,
      jobTitle: data.jobData.jobTitle,
      jobDescription: data.jobData.jobAd,
      tone: data.tone,
      extraContext: data.extraMotivation
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('AI API error:', response.status, errorText)
    throw new Error('Kunde inte generera personligt brev')
  }
  
  return response.json()
}

export function CoverLetterWrite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const editId = searchParams.get('edit')
  const templateId = searchParams.get('template')
  const initialJobId = searchParams.get('jobId')

  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
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

  const handleSave = () => {
    showToast.success('Brev sparat!')
    navigate('/cover-letter/my-letters')
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex flex-col items-center',
                  index < steps.length - 1 && 'flex-1'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-indigo-600 text-white',
                    isCompleted && 'bg-emerald-500 text-white',
                    !isActive && !isCompleted && 'bg-slate-100 text-slate-400'
                  )}>
                    {isCompleted ? (
                      <Check size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-2 font-medium',
                    isActive && 'text-indigo-600',
                    isCompleted && 'text-emerald-600',
                    !isActive && !isCompleted && 'text-slate-400'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-full h-0.5 mx-2',
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CV Status Banner */}
      {cvData && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-emerald-800">
                CV-data hämtad
              </h4>
              <p className="text-sm text-emerald-700">
                {cvData.first_name} {cvData.last_name} • {cvData.title || 'Ingen titel'} • {cvData.skills?.length || 0} kompetenser
              </p>
            </div>
            <div className="text-sm text-emerald-600">
              AI kommer använda detta
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
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft size={18} />
          Tillbaka
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Skapar brev...
              </>
            ) : (
              <>
                Nästa steg
                <ChevronRight size={18} />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save size={18} />
            Spara brev
          </Button>
        )}
      </div>
    </div>
  )
}

// Steg 1: Välj jobb (sparade eller manuell)
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
  formData: any
  setFormData: (data: any) => void
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
                  onClick={() => onSelectJob(job)}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all',
                    formData.selectedJobId === job.job_id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      formData.selectedJobId === job.job_id
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{title}</h4>
                      <p className="text-sm text-slate-500">{company}</p>
                      {location && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {location}
                        </p>
                      )}
                    </div>
                    {formData.selectedJobId === job.job_id && (
                      <div className="flex items-center gap-1 text-indigo-600 text-sm">
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-sm text-slate-500 mt-2">Laddar sparade jobb...</p>
        </div>
      )}

      {!loadingJobs && savedJobs.length === 0 && (
        <div className="text-center py-6 bg-slate-50 rounded-xl">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Du har inga sparade jobb än.</p>
          <p className="text-sm text-slate-500 mt-1">
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
          <span className="px-4 bg-white text-sm text-slate-500">eller</span>
        </div>
      </div>

      {/* Manuell inmatning */}
      <button
        onClick={onManual}
        className={cn(
          'w-full p-4 rounded-xl border-2 transition-all text-left',
          formData.useManualInput
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            formData.useManualInput
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-slate-100 text-slate-500'
          )}>
            <Edit3 size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-800">Fyll i manuellt</h4>
            <p className="text-sm text-slate-500">Skriv företag och jobbinformation själv</p>
          </div>
        </div>
      </button>

      {/* Manuell form */}
      {formData.useManualInput && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Företag *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="t.ex. Acme AB"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jobbtitel *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="t.ex. Projektledare"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jobbannons (valfritt men rekommenderat)
            </label>
            <textarea
              value={formData.jobAd}
              onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
              placeholder="Klistra in texten från jobbannonsen här..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
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
  formData: any
  setFormData: (data: any) => void 
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

      <div className="grid md:grid-cols-2 gap-4">
        {coverLetterTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setFormData({ ...formData, selectedTemplate: template.id })}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              formData.selectedTemplate === template.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                formData.selectedTemplate === template.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 text-slate-500'
              )}>
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{template.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                {formData.selectedTemplate === template.id && (
                  <div className="flex items-center gap-1 mt-2 text-indigo-600 text-sm">
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
  formData: any
  setFormData: (data: any) => void
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Välj tonläge
        </label>
        <div className="flex gap-3">
          {[
            { id: 'professional', label: 'Professionell', desc: 'Balanserad och trygg' },
            { id: 'enthusiastic', label: 'Entusiastisk', desc: 'Energisk och passionerad' },
            { id: 'formal', label: 'Formell', desc: 'Traditionell och respektfull' },
          ].map((tone) => (
            <button
              key={tone.id}
              onClick={() => setFormData({ ...formData, tone: tone.id })}
              className={cn(
                'flex-1 p-3 rounded-lg border-2 text-left transition-all',
                formData.tone === tone.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-200'
              )}
            >
              <div className="font-medium text-slate-800">{tone.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{tone.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Extra motivation */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Varför vill du ha detta jobb? (valfritt)
        </label>
        <textarea
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="t.ex. Jag vill jobba med hållbarhet och erfarenhet av att..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
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
  formData: any
  generatedLetter: string
  editedLetter: string
  setEditedLetter: (text: string) => void
  isGenerating: boolean
}) {
  const [showTips, setShowTips] = useState(true)

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          AI skapar ditt personliga brev...
        </h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Vi analyserar ditt CV och jobbannonsen för att skapa ett skräddarsytt brev.
          Detta tar bara några sekunder.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <div className="flex items-center gap-2 text-sm text-slate-500">
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

      <p className="text-sm text-slate-500 mt-6">
        💡 Tips: Spara brevet även om du inte skickar det direkt. 
        Du kan återanvända det för liknande jobb!
      </p>
    </div>
  )
}

// Mock AI-tjänst - fallback
const mockGenerateLetter = async (data: any) => {
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
