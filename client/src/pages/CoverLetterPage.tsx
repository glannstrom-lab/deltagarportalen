/**
 * Cover Letter Page - Main entry with tabs
 * Använder PageLayout för neutral hub-header (persika 4px-accent)
 * per DESIGN.md "undersidor ärver moderhubbens färg".
 *
 * Fokusläge: när isFocusMode är på renderas FocusCoverLetter (NPF-anpassad
 * stegvis wizard). Samma datalager — coverLetterApi.create sparar oavsett
 * läge. Normalvyn (CoverLetterWrite/MyLetters) är orörd.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from '@/components/ui/icons'
import { coverLetterTabDefs } from '@/data/coverLetterTabs'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { CoverLetterWrite } from '@/components/cover-letter/CoverLetterWrite'
import { CoverLetterMyLetters } from '@/components/cover-letter/CoverLetterMyLetters'
import { PageLayout } from '@/components/layout/PageLayout'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusCoverLetter } from '@/components/focus/steps/FocusCoverLetter'

export default function CoverLetterPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('coverLetter.title', 'Personligt brev')}
        icon={Mail}
        domain="activity"
      >
        <FocusCoverLetter
          onComplete={toggleFocusMode}
          onSkip={toggleFocusMode}
          onBack={toggleFocusMode}
        />
      </PageFocusShell>
    )
  }

  const coverLetterTabs = coverLetterTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  return (
    <>
      <PageLayout
        title={t('coverLetter.title', 'Personligt brev')}
        subtitle={t('coverLetter.description', 'Skapa professionella personliga brev som öppnar dörrar till nya möjligheter')}
        customTabs={coverLetterTabs}
        tabVariant="glass"
        domain="activity"
        className="max-w-7xl mx-auto"
      >
        <Routes>
          <Route path="/" element={<CoverLetterWrite />} />
          <Route path="/my-letters" element={<CoverLetterMyLetters />} />
          <Route path="*" element={<Navigate to="/cover-letter" replace />} />
        </Routes>
      </PageLayout>
      <HelpButton content={helpContent.coverLetter} />
    </>
  )
}
