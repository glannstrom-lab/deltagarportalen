# Data Protection Impact Assessment (DPIA) — Deltagarportalen

**Lagkrav:** GDPR Art 35 + IMY:s vägledning om konsekvensbedömning.
**Datum:** 2026-05-15
**Status:** Utkast — kräver formellt godkännande av personuppgiftsansvarig + ev. konsultation med IMY (Art 36) om hög residualrisk.

---

## Sammanfattning

| Aspekt | Bedömning |
|---|---|
| Personuppgiftsansvarig | jobin.se / [företagsnamn — fyll i] |
| Personuppgiftsbiträden | Supabase Inc., Vercel Inc., OpenRouter Inc., Functional Software Inc. (Sentry) |
| Behandlingens namn | Deltagarportalen — AI-driven jobbsökarportal för långtidsarbetslösa |
| Geografisk omfattning | Sverige (primärt) |
| Antal registrerade (estimat) | 1000-10000 första året, kan skala till 100k+ |
| Behandlingstyper | Profilering, AI-rekommendationer, hälsodata, känsliga personuppgifter |
| Sannolikhet för hög risk | **HÖG** — flera trigger-faktorer |
| DPIA-skyldighet | **JA** (obligatorisk) |
| Krav på IMY-samråd (Art 36) | **NEJ** efter åtgärder, **JA** före åtgärder |

---

## 1. Beskrivning av behandlingen

### 1.1 Ändamål
Hjälpa arbetssökande (särskilt långtidsarbetslösa med fysiska/psykologiska utmaningar) att:
- Skapa CV och personliga brev
- Hitta jobb som matchar deras profil
- Träna inför intervjuer
- Få stöd från arbetskonsulenter
- Reflektera över mående/energi och kognitiva utmaningar

### 1.2 Behandlade kategorier av personuppgifter

| Kategori | Exempel | Källa |
|---|---|---|
| Identitet | Namn, email, telefon, profilbild | Användaren själv |
| Demografi | Ålder, ort, språk, utbildningsnivå | Användaren |
| Yrkesliv | CV, arbetshistorik, kompetenser, kvalifikationer | Användaren |
| **Hälsodata (Art 9)** | Energinivå, mående, kognitiva utmaningar, anpassningsbehov | Användaren — separate consent (`HealthConsentGate`) |
| **Wellness (Art 9)** | Mood-loggar, dagboksinlägg, gratitude-listor | Användaren — separate consent (`WellnessConsentGate`) |
| Intressen | RIASEC-resultat, yrkesintressen, drömjobb | Användaren |
| Beteende | Inloggningstider, klick, AI-promptar | Automatiskt loggat |
| Konsulentkoppling | Vilken konsulent som är tilldelad | Konsulent eller AF |

### 1.3 Rättslig grund per behandling

| Behandling | Rättslig grund | Hänvisning |
|---|---|---|
| Konto-skapande och kärnfunktioner | Avtal (Art 6.1.b) | Användaren behöver konto för att använda portalen |
| AI-funktioner | Samtycke (Art 6.1.a + 9.2.a för Art 9) | Separate gates innan användning |
| Hälsodata (energy, mood) | Uttryckligt samtycke (Art 9.2.a) | `HealthConsentGate`, `WellnessConsentGate` |
| Konsulent-datadelning | Samtycke (Art 6.1.a) — granulärt per kategori | `participant_data_sharing`-tabell |
| Säkerhetsloggar (Sentry) | Berättigat intresse (Art 6.1.f) — efter cookie-consent | Intresseavvägning bifogad |
| Analytics | Samtycke (Art 6.1.a) | Cookie-banner |
| Email-notiser | Avtal + samtycke | Användaren slår på per notistyp |
| Marknadsföring | Samtycke (Art 6.1.a) | `marketing_consent_at` — UI saknas idag (gap) |

### 1.4 Mottagare av personuppgifter

| Mottagare | Roll | Land | Rättslig grund för överföring |
|---|---|---|---|
| Användaren själv | Registrerad | EU | — |
| Tilldelad konsulent | Auktoriserad användare med begränsad åtkomst | EU | Avtal + samtycke |
| Supabase Inc. | Personuppgiftsbiträde — DB, Auth | EU (Irland) | Art 28 DPA, EU-region |
| Vercel Inc. | Personuppgiftsbiträde — hosting, AI-functions | EU (Frankfurt fra1 från 2026-05-15) | Art 28 DPA, EU-region |
| Vercel Blob | Filhosting | **Verifieras** — EU eller USA | Art 28 DPA + SCC om USA |
| OpenRouter Inc. | Personuppgiftsbiträde — AI inferens | **USA** | Art 28 DPA + SCC + TIA — behöver verifieras |
| Sentry (Functional Software) | Personuppgiftsbiträde — error tracking | Multi-region | Lazy-loadad bakom consent (E9). EU-instans rekommenderad |
| Arbetsförmedlingen API | Mottagare av sökning | Sverige | Public API — inga persondata utgående |
| Bolagsverket API | Mottagare av sökning | Sverige | Public API — inga persondata utgående |
| Google Calendar | Mottagare av kalenderhändelser | USA | OAuth, opt-in, separate consent |
| LinkedIn | Mottagare av profilimport-data | USA | OAuth, opt-in, separate consent |

### 1.5 Gallringstider (retention)

| Datatyp | Retention | Motivering |
|---|---|---|
| Aktivt konto | Tills användaren raderar | Avtal |
| Inaktivt konto | Varning efter 18 mån, radering efter 24 mån | Storage limitation (Art 5.1.e) |
| AI-promptar (`ai_usage_logs`) | 90 dagar | Säkerhets-/missbruksanalys |
| Sentry-events | 90 dagar | Vendor default |
| Audit-loggar (`consent_history`, `data_sharing_audit`) | 5 år | Accountability (Art 5.2) |
| Uppladdade bilder | Tills användaren tar bort | Avtal |
| Dagbok/Mood-loggar | Tills användaren raderar | Avtal |
| Email-notiser i kö | 30 dagar | Driftsändamål |

**Gap:** Ingen automatisk gallring implementerad. Action: cron-job i Supabase för 90-dagars `ai_usage_logs`-rotation.

---

## 2. Nödvändighet och proportionalitet

### 2.1 Är behandlingen nödvändig?
Ja — portalens kärnändamål kräver behandling. Utan CV-byggande, hälsodata för anpassning, och AI-vägledning kan inte tjänsten levereras.

### 2.2 Dataminimering
- AI-funktioner får bara den data som behövs (t.ex. personligt brev får inte hälsodata)
- Konsulent ser bara deltagare hen är kopplad till (RLS)
- Sentry får bara `user.id`, inte email
- Frontend skickar pseudonymiserat där möjligt

### 2.3 Korrekthet
- Användaren kan när som helst rätta egna uppgifter (Settings)
- AI-genererad output presenteras som "förslag" — användaren godkänner innan användning

### 2.4 Lagringsbegränsning
Se 1.5. **Gap att åtgärda:** automatisk gallring.

---

## 3. Risker för registrerades rättigheter och friheter

### 3.1 Identifierade risker

| Risk | Sannolikhet | Konsekvens | Riskpoäng |
|---|---|---|---|
| **R1:** Hälsodata exponeras vid breach | Låg | Mycket allvarlig | **HÖG** |
| **R2:** AI-rekommendation styr individ mot fel jobb | Medel | Allvarlig | **MEDEL** |
| **R3:** Algoritmisk diskriminering (bias) | Medel | Mycket allvarlig | **HÖG** |
| **R4:** Konsulent missbrukar tillgång till deltagardata | Låg | Allvarlig | **MEDEL** |
| **R5:** Tredjelandsöverföring (OpenRouter USA) | Hög | Medel | **MEDEL** |
| **R6:** Användaren förstår inte AI-användning | Hög | Medel | **MEDEL** |
| **R7:** Profilering utan möjlighet att invända | Medel | Medel | **MEDEL** |
| **R8:** Otillräcklig tillgänglighet (WCAG-brister) | Hög | Medel | **MEDEL** |
| **R9:** Data-export används av arbetsgivare för screening | Låg | Mycket allvarlig | **MEDEL** |
| **R10:** Sekundär användning (modellträning hos OpenRouter) | Låg | Allvarlig | **MEDEL** |

### 3.2 Åtgärder för att minska risker

| Risk | Åtgärd | Implementation |
|---|---|---|
| R1 | RLS, AES-256 at rest, TLS, separate consent | ✅ Implementerat |
| R2 | Transparens "AI är vägledning", möjlighet att invända | 🟡 UI-text bra, opt-out saknas |
| R3 | Bias-test vid modelländring + årligen | ❌ Att etablera |
| R4 | `data_sharing_audit`, granulärt samtycke per kategori | ✅ Implementerat |
| R5 | Region fra1 + verifiera OpenRouter DPF + SCC + TIA | 🟡 Fra1 klar, OpenRouter att verifiera |
| R6 | Privacy-sida, AI-policy, AI-disclosure i UI | 🟡 Sidor finns, AI Act Art 50-märkning saknas |
| R7 | Settings-toggle "AI-funktioner PÅ/AV" | ❌ Att implementera |
| R8 | WCAG 2.1 AA-audit + tillgänglighetsredogörelse | 🟡 Delvis |
| R9 | ToS-förbud, ingen bulk-API | ✅ Ingen bulk-API; ToS uppdateras |
| R10 | OpenRouter-villkor förbjuder modellträning | 🟡 Verifieras med OpenRouter |

---

## 4. Residualrisk efter åtgärder

Efter implementation av samtliga åtgärder i tabell 3.2:

| Risk | Residualrisk |
|---|---|
| R1, R4 | Låg |
| R2, R6, R7, R8 | Låg |
| R3 | Medel (kvarstår tills första bias-test är klar) |
| R5 | Låg–Medel (USA-överföring elimineras inte helt) |
| R9, R10 | Låg |

**Total residualrisk:** **MEDEL → LÅG** efter implementation.

**Behov av IMY-samråd (Art 36):** Kan undvikas om alla åtgärder implementeras inom 90 dagar. Om implementationen drar ut på tiden eller om jurist bedömer att bias-risk inte kan reduceras till acceptabel nivå utan validering — då bör IMY-samråd genomföras.

---

## 5. Övervakning och uppföljning

- **DPIA-omprövning** vid varje större ny funktion eller modelländring (minimum årligen).
- **Bias-test** av AI-rekommendationer vid varje deployment av ny modell.
- **Incident-loggning** med 72h-anmälan till IMY enligt Art 33.
- **DPO** (om utsedd) granskar månadsvis.
- **Användarfeedback** via "Rapportera ett problem" i UI — kanaliseras till DPO.

---

## 6. Slutsats

Behandlingen är **godtagbar förutsatt att åtgärderna i sektion 3.2 implementeras inom 90 dagar**. Residualrisken är efter åtgärd LÅG-MEDEL.

Inga åtgärder kan eliminera all risk — sårbar målgrupp + AI + hälsodata utgör inherent risk. Vår strategi: minimera, vara transparent, ge användaren maximal kontroll, dokumentera.

**Godkänt av:** _____________ (personuppgiftsansvarig)
**Datum:** _____________
**Nästa revision:** 2027-05-15 eller vid större förändring.

---

## Bilaga A: Underlag

- `docs/COMPLIANCE-AUDIT-2026-05-15.md` — grundlig audit
- `docs/AI-ACT-CLASSIFICATION.md` — klassificering per AI-funktion
- `docs/RLS_VERIFICATION.md` — RLS-policies
- `docs/HOSTING-REGIONS.md` — region-policy
- `client/src/pages/Privacy.tsx` — integritetspolicy
- `client/src/pages/AiPolicy.tsx` — AI-policy
- Migrationerna `20260327100000_user_consent.sql`, `20260328100000_health_data_consent.sql`, `20260327110000_delete_account.sql`
