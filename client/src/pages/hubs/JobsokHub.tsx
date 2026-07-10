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
import type { TFunction } from 'i18next'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
] as const

function shortDate(iso: string | null | undefined, t: TFunction): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getDate()} ${t(`hubs.months.${d.getMonth()}`, SWEDISH_MONTHS[d.getMonth()])}`
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
  const { t } = useTranslation()
  useOnboardedHubsTracking('jobb')
  const { data } = useJobsokHubSummary()
  const firstName = useAuthStore(s => s.profile?.first_name)

  const features = useMemo<HubFeature[]>(() => {
    const cv = data?.cv
    const apps = data?.applicationStats?.total ?? 0
    const sponCount = data?.spontaneousCount ?? 0
    const sponFollowups = data?.spontaneousFollowups
    // Kommande uppföljning väger tyngre än antal sparade
    const sponStatus = sponFollowups && sponFollowups.count > 0 && sponFollowups.nextDate
      ? t('jobsokHub.status.followUp', { defaultValue: 'Uppföljning {{date}}', date: shortDate(sponFollowups.nextDate, t) })
      : sponCount > 0
        ? t('hubs.saved', { defaultValue: '{{count}} sparade', count: sponCount })
        : t('hubs.explore', 'Utforska')
    const interviewCount = data?.interviewSessions?.length ?? 0
    const coverLetterCount = data?.coverLetters?.length ?? 0

    return [
      {
        key: 'job-search',
        icon: Search,
        title: t('jobsokHub.features.jobSearch.title', 'Sök jobb'),
        description: t('jobsokHub.features.jobSearch.description', 'Hitta jobb från Platsbanken som matchar din profil.'),
        status: t('jobsokHub.features.jobSearch.status', 'Hitta nya jobb'),
        href: '/job-search',
      },
      {
        key: 'applications',
        icon: ClipboardList,
        title: t('jobsokHub.features.applications.title', 'Mina ansökningar'),
        description: t('jobsokHub.features.applications.description', 'Spåra och följ upp dina jobbansökningar.'),
        status: apps > 0
          ? t('jobsokHub.features.applications.active', { defaultValue: '{{count}} aktiva', count: apps })
          : t('jobsokHub.features.applications.none', 'Inga än'),
        isActive: apps > 0,
        href: '/applications',
      },
      {
        key: 'spontaneous',
        icon: Building2,
        title: t('jobsokHub.features.spontaneous.title', 'Spontanansökan'),
        description: t('jobsokHub.features.spontaneous.description', 'Skicka ansökningar till företag du tror på.'),
        status: sponStatus,
        isActive: sponCount > 0,
        href: '/spontanansökan',
      },
      {
        key: 'cv',
        icon: FileUser,
        title: t('jobsokHub.features.cv.title', 'CV'),
        description: t('jobsokHub.features.cv.description', 'Skapa, redigera och exportera ditt CV.'),
        status: cv
          ? t('hubs.lastUpdated', { defaultValue: 'Senast {{when}}', when: shortDate(cv.updated_at, t) ?? t('jobsokHub.features.cv.updatedFallback', 'uppdaterat') })
          : t('jobsokHub.features.cv.create', 'Skapa CV'),
        isActive: !!cv,
        href: '/cv',
      },
      {
        key: 'cover-letter',
        icon: Mail,
        title: t('jobsokHub.features.coverLetter.title', 'Personligt brev'),
        description: t('jobsokHub.features.coverLetter.description', 'Generera anpassade brev med AI-stöd.'),
        status: coverLetterCount > 0
          ? t('hubs.saved', { defaultValue: '{{count}} sparade', count: coverLetterCount })
          : t('jobsokHub.features.coverLetter.create', 'Skapa brev'),
        isActive: coverLetterCount > 0,
        href: '/cover-letter',
      },
      {
        key: 'interview',
        icon: Mic,
        title: t('jobsokHub.features.interview.title', 'Intervjuträning'),
        description: t('jobsokHub.features.interview.description', 'Öva intervjuer med AI och bygg självförtroende.'),
        status: interviewCount > 0
          ? t('jobsokHub.features.interview.sessions', { defaultValue: '{{count}} sessioner', count: interviewCount })
          : t('jobsokHub.features.interview.practice', 'Tid för övning'),
        isActive: interviewCount > 0,
        href: '/interview-simulator',
      },
      {
        key: 'salary',
        icon: Wallet,
        title: t('jobsokHub.features.salary.title', 'Lön & förhandling'),
        description: t('jobsokHub.features.salary.description', 'Förbered dig på lönesamtal och förhandlingar.'),
        status: t('hubs.explore', 'Utforska'),
        href: '/salary',
      },
    ]
  }, [data, t])

  return (
    <HubPage
      titleKey="hub-jobb"
      title={t('jobsokHub.title', 'Söka jobb')}
      hubTitle={t('jobsokHub.hubTitle', 'Hitta och söka jobb')}
      hubDescription={t('jobsokHub.hubDescription', 'Hitta jobb och håll koll på dina ansökningar.')}
      hubIcon={Briefcase}
      domain="activity"
      features={features}
      firstName={firstName}
    />
  )
}
