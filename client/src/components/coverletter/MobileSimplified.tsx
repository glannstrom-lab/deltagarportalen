/**
 * Mobile-optimized simplified cover letter form
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PromptButtons } from './PromptButtons'
import { WordCounter } from './WordCounter'

type Step = 'company' | 'job' | 'why' | 'review'

interface MobileSimplifiedProps {
  company: string
  jobTitle: string
  jobAd: string
  letter: string
  onCompanyChange: (value: string) => void
  onJobTitleChange: (value: string) => void
  onJobAdChange: (value: string) => void
  onLetterChange: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function MobileSimplified({
  company,
  jobTitle,
  jobAd,
  letter,
  onCompanyChange,
  onJobTitleChange,
  onJobAdChange,
  onLetterChange,
  onGenerate,
  isGenerating
}: MobileSimplifiedProps) {
  const [step, setStep] = useState<Step>('company')
  const [tempLetter, setTempLetter] = useState(letter)

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'company', title: 'Företag', description: 'Vilket företag söker du till?' },
    { id: 'job', title: 'Tjänst', description: 'Vilken tjänst gäller det?' },
    { id: 'why', title: 'Varför', description: 'Vad lockar dig med jobbet?' },
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

  const canProceed = () => {
    switch (step) {
      case 'company': return company.length > 0
      case 'job': return jobTitle.length > 0
      case 'why': return jobAd.length > 10
      case 'review': return true
      default: return false
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
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

      {/* Current Step Title */}
      <div className="text-center">
        <h3 className="font-semibold text-slate-800">{steps[currentStepIndex].title}</h3>
        <p className="text-sm text-slate-500">{steps[currentStepIndex].description}</p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        {step === 'company' && (
          <div className="space-y-4">
            <input
              type="text"
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
              placeholder="t.ex. Acme AB"
              className="w-full px-4 py-3 text-lg rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
              autoFocus
            />
            <p className="text-sm text-slate-500">
              Tips: Kolla företagets webbplats för rätt namn
            </p>
          </div>
        )}

        {step === 'job' && (
          <div className="space-y-4">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => onJobTitleChange(e.target.value)}
              placeholder="t.ex. Projektledare"
              className="w-full px-4 py-3 text-lg rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
              autoFocus
            />
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

        {step === 'why' && (
          <div className="space-y-4">
            <textarea
              value={jobAd}
              onChange={(e) => onJobAdChange(e.target.value)}
              placeholder="Klistra in jobbannonsen eller skriv vad som lockar dig..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
              autoFocus
            />
            <PromptButtons 
              type="motivation" 
              onSelect={(text) => onJobAdChange(jobAd + ' ' + text)} 
            />
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
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
            disabled={isGenerating || tempLetter.length < 50}
            className="flex-1 py-3 text-base bg-teal-500 hover:bg-teal-600"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-5 h-5 mr-1 animate-spin" />
                Skapar...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-1" />
                Förbättra med AI
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
