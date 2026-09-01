# Avpublicerade AI-edge-funktioner — 2026-09-01 (A27, beslut Mikael)

Fyra edge-funktioner låg **ACTIVE i produktion** med `verify_jwt: true` och **noll
anropare i portalen**. De var alltså anropbara av vilket som helst av de 93 kontona,
förbi allt som `/api/ai` grindar med: AI-brytaren (`profiles.ai_enabled`), PII-saneringen,
art. 9-samtyckesgrinden och dygnets tokentak.

| Funktion | Version i prod | Levande motsvarighet |
|---|---|---|
| `ai-assistant` | v29 | `callAI(...)` mot `/api/ai` |
| `ai-cover-letter` | v36 | `callAI('personligt-brev')` |
| `ai-cv-writing` | v24 | `callAI('cv-writing')` |
| `cv-analysis` | v27 | `callAI('cv-jobbmatchning')` |

Portalens egen kod kallade dem redan "callerlösa dubbletter" (`client/src/lib/supabase.ts:284`,
`services/coverLetterApi.ts:95`). Att grinda kod ingen kör hade varit att betala för dödkod —
lärdomen från 9 augusti, då ett WCAG-svep skrev 58 rader i onåbara filer.

**Åtgärd:** `npx supabase functions delete <slug>` för alla fyra, verifierat mot
`supabase functions list`.

## Varför katalogerna ligger HÄR och inte kvar i `supabase/functions/`

`.github/workflows/deploy.yml:71` kör `supabase functions deploy` **utan argument**, och
CLI:n deployar då allt som finns lokalt (det finns ingen `--exclude`-flagga; `--prune`
används inte). Låg katalogerna kvar hade nästa push återskapat exakt det som just togs bort,
utan att någon märkte det. Flytten är alltså inte städning — den är det som gör
avpubliceringen varaktig.

## Om någon av dem ska tillbaka

1. Flytta katalogen tillbaka till `supabase/functions/`.
2. **Lägg grinden först:** `_shared/aiGate.ts` (`checkAiEnabled` + tokentak), och art. 9-grinden
   om funktionen rör hälsa, mående eller anpassningsbehov. Utan den upprepas felet.
3. Nästa push deployar den.

`learning-analyze-gap` rördes **inte** — den hålls medvetet i vänteläge av ROADMAP C4
(EU-utlysningsspåret, pausat 2026-08-03).
