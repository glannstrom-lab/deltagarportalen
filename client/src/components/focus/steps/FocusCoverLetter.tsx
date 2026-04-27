/**
 * FocusCoverLetter - Förenklat personligt brev för fokusläget
 * Guidad steg-för-steg process för att skapa och spara personligt brev
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { coverLetterApi } from '@/services/supabaseApi'
import { coverLetterTemplates, type CoverLetterTemplate } from '@/data/coverLetterTemplates'
import {
  Mail, Briefcase, Heart, Sparkles, FileText, Save,
  ArrowRight, Check, Loader2, SkipForward, Copy, CheckCircle2
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusCoverLetterProps {
  onComplete: () => void
  onSkip: () => void
  onBack: () => void
}

const LETTER_STEPS = [
  { id: 'job', icon: Briefcase, titleKey: 'focusGuide.letter.jobStep', titleDefault: 'Vilket jobb söker du?' },
  { id: 'template', icon: FileText, titleKey: 'focusGuide.letter.templateStep', titleDefault: 'Välj en mall' },
  { id: 'motivation', icon: Heart, titleKey: 'focusGuide.letter.motivationStep', titleDefault: 'Varför vill du ha jobbet?' },
  { id: 'generate', icon: Sparkles, titleKey: 'focusGuide.letter.generateStep', titleDefault: 'Ditt personliga brev' },
] as const

const MOTIVATION_SUGGESTIONS = [
  'Jag brinner för att hjälpa människor',
  'Jag trivs med att lösa problem',
  'Jag gillar att arbeta i team',
  'Jag vill utvecklas och lära mig nya saker',
  'Jag uppskattar varierande arbetsuppgifter',
  'Jag tycker om att ta ansvar'
]

// Simplified template options for focus mode
const SIMPLE_TEMPLATES = [
  { id: 'standard', name: 'Standard', description: 'Professionell och balanserad', icon: FileText },
  { id: 'short', name: 'Kort & Koncis', description: 'Max 150 ord - rak på sak', icon: FileText },
  { id: 'formal', name: 'Formell', description: 'Traditionell ton', icon: FileText },
]

export function FocusCoverLetter({ onComplete, onSkip, onBack }: FocusCoverLetterProps) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)

  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard')
  const [motivations, setMotivations] = useState<string[]>([])
  const [customMotivation, setCustomMotivation] = useState('')
  const [generatedLetter, setGeneratedLetter] = useState('')
  const [letterTitle, setLetterTitle] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const step = LETTER_STEPS[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === LETTER_STEPS.length - 1
  const progress = ((currentStep + 1) / LETTER_STEPS.length) * 100

  // Get full template data
  const selectedTemplate = coverLetterTemplates.find(t => t.id === selectedTemplateId)

  // Generate letter based on template
  const generateLetter = (template: CoverLetterTemplate | undefined) => {
    const name = profile?.first_name || 'Jag'
    const lastName = profile?.last_name || ''
    const motivationText = motivations.length > 0
      ? motivations.join('. ') + '.'
      : 'Jag är motiverad och engagerad.'

    if (template?.id === 'short') {
      return `Hej,

Jag söker tjänsten som ${jobTitle}${companyName ? ` hos ${companyName}` : ''}.

${motivationText}

Jag finns tillgänglig för intervju och kan börja omgående.

Med vänliga hälsningar,
${name} ${lastName}`.trim()
    }

    if (template?.id === 'formal') {
      return `Till ansvarig rekryterare,

Jag vill härmed ansöka om tjänsten som ${jobTitle}${companyName ? ` vid ${companyName}` : ''}.

${motivationText}

Med min bakgrund och erfarenhet anser jag mig vara en lämplig kandidat för denna befattning. Jag är en noggrann och pålitlig person som alltid strävar efter att leverera högkvalitativt arbete.

Jag ser med intresse fram emot möjligheten att få diskutera min ansökan vid en intervju.

Högaktningsfullt,
${name} ${lastName}`.trim()
    }

    // Standard template
    return `Hej!

Jag skriver för att söka tjänsten som ${jobTitle}${companyName ? ` hos ${companyName}` : ''}.

${motivationText}

Med min bakgrund och erfarenhet tror jag att jag skulle passa bra för denna roll. Jag är en pålitlig person som alltid gör mitt bästa och trivs med att arbeta både självständigt och i team.

Jag ser fram emot att höra från er och berättar gärna mer vid en intervju!

Vänliga hälsningar,
${name} ${lastName}`.trim()
  }

  // Generate letter mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return generateLetter(selectedTemplate)
    }
  })

  // Save letter mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const title = letterTitle.trim() || `${jobTitle}${companyName ? ` - ${companyName}` : ''}`

      await coverLetterApi.create({
        title,
        content: generatedLetter,
        company: companyName || null,
        job_title: jobTitle,
        ai_generated: false
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] })
      setIsSaved(true)
    }
  })

  const toggleMotivation = (motivation: string) => {
    setMotivations(prev =>
      prev.includes(motivation)
        ? prev.filter(m => m !== motivation)
        : [...prev, motivation]
    )
  }

  const addCustomMotivation = () => {
    if (customMotivation.trim() && !motivations.includes(customMotivation.trim())) {
      setMotivations(prev => [...prev, customMotivation.trim()])
      setCustomMotivation('')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync()
    } catch (error) {
      console.error('Failed to save letter:', error)
    }
  }

  const handleNext = async () => {
    if (step.id === 'motivation') {
      // Generate letter when moving to generate step
      try {
        const letter = await generateMutation.mutateAsync()
        setGeneratedLetter(letter)
        setLetterTitle(`${jobTitle}${companyName ? ` - ${companyName}` : ''}`)
        setCurrentStep(prev => prev + 1)
      } catch (error) {
        console.error('Failed to generate letter:', error)
      }
    } else if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && step.id === 'job') {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-teal-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusGuide.letter.title', 'Personligt brev')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          {t('focusGuide.letter.subtitle', 'Skapa ett enkelt personligt brev')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {t('focusGuide.stepOf', 'Steg {{current}} av {{total}}', {
              current: currentStep + 1,
              total: LETTER_STEPS.length
            })}
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {LETTER_STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === currentStep
            const isDone = i < currentStep

            return (
              <div
                key={s.id}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-teal-500 text-white ring-4 ring-teal-500/20',
                  isDone && 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',
                  !isActive && !isDone && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current step form */}
      <div className="bg-white dark:bg-stone-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t(step.titleKey, step.titleDefault)}
          </h3>
        </div>

        {/* Job step */}
        {step.id === 'job' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="job-title"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
              >
                {t('focusGuide.letter.jobTitle', 'Tjänst/Roll')}
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('focusGuide.letter.jobTitlePlaceholder', 't.ex. Säljare, Kundtjänstmedarbetare')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="company-name"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
              >
                {t('focusGuide.letter.companyName', 'Företag')}
                <span className="text-stone-400 ml-1">({t('common.optional', 'valfritt')})</span>
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('focusGuide.letter.companyPlaceholder', 'Företagsnamn')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>
        )}

        {/* Template step */}
        {step.id === 'template' && (
          <div className="space-y-3">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              {t('focusGuide.letter.selectTemplate', 'Välj en stil för ditt brev:')}
            </p>

            {SIMPLE_TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id
              const Icon = template.icon

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-teal-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    )}>
                      {isSelected ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className={cn(
                        'font-medium',
                        isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-stone-800 dark:text-stone-100'
                      )}>
                        {template.name}
                      </h4>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Motivation step */}
        {step.id === 'motivation' && (
          <div className="space-y-4">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              {t('focusGuide.letter.selectMotivations', 'Välj det som passar dig:')}
            </p>

            {/* Selected motivations */}
            {motivations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {motivations.map((motivation) => (
                  <button
                    key={motivation}
                    onClick={() => toggleMotivation(motivation)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-full text-sm"
                  >
                    {motivation}
                    <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Motivation suggestions */}
            <div className="flex flex-wrap gap-2">
              {MOTIVATION_SUGGESTIONS.map((suggestion) => (
                !motivations.includes(suggestion) && (
                  <button
                    key={suggestion}
                    onClick={() => toggleMotivation(suggestion)}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full text-sm hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/50 dark:hover:text-teal-300 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                )
              ))}
            </div>

            {/* Custom motivation */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={customMotivation}
                onChange={(e) => setCustomMotivation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomMotivation()
                  }
                }}
                placeholder={t('focusGuide.letter.customMotivation', 'Skriv egen motivation...')}
                className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <button
                onClick={addCustomMotivation}
                disabled={!customMotivation.trim()}
                className="px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Generate step */}
        {step.id === 'generate' && (
          <div className="space-y-4">
            {generateMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              </div>
            ) : generatedLetter ? (
              <>
                {/* Title input */}
                <div>
                  <label
                    htmlFor="letter-title"
                    className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
                  >
                    {t('focusGuide.letter.letterTitle', 'Namn på brevet')}
                  </label>
                  <input
                    id="letter-title"
                    type="text"
                    value={letterTitle}
                    onChange={(e) => setLetterTitle(e.target.value)}
                    placeholder={t('focusGuide.letter.letterTitlePlaceholder', 't.ex. Ansökan Säljare - IKEA')}
                    className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>

                {/* Letter content */}
                <div className="relative">
                  <textarea
                    value={generatedLetter}
                    onChange={(e) => setGeneratedLetter(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    title={t('common.copy', 'Kopiera')}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-teal-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-stone-500" />
                    )}
                  </button>
                </div>

                {/* Save button */}
                {isSaved ? (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{t('focusGuide.letter.saved', 'Brevet är sparat!')}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !generatedLetter.trim()}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium transition-all',
                      'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
                      'hover:bg-stone-200 dark:hover:bg-stone-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('common.saving', 'Sparar...')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('focusGuide.letter.saveButton', 'Spara brevet')}
                      </>
                    )}
                  </button>
                )}

                <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                  {t('focusGuide.letter.editHint', 'Du kan redigera texten ovan. Klicka på kopieringsknappen för att kopiera.')}
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                <p className="text-stone-500 dark:text-stone-400">
                  {t('focusGuide.letter.generateError', 'Något gick fel. Försök igen.')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          disabled={generateMutation.isPending || (step.id === 'job' && !jobTitle.trim())}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-teal-500 text-white hover:bg-teal-600',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('focusGuide.letter.generating', 'Skapar brev...')}
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-5 h-5" />
              {t('focusGuide.letter.done', 'Klar!')}
            </>
          ) : step.id === 'motivation' ? (
            <>
              <Sparkles className="w-5 h-5" />
              {t('focusGuide.letter.generate', 'Skapa brev')}
            </>
          ) : (
            <>
              {t('common.next', 'Nästa')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          {t('focusGuide.skipStep', 'Hoppa över detta steg')}
        </button>
      </div>
    </div>
  )
}
