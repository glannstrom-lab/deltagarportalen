/**
 * FocusSkillsGapWizard — samlar in drömjobb och kompetenser i fokusläge.
 *
 * VAD DEN INTE GÖR: den kör ingen analys. Fram till 2026-08-21 skrev den en
 * rad i `skills_analyses` med `match_percentage: 0` och tomma
 * `skills_comparison`, `recommended_courses` och `action_plan`. Eftersom
 * sidan laddar senaste posten och renderar resultatvyn för den, blev följden:
 *
 *   · rubriken "Din analys är klar" och en cirkel med **0 %** matchning mot
 *     drömjobbet, med `role="progressbar"` och `aria-valuenow={0}` — ett
 *     tal utan mätning, uppläst för en deltagare som redan söker jobb efter
 *     lång tid;
 *   · `AIGeneratedWatermark` ovanpå det, alltså ett intyg om AI-ursprung för
 *     något användaren själv skrivit. Fel märkning åt det håll AI Act
 *     art. 50.2 inte tillåter;
 *   · och sidan kunde låsa sig: "Ny analys" låg inuti handlingsplanskortet,
 *     som inte renderas när planen är tom.
 *
 * Inga sådana rader hann skapas i prod (kontrollerat 2026-08-21: fyra rader,
 * alla riktiga analyser). Defekten var armerad, inte utlöst.
 *
 * Nu sparas drömjobbet där det hör hemma — `profiles.desired_jobs` — och
 * sidan förifyller fältet därifrån. Guiden samlar in; analysen görs där den
 * kan göras.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Target, ListChecks, TrendingUp, Sparkles, CheckCircle2 } from '@/components/ui/icons'
import { userApi } from '@/services/userApi'
import { showToast } from '@/components/Toast'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
  /** Skickar drömjobbet vidare till normalvyns fält. Ett barn kan inte
   *  lyfta tillstånd uppåt av sig självt, och användaren fick tidigare
   *  skriva samma sak två gånger. */
  onTaMedDromjobb?: (yrke: string) => void
}

export function FocusSkillsGapWizard({ onExit, onTaMedDromjobb }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [dreamJob, setDreamJob] = useState('')
  const [skills, setSkills] = useState('')
  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dromjobb = dreamJob.trim()
      const kompetenser = skills.trim()
      const befintliga = await userApi.getPreferences()

      const redanSparat = (befintliga?.desired_jobs ?? []).some(
        (j) => j.label.toLowerCase() === dromjobb.toLowerCase()
      )

      await userApi.updatePreferences({
        desired_jobs: redanSparat
          ? befintliga?.desired_jobs
          : [
              ...(befintliga?.desired_jobs ?? []),
              { label: dromjobb, priority: (befintliga?.desired_jobs?.length ?? 0) + 1 },
            ],
        // Kompetenserna hamnar bland intressena — samma fält som
        // fokuslägets intresseguide skriver till.
        interests: [...new Set([...(befintliga?.interests ?? []), ...kompetenser.split('\n').map((r) => r.trim()).filter(Boolean)])],
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
      hint: t('focus.skillsGap.saveHint', 'Vi sparar dina svar till din profil.'),
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
      // Stängde tidigare oavsett utfall, med "Sparat!" på skärmen.
      try {
        await saveMutation.mutateAsync()
        onTaMedDromjobb?.(dreamJob.trim())
        onExit()
      } catch (err) {
        console.error('Failed to save skills analysis', err)
        showToast.error(t('focus.skillsGap.saveFailed', 'Kunde inte spara det du skrev. Försök igen.'))
      }
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
      finishLabel={t('focus.skillsGap.saveCta', 'Spara och gå vidare')}
    >
      {current.id === 'dream' && (
        <input
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
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
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
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
              {t('focus.skillsGap.savedText', 'Sparat. När du orkar kan du öppna Kompetensanalysen i normalläge — drömjobbet är redan ifyllt där.')}
            </div>
          ) : (
            <div className="flex items-start gap-3 text-stone-600 dark:text-stone-300">
              <Sparkles className="w-5 h-5 text-[var(--c-solid)] mt-0.5" />
              <p>
                {t(
                  'focus.skillsGap.reviewText',
                  'Vi sparar det du skrivit till din profil. Själva jämförelsen mot drömjobbet görs på Kompetensanalysen i normalläge — den behöver ditt CV.'
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
