import { useMemo } from 'react'
import {
  Heart,
  Smile,
  NotebookPen,
  Calendar,
  Dumbbell,
  UserCheck,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useMinVardagHubSummary } from '@/hooks/useMinVardagHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { streakDays } from '@/utils/streakDays'
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

export default function MinVardagHub() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('minVardagHub.title', 'Min vardag')}
        icon={Heart}
        domain="wellbeing"
      >
        <FocusHubWizard
          onExit={toggleFocusMode}
          pageKey="minVardagHub"
          question={t('focus.minVardagHub.question', 'Vad känns viktigt i din vardag just nu?')}
          tools={[
            { id: 'wellness', path: '/wellness', label: t('nav.wellness', 'Mående'), icon: Smile },
            { id: 'diary', path: '/diary', label: t('nav.diary', 'Dagbok'), icon: NotebookPen },
            { id: 'calendar', path: '/calendar', label: t('nav.calendar', 'Kalender'), icon: Calendar },
            { id: 'exercises', path: '/exercises', label: t('nav.exercises', 'Övningar'), icon: Dumbbell },
            { id: 'consultant', path: '/my-consultant', label: t('nav.myConsultant', 'Min konsulent'), icon: UserCheck },
          ]}
        />
      </PageFocusShell>
    )
  }

  return <MinVardagHubInner />
}

function MinVardagHubInner() {
  const { t } = useTranslation()
  useOnboardedHubsTracking('min-vardag')
  const { data } = useMinVardagHubSummary()
  const firstName = useAuthStore(s => s.profile?.first_name)

  const features = useMemo<HubFeature[]>(() => {
    const moodLogs = data?.recentMoodLogs ?? []
    const streak = streakDays(moodLogs)
    const diaryCount = data?.diaryEntryCount ?? 0
    const latestDiary = data?.latestDiaryEntry
    const upcoming = data?.upcomingEvents?.[0]
    const consultant = data?.consultant

    return [
      {
        key: 'wellness',
        icon: Smile,
        title: t('minVardagHub.features.wellness.title', 'Mående'),
        description: t('minVardagHub.features.wellness.description', 'Logga ditt mående och se hur det varierar över tid.'),
        status: streak > 0
          ? t('minVardagHub.features.wellness.streak', { defaultValue: '{{count}} dagar i rad', count: streak })
          : moodLogs.length > 0
            ? t('hubs.inProgress', 'Pågående')
            : t('minVardagHub.features.wellness.log', 'Logga om du vill'),
        isActive: streak > 0 || moodLogs.length > 0,
        href: '/wellness',
      },
      {
        key: 'diary',
        icon: NotebookPen,
        title: t('minVardagHub.features.diary.title', 'Dagbok'),
        description: t('minVardagHub.features.diary.description', 'Reflektera fritt om din vecka och dina framsteg.'),
        status: diaryCount > 0
          ? `${t('minVardagHub.features.diary.entries', { defaultValue: '{{count}} inlägg', count: diaryCount })}${latestDiary ? ` · ${relativeShort(latestDiary.created_at, t)}` : ''}`
          : t('minVardagHub.features.diary.writeToday', 'Skriv idag'),
        isActive: diaryCount > 0,
        href: '/diary',
      },
      {
        key: 'calendar',
        icon: Calendar,
        title: t('minVardagHub.features.calendar.title', 'Kalender'),
        description: t('minVardagHub.features.calendar.description', 'Möten, påminnelser och planerade aktiviteter.'),
        status: upcoming
          ? t('minVardagHub.features.calendar.next', { defaultValue: 'Nästa: {{title}}', title: upcoming.title })
          : t('minVardagHub.features.calendar.nothingPlanned', 'Inget inplanerat'),
        isActive: !!upcoming,
        href: '/calendar',
      },
      {
        key: 'exercises',
        icon: Dumbbell,
        title: t('minVardagHub.features.exercises.title', 'Övningar'),
        description: t('minVardagHub.features.exercises.description', 'Träna intervjuer, presentationer och mer.'),
        status: t('hubs.explore', 'Utforska'),
        href: '/exercises',
      },
      {
        key: 'my-consultant',
        icon: UserCheck,
        title: t('minVardagHub.features.myConsultant.title', 'Min konsulent'),
        description: t('minVardagHub.features.myConsultant.description', 'Kontakta din arbetskonsulent och se anteckningar.'),
        status: consultant?.full_name ? consultant.full_name : t('minVardagHub.features.myConsultant.notAssigned', 'Inte tilldelad'),
        isActive: !!consultant?.full_name,
        href: '/my-consultant',
      },
      // Nätverk hör till Resurser-hubben (DESIGN.md §3 — en sida = en hub).
      // Tidigare dubblerad här; fixat 2026-05-10 i Fas 3.4.
    ]
  }, [data, t])

  return (
    <HubPage
      titleKey="hub-min-vardag"
      title={t('minVardagHub.title', 'Min vardag')}
      hubTitle={t('minVardagHub.hubTitle', 'Din vardag')}
      hubDescription={t('minVardagHub.hubDescription', 'Mående, dagbok, kalender och möten med din konsulent.')}
      hubIcon={Heart}
      domain="wellbeing"
      features={features}
      firstName={firstName}
    />
  )
}
