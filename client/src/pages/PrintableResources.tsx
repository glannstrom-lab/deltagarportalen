/**
 * PrintableResources - Utskriftsvänlig vy för artiklar och övningar
 * Låter användare välja och exportera resurser som PDF
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileDown, Printer, BookOpen, ClipboardList, Check, X,
  ChevronDown, ChevronUp, Loader2, Search, Filter
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { useArticles } from '@/hooks/knowledge-base/useArticles'
import { exercises, type Exercise } from '@/data/exercises'
import {
  generateArticlePDF,
  generateExercisePDF,
  generateArticlesBundlePDF,
  generateExercisesBundlePDF,
  downloadPDF,
  previewPDF,
  type ArticleForPDF,
  type ExerciseForPDF
} from '@/services/pdfExportService'
import { cn } from '@/lib/utils'

type ResourceType = 'articles' | 'exercises'
type ViewMode = 'select' | 'preview'

export default function PrintableResources() {
  const { t } = useTranslation()
  const { data: articles = [], isLoading: articlesLoading } = useArticles()

  const [resourceType, setResourceType] = useState<ResourceType>('articles')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Filtrera artiklar
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [articles, searchQuery, selectedCategory])

  // Filtrera övningar
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = !searchQuery ||
        exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // Unika kategorier
  const articleCategories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category))
    return Array.from(cats).filter(Boolean)
  }, [articles])

  const exerciseCategories = useMemo(() => {
    const cats = new Set(exercises.map(e => e.category))
    return Array.from(cats).filter(Boolean)
  }, [])

  const categories = resourceType === 'articles' ? articleCategories : exerciseCategories
  const currentItems = resourceType === 'articles' ? filteredArticles : filteredExercises

  // Gruppera efter kategori
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof currentItems> = {}
    currentItems.forEach(item => {
      const cat = item.category || 'Övrigt'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return groups
  }, [currentItems])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const allIds = currentItems.map(item => item.id)
    setSelectedIds(new Set(allIds))
  }

  const selectNone = () => {
    setSelectedIds(new Set())
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const handleExportSelected = async (preview: boolean = false) => {
    if (selectedIds.size === 0) return
    setIsGenerating(true)

    try {
      let blob: Blob

      if (resourceType === 'articles') {
        const selectedArticles = articles
          .filter(a => selectedIds.has(a.id))
          .map(a => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            content: a.content,
            category: a.category,
            readingTime: a.readingTime,
            difficulty: a.difficulty,
            checklist: a.checklist
          })) as ArticleForPDF[]

        if (selectedArticles.length === 1) {
          blob = await generateArticlePDF(selectedArticles[0])
        } else {
          blob = await generateArticlesBundlePDF(selectedArticles)
        }
      } else {
        const selectedExercises = exercises
          .filter(e => selectedIds.has(e.id))
          .map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            category: e.category,
            duration: e.duration,
            difficulty: e.difficulty,
            steps: e.steps
          })) as ExerciseForPDF[]

        if (selectedExercises.length === 1) {
          blob = await generateExercisePDF(selectedExercises[0])
        } else {
          blob = await generateExercisesBundlePDF(selectedExercises)
        }
      }

      if (preview) {
        previewPDF(blob)
      } else {
        const filename = resourceType === 'articles'
          ? selectedIds.size === 1 ? 'artikel.pdf' : `artiklar_${selectedIds.size}st.pdf`
          : selectedIds.size === 1 ? 'ovning.pdf' : `ovningar_${selectedIds.size}st.pdf`
        downloadPDF(blob, filename)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Kunde inte generera PDF. Försök igen.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    handleExportSelected(true)
  }

  return (
    <PageLayout
      title={t('printable.title', 'Skriv ut resurser')}
      description={t('printable.description', 'Välj artiklar och övningar att skriva ut eller spara som PDF')}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Verktygsrad */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 shadow-sm">
          {/* Resurstypväljare */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setResourceType('articles')
                setSelectedIds(new Set())
                setSelectedCategory('all')
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                resourceType === 'articles'
                  ? "bg-teal-500 text-white"
                  : "bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
              )}
            >
              <BookOpen className="w-5 h-5" />
              {t('printable.articles', 'Artiklar')}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {articles.length}
              </span>
            </button>
            <button
              onClick={() => {
                setResourceType('exercises')
                setSelectedIds(new Set())
                setSelectedCategory('all')
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                resourceType === 'exercises'
                  ? "bg-sky-500 text-white"
                  : "bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
              )}
            >
              <ClipboardList className="w-5 h-5" />
              {t('printable.exercises', 'Övningar')}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {exercises.length}
              </span>
            </button>
          </div>

          {/* Sök och filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('printable.search', 'Sök...')}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{t('printable.allCategories', 'Alla kategorier')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Urvals-info och knappar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {selectedIds.size} av {currentItems.length} valda
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Välj alla
            </button>
            <button
              onClick={selectNone}
              className="text-sm text-stone-500 dark:text-stone-400 hover:underline"
            >
              Avmarkera alla
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedIds.size === 0 || isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                "border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300",
                "hover:bg-stone-100 dark:hover:bg-stone-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Printer className="w-4 h-4" />
              Förhandsgranska
            </button>
            <button
              onClick={() => handleExportSelected(false)}
              disabled={selectedIds.size === 0 || isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                "bg-teal-600 text-white hover:bg-teal-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Ladda ner PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Listan med resurser */}
        {articlesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div
                key={category}
                className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
              >
                {/* Kategorirubrik */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {category}
                    </span>
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      ({items.length})
                    </span>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="w-5 h-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400" />
                  )}
                </button>

                {/* Innehåll */}
                {expandedCategories.has(category) && (
                  <div className="border-t border-stone-100 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700">
                    {items.map((item) => {
                      const isSelected = selectedIds.has(item.id)
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleSelection(item.id)}
                          className={cn(
                            "w-full flex items-start gap-4 p-4 text-left transition-colors",
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-900/20"
                              : "hover:bg-stone-50 dark:hover:bg-stone-700/50"
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                            isSelected
                              ? "bg-teal-500 border-teal-500"
                              : "border-stone-300 dark:border-stone-600"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={cn(
                              "font-medium truncate",
                              isSelected
                                ? "text-teal-700 dark:text-teal-300"
                                : "text-stone-800 dark:text-stone-200"
                            )}>
                              {item.title}
                            </h3>
                            {'summary' in item && item.summary && (
                              <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                                {item.summary}
                              </p>
                            )}
                            {'description' in item && (
                              <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                              {'readingTime' in item && item.readingTime && (
                                <span>{item.readingTime} min läsning</span>
                              )}
                              {'duration' in item && item.duration && (
                                <span>{item.duration}</span>
                              )}
                              {'difficulty' in item && item.difficulty && (
                                <span>{item.difficulty}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {currentItems.length === 0 && (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                {searchQuery
                  ? t('printable.noResults', 'Inga resultat hittades')
                  : t('printable.noItems', 'Inga resurser tillgängliga')
                }
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
