import { Analytics } from '@vercel/analytics/react'
import { useLocation } from 'react-router-dom'
import { statistikvag, tvattaHandelse } from '@/lib/besoksstatistik'

/**
 * Vercel Web Analytics för appen. Monteras inne i HashRouter så att varje
 * byte av sida räknas — med route/path räknar komponenten själv i stället för
 * att lyssna på adressfältet, som under HashRouter alltid står på "/".
 * Vad som skickas och varför: lib/besoksstatistik.ts.
 */
export function Besoksstatistik() {
  const { pathname } = useLocation()
  const vag = statistikvag(pathname)
  return <Analytics route={vag} path={vag} beforeSend={tvattaHandelse} />
}
