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
  if (days < 30) return t('hubs.relativeTimeShort.weeksAgo', { defaultValue: '{{count}} veckor sen', count: Math.floor(days / 7) })
  return t('hubs.relativeTimeShort.monthsAgo', { defaultValue: '{{count}} månader sen', count: Math.floor(days / 30) })
}

export default function KarriarHub() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('karriarHub.title', 'Karriär')}
        icon={Target}
        domain="coaching"
      >
        <FocusHubWizard
          onExit={toggleFocusMode}
          pageKey="karriarHub"
          question={t('focus.karriarHub.question', 'Vad i karriären vill du jobba med?')}
          tools={[
            { id: 'career', path: '/career', label: t('nav.career', 'Karriärplan'), icon: Target },
            { id: 'interest', path: '/interest-guide', label: t('nav.interestGuide', 'Intresseguide'), icon: Compass },
            { id: 'skills', path: '/skills-gap-analysis', label: t('nav.skills', 'Kompetensgap'), icon: TrendingUp },
            { id: 'brand', path: '/personal-brand', label: t('nav.brand', 'Personligt varumärke'), icon: Star },
            { id: 'education', path: '/education', label: t('nav.education', 'Utbildning'), icon: GraduationCap },
          ]}
        />
      </PageFocusShell>
    )
  }

  return <KarriarHubInner />
}

function KarriarHubInner() {
  const { t } = useTranslation()
  useOnboardedHubsTracking('karriar')
  const { data } = useKarriarHubSummary()
  const firstName = useAuthStore(s => s.profile?.first_name)

  const features = useMemo<HubFeature[]>(() => {
    const goalLabel = careerGoalLabel(data?.careerGoals?.shortTerm)
    const skillsAt = data?.latestSkillsAnalysis?.created_at
    const brandAt = data?.latestBrandAudit?.created_at

    return [
      {
        key: 'career-goal',
        icon: Target,
        title: t('karriarHub.features.careerGoal.title', 'Karriärmål'),
        description: t('karriarHub.features.careerGoal.description', 'Sätt korta och långsiktiga mål, beskriv vad du vill uppnå.'),
        status: goalLabel
          ? t('karriarHub.features.careerGoal.active', { defaultValue: 'Aktivt: {{goal}}', goal: goalLabel })
          : t('karriarHub.features.careerGoal.setDirection', 'Sätt en riktning'),
        isActive: !!goalLabel,
        href: '/career',
      },
      {
        key: 'interest-guide',
        icon: Compass,
        title: t('karriarHub.features.interestGuide.title', 'Intresseguide'),
        description: t('karriarHub.features.interestGuide.description', 'Utforska vilka yrken som matchar dina intressen.'),
        status: t('karriarHub.features.interestGuide.notTested', 'Inte testad'),
        href: '/interest-guide',
      },
      {
        key: 'skills-gap',
        icon: TrendingUp,
        title: t('karriarHub.features.skillsGap.title', 'Kompetensanalys'),
        description: t('karriarHub.features.skillsGap.description', 'Kartlägg dina kompetenser mot ett drömjobb.'),
        status: skillsAt
          ? t('hubs.lastUpdated', { defaultValue: 'Senast {{when}}', when: relativeShort(skillsAt, t) })
          : t('karriarHub.features.skillsGap.building', 'Bygger upp profilen'),
        isActive: !!skillsAt,
        href: '/skills-gap-analysis',
      },
      {
        key: 'personal-brand',
        icon: Star,
        title: t('karriarHub.features.personalBrand.title', 'Personligt varumärke'),
        description: t('karriarHub.features.personalBrand.description', 'Bygg en tydlig identitet som arbetsgivare märker.'),
        status: brandAt
          ? t('hubs.lastUpdated', { defaultValue: 'Senast {{when}}', when: relativeShort(brandAt, t) })
          : t('karriarHub.features.personalBrand.notStarted', 'Inte börjat'),
        isActive: !!brandAt,
        href: '/personal-brand',
      },
      {
        key: 'education',
        icon: GraduationCap,
        title: t('karriarHub.features.education.title', 'Utbildning'),
        description: t('karriarHub.features.education.description', 'Hitta utbildningar som tar dig dit du vill.'),
        status: t('hubs.explore', 'Utforska'),
        href: '/education',
      },
    ]
  }, [data, t])

  return (
    <HubPage
      titleKey="hub-karriar"
      title={t('karriarHub.title', 'Karriär')}
      hubTitle={t('karriarHub.hubTitle', 'Planera min karriär')}
      hubDescription={t('karriarHub.hubDescription', 'Sätt mål, kartlägg kompetens och bygg din väg framåt.')}
      hubIcon={Target}
      domain="coaching"
      features={features}
      firstName={firstName}
    />
  )
}
