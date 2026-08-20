/**
 * Salary Page — Lön & Förhandling
 * Flikar: Kalkylator, Förhandling, Marknadsdata
 *
 * Två saker att veta innan du ändrar här:
 *
 * 1. TILLSTÅNDET BOR I DEN HÄR FILEN, inte i flikarna. Yrke, region,
 *    erfarenhet och jämförelselistan låg tidigare i `SalaryCalculatorTab`,
 *    som avmonteras vid varje flikbyte — ett klick på "Marknadsdata" och
 *    tillbaka tömde formuläret och raderade jämförelserna.
 *
 * 2. FOKUSLÄGET ÄR ETT ÖVERLÄGG, inte en gren som byter ut sidan. Låg
 *    `if (isFocusMode) return <wizard/>` här ute avmonterades hela
 *    innehållet när växeln slogs om — samma fel som b93be382 lagade i
 *    intervjusimulatorn. Nu göms normalvyn med `display: none` och förblir
 *    monterad, så att växla fram och tillbaka lämnar arbetet orört.
 */
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Wallet } from '@/components/ui/icons'
import type { Tab } from '@/components/layout/PageTabs'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusSalaryWizard } from '@/components/focus/pages/FocusSalaryWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'

// Tab components
import SalaryCalculatorTab from './salary/SalaryCalculatorTab'
import NegotiationTab from './salary/NegotiationTab'
import MarketDataTab from './salary/MarketDataTab'

export interface Loneval {
  yrke: string
  region: string
  erfarenhet: string
}

export default function SalaryPage() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  // Delat mellan kalkylatorn och fokusguiden — se filhuvudet.
  const [val, setVal] = useState<Loneval>({ yrke: '', region: '', erfarenhet: '' })

  const salaryTabs: Tab[] = [
    { id: 'calculator', label: t('salary.tabs.calculator.label'), path: '/salary' },
    { id: 'negotiation', label: t('salary.tabs.negotiation.label'), path: '/salary/negotiation' },
    { id: 'market', label: t('salary.tabs.market.label'), path: '/salary/market' },
  ]

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <PageLayout
          title={t('salary.pageTitle')}
          description={t('salary.pageDescription')}
          icon={Wallet}
          customTabs={salaryTabs}
          domain="activity"
        >
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SalaryCalculatorTab val={val} onValChange={setVal} />
                  <RadgivarTips pathname="/salary" index={0} />
                </>
              }
            />
            <Route
              path="/negotiation"
              element={
                <>
                  <NegotiationTab />
                  <RadgivarTips pathname="/salary/negotiation" index={0} />
                </>
              }
            />
            <Route
              path="/market"
              element={
                <>
                  <MarketDataTab />
                  <RadgivarTips pathname="/salary/market" index={1} />
                </>
              }
            />
            <Route path="*" element={<Navigate to="/salary" replace />} />
          </Routes>
        </PageLayout>
      </div>

      {isFocusMode && (
        <PageFocusShell title={t('salary.pageTitle')} icon={Wallet} domain="activity">
          <FocusSalaryWizard val={val} onValChange={setVal} onExit={leaveWizard} />
        </PageFocusShell>
      )}
    </>
  )
}
