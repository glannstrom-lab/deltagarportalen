# Legal Compliance Audit — Deltagarportalen (jobin.se)

**Datum:** 2026-05-15
**Av:** Auto-genererad audit (kodbasanalys + juridisk research mot svensk + EU-rätt)
**Disclaimer:** Teknisk research, inte juridisk rådgivning. Verifiera tolkningarna med svensk dataskyddsjurist.

---

## TL;DR — Övergripande verdict

> **Vi följer NÄSTAN, men inte fullt ut, svenska och EU-lagar.**
>
> Tekniskt: **A-/B+ (ca 75%)**. Vi har gjort mycket rätt — granulärt samtycke, RLS, audit-loggning, delete-flow, separat hälsodata-gate.
>
> Formellt/dokumentärt: **C+ (ca 50%)**. Vi saknar två obligatoriska dokument (DPIA + Art 30-register), AI Act-klassificering per funktion, och flera DPA-länkar. **EAA-konformitet är försenad** (deadline 28 juni 2025).

**Tre kritiska brister som måste åtgärdas omedelbart:**
1. **DPIA** (Data Protection Impact Assessment) — obligatorisk pga. sårbar målgrupp + hälsodata + AI-profilering. Inte gjord.
2. **Art 30 GDPR-register** över behandlingar — formellt krav, finns inte dokumenterat.
3. **AI Act Annex III-klassificering per AI-funktion** — deadline för transparens-märkning 2 aug 2026, men kompetensanalys/jobbmatchning kan vara *högrisk* från samma datum.

---

## 1. Vad vi följer (✅)

### GDPR — kärnimplementation
- **Granulärt samtycke** (`CookieConsent.tsx`, `AiConsentGate.tsx`, `HealthConsentGate.tsx`, `WellnessConsentGate.tsx`) med separata gates för olika dataändamål. Återkalleligt via UI.
- **Audit-trail** för samtycke (`consent_history`-tabell, migration `20260327100000`) — IP + user agent + tidstämpel.
- **Audit-trail för datadelning** mellan deltagare och konsulent (`data_sharing_audit`, migration `20260328100000`).
- **RLS-policies** på alla tabeller med persondata (`docs/RLS_VERIFICATION.md`).
- **Rätt till tillgång (Art 15)** + **dataportabilitet (Art 20)** via `export_user_data()` RPC, JSON-format (`DeleteAccountSection.tsx:84-115`).
- **Rätt till radering (Art 17)** med 14-dagars grace period via `request_account_deletion()` + `delete-account` edge function. Cascade-delete på `profiles`.
- **Rätt till rättelse (Art 16)** via `userApi.updateProfile()` och Settings-sidan.
- **Privacy notice** (`/privacy`) med 15 sektioner, i18n SE/EN, kontakt `dpo@jobin.se`.
- **AI-policy** (`/ai-policy`) separat dokument.
- **Sentry PII-exklusion** (`sentry.ts:193-211`): bara `user.id`, ej email; auth headers + cookies strippade.

### Säkerhet (Art 32)
- TLS 1.3 i alla led (Supabase, Vercel default).
- Bcrypt-hashing av lösenord (Supabase Auth default).
- JWT med kort livstid + refresh.
- Magic-byte-validering på bilduppladdningar (`upload-image.js`).
- Rate-limiting på 5 endpoints (Supabase RPC `check_rate_limit`).
- Daglig token-cap för AI per användare.
- Service role key bara på edge functions, aldrig i klient.
- Datakryptering at-rest (Supabase + Vercel default AES-256).

### Tillgänglighet (delvis WCAG 2.1 AA)
- ARIA-attribut systematiskt använda.
- Skip-links, focus-trap (`useFocusTrap`).
- Reduced-motion-stöd (testat: `widgets/__tests__/reduced-motion.test.tsx`).
- `calmMode` och `accessibility`-features.
- i18n SE/EN.

### Region / dataöverföring (efter dagens fix)
- Supabase: West EU (Ireland) ✅
- Vercel functions: `fra1` (Frankfurt) ✅ (just fixat)
- Vercel Blob: ⚠️ måste verifieras manuellt
- OpenRouter: USA — behöver SCC + TIA

---

## 2. Vad vi INTE följer (❌)

### KRITISKT — bryter formellt mot lag

#### A. DPIA saknas (GDPR Art 35)
- **Krav:** DPIA är *obligatorisk* när behandling sannolikt medför "hög risk för fysiska personers rättigheter och friheter". IMY:s lista nämner uttryckligen *sårbara grupper* + *AI där risker svåra att bedöma* + *systematisk profilering*.
- **Vår situation:** Långtidsarbetslösa, hälsodata, AI-rekommendationer, automatisk matchning → tre triggers i en.
- **Sanktion:** IMY-tillsynsåtgärd, vite, eventuellt förbud att fortsätta behandlingen.
- **Åtgärd:** Produkt-DPIA + en mini-DPIA per AI-funktion. Mall finns på imy.se.

#### B. Art 30-register saknas
- **Krav:** Skriftligt register över alla behandlingar (kategorier av personuppgifter, ändamål, mottagare, gallring, säkerhetsåtgärder).
- **Vår situation:** Detta finns inte dokumenterat. `docs/RLS_VERIFICATION.md` är kod-perspektiv, inte registerförteckning.
- **Sanktion:** Vid IMY-inspektion: vite, ofta inledande åtgärd vid alla GDPR-utredningar.
- **Åtgärd:** Skapa `docs/GDPR-ART30-REGISTER.md` med tabell per behandling. ~4 timmars arbete.

#### C. AI Act Annex III-klassificering saknas
- **Krav:** Från 2 aug 2026 är AI för "anställning, arbetstagares ledning, urval, tillgång till egenanställning" *högrisk* (Annex III punkt 4). Högrisk = ny stor regulatorisk börda (datakvalitet, bias-test, FRIA, mänsklig övervakning, teknisk dokumentation).
- **Vår situation:** 18 Vercel + 23 Supabase edge AI-funktioner — ingen klassificering. Sannolika högrisk-kandidater:
  - **Kompetensanalys** (poängsätter användarens lämplighet) — sannolikt högrisk
  - **Jobbmatchning/rekommendationer** (rangordnar yrken) — sannolikt högrisk
  - **Intresseguide** (RIASEC-baserad) — gränsfall, lutar mot högrisk
  - **CV-byggare/personligt brev** — hjälpmedel, troligen *inte* högrisk
  - **Intervjusimulator** — träningsverktyg, troligen *inte* högrisk
  - **AI-coach/team-chat** — assistans, kan glida om den ger explicita råd
- **Åtgärd:** Klassificera varje funktion. Dokumentera bedömning. Konsultera jurist på gränsfall.

#### D. AI Act Art 50 transparens-märkning saknas
- **Krav:** Från 2 aug 2026 — ALLA AI-system (även icke-högrisk):
  - Användare ska informeras tydligt när de pratar med AI.
  - AI-genererat innehåll ska märkas (synligt + maskinläsbart).
- **Vår situation:** AI-coach saknar "Du chattar med AI"-märkning på ett otvetydigt sätt. AI-genererade brev/CV-texter saknar metadata-märkning. Privacy.tsx säger "AI är assistans" men inget i UI:t märker outputen.
- **Sanktion:** Upp till 15 MEUR eller 3 % global omsättning.
- **Åtgärd:** Lägg till tydliga AI-badges i AI-team-chat och "AI-genererat — granska innan du skickar"-watermarks på output. ~1 dag.

#### E. EAA (European Accessibility Act) — försenad konformitetsförklaring
- **Krav:** Sedan 28 juni 2025 måste konsumenttjänster (sannolikt vi) följa WCAG 2.1 AA + publicera tillgänglighetsredogörelse.
- **Vår situation:** Vi är 11 månader försenade. WCAG 2.1 AA-implementation är *delvis* gjord men ingen formell konformitetsförklaring eller publicerad tillgänglighetsredogörelse.
- **Sanktion:** Upp till 10 MSEK + tillbakadragande från marknaden.
- **Åtgärd:** Genomför WCAG 2.1 AA-audit (manuell + Axe), åtgärda kritiska brister, publicera tillgänglighetsredogörelse på `/tillganglighet`. ~1 vecka.

### VIKTIGT — bristande dokumentation/processer

#### F. DPA-länkar saknas i Privacy
- **Krav:** Underbiträdesavtal (Art 28) ska finnas med varje processor. Bör listas/länkas i Privacy.
- **Saknas dokumenterat:** OpenRouter, Google Calendar, LinkedIn, Resend (om används), Sentry.
- **Åtgärd:** Lista underbiträden + länk till deras DPA på `/privacy`.

#### G. Tredjelandsöverföring inte komplett dokumenterad
- **Krav:** Schrems II → SCC (Standard Contractual Clauses 2021/914) + TIA (Transfer Impact Assessment) för USA-överföringar.
- **Vår situation:** OpenRouter är USA-baserad. Vi har dokumenterat *att* det finns i `HOSTING-REGIONS.md`, men ingen TIA + ingen verifiering av OpenRouters DPF-status.
- **Åtgärd:** Verifiera om OpenRouter är EU-US Data Privacy Framework-certifierat. Om inte: SCC + TIA.

#### H. Retention policy saknas
- **Krav:** Storage limitation (Art 5.1.e). Måste definiera hur länge data sparas.
- **Vår situation:** Inga dokumenterade gallringstider för: AI-prompts (`ai_usage_logs`), inaktiva konton, uppladdade bilder/CV, dagboksinlägg.
- **Åtgärd:** Definiera retention per datatyp. Implementera automatisk gallring (t.ex. 90 dagar AI-loggar, 24 månader inaktiva konton, tills användaren raderar för dagbok/CV).

#### I. Privacy.tsx innehåller felaktigt påstående
- **Brist:** `Privacy.tsx:215` säger "Inga automatiska beslut" — men kompetensanalys och jobbmatchning gör algoritmiska rekommendationer som påverkar användarens jobbsökarväg. Det är profilering enligt Art 4(4) GDPR.
- **Åtgärd:** Skriv om sektionen till "Vi använder profilering för X — du har rätt att invända (Art 21) eller dra tillbaka samtycke."

#### J. Marknadsförings-samtycke definierat men inte UI:at
- **Brist:** `profiles.marketing_consent_at` finns i schema men ingen UI för att hantera. Risk att email skickas utan samtycke.
- **Åtgärd:** Settings → Notifikationer → "Tillåt nyhetsbrev" toggle.

#### K. Profilering opt-out saknas (Art 21)
- **Brist:** Användare kan dra tillbaka AI-samtycke totalt eller radera kontot — men inte säga "ja till portalen, nej till AI-rekommendationer".
- **Åtgärd:** Settings → Integritet → "AI-funktioner: PÅ/AV" som inte raderar konto.

#### L. DPO-status oklar
- **Krav:** DPO är obligatorisk vid storskalig behandling av Art 9-kategorier (hälsa). IMY tolkar "storskalig" generöst.
- **Vår situation:** Email `dpo@jobin.se` finns på Privacy-sidan, men formellt utsedd DPO som rapporterats till IMY?
- **Åtgärd:** Antingen utse DPO formellt och anmäl till IMY (~ kostar inget), eller dokumentera bedömning av varför inte krävs.

#### M. Bias-testning saknas
- **Krav:** Diskrimineringslagen + AI Act kräver att AI-rekommendationer inte systematiskt missgynnar grupper (kön, etnicitet, ålder, funktionsförmåga).
- **Vår situation:** Ingen dokumenterad bias-test av kompetensanalys eller jobbmatchning.
- **Åtgärd:** Strukturerad bias-test vid varje modelländring + årligen. Dokumentera resultat.

### NICE-TO-HAVE

- ISO 27001-certifiering (öppnar offentliga upphandlingar)
- Vulnerability Disclosure Policy
- Algoritmregister/AI-register publikt
- Etisk granskning med användarrepresentanter (NPF-organisationer, fackförbund)

---

## 3. Vad gäller per lag — sammanfattning

| Lag | Status | Kritiska brister |
|---|---|---|
| **GDPR** | 75% efterlevnad | DPIA, Art 30-register, retention-policy, marketing-UI |
| **Dataskyddslagen (2018:218)** | 90% | Personnummer-motivering bör dokumenteras om vi samlar in PNR |
| **AI Act (2024/1689)** | 30% (färsk lag) | Annex III-klassificering, Art 50-märkning (deadline 2 aug 2026) |
| **EAA / Tillgänglighetsdirektivet** | 60% | Konformitetsförklaring + redogörelse försenad sedan 28 juni 2025 |
| **e-Privacy / LEK** | 90% | Verifiera "Avvisa" och "Acceptera" på samma nivå i cookie-banner |
| **Diskrimineringslagen** | 70% | Bias-test av AI saknas |
| **NIS2** | N/A | Träffar oss inte direkt |
| **DSA** | N/A | Vi sprider inte information publikt |
| **Patientdatalagen** | N/A | Vi bedriver inte vård (men måste tydligt säga det i wellness-sektionen) |

---

## 4. Action plan — prioriterad

### Vecka 1 (kritiskt — formella/lagliga blockers)
1. **Skapa Art 30-register** (`docs/GDPR-ART30-REGISTER.md`) — mall från IMY. ~4h.
2. **Genomför produkt-DPIA** (`docs/DPIA-PORTAL.md`) — IMY-mall. ~1 dag.
3. **Klassificera 18 Vercel + 23 edge AI-funktioner** mot AI Act Annex III. Konsultera jurist på gränsfall (kompetensanalys, jobbmatchning, intresseguide). ~1 dag.
4. **Verifiera OpenRouter DPF-status** + komplettera med SCC + TIA om behövs.
5. **Verifiera Vercel Blob-region** (manuellt i dashboard).

### Vecka 2 (viktiga UI-ändringar)
6. **Fix Privacy.tsx automated-decisions sektion** — säg sanningen om profilering, hänvisa till Art 21-rätten.
7. **Lägg till AI-Act Art 50-märkning** — tydlig "AI" badge i AI-coach + watermark på AI-genererat innehåll. (Senast deadline 2 aug 2026, men gör nu.)
8. **Marketing-consent UI** i Settings.
9. **Profilering opt-out** i Settings (toggle utan att radera konto).
10. **Länka DPA:er** för OpenRouter/Vercel/Supabase/Sentry på Privacy.

### Vecka 3-4 (tillgänglighet)
11. **WCAG 2.1 AA-audit** med Axe + manuell skärmläsartest. Åtgärda kritiska.
12. **Publicera tillgänglighetsredogörelse** på `/tillganglighet`.
13. **EAA-konformitetsförklaring** publicerad.

### Månad 2 (process & retention)
14. **Definiera + implementera retention-policy** (cron job för automatisk gallring).
15. **DPO-beslut** — utse formellt eller dokumentera varför inte.
16. **Bias-test-protokoll** för AI-rekommendationer + första körning.
17. **Säkerhetsincident-plan + 72h IMY-anmälningsrutin** dokumenterad.

### Månad 3+
18. **Pen-test** (årlig). Begär offert från svensk leverantör.
19. **DPIA per högrisk-AI-funktion**.
20. **FRIA** (Fundamental Rights Impact Assessment) om vi levererar till AF/etablering.

---

## 5. Risk om inget görs

| Brist | Risk-nivå | Konsekvens |
|---|---|---|
| DPIA saknas | **HÖG** | IMY kan kräva paus av behandling |
| Art 30-register | **HÖG** | Standardanmärkning vid varje IMY-utredning |
| AI Act Annex III | **HÖG** (från 2 aug 2026) | 35 MEUR / 7 % global omsättning för förbjudna/högrisk-system utan dokumentation |
| AI Act Art 50-märkning | **MEDEL** (från 2 aug 2026) | 15 MEUR / 3 % global omsättning |
| EAA-konformitet | **MEDEL** | 10 MSEK + tillbakadragande från marknaden, juridisk risk för diskriminering |
| OpenRouter SCC+TIA | **MEDEL** | Tredjelandsöverföring kan stoppas (Schrems-typ-incident) |
| Privacy.tsx fel om beslut | **LÅG** | Kan användas mot oss vid IMY-tillsyn (bristande transparens) |
| Bias-test | **LÅG-MEDEL** | DO/IMY-anmälan om systematisk diskriminering upptäcks |

---

## Sammanfattning för stakeholder

> Tekniskt har vi byggt rätt — vi har mer skydd än de flesta jobbsökarportaler. Men formell dokumentation släpar efter. Tre saker måste göras nu: (1) DPIA, (2) Art 30-register, (3) AI Act-klassificering per funktion. Sedan har vi 3 brådskande UI-fixar (AI-märkning, profilering opt-out, Privacy-text). EAA är försenat med 11 månader — högsta prioritet är WCAG-audit och tillgänglighetsredogörelse.
>
> Sannolik tidsåtgång till "fullt EU/SE-compliant": **6-8 veckor fokuserat arbete** plus pågående processer (bias-test årligen, pen-test årligen, DPIA per ny AI-funktion).
>
> Den största enskilda risken är **AI Act 2 aug 2026** — om kompetensanalys/jobbmatchning klassas som högrisk krävs väsentligt mer än vad vi har idag (FRIA, datakvalitetsdokumentation, kontinuerlig övervakning). Konsultera jurist innan dess.

---

## Källor

Kodbasanalys: explorer-agent-rapport (sept 2026 codebase scan).
Juridisk research: WebSearch på IMY, EU-förordningar, Riksdagens lagar (sources i agent-rapport).
Verifierat mot: GDPR 2016/679, AI Act 2024/1689, EAA 2019/882, Dataskyddslagen 2018:218, Diskrimineringslagen 2008:567, LEK 2003:389, Lag 2018:1937, Lag 2023:254 (EAA-implementation).
