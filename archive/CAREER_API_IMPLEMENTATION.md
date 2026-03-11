# Career Page API Implementation

Detta dokument beskriver implementeringen av API-integration för Karriär-sidan.

## Översikt

Alla 5 flikar på Career-sidan har nu full API-integration med Supabase för att spara data i molnet:

1. **CareerCoach** - Sparar genererade karriärvägar
2. **SalaryInsights** - Sparar lönejämförelser
3. **SkillsDevelopment** - Sparar intressanta kompetenser
4. **EducationOverview** - Sparar utbildningar man är intresserad av
5. **NetworkingGuide** - Sparar och hanterar nätverkskontakter

## Nya Supabase Tabeller

### 1. career_paths
Sparar karriärvägar med:
- Nuvarande och målyrke
- Lönedata och löneökning
- Tidslinje och efterfrågan
- Steg-för-steg plan (JSON)

### 2. salary_searches  
Sparar lönejämförelser med:
- Yrke och medianlön
- Percentiler (25%, 75%)
- Regional data
- Erfarenhetsdata

### 3. user_skills
Sparar kompetenser med:
- Kompetensnamn och kategori
- Status (interested/learning/acquired)
- Prioritet
- Målyrke

### 4. saved_educations
Sparar utbildningar med:
- Utbildningskod och titel
- Typ och beskrivning
- Status (interested/applied/enrolled/completed)
- Anteckningar

### 5. network_contacts
Sparar kontakter med:
- Namn, företag, roll
- Kontaktuppgifter
- Relationstyp
- Status (active/dormant/reconnect)
- Taggar
- Senaste och nästa kontaktdatum

## API Service

Ny fil: `client/src/services/careerApi.ts`

Innehåller fem API-objekt:
- `careerPathApi` - CRUD för karriärvägar
- `salaryApi` - CRUD för lönesökningar
- `skillsApi` - CRUD för kompetenser
- `educationApi` - CRUD för utbildningar
- `networkApi` - CRUD för kontakter

Alla API:er följer samma mönster:
- `getAll()` - Hämta alla poster för inloggad användare
- `save(data)` - Spara ny post
- `update(id, data)` - Uppdatera befintlig post
- `delete(id)` - Ta bort post

## UI-uppdateringar

### CareerCoach
- Sparad historik visas över formuläret
- Varje sparad väg kan laddas eller tas bort
- "Spara karriärväg"-knapp efter resultat

### SalaryInsights
- Snabbåtkomst till sparade lönejämförelser
- "Spara lönejämförelse"-knapp efter resultat

### SkillsDevelopment
- Lista över sparade kompetenser
- Hjärt-ikon för att spara/ta bort varje kompetens

### EducationOverview
- Lista över sparade utbildningar
- Spara-knapp på varje utbildningskort
- Visar status för sparade utbildningar

### NetworkingGuide
- Fullständig kontakthantering
- Lägg till kontakt-formulär
- Filtrering efter status
- Markera som kontaktad
- Tagghantering
- Snabblänkar till LinkedIn och email

## Säkerhet

- RLS (Row Level Security) aktiverat på alla tabeller
- Användare kan bara se/sina egna data
- Alla ändringar kräver autentisering

## SQL

SQL för att skapa tabeller finns i:
`supabase/career_tables.sql`

Kör detta i Supabase SQL Editor för att skapa alla tabeller.
