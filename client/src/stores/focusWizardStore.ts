/**
 * focusWizardStore — vilka sidors fokus-guider användaren har lämnat (UX11).
 *
 * Bakgrund: fokusläget hade bara ETT begrepp — `focusMode` i settingsStore,
 * som persisteras och synkas till kontot. Wizardernas "Hoppa över", "Klar" och
 * verktygslänkar band alla mot `toggleFocusMode`, så varje sätt att lämna en
 * guide **stängde av hela tillgänglighetsfunktionen** — permanent, på alla
 * sidor. För en NPF-användare upphävde funktionen sig själv.
 *
 * Den här storen bär det andra begreppet: *"jag vill se hela den här sidan"*.
 * Fokusläget förblir på; nästa sida öppnas fortfarande i guidat läge.
 *
 * **Medvetet INTE persisterad.** Att lämna en guide är ett beslut om just nu,
 * inte en inställning. Efter omladdning möter guiden användaren igen — det är
 * vad "fokusläget är på" betyder. Att spara den här listan hade smugit tillbaka
 * samma bugg genom en annan dörr, bara långsammare.
 */

import { create } from 'zustand'

interface FocusWizardState {
  /** Sökvägar där användaren valt att se hela sidan i stället för guiden. */
  dismissedPaths: string[]
  /** Lämna guiden på en sökväg. Fokusläget påverkas inte. */
  leaveWizard: (path: string) => void
  /** Visa guiden igen på en sökväg. */
  restoreWizard: (path: string) => void
  /** Nollställ allt — anropas när fokusläget slås av/på. */
  resetDismissed: () => void
}

export const useFocusWizardStore = create<FocusWizardState>((set) => ({
  dismissedPaths: [],
  leaveWizard: (path) =>
    set((state) =>
      state.dismissedPaths.includes(path)
        ? state
        : { dismissedPaths: [...state.dismissedPaths, path] }
    ),
  restoreWizard: (path) =>
    set((state) => ({ dismissedPaths: state.dismissedPaths.filter((p) => p !== path) })),
  resetDismissed: () => set({ dismissedPaths: [] }),
}))
