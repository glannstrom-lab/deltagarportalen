/**
 * Diary Page - Personal journal, mood tracking, goals, and gratitude
 * Simplified, clean interface focused on writing
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { JournalTab, MoodTab, GoalsTab, GratitudeTab } from '@/components/diary'
import { WellnessConsentGate } from '@/components/consent/WellnessConsentGate'
import { NotebookPen } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusDiaryWizard } from '@/components/focus/pages/FocusDiaryWizard'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

// Tab configuration — flikarna själva flyttade in i sidoskenan (steg 5,
// 2026-08-17). Etiketterna kommer fortfarande härifrån.
const TAB_DEFS = [
  { id: 'journal', labelKey: 'diary.tabs.journal' },
  { id: 'mood', labelKey: 'diary.tabs.mood' },
  { id: 'goals', labelKey: 'diary.tabs.goals' },
  { id: 'gratitude', labelKey: 'diary.tabs.gratitude' },
] as const

type TabId = typeof TAB_DEFS[number]['id']

export default function Diary() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('diary.title', 'Dagbok')}
      icon={NotebookPen}
      domain="wellbeing"
      guide={<FocusDiaryWizard onExit={leaveWizard} />}
    >
      <DiaryInner />
    </FokusVaxel>
  )
}

function DiaryInner() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  // Fliken är helt härledd av URL:en — ingen egen state behövs. Läg tidigare
  // i state + en synk-effekt, vilket gav en extra rendering vid varje
  // bakåtknapp-tryck och tillät state och URL att glida isär.
  const activeTab: TabId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab') as TabId
    return tab && TAB_DEFS.some(t => t.id === tab) ? tab : 'journal'
  }, [location.search])

  // Update URL when tab changes — activeTab räknas om automatiskt när
  // location.search ändras.
  const handleTabChange = (tab: TabId) => {
    navigate(`/diary?tab=${tab}`, { replace: true })
  }

  // F6: bara Mood-fliken har grinden i UI:t. OBS (rättat 2026-09-22): det
  // stod här att Journal inte kräver samtycke. Det stämmer inte mot prod —
  // varje INSERT i `diary_entries` kräver wellness-samtycke i RLS (MV2), så
  // en dagboksanteckning utan samtycke nekas av databasen. JournalTab måste
  // alltså visa det felet begripligt; grinden här är inte hela sanningen.
  const renderTabContent = () => {
    switch (activeTab) {
      case 'journal':
        return <JournalTab />
      case 'mood':
        return (
          <WellnessConsentGate>
            <MoodTab />
          </WellnessConsentGate>
        )
      case 'goals':
        return <GoalsTab />
      case 'gratitude':
        return <GratitudeTab />
      default:
        return <JournalTab />
    }
  }

  return (
    <PageLayout
      title={t('diary.title')}
      description={t('diary.description')}
      showTabs={false}
      domain="wellbeing"
      className="sidbredd"
      sidoflikar={{
        poster: TAB_DEFS.map((tab) => ({ id: tab.id, etikett: t(tab.labelKey) })),
        aktiv: activeTab,
        vidVal: (id) => handleTabChange(id as TabId),
      }}
>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* LS1 (2026-09-24): räknaren "N dagar i rad" och troférna är borttagna.
            DESIGN.md §1 förbjuder streak-räknare — en dagbok ska inte straffa
            den som hoppar över en dag. Lägg inte tillbaka dem. */}
        <RadgivarTips pathname="/diary" index={0} />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </PageLayout>
  )
}
