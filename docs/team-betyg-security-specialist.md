# Security-specialist — betyg

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | Översikt-hubben | 7 | 8 | 7 | Auth-gated, ingen direkt datablottning i hub-vy |
| H2 | Söka jobb-hubben | 7 | 8 | 7 | Aggregerad data via RLS-skyddade hooks |
| H3 | Karriär-hubben | 7 | 8 | 7 | Inga PII-fält exponerade i hub-summary |
| H4 | Resurser-hubben | 7 | 8 | 7 | Statiskt innehåll, låg risk |
| H5 | Min vardag-hubben | 7 | 7 | 7 | Visar wellness-snippets, RLS täcker user_id |
| D1 | Dashboard översikt | 7 | 7 | 6 | Många widgets, ingen tydlig data-export-info |
| D2 | Mina Quests | 7 | 7 | 7 | Gamification-data, RLS aktiv |
| JS1 | Sök | 6 | 7 | 6 | dangerouslySetInnerHTML m. sanitizeHTMLWithLineBreaks (OK) |
| JS2 | Dagens jobb | 7 | 7 | 7 | AF-data via edge function, ingen lokal PII |
| JS3 | Sparade jobb | 7 | 8 | 7 | saved_jobs RLS verifierad |
| JS4 | Matchningar | 7 | 7 | 6 | AI-matching kan exponera profil i prompt |
| AP1 | Pipeline | 7 | 8 | 7 | applications RLS, user-skoping OK |
| AP2 | Historik | 7 | 8 | 7 | Endast egen data, RLS täcker |
| AP3 | Kalender | 7 | 7 | 6 | Visar arbetsgivar-info, ingen extern delning |
| AP4 | Kontakter | 6 | 6 | 5 | Tredjepartskontakter — GDPR-laglig grund? |
| AP5 | Statistik | 7 | 8 | 7 | Aggregat över egen data |
| CV1 | Skapa CV | 6 | 6 | 5 | AI-prompt interpolerar CV-fält osanerat (MED-001) |
| CV2 | Mina CV | 7 | 8 | 7 | cvs-tabell RLS, consultant-view tydlig |
| CV3 | Anpassa | 6 | 6 | 5 | Jobbannons + CV i AI-prompt → injection-vektor |
| CV4 | ATS-analys | 6 | 7 | 6 | AI-output trustas, output-validering saknas |
| CV5 | CV-tips | 8 | 8 | 8 | Statiskt, låg risk |
| CL1 | Skriv brev | 6 | 6 | 5 | companyName direkt i prompt (känt MED-001) |
| CL2 | Mina brev | 7 | 8 | 7 | cover_letters RLS verifierad |
| SP1 | Sök företag | 7 | 7 | 6 | Bolagsverket via edge, token-loggning (MED-003) |
| SP2 | Mina företag | 7 | 7 | 7 | Egen lista, RLS OK |
| SP3 | Statistik | 7 | 8 | 7 | Aggregat |
| SJ1 | Intervjuträning | 5 | 5 | 5 | Mic + audio-recording, consent oklar |
| SJ2 | Lön & Förhandling | 7 | 7 | 7 | Mest innehåll, AI-prompt med lönedata |
| SJ3 | Internationell guide | 8 | 8 | 8 | Innehållsguide, låg risk |
| SJ4 | LinkedIn-optimering | 5 | 5 | 5 | OAuth-callback, pasta LinkedIn-text till prompt |
| CA1 | Arbetsmarknad | 8 | 8 | 8 | Marknadsdata, ingen PII |
| CA2 | Anpassning | 7 | 7 | 7 | Hälsoinfo i fritext → wellness-consent? |
| CA3 | Credentials | 7 | 7 | 7 | Examensbevis, RLS aktiv |
| CA4 | Flytta | 8 | 8 | 8 | Statiskt innehåll |
| CA5 | Karriärplan | 7 | 7 | 7 | AI-genererad plan, OK |
| IG1 | Test (Riasec) | 6 | 6 | 6 | Personlighetsdata, känslig — RLS OK |
| IG2 | Resultat | 7 | 7 | 6 | interest_results RLS verifierad |
| IG3 | Yrken | 8 | 8 | 8 | Katalogdata |
| IG4 | Utforska | 8 | 8 | 8 | Katalogdata |
| IG5 | Historik | 7 | 8 | 7 | Egen historik, RLS OK |
| KA1 | Kompetensanalys | 6 | 6 | 5 | drömjobb + CV i AI-prompt, injection-yta |
| KA2 | Personligt varumärke | 6 | 7 | 6 | AI-genererad text, output-trust |
| KA3 | Utbildning | 8 | 8 | 8 | Externa länkar, rel="noopener" rekommenderas |
| KB1-KB8 | Knowledge base (8) | 8 | 8 | 8 | Statiskt artikelinnehåll, låg risk |
| RE1 | Mina dokument | 6 | 6 | 5 | Filuppladdning — upload-image saknar Bearer-auth! |
| RE2 | Utskriftsmaterial | 8 | 8 | 8 | Statiska PDF:er |
| RE3 | Externa resurser | 7 | 7 | 7 | Externa länkar — verifiera target/rel |
| RE4 | AI-team | 5 | 5 | 5 | Chatt med AI, ingen output-sanitization synlig |
| RE5 | Nätverk | 6 | 6 | 6 | Tredjepartskontakter, samtycke oklart |
| WE1 | Hälsa | 6 | 7 | 6 | WellnessConsentGate finns — bra mönster |
| WE2 | Rutiner | 7 | 7 | 7 | Egen data, RLS OK |
| WE3 | Kognitiv träning | 7 | 7 | 7 | Övningar, ingen extern delning |
| WE4 | Akut stöd | 6 | 7 | 6 | Krislänkar, bör inte logga sökningar |
| MV1 | Dagbok | 7 | 8 | 7 | diary_entries RLS user_id-filter verifierat |
| MV2 | Kalender | 6 | 6 | 6 | Google OAuth state-param saknas (audit-fynd) |
| MV3 | Övningar | 7 | 7 | 7 | Egen data, RLS OK |
| MV4 | Min konsulent | 6 | 6 | 6 | consultant_notes synliga? RLS måste täcka |
| OV1 | Profil | 7 | 7 | 6 | Profile-bild via upload-image (auth-gap) |
| OV2 | Inställningar | 7 | 8 | 7 | DeleteAccountSection + DataSharingSettings — bra GDPR |
| OV3 | Vanliga frågor | 8 | 8 | 8 | Statiskt FAQ |

## Sammanfattning

Top-3 sårbarheter: (1) `client/api/upload-image.js` saknar Bearer-auth — vem som helst kan ladda upp till Vercel Blob, (2) prompt injection-vektorer i CV/CoverLetter/SkillsGap där användardata interpoleras direkt i AI-prompts utan `sanitizeInput()` (MED-001 fortfarande öppen), (3) AI-team chatt visar AI-output utan output-validering — risk för indirect prompt injection via job descriptions från AF.

GDPR-status: Stark grund — DeleteAccountSection, DataSharingSettings, WellnessConsentGate och HealthConsentGate visar att samtyckesarkitekturen finns. Saknas: tydligare consent runt AP4/Kontakter, MV4/konsulent-delning, och microfon-access i InterviewSimulator.

OWASP-relevant: A01 (Broken Access Control) — RLS täcker konsekvent `user_id` i diary, cv, applications. A03 (Injection) — DOMPurify via `sanitizeHTML` används för AF-jobbeskrivningar (JS1, NotificationsCenter). A07 (Auth) — ProtectedRoute + role-check OK; men upload-image saknar auth. A08 (Integrity) — CSP tillåter `unsafe-inline/eval` (LOW-001). HSTS-header saknas (MED-004). Lägre snittbetyg på AI/CV/CL-ytor speglar fortsatt öppna MEDIUM-fynd från security-audit.md.
