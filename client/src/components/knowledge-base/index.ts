/**
 * Enda konsumenten är `pages/Article.tsx` (verifierat 2026-08-22).
 *
 * Lägg inte till en export här utan en riktig importör. Barreln höll fram
 * till 2026-08-22 nio rader dödkod vid liv — fem flikkomponenter som ingen
 * monterade, en läsväg, ett kategorifilter och en övningsstig — och eftersom
 * `Article.tsx` importerar härifrån markerade nåbarhetsanalysen allihop som
 * nåbara. Skriptet ser inte skillnad på "exporteras" och "renderas".
 * Se lärdomen 2026-08-04 i CLAUDE.md.
 *
 * `TopicsTab` ligger med flit INTE här: `KnowledgeBase.tsx` lazy-importerar
 * den direkt, och en barrelrad hade dragit in hela katalogen i den chunken.
 */
export { default as ArticleChecklist } from './ArticleChecklist'
export { default as ArticleContent } from './ArticleContent'
export { default as DifficultyBadge } from './DifficultyBadge'
export { default as EnhancedArticleCard } from './EnhancedArticleCard'
export { default as ReadingProgress } from './ReadingProgress'
export { default as ReadingTime } from './ReadingTime'
export { default as TextToSpeech } from './TextToSpeech'
