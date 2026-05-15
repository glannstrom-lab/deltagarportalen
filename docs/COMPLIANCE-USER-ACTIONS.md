# Compliance — vad DU behöver göra

**Datum:** 2026-05-15 (uppdaterad efter implementation)
**Bakgrund:** Se `docs/COMPLIANCE-AUDIT-2026-05-15.md` för full audit.

## Status — vad är klart i kod

✅ **Implementerat 2026-05-15 (commits fbb49c9..489d633):**
- Vercel functions flyttade till `fra1` (Frankfurt)
- AI Act Art 50-märkning: AIBadge + AIGeneratedWatermark, på AI-coach + brev
- Retention cron-SQL (`supabase/migrations/20260515_retention_cron.sql`) — kräver pg_cron-extension aktiverad i Supabase
- Cascade Vercel Blob i `delete-account` edge function
- DPA-länkar i Privacy.tsx (Supabase, Vercel, OpenRouter, Sentry, LinkedIn, Google)
- ToS uppdaterad: AI som vägledning, screening-förbud, wellness ej vård
- Settings AI-consent-text uppdaterad för Art 21 GDPR + korrekt OpenRouter-referens
- Privacy.tsx "automated"-sektion korrigerad (tidigare felaktigt "inga automatiska beslut")
- Tillgänglighetsredogörelse på `/tillganglighet`
- 7 compliance-dokument i `docs/` (audit, DPIA, Art 30, AI Act-klassificering, retention, IR, hosting)

🟡 **Implementerat men kräver manuell aktivering:**
- pg_cron extension i Supabase dashboard (Database → Extensions → pg_cron)
- Sedan körs migrationen automatiskt och cron-jobben aktiveras

---

## 🔴 KRITISKT — denna vecka

### 1. Verifiera Vercel Blob-region (15 min)
**Var:** Vercel-dashboard → Project → Storage → Blob → klicka på storen → Settings → Region.

**Kontroll:** Ska vara "Europe (Frankfurt)" eller "Europe (Ireland)".

**Om USA:**
1. Skapa ny Blob store: Storage → Create → Blob → Region: Europe (Frankfurt)
2. Kopiera nya `BLOB_READ_WRITE_TOKEN`
3. Lägg in i Vercel project env-variables (Production + Preview)
4. Migrera filer (jag kan skriva script om du behöver — det är snabbt)
5. Radera gamla storen

### 2. Verifiera OpenRouter DPF-status + signera DPA (1h)
**Var:**
- Gå till <https://openrouter.ai/terms> och leta efter "Data Processing Agreement"
- Verifiera om OpenRouter är listade på <https://www.dataprivacyframework.gov/list> (sök "OpenRouter")

**Om DPF-certifierade:** OK, ingen extra åtgärd.

**Om INTE certifierade:**
- Begär Standard Contractual Clauses (SCC 2021/914) från OpenRouter via support
- Genomför Transfer Impact Assessment (TIA) — IMY har mall: <https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/overforing-till-tredje-land/>
- Dokumentera i `docs/HOSTING-REGIONS.md`

**Om ingen DPA finns alls:** Övergå till alternativ AI-leverantör med EU-routing (kostnadsbeslut behövs).

### 3. Verifiera Verce-plan tillåter regions-config (5 min)
**Var:** Vercel → Settings → General → Plan.

**Kontroll:** "Pro" eller högre. Hobby-planen tillåter inte `regions: ["fra1"]` — då används default-regionen ändå.

**Om Hobby:** Uppgradera till Pro (~20 USD/månad) eller acceptera att funktioner körs i USA tills uppgradering.

---

## 🟠 INOM 2 VECKOR — formellt nödvändigt

### 4. Komplettera DPIA med företagsspecifik info (2-4h)
**Fil:** `docs/DPIA-PORTAL.md`

Fyll i:
- [ ] Personuppgiftsansvarig — företagsnamn + organisationsnummer
- [ ] DPO — namn + kontaktuppgifter (eller dokumentera varför inte krävs, se #6)
- [ ] Estimat antal registrerade
- [ ] Godkänn formellt (signatur + datum)

### 5. Komplettera Art 30-register med företagsspecifik info (1h)
**Fil:** `docs/GDPR-ART30-REGISTER.md`

Fyll i:
- [ ] Personuppgiftsansvarig — namn + org.nr
- [ ] Verifiera retention-tider (ändra om er rättsliga grund kräver annat)
- [ ] Verifiera DPA-status med varje biträde

### 6. Beslut om DPO (Dataskyddsombud) (1 dag)
**Krav:** GDPR Art 37 — krävs vid storskalig behandling av Art 9-uppgifter.

**Vår situation:** Hälsodata för sårbar målgrupp = sannolikt "storskalig" enligt IMY:s tolkning.

**Två alternativ:**
- **A) Utse DPO formellt:** Anställd eller extern konsult. Anmäl till IMY via blankett: <https://www.imy.se/verksamhet/dataskydd/anmal-dataskyddsombud/>. Kostar ingenting hos IMY. Extern DPO ~5-15k SEK/månad.
- **B) Dokumentera varför inte krävs:** Skriv juridisk bedömning som visar att vi inte är "storskaliga" än. Risk: IMY kan ifrågasätta vid utredning.

**Rekommendation:** Utse DPO. Ger trovärdighet mot kunder/finansiärer också.

### 7. Konsultera AI-jurist för Annex III-gränsfall (2-4h möte)
**Fil:** `docs/AI-ACT-CLASSIFICATION.md` — se sektionen "Detaljerad analys av gränsfall".

**Specifika frågor till jurist:**
- Är `cv-analysis` HÖGRISK när användaren själv kör det mot ett jobb hen vill söka?
- Är `kompetensgap` + `learning-analyze-gap` HÖGRISK om resultatet är synligt för konsulent?
- Är RIASEC-baserad jobbrekommendation profilering enligt Art 22 GDPR?
- Behöver vi FRIA (Art 27 AI Act) om vi blir leverantör till Arbetsförmedlingen?

**Förslag på jurist:** Sök "AI-juridik" eller "GDPR-jurist" i Sverige. Kostnad: ~3-5k SEK/h, total kanske 15-30k SEK för en första klassificering.

---

## 🟡 INOM 1-2 MÅNADER — viktigt men inte deadline

### 8. WCAG 2.1 AA-audit (1-2 veckor)
**Två alternativ:**
- **A) Egen audit:** Använd <https://www.deque.com/axe/> (gratis browser-extension). Kör på topp-15 sidor. Åtgärda kritiska. Ta 1-2 dagar.
- **B) Extern audit:** Funka.com, Begripsam, Tillgänglighetsbyrån. Kostar 30-80k SEK men ger formell rapport som duger för EAA.

**Rekommendation:** B först (en gång), A löpande.

### 9. Boka pen-test (årlig, 1 vecka av leverantör)
**Leverantörer i Sverige:** TrueSec, Sentor, Defendable, Cure53.
**Kostnad:** 80-150k SEK för en initial extern pen-test.
**Frekvens:** En gång per år rekommenderat (krävs av många upphandlingar och avtal).

### 10. Bias-test av AI-rekommendationer (1 vecka första gången)
**Vad:** Skapa testdataset med olika ålder, kön, namn (etniskt varierat) och köra genom kompetensanalys + intresseguide. Mät om vissa grupper systematiskt får sämre rekommendationer.

**Kan göras:**
- Internt om någon har dataanalys-bakgrund
- Externt: <https://www.algorithmaudit.eu/> eller <https://hugging-face-bias-tools/>

### 11. Signera DPA:er med alla biträden (totalt 1 dag)
**Lista att verifiera signering:**
- [ ] Supabase: <https://supabase.com/legal/dpa>
- [ ] Vercel: <https://vercel.com/legal/dpa> (auto-aktiverat på Pro+)
- [ ] OpenRouter: kontakta support
- [ ] Sentry: <https://sentry.io/legal/dpa/>
- [ ] LinkedIn: del av OAuth-villkor
- [ ] Google: del av OAuth-villkor + Workspace-DPA om används

### 12. Användarvillkor — uppdatera ToS (3-4h)
**Vad:** Lägg till klausul i användarvillkoren:
- "Tjänsten får inte användas av arbetsgivare/rekryterare för att utvärdera externa kandidater"
- "AI-rekommendationer är vägledning, inte beslut"
- "Vi är inte vårdgivare — wellness-modulen ersätter inte hälso- och sjukvård"

Kan jurist hjälpa med, eller använd standardmall + min-anpassning.

---

## 🟢 PÅGÅENDE / STRATEGISKT

### 13. Förbered ev. ISO 27001-certifiering
**När:** När ni börjar sälja till offentlig sektor eller större företag.
**Kostnad:** 100-300k SEK initial + årlig förnyelse.
**Värde:** Öppnar offentliga upphandlingar.

### 14. Övervaka regulatoriska deadlines
- **2 aug 2026:** AI Act Art 50 (transparens-märkning) + Annex III högrisk-systems-krav
- **NIS2:** Sverige implementerade 15 jan 2026 — gäller troligen inte oss men följ utvecklingen
- **EUDI Wallet:** EU Digital Identity — kan påverka inloggning från 2026/2027

### 15. Etisk granskning med användarrepresentanter
**Vad:** Bjud in NPF-organisation (Attention, RBU, Riksförbundet HjärtLung), facklig representant, AF-konsulent. Visa portalen, samla feedback.
**Värde:** Minskar bias-risk, ger marknadsföringsmaterial, förbättrar UX.

---

## SAMMANFATTNING — minsta-möjliga-väg till compliance

Om du bara har **1 dag**:
1. Verifiera Vercel Blob-region (#1)
2. Verifiera OpenRouter DPF (#2)
3. Komplettera DPIA + Art 30-register med ditt företagsnamn (#4 + #5)

Om du har **1 vecka**:
+ Punkt #6 (DPO-beslut), #7 (konsultera jurist), #11 (DPA-signering)

Om du har **1 månad**:
+ Punkt #8 (WCAG-audit), #12 (uppdatera ToS), #10 (bias-test)

Om du har **1 kvartal**:
+ Punkt #9 (pen-test), #13 (ISO 27001-förberedelse), #15 (etisk granskning)

---

## Kostnads-estimat

| Åtgärd | Kostnad |
|---|---|
| Verifieringar (#1, #2, #3) | 0 SEK |
| Vercel Pro (om uppgradering behövs) | ~240 USD/år |
| AI-jurist (#7) | 15-30k SEK |
| DPO extern (#6, om val A) | 60-180k SEK/år |
| WCAG audit extern (#8B) | 30-80k SEK |
| Pen-test (#9) | 80-150k SEK/år |
| ISO 27001 (#13) | 100-300k SEK initial |
| **Minimum för compliant idag** | **~30-50k SEK + 240 USD** |
| **Full compliance + audit-rapport** | **~250-400k SEK** |

---

## Frågor jag kan svara på direkt

Jag kan när som helst:
- Skriva script för att migrera Vercel Blob-filer till EU-store
- Implementera retention-cron-jobs (sektion #14 i `RETENTION-POLICY.md`)
- Bygga AI Act Art 50-märkning i UI (badge på AI-coach + watermark på AI-output)
- Skapa Settings-toggle för "stäng av AI-funktioner"
- Skapa Marketing-consent-UI
- Uppdatera Privacy.tsx med korrekt språk om profilering
- Bygga export-/delete-funktioner som även rensar Vercel Blob och Sentry-events

Säg till vilket du vill jag tar.
