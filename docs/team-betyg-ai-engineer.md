# AI-engineer — betyg

Lins: AI-funktioner, prompt engineering, model choice, streaming UX, fallback-hantering, personalisering.

**Generella observationer från `client/api/ai.js`:**
- 18 funktioner samlade i en fil med en hardcoded modell (`anthropic/claude-3.5-sonnet` via OpenRouter).
- Streaming finns men endast för `ai-team-chat` — alla andra AI-anrop blockerar UI tills hela svaret kommer.
- Prompt-templates är korta och inline. Sanitization (`sanitizeAll`) ger viss prompt-injection-skydd.
- Rate limiting per funktion finns. Felhantering returnerar generisk text — ingen retry/exponential backoff.
- Inga "AI-genererat"-markörer eller confidence scores i UI:t generellt. Saknar transparens.
- Endast LinkedIn-optimizer har explicit klient-fallback om AI failar.

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | Översikt-hubben | 6 | 6 | 6 | Ej AI-yta — neutralt |
| H2 | Söka jobb-hubben | 6 | 6 | 6 | Ej AI-yta — neutralt |
| H3 | Karriär-hubben | 6 | 6 | 6 | Ej AI-yta — neutralt |
| H4 | Resurser-hubben | 6 | 6 | 6 | Ej AI-yta — innehåller AI-team-länk |
| H5 | Min vardag-hubben | 6 | 6 | 6 | Ej AI-yta — neutralt |
| D1 | Dashboard översikt | 6 | 5 | 6 | Ingen AI-personalisering på startsidan |
| D2 | Mina Quests | 6 | 5 | 6 | Quests ej AI-genererade — statisk lista |
| JS1 | Sök jobb | 6 | 5 | 6 | AF-sök, ingen AI-ranking eller semantic match |
| JS2 | Dagens jobb | 6 | 4 | 6 | "Dagens" inte AI-curated, bara filterad |
| JS3 | Sparade jobb | 6 | 6 | 6 | Ej AI-yta |
| JS4 | Matchningar | 5 | 4 | 5 | "Matchning" oklar — saknar AI-score-display |
| AP1 | Pipeline | 6 | 5 | 6 | Statisk kanban, ingen AI-coach |
| AP2 | Historik | 6 | 6 | 6 | Ej AI-yta |
| AP3 | Kalender | 6 | 6 | 6 | Ej AI-yta |
| AP4 | Kontakter | 6 | 5 | 6 | Saknar AI-genererade follow-up-mejl |
| AP5 | Statistik | 6 | 5 | 5 | Saknar AI-insights/trender |
| CV1 | Skapa CV | 6 | 6 | 6 | `cv-writing` med 4 features (improve/quantify/translate/generate) |
| CV2 | Mina CV | 6 | 6 | 6 | Ej AI-yta |
| CV3 | Anpassa CV | 6 | 6 | 6 | AI-anpassning till jobbannons — bra koncept |
| CV4 | ATS-analys | 5 | 5 | 5 | ATS-analys oklart om AI-driven eller regelbaserad |
| CV5 | CV-tips | 6 | 5 | 6 | Sannolikt statiska tips, ej personaliserade |
| CL1 | Skriv brev | 7 | 7 | 6 | `personligt-brev` med ton-val, CV-context, mall-system — bra |
| CL2 | Mina brev | 6 | 6 | 6 | Ej AI-yta |
| SP1 | Sök företag | 6 | 5 | 6 | Bolagsverket-sök, ingen AI-matching mot CV |
| SP2 | Mina företag | 6 | 6 | 6 | Ej AI-yta |
| SP3 | Spontanansökan-statistik | 6 | 5 | 6 | Saknar AI-insights |
| SJ1 | Intervjuträning | 7 | 6 | 6 | JSON-rating 1-5 + nästa fråga, men ingen streaming |
| SJ2 | Lön & Förhandling | 6 | 6 | 6 | `loneforhandling` + statiska kalkyl-tabs |
| SJ3 | Internationell guide | 5 | 4 | 6 | Sannolikt statiskt, inget AI-stöd för översättning |
| SJ4 | LinkedIn-optimering | 6 | 6 | 6 | Har klient-fallback! Men prompt: `JSON.stringify(data)` — slarvig |
| CA1 | Arbetsmarknad | 6 | 5 | 6 | AF-data, ingen AI-tolkning |
| CA2 | Anpassning | 6 | 5 | 6 | Generisk |
| CA3 | Credentials | 6 | 5 | 6 | Ej AI-driven |
| CA4 | Flytta | 6 | 5 | 6 | Ej AI-driven |
| CA5 | Karriärplan | 7 | 7 | 6 | `karriarplan` returnerar JSON-struktur — bra parsning |
| IG1 | Intressetest | 6 | 6 | 7 | RIASEC-test, ej AI men strukturerat |
| IG2 | Intresseresultat | 6 | 6 | 6 | Statisk RIASEC-mappning |
| IG3 | Yrken | 6 | 6 | 6 | AF-yrkeskatalog |
| IG4 | Utforska | 6 | 5 | 6 | Saknar AI-genererad personlig guidning |
| IG5 | Historik | 6 | 6 | 6 | Ej AI-yta |
| KA1 | Kompetensanalys | 7 | 7 | 6 | `kompetensgap` JSON med matchingScore + skills + resources — bra struktur |
| KA2 | Personligt varumärke | 6 | 5 | 6 | Audit/Pitch — oklart om AI-stöd är tydligt |
| KA3 | Utbildning | 5 | 4 | 6 | Ej AI-rekommendationer |
| KB1 | Kunskap för dig | 6 | 5 | 6 | Saknar AI-personalisering ("för dig" är inte personaliserat) |
| KB2 | Komma igång | 6 | 6 | 6 | Statisk |
| KB3 | Ämnen | 6 | 6 | 6 | Statisk |
| KB4 | Snabbhjälp | 6 | 5 | 6 | Borde vara AI-chat-baserad |
| KB5 | Min resa | 6 | 5 | 6 | Saknar AI-reflektion |
| KB6 | Verktyg | 6 | 6 | 6 | Statisk |
| KB7 | Trendar | 6 | 5 | 6 | Saknar AI-trendanalys |
| KB8 | Berättelser | 6 | 6 | 6 | Statisk |
| RE1 | Mina dokument | 6 | 6 | 6 | Ej AI-yta |
| RE2 | Utskriftsmaterial | 6 | 6 | 6 | Ej AI-yta |
| RE3 | Externa resurser | 6 | 6 | 6 | Ej AI-yta |
| RE4 | AI-team | 7 | 7 | 7 | Streaming via SSE, agent-personas, follow-up-suggestions, response-mode |
| RE5 | Nätverk | 6 | 5 | 6 | `natverkande` finns i ai.js men oklart om exponerat här |
| WE1 | Hälsa | 6 | 5 | 6 | Saknar AI-coach för wellness |
| WE2 | Rutiner | 6 | 5 | 6 | Statiska rutiner, ej AI-anpassade |
| WE3 | Kognitiv träning | 6 | 6 | 6 | Övningar, ej AI-genererade |
| WE4 | Akut stöd | 6 | 6 | 7 | Riktig kontaktinfo prio över AI — rätt val |
| MV1 | Dagbok | 6 | 5 | 6 | Saknar AI-reflektionsfeedback på journal-poster |
| MV2 | Kalender | 6 | 6 | 6 | Ej AI-yta |
| MV3 | Övningar | 6 | 6 | 6 | `ovningshjalp` finns men användning oklar |
| MV4 | Min konsulent | 6 | 6 | 6 | Ej AI-yta |
| OV1 | Profil | 6 | 6 | 6 | `profile-summary` kan AI-generera profilsamman. |
| OV2 | Inställningar | 6 | 6 | 6 | Saknar AI-prefs (modell, tonalitet) |
| OV3 | Vanliga frågor | 6 | 5 | 6 | Statisk FAQ, borde gå mot AI-sök |

## Sammanfattning

**Bästa AI-yta:** RE4 AI-team (7/7/7) — enda ytan med streaming SSE, follow-up-suggestions, agent-personas och response-mode-väljare. Bra prompt-engineering med strukturerade markdown-instruktioner. KA1 Kompetensanalys (7/7/6) och CA5 Karriärplan (7/7/6) är näst bästa tack vare strukturerade JSON-svar.

**Svagaste AI-yta:** SJ3 Internationell guide (5/4/6) och KA3 Utbildning (5/4/6) — inga AI-anrop alls trots tydliga use-cases. JS4 Matchningar (5/4/5) — "matchning" utan synlig AI-score eller motivering.

**Top-3 AI-förbättringar:**
1. **Bredare streaming.** Endast `ai-team-chat` streamar idag. Aktivera streaming för `personligt-brev`, `kompetensgap`, `karriarplan`, `cv-writing` — minskar perceived latency dramatiskt på funktioner som ofta är 10-20s.
2. **AI-transparens i UI.** Inga ytor visar "AI-genererat", confidence/score, eller källor. Lägg till en konsekvent badge + möjlighet att se prompt/regenerera. Speciellt akut för kompetensanalys (matchingScore 75) och intervjusimulator (rating 1-5) — dessa siffror är nu obegrundade.
3. **Fallbacks och retry.** Endast LinkedIn-optimizer har lokal fallback. Övriga AI-anrop kraschar med toast om Claude failar. Implementera (a) graceful degradation till mall-text, (b) automatisk retry med exponential backoff på 502/timeout, (c) modell-fallback Sonnet → Haiku vid load.

**Bonusfynd:**
- Modellval är hardcodat per env-variabel — borde routas per funktion (Haiku för `chatbot`/`jobbtips`, Sonnet för `karriarplan`/`kompetensgap`).
- `linkedin-optimering`-prompt skickar `JSON.stringify(data)` rakt in i user-promptet — sårbart och ger sämre output än strukturerad text.
- Inga AI-resultat cachas — samma `kompetensgap` med samma input genererar ny tokens varje gång.
