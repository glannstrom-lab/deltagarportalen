/**
 * En CV-sektion med poster (erfarenhet, utbildning) vars rubrik följer med
 * när sektionen fortsätter på nästa sida i PDF:en.
 *
 * Varför en tabell: Chrome upprepar en riktig `<thead>` överst på varje sida
 * som tabellen löper över — det är den enda inbyggda mekanism som ger
 * "ERFARENHET" överst på sida 2 utan att vi själva räknar ut sidbrytningarna.
 * Uppmätt 2026-10-14: `display: table-header-group` på en `<div>`/`<h2>`
 * upprepas INTE, bara `<thead>`-elementet. JS-paginering är redan prövad och
 * övergiven (se CVPrintLayout.tsx).
 *
 * Tabellen är layout, inte data, och har därför `role="presentation"` —
 * skärmläsaren ser rubriken och posterna som förut. Posterna hålls hela av
 * `break-inside: avoid` på `.cv-entry` (typografi.ts och CVPrintLayout.tsx).
 *
 * Vaktas av `node e2e/cv-pdf-sidbrytning.cjs`, som mäter i den färdiga PDF:en.
 */

import type { CSSProperties, ReactNode } from 'react'

const TABELL: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  tableLayout: 'fixed',
}
const CELL: CSSProperties = { padding: 0, verticalAlign: 'top' }

interface PostSektionProps {
  /** Sektionsrubriken, som mallen ritar den. */
  rubrik: ReactNode
  style?: CSSProperties
  children: ReactNode
}

export function PostSektion({ rubrik, style, children }: PostSektionProps) {
  return (
    <section className="cv-postsektion" style={style}>
      <table role="presentation" style={TABELL}>
        <thead>
          <tr>
            <td style={CELL}>{rubrik}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={CELL}>{children}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
