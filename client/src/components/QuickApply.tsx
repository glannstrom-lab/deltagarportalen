import { useState } from 'react'
import { Send, FileText, CheckCircle, X, Edit3, Clock } from 'lucide-react'
import { type JobAd } from '../services/arbetsformedlingenApi'
import { applicationService, type ApplicationTemplate } from '../services/applicationService'
import CVMatcher from './CVMatcher'

interface QuickApplyProps {
  job: JobAd
  onClose: () => void
  onApplied: () => void
}

// Mock user data - would come from auth store in real app
const userData = {
  name: 'Anna Andersson',
  phone: '070-123 45 67',
  email: 'anna.andersson@example.com',
  experience: '3 års erfarenhet av webbutveckling',
  skills: ['JavaScript', 'React', 'TypeScript'],
}

export default function QuickApply({ job, onClose, onApplied }: QuickApplyProps) {
  const [step, setStep] = useState<'cv-check' | 'template' | 'edit' | 'confirm' | 'success'>('cv-check')
  const [templates] = useState<ApplicationTemplate[]>(() => applicationService.getTemplates())
  const [selectedTemplate, setSelectedTemplate] = useState<ApplicationTemplate | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [subject, setSubject] = useState('')
  const [showCVMatcher, setShowCVMatcher] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSelectTemplate = (template: ApplicationTemplate) => {
    setSelectedTemplate(template)
    const letter = applicationService.generateCoverLetter(template, job, userData)
    setCoverLetter(letter)
    setSubject(template.subject.replace('[YRKESROLL]', job.headline))
    setStep('edit')
  }

  const handleSend = () => {
    setSaving(true)
    
    // Simulate sending
    setTimeout(() => {
      // Save application
      applicationService.createApplication({
        jobId: job.id,
        jobTitle: job.headline,
        employer: job.employer.name,
        status: 'sent',
        coverLetter,
      })

      // Schedule follow-up
      applicationService.scheduleFollowUp(job.id, 7)

      setSaving(false)
      setStep('success')
      onApplied()
    }, 1500)
  }

  const prepareEmail = () => {
    const { mailtoLink } = applicationService.prepareEmail(job, coverLetter)
    if (mailtoLink) {
      window.location.href = mailtoLink
    }
  }

  if (showCVMatcher) {
    return <CVMatcher job={job} onClose={() => setShowCVMatcher(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {step === 'success' ? 'Ansökan skickad!' : 'Snabbansökan'}
            </h2>
            <p className="text-slate-500">{job.headline} på {job.employer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'cv-check' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Kolla din matchning först?</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Vi kan analysera hur väl ditt CV matchar jobbet innan du ansöker.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCVMatcher(true)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Ja, kolla matchning
                </button>
                <button
                  onClick={() => setStep('template')}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                >
                  Nej, fortsätt direkt
                </button>
              </div>
            </div>
          )}

          {step === 'template' && (
            <div className="space-y-4">
              <p className="text-slate-600">Välj en mall för ditt personliga brev:</p>
              
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{template.name}</h4>
                        <p className="text-sm text-slate-500 mt-1">{template.subject}</p>
                      </div>
                      {template.isDefault && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                          Standard
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ämne
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Personligt brev
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Redigera mallen så den passar dig och jobbet. Se till att alla [PLACEHOLDERS] ersätts.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('template')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ← Välj annan mall
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
                >
                  Granska & skicka
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-900 mb-4">Sammanfattning</h3>
                
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Till:</span> {job.employer.name}</p>
                  <p><span className="text-slate-500">Ämne:</span> {subject}</p>
                  <p><span className="text-slate-500">Från:</span> {userData.name} ({userData.email})</p>
                  <p><span className="text-slate-500">Bifogat:</span> CV (från din profil)</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Påminnelse</h4>
                    <p className="text-sm text-amber-700">
                      Vi skickar en påminnelse om 7 dagar om du inte hört något. 
                      Du kan följa statusen i Jobb-tracker.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('edit')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Redigera
                </button>
                
                {job.application_details?.email ? (
                  <button
                    onClick={prepareEmail}
                    className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Öppna e-postprogram
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={saving}
                    className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Skickar...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Skicka ansökan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Ansökan skickad!
              </h3>
              <p className="text-slate-600 mb-6">
                Vi har sparat din ansökan och skickar en påminnelse om 7 dagar.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
              >
                Stäng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
