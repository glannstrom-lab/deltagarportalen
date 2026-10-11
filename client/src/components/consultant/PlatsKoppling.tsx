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
import { Button } from '@/components/ui/Button'
import { SpaltYta } from './SpaltYta'
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
    return <p className="m-0 text-sm text-[var(--s-ogiltig-text)]" role="status">Platser (praktik/arbetsträning) kunde inte hämtas — avstämningen mot planen visas inte.</p>
  }

  const { platserUtanPass, fritextUtanPlats } = platsAvstamning(lage.platser, sessions)
  const aktuella = lage.platser.filter((p) => p.status === 'planerad' || p.status === 'pagaende')
  if (aktuella.length === 0 && fritextUtanPlats.length === 0) return null

  return (
    <SpaltYta
      ikon="fysiskt"
      rubrik="Praktik och arbetsträning"
      testId="plats-koppling"
      atgard={<Link to="/consultant/platser" className="text-sm font-semibold underline-offset-2 hover:underline text-[var(--j-gran-text)]">Öppna Platser</Link>}
    >
      {aktuella.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-1 text-sm text-[var(--j-blak-2)]">
          {aktuella.map((p) => (
            <li key={p.id}>
              <span className="font-semibold text-[var(--j-blak)]">{p.company_name}</span> · {PLACERING_TYP_LABEL[p.placement_type] ?? p.placement_type} · {PLACERING_STATUS_LABEL[p.status] ?? p.status}
              {p.start_date ? ` · från ${langtDatum(p.start_date)}` : ''}
              {p.hours_per_week ? ` · ${String(p.hours_per_week).replace('.', ',')} h/vecka` : ''}
            </li>
          ))}
        </ul>
      )}
      {platserUtanPass.map((p) => (
        <div key={p.id} className="text-sm rounded-[var(--j-r-m)] bg-[var(--s-vantar-bg)] text-[var(--s-vantar-text)] px-3 py-2.5 grid gap-2" role="status">
          <span>{p.company_name} finns under Platser men har inga arbetsplatspass i planen — timmarna där räknas inte förrän passen ligger i planen.</span>
          {plan && onPassSkapade && (
            <div>
              <Button ton="kvarter" variant="secondary" size="sm" onClick={() => setValdPlats(lage.platser.find((x) => x.id === p.id) ?? null)}>
                Lägg in i planen<span className="sr-only"> — {p.company_name}</span>
              </Button>
            </div>
          )}
        </div>
      ))}
      {fritextUtanPlats.map((loc) => (
        <p key={loc} className="m-0 text-sm rounded-[var(--j-r-m)] bg-[var(--s-giltig-bg)] text-[var(--s-giltig-text)] px-3 py-2.5" role="status">
          Planen har arbetsplatspass på ”{loc}”, men platsen finns inte under Platser.{' '}
          <Link
            to={`/consultant/platser?${new URLSearchParams({ ny: '1', deltagare: participantId, foretag: loc }).toString()}`}
            className="underline font-semibold"
          >
            Registrera ”{loc}” som plats
          </Link>
          {' '}för kontaktuppgifter, handledning och uppföljning.
        </p>
      ))}
      <p className="m-0 text-xs text-[var(--j-blak-3)]">
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
    </SpaltYta>
  )
}
