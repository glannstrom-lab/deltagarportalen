/**
 * CV-mallarnas typsnitt — laddas av mallarna själva, inte av portalens skal.
 *
 * VARFÖR. Sju av tolv mallar angav `'Inter'`, som aldrig laddades någonstans
 * (se kommentaren i `index.css`). PDF:en sattes alltså i vad Chromium råkade
 * ha: Arial i en lokal Chrome på Windows, något helt annat i Lambda-Chromium i
 * prod. Executive angav `'Georgia'`, som inte finns på Linux alls. Förhands-
 * visningen och PDF:en kunde därför aldrig garanteras se likadana ut.
 *
 * Nu: en stilmall från Google Fonts (CSP:n tillåter redan fonts.googleapis.com
 * och fonts.gstatic.com), monterad av `CVPreview` och `CVPrintLayout`. Print-
 * vägen (`PrintCV`) väntar dessutom tills mallens typsnitt faktiskt laddats
 * innan `.cv-preview` ritas — `api/cv-pdf.js` väntar på just den väljaren, så
 * PDF:en tas aldrig med ett reservtypsnitt.
 *
 * Portalens eget UI-typsnitt (index.html / tokens.css) är en annan sak och
 * rörs inte härifrån.
 */

export const CV_TYPSNITT_ID = 'cv-mallar-typsnitt'

export const CV_TYPSNITT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400' +
  '&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400' +
  '&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400' +
  '&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400' +
  '&family=Playfair+Display:wght@400;600;700' +
  '&display=swap'

/** Typsnitten varje mall använder — det PrintCV väntar på före utskrift. */
export const MALL_TYPSNITT: Readonly<Record<string, readonly string[]>> = {
  sidebar: ['Inter'],
  centered: ['Source Serif 4', 'Inter'],
  minimal: ['Inter'],
  creative: ['Inter'],
  executive: ['Source Serif 4'],
  nordic: ['Inter'],
  budapest: ['Inter'],
  rotterdam: ['Inter'],
  chicago: ['Source Serif 4', 'Inter'],
  atelier: ['Crimson Pro', 'Source Sans 3'],
  manhattan: ['Playfair Display', 'Source Sans 3'],
  berlin: ['Inter'],
}

/** Lägger till stilmallen en gång per dokument. Säker att anropa ofta. */
export function monteraCvTypsnitt(): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null
  const finns = document.getElementById(CV_TYPSNITT_ID)
  if (finns instanceof HTMLLinkElement) return finns
  const link = document.createElement('link')
  link.id = CV_TYPSNITT_ID
  link.rel = 'stylesheet'
  link.href = CV_TYPSNITT_HREF
  document.head.appendChild(link)
  return link
}

// Svenska tecken ligger i Google Fonts latin-ext-delmängd; utan dem i provet
// laddas bara latin, och "Glännström" sätts i två typsnitt.
const PROV = 'Åå Ää Öö Éé Üü – 0123456789'

/**
 * Väntar tills mallens typsnitt finns, högst `maxMs`. Faller aldrig: går
 * nätet ned ritas CV:t ändå, i reservtypsnittet, hellre än inte alls.
 */
export async function vantaPaCvTypsnitt(mall: string, maxMs = 5000): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  const link = monteraCvTypsnitt()
  const familjer = MALL_TYPSNITT[mall] ?? MALL_TYPSNITT.sidebar

  const laddat = (async () => {
    if (link && !link.sheet) {
      await new Promise<void>((klar) => {
        link.addEventListener('load', () => klar(), { once: true })
        link.addEventListener('error', () => klar(), { once: true })
      })
    }
    await Promise.all(
      familjer.flatMap((f) => [
        document.fonts.load(`400 16px "${f}"`, PROV),
        document.fonts.load(`700 16px "${f}"`, PROV),
        document.fonts.load(`italic 400 16px "${f}"`, PROV),
      ]),
    )
    await document.fonts.ready
  })().catch(() => undefined)

  await Promise.race([laddat, new Promise((klar) => setTimeout(klar, maxMs))])
}
