/**
 * Rådgivarens röst — förinspelade klipp, aldrig syntes (se RadgivarHalsning.tsx
 * för varför). Utbruten 2026-10-09 så att Dialogrutan (Jobin-staden) kan
 * använda samma uppspelning överallt.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// ── Vilka klipp har hörts den här sessionen ────────────────────────────────

const HORDA = 'jobin-radgivare-hord'

export function lasHorda(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(HORDA) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function markeraHord(nyckel: string) {
  try {
    const s = lasHorda()
    s.add(nyckel)
    sessionStorage.setItem(HORDA, JSON.stringify([...s]))
  } catch {
    // Privat läge eller blockerad lagring: då kan hälsningen komma igen.
    // Det är det mindre felet jämfört med att aldrig höras.
  }
}

// ── Uppspelningen ──────────────────────────────────────────────────────────

export type Lage = 'tyst' | 'spelar' | 'klar'

/**
 * Ett Audio-element per hälsning. Försöker spela när `autostart` är satt;
 * avvisar webbläsaren står läget kvar på 'tyst' och knappen gör jobbet.
 * Saknas filen (404, nytt språk utan inspelning) döljs ljudknappen — texten
 * räcker då ensam.
 */
export function useRost(src: string, autostart: boolean, nyckel: string) {
  const ref = useRef<HTMLAudioElement | null>(null)
  // Tillståndet bär vilken fil det gäller. Byts filen (språkbyte) gäller det
  // gamla läget inte längre — utan att någon effekt behöver nollställa det.
  const [tillstand, setTillstand] = useState<{ src: string; lage: Lage }>({ src, lage: 'tyst' })
  const [saknasFor, setSaknasFor] = useState<string | null>(null)
  const lage: Lage = tillstand.src === src ? tillstand.lage : 'tyst'
  const saknas = saknasFor === src
  const setSaknas = useCallback(() => setSaknasFor(src), [src])

  useEffect(() => {
    const a = new Audio(src)
    a.preload = autostart ? 'auto' : 'none'
    ref.current = a
    const setLage = (l: Lage) => setTillstand({ src, lage: l })
    const onPlay = () => setLage('spelar')
    const onPause = () => setTillstand((t) => (t.src === src && t.lage === 'spelar' ? { src, lage: 'tyst' } : t))
    const onEnded = () => {
      setLage('klar')
      markeraHord(nyckel)
    }
    const onError = () => setSaknasFor(src)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)

    let avbruten = false
    if (autostart) {
      // Ett kort andrum så att sidan hinner ritas innan någon börjar prata.
      const t = window.setTimeout(() => {
        if (avbruten) return
        a.play().catch(() => {
          /* Blockerat av webbläsaren — knappen finns. */
        })
      }, 600)
      return () => {
        avbruten = true
        window.clearTimeout(t)
        a.pause()
        a.src = ''
        a.removeEventListener('play', onPlay)
        a.removeEventListener('pause', onPause)
        a.removeEventListener('ended', onEnded)
        a.removeEventListener('error', onError)
      }
    }
    return () => {
      a.pause()
      a.src = ''
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
    }
  }, [src, autostart, nyckel])

  const vaxla = useCallback(() => {
    const a = ref.current
    if (!a) return
    if (!a.paused) {
      a.pause()
      return
    }
    if (a.ended) a.currentTime = 0
    a.play().catch(() => setSaknas())
  }, [setSaknas])

  return { lage, saknas, vaxla }
}

