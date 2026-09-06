/**
 * KK4 — delad hämtning av `consultant_dashboard_participants`.
 *
 * Fem flikar (OverviewTab, AnalyticsTab, CommunicationTab, ParticipantsTab,
 * ParticipantDetailPage) gjorde tidigare var sitt oberoende
 * `select('*').eq('consultant_id', ...)`-anrop mot samma vy, en gång per
 * mount — varje flikbyte innebar en ny full hämtning, utan `.limit()` eller
 * `.range()`. Vid 30 deltagare märks inget; vid 200 och flera flikbyten per
 * session gör det det.
 *
 * Det här är den enda platsen som frågar vyn för "alla mina deltagare".
 * En nyckel, en form, en ägare — lärdomen från `['application-stats']`
 * (två features skrev till samma react-query-nyckel med olika form och
 * förgiftade varandra tyst). Här finns bara EN skrivare av EN form.
 *
 * `staleTime` gör att vanliga flikbyten inom fönstret återanvänder cachen
 * i stället för att hämta om. En mutation som ändrar något vyn visar
 * (status, prioritet, taggar, senaste kontakt m.fl. — se kolumnlistan i
 * `supabase/schema-snapshot.json`) ska anropa
 * `useInvalidateConsultantParticipants()` efter att den lyckats, annars ser
 * andra flikar en gammal lista tills `staleTime` löper ut av sig själv.
 *
 * Filtrerade delmängder (t.ex. AnalyticsTab:s jämförelse mot föregående
 * period via `assigned_at`) är EGNA frågor, inte dubbletter av den här —
 * de rörs inte av det här bytet.
 */
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Vyn returnerar alla kolumner i supabase/schema-snapshot.json för
// consultant_dashboard_participants. Konsumenterna har egna, snävare
// interface (samma fält, ibland en delmängd) — den här typen är medvetet
// bred så varje flik kan casta till sin egen form utan friktion.
export type ConsultantDashboardParticipantRow = Record<string, unknown> & {
  participant_id: string
}

export const CONSULTANT_PARTICIPANTS_QUERY_KEY = ['consultant-dashboard-participants'] as const

async function fetchConsultantParticipants(): Promise<ConsultantDashboardParticipantRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('consultant_dashboard_participants')
    .select('*')
    .eq('consultant_id', user.id)

  if (error) throw error
  return (data ?? []) as ConsultantDashboardParticipantRow[]
}

const STALE_TIME_MS = 30_000

export function useConsultantParticipants() {
  return useQuery({
    queryKey: CONSULTANT_PARTICIPANTS_QUERY_KEY,
    queryFn: fetchConsultantParticipants,
    staleTime: STALE_TIME_MS,
  })
}

/**
 * För flikar som INTE är byggda kring `useQuery` (OverviewTab, AnalyticsTab,
 * CommunicationTab, ParticipantDetailPage — var och en gör en egen större
 * imperativ hämtning med flera andra tabeller i samma svep). De anropar den
 * här i stället för att bygga om till reaktiv rendering: `fetchQuery`
 * återanvänder cachen om den är färsk, och delar ett pågående nätverksanrop
 * om en annan flik redan hämtar — samma nyckel, samma cache-post som
 * `useConsultantParticipants()` ovan.
 */
export function fetchCachedConsultantParticipants(
  queryClient: QueryClient
): Promise<ConsultantDashboardParticipantRow[]> {
  return queryClient.fetchQuery({
    queryKey: CONSULTANT_PARTICIPANTS_QUERY_KEY,
    queryFn: fetchConsultantParticipants,
    staleTime: STALE_TIME_MS,
  })
}

/** Direkt-variant för mutations-hanterare som redan har en `QueryClient`. */
export function invalidateConsultantParticipants(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: CONSULTANT_PARTICIPANTS_QUERY_KEY })
}

/** Hook-variant — anropas efter en lyckad mutation som ändrar vyns data. */
export function useInvalidateConsultantParticipants() {
  const queryClient = useQueryClient()
  return () => invalidateConsultantParticipants(queryClient)
}
