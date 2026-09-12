# EU-utlysningsspåret — avslutat 2026-09-12 (beslut Mikael)

Spåret pausades 2026-08-03 och avslutades 2026-09-12: kundbilden är Rusta och
matcha-leverantörer och kommunernas arbetskonsulenter, och inget arbete drivs av
utlysningarna. Allt går att ta tillbaka från git.

## Vad som ligger här

| Fil/katalog | Innehåll |
|---|---|
| `26-001 - Nationell utlysning PO A2 - Mikromeriter som väg till arbete.md` | spec, 433 rader |
| `26-002 - Nationell utlysning POA1 - Stärkt kompetens för ett arbetsliv med AI.md` | spec, 546 rader |
| `26-010 - Socialt innovativa insatser för ekonomiskt utsatta.md` | spec, 602 rader |
| `functions/learning-analyze-gap/` | edge-funktion, modellanropare (gpt-oss-120b) med aiGate sedan 2026-09-06 |
| `functions/learning-progress/` | edge-funktion |
| `functions/learning-recommend/` | edge-funktion |

Roadmapen (C4) talade om **sex** `learning-*`-funktioner; `ls supabase/functions/`
visade **tre** vid arkiveringen. Siffran sex var fel eller föråldrad.

## Avpublicerade i prod

`npx supabase functions delete <slug>` för alla tre, 2026-09-12. Verifierat med curl mot
`/functions/v1/<slug>` (POST, tom kropp): **404** för alla tre, medan `ai-career-assistant`
i samma stund gav 401 (finns, kräver token) — kontrollen skiljer alltså "borta" från
"finns". Ingen klientkod anropade dem (grep i `client/src`, `client/api`, `e2e`: bara
testet `ai-sanningsregel.test.ts` nämnde `learning-analyze-gap`, vars golv sänkts 6 → 5).

## Varför katalogerna ligger HÄR

`.github/workflows/deploy.yml` kör `supabase functions deploy` utan argument — allt i
`supabase/functions/` deployas vid varje push. Låg katalogerna kvar hade nästa push
återskapat funktionerna. Samma skäl som `archive/2026-09-01-avpublicerade-edge/`.

## Tabellerna

Funktionerna skrev till `learning_*`-tabeller (om de finns i prod) — schemat rörs inte
här; gallring enligt RETENTION-POLICY. `lint:schema` läser inte `archive/`, så inga
kodreferenser till dem finns kvar att vakta.

## Om spåret väcks

1. Flytta katalogen tillbaka till `supabase/functions/`.
2. Grinden `ai-sanningsregel.test.ts` (JD1) kräver `checkAiEnabled` + tokentak i varje
   modellanropare — `learning-analyze-gap` har dem redan.
3. Nästa push deployar.
