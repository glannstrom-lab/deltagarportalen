import { useMemo } from 'react'
import {
  Heart,
  Smile,
  NotebookPen,
  Calendar,
  Dumbbell,
  UserCheck,
  Users,
} from 'lucide-react'
import HubPage, { type HubFeature } from './HubPage'
import { useMinVardagHubSummary } from '@/hooks/useMinVardagHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { streakDays } from '@/utils/streakDays'

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

export default function MinVardagHub() {
  useOnboardedHubsTracking('min-vardag')
  const { data } = useMinVardagHubSummary()

  const features = useMemo<HubFeature[]>(() => {
    const moodLogs = data?.recentMoodLogs ?? []
    const streak = streakDays(moodLogs)
    const diaryCount = data?.diaryEntryCount ?? 0
    const latestDiary = data?.latestDiaryEntry
    const upcoming = data?.upcomingEvents?.[0]
    const networkCount = data?.networkContactsCount ?? 0
    const consultant = data?.consultant

    return [
      {
        key: 'wellness',
        icon: Smile,
        title: 'Mående',
        description: 'Logga ditt mående och se hur det varierar över tid.',
        status: streak > 0
          ? `${streak} dagar i rad`
          : moodLogs.length > 0 ? 'Pågående' : 'Logga om du vill',
        isActive: streak > 0 || moodLogs.length > 0,
        href: '/wellness',
      },
      {
        key: 'diary',
        icon: NotebookPen,
        title: 'Dagbok',
        description: 'Reflektera fritt om din vecka och dina framsteg.',
        status: diaryCount > 0
          ? `${diaryCount} ${diaryCount === 1 ? 'inlägg' : 'inlägg'}${latestDiary ? ` · ${relativeShort(latestDiary.created_at)}` : ''}`
          : 'Skriv idag',
        isActive: diaryCount > 0,
        href: '/diary',
      },
      {
        key: 'calendar',
        icon: Calendar,
        title: 'Kalender',
        description: 'Möten, påminnelser och planerade aktiviteter.',
        status: upcoming
          ? `Nästa: ${upcoming.title}`
          : 'Inget inplanerat',
        isActive: !!upcoming,
        href: '/calendar',
      },
      {
        key: 'exercises',
        icon: Dumbbell,
        title: 'Övningar',
        description: 'Träna intervjuer, presentationer och mer.',
        status: 'Utforska',
        href: '/exercises',
      },
      {
        key: 'my-consultant',
        icon: UserCheck,
        title: 'Min konsulent',
        description: 'Kontakta din arbetskonsulent och se anteckningar.',
        status: consultant?.full_name ? consultant.full_name : 'Inte tilldelad',
        isActive: !!consultant?.full_name,
        href: '/my-consultant',
      },
      {
        key: 'network',
        icon: Users,
        title: 'Nätverk',
        description: 'Håll koll på dina kontakter och nätverkstillfällen.',
        status: networkCount > 0 ? `${networkCount} kontakter` : 'Bygg nätverk',
        isActive: networkCount > 0,
        href: '/nätverk',
      },
    ]
  }, [data])

  return (
    <HubPage
      titleKey="hub-min-vardag"
      title="Min vardag"
      hubLabel="Hub · Min vardag"
      hubTitle="Mina vardagliga rutiner"
      hubDescription="Mående, dagbok, kalender och möten med din konsulent."
      hubIcon={Heart}
      domain="wellbeing"
      features={features}
    />
  )
}
