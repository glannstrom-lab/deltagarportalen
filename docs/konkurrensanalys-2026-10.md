# Konkurrensanalys — oktober 2026

Research 2026-10-18: sju agenter, ~50 aktörer i fem segment (B2B Rusta och matcha/kommun,
B2C Sverige, B2C internationellt, omställning/fack, arbetsgivarsidan). Bygger vidare på
kartläggningen 2026-08-31 (artifakt 9a7528ae…, ROADMAP MK1–MK5).

**Översikt (artifakt):** https://claude.ai/artifact/3o4LALAy3jYqCjMVDzMzqq

Funktionslistan F01–F30 är hämtad ur Jobin. Jobins egen kolumn är verifierad mot koden
2026-10-18: allt J utom **F29** (bara lösenord + Google OAuth i `stores/authStore.ts`, ingen
BankID/SSO) och **F30** (data i EU, men AI-anrop via OpenRouter/Perplexity i USA).
F25 = `components/consultant/ReportGeneratorDialog.tsx` + `deltagarExport.ts`, men ingen
AF-/KA-Webbstöd-integration och ingen fakturering.

## Slutsatser

1. **Workbuster (Multisoft, 193 Mkr 2025, 122 anst., SEB PE delägare mars 2026) sitter redan
   hos kunderna** — Arcus, Iris, Propus, Täby, Academedia och **HelloLilly** (35 ROM2-avtal
   efter Lernia, deltagarportalen länkas från hellolilly.se/om-oss). Moaten är AF-beslutsimport,
   KA-Webbstöd, Peppol-fakturering och BankID. Deltagarsidan är tunn: CV/brev är **Cowrite som
   tillägg**, AI-stödet är för coachen. → Jobin kan ta Cowrites plats som deltagarsida.
2. **Wundermatch AB** (559486-9785) har exakt Jobins affär (gratis för sökande, licens för
   kommun/AF/ROM), AI-först med AI-Apply. 0,7 Mkr, 2 anst. 2025; påstår 15 % av ROM (overifierat).
3. **Aktivitetskravet (1 juli 2026)** öppnade kommunmarknaden. **Lingio AB** (38,8 Mkr, 16 anst.)
   säljer "aktivitetsplattform" till Mölndal, Stockholms Jobbtorg, Skara, Töreboda — utan
   jobbsökarverktyg.
4. **Ingen B2B-konkurrent publicerar pris.** Enda belägg: Workbuster 1 200 kr/tim extraarbete
   (villkor 2023-12-29 p. 11.2). Jobins öppna pris är ovanligt.
5. **B2C Sverige: 99–329 kr/mån.** Cowrite 179 kr/mån (gratis via ~12 fack; 7,0 Mkr, 1 anst.),
   CVMaker 329, Jobbcoach.ai 149, Genzee 99. Internationellt 8–50 USD/mån; livstid 149–299 USD.
6. **Bara Jobin har F17–F19** (dagbok, mående, energianpassning). Kontinuerlig AI-coach:
   bara Jobin och Wundermatch.
7. **Jobins luckor:** BankID, AF-integration/fakturering, annonser utanför Platsbanken,
   fler språk (Lingio 100+). Ingen aktör har EU-only AI (Cowrite kör Gemini/Anthropic i USA).
8. **Omställning** finansieras med 0,40 % (TRR) / 0,34 % (TSL) av lönesumman 2026, men kräver
   avtalsansluten arbetsgivare. **Arbetsgivarsidan** är gratis via AF; ingen har Jobins
   "konsulenten föreslår, arbetsgivaren svarar".

## Föreslagna nästa steg (ej införda i ROADMAP — beslut Mikael)

- Partnerskap/försäljning som deltagarsida till Workbuster-kunder; HelloLilly först.
- Offentlighetsbegäran om avtal/fakturor för Workbuster och Lingio hos Täby, Mölndal, Skara,
  Töreboda, Stockholms Jobbtorg — enda vägen till verkliga B2B-priser.
- BankID före fler AI-funktioner vid kommunförsäljning (jfr SSO1-beslutet).
- Bevaka Wundermatch månadsvis; testa appen som deltagare.
- Företagskontot: ta inte betalt för åtkomst; Alva Labs per-hire-modell är referensen (AG9).

## Luckor

B2B-licenspriser; årsredovisningar för TRR/TSL/TSN/TRS/Omställningsfonden; omsättning för
omställningsleverantörerna och Bold; LinkedIn Premiums SEK-pris; vad facken betalar Cowrite.
GW Arbetsmarknad, Frontit och Jobbcentrum kunde inte beläggas som aktörer. Allabolags belopp
saknar enhet för de minsta bolagen — kontrollera hos Bolagsverket före extern citering.

---

# Bilaga — segmentrapporterna i sin helhet


---

## B2B-segmentet: system och deltagarportaler för Rusta och matcha-leverantörer, AF-aktörer och kommunala arbetsmarknadsenheter (AME)

Research 2026-10-18. Verktyget (WebSearch/WebFetch) gav mycket magra träffar. Allt nedan är belagt med URL; det som inte hittades står som "ej hittad".

## Sammanfattning

1. **Närmaste B2B-konkurrent är Workbuster (Multisoft).** Sedan 2010, "över 5 000 användare" (egen uppgift), säljs till fristående aktörer (ROM 2, STA m.fl.) och till kommunala AME. Har BankID, deltagarportal, kalender, journal, aktivitetskrav, närvaro, rapporter, Peppol-fakturering, Cowrite-CV integrerat och sedan 2026 AI (deltagarprofil-sammanfattning, utkast till slutredovisning). Pris publiceras inte; avtalen säger bara "månadsavgift, höjs efter antal användare". Jobin har ingen AF-fakturering/Webbstöd-integration, och det är Workbusters moat mot leverantörer.
2. **Wundermatch (Wundermatch AB, 559486-9785) är den mest direkta nya utmanaren.** Gratis för jobbsökare, licens till kommuner, AF-kontor och ROM-leverantörer, AI-CV/brev/jobbmatchning, aktivitetskravsstöd. Egen uppgift: samarbete med 15 % av ROM-leverantörerna (efter deltagarantal). Men bolaget är pytteliten: 2 anställda, omsättning 713 (troligen tkr) 2025. Pris ej publicerat. Den positionering Jobin har (gratis för deltagare, betalt för organisationer) är i praktiken densamma.
3. **Lingio** (Lingio AB, 559004-1538) säljer "aktivitetsplattform" mot kommunernas aktivitetskrav: yrkessvenska-kurser, AI-kollega via SMS, handledarportal med rapportexport till IVO/AF. Kunder: Mölndal, Stockholms stad (Jobbtorg), Töreboda, Skara. Omsättning 38 754 (troligen tkr) 2025, 16 anställda. Pris ej publicerat.
4. **Prisläget för det Jobin säljer är okänt hos alla konkurrenter**; ingen av dem publicerar pris. Det enda hårda upphandlingsdata är för *stora* socialtjänstsystem (Treserva/CGI: 19 Mkr för service/support i Älvkarleby 2023; Göteborg uppskattat 96 Mkr), vilket är en helt annan storleksklass än Jobins 2 990 kr/mån + 290 kr/konsulent. Det bekräftar snarast att Jobin kan prissättas långt under etablerad nivå, men det är ett antagande, inte belagt.
5. **Pulsen Combine, Lifecare (Tietoevry/Visma), Procapita, Treserva är socialtjänst-/omsorgssystem, inte AME-system.** Ingen källa visar en arbetsmarknadsmodul. De är kontext (de ägs av kommunens IT/socialförvaltning, och aktivitetskravets journalföring kommer att hamna där), inte direkta konkurrenter. GW Arbetsmarknad och Frontit gick inte att belägga alls.
6. **Marknadsdriv: aktivitetskravet för försörjningsstöd trädde i kraft 2026-07-01**; kommunerna ska begära aktivitet från aktivitet för ersättning avseende oktober 2026. AF ska bygga systemstöd för informationsutbyte med kommunerna (slutredovisning 2028-01-15); regering+SKR avsatte 5 Mkr 2026 för digitala strukturer. Det skapar efterfrågan (Wundermatch och Lingio marknadsför sig explicit mot det).
7. **ROM-marknaden krymper/skärps**: AF hävde 94 leverantörsavtal i juni 2025; juli 2026 finns 622 avtal, 90 med högsta betyg och 89 med lägsta. Lernias matchningsverksamhet övertogs av HelloLilly 2026-03-01 (35 ROM2-avtal, 62 orter). Färre, större leverantörer är tänkbara köpare av ett verktyg men också mer benägna att ha Workbuster.
8. **Konkurrensbild AI:** Workbuster lanserade sina första AI-funktioner (2025/2026, datum ej angivet); Wundermatch är AI-först. Jobins differentierare (tal-intervjuträning, kompetensgap, intresseguide, energianpassning/kognitiv tillgänglighet) saknas hos båda enligt deras sajter.

## Pristabell

| Aktör | Prismodell | Konkret pris (datum sett) | Källa |
|---|---|---|---|
| Workbuster (Multisoft) | Månadsavgift (betalas i förskott), justeras uppåt efter antal användare; tilläggsbeställningar separat; Peppol-koppling gratis | Inget belopp publicerat. Allmänna villkor 2020 version enligt sökresultat: 1 200 kr/tim för extra arbete (ej verifierat i originalet, PDF:en gick inte att läsa fullt). Sett 2026-10-18 | https://workbuster.com/fristaende-aktorer/ , https://workbuster.com/wp-content/uploads/2023/12/matcha-allmanna-villkor-och-pub-avtal-20231229-1-ka.pdf |
| Wundermatch | Licensavgift från kommuner, AF-kontor, ROM-leverantörer; gratis för jobbsökare | Ej publicerat. "Kontakta oss för kostnadsfri konsultation" (2026-10-18) | https://www.wundermatch.ai/om-oss , https://www.wundermatch.ai/arbetsmarknadssystem |
| Lingio | Okänt (demo/konsultation) | Ej publicerat (2026-10-18) | https://www.lingio.com/sv/aktivitetskraven-2026 |
| Treserva (CGI) | Licens (obegränsad tid, Göteborg) + service/support | Älvkarleby 2023-07-06: service/support, totalvärde 19 000 000 SEK exkl. moms (ett anbud, direktupphandling utan annonsering; avtalstid ej angiven). Göteborg: uppskattat värde support/underhåll 96 MSEK exkl. moms (TED; ingen slutsumma) | https://ted.europa.eu/en/notice/418179-2023/pdf , https://ted.europa.eu/ (Göteborg-notis nämnd via sökresultat; ej själv öppnad) , https://www4.goteborg.se/prod/intraservice/namndhandlingar/samrumportal.nsf/1B7DF8BBB8F95D1DC1258CA0002C5D0D/$File/19.%20Direktupphandling%20support%20och%20underhallsavtal%20Treserva.pdf |
| Stockholm Arbetsmarknadsförvaltningen, verksamhetssystem Förvaltarenheten (god man, inte AME) | Upphandling 2024, 4+2+1+1 år | Budgettak 4 Mkr inkl. optioner (förkastar anbud över) | https://meetingspublic.stockholm.se/welcome-sv/namnder-styrelser/arbetsmarknadsnamnden/mote-2024-10-01/agenda/uhd-verksamhetssystem-till-forvaltarenhetenpdf?downloadMode=open |
| Piteå (Pulsen Combine, socialtjänst) | -- | Införandet gav ca 3,2 Mkr extrakostnader jan-aug 2024 (mest hälsa/sjukvård) | https://www.mynewsdesk.com/se/pitea/pressreleases/delaarsrapportering-och-budgetuppfoeljning-under-hoestens-foersta-socialnaemnd-3341115 |
| Jobbcoach.ai (konsument, referens) | Freemium | Premium 149 kr/mån (2026-10-18). Inget organisationserbjudande angivet | https://www.jobbcoach.ai/artiklar/ai-rekrytering-sverige |

Inget kommunalt tilldelningsbeslut eller avtalsvärde för Workbuster, Wundermatch eller Lingio hittades (sökning på nämnder, TED, Mercell/e-Avrop via sökmotor gav inget). Rekommendation: sök direkt i kommunernas diarier (Täby, Mölndal, Töreboda, Skara) på "Workbuster"/"Lingio" eller ställ offentlighetsbegäran.

## Omsättningstabell

| Bolag | Org.nr | Omsättning | År | Anställda | Typ/källa |
|---|---|---|---|---|---|
| Multisoft AB (Workbuster-ägare) | 556596-4011 | 193 135 tkr (+7,7 %); resultat 22 462 tkr | 2025 | 122 | Rapporterad (Syna) https://upplysningar.syna.se/foretag/5565964011/multisoft-ab |
| Multisoft Group | -- | ca 250 Mkr; >400 kunder | 2026-03-09 | ej angivet | Pressuppgift SEB PE (SEB tar majoritet) https://sebgroup.com/sv/asset-management/nyheter-asset-management/2026/seb-private-equity-blir-ny-agarpartner-till-multisoft-group |
| Workbuster Matcha AB (f.d. Grade Matcha AB) | 559458-0994 | 21 483 (enhet ej angiven på sidan, troligen tkr) | 2025 | 0 | Rapporterad (Allabolag) https://www.allabolag.se/bransch-s%C3%B6k?q=workbuster ; förvärv klart 2024-01-31 https://www.multisoft.se/kunskapsbank/multisoft-forvarvar-workbuster-matcha/ |
| Wundermatch AB | 559486-9785 | 713 (troligen tkr) | 2025 | 2 | Rapporterad (Allabolag) https://www.allabolag.se/bransch-s%C3%B6k?q=wundermatch |
| Lingio AB | 559004-1538 | 38 754 (troligen tkr) | 2025 | 16 | Rapporterad (Allabolag) https://www.allabolag.se/bransch-s%C3%B6k?q=lingio |
| HelloLilly AB | 559268-3840 | 30 034 (troligen tkr) | 2024 (före Lernia-övertagandet) | 38 | Rapporterad (Allabolag) https://www.allabolag.se/bransch-s%C3%B6k?q=hellolilly |
| CGI Sverige AB (Treserva) | 556337-2191 | ej hittad | -- | -- | -- |
| Pulsen, Visma (Procapita/Lifecare), Tietoevry, Frontit, GW Arbetsmarknad | -- | ej hittad / ej verifierat att de säljer AME-system | -- | -- | -- |

Enheter: Allabolag-sidorna anger inte enhet. Jämför Multisoft, där Syna uppger kSEK; Workbuster Matcha AB på 21 483 passar som tkr (≈21 Mkr) men är inte bekräftat. Ägarstruktur Multisoft: Segulah Fund V köpte majoritet (Börsvärlden), SEB Private Equity blev ny ägarpartner 2026-03-09. Workbusters omsättning kan ha lagts i Multisoft AB efter förvärvet, så 21 483 kan vara en kvarvarande bolagsskugga snarare än produktens verkliga intäkt.

## Funktionsmatris (J = ja, D = delvis, N = nej, ? = okänt/ej belagt)

Bedömningen bygger enbart på aktörernas egna sajter 2026-10-18; "N" betyder att sajten inte nämner det, inte att det bevisats saknas.

| Nyckel | Workbuster | Wundermatch | Lingio | Treserva/Combine/Lifecare/Procapita |
|---|---|---|---|---|
| F01 CV-byggare mallar | D (Cowrite-CV) | J | N | N |
| F02 CV-export PDF | ? | ? | N | N |
| F03 CV-uppladdning+tolkning | ? | ? | N | N |
| F04 AI-brev | D (Cowrite) | J | N | N |
| F05 AI-intervjuträning | ? | ? | N | N |
| F06 Kompetensgap | ? | D (AI-kartläggning) | D (kurser) | N |
| F07 Intresse-/yrkesguide | ? | D | N | N |
| F08 LinkedIn | ? | ? | N | N |
| F09 Kontinuerlig AI-coach | N | J ("AI-coach" i konversation) | D (AI-kollega via SMS) | N |
| F10 Spontanansökan | ? | ? | N | N |
| F11 Jobbsökning i annonser | D (matchning) | J (hundratals källor, ej bara Platsbanken) | N | N |
| F12 Jobbevakning e-post | ? | J (dagliga notiser) | N | N |
| F13 Ansökningstracker | ? | D (loggar aktiviteter) | N | N |
| F14 Lönestatistik | N | ? | N | N |
| F15 Utbildningssökning | N | ? | D (egna kurser) | N |
| F16 Kunskapsbank | N | D ("guide") | D (kurser) | N |
| F17 Dagbok/reflektion | N | J (aktivitetsloggar och reflektioner) | N | N |
| F18 Mående/energilogg | N | ? | N | N |
| F19 Energianpassning/kognitiv tillg. | N | ? | ? | N |
| F20 Kalender | J | ? | N | D |
| F21 Konsulentvy | J | J (handläggare) | J (handledarportal) | J (handläggare) |
| F22 Aktivitetskrav/närvaro | J | J (aktivitetskravsstöd) | J (aktivitetskrav, timmar) | ? (ej belagt) |
| F23 Journal | J | D (journalföring nämnd) | N | J |
| F24 Meddelanden | J (SMS/e-post/portal) | J | D (SMS/påminnelser) | D |
| F25 Rapporter/export | J (AF-rapporter, dashboard) | J (månadsrapporter) | J (IVO/AF-export) | D |
| F26 Arbetsgivarvy | D (arbetsgivarkontakter samlade) | ? | N | N |
| F27 Flera språk/lätt svenska | D (sv/en) | ? | J (100+ språk) | N |
| F28 WCAG uttalad | ? | ? | ? | ? |
| F29 BankID/SSO | J (mobilt BankID) | ? | N (SMS utan lösenord) | J |
| F30 EU-lagring/GDPR uttalad | D (PUB-avtal, GDPR-stöd; plats ej angiven) | ? (policy finns) | ? | J |

Extra funktioner hos Workbuster som Jobin saknar: AF-beslutsimport (Excel/Webbstöd), självfakturering/Peppol, Fortnox/Qvalia, resultatuppföljning (resultatersättning), API.

## Aktörsprofiler

### Workbuster / Multisoft (Sverige)
- **URL:** https://workbuster.com ; deltagarinlogg https://secure.workbuster.com/portal/login. **Ägare:** Workbuster Matcha AB (559458-0994) i Multisoft-koncernen (Multisoft AB 556596-4011, Stockholm; Segulah-majoritet, SEB PE ny ägarpartner mars 2026). Förvärvade Grade Matcha ("Workbuster") 2024-01-31 av Grade.
- **Vad:** Stödsystem för fristående aktörer (ROM 2, STA, FUB/AUB, Starta eget, karriärvägledning, TSL, Komvux) och för kommunala AME. Egen uppgift: i drift sedan 2010, 4 000-5 000+ användare (handläggare). Kunder nämnda: Täby, Folkuniversitetet, Arbetscentralen, Academedia, Effektiv Matchning AB. Betalare: leverantören/kommunen.
- **Funktioner (egna påståenden):** dokumentationsmallar, påminnelser, SMS/e-post, mobilt BankID, rollbehörigheter, GDPR-stöd, beslutsimport från AF, Peppol-fakturering, dashboard, åtgärdscenter, AI (deltagarprofil, utkast slutredovisning), Cowrite-CV, jobbmatchning, API, kalender, aktivitetskrav, närvaro, journal.
- **Pris:** ej publicerat (se pristabell). **Omsättning:** se tabell.
- **Mot Jobin:** (+) Etablerad, AF-integrerad, fakturering och resultatuppföljning, BankID; (+) ägd av PE-backat bolag med 122 anställda. (-) Ingen publik info om AI-coach, intervjuträning, kompetensgap, intresseguide, energianpassning, mående; verkar vara ett *handläggarsystem* mer än ett deltagarverktyg (deltagarportalens innehåll beskrivs inte); (-) Inget pris synligt, så Jobins öppna 2 990 kr/mån kan vara ett säljargument. Cowrite är deras CV-motor, alltså beroende av tredje part.
- **Källor:** https://workbuster.com/fristaende-aktorer/matcha-arbetsmarknadsenheten/ , https://workbuster.com/fristaende-aktorer/rusta-och-matcha/ , https://workbuster.com/en/private-providers/ , https://www.multisoft.se/en/system-solutions/workbuster-part-of-multisoft/ , https://www.multisoft.se/kunskapsbank/workbuster-lanserar-ai%e2%80%91stod-for-en-enklare-och-mer-effektiv-arbetsdag/ , https://workbuster.com/security/ .

### Wundermatch (Sverige)
- **URL:** https://www.wundermatch.ai . **Bolag:** Wundermatch AB, 559486-9785, Skeppargatan 6, Stockholm. VD Nicklas Kull; fyra grundare; ängelinvesterare, ej VC/koncern (egen uppgift). Nystartat (bildat ca 2024/25, ej angivet), men skriver "10+ års erfarenhet av arbetsmarknadssystem".
- **Vad:** AI-karriärcoach-app (gratis för arbetssökande) plus "arbetsmarknadssystem" (fly.wundermatch.ai) för kommuner, AF-kontor, ROM-leverantörer och fackförbund. Betalare: organisationer via licens.
- **Funktioner:** AI-matchning mot jobb från hundratals källor, CV/brev/kompetensbevis via AI-konversation, AI-Apply (fyller i ansökningsformulär), aktivitets- och reflektionslogg, månadsrapporter, ärendehantering med digital signering, handlingsplaner, aktivitetskravsuppföljning, meddelanden, trattanalys, integrationer mot befintliga verksamhetssystem.
- **Siffror:** egen uppgift 15 % av ROM-leverantörerna (efter deltagarantal), användare loggar in 18 ggr/mån, +5 %/vecka. Omsättning 713 tkr(?) 2025, 2 anställda: skalan är liten och ROM-påståendet ej verifierat.
- **Mot Jobin:** (+) Samma modell och samma segment, AI-först, AI-Apply, fackförbundskanal; (+) Hävdar redan ROM-kunder. (-) Mycket litet bolag; ingen publicerad info om BankID/GDPR/EU-lagring/tillgänglighet; (-) Saknar enligt sajten intervjuträning med tal, kompetensgap, intresseguide, energianpassning (ej uttryckligen nämnt). Närmast att bevaka.
- **Källor:** https://www.wundermatch.ai/ , /kommuner , /arbetsmarknadssystem , /om-oss (alla sedda 2026-10-18); https://www.allabolag.se/bransch-s%C3%B6k?q=wundermatch

### Lingio (Sverige)
- **URL:** https://www.lingio.com . **Bolag:** Lingio AB, 559004-1538, Stockholm; 16 anställda, omsättning 38 754 (tkr?) 2025.
- **Vad:** Utbildningsplattform (yrkessvenska, kompetenskurser, AI-kollega via SMS, AI-kursskapare) omstöpt som "aktivitetsplattform" för det kommunala aktivitetskravet (upp till 40 tim/vecka), med handledarportal. Betalare: kommun.
- **Kunder (egna):** Mölndal, Stockholms stad (Kista Jobbtorg, Jobbtorget), Töreboda, Skara; vann en Skolverket-upphandling (detaljer saknas).
- **Pris:** ej publicerat. **Mot Jobin:** (+) Redan inne hos kommuner, 100+ språk; (-) Inte jobbsökarverktyg (inga CV/brev/jobbsökning); komplement snarare än direkt konkurrent, men tävlar om samma aktivitetskravsbudget.
- **Källor:** https://www.lingio.com/sv/aktivitetskraven-2026 , https://www.allabolag.se/bransch-s%C3%B6k?q=lingio

### HelloLilly AB (Sverige): kund/ROM-leverantör, inte mjukvarukonkurrent
- Org.nr 559268-3840, 38 anställda, omsättning 30 034 (tkr?) 2024. Tog 2026-03-01 över Lernia Utbildnings matchningsverksamhet inkl. ROM2-avtal; efter det 35 ROM2-avtal på 62 orter. Plausibel stor kund-prospekt (en leverantör som just integrerat ny personal/orter). Använder okänt system (ej belagt).
- **Källor:** https://arbetsformedlingen.se/for-leverantorer/nyheter-for-leverantorer/nyheter-for-leverantorer/2026-02-27-hellolilly-tar-over-delar-av-lernias-matchningsverksamhet

### Socialtjänstsystem: Treserva (CGI), Pulsen Combine, Lifecare/Procapita (Tietoevry/Visma)
- Verksamhetssystem för socialtjänst/omsorg/LSS/HSL, ägda av kommunens IT/social. Ingen källa visar en arbetsmarknadsmodul eller deltagarportal för arbetssökande. Relevant bara för att aktivitetskravets journalföring och försörjningsstödsärenden ligger där, och att Jobin då kan behöva exportera/integrera mot dem.
- Upphandlingsdata: Älvkarleby kommun 2023, Treserva-support, 19 MSEK, ett anbud. Göteborg: Treserva-supportavtal gick ut maj 2025, upphandling avbröts (överprövning, ett anbud), direktupphandling som brygga; EU-notis om 96 MSEK. Piteå: Pulsen Combine 3,2 Mkr extrakostnad.
- Frontit och "GW Arbetsmarknad": ingen träff, kunde inte beläggas som aktörer inom segmentet.

### Marknadskontext: AF
- **Rusta och matcha 2 (ROM2)**, upphandling Af-2025/0017; AF hävde 94 avtal juni 2025; juli 2026 betyg: 622 avtal, 90 högsta betyg, 89 lägsta (min 18 startade deltagare för betyg). Leverantörer administrerar deltagare i AF:s systemstöd (integration) och kopplar till faktura från eget ekonomisystem. IFAU/AF-utvärdering: inga bestående effekter på inkomst/sysselsättning men högre kostnad; 2025-budget sänkte medel till matchningstjänster. KA-Webbstöd/Rekvirera är leverantörernas självfaktureringsgränssnitt; Workbuster läser dessa filer.
- **Aktivitetskravet:** i kraft 2026-07-01; AF delar handlingsplan/aktiviteter med kommunen sedan juli; AF-uppdrag om systemstöd, slutredovisning 2028-01-15; regeringen+SKR 5 Mkr 2026.
- **Källor:** https://arbetsformedlingen.se/for-leverantorer/nyheter-for-leverantorer/nyheter-for-leverantorer/2026-07-30-uppdaterade-betyg-i-rusta-och-matcha---juli , https://arbetsformedlingen.se/for-kommuner/aktivitetskrav-for-mottagare-av-forsorjningsstod , https://www.regeringen.se/pressmeddelanden/2026/03/overenskommelse-for-att-stodja-kommunernas-inforande-av-aktivitetskravet/ , https://news.cision.com/se/arbetsformedlingen/r/arbetsformedlingen-beraknar-hava-ett-hundratal-avtal-med-leverantorer,c4123928 , https://data.riksdagen.se/dokument/HC12303.html

### Konsumentnära jämförelser (utanför segmentet, noterade)
- Cowrite (gratis för fackmedlemmar i bl.a. Unionen, Kommunal, Vision; integrerat i Workbuster för ROM): https://cowrite.com/sv/integritetspolicy/ ; Jobbcoach.ai (149 kr/mån premium, ej B2B); Matchajobb, Jobmatch.ai (konsument). Dessa täcks av andra segment.

## Luckor och rekommenderade nästa steg
- Inget publicerat B2B-pris hittat hos någon konkurrent; hämta via offentlighetsbegäran/diarium (Täby, Mölndal, Töreboda, Skara) eller be om offert som "kund".
- Ej belagt: GW Arbetsmarknad, Frontit, Jobbcentrum, Hogia-modul, Mentor, "Jobstep" (hittades bara en amerikansk karriärtjänst). Dessa kan vara fel namn; ingen svensk AME-/ROM-leverantör med dessa namn dök upp.
- Allabolag-beloppen saknar enhetsangivelse; verifiera genom Bolagsverket/proff.se.
- Workbusters PDF-villkor var inte fullt läsbara; uppgiften 1 200 kr/tim kommer från sökmotorns sammanfattning av 2020-versionen och bör kontrolleras.

## Komplettering: priser

Sökt 2026-10-18 (WebSearch/WebFetch, 10 sökningar + 4 sidhämtningar). **Resultat: inget kronbelopp för licens/abonnemang hittades för Workbuster, Wundermatch eller Lingio.** Inga nämndprotokoll, tjänsteskrivelser, tilldelningsbeslut eller TED/Mercell-notiser som nämner dem kom upp. Inget är påhittat; luckor är markerade.

| Aktör | Köpare | Belopp | Vad ingår / period | Datum | Källa och citat |
|---|---|---|---|---|---|
| Workbuster (Grade Matcha, villkorsversion 2023-12-29) | Alla kunder (standardvillkor) | **1 200 kr per timme** (exkl. moms) för arbete Workbuster har rätt att debitera (pkt 11.2). Verifierat i originalet (PDF-text extraherad lokalt); rättar b2b.md ovan där det stod "ej verifierat" | Extra arbete utanför abonnemanget | 2023-12-29 | https://workbuster.com/wp-content/uploads/2023/12/matcha-allmanna-villkor-och-pub-avtal-20231229-1-ka.pdf : "Om Grade Matcha har rätt till ersättning för utfört arbete ska detta debiteras med 1200 kr per timme." |
| Workbuster (villkorsversion 20200302-2) | Alla kunder | Samma 1 200 kr/tim (pkt 11.2). Abonnemang: "varje kvartal i förskott" (2020) mot "varje månad i förskott" (2023) | Abonnemangsavgift justeras upp efter antal användare vid faktureringstillfället; belopp ej angivet | 2020 / 2023 | https://workbuster.com/wp-content/uploads/2023/01/workbuster-allmannavillkorochpersonuppgiftsbitradesavtal.pdf : "Kund skall erlägga abonnemangsavgift ... varje kvartal i förskott"; 2023-PDF: "varje månad i förskott". Ansvarstak 25 % av betald abonnemangsavgift senaste 12 mån |
| Wundermatch | Kommuner/AF/ROM | Ej publicerat. Enda prisrelaterade text: "Boka kostnadsfri demo" | -- | 2026-10-18 | https://www.wundermatch.ai/kommuner (inget pris, ingen plan) ; kontakt hej@wundermatch.ai |
| Lingio (aktivitetsplattform) | Kommuner | Ej publicerat. Lingios Skolverket-upphandling (äldreomsorgsspråk) är **gratis för kommuner** i Västerbotten, Norrbotten, Västernorrland, Jämtland: annan produkt, men visar att Lingio använder statligt finansierad gratisinsats som säljingång | -- | 2026-10-18 | https://www.lingio.com/sv/blogg/starkt-sprak-ger-starkare-omsorg ; https://www.lingio.com/sv/aktivitetskraven-2026 |
| Uppsala arbetsmarknadsnämnd (kontext, ej plattformspris) | -- | Direktörens delegation för DIS/direktupphandling föreslås höjd 1 000 000 -> 1 500 000 kr | Gäller aktivitetskravsplaceringar, nämner ingen plattform | 2026-08-13 | https://www.uppsala.se/contentassets/2ae3cbb5cf114cee8387ef761d6d4586/5.-revidering-av-arbetsmarknadsnamndens-delegations--och-arbetsordning-2026-augusti.pdf |
| Regering+SKR (kontext) | Kommunerna | 5 Mkr 2026 för digitala strukturer kring aktivitetskravet (redan i b2b.md) | Delas av alla 290 kommuner | 2026-03 | https://www.regeringen.se/pressmeddelanden/2026/03/overenskommelse-for-att-stodja-kommunernas-inforande-av-aktivitetskravet/ |

Slutsatser:
- Det enda belagda priset i hela segmentet är Workbusters **timdebitering 1 200 kr** (och att abonnemanget skalar med antal användare). Det tyder på att abonnemangsmodellen är per användare, men beloppet per användare är okänt.
- Omsättning delat på användare ger en grov ram för Workbuster: 21 483 tkr (Workbuster Matcha AB, osäker enhet) / "över 5 000 användare" = ca 4 300 kr per användare och år, ca 360 kr/mån. Detta är min egen räkning på två osäkra uppgifter (egen användaruppgift, omsättning kan ligga delvis i Multisoft AB), inte ett belagt pris. Det ligger nära Jobins 290 kr/konsulent/mån.
- Nästa steg för riktiga priser: offentlighetsbegäran/diariesökning hos Täby, Mölndal, Töreboda, Skara och Stockholms stad (Jobbtorg) på "Workbuster"/"Lingio" (avtal, faktura, upphandlingsunderlag); eller ring som kund och be om offert. Sökmotorn indexerar inte kommunala PDF:er väl.

---

## Konkurrens B2C Sverige — verktyg som arbetssökande själva använder (research 2026-10-18)

Metod: WebFetch mot tjänsternas egna sidor och allabolag.se; WebSearch för upptäckt. Webbsökningsverktyget är svagt (US-baserat), så flera tjänster (Zety, Indeed, StepStone, Jobtip, LinkedIn, Academic Work, Resumé.se) gick inte att verifiera i detalj. Det som inte är belagt står som "ej hittad" / "?". `*` = allmänt känt men INTE verifierat i den här körningen.

## Sammanfattning

1. **Cowrite är den enda direkta konkurrenten med fackdistribution.** Priserna 99 / 179 / 399 kr är nu BEKRÄFTADE på cowrite.com/sv (engångs-PDF 99 kr, månad 179 kr, kvartal 399 kr). Gratis för medlemmar i Unionen, Kommunal, Vision, Sveriges Ingenjörer, Akavia, Vårdförbundet m.fl. (Cowrite uppger 2,3 milj medlemmar; Akavias sida bekräftar "gratis i sex månader som medlem"). Omsättning räkenskapsår t.o.m. mars 2026: 6 951 tkr, resultat 995 tkr, 1 anställd (allabolag). Litet bolag, men fack-kanalen är en stor distributionsfördel mot Jobin.
2. **Betalmodellen i B2C är låg: 49–329 kr/mån eller per dokument.** Genzee 99 kr/mån eller 49 kr/dok, Jobbcoach.ai 149 kr/mån, Cowrite 179 kr/mån, CVMaker Pro 329 kr/mån (14 dagar för 19 kr, därefter auto-förnyelse). Kickresume 8–24 EUR/mån. Jobin är gratis för deltagare, så pris är inte differentiatorn mot dessa.
3. **Ingen B2C-aktör täcker konsulent-/aktivitetskravsdelen (F21–F25) eller energi/mående/lätt svenska (F18–F19, F27).** Det är Jobins vita fläck — B2C-verktygen är CV/brev/jobbmatchning.
4. **AF/Platsbanken är gratisalternativet för annonssökning och bevakning** och har CV-mallar, tre brevmallar och intresseguiden "Vilket yrke passar dig?". AF har (i det jag hittade) inget eget AI-verktyg för CV/brev — bara rådsartiklar om AI (2024, feb 2026). Yrkeskompassen, "Mitt jobbsökande" och Jobbsökarsidan gick inte att verifiera som namngivna tjänster.
5. **Jobbsafari (Duunitori Group) är den största kommersiella jobbsajten med B2C-ingång**: 91 110 tkr omsättning 2025, 49 anställda, AI-sökassistent "Josi", jobbevakning. Förvärvad av Duunitori Group dec 2024.
6. **Nya svenska AI-småaktörer finns** (Jobbcoach.ai med 412+ konton, Jobbmatch.ai 10 000+ testat, Genzee, CVpaketet, CraftIT) — alla med gratisnivå, ingen visar årsredovisning. SVT granskade i maj 2026 en nystartad "söker jobb åt dig"-tjänst som skrev fel ort i brev — kvalitetsrisk i autoapply.
7. **Monster är borta på Europa-nivå (stängde 2025; monster.de pekar nu på LiveCareer/Bold)**; Sverige-specifik bekräftelse hittades inte. Zety/LiveCareer (Bold) är den globala CV-jätten (Bold-omsättning bara uppskattad $200–500M, Similarweb).
8. **Hot mot Jobin = AI-tjänster för enskilda (Cowrite via facket, ChatGPT), inte AF.** Svagheter hos dem: ingen coachning över tid, ingen anpassning för långtidsarbetslösa, ingen konsulentkoppling.

## Pristabell (sedda 2026-10-18 om inget annat anges)

| Aktör | Modell | Priser | Källa |
|---|---|---|---|
| Cowrite | Betala vid nedladdning; gratis via ~fackförbund | Enstaka PDF 99 kr; månad 179 kr; kvartal 399 kr (~133 kr/mån). Gratis konto + förhandsvisning. (Cowrites egna SEO-sidor nämner även "83–99 kr/mån vid årsbetalning" — ej sedd på prissidan) | https://www.cowrite.com/sv ; https://cowrite.com/sv/basta/basta-ai-verktyg-jobbsokande/ |
| Cowrite via Akavia | Medlemsförmån | Gratis i 6 månader för medlem | https://www.akavia.se/medlemskapet/medlemsformaner/experthjalp-soka-jobb/ai-verktyg-skriva-cv-och-personligt-brev/ |
| CVMaker.se (CV Maker B.V.) | Freemium + abonnemang | Basic 0 kr; Pro 329 kr/mån; 14 dagars prov 19 kr, förnyas automatiskt | https://www.cvmaker.se/priser |
| Kickresume | Freemium | Gratis; 24 EUR/mån; 18 EUR/mån (54 EUR/kvartal); 8 EUR/mån (96 EUR/år). Gratis för studenter | https://kickresume.com/en/pricing/ |
| Zety / LiveCareer (Bold) | Prenumeration | Ej hittad (livecareer.se visar ingen prisinfo; zety-sidor timeout/404) | https://livecareer.se |
| Jobbcoach.ai | Freemium | Gratis (3 mallar, 1 CV-analys, brev 1/vecka, 10 coachfrågor); Premium 149 kr/mån, ingen bindning | https://www.jobbcoach.ai |
| Genzee.ai (AI Technologies Sweden AB) | Prenumeration/styck | 99 kr/mån eller 49 kr per dokument | https://genzee.ai/ |
| CVpaketet | Gratis (betalplaner "planerade") | Bas 49 / Plus 99 / Premium 199 kr — ej köpbara ännu | https://www.cvpaketet.se/ |
| Jobbmatch.ai | Gratis att testa | Pris ej angivet | https://jobbmatch.ai/ |
| CraftIT | ? | Pris ej angivet | https://craftit.app/en/jobb |
| Jobbsafari | Gratis för sökande; arbetsgivare betalar | Pris ej angivet | https://www.jobbsafari.se |
| Platsbanken / AF | Gratis (offentlig) | 0 kr | https://arbetsformedlingen.se/platsbanken/ |
| LinkedIn Premium Career | Prenumeration | OBEKRÄFTAT. Breakcold (blogg): 299,99 SEK/mån, ~2 398,88 SEK/år; Subger: referens 39,99 USD/mån; ClickUp: ~29,99 USD. LinkedIns egen sida visar belopp men det gick inte att läsa ut | https://www.breakcold.com/sv/blog/linkedin-premium-priss%C3%A4ttning ; https://subger.com/sv/service/linkedin-premium-nordic |
| Indeed | Gratis för sökande | 0 kr (arbetsgivare betalar) — ej verifierat på svenska sidan (403) | — |
| StepStone SE, Jobtip, Academic Work-appen, Resumé.se | Ej verifierade | stepstone.se onåbar; Jobtip är rekryteringsmarknadsföring för arbetsgivare (ej B2C); Academic Work-app ej funnen | https://jobtip.com/ |

## Omsättningstabell

| Aktör | Bolag / org.nr | År | Omsättning | Status | Anställda | Källa |
|---|---|---|---|---|---|---|
| Cowrite | Cowrite AB, 556965-8502 | FY t.o.m. 2026-03 | 6 951 tkr (resultat e. fin. 995 tkr; tillgångar 2 088 tkr) | Rapporterad (allabolag/UC) | 1 | https://www.allabolag.se/5569658502 |
| Jobbsafari | Jobbsafari AB, 556813-4059 | 2025 | 91 110 tkr (resultat e. fin. −3 047 tkr; soliditet 2 %). Syna anger 88 145 tkr, avvikelse oförklarad | Rapporterad (allabolag/UC) | 49 | https://www.allabolag.se/5568134059 ; https://upplysningar.syna.se/foretag/5568134059/keeparo-ab |
| Duunitori Group (ägare) | Finland | ej daterad | ~26 MEUR, ca en tredjedel i Sverige | Uppskattad (medgrundares LinkedIn-inlägg, ej verifierat) | ? | https://finder.techleap.nl/news/feed/duunitori-group-acquires-swedish-jobbsafari |
| CVMaker | CV Maker B.V. (NL) | — | ej hittad | — | ? | — |
| Kickresume | Kickresume s.r.o. (SK/CZ) | — | ej hittad | — | ? | — |
| Zety/LiveCareer | BOLD Limited (privat) | — | Uppskattad $200–500M (Similarweb), ej rapporterad | Uppskattad | 1 001–5 000 (Similarweb) | https://www.similarweb.com/company/bold.com |
| Jobbcoach.ai | juridiskt bolag ej angivet | — | ej hittad | — | ? | — |
| Genzee | AI Technologies Sweden AB | — | ej hittad (ej slagen upp) | — | ? | https://genzee.ai/ |
| Indeed | Recruit Holdings (JP) | FY2025 (t.o.m. mars 2026) | Indeed-segment 9,67 mdr USD (+7,6 %); Europa & övr. 2,04 mdr USD. Sverige separat: ej hittad | Rapporterad (Recruit, ej reviderad) | — | https://recruit-holdings.com/en/ir/library/upload/Recruit_202603Q4_summary_en.html |
| LinkedIn | Microsoft | — | ej hämtad | — | — | — |
| Academic Work | — | 2025 | Sverige ej hittad (finska dotterbolaget 49,8 MEUR, 745 anställda — ej B2C-relevant) | — | — | https://www.asiakastieto.fi/yritykset/fi/academic-work-consulting-oy/27336225/arvoraportti |
| Platsbanken/AF | Statlig myndighet | — | Ej tillämpligt (anslagsfinansierad) | — | — | — |

## Funktionsmatris (J = ja, D = delvis, N = nej, ? = okänt, * = ej verifierat här)

Kolumner: Cow=Cowrite, CVM=CVMaker, Kick=Kickresume, Zety=Zety/LiveCareer, JSaf=Jobbsafari, AF=Platsbanken/AF, JCoach=Jobbcoach.ai, Genz=Genzee, JMatch=Jobbmatch.ai, Craft=CraftIT, LI=LinkedIn Premium, Ind=Indeed

| # | Funktion | Cow | CVM | Kick | Zety | JSaf | AF | JCoach | Genz | JMatch | Craft | LI | Ind |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 | CV-byggare m. mallar | J (51) | J (20+) | J (40+) | J (30+) | N | D (mallar att ladda ned) | J (3 gratis) | J | D | J | N | J* |
| F02 | CV till PDF | J | J (Pro) | J | J (PDF/Word) | N | D | ? | ? | ? | ? | N | J* |
| F03 | CV-uppladdning/tolkning | J | J | J (PDF/LinkedIn) | J | N | N | D (CV-analys) | D (LinkedIn-import) | ? | ? | N | J* |
| F04 | AI-personligt brev | J | J | J | ? | N | D (3 mallar, ej AI) | J | J | J | J | N | N |
| F05 | AI-intervjuträning (tal) | J (AI-avatar) | ? | ? | ? | N | N | D (övningsprov) | N | N | N | ? | N |
| F06 | Kompetensgap mot drömyrke | D (karriärplanering) | N | D (Career Map) | ? | N | N | ? | N | N | ? | J* | N |
| F07 | Intresse-/yrkesguide | N | N | N | ? | N | J ("Vilket yrke passar dig?") | D (personlighetstest) | N | N | ? | N | N |
| F08 | LinkedIn-optimering | D (sammanfattning) | ? | ? | ? | N | N | J | D | N | N | J | N |
| F09 | Kontinuerlig AI-coach | N | N | N | N | D (Josi-sök) | N | D (10 frågor/gratis) | N | N | N | ? | N |
| F10 | Spontanansökan/företag | N | N | N | N | N | N | D ("Bli upptäckt") | N | N | N | D* | N |
| F11 | Annonssökning | J | ? | ? | ? | J | J | J (Platsbanken) | N | J | J | J | J* |
| F12 | Jobbevakning e-post | ? | ? | ? | ? | J | J | J (nattliga träffar) | N | J (notiser) | ? | J | J* |
| F13 | Ansökningstracker | ? | J | ? | ? | ? | ? | J | N | ? | ? | J* | ? |
| F14 | Lönestatistik | ? | N | N | ? | ? | N | D (lönekalkyl) | N | N | J (SCB) | J* | J* |
| F15 | Utbildningssökning | N | N | N | N | N | J (info) | N | N | N | ? | N | N |
| F16 | Kunskapsbank/guider | D | D | J | J | J (Karriärguiden) | J | D | D | N | J | D | J* |
| F17 | Dagbok | N | N | N | N | N | N | N | N | N | N | N | N |
| F18 | Mående/energi | N | N | N | N | N | N | N | N | N | N | N | N |
| F19 | Energianpassning/kognitiv tillgänglighet | N | N | N | N | N | ? | N | N | N | N | N | N |
| F20 | Kalender/planering | N | N | N | N | N | N | N | N | N | N | N | N |
| F21 | Konsulentvy | N | N | N | N | N | N | N | N | N | N | N | N |
| F22 | Aktivitetskrav/närvaro | N | N | N | N | N | D (Aktivitetsrapportera, mot AF) | N | N | N | N | N | N |
| F23 | Journal för handläggare | N | N | N | N | N | ? | N | N | N | N | N | N |
| F24 | Meddelanden deltagare–konsulent | N | N | N | N | N | ? | N | N | N | N | N | N |
| F25 | Rapporter till uppdragsgivare | N | N | N | N | N | ? | N | N | N | N | N | N |
| F26 | Arbetsgivar-/företagsvy | N | N | N | N | J (annonsering) | J | D (rekryterare hittar profil) | N | ? | N | J* | J* |
| F27 | Flera språk/lätt svenska | ? | D (CV-översättning) | J* | J* | N | J (andra språk-sidor) | N | D (sv/en) | N | N | J* | J* |
| F28 | WCAG uttalad | ? | ? | ? | ? | ? | J* (myndighet, lag) | ? | ? | ? | ? | ? | ? |
| F29 | BankID/SSO | J (BankID) | N | N | N | N | J* | ? | N | ? | ? | N | N |
| F30 | EU-data/GDPR uttalad | J (EU/EES, Google) | ? | ? | ? | ? | J* | J (EU) | ? | ? | ? | ? | ? |

## Aktörsprofiler

### Cowrite (Cowrite AB, 556965-8502, Stockholm, SE)
- Vad: AI-tjänst för CV, personligt brev, intervjuträning (AI-avatar), LinkedIn-sammanfattning, sök jobb i verktyget. Målgrupp: fackanslutna tjänstemän/akademiker; betalare = facket (gratis för medlem) eller individen. Inloggning BankID, data på Googles EU/EES-servrar, ingen träning på användardata (enligt Akavia).
- Pris: se tabell. Omsättning 6 951 tkr (mars 2026), 1 anställd, vinst 995 tkr. Fackavtalens ersättning till Cowrite är OKÄND.
- Användare: "2,3 miljoner medlemmar har tillgång" (påstående); Trustpilot 4,6/5 (påstående). Faktiskt antal användare ej hittat. Fackförbund enligt egen sida: Unionen, Kommunal, Vision, Sveriges Ingenjörer, Akavia, Vårdförbundet m.fl. Fackens egen bekräftelse hittad bara för Akavia.
- Styrkor mot Jobin: stark distribution via fack, BankID, bred AI-funktion, tal-träning. Svagheter: engångsmoment, ingen coachning över tid, ingen mående/energi, ingen konsulentvy, ingen anpassning för långtidsarbetslösa.
- Källor: https://www.cowrite.com/sv ; https://www.allabolag.se/5569658502 ; Akavia-länken ovan.

### CVMaker.se (CV Maker B.V., NL)
- AI-CV-skapare på svenska, 20+ mallar, uppladdning av befintligt CV, brevbyggare, jobbsökningstracker, CV-översättning. Trustpilot 4,4 (13 186 omdömen, påstående). Pro 329 kr/mån (prov 14 dagar 19 kr). Omsättning ej hittad.
- Mot Jobin: dyr mot konkurrenterna; saknar coach/intervju. Källa: https://www.cvmaker.se/ai-cv-skapare ; https://www.cvmaker.se/priser

### Kickresume (SK)
- Global CV-/brevbyggare med AI Writer, ATS-checker, Career Map, LinkedIn-import, appar. Priser i EUR. Svensk sida (/sv/pricing) gav 404; engelska prissidan lästes. Omsättning ej hittad. Källa: https://kickresume.com/en/pricing/

### Zety / LiveCareer (BOLD Limited)
- LiveCareer.se har CV-byggare (30+ ATS-mallar, uppladdning, PDF/Word, guider). Pris ej läsbart. Monster.de pekar nu till LiveCareer.de; Monster stängde i Europa 2025 efter att US-ägaren gick i Chapter 11 (24 juni 2025). monster.se-läget ej verifierat. Omsättning bara uppskattad. Källor: https://livecareer.se ; https://www.pcwelt.de/article/2868030/monster-de-ist-am-ende.html ; https://apps.eurofound.europa.eu/restructuring-events/detail/203161

### Jobbsafari (Jobbsafari AB, 556813-4059; ägare Duunitori Group)
- Svensk jobbsajt, ~80 000 annonser, AI-assistent Josi, "Jobb för dig", Jobbevakaren, Karriärguiden. Arbetsgivare betalar. Omsättning 91,1 Mkr 2025, förlust. Mot Jobin: stor trafik, ingen kompetens-/mående-/konsulentdel. Källor: https://www.jobbsafari.se ; https://www.allabolag.se/5568134059

### Platsbanken / Arbetsförmedlingen (statlig)
- Gratis. Platsbanken (sparade sökningar, e-postbevakning, annonser, koppling till profil), CV-mallar, tre brevmallar, "Vilket yrke passar dig?", Aktivitetsrapportera, Anmäl sjukfrånvaro, Validering, Play. Verifierat på arbetsformedlingen.se/for-arbetssokande. AI: bara rådartiklar (2024-05, 2024-08, 2026-02), inget eget AI-verktyg funnet. Yrkeskompassen, "Mitt jobbsökande" och Jobbsökarsidan som namn: ej bekräftade. Mot Jobin: AF är gratis och obligatoriskt för många deltagare, men saknar coachning och verktygsdjup; AF är också konsulenternas rapporteringsmottagare. Källor: https://arbetsformedlingen.se/for-arbetssokande ; https://arbetsformedlingen.se/platsbanken/ ; https://arbetsformedlingen.se/for-arbetssokande/tips-inspiration-och-nyheter/artiklar/2026-02-10-sa-skriver-du-ett-cv-som-far-ai-att-valja-dig

### Jobbcoach.ai
- Svensk (påstående) AI-tjänst: brev, CV, rekryteringstester, jobbmatchning ur Platsbanken, löneräknare, "Bli upptäckt", ansökningsöversikt. 149 kr/mån. 412+ konton (egen siffra). Bolag och omsättning ej angivna. Närmast Jobin i funktionsbredd bland nykomlingarna. Källa: https://www.jobbcoach.ai

### Genzee.ai (AI Technologies Sweden AB)
- CV/brev från LinkedIn-import, 99 kr/mån eller 49 kr/dok. Omsättning ej hittad. Källa: https://genzee.ai/

### Jobbmatch.ai
- CV-anpassning per annons (<60 s, påstående), brevförslag, jobbmatchning med notiser. "10 000+ har testat". Pris/bolag okänt. Källa: https://jobbmatch.ai/

### CVpaketet, CraftIT
- CVpaketet: gratis CV/brev med AI, betalplaner 49/99/199 kr "planerade, ej köpbara", Premium ska ha intervjuträning. https://www.cvpaketet.se/
- CraftIT: AI-CV mot annons, Platsbanken-jobb, SCB-lönestatistik. Pris okänt. https://craftit.app/en/jobb

### Autoapply-tjänst (SVT, 6 maj 2026)
- Namnlös nystartad Stockholmstjänst som skickar ansökningar automatiskt; SVT-test gav fel ort i brevet. Grundare Alexander Tjörnå. Pris/användare ej angivna. https://www.svt.se/nyheter/lokalt/stockholm/ny-ai-tjanst-soker-jobb-automatiserat-uppgav-fel-ort-i-personligt-brev

### LinkedIn Premium Career, Indeed
- LinkedIn: priset i SEK ej verifierat (se pristabell, intervall ~300–380 kr/mån enligt tredjepartskällor). Gratis prov finns (premium.linkedin.com). Indeed: segmentintäkt se omsättningstabell; svenska produktsidor gav 403/404, funktioner markerade `*`.

### Ej funnet / ej verifierat
Resumé.se (CV-sajt), StepStone SE (onåbar), Jobtip (arbetsgivarprodukt, ej B2C), Academic Work kandidatapp, Jobindex/Jobnet (ej relevant i SE), Simployer, Hejare, Careerkit — inga belägg hittade; "lever i okt 2026" kunde därför bara bekräftas för: Cowrite, CVMaker, Kickresume, LiveCareer.se, Jobbsafari, Platsbanken, Jobbcoach.ai, Genzee, Jobbmatch.ai, CVpaketet, CraftIT (alla svarade vid fetch).

---

## Internationella AI-jobbsökarverktyg och workforce-plattformar (konkurrensresearch för Jobin, 2026-10-18)

Metod: WebSearch/WebFetch 2026-10-18. Priser är sådana jag såg på leverantörens egen sida (märkt "sida") eller i tredjepartskälla (märkt "tredje part", då osäkra). Omsättning är märkt "rapporterad" eller "uppskattad (källa)". Där ingen siffra hittades står "ej hittad". Inget är påhittat.

## Sammanfattning

1. Ingen av de internationella aktörerna är en direkt konkurrent till Jobins kombination (deltagare + konsulent + kommun/AF-rapportering). Alla är USA/EU-konsumentverktyg (CV, ATS-poäng, tracker, intervju) som säljs till individen för ca 8-50 USD/mån.
2. Konsumentprisnivån är hög mot Jobins gratis för deltagare: Teal 29 USD/mån, Jobscan ca 50 USD/mån, Huntr 40 USD/mån, Final Round AI ca 90-149 USD/mån, Rezi 29 USD/mån eller 149 USD livstid, Kickresume 8-24 EUR/mån. Livstid finns hos Rezi (149 USD) och Big Interview (299 USD).
3. Den enda som tydligt har en konsulent/caseload-modell är Huntr (organisationssida med "coach dashboard och caseload management" för workforce, universitet, outplacement). Pris ej publicerat. Rezi Enterprise (99 USD/mån per 200 användare) har teamroller och SSO. Kuder och Metrix är de etablerade leverantörerna till amerikanska arbetsmarknadsmyndigheter (workforce boards).
4. Metrix Learning betalas av myndighet och är gratis för invånaren (licenser per county/stat, vendor-uppgift "under 100 USD per individ"). Det är samma betalningsmodell som Jobin siktar på (offentlig part betalar, deltagaren gratis).
5. Omsättningssiffrorna är nästan helt uppskattningar. Bästa verifierade siffran: Rezi, Stripe-verifierat MRR 246 287 USD (TrustMRR, 2026-10-18) och all-time 10,37 M USD. Teal-uppskattningarna spretar 5 till 53 M USD, vilket visar hur osäkra de är.
6. Bold (Zety, LiveCareer, MyPerfectResume, FlexJobs, sedan 1 aug 2025 även CareerBuilder + Monster-tillgångarna för 28,4 M USD i konkursauktion) är den dominerande CV-byggarkoncernen, men koncernens omsättning ej hittad. Resume.io ägs av Talent Inc (köpt juni 2021), inte Bold.
7. Ingen av aktörerna har uttalad stöd för BankID, svenska, Platsbanken/AF-data, aktivitetsrapportering eller lätt svenska. Det är Jobins skyddade nisch. Hot kommer snarare från att AI-CV/brev/intervju blir en vara (Rezi, Kickresume, Teal erbjuder allt detta billigt), så Jobins värde måste ligga i konsulentflödet och rapporteringen.
8. Ej täckt (tid): Skillful, Gloat, Roadtrip Nation, Instant Teams, Tamarack, Jobfit, Futurefit AI-priser. Futurefit AI: B2G-modell, kunder uppges vara bl.a. brittiska staten, RBC, ManpowerGroup (tredje part), inga priser hittade. Inga europeiska PES-leverantörer med öppna priser hittades; detta är en lucka som kräver TED/Find a Tender-sökning.

## Pristabell

| Aktör | Gratis | Månad | Kvartal/halvår | År | Livstid | Org/workforce | Källa, datum |
|---|---|---|---|---|---|---|---|
| Teal | ja, begränsad (1 CV) | 29 USD (tredje part) | 79 USD/kvartal; 13 USD/vecka | ingen årsplan | nej | ej hittat | toolradar.com/tools/teal-hq/pricing, frontdeskreview.com (sida gav 403), 2026-10-18 |
| Kickresume | ja | 24 EUR | 54 EUR/kvartal (18/mån) | 96 EUR (8/mån) | nej (hos tredje part ej verifierat) | ingen team-plan på sidan; gratis för verifierade studenter; "KickHR" nämns | kickresume.com/pricing (sida), 2026-10-18 |
| Jobscan | ca 5 skanningar/mån | 49,95 USD (tredje part) | 89,95 USD/kvartal | ej hittat | nej | ej hittat (/workforce 404; ingen bekräftad myndighetspartnerskap) | loopcv.pro/directory/jobscan, resumly.ai, 2026 (tredje part; Capterra anger 29,99 USD) |
| Huntr | ja (2 skräddarsydda CV, 100 jobb) | 40 USD | 90 USD/kvartal (30/mån); 160 USD/halvår (26,66/mån) | ej hittat | nej | finns (workforce, universitet, outplacement, coacher) men pris ej publicerat | huntr.co/pricing och /organizations (sida), 2026-10-18 |
| Final Round AI | ja (begränsad) | "25+ USD/mån" på sidan; tredje part: 90-149 USD/mån | 96 USD/mån i 3 mån (288 USD) (tredje part) | ca 300-500 USD (tredje part, spretar) | nej | ej hittat | finalroundai.com/pricing (sida), loopcv.pro/final-round-ai-review (jul 2026), 2026-10-18 |
| Rezi | ja (1 CV, 1 AI-intervju) | 29 USD | ej | ej | 149 USD (engångs) | Enterprise 99 USD/mån per 200 användare (SSO, teamroller) | rezi.ai/pricing (sida), 2026-10-18 |
| Enhancv | gratis i 7 dagar (en källa) | 19,99-29 USD (spretar) | 19,67 USD/mån kvartal; 16,50 USD/mån halvår (PricingSaaS) | ej hittat | ej | ej hittat | pricingsaas.com/companies/enhancv, visualcv.com (tredje part; G2: pris ej publicerat), 2026 |
| Careerflow | ja | 23,99 USD (8,99 USD/vecka) | ej | 14,41 USD/mån årsvis (Capterra); Premium Plus 44,99/mån | ej | ej hittat | loopcv.pro/careerflow-review, capterra.com/p/10015230 (tredje part) |
| Simplify | ? | ? | ? | ? | ? | ? | simplify.jobs/pricing gav 404, sökning gav ingenting. Ej hittat. |
| Big Interview | nej | 39 USD (30 dagar, BootCamp) | 99 USD/3 mån (Accelerator) | – | 299 USD engångs (Pro) | Team 9,75 USD/användare/mån, min 5 platser; 975 USD/år upp till 50 elever; myndighet/edu/non-profit: pris ej publicerat | biginterview.com/pricing och /pricing/teams (sida), 2026-10-18 |
| Resume.io (Talent Inc) | ja (1 CV, TXT) | 2,95 USD 7-dagars prov, sedan 29,95 USD var 4:e vecka | 49,95 USD/kvartal | ingen | nej | ej hittat | resume.io/pricing (sida), 2026-10-18 |
| Zety / LiveCareer / MyPerfectResume (Bold) | – | sida timeout, ej hittat | | | | | |
| AIApply | ? | från 49 USD/mån (100 ansökningar) (tredje part) | ? | ? | nej | ej hittat | stork.ai/compare, 6figr.com (sep 2026) |
| LazyApply | nej | ingen månadsplan | – | 99, 149, 999 USD/år | äldre livstidserbjudanden cirkulerar (ca 55-60 USD), osäkra | ej hittat | 6figr.com/blog (sep 2026), loopcv.pro/lazyapply-review |
| Kuder | ? | – | – | – | – | statliga system (AL, AR, NE, OK); pris ej hittat; enskilt test 15 USD (UNL-lista) | marketplace.unl.edu (tredje part) |
| Metrix Learning | – | – | – | – | – | betalas av workforce board; gratis för invånare, 90 dagar-6 mån åtkomst; "under 100 USD per individ" (vendor-påstående) | cnyworks.com, nj.gov/labor, metrixlearning.com/workforce, ca 2020-2021 |
| LHH / Randstad RiseSmart | – | – | – | – | – | betalas av arbetsgivare (outplacement), pris ej publicerat | – |
| EKCEP Works (US-region, referens) | – | – | – | – | – | licens från 2 000 USD, obegränsat antal jobbsökare, för handläggare | ekcepworks.com (lanserad aug 2026) |

## Omsättningstabell

| Aktör | Belopp | År | Typ | Källa |
|---|---|---|---|---|
| Rezi | MRR 246 287 USD (10 218 aktiva prenumerationer); senaste 30 dagar 213 925 USD; all-time 10 366 943 USD | 2026-10-18 | Stripe-verifierat av säljaren på TrustMRR (ej revisor) | trustmrr.com/startup/rezi |
| Teal | 52,9 M USD | 2025 | uppskattad (Growjo via Getlatka); 16 M USD run rate 2023 (Latka); 5-5,5 M USD (ZoomInfo, Prospeo). Spretar kraftigt. Bolaget har inte publicerat. | getlatka.com/companies/tealhq.com |
| Kickresume | 1,9 M USD | 2024 | uppskattad (Getlatka, okt 2024); 1,2 M USD 2022; bolaget har inte publicerat | getlatka.com/companies/kickresume |
| Jobscan | 2 M respektive 3,8 M USD | ok. | uppskattad, ej verifierbar underlag | accio.com/business/jobscan (tredje part) |
| Huntr | ej hittad. Konkurrentpåstående om ca 6 anställda och fördubblad intäkt fyra år i rad (ej verifierat). 2018: 500 USD/mån (föråldrat) | – | – | orbytjobs.ai, indiehackers.com/product/huntr |
| Final Round AI | ej hittad. Seed 6,88 M USD jan 2025 (Uncork Capital) | – | rapporterad finansiering | pulse2.com |
| Yoodli (intervju-/samtalsträning) | ej hittad rapporterad; 19,5 M USD (Prospeo, uppskattad). Series B 40 M USD dec 2025, värdering över 300 M USD, 900 % tillväxt (GeekWire via Axented) | 2025 | uppskattad respektive rapporterad finansiering | theaiinsider.tech, prospeo.io |
| Enhancv, Careerflow, Simplify, AIApply, LazyApply | ej hittad | – | – | – |
| Resume.io (Talent Inc) | ej hittad. Köptes juni 2021, villkor ej offentliggjorda | – | – | privsource.com/acquisitions/deal/O3Sp7E |
| Bold (Zety, LiveCareer, MyPerfectResume, FlexJobs, CareerBuilder + Monster) | ej hittad. Anställda 1001-5000 (Kustiq, uppskattad). CareerBuilder + Monster-tillgångarna köptes för 28,4 M USD, slutfört 1 aug 2025 | – | – | staffingindustry.com, prweb.com |
| Kuder | ca 17,9 M USD | ej angivet | uppskattad (Datanyze/ZoomInfo/RocketReach) | datanyze.com/companies/kuder |
| Skillsoft (referens, köper inte Big Interview enligt det jag fann) | 531 M USD (katalog) | ej angivet | oklar källa | bitscale.ai/directory/skillsoft |
| Adecco Group (LHH) | koncern 23,08 Md EUR; Career Transition Q4 2025 123 M EUR; LHH-intäkter -6 % FY2025 | 2025 | rapporterad (via Staffing Industry Analysts) | staffingindustry.com |
| Randstad RiseSmart | förvärvades för 100 M USD (2015); omsättning 50-100 M USD (SHRM-katalog, uppskattad) | – | – | randstadenterprise.com, vendordirectory.shrm.org |

## Funktionsmatris (J = ja, D = delvis, N = nej, ? = okänt)

Viktigt: Kolumnerna är bedömda utifrån det jag verifierade på prissidor plus allmän produktkännedom. Allt som inte står i profilerna nedan är EJ verifierat per cell. Använd matrisen som riktning, inte som bevis. Förkortningar: Te=Teal, Ki=Kickresume, Js=Jobscan, Hu=Huntr, FR=Final Round AI, Re=Rezi, En=Enhancv, Cf=Careerflow, Si=Simplify, BI=Big Interview, Bo=Bold/Resume.io (Zety m.fl.), AA=AIApply/LazyApply, Ku=Kuder, Mx=Metrix.

| F | Te | Ki | Js | Hu | FR | Re | En | Cf | Si | BI | Bo | AA | Ku | Mx |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 CV-byggare | J | J | D | J | D | J | J | J | N | D | J | J | ? | N |
| F02 PDF-export | J | J | D | J | ? | J | J | J | N | ? | J | J | ? | N |
| F03 CV-uppladdning | J | J | J | J | J | J | J | J | J | J | J | J | N | N |
| F04 AI-brev | J | J | D | J | ? | J | J | J | D | N | J | J | N | N |
| F05 AI-intervju | ? | N | N | N | J | J | ? | J | N | J | ? | J | N | N |
| F06 Kompetensgap | D | D | N | N | N | N | N | D | N | N | N | N | D | D |
| F07 Yrkesguide/test | N | D | N | N | N | N | N | ? | N | N | N | N | J | ? |
| F08 LinkedIn | J | D | J | ? | N | N | N | J | N | D | N | N | N | N |
| F09 Kontinuerlig coach | N | N | N | N | D | N | N | D | N | N | N | N | N | N |
| F10 Spontanansökan | N | N | N | N | N | N | N | ? | N | N | N | D | N | N |
| F11 Annonssökning | D | D | N | D | ? | N | N | D | J | N | D | J | N | N |
| F12 Bevakning e-post | ? | ? | N | ? | ? | N | N | ? | ? | N | ? | ? | N | N |
| F13 Tracker | J | ? | D | J | ? | N | N | J | J | N | N | D | N | N |
| F14 Lönedata | J | N | N | D | N | N | N | ? | N | N | N | N | N | N |
| F15 Utbildning | N | N | N | N | N | N | N | N | N | D | N | N | D | J |
| F16 Kunskapsbank | D | D | D | N | N | D | D | D | N | J | D | N | J | J |
| F17 Dagbok | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| F18 Mående | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| F19 Energi/fokusläge | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| F20 Kalender | ? | N | N | ? | N | N | N | N | N | N | N | N | N | N |
| F21 Konsulentvy | N | N | ? | J | N | D | N | N | N | D | N | N | J | D |
| F22 Aktivitetskrav | N | N | N | ? | N | N | N | N | N | N | N | N | N | N |
| F23 Handläggarjournal | N | N | N | ? | N | N | N | N | N | N | N | N | ? | ? |
| F24 Meddelanden | N | N | N | ? | N | N | N | N | N | N | N | N | ? | N |
| F25 Rapporter uppdragsgivare | N | N | N | ? | N | N | N | N | N | D | N | N | D | D |
| F26 Arbetsgivarvy | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| F27 Flera språk/lätt svenska | ? | D | ? | ? | ? | ? | ? | ? | ? | ? | D | ? | ? | ? |
| F28 WCAG uttalad | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| F29 BankID/SSO | N | N | N | ? | N | D (SSO på Enterprise, ej BankID) | N | N | N | ? | N | N | ? | ? |
| F30 EU-lagring/GDPR | N (US) | D (SK/EU) | N (US) | N (US) | ? | N (US) | ? | ? | N (US) | N (US) | D (Resume.io NL) | ? | N (US) | N (US) |

Verifierat på leverantörens sida: Rezi (1 CV, 1 AI-intervju, brev, Enterprise-SSO/teamroller), Kickresume (LinkedIn/PDF-import, AI Writer, ATS-check, Career Map, EU-priser i EUR), Huntr (gratis PDF-export, brev, tracker, organisationssida med caseload), Final Round AI (live Interview CoPilot, övningsintervjuer), Big Interview (simulator, VideoAI, Big Resume, LinkedIn i Accelerator, myndighets- och edu-spår). Rader "N" för F17-F20 är bedömning efter produktkännedom; ingen leverantör marknadsför dagbok, mående eller energianpassning.

## Aktörsprofiler

Gemensamt: ingen av dessa har BankID, svenska arbetsmarknadsdata (Platsbanken), aktivitetsrapportering mot AF eller kommun, och ingen skriver ut WCAG eller lätt svenska (F28 okänt: ej undersökt).

### Teal (tealhq.com), USA, Miami
- Vad: AI-karriärplattform med jobbtracker, CV-byggare, Chrome-tillägg, kontakttracker, löne- och jobbmatchning. Målgrupp: individuella jobbsökare, betalar själva.
- Pris: Teal+ 29 USD/30 dagar, 79 USD/kvartal, 13 USD/vecka (tredje part, sidan gav 403). Gratisnivå med dagliga AI-krediter.
- Omsättning: uppskattad 52,9 M USD (2025, Growjo/Getlatka); andra källor 5-16 M USD. Opålitligt. Anställda: 258 (LinkedIn via Getlatka, sep 2025), annan källa 26. Funding: Series A 7,5 M USD jan 2025 (City Light Capital, Flybridge), totalt ca 19 M USD. Medlemmar: 2-4 miljoner (bolagsuppgift via tredje part).
- Styrkor mot Jobin: bred funktion, stark tracker och löneinfo, stor användarbas. Svagheter: ingen konsulent- eller myndighetsmodell, engelska, USA-data. Hot: sätter standarden för vad en deltagare ser som "normal" jobbsökarhjälp.
- Källor: toolradar.com/tools/teal-hq/pricing; frontdeskreview.com/software/resume-builders/teal.md; getlatka.com/companies/tealhq.com; techleap.nl (finder.techleap.nl/news/feed/teal-raises-7-5m-for-ai-careers-platform).

### Kickresume (kickresume.com), Slovakien, Bratislava
- Vad: CV- och brevbyggare med AI Writer, ATS-kontroll, Career Map, webbsida. Betalas av individen; gratis premium för verifierade studenter.
- Pris (sida, 2026-10-18, EUR): 24/mån, 54/kvartal (18/mån), 96/år (8/mån). 14 dagars pengarna-tillbaka.
- Omsättning: uppskattad 1,9 M USD 2024 (Getlatka), 1,2 M USD 2022. 20 anställda (LinkedIn, Getlatka) mot 36 (PitchBook). Bootstrappat.
- Styrkor/svagheter: EU-bolag, flerspråkigt, billigt; ingen konsulent- eller org-plan (KickHR nämns men ej beskrivet). Närmast Jobin i EU-läge men konsumentinriktat.
- Källor: kickresume.com/pricing; getlatka.com/companies/kickresume; pitchbook.com/profiles/company/91373-77.

### Jobscan (jobscan.co), USA
- Vad: ATS-skanning av CV mot annons, LinkedIn-optimering. Målgrupp: individer, betalar själva.
- Pris: Premium ca 49,95 USD/mån, 89,95 USD/kvartal (tredje part; Capterra 29,99 USD). Officiell prissida gick inte att läsa (omdirigerad till app).
- Omsättning: 2-3,8 M USD (uppskattad, otydlig källa). Anställda 11-60 (spretar). Grundat 2013/2014. Jobscans workforce-sida finns inte (404); jag hittade ingen verifierad myndighetspartner.
- Styrkor/svagheter: smalt men bra på ATS; ingen coach, ingen konsulentvy.
- Källor: capterra.com/p/10016414/Jobscan; loopcv.pro/directory/jobscan; accio.com/business/jobscan.

### Huntr (huntr.co), USA
- Vad: jobbtracker (kanban), AI-CV/brev, Chrome-tillägg; organisationsspår för workforce-program, universitet, coacher, outplacement med "coach dashboard och caseload management".
- Pris (sida): gratis (2 CV, 100 jobb); Pro 40 USD/mån, 90 USD/kvartal, 160 USD/halvår. Org-pris ej publicerat.
- Omsättning: ej hittad. Litet team enligt konkurrentpåstående.
- Styrkor/svagheter: den närmaste internationella analogin till Jobins konsulent + deltagare-modell. Saknar svenska, AF-rapportering, mående, tillgänglighetsprofil. Hög prioritet att följa.
- Källor: huntr.co/pricing; huntr.co/organizations.

### Final Round AI (finalroundai.com), USA
- Vad: AI-intervjuträning och "Interview CoPilot" som lyssnar live under riktiga intervjuer, plus CV-verktyg. Etisk risk (live-användning kan strida mot arbetsgivarens regler).
- Pris: sidan "25+ USD/mån" med "spara upp till 40 %"; tredje part 90-149 USD/mån, 96 USD/mån för 3 mån, ca 300-500 USD/år. Spretar mycket.
- Omsättning: ej hittad. Seed 6,88 M USD jan 2025 (Uncork Capital).
- Styrkor: tal-baserad intervjuträning (F05). Svagheter: dyrt, kritik för strikta återbetalningsvillkor, ingen myndighetsmodell.
- Källor: finalroundai.com/pricing; pulse2.com/final-round-ai-job-search-journey-company-closes-6-88-million-seed; blog.loopcv.pro/final-round-ai-review.

### Rezi (rezi.ai), USA
- Vad: ATS-optimerad AI-CV-byggare, AI-intervju, brev; Enterprise för org.
- Pris (sida): Pro 29 USD/mån, Lifetime 149 USD, Enterprise 99 USD/mån per 200 användare (SSO, teamroller, webhooks, video). 30 dagars återbetalning.
- Omsättning: MRR 246 287 USD, 10 218 aktiva prenumerationer, 30 dagar 213 925 USD, all-time 10,37 M USD (TrustMRR, Stripe-verifierat, 2026-10-18). Grundare Jacob Jacquet, grundat 2015 (enligt TrustMRR). Påstådda 4 miljoner användare är bolagets egen uppgift.
- Styrkor/svagheter: visar att livstidspris fungerar och att org-licens per 200 platser säljs; ingen konsulentvy utöver teamroller.
- Källor: rezi.ai/pricing; trustmrr.com/startup/rezi.

### Enhancv (enhancv.com), Bulgarien, Sofia
- Vad: designad CV-byggare med AI-förslag och granskare. Pris: 19,99-29 USD/mån (spretar); kvartal 19,67 USD/mån; halvår 16,50 USD/mån (PricingSaaS, tredje part). Omsättning: ej hittad. Anställda 11-50 (aggregator).
- Källor: pricingsaas.com/companies/enhancv; getpulsesignal.com/pricing/enhancv.

### Careerflow (careerflow.ai), USA
- Vad: LinkedIn-optimering, tracker, CV, mockintervju i Premium Plus. Pris (tredje part): Premium 23,99 USD/mån (14,41/mån årsvis), Premium Plus 44,99 USD/mån. Omsättning: ej hittad.
- Källor: blog.loopcv.pro/careerflow-review; capterra.com/p/10015230/Careerflow-ai.

### Simplify (simplify.jobs)
- Ansökningsautofyll-tillägg och tracker (produktkännedom). Pris och omsättning ej hittade (prissidan 404 vid åtkomst, sökning gav fel företag).

### Big Interview (biginterview.com), USA
- Vad: intervjusimulator med AI-återkoppling på video, Big Resume, kurser. Säljer till individer, myndigheter (workforce), utbildning, non-profit.
- Pris (sida): 39 USD/30 dagar, 99 USD/3 mån, 299 USD livstid. Team 9,75 USD/användare/mån (min 5), 975 USD/år för 50 elever. Myndighetspris ej publicerat.
- Omsättning: ej hittad. Språkstöd ej angivet.
- Relevans: har uttalade spår för "Government Workforce Agencies" och för org-licensiering: närmaste modell för hur Jobin kan paketera intervjuträning mot kommun.
- Källor: biginterview.com/pricing; biginterview.com/pricing/teams.

### Resume.io (Talent Inc, Nederländerna/USA) och Bold-koncernen (Zety, LiveCareer, MyPerfectResume)
- Resume.io: CV-byggare. Pris (sida): 2,95 USD 7 dagar, därefter 29,95 USD var 4:e vecka eller 49,95 USD/kvartal. Ägare: Talent Inc (köpte Imkey Holding B.V. 9 juni 2021, villkor ej offentliga). Omsättning ej hittad.
- Bold (Puerto Rico, grundat 2005, co-VD Doug Jackson och Jamie Freundlich): Zety, LiveCareer, MyPerfectResume, FlexJobs (köpt 1 jan 2024), CareerBuilder + Monster (köpt för 28,4 M USD, slutfört 1 aug 2025). Omsättning ej hittad. Anställda 1001-5000 (uppskattad). En antitrustklagan (Rocket Resume mot BOLD) påstår att Bold dolt kontrollerar många varumärken: obevisade påståenden.
- Priser Zety m.fl.: ej hittade (sidan timeout).
- Källor: resume.io/pricing; privsource.com/acquisitions/deal/O3Sp7E; staffingindustry.com/news/global-daily-news/bold-has-winning-bid-for-careerbuilder-monster-in-bankruptcy-proceeding; prweb.com (BOLD Completes Acquisition...); craft.co/bold.

### AIApply och LazyApply (automatisk ansökan)
- AIApply: abonnemang från 49 USD/mån för 100 ansökningar (tredje part, sep 2026). LazyApply: årsplaner 99/149/999 USD (sep 2026), Trustpilot låga 2:or. Omsättning ej hittad. Risk: massansökan med låg kvalitet, vilket arbetsförmedlare normalt inte vill se hos deltagare.
- Källor: 6figr.com/blog/?p=727; blog.loopcv.pro/lazyapply-review; stork.ai/compare/aiapply-vs-lazyapply.

### Yoodli (samtals-/intervjuträning, USA)
- AI-roleplay, mest för företag. Series B 40 M USD dec 2025, värdering över 300 M USD. Pris ej hittat. Källa: theaiinsider.tech/2025/12/08/yoodli-reaches-300m-valuation-following-40m-series-b-to-expand-ai-communication-training/.

### Workforce-/omställning (offentlig sektor)
- Kuder (USA, Iowa): intresse- och karriärplaner, byggt som statsövergripande onlinesystem (AL, AR, NE, OK) och för workforce-myndigheter. Omsättning ca 17,9 M USD (uppskattad). Pris ej hittat (enskilt test 15 USD). Källor: datanyze.com/companies/kuder/21823909; kuder.com/about; topworkplaces.com/company/kuder-inc.
- Metrix Learning (USA): e-lärande betalt av workforce boards; gratis för invånare (90 dagar-6 mån). Vendor säger 100+ boards. Källor: cnyworks.com/node/6933; nj.gov/labor/wioa/forms_pdfs/SkillUpNewJersey_MetrixLearningPolicy_PY21.pdf; metrixlearning.com/workforce. Underlag ca 2020-2021, ej aktuella priser.
- LHH (Adecco) och Randstad RiseSmart: outplacement/omställning som betalas av arbetsgivare, inte jobbsökare. LHH Career Transition Q4 2025 123 M EUR; FY2025 LHH -6 %. RiseSmart köptes 2015 för 100 M USD. Ingen kontaktyta mot Jobins kommunsegment i annat än Trygghetsråden/TSL-världen. Källor: staffingindustry.com (Adecco-rapporterna); randstadenterprise.com/insights/outplacement/randstad-buys-outplacement-firm-risesmart-for-100-million.
- Futurefit AI (Kanada): karriärnavigering, B2G; kunder uppges inkludera brittiska staten, RBC, ManpowerGroup (tredje part). Pris och omsättning ej hittade. Källor: betakit.com/futurefit-ai-raises-5-7-million-to-scale-career-navigation-platform; theinnovator.news/?p=3977.
- EKCEP Works (Kentucky, aug 2026): AI-plattform för handläggare, licens från 2 000 USD med obegränsat antal jobbsökare. Visar prisankare för handläggarverktyg. Källa: ekcepworks.com.
- Ej undersökta (tidsbrist): Skillful, Gloat, Roadtrip Nation, Instant Teams, Tamarack, Jobfit. Inga europeiska PES-leverantörer med synliga priser hittades; kräver sökning i TED/Find a Tender/Hilma/TenderNed.

## Kort prisjämförelse mot Jobin
Jobin: organisation 2 990 kr/mån + 290 kr per aktiv konsulent (ca 280 USD + 27 USD per konsulent, ungefärlig kurs), deltagare gratis. Jämförpunkter: Rezi Enterprise 99 USD/mån per 200 användare (för utbildning/team), EKCEP Works från 2 000 USD per licens (obegränsat antal deltagare), Big Interview team 975 USD/år för 50 elever, Metrix "under 100 USD per individ". Jobins pris ligger inom internationella org-prisankare, men Jobin saknar offentliga prisreferenser för hela deltagarflödet i EU/Sverige.

---

## Omställningsorganisationer, fack, a-kassor och leverantörer — konkurrensläge för Jobin

Research 2026-10-18. Regel: "ej hittad" betyder ej hittad. Inga siffror är påhittade. Årsredovisningar (omsättning) gick INTE att nå via webbsökning/hämtning (inga direktlänkar på organisationernas webbplatser, allabolag gav 404 eller fel bolag). Det är den största luckan i det här segmentet.

## Sammanfattning

1. Omställningsorganisationerna är inte konkurrenter om kunden utan om deltagarens uppmärksamhet. De är gratis för individen, betalas av arbetsgivare via kollektivavtalad avgift på lönesumman, och kräver att man är uppsagd eller anställd hos ansluten arbetsgivare. Jobin är öppet för alla, inklusive långtidsarbetslösa som helt faller utanför dessa system (de har ingen avtalsansluten arbetsgivare kvar att kopplas till).
2. TRR (privat sektor, tjänstemän, ca 850 000 anställda i ca 32 000 företag enligt Wikipedia, ej daterat) har det mest Jobin-lika digitala utbudet: CV-verktyg med AI-förslag mot jobbannons, matchning mot annonser, Rikta (yrkesframtid, lönestatistik, utbildning), webbinarier, personlig rådgivning. Allt bakom inloggning (Mitt TRR) och kräver att arbetsgivaren anmält personen.
3. TSL (arbetare, LO/Svenskt Näringsliv, ca 2 miljoner med rätt till stöd) och Omställningsfonden (välfärdssektorn, 1,3 miljoner) är mer rådgivnings- och stödorienterade; digitalt syns främst ansökan och Mina sidor. TSL avgift 2026: 0,34 % av lönesumma (för lön upp till 7,5 prisbasbelopp).
4. TSN (stat, ca 307 000 anställda i Arbetsgivarverkets avtal) erbjuder individuell rådgivning upp till 12 månader, ingen identifierad AI/CV-verktygsportal utöver Mina sidor.
5. Cowrite distribueras som fackförmån (verifierat: Fackförbundet ST, Vårdförbundet-FAQ finns). Cowrite täcker F01–F04 + intervjufrågor + LinkedIn-sammanfattning + karriärförslag, med BankID-inloggning. Att Unionen/Vision/SSR/Kommunal/Akavia har Cowrite-avtal gick INTE att verifiera. Vad facken betalar: ej hittad.
6. Lernia är kvar som bolag (ägs av Aurelius sedan 2025, ny vd Veronica Rörsgård juli 2026) men matchningsverksamheten (Rusta och matcha) överläts till HelloLilly AB 2026-03-01; HelloLilly har därefter 35 ROM2-avtal på 62 orter. Det är relevant för Jobins kundsegment (ROM-leverantörer).
7. Kompetens- och omställningsstudiestöd (CSN) kräver yttrande från omställningsorganisation, så organisationerna är grindvakt för det stödet. Åldersspann 27–62/63.
8. Jobins vita fält: personer utan avtalsansluten arbetsgivare, långtidsarbetslösa, och konsulentvy/aktivitetskrav/närvaro, som ingen i segmentet visar offentligt (F21–F25 okänt/nej).

## Pris- och finansieringstabell

| Aktör | Vem betalar | Nivå | Behörig | Källa (sett 2026-10-18) |
|---|---|---|---|---|
| TRR Trygghetsrådet | Arbetsgivare via Fora | Fora-notis 2021-06-09: 0,1 % av tjänstemännens lönesumma (0,05 % utslaget över helår) för Svenskt Näringsliv-medlemmar, 0,5 % (0,45 %) för övriga. Andra, osäkra uppgifter: 0,3 % (SN-presentation, odaterad) och 0,55 % (en sökträff). Nuvarande sats ej verifierad. | Anställd hos företag med omställningsavtal; arbetsgivaren anmäler; stöd till månaden före 67 år | https://www.fora.se/om-fora/aktuellt/alla-nyheter/2021/ny-avgift-for-trr-trygghetsradet/ ; https://www.trr.se |
| Trygghetsfonden TSL | Arbetsgivare, delvis kompenserade av staten | 0,34 % av lönesumma upp till 7,5 prisbasbelopp, 2026 | Arbetare hos företag med kollektiv-/hängavtal inom LO/SN-området | https://www.avtalat.se/media/10ql04hg/2026-premier_asl_22-12-2025.pdf ; https://www.tsl.se |
| Omställningsfonden | Arbetsgivare (SKR/Sobona): 0,1 %; totalt 0,25 % av lönesumma varav 0,15 % staten (min slutsats ur två källor, ej uttryckligt) | 0,1 % arbetsgivare | Anställda i kommuner, regioner, Sobona-bolag | https://afaforsakring.se/dokument/tiesm9lhww6sbf9lmeci/b-omst-llningsfonden.pdf ; https://www.omstallningsfonden.se |
| Trygghetsstiftelsen TSN | Statliga arbetsgivare | Sats ej hittad | Statsanställda, 12 månader av 24 för grundstöd | https://arbetsgivarverket.se/arbetsgivarguiden/omstallning |
| Trygghetsrådet TRS | Arbetsgivare i ideell sektor/kultur | Sats ej hittad | Avtalsområde ideell/kultur | https://www.ptk.se/wp-content/uploads/2023/03/TRS_omstallningsavtal.pdf |
| Cowrite via fack | Facket (medlemsavgift); pris till Cowrite ej hittad | Gratis för ST-medlem | Medlem, BankID | https://www.st.org/medlemskap/formaner/jobb-och-karriar/cowrite |
| Saco Lönesök | Medlemsförbund | Gratis för medlem? Ej bekräftat | Medlem i Saco-förbund, BankID/Freja | https://sulf.se/en/facts/sulf-salary-statistics-and-saco-lonesok/ |
| Unionen | Medlemsavgift | CV-granskning, rådgivning, inkomstförsäkring (60 000 kr/mån, 150 dagar) | Medlem | https://www.unionen.se/node/24163 |
| Akavia | Medlemsavgift | Inkomstförsäkring 80 % upp till 100 000 kr/mån, lönestatistik, karriärråd | Medlem | https://www.akavia.se/siteassets/05-fortroendevald/mallar/rekryteringsbroschyr-eng-a5-2025.pdf |
| Omställningsleverantörer (Mindset, Mercuri, Randstad RiseSmart, Wise m.fl.) | TRR/TSL/Omställningsfonden betalar per uppdrag | Prisnivå ej hittad (avtal ej publika) | Via organisationen | Ej hittad |
| Lernia/HelloLilly (ROM2) | Arbetsförmedlingen | Ersättning ej hittad | Inskriven hos AF | https://arbetsformedlingen.se/for-leverantorer/nyheter-for-leverantorer/nyheter-for-leverantorer/2026-02-27-hellolilly-tar-over-delar-av-lernias-matchningsverksamhet |

Jobin för jämförelse: gratis för deltagare; organisation 2 990 kr/mån + 290 kr/konsulent.

## Omsättningstabell

| Aktör | Belopp | Status | Källa |
|---|---|---|---|
| TRR | ej hittad. RocketReach uppger 33,3 MUSD (aggregatorskattning, opålitlig, ej använd) | uppskattad, ej verifierad | https://rocketreach.co/trr-trygghetsradet-profile_b5c69b39f42e0c97 |
| TSL | ej hittad | – | Årsredovisning ej nådd via tsl.se |
| TSN | ej hittad | – | – |
| Omställningsfonden | Uppgift: 750 Mkr till kompetensutveckling 2024–2026 (programsatsning, inte omsättning) | rapporterad av organisationen | https://www.omstallningsfonden.se |
| TRS | ej hittad | – | – |
| Cowrite | ej hittad (bolagsnamn/orgnr ej fastställt) | – | – |
| Lernia | ej hittad. Delförsäljning av matchning ca 120 Mkr rapporterad av Affärsvärlden, inte omsättning | – | https://www.affarsvarlden.se/artikel/staten-saljer-lernia-till-investmentbolag |
| Mindset, Mercuri Urval, Wise, RiseSmart | ej hittad | – | – |

Verksamhetsvolym (inte omsättning): TRR ca 22 000 personer beviljade stöd "förra året" (årtal oklart), 95 % ny sysselsättning helåret 2025, 6 000 yttranden för omställningsstudiestöd 2025; TSL ca 15 000/år, 6 800 beviljade Q4 2024, ca 20 000 under 2023; TRR ca 250 anställda, TSL ca 40 (Wikipedia, 2021).

## Funktionsmatris (J = ja, D = delvis, N = nej, ? = okänt)

Kolumner: TRR | TSL | OmF (Omställningsfonden) | TSN | Cowrite (via fack) | Saco Lönesök | Unionen/Akavia

| Nr | TRR | TSL | OmF | TSN | Cowrite | Saco Lönesök | Unionen/Akavia |
|---|---|---|---|---|---|---|---|
| F01 CV-byggare med mallar | ? | ? | ? | ? | J | N | ? |
| F02 PDF-export | ? | ? | ? | ? | J | N | ? |
| F03 CV-uppladdning + tolkning | J (CV-verktyg, uppladdning, AI-förslag) | ? | ? | ? | J (CV eller LinkedIn) | N | ? |
| F04 AI-brev | ? | ? | ? | ? | J | N | ? |
| F05 AI-intervjuträning med tal | D (psykologiska tester, ej intervju med tal) | ? | ? | ? | D (frågeförslag, ej tal) | N | ? |
| F06 Kompetensgap | D (Rikta) | ? | ? | ? | D | N | D (kompetenskartläggning, Unionen EN-sida) |
| F07 Yrkesguide | D (Rikta, yrkesförslag efter kompetens) | D (vägledning, ej test) | ? | ? | D | N | ? |
| F08 LinkedIn | ? | ? | ? | ? | D (sammanfattning) | N | ? |
| F09 Kontinuerlig AI-coach | N | N | ? | ? | N | N | N |
| F10 Spontanansökan | D (guide om dolda jobb) | ? | ? | ? | N | N | ? |
| F11 Annonssökning | D (TRR Matchning visar relevanta annonser) | ? | ? | ? | N | N | N |
| F12 Jobbevakning mejl | ? | ? | ? | ? | N | N | ? |
| F13 Ansökningstracker | ? | ? | ? | ? | N | N | ? |
| F14 Lönestatistik | J (Rikta) | ? | ? | ? | N | J | J (Akavia) |
| F15 Utbildningssökning | D (Rikta) | D | D | D (vägledning) | N | N | ? |
| F16 Kunskapsbank/guider | J (jobbsökarguider) | ? | ? | ? | N | N | ? |
| F17 Dagbok | N | N | N | N | N | N | N |
| F18 Mående | N | D (stöd vid sjukdom, mänskligt) | N | D (sjukdomsspår, mänskligt) | N | N | N |
| F19 Energianpassning/kognitiv tillg. | N | ? | ? | ? | N | N | N |
| F20 Kalender | D (aktivitetskalender/webbinarier) | ? | ? | ? | N | N | N |
| F21 Konsulentvy | ? (interna system, ej publika) | D (coachportal portal.tsl.se) | ? | ? | N | N | N |
| F22 Aktivitetskrav/närvaro | N | ? | ? | ? | N | N | N |
| F23 Journal | ? | ? | ? | ? | N | N | N |
| F24 Meddelanden | ? | ? | ? | ? | N | N | N |
| F25 Rapporter | D (kvartalsstatistik, publik) | D (kvartalsrapporter) | D | ? | N | N | N |
| F26 Arbetsgivarvy | J (arbetsgivare-spår, rekryteringstips) | J (arbetsgivarsida) | J | J (rekryteringsservice) | N | N | N |
| F27 Språk/lätt svenska | ? | ? | ? | D (engelsk sajt) | D (sv/en) | D (engelsk guide) | D (engelska sidor) |
| F28 WCAG uttalad | ? | ? | ? | ? | ? | ? | ? |
| F29 BankID/SSO | ? (Mitt TRR, inloggning) | ? | ? | ? (Mina sidor) | J | J (BankID/Freja) | ? |
| F30 EU-lagring/GDPR uttalad | ? | ? | ? | ? | ? (separat personuppgiftssida) | ? | ? |

Observera: "?" i stor omfattning beror på att verktygen ligger bakom inloggning och inte kunde inspekteras. Matrisen bygger på publika beskrivningar, inte på prövning.

## Aktörsprofiler

### TRR Trygghetsrådet
- URL: https://www.trr.se. Sverige. Stiftelse, drivs utan vinstsyfte; styrelse med 14 ledamöter från Svenskt Näringsliv och PTK. Grundad 1974. Orgnr ej fastställt.
- Vad: omställning för tjänstemän i privat sektor vid uppsägning (omställningsstöd, avgångsersättning AGE som komplement till a-kassa, studiestöd, Chef i omställning, webbinarier) och kompetensstöd under pågående anställning (Horisont för karriärplanering, Rikta för framtidsyrken).
- Betalare: arbetsgivare via avgift på lönesumman (nivå osäker, se pristabell).
- Digitalt (efter inloggning): CV-verktyg (uppladdning, matchning mot annons, AI-baserade förbättringsförslag), karriärguide med övning på psykologiska tester, TRR Matchning (profil visar relevanta annonser och matchningsaktiviteter), jobbsökarguider. Rikta bygger på prognoser från AF, SCB, Saco, Industrirådet och visar bl.a. lönestatistik.
- Behörighet: arbetsgivaren anmäler; individen skapar konto och godkänner. Gäller till månaden före 67 år. Kräver kollektivavtal.
- Siffror: 22 000 beviljade i ett (odaterat) år; helåret 2025: 95 % ny sysselsättning, snitt 7 månader, 6 000 yttranden för omställningsstudiestöd. Ca 250 anställda, ca 32 000 anslutna företag (Wikipedia, 2021-versionen).
- Mot Jobin: Styrka hos TRR: AI-CV-förslag, annonsmatchning, finansierat, mänsklig rådgivning, studiestödsyttrande. Svaghet: stängt för alla utan avtalsansluten arbetsgivare; ingen dagbok, energi, tillgänglighetsanpassning, aktivitetskrav eller konsulentstöd för AF/kommun.
- Källor: https://www.trr.se ; https://www.trr.se/privatperson/vid-uppsagning/om-erbjudandet/omstallningsstod/ ; https://www.trr.se/privatperson/rikta/yrken ; https://www.trr.se/om-oss/statistik-och-rapporter/ ; https://sv.wikipedia.org/wiki/TRR_Trygghetsr%C3%A5det

### Trygghetsfonden TSL
- URL: https://www.tsl.se. Kollektivavtalsstiftelse för arbetare (LO/Svenskt Näringsliv). Grundad 2004, ca 40 medarbetare och sex regionkontor (Wikipedia, ej aktuell). Omställningsstöd, avgångsbidrag, karriär- och studievägledning, CSN-stöd, stöd vid sjukdom. Utförande via externa omställningsleverantörer (äldre TSL-material från 2019).
- Betalare: arbetsgivare 0,34 % (2026), staten ersätter del.
- Behörighet: arbetare hos avtalsanslutna företag, ca 2 miljoner med rätt. Gratis för individen.
- Digitalt: ansökan online, coachportal portal.tsl.se. Inga jobbsökarverktyg som AI-CV hittades.
- Siffror: ca 15 000/år, 2024 +16 %, 91 % ny lösning helåret 2024.
- Mot Jobin: Delvis samma målgrupp (arbetare med fysiska utmaningar, stöd vid sjukdom) men utan egen digital produkt. Möjligt samarbetsspår snarare än konkurrens.
- Källor: https://www.tsl.se ; https://www.tsl.se/om-oss/statistik-rapporter/ ; https://www.avtalat.se/media/10ql04hg/2026-premier_asl_22-12-2025.pdf

### Omställningsfonden
- URL: https://www.omstallningsfonden.se. Välfärdssektorn (kommun, region, Sobona), 1,3 miljoner anställda. Stöd vid avslutad anställning och under pågående: vägledning, yttrande till CSN, validering. Stöd till arbetsgivare (strategisk kompetensförsörjning, förebyggande åtgärder). 9 av 10 får nytt jobb eller utbildning. Mina sidor. 750 Mkr till kompetensutveckling 2024–2026.
- Mot Jobin: Kommunala kunder är Jobins målgrupp (kommuner); Omställningsfonden är kommunens egen omställningsaktör men riktar sig till tillsvidareanställda i kommunen, inte till deltagare i arbetsmarknadsenhetens verksamhet.
- Källor: https://www.omstallningsfonden.se ; https://afaforsakring.se/dokument/tiesm9lhww6sbf9lmeci/b-omst-llningsfonden.pdf

### Trygghetsstiftelsen (TSN)
- URL: https://www.tsn.se. Statlig sektor. Individuell rådgivning upp till 12 månader, karriärvägledning, studievägledning, yttrande till CSN, förstärkt stöd vid sjukdom, rekryteringsservice för arbetsgivare. Mina sidor. Avgift och omsättning ej hittade.
- Källor: https://www.tsn.se ; https://arbetsgivarverket.se/arbetsgivarguiden/omstallning

### Trygghetsrådet TRS
- Ideell sektor och kultur, omställningsavtal från oktober 2022 (PTK-avtal). Webbplats trs.se, inte fetchad. Avgift och omsättning ej hittade.
- Källa: https://www.ptk.se/wp-content/uploads/2023/03/TRS_omstallningsavtal.pdf

### Cowrite via fack
- Verifierat: Fackförbundet ST (100 000 medlemmar) ger Cowrite gratis till medlemmar via Mina sidor med BankID; funktioner: CV och brev på svenska/engelska med mallar, PDF-export, uppladdning av CV eller LinkedIn, CV-granskning mot annons, intervjufrågor, LinkedIn-sammanfattning, karriärförslag. Vårdförbundet har en Cowrite-FAQ om personliga brev (PDF, ej läsbar för verktyget). En Cowrite-relaterad LinkedIn-text hävdar gratis för fackmedlemmar (marknadsföring).
- Ej verifierat: Unionen, Vision, SSR, Kommunal, Akavia. Fackens pris till Cowrite: ej hittad. Bolagets orgnr/omsättning: ej hittad (sökning på allabolag gav fel bolag).
- Mot Jobin: Cowrite är det vanligaste digitala verktyget via fack; tillgängligt för alla medlemmar utan uppsägning, men ingen coach/dagbok/konsulentvy.
- Källor: https://www.st.org/medlemskap/formaner/jobb-och-karriar/cowrite ; https://www.vardforbundet.se/siteassets/medlemskap/dina-medlemsformaner/faq---personliga-brev---cowrite.pdf

### Saco, Akavia, Unionen
- Saco Lönesök: webbaserad lönestatistik för Saco-förbundens medlemmar, inloggning BankID/Freja, jämförelse efter utbildning, yrke, ålder, region, sektor. Pris/öppenhet ej bekräftad. Källa: https://sulf.se/en/facts/sulf-salary-statistics-and-saco-lonesok/
- Akavia (bildat 2020 av Jusek och Civilekonomerna): inkomstförsäkring 80 % till 100 000 kr/mån, lönestatistik, karriärråd. Karriärcoachning som AI-verktyg ej bekräftad.
- Unionen: CV-granskning, rådgivning, kompetenskartläggning, karriärplanering, rekryteringskonsultation (engelska sidan); inkomstförsäkring 60 000 kr/mån upp till 150 dagar.
- Kommunal, Vision, Vårdförbundet, SSR: ej undersökta utöver Vårdförbundets Cowrite-FAQ.

### Omställningsleverantörerna
- Mindset, Mercuri Urval, Randstad RiseSmart, Wise Professionals, Poolia, Hilma: inget verifierat om TRR/TSL-uppdrag, priser eller omsättning. Randstad koncern: 5,81 mdr EUR Q3 2025 (ej relevant för omställningsaffären). Orgnr och omsättning för övriga ej hittade (allabolag/bolagsfakta-sökningarna träffade fel bolag).

### Lernia / HelloLilly
- Lernia AB såldes av staten 2025 till Aurelius (rapporterat pris ca 3,5 mdr SEK enligt rubrik på techleap-flödet). Aurelius avyttrade matchningen; HelloLilly AB tog över Lernia Utbildning ABs matchning och omställning 2026-03-01 med 35 ROM2-avtal på 62 orter. Ny vd Veronica Rörsgård (Realtid, juli 2026). Lernia finns kvar (utbildning/bemanning), men Rusta och matcha-verksamheten gör det inte.
- Mot Jobin: HelloLilly är en växande ROM-leverantör och därmed potentiell Jobin-kund eller konkurrent om samma konsulentflöde.
- Källor: https://arbetsformedlingen.se/for-leverantorer/nyheter-for-leverantorer/nyheter-for-leverantorer/2026-02-27-hellolilly-tar-over-delar-av-lernias-matchningsverksamhet ; https://www.affarsvarlden.se/artikel/staten-saljer-lernia-till-investmentbolag

### Kompetens- och omställningsstudiestöd (CSN, kontext)
- Ålder 27–62/63, minst 96 månaders arbete de senaste 14 åren (enligt Arbetsgivarverket om TSN), bidrag plus lån, kräver yttrande från omställningsorganisationen (TRR hade 6 000 sådana 2025). Detaljer om belopp ej hämtade (CSN-undersidor).
- Källor: https://www.csn.se/bidrag-och-lan/studiestod/omstallningsstudiestod.html ; https://arbetsgivarverket.se/arbetsgivarguiden/omstallning

## Luckor att följa upp
- Årsredovisningar (omsättning/intäkter/digital kostnad) för TRR, TSL, TSN, TRS, Omställningsfonden: hämta direkt från respektive webbplats eller via Bolagsverket/Stiftelseregistret (länsstyrelsen).
- Cowrites orgnr, ägare, fackavtal och pris.
- Aktuell TRR-avgift (2021-uppgifter är de enda verifierade).
- Faktiska omställningsleverantörer och deras uppdragspriser.

## Komplettering (2026-10-18, andra passet)

Resultat i korthet: avgiftssatserna 2026 är nu belagda. Intäkter, kostnader och antal stödda per organisation gick fortfarande INTE att nå: tsl.se och trr.se länkar bara kvartalsstatistik (ingen årsredovisning), bolagsfakta/allabolag gav 403/404 eller fel bolag, och sökningar på omstallningsfonden.se, tsn.se och trs.se gav inga träffar. Ingen siffra nedan är gissad.

### 1. Avgifter 2026 (ersätter osäkra uppgifter i pristabellen)
| Organisation | Avgift 2026 | Källa |
|---|---|---|
| TRR (tjänstemän, ITP1 och ITP2) | 0,40 % av bruttolön (rapporterad, Livsmedelsföretagens cirkular feb 2026, bolag i Svenskt Näringsliv). Ersätter 2021-uppgifterna (0,1 % / 0,5 %) och de osäkra 0,3 % / 0,55 %. | https://www.livsmedelsforetagen.se/app/uploads/2026/02/cirkular-avgifter-och-premier-for-ar-2026.pdf |
| TSL (arbetare) | 0,34 % (företag med Huvudavtal) eller 0,15 % (företag med Kollektivavtal om omställningsförsäkring), på lön under 37 000 kr/mån. | samma cirkular |
| Statlig återbetalning | Arbetsgivare som betalar till TRR resp. TSL får i efterhand 0,15 % återbetalt av Kammarkollegiet via Fora. Nettokostnad blir alltså ca 0,25 % (TRR), ca 0,19 % (TSL Huvudavtal) och ca 0 % (TSL omställningsförsäkring). Härledning av mig, ej uttryckligen angiven. | samma cirkular |
| TRS | Äldre uppgift: 0,3 % (Arbetsgivaralliansens remissvar, förslag om höjning till 0,55 %). 2026-sats ej hittad. | https://www.regeringen.se/contentassets/e33ce0846ac44782809fc96309cbf2e4/trygghetsradet-trs.pdf |
| TSN, Omställningsfonden | 2026-sats ej hittad. | – |

### 2. Intäkter, kostnader, antal stödda
| Organisation | Intäkter | Kostnad omställningsstöd | Antal stödda | Källa |
|---|---|---|---|---|
| TRR | ej hittad. Bolagsfakta har bokslutsöversikt 2017-2024 (org.nr 802400-4825) men gav 403 vid hämtning. | ej hittad. Enda belägg: 12 813 kr per person 2019 för förstärkt stöd, och TRR invänder själv att det bara är externt inköpta insatser, inte egen personal (remissvar Ds 2021:16, 2021-09-15). | 5 400 personer fick stöd Q1 2025 (6 100 kvartalet före); 95 % ny sysselsättning; 6 000 yttranden omställningsstudiestöd. Rapporterat av TRR. | https://www.trr.se/om-oss/statistik-och-rapporter/ ; https://www.bolagsfakta.se/8024004825-KOLLEKTIVAVTALSSTIFTELSEN_TRYGGHETSRADET |
| TSL | ej hittad (sajten har bara kvartalsrapporter, t.o.m. Q3 2026) | ej hittad | Ca 3 900 beviljade Q2 2026 (-48 % mot året före); 4 050 Q1 2026 (-26 %). Rapporterat av TSL. | https://www.tsl.se/om-oss/statistik-rapporter/ ; https://www.tsl.se/om-oss/statistik-rapporter/vaara-kvartalsrapporter/ |
| TSN | ej hittad | ej hittad | ej hittad | – |
| TRS | ej hittad. Org.nr 802400-6853 enligt LEI-post (status LAPSED, verifiera). | ej hittad | ej hittad | https://lei.bloomberg.com/leis/view/549300XLH656IHRPIL53 |
| Omställningsfonden | ej hittad | ej hittad | ej hittad | – |

Anmärkning: antalet beviljade per kvartal sjunker kraftigt 2025-2026 (TSL -48 % Q2 2026), vilket tyder på lägre varselnivå.

### 3. Omställningsleverantörer
- Randstad RiseSmart AB (Solna): uppger sig vara omställningsleverantör sedan 1991 och leverantör till Arbetsförmedlingen sedan 2007; allmänna villkor för omställningsuppdrag finns. Omsättning för svenska bolaget ej hittad (koncernsiffror gäller inte). RiseSmart marknadsförs globalt som teknikbaserat, men vilken plattform deltagare får i Sverige är ej verifierat. Källor: https://www.regeringen.se/contentassets/3b8d76f7150a4985a93cefe3fa399db1/randstad-risesmart.pdf ; https://www.randstad.se/s3fs-media/se-rs/public/2025-10/randstad_risesmart_allmanna_villkor_sv_1_8.pdf
- Mercuri Urval: grundat 1967, Stockholm (tredjepartsprofil). Omsättning för svenska bolaget ej hittad.
- Mindset, Wise Professionals, Poolia: inga träffar, inget verifierat om omsättning, org.nr eller digitala verktyg.
- Allabolag/proff/bolagsfakta/ratsit är inte nåbara med WebFetch (403/404) och sökträffarna visar inga siffror. Kräver manuell uppslagning i webbläsare eller köpt bokslut.

### 4. Cowrite
- Bolag: Cowrite AB, Rörstrandsgatan 24, 113 40 Stockholm (personuppgiftsansvarig). Källa: https://cowrite.com/sv/integritetspolicy/ . Org.nr står inte på sidan; omsättning ej hittad (träffarna på bolagsfakta var andra bolag). Domänen cowrite.se är en tom One.com-sida; tjänsten bor på cowrite.com.
- Fack med fri tillgång för medlemmar (Cowrites egen inloggningssida, marknadsföring): Unionen, Kommunal, Sveriges Lärare, Sveriges Ingenjörer, Vision, Akavia, Vårdförbundet, Akademikerförbundet SSR, Fackförbundet ST, SRAT, DIK, Fysioterapeuterna = 12. Källa: https://cowrite.com/sv/logga-in/ . ST bekräftar själv: https://www.st.org/medlemskap/formaner/cowrite-fa-hjalp-med-cv-och-personligt-brev . Det rättar sammanfattningens "ej verifierat": Unionen, Vision, Kommunal, SSR och Akavia står på Cowrites egen lista (bekräftelse från respektive fack saknas utom ST).
- Täckning: ca 2,3 miljoner personer (Cowrites egen siffra).
- Pris icke-medlem: 179 kr/mån, från 83 kr/mån vid årsbetalning (Cowrites egen jämförelsesida). Källa: https://cowrite.com/sv/basta/basta-cv-mallar-fackforbund/ . Antal CV-mallar uppges olika (51 resp. 21), osäkert.
- Teknik och lagring enligt egen integritetspolicy: Firebase auth/backend i EU-region, chattmeddelanden i Supabase EU, hosting på Vercel (USA), AI-svar via Google Gemini och Anthropic (USA), betalning Stripe, mejl Resend (USA). Alltså inte EU-only för AI-delen, relevant för Jobins F30-argument. Policyn nämner också "Cowrite Agents" (AI-chatt), ej prövad, kan närma sig F09.

### 5. HelloLilly AB
- Org.nr 559268-3840. Källa: https://upplysningar.syna.se/kreditupplysning/kop/5592683840/hellolilly-ab (bokslut 2022-2025 finns men är betalda, inga siffror visade).
- Omsättning: "20 miljoner" och 30 medarbetare, grundat 2020, enligt bolagets egen karriärsida, utan årtal (rapporterad av bolaget, ej verifierad). Källa: https://jobb.hellolilly.se/ . SVT: merparten av omsättningen är Arbetsförmedlingens ersättning för Rusta och matcha. Efter övertagandet av Lernias matchning 2026-03-01 (35 avtal, 62 orter, personal och lokaler följde med) är siffran sannolikt föråldrad. VD Rikard Westerlund.
- Deltagarsystem: länk till "Deltagarportal" på secure.workbuster.com från https://www.hellolilly.se/om-oss . Workbuster används alltså som deltagarportal; funktioner ej inspekterade. (Karriärsidan kör Teamtailor, irrelevant för deltagare.)
- Mot Jobin: växande ROM-leverantör som redan har Workbuster; tänkbar kund eller komplement, och Jobin måste visa värde ovanpå Workbuster.

### Kvarstående luckor
Årsredovisningar för TRR/TSL/TSN/TRS/Omställningsfonden (öppna Bolagsfakta i webbläsare, eller fråga TRR på kontakt@trr.se), Cowrites org.nr och omsättning (Bolagsverket, "Cowrite AB"), HelloLillys bokslut (Syna, 35 kr/år), leverantörernas omsättning.

---

## Arbetsgivarsidan i Sverige — konkurrensresearch för Jobin (2026-10-18)

Metod: WebSearch/WebFetch, omsättning främst via allabolag.se (källa UC AB) och bolagens egna rapporter. "Rapporterad" = bokslut/rapport. "Uppskattad" = tredjepartsdatabas. "Ej hittad" = ej belagd. Hitta-inte-på-regeln följd. Flera sökträffar var tunna; luckor markerade.

## Sammanfattning

1. **Ingen aktör säljer det Jobin-företagskontot gör** (arbetsgivare svarar på förslag som en konsulent skickat, aldrig fri kandidatsökning). Närmast är AF:s kandidatbank "Sök kandidater" (gratis, fri sökning, frivilliga profiler), AF:s stödtjänst "Få stöd i rekryteringen" och Samhall/Misa (förmedling via människa).
2. **Staten gör arbetsgivarsidan gratis.** Platsbanken är kostnadsfri (även via rekryteringsverktyg), och "Sök kandidater" kräver bara inloggning. Prisankare uppåt för ett Jobin-företagskonto är därför ~0 kr om det ses som annonsering/sökning; betalvilja finns bara för tid sparad eller trygghet i stödet (lönestöd, handledning).
3. **Rekryteringssystem (ATS) har inga publika priser.** Teamtailor, Jobylon, Varbi och Hubert säljer via offert. Enda publika SEK-signal: Recruto "från 995" (valuta/period ej angiven på källsidan). Teamtailor third-party-uppskattning ~229–400 USD/mån instegsnivå (EJ verifierat av bolaget), snitt-kontrakt ~16 500 USD/år (Vendr via tredjepart).
4. **Prismodeller som förekommer:** per öppen roll/årslicens (Teamtailor), offert/flat (Jobylon), per genomförd intervju med paket från 5 000 intervjuer/år (Hubert), per anställning/hire efter volymtrappa Grow/Scale/Enterprise, ingen plattformsavgift (Alva Labs), marknadspris per timme/uthyrning (bemanning, Samhall), statligt stöd till arbetsgivaren (AF lönebidrag m.fl.).
5. **Omsättningsskala:** Teamtailor 521,5 MSEK (2024), Jobylon 85,8 MSEK (2025), Varbi 82,1 MSEK (2024). Bemanning: Adecco Sweden 1 886 MSEK, Randstad AB 1 781 MSEK, Manpower AB 1 223 MSEK (alla 2025, förlust), Academic Work Sweden 1 118 MSEK (2024), Uniflex 771 MSEK och Poolia 473 MSEK (2025). Samhall 3 435 MSEK (2025) med statlig merkostnadsersättning ~7,6 mdr (2024).
6. **Marknaden för bemanning krymper och är förlustdrivande 2025** (Adecco, Randstad, Manpower minus; Pion Group -12 %). Poolia drabbas av 24-månadersregeln.
7. **Prisluckan för Jobin:** ingen konkurrent prissätter "förslag från konsulent till arbetsgivare". Rimlig referens: Alva Labs-modellen (betala per genomförd anställning, ingen plattformsavgift) eller en platt avgift per organisation; bör valideras i de tre företagssamtal roadmapen redan planerar (AG9).
8. **Kunde ej verifieras:** Misa/Inkludera/Praktikplatsen.se/Mitt Jobb/Ny Sits priser, Tengai och Alva Labs omsättning, Jobylon/Varbi/Teamtailor/Hubert SEK-priser.

## Pristabell

| Aktör | Modell | Pris (belagt) | Källa / datum sett |
|---|---|---|---|
| AF Platsbanken | Gratis annonsering, även via rekryteringsverktyg | 0 kr | arbetsformedlingen.se/for-arbetsgivare/rekrytera/annonsera-i-platsbanken (2026-10-18) |
| AF Sök kandidater | Gratis kandidatbank, inloggning krävs | 0 kr (pris nämns ej; ingen avgift angiven) | arbetsformedlingen.se/for-arbetsgivare/rekrytera/sok-kandidater |
| AF stöd/rekrytering | Rådgivning + ev. lönestöd (utbetalning till arbetsgivare). Belopp 2026 ej verifierade | ej hittad | arbetsformedlingen.se/for-arbetsgivare/anstallningsstod/anstall-med-ekonomiskt-stod |
| AF rekryteringsträffar | Kostnad ej belagd (endast Northvolt-EGF-insats uttryckligen kostnadsfri) | ej hittad | arbetsformedlingen.se/.../2025-03-03-stod-till-dig-som-rekryterar-uppsagd-fran-northvolt |
| Teamtailor | Offert, per antal öppna roller, obegränsat med användare, min. 1 år | Officiellt: "ingen prislista, begär offert". Tredjepart (ej verifierat): ~229–400 USD/mån instegsnivå, 229–1 500 USD/mån typiskt, snittkontrakt ~16 500–17 000 USD/år (Vendr 2025) | teamtailor.com/en/pricing; costbench.com/software/ats/teamtailor/negotiation; noon.ai/blog/articles/113-teamtailor-pricing-2026 |
| Jobylon | Offert/flat rate | Ej publikt. G2 "perceived cost" högsta nivån | g2.com/products/jobylon/pricing; trustradius.com/products/jobylon/pricing |
| Varbi (Grade Varbi) | Offert | Ej publikt | businesswith.se/jamfor-system/varbi-vs-recruto |
| Recruto (jämförelse) | Modul/abonnemang | "Från 995" (valuta och period ej angivna) | businesswith.se/jamfor-system/varbi-vs-recruto |
| Hubert.ai | Betala per genomförd intervju; lägsta paket 5 000 intervjuer/år; ATS-integration, obegränsat användare; 6 mån månadsbindning, 1 mån uppsägning | Belopp ej publika | hubert.ai/pricing |
| Alva Labs | Per hire (vid accepterat erbjudande), trappor Grow/Scale/Enterprise, ingen plattforms-/seatavgift, ingen avgift för ej anställda | Belopp ej publika | alvalabs.io/pricing |
| Samhall | Marknadsbaserade priser till kund; pris ej publicerat | ej hittad | arbetsformedlingen.se/.../rekrytera-personal-fran-samhall; Samhalls Trustpilot-svar |
| Bemanning (Adecco, Manpower, Randstad, Uniflex, Poolia, Academic Work) | Påslag på lön (uthyrning), % av årslön vid rekrytering | Ej hittad publikt | — |
| Jobbsprånget (IVA) | Fyra månaders praktik, gratis för arbetsgivare enligt 2020-företagspresentation (ej officiell prislista) | 0 kr (äldre källa) | energiforetagen.se/.../strategisk-kompetensforsorjning2020-nina-rudbeck-jobbspranget.pdf |
| FUF praktikantförmedling (jämförelse) | Avgift per rekryteringsprocess, 50 % för andra praktikant | Belopp ej i utdrag | fuf.se/wp-content/uploads/2025/12/Ramverk-och-villkor-FUFs-praktikantformedling.pdf |

## Omsättningstabell

| Aktör | Bolag (org.nr) | År | Omsättning | Status | Anställda | Källa |
|---|---|---|---|---|---|---|
| Teamtailor | Teamtailor AB (556936-6668) | 2024 | 521,5 MSEK; resultat e. fin. 5,7 MSEK; årets resultat 16,2 MSEK | Rapporterad (UC via allabolag) | 216 (allabolag, år oklart); 556 enl. Revelio (uppskattn.) | allabolag.se/5569366668 |
| Teamtailor | — | 2025 | 41,8 MUSD (Latka); inkonsekvent mot bokslut | Uppskattad, tveksam | — | getlatka.com/companies/teamtailor |
| Jobylon | Jobylon AB (556810-6172) | 2025 | 85,8 MSEK; resultat e. fin. 2,9 MSEK; EBITDA 7,6 MSEK | Rapporterad | 37 | allabolag.se/5568106172 |
| Varbi | Grade Varbi AB (556871-9743) | 2024 | 82,1 MSEK (+12 %); resultat 9,6 MSEK | Rapporterad (Syna) | 33 | upplysningar.syna.se/foretag/5568719743/varbi-ab |
| Hubert.ai | — | 2025 | Ej hittad. Seed 2,5 MEUR sep 2025; påstår lönsamhet och >400 % tillväxt | Ej hittad | — | hubert.ai/insights/hubert-raises-2-5m-to-accelerate-ai-led-transformation-of-high-volume-hiring |
| Alva Labs | Alva Labs AB | 2025 | ~5–10 MUSD | Uppskattad (Similarweb) | 51–200 | similarweb.com/company/alvalabs.io |
| Tengai | Tengai Unbiased | — | Ej hittad | — | — | — |
| Samhall | Samhall AB | 2025 | Nettoomsättning 3 435 MSEK (2024: 3 316); rörelseresultat -274 MSEK. Merkostnadsersättning 7 596 MSEK (2024) | Rapporterad | ej hämtat | samhall.se/wp-content/uploads/2026/02/Bokslutskommunike-Samhall-2025.pdf; samhall.se/wp-content/uploads/2024/04/Bokslutskommunike-2024.pdf |
| Misa | Misa AB (ägs av Stiftelsen Includia) | — | Ej hittad (Eniro-intervall 100–499 tkr är uppenbart ofullständigt) | Ej hittad | ~170 | mynewsdesk.com/se/wiljagruppen/... |
| Academic Work | Academic Work Sweden AB (556559-5450) | 2024 | 1 117,9 MSEK; resultat e. fin. 23,6 MSEK | Rapporterad | 376 | allabolag.se/5565595450 |
| Adecco | Adecco Sweden AB (556447-2677) | 2025 | 1 886 MSEK; resultat e. fin. -50,8 MSEK | Rapporterad | 2 631 | allabolag.se/5564472677 |
| Manpower | Manpower AB (556348-1588) | 2025 | 1 222,6 MSEK; resultat e. fin. -74,1 MSEK | Rapporterad | ~3 000 enl. bolaget | allabolag.se/5563481588 |
| Randstad | Randstad AB (556242-1718) | 2025 | 1 781 MSEK; resultat e. fin. -90,7 MSEK. Observera: annan koncernenhet än hela Randstad Sverige | Rapporterad | ej hämtat | allabolag.se/5562421718 |
| Uniflex | segment i PION Group | 2025 | 770,7 MSEK (2024: 837,3); EBIT 5,8 MSEK | Rapporterad | ~1 200 (Revelio, uppskattn.) | storage.mfn.se/ddaca304-0e01-4051-bab7-93955e264691/pion-group-ab-bokslutskommunike-2025.pdf |
| Poolia | segment i PION Group | 2025 | 473,4 MSEK (2024: 548,8); EBIT -3,3 MSEK | Rapporterad | ej hämtat | samma som ovan |
| PION Group | koncern | 2025 | 1 413 MSEK (2024: 1 601); EBIT 0,8 MSEK | Rapporterad | — | samma som ovan |

Ej hanterade (tid): Visma Recruit/Hantera, Praktikplatsen.se, Inkludera, Mitt Jobb, Ny Sits. Sökningarna gav inget; kan inte bekräftas att de finns kvar 2026.

## Funktionsmatris (J = ja, D = delvis, N = nej, ? = okänt)

Kolumner: AF = Arbetsförmedlingens arbetsgivartjänster (Platsbanken + Sök kandidater + stöd); TT = Teamtailor; JB = Jobylon; VB = Varbi; HU = Hubert; AL = Alva Labs; SH = Samhall; BM = bemanning (Adecco/Manpower/Randstad/Uniflex/Poolia/Academic Work, sammanslaget); JS = Jobbsprånget. Bedömningen bygger på produktens kärna; inte alla enskilda funktioner har verifierats mot respektive webbplats.

| # | AF | TT | JB | VB | HU | AL | SH | BM | JS |
|---|---|---|---|---|---|---|---|---|---|
| F01 CV-byggare | N | N | N | N | N | N | N | N | N |
| F02 CV-PDF | N | N | N | N | N | N | N | N | N |
| F03 CV-uppladdning/tolkning | D (profiler/CV i kandidatbank) | J (kandidat-CV i ATS) | J | J | ? | ? | N | D | N |
| F04 AI-brev | N | N | N | N | N | N | N | N | N |
| F05 AI-intervjuträning | N | N | N | N | D (AI-intervju för screening, ej träning) | N | N | N | N |
| F06 Kompetensgap | N | N | N | N | N | D (psykometri mot roll) | N | N | N |
| F07 Intresse-/yrkesguide | N | N | N | N | N | D | N | N | N |
| F08 LinkedIn | N | N | N | N | N | N | N | N | N |
| F09 Kontinuerlig AI-coach | N | N | N | N | N | D (agentisk) | N | N | N |
| F10 Spontanansökan/företag | N | N | N | N | N | N | N | N | N |
| F11 Jobbsökning i annonser | J (Platsbanken) | D (egna karriärsidor) | D | D | N | N | N | D | N |
| F12 Jobbevakning mejl | J (Platsbanken, jobbsökarsidan) | ? | ? | ? | N | N | N | D | N |
| F13 Ansökningstracker | N | J (arbetsgivarens pipeline) | J | J | J | J | N | N | N |
| F14 Lönestatistik | N | N | N | N | N | N | N | N | N |
| F15 Utbildningssökning | D (utbildningar via AF) | N | N | N | N | N | N | N | N |
| F16 Kunskapsbank | D (AF-sidor) | N | N | N | N | N | N | N | N |
| F17 Dagbok | N | N | N | N | N | N | N | N | N |
| F18 Mående | N | N | N | N | N | N | N | N | N |
| F19 Energianpassning | N | N | N | N | N | N | D (anpassad arbetsmiljö) | N | N |
| F20 Kalender | N | J (schemaläggning intervju) | D | D | N | N | N | N | N |
| F21 Konsulentvy | N | N | N | N | N | N | N | N | N |
| F22 Aktivitetskrav | N | N | N | N | N | N | N | N | N |
| F23 Journal | N | N | N | N | N | N | N | N | N |
| F24 Meddelanden | D (kontakt med kandidat) | J | J | J | D | D | N | N | N |
| F25 Rapporter uppdragsgivare | N | D (analyser) | D | D | D | D | N | N | D (återrapport AF) |
| F26 Arbetsgivarvy/matchning | J (Sök kandidater, stöd) | J | J | J | J | J | J (rekrytera från Samhall) | J | J (praktik) |
| F27 Flera språk/lätt svenska | D (AF har språkversioner, ej belagt för Sök kandidater) | J (flerspråkigt) | D | ? | ? | ? | ? | N | N |
| F28 WCAG uttalad | J (offentlig myndighet, lagkrav) | ? | ? | ? | ? | ? | ? | ? | ? |
| F29 BankID/SSO | ? | J (SSO enl. prissida) | ? | ? | ? | ? | N | N | N |
| F30 EU-lagring/GDPR | J | ? | ? | ? | ? | ? | J | ? | N |

Notering: de flesta "N" på F01–F25 betyder att produkten inte finns inom segmentet, inte att den är brist. Arbetsgivarsegmentet konkurrerar med Jobin i F26 och delvis F13/F24.

## Aktörsprofiler

### Arbetsförmedlingen (arbetsgivartjänster)
- URL: arbetsformedlingen.se/for-arbetsgivare. Statlig myndighet. Betalare: skattebetalarna; arbetsgivaren betalar inget för annonsering.
- Tjänster (sidan "rekryteringstjänster"): Annonsera i Platsbanken, Sök kandidater, Få stöd i rekryteringen, Anställa från utbildning, Rekrytera med hjälp av leverantörer, Rekrytera personal från Samhall, Rekrytera i Europa (EURES), Branscharbetsförmedling.
- Sök kandidater: arbetsgivare med inloggning söker bland jobbsökande som frivilligt publicerat profil/CV, sparar sökningar, kontaktar direkt. Endast för verkliga erbjudanden om anställning (villkor).
- Platsbanken: villkor gäller sedan 2025-12-01; automatisk granskning vid publicering.
- Styrkor mot Jobin: gratis, störst täckning, lagstadgad. Svagheter: ingen konsulentmedlad förslagsmodell i själva kandidatbanken; stöd sker via lokal handläggare. Jobin kan inte konkurrera på pris, bara komplettera.
- Källor: arbetsformedlingen.se/for-arbetsgivare/rekryteringstjanster; /rekrytera/sok-kandidater; /rekrytera/annonsera-i-platsbanken; /anstallningsstod/anstall-med-ekonomiskt-stod.

### Teamtailor
- URL: teamtailor.com. Sverige (Stockholm). Teamtailor AB 556936-6668. Rekryteringssystem (ATS) och karriärsidor, betalar arbetsgivaren.
- Prismodell: offert, baserad på antal öppna roller, obegränsat med användare, minst ett års kontrakt. Inga officiella belopp.
- Omsättning 521,5 MSEK (2024, rapporterad). 450+ integrationer, AI ingår (obegränsad användning enligt prissidan).
- Mot Jobin: Styrka: stark på pipeline, schemaläggning. Svaghet: ingen koppling till konsulent eller person långt från arbetsmarknaden. Plattformen kan i stället bli integrationskanal (kandidat → arbetsgivarens ATS).
- Källor: allabolag.se/5569366668; teamtailor.com/en/pricing; costbench.com/software/ats/teamtailor/negotiation; noon.ai/blog/articles/113-teamtailor-pricing-2026; getlatka.com/companies/teamtailor.

### Jobylon
- Stockholm. Jobylon AB 556810-6172. ATS för medelstora/större bolag. Pris: offert, 5/5 dollartecken på G2, ~2 månaders implementering (G2).
- Omsättning 85,8 MSEK, 37 anställda (2025, rapporterad).
- Mot Jobin: samma som Teamtailor; högre prisnivå, inget fokus på inkludering.
- Källor: allabolag.se/5568106172; g2.com/products/jobylon/pricing; trustradius.com/products/jobylon/pricing.

### Varbi (Grade Varbi AB)
- Stockholm. 556871-9743. ATS med stark offentlig sektor-profil (ägs av Viking Venture sedan 2021 enl. Tech.eu). Pris ej publikt.
- Omsättning 82,1 MSEK, 33 anställda (2024, Syna).
- Mot Jobin: kommuner som är kunder hos Varbi är samma organisationer Jobin säljer till; integration/importväg värd att utreda.
- Källor: upplysningar.syna.se/foretag/5568719743/varbi-ab; funding.tech.eu/companies/B06DBB43-E313-4EAC-82A8-F9699BB552AD.

### Hubert.ai
- AI-driven screeningintervju i hög volym (Securitas, Coop, ManpowerGroup nämns). Seed 2,5 MEUR sep 2025. Pris: betala per genomförd intervju, paket från 5 000 intervjuer/år. Inget publikt belopp.
- Mot Jobin: tar kandidaten utifrån arbetsgivarens behov, inte deltagarens. Kan bli samarbetsmöjlighet eller hot om deltagaren möter AI-intervju.
- Källor: hubert.ai/pricing; hubert.ai/insights/hubert-raises-2-5m-...; staffingindustry.com/news/global-daily-news/hubert-raises-eu25-million-in-funding-to-boost-ai-hiring.

### Alva Labs
- Stockholm. Psykometri/AI-baserad rekrytering. Pris: per hire, volymtrappa, utan plattformsavgift, faktureras i efterskott. Omsättning ~5–10 MUSD (Similarweb, uppskattad). Org.nr och bokslut ej hittade.
- Mot Jobin: prismodellen "betala när en anställning sker" är intressant referens om Jobin vill ta betalt av arbetsgivare.
- Källor: alvalabs.io/pricing; similarweb.com/company/alvalabs.io.

### Tengai, Visma Recruit, Mitt Jobb, Ny Sits, Praktikplatsen.se, Inkludera
Ej belagt i denna körning. Tengai: ingen träff på bolagsdata. Övriga: inga användbara träffar; kontrollera manuellt om de finns kvar.

### Samhall
- Statligt ägt (Samhall AB). Anställer personer med funktionsnedsättning och hyr ut/utför tjänster; AF refererar dem som rekryteringskanal. Pris: marknadsmässigt, ej publicerat. Nettoomsättning 3 435 MSEK 2025 (2024: 3 316), rörelseresultat -274 MSEK; merkostnadsersättning 7 596 MSEK (2024).
- Mot Jobin: inte konkurrent om jobbsökande men om "inkluderande arbetsgivare"-berättelsen; möjlig samarbetspartner.
- Källor: samhall.se/wp-content/uploads/2026/02/Bokslutskommunike-Samhall-2025.pdf; samhall.se/wp-content/uploads/2024/04/Bokslutskommunike-2024.pdf; arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/rekrytera-personal-fran-samhall.

### Misa
- Ägs av Stiftelsen Includia; ~170 anställda; Stockholm, Helsingborg, Lund, Uppsala, Västerås. Kunder: kommuner och AF. Rusta och matcha-leverantör (Stockholm, Helsingborg, Lund). Alltså **Jobins målgrupp (organisationskund)**, inte en arbetsgivartjänst i första hand. Omsättning ej hittad. Pris ej hittat.
- Källa: mynewsdesk.com/se/wiljagruppen/pressreleases/misa-startar-upp-arbetet-med-rusta-och-matcha-3135864.

### Jobbsprånget (IVA)
- Fyra månaders praktik för nyanlända akademiker; gratis för arbetsgivare enligt en företagspresentation från 2020 (äldre källa). Finansierat av staten (uppdrag 2018, upp till ~15 MSEK/år 2019–2021). Aktuellt läge och finansiering 2026 ej verifierat.
- Källor: regeringen.se/regeringsuppdrag/2018/03/uppdrag-att-genomfora-jobbspranget; energiforetagen.se/.../strategisk-kompetensforsorjning2020-nina-rudbeck-jobbspranget.pdf.

### Bemanning och rekrytering
Alla rapporterade 2025-siffror gäller de svenska juridiska bolagen angivna i omsättningstabellen, inte nödvändigtvis hela landsverksamheten.
- **Adecco Sweden AB:** 1 886 MSEK, -50,8 MSEK. Allabolag.
- **Manpower AB:** 1 223 MSEK, -74,1 MSEK. Bolaget uppger ~14 000 personer fick jobb genom dem under 2025 och ~3 000 medarbetare (via.tt.se/pressrum/783398/manpowergroup). Notera: Indeeds uppgift ">9 mdr" ej förenlig med allabolag, ej använd.
- **Randstad AB:** 1 781 MSEK, -90,7 MSEK. Allabolag.
- **Academic Work Sweden AB:** 1 118 MSEK (2024); 2025 ej hittad. Ägarförändring: CEO Johan Skarborg ökar till 43 %, Novax in med 15 % (Realtid, 2026-10-01).
- **Uniflex 770,7 MSEK, Poolia 473,4 MSEK** (PION Group, 2025). Poolia drabbas särskilt av 24-månadersregeln.
- Mot Jobin: bemanning betalas per timme/rekryteringsavgift av arbetsgivaren, men de matchar mot efterfrågad kompetens och bryr sig inte om kontext kring långtidsarbetslösa. Svagt konkurrenshot, men visar vad arbetsgivare är van vid att betala för en matchad person (inga procentsatser belagda här).

## Implikationer för Jobin-företagskontot
- Gratis alternativ (Platsbanken, Sök kandidater) sätter taket för vad arbetsgivare betalar för ren åtkomst. Prissätt värdet i förarbete: konsulentens kvalitetssäkrade förslag, stöd/handledning och rapportering till kommunen, inte åtkomsten.
- Mönster att överväga: platt avgift per organisation (kommunen betalar redan 2 990 kr/mån + 290/konsulent) och gratis för arbetsgivaren, eftersom arbetsgivaren inte är kunden i Jobins kedja. Alva Labs-modellen (per anställning) är det trovärdiga alternativet om arbetsgivare ska betala.
- Hitta aldrig påstående om priser utan offert hos Teamtailor/Jobylon/Varbi: siffrorna här är tredjepartsuppskattningar.
