import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/layout/PageHero'

/**
 * HubPage — gemensam template för alla 4 hub-sidor.
 *
 * Struktur:
 *   1. Hero — hub-ikon + titel + datum-disc + beskrivning (samma DNA som Översikt)
 *   2. Funktioner — grid av feature-cards (sub-pages) med kvalitativ status per kort
 *
 * Varje hub passar in via props: hubId, title, description, icon, domain, features.
 * Status per feature beräknas i hub-komponenten från loader-data.
 */

const SWEDISH_DAYS_SHORT = [
  'sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör',
] as const

export type HubDomain = 'activity' | 'coaching' | 'info' | 'wellbeing'

export interface HubFeature {
  /** Stable key */
  key: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Card heading */
  title: string
  /** 1-2 line description */
  description: string
  /** Kvalitativ status — empatisk framing, inga bare zeros */
  status: string
  /** True när användaren har gjort något inom feature (visuellt mer-grön) */
  isActive?: boolean
  /** Route */
  href: string
}

export interface HubPageProps {
  /** Translation key for page title (used by PageLayout) */
  titleKey: string
  /** Fallback title */
  title: string
  /**
   * @deprecated Eyebrow-text ("HUB · X") togs bort 2026-05-10 enligt
   * DESIGN.md §3 ("tag bort eyebrow-texten — användaren vet redan via
   * sidobar och URL"). Behåll prop för bakåtkompabilitet — visas inte.
   */
  hubLabel?: string
  /** Stor hub-titel — t.ex. "Hitta och söka jobb" */
  hubTitle: string
  /** En rad beskrivning */
  hubDescription: string
  /** Hub-ikon (lucide) — visas i 80×80 cirkel vänster */
  hubIcon: LucideIcon
  /** Domänfärg (bestämmer --c-* tokens via PageLayout) */
  domain: HubDomain
  /** Sub-pages */
  features: HubFeature[]
  /** Onboarding-tracking-hook anropas av parent (jobb/karriar/resurser/min-vardag) */
  trackingChild?: ReactNode
  /**
   * Användarens förnamn för personalisering enligt DESIGN.md §2.
   * När satt visas "Hej {firstName}" som liten överrad till hub-titeln.
   * När inte satt visas ingen greeting (vi spammar inte tomma fall).
   */
  firstName?: string | null
}

const heroVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function HubPage({
  titleKey,
  title,
  hubLabel: _hubLabel, // deprecated, ignoreras enligt DESIGN.md §3
  hubTitle,
  hubDescription,
  hubIcon: HubIcon,
  domain,
  features,
  trackingChild,
  firstName,
}: HubPageProps) {
  const today = new Date()
  const trimmedFirstName = firstName?.trim() || null

  return (
    <PageLayout
      title={title}
      domain={domain}
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-7"
    >
      {trackingChild}

      {/* HERO via gemensam PageHero (DESIGN.md §3 läge A) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.35 }}
      >
        <PageHero
          mode="hub"
          title={hubTitle}
          description={hubDescription}
          greeting={trimmedFirstName ? `Hej ${trimmedFirstName}` : undefined}
          icon={HubIcon}
          rightDecoration={
            <div
              aria-hidden="true"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] rounded-full bg-white border-2 border-[var(--c-accent)] shadow-sm"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--c-text)] leading-none">
                {SWEDISH_DAYS_SHORT[today.getDay()]}
              </span>
              <span className="text-[28px] font-bold text-[var(--c-text)] leading-none mt-1 tracking-tight">
                {today.getDate()}
              </span>
            </div>
          }
        />
      </motion.div>

      {/* FUNKTIONER */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.35, delay: 0.08 }}
        aria-label="Funktioner"
      >
        <div className="flex items-center gap-2.5 mb-3.5">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)] flex-shrink-0" />
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)] m-0">
            Funktioner
          </h2>
          <div className="flex-1 h-px bg-[var(--c-accent)] opacity-60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f) => (
            <FeatureCard key={f.key} feature={f} />
          ))}
        </div>
      </motion.section>
    </PageLayout>
  )
}

// ============================================================
// FeatureCard
// ============================================================

function FeatureCard({ feature }: { feature: HubFeature }) {
  const { icon: Icon, title, description, status, isActive, href } = feature

  return (
    <Link to={href} className="block no-underline">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-4 sm:p-[22px_24px] hover:border-[var(--c-solid)] hover:shadow-md transition-[border-color,box-shadow] flex flex-col gap-2 sm:gap-2.5 min-h-[140px] sm:min-h-[170px]"
      >
        {/* Header: ikon + titel */}
        <div className="flex items-center gap-3 mb-0.5 sm:mb-1">
          <span
            aria-hidden="true"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[var(--c-bg)] text-[var(--c-text)]"
          >
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
          </span>
          <span className="text-[14px] sm:text-[15px] font-bold text-[var(--stone-900)] tracking-tight leading-tight min-w-0">
            {title}
          </span>
        </div>

        {/* Beskrivning */}
        <p className="text-[13px] text-[var(--stone-600)] leading-[1.5] m-0 flex-1">
          {description}
        </p>

        {/* Status + arrow */}
        <div className="flex items-center justify-between gap-2 pt-2.5 sm:pt-3 border-t border-[var(--stone-100)]">
          <span
            className={[
              'inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold px-2 sm:px-2.5 py-1 rounded-full max-w-full truncate',
              isActive
                ? 'bg-[var(--c-bg)] text-[var(--c-text)]'
                : 'bg-[var(--stone-100)] text-[var(--stone-700)]',
            ].join(' ')}
          >
            {status}
          </span>
          <span aria-hidden="true" className="text-[14px] text-[var(--stone-400)] flex-shrink-0">→</span>
        </div>
      </motion.div>
    </Link>
  )
}
