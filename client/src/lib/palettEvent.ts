/**
 * Att öppna kommandopaletten utifrån.
 *
 * Bakgrund (2026-08-17, samma dag som paletten byggdes): den skickades först
 * med **enbart** `Ctrl/⌘ K` och ingen synlig utlösare. Den sökrutan som skulle
 * bära upptäckbarheten låg i den tvåradiga toppnaven — alltså steg 2, som är
 * avstängt bakom en flagga. Steg 1 kallades "fristående och levererar direkt",
 * men levererade i praktiken ingenting för den som inte redan kände till
 * genvägen.
 *
 * Det är ett allvarligare fel än det låter: paletten finns för att lösa
 * "svårt att hitta saker", och en tangentgenväg utan affordans är det svåraste
 * som finns att hitta. För en målgrupp som uttryckligen beskrivs ha låg
 * digital vana är `Ctrl+K` ungefär det sista de skulle prova.
 *
 * Varför ett DOM-event och inte en store eller en context: det handlar om en
 * (1) boolean som ska sättas från två håll. En zustand-store eller en provider
 * hade varit mer maskineri än problemet, och paletten lyssnar redan på
 * `document` för tangentbordet — det här är samma mönster.
 */

/** Händelsen paletten lyssnar på. */
export const PALETT_OPPNA = 'jobin:oppna-palett'

/** Öppnar kommandopaletten. Anropas av sökrutorna i TopBar och MobileTopBar. */
export function oppnaPalett(): void {
  document.dispatchEvent(new CustomEvent(PALETT_OPPNA))
}
