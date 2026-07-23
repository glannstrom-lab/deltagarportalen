# AI-arkitektur — översikt

> **Omskriven från grunden 2026-07-23 (roadmap C15).** Den tidigare versionen
> (mars 2026) beskrev filer som aldrig funnits i repot
> (`client/src/services/ai/aiAssistant.ts`, `embeddings.ts`, `smartMatch.ts`)
> och modeller (Claude 3.5 Sonnet, GPT-4 som primär LLM) som strider mot den
> gällande modell-låsningen. Den gamla filen ligger arkiverad i
> `archive/2026-07-dokarkiv/AI_ARCHITECTURE_OVERVIEW-2026-03.md`.
>
> Varje påstående nedan är verifierat direkt mot koden 2026-07-23. Se
> **`docs/AI_MODEL_LOCKING.md`** för modell-policyn och dess undantag.

---

## 1. Två parallella backends

Portalen har **två separata vägar** för AI-anrop. Välj rätt när du bygger en
ny funktion — se CLAUDE.md-avsnittet "Dual-AI-backend-fallgropen".

| | `client/api/ai.js` | `supabase/functions/*` |
|---|---|---|
| Runtime | Vercel serverless (Node) | Deno edge (Supabase) |
| Antal funktioner | 16 (efter C12, se §2) | 24 st, varav 8 är `ai-*`/LLM-relaterade |
| Auth | Bearer-token, `supabase.auth.getUser(token)` | Supabase `verify_jwt` (per-funktion) |
| Rate limiting | Inbyggd, per-funktion (§2.2) | Delad `_shared/rateLimit.ts` (varierar per funktion) |
| Används för | Merparten av UI:ts AI-knappar, inkl. streaming AI-team-chatt | Perplexity-sökningar (företag, bransch, pendling), AF/Bolagsverket-integrationer, kontohantering |
| Modell | `openai/gpt-oss-120b` (låst) | Blandat: `gpt-oss-120b` (låst) på vissa, `perplexity/sonar` på andra (medvetet undantag) |

Klienten pratar med `client/api/ai.js` uteslutande via
**`client/src/services/aiApi.ts`** (`callAI()`). Edge-funktionerna anropas
med raw `fetch` mot `${SUPABASE_URL}/functions/v1/<namn>` från enskilda
service-filer (`aiCompanySearchApi.ts`, `aiCareerAssistantApi.ts`,
`afTrendsApi.ts`, `bolagsverketApi.ts`, `educationApi.ts`, `accountApi.ts`,
m.fl.) — det finns ingen gemensam edge-klient-wrapper.

---

## 2. Backend 1 — `client/api/ai.js` (Vercel)

En enda fil (1084 rader), en handler (`module.exports = async (req, res) =>
…`), routad på `req.body.function` mot ett `PROMPTS`-objekt.

### 2.1 De 16 funktionerna

| Funktion | Rate limit (per 15 min) | Kommentar |
|---|---|---|
| `personligt-brev` | 10 | Personligt brev-generatorn |
| `cv-writing` | 20 | CV-textförbättring |
| `intervju-simulator` | 20 | Intervjusimulator-feedback |
| `karriarplan` | 5 | Karriärplan (anropas direkt via `callAI` i `PlanTab`, ingen egen wrapper i aiApi.ts) |
| `kompetensgap` | 10 | Kompetensanalys |
| `adaptation-recommendations` | 10 | Arbetsanpassning — rekommendationer |
| `adaptation-conversation` | 10 | Arbetsanpassning — uppföljningsdialog |
| `cv-jobbmatchning` | 10 | CV mot jobbannons (AI-variant; se även `cvOptimizer.ts` för den deterministiska varianten, `docs/api/services-overview.md`) |
| `linkedin-optimering` | 15 | LinkedIn-optimeraren |
| `profile-summary` | 10 | Genererar profilsammanfattning |
| `chatbot` | 30 | Enkel career-chatbot |
| `ai-team-chat` | 50 | AI-team/agentchatt — enda funktionen med SSE-stöd (§2.3) |
| `sta-document-draft` | 10 | STA/AF-blankett-utkast |
| `sta-week-summary` | 20 | STA veckosammanfattning |
| `sta-doa-sammanfattning` | 15 | STA DOA-självskattning → AF-blankett sida 4 |
| `konsulent-rapportutkast` | 10 | Konsulentens rapportutkast från journalanteckningar |

(`default`-raden i `RATE_LIMITS` — 20/15 min — används bara om en okänd
funktion råkar slippa igenom `PROMPTS`-whitelisten, vilket routern annars
avvisar med 400 innan den ens når rate-limiten.)

**C12 (2026-07-23):** funktionerna var tidigare 24. Åtta orphanade funktioner
(`cv-optimering`, `generera-cv-text`, `intervju-forberedelser`, `jobbtips`,
`loneforhandling`, `natverkande`, `ansokningscoach`, `mentalt-stod`) hade noll
anropare i klienten och togs bort tillsammans med sina
`aiApi.ts`-wrappers. Återskapas från git-historiken vid behov.

### 2.2 Säkerhet & kostnadsskydd (i handler-ordning)

1. **CORS** — `getCorsHeaders()`: whitelist (`ALLOWED_ORIGINS`, inkl.
   `jobin.se`/`www.jobin.se` samt `deltagarportalen.se` för staging) + regex
   för Vercel-preview-URL:er.
2. **Auth** — kräver `Authorization: Bearer <token>`, verifieras mot Supabase
   (`supabase.auth.getUser(token)`). 401 annars.
3. **Prompt-injection-sanering** — `sanitizeAll()`/`sanitizeInput()` körs
   rekursivt på hela `req.body.data` INNAN datan når `PROMPTS`-templates.
   Tar bort `<`/`>` och kapar strängar till 5000 tecken. Detta är en annan
   mekanism än PII-saneringen i §4 — den skyddar mot prompt-injection, inte
   mot personuppgiftsläckage.
4. **Rate limiting** — `checkRateLimit()` anropar Supabase RPC:n
   `check_rate_limit` (distribuerad, funkar över kalla starter/instanser).
   Vid RPC-fel: `rateLimitFallback()` — in-memory per varm instans
   (fail-closed-ish, inte fail-open). 429 + `Retry-After`-header vid
   överskriden gräns.
5. **Dygnstokentak (C4)** — `checkDailyTokenCap()` summerar
   `tokens_used` från `ai_usage_logs` senaste 24h per användare.
   Default `AI_DAILY_TOKEN_CAP=50000`. Skippas (best-effort, blockerar
   inte) om service-role-nyckel saknas i miljön. 429 med tydligt
   svenskt felmeddelande vid överskriden gräns.

### 2.3 Streaming (SSE) — enbart `ai-team-chat`

`req.body.stream === true` + `fn === 'ai-team-chat'` slår om till
`text/event-stream`. Läser OpenRouters SSE-svar chunk-för-chunk, skriver
vidare till klienten, och genererar dessutom 1-3 uppföljningsfrågor efter
att huvudsvaret är klart (separat, kort anrop med samma modell). Alla andra
15 funktioner går den icke-strömmande vägen (`fetchWithRetry`, se §2.4).

**Bakgrund:** fram till C12/B6 fanns en separat fil `client/api/ai-stream.js`
med hooken `useAIStream` och tjänsten `aiStreamService`. Hela det lagret
hade noll anropare (AgentChat.tsx strömmar via `ai.js`s egen SSE-gren ovan)
och arkiverades — filen `ai-stream.js` **finns inte längre** i `client/api/`.

### 2.4 Retry, loggning och modell

- `fetchWithRetry()` (C6): retrierar 5xx/429 från OpenRouter upp till 2
  gånger med exponentiell backoff (2s, 4s).
- `logAiUsage()` (fire-and-forget, `api/_utils/ai-usage-log`): skriver
  `user_id`, `function_name`, `model`, `tokens_used` till `ai_usage_logs`.
  Icke-strömmande svar använder OpenRouters exakta `usage.total_tokens`;
  strömmande svar approximerar (~4 tecken/token) eftersom SSE-strömmen inte
  alltid innehåller ett usage-objekt.
- **Modell:** `process.env.AI_MODEL || 'openai/gpt-oss-120b'` på alla tre
  anropsplatser (huvudsvar, uppföljningsfrågor, icke-strömmande). Låst per
  användarbeslut 2026-05-09 — byt inte utan explicit godkännande. Se
  `docs/AI_MODEL_LOCKING.md`.

---

## 3. Backend 2 — `supabase/functions/` (24 Deno edge-funktioner)

```
_shared/              cors.ts, proxyGuard.ts, rateLimit.ts — delade helpers

af-enrichments         af-historical          af-jobed
af-jobsearch           af-taxonomy            af-trends
                       ↳ Arbetsförmedlingen-integrationer (ej LLM)

ai-assistant           ai-career-assistant    ai-commute-planner
ai-company-analysis    ai-company-search      ai-cover-letter
ai-cv-writing          ai-industry-radar
                       ↳ LLM-anrop (se tabell nedan för modell per funktion)

bolagsverket           education-search       health
delete-account         send-inactivity-warning  send-invite-email
                       ↳ Övrig integration/drift (ej LLM)

cv-analysis            ↳ LLM (OpenAI GPT-4 direkt, se undantag nedan)

learning-analyze-gap   learning-progress      learning-recommend
                       ↳ LLM (analyze-gap) / regelbaserat
```

### 3.1 Modell per LLM-funktion (verifierat i koden)

| Funktion | Modell | Status mot låsningen |
|---|---|---|
| `ai-assistant` | `Deno.env.get('AI_MODEL') \|\| 'openai/gpt-oss-120b'` | Låst |
| `ai-cover-letter` | samma mönster | Låst |
| `ai-cv-writing` | samma mönster | Låst |
| `learning-analyze-gap` | samma mönster | Låst |
| `ai-career-assistant` | `perplexity/sonar` (hårdkodad) | **Medvetet undantag** — behöver Perplexitys webbsökning, se `AI_MODEL_LOCKING.md` |
| `ai-commute-planner` | `perplexity/sonar` | Medvetet undantag |
| `ai-company-analysis` | `perplexity/sonar` | Medvetet undantag |
| `ai-company-search` | `perplexity/sonar` | Medvetet undantag |
| `ai-industry-radar` | `perplexity/sonar` | Medvetet undantag |
| `cv-analysis` | `gpt-4` (hårdkodad, `OPENAI_API_KEY` direkt — separat faktura från OpenRouter) | **Känt undantag**, föreslagen flytt i roadmapen |

### 3.2 Klientanropare — verifierat 2026-07-23

De flesta edge-funktioner har en tydlig klientanropare
(`fetch(\`\${SUPABASE_URL}/functions/v1/<namn>\`)` i en dedikerad
service-fil). Fyra **AI-edge-funktioner har för närvarande noll klientanropare**
efter att C11 (2026-07-23) tog bort dubblettkod som gick samma väg som
`client/api/ai.js`:

- `ai-assistant`, `ai-cover-letter`, `ai-cv-writing`, `cv-analysis` — se
  roadmap-post C11: "Edge-funktionerna ai-cover-letter/ai-cv-writing/
  cv-analysis har nu 0 klientanropare → ödet avgörs i C4/G6 (aug)". Samma
  gäller `ai-assistant` (endast referenser i arkiverad dokumentation kvar).

Utöver detta hittades **inga klientanrop** till `learning-analyze-gap`,
`learning-progress`, `learning-recommend` eller `af-jobsearch`/
`af-enrichments` i `client/src` vid denna genomgång — `learningService.ts`
(den aktiva learning-modulen) läser/skriver direkt mot Supabase-tabeller
utan att gå via dessa edge-funktioner. Detta var inte tidigare dokumenterat
och är inte en del av C11/C12-städningen — flagga som underlag för en
framtida edge-funktions-revision (inte skapad av C15, som är avgränsat till
dokumentation).

De med bekräftade klientanropare: `af-historical`/`af-trends`
(`afTrendsApi.ts`), `af-taxonomy` (`afTaxonomyApi.ts`), `af-jobed`
(`afJobEdApi.ts`), `bolagsverket` (`bolagsverketApi.ts`), `education-search`
(`educationApi.ts`), `delete-account`/`health`-relaterat
(`accountApi.ts`), `send-invite-email` (inbjudningsflöden för
konsulenter/STA), `ai-company-search`/`ai-career-assistant`/
`ai-company-analysis`/`ai-industry-radar`/`ai-commute-planner`
(`aiCompanySearchApi.ts`, `aiCareerAssistantApi.ts`). `health` är typiskt en
driftskontroll (extern monitor), `send-inactivity-warning` typiskt schemalagd
(cron) — inga klientanrop förväntas för dessa två.

---

## 4. Klientlager

### 4.1 `client/src/services/aiApi.ts`

- `callAI<T>(functionName, data)` — den generiska funktionen. Lägger till
  Bearer-token, 60s timeout (`AI_TIMEOUT_MS`, abortar med svenskt
  felmeddelande), och kör **PII-sanering** (§5) på `data` innan `fetch`.
- Namngivna wrappers (endast 4 kvar efter C12): `generateCoverLetter()` →
  `personligt-brev`, `chatWithAI()` → `chatbot`, `generateProfileSummary()`
  → `profile-summary`, `generateDoaSummary()` → `sta-doa-sammanfattning`.
  Övriga 12 PROMPTS-funktioner anropas direkt med `callAI('funktionsnamn',
  data)` från sina respektive sidor/komponenter.

### 4.2 `client/src/services/aiSchemas.ts` (C5, 2026-05-15)

Zod-scheman som validerar AI-svar innan UI:t litar på formen — löser
audit-fyndet att ett JSON-parse-fel tidigare gav `{ raw: content }` och
tyst `undefined` i UI:t istället för ett tydligt fel.

Scheman: `KarriarPlanSchema`, `KompetensgapSchema`,
`IntervjuSimulatorResultSchema`, `StaDocumentDraftSchema` (den senare är en
`z.union` som normaliserar både `{ sections: {...} }`-wrappern och en bar
sektions-record till samma form). Helper: `safeParseAiResponse(schema, raw)`
hanterar direkt JSON, strängifierad JSON, markdown-code-fence och
`ai.js`s `{ raw }`-fallback.

---

## 5. PII-hantering — två oberoende lager

1. **Klient, innan nätverksanrop:** `client/src/lib/piiSanitizer.ts`
   (`sanitizeObjectForAi`, anropas av `callAI()` i `aiApi.ts`). GDPR-motiverat
   inför överföring till tredjelands-leverantör (OpenRouter, USA).
   - **HARD STRIP** (tas alltid bort, ersätts med `[BORTTAGET-...]`):
     svenska personnummer/samordningsnummer, kreditkortsnummer
     (Luhn-validerat), IBAN, bankkonto/plusgiro/bankgiro.
   - **SOFT WARN** (behålls, men loggas): email, telefon, fullständiga
     adresser — dessa krävs ofta i output (t.ex. kontaktuppgifter i ett
     personligt brev) och strippas därför inte.
   - **Rörs aldrig:** namn, yrkesord, intressen, ort på kommunnivå.
2. **Server, i `client/api/ai.js`:** `sanitizeAll()`/`sanitizeInput()` — inte
   PII-fokuserad, utan skydd mot **prompt-injection** (tar bort
   `<`/`>`-tecken, kapar längd). De två lagren löser olika problem och är
   avsiktligt separata.

Edge-funktionerna (`supabase/functions/ai-*`) har egna, mindre omfattande
saneringsrutiner per funktion — de delar inte `piiSanitizer.ts` eftersom de
körs i Deno, inte i klienten.

---

## 6. Modell-låsning — sammanfattning

Se **`docs/AI_MODEL_LOCKING.md`** för fullständig policy, ändringslogg och
verifieringsmetod. Kort sammanfattat: allt utom de dokumenterade
Perplexity-/GPT-4-undantagen (§3.1) ska gå mot `openai/gpt-oss-120b` via
`AI_MODEL`-miljövariabeln. Byt aldrig modell utan explicit beslut av
Mikael — det är en kostnadsfråga, inte en kvalitetsfråga.

> **Känd kvarstående avvikelse (utanför C15s scope):** `AI_MODEL_LOCKING.md`
> självt anger fortfarande "ai.js (18 funktioner)" och "ai-stream.js (13
> funktioner)" i sin tabell — båda siffrorna och filreferensen är föråldrade
> efter C12/B6 (se §2.1, §2.3). Bör rättas i en egen roadmap-post.

---

*Senast verifierat mot koden: 2026-07-23 (roadmap C15).*
