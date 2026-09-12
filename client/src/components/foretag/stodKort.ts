/**
 * stodKort — den företagsvända bilden av data/anstallningsstod.ts.
 *
 * Renderar ALDRIG belopp, procent eller belopp-liknande tal: fälten `belopp`,
 * `vadArbetsgivarenFar` och `konsulentErfarenhet` läses inte alls, och varje
 * textrad som ändå bär "N kr" / "N %" filtreras bort (utanBelopp). Beslut om
 * stöd fattas av Arbetsförmedlingen — det är raden företaget ska ta med sig,
 * inte en siffra. Vaktas av StodFlik.test.tsx.
 */

import type { Anstallningsstod } from '@/data/anstallningsstod'

/** Sant om texten INTE bär ett belopp, en procentsats eller ett kronbelopp. */
export function utanBelopp(text: string): boolean {
  return !/\d[\d\s.,]*\s*(kr|kronor|%|procent)/i.test(text)
}

export interface StodKort {
  id: string
  namn: string
  kort: string
  kravPaEr: string[]
  langd: string | null
  ansokan: string | null
  lank: string
}

export function byggStodKort(stod: readonly Anstallningsstod[]): StodKort[] {
  return stod
    .filter((s) => utanBelopp(s.sammanfattning))
    .map((s) => ({
      id: s.id,
      namn: s.namn,
      kort: s.sammanfattning,
      kravPaEr: s.fallgropar.filter(utanBelopp),
      langd: utanBelopp(s.langd) ? s.langd : null,
      ansokan: utanBelopp(s.ansokningsvag) ? s.ansokningsvag : null,
      lank: s.kalla,
    }))
}
