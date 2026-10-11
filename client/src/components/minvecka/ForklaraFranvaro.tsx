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
      <div className="text-[0.9375rem]">
        {befintlig && (
          <p className="text-j-blak-2">
            {t('minVecka.forklara.din', 'Din förklaring:')} „{befintlig.text}”
          </p>
        )}
        <button
          type="button"
          onClick={() => { setText(befintlig?.text ?? ''); setOppen(true) }}
          className="mt-1 inline-flex min-h-[44px] items-center rounded-j-s font-semibold text-j-gran-text underline underline-offset-2 focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]"
        >
          {befintlig ? t('minVecka.forklara.andra', 'Ändra din förklaring') : t('minVecka.forklara.knapp', 'Förklara frånvaron')}
        </button>
      </div>
    )
  }

  return (
    <form
      className="rounded-j-s border border-j-linje p-3 space-y-2"
      onSubmit={(e) => { e.preventDefault(); void skicka() }}
    >
      <label htmlFor={`${id}-text`} className="block text-[0.9375rem] font-medium text-j-blak">
        {t('minVecka.forklara.etikett', 'Vad hände? Skriv med dina egna ord.')}
      </label>
      <textarea
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={FORKLARING_MAX}
        rows={3}
        className="w-full rounded-j-s border border-j-linje-2 bg-j-kort px-3 py-2 text-[0.9375rem] text-j-blak"
      />
      <p className="text-[0.9375rem] text-j-blak-2">
        {t('minVecka.forklara.vemSer', 'Din konsulent får se förklaringen, och den står med på ditt närvarointyg som din egen förklaring.')}
      </p>
      {fel && <p role="alert" className="text-[0.9375rem] font-semibold text-s-ogiltig">{fel}</p>}
      <div className="flex flex-wrap gap-2">
        <Button ton="kvarter" variant="secondary" type="submit" disabled={sparar}>
          {t('minVecka.forklara.skicka', 'Skicka förklaringen')}
        </Button>
        <Button type="button" ton="kvarter" variant="tertiary" disabled={sparar} onClick={() => { setOppen(false); setFel(null) }}>
          {t('minVecka.forklara.avbryt', 'Avbryt')}
        </Button>
      </div>
    </form>
  )
}
