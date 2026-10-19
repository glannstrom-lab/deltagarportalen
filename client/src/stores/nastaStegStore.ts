/**
 * Varje rolls nästa steg som mål (2026-10-19). Menyns prick och knappens puls
 * läser härifrån — de räknar aldrig själva.
 *
 * Konsulentens och företagets steg räknas fram av den sida som redan hämtar
 * underlaget (deras Översikt) — att hämta allt det en gång till för menyns
 * skull vore dubbla frågor och en andra sanning. Deltagarens räknas av
 * NastaStegBeraknare i Layout ur samma sammanfattning som staden använder.
 *
 * `undefined` = vi vet inte än (sidan har inte räknat) → ingen prick.
 * `null` = inget nästa steg → ingen prick.
 * Inte persisterat: ett nytt besök räknar om.
 */
import { create } from 'zustand'
import type { NastaStegMal } from '@/lib/nastaStegMal'

interface NastaStegState {
  deltagare: NastaStegMal | null | undefined
  konsulent: NastaStegMal | null | undefined
  foretag: NastaStegMal | null | undefined
  /** Fokusnycklar som klickats i den här sessionen — de pulserar inte igen. */
  klickade: string[]
  satt: (roll: 'deltagare' | 'konsulent' | 'foretag', mal: NastaStegMal | null) => void
  klickad: (fokus: string) => void
}

export const useNastaStegStore = create<NastaStegState>((set) => ({
  deltagare: undefined,
  konsulent: undefined,
  foretag: undefined,
  klickade: [],
  satt: (roll, mal) =>
    set((s) => {
      const nu = s[roll]
      if (nu === mal || (nu && mal && nu.vag === mal.vag && nu.fokus === mal.fokus)) return s
      return { ...s, [roll]: mal }
    }),
  klickad: (fokus) => set((s) => (s.klickade.includes(fokus) ? s : { klickade: [...s.klickade, fokus] })),
}))
