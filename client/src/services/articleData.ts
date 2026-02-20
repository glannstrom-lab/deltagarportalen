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
      { label: '📅 Boka stödsamtal', href: '/calendar', type: 'primary' },
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
