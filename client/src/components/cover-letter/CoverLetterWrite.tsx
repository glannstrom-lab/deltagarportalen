/**
 * Cover Letter Write Tab - Omdesignad med mallsystem
 *
 * Funktioner:
 * - Visuella mallar att välja mellan
 * - Live-förhandsgranskning i sidopanel
 * - AI-genererade personliga brev
 * - Professionell PDF-export
 */

import { useState, useEffect, useRef } from 'react'
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
  User,
  MapPin,
  Eye,
  EyeOff
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CoverLetterTemplateSelector } from './CoverLetterTemplateSelector'
import { CoverLetterPreview, getTemplateById } from './CoverLetterPreview'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { showToast } from '@/components/Toast'
import { callAI } from '@/services/aiApi'
import { coverLetterApi, userApi } from '@/services/supabaseApi'
import { generateCoverLetterPDFFromElement, downloadPDF } from '@/services/pdfExportService'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { CVData, ProfilePreferences } from '@/services/supabaseApi'

// Sparat jobb interface
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

// Form data interface
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

// AI API-anrop för personligt brev
async function generateCoverLetterWithAI(data: {
  cvData: CVData | null
  profileData: ProfilePreferences | null
  profile: { first_name?: string; last_name?: string; email?: string; phone?: string } | null
  jobData: {
    company: string
    jobTitle: string
    jobAd: string
  }
  tone: 'professional' | 'enthusiastic' | 'formal'
  extraMotivation?: string
}) {
  const profileContext: string[] = []

  if (data.profileData) {
    if (data.profileData.availability) {
      const av = data.profileData.availability
      if (av.availableFrom === 'immediately' || av.status === 'unemployed') {
        profileContext.push('Kan börja omgående')
      } else if (av.availableFrom) {
        profileContext.push(`Kan börja: ${av.availableFrom}`)
      }
      if (av.noticePeriod && av.noticePeriod !== 'none') {
        const periods: Record<string, string> = {
          '1_month': '1 månads uppsägningstid',
          '2_months': '2 månaders uppsägningstid',
          '3_months': '3 månaders uppsägningstid'
        }
        profileContext.push(periods[av.noticePeriod] || '')
      }
      if (av.remoteWork === 'yes') {
        profileContext.push('Öppen för distansarbete')
      } else if (av.remoteWork === 'hybrid') {
        profileContext.push('Öppen för hybridarbete')
      }
    }

    if (data.profileData.mobility) {
      const mob = data.profileData.mobility
      if (mob.driversLicense && mob.driversLicense.length > 0) {
        profileContext.push(`Körkort: ${mob.driversLicense.join(', ')}`)
      }
      if (mob.hasCar) {
        profileContext.push('Har tillgång till bil')
      }
      if (mob.willingToRelocate) {
        profileContext.push('Villig att flytta för rätt jobb')
      }
      if (mob.willingToTravel) {
        profileContext.push('Möjlighet att resa i tjänsten')
      }
    }

    if (data.profileData.work_preferences?.importantValues?.length) {
      const values = data.profileData.work_preferences.importantValues
      const valueLabels: Record<string, string> = {
        'hållbarhet': 'hållbarhet',
        'innovation': 'innovation',
        'work_life_balance': 'balans mellan arbete och fritid',
        'teamwork': 'samarbete',
        'personal_development': 'personlig utveckling'
      }
      const readableValues = values.map(v => valueLabels[v] || v).slice(0, 3)
      profileContext.push(`Värdesätter: ${readableValues.join(', ')}`)
    }
  }

  let fullContext = data.extraMotivation || ''
  if (profileContext.length > 0) {
    const profileInfo = profileContext.filter(p => p).join('. ')
    fullContext = fullContext
      ? `${fullContext}\n\nYtterligare information om kandidaten: ${profileInfo}`
      : `Information om kandidaten: ${profileInfo}`
  }

  // Get user's real name from profile or CV
  const firstName = data.profile?.first_name || data.cvData?.first_name || ''
  const lastName = data.profile?.last_name || data.cvData?.last_name || ''
  const email = data.profile?.email || data.cvData?.email || ''
  const phone = data.profile?.phone || data.cvData?.phone || ''

  return callAI('personligt-brev', {
    cvData: {
      ...data.cvData,
      // Ensure correct property names for backend
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone
    },
    // Send sender info explicitly for the AI to use
    senderName: [firstName, lastName].filter(Boolean).join(' '),
    senderEmail: email,
    senderPhone: phone,
    companyName: data.jobData.company,
    jobTitle: data.jobData.jobTitle,
    jobDescription: data.jobData.jobAd,
    tone: data.tone,
    extraContext: fullContext || undefined
  })
}

export function CoverLetterWrite() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile, loadProfile } = useProfileStore()
  const editId = searchParams.get('edit')
  const templateId = searchParams.get('template')
  const initialJobId = searchParams.get('jobId')

  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState<string>('')
  const [editedLetter, setEditedLetter] = useState<string>('')
  const [showPreview, setShowPreview] = useState(true)

  // Data states
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [profileData, setProfileData] = useState<ProfilePreferences | null>(null)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loadingCV, setLoadingCV] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    company: '',
    jobTitle: '',
    jobAd: '',
    motivation: '',
    selectedTemplate: templateId || 'professional',
    tone: 'professional',
    selectedJobId: initialJobId || '',
    useManualInput: false,
  })

  // Auto-save
  const autoSaveData = {
    formData,
    editedLetter,
    currentStep
  }

  const { clearSavedData } = useAutoSave({
    key: 'cover-letter-write-draft',
    data: autoSaveData,
    onRestore: (saved) => {
      if (saved.formData) setFormData(saved.formData)
      if (saved.editedLetter) setEditedLetter(saved.editedLetter)
      if (saved.currentStep) setCurrentStep(saved.currentStep)
    }
  })

  // Load profile if not already loaded
  useEffect(() => {
    if (!profile) {
      loadProfile()
    }
  }, [profile, loadProfile])

  // Hämta CV-data
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
        if (!error && data) {
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

  // Hämta profildata
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoadingProfile(false)
        return
      }
      try {
        const prefs = await userApi.getPreferences()
        setProfileData(prefs)
      } catch (err) {
        console.error('Fel vid hämtning av profildata:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfileData()
  }, [user])

  // Hämta sparade jobb
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
        if (!error && data) {
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

  // Ladda jobbdata från query params
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

  // Välj ett sparat jobb
  const selectSavedJob = (job: SavedJob) => {
    const title = job.job_data?.headline || 'Okänd titel'
    const company = job.job_data?.employer?.name || 'Okänt företag'
    const description = job.job_data?.description?.text || ''

    setFormData(prev => ({
      ...prev,
      selectedJobId: job.job_id,
      company,
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
    if (currentStep < 3) {
      if (currentStep === 2) {
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
        profileData,
        profile, // Pass profile data with real name/email/phone
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
      // Fallback
      const fallback = await mockGenerateLetter({
        ...formData,
        background: cvData?.summary || '',
        skills: cvData?.skills?.map(s => typeof s === 'string' ? s : s.name).join(', ') || '',
      })
      setGeneratedLetter(fallback.content)
      setEditedLetter(fallback.content)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!editedLetter.trim()) {
      showToast.error('Brevet kan inte vara tomt')
      return
    }

    setIsSaving(true)
    try {
      const title = `${formData.company} - ${formData.jobTitle}`.trim() || 'Namnlöst brev'

      await coverLetterApi.create({
        title,
        content: editedLetter,
        company: formData.company || undefined,
        job_title: formData.jobTitle || undefined,
        job_ad: formData.jobAd || undefined,
        template: formData.selectedTemplate,
        ai_generated: true
      })

      clearSavedData()
      showToast.success('Brev sparat!')
      navigate('/cover-letter/my-letters')
    } catch (error) {
      console.error('Failed to save letter:', error)
      showToast.error('Kunde inte spara brevet. Försök igen.')
    } finally {
      setIsSaving(false)
    }
  }

  // Ref till hidden full-storlek preview som html2canvas använder för PDF-generering.
  // Synlig preview ovan ändrar storlek beroende på skärm — denna är alltid 794px (A4).
  const pdfPreviewRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!pdfPreviewRef.current) {
      showToast.error('Förhandsgranskning är inte redo. Vänta ett ögonblick och försök igen.')
      return
    }
    try {
      const pdfBlob = await generateCoverLetterPDFFromElement(pdfPreviewRef.current, {
        multiPage: true,
      })

      const fileName = `Personligt_brev_${formData.company || 'ansökan'}_${formData.jobTitle || ''}`
        .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/_$/, '')
        + '.pdf'

      downloadPDF(pdfBlob, fileName)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      showToast.error('Kunde inte ladda ner PDF')
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company && formData.jobTitle && formData.selectedTemplate
      case 2:
        return true
      case 3:
        return editedLetter.length > 50
      default:
        return true
    }
  }

  // Sender info for preview
  const senderInfo = {
    name: [profile?.first_name || cvData?.first_name, profile?.last_name || cvData?.last_name].filter(Boolean).join(' ') || 'Ditt Namn',
    email: profile?.email || cvData?.email,
    phone: profile?.phone || cvData?.phone,
    location: profile?.location || cvData?.location,
  }

  const steps = [
    { id: 1, title: 'Jobb & Mall', icon: FileText },
    { id: 2, title: 'Skriv brev', icon: Edit3 },
    { id: 3, title: 'Granska & Spara', icon: Check },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Step indicator */}
      <nav aria-label="Brevskrivningssteg" className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-700/50 mb-6">
        <ol className="flex items-center justify-between" role="list">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <li key={step.id} className="flex items-center" aria-current={isActive ? 'step' : undefined}>
                <div className={cn('flex flex-col items-center', index < steps.length - 1 && 'flex-1')}>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isActive && 'bg-teal-600 text-white',
                      isCompleted && 'bg-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    )}
                    aria-hidden="true"
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={cn(
                    'text-xs mt-2 font-medium hidden sm:block',
                    isActive && 'text-teal-600 dark:text-teal-400',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400',
                    !isActive && !isCompleted && 'text-stone-600 dark:text-stone-400'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn('w-full h-0.5 mx-2', isCompleted ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700')}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Main content with optional sidebar preview */}
      <div className={cn('grid gap-6', currentStep >= 2 && showPreview ? 'lg:grid-cols-[1fr,400px]' : '')}>
        {/* Form area */}
        <div className="space-y-6">
          {/* CV Status Banner */}
          {cvData && (
            <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200 text-sm sm:text-base">
                    CV-data hämtad
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    {senderInfo.name} • AI använder ditt CV
                  </p>
                </div>
              </div>
            </div>
          )}

          {!cvData && !loadingCV && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Inget CV hittades</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Skapa ett CV för bästa resultat.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/cv')} className="text-amber-700">
                  Skapa CV
                </Button>
              </div>
            </div>
          )}

          {/* Step content */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            {currentStep === 1 && (
              <Step1JobAndTemplate
                savedJobs={savedJobs}
                loadingJobs={loadingJobs}
                formData={formData}
                setFormData={setFormData}
                onSelectJob={selectSavedJob}
                onManual={switchToManual}
              />
            )}
            {currentStep === 2 && (
              <Step2Write
                formData={formData}
                setFormData={setFormData}
                cvData={cvData}
                isGenerating={isGenerating}
                editedLetter={editedLetter}
                setEditedLetter={setEditedLetter}
                onGenerate={generateLetter}
              />
            )}
            {currentStep === 3 && (
              <Step3ReviewSave
                editedLetter={editedLetter}
                setEditedLetter={setEditedLetter}
                generatedLetter={generatedLetter}
                formData={formData}
                onSave={handleSave}
                onDownload={handleDownloadPDF}
                isSaving={isSaving}
                senderInfo={senderInfo}
              />
            )}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Tillbaka</span>
            </Button>

            <div className="flex gap-3">
              {/* Preview toggle for step 2+ */}
              {currentStep >= 2 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2 hidden lg:flex"
                >
                  {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showPreview ? 'Dölj förhandsgranskning' : 'Visa förhandsgranskning'}
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Skapar...
                    </>
                  ) : (
                    <>
                      Nästa
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Spara brev
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Live preview sidebar (desktop only, step 2+) */}
        {currentStep >= 2 && showPreview && (
          <div className="hidden lg:block sticky top-4">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <Eye size={16} />
                Förhandsgranskning
              </h3>
              <div className="aspect-[210/297] max-h-[600px]">
                <CoverLetterPreview
                  content={editedLetter || 'Ditt brev visas här...'}
                  company={formData.company}
                  jobTitle={formData.jobTitle}
                  templateId={formData.selectedTemplate}
                  sender={senderInfo}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden A4-storlek preview för PDF-generering.
          html2canvas behöver elementet i DOM:en med exakt rätt storlek (794px = A4 @ 96dpi).
          aria-hidden + position:fixed off-screen gör den osynlig för användare och skärmläsare. */}
      <div
        ref={pdfPreviewRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '794px',
          pointerEvents: 'none',
        }}
      >
        <CoverLetterPreview
          content={editedLetter || ''}
          company={formData.company}
          jobTitle={formData.jobTitle}
          templateId={formData.selectedTemplate}
          sender={senderInfo}
        />
      </div>
    </div>
  )
}

// Steg 1: Välj jobb & mall
function Step1JobAndTemplate({
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
    <div className="space-y-8">
      {/* Template selection */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Välj en mall
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Mallen påverkar hur ditt brev ser ut vid förhandsgranskning och PDF-export.
            </p>
          </div>
        </div>
        <CoverLetterTemplateSelector
          selectedTemplate={formData.selectedTemplate}
          onSelect={(id) => setFormData({ ...formData, selectedTemplate: id })}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-stone-200 dark:border-stone-700" />

      {/* Job selection */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Välj jobb för brevet
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Välj ett sparat jobb eller fyll i information manuellt.
            </p>
          </div>
        </div>

        {/* Sparade jobb */}
        {savedJobs.length > 0 && (
          <div className="space-y-3 mb-4">
            <h3 className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Dina sparade jobb ({savedJobs.length})
            </h3>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {savedJobs.slice(0, 5).map((job) => {
                const title = job.job_data?.headline || 'Okänd titel'
                const company = job.job_data?.employer?.name || 'Okänt företag'
                const location = job.job_data?.workplace_address?.municipality

                return (
                  <button
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      formData.selectedJobId === job.job_id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-stone-200 dark:border-stone-700 hover:border-teal-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase size={16} className="text-stone-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-stone-800 dark:text-stone-100 text-sm truncate">{title}</div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 truncate">
                          {company}{location && ` • ${location}`}
                        </div>
                      </div>
                      {formData.selectedJobId === job.job_id && (
                        <Check size={16} className="text-teal-600 shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {loadingJobs && (
          <div className="text-center py-4 text-stone-500 dark:text-stone-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
            Laddar sparade jobb...
          </div>
        )}

        {/* Manuell inmatning toggle */}
        <button
          onClick={onManual}
          className={cn(
            'w-full p-3 rounded-lg border transition-all text-left',
            formData.useManualInput
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
              : 'border-stone-200 dark:border-stone-700 hover:border-teal-200'
          )}
        >
          <div className="flex items-center gap-3">
            <Edit3 size={16} className="text-stone-500 shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-stone-800 dark:text-stone-100 text-sm">Fyll i manuellt</div>
              <div className="text-xs text-stone-600 dark:text-stone-400">Skriv företag och jobbinformation själv</div>
            </div>
          </div>
        </button>

        {/* Manuell form */}
        {formData.useManualInput && (
          <div className="space-y-4 mt-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <div>
              <label htmlFor="cl-company" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Företag *
              </label>
              <input
                id="cl-company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="t.ex. Acme AB"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div>
              <label htmlFor="cl-jobtitle" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Jobbtitel *
              </label>
              <input
                id="cl-jobtitle"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="t.ex. Projektledare"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div>
              <label htmlFor="cl-jobad" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Jobbannons (valfritt)
              </label>
              <textarea
                id="cl-jobad"
                value={formData.jobAd}
                onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
                placeholder="Klistra in texten från jobbannonsen..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Selected job summary */}
        {hasSelectedJob && !formData.useManualInput && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-emerald-800 dark:text-emerald-200 text-sm">
                {formData.jobTitle} på {formData.company}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Steg 2: Skriv brev
function Step2Write({
  formData,
  setFormData,
  cvData,
  isGenerating,
  editedLetter,
  setEditedLetter,
  onGenerate,
}: {
  formData: FormData
  setFormData: (data: FormData) => void
  cvData: CVData | null
  isGenerating: boolean
  editedLetter: string
  setEditedLetter: (text: string) => void
  onGenerate: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Skapa ditt brev
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Välj ton, lägg till extra motivation, och låt AI hjälpa dig.
          </p>
        </div>
      </div>

      {/* CV info */}
      {cvData && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1 flex items-center gap-2 text-sm">
            <Award className="w-4 h-4" />
            AI kommer använda:
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            {cvData.first_name} {cvData.last_name} • {cvData.title || 'Profil'} • {cvData.skills?.length || 0} kompetenser
          </p>
        </div>
      )}

      {/* Tone selection */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Välj tonläge
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'professional', label: 'Professionell', desc: 'Balanserad' },
            { id: 'enthusiastic', label: 'Entusiastisk', desc: 'Energisk' },
            { id: 'formal', label: 'Formell', desc: 'Traditionell' },
          ].map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => setFormData({ ...formData, tone: tone.id as FormData['tone'] })}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                formData.tone === tone.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-teal-200'
              )}
            >
              <div className="font-medium text-stone-800 dark:text-stone-100 text-sm">{tone.label}</div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{tone.desc}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Extra motivation */}
      <div>
        <label htmlFor="cl-motivation" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Extra motivation (valfritt)
        </label>
        <textarea
          id="cl-motivation"
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="t.ex. Jag är särskilt intresserad av er satsning på hållbarhet..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
        />
      </div>

      {/* Generate button */}
      {!editedLetter && (
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              AI skapar ditt brev...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generera brev med AI
            </>
          )}
        </Button>
      )}

      {/* Editor */}
      {editedLetter && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Ditt brev
            </label>
            <span className="text-xs text-stone-500">{editedLetter.split(/\s+/).filter(Boolean).length} ord</span>
          </div>
          <textarea
            value={editedLetter}
            onChange={(e) => setEditedLetter(e.target.value)}
            className="w-full px-4 py-3 min-h-[300px] rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-y"
          />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating} className="gap-1">
              <Sparkles size={14} />
              Regenerera
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Steg 3: Granska & Spara
function Step3ReviewSave({
  editedLetter,
  setEditedLetter,
  generatedLetter,
  formData,
  onSave,
  onDownload,
  isSaving,
  senderInfo,
}: {
  editedLetter: string
  setEditedLetter: (text: string) => void
  generatedLetter: string
  formData: FormData
  onSave: () => void
  onDownload: () => void
  isSaving: boolean
  senderInfo: { name: string; email?: string; phone?: string; location?: string }
}) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedLetter)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Granska och spara
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Se över brevet, gör ändringar, och spara eller ladda ner som PDF.
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Tips:</strong> Lägg till något personligt om varför just detta företag lockar dig.
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="lg:hidden">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Förhandsgranskning</h3>
        <div className="aspect-[210/297] max-h-[400px]">
          <CoverLetterPreview
            content={editedLetter}
            company={formData.company}
            jobTitle={formData.jobTitle}
            templateId={formData.selectedTemplate}
            sender={senderInfo}
            className="h-full"
          />
        </div>
      </div>

      {/* Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Redigera brev
          </label>
          <span className="text-xs text-stone-500">{editedLetter.split(/\s+/).filter(Boolean).length} ord</span>
        </div>
        <textarea
          value={editedLetter}
          onChange={(e) => setEditedLetter(e.target.value)}
          className="w-full px-4 py-3 min-h-[250px] rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={handleCopy}>
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          {isCopied ? 'Kopierat!' : 'Kopiera'}
        </Button>
        <Button variant="outline" className="gap-2" onClick={onDownload}>
          <Download size={16} />
          Ladda ner PDF
        </Button>
        <Button variant="outline" onClick={() => setEditedLetter(generatedLetter)} className="gap-2">
          Återställ original
        </Button>
        <Button onClick={onSave} disabled={isSaving} className="gap-2 ml-auto bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Spara brev
        </Button>
      </div>
    </div>
  )
}

// Mock AI fallback
const mockGenerateLetter = async (data: { jobTitle: string; company: string; background?: string; skills?: string; motivation?: string }) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return {
    content: `Hej,

Jag söker med stort intresse rollen som ${data.jobTitle} hos ${data.company}. Med min bakgrund inom ${data.background || 'relevanta områden'} och passion för ${data.motivation || 'att utvecklas'}, tror jag att jag skulle passa väl in i ert team.

Under min tidigare erfarenhet har jag utvecklat starka färdigheter inom ${data.skills || 'relevanta kompetenser'}. Jag ser fram emot möjligheten att bidra med min erfarenhet och samtidigt växa tillsammans med er organisation.

Jag ser fram emot att få diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
[ Ditt namn ]`
  }
}

export default CoverLetterWrite
