/**
 * Kunskapsbankens kategoriregister — EN sanning.
 *
 * ## Varför filen finns
 *
 * Fram till 2026-08-22 fanns samma tretton kategorier på tre ställen, och de
 * hade redan glidit isär. Samma kategori hette olika saker beroende på var
 * användaren stod:
 *
 * | Yta | Vad som visades |
 * |---|---|
 * | Landningens kort (`KnowledgeBase.tsx`) | `Intervju och anställning` |
 * | Filterkolumn + artikelkort (`articleData.ts`) | `🎯 Intervju & Anställning` |
 * | Artikelsidan (`Article.tsx`) | `interview` — råslugen |
 *
 * Dessutom platta `categoryNameMap` ihop huvud- och underkategorier i samma
 * objekt, och tre id:n förekom i båda: `job-search`, `interview` och `rights`.
 * Den sista vann, så två av tretton kategorier tappade både emoji och namn.
 * Underkategorinamnen slogs aldrig upp av någon levande kod — de fanns bara
 * för att skapa kollisionen. Därför bär det här registret enbart
 * huvudkategorierna.
 *
 * Namn och beskrivningar bor i `sv.json`/`en.json` under
 * `knowledgeBase.categories.<id>`. Reservnamnen nedan är i18next-defaults, så
 * en saknad nyckel ger ett läsbart svenskt namn — aldrig en slug.
 */

import type { TFunction } from 'i18next'
import {
  Rocket,
  UserCircle,
  Search,
  Target,
  Network,
  Monitor,
  Scale,
  TrendingUp,
  Heart,
  Accessibility,
  Briefcase,
  Wrench,
  Languages,
  BookOpen,
} from '@/components/ui/icons'

// ── Typer ────────────────────────────────────────────────────────────────
// Låg tidigare i services/articleData.ts, tillsammans med 24 600 rader
// artikeltext. Den filen laddas numera bara på begäran, så typerna och
// kategorierna flyttade hit för att inte dra in den i bygget.

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
  /** Ingen kod skriver fältet — se kommentaren i contentApi. */
  helpfulnessRating?: number
  /** Dito. */
  bookmarkCount?: number
  relatedArticles: string[]
  relatedTools?: string[]
  relatedExercises?: string[]
  checklist?: ArticleChecklistItem[]
  actions?: ArticleAction[]
  author?: string
  authorTitle?: string
}

/** Mappning från övningskategorier till artikelkategorier. */
export const exerciseToArticleCategoryMap: { [key: string]: string } = {
  'Självkännedom': 'self-awareness',
  'Jobbsökning': 'job-search',
  'Nätverkande': 'networking',
  'Digital närvaro': 'digital-presence',
  'Arbetsrätt': 'employment-law',
  'Karriärutveckling': 'career-development',
  'Välmående': 'wellness',
}

// ── Registret ────────────────────────────────────────────────────────────

export interface Artikelkategori {
  id: string
  /** Svenskt reservnamn = i18next-default. Aldrig en slug. */
  reservnamn: string
  reservbeskrivning: string
  ikon: React.ComponentType<{ className?: string; size?: number }>
}

/**
 * Ordningen är den som visas på landningen: orientering först, sedan de
 * ämnen man söker sig till, och lätt svenska sist eftersom den skär tvärs
 * över de andra.
 *
 * Id:na måste matcha `articles.category_key` i prod. Vaktat av
 * `kunskapskategorier.test.ts`, som jämför mot de värden databasen faktiskt
 * bär — en felstavning här gav tidigare ett kort som ledde till ett tomt rum
 * utan att något test märkte det.
 */
export const ARTIKELKATEGORIER: Artikelkategori[] = [
  { id: 'getting-started', reservnamn: 'Komma igång', reservbeskrivning: 'Orientering i portalen och första stegen i din jobbsökning.', ikon: Rocket },
  { id: 'self-awareness', reservnamn: 'Självkännedom', reservbeskrivning: 'Förstå dina styrkor, intressen och personlighet för att hitta rätt yrke.', ikon: UserCircle },
  { id: 'job-search', reservnamn: 'Jobbsökning', reservbeskrivning: 'Strategier och tekniker för att hitta och söka jobb effektivt.', ikon: Search },
  { id: 'interview', reservnamn: 'Intervju och anställning', reservbeskrivning: 'Förberedelser, intervjuteknik och anställningsprocessen.', ikon: Target },
  { id: 'networking', reservnamn: 'Nätverkande', reservbeskrivning: 'Bygg och underhåll ett professionellt nätverk som öppnar dörrar.', ikon: Network },
  { id: 'digital-presence', reservnamn: 'Digital närvaro', reservbeskrivning: 'Optimera din profil och synlighet på nätet.', ikon: Monitor },
  { id: 'employment-law', reservnamn: 'Arbetsrätt och anställning', reservbeskrivning: 'Dina rättigheter, skyldigheter och vad du behöver veta om anställning.', ikon: Scale },
  { id: 'career-development', reservnamn: 'Karriärutveckling', reservbeskrivning: 'Planera och utveckla din karriär på lång sikt.', ikon: TrendingUp },
  { id: 'wellness', reservnamn: 'Välmående och motivation', reservbeskrivning: 'Stöd för mental hälsa och motivation i jobbsökningen.', ikon: Heart },
  { id: 'accessibility', reservnamn: 'Tillgänglighet och stöd', reservbeskrivning: 'Rättigheter, stöd och anpassningar.', ikon: Accessibility },
  { id: 'job-market', reservnamn: 'Arbetsmarknaden', reservbeskrivning: 'Information om arbetsmarknaden och olika branscher.', ikon: Briefcase },
  { id: 'tools', reservnamn: 'Praktiska verktyg', reservbeskrivning: 'Checklistor, mallar och praktiska guider.', ikon: Wrench },
  { id: 'easy-swedish', reservnamn: 'Lätt svenska', reservbeskrivning: 'Artiklar skrivna på enkel och lättförståelig svenska.', ikon: Languages },
]

const REGISTER = new Map(ARTIKELKATEGORIER.map((k) => [k.id, k]))

export function harKategori(id: string | undefined | null): boolean {
  return !!id && REGISTER.has(id)
}

export function kategoriIkon(id: string | undefined | null) {
  return (id && REGISTER.get(id)?.ikon) || BookOpen
}

/** i18next-hookens `t`. Typen ligger här så att uppslagsfunktionerna kan
 *  anropas från vilken komponent som helst utan egen wrapper. */
type Oversattare = TFunction

/**
 * Läsbart kategorinamn. Returnerar ALDRIG id:t — en okänd kategori får
 * "Övrigt", inte `job-search`. Artikelsidan visade råslugen i en badge
 * ovanför rubriken fram till 2026-08-22.
 */
export function kategoriNamn(t: Oversattare, id: string | undefined | null): string {
  const post = id ? REGISTER.get(id) : undefined
  if (!post) return t('knowledgeBase.categories.other', 'Övrigt')
  return t(`knowledgeBase.categories.${post.id}.name`, post.reservnamn)
}

export function kategoriBeskrivning(t: Oversattare, id: string): string {
  const post = REGISTER.get(id)
  if (!post) return ''
  return t(`knowledgeBase.categories.${post.id}.description`, post.reservbeskrivning)
}
