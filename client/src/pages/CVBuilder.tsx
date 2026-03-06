import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { Plus, Trash2, ChevronRight, ChevronLeft, Eye, EyeOff, FileDown, Linkedin, Menu, X } from 'lucide-react'
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
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Versionshistorik</h3>
          <p className="text-xs sm:text-sm text-slate-500">Spara och återställ versioner</p>
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
              className="flex-1 px-3 py-2 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca] min-h-[44px]"
            >
              Spara
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 min-h-[44px]"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-full mb-4 px-4 py-3 border border-[#4f46e5] text-[#4f46e5] rounded-lg text-sm hover:bg-[#4f46e5]/5 transition-colors min-h-[44px]"
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
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{version.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(version.createdAt).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <button
                onClick={() => onRestoreVersion(version.id)}
                className="px-3 py-2 text-xs text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors flex-shrink-0 min-h-[36px]"
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
  const [showLinkedInImport, setShowLinkedInImport] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
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
      
      // Om cv är null, avbryt och behåll default-värden
      if (!cv) {
        console.log('Inget CV hittat, använder tomma värden')
        return
      }
      
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

  // Ladda demo-data
  const loadDemoData = () => {
    if (!confirm('Detta kommer att fylla i ditt CV med exempeldata. Vill du fortsätta?')) {
      return
    }
    
    setFormData({
      ...formData,
      firstName: 'Anna',
      lastName: 'Andersson',
      title: 'Projektledare',
      email: 'anna.andersson@example.com',
      phone: '+46 70 123 45 67',
      location: 'Stockholm',
      summary: 'Erfaren projektledare med över 5 års erfarenhet av att leda utvecklingsteam inom IT-sektorn. Stark kommunikativ förmåga och vana att hantera komplexa projekt från start till mål. Brinner för att skapa effektiva arbetsflöden och att utveckla mitt team.',
      skills: [
        { id: '1', name: 'Projektledning', level: 5, category: 'technical' },
        { id: '2', name: 'Agil utveckling', level: 4, category: 'technical' },
        { id: '3', name: 'Kommunikation', level: 5, category: 'soft' },
        { id: '4', name: 'Microsoft Office', level: 4, category: 'technical' },
        { id: '5', name: 'Scrum', level: 4, category: 'technical' },
        { id: '6', name: 'Ledarskap', level: 4, category: 'soft' },
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
          description: 'Leder ett team på 8 utvecklare i utvecklingen av en ny e-handelsplattform. Ansvarar för projektplanering, resursallokering och kommunikation med stakeholders.',
        },
        {
          id: '2',
          company: 'Digital Innovation i Sverige AB',
          title: 'Junior Projektledare',
          location: 'Göteborg',
          startDate: '2019-06',
          endDate: '2021-02',
          current: false,
          description: 'Arbetade med att koordinera mindre projekt inom webbutveckling. Bistod seniora projektledare och lärde mig agila metoder.',
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
        { id: '3', name: 'Tyska', level: 'basic' },
      ],
      certificates: [
        { id: '1', name: 'PMP Project Management Professional', issuer: 'PMI', date: '2022-03' },
        { id: '2', name: 'Scrum Master Certification', issuer: 'Scrum Alliance', date: '2020-11' },
      ],
      links: [
        { id: '1', title: 'LinkedIn', url: 'https://linkedin.com/in/annaandersson' },
        { id: '2', title: 'Portfolio', url: 'https://annaandersson.se' },
      ],
      references: [
        { id: '1', name: 'Erik Johansson', title: 'Utvecklingschef', company: 'Tech Solutions AB', email: 'erik@techsolutions.se', phone: '+46 70 987 65 43' },
      ],
    })
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
      name: '',
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

      {/* Header - Mobilanpassad */}
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-800">CV-generator</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
              Bygg ett professionellt CV med AI-hjälp och förhandsvisning i realtid.
            </p>
          </div>
          
          {/* Desktop knappar */}
          <div className="hidden sm:flex gap-2 flex-wrap justify-end">
            <button
              onClick={loadDemoData}
              className="flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100"
              title="Fyll i med exempeldata för att testa"
            >
              <span>✨</span>
              Demo-data
            </button>
            
            <button
              onClick={() => setShowLinkedInImport(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-xl hover:bg-[#0077B5]/5"
            >
              <Linkedin size={18} />
              Importera LinkedIn
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
              {showPreview ? 'Dölj förhandsvisning' : 'Visa förhandsvisning'}
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
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50"
            >
              {saving ? 'Sparar...' : 'Spara CV'}
            </button>
          </div>
          
          {/* Mobil verktygsmeny */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white"
            >
              <Menu size={20} />
              Verktyg & alternativ
            </button>
            
            {showToolsMenu && (
              <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-3 space-y-2">
                <button
                  onClick={() => {
                    loadDemoData()
                    setShowToolsMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg"
                >
                  <span>✨</span>
                  Demo-data
                </button>
                
                <button
                  onClick={() => {
                    setShowLinkedInImport(true)
                    setShowToolsMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 border border-[#0077B5] text-[#0077B5] rounded-lg"
                >
                  <Linkedin size={18} />
                  Importera LinkedIn
                </button>
                
                <button
                  onClick={() => {
                    setShowPreview(!showPreview)
                    setShowToolsMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg text-slate-700"
                >
                  {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showPreview ? 'Dölj förhandsvisning' : 'Visa förhandsvisning'}
                </button>
                
                <button
                  onClick={saveCV}
                  disabled={saving}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Sparar...' : 'Spara CV'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil förhandsvisning (visas som overlay) */}
      {showPreview && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Left column - Editor */}
        <div className="space-y-4 sm:space-y-6">
          {/* Progress - Scrollbar på mobil */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center overflow-x-auto pb-2 scrollbar-hide gap-1">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => setStep(s.number)}
                    className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-colors flex-shrink-0',
                      step === s.number
                        ? 'bg-[#4f46e5] text-white'
                        : step > s.number
                        ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                        : 'bg-slate-200 text-slate-500'
                    )}
                    title={s.title}
                  >
                    {step > s.number ? '✓' : s.number}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-3 sm:w-8 h-1 mx-0.5 sm:mx-1 flex-shrink-0',
                        step > s.number ? 'bg-[#4f46e5]' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 text-center">
              <p className="font-medium text-slate-800 text-sm sm:text-base">{steps[step - 1].title}</p>
              <p className="text-xs sm:text-sm text-slate-500">{steps[step - 1].description}</p>
            </div>
          </div>

          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800">Personlig information</h3>
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
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800">Sammanfattning</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Berätta kort om dig själv
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-base"
                  placeholder="Beskriv din bakgrund, erfarenhet och vad du söker..."
                />
              </div>
              <AIWritingAssistant
                content={formData.summary}
                onChange={(content) => setFormData({ ...formData, summary: content })}
                type="summary"
              />
            </div>
          )}

          {/* Step 4: Work Experience */}
          {step === 4 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Arbetslivserfarenhet</h3>
                <button
                  onClick={addWorkExperience}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.workExperience.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga arbetserfarenheter tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={exp.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Erfarenhet {index + 1}</span>
                        <button
                          onClick={() => removeWorkExperience(exp.id)}
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
                            onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Företagsnamn"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Jobbtitel"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Beskrivning</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Beskriv dina arbetsuppgifter och ansvar..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Education */}
          {step === 5 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Utbildning</h3>
                <button
                  onClick={addEducation}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.education.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga utbildningar tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={edu.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Utbildning {index + 1}</span>
                        <button
                          onClick={() => removeEducation(edu.id)}
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
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Skolans namn"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Examen</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="t.ex. Kandidatexamen"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ämne/Inriktning</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="t.ex. Datavetenskap"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Skills */}
          {step === 6 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Färdigheter</h3>
                <button
                  onClick={addSkill}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
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
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga färdigheter tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 border-0 text-sm focus:outline-none"
                        placeholder="Färdighet"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value))}
                        className="px-2 py-1 border border-slate-200 rounded text-sm"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 7: Languages */}
          {step === 7 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Språk</h3>
                <button
                  onClick={addLanguage}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.languages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga språk tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.languages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3">
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Språk"
                      />
                      <select
                        value={lang.level}
                        onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="Grundläggande">Grundläggande</option>
                        <option value="God">God</option>
                        <option value="Flytande">Flytande</option>
                        <option value="Modersmål">Modersmål</option>
                      </select>
                      <button
                        onClick={() => removeLanguage(lang.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 8: Certificates */}
          {step === 8 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Certifikat</h3>
                <button
                  onClick={addCertificate}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.certificates.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga certifikat tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.certificates.map((cert, index) => (
                    <div key={cert.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Certifikat {index + 1}</span>
                        <button
                          onClick={() => removeCertificate(cert.id)}
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
                          onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="t.ex. PMP Certification"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Utfärdare</label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => updateCertificate(cert.id, 'issuer', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="t.ex. PMI"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Datum</label>
                          <input
                            type="text"
                            value={cert.date}
                            onChange={(e) => updateCertificate(cert.id, 'date', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="t.ex. 2023"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 9: Links */}
          {step === 9 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Länkar</h3>
                <button
                  onClick={addLink}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.links.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga länkar tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Titel"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="https://..."
                      />
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 10: References */}
          {step === 10 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Referenser</h3>
                <button
                  onClick={addReference}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
              
              {formData.references.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Inga referenser tillagda ännu. Klicka på "Lägg till" för att börja.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.references.map((ref, index) => (
                    <div key={ref.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Referens {index + 1}</span>
                        <button
                          onClick={() => removeReference(ref.id)}
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
                            onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Namn"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                          <input
                            type="text"
                            value={ref.title}
                            onChange={(e) => updateReference(ref.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Titel"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Företag</label>
                        <input
                          type="text"
                          value={ref.company}
                          onChange={(e) => updateReference(ref.id, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Företag"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              <ChevronLeft size={18} />
              Föregående
            </button>
            <button
              onClick={() => setStep(Math.min(steps.length, step + 1))}
              disabled={step === steps.length}
              className="flex items-center gap-1 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              Nästa
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Versionshistorik - visas under editorn */}
          <CVVersionHistory
            versions={versions}
            onSaveVersion={handleSaveVersion}
            onRestoreVersion={handleRestoreVersion}
            currentData={formData}
          />
        </div>

        {/* Right column - Preview (desktop only) */}
        <div className="hidden lg:block space-y-6">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Förhandsvisning</h3>
              <div 
                ref={previewRef}
                className="overflow-auto max-h-[calc(100vh-300px)]"
              >
                <CVPreview data={formData} />
              </div>
            </div>
            
            {/* Tools panel */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <AIWritingAssistant
                content={formData.summary}
                onChange={(content) => setFormData({ ...formData, summary: content })}
                type="summary"
              />
              <JobMatcher cvData={formData} />
              <ATSAnalyzer cvData={formData} />
              <PhraseBank />
              <CVExport cvData={formData} />
              <SpellChecker content={formData.summary} />
              <JobAdAnalyzer />
              <CVShare onShare={handleShare} />
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
