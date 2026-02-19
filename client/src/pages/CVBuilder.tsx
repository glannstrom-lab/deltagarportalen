import { useState, useEffect } from 'react'
import { cvApi } from '../services/api'
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react'

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
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [atsScore, setAtsScore] = useState(0)
  const [atsChecks, setAtsChecks] = useState<any[]>([])
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
      setAtsChecks(ats.checks)
      setAtsSuggestions(ats.suggestions)
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
      
      // Uppdatera ATS-analys
      const ats = await cvApi.getATSAnalysis()
      setAtsScore(ats.score)
      setAtsChecks(ats.checks)
      setAtsSuggestions(ats.suggestions)
    } catch (error) {
      console.error('Fel vid sparande:', error)
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
    { number: 1, title: 'Personlig info', description: 'Grundläggande uppgifter' },
    { number: 2, title: 'Sammanfattning', description: 'Berätta om dig själv' },
    { number: 3, title: 'Erfarenhet', description: 'Dina tidigare jobb' },
    { number: 4, title: 'Utbildning', description: 'Skola och kurser' },
    { number: 5, title: 'Färdigheter', description: 'Kompetenser' },
    { number: 6, title: 'Granska', description: 'Se resultatet' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">CV-generator</h1>
        <p className="text-slate-600 mt-2">
          Bygg ett professionellt CV som sticker ut. Följ stegen nedan.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <button
                onClick={() => setStep(s.number)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === s.number
                    ? 'bg-teal-700 text-white'
                    : step > s.number
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.number ? '✓' : s.number}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > s.number ? 'bg-teal-700' : 'bg-slate-200'
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

      {/* ATS Score */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">ATS-kompatibilitet</h3>
            <p className="text-sm text-slate-600">Hur väl fungerar ditt CV i rekryteringssystem</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              atsScore >= 80 ? 'text-green-600' : atsScore >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {atsScore}/100
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {atsChecks.map((check) => (
            <div key={check.name} className="flex items-center gap-2">
              {check.passed ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertCircle size={16} className="text-amber-500" />
              )}
              <span className={`text-sm ${check.passed ? 'text-slate-600' : 'text-slate-500'}`}>
                {check.name}
              </span>
            </div>
          ))}
        </div>
        
        {atsSuggestions.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <p className="font-medium text-amber-800 mb-2">Förbättringsförslag:</p>
            <ul className="space-y-1">
              {atsSuggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-amber-700">• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form Steps */}
      <div className="card">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Förnamn</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Efternamn</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            
            <div>
              <label className="label">Yrkestitel / Tagline</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="t.ex. Erfaren säljare"
              />
            </div>
            
            <div>
              <label className="label">E-post</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="t.ex. Stockholm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Profil / Sammanfattning</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="input min-h-[200px]"
                placeholder="Beskriv dig själv, din erfarenhet och vad du söker..."
                maxLength={500}
              />
              <p className="text-sm text-slate-500 mt-2">
                {formData.summary.length}/500 tecken
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-700 mb-2">Tips för en bra sammanfattning:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Börja med din yrkestitel och års erfarenhet</li>
                <li>• Nämn 2-3 viktiga kompetenser</li>
                <li>• Avsluta med vad du söker</li>
              </ul>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {formData.workExperience.map((work) => (
              <div key={work.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-slate-800">Arbetsplats</h4>
                  <button
                    onClick={() => removeWorkExperience(work.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Företag</label>
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) => updateWorkExperience(work.id, 'company', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Befattning</label>
                    <input
                      type="text"
                      value={work.title}
                      onChange={(e) => updateWorkExperience(work.id, 'title', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Startdatum</label>
                    <input
                      type="month"
                      value={work.startDate}
                      onChange={(e) => updateWorkExperience(work.id, 'startDate', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Slutdatum</label>
                    <input
                      type="month"
                      value={work.endDate}
                      onChange={(e) => updateWorkExperience(work.id, 'endDate', e.target.value)}
                      className="input"
                      disabled={work.current}
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={work.current}
                    onChange={(e) => updateWorkExperience(work.id, 'current', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Pågående anställning</span>
                </label>
                
                <div>
                  <label className="label">Beskrivning</label>
                  <textarea
                    value={work.description}
                    onChange={(e) => updateWorkExperience(work.id, 'description', e.target.value)}
                    className="input min-h-[100px]"
                    placeholder="Beskriv dina arbetsuppgifter och resultat..."
                  />
                </div>
              </div>
            ))}
            
            <button
              onClick={addWorkExperience}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-teal-500 hover:text-teal-700 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Lägg till arbetsplats
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            {formData.education.map((edu) => (
              <div key={edu.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-slate-800">Utbildning</h4>
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Skola/Universitet</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Examen</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="input"
                      placeholder="t.ex. Kandidatexamen"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="label">Ämne/Inriktning</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    className="input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Startår</label>
                    <input
                      type="number"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      className="input"
                      placeholder="YYYY"
                    />
                  </div>
                  <div>
                    <label className="label">Slutår</label>
                    <input
                      type="number"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      className="input"
                      placeholder="YYYY"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addEducation}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-teal-500 hover:text-teal-700 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Lägg till utbildning
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="label">Färdigheter</label>
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="input min-h-[150px]"
                placeholder="t.ex. Microsoft Office, Kundservice, Projektledning, Svenska, Engelska..."
              />
              <p className="text-sm text-slate-500 mt-2">
                Separera med kommatecken
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-700 mb-2">Vanliga färdigheter att inkludera:</p>
              <div className="flex flex-wrap gap-2">
                {['Kommunikation', 'Teamwork', 'Problemlösning', 'Tidsplanering', 'Ledarskap', 'Dataanalys', 'Kundservice', 'Svenska', 'Engelska'].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setFormData({
                      ...formData,
                      skills: formData.skills ? `${formData.skills}, ${skill}` : skill
                    })}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-full text-sm text-slate-700 hover:border-teal-500 hover:text-teal-700"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                {formData.firstName} {formData.lastName}
              </h3>              
              {formData.title && <p className="text-slate-600 mb-2">{formData.title}</p>}
              <div className="text-sm text-slate-500 mb-4">
                {formData.email && <span className="mr-4">📧 {formData.email}</span>}
                {formData.phone && <span className="mr-4">📞 {formData.phone}</span>}
                {formData.location && <span>📍 {formData.location}</span>}
              </div>
              
              {formData.summary && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Profil</h4>
                  <p className="text-slate-600">{formData.summary}</p>
                </div>
              )}
              
              {formData.workExperience.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Arbetslivserfarenhet</h4>
                  <div className="space-y-2">
                    {formData.workExperience.map((work) => (
                      <div key={work.id} className="text-sm">
                        <strong>{work.title}</strong> hos {work.company}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.education.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Utbildning</h4>
                  <div className="space-y-2">
                    {formData.education.map((edu) => (
                      <div key={edu.id} className="text-sm">
                        <strong>{edu.degree}</strong>, {edu.school}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.skills && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Färdigheter</h4>
                  <p className="text-sm text-slate-600">{formData.skills}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => alert('PDF-export kommer snart! Ditt CV sparas automatiskt.')}
                className="flex-1 btn btn-primary py-3"
              >
                Ladda ner som PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Länk kopierad!')
                }}
                className="flex-1 btn btn-outline py-3"
              >
                Dela CV
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="btn btn-ghost"
          >
            <ChevronLeft size={20} />
            Föregående
          </button>
          
          <button
            onClick={saveCV}
            disabled={saving}
            className="btn btn-secondary"
          >
            {saving ? 'Sparar...' : 'Spara'}
          </button>
          
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 6}
            className="btn btn-primary"
          >
            Nästa
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
