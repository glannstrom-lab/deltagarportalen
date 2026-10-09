/**
 * Rådgivarnas hälsningar — en per sida, med röst.
 *
 * När användaren kommer till en sida hälsar sidans första rådgivare
 * (`PAGE_COACH_CONTENT[nyckel].coachIds[0]` i `coaches.ts`) kort, säger vad
 * sidan är till för och pekar på ETT nästa steg med en knapp. Rådgivaren går
 * från att vara en kolumn man läser till att vara någon som tar en i handen.
 *
 * ── Varför klippen är förinspelade ─────────────────────────────────────────
 *
 * Ljudet är mp3-filer som spelats in en gång med ElevenLabs och ligger i
 * `public/radgivare/ljud/`. Ingenting syntetiseras när sidan visas. Det ger två
 * saker som vi inte vill ge upp:
 *
 *   · Inga personuppgifter lämnar portalen. En hälsning som sa användarens
 *     namn, antal ansökningar eller ett datum skulle kräva ett anrop till
 *     ElevenLabs med just de uppgifterna — ett nytt underbiträde som inte står
 *     i integritetspolicyn, Art. 30-registret eller DPIA:n (jfr Perplexity,
 *     ROADMAP A23). Därför innehåller ingen text här namn, siffror eller datum.
 *   · Ingen körkostnad. Ett klipp spelas in en gång och kostar sedan bara
 *     bandbredd, oavsett hur många som besöker sidan.
 *
 * Priset är att texten är samma för alla. Det är därför Översiktens
 * hälsningar (OVERSIKT_STEG) är generiska: kortet på sidan säger "det har gått
 * nio dagar", rösten säger bara att en arbetsgivare inte har svarat än.
 *
 * ── Regeln för varje post ─────────────────────────────────────────────────
 *
 * Varje påstående ska gå att belägga i koden. Rådgivarna lovade 2026-08-17
 * tjugo saker portalen inte gjorde (CLAUDE.md, "Rådgivarna"). Därför har varje
 * post en `// belägg:`-rad som pekar på var steget faktiskt finns. Ändras
 * sidan under en hälsning ska hälsningen ändras med den — och klippet spelas
 * in igen, för ljudet uppdateras inte av sig självt.
 *
 * Ton (DESIGN.md §1–2): lugn vän, inte myndighet. Enkel svenska och enkel
 * engelska (ungefär B1, läsaren är ofta nyanländ). Inga löften om resultat,
 * inget prestationsspråk. Svenska myndighetsnamn översätts aldrig.
 *
 * `steg.till` är en intern rutt i samma form som `<Link to>` i appen, eller
 * `null` när nästa steg ligger på samma sida utan egen rutt (ett fält, en
 * knapp högre upp). Översiktens steg har ingen `steg` här: knappen och målet
 * kommer redan från `valjNastaSteg` i `nastaStegRegler.ts`.
 */

import type { CoachId } from './coaches'
import type { StegId } from '@/pages/hubs/nastaStegRegler'

export interface Halsning {
  coachId: CoachId
  sv: string
  en: string
  steg: { sv: string; en: string; till: string | null } | null
}

/** Nyckel = pageKey i `PAGE_COACH_CONTENT` (se `radgivarRutter.ts`). */
export const SIDHALSNINGAR: Record<string, Halsning> = {
  // ------------------------------------------------------------ Hubbarna
  dashboard: {
    // Allmän hälsning för Översikt. Själva nästa steget väljs dynamiskt och
    // har egna klipp i OVERSIKT_STEG / OVERSIKT_INGET nedan.
    // belägg: pages/hubs/NastaSteg.tsx:81 (kortet "Ett bra nästa steg")
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här på översikten ser du ett förslag på vad som kan vara bra att göra nu. Du väljer själv om du vill ta det.',
    en: 'Hi, this is Andreas. This overview shows one idea for what could be good to do now. You decide if you want to do it.',
    steg: null,
  },
  jobbHub: {
    // belägg: pages/hubs/JobsokHub.tsx:91-96 (första kortet, "Sök jobb" → /job-search)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här finns allt för att söka jobb. Börja gärna med att leta upp ett jobb som verkar intressant.',
    en: 'Hi, this is Andreas. Here you find everything for looking for a job. A good start is to find a job that looks interesting.',
    steg: { sv: 'Sök jobb', en: 'Search for jobs', till: '/job-search' },
  },
  karriarHub: {
    // belägg: pages/hubs/KarriarHub.tsx:90-96 (kortet "Intresseguide" → /interest-guide)
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Här kan du fundera på vart du vill. Är du osäker kan intresseguiden ge dig idéer om yrken.',
    en: 'Hi, this is Sara. Here you can think about where you want to go. If you are not sure, the interest guide can give you ideas for jobs.',
    steg: { sv: 'Öppna intresseguiden', en: 'Open the interest guide', till: '/interest-guide' },
  },
  resurserHub: {
    // belägg: pages/hubs/ResurserHub.tsx:82-90 (första kortet, "Kunskapsbank" → /knowledge-base)
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här finns artiklar, länkar och det du har sparat. Kunskapsbanken är ett bra ställe att börja på.',
    en: 'Hi, this is Daniel. Here you find articles, links and things you have saved. The knowledge bank is a good place to start.',
    steg: { sv: 'Öppna kunskapsbanken', en: 'Open the knowledge bank', till: '/knowledge-base' },
  },
  vardagHub: {
    // Kalendern i stället för Mående: måendeloggen kräver ett samtycke först
    // (WellnessConsentGate), och planering är arbetsterapeutens område.
    // belägg: pages/hubs/MinVardagHub.tsx:131-137 (kortet "Kalender" → /calendar)
    coachId: 'arbetsterapeut',
    sv: 'Hej, det är Linnea. Här finns det som rör din vardag. Börja gärna i kalendern och planera in en liten sak den här veckan.',
    en: 'Hi, this is Linnea. Here you find things for your everyday life. You can start in the calendar and plan one small thing this week.',
    steg: { sv: 'Öppna kalendern', en: 'Open the calendar', till: '/calendar' },
  },

  // ------------------------------------------------------------ Söka jobb
  profile: {
    // Fliken "Översikt" är förvald och börjar med kontaktuppgifter, sedan önskade jobb.
    // belägg: components/profile/constants.ts:189, components/profile/sections/OverviewSection.tsx:60,108
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här samlar du uppgifter om dig själv. Börja med namn och kontaktuppgifter. Skriv sedan vilka jobb du vill ha.',
    en: 'Hi, this is Andreas. Here you collect facts about yourself. Start with your name and contact details. Then write which jobs you want.',
    steg: { sv: 'Fyll i kontaktuppgifter', en: 'Add contact details', till: null },
  },
  cv: {
    // Steg 1 av 6 är "Design" (mall och färger). "Importera CV" ligger först i åtgärdsraden.
    // belägg: pages/CVBuilder.tsx:59 (STEPS[0] = design), pages/CVBuilder.tsx:1578 (Importera CV)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här bygger du ditt CV steg för steg. Börja med att välja en mall. Har du redan ett CV kan du importera det i stället.',
    en: 'Hi, this is Andreas. Here you build your CV step by step. Start by choosing a template. If you already have a CV, you can import it instead.',
    steg: { sv: 'Välj en mall', en: 'Choose a template', till: null },
  },
  jobSearch: {
    // belägg: pages/JobSearch.tsx:594 (sökrutan "Vad vill du jobba med?"), pages/JobSearch.tsx:146 (spara jobb)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här letar du bland jobben i Platsbanken. Skriv vad du vill jobba med i sökrutan. Spara de jobb som verkar rimliga.',
    en: 'Hi, this is Andreas. Here you look at jobs from Platsbanken. Write what you want to work with in the search box. Save the jobs that seem right.',
    steg: { sv: 'Skriv ett sökord', en: 'Type a search word', till: null },
  },
  applications: {
    // belägg: pages/Applications.tsx:124 (knappen "Ny ansökan", syns på alla flikar och bredder)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här håller du koll på dina ansökningar. Lägg till en ansökan du har skickat, så ser du var den står.',
    en: 'Hi, this is Andreas. Here you keep track of your applications. Add an application you have sent, and you can see where it is.',
    steg: { sv: 'Lägg till en ansökan', en: 'Add an application', till: null },
  },
  coverLetter: {
    // Steg 1 "Jobb och utseende": "Vilket jobb gäller brevet? Välj ett du sparat, eller fyll i själv."
    // belägg: components/cover-letter/CoverLetterWrite.tsx:875, :1335-1338
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här skriver du ett personligt brev. Börja med att välja vilket jobb brevet gäller, ett du har sparat eller ett du fyller i själv.',
    en: 'Hi, this is Andreas. Here you write a cover letter. Start by choosing the job the letter is for. Pick one you saved, or write it in yourself.',
    steg: { sv: 'Välj jobbet', en: 'Choose the job', till: null },
  },
  spontaneous: {
    // Sökläget är AI-sökning som förval; med AI avstängt finns sökning på
    // organisationsnummer. Texten lovar därför inte AI, bara att man söker.
    // belägg: pages/spontaneous/SearchTab.tsx:113 (förval), :664 (sökrutan), :496 (spara företag)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här hittar du företag att höra av dig till, även om de inte har en annons ute. Sök efter den sortens företag du vill jobba på.',
    en: 'Hi, this is Andreas. Here you find companies to contact, even if they have no job ad. Search for the kind of company you want to work for.',
    steg: { sv: 'Sök efter företag', en: 'Search for companies', till: null },
  },
  interviewSimulator: {
    // belägg: pages/InterviewSimulator.tsx:1064 (yrke), :1107 (Starta intervjun), :577 (mikrofon eller skriva)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här kan du öva inför en intervju. Skriv vilket jobb du vill öva inför och starta. Du kan svara med rösten eller skriva.',
    en: 'Hi, this is Andreas. Here you can practise for a job interview. Write the job you want to practise for and start. You can answer by speaking or writing.',
    steg: { sv: 'Starta en övning', en: 'Start practising', till: null },
  },
  salary: {
    // Kalkylatorn säger själv att siffrorna är grova uppskattningar, inte hämtad statistik.
    // belägg: pages/salary/SalaryCalculatorTab.tsx:173 (Berätta lite om dig), :250 (Räkna ut din lön)
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här kan du räkna på lön. Välj yrkesområde, var du bor och hur länge du har jobbat. Svaret är en grov uppskattning att utgå från.',
    en: 'Hi, this is Andreas. Here you can work out a salary. Choose your work area, where you live and how long you have worked. The answer is a rough guess to start from.',
    steg: { sv: 'Räkna på lönen', en: 'Work out the salary', till: null },
  },
  international: {
    // Sara i stället för coachIds[0] (Andreas): förvald flik är "Din utbildning"
    // — bedömning av utländsk utbildning hos UHR, vilket är studievägledning.
    // Sara finns redan som andra rådgivare på sidan.
    // belägg: pages/International.tsx:67 (ValideringTab förvald), pages/international/ValideringTab.tsx:68
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Har du utbildning från ett annat land kan UHR bedöma vad den motsvarar i Sverige. Läs först hur det går till.',
    en: 'Hi, this is Sara. If you studied in another country, UHR can check what your education is worth in Sweden. First read how it works.',
    steg: { sv: 'Läs om bedömningen', en: 'Read about it', till: null },
  },

  // ------------------------------------------------------------ Karriär
  interestGuide: {
    // Förvald flik är själva testet. Svaren sparas på servern medan man svarar.
    // belägg: pages/InterestGuide.tsx:85 (TestTab index), pages/interest-guide/TestTab.tsx:450, :467 (sparat)
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Intresseguiden ger idéer om yrken som kan passa dig. Svara på frågorna i din egen takt. Det du svarar sparas, så du kan ta en paus.',
    en: 'Hi, this is Sara. The interest guide gives ideas for jobs that may suit you. Answer the questions at your own speed. Your answers are saved, so you can take a break.',
    steg: { sv: 'Svara på frågorna', en: 'Answer the questions', till: null },
  },
  career: {
    // Förvald flik "Arbetsmarknad" har längst ner "Utsikter för ett yrke" (AF:s yrkesbarometer).
    // belägg: pages/Career.tsx:111, pages/career/LaborMarketTab.tsx:311, :386-426
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Här ser du hur det ser ut på arbetsmarknaden. Skriv ett yrke, så visar vi hur Arbetsförmedlingen bedömer chansen att få jobb där.',
    en: 'Hi, this is Sara. Here you see how the job market looks. Write a job title, and we show how Arbetsförmedlingen rates the chance of getting work there.',
    steg: { sv: 'Kolla ett yrke', en: 'Look up a job', till: null },
  },
  education: {
    // belägg: pages/Education.tsx:502 (sökrutan "Sök utbildning, ämne eller skola")
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Här kan du leta efter utbildningar. Sök på ett ämne eller ett yrke du är nyfiken på.',
    en: 'Hi, this is Sara. Here you can look for courses and education. Search for a subject or a job you are curious about.',
    steg: { sv: 'Sök en utbildning', en: 'Search for a course', till: null },
  },
  skillsGapAnalysis: {
    // Kräver att CV:t har erfarenhet/utbildning/kompetenser — annars visar sidan "Öppna CV:t".
    // belägg: pages/skills-gap/SkillsGapForm.tsx:225 (drömjobbsfältet), :175-177 (spärr utan CV)
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Här jämför du ditt CV med ett jobb du vill ha. Skriv vilket jobb det är, så ser du vad som redan passar och vad som saknas.',
    en: 'Hi, this is Sara. Here you compare your CV with a job you want. Write which job it is, and you see what already fits and what is missing.',
    steg: { sv: 'Skriv ditt drömjobb', en: 'Write your dream job', till: null },
  },
  personalBrand: {
    // Förvald flik "Din bild utåt": frågor att kryssa i, "resten är förslag, inte krav".
    // belägg: pages/PersonalBrand.tsx:80, pages/personal-brand/BrandAuditTab.tsx:212
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här ser du hur du syns för en arbetsgivare. Kryssa i det du redan har gjort. Resten är förslag, inte krav.',
    en: 'Hi, this is Daniel. Here you see how an employer sees you. Tick what you have already done. The rest are ideas, not rules.',
    steg: { sv: 'Gå igenom frågorna', en: 'Go through the questions', till: null },
  },

  // ------------------------------------------------------------ Söka jobb, forts.
  linkedinOptimizer: {
    // Förvald flik "Rubrik", första fältet "Vad du gör eller vill göra".
    // belägg: pages/LinkedInOptimizer.tsx:122 (förval 'headline'), :368-377
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här kan du göra din LinkedIn-profil tydligare. Börja med rubriken, raden under ditt namn. Skriv vad du gör eller vill göra.',
    en: 'Hi, this is Daniel. Here you can make your LinkedIn profile clearer. Start with the headline, the line under your name. Write what you do or want to do.',
    steg: { sv: 'Skriv din rubrik', en: 'Write your headline', till: null },
  },

  // ------------------------------------------------------------ Min vardag
  diary: {
    // Säger inte "bara du ser den": påståendet är belagt i coaches.ts (RLS +
    // ingen konsulentvy, mätt 2026-08-18) men ett förinspelat klipp lever
    // längre än en mätning. OBS: att spara en anteckning kräver
    // måendesamtycket (MV2, Diary.tsx:65-69) — se rapporten.
    // belägg: components/diary/JournalTab.tsx:378 (skrivtips), :433 (ny anteckning)
    coachId: 'mentalcoach',
    sv: 'Hej, det är Mona. Här kan du skriva för din egen skull. Några rader om dagen räcker. Vet du inte vad du ska skriva finns ett skrivtips.',
    en: 'Hi, this is Mona. Here you can write just for yourself. A few lines about your day is enough. If you do not know what to write, there is a writing tip.',
    steg: { sv: 'Skriv en anteckning', en: 'Write a note', till: null },
  },
  wellness: {
    // Första gången visas samtyckesgrinden ("Ge samtycke") före loggningen.
    // belägg: pages/Wellness.tsx:65, components/consent/WellnessConsentGate.tsx:126, pages/wellness/HealthTab.tsx:287
    coachId: 'mentalcoach',
    sv: 'Hej, det är Mona. Här kan du följa hur du mår över tid. Välj det som passar dagen, det tar en halv minut. Första gången frågar vi om vi får spara det.',
    en: 'Hi, this is Mona. Here you can follow how you feel over time. Choose what fits your day, it takes half a minute. The first time, we ask if we may save it.',
    steg: { sv: 'Logga hur du mår', en: 'Log how you feel', till: null },
  },
  calendar: {
    // belägg: pages/Calendar.tsx:359 (knappen "Ny händelse"), :340 (samma i tomtillståndet)
    coachId: 'arbetsterapeut',
    sv: 'Hej, det är Linnea. Här samlar du möten och sådant du har planerat. Lägg in en liten sak först, till exempel en stund för att söka jobb.',
    en: 'Hi, this is Linnea. Here you keep meetings and things you have planned. Add one small thing first, for example some time to look for jobs.',
    steg: { sv: 'Lägg in en händelse', en: 'Add an event', till: null },
  },
  exercises: {
    // belägg: pages/Exercises.tsx:502 (invit "välj en nedan"), :473 (sparas i molnet)
    coachId: 'mentalcoach',
    sv: 'Hej, det är Mona. Här finns övningar du kan göra i lugn takt. Välj en som känns lagom i dag. Dina svar sparas, så du kan fortsätta en annan dag.',
    en: 'Hi, this is Mona. Here you find exercises you can do at a calm pace. Choose one that feels right today. Your answers are saved, so you can go on another day.',
    steg: { sv: 'Välj en övning', en: 'Choose an exercise', till: null },
  },
  myConsultant: {
    // Måste fungera både med och utan konsulent (70 av 101 konton saknade
    // koppling 2026-09-08, MyConsultant.tsx BL1). Länken till integritets-
    // inställningarna fungerar i båda lägena; Settings läser ?section= vid montering.
    // belägg: pages/MyConsultant.tsx:386 (/settings?section=privacy), pages/Settings.tsx:81-83
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Här ser du din konsulent, om du har en. Du kan också se och ändra vad du delar med konsulenten.',
    en: 'Hi, this is Andreas. Here you see your job coach, if you have one. You can also see and change what you share with them.',
    steg: { sv: 'Ändra vad du delar', en: 'Change what you share', till: '/settings?section=privacy' },
  },
  settings: {
    // till: null med flit. Settings läser `?section=` bara i useState-
    // initieraren (Settings.tsx:81-83), så en länk till samma sida med
    // ?section=accessibility byter INTE avsnitt när man redan står där.
    // belägg: pages/Settings.tsx:48 (avsnittet Tillgänglighet), :426-460 (Större text, Lugnt läge)
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här ändrar du hur portalen fungerar för dig. Under Tillgänglighet kan du till exempel få större text eller ett lugnt läge.',
    en: 'Hi, this is Daniel. Here you change how the site works for you. Under Accessibility you can, for example, get bigger text or a calm mode.',
    steg: { sv: 'Öppna Tillgänglighet', en: 'Open Accessibility', till: null },
  },

  // ------------------------------------------------------------ Resurser
  knowledgeBase: {
    // belägg: pages/KnowledgeBase.tsx:193 (Vad letar du efter?), :242 (Vad vill du läsa om?)
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Här finns artiklar och guider om att söka jobb. Skriv vad du undrar över, eller välj ett ämne längre ner.',
    en: 'Hi, this is Sara. Here you find articles and guides about looking for work. Write what you wonder about, or choose a topic further down.',
    steg: { sv: 'Sök en artikel', en: 'Search for an article', till: null },
  },
  resources: {
    // OBS: pageKey 'resources' används av radgivarRutter.ts för BÅDE /resources
    // och /externa-resurser. Den här texten gäller /resources (Dina sparade
    // resurser). För /externa-resurser finns `externalResources` nedan — den
    // behöver en egen rad i ROUTE_TO_PAGE_KEY för att nås.
    // belägg: pages/Resources.tsx:263 (?tab= styr fliken), :371 (fliken Dokument)
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här hamnar det du sparar i portalen: CV, brev, jobb och artiklar. Börja med att titta på dina dokument.',
    en: 'Hi, this is Daniel. Things you save on the site end up here: your CV, letters, jobs and articles. Start by looking at your documents.',
    steg: { sv: 'Se dina dokument', en: 'See your documents', till: '/resources?tab=documents' },
  },
  externalResources: {
    // Ingen egen pageKey i PAGE_COACH_CONTENT än — se kommentaren under `resources`.
    // belägg: pages/ExternalResources.tsx:332 (sökfältet), :304 (ämnesflikar), data/externaResurser.ts:220
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här finns länkar till Arbetsförmedlingen, Försäkringskassan och andra. Sök på det du behöver, eller välj ett ämne.',
    en: 'Hi, this is Daniel. Here you find links to Arbetsförmedlingen, Försäkringskassan and others. Search for what you need, or choose a topic.',
    steg: { sv: 'Sök bland länkarna', en: 'Search the links', till: null },
  },
  aiTeam: {
    // Säger rakt ut att det är en AI (AI Act art. 50). Lovar inget om svaret:
    // AI kan vara avstängd för kontot eller organisationen.
    // belägg: pages/AITeam.tsx:122 (Välj din agent)
    coachId: 'digitalcoach',
    sv: 'Hej, det är Daniel. Här kan du chatta med AI-coacher. Det är en AI som svarar, inte en människa. Välj vem du vill prata med och ställ en fråga.',
    en: 'Hi, this is Daniel. Here you can chat with AI coaches. An AI answers, not a person. Choose who you want to talk to and ask a question.',
    steg: { sv: 'Välj vem du pratar med', en: 'Choose who to talk to', till: null },
  },
}

/**
 * Översiktens hälsning per nästa steg. Generiska med flit: kortet visar
 * siffran och datumet, rösten gör det inte (se filhuvudet). Säger samma sak
 * som `hubOverview.nasta.<id>` i sv.json, utan interpolerade värden.
 * Rådgivaren följer ämnet, inte Översiktens coachIds — kalendern är Linneas
 * och kompetensanalysen Saras, precis som på deras egna sidor.
 */
export const OVERSIKT_STEG: Record<StegId, Omit<Halsning, 'steg'>> = {
  followUp: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. En arbetsgivare har inte svarat på din ansökan än. Ett kort mejl där du frågar hur det går visar att du är intresserad.',
    en: 'Hi, this is Andreas. An employer has not answered your application yet. A short email asking how it is going shows that you are interested.',
  },
  spontaneous: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Du har planerat att höra av dig till ett företag igen. Ett kort meddelande räcker.',
    en: 'Hi, this is Andreas. You planned to contact a company again. A short message is enough.',
  },
  event: {
    coachId: 'arbetsterapeut',
    sv: 'Hej, det är Linnea. Du har något inbokat snart. Titta i kalendern, så vet du tid och plats.',
    en: 'Hi, this is Linnea. You have something booked soon. Look in the calendar to check the time and place.',
  },
  createCv: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Ett CV är grunden för det mesta här. Du kan ladda upp ett du redan har, eller bygga ett steg för steg.',
    en: 'Hi, this is Andreas. A CV is the base for most things here. You can upload one you already have, or build one step by step.',
  },
  updateCv: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Det var ett tag sedan du ändrade ditt CV. Lägg till något nytt du har gjort sedan dess.',
    en: 'Hi, this is Andreas. It has been a while since you changed your CV. Add something new you have done since then.',
  },
  firstJob: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Ditt CV finns. Nästa steg är att spara ett jobb som verkar rimligt. Du behöver inte söka det i dag.',
    en: 'Hi, this is Andreas. Your CV is ready. The next step is to save a job that seems right. You do not have to apply today.',
  },
  firstLetter: {
    coachId: 'jobbcoach',
    sv: 'Hej, det är Andreas. Du har jobb sparade. Ett personligt brev till ett av dem kan byggas ur ditt CV.',
    en: 'Hi, this is Andreas. You have saved jobs. A cover letter for one of them can be built from your CV.',
  },
  skills: {
    coachId: 'studievagledare',
    sv: 'Hej, det är Sara. Jämför ditt CV med ett jobb du drömmer om. Då ser du vad som redan passar och vad som saknas.',
    en: 'Hi, this is Sara. Compare your CV with a job you dream about. Then you see what already fits and what is missing.',
  },
  mood: {
    coachId: 'mentalcoach',
    sv: 'Hej, det är Mona. Hur känns dagen? Att logga hur du mår tar en halv minut. Efter några veckor ser du vad som ger dig energi.',
    en: 'Hi, this is Mona. How is your day? Logging how you feel takes half a minute. After a few weeks you can see what gives you energy.',
  },
}

/** När `valjNastaSteg` ger null: inget brådskar. Återhämtning räknas också. */
export const OVERSIKT_INGET: Omit<Halsning, 'steg'> = {
  coachId: 'jobbcoach',
  sv: 'Hej, det är Andreas. Just nu finns det inget som brådskar. Välj något du har lust med, eller ta det lugnt i dag.',
  en: 'Hi, this is Andreas. Right now nothing is urgent. Choose something you feel like doing, or take it easy today.',
}

/** Ljudfil för en hälsning. Klippen ligger i public/radgivare/ljud/. */
export function ljudFor(nyckel: string, sprak: 'sv' | 'en'): string { return `/radgivare/ljud/${nyckel}-${sprak}.mp3` }
