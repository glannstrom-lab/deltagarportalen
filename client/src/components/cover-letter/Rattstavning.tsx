/**
 * AIX27 — Skrivstöd: rättstavning.
 *
 * Knapp under en text som ska skickas till en arbetsgivare. AI:n föreslår bara
 * små rättelser (före → efter); personen väljer vilka som ska göras, och inget
 * ändras förrän hen trycker på "Gör de valda ändringarna". Ingen ändring är
 * förvald: det är personens text och personens röst.
 *
 * Det som aldrig kan hamna i listan — nya meriter, nya siffror, för många
 * ändringar — stoppas på servern (`_rattstavning.js`), inte här.
 */
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, SpellCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  foreslaRattningar,
  tillampaRattningar,
  RATTSTAVNING_MAX_TECKEN,
  type Rattning,
} from '@/services/rattstavningApi'

interface Props {
  /** Texten som ska kontrolleras (det som står i rutan just nu). */
  text: string
  /** Anropas med hela den nya texten när personen godkänt ändringar. */
  onApply: (nyText: string) => void
  disabled?: boolean
}

type Lage =
  | { typ: 'vilar' }
  | { typ: 'laddar' }
  | { typ: 'fel' }
  | { typ: 'inga' }
  | { typ: 'klart'; tillampade: number; overhoppade: number }
  | { typ: 'forslag'; lista: Rattning[] }

export function Rattstavning({ text, onApply, disabled }: Props) {
  const { t } = useTranslation()
  const listId = useId()
  const [lage, setLage] = useState<Lage>({ typ: 'vilar' })
  const [valda, setValda] = useState<Set<number>>(new Set())

  const kolla = async () => {
    setLage({ typ: 'laddar' })
    setValda(new Set())
    try {
      const lista = await foreslaRattningar(text)
      setLage(lista.length === 0 ? { typ: 'inga' } : { typ: 'forslag', lista })
    } catch (err) {
      console.error('Kunde inte kontrollera stavningen:', err)
      setLage({ typ: 'fel' })
    }
  }

  const vaxla = (i: number) =>
    setValda((prev) => {
      const nasta = new Set(prev)
      if (nasta.has(i)) nasta.delete(i)
      else nasta.add(i)
      return nasta
    })

  const gor = () => {
    if (lage.typ !== 'forslag') return
    const godkanda = lage.lista.filter((_, i) => valda.has(i))
    const res = tillampaRattningar(text, godkanda)
    if (res.tillampade > 0) onApply(res.text)
    setValda(new Set())
    setLage({ typ: 'klart', tillampade: res.tillampade, overhoppade: res.overhoppade })
  }

  const upptagen = lage.typ === 'laddar'
  const harText = text.trim().length > 0

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={kolla}
        disabled={disabled || upptagen || !harText}
        className="gap-1"
      >
        {upptagen ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <SpellCheck size={14} aria-hidden="true" />
        )}
        {t('rattstavning.knapp', 'Kolla stavningen')}
      </Button>

      {text.length > RATTSTAVNING_MAX_TECKEN && (
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
          {t('rattstavning.langText', 'Brevet är långt. Vi kollar de första {{antal}} tecknen.', { antal: RATTSTAVNING_MAX_TECKEN })}
        </p>
      )}

      <div role="status" aria-live="polite">
        {upptagen && (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            {t('rattstavning.laddar', 'Läser igenom brevet …')}
          </p>
        )}
        {lage.typ === 'inga' && (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            {t('rattstavning.inga', 'Vi hittade inget att rätta. Din text står kvar som den är.')}
          </p>
        )}
        {lage.typ === 'fel' && (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            {t('rattstavning.fel', 'Det gick inte att kolla stavningen just nu. Din text är orörd. Försök igen om en stund.')}
          </p>
        )}
        {lage.typ === 'klart' && (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            {lage.tillampade === 0
              ? t('rattstavning.inget', 'Inga ändringar gjordes.')
              : t('rattstavning.klart', 'Klart. {{antal}} ändringar gjordes.', { antal: lage.tillampade })}
            {lage.overhoppade > 0 &&
              ' ' + t('rattstavning.overhoppade', '{{antal}} passade inte längre in i texten och hoppades över.', { antal: lage.overhoppade })}
          </p>
        )}
      </div>

      {lage.typ === 'forslag' && (
        <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <p id={listId} className="text-sm font-medium text-stone-800 dark:text-stone-100">
            {t('rattstavning.rubrik', 'Förslag på rättelser. Välj vilka du vill göra.')}
          </p>
          <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
            {t('rattstavning.forklaring', 'AI:n föreslår bara små ändringar av stavning och böjning. Inget ändras förrän du trycker på knappen nedan.')}
          </p>
          <ul aria-labelledby={listId} className="mt-3 space-y-2">
            {lage.lista.map((r, i) => {
              const id = `${listId}-${i}`
              return (
                <li key={id} className="flex items-start gap-3">
                  <input
                    id={id}
                    type="checkbox"
                    checked={valda.has(i)}
                    onChange={() => vaxla(i)}
                    className="mt-1 h-5 w-5 shrink-0"
                  />
                  <label htmlFor={id} className="text-sm text-stone-900 dark:text-stone-100">
                    <span className="sr-only">{t('rattstavning.fore', 'Nu:')} </span>
                    <del className="decoration-2">{r.fore}</del>
                    <span aria-hidden="true"> → </span>
                    <span className="sr-only"> {t('rattstavning.efter', 'Blir:')} </span>
                    <ins className="font-medium underline decoration-2">{r.efter}</ins>
                  </label>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={gor} disabled={valda.size === 0}>
              {t('rattstavning.gor', 'Gör de valda ändringarna')}
              {valda.size > 0 ? ` (${valda.size})` : ''}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setValda(new Set(lage.lista.map((_, i) => i)))}
            >
              {t('rattstavning.valjAlla', 'Välj alla')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLage({ typ: 'vilar' })}>
              {t('rattstavning.avbryt', 'Inte nu')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
