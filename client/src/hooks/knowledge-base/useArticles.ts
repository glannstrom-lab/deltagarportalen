/**
 * React Query-hook för kunskapsbanken.
 *
 * ## Vad som togs bort 2026-08-22
 *
 * Filen var 250 rader med nio exporter. **En** av dem hade konsumenter:
 * `useArticles` (KnowledgeBase, PrintableResources, InterviewSimulator).
 * De åtta andra — `useArticle`, `useBookmarks`, `useToggleBookmark`,
 * `useSaveProgress`, `useReadingProgress`, `usePrefetchArticle`,
 * `useSearchArticles`, `usePersonalizedArticles` — hade noll. Filnivå-
 * nåbarhet kan per definition inte se det: filen *är* nåbar.
 *
 * Två av dem var dessutom skarpt trasiga:
 *
 * - `useBookmarks` anropade `/api/bookmarks`. Den endpointen finns inte, och
 *   `client/vercel.json` skriver om allt till `index.html` — så anropet fick
 *   **200 med HTML**, `response.json()` kastade, och localStorage-fallbacken
 *   räddade det av misstag. Var `response.ok` någon gång falskt saknade
 *   grenen `return` helt, och React Query avvisar `undefined`.
 * - `useToggleBookmark` POST:ade mot samma icke-existerande endpoint. 405 får
 *   inte `fetch` att kasta, så `catch`-grenen med localStorage kördes aldrig:
 *   bokmärket levde i den optimistiska cachen tills invalideringen läste
 *   tillbaka en tom lista. Ingenting sparades, inget fel visades.
 *
 * Den fungerande bokmärkesvägen är `articleBookmarksApi` i
 * `services/cloudStorage.ts`, mot tabellen `article_bookmarks`. Den används
 * av `Article.tsx` och `Resources.tsx`. Bygg vidare på den — inte här.
 */

import { useQuery } from '@tanstack/react-query'
import { articleApi } from '@/services/supabaseApi'
import type { Article } from '@/types/knowledge'

const ARTICLES_KEY = 'articles'

/**
 * Alla aktiva artiklar, utan brödtext.
 *
 * `articleApi.getAll()` KASTAR vid fel sedan 2026-08-22 — den returnerade
 * tidigare 141 inbyggda artiklar tyst, så ett RLS-fel eller schemadrift såg
 * ut som en fungerande kunskapsbank. Konsumenter måste därför läsa `isError`
 * och visa ett felläge; `data` blir `undefined`, inte en påhittad lista.
 */
export function useArticles() {
  return useQuery<Article[]>({
    queryKey: [ARTICLES_KEY],
    queryFn: () => articleApi.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export default useArticles
