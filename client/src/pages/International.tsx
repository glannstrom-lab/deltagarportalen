/**
 * Ny i Sverige — validering, första tiden och svenskan.
 *
 * OMSCOPAD 2026-08-20 (beslut Mikael). Sidan hette "Internationell Guide" och
 * var skriven för någon som står utanför Sverige och redan har ett
 * jobberbjudande: "Före ankomst", "ansök INNAN du reser", "kräver jobboffert
 * från svensk arbetsgivare". Portalens deltagare bor redan här och söker jobb.
 *
 * Visumfliken är därför ersatt av `ValideringTab` — bedömning av utländsk
 * utbildning (UHR) och yrkeslegitimation (Socialstyrelsen, Skolverket), som
 * saknades i hela portalen trots att det är det som avgör om någons utbildning
 * räknas här. Den som behöver arbetstillstånd hänvisas vidare till
 * Migrationsverket, utan att sidan anger några belopp: den gamla fliken sa
 * "minst 13 000 kr/mån", vilket var kravet fram till november 2023 och alltså
 * var fel i tre år. Ett indexerat belopp hör inte hemma i källkod.
 *
 * Fokusläget är ett ÖVERLÄGG, inte en gren som byter ut sidan — samma fel som
 * b93be382, 00d8be26 och f392260c lagade. Här fanns osparad text att förlora:
 * anteckningen i checklistan skrivs till molnet först vid klick på Spara.
 */
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Globe } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusInternationalWizard } from '@/components/focus/pages/FocusInternationalWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

import ValideringTab from './international/ValideringTab'
import IntegrationTab from './international/IntegrationTab'
import LanguageTab from './international/LanguageTab'

/**
 * Datumet då sidans myndighetsuppgifter senast kontrollerades. Renderas för
 * användaren. Ändra det bara när du faktiskt har kontrollerat om — det är
 * hela poängen med raden.
 */
export const KONTROLLERAD = '2026-08-20'

export default function InternationalPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()
  const navigate = useNavigate()

  const internationalTabs: Tab[] = [
    { id: 'validation', label: t('international.tabs.validation.label'), path: '/international' },
    { id: 'integration', label: t('international.tabs.integration.label'), path: '/international/integration' },
    { id: 'language', label: t('international.tabs.language.label'), path: '/international/language' },
  ]

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <PageLayout
          title={t('international.pageTitle')}
          description={t('international.pageDescription')}
          customTabs={internationalTabs}
          domain="activity"
        >
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <ValideringTab />
                  <RadgivarTips pathname="/international" index={0} />
                </>
              }
            />
            <Route
              path="/integration"
              element={
                <>
                  <IntegrationTab />
                  <RadgivarTips pathname="/international/integration" index={1} />
                </>
              }
            />
            <Route
              path="/language"
              element={
                <>
                  <LanguageTab />
                  <RadgivarTips pathname="/international/language" index={2} />
                </>
              }
            />
            <Route path="*" element={<Navigate to="/international" replace />} />
          </Routes>
        </PageLayout>
      </div>

      {isFocusMode && (
        <PageFocusShell title={t('international.pageTitle')} icon={Globe} domain="activity">
          {/* Guiden frågade tidigare "vilket land funderar du på?" och kastade
              svaret. Nu väljer man vad man vill ta tag i, och guiden öppnar den
              fliken när man lämnar fokusläget. */}
          <FocusInternationalWizard
            onOppna={(rutt) => {
              navigate(rutt)
              leaveWizard()
            }}
            onExit={leaveWizard}
          />
        </PageFocusShell>
      )}
    </>
  )
}
