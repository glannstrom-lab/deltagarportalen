/**
 * Renderar en artikels markdown som React-element.
 *
 * Ersätter den handskrivna styckeparsern som låg direkt i `pages/Article.tsx`.
 * Den delade innehållet på `\n\n` och kände igen `##`, `###`, listor, citat,
 * fet och kursiv — men VARKEN tabeller eller `# `-rubriker. Mätt i
 * `content/articles.snapshot.json` (133 artiklar): 23 artiklar innehåller
 * tabeller och visade rå pipe-text (`| Typ | Längd |`) för deltagarna, och 13
 * artiklar använder `# ` som renderades som vanlig brödtext.
 *
 * Parsern ligger i `articleMarkdown.ts` och följer semantiken i
 * `scripts/lib/markdown.cjs` (guidesidorna). Den här filen gör bara element
 * och styling av blocken.
 *
 * Säkerhet: innehållet kommer ur databasen och sätts in som React-element,
 * aldrig via `dangerouslySetInnerHTML`. React escapar därmed all text åt oss,
 * och länkar går genom `safeHref` så att `javascript:`-URL:er inte blir
 * klickbara.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { parseArticleMarkdown, parseInline } from './articleMarkdown'
import type { ArticleBlock } from './articleMarkdown'

export type ArticleFontSize = 'normal' | 'large' | 'xlarge'

const KOD_KLASS =
  'px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-900 text-[0.9em] font-mono text-gray-800 dark:text-gray-100'

/** `**fet**`, `*kursiv*`, `` `kod` `` och `[text](url)` → React-noder. */
function renderInline(text: string, nyckelPrefix: string): ReactNode {
  const segment = parseInline(text)
  if (!segment.length) return null

  return segment.map((s, i) => {
    const nyckel = `${nyckelPrefix}-${i}`
    switch (s.kind) {
      case 'code':
        return (
          <code key={nyckel} className={KOD_KLASS}>
            {s.text}
          </code>
        )
      case 'link': {
        const extern = /^https?:/i.test(s.href)
        return (
          <a
            key={nyckel}
            href={s.href}
            className="text-[var(--c-text)] underline underline-offset-2 hover:no-underline"
            {...(extern ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
          >
            {s.text}
          </a>
        )
      }
      case 'strong':
        return (
          <strong key={nyckel} className="font-semibold text-gray-900 dark:text-gray-50">
            {s.text}
          </strong>
        )
      case 'em':
        return <em key={nyckel}>{s.text}</em>
      default:
        return s.text
    }
  })
}

/** Rubrikklasser per nivå och vald textstorlek. Skalan följer DESIGN.md §5. */
const RUBRIK_KLASS: Record<2 | 3 | 4, Record<ArticleFontSize, string>> = {
  2: { normal: 'text-xl', large: 'text-2xl', xlarge: 'text-3xl' },
  3: { normal: 'text-lg', large: 'text-xl', xlarge: 'text-2xl' },
  4: { normal: 'text-base', large: 'text-lg', xlarge: 'text-xl' },
}

const RUBRIK_RYTM: Record<2 | 3 | 4, string> = {
  2: 'font-bold mt-8 mb-4',
  3: 'font-semibold mt-6 mb-3',
  4: 'font-semibold mt-4 mb-2',
}

/**
 * Skrollbehållare för en bred tabell.
 *
 * Tabellen skrollar i SIN EGEN behållare — sidan får aldrig skrolla i sidled.
 * Behållaren blir ett fokuserbart landmärke först när den faktiskt svämmar
 * över (WCAG 2.1.1 Keyboard): annars lägger vi ett tabbstopp i vägen helt i
 * onödan, och målgruppen navigerar ofta med tangentbord.
 */
function TabellSkroll({
  children,
  fontSize,
}: {
  children: ReactNode
  fontSize: ArticleFontSize
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [skrollbar, setSkrollbar] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mät = () => setSkrollbar(el.scrollWidth > el.clientWidth + 1)
    mät()
    window.addEventListener('resize', mät)
    return () => window.removeEventListener('resize', mät)
  }, [fontSize])

  return (
    <div
      ref={ref}
      data-testid="artikel-tabell-skroll"
      className="my-6 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700 focus-visible:outline-[var(--c-solid)]"
      {...(skrollbar
        ? {
            tabIndex: 0,
            role: 'region',
            'aria-label': t(
              'article.tableScrollLabel',
              'Tabell – skrolla i sidled för att se hela'
            ),
          }
        : {})}
    >
      {children}
    </div>
  )
}

function ArticleTable({
  head,
  rows,
  fontSize,
}: {
  head: string[]
  rows: string[][]
  fontSize: ArticleFontSize
}) {
  return (
    <TabellSkroll fontSize={fontSize}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-[0.95em]">
        {head.length > 0 && (
          <thead>
            <tr className="bg-[var(--c-bg)]">
              {head.map((cell, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 align-top font-semibold text-[var(--c-text)]"
                >
                  {renderInline(cell, `th-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        {rows.length > 0 && (
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t border-stone-200 dark:border-stone-700">
                {row.map((cell, c) => (
                  <td key={c} className="px-4 py-3 align-top text-gray-700 dark:text-gray-200">
                    {renderInline(cell, `td-${r}-${c}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </TabellSkroll>
  )
}

function ArticleBlockView({
  block,
  fontSize,
  index,
}: {
  block: ArticleBlock
  fontSize: ArticleFontSize
  index: number
}) {
  switch (block.kind) {
    case 'rule':
      return <hr className="my-8 border-stone-200 dark:border-stone-700" />

    case 'heading': {
      const Tag = (['h2', 'h3', 'h4'] as const)[block.level - 2]
      return (
        <Tag
          className={`text-gray-800 dark:text-gray-100 ${RUBRIK_RYTM[block.level]} ${
            RUBRIK_KLASS[block.level][fontSize]
          }`}
        >
          {renderInline(block.text, `h-${index}`)}
        </Tag>
      )
    }

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal pl-6 space-y-2 my-4 marker:font-semibold marker:text-[var(--c-solid)]">
          {block.items.map((item, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-200 pl-1">
              {renderInline(item, `ol-${index}-${i}`)}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc pl-6 space-y-2 my-4 marker:text-[var(--c-solid)]">
          {block.items.map((item, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-200">
              {renderInline(item, `ul-${index}-${i}`)}
            </li>
          ))}
        </ul>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-[var(--c-solid)] pl-4 italic text-gray-600 dark:text-gray-300 my-6">
          {renderInline(block.text, `q-${index}`)}
        </blockquote>
      )

    case 'code':
      return (
        <pre className="my-6 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-4">
          <code className="font-mono text-sm text-gray-800 dark:text-gray-100">{block.text}</code>
        </pre>
      )

    case 'table':
      return <ArticleTable head={block.head} rows={block.rows} fontSize={fontSize} />

    case 'paragraph':
    default:
      return (
        <p className="mb-4 text-gray-700 dark:text-gray-200">
          {renderInline(block.text, `p-${index}`)}
        </p>
      )
  }
}

interface ArticleContentProps {
  /** Artikelns markdown, rakt ur `articles.content`. */
  content: string
  /** Läsarens valda textstorlek — styr rubrikskalan. */
  fontSize?: ArticleFontSize
  className?: string
}

export function ArticleContent({
  content,
  fontSize = 'normal',
  className = '',
}: ArticleContentProps) {
  const block = parseArticleMarkdown(content)

  return (
    <div className={className}>
      {block.map((b, i) => (
        <ArticleBlockView key={i} block={b} fontSize={fontSize} index={i} />
      ))}
    </div>
  )
}

export default ArticleContent
