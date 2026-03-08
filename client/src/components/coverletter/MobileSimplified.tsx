/**
 * Mobile-optimized cover letter form with full functionality
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw, Bookmark, FileText, Palette, Lightbulb, ChevronDown, ChevronUp, Building2, MapPin, Briefcase, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PromptButtons } from './PromptButtons'
import { WordCounter } from './WordCounter'
import { coverLetterTemplates } from './CoverLetterTemplates'
import type { CoverLetterTemplate } from './CoverLetterTemplates'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

type Step = 'company' | 'job' | 'details' | 'review'

interface MobileSimplifiedProps {
  company: string
  jobTitle: string
  jobAd: string
  letter: string
  extraKeywords: string
  ton: 'professionell' | 'entusiastisk' | 'formell'
  selectedTemplate: string
  savedLettersCount: number
  savedJobsCount: number
  savedJobs: PlatsbankenJob[]
  isGenerating: boolean
  hasCV: boolean
  onCompanyChange: (value: string) => void
  onJobTitleChange: (value: string) => void
  onJobAdChange: (value: string) => void
  onExtraKeywordsChange: (value: string) => void
  onLetterChange: (value: string) => void
  onTonChange: (ton: 'professionell' | 'entusiastisk' | 'formell') => void
  onTemplateChange: (templateId: string) => void
  onLoadJob: (job: PlatsbankenJob) => void
  onGenerate: () => void
  onSave?: () => void
  onShowSavedLetters: () => void
}

export function MobileSimplified({
  company,
  jobTitle,
  jobAd,
  letter,
  extraKeywords,
  ton,
  selectedTemplate,
  savedLettersCount,
  savedJobsCount,
  savedJobs,
  isGenerating,
  hasCV,
  onCompanyChange,
  onJobTitleChange,
  onJobAdChange,
  onExtraKeywordsChange,
  onLetterChange,
  onTonChange,
  onTemplateChange,
  onLoadJob,
  onGenerate,
  onSave,
  onShowSavedLetters
}: MobileSimplifiedProps) {
  const [step, setStep] = useState<Step>('company')
  const [tempLetter, setTempLetter] = useState(letter)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSavedJobs, setShowSavedJobs] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const templates = coverLetterTemplates
  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'company', title: 'Företag', description: 'Vilket företag söker du till?' },
    { id: 'job', title: 'Tjänst', description: 'Vilken tjänst gäller det?' },
    { id: 'details', title: 'Detaljer', description: 'Anpassa ditt brev' },
    { id: 'review', title: 'Granska', description: 'Ditt personliga brev' },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id)
    }
  }

  const handleInsertPrompt = (text: string) => {
    const newText = tempLetter ? `${tempLetter}\n\n${text}` : text
    setTempLetter(newText)
    onLetterChange(newText)
  }

  const handleLoadJobAndClose = (job: PlatsbankenJob) => {
    onLoadJob(job)
    setShowSavedJobs(false)
    setStep('details')
  }

  const handleSaveLetter = async () => {
    if (!onSave || !tempLetter.trim()) return
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'company': return company.length > 0
      case 'job': return jobTitle.length > 0
      case 'details': return jobAd.length > 10 || hasCV
      case 'review': return true
      default: return false
    }
  }

  const getTonLabel = (t: string) => {
    switch (t) {
      case 'professionell': return 'Professionell'
      case 'entusiastisk': return 'Entusiastisk'
      case 'formell': return 'Formell'
      default: return 'Professionell'
    }
  }

  // Visa sparade jobb som fullskärmsvy
  if (showSavedJobs) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Välj ett sparat jobb</h3>
            <button
              onClick={() => setShowSavedJobs(false)}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1"
            >
              Stäng
            </button>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {savedJobs.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">Inga sparade jobb ännu</p>
            ) : (
              savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <h4 className="font-medium text-slate-900">{job.headline}</h4>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {job.employer?.name}
                  </p>
                  {job.workplace_address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {job.workplace_address.municipality}
                    </p>
                  )}
                  <button
                    onClick={() => handleLoadJobAndClose(job)}
                    className="mt-3 w-full py-2.5 px-3 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Använd detta jobb
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Steps -->
      <div className="flex items-center justify-between px-2">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                transition-colors duration-300
                ${step === s.id ? 'bg-teal-500 text-white' : 
                  index < currentStepIndex ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}
              `}
            >
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-4 h-0.5 mx-1 ${index < currentStepIndex ? 'bg-teal-300' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons Row - alltid synlig */}
      <div className="flex gap-2">
        <button
          onClick={onShowSavedLetters}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors border border-slate-200"
        >
          <Bookmark className="w-4 h-4" />
          {savedLettersCount} brev
        </button>
        <button
          onClick={() => setShowSavedJobs(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors border border-slate-200"
        >
          <Briefcase className="w-4 h-4" />
          {savedJobsCount} jobb
        </button>
      </div>

      {/* CV Status */}
      {hasCV && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
          <FileText className="w-4 h-4" />
          Ditt CV kommer användas för att skräddarsy brevet
        </div>
      )}

      {/* Current Step Title */}
      <div className="text-center pt-2">
        <h3 className="font-semibold text-slate-800">{steps[currentStepIndex].title}</h3>
        <p className="text-sm text-slate-500">{steps[currentStepIndex].description}</p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        {step === 'company' && (
          <div className="space-y-4">
            {/* Sparade jobb - högst upp i steg 1 - ALLTID SYNLIG */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Hämta från sparade jobb:</p>
              <button
                onClick={() => setShowSavedJobs(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-sm font-medium transition-colors border border-teal-200"
              >
                <Briefcase className="w-4 h-4" />
                Välj bland {savedJobsCount} sparade jobb
              </button>
              <p className="text-xs text-slate-500">
                Eller fyll i manuellt nedan:
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Företagsnamn</label>
              <input
                type="text"
                value={company}
                onChange={(e) => onCompanyChange(e.target.value)}
                placeholder="t.ex. Acme AB"
                className="w-full px-4 py-3 text-lg rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                autoFocus
              />
            </div>
            <p className="text-sm text-slate-500">
              Tips: Kolla företagets webbplats för rätt namn
            </p>
          </div>
        )}

        {step === 'job' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jobbtitel</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => onJobTitleChange(e.target.value)}
                placeholder="t.ex. Projektledare"
                className="w-full px-4 py-3 text-lg rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Vanliga titlar:</p>
              <div className="flex flex-wrap gap-2">
                {['Kundservicemedarbetare', 'Säljare', 'Lagerarbetare', 'Administratör', 'Projektledare'].map(title => (
                  <button
                    key={title}
                    onClick={() => onJobTitleChange(title)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-sm rounded-full transition-colors"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-5">
            {/* Vald jobbinfo */}
            {(company || jobTitle) && (
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                <p className="text-xs text-teal-600 font-medium uppercase">Valt jobb:</p>
                <p className="font-medium text-slate-800">{jobTitle}</p>
                {company && <p className="text-sm text-slate-600">{company}</p>}
              </div>
            )}
            
            {/* Job Ad */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                <span>Jobbannons</span>
                {jobAd.length > 0 && (
                  <span className="text-xs text-emerald-600 font-normal">
                    ✓ {jobAd.length} tecken
                  </span>
                )}
              </label>
              <textarea
                value={jobAd}
                onChange={(e) => onJobAdChange(e.target.value)}
                placeholder="Klistra in jobbannonsen här..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
              />
              <p className="text-xs text-slate-500">
                Ju mer information du ger, desto bättre blir brevet
              </p>
            </div>

            {/* Extra Keywords */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Extra nyckelord/intressen <span className="text-slate-400 font-normal">(valfritt)</span>
              </label>
              <textarea
                value={extraKeywords}
                onChange={(e) => onExtraKeywordsChange(e.target.value)}
                placeholder="T.ex. certifieringar, mjuka kompetenser, specifika verktyg..."
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
              />
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Ton i brevet
              </label>
              <div className="flex gap-2">
                {(['professionell', 'entusiastisk', 'formell'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onTonChange(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      ton === t
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {getTonLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {selectedTemplateObj?.label || 'Välj mall'}
                </span>
                {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showTemplates && (
                <div className="space-y-2 mt-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onTemplateChange(template.id)
                        setShowTemplates(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-800">{template.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <PromptButtons 
              type="motivation" 
              onSelect={(text) => onJobAdChange(jobAd + ' ' + text)} 
            />
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            {letter ? (
              <>
                <textarea
                  value={tempLetter}
                  onChange={(e) => {
                    setTempLetter(e.target.value)
                    onLetterChange(e.target.value)
                  }}
                  placeholder="Ditt personliga brev visas här..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-y"
                />
                
                <WordCounter 
                  text={tempLetter} 
                  compact 
                  showProgress
                />
                
                <PromptButtons 
                  type="opening" 
                  onSelect={handleInsertPrompt} 
                />
                <PromptButtons 
                  type="closing" 
                  onSelect={handleInsertPrompt} 
                />

                {/* Save Button */}
                {onSave && (
                  <button
                    onClick={handleSaveLetter}
                    disabled={isSaving || !tempLetter.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Spara brev
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-600">Inget brev skapat ännu</p>
                  <p className="text-sm text-slate-500">Gå tillbaka till steg 3 och klicka på "Skapa med AI"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentStepIndex > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 py-3 text-base"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Tillbaka
          </Button>
        )}
        
        {currentStepIndex < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 text-base bg-teal-500 hover:bg-teal-600"
          >
            Nästa
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={isGenerating || (!letter && (jobAd.length < 10 && !hasCV))}
            className="flex-1 py-3 text-base bg-teal-500 hover:bg-teal-600"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-5 h-5 mr-1 animate-spin" />
                Skapar...
              </>
            ) : letter ? (
              <>
                <Sparkles className="w-5 h-5 mr-1" />
                Skapa nytt brev
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-1" />
                Skapa med AI
              </>
            )}
          </Button>
        )}
      </div>

      {/* Helper text */}
      {step === 'details' && (
        <p className="text-xs text-center text-slate-500">
          AI:n använder din jobbannons och CV för att skapa ett skräddarsytt brev
        </p>
      )}
    </div>
  )
}
