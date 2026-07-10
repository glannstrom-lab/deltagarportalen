import { useMemo } from 'react'
import {
  BookOpen,
  Bookmark,
  Printer,
  ExternalLink,
  Bot,
  Users,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useResurserHubSummary } from '@/hooks/useResurserHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'

function relativeShort(iso: string | null | undefined, t: TFunction): string | null {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return t('hubs.relativeTimeShort.today', 'idag')
  if (days === 1) return t('hubs.relativeTimeShort.yesterday', 'i går')
  if (days < 7) return t('hubs.relativeTimeShort.daysAgo', { defaultValue: '{{count}} dagar sen', count: days })
  if (days < 14) return t('hubs.relativeTimeShort.oneWeekAgo', '1 vecka sen')
  return t('hubs.relativeTimeShort.weeksAgo', { defaultValue: '{{count}} veckor sen', count: Math.floor(days / 7) })
}

export default function ResurserHub() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('resurserHub.title', 'Resurser')}
        icon={BookOpen}
        domain="info"
      >
        <FocusHubWizard
          onExit={toggleFocusMode}
          pageKey="resurserHub"
          question={t('focus.resurserHub.question', 'Vad behöver du läsa eller hitta?')}
          tools={[
            { id: 'kb', path: '/knowledge-base', label: t('nav.knowledgeBase', 'Kunskapsbas'), icon: BookOpen },
            { id: 'res', path: '/resources', label: t('nav.resources', 'Sparade resurser'), icon: Bookmark },
            { id: 'print', path: '/print-resources', label: t('nav.printResources', 'Skriv ut'), icon: Printer },
            { id: 'ext', path: '/externa-resurser', label: t('nav.externalResources', 'Externa länkar'), icon: ExternalLink },
            { id: 'ai', path: '/ai-team', label: t('nav.aiTeam', 'AI-team'), icon: Bot },
            { id: 'network', path: '/nätverk', label: t('nav.network', 'Nätverk'), icon: Users },
          ]}
        />
      </PageFocusShell>
    )
  }

  return <ResurserHubInner />
}

function ResurserHubInner() {
  const { t } = useTranslation()
  useOnboardedHubsTracking('resurser')
  const { data } = useResurserHubSummary()
  const firstName = useAuthStore(s => s.profile?.first_name)

  const features = useMemo<HubFeature[]>(() => {
    const articles = data?.recentArticles ?? []
    const articlesCompleted = data?.articleCompletedCount ?? 0
    const aiSession = data?.aiTeamSessions?.[0]
    const cvCount = data?.cv ? 1 : 0
    const coverLetterCount = data?.coverLetters?.length ?? 0
    const docsCount = cvCount + coverLetterCount

    return [
      {
        key: 'knowledge-base',
        icon: BookOpen,
        title: t('resurserHub.features.knowledgeBase.title', 'Kunskapsbank'),
        description: t('resurserHub.features.knowledgeBase.description', 'Guider, tips och artiklar för en bättre jobbsökning.'),
        status: articlesCompleted > 0
          ? t('resurserHub.features.knowledgeBase.read', { defaultValue: '{{count}} lästa', count: articlesCompleted })
          : articles.length > 0
            ? t('hubs.inProgress', 'Pågående')
            : t('resurserHub.features.knowledgeBase.browse', 'Bläddra biblioteket'),
        isActive: articlesCompleted > 0 || articles.length > 0,
        href: '/knowledge-base',
      },
      {
        key: 'my-documents',
        icon: Bookmark,
        title: t('resurserHub.features.myDocuments.title', 'Mina dokument'),
        description: t('resurserHub.features.myDocuments.description', 'Sparade CV, brev och andra dokument.'),
        status: docsCount > 0
          ? t('hubs.saved', { defaultValue: '{{count}} sparade', count: docsCount })
          : t('resurserHub.features.myDocuments.none', 'Inga ännu'),
        isActive: docsCount > 0,
        href: '/resources',
      },
      {
        key: 'print-resources',
        icon: Printer,
        title: t('resurserHub.features.printResources.title', 'Utskriftsmaterial'),
        description: t('resurserHub.features.printResources.description', 'Mallar och checklistor du kan skriva ut.'),
        status: t('resurserHub.features.printResources.browse', 'Bläddra'),
        href: '/print-resources',
      },
      {
        key: 'external-resources',
        icon: ExternalLink,
        title: t('resurserHub.features.externalResources.title', 'Externa resurser'),
        description: t('resurserHub.features.externalResources.description', 'Länkar till Arbetsförmedlingen och andra.'),
        status: t('hubs.explore', 'Utforska'),
        href: '/externa-resurser',
      },
      {
        key: 'ai-team',
        icon: Bot,
        title: t('resurserHub.features.aiTeam.title', 'AI-team'),
        description: t('resurserHub.features.aiTeam.description', 'Chatta med karriärcoach, studievägledare och fler.'),
        status: aiSession
          ? t('hubs.lastUpdated', { defaultValue: 'Senast {{when}}', when: relativeShort(aiSession.updated_at, t) })
          : t('resurserHub.features.aiTeam.meet', 'Möt ditt AI-team'),
        isActive: !!aiSession,
        href: '/ai-team',
      },
      {
        key: 'network',
        icon: Users,
        title: t('resurserHub.features.network.title', 'Nätverk'),
        description: t('resurserHub.features.network.description', 'Bygg och håll kontakt med ditt nätverk.'),
        status: t('hubs.explore', 'Utforska'),
        href: '/nätverk',
      },
    ]
  }, [data, t])

  return (
    <HubPage
      titleKey="hub-resurser"
      title={t('resurserHub.title', 'Resurser')}
      hubTitle={t('resurserHub.hubTitle', 'Dina sparade resurser')}
      hubDescription={t('resurserHub.hubDescription', 'Dokument, kunskapsbank, AI-team och utskriftsmaterial.')}
      hubIcon={BookOpen}
      domain="info"
      features={features}
      firstName={firstName}
    />
  )
}
