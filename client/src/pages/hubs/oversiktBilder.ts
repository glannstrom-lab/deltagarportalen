/**
 * Bilderna på Översikt — två grafikstilar (beslut Mikael 2026-09-10).
 *
 * Samma fyra platser, två uppsättningar:
 *   mjuk    realistiskt fotografi, dagsljus, ett svenskt kök (standard)
 *   action  renderad realism, dramatiskt ljus, tunneln mot staden
 *
 * Valet bor i `useSettingsStore().grafikstil` (Inställningar → Utseende →
 * Grafik). Stiltestet 2026-09-10 (docs/BILDPROMPTER-SIDOR.md §0) gav båda;
 * i stället för att välja en fick användaren valet.
 *
 * Bilderna kommer ur `client/scripts/optimize-illustrations.cjs`:
 *   scen-oversikt-<stil>.webp     bred scen, naturlig bakgrund (ingen chroma-key)
 *   spel-oversikt-<stil>-1..4     frilagda utsnitt: vägvisare, tom anteckningsbok,
 *                                 sneakers, kikare
 *
 * Alla är dekorativa (`aria-hidden`); rubriken bär betydelsen (GRAFIK-PLAN §1).
 */

import { useSettingsStore, type Grafikstil } from '@/stores/settingsStore'

export function oversiktBilder(stil: Grafikstil) {
  const bas = '/illustrations'
  return {
    scen: `${bas}/scen-oversikt-${stil}.webp`,
    vagvisare: `${bas}/spel-oversikt-${stil}-1.webp`,
    anteckningsbok: `${bas}/spel-oversikt-${stil}-2.webp`,
    sneakers: `${bas}/spel-oversikt-${stil}-3.webp`,
    kikare: `${bas}/spel-oversikt-${stil}-4.webp`,
  }
}

/** Bilderna för den stil användaren valt. Renderar om när valet ändras. */
export function useOversiktBilder() {
  const stil = useSettingsStore((s) => s.grafikstil)
  return oversiktBilder(stil)
}
