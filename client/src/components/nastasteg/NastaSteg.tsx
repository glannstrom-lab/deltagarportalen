/**
 * Nästa steg i alla vyer (2026-10-19): prick i menyn + puls på knappen.
 *
 *   <NastaStegPrick aktiv={…} />   — i ett menyval. Synlig prick + text för
 *                                   skärmläsare ("Ditt nästa steg finns här").
 *                                   En prick utan text finns inte för den som
 *                                   inte ser den (CLAUDE.md, SidRail-markering).
 *   <NastaStegBeraknare />         — monteras en gång i Layout. Räknar
 *                                   deltagarens mål ur översiktens
 *                                   sammanfattning (samma regler som staden).
 *   <NastaStegFokus />             — monteras en gång i Layout. Lägger klassen
 *                                   `nasta-steg-puls` på knappen med samma
 *                                   `data-nasta-steg` som målet, och tar bort den
 *                                   när knappen klickats.
 *
 * Utseendet bor i styles/varld.css (`.nasta-steg-prick`, `.nasta-steg-puls`)
 * och står still vid prefers-reduced-motion och i lugnt läge.
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { deltagarMal, menyvalLederTill, paMaletsSida } from '@/lib/nastaStegMal'
import { rollForVag, useNastaStegMal } from '@/hooks/useNastaStegMal'
import { useNastaStegStore } from '@/stores/nastaStegStore'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { valjNastaSteg } from '@/pages/hubs/nastaStegRegler'

export function NastaStegPrick({ aktiv, className }: { aktiv: boolean; className?: string }) {
  const { t } = useTranslation()
  if (!aktiv) return null
  return (
    <span className={cn('inline-flex shrink-0 items-center', className)} data-testid="nasta-steg-prick">
      <span className="nasta-steg-prick" aria-hidden="true" />
      <span className="sr-only">{t('nastaSteg.finnsHar', 'Ditt nästa steg finns här')}</span>
    </span>
  )
}

/** Prick på ett menyval som leder till målet (exakt sida eller en undersida). */
export function NastaStegPrickFor({ vag, className }: { vag: string; className?: string }) {
  const mal = useNastaStegMal()
  return <NastaStegPrick aktiv={menyvalLederTill(vag, mal)} className={className} />
}

function DeltagarBeraknare() {
  const { data, isLoading, isError } = useOversiktHubSummary()
  const satt = useNastaStegStore((s) => s.satt)
  const mal = data ? deltagarMal(valjNastaSteg(data)?.primar) : null
  const vag = mal?.vag ?? null
  const fokus = mal?.fokus ?? null
  useEffect(() => {
    // Medan svaret inte är inne: rör ingenting (undefined = ingen prick).
    if (isLoading) return
    // Ett hämtfel är inget nästa steg — aldrig en prick på en gissning.
    if (isError || !data) return satt('deltagare', null)
    satt('deltagare', vag ? { vag, fokus } : null)
  }, [isLoading, isError, data, vag, fokus, satt])
  return null
}

/** Räknar deltagarens mål — bara i deltagarens portal, inte i konsulent- eller företagsvyn. */
export function NastaStegBeraknare() {
  const { pathname } = useLocation()
  return rollForVag(pathname) === 'deltagare' ? <DeltagarBeraknare /> : null
}

export const PULS_KLASS = 'nasta-steg-puls'

/**
 * Hittar knappen för målet på den sida man står på och låter den pulsera.
 * Knappar kan dyka upp efter laddning, så elementen letas fram när DOM:en
 * ändras — men bara medan ett mål med fokusnyckel finns och man är på dess sida.
 */
export function NastaStegFokus() {
  const mal = useNastaStegMal()
  const { pathname } = useLocation()
  const klickad = useNastaStegStore((s) => s.klickad)
  const fokus = mal?.fokus ?? null
  const paSidan = paMaletsSida(pathname, mal)

  useEffect(() => {
    if (!fokus || !paSidan) return
    const valj = `[data-nasta-steg="${CSS.escape(fokus)}"]`
    let markerad: Element | null = null
    const vidKlick = () => klickad(fokus)
    const markera = () => {
      // Samma steg kan ha två knappar (CV-byggarens "Nästa" för dator och för
      // mobil) — den som faktiskt syns pulserar. Utan layout (jsdom) blir det den första.
      const alla = Array.from(document.querySelectorAll(valj))
      const el = alla.find((e) => e.getClientRects().length > 0) ?? alla[0] ?? null
      // React skriver om `class` när knappen ritas om — lägg tillbaka klassen då.
      if (el && el === markerad) {
        if (!el.classList.contains(PULS_KLASS)) el.classList.add(PULS_KLASS)
        return
      }
      if (markerad) {
        markerad.classList.remove(PULS_KLASS)
        markerad.removeEventListener('click', vidKlick)
      }
      markerad = el
      if (el) {
        el.classList.add(PULS_KLASS)
        el.addEventListener('click', vidKlick, { once: true })
      }
    }
    markera()
    const obs = new MutationObserver(markera)
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      obs.disconnect()
      if (markerad) {
        markerad.classList.remove(PULS_KLASS)
        markerad.removeEventListener('click', vidKlick)
      }
    }
  }, [fokus, paSidan, klickad])

  return null
}
