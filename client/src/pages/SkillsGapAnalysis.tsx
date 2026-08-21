/**
 * Kompetensanalysen — jämför CV:t mot ett yrke och visar vad nästa steg är.
 *
 * Sidan var 890 rader i en komponent med fem returgrenar, tolv `useState`,
 * fem async-funktioner och all presentation inline. Delad 2026-08-21 i
 * `pages/skills-gap/` — se filerna där för vad som rättades i varje del.
 *
 * Det som rättades HÄR:
 *
 * · **Fokusläget rev allt ifyllt.** `if (isFocusMode) return <PageFocusShell…>`
 *   bytte ut hela trädet, så drömjobbsfältet — en `rows={6}` textarea vars
 *   placeholder ber användaren klistra in en hel jobbannons — tömdes när
 *   växeln slogs om. Ingen persistens fanns. Växeln sitter i toppnaven och i
 *   Lugnare läge-panelen, alltså nåbar från vilken sida som helst. Värre:
 *   slogs den om MEDAN analysen kördes avmonterades komponenten mitt i
 *   `analyze()` — raden hamnade i molnet men `setCurrentAnalysis` blev en
 *   no-op, och användaren möttes av ett tomt formulär utan felmeddelande.
 *   Samma fel som b93be382 (intervjusimulatorn), 00d8be26 (lönesidan) och
 *   Career.tsx lagade. Fokusläget är nu ett ÖVERLÄGG.
 *
 * · **Laddningen bytte ut hela sidan.** Analysen ersatte trädet med ett
 *   spinnerkort — ingen Avbryt-knapp, ingen möjlighet att se den inklistrade
 *   annonsen, och texten "Startar analys…" stod kvar oförändrad i trettio
 *   sekunder. Nu ligger den som ett överlägg ovanpå formuläret.
 *
 * · **Live-regionen avmonterades i stället för att uppdateras.** En
 *   avmonterad `aria-live` annonserar ingenting, och fokus föll till
 *   `<body>`. Regionen är nu beständig och lever över alla tre lägena.
 */
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Loader2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { PageLayout } from '@/components/layout/PageLayout'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusSkillsGapWizard } from '@/components/focus/pages/FocusSkillsGapWizard'
import { useSkillsGap } from './skills-gap/useSkillsGap'
import { SkillsGapForm } from './skills-gap/SkillsGapForm'
import { SkillsGapResult } from './skills-gap/SkillsGapResult'
import { laddaNerAnalys } from './skills-gap/laddaNerAnalys'

export default function SkillsGapAnalysis() {
  const { t, i18n } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()
  const sg = useSkillsGap()

  /**
   * En enda beständig live-region för hela sidan. Den byts aldrig ut, så
   * skärmläsaren hör faktiskt att analysen är klar.
   */
  const [annonsering, setAnnonsering] = useState('')
  const forraAnalysId = useRef<string | null>(null)

  useEffect(() => {
    if (sg.isAnalyzing) {
      setAnnonsering(t('skillsGapAnalysis.analyzing'))
      return
    }
    if (sg.currentAnalysis && sg.currentAnalysis.id !== forraAnalysId.current) {
      forraAnalysId.current = sg.currentAnalysis.id
      setAnnonsering(t('skillsGapAnalysis.result.heading'))
    }
  }, [sg.isAnalyzing, sg.currentAnalysis, t])

  const laddaNer = () => {
    if (!sg.currentAnalysis) return
    laddaNerAnalys(sg.currentAnalysis, sg.utbildningar, t, i18n.language)
  }

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <PageLayout
          title={t('skillsGapAnalysis.title')}
          subtitle={t('skillsGapAnalysis.description')}
          domain="coaching"
          showTabs={false}
          className="sidbredd"
          contentClassName="space-y-6 pb-20"
        >
          <div role="status" aria-live="polite" className="sr-only">{annonsering}</div>

          {sg.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[var(--c-solid)] animate-spin mx-auto mb-3" aria-hidden="true" />
                <p className="text-stone-600 dark:text-stone-400">
                  {t('skillsGapAnalysis.loadingProfile')}
                </p>
              </div>
            </div>
          ) : sg.currentAnalysis ? (
            <SkillsGapResult
              analysis={sg.currentAnalysis}
              previousAnalyses={sg.previousAnalyses}
              showHistory={sg.showHistory}
              setShowHistory={sg.setShowHistory}
              utbildningar={sg.utbildningar}
              utbildningslage={sg.utbildningslage}
              matchatYrke={sg.matchatYrke}
              isAddingToPlan={sg.isAddingToPlan}
              addedToPlan={sg.addedToPlan}
              dateLocale={sg.dateLocale}
              onDelete={sg.raderaAnalys}
              onDownload={laddaNer}
              onAddToPlan={sg.laggTillIKarriarplan}
              onSelect={sg.valjAnalys}
              onNew={sg.nyAnalys}
            />
          ) : (
            <div className="relative">
              <SkillsGapForm
                profileSummary={sg.profileSummary}
                tackning={sg.tackning}
                laddningsfel={sg.laddningsfel}
                dreamJob={sg.dreamJob}
                setDreamJob={sg.setDreamJob}
                previousAnalyses={sg.previousAnalyses}
                favoriteOccupations={sg.favoriteOccupations}
                analysisError={sg.analysisError}
                isAnalyzing={sg.isAnalyzing}
                dateLocale={sg.dateLocale}
                onAnalyze={sg.analysera}
                onSelect={sg.valjAnalys}
                onReload={sg.laddaAllt}
              />

              {/* Överlägg, inte ett utbytt träd — det ifyllda finns kvar
                  bakom och kan läsas medan analysen körs. */}
              {sg.isAnalyzing && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-xl">
                  <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 max-w-md">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--c-solid)]" aria-hidden="true" />
                      <div>
                        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                          {t('skillsGapAnalysis.analyzing')}
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                          {t('skillsGapAnalysis.analyzingHint')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </PageLayout>
      </div>

      {isFocusMode && (
        <PageFocusShell
          title={t('skillsGapAnalysis.title')}
          icon={TrendingUp}
          domain="coaching"
        >
          <FocusSkillsGapWizard
            onExit={leaveWizard}
            onTaMedDromjobb={(yrke) => sg.setDreamJob(yrke)}
          />
        </PageFocusShell>
      )}
    </>
  )
}
