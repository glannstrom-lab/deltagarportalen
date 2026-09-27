/**
 * PlatsKoppling — deltagarens praktik/arbetsträning (Platser) bredvid
 * aktivitetsplanen, med en avstämning mot planens arbetsplatspass
 * (RR10/RK16, rollspelet 2026-09-27). Se services/platsKoppling.ts.
 *
 * Ingen plats och inga arbetsplatspass = ingen ruta. Går Platser inte att
 * hämta syns en rad om det — aldrig en tom lista som ser ut som "inga platser".
 *
 * RK37: en plats utan pass kan läggas in i planen härifrån (PlatsPassDialog),
 * så att timmarna räknas — tidigare stod bara "lägg till dem med Lägg till pass".
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { placeringarApi, type Placering } from '@/services/placeringarApi'
import { platsAvstamning, type PassRad } from '@/services/platsKoppling'
import { PLAN_PASS_KOLUMNER_FINNS } from '@/services/planMarkning'
import { PLACERING_TYP_LABEL, PLACERING_STATUS_LABEL } from './placeringLabels'
import { langtDatum } from './aktivitetEtiketter'
import { PlatsPassDialog, type PlatsPassPlan } from './PlatsPassDialog'

type Lage = { status: 'laddar' } | { status: 'fel' } | { status: 'klart'; platser: Placering[] }

export function PlatsKoppling({ participantId, sessions, plan, onPassSkapade }: {
  participantId: string
  sessions: readonly PassRad[]
  /** Planen passen läggs in i. Utan plan (eller en avslutad) visas ingen knapp. */
  plan?: PlatsPassPlan | null
  onPassSkapade?: (antal: number) => void
}) {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [valdPlats, setValdPlats] = useState<Placering | null>(null)

  useEffect(() => {
    let aktiv = true
    placeringarApi.getPlaceringarForDeltagare(participantId)
      .then((platser) => { if (aktiv) setLage({ status: 'klart', platser }) })
      .catch(() => { if (aktiv) setLage({ status: 'fel' }) })
    return () => { aktiv = false }
  }, [participantId])

  if (lage.status === 'laddar') return null
  if (lage.status === 'fel') {
    return <p className="text-sm text-rose-700 dark:text-rose-300" role="status">Platser (praktik/arbetsträning) kunde inte hämtas — avstämningen mot planen visas inte.</p>
  }

  const { platserUtanPass, fritextUtanPlats } = platsAvstamning(lage.platser, sessions)
  const aktuella = lage.platser.filter((p) => p.status === 'planerad' || p.status === 'pagaende')
  if (aktuella.length === 0 && fritextUtanPlats.length === 0) return null

  return (
    <Card className="p-5 space-y-3" data-testid="plats-koppling">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-stone-500" aria-hidden="true" />
          Praktik och arbetsträning
        </h3>
        <Link to="/consultant/platser" className="text-sm underline text-stone-600 dark:text-stone-300">Öppna Platser</Link>
      </div>
      {aktuella.length > 0 && (
        <ul className="space-y-1 text-sm text-stone-700 dark:text-stone-200">
          {aktuella.map((p) => (
            <li key={p.id}>
              <span className="font-medium">{p.company_name}</span> · {PLACERING_TYP_LABEL[p.placement_type] ?? p.placement_type} · {PLACERING_STATUS_LABEL[p.status] ?? p.status}
              {p.start_date ? ` · från ${langtDatum(p.start_date)}` : ''}
              {p.hours_per_week ? ` · ${String(p.hours_per_week).replace('.', ',')} h/vecka` : ''}
            </li>
          ))}
        </ul>
      )}
      {platserUtanPass.map((p) => (
        <div key={p.id} className="text-sm rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2" role="status">
          <span>{p.company_name} finns under Platser men har inga arbetsplatspass i planen — timmarna där räknas inte förrän passen ligger i planen.</span>
          {plan && onPassSkapade && (
            <button type="button" className="underline font-medium whitespace-nowrap" onClick={() => setValdPlats(lage.platser.find((x) => x.id === p.id) ?? null)}>
              Lägg in i planen<span className="sr-only"> — {p.company_name}</span>
            </button>
          )}
        </div>
      ))}
      {fritextUtanPlats.map((loc) => (
        <p key={loc} className="text-sm rounded-xl bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100 px-3 py-2" role="status">
          Planen har arbetsplatspass på ”{loc}”, men platsen finns inte under Platser. Registrera den där för kontaktuppgifter, handledning och uppföljning.
        </p>
      ))}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Avstämningen jämför namnet på platsen med passens platsfält{PLAN_PASS_KOLUMNER_FINNS ? ', och känner igen pass som lagts in härifrån' : ''}.
      </p>
      {valdPlats && plan && onPassSkapade && (
        <PlatsPassDialog
          plats={valdPlats}
          plan={plan}
          onClose={() => setValdPlats(null)}
          onSkapade={(antal) => { setValdPlats(null); onPassSkapade(antal) }}
        />
      )}
    </Card>
  )
}
