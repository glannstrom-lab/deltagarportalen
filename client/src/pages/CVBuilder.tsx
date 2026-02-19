import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { Plus, Trash2, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
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
import type { 
  CVData, WorkExperience, Education, Language, 
  Certificate, Link, Reference, Skill, CVVersion 
} from '@/services/mockApi'

// CVVersionHistory-komponent (inline eftersom den inte finns som separat fil)
interface CVVersionHistoryProps {
  versions: CVVersion[]
  onSaveVersion: (name: string) => void
  onRestoreVersion: (versionId: string) => void
  currentData: CVData
}

function CVVersionHistory({ versions, onSaveVersion, onRestoreVersion }: CVVersionHistoryProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [versionName, setVersionName] = useState('')

  const handleSave = () => {
    if (versionName.trim()) {
      onSaveVersion(versionName.trim())
      setVersionName('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Versionshistorik</h3>
          <p className="text-sm text-slate-500">Spara och återställ versioner</p>
        </div>
      </div>

      {showSaveDialog ? (
        <div className="space-y-3 mb-4">
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
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-full mb-4 px-4 py-2 border border-[#4f46e5] text-[#4f46e5] rounded-lg text-sm hover:bg-[#4f46e5]/5 transition-colors"
        >
          + Spara nuvarande version
        </button>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {versions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Inga sparade versioner ännu</p>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{version.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(version.createdAt).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <button
                onClick={() => onRestoreVersion(version.id)}
                className="px-3 py-1 text-xs text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors flex-shrink-0"
              >
                Återställ
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function CVBuilder() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedTemplate, _setSelectedTemplate] = useState<Template>(templates[0])
  
  // Versionshantering
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

  useEffect(() => {
    loadCV()
    loadVersions()
    // Kontrollera om användaren har sett onboarding tidigare
    const hasSeenOnboarding = localStorage.getItem('cv-onboarding-completed')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  const loadCV = async () => {
    try {
      const cv = await cvApi.getCV()
      
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

      // Uppdatera vald mall
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

  // Versionshantering
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
    if (!confirm('Detta kommer att ersätta ditt nuvarande CV. Vill du fortsätta?')) {
      return
    }
    try {
      const restoredCV = await cvApi.restoreVersion(versionId)
      setFormData({
        ...formData,
        ...restoredCV,
      })
      alert('Version återställd!')
    } catch (error) {
      console.error('Fel vid återställning:', error)
      alert('Kunde inte återställa version')
    }
  }

  // Delning
  const handleShare = async () => {
    const result = await cvApi.shareCV()
    return result
  }

  // Hjälpfunktioner för WorkExperience
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
    setFormData({
      ...formData,
      workExperience: [...formData.workExperience, newExperience],
    })
  }

  const removeWorkExperience = (id: string) => {
    setFormData({
      ...formData,
      workExperience: formData.workExperience.filter((w) => w.id !== id),
    })
  }

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setFormData({
      ...formData,
      workExperience: formData.workExperience.map((w) =>
        w.id === id ? { ...w, [field]: value } : w
      ),
    })
  }

  // Hjälpfunktioner för Education
  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    }
    setFormData({
      ...formData,
      education: [...formData.education, newEducation],
    })
  }

  const removeEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter((e) => e.id !== id),
    })
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setFormData({
      ...formData,
      education: formData.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // Hjälpfunktioner för Skills
  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 3,
      category: 'technical',
    }
    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill],
    })
  }

  const removeSkill = (id: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.id !== id),
    })
  }

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setFormData({
      ...formData,
      skills: formData.skills.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    })
  }

  // Hjälpfunktioner för Languages
  const addLanguage = () => {
    const newLanguage: Language = {
      id: Date.now().toString(),
      language: '',
      level: 'Medel',
    }
    setFormData({
      ...formData,
      languages: [...formData.languages, newLanguage],
    })
  }

  const removeLanguage = (id: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l.id !== id),
    })
  }

  const updateLanguage = (id: string, field: keyof Language, value: any) => {
    setFormData({
      ...formData,
      languages: formData.languages.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    })
  }

  // Hjälpfunktioner för Certificates
  const addCertificate = () => {
    const newCertificate: Certificate = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
    }
    setFormData({
      ...formData,
      certificates: [...formData.certificates, newCertificate],
    })
  }

  const removeCertificate = (id: string) => {
    setFormData({
      ...formData,
      certificates: formData.certificates.filter((c) => c.id !== id),
    })
  }

  const updateCertificate = (id: string, field: keyof Certificate, value: any) => {
    setFormData({
      ...formData,
      certificates: formData.certificates.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    })
  }

  // Hjälpfunktioner för Links
  const addLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      type: 'website',
      url: '',
      label: '',
    }
    setFormData({
      ...formData,
      links: [...formData.links, newLink],
    })
  }

  const removeLink = (id: string) => {
    setFormData({
      ...formData,
      links: formData.links.filter((l) => l.id !== id),
    })
  }

  const updateLink = (id: string, field: keyof Link, value: any) => {
    setFormData({
      ...formData,
      links: formData.links.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    })
  }

  // Hjälpfunktioner för References
  const addReference = () => {
    const newReference: Reference = {
      id: Date.now().toString(),
      name: '',
      title: '',
      company: '',
    }
    setFormData({
      ...formData,
      references: [...formData.references, newReference],
    })
  }

  const removeReference = (id: string) => {
    setFormData({
      ...formData,
      references: formData.references.filter((r) => r.id !== id),
    })
  }

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    setFormData({
      ...formData,
      references: formData.references.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    })
  }

  const steps = [
    { number: 1, title: 'Välj mall', description: 'Design och layout' },
    { number: 2, title: 'Personlig info', description: 'Grundläggande uppgifter' },
    { number: 3, title: 'Sammanfattning', description: 'Berätta om dig själv' },
    { number: 4, title: 'Erfarenhet', description: 'Dina tidigare jobb' },
    { number: 5, title: 'Utbildning', description: 'Skola och kurser' },
    { number: 6, title: 'Färdigheter', description: 'Kompetenser' },
    { number: 7, title: 'Språk', description: 'Språkkunskaper' },
    { number: 8, title: 'Certifikat', description: 'Intyg och certifikat' },
    { number: 9, title: 'Länkar', description: 'Portfolio och sociala medier' },
    { number: 10, title: 'Referenser', description: 'Kontaktpersoner' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Onboarding */}
      {showOnboarding && (
        <CVOnboarding
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">CV-generator</h1>
            <p className="text-slate-600 mt-2">
              Bygg ett professionellt CV med AI-hjälp och förhandsvisning i realtid.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
              {showPreview ? 'Dölj förhandsvisning' : 'Visa förhandsvisning'}
            </button>
            <button
              onClick={saveCV}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50"
            >
              {saving ? 'Sparar...' : 'Spara CV'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Editor */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <button
                    onClick={() => setStep(s.number)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step === s.number
                        ? 'bg-[#4f46e5] text-white'
                        : step > s.number
                        ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > s.number ? '✓' : s.number}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step > s.number ? 'bg-[#4f46e5]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="font-medium text-slate-800">{steps[step - 1].title}</p>
              <p className="text-sm text-slate-500">{steps[step - 1].description}</p>
            </div>
          </div>

          {/* Step 1: Template Selection */}
          {step === 1 && (
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
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800">Personlig information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Förnamn</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yrkestitel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="t.ex. Erfaren säljare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800">Profil / Sammanfattning</h3>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full h-40 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Beskriv dig själv, din erfarenhet och vad du söker..."
                maxLength={500}
              />
              <p className="text-sm text-slate-500">
                {formData.summary.length}/500 tecken
              </p>
              
              {/* SpellChecker */}
              <SpellChecker
                text={formData.summary}
                onCorrect={(corrected) => setFormData({ ...formData, summary: corrected })}
                language="sv"
              />
              
              <AIWritingAssistant
                text={formData.summary}
                onApply={(newText) => setFormData({ ...formData, summary: newText })}
                type="summary"
              />
              <div className="mt-4">
                <PhraseBank onSelectPhrase={(phrase) => {
                  setFormData({ ...formData, summary: phrase })
                }} />
              </div>
            </div>
          )}

          {/* Step 4: Work Experience */}
          {step === 4 && (
            <div className="space-y-4">
              {formData.workExperience.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Arbetsplats</h4>
                    <button
                      onClick={() => removeWorkExperience(job.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Företag"
                      value={job.company}
                      onChange={(e) => updateWorkExperience(job.id, 'company', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Titel/roll"
                      value={job.title}
                      onChange={(e) => updateWorkExperience(job.id, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Plats (ort)"
                      value={job.location}
                      onChange={(e) => updateWorkExperience(job.id, 'location', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="month"
                        placeholder="Startdatum"
                        value={job.startDate}
                        onChange={(e) => updateWorkExperience(job.id, 'startDate', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                      {!job.current && (
                        <input
                          type="month"
                          placeholder="Slutdatum"
                          value={job.endDate}
                          onChange={(e) => updateWorkExperience(job.id, 'endDate', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                      )}
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={job.current}
                        onChange={(e) => updateWorkExperience(job.id, 'current', e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">Nuvarande anställning</span>
                    </label>
                    <textarea
                      placeholder="Beskriv dina arbetsuppgifter och resultat..."
                      value={job.description}
                      onChange={(e) => updateWorkExperience(job.id, 'description', e.target.value)}
                      className="w-full h-24 px-4 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <AIWritingAssistant
                      text={job.description}
                      onApply={(newText) => updateWorkExperience(job.id, 'description', newText)}
                      type="experience"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addWorkExperience}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till arbetslivserfarenhet
              </button>
            </div>
          )}

          {/* Step 5: Education */}
          {step === 5 && (
            <div className="space-y-4">
              {formData.education.map((edu) => (
                <div key={edu.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Utbildning</h4>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Skola/Universitet"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Examen"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Inriktning/Ämne"
                      value={edu.field}
                      onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Plats (ort)"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="month"
                        placeholder="Startår"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                      <input
                        type="month"
                        placeholder="Slutår"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                    <textarea
                      placeholder="Beskrivning (valfritt)..."
                      value={edu.description}
                      onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                      className="w-full h-20 px-4 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addEducation}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till utbildning
              </button>
            </div>
          )}

          {/* Step 6: Skills */}
          {step === 6 && (
            <div className="space-y-4">
              {formData.skills.map((skill) => (
                <div key={skill.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Kompetens</h4>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Kompetens (t.ex. JavaScript, Projektledning)"
                      value={skill.name}
                      onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nivå</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={skill.level || 3}
                          onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Nybörjare</span>
                          <span>Expert</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Nivå: {skill.level || 3}/5
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                        <select
                          value={skill.category || 'technical'}
                          onChange={(e) => updateSkill(skill.id, 'category', e.target.value as Skill['category'])}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        >
                          <option value="technical">Teknisk</option>
                          <option value="soft">Mjuk kompetens</option>
                          <option value="tool">Verktyg</option>
                          <option value="language">Språk</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addSkill}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till kompetens
              </button>
            </div>
          )}

          {/* Step 7: Languages */}
          {step === 7 && (
            <div className="space-y-4">
              {formData.languages.map((lang) => (
                <div key={lang.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Språk</h4>
                    <button
                      onClick={() => removeLanguage(lang.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Språk (t.ex. Engelska, Spanska)"
                      value={lang.language}
                      onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nivå</label>
                      <select
                        value={lang.level}
                        onChange={(e) => updateLanguage(lang.id, 'level', e.target.value as Language['level'])}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      >
                        <option value="Grundläggande">Grundläggande</option>
                        <option value="Medel">Medel</option>
                        <option value="Flytande">Flytande</option>
                        <option value="Modersmål">Modersmål</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addLanguage}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till språk
              </button>
            </div>
          )}

          {/* Step 8: Certificates */}
          {step === 8 && (
            <div className="space-y-4">
              {formData.certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Certifikat</h4>
                    <button
                      onClick={() => removeCertificate(cert.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Certifikatnamn (t.ex. Körkort B, ISO-certifiering)"
                      value={cert.name}
                      onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Utfärdare (t.ex. Transportstyrelsen)"
                      value={cert.issuer}
                      onChange={(e) => updateCertificate(cert.id, 'issuer', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Utfärdat datum</label>
                        <input
                          type="month"
                          value={cert.date}
                          onChange={(e) => updateCertificate(cert.id, 'date', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Utgångsdatum (valfritt)</label>
                        <input
                          type="month"
                          value={cert.expiryDate || ''}
                          onChange={(e) => updateCertificate(cert.id, 'expiryDate', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addCertificate}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till certifikat
              </button>
            </div>
          )}

          {/* Step 9: Links */}
          {step === 9 && (
            <div className="space-y-4">
              {formData.links.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Länk</h4>
                    <button
                      onClick={() => removeLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                      <select
                        value={link.type}
                        onChange={(e) => updateLink(link.id, 'type', e.target.value as Link['type'])}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="github">GitHub</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="website">Webbsida</option>
                        <option value="other">Annat</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Etikett (valfritt, t.ex. Min portfolio)"
                      value={link.label || ''}
                      onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addLink}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till länk
              </button>
            </div>
          )}

          {/* Step 10: References */}
          {step === 10 && (
            <div className="space-y-4">
              {formData.references.map((ref) => (
                <div key={ref.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-800">Referens</h4>
                    <button
                      onClick={() => removeReference(ref.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Namn"
                      value={ref.name}
                      onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Titel/roll"
                      value={ref.title}
                      onChange={(e) => updateReference(ref.id, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <input
                      type="text"
                      placeholder="Företag/Organisation"
                      value={ref.company}
                      onChange={(e) => updateReference(ref.id, 'company', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="tel"
                        placeholder="Telefon (valfritt)"
                        value={ref.phone || ''}
                        onChange={(e) => updateReference(ref.id, 'phone', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                      <input
                        type="email"
                        placeholder="E-post (valfritt)"
                        value={ref.email || ''}
                        onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addReference}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-[#4f46e5] hover:text-[#4f46e5] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Lägg till referens
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Föregående
            </button>
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 10}
              className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right column - Preview & Tools */}
        <div className="space-y-6">
          {/* Preview - always rendered but can be visually hidden */}
          <div 
            ref={previewRef}
            className={showPreview ? 'sticky top-6' : ''}
            style={showPreview ? {} : { 
              position: 'absolute',
              left: '-10000px',
              top: '0',
              opacity: '0.01',
              pointerEvents: 'none',
              width: '794px',
            }}
          >
            <CVPreview data={formData} />
          </div>

          {/* Sidebar tools */}
          {!showPreview && (
            <div className="space-y-6">
              <CVExport 
                data={formData}
                fileName={`${formData.firstName}-${formData.lastName}-CV`.replace(/\s+/g, '-').toLowerCase() || 'mitt-cv'}
              />
              
              <CVShare onShare={handleShare} />
              
              <CVVersionHistory 
                versions={versions}
                onSaveVersion={handleSaveVersion}
                onRestoreVersion={handleRestoreVersion}
                currentData={formData}
              />
              
              <ATSAnalyzer cvData={formData} />
              
              <JobAdAnalyzer cvData={formData} />
              
              <JobMatcher 
                cvSkills={formData.skills.map(s => s.name).join(', ')}
                cvSummary={formData.summary}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
