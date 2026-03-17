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
  difficulty: 'easy' | 'medium' | 'detailed'
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
    helpfulnessRating: 4.8,
    bookmarkCount: 124,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 156,
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

## Grundstruktur

Ett bra CV innehåller följande avsnitt:

### 1. Kontaktinformation
- Namn
- Telefonnummer
- E-postadress
- Ort (valfritt)
- LinkedIn-profil (valfritt)

### 2. Sammanfattning/Profil
En kort text (3-5 meningar) som sammanfattar vem du är, vad du kan och vad du söker.

### 3. Arbetslivserfarenhet
Lista dina tidigare anställningar i omvänd kronologisk ordning (senaste först).

### 4. Utbildning
Lista din utbildning, också i omvänd kronologisk ordning.

### 5. Kompetenser och färdigheter
Gruppera dina kompetenser i kategorier.

### 6. Övrigt (valfritt)
- Certifikat och tillstånd
- Förtroendeuppdrag
- Hobbyer (om relevant)
- Referenser

## ATS – så kommer du igenom filtren

Många företag använder ATS (Applicant Tracking Systems) – datorsystem som sorterar CV:n automatiskt.

✅ **Använd nyckelord från annonsen**
✅ **Undvik komplex formatering**
✅ **Använd standardrubriker**
✅ **Spara som .docx eller .pdf**

## Vanliga misstag att undvika

❌ **För långt CV** – Ett CV bör vara 1-2 sidor
❌ **Allmänna formuleringar** – Var konkret
❌ **Stavfel och slarv** – Låt någon korrekturläsa
❌ **Ett CV för alla jobb** – Anpassa för varje ansökan

## Nästa steg

När du har ett grund-CV är det dags att:
1. Anpassa det för specifika jobb
2. Skriva ett personligt brev
3. Förbereda dig för intervjun

Kom ihåg: Ett CV är aldrig "färdigt". Det är ett levande dokument som utvecklas med dig!`,
    category: 'job-search',
    subcategory: 'cv-writing',
    tags: ['CV', 'skriva CV', 'ATS', 'grunder', 'detaljerad'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    readingTime: 12,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.7,
    bookmarkCount: 203,
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

## Struktur på det personliga brevet

### 1. Rubrik
Namn på den du skriver till (om du vet det) eller "Hej!"

### 2. Inledning – väck intresse
Börja med något som fångar läsarens uppmärksamhet.

### 3. Varför detta jobb?
Visa att du har gjort din hemläxa.

### 4. Varför du?
Koppla dina erfarenheter och kompetenser till jobbets krav.

### 5. Avslutning
Sammanfatta kort och visa entusiasm.

### 6. Hälsning
"Med vänliga hälsningar" + ditt namn

## Viktiga principer

✅ **Var personlig men professionell**
✅ **Var specifik – ge exempel**
✅ **Håll det kort (max 1 A4)**
✅ **Anpassa för varje jobb**

❌ **Undvik:**
- Att upprepa CV:t ord för ord
- Negativa formuleringar om tidigare arbetsgivare
- För formellt eller för casual språk
- Stavfel och slarv

## Använd vår AI-assistent

Om du har svårt att komma igång kan du använda vår AI-assistent för personliga brev. Den hjälper dig att få en struktur att utgå ifrån.

Kom ihåg: AI:n är ett verktyg, inte en ersättning för din egen röst!`,
    category: 'job-search',
    subcategory: 'cover-letter',
    tags: ['personligt brev', 'ansökan', 'skriva', 'exempel'],
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-02-18T10:00:00Z',
    readingTime: 10,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.6,
    bookmarkCount: 178,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 234,
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
- Vad gör företaget?
- Vilka är deras kunder?
- Vilka är deras värderingar?
- Vad har de för företagskultur?

### Var hittar du information?
- Företagets hemsida
- LinkedIn
- Nyhetsartiklar
- Google Reviews

## Steg 2: Analysera jobbannonsen

Gå igenom annonsen och identifiera:
- Vilka är de viktigaste kraven?
- Vilka är önskvärda egenskaper?
- Vilka arbetsuppgifter ingår?

## Steg 3: Förbered dina svar

Öva på vanliga frågor:
- "Berätta om dig själv"
- "Varför söker du detta jobb?"
- "Vad är dina styrkor?"
- "Vad är din svaghet?"
- "Varför ska vi anställa just dig?"

## Steg 4: Förbered dina frågor

Att ställa frågor visar engagemang. Förbered 3-5 frågor om rollen, teamet och utvecklingsmöjligheter.

## Steg 5: Praktiska förberedelser

### Vad ska du ta med?
- Extra kopior av CV:t
- Anteckningsblock och penna
- Lista med dina frågor

### Vad ska du ha på dig?
- Anpassa efter företagskulturen
- När du är osäker: hellre för formellt än för casual

## Under intervjun

✅ **Gör detta:**
- Hälsa med ett fast handslag och ögonkontakt
- Var dig själv
- Lyssna aktivt
- Ställ dina förberedda frågor

❌ **Undvik detta:**
- Prata illa om tidigare arbetsgivare
- Se på klockan
- Svara bara ja/nej på öppna frågor

## Efter intervjun

1. Skicka ett tackmejl inom 24 timmar
2. Reflektera över vad som gick bra
3. Vänta tålmodigt på svar

## Kom ihåg

Intervjun är en dialog, inte ett förhör. Arbetsgivaren vill också sälja in företaget till dig!`,
    category: 'interview',
    subcategory: 'preparation',
    tags: ['intervju', 'förberedelser', 'detaljerad', 'tips'],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
    readingTime: 18,
    difficulty: 'detailed',
    energyLevel: 'high',
    helpfulnessRating: 4.8,
    bookmarkCount: 189,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 267,
    relatedArticles: ['intervju-forberedelser', 'digital-intervju'],
    relatedExercises: ['interview', 'intervju-traning'],
  },

  {
    id: 'digital-intervju',
    title: 'Digital intervju – så lyckas du på Zoom/Teams',
    summary: 'Allt om teknik, miljö och beteende för att lyckas i digitala intervjuer.',
    content: `Digitala intervjuer blir allt vanligare. Så här förbereder du dig för att göra ditt bästa intryck på distans.

## Teknisk förberedelse

### 1. Testa allt i förväg
- Ladda ner och testa programvaran
- Testa kamera och mikrofon
- Kontrollera din internetuppkoppling
- Ha en backup-plan

### 2. Optimera din miljö

**Belysning:** Sitt med ljuset framför dig
**Bakgrund:** Enkel och städad
**Ljud:** Stäng fönster och dörrar

### 3. Positionering
- Kameran i ögonhöjd
- Sitt en armlängd från kameran
- Titta i kameran när du pratar

## Under intervjun

✅ **Gör detta:**
- Logga in 5-10 minuter tidigt
- Stäng av notiser
- Ha vatten nära till hands
- Använd "mute" om du hostar

❌ **Undvik detta:**
- Äta under intervjun
- Titta neråt (ser ut som du läser)
- Multitaska

## Om något går fel

**Teknikproblem:** "Ursäkta, jag tror det är lite problem med ljudet. Kan ni höra mig nu?"

**Du fryser på bild:** "Det verkar vara problem med min uppkoppling. Får jag ringa upp igen?"

## Checklista för dagen

- [ ] Testat tekniken
- [ ] Kontrollerat belysning och bakgrund
- [ ] Stängt av notiser
- [ ] Förberett "fusklappar"
- [ ] Loggar in 10 min tidigt

En digital intervju är fortfarande en intervju. Förbered dig lika noga!`,
    category: 'interview',
    subcategory: 'during-interview',
    tags: ['digital intervju', 'Zoom', 'Teams', 'teknik', 'distans'],
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-02-17T10:00:00Z',
    readingTime: 12,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.7,
    bookmarkCount: 198,
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

**Viktigt:** Avslag betyder inte att du är oduglig.

## Dina känslor är giltiga

Det är okej att känna besvikelse, frustration eller oro. Tillåt dig att känna – men sätt en tidsgräns.

## Så hanterar du avslaget

### 1. Läs meddelandet (men inte för många gånger)
### 2. Tillåt dig att reagera – ring en vän, ta en promenad
### 3. Be om feedback (valfritt men rekommenderat)
### 4. Analysera (men inte överanalysera)
### 5. Gå vidare – fira att du vågade söka!

## Omslag av avslag till motivation

- Se det som träning
- Räkna framgångar, inte avslag
- Påminn dig om vad du kan

## Kom ihåg

🌱 **Du växer genom motgångar**
💪 **Ditt värde är inte ditt jobb**
🎯 **Rätt jobb kommer**

**Behöver du prata?** Din arbetskonsulent finns här för dig.`,
    category: 'wellness',
    subcategory: 'rejection',
    tags: ['avslag', 'hantera', 'motivation', 'pepp', 'stöd'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
    readingTime: 10,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 5.0,
    bookmarkCount: 312,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 278,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 245,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 189,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 234,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 345,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 178,
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
    content: `Att prata om lön kan kännas obekvämt, men det är en viktig del av arbetslivet. Här lär du dig hur du förhandlar på ett professionellt sätt.

## Förbered dig innan

### 1. Gör din research
- Vad tjänar andra i liknande roller?
- Kolla lönestatistik på SCB, Unionen, Akavia
- Fråga i nätverket (försiktigt)

### 2. Definiera ditt lönespann
- **Minimum:** Vad behöver du för att klara dig?
- **Mål:** Vad vore rimligt och rättvist?
- **Drömlön:** Vad vore fantastiskt?

### 3. Förbered dina argument
- Vilka resultat har du uppnått?
- Vilka extra ansvar har du tagit?
- Vilka kompetenser har du tillfört?

## Under förhandlingen

### Börja positivt
"Jag trivs jättebra här och uppskattar förtroendet..."

### Var konkret
- Använd siffror och exempel
- Koppla till affärsnytta
- Var specifik om vad du vill ha

### Ligg inte för högt
Begäran om 20% upprördhet kan stänga dörren. 5-10% är mer realistiskt.

### Var beredd på motargument
- "Det finns inte i budgeten" → Fråga när det kan bli aktuellt
- "Alla har samma lön" → Förklara varför du är exceptionell

## Vanliga misstag

❌ **Att ta det personligt**
Det är affärer, inte en bedömning av ditt värde som människa

❌ **Att jämföra med kollegor**
Fokusera på ditt bidrag, inte vad andra tjänar

❌ **Att hota med att sluta**
Det kan lätt slå tillbaka

❌ **Att ge upp vid första nej**
Fråga när ni kan återkomma till frågan

## Efter förhandlingen

Om du fick ja: **Fira!** 🎉

Om du fick nej:
- Be om en tidsplan för nästa förhandling
- Fråga vad du behöver uppnå för att få högre lön
- Överväg om andra förmåner kan kompensera (flextid, utbildning)

## Kom ihåg

Du förtjänar att få betalt för ditt värde. Var professionell, förberedd och bestämd!`,
    category: 'interview',
    subcategory: 'salary',
    tags: ['lön', 'förhandling', 'lönesamtal', 'löneanspråk', 'värdera sig själv'],
    createdAt: '2024-03-02T10:00:00Z',
    updatedAt: '2024-03-02T10:00:00Z',
    readingTime: 14,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.8,
    bookmarkCount: 267,
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
    content: `LinkedIn är världens största professionella nätverk – och ett oumbärligt verktyg för jobbsökare. Så här optimerar du din profil.

## Profilbild

✅ **Gör så här:**
- Professionell bild med neutral bakgrund
- Se in i kameran och le
- Ha på dig kläder som passar din bransch
- Använd en bild från axlarna och uppåt

❌ **Undvik:**
- Partybilder
- Självisar
- Bilder med andra människor
- Oskarpa eller mörka bilder

## Rubrik (Headline)

Din rubrik visas överallt – gör den räknas!

**Dålig:** "Söker jobb"
**Bättre:** "Erfaren kundtjänstmedarbetare | Fokus på kundnöjdhet"
**Bäst:** "Projektledare | 5 års erfarenhet av IT-projekt | Certifierad Scrum Master"

**Tips:** Använd nyckelord som rekryterare söker efter

## Om-sektionen (Summary)

Skriv i första person och berätta:
- Vem du är (professionellt)
- Vad du kan (kompetenser)
- Vad du söker (mål)

**Struktur:**
1. Stark inledning som väcker intresse
2. 2-3 meningar om din bakgrund
3. Dina styrkor och vad du brinner för
4. Call-to-action ("Jag söker nya möjligheter inom...")

## Erfarenhet

- Lista alla relevanta jobb
- Beskriv resultat, inte bara arbetsuppgifter
- Använd siffror när du kan
- Be om rekommendationer från tidigare chefer

## Kompetenser (Skills)

- Lista 50 av dina kompetenser (max tillåtet)
- Prioritera de mest relevanta först
- Be kollegor att " endorsa" (bekräfta) dina kompetenser

## Aktivitet

**Synlighet = Möjligheter**

- Dela intressanta artiklar med en personlig kommentar
- Gratulera kontakter till nya jobb
- Kommentera inlägg i din bransch
- Skriv egna inlägg om du vågar

## Nätverka strategiskt

- Skicka personliga förfrågningar (inte standardtexten)
- Följ företag du vill jobba på
- Kontakta rekryterare i din bransch

## Sök jobb på LinkedIn

- Använd filter för att hitta rätt jobb
- Spara jobbsökningar
- Aktivera "Open to work"-funktionen
- Ansök via "Easy Apply" men skicka alltid personligt brev separat

## Kom ihåg

LinkedIn är inte Facebook – håll det professionellt men personligt. Visa att du är en människa, inte bara en lista med kompetenser!`,
    category: 'job-market',
    subcategory: 'digital-presence',
    tags: ['LinkedIn', 'digital närvaro', 'nätverkande', 'online-profil', 'rekrytering'],
    createdAt: '2024-03-03T10:00:00Z',
    updatedAt: '2024-03-03T10:00:00Z',
    readingTime: 16,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.7,
    bookmarkCount: 223,
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
    tags: ['tackbrev', 'intervju', 'follow-up', 'etikett', 'kommunikation'],
    createdAt: '2024-03-04T10:00:00Z',
    updatedAt: '2024-03-04T10:00:00Z',
    readingTime: 10,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 4.9,
    bookmarkCount: 312,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 189,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 245,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 198,
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

## Vanliga styrkeområden

**Sociala styrkor:**
- Att bygga relationer och skapa förtroende
- Att kommunicera tydligt och övertygande
- Att samarbeta och få grupper att fungera
- Att förstå andras perspektiv och behov

**Intellektuella styrkor:**
- Att analysera komplex information
- Att tänka strategiskt och se mönster
- Att lära sig snabbt och anpassa sig
- Att lösa problem kreativt

**Praktiska styrkor:**
- Att organisera och skapa struktur
- Att planera och hålla deadlines
- Att vara noggrann och detaljorienterad
- Att genomföra och slutföra uppgifter

**Kreativa styrkor:**
- Att hitta nya lösningar och idéer
- Att tänka utanför boxen
- Att se möjligheter andra missar
- Att visualisera och inspirera

## Konkreta exempel på styrkor i arbetslivet

| Styrka | Hur det visar sig | Passande roller |
|--------|-------------------|-----------------|
| Organisering | Du älskar att skapa ordning och system | Projektledare, administratör |
| Empati | Du förstår snabbt hur andra mår | Vårdyrken, HR, kundservice |
| Analys | Du ser mönster i data och information | Analytiker, revisor, forskare |
| Kommunikation | Du förklarar komplexa saker enkelt | Lärare, säljare, journalist |
| Problemlösning | Du hittar lösningar där andra ser hinder | Konsult, utvecklare, tekniker |

## Använd dina styrkor i jobbsökningen

### I ditt CV
- Lyft fram styrkor som är relevanta för jobbet
- Använd konkreta exempel: "Organiserade ett event för 200 deltagare"
- Koppla styrkor till resultat

### I intervjun
- Berätta om situationer där dina styrkor gjort skillnad
- Använd STAR-metoden (Situation, Task, Action, Result)
- Visa självinsikt om både styrkor och utvecklingsområden

### Vid jobbsökning
- Sök roller där du får använda dina styrkor dagligen
- Undvik roller som kräver det motsatta
- Fråga om arbetsuppgifterna i intervjun

## Vanliga misstag

- Att förväxla vad du KAN med vad som GER DIG ENERGI
- Att underskatta vardagliga styrkor
- Att jämföra dig med andra istället för att hitta ditt unika
- Att inte be om feedback från andra

## Kom ihåg

Dina styrkor är unika för dig. När du jobbar med dem känns det inte som jobb – det känns som att vara dig själv! Det bästa jobbet är ett där du får använda dina styrkor varje dag.`,
    category: 'self-awareness',
    subcategory: 'strengths',
    tags: ['styrkor', 'självkännedom', 'talanger', 'personlig utveckling'],
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    readingTime: 12,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 4.8,
    bookmarkCount: 156,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 234,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 189,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 178,
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

## Informationsmöten

Att be om ett informationsmöte är mindre hotande än att be om jobb:
- Be om 20-30 minuter
- Förbered frågor om personens yrke och företag
- Be om tips på andra att kontakta
- Skicka ett tackbrev efteråt

### Bra frågor att ställa
- "Hur ser en typisk dag ut för dig?"
- "Vad tycker du bäst om med ditt jobb?"
- "Hur tog du dig till din nuvarande position?"
- "Vilka råd skulle du ge någon som vill in i branschen?"
- "Känner du någon annan jag borde prata med?"

## Underhåll ditt nätverk

### Regelbunden kontakt
- Gratulera till nya jobb och milstolpar
- Dela intressanta artiklar
- Hör av dig utan att be om något

### Ge mer än du tar
- Erbjud hjälp när du kan
- Dela information och kontakter
- Var generös med din tid och kunskap

## Vanliga hinder – och hur du övervinner dem

**"Jag är för blyg"**
Börja digitalt via LinkedIn. Skriftlig kontakt är lättare än telefonsamtal.

**"Jag vill inte verka desperat"**
Du ber om råd och insikter, inte om ett jobb. De flesta uppskattar att bli tillfrågade!

**"Jag har inget nätverk"**
Alla börjar någonstans. Ditt nätverk växer med varje person du pratar med.

**"Jag vet inte vad jag ska säga"**
Förbered dig. Skriv ner frågor och öva på din "hiss-pitch" om dig själv.

## Kom ihåg

Nätverkande handlar om relationer, inte transaktioner. Var genuint intresserad av andra människor, ge utan att förvänta dig något tillbaka, och ha tålamod. De bästa kontakterna byggs över tid!`,
    category: 'networking',
    subcategory: 'building-network',
    tags: ['nätverkande', 'nätverk', 'dolda jobbmarknaden', 'kontakter', 'informationsmöten'],
    createdAt: '2024-03-13T10:00:00Z',
    updatedAt: '2024-03-13T10:00:00Z',
    readingTime: 13,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.8,
    bookmarkCount: 212,
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
    tags: ['personligt varumärke', 'digital närvaro', 'LinkedIn', 'online-profil'],
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    readingTime: 14,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.7,
    bookmarkCount: 178,
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

### Nackdelar
- Kan vara svårare att få direkt
- Mindre flexibilitet om du vill byta
- Längre uppsägningstid kan kännas bindande

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

### Nackdelar med visstid
- Osäkerhet om framtiden
- Svårare att planera ekonomi
- Kan vara svårare att få lån

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

### Nackdelar
- Ingen garanterad inkomst
- Osäkerhet
- Svårare med planering

### Dina rättigheter
- Samma timlön som ordinarie
- Semester (betalas ofta som tillägg)
- Arbetsmiljöskydd

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

## Kollektivavtal

### Vad är det?
Avtal mellan fackförbund och arbetsgivarorganisation som ger bättre villkor än lagen.

### Fördelar med kollektivavtal
- Högre minimilön
- Bättre pension (tjänstepension)
- Föräldraledighetstillägg
- Längre semester
- Försäkringar

### Så kollar du
Fråga arbetsgivaren: "Har ni kollektivavtal? Med vilket förbund?"

## Frågor att ställa vid anställning

- Vilken anställningsform erbjuds?
- Hur lång är provanställningen?
- Vad händer efter provanställningen?
- Finns kollektivavtal?
- Hur ser möjligheterna till fast tjänst ut?
- Vilken uppsägningstid gäller?

## Kom ihåg

- Ingen anställningsform är "dålig" – de passar olika situationer
- Visstidsanställningar är ofta ett första steg
- Läs alltid anställningsbeviset noga
- Fråga om du är osäker på något!`,
    category: 'employment-law',
    subcategory: 'employment-types',
    tags: ['anställningsformer', 'tillsvidare', 'visstid', 'provanställning', 'rättigheter'],
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z',
    readingTime: 15,
    difficulty: 'medium',
    energyLevel: 'medium',
    helpfulnessRating: 4.8,
    bookmarkCount: 234,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 289,
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

### Tidsperspektiv
Tänk i olika tidshorisonter:
- **5 år:** Din stora vision
- **1 år:** Konkret mål att arbeta mot
- **3 månader:** Första milstolpen
- **1 månad:** Första steget

## Steg 3: Sätt SMARTA mål

### Vad är SMARTA mål?

| Bokstav | Betydelse | Fråga att ställa |
|---------|-----------|------------------|
| S | Specifikt | Vad exakt ska uppnås? |
| M | Mätbart | Hur vet jag att jag nått målet? |
| A | Attraktivt | Varför vill jag detta? |
| R | Realistiskt | Är det möjligt att uppnå? |
| T | Tidsbundet | När ska det vara klart? |

### Exempel på SMARTA mål

**Dåligt mål:** "Jag vill bli bättre på marknadsföring"

**SMART mål:** "Jag ska genomföra Google Analytics-certifieringen senast 30 april och kunna analysera webbtrafikdata självständigt"

**Dåligt mål:** "Jag vill ha ett nytt jobb"

**SMART mål:** "Jag ska ha skickat 15 skräddarsydda ansökningar till projektledarroller inom IT-branschen före 1 maj"

### Dina mål för varje tidshorisont

**5-årsmål (vision):**
- Vilken position vill du ha?
- Vilken bransch?
- Vilken kompetensnivå?

**1-årsmål:**
- Vilket konkret steg tar dig närmare visionen?
- Vilken utbildning eller erfarenhet behöver du?

**3-månadersmål:**
- Vad kan du uppnå på kort sikt?
- Vilka snabba vinster finns?

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

### När du ska ändra planen
Det är OK att ändra din plan om:
- Du lärt dig något nytt om dig själv
- Omständigheter har förändrats
- Du hittat en bättre väg
- Dina värderingar har ändrats

## Vanliga hinder och lösningar

**"Jag vet inte vad jag vill"**
→ Gör drömjobbsanalysen och testa olika saker

**"Jag har inte tid"**
→ Börja med 15 minuter per dag – det räcker långt

**"Det känns överväldigande"**
→ Fokusera bara på nästa steg, inte hela resan

**"Jag tappar motivationen"**
→ Fira små framsteg och påminn dig om varför du gör detta

## Kom ihåg

- En plan behöver inte vara perfekt för att vara användbar
- Det är bättre med en enkel plan du följer än en komplex du ignorerar
- Justera planen när du lär dig mer
- Fira dina framsteg längs vägen!`,
    category: 'career-development',
    subcategory: 'career-planning',
    tags: ['karriärplanering', 'mål', 'vision', 'handlingsplan', 'utveckling'],
    createdAt: '2024-03-18T10:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z',
    readingTime: 16,
    difficulty: 'medium',
    energyLevel: 'high',
    helpfulnessRating: 4.7,
    bookmarkCount: 198,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 245,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 245,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 189,
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
    helpfulnessRating: 4.6,
    bookmarkCount: 156,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 312,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 267,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 234,
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
    tags: ['CV-mallar', 'mallar', 'exempel', 'CV', 'templates', 'jobbsökning'],
    createdAt: '2024-04-02T10:00:00Z',
    updatedAt: '2024-04-02T10:00:00Z',
    readingTime: 16,
    difficulty: 'easy',
    energyLevel: 'medium',
    helpfulnessRating: 4.8,
    bookmarkCount: 456,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 234,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 198,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 287,
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
    helpfulnessRating: 4.9,
    bookmarkCount: 312,
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
    helpfulnessRating: 4.8,
    bookmarkCount: 256,
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
    helpfulnessRating: 4.7,
    bookmarkCount: 189,
    relatedArticles: ['natverka-for-jobb', 'linkedin-optimering', 'informationsintervju-guide'],
    relatedExercises: ['networking'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
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
