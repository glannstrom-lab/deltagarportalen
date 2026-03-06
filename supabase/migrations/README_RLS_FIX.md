# RLS Fix - Instruktioner

## Problem
Dashboard preferences och andra tabeller returnerar 403 Forbidden fel på grund av saknade eller felaktiga RLS-policyer.

## Lösning
Kör SQL-filen `20260306130000_fix_all_rls_policies.sql` i Supabase SQL Editor.

## Steg-för-steg

1. **Gå till Supabase Dashboard**
   - https://app.supabase.com
   - Välj ditt projekt

2. **Öppna SQL Editor**
   - Klicka på "SQL Editor" i vänstermenyn
   - Klicka på "New query"

3. **Kör migrationen**
   - Kopiera hela innehållet från `20260306130000_fix_all_rls_policies.sql`
   - Klistra in i SQL Editor
   - Klicka "Run"

4. **Verifiera resultatet**
   - Queryn visar en tabell med status för alla tabeller
   - Alla bör visa `exists = true` och `has_rls = true`

## Vad som skapas/fixas

### Tabeller
- `dashboard_preferences` - Widget-inställningar
- `user_preferences` - Användarinställningar (dark mode, etc)
- `article_bookmarks` - Sparade artiklar
- `job_applications` - Jobbansökningar
- `interview_sessions` - Intervjuförberedelser
- `daily_tasks` - Dagliga uppgifter
- `notifications` - Aviseringar
- `job_alerts` - Jobb bevakningar
- `application_templates` - Mallar för ansökningar
- `ai_usage_logs` - AI-användningsstatistik

### RLS Policyer
Alla tabeller får:
- `USING (auth.uid() = user_id)` - Användare ser bara sina egna rader
- `WITH CHECK (auth.uid() = user_id)` - Användare kan bara skapa/uppdatera sina egna rader

### Indexes
Prestanda-index skapas för alla user_id-kolumner och vanliga filter.

### Triggers
Automatisk uppdatering av `updated_at` vid ändringar.

## Testa efter migration

1. Logga in i appen
2. Gå till Dashboard
3. Arrangera om widgets
4. Ladda om sidan - inställningarna ska sparas
5. Kontrollera att inga 403-fel visas i konsolen

## Fallback
Om något går fel används automatiskt localStorage som backup i appen.
