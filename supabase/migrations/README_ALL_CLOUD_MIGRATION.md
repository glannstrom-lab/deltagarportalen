# Komplett Cloud Migration - Instruktioner

## Sammanfattning
Denna migration skapar alla tabeller som behövs för att ersätta localStorage med Supabase.

## SQL-filer att köra (i ordning)

### 1. Huvudmigration - Alla tabeller
**Fil:** `20260306150000_create_all_cloud_tables.sql`

Skapar följande tabeller:
- `article_reading_progress` - Läsningsframsteg för artiklar
- `article_checklists` - Checklistor för artiklar
- `mood_history` - Humörhistorik
- `journal_entries` - Dagboksinlägg
- `interest_guide_progress` - Intresseguide-progress
- `notification_preferences` - Notifikationsinställningar
- `user_drafts` - Utkast (autosave)
- `daily_tasks` - Dagliga uppgifter
- `platsbanken_saved_jobs` - Sparade jobb från Platsbanken
- `platsbanken_saved_searches` - Sparade sökningar från Platsbanken
- `saved_jobs` - Sparade jobb (för CoverLetterGenerator)

### 2. Kontrollera att tidigare tabeller finns
Om du inte kört tidigare migrationer, kör även:
- `20260306130000_fix_all_rls_policies.sql`

## Hur man kör

1. Gå till https://app.supabase.com → ditt projekt → SQL Editor
2. Kopiera innehållet från `20260306150000_create_all_cloud_tables.sql`
3. Klicka "Run"
4. Verifiera att inga fel uppstod

## Vad som fungerar efter migration

| Funktion | Databas | Fallback |
|----------|---------|----------|
| Artikel-bokmärken | ✅ Supabase | ✅ localStorage |
| Artikel-läsningsprogress | ✅ Supabase | ✅ localStorage |
| Artikel-checklistor | ✅ Supabase | ✅ localStorage |
| Dashboard-widgets | ✅ Supabase | ✅ localStorage |
| Humörhistorik | ✅ Supabase | ❌ (kräver inloggning) |
| Dagbok | ✅ Supabase | ❌ (kräver inloggning) |
| Intresseguide | ✅ Supabase | ✅ localStorage |
| Notifikationer | ✅ Supabase | ✅ localStorage |
| Jobbansökningar | ✅ Supabase | ✅ localStorage |
| Intervjusessioner | ✅ Supabase | ✅ localStorage |
| Sparade jobb | ✅ Supabase | ✅ localStorage |
| Platsbanken-sparade | ✅ Supabase | ✅ localStorage |
| Dark mode | ✅ Supabase | ✅ localStorage |
| Onboarding | ✅ Supabase | ✅ localStorage |

## Testa efter migration

1. **Artiklar:**
   - Gå till Kunskapsbanken
   - Öppna en artikel
   - Kryssa i checklista
   - Ladda om sidan - checkmarkeringar ska sparas

2. **Dashboard:**
   - Arrangera om widgets
   - Ladda om - ordningen ska sparas

3. **Humör:**
   - Registrera humör i Dagboken
   - Se att det sparas

4. **Platsbanken:**
   - Spara ett jobb
   - Ladda om - jobbet ska finnas kvar

## Felsökning

Om du fortfarande ser localStorage-fallback i konsolen:
- Kontrollera att du är inloggad
- Kontrollera att tabellerna skapades i Supabase
- Kontrollera att RLS-policyerna är korrekta
