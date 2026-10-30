import type { ReactNode } from 'react'
import { delaPaSkyddadeNamn } from '@/i18n/skyddadeNamn'

/**
 * Text med myndighetsnamnen markerade `translate="no"` (FN19). Google Översätt
 * översatte annars "Arbetsförmedlingen" för arabiska, somaliska och tigrinja.
 * Bara textnoder passerar här — aldrig href, kod eller alt-text.
 */
export function Skyddad({ text }: { text: string }): ReactNode {
  const bitar = delaPaSkyddadeNamn(text)
  if (!bitar.some((b) => b.skyddad)) return text
  return bitar.map((b, i) =>
    b.skyddad ? (
      <span key={i} translate="no" className="notranslate">
        {b.text}
      </span>
    ) : (
      b.text
    )
  )
}
