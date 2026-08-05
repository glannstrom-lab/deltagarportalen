/**
 * RouteAnnouncer — sätter sidtiteln och annonserar ruttbyten (UX34, 2026-08-05)
 *
 * Två WCAG-problem i ett: `document.title` sattes ingenstans (2.4.2 Page Titled)
 * och SPA-navigering var helt tyst för skärmläsare — inget sa att sidan bytts.
 * I en HashRouter-app sker ingen sidladdning, så webbläsaren annonserar
 * ingenting av sig själv.
 *
 * Lösningen är det vedertagna mönstret: en visuellt dold `aria-live="polite"`-
 * region som får sidans namn vid varje ruttbyte. Synliga användare märker
 * ingenting; skärmläsaren läser upp "Du är nu på Dagbok" efter att navigeringen
 * skett.
 *
 * Första renderingen annonseras INTE — då läser skärmläsaren redan upp
 * dokumenttiteln vid sidladdning, och en dubbel uppläsning är brus.
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/hooks/usePageTitle'

export function RouteAnnouncer() {
  const location = useLocation()
  const { t } = useTranslation()
  const { pageName } = useDocumentTitle(location.pathname)
  const [message, setMessage] = useState('')
  const senastePath = useRef<string | null>(null)

  useEffect(() => {
    // Första renderingen = sidladdning; titeln läses upp av webbläsaren redan.
    // Vi jämför mot förra pathnamnet i stället för att bara titta på "har
    // renderat en gång", så ett språkbyte (som ändrar pageName men inte rutten)
    // inte utlöser en falsk annonsering.
    if (senastePath.current === location.pathname) return
    const ärFörstaRenderingen = senastePath.current === null
    senastePath.current = location.pathname
    if (ärFörstaRenderingen) return

    setMessage(t('routeAnnouncer.navigated', {
      defaultValue: 'Du är nu på {{page}}',
      page: pageName,
    }))
  }, [location.pathname, pageName, t])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}

export default RouteAnnouncer
