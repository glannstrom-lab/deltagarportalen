import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cvApi } from '@/services/api'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, X, Save, Check,
  Sparkles, Layout, Briefcase, GraduationCap, Award, Link2,
  Lightbulb, Wand2, Loader2
} from '@/components/ui/icons'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { showToast } from '@/components/Toast'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { CVShare } from '@/components/cv/CVShare'
import { CompactImageUpload } from '@/components/ImageUpload'
import { useVercelImageUpload } from '@/hooks/useVercelImageUpload'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { cvLogger } from '@/lib/logger'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CVData, CVVersion } from '@/services/supabaseApi'

// NYA IMPORTS för förbättringar
import { useCVAutoSave, useCVDraft } from '@/hooks/useCVAutoSave'
import type { WorkExperience } from '@/services/supabaseApi'
import { useCVScore, getOverallTips, getScoreColor } from '@/hooks/useCVScore'
// SaveIndicator is now rendered in CVPage header
import { AIHelpButton } from '@/components/cv/AIHelpButton'
import { RichTextEditor } from '@/components/cv/RichTextEditor'
import { ExperienceEditor } from '@/components/cv/ExperienceEditor'
import { EducationEditor } from '@/components/cv/EducationEditor'
import { SkillsEditor } from '@/components/cv/SkillsEditor'
import { ContextualHelp } from '@/components/cv/ContextualHelp'
import { CVOnboarding, shouldShowOnboarding } from '@/components/cv/CVOnboarding'
import { ContextualKnowledgeWidget } from '@/components/workflow'
import { QuickCVMode } from '@/components/cv/QuickCVMode'
import { JobAdaptPanel } from '@/components/cv/JobAdaptPanel'

// ============================================
// STEG - med tidsuppskattningar för bättre UX
// ============================================
const STEPS = [
  { id: 1, title: 'Design', description: 'Mall och färger', minutes: 2 },
  { id: 2, title: 'Om dig', description: 'Kontaktuppgifter', minutes: 3 },
  { id: 3, title: 'Profil', description: 'Sammanfattning', minutes: 5 },
  { id: 4, title: 'Erfarenhet', description: 'Jobb & utbildning', minutes: 10 },
  { id: 5, title: 'Kompetenser', description: 'Skills & övrigt', minutes: 5 },
] as const

// Language level constants (stored in DB, display via translation)
const LANGUAGE_LEVELS = [
  { value: 'basic', labelKey: 'cvBuilder.languageLevels.basic' },
  { value: 'good', labelKey: 'cvBuilder.languageLevels.good' },
  { value: 'fluent', labelKey: 'cvBuilder.languageLevels.fluent' },
  { value: 'native', labelKey: 'cvBuilder.languageLevels.native' },
] as const

// Moderna CV-mallar 2025
const TEMPLATES = [
  { 
    id: 'sidebar', 
    name: 'Sidokolumn', 
    desc: 'Modern layout med sidopanel för kontakt och skills',
    preview: 'bg-gradient-to-br from-slate-700 to-slate-900',
    features: ['Sidokolumn', 'Rundat foto', 'Skills i sidopanel']
  },
  { 
    id: 'centered', 
    name: 'Centrerad', 
    desc: 'Hero-design med stort foto och gradient',
    preview: 'bg-gradient-to-br from-teal-500 to-sky-500',
    features: ['Gradient header', 'Centrerat foto', 'Timeline']
  },
  { 
    id: 'minimal', 
    name: 'Minimal', 
    desc: 'Luftig design med mycket whitespace',
    preview: 'bg-gradient-to-br from-gray-50 to-gray-200',
    features: ['Clean & luftig', 'Enkel typografi', 'Fokus på innehåll']
  },
  { 
    id: 'creative', 
    name: 'Kreativ', 
    desc: 'Färgstark två-kolumns layout',
    preview: 'bg-gradient-to-br from-pink-500 to-rose-500',
    features: ['Färgstark', 'Progress bars', 'Kort-layout']
  },
  { 
    id: 'executive', 
    name: 'Executive', 
    desc: 'Elegant med serif-typsnitt för ledare',
    preview: 'bg-gradient-to-br from-slate-900 to-slate-800',
    features: ['Serif rubriker', 'Guld-accenter', 'Klassisk']
  },
  { 
    id: 'nordic', 
    name: 'Nordisk', 
    desc: 'Skandinavisk design med mjuka färger',
    preview: 'bg-gradient-to-br from-sky-100 to-blue-200',
    features: ['Mjuka färger', 'Ljust tema', 'Clean']
  },
]

// ============================================
// KOMPONENTER
// ============================================

function StepIndicator({ currentStep, totalSteps, onStepClick, completedSteps }: {
  currentStep: number
  totalSteps: number
  onStepClick: (step: number) => void
  completedSteps: number[]
}) {
  // Calculate time remaining
  const remainingMinutes = STEPS
    .filter((_, i) => !completedSteps.includes(i + 1) && i + 1 >= currentStep)
    .reduce((sum, step) => sum + step.minutes, 0)

  const progress = (completedSteps.length / totalSteps) * 100

  return (
    <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 mb-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Steg {currentStep} av {totalSteps}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">•</span>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            ~{remainingMinutes} min kvar
          </span>
        </div>
        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
          {Math.round(progress)}% klart
        </span>
      </div>

      {/* Visual progress bar */}
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-teal-500 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step buttons */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isCompleted = completedSteps.includes(stepNum)
          const isPast = stepNum < currentStep

          return (
            <div key={stepNum} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick(stepNum)}
                className={cn(
                  "flex flex-col items-center gap-1 group min-w-[44px] min-h-[44px] py-1",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg"
                )}
                aria-label={`Gå till steg ${stepNum}: ${step.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  isActive
                    ? "bg-teal-600 dark:bg-teal-500 text-white shadow-lg ring-4 ring-teal-100 dark:ring-teal-900/50"
                    : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 group-hover:bg-stone-200 dark:group-hover:bg-stone-600"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-teal-600 dark:text-teal-400" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400"
                )}>
                  {step.title}
                </span>
              </button>

              {/* Connector line */}
              {i < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-1 bg-stone-200 dark:bg-stone-700 relative hidden sm:block">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isPast || isCompleted ? "bg-emerald-500 w-full" : "bg-stone-200 dark:bg-stone-700 w-0"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current step description - more prominent on mobile */}
      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700/50">
        <div className="sm:text-center">
          <p className="text-sm sm:text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              Steg {currentStep}: {STEPS[currentStep - 1]?.title}
            </span>
            <span className="hidden sm:inline"> – </span>
            <span className="block sm:inline text-stone-600 dark:text-stone-400 mt-0.5 sm:mt-0">
              {STEPS[currentStep - 1]?.description}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 sm:p-6", className)}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500 text-base bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
      />
    </div>
  )
}

// ============================================
// HUVUDKOMPONENT
// ============================================
export default function CVBuilder() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [versions, setVersions] = useState<CVVersion[]>([])
  const [showSaveVersion, setShowSaveVersion] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showQuickMode, setShowQuickMode] = useState(false)
  const [hasLoadedCV, setHasLoadedCV] = useState(false)

  const [data, setData] = useState<CVData>({
    firstName: '', lastName: '', title: '', email: '', phone: '', location: '',
    summary: '', skills: [], workExperience: [], education: [],
    languages: [], certificates: [], links: [], references: [],
    template: 'modern', colorScheme: 'indigo', font: 'inter', profileImage: null,
  })
  
  const { upload: uploadImage, isUploading: isImageUploading } = useVercelImageUpload()
  const { user } = useAuthStore()
  const { confirm } = useConfirmDialog()

  // NYA FEATURES: Auto-save och draft
  const { saveStatus, lastSavedAt, hasUnsavedChanges, triggerSave } = useCVAutoSave(data)
  const { restoreDraft, clearDraft } = useCVDraft()
  const hasCheckedDraft = useRef(false)
  const prevWorkExpRef = useRef(JSON.stringify(data.workExperience))
  
  // Auto-save när workExperience ändras
  useEffect(() => {
    const currentWorkExp = JSON.stringify(data.workExperience)
    if (prevWorkExpRef.current !== currentWorkExp) {
      cvLogger.debug('CVBuilder: workExperience changed, triggering auto-save')
      triggerSave(data)
      prevWorkExpRef.current = currentWorkExp
    }
  }, [data, triggerSave])
  
  // Fråga om att återställa draft vid mount - efter att server data laddats
  useEffect(() => {
    // Visa onboarding om användaren inte sett den tidigare
    if (shouldShowOnboarding()) {
      setTimeout(() => setShowOnboarding(true), 500)
    }
  }, [])
  
  // Rensa gammal localStorage draft vid mount för att undvika konflikter
  useEffect(() => {
    localStorage.removeItem('cv-draft')
    localStorage.removeItem('cv-last-saved')
  }, []) // Kör bara en gång vid mount

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const completedSteps = [
    1,
    !!(data.firstName && data.lastName) && 2,
    !!data.summary && 3,
    (data.workExperience.length > 0 || data.education.length > 0) && 4,
    data.skills.length > 0 && 5,
  ].filter(Boolean) as number[]

  useEffect(() => { loadCV(); loadVersions() }, [])

  const loadCV = async () => {
    try {
      // Kolla först om vi ska redigera en specifik version (från Mina CV)
      const editVersion = localStorage.getItem('cv-edit-version')
      if (editVersion) {
        try {
          const { data: versionData } = JSON.parse(editVersion)
          setData(prev => ({ ...prev, ...versionData }))
          localStorage.removeItem('cv-edit-version')
          setHasLoadedCV(true)
          showToast.success(t('cvBuilder.messages.loadedCVVersion'))
          return
        } catch (e) {
          console.error('Fel vid laddning av version:', e)
        }
      }

      const cv = await cvApi.getCV()

      if (cv) {
        setData(prev => {
          const newData = { ...prev, ...cv }
          cvLogger.debug('CVBuilder: Setting data with workExperience:', newData.workExperience)
          return newData
        })
        // Viktigt: Markera att server-data är laddad så draft inte triggar
        localStorage.setItem('cv-last-saved', Date.now().toString())
        // Rensa eventuellt gammalt draft om det finns
        const draft = localStorage.getItem('cv-draft')
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            // Om draft är äldre än 5 minuter, rensa det
            if (Date.now() - (parsed._timestamp || 0) > 5 * 5 * 1000) {
              localStorage.removeItem('cv-draft')
            }
          } catch { }
        }
        // Kolla om vi ska visa quick mode (ingen befintlig CV-data)
        const hasExistingData = !!(cv.firstName || cv.lastName || cv.title || cv.summary)
        setShowQuickMode(!hasExistingData)
      } else {
        // Ingen CV finns - visa quick mode
        setShowQuickMode(true)
      }
      setHasLoadedCV(true)
    } catch (e) {
      console.error(e)
      setHasLoadedCV(true)
      setShowQuickMode(true)
    }
  }

  const loadVersions = async () => {
    try {
      const v = await cvApi.getVersions()
      setVersions(v || [])
    } catch (e) { console.error(e) }
  }

  const save = async () => {
    setSaving(true)
    try {
      await cvApi.updateCV(data)
      showToast.success(t('cvBuilder.messages.cvSaved'))
    } catch { showToast.error(t('cvBuilder.messages.couldNotSave')) }
    finally { setSaving(false) }
  }

  const saveVersion = async () => {
    if (!versionName.trim()) return
    try {
      await cvApi.saveVersion(versionName.trim(), data)
      await loadVersions()
      setVersionName('')
      setShowSaveVersion(false)
      showToast.success(t('cvBuilder.messages.versionSaved'))
    } catch { showToast.error(t('cvBuilder.messages.couldNotSaveVersion')) }
  }

  const restoreVersion = async (versionId: string) => {
    const confirmed = await confirm({
      title: t('cvBuilder.messages.restoreTitle', 'Återställ version'),
      message: t('cvBuilder.messages.replaceConfirm'),
      confirmText: t('cvBuilder.actions.restore'),
      cancelText: t('cvBuilder.actions.cancel'),
      variant: 'warning'
    })
    if (!confirmed) return
    try {
      const restored = await cvApi.restoreVersion(versionId)
      setData(prev => ({ ...prev, ...restored }))
      showToast.success(t('cvBuilder.messages.versionRestored'))
    } catch { showToast.error(t('cvBuilder.messages.couldNotRestore')) }
  }

  // Handler för QuickCVMode - fyll i data och byt till full mode
  const handleQuickComplete = (quickData: Partial<CVData>) => {
    setData(prev => ({ ...prev, ...quickData }))
    setShowQuickMode(false)
    setStep(2) // Gå till "Om dig" för att kunna redigera vidare
    showToast.success(t('cv.quickMode.success', 'Ditt CV är skapat! Du kan nu redigera och lägga till mer information.'))
  }

  // Handler för JobAdaptPanel - lägg till skill
  const handleAddSkillFromJob = (skillName: string) => {
    const newSkill = {
      id: Date.now().toString(),
      name: skillName,
      level: 3,
      category: 'technical' as const
    }
    setData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill]
    }))
    showToast.success(t('cv.jobAdapt.skillAdded', 'Kompetens tillagd: {{skill}}', { skill: skillName }))
  }

  // Handler för JobAdaptPanel - uppdatera sammanfattning
  const handleUpdateSummaryFromJob = (summary: string) => {
    setData(prev => ({ ...prev, summary }))
    showToast.success(t('cv.jobAdapt.summaryUpdated', 'Sammanfattning uppdaterad'))
  }

  const loadDemoData = async () => {
    const confirmed = await confirm({
      title: t('cvBuilder.messages.demoDataTitle', 'Fyll i exempeldata'),
      message: t('cvBuilder.messages.fillDemoData'),
      confirmText: t('cvBuilder.actions.fill', 'Fyll i'),
      cancelText: t('cvBuilder.actions.cancel'),
      variant: 'info'
    })
    if (!confirmed) return
    setData({
      ...data,
      firstName: 'Anna', lastName: 'Andersson', title: 'Projektledare',
      email: 'anna@example.com', phone: '070-123 45 67', location: 'Stockholm',
      profileImage: null,
      summary: 'Erfaren projektledare med passion för att skapa effektiva team.',
      skills: [
        { id: '1', name: 'Projektledning', level: 5, category: 'technical' },
        { id: '2', name: 'Agila metoder', level: 4, category: 'technical' },
        { id: '3', name: 'Kommunikation', level: 5, category: 'soft' },
      ],
      workExperience: [
        { id: '1', company: 'Tech AB', title: 'Projektledare', location: 'Stockholm', startDate: '2021-01', endDate: '', current: true, description: 'Leder utvecklingsteam' },
      ],
      education: [
        { id: '1', school: 'Stockholms Universitet', degree: 'Kandidatexamen', field: 'Informatik', location: 'Stockholm', startDate: '2015-08', endDate: '2018-05', description: '' },
      ],
    })
  }

  const add = <T extends { id: string }>(arr: T[], item: T, key: keyof CVData) => {
    setData({ ...data, [key]: [...arr, item] } as CVData)
  }
  const remove = <T extends { id: string }>(arr: T[], id: string, key: keyof CVData) => {
    setData({ ...data, [key]: arr.filter(x => x.id !== id) } as CVData)
  }
  const update = <T extends { id: string }>(arr: T[], id: string, key: keyof CVData, field: keyof T, val: T[keyof T]) => {
    setData({ ...data, [key]: arr.map(x => x.id === id ? { ...x, [field]: val } : x) } as CVData)
  }

  // STEG 1: DESIGN - Moderna mallar 2025
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.templates.chooseTemplate')}</h3>
        <p className="text-stone-700 dark:text-stone-300">{t('cvBuilder.templates.templateDescription')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => {
          const selected = data.template === tpl.id
          return (
            <button
              key={tpl.id}
              onClick={() => setData({ ...data, template: tpl.id })}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 text-left transition-all",
                selected
                  ? "border-teal-500 ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-stone-900 shadow-lg"
                  : "border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md"
              )}
            >
              {/* Preview thumbnail */}
              <div className={cn("h-36 w-full relative", tpl.preview)}>
                {selected && (
                  <div className="absolute top-3 right-3 bg-teal-500 text-white rounded-full p-1.5 shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                )}

                {/* Mock layout preview */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {tpl.id === 'sidebar' && (
                    <div className="flex gap-2 w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-1/3 bg-stone-700 rounded" />
                      <div className="w-2/3 space-y-1">
                        <div className="h-3 bg-stone-200 rounded w-3/4" />
                        <div className="h-2 bg-stone-200 rounded w-1/2" />
                      </div>
                    </div>
                  )}
                  {tpl.id === 'centered' && (
                    <div className="flex flex-col items-center w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 mb-2" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  )}
                  {tpl.id === 'minimal' && (
                    <div className="w-full h-20 bg-white/90 rounded-lg p-3 shadow-sm space-y-2">
                      <div className="h-3 bg-stone-800 rounded w-1/3" />
                      <div className="h-2 bg-stone-200 rounded w-full" />
                      <div className="h-2 bg-stone-200 rounded w-2/3" />
                    </div>
                  )}
                  {tpl.id === 'creative' && (
                    <div className="flex gap-2 w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-2/5 bg-pink-500 rounded" />
                      <div className="w-3/5 grid grid-cols-2 gap-1">
                        <div className="bg-pink-100 rounded" />
                        <div className="bg-pink-100 rounded" />
                      </div>
                    </div>
                  )}
                  {tpl.id === 'executive' && (
                    <div className="w-full h-20 bg-stone-800 rounded-lg p-3 shadow-sm">
                      <div className="h-3 bg-amber-400 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-stone-600 rounded w-full" />
                    </div>
                  )}
                  {tpl.id === 'nordic' && (
                    <div className="flex gap-2 w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-1/3 bg-sky-100 rounded" />
                      <div className="w-2/3 space-y-1">
                        <div className="h-3 bg-sky-200 rounded w-3/4" />
                        <div className="h-2 bg-sky-100 rounded w-1/2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg text-stone-800 dark:text-stone-200">{tpl.name}</h4>
                  {selected && <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-medium">{t('cvBuilder.templates.selected')}</span>}
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">{tpl.desc}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {tpl.features.map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {data.template && (
        <div className="p-5 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/50">
          <div className="flex items-start gap-3">
            <div className="bg-teal-500 text-white rounded-full p-1 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-teal-900 dark:text-teal-100">
                {TEMPLATES.find(tpl => tpl.id === data.template)?.name} {t('cvBuilder.templates.isSelected')}
              </p>
              <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                {t('cvBuilder.templates.selectedInfo')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // STEG 2: OM DIG
  const renderStep2 = () => (
    <div className="space-y-4">
      <Card className="relative">
        {/* Loading overlay for image upload */}
        {isImageUploading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 rounded-2xl flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('cvBuilder.profileImage.uploading')}</span>
            </div>
          </div>
        )}
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">{t('cvBuilder.profileImage.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
          {t('cvBuilder.profileImage.description')}
        </p>
        <CompactImageUpload
          value={data.profileImage}
          onChange={(url) => setData({ ...data, profileImage: url })}
          onUpload={async (file) => {
            if (!user?.id) {
              showToast.error(t('cvBuilder.profileImage.mustBeLoggedIn'))
              return null
            }
            const result = await uploadImage(file)
            if (result.error) {
              showToast.error(t('cvBuilder.profileImage.uploadFailed') + result.error)
              return null
            }
            return result.url
          }}
        />
      </Card>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('cvBuilder.fields.firstName')} value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} placeholder={t('cvBuilder.placeholders.firstName')} />
          <Input label={t('cvBuilder.fields.lastName')} value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} placeholder={t('cvBuilder.placeholders.lastName')} />
        </div>
      </Card>
      <Card>
        <Input label={t('cvBuilder.fields.jobTitle')} value={data.title} onChange={(v) => setData({ ...data, title: v })} placeholder={t('cvBuilder.placeholders.jobTitle')} />
      </Card>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('cvBuilder.fields.email')} type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder={t('cvBuilder.placeholders.email')} />
          <Input label={t('cvBuilder.fields.phone')} type="tel" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} placeholder={t('cvBuilder.placeholders.phone')} />
        </div>
      </Card>
      <Card>
        <Input label={t('cvBuilder.fields.location')} value={data.location} onChange={(v) => setData({ ...data, location: v })} placeholder={t('cvBuilder.placeholders.location')} />
      </Card>
    </div>
  )

  // STEG 3: PROFIL
  const renderStep3 = () => (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.summary.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">{t('cvBuilder.summary.description')}</p>
        <RichTextEditor
          value={data.summary || ''}
          onChange={(v) => setData({ ...data, summary: v })}
          placeholder={t('cvBuilder.summary.placeholder')}
          maxLength={1000}
          minHeight="150px"
          helpText={t('cvBuilder.summary.helpText')}
        />
        <div className="mt-4">
          <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" cvData={data} />
        </div>
      </Card>

      <ContextualHelp context="summary" data={data.summary} />

      <AIHelpButton field="summary" onFill={() => setData({ ...data, summary: t('cvBuilder.summary.aiTemplate') })} />
    </div>
  )

  // STEG 4: ERFARENHET
  const renderStep4 = () => (
    <div className="space-y-6">
      <ContextualHelp context="experience" />

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-sky-500" />
          {t('cvBuilder.sections.workExperience')}
        </h3>
        <ExperienceEditor
          experiences={data.workExperience || []}
          onChange={(experiences) => setData({ ...data, workExperience: experiences })}
        />
      </div>

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-sky-500" />
          {t('cvBuilder.sections.education')}
        </h3>
        <EducationEditor
          education={data.education || []}
          onChange={(education) => setData({ ...data, education })}
        />
      </div>
    </div>
  )

  // STEG 5: KOMPETENSER
  const renderStep5 = () => (
    <div className="space-y-6">
      <ContextualHelp context="skills" />

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-sky-500" />
          {t('cvBuilder.sections.skills')}
        </h3>
        <SkillsEditor
          skills={data.skills || []}
          onChange={(skills) => setData({ ...data, skills })}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.languages')}</h3>
          <button onClick={() => add(data.languages, { id: Date.now().toString(), language: '', level: 'good' }, 'languages')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-600/10 rounded-lg hover:bg-teal-600/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.languages.length > 0 && (
          <div className="space-y-2">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => update(data.languages, lang.id, 'languages', 'language', e.target.value)}
                  placeholder={t('cvBuilder.placeholders.language')}
                  className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  aria-label={t('cvBuilder.sections.languages')}
                />
                <select
                  value={lang.level}
                  onChange={(e) => update(data.languages, lang.id, 'languages', 'level', e.target.value)}
                  className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm w-32 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  aria-label={t('cvBuilder.fields.languageLevel')}
                >
                  {LANGUAGE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {t(level.labelKey)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(data.languages, lang.id, 'languages')}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  aria-label={t('cvBuilder.actions.remove')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.certificates')}</h3>
          <button onClick={() => add(data.certificates, { id: Date.now().toString(), name: '', issuer: '', date: '' }, 'certificates')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-600/10 rounded-lg hover:bg-teal-600/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.certificates.length > 0 && (
          <div className="space-y-2">
            {data.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3">
                <input type="text" value={cert.name} onChange={(e) => update(data.certificates, cert.id, 'certificates', 'name', e.target.value)} placeholder={t('cvBuilder.sections.certificates')} className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <button onClick={() => remove(data.certificates, cert.id, 'certificates')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.links')}</h3>
          <button onClick={() => add(data.links, { id: Date.now().toString(), type: 'website', url: '', label: '' }, 'links')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-600/10 rounded-lg hover:bg-teal-600/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.links.length > 0 && (
          <div className="space-y-2">
            {data.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <input type="text" value={link.label} onChange={(e) => update(data.links, link.id, 'links', 'label', e.target.value)} placeholder={t('cvBuilder.sections.links')} className="w-1/3 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <input type="url" value={link.url} onChange={(e) => update(data.links, link.id, 'links', 'url', e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <button onClick={() => remove(data.links, link.id, 'links')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      default: return null
    }
  }

  const currentStep = STEPS.find(s => s.id === step)!

  // Visa laddningsindikator medan CV laddas
  if (!hasLoadedCV) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-stone-600 dark:text-stone-400">{t('cvBuilder.loading', 'Laddar...')}</span>
        </div>
      </div>
    )
  }

  // Visa QuickCVMode om användaren inte har befintlig CV-data
  if (showQuickMode) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            {t('cv.welcome.title', 'Välkommen till CV-byggaren')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            {t('cv.welcome.subtitle', 'Välj hur du vill börja')}
          </p>
        </div>

        <QuickCVMode
          onComplete={handleQuickComplete}
          onSwitchToFull={() => setShowQuickMode(false)}
          className="mb-6"
        />

        <div className="text-center">
          <button
            onClick={() => setShowQuickMode(false)}
            className="px-6 py-3 text-teal-600 dark:text-teal-400 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors"
          >
            {t('cv.welcome.fullBuilder', 'Eller använd den fullständiga CV-byggaren')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Action buttons bar */}
      <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
        <button onClick={loadDemoData} className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">{t('cvBuilder.actions.exampleData')}</span>
        </button>
        {/* Manuell spara-knapp - backup om auto-save misslyckas */}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          title={t('cvBuilder.actions.saveManually')}
        >
          <Save className="w-4 h-4" />
          {saving ? t('cvBuilder.actions.saving') : t('cvBuilder.actions.saveNow')}
        </button>
        <div className="w-px h-6 bg-stone-300 dark:bg-stone-600 mx-1 hidden sm:block" />
        <CVShare onShare={async () => await cvApi.shareCV()} variant="compact" />
        <PDFExportButton
          type="cv"
          data={data}
          variant="outline"
          size="sm"
          showPreview={false}
        />
      </div>

      {/* Steg-indikator */}
      <StepIndicator currentStep={step} totalSteps={STEPS.length} onStepClick={setStep} completedSteps={completedSteps} />

      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 dark:bg-stone-950/70 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-stone-100 dark:bg-stone-900 rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">{t('cvBuilder.actions.preview')}</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full"><X className="w-6 h-6 text-stone-700 dark:text-stone-300" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CVPreview data={data} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - 50/50 på desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div>
          <div className="min-h-[400px]">
            {renderContent()}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between mt-6">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 font-medium">
              <ChevronLeft className="w-5 h-5" />
              {t('cvBuilder.actions.previous')}
            </button>
            <button onClick={() => setStep(Math.min(STEPS.length, step + 1))} disabled={step === STEPS.length} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-medium">
              {t('cvBuilder.actions.next')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Spacer for fixed mobile navigation */}
          <div className="h-24 lg:hidden" />
        </div>

        {/* Right: Preview + Tools (desktop) */}
        <div className="hidden lg:block space-y-6">
          {/* Preview - Clean A4 look */}
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700/50">
            <div className="bg-white dark:bg-stone-900 shadow-lg rounded-lg overflow-hidden max-h-[700px] overflow-y-auto">
              <CVPreview data={data} />
            </div>
          </div>

          {/* Contextual Knowledge - Fas 2 */}
          <ContextualKnowledgeWidget context="cv-building" variant="full" />

          {/* Help - Show onboarding again */}
          <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.help.title')}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
              {t('cvBuilder.help.description')}
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
            >
              {t('cvBuilder.help.showGuide')}
            </button>
          </div>

          {/* Job Adapt Panel - Anpassa för jobb */}
          {step >= 3 && (
            <JobAdaptPanel
              cvData={data}
              onAddSkill={handleAddSkillFromJob}
              onUpdateSummary={handleUpdateSummaryFromJob}
            />
          )}

          {/* AI Tools */}
          {step === 3 && (
            <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.help.aiWriting')}</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                {t('cvBuilder.help.aiWritingDesc')}
              </p>
              <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" cvData={data} />
            </div>
          )}

          {/* Versions */}
          <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">{t('cvBuilder.versions.title')}</h3>
            {showSaveVersion ? (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder={t('cvBuilder.versions.versionNamePlaceholder')}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <div className="flex gap-2">
                  <button onClick={saveVersion} className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg">{t('cvBuilder.versions.save')}</button>
                  <button onClick={() => setShowSaveVersion(false)} className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 text-sm rounded-lg text-stone-700 dark:text-stone-300">{t('cvBuilder.versions.cancel')}</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveVersion(true)}
                className="w-full mb-3 px-4 py-2 border border-teal-600 dark:border-teal-500 text-teal-600 dark:text-teal-400 rounded-lg text-sm hover:bg-teal-600/5 dark:hover:bg-teal-600/10"
              >
                {t('cvBuilder.versions.saveCurrentVersion')}
              </button>
            )}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 text-center py-2">{t('cvBuilder.versions.noVersions')}</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{v.name}</p>
                      <p className="text-xs text-stone-700 dark:text-stone-300">{new Date(v.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}</p>
                    </div>
                    <button
                      onClick={() => restoreVersion(v.id)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:bg-teal-600/10 px-2 py-1 rounded"
                    >
                      {t('cvBuilder.actions.restore')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      
      {/* Onboarding */}
      {showOnboarding && (
        <CVOnboarding 
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      {/* Mobile Fixed Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 px-4 py-3 flex items-center justify-between gap-3 safe-area-pb">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('cvBuilder.actions.previous')}
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => setStep(Math.min(STEPS.length, step + 1))}
          disabled={step === STEPS.length}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-medium"
        >
          {t('cvBuilder.actions.next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
