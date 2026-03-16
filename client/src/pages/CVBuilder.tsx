import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, X, Save, Check,
  Linkedin, Sparkles, Layout, Briefcase, GraduationCap, Award, Link2,
  Lightbulb, Wand2
} from 'lucide-react'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { showToast } from '@/components/Toast'
import { LinkedInImport } from '@/components/linkedin/LinkedInImport'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { CVShare } from '@/components/cv/CVShare'
import { CompactImageUpload } from '@/components/ImageUpload'
import { useVercelImageUpload } from '@/hooks/useVercelImageUpload'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { CVData, CVVersion } from '@/services/supabaseApi'

// NYA IMPORTS för förbättringar
import { useCVAutoSave, useCVDraft } from '@/hooks/useCVAutoSave'
import type { WorkExperience } from '@/services/supabaseApi'
import { useCVScore, getOverallTips, getScoreColor } from '@/hooks/useCVScore'
import { SaveIndicator } from '@/components/cv/SaveIndicator'
import { CVProgressBar } from '@/components/cv/CVProgressBar'
import { MobilePreviewFAB } from '@/components/cv/MobilePreviewFAB'
import { AIHelpButton } from '@/components/cv/AIHelpButton'
import { RichTextEditor } from '@/components/cv/RichTextEditor'
import { ExperienceEditor } from '@/components/cv/ExperienceEditor'
import { EducationEditor } from '@/components/cv/EducationEditor'
import { SkillsEditor } from '@/components/cv/SkillsEditor'
import { ContextualHelp } from '@/components/cv/ContextualHelp'
import { CVOnboarding, shouldShowOnboarding } from '@/components/cv/CVOnboarding'
import { ContextualKnowledgeWidget } from '@/components/workflow'
import { CVSaveTest } from '@/components/cv/CVSaveTest'

// ============================================
// STEG
// ============================================
const STEPS = [
  { id: 1, title: 'Design', description: 'Mall och färger' },
  { id: 2, title: 'Om dig', description: 'Kontaktuppgifter' },
  { id: 3, title: 'Profil', description: 'Sammanfattning' },
  { id: 4, title: 'Erfarenhet', description: 'Jobb & utbildning' },
  { id: 5, title: 'Kompetenser', description: 'Skills & övrigt' },
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
    preview: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
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
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = completedSteps.includes(stepNum)
        
        return (
          <button
            key={stepNum}
            onClick={() => onStepClick(stepNum)}
            className="flex items-center gap-2 group"
          >
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              isActive 
                ? "bg-[#4f46e5] text-white shadow-lg" 
                : isCompleted 
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
            )}>
              {isCompleted && !isActive ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : stepNum}
            </div>
            <span className={cn(
              "hidden sm:block text-sm font-medium",
              isActive ? "text-[#4f46e5]" : isCompleted ? "text-green-600" : "text-slate-500"
            )}>
              {STEPS[i].title}
            </span>
            {i < totalSteps - 1 && (
              <div className="hidden sm:block w-8 h-0.5 mx-1 bg-slate-200">
                <div className={cn("h-full transition-all", isCompleted ? "bg-green-500 w-full" : "w-0")} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6", className)}>
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
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
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
  const [showLinkedInImport, setShowLinkedInImport] = useState(false)
  const [versions, setVersions] = useState<CVVersion[]>([])
  const [showSaveVersion, setShowSaveVersion] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  const [data, setData] = useState<CVData>({
    firstName: '', lastName: '', title: '', email: '', phone: '', location: '',
    summary: '', skills: [], workExperience: [], education: [],
    languages: [], certificates: [], links: [], references: [],
    template: 'modern', colorScheme: 'indigo', font: 'inter', profileImage: null,
  })
  
  const { upload: uploadImage, isUploading: isImageUploading } = useVercelImageUpload()
  const { user } = useAuthStore()
  
  // NYA FEATURES: Auto-save och draft
  const { saveStatus, lastSavedAt, hasUnsavedChanges, triggerSave } = useCVAutoSave(data)
  const { restoreDraft, clearDraft } = useCVDraft()
  const hasCheckedDraft = useRef(false)
  const prevWorkExpRef = useRef(JSON.stringify(data.workExperience))
  
  // Auto-save när workExperience ändras
  useEffect(() => {
    const currentWorkExp = JSON.stringify(data.workExperience)
    if (prevWorkExpRef.current !== currentWorkExp) {
      console.log('CVBuilder: workExperience changed, triggering auto-save')
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
          console.log('CVBuilder: Setting data with workExperience:', newData.workExperience)
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
      }
    } catch (e) { console.error(e) }
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
      alert(t('cvBuilder.messages.versionSaved'))
    } catch { alert(t('cvBuilder.messages.couldNotSaveVersion')) }
  }

  const restoreVersion = async (versionId: string) => {
    if (!confirm(t('cvBuilder.messages.replaceConfirm'))) return
    try {
      const restored = await cvApi.restoreVersion(versionId)
      setData(prev => ({ ...prev, ...restored }))
      alert(t('cvBuilder.messages.versionRestored'))
    } catch { alert(t('cvBuilder.messages.couldNotRestore')) }
  }

  const loadDemoData = () => {
    if (!confirm(t('cvBuilder.messages.fillDemoData'))) return
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
  const update = <T extends { id: string }>(arr: T[], id: string, key: keyof CVData, field: keyof T, val: any) => {
    setData({ ...data, [key]: arr.map(x => x.id === id ? { ...x, [field]: val } : x) } as CVData)
  }

  // STEG 1: DESIGN - Moderna mallar 2025
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('cvBuilder.templates.chooseTemplate')}</h3>
        <p className="text-slate-500">{t('cvBuilder.templates.templateDescription')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((t) => {
          const selected = data.template === t.id
          return (
            <button
              key={t.id}
              onClick={() => setData({ ...data, template: t.id })}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 text-left transition-all",
                selected 
                  ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 shadow-xl" 
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-lg"
              )}
            >
              {/* Preview thumbnail */}
              <div className={cn("h-36 w-full relative", t.preview)}>
                {selected && (
                  <div className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-1.5 shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                
                {/* Mock layout preview */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {t.id === 'sidebar' && (
                    <div className="flex gap-2 w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-1/3 bg-slate-700 rounded" />
                      <div className="w-2/3 space-y-1">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  )}
                  {t.id === 'centered' && (
                    <div className="flex flex-col items-center w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  )}
                  {t.id === 'minimal' && (
                    <div className="w-full h-20 bg-white/90 rounded-lg p-3 shadow-sm space-y-2">
                      <div className="h-3 bg-slate-800 rounded w-1/3" />
                      <div className="h-2 bg-slate-200 rounded w-full" />
                      <div className="h-2 bg-slate-200 rounded w-2/3" />
                    </div>
                  )}
                  {t.id === 'creative' && (
                    <div className="flex gap-2 w-full h-20 bg-white/90 rounded-lg p-2 shadow-sm">
                      <div className="w-2/5 bg-pink-500 rounded" />
                      <div className="w-3/5 grid grid-cols-2 gap-1">
                        <div className="bg-pink-100 rounded" />
                        <div className="bg-pink-100 rounded" />
                      </div>
                    </div>
                  )}
                  {t.id === 'executive' && (
                    <div className="w-full h-20 bg-slate-800 rounded-lg p-3 shadow-sm">
                      <div className="h-3 bg-amber-400 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-slate-600 rounded w-full" />
                    </div>
                  )}
                  {t.id === 'nordic' && (
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
                  <h4 className="font-bold text-lg text-slate-800">{t.name}</h4>
                  {selected && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t('cvBuilder.templates.selected')}</span>}
                </div>
                <p className="text-sm text-slate-500 mb-3">{t.desc}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {t.features.map((feature, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md"
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
        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-500 text-white rounded-full p-1 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-indigo-900">
                {TEMPLATES.find(tpl => tpl.id === data.template)?.name} {t('cvBuilder.templates.isSelected')}
              </p>
              <p className="text-sm text-indigo-700 mt-1">
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
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">{t('cvBuilder.profileImage.title')}</h3>
        <p className="text-sm text-slate-500 mb-4">
          {t('cvBuilder.profileImage.description')}
        </p>
        <CompactImageUpload
          value={data.profileImage}
          onChange={(url) => setData({ ...data, profileImage: url })}
          onUpload={async (file) => {
            if (!user?.id) {
              alert(t('cvBuilder.profileImage.mustBeLoggedIn'))
              return null
            }
            const result = await uploadImage(file)
            if (result.error) {
              alert(t('cvBuilder.profileImage.uploadFailed') + result.error)
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
        <h3 className="font-semibold text-slate-800 mb-2">{t('cvBuilder.summary.title')}</h3>
        <p className="text-sm text-slate-500 mb-4">{t('cvBuilder.summary.description')}</p>
        <RichTextEditor
          value={data.summary || ''}
          onChange={(v) => setData({ ...data, summary: v })}
          placeholder={t('cvBuilder.summary.placeholder')}
          maxLength={1000}
          minHeight="150px"
          helpText={t('cvBuilder.summary.helpText')}
        />
        <div className="mt-4">
          <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" />
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
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-500" />
          {t('cvBuilder.sections.workExperience')}
        </h3>
        <ExperienceEditor
          experiences={data.workExperience || []}
          onChange={(experiences) => setData({ ...data, workExperience: experiences })}
        />
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-500" />
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
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" />
          {t('cvBuilder.sections.skills')}
        </h3>
        <SkillsEditor
          skills={data.skills || []}
          onChange={(skills) => setData({ ...data, skills })}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{t('cvBuilder.sections.languages')}</h3>
          <button onClick={() => add(data.languages, { id: Date.now().toString(), language: '', level: t('cvBuilder.languageLevels.good') }, 'languages')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.languages.length > 0 && (
          <div className="space-y-2">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3">
                <input type="text" value={lang.language} onChange={(e) => update(data.languages, lang.id, 'languages', 'language', e.target.value)} placeholder={t('cvBuilder.sections.languages')} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={lang.level} onChange={(e) => update(data.languages, lang.id, 'languages', 'level', e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32">
                  <option value={t('cvBuilder.languageLevels.basic')}>{t('cvBuilder.languageLevels.basic')}</option>
                  <option value={t('cvBuilder.languageLevels.good')}>{t('cvBuilder.languageLevels.good')}</option>
                  <option value={t('cvBuilder.languageLevels.fluent')}>{t('cvBuilder.languageLevels.fluent')}</option>
                  <option value={t('cvBuilder.languageLevels.native')}>{t('cvBuilder.languageLevels.native')}</option>
                </select>
                <button onClick={() => remove(data.languages, lang.id, 'languages')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{t('cvBuilder.sections.certificates')}</h3>
          <button onClick={() => add(data.certificates, { id: Date.now().toString(), name: '', issuer: '', date: '' }, 'certificates')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.certificates.length > 0 && (
          <div className="space-y-2">
            {data.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3">
                <input type="text" value={cert.name} onChange={(e) => update(data.certificates, cert.id, 'certificates', 'name', e.target.value)} placeholder={t('cvBuilder.sections.certificates')} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <button onClick={() => remove(data.certificates, cert.id, 'certificates')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{t('cvBuilder.sections.links')}</h3>
          <button onClick={() => add(data.links, { id: Date.now().toString(), type: 'website', url: '', label: '' }, 'links')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.links.length > 0 && (
          <div className="space-y-2">
            {data.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <input type="text" value={link.label} onChange={(e) => update(data.links, link.id, 'links', 'label', e.target.value)} placeholder={t('cvBuilder.sections.links')} className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="url" value={link.url} onChange={(e) => update(data.links, link.id, 'links', 'url', e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <button onClick={() => remove(data.links, link.id, 'links')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header med auto-save indikator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('cvBuilder.title')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <SaveIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadDemoData} className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cvBuilder.actions.exampleData')}</span>
          </button>
          <button onClick={() => setShowLinkedInImport(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm border border-[#0077B5] text-[#0077B5] rounded-lg hover:bg-[#0077B5]/5">
            <Linkedin className="w-4 h-4" /> {t('cvBuilder.actions.import')}
          </button>
          {/* Manuell spara-knapp - backup om auto-save misslyckas */}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 text-sm font-medium"
            title={t('cvBuilder.actions.saveManually')}
          >
            <Save className="w-4 h-4" />
            {saving ? t('cvBuilder.actions.saving') : t('cvBuilder.actions.saveNow')}
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1" />
          <CVShare onShare={async () => await cvApi.shareCV()} variant="compact" />
          <PDFExportButton 
            type="cv" 
            data={data}
            variant="outline"
            size="sm"
            showPreview={false}
          />
        </div>
      </div>
      
      {/* Progress Bar med CV Score */}
      <CVProgressBar 
        data={data} 
        currentStep={step} 
        onStepClick={setStep}
      />

      {/* Steg-indikator - ovanför allt */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <StepIndicator currentStep={step} totalSteps={STEPS.length} onStepClick={setStep} completedSteps={completedSteps} />
      </div>

      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-slate-100 rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <h2 className="font-semibold">{t('cvBuilder.actions.preview')}</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
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

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-medium">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t('cvBuilder.actions.previous')}</span>
            </button>
            <button onClick={() => setShowPreview(true)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium">
              <Eye className="w-4 h-4" /> {t('cvBuilder.actions.showCV')}
            </button>
            <button onClick={() => setStep(Math.min(STEPS.length, step + 1))} disabled={step === STEPS.length} className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 font-medium">
              <span className="hidden sm:inline">{t('cvBuilder.actions.next')}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Preview + Tools (desktop) */}
        <div className="hidden lg:block space-y-6">
          {/* Preview - Clean A4 look */}
          <div className="bg-slate-100 rounded-2xl p-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden max-h-[700px] overflow-y-auto">
              <CVPreview data={data} />
            </div>
          </div>

          {/* Contextual Knowledge - Fas 2 */}
          <ContextualKnowledgeWidget context="cv-building" variant="full" />

          {/* Help - Show onboarding again */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-2">{t('cvBuilder.help.title')}</h3>
            <p className="text-sm text-slate-500 mb-3">
              {t('cvBuilder.help.description')}
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              {t('cvBuilder.help.showGuide')}
            </button>
          </div>

          {/* AI Tools */}
          {step === 3 && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl shadow-sm border border-violet-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-violet-900">{t('cvBuilder.help.aiWriting')}</h3>
              </div>
              <p className="text-sm text-violet-700 mb-3">
                {t('cvBuilder.help.aiWritingDesc')}
              </p>
              <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" />
            </div>
          )}

          {/* Versions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">{t('cvBuilder.versions.title')}</h3>
            {showSaveVersion ? (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder={t('cvBuilder.versions.versionNamePlaceholder')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={saveVersion} className="flex-1 px-3 py-2 bg-[#4f46e5] text-white text-sm rounded-lg">{t('cvBuilder.versions.save')}</button>
                  <button onClick={() => setShowSaveVersion(false)} className="flex-1 px-3 py-2 border border-slate-300 text-sm rounded-lg">{t('cvBuilder.versions.cancel')}</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveVersion(true)}
                className="w-full mb-3 px-4 py-2 border border-[#4f46e5] text-[#4f46e5] rounded-lg text-sm hover:bg-[#4f46e5]/5"
              >
                {t('cvBuilder.versions.saveCurrentVersion')}
              </button>
            )}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">{t('cvBuilder.versions.noVersions')}</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}</p>
                    </div>
                    <button
                      onClick={() => restoreVersion(v.id)}
                      className="text-xs text-[#4f46e5] hover:bg-[#4f46e5]/10 px-2 py-1 rounded"
                    >
                      {t('cvBuilder.actions.restore')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DEBUG: CV Save Test */}
          <CVSaveTest />
        </div>
      </div>

      {/* LinkedIn Import */}
      {showLinkedInImport && (
        <LinkedInImport
          onImport={(d) => { setData({ ...data, ...d }); setShowLinkedInImport(false) }}
          onClose={() => setShowLinkedInImport(false)}
        />
      )}
      
      {/* Onboarding */}
      {showOnboarding && (
        <CVOnboarding 
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      {/* Mobile Preview FAB */}
      <MobilePreviewFAB data={data} />
    </div>
  )
}
