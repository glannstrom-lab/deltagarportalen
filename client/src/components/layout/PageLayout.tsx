/**
 * Page Layout with Tabs
 * Wraps page content with tabs for better navigation
 * Supports semantic color domains from DESIGN.md
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { type Tab, type PageStat } from './PageTabs'
// Steg 5 (2026-08-17): hjälten ersatt av en sidoskena. Se SidRail.tsx för
// skälet — hjälten tog ~180 px överst på 37 sidor, ovanpå navigationens 82.
import SidRail, { FlikRad, SidoflikRad, type Sidoflikar } from './SidRail'
import { SkenSlotContext } from './skenSlot'
import SidRailStats from './SidRailStats'
import { cn } from '@/lib/utils'
import { getTabsForPath } from '@/data/pageTabs'
import { getDomainForPath, type LegacyColorDomain } from '@/lib/domains'

type TabVariant = 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'

/**
 * Semantic color domains.
 * Nya systemet (DESIGN.md 2026-04-28): 'action' | 'reflection' | 'outbound'.
 * Bakåtkompatibla alias: 'info' | 'activity' | 'wellbeing' | 'coaching'.
 */
export type ColorDomain = LegacyColorDomain

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  tabs?: Tab[]
  customTabs?: Tab[]
  tabVariant?: TabVariant
  showTabs?: boolean
  showHeader?: boolean
  className?: string
  contentClassName?: string
  /** Semantic color domain for accent colors */
  domain?: ColorDomain
  icon?: React.ComponentType<{ className?: string }>
  /** Optional inline stat chips rendered in the header (right side) */
  stats?: PageStat[]
  /**
   * Flikar som lever i sidans eget tillstånd i stället för i rutten.
   *
   * `tabs` bygger `<Link>`; fem sidor växlar i stället avsnitt utan att rutten
   * ändras — LinkedIn-optimeraren, Dagboken, Externa resurser och Profilen via
   * `useState`, Resurser via `?tab=`. (Löneläget, Internationell guide och
   * Personligt varumärke stod med i en tidigare version av den här listan men
   * har riktiga `<Route>` och behöver den inte.) Utan den här
   * propen blev deras flikar kvar som en vågrät rad mitt i innehållet — alltså
   * två flikrader på samma sida, vilket är precis det omläggningen skulle bort
   * från. Renderas identiskt med ruttflikarna, i skenan på desktop och som en
   * scrollande rad på mobil.
   */
  sidoflikar?: Sidoflikar
  /**
   * Etikett över fliklistan i skenan. Sätts när en undersida också fyller
   * skenans slot, så de två listorna går att skilja åt — CV-sidan har
   * "Ditt CV" (stegen, ur sloten) och "CV-verktyg" (flikarna).
   */
  tabsEtikett?: string
}

export function PageLayout({
  children,
  title,
  subtitle,
  description,
  actions,
  tabs: tabsProp,
  customTabs,
  // tabVariant styrde hjältens flikutseende. Skenan har ett utseende, så
  // propen är kvar för anropande sidor men används inte längre.
  tabVariant: _tabVariant = 'glass',
  showTabs = true,
  showHeader = true,
  className,
  contentClassName,
  domain,
  stats,
  sidoflikar,
  tabsEtikett,
}: PageLayoutProps) {
  const location = useLocation()
  // Noden en undersida kan portalera skeninnehåll till. Se skenSlot.ts —
  // CV-byggaren är ett ruttbarn och kan inte skicka innehåll uppåt via props.
  const [skenSlot, setSkenSlot] = useState<HTMLElement | null>(null)
  // Support both "tabs" and "customTabs" props for flexibility
  const tabs = tabsProp || customTabs || (showTabs ? getTabsForPath(location.pathname) : [])

  // Don't show tabs if there's only one tab
  const shouldShowTabs = tabs.length > 1 && showTabs

  // Auto-resolve domain from route if not explicitly provided.
  // tokens.css mappar [data-domain] → CSS-variabler som driver --c-* per sida.
  const resolvedDomain = domain ?? getDomainForPath(location.pathname)

  // Skenan ritas bara när den har något att visa. En sida utan rubrik och
  // utan flikar ska inte få en tom 186px-kolumn.
  const visaSkena =
    showHeader && (!!title || shouldShowTabs || !!actions || !!stats || !!sidoflikar)

  return (
    <div className={cn(
      // Removed min-h-screen — Layout.tsx already provides the scrolling <main> container.
      // Adding min-h-screen here created a second scroll viewport (dubbel scrollbar).
      'space-y-4 sm:space-y-5 md:space-y-6',
      'page-transition',
      className
    )} data-domain={resolvedDomain}>
      {/* Steg 5: rubrik och flikar ligger i en skena till vänster i stället
          för i en hjälte överst. PageHero är kvar i koden men anropas inte
          härifrån längre — några sidor renderar den själva.

          `actions` och `stats` låg i hjälten. De flyttar in i skenan under
          flikarna: de hör till sidan som helhet, inte till en enskild flik. */}
      <div className={cn(visaSkena && 'lg:grid lg:grid-cols-[186px_minmax(0,1fr)] lg:gap-6')}>
        {visaSkena && (
          <div className="hidden lg:block">
            <SidRail
              title={title}
              description={subtitle || description}
              tabs={shouldShowTabs ? tabs : undefined}
              sidoflikar={sidoflikar}
              slotRef={setSkenSlot}
              tabsEtikett={tabsEtikett}
            >
              {(actions || (stats && stats.length > 0)) && (
                <div className="space-y-3">
                  {stats && stats.length > 0 && (
                    <SidRailStats stats={stats} layout="rail" />
                  )}
                  {actions}
                </div>
              )}
            </SidRail>
          </div>
        )}

        <div className="min-w-0">
          {/* Mobil: flikarna som scrollande rad, precis som förut. */}
          {visaSkena && <FlikRad tabs={shouldShowTabs ? tabs : undefined} />}
          {visaSkena && <SidoflikRad sidoflikar={sidoflikar} />}

          {/* Mobil: rubriken behöver fortfarande stå någonstans.

              Och `actions`/`stats` med den. Skenan är `hidden lg:block`, så
              en första version av steg 5 renderade dem bara på desktop —
              PageHero visade dem på alla bredder, så fem sidors knappar
              (Resurser, Kalender, Ansökningar, CV, hubbhistoriken) slutade
              tyst att finnas på telefon. Upptäckt vid genomgången samma dag,
              innan något nådde prod. En knapp som försvinner under en
              brytpunkt är inte en layoutdetalj — den är en funktion som
              saknas för den som bara har en telefon, vilket är många i den
              här målgruppen. */}
          {visaSkena && (title || actions || (stats && stats.length > 0)) && (
            <div className="lg:hidden mb-3">
              {title && (
                <h1 className="text-[20px] font-semibold tracking-tight text-stone-900 dark:text-stone-100 m-0">
                  {title}
                </h1>
              )}
              {title && (subtitle || description) && (
                <p className="mt-0.5 text-[13px] text-stone-600 dark:text-stone-400 m-0">
                  {subtitle || description}
                </p>
              )}
              {stats && stats.length > 0 && (
                <div className="mt-2 -mx-2">
                  <SidRailStats stats={stats} layout="rad" />
                </div>
              )}
              {actions && <div className="mt-2">{actions}</div>}
            </div>
          )}

          <div className={contentClassName}>
            <SkenSlotContext.Provider value={skenSlot}>
              {children}
            </SkenSlotContext.Provider>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple page container without tabs
 */
interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = '2xl'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn(maxWidthClasses[maxWidth], 'mx-auto', className)}>
      {children}
    </div>
  )
}

/**
 * Page section with consistent styling
 */
interface PageSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function PageSection({
  children,
  title,
  description,
  actions,
  className,
}: PageSectionProps) {
  return (
    <section className={cn(
      'bg-white dark:bg-stone-900',
      'rounded-2xl', // Consistent border radius
      'border-2 border-stone-200 dark:border-stone-700 overflow-hidden',
      'hover:border-stone-300 dark:hover:border-stone-600',
      'transition-all duration-200',
      'surface-2', // Consistent shadow hierarchy
      className
    )}>
      {(title || actions) && (
        <div className={cn(
          'px-4 py-3 sm:px-5 sm:py-4 md:px-6',
          'border-b sm:border-b-2 border-stone-100 dark:border-stone-800',
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4'
        )}>
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5 md:p-6">
        {children}
      </div>
    </section>
  )
}

export default PageLayout
