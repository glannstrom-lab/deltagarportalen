import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff, 
  Linkedin, Menu, X, LayoutTemplate, User, Sparkles, 
  Briefcase, GraduationCap, Languages, Award, Link2, Users,
  Check, Palette, Type, Save, Download
} from 'lucide-react'
import { CVTemplateSelector, templates, type Template } from '@/components/cv/CVTemplateSelector'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { LinkedInImport } from '@/components/linkedin/LinkedInImport'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { cn } from '@/lib/utils'
import type { 
  CVData, WorkExperience, Education, Language, 
  Certificate, Link, Reference, Skill
} from '@/services/mockApi'

// ============================================
// FÖRENKLADE STEG (5 istället för 10)
// ============================================
const STEPS = [
  { 
    id: 1, 
    title: 'Mall',
    description: 'Välj design',
    icon: Palette,
    fields: ['template', 'colorScheme', 'font']
  },
  { 
    id: 2, 
    title: 'Personuppgifter',
    description: 'Namn & kontakt',
    icon: User,
    fields: ['firstName', 'lastName', 'title', 'email', 'phone', 'location']
  },
  { 
    id: 3, 
    title: 'Profil',
    description: 'Sammanfattning',
    icon: Sparkles,
    fields: ['summary', 'skills']
  },
  { 
    id: 4, 
    title: 'Erfarenhet',
    description: 'Jobb & utbildning',
    icon: Briefcase,
    fields: ['workExperience', 'education']
  },
  { 
    id: 5, 
    title: 'Övrigt',
    description: 'Språk & mer',
    icon: Languages,
    fields: ['languages', 'certificates', 'links', 'references']
  },
] as const

type StepId = typeof STEPS[number]['id']

// ============================================
// HJÄLPKOMPONENTER
// ============================================

function StepIndicator({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  stepData
}: { 
  currentStep: number
  totalSteps: number
  onStepClick: (step: number) => void
  stepData: Record<number, boolean>
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepData[stepNum]
        
        return (
          <button
            key={stepNum}
            onClick={() => onStepClick(stepNum)}
            className={cn(
              "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all",
              isActive 
                ? "bg-[#4f46e5] w-6 sm:w-8" 
                : isCompleted 
                  ? "bg-[#4f46e5]/60"
                  : "bg-slate-300"
            )}
            aria-label={`Steg ${stepNum}`}
          />
        )
      })}
    </div>
  )
}

function MobileStepHeader({ 
  step, 
  totalSteps 
}: { 
  step: typeof STEPS[number]
  totalSteps: number 
}) {
  const Icon = step.icon
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-[#4f46e5]/10 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#4f46e5]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#4f46e5]">Steg {step.id} av {totalSteps}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 truncate">{step.title}</h2>
        <p className="text-sm text-slate-500">{step.description}</p>
      </div>
    </div>
  )
}

function DesktopStepSidebar({ 
  currentStep, 
  onStepClick,
  stepData
}: { 
  currentStep: number
  onStepClick: (step: number) => void
  stepData: Record<number, boolean>
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-4">
      <h3 className="font-semibold text-slate-800 mb-4 px-2">Ditt CV</h3>
      <nav className="space-y-1">
        {STEPS.map((step) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = stepData[step.id]
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
                isActive 
                  ? "bg-[#4f46e5] text-white shadow-md" 
                  : isCompleted
                    ? "text-slate-700 hover:bg-slate-50"
                    : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold",
                isActive 
                  ? "bg-white/20" 
                  : isCompleted
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100"
              )}>
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isActive ? "text-white" : "text-slate-800"
                )}>
                  {step.title}
                </p>
                <p className={cn(
                  "text-xs truncate",
                  isActive ? "text-white/70" : "text-slate-500"
                )}>
                  {step.description}
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
// FORMULÄRKOMPONENTER
// ============================================

function Input({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder,
  required
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent text-base bg-white"
      />
    </div>
  )
}

function TextArea({ 
  label, 
  value, 
  onChange, 
  placeholder,
  rows = 4
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent text-base bg-white resize-none"
      />
    </div>
  )
}

function SectionCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6",
      className
    )}>
      {children}
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
  const [showLinkedInImport, setShowLinkedInImport] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
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

  // Beräkna vilka steg som är klara
  const stepData = {
    1: true, // Mall alltid "klar"
    2: !!(formData.firstName && formData.lastName),
    3: !!(formData.summary || formData.skills.length > 0),
    4: formData.workExperience.length > 0 || formData.education.length > 0,
    5: formData.languages.length > 0 || formData.certificates.length > 0,
  }

  // Ladda CV vid start
  useEffect(() => {
    loadCV()
  }, [])

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
    } catch (error) {
      console.error('Fel vid laddning av CV:', error)
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

  // Hjälpfunktioner för array-hantering
  const addItem = <T extends { id: string }>(array: T[], newItem: T, field: keyof CVData) => {
    setFormData({ ...formData, [field]: [...array, newItem] } as CVData)
  }

  const removeItem = <T extends { id: string }>(array: T[], id: string, field: keyof CVData) => {
    setFormData({ ...formData, [field]: array.filter(item => item.id !== id) } as CVData)
  }

  const updateItem = <T extends { id: string }>(array: T[], id: string, field: keyof CVData, key: keyof T, value: any) => {
    setFormData({
      ...formData,
      [field]: array.map(item => item.id === id ? { ...item, [key]: value } : item)
    } as CVData)
  }

  // RENDER STEG-INNEHÅLL
  const renderStepContent = () => {
    switch (step) {
      case 1: // MALL
        return (
          <SectionCard>
            <CVTemplateSelector
              selectedTemplate={formData.template}
              selectedColorScheme={formData.colorScheme}
              selectedFont={formData.font}
              onSelect={(id) => setFormData({ ...formData, template: id })}
              onSelectColorScheme={(scheme) => setFormData({ ...formData, colorScheme: scheme })}
              onSelectFont={(font) => setFormData({ ...formData, font })}
              showAdvanced={true}
            />
          </SectionCard>
        )

      case 2: // PERSONUPPGIFTER
        return (
          <div className="space-y-4">
            <SectionCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Förnamn"
                  value={formData.firstName}
                  onChange={(v) => setFormData({ ...formData, firstName: v })}
                  placeholder="Anna"
                  required
                />
                <Input
                  label="Efternamn"
                  value={formData.lastName}
                  onChange={(v) => setFormData({ ...formData, lastName: v })}
                  placeholder="Andersson"
                  required
                />
              </div>
            </SectionCard>
            
            <SectionCard>
              <Input
                label="Yrkestitel"
                value={formData.title}
                onChange={(v) => setFormData({ ...formData, title: v })}
                placeholder="t.ex. Erfaren säljare"
              />
            </SectionCard>
            
            <SectionCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="E-post"
                  type="email"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  placeholder="anna@email.se"
                />
                <Input
                  label="Telefon"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  placeholder="070-123 45 67"
                />
              </div>
            </SectionCard>
            
            <SectionCard>
              <Input
                label="Ort"
                value={formData.location}
                onChange={(v) => setFormData({ ...formData, location: v })}
                placeholder="Stockholm"
              />
            </SectionCard>
          </div>
        )

      case 3: // PROFIL
        return (
          <div className="space-y-4">
            <SectionCard>
              <h3 className="font-semibold text-slate-800 mb-1">Sammanfattning</h3>
              <p className="text-sm text-slate-500 mb-4">
                Skriv en kort presentation av dig själv. Detta är det första arbetsgivaren läser.
              </p>
              <TextArea
                label=""
                value={formData.summary}
                onChange={(v) => setFormData({ ...formData, summary: v })}
                placeholder="Berätta om din bakgrund, erfarenhet och vad du söker..."
                rows={6}
              />
              <div className="mt-4">
                <AIWritingAssistant
                  content={formData.summary}
                  onChange={(content) => setFormData({ ...formData, summary: content })}
                  type="summary"
                />
              </div>
            </SectionCard>
            
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Kompetenser</h3>
                  <p className="text-sm text-slate-500">Lägg till dina viktigaste färdigheter</p>
                </div>
                <button
                  onClick={() => addItem(formData.skills, {
                    id: Date.now().toString(),
                    name: '',
                    level: 3,
                    category: 'technical',
                  }, 'skills')}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.skills.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500 mb-2">Inga kompetenser tillagda ännu</p>
                  <button
                    onClick={() => addItem(formData.skills, {
                      id: Date.now().toString(),
                      name: '',
                      level: 3,
                      category: 'technical',
                    }, 'skills')}
                    className="text-[#4f46e5] font-medium text-sm hover:underline"
                  >
                    + Lägg till din första kompetens
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateItem(formData.skills, skill.id, 'skills', 'name', e.target.value)}
                        placeholder="t.ex. Projektledning"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateItem(formData.skills, skill.id, 'skills', 'level', parseInt(e.target.value))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-20"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                      <button
                        onClick={() => removeItem(formData.skills, skill.id, 'skills')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )

      case 4: // ERFARENHET
        return (
          <div className="space-y-4">
            {/* Arbetslivserfarenhet */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Arbetslivserfarenhet</h3>
                  <p className="text-sm text-slate-500">Dina tidigare jobb och tjänster</p>
                </div>
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.workExperience.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Inga arbetserfarenheter tillagda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.workExperience.map((exp, idx) => (
                    <div key={exp.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500">Erfarenhet {idx + 1}</span>
                        <button
                          onClick={() => removeItem(formData.workExperience, exp.id, 'workExperience')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'company', e.target.value)}
                          placeholder="Företag"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'title', e.target.value)}
                          placeholder="Titel/roll"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateItem(formData.workExperience, exp.id, 'workExperience', 'description', e.target.value)}
                        placeholder="Beskriv dina arbetsuppgifter..."
                        rows={3}
                        className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            
            {/* Utbildning */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Utbildning</h3>
                  <p className="text-sm text-slate-500">Skola, universitet, kurser</p>
                </div>
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.education.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Inga utbildningar tillagda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.education.map((edu, idx) => (
                    <div key={edu.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500">Utbildning {idx + 1}</span>
                        <button
                          onClick={() => removeItem(formData.education, edu.id, 'education')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateItem(formData.education, edu.id, 'education', 'school', e.target.value)}
                          placeholder="Skola/Universitet"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateItem(formData.education, edu.id, 'education', 'degree', e.target.value)}
                          placeholder="Examen"
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )

      case 5: // ÖVRIGT
        return (
          <div className="space-y-4">
            {/* Språk */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">Språk</h3>
                </div>
                <button
                  onClick={() => addItem(formData.languages, {
                    id: Date.now().toString(),
                    name: '',
                    level: 'God',
                  }, 'languages')}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.languages.length > 0 && (
                <div className="space-y-2">
                  {formData.languages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) => updateItem(formData.languages, lang.id, 'languages', 'name', e.target.value)}
                        placeholder="Språk"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                      <select
                        value={lang.level}
                        onChange={(e) => updateItem(formData.languages, lang.id, 'languages', 'level', e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32"
                      >
                        <option value="Grundläggande">Grundläggande</option>
                        <option value="God">God</option>
                        <option value="Flytande">Flytande</option>
                        <option value="Modersmål">Modersmål</option>
                      </select>
                      <button
                        onClick={() => removeItem(formData.languages, lang.id, 'languages')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            
            {/* Certifikat */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">Certifikat</h3>
                </div>
                <button
                  onClick={() => addItem(formData.certificates, {
                    id: Date.now().toString(),
                    name: '',
                    issuer: '',
                    date: '',
                  }, 'certificates')}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.certificates.length > 0 && (
                <div className="space-y-3">
                  {formData.certificates.map((cert) => (
                    <div key={cert.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateItem(formData.certificates, cert.id, 'certificates', 'name', e.target.value)}
                          placeholder="Certifikatnamn"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => removeItem(formData.certificates, cert.id, 'certificates')}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            
            {/* Länkar */}
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">Länkar</h3>
                </div>
                <button
                  onClick={() => addItem(formData.links, {
                    id: Date.now().toString(),
                    type: 'website',
                    url: '',
                    label: '',
                  }, 'links')}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
              
              {formData.links.length > 0 && (
                <div className="space-y-2">
                  {formData.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateItem(formData.links, link.id, 'links', 'label', e.target.value)}
                        placeholder="Titel"
                        className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateItem(formData.links, link.id, 'links', 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeItem(formData.links, link.id, 'links')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )

      default:
        return null
    }
  }

  const currentStepData = STEPS.find(s => s.id === step)!

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Skapa ditt CV</h1>
            <p className="text-slate-600 text-sm sm:text-base mt-0.5">
              Steg {step} av {STEPS.length}: {currentStepData.title}
            </p>
          </div>
          
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowLinkedInImport(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[#0077B5] text-[#0077B5] rounded-lg hover:bg-[#0077B5]/5"
            >
              <Linkedin size={16} />
              Importera
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
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 text-sm font-medium"
            >
              <Save size={16} />
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Förhandsvisning</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <CVPreview data={formData} />
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Step sidebar (desktop only) */}
        <div className="hidden lg:block lg:col-span-3">
          <DesktopStepSidebar
            currentStep={step}
            onStepClick={setStep}
            stepData={stepData}
          />
        </div>

        {/* Middle: Form content */}
        <div className="lg:col-span-6">
          {/* Mobile step header */}
          <div className="lg:hidden mb-4">
            <MobileStepHeader step={currentStepData} totalSteps={STEPS.length} />
            <StepIndicator 
              currentStep={step} 
              totalSteps={STEPS.length}
              onStepClick={setStep}
              stepData={stepData}
            />
          </div>

          {/* Form content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[48px]"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Föregående</span>
            </button>
            
            {/* Mobile preview button */}
            <button
              onClick={() => setShowPreview(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium min-h-[48px]"
            >
              <Eye size={18} />
              Förhandsvisa
            </button>
            
            <button
              onClick={() => setStep(Math.min(STEPS.length, step + 1))}
              disabled={step === STEPS.length}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[48px]"
            >
              <span className="hidden sm:inline">Nästa</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right: Preview (desktop only) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-medium text-slate-700 text-sm">Förhandsvisning</h3>
            </div>
            <div 
              ref={previewRef}
              className="overflow-y-auto max-h-[calc(100vh-200px)] bg-slate-100 p-3"
            >
              <div className="scale-[0.65] origin-top transform-gpu">
                <CVPreview data={formData} />
              </div>
            </div>
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
