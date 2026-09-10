/**
 * Bilderna på Översikt — stiltest 2026-09-10 (docs/BILDPROMPTER-SIDOR.md §0).
 *
 * Två stilar prövas mot samma fyra platser: A (mjuk realism) och B (EA Sports).
 * Vilken som visas styrs av `localStorage.oversiktBildvariant` ('A' | 'B'),
 * default A, så båda går att skärmdumpa på samma bygge utan omdeploy. När
 * Mikael valt tas växeln bort och vinnaren blir en vanlig konstant.
 *
 * Bilderna kommer ur `client/scripts/optimize-illustrations.cjs`:
 *   scen-oversikt-<v>.webp     bred scen, naturlig bakgrund (ingen chroma-key)
 *   spel-oversikt-<v>-1..4     frilagda utsnitt: vägvisare, tom anteckningsbok,
 *                              sneakers, kikare
 *
 * Alla är dekorativa (`aria-hidden`); rubriken bär betydelsen (GRAFIK-PLAN §1).
 */

export type Bildvariant = 'A' | 'B'

export function bildvariant(): Bildvariant {
  try {
    const v = localStorage.getItem('oversiktBildvariant')
    if (v === 'B') return 'B'
  } catch {
    /* privat läge / blockerad lagring → default */
  }
  return 'A'
}

export function oversiktBilder(v: Bildvariant = bildvariant()) {
  const bas = '/illustrations'
  return {
    scen: `${bas}/scen-oversikt-${v}.webp`,
    vagvisare: `${bas}/spel-oversikt-${v}-1.webp`,
    anteckningsbok: `${bas}/spel-oversikt-${v}-2.webp`,
    sneakers: `${bas}/spel-oversikt-${v}-3.webp`,
    kikare: `${bas}/spel-oversikt-${v}-4.webp`,
  }
}
