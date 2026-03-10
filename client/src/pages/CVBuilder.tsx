import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, X, Save, Check,
  Linkedin, Sparkles, Layout, Briefcase, GraduationCap, Award, Link2,
  Lightbulb, Target, Wand2
} from 'lucide-react'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { ATSAnalyzer } from '@/components/cv/ATSAnalyzer'
import { LinkedInImport } from '@/components/linkedin/LinkedInImport'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { CVShare } from '@/components/cv/CVShare'
import { CompactImageUpload } from '@/components/ImageUpload'
import { useVercelImageUpload } from '@/hooks/useVercelImageUpload'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { CVData, CVVersion } from '@/services/mockApi'

// NYA IMPORTS för förbättringar
import { useCVAutoSave, useCVDraft } from '@/hooks/useCVAutoSave'
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

// Mallar
const TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Clean & professionell', color: '#4f46e5' },
  { id: 'classic', name: 'Klassisk', desc: 'Traditionell', color: '#1e293b' },
  { id: 'creative', name: 'Kreativ', desc: 'Unik design', color: '#ec4899' },
  { id: 'minimal', name: 'Minimal', desc: 'Enkel & luftig', color: '#0f172a' },
  { id: 'tech', name: 'Tech', desc: 'För IT & utvecklare', color: '#0891b2' },
  { id: 'executive', name: 'Executive', desc: 'För ledare', color: '#1e3a5f' },
]

// Färger
const COLORS = [
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5' },
  { id: 'ocean', name: 'Blå', hex: '#0ea5e9' },
  { id: 'forest', name: 'Grön', hex: '#10b981' },
  { id: 'berry', name: 'Rosa', hex: '#ec4899' },
  { id: 'slate', name: 'Mörk', hex: '#1e293b' },
  { id: 'ruby', name: 'Röd', hex: '#ef4444' },
  { id: 'amber', name: 'Orange', hex: '#f59e0b' },
  { id: 'violet', name: 'Lila', hex: '#8b5cf6' },
]

// Typsnitt
const FONTS = [
  { id: 'inter', name: 'Inter', desc: 'Modern' },
  { id: 'georgia', name: 'Georgia', desc: 'Klassisk' },
  { id: 'playfair', name: 'Playfair', desc: 'Elegant' },
  { id: 'roboto', name: 'Roboto', desc: 'Clean' },
  { id: 'montserrat', name: 'Montserrat', desc: 'Modern' },
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
  const { saveStatus, lastSavedAt, hasUnsavedChanges } = useCVAutoSave(data)
  const { restoreDraft, clearDraft } = useCVDraft()
  const hasCheckedDraft = useRef(false)
  
  // Fråga om att återställa draft vid mount - efter att server data laddats
  useEffect(() => {
    // Visa onboarding om användaren inte sett den tidigare
    if (shouldShowOnboarding()) {
      setTimeout(() => setShowOnboarding(true), 500)
    }
  }, [])
  
  // Separat effect för draft restoration som körs efter data laddats
  useEffect(() => {
    // Vänta tills data har laddats från servern
    const checkAndRestoreDraft = async () => {
      // Bara kolla en gång per session
      if (hasCheckedDraft.current) return
      
      hasCheckedDraft.current = true
      
      // Ge tid för server-data att laddas
      await new Promise(r => setTimeout(r, 1000))
      
      const draft = restoreDraft()
      if (!draft) return
      
      // VIKTIGT: Vänta tills data är laddad från servern
      // Kolla om vi fortfarande har tomma default-värden = data ej laddad än
      const isDataLoaded = data.firstName !== undefined && 
        (Array.isArray(data.workExperience) || Array.isArray(data.education))
      
      if (!isDataLoaded) {
        // Data inte laddad än, återställ flaggan så vi kan försöka igen
        hasCheckedDraft.current = false
        return
      }
      
      // Jämför draft med nuvarande data - använd samma fält för båda
      const normalizeForCompare = (obj: any) => {
        const relevantFields = ['firstName', 'lastName', 'title', 'summary', 'workExperience', 'education', 'skills', 'email', 'phone', 'location']
        const normalized: any = {}
        for (const key of relevantFields) {
          const val = obj[key]
          // Normalisera: tom sträng === undefined === null
          if (val === undefined || val === null) {
            normalized[key] = ''
          } else if (Array.isArray(val)) {
            normalized[key] = val.length === 0 ? '' : JSON.stringify(val)
          } else {
            normalized[key] = String(val)
          }
        }
        return JSON.stringify(normalized)
      }
      
      const draftContent = normalizeForCompare(draft)
      const currentContent = normalizeForCompare(data)
      
      // Om draft är samma som nuvarande data, rensa det och fråga inte
      if (draftContent === currentContent) {
        clearDraft()
        return
      }
      
      // Fråga användaren
      if (confirm('Du har ett osparat utkast som är nyare än din sparade version. Vill du återställa det?')) {
        setData(prev => ({ ...prev, ...draft }))
      } else {
        // Om användaren inte vill återställa, rensa draftet
        clearDraft()
      }
    }
    
    checkAndRestoreDraft()
  }, [])

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
      const cv = await cvApi.getCV()
      if (cv) setData(prev => ({ ...prev, ...cv }))
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
      alert('Sparat!')
    } catch { alert('Kunde inte spara') }
    finally { setSaving(false) }
  }

  const saveVersion = async () => {
    if (!versionName.trim()) return
    try {
      await cvApi.saveVersion(versionName.trim(), data)
      await loadVersions()
      setVersionName('')
      setShowSaveVersion(false)
      alert('Version sparad!')
    } catch { alert('Kunde inte spara version') }
  }

  const restoreVersion = async (versionId: string) => {
    if (!confirm('Detta ersätter ditt nuvarande CV. Fortsätta?')) return
    try {
      const restored = await cvApi.restoreVersion(versionId)
      setData(prev => ({ ...prev, ...restored }))
      alert('Version återställd!')
    } catch { alert('Kunde inte återställa') }
  }

  const loadDemoData = () => {
    if (!confirm('Fylla i med exempeldata?')) return
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

  // STEG 1: DESIGN
  const renderStep1 = () => (
    <div className="space-y-6">

      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Välj mall</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const selected = data.template === t.id
            return (
              <button
                key={t.id}
                onClick={() => setData({ ...data, template: t.id })}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  selected ? "border-[#4f46e5] bg-[#eef2ff]" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selected ? t.color : '#f1f5f9', color: selected ? 'white' : '#64748b' }}
                >
                  <Layout className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{t.name}</h4>
                    {selected && <Check className="w-4 h-4 text-[#4f46e5]" />}
                  </div>
                  <p className="text-sm text-slate-500">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Färg</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {COLORS.map((c) => {
            const selected = data.colorScheme === c.id
            return (
              <button
                key={c.id}
                onClick={() => setData({ ...data, colorScheme: c.id })}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all",
                  selected ? "border-[#4f46e5] bg-[#eef2ff]" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-medium text-slate-700">{c.name}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Typsnitt</h3>
        <div className="space-y-2">
          {FONTS.map((f) => {
            const selected = data.font === f.id
            return (
              <button
                key={f.id}
                onClick={() => setData({ ...data, font: f.id })}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  selected ? "border-[#4f46e5] bg-[#eef2ff]" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800" style={{ fontFamily: f.id === 'playfair' || f.id === 'georgia' ? 'serif' : 'sans-serif' }}>
                    {f.name}
                  </h4>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
                {selected && <Check className="w-5 h-5 text-[#4f46e5]" />}
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )

  // STEG 2: OM DIG
  const renderStep2 = () => (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Profilbild</h3>
        <p className="text-sm text-slate-500 mb-4">
          Lägg till en professionell profilbild för att göra ditt CV mer personligt
        </p>
        <CompactImageUpload
          value={data.profileImage}
          onChange={(url) => setData({ ...data, profileImage: url })}
          onUpload={async (file) => {
            if (!user?.id) {
              alert('Du måste vara inloggad för att ladda upp bilder')
              return null
            }
            const result = await uploadImage(file)
            if (result.error) {
              alert('Uppladdning misslyckades: ' + result.error)
              return null
            }
            return result.url
          }}
        />
      </Card>
      
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Förnamn *" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} placeholder="Anna" />
          <Input label="Efternamn *" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} placeholder="Andersson" />
        </div>
      </Card>
      <Card>
        <Input label="Yrkestitel" value={data.title} onChange={(v) => setData({ ...data, title: v })} placeholder="Erfaren säljare" />
      </Card>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="E-post" type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="anna@email.se" />
          <Input label="Telefon" type="tel" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} placeholder="070-123 45 67" />
        </div>
      </Card>
      <Card>
        <Input label="Ort" value={data.location} onChange={(v) => setData({ ...data, location: v })} placeholder="Stockholm" />
      </Card>
    </div>
  )

  // STEG 3: PROFIL
  const renderStep3 = () => (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-2">Sammanfattning</h3>
        <p className="text-sm text-slate-500 mb-4">Beskriv din bakgrund och vad du söker</p>
        <RichTextEditor
          value={data.summary || ''}
          onChange={(v) => setData({ ...data, summary: v })}
          placeholder="Jag är en driven..."
          maxLength={1000}
          minHeight="150px"
          helpText="Tips: Använd aktiva verb och nämn vad som gör dig unik. 3-5 meningar är lagom."
        />
        <div className="mt-4">
          <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" />
        </div>
      </Card>
      
      <ContextualHelp context="summary" data={data.summary} />
      
      <AIHelpButton field="summary" onFill={() => setData({ ...data, summary: 'Erfaren [yrke] med [X] års erfarenhet inom [område]. Jag brinner för [intresse] och vill nu ta nästa steg i min karriär.' })} />
    </div>
  )

  // STEG 4: ERFARENHET
  const renderStep4 = () => (
    <div className="space-y-6">
      <ContextualHelp context="experience" />
      
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-500" />
          Arbetslivserfarenhet
        </h3>
        <ExperienceEditor
          experiences={data.workExperience || []}
          onChange={(experiences) => setData({ ...data, workExperience: experiences })}
        />
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-500" />
          Utbildning
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
          Kompetenser
        </h3>
        <SkillsEditor
          skills={data.skills || []}
          onChange={(skills) => setData({ ...data, skills })}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Språk</h3>
          <button onClick={() => add(data.languages, { id: Date.now().toString(), name: '', level: 'God' }, 'languages')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> Lägg till</button>
        </div>
        {data.languages.length > 0 && (
          <div className="space-y-2">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3">
                <input type="text" value={lang.name} onChange={(e) => update(data.languages, lang.id, 'languages', 'name', e.target.value)} placeholder="Språk" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={lang.level} onChange={(e) => update(data.languages, lang.id, 'languages', 'level', e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32">
                  <option value="Grundläggande">Grundläggande</option>
                  <option value="God">God</option>
                  <option value="Flytande">Flytande</option>
                  <option value="Modersmål">Modersmål</option>
                </select>
                <button onClick={() => remove(data.languages, lang.id, 'languages')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Certifikat</h3>
          <button onClick={() => add(data.certificates, { id: Date.now().toString(), name: '', issuer: '', date: '' }, 'certificates')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> Lägg till</button>
        </div>
        {data.certificates.length > 0 && (
          <div className="space-y-2">
            {data.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3">
                <input type="text" value={cert.name} onChange={(e) => update(data.certificates, cert.id, 'certificates', 'name', e.target.value)} placeholder="Certifikatnamn" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <button onClick={() => remove(data.certificates, cert.id, 'certificates')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Länkar</h3>
          <button onClick={() => add(data.links, { id: Date.now().toString(), type: 'website', url: '', label: '' }, 'links')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"><Plus className="w-4 h-4" /> Lägg till</button>
        </div>
        {data.links.length > 0 && (
          <div className="space-y-2">
            {data.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <input type="text" value={link.label} onChange={(e) => update(data.links, link.id, 'links', 'label', e.target.value)} placeholder="Titel" className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Skapa CV</h1>
          <div className="flex items-center gap-2 mt-1">
            <SaveIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadDemoData} className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Exempeldata</span>
          </button>
          <button onClick={() => setShowLinkedInImport(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm border border-[#0077B5] text-[#0077B5] rounded-lg hover:bg-[#0077B5]/5">
            <Linkedin className="w-4 h-4" /> Importera
          </button>
          {/* Manuell spara-knapp - backup om auto-save misslyckas */}
          <button 
            onClick={save} 
            disabled={saving} 
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 text-sm font-medium"
            title="Spara manuellt (auto-save är aktivt)"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sparar...' : 'Spara nu'}
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1" />
          <CVShare onShare={async () => await cvApi.shareCV()} variant="compact" />
          <PDFExportButton 
            type="cv" 
            data={{
              personalInfo: { 
                firstName: data.firstName, 
                lastName: data.lastName, 
                email: data.email, 
                phone: data.phone, 
                city: data.location,
                address: '',
                linkedIn: data.links?.find((l: any) => l.type === 'linkedin')?.url || '',
                portfolio: data.links?.find((l: any) => l.type === 'portfolio')?.url || ''
              },
              summary: data.summary,
              experience: data.workExperience.map(w => ({ 
                title: w.title, 
                company: w.company, 
                location: w.location || '', 
                startDate: w.startDate, 
                endDate: w.endDate || '', 
                current: w.current || false, 
                description: w.description || '' 
              })),
              education: data.education.map(e => ({ 
                degree: e.degree, 
                school: e.school, 
                location: e.location || '', 
                startDate: e.startDate, 
                endDate: e.endDate || '', 
                description: e.description || '' 
              })),
              skills: data.skills.map((s: any) => s.name || s),
              languages: data.languages.map((l: any) => ({ language: l.name || l.language, level: l.level })),
              certifications: data.certificates.map((c: any) => ({ 
                name: c.name, 
                issuer: c.issuer || '', 
                date: c.date || '' 
              })),
            }} 
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
              <h2 className="font-semibold">Förhandsvisning</h2>
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
              <span className="hidden sm:inline">Föregående</span>
            </button>
            <button onClick={() => setShowPreview(true)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium">
              <Eye className="w-4 h-4" /> Visa CV
            </button>
            <button onClick={() => setStep(Math.min(STEPS.length, step + 1))} disabled={step === STEPS.length} className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 font-medium">
              <span className="hidden sm:inline">Nästa</span>
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
            <h3 className="font-semibold text-slate-800 mb-2">Behöver du hjälp?</h3>
            <p className="text-sm text-slate-500 mb-3">
              Se guiden igen för tips om hur du skapar ett bra CV.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Visa guide igen
            </button>
          </div>

          {/* AI Tools */}
          {step === 3 && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl shadow-sm border border-violet-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-violet-900">AI-skrivhjälp</h3>
              </div>
              <p className="text-sm text-violet-700 mb-3">
                Få hjälp att förbättra din sammanfattning
              </p>
              <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" />
            </div>
          )}

          {/* ATS Analys */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800">ATS-analys</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Se hur väl ditt CV klarar automatisk screening
            </p>
            <ATSAnalyzer cvData={data} />
          </div>

          {/* Versions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Versioner</h3>
            {showSaveVersion ? (
              <div className="space-y-2 mb-3">
                <input 
                  type="text" 
                  value={versionName} 
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="Namn på version..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={saveVersion} className="flex-1 px-3 py-2 bg-[#4f46e5] text-white text-sm rounded-lg">Spara</button>
                  <button onClick={() => setShowSaveVersion(false)} className="flex-1 px-3 py-2 border border-slate-300 text-sm rounded-lg">Avbryt</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowSaveVersion(true)}
                className="w-full mb-3 px-4 py-2 border border-[#4f46e5] text-[#4f46e5] rounded-lg text-sm hover:bg-[#4f46e5]/5"
              >
                + Spara nuvarande version
              </button>
            )}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">Inga sparade versioner</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                    <button 
                      onClick={() => restoreVersion(v.id)}
                      className="text-xs text-[#4f46e5] hover:bg-[#4f46e5]/10 px-2 py-1 rounded"
                    >
                      Återställ
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
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
