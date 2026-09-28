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
 * Valet sparas och sidan laddas om; skriptet laddas av `startaSparadOversattning()`
 * vid appstart (main.tsx). NY1 (rollspelet 2026-09-28): tidigare laddades det
 * bara när GoogleTranslate monterades, och den finns bara i datorns toppmeny —
 * på mobil sparades valet men sidan förblev svensk. Somaliska, arabiska,
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

/** Laddar Googles översättningsskript med valt språk. Idempotent. */
function laddaGoogleSkript(code: string): void {
  if (document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) return
  let container = document.getElementById('google_translate_element')
  if (!container) {
    container = document.createElement('div')
    container.id = 'google_translate_element'
    container.style.display = 'none'
    document.body.appendChild(container)
  }
  sattCookie(code)
  const win = window as Window & {
    googleTranslateElementInit?: () => void
    google?: { translate?: { TranslateElement: new (config: object, id: string) => void } }
  }
  win.googleTranslateElementInit = () => {
    if (win.google?.translate?.TranslateElement) {
      new win.google.translate.TranslateElement({ pageLanguage: 'sv', autoDisplay: false }, 'google_translate_element')
    }
  }
  const script = document.createElement('script')
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  script.async = true
  document.head.appendChild(script)
}

/**
 * Körs en gång vid appstart, oavsett layout (dator, mobil, utloggad).
 * Finns ett sparat språkval laddas skriptet; annars händer ingenting —
 * Google får ingen sidtext förrän användaren själv valt ett språk.
 */
export function startaSparadOversattning(): void {
  const valt = valtOversattSprak()
  if (valt && OVERSATT_SPRAK.some((s) => s.code === valt)) laddaGoogleSkript(valt)
}
