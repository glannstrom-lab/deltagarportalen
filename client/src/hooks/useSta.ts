/**
 * STA hooks — wrappar staApi.ts med React state + mock-fallback
 *
 * När en deltagare/konsulent öppnar STA-sidan försöker vi först hämta
 * riktiga data från Supabase. Om hen är ny (inga enrollments än), eller
 * om hen är opålogad / saknar program, faller vi tillbaka till mockData
 * så att sidan visas funktionellt för demo + testing.
 */

import { useEffect, useState, useCallback } from 'react'
import {
  staEnrollmentsApi,
  staActivitiesApi,
  staAssessmentsApi,
  staQuickNotesApi,
  staPulseChecksApi,
  staWeeklyCheckinsApi,
  staDocumentsApi,
  staAbsencesApi,
  staWorkplacesApi,
  staWorkplaceFollowupsApi,
  staProfileApi,
  fetchEnrollmentBundle,
  type StaEnrollment,
  type StaActivity,
  type StaAssessment,
  type StaQuickNote,
  type StaPulseCheck,
  type StaWeeklyCheckin,
  type StaAbsence,
  type StaWorkplace,
  type StaWorkplaceFollowup,
  type AbsenceKind,
  type StaConsultantProfile,
  type EnrollmentBundle,
  type StaPart,
  type Mood,
  type AssessmentInstrument,
} from '@/services/staApi'

export interface StaDataState {
  loading: boolean
  error: string | null
  /** Sant om vi fallbackar till mockData (ingen riktig enrollment hittades) */
  isMock: boolean
}

// =============================================================================
// useParticipantEnrollment — för deltagar-sidan
// =============================================================================
export function useParticipantEnrollment() {
  const [enrollment, setEnrollment] = useState<StaEnrollment | null>(null)
  const [state, setState] = useState<StaDataState>({ loading: true, error: null, isMock: false })

  const reload = useCallback(async () => {
    setState({ loading: true, error: null, isMock: false })
    try {
      const list = await staEnrollmentsApi.listMine()
      const active = list.find((e) => e.status === 'active') ?? list[0] ?? null
      setEnrollment(active)
      setState({ loading: false, error: null, isMock: !active })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Okänt fel'
      setState({ loading: false, error: message, isMock: true })
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const updateStartDate = useCallback(
    async (startedAt: string) => {
      if (!enrollment) return null
      const updated = await staEnrollmentsApi.participantUpdateStartDate(enrollment.id, startedAt)
      setEnrollment(updated)
      return updated
    },
    [enrollment],
  )

  const updateWeeklyHours = useCallback(
    async (weeklyHours: number) => {
      if (!enrollment) return null
      const updated = await staEnrollmentsApi.participantUpdateSelf(enrollment.id, { weeklyHours })
      setEnrollment(updated)
      return updated
    },
    [enrollment],
  )

  const markOnboardingDone = useCallback(async () => {
    if (!enrollment) return null
    const updated = await staEnrollmentsApi.participantUpdateSelf(enrollment.id, {
      markOnboardingDone: true,
    })
    setEnrollment(updated)
    return updated
  }, [enrollment])

  return { enrollment, reload, updateStartDate, updateWeeklyHours, markOnboardingDone, ...state }
}

// =============================================================================
// useStaConsultantProfile — konsulentens profil för deltagar-vyn
// =============================================================================
// Använder RPC sta_get_consultant_for_participant så deltagaren får läsa
// konsulentens namn/kontakt trots att profiles-RLS bara tillåter egen profil.
export function useStaConsultantProfile(enrollmentId: string | null | undefined) {
  const [profile, setProfile] = useState<StaConsultantProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enrollmentId) {
      setProfile(null)
      return
    }
    let cancelled = false
    setLoading(true)
    staProfileApi
      .getConsultantForParticipant(enrollmentId)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enrollmentId])

  return { profile, loading }
}

// =============================================================================
// useConsultantEnrollments — för konsulent-sidan
// =============================================================================
export function useConsultantEnrollments() {
  const [enrollments, setEnrollments] = useState<StaEnrollment[]>([])
  const [state, setState] = useState<StaDataState>({ loading: true, error: null, isMock: false })

  const reload = useCallback(async () => {
    setState({ loading: true, error: null, isMock: false })
    try {
      const list = await staEnrollmentsApi.listForConsultant()
      setEnrollments(list)
      setState({ loading: false, error: null, isMock: list.length === 0 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Okänt fel'
      setState({ loading: false, error: message, isMock: true })
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { enrollments, reload, ...state }
}

// =============================================================================
// useConsultantStats — alla konsulentens deltagare med beräknade stats
// (används för listan + KPI-rad — undviker N+1-queries genom batch-fetch)
// =============================================================================
export interface EnrollmentStatsRecord {
  enrollment: StaEnrollment
  activities: import('@/services/staApi').StaActivity[]
  assessments: import('@/services/staApi').StaAssessment[]
  documents: import('@/services/staApi').StaDocument[]
  quickNotes: import('@/services/staApi').StaQuickNote[]
  workplaces: StaWorkplace[]
}

export function useConsultantStats() {
  const [stats, setStats] = useState<EnrollmentStatsRecord[]>([])
  const [state, setState] = useState<StaDataState>({ loading: true, error: null, isMock: false })

  const reload = useCallback(async () => {
    setState({ loading: true, error: null, isMock: false })
    try {
      const enrollments = await staEnrollmentsApi.listForConsultant()
      if (enrollments.length === 0) {
        setStats([])
        setState({ loading: false, error: null, isMock: true })
        return
      }
      // Hämta alla relaterade tabeller parallellt per enrollment
      const results = await Promise.all(
        enrollments.map(async (enrollment) => {
          const [activities, assessments, documents, quickNotes, workplaces] = await Promise.all([
            staActivitiesApi.list(enrollment.id),
            staAssessmentsApi.list(enrollment.id),
            staDocumentsApi.list(enrollment.id),
            staQuickNotesApi.list(enrollment.id, 20),
            staWorkplacesApi.list(enrollment.id),
          ])
          return { enrollment, activities, assessments, documents, quickNotes, workplaces }
        }),
      )
      setStats(results)
      setState({ loading: false, error: null, isMock: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Okänt fel'
      setState({ loading: false, error: message, isMock: true })
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { stats, reload, ...state }
}

// =============================================================================
// useEnrollmentBundle — full data om en deltagare (för konsulent-drawer)
// =============================================================================
export function useEnrollmentBundle(enrollmentId: string | null) {
  const [bundle, setBundle] = useState<EnrollmentBundle | null>(null)
  const [state, setState] = useState<StaDataState>({ loading: false, error: null, isMock: false })

  const reload = useCallback(async () => {
    if (!enrollmentId) {
      setBundle(null)
      return
    }
    setState({ loading: true, error: null, isMock: false })
    try {
      const b = await fetchEnrollmentBundle(enrollmentId)
      setBundle(b)
      setState({ loading: false, error: null, isMock: !b })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Okänt fel'
      setState({ loading: false, error: message, isMock: true })
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  return { bundle, reload, ...state }
}

// =============================================================================
// useStaActivities — aktivitetslogg för en deltagare i en del
// =============================================================================
export function useStaActivities(enrollmentId: string | null, part?: StaPart) {
  const [activities, setActivities] = useState<StaActivity[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) {
      setActivities([])
      return
    }
    setLoading(true)
    try {
      const list = await staActivitiesApi.list(enrollmentId, part)
      setActivities(list)
    } catch {
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [enrollmentId, part])

  useEffect(() => {
    reload()
  }, [reload])

  const markDayComplete = useCallback(
    async (activityKey: string, reflection?: string) => {
      if (!enrollmentId || !part) return null
      const updated = await staActivitiesApi.markComplete(enrollmentId, part, activityKey, reflection)
      await reload()
      return updated
    },
    [enrollmentId, part, reload],
  )

  return { activities, loading, reload, markDayComplete }
}

// =============================================================================
// useStaPulseChecks
// =============================================================================
export function useStaPulseChecks(enrollmentId: string | null) {
  const [pulses, setPulses] = useState<StaPulseCheck[]>([])
  const [hasToday, setHasToday] = useState(false)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const [list, today] = await Promise.all([
        staPulseChecksApi.list(enrollmentId, 30),
        staPulseChecksApi.hasTodayCheck(enrollmentId),
      ])
      setPulses(list)
      setHasToday(today)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  const submitToday = useCallback(
    async (energy: number, mood?: Mood, comment?: string) => {
      if (!enrollmentId) return null
      const created = await staPulseChecksApi.submitToday({
        enrollment_id: enrollmentId,
        energy_level: energy,
        mood,
        comment,
      })
      // Spegla till diary_entries så STA-reflektioner syns i deltagarens
      // generella dagbok. Tyst fel om diary inte är tillgängligt (RLS etc.).
      if (comment && comment.trim().length > 0) {
        try {
          const { diaryEntriesApi } = await import('@/services/diaryApi')
          await diaryEntriesApi.create({
            title: null,
            content: comment.trim(),
            mood: moodToNumber(mood),
            energy_level: energy,
            tags: ['steg-till-arbete', 'pulse-check'],
            word_count: 0,
            entry_date: new Date().toISOString().slice(0, 10),
            entry_type: 'reflection',
            is_favorite: false,
          })
        } catch {
          // ignore — diary-spegling är best-effort
        }
      }
      await reload()
      return created
    },
    [enrollmentId, reload],
  )

  return { pulses, hasToday, loading, reload, submitToday }
}

function moodToNumber(mood: Mood | undefined): number | null {
  switch (mood) {
    case 'great': return 5
    case 'okay': return 4
    case 'soso': return 3
    case 'tough': return 2
    case 'bad': return 1
    default: return null
  }
}

// =============================================================================
// useStaQuickNotes
// =============================================================================
export function useStaQuickNotes(enrollmentId: string | null) {
  const [notes, setNotes] = useState<StaQuickNote[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const list = await staQuickNotesApi.list(enrollmentId)
      setNotes(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  const createNote = useCallback(
    async (input: { body?: string; tags?: string[]; voice_transcript?: string; visibility?: StaQuickNote['visibility'] }) => {
      if (!enrollmentId) return null
      const created = await staQuickNotesApi.create({ enrollment_id: enrollmentId, ...input })
      setNotes((prev) => [created, ...prev])
      return created
    },
    [enrollmentId],
  )

  const deleteNote = useCallback(
    async (id: string) => {
      await staQuickNotesApi.delete(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [],
  )

  return { notes, loading, reload, createNote, deleteNote }
}

// =============================================================================
// useStaAssessment — för skattningsformulär
// =============================================================================
export function useStaAssessment(
  enrollmentId: string | null,
  part: StaPart | null,
  instrument: AssessmentInstrument | null,
) {
  const [assessment, setAssessment] = useState<StaAssessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!enrollmentId || !part || !instrument) {
      setAssessment(null)
      return
    }
    let cancelled = false
    setLoading(true)
    staAssessmentsApi
      .getOrCreate(enrollmentId, part, instrument)
      .then((a) => {
        if (!cancelled) setAssessment(a)
      })
      .catch(() => {
        if (!cancelled) setAssessment(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enrollmentId, part, instrument])

  const saveScores = useCallback(
    async (scores: Record<string, unknown>, summary?: string) => {
      if (!assessment) return null
      setSaving(true)
      try {
        const updated = await staAssessmentsApi.saveScores(assessment.id, scores, summary)
        setAssessment(updated)
        return updated
      } finally {
        setSaving(false)
      }
    },
    [assessment],
  )

  const markComplete = useCallback(async () => {
    if (!assessment) return null
    const updated = await staAssessmentsApi.markComplete(assessment.id)
    setAssessment(updated)
    return updated
  }, [assessment])

  return { assessment, loading, saving, saveScores, markComplete }
}

// =============================================================================
// useStaWeeklyCheckin
// =============================================================================
export function useStaWeeklyCheckin(enrollmentId: string | null) {
  const [checkins, setCheckins] = useState<StaWeeklyCheckin[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const list = await staWeeklyCheckinsApi.list(enrollmentId)
      setCheckins(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  const submitForWeek = useCallback(
    async (input: Omit<Parameters<typeof staWeeklyCheckinsApi.submitForWeek>[0], 'enrollment_id'>) => {
      if (!enrollmentId) return null
      const created = await staWeeklyCheckinsApi.submitForWeek({ enrollment_id: enrollmentId, ...input })
      await reload()
      return created
    },
    [enrollmentId, reload],
  )

  return { checkins, loading, reload, submitForWeek }
}

// =============================================================================
// useStaAbsences — frånvaroanmälan
// =============================================================================
export function useStaAbsences(enrollmentId: string | null) {
  const [absences, setAbsences] = useState<StaAbsence[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) {
      setAbsences([])
      return
    }
    setLoading(true)
    try {
      const list = await staAbsencesApi.list(enrollmentId)
      setAbsences(list)
    } catch {
      setAbsences([])
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  const report = useCallback(
    async (input: { date: string; kind: AbsenceKind; reason?: string }) => {
      if (!enrollmentId) return null
      const created = await staAbsencesApi.upsert({
        enrollment_id: enrollmentId,
        absence_date: input.date,
        kind: input.kind,
        reason: input.reason,
      })
      await reload()
      return created
    },
    [enrollmentId, reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await staAbsencesApi.delete(id)
      await reload()
    },
    [reload],
  )

  return { absences, loading, reload, report, remove }
}

// =============================================================================
// useStaWorkplaces — arbetsprövningsplatser per deltagare (Del 3-4)
// =============================================================================
export function useStaWorkplaces(enrollmentId: string | null) {
  const [workplaces, setWorkplaces] = useState<StaWorkplace[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enrollmentId) {
      setWorkplaces([])
      return
    }
    setLoading(true)
    try {
      const list = await staWorkplacesApi.list(enrollmentId)
      setWorkplaces(list)
    } catch {
      setWorkplaces([])
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    reload()
  }, [reload])

  const create = useCallback(
    async (input: Omit<Parameters<typeof staWorkplacesApi.create>[0], 'enrollment_id'>) => {
      if (!enrollmentId) return null
      const created = await staWorkplacesApi.create({ ...input, enrollment_id: enrollmentId })
      await reload()
      return created
    },
    [enrollmentId, reload],
  )

  const update = useCallback(
    async (id: string, updates: Partial<StaWorkplace>) => {
      const updated = await staWorkplacesApi.update(id, updates)
      await reload()
      return updated
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await staWorkplacesApi.delete(id)
      await reload()
    },
    [reload],
  )

  return { workplaces, loading, reload, create, update, remove }
}

// =============================================================================
// useStaWorkplaceFollowups — veckovis uppföljning per arbetsplats
// =============================================================================
export function useStaWorkplaceFollowups(workplaceId: string | null) {
  const [followups, setFollowups] = useState<StaWorkplaceFollowup[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!workplaceId) {
      setFollowups([])
      return
    }
    setLoading(true)
    try {
      const list = await staWorkplaceFollowupsApi.list(workplaceId)
      setFollowups(list)
    } catch {
      setFollowups([])
    } finally {
      setLoading(false)
    }
  }, [workplaceId])

  useEffect(() => {
    reload()
  }, [reload])

  const upsert = useCallback(
    async (input: Omit<Parameters<typeof staWorkplaceFollowupsApi.upsert>[0], 'workplace_id'>) => {
      if (!workplaceId) return null
      const result = await staWorkplaceFollowupsApi.upsert({ ...input, workplace_id: workplaceId })
      await reload()
      return result
    },
    [workplaceId, reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await staWorkplaceFollowupsApi.delete(id)
      await reload()
    },
    [reload],
  )

  return { followups, loading, reload, upsert, remove }
}

// =============================================================================
// Hjälpfunktion: aktuell vecka måndag (för weekly check-in)
// =============================================================================
export function getCurrentWeekMonday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = sön, 1 = mån, ..., 6 = lör
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysSinceMonday)
  return monday.toISOString().slice(0, 10)
}
