# 🌐 Cloud Migration Report
## Lokalt → Molnet

### ✅ Redan i molnet (Supabase)
- ✅ CV-data (cvs-tabellen)
- ✅ Användarprofiler (profiles-tabellen)
- ✅ Personliga brev (cover_letters-tabellen)
- ✅ Intresseguide-resultat (interest_results-tabellen)
- ✅ Sparade jobb (saved_jobs-tabellen)
- ✅ Artiklar (articles-tabellen)
- ✅ Konsulentanteckningar (consultant_notes-tabellen)
- ✅ AI-användningsloggar (ai_usage_logs-tabellen)
- ✅ Inbjudningar (invitations-tabellen)

### ⚠️ Använder fortfarande localStorage (BEHOVER FIXAS)

| Komponent | Vad som sparas lokalt | Finns i cloudStorage.ts? | Status |
|-----------|----------------------|-------------------------|--------|
| **Article.tsx** | Bokmärken, läsprogress, font-storlek | ✅ Ja | 🔴 Behöver uppdateras |
| **KnowledgeBase.tsx** | Läsprogress | ✅ Ja | 🔴 Behöver uppdateras |
| **Dashboard.tsx** | Widget-inställningar | ✅ Ja | 🔴 Behöver uppdateras |
| **DarkModeToggle.tsx** | Dark mode-inställning | ✅ Ja (user_preferences) | 🟡 UI-preference OK |
| **DailyTask.tsx** | Dagliga uppgifter | ✅ Ja (daily_tasks) | 🔴 Behöver uppdateras |
| **applicationsService.ts** | Jobbansökningar | ✅ Ja | 🔴 Behöver uppdateras |
| **interviewService.ts** | Intervjusessioner | ✅ Ja | 🔴 Behöver uppdateras |
| **notificationsService.ts** | Notifikationer | ✅ Ja | 🔴 Behöver uppdateras |
| **Onboarding.tsx** | Onboarding-progress | ✅ Ja (user_onboarding) | 🔴 Behöver uppdateras |
| **PlatsbankenIntegration.tsx** | Sparade jobb och sökningar | ✅ Ja (saved_jobs) | 🔴 Behöver uppdateras |
| **CoverLetterGenerator.tsx** | Sparade jobb | ✅ Ja | 🔴 Behöver uppdateras |
| **CVBuilder.tsx** | Onboarding-status | ✅ Ja | 🟡 OK som fallback |
| **useAutoSave.ts** | Autosave av formulär | ✅ Ja (drafts) | 🔴 Behöver uppdateras |
| **Calendar.tsx** | Kalenderhändelser | ❌ Nej | 🔴 Saknas helt |
| **ResultsView.tsx** | Delningsbar data | ❌ Nej | 🟡 Engångsfunktion OK |

### 🔧 Åtgärder som behövs

#### 1. Databas-tabeller som saknas eller behöver uppdateras

```sql
-- Profil-tabellen saknar kolumner:
- bio TEXT
- location TEXT

-- Kontrollera att dessa tabeller finns:
- article_bookmarks ✅
- article_reading_progress ✅
- article_checklists ✅
- dashboard_preferences ✅
- user_preferences ✅
- mood_history ✅
- journal_entries ✅
- interest_guide_progress ✅
- user_notifications ✅
- notification_preferences ✅
- job_applications ✅
- interview_sessions ✅
- user_drafts ✅
- daily_tasks ✅
```

#### 2. Komponenter som måste uppdateras

1. **Article.tsx** - Använd `articleBookmarksApi`, `articleProgressApi` istället för localStorage
2. **KnowledgeBase.tsx** - Använd `articleProgressApi` istället för localStorage
3. **Dashboard.tsx** - Använd `dashboardPreferencesApi` istället för localStorage
4. **DailyTask.tsx** - Använd `daily_tasks` tabell eller user_preferences
5. **applicationsService.ts** - Använd `jobApplicationsApi` istället för localStorage
6. **interviewService.ts** - Använd `interviewSessionsApi` istället för localStorage
7. **notificationsService.ts** - Använd `notificationsApi` istället för localStorage
8. **Onboarding.tsx** - Använd `user_onboarding` tabell eller `userPreferencesApi`
9. **useAutoSave.ts** - Använd `draftsApi` istället för localStorage

### 🎯 Prioritet

**Hög (Användardata förloras vid rensning):**
1. Article bokmärken och progress
2. Jobbansökningar
3. Dashboard-inställningar
4. Intervjusessioner

**Medel (Preferences som kan återskapas):**
5. Daily tasks
6. Onboarding-progress
7. Notifikationer

**Låg (UI-state):**
8. Dark mode (kan vara kvar i localStorage)
9. Font-storlek (kan vara kvar i localStorage)

### ✅ Acceptabla localStorage-användningar

Dessa är OK att ha kvar i localStorage:
- **Dark mode** - UI-preference, ingen kritisk data
- **Font-storlek** - UI-preference, ingen kritisk data
- **Onboarding-visad** - Engångs-flagga
- **OAuth state** (LinkedIn) - Tillfällig autentisering
- **CV onboarding** - Engångs-guide

Allt annat som innehåller **användardata** ska till molnet!
