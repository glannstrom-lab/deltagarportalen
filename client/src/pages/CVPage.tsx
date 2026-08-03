/**
 * CV Page - Main entry with 5 tabs
 * Använder PageLayout för neutral hub-header (persika 4px-accent)
 * per DESIGN.md "undersidor ärver moderhubbens färg".
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cvTabDefs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import JobAdaptPage from './JobAdaptPage'
import { MyCVs } from '@/components/cv/MyCVs'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'
import { SaveIndicator } from '@/components/cv/SaveIndicator'
import { FocusCVBuilder } from '@/components/cv/FocusCVBuilder'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FileText } from '@/components/ui/icons'

export default function CVPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  const cvTabs = cvTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  const isBuilderPage = location.pathname === '/cv' || location.pathname === '/cv/'

  // G3 (2026-07-27): CV hade redan en NPF-wizard (FocusCVBuilder) men låg i
  // PageLayout — alltså full sidhuvud och bred kolumn, till skillnad från de
  // 34 sidor som använder PageFocusShell. Två konsekvenser är rättade här:
  //
  //  1. Shell:en är nu den delade PageFocusShell (smal centrerad kolumn,
  //     hub-färgad header, "Avsluta fokusläge"-knapp på samma plats som
  //     överallt annars). Kontraktet står i PageFocusShell-headern.
  //  2. Fokusläget gäller nu HELA /cv/* — inte bara byggaren. Tidigare kunde
  //     en användare slå på fokusläget på t.ex. /cv/ats och ingenting hände,
  //     vilket är precis den sortens tysta icke-respons som fokusläget finns
  //     för att undvika. Wizarden ÄR fokusvyn för hela CV-flödet.
  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('cv.title')}
        icon={FileText}
        domain="activity"
        onExit={leaveWizard}
      >
        {/* onExitFocusMode utelämnat medvetet: PageFocusShell har redan
            "Avsluta fokusläge" i headern. Två utgångar med olika text
            ("Byt till vanligt läge") är precis den sortens dubblerade val
            som fokuslägets kontrakt (punkt 6 och 9) ska undvika. */}
        <FocusCVBuilder />
      </PageFocusShell>
    )
  }

  return (
    <PageLayout
      title={t('cv.title')}
      subtitle={t('cv.subtitle', 'Skapa och optimera ditt CV')}
      customTabs={cvTabs}
      tabVariant="glass"
      domain="activity"
      actions={isBuilderPage ? <SaveIndicator /> : undefined}
      className="max-w-7xl mx-auto"
    >
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/my-cvs" element={<MyCVs />} />
        <Route path="/adapt" element={<JobAdaptPage />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/tips" element={<CVTips />} />
        <Route path="*" element={<Navigate to="/cv" replace />} />
      </Routes>
    </PageLayout>
  )
}
