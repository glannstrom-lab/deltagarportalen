import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, X, 
  Linkedin, Save, Check, Layout, Type, Palette, Sparkles, 
  Briefcase, GraduationCap, Code, Building2
} from 'lucide-react'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { LinkedInImport } from '@/components/linkedin/LinkedInImport'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { cn } from '@/lib/utils'
import type { CVData } from '@/services/mockApi'

// ============================================
// FÖRENKLADE STEG (5 steg)
// ============================================
const STEPS = [
  { id: 1, title: 'Design', description: 'Välj mall och färger' },
  { id: 2, title: 'Om dig', description: 'Dina uppgifter' },
  { id: 3, title: 'Profil', description: 'Sammanfattning' },
  { id: 4, title: 'Erfarenhet', description: 'Jobb & utbildning' },
  { id: 5, title: 'Färdigheter', description: 'Kompetenser' },
] as const

// Mallar - förenklat
const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: Layout, color: '#4f46e5', desc: 'Clean & professionell' },
  { id: 'classic', name: 'Klassisk', icon: Type, color: '#1e293b', desc: 'Traditionell' },
  { id: 'creative', name: 'Kreativ', icon: Palette, color: '#ec4899', desc: 'Unik design' },
  { id: 'minimal', name: 'Minimal', icon: Sparkles, color: '#0f172a', desc: 'Enkel & luftig' },
]

// Färger - förenklat
const COLORS = [
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5' },
  { id: 'ocean', name: 'Blå', hex: '#0ea5e9' },
  { id: 'forest', name: 'Grön', hex: '#10b981' },
  { id: 'berry', name: 'Rosa', hex: '#ec4899' },
  { id: 'slate', name: 'Mörk', hex: '#1e293b' },
  { id: 'ruby', name: 'Röd', hex: '#ef4444' },
]

// Typsnitt
const FONTS = [
  { id: 'inter', name: 'Inter', desc: 'Modern' },
  { id: 'georgia', name: 'Georgia', desc: 'Klassisk' },
  { id: 'playfair', name: 'Playfair', desc: 'Elegant' },
]

// ============================================
// KOMPONENTER
// ============================================

function StepDots({ currentStep, totalSteps, onStepClick }: { 
  currentStep: number
  totalSteps: number
  onStepClick: (step: number) => void 
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        
        return (
          <button
            key={stepNum}
            onClick={() => onStepClick(stepNum)}
            className={cn(
              "h-2 rounded-full transition-all",
              isActive 
                ? "w-6 bg-[#4f46e5]" 
                : isCompleted 
                  ? "w-2 bg-[#4f46e5]"
                  : "w-2 bg-slate-300"
            )}
          />
        )
      })}
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

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6", className)}>
      {children}
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
  
  const [data, setData] = useState<CVData>({
    firstName: '', lastName: '', title: '', email: '', phone: '', location: '',
    summary: '', skills: [], workExperience: [], education: [],
    languages: [], certificates: [], links: [], references: [],
    template: 'modern', colorScheme: 'indigo', font: 'inter',
  })

  useEffect(() => { loadCV() }, [])

  const loadCV = async () => {
    try {
      const cv = await cvApi.getCV()
      if (cv) setData({ ...data, ...cv })
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

  // Array helpers
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
      {/* Mallar - en per rad på mobil */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Välj mall</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon
            const selected = data.template === t.id
            return (
              <button
                key={t.id}
                onClick={() => setData({ ...data, template: t.id })}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  selected 
                    ? "border-[#4f46e5] bg-[#eef2ff]" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selected ? t.color : '#f1f5f9', color: selected ? 'white' : '#64748b' }}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{t.name}</h4>
                    {selected && <Check size={16} className="text-[#4f46e5]" />}
                  </div>
                  <p className="text-sm text-slate-500">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Färger - 3 per rad på mobil */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Färg</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {COLORS.map((c) => {
            const selected = data.colorScheme === c.id
            return (
              <button
                key={c.id}
                onClick={() => setData({ ...data, colorScheme: c.id })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  selected ? "border-[#4f46e5] bg-[#eef2ff]" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs font-medium text-slate-700">{c.name}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Typsnitt - en per rad */}
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
                  selected 
                    ? "border-[#4f46e5] bg-[#eef2ff]" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800" style={{ fontFamily: f.id === 'playfair' ? 'serif' : 'sans-serif' }}>
                    {f.name}
                  </h4>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
                {selected && <Check size={20} className="text-[#4f46e5]" />}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Förnamn" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} placeholder="Anna" />
          <Input label="Efternamn" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} placeholder="Andersson" />
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
        <textarea
          value={data.summary}
          onChange={(e) => setData({ ...data, summary: e.target.value })}
          placeholder="Jag är en driven..."
          rows={6}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base resize-none"
        />
        <div className="mt-4">
          <AIWritingAssistant content={data.summary} onChange={(v) => setData({ ...data, summary: v })} type="summary" />
        </div>
      </Card>
    </div>
  )

  // STEG 4: ERFARENHET
  const renderStep4 = () => (
    <div className="space-y-4">
      {/* Jobb */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Arbetslivserfarenhet</h3>
          <button
            onClick={() => add(data.workExperience, { id: Date.now().toString(), company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }, 'workExperience')}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg"
          >
            <Plus size={16} /> Lägg till
          </button>
        </div>
        {data.workExperience.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Inga jobb tillagda ännu</p>
        ) : (
          <div className="space-y-3">
            {data.workExperience.map((exp, i) => (
              <div key={exp.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Jobb {i + 1}</span>
                  <button onClick={() => remove(data.workExperience, exp.id, 'workExperience')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    value={exp.company} 
                    onChange={(e) => update(data.workExperience, exp.id, 'workExperience', 'company', e.target.value)}
                    placeholder="Företag"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <input 
                    value={exp.title} 
                    onChange={(e) => update(data.workExperience, exp.id, 'workExperience', 'title', e.target.value)}
                    placeholder="Titel"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Utbildning */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Utbildning</h3>
          <button
            onClick={() => add(data.education, { id: Date.now().toString(), school: '', degree: '', field: '', location: '', startDate: '', endDate: '', description: '' }, 'education')}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg"
          >
            <Plus size={16} /> Lägg till
          </button>
        </div>
        {data.education.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Inga utbildningar tillagda ännu</p>
        ) : (
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div key={edu.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Utbildning {i + 1}</span>
                  <button onClick={() => remove(data.education, edu.id, 'education')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    value={edu.school} 
                    onChange={(e) => update(data.education, edu.id, 'education', 'school', e.target.value)}
                    placeholder="Skola"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <input 
                    value={edu.degree} 
                    onChange={(e) => update(data.education, edu.id, 'education', 'degree', e.target.value)}
                    placeholder="Examen"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  // STEG 5: FÄRDIGHETER
  const renderStep5 = () => (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Kompetenser</h3>
          <button
            onClick={() => add(data.skills, { id: Date.now().toString(), name: '', level: 3, category: 'technical' }, 'skills')}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg"
          >
            <Plus size={16} /> Lägg till
          </button>
        </div>
        {data.skills.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Inga kompetenser tillagda ännu</p>
        ) : (
          <div className="space-y-2">
            {data.skills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => update(data.skills, skill.id, 'skills', 'name', e.target.value)}
                  placeholder="Kompetens"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <select
                  value={skill.level}
                  onChange={(e) => update(data.skills, skill.id, 'skills', 'level', parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-20"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
                <button onClick={() => remove(data.skills, skill.id, 'skills')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Språk */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Språk</h3>
          <button
            onClick={() => add(data.languages, { id: Date.now().toString(), name: '', level: 'God' }, 'languages')}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg"
          >
            <Plus size={16} /> Lägg till
          </button>
        </div>
        {data.languages.length > 0 && (
          <div className="space-y-2">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={lang.name}
                  onChange={(e) => update(data.languages, lang.id, 'languages', 'name', e.target.value)}
                  placeholder="Språk"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <select
                  value={lang.level}
                  onChange={(e) => update(data.languages, lang.id, 'languages', 'level', e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32"
                >
                  <option value="Grundläggande">Grundläggande</option>
                  <option value="God">God</option>
                  <option value="Flytande">Flytande</option>
                  <option value="Modersmål">Modersmål</option>
                </select>
                <button onClick={() => remove(data.languages, lang.id, 'languages')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Skapa CV</h1>
          <p className="text-slate-600 text-sm">Steg {step} av {STEPS.length}: {currentStep.title}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setShowLinkedInImport(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Linkedin size={20} />
          </button>
          <PDFExportButton type="cv" data={{
            personalInfo: { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, city: data.location },
            summary: data.summary,
            experience: data.workExperience.map(w => ({ title: w.title, company: w.company, location: w.location, startDate: w.startDate, endDate: w.endDate, current: w.current, description: w.description })),
            education: data.education.map(e => ({ degree: e.degree, school: e.school, location: e.location, startDate: e.startDate, endDate: e.endDate, description: e.description })),
            skills: data.skills.map(s => s.name),
            languages: data.languages.map(l => ({ language: l.name, level: l.level })),
            certifications: data.certificates.map(c => ({ name: c.name, issuer: c.issuer, date: c.date })),
          }} variant="outline" size="md" />
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 text-sm font-medium">
            <Save size={16} />
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-slate-100 rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <h2 className="font-semibold">Förhandsvisning</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CVPreview data={data} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div>
          {/* Mobile Step Indicator */}
          <div className="lg:hidden mb-4">
            <StepDots currentStep={step} totalSteps={STEPS.length} onStepClick={setStep} />
          </div>

          {/* Form */}
          <div className="min-h-[400px]">
            {renderContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-medium"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Föregående</span>
            </button>
            
            <button
              onClick={() => setShowPreview(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
            >
              <Eye size={18} />
              Visa CV
            </button>
            
            <button
              onClick={() => setStep(Math.min(STEPS.length, step + 1))}
              disabled={step === STEPS.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 font-medium"
            >
              <span className="hidden sm:inline">Nästa</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right: Preview (Desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 bg-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-medium text-slate-700 text-sm">Förhandsvisning</h3>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <CVPreview data={data} />
              </div>
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
    </div>
  )
}
