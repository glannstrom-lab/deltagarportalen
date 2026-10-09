import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { TOOL_ICON_SRC } from '@/components/layout/hubIcons'
import { useSettingsStore } from '@/stores/settingsStore'
import { sidbildSrc } from '@/data/sidbilder'
import { getPageKeyForPath } from '@/data/radgivarRutter'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useVarld } from '@/hooks/useVarld'
import { PLATSER, platsForDomain, scenSrc, scenFokus } from '@/data/varld'
import { Foremal } from '@/components/varld/Foremal'
import { Platsskylt } from '@/components/varld/Platsband'
import { useEgenHalsning } from '@/components/varld/halsningPlats'
import RadgivarHalsning from '@/components/radgivare/RadgivarHalsning'

/** Skrim så att den vita rubriken alltid går att läsa (dekorativ scenbild). */
const HUBB_SKRIM = {
  backgroundImage:
    'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0) 80%), linear-gradient(0deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%)',
}

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
  hubIcon: _hubIcon,
  domain,
  features,
  trackingChild,
  footerSection,
  firstName,
}: HubPageProps) {
  const { t } = useTranslation()
  const trimmedFirstName = firstName?.trim() || null
  const location = useLocation()
  const plats = platsForDomain(domain)
  const { tid, stil, lugnt } = useVarld()
  const radgivarePa = useSettingsStore((s) => s.showCoachWidget)
  // EN dialogruta i DOM:en — två hade gett två röster samtidigt.
  const dator = useMediaQuery('(min-width: 1024px)')
  useEgenHalsning()

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
      {/*
        Spår JS (2026-10-09, beslut Mikael: "bygg så bra och snyggt som möjligt"):
        hubben är en plats i Jobin-staden. Platsens scen står överst, med
        platsens namn, hubbens rubrik och värdens dialogruta i bilden. Det
        ersätter rubrikraden från 2026-08-17 ("ingen hero") — det beslutet är
        uttryckligen upphävt för ombyggnaden.
      */}
      <section aria-labelledby="hubb-rubrik" className="relative">
        <div className="relative overflow-hidden rounded-[22px] lg:rounded-[28px] h-[240px] sm:h-[320px] lg:h-[400px] bg-[var(--c-bg)] shadow-[0_30px_60px_-30px_rgba(28,25,23,0.6)]">
          <img
            src={scenSrc(plats.id, tid, stil)}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            style={{ objectPosition: scenFokus(plats.id, tid, stil) }}
            className={cn('absolute inset-0 h-full w-full object-cover', !lugnt && 'varld-scen')}
          />
          <div aria-hidden="true" className="absolute inset-0" style={HUBB_SKRIM} />
          <div className="relative flex flex-col items-start gap-2.5 p-4 sm:p-6 lg:p-8">
            <Platsskylt plats={PLATSER.stad} />
            <div className="mt-1 sm:mt-2">
              <p className="m-0 flex items-center gap-2 text-[0.875rem] sm:text-[1rem] font-semibold text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
                <Foremal namn={plats.foremal} storlek="xs" className="rounded-full ring-2 ring-white/70" />
                {t(plats.namnNyckel, plats.namnSv)}
                {trimmedFirstName && (
                  <span className="font-normal text-white/80">
                    {' · '}
                    {t('hubs.greeting', { defaultValue: 'Hej {{name}}', name: trimmedFirstName })}
                  </span>
                )}
              </p>
              <h1
                id="hubb-rubrik"
                className="m-0 mt-1 text-[1.875rem] sm:text-[2.5rem] lg:text-[3rem] font-bold tracking-tight leading-[1.05] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.4)]"
              >
                {hubTitle}
              </h1>
              <p className="m-0 mt-1.5 max-w-[48ch] text-[0.9375rem] sm:text-[1.0625rem] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
                {hubDescription}
              </p>
            </div>
          </div>
          {radgivarePa && dator && (
            <div className="absolute right-6 bottom-6 w-[min(520px,46%)] empty:hidden" data-focus-chrome="radgivare">
              <RadgivarHalsning pathname={location.pathname} variant="flytande" />
            </div>
          )}
        </div>
        {radgivarePa && !dator && (
          <div className="relative z-10 -mt-10 px-2 sm:px-6 empty:hidden" data-focus-chrome="radgivare">
            <RadgivarHalsning pathname={location.pathname} variant="flytande" />
          </div>
        )}
      </section>

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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
  // Omslagsbilden (2026-10-09): hubben var en vägg av rubrik + två rader text
  // gånger nio. Med en bild per plats känner man igen verktyget innan man
  // läst något, och beskrivningen kan kortas till två rader.
  const stil = useSettingsStore((s) => s.grafikstil)
  const omslag = sidbildSrc(getPageKeyForPath(href), stil)

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
        className="group/rum bg-[var(--surface)] ring-1 ring-[var(--stone-200)] rounded-[20px] overflow-hidden hover:ring-2 hover:ring-[var(--c-solid)] hover:shadow-[0_20px_40px_-22px_rgba(28,25,23,0.55)] transition-[box-shadow] h-full flex flex-col"
      >
        {omslag && (
          <img
            src={omslag}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="block w-full aspect-[16/9] object-cover bg-[var(--c-bg)] transition-transform duration-500 group-hover/rum:scale-[1.04]"
          />
        )}
        <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start gap-2.5">
          {!omslag && <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--c-bg)] text-[var(--c-text)]"
          >
            {TOOL_ICON_SRC[href] ? (
              <img src={TOOL_ICON_SRC[href]} alt="" className="w-[22px] h-[22px] object-contain" />
            ) : (
              <Icon className="w-4 h-4" strokeWidth={2} />
            )}
          </span>}
          <span className="min-w-0 flex-1">
            <span className="block text-[1rem] font-bold text-[var(--stone-900)] tracking-tight leading-tight">
              {title}
            </span>
            {status && (
              <span
                className={[
                  'inline-block mt-1 text-[0.75rem] max-w-full truncate',
                  isActive
                    ? 'font-semibold px-2 py-0.5 rounded-full bg-[var(--c-bg)] text-[var(--c-text)]'
                    : 'text-[var(--stone-500)]',
                ].join(' ')}
              >
                {status}
              </span>
            )}
          </span>
        </div>

        <p className="text-[0.875rem] text-[var(--stone-600)] leading-snug m-0 line-clamp-2">
          {description}
        </p>
        </div>
      </motion.div>
    </Link>
  )
}
