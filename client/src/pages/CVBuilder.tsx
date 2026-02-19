import { useState, useEffect, useRef } from 'react'
import { cvApi } from '@/services/api'
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, 
  Eye, EyeOff 
} from 'lucide-react'
import { CVTemplateSelector, templates, type Template } from '@/components/cv/CVTemplateSelector'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { JobMatcher } from '@/components/cv/JobMatcher'
import { ATSAnalyzer } from '@/components/cv/ATSAnalyzer'
import { PhraseBank } from '@/components/cv/PhraseBank'
import { CVExport } from '@/components/cv/CVExport'

interface WorkExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
}

export default function CVBuilder() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])
  
  const [atsScore, setAtsScore] = useState(0)
  const [atsChecks, setAtsChecks] = useState<Array<{name: string; passed: boolean; description: string}>>([])
  const [atsSuggestions, setAtsSuggestions] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
    workExperience: [] as WorkExperience[],
    education: [] as Education[],
  })

  useEffect(() => {
    loadCV()
  }, [])

  const loadCV = async () => {
    try {
      const cv = await cvApi.getCV()
      const ats = await cvApi.getATSAnalysis()
      
      setFormData({
        firstName: cv.user?.firstName || '',
        lastName: cv.user?.lastName || '',
        title: cv.title || '',
        email: cv.email || '',
        phone: cv.phone || '',
        location: cv.location || '',
        summary: cv.summary || '',
        skills: cv.skills || '',
        workExperience: cv.workExperience || [],
        education: cv.education || [],
      })
      
      setAtsScore(ats.score)
      setAtsChecks(ats.checks || [])
      setAtsSuggestions(ats.suggestions || [])
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
      })
      
      const ats = await cvApi.getATSAnalysis()
      setAtsScore(ats.score)
      setAtsChecks(ats.checks || [])
      setAtsSuggestions(ats.suggestions || [])
      
      alert('CV sparat!')
    } catch (error) {
      console.error('Fel vid sparande:', error)
      alert('Kunde inte spara CV')
    } finally {
      setSaving(false)
    }
  }

  const addWorkExperience = () => {
    setFormData({
      ...formData,
      workExperience: [
        ...formData.workExperience,
        {
          id: Date.now().toString(),
          company: '',
          title: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
        },
      ],
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

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        {
          id: Date.now().toString(),
          school: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
        },
      ],
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

  const steps = [
    { number: 1, title: 'Välj mall', description: 'Design och layout' },
    { number: 2, title: 'Personlig info', description: 'Grundläggande uppgifter' },
    { number: 3, title: 'Sammanfattning', description: 'Berätta om dig själv' },
    { number: 4, title: 'Erfarenhet', description: 'Dina tidigare jobb' },
    { number: 5, title: 'Utbildning', description: 'Skola och kurser' },
    { number: 6, title: 'Färdigheter', description: 'Kompetenser' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
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
                selectedTemplate={selectedTemplate.id}
                onSelect={(id) => setSelectedTemplate(templates.find(t => t.id === id) || templates[0])}
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Profil / Sammanfattning</h3>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full h-40 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Beskriv dig själv, din erfarenhet och vad du söker..."
                maxLength={500}
              />
              <p className="text-sm text-slate-500 mt-2">
                {formData.summary.length}/500 tecken
              </p>
              <AIWritingAssistant
                text={formData.summary}
                onApply={(newText) => setFormData({ ...formData, summary: newText })}
                type="summary"
              />
              <div className="mt-6">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Kompetenser</h3>
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="t.ex. Projektledning, Excel, Kundservice, Svenska, Engelska..."
              />
              <p className="text-sm text-slate-500 mt-2">
                Separera kompetenser med kommatecken
              </p>
              <AIWritingAssistant
                text={formData.skills}
                onApply={(newText) => setFormData({ ...formData, skills: newText })}
                type="skills"
              />
              <div className="mt-6">
                <PhraseBank onSelectPhrase={(phrase) => {
                  setFormData({ ...formData, skills: phrase })
                }} />
              </div>
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
              disabled={step === 6}
              className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right column - Preview & Tools */}
        <div className="space-y-6">
          {/* Preview - alltid renderad men kan vara dold för export */}
          <div 
            ref={previewRef}
            className={showPreview ? 'sticky top-6' : 'absolute -left-[9999px] top-0'}
            style={{ width: showPreview ? 'auto' : '210mm' }}
          >
            <CVPreview data={formData} template={selectedTemplate} />
          </div>

          {/* Tools - visas när preview inte är aktiv */}
          {!showPreview && (
            <div className="space-y-6">
              <CVExport 
                previewRef={previewRef} 
                fileName={`${formData.firstName}-${formData.lastName}-CV`.replace(/\s+/g, '-').toLowerCase() || 'mitt-cv'} 
              />
              <ATSAnalyzer score={atsScore} checks={atsChecks} suggestions={atsSuggestions} />
              <JobMatcher cvSkills={formData.skills} cvSummary={formData.summary} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
