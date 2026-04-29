import { useMemo } from 'react'
import {
  Target,
  Compass,
  TrendingUp,
  Star,
  GraduationCap,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useKarriarHubSummary } from '@/hooks/useKarriarHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { careerGoalLabel } from '@/utils/careerGoalLabel'

function relativeShort(iso: string | null | undefined): string | null {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'idag'
  if (days === 1) return 'i går'
  if (days < 7) return `${days} dagar sen`
  if (days < 14) return '1 vecka sen'
  if (days < 30) return `${Math.floor(days / 7)} veckor sen`
  return `${Math.floor(days / 30)} månader sen`
}

export default function KarriarHub() {
  useOnboardedHubsTracking('karriar')
  const { data } = useKarriarHubSummary()

  const features = useMemo<HubFeature[]>(() => {
    const goalLabel = careerGoalLabel(data?.careerGoals?.shortTerm)
    const skillsAt = data?.latestSkillsAnalysis?.created_at
    const brandAt = data?.latestBrandAudit?.created_at
    const linkedin = data?.linkedinUrl

    return [
      {
        key: 'career-goal',
        icon: Target,
        title: 'Karriärmål',
        description: 'Sätt korta och långsiktiga mål, beskriv vad du vill uppnå.',
        status: goalLabel ? `Aktivt: ${goalLabel}` : 'Sätt en riktning',
        isActive: !!goalLabel,
        href: '/career',
      },
      {
        key: 'interest-guide',
        icon: Compass,
        title: 'Intresseguide',
        description: 'Utforska vilka yrken som matchar dina intressen.',
        status: 'Inte testad',
        href: '/interest-guide',
      },
      {
        key: 'skills-gap',
        icon: TrendingUp,
        title: 'Kompetensanalys',
        description: 'Kartlägg dina kompetenser mot ett drömjobb.',
        status: skillsAt ? `Senast ${relativeShort(skillsAt)}` : 'Bygger upp profilen',
        isActive: !!skillsAt,
        href: '/skills-gap-analysis',
      },
      {
        key: 'personal-brand',
        icon: Star,
        title: 'Personligt varumärke',
        description: 'Bygg en tydlig identitet som arbetsgivare märker.',
        status: brandAt ? `Senast ${relativeShort(brandAt)}` : 'Inte börjat',
        isActive: !!brandAt,
        href: '/personal-brand',
      },
      {
        key: 'education',
        icon: GraduationCap,
        title: 'Utbildning',
        description: 'Hitta utbildningar som tar dig dit du vill.',
        status: linkedin ? 'Utforska' : 'Utforska',
        href: '/education',
      },
    ]
  }, [data])

  return (
    <HubPage
      titleKey="hub-karriar"
      title="Karriär"
      hubLabel="Hub · Karriär"
      hubTitle="Planera min karriär"
      hubDescription="Sätt mål, kartlägg kompetens och bygg din väg framåt."
      hubIcon={Target}
      domain="coaching"
      features={features}
    />
  )
}
