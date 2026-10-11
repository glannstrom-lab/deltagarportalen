/**
 * KomIgangGuide — "Så kommer du igång" överst på konsulentens Översikt.
 *
 * Beställning Mikael 2026-10-11: konsulenter och handläggare lägger bort
 * datorn så fort något känns oklart. Guiden visar 2–6 steg för just deras
 * roll och kundtyp, med EN knapp per steg som tar dem dit det görs.
 *
 * Regler (se komIgangSteg.ts):
 *   - Ett steg bockas av av datan, aldrig av ett klick i guiden.
 *   - Under laddning påstår guiden ingenting — den visas inte förrän svaret
 *     finns (eller, om man själv öppnat den, med en rad om att den kontrollerar).
 *   - Ett läsfel är inte "inget gjort": då visas stegen utan bockar och en rad
 *     om felet.
 *   - Den är inline, inte en modal. Den stängs med en knapp och öppnas igen
 *     med "Så kommer du igång". Stängd = sparat per konto (guideMinne.ts).
 *     Visas av sig själv bara för den som inte är klar och inte stängt den.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Compass, X, ChevronRight } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { orgApi, type OrgKind } from '@/services/orgApi'
import { komIgangApi } from '@/services/komIgangApi'
import { regelverk } from './orgTypVisning'
import { allaKlara, guideRoll, guideRubrik, guideSteg, type GuideSteg } from './komIgangSteg'
import { useGuideStangd } from '@/lib/guideMinne'

export const KOM_IGANG_GUIDE = 'konsulent-kom-igang'

interface Props {
  /** Öppnar inbjudningsdialogen (den bor i OverviewTab). */
  onBjudIn: () => void
  /**
   * Omtaget "Kvarter" (2026-10-11): för en ny konsulent ÄR guiden dagens nästa
   * steg och står överst med en fylld knapp och skugga. Annars står den under
   * listan med en ramad knapp — en vy har bara en primärknapp.
   */
  somNastaSteg?: boolean
}

export function KomIgangGuide({ onBjudIn, somNastaSteg = false }: Props) {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const [stangd, setStangd] = useGuideStangd(KOM_IGANG_GUIDE, userId)
  // Öppnad med knappen i den här sessionen — visas då även när allt är klart.
  const [oppnadNu, setOppnadNu] = useState(false)
  const rubrikId = useId()
  const panelId = useId()
  const rubrikRef = useRef<HTMLHeadingElement>(null)
  const oppnaRef = useRef<HTMLButtonElement>(null)
  // Fokus flyttas efter renderingen: till rubriken när kortet öppnas, till knappen när det stängs.
  const fokusEfter = useRef<null | 'rubrik' | 'oppna'>(null)

  // Samma nyckel och form som OverviewTab — delad cache, en ägare (orgApi).
  const medlemskapQ = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  const medlemskap = medlemskapQ.data ?? []
  const egenRoll = guideRoll(medlemskap.map((m) => m.role))
  // En chef i en liten organisation arbetar ofta själv med deltagare (testkommunen
  // har en enda medlem). Hen kan växla till konsulentens steg — valet gäller sessionen.
  const [visaKonsulentSteg, setVisaKonsulentSteg] = useState(false)
  const roll = egenRoll === 'chef' && visaKonsulentSteg ? 'konsulent' : egenRoll
  const rv = regelverk(medlemskap.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k))

  const lageQ = useQuery({
    queryKey: ['kom-igang', userId, roll],
    queryFn: () => komIgangApi.hamta(roll, userId as string, medlemskap),
    enabled: !!userId && medlemskapQ.isSuccess,
    staleTime: 30_000,
  })

  const steg = guideSteg(roll, rv, lageQ.data ?? null)
  const klar = lageQ.isSuccess && allaKlara(steg)
  const fel = medlemskapQ.isError || lageQ.isError
  const laddar = !fel && (medlemskapQ.isPending || lageQ.isPending)

  const visaPanel = oppnadNu || (!stangd && !laddar && !klar)

  useEffect(() => {
    const mal = fokusEfter.current
    if (!mal) return
    fokusEfter.current = null
    ;(mal === 'rubrik' ? rubrikRef : oppnaRef).current?.focus()
  })

  if (!userId) return null

  const stang = () => {
    setStangd(true)
    setOppnadNu(false)
    fokusEfter.current = 'oppna'
  }
  const oppna = () => {
    setStangd(false)
    setOppnadNu(true)
    fokusEfter.current = 'rubrik'
  }

  const gor = (s: GuideSteg) => {
    if (s.knapp.handling.typ === 'bjudIn') onBjudIn()
    else navigate(s.knapp.handling.till)
  }

  if (!visaPanel) {
    // Medan medlemskapen laddas vet vi inte ens vilken guide det gäller — då ingenting.
    if (medlemskapQ.isPending) return null
    return (
      <div className={somNastaSteg ? 'flex' : 'flex justify-end'}>
        <button
          ref={oppnaRef}
          type="button"
          onClick={oppna}
          aria-expanded={false}
          aria-controls={panelId}
          data-testid="kom-igang-oppna"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-j-m border border-j-linje-2 bg-j-kort text-sm font-semibold text-j-blak hover:bg-j-sankt focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]"
        >
          <Compass className="w-4 h-4" aria-hidden="true" />
          Så kommer du igång
        </button>
      </div>
    )
  }

  const antalKlara = steg.filter((s) => s.klar === true).length
  const nasta = steg.find((s) => s.klar !== true)

  return (
    <section
      id={panelId}
      aria-labelledby={rubrikId}
      data-testid="kom-igang-guide"
      data-nasta-steg={somNastaSteg ? 'ja' : 'nej'}
      className={cn(
        'rounded-j-m border border-j-linje bg-j-kort text-j-blak p-4 sm:p-5',
        somNastaSteg && 'shadow-j sm:p-[22px]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {somNastaSteg && (
            <p className="mb-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-glod">Nästa steg</p>
          )}
          <h2
            id={rubrikId}
            ref={rubrikRef}
            tabIndex={-1}
            className={cn(
              'font-rubrik font-bold text-j-blak rounded-j-s focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]',
              somNastaSteg ? 'text-[1.375rem] sm:text-[1.45rem] leading-[1.15]' : 'text-lg',
            )}
          >
            {guideRubrik(roll, rv)}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-j-blak-2" role="status" aria-live="polite">
            {laddar
              ? 'Kontrollerar vad du redan har gjort …'
              : fel
                ? 'Det gick inte att se vad du redan har gjort. Stegen gäller ändå.'
                : klar
                  ? 'Allt är gjort. Guiden finns kvar här om du vill läsa igen.'
                  : `${antalKlara} av ${steg.length} steg gjorda. Stegen bockas av när det finns i Jobin.`}
          </p>
          {fel && (
            <button
              type="button"
              onClick={() => { void medlemskapQ.refetch(); void lageQ.refetch() }}
              className="mt-1 min-h-[44px] text-sm font-semibold underline underline-offset-2 text-j-gran-text"
            >
              Försök igen
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={stang}
          aria-label="Stäng guiden"
          data-testid="kom-igang-stang"
          className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-j-m text-j-blak-2 hover:bg-j-sankt focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <ol className="mt-4 rounded-j-m border border-j-linje overflow-hidden">
        {steg.map((s, i) => {
          const arNasta = s === nasta && !laddar && !fel
          return (
            <li
              key={s.id}
              data-testid={`kom-igang-steg-${s.id}`}
              data-klar={s.klar === true ? 'ja' : s.klar === false ? 'nej' : 'okant'}
              className={cn(
                'px-3.5 py-3 border-b border-j-linje last:border-b-0',
                arNasta ? 'bg-j-gran-mjuk sm:px-4 sm:py-4' : 'bg-j-kort',
              )}
            >
              <div className="flex items-start gap-3">
                {s.klar === true ? (
                  <CheckCircle2 className={cn('w-6 h-6 shrink-0 text-[var(--s-narvarande-ikon)]', !arNasta && 'mt-2.5')} aria-hidden="true" />
                ) : (
                  <Circle className={cn('w-6 h-6 shrink-0 text-j-blak-3', !arNasta && 'mt-2.5')} aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-j-blak">
                      <span className="sr-only">Steg {i + 1}: </span>
                      {s.rubrik}
                      {s.klar === true && <span className="ml-2 text-sm font-normal text-[var(--s-narvarande-text)]">Gjort</span>}
                      {s.klar === false && <span className="sr-only"> (inte gjort än)</span>}
                    </h3>
                    {!arNasta && (
                      <button
                        type="button"
                        onClick={() => gor(s)}
                        data-testid={`kom-igang-knapp-${s.id}`}
                        className="inline-flex items-center min-h-[44px] text-sm font-semibold underline underline-offset-2 text-j-gran-text"
                      >
                        {s.knapp.etikett}
                        <ChevronRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {arNasta && (
                    <>
                      <p className="mt-1 text-[0.9375rem] text-j-blak-2">{s.text}</p>
                      <Button
                        ton="kvarter"
                        variant={somNastaSteg ? 'primary' : 'secondary'}
                        className="mt-2.5 w-full sm:w-auto"
                        onClick={() => gor(s)}
                        data-testid={`kom-igang-knapp-${s.id}`}
                      >
                        {s.knapp.etikett}
                        <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {egenRoll === 'chef' && (
        <button
          type="button"
          onClick={() => setVisaKonsulentSteg(!visaKonsulentSteg)}
          data-testid="kom-igang-vaxla"
          className="mt-3 min-h-[44px] text-sm font-semibold underline underline-offset-2 text-j-gran-text"
        >
          {visaKonsulentSteg ? 'Visa stegen för din organisation' : 'Arbetar du själv med deltagare? Visa konsulentens steg'}
        </button>
      )}

      <p className="mt-3 text-sm text-j-blak-2">
        Fastnar du?{' '}
        <Link to="/help" className="font-semibold underline underline-offset-2 text-j-gran-text">
          Läs mer under Hjälp
        </Link>
        .
      </p>
    </section>
  )
}
