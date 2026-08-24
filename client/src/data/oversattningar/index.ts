/**
 * Körningslagret för innehållsöversättning.
 *
 * Overlayerna (`*.en.json`) importeras **dynamiskt och bara när språket är
 * engelska** — en svensk användare laddar aldrig ned dem. Samma princip som
 * `i18n/config.ts` använder för `en.json`, och av samma skäl: innehållet är
 * stort och de flesta användarna kör svenska.
 *
 * Två ingångar, för att konsumenterna ser olika ut:
 *   · `oversattInnehall()` — async, för tjänstelagret (t.ex. `contentApi`),
 *     där datan ändå hämtas i en `await`-kedja.
 *   · `useInnehall()` — hook, för komponenter som läser en modulkonstant
 *     direkt (`EXTERNA_RESURSER`, `COACHES`).
 *
 * Båda faller tillbaka på svenskan tills overlayen är inne, och för alltid om
 * en nyckel saknas. Ett saknat värde ger alltså svensk text, aldrig tom text.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { oversattStruktur, type Overlay } from '@/lib/innehallsOversattning'

/** Modulnamn → dynamisk import av dess engelska overlay. */
const LADDARE: Record<string, () => Promise<{ default: Overlay }>> = {
  exercises: () => import('./exercises.en.json'),
  interestGuide: () => import('./interestGuide.en.json'),
  externaResurser: () => import('./externaResurser.en.json'),
  coaches: () => import('./coaches.en.json'),
}

export type Innehallsmodulnamn = keyof typeof LADDARE

const cache = new Map<string, Overlay>()
const pagaende = new Map<string, Promise<Overlay>>()

/** Hämtar (och minns) en overlay. Tom overlay om modulen saknar fil. */
export async function hamtaOverlay(modul: string): Promise<Overlay> {
  const traff = cache.get(modul)
  if (traff) return traff

  const redanIgang = pagaende.get(modul)
  if (redanIgang) return redanIgang

  const laddare = LADDARE[modul]
  if (!laddare) return {}

  const p = laddare()
    .then((m) => {
      const overlay = (m.default ?? m) as Overlay
      cache.set(modul, overlay)
      pagaende.delete(modul)
      return overlay
    })
    .catch((err) => {
      // Faller tillbaka på svenska hellre än att krascha sidan.
      console.warn('[innehall] Kunde inte ladda översättning:', modul, err)
      pagaende.delete(modul)
      return {} as Overlay
    })

  pagaende.set(modul, p)
  return p
}

/** Aktivt språk, oberoende av React — för tjänstelagret. */
function aktivtSprak(): string {
  try {
    return localStorage.getItem('language') || 'sv'
  } catch {
    return 'sv'
  }
}

/**
 * Översätter en datastruktur till aktivt språk. Är språket svenska returneras
 * datan oförändrad utan att någon overlay hämtas.
 *
 * `prefix` är exportnamnet som nycklarna byggdes från — `oversattInnehall(
 * 'exercises', lista, 'exercises')` matchar nyckeln `exercises.strengths.title`.
 */
export async function oversattInnehall<T>(
  modul: Innehallsmodulnamn,
  data: T,
  prefix: string
): Promise<T> {
  if (aktivtSprak() === 'sv') return data
  const overlay = await hamtaOverlay(modul)
  if (!Object.keys(overlay).length) return data
  return oversattStruktur(data, overlay, prefix)
}

/**
 * Hook-varianten. Returnerar svenskan direkt vid första renderingen och
 * ersätter den när overlayen är inne — inget laddningstillstånd behövs,
 * eftersom svenskan är fullt läsbar under tiden.
 */
export function useInnehall<T>(modul: Innehallsmodulnamn, data: T, prefix: string): T {
  const { i18n } = useTranslation()
  const sprak = i18n.language
  const [overlay, setOverlay] = useState<Overlay>(() => cache.get(modul) ?? {})

  useEffect(() => {
    if (sprak === 'sv') {
      setOverlay({})
      return
    }
    let avbruten = false
    void hamtaOverlay(modul).then((o) => {
      if (!avbruten) setOverlay(o)
    })
    return () => {
      avbruten = true
    }
  }, [modul, sprak])

  return useMemo(() => {
    if (sprak === 'sv' || !Object.keys(overlay).length) return data
    return oversattStruktur(data, overlay, prefix)
  }, [data, overlay, prefix, sprak])
}
