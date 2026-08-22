/**
 * Kunskapsbankens KATEGORIREGISTER (den gamla varianten, med emoji och
 * underkategorier).
 *
 * ## Vad som togs bort 2026-08-22
 *
 * Filen var 24 856 rader. 24 615 av dem var `mockArticlesData` — 141 hela
 * artiklar som `contentApi` returnerade tyst vid varje DB-fel. Prod har 163,
 * så reservkopian var både inaktuell (31 artiklar saknades) och trasig
 * (141 poster men bara 133 unika id — åtta gick inte att öppna). Uppmätt i
 * bygget vägde chunken **247 kB brotli**, appens näst största, och den drogs
 * in av åtta sidor. Se kommentaren överst i `services/contentApi.ts`.
 *
 * Med den gick också sju exporterade hjälpfunktioner — `getRelatedArticles`,
 * `getArticlesByCategory`, `searchArticles`, `getArticlesByEnergyLevel`,
 * `getReadingTimeCategory`, `getEasySwedishArticles`, `getArticlesByDifficulty`
 * — samtliga med noll anropare.
 *
 * ## Vad som är kvar, och varför
 *
 * `articleCategories` används av `contentArticleApi.getCategories()`, som
 * ALLTID faller tillbaka hit: tabellen `article_categories` har 0 rader i
 * prod. Listan är alltså inte en attrapp utan den faktiska källan.
 *
 * **För UI:t finns ett annat register.** `data/artikelkategorier.ts` äger
 * namn, beskrivning och ikon för de tretton kategorierna, utan emoji och utan
 * underkategorier — se dess docstring för varför de två inte får slås ihop
 * ännu. Typerna bor också där.
 */

export type {
  ArticleChecklistItem,
  ArticleAction,
  EnhancedArticle,
} from '@/data/artikelkategorier'

export { exerciseToArticleCategoryMap } from '@/data/artikelkategorier'

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
      { id: 'portfolio', name: 'Portfolio' },
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
