/**
 * Rensning av deltagarinnehåll i localStorage vid utloggning.
 *
 * Filen heter `safeStorage` efter en `SafeStorage`-klass (localStorage med
 * `dp_`-prefix och "sanering" av strängar) som hade noll anropare och togs
 * bort 2026-09-22 tillsammans med `utils/security.ts`, dess enda beroende.
 * Klassen var dessutom trasig på ett sätt som hade gjort den farlig att börja
 * använda: `setItem` HTML-eskaperade varje sträng (`/` → `&#x2F;`) men
 * `getItem` avkodade aldrig tillbaka, så en sparad URL kom ut förstörd.
 */

/**
 * A31 (docs/review-2026-08-09/sakerhet-gdpr.md #10): deltagarens CV, personliga
 * brev och annat verktygsinnehåll skrivs på flera ställen direkt till
 * `localStorage` — som molnsync-fallback
 * eller som utkast. `signOut()` nollade tidigare bara zustand-state; de här
 * nycklarna blev kvar på disk. Målgruppen sitter ofta på delade datorer
 * (bibliotek, jobbcentrum), så det är ett normalfall, inte ett kantfall.
 *
 * Detta är en EXPLICIT ALLOWLIST av nycklar att rensa — inte `localStorage.clear()`.
 * Språkval, temaval och cookie-samtycke ska överleva utloggning; de är inte
 * persondata. Håll listan i synk med grep-svepet i CLAUDE.md-uppdraget A31
 * (`grep -rn "localStorage" client/src`) när nya innehållsbärande nycklar
 * tillkommer.
 */
export const USER_SCOPED_STORAGE_KEYS: readonly string[] = [
  // stores/authStore.ts zustand-persist ('partialize' skriver { profile, isAuthenticated }
  // hit på VARJE state-ändring). Profilen innehåller namn, telefon, bio, ort,
  // önskade yrken m.m. — trots kommentaren "only non-sensitive state" i koden.
  // signOut() nollar profile i state EFTER ett lyckat Supabase-anrop, vilket
  // skriver om denna nyckel med profile:null — men om anropet kastar innan dess
  // (catch-grenen) hade nyckeln annars blivit kvar med hela profilen. Rensas
  // därför explicit här också, innan Supabase-anropet ens görs.
  'auth-storage',
  // CV (services/cloudStorage.ts, components/cv/MyCVs.tsx, hooks/useCVAutoSave.ts)
  'cv-edit-version',
  'cv-draft',
  'cv-last-saved',
  'cv-data',
  'default_cv_id',
  // Personligt brev (hooks/useAutoSave.ts nyckel satt av CoverLetterWrite.tsx)
  'cover-letter-write-draft',
  // Spontanansökan (lib/spontaneousFocusDraft.ts)
  'spontaneous-focus-draft',
  // Jobbsökning / ansökningar
  'job-applications-crm',
  'platsbanken_saved_jobs',
  'platsbanken_saved_searches',
  // Intresseguide
  'interest-guide-share',
  'interest-result',
  // Wellness / dagbok / kalender
  'wellness_data',
  'dailyTaskDate',
  'dailyTaskIndex',
  'dailyTaskCompleted',
  'energy-level',
  'calendar_events',
  'calendar_goals',
  'calendar_mood_entries',
  'content-calendar',
  // Personligt varumärke
  'brand-audit-answers',
  'portfolio-items',
  'elevator-pitches',
  'visibility-progress',
  // Övriga verktygssvar/checklistor med deltagarinnehåll
  'article_bookmarks',
  'article-bookmarks',
  'article_checklists',
  'integration-checklist',
  'negotiationChecklist',
  // Löneförhandlingens förberedelse: målön, lägstanivå och egna argument.
  // Skrivs av pages/salary/NegotiationTab.tsx och är innehållsbärande.
  'negotiationPrep',
  'culture-preferences',
  'dashboard_preferences',
  'user_preferences',
  // Sparade jobb (services/jobsApi.ts localStorage-fallback, rad ~187/190)
  // och useSavedJobs.ts:88s egen flagg-nyckel (skild från dess React
  // Query-nyckel ['saved-jobs'], som är samma STRÄNG av misstag men en
  // annan sorts data — bara den här raden är localStorage).
  'savedJobs',
  'saved-jobs',
  // Intervjusimulatorn (services/interviewService.ts) — tre nycklar:
  // huvudsessionerna, simulatorns egna sessioner, och ett utkast under pågående övning.
  'interview_sessions',
  'interview_simulator_sessions',
  'interview_simulator_utkast',
  // Uppdrag "persistens och utloggning" (2026-09-22): försvar på djupet för
  // fyra Zustand-persisterade stores. `lib/rensaVidUtloggning.ts`s register
  // nollställer redan dessa stores i MINNET vid utloggning (se resp. stores
  // egen `registreraRensning(...)`) — men bara om store-modulen redan
  // laddats i sessionen (t.ex. AI-teamet aldrig besökt). Utan den här raden
  // överlever den råa localStorage-blobben ändå, orörd, om modulen aldrig
  // hann importeras innan utloggning. Alla fyra är verifierat rena
  // innehållsnycklar (ingen tillgänglighets-/temainställning i `partialize`)
  // — till skillnad från `deltagarportal-settings`, se kommentaren nedanför.
  'ai-team-storage',
  'cv-ui-storage',
  'energy-storage',
  'profile-storage',
  // OBS, MEDVETET INTE MED: 'deltagarportal-settings' (settingsStore.ts).
  // Den nyckelns `partialize` blandar innehåll (emailNotifications,
  // pushNotifications, weeklySummary, energyLevel, hasCompletedOnboarding,
  // lastSynced — nollställs redan via en egen `registreraRensning` i
  // settingsStore.ts) med tillgänglighetsval som SKA överleva utloggning på
  // en delad dator (calmMode, focusMode, highContrast, largeText, language,
  // grafikstil). `clearUserScopedStorage()` gör bara `removeItem(key)` —
  // ett rått "hela nyckeln bort" — och skulle därför nolla språk och hög
  // kontrast tillsammans med notisinställningarna. Kvarstående risk (liten):
  // om settingsStore-modulen ALDRIG laddats i sessionen innan utloggning
  // (den importeras av Layout.tsx/useAuthInit.ts, så det kräver en
  // utloggning innan layouten hunnit montera) hinner dess egen
  // registreraRensning inte köras, och den gamla blobben ligger kvar orörd
  // tills nästa inloggning skriver över den. En delnyckel-rensning (JSON.
  // parse + ta bort bara innehållsfälten) vore rätt fix men är ett större
  // ingrepp än den här listan gör för de andra nycklarna — rapporterat, inte
  // byggt, i uppdrag B (2026-09-22).
] as const

/**
 * Rensar allt deltagarinnehåll ur localStorage vid utloggning. Anropas från
 * `authStore.signOut()` — portalens enda logout-väg (Sidebar + TopBar går
 * båda via `useAuthStore().signOut()`). Rör INTE språkval, temaval eller
 * cookie-samtycke.
 */
export function clearUserScopedStorage(): void {
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // localStorage kan vara otillgängligt (privat läge) — best effort
    }
  }
}
