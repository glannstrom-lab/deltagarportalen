/**
 * UX18 — samtyckesgrindarna ska inte ljuga.
 *
 * Tre påståenden, alla verifierade mot koden 2026-08-04 innan de rättades:
 *
 *  (a) `wellness.consent.whoAccessDesc` sa "Endast du och din handledare (om du
 *      har en) kan se din hälsodata" — falskt. Konsulenten ser den bara vid
 *      separat samtycke i `participant_data_sharing`, som är av som default.
 *      Texten sa fel sak i exakt det ögonblick personen skulle bestämma sig.
 *  (b) Grinden lovar tre gånger att samtycket kan återkallas "i Inställningar >
 *      Sekretess". Där fanns fyra samtycken — villkor, integritet, AI,
 *      marknadsföring — men inget hälso- eller välmåendesamtycke. Enkelriktat.
 *  (c) Grinden hade ingen väg vidare utan att säga ja.
 *
 * Testerna läser locale-filerna direkt. i18next-nyckeln vinner över komponentens
 * hårdkodade fallback, så det är JSON:en som avgör vad användaren faktiskt ser —
 * exakt den fällan som gjorde att `WellnessConsentGate.tsx:192` hade rätt
 * formulering i koden medan användaren möttes av fel.
 */
import { describe, it, expect } from 'vitest'
import sv from '@/i18n/locales/sv.json'
import en from '@/i18n/locales/en.json'

/** Locale-filerna är stora och otypade — den här formen är allt testerna rör. */
interface ConsentLocale {
  wellness: { consent: Record<string, string> }
  health: { consent: Record<string, string> }
  settings: { privacy: { consent: Record<string, string> } }
}

const LOCALES: ReadonlyArray<readonly [string, ConsentLocale]> = [
  ['sv', sv as unknown as ConsentLocale],
  ['en', en as unknown as ConsentLocale],
]

function consent(locale: ConsentLocale, ns: 'wellness' | 'health') {
  return locale[ns].consent
}

describe('(a) whoAccessDesc säger sanningen om vem som ser datan', () => {
  it.each(LOCALES)('%s: hälsotexten påstår inte att konsulenten ser datan utan delning', (_name, locale) => {
    const text = consent(locale, 'wellness').whoAccessDesc.toLowerCase()

    // Den gamla lögnen ordagrant — får aldrig komma tillbaka
    expect(text).not.toContain('endast du och din handledare')
    expect(text).not.toContain('only you and your counselor')
    // Villkoret måste finnas med: konsulenten ser det bara om DU slår på delning
    expect(text).toMatch(/delning|sharing/)
  })

  it.each(LOCALES)('%s: funktionsförutsättningarnas text har kvar sitt villkor', (_name, locale) => {
    const text = consent(locale, 'health').whoAccessDesc.toLowerCase()
    expect(text).toMatch(/endast om du|only if you/)
  })
})

describe('(b) löftet om återkallande motsvaras av en väg i Inställningar', () => {
  it.each(LOCALES)('%s: grinden lovar återkallande i Inställningar', (_name, locale) => {
    const text = consent(locale, 'wellness').withdrawDetail1.toLowerCase()
    expect(text).toMatch(/inställningar|settings/)
  })

  it.each(LOCALES)('%s: Inställningar har kort för båda art. 9-samtyckena', (_name, locale) => {
    // Utan de här nycklarna renderas korten med rå fallback — och löftet i
    // grinden pekar på en sida som inte kan infria det.
    const settings = locale.settings.privacy.consent

    expect(settings.wellness).toBeTruthy()
    expect(settings.wellnessDesc).toBeTruthy()
    expect(settings.health).toBeTruthy()
    expect(settings.healthDesc).toBeTruthy()
    expect(settings.withdraw).toBeTruthy()
  })

  it.each(LOCALES)('%s: beskrivningen säger att delningen stängs av och att gammal data ligger kvar', (_name, locale) => {
    const settings = locale.settings.privacy.consent

    for (const text of [settings.wellnessDesc, settings.healthDesc]) {
      expect(text.toLowerCase()).toMatch(/delning|sharing/)
      expect(text.toLowerCase()).toMatch(/ligger kvar|stays/)
    }
  })

  it.each(LOCALES)('%s: det finns ett ärligt besked när delningen inte gick att stänga av', (_name, locale) => {
    const settings = locale.settings.privacy.consent

    expect(settings.sharingStopFailed).toBeTruthy()
  })
})

describe('(c) det går att säga nej', () => {
  it.each(LOCALES)('%s: båda grindarna har en decline-text', (_name, locale) => {
    expect(consent(locale, 'wellness').decline).toBeTruthy()
    expect(consent(locale, 'health').decline).toBeTruthy()
  })
})
