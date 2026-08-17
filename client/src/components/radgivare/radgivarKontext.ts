/**
 * Håller reda på vilka råd som redan står infogade i sidan.
 *
 * Problemet det löser (sett i webbläsaren 2026-08-17, /linkedin-optimizer vid
 * 1440 px): rådgivarna finns numera på två ställen samtidigt — ett infogat kort
 * i innehållet och en kolumn till höger. Sjutton av tjugo sidor renderar det
 * infogade kortet med `index={0}`, alltså precis det råd kolumnen leder med.
 * Samma mening stod därmed ordagrant två gånger inom samma vy.
 *
 * Båda ytorna ska finnas — det var beställningen. Men de ska inte säga samma
 * sak. Kortet registrerar sitt råd här, kolumnen hoppar över det som redan är
 * sagt, och kolumnen visar resten.
 *
 * ── Två kontexter, inte en ────────────────────────────────────────────────
 *
 * Första utkastet hade ETT kontextobjekt med både mängden och funktionerna, och
 * **kraschade sidan**: objektet byter identitet varje gång mängden ändras, låg
 * i registreringseffektens beroendelista, och gav därmed en oändlig loop
 * avregistrera → registrera → ny mängd → nytt objekt → avregistrera. Felgränsen
 * fångade den som "Något gick fel".
 *
 * Uppdelningen är fixen: `RadgivarTipsApiContext` bär bara `useCallback`-stabila
 * funktioner och ändrar sig aldrig, så effekten kör en gång. Kolumnen läser
 * `VisadeTipsContext`, som byter identitet — men den har ingen effekt som
 * beror på den.
 *
 * Egen `.ts`-fil utan komponenter — `react-refresh/only-export-components`
 * tillåter inte att en komponentfil också exporterar kontext och hookar.
 */

import { createContext, useContext } from 'react'

export interface RadgivarTipsApi {
  registrera: (rad: string) => void
  avregistrera: (rad: string) => void
}

/** Stabilt. Får ALDRIG byta identitet — se loopen ovan. */
export const RadgivarTipsApiContext = createContext<RadgivarTipsApi | null>(null)

/** Föränderligt. Läses av kolumnen, aldrig av en effekt. */
export const VisadeTipsContext = createContext<ReadonlySet<string>>(new Set())

/**
 * Null när ingen provider finns — t.ex. i enhetstester som renderar panelen
 * ensam, eller på sidor som ritar rådgivaren själva (CV-byggaren). Då visas
 * alla råd, vilket är samma beteende som före 2026-08-17.
 */
export function useRadgivarTipsApi(): RadgivarTipsApi | null {
  return useContext(RadgivarTipsApiContext)
}

export function useVisadeTips(): ReadonlySet<string> {
  return useContext(VisadeTipsContext)
}
