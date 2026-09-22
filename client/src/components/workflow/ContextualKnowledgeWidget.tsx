/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * Contextual Knowledge Widget
 *
 * Visar relevanta artiklar ur kunskapsbanken baserat på kontext (vilken sida
 * användaren är på).
 *
 * 2026-09-22: här låg 21 hårdkodade "artiklar" med påhittade id:n (`cv-1`,
 * `interview-2` …), påhittade lästider och svensk text även i engelskt läge.
 * Ingen av dem fanns i kunskapsbanken — i CV-byggaren ledde alla tre korten
 * till "artikeln finns inte" (0 av 4 `cv-*` i prod). Samma fel som
 * intervjusimulatorns "Läs vidare" hade. Nu visas riktiga artiklar, valda
 * ur `useArticles()` med en matchning per kontext, på användarens språk.
 * Hittas inga visas ingenting — hellre det än en länk som inte leder någonstans.
 */

import { useMemo } from 'react'
import {
  BookOpen, ChevronRight, Lightbulb,
  FileText, Search, MessageSquare,
} from '@/components/ui/icons'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useArticles } from '@/hooks/knowledge-base/useArticles'

// ============================================
// TYPES
// ============================================

export type KnowledgeContext =
  | 'cv-building'
  | 'cover-letter-writing'
  | 'job-searching'
  | 'interview-prep'
  | 'rejection-handling'
  | 'salary-negotiation'
  | 'career-planning'
  | 'general'

interface ArtikelUrval {
  id: string
  title: string
  summary?: string
  category?: string
  readingTime?: number
}

// ============================================
// CONTEXT MAPPING
// ============================================

/**
 * Mappa URL-path till kunskapskontext
 */
function getContextFromPath(path: string): KnowledgeContext {
  if (path.includes('cv')) return 'cv-building'
  if (path.includes('cover-letter')) return 'cover-letter-writing'
  if (path.includes('job-search')) return 'job-searching'
  if (path.includes('job-tracker')) return 'interview-prep'
  if (path.includes('interest-guide') || path.includes('career')) return 'career-planning'
  return 'general'
}

/**
 * Vilka artiklar som hör till en kontext. Slugen (`id`) är svensk på båda
 * språken, så matchningen fungerar oavsett språk. Kategorinycklarna är de som
 * finns i `articles.category_key` i prod (mätt 2026-09-22).
 */
const MATCHNING: Record<KnowledgeContext, (a: ArtikelUrval) => boolean> = {
  'cv-building': (a) => /(^|-)cv(-|$)/.test(a.id) && a.category !== 'easy-swedish',
  'cover-letter-writing': (a) => /personligt-brev/.test(a.id),
  'job-searching': (a) => a.category === 'job-search',
  'interview-prep': (a) => a.category === 'interview',
  'rejection-handling': (a) => /avslag|motgang/.test(a.id),
  'salary-negotiation': (a) => /(^|-)lon/.test(a.id),
  'career-planning': (a) => a.category === 'career-development',
  'general': (a) => a.category === 'getting-started',
}

export function valjArtiklar(lista: ArtikelUrval[], kontext: KnowledgeContext, max: number): ArtikelUrval[] {
  return lista.filter(MATCHNING[kontext]).slice(0, max)
}

// Egen komponent (modulnivå, stabil identitet) i stället för en variabel som
// väljer bland ikonerna i render — annars ser React en NY komponenttyp vid
// varje rendering (react-hooks/static-components), även om ikonen faktiskt
// är samma stabila import.
function ContextIcon({ context, size, className }: { context: KnowledgeContext; size?: number; className?: string }) {
  switch (context) {
    case 'cv-building':
    case 'cover-letter-writing':
      return <FileText size={size} className={className} />
    case 'job-searching':
      return <Search size={size} className={className} />
    case 'interview-prep':
      return <MessageSquare size={size} className={className} />
    default:
      return <Lightbulb size={size} className={className} />
  }
}

// ============================================
// COMPONENT
// ============================================

interface ContextualKnowledgeWidgetProps {
  context?: KnowledgeContext
  maxArticles?: number
  variant?: 'compact' | 'full'
  className?: string
}

export function ContextualKnowledgeWidget({
  context,
  maxArticles = 3,
  variant = 'compact',
  className
}: ContextualKnowledgeWidgetProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { data: allaArtiklar } = useArticles()

  const currentContext = useMemo(
    () => context || getContextFromPath(location.pathname),
    [context, location.pathname]
  )
  const articles = useMemo(
    () => valjArtiklar((allaArtiklar ?? []) as ArtikelUrval[], currentContext, maxArticles),
    [allaArtiklar, currentContext, maxArticles]
  )

  const getContextTitle = (ctx: KnowledgeContext): string => {
    switch (ctx) {
      case 'cv-building': return t('workflow.knowledgeWidget.context.cvBuilding')
      case 'cover-letter-writing': return t('workflow.knowledgeWidget.context.coverLetterWriting')
      case 'job-searching': return t('workflow.knowledgeWidget.context.jobSearching')
      case 'interview-prep': return t('ai.interviewPrep.heading')
      case 'rejection-handling': return t('workflow.knowledgeWidget.context.rejectionHandling')
      case 'salary-negotiation': return t('workflow.knowledgeWidget.context.salaryNegotiation')
      case 'career-planning': return t('workflow.knowledgeWidget.context.careerPlanning')
      default: return t('workflow.knowledgeWidget.context.default')
    }
  }

  // Laddar, fel eller inget som matchar: ingenting. Ingen reservlista.
  if (articles.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className={cn(
        "bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4",
        className
      )}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
            <ContextIcon context={currentContext} size={18} className="text-amber-700 dark:text-amber-300" />
          </div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{getContextTitle(currentContext)}</h3>
        </div>

        <div className="space-y-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/knowledge-base/article/${article.id}`}
              className="block bg-white/70 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900/70 rounded-lg p-3 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    {article.title}
                  </h4>
                  {article.summary && (
                    <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5 line-clamp-1">{article.summary}</p>
                  )}
                  {typeof article.readingTime === 'number' && article.readingTime > 0 && (
                    <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">
                      {t('workflow.knowledgeWidget.readTime', { count: article.readingTime })}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500 flex-shrink-0" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/knowledge-base"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-amber-800 dark:text-amber-300 hover:text-amber-900 font-medium"
        >
          <BookOpen size={14} aria-hidden="true" />
          {t('workflow.knowledgeWidget.seeAllArticles')}
        </Link>
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn(
      "bg-white dark:bg-stone-800/50 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700/50 p-4",
      className
    )}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 shrink-0 bg-[var(--c-bg)] rounded-lg flex items-center justify-center">
          <ContextIcon context={currentContext} size={18} className="text-[var(--c-text)]" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{getContextTitle(currentContext)}</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">{t('workflow.knowledgeWidget.selectedForYou')}</p>
        </div>
      </div>

      <div className="space-y-1">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/knowledge-base/article/${article.id}`}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--c-bg)] transition-colors">
              <BookOpen size={16} className="text-stone-600 dark:text-stone-300 group-hover:text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-900 dark:text-stone-100 text-[13px] leading-snug group-hover:text-[var(--c-text)] transition-colors">
                {article.title}
              </h4>
              {article.summary && (
                <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 line-clamp-2">{article.summary}</p>
              )}
              {typeof article.readingTime === 'number' && article.readingTime > 0 && (
                <p className="mt-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                  {t('workflow.knowledgeWidget.readTime', { count: article.readingTime })}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-stone-400 group-hover:text-[var(--c-solid)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
