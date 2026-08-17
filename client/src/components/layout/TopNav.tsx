/**
 * Tvåradig toppnav.  (Steg 2 i navigationsomläggningen, 2026-08-17)
 *
 * Rad 1: de fem huvudkategorierna. Rad 2: den aktivas undersidor.
 * Ersätter `TopBar` + `Sidebar` på desktop, bakom `VITE_TOPNAV_ENABLED`.
 *
 * Varför den finns: portalen har 25 undersidor bakom 5 hubbar, och för att nå
 * Löneläget måste man i dag veta att den bor under Söka jobb, öppna hubben och
 * läsa igenom nio kort. Rad 2 visar dem allihop.
 *
 * ── Tre saker värda att veta om implementationen ───────────────────────────
 *
 * 1. **Allt kommer ur `navHubs`.** Ingen egen lista, ingen kopia. En andra
 *    lista hade glidit isär från sidomenyn och bottennavet — samma buggklass
 *    som artikellänkarna mot en Set som inte var en routematchare. Som bieffekt
 *    dyker `/linkedin-optimizer` och `/international` upp här, trots att de
 *    saknas i dagens `/jobb`-hubbsida (fynd F26).
 *
 * 2. **Översikt har noll undersidor.** `navigation.ts` beskriver den som
 *    "meta-hub — it owns no leaf pages". Rad 2 hade alltså varit tom precis på
 *    startsidan, där navigationen möts först. Se `oversiktRad2()` nedan.
 *
 * 3. **Rad 2 scrollar i sidled.** Söka jobb har nio poster; de får plats på
 *    ~960 px och scrollar under det. Det är idéns svagaste punkt, och den som
 *    ska mätas mot en riktig användare innan fler sidor migreras. Blir den för
 *    trång är nästa steg rullgardiner per kategori (beslut Mikael 2026-08-17).
 */

import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { navHubs, getActiveHub, getVisitedFeatures } from './navigation'
import { cn } from '@/lib/utils'

/** Sidor som föreslås för den som inte hunnit använda något än. */
const BORJA_HAR = ['/cv', '/job-search', '/interest-guide'] as const

/**
 * Vad rad 2 ska innehålla på Översikt, som saknar egna undersidor.
 *
 * Skissen föreslog "Senast" och "Väntar". `getVisitedFeatures()` finns redan
 * och lagras i localStorage — men den är en **mängd**, inte en tidsordnad
 * lista: den pushar i förstabesöksordning och har inga tidsstämplar. Att kalla
 * den "Senast" hade varit ett påhittat värde av precis det slag ROADMAP B31
 * förbjuder, så etiketten säger det den faktiskt vet: *Du har använt*.
 *
 * "Väntar" (kommande möten, uppföljningar) kräver data som inte finns i
 * navigationslagret. Den delen av skissen hör till Översikt A, steg 3.
 *
 * Har man inte använt något än visas tre startpunkter i stället för en tom
 * rad. Urvalet är redaktionellt, inte uträknat — därför heter det "Börja här"
 * och inte "Populärast".
 */
function oversiktRad2(t: TFunction): {
  etikett: string
  poster: Array<{ path: string; label: string; domain: string }>
} {
  const alla = navHubs.flatMap((h) => h.items.map((i) => ({ item: i, hub: h })))
  const besokta = new Set(getVisitedFeatures())

  const traffar = alla.filter(({ item }) => besokta.has(item.path))
  const valda = traffar.length > 0 ? traffar : alla.filter(({ item }) => (BORJA_HAR as readonly string[]).includes(item.path))

  return {
    etikett: traffar.length > 0 ? t('nav.topnav.used', 'Du har använt') : t('nav.topnav.startHere', 'Börja här'),
    poster: valda.slice(0, 8).map(({ item, hub }) => ({
      path: item.path,
      label: t(item.labelKey),
      domain: hub.domain,
    })),
  }
}

/**
 * Rad 2 — undersidorna. Exporterad separat eftersom mobilen bara behöver den:
 * `HubBottomNav` är redan rad 1 där, så mobilanvändaren möter en mindre
 * förändring än desktopanvändaren.
 */
export function SubNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const aktivHub = getActiveHub(location.pathname)

  const arOversikt = !aktivHub || aktivHub.id === 'oversikt'
  const oversikt = arOversikt ? oversiktRad2(t) : null

  const poster = arOversikt
    ? oversikt!.poster
    : aktivHub!.items.map((i) => ({ path: i.path, label: t(i.labelKey), domain: aktivHub!.domain }))

  // En kategori utan undersidor och utan besökta sidor ska inte rita en tom
  // rad — då ser navigationen trasig ut just där den möts först.
  if (poster.length === 0) return null

  return (
    <nav
      aria-label={t('nav.topnav.subPages', 'Undersidor')}
      className="flex items-center gap-1 px-3 sm:px-4 bg-stone-100 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700 overflow-x-auto"
    >
      {oversikt && (
        <span className="shrink-0 pr-2 text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {oversikt.etikett}
        </span>
      )}
      {poster.map((p) => {
        const aktiv = location.pathname === p.path
        return (
          <Link
            key={p.path}
            to={p.path}
            data-domain={p.domain}
            aria-current={aktiv ? 'page' : undefined}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 my-1 rounded-md text-[13px] whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
              aktiv
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-900/40'
            )}
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--c-solid)' }}
            />
            {p.label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Rad 1 — huvudkategorierna. Desktop.
 *
 * Renderar inte varumärke, sök eller profil: de ligger kvar i `TopBar`, som
 * behålls ovanför. Att flytta dem hade gjort steg 2 till en ombyggnad av tre
 * komponenter i stället för ett tillägg av en.
 */
export function HubNav({ variant = 'bar' }: { variant?: 'bar' | 'inline' } = {}) {
  const { t } = useTranslation()
  const location = useLocation()
  const aktivHub = getActiveHub(location.pathname)

  // `inline` = kategorierna ligger i TopBars rad, bredvid logga och sök.
  // Det är förlagan från skissen: två rader totalt, inte tre. `bar` finns kvar
  // för det fristående läget och för testerna.
  const inline = variant === 'inline'

  return (
    <nav
      aria-label={t('nav.topnav.categories', 'Huvudkategorier')}
      className={cn(
        'flex items-center gap-1 overflow-x-auto',
        inline
          ? ''
          : 'px-3 sm:px-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'
      )}
    >
      {navHubs.map((hub) => {
        const aktiv = aktivHub?.id === hub.id
        return (
          <Link
            key={hub.id}
            to={hub.path}
            data-domain={hub.domain}
            aria-current={aktiv ? 'page' : undefined}
            className={cn(
              'shrink-0 whitespace-nowrap',
              inline
                ? 'px-2.5 py-1.5 text-[13.5px] rounded-lg'
                : 'px-3 py-2.5 text-[14px] border-b-2 -mb-px',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
              aktiv
                ? inline
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                  : 'text-stone-900 dark:text-stone-100 font-semibold border-[var(--c-solid)]'
                : inline
                  ? 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  : 'text-stone-600 dark:text-stone-300 border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            {t(hub.labelKey, hub.fallbackLabel)}
          </Link>
        )
      })}
    </nav>
  )
}

/** Båda raderna. Desktop. */
export default function TopNav() {
  return (
    <div data-focus-chrome="topnav">
      <HubNav />
      <SubNav />
    </div>
  )
}
