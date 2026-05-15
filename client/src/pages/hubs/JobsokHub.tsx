import { useMemo } from 'react'
import {
  Briefcase,
  Search,
  ClipboardList,
  Building2,
  FileUser,
  Mail,
  Mic,
  Wallet,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
] as const

function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

export default function JobsokHub() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('jobsokHub.title', 'Söka jobb')}
        icon={Briefcase}
        domain="activity"
      >
        <FocusHubWizard
          onExit={toggleFocusMode}
          pageKey="jobsokHub"
          question={t('focus.jobsokHub.question', 'Vad i jobbsökandet vill du göra?')}
          tools={[
            { id: 'search', path: '/job-search', label: t('nav.jobSearch', 'Hitta jobb'), icon: Search },
            { id: 'apps', path: '/applications', label: t('nav.applications', 'Mina ansökningar'), icon: ClipboardList },
            { id: 'spon', path: '/spontanansökan', label: t('nav.spontaneous', 'Spontanansökan'), icon: Building2 },
            { id: 'cv', path: '/cv', label: t('nav.cv', 'CV'), icon: FileUser },
            { id: 'letter', path: '/cover-letter', label: t('nav.coverLetter', 'Personligt brev'), icon: Mail },
            { id: 'interview', path: '/interview-simulator', label: t('nav.interview', 'Intervju'), icon: Mic },
          ]}
        />
      </PageFocusShell>
    )
  }

  return <JobsokHubInner />
}

function JobsokHubInner() {
  useOnboardedHubsTracking('jobb')
  const { data } = useJobsokHubSummary()
  const firstName = useAuthStore(s => s.profile?.first_name)

  const features = useMemo<HubFeature[]>(() => {
    const cv = data?.cv
    const apps = data?.applicationStats?.total ?? 0
    const sponCount = data?.spontaneousCount ?? 0
    const interviewCount = data?.interviewSessions?.length ?? 0
    const coverLetterCount = data?.coverLetters?.length ?? 0

    return [
      {
        key: 'job-search',
        icon: Search,
        title: 'Sök jobb',
        description: 'Hitta jobb från Platsbanken som matchar din profil.',
        status: 'Hitta nya jobb',
        href: '/job-search',
      },
      {
        key: 'applications',
        icon: ClipboardList,
        title: 'Mina ansökningar',
        description: 'Spåra och följ upp dina jobbansökningar.',
        status: apps > 0 ? `${apps} aktiva` : 'Inga än',
        isActive: apps > 0,
        href: '/applications',
      },
      {
        key: 'spontaneous',
        icon: Building2,
        title: 'Spontanansökan',
        description: 'Skicka ansökningar till företag du tror på.',
        status: sponCount > 0 ? `${sponCount} sparade` : 'Utforska',
        isActive: sponCount > 0,
        href: '/spontanansökan',
      },
      {
        key: 'cv',
        icon: FileUser,
        title: 'CV',
        description: 'Skapa, redigera och exportera ditt CV.',
        status: cv ? `Senast ${shortDate(cv.updated_at) ?? 'uppdaterat'}` : 'Skapa CV',
        isActive: !!cv,
        href: '/cv',
      },
      {
        key: 'cover-letter',
        icon: Mail,
        title: 'Personligt brev',
        description: 'Generera anpassade brev med AI-stöd.',
        status: coverLetterCount > 0 ? `${coverLetterCount} sparade` : 'Skapa brev',
        isActive: coverLetterCount > 0,
        href: '/cover-letter',
      },
      {
        key: 'interview',
        icon: Mic,
        title: 'Intervjuträning',
        description: 'Öva intervjuer med AI och bygg självförtroende.',
        status: interviewCount > 0 ? `${interviewCount} sessioner` : 'Tid för övning',
        isActive: interviewCount > 0,
        href: '/interview-simulator',
      },
      {
        key: 'salary',
        icon: Wallet,
        title: 'Lön & förhandling',
        description: 'Förbered dig på lönesamtal och förhandlingar.',
        status: 'Utforska',
        href: '/salary',
      },
    ]
  }, [data])

  return (
    <HubPage
      titleKey="hub-jobb"
      title="Söka jobb"
      hubTitle="Hitta och söka jobb"
      hubDescription="Hitta jobb och håll koll på dina ansökningar."
      hubIcon={Briefcase}
      domain="activity"
      features={features}
      firstName={firstName}
    />
  )
}
