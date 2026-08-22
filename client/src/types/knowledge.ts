/**
 * Artikeltyperna för kunskapsbanken.
 *
 * Den här filen SAKNADES fram till 2026-08-22, trots att fyra filer
 * importerade `Article` härifrån — `useArticles.ts`, `TopicsTab.tsx`,
 * `ForYouTab.tsx` och `QuickHelpTab.tsx`. Följden var fyra `TS2307` i
 * strict-taket, och ett undantag i `scripts/typecheck-critical.cjs` med
 * motiveringen "`import type` only — erased at build time".
 *
 * Motiveringen stämde: bygget kraschade inte. Det som inte stod någonstans är
 * priset — `Article` blev `any`, så de två filer som **filtrerar och renderar
 * artiklarna** hade noll typkontroll på artikelformen. Precis där ett
 * `category_key`/`category`-glapp eller ett fält utan producent
 * (`helpfulnessRating`) skulle ha fångats av kompilatorn.
 *
 * Formen är densamma som databasen levererar via `dbArticleToEnhanced` i
 * `services/contentApi.ts` — därför återexporteras den i stället för att
 * skrivas av. Två sanningar om samma form är hur glappen uppstår.
 */

export type {
  EnhancedArticle as Article,
  EnhancedArticle,
  ArticleChecklistItem,
  ArticleAction,
} from '@/data/artikelkategorier'
