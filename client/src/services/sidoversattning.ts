/**
 * sidoversattning — "Översätt sidan" med Google (RD31, rollspelet 2026-09-27).
 *
 * Mekaniken bor i dag i `components/layout/GoogleTranslate.tsx` (toppnaven på
 * dator, dold under md). Den här modulen är samma mekanik som en tjänst, så att
 * språkmenyn på mobil och Inställningar kan använda den utan att kopiera en
 * komponent. GoogleTranslate.tsx bör på sikt läsa härifrån i stället för att ha
 * sin egen kopia — nycklarna (`googleTranslateLanguage`, cookien `googtrans`)
 * är desamma, så de två vägarna ser samma val.
 *
 * Valet sparas och sidan laddas om; skriptet laddas vid nästa montering av
 * GoogleTranslate (som finns i skalet på alla sidor). Somaliska, arabiska,
 * tigrinja m.fl. — portalens egna språk är bara svenska och engelska.
 */

export interface OversattSprak {
  code: string
  /** Namnet på språket självt. */
  name: string
  /** Engelskt namn, för skärmläsare. */
  english: string
}

/** Samma lista och ordning som GoogleTranslate.tsx. */
export const OVERSATT_SPRAK: readonly OversattSprak[] = [
  { code: 'en', name: 'English', english: 'English' },
  { code: 'ar', name: 'العربية', english: 'Arabic' },
  { code: 'fa', name: 'فارسی', english: 'Persian' },
  { code: 'so', name: 'Soomaali', english: 'Somali' },
  { code: 'ti', name: 'ትግርኛ', english: 'Tigrinya' },
  { code: 'uk', name: 'Українська', english: 'Ukrainian' },
  { code: 'pl', name: 'Polski', english: 'Polish' },
  { code: 'de', name: 'Deutsch', english: 'German' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'es', name: 'Español', english: 'Spanish' },
  { code: 'fi', name: 'Suomi', english: 'Finnish' },
  { code: 'ru', name: 'Русский', english: 'Russian' },
  { code: 'zh-CN', name: '中文', english: 'Chinese' },
] as const

const STORAGE_KEY = 'googleTranslateLanguage'

export function valtOversattSprak(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // localStorage kan vara avstängt — då finns inget sparat val
  }
}

function sattCookie(code: string) {
  const value = `/sv/${code}`
  const domain = window.location.hostname
  document.cookie = `googtrans=${value}; path=/`
  if (domain !== 'localhost' && domain !== '127.0.0.1') {
    document.cookie = `googtrans=${value}; path=/; domain=.${domain}`
  }
}

function rensaCookies() {
  const domain = window.location.hostname
  const utgangen = 'Thu, 01 Jan 1970 00:00:00 UTC'
  document.cookie = `googtrans=; expires=${utgangen}; path=/`
  document.cookie = `googtrans=; expires=${utgangen}; path=/; domain=.${domain}`
  document.cookie = `googtrans=; expires=${utgangen}; path=/; domain=${domain}`
}

/** Injicerbar omladdning, för test. */
export const sidan = {
  laddaOm: () => window.location.reload(),
}

/** Översätt sidan till `code`. Laddar om sidan. */
export function oversattTill(code: string): void {
  if (!OVERSATT_SPRAK.some((s) => s.code === code)) throw new Error(`Okänt språk: ${code}`)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Utan localStorage bär cookien valet ensam — Google läser den.
  }
  sattCookie(code)
  sidan.laddaOm()
}

/** Tillbaka till svenska (originalet). Laddar om sidan. */
export function visaOriginal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Inget sparat att ta bort.
  }
  rensaCookies()
  sidan.laddaOm()
}
