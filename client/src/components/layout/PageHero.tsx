/**
 * PageHero — den enda hero-komponenten i portalen.
 *
 * Implementerar de TVÅ LÄGEN som definieras i DESIGN.md §3:
 *
 *   mode="hub"  — Hub-landningssida (`/jobb`, `/karriar`, `/resurser`,
 *                 `/min-vardag`). Full pastell-hero i hub-färgen, stor
 *                 titel, valfri greeting, valfri ikon, dekorativ
 *                 radial-glow tillåten.
 *
 *   mode="tool" — Verktygssida (allt annat under hubbarna). Neutral grå
 *                 bakgrund med 4 px vänsterkant i hub-färgen. Title +
 *                 tabs + stats + actions.
 *
 * Komponenten ska konsumeras via `PageLayout` (tool-läge) eller
 * `HubPage` (hub-läge). Direkt-användning är tillåten men inte typisk.
 *
 * KONTRAKT — saker som ALDRIG händer:
 *   - Hub-färgad full hero på en verktygssida (mode="tool" ger neutral)
 *   - Neutral grå hero på en hub-landning (mode="hub" ger pastell)
 *   - Gradient-knappar i actions-slot (DESIGN.md §6 — ESLint flaggar)
 *   - Eyebrow-text "HUB · X" — borttaget 2026-05-10 enligt §3
 *
 * Implementationsdetaljer i DESIGN.md §14.
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PageTabs, type Tab, type PageStat } from './PageTabs'
import type { LucideIcon } from 'lucide-react'

type HeroMode = 'hub' | 'tool'

type TabVariant = 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'

interface PageHeroProps {
  /** Vilket läge — A (hub) eller B (tool) per DESIGN.md §3 */
  mode: HeroMode

  /** Stora titeln — t.ex. "Hitta och söka jobb" / "Skapa ditt CV" */
  title: string

  /** En rad beskrivning under titeln */
  description?: string

  /**
   * Personlig greeting — visas som liten överrad till titeln.
   * Bara meningsfull i mode="hub". Ignoreras i tool-läge.
   * Skicka null/undefined för att dölja.
   */
  greeting?: string | null

  /**
   * Hub-ikon i 80×80 cirkel till vänster om titeln.
   * Bara meningsfull i mode="hub".
   */
  icon?: LucideIcon

  /**
   * Höger-side-element i hub-läge (t.ex. datum-disc).
   * I tool-läge ignoreras detta — använd `actions` istället.
   */
  rightDecoration?: React.ReactNode

  /** Fält för CTA-knappar i tool-läge (höger om title) */
  actions?: React.ReactNode

  /** Stat-chips i tool-läge */
  stats?: PageStat[]

  /** Tabs under header i tool-läge */
  tabs?: Tab[]
  tabVariant?: TabVariant

  /**
   * Visa dekorativ radial-glow i hub-läge (DESIGN.md §3 — tillåten).
   * Default: true för hub-läge, false för tool-läge.
   */
  showRadialGlow?: boolean

  className?: string
}

export function PageHero({
  mode,
  title,
  description,
  greeting,
  icon: Icon,
  rightDecoration,
  actions,
  stats,
  tabs,
  tabVariant = 'glass',
  showRadialGlow,
  className,
}: PageHeroProps) {
  if (mode === 'hub') {
    return <PageHeroHub
      title={title}
      description={description}
      greeting={greeting}
      icon={Icon}
      rightDecoration={rightDecoration}
      showRadialGlow={showRadialGlow ?? true}
      className={className}
    />
  }

  return <PageHeroTool
    title={title}
    description={description}
    actions={actions}
    stats={stats}
    tabs={tabs}
    tabVariant={tabVariant}
    className={className}
  />
}

// ============================================================
// HUB-LÄGE  —  Full pastell-hero (DESIGN.md §3 läge A)
// ============================================================

interface HeroHubProps {
  title: string
  description?: string
  greeting?: string | null
  icon?: LucideIcon
  rightDecoration?: React.ReactNode
  showRadialGlow: boolean
  className?: string
}

function PageHeroHub({
  title,
  description,
  greeting,
  icon: Icon,
  rightDecoration,
  showRadialGlow,
  className,
}: HeroHubProps) {
  const trimmedGreeting = greeting?.trim() || null

  return (
    <section
      className={cn(
        'bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-2xl sm:rounded-[24px]',
        'p-5 sm:p-7 md:p-[36px_40px]',
        'relative overflow-hidden',
        className
      )}
      aria-labelledby="page-hero-title"
    >
      {/* Dekorativ radial-glow (DESIGN.md §3 — tillåten i hub-hero) */}
      {showRadialGlow && (
        <div
          aria-hidden="true"
          className="absolute -top-[100px] -right-[100px] w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--c-accent) 0%, transparent 70%)',
            opacity: 0.4,
          }}
        />
      )}

      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {Icon && (
              <div
                aria-hidden="true"
                className="w-14 h-14 sm:w-[80px] sm:h-[80px] rounded-full bg-white border-2 border-[var(--c-accent)] overflow-hidden shadow-sm flex items-center justify-center text-[var(--c-text)] flex-shrink-0"
              >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
              </div>
            )}

            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
              {trimmedGreeting && (
                <p className="text-[12px] sm:text-[13px] font-medium text-[var(--c-text)] leading-none truncate m-0">
                  {trimmedGreeting}
                </p>
              )}
              <h1
                id="page-hero-title"
                className="text-[22px] sm:text-[32px] md:text-[40px] font-bold text-[var(--stone-900)] leading-[1.1] sm:leading-[1.05] tracking-tight m-0 break-words"
              >
                {title}
              </h1>
            </div>
          </div>

          {rightDecoration && (
            <div className="hidden sm:flex flex-shrink-0">
              {rightDecoration}
            </div>
          )}
        </div>

        {description && (
          <>
            <div aria-hidden="true" className="h-px bg-[var(--c-accent)] opacity-60" />
            <p className="text-base sm:text-[20px] md:text-[22px] font-medium text-[var(--stone-700)] tracking-tight m-0 leading-snug">
              {description}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

// ============================================================
// TOOL-LÄGE  —  Neutral grå header med 4 px hub-kant (DESIGN.md §3 läge B)
// ============================================================

interface HeroToolProps {
  title: string
  description?: string
  actions?: React.ReactNode
  stats?: PageStat[]
  tabs?: Tab[]
  tabVariant: TabVariant
  className?: string
}

function PageHeroTool({
  title,
  description,
  actions,
  stats,
  tabs,
  tabVariant,
  className,
}: HeroToolProps) {
  const hasTabs = tabs && tabs.length > 0
  const hasStats = stats && stats.length > 0

  return (
    <header
      className={cn(
        'relative bg-[var(--header-bg)] rounded-2xl border border-[var(--header-border)]',
        'overflow-hidden',
        'shadow-sm',
        // 4px vänsterkant i hub-färgen (DESIGN.md §3)
        'border-l-[4px] border-l-[var(--c-solid)]',
        className
      )}
    >
      {/* Header-rad */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--header-text)] tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[var(--header-muted)] mt-1">{description}</p>
            )}
          </div>

          {(hasStats || actions) && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {hasStats && (
                <div className="flex items-center gap-2 flex-wrap" data-focus-chrome="stats">
                  {stats!.map((stat) => {
                    const StatIcon = stat.icon
                    const chipClass = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--header-border)] bg-white/80 hover:bg-white transition-colors'
                    const inner = (
                      <>
                        <div className="w-7 h-7 rounded-md bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
                          {StatIcon && <StatIcon className="w-3.5 h-3.5 text-[var(--c-solid)]" />}
                        </div>
                        <div className="text-left leading-tight">
                          <div className="text-sm font-bold text-[var(--header-text)] tabular-nums">{stat.value}</div>
                          <div className="text-[11px] text-[var(--header-muted)]">{stat.label}</div>
                        </div>
                      </>
                    )
                    return stat.to ? (
                      <Link key={stat.label} to={stat.to} className={chipClass}>{inner}</Link>
                    ) : (
                      <div key={stat.label} className={chipClass}>{inner}</div>
                    )
                  })}
                </div>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs i underyta — döljs i fokusläge (sekundär navigation) */}
      {hasTabs && (
        <div className="px-5 py-2.5 border-t border-[var(--header-border)] bg-white/30 dark:bg-stone-900/20" data-focus-chrome="tabs">
          <PageTabs tabs={tabs} variant={tabVariant} />
        </div>
      )}
    </header>
  )
}

export default PageHero
