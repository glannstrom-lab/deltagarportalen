/**
 * En jobb- eller utbildningsbeskrivning med användarens egna radbrytningar
 * och punktlistor bevarade. Se `beskrivningsblock` i `typografi.ts`.
 *
 * `style` gäller hela blocket (storlek, färg, radavstånd) — mallen bestämmer
 * utseendet, komponenten bara strukturen.
 */

import { Fragment, type CSSProperties } from 'react'
import { beskrivningsblock } from './typografi'

interface BeskrivningProps {
  text?: string | null
  style?: CSSProperties
}

export function Beskrivning({ text, style }: BeskrivningProps) {
  const block = beskrivningsblock(text)
  if (block.length === 0) return null
  return (
    <div style={style}>
      {block.map((b, i) =>
        b.typ === 'lista' ? (
          <ul key={i} className="cv-punkter">
            {b.punkter.map((p, j) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="cv-stycke">
            {b.rader.map((r, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {r}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
