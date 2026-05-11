/**
 * FocusApplicationsWizard — NPF-anpassad ansökningsgenomgång.
 *
 * Steg per ansökan i kö: visa namn → status → nästa-steg. EN ansökan i taget.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckCircle2, ArrowRight, Smile, Loader2 } from '@/components/ui/icons'
import { applicationsApi } from '@/services/applicationsApi'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const STATUS_LABEL: Record<string, string> = {
  saved: 'Sparad',
  applied: 'Ansökt',
  interview: 'Intervju',
  offer: 'Erbjudande',
  rejected: 'Avslag',
  closed: 'Avslutad',
}

export function FocusApplicationsWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', 'focus-list'],
    queryFn: () => applicationsApi.getAll(),
    staleTime: 60_000,
  })

  // Show up to 3 most recent for focus
  const focusApps = (applications as any[]).slice(0, 3)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-solid)]" />
      </div>
    )
  }

  if (focusApps.length === 0) {
    const STEPS: ReadonlyArray<FocusWizardStep> = [
      {
        id: 'empty',
        icon: Smile,
        title: t('focus.applications.emptyTitle', 'Inga ansökningar än'),
      },
    ] as const
    return (
      <FocusWizardFrame
        steps={STEPS}
        current={0}
        onNext={onExit}
        onExit={onExit}
        finishLabel={t('focus.applications.emptyCta', 'Stäng fokusläge')}
      >
        <p className="text-stone-600 dark:text-stone-300">
          {t(
            'focus.applications.emptyText',
            'När du sparat eller ansökt om jobb visas de här. Börja med att söka ett jobb i fokus-jobbsökaren.'
          )}
        </p>
      </FocusWizardFrame>
    )
  }

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    ...focusApps.map((_a, i) => ({
      id: `app-${i}`,
      icon: ClipboardList,
      title: t('focus.applications.appTitle', 'Ansökan {{n}} av {{total}}', { n: i + 1, total: focusApps.length }),
    })),
    {
      id: 'done',
      icon: CheckCircle2,
      title: t('focus.applications.doneTitle', 'Du har gått igenom dina senaste ansökningar'),
    },
  ] as const

  const current = STEPS[step]
  const isDone = current.id === 'done'

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (isDone) { onExit(); return }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
    >
      {!isDone && (() => {
        const idx = parseInt(current.id.replace('app-', ''), 10)
        const app = focusApps[idx]
        const status = (app?.status as string) ?? 'saved'
        return (
          <div className="space-y-3">
            <p className="text-lg font-medium text-stone-800 dark:text-stone-100">
              {app?.position ?? app?.job_title ?? t('focus.applications.unknownRole', 'Okänd roll')}
            </p>
            <p className="text-stone-600 dark:text-stone-300">
              {app?.company ?? app?.employer ?? ''}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--c-accent)]/40 text-[var(--c-text)] text-sm">
              <ArrowRight className="w-4 h-4" />
              {STATUS_LABEL[status] ?? status}
            </div>
          </div>
        )
      })()}

      {isDone && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.applications.doneText', 'Bra koll! Öppna ansökningssidan i normalläge för att uppdatera status eller lägga till anteckningar.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusApplicationsWizard
