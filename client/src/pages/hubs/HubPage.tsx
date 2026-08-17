import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { HUB_ICON_SRC, TOOL_ICON_SRC } from '@/components/layout/hubIcons'

/**
 * HubPage — gemensam template för alla 4 hub-sidor.
 *
 * Struktur (omlagd 2026-08-17, hjälten borttagen):
 *   1. Rubrikrad — liten hub-ikon + hälsning + titel + en rad beskrivning
 *   2. Funktioner — tät grid av kort till hubbens undersidor, med status per kort
 *
 * Varje hub passar in via props: title, hubTitle, hubDescription, icon, domain,
 * features. Status per feature beräknas i hub-komponenten från loader-data.
 *
 * **Kortlistan måste matcha hubbens `memberPaths` i navigation.ts.** De två
 * gled isär i båda riktningarna innan 2026-08-17 — Söka jobb visade 7 kort mot
 * 9 länkar, Min vardag 6 kort mot 5 länkar. `__tests__/hubbkort-mot-navigation`
 * vaktar det numera.
 */

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
  /**
   * Vad användaren har gjort här — "5 aktiva", "Senast 27 juli", "Inte testad".
   *
   * **Utelämna den när hubben inte hämtar någon uppgift om verktyget.** Sju
   * kort bar tidigare `t('hubs.explore', 'Utforska')`, vilket såg ut som en
   * status men var en uppmaning utan underlag. Effekten blev att korten med
   * riktiga tal drunknade bland dem som inte hade något att säga (regel B31 —
   * ett värde utan underlag ska inte se ut som ett värde).
   */
  status?: string
  /**
   * True när användaren har gjort något här.
   *
   * Styr också hur `status` läses: när den är true kommer texten ur data och
   * visas som bricka i hubbfärgen; annars är den ett tomtillstånd ("Inga än",
   * "Skapa CV") och sätts som dämpad text utan bricka. Villkoret är detsamma
   * som hubbkomponenterna redan använder för att välja statustexten, så de två
   * kan inte glida isär.
   */
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
  /** Hub-ikon (lucide). Reserv för domäner utan bildikon i HUB_ICON_SRC. */
  hubIcon: LucideIcon
  /** Domänfärg (bestämmer --c-* tokens via PageLayout) */
  domain: HubDomain
  /** Sub-pages */
  features: HubFeature[]
  /** Onboarding-tracking-hook anropas av parent (jobb/karriar/resurser/min-vardag) */
  trackingChild?: ReactNode
  /**
   * Valfritt innehåll UNDER funktionsgriden (G12, 2026-07-27).
   * Hubblandningen är läge A i DESIGN.md §3 — hero + funktioner. En hubb som
   * behöver en egen lugn yta (t.ex. veckoreflektionen i Min vardag) lägger
   * den här i stället för att bygga en egen sidlayout och riskera att de två
   * lägena blandas. Håll det till EN yta per hubb.
   */
  footerSection?: ReactNode
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

// De fyra hjälteillustrationerna (public/illustrations/hero-*.webp, 164 kB
// tillsammans) laddades av hjälten och har ingen annan användare i src/.
// Filerna ligger kvar orörda — att radera bilder ur public/ är ett eget
// beslut, inte en följd av en layoutändring.

export default function HubPage({
  titleKey: _titleKey,
  title,
  hubLabel: _hubLabel, // deprecated, ignoreras enligt DESIGN.md §3
  hubTitle,
  hubDescription,
  hubIcon: HubIcon,
  domain,
  features,
  trackingChild,
  footerSection,
  firstName,
}: HubPageProps) {
  const { t } = useTranslation()
  const trimmedFirstName = firstName?.trim() || null

  return (
    <PageLayout
      title={title}
      domain={domain}
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-5"
    >
      {trackingChild}

      {/*
        Rubrikrad i stället för hjälte (2026-08-17, beslut Mikael: "jag vill
        inte längre ha någon hero som tar plats på sidorna").

        Hjälten tog ~240 px på 1440 px bredd och sa två saker: hubbens namn,
        som redan står markerat i navigationens första rad, och en
        beskrivningsrad som upprepade namnet med andra ord. Datumdiscen var
        dekor — vilken dag det är hjälper ingen att söka jobb.

        Kvar är det hjälten faktiskt bidrog med: hälsningen med förnamn
        (DESIGN.md §2) och en rubrik att hitta med skärmläsare. Ikonen står
        kvar liten, som igenkänning av hubbfärgen.
      */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="hidden sm:flex w-10 h-10 rounded-[10px] items-center justify-center shrink-0 bg-[var(--c-bg)] text-[var(--c-text)]"
        >
          {HUB_ICON_SRC[domain] ? (
            <img src={HUB_ICON_SRC[domain]} alt="" className="w-7 h-7 object-contain" />
          ) : (
            <HubIcon className="w-5 h-5" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold tracking-tight text-[var(--stone-900)] m-0 leading-tight">
            {trimmedFirstName && (
              <span className="font-normal text-[var(--stone-500)]">
                {t('hubs.greeting', { defaultValue: 'Hej {{name}}', name: trimmedFirstName })}
                {' · '}
              </span>
            )}
            {hubTitle}
          </h1>
          <p className="m-0 text-[13px] text-[var(--stone-600)] leading-snug">{hubDescription}</p>
        </div>
      </div>

      {/*
        Funktionerna behöver ingen egen rubrik längre. Den sa "FUNKTIONER" över
        en grid av funktioner — en etikett på något som redan syns.
      */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.3 }}
        aria-label={t('hubs.featuresHeading', 'Funktioner')}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        {features.map((f) => (
          <FeatureCard key={f.key} feature={f} />
        ))}
      </motion.section>

      {footerSection}
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
      {/*
        Kortet var 170 px högt med `min-h` fastän innehållet är en rubrik, två
        rader text och en statusbricka. Reserverad höjd för text som aldrig
        kom — precis den "för mycket space, för lite innehåll" omläggningen
        handlar om. Höjden följer nu innehållet.

        Statusbrickan flyttar upp bredvid titeln: det är kortets enda riktiga
        uppgift, den siffra navigationens länk inte kan visa ("5 aktiva",
        "Senast 27 juli"). Nederst, bakom en avdelare, konkurrerade den med
        pilen om uppmärksamhet.
      */}
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-xl px-3.5 py-3 hover:border-[var(--c-solid)] hover:shadow-sm transition-[border-color,box-shadow] h-full flex flex-col gap-1.5"
      >
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--c-bg)] text-[var(--c-text)]"
          >
            {TOOL_ICON_SRC[href] ? (
              <img src={TOOL_ICON_SRC[href]} alt="" className="w-[22px] h-[22px] object-contain" />
            ) : (
              <Icon className="w-4 h-4" strokeWidth={2} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[var(--stone-900)] tracking-tight leading-tight">
              {title}
            </span>
            {status && (
              <span
                className={[
                  'inline-block mt-1 text-[11px] max-w-full truncate',
                  isActive
                    ? 'font-medium px-1.5 py-0.5 rounded bg-[var(--c-bg)] text-[var(--c-text)]'
                    : 'text-[var(--stone-500)]',
                ].join(' ')}
              >
                {status}
              </span>
            )}
          </span>
        </div>

        <p className="text-[12.5px] text-[var(--stone-600)] leading-snug m-0">
          {description}
        </p>
      </motion.div>
    </Link>
  )
}
