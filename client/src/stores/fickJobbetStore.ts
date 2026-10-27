/**
 * FN14: vilken ansökan som just fick statusen "anställd" och ska få ett
 * grattiskort. Sätts av useApplications när statusbytet lyckats, läses av
 * FickJobbetKort på /applications. Inte persisterat — kortet visas en gång.
 */
import { create } from 'zustand'

export interface FickJobbetAnsokan {
  id: string
  titel: string
  foretag: string
}

interface State {
  ansokan: FickJobbetAnsokan | null
  visa: (a: FickJobbetAnsokan) => void
  stang: () => void
}

export const useFickJobbetStore = create<State>((set) => ({
  ansokan: null,
  visa: (ansokan) => set({ ansokan }),
  stang: () => set({ ansokan: null }),
}))
