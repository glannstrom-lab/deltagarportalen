/**
 * Career Page - Main entry with tabs
 * 5 tabs: Arbetsmarknad, Anpassning, Credentials, Flytta, Karriärplan
 * Note: Nätverk moved to /nätverk, Företag removed (use Spontanansökan instead)
 * Note: Kompetens merged into standalone /skills-gap page
 */
import { useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { careerTabDefs } from '../data/careerTabs'
import { userApi } from '@/services/supabaseApi'
import { Target } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusCareerWizard } from '@/components/focus/pages/FocusCareerWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

// Tab components
import LaborMarketTab from './career/LaborMarketTab'
import AdaptationTab from './career/AdaptationTab'
import PlanTab from './career/PlanTab'
import CredentialsTab from './career/CredentialsTab'
import RelocationTab from './career/RelocationTab'

export default function CareerPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  const { pathname } = useLocation()
  const flikIndex = Math.max(
    0,
    careerTabDefs.findIndex((tab) => tab.path === pathname)
  )

  /**
   * Molnskrivningen behålls — `onboarding_progress` läses tillbaka av
   * `userApi.getPreferences`. `localStorage.setItem('career-visited', …)` som
   * stod här är däremot borttagen: nyckeln hade noll läsare i hela repot
   * (kontrollerat 2026-08-21), så den skrev bara skräp till användarens
   * webbläsare. Felet loggas fortfarande bara — det är medvetet, en
   * misslyckad onboardingmarkering får inte störa sidan.
   */
  useEffect(() => {
    userApi.updateOnboardingStep('career', true).catch(err => {
      console.error('Error updating onboarding progress:', err)
    })
  }, [])

  /**
   * Etiketterna slås upp här. `description` och `badge` mappades tidigare
   * också — båda beräknades varje render och kastades bort: varken `SidRail`
   * eller `FlikRad` läser dem, och `badge` var dessutom strängen "Ny!" som den
   * gamla `PageTabs`-vägen filtrerade bort med `badge > 0`. Enda avtrycket var
   * ett typfel (TS2322) i det frysta taket. Borttagna 2026-08-21.
   */
  const careerTabs = useMemo(
    () => careerTabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
    [t]
  )

  return (
    <>
      {isFocusMode && (
        <PageFocusShell
          title={t('career.title', 'Karriär')}
          icon={Target}
          domain="coaching"
        >
          <FocusCareerWizard onExit={leaveWizard} />
        </PageFocusShell>
      )}

      {/*
        Flikarna DÖLJS i fokusläge — de avmonteras inte.

        Fram till 2026-08-21 låg `if (isFocusMode) return <PageFocusShell>`
        ovanför den här returen. Då byttes hela trädet ut, <Routes> revs, och
        med den allt tillstånd i de fem flikarna: en halvt ifylld meritpost,
        valda anpassningar, flyttbudgeten, planutkastet. Inget av det har
        någon persistens, och ingen av flikarna varnade. Att lämna guiden
        monterade fliken på nytt — tom.

        Det är exakt samma bugg som intervjusimulatorn hade till 2026-08-19
        (se docstringen i InterviewSimulator.tsx). Fokusläget är en
        TILLGÄNGLIGHETSFUNKTION, växeln sitter i toppnaven och i
        Lugnare läge-panelen, och den kostade portalens dyraste dataförlust.

        `display: none` behåller komponenterna monterade, så `useState`
        överlever växeln i båda riktningarna, och tar samtidigt bort trädet
        ur tillgänglighetsträdet och ur tabbordningen.
      */}
      <div style={isFocusMode ? { display: 'none' } : undefined}>
      <PageLayout
        title={t('career.title')}
        description={t('career.description')}
        customTabs={careerTabs}
        showTabs={true}
        className="space-y-6"
        domain="coaching"
      >
        {/*
          Tipset ligger utanför <Routes> och gav därför samma mening på alla
          fem flikarna — index var hårdkodat till 0. Nu väljs ett tips per
          flik. Dubblettskyddet i radgivarKontext.ts hindrar att kolumnen
          upprepar just det råd som visas här.
        */}
        <RadgivarTips pathname={pathname} index={flikIndex} />

        <Routes>
          <Route path="/" element={<LaborMarketTab />} />
          <Route path="/adaptation" element={<AdaptationTab />} />
          <Route path="/credentials" element={<CredentialsTab />} />
          <Route path="/relocation" element={<RelocationTab />} />
          <Route path="/plan" element={<PlanTab />} />
          <Route path="*" element={<Navigate to="/career" replace />} />
        </Routes>
      </PageLayout>
      </div>
    </>
  )
}
