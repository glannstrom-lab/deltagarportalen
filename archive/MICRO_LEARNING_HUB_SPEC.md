# Feature-specifikation: Mikro-Lärande Hub

## Översikt

**Feature-namn:** Mikro-Lärande Hub  
**Status:** Under utveckling  
**Ägare:** Product Manager  
**Prioritet:** P1 - Viktig för användarengagemang  

---

## 1. Användarberättelser (User Stories)

### Första besök - Upptäcksfas

#### US-001: Upptäcka kompetensgap
> **Som** arbetssökande  
> **Vill jag** se vilka kompetenser som efterfrågas för mitt drömjobb  
> **Så att** jag vet exakt vad jag behöver lära mig

**Acceptanskriterier:**
- [ ] Användaren kan söka efter yrke och se efterfrågade kompetenser
- [ ] Systemet visar vilka kompetenser som saknas jämfört med användarens profil
- [ ] Varje kompetens har en länk till relaterade kurser

#### US-002: Hitta gratis kurser
> **Som** arbetssökande med begränsad ekonomi  
> **Vill jag** filtrera på gratis kurser och resurser  
> **Så att** jag kan utvecklas utan kostnad

**Acceptanskriterier:**
- [ ] Tydlig filter för "Gratis" / "Kostnadsfritt"
- [ ] Kurser sorteras efter pris (gratis först om filter är aktivt)
- [ ] Tydlig prisindikation på varje kurskort

#### US-003: Första mikro-learning upplevelse
> **Som** ny användare med låg energi  
> **Vill jag** prova en kort (5-10 min) introduktionskurs direkt  
> **Så att** jag känner att jag kommit igång utan att bli överväldigad

**Acceptanskriterier:**
- [ ] "Snabbstart"-sektion med kurser under 15 minuter
- [ ] Tydlig tidsangivelse på varje kurs
- [ ] Energinivå-indikator (låg/medel/hög) på varje kurs

---

### Återkommande användare - Utvecklingsfas

#### US-004: Spåra lärandeprogress
> **Som** engagerad användare  
> **Vill jag** se mina pågående kurser och hur långt jag kommit  
> **Så att** jag kan fortsätta där jag slutade

**Acceptanskriterier:**
- [ ] "Fortsätt"-sektion på dashboard med påbörjade kurser
- [ ] Progress-indikator (%) för varje pågående kurs
- [ ] Senast besökt modul är markerad

#### US-005: Spara kurser för senare
> **Som** användare med begränsad tid  
> **Vill jag** spara intressanta kurser till en "Läsa senare"-lista  
> **Så att** jag inte glömmer bort dem

**Acceptanskriterier:**
- [ ] "Spara"-knapp på varje kurs
- [ ] "Sparade kurser"-sida med möjlighet att organisera
- [ ] Notifikation efter X dagar om sparad men ej påbörjad kurs

#### US-006: Få rekommendationer
> **Som** användare som vill utvecklas  
> **Vill jag** få personliga kursrekommendationer baserat på mina intressen och CV  
> **Så att** jag upptäcker relevanta kurser jag annars missat

**Acceptanskriterier:**
- [ ] AI-baserade rekommendationer baserat på CV-data
- [ ] Rekommendationer visas på dashboard och i hubben
- [ ] Användaren kan ge feedback på rekommendationer (tumme upp/ner)

#### US-007: Bygga kompetensprofil
> **Som** användare som vill visa mina nya kunskaper  
> **Vill jag** att avklarade kurser automatiskt läggs till i mitt CV  
> **Så att** arbetsgivare ser min kompetensutveckling

**Acceptanskriterier:**
- [ ] Knapp "Lägg till i CV" vid kursavslutning
- [ ] Automatisk uppdatering av CV med kursnamn och kompetenser
- [ ] Möjlighet att redigera/kontrollera innan publicering

---

### Konsulent-perspektiv

#### US-008: Se deltagares lärande
> **Som** arbetskonsulent  
> **Vill jag** se vilka kurser mina deltagare har avslutat och påbörjat  
> **Så att** jag kan stötta dem i deras utveckling

**Acceptanskriterier:**
- [ ] Konsulent-dashboard visar deltagares kursaktivitet
- [ ] Tydlig statistik över avslutade/påbörjade kurser
- [ ] Möjlighet att rekommendera specifika kurser till deltagare

#### US-009: Föreslå gruppkurser
> **Som** arbetskonsulent  
> **Vill jag** kunna föreslå kurser för hela min grupp  
> **Så att** flera deltagare kan utvecklas tillsammans

**Acceptanskriterier:**
- [ ] "Dela med grupp"-funktion från kursvy
- [ ] Deltagare får notifikation om grupprekommendation
- [ ] Konsulent ser vem som visat intresse/påbörjat kursen

#### US-010: Koppla till aktivitetsrapportering
> **Som** arbetskonsulent  
> **Vill jag** att kursaktivitet automatiskt loggas som aktivitet  
> **Så att** det räknas som jobbsökaraktivitet

**Acceptanskriterier:**
- [ ] Automatisk loggning av kurstid i aktivitetslogg
- [ ] Kursaktivitet synlig i deltagarens dagbok/statistik
- [ ] Möjlighet att exportera för AF-rapportering

---

## 2. Funktionella krav

### MUST have (kritiska för MVP)

| ID | Krav | Beskrivning |
|----|------|-------------|
| FR-001 | Kurskatalog | Lista med kurser från minst 3 externa källor (YouTube, Khan Academy, LinkedIn Learning) |
| FR-002 | Sök & Filter | Sök på ämne + filter för: pris (gratis/betald), längd, svårighetsgrad, format (video/text/interaktiv) |
| FR-003 | Kursdetaljsida | Visa: titel, beskrivning, längd, pris, provider, betyg, relaterade kompetenser |
| FR-004 | Progress-tracking | Spara progress i localStorage (tid, % avklarat, senaste modul) |
| FR-005 | Extern länk | Klickbar länk till kursen på originalplattform |
| FR-006 | Integration SkillsGapAnalysis | Från "saknad kompetens" direkt till "hitta kurs" |
| FR-007 | Sparade kurser | Kunna spara/bokmärka kurser till personlig lista |
| FR-008 | Mobilvänlig | Fullt responsiv design för mobilanvändning |

### SHOULD have (viktiga men inte blockerande)

| ID | Krav | Beskrivning |
|----|------|-------------|
| FR-009 | Kategorisering | Organisera kurser i kategorier: Tekniska skills, Mjuka färdigheter, Certifieringar, Språk |
| FR-010 | Rekommendationer | AI-baserade rekommendationer baserat på CV och intressen |
| FR-011 | CV-integration | Kunna lägga till avklarade kurser i CV:t |
| FR-012 | Konsulentvy | Se deltagares sparade och påbörjade kurser |
| FR-013 | Energinivå-taggar | Tagga kurser med energikrav: Låg (passivt), Medel (aktivt), Hög (interaktivt) |
| FR-014 | TTS-stöd | Text-to-speech för kurssammanfattningar |
| FR-015 | Dela-funktion | Kunna dela kurs med andra användare |

### COULD have (nice-to-have)

| ID | Krav | Beskrivning |
|----|------|-------------|
| FR-016 | Inbyggd spelare | Visa YouTube-videos inuti portalen (embedded) |
| FR-017 | Quiz/Verifiering | Enkla quiz för att verifiera inlärning |
| FR-018 | Achievement för kurser | Badge "Första kursen", "10 kurser", "Kompetens-expert" |
| FR-019 | Studiegrupper | Möjlighet att bilda studiegrupper med andra användare |
| FR-020 | Offline-indikator | Markera kurser som fungerar offline (nedladdningsbara) |
| FR-021 | Lärande-statistik | Graf över tid spenderad på lärande per vecka/månad |

### WON'T have (i denna version)

| ID | Krav | Motivering |
|----|------|------------|
| FR-022 | Egen LMS | Bygga eget kursinnehåll - för resurskrävande |
| FR-023 | Betalvägg-integration | Hantera betalningar för kurser - juridisk komplexitet |
| FR-024 | Certifikat-utfärdande | Egen certifiering - kräver ackreditering |
| FR-025 | Live-kurser | Realtidsundervisning - för komplext för MVP |
| FR-026 | Mentorskaps-matchning | Koppla till mentorer - separat feature |

---

## 3. Integrationer

### 3.1 Kunskapsbanken

**Hur kurser visas:**
```
Kunskapsbanken (Artiklar)
├── Lägg till ny kategori: "Kurser & Lärande"
├── Artikel-kort kan visa relaterade kurser
└── Artikel-sidfot: "Vill du lära dig mer? Se dessa kurser"
```

**Teknisk integration:**
- Lägg till `relatedCourses` fält i artikel-data (array med kurs-ID:n)
- Visa "Relaterade kurser"-sektion på artikel-sidor
- Kurser från samma kategori som artikeln visas i sidopanel

**UI:**
```tsx
// På Article.tsx, lägg till efter relatedArticles:
<RelatedCourses 
  courses={article.relatedCourses} 
  heading="Vill du gå djupare?"
/>
```

### 3.2 Karriärsidan → SkillsDevelopment

**Hur kopplas till SkillsDevelopment:**
```
Kompetensutveckling (SkillsDevelopment)
├── Varje efterfrågad kompetens → "Hitta kurser"-knapp
├── Klick → Mikro-Lärande Hub med filter på kompetens
└── Sparade kompetenser → automatiska kursrekommendationer
```

**Teknisk integration:**
- Utöka `UserSkill` typen med `suggestedCourses: string[]`
- Lägg till "Hitta kurser"-knapp i SkillsDevelopment-kort
- URL-parameter för att förfiltrera: `/learning-hub?skill=javascript`

**UI:**
```tsx
// I SkillsDevelopment.tsx, lägg till per skill:
<div className="flex gap-2">
  <button onClick={() => findCourses(skill.name)}>
    <GraduationCap size={16} />
    Hitta kurser
  </button>
</div>
```

### 3.3 CV-byggaren

**Hur kurser läggs till i CV:**
```
CV-byggaren
├── Ny sektion: "Kompetensutveckling & Kurser"
├── Kurser kan importeras från sparade/avklarade
└── Automatisk formatering: Kursnamn | Provider | År
```

**Teknisk integration:**
- Ny CV-sektion: `education.courses: CourseEntry[]`
- Modal för att välja kurser att inkludera
- Synkronisering med `user_courses` tabell i databasen

**UI:**
```tsx
// I CVBuilder, nytt steg eller sektion:
<CourseSelector 
  completedCourses={completedCourses}
  onSelect={(courses) => updateCV({ courses })}
/>
```

### 3.4 Dashboard

**Integration med Dashboard:**
```
Dashboard
├── Widget: "Fortsätt lära dig" - visa påbörjade kurser
├── Widget: "Rekommenderat för dig" - AI-kursförslag
└── Aktivitetslogg: Logga kurstid automatiskt
```

**UI:**
```tsx
// Ny widget:
<LearningWidget 
  inProgress={inProgressCourses}
  recommended={recommendedCourses}
/>
```

---

## 4. Konkurrentanalys

### LinkedIn Learning

| Vad de har | Vad saknas | Vår differentiering |
|------------|------------|---------------------|
| 16,000+ kurser | Gratisalternativ få | Fokus på 100% gratis kurser |
| Professionell kvalitet | Personlig koppling till jobbsökning | Direktkoppling till CV och kompetensgap |
| Certifikat | Integration med externa plattformar | Aggregator från flera källor (YouTube, Khan, etc.) |
| Karriärvägar | Energianpassat för utsatta grupper | "Låg energi"-filter för långtidsarbetslösa |
| Premium-prissättning | Konsulent-stöd | Dela med arbetskonsulent-funktion |

**Vår edge:** Vi är inte en kursplattform - vi är en **kursnavigator** som kopplar rätt kurs till rätt person vid rätt tillfälle i deras jobbsökarresa.

### Khan Academy

| Styrkor | Svagheter | Vår approach |
|---------|-----------|--------------|
| 100% gratis | Begränsat för vuxenyrken | Fokus på arbetsmarknadsrelevanta kurser |
| Pedagogiskt genomtänkt | Saknar jobbsökar-kontext | Kontext: "Denna kurs hjälper dig få jobb som X" |
| Bra för grundläggande kunskaper | Ingen CV-integration | Automatisk CV-uppdatering |
| Spelifiering | Ingen svensk lokalisering | Fullt på svenska, anpassat för svensk AF |

### Komvux / Yrkeshögskola

| Styrkor | Svagheter | Vår approach |
|---------|-----------|--------------|
| Erbjuder formella meriter | Långa ansökningsprocesser | Snabb åtkomst - starta idag |
| CSN-berättigande | Fysiskt närvaro ofta krävs | Digitala alternativ markerade |
| Strukturerat | Ofta långa utbildningar | Mikro-kurser (timmar, inte månader) |

### Svenska aktörer: Learnify, Edukativ

| Observation | Vår differentiering |
|-------------|---------------------|
| Fokus på företagsutbildning | Fokus på arbetssökande |
| Betalmodeller | Gratis-first approach |
| Ingen AF-integration | Byggt för samarbete med Arbetsförmedlingen |

### Sammanfattad differentiering

```
┌─────────────────────────────────────────────────────────────────┐
│                    VÅR UNIKA POSITION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│   │  KOMPETENS   │ ───► │    KURSER    │ ───► │      CV      │ │
│   │    GAP       │      │   (gratis)   │      │  UPPDATERAT  │ │
│   └──────────────┘      └──────────────┘      └──────────────┘ │
│          │                                           ▲         │
│          │              ┌──────────────┐            │         │
│          └────────────►│  KONSULENT   │────────────┘         │
│                        │   STÖD       │                      │
│                        └──────────────┘                      │
│                                                                 │
│   INGEN ANNAN KOMBINERAR ALLA DESSA I EN FLÖDE!                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Framgångskriterier

### KPI:er att mäta

#### Engagement KPIs

| KPI | Baslinje | Mål (3 mån) | Mål (6 mån) | Hur mäts |
|-----|----------|-------------|-------------|----------|
| Kurser påbörjade/vecka | 0 | 50 | 200 | `user_course_progress` tabell |
| Kurser sparade/vecka | 0 | 100 | 400 | `saved_courses` räkning |
| Genomsnittlig tid på hubben | - | 5 min | 8 min | Analytics event: `learning_hub_time` |
| Återbesöksfrekvens | - | 30% | 45% | Användare som återvänt inom 7 dagar |

#### Conversion KPIs

| KPI | Baslinje | Mål (3 mån) | Mål (6 mån) | Hur mäts |
|-----|----------|-------------|-------------|----------|
| % som går från gap-analys till kurs | - | 25% | 40% | Tratta: skill → kurs-klick |
| Kurser tillagda i CV | 0 | 20% av avklarade | 35% | CV-uppdateringar med kurs-data |
| Externa kursstarter | - | 60% av klick | 70% | UTM-spårning på utlänkar |

#### Quality KPIs

| KPI | Mål | Hur mäts |
|-----|-----|----------|
| Kursnöjdhet | >4.0/5 | Användarbetyg efter kursbesök |
| Rekommendations-accuracy | >70% thumbs-up | Feedback på AI-rekommendationer |
| Konsulentnöjdhet | >4.0/5 | Enkät till arbetskonsulenter |

### Mätpunkter (Events att logga)

```typescript
// Analytics events som ska implementeras
interface LearningHubEvents {
  'learning_hub_visited': {
    source: 'dashboard' | 'skills_gap' | 'knowledge_base' | 'direct'
  }
  'course_search': {
    query: string
    filters_used: string[]
    results_count: number
  }
  'course_clicked': {
    course_id: string
    provider: string
    position: number // i sökresultat
  }
  'course_saved': {
    course_id: string
    source: 'search' | 'recommendation' | 'skill_gap'
  }
  'course_started': {
    course_id: string
    estimated_duration: number
  }
  'course_progress': {
    course_id: string
    progress_percent: number
    time_spent: number
  }
  'course_completed': {
    course_id: string
    total_time: number
    added_to_cv: boolean
  }
  'recommendation_feedback': {
    course_id: string
    feedback: 'thumbs_up' | 'thumbs_down'
  }
}
```

---

## 6. Risker och beroenden

### Tekniska risker

| Risk | Sannolikhet | Påverkan | Mitigering |
|------|-------------|----------|------------|
| Externa kurser försvinner | Medium | Hög | Cache-kopia + användarrapportering + regelbunden validering |
| API-begränsningar (YouTube) | Medium | Medium | API-nyckel-rotation, fallback till manuella länkar |
| Laddningstider vid många kurser | Låg | Medium | Paginering, lazy loading, CDN för bilder |
| Felaktig kursdata | Låg | Medium | Användarrapportering, moderator-granskning |

### API-begränsningar

| API | Gräns | Vår strategi |
|-----|-------|--------------|
| YouTube Data API | 10,000 units/dag | Caching, endast sök vid behov |
| Khan Academy API | Gratis men begränsad | Sparad katalog, uppdateras veckovis |
| LinkedIn Learning | Partner-API krävs | Deep-links utan API initialt |
| Coursera/edX | Affiliate-länkar | Ingen API, manuell kuratering |

### Innehållsrisker

| Risk | Beskrivning | Åtgärd |
|------|-------------|--------|
| Kvalitet varierar | Gratis kurser har olika kvalitet | Rating-system, användarrecensioner, kuraterade listor |
| Föråldrat innehåll | Kurser blir inaktuella | "Senast verifierad"-datum, användarrapportering |
| Språk | Mycket innehåll på engelska | Tydlig språk-tag, föredra svenskt innehåll |
| Tillgänglighet | Videos fungerar inte för alla | Text-alternativ, transkriptioner där möjligt |

### Affärsrisker

| Risk | Beskrivning | Åtgärd |
|------|-------------|--------|
| Lågt engagemang | Användare hittar inte rätt kurser | AI-rekommendationer, konsulent-stöd, tydligare UX |
| Konkurrens från stora aktörer | LinkedIn, Khan expanderar | Nisch-fokus på arbetssökande, AF-integration |
| Beroende av externa plattformar | De ändrar villkor | Diversifiera källor, bygg relationer |

---

## 7. Release-plan

### MVP (Minimum Viable Product)

**Omfattning:**
- [ ] Kurskatalog med 50+ kurser (manuellt kuraterade)
- [ ] Sök & filter (pris, längd, kategori)
- [ ] Kursdetaljsida med extern länk
- [ ] Progress-tracking (localStorage)
- [ ] Integration med SkillsGapAnalysis ("Hitta kurser"-knapp)
- [ ] Mobilvänlig design
- [ ] Sparade kurser

**Tidsuppskattning:** 3 veckor  
**Målgrupp:** Intern testgrupp + 20 pilot-deltagare

### Fas 2 (Förstärkning)

**Omfattning:**
- [ ] AI-rekommendationer
- [ ] CV-integration
- [ ] Konsulentvy
- [ ] Dashboard-widget
- [ ] 200+ kurser i katalogen
- [ ] Achievement-system för kurser

**Tidsuppskattning:** 2 veckor  
**Målgrupp:** Alla användare i pilot-kommun

### Fas 3 (Skalning)

**Omfattning:**
- [ ] Automatisk kurs-import från API:er
- [ ] Studiegrupper
- [ ] Quiz/verifiering
- [ ] Avancerad statistik
- [ ] 1000+ kurser

**Tidsuppskattning:** 4 veckor  
**Målgrupp:** Alla användare

### Release-kalender

```
Vecka 1-3:   MVP-utveckling
Vecka 4:     Intern QA + bugfixar
Vecka 5:     Pilot-release (20 användare)
Vecka 6-7:   Fas 2-utveckling
Vecka 8:     Release Fas 2 till pilot-kommun
Vecka 9-12:  Fas 3-utveckling
Vecka 13:    Full release
```

---

## Bilaga: Databasschema

### Nya tabeller

```sql
-- Kurser (katalog)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL, -- 'youtube', 'khan_academy', 'linkedin_learning', etc.
  external_url TEXT NOT NULL,
  external_id TEXT, -- ID på originalplattform
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  price_type TEXT CHECK (price_type IN ('free', 'freemium', 'paid')),
  price_amount DECIMAL(10,2),
  language TEXT DEFAULT 'sv',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  categories TEXT[], -- array av kategorier
  skills TEXT[], -- array av relaterade kompetenser
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  format TEXT CHECK (format IN ('video', 'text', 'interactive', 'mixed')),
  rating_average DECIMAL(2,1),
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Användares kursaktivitet
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('saved', 'started', 'completed', 'abandoned')),
  progress_percent INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  added_to_cv BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(user_id, course_id)
);

-- Kursrekommendationer (AI-genererade)
CREATE TABLE course_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  reason TEXT, -- Varför rekommenderas denna kurs
  source TEXT, -- 'ai_cv_analysis', 'skill_gap', 'similar_users', etc.
  feedback TEXT CHECK (feedback IN ('accepted', 'rejected', null)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Konsulent-rekommendationer till deltagare
CREATE TABLE consultant_course_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  message TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kurskategorier
CREATE TABLE course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES course_categories(id)
);

-- Indexes för prestanda
CREATE INDEX idx_courses_categories ON courses USING GIN(categories);
CREATE INDEX idx_courses_skills ON courses USING GIN(skills);
CREATE INDEX idx_courses_provider ON courses(provider);
CREATE INDEX idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_status ON user_courses(user_id, status);
```

---

## Bilaga: API-specifikation

### Endpoints

```typescript
// GET /api/courses - Lista kurser
interface GetCoursesRequest {
  search?: string;
  categories?: string[];
  skills?: string[];
  priceType?: 'free' | 'paid' | 'all';
  duration?: 'short' | 'medium' | 'long' | 'all'; // <30min, 30-120min, >120min
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  energyLevel?: 'low' | 'medium' | 'high';
  sortBy?: 'relevance' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

// GET /api/courses/:id - Enskild kurs
// POST /api/courses/:id/save - Spara kurs
// POST /api/courses/:id/start - Markera som påbörjad
// POST /api/courses/:id/progress - Uppdatera progress
// GET /api/courses/recommendations - AI-rekommendationer
// GET /api/user/courses - Användarens kurser
// GET /api/consultant/participants/courses - Konsulent-vy
```

---

## Beslut att fatta

1. **Ska vi ha en egen videospelare eller alltid länka externt?**
   - Rekommendation: Extern länk för MVP, embedded för YouTube i Fas 2

2. **Hur kuraterar vi kurser initialt?**
   - Rekommendation: Manuell kuratering av 50 kurser för MVP

3. **Ska vi prioritera svenska eller engelska kurser?**
   - Rekommendation: Svenska först om tillgängligt, annars engelska märkt tydligt

4. **Vilken AI ska driva rekommendationer?**
   - Rekommendation: OpenAI GPT-4 för analys, vår egen logik för matching

---

*Dokument skapat: 2026-03-09*  
*Senast uppdaterat: 2026-03-09*  
*Version: 1.0*
