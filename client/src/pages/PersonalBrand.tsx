/**
 * Personligt varumärke — fyra flikar: Din bild utåt, Pitch, Arbetsprover, Synlighet.
 *
 * Två fel rättade i skalet 2026-08-21:
 *
 * · **Fokusläget rev allt ifyllt.** `if (isFocusMode) return <PageFocusShell…>`
 *   avmonterade hela `<Routes>` och därmed alla fyra flikar. Ingen flik har
 *   utkastlager, så det som försvann var: pitchens hela textfält, portfolio-
 *   formuläret med titel, beskrivning, taggar och datum, kalenderformuläret,
 *   och kryssen från de senaste 500 ms i checklistan. Växeln sitter i
 *   toppnaven och i Lugnare läge-panelen, alltså nåbar mitt i ett halvskrivet
 *   formulär. Femte gången samma klass — b93be382 (intervjusimulatorn),
 *   00d8be26 (lönesidan), `Career.tsx`, `SkillsGapAnalysis.tsx`. Fokusläget
 *   är nu ett ÖVERLÄGG.
 *
 * · **`t('personalBrand.title')` slår upp en nyckel som inte finns** — i18n
 *   har `pageTitle`, inte `title` — så fokuslägets rubrik föll tillbaka på
 *   den svenska defaultsträngen även för engelska användare.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Star, ClipboardCheck, FolderOpen, Eye, Mic } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusPersonalBrandWizard } from '@/components/focus/pages/FocusPersonalBrandWizard'

// Tab components
import BrandAuditTab from './personal-brand/BrandAuditTab'
import PitchTab from './personal-brand/PitchTab'
import PortfolioTab from './personal-brand/PortfolioTab'
import VisibilityTab from './personal-brand/VisibilityTab'

export default function PersonalBrandPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  // `description` fanns på varje flik men står inte i `Tab`-typen och har
  // därför aldrig renderats — fyra i18n-nycklar utan läsare sedan de skrevs.
  const brandTabs: Tab[] = [
    { id: 'audit', label: t('personalBrand.tabs.audit.label'), path: '/personal-brand', icon: ClipboardCheck },
    // Badgen "Ny!" satt kvar sedan 2026-03-22 (migrationen) och 2026-05-15
    // (i18n-svepet). Manifestet §1: inga Beta-badges. Borttagen.
    { id: 'pitch', label: t('personalBrand.tabs.pitch.label'), path: '/personal-brand/pitch', icon: Mic },
    { id: 'portfolio', label: t('personalBrand.tabs.portfolio.label'), path: '/personal-brand/portfolio', icon: FolderOpen },
    { id: 'visibility', label: t('personalBrand.tabs.visibility.label'), path: '/personal-brand/visibility', icon: Eye },
  ]

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <PageLayout
          title={t('personalBrand.pageTitle')}
          description={t('personalBrand.pageDescription')}
          icon={Star}
          customTabs={brandTabs}
          showTabs={true}
          className="sidbredd"
          contentClassName="space-y-6 pb-20"
          domain="coaching"
        >

          <Routes>
            <Route path="/" element={<BrandAuditTab />} />
            <Route path="/pitch" element={<PitchTab />} />
            <Route path="/portfolio" element={<PortfolioTab />} />
            <Route path="/visibility" element={<VisibilityTab />} />
            <Route path="*" element={<Navigate to="/personal-brand" replace />} />
          </Routes>
        </PageLayout>
      </div>

      {isFocusMode && (
        <PageFocusShell
          title={t('personalBrand.pageTitle')}
          icon={Star}
          domain="coaching"
        >
          <FocusPersonalBrandWizard onExit={leaveWizard} />
        </PageFocusShell>
      )}
    </>
  )
}
