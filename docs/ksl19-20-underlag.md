# KSL19 + KSL20 — premiss, källor och byggordning (kslresearch, 2026-10-12)

Märkning: **[Belagt]** = jag läste primärkällan i dag (URL). **[Kod]** = läst i repot / prod-schemat i dag. **[Äldre]** = ttagit från gårdagens research (`research-kommun.md`, `research-rm.md`, session c93fd2c0) och inte läst om i dag. **[Ej belagt]** = säger jag rakt ut.
Inga filer i repot ändrade.

---

## 0. Kort

- **Paragrafnumren stämmer, men lagen heter nu 2025:400 och kapitlet är 12 kap., inte 4 kap.** Uppgiftens "4 kap." gäller gamla SoL 2001:453. [Belagt] https://lagen.nu/2025:400 : 12 kap. 4 a § ("ska socialnämnden begära … delta i aktiviteter som anges i 6 a §" efter tre månaders försörjningsstöd), 12 kap. 4 d § ("får begära" före tre månader), 12 kap. 4 f § (uppehåll upp till fyra veckor per kalenderår), 34 kap. 11 § (verksamhetsredovisning om 4 a, 4 d, 4 e, 6 a), 34 kap. 12 § (kvartalsrapport till IVO, "anvisats aktiviteter enl…" — resten av texten hann jag inte läsa). SFS 2026:826 (https://www.svenskforfattningssamling.se/sites/default/files/sfs/2026-05/SFS2026-826.pdf), enligt sökträff: ny socialtjänstförordning 12 kap. 4–5 §§, i kraft 2026-07-01; 4 § = inget aktivitetskrav enligt 4 a/4 d för den som anvisats deltidsprogrammet förmedlingsinsatser; 5 § = rapporten till IVO delas upp efter försörjningshinder. (Läst som utdrag i sökresultat, inte hela PDF:en.)
- **Läkarintyg efter sju dagar:** [Belagt via Socialstyrelsens Meddelandeblad 4/2026 (Äldre) och SKR]. Vilken paragraf det står i är **inte belagt**: lagen.nu-läsningen gav "12 kap. 5 a §" men var ett utdrag via sammanfattande läsning och jag kunde inte citera ordagrant. Skriv inget paragrafnummer i UI-text förrän det kontrollerats mot riksdagen.se.
- **Nästan allt i KSL20 som ser stort ut är redan delvis byggt** (avvikelsevy, MSFA-underlag, uppföljningsklocka, mötesklocka). Luckorna är smalare än raderna säger: avvikelsernas format/frister, möteslängd per nivå, fristbevakning, nivå på planen.
- **Inget i KSL19-kärnan går att göra utan migration** (4 a/4 d, beslut nekad/nedsatt, avslutsorsak). Regelstöd (uppehåll, dag 8) kan göras utan migration som ren beräkning, med ett villkor (se 1.3).

---

## KSL19 — Kommun

### 1.1 4 a § / 4 d § på planen

(a) **Kod.** `activity_plans` har i prod: `forsorjningshinder, nedsattning_underlag_lamnat_at, af_registered_at, case_reference` men **ingen kolumn för anvisningsgrund** [Kod: SELECT mot information_schema 2026-10-12]. `services/ivoKvartal.ts:1-28,95-` räknar `antal_anvisade` (alla planer aktiva i kvartalet) + `antal_med_ogiltig_franvaro` + `antal_underlag_lamnat`; TSV-huvudet i `tillTsv()` (rad ~126) har just de tre kolumnerna. Ingen uppdelning 4 a / 4 d.

(b) **Källor.** IVO säger att kommunen varje kvartal ska rapportera antal anvisade samt antal som nekats eller fått nedsatt stöd för att de inte deltagit, uppdelat på försörjningshinder, inga individuppgifter, vuxna ej hushåll; fönster Q1 1–30 apr, Q2 1 jul–31 aug, Q3 1–31 okt, Q4 1–31 jan; första rapporten 1–31 jan 2027 för 1 okt–31 dec 2026 [Belagt] https://www.ivo.se/vard-omsorgsgivare/anmal-handelse-lamna-underrattelse/redovisning-och-rapportering-av-aktivitetskrav/ . IVO-sidan använder **inte** etiketterna "4 a"/"4 d" (min läsning i dag). Att anvisade ska delas på 4 a och 4 d kommer från Meddelandeblad 4/2026 [Äldre: https://www.socialstyrelsen.se/contentassets/3984f8d7808045d9a4b2eed2c09b7356/2026-10-10447.pdf — inte omläst i dag]; lagtexten 34 kap. 12 § är bara halvläst. **Kontrollera 34 kap. 12 § p. 1–3 mot riksdagen.se innan kolumnerna döps.**

(c) **Bygge.** Kräver migration: `activity_plans.anvisningsgrund text CHECK (anvisningsgrund IN ('4a','4d'))`, nullbar (äldre planer = "ej angiven", precis som `forsorjningshinder` redan hanteras med 'ej_angivet'). Utan migration finns ingen hederlig härledning (portalen vet inte när försörjningsstödet började, så 3-månadersgränsen kan inte räknas). UI: val i `TillampaMallDialog`/planhuvudet, kolumnen i IVO-TSV, `ivoKvartal.ts` får en dimension. Kommunspecifikt: visas bara med `visaIvoUnderlag`.

(d) **Storlek S–M** (1 kolumn, 1 val, ändrad räkning + test). Gör först — den rapport som kommunen ska lämna i januari 2027 kan inte bli rätt utan den.

### 1.2 Nekad/nedsatt via kvittensen till IVO-underlaget

(a) **Kod.** Kvittensen finns: `activity_plan_handovers.received_at` (+ `recipient_user_id`), RPC `kvittera_underlag(p_id)` [`services/aktivitetApi.ts:1035-1041`, migrationen `supabase/migrations/20260928_kh_underlag_till_handlaggare.sql` — triggern rad ~55 låser `received_at` till RPC:n]. UI: `components/consultant/MottagnaUnderlag.tsx:87-93` ("Kvittera mottaget"). **Det finns inget fält för handläggarens beslut.** Prod-kolumnerna på `activity_plan_handovers` saknar beslut/datum [Kod]. Det som räknas idag, `antal_med_ogiltig_franvaro`, är ett ombud: IVO frågar efter antalet som **faktiskt** nekats/nedsatts, och beslutet fattas av socialnämnden, inte av portalen (`ivoKvartal.ts:119` skriver det själv i TSV-fotnoten).

(b) **Källa.** IVO ovan: "antalet som nekats eller fått nedsatt försörjningsstöd för att de inte deltagit". Beslutsrätten ligger hos nämnden [Äldre, Meddelandeblad 4/2026 + egen princip i research-kommun §(d)5 "Jobin räknar och påminner, rekommenderar aldrig nedsättning"].

(c) **Bygg.** Kräver migration. Förslag på `activity_plan_handovers`: `decision text CHECK (decision IN ('nekat','nedsatt','ingen_atgard'))`, `decision_at date`, och en ny definer-RPC `registrera_beslut_underlag(p_id, p_decision, p_decision_at)` modellerad på `kvittera_underlag` (samma trigger-lås: bara mottagaren, bara på ej ångrat underlag). Pass-/underlagsdata ändras inte. Därefter ny räknekolumn "Nekat/nedsatt (handläggarens beslut)" i `ivoKvartal.ts`, kvartalsberoende av `decision_at` och dedupering per plan (en person en gång per kvartal). Kräver `schema:refresh` + `grants:refresh` (definer-RPC) i samma commit. Utan migration: inget — kan inte utföras ärligt; en fritextanteckning i kvittensen räknas inte.
Öppen risk: handläggare i en annan organisation än konsulenten? `recipient_user_id` är konto; policyn gäller samma org [Kod: ej verifierat i detalj, läs RLS innan bygge].

(d) **Storlek M.** Gör direkt efter 1.1 — tillsammans bildar de de tre talen IVO vill ha.

### 1.3 Uppehållsräknare och läkarintygsflagga dag 8

(a) **Kod.** Uppehåll: `grep` efter uppehåll/4 f/fyra veckor i `client/src` ger **inga träffar** utanför "uppehållstillstånd" [Kod]. Läkarintyg: bara en kryssruta, `sick_certificate_received` (`PassRad.tsx:66,205,291`, `oversiktRegler.ts:267` "Sjuk … intyget har inte kommit in") — ingen sjudagarsräkning. Frånvarotyper finns: `absent_valid/absent_invalid/sick_certified` + deltagarens egen anmälan (`absence_reason`, `absence_reported_at`).

(b) **Källor.** 12 kap. 4 f § uppehåll upp till fyra veckor per kalenderår [Belagt lagen.nu]. Läkarintyg vid sjukdom längre än sju dagar i följd, från 2026-07-01, vilket inte ändrar vad som är godtagbart skäl [Äldre: Meddelandeblad 4/2026; SKR https://skr.se/arbetsmarknad/aktivitetskravsreformen/aktivitetskravetsregelverkochforutsattningar.10401.html]. **Obelagt:** om "sju dagar" räknas kalenderdagar sammanhängande eller bara aktivitetsdagar, och vem som beslutar om uppehåll (nämnden beviljar; portalen känner inte beslutet).

(c) **Bygg.**
 - *Läkarintygsflagga:* **utan migration.** Räkna sammanhängande sjukdagar bakåt ur `activity_sessions` (`attendance='sick_certified'` eller anmäld orsak `sick`) på planen; visa lugn rad "dag 7 — intyg krävs från i morgon" och "dag 8 — intyg saknas" i `PassRad`/`oversiktRegler.ts` bredvid befintliga `sjuk_utan_intyg`. Ren funktion i `services` + test. Begränsning: bara dagar som har pass i planen syns; sjukdag utan planerat pass räknas inte (säg det i texten: "av dina inplanerade pass"). Kalenderdagsräkning måste bekräftas innan texten säger "dag 8".
 - *Uppehållsräknare:* **kräver migration för att vara sann.** Uppehåll är ett beslut av nämnden, inget pass-attribut. Förslag: tabell `activity_plan_breaks (id, plan_id, org_id, from_date, to_date, registered_by, created_at)` (RLS som `activity_plans`) eller kolumn `activity_plans.uppehall jsonb`. Räknare "X av 28 dagar använda i år" = summa av intervallens kalenderårsandel. Utan migration kunde man anta att en `activity_type`-"uppehåll" finns — den finns inte [Kod], och att tolka frånvaro som uppehåll vore att hitta på ett beslut.
 - Alla som påminnelse, aldrig beslut (kommunen beslutar).

(d) **Storlek:** läkarintygsflagga **S**; uppehållsräknare **M** (tabell + RLS + UI + planvecka som hoppar över uppehållsdagar i veckomålet — den sista biten är det som gör den till M).

### 1.4 Inskrivning och avslut med orsak + Kolada-export

(a) **Kod.** Ingen modell. `consultant_participants`: `assigned_at, assigned_by, notes, priority, last_contact_at, next_meeting_scheduled, tags` [Kod prod]. `activity_plans` har `status` (inkl. 'ended') och `end_date` men **ingen avslutsorsak** (`useAktivitetsplan.ts:122 avslutaPlan` ställer bara status). Ingen anvisande instans, ingen arbetslöshetstid, ingen insatskategori. Placeringar (`consultant_placements`) är en annan sak (person-på-plats), de har utfall 3/6 mån men gäller leverantörsspåret.

(b) **Källor.** Kolada/KKiK mäter "Resultat vid avslut i kommunens arbetsmarknadsverksamhet" (andel i arbete/studier). Riksgenomsnitt 40 % (2023) och 35 % (2024) [Äldre: Järfälla KKiK 2024 https://kolada.se/wp-content/uploads/2025/09/Jarfalla_2024_kkik.pdf]; variablerna anvisande instans, ålder, utbildning, tid utan arbete före, avslutsorsak (arbete, studier, arbetsförmågebedömning/annat uppdrag slutfört, överförd till annan myndighet, övrigt), tid i insats [Äldre: SKR 2020, https://extra.skr.se/download/18.5627773817e39e979ef5d0fe/1642497608710/7585-941-5.pdf]. Insamlingen är årsvis via SKR-enkät. **Ej belagt i dag:** Kolada-nyckeltalets KPI-id och exakta nämnare (www.kolada.se och sökningen gav bara att KKiK-insamlingen finns och att indikatorn infördes 2018). Den aktuella enkätmallen har jag inte sett — bygg exporten efter SKR:s *senaste* variabellista, inte efter denna sammanfattning. Det är en export för att kommunen själv ska kunna fylla enkäten, inte ett inrapporteringsflöde.

(c) **Bygg.** Kräver migration. Förslag: antingen kolumner på `activity_plans` (`anvisande_instans text`, `ended_reason text CHECK (...)`, `ended_note text`, `ended_at` finns som `end_date`) eller en egen `engagements`-tabell om en deltagare kan ha flera perioder/insatser (rekommenderas inte nu: en plan = en insatsperiod räcker för 1.0). Avslutsdialogen (`avslutaPlan`) får ett obligatoriskt orsaksval med kolada-kategorierna. Export: ny TSV bredvid IVO-TSV:en med antal avslut per orsak och år/kvartal, och andel arbete+studier. Mappa insatskategorier mot `placeringLabels.ts` först efter att enkäten kontrollerats.
Utan migration: bara "ej angiven"-export (alla avslut orsaklösa) — bygg inte det, det ger en siffra som ser ut som ett resultat.

(d) **Storlek L** om insatskategori, tid utan arbete och utbildning ska med; **M** om bara avslutsorsak + anvisande instans + årsexport. Rekommendation: M-versionen, sist av de fyra (IVO-kraven har deadline januari 2027, KKiK är årsvis).

### KSL19 rekommenderad ordning
1. 1.1 anvisningsgrund (S–M) + 1.2 beslut via kvittensen (M) — **en migration, en PR** (kollar mot januari 2027).
2. 1.3 läkarintygsflagga (S, utan migration) — kan göras parallellt innan migrationen körts.
3. 1.3 uppehållsräknare (M, egen migration).
4. 1.4 avslut med orsak (M) — därefter Kolada-export.
Allt som kräver migration skrivs som `.PENDING.sql` och körs först efter Mikaels ja (RLS/grants-snapshot i samma commit).

---

## KSL20 — Rusta och matcha-leverantör

Primärkällor lästa i dag: AFFS 2023:1 (https://arbetsformedlingen.se/om-oss/var-verksamhet/styrning-och-resultat/forfattningssamling-affs/gallande-forfattningar/affs-20231) och Förfrågningsunderlag Rusta och matcha 2 (FFU, https://arbetsformedlingen.se/download/18.34d34fa5193d7fc2e88286/1744094636525/ffu-rusta-och-matcha.pdf, extraherad med pdftotext). **Ej omläst i dag:** MSFA:s användarstöd (pptx), resultatöversynen/kvalitetsvillkoren, IAF 2024:12 — [Äldre].

### 2.1 Avvikelser i AF:s format och frister

(a) **Kod.** `services/avvikelserapport.ts` bygger `AvvikelseRad {datum, pass, typ, orsak, underrattad}` ur `activity_sessions` (bara leverantörsledda pass, `arLeverantorsledd`). Typtext efter KSL21: "Frånvarande, inte anmäld i förväg" / "…anmäld i förväg" / "Sjuk, intyg saknas/inkommet" (rad ~55). `AvvikelserapportKort.tsx` listar per månad, kopierar som text; `af_notified_at/af_notified_by` finns på pass (prod-schema) = markering "AF underrättad". Min dag-rad "avvikelser ej rapporterade" finns (KSL14, `oversiktRegler.ts`). **Saknas:** orsakslistan enligt AFFS, planerad tid vs frånvarotid, 15-minutersgränsen, dag-8-regeln, de fyra icke-frånvaro-avvikelserna, avvikelse från möten (läser bara pass), rättelse, fristklocka.

(b) **Källor** [Belagt AFFS 2023:1]: avvikelserapport "utan dröjsmål" (§ 10); "vid frånvaro minst 15 minuter" (bilaga); sjukdom/vård av barn: ny rapport dag 8 vid fortsatt frånvaro; avvikelsetyper: tackat nej till erbjudet arbete/aktivitet, frånvaro, kan inte tillgodogöra sig insatsen, misskötsel (§ 10 p. 1–5). Orsakslista (sjukdom, vård av barn, arbete, utbildning, annan, okänd), "första dagen"-flagga, samlad rapportering av arbete/intervju senast första vardagen veckan efter, rättelsemärkning "RÄTTELSE ååmmdd": [Äldre, från MSFA-användarstödet — inte omläst]. Vite 50 000 kr per upptäckt tillfälle för systematiska brister i avvikelserapporteringen (FFU 6.12.2, läst i dag: "Systematiska brister i avvikelserapportering enligt avsnitt 4.4"). Skärpta sanktioner för deltagare från 2026-06-01 [Äldre, AF-nyhet 2026-06-01].

(c) **Bygg.**
 - *Utan migration (S–M):* (i) visa "minst 15 minuter" — kräver pass med start/slut (`start_time/end_time` finns) → räkna frånvarotid, flagga <15 min "behöver inte rapporteras"; (ii) dag-8-påminnelse för sjuk/barn-frånvaro (samma sjukdagsräkning som KSL19 1.3 — **dela funktionen**); (iii) kopieringstexten i AFFS-ordning (orsak ur `absence_reason` som redan har sick/child_care/authority_meeting/other, planerad tid, frånvarotid, första dagen ja/nej); (iv) fristtext "ska in i MSFA utan dröjsmål" + "AF underrättad" synlig i Att göra (delvis klart: KSL14); (v) rättelsemall som kopierbar text.
 - *Kräver migration (M):* de icke-frånvaro-avvikelserna (tackat nej, kan inte tillgodogöra, misskötsel) och avvikelser från möten finns inte som data. Förslag: tabell `provider_deviations (id, org_id, plan_id, participant_id, kind CHECK (kind IN ('franvaro','tackat_nej','kan_inte_tillgodogora','misskotsel')), occurred_on, reason, first_day bool, reported_at, reported_by, correction_of uuid)`. Då kan "AF underrättad" flyttas från pass till avvikelsen och en rättelse blir en ny rad.
 - Håll i ögonen: IAF 2024:12 kritiserar leverantörer som själva bedömer skälet (otillåten myndighetsutövning) [Äldre]; KSL21 har redan tagit bort "giltig/ogiltig" i leverantörsvyn — fortsätt fakta + orsak, aldrig godtagbarhet.
 - Bygg **inte** skärmskrapning/robot mot MSFA (bara anställd personal får arbeta i systemstödet, FFU 6.12.2 [Äldre]).

(d) **Storlek:** delen utan migration **M**; tabellen **M–L**. Ordning: först kopieringsformat + 15 min + dag 8; tabell vid behov.

### 2.2 Periodisk redovisning i Mina sidors struktur

(a) **Kod.** `AvtalskravKort.tsx` ("Underlag för rapporten", rad 18-21, 109-111) är MSFA-vyn: AF-ärende-id (`case_reference`, RK40), kopiering per fält, markering "förd över" per plan och månad (`msfa_overforingar`, `services/resultatklocka.ts` `msfaApi`, RESULTAT_MSFA_FINNS = true). Texten säger redan att det inte är den periodiska rapporten (GG4). `aktivitetslogg.ts` har `periodiskaFalt()` (`aktivitetslogg.rr27.test.ts:50`). **Saknas:** aktiviteter hämtade ur den *inskickade gemensamma planeringen*, tid i 15-minutersintervall per aktivitet, distans/på plats per aktivitet, varning "aktiviteten finns inte i planeringen". Gemensam planering finns inte som objekt alls.

(b) **Källor.** Månadsvis periodisk rapport (§ 7) [Belagt AFFS]. 15-minutersintervall, distans/på plats, endast aktiviteter ur inskickad planering, planering först: [Äldre, MSFA-användarstöd https://arbetsformedlingen.se/download/18.559a5231851a832a77aa4/1745937384561/anvandarstod-mina-sidor-rusta-och-matcha.pptx — inte omläst, men ingen anledning att tro det ändrats]. Grundersättning betalas bara mot godkänd gemensam planering + periodisk rapport (FFU 5.1.1 [Äldre]).

(c) **Bygg.** Förutsätter att den gemensamma planeringen finns som data → se 2.3. Utan den kan man bara avrunda dagens tid till 15 minuter och dela distans/plats (`is_physical` finns, men "distans/på plats" per *aktivitet* kräver att aktivitetsnamnen mappas mot planeringens). **Kräver migration** (planeringsaktiviteter). Roadmap-posten NF2/RM6 är precis detta.

(d) **Storlek L** (NF2 säger "~1 vecka"; jag bedömer L eftersom det beror på 2.3). Gör efter 2.3.

### 2.3 Fristbevakning (planering / slutredovisning 5 dagar)

(a) **Kod.** Ingen. `consultant_placements` har startdatum för *placering hos arbetsgivare*, inte tjänstens start. Plan: `activity_plans.start_date`. Ingen slutredovisning, inget "dag X av placeringen", ingen nivå på planen (nivån finns bara som `consultant_placements.outcome_level`; `PlacementDialog.tsx:113-117,198` — och den är resultatnivån, inte tilldelad nivå). `resultatklocka.ts` hanterar bara uppföljning 3/6 mån + betalstatus.

(b) **Källor** [Belagt, båda i dag]: gemensam planering "senast fem arbetsdagar efter att den enskilde påbörjat en insats" (AFFS § 6); slutredovisning "senast fem dagar efter avslutad insats" (AFFS § 9 — **"dagar", inte arbetsdagar**, ordagrant; behandla som kalenderdagar tills AF bekräftat); tjänstens startdatum = elfte (11:e) arbetsdagen räknat från placeringsdagen (FFU rad 1784). Ny placeringsperiod → uppdaterad planering inom 5 arbetsdagar [Äldre, FFU 4.1.1]. Röda dagar: svensk helgkalender behövs för "arbetsdagar" — finns det en i repot? [Ej kontrollerat; sök `helgdag`/`holiday` innan bygge.]

(c) **Bygg.** Minsta ärliga version, **utan migration**: räkna fristen ur `activity_plans.start_date` + 5 arbetsdagar och visa i planhuvud + Att göra ("gemensam planering ska vara inskickad i MSFA senast fre 17 okt"). Men: portalen vet inte att planeringen skickats → kräver en kryssmarkering "inskickad i MSFA" (migration: `activity_plans.joint_planning_submitted_at timestamptz`, `final_report_submitted_at timestamptz`, `provider_level text CHECK (A/B/C)`). Utan markering blir påminnelsen en evig röd rad → då är det brus, inte hjälp. Slutredovisning: frist ur `end_date` (finns när planen avslutas) + dagar; utkastet med MSFA:s fältstruktur (huvudsaklig sysselsättning, aktiviteter, vad fungerat, fortsatt behov — alla obligatoriska enligt [Äldre]) kan byggas på journal+plan+placering **utan** AI och utan migration; kopiera-per-fält som MSFA-underlaget.
 Obs: antar att "insats påbörjad" = planens `start_date`. AFFS § 6 säger "påbörjat en insats"; om portalens `start_date` sätts före tjänstens faktiska start blir fristen fel. Verifiera hur leverantörer anger startdatum.

(d) **Storlek:** fristberäkning + kryssmarkering **S–M** (en migration); slutredovisningsutkast **M**. Hör ihop med 2.2.

### 2.4 Möteslängd per nivå

(a) **Kod.** `consultant_meetings.duration_minutes` finns och sätts (`MeetingSchedulerDialog.tsx:192`), läses i `moteskadens.ts:191,207` men **jämförs aldrig mot nivå** [Kod]. `motesklockaRegel.ts` + `moteskadens.ts` hanterar bara 14/28-dagarsgränsen. Nivå A/B/C finns inte på plan/deltagare (bara resultatnivån på placering).

(b) **Källa** [Belagt FFU, läst i dag, avsnitt 4.1.1 "Individuellt möte"]: minst 14 kalenderdagar mellan möten; **nivå A minst 30 min, B minst 45 min, C minst 60 min**; kan ske fysiskt eller på distans; handledare; "under mötet ska det individuella schemat ses över och vid behov uppdateras". Avvikelse från obligatoriskt stöd = vite 25 000 kr (FFU 6.12.2). Det första mötet fysiskt och "11:e arbetsdagen": FFU 4.3.2/rad 1784 [Äldre/delvis läst]. Distans ska ske på AF:s egen videoplattform, vite 25 000 kr (FFU 4.2) — raden "Vid individuella möten på distans inte använt AF:s plattform" läst i dag; plattformens namn **ej belagt**.

(c) **Bygg.** Kräver att nivån finns på planen/deltagaren → `activity_plans.provider_level` (samma migration som 2.3; **enda nya kolumnen behövs**). Därefter ren beräkning: möte med `duration_minutes` < nivåns minimum ⇒ flagga (och att mötet *inte räknas som uppfyllt* i kadensen, med hedrande text: "30-minutersmötet räknas inte för nivå B — kravet är 45"). Utan nivå: kan bara visa en neutral rad "Minst 30/45/60 min beroende på nivå" i bokningsdialogen, vilket är S och utan migration men inte en regel. Distansmötestypen "video" bör för leverantör heta "Distans — AF:s plattform" (textändring, S, utan migration; telefonens status som individuellt möte är **oklar** enligt FFU — fråga AF, bygg inte).
 Kolumnen `duration_minutes` är gissad/standardvärde? [Ej kontrollerat vad dialogen förifyller]. Om standardvärdet är 30 kommer alla nivå B/C-möten flaggas fel — läs `MeetingSchedulerDialog` först.

(d) **Storlek S** (efter att nivån finns) — billigaste av delpunkterna, hög träffyta mot vitet.

### 2.5 Ledningsvy mot resultatöversynen

(a) **Kod.** Ingen leverantörsspecifik ledningsvy. Organisationsmodell (KM2) och kapacitetsmätare (`caseloadKapacitet.ts`, 50 per handledare) finns; chefens fulla läsrätt via RLS (CH1). Roadmappen har CH8/CH9/CH11/CH12 öppna (chefsvy på Översikt) — gäller båda kundgrupperna. Resultat per placering och uppföljning finns (3/6 mån).

(b) **Källor** [Äldre, AF-kvalitetsvillkor 2026-01-29 https://arbetsformedlingen.se/download/18.5dcdd35b19bdebad30812de/1769681957701/kvalitetsvillkor-rusta-och-matcha.pdf, inte omläst i dag]: avtal hävs om betyg 1 (eller inget) **och** nivåviktat resultatmått under 20 % vid båda mätningarna i en resultatöversyn, efter minst 22 månaders aktivt avtal; översyn högst två gånger per år; betyg 1–4 varannan månad, relativt inom region, minst 18 startade deltagare på 12 månader. Tre enstaka viten inom 12 månader i ett leveransområde ger rätt att häva (FFU 6.12, rad ~3050 läst i dag delvis). **Obelagt:** AF:s exakta formel för "nivåviktat resultatmått" — Jobin kan alltså inte räkna fram det, bara visa underlag. Skatteverks-verifiering av resultat (lönegränser 22 000/11 000 kr) är planerat men **ej belagt som infört** [Äldre].

(c) **Bygg.** Utan migration (M, men beroende av CH8): per konsulent/kontor — andel deltagare med mötesregeln uppfylld (`moteskadens.ts` finns), andel pass med avvikelse ej rapporterade ("AF underrättad" saknas), andel placeringar med resultat registrerat/uppföljning inom tid, kapacitet. **Visa inte en egen "betygsprognos"** — formeln är AF:s. Efter 2.3/2.4 kommer "andel rapporter inom frist" och "andel möten som uppfyller nivåns längd" som egna rader.

(d) **Storlek M–L** (beror på CH8-rutan); sist.

### KSL20 rekommenderad ordning
1. **Nivå på planen + möteslängd (2.4)** — S, ger fristerna och längdkontrollen i en kolumn (`provider_level`) och tar vitet 25 000 kr. En migration tillsammans med `joint_planning_submitted_at`/`final_report_submitted_at` (2.3).
2. **Fristbevakning planering/slutredovisning (2.3)** — S–M.
3. **Avvikelser i AFFS-format (2.1, utan migration först)** — M: 15 min, dag 8 (delad funktion med KSL19 1.3), kopieringsordning, rättelsemall.
4. **Slutredovisningsutkast (2.3)** — M.
5. **Periodisk redovisning (2.2/NF2)** — L, när gemensam planering är objekt.
6. **Avvikelsetabell för övriga typer (2.1)** — M–L.
7. **Ledningsvy (2.5)** — efter CH8.

---

## Det jag inte kunnat belägga (samlat)
- Exakt lagtext/paragrafnummer för läkarintyg (7 dagar) och hela 34 kap. 12 § — kontrollera på riksdagen.se.
- Kolada-nyckeltalets KPI-id och nämnare; aktuell SKR-enkätmall.
- Om "fem dagar" i AFFS § 9 är arbets- eller kalenderdagar (texten säger bara "dagar").
- AF:s videoplattformsnamn; hur AF räknar nivåviktat resultatmått; om Skatteverksverifieringen införts; om AFFS 2023:1 ändrats efter 2023 (ingen ändringsföreskrift sedd, men inte sökt uttömmande).
- MSFA-detaljerna (orsakslista, 15-minutersintervall, dag-1/dag-8-mekanik) är från gårdagens läsning av AF:s pptx, inte omläst i dag.
- Att kodens `duration_minutes`-standardvärde och planens `start_date`-semantik passar fristerna (se 2.3/2.4).
- Hela SFS 2026:826 och förordningens 12 kap. 4–5 §§ är lästa som sökutdrag, inte i originaltext.
