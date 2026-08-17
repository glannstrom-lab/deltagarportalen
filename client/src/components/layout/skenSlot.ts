/**
 * En plats i sidoskenan som en undersida kan fylla.
 *
 * Problemet (sett i webbläsaren 2026-08-17, /cv vid 1440 px, påpekat av
 * Mikael): CV-sidan hade **två** vänsterkolumner. `PageLayout` ritar skenan med
 * sidans rubrik och de fem CV-flikarna; `CVBuilder` ritade sin egen skena med
 * stegöversikten ("Innehåll i ditt CV"). Tillsammans ~330 px innan innehållet
 * började — tvärtemot hela poängen med att ta bort hjälten.
 *
 * Båda listorna behövs. CV:s egna flikar finns inte i navigationens andra rad,
 * och stegöversikten är sidans arbetsstruktur. Det är alltså inte en av dem som
 * ska bort, utan de ska dela kolumn.
 *
 * Varför en portal och inte en prop: `CVPage` renderar `PageLayout`, och
 * `CVBuilder` är ett *ruttbarn* till den. Ett barn kan inte skicka innehåll
 * uppåt via props. Skenan exponerar därför en DOM-nod, och barnet renderar in i
 * den med `createPortal` — React-trädet är oförändrat, så kontext, tillstånd
 * och händelser fungerar precis som förut. Bara den fysiska platsen flyttar.
 */

import { createContext, useContext } from 'react'

/** Noden att portalera in i, eller null när sidan saknar skena (mobil). */
export const SkenSlotContext = createContext<HTMLElement | null>(null)

export function useSkenSlot(): HTMLElement | null {
  return useContext(SkenSlotContext)
}
