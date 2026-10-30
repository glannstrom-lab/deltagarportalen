/**
 * Spärr A2 (ROADMAP, rad "Spärr för AIX11–AIX22"): juristfrågan om rättslig
 * grund för att konsulentens AI behandlar deltagarens data ska vara besvarad
 * innan AI-funktionerna för personalen släpps till kund.
 *
 * EN konstant för alla: journalpost från stolpar (AIX11), text till nämnd
 * (AIX16) och aktivitetsförslag (AIX21). Push är deploy, så koden ligger i drift
 * men knapparna är av. Sätt true först när A2 är besvarad — och bara då.
 *
 * Varje funktion tar konstanten som standardvärde på en prop, så att ett test
 * kan slå på den enskilt; ett test per funktion kräver att standardläget är av.
 */
export const A2_BESVARAD = false
