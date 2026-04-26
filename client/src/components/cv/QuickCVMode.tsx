/**
 * QuickCVMode - Snabbstart för CV
 * Minimalt formulär (3 fält) som genererar ett grundläggande CV
 * Perfekt för användare som känner sig överväldigade av full CV-byggaren
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Zap, ArrowRight, User, Briefcase, Mail, Phone,
  Check, Sparkles, ChevronRight, Loader2
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { CVData } from '@/services/supabaseApi'

interface QuickCVModeProps {
  onComplete: (data: Partial<CVData>) => void
  onSwitchToFull: () => void
  className?: string
}

interface QuickFormData {
  fullName: string
  jobTitle: string
  email: string
  phone: string
}

// Generera en grundläggande sammanfattning baserat på jobbtitel
function generateQuickSummary(jobTitle: string): string {
  const title = jobTitle.toLowerCase()

  if (title.includes('utvecklare') || title.includes('programmerare')) {
    return 'Engagerad utvecklare med passion för att skapa användarvänliga lösningar. Trivs med att lösa komplexa problem och lära mig nya tekniker.'
  }
  if (title.includes('projektledare') || title.includes('chef')) {
    return 'Resultatinriktad ledare med erfarenhet av att driva projekt från idé till leverans. Stark kommunikatör som motiverar team att nå sina mål.'
  }
  if (title.includes('säljare') || title.includes('försäljning')) {
    return 'Driven säljare med passion för att bygga långsiktiga kundrelationer. Motiveras av att överträffa mål och hitta lösningar som skapar värde.'
  }
  if (title.includes('administratör') || title.includes('assistent')) {
    return 'Strukturerad och serviceinriktad med erfarenhet av administrativa uppgifter. Trivs med att skapa ordning och stödja kollegor i deras arbete.'
  }
  if (title.includes('lärare') || title.includes('pedagog')) {
    return 'Engagerad pedagog med passion för att inspirera och stödja lärande. Skapar inkluderande miljöer där alla kan utvecklas.'
  }

  // Default
  return `Motiverad ${jobTitle.toLowerCase()} som söker nya utmaningar. Bidrar med engagemang, pålitlighet och vilja att utvecklas i min roll.`
}

// Generera grundläggande skills baserat på jobbtitel
function generateQuickSkills(jobTitle: string): CVData['skills'] {
  const title = jobTitle.toLowerCase()
  const baseSkills = [
    { id: '1', name: 'Kommunikation', level: 4, category: 'soft' as const },
    { id: '2', name: 'Samarbete', level: 4, category: 'soft' as const },
    { id: '3', name: 'Problemlösning', level: 3, category: 'soft' as const },
  ]

  if (title.includes('utvecklare') || title.includes('programmerare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Programmering', level: 4, category: 'technical' as const },
      { id: '5', name: 'Felsökning', level: 4, category: 'technical' as const },
    ]
  }
  if (title.includes('projektledare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Projektledning', level: 4, category: 'technical' as const },
      { id: '5', name: 'Planering', level: 4, category: 'technical' as const },
    ]
  }
  if (title.includes('säljare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Försäljning', level: 4, category: 'technical' as const },
      { id: '5', name: 'Kundrelationer', level: 4, category: 'technical' as const },
    ]
  }

  return baseSkills
}

export function QuickCVMode({ onComplete, onSwitchToFull, className }: QuickCVModeProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<QuickFormData>({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      id: 'name',
      label: t('cv.quickMode.steps.name', 'Ditt namn'),
      icon: User,
      field: 'fullName' as const,
      placeholder: t('cv.quickMode.placeholders.name', 'Anna Andersson'),
      type: 'text'
    },
    {
      id: 'title',
      label: t('cv.quickMode.steps.title', 'Vad jobbar du som?'),
      icon: Briefcase,
      field: 'jobTitle' as const,
      placeholder: t('cv.quickMode.placeholders.title', 't.ex. Projektledare, Säljare, Utvecklare'),
      type: 'text'
    },
    {
      id: 'contact',
      label: t('cv.quickMode.steps.contact', 'Kontaktuppgifter'),
      icon: Mail,
      field: 'email' as const,
      placeholder: t('cv.quickMode.placeholders.email', 'din.email@exempel.se'),
      type: 'email'
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const canProceed = currentStep === 2
    ? formData.email.includes('@')
    : formData[currentStepData?.field]?.trim().length > 0

  const handleNext = () => {
    if (isLastStep) {
      generateCV()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) {
      handleNext()
    }
  }

  const generateCV = () => {
    setIsGenerating(true)

    // Simulera generation
    setTimeout(() => {
      const [firstName, ...lastParts] = formData.fullName.trim().split(' ')
      const lastName = lastParts.join(' ')

      const cvData: Partial<CVData> = {
        firstName: firstName || '',
        lastName: lastName || '',
        title: formData.jobTitle,
        email: formData.email,
        phone: formData.phone,
        summary: generateQuickSummary(formData.jobTitle),
        skills: generateQuickSkills(formData.jobTitle),
        template: 'minimal', // Enkel mall för quick CV
        workExperience: [],
        education: [],
        languages: [{ id: '1', language: 'Svenska', level: 'native' }],
        certificates: [],
        links: [],
        references: []
      }

      setIsGenerating(false)
      onComplete(cvData)
    }, 1500)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn(
      "bg-gradient-to-br from-brand-700 to-sky-500 rounded-xl p-6 sm:p-8 text-white",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            {t('cv.quickMode.title', 'Snabb-CV')}
          </h2>
          <p className="text-white/80 text-sm">
            {t('cv.quickMode.subtitle', 'Skapa ett grundläggande CV på 30 sekunder')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/80">
            {t('cv.quickMode.step', 'Steg')} {currentStep + 1} {t('cv.quickMode.of', 'av')} {steps.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current step */}
      {!isGenerating ? (
        <div className="space-y-4">
          {/* Step indicator icons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isComplete = i < currentStep
              const isCurrent = i === currentStep

              return (
                <div
                  key={step.id}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isComplete
                      ? "bg-white text-brand-900"
                      : isCurrent
                        ? "bg-white/30 ring-2 ring-white"
                        : "bg-white/10"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Current field */}
          <div>
            <label
              htmlFor={`quick-${currentStepData.field}`}
              className="block text-lg font-medium mb-3"
            >
              {currentStepData.label}
            </label>

            {currentStep === 2 ? (
              // Contact step has two fields
              <div className="space-y-3">
                <input
                  id="quick-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder={currentStepData.placeholder}
                  className="w-full px-4 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-white/60" />
                  <input
                    id="quick-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    placeholder={t('cv.quickMode.placeholders.phone', '070-123 45 67 (valfritt)')}
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>
            ) : (
              <input
                id={`quick-${currentStepData.field}`}
                type={currentStepData.type}
                value={formData[currentStepData.field]}
                onChange={(e) => setFormData(prev => ({ ...prev, [currentStepData.field]: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder={currentStepData.placeholder}
                className="w-full px-4 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                autoFocus
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                "bg-white text-brand-900 hover:bg-white/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-700"
              )}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t('cv.quickMode.generate', 'Skapa mitt CV')}
                </>
              ) : (
                <>
                  {t('cv.quickMode.next', 'Nästa')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Switch to full mode */}
          <button
            onClick={onSwitchToFull}
            className="w-full py-3 text-white/80 hover:text-white transition-colors text-sm flex items-center justify-center gap-1"
          >
            {t('cv.quickMode.switchToFull', 'Vill du ha mer kontroll?')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Generating state
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {t('cv.quickMode.generating', 'Skapar ditt CV...')}
          </h3>
          <p className="text-white/80">
            {t('cv.quickMode.generatingHint', 'Vi genererar en professionell sammanfattning åt dig')}
          </p>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <p className="text-xs text-white/60 text-center">
          {t('cv.quickMode.benefits', 'Du kan alltid utöka och anpassa ditt CV efteråt')}
        </p>
      </div>
    </div>
  )
}

export default QuickCVMode
