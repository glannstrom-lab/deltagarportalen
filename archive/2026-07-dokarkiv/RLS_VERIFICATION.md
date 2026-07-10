# RLS (Row Level Security) Verifieringsrapport

**Genererad:** 2026-04-16
**Sprint:** 2 - Säkerhet & GDPR

## Sammanfattning

✅ **126+ tabeller har RLS aktiverat** i Supabase-migrationerna.

RLS-policies följer konsekvent mönstret:
```sql
USING (auth.uid() = user_id)
```

Detta säkerställer att användare endast kan se och modifiera sin egen data.

---

## Tabeller med RLS Aktiverat

### Kärnfunktioner (Deltagare)

| Tabell | Migration | Policies |
|--------|-----------|----------|
| profiles | 001_initial_schema.sql | SELECT/UPDATE/INSERT för egen profil |
| cvs | 001_initial_schema.sql | CRUD för egna CV:n |
| cv_versions | 001_initial_schema.sql | CRUD för egna versioner |
| cv_shares | 006_add_cv_shares.sql | Delning av CV till konsulenter |
| cv_analyses | 001_initial_schema.sql | AI-analyser av CV |
| cover_letters | 001_initial_schema.sql | CRUD för egna personliga brev |
| interest_results | 001_initial_schema.sql | Resultat från intresseguiden |
| interest_guide_progress | 20240303_move_all_to_cloud.sql | Framsteg i intresseguiden |
| interest_guide_history | 20260324120000_interest_guide_history.sql | Historik |

### Jobbsökning

| Tabell | Migration | Policies |
|--------|-----------|----------|
| saved_jobs | 001_initial_schema.sql | Sparade jobb |
| job_applications | 009_gamification_and_features.sql | Ansökningar |
| job_alerts | 20260317_job_alerts.sql | Jobbnotiser |
| application_templates | 20260306130000_fix_all_rls_and_tables.sql | Mallar |
| application_history | 20260408100000_applications_enhancement.sql | Historik |
| application_contacts | 20260408100000_applications_enhancement.sql | Kontakter |
| application_reminders | 20260408100000_applications_enhancement.sql | Påminnelser |
| shared_jobs | 20260227123729_create_shared_jobs_table.sql | Delade jobb |
| platsbanken_saved_jobs | 20260306150000_create_all_cloud_tables.sql | Platsbanken-jobb |
| platsbanken_saved_searches | 20260306150000_create_all_cloud_tables.sql | Sökningar |
| spontaneous_companies | 20260408150000_spontaneous_companies.sql | Spontanansökningar |
| spontaneous_activity | 20260408150000_spontaneous_companies.sql | Aktivitetslogg |

### Dagbok & Wellness

| Tabell | Migration | Policies |
|--------|-----------|----------|
| diary_entries | 20260317_diary_tables.sql | Dagboksinlägg |
| diary_streaks | 20260317_diary_tables.sql | Skriv-streaks |
| mood_logs | 20260317_diary_tables.sql | Humörloggar |
| mood_history | 20240303_move_all_to_cloud.sql | Humörhistorik |
| weekly_goals | 20260317_diary_tables.sql | Veckomål |
| gratitude_entries | 20260317_diary_tables.sql | Tacksamhet |
| journal_entries | 20240303_move_all_to_cloud.sql | Journalanteckningar |

### Gamification & Quests

| Tabell | Migration | Policies |
|--------|-----------|----------|
| user_gamification | 009_gamification_and_features.sql | Poäng & nivåer |
| user_achievements | 009_gamification_and_features.sql | Uppnådda prestationer |
| achievements | 20260316_milestones_system.sql | Definitioner |
| daily_tasks | 009_gamification_and_features.sql | Dagliga uppgifter |
| quest_templates | 20260313100000_create_quests_system.sql | Quest-mallar |
| user_daily_quests | 20260313100000_create_quests_system.sql | Aktiva quests |
| user_quest_stats | 20260313100000_create_quests_system.sql | Quest-statistik |
| quests | 20260313090000_add_dashboard_tables.sql | Quests |
| milestones | 20260316_milestones_system.sql | Milstolpar |
| user_milestones | 20260316_milestones_system.sql | Användarens milstolpar |
| user_streaks | 20260313090000_add_dashboard_tables.sql | Streaks |
| user_activity_log | 20260316_milestones_system.sql | Aktivitetslogg |

### Kalender & Intervjuer

| Tabell | Migration | Policies |
|--------|-----------|----------|
| calendar_events | 20260409_calendar_tables.sql | Kalenderhändelser |
| calendar_goals | 20260409_calendar_tables.sql | Kalendermål |
| calendar_mood_entries | 20260409_calendar_tables.sql | Humör i kalender |
| interview_sessions | 20260227130000_add_new_features.sql | Intervjusessioner |
| interview_recordings | 20260412120000_interview_recordings.sql | Inspelningar |

### Personal Brand

| Tabell | Migration | Policies |
|--------|-----------|----------|
| personal_brand_audit | 20260322183304_personal_brand_tables.sql | Varumärkesaudit |
| portfolio_items | 20260322183304_personal_brand_tables.sql | Portföljobjekt |
| elevator_pitches | 20260322183304_personal_brand_tables.sql | Hisstal |
| visibility_progress | 20260322183304_personal_brand_tables.sql | Synlighet |
| content_calendar | 20260322183304_personal_brand_tables.sql | Innehållskalender |

### Karriär & Lärande

| Tabell | Migration | Policies |
|--------|-----------|----------|
| career_plans | 20260412100000_career_module_tables.sql | Karriärplaner |
| career_milestones | 20260412100000_career_module_tables.sql | Karriärmilstolpar |
| skills_analyses | 20260412100000_career_module_tables.sql | Kompetensanalyser |
| favorite_occupations | 20260412100000_career_module_tables.sql | Favorityrken |
| networking_events | 20260412100000_career_module_tables.sql | Nätverkshändelser |
| courses | 20260309180000_micro_learning_hub.sql | Kurser |
| user_learning_paths | 20260309180000_micro_learning_hub.sql | Lärstigar |
| course_recommendations | 20260309180000_micro_learning_hub.sql | Kursrekommendationer |
| learning_activities | 20260309180000_micro_learning_hub.sql | Läraktiviteter |
| user_certifications | 20260309180000_micro_learning_hub.sql | Certifieringar |

### AI & Chatbot

| Tabell | Migration | Policies |
|--------|-----------|----------|
| ai_usage_logs | 20240305_ai_usage_logs.sql | AI-användningsloggar |
| ai_conversations | 009_gamification_and_features.sql | AI-konversationer |
| ai_messages | 009_gamification_and_features.sql | AI-meddelanden |
| ai_assistant_cache | 20260409_ai_assistant_cache.sql | AI-cache |

### Konsult-specifika

| Tabell | Migration | Policies |
|--------|-----------|----------|
| consultant_participants | 007_consultant_dashboard.sql | Koppling konsult-deltagare |
| consultant_notes | 001_initial_schema.sql | Konsultanteckningar |
| consultant_settings | 007_consultant_dashboard.sql | Konsultinställningar |
| consultant_messages | 20260323100000_consultant_features.sql | Meddelanden |
| consultant_meetings | 20260323100000_consultant_features.sql | Möten |
| consultant_goals | 20260323100000_consultant_features.sql | Mål för deltagare |
| consultant_journal | 20260323100000_consultant_features.sql | Konsultjournal |
| consultant_placements | 20260323100000_consultant_features.sql | Placeringar |
| consultant_goal_templates | 20260323100000_consultant_features.sql | Målmallar |
| consultant_job_collections | 20260323100000_consultant_features.sql | Jobbsamlingar |
| consultant_requests | 20260323130000_consultant_requests.sql | Förfrågningar |
| consultant_groups | 009_gamification_and_features.sql | Grupper |
| group_participants | 009_gamification_and_features.sql | Gruppdeltagare |

### GDPR & Säkerhet

| Tabell | Migration | Policies |
|--------|-----------|----------|
| consent_history | 20260327100000_user_consent.sql | Samtyckehistorik |
| account_deletion_requests | 20260327110000_delete_account.sql | Raderingsförfrågningar |
| data_export_logs | 20260327110000_delete_account.sql | Exportloggar |
| participant_data_sharing | 20260328100000_health_data_consent.sql | Datadelning |
| data_sharing_audit | 20260328100000_health_data_consent.sql | Delningsaudit |
| user_sessions | 20260324100000_security_hardening.sql | Sessioner |
| admin_audit_log | 20260324100000_security_hardening.sql | Admin-audit |
| audit_logs | 007_consultant_dashboard.sql | Generell audit |
| rate_limits | 20260402100000_rate_limits.sql | Rate limiting |
| login_attempts | 20260408130000_fix_security_warnings.sql | Inloggningsförsök |

### Övriga

| Tabell | Migration | Policies |
|--------|-----------|----------|
| articles | 001_initial_schema.sql | Artiklar (public read) |
| article_bookmarks | 20240303_move_all_to_cloud.sql | Bokmärken |
| article_reading_progress | 20240303_move_all_to_cloud.sql | Läsframsteg |
| article_checklists | 20240303_move_all_to_cloud.sql | Checklistor |
| article_categories | 20260322100000_articles_exercises_tables.sql | Kategorier |
| exercises | 20260322100000_articles_exercises_tables.sql | Övningar |
| exercise_answers | 20240303_create_exercise_answers.sql | Övningssvar |
| exercise_categories | 20260322100000_articles_exercises_tables.sql | Övningskategorier |
| exercise_steps | 20260322100000_articles_exercises_tables.sql | Övningssteg |
| exercise_questions | 20260322100000_articles_exercises_tables.sql | Övningsfrågor |
| user_activities | 002_user_activities.sql | Användaraktiviteter |
| user_preferences | 20260315_add_user_preferences.sql | Inställningar |
| dashboard_preferences | 20240303_move_all_to_cloud.sql | Dashboard-inställningar |
| user_drafts | 20240303_move_all_to_cloud.sql | Utkast |
| user_onboarding | 009_gamification_and_features.sql | Onboarding |
| user_notifications | 20240303_move_all_to_cloud.sql | Notiser |
| notification_preferences | 20240303_move_all_to_cloud.sql | Notis-inställningar |
| job_notifications | 20260412110000_job_notifications.sql | Jobbnotiser |
| email_logs | 20260412110000_job_notifications.sql | E-postloggar |
| user_interests | 20260322200000_journey_goals_achievements.sql | Intressen |
| user_goals | 20260322200000_journey_goals_achievements.sql | Mål |
| invitations | 010_invitations_table.sql | Inbjudningar |
| meeting_slots | 009_gamification_and_features.sql | Mötestider |
| writing_prompts | 20260408130000_fix_security_warnings.sql | Skrivprompts |

### Community (om aktiverat)

| Tabell | Migration | Policies |
|--------|-----------|----------|
| community_categories | 20260320_community_full.sql | Kategorier |
| community_topics | 20260320_community_full.sql | Ämnen |
| community_replies | 20260320_community_full.sql | Svar |
| community_likes | 20260320_community_full.sql | Gillningar |
| community_groups | 20260320_community_full.sql | Grupper |
| community_group_members | 20260320_community_full.sql | Medlemmar |
| community_group_messages | 20260320_community_full.sql | Meddelanden |
| community_group_invites | 20260320_community_full.sql | Inbjudningar |
| community_buddy_preferences | 20260320_community_full.sql | Kompis-inställningar |
| community_buddies | 20260320_community_full.sql | Kompisar |
| community_buddy_checkins | 20260320_community_full.sql | Incheckningar |
| community_feed | 20260320_community_features.sql | Flöde |
| community_cheers | 20260320_community_features.sql | Hejarop |

---

## RLS Policy-mönster

### Standard användardata (isolerat per användare)
```sql
CREATE POLICY "Users can manage own data"
ON table_name FOR ALL
USING (auth.uid() = user_id);
```

### Delad data (konsulent-deltagare)
```sql
-- Konsulenter kan se sina deltagares data
CREATE POLICY "Consultants can view participant data"
ON table_name FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM consultant_participants cp
    WHERE cp.consultant_id = auth.uid()
    AND cp.participant_id = table_name.user_id
    AND cp.status = 'active'
  )
);
```

### Admin-access
```sql
CREATE POLICY "Admins can view all"
ON table_name FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SUPERADMIN')
  )
);
```

### Publikt innehåll (artiklar, övningar)
```sql
CREATE POLICY "Anyone can view published articles"
ON articles FOR SELECT
USING (published = true);
```

---

## Verifieringsstatus

### ✅ Verifierat
- Alla användartabeller har RLS aktiverat
- Policies använder konsekvent `auth.uid() = user_id`
- Konsulenter har begränsad åtkomst via `consultant_participants`
- Admin-roller har utökad åtkomst med audit-loggning
- GDPR-tabeller (consent, deletion) har stark isolering
- Hälsodata (mood, wellness) har extra skydd

### ⚠️ Noteringar
- `articles` och `exercises` har publika SELECT-policies (korrekt för content)
- `rate_limits` använder service role för INSERT (korrekt för rate limiting)
- Backup-tabeller (`articles_backup`) har RLS men restriktiva policies

### Rekommendationer
1. ✅ Inga ytterligare åtgärder behövs
2. Periodisk granskning rekommenderas vid nya tabeller
3. Övervaka `admin_audit_log` för ovanliga åtkomstmönster

---

## Relaterade säkerhetsfunktioner

### Security Hardening (20260324100000_security_hardening.sql)
- Rollbyte-skydd med notifieringar
- Session-spårning med device fingerprinting
- Rate limiting per user/IP
- Admin audit logging

### Data Consent (20260328100000_health_data_consent.sql)
- Explicit samtycke för hälsodata
- Granulär datadelning med konsulenter
- Audit trail för all datadelning

---

*Detta dokument genererades som del av Sprint 2 - Säkerhet & GDPR.*
