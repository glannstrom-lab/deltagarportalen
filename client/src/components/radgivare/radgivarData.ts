/**
 * Uppslaget av sidans rådgivarinnehåll.
 *
 * Egen fil eftersom `react-refresh/only-export-components` inte tillåter att
 * en komponentfil också exporterar funktioner. Samma skäl som
 * `lib/palettMatchning.ts` och `pages/consultant/cohorts.ts` — och samma regel
 * har nu fällt mig tre gånger, vilket är ett tecken på att uppdelningen är
 * rätt och att jag borde göra den direkt nästa gång.
 */

import { getCoachContentForPage, getPageKeyForPath, type PageCoachContent } from '@/data/coaches'

/** Sidans rådgivarinnehåll, eller null när sidan saknar det. */
export function radgivareForPath(pathname: string): PageCoachContent | null {
  const key = getPageKeyForPath(pathname)
  return key ? getCoachContentForPage(key) : null
}
