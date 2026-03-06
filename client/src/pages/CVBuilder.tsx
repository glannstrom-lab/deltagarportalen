import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Eye, EyeOff, 
  Linkedin, Menu, X, Wand2, FileText, Download, Share2, 
  CheckCircle2, Sparkles, ChevronDown, LayoutTemplate
} from 'lucide-react'
import { CVTemplateSelector, templates, type Template } from '@/components/cv/CVTemplateSelector'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { JobMatcher } from '@/components/cv/JobMatcher'
import { ATSAnalyzer } from '@/components/cv/ATSAnalyzer'
import { PhraseBank } from '@/components/cv/PhraseBank'
import { CVExport } from '@/components/cv/CVExport'
import { SpellChecker } from '@/components/cv/SpellChecker'
import { JobAdAnalyzer } from '@/components/cv/JobAdAnalyzer'
import { CVShare } from '@/components/cv/CVShare'
import { CVOnboarding } from '@/components/cv/CVOnboarding'
import SkillSuggestions from '@/components/cv/SkillSuggestions'
import { LinkedInImport } from '@/components/linkedin/LinkedInImport'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { cn } from '@/lib/utils'
import type { 
  CVData, WorkExperience, Education, Language, 
  Certificate, Link, Reference, Skill, CVVersion 
} from '@/services/mockApi'

// ============================================
// STEG-KONFIGURATION
// ============================================
const STEPS = [
  { number: 1, title: 'Välj mall', description: 'Design och layout', icon: LayoutTemplate },
  { number: 2, title: 'Personlig info', description: 'Dina kontaktuppgifter', icon: FileText },
  { number: 3, title: 'Sammanfattning', description: 'Berätta om dig själv', icon: Sparkles },
  { number: 4, title: 'Erfarenhet', description: 'Dina tidigare jobb', icon: BriefcaseIcon },
  { number: 5, title: 'Utbildning', description: 'Skola och kurser', icon: GraduationCapIcon },
  { number: 6, title: 'Kompetenser', description: 'Dina färdigheter', icon: StarIcon },
  { number: 7, title: 'Språk', description: 'Språkkunskaper', icon: LanguagesIcon },
  { number: 8, title: 'Certifikat', description: 'Intyg och certifikat', icon: AwardIcon },
  { number: 9, title: 'Länkar', description: 'Portfolio mm.', icon: LinkIcon },
  { number: 10, title: 'Referenser', description: 'Kontaktpersoner', icon: UsersIcon },
] as const

// Ikon-komponenter (enkla SVG-ikoner)
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}
function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  )
}
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function LanguagesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6"/>
      <path d="m4 14 6-6 2-3"/>
      <path d="M2 5h12"/>
      <path d="M7 2h1"/>
      <path d="m22 22-5-10-5 10"/>
      <path d="M14 18h6"/>
    </svg>
  )
}
function AwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  )
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

// ============================================
// VERKTYGSPANEL-KOMPONENT
// ============================================
interface ToolsPanelProps {
  formData: CVData
  setFormData: (data: CVData) => void
  onShare: () => Promise<{shareUrl: string; publicId: string}>
}

function ToolsPanel({ formData, setFormData, onShare }: ToolsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const tools = [
    { id: 'ai', title: 'AI-skrivhjälp', icon: Wand2, component: AIWritingAssistant, props: { content: formData.summary, onChange: (content: string) => setFormData({ ...formData, summary: content }), type: 'summary' as const } },
    { id: 'matcher', title: 'Jobbmatchning', icon: CheckCircle2, component: JobMatcher, props: { cvData: formData } },
    { id: 'ats', title: 'ATS-analys', icon: FileText, component: ATSAnalyzer, props: { cvData: formData } },
    { id: 'phrase', title: 'Frasbank', icon: Sparkles, component: PhraseBank, props: {} },
    { id: 'export', title: 'Exportera', icon: Download, component: CVExport, props: { cvData: formData } },
    { id: 'spell', title: 'Stavningskontroll', icon: FileText, component: SpellChecker, props: { content: formData.summary } },
    { id: 'jobad', title: 'Analysera annons', icon: FileText, component: JobAdAnalyzer, props: {} },
    { id: 'share', title: 'Dela CV', icon: Share2, component: CVShare, props: { onShare } },
  ]

  const ActiveComponent = activeTool ? tools.find(t => t.id === activeTool)?.component : null
  const activeProps = activeTool ? tools.find(t => t.id === activeTool)?.props : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header - alltid synlig */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4f46e5]/10 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-[#4f46e5]" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">AI & Verktyg</h3>
            <p className="text-xs text-slate-500">Få hjälp med ditt CV</p>
          </div>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Expanderat innehåll */}
      {isOpen && (
        <div className="border-t border-slate-100">
          {/* Verktygsknapprad */}
          {!activeTool && (
            <div className="p-4 grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-[#4f46e5]/30 hover:bg-[#4f46e5]/5 transition-colors text-left"
                >
                  <tool.icon className="w-4 h-4 text-[#4f46e5] flex-shrink-0" />
                  <span className="text-sm text-slate-700">{tool.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Aktivt verktyg */}
          {activeTool && ActiveComponent && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-800">
                  {tools.find(t => t.id === activeTool)?.title}
                </h4>
                <button
                  onClick={() => setActiveTool(null)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Tillbaka
                </button>
              </div>
              <ActiveComponent {...activeProps as any} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// STEG-SIDEBAR (Desktop)
// ============================================
interface StepSidebarProps {
  currentStep: number
  onStepClick: (step: number) => void
  completedSteps: number[]
}

function StepSidebar({ currentStep, onStepClick, completedSteps }: StepSidebarProps) {
  return (
    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-800 mb-4 px-2">Ditt CV</h3>
      <nav className="space-y-1">
        {STEPS.map((s) => {
          const Icon = s.icon
          const isActive = currentStep === s.number
          const isCompleted = completedSteps.includes(s.number)
          
          return (
            <button
              key={s.number}
              onClick={() => onStepClick(s.number)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left',
                isActive 
                  ? 'bg-[#4f46e5] text-white' 
                  : isCompleted
                    ? 'text-slate-700 hover:bg-slate-50'
                    : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isActive 
                  ? 'bg-white/20' 
                  : isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100'
              )}>
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'font-medium text-sm truncate',
                  isActive ? 'text-white' : 'text-slate-800'
                )}>
                  {s.number}. {s.title}
                </p>
                <p className={cn(
                  'text-xs truncate',
                  isActive ? 'text-white/70' : 'text-slate-500'
                )}>
                  {s.description}
                </p>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ============================================
// MOBIL STEG-INDIKATOR
// ============================================
interface MobileStepIndicatorProps {
  currentStep: number
  totalSteps: number
}

function MobileStepIndicator({ currentStep, totalSteps }: MobileStepIndicatorProps) {
  return (
    <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i < currentStep ? 'bg-[#4f46e5]' : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      
      {/* Nuvarande steg info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4f46e5] rounded-xl flex items-center justify-center text-white font-semibold">
          {currentStep}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{STEPS[currentStep - 1]?.title}</p>
          <p className="text-sm text-slate-500">{STEPS[currentStep - 1]?.description}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VERSIONSHISTORIK (Förenklad)
// ============================================
interface CVVersionHistoryProps {
  versions: CVVersion[]
  onSaveVersion: (name: string) => void
  onRestoreVersion: (versionId: string) => void
}

function CVVersionHistory({ versions, onSaveVersion, onRestoreVersion }: CVVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [versionName, setVersionName] = useState('')

  const handleSave = () => {
    if (versionName?.trim()) {
      onSaveVersion(versionName.trim())
      setVersionName('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">Versioner</h3>
            <p className="text-xs text-slate-500">{versions.length} sparade versioner</p>
          </div>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-4">
          {showSaveDialog ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Namn på version..."
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
                >
                  Spara
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full mb-3 px-4 py-2 border border-[#4f46e5] text-[#4f46e5] rounded-lg text-sm hover:bg-[#4f46e5]/5 transition-colors"
              >
                + Spara nuvarande version
              </button>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {versions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Inga sparade versioner ännu</p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{version.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(version.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <button
                        onClick={() => onRestoreVersion(version.id)}
                        className="px-3 py-1.5 text-xs text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                      >
                        Återställ
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// HUVUDKOMPONENT
// ============================================
export default function CVBuilder() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showLinkedInImport, setShowLinkedInImport] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedTemplate, _setSelectedTemplate] = useState<Template>(templates[0])
  const [versions, setVersions] = useState<CVVersion[]>([])
  
  const [formData, setFormData] = useState<CVData>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    workExperience: [],
    education: [],
    languages: [],
    certificates: [],
    links: [],
    references: [],
    template: 'modern',
    colorScheme: 'indigo',
    font: 'inter',
  })

  // Ladda CV vid start
  useEffect(() => {
    loadCV()
    loadVersions()
    const hasSeenOnboarding = localStorage.getItem('cv-onboarding-completed')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  // Uppdatera completed steps när data ändras
  useEffect(() => {
    const completed: number[] = []
    if (formData.template) completed.push(1)
    if (formData.firstName || formData.lastName) completed.push(2)
    if (formData.summary) completed.push(3)
    if (formData.workExperience.length > 0) completed.push(4)
    if (formData.education.length > 0) completed.push(5)
    if (formData.skills.length > 0) completed.push(6)
    if (formData.languages.length > 0) completed.push(7)
    if (formData.certificates.length > 0) completed.push(8)
    if (formData.links.length > 0) completed.push(9)
    if (formData.references.length > 0) completed.push(10)
    setCompletedSteps(completed)
  }, [formData])

  const loadCV = async () => {
    try {
      const cv = await cvApi.getCV()
      if (!cv) return
      
      setFormData({
        firstName: cv.firstName || cv.user?.firstName || '',
        lastName: cv.lastName || cv.user?.lastName || '',
        title: cv.title || '',
        email: cv.email || cv.user?.email || '',
        phone: cv.phone || '',
        location: cv.location || '',
        summary: cv.summary || '',
        skills: cv.skills || [],
        workExperience: cv.workExperience || [],
        education: cv.education || [],
        languages: cv.languages || [],
        certificates: cv.certificates || [],
        links: cv.links || [],
        references: cv.references || [],
        template: cv.template || 'modern',
        colorScheme: cv.colorScheme || 'indigo',
        font: cv.font || 'inter',
      })
      
      const template = templates.find(t => t.id === cv.template) || templates[0]
      _setSelectedTemplate(template)
    } catch (error) {
      console.error('Fel vid laddning av CV:', error)
    }
  }

  const loadVersions = async () => {
    try {
      const loadedVersions = await cvApi.getVersions()
      setVersions(loadedVersions || [])
    } catch (error) {
      console.error('Fel vid laddning av versioner:', error)
    }
  }

  const saveCV = async () => {
    setSaving(true)
    try {
      await cvApi.updateCV({
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        summary: formData.summary,
        skills: formData.skills,
        workExperience: formData.workExperience,
        education: formData.education,
        languages: formData.languages,
        certificates: formData.certificates,
        links: formData.links,
        references: formData.references,
        template: formData.template,
        colorScheme: formData.colorScheme,
        font: formData.font,
      })
      alert('CV sparat!')
    } catch (error) {
      console.error('Fel vid sparande:', error)
      alert('Kunde inte spara CV')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveVersion = async (name: string) => {
    try {
      await cvApi.saveVersion(name, formData)
      await loadVersions()
      alert('Version sparad!')
    } catch (error) {
      console.error('Fel vid sparande av version:', error)
      alert('Kunde inte spara version')
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Detta kommer att ersätta ditt nuvarande CV. Vill du fortsätta?')) return
    try {
      const restoredCV = await cvApi.restoreVersion(versionId)
      setFormData({ ...formData, ...restoredCV })
      alert('Version återställd!')
    } catch (error) {
      console.error('Fel vid återställning:', error)
      alert('Kunde inte återställa version')
    }
  }

  const handleShare = async () => {
    return await cvApi.shareCV()
  }

  const loadDemoData = () => {
    if (!confirm('Detta kommer att fylla i ditt CV med exempeldata. Vill du fortsätta?')) return
    
    setFormData({
      ...formData,
      firstName: 'Anna',
      lastName: 'Andersson',
      title: 'Projektledare',
      email: 'anna.andersson@example.com',
      phone: '+46 70 123 45 67',
      location: 'Stockholm',
      summary: 'Erfaren projektledare med över 5 års erfarenhet av att leda utvecklingsteam inom IT-sektorn. Stark kommunikativ förmåga och vana att hantera komplexa projekt från start till mål.',
      skills: [
        { id: '1', name: 'Projektledning', level: 5, category: 'technical' },
        { id: '2', name: 'Agil utveckling', level: 4, category: 'technical' },
        { id: '3', name: 'Kommunikation', level: 5, category: 'soft' },
      ],
      workExperience: [
        {
          id: '1',
          company: 'Tech Solutions AB',
          title: 'Projektledare',
          location: 'Stockholm',
          startDate: '2021-03',
          endDate: '',
          current: true,
          description: 'Leder ett team på 8 utvecklare i utvecklingen av en ny e-handelsplattform.',
        },
      ],
      education: [
        {
          id: '1',
          school: 'Stockholms Universitet',
          degree: 'Kandidatexamen',
          field: 'Informatik',
          location: 'Stockholm',
          startDate: '2016-08',
          endDate: '2019-05',
          description: 'Fokus på projektledning och systemutveckling.',
        },
      ],
      languages: [
        { id: '1', name: 'Svenska', level: 'native' },
        { id: '2', name: 'Engelska', level: 'fluent' },
      ],
    })
  }

  // Hjälpfunktioner
  const addItem = <T extends { id: string }>(
    array: T[],
    newItem: T,
    field: keyof CVData
  ) => {
    setFormData({ ...formData, [field]: [...array, newItem] } as CVData)
  }

  const removeItem = <T extends { id: string }>(
    array: T[],
    id: string,
    field: keyof CVData
  ) => {
    setFormData({ ...formData, [field]: array.filter(item => item.id !== id) } as CVData)
  }

  const updateItem = <T extends { id: string }>(
    array: T[],
    id: string,
    field: keyof CVData,
    key: keyof T,
    value: any
  ) => {
    setFormData({
      ...formData,
      [field]: array.map(item => item.id === id ? { ...item, [key]: value } : item)
    } as CVData)
  }

  // Rendera steg-innehåll
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <CVTemplateSelector
              selectedTemplate={formData.template}
              selectedColorScheme={formData.colorScheme}
              selectedFont={formData.font}
              onSelect={(id) => {
                setFormData({ ...formData, template: id })
                _setSelectedTemplate(templates.find(t => t.id === id) || templates[0])
              }}
              onSelectColorScheme={(scheme) => setFormData({ ...formData, colorScheme: scheme })}
              onSelectFont={(font) => setFormData({ ...formData, font })}
              showAdvanced={true}
            />
          </div>
        )

      case 2:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">Personlig information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Förnamn</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                  placeholder="Förnamn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                  placeholder="Efternamn"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yrkestitel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                placeholder="t.ex. Erfaren säljare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                placeholder="din@email.se"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                  placeholder="+46 70 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                  placeholder="Stockholm"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">Sammanfattning</h3>
            <p className="text-sm text-slate-600">
              Skriv en kort presentation av dig själv. Detta är det första arbetsgivaren läser.
            </p>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
              placeholder="Beskriv din bakgrund, erfarenhet och vad du söker..."
            />
            <AIWritingAssistant
              content={formData.summary}
              onChange={(content) => setFormData({ ...formData, summary: content })}
              type="summary"
            />
          </div>
        )

      case 4:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Arbetslivserfarenhet</h3>
              <button
                onClick={() => addItem(formData.workExperience, {
                  id: Date.now().toString(),
                  company: '',
                  title: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                  description: '',
                }, 'workExperience')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.workExperience.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <BriefcaseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">Inga arbetserfarenheter tillagda ännu</p>
                <button
                  onClick={() => addItem(formData.workExperience, {
                    id: Date.now().toString(),
                    company: '',
                    title: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: '',
                  }, 'workExperience')}
                  className="text-[#4f46e5] font-medium hover:underline"
                >
                  Lägg till din första erfarenhet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.workExperience.map((exp, index) => (
                  <div key={exp.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Erfarenhet {index + 1}</span>
                      <button
                        onClick={() => removeItem(formData.workExperience, exp.id, 'workExperience')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Företag</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Företagsnamn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Jobbtitel"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Beskrivning</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        placeholder="Beskriv dina arbetsuppgifter och ansvar..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Utbildning</h3>
              <button
                onClick={() => addItem(formData.education, {
                  id: Date.now().toString(),
                  school: '',
                  degree: '',
                  field: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  description: '',
                }, 'education')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.education.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <GraduationCapIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">Inga utbildningar tillagda ännu</p>
                <button
                  onClick={() => addItem(formData.education, {
                    id: Date.now().toString(),
                    school: '',
                    degree: '',
                    field: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                  }, 'education')}
                  className="text-[#4f46e5] font-medium hover:underline"
                >
                  Lägg till din första utbildning
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div key={edu.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Utbildning {index + 1}</span>
                      <button
                        onClick={() => removeItem(formData.education, edu.id, 'education')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Skola/Universitet</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateItem(formData.education, edu.id, 'education', 'school', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Skolans namn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Examen</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateItem(formData.education, edu.id, 'education', 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="t.ex. Kandidatexamen"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Ämne/Inriktning</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateItem(formData.education, edu.id, 'education', 'field', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        placeholder="t.ex. Datavetenskap"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Kompetenser</h3>
              <button
                onClick={() => addItem(formData.skills, {
                  id: Date.now().toString(),
                  name: '',
                  level: 3,
                  category: 'technical',
                }, 'skills')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            <SkillSuggestions
              currentSkills={formData.skills}
              onAddSkill={(skill) => setFormData({ ...formData, skills: [...formData.skills, skill] })}
            />
            
            {formData.skills.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <StarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">Inga kompetenser tillagda ännu</p>
                <button
                  onClick={() => addItem(formData.skills, {
                    id: Date.now().toString(),
                    name: '',
                    level: 3,
                    category: 'technical',
                  }, 'skills')}
                  className="text-[#4f46e5] font-medium hover:underline"
                >
                  Lägg till din första kompetens
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => updateItem(formData.skills, skill.id, 'skills', 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border-0 text-sm focus:outline-none"
                      placeholder="Färdighet"
                    />
                    <select
                      value={skill.level}
                      onChange={(e) => updateItem(formData.skills, skill.id, 'skills', 'level', parseInt(e.target.value))}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                    <button
                      onClick={() => removeItem(formData.skills, skill.id, 'skills')}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 7:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Språk</h3>
              <button
                onClick={() => addItem(formData.languages, {
                  id: Date.now().toString(),
                  name: '',
                  level: 'Medel',
                }, 'languages')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.languages.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <LanguagesIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">Inga språk tillagda ännu</p>
                <button
                  onClick={() => addItem(formData.languages, {
                    id: Date.now().toString(),
                    name: '',
                    level: 'Medel',
                  }, 'languages')}
                  className="text-[#4f46e5] font-medium hover:underline"
                >
                  Lägg till språk
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.languages.map((lang) => (
                  <div key={lang.id} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3">
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => updateItem(formData.languages, lang.id, 'languages', 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="Språk"
                    />
                    <select
                      value={lang.level}
                      onChange={(e) => updateItem(formData.languages, lang.id, 'languages', 'level', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="Grundläggande">Grundläggande</option>
                      <option value="God">God</option>
                      <option value="Flytande">Flytande</option>
                      <option value="Modersmål">Modersmål</option>
                    </select>
                    <button
                      onClick={() => removeItem(formData.languages, lang.id, 'languages')}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 8:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Certifikat</h3>
              <button
                onClick={() => addItem(formData.certificates, {
                  id: Date.now().toString(),
                  name: '',
                  issuer: '',
                  date: '',
                }, 'certificates')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.certificates.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <AwardIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Inga certifikat tillagda ännu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.certificates.map((cert, index) => (
                  <div key={cert.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Certifikat {index + 1}</span>
                      <button
                        onClick={() => removeItem(formData.certificates, cert.id, 'certificates')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Namn</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateItem(formData.certificates, cert.id, 'certificates', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        placeholder="t.ex. PMP Certification"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Utfärdare</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateItem(formData.certificates, cert.id, 'certificates', 'issuer', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="t.ex. PMI"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Datum</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) => updateItem(formData.certificates, cert.id, 'certificates', 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="t.ex. 2023"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 9:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Länkar</h3>
              <button
                onClick={() => addItem(formData.links, {
                  id: Date.now().toString(),
                  type: 'website',
                  url: '',
                  label: '',
                }, 'links')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.links.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <LinkIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Inga länkar tillagda ännu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.links.map((link) => (
                  <div key={link.id} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateItem(formData.links, link.id, 'links', 'label', e.target.value)}
                      className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="Titel"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateItem(formData.links, link.id, 'links', 'url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="https://..."
                    />
                    <button
                      onClick={() => removeItem(formData.links, link.id, 'links')}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 10:
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-lg">Referenser</h3>
              <button
                onClick={() => addItem(formData.references, {
                  id: Date.now().toString(),
                  name: '',
                  title: '',
                  company: '',
                }, 'references')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
              >
                <Plus size={18} />
                Lägg till
              </button>
            </div>
            
            {formData.references.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Inga referenser tillagda ännu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.references.map((ref, index) => (
                  <div key={ref.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Referens {index + 1}</span>
                      <button
                        onClick={() => removeItem(formData.references, ref.id, 'references')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Namn</label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateItem(formData.references, ref.id, 'references', 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Namn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                        <input
                          type="text"
                          value={ref.title}
                          onChange={(e) => updateItem(formData.references, ref.id, 'references', 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                          placeholder="Titel"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Företag</label>
                      <input
                        type="text"
                        value={ref.company}
                        onChange={(e) => updateItem(formData.references, ref.id, 'references', 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        placeholder="Företag"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Onboarding */}
      {showOnboarding && (
        <CVOnboarding
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Header - förenklad */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Bygg ditt CV</h1>
            <p className="text-slate-600 mt-1">
              Steg {step} av {STEPS.length}: {STEPS[step - 1]?.title}
            </p>
          </div>
          
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={loadDemoData}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Demo-data
            </button>
            <button
              onClick={() => setShowLinkedInImport(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-[#0077B5] text-[#0077B5] rounded-lg hover:bg-[#0077B5]/5"
            >
              <Linkedin size={16} />
              Importera
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Eye size={16} />
              Förhandsvisning
            </button>
            <PDFExportButton
              type="cv"
              data={{
                personalInfo: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  city: formData.location,
                },
                summary: formData.summary,
                experience: formData.workExperience.map(w => ({
                  title: w.title,
                  company: w.company,
                  location: w.location,
                  startDate: w.startDate,
                  endDate: w.endDate,
                  current: w.current,
                  description: w.description,
                })),
                education: formData.education.map(e => ({
                  degree: e.degree,
                  school: e.school,
                  location: e.location,
                  startDate: e.startDate,
                  endDate: e.endDate,
                  description: e.description,
                })),
                skills: formData.skills.map(s => s.name),
                languages: formData.languages.map(l => ({
                  language: l.name,
                  level: l.level,
                })),
                certifications: formData.certificates.map(c => ({
                  name: c.name,
                  issuer: c.issuer,
                  date: c.date,
                })),
              }}
              variant="outline"
              size="md"
            />
            <button
              onClick={saveCV}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50"
            >
              {saving ? 'Sparar...' : 'Spara CV'}
            </button>
          </div>

          {/* Mobil meny-knapp */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white"
            >
              <Menu size={20} />
              Meny
            </button>
            
            {showMobileMenu && (
              <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-3 space-y-2">
                <button
                  onClick={() => { loadDemoData(); setShowMobileMenu(false) }}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Demo-data
                </button>
                <button
                  onClick={() => { setShowLinkedInImport(true); setShowMobileMenu(false) }}
                  className="w-full px-4 py-3 text-left text-[#0077B5] hover:bg-slate-50 rounded-lg"
                >
                  Importera LinkedIn
                </button>
                <button
                  onClick={() => { setShowPreview(true); setShowMobileMenu(false) }}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Förhandsvisning
                </button>
                <button
                  onClick={() => { saveCV(); setShowMobileMenu(false) }}
                  disabled={saving}
                  className="w-full px-4 py-3 text-left text-[#4f46e5] font-medium hover:bg-slate-50 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Sparar...' : 'Spara CV'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil förhandsvisning overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Förhandsvisning</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4 overflow-auto h-[calc(100vh-80px)]">
            <CVPreview data={formData} />
          </div>
        </div>
      )}

      {/* Huvudlayout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vänster sidebar - Steg (desktop only) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            <StepSidebar
              currentStep={step}
              onStepClick={setStep}
              completedSteps={completedSteps}
            />
            
            <CVVersionHistory
              versions={versions}
              onSaveVersion={handleSaveVersion}
              onRestoreVersion={handleRestoreVersion}
            />
          </div>
        </div>

        {/* Mitt - Huvudinnehåll */}
        <div className="lg:col-span-6 space-y-4">
          {/* Mobil steg-indikator */}
          <MobileStepIndicator currentStep={step} totalSteps={STEPS.length} />
          
          {/* Steg-innehåll */}
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              <ChevronLeft size={20} />
              Föregående
            </button>
            
            <div className="hidden sm:flex items-center gap-1 text-sm text-slate-500">
              <span className="font-medium text-slate-800">{step}</span>
              <span>/</span>
              <span>{STEPS.length}</span>
            </div>
            
            <button
              onClick={() => setStep(Math.min(STEPS.length, step + 1))}
              disabled={step === STEPS.length}
              className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              Nästa
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Höger sidebar - Verktyg & Preview (desktop) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            {/* Preview card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Förhandsvisning</h3>
              </div>
              <div 
                ref={previewRef}
                className="p-4 overflow-auto max-h-[400px] bg-slate-50"
              >
                <CVPreview data={formData} />
              </div>
            </div>
            
            {/* Tools panel */}
            <ToolsPanel
              formData={formData}
              setFormData={setFormData}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      {/* LinkedIn Import Modal */}
      {showLinkedInImport && (
        <LinkedInImport
          onImport={(data) => {
            setFormData({ ...formData, ...data })
            setShowLinkedInImport(false)
          }}
          onClose={() => setShowLinkedInImport(false)}
        />
      )}
    </div>
  )
}
