import { create } from 'zustand'

export type TyckTillTyp = 'ide' | 'fel'

interface TyckTillState {
  oppen: boolean
  typ: TyckTillTyp
  /** Felet från felsidan, när rapporten öppnas därifrån. */
  bifogatFel: string | null
  /** Det användaren skrivit — ligger kvar om dialogen stängs av misstag. */
  utkast: string
  sattUtkast: (text: string) => void
  oppna: (typ?: TyckTillTyp, bifogatFel?: string | null) => void
  stang: () => void
}

/**
 * En dialog för hela portalen, monterad i App.tsx. Ingångarna (menyn,
 * hjälpsidan, felsidan, konsulenthjälpen) öppnar den här — dialogen bor inte
 * i menyn, för menyn stängs och avmonteras vid klicket.
 */
export const useTyckTillStore = create<TyckTillState>((set) => ({
  oppen: false,
  typ: 'ide',
  bifogatFel: null,
  utkast: '',
  sattUtkast: (utkast) => set({ utkast }),
  oppna: (typ = 'ide', bifogatFel = null) => set({ oppen: true, typ, bifogatFel }),
  stang: () => set({ oppen: false, bifogatFel: null }),
}))
