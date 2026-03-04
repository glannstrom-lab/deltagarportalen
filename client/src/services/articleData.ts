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
    category: 'cv-application',
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
    category: 'cv-application',
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
    category: 'cv-application',
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
    tags: ['nystartsjobb', 'stöd', 'subventionerad anställning', ' Arbetsförmedlingen'],
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
- OFta en del av utbildningen
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
    category: 'cv-application',
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
    content: `Att känna till sina styrkor är grunden för en framgångsrik karriär. När du vet vad du är bra på kan du göra medvetna val som leder till större trivsel och framgång.\n\n## Vad är styrkor?\n\nStyrkor är inte bara saker du kan göra – de är saker du gör bra OCH som ger dig energi. Det som gör dig stark!\n\n## Hur hittar du dina styrkor?\n\n### 1. Se tillbaka på framgångar\nTänk på situationer där du:\n- Kände dig engagerad och i flow\n- Fick beröm från andra\n- Åstadkom resultat med mindre ansträngning än andra\n\n### 2. Fråga andra\nBe 3-5 personer som känner dig att svara på vad de tycker du är bra på.\n\n### 3. Gör övningen\nI övningsmodulen hittar du en strukturerad övning för att kartlägga dina styrkor.\n\n## Vanliga styrkeområden\n\n**Sociala styrkor:** Att bygga relationer, kommunicera, samarbeta\n\n**Intellectuella styrkor:** Att analysera, tänka strategiskt, lära sig snabbt\n\n**Praktiska styrkor:** Att organisera, skapa ordning, planera\n\n**Kreativa styrkor:** Att hitta nya lösningar, tänka utanför boxen\n\n## Använd dina styrkor i jobbsökningen\n\n- Lyft fram styrkor som är relevanta för jobbet i CV:t\n- Berätta om situationer där dina styrkor gjort skillnad i intervjun\n- Sök roller där du får använda dina styrkor dagligen\n\n## Kom ihåg\n\nDina styrkor är unika för dig. När du jobbar med dem känns det inte som jobb – det känns som att vara dig själv!`,
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
    content: `Att förstå sin personlighetstyp kan ge ovärderliga insikter om vilka yrken och arbetsmiljöer som passar dig bäst.\n\n## De fyra personlighetstyperna\n\nBaserat på Arbetsförmedlingens modell finns det fyra grundläggande personlighetstyper:\n\n### 1. Den praktiska (Realistisk)\n**Kännetecken:**\n- Gillar att arbeta med händerna\n- Tycker om konkreta resultat\n- Föredrar praktiska uppgifter framför teoretiska\n\n**Passande yrken:** Byggarbetare, elektriker, lastbilschaufför, kock\n\n### 2. Den analytiska (Investigativ)\n**Kännetecken:**\n- Gillar att lösa problem\n- Tycker om att analysera och fördjupa sig\n- Föredrar intellektuella utmaningar\n\n**Passande yrken:** Programmerare, civilingenjör, forskar, ekonom\n\n### 3. Den sociala (Social)\n**Kännetecken:**\n- Gillar att hjälpa och samarbeta med andra\n- Tycker om att kommunicera och undervisa\n- Föredrar meningsfullt arbete med människor\n\n**Passande yrken:** Sjuksköterska, lärare, kundtjänstmedarbetare, kurator\n\n### 4. Den kreativa (Konstnärlig)\n**Kännetecken:**\n- Gillar att skapa och uttrycka sig\n- Tycker om att tänka nytt och se möjligheter\n- Föredrar varierande och inspirerande arbete\n\n**Passande yrken:** Designer, skribent, musiker, marknadsförare\n\n## Kombinationer av typer\n\nDe flesta av oss är en blandning av flera typer. Din primära och sekundära typ tillsammans ger en ännu tydligare bild.\n\n## Gör övningen\n\nI våra övningar finns en strukturerad guide som hjälper dig identifiera din personlighetstyp och hitta passande yrken.\n\n## Kom ihåg\n\nIngen typ är bättre än en annan. Arbetslivet behöver alla typer för att fungera!`,
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
    content: `Många underskattar vad de kan. Denna guide hjälper dig att kartlägga alla dina kompetenser så du kan visa ditt fulla värde för arbetsgivare.\n\n## Tre typer av kompetenser\n\n### 1. Formella kompetenser\nDina papper – utbildning, certifikat, behörigheter.\n\n### 2. Praktiska kompetenser\nDet du kan göra baserat på erfarenhet – oavsett om den är formell eller informell.\n\n### 3. Personliga kompetenser\nDina egenskaper och sätt att vara.\n\n## Hur gör du en inventering?\n\n### Steg 1: Lista all formell utbildning\nGå igenom alla år sedan grundskolan.\n\n### Steg 2: Dokumentera all arbetslivserfarenhet\nTänk brett – anställningar, praktik, sommarjobb, ideellt arbete.\n\n### Steg 3: Identifiera dolda erfarenheter\nMånga saker vi gör i vardagen är relevanta.\n\n### Steg 4: Definiera dina personliga styrkor\nFråga dig själv vad du är bra på utan att anstränga dig.\n\n## Gör övningen\n\nÖvningen Kompetensinventering tar dig igenom processen steg för steg och hjälper dig dokumentera allt du kan!`,
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

  // === NÄTVERKANDE (nya artiklar) ===
  {
    id: 'natverka-for-jobb',
    title: 'Nätverkande – din dolda jobbmarknad',
    summary: 'Lär dig hur du bygger och använder ett professionellt nätverk för att hitta dolda jobbmöjligheter.',
    content: `Upp till 70% av alla jobb tillsätts via nätverk. Att bygga relationer är inte bara bra – det är avgörande för din karriär.\n\n## Vad är nätverkande?\n\nNätverkande är att bygga och underhålla relationer som kan vara ömsesidigt fördelaktiga. Det handlar inte om att använda människor, utan om att skapa genuina kontakter.\n\n## Din nätverksposition idag\n\nDu har redan ett nätverk! Börja med att kartlägga:\n\n### Nära nätverk\n- Familj och vänner\n- Grannar\n- Tidigare klasskamrater\n- Tidigare kollegor\n\n### Professionellt nätverk\n- Arbetskonsulenter\n- Lärare/mentorer\n- Personer du träffat på praktik\n\n### Utvidgat nätverk\n- Vänners vänner\n- Kontakter på LinkedIn\n- Medlemmar i föreningar\n\n## Så börjar du nätverka\n\n### 1. Definiera vad du söker\nVar tydlig med vilken typ av jobb du söker och vilken information eller hjälp du behöver.\n\n### 2. Skapa en lista\nSkriv ner 20 personer du skulle kunna kontakta. Tänk brett!\n\n### 3. Nå ut\nKontakta personer med ett personligt meddelande.\n\n## Informationsmöten\n\nAtt be om ett informationsmöte är mindre hotande än att be om jobb:\n- Be om 20-30 minuter\n- Förbered frågor om personens yrke och företag\n- Be om tips på andra att kontakta\n- Skicka ett tackbrev efteråt\n\n## Gör övningen\n\nÖvningen Nätverka för att hitta jobb tar dig igenom hela processen – från att kartlägga ditt nätverk till att göra första kontakten.`,
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
    content: `Ditt personliga varumärke är vad folk säger om dig när du inte är i rummet. I dagens digitala värld är det avgörande för din karriär.\n\n## Vad är ett personligt varumärke?\n\nDitt personliga varumärke är:\n- Den bild andra har av dig\n- Det du är känd för\n- Din unika kombination av kompetenser och personlighet\n\n## Steg 1: Definiera ditt varumärke\n\n### Vilka är du?\n- Vilka är dina kärnkompetenser?\n- Vilka värderingar driver dig?\n- Vad vill du bli känd för?\n\n### Din unika vinkel\nVad skiljer dig från andra med liknande bakgrund?\n\n## Steg 2: Optimera dina profiler\n\n### LinkedIn\n- Professionell bild\n- Tydlig rubrik med nyckelord\n- Sammanfattning som berättar din historia\n\n## Steg 3: Skapa innehåll\n\n### Dela vad du lär dig\n### Visa ditt arbete\n### Engagera dig\n\n## Gör övningen\n\nÖvningen Ditt personliga varumärke hjälper dig definiera och kommunicera vad du vill vara känd för!`,
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
    content: `Att förstå olika anställningsformer hjälper dig göra medvetna val och veta vad du har rätt till.\n\n## Vanliga anställningsformer\n\n### Tillsvidareanställning (fast anställning)\n**Vad är det?\n- En anställning utan tidsbegränsning\n- Gäller tills du eller arbetsgivaren säger upp den\n- Starkast anställningsskydd\n\n**Fördelar:**\n- Trygghet och stabilitet\n- Försäkringar och förmåner\n- Lättare att få lån\n\n### Visstidsanställning (tidsbegränsad)\n**Vad är det?\n- Anställning för en specifik period\n- Slutar automatiskt vid periodens slut\n\n**Varianter:**\n- Allmän visstidsanställning\n- Vikariat\n- Säsongsanställning\n- Projektanställning\n\n### Timanställning\n- Anställning där du arbetar vid behov\n- Ingen garanterad arbetstid\n\n### Provanställning\n- En prövoperiod (vanligtvis 6 månader)\n- Båda parter kan avsluta utan uppsägningstid\n\n## Viktiga rättigheter\n\nOavsett anställningsform har du rätt till:\n- Lön enligt avtal\n- Semester\n- Arbetsmiljöskydd\n\n## Kom ihåg\n\n- Ingen anställningsform är sämre – de passar olika situationer\n- En visstidsanställning kan leda till fast jobb\n- Ställ frågor om något är oklart!`,
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
    content: `När du utvärderar ett jobberbjudande är det viktigt att se hela paketet – inte bara grundlönen.\n\n## Delar av ersättningspaketet\n\n### Kontant lön\nDet du får utbetalt varje månad före skatt.\n\n### Pension\n- Tjänstepension: Arbetsgivarens pensionssparande\n- Premiepension: En del av den allmänna pensionen\n\n### Semester\n- 25 dagar är lagstadgat\n- Många har 30 dagar eller mer\n\n### Försäkringar\n- Sjukförsäkring\n- Tjänstegrupplivförsäkring\n- Arbetsskadeförsäkring\n\n### Övriga förmåner\n- Friskvårdsbidrag\n- Flextid\n- Distansarbete\n- Kompetensutveckling\n\n## Att förhandla om förmåner\n\nIbland kan förmåner vara lika värdefulla som högre lön:\n- Flextid ger lättare att kombinera arbete och privatliv\n- Distansarbete sparar tid och pengar på resor\n- Kompetensutveckling ökar ditt framtida värde\n\n## Gör övningen\n\nÖvningen Förstå lön och förmåner hjälper dig göra marknadsundersökningar och förbereda löneförhandlingen.`,
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
    content: `En karriärplan är som en karta – den hjälper dig navigera från där du är idag till dit du vill vara.\n\n## Varför karriärplanera?\n\n- Riktning: Du vet vart du är på väg\n- Motivation: Tydliga mål ger drivkraft\n- Kontroll: Du styr din utveckling\n\n## Steg 1: Din nuvarande position\n\nBörja med att analysera var du är idag:\n- Vad har du?\n- Vad saknar du?\n\n## Steg 2: Din vision\n\nVar vill du vara om 3 månader? 1 år? 5 år?\n\n## Steg 3: Sätt SMARTA mål\n\nGör dina mål:\n- Specifika – tydligt vad du ska uppnå\n- Mätbara – så du vet när du nått dem\n- Atkomliga – realistiska men utmanande\n- Relevanta – kopplade till din vision\n- Tidsbundna – med deadline\n\n## Steg 4: Gör en handlingsplan\n\nBryt ner dina mål i konkreta steg:\n- Veckovis\n- Månadsvis\n- Kvartalsvis\n\n## Gör övningarna\n\n- Planera din karriärväg – långsiktig planering\n- Drömjobbsanalys – från vision till verklighet\n- Planera vidareutbildning – kompetensutveckling`,
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
    content: `Att ha en tydlig bild av vad du vill åstadkomma är första steget mot att nå dit. Denna guide hjälper dig definiera ditt drömjobb och göra en plan.\n\n## Definiera ditt drömjobb\n\n### Dröm stort – utan begränsningar\nOm du kunde välja helt fritt:\n- Vilken typ av arbete skulle du göra?\n- Vilken bransch?\n- Vilken roll?\n\n### Visualisera din perfekta arbetsdag\nBeskriv en typisk dag i ditt drömjobb.\n\n### Identifiera dina värderingar\nVad är viktigast för dig i ett jobb?\n\n## Gap-analys\n\n### Vad krävs för drömjobbet?\n### Vad har du redan?\n### Vad saknas?\n\n## Bryt ner till konkreta steg\n\n### Denna veckan\n### Kommande 3 månaderna\n### Kommande året\n\n## Gör övningen\n\nDrömjobbsanalys tar dig igenom hela processen med strukturerade frågor och hjälper dig skapa en konkret handlingsplan.`,
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

  // === VÄLMÅENDE (nya artiklar) ===
  {
    id: 'hantera-avslag-guide',
    title: 'Hantera avslag – väx genom motgångar',
    summary: 'Lär dig att hantera avslag på ett sätt som stärker dig och håller motivationen uppe.',
    content: `Att få avslag är en del av jobbsökningen. Det är inte ett misslyckande – det är en möjlighet att växa.\n\n## Avslag är normalt\n\n- De flesta ansökningar leder till avslag\n- Det är en sifferspel – ju fler du söker, desto fler avslag får du\n- Det säger inget om ditt värde som människa\n\n## Varför får man avslag?\n\nVanliga orsaker (som inte handlar om dig):\n- 200+ personer sökte samma jobb\n- En intern kandidat fick jobbet\n- De omorganiserade och lade ner tjänsten\n\n## Hantera känslorna\n\n### Tillåt dig att känna\nDet är okej att känna besvikelse och frustration.\n\n### Omsvängningsteknik\nFråga dig själv vad du kan lära dig av detta.\n\n## Be om feedback\n\nEtt avslag kan bli en möjlighet – be om feedback och använd informationen för att förbättra dig.\n\n## Bygg motståndskraft\n\n- Ett avslag är ett steg närmare JA\n- Varje ansökan är träning\n- Fira ansträngningen, inte bara resultatet\n\n## Gör övningen\n\nHantera avslag och motgångar hjälper dig omvärdera vad avslag betyder och bygga mental styrka.`,
    category: 'wellness',
    subcategory: 'rejection',
    tags: ['avslag', 'hantera', 'motgångar', 'motståndskraft', 'mental styrka'],
    createdAt: '2024-03-21T10:00:00Z',
    updatedAt: '2024-03-21T10:00:00Z',
    readingTime: 11,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 4.9,
    bookmarkCount: 312,
    relatedArticles: ['motivation-langsiktig', 'stresshantering'],
    relatedExercises: ['hantera-avslag'],
    actions: [
      { label: '🛡️ Gör övningen: Hantera avslag', href: '/exercises', type: 'primary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
  },

  {
    id: 'motivation-i-jobb-sokning',
    title: 'Behåll motivationen under långtidssökande',
    summary: 'Strategier för att orka fortsätta när jobbsökningen tar längre tid än väntat.',
    content: `Jobbsökning är ett maraton, inte en sprint. Här är strategier för att hålla motivationen uppe under lång tid.\n\n## Varför tappar vi motivation?\n\n- Den emotionella berg-och-dalbanan\n- Brist på kontroll\n- Isolering\n\n## Strategier för långsiktig motivation\n\n### 1. Sätt upp ett system, inte bara mål\nFokusera på processen: Söka 3 jobb i veckan istället för Få ett jobb.\n\n### 2. Dela upp dagen\n- Morgon: Energikrävande uppgifter\n- Eftermiddag: Lättare uppgifter\n- Kväll: Vila och återhämtning\n\n### 3. Fira små segrar\nVarje steg är värt att fira!\n\n### 4. Skapa rutiner\nFasta rutiner minskar beslutsutmatning.\n\n### 5. Var social\nMotverka isolering genom att träffa vänner och gå på nätverksevent.\n\n### 6. Ta hand om dig själv\n- Prioritera sömn (7-9 timmar)\n- Rör på dig regelbundet\n- Gör saker du tycker om\n\n## Gör övningarna\n\n- Hantera stress i jobbsökning\n- Motivationsboost för jobbsökaren\n- Strukturera din jobbsökarvecka`,
    category: 'wellness',
    subcategory: 'motivation',
    tags: ['motivation', 'långtidssökande', 'uthållighet', 'strategier', 'välmående'],
    createdAt: '2024-03-22T10:00:00Z',
    updatedAt: '2024-03-22T10:00:00Z',
    readingTime: 14,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 4.8,
    bookmarkCount: 278,
    relatedArticles: ['hantera-avslag-guide', 'stresshantering'],
    relatedExercises: ['wellbeing', 'motivationsboost', 'tidsplanering'],
    author: 'Maria Lindqvist',
    authorTitle: 'Arbetskonsulent',
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
    id: 'stresshantering-praktiska-tips',
    title: 'Praktisk stresshantering för arbetssökande',
    summary: 'Konkreta verktyg och tekniker för att hantera stress och oro under jobbsökningsperioden.',
    content: `Att söka jobb är en av livets mer stressande upplevelser. Här är praktiska verktyg du kan använda direkt när stressen känns för mycket.\n\n## Akut stresshantering – när det känns för mycket\n\n### 4-7-8-andning\nEn teknik som snabbt sänker stressnivån:\n1. Andas in genom näsan i 4 sekunder\n2. Håll andan i 7 sekunder\n3. Andas ut genom munnen i 8 sekunder\n4. Upprepa 3-4 gånger\n\n### 5-4-3-2-1-tekniken\nFörankra dig i nuet genom att identifiera:\n- 5 saker du ser\n- 4 saker du känner (fysiska sensationer)\n- 3 saker du hör\n- 2 saker du luktar\n- 1 sak du smakar\n\n### Fysisk rörelse\n- Gå en 10-minuters promenad\n- Gör några stretchövningar\n- Skaka ut händerna och armarna\n- Rullar axlarna bakåt\n\n## Dagliga rutiner som minskar stress\n\n### Morgonrutin\n- Vakna vid samma tid varje dag\n- Gör något du tycker om innan du börjar jobbsöka\n- Ät en ordentlig frukost\n- Undvik att kolla mail/sociala medier första timmen\n\n### Strukturera jobbsökningen\n- Sätt specifika tider för jobbsökning\n- Ta regelbundna pauser (var 45-60 minut)\n- Ha en tydlig sluttid varje dag\n\n### Eftermiddagsrutin\n- Gör något fysiskt (promenad, träning)\n- Träffa vänner eller familj\n- Sysselsätt dig med hobbyer\n\n### Kvällsrutin\n- Sluta jobbsöka minst 2 timmar innan läggdags\n- Skärmfri tid innan sängen\n- Regelbunden läggtid\n\n## Mentala strategier\n\n### Omfokusera tankarna\nNär oron tar över:\n- "Vad är det värsta som kan hända?" – Ofta är det hanterbart\n- "Vad kan jag kontrollera just nu?" – Fokusera på det\n- "Vad skulle jag säga till en vän i samma situation?"\n\n### Tacksamhetsövning\nVarje dag, skriv ner 3 saker du är tacksam för. De kan vara små:\n- "Solen sken idag"\n- "Jag fick ett vänligt meddelande"\n- "Kaffet var gott imorse"\n\n### Visualisering\n- Stäng ögonen\n- Föreställ dig att du har fått drömjobbet\n- Hur känns det? Vilka detaljer ser du?\n- Använd det som motivation\n\n## Socialt stöd\n\n### Be om hjälp\n- Berätta för vänner och familj hur du mår\n- Be om praktisk hjälp om du behöver\n- Acceptera att du inte behöver klara allt själv\n\n### Håll kontakten\n- Träffa människor regelbundet\n- Gå på nätverksträffar\n- Delta i stödgrupper för arbetssökande\n\n## När stressen blir för stor\n\n### Varningstecken\n- Du kan inte sova eller sover för mycket\n- Du tappar aptiten eller äter för mycket\n- Du känner dig konstant nedstämd\n- Du isolerar dig från andra\n- Du har fysiska symptom (huvudvärk, magproblem)\n\n### Sök professionell hjälp\n- Din arbetskonsulent finns där för dig\n- Vårdcentralen kan hjälpa\n- Kuratorer och psykologer finns tillgängliga\n- Det är inte svagt att be om hjälp – det är smart\n\n## Kom ihåg\n\nStress är en normal reaktion på en utmanande situation. Det betyder inte att du är svag eller inte klarar det. Ta en dag i taget och var snäll mot dig själv.`,
    category: 'wellness',
    subcategory: 'stress',
    tags: ['stresshantering', 'stress', 'mående', 'verktyg', 'andning', 'mental hälsa'],
    createdAt: '2024-03-30T10:00:00Z',
    updatedAt: '2024-03-30T10:00:00Z',
    readingTime: 15,
    difficulty: 'easy',
    energyLevel: 'low',
    helpfulnessRating: 4.9,
    bookmarkCount: 298,
    relatedArticles: ['stresshantering', 'motivation-i-jobb-sokning', 'hantera-avslag-guide'],
    relatedExercises: ['wellbeing', 'motivationsboost'],
    actions: [
      { label: '📅 Boka stödsamtal', href: '/diary', type: 'primary' },
    ],
    author: 'Lisa Bergström',
    authorTitle: 'Beteendevetare',
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
