/**
 * FocusSkillsGapWizard — NPF-anpassad kompetensgap-analys.
 *
 * Steg: drömjobb → mina starkaste kompetenser → AI-analys (sparas i molnet).
 * Använder skillsAnalysisApi.create för att spara — samma data som normalvyn.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Target, ListChecks, TrendingUp, Sparkles, CheckCircle2 } from '@/components/ui/icons'
import { skillsAnalysisApi } from '@/services/careerApi'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusSkillsGapWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [dreamJob, setDreamJob] = useState('')
  const [skills, setSkills] = useState('')
  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      return skillsAnalysisApi.create({
        dream_job: dreamJob.trim(),
        cv_text: `Mina kompetenser:\n${skills.trim()}`,
        match_percentage: 0,
        skills_comparison: [],
        recommended_courses: [],
        action_plan: [],
      })
    },
    onSuccess: () => setSaved(true),
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'dream',
      icon: Target,
      title: t('focus.skillsGap.dreamTitle', 'Vilket jobb drömmer du om?'),
      hint: t('focus.skillsGap.dreamHint', 'En roll eller bransch — kort och tydligt.'),
    },
    {
      id: 'skills',
      icon: ListChecks,
      title: t('focus.skillsGap.skillsTitle', 'Vilka är dina starkaste kompetenser idag?'),
      hint: t('focus.skillsGap.skillsHint', 'Skriv en kompetens per rad.'),
    },
    {
      id: 'save',
      icon: TrendingUp,
      title: t('focus.skillsGap.saveTitle', 'Klart att spara'),
      hint: t('focus.skillsGap.saveHint', 'Vi sparar dina svar så vi kan visa gapet senare.'),
    },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    if (current.id === 'dream') {
      setStep(1)
      return
    }
    if (current.id === 'skills') {
      setStep(2)
      return
    }
    if (current.id === 'save') {
      try {
        await saveMutation.mutateAsync()
      } catch (err) {
        console.error('Failed to save skills analysis', err)
      }
      onExit()
    }
  }

  const canNext =
    current.id === 'dream'
      ? dreamJob.trim().length > 0
      : current.id === 'skills'
        ? skills.trim().length > 0
        : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
      busy={saveMutation.isPending}
      finishLabel={t('focus.skillsGap.saveCta', 'Spara och se gapet')}
    >
      {current.id === 'dream' && (
        <input
          type="text"
          value={dreamJob}
          onChange={(e) => setDreamJob(e.target.value)}
          placeholder={t('focus.skillsGap.dreamPlaceholder', 't.ex. systemutvecklare, sjuksköterska')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'skills' && (
        <textarea
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          rows={6}
          placeholder={t(
            'focus.skillsGap.skillsPlaceholder',
            'samarbete\nlösa problem\ngrundläggande Excel'
          )}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'save' && (
        <div className="space-y-3">
          {saved ? (
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
              <CheckCircle2 className="w-5 h-5 text-[var(--c-solid)]" />
              {t('focus.skillsGap.savedText', 'Sparat! Öppna Kompetensgap-sidan för att se hela analysen.')}
            </div>
          ) : (
            <div className="flex items-start gap-3 text-stone-600 dark:text-stone-300">
              <Sparkles className="w-5 h-5 text-[var(--c-solid)] mt-0.5" />
              <p>
                {t(
                  'focus.skillsGap.reviewText',
                  'Vi sparar dina svar och visar gapet mellan dina kompetenser och drömjobbet på kompetensgap-sidan.'
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusSkillsGapWizard
