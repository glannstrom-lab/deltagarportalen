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
  Globe,
  Linkedin,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'

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
  useOnboardedHubsTracking('jobb')
  const { data } = useJobsokHubSummary()

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
      hubLabel="Hub · Söka jobb"
      hubTitle="Hitta och söka jobb"
      hubDescription="Matcha din profil, ansök och följ upp dina ansökningar."
      hubIcon={Briefcase}
      domain="activity"
      features={features}
    />
  )
}
