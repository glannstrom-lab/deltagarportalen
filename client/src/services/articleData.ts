// Article data for Knowledge Base
// Separated from mockApi.ts to reduce file size

export interface ArticleChecklistItem {
  id: string
  text: string
}

export interface ArticleAction {
  label: string
  href: string
  type: 'primary' | 'secondary'
}

export interface EnhancedArticle {
  id: string
  title: string
  summary: string
  content: string
  category: string
  subcategory?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  readingTime: number
  difficulty: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
  energyLevel: 'low' | 'medium' | 'high'
  helpfulnessRating?: number
  bookmarkCount?: number
  relatedArticles: string[]
  relatedTools?: string[]
  relatedExercises?: string[]
  checklist?: ArticleChecklistItem[]
  actions?: ArticleAction[]
  author?: string
  authorTitle?: string
}

// Mappning från övningskategorier till artikelkategorier
export const exerciseToArticleCategoryMap: { [key: string]: string } = {
  'Självkännedom': 'self-awareness',
  'Jobbsökning': 'job-search',
  'Nätverkande': 'networking',
  'Digital närvaro': 'digital-presence',
  'Arbetsrätt': 'employment-law',
  'Karriärutveckling': 'career-development',
  'Välmående': 'wellness',
}

export const articleCategories = [
  {
    id: 'getting-started',
    name: '🚀 Komma igång',
    description: 'För dig som är ny i portalen eller i jobbsökningen',
    icon: 'Rocket',
    subcategories: [
      { id: 'first-week', name: 'Din första vecka' },
      { id: 'basics', name: 'Grunderna i jobbsökning' },
    ]
  },
  {
    id: 'self-awareness',
    name: '🔍 Självkännedom',
    description: 'Förstå dina styrkor, intressen och personlighet för att hitta rätt yrke',
    icon: 'UserCircle',
    subcategories: [
      { id: 'strengths', name: 'Dina styrkor' },
      { id: 'personality', name: 'Personlighetstyper' },
      { id: 'interests', name: 'Intressen & värderingar' },
      { id: 'competencies', name: 'Kompetensinventering' },
    ]
  },
  {
    id: 'job-search',
    name: '🔎 Jobbsökning',
    description: 'Strategier och tekniker för att hitta och söka jobb effektivt',
    icon: 'Search',
    subcategories: [
      { id: 'cv-writing', name: 'CV-skrivning' },
      { id: 'cover-letter', name: 'Personligt brev' },
      { id: 'ats', name: 'ATS & digitala system' },
      { id: 'application-strategy', name: 'Ansökningsstrategi' },
      { id: 'interview-prep', name: 'Intervjuförberedelser' },
    ]
  },
  {
    id: 'interview',
    name: '🎯 Intervju & Anställning',
    description: 'Förberedelser, intervjuteknik och anställningsprocessen',
    icon: 'Target',
    subcategories: [
      { id: 'preparation', name: 'Förberedelser' },
      { id: 'during-interview', name: 'Under intervjun' },
      { id: 'after-interview', name: 'Efter intervjun' },
      { id: 'salary', name: 'Löneförhandling' },
    ]
  },
  {
    id: 'networking',
    name: '🤝 Nätverkande',
    description: 'Bygg och underhåll ett professionellt nätverk som öppnar dörrar',
    icon: 'Network',
    subcategories: [
      { id: 'building-network', name: 'Bygga nätverk' },
      { id: 'maintaining-contacts', name: 'Underhålla kontakter' },
      { id: 'informational-interviews', name: 'Informationsmöten' },
    ]
  },
  {
    id: 'digital-presence',
    name: '💻 Digital närvaro',
    description: 'Optimera din online-profil och synlighet för rekryterare',
    icon: 'Monitor',
    subcategories: [
      { id: 'linkedin', name: 'LinkedIn' },
      { id: 'personal-brand', name: 'Personligt varumärke' },
      { id: 'social-media', name: 'Sociala medier' },
    ]
  },
  {
    id: 'employment-law',
    name: '⚖️ Arbetsrätt & Anställning',
    description: 'Dina rättigheter, skyldigheter och vad du behöver veta om anställning',
    icon: 'Scale',
    subcategories: [
      { id: 'employment-types', name: 'Anställningsformer' },
      { id: 'rights', name: 'Dina rättigheter' },
      { id: 'salary-benefits', name: 'Lön & förmåner' },
    ]
  },
  {
    id: 'career-development',
    name: '📈 Karriärutveckling',
    description: 'Planera och utveckla din karriär på lång sikt',
    icon: 'TrendingUp',
    subcategories: [
      { id: 'career-planning', name: 'Karriärplanering' },
      { id: 'skills-development', name: 'Kompetensutveckling' },
      { id: 'career-change', name: 'Karriärväxling' },
      { id: 'new-job', name: 'Nytt jobb' },
    ]
  },
  {
    id: 'wellness',
    name: '🧠 Välmående & Motivation',
    description: 'Stöd för mental hälsa och motivation i jobbsökningen',
    icon: 'Heart',
    subcategories: [
      { id: 'rejection', name: 'Hantera avslag' },
      { id: 'motivation', name: 'Motivation' },
      { id: 'stress', name: 'Stresshantering' },
      { id: 'mental-health', name: 'Mental hälsa' },
    ]
  },
  {
    id: 'accessibility',
    name: '♿ Tillgänglighet & Stöd',
    description: 'Rättigheter, stöd och anpassningar',
    icon: 'Accessibility',
    subcategories: [
      { id: 'rights', name: 'Dina rättigheter' },
      { id: 'adaptations', name: 'Anpassningar' },
      { id: 'support', name: 'Stödinsatser' },
    ]
  },
  {
    id: 'job-market',
    name: '💼 Arbetsmarknaden',
    description: 'Information om arbetsmarknaden och olika branscher',
    icon: 'Briefcase',
    subcategories: [
      { id: 'trends', name: 'Trender' },
      { id: 'industries', name: 'Branscher' },
      { id: 'work-environment', name: 'Arbetsmiljö' },
    ]
  },
  {
    id: 'tools',
    name: '📋 Praktiska Verktyg',
    description: 'Checklistor, mallar och praktiska guider',
    icon: 'Tool',
    subcategories: [
      { id: 'checklists', name: 'Checklistor' },
      { id: 'templates', name: 'Mallar' },
      { id: 'glossary', name: 'Ordlista' },
    ]
  },
  {
    id: 'easy-swedish',
    name: '📖 Lätt svenska',
    description: 'Artiklar skrivna på enkel och lättförståelig svenska',
    icon: 'Languages',
    subcategories: [
      { id: 'cv', name: 'CV' },
      { id: 'job-search', name: 'Jobbsökning' },
      { id: 'interview', name: 'Intervju' },
      { id: 'wellbeing', name: 'Välmående' },
    ]
  },
]

export const mockArticlesData: EnhancedArticle[] = [
  // === KOMMA IGÅNG ===
  {
    id: 'komma-igang-intro',
    title: 'Välkommen till din jobbsökarresa',
    summary: 'En introduktion till portalen och hur du kommer igång med jobbsökningen på bästa sätt.',
    content: `Att söka jobb kan kännas överväldigande, men du är inte ensam. Denna portal är skapad för att stötta dig genom hela processen – från ditt första CV till din första anställningsdag.

## Vad kan du göra här?

**Skapa ett professionellt CV**
Använd vår CV-generator för att bygga ett CV som sticker ut. Du får hjälp med allt från formuleringar till layout.

**Gör intresseguiden**
Osäker på vilket yrke som passar dig? Vår intresseguide hjälper dig att hitta rätt baserat på dina intressen och förutsättningar.

**Sök och spara jobb**
Sök bland tusentals jobb och spara de som intresserar dig. Du kan även följa dina ansökningar i vår jobbtracker.

**Få stöd och vägledning**
I kunskapsbanken hittar du artiklar om allt från CV-skrivning till att hantera avslag. Och kom ihåg – din arbetskonsulent finns alltid där för dig.

## Din första vecka – steg för steg

### Dag 1-2: Kom igång med portalen
- Skapa ditt konto (om du inte redan gjort det)
- Fyll i din profil
- Gör intresseguiden för att hitta yrkesriktning
- Utforska kunskapsbanken

### Dag 3-4: Bygg ditt CV
- Samla information om din utbildning och erfarenhet
- Använd CV-generatorn
- Be om feedback från din konsulent
- Gör nödvändiga justeringar

### Dag 5-7: Börja söka jobb
- Sök efter relevanta jobb
- Spara intressanta annonser
- Skriv ditt första personliga brev
- Skicka din första ansökan!

## Kom ihåg

Jobbsökning är en process. Det är okej att ta det i din egen takt. Vissa dagar orkar du mer än andra – och det är helt normalt. Det viktigaste är att du tar ett steg i taget.

> "Varje ansökan är ett steg närmare ditt nya jobb. Även avslag är framsteg – du lär dig och blir bättre för varje gång."

Behöver du hjälp? Tveka inte att kontakta din arbetskonsulent. Vi finns här för dig!`,
    category: 'getting-started',
    subcategory: 'first-week',
    tags: ['introduktion', 'komma igång', 'steg-för-steg', 'för-nybörjare'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
    readingTime: 5,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['cv-grunder', 'intresseguide-intro', 'hantera-avslag'],
    relatedTools: ['/cv-builder', '/interest-guide'],
    checklist: [
      { id: '1', text: 'Skapa konto i portalen' },
      { id: '2', text: 'Fyll i din profil' },
      { id: '3', text: 'Gör intresseguiden' },
      { id: '4', text: 'Bygg ditt första CV' },
      { id: '5', text: 'Sök ditt första jobb' },
    ],
    actions: [
      { label: '🎯 Gör intresseguiden', href: '/interest-guide', type: 'primary' },
      { label: '📝 Skapa CV', href: '/cv-builder', type: 'secondary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'forsta-veckan-checklista',
    title: 'Din första vecka – Checklista',
    summary: 'En praktisk checklista för att komma igång under din första vecka i portalen.',
    content: `Att komma igång med jobbsökning kan kännas som mycket. Denna checklista hjälper dig att ta det steg för steg.

## Dag 1: Utforska och skapa konto

- Logga in på portalen
- Fyll i din profil med grundinformation
- Ladda upp en profilbild (valfritt men rekommenderat)
- Ställ in dina preferenser (notiser, tema, etc.)

## Dag 2: Upptäck möjligheter

- Gör intresseguiden för att hitta yrkesriktning
- Läs artikeln "Välkommen till din jobbsökarresa"
- Utforska kunskapsbanken och bokmärk intressanta artiklar
- Titta på vilka jobb som finns tillgängliga

## Dag 3-4: Bygg ditt CV

- Samla information: utbildning, jobb, kompetenser
- Öppna CV-generatorn
- Välj en mall som passar dig
- Fyll i alla avsnitt
- Spara och förhandsgranska

## Dag 5: Få feedback

- Dela ditt CV med din arbetskonsulent
- Boka ett möte för att gå igenom det tillsammans
- Gör justeringar baserat på feedback

## Dag 6-7: Dags att söka!

- Sök efter jobb som matchar din profil
- Spara minst 3 intressanta annonser
- Skriv ett personligt brev till ett av jobben
- Skicka in din första ansökan
- Fira! 🎉 Du har tagit ett stort steg!

## Tips för att lyckas

**Ta pauser när du behöver**
Det är okej att dela upp arbetet över flera dagar. Din hjärna behöver vila för att prestera som bäst.

**Be om hjälp**
Din arbetskonsulent finns där för dig. Ingen fråga är för liten!

**Var snäll mot dig själv**
Jobbsökning är en inlärningsprocess. Det är normalt att det känns nytt i början.

**Fira små framsteg**
Avslutade du ett avsnitt i CV:t? Sökte du ett jobb? Det är värt att firas!`,
    category: 'getting-started',
    subcategory: 'first-week',
    tags: ['checklista', 'komma igång', 'steg-för-steg', 'praktiskt'],
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-02-18T10:00:00Z',
    readingTime: 6,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['komma-igang-intro', 'cv-grunder'],
    relatedTools: ['/cv-builder'],
  },

  // === CV & ANSÖKAN ===
  {
    id: 'cv-grunder',
    title: 'Så skriver du ett CV som får resultat',
    summary: 'Lär dig grunderna i CV-skrivning och hur du gör ditt CV synligt för både rekryterare och digitala system.',
    content: `Ditt CV är ditt första intryck hos en arbetsgivare. Här lär du dig hur du skapar ett CV som både människor och datorsystem uppskattar.

## Vad är ett CV?

CV står för Curriculum Vitae, vilket betyder "levnadsteckning" på latin. Det är en sammanfattning av din utbildning, arbetslivserfarenhet, kompetenser och andra meriter.

Ett starkt CV gör tre saker:
1. **Fångar uppmärksamhet** – Rekryterare spenderar i snitt 6-7 sekunder på ett första ögonkast
2. **Visar relevans** – Det kopplar dina erfarenheter till jobbets krav
3. **Passerar digitala filter** – Många CV:n sorteras bort av datorsystem innan en människa ser dem

## Grundstruktur

Ett bra CV innehåller följande avsnitt:

### 1. Kontaktinformation
- Namn (stort och tydligt)
- Telefonnummer (med landskod om du söker internationellt)
- E-postadress (professionell, undvik "partykungen84@...")
- Ort (stad räcker, fullständig adress behövs inte)
- LinkedIn-profil (rekommenderas starkt)
- Portfolio/hemsida (om relevant för din bransch)

### 2. Sammanfattning/Profil
En kort text (3-5 meningar) som sammanfattar vem du är, vad du kan och vad du söker.

**Dåligt exempel:**
"Jag är en driven och engagerad person som söker nya utmaningar."

**Bra exempel:**
"Erfaren kundtjänstmedarbetare med 3 års erfarenhet av B2B-support. Specialiserad på CRM-system och har bidragit till 15% förbättrad kundnöjdhet. Söker en roll där jag kan kombinera min tekniska förståelse med kundkontakt."

### 3. Arbetslivserfarenhet
Lista dina tidigare anställningar i omvänd kronologisk ordning (senaste först).

**För varje tjänst, inkludera:**
- Jobbtitel
- Företagsnamn och ort
- Anställningsperiod (månad/år - månad/år)
- 3-5 punkter med dina prestationer och ansvar

**Dåligt exempel:**
"Ansvarade för kundservice och svarade på telefon."

**Bra exempel:**
"Hanterade 50+ kundärenden dagligen med 95% kundnöjdhet. Implementerade nytt ärendehanteringssystem som minskade svarstiden med 30%."

### 4. Utbildning
Lista din utbildning, också i omvänd kronologisk ordning.

Inkludera:
- Examen/utbildningsnamn
- Skola/universitet
- År (slutår eller pågående)
- Relevanta kurser, projekt eller examensarbete (om relevant)

### 5. Kompetenser och färdigheter
Gruppera dina kompetenser i kategorier:

**Tekniska kompetenser:**
- Programvaror (Excel, SAP, Photoshop)
- System (CRM, ERP)
- Programmering (om relevant)

**Språk:**
- Svenska (modersmål)
- Engelska (flytande)
- Andra språk (ange nivå)

**Mjuka färdigheter:**
- Ledarskap
- Projektledning
- Kommunikation

### 6. Övrigt (valfritt)
- Certifikat och tillstånd (körkort, truckkort, certifieringar)
- Förtroendeuppdrag (facklig representant, styrelsearbete)
- Hobbyer (bara om de är relevanta eller visar positiva egenskaper)
- Referenser (skriv "Lämnas på begäran" eller inkludera 2-3 kontakter)

## Så kvantifierar du dina prestationer

Det som skiljer ett bra CV från ett utmärkt är **mätbara resultat**. Rekryterare älskar siffror!

### Formeln: Handling + Resultat + Mätning

**Istället för:**
- "Ansvarade för försäljning"
- "Arbetade med kundservice"
- "Ledde projekt"

**Skriv:**
- "Ökade försäljningen med 25% under Q3 2024 genom uppsökande kundarbete"
- "Hanterade 200+ kundsamtal per vecka med 4.8/5 i kundnöjdhet"
- "Ledde team om 8 personer och levererade projekt 2 veckor före deadline"

### Frågor för att hitta dina siffror:
- Hur många kunder/ärenden hanterade du?
- Hur mycket pengar sparade/genererade du?
- Hur stor var din förbättring i procent?
- Hur många i teamet ledde du?
- Hur mycket tid sparade din lösning?

## Branschspecifika CV-tips

### Vård och omsorg
- Lyft fram certifieringar (undersköterska, vårdbiträde)
- Nämn specifika patientgrupper du arbetat med
- Inkludera delegering och ansvarsområden
- Visa empati och människokännedom

### Lager och logistik
- Lista körkort och truckkort
- Nämn system (WMS, SAP)
- Kvantifiera volymer (X pallar per dag)
- Lyft fram säkerhetsmedvetenhet

### IT och teknik
- Skapa en teknisk sektion med verktyg och programmeringsspråk
- Länka till GitHub eller portfolio
- Beskriv projekt med teknisk detalj
- Nämn certifieringar (AWS, Azure, etc.)

### Ekonomi och administration
- Lyft fram Excel-färdigheter specifikt
- Nämn system (Visma, Fortnox, SAP)
- Kvantifiera budgetar du hanterat
- Visa analytisk förmåga

### Butik och service
- Fokusera på kundnöjdhet och försäljningsresultat
- Nämn kassasystem du använt
- Visa att du kan arbeta i team
- Lyft fram flexibilitet och stresstålighet

### Bygg och hantverk
- Lista certifieringar och behörigheter
- Nämn verktyg och maskiner du behärskar
- Beskriv projekttyper och storlekar
- Visa säkerhetsmedvetenhet

## ATS – så kommer du igenom filtren

Många företag använder ATS (Applicant Tracking Systems) – datorsystem som sorterar CV:n automatiskt. Upp till 75% av alla CV:n sorteras bort av ATS innan en människa ser dem!

### Hur ATS fungerar:
1. Systemet skannar ditt CV efter nyckelord
2. Det jämför med jobbannonsens krav
3. Det rankar kandidater efter matchning
4. Bara de högst rankade går vidare till rekryteraren

### ATS-optimering steg för steg:

**Steg 1: Analysera jobbannonsen**
Markera alla substantiv, färdigheter och krav i annonsen. Dessa är dina nyckelord.

**Steg 2: Inkludera nyckelorden naturligt**
Stoppa inte in nyckelord slumpmässigt – de måste passa i meningar.

**Steg 3: Använd exakta formuleringar**
Om annonsen säger "Microsoft Excel" – skriv "Microsoft Excel", inte bara "Excel" eller "kalkylprogram".

**Steg 4: Standardisera rubriker**
ATS-system letar efter standardrubriker:
- Arbetslivserfarenhet (inte "Min resa")
- Utbildning (inte "Skolor jag gått på")
- Kompetenser (inte "Vad jag kan")

**Steg 5: Undvik komplex formatering**
- Inga tabeller eller kolumner
- Inga textrutor
- Inga bilder (förutom profilbild i separat fil)
- Inga sidhuvuden eller sidfötter för viktig info
- Enkla punktlistor

**Steg 6: Spara rätt**
- .docx är säkrast för ATS
- PDF fungerar oftast, men inte alltid
- Använd aldrig .pages eller andra format

### Testa ditt CV
Det finns gratisverktyg online som analyserar hur ATS-vänligt ditt CV är. Sök på "ATS CV checker" och testa innan du skickar!

## Vanliga misstag att undvika

❌ **För långt CV** – Ett CV bör vara 1-2 sidor. Över 2 sidor endast om du har 10+ års relevant erfarenhet.

❌ **Allmänna formuleringar** – "Ansvarstagande och driven" säger ingenting. Var specifik med exempel.

❌ **Stavfel och slarv** – Låt minst två personer korrekturläsa. Använd stavningskontroll. Läs högt för dig själv.

❌ **Ett CV för alla jobb** – Anpassa för varje ansökan. Ändra sammanfattningen och lyft fram relevant erfarenhet.

❌ **Inkonsekvent formatering** – Använd samma typsnitt, storlek och stil genomgående.

❌ **Luckor utan förklaring** – Om du har luckor i CV:t, var beredd att förklara dem positivt.

❌ **Personlig information som inte behövs** – Ålder, civilstånd, personnummer och religion behövs inte.

❌ **Oprofessionell e-postadress** – Skapa en ny om din nuvarande är olämplig.

## Checklista innan du skickar

Innan du skickar ditt CV, gå igenom denna checklista:

- Är kontaktinformationen korrekt och komplett?
- Är sammanfattningen anpassad för detta jobb?
- Innehåller CV:t nyckelord från jobbannonsen?
- Är alla prestationer kvantifierade där det är möjligt?
- Är formateringen konsekvent och enkel?
- Har någon annan korrekturläst?
- Är filnamnet professionellt? (Ex: "Anna_Svensson_CV.pdf")
- Är filen i rätt format (.docx eller .pdf)?

## Nästa steg

När du har ett grund-CV är det dags att:
1. Anpassa det för specifika jobb
2. Skriva ett personligt brev
3. Förbereda dig för intervjun

Kom ihåg: Ett CV är aldrig "färdigt". Det är ett levande dokument som utvecklas med dig! Uppdatera det regelbundet och anpassa det för varje ny ansökan.

> **Tips:** Spara en "master-version" av ditt CV med all din erfarenhet. När du söker ett specifikt jobb, kopiera master-versionen och anpassa den för just det jobbet.`,
    category: 'job-search',
    subcategory: 'cv-writing',
    tags: ['CV', 'skriva CV', 'ATS', 'grunder', 'detaljerad'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    readingTime: 20,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['personligt-brev', 'cv-utan-erfarenhet', 'ats-optimering'],
    relatedTools: ['/cv-builder'],
    checklist: [
      { id: '1', text: 'Samla all information (utbildning, jobb, kompetenser)' },
      { id: '2', text: 'Välj en ren och tydlig mall' },
      { id: '3', text: 'Skriv en stark sammanfattning' },
      { id: '4', text: 'Lista erfarenhet med mätbara resultat' },
      { id: '5', text: 'Gruppera kompetenser i kategorier' },
      { id: '6', text: 'Kontrollera stavning och grammatik' },
      { id: '7', text: 'Be någon läsa igenom' },
    ],
    actions: [
      { label: '📝 Öppna CV-generatorn', href: '/cv-builder', type: 'primary' },
      { label: '📄 Ladda ner CV-mall (Word)', href: '#', type: 'secondary' },
    ],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'personligt-brev',
    title: 'Personligt brev – din chans att sticka ut',
    summary: 'Lär dig skriva ett personligt brev som väcker intresse och visar varför just du är rätt för jobbet.',
    content: `Det personliga brevet är din chans att berätta vem du är bakom fakta i CV:t. Här visar du din motivation och förklarar varför just du passar för tjänsten.

## Varför är det personliga brevet viktigt?

Medan CV:t listar dina meriter, förklarar det personliga brevet:
- **Varför** du vill ha just detta jobb
- **Hur** dina erfarenheter gör dig till rätt kandidat
- **Vem** du är som person och kollega

Ett bra personligt brev kan kompensera för ett mindre imponerande CV, och vice versa kan ett dåligt brev förstöra chanserna för en annars stark kandidat.

## Struktur på det personliga brevet

### 1. Rubrik och hälsning
- Om du vet vem som rekryterar: "Hej Maria!" eller "Till: Maria Svensson"
- Om du inte vet: "Hej!" eller "Till ansvarig rekryterare"
- Undvik "Till den det berör" – det är för formellt

### 2. Inledning – väck intresse (2-3 meningar)
De första meningarna avgör om rekryteraren läser vidare. Hoppa över "Jag söker tjänsten som..." – det vet de redan!

**Dålig inledning:**
"Jag skriver för att söka tjänsten som säljare som ni annonserat på Arbetsförmedlingen."

**Bra inledningar:**

*Koppling till företaget:*
"När jag läste om er satsning på hållbara produkter i Dagens Industri förra veckan insåg jag att detta är ett företag där mina värderingar och erfarenheter verkligen kan göra skillnad."

*Personlig berättelse:*
"Min första kontakt med programmering var när jag som 12-åring hackade min systers dataspel för att få fler liv. Sedan dess har jag aldrig slutat lösa tekniska problem."

*Resultatfokuserad:*
"Under mina två år som kundtjänstmedarbetare ökade jag kundnöjdheten med 23% – och jag ser fram emot att göra samma sak för er."

*Nätverkskoppling:*
"Min tidigare kollega Sara Eriksson berättade om ert fantastiska team och den spännande tillväxtresa ni är på, vilket gjorde mig nyfiken på att veta mer."

### 3. Varför detta jobb? (3-4 meningar)
Visa att du har gjort din hemläxa om företaget:

- Vad lockar dig med just detta företag?
- Hur passar denna roll in i din karriärplan?
- Vad specifikt i annonsen väckte ditt intresse?

**Exempel:**
"Er ambition att bli Nordens ledande inom digital marknadsföring matchar perfekt med min egen drivkraft att ligga i framkant. Rollen som Content Manager är särskilt intressant eftersom den kombinerar strategiskt tänkande med kreativt skapande – precis den kombinationen jag trivs bäst med."

### 4. Varför du? (5-8 meningar)
Detta är brevets hjärta. Koppla 2-3 av dina starkaste erfarenheter till jobbets viktigaste krav.

**Strukturera varje argument:**
1. Krav från annonsen
2. Din relevanta erfarenhet
3. Konkret resultat

**Exempel:**
"Ni söker någon med erfarenhet av projektledning i snabbföränderliga miljöer. I min nuvarande roll hos TechStart AB har jag lett fem produktlanseringar på 18 månader, samtliga levererade i tid och inom budget. Den senaste lanseringen genererade 2 miljoner kronor i intäkter första kvartalet."

"Er önskan om stark kommunikationsförmåga stämmer väl med mina styrkor. Som talesperson för vår avdelning har jag hållit presentationer för allt från styrelser till externa kunder, och fått genomgående positiv feedback på min förmåga att förklara komplexa frågor enkelt."

### 5. Avslutning (2-3 meningar)
Sammanfatta kort och visa entusiasm. Inkludera en "call to action":

**Exempel:**
"Jag är övertygad om att min kombination av teknisk kompetens och kundförståelse skulle vara värdefull för ert team. Jag ser fram emot att berätta mer om hur jag kan bidra till er fortsatta framgång vid en intervju."

### 6. Hälsning
- "Med vänliga hälsningar" (säkert och professionellt)
- "Vänliga hälsningar" (lite mindre formellt)
- "Hör gärna av dig!" (casual, passar startups)

## Mallexempel: Komplett personligt brev

### Mall 1: Klassisk struktur (för de flesta jobb)

---

**Hej Sofia!**

När jag såg er annons för Kundservicemedarbetare tänkte jag direkt att detta kunde vara något för mig. Jag har följt ert företag sedan ni lanserade er app förra året och har imponerats av hur ni kombinerar teknik med en riktigt personlig kundupplevelse.

Det som lockar mig mest med rollen är möjligheten att arbeta i korsningen mellan teknik och mänsklig kontakt. Som naturlig problemlösare och teknikentusiast ser jag fram emot att hjälpa era kunder få ut det mesta av er produkt.

I min nuvarande roll på Servicebolaget AB hanterar jag dagligen cirka 40 kundärenden via telefon och chatt. Jag har konsekvent fått kundnöjdhetsscore på över 4,8 av 5, och har blivit utsedd till "Månadens medarbetare" tre gånger det senaste året. Min tekniska nyfikenhet gör att jag ofta hjälper kollegor med mer komplexa IT-frågor, något jag verkligen uppskattar.

Jag söker nu nya utmaningar i ett företag där jag kan växa och utvecklas. Er snabba tillväxt och fokus på innovation passar perfekt med min ambition, och jag tror att min kombination av kundserviceerfarenhet och teknikintresse skulle vara värdefull för ert team.

Jag ser fram emot att berätta mer om hur jag kan bidra till ert team vid en intervju.

Med vänliga hälsningar,
Anna Karlsson

---

### Mall 2: För karriärbytare

---

**Till rekryterande chef,**

Efter tio år inom restaurangbranschen tar jag nu steget mot en ny karriär inom administration – och er tjänst som Receptionist har fångat mitt intresse.

Ni kanske undrar hur en kock passar som receptionist? Restaurangbranschen har lärt mig att leverera under press, hantera många uppgifter samtidigt och alltid sätta gästens upplevelse först. Dessa färdigheter översätts direkt till receptionsrollen: att ta emot besökare med ett leende, jonglera telefonsamtal och bokningar, och skapa en positiv första kontakt.

Under mina år som kock har jag:
- Hanterat leverantörskontakter och beställningar värda miljoner kronor årligen
- Lett team om 8 personer under högtrycksperioder
- Lärt mig att alltid behålla lugnet och professionalismen, oavsett situation

Jag har nyligen genomgått utbildning i Office-paketet och administration genom Arbetsförmedlingen, där jag fick betyget VG. Min starka arbetsmoral och positiva inställning har jag med mig från min tidigare karriär.

Jag är medveten om att jag inte har traditionell administrativ erfarenhet, men jag kompenserar med arbetsglädje, anpassningsförmåga och en genuin vilja att lära. Jag ser fram emot möjligheten att visa vad jag kan bidra med.

Vänliga hälsningar,
Erik Johansson

---

### Mall 3: Första jobbet/utan erfarenhet

---

**Hej!**

Att just har jag avslutat gymnasiet och är redo att kickstarta min karriär – och er trainee-tjänst inom marknadsföring ser ut som den perfekta starten.

Även om jag inte har formell arbetslivserfarenhet har jag flera relevanta meriter. Som ansvarig för min skolas Instagram under två år växte följarskaran från 200 till 2000, och engagemanget tredubblades. Jag lärde mig allt från innehållsplanering till bildbehandling och copywriting – helt på egen hand.

Parallellt med skolan har jag:
- Drivit egen blogg om sneakers med 500 unika besökare per månad
- Arbetat extra i butik där jag utvecklade min kundkommunikation
- Tagit onlinekurser i Google Analytics och Facebook Ads

Det som driver mig är kombinationen av kreativitet och data. Jag älskar att skapa innehåll, men lika mycket att analysera vad som faktiskt fungerar. Er betoning på "data-driven marknadsföring" i annonsen passar perfekt med mitt sätt att tänka.

Jag är hungrig, läraktig och redo att ge allt. Får jag chansen lovar jag att överträffa era förväntningar.

Hör gärna av dig!
Lisa Andersson

---

## Viktiga principer

✅ **Var personlig men professionell**
Skriv som du pratar – fast lite mer polerat. Låt din personlighet skina igenom.

✅ **Var specifik – ge exempel**
"Jag är driven" säger ingenting. "Jag tog initiativ till att starta en mentorskapsprogram som nu hjälper 30 nyanställda per år" säger allt.

✅ **Håll det kort (max 1 A4)**
300-400 ord är idealt. Rekryterare har inte tid för romaner.

✅ **Anpassa för varje jobb**
Minst 50% av brevet ska vara unikt för varje ansökan. Generiska brev syns på en kilometer.

✅ **Börja starkt**
De första 2-3 meningarna avgör om resten blir läst.

✅ **Visa, berätta inte**
Istället för "jag är en bra problemlösare" – berätta om ett problem du löste.

## Undvik dessa misstag

❌ **Att upprepa CV:t ord för ord**
Brevet ska komplettera CV:t, inte duplicera det. Fördjupa istället de viktigaste punkterna.

❌ **Negativa formuleringar om tidigare arbetsgivare**
"Min förra chef var inkompetent" – Detta är alltid fel, oavsett hur sant det är.

❌ **För formellt eller för casual språk**
"Undertecknad anhåller härmed..." är lika fel som "Tjena! Sjukt nice jobb!".

❌ **Stavfel och slarv**
Ett enda stavfel kan sabotera hela din ansökan. Korrekturläs flera gånger.

❌ **Att ljuga eller överdriva**
Allt du skriver kan komma upp på intervjun. Var ärlig.

❌ **Att fokusera på vad DU vill**
"Jag vill ha detta jobb för att utvecklas" – fokusera istället på vad du kan ge företaget.

❌ **Att skicka samma brev till alla**
Rekryterare märker direkt när brevet är generiskt.

## Användning av AI-assistent

Om du har svårt att komma igång kan du använda vår AI-assistent för personliga brev. Den hjälper dig att få en struktur att utgå ifrån.

### Så använder du AI på rätt sätt:
1. **Använd AI för att brainstorma** – låt den föreslå inledningar och struktur
2. **Skriv om med din egen röst** – AI:n ger en grund, du gör den personlig
3. **Fyll i med dina egna exempel** – AI:n kan inte veta dina specifika erfarenheter
4. **Korrekturläs kritiskt** – AI kan missa nyanser och skriva fel
5. **Anpassa för företaget** – Se till att brevet verkligen handlar om DETTA jobb

Kom ihåg: AI:n är ett verktyg, inte en ersättning för din egen röst! Rekryterare kan ofta känna igen AI-genererade texter, så se till att brevet verkligen låter som dig.

## Checklista innan du skickar

- Har jag nämnt företaget vid namn?
- Har jag kopplat mina erfarenheter till jobbets krav?
- Har jag konkreta exempel med resultat?
- Är brevet under en A4-sida?
- Har någon annan korrekturläst?
- Är tonen rätt för företaget och branschen?
- Har jag undvikit att upprepa CV:t?
- Slutar brevet med en tydlig "call to action"?`,
    category: 'job-search',
    subcategory: 'cover-letter',
    tags: ['personligt brev', 'ansökan', 'skriva', 'exempel'],
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-02-18T10:00:00Z',
    readingTime: 16,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'intervju-forberedelser'],
    relatedTools: ['/cover-letter'],
    relatedExercises: ['application', 'coverletter'],
  },

  {
    id: 'cv-utan-erfarenhet',
    title: 'Skriva CV utan formell erfarenhet',
    summary: 'Har du ingen arbetslivserfarenhet? Inga problem! Så här skapar du ett starkt CV ändå.',
    content: `Det är en myt att man behöver åratal av arbetslivserfarenhet för att få jobb. Många arbetsgivare värdesätter andra kvaliteter som entusiasm, vilja att lära och personlig lämplighet.

## Fokusera på det du HAR gjort

### Utbildning
- Gymnasieutbildning
- Kurser och certifieringar
- Online-utbildningar

### Praktik och prao
Även korta praktikperioder är värdefulla!

### Ideellt arbete och engagemang
- Föreningsliv
- Volontärarbete
- Förtroendeuppdrag

### Egna projekt
Har du en blogg? YouTube-kanal? Tagit hand om syskon?

## Lyft fram dina mjuka färdigheter

- Pålitlig och ansvarsfull
- Positiv och engagerad
- Läraktig och nyfiken
- Teamspelare
- Problemlösare

## Använd funktionella CV:n

Ett funktionellt CV fokuserar på kompetenser snarare än kronologisk erfarenhet.

**Struktur:**
1. Kontaktinformation
2. Profil/Sammanfattning
3. Kompetenser (grupperade efter område)
4. Utbildning
5. Övriga meriter

## Kom ihåg

Arbetsgivare anställer människor, inte bara CV:n. Visa att du är:
- Motiverad och villig att lära
- Pålitlig och engagerad
- En bra lagspelare

Din brist på erfarenhet kan vara en styrka – du har inga "dåliga vanor" att glömma bort!`,
    category: 'job-search',
    subcategory: 'cv-writing',
    tags: ['CV', 'utan erfarenhet', 'första jobbet', 'nybörjare'],
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-02-16T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'personligt-brev'],
    relatedTools: ['/cv-builder'],
    relatedExercises: ['cv-masterclass'],
  },

  // === INTERVJU ===
  {
    id: 'intervju-forberedelser',
    title: 'Förbered dig inför intervjun – den ultimata guiden',
    summary: 'Allt du behöver veta för att gå in i intervjun med självförtroende och göra ett starkt intryck.',
    content: `Intervjun är din chans att visa vem du är bakom pappren. Med rätt förberedelser kan du gå in med självförtroende och öka dina chanser avsevärt.

## Steg 1: Lär känna företaget

### Vad ska du veta?
- **Verksamhet:** Vad gör företaget? Vilka produkter/tjänster erbjuder de?
- **Kunder:** Vilka är deras målgrupp? B2B eller B2C?
- **Värderingar:** Vad står de för? Hållbarhet? Innovation? Kundservice?
- **Kultur:** Formell eller avslappnad? Stor eller liten organisation?
- **Aktuellt:** Vad händer just nu? Expansion? Ny produkt? Utmaningar?
- **Konkurrenter:** Vilka är deras konkurrenter? Vad skiljer dem åt?

### Var hittar du information?
- **Hemsidan:** Läs Om oss, Vision, Värderingar, Nyheter
- **LinkedIn:** Företagssidan och anställdas profiler
- **Nyhetsartiklar:** Googla "företagsnamn" + nyheter
- **Glassdoor/Kununu:** Medarbetarrecensioner (ta med nypa salt)
- **Sociala medier:** Hur kommunicerar de? Vilken ton?
- **Årsredovisning:** För större bolag, visar finansiell hälsa och strategi

### Skriv ner 5 saker du vill nämna
Förbered minst 5 specifika saker om företaget som du kan väva in i dina svar:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

## Steg 2: Analysera jobbannonsen grundligt

Gå igenom annonsen och identifiera:

### Måste-krav (deal-breakers)
Markera alla krav med ord som "kräver", "ska ha", "nödvändigt":
- Krav 1: _________________________________
- Krav 2: _________________________________
- Krav 3: _________________________________

### Meriterande (nice-to-have)
Markera krav med ord som "meriterande", "önskvärt", "en fördel":
- Merit 1: _________________________________
- Merit 2: _________________________________

### Arbetsuppgifter
Lista de viktigaste uppgifterna och fundera på hur du kan visa att du klarar dem:
- Uppgift 1: _________________________________
- Uppgift 2: _________________________________
- Uppgift 3: _________________________________

### Mjuka färdigheter
Vilka personliga egenskaper söker de? (lagspelare, självständig, kommunikativ, etc.)
- _________________________________

## Steg 3: STAR-metoden – nyckeln till bra svar

STAR är en teknik för att strukturera svar på beteendefrågor. Den hjälper dig att ge konkreta, trovärdiga svar istället för vaga generaliseringar.

### Vad står STAR för?

**S – Situation (Situation)**
Beskriv kontexten. Var befann du dig? Vad var bakgrunden?
"I min tidigare roll som teamledare på XYZ AB hade vi en situation där..."

**T – Task (Uppgift)**
Vad var ditt ansvar eller mål i situationen?
"Min uppgift var att..."

**A – Action (Handling)**
Vad gjorde DU specifikt? (Använd "jag", inte "vi")
"Jag började med att... Sedan..."

**R – Result (Resultat)**
Vad blev utfallet? Kvantifiera om möjligt!
"Resultatet blev att... Vi ökade med 25%..."

### STAR-exempel 1: "Berätta om en gång du hanterade en svår kund"

**Situation:** "I mitt jobb på Kundtjänst AB hade vi en kund som var extremt upprörd över en felaktig faktura på 50 000 kr."

**Task:** "Som senior kundtjänstmedarbetare var det mitt ansvar att lösa ärendet och försöka behålla kunden."

**Action:** "Jag lyssnade först aktivt på kundens frustration utan att avbryta. Sedan bad jag om ursäkt för besväret och förklarade att jag skulle undersöka ärendet personligen. Jag kontaktade ekonomiavdelningen, identifierade felet i vårt faktureringssystem, och ringde tillbaka till kunden inom två timmar med en lösning."

**Result:** "Kunden fick en korrigerad faktura samma dag plus 10% rabatt på nästa order som goodwill. Kunden blev så nöjd att de skrev ett positivt omdöme på Trustpilot och fortsatte som kund i två år till, värda cirka 200 000 kr i intäkter."

### STAR-exempel 2: "Berätta om en gång du tog initiativ"

**Situation:** "På mitt förra jobb märkte jag att vi spenderade mycket tid på manuell datainmatning varje vecka."

**Task:** "Det var inte mitt ansvarsområde, men jag ville hitta ett sätt att förbättra processen."

**Action:** "Jag lärde mig grunderna i Excel-makron på egen tid. Sedan skapade jag ett automatiserat kalkylark som hämtade data från vårt system och formaterade det korrekt. Jag presenterade lösningen för min chef och erbjöd mig att utbilda kollegorna."

**Result:** "Processen som tidigare tog 4 timmar i veckan tar nu 30 minuter. Min chef nominerade mig till 'Månadens förbättrare' och jag fick ansvaret för att driva fler effektiviseringsprojekt."

### Förbered dina egna STAR-berättelser

Skriv ner minst 5 STAR-berättelser som täcker olika kompetenser:

1. **Problemlösning:** När du löste ett svårt problem
2. **Samarbete:** När du arbetade bra i team
3. **Initiativ:** När du tog initiativ utöver ditt ansvar
4. **Konflikt:** När du hanterade en konflikt eller svår person
5. **Misslyckande:** När något gick fel och hur du lärde dig av det

## Steg 4: Vanliga intervjufrågor och hur du svarar

### "Berätta om dig själv"
**Vad de egentligen frågar:** "Ge mig en professionell översikt som gör mig intresserad."

**Struktur (2-3 minuter):**
1. Nuvarande roll (30 sek)
2. Bakgrund/utbildning (30 sek)
3. Viktigaste prestationen (30 sek)
4. Varför du är här idag (30 sek)

**Exempel:**
"Just nu arbetar jag som projektledare på TechStart där jag ansvarar för vår produktutveckling. Jag har en bakgrund inom systemvetenskap och började min karriär som utvecklare innan jag gick över till projektledning. Min stoltaste prestation är att ha lett lanseringen av vår app som nu har 50 000 användare. Jag söker nu nästa steg i min karriär, och er roll som Senior Projektledare matchar perfekt med mina ambitioner att arbeta med större, internationella projekt."

### "Varför söker du detta jobb?"
**Vad de egentligen frågar:** "Är du genuint intresserad, eller söker du vad som helst?"

**Tre saker att inkludera:**
1. Varför just detta företag
2. Varför just denna roll
3. Hur det passar in i din karriärplan

### "Vad är dina styrkor?"
**Vad de egentligen frågar:** "Kan du bidra till vårt team?"

**Regler:**
- Välj 2-3 styrkor som är relevanta för jobbet
- Backa upp med konkreta exempel
- Undvik klyschor utan substans

**Exempel:**
"Min största styrka är min förmåga att strukturera och prioritera. I mitt nuvarande jobb hanterar jag ofta 10-15 parallella projekt, och jag har aldrig missat en deadline. Jag gör det genom att börja varje vecka med att planera och prioritera baserat på affärspåverkan."

### "Vad är din svaghet?"
**Vad de egentligen frågar:** "Har du självinsikt och förmåga att utvecklas?"

**Regler:**
- Välj en genuin svaghet (inte "jag är för perfektionist")
- Välj något som inte är kritiskt för jobbet
- Visa hur du aktivt arbetar med det

**Exempel:**
"Jag kan ibland ha svårt att säga nej till nya uppgifter, vilket har lett till att jag tagit på mig för mycket. Jag har lärt mig att hantera detta genom att alltid fråga 'vad ska jag prioritera ner?' när någon ber om något nytt. Det har gjort stor skillnad."

### "Varför ska vi anställa just dig?"
**Vad de egentligen frågar:** "Sammanfatta ditt värde för oss."

**Strukturera svaret:**
1. Dina viktigaste relevanta erfarenheter
2. Vad som skiljer dig från andra
3. Din entusiasm för just denna möjlighet

### "Var ser du dig själv om 5 år?"
**Vad de egentligen frågar:** "Kommer du stanna eller hoppa vidare snabbt?"

**Balansera ambition med realism:**
"Om fem år ser jag mig ha vuxit inom företaget, kanske i en senior eller ledande roll. Jag vill fördjupa min expertis inom [område] och bidra till [företagets mål]. Det viktigaste för mig är att kontinuerligt utvecklas och ta mer ansvar."

### "Varför lämnade du ditt förra jobb?" / "Varför vill du byta?"
**Vad de egentligen frågar:** "Finns det problem vi borde veta om?"

**Regler:**
- Var positiv och framåtblickande
- Fokusera på vad du söker, inte vad du flyr från
- Prata ALDRIG illa om tidigare arbetsgivare

**Bra svar:**
"Jag har lärt mig otroligt mycket på mitt nuvarande jobb, men jag känner att jag är redo för nya utmaningar. Er roll erbjuder möjlighet att arbeta med [specifikt], vilket är precis den utveckling jag söker."

## Steg 5: Förbered dina frågor

Att ställa frågor visar engagemang. Förbered 5-7 frågor och välj 3-5 att ställa.

### Bra frågor att ställa:

**Om rollen:**
- "Hur ser en typisk dag ut i denna roll?"
- "Vad är de viktigaste målen för den här rollen de första 90 dagarna?"
- "Vilka är de största utmaningarna personen i denna roll kommer möta?"

**Om teamet:**
- "Hur ser teamet jag kommer arbeta med ut?"
- "Hur samarbetar avdelningarna med varandra?"
- "Hur ser feedbackkulturen ut?"

**Om företaget:**
- "Vilka är företagets största utmaningar just nu?"
- "Hur ser tillväxtplanerna ut de kommande åren?"
- "Vad är det bästa med att arbeta här?"

**Om utveckling:**
- "Vilka utvecklingsmöjligheter finns det inom företaget?"
- "Hur stöttar ni medarbetarnas kompetensutveckling?"

**Om processen:**
- "Hur ser de nästa stegen i processen ut?"
- "När kan jag förvänta mig att höra från er?"

### Frågor att UNDVIKA:
- "Vad gör företaget?" (du borde veta det)
- "Hur mycket semester har jag?" (för tidigt)
- "Kan jag jobba hemifrån?" (fråga senare, om det inte nämns i annonsen)
- "Hur snabbt kan jag bli befordrad?" (ger fel intryck)

## Steg 6: Praktiska förberedelser

### Vad ska du ta med?
- Extra kopior av CV:t (2-3 stycken)
- Anteckningsblock och penna
- Lista med dina frågor
- Portfolio/arbetsprover (om relevant)
- Legitimation (ibland krävs för att passera reception)
- Kontaktuppgifter till intervjuaren (ifall du blir försenad)

### Vad ska du ha på dig?
- **Konservativa branscher** (bank, juridik): Kostym eller motsvarande
- **Kreativa branscher** (reklam, media): Smart casual, visa personlighet
- **Tech/startup:** Snyggt men avslappnat
- **Regel:** Klä dig ett snäpp finare än du tror du behöver
- **Tips:** Testa kläderna dagen innan så du vet att de passar och är bekväma

### Logistik
- Ta reda på exakt adress och vilken ingång
- Planera resan så du är framme 10-15 minuter innan
- Ha en backup-plan vid förseningar
- Programmera in telefonnumret till kontaktpersonen

### Kvällen innan
- Läs igenom dina STAR-berättelser
- Lägg fram kläder
- Packa väskan
- Gå och lägg dig i tid
- Sätt extra alarm

## Under intervjun

### De första 90 sekunderna
Första intrycket sätts snabbt. Fokusera på:
- **Leende** – visa att du är positiv
- **Ögonkontakt** – visa självförtroende
- **Fast handslag** – inte för hårt, inte för slappt
- **Hållning** – rak rygg, öppet kroppsspråk

### Aktivt lyssnande
- Lyssna på hela frågan innan du svarar
- Det är okej att be om förtydligande
- Det är okej att ta några sekunder att tänka
- Nicka och visa att du lyssnar

### Kroppsspråk
✅ **Gör:**
- Luta dig lätt framåt (visar intresse)
- Ha öppna händer
- Le naturligt
- Matcha intervjuarens energi

❌ **Undvik:**
- Korsade armar (defensivt)
- Att pilla med något (nervöst)
- Att titta runt i rummet (ointresserat)
- Att avbryta

### Om du inte vet svaret
Det är okej att inte veta allt! Bättre alternativ än att gissa:
- "Det är en bra fråga. Låt mig fundera en sekund..."
- "Jag har inte stött på exakt den situationen, men jag skulle angripa det så här..."
- "Ärligt talat har jag inte erfarenhet av det, men jag lär mig snabbt och..."

## Efter intervjun

### Samma dag
1. **Skriv ner** vad som diskuterades medan det är färskt
2. **Reflektera:** Vad gick bra? Vad kunde varit bättre?
3. **Skicka tackmail** inom 24 timmar

### Tackmailet (exempel)
---
Ämne: Tack för intervjun – [Tjänstens namn]

Hej [Namn],

Stort tack för en trevlig intervju idag. Det var givande att få höra mer om rollen som [titel] och om [specifikt ämne ni diskuterade].

Vårt samtal bekräftade mitt intresse för tjänsten. Jag är särskilt entusiastisk över möjligheten att [specifik uppgift/projekt som nämndes] och tror att min erfarenhet av [relevant erfarenhet] skulle vara värdefull i teamet.

Jag ser fram emot att höra från er om nästa steg.

Med vänliga hälsningar,
[Ditt namn]
[Telefonnummer]
---

### Om du inte hör något
- Vänta tills deadline de nämnde har passerat
- Skicka en uppföljning 1 vecka efter intervjun
- Var professionell oavsett utfall
- Fortsätt söka andra jobb under tiden

## Kom ihåg

Intervjun är en dialog, inte ett förhör. Du intervjuar också dem – passar detta företag och denna roll för dig? Arbetsgivaren vill sälja in företaget till dig lika mycket som du vill sälja in dig själv.

> **Tips:** Nervositet är normalt och till och med positivt – det visar att du bryr dig. Ta några djupa andetag innan du går in, och kom ihåg att de har kallat dig för att de redan tror att du kan passa!`,
    category: 'interview',
    subcategory: 'preparation',
    tags: ['intervju', 'förberedelser', 'detaljerad', 'tips', 'STAR-metoden'],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
    readingTime: 28,
    difficulty: 'detailed',
    energyLevel: 'high',
    relatedArticles: ['digital-intervju', 'intervju-fragor', 'loneforhandling'],
    checklist: [
      { id: '1', text: 'Läs på om företaget grundligt' },
      { id: '2', text: 'Analysera jobbannonsen' },
      { id: '3', text: 'Öva på vanliga intervjufrågor' },
      { id: '4', text: 'Förbered egna frågor att ställa' },
      { id: '5', text: 'Planera klädsel' },
      { id: '6', text: 'Testa vägen/tekniken' },
      { id: '7', text: 'Packa väskan kvällen innan' },
      { id: '8', text: 'Skriv tack-mejl efteråt' },
    ],
    author: 'Sara Ekström',
    authorTitle: 'Rekryterare',
  },

  {
    id: 'intervju-fragor',
    title: 'Vanliga intervjufrågor och hur du svarar',
    summary: 'De vanligaste intervjufrågorna med förslag på svar och strategier.',
    content: `Att känna till vanliga intervjufrågor och ha förberett svar kan göra stor skillnad för ditt självförtroende.

## Om dig själv

### "Berätta kort om dig själv"
En kort version av ditt personliga brev. Professionell, inte privat.

### "Vad är dina styrkor?"
Välj 2-3 styrkor som är relevanta för jobbet. Ge konkreta exempel.

### "Vad är din svaghet?"
Välj något genuint men inte kritiskt för jobbet. Visa hur du jobbar med det.

## Om din bakgrund

### "Varför lämnade du ditt förra jobb?"
Var positiv och framåtblickande. Prata aldrig illa om tidigare arbetsgivare.

### "Berätta om en svår situation på jobbet"
Använd STAR-metoden: Situation, Task, Action, Result.

## Om jobbet

### "Varför söker du just detta jobb?"
Koppla dina mål och intressen till företagets verksamhet.

### "Varför ska vi anställa just dig?"
Din elevator pitch! Sammanfatta vad som gör dig unik.

## Om framtiden

### "Var ser du dig själv om 5 år?"
Visa ambition men var realistisk. Fokusera på utveckling inom företaget.

## Beteendefrågor

"Berätta om en gång när du..."
- hanterade en konflikt
- gjorde ett misstag
- visade initiativ

## Kom ihåg

- Öva högt! Säg svaren högt framför spegeln
- Var ärlig – lögnar avslöjas
- Det är okej att pausa och tänka
- Var dig själv`,
    category: 'interview',
    subcategory: 'preparation',
    tags: ['intervju', 'frågor', 'svar', 'övning'],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-02-19T10:00:00Z',
    readingTime: 22,
    difficulty: 'detailed',
    energyLevel: 'high',
    relatedArticles: ['intervju-forberedelser', 'digital-intervju'],
    relatedExercises: ['interview', 'intervju-traning'],
  },

  {
    id: 'digital-intervju',
    title: 'Digital intervju – så lyckas du på Zoom/Teams',
    summary: 'Allt om teknik, miljö och beteende för att lyckas i digitala intervjuer.',
    content: `Digitala intervjuer blir allt vanligare. Så här förbereder du dig för att göra ditt bästa intryck på distans.

## Komplett teknisk checklista

### Dagen innan intervjun

**Utrustning:**
- [ ] Ladda ner och installera rätt programvara (Zoom, Teams, Google Meet)
- [ ] Skapa ett konto om det behövs
- [ ] Testa att logga in med intervjulänken
- [ ] Kontrollera att kamera fungerar
- [ ] Testa mikrofon och högtalare
- [ ] Ha hörlurar redo som backup
- [ ] Ladda datorns batteri till 100%
- [ ] Ha laddare inkopplad under intervjun

**Internet:**
- [ ] Testa din internethastighet (minst 5 Mbps upp och ner för videomöte)
- [ ] Placera dig nära routern om möjligt
- [ ] Ha mobiltelefon med hotspot som backup
- [ ] Be andra i hushållet undvika tung internetanvändning under intervjun

**Backup-plan:**
- [ ] Spara intervjuarens telefonnummer
- [ ] Ha alternativ enhet redo (telefon eller surfplatta)
- [ ] Skriv ner möteslänken på papper

### Teknisk felsökning

| Problem | Snabblösning |
|---------|--------------|
| Kameran fungerar inte | Starta om programmet, kontrollera att ingen annan app använder kameran |
| Inget ljud | Kontrollera att rätt mikrofon/högtalare är vald i inställningar |
| Dålig bildkvalitet | Stäng andra program, använd kabelanslutning |
| Eko/återkoppling | Använd hörlurar istället för högtalare |
| Fördröjning/lagg | Stäng av video tillfälligt, starta om routern |

## Optimera din miljö

### Belysning – så gör du rätt

**Det bästa ljuset:**
- Sitt vänd mot ett fönster (naturligt ljus framför dig)
- Undvik bakgrundsljus (fönster bakom dig gör dig till siluett)
- Vid kvällsintervju: använd en skrivbordslampa riktad mot ditt ansikte

**Ljussättning steg för steg:**
1. Placera en lampa framför dig, strax ovanför ögonhöjd
2. Använd en vit vägg eller reflexskärm för att mjuka upp skuggorna
3. Undvik hård takbelysning som skapar skuggor under ögonen
4. Testa i förväg genom att ta ett foto eller starta ett videosamtal med en vän

**Pro-tips:** En ringlampa (köps för 200-500 kr) ger professionell belysning och är en bra investering.

### Bakgrund – första intrycket

**Bästa alternativen:**
1. **Neutral vägg** – vit, grå eller ljus färg utan mönster
2. **Bokhylla** – signalerar kunskap och seriositet (se till att den är ordnad)
3. **Växt** – en grön växt ger liv utan att distrahera
4. **Virtuell bakgrund** – endast om din dator klarar det utan att hacka

**Undvik:**
- Ostädade rum eller synlig disk
- Personliga föremål som kan vara kontroversiella
- Rörlig bakgrund (folk som går förbi)
- Spegel eller reflexer
- Sängen i bakgrunden

**Städa synfältet:**
1. Sitt vid din dator
2. Se vad som syns i kameran
3. Ta bort allt som distraherar eller ser ostädat ut
4. Dubbelkolla att inget pinsamt syns

### Ljud – att höras tydligt

**Minimera störningar:**
- Stäng fönster och dörrar
- Informera hushållsmedlemmar om intervjutiden
- Sätt husdjur i annat rum
- Stäng av TV, radio och andra ljudkällor
- Tyst mobiltelefon och dator-notiser

**Mikrofonplacering:**
- Inbyggd laptop-mikrofon: sitt ca 50 cm från skärmen
- Headset: placera mikrofonen 2-3 cm från munnen
- Extern mikrofon: peka den mot din mun, inte rakt upp

## Kameranärvaro – så syns du bra

### Positionering

**Kamerahöjd:**
- Kameran ska vara i ögonhöjd eller strax ovanför
- Använd böcker eller en laptopställ för att höja datorn
- Undvik att ha kameran underifrån (ger ofördelaktig vinkel)

**Avstånd:**
- Ca en armlängds avstånd från skärmen
- Ditt ansikte och axlar ska synas (inte bara ansiktet eller hela överkroppen)
- Lämna lite "headroom" – inte för nära kanten

**Ögonkontakt:**
- Titta IN i kameran när du pratar (inte på skärmen)
- Det känns konstigt men skapar ögonkontakt för mottagaren
- Placera anteckningar nära kameran för att minska avvikande blick
- Träna genom att spela in dig själv

### Kroppsspråk på video

**Det som syns mer på video:**
- Ansiktsuttryck (le när det passar!)
- Handgester (håll dem inom kamerans synfält)
- Nickningar (visa att du lyssnar aktivt)
- Hållning (sitt rak i ryggen)

**Undvik:**
- Att vippa på stolen
- Att titta bort ofta
- Att pilla på saker
- Att luta dig för långt tillbaka (signalerar ointresse)

## Plattformsspecifika tips

### Microsoft Teams

**Före mötet:**
- Ladda ner Teams-appen (fungerar bäst)
- Logga in med ditt Microsoft-konto eller som gäst
- Testa ljud och video via Inställningar > Enheter

**Användbara funktioner:**
- "Bakgrundseffekter" – sudda ut bakgrund eller välj virtuell
- "Stäng av brus" – filtrera bort bakgrundsljud
- "Höj hand" – om du vill säga något i gruppmöte

**Snabbtangenter:**
- Ctrl+Shift+M = Mute/unmute mikrofon
- Ctrl+Shift+O = Kamera på/av

### Zoom

**Före mötet:**
- Ladda ner Zoom-klienten (www.zoom.us)
- Gå med via "Join meeting" och ange mötes-ID
- Använd personligt rum om du skapar mötet

**Viktiga inställningar:**
- Inställningar > Video > "Touch up my appearance" (mjukare belysning)
- Inställningar > Video > "Adjust for low light" (bättre i mörka rum)
- Inställningar > Audio > Testa mikrofon och högtalare

**Snabbtangenter:**
- Alt+A = Mute/unmute mikrofon
- Alt+V = Kamera på/av
- Alt+H = Visa/dölj chatt

### Google Meet

**Före mötet:**
- Fungerar bäst i Chrome-webbläsare
- Ingen nedladdning krävs
- Logga in med Google-konto om du har ett

**Viktiga funktioner:**
- Klicka på tre prickar > Inställningar för ljud/video
- "Använd en visuell effekt" för bakgrundssuddning
- "Brusreducering" under ljudinställningar

**Snabbtangenter:**
- Ctrl+D = Mute/unmute mikrofon
- Ctrl+E = Kamera på/av

## Under intervjun

### Gör detta

- **Logga in 10 minuter tidigt** – det visar professionalitet och ger tid att lösa eventuella problem
- **Ha vatten nära till hands** – nervositet ger torr mun
- **Använd anteckningar smart** – placera dem nära kameran så det inte ser ut som du läser
- **Nicka och le** – visa att du lyssnar aktivt
- **Paus innan du svarar** – på video behöver du inte fylla tystnaden direkt
- **Säg intervjuarens namn** – skapar personlig kontakt

### Undvik detta

- **Äta eller tugga tuggummi** – mikrofonen fångar allt
- **Titta på dig själv** – det är frestande men distraherar
- **Multitaska** – stäng alla andra program och flikar
- **Avbryta** – fördröjningen gör det lätt att prata i mun på varandra
- **Ha telefonen inom räckhåll** – lägg den i ett annat rum

### Mute-strategin

- **Mute dig när du inte pratar** – särskilt i gruppmöten
- **Unmute precis innan du ska svara** – ger dig en sekunds tänketid
- **Om du hostar/nyser** – mute snabbt, be om ursäkt efteråt

## Om något går fel – skript

### Tekniska problem

**Ljudproblem:**
"Ursäkta, jag har lite problem med ljudet. Kan ni höra mig nu? ... Bra, tack för tålamodet."

**Videoproblem:**
"Min video verkar ha fryst. Jag stänger av kameran och startar om den. Ett ögonblick."

**Internetproblem:**
"Jag märker att min uppkoppling är instabil. Skulle det vara OK om jag stängde av video för att förbättra ljudkvaliteten?"

**Behöver koppla upp igen:**
"Tyvärr verkar tekniken strula. Får jag koppla ur och in igen? Jag är tillbaka inom en minut."

### Störningar

**Någon kommer in:**
"Ursäkta mig ett ögonblick." (Mute, hantera situationen, unmute) "Förlåt för avbrottet, var var vi?"

**Bakgrundsljud:**
"Jag ber om ursäkt för ljudet, jag mutar mig snabbt." (Hantera, unmute) "Tack för förståelsen."

### Om du inte förstår frågan

"Ursäkta, jag tror jag missade en del av det du sa. Skulle du kunna upprepa frågan?"

"Jag vill säkerställa att jag förstår rätt – menar du [din tolkning]?"

## Detaljerad checklista för dagen

### Morgonen
- [ ] Dusch och ordna håret
- [ ] Klä dig professionellt (även nederdelen – du kan behöva resa dig)
- [ ] Ät en lätt måltid (inte för tung)
- [ ] Undvik för mycket kaffe (kan göra dig nervös)

### En timme innan
- [ ] Starta om datorn (rensar minnet och förebygger problem)
- [ ] Stäng alla onödiga program
- [ ] Stäng av notiser på dator och telefon
- [ ] Dubbelkolla belysning och bakgrund
- [ ] Testa ljud och bild en sista gång
- [ ] Gå på toaletten

### 15 minuter innan
- [ ] Ha anteckningar redo (CV, företagsinfo, frågor)
- [ ] Ha vatten och papper bredvid dig
- [ ] Andas djupt – lugna nerverna
- [ ] Le mot dig själv i spegeln (det hjälper!)

### 10 minuter innan
- [ ] Logga in på mötet
- [ ] Verifiera att ljud och video fungerar
- [ ] Slappna av och vänta

## Avslutande tips

En digital intervju kräver extra förberedelse men ger dig också fördelar: du är i en bekant miljö, kan ha anteckningar nära, och slipper stressa med att ta dig till platsen.

**Kom ihåg:** Det viktigaste är fortfarande innehållet – dina svar, din personlighet och hur väl du passar för rollen. Tekniken är bara verktyget.

**Pro-tips:** Spela in dig själv i ett övningsmöte. Det är ovärderligt att se hur du framstår på video!`,
    category: 'interview',
    subcategory: 'during-interview',
    tags: ['digital intervju', 'Zoom', 'Teams', 'Google Meet', 'teknik', 'distans', 'kameranärvaro', 'videosamtal'],
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-02-17T10:00:00Z',
    readingTime: 18,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['intervju-forberedelser', 'intervju-fragor'],
    checklist: [
      { id: '1', text: 'Testa programvaran i förväg' },
      { id: '2', text: 'Kontrollera belysning och bakgrund' },
      { id: '3', text: 'Testa ljud och mikrofon' },
      { id: '4', text: 'Stäng av notiser' },
      { id: '5', text: 'Förbered "fusklappar"' },
      { id: '6', text: 'Ha vatten och anteckningsmaterial' },
      { id: '7', text: 'Logga in 10 min tidigt' },
    ],
  },

  // === VÄLMÅENDE ===
  {
    id: 'hantera-avslag',
    title: 'När du fått avslag – så hanterar du det',
    summary: 'Avslag är en del av jobbsökningen. Lär dig hantera dem på ett sätt som stärker dig.',
    content: `Att få avslag på en jobbansökan gör ont. Det är helt normalt att känna besvikelse. Men kom ihåg: ett avslag är inte ett misslyckande – det är en del av processen.

## Det är inte personligt

### Varför avslag händer
- Det kom in 200 ansökningar – de kunde bara välja en
- De sökte någon med specifik erfarenhet
- En intern kandidat fick jobbet
- De omorganiserade och la ner tjänsten
- Timing – de hade redan hittat någon innan din ansökan kom
- Budgetförändringar – tjänsten drogs tillbaka

**Viktigt:** Avslag betyder inte att du är oduglig. Rekrytering handlar om att hitta rätt match för just den tjänsten vid just den tidpunkten.

## Dina känslor är giltiga

Det är okej att känna besvikelse, frustration eller oro. Tillåt dig att känna – men sätt en tidsgräns.

### Vanliga känslor efter avslag
- **Besvikelse** – Du hade förhoppningar som inte infriades
- **Ilska** – Det känns orättvist, särskilt om du lade ner mycket tid
- **Skam** – Du kan känna dig som ett misslyckande (men du är det inte!)
- **Oro** – Kommer jag någonsin hitta ett jobb?
- **Lättnad** – Ibland känns det faktiskt skönt att veta var du står

Alla dessa känslor är normala och OK att känna.

## Hanteringsstrategier för dina känslor

### Den första timmen
1. **Läs meddelandet en gång** – inte flera gånger
2. **Andas djupt** – fyra andetag in, håll i fyra sekunder, andas ut i fyra sekunder
3. **Rör på dig** – ta en promenad, stretcha, gör något fysiskt
4. **Kontakta någon** – ring en vän eller familjemedlem som stöttar dig

### De första dagarna
- **Sätt en "sorgetid"** – tillåt dig känna i 24-48 timmar, sen är det dags att gå vidare
- **Skriv av dig** – skriv ner dina tankar och känslor i en dagbok
- **Gör något du tycker om** – titta på en film, träffa vänner, träna
- **Undvik att grotta ner dig** – läs inte avslagsmejlet om och om igen

### Utveckla ett utvecklingstänk (growth mindset)

Ett "utvecklingstänk" innebär att du ser utmaningar som möjligheter att lära och växa:

| Fast tänkande | Utvecklingstänk |
|---------------|----------------|
| "Jag är inte tillräckligt bra" | "Jag kan bli bättre med övning" |
| "De gillade mig inte" | "Det var inte rätt match denna gång" |
| "Jag misslyckas alltid" | "Varje avslag lär mig något nytt" |
| "Jag borde ge upp" | "Jag behöver bara fortsätta och anpassa min strategi" |

**Övning:** När du får ett avslag, skriv ner tre saker du lärt dig av ansökningsprocessen.

## Så ber du om feedback

Feedback efter avslag är guld värt – det hjälper dig förbättra framtida ansökningar. Så här gör du:

### När du ber om feedback
- **Timing:** Vänta 1-2 dagar efter avslaget innan du hör av dig
- **Format:** E-post fungerar bäst – det ger rekryteraren tid att formulera ett svar
- **Ton:** Var tacksam och professionell, inte bitter eller arg

### Mall för att be om feedback

**Ämne:** Tack för besked – fråga om feedback

"Hej [Namn],

Tack för att ni återkom med besked gällande tjänsten som [titel]. Även om jag naturligtvis är besviken, förstår jag att ni behövde göra ett val.

Jag skulle uppskatta om ni har möjlighet att dela med er av eventuell feedback på min ansökan eller intervju. Är det något specifikt jag kan utveckla eller förbättra till framtida ansökningar?

Jag är tacksam för all feedback ni kan ge, hur kort den än är.

Med vänliga hälsningar,
[Ditt namn]"

### Bra följdfrågor om du får feedback
- "Var det något specifikt i min erfarenhet som saknades?"
- "Finns det kompetenser jag borde utveckla?"
- "Hur upplevde ni mig i intervjun?"
- "Har ni några tips för framtida ansökningar?"

### Om du inte får svar
Många arbetsgivare hinner eller kan inte ge feedback. Om du inte får svar efter en vecka – släpp det och gå vidare. Deras tystnad säger ingenting om dig.

## Så vänder du avslag till motivation

### Se det som träning
Varje ansökan och intervju gör dig bättre förberedd för nästa. Tänk på det som att träna en muskel.

### Räkna framgångar, inte avslag
- Du vågade söka – det är en framgång
- Du fick en intervju – ännu en framgång
- Du lärde dig något nytt – framgång!

### Påminn dig om vad du kan
Skriv en lista med dina styrkor och framgångar. Läs den när du känner dig nere.

### Skapa en "vinst-journal"
Skriv ner varje liten seger:
- Fick svar på en ansökan
- Slutförde en svår ansökan
- Fick positiv feedback
- Lärde mig något nytt

## Mental hälsa och stöd

### Varningstecken att vara uppmärksam på
Om du upplever flera av följande under längre tid (mer än 2 veckor), sök professionell hjälp:
- Svårt att ta dig ur sängen
- Tappat intresse för saker du brukar tycka om
- Känner dig värdelös eller hopplös
- Sömnproblem (sover för mycket eller för lite)
- Svårt att koncentrera dig
- Tankar på att skada dig själv

### Resurser för mental hälsa
- **Mind – självmordslinjen:** 90101 (alla dagar, alla tider)
- **Jourhavande medmänniska:** 08-702 16 80 (21-06 varje dag)
- **Krislinjen:** Chatta på mind.se
- **Vårdcentralen:** Boka tid för samtal med kurator eller psykolog
- **1177:** Ring för rådgivning
- **Din arbetskonsulent:** Boka ett stödsamtal

### Dagliga strategier för psykiskt välmående
1. **Rutin:** Behåll en daglig struktur även när du är arbetssökande
2. **Rörelse:** 30 minuters promenad per dag gör stor skillnad
3. **Sömn:** Försök sova och vakna på samma tider
4. **Social kontakt:** Isolera dig inte – träffa människor
5. **Begränsa jobbsökningen:** Max 3-4 timmar per dag

## Praktisk checklista efter avslag

- [ ] Läst avslaget och förstått det
- [ ] Tillåtit dig att känna dina känslor
- [ ] Pratat med någon om det
- [ ] Skickat tackbrev/bett om feedback (om relevant)
- [ ] Skrivit ner vad du lärt dig
- [ ] Uppdaterat din "vinst-journal" med det du åstadkom
- [ ] Planerat nästa steg i jobbsökningen
- [ ] Gjort något som ger dig energi

## Kom ihåg

**Du växer genom motgångar** – Varje avslag för dig närmare rätt jobb

**Ditt värde är inte ditt jobb** – Du är mer än din yrkestitel

**Rätt jobb kommer** – Det som är menat för dig kan inte gå dig förbi

**Det är OK att inte vara OK** – Men det kommer bli bättre

**Behöver du prata?** Din arbetskonsulent finns här för dig. Tveka inte att boka ett samtal.`,
    category: 'wellness',
    subcategory: 'rejection',
    tags: ['avslag', 'hantera', 'motivation', 'pepp', 'stöd', 'mental hälsa', 'utvecklingstänk', 'återkoppling'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
    readingTime: 15,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['motivation-langsiktig', 'stresshantering', 'krisstod'],
    actions: [
      { label: '📅 Boka stödsamtal', href: '/diary', type: 'primary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'motivation-langsiktig',
    title: 'Behåll motivationen under långtidssökande',
    summary: 'Strategier för att orka fortsätta söka jobb även när det tar längre tid än väntat.',
    content: `Att söka jobb är som ett maraton, inte en sprint. När veckorna går och inget händer är det lätt att tappa motivationen.

## Varför tappar vi motivationen?

- Den emotionella berg-och-dalbanan (hopp-väntan-besvikelse)
- Brist på kontroll
- Isolering

## Strategier för långsiktig motivation

### 1. Sätt upp ett system, inte bara mål
Fokusera på processen: "Söka 3 jobb i veckan" istället för "Få ett jobb".

### 2. Dela upp dagen
- Morgon: Söka jobb
- Eftermiddag: Vila
- Kväll: Lättare uppgifter

### 3. Fira små segrar
Varje steg är värt att firas!

### 4. Skapa rutiner
Rutiner minskar beslutsutmatning.

### 5. Var social
Motverka isoleringen genom att träffa vänner och din konsulent.

### 6. Fokusera på vad du KAN kontrollera
Du kan styra hur mycket du söker – inte om du får jobb.

### 7. Ta hand om dig själv
Prioritera sömn, mat och rörelse.

## Kom ihåg

**Du är mer än ditt jobb.** Det kommer att ordna sig. Var snäll mot dig själv.`,
    category: 'wellness',
    subcategory: 'motivation',
    tags: ['motivation', 'långtidssökande', 'uthållighet', 'strategier'],
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-02-19T10:00:00Z',
    readingTime: 16,
    difficulty: 'medium',
    energyLevel: 'low',
    relatedArticles: ['hantera-avslag', 'stresshantering'],
  },

  {
    id: 'stresshantering',
    title: 'Stresshantering för arbetssökande',
    summary: 'Praktiska tekniker för att hantera stress och oro under jobbsökarperioden.',
    content: `Att söka jobb är en av livets mer stressande upplevelser. Här är verktyg för att hantera stressen.

## Förstå din stress

### Känner du igen dessa signaler?

**Fysiska:** Svårt att sova, huvudvärk, trötthet
**Mentala:** Oro som snurrar, svårt att koncentrera sig
**Beteendemässiga:** Undvikande, prokrastinering

Detta är normala reaktioner.

## Akut stresshantering

**4-7-8-andning:**
1. Andas in i 4 sekunder
2. Håll i 7 sekunder  
3. Andas ut i 8 sekunder

**5-4-3-2-1-tekniken:**
Identifiera 5 saker du ser, 4 du känner, 3 du hör, 2 du luktar, 1 du smakar.

**Fysisk rörelse:**
Gå en promenad – även 5 minuter hjälper!

## Långsiktig stresshantering

### Struktur skapar trygghet
- Fasta rutiner
- Tydliga gränser för jobbsökning

### Fysisk hälsa
- Prioritera sömn (7-9 timmar)
- Rör på dig 30 minuter om dagen
- Ät regelbundet

### Mentala strategier
- Utmana negativa tankemönster
- Prova mindfulness eller meditation
- Skriv dagbok

### Socialt stöd
- Prata om det
- Be om hjälp

## Kom ihåg

Du är inte din produktivitet. Det är okej att vila. Du klarar detta – en dag i taget.`,
    category: 'wellness',
    subcategory: 'stress',
    tags: ['stress', 'hantering', 'mående', 'verktyg', 'strategier'],
    createdAt: '2024-01-24T10:00:00Z',
    updatedAt: '2024-02-18T10:00:00Z',
    readingTime: 18,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['hantera-avslag', 'motivation-langsiktig', 'krisstod'],
    actions: [
      { label: '🆘 Krissupport', href: '#crisis', type: 'primary' },
    ],
  },

  // === TILLGÄNGLIGHET ===
  {
    id: 'rattigheter-stod',
    title: 'Dina rättigheter som arbetssökande med stödbehov',
    summary: 'En guide till lagar, stödinsatser och rättigheter när du har en funktionsnedsättning.',
    content: `Att söka jobb när du har en funktionsnedsättning kan kännas extra utmanande. Men du har rättigheter – och det finns stöd att få.

## Diskrimineringslagen

Arbetsgivare får INTE:
- Avvisa din ansökan på grund av funktionsnedsättning
- Ställa onödiga frågor om funktionsnedsättningen
- Ge sämre anställningsvillkor
- Vägra rimliga anpassningar

## När ska du berätta?

Du bestämmer själv! Alternativ:
1. I ansökan – visar transparens
2. I intervjun – kan förklara personligen
3. Efter anställningserbjudande – starkare position
4. När du börjar jobba
5. Aldrig – din ensak

## Stödinsatser

### Nystartsjobb
Arbetsgivaren får ekonomiskt stöd när de anställer dig.

### Lönebidrag
Stöd för dig med nedsatt arbetsförmåga.

### Stöd från Arbetsförmedlingen
- Arbetshandledare
- Arbetslivsintroduktion
- Praktik
- Arbetsmarknadsutbildning

## Anpassningar på arbetsplatsen

### Exempel:
- **Fysiska:** Ergonomisk utrustning, höj- och sänkbart skrivbord
- **Kognitiva:** Tydliga instruktioner skriftligt, checklistor
- **Sensoriska:** Ljudisolerat rum, dämpad belysning
- **Tidsmässiga:** Flexibel arbetstid, kortare arbetsdag

## Viktiga kontakter

- **Arbetsförmedlingen:** 0771-416 416
- **Försäkringskassan:** 0771-524 524
- **Diskrimineringsombudsmannen (DO):** Vid diskriminering

## Kom ihåg

🌟 Du har rätt att arbeta
💪 Din funktionsnedsättning är en del av dig, men definierar inte dig
🤝 Det finns stöd att få
⚖️ Du har rättigheter

**Du är värd en chans. Gå ut och ta den!**`,
    category: 'accessibility',
    subcategory: 'rights',
    tags: ['rättigheter', 'stöd', 'funktionsnedsättning', 'anpassningar', 'diskriminering'],
    createdAt: '2024-01-26T10:00:00Z',
    updatedAt: '2024-02-16T10:00:00Z',
    readingTime: 20,
    difficulty: 'detailed',
    energyLevel: 'medium',
    relatedArticles: ['anpassningar-arbetsplats', 'stodinsatser-guide'],
    actions: [
      { label: '📞 Kontakt Arbetsförmedlingen', href: 'tel:0771-416416', type: 'secondary' },
    ],
    author: 'Katarina Holm',
    authorTitle: 'Handläggare Arbetsförmedlingen',
  },

  // === ARBETSMARKNADEN ===
  {
    id: 'branscher-brist',
    title: 'Branscher med stort personalbehov 2024',
    summary: 'Vilka branscher söker flest medarbetare och vad krävs för att komma in?',
    content: `Vissa branscher skriker efter personal. Att rikta in sig på rätt bransch kan öka dina chanser avsevärt.

## Vård och omsorg

**Personalbrist:** Mycket stor
**Efterfrågade yrken:** Undersköterskor, vårdbiträden, personliga assistenter
**Vad krävs:** Oftast gymnasieutbildning, kan fås via arbetsmarknadsutbildning

## Handel

**Personalbrist:** Stor
**Efterfrågade yrken:** Butiksmedarbetare, kassapersonal, lagerarbetare
**Vad krävs:** Ofta ingen formell utbildning, kundservicevana

## Restaurang och livsmedel

**Personalbrist:** Mycket stor
**Efterfrågade yrken:** Kockar, köksmedarbetare, servitörer
**Vad krävs:** Erfarenhet meriterande men inte alltid nödvändigt

## Transport och logistik

**Personalbrist:** Stor
**Efterfrågade yrken:** Lastbilschaufförer, budbilschaufförer, truckförare
**Vad krävs:** Körkort (ofta C eller CE), truckkort

## Bygg och industri

**Personalbrist:** Stor
**Efterfrågade yrken:** Byggarbetare, elektriker, VVS-montörer
**Vad krävs:** Yrkesbevis/utbildning (kan fås via lärlingsvägen)

## IT och teknik

**Personalbrist:** Mycket stor
**Efterfrågade yrken:** Utvecklare, IT-support, nätverkstekniker
**Vad krävs:** Teknisk utbildning eller egenkompetens

## Hur kommer du in?

1. **Praktik/Prövning** – visa vad du kan
2. **Arbetsmarknadsutbildning** – med praktik
3. **Lärlingsvägen** – jobba och lär dig samtidigt
4. **Vikariat och timanställning** – få foten innanför dörren

## Kompetenser som efterfrågas överallt

- Kundservicevana
- Datorvana
- Svenska (och ofta engelska)
- Samarbetsförmåga
- Pålitlighet

Det är aldrig för sent att byta bransch!`,
    category: 'job-market',
    subcategory: 'industries',
    tags: ['branscher', 'bristyrken', 'arbetsmarknad', 'efterfrågan', '2024'],
    createdAt: '2024-01-28T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    readingTime: 16,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['kompetenser-efterfragas', 'karriarvaxling'],
    relatedTools: ['/interest-guide'],
    actions: [
      { label: '🎯 Gör intresseguiden', href: '/interest-guide', type: 'primary' },
    ],
  },

  // === VERKTYG ===
  {
    id: 'checklista-innan-ansokan',
    title: 'Checklista: Innan du skickar ansökan',
    summary: 'En praktisk checklista för att säkerställa att din ansökan är komplett och professionell.',
    content: `Innan du trycker på "skicka", gå igenom denna checklista.

## CV-check

### Kontaktinformation
- [ ] Namn stavat korrekt
- [ ] Telefonnummer (kontrollera siffrorna!)
- [ ] E-postadress (proffsig)
- [ ] Ort (om du valt att ange)

### Sammanfattning/Profil
- [ ] Anpassad för detta specifika jobb
- [ ] Inte för generisk

### Arbetslivserfarenhet
- [ ] Kronologisk ordning
- [ ] Datumen stämmer
- [ ] Beskrivningar med aktiva verb

### Utbildning
- [ ] All relevant utbildning med
- [ ] Korrekta årtal

### Kompetenser
- [ ] Relevanta för jobbet
- [ ] Inte för många

### Övrigt
- [ ] Inga stavfel
- [ ] Konsekvent formatering

## Personligt brev-check

- [ ] Anpassat för denna specifika tjänst
- [ ] Max 1 A4
- [ ] Inga stavfel
- [ ] Professionellt språk

## Teknisk check

- [ ] Sparat som PDF
- [ ] Filstorlek rimlig
- [ ] Filnamn professionellt

## Sista kontroll

- [ ] Läst igenom högt
- [ ] Rätt filer bifogade
- [ ] Använt nyckelord från annonsen

Lycka till! 🍀`,
    category: 'tools',
    subcategory: 'checklists',
    tags: ['checklista', 'ansökan', 'kontroll', 'praktiskt'],
    createdAt: '2024-01-30T10:00:00Z',
    updatedAt: '2024-02-14T10:00:00Z',
    readingTime: 5,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['cv-grunder', 'personligt-brev'],
    checklist: [
      { id: '1', text: 'Kontrollera stavning i CV' },
      { id: '2', text: 'Kontrollera stavning i brev' },
      { id: '3', text: 'Anpassa för specifikt jobb' },
      { id: '4', text: 'Kontrollera bifogade filer' },
      { id: '5', text: 'Läs igenom högt' },
      { id: '6', text: 'Spara som PDF' },
    ],
  },

  // === NYA ARTIKLAR 2024 ===
  {
    id: 'nystartsjobb-guide',
    title: 'Nystartsjobb – ditt extra stöd in i arbetslivet',
    summary: 'Allt om nystartsjobb: vem som kan få det, hur det fungerar och hur du använder det som en dörröppnare.',
    content: `Nystartsjobb är en subventionerad anställning som ger dig extra stöd när du etablerar dig på arbetsmarknaden. Här är allt du behöver veta.

## Vad är nystartsjobb?

Ett nystartsjobb innebär att arbetsgivaren får ekonomiskt stöd för att anställa dig. Detta gör det lättare för dig att få ett jobb, även om du saknar lång erfarenhet.

## Vem kan få nystartsjobb?

Du kan vara aktuell om du:
- Är 20 år eller äldre och har varit utanför arbetsmarknaden i minst 12 månader
- Är 25 år eller äldre och har varit utanför arbetsmarknaden i minst 6 månader
- Har en funktionsnedsättning som medför nedsatt arbetsförmåga
- Är nyanländ (upp till 3 år efter uppehållstillstånd)

## Hur fungerar det?

**Stödet betalas till arbetsgivaren**, inte till dig. Det innebär:
- Din lön påverkas inte
- Du har samma villkor som andra anställda
- Arbetsgivaren får bidrag för att täcka en del av lönekostnaden

## Fördelar för dig

✅ **Ökade chanser att få jobb**
Arbetsgivaren tar mindre risk

✅ **Samma villkor**
Du har samma lön och förmåner som andra

✅ **Möjlighet att visa vad du kan**
Bevisa ditt värde på jobbet

## Så här går du tillväga

1. **Kontrollera med Arbetsförmedlingen** om du uppfyller kraven
2. **Sök jobb som vanligt**
3. **Nämn nystartsjobb i ansökan eller intervjun** – visa att du vet om stödet
4. **Arbetsgivaren ansöker** om stödet

## Tips för att lyckas

- Var öppen med att du är berättigad nystartsjobb
- Förklara att det inte kostar arbetsgivaren mer
- Fokusera på vad du kan bidra med
- Visa entusiasm och vilja att lära

## Vanliga frågor

**Måste jag berätta att jag har nystartsjobb?**
Nej, det är valfritt. Men det kan öka dina chanser.

**Påverkar det min lön?**
Nej, du får samma lön som kollegor i liknande roller.

**Hur länge varar stödet?**
Vanligtvis 12 månader, men kan variera.

## Kom ihåg

Nystartsjobb är ett **trampolin**, inte en livboj. Det är en chans att visa vad du går för och bygga en karriär!`,
    category: 'accessibility',
    subcategory: 'support',
    tags: ['nystartsjobb', 'stöd', 'subventionerad anställning', 'Arbetsförmedlingen'],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    readingTime: 12,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['rattigheter-stod', 'anpassningar-arbetsplats'],
    actions: [
      { label: '📞 Kontakta Arbetsförmedlingen', href: 'tel:0771-416416', type: 'primary' },
    ],
    author: 'Katarina Holm',
    authorTitle: 'Handläggare Arbetsförmedlingen',
  },

  {
    id: 'loneforhandling-guide',
    title: 'Löneförhandling – så får du den lön du förtjänar',
    summary: 'Praktiska strategier för att förbereda, genomföra och avsluta en lyckad löneförhandling.',
    content: `Att prata om lön kan kännas obekvämt, men det är en viktig del av arbetslivet. Här lär du dig hur du förhandlar på ett professionellt sätt – både vid nya jobb och under lönesamtal.

## Varför är löneförhandling viktigt?

En lyckad löneförhandling kan göra stor skillnad över tid:
- **5 000 kr mer i månaden** = 60 000 kr mer per år
- **Över en 10-årsperiod** (med löneökningar) = 700 000+ kr mer i total inkomst
- **Pensionen** påverkas också positivt

De flesta arbetsgivare förväntar sig förhandling. Om du inte förhandlar lämnar du sannolikt pengar på bordet.

## Del 1: Grundlig research

### Var hittar du lönestatistik?

**Officiella källor:**
- **SCB (Statistiska centralbyrån):** scb.se/hitta-statistik/sverige-i-siffror/lonesok
- **Medlingsinstitutets statistik:** mi.se

**Fackförbundens lönestatistik:**
- **Unionen:** unionen.se/lonestatistik (tjänstemän)
- **Akavia:** akavia.se/lon (akademiker)
- **Kommunal:** kommunal.se (offentlig sektor)
- **IF Metall:** ifmetall.se (industri)
- **Sveriges Ingenjörer:** sverigesingenjorer.se

**Privata tjänster:**
- **Glassdoor:** glassdoor.com (företagsspecifik)
- **LinkedIn Salary:** linkedin.com/salary
- **Levels.fyi:** levels.fyi (tech-branschen)

### Faktorer som påverkar din lön

När du researchar, ta hänsyn till:

**Geografisk faktor:**
- Stockholm: +15-20% jämfört med rikssnittet
- Göteborg/Malmö: +5-10%
- Mindre orter: -5-15%

**Bransch:**
- Tech, finans, juridik: Generellt högre
- Ideella organisationer, offentlig sektor: Generellt lägre

**Företagsstorlek:**
- Stora företag: Ofta bättre grundlön och förmåner
- Startups: Lägre grundlön men möjligt med optioner

**Din erfarenhet:**
- Junior (0-2 år): Lägre spann
- Mid-level (3-5 år): Medelspann
- Senior (5+ år): Högre spann

### Gör en löneanalys

Skapa en tabell med din research:

| Källa | Lägsta | Median | Högsta |
|-------|--------|--------|--------|
| SCB | | | |
| Unionen | | | |
| Glassdoor | | | |
| Nätverkskontakter | | | |

**Ditt realistiska spann:** _____________ till _____________ kr/mån

## Del 2: Definiera din strategi

### Tre magiska siffror

**1. Ditt golv (walk-away number)**
Under detta tackfar du nej. Baseras på:
- Dina minimala levnadskostnader
- Vad du tjänar nu (minst samma eller mer)
- Vad marknaden betalar för liknande roller

**2. Ditt mål (target)**
Den lön du faktiskt vill ha och tror är realistisk. Baseras på:
- Median för liknande roller
- Din specifika erfarenhet och kompetens
- Företagets lönenivå

**3. Din öppning (anchor)**
Den siffra du startar förhandlingen med. Ska vara:
- Högre än ditt mål (så du har utrymme att förhandla)
- Men inte så hög att du blir utskrattad
- Regel: 10-15% över ditt mål

**Exempel:**
- Golv: 38 000 kr
- Mål: 42 000 kr
- Öppning: 46 000 kr

### Förbered dina argument

Lista dina 5 starkaste argument för varför du förtjänar denna lön:

**Argument 1: Specifik prestation med siffror**
"Jag ökade försäljningen med 25% förra året, vilket motsvarar 2 miljoner kr i ökade intäkter."

**Argument 2: Unikt värde du tillför**
"Jag är den enda i teamet med certifiering i X, vilket har sparat oss från att anlita externa konsulter."

**Argument 3: Extra ansvar utöver rollen**
"Förutom mina ordinarie uppgifter har jag tagit på mig att vara mentor för tre juniora kollegor."

**Argument 4: Marknadsjämförelse**
"Enligt Unionens statistik ligger medianlönen för denna roll på X kr, och med min erfarenhet borde jag ligga över medianen."

**Argument 5: Framtida bidrag**
"Med min kompetens inom Y planerar jag att driva projektet Z som förväntas spara/generera..."

## Del 3: Förhandlingssamtalet – steg för steg

### Scenario A: Du får ett jobberbjudande

**När de frågar: "Vad har du för löneanspråk?"**

❌ **Undvik att svara först om möjligt:**
"Jag vill gärna veta mer om hela paketet innan vi diskuterar specifika siffror. Vad har ni budgeterat för rollen?"

Om de insisterar:

✅ **Ge ett spann:**
"Baserat på min research och erfarenhet ligger mitt förväntan på 44 000-48 000 kr. Men jag är öppen för diskussion beroende på hela paketet."

**När de ger ett erbjudande:**

1. **Tacka** (oavsett siffran): "Tack för erbjudandet!"
2. **Pausa** – säg inget mer i några sekunder
3. **Fråga**: "Är det förhandlingsbart?"
4. **Om ja**, presentera ditt motbud med argument

**Exempelmanus för motbud:**

"Tack för erbjudandet på 40 000 kr. Jag är väldigt intresserad av rollen och företaget. Baserat på min erfarenhet av [specifik kompetens] och marknadslönen för liknande roller, hade jag förväntat mig en lön närmare 45 000 kr. Är det något vi kan diskutera?"

### Scenario B: Lönesamtal med nuvarande arbetsgivare

**Strukturera samtalet:**

**1. Öppna positivt (30 sekunder)**
"Tack för att vi ses. Jag vill börja med att säga att jag trivs bra här och uppskattar möjligheterna jag fått."

**2. Presentera ditt case (2-3 minuter)**
"Under det senaste året har jag [prestation 1], [prestation 2] och [prestation 3]. Dessa bidrag har resulterat i [mätbart resultat]."

**3. Ange din begäran (30 sekunder)**
"Med tanke på dessa bidrag och var marknaden ligger för liknande roller, önskar jag en löneökning till [siffra] kr."

**4. Tystnad**
Var tyst och vänta på respons. Fyll inte tystnaden!

**5. Förhandla**
Baserat på deras svar, fortsätt dialogen.

### Manus för vanliga motargument

**"Det finns inte i budgeten just nu"**
"Jag förstår att budgeten är tight. När skulle det vara möjligt att återkomma till frågan? Och finns det något jag kan göra under tiden som skulle stärka mitt case?"

**"Alla i teamet har samma lön"**
"Jag förstår att ni har en lönestruktur. Finns det möjlighet att justera den baserat på prestation och bidrag? Mina resultat [specifika exempel] visar att jag levererar över förväntan."

**"Du är ganska ny i rollen"**
"Det stämmer att jag varit i rollen i X månader. Under den tiden har jag dock [prestation]. Om vi inte kan justera lönen nu, kan vi komma överens om att utvärdera igen om sex månader?"

**"Vi kan erbjuda X, inte Y"**
"Tack, det är ett steg i rätt riktning. Skulle det vara möjligt att kompensera skillnaden med [annan förmån: flextid, utbildning, extra semester]?"

## Del 4: Förhandla hela paketet

Lön är inte allt. Om grundlönen är fast, överväg:

### Monetära förmåner
- Pensionsavsättning (kan vara 4-15% av lönen)
- Bonus/provision
- Aktier/optioner (vanligt i startups)
- Övertidsersättning
- Friskvårdsbidrag

### Flexibilitet
- Distansarbete (dagar per vecka)
- Flextid
- Komprimerad arbetsvecka (ex: 4 dagar x 10 timmar)

### Tid
- Extra semesterdagar
- Föräldraledighetstillägg
- Tjänstledighet för studier

### Utveckling
- Utbildningsbudget
- Konferenser
- Mentorsprogram
- Titel/befattning

### Startdatum och annat
- Tidigare startbonus (sign-on bonus)
- Relocation-bidrag
- Bättre utrustning (dator, telefon)

**Exempelmanus:**
"Jag förstår att lönen är max 40 000 kr. Finns det möjlighet att kompensera med 3 extra semesterdagar och ett utbildningspaket på 30 000 kr per år?"

## Del 5: Vanliga misstag att undvika

❌ **Att ta det personligt**
Det är affärer, inte en bedömning av ditt värde som människa. Håll det professionellt.

❌ **Att jämföra med kollegor**
"Lisa tjänar mer än jag" är ett svagt argument. Fokusera på ditt eget bidrag och marknadsvärde.

❌ **Att hota med att sluta**
Det kan lätt slå tillbaka och skada relationen. Om du verkligen planerar att sluta, gör det – men använd det inte som förhandlingstaktik om du inte menar allvar.

❌ **Att ge upp vid första nej**
"Nej" betyder ofta "inte just nu" eller "övertyga mig". Fråga varför och vad som krävs för att ändra svaret.

❌ **Att acceptera första erbjudandet direkt**
Även om det är bra, visa att du tänker efter. "Tack, jag vill gärna fundera över natten och återkomma imorgon."

❌ **Att prata för mycket**
Efter att du sagt din siffra – var tyst. Låt dem svara.

❌ **Att fokusera bara på lönen**
Glöm inte totalpaketet. Ibland är 38 000 kr + bra förmåner bättre än 42 000 kr utan förmåner.

❌ **Att inte ha gjort research**
"Jag tycker jag borde tjäna mer" är svagt. "Medianlönen enligt Unionen är X och jag levererar över medel" är starkt.

## Del 6: Efter förhandlingen

### Om du fick ja
1. Tacka och bekräfta överenskommelsen skriftligt via mejl
2. Be om skriftligt anställningsavtal/lönebesked
3. Fira (du förtjänar det!)

### Om du fick nej eller delvis
1. Behåll professionalismen
2. Fråga: "Vad behöver jag uppnå för att vi ska kunna ha den här diskussionen igen?"
3. Be om en konkret tidsplan för ny utvärdering
4. Få överenskommelsen skriftligt
5. Fundera på om du ska börja leta andra möjligheter

### Dokumentera alltid
Oavsett utfall, skicka ett mejl som sammanfattar vad ni kommit överens om:

"Hej [namn], tack för samtalet idag. Som jag förstod det kom vi överens om [överenskommelse]. Vi ska ha en ny utvärdering [datum]. Stämmer det?"

## Kom ihåg

Du förtjänar att få betalt för ditt värde. Löneförhandling är en normal del av arbetslivet och arbetsgivare respekterar människor som kan förhandla professionellt – det är trots allt en viktig affärsfärdighet.

> **Tips:** Övning ger färdighet! Öva förhandlingen med en vän eller familjemedlem innan. Ju mer du övar, desto tryggare blir du i skarpt läge.`,
    category: 'interview',
    subcategory: 'salary',
    tags: ['lön', 'förhandling', 'lönesamtal', 'löneanspråk', 'värdera sig själv', 'lönestatistik'],
    createdAt: '2024-03-02T10:00:00Z',
    updatedAt: '2024-03-02T10:00:00Z',
    readingTime: 22,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['anstallningsformer', 'forsta-dagen-jobbet'],
    checklist: [
      { id: '1', text: 'Researcha marknadslöner' },
      { id: '2', text: 'Definiera ditt lönespann' },
      { id: '3', text: 'Förbered konkreta argument' },
      { id: '4', text: 'Öva på att formulera begäran' },
      { id: '5', text: 'Förbered svar på motargument' },
    ],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'linkedin-optimering',
    title: 'Optimera din LinkedIn-profil för jobbsökning',
    summary: 'Så gör du din LinkedIn-profil synlig för rekryterare och användbar för nätverkande.',
    content: `LinkedIn är världens största professionella nätverk med över 900 miljoner användare globalt och cirka 4 miljoner i Sverige. Det är ett oumbärligt verktyg för jobbsökare – 87% av rekryterare använder LinkedIn för att hitta kandidater. Så här optimerar du din profil för maximal synlighet.

## Varför LinkedIn är viktigt för jobbsökning

- **Rekryterare söker aktivt** efter kandidater på LinkedIn
- **Dolda jobb** – många tjänster tillsätts via nätverk innan de annonseras
- **Research** – arbetsgivare kollar ofta din profil innan intervju
- **Nätverkande** – du kan nå beslutsfattare direkt
- **Personligt varumärke** – bygg din professionella profil

## Del 1: Profilbild och bakgrundsbild

### Profilbild – ditt första intryck

Din profilbild är det första rekryterare ser. Profiler med bild får **14x fler visningar** än de utan.

✅ **Gör så här:**
- Professionell bild med neutral eller suddig bakgrund
- Ansiktet tar upp 60-70% av bilden
- Se in i kameran och le naturligt
- Bra belysning (dagsljus framifrån är bäst)
- Klä dig i kläder som passar din bransch
- Bild från axlarna och uppåt
- Hög upplösning (minst 400x400 pixlar)

❌ **Undvik:**
- Partybilder eller semesterbilder
- Självisar tagna med mobilkamera
- Bilder med andra människor (även beskurna)
- Gamla bilder (inte äldre än 3 år)
- Oskarpa eller mörka bilder
- För formella bilder (du ska se approachable ut)

**Tips:** Fråga en vän att ta bilden mot en vit vägg i dagsljus. Du behöver inte professionell fotograf!

### Bakgrundsbild (Cover photo)

Bakgrundsbilden är underskattat utrymme. Använd det!

**Idéer för bakgrundsbild:**
- Bild som representerar din bransch
- Ditt företags logga (om du är stolt anställd)
- En stad/plats kopplad till ditt arbete
- En grafik som visar dina kompetensområden
- Konferensbild eller arbetsmiljö

**Storlek:** 1584 x 396 pixlar (rekommenderad)

## Del 2: Rubrik (Headline) – 220 tecken som avgör

Din rubrik visas överallt: sökresultat, kommentarer, förfrågningar, meddelanden. Den är avgörande för om någon klickar på din profil.

### Struktur för rubrik

**Formel:** [Roll/Titel] | [Specialisering/Styrka] | [Nyckelord]

**Dåliga exempel:**
- "Söker jobb" (desperat, säger ingenting)
- "Arbetslös" (negativt)
- Bara en titel utan kontext

**Bra exempel:**
- "Projektledare | IT & Digital transformation | Certifierad PMP & Scrum Master"
- "Säljare B2B | Hjälper techbolag växa | 15 MSEK i pipeline 2023"
- "UX Designer | Skapar användarcentrerade digitala upplevelser | Figma, Research, Prototyping"
- "Ekonomiassistent | Redovisning, Bokföring, Fortnox | Redo för nya utmaningar"

**Om du söker jobb:**
- "Projektledare | Öppen för nya möjligheter inom IT"
- "Erfaren kundtjänstmedarbetare | Aktivt jobbsökande"

### Nyckelord i rubriken

Tänk: Vad söker rekryterare på? Inkludera:
- Din yrkestitel (kundtjänst, projektledare, utvecklare)
- Bransch (IT, finans, vård)
- Verktyg/system (SAP, Python, Photoshop)
- Certifieringar (PMP, AWS, ITIL)

## Del 3: Om-sektionen (About) – berätta din story

Du har 2 600 tecken. Använd dem väl! Om-sektionen är din chans att visa personlighet och berätta din professionella historia.

### Struktur för Om-sektionen

**Stycke 1: Hook (2-3 meningar)**
Fånga uppmärksamhet direkt. Vad gör dig unik?

**Stycke 2: Din bakgrund (3-4 meningar)**
Vem är du professionellt? Var har du arbetat och vad har du lärt dig?

**Stycke 3: Dina styrkor och värde (3-4 meningar)**
Vad bidrar du med? Vad brinner du för?

**Stycke 4: Call-to-action (2-3 meningar)**
Vad vill du att läsaren ska göra? Kontakta dig? Följa dig?

### Exempel på Om-sektion

---
"Att lösa problem är min drivkraft. Från min första roll som supporttekniker till dagens position som IT-projektledare har jag alltid fascinerats av att hitta smarta lösningar på komplexa utmaningar.

Med 8 års erfarenhet av IT-projekt har jag lett team på upp till 15 personer och levererat projekt värda över 50 MSEK. Min styrka ligger i att översätta tekniska krav till affärsspråk och vice versa – jag är bryggan mellan utvecklare och beslutsfattare.

Jag brinner särskilt för digital transformation och agila metoder. Som certifierad Scrum Master har jag hjälpt tre organisationer att framgångsrikt gå över till agilt arbetssätt.

Just nu utforskar jag nya möjligheter inom projektledning i stockholmsområdet. Har du ett spännande projekt som behöver en strukturerad men flexibel projektledare? Kontakta mig – jag bjuder gärna på en kaffe och ett samtal om hur jag kan bidra!"

Nyckelord: IT-projektledare, Scrum Master, Digital transformation, Agile, PMP, Change Management
---

### Tips för Om-sektionen:
- Skriv i första person (jag, mig)
- Visa personlighet – var inte för formell
- Inkludera nyckelord (men naturligt)
- Bryt upp texten med mellanrum
- Avsluta med kontaktuppmaning
- Lista nyckelord i slutet för sökbarhet

## Del 4: Erfarenhet – visa resultat, inte uppgifter

### Strukturera varje position

**Inkludera:**
- Jobbtitel (använd den mest sökbara titeln)
- Företagsnamn (länka till företagets LinkedIn-sida)
- Tidsperiod (månad/år - månad/år)
- Beskrivning med bullet points

**Skriv resultat, inte arbetsuppgifter:**

❌ "Ansvarade för kundservice"
✅ "Hanterade 50+ kundärenden dagligen med 97% kundnöjdhet. Fick utmärkelsen 'Månadens medarbetare' tre gånger."

❌ "Arbetade med försäljning"
✅ "Överträffade försäljningsmålen med 130%. Byggde pipeline på 8 MSEK och stängde bolagets största deal 2023."

### Lägg till media

LinkedIn låter dig bifoga:
- Presentationer
- Dokument (PDF)
- Bilder
- Videor
- Länkar

**Idéer:**
- Portfolio-exempel
- Certifikat
- Presentationer du hållit
- Artiklar du skrivit
- Projektresultat

## Del 5: Kompetenser (Skills) – maximera synlighet

Du kan lista upp till 50 kompetenser. Fyll alla!

### Strategisk kompetenslistning

1. **De 3 första är viktigast** – de visas överst
2. **Välj sökbara termer** – vad söker rekryterare?
3. **Blanda hårda och mjuka** – tekniska och personliga

**Exempel för projektledare:**
- Projektledning (hårt)
- Agile/Scrum (hårt)
- Stakeholder Management (mjukt)
- MS Project (verktyg)
- Riskhantering (hårt)
- Kommunikation (mjukt)

### Endorsements (bekräftelser)

- Be kollegor att endorsa dina viktigaste kompetenser
- Endorsa andras först (de endorsar ofta tillbaka)
- Fokusera på att få endorsements för topp 3 kompetenser

## Del 6: Rekommendationer – socialt bevis

Rekommendationer är guld! De är trovärdiga referenser direkt på din profil.

### Vem ska du be?
- Tidigare chefer (starkast)
- Kollegor du samarbetat nära med
- Kunder du hjälpt
- Mentorer
- Projektpartners

### Hur ber du?
Personligt meddelande, inte LinkedIn-förfrågan:

"Hej [Namn]! Jag håller på att uppdatera min LinkedIn-profil och undrar om du skulle kunna tänka dig att skriva en kort rekommendation? Det behöver inte vara långt – några meningar om hur det var att jobba tillsammans och vad du uppskattade mest. Tack på förhand!"

### Skriv själv först
Erbjud dig att skriva ett utkast de kan utgå från – det gör det enklare för dem.

## Del 7: "Open to Work" – använd rätt

### Synligt märke (gröna ramen)

✅ **Fördelar:**
- Signalerar tydligt att du är tillgänglig
- Rekryterare söker aktivt efter dessa

❌ **Nackdelar:**
- Kan se desperat ut
- Din nuvarande arbetsgivare kan se det

### Dolt läge (endast rekryterare)

LinkedIn kan visa att du är öppen för jobb ENDAST för rekryterare (inte din arbetsgivare).

**Så aktiverar du:**
1. Klicka på "Open to" under din profilbild
2. Välj "Finding a new job"
3. Fyll i preferenser (roll, plats, distans, etc.)
4. Välj "Recruiters only"

## Del 8: Aktivitet och synlighet

### Varför aktivitet spelar roll

- LinkedIns algoritm gynnar aktiva användare
- Din aktivitet syns i ditt nätverks flöde
- Rekryterare ser ditt engagemang

### Enkel aktivitet (5-10 min/dag)

**Reagera:** Gilla relevanta inlägg i din bransch
**Kommentera:** Skriv genomtänkta kommentarer (inte bara "Bra inlägg!")
**Dela:** Dela artiklar med din egen reflektion
**Gratulera:** Gratta kontakter till nya jobb, befordran, jubileum

### Skapa eget innehåll

Om du vågar – eget innehåll ger mest synlighet:

**Inläggstyper som fungerar:**
- Lärdomar från din karriär
- Branschinsikter
- Tips inom ditt expertområde
- Reflektioner från konferenser/utbildningar
- Karriärresa och milstolpar

**Tips för inlägg:**
- Hook i första meningen (fånga uppmärksamhet)
- Bryt upp i korta stycken
- Använd bullet points
- Avsluta med fråga (ökar kommentarer)
- Posta tisdag-torsdag, 8-10 på morgonen

## Del 9: Nätverkande på LinkedIn

### Bygg ditt nätverk strategiskt

**Vem ska du koppla ihop dig med?**
- Tidigare kollegor och klasskamrater
- Branschkollegor
- Rekryterare i din bransch
- Anställda på företag du vill jobba på
- Influencers inom ditt område

### Skicka personliga förfrågningar

❌ Standardtext: "Jag vill gärna lägga till dig i mitt professionella nätverk på LinkedIn"

✅ Personligt: "Hej Maria! Jag såg din presentation om digital marknadsföring på [event] och blev inspirerad. Jag arbetar också inom området och skulle gärna koppla ihop oss. /Erik"

### Underhåll relationer

- Gratulera till nya jobb
- Kommentera deras inlägg
- Skicka relevanta artiklar
- Boka virtuella kaffeträffar

## Del 10: Jobbsökning på LinkedIn

### LinkedIn Jobs – tips

1. **Spara sökningar** med dina kriterier
2. **Aktivera jobbaviseringar** för nya matchande jobb
3. **Använd filter:** Plats, erfarenhetsnivå, distansarbete
4. **"Easy Apply":** Snabbt men skicka även personligt brev
5. **Företagsföljning:** Följ företag du vill jobba på

### Hitta dolda jobb

1. **Sök på befattning** + "hiring" i inlägg
2. **Följ rekryterare** i din bransch
3. **Koppla ihop dig** med anställda på drömföretag
4. **Skriv direkt** till rekryterare/chefer med personligt meddelande

### InMail och direktmeddelanden

Om du kontaktar någon du inte känner:
- Var kort och tydlig
- Förklara varför just de
- Var specifik med vad du vill
- Gör det enkelt att hjälpa dig

**Exempel:**
"Hej Anna! Jag såg att du rekryterar projektledare till [Företag]. Jag har 5 års erfarenhet av IT-projekt och certifiering i PMP. Jag skulle gärna höra mer om rollen om den fortfarande är öppen. Mitt CV finns på min profil. Tack på förhand!"

## Checklista: LinkedIn-profilen

Gå igenom och bocka av:

**Grundläggande:**
- Professionell profilbild
- Bakgrundsbild uppladdad
- Optimerad rubrik med nyckelord
- Ifylld Om-sektion

**Erfarenhet:**
- Alla relevanta jobb listade
- Resultat beskrivna (inte bara uppgifter)
- Media bifogat (presentationer, certifikat)

**Kompetenser:**
- 50 kompetenser listade
- Topp 3 prioriterade
- Endorsements inhämtade

**Trovärdighet:**
- Minst 2-3 rekommendationer
- Utbildningar och certifieringar listade
- Korrekt kontaktinformation

**Synlighet:**
- "Open to Work" aktiverat (om lämpligt)
- 100+ kontakter
- Regelbunden aktivitet

## Kom ihåg

LinkedIn är inte Facebook – håll det professionellt men personligt. Visa att du är en människa med passion och personlighet, inte bara en lista med kompetenser! Rekryterare vill hitta riktiga människor, inte polerade robotar.

> **Tips:** Avsätt 15 minuter varje dag för LinkedIn-aktivitet. Konsistent närvaro slår sporadisk aktivitet varje gång!`,
    category: 'digital-presence',
    subcategory: 'linkedin',
    tags: ['LinkedIn', 'digital närvaro', 'nätverkande', 'digital profil', 'rekrytering', 'personligt varumärke'],
    createdAt: '2024-03-03T10:00:00Z',
    updatedAt: '2024-03-03T10:00:00Z',
    readingTime: 24,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['personligt-varumarke', 'natverka-for-jobb'],
    actions: [
      { label: '🔗 Gå till LinkedIn', href: 'https://www.linkedin.com', type: 'primary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'tackbrev-intervju',
    title: 'Skriv ett tackbrev efter intervjun',
    summary: 'Ett tackbrev kan vara det som skiljer dig från andra kandidater. Så här skriver du ett effektivt sådant.',
    content: `Ett tackbrev efter intervjun är en enkel men kraftfull gest som kan ge dig fördelar. Här är guiden till ett perfekt tackbrev.

## Varför skicka tackbrev?

✅ **Visar engagemang**
Du tar initiativ och visar intresse

✅ **Påminner om dig**
Rekryteraren har kanske träffat många kandidater

✅ **Chans att förstärka ett budskap**
Påminn om något du glömde nämna

✅ **Visar professionalism**
Det är gott affärsskick

## När ska du skicka det?

**Inom 24 timmar** efter intervjun. Helst samma dag.

## Hur ska du skicka det?

- **E-post** är vanligast och acceptabelt
- **LinkedIn-meddelande** om ni har kontakt där
- **Handskrivet brev** kan vara effektfullt för vissa roller

## Struktur på tackbrevet

### 1. Tydlig rubrik
"Tack för intervjun" eller "Tack för igår"

### 2. Personlig hälsning
"Hej [Namn],"

### 3. Tack för tiden
"Tack för att du tog dig tid att träffa mig idag."

### 4. Specificera något från intervjun
"Det var särskilt intressant att höra om ert arbete med..."

### 5. Bekräfta ditt intresse
"Efter vårt samtal är jag ännu mer övertygad om att..."

### 6. Avsluta positivt
"Jag ser fram emot att höra från er."

### 7. Vänlig hälsning
"Med vänliga hälsningar, [Ditt namn]"

## Exempel på ett bra tackbrev

*Hej Anna,*

*Tack för att du tog dig tid att träffa mig idag och berätta mer om rollen som kundtjänstmedarbetare på Företag AB.*

*Det var särskilt intressant att höra om hur ni arbetar med kundnöjdhet och de nya initiativen för att förbättra kundupplevelsen. Jag blev verkligen inspirerad av er kundcentrerade approach.*

*Efter vårt samtal är jag ännu mer övertygad om att min erfarenhet av kundservice och min passion för att hjälpa människor skulle passa perfekt in i ert team.*

*Jag ser fram emot att höra från er.*

*Med vänliga hälsningar,*
*Maria Svensson*

## Vanliga misstag

❌ **Generiskt brev** som kunde skickats till vem som helst
❌ **För långt** – max 5-6 meningar
❌ **Att be om jobbet** igen – det har du redan gjort
❌ **Att påminna om svagheter** – fokusera på det positiva

## När du inte har kontaktinfo

Skicka till den som bokade intervjun och be dem vidarebefordra, eller skicka via LinkedIn.

## Kom ihåg

Ett tackbrev tar 10 minuter att skriva men kan göra skillnaden mellan att få jobbet eller inte!`,
    category: 'interview',
    subcategory: 'after-interview',
    tags: ['tackbrev', 'intervju', 'uppföljning', 'etikett', 'kommunikation'],
    createdAt: '2024-03-04T10:00:00Z',
    updatedAt: '2024-03-04T10:00:00Z',
    readingTime: 10,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['intervju-forberedelser', 'digital-intervju'],
    author: 'Sara Ekström',
    authorTitle: 'Rekryterare',
  },

  {
    id: 'praktik-som-vag-in',
    title: 'Praktik som väg in i arbetslivet',
    summary: 'Hur du hittar, söker och maximerar praktik för att få foten innanför dörren.',
    content: `Praktik är ett av de mest effektiva sätten att få erfarenhet, bygga nätverk och ofta leder det till anställning. Så här gör du.

## Typer av praktik

### Arbetsprövning
- Från Arbetsförmedlingen
- Du behåller din ersättning
- Syfte: testa om jobbet passar

### Praktik via skola/utbildning
- Ofta en del av utbildningen
- Ger studiepoäng
- LIA (Lärande i arbete)

### Volontärpraktik
- Ideella organisationer
- Ger erfarenhet och referenser
- Ofta mer flexibel

### Egen praktik
- Du tar initiativ själv
- Kontakta företag direkt
- Kan vara kortare perioder

## Fördelar med praktik

✅ **Få erfarenhet att skriva i CV:t**
✅ **Bygga nätverk**
✅ **Testa om yrket passar dig**
✅ **Visa vad du kan på riktigt**
✅ **Potentiell väg till anställning**

## Så hittar du praktikplatser

1. **Arbetsförmedlingen** – be om arbetsprövning
2. **Skolan** – prata med studievägledare
3. **Kontakta företag direkt** – skicka spontanansökan
4. **Praktikplatser.se** och liknande sajter
5. **Ditt nätverk** – fråga vänner och familj

## Så söker du praktik

### I din ansökan, betona:
- Din motivation att lära
- Vad du vill uppnå
- Vad du kan erbjuda (även om det är grundläggande)
- Att du är pålitlig och engagerad

### Under praktiken:
- **Var nyfiken och ställ frågor**
- **Ta initiativ** – fråga "kan jag hjälpa till med...?"
- **Var punktlig och pålitlig**
- **Nätverka** – lär känna människor
- **Dokumentera** vad du gör för CV:t

## Få praktiken att leda till jobb

1. **Be om ett avslutningssamtal** med handledaren
2. **Be om referens** eller rekommendationsbrev
3. **Fråga om det finns möjlighet till anställning**
4. **Håll kontakten** efter praktiken

## Om praktiken inte är som du tänkt dig

Det är okej att avbryta om:
- Du inte lär dig något
- Miljön är skadlig
- Du blir utnyttjad

Prata med din handledare eller Arbetsförmedlingen.

## Kom ihåg

Praktik är en investering i dig själv. Även om det inte leder till jobb direkt, får du ovärderlig erfarenhet och kontakter!`,
    category: 'job-market',
    subcategory: 'career-change',
    tags: ['praktik', 'arbetsprövning', 'erfarenhet', 'nätverkande', 'väg in'],
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['nystartsjobb-guide', 'branscher-brist'],
    actions: [
      { label: '📅 Boka möte för praktik', href: '/diary', type: 'primary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'arbetsmiljo-guide',
    title: 'Förstå din framtida arbetsmiljö',
    summary: 'Vikten av att välja rätt arbetsmiljö och vad du ska leta efter innan du accepterar ett jobb.',
    content: `Arbetsmiljön påverkar din hälsa, trivsel och prestation mer än du kanske tror. Så här utvärderar du en arbetsmiljö innan du säger ja.

## Olika typer av arbetsmiljöer

### Fysisk arbetsmiljö
- Kontor, lager, ute, kundlokal
- Ljus, luft, ljudnivå
- Ergonomi och utrustning

### Psykosocial arbetsmiljö
- Stämning och kultur
- Ledarskap och kommunikation
- Krav och kontroll
- Socialt stöd från kollegor

### Digital arbetsmiljö
- Verktyg och system
- Distansarbete vs på plats
- Flexibilitet

## Röda flaggor att se upp för

⚠️ **Under intervjun:**
- Chefen pratar illa om tidigare anställda
- Hög omsättning av personal
- Otydliga arbetsuppgifter
- "Vi är som en familj" (kan betyda gränser suddas ut)
- Ingen möjlighet att träffa framtida kollegor

⚠️ **I fysiska miljön:**
- Stökigt och oorganiserat
- Ingen plats för pauser
- Dålig belysning eller ventilation

## Gröna flaggor – bra tecken

✅ **Öppen kommunikation**
✅ **Tydliga förväntningar**
✅ **Möjlighet till utveckling**
✅ **Bra arbetsplatskultur**
✅ **Hänsyn till work-life balance**

## Frågor att ställa i intervjun

**Om arbetsmiljön:**
- "Hur skulle ni beskriva arbetsplatskulturen?"
- "Vad uppskattar ni mest med att jobba här?"

**Om stöd:**
- "Vilken introduktion får nya medarbetare?"
- "Hur fungerar samarbetet i teamet?"

**Om förväntningar:**
- "Hur ser en typisk arbetsvecka ut?"
- "Hur hanteras övertid?"

## Testa arbetsplatsen

Om möjligt:
- Be om en prova-på-dag
- Fråga om du kan prata med en blivande kollega
- Läs på Google Reviews eller LinkedIn

## Dina rättigheter

Arbetsgivaren är skyldig att:
- Bedöma risker i arbetsmiljön
- Vidta åtgärder för att undvika ohälsa
- Ge information om arbetsmiljön

## Kom ihåg

Du ska inte bara sälja dig själv – du ska också utvärdera om arbetsplatsen passar dig. Det är en dubbelriktad process!

En bra arbetsmiljö är inte lyx – det är en förutsättning för att du ska må bra och prestera.`,
    category: 'job-market',
    subcategory: 'work-environment',
    tags: ['arbetsmiljö', 'trivsel', 'hälsa', 'val av arbete', 'röda flaggor'],
    createdAt: '2024-03-06T10:00:00Z',
    updatedAt: '2024-03-06T10:00:00Z',
    readingTime: 12,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['rattigheter-stod', 'anstallningsformer'],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'kompetensportfolj',
    title: 'Bygg en kompetensportfölj som imponerar',
    summary: 'Gå utöver CV:t och skapa en visuell portfölj som visar vad du kan på riktigt.',
    content: `Ett CV berättar vad du kan. En kompetensportfölj visar det. I dagens konkurrensutsatta arbetsmarknad kan en portfölj ge dig avgörande fördelar.

## Vad är en kompetensportfölj?

En samling som visar konkreta bevis på vad du kan:
- Arbetsprover
- Projektbeskrivningar
- Certifikat och betyg
- Rekommendationer
- Reflektioner

## För vem passar en portfölj?

**Särskilt användbart för:**
- Kreativa yrken (design, skrivande, foto)
- Praktiska yrken (bygg, hantverk)
- Projektledare
- Utvecklare
- Marknadsförare

**Men alla kan ha nytta av det!**

## Så bygger du din portfölj

### 1. Välj format
- **Digital:** Behance, LinkedIn, egen hemsida, PDF
- **Fysisk:** Mapp med prover (vissa branscher)

### 2. Välj innehåll

**Arbetsprover:**
- Välj 3-5 starka exempel
- Variera för att visa bredd
- Inkludera kontext (vad, när, hur)

**Projektbeskrivningar:**
- Vad var uppdraget?
- Vad gjorde du?
- Vad blev resultatet?
- Vad lärde du dig?

**Certifikat och utbildning:**
- Skanna in viktiga dokument
- Inkludera kursinnehåll om relevant

**Rekommendationer:**
- Be om skriftliga rekommendationer
- Lägg till LinkedIn-rekommendationer

### 3. Strukturera tydligt

- Tydlig navigering
- Kategorisera efter kompetens eller projekt
- Kort beskrivning till varje exempel
- Kontaktinformation synlig

## Exempel på innehåll efter yrke

**Kundtjänst:**
- Exempel på kundlösningar (anonymiserade)
- Utbildningscertifikat
- Feedback från kunder

**Projektledare:**
- Projektplaner
- Resultat och mätningar
- Rekommendationer från team

**Utvecklare:**
- Länkar till projekt på GitHub
- Kodexempel
- Teknisk dokumentation

**Säljare:**
- Siffror på försäljningsresultat
- Utmärkelser
- Kundcase

## Tips för framgång

✅ **Kvalitet före kvantitet** – hellre få starka exempel
✅ **Håll det uppdaterat** – ta bort gamla projekt
✅ **Be om feedback** – låt någon granska innan du skickar
✅ **Anpassa för varje ansökan** – välj relevanta exempel

## Kom ihåg

En portfölj är inte bara för kreativa yrken. Alla kan dra nytta av att visa konkreta bevis på sina färdigheter. Det särskiljer dig från andra kandidater!`,
    category: 'job-search',
    subcategory: 'portfolio',
    tags: ['portfölj', 'kompetens', 'arbetsprover', 'bevis', 'kreativt CV'],
    createdAt: '2024-03-07T10:00:00Z',
    updatedAt: '2024-03-07T10:00:00Z',
    readingTime: 14,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'linkedin-optimering'],
    relatedExercises: ['cv-masterclass'],
  },

  // === SJÄLVKÄNNEDOM (nya artiklar) ===
  {
    id: 'upptack-dina-styrkor',
    title: 'Upptäck och använd dina styrkor',
    summary: 'Lär dig identifiera dina naturliga talanger och hur du kan använda dem i arbetslivet.',
    content: `Att känna till sina styrkor är grunden för en framgångsrik karriär. När du vet vad du är bra på kan du göra medvetna val som leder till större trivsel och framgång.

## Vad är styrkor?

Styrkor är inte bara saker du kan göra – de är saker du gör bra OCH som ger dig energi. Det som gör dig stark!

### Skillnaden mellan styrkor och kompetenser

- **Kompetenser** är saker du lärt dig göra (t.ex. köra bil, använda Excel)
- **Styrkor** är naturliga talanger som ger dig energi (t.ex. att organisera, lösa problem, motivera andra)

Du kan vara kompetent på något utan att det är en styrka – och tvärtom!

### Varför är det viktigt att känna till sina styrkor?

- **Jobbsökning:** Du kan rikta in dig på rätt roller
- **Intervjuer:** Du kan prata om dig själv med självförtroende
- **Arbetsliv:** Du presterar bättre och trivs mer
- **Utveckling:** Du vet var du ska lägga din energi
- **Motivation:** Du förstår vad som driver dig

## Hur hittar du dina styrkor?

### 1. Se tillbaka på framgångar
Tänk på situationer där du:
- Kände dig engagerad och i flow
- Fick beröm från andra
- Åstadkom resultat med mindre ansträngning än andra
- Tappade begreppet om tid för att du var så fokuserad

### 2. Fråga andra
Be 3-5 personer som känner dig att svara på:
- "Vad tycker du att jag är bra på?"
- "När ser du att jag är som mest engagerad?"
- "Vilka av mina egenskaper uppskattar du mest?"

### 3. Notera vad som ger dig energi
Under en vecka, notera:
- Vilka uppgifter ger dig energi?
- Vilka uppgifter dränerar dig?
- När känner du dig mest "du själv"?

### 4. Gör övningen
I övningsmodulen hittar du en strukturerad övning för att kartlägga dina styrkor.

## Övning 1: Framgångshistorier

**Syfte:** Identifiera styrkor genom att analysera dina framgångar.

**Instruktioner:**
1. Tänk på 3 situationer i ditt liv där du kände dig framgångsrik
2. De behöver inte vara stora – det kan vara allt från ett skolprojekt till en hobby

**För varje situation, svara på:**

**Situation 1:**
- Vad gjorde du? _________________________________
- Vilka utmaningar mötte du? _________________________________
- Hur löste du dem? _________________________________
- Vad kände du efteråt? _________________________________
- Vilka styrkor använde du? _________________________________

**Situation 2:**
- Vad gjorde du? _________________________________
- Vilka utmaningar mötte du? _________________________________
- Hur löste du dem? _________________________________
- Vad kände du efteråt? _________________________________
- Vilka styrkor använde du? _________________________________

**Situation 3:**
- Vad gjorde du? _________________________________
- Vilka utmaningar mötte du? _________________________________
- Hur löste du dem? _________________________________
- Vad kände du efteråt? _________________________________
- Vilka styrkor använde du? _________________________________

**Analys:** Vilka styrkor återkommer i alla tre situationerna?
_________________________________

## Övning 2: Energilogg

**Syfte:** Upptäck vad som ger respektive tar energi.

**Instruktioner:** Under en vecka, skriv ner varje dag:

| Dag | Aktivitet som gav energi | Aktivitet som tog energi |
|-----|-------------------------|-------------------------|
| Måndag | | |
| Tisdag | | |
| Onsdag | | |
| Torsdag | | |
| Fredag | | |
| Lördag | | |
| Söndag | | |

**Analys efter veckan:**
- Vilka mönster ser du? _________________________________
- Vad säger det om dina styrkor? _________________________________

## Övning 3: Feedback från andra

**Syfte:** Få extern bekräftelse på dina styrkor.

**Instruktioner:**
1. Skicka detta meddelande till 5 personer som känner dig:

"Hej! Jag jobbar med att identifiera mina styrkor och skulle uppskatta din hjälp. Kan du svara på dessa tre frågor?
1. Vad tycker du att jag är bra på?
2. När har du sett mig vara som mest engagerad?
3. Om du skulle rekommendera mig för ett jobb, vad skulle du säga?"

2. Sammanställ svaren och leta efter mönster

**Sammanställning:**

| Person | Styrkor de nämner |
|--------|-------------------|
| 1. | |
| 2. | |
| 3. | |
| 4. | |
| 5. | |

**Återkommande teman:** _________________________________

## Övning 4: Styrkekartan

**Syfte:** Skapa en visuell bild av dina styrkor.

**Instruktioner:**
1. Lista alla styrkor du identifierat i tidigare övningar
2. Kategorisera dem i grupper
3. Rangordna inom varje grupp

**Min styrkekarta:**

**Topp 3 sociala styrkor:**
1. _________________________________
2. _________________________________
3. _________________________________

**Topp 3 intellektuella styrkor:**
1. _________________________________
2. _________________________________
3. _________________________________

**Topp 3 praktiska styrkor:**
1. _________________________________
2. _________________________________
3. _________________________________

**Topp 3 kreativa styrkor:**
1. _________________________________
2. _________________________________
3. _________________________________

**Mina topp 5 styrkor övergripande:**
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

## Vanliga styrkeområden

**Sociala styrkor:**
- Att bygga relationer och skapa förtroende
- Att kommunicera tydligt och övertygande
- Att samarbeta och få grupper att fungera
- Att förstå andras perspektiv och behov
- Att lösa konflikter och medla
- Att inspirera och motivera andra

**Intellektuella styrkor:**
- Att analysera komplex information
- Att tänka strategiskt och se mönster
- Att lära sig snabbt och anpassa sig
- Att lösa problem kreativt
- Att se helheten och koppla samman delar
- Att fatta beslut baserade på fakta

**Praktiska styrkor:**
- Att organisera och skapa struktur
- Att planera och hålla deadlines
- Att vara noggrann och detaljorienterad
- Att genomföra och slutföra uppgifter
- Att hantera flera projekt samtidigt
- Att förbättra processer och system

**Kreativa styrkor:**
- Att hitta nya lösningar och idéer
- Att tänka utanför boxen
- Att se möjligheter andra missar
- Att visualisera och inspirera
- Att experimentera och ta risker
- Att anpassa sig till nya situationer

## Konkreta exempel på styrkor i arbetslivet

| Styrka | Hur det visar sig | Passande roller |
|--------|-------------------|-----------------|
| Organisering | Du älskar att skapa ordning och system | Projektledare, administratör, eventplanerare |
| Empati | Du förstår snabbt hur andra mår | Vårdyrken, HR, kundservice, coach |
| Analys | Du ser mönster i data och information | Analytiker, revisor, forskare, utredare |
| Kommunikation | Du förklarar komplexa saker enkelt | Lärare, säljare, journalist, kommunikatör |
| Problemlösning | Du hittar lösningar där andra ser hinder | Konsult, utvecklare, tekniker, ingenjör |
| Ledarskap | Du får andra att prestera sitt bästa | Chef, teamledare, tränare, mentor |
| Kreativitet | Du genererar nya idéer konstant | Designer, marknadsförare, produktutvecklare |
| Uthållighet | Du ger aldrig upp | Säljare, forskare, entreprenör |

## Så pratar du om dina styrkor i intervjun

### Vanliga intervjufrågor om styrkor

**"Vad är dina största styrkor?"**

**Struktur för svaret:**
1. Nämn styrkan
2. Ge ett konkret exempel (STAR-metoden)
3. Koppla till rollen du söker

**Exempel:**
"En av mina största styrkor är att organisera och skapa struktur. I mitt förra jobb fick jag i uppdrag att effektivisera vår dokumenthantering. Jag kartlade problemet, skapade ett nytt system och utbildade kollegorna. Resultatet blev 30% snabbare åtkomst till dokument. Jag förstår att organisation är viktigt i den här rollen, så jag tror att denna styrka skulle vara värdefull."

**"Berätta om en situation där du använde dina styrkor"**

**Använd STAR-metoden:**
- **S**ituation: Beskriv kontexten
- **T**ask: Vad var din uppgift?
- **A**ction: Vad gjorde du?
- **R**esult: Vad blev resultatet?

**Exempel:**
"**Situation:** På mitt förra jobb hade vi problem med kommunikationen mellan avdelningarna.
**Task:** Min chef bad mig ta tag i problemet.
**Action:** Jag använde min styrka inom relationsskapande för att prata med varje avdelning, förstå deras perspektiv och sedan arrangera gemensamma möten.
**Result:** Inom tre månader hade vi förbättrat samarbetet markant och projekten levererades snabbare."

### Formuleringar för olika styrkor

| Styrka | Hur du kan uttrycka det |
|--------|------------------------|
| Organisering | "Jag trivs med att skapa ordning och struktur i kaotiska situationer" |
| Kommunikation | "Jag har förmågan att förklara komplexa saker på ett begripligt sätt" |
| Problemlösning | "Jag ser utmaningar som pussel att lösa snarare än hinder" |
| Empati | "Jag förstår snabbt andras perspektiv och behov" |
| Ledarskap | "Jag inspireras av att hjälpa andra nå sin potential" |
| Analys | "Jag ser mönster och samband som andra kanske missar" |
| Kreativitet | "Jag hittar ofta oväntade lösningar på problem" |
| Uthållighet | "Jag ger inte upp även när det blir tufft" |

### Undvik dessa misstag

- **Vara för blygsam:** "Jag är väl okej på kommunikation..."
- **Vara för allmän:** "Jag är bra på allt!"
- **Sakna exempel:** "Jag är en problemlösare" (utan att visa det)
- **Irrelevanta styrkor:** Nämna styrkor som inte passar rollen
- **Övertygande utan bevis:** Påstå utan att backa upp

## Styrka-till-karriär-matchning

### Hitta rätt karriär för dina styrkor

**Om du har starka sociala styrkor:**

| Styrka | Passande karriärvägar |
|--------|----------------------|
| Relationsskapande | Säljare, HR, rekryterare, nätverkare |
| Kommunikation | Kommunikatör, PR, journalist, lärare |
| Empati | Vårdyrken, psykolog, coach, kundservice |
| Konfliktlösning | Medlare, HR, teamledare, jurist |
| Ledarskap | Chef, projektledare, entreprenör |

**Om du har starka intellektuella styrkor:**

| Styrka | Passande karriärvägar |
|--------|----------------------|
| Analys | Dataanalytiker, controller, forskare |
| Strategiskt tänkande | Konsult, affärsutvecklare, chef |
| Inlärning | Utbildare, researcher, specialist |
| Problemlösning | Ingenjör, utvecklare, tekniker |
| Beslutsamhet | Ledare, projektledare, entreprenör |

**Om du har starka praktiska styrkor:**

| Styrka | Passande karriärvägar |
|--------|----------------------|
| Organisering | Administratör, projektledare, planerare |
| Noggrannhet | Revisor, kvalitetskontrollant, redaktör |
| Genomförande | Projektledare, koordinator, producent |
| Processförbättring | Verksamhetsutvecklare, konsult |
| Multitasking | Assistent, eventplanerare, koordinator |

**Om du har starka kreativa styrkor:**

| Styrka | Passande karriärvägar |
|--------|----------------------|
| Idégenerering | Innovationsarbete, produktutveckling, reklam |
| Visualisering | Designer, arkitekt, art director |
| Experimenterande | Entreprenör, forskare, utvecklare |
| Flexibilitet | Konsult, startup-medarbetare, frilans |
| Storytelling | Copywriter, content creator, journalist |

## Vanliga misstag

- Att förväxla vad du KAN med vad som GER DIG ENERGI
- Att underskatta vardagliga styrkor
- Att jämföra dig med andra istället för att hitta ditt unika
- Att inte be om feedback från andra
- Att ignorera styrkor för att de "inte räknas" i arbetslivet
- Att bara fokusera på att förbättra svagheter

## Din styrkebaserade handlingsplan

**Steg 1:** Genomför övningarna ovan och identifiera dina topp 5 styrkor

**Steg 2:** Undersök vilka roller som matchar dina styrkor

**Steg 3:** Uppdatera ditt CV och LinkedIn med styrkefokuserade formuleringar

**Steg 4:** Förbered STAR-berättelser för dina topp styrkor

**Steg 5:** Sök jobb där du får använda dina styrkor dagligen

## Kom ihåg

Dina styrkor är unika för dig. När du jobbar med dem känns det inte som jobb – det känns som att vara dig själv! Det bästa jobbet är ett där du får använda dina styrkor varje dag.

**Nästa steg:** Gör övningen "Dina starkaste egenskaper" för att få en komplett bild av dina styrkor!`,
    category: 'self-awareness',
    subcategory: 'strengths',
    tags: ['styrkor', 'självkännedom', 'talanger', 'personlig utveckling', 'intervju', 'karriärmatchning', 'STAR-metoden'],
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    readingTime: 18,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['kompetensinventering-guide', 'hitta-ratt-yrke'],
    relatedExercises: ['strengths', 'kompetensinventering'],
    actions: [
      { label: '💪 Gör övningen: Dina starkaste egenskaper', href: '/exercises', type: 'primary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'personlighetstyper-i-arbetslivet',
    title: 'Personlighetstyper i arbetslivet – hitta din profil',
    summary: 'Lär dig om olika personlighetstyper och vilka yrken som passar bäst för varje typ.',
    content: `Att förstå sin personlighetstyp kan ge ovärderliga insikter om vilka yrken och arbetsmiljöer som passar dig bäst. Denna guide hjälper dig identifiera din typ och hitta rätt karriärväg.

## Vad är personlighetstyper?

Personlighetstyper är ett sätt att kategorisera hur vi föredrar att arbeta, tänka och interagera. Det finns ingen "bästa" typ – alla behövs på arbetsmarknaden!

### Varför är det användbart?
- Hjälper dig välja rätt yrke
- Förklarar varför vissa jobb känns naturliga
- Ger insikt i dina styrkor
- Underlättar samarbete med andra typer

## De sex personlighetstyperna (RIASEC)

Denna modell, även kallad Holland-koden, används av Arbetsförmedlingen och karriärvägledare världen över.

### 1. Realistisk (R) – Den praktiska

**Så känner du igen dig:**
- Du föredrar att GÖRA saker framför att prata om dem
- Du gillar konkreta resultat du kan se och ta på
- Du trivs med verktyg, maskiner eller att vara utomhus
- Du löser problem genom att prova praktiskt

**Styrkor:**
- Händig och teknisk
- Uthållig och fokuserad
- Självständig
- Jordnära och realistisk

**Arbetsmiljö du trivs i:**
- Verkstad, byggarbetsplats, utomhus
- Tydliga uppgifter och mål
- Möjlighet att se konkreta resultat
- Begränsat med möten och administration

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Elektriker | Installation och reparation av elsystem |
| Snickare/Byggarbetare | Bygga och renovera |
| Mekaniker | Reparation av fordon och maskiner |
| Kock | Matlagning och köksarbete |
| Trädgårdsmästare | Skötsel av växter och utemiljöer |
| Lastbilschaufför | Transport av gods |
| Undersköterska | Praktisk vård och omsorg |

### 2. Investigativ (I) – Den analytiska

**Så känner du igen dig:**
- Du älskar att förstå HUR och VARFÖR saker fungerar
- Du föredrar att tänka före du handlar
- Du gillar att fördjupa dig i komplexa problem
- Du är nyfiken och ifrågasättande

**Styrkor:**
- Analytisk och logisk
- Noggrann och detaljorienterad
- Självständig tänkare
- Bra på research

**Arbetsmiljö du trivs i:**
- Lugn miljö för koncentration
- Tillgång till information och data
- Möjlighet att specialisera dig
- Intellektuell stimulans

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Programmerare | Utveckling av mjukvara |
| Dataanalytiker | Analys av data och statistik |
| Forskare | Vetenskapliga studier |
| Ingenjör | Teknisk problemlösning |
| Ekonom | Finansiell analys |
| Läkare | Medicinsk diagnostik |
| Laboratorieassistent | Tester och analyser |

### 3. Artistisk (A) – Den kreativa

**Så känner du igen dig:**
- Du behöver uttrycka dig kreativt
- Du ogillar rutiner och strikta regler
- Du ser möjligheter där andra ser problem
- Du dras till estetik och design

**Styrkor:**
- Kreativ och innovativ
- Uttrycksfull och kommunikativ
- Flexibel och anpassningsbar
- Originell och nytänkande

**Arbetsmiljö du trivs i:**
- Frihet och flexibilitet
- Möjlighet till kreativt uttryck
- Variation i arbetsuppgifter
- Inspirerande och estetisk miljö

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Grafisk designer | Visuell kommunikation |
| Fotograf | Bildberättande |
| Skribent/Copywriter | Textproduktion |
| Arkitekt | Design av byggnader |
| Marknadsförare | Kreativa kampanjer |
| Inredare | Rumsdesign |
| Musiker/Artist | Konstnärligt skapande |

### 4. Social (S) – Den hjälpsamma

**Så känner du igen dig:**
- Du får energi av att hjälpa andra
- Du är en naturlig lyssnare
- Du trivs i grupp och samarbete
- Du vill göra skillnad för människor

**Styrkor:**
- Empatisk och förstående
- Kommunikativ och pedagogisk
- Samarbetsinriktad
- Tålmodig och stöttande

**Arbetsmiljö du trivs i:**
- Mycket mänsklig kontakt
- Teamarbete och samarbete
- Meningsfullt arbete
- Möjlighet att se andras utveckling

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Lärare | Undervisning och pedagogik |
| Sjuksköterska | Vård och omsorg |
| Kurator/Socionom | Socialt stödarbete |
| HR-specialist | Personalfrågor |
| Coach | Personlig utveckling |
| Kundtjänst | Kundservice och support |
| Fritidsledare | Aktiviteter för barn/unga |

### 5. Entreprenöriell (E) – Den ledande

**Så känner du igen dig:**
- Du tar gärna initiativ och leder
- Du gillar att övertyga och påverka
- Du trivs med att ta beslut
- Du drivs av mål och resultat

**Styrkor:**
- Beslutssam och handlingskraftig
- Övertalande och karismatisk
- Riskvillig och ambitiös
- Energisk och entusiastisk

**Arbetsmiljö du trivs i:**
- Ledarposition eller eget ansvar
- Mål och bonusar
- Dynamisk och föränderlig
- Möjlighet att påverka

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Säljare | Försäljning och kundrelationer |
| Chef/Ledare | Ledarskap och management |
| Egenföretagare | Driva eget |
| Projektledare | Leda projekt |
| Mäklare | Förmedling och förhandling |
| Rekryterare | Hitta och övertyga talanger |
| Eventkoordinator | Planera och genomföra event |

### 6. Konventionell (C) – Den strukturerade

**Så känner du igen dig:**
- Du gillar ordning, system och rutiner
- Du är noggrann och detaljorienterad
- Du föredrar tydliga instruktioner
- Du trivs med administrativa uppgifter

**Styrkor:**
- Organiserad och systematisk
- Pålitlig och noggrann
- Effektiv och disciplinerad
- Bra på att följa processer

**Arbetsmiljö du trivs i:**
- Tydlig struktur och regler
- Förutsägbara uppgifter
- Lugn kontorsmiljö
- Möjlighet att specialisera dig

**Passande yrken:**
| Yrke | Beskrivning |
|------|-------------|
| Redovisningsekonom | Bokföring och redovisning |
| Administratör | Kontorsadministration |
| Lönehandläggare | Lönehantering |
| Bankman | Finansiella tjänster |
| Sekreterare | Administrativt stöd |
| Kvalitetskontrollant | Granska och säkerställa |
| Arkivarie | Dokumenthantering |

## Hitta din kombination

De flesta har 2-3 dominerande typer. Din unika kombination kallas din "Holland-kod".

### Exempel på kombinationer:
- **RI (Realistisk-Investigativ):** Ingenjör, tekniker
- **AS (Artistisk-Social):** Terapeut med konstinriktning, dramapedagog
- **EC (Entreprenöriell-Konventionell):** Bankchef, försäljningschef
- **SI (Social-Investigativ):** Läkare, psykolog
- **RA (Realistisk-Artistisk):** Möbelsnickare, blomsterdekoratör

### Hur hittar du din kod?
1. Läs igenom alla sex typer
2. Välj de 2-3 som passar dig bäst
3. Rangordna dem (primär, sekundär, tertiär)
4. Sök på yrken som matchar din kombination

## Använd kunskapen i jobbsökningen

### I CV:t
Lyft fram erfarenheter som matchar din typ:
- Realistisk: Praktiska projekt och tekniska färdigheter
- Social: Teamarbete och kundkontakt

### I intervjun
Förklara varför du passar för rollen utifrån din personlighet:
- "Jag trivs bäst när jag får lösa konkreta problem"
- "Det som driver mig är att hjälpa andra lyckas"

### Vid val av jobb
Använd din kod för att filtrera jobbmöjligheter:
- Matchar arbetsuppgifterna min typ?
- Passar arbetsmiljön min stil?

## Kom ihåg

- Ingen typ är bättre än en annan
- Du är mer än en bokstav – se hela bilden
- Typer kan förändras över tid
- Använd detta som vägledning, inte begränsning

Arbetslivet behöver alla typer för att fungera!`,
    category: 'self-awareness',
    subcategory: 'personality',
    tags: ['personlighetstyper', 'yrkesval', 'jobb-jag', 'realistisk', 'analytisk', 'social', 'kreativ'],
    createdAt: '2024-03-11T10:00:00Z',
    updatedAt: '2024-03-11T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['upptack-dina-styrkor', 'intresseguide-intro'],
    relatedExercises: ['jobb-jag'],
    actions: [
      { label: '🎯 Gör övningen: Hitta ditt jobb-jag', href: '/exercises', type: 'primary' },
      { label: '🔍 Gör intresseguiden', href: '/interest-guide', type: 'secondary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'kompetensinventering-guide',
    title: 'Kompetensinventering – kartlägg allt du kan',
    summary: 'En guide för att identifiera alla dina kompetenser – formella, praktiska och personliga.',
    content: `Många underskattar vad de kan. Denna guide hjälper dig att kartlägga alla dina kompetenser så du kan visa ditt fulla värde för arbetsgivare.

## Varför göra en kompetensinventering?

- Du blir medveten om allt du faktiskt kan
- Du hittar kompetenser du glömt bort
- Du får material till CV och intervjuer
- Du ser vilka områden du kan utveckla
- Du ökar ditt självförtroende

## Tre typer av kompetenser

### 1. Formella kompetenser
Dokumenterade kvalifikationer:
- Utbildningar och examina
- Certifieringar och behörigheter
- Körkort och truckkort
- Språkcertifikat
- Yrkesbevis

### 2. Praktiska kompetenser
Färdigheter du lärt dig genom erfarenhet:
- Yrkesspecifika färdigheter
- Verktyg och system du kan använda
- Metoder och processer du behärskar
- Tekniska färdigheter

### 3. Personliga kompetenser (mjuka färdigheter)
Dina egenskaper och hur du arbetar:
- Kommunikationsförmåga
- Samarbetsförmåga
- Ledarskap
- Problemlösning
- Kreativitet

## Steg-för-steg: Gör din inventering

### Steg 1: Lista all formell utbildning

**Gå igenom:**
- Gymnasieutbildning
- Högskola/universitet
- Yrkesutbildningar
- Komvux och folkhögskola
- Kortare kurser och utbildningar
- Arbetsgivarens interna utbildningar
- Onlinekurser och certifieringar

**Skriv ner:**
| Utbildning | År | Vad lärde jag mig? |
|------------|----|--------------------|
| Gymnasium, Ekonomi | 2015 | Bokföring, Excel, företagsekonomi |
| Excelkurs via jobbet | 2019 | Avancerade formler, pivot-tabeller |

### Steg 2: Dokumentera all arbetslivserfarenhet

**Tänk brett – inkludera:**
- Alla anställningar (även korta)
- Praktikplatser
- Sommarjobb
- Extraknäck
- Ideellt arbete
- Styrelseuppdrag
- Familjeföretag

**För varje erfarenhet, fråga dig:**
- Vilka arbetsuppgifter hade jag?
- Vilka verktyg/system använde jag?
- Vad lärde jag mig?
- Vilka resultat uppnådde jag?

**Exempel:**
| Jobb | Uppgifter | Kompetenser |
|------|-----------|-------------|
| Kassör på ICA | Kassa, påfyllning, kundservice | Kassasystem, kundhantering, stresshantering |
| Fotbollstränare | Träningar, matcher, föräldrakontakt | Ledarskap, planering, kommunikation |

### Steg 3: Identifiera dolda erfarenheter

Vardagliga aktiviteter som ger värdefull kompetens:

**Hemma och privat:**
- Renoverat hemma → Projektledning, hantverk
- Skött familjens ekonomi → Budgetering, ekonomiförståelse
- Organiserat fester/bröllop → Eventplanering, koordinering
- Tagit hand om sjuk anhörig → Omsorg, tålamod, problemlösning

**Fritid och ideellt:**
- Styrelsearbete i förening → Administration, beslutsfattande
- Tränare/ledare → Ledarskap, pedagogik
- Bloggat/sociala medier → Content, marknadsföring
- Spelat i band → Samarbete, kreativitet

**Resor och livserfarenhet:**
- Bott utomlands → Språk, kulturell förståelse, anpassningsförmåga
- Rest själv → Självständighet, problemlösning
- Invandrat till Sverige → Resiliens, språkinlärning, anpassning

### Steg 4: Identifiera dina personliga styrkor

**Fråga dig själv:**
- Vad kommer naturligt för mig?
- Vad ber andra mig om hjälp med?
- Vad får jag ofta beröm för?
- Vad gör jag utan att det känns ansträngande?

**Vanliga personliga kompetenser:**

| Kompetens | Exempel på hur det visar sig |
|-----------|------------------------------|
| Kommunikation | Förklarar saker tydligt, lyssnar aktivt |
| Samarbete | Fungerar bra i grupp, löser konflikter |
| Problemlösning | Hittar lösningar, tänker kreativt |
| Organisation | Håller ordning, planerar effektivt |
| Ledarskap | Tar initiativ, motiverar andra |
| Anpassningsförmåga | Hanterar förändring, lär sig snabbt |
| Noggrannhet | Gör få fel, dubbelkollar |
| Uthållighet | Ger inte upp, arbetar långsiktigt |

### Steg 5: Kategorisera och prioritera

Sortera dina kompetenser efter:

**Relevans för jobbet du söker:**
- Direkt relevanta (lyfts fram först i CV)
- Indirekt relevanta (kan nämnas)
- Mindre relevanta (utelämnas)

**Nivå:**
- Expert (kan lära andra)
- Erfaren (arbetar självständigt)
- Grundläggande (behöver viss vägledning)
- Nybörjare (behöver handledning)

## Sammanställ ditt kompetensdokument

Skapa ett dokument du kan använda som underlag:

**Mall:**

MINA KOMPETENSER

Formella kvalifikationer:
- [Utbildning 1]
- [Certifiering 1]
- [Körkort/behörigheter]

Yrkeskompetenser:
- [Kompetens 1] – [nivå] – [exempel]
- [Kompetens 2] – [nivå] – [exempel]

Verktyg och system:
- [System 1] – [nivå]
- [Verktyg 1] – [nivå]

Personliga styrkor:
- [Styrka 1] – [hur det visar sig]
- [Styrka 2] – [hur det visar sig]

Språk:
- [Språk 1] – [nivå]
- [Språk 2] – [nivå]

## Använd din inventering

### I CV:t
- Välj de mest relevanta kompetenserna för varje jobb
- Använd konkreta exempel och resultat
- Matcha ordval med jobbannonsen

### I personligt brev
- Lyft fram 2-3 nyckekompetenser
- Koppla dem till arbetsgivarens behov

### I intervjun
- Ha exempel redo för varje kompetens
- Använd STAR-metoden (Situation, Task, Action, Result)

## Vanliga misstag

- Att underskatta vardagliga kompetenser
- Att glömma bort gamla erfarenheter
- Att inte be andra om input
- Att bara fokusera på formella kvalifikationer

## Kom ihåg

Du kan mer än du tror! Ta dig tid att verkligen gräva i din bakgrund – du kommer bli positivt överraskad.`,
    category: 'self-awareness',
    subcategory: 'competencies',
    tags: ['kompetenser', 'kompetensinventering', 'CV', 'erfarenheter'],
    createdAt: '2024-03-12T10:00:00Z',
    updatedAt: '2024-03-12T10:00:00Z',
    readingTime: 11,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['upptack-dina-styrkor', 'cv-grunder'],
    relatedExercises: ['kompetensinventering'],
    actions: [
      { label: '📋 Gör övningen: Kompetensinventering', href: '/exercises', type: 'primary' },
    ],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'varderingar-i-arbetslivet',
    title: 'Hitta dina värderingar – nyckeln till rätt jobb',
    summary: 'Lär dig identifiera dina kärnvärderingar och hur de påverkar din trivsel i arbetslivet.',
    content: `Dina värderingar är de saker som är viktigast för dig i livet. När ditt jobb matchar dina värderingar trivs du bättre och presterar bättre.

## Vad är värderingar?

Värderingar är djupt rotade övertygelser om vad som är viktigt och meningsfullt. De styr våra beslut och påverkar hur vi mår.

### Skillnaden mellan värderingar och intressen
- **Intressen** är vad du tycker om att göra (t.ex. läsa, träna, resa)
- **Värderingar** är vad som är viktigt för dig (t.ex. frihet, rättvisa, kreativitet)

Du kan ha samma intresse som någon annan men helt olika värderingar!

## Vanliga arbetsvärderingar

### Ekonomiska värderingar
- Hög lön och ekonomisk trygghet
- Karriärmöjligheter och avancemang
- Förmåner och bonus

### Sociala värderingar
- Bra kollegor och teamwork
- Hjälpa andra människor
- Bidra till samhället

### Utvecklingsvärderingar
- Lärande och kompetensutveckling
- Utmaningar och variation
- Kreativt arbete

### Livsstilsvärderingar
- Work-life balance
- Flexibilitet och frihet
- Arbeta hemifrån

### Statusvärderingar
- Erkännande och respekt
- Inflytande och makt
- Prestige

## Hur hittar du dina värderingar?

### Övning 1: Topplistemetoden
Välj dina 5 viktigaste värderingar från denna lista:

| Värdering | Beskrivning |
|-----------|-------------|
| Trygghet | Fast anställning, förutsägbarhet |
| Frihet | Självständighet, flexibilitet |
| Kreativitet | Skapa nytt, innovation |
| Hjälpsamhet | Hjälpa andra, göra skillnad |
| Prestation | Nå mål, vara bäst |
| Balans | Tid för familj och fritid |
| Utveckling | Lära nytt, växa |
| Samarbete | Teamwork, gemenskap |
| Rättvisa | Likabehandling, etik |
| Status | Erkännande, position |

### Övning 2: Värderingskonflikter
Tänk på situationer där du känt dig frustrerad på jobbet. Vilken värdering blev kränkt?

**Exempel:**
- Frustrerad över övertid → Värdering: Balans
- Frustrerad över orättvis behandling → Värdering: Rättvisa
- Frustrerad över monotona uppgifter → Värdering: Utveckling

### Övning 3: Drömjobbet
Om du kunde designa ditt perfekta jobb utan begränsningar:
- Hur skulle arbetsmiljön se ut?
- Vilka uppgifter skulle du ha?
- Hur skulle dina kollegor vara?
- Vad skulle du bidra med?

Svaren avslöjar dina värderingar!

## Använda värderingar i jobbsökningen

### Vid jobbsökning
- Sök jobb hos företag vars värderingar matchar dina
- Läs "Om oss"-sidor och företagskultur-beskrivningar
- Researcha på Glassdoor och liknande sajter

### I intervjun
Ställ frågor som avslöjar företagets verkliga värderingar:
- "Hur firar ni framgångar här?"
- "Hur ser en typisk karriärväg ut?"
- "Hur hanterar ni work-life balance?"

### Vid beslut
Om du har flera erbjudanden, jämför hur väl varje jobb matchar dina topp 5 värderingar.

## Värderingskonflikter på jobbet

Om dina värderingar inte matchar arbetsplatsens kan det leda till:
- Låg motivation och energi
- Konflikter med kollegor eller chefer
- Känsla av att inte passa in
- Utmattning och stress

### Vad kan du göra?
1. **Identifiera konflikten** – Vilken värdering kränks?
2. **Utvärdera alternativen** – Kan situationen förändras?
3. **Kommunicera** – Kan du prata med din chef?
4. **Ta beslut** – Ibland är det rätt att byta jobb

## Kom ihåg

Det finns inga rätta eller fel värderingar. Dina värderingar är unika för dig, och det bästa jobbet är ett där du kan leva efter dem!`,
    category: 'self-awareness',
    subcategory: 'interests',
    tags: ['värderingar', 'självkännedom', 'arbetsvärderingar', 'trivsel', 'rätt jobb'],
    createdAt: '2024-04-05T10:00:00Z',
    updatedAt: '2024-04-05T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['upptack-dina-styrkor', 'personlighetstyper-i-arbetslivet', 'karriarplanering-guide'],
    relatedExercises: ['strengths'],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  // === NÄTVERKANDE (nya artiklar) ===
  {
    id: 'natverka-for-jobb',
    title: 'Nätverkande – din dolda jobbmarknad',
    summary: 'Lär dig hur du bygger och använder ett professionellt nätverk för att hitta dolda jobbmöjligheter.',
    content: `Upp till 70% av alla jobb tillsätts via nätverk. Att bygga relationer är inte bara bra – det är avgörande för din karriär.

## Vad är nätverkande?

Nätverkande är att bygga och underhålla relationer som kan vara ömsesidigt fördelaktiga. Det handlar inte om att använda människor, utan om att skapa genuina kontakter.

### Varför fungerar det?
- Arbetsgivare litar mer på rekommendationer än på ansökningar
- Många jobb utannonseras aldrig – de tillsätts internt
- Du får tillgång till information andra inte har
- Det ger dig ett försprång i rekryteringsprocessen
- Du lär dig om företagskultur innan du söker
- Du kan få tips om kommande tjänster innan de annonseras

## Din nätverksposition idag

Du har redan ett nätverk! Börja med att kartlägga:

### Nära nätverk
- Familj och vänner
- Grannar
- Tidigare klasskamrater
- Tidigare kollegor

### Professionellt nätverk
- Arbetskonsulenter
- Lärare/mentorer
- Personer du träffat på praktik

### Utvidgat nätverk
- Vänners vänner
- Kontakter på LinkedIn
- Medlemmar i föreningar

## Så börjar du nätverka

### 1. Definiera vad du söker
Var tydlig med vilken typ av jobb du söker och vilken information eller hjälp du behöver. Skriv ner:
- Vilken bransch/roll intresserar dig?
- Vilka företag vill du veta mer om?
- Vad behöver du hjälp med?

### 2. Skapa en lista
Skriv ner 20 personer du skulle kunna kontakta. Tänk brett! Inkludera:
- Alla du känner i branschen
- Vänner som kanske känner någon
- Gamla kollegor och chefer
- LinkedIn-kontakter

### 3. Nå ut
Kontakta personer med ett personligt meddelande:

**Exempel:**
"Hej [Namn]! Jag såg att du jobbar inom [bransch] och jag utforskar just nu möjligheter inom det området. Skulle du ha tid för en kopp kaffe eller ett kort samtal? Jag skulle uppskatta dina insikter och råd."

## Konversationsstartare – färdiga fraser

### När du möter någon ny på ett event

**Öppningsfrågor:**
- "Hej! Hur kom det sig att du är här idag?"
- "Vilken koppling har du till [arrangören/branschen]?"
- "Jag såg att du jobbar på [företag]. Hur länge har du varit där?"
- "Jag är ny i branschen – vad är ditt bästa tips för någon som precis börjar?"

**Fördjupande frågor:**
- "Det låter intressant! Hur kom det sig att du hamnade i den rollen?"
- "Vad är det bästa med ditt jobb?"
- "Vilka utmaningar ser du i branschen just nu?"
- "Hur har din karriärväg sett ut?"

**Avslutande fraser:**
- "Det har varit så intressant att prata med dig. Får jag följa dig på LinkedIn?"
- "Jag skulle gärna fortsätta det här samtalet. Kan vi ta en kaffe någon gång?"
- "Tack för dina insikter! Får jag höra av mig om jag har fler frågor?"

### När du känner dig nervös

**Ärliga öppningar:**
- "Jag är inte så van vid den här typen av event, men jag försöker utmana mig själv."
- "Jag ska vara ärlig – nätverkande är inte min starkaste sida, men jag ville verkligen komma hit."
- "Jag söker just nu jobb inom [bransch] och tänkte det var bäst att faktiskt prata med folk!"

Ärlighet skapar förtroende och de flesta kan relatera till nervositet.

## LinkedIn-nätverkande – skript och mallar

### Kontaktförfrågan till okänd person

**Mall 1: Till någon på drömföretaget**
"Hej [Namn]! Jag följer [Företag] med stort intresse och ser att du jobbar som [roll]. Jag utforskar just nu möjligheter inom [bransch/område] och skulle uppskatta att ha dig i mitt nätverk. Vänliga hälsningar, [Ditt namn]"

**Mall 2: Till någon med intressant karriärväg**
"Hej [Namn]! Jag såg att du gjort en spännande karriärresa från [tidigare roll] till [nuvarande roll]. Det är precis den typen av övergång jag funderar på. Skulle gärna vilja koppla ihop oss! Med vänlig hälsning, [Ditt namn]"

**Mall 3: Efter ett event**
"Hej [Namn]! Vi träffades kort på [event] igår. Jag tyckte det var intressant att höra om [något ni pratade om]. Vill gärna hålla kontakten! Hälsningar, [Ditt namn]"

### Uppföljningsmeddelande efter accepterad kontakt

**Mall: Tacka och fördjupa**
"Tack för att du accepterade min kontaktförfrågan, [Namn]!

Jag är som sagt intresserad av [bransch/område] och söker just nu aktivt nya möjligheter. Jag skulle uppskatta om du har 15-20 minuter för ett kort videosamtal där jag kan ställa några frågor om din erfarenhet i branschen.

Ingen stress om du inte har tid – jag uppskattar kontakten oavsett!

Med vänlig hälsning,
[Ditt namn]"

### Be om informationsintervju via LinkedIn

**Mall:**
"Hej [Namn]!

Jag hoppas att allt är bra med dig. Jag kontaktar dig för att jag är intresserad av att lära mig mer om arbetet som [roll] på [företag/i branschen].

Jag har [kort beskrivning av din bakgrund] och utforskar möjligheter inom [område]. Jag tror att dina erfarenheter och insikter skulle vara otroligt värdefulla för mig.

Skulle du ha möjlighet att träffas för en kort fika (15-20 min) eller ett videosamtal? Jag är flexibel med tid och plats.

Tack på förhand!
[Ditt namn]"

## Informationsintervju – komplett mall

### Strukturera mötet (20-30 min)

**1. Introduktion (2-3 min)**
- Tacka för tiden
- Berätta kort om dig själv (30-sekunder pitch)
- Förklara varför du ville träffas

**2. Frågor om personens karriär (5-7 min)**
- "Hur hamnade du i din nuvarande roll?"
- "Hur ser en typisk dag/vecka ut för dig?"
- "Vad tycker du är mest givande med ditt jobb?"

**3. Frågor om branschen/företaget (5-7 min)**
- "Hur skulle du beskriva kulturen på [företag]?"
- "Vilka utmaningar ser du i branschen just nu?"
- "Vilka trender kommer påverka branschen framöver?"

**4. Frågor om din situation (5-7 min)**
- "Vad skulle du rekommendera någon som vill in i branschen?"
- "Vilka kompetenser är mest eftertraktade?"
- "Ser du några luckor i min profil som jag borde adressera?"

**5. Avslutning (2-3 min)**
- "Finns det någon annan du tror jag borde prata med?"
- "Hur kan jag vara till hjälp för dig?"
- Tacka igen och bekräfta att du kommer skicka ett tackmeddelande

### Frågor du bör undvika

- "Har ni några lediga tjänster?" (fråga om branschen istället)
- "Kan du fixa ett jobb åt mig?" (för direkt)
- "Hur mycket tjänar du?" (för personligt)
- Frågor du enkelt kan googla (visar bristande förberedelse)

### Tackmeddelande efter mötet

**Skicka inom 24 timmar:**

"Hej [Namn]!

Stort tack för att du tog dig tid att träffa mig igår. Det var otroligt värdefullt att höra om din erfarenhet på [företag] och i [branschen].

Jag tar särskilt med mig ditt råd om [specifik sak ni diskuterade]. Det var något jag inte tänkt på tidigare.

Jag ska definitivt följa upp med [person de rekommenderade] som du nämnde.

Om det är något jag kan hjälpa dig med i framtiden, tveka inte att höra av dig!

Vänliga hälsningar,
[Ditt namn]"

## Event-nätverkande – praktiska tips

### Före eventet

**Förbered dig:**
- Läs deltagarelistan om den finns tillgänglig
- Identifiera 3-5 personer du vill prata med
- Förbered frågor specifika för dessa personer
- Uppdatera din LinkedIn-profil
- Ha visitkort eller QR-kod till din LinkedIn redo

**Din 30-sekunders pitch:**
Förbered en kort presentation av dig själv:
"Hej, jag heter [namn]. Jag har bakgrund inom [område] och söker just nu möjligheter inom [bransch]. Det som intresserar mig mest är [specifik sak]. Jag är här idag för att [syfte]."

### Under eventet

**Ankomst:**
- Kom i tid (eller 15 min sent – då är fler där)
- Ta en icke-alkoholhaltig dryck (svårare att skaka hand med glas i hand)
- Börja med att prata med någon som också ser ny ut

**Cirkulera effektivt:**
- Stanna inte med samma grupp hela kvällen
- Avsluta konversationer artigt: "Det var trevligt att prata. Jag ska cirkulera lite, men vi ses säkert senare!"
- Sikta på kvalitet, inte kvantitet – 3-5 meningsfulla samtal är bättre än 20 ytliga

**Samlande av kontakter:**
- Be om visitkort eller LinkedIn-namn
- Skriv en anteckning på baksidan av kortet om vad ni pratade om
- Ta ett foto av kortet för säkerhets skull

### Efter eventet

**Inom 48 timmar:**
- Skicka LinkedIn-förfrågan till alla du pratade med
- Inkludera ett personligt meddelande som refererar till er konversation
- Boka uppföljningsmöten med de mest intressanta kontakterna

## Underhåll ditt nätverk

### Regelbunden kontakt
- Gratulera till nya jobb och milstolpar
- Dela intressanta artiklar
- Hör av dig utan att be om något
- Kommentera deras LinkedIn-inlägg
- Skicka ett "tänkte på dig när jag såg detta"-meddelande

### Ge mer än du tar
- Erbjud hjälp när du kan
- Dela information och kontakter
- Var generös med din tid och kunskap
- Rekommendera andra för jobb och uppdrag
- Dela relevanta artiklar och resurser

### Nätverkskalender

Skapa ett system för att hålla kontakten:

| Kontakttyp | Hur ofta | Exempel |
|------------|----------|---------|
| Nära kontakter | Varje månad | Fika, samtal |
| Professionella kontakter | Var 3:e månad | LinkedIn, mejl |
| Yttre nätverk | Var 6:e månad | Gratulationer, artiklar |

## Vanliga hinder – och hur du övervinner dem

**"Jag är för blyg"**
Börja digitalt via LinkedIn. Skriftlig kontakt är lättare än telefonsamtal. Du kan också be en vän följa med på events för moraliskt stöd.

**"Jag vill inte verka desperat"**
Du ber om råd och insikter, inte om ett jobb. De flesta uppskattar att bli tillfrågade! Fokusera på att lära dig, inte på att sälja dig själv.

**"Jag har inget nätverk"**
Alla börjar någonstans. Ditt nätverk växer med varje person du pratar med. Börja med en person i veckan.

**"Jag vet inte vad jag ska säga"**
Förbered dig. Skriv ner frågor och öva på din "hiss-pitch" om dig själv. Använd mallarna i denna artikel.

**"Jag har inte tid"**
30 minuter i veckan räcker för att börja. En kaffe, ett LinkedIn-meddelande, en kommentar. Små steg ger stora resultat över tid.

## Nätverksövning – kom igång idag

**Vecka 1:**
- [ ] Lista 20 personer i ditt befintliga nätverk
- [ ] Optimera din LinkedIn-profil
- [ ] Skicka 3 LinkedIn-förfrågningar

**Vecka 2:**
- [ ] Kontakta 1 person för informationsintervju
- [ ] Kommentera 5 LinkedIn-inlägg i din bransch
- [ ] Dela en relevant artikel

**Vecka 3:**
- [ ] Genomför informationsintervjun
- [ ] Skicka tackmeddelande
- [ ] Be om 2 nya kontakter

**Vecka 4:**
- [ ] Följ upp med de nya kontakterna
- [ ] Hitta ett event att delta på
- [ ] Reflektera: vad fungerar? Vad kan förbättras?

## Kom ihåg

Nätverkande handlar om relationer, inte transaktioner. Var genuint intresserad av andra människor, ge utan att förvänta dig något tillbaka, och ha tålamod. De bästa kontakterna byggs över tid!

**Det magiska med nätverkande:** Varje ny kontakt öppnar dörrar till ett helt nätverk av andra kontakter. En person kan leda till tio nya möjligheter.`,
    category: 'networking',
    subcategory: 'building-network',
    tags: ['nätverkande', 'nätverk', 'dolda jobbmarknaden', 'kontakter', 'informationsmöten', 'LinkedIn', 'evenemang', 'konversation'],
    createdAt: '2024-03-13T10:00:00Z',
    updatedAt: '2024-03-13T10:00:00Z',
    readingTime: 20,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['linkedin-optimering', 'tackbrev-intervju'],
    relatedExercises: ['networking'],
    actions: [
      { label: '🤝 Gör övningen: Nätverka för att hitta jobb', href: '/exercises', type: 'primary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  // === DIGITAL NÄRVARO (nya artiklar) ===
  {
    id: 'bygg-ditt-personliga-varumarke',
    title: 'Bygg ditt personliga varumärke online',
    summary: 'Skapa en konsekvent och professionell digital närvaro som attraherar rätt möjligheter.',
    content: `Ditt personliga varumärke är vad folk säger om dig när du inte är i rummet. I dagens digitala värld är det avgörande för din karriär.

## Vad är ett personligt varumärke?

Ditt personliga varumärke är:
- Den bild andra har av dig
- Det du är känd för
- Din unika kombination av kompetenser och personlighet

### Varför är det viktigt?

- **70% av arbetsgivare** googlar kandidater före intervju
- Ett starkt varumärke gör att möjligheter kommer till dig
- Det hjälper dig sticka ut i en konkurrenskraftig marknad
- Det ger dig kontroll över hur andra uppfattar dig

## Steg 1: Definiera ditt varumärke

### Vilka är du?
Ställ dig dessa frågor:
- Vilka är dina kärnkompetenser?
- Vilka värderingar driver dig?
- Vad vill du bli känd för?
- Vilka problem kan du lösa för andra?

### Din unika vinkel
Vad skiljer dig från andra med liknande bakgrund? Det kan vara:
- En unik kombination av erfarenheter
- Ett speciellt perspektiv
- En ovanlig karriärväg
- Specifika resultat du uppnått

### Skapa ditt varumärkesbudskap
Sammanfatta dig själv i en mening:
"Jag hjälper [målgrupp] med [problem] genom [din unika metod/kompetens]"

**Exempel:**
- "Jag hjälper småföretag växa genom kreativ digital marknadsföring"
- "Jag förenklar komplex teknik för användare utan IT-bakgrund"

## Steg 2: Optimera dina profiler

### LinkedIn – din viktigaste plattform

**Profilbild:**
- Professionell men personlig
- Bra belysning, neutral bakgrund
- Klä dig som för jobbet du vill ha
- Le genuint!

**Rubrik (Headline):**
- Mer än bara din titel
- Inkludera nyckelord rekryterare söker på
- **Dåligt:** "Arbetssökande"
- **Bra:** "Projektledare | Effektivisering | Digitala verktyg | Söker nya utmaningar"

**Sammanfattning (About):**
- Berätta din historia, inte bara CV-punkter
- Visa din personlighet
- Inkludera vad du söker
- Avsluta med en uppmaning (CTA)

**Erfarenheter:**
- Fokusera på resultat, inte arbetsuppgifter
- Använd siffror när möjligt
- Inkludera relevanta nyckelord

### Andra plattformar
- Säkerställ samma profilbild och namn överallt
- Rensa bort olämpligt innehåll på privata konton
- Överväg en personlig hemsida eller portfolio

## Steg 3: Skapa innehåll

### Dela vad du lär dig
- Artiklar du läst och vad du tar med dig
- Kurser och utbildningar du genomfört
- Insikter från din bransch
- Reflektioner om trender

### Visa ditt arbete
- Projekt du slutfört (med tillåtelse)
- Resultat du uppnått
- Presentationer eller rapporter
- Före/efter-exempel

### Engagera dig aktivt
- Kommentera på andras inlägg med värdefulla insikter
- Gratulera kontakter till nya jobb och framgångar
- Delta i relevanta grupper och diskussioner
- Svara alltid på kommentarer på dina egna inlägg

### Innehållskalender
Planera för att posta regelbundet:
- 1-2 gånger per vecka är lagom
- Blanda olika typer av innehåll
- Var konsekvent – sluta inte efter första veckan!

## Steg 4: Underhåll och utveckla

### Månadsrutin
- Uppdatera profilen med nya erfarenheter
- Lägg till nya kompetenser
- Be om rekommendationer
- Rensa kontakter som inte är relevanta

### Mät din framgång
- Hur många profilvisningar får du?
- Får du fler kontaktförfrågningar?
- Kontaktas du av rekryterare?
- Hur uppfattar folk dig?

## Vanliga misstag att undvika

- Att vara för generisk och tråkig
- Att bara prata om dig själv
- Att vara inkonsekvent mellan plattformar
- Att ge upp efter några veckor
- Att vara negativ eller klaga offentligt

## Kom ihåg

Ditt personliga varumärke byggs över tid. Var autentisk, var konsekvent, och var tålmodig. Det viktigaste är att det verkligen representerar vem du är!`,
    category: 'digital-presence',
    subcategory: 'personal-brand',
    tags: ['personligt varumärke', 'digital närvaro', 'LinkedIn', 'digital profil'],
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    readingTime: 14,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['linkedin-optimering', 'natverka-for-jobb'],
    relatedExercises: ['personligt-varumarke', 'linkedin'],
    actions: [
      { label: '👤 Gör övningen: Ditt personliga varumärke', href: '/exercises', type: 'primary' },
      { label: '💼 Gör övningen: LinkedIn som jobbsökarverktyg', href: '/exercises', type: 'secondary' },
    ],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  // === ARBETSRÄTT (nya artiklar) ===
  {
    id: 'anstallningsformer-guide',
    title: 'Anställningsformer – vad är skillnaden?',
    summary: 'En guide till olika anställningsformer, deras fördelar och vad du behöver tänka på.',
    content: `Att förstå olika anställningsformer hjälper dig göra medvetna val och veta vad du har rätt till. Här är en komplett guide.

## Översikt: Anställningsformer i Sverige

| Typ | Tidsbegränsning | Uppsägningsskydd | Vanligast för |
|-----|-----------------|------------------|---------------|
| Tillsvidare | Nej | Starkast | Ordinarie tjänster |
| Visstid | Ja | Begränsat | Projekt, säsong |
| Vikariat | Ja | Begränsat | Ersätta frånvarande |
| Provanställning | Max 6 mån | Svagast | Nya anställningar |
| Timanställning | Varierande | Begränsat | Extrajobb |

## Tillsvidareanställning (Fast anställning)

### Vad är det?
En anställning utan slutdatum som gäller tills någon säger upp den.

### Fördelar
- **Trygghet:** Kan inte avslutas utan saklig grund
- **Stabilitet:** Förutsägbar inkomst
- **Utveckling:** Långsiktig kompetensutveckling
- **Lån:** Lättare att få bolån och krediter
- **Försäkringar:** Bättre villkor i gruppförsäkringar
- **Karriär:** Möjlighet till befordran och intern utveckling
- **Förmåner:** Tillgång till friskvårdsbidrag, tjänstebil m.m.

### Nackdelar
- Kan vara svårare att få direkt
- Mindre flexibilitet om du vill byta
- Längre uppsägningstid kan kännas bindande
- Svårare att förhandla stora lönehöjningar internt

### Uppsägningstid
- 1 månad (under 2 års anställning)
- 2 månader (2-4 år)
- 3 månader (4-6 år)
- Upp till 6 månader vid längre anställning

### Uppsägning
Arbetsgivaren måste ha saklig grund:
- Arbetsbrist (omorganisation, nedskärningar)
- Personliga skäl (allvarlig misskötsel)

Du har turordningsskydd ("sist in, först ut").

### Dina rättigheter som tillsvidareanställd

| Rättighet | Beskrivning |
|-----------|-------------|
| Skriftligt varsel | Arbetsgivaren måste varsla skriftligt minst 2 månader innan uppsägning vid arbetsbrist |
| Turordningsregler | Principen "sist in, först ut" gäller |
| Företrädesrätt | Om du sagts upp pga arbetsbrist har du rätt till återanställning i 9 månader |
| Omplacering | Arbetsgivaren ska försöka omplacera dig innan uppsägning |
| Facket | Arbetsgivaren ska förhandla med facket innan uppsägning |

## Visstidsanställning (Tidsbegränsad)

### Allmän visstidsanställning
- Behöver ingen speciell anledning
- Max 24 månader under en 5-årsperiod
- Övergår till tillsvidare om gränsen överskrids

### Vikariat
- Du ersätter någon som är frånvarande
- Gäller så länge ordinarie är borta
- Ingen maxgräns i tid

### Säsongsanställning
- För arbete under viss säsong
- Vanligt inom jordbruk, turism, handel

### Projektanställning
- Knutet till ett specifikt projekt
- Avslutas när projektet är klart

### Fördelar med visstid
- Lättare att få foten in
- Prova på arbetsplatsen
- Kan leda till fast tjänst
- Flexibilitet
- Möjlighet att testa olika branscher
- Ofta intensiv erfarenhet och lärande

### Nackdelar med visstid
- Osäkerhet om framtiden
- Svårare att planera ekonomi
- Kan vara svårare att få lån
- Mindre tillgång till vissa förmåner
- Kan kännas som "andrahandsanställd"

### Dina rättigheter vid visstid

**Du har rätt till:**
- Samma grundvillkor som tillsvidareanställda (lön, semester, arbetsmiljö)
- Information om lediga tillsvidaretjänster hos arbetsgivaren
- Att veta anledningen till visstidsanställningen
- Att inte diskrimineras för att du är visstidsanställd

**Du har INTE rätt till:**
- Uppsägningsskydd under avtalsperioden (om inget annat avtalats)
- Företrädesrätt till återanställning (om du jobbat mindre än 12 månader)

## Provanställning

### Vad är det?
En prövoperiod innan fast anställning.

### Regler
- Max 6 månader
- Kan avbrytas av båda parter utan skäl
- Övergår automatiskt till tillsvidare om ingen säger upp
- 2 veckors varsel vid avbrytande

### Tips för provanställda
- Visa engagemang från dag ett
- Be om feedback regelbundet
- Dokumentera dina prestationer
- Fråga om förväntningarna

### Dina rättigheter under provanställning

| Du HAR rätt till | Du har INTE rätt till |
|------------------|----------------------|
| Samma lön som utlyst | Motivering vid avbrott |
| Arbetsmiljöskydd | Turordningsskydd |
| Semester | Uppsägningsskydd |
| Kollektivavtalets villkor | |

### Så överlever du provanställningen

**Första veckan:**
- Var punktlig varje dag
- Ställ frågor – det visar engagemang
- Lär dig kollegornas namn
- Anteckna viktiga rutiner och system

**Första månaden:**
- Be om ett utvecklingssamtal efter 2-4 veckor
- Fråga: "Vad förväntar ni er av mig under provanställningen?"
- Var proaktiv och föreslå förbättringar
- Dokumentera dina prestationer

**Sista månaden:**
- Påminn om att provanställningen snart är slut
- Be om feedback: "Hur tycker ni att det går?"
- Fråga direkt: "Kommer min anställning övergå till tillsvidare?"

## Timanställning

### Vad är det?
Du kallas in vid behov och får betalt per timme.

### Varianter
- **Behovsanställning:** Arbetsgivaren ringer när det behövs
- **Intermittent anställning:** Regelbundet återkommande tillfällen

### Fördelar
- Flexibilitet
- Möjlighet att tacka nej
- Bra som extrajobb
- Kan kombineras med studier
- Prova på olika arbetsplatser

### Nackdelar
- Ingen garanterad inkomst
- Osäkerhet
- Svårare med planering
- Begränsade förmåner
- Risk för utnyttjande

### Dina rättigheter
- Samma timlön som ordinarie
- Semester (betalas ofta som tillägg, minst 12%)
- Arbetsmiljöskydd
- Sjuklön (efter 14 dagars anställning)

### Skydd mot missbruk

**Regler sedan 2022:**
- Om du jobbat i genomsnitt minst 8 timmar/vecka under 6 månader, har du rätt att begära tryggare anställningsform
- Arbetsgivaren ska svara skriftligt inom en månad
- Upprepade timanställningar kan omvandlas till tillsvidare

## Anställningsbevis

### Du har rätt till skriftlig information om:
- Arbetsgivare och arbetsplats
- Arbetsuppgifter
- Anställningsform
- Startdatum (och slutdatum vid visstid)
- Lön och förmåner
- Arbetstid
- Uppsägningstid
- Kollektivavtal (om det finns)

### Tips
- Be alltid om skriftligt anställningsbevis
- Läs igenom noga innan du skriver på
- Spara en kopia

### Checklista: Vad ska finnas med i kontraktet?

**Grundläggande information:**
- [ ] Arbetsgivarens namn och organisationsnummer
- [ ] Din titel och arbetsuppgifter
- [ ] Anställningsform (tillsvidare, visstid, etc.)
- [ ] Startdatum
- [ ] Slutdatum (om tidsbegränsat)

**Lön och ersättning:**
- [ ] Månadslön eller timlön
- [ ] När lönen betalas ut
- [ ] Övertidsersättning (eller om det ingår i lönen)
- [ ] Semesterersättning (vid timlön)
- [ ] Eventuella bonusar eller provisioner

**Arbetstid:**
- [ ] Arbetstid per vecka
- [ ] Fast eller flexibel arbetstid
- [ ] Eventuell jour eller beredskap
- [ ] Övertidsregler

**Semester och ledighet:**
- [ ] Antal semesterdagar
- [ ] Regler för sparad semester
- [ ] Eventuell tjänstledighet

**Övrigt:**
- [ ] Uppsägningstid
- [ ] Eventuell konkurrensklausul
- [ ] Pensionsavtal
- [ ] Försäkringar
- [ ] Kollektivavtal (om det finns)

## Förhandla ditt anställningsavtal

### Vad kan du förhandla?

**Vanligt att förhandla:**
- Lön (alltid!)
- Startdatum
- Arbetstid och flexibilitet
- Hemarbete/distansarbete
- Friskvårdsbidrag
- Extra semesterdagar

**Svårare att förhandla:**
- Anställningsform (men fråga ändå)
- Pensionsvillkor
- Uppsägningstid

### Förhandlingstips

**Före förhandlingen:**
1. Undersök marknadslön för rollen (SCB, Unionen, lönestatistik.se)
2. Lista dina styrkor och erfarenheter
3. Bestäm din "walk away point" – vad är minimum du accepterar?
4. Förbered svar på "varför ska vi betala mer?"

**Under förhandlingen:**
- Var positiv och professionell
- Börja med ett högre krav än du förväntar dig få
- Lyssna aktivt på arbetsgivarens argument
- Var beredd att kompromissa på rätt sätt

**Förhandlingsfraser:**
- "Baserat på min erfarenhet och marknadslön för liknande roller hade jag förväntat mig..."
- "Är det möjligt att diskutera lönen?"
- "Jag är mycket intresserad av tjänsten. Finns det utrymme för förhandling?"
- "Om inte lönen kan justeras, finns det andra förmåner vi kan diskutera?"

### Vad ska du aldrig acceptera utan att fråga?

- Lägre lön än utannonserat
- Längre provanställning än 6 månader
- Konkurrensklausul utan ersättning
- Övertid utan ersättning (om det inte är uttalat i lönen)
- Oklara arbetsuppgifter

## Konvertering till fast anställning

### När övergår visstid till tillsvidare?

**Allmän visstid:**
Automatisk övergång om du arbetat mer än:
- 24 månader under en 5-årsperiod

**Vikariat:**
Automatisk övergång om du:
- Haft vikariat mer än 24 månader under 5 år
- ELLER haft vikariat + allmän visstid sammanlagt 24 månader

### Vad göra om du borde konverterats?
1. Räkna ihop din tid
2. Kontakta arbetsgivaren
3. Vid tvist: kontakta facket eller Arbetsdomstolen

### Öka dina chanser till fast tjänst

**Från visstid till tillsvidare:**
- Leverera mer än förväntat
- Var synlig och engagerad
- Bygg relationer med chefer och kollegor
- Fråga tidigt om möjligheter till förlängning
- Be om feedback och utvecklingssamtal
- Var tydlig med att du vill stanna

## Kollektivavtal

### Vad är det?
Avtal mellan fackförbund och arbetsgivarorganisation som ger bättre villkor än lagen.

### Fördelar med kollektivavtal
- Högre minimilön
- Bättre pension (tjänstepension)
- Föräldraledighetstillägg
- Längre semester
- Försäkringar
- Övertidsersättning
- Strukturerade lönesamtal

### Så kollar du
Fråga arbetsgivaren: "Har ni kollektivavtal? Med vilket förbund?"

### Vad händer om det inte finns kollektivavtal?

**Du förlorar:**
- Garanterad tjänstepension
- Extra försäkringar (TFA, AGS)
- Standardiserade löneökningar
- Fackets förhandlingsstöd

**Du måste förhandla själv:**
- Pensionsavsättning i kontraktet
- Löneökningar varje år
- Försäkringar
- Övertidsersättning

## Vanliga fällor – och hur du undviker dem

### "Vi erbjuder praktik med chans till anställning"
**Varning:** Obetald praktik hos ett företag (inte via Arbetsförmedlingen) är ofta olagligt. Du ska ha lön för ditt arbete.

### "Starta eget och fakturera oss"
**Varning:** Kan vara ett försök att undvika arbetsgivaransvar. Du missar pension, försäkringar och trygghet.

### "Vi kan inte erbjuda fast tjänst just nu, men kanske senare"
**Tips:** Be om skriftligt löfte med tidslinje, eller en tydlig plan för vad som krävs.

### "Lönen är fast – övertid ingår"
**Tips:** Kontrollera att det är juridiskt korrekt och att lönen faktiskt kompenserar för övertiden.

## Frågor att ställa vid anställning

- Vilken anställningsform erbjuds?
- Hur lång är provanställningen?
- Vad händer efter provanställningen?
- Finns kollektivavtal?
- Hur ser möjligheterna till fast tjänst ut?
- Vilken uppsägningstid gäller?
- Vilka försäkringar ingår?
- Hur hanteras övertid?
- Finns möjlighet till distansarbete?
- Hur ser karriärvägarna ut?

## Kom ihåg

- Ingen anställningsform är "dålig" – de passar olika situationer
- Visstidsanställningar är ofta ett första steg
- Läs alltid anställningsbeviset noga
- Fråga om du är osäker på något!
- Du har alltid rätt att förhandla
- Dokumentera allt skriftligt

**Behöver du hjälp?** Din arbetskonsulent kan granska anställningsavtal och ge råd om dina rättigheter.`,
    category: 'employment-law',
    subcategory: 'employment-types',
    tags: ['anställningsformer', 'tillsvidare', 'visstid', 'provanställning', 'rättigheter', 'förhandling', 'kontrakt', 'kollektivavtal'],
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z',
    readingTime: 22,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['nystartsjobb-guide', 'rattigheter-stod', 'loneforhandling-guide'],
    relatedExercises: ['salary'],
    author: 'Katarina Holm',
    authorTitle: 'Handläggare Arbetsförmedlingen',
  },

  {
    id: 'lon-och-formaner-guide',
    title: 'Lön och förmåner – mer än bara kontant lön',
    summary: 'Förstå hela ersättningspaketet och lär dig förhandla om både lön och förmåner.',
    content: `När du utvärderar ett jobberbjudande är det viktigt att se hela paketet – inte bara grundlönen. Ibland är förmånerna värda mer än en högre lön.

## Ersättningspaketets delar

### 1. Kontant lön

**Grundlön**
- Det du får utbetalt varje månad före skatt
- Kan vara fast eller rörlig

**Rörlig lön**
- Provision (vanligt inom försäljning)
- Bonus (vid måluppfyllelse)
- Tantiem (andel av vinst)

**OB-tillägg**
- Extra ersättning för obekväm arbetstid
- Kvällar, nätter, helger

### 2. Tjänstepension

Arbetsgivaren betalar in pengar till din pension utöver den allmänna pensionen.

**Vanliga nivåer:**
- Minst 4,5% av lönen (lag)
- 6-8% vanligt med kollektivavtal
- 10-15% för tjänstemän med ITP

**Räkneexempel:**
| Lön | Pensionsavsättning 4,5% | Pensionsavsättning 10% |
|-----|-------------------------|------------------------|
| 30 000 kr | 1 350 kr/mån | 3 000 kr/mån |
| 40 000 kr | 1 800 kr/mån | 4 000 kr/mån |
| 50 000 kr | 2 250 kr/mån | 5 000 kr/mån |

**Tips:** Fråga alltid om pensionsavsättningens nivå – det är pengar du inte ser men som är mycket värda!

### 3. Semester

**Lagstadgat minimum:** 25 dagar per år

**Vanligt med kollektivavtal:**
- 25-28 dagar som standard
- 30+ dagar vid längre anställning
- Extra dagar för äldre arbetstagare

**Räkna ut värdet:**
En extra semestervecka = ca 2% av årslönen i värde

### 4. Försäkringar

**Försäkringar via arbetsgivare:**
| Försäkring | Vad den täcker |
|------------|----------------|
| Sjukförsäkring | Utfyllnad vid sjukdom |
| Tjänstegrupplivförsäkring (TGL) | Engångsbelopp vid dödsfall |
| Trygghetsförsäkring (TFA) | Arbetsskador |
| Tjänstereseförsäkring | Olyckor på tjänsteresa |

**Värde:** Att teckna motsvarande privat kan kosta 5 000-15 000 kr/år

### 5. Förmåner med ekonomiskt värde

| Förmån | Typiskt värde per år |
|--------|----------------------|
| Friskvårdsbidrag | 3 000-5 000 kr |
| Lunch/matkuponger | 10 000-15 000 kr |
| Tjänstebil | 30 000-80 000 kr |
| Sjukvårdsförsäkring | 5 000-10 000 kr |
| Mobiltelefon + abonnemang | 5 000-8 000 kr |
| Kompetensutveckling | 10 000-50 000 kr |

### 6. Flexibilitet och livskvalitet

**Flextid**
- Möjlighet att styra arbetstider
- Värde: Svårt att räkna, men högt värderat

**Distansarbete/Hybridarbete**
- Spara tid på pendling
- Spara pengar på resor, lunch, kläder
- Räkneexempel: Pendling 1 timme/dag = 250 timmar/år

**Förkortad arbetstid**
- Fler arbetsgivare erbjuder 37,5 eller 38 timmar
- Skillnad mot 40 timmar = 5 extra lediga dagar/år

## Jämföra erbjudanden

### Mall för jämförelse

| Komponent | Jobb A | Jobb B | Jobb C |
|-----------|--------|--------|--------|
| Grundlön | 35 000 | 38 000 | 36 000 |
| Pension % | 6% | 4,5% | 10% |
| Pension kr | 2 100 | 1 710 | 3 600 |
| Semester (dagar) | 25 | 28 | 25 |
| Friskvård | 5 000 | 3 000 | 5 000 |
| Distansarbete | 0 | 2 dgr/v | 1 dgr/v |
| **Totalt värde ca** | 42 000 | 43 700 | 45 100 |

### Viktiga frågor att ställa

**Om lön:**
- Är lönen förhandlingsbar?
- Hur ofta sker lönerevision?
- Finns bonus eller provision?

**Om pension:**
- Hur stor är pensionsavsättningen?
- Vilken pensionsplan gäller?

**Om semester:**
- Hur många semesterdagar?
- Kan man ta ut förskottssemester?

**Om förmåner:**
- Vilka förmåner ingår?
- Finns friskvårdsbidrag? Hur mycket?
- Erbjuds tjänstebil/pendelbidrag?
- Finns möjlighet till distansarbete?

## Förhandla om förmåner

### När lönen är låst
Om arbetsgivaren inte kan höja lönen, förhandla om:
- Fler semesterdagar
- Högre friskvårdsbidrag
- Distansarbete
- Kompetensutveckling
- Flexibla arbetstider
- Signeringsbonus (engångsbelopp)

### Argument för förmåner
- "Jag värderar work-life balance högt – kan vi diskutera flexibla arbetstider?"
- "Jag förstår att lönen är satt, men skulle extra semesterdagar vara möjligt?"
- "Kompetensutveckling är viktigt för mig – har ni utbildningsbudget?"

### Tips vid förhandling
1. Prioritera vad som är viktigast för dig
2. Ha alternativ redo
3. Var konkret i dina önskemål
4. Lyssna på vad de kan erbjuda
5. Få allt skriftligt i anställningsbeviset

## Räkna på det totala värdet

### Exempel: Anna jämför två jobb

**Jobb A:** 38 000 kr i lön
- Pension 4,5% = 1 710 kr
- 25 semesterdagar
- Inget friskvård
- Ingen flex
- Total: ca 39 710 kr + 0 kr förmåner

**Jobb B:** 35 000 kr i lön
- Pension 10% = 3 500 kr
- 28 semesterdagar (värde ca 700 kr/mån)
- Friskvård 5 000 kr/år (ca 400 kr/mån)
- 2 dagar distansarbete/vecka (pendlarbesparing ca 1 500 kr/mån)
- Total: ca 35 000 + 6 100 = 41 100 kr

**Slutsats:** Jobb B är värt mer trots lägre lön!

## Förmånsbeskattning

### Skattefria förmåner
- Friskvårdsbidrag (upp till 5 000 kr)
- Personalvårdsförmåner
- Utbildning inom tjänsten

### Skattepliktiga förmåner
- Tjänstebil (förmånsvärde beskattas)
- Fri lunch (värde beskattas)
- Mobiltelefon för privat bruk

## Kom ihåg

- Titta alltid på hela paketet, inte bara lönen
- Förmåner kan ibland vara mer värda än högre lön
- Fråga specifikt om pension – det är ofta stora skillnader
- Förhandla om förmåner om lönen är låst
- Få allt skriftligt!`,
    category: 'employment-law',
    subcategory: 'salary-benefits',
    tags: ['lön', 'förmåner', 'pension', 'semester', 'förhandling', 'ersättning'],
    createdAt: '2024-03-17T10:00:00Z',
    updatedAt: '2024-03-17T10:00:00Z',
    readingTime: 12,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['loneforhandling-guide', 'anstallningsformer-guide'],
    relatedExercises: ['salary'],
    actions: [
      { label: '💰 Gör övningen: Förstå lön och förmåner', href: '/exercises', type: 'primary' },
    ],
    author: 'Katarina Holm',
    authorTitle: 'Handläggare Arbetsförmedlingen',
  },

  // === KARRIÄRUTVECKLING (nya artiklar) ===
  {
    id: 'karriarplanering-guide',
    title: 'Karriärplanering – från vision till verklighet',
    summary: 'Skapa en strukturerad plan för din karriär med kortsiktiga och långsiktiga mål.',
    content: `En karriärplan är som en karta – den hjälper dig navigera från där du är idag till dit du vill vara. Utan plan riskerar du att driva runt utan riktning.

## Varför karriärplanera?

**Fördelar med en karriärplan:**
- **Riktning:** Du vet vart du är på väg och kan fatta bättre beslut
- **Motivation:** Tydliga mål ger drivkraft när det känns tungt
- **Kontroll:** Du styr din utveckling istället för att bara reagera
- **Fokus:** Du vet vad du ska prioritera och vad du kan säga nej till
- **Framsteg:** Du kan mäta och fira dina framsteg

## Steg 1: Analysera din nuvarande position

### Var är du idag?

**Kartlägg dina resurser:**
- Vilken utbildning har du?
- Vilken arbetslivserfarenhet har du?
- Vilka kompetenser och färdigheter besitter du?
- Vilket nätverk har du?
- Vilka ekonomiska förutsättningar har du?

**Identifiera dina styrkor:**
- Vad är du bra på?
- Vad får du beröm för?
- Vad ger dig energi?

**Erkänn dina svagheter:**
- Var behöver du utvecklas?
- Vilka kompetenser saknar du?
- Vad undviker du?

### Reflektera över din situation
- Vad fungerar bra i ditt nuvarande arbetsliv/jobbsökning?
- Vad fungerar inte?
- Vad har du lärt dig av tidigare erfarenheter?

### SWOT-analys för din karriär

Gör en personlig SWOT-analys för att få en tydlig bild:

| **Styrkor (Strengths)** | **Svagheter (Weaknesses)** |
|-------------------------|---------------------------|
| Vad gör du bra? | Var behöver du utvecklas? |
| Vilka unika erfarenheter har du? | Vilka kompetenser saknas? |
| Vad uppskattar andra hos dig? | Vad undviker du? |

| **Möjligheter (Opportunities)** | **Hot (Threats)** |
|--------------------------------|-------------------|
| Vilka trender gynnar dig? | Vilka risker finns? |
| Vilka kontakter kan hjälpa? | Vilken konkurrens möter du? |
| Vilka branscher växer? | Vilka förändringar kan påverka negativt? |

## Steg 2: Definiera din vision

### Drömmen utan begränsningar
Om allt var möjligt:
- Vad skulle du jobba med?
- Var skulle du bo?
- Hur skulle din vardag se ut?
- Hur mycket skulle du tjäna?
- Vilken livsstil skulle du ha?

### Visualisera framtiden
Skriv en beskrivning av ditt liv om 5 år som om det redan hänt:

"Det är år 2029 och jag arbetar som [roll] på [typ av företag]. Min vardag innebär [uppgifter]. Det jag älskar med mitt jobb är [det bästa]. Jag tjänar [lön] och har [livsstil]..."

## 5-årsplaneringen – ett komplett ramverk

### År 1: Grunden
**Fokus:** Bygga kompetens och skapa möjligheter

**Mål:**
- Identifiera din önskade karriärriktning
- Börja bygga relevant kompetens
- Utöka ditt professionella nätverk
- Få praktisk erfarenhet (jobb, praktik, volontärarbete)

**Aktiviteter:**
- [ ] Genomföra minst en relevant utbildning eller certifiering
- [ ] Nätverka med 20+ personer i målbranschen
- [ ] Skapa/uppdatera LinkedIn-profil
- [ ] Genomföra 5+ informationsintervjuer
- [ ] Söka minst 2 jobb per vecka

### År 2: Momentum
**Fokus:** Få foten in och etablera dig

**Mål:**
- Få anställning inom önskat område (eller närliggande)
- Börja bygga meritlista och CV
- Hitta en mentor i branschen
- Utveckla specialistkompetens

**Aktiviteter:**
- [ ] Prestera på hög nivå i din roll
- [ ] Dokumentera framgångar och resultat
- [ ] Ta på dig extra ansvar när möjlighet ges
- [ ] Fortsätta nätverka (minst 2 nya kontakter/månad)
- [ ] Hålla dig uppdaterad om branschtrender

### År 3: Fördjupning
**Fokus:** Bli expert och ta mer ansvar

**Mål:**
- Bli erkänd för din kompetens
- Ta på dig mer utmanande uppgifter
- Börja leda eller coacha andra
- Bygga ett starkt personligt varumärke

**Aktiviteter:**
- [ ] Leda minst ett projekt eller initiativ
- [ ] Dela kunskap (blogga, presentera, utbilda kollegor)
- [ ] Få feedback och utvecklingssamtal
- [ ] Utvärdera om du är på rätt väg mot 5-årsmålet

### År 4: Positionering
**Fokus:** Förbereda för nästa steg

**Mål:**
- Positionera dig för befordran eller nästa karriärsteg
- Bredda ditt ansvarsområde
- Bli "go-to person" inom ditt område
- Identifiera och adressera eventuella luckor

**Aktiviteter:**
- [ ] Diskutera karriärutveckling med din chef
- [ ] Söka internbefordran eller extern tjänst
- [ ] Mentora någon annan
- [ ] Bygga synlighet (internt och externt)

### År 5: Målet
**Fokus:** Nå din vision

**Mål:**
- Inneha din målposition (eller vara på tydlig väg dit)
- Ha den livsstil du önskar
- Känna dig tillfreds med din karriär
- Sätta nya 5-årsmål!

## Steg 3: Sätt SMARTA mål

### Vad är SMARTA mål?

| Bokstav | Betydelse | Fråga att ställa |
|---------|-----------|------------------|
| S | Specifikt | Vad exakt ska uppnås? |
| M | Mätbart | Hur vet jag att jag nått målet? |
| A | Attraktivt | Varför vill jag detta? |
| R | Realistiskt | Är det möjligt att uppnå? |
| T | Tidsbundet | När ska det vara klart? |

### SMARTA mål – fler konkreta exempel

**Område: Kompetensutveckling**

| Dåligt mål | SMART mål |
|------------|-----------|
| "Jag vill bli bättre på Excel" | "Jag ska genomföra en Excel-kurs på LinkedIn Learning och slutföra alla moduler senast 15 mars" |
| "Jag vill lära mig koda" | "Jag ska slutföra en Python-grundkurs och bygga ett eget litet projekt senast 30 juni" |
| "Jag vill bli bättre på att presentera" | "Jag ska hålla minst 3 presentationer (interna eller externa) under Q2 och be om feedback efter varje" |

**Område: Jobbsökning**

| Dåligt mål | SMART mål |
|------------|-----------|
| "Jag vill hitta ett jobb" | "Jag ska skicka 15 skräddarsydda ansökningar till marknadsföringsroller i Stockholm före 31 mars" |
| "Jag vill nätverka mer" | "Jag ska genomföra 4 informationsintervjuer med personer i min målbransch under april" |
| "Jag vill förbättra mitt CV" | "Jag ska uppdatera mitt CV med kvantifierbara resultat och få feedback från 2 personer i branschen senast 20 januari" |

**Område: Karriärutveckling**

| Dåligt mål | SMART mål |
|------------|-----------|
| "Jag vill bli chef" | "Jag ska ta på mig ledningsansvar för minst ett projektteam under 2024 och dokumentera mina lärdomar" |
| "Jag vill tjäna mer" | "Jag ska förhandla om löneökning på minst 5% vid nästa lönesamtal baserat på dokumenterade resultat" |
| "Jag vill byta bransch" | "Jag ska identifiera 3 övergångsbara roller och söka minst 2 sådana tjänster per månad under Q1-Q2" |

## Karriärmappningsövning

### Steg 1: Rita din karriärkarta

Skapa en visuell karta med:

**Din nuvarande position (mitten):**
- Nuvarande roll
- Kompetenser du har
- Erfarenheter

**Möjliga vägar framåt (grenar ut från mitten):**

**Väg A: Fördjupning**
- Bli specialist inom ditt nuvarande område
- Kräver: avancerade certifieringar, djup expertis
- Tidslinje: 2-3 år
- Exempel: Junior utvecklare → Senior utvecklare → Tech Lead

**Väg B: Breddning**
- Ta på dig fler ansvarsområden
- Kräver: ledarskapsutbildning, projektledning
- Tidslinje: 3-5 år
- Exempel: Projektmedlem → Projektledare → Avdelningschef

**Väg C: Sidoförflyttning**
- Byta till angränsande område
- Kräver: omskolning, nya kontakter
- Tidslinje: 1-2 år
- Exempel: Marknadsassistent → Content Creator → UX Writer

**Väg D: Entreprenörskap**
- Starta eget inom ditt expertområde
- Kräver: affärskunskap, nätverk, kapital
- Tidslinje: Varierar
- Exempel: Konsult → Frilansare → Egen byrå

### Steg 2: Utvärdera varje väg

För varje möjlig väg, svara på:
1. Hur attraktiv är denna väg för mig? (1-10)
2. Hur realistisk är den givet min situation? (1-10)
3. Vilka hinder finns på vägen?
4. Vad är första steget?

## Bransch- och trendanalys

### Varför analysera branschtrender?

Framgångsrik karriärplanering kräver förståelse för vart arbetsmarknaden är på väg. En roll som är efterfrågad idag kan automatiseras om fem år.

### Frågor att ställa om din bransch

**Nuläge:**
- Hur stor är branschen i Sverige?
- Vilka är de största arbetsgivarna?
- Vad är medianlönen för olika roller?
- Vilka kompetenser efterfrågas?

**Trender:**
- Växer eller krymper branschen?
- Vilka teknologier förändrar branschen?
- Vilka nya roller dyker upp?
- Vilka roller håller på att försvinna?

**Framtid:**
- Var finns de bästa möjligheterna om 5 år?
- Vilka kompetenser kommer vara mest värdefulla?
- Hur påverkas branschen av AI och automatisering?

### Källor för branschanalys

- **Arbetsförmedlingens Yrkeskompassen:** Prognos för olika yrken
- **SCB:** Lönestatistik och sysselsättningsdata
- **Branschorganisationer:** Rapporter och trender
- **LinkedIn:** Vilka kompetenser efterfrågas i platsannonser
- **Nyhetssidor:** TechCrunch, DI Digital, Computer Sweden etc.

### Framtidssäkra kompetenser (2024-2030)

| Kompetens | Varför viktig | Hur utveckla |
|-----------|--------------|--------------|
| Digital kompetens | Alla branscher digitaliseras | Kurser, certifieringar, praktisk användning |
| Dataanalys | Datadrivna beslut ökar | Excel, SQL, Python, BI-verktyg |
| AI-literatur | AI förändrar alla yrken | Förstå och använda AI-verktyg |
| Kritiskt tänkande | AI kan inte ersätta detta | Öva på att analysera och ifrågasätta |
| Kommunikation | Människor jobbar med människor | Presentationsteknik, skrivande |
| Anpassningsförmåga | Snabba förändringar | Vara öppen för förändring, kontinuerligt lärande |

## Steg 4: Skapa din handlingsplan

### Bryt ner målen i aktiviteter

För varje mål, identifiera:
1. Vilka steg krävs för att nå dit?
2. I vilken ordning ska stegen tas?
3. Hur lång tid tar varje steg?
4. Vilka resurser behövs?
5. Vilka hinder kan uppstå?

### Exempel på handlingsplan

**Mål:** Byta till projektledarroll inom 1 år

| Tidperiod | Aktivitet | Deadline |
|-----------|-----------|----------|
| Månad 1-2 | Gå projektledarkurs online | 28 feb |
| Månad 2-3 | Uppdatera CV med projektfokus | 15 mars |
| Månad 3-4 | Nätverka med 5 projektledare | 30 april |
| Månad 4-6 | Söka 2-3 jobb per vecka | Löpande |
| Månad 6-9 | Ta på mig projektansvar i nuvarande roll | 30 sep |
| Månad 9-12 | Intensifiera jobbsök | Dec |

### Veckoplanering

Schemalägg karriäraktiviteter varje vecka:
- **Måndag:** 1 timme research och jobbsök
- **Onsdag:** 30 min nätverkande (LinkedIn, mejl)
- **Fredag:** 30 min reflektion och planering

### Mall: Din personliga handlingsplan

**3-månadersmål:** ________________________________

| Vecka | Aktivitet | Tid | Status |
|-------|-----------|-----|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |

## Steg 5: Följ upp och justera

### Veckovis uppföljning
- Vad har jag gjort denna vecka?
- Ligger jag i fas med planen?
- Vad ska jag göra nästa vecka?

### Månadsvis utvärdering
- Hur går det mot 3-månadersmålet?
- Behöver jag justera något?
- Vilka lärdomar tar jag med mig?

### Kvartalsvis översyn
- Är mina mål fortfarande relevanta?
- Har något förändrats?
- Ska jag justera min plan?

### Karriärreflektionsfrågor (månadsvis)

1. Vad har jag åstadkommit denna månad?
2. Vad har jag lärt mig om mig själv?
3. Vilka hinder har jag mött? Hur hanterade jag dem?
4. Vad är jag mest stolt över?
5. Vad skulle jag göra annorlunda?
6. Är jag närmare mitt mål än för en månad sedan?
7. Vad är mitt fokus nästa månad?

### När du ska ändra planen
Det är OK att ändra din plan om:
- Du lärt dig något nytt om dig själv
- Omständigheter har förändrats
- Du hittat en bättre väg
- Dina värderingar har ändrats

## Vanliga hinder och lösningar

**"Jag vet inte vad jag vill"**
→ Gör drömjobbsanalysen och testa olika saker. Prata med personer i olika roller. Prova praktik eller volontärarbete.

**"Jag har inte tid"**
→ Börja med 15 minuter per dag – det räcker långt. Använd pendlingstid för podcasts och lärande.

**"Det känns överväldigande"**
→ Fokusera bara på nästa steg, inte hela resan. Bryt ner stora mål i mindre delar.

**"Jag tappar motivationen"**
→ Fira små framsteg och påminn dig om varför du gör detta. Hitta en accountability partner.

**"Jag är för gammal att byta"**
→ Det är aldrig för sent. Din livserfarenhet är en tillgång. Många byter karriär efter 40, 50, även 60.

**"Jag saknar rätt utbildning"**
→ Kartlägg vilka kompetenser som faktiskt krävs. Många roller värdesätter erfarenhet lika högt som formell utbildning.

## Kom ihåg

- En plan behöver inte vara perfekt för att vara användbar
- Det är bättre med en enkel plan du följer än en komplex du ignorerar
- Justera planen när du lär dig mer
- Fira dina framsteg längs vägen!
- Din karriär är ett maraton, inte en sprint

**Nästa steg:** Gör övningen "Planera din karriärväg" för att skapa din personliga plan!`,
    category: 'career-development',
    subcategory: 'career-planning',
    tags: ['karriärplanering', 'mål', 'vision', 'handlingsplan', 'utveckling', 'SMARTA mål', '5-årsplan', 'branschanalys'],
    createdAt: '2024-03-18T10:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z',
    readingTime: 24,
    difficulty: 'medium',
    energyLevel: 'high',
    relatedArticles: ['dromjobbsanalys', 'kompetensportfolj'],
    relatedExercises: ['careerpath', 'dromjobb', 'vidareutbildning', 'forsta-dagen'],
    actions: [
      { label: '📈 Gör övningen: Planera din karriärväg', href: '/exercises', type: 'primary' },
      { label: '🎯 Gör övningen: Drömjobbsanalys', href: '/exercises', type: 'secondary' },
    ],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'dromjobbsanalys',
    title: 'Drömjobbsanalys – från vision till handling',
    summary: 'Definiera ditt drömjobb och skapa en konkret plan för att nå dit.',
    content: `Att ha en tydlig bild av vad du vill åstadkomma är första steget mot att nå dit. Denna guide hjälper dig definiera ditt drömjobb och skapa en konkret plan för att nå dit.

## Varför drömjobbsanalys?

Många söker jobb utan att veta vad de egentligen vill. Det leder till:
- Jobb som inte passar
- Brist på motivation
- Ständiga jobbbyten
- Känsla av att driva runt

Med en tydlig vision kan du:
- Söka rätt jobb från början
- Motivera dig när det är tufft
- Fatta bättre beslut
- Bygga en meningsfull karriär

## Del 1: Dröm stort

### Övning: Den perfekta arbetsdagen

Stäng ögonen och föreställ dig din perfekta arbetsdag om 5 år. Skriv ner allt i detalj:

**Morgonen:**
- Hur vaknar du? Är du stressad eller avslappnad?
- Hur tar du dig till jobbet? Pendlar du, jobbar hemma?
- Vilken tid börjar du?

**Arbetsdagen:**
- Var befinner du dig? Kontor, utomhus, hemma, resande?
- Vilka uppgifter gör du?
- Vem arbetar du med? Ensam, i team, med kunder?
- Hur känns arbetet? Utmanande, kreativt, hjälpande?

**Eftermiddagen och kvällen:**
- Vilken tid slutar du?
- Hur mår du när arbetsdagen är slut?
- Vad har du energi att göra efter jobbet?

### Övning: 20 frågor om ditt drömjobb

Svara snabbt och intuitivt:

**Om arbetet:**
1. Vilka uppgifter vill du göra varje dag?
2. Vilka uppgifter vill du ALDRIG behöva göra?
3. Vill du arbeta med människor, data, saker eller idéer?
4. Vill du ha rutiner eller variation?
5. Vill du lösa problem, skapa nytt eller förvalta?

**Om miljön:**
6. Inomhus eller utomhus?
7. Stort företag eller litet?
8. Etablerat eller startup?
9. Offentlig sektor eller privat?
10. Lokal eller internationell?

**Om livsstil:**
11. Hur mycket vill du tjäna?
12. Hur många timmar vill du jobba per vecka?
13. Hur viktigt är flexibilitet?
14. Vill du kunna jobba hemifrån?
15. Hur mycket resor accepterar du?

**Om mening:**
16. Vad vill du bidra med till världen?
17. Vem vill du hjälpa?
18. Vilket avtryck vill du lämna?
19. Vilka värderingar måste arbetsgivaren dela?
20. Vad skulle göra dig stolt?

## Del 2: Gap-analys

### Vad krävs för drömjobbet?

Researcha vad som faktiskt krävs för din drömroll:

**Formella krav:**
- Vilken utbildning behövs?
- Vilka certifieringar är vanliga?
- Vilka tekniska färdigheter listas i annonser?

**Erfarenhetskrav:**
- Hur många års erfarenhet efterfrågas?
- Vilken typ av erfarenhet räknas?
- Finns det ingångsroller?

**Mjuka krav:**
- Vilka personliga egenskaper nämns?
- Vilken branschkunskap förväntas?
- Vilket nätverk behövs?

### Vad har du redan?

Gör en ärlig inventering av dina resurser:

| Kategori | Vad krävs | Vad har jag | Gap |
|----------|-----------|-------------|-----|
| Utbildning | | | |
| Erfarenhet | | | |
| Tekniska färdigheter | | | |
| Mjuka färdigheter | | | |
| Nätverk | | | |
| Certifieringar | | | |

### Prioritera gapen

Rangordna vad som är viktigast att åtgärda:

1. **Måste ha** – Utan detta kan du inte få jobbet
2. **Bra att ha** – Ökar dina chanser betydligt
3. **Nice to have** – Ger dig en fördel men inte avgörande

## Del 3: Verklighetstest

### Är drömmen realistisk?

Ställ dig dessa frågor:

**Praktiska frågor:**
- Finns det jobb inom detta område?
- Var finns jobben geografiskt?
- Hur ser lönenivån ut?
- Hur ser konkurrensen ut?

**Personliga frågor:**
- Är jag villig att göra det som krävs?
- Passar min livssituation?
- Har jag tålamod att vänta?

### Informationsintervjuer

Prata med 3-5 personer som har ditt drömjobb:
- Hur ser verkligheten ut?
- Stämmer din bild?
- Vad är bra/dåligt med jobbet?
- Hur tog de sig dit?

### Justera vid behov

Det är OK att justera drömmen baserat på ny information. Kanske upptäcker du:
- En liknande roll som passar bättre
- En väg du inte tänkt på
- Att drömmen inte var vad du trodde

## Del 4: Handlingsplan

### Bryt ner till konkreta steg

**Denna vecka:**
- [ ] Skriva ner min drömjobbsversion
- [ ] Researcha 5 jobbannonser för rollen
- [ ] Identifiera 3 personer att kontakta

**Denna månad:**
- [ ] Genomföra 2 informationsintervjuer
- [ ] Påbörja en relevant onlinekurs
- [ ] Uppdatera LinkedIn-profilen

**Kommande 3 månader:**
- [ ] Slutföra grundläggande utbildning
- [ ] Bygga portfolio/visa exempel
- [ ] Börja söka relevanta jobb/praktik

**Kommande år:**
- [ ] Få relevant erfarenhet
- [ ] Bygga nätverk i branschen
- [ ] Positionera mig för drömrollen

### Milstolpar att fira

Definiera konkreta milstolpar:
- Första informationsintervjun genomförd
- Första kursen avslutad
- Första relevanta ansökan skickad
- Första intervjun för relevant roll
- Drömjobbet erbjudet!

## Exempel: Marias drömjobbsanalys

**Drömjobb:** UX-designer på techbolag

**Gap-analys:**
| Krav | Har | Saknar |
|------|-----|--------|
| UX-utbildning | Nej | Ja |
| Portfolio | Nej | Ja |
| Figma | Grundläggande | Avancerat |
| Användarresearch | Har gjort lite | Mer erfarenhet |

**Plan:**
- Månad 1-3: Google UX Design Certificate
- Månad 3-4: Bygga portfolio med 3 projekt
- Månad 4-5: Frilansa småprojekt för erfarenhet
- Månad 5-8: Söka juniorroller

**Resultat:** Maria fick sitt första UX-jobb efter 7 månader!

## Kom ihåg

- Drömjobbet är en riktning, inte en exakt destination
- Det är OK om drömmen förändras
- Små steg varje dag tar dig dit
- Resan är viktig, inte bara målet

Du förtjänar ett jobb du älskar!`,
    category: 'career-development',
    subcategory: 'career-planning',
    tags: ['drömjobb', 'karriär', 'vision', 'mål', 'planering'],
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    readingTime: 13,
    difficulty: 'medium',
    energyLevel: 'high',
    relatedArticles: ['karriarplanering-guide', 'upptack-dina-styrkor'],
    relatedExercises: ['dromjobb'],
    actions: [
      { label: '🎯 Gör övningen: Drömjobbsanalys', href: '/exercises', type: 'primary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  // === FLER NYA ARTIKLAR ===
  {
    id: 'ansokningsstrategi',
    title: 'Effektiv ansökningsstrategi – kvalitet före kvantitet',
    summary: 'Lär dig hur du maximerar chanserna att få intervju genom att skicka färre men bättre ansökningar.',
    content: `Många tror att jobbsökning är en sifferspel – ju fler ansökningar du skickar, desto större chans att få jobb. Men sanningen är att kvalitet nästan alltid slår kvantitet.\n\n## Varför kvalitet över kvantitet?\n\n### Rekryterarens perspektiv\n- En genomtänkt ansökan sticker ut från mängden\n- Massutskickade generiska ansökningar märks direkt\n- Arbetsgivare vill se genuint intresse\n\n### Din energi\n- Färre, bättre ansökningar sparar energi\n- Du hinner följa upp varje ansökan\n- Mindre risk för utbrändhet\n\n## Steg 1: Välj rätt jobb\n\n### Sök inte allt\nInnan du ansöker, fråga dig själv:\n- Matchar jag minst 60% av kraven?\n- Är jag genuint intresserad av jobbet?\n- Passar det mina långsiktiga mål?\n- Kan jag se mig själv trivas där?\n\n### Prioritera\nSätt betyg på varje jobb:\n- **A-prioritet:** Perfekt match, hög intresse – lägg mest tid här\n- **B-prioritet:** Bra match, intressant – lägg medeltid\n- **C-prioritet:** Okej match, kanske – lägg minst tid, skicka om du har tid över\n\n## Steg 2: Skräddarsy varje ansökan\n\n### Analysera annonsen\n- Markera de 3-5 viktigaste kraven\n- Identifiera nyckelord som återkommer\n- Researcha företagets kultur och värderingar\n\n### Anpassa ditt CV\n- Lyft fram erfarenheter som matchar kraven\n- Använd samma nyckelord som i annonsen\n- Prioritera relevanta kompetenser högst upp\n\n### Skriv personligt brev\n- Berätta varför DU passar för just detta jobbet\n- Koppla dina erfarenheter till företagets behov
- Visa att du gjort din hemläxa om företaget\n\n## Steg 3: Följ upp\n\n### När ska du följa upp?\n- Vänta 1 vecka efter deadline\n- Om ingen deadline: vänta 5-7 arbetsdagar\n\n### Hur följer du upp?\n- Skicka ett kort, artigt mejl\n- Fråga om rekryteringsprocessens status\n- Bekräfta ditt fortsatta intresse\n\n## Steg 4: Utvärdera och justera\n\n### Om du inte får svar alls\n- Granska ditt CV – är det tydligt och relevant?\n- Se över ditt personliga brev – är det för generiskt?\n- Be om feedback från arbetskonsulent\n\n### Om du får avslag direkt\n- Kanske söker du jobb utanför din nivå?\n- Saknas det viktiga nyckelord i ditt CV?\n- Behöver du justera dina förväntningar?\n\n## Exempel på veckoplan\n\n**Måndag (2 timmar):**\n- Sök och identifiera 5-10 intressanta jobb\n- Välj ut 3 A-prioriterade att fokusera på\n\n**Tisdag-Onsdag (2-3 timmar per dag):**\n- Skräddarsy CV och personligt brev för varje jobb\n- Researcha företagen grundligt\n- Skicka ansökningarna\n\n**Torsdag (1 timme):**\n- Följ upp tidigare ansökningar\n- Uppdatera din jobbtracker\n\n**Fredag (1 timme):**\n- Utvärdera veckan\n- Planera nästa vecka\n\n## Kom ihåg\n\nDet är bättre att skicka 3 genomtänkta ansökningar än 30 generiska. Kvalitet vinner alltid i längden!`,
    category: 'job-search',
    subcategory: 'application-strategy',
    tags: ['ansökningsstrategi', 'kvalitet', 'effektivitet', 'jobbsökning', 'ansökan'],
    createdAt: '2024-03-25T10:00:00Z',
    updatedAt: '2024-03-25T10:00:00Z',
    readingTime: 16,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'personligt-brev', 'intervju-forberedelser'],
    relatedExercises: ['application', 'coverletter'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'informationsintervju-guide',
    title: 'Informationsintervju – så gör du',
    summary: 'Lär dig hur du genomför ett framgångsrikt informationsmöte som ger värdefull kunskap och nya kontakter.',
    content: `En informationsintervju är ett samtal med någon som arbetar inom ett område du är intresserad av. Det är inte en jobbintervju – det är en chans att lära dig och bygga relationer.\n\n## Vad är en informationsintervju?\n\n### Syftet\n- Lära dig om ett yrke eller företag\n- Få insiderinformation om branschen\n- Bygga ditt nätverk\n- Få tips om hur du tar dig in\n\n### Vad det INTE är\n- En dold jobbintervju\n- En möjlighet att be om jobb\n- En försäljningspitch av dig själv\n\n## Steg 1: Hitta rätt person\n\n### Var hittar du kontakter?\n- LinkedIn – sök på yrkestitel och företag\n- Ditt befintliga nätverk – fråga om de känner någon\n- Alumnnätverk från skola/utbildning\n- Branschevent och mässor\n- Föreningar och nätverk\n\n### Vem ska du kontakta?\n- Personer som har ett jobb du vill veta mer om\n- Personer som arbetar på företag du är intresserad av\n- Personer med liknande bakgrund som du\n\n## Steg 2: Boka mötet\n\n### Skicka ett personligt meddelande\n\n**E-post/LinkedIn-exempel:**\n\n"Hej [Namn],\n\nJag heter [Ditt namn] och jag utforskar just nu karriärmöjligheter inom [bransch/område]. Jag såg att du arbetar som [titel] på [Företag] och jag skulle jättegärna vilja höra mer om din erfarenhet.\n\nSkulle du ha tid för ett kort informationsmöte på 20-30 minuter? Jag kan anpassa mig efter ditt schema – digitalt eller på plats.\n\nJag vill betona att det inte handlar om att be om jobb, utan jag vill lära mig mer om vad din roll innebär och hur du tog dig dit.\n\nTack på förhand!\n\nHälsningar,\n[Ditt namn]"\n\n### Tips för att få svar\n- Var personlig – referera till något specifikt med personen\n- Var tydlig med att det inte är en jobbförfrågan\n- Gör det lätt att säga ja – föreslå konkreta tider\n- Håll det kort och koncist\n\n## Steg 3: Förbered dig\n\n### Researcha personen\n- Läs deras LinkedIn-profil\n- Kolla om de skrivit artiklar eller hållit föredrag
- Förstå deras karriärväg\n\n### Förbered frågor\nVälj 5-8 frågor från listan:\n\n**Om rollen:**\n- Kan du beskriva en typisk arbetsdag?\n- Vad är det bästa med ditt jobb?\n- Vad är mest utmanande?\n\n**Om vägen dit:**\n- Hur tog du dig till din nuvarande roll?\n- Vilken utbildning/erfarenhet har varit mest värdefull?\n- Vad skulle du göra annorlunda om du fick börja om?\n\n**Om branschen:**\n- Vilka trender ser du inom branschen?\n- Vad uppskattar arbetsgivare mest?\n- Vilka kompetenser kommer vara viktiga framöver?\n\n**Om råd:**\n- Vilka råd skulle du ge någon som vill in i branschen?\n- Finns det någon annan du rekommenderar att jag pratar med?\n- Vilka event eller organisationer ska jag kolla in?\n\n## Steg 4: Under mötet\n\n### Struktur (20-30 minuter)\n\n**Inledning (2-3 min):**\n- Tacka för tiden\n- Förklara kort din bakgrund och intresse\n- Bekräfta tidsramen\n\n**Huvuddel (15-20 min):**\n- Ställ dina förberedda frågor\n- Lyfta följdfrågor baserat på svaren\n- Låt personen prata – lyssna aktivt!\n\n**Avslutning (3-5 min):**\n- Fråga om råd för nästa steg\n- Be om rekommendationer på andra kontakter\n- Tacka för tiden\n\n### Viktigt att tänka på\n- **Var punktlig** – respektera personens tid\n- **Ta anteckningar** – men inte så mycket att det stör samtalet\n- **Var genuint nyfiken** – visa intresse för svaren\n- **Sälj inte dig själv** – fokusera på att lära dig\n- **Respektera tiden** – avsluta i tid även om det går bra\n\n## Steg 5: Efter mötet\n\n### Skicka tackbrev\nInom 24 timmar, skicka ett kort tack:\n\n"Hej [Namn],\n\nTack så mycket för att du tog dig tid att träffa mig idag! Jag lärde mig massor om [specifikt ämne] och din väg till [roll] var verkligen inspirerande.\n\nJag ska följa upp dina tips om [vad de rekommenderade] och jag ser fram emot att [nästa steg].\n\nJag uppskattar verkligen att du delade med dig av din tid och erfarenhet.\n\nMed vänliga hälsningar,\n[Ditt namn]"\n\n### Följ upp\n- Använd informationen du fick\n- Kontakta eventuella nya personer de rekommenderade\n- Håll kontakten – skicka ett uppföljningsmejl om några månader\n\n## Vanliga misstag att undvika\n\n❌ **Att be om jobb** – Det är inte syftet med ett informationsmöte\n❌ **Att vara oberedd** – Det slösar bådas tid\n❌ **Att prata för mycket om dig själv** – Fokusera på att lyssna\n❌ **Att inte följa upp** – Tackbrevet är obligatoriskt\n❌ **Att glömma bort mötet** – Respektera att personen tar sig tid\n\n## Kom ihåg\n\nDe flesta människor älskar att prata om sig själva och sitt jobb. Om du är genuint intresserad och visar uppskattning, kommer de flesta gärna hjälpa dig!`,
    category: 'networking',
    subcategory: 'informational-interviews',
    tags: ['informationsintervju', 'nätverkande', 'informationssamtal', 'karriär', 'kontakter'],
    createdAt: '2024-03-26T10:00:00Z',
    updatedAt: '2024-03-26T10:00:00Z',
    readingTime: 18,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['natverka-for-jobb', 'linkedin-optimering'],
    relatedExercises: ['networking'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'sociala-medier-jobsokning',
    title: 'Sociala medier i jobbsökningen – mer än LinkedIn',
    summary: 'Hur du kan använda Facebook, Instagram, Twitter och andra plattformar för att hitta jobb och bygga din professionella närvaro.',
    content: `LinkedIn är den självklara plattformen för jobbsökning, men andra sociala medier kan också vara kraftfulla verktyg – om du använder dem rätt.\n\n## Varför andra plattformar?\n\n### Olika målgrupper\n- LinkedIn = formellt nätverkande\n- Facebook = community-grupper och informella nätverk\n- Instagram = visuella branscher och kreativa yrken\n- Twitter/X = branschdiskussioner och tankar\n\n### Mindre konkurrens\nFärre jobbsökare är aktiva på alternativa plattformar, så du sticker ut mer.\n\n## Facebook för jobbsökning\n\n### Grupper att gå med i\n- Branschspecifika grupper (t.ex. "Frontend-utvecklare Sverige")\n- Lokala jobbgrupper (t.ex. "Jobb i Stockholm")\n- Yrkesnätverk (t.ex. "Marknadsförare i Sverige")\n- Alumni-grupper från din skola/utbildning\n\n### Hur du använder grupperna\n- Följ reglerna för varje grupp\n- Engagera dig i diskussioner innan du ber om hjälp\n- Dela intressant innehåll och insikter\n- Be om råd, inte jobb direkt\n\n### Företagssidor\n- Gilla företag du är intresserad av\n- Kommentera på deras inlägg med tankeväckande input\n- Skicka DM om du har specifika frågor\n\n## Instagram för jobbsökning\n\n### Perfekt för kreativa branscher\n- Design och konst\n- Mode och skönhet\n- Mat och restaurang\n- Fotografering och film\n\n### Så bygger du din profil\n- Skapa en professionell bio med vad du gör\n- Lägg till kontaktinfo och länk till portfolio\n- Posta ditt arbete regelbundet\n- Använd relevanta hashtags (#grafiskdesigner #sökerjobb)\n\n### Nätverka på Instagram\n- Följ företag och personer i din bransch\n- Kommentera genuint på inlägg\n- Skicka DM med specifika frågor\n- Använd Stories för att visa "bakom kulisserna"\n\n## Twitter/X för jobbsökning\n\n### Bygg ditt varumärke\n- Dela tankar om din bransch\n- Kommentera på trender och nyheter\n- Retweeta med insiktsfulla kommentarer\n- Delta i branschchatter\n\n### Hitta jobb\n- Följ företag och rekryterare\n- Använd sökfunktionen för "hiring" + din bransch\n- Delta i Twitter-chatter om relevanta ämnen\n\n## TikTok för jobbsökning\n\n### Växande trend\nAllt fler använder TikTok för karriärinnehåll:\n- "Day in the life"-videor från olika yrken\n- Karriärråd och tips\n- Företag som rekryterar\n\n### Om du är bekväm med video\n- Skapa korta videor om din kompetens\n- Dölj vad du söker\n- Använd hashtags som #jobbsökning #karriär\n\n## Viktigt att tänka på\n\n### Håll det professionellt\n- Gå igenom dina gamla inlägg – är det något som kan misstolkas?\n- Ställ in sekretess på privata konton\n- Tänk på att arbetsgivare kan söka upp dig\n\n### Konsekvens är nyckeln\n- Samma profilbild över plattformar\n- Samma namn och titel\n- Samma kontaktinformation\n\n### Var aktiv\n- Det räcker inte att bara finnas där\n- Engagera dig regelbundet\n- Dela värdefullt innehåll\n\n## Vanliga misstag\n\n❌ Att vara för formell på informella plattformar\n❌ Att endast be om jobb utan att ge värde\n❌ Att ignorera direktmeddelanden\n❌ Att posta samma innehåll på alla plattformar\n❌ Att vara oaktiv i veckor\n\n## Kom ihåg\n\nOlika plattformar passar olika branscher. Var du ska fokusera beror på vart din målgrupp finns. Men LinkedIn är fortfarande grunden för de flesta!`,
    category: 'digital-presence',
    subcategory: 'social-media',
    tags: ['sociala medier', 'Facebook', 'Instagram', 'Twitter', 'TikTok', 'digital närvaro'],
    createdAt: '2024-03-27T10:00:00Z',
    updatedAt: '2024-03-27T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['linkedin-optimering', 'bygg-ditt-personliga-varumarke'],
    relatedExercises: ['personligt-varumarke'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'karriarvaxling-guide',
    title: 'Karriärväxling – så byter du bana',
    summary: 'En komplett guide för dig som funderar på att byta bransch eller roll.',
    content: `Att byta karriärväg kan kännas både spännande och skrämmande. Men med rätt strategi kan du göra en framgångsrik övergång.\n\n## Varför byta karriärväg?\n\n### Vanliga anledningar\n- Du känner dig inte längre motiverad\n- Branschen förändras eller krymper\n- Du vill ha bättre villkor eller lön\n- Du upptäcker ett nytt intresse\n- Du vill ha mer meningsfullt arbete\n\n### Innan du bestämmer dig\nÄr det karriären du vill byta, eller bara jobbet?\n- Prova att byta arbetsplats inom samma bransch först\n- Undersök om det är rollen eller miljön som är problemet\n\n## Steg 1: Identifiera ditt mål\n\n### Vad vill du göra istället?\n- Vilka delar av ditt nuvarande jobb tycker du om?\n- Vilka uppgifter skulle du vilja göra mer av?\n- Vilka värderingar är viktiga för dig?\n\n### Researcha nya roller\n- Informationsintervjuer med personer i målrollen\n- Läs jobbannonser – vilka krav ställs?\n- Kolla lönestatistik och arbetsmarknad\n\n## Steg 2: Gap-analys\n\n### Vad har du redan?\n- Många kompetenser är överförbara (ledarskap, kommunikation, problemlösning)\n- Din livserfarenhet räknas\n- Kontakter från tidigare roller kan hjälpa\n\n### Vad saknar du?\n- Formell utbildning?\n- Specifik erfarenhet?\n- Certifieringar?\n- Tekniska färdigheter?\n\n## Steg 3: Planera övergången\n\n### Alternativ 1: Direktväxling\nSök jobb inom det nya området direkt.\n**För:** Snabbast väg till ny roll\n**Kräver:** Tydliga överförbara kompetenser eller lågkonkurrens\n\n### Alternativ 2: Stegvis övergång\nHitta en roll som kombinerar gammalt och nytt.\n**Exempel:** Lärare → Utbildningskoordinator inom företag\n\n### Alternativ 3: Kompetensutveckling först\nSkaffa nödvändig utbildning innan du byter.\n**För:** När formell kompetens krävs\n**Kräver:** Tid och ofta ekonomiska resurser\n\n### Alternativ 4: Sidospar\nBygg upp erfarenhet parallellt med nuvarande jobb.\n**Exempel:** Frilansa, volontärarbete, egna projekt\n\n## Steg 4: Bygg din berättelse\n\n### Din "varför"-berättelse\nVar beredd att förklara:\n- Varför du vill byta\n- Vad som driver dig till det nya området\n- Hur dina tidigare erfarenheter är relevanta\n\n### Exempel:\n"Efter 5 år inom kundtjänst har jag utvecklat starka kommunikationsfärdigheter och en förståelse för kundbehov. Nu vill jag ta nästa steg inom UX-design för att kombinera min användarinsikt med kreativ problemlösning."\n\n## Steg 5: Nätverka strategiskt\n\n### Bygg nya kontakter\n- Gå med i branschorganisationer\n- Delta i event och meetups\n- Följ och engagera dig i nya nätverk online\n\n### Be om råd, inte jobb\n"Jag funderar på att gå inom [nytt område] – skulle du kunna ge råd om [specifik fråga]?"\n\n## Steg 6: Få erfarenhet\n\n### Praktiska sätt att bygga erfarenhet\n- **Praktik eller prövning** – även kortare perioder räknas\n- **Volontärarbete** – ideella organisationer behöver alltid hjälp\n- **Sidoprojekt** – skapa något som visar dina färdigheter\n- **Freelance** – mindre uppdrag för att bygga portfolio\n- **Interna projekt** – kan du byta roll inom nuvarande företag?\n\n## Steg 7: Sök jobb\n\n### Anpassa din ansökan\n- Lyft fram överförbara kompetenser\n- Förklara karriärväxlingen positivt\n- Visa entusiasm för det nya området\n- Inkludera relevanta projekt och erfarenheter\n\n### Var realistisk\n- Du kanske behöver börja på en lägre nivå\n- Var beredd på att det tar tid\n- Överväg övergångsrollerna först\n\n## Vanliga hinder och lösningar\n\n**"Jag är för gammal"** → Aldrig! Många byter karriär vid 40, 50, 60+\n\n**"Jag kan inte sänka min lön"** → Planera en övergång över tid, eller hitta mellansteg\n\n**"Jag vet inte vad jag vill göra istället"** → Gör intresseguiden, informationsintervjuer, testa olika saker\n\n**"Jag saknar rätt utbildning"** → Kompetens kan skaffas på många sätt, inte bara formellt\n\n## Gör övningen\n\n"Planera ett karriärskifte" hjälper dig strukturera processen och identifiera dina överförbara kompetenser.`,
    category: 'career-development',
    subcategory: 'career-change',
    tags: ['karriärväxling', 'byta karriär', 'karriärbyte', 'omskolning', 'nytt jobb'],
    createdAt: '2024-03-28T10:00:00Z',
    updatedAt: '2024-03-28T10:00:00Z',
    readingTime: 19,
    difficulty: 'medium',
    energyLevel: 'high',
    relatedArticles: ['karriarplanering-guide', 'kompetensutveckling-guide', 'praktik-som-vag-in'],
    relatedExercises: ['karriarskifte'],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'forsta-dagen-nytt-jobb',
    title: 'Första dagen på nya jobbet – gör succé från start',
    summary: 'Praktiska tips för att få en smidig start och göra ett gott intryck från dag ett.',
    content: `Första dagen på nya jobbet kan vara både spännande och nervös. Här är hur du förbereder dig för att göra en succéstart.\n\n## Före första dagen\n\n### Praktiska förberedelser\n- **Testa resvägen** – åt en gång i förväg så du vet exakt hur lång tid det tar\n- **Planera för marginaler** – kom 10-15 minuter tidigt första dagen\n- **Förbered klädsel** – lägg fram kläder kvällen innan\n- **Packa väskan** – ID-kort, anteckningsblock, penna, lunch\n\n### Information att samla in\n- Vilken tid ska du vara där?\n- Vem ska du fråga efter vid ankomst?\n- Finns det en reception eller växel?\n- Behöver du något speciellt med dig?\n\n## Första dagen – morgonen\n\n### På vägen dit\n- Var ute i god tid – stressa inte\n- Lyssna på något som ger dig energi\n- Visualisera en positiv dag\n\n### Vid ankomst\n- Presentera dig själv med ett leende\n- Ha ditt ID-kort redo\n- Var öppen och mottaglig\n\n## Under introduktionen\n\n### Anteckna mycket\nSkriv ner:\n- Namn på kollegor (rita en karta över kontoret med namn)\n- Viktiga rutiner och system\n- Lösenord och inloggningar (förvara säkert!)\n- Frågor som dyker upp\n\n### Ställ frågor\nIngen förväntar sig att du kan allt. Bra frågor:\n- "Hur fungerar [system/rutin]?"\n- "Vem kan jag fråga om [område]?"\n- "Vad förväntas av mig första veckan?"\n\n### Lär känna teamet\n- Var nyfiken på dina kollegor\n- Fråga om deras roller\n- Hitta naturliga samtalsämnen\n- Föreslå lunch eller fika med några kollegor\n\n## Första veckan\n\n### Bygg relationer\n- Boka korta möten med nyckelpersoner\n- Fråga kollegor om deras erfarenheter\n- Visa uppskattning för hjälp du får\n\n### Lär dig rutiner\n- Vilka möten är återkommande?\n- Vilka deadlines finns närmaste tiden?\n- Hur kommunicerar teamet? (Slack, e-post, möten?)\n\n### Sätt upp ditt arbetsutrymme\n- Organisera ditt skrivbord\n- Sätt upp verktyg och system\n- Gör det personligt (men inte för personligt än)\n\n## Första månaden\n\n### Tidiga framgångar\n- Sök efter snabba vinster du kan bidra med\n- Leverera det du lovar i tid\n- Var pålitlig och punktlig\n\n### Be om feedback\n- Efter första veckan: "Hur tycker du det går hittills?"\n- Var öppen för konstruktiv kritik\n- Visa att du vill lära och utvecklas\n\n### Balans\n- Ta inte på dig för mycket för snabbt\n- Prioritera att lära dig grunderna först\n- Det är okej att inte veta allt\n\n## Vanliga misstag att undvika\n\n❌ **Att jämföra med gamla jobbet** – "På mitt förra jobb gjorde vi så här..."\n❌ **Att ha för bråttom** – Vill du ändra för mycket för snabbt\n❌ **Att vara för tyst** – Ställ frågor, engagera dig\n❌ **Att äta lunch ensam** – Passa på att lära känna folk\n❌ **Att ignorera företagskulturen** – Observe and adapt\n\n## Gör övningen\n\n"Förberedelser inför första dagen" hjälper dig planera och förbereda dig mentalt för din nya roll.`,
    category: 'career-development',
    subcategory: 'new-job',
    tags: ['nytt jobb', 'första dagen', 'introduktion', 'ny roll', 'jobbstart'],
    createdAt: '2024-03-29T10:00:00Z',
    updatedAt: '2024-03-29T10:00:00Z',
    readingTime: 13,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['arbetsmiljo-guide', 'anstallningsformer-guide'],
    relatedExercises: ['forsta-dagen'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'arbetsmarknadstrender-2024',
    title: 'Arbetsmarknadstrender 2024 – vad efterfrågas?',
    summary: 'De största trenderna på arbetsmarknaden och vilka kompetenser som efterfrågas just nu.',
    content: `Att förstå arbetsmarknadens trender hjälper dig fatta smarta beslut om din karriär. Här är vad som händer just nu.\n\n## Megatrender som påverkar arbetsmarknaden\n\n### Digitalisering och AI\n- Automatisering ersätter rutinuppgifter\n- Nya jobb skapas inom tech och AI\n- Mänskliga färdigheter som kreativitet och empati blir mer värdefulla\n\n### Hållbarhet\n- Gröna jobb ökar explosionsartat\n- Alla branscher behöver hållbarhetskompetens\n- ESG (Environmental, Social, Governance) blir standard\n\n### Demografiska förändringar\n- Arbetskraftsbrist inom många områden\n- Äldre arbetare stannar längre\n- Fler generationer på samma arbetsplats\n\n## Hetaste kompetenserna 2024\n\n### Tekniska kompetenser\n- AI och maskininlärning\n- Dataanalys\n- Cybersäkerhet\n- Molntjänster\n- Programmering (Python, JavaScript)\n\n### Mänskliga färdigheter (soft skills)\n- Anpassningsförmåga\n- Kritiskt tänkande\n- Kreativitet\n- Emotionell intelligens\n- Kommunikation\n\n### Branschspecifikt\n- Vård och omsorg – alltid brist\n- Bygg och industri – stora pensionsavgångar\n- Utbildning – lärarbrist\n- Tech – fortsatt stark efterfrågan\n\n## Nya arbetssätt\n\n### Hybridarbete är här för att stanna\n- De flesta kontorsjobb erbjuder flexibilitet\n- Krav på digital kompetens ökar\n- Distansarbete öppnar nya möjligheter\n\n### Gig-ekonomin växer\n- Fler arbetar som frilansare\n- Plattformsekonomin expanderar\n- Kombination av anställning och eget företagande\n\n### Livslångt lärande\n- Kompetenser blir föråldrade snabbare\n- Utbildning är en kontinuerlig process\n- Mikro-certifieringar blir vanligare\n\n## Jobb med störst brist\n\n### Topp 10 bristyrken i Sverige\n1. Sjuksköterskor och undersköterskor\n2. Lärare och förskollärare\n3. Civilingenjörer\n4. Systemutvecklare\n5. Byggarbetare och hantverkare\n6. Ekonomer och redovisningskonsulter\n7. Elektriker\n8. Läkare\n9. Chefer inom IT och verksamhet\n10. Psykologer\n\n## Så använder du trenderna\n\n### Om du söker jobb nu\n- Lyft fram digital kompetens\n- Betona soft skills\n- Var öppen för nytt sätt att arbeta\n- Sök inom bristyrken för snabbare väg in\n\n### Om du planerar karriären\n- Satsa på kompetenser som åldras väl\n- Kombinera tekniska och mänskliga färdigheter\n- Håll dig uppdaterad om din bransch\n- Var beredd på att lära nytt kontinuerligt\n\n### Om du vill byta bana\n- Tech är säkert men konkurrensen ökar\n- Vård och omsorg ger garanterat jobb\n- Hållbarhet är framtidens område\n- Kombinera gammal erfarenhet med ny kompetens\n\n## Kom ihåg\n\nTrender kommer och går, men grundläggande arbetsmarknadskunskap är alltid värdefullt. Fokusera på att bygga en stark grund av kompetenser som håller över tid!`,
    category: 'job-market',
    subcategory: 'trends',
    tags: ['trender', 'arbetsmarknad', '2024', 'kompetenser', 'bristyrken', 'framtid'],
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-04-01T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['branscher-brist', 'kompetensutveckling-guide'],
    relatedTools: ['/interest-guide'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'cv-mallar-exempel',
    title: 'CV-mallar och exempel för olika situationer',
    summary: 'Färdiga mallar och konkreta exempel för olika typer av jobbsökare – från nybörjare till erfarna.',
    content: `Att skriva CV från scratch kan vara svårt. Här är mallar och exempel som hjälper dig komma igång.\n\n## Grundstruktur för alla CV:n\n\n### 1. Kontaktuppgifter\n- Namn (stort och tydligt)\n- Telefonnummer\n- E-postadress (proffsig!)\n- LinkedIn-profil (valfritt)\n- Ort (valfritt)\n\n### 2. Profil/Sammanfattning\n3-5 meningar som sammanfattar:\n- Vem du är\n- Vad du kan\n- Vad du söker\n\n### 3. Arbetslivserfarenhet\nOmvänd kronologisk ordning (senaste först)\n\n### 4. Utbildning\nOmvänd kronologisk ordning\n\n### 5. Kompetenser\n- Färdigheter\n- Språk\n- Certifieringar\n\n## Mall 1: För dig med erfarenhet\n\n**Profil:**\n"Resultatorienterad [yrke] med [antal] års erfarenhet av [område]. Stark inom [nyckelkompetens 1] och [nyckelkompetens 2]. Söker nya utmaningar inom [område] där jag kan bidra med [vad du erbjuder]."\n\n**Erfarenhet:**\n"[Titel] | [Företag] | [Månad År] – [Månad År]\n- Ansvarade för [ansvarsområde]\n- Uppnådde [resultat med siffror]\n- Drev [projekt/initiativ] som ledde till [utfall]"\n\n## Mall 2: För dig utan erfarenhet\n\n**Profil:**\n"Motiverad och läraktig [titel/utbildning] med stark drivkraft att utvecklas inom [bransch]. Har goda [kompetenser] från [utbildning/erfarenhet]. Söker möjlighet att bidra och växa på [företagtyp]."\n\n**Erfarenhet (ersätt med):**\n- Praktikplatser\n- Sommarjobb\n- Ideellt arbete\n- Projekt i skolan\n- Egna initiativ\n\n## Mall 3: För karriärväxling\n\n**Profil:**\n"[Yrke] med [antal] års erfarenhet inom [nuvarande bransch] som nu vill överföra mina kompetenser inom [nyckelkompetenser] till [ny bransch/roll]. Stark inom [överförbar kompetens] och [överförbar kompetens]."\n\n**Tips:**\n- Lyft fram överförbara kompetenser\n- Förklara varför du byter bana\n- Visa genuint intresse för nya området\n\n## Mall 4: För seniora positioner\n\n**Profil:**\n"Erfaren [yrke] och ledare med [antal] års dokumenterad framgång inom [områden]. Specialiserad på [expertisområden]. Har lett team om [storlek] och drivit [typer av projekt]."\n\n**Fokus på:**\n- Ledarskap och strategiskt arbete\n- Resultat och affärspåverkan\n- Större projekt och initiativ\n- Branschnätverk\n\n## Exempel på resultat (med siffror)\n\n### Försäljning:\n- "Ökade försäljningen med 25% under första kvartalet"\n- "Hanterade en kundportfölj värd 10 Mkr"\n\n### Projektledning:\n- "Ledde ett team om 8 personer i ett projekt värt 5 Mkr"\n- "Levererade 15 projekt i tid och inom budget"\n\n### Kundservice:\n- "Uppnådde 95% kundnöjdhet"\n- "Hanterade 50+ ärenden dagligen"\n\n### Effektivisering:\n- "Effektiviserade processer som sparade 20 timmar/vecka"\n- "Reducerade kostnader med 15%"\n\n## Vanliga misstag att undvika\n\n❌ Allmänna påståenden utan bevis – "Jag är bra på sälj"\n✅ Konkreta resultat – "Jag ökade försäljningen med 20%"\n\n❌ För långt – mer än 2 sidor\n✅ Koncist – 1-2 sidor är perfekt\n\n❌ Ett CV för alla jobb\n✅ Anpassat för varje ansökan\n\n❌ Stavfel och slarv\n✅ Korrekturläst av dig och någon annan\n\n## Ladda ner mallar\n\nDu kan ladda ner Word-mallar för alla dessa varianter i vår CV-generator. Där kan du också få automatiska förslag på formuleringar baserat på din information!`,
    category: 'tools',
    subcategory: 'templates',
    tags: ['CV-mallar', 'mallar', 'exempel', 'CV', 'dokumentmallar', 'jobbsökning'],
    createdAt: '2024-04-02T10:00:00Z',
    updatedAt: '2024-04-02T10:00:00Z',
    readingTime: 16,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'cv-utan-erfarenhet'],
    relatedTools: ['/cv-builder'],
    actions: [
      { label: '📝 Öppna CV-generatorn', href: '/cv-builder', type: 'primary' },
    ],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'ordlista-jobbsokning',
    title: 'Ordlista för jobbsökare – A till Ö',
    summary: 'Förstå alla begrepp och förkortningar du stöter på under jobbsökningen.',
    content: `Jobbsökning kommer med en hel del termer och förkortningar som kan vara förvirrande. Här är din guide till de vanligaste!

## A

**Allmän visstidsanställning (AVA)**
En tidsbegränsad anställning som inte behöver ha något särskilt skäl. Max 24 månader hos samma arbetsgivare under en femårsperiod.

**Anställningsbevis**
Ett skriftligt dokument som bekräftar din anställning med villkor som lön, arbetstid och anställningsform.

**Arbetsförmedlingen (AF)**
Statlig myndighet som hjälper arbetssökande hitta jobb och arbetsgivare hitta personal.

**ATS (Applicant Tracking System)**
Programvara som arbetsgivare använder för att hantera ansökningar. Automatiserar screening av CV:n genom att söka efter nyckelord.

## B

**Bemanningsföretag**
Företag som hyr ut personal till andra företag. Du är anställd hos bemanningsföretaget men arbetar hos kunden.

**Bristyrke**
Ett yrke där det finns fler lediga jobb än arbetssökande med rätt kompetens.

## C

**CV (Curriculum Vitae)**
Latin för "livets gång". Ditt dokument som sammanfattar utbildning, erfarenhet och kompetenser.

**Cover letter**
Engelska för personligt brev. Brevet som följer med din ansökan och förklarar varför du söker jobbet.

## D

**Diskrimineringslagen**
Lag som förbjuder arbetsgivare att särbehandla dig på grund av kön, könsöverskridande identitet, etnisk tillhörighet, religion, funktionsnedsättning, sexuell läggning eller ålder.

## E

**Entry-level**
Jobb för nybörjare som inte kräver tidigare erfarenhet inom området.

**Egenanställning**
Du fakturerar via ett egenanställningsföretag istället för att starta eget. Företaget sköter administration mot en avgift.

## F

**Fast anställning**
Se Tillsvidareanställning.

**Frilans**
Att arbeta självständigt och sälja sina tjänster till olika uppdragsgivare utan fast anställning.

**Förhandlingsbar lön**
Lönen är inte fastställd utan kan diskuteras vid anställning.

## G

**Gigekonomin**
Arbetsmarknad baserad på korta uppdrag och tillfälliga anställningar istället för fasta jobb.

## H

**Headhunter**
Rekryterare som aktivt söker upp lämpliga kandidater, ofta för chefspositioner.

**HR (Human Resources)**
Personalavdelningen på ett företag. Ansvarar ofta för rekrytering.

**Hybridarbete**
Kombination av arbete på kontoret och hemarbete.

## I

**Internship**
Engelska för praktik. En tidsbegränsad period där du får arbetslivserfarenhet.

## J

**Jobbcoach**
Person som hjälper dig med jobbsökningen genom vägledning och stöd.

## K

**Kollektivavtal**
Avtal mellan fackförbund och arbetsgivarorganisation som reglerar löner och villkor för en hel bransch.

**Konkurrensklausul**
Avtalsvillkor som begränsar din möjlighet att börja hos konkurrenter efter anställningen.

**Kompetensbaserad rekrytering**
Rekryteringsmetod som fokuserar på kandidatens kompetenser och beteenden snarare än formella meriter.

## L

**LAS (Lagen om anställningsskydd)**
Lag som reglerar anställningsvillkor, uppsägningar och turordning.

**LinkedIn**
Professionellt socialt nätverk för karriär och jobbsökning.

**LIA (Lärande i arbete)**
Praktikperiod som ingår i yrkeshögskoleutbildningar.

## M

**Matchning**
Processen att hitta rätt kandidat för ett jobb eller rätt jobb för en kandidat.

**Meritlista**
Se CV.

## N

**Networking**
Engelska för nätverkande. Att bygga och underhålla professionella kontakter.

**Nystartsjobb**
Stödform där arbetsgivaren får ekonomiskt bidrag för att anställa arbetssökande som stått utanför arbetsmarknaden.

## O

**OB-tillägg (Obekväm arbetstid)**
Extra ersättning för arbete på kvällar, nätter och helger.

**Onboarding**
Processen när en ny anställd introduceras på arbetsplatsen.

## P

**Personligt brev**
Brev som kompletterar CV:t och förklarar varför du är rätt för jobbet.

**Provanställning**
En inledande period (max 6 månader) där båda parter kan avsluta anställningen utan uppsägningstid.

## R

**Referens**
Person som kan intyga din kompetens och lämplighet för en arbetsgivare.

**Rekryterare**
Person som arbetar med att hitta och anställa personal.

## S

**STAR-metoden**
Intervjuteknik: Situation, Task (uppgift), Action (handling), Result (resultat). Används för att svara på beteendefrågor.

**Spontanansökan**
Ansökan till ett företag utan att de har en utlyst tjänst.

## T

**Tillsvidareanställning**
Anställning utan slutdatum som gäller tills någon säger upp den. Kallas också fast anställning.

**Turordning**
Regler i LAS om i vilken ordning anställda sägs upp ("sist in, först ut").

## U

**Undersköterska (USK)**
Ett bristyrke inom vård och omsorg.

**Uppsägningstid**
Tiden mellan uppsägning och sista arbetsdag. Regleras i avtal eller lag.

## V

**Vikariat**
Tidsbegränsad anställning där du ersätter någon som är frånvarande.

**Visstidsanställning**
Samlingsbegrepp för tidsbegränsade anställningar (vikariat, säsong, projekt, allmän visstid).

## Y

**YH (Yrkeshögskola)**
Eftergymnasial utbildning med nära koppling till arbetslivet.

## Ö

**Öppen arbetsmarknad**
Jobb som tillsätts utan subventioner eller särskilt stöd.

## Saknar du något?

Stöter du på ett begrepp du inte förstår? Fråga din arbetskonsulent – de hjälper gärna till!`,
    category: 'tools',
    subcategory: 'glossary',
    tags: ['ordlista', 'begrepp', 'termer', 'förkortningar', 'verktyg'],
    createdAt: '2024-04-08T10:00:00Z',
    updatedAt: '2024-04-08T10:00:00Z',
    readingTime: 12,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['komma-igang-intro', 'anstallningsformer-guide'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  // === NYA ARTIKLAR FÖR SAKNADE OMRÅDEN ===

  {
    id: 'kompetensutveckling-guide',
    title: 'Kompetensutveckling – vägar till ny kunskap',
    summary: 'Guide till utbildningsmöjligheter, stöd och hur du utvecklar dina färdigheter under jobbsökningen.',
    content: `Att utveckla nya kompetenser ökar dina chanser på arbetsmarknaden. Här är dina möjligheter.

## Varför kompetensutveckling?

- Arbetsmarknaden förändras snabbt
- Nya kompetenser öppnar nya dörrar
- Det visar arbetsgivare att du är motiverad
- Du blir mer konkurrenskraftig

## Utbildningsmöjligheter

### Arbetsmarknadsutbildning
Via Arbetsförmedlingen kan du få:
- Yrkesinriktad utbildning inom bristyrken
- Validering av befintlig kompetens
- Korta kurser för specifika färdigheter

**Fördelar:**
- Gratis
- Aktivitetsstöd under utbildningen
- Ofta praktik inkluderad

### Yrkeshögskola (YH)
Eftergymnasial utbildning med nära koppling till arbetslivet.

**Kännetecken:**
- 1-3 år
- LIA (Lärande i arbete) ingår
- Hög anställningsgrad efter examen
- CSN-berättigad

### Komvux
Kommunal vuxenutbildning för att:
- Komplettera grundskole- eller gymnasiebetyg
- Läsa enstaka kurser
- Byta inriktning

### Folkhögskola
Alternativ utbildningsform med:
- Bred inriktning
- Social gemenskap
- Möjlighet till högskolebehörighet

### Onlinekurser och certifieringar
Flexibelt lärande via:
- LinkedIn Learning
- Coursera, Udemy
- Google, Microsoft-certifieringar
- Branschspecifika kurser

## Finansiering av studier

### CSN (Centrala studiestödsnämnden)
- Studiemedel: bidrag + lån
- Omställningsstudiestöd för yrkesverksamma
- Krav: vara inskriven på godkänd utbildning

### Omställningsstöd
Om du blivit uppsagd kan du ha rätt till:
- Rådgivning och vägledning
- Ekonomiskt stöd för studier
- Hjälp med jobbsökning

### Arbetsförmedlingens stöd
- Aktivitetsstöd under arbetsmarknadsutbildning
- Stöd för yrkesintroduktion
- Praktikplatser

## Validering – visa vad du redan kan

Validering innebär att få dina kunskaper och erfarenheter bedömda och dokumenterade.

**Passar dig som:**
- Har yrkeserfarenhet men saknar formella bevis
- Har utländsk utbildning
- Vill byta bransch och visa överförbar kompetens

**Kontakta:**
- Arbetsförmedlingen
- Branschorganisationer
- Yrkeshögskolor

## Så väljer du rätt utbildning

### Frågor att ställa dig själv
1. Vad vill jag jobba med?
2. Vilka kompetenser saknar jag?
3. Hur lång tid har jag?
4. Hur finansierar jag det?

### Researcha arbetsmarknaden
- Vilka yrken har brist?
- Vilka kompetenser efterfrågas i annonser?
- Vad säger branschrapporter?

### Prata med andra
- Informationsintervjuer med yrkesverksamma
- Kontakta utbildningsanordnare
- Diskutera med din arbetskonsulent

## Tips för att lyckas med studier

- **Sätt tydliga mål** – varför gör du detta?
- **Skapa rutiner** – behandla studier som jobb
- **Sök stöd** – använd studievägledare
- **Nätverka** – dina klasskamrater blir framtida kontakter
- **Kombinera teori och praktik** – sök praktik under studietiden

## Kom ihåg

Det är aldrig för sent att lära sig något nytt. Varje ny kompetens är en investering i din framtid!`,
    category: 'career-development',
    subcategory: 'skills-development',
    tags: ['kompetensutveckling', 'utbildning', 'kurser', 'yrkeshögskola', 'CSN', 'validering'],
    createdAt: '2024-04-10T10:00:00Z',
    updatedAt: '2024-04-10T10:00:00Z',
    readingTime: 14,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['karriarplanering-guide', 'karriarvaxling-guide', 'arbetsmarknadstrender-2024'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'ats-optimering',
    title: 'ATS-optimering – få ditt CV förbi datorn',
    summary: 'Lär dig hur rekryteringssystem fungerar och hur du anpassar ditt CV för att bli sedd.',
    content: `Många arbetsgivare använder ATS (Applicant Tracking System) för att sortera ansökningar. Så här ser du till att ditt CV kommer fram.

## Vad är ett ATS?

ATS (Applicant Tracking System) är mjukvara som:
- Automatiskt skannar och sorterar CV:n
- Söker efter nyckelord som matchar jobbannonsen
- Rankar kandidater baserat på matchning
- Filtrerar bort ansökningar som inte uppfyller kraven

**Statistik:** Upp till 75% av alla CV:n avvisas av ATS innan en människa ser dem!

## Hur fungerar det?

### Steg 1: Parsing
ATS-systemet läser ditt CV och försöker förstå strukturen:
- Kontaktuppgifter
- Arbetslivserfarenhet
- Utbildning
- Kompetenser

### Steg 2: Nyckelordsmatchning
Systemet jämför ditt CV med jobbannonsen:
- Specifika färdigheter
- Utbildningskrav
- Erfarenhetsnivå
- Certifieringar

### Steg 3: Ranking
Kandidater rankas baserat på hur väl de matchar kraven.

## Så optimerar du ditt CV för ATS

### 1. Använd rätt filformat
**Gör så här:**
- Spara som .docx eller .pdf (vanlig PDF, inte skannad)
- Undvik bilder, tabeller och grafik
- Använd standardteckensnitt (Arial, Calibri, Times New Roman)

**Undvik:**
- Kreativa layouter med kolumner
- Infografik och ikoner
- Headers och footers med viktig information

### 2. Matcha nyckelord från annonsen
Läs jobbannonsen noga och inkludera:
- Exakta jobbetitlar
- Specifika kompetenser som nämns
- Verktyg och system
- Certifieringar

**Exempel:**
Om annonsen säger "erfarenhet av Microsoft Excel" – skriv "Microsoft Excel", inte bara "kalkylprogram".

### 3. Använd standard rubriker
ATS förväntar sig dessa rubriker:
- Arbetslivserfarenhet (eller Erfarenhet)
- Utbildning
- Kompetenser (eller Färdigheter)
- Sammanfattning (eller Profil)

**Undvik kreativa rubriker** som "Min resa" eller "Vad jag kan".

### 4. Skriv ut förkortningar
Första gången du använder en förkortning, skriv ut hela:
- "Certifierad projektledare (PMP)"
- "Sökmotoroptimering (SEO)"

### 5. Inkludera relevanta nyckelord naturligt
Stoppa inte in nyckelord överallt – det märks. Istället:
- Väv in dem i dina meritbeskrivningar
- Använd dem i din sammanfattning
- Lista dem under Kompetenser

### 6. Undvik "keyword stuffing"
Att upprepa samma ord många gånger kan flaggas som manipulation.

## Vanliga ATS-misstag

❌ **Grafiskt CV** – ATS kan inte läsa bilder
❌ **Tabeller** – Information kan hamna i fel ordning
❌ **Kreativa filnamn** – Använd "Förnamn_Efternamn_CV.pdf"
❌ **Vita nyckelord** – Att gömma text i vit färg fungerar inte och kan diskvalificera dig

## Testa ditt CV

### Gratis verktyg
- **Jobscan** – jämför ditt CV mot en jobbannons
- **Resume Worded** – ger feedback på ATS-vänlighet

### Manuellt test
- Kopiera ditt CV till ett vanligt textdokument
- Ser all information korrekt ut?
- Finns alla rubriker och datum?

## Kom ihåg

Ett ATS-optimerat CV behöver inte vara tråkigt. Det handlar om att:
1. Använda rätt format
2. Inkludera relevanta nyckelord
3. Ha en tydlig struktur

När ditt CV väl kommer förbi ATS behöver det fortfarande imponera på en människa – så glöm inte att göra det intressant också!`,
    category: 'job-search',
    subcategory: 'ats',
    tags: ['ATS', 'CV-optimering', 'nyckelord', 'rekryteringssystem', 'ansökan'],
    createdAt: '2024-04-11T10:00:00Z',
    updatedAt: '2024-04-11T10:00:00Z',
    readingTime: 12,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['cv-grunder', 'cv-mallar-exempel', 'ansokningsstrategi'],
    relatedTools: ['/cv-builder'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  {
    id: 'mental-halsa-jobbsokning',
    title: 'Mental hälsa under jobbsökning',
    summary: 'Stöd och strategier för att ta hand om din psykiska hälsa när jobbsökningen känns tung.',
    content: `Jobbsökning kan vara en av livets mest stressande perioder. Det är normalt att känna oro, nedstämdhet och frustration. Här är hur du tar hand om dig själv.

## Det är normalt att må dåligt

### Vanliga känslor under jobbsökning
- Oro för ekonomin och framtiden
- Nedstämdhet och hopplöshet
- Frustration över avslag
- Skam och skuld
- Ensamhet och isolering
- Identitetskris – "Vem är jag utan mitt jobb?"

**Viktigt:** Dessa känslor är normala reaktioner på en onormal situation. Du är inte svag för att du känner så här.

## Varningstecken att vara uppmärksam på

### Sök hjälp om du upplever:
- Ihållande nedstämdhet i mer än två veckor
- Svårigheter att komma ur sängen
- Självskadande tankar
- Panikattacker eller svår ångest
- Sömnlöshet eller översömn
- Aptitlöshet eller överätande
- Social isolering
- Känslor av värdelöshet

## Var får du hjälp?

### Akut hjälp
- **1177** – Sjukvårdsrådgivning
- **Mind självmordslinjen** – 90101 (dygnet runt)
- **Jourhavande präst** – 112

### Vårdcentralen
Boka tid hos:
- Läkare för bedömning
- Kurator för samtalsstöd
- Psykolog (remiss kan behövas)

### Arbetsförmedlingen
- Arbetskonsulenter med stöduppdrag
- Rehabiliteringsinsatser
- Samverkan med vården

### Försäkringskassan
Om du mår så dåligt att du inte kan söka jobb:
- Sjukpenning kan vara aktuellt
- Kontakta dem för rådgivning

### Ideella organisationer
- **Mind** – stödchattar och information
- **Självhjälp på väg** – grupper för arbetssökande
- **Röda Korset** – stödsamtal

## Strategier för bättre mående

### Dagliga rutiner
- Vakna och gå upp samma tid varje dag
- Klä dig som om du skulle gå till jobbet
- Ät regelbundna måltider
- Rörelse – även en kort promenad hjälper

### Begränsa jobbsökningen
- Sätt max antal timmar per dag
- Ta pauser var 45-60 minut
- Ha lediga dagar från jobbsökning

### Sociala kontakter
- Träffa vänner och familj regelbundet
- Berätta hur du mår (du behöver inte vara stark)
- Gå med i stödgrupper för arbetssökande

### Meningsfulla aktiviteter
- Volontärarbete ger struktur och syfte
- Hobbyer och intressen
- Lärande – kurser eller egen utveckling

## Kognitiva strategier

### Utmana negativa tankar
**Negativ tanke:** "Jag kommer aldrig få jobb"
**Utmaning:** "Många har fått jobb efter lång tid. Ett avslag är inte samma sak som alla avslag."

### Separera dig från situationen
Du ÄR inte arbetslös – du HAR inte jobb just nu. Din identitet är mer än din anställning.

### Fokusera på det du kan kontrollera
- Du kan INTE kontrollera om du får jobb
- Du KAN kontrollera hur många ansökningar du skickar och hur du tar hand om dig själv

## För anhöriga

Om någon du känner söker jobb och mår dåligt:
- Lyssna utan att ge råd
- Undvik "Har du testat att..."
- Erbjud praktisk hjälp
- Håll kontakten – de kanske inte orkar höra av sig
- Ta det på allvar om de pratar om självskada

## Kom ihåg

- Jobbsökning är temporärt – det tar slut
- Ditt värde avgörs inte av ditt jobb
- Det är modigt att be om hjälp
- Du förtjänar att må bra, oavsett anställningsstatus

**Behöver du prata?** Din arbetskonsulent finns där för dig. Tveka inte att höra av dig.`,
    category: 'wellness',
    subcategory: 'mental-health',
    tags: ['mental hälsa', 'psykisk ohälsa', 'depression', 'ångest', 'stöd', 'hjälp'],
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2024-04-12T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['hantera-avslag', 'stresshantering', 'motivation-langsiktig'],
    actions: [
      { label: '📞 1177 Vårdguiden', href: 'https://1177.se', type: 'primary' },
      { label: '📅 Boka stödsamtal', href: '/diary', type: 'secondary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'personlig-ekonomi-jobbsokning',
    title: 'Personlig ekonomi under jobbsökning',
    summary: 'Praktisk guide till ekonomi, bidrag och budgetering när du är arbetssökande.',
    content: `Att ha koll på ekonomin minskar stress och låter dig fokusera på jobbsökningen. Här är vad du behöver veta.

## Dina ekonomiska rättigheter

### A-kassa (Arbetslöshetskassa)
Om du är medlem i en a-kassa och uppfyller villkoren:
- Ersättning baserad på tidigare inkomst
- Max 80% av lönen upp till ett tak
- Kräver att du är aktivt arbetssökande

**Villkor:**
- Medlemskap i minst 12 månader
- Arbetat minst 6 av de senaste 12 månaderna
- Anmäld på Arbetsförmedlingen

### Grundersättning
Om du inte uppfyller villkoren för inkomstbaserad ersättning:
- Lägre ersättning (ca 510 kr/dag)
- Samma aktivitetskrav

### Aktivitetsstöd
Om du deltar i program via Arbetsförmedlingen:
- Ersättning under utbildning
- Praktik med ersättning
- Jobbgarantin

### Försörjningsstöd (Socialbidrag)
Om du inte har andra inkomster:
- Ansök hos kommunens socialtjänst
- Behovsbaserat
- Tillfälligt stöd

## Budgetering under arbetslöshet

### Steg 1: Kartlägg dina utgifter
**Fasta kostnader (måste betalas):**
- Hyra/boende
- El och vatten
- Försäkringar
- Telefon/internet
- Eventuella lån

**Rörliga kostnader (kan justeras):**
- Mat
- Transport
- Kläder
- Nöjen

### Steg 2: Jämför med din inkomst
- Hur mycket får du i ersättning?
- Räcker det till de fasta kostnaderna?
- Vad blir kvar?

### Steg 3: Gör en realistisk budget
**Prioritera:**
1. Tak över huvudet (hyra, el)
2. Mat
3. Hälsa
4. Transport för jobbsökning

### Tips för att spara

**Mat:**
- Planera veckomenyer
- Handla med lista
- Köp basvaror och laga från grunden
- Kolla datummärkta varor

**Transport:**
- Gå eller cykla när möjligt
- Kolla om du har rätt till rabatterade resekort
- Planera resor för intervjuer effektivt

**Abonnemang:**
- Gå igenom alla abonnemang
- Säg upp det du inte använder
- Förhandla priser på telefon och internet

## Om du har skulder

### Ta tag i det direkt
Att ignorera skulder gör det värre. Kontakta:
- Långivare för att diskutera avbetalningsplan
- Budget- och skuldrådgivare (gratis via kommunen)
- Kronofogden om du redan har skulder där

### Prioritering av skulder
1. Hyra (risk för vräkning)
2. El (risk för avstängning)
3. Kronofogdeskulder
4. Andra skulder

### Skuldsanering
Om du har stora skulder och inte kan betala:
- Ansök hos Kronofogden
- Kräver att du försökt andra lösningar
- En möjlighet till nystart

## Stöd och bidrag att känna till

### Bostadsbidrag
- För dig med låg inkomst
- Ansök hos Försäkringskassan
- Beror på hyra, inkomst och familjesituation

### Studiemedel
Om du studerar för att öka din anställningsbarhet:
- CSN för godkända utbildningar
- Omställningsstudiestöd för yrkesverksamma

### Tandvårdsstöd
- Särskilt tandvårdsbidrag vid låg inkomst
- Frisktandvård

### Glasögonbidrag
- I vissa regioner för personer med låg inkomst

## Praktiska tips

### Håll koll på utbetalningar
- Notera när pengarna kommer
- Ha marginal för förseningar
- Planera utgifter efter utbetalningsdatum

### Dokumentera allt
- Spara beslut och brev
- Anteckna datum och namn vid samtal
- Ha koll på dina ärenden

### Sök hjälp tidigt
Vänta inte tills krisen är akut. Kontakta:
- Budget- och skuldrådgivare
- Din arbetskonsulent
- Socialtjänsten

## Resurser

- **Konsumentverket** – budgetkalkyler och tips
- **Kronofogden** – information om skulder
- **Kommunens budget- och skuldrådgivning** – gratis hjälp
- **A-kassan** – din specifika a-kassas webbplats

## Kom ihåg

Ekonomisk stress är verklig och tung. Men det finns hjälp att få. Ta ett steg i taget och var inte rädd för att be om stöd.`,
    category: 'employment-law',
    subcategory: 'salary-benefits',
    tags: ['ekonomi', 'budget', 'a-kassa', 'bidrag', 'skulder', 'pengar'],
    createdAt: '2024-04-13T10:00:00Z',
    updatedAt: '2024-04-13T10:00:00Z',
    readingTime: 16,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['anstallningsformer-guide', 'nystartsjobb-guide', 'rattigheter-stod'],
    author: 'Katarina Holm',
    authorTitle: 'Handläggare Arbetsförmedlingen',
  },

  {
    id: 'underhall-kontakter',
    title: 'Underhåll ditt nätverk – långsiktiga relationer',
    summary: 'Så håller du kontakten med ditt professionella nätverk över tid för framtida möjligheter.',
    content: `Att bygga ett nätverk är bara halva jobbet – du måste också underhålla det. Så här håller du kontakterna levande.

## Varför underhålla kontakter?

- Möjligheter kommer ofta via gamla kontakter
- Relationer försvagas om de inte vårdas
- Det är lättare att be om hjälp från någon du haft kontakt med nyligen
- Du blir "top of mind" när möjligheter dyker upp

## Systematiskt kontaktunderhåll

### Kategorisera dina kontakter
**A-kontakter (varje månad):**
- Nära mentorer och rådgivare
- Nyckelpersoner i din målbransch
- Personer som aktivt hjälper dig

**B-kontakter (varje kvartal):**
- Tidigare kollegor och chefer
- Branschkontakter
- LinkedIn-kontakter du träffat

**C-kontakter (årligen):**
- Svagare bekantskaper
- Gamla klasskamrater
- Kontakter utanför din bransch

### Skapa en kontaktrutin
- Lägg in påminnelser i kalendern
- Avsätt tid varje vecka för nätverkande
- Håll en enkel lista över senaste kontakt

## Sätt att hålla kontakten

### Digitalt (låg insats)
- **Reagera på LinkedIn-inlägg** – kommentera meningsfullt
- **Gratulera vid nyheter** – nya jobb, födelsedagar, prestationer
- **Dela relevant innehåll** – "Tänkte på dig när jag såg detta"
- **Skicka ett kort "Hej!"** – "Hur går det för dig?"

### Personligt (högre insats, högre värde)
- **Fika eller lunch** – "Ska vi ta en kaffe och catch up?"
- **Telefonsamtal** – för kontakter på distans
- **Delta i event** – branschmässor, meetups
- **Bjud in till dina event** – om du organiserar något

### Ge värde
Det bästa sättet att underhålla kontakter är att ge:
- Dela en artikel de skulle uppskatta
- Introducera dem för någon relevant
- Erbjud din hjälp med något du kan
- Tipsa om möjligheter du ser

## LinkedIn-strategier

### Vardagligt engagemang
- Scrolla genom flödet 10-15 minuter dagligen
- Kommentera på 3-5 inlägg
- Gilla och dela relevant innehåll

### Direktkontakt
- Skicka personliga meddelanden, inte generiska
- Referera till något specifikt
- Ha ett syfte (men behöver inte vara "jobb-relaterat")

**Exempel på meddelande:**
"Hej [Namn]! Jag såg ditt inlägg om [ämne] och det fick mig att tänka. Hur går det för dig på [Företag]? Hoppas allt är bra!"

### Undvik
- Att bara höra av dig när du behöver något
- Generiska "Hur mår du?"-meddelanden till alla
- Att glömma bort kontakter i månader

## Professionella referensbrev

### Be om referensbrev medan relationen är färsk
- Efter en lyckad praktik
- När du slutar ett jobb på bra villkor
- Efter ett framgångsrikt projekt

### Så frågar du
"Hej [Namn], jag har verkligen uppskattat att jobba med dig på [projekt/jobb]. Skulle du kunna tänka dig att skriva ett referensbrev eller vara referens för mig i framtiden?"

### Håll referenserna uppdaterade
- Meddela dem innan du ger ut deras nummer
- Berätta om jobben du söker
- Tacka dem efteråt

## Hantera "gamla" kontakter

### Att återuppta kontakt
Det är aldrig för sent att höra av sig. Var ärlig:
"Hej [Namn]! Det har gått ett tag sedan vi pratade. Jag tänkte på dig nyligen och undrar hur det går för dig?"

### Om du behöver hjälp
Var tydlig men inte desperat:
"Jag söker just nu nya möjligheter inom [område] och undrar om du har några tips eller känner någon som skulle vara bra att prata med?"

## Vanliga misstag

❌ **Bara höra av sig när du behöver något**
Lösning: Ge innan du tar. Underhåll relationen kontinuerligt.

❌ **Vara för formell**
Lösning: Var personlig och genuin. Människor vill hjälpa människor, inte få formella förfrågningar.

❌ **Glömma att tacka**
Lösning: Skicka alltid ett tack efter hjälp. Följ upp med resultat.

❌ **Samla kontakter utan att använda dem**
Lösning: Kvalitet över kvantitet. Bättre med 50 aktiva kontakter än 500 passiva.

## Kom ihåg

Nätverkande är inte transaktionellt – det handlar om relationer. De bästa professionella relationerna är genuina vänskaper där båda parter vinner. Investera i människor, inte bara i kontakter!`,
    category: 'networking',
    subcategory: 'maintaining-contacts',
    tags: ['nätverkande', 'kontakter', 'relationer', 'LinkedIn', 'referensbrev'],
    createdAt: '2024-04-14T10:00:00Z',
    updatedAt: '2024-04-14T10:00:00Z',
    readingTime: 13,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['natverka-for-jobb', 'linkedin-optimering', 'informationsintervju-guide'],
    relatedExercises: ['networking'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
  },

  // === NYA ARTIKLAR ===
  {
    id: 'forsta-jobbet-efter-studier',
    title: 'Första jobbet efter studier – din guide till arbetslivet',
    summary: 'Praktiska tips för dig som nyutexaminerad och ska ta steget ut i arbetslivet för första gången.',
    content: `Grattis till examen! Nu väntar en spännande men kanske också nervkittlande tid. Att ta steget från studier till arbetsliv är en stor förändring, men med rätt förberedelser blir övergången smidigare.

## Från student till anställd – vad förändras?

### Nya rutiner
Som student har du ofta haft flexibla scheman och kunnat styra över din egen tid. I arbetslivet ser det annorlunda ut:
- Fasta arbetstider (oftast 8-17)
- Mindre flexibilitet i när du tar ledigt
- Regelbundna möten och deadlines
- Samarbete med kollegor i olika åldrar och bakgrunder

### Ekonomin förändras
- Du får regelbunden inkomst istället för CSN
- Skatt dras automatiskt från lönen
- Du börjar tjäna in pension
- Du kan behöva betala tillbaka studielån

## Så söker du ditt första jobb

### Förstå arbetsmarknaden för nyexaminerade
- Många jobb annonseras inte öppet – nätverka!
- Traineeprogram är utmärkta startpunkter
- Var öppen för olika typer av anställningar
- Storstäder har ofta fler möjligheter, men konkurrensen är också högre

### Formulera din unika fördel
Även utan arbetslivserfarenhet har du mycket att erbjuda:
- **Aktuell kunskap:** Du har de senaste teorierna och metoderna färska i minnet
- **Digital kompetens:** Många nyexaminerade har naturlig förståelse för digitala verktyg
- **Energi och motivation:** Du är hungrig och vill bevisa dig
- **Flexibilitet:** Du har inga inlärda vanor som behöver brytas

### Var ärlig med din erfarenhet
Försök inte framstå som mer erfaren än du är. Arbetsgivare som söker juniorer vet vad de får. Istället:
- Lyft fram relevanta kursprojekt
- Berätta om examensarbete eller praktik
- Nämn studentföreningsarbete och ledarroller
- Visa på din potential och vilja att lära

## Förbered dig för anställningsprocessen

### CV för nyexaminerade
1. **Sätt utbildningen först** – det är din främsta merit
2. **Inkludera kurser** som är relevanta för jobbet
3. **Lyft fram projekt** från utbildningen
4. **Nämn examensarbetet** om det är relevant
5. **Visa extrajobb** – även kafé- och butiksjobb visar att du kan ta ansvar

### I personliga brevet
- Förklara varför just det här företaget intresserar dig
- Koppla din utbildning till tjänsten
- Var entusiastisk men professionell
- Visa att du förstår vad rollen innebär

### Under intervjun
Vanliga frågor för nyexaminerade:
- "Varför valde du den här utbildningen?"
- "Berätta om ditt examensarbete"
- "Hur har du arbetat i grupp under studierna?"
- "Var ser du dig själv om 5 år?"

**Tips:** Förbered konkreta exempel från studietiden som visar problemlösning och samarbete.

## Första tiden på jobbet

### De första 90 dagarna
**Månad 1:** Lyssna och lär
- Ta in så mycket information som möjligt
- Ställ frågor – det förväntas av dig
- Observera företagskulturen
- Bygg relationer med kollegor

**Månad 2:** Börja bidra
- Ta mer initiativ i dina uppgifter
- Föreslå förbättringar (försiktigt)
- Be om återkoppling
- Dokumentera vad du lär dig

**Månad 3:** Etablera dig
- Du börjar hitta din roll
- Ta ansvar för egna projekt
- Bygg ditt nätverk internt
- Planera för din utveckling

### Hantera övergångschocken
Det är normalt att känna sig överväldigad. Vanliga känslor:
- Imposter-syndrom ("Förtjänar jag verkligen vara här?")
- Frustration över att inte kunna allt
- Trötthet av alla nya intryck
- Saknad efter studentlivet

**Kom ihåg:** Alla har varit nya någon gång. Det tar tid att bli varm i kläderna.

## Löneförhandling som nyexaminerad

### Vad kan du förvänta dig?
- Kolla lönestatistik för din utbildning och region
- Fråga studiekamrater vad de fått
- Kontakta ditt fackförbund för rådgivning

### Tips för förhandlingen
- Var realistisk – du har begränsad erfarenhet
- Fokusera på din potential och vilja att utvecklas
- Fråga om kompetensutveckling som komplement
- Tänk långsiktigt – första lönen är inte allt

## Vanliga misstag att undvika

❌ **Jämföra dig med mer erfarna kollegor**
Det tar tid att bygga kompetens. Var tålmodig med dig själv.

❌ **Jobba för mycket för att bevisa dig**
Hållbart tempo är viktigare än att bränna ut dig.

❌ **Inte våga fråga om hjälp**
Att be om vägledning är professionellt, inte ett tecken på svaghet.

❌ **Glömma nätverka internt**
Bygg relationer även utanför ditt team.

❌ **Förvänta dig befordran direkt**
Karriärutveckling tar tid – fokusera på att lära dig grunderna först.

## Checklista: Redo för arbetslivet

- [ ] Uppdaterat CV med fokus på utbildning
- [ ] Skapat eller uppdaterat LinkedIn-profil
- [ ] Kontaktat alumninätverk
- [ ] Kollat lönenivåer för min utbildning
- [ ] Förberett svar på vanliga intervjufrågor
- [ ] Ordnat med bankgiro för lön
- [ ] Kollat upp pensionssparande
- [ ] Funderat på facklig anslutning

## Kom ihåg

Övergången från studier till arbetsliv är en process, inte en händelse. Ge dig själv tid att anpassa dig, var nyfiken och öppen, och kom ihåg att alla experter en gång var nybörjare.

**Tips:** Behåll kontakten med studiekamrater – de blir ditt första professionella nätverk!`,
    category: 'career-development',
    subcategory: 'new-job',
    tags: ['första jobbet', 'nyexaminerad', 'studenter', 'karriärstart', 'arbetslivet'],
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    readingTime: 8,
    difficulty: 'easy',
    energyLevel: 'medium',
    relatedArticles: ['cv-utan-erfarenhet', 'anstallningsformer-guide', 'provanstallning-guide'],
    author: 'Erik Johansson',
    authorTitle: 'Karriärcoach',
  },

  {
    id: 'provanstallning-guide',
    title: 'Så fungerar provanställning – allt du behöver veta',
    summary: 'En guide till provanställningens regler, rättigheter och vad som händer efteråt.',
    content: `Provanställning är ofta det första steget in på en ny arbetsplats. Här får du veta allt om hur det fungerar, vilka rättigheter du har och vad du kan förvänta dig.

## Vad är en provanställning?

En provanställning är en tidsbegränsad anställning där både du och arbetsgivaren får möjlighet att prova om samarbetet fungerar. Det är en period för båda parter att utvärdera om det är rätt matchning.

### Grundläggande regler
- **Maxlängd:** 6 månader (kan vara kortare enligt kollektivavtal)
- **Skriftligt avtal:** Ska alltid vara dokumenterat
- **Övergår automatiskt:** Till tillsvidareanställning efter prövotiden om ingen säger upp

## Dina rättigheter under provanställning

### Samma grundläggande rättigheter
Under provanställning har du i princip samma rättigheter som andra anställda:
- Rätt till lön enligt avtal
- Rätt till semester (tjänas in)
- Rätt till sjuklön
- Skydd mot diskriminering
- Rätt till arbetsmiljöskydd
- Rätt till föräldraledighet

### Det som skiljer sig
- **Kortare uppsägningstid:** Ofta 14 dagar eller ingen alls
- **Lättare att avsluta:** Arbetsgivaren behöver inte ange saklig grund
- **Inget turordningsskydd:** Du har inte samma skydd vid arbetsbrist

## Vad händer under provanställningen?

### Arbetsgivarens ansvar
- Ge dig ordentlig introduktion
- Förklara vad som förväntas
- Ge dig möjlighet att lyckas
- Ge återkoppling på ditt arbete
- Meddela i tid om anställningen inte förlängs

### Ditt ansvar
- Göra ditt bästa
- Be om hjälp när du behöver
- Ta till dig återkoppling
- Visa engagemang och vilja att lära
- Följa arbetsplatsens regler

## Tips för att lyckas under provanställningen

### De första veckorna
1. **Lyssna aktivt** – Förstå företagets kultur och arbetssätt
2. **Ställ frågor** – Det är förväntat och uppskattat
3. **Dokumentera** – Anteckna det du lär dig
4. **Var punktlig** – Visa att du tar jobbet på allvar
5. **Var positiv** – Attityd spelar stor roll

### Under hela perioden
- **Be om regelbunden återkoppling** – Fråga hur det går
- **Visa initiativ** – Var proaktiv utan att gå utanför din roll
- **Bygg relationer** – Lär känna dina kollegor
- **Dokumentera framsteg** – Notera vad du lär dig och åstadkommer
- **Kommunicera** – Berätta om du kämpar med något

### Inför slutet av provanställningen
- Boka ett samtal med din chef 2-3 veckor innan
- Fråga direkt: "Hur ser ni på min anställning?"
- Be om konkret återkoppling
- Diskutera framtida mål och utveckling

## Om provanställningen avslutas

### Om arbetsgivaren inte vill förlänga
Arbetsgivaren ska meddela dig minst 14 dagar innan provanställningen löper ut. Om de missar detta kan du ha rätt till ersättning.

**Viktigt:** Arbetsgivaren behöver inte ange skäl, men de får inte avsluta av diskriminerande orsaker.

### Om du inte vill fortsätta
Du har också rätt att avsluta provanställningen. Följ avtalad uppsägningstid.

### Vad du kan göra
1. **Be om förklaring** – Du har rätt att få veta varför (även om de inte måste berätta)
2. **Be om skriftligt intyg** – Bra att ha för framtida ansökningar
3. **Var professionell** – Bränn inga broar
4. **Lär av erfarenheten** – Vad kan du göra annorlunda nästa gång?

## När provanställningen övergår till tillsvidare

### Vad förändras?
- Du får fullt uppsägningsskydd
- Du omfattas av turordningsregler
- Uppsägningstiden blir längre
- Du har rätt att veta orsaken om du blir uppsagd

### Vad du bör göra
- Be om skriftlig bekräftelse på den nya anställningsformen
- Diskutera eventuell lönejustering
- Prata om utvecklingsmöjligheter
- Se över dina försäkringar

## Vanliga frågor

**Kan provanställningen förlängas?**
Nej, inte enligt lag. Den kan vara max 6 månader totalt.

**Vad händer om jag blir sjuk?**
Du har rätt till sjuklön. Provanställningen kan dock avbrytas ändå.

**Får jag ta semester?**
Du tjänar in semester men kan oftast inte ta ut den under en kort provanställning.

**Kan jag bli av med jobbet hur som helst?**
Nästan – men inte av diskriminerande skäl (t.ex. graviditet, funktionsnedsättning, etnisk bakgrund).

## Checklista: Provanställning

**Innan start:**
- [ ] Läst och förstått anställningsavtalet
- [ ] Vet när provanställningen börjar och slutar
- [ ] Förstår vilka mål som förväntas

**Under perioden:**
- [ ] Dokumenterar mina framsteg
- [ ] Ber om återkoppling regelbundet
- [ ] Visar engagemang och initiativ

**Inför slutet:**
- [ ] Bokat samtal med chefen
- [ ] Frågat om fortsatt anställning
- [ ] Diskuterat framtida utveckling

## Kom ihåg

Provanställning är inte bara en test av dig – det är också en möjlighet för dig att utvärdera arbetsplatsen. Passar jobbet dig? Trivs du med kollegorna? Ser du en framtid här? Dina känslor och observationer är lika viktiga som arbetsgivarens.`,
    category: 'employment-law',
    subcategory: 'employment-types',
    tags: ['provanställning', 'anställningsformer', 'rättigheter', 'nytt jobb', 'arbetsrätt'],
    createdAt: '2024-06-16T10:00:00Z',
    updatedAt: '2024-06-16T10:00:00Z',
    readingTime: 6,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['anstallningsformer-guide', 'forsta-jobbet-efter-studier', 'dina-rattigheter'],
    author: 'Anna Svensson',
    authorTitle: 'Arbetsrättsjurist',
  },

  {
    id: 'arbetsmiljo-kultur-guide',
    title: 'Arbetsmiljö och kultur – hitta rätt företag för dig',
    summary: 'Lär dig att undersöka och utvärdera företagskultur för att hitta en arbetsplats där du trivs.',
    content: `Att hitta rätt jobb handlar inte bara om arbetsuppgifter och lön – arbetsmiljön och företagskulturen spelar en avgörande roll för din trivsel och utveckling. Här lär du dig att utvärdera och hitta rätt matchning.

## Varför är företagskultur viktigt?

### Påverkan på din vardag
- Du spenderar ~40 timmar i veckan på jobbet
- Kultur påverkar stress, motivation och välmående
- Fel miljö kan leda till utmattning, rätt miljö till utveckling
- Dina värderingar behöver matcha företagets

### Vad är företagskultur egentligen?
Företagskultur är de oskrivna reglerna och normerna som styr hur människor beter sig på en arbetsplats:
- Hur fattas beslut?
- Hur kommunicerar man?
- Hur hanteras konflikter?
- Vad belönas och bestraffas?
- Hur balanseras arbete och fritid?

## Olika typer av företagskulturer

### Hierarkisk kultur
**Kännetecken:**
- Tydlig struktur och karriärvägar
- Formell kommunikation
- Beslut fattas högre upp
- Processer och rutiner är viktiga

**Passar dig om:** Du värdesätter stabilitet och tydliga förväntningar.

### Innovativ/Start-up-kultur
**Kännetecken:**
- Snabba förändringar
- Mycket ansvar tidigt
- Flexibla arbetstider
- Platt organisation

**Passar dig om:** Du trivs med osäkerhet och vill påverka.

### Teamorienterad kultur
**Kännetecken:**
- Fokus på samarbete
- Sociala aktiviteter
- Kollektiva beslut
- Stödjande miljö

**Passar dig om:** Du motiveras av gemenskap och teamwork.

### Resultatorienterad kultur
**Kännetecken:**
- Fokus på mål och resultat
- Konkurrens kan vara hög
- Belöningssystem baserat på prestation
- Mindre fokus på process

**Passar dig om:** Du motiveras av tydliga mål och erkännande.

## Så undersöker du företagskulturen

### Innan du söker

**1. Företagets hemsida**
- Läs "Om oss" och värderingssidor
- Titta på bilder och videos
- Hur beskriver de sig själva?
- Vilka ord återkommer?

**2. Sociala medier**
- Följ företaget på LinkedIn, Instagram
- Vad delar de? Hur är tonen?
- Hur interagerar de med kommentarer?
- Visar de medarbetare och kultur?

**3. Arbetsgivarrecensioner**
- Glassdoor, Indeed, Jobbland
- Läs både positiva och negativa recensioner
- Se mönster i återkoppling
- Kom ihåg: missnöjda skriver oftare

**4. Nätverka**
- Prata med nuvarande eller tidigare anställda
- LinkedIn är bra för att hitta kontakter
- Fråga i din bekantskapskrets
- Alumninätverk kan hjälpa

### Under intervjuprocessen

**Frågor att ställa:**

*Om arbetsmiljön:*
- "Hur skulle du beskriva stämningen här?"
- "Vad gör ni för att stödja medarbetares välmående?"
- "Hur ser en vanlig dag ut för någon i den här rollen?"

*Om ledarskap:*
- "Hur ger ni återkoppling till medarbetare?"
- "Hur hanteras konflikter?"
- "Hur involveras medarbetare i beslut?"

*Om utveckling:*
- "Vilka möjligheter finns för kompetensutveckling?"
- "Hur ser karriärvägarna ut?"
- "Hur ofta har ni utvecklingssamtal?"

*Om balans:*
- "Hur ser ni på arbete och fritid?"
- "Hur flexibla är arbetstiderna?"
- "Hur hanteras övertid?"

### Observera under besöket
- Hur hälsar folk på dig?
- Hur ser kontorslandskapet ut?
- Pratar folk med varandra eller sitter alla tysta?
- Verkar folk stressade eller avslappnade?
- Hur behandlas du i receptionen?

## Röda flaggor att vara uppmärksam på

### I jobbannonsen
⚠️ "Vi är som en familj" (kan betyda bristande gränser)
⚠️ "Rockstjärnor sökes" (kan betyda ohållbar press)
⚠️ "Tål att jobba under press" (kan betyda kaotisk miljö)
⚠️ Vaga beskrivningar av arbetsuppgifter
⚠️ Orealistiskt hög lön för rollen

### Under intervjun
⚠️ Intervjuaren pratar illa om nuvarande anställda
⚠️ Ingen vill svara på frågor om kultur
⚠️ Hög personalomsättning
⚠️ Oklara förväntningar
⚠️ Pressure-taktik för snabbt besked

### Andra varningssignaler
⚠️ Kontoret känns tomt trots kontorstid
⚠️ Folk undviker ögonkontakt
⚠️ Chefen avbryter ständigt
⚠️ Disrespektfullt bemötande av någon

## Matcha dina värderingar med företagets

### Steg 1: Identifiera dina prioriteringar
Rangordna dessa faktorer (1-10):
- [ ] Work-life balance
- [ ] Karriärmöjligheter
- [ ] Hög lön
- [ ] Meningsfullt arbete
- [ ] Flexibilitet
- [ ] Trygghet
- [ ] Innovation
- [ ] Gemenskap
- [ ] Självständighet
- [ ] Status

### Steg 2: Utvärdera företaget
Använd samma skala för att bedöma hur företaget verkar prioritera.

### Steg 3: Jämför
- Var finns matchningar?
- Var finns avvikelser?
- Kan du acceptera skillnaderna?

## Efter anställning – vad om det inte stämmer?

### Ge det tid
- Det tar 3-6 månader att verkligen förstå en kultur
- Första intrycken kan vara missvisande
- Ge dig själv tid att anpassa dig

### Om det inte fungerar
1. **Dokumentera** vad som inte fungerar
2. **Prata** med din chef om möjliga förändringar
3. **Sök stöd** från HR eller fackförbund
4. **Överväg alternativen** – kan du byta internt?
5. **Planera** din nästa karriärflytt om nödvändigt

## Checklista: Utvärdera företagskultur

**Research:**
- [ ] Läst igenom hemsidan
- [ ] Kollat sociala medier
- [ ] Läst arbetsgivarrecensioner
- [ ] Pratat med kontakter

**Under processen:**
- [ ] Ställt frågor om kultur
- [ ] Observerat miljön
- [ ] Noterat röda flaggor
- [ ] Lyssnat på magkänslan

**Beslutsfattande:**
- [ ] Jämfört med mina värderingar
- [ ] Bedömt om jag kan trivas
- [ ] Övervägt långsiktigt

## Kom ihåg

Du söker inte bara ett jobb – du väljer var du ska spendera en stor del av ditt liv. Ta dig tid att undersöka, ställ de svåra frågorna, och lita på din magkänsla. Ett jobb med lite lägre lön men rätt kultur är ofta värt mer än ett välbetalt jobb där du inte trivs.

**Tips:** Skriv ner hur du känner efter varje intervju. Dina spontana känslor säger ofta mer än din analys!`,
    category: 'job-market',
    subcategory: 'work-environment',
    tags: ['arbetsmiljö', 'företagskultur', 'trivsel', 'val av arbetsgivare', 'värderingar'],
    createdAt: '2024-06-17T10:00:00Z',
    updatedAt: '2024-06-17T10:00:00Z',
    readingTime: 10,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['arbetsmiljo-fragor', 'forsta-jobbet-efter-studier', 'karriarplanering-steg-for-steg'],
    author: 'Lisa Bergström',
    authorTitle: 'Organisationspsykolog',
  },

  {
    id: 'referenssamtal-guide',
    title: 'Referenssamtal – vad händer och hur förbereder du dig',
    summary: 'Allt du behöver veta om referenssamtal: hur du väljer referenser, förbereder dem och vad arbetsgivare faktiskt frågar.',
    content: `Referenssamtal är ofta det sista steget innan ett jobberbjudande. Det är din chans att få andra att bekräfta bilden du gett av dig själv. Här får du veta hur du förbereder dig och dina referenser.

## Vad är ett referenssamtal?

Ett referenssamtal är när en potentiell arbetsgivare kontaktar personer du angett för att få en bild av dig som medarbetare. Det görs vanligtvis:
- Efter intervju(er), innan beslut
- Via telefon (vanligast) eller mejl
- Under 15-30 minuter per referens
- Med 2-3 referenser

## Vem kan vara referens?

### Bra referenser
- **Tidigare chefer** – Bäst, de kan bedöma din arbetsprestation
- **Projektledare** – Om du arbetat i projekt
- **Kollegor** – Kan berätta om samarbete
- **Kunder/samarbetspartners** – Externa perspektiv
- **Handledare** – Från praktik eller examensarbete

### Mindre bra som referenser
- Familjemedlemmar
- Nära vänner (om inte yrkesrelaterat)
- Personer som inte sett ditt arbete
- Personer du haft konflikt med

### Om du saknar arbetsreferenser
Om du är nyexaminerad eller har varit borta från arbetsmarknaden:
- Lärare eller handledare
- Praktikhandledare
- Föreningsledare
- Volontärsamordnare
- Studiekamrater (för gruppprojekt)

## Så väljer du rätt referenser

### Kriterier att tänka på
1. **Relevans** – Kan de uttala sig om det jobbet kräver?
2. **Relation** – Hur väl känner de ditt arbete?
3. **Tid** – Hur länge sedan arbetade ni tillsammans?
4. **Inställning** – Kommer de tala väl om dig?
5. **Tillgänglighet** – Kan de ta ett samtal?

### Variera dina referenser
Försök ha en mix av:
- Olika typer av relationer (chef, kollega)
- Olika arbetsplatser
- Olika tidsperioder
- Olika kompetensområden

## Förbered dina referenser

### Innan du ger ut deras namn
**Fråga alltid först!** Kontakta din referens och:
1. Fråga om de har tid och möjlighet
2. Förklara vilket jobb du sökt
3. Berätta vad tjänsten innebär
4. Diskutera vad du vill att de lyfter fram
5. Ge dem relevant information

### Information att dela med referensen
- Jobbannonsen eller tjänstebeskrivning
- Ditt CV (uppdaterat)
- Vad du betonat i intervjun
- Vilka egenskaper som är viktiga för jobbet
- Ungefär när de kan förvänta sig samtal

### Mall för att kontakta en referens

**Ämne:** Kan du vara referens för mig?

"Hej [Namn]!

Jag söker just nu en tjänst som [titel] på [företag] och har kommit långt i processen. De vill nu kontakta referenser och jag tänkte direkt på dig.

Tjänsten handlar om [kort beskrivning] och de söker någon som är [egenskaper]. Jag har lyft fram min erfarenhet av [relevanta saker] och hur vi arbetade tillsammans med [specifikt projekt/uppgift].

Har du möjlighet att vara min referens? De kommer troligen ringa inom [tidsram].

Tack på förhand!
[Ditt namn]"

## Vad frågar arbetsgivare om?

### Vanliga frågor i referenssamtal

**Om arbetsrelationen:**
- "Hur känner du [namn]?"
- "Hur länge och i vilken kapacitet arbetade ni tillsammans?"
- "Vad hade [namn] för roll och ansvar?"

**Om arbetsprestationen:**
- "Hur skulle du beskriva [namn]s arbetsprestationer?"
- "Vilka var [namn]s främsta styrkor?"
- "Finns det områden där [namn] kunde utvecklas?"

**Om samarbete:**
- "Hur fungerade [namn] i teamet?"
- "Hur hanterade [namn] stressiga situationer?"
- "Hur var [namn]s kommunikation med kollegor och kunder?"

**Om ledarskap (om relevant):**
- "Hur ledde [namn] sitt team?"
- "Hur hanterade [namn] konflikter?"

**Avslutande frågor:**
- "Skulle du anställa [namn] igen?"
- "Finns det något mer vi bör veta?"

### Vad de egentligen vill veta
- Stämmer bilden kandidaten gett?
- Finns det några varningssignaler?
- Passar personen för just den här rollen?
- Hur kommer personen fungera hos oss?

## Vad händer efter referenssamtalet?

### Positiva signaler
- De ringer tillbaka samma dag eller dagen efter
- De vill diskutera praktiska detaljer
- De frågar om din uppsägningstid
- De nämner nästa steg

### Tystnad eller avslag
- Om du inte hört något på en vecka, följ upp
- Fråga om de behöver mer information
- Ett avslag behöver inte bero på referenserna

## Om något går fel

### Om en referens säger något negativt
- Du kanske aldrig får veta exakt vad som sades
- Be referensen om ärlig feedback
- Överväg att byta ut den referensen

### Om arbetsgivaren inte kan nå din referens
- Ha alltid uppdaterade kontaktuppgifter
- Ha backup-referenser redo
- Meddela dina referenser när samtal kan komma

### Om du misstänker dåliga referenser
- Du kan anlita företag som "kollar" dina referenser
- Byt ut osäkra referenser
- Var ärlig om svåra relationer i intervjun

## Checklista: Referenssamtal

**Innan du söker:**
- [ ] Identifierat 3-4 potentiella referenser
- [ ] Frågat om de vill vara referenser
- [ ] Samlat korrekta kontaktuppgifter

**När du kommit långt i processen:**
- [ ] Informerat referenserna om det specifika jobbet
- [ ] Skickat relevant information
- [ ] Bekräftat att de är nåbara

**Efter referenssamtalet:**
- [ ] Tackat dina referenser
- [ ] Berättat hur det gick
- [ ] Uppdaterat dem om utfallet

## Kom ihåg

Dina referenser är en del av ditt professionella nätverk. Behandla dem väl, håll kontakten även mellan jobbsökningar, och var beredd att ställa upp som referens för dem. Ett starkt nätverk av personer som kan intyga din kompetens är ovärderligt genom hela karriären.

**Tips:** Tacka alltid dina referenser efteråt, oavsett om du fick jobbet eller inte. Ett kort mejl eller SMS räcker!`,
    category: 'interview',
    subcategory: 'after-interview',
    tags: ['referenssamtal', 'referenser', 'jobbsökning', 'intervju', 'arbetsgivare'],
    createdAt: '2024-06-18T10:00:00Z',
    updatedAt: '2024-06-18T10:00:00Z',
    readingTime: 7,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['tackbrev-intervju', 'intervju-guide', 'natverka-for-jobb'],
    author: 'Maria Lindqvist',
    authorTitle: 'Rekryteringskonsult',
  },

  {
    id: 'jobbsokning-funktionsnedsattning',
    title: 'Jobbsökning med funktionsnedsättning – rättigheter och stöd',
    summary: 'En guide om dina rättigheter, tillgängligt stöd och hur du kan prata om funktionsnedsättning i jobbsökningsprocessen.',
    content: `Att söka jobb med en funktionsnedsättning kan innebära extra utmaningar, men det finns också stöd och rättigheter som skyddar dig. Den här guiden hjälper dig navigera processen.

## Dina rättigheter

### Diskrimineringslagen
I Sverige är det förbjudet att diskriminera på grund av funktionsnedsättning. Detta gäller:
- Annonsering av tjänster
- Urvalsprocessen
- Anställningsbeslut
- Arbetsvillkor
- Befordran och kompetensutveckling

### Vad räknas som diskriminering?
- Att inte kallas till intervju på grund av funktionsnedsättning
- Att nekas anställning utan saklig grund
- Att behandlas annorlunda än andra sökande
- Att inte få rimliga anpassningar

### Arbetsgivarens skyldighet att anpassa
Arbetsgivare är skyldiga att vidta "skäliga åtgärder" för att personer med funktionsnedsättning ska kunna:
- Söka och få jobb
- Utföra sitt arbete
- Utvecklas i sin roll

"Skäliga åtgärder" bedöms utifrån:
- Arbetsgivarens storlek och resurser
- Kostnad för anpassningen
- Nyttan för den anställda

## Stöd som finns

### Från Arbetsförmedlingen

**Lönebidrag**
Arbetsgivare kan få ekonomiskt stöd för att anställa dig om du har nedsatt arbetsförmåga. Det minskar deras risk och ökar dina chanser.

**Stöd till hjälpmedel**
Hjälpmedel på arbetsplatsen kan finansieras, t.ex.:
- Ergonomiska hjälpmedel
- Programvaror för tillgänglighet
- Kommunikationshjälpmedel
- Anpassad utrustning

**Personligt biträde**
Om du behöver praktisk hjälp på jobbet kan en personlig assistent/biträde bekostas.

**SIUS-konsulent**
Särskild stödperson som kan hjälpa dig hitta och behålla ett jobb.

### Från Försäkringskassan
- Bidrag till arbetshjälpmedel
- Aktivitetsersättning vid förlängd etablering
- Samordning med vården

### Från andra aktörer
- **Samhall** – Meningsfulla jobb med anpassning
- **Jobbcoacher** – Specialiserade på funktionsnedsättning
- **Intresseorganisationer** – DHR, Synskadades Riksförbund, etc.
- **Supported Employment** – Metodiskt stöd in i arbete

## Ska du berätta om din funktionsnedsättning?

### Du bestämmer själv
Det finns inget krav att berätta om funktionsnedsättning i ansökan eller intervju. Beslutet är helt ditt och beror på:
- Påverkar det din förmåga att utföra jobbet?
- Behöver du anpassningar från start?
- Känns det viktigt för dig att vara öppen?

### Fördelar med att berätta
- Du kan be om anpassningar direkt
- Arbetsgivaren kan söka bidrag
- Ingen överraskning senare
- Visar självförtroende
- Rätt matchning från början

### Nackdelar/risker
- Risk för (omedveten) diskriminering
- Kanske inte relevant för jobbet
- Kan skapa fördomar
- Du vill kanske inte definiera dig av det

### Om du väljer att berätta

**När:**
- I ansökan (om relevant)
- Under intervjun
- Efter erbjudande (om du behöver anpassning)
- Efter anställning

**Hur:**
1. **Var saklig** – Beskriv kort och konkret
2. **Fokusera på lösningar** – Berätta hur du hanterar det
3. **Lyft kompetensen** – Det handlar om vad du KAN
4. **Var förberedd** – Förutse frågor

**Exempelformulering:**
"Jag har [funktionsnedsättning] vilket innebär [kort beskrivning]. I praktiken hanterar jag det genom [strategi/hjälpmedel]. Det har inte hindrat mig från att [prestationer/erfarenheter]."

## Praktiska tips för jobbsökning

### Hitta rätt arbetsgivare
- Sök efter företag med mångfaldsfokus
- Kolla om de har tillgänglighetspolicy
- Se om de nämner inkludering i annonser
- Fråga i ditt nätverk om erfarenheter
- Kontakta intresseorganisationer för tips

### Anpassa ditt CV
- Fokusera på kompetens och resultat
- Du behöver inte nämna funktionsnedsättningen
- Förklara eventuella luckor kort och positivt
- Lyft fram relevanta erfarenheter

### Förbered intervjun
- Be om information om lokalen i förväg
- Fråga om du kan få frågorna skriftligt (om relevant)
- Meddela om du behöver något särskilt
- Planera för eventuell extra tid

### Under intervjun
- Var dig själv
- Fokusera på vad du kan bidra med
- Var redo att svara på frågor (om du valt att berätta)
- Ställ frågor om arbetsmiljön

## Om du upplever diskriminering

### Dokumentera
- Spara mejl och anteckningar
- Notera datum, tid och vad som sades/hände
- Be eventuella vittnen om deras version

### Anmäl
- **Diskrimineringsombudsmannen (DO)** – Kan utreda och driva ärenden
- **Ditt fackförbund** – Kan ge juridisk hjälp
- **Arbetsförmedlingen** – Om det gäller deras verksamhet

### Du har rätt till
- Att få ärendet utrett
- Skadestånd vid konstaterad diskriminering
- Att inte bli utsatt för repressalier för anmälan

## Resurser och stöd

### Webbplatser
- **Arbetsförmedlingen** – arbetsformedlingen.se/funktionsnedsattning
- **DO** – do.se
- **Funka** – funka.com
- **Myndigheten för delaktighet** – mfd.se

### Intresseorganisationer
- DHR (rörelsehinder)
- Synskadades Riksförbund
- Hörselskadades Riksförbund
- Autism Sverige
- ADHD Sverige
- Neuro (neurologiska diagnoser)

### Hjälpmedel och teknik
- **Mitt Hjälpmedel** – Guide till hjälpmedel
- **SPSM** – Specialpedagogik och anpassningar

## Checklista

**Förberedelse:**
- [ ] Kolla vilka stöd du har rätt till
- [ ] Kontakta Arbetsförmedlingen om du inte redan gjort det
- [ ] Funderat på om/när/hur du vill berätta

**Jobbsökning:**
- [ ] Identifierat arbetsgivare med bra mångfaldspolicy
- [ ] Anpassat CV och personligt brev
- [ ] Förberett svar på eventuella frågor

**Praktiskt:**
- [ ] Kollat tillgänglighet för intervjulokaler
- [ ] Planerat för eventuella anpassningar
- [ ] Sparat dokumentation

## Kom ihåg

Din funktionsnedsättning är en del av dig, men den definierar inte dina förmågor. Arbetsgivare som förstår värdet av mångfald vet att olika perspektiv stärker team och organisationer. Rätt arbetsgivare kommer att se din kompetens – och rätt arbetsplats kommer att anpassa sig efter dina behov.

**Tips:** Kontakta en intresseorganisation för din specifika funktionsnedsättning – de har ofta jobbsökargrupper, mentorprogram och arbetsgivarkontakter!`,
    category: 'accessibility',
    subcategory: 'rights',
    tags: ['funktionsnedsättning', 'tillgänglighet', 'rättigheter', 'diskriminering', 'stöd', 'anpassningar'],
    createdAt: '2024-06-19T10:00:00Z',
    updatedAt: '2024-06-19T10:00:00Z',
    readingTime: 12,
    difficulty: 'medium',
    energyLevel: 'medium',
    relatedArticles: ['dina-rattigheter', 'anstallningsformer-guide', 'arbetsmiljo-kultur-guide'],
    author: 'Emma Karlsson',
    authorTitle: 'Tillgänglighetskonsult',
  },

  {
    id: 'mindfulness-stresshantering-jobbsokare',
    title: 'Mindfulness och stresshantering för jobbsökare',
    summary: 'Praktiska övningar och tekniker för att hantera stress och behålla fokus under jobbsökningen.',
    content: `Jobbsökning kan vara stressande – ovisshet, väntan och avslag tar på krafterna. Mindfulness och stresshantering kan hjälpa dig hålla ut och prestera bättre. Här får du konkreta verktyg.

## Varför är jobbsökning stressande?

### Psykologiska faktorer
- **Brist på kontroll** – Du kan inte styra utfallet
- **Identitetsförlust** – Utan jobb kan vi känna oss "mindre"
- **Ekonomisk oro** – Pengar påverkar tryggheten
- **Social press** – "Har du hittat något än?"
- **Ovisshet** – Inte veta när/om det blir bättre

### Fysiska tecken på stress
- Sömnproblem
- Spänningar i nacke/axlar
- Huvudvärk
- Magproblem
- Trötthet

### Mentala tecken
- Svårt att koncentrera sig
- Negativa tankar
- Irritabilitet
- Hopplöshet
- Undvikande beteende

## Vad är mindfulness?

Mindfulness handlar om att vara närvarande i nuet, utan att döma. Det är inte om att "tömma huvudet" utan om att:
- Observera tankar utan att fastna i dem
- Acceptera känslor utan att fly
- Fokusera på det som händer just nu
- Vara snäll mot dig själv

### Varför fungerar det?
- Minskar stresshormoner
- Förbättrar fokus och minne
- Stärker emotionell reglering
- Ökar välmående
- Hjälper vid sömnproblem

## Praktiska övningar

### 1. Medveten andning (5 minuter)

**Så gör du:**
1. Sitt bekvämt med fötterna på golvet
2. Blunda eller titta ner
3. Lägg en hand på magen
4. Andas in genom näsan (4 sekunder)
5. Håll andan (2 sekunder)
6. Andas ut genom munnen (6 sekunder)
7. Upprepa 10 gånger

**När:** Innan du skickar ansökningar, före intervjuer, när du känner dig stressad.

### 2. Kroppsscanning (10 minuter)

**Så gör du:**
1. Lägg dig ner eller sitt bekvämt
2. Blunda och ta några djupa andetag
3. Börja med fötterna – hur känns de?
4. Flytta uppmärksamheten långsamt uppåt:
   - Vader och knän
   - Lår och höfter
   - Mage och bröst
   - Händer och armar
   - Axlar och nacke
   - Ansikte och huvud
5. Känn hela kroppen samtidigt
6. Öppna ögonen när du är redo

**När:** Före sömn, mitt på dagen som paus, vid fysiska spänningar.

### 3. 5-4-3-2-1 tekniken (3 minuter)

När tankarna snurrar, jordna dig genom att identifiera:
- **5** saker du kan SE
- **4** saker du kan RÖRA/KÄNNA
- **3** saker du kan HÖRA
- **2** saker du kan LUKTA
- **1** sak du kan SMAKA

**När:** Vid ångest, panik, eller överväldigande känslor.

### 4. Medveten fika (10 minuter)

Vänd en vanlig stund till mindfulness:
1. Ta en kopp kaffe/te och något att äta
2. Sitt ner utan telefon eller skärm
3. Titta på drycken – färg, ånga
4. Lukta – vad kan du känna?
5. Ta en klunk – hur smakar det egentligen?
6. Ät långsamt och känn varje tugga
7. Bara vara, utan att göra något annat

**När:** Som daglig rutin, när du behöver lugna ner.

### 5. Gångmeditation (15 minuter)

**Så gör du:**
1. Gå utomhus i lugnt tempo
2. Fokusera på varje steg – hur känns det när foten möter marken?
3. Notera omgivningen utan att värdera
4. När tankarna vandrar, vänd tillbaka till stegen
5. Andas i takt med gången

**När:** Daglig motion, när du behöver rörelse och lugn samtidigt.

## Hantera jobbsöknings-specifik stress

### Före intervju

**Kvällen innan:**
- Gör din förberedelse klar tidigt
- Undvik skärmar minst en timme före sänggående
- Gör kroppsscanningen för att sova bättre
- Lägg fram kläder och material

**Morgonen:**
- Vakna med tid att slappna av
- Gör medveten andning 10 minuter
- Ät en ordentlig frukost
- Undvik nyheter och sociala medier

**Precis innan:**
- 5-4-3-2-1 tekniken om du är nervös
- Några djupa andetag
- Påminn dig: "Jag är förberedd"

### Efter avslag

1. **Tillåt känslan** – Det är okej att vara besviken
2. **Sätt en tidsgräns** – "Jag känner det här idag, imorgon går jag vidare"
3. **Gör en fysisk handling** – Promenad, träning
4. **Prata med någon** – Dela din upplevelse
5. **Skriv ner lärdomar** – Vad kan du ta med dig?

### Vid långvarig sökning

**Daglig struktur:**
- Morgonrutin med mindfulness (15 min)
- Jobbsökning på förmiddagen (max 3-4 timmar)
- Paus och fysisk aktivitet mitt på dagen
- Andra aktiviteter på eftermiddagen
- Kvällsrutin med avslappning

**Veckovis:**
- Minst en dag helt fri från jobbsökning
- Social aktivitet varje vecka
- Fysisk träning 3+ gånger
- En aktivitet som ger dig energi

## Skapa hållbara vanor

### Morgonrutin (30 min)
1. Vakna utan larm om möjligt
2. Sträck på dig i sängen
3. Drick ett glas vatten
4. 10 min meditation eller andning
5. Lätt stretching eller yoga
6. Frukost utan skärm

### Kvällsrutin (30 min)
1. Stäng av skärmar 1 timme före sänggående
2. Skriv ned tre bra saker från dagen
3. Planera morgondagen kort
4. Kroppsskanning eller meditation
5. Läsning eller lugn musik
6. Sov vid samma tid

### Veckoplanning
| Måndag | Tisdag | Onsdag | Torsdag | Fredag | Lördag | Söndag |
|--------|--------|--------|--------|--------|--------|--------|
| Söka | Söka | Paus | Söka | Söka | FRI | FRI |

## Appar och resurser

### Mindfulness-appar
- **Headspace** – Guidad meditation
- **Calm** – Sömn och meditation
- **Insight Timer** – Gratis meditationer
- **Mindfulness** (på svenska)

### Fysisk aktivitet
- Yoga på YouTube (Yoga With Adriene)
- 7 Minute Workout
- Promenader i naturen

### Annat stöd
- **Mind** – Stödlinje och information
- **Jourhavande medmänniska**
- **1177** – Vårdguiden
- **Din arbetskonsulent**

## Varningssignaler – när du behöver mer hjälp

Sök professionell hjälp om du:
- Inte kan sova flera nätter i rad
- Har tankar på att skada dig själv
- Inte kan utföra vardagliga sysslor
- Känner hopplöshet som inte släpper
- Isolerar dig helt från andra
- Har fått panikattacker

**Kontakta:**
- Vårdcentralen
- 1177 Vårdguiden
- Mind: 90101
- Jourhavande medmänniska: 08-702 16 80

## Kom ihåg

Stress under jobbsökning är normalt – du är inte svag för att du känner det. Mindfulness är inte en quick-fix utan en färdighet som utvecklas över tid. Börja smått, var konsekvent, och var snäll mot dig själv när det inte går perfekt.

**Tips:** Börja med bara 5 minuters medveten andning per dag. Det räcker för att märka skillnad – och du kan alltid bygga på därifrån.`,
    category: 'wellness',
    subcategory: 'stress',
    tags: ['mindfulness', 'stresshantering', 'meditation', 'välmående', 'mental hälsa', 'andning'],
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-06-20T10:00:00Z',
    readingTime: 8,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: ['hantera-avslag', 'motivation-langsiktig', 'stresshantering'],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  // === LÄTT SVENSKA ===
  {
    id: 'latt-svenska-cv',
    title: 'Vad är ett CV?',
    summary: 'En enkel guide om vad ett CV är och varför du behöver ett.',
    content: `# Vad är ett CV?

Ett CV är ett papper om dig.

Det berättar vem du är.
Det berättar vad du har gjort.
Det berättar vad du kan.

## Varför behöver du ett CV?

När du söker jobb vill chefen veta:
- Vad heter du?
- Vad har du jobbat med förut?
- Vad har du lärt dig i skolan?
- Vad är du bra på?

Ditt CV svarar på dessa frågor.

## Vad ska ett CV ha?

**1. Ditt namn**
Skriv ditt för- och efternamn.

**2. Telefonnummer**
Så chefen kan ringa dig.

**3. E-post**
Så chefen kan skriva till dig.

**4. Dina jobb**
Skriv vilka jobb du har haft.
Skriv det senaste jobbet först.

**5. Din skola**
Skriv vilken skola du gått i.
Skriv vad du läste.

**6. Vad du kan**
Skriv vad du är bra på.
Till exempel: körkort, datorer, språk.

## Tips

- Gör ditt CV kort. Max 2 sidor.
- Skriv tydligt.
- Låt någon läsa ditt CV.
- Ändra ditt CV för varje jobb.

## Behöver du hjälp?

Prata med din konsulent.
De hjälper dig att göra ett bra CV.`,
    category: 'job-search',
    subcategory: 'cv-writing',
    tags: ['lätt svenska', 'cv', 'nybörjare', 'enkel guide'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    readingTime: 3,
    difficulty: 'easy-swedish',
    energyLevel: 'low',
    relatedArticles: ['cv-grunder'],
    relatedTools: ['/cv'],
    author: 'Jobin Team',
    authorTitle: 'Lätt svenska-redaktionen',
  },

  {
    id: 'latt-svenska-soka-jobb',
    title: 'Hur söker man jobb?',
    summary: 'En enkel guide om hur du söker jobb steg för steg.',
    content: `# Hur söker man jobb?

Att söka jobb kan vara svårt.
Men du kan lära dig!
Här är en enkel guide.

## Steg 1: Hitta jobb

Du kan hitta jobb på:
- Den här sidan (Jobin)
- Arbetsförmedlingen
- Företagens hemsidor
- LinkedIn

## Steg 2: Läs annonsen

Läs annonsen noga.
Titta på:
- Vad ska du göra på jobbet?
- Vad behöver du kunna?
- Var är jobbet?
- När börjar jobbet?

## Steg 3: Gör ditt CV redo

Ditt CV ska passa jobbet.
Lägg till saker som chefen vill se.

## Steg 4: Skriv ett brev

Skriv ett kort brev.
Berätta:
- Vem du är
- Varför du vill ha jobbet
- Varför du passar för jobbet

## Steg 5: Skicka ansökan

Skicka ditt CV och brev.
Oftast gör du det på en hemsida.

## Steg 6: Vänta

Nu får du vänta.
Det kan ta några veckor.
Sök fler jobb medan du väntar.

## Om du får svar

Grattis! Du kanske får komma på intervju.
Intervju = ett möte där chefen pratar med dig.

## Om du inte får svar

Det är okej. Det händer alla.
Fortsätt söka andra jobb.
Varje ansökan är bra övning.

## Tips

- Sök många jobb.
- Fråga din konsulent om hjälp.
- Ge inte upp!`,
    category: 'job-search',
    subcategory: 'application-strategy',
    tags: ['lätt svenska', 'söka jobb', 'nybörjare', 'enkel guide'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    readingTime: 3,
    difficulty: 'easy-swedish',
    energyLevel: 'low',
    relatedArticles: ['ansokningsstrategi'],
    relatedTools: ['/jobs'],
    author: 'Jobin Team',
    authorTitle: 'Lätt svenska-redaktionen',
  },

  {
    id: 'latt-svenska-intervju',
    title: 'Vad händer på en intervju?',
    summary: 'En enkel guide om jobbintervjuer.',
    content: `# Vad händer på en intervju?

En intervju är ett möte.
Du träffar en chef eller någon från företaget.
De vill lära känna dig.

## Innan intervjun

**Dag innan:**
- Ta reda på var intervjun är.
- Välj kläder som är rena och fina.
- Sov ordentligt.

**Samma dag:**
- Ät frukost.
- Kom i tid. Helst 10 minuter tidigt.
- Ta med ditt CV.

## Under intervjun

Chefen kommer ställa frågor.
Vanliga frågor:

**"Berätta om dig själv"**
Säg:
- Vad du heter
- Vad du gjort förut
- Varför du söker jobbet

**"Varför vill du jobba här?"**
Säg något bra om företaget.
Till exempel: "Jag gillar att ni..."

**"Vad är du bra på?"**
Berätta om något du kan.
Till exempel: "Jag är bra på att..."

**"Har du frågor?"**
Ställ en fråga till chefen.
Till exempel: "Hur ser en vanlig dag ut?"

## Tips under intervjun

- Titta på personen när du pratar.
- Le ibland.
- Lyssna noga på frågorna.
- Svara lugnt. Du behöver inte stressa.
- Det är okej att säga "Kan du förklara frågan?"

## Efter intervjun

Skicka ett kort meddelande.
Skriv: "Tack för intervjun. Det var trevligt att träffas."

## Om du är nervös

Det är normalt att vara nervös.
Andas djupt.
Tänk: "Jag ska göra mitt bästa."

Din konsulent kan öva intervju med dig.
Fråga om du vill ha hjälp!`,
    category: 'interview',
    subcategory: 'preparation',
    tags: ['lätt svenska', 'intervju', 'nybörjare', 'enkel guide'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    readingTime: 4,
    difficulty: 'easy-swedish',
    energyLevel: 'low',
    relatedArticles: ['intervju-forberedelse', 'under-intervjun'],
    author: 'Jobin Team',
    authorTitle: 'Lätt svenska-redaktionen',
  },

  {
    id: 'latt-svenska-avslag',
    title: 'Du fick inte jobbet - vad gör du nu?',
    summary: 'Det är okej att känna sig ledsen. Här är tips för att gå vidare.',
    content: `# Du fick inte jobbet

Ibland får man inte jobbet.
Det händer alla.
Det är okej att känna sig ledsen.

## Dina känslor är normala

Du kanske känner dig:
- Ledsen
- Arg
- Besviken
- Trött

Alla dessa känslor är okej.
Låt dig känna dem.

## Vad kan du göra?

**1. Vila lite**
Ta en paus från jobbsökning.
Gör något du tycker om.

**2. Prata med någon**
Berätta hur du mår.
Prata med:
- En vän
- Familj
- Din konsulent

**3. Tänk på vad du lärt dig**
Varje ansökan lär dig något.
Varje intervju gör dig bättre.

**4. Börja igen när du är redo**
Du behöver inte stressa.
Ta det i din takt.

## Kom ihåg

- Du är inte dålig för att du inte fick jobbet.
- Rätt jobb finns där ute för dig.
- Varje "nej" tar dig närmare ett "ja".

## Tips

- Sök flera jobb, inte bara ett.
- Fråga om feedback efter intervjun.
- Be din konsulent om hjälp.

## Du klarar det!

Jobbsökning tar tid.
Men du kommer att hitta ett jobb.
Vi tror på dig!`,
    category: 'wellness',
    subcategory: 'rejection',
    tags: ['lätt svenska', 'avslag', 'känslor', 'motivation'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    readingTime: 3,
    difficulty: 'easy-swedish',
    energyLevel: 'low',
    relatedArticles: ['hantera-avslag'],
    author: 'Jobin Team',
    authorTitle: 'Lätt svenska-redaktionen',
  },

  {
    id: 'latt-svenska-personligt-brev',
    title: 'Vad är ett personligt brev?',
    summary: 'En enkel guide om personliga brev.',
    content: `# Vad är ett personligt brev?

Ett personligt brev är ett kort brev till chefen.
Du skickar det tillsammans med ditt CV.

## Varför behöver du skriva ett?

I brevet kan du berätta:
- Vem du är
- Varför du vill ha jobbet
- Varför just du passar bra

CV:t visar vad du gjort.
Brevet visar vem du är.

## Hur skriver du ett brev?

**1. Börja med hälsning**
Skriv: "Hej!" eller "Till [företagets namn]"

**2. Skriv varför du söker**
Exempel: "Jag söker jobbet som [titel] hos er."

**3. Berätta lite om dig**
Vad har du gjort förut?
Vad kan du?

**4. Skriv varför du passar**
Varför är du bra för just det här jobbet?

**5. Avsluta snyggt**
Skriv: "Jag hoppas vi kan ses för en intervju."
Skriv ditt namn.

## Exempel på kort brev

"Hej!

Jag heter Anna och söker jobbet som butiksbiträde.

Jag har jobbat i butik förut.
Jag gillar att prata med människor.
Jag är alltid i tid.

Jag tror att jag passar bra hos er.
Jag hoppas vi kan ses.

Vänliga hälsningar,
Anna"

## Tips

- Skriv kort. Max en sida.
- Skriv inte samma sak som i CV:t.
- Läs igenom innan du skickar.
- Be någon kolla stavningen.

## Behöver du hjälp?

Vår brev-generator kan hjälpa dig.
Eller prata med din konsulent.`,
    category: 'job-search',
    subcategory: 'cover-letter',
    tags: ['lätt svenska', 'personligt brev', 'nybörjare', 'enkel guide'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    readingTime: 3,
    difficulty: 'easy-swedish',
    energyLevel: 'low',
    relatedArticles: ['personligt-brev-guide'],
    relatedTools: ['/cover-letter'],
    author: 'Jobin Team',
    authorTitle: 'Lätt svenska-redaktionen',
  },
]

// Helper function to get related articles
export const getRelatedArticles = (articleIds: string[]): EnhancedArticle[] => {
  return mockArticlesData.filter(article => articleIds.includes(article.id))
}

// Helper function to get articles by category
export const getArticlesByCategory = (categoryId: string): EnhancedArticle[] => {
  return mockArticlesData.filter(article => article.category === categoryId)
}

// Helper function to search articles
export const searchArticles = (query: string): EnhancedArticle[] => {
  const searchLower = query.toLowerCase()
  return mockArticlesData.filter(article =>
    article.title.toLowerCase().includes(searchLower) ||
    article.summary.toLowerCase().includes(searchLower) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchLower))
  )
}

// Helper function to get articles by energy level
export const getArticlesByEnergyLevel = (level: 'low' | 'medium' | 'high'): EnhancedArticle[] => {
  return mockArticlesData.filter(article => article.energyLevel === level)
}

// Helper function to get reading time category
export const getReadingTimeCategory = (minutes: number): string => {
  if (minutes <= 5) return 'snabb'
  if (minutes <= 10) return 'medel'
  return 'djup'
}

// Helper function to get easy Swedish articles
export const getEasySwedishArticles = (): EnhancedArticle[] => {
  return mockArticlesData.filter(article => article.difficulty === 'easy-swedish')
}

// Helper function to get articles by difficulty
export const getArticlesByDifficulty = (difficulty: 'easy-swedish' | 'easy' | 'medium' | 'detailed'): EnhancedArticle[] => {
  return mockArticlesData.filter(article => article.difficulty === difficulty)
}
