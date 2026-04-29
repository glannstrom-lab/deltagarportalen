import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useOversiktSummary } from './OversiktDataContext'
import type { WidgetProps } from './types'
import type { JobsokSummary } from './JobsokDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'

/**
 * OnboardingWidget — XL hero banner on the Översikt hub.
 *
 * Detection logic:
 *   - `profiles.onboarded_hubs` length === 0 → NEW user (Välkommen + 4 quick links)
 *   - otherwise → returning user ("Bra jobbat {firstName}") with deterministic
 *     next-step CTA based on which sub-hub has the least activity.
 *
 * Empathy contract: never use raw % anywhere; never shame the user for missed
 * activity; CTA framing is invitational ("Vill du börja idag?") not directive.
 */

const QUICK_LINKS = [
  { to: '/jobb', label: 'Söka jobb →' },
  { to: '/karriar', label: 'Karriär →' },
  { to: '/resurser', label: 'Resurser →' },
  { to: '/min-vardag', label: 'Min Vardag →' },
] as const

interface NextStep {
  text: string
  href: string
  cta: string
}

function pickNextStep(summary: {
  jobsok: JobsokSummary | undefined
  minVardag: MinVardagSummary | undefined
}): NextStep {
  const jobsok = summary.jobsok
  const minVardag = summary.minVardag
  if (!jobsok || (jobsok.applicationStats?.total ?? 0) === 0) {
    return {
      text: 'Du har inte sökt något jobb än. Vill du börja idag?',
      href: '/jobb',
      cta: 'Öppna Söka jobb →',
    }
  }
  if (!minVardag || (minVardag.diaryEntryCount ?? 0) === 0) {
    return {
      text: 'Reflektera över din vecka i dagboken — om du vill',
      href: '/min-vardag',
      cta: 'Öppna Min Vardag →',
    }
  }
  return {
    text: 'Fortsätt med dina mål',
    href: '/karriar',
    cta: 'Öppna Karriär →',
  }
}

export default function OnboardingWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useOversiktSummary()
  const profile = summary?.profile ?? null
  const onboardedHubs = profile?.onboarded_hubs ?? []
  const isNewUser = onboardedHubs.length === 0
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? 'där'
  const nextStep = pickNextStep({ jobsok: summary?.jobsok, minVardag: summary?.minVardag })

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Sparkles} title="Välkommen" />
      <Widget.Body>
        {isNewUser ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              Välkommen till din portal
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0 mb-2">
              Utforska dina hubbar och kom igång med din jobbsökning
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center min-h-[36px] px-3 py-1 rounded-[7px] border border-[var(--stone-150)] bg-[var(--surface)] text-[12px] font-bold text-[var(--stone-900)] no-underline hover:border-[var(--c-accent)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {`Bra jobbat ${firstName}!`}
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              {nextStep.text}
            </p>
          </div>
        )}
      </Widget.Body>
      {!isNewUser && (
        <Widget.Footer>
          <Link
            to={nextStep.href}
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {nextStep.cta}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
