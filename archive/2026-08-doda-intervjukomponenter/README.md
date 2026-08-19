# Arkiverat: `components/interview/` (2026-08-19)

Tre komponenter, 617 rader: `InterviewPrep.tsx`, `MockInterviewSession.tsx`,
`StarMethodGuide.tsx`.

## Varför

**Noll importörer, verifierat två gånger.** Nåbarhetsanalys från `main.tsx`
(`node client/scripts/dead-code.cjs`) placerar alla tre under ARKIVERA; en
sökväg-grep efter `components/interview` ger noll träffar i hela `client/src`.
Importsökning ensam räcker inte i det här repot — döda barrel-filer gör att en
`grep` rapporterar "har importör" (lärdomen 2026-08-04) — därför båda.

**De är avmonterade, inte oinkopplade.** `InterviewPrep` satt som fliken
"Intervjuförberedelse" i `pages/JobSearch.tsx` från `158ed7d2` (2026-02-27) och
försvann i `3013187d` (2026-03-06) — en commit som heter *"Fix Arbetsförmedlingen
API: Simplified direct API calls with caching"* och skriver om `JobSearch.tsx`
med 999 rader. Fliken togs bort som sidoeffekt, inte som beslut. Den levde sju
dagar och var död i fem och en halv månad.

**Filen är dessutom trasig i sig.** Samma dag (`91dbb1e0`) blev
`calculateProgress()` async; `InterviewPrep.tsx:23` anropar den utan `await`.
Det ger 7 TS2339-fel som räknats in i `typecheck:ceiling` hela tiden — i kod
ingen kör.

## Vad som räddades först

`StarMethodGuide` bar fem punkter om vanliga misstag i STAR-svar som inte fanns
någon annanstans i portalen (STAR-avsnittet på `/interview-simulator` var fyra
meningar). De ligger nu i språkfilerna som `interviewSimulator.star.mistakes`
och renderas på den levande sidan.

Guidens helexempel — en projektledare som räddar en missnöjd kund och ökar
beställningen med 30 % — flyttades **inte** med. Det är samma fel som sidans
gamla "Exempel på bra svar", där en webbutvecklares svar visades för en blivande
vaktmästare: ett facit i ett yrke man inte söker.

## Följd för `interviewService.ts`

Efter flytten har den filen **en** export som levande kod når:
`saveSimulatorSession`. `MOCK_INTERVIEWS`, `analyzeStarAnswer`,
`getInterviewTips`, `saveInterviewSession` och `calculateProgress` nåddes bara
härifrån; `getQuestionsForOccupation` och `createInterviewPlan` nås inte alls.
Cirka 500 rader är alltså konsumentlösa. Det skärper ROADMAP C22 men rörs inte
här — en sak i taget.

`analyzeStarAnswer` bör inte återupplivas som den är: den sätter "Poäng: X/100"
via fyra regex, och "Jag löste det genom att…" ger 0 poäng för Action. Ett
påhittat omdöme om användarens svar, samma familj som B12.

## Vid återupplivning

Koden kompilerades senast mot React 19 / TS 5.9 vid commit-datumet ovan, men
`InterviewPrep` har de 7 typfelen ovan och måste lagas först. Ingen av de tre
har `t()`, `aria-` eller `dark:` — de skrevs före både i18n-svepet och
mörkt läge.
