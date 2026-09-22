/**
 * FocusDiaryWizard — NPF-anpassad dagboksanteckning.
 *
 * Steg: vad hände idag → hur kändes det → en sak imorgon → spara.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { NotebookPen, Heart, Sun, CheckCircle2, AlertCircle } from '@/components/ui/icons'
import { diaryEntriesApi } from '@/services/diaryApi'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'
import { formatLocalDate } from '@/services/aktivitetSchema'

interface Props {
  onExit: () => void
}

export function FocusDiaryWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [happened, setHappened] = useState('')
  const [feeling, setFeeling] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [saved, setSaved] = useState(false)
  /** Sant när sparningen nekats. Guiden stängs då inte — texten finns kvar. */
  const [sparfel, setSparfel] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = [
        happened.trim() ? `Idag: ${happened.trim()}` : '',
        feeling.trim() ? `Kändes: ${feeling.trim()}` : '',
        tomorrow.trim() ? `Imorgon: ${tomorrow.trim()}` : '',
      ].filter(Boolean).join('\n\n')
      const rad = await diaryEntriesApi.create({
        title: t('focus.diary.entryTitle', 'Fokusläge-incheckning'),
        content,
        mood: null,
        energy_level: null,
        tags: [],
        word_count: content.split(/\s+/).filter(Boolean).length,
        entry_date: formatLocalDate(new Date()),
        entry_type: 'diary',
        is_favorite: false,
      })
      // diaryEntriesApi.create KASTAR INTE vid fel — den returnerar null
      // (t.ex. när samtyckesgrinden MV2 nekar INSERT). Då ska det synas.
      if (!rad) throw new Error('Anteckningen sparades inte')
      return rad
    },
    onSuccess: () => setSaved(true),
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'happened',
      icon: NotebookPen,
      title: t('focus.diary.happenedTitle', 'Vad hände idag?'),
      hint: t('focus.diary.happenedHint', 'En sak räcker.'),
    },
    {
      id: 'feeling',
      icon: Heart,
      title: t('focus.diary.feelingTitle', 'Hur kändes det?'),
    },
    {
      id: 'tomorrow',
      icon: Sun,
      title: t('focus.diary.tomorrowTitle', 'En sak du vill göra imorgon'),
      hint: t('focus.diary.tomorrowHint', 'Något litet — inte hela listan.'),
    },
    {
      id: 'done',
      icon: CheckCircle2,
      title: t('focus.diary.doneTitle', 'Klart!'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          // Samma regel som mående-guiden (MV3): ett misslyckat sparande får
          // inte stänga guiden. Tidigare anropades onExit() ändå, och det
          // personen skrivit försvann med guiden.
          setSparfel(false)
          try {
            await saveMutation.mutateAsync()
          } catch (err) {
            console.error('[FocusDiaryWizard] kunde inte spara anteckningen:', err)
            setSparfel(true)
            return
          }
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      busy={saveMutation.isPending}
      canNext={current.id === 'happened' ? happened.trim().length > 0 : true}
    >
      {current.id === 'happened' && (
        <textarea
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          value={happened}
          onChange={(e) => setHappened(e.target.value)}
          rows={5}
          placeholder={t('focus.diary.happenedPlaceholder', 't.ex. Träffade min konsulent, gick en promenad...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'feeling' && (
        <textarea
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          rows={5}
          placeholder={t('focus.diary.feelingPlaceholder', 't.ex. jag kände mig lugn, lite stressad i början...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'tomorrow' && (
        <input
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          type="text"
          value={tomorrow}
          onChange={(e) => setTomorrow(e.target.value)}
          placeholder={t('focus.diary.tomorrowPlaceholder', 't.ex. ringa ett företag, läsa en sida i en bok')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <div className="space-y-3">
          {saved ? (
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
              <CheckCircle2 className="w-5 h-5 text-[var(--c-solid)]" />
              {t('focus.diary.savedText', 'Sparat i din dagbok.')}
            </div>
          ) : sparfel ? (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)] text-stone-700 dark:text-stone-200"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--c-solid)]" aria-hidden="true" />
              <span>{t('focus.saveFailed')}</span>
            </div>
          ) : (
            <p className="text-stone-600 dark:text-stone-300">
              {t('focus.diary.readyText', 'Vi sparar din anteckning i din dagbok.')}
            </p>
          )}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusDiaryWizard
