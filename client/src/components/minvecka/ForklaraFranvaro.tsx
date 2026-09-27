/**
 * ForklaraFranvaro — "Förklara frånvaron" på ett pass som konsulenten markerat
 * som frånvaro (RD11, rollspelet 2026-09-27).
 *
 * 17/9 stod bara som "Frånvaro" i Min vecka och på intyget till handläggaren,
 * och Anna hade ingen väg att skicka med sitt skäl. Förklaringen sparas på
 * passet (franvaroApi.forklara), en databastrigger lägger en notis hos
 * konsulenten, och intyget visar den som "Deltagarens förklaring".
 *
 * Ton: lugn vän. Ingen skuld, inget "du måste" — det är ett erbjudande.
 * Ett fel behåller texten (RD26).
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { ActivitySession } from '@/services/aktivitetApi'
import { FORKLARING_MAX, forklaringAv, franvaroApi, kanForklaraFranvaro } from '@/services/franvaroApi'

interface Props {
  session: ActivitySession
  onSaved: (session: ActivitySession) => void
}

export function ForklaraFranvaro({ session, onSaved }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const befintlig = forklaringAv(session)
  const [oppen, setOppen] = useState(false)
  const [text, setText] = useState(befintlig?.text ?? '')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  if (!kanForklaraFranvaro(session)) return null

  const skicka = async () => {
    if (!text.trim()) {
      setFel(t('minVecka.forklara.tom', 'Skriv några ord om vad som hände.'))
      return
    }
    setSparar(true)
    setFel(null)
    try {
      onSaved(await franvaroApi.forklara(session.id, text))
      setOppen(false)
    } catch {
      setFel(t('minVecka.forklara.fel', 'Det gick inte att skicka just nu. Din text är kvar, så du kan försöka igen om en stund.'))
    } finally {
      setSparar(false)
    }
  }

  if (!oppen) {
    return (
      <div className="text-sm">
        {befintlig && (
          <p className="text-stone-700 dark:text-stone-300">
            {t('minVecka.forklara.din', 'Din förklaring:')} „{befintlig.text}”
          </p>
        )}
        <button
          type="button"
          onClick={() => { setText(befintlig?.text ?? ''); setOppen(true) }}
          className="mt-1 font-medium text-stone-700 dark:text-stone-300 underline underline-offset-2"
        >
          {befintlig ? t('minVecka.forklara.andra', 'Ändra din förklaring') : t('minVecka.forklara.knapp', 'Förklara frånvaron')}
        </button>
      </div>
    )
  }

  return (
    <form
      className="rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-2"
      onSubmit={(e) => { e.preventDefault(); void skicka() }}
    >
      <label htmlFor={`${id}-text`} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t('minVecka.forklara.etikett', 'Vad hände? Skriv med dina egna ord.')}
      </label>
      <textarea
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={FORKLARING_MAX}
        rows={3}
        className="w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
      />
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {t('minVecka.forklara.vemSer', 'Din konsulent får se förklaringen, och den står med på ditt närvarointyg som din egen förklaring.')}
      </p>
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11" disabled={sparar}>
          {t('minVecka.forklara.skicka', 'Skicka förklaringen')}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={sparar} onClick={() => { setOppen(false); setFel(null) }}>
          {t('minVecka.forklara.avbryt', 'Avbryt')}
        </Button>
      </div>
    </form>
  )
}
