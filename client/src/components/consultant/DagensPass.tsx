/**
 * DagensPass — konsulentens morgonfråga under aktivitetskravet (F9, 2026-09-12):
 * vilka pass är det i dag, vem har checkat in, vem har anmält frånvaro (F1),
 * och vad saknar närvaro.
 *
 * Omtaget "Kvarter" (steg 4, 2026-10-11): en rad per PASS, inte per deltagare.
 * Ett pass med flera deltagare (samma tid och titel, t.ex. Jobbsökarverkstaden)
 * är en rad som säger hur det står till i ord och leder till gruppvyn, där
 * hela passet markeras på en skärm (RK36). Ett pass med en enda deltagare
 * markeras direkt i raden med NarvaroVal. Incheckning och anmäld frånvaro ger
 * ett förslag som konsulenten bekräftar — inget sparas utan hennes klick.
 *
 * Närvaron sätts genom samma API som deltagarsidan (aktivitetsplanApi.markAttendance,
 * via useNarvaroMarkering) — ingen kopia av logiken.
 *
 * Tre lägen: laddar / fel / klart. Tomt underlag är en invit, inte en nolla.
 * Konsulentvyn är svensk med flit (DESIGN.md §2).
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS, NARVARO_STANDARDVAL, type NarvaroAlternativ } from '@/components/ui/kvarterStatus'
import { hamtaDagensPass, type PassIdag } from '@/lib/dagensPass'
import { dagensPoster, gruppLageText, gruppLank, narvaroForslag } from '@/lib/gruppnarvaro'
import { NarvaroRad } from './NarvaroRad'
import { useNarvaroMarkering } from './useNarvaroMarkering'
import { cn } from '@/lib/utils'

type Lage = 'laddar' | 'fel' | 'klart'

interface Props {
  /** Namn per deltagar-id — kommer ur Översiktens redan hämtade deltagarlista. */
  namnFor: (participantId: string) => string
  /** Kundtypens närvaroval. Standard: Här / Giltig / Ogiltig / Sjuk. */
  alternativ?: readonly NarvaroAlternativ[]
  /** Rubriknivå i Min dag. Standard 4. */
  rubrikNiva?: 2 | 3 | 4
}

export function DagensPass({ namnFor, alternativ = NARVARO_STANDARDVAL, rubrikNiva = 4 }: Props) {
  const navigate = useNavigate()
  const [pass, setPass] = useState<PassIdag[]>([])
  // Läget härleds ur vilket försök som senast blev klart — "Försök igen" ökar
  // försöket, så laddar-läget kommer utan setState i effekten.
  const [forsok, setForsok] = useState(0)
  const [klar, setKlar] = useState<{ forsok: number; fel: boolean } | null>(null)

  useEffect(() => {
    let aktiv = true
    hamtaDagensPass()
      .then((p) => {
        if (!aktiv) return
        setPass(p)
        setKlar({ forsok, fel: false })
      })
      .catch(() => {
        if (aktiv) setKlar({ forsok, fel: true })
      })
    return () => {
      aktiv = false
    }
  }, [forsok])

  const lage: Lage = !klar || klar.forsok !== forsok ? 'laddar' : klar.fel ? 'fel' : 'klart'
  const ladda = () => setForsok((n) => n + 1)

  const markering = useNarvaroMarkering({
    namnFor,
    onSparat: (id, attendance) => setPass((prev) => prev.map((x) => (x.id === id ? { ...x, attendance } : x))),
  })

  const poster = useMemo(() => dagensPoster(pass), [pass])
  const Rubrik = (`h${rubrikNiva}` as 'h2' | 'h3' | 'h4')

  return (
    <section aria-labelledby="dagens-pass-rubrik" className="mb-5 text-[var(--j-blak)]">
      <div className="flex items-baseline gap-3 mb-2">
        <Rubrik id="dagens-pass-rubrik" className="m-0 font-rubrik text-lg font-bold">
          Dagens pass
        </Rubrik>
        <Link
          to="/consultant/pass/grupp"
          className={cn('ml-auto text-[0.875rem] font-semibold text-[var(--j-gran-text)] hover:underline rounded-[var(--j-r-s)]', KVARTER_FOKUS)}
        >
          Närvaro per pass
        </Link>
      </div>

      {lage === 'laddar' && (
        <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]" role="status">
          Hämtar dagens pass…
        </p>
      )}
      {lage === 'fel' && (
        <p className="m-0 text-[0.9375rem] text-[var(--s-ogiltig-text)]" role="alert">
          Dagens pass kunde inte hämtas.{' '}
          <button type="button" onClick={() => ladda()} className={cn('underline font-semibold rounded-[var(--j-r-s)]', KVARTER_FOKUS)}>
            Försök igen
          </button>
        </p>
      )}
      {lage === 'klart' && pass.length === 0 && (
        <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]">Inga pass i dag. Planerna finns under varje deltagares Aktivitet.</p>
      )}

      {markering.fel && (
        <p role="alert" className="m-0 mb-2 text-[0.9375rem] font-semibold text-[var(--s-ogiltig-text)]">
          {markering.fel}
        </p>
      )}

      {lage === 'klart' && poster.length > 0 && (
        <ul className="list-none m-0 p-0 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)] overflow-hidden">
          {poster.map((post) => {
            if (post.typ === 'ensam') {
              const p = post.pass
              return (
                <NarvaroRad
                  key={p.id}
                  pass={p}
                  namn={namnFor(p.participant_id)}
                  alternativ={alternativ}
                  sparar={markering.sparar.has(p.id)}
                  markeradHar={markering.markeradeHar.has(p.id)}
                  onValj={(v) => markering.valj(p, v)}
                  onAngra={() => void markering.markera(p, null)}
                  utkast={markering.utkast.get(p.id)}
                  onOppna={() => navigate(`/consultant/participants/${p.participant_id}`)}
                  passText={`${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)} · ${p.title}`}
                />
              )
            }
            const g = post.grupp
            const klar = g.pass.every((p) => p.attendance !== null)
            const forslag = g.pass.filter((p) => narvaroForslag(p)).length
            return (
              <li
                key={g.nyckel}
                data-testid="dagens-grupp"
                className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 px-4 sm:px-[18px] py-3.5 border-b border-[var(--j-linje)] last:border-b-0"
              >
                <span className="w-10 h-10 rounded-full grid place-items-center bg-[var(--j-gran-mjuk)] text-[var(--j-gran-text)]" aria-hidden="true">
                  <KvarterIkon namn="grupp" size={22} />
                </span>
                <span className="grid gap-0.5 min-w-0">
                  <span className="text-base font-semibold">
                    <span className="tabular-nums">{g.start_time}</span> {g.title}
                  </span>
                  <span className="text-[0.9375rem] text-[var(--j-blak-2)]">{gruppLageText(g)}</span>
                </span>
                <Link
                  to={gruppLank(g)}
                  aria-label={`Markera hela passet: ${g.title} ${g.start_time}–${g.end_time} (${g.pass.length} deltagare)`}
                  className={cn(
                    'col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-4 rounded-[var(--j-r-m)] text-[0.9375rem] font-semibold',
                    klar
                      ? 'text-[var(--j-gran-text)] hover:underline'
                      : 'border border-[var(--j-gran)] text-[var(--j-gran-text)] hover:bg-[var(--j-gran-mjuk)]',
                    KVARTER_FOKUS,
                  )}
                >
                  {klar ? 'Visa passet' : forslag > 0 ? 'Bekräfta närvaro' : 'Markera närvaro'}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
