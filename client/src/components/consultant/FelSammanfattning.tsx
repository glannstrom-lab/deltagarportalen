/**
 * FelSammanfattning — synlig konsekvens när ett formulär inte kan skickas
 * (KH5/KH12, rollspelet 2026-09-28).
 *
 * Problemet: ett obligatoriskt fält längre ned i en dialog med egen scroll gav
 * ett dött klick på primärknappen. Mönstret här: en `role="alert"`-ruta som
 * ligger UTANFÖR dialogens scrollyta (alltså alltid synlig), får fokus när ett
 * försök misslyckas, och listar varje fel som en knapp som scrollar till och
 * fokuserar fältet.
 *
 * Användning:
 *   const [signal, setSignal] = useState(0)
 *   const submit = () => { if (harFel) { setSignal((n) => n + 1); return } … }
 *   <FelSammanfattning signal={signal} fel={[{ fältId: 'namn', text: 'Ange namn' }]} />
 * `signal` ökas vid varje misslyckat försök, så även ett andra klick med samma
 * fel flyttar fokus igen.
 */

import { useEffect, useRef } from 'react'
import { gaTillFalt, type FormularFel } from './gaTillFalt'

interface Props {
  /** Ökas vid varje misslyckat försök att skicka. 0 = inget försök än. */
  signal: number
  fel: FormularFel[]
  className?: string
}

export function FelSammanfattning({ signal, fel, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (signal > 0 && fel.length > 0) ref.current?.focus()
    // Bara ett nytt försök ska flytta fokus, inte att felen ändras medan man rättar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal])

  if (signal === 0 || fel.length === 0) return null

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={
        className ??
        'mx-5 mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-100'
      }
    >
      <p className="font-semibold">
        {fel.length === 1 ? '1 fält behöver fyllas i eller rättas' : `${fel.length} fält behöver fyllas i eller rättas`}
      </p>
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {fel.map((f) => (
          <li key={f.faltId}>
            <button type="button" onClick={() => gaTillFalt(f.faltId)} className="underline underline-offset-2 text-left">
              {f.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
