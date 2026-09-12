# Plan: Steg till arbete (STA) — sidor för deltagare och konsulent

**Skapad:** 2026-05-12
**Status:** Förslag — väntar på godkännande innan implementation
**Mockuper:** [`sta-deltagare-sketch.html`](../sta-deltagare-sketch.html), [`sta-konsulent-sketch.html`](../sta-konsulent-sketch.html)
**Källmaterial:** `sta/` (4 Beskrivning-dokument + 428 underlagsfiler)

---

## 1. Vad är "Steg till arbete"?

STA är en Arbetsförmedlingstjänst i **fyra sekventiella delar**:

| Del | Namn | Tid | Syfte |
|-----|------|-----|-------|
| 1 | Inledande kartläggning | 3 veckor | Lära känna deltagarens resurser, behov, fokusyrke |
| 2 | Kartlägga resurser och stödbehov | 5 veckor | Arbetsliknande aktiviteter i tillrättalagd miljö (5 dgr × 8 tim) |
| 3 | Stärka och utveckla | Max 6 mån | Karriärvägledning + arbetsprövning på riktig arbetsplats |
| 4 | Hitta arbetsplats | Max 6 mån | Introducerande arbetsprövning inför anställning |

Genomgående element:
- **Skattningar** med arbetsterapeutiska instrument: DOA, WRI, MOHOST (Del 1), AWP, AWC, MOHOST (Del 2), AWC/AWP/DOA/MOHOST (Del 3–4)
- **Dokumentation** till AF: Initial planering (början av Del 1), Delredovisning (slut av varje del), Slutredovisning (Del 3)
- **Aktiviteter:** dagliga arbetsslingor (Del 1 har 14 dagar med körscheman), arbetsstationer (Del 2), arbetsprövning (Del 3–4)
- **Förstärkt språkstöd/kommunikationstöd** vid behov (arabiska, somaliska, tigrinja, dari, pashtu)

---

## 2. Designprinciper

### Deltagar-sidan: coachande, inte byråkratisk
Deltagaren ska aldrig se "AWP-skattning pågående". Hen ska se "Just nu lär vi känna dina styrkor." Instrumentnamn, AF-blanketter och leverantörsterminologi är **dolda** från deltagarvyn.

Tonen följer DESIGN.md §2 Voice & Tone:
- "Just nu är du i Del 1 — Lära känna dig" (inte "Pågående aktivitet: Kartläggningssamtal")
- "Du har gjort 8 av 14 dagar" (inte "Aktivitetsstatus: 57%")
- "Här är veckans plan" (inte "Schemavy")

### Konsulent-sidan: administrativ förstärkare
Konsulenten är experten — sidan ska minimera mängden manuell input genom:
- **Auto-genererade utkast** för Initial planering, Delredovisning, Slutredovisning baserat på deltagarens loggade aktiviteter, skattningar och anteckningar
- **AI-summering** av veckan per deltagare ("Anna har gjort dag 1–7. Hon har reflekterat över sömn och stress. Inga frånvarodagar.")
- **Deadline-spårning**: alla AF-tidsfrister i en vy, med röd/gul/grön status
- **Bulk-handlingar**: närvarorapportering, schemautdelning, skattningsuppmaning
- **Skattningsformulär inbyggda** med snabbval och förifyllning från tidigare delar (MOHOST-värden från Del 1 → jämförelseunderlag i Del 2)

### Hub-domän
Mintgrön/`action` — STA är en huvudsaklig dashboard-tjänst, inte coachning (rosa) eller välmående (lavendel). Konsulentens vy använder samma domän för konsekvens.

---

## 3. Informationsarkitektur

### 3.1 Deltagar-sidan (`/steg-till-arbete`)

```
┌─ Hero: "Din resa genom Steg till arbete"
│  ├─ Visuell tidslinje över de 4 delarna (var är jag nu?)
│  ├─ "Du är i Del 1 — dag 8 av 21" (kontextuell statustext)
│  └─ Nästa konkret aktivitet ("Idag 13:00 — Stress och sömn (Dag 7)")
│
├─ Översiktsflik (default)
│  ├─ Veckans plan (5-dagars schema)
│  ├─ Mina styrkor (växer fram från kartläggningen)
│  ├─ Reflektion (kort dagboksinlägg, frivillig)
│  ├─ Min konsulent (snabbkontakt)
│  └─ Resurser att läsa när du vill (kompendier, körscheman som artiklar)
│
├─ Del 1 — Lära känna dig (3 veckor)
│  ├─ Startsamtal (datum, dina anpassningsbehov)
│  ├─ Kartläggning (DOA-självskattning som vänlig dialog, inte tabell)
│  ├─ Kompetenser och intressen (input från Interest Guide)
│  ├─ Dagsslinga 14 dagar (artikelvy per dag med övning + reflektion)
│  └─ Hälsoaktiviteter (frivilliga övningar — sömn, stress, motivation)
│
├─ Del 2 — Prova på (5 veckor)
│  ├─ Mina arbetsstationer (administration, kundmottagning, lager, produktion)
│  ├─ Vad jag har provat (dagvis logg)
│  ├─ Mina styrkor som syns (uppmuntrande text från observationer)
│  └─ Mina reflektioner (vad var roligt? svårt? överraskande?)
│
├─ Del 3 — Stärka och utveckla (max 6 mån)
│  ├─ Mitt yrkesområde (valt under karriärvägledningen)
│  ├─ Min arbetsprövning (företag, kontaktperson, mål)
│  ├─ Arbetsdagbok (daglig kort reflektion)
│  ├─ CV och intervjuträning (genvägar till befintliga verktyg)
│  └─ Studiebesök (planerade/genomförda)
│
└─ Del 4 — Hitta arbetsplats (max 6 mån)
   ├─ Min arbetsplats (introducerande arbetsprövning)
   ├─ Min plan (Place then Train / Supported Employment)
   ├─ Uppföljningar (när vi pratats vid)
   └─ Mitt mål: stabil anställning
```

### 3.2 Konsulent-sidan (`/konsulent/steg-till-arbete`)

```
┌─ Översikt: alla deltagare i STA
│  ├─ KPI-rad: Aktiva (X), Tidsfrist denna vecka (Y), Nya skattningar (Z)
│  ├─ Tidslinje per deltagare (visar var alla är) — sorteras efter deadline
│  └─ Akutlista: deadlines inom 7 dagar (initial planering, delredovisning, skattning)
│
├─ Per-deltagare-vy (öppnas från lista eller direktlänk)
│  ├─ Header: foto, namn, Del + dagar kvar, fokusyrke, anpassningsbehov, språkstöd
│  ├─ AI-veckosummering (skapas automatiskt — kan kopieras till delredovisning)
│  ├─ Aktivitetslogg (vad deltagaren gjort i portalen denna vecka)
│  ├─ Skattningar (DOA/WRI/MOHOST/AWP/AWC) — status + öppna formulär
│  ├─ Dokument (Initial planering, Delredovisning, Slutredovisning — auto-utkast)
│  ├─ Arbetsprövningsplatser (kopplade företag, AF-godkännande, AWC/AWP)
│  ├─ Frånvaro/Närvaro (med snabbval för dagen)
│  └─ Anteckningar (privata + delade med deltagaren)
│
├─ Skattningar (samlad vy)
│  ├─ Pågående skattningar med procent klart
│  ├─ Filtrering per instrument och deltagare
│  └─ Direktformulär (DOA, WRI, MOHOST, AWP, AWC)
│
├─ Arbetsprövningsplatser (företagsbibliotek)
│  ├─ Tidigare använda företag (med kontaktpersoner, branschdata)
│  ├─ AWC-mall per plats (återanvänd när nya deltagare börjar)
│  └─ Status: anmäld till AF / godkänd / aktiv / avslutad
│
└─ Dokumentbibliotek
   ├─ Mallar (Initial planering, Delredovisning, Slutredovisning, Informativ rapport)
   ├─ AF-inskick (statuslogg)
   └─ Senaste inskickade dokument
```

---

## 4. Datamodell (förslag)

### Nya tabeller
```sql
-- En deltagares tilldelning till STA + var i processen
create table sta_enrollments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references profiles(id) on delete cascade,
  consultant_id uuid references profiles(id),
  current_part smallint not null default 1 check (current_part between 1 and 4),
  started_at date not null,
  part_started_at date not null,
  focus_occupation text,                  -- "fokusyrke" från AF
  language_support text[],                -- ['arabiska','tigrinja']
  communication_support text[],           -- ['bildstöd','lättläst']
  adaptations text,                       -- fritext om anpassningsbehov
  status text not null default 'active'   -- active|paused|completed|cancelled
    check (status in ('active','paused','completed','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tidsstämplade aktiviteter (dagsslinga, arbetsprövning, samtal)
create table sta_activities (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references sta_enrollments(id) on delete cascade,
  part smallint not null check (part between 1 and 4),
  activity_type text not null,            -- 'dagsslinga'|'arbetsstation'|'arbetsprovning'|'samtal'|'halsoaktivitet'
  activity_key text,                      -- 'dag-7-somn' | 'station-administration'
  scheduled_for date,
  completed_at timestamptz,
  participant_reflection text,
  consultant_note text,
  metadata jsonb default '{}'             -- attendance, hours, etc.
);

-- Skattningar med instrument
create table sta_assessments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references sta_enrollments(id) on delete cascade,
  part smallint not null check (part between 1 and 4),
  instrument text not null
    check (instrument in ('DOA','WRI','MOHOST','AWP','AWC')),
  performed_by uuid references profiles(id),  -- arbetsterapeut
  performed_at date,
  status text not null default 'draft'
    check (status in ('draft','complete','submitted_to_af')),
  scores jsonb default '{}',              -- instrumentspecifik datastruktur
  summary text,                           -- "Sammanfattande kommentar"
  workplace_id uuid references sta_workplaces(id),  -- för AWC/AWP i del 3-4
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Företag där deltagaren arbetsprövar (Del 3-4)
create table sta_workplaces (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references sta_enrollments(id) on delete cascade,
  company_name text not null,
  org_number text,
  contact_name text,
  contact_email text,
  contact_phone text,
  start_date date,
  end_date date,
  af_submission_status text default 'pending'
    check (af_submission_status in ('pending','submitted','approved','rejected')),
  af_submitted_at timestamptz,
  inriktning text                          -- 'aktiverande'|'introducerande'
);

-- Dokument till AF (initial planering, delredovisning, slutredovisning)
create table sta_documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references sta_enrollments(id) on delete cascade,
  doc_type text not null
    check (doc_type in ('initial_planering','delredovisning','slutredovisning',
                        'informativ_rapport','information_arbetsprovning')),
  part smallint check (part between 1 and 4),
  content_md text,                        -- auto-genererat utkast
  ai_drafted boolean default false,
  status text not null default 'draft'
    check (status in ('draft','consultant_review','submitted')),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

RLS:
- Deltagare ser bara sin egen rad (via `enrollment_id` → `participant_id = auth.uid()`).
- Konsulent ser rader där `consultant_id = auth.uid()` ELLER där hen är tilldelad konsulent enligt `profiles.consultant_id`.
- Superadmin ser allt.

### Befintliga kopplingar
- `profiles.program = 'steg_till_arbete'` (redan tillagd i denna milestone) → triggrar visning av sidan.
- `consultant_messages`, `consultant_meetings`, `consultant_goals` återanvänds — STA-sidan blir en *vy* över befintlig konsulentdata, inte ett separat datalager.

---

## 5. Automation: så minimerar vi konsulentens manuella input

| Konsulent-uppgift | Manuell (idag) | Automatiserad (med STA-sidan) |
|---|---|---|
| Initial planering | Skriva i Word, mejla till AF | Auto-utkast från startsamtal-anteckning + DOA-självskattning; konsulent reviderar och klickar "skicka" |
| Veckorapport per deltagare | Minnas + skriva | AI-summering av aktivitetslogg + reflektioner; copy-paste till delredovisning |
| Delredovisning | Skriva från scratch | AI-utkast med deltagarens aktiviteter, skattningar, fokusyrke, anpassningsbehov; konsulent finputsar |
| Skattningar (DOA/MOHOST/etc.) | Pappersformulär eller separata system | Inbyggt formulär; tidigare delars värden förifyllda som jämförelseunderlag |
| Arbetsprövningsplats-anmälan | E-post + bilaga | Formulär med AF-mall, e-post genereras med ett klick |
| Närvarorapport | Manuell per deltagare | Bulk-vy: bocka av dagens närvarande på 30 sek |
| Påminnelser om deadlines | Konsulenten håller koll själv | Akutlista + e-post-notifiering 7/3/1 dagar innan |
| Schemautdelning | Pdf via e-post | Genereras från `sta_activities` per deltagare, delningsbar länk |

**Realistisk effektsänkning:** Konsulenten är expert. Vi tar bort transkribering, omformulering och deadline-bevakning — inte bedömningsarbetet. AI-utkast måste **alltid** granskas och redigeras av konsulent innan inskick till AF.

---

## 6. AI-integration

Använd `client/api/ai.js` (default backend). Nya AI-funktioner att lägga till:

- `sta-veckosummering` — input: deltagarens senaste 7 dagars aktiviteter och reflektioner. Output: 5–8 meningar för konsulenten.
- `sta-delredovisning-utkast` — input: alla aktiviteter, skattningar, anpassningar för aktuell del. Output: strukturerat utkast som matchar AF:s mall.
- `sta-initial-planering-utkast` — input: startsamtalsanteckning + DOA. Output: utkast med fortsatt aktivitetsförslag.
- `sta-reflektionscoach` — input: deltagarens dagliga reflektion. Output: 1–2 uppmuntrande meningar + ev. uppföljningsfråga (visas i deltagarvyn).

Modell: enligt projektregel **openai/gpt-oss-120b** (låst).

---

## 7. Integration med befintlig portal

### Navigation
- Sidan visas **bara** om `profile.program = 'steg_till_arbete'`.
- Hub: ny entry i `navHubs[]` under "Min vardag" (för deltagare) och i konsulentens sidomeny.
- Deltagar-path: `/steg-till-arbete` med tabs `/oversikt`, `/del-1`, `/del-2`, `/del-3`, `/del-4`.
- Konsulent-path: `/konsulent/steg-till-arbete` med flikar `Översikt`, `Deltagare`, `Skattningar`, `Arbetsplatser`, `Dokument`.

### Återanvändning av befintliga verktyg
- **CV-byggare**: länkas in från Del 3/4 (befintlig komponent).
- **Intervjusimulator**: länkas in från Del 3/4.
- **Diary**: deltagarens reflektion sparas också i diary-tabellen → genvägar från STA-sidan in i Diary.
- **Calendar**: STA-aktiviteter speglas till `consultant_meetings`/kalendervy.
- **AI-team**: befintlig agent-chatt görs medveten om aktuell Del → ger kontext-anpassad coachning.

### Routes (App.tsx)
```tsx
{program === 'steg_till_arbete' && (
  <>
    <Route path="/steg-till-arbete/*" element={<STaParticipantPage />} />
    {hasConsultantRole && (
      <Route path="/konsulent/steg-till-arbete/*" element={<STaConsultantPage />} />
    )}
  </>
)}
```

---

## 8. MVP-cut (Fas 1) vs senare faser

### Fas 1 — MVP (2-3 sprintar)
**Mål:** Sidorna är synliga och innehåller statisk content + grundläggande tillstånd.

- [ ] Migration: `sta_enrollments`, `sta_activities` (utan workplaces/documents/assessments)
- [ ] Deltagar-sidan med översikt + alla 4 flikar (statiskt innehåll, ingen interaktivitet)
- [ ] Konsulent-sidan med deltagarlista + per-deltagar-vy (manuell inmatning av Del + datum)
- [ ] Synlighet styrs av `profiles.program`
- [ ] Visning av dagsslinga (Del 1 dag 1-14) som artiklar via `articleData`-mönstret

### Fas 2 — Aktivitetslogg + reflektion (1 sprint)
- [ ] Deltagaren kan markera aktiviteter klara, skriva reflektion
- [ ] Konsulenten ser daglig aktivitetslogg per deltagare
- [ ] Bulk-närvarorapportering

### Fas 3 — Skattningar (2 sprintar)
- [ ] `sta_assessments` + formulär för DOA/WRI/MOHOST
- [ ] Sammanställningsvy för konsulenten
- [ ] Förifyllning från tidigare delars värden

### Fas 4 — Auto-utkast (1 sprint)
- [ ] AI-utkast för delredovisning + initial planering
- [ ] AI-veckosummering
- [ ] PDF-export

### Fas 5 — Arbetsprövningsplatser (1 sprint)
- [ ] `sta_workplaces` + AWC/AWP per plats
- [ ] AF-anmälan med e-postgenerering
- [ ] Företagsbibliotek

### Fas 6 — Skarp integration (1 sprint)
- [ ] AF-inskick via API om sådant öppnas
- [ ] Närvaro speglas i tidsrapport-system
- [ ] Förstärkt språkstöd: översatt UI för deltagaren (arabiska, somaliska, tigrinja, dari, pashtu)

---

## 9. Risker och öppna frågor

| # | Risk / Fråga | Förslag |
|---|---|---|
| 1 | Vem är **arbetsterapeut** vs konsulent i datamodellen? Skattningar ska göras av AT. | Använd `profiles.roles[]` med ny roll `ARBETSTERAPEUT`. Tilldelas via `sta_enrollments`. |
| 2 | AF tar idag emot dokument via mejl/portal — hur sköts inskick? | Fas 1–4 = manuell export (PDF + kopiera-länk). Fas 6 = API om sådant öppnas. |
| 3 | Hur fastställs **fokusyrke**? | Från AF:s anvisning + portal-Interest Guide. Konsulent kan justera. |
| 4 | Vad händer när deltagare **byter konsulent** mitt i en del? | `sta_enrollments.consultant_id` uppdateras; tidigare anteckningar bevaras med ursprungs-författare. |
| 5 | Pause/återanvisning från AF — hur hanteras tidsklockan? | `sta_enrollments.status='paused'` + `part_started_at` rörs ej. UI visar "Pausad sedan X". |
| 6 | Förstärkt språkstöd kräver översatt material | Använd befintlig i18n; deltagarvyn översätts först, AF-mallar förblir på svenska. |
| 7 | Vem äger en deltagares data när tjänsten är slut? | Per GDPR Art. 17 + befintlig DataSharingSettings: deltagaren kan exportera, AF får sin del, leverantören raderar enligt avtalsperiod. |

---

## 10. Nästa steg

1. **Granska denna plan + mockuper** (`sta-deltagare-sketch.html`, `sta-konsulent-sketch.html`).
2. Bestäm **MVP-omfattning** (rekommendation: Fas 1 + Fas 2 i första iterationen).
3. Implementera migration + statiskt innehåll → live för testning med en deltagare och en konsulent.
4. Iterera baserat på riktig användning innan vi bygger Fas 3–6.
