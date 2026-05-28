/**
 * PartTransitionCard — visas när deltagaren passerat sista dagen i en del.
 *
 * Trigger: currentDay >= totalDays för aktuell del (eller AT manuellt markerat klar).
 * Syfte: ge känsla av framsteg + förbered mentalt för nästa del.
 *
 * Inte gamification — ingen poäng eller badge. Bara en mänsklig övergång.
 */

import { CheckCircle2, ChevronRight, Heart, Sparkles, Target } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { STA_PARTS, type StaPart } from '../mockData'

interface Props {
  completedPart: StaPart
  consultantFirstName: string
  /** Saker som tagits med från del som just avslutats — visas som "Det du tar med dig" */
  strengths: string[]
  /** Anpassningar som planerats — visas så deltagaren vet att de följer med */
  adaptations: string[]
  /** Fokusyrke om satt — relevant inför Del 3 */
  focusOccupation: string | null
  /** Om Del 2 inte ingår — visa det */
  nextPartIncluded: boolean
}

export function PartTransitionCard({
  completedPart,
  consultantFirstName,
  strengths,
  adaptations,
  focusOccupation,
  nextPartIncluded,
}: Props) {
  const completedDef = STA_PARTS.find((p) => p.id === completedPart)
  const nextPart = (completedPart + 1) as StaPart
  const nextDef = nextPartIncluded
    ? STA_PARTS.find((p) => p.id === nextPart)
    : STA_PARTS.find((p) => p.id === ((nextPart + 1) as StaPart)) // hoppa över Del 2

  // Sista delen klar
  const isFinalPart = completedPart === 4 || !nextDef

  return (
    <Card
      variant="flat"
      padding="lg"
      className="lg:col-span-3 border-l-4"
      style={{
        background: 'var(--c-bg)',
        borderLeftColor: 'var(--c-solid)',
      }}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--c-solid)', color: 'white' }}
        >
          <CheckCircle2 size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
            Övergång
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
            {isFinalPart
              ? 'Du har gått hela vägen genom Steg till arbete'
              : `Du är klar med Del ${completedPart}`}
          </h2>
          {completedDef && (
            <p className="text-sm text-stone-700 mt-1">
              {completedDef.shortLabel.toLowerCase().startsWith('hitta')
                ? 'Vägen hit har varit din egen — och du har lagt grunden tillsammans med ' + consultantFirstName + '.'
                : `Du och ${consultantFirstName} har avslutat "${completedDef.shortLabel}". Det är ett riktigt steg framåt.`}
            </p>
          )}
        </div>
      </div>

      {/* Sammanfattning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
        {strengths.length > 0 && (
          <Section
            icon={<Sparkles size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Det här tar du med dig"
          >
            <ul className="space-y-1 text-sm">
              {strengths.slice(0, 4).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--c-solid)' }}
                  />
                  <span className="text-stone-700">{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {adaptations.length > 0 && (
          <Section
            icon={<Heart size={14} className="text-rose-500" />}
            title="Anpassningar som följer med"
          >
            <ul className="space-y-1 text-sm">
              {adaptations.slice(0, 4).map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-rose-400" />
                  <span className="text-stone-700">{a}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {focusOccupation && (
          <Section
            icon={<Target size={14} style={{ color: 'var(--c-solid)' }} />}
            title="Fokus framåt"
          >
            <div className="text-sm font-medium text-stone-900">{focusOccupation}</div>
            <p className="text-[11px] text-stone-500 mt-1">Yrkesområde att utforska.</p>
          </Section>
        )}

        {strengths.length === 0 && adaptations.length === 0 && !focusOccupation && (
          <Section
            icon={<Heart size={14} className="text-rose-500" />}
            title="Det här tar du med dig"
          >
            <p className="text-sm text-stone-700">
              {consultantFirstName} kommer gå igenom delredovisningen med dig och sammanfatta
              vad ni sett tillsammans.
            </p>
          </Section>
        )}
      </div>

      {/* Nästa del */}
      {!isFinalPart && nextDef && (
        <div
          className="mt-5 p-4 rounded-xl bg-white border border-stone-200"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                Härnäst
              </div>
              <h3 className="text-base font-semibold text-stone-900 mt-0.5">
                Del {nextDef.id} — {nextDef.shortLabel}
              </h3>
              <p className="text-sm text-stone-700 mt-1 max-w-2xl">{nextDef.description}</p>
              {!nextPartIncluded && nextPart === 2 && (
                <p className="text-xs text-stone-500 mt-2 italic">
                  Del 2 ingår inte i din plan — ni hoppar direkt vidare till arbetsprövning.
                </p>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              disabled
              title="Öppnas när AT markerat Del klar i konsulent-vyn"
            >
              Öppnas snart
            </Button>
          </div>
        </div>
      )}

      {isFinalPart && (
        <div className="mt-5 p-4 rounded-xl bg-white border border-stone-200">
          <p className="text-sm text-stone-700">
            Allt vi gjort tillsammans finns kvar — du kan alltid komma tillbaka och titta.
            Säg till {consultantFirstName} om det är något du vill prata om framåt.
          </p>
        </div>
      )}
    </Card>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="p-3 rounded-lg bg-white">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-xs uppercase tracking-wide font-semibold text-stone-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}
