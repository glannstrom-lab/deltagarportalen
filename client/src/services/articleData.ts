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
  checklist?: ArticleChecklistItem[]
  actions?: ArticleAction[]
  author?: string
  authorTitle?: string
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
    id: 'cv-application',
    name: '📝 CV & Ansökan',
    description: 'Allt om att skriva CV, personligt brev och ansöka',
    icon: 'FileText',
    subcategories: [
      { id: 'cv-writing', name: 'CV-skrivning' },
      { id: 'cover-letter', name: 'Personligt brev' },
      { id: 'ats', name: 'ATS & digitala system' },
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
    id: 'wellness',
    name: '🧠 Välmående & Motivation',
    description: 'Stöd för mental hälsa och motivation i jobbsökningen',
    icon: 'Heart',
    subcategories: [
      { id: 'rejection', name: 'Hantera avslag' },
      { id: 'motivation', name: 'Motivation' },
      { id: 'stress', name: 'Stresshantering' },
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
      { id: 'career-change', name: 'Karriärväxling' },
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
