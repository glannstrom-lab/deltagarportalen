/**
 * SkaladA4 — en A4-sida i miniatyr när skärmen är smalare än papperet.
 *
 * Innehållet ritas alltid i A4-bredd (210 mm = 794 px) och skalas sedan ned
 * med transform så att det ryms. Fram till 2026-10-10 fick CV-mallen i
 * stället telefonens bredd (316 px): sidopanelen och huvudkolumnen trycktes
 * ihop, namnet kapades till "Ann/Exe" och förhandsvisningen blev 3 118 px
 * hög — fyra skärmar svart sidopanel. En förhandsvisning ska se ut som PDF:en.
 *
 * Höjden räknas om efter skalningen, annars lämnar transformen kvar den
 * oskalade höjden som tomrum under sidan.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const A4_BREDD = 794

export function SkaladA4({ children, className }: { children: ReactNode; className?: string }) {
  const yttre = useRef<HTMLDivElement>(null)
  const inre = useRef<HTMLDivElement>(null)
  const [skala, setSkala] = useState(1)
  const [hojd, setHojd] = useState<number | null>(null)

  useLayoutEffect(() => {
    const y = yttre.current
    const i = inre.current
    if (!y || !i) return
    const mat = () => {
      const k = Math.min(1, y.clientWidth / A4_BREDD)
      setSkala(k)
      setHojd(i.offsetHeight * k)
    }
    mat()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(mat)
    ro.observe(y)
    ro.observe(i)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={yttre} className={cn('w-full overflow-hidden', className)} style={hojd !== null ? { height: hojd } : undefined}>
      <div
        ref={inre}
        style={{ width: A4_BREDD, transform: skala < 1 ? `scale(${skala})` : undefined, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}

export default SkaladA4
