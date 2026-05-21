/**
 * KompetenskartlaggningSummary — read-only sammanställning för konsulent.
 *
 * Visar deltagarens svar från sta_activities.metadata för aktiviteten med
 * key='kompetenskartlaggning'. Återanvänder samma fältnamn som
 * KompetenskartlaggningForm så vi inte tappar något.
 */

import { Card } from '@/components/ui/Card'
import { Sparkles, CheckCircle2, Clock } from '@/components/ui/icons'
import type { StaActivity } from '@/services/staApi'

interface Props {
  activity: StaActivity | null
}

export function KompetenskartlaggningSummary({ activity }: Props) {
  if (!activity) {
    return (
      <Card variant="flat" padding="md" className="bg-stone-50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-stone-400" />
          <h4 className="text-sm font-semibold text-stone-900">Kompetenskartläggning</h4>
        </div>
        <p className="text-sm text-stone-600">
          Deltagaren har inte startat kartläggningen än.
        </p>
      </Card>
    )
  }

  const data = activity.metadata as Record<string, unknown>
  const isComplete = !!activity.completed_at

  // Beräkna ifyllnadsgrad — speglar logiken i KompetenskartlaggningForm
  const fields: Array<boolean> = [
    !!String(data.aktivitetsformaga ?? '').trim(),
    !!String(data.haelsoSituation ?? '').trim(),
    !!String(data.korkort ?? ''),
    typeof data.digitalSkicklighet === 'number',
    Array.isArray(data.sprak) && (data.sprak as unknown[]).length > 0,
    !!data.grundskola || !!data.gymnasium || !!data.eftergymnasial || !!String(data.sfi ?? ''),
    !!String(data.tidigareErfarenhet ?? '').trim(),
    Array.isArray(data.kompetenser) && (data.kompetenser as unknown[]).length > 0,
    !!String(data.vad_vill_jobba_med ?? '').trim(),
    !!String(data.fritidsintressen ?? '').trim(),
  ]
  const completionPct = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  return (
    <Card variant="flat" padding="md">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 size={16} className="text-emerald-700" />
          ) : (
            <Clock size={16} style={{ color: 'var(--c-text)' }} />
          )}
          <h4 className="text-sm font-semibold text-stone-900">Kompetenskartläggning</h4>
          <span
            className={
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ' +
              (isComplete
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800')
            }
          >
            {isComplete
              ? `Klar · ${new Date(activity.completed_at!).toLocaleDateString('sv-SE')}`
              : `${completionPct}% ifyllt`}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Section title="Hälsa och förutsättningar">
          <FieldRow label="Aktivitetsförmåga" value={data.aktivitetsformaga as string} />
          <FieldRow label="Hälsosituation" value={data.haelsoSituation as string} />
          <FieldRow label="Vårdkontakter" value={data.vardkontakter as string} />
          <FieldRow label="Anpassningsbehov" value={data.anpassningsbehov as string} />
        </Section>

        <Section title="Praktiskt">
          <FieldRow label="Körkort" value={labelForKorkort(data.korkort as string)} />
        </Section>

        <Section title="Digital kompetens">
          <FieldRow label="Skicklighet" value={data.digitalSkicklighet ? `${data.digitalSkicklighet}/5` : null} />
          <FieldRow label="Utvecklingsbehov" value={data.digitalUtvecklingsbehov ? `${data.digitalUtvecklingsbehov}/5` : null} />
          <FieldRow label="Använder dator dagligen" value={data.harDator === true ? 'Ja' : data.harDator === false ? 'Nej' : null} />
        </Section>

        <Section title="Språk">
          <FieldRow label="Talar" value={Array.isArray(data.sprak) ? (data.sprak as string[]).join(', ') : null} />
        </Section>

        <Section title="Utbildning">
          <FieldRow
            label="Avslutad utbildning"
            value={
              [
                data.grundskola && 'Grundskola',
                data.gymnasium && 'Gymnasium',
                data.eftergymnasial && 'Eftergymnasial',
              ]
                .filter(Boolean)
                .join(' · ') || null
            }
          />
          <FieldRow label="SFI" value={labelForSfi(data.sfi as string)} />
          <FieldRow label="Annan utbildning" value={data.utbildningsExtra as string} />
        </Section>

        <Section title="Arbete">
          <FieldRow label="Har CV" value={data.harCV === true ? 'Ja' : data.harCV === false ? 'Nej' : null} />
          <FieldRow label="Tidigare erfarenhet" value={data.tidigareErfarenhet as string} />
          <FieldRow label="Timmar jobbsök/vecka" value={data.manaderSokt as string} />
        </Section>

        <Section title="Kompetenser och intressen">
          <FieldRow label="Egna styrkor" value={Array.isArray(data.kompetenser) ? (data.kompetenser as string[]).join(', ') : null} />
          <FieldRow label="Fritidsintressen" value={data.fritidsintressen as string} />
        </Section>

        <Section title="Yrke">
          <FieldRow label="Vill jobba med" value={data.vad_vill_jobba_med as string} />
          <FieldRow label="Fokusyrke från AF" value={data.fokusyrkeForslag as string} />
          <FieldRow label="Övrigt" value={data.ovrigt as string} />
        </Section>
      </div>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="text-[11px] uppercase tracking-wide font-medium text-stone-500 mb-1">{title}</h5>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null
  return (
    <div className="text-sm">
      <span className="text-stone-500">{label}:</span>{' '}
      <span className="text-stone-900">{value}</span>
    </div>
  )
}

function labelForKorkort(v: string): string | null {
  switch (v) {
    case 'inget': return 'Inget körkort'
    case 'b': return 'B-körkort'
    case 'b_bil': return 'B + tillgång till bil'
    case 'andra': return 'Andra körkort'
    default: return null
  }
}

function labelForSfi(v: string): string | null {
  switch (v) {
    case 'pagaende': return 'Pågående'
    case 'klart': return 'Klart'
    case 'nej': return 'Inte aktuellt'
    default: return null
  }
}
