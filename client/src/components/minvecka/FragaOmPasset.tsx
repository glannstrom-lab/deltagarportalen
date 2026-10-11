/**
 * FragaOmPasset — "Fråga om passet" på ett pass i Min vecka (F8, persona-
 * genomgången 2026-09-12). Frågan uppstår vid passet, men meddelandefältet låg
 * bara på Min konsulent. Samma sändväg (konsulentMeddelandeApi), med
 * passets titel och tid, och en kvittens med konsulentens namn.
 *
 * RD14 (rollspelet 2026-09-27): rutan var förifylld med inledningen och
 * valideringen jämförde längd, så den som suddade inledningen och skrev en kort
 * fråga fick "Skriv din fråga efter inledningen". Nu står passet som en rad
 * ovanför en tom ruta, och inledningen läggs till först när frågan skickas.
 *
 * RD26: ett fel säger att texten är kvar och erbjuder Försök igen (SkrivFel).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { SkrivFel } from '@/components/ui/SkrivFel'
import type { ActivitySession } from '@/services/aktivitetApi'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'

interface Props {
  session: ActivitySession
  /** Datum i läsbar form (samma som rubriken i Min vecka). */
  datumText: string
  onSent?: (namn: string) => void
}

export function FragaOmPasset({ session, datumText, onSent }: Props) {
  const { t } = useTranslation()
  const [oppen, setOppen] = useState(false)
  const [text, setText] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  // RD26: sändfelet är ett eget läge — rutan är kvar och Försök igen gör om samma sak.
  const [sandfel, setSandfel] = useState(false)
  const [skickatTill, setSkickatTill] = useState<string | null>(null)

  const inledning = t('minVecka.fraga.inledning', {
    defaultValue: 'Hej! Jag har en fråga om passet "{{titel}}" den {{datum}} kl {{tid}}: ',
    titel: session.title,
    datum: datumText,
    tid: session.start_time,
  })

  const oppna = () => {
    setFel(null)
    setOppen(true)
  }

  const skicka = async () => {
    const fraga = text.trim()
    if (!fraga) {
      setFel(t('minVecka.fraga.tom', 'Skriv din fråga först.'))
      return
    }
    setSkickar(true)
    setFel(null)
    setSandfel(false)
    try {
      await konsulentMeddelandeApi.skickaTillMinKonsulent(`${inledning}${fraga}`)
      const k = await konsulentMeddelandeApi.minKonsulent().catch(() => null)
      const namn = k?.namn ?? t('minVecka.fraga.dinKonsulent', 'din konsulent')
      setSkickatTill(namn)
      setOppen(false)
      onSent?.(namn)
    } catch (e) {
      console.warn('[FragaOmPasset] frågan kunde inte skickas', e)
      setSandfel(true)
    } finally {
      setSkickar(false)
    }
  }

  if (skickatTill) {
    return (
      <p className="m-0 text-[0.9375rem] font-semibold text-s-narvarande" role="status">
        {t('minVecka.fraga.skickat', { defaultValue: 'Skickat till {{namn}}.', namn: skickatTill })}
      </p>
    )
  }

  if (!oppen) {
    return (
      <button
        type="button"
        onClick={oppna}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-j-m px-3 text-[0.9375rem] font-semibold text-j-blak-2 hover:bg-j-sankt hover:text-j-blak focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)] sm:min-h-[36px]"
      >
        <KvarterIkon namn="meddelande" size={18} />
        {t('minVecka.fraga.knapp', 'Fråga om passet')}
      </button>
    )
  }

  const id = `fraga-${session.id}`
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[0.9375rem] font-medium text-j-blak">
        {t('minVecka.fraga.etikett', 'Din fråga till konsulenten')}
      </label>
      <p id={`${id}-om`} className="text-[0.9375rem] text-j-blak-2">
        {t('minVecka.fraga.om', {
          defaultValue: 'Om passet "{{titel}}" den {{datum}} kl {{tid}}. Det ser din konsulent.',
          titel: session.title,
          datum: datumText,
          tid: session.start_time,
        })}
      </p>
      <textarea
        id={id}
        aria-describedby={`${id}-om`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={4000}
        className="w-full rounded-j-s border border-j-linje-2 bg-j-kort p-3 text-[0.9375rem] text-j-blak"
      />
      {fel && <p role="alert" className="text-[0.9375rem] font-semibold text-s-ogiltig">{fel}</p>}
      {sandfel && (
        <SkrivFel
          extra={t('skrivfel.minKonsulent', 'Du kan också skriva eller ringa till din konsulent från sidan Min konsulent.')}
          onForsokIgen={() => { void skicka() }}
          forsoker={skickar}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button ton="kvarter" variant="secondary" onClick={skicka} disabled={skickar}>
          {skickar ? t('minVecka.fraga.skickar', 'Skickar …') : t('minVecka.fraga.skicka', 'Skicka')}
        </Button>
        <Button ton="kvarter" variant="tertiary" onClick={() => setOppen(false)} disabled={skickar}>
          {t('minVecka.fraga.avbryt', 'Avbryt')}
        </Button>
      </div>
    </div>
  )
}
