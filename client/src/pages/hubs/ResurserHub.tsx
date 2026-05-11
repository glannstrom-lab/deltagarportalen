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
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'

function relativeShort(iso: string | null | undefined): string | null {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'idag'
  if (days === 1) return 'i går'
  if (days < 7) return `${days} dagar sen`
  if (days < 14) return '1 vecka sen'
  return `${Math.floor(days / 7)} veckor sen`
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
        title: 'Kunskapsbank',
        description: 'Guider, tips och artiklar för en bättre jobbsökning.',
        status: articlesCompleted > 0
          ? `${articlesCompleted} lästa`
          : articles.length > 0 ? 'Pågående' : 'Bläddra biblioteket',
        isActive: articlesCompleted > 0 || articles.length > 0,
        href: '/knowledge-base',
      },
      {
        key: 'my-documents',
        icon: Bookmark,
        title: 'Mina dokument',
        description: 'Sparade CV, brev och andra dokument.',
        status: docsCount > 0 ? `${docsCount} sparade` : 'Inga ännu',
        isActive: docsCount > 0,
        href: '/resources',
      },
      {
        key: 'print-resources',
        icon: Printer,
        title: 'Utskriftsmaterial',
        description: 'Mallar och checklistor du kan skriva ut.',
        status: 'Bläddra',
        href: '/print-resources',
      },
      {
        key: 'external-resources',
        icon: ExternalLink,
        title: 'Externa resurser',
        description: 'Länkar till Arbetsförmedlingen och andra.',
        status: 'Utforska',
        href: '/externa-resurser',
      },
      {
        key: 'ai-team',
        icon: Bot,
        title: 'AI-team',
        description: 'Chatta med karriärcoach, studievägledare och fler.',
        status: aiSession ? `Senast ${relativeShort(aiSession.updated_at)}` : 'Möt ditt AI-team',
        isActive: !!aiSession,
        href: '/ai-team',
      },
      {
        key: 'network',
        icon: Users,
        title: 'Nätverk',
        description: 'Bygg och håll kontakt med ditt nätverk.',
        status: 'Utforska',
        href: '/nätverk',
      },
    ]
  }, [data])

  return (
    <HubPage
      titleKey="hub-resurser"
      title="Resurser"
      hubTitle="Dina sparade resurser"
      hubDescription="Dokument, kunskapsbank, AI-team och utskriftsmaterial."
      hubIcon={BookOpen}
      domain="info"
      features={features}
      firstName={firstName}
    />
  )
}
