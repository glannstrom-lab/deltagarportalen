# Claude Code-guide för Deltagarportalen

**Syfte:** Konkret guide för hur du som utvecklare bäst använder Claude Code för det här projektet. Inte en allmän tutorial – utan vad som funkar för just den här kodbasen.

---

## 1. Den 30-sekunders-mentalmodellen

Claude Code är inte en chatbot – det är en **agent som har tillgång till hela din maskin**. Sätt:

- Vad den ser: filer, git, terminal, browser via MCP, internet via WebFetch.
- Vad den inte ser: din skärm (om du inte tar screenshot), tankar du har men inte skriver, vad som hänt i andra terminaler.
- Vad den är bra på: navigera kod, planera, refaktorisera, generera tester, hitta mönster.
- Vad den är dålig på: pixelperfekta UI-bedömningar utan screenshot, gissningar om infrastruktur den inte fått se.

**Konsekvens för dig:** Briefen du ger ska vara komplett. "Fixa CV-sidan" ger sämre resultat än "CV-sidan på `client/src/pages/CVPage.tsx` har ett problem där tab-navigationen inte uppdaterar URL korrekt – kolla varför."

---

## 2. Den här projektets skills och agenter – och när de är värda att använda

### Specialiserade agenter (`.claude/agents/`) – 10 st

Projektet har redan rollspecifika agenter. Använd dem när granskningen behöver ett **specifikt perspektiv** snarare än generell kodförståelse.

| Agent | Bäst för | Trigger |
|-------|----------|---------|
| `security-specialist` | Sårbarhetsskanning, RLS-verifiering, secrets-scan | Före varje deploy, vid PR som rör auth/api |
| `accessibility-specialist` | WCAG-audit, skärmläsartest | När du rör UI-komponenter |
| `langtidsarbetssokande` | Empati-perspektiv på UX | När texter eller flöden ska skrivas/redigeras |
| `arbetskonsulent` | Konsulentvärde, rapporteringsbehov | När du bygger för konsultvyn |
| `ux-designer` | Användarflöden, interaktionsdesign | Före nya sidor/komponenter |
| `fullstack-utvecklare` | Code review, integrations­frågor | Vid komplexa cross-stack-ändringar |
| `qa-testare` | Test-edge-cases, regressionsrisk | När du skrivit en feature klar |
| `performance-engineer` | Bundle-analys, Core Web Vitals | Vid lazy-load-omarbetningar |
| `ai-engineer` | AI-funktionalitet, modellval, prompt-kvalitet | När du rör `/api/ai.js` eller edge functions |
| `product-owner` | Värdeprioritering, backlog-fokus | Vid roadmap-diskussion |

**Hur du anropar:** "Låt security-specialist granska de senaste ändringarna i `api/`" – Claude vet då att ladda agenten från `.claude/agents/security-specialist.md`.

**Anti-mönster:** Anropa inte 5 agenter på en gång om du inte vill ha 5 svar att läsa. Välj den som ger hävstången.

### GSD (Get-Shit-Done) skill-paketet

Projektet har `gsd:*`-kommandon installerade (`/gsd:plan-phase`, `/gsd:execute-phase`, etc.). Det är en strukturerad arbetsmetod för **stora flerstegs-features**.

**När det är värt:** AI-Lärande-implementeringen från `docs/26-002` – där 13 steg ska in över 4 månader. Då vill du ha `/gsd:new-milestone` → `/gsd:plan-phase` → `/gsd:execute-phase` med audit och verification.

**När det är overkill:** Buggfixar, små refaktorer, en enstaka ny komponent. Då skapar GSD bara overhead.

### Andra skills som ofta är relevanta för det här projektet

- `/security-review` – snabb säkerhetsgenomgång av aktuell branch innan PR.
- `/review` – PR-review med Claude som second opinion.
- `/init` – kör om om CLAUDE.md ska regenereras (du har redan en bra, gör bara om vid stor omstrukturering).
- `frontend-design` – när du bygger en helt ny sida och vill ha en distinkt design (inte bara "ännu en form").
- `simplify` – efter du implementerat något, kör som städpass.

---

## 3. Hooks – det är så du gör Claude *konsekvent*

Claude glömmer instruktioner mellan turer om de inte är i CLAUDE.md eller i en hook. Hooks körs automatiskt och kan blockera/forma Claudes beteende.

**Föreslagna hooks för det här projektet** (lägg till i `.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'supabase db push'; then echo 'BLOCKED: Använd npx supabase db query --linked enligt CLAUDE.md' >&2; exit 2; fi"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -E '\\.(tsx?|jsx?)$' > /dev/null; then cd client && npx tsc --noEmit 2>&1 | head -20; fi"
        }]
      }
    ]
  }
}
```

Den första blockerar `supabase db push` (CLAUDE.md säger redan att den failar – nu kan Claude inte ens försöka). Den andra kör typkontroll efter varje TS/JS-edit så Claude ser felen direkt.

**Be Claude konfigurera hooks åt dig:** "Lägg till en hook som typchecker efter varje TS-edit" – Claude använder skill `update-config` och uppdaterar settings.json korrekt.

---

## 4. Slash commands du borde ha för det här projektet

Skapa egna slash commands i `.claude/commands/` för återkommande arbetsflöden. Förslag:

### `.claude/commands/check-rls.md`
```markdown
Verifiera RLS-status för alla publika tabeller i Supabase och jämför mot policies.

Steg:
1. Kör: npx supabase db query --linked "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'" --output json
2. Lista tabeller där rowsecurity = false
3. För varje sådan, sök i supabase/migrations/ efter ENABLE ROW LEVEL SECURITY för den tabellen
4. Rapportera diskrepanser i tabell-form
```

Anropa sedan med `/check-rls`. Claude vet vad den ska göra utan att du behöver förklara igen.

### `.claude/commands/deploy-edge.md`
```markdown
Deploya en specifik edge function till Supabase. Argument: function-namn.

Steg:
1. Verifiera att supabase/functions/$ARGUMENT/index.ts finns
2. Kör: npx supabase functions deploy $ARGUMENT --linked
3. Sanity-check: anropa /functions/v1/$ARGUMENT med en test-payload (curl)
4. Rapportera resultat
```

Anropas: `/deploy-edge ai-cover-letter`.

### `.claude/commands/find-dead-code.md`
```markdown
Hitta sidor/komponenter som är importerade men aldrig routade eller använda.

Steg:
1. Lista alla filer i client/src/pages/
2. För varje, grep i client/src/App.tsx efter sidonamn
3. För imports som inte används i någon Route, flagga som dödkod
4. Rapportera
```

Anropas: `/find-dead-code`. Direkt återanvändning av analysen som tas i den här granskningen.

---

## 5. Permissions – så slipper du klick-helvete

`.claude/settings.local.json` har redan en bra allowlist. Skill `fewer-permission-prompts` analyserar dina senaste sessioner och föreslår fler regler. Kör den när det blir mycket "Approve?"-prompts.

**Konkreta tillägg som passar projektet** (om de inte redan finns):
- `Bash(npx vitest:*)` – tester utan klick
- `Bash(npx playwright:*)` – E2E utan klick
- `WebFetch(domain:supabase.com)` – Supabase-dokumentation
- `WebFetch(domain:react.dev)` – React-docs
- `WebFetch(domain:tanstack.com)` – React Query-docs

**Vad du INTE ska auto-allowa:**
- `Bash(git push:*)` – ja, du har det redan, men tänk på att Claude då kan pusha till main. Överväg att ändra till `Bash(git push origin feature/*)`.
- `Bash(rm -rf:*)` – aldrig.
- Inga MCP-skrivoperationer mot produktion utan att du ser dem.

---

## 6. Mönster som funkar för just det här projektet

### Mönster: "Refactor en sida"
1. Ge Claude screenshot av sidan idag (drag-and-drop).
2. Säg: "Detta är `client/src/pages/Diary.tsx`. Den bryter mot DESIGN.md (se `docs/DESIGN.md`). Lista överträdelser, föreslå komponentstruktur, vänta på godkännande innan implementation."
3. När hen föreslagit – läs det. Säg "kör" eller "ändra X".
4. Efter implementation: "Kör typecheck och visa diff."

**Varför det funkar:** Claude vet designsystemet (DESIGN.md), har en konkret fil, och en arbetsplan. Inte "fixa CV-sidan" som ger snurr.

### Mönster: "Lägg till en feature från en ESF-spec"
1. "Läs `docs/26-002 - Nationell utlysning POA1*.md`. Vi ska bygga modul 6 (AI-Beredskapsindex)."
2. "Använd /gsd:discuss-phase för att gå igenom kraven, /gsd:plan-phase för planen, /gsd:execute-phase för bygget."
3. Vid varje fas-handoff: läs vad Claude producerat, godkänn eller redirigera.

**Varför det funkar:** Specen är detaljerad, GSD ger struktur, och du behåller kontroll vid varje milstolpe.

### Mönster: "Skriv tester för en befintlig sida"
1. "Skriv Vitest-tester för `client/src/pages/CoverLetterPage.tsx`. Inspirera dig av befintliga tester i `Dashboard.test.tsx` och `JobSearch.test.tsx`. Mocka Supabase via `client/src/test/mocks/`-mönstret om det finns, annars med vi.fn()."
2. Claude skriver. Du kör `npm test`. Felen kommer tillbaka.
3. "Här är felet: [paste]. Fixa."

**Anti-mönster:** "Lägg till tester" utan filhänvisning. Claude vet inte vilken sida och kan börja med fel.

### Mönster: "Säkerhetsrevision innan deploy"
1. `/security-review` – snabb skanning av aktuell branch.
2. "Låt security-specialist granska ändringarna djupare och uppdatera `docs/security-audit.md`."
3. Granska rapporten. Åtgärda HIGH och CRITICAL innan merge.

---

## 7. Fallgropar specifika för denna kodbas

### Migration-fallgropen
CLAUDE.md säger redan: använd inte `npx supabase db push`. Påminn Claude **i prompten** när du jobbar med DB: "Notera att vi kör enskilda migrationer med `db query --linked -f`". Annars kan Claude default-falla tillbaka på `db push` från sin träningsdata.

### Dual-AI-backend-fallgropen
När du ber Claude lägga till en AI-funktion: säg uttryckligen om det ska gå till `/api/ai.js` (Vercel) eller en ny edge function. Annars gissar Claude. Tumregel:
- Lågfrekvent, tung prompt, behöver service role → edge function.
- Streaming, hög frekvens, snabb cold start → Vercel.

### "Det ser ut som duplicering men är det inte"-fallgropen
`CVPage.tsx` (125 rader) och `CVBuilder.tsx` (1084 rader) är **inte** dubletter – CVPage är router-wrapper. Likadant `CoverLetterPage` ↔ `CoverLetterWrite` (komponent). Säg det till Claude när hen vill "konsolidera" dem.

### Designsystemets vandrande etiketter
DESIGN.md använder `brand-*` (turkos = action-domän). Många filer har fortfarande `teal-*` direkt. Om Claude skriver `teal-500` – det är tekniskt samma färg, men bryter mot konventionen. Säg: "Använd `brand-900` enligt DESIGN.md, inte `teal-*`."

### `nul`-filen i roten
Är en Windows-artefakt från `command > nul`. Claude ska inte röra den – men kan föreslå att radera. Det är OK.

---

## 8. Snabb-referens: kommandon du kommer använda dagligen

```bash
# Starta dev-server (Claude vet detta från CLAUDE.md)
cd client && npm run dev

# Typcheck (snabbare felsökning än webbläsaren)
npx tsc --noEmit

# Kör en specifik test-fil
npx vitest run client/src/pages/CVPage.test.tsx

# Migration mot prod-DB
npx supabase db query --linked -f supabase/migrations/2026XXXX_namn.sql

# Verifiera schema
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'" --output table

# Deploy edge function
npx supabase functions deploy $FUNKTIONSNAMN --linked

# Bundle-analys
cd client && npm run analyze
```

Be gärna Claude lägga in dessa som slash commands om du använder dem ofta.

---

## 9. När du ska *inte* använda Claude Code

- **Du vill bara läsa kod** – öppna VS Code, scrolla. Snabbare.
- **Du vet exakt vilken regel-ändring som behövs och var** – Edit:a själv. Snabbare än att brief:a.
- **Du behöver designbeslut som kräver känsla för varumärket** – Claude saknar din interna kontext.
- **Du är trött och stressad** – Claude förstärker vad du säger. En otydlig brief blir en stökig PR.

Claude är bäst när du har **en otydlig fråga som behöver utforskas** eller **en tydlig uppgift som tar mer än 15 minuter** att göra själv. Inom de zonerna är hen ovärderlig.

---

*Sist: be Claude läsa den här filen ibland. "Läs `docs/claude-code-guide.md` och säg om något i det är inaktuellt." Hen vet då vad du förväntar dig.*
