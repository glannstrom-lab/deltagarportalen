/**
 * FragaOmPasset — "Fråga om passet" på ett pass i Min vecka (F8, persona-
 * genomgången 2026-09-12). Frågan uppstår vid passet, men meddelandefältet låg
 * bara på Min konsulent. Samma sändväg (konsulentMeddelandeApi), förifyllt med
 * passets titel och tid, och en kvittens med konsulentens namn.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
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
  const [skickatTill, setSkickatTill] = useState<string | null>(null)

  const inledning = t('minVecka.fraga.inledning', {
    defaultValue: 'Hej! Jag har en fråga om passet "{{titel}}" den {{datum}} kl {{tid}}: ',
    titel: session.title,
    datum: datumText,
    tid: session.start_time,
  })

  const oppna = () => {
    setFel(null)
    setText(inledning)
    setOppen(true)
  }

  const skicka = async () => {
    if (text.trim().length <= inledning.trim().length) {
      setFel(t('minVecka.fraga.tom', 'Skriv din fråga efter inledningen.'))
      return
    }
    setSkickar(true)
    setFel(null)
    try {
      await konsulentMeddelandeApi.skickaTillMinKonsulent(text)
      const k = await konsulentMeddelandeApi.minKonsulent().catch(() => null)
      const namn = k?.namn ?? t('minVecka.fraga.dinKonsulent', 'din konsulent')
      setSkickatTill(namn)
      setOppen(false)
      onSent?.(namn)
    } catch {
      setFel(t('minVecka.fraga.fel', 'Frågan gick inte att skicka. Du kan skriva till din konsulent från sidan Min konsulent.'))
    } finally {
      setSkickar(false)
    }
  }

  if (skickatTill) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
        {t('minVecka.fraga.skickat', { defaultValue: 'Skickat till {{namn}}.', namn: skickatTill })}
      </p>
    )
  }

  if (!oppen) {
    return (
      <button
        type="button"
        onClick={oppna}
        className="self-start text-sm font-medium text-stone-700 dark:text-stone-300 underline-offset-2 hover:underline"
      >
        {t('minVecka.fraga.knapp', 'Fråga om passet')}
      </button>
    )
  }

  const id = `fraga-${session.id}`
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t('minVecka.fraga.etikett', 'Din fråga till konsulenten')}
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={4000}
        className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-3 text-sm text-stone-900 dark:text-stone-100"
      />
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" onClick={skicka} disabled={skickar}>
          {skickar ? t('minVecka.fraga.skickar', 'Skickar …') : t('minVecka.fraga.skicka', 'Skicka')}
        </Button>
        <Button variant="outline" className="min-h-11" onClick={() => setOppen(false)} disabled={skickar}>
          {t('minVecka.fraga.avbryt', 'Avbryt')}
        </Button>
      </div>
    </div>
  )
}
