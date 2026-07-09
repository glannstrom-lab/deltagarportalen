/**
 * Utkast från fokuslägets spontanansökan-wizard.
 * Sparas i localStorage så att det deltagaren skrev i fokusläget
 * (bransch, företag, meddelande) inte går förlorat, och kan följa med
 * som anteckning när företaget sparas i normalvyn (SearchTab).
 */

export interface SpontaneousFocusDraft {
  industry: string
  company: string
  message: string
  createdAt: string
}

const STORAGE_KEY = 'spontaneous-focus-draft'

export function saveSpontaneousFocusDraft(draft: Omit<SpontaneousFocusDraft, 'createdAt'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, createdAt: new Date().toISOString() }))
  } catch {
    // localStorage kan vara otillgängligt (privat läge) — utkastet är best effort
  }
}

export function loadSpontaneousFocusDraft(): SpontaneousFocusDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SpontaneousFocusDraft>
    const draft: SpontaneousFocusDraft = {
      industry: typeof parsed.industry === 'string' ? parsed.industry : '',
      company: typeof parsed.company === 'string' ? parsed.company : '',
      message: typeof parsed.message === 'string' ? parsed.message : '',
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
    }
    if (!draft.company && !draft.message) return null
    return draft
  } catch {
    return null
  }
}

export function clearSpontaneousFocusDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
