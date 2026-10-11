/**
 * VadForvantas — "Vad förväntas av mig?" i Min vecka.
 *
 * Beställning Mikael 2026-10-11: deltagaren ska förstå vad som förväntas och
 * vad hen gör i portalen — annars läggs telefonen bort. Omtaget (steg 6) gör
 * kortet till tre korta meningar med en ikon var, ur förslagets skärm "Vad
 * förväntas av mig":
 *   1. Kom till dina pass — timmarna är planens anvisade mål (samma tal som
 *      saldoraden och konsulentens ampel), och "Jag är här" när hon kommer.
 *   2. Hör av dig om du inte kan komma — "Jag kan inte komma" finns vid passet.
 *   3. Eget jobbsökande, bara när planen har timmar för det.
 *   (+) Aktivitetsrapporten, bara för Rusta och matcha (MinPlan belägger den).
 * Under dem: vem konsulenten är. Inga belopp, inga sanktioner, inga regler
 * som inte står i planen.
 *
 * "Det här gör du nu" bodde tidigare här. Det står nu överst på sidan som
 * nästa steg (NastaPass.tsx, samma regler i forvantasRegler.ts) — två ställen
 * som säger samma sak var precis det omtaget skulle bort från.
 *
 * Kortet kan döljas och tas fram igen. Den korta genomgången finns kvar, men
 * bara när hon ber om den — de tre raderna är redan genomgången.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'
import { useAuthStore } from '@/stores/authStore'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'
import { useGuideStangd } from '@/lib/guideMinne'
import type { PlanensRegelverk } from './planensRegelverk'

export const VAD_FORVANTAS_KORT = 'deltagare-vad-forvantas'

/** Hela nycklar som literaler — grinden för döda nycklar ska se dem. */
const GENOMGANG = [
  'minVecka.forvantas.genomgang.s1',
  'minVecka.forvantas.genomgang.s2',
  'minVecka.forvantas.genomgang.s3',
  'minVecka.forvantas.genomgang.s4',
] as const

interface Props {
  regelverk: PlanensRegelverk | null
  /** Planens timmar för eget jobbsökande per vecka. */
  jobbsokTimmar: number
  /** Planens anvisade veckomål i timmar (anvisatVeckomal). 0 = säg inget tal. */
  passTimmar?: number
}

interface Rad {
  ikon: KvarterNamn
  rubrik: string
  text: string
}

export function VadForvantas({ regelverk, jobbsokTimmar, passTimmar = 0 }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const [stangd, setStangd] = useGuideStangd(VAD_FORVANTAS_KORT, userId)
  const [genomgang, setGenomgang] = useState<number | null>(null)
  const rubrikId = useId()
  const kortId = useId()
  const rubrikRef = useRef<HTMLHeadingElement>(null)
  const oppnaRef = useRef<HTMLDivElement>(null)
  const fokusEfter = useRef<null | 'rubrik' | 'oppna'>(null)

  // Samma nyckel och funktion som Min vecka — delad cache, samma form.
  const konsulentQ = useQuery({
    queryKey: ['min-vecka', 'min-konsulent'],
    queryFn: () => konsulentMeddelandeApi.minKonsulent(),
    staleTime: 60_000,
  })

  useEffect(() => {
    const mal = fokusEfter.current
    if (!mal) return
    fokusEfter.current = null
    ;(mal === 'rubrik' ? rubrikRef.current : oppnaRef.current?.querySelector('button'))?.focus()
  })

  // Under laddning: ingenting. Kortet nämner konsulenten vid namn.
  if (konsulentQ.isPending) return null

  if (stangd) {
    return (
      <div className="flex justify-end" ref={oppnaRef}>
        <Button
          ton="kvarter"
          variant="tertiary"
          size="sm"
          onClick={() => { setStangd(false); fokusEfter.current = 'rubrik' }}
          aria-expanded={false}
          aria-controls={kortId}
          data-testid="vad-forvantas-oppna"
          leftIcon={<KvarterIkon namn="plan" size={20} ton="gran" />}
        >
          {t('minVecka.forvantas.rubrik')}
        </Button>
      </div>
    )
  }

  const namn = konsulentQ.data?.namn ?? null

  const vem = !namn
    ? t('minVecka.forvantas.vem.utanNamn')
    : regelverk === 'kommun'
      ? t('minVecka.forvantas.vem.kommun', { namn })
      : regelverk === 'leverantor'
        ? t('minVecka.forvantas.vem.leverantor', { namn })
        : t('minVecka.forvantas.vem.neutral', { namn })

  const rader: Rad[] = [
    {
      ikon: 'narvaro',
      rubrik: t('minVecka.forvantas.rad.komma.rubrik'),
      text: passTimmar > 0
        ? t('minVecka.forvantas.rad.komma.textTimmar', { count: passTimmar })
        : t('minVecka.forvantas.rad.komma.text'),
    },
    {
      ikon: 'franvaro',
      rubrik: t('minVecka.forvantas.rad.franvaro.rubrik'),
      text: t('minVecka.forvantas.rad.franvaro.text'),
    },
  ]
  if (jobbsokTimmar > 0) {
    rader.push({
      ikon: 'jobb',
      rubrik: t('minVecka.forvantas.rad.jobbsok.rubrik'),
      text: t('minVecka.forvantas.rad.jobbsok.text', { count: jobbsokTimmar }),
    })
  }
  if (regelverk === 'leverantor') {
    rader.push({
      ikon: 'dokument',
      rubrik: t('minVecka.forvantas.rad.rapport.rubrik'),
      text: t('minVecka.forvantas.rad.rapport.text'),
    })
  }

  const sista = genomgang !== null && genomgang >= GENOMGANG.length - 1

  return (
    <section
      id={kortId}
      aria-labelledby={rubrikId}
      data-testid="vad-forvantas"
      className="rounded-j-m border border-j-linje bg-j-kort p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id={rubrikId}
          ref={rubrikRef}
          tabIndex={-1}
          className="m-0 font-rubrik text-[1.375rem] font-bold leading-tight text-j-blak focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)] rounded"
        >
          {t('minVecka.forvantas.rubrik')}
        </h2>
        <button
          type="button"
          onClick={() => { setStangd(true); fokusEfter.current = 'oppna' }}
          aria-label={t('minVecka.forvantas.dolj')}
          data-testid="vad-forvantas-stang"
          className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-j-s text-j-blak-2 hover:bg-j-sankt focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
        >
          <KvarterIkon namn="kryss" size={22} />
        </button>
      </div>

      <ul className="m-0 mt-4 list-none space-y-4 p-0" data-testid="vad-forvantas-rader">
        {rader.map((rad) => (
          <li key={rad.rubrik} className="flex gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-j-m bg-j-gran-mjuk text-j-blak">
              <KvarterIkon namn={rad.ikon} size={24} ton="gran" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold leading-6 text-j-blak">{rad.rubrik}</span>
              <span className="block text-[0.9375rem] leading-[1.45] text-j-blak-2">{rad.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-j-linje pt-4">
        <p className="m-0 text-[0.9375rem] leading-[1.45] text-j-blak-2" data-testid="vad-forvantas-vem">{vem}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button ton="kvarter" variant="secondary" size="sm" onClick={() => navigate('/my-consultant')}
            leftIcon={<KvarterIkon namn="meddelande" size={20} />}>
            {t('minVecka.forvantas.skriv')}
          </Button>
          {genomgang === null && (
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setGenomgang(0)}>
              {t('minVecka.forvantas.genomgang.visa')}
            </Button>
          )}
        </div>
      </div>

      {genomgang !== null && (
        <div className="mt-4 rounded-j-m bg-j-sankt p-4" data-testid="vad-forvantas-genomgang">
          <p className="m-0 text-[0.8125rem] font-semibold text-j-blak-2" aria-live="polite">
            {t('minVecka.forvantas.genomgang.steg', { nr: genomgang + 1, antal: GENOMGANG.length })}
          </p>
          <p className="m-0 mt-1 text-base text-j-blak">{t(GENOMGANG[genomgang])}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              ton="kvarter"
              variant="secondary"
              size="sm"
              onClick={() => (sista ? setGenomgang(null) : setGenomgang(genomgang + 1))}
              data-testid="vad-forvantas-nasta"
            >
              {sista ? t('minVecka.forvantas.genomgang.klar') : t('minVecka.forvantas.genomgang.nasta')}
            </Button>
            {!sista && (
              <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setGenomgang(null)} data-testid="vad-forvantas-hoppa">
                {t('minVecka.forvantas.genomgang.hoppa')}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
