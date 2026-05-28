import { useEffect, useState } from 'react'

/**
 * useHideOnScrollDown
 *
 * Returnerar `true` när användaren scrollar nedåt (flytande element bör
 * döljas så de inte täcker innehåll/formulärfält), `false` när man scrollar
 * uppåt eller är nära toppen.
 *
 * Beroende på viewport scrollar antingen fönstret (mobil — layout-roten är
 * `min-h-screen`, så body växer) eller <main id="main-content"> (desktop).
 * Vi summerar båda positionerna (bara en är aktiv åt gången) och lyssnar på
 * båda så att hooken fungerar oavsett vilken som faktiskt scrollar.
 *
 * Används för att dölja FAB:ar (Mina samlingar, Tips) på mobil. Desktop styr
 * synligheten via sm:-klasser i komponenten och påverkas inte.
 */
export function useHideOnScrollDown(threshold = 8): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const el = document.getElementById('main-content')
    const getTop = () => (el?.scrollTop ?? 0) + window.scrollY

    let last = getTop()
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const cur = getTop()
        if (cur < 64) {
          setHidden(false) // nära toppen → alltid synlig
        } else if (cur - last > threshold) {
          setHidden(true) // scrollar nedåt
        } else if (last - cur > threshold) {
          setHidden(false) // scrollar uppåt
        }
        last = cur
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    el?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      el?.removeEventListener('scroll', onScroll)
    }
  }, [threshold])

  return hidden
}

export default useHideOnScrollDown
