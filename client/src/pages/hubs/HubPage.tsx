import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'

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
  /** Hub-tagg — visas över hub-titeln, t.ex. "Hub · Söka jobb" */
  hubLabel: string
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
}

const heroVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function HubPage({
  titleKey,
  title,
  hubLabel,
  hubTitle,
  hubDescription,
  hubIcon: HubIcon,
  domain,
  features,
  trackingChild,
}: HubPageProps) {
  const today = new Date()

  return (
    <PageLayout
      title={title}
      domain={domain}
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-7"
    >
      {trackingChild}

      {/* HERO — samma DNA som Översikt: hub-ikon + titel + datum-disc */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.35 }}
        className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-[24px] p-[36px_40px] relative overflow-hidden"
        aria-labelledby={titleKey}
      >
        {/* Subtle radial decoration */}
        <div
          aria-hidden="true"
          className="absolute -top-[100px] -right-[100px] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--c-accent) 0%, transparent 70%)',
            opacity: 0.4,
          }}
        />

        <div className="flex flex-col gap-6 relative">
          {/* Topprad: hub-ikon inline med titel | datum-disc */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Hub-ikon (ersätter avatar) */}
              <div
                aria-hidden="true"
                className="w-[80px] h-[80px] rounded-full bg-white border-2 border-[var(--c-accent)] overflow-hidden shadow-sm flex items-center justify-center text-[var(--c-text)] flex-shrink-0"
              >
                <HubIcon size={32} strokeWidth={2} />
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--c-text)] leading-none">
                  {hubLabel}
                </p>
                <h1
                  id={titleKey}
                  className="text-[36px] sm:text-[40px] font-bold text-[var(--stone-900)] leading-[1.05] tracking-tight m-0"
                >
                  {hubTitle}
                </h1>
              </div>
            </div>

            {/* Datum-disc */}
            <div
              aria-hidden="true"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] rounded-full bg-white border-2 border-[var(--c-accent)] flex-shrink-0 shadow-sm"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--c-text)] leading-none">
                {SWEDISH_DAYS_SHORT[today.getDay()]}
              </span>
              <span className="text-[28px] font-bold text-[var(--c-text)] leading-none mt-1 tracking-tight">
                {today.getDate()}
              </span>
            </div>
          </div>

          {/* Subtil mintseparator */}
          <div aria-hidden="true" className="h-px bg-[var(--c-accent)] opacity-60" />

          {/* Beskrivning */}
          <p className="text-[20px] sm:text-[22px] font-medium text-[var(--stone-700)] tracking-tight m-0">
            {hubDescription}
          </p>
        </div>
      </motion.section>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-[22px_24px] hover:border-[var(--c-solid)] hover:shadow-md transition-[border-color,box-shadow] flex flex-col gap-2.5 min-h-[170px]"
      >
        {/* Header: ikon + titel */}
        <div className="flex items-center gap-3 mb-1">
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[var(--c-bg)] text-[var(--c-text)]"
          >
            <Icon size={18} strokeWidth={2} />
          </span>
          <span className="text-[15px] font-bold text-[var(--stone-900)] tracking-tight leading-tight">
            {title}
          </span>
        </div>

        {/* Beskrivning */}
        <p className="text-[13px] text-[var(--stone-600)] leading-[1.5] m-0 flex-1">
          {description}
        </p>

        {/* Status + arrow */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--stone-100)]">
          <span
            className={[
              'inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full',
              isActive
                ? 'bg-[var(--c-bg)] text-[var(--c-text)]'
                : 'bg-[var(--stone-100)] text-[var(--stone-700)]',
            ].join(' ')}
          >
            {status}
          </span>
          <span aria-hidden="true" className="text-[14px] text-[var(--stone-400)]">→</span>
        </div>
      </motion.div>
    </Link>
  )
}
