/**
 * services/cloud — molnlagringen per domän (KA3, 2026-09-12).
 *
 * Var en enda fil, services/cloudStorage.ts, 2 677 rader med 17 api-objekt.
 * Den filen är nu en tunn barrel över den här. Importera fortfarande från
 * '@/services/cloudStorage' tills importerna flyttats hit — då tas barreln bort.
 *
 * Bara det som var publikt i den gamla filen exporteras här. Hjälparna i
 * _shared.ts (getCurrentUser, handleStorageError, …) är interna.
 */

export { LagringsFel } from './_shared'
export { articleBookmarksApi, articleProgressApi, articleChecklistApi } from './artiklar'
export { dashboardPreferencesApi, userPreferencesApi } from './installningar'
export { moodHistoryApi, journalApi, moodApi, wellnessDataApi, type MoodType } from './maende'
export { interestGuideApi, type InterestGuideHistoryEntry } from './intresseguide'
export { notificationsApi } from './notiser'
export { draftsApi } from './utkast'
export { interviewSessionsApi } from './intervju'
export { platsbankenApi } from './platsbanken'
export {
  personalBrandApi,
  type PortfolioItem,
  type ElevatorPitch,
  type VisibilityProgressItem,
  type ContentCalendarItem,
} from './varumarke'
export { calendarApi } from './kalender'
export { integrationChecklistApi } from './integration'

// ============================================
// BORTTAGNA API:ER — historiken från den gamla filen, för den som letar
// ============================================

// ============================================
// JOBBANSÖKNINGAR
// ============================================
// E12 (2026-07-23): jobApplicationsApi + tabellen job_applications är utfasade.
// Den var en parallell ansökningsväg vars kolumner (employer/cover_letter/
// contact_person m.fl.) aldrig fanns i tabellen — redan tyst degraderad. Alla
// ansökningar går nu via applicationsApi (saved_jobs, med status). Den enda
// klienten (applicationService.ts) är arkiverad. Tabellen ligger kvar i DB tills
// Mikael beslutar om DROP (destruktivt, körs ej automatiskt). Se ROADMAP E12.

// ============================================
// SPARADE JOBB (för CoverLetterGenerator)
// ============================================
// savedJobsApi flyttad (E12-konsolideringen, 2026-07-28).
//
// Den här modulen hade ett EGET `savedJobsApi` med samma namn som det i
// jobsApi.ts — två objekt, samma namn, samma tabell, olika kolumnurval och
// olika felhantering. Vilket man fick berodde på vilken import man råkade
// skriva. All åtkomst till `saved_jobs` ligger nu i applicationsApi.ts;
// jobbsökningens radform exponeras av `savedJobsApi` i jobsApi.ts.
// Importera därifrån: `import { savedJobsApi } from '@/services/jobsApi'`.

// ============================================
// DARK MODE INSTÄLLNINGAR
// ============================================
// darkModeApi RADERAD 2026-07-27 (H5). Noll anropare, och den läste/skrev
// `user_preferences.dark_mode` — kolumnen heter `theme` (text: light/dark/
// system) och hanteras av ThemeContext. Värt att notera inför F1-beslutet
// (dark mode i scope eller ej): det fanns alltså två parallella lager för
// temat, varav detta aldrig kunde fungera. Finns i git-historiken.

// ============================================
// ONBOARDING PROGRESS
// ============================================
// onboardingApi RADERAD 2026-07-27 (H5). Noll anropare, och den läste/skrev
// `onboarding_progress`/`onboarding_completed`/`onboarding_skipped` på
// `user_preferences` — kolumner som inte finns där. De två första finns på
// `profiles`, vilket är vad den levande `userApi.getOnboardingProgress`
// använder. Den här var alltså en trasig dubblett som alltid föll tillbaka
// på localStorage. Finns i git-historiken.
