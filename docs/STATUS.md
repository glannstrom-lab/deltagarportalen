# STATUS — vad som väntar på Mikael

**Datum: 2026-10-12. Uppdateras vid varje roadmap-pass.** Detta är en läsvy över `docs/ROADMAP.md`, inte en ny plan. Radhänvisningar (`R123`) gäller ROADMAP.md 2026-10-12 och glider; sök på ID:t. Där samma ID finns två gånger anges avsnittet. Varje öppen post är kontrollerad mot kod, prod-databas eller Vercel/GitHub 2026-10-12.

---

## 1. Väntar på Mikaels beslut eller ja

### Säkerhet och juridik
| ID | Avgöra | Kostnad att vänta | Var |
|---|---|---|---|
| **BS2** (A2/A4/A5) | Jurist för AI-förordningen, signera DPIA och Art 30, OpenRouter DPA/SCC. | Öppet sedan deadlinen 2 aug; nu 4 organisationer. Svårt att sälja till kommun utan. ~1 dag + jurist. | R336 |
| **BS3** | Repot publikt eller privat. **Kontrollerat: GitHub-API:t visar `"private": false`.** KSL25 (R69) säger "repot privat" — det stämmer inte i dag. | Rullat lösenord (A33) ligger i historiken. 2–4 h. | R337, R69 |
| **KSL25** | Rest efter `d545e26d`: MFA för personal, Supabase Pro/PITR (= PF3), läslogg på servern, PUB-avtal. | Säkerhetsfrågor vid första kommunupphandling. | R69 |
| **KM12 (4)** | PUB-avtalet: utkast finns i `juridik/`, behöver juridisk granskning och kommunens org.nr vid signering. | Blockerar signering med första kommunen. | R2889 (KM-avsnittet) |
| **DP2** (avsnitt Projektgenomgång 2026-09-13) | Org.nr för enskild firma är innehavarens personnummer; `handle_employer_invitation` särbehandlar inte. Behöver beslut om hantering. ~1 dag. | Personnummer kan sparas som org.nr. | R842 |
| **AG9-rest** | Gallringstid för de fem `employer_*`-tabellerna (förslag: 2 år efter `end_date`, 12 mån för aldrig tillsatta förslag). **Kontrollerat: inget av 17 cron-jobb rör dem.** | Löftet "sluta dela när du vill" håller inte. | R783 |
| **DP1** (avsnitt Projektgenomgång 2026-09-13, "Företagskontaktens personuppgifter") | Rättslig grund för företagskontakten: fatta AG9 eller dokumentera interimistisk grund (berättigat intresse). | Insamling pågår utan vald grund. | R760 |
| **DE7** | Tokentaket fail open vid databasfel (`api/ai.js:319-337`, bekräftat): stäng, eller godta i `AI_MODEL_LOCKING.md`. ~15 min. | Kostnadsrisk vid DB-fel. | R2449 |
| **SK5** | Pendlingsplanerarens hemadress till Perplexity, överföringsgrunden ej fastställd. Bara beslut kvar. | Oredovisat underbiträde. | R5781 |
| **KO3b** | Lösenordets teckenklasskrav. **Bekräftat: `lib/validations/index.ts:22-40` kräver fortfarande alla fyra klasser** (NIST avråder). | Avhopp vid registrering. | R5811 |
| **BP7** | "Dela med konsulent" i AI-teamet (`AgentChat.tsx:349`, bekräftat kvar) skriver osanerad chatt till `shared_resources`; ta bort knappen eller bygg klart. | Osanerade personuppgifter, läsrätt kvar efter uppsägning. | R525 |
| **BP8** | "Standard-CV" bara i localStorage (**`user_preferences.default_cv_id` finns inte i prod**, kontrollerat). Bygg kolumn eller ta bort. Krisnumren bör granskas av människa. | Funktion som sviker; krisnummer kan vara föråldrat. | R528 |

### Drift och pengar
| ID | Avgöra | Kostnad att vänta | Var |
|---|---|---|---|
| **AT4 / SFT2** | Ja till ny cron i `client/vercel.json` för `/api/aktivitet-mejl` (**kontrollerat: `crons` har bara job-alerts och pass-paminnelse**). Samma ja löser SFT2 (mejl för handläggarens underlag och företagets förslag). 15 min. | Notiser om plan och frånvaro mejlas aldrig. | R341, R142 |
| **DR1b** | Ja till ett steg i `deploy.yml` som kräver `X-Felrapport: pa` (**`.github/workflows/` har ingen sådan rad**). ~15 min. | Tyst avstängd felrapportering syns inte. | R771 |
| **DR3** (avsnitt "Skav som märks", `main` utan branch protection) | Ja till branch protection. **Bekräftat `"protected": false`.** ~10 min. | Push = deploy; inget skydd mot trasig commit. | R5765 |
| **BP9 / DP4** | Ja till deno-test-steg i `ci.yml` (**inget `deno test` i workflows**). 58 tester körs inte. | Edge-regressioner når prod. | R531, R444 |
| **PF3** | Beslutat 2026-09-27: vänta med Supabase Pro tills första kommunen säger ja. Förarbete: flytta comdira-v3, Comdira, Körkort till egen gratisorganisation. | Ingen backup/PITR i Free; paus efter en veckas inaktivitet. | R335 |
| **PF4** | Bussfaktor 1: nödinstruktion + läsbehörighet för en betrodd person. Några timmar. | Ingen kan driva om du faller bort. | R350 |
| **DR6** (avsnitt "Kvar", Sentry-samtycke) | Samtyckesfri aggregerad felräknare? | Fel hos de flesta deltagare syns inte. | R5813 |
| **DE5** | Anrop som tömmer `email_queue` via `send-inactivity-warning` (`CRON_SECRET` finns nu). Behövs först 2027-08; kräver ja för `vercel.json`. | Ingen kostnad före 2027-08. | R2444 |

### Produkt
| ID | Avgöra | Var |
|---|---|---|
| **AG9** | Prismodell och avtal för företagskunder. Rådet: ring tre företag först; sätt inget pris förrän dess. | R2079 |
| **BL1** (avsnitt "Framåt", `/my-consultant`) | Konton utan konsulent (~70 av 101): stäng självregistrering eller bygg kö. En mailto finns. | R2374, R4722 |
| **SFT4** | Ska företaget kunna ändra ett givet ja (FT1:s återöppning)? | R145 |
| **ST2** | Bredda UPDATE-policyn för chef/admin på `activity_plans`/`activity_sessions`/`activity_plan_handovers` (migration), eller dölj kontrollerna. Policyerna är fortfarande bara `ALL` för egen konsulent. | R617 |
| **ST3** | Dela `deltagarportal-settings` i två nycklar (innehåll vs tillgänglighet). | R625 |
| **BP6-rest** | Lösenordsbytet är löst, men "Byt foto" och 2FA i säkerhetsfliken är inte kontrollerade. | R523 |
| **AT3** | Ton för veckovis check-in (dagbok 1 inlägg i hela historiken). 6–8 h efter beslut. | R340 |
| **CH4** | Caseload-tak: vad är "för mycket"? | R227 |
| **UTRED-filerna** (energi C19, notiscentret H12, FocusCV m.fl.) | 17 filer / 5 665 rader: behåll eller radera. Bär de 16 sista typfelen. | R633 |
| **SE4 → SE5, SE1+SE2** | Redirect-mekanism saknas i `vercel.json` (**bekräftat inget `redirects`-block**) — blockerar alla guide-sammanslagningar och slugbytet. Kräver ja för `vercel.json`. | R5760, R5762, R5756 |

### Kundgrupper (kommun / Rusta och matcha)
| ID | Avgöra | Var |
|---|---|---|
| **KSL19** | Kommun: 4 a/4 d §, uppehållsräknare, läkarintygsflagga, Kolada-export. Underlag i `docs/ksl19-20-underlag.md`. Läkarintygets paragraf och Kolada-id obelagda. Migration krävs, före IVO-fönstret jan 2027. | R61 |
| **KSL20** | R&M: nivå-på-plan, fristbevakning, avvikelser i AF:s format, slutredovisning. Kräver migration. Samma underlag. | R62 |
| **MK1** | Matchningsleverans mot riktiga arbetsgivare saknas — produktval, ej beslutat. | R3100 |
| **KM11** | Arabiska/somaliska/tigrinja/dari för "Min vecka": väntar på översättare. | R2887 |
| **KF1** (spår KF, 2026-10-18) | Import av AF-beslut: be en R&M-leverantör (HelloLilly/Misa) om en avidentifierad exempelfil ur KA-Webbstöd — formatet är inte offentligt. | spår KF |
| **KF4** | SMS-påminnelser: ny SMS-leverantör = nytt biträde + kostnad per SMS; vem betalar? | spår KF |
| **KF8** | EU-only AI som säljlöfte — rör modellåsningen (EU-provider utan fallback). | spår KF |
| **KF9 / KF10** | Videointervjuträning (rekommendation: avstå) · partnerskap med Lingio för yrkessvenska. | spår KF |

### Migrationer som väntar
- `supabase/migrations/PENDING_20260728_drop_job_applications.sql` — destruktiv DROP. **Kontrollerat: tabellen har 0 rader i prod.** Behöver bara ditt ja (R7158).
- KSL19/KSL20 (ovan) och ST2 skulle ge nya migrationer. Inga andra `PENDING_`-filer finns.

---

## 2. Står öppna i ROADMAP men verkar lösta (huvudagenten kan stryka)

| ID (avsnitt) | Belägg |
|---|---|
| **DP1** driftpasset, "Google-registrering" (R433) | `components/auth/SamtyckeSteg.tsx` (DP1, 2026-09-24) monterad i `Layout.tsx:330,641`; finns redan ✅-rad på R319. Att 75 av 146 profiler fortfarande saknar `terms_accepted_at` är historik som fylls när kontona loggar in. |
| **ST1** `CRON_SECRET` saknas (R608) | `npx supabase secrets list` visar `CRON_SECRET` och `BLOB_READ_WRITE_TOKEN`; GA1 (R168) bekräftar 2026-10-04. Kvar av ST1 är bara anropet för inaktivitetsvarningen = DE5. |
| **BP5** `BLOB_READ_WRITE_TOKEN` (R521) | Samma secrets-lista; `delete-account` städar Blob (GA1). `SENTRY_DSN` finns däremot inte i edge-secrets. |
| **BP6** attrapp-lösenordsbyte (R523) | `components/settings/BytLosenord.tsx` finns; SV2 = BP6 är ✅ (R"Skarpt funktionstest"). Byt foto/2FA ej kontrollerat. |
| **CH2** vy över hela enheten (R206) | `components/consultant/ChefsVy.tsx` monterad i `pages/consultant/OverviewTab.tsx` (= CH8). |
| **RM5** (R2789) och **KM1** (R2827), "beslut först" | Beslutspasset 2026-09-12 fattade marknadsvalet (kundbild = R&M-leverantörer + kommunkonsulenter, enligt minnesindexet) och överlämning är byggd (`activity_plan_handovers`, ChefsVy, `AktivitetsplanSektion`). Kontrollera att raderna är beslutade och stryk. |
| **RM1 / NF3** resultatklockan (R2798, R344) | Delar finns i `AvtalskravKort.tsx` (rr24/rr25-tester, `PlaceringDeltagareKort`). Status bör omprövas, men "inget finns" stämmer inte. |
| **RM6 / NF2** periodrapport (R2821, R343) | Delvis: `ReportDraftDialog.tsx`, `aktivitetslogg.ts`. Samma omprövning; KSL20 beskriver resten. |
| **BS1-rader / DR6 (✅-versionen)** | Dubblett-ID: DR6 finns både som ✅ (Security Scan, R5790) och öppen (Sentry-samtycke, R5813). Bara den senare är öppen. |
| **DP2 driftpasset** (R439) | ✅ index körd 2026-09-23; den öppna DP2 (R842) är en annan post (enskild firma). |
| **DP3** 389/430 policyer (R441) | Siffran är fel: nu 286 av 407 policyer med `auth.uid()` utan select. Poster bör räknas om; låg prioritet. |
| **DR3 första** (R797), gallringsjobb utan felhantering | Ej verifierad som löst. Står öppen. |
| **KSL25** "repot privat" | Motsägs av GitHub-API:t (se BS3) — texten ska rättas, inte raden strykas. |

Inte hunnet kontrollera (antagna öppna): KSL18 (demoleverantörens Nordfrakt-förslag), AK1, MV2b, MK2/MK4/MK5, SE1+SE2, DR3 gallringsfel.

---

## 3. Kan byggas utan beslut
- **KSL19 läkarintygsflaggan** (S, ingen migration; resten kräver migration).
- **KSL18** demoleverantörens sådd (migration av seed-funktionen; demodata, ofarlig).
- **AK1** mät nästa-steg-kortet och onboardingens "Hoppa över" (~2 h).
- **SFT3-rest** energifliken i Dagbok; **SFT5-rest** LCP på 3G (PUB-3).
- **SE1+SE2** guide-sammanslagning beslutad i `kannibalisering.md`, men blockerad av SE4 tills `vercel.json` får ett ja.
- **Rester utan blockering** (R447): supabase-js-versionerna.
- **MK2** SCB:s lönestrukturstatistik är öppen och gratis — hämtning kan byggas.
- **Spår KF (2026-10-18), utan beslut:** KF5 deltagarens bekräftelse av planen (S–M), KF6 AI-sammanfattning för konsulenten (M, art. 9-grind), KF7 LinkedIn-PDF → CV i webbläsaren (S–M), KF2 faktureringsunderlag (M, läs AF:s anvisning först), KF3 utredning av export till Treserva/Combine/Lifecare. Fas 1 börjar dock med **SSO1** och **KSL25-MFA**, som inte är byggda.

## 4. Pausat eller avslutat med flit
- **STA / Steg till arbete** — arkiverad 2026-09-12 (`archive/2026-09-sta/`). Bygg inte "för STA".
- **EU-utlysningsspåret 26-001/002/010** — avslutat 2026-09-12; edge-funktionerna raderade.
- **PF3** Supabase Pro — pausat tills första kommunen säger ja (2026-09-27).
- **DE5** inaktivitetsvarning — inte aktuell före 2027-08.
- **Visuella regler** (hjältar, gradienter, en hubbfärg) — upphävda av Mikael 2026-10-09 för Jobin-staden; ärlighet och WCAG gäller.
- **Premium 99 kr/mån via Stripe (spår P)** — beslutat 2026-09-10, inget byggt; ordning köp, grind i båda backenderna, landningssidor.
- **STA-/EU-doc** (`docs/sta-*`, `docs/26-*`) — vilande bilagor.
