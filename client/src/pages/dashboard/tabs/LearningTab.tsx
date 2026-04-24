/**
 * LearningTab - Comprehensive learning hub
 * Articles, exercises, progress tracking, and recommendations
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Play, Clock, CheckCircle2, Award, Star, TrendingUp,
  ArrowLeft, Flame, Target, Lightbulb, ChevronRight, Loader2,
  RefreshCw, FileText, Dumbbell, Sparkles, Zap, Compass
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useLearning } from '@/hooks/useLearning'
import type { ArticleWithProgress, ExerciseWithProgress, LearningCategory } from '@/services/learningService'

type ViewMode = 'home' | 'category' | 'article' | 'exercise'

export default function LearningTab() {
  const { t } = useTranslation()
  const {
    progress,
    recommendedArticles,
    inProgressArticles,
    categories,
    exercises,
    dailyTip,
    hasInterestProfile,
    isLoading,
    error,
    refresh,
    completeArticle,
    loadCategoryArticles
  } = useLearning()

  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithProgress | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithProgress | null>(null)
  const [categoryArticles, setCategoryArticles] = useState<ArticleWithProgress[]>([])
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)

  const handleSelectCategory = async (category: LearningCategory) => {
    setSelectedCategory(category)
    setViewMode('category')
    setIsLoadingCategory(true)
    const articles = await loadCategoryArticles(category.id)
    setCategoryArticles(articles)
    setIsLoadingCategory(false)
  }

  const handleSelectArticle = (article: ArticleWithProgress) => {
    setSelectedArticle(article)
    setViewMode('article')
  }

  const handleSelectExercise = (exercise: ExerciseWithProgress) => {
    setSelectedExercise(exercise)
    setViewMode('exercise')
  }

  const handleBack = () => {
    if (viewMode === 'article' || viewMode === 'exercise') {
      if (selectedCategory) {
        setViewMode('category')
      } else {
        setViewMode('home')
      }
    } else if (viewMode === 'category') {
      setViewMode('home')
      setSelectedCategory(null)
    }
    setSelectedArticle(null)
    setSelectedExercise(null)
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-700 dark:text-stone-300">{t('dashboard.learning.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100 mb-2">
          {t('dashboard.learning.errorTitle')}
        </h3>
        <p className="text-slate-700 dark:text-stone-300 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </div>
    )
  }

  // Article view
  if (viewMode === 'article' && selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBack={handleBack}
        onComplete={() => completeArticle(selectedArticle.id)}
        t={t}
      />
    )
  }

  // Exercise view
  if (viewMode === 'exercise' && selectedExercise) {
    return (
      <ExerciseView
        exercise={selectedExercise}
        onBack={handleBack}
        t={t}
      />
    )
  }

  // Category view
  if (viewMode === 'category' && selectedCategory) {
    return (
      <CategoryView
        category={selectedCategory}
        articles={categoryArticles}
        isLoading={isLoadingCategory}
        onBack={handleBack}
        onSelectArticle={handleSelectArticle}
        t={t}
      />
    )
  }

  // Home view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="text-teal-500" size={28} />
            {t('dashboard.learning.title')}
          </h2>
          <p className="text-slate-700 dark:text-stone-300">{t('dashboard.learning.subtitle')}</p>
        </div>
        <Button onClick={refresh} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress summary */}
      {progress && (
        <ProgressSummary progress={progress} t={t} />
      )}

      {/* Daily tip */}
      {dailyTip && (
        <DailyTipCard tip={dailyTip} />
      )}

      {/* Continue learning */}
      {inProgressArticles.length > 0 && (
        <Section
          title={t('dashboard.learning.continueReading')}
          icon={<Play className="text-amber-500" />}
        >
          <div className="space-y-3">
            {inProgressArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ArticleCard
                  article={article}
                  onClick={() => handleSelectArticle(article)}
                  showProgress
                  t={t}
                />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Recommended articles */}
      <Section
        title={hasInterestProfile ? t('dashboard.learning.personalizedForYou') : t('dashboard.learning.recommendedForYou')}
        icon={hasInterestProfile ? <Compass className="text-amber-500" /> : <Star className="text-teal-500" />}
      >
        {hasInterestProfile && (
          <p className="text-sm text-slate-700 dark:text-stone-300 -mt-2 mb-4 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" />
            {t('dashboard.learning.basedOnProfile')}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendedArticles.slice(0, 4).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ArticleCard
                article={article}
                onClick={() => handleSelectArticle(article)}
                showRelevance={hasInterestProfile}
                t={t}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Exercises */}
      <Section
        title={t('dashboard.learning.exercises')}
        icon={<Dumbbell className="text-emerald-500" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {exercises.slice(0, 4).map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ExerciseCard
                exercise={exercise}
                onClick={() => handleSelectExercise(exercise)}
                showRelevance={hasInterestProfile}
                t={t}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Categories */}
      <Section
        title={t('dashboard.learning.categories')}
        icon={<Target className="text-blue-500" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <CategoryCard
                category={category}
                onClick={() => handleSelectCategory(category)}
                t={t}
              />
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ============================================
// PROGRESS SUMMARY
// ============================================

interface ProgressSummaryProps {
  progress: {
    articlesRead: number
    articlesInProgress: number
    exercisesCompleted: number
    totalXP: number
    streak: number
  }
  t: (key: string, options?: Record<string, unknown>) => string
}

function ProgressSummary({ progress, t }: ProgressSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        icon={<FileText className="text-teal-500" />}
        value={progress.articlesRead}
        label={t('dashboard.learning.stats.articlesRead')}
        color="violet"
      />
      <StatCard
        icon={<Dumbbell className="text-emerald-500" />}
        value={progress.exercisesCompleted}
        label={t('dashboard.learning.stats.exercisesCompleted')}
        color="emerald"
      />
      <StatCard
        icon={<Zap className="text-amber-500" />}
        value={progress.totalXP}
        label={t('dashboard.learning.stats.totalXP')}
        color="amber"
      />
      <StatCard
        icon={<Flame className="text-orange-500" />}
        value={progress.streak}
        label={t('dashboard.learning.stats.daysStreak')}
        color="orange"
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  color: 'violet' | 'emerald' | 'amber' | 'orange'
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const bgColors = {
    violet: 'bg-teal-50 dark:bg-teal-900/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/40',
    amber: 'bg-amber-50 dark:bg-amber-900/40',
    orange: 'bg-orange-50 dark:bg-orange-900/40'
  }

  return (
    <div className={cn("rounded-xl p-4", bgColors[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold text-slate-800 dark:text-stone-100">{value}</span>
      </div>
      <p className="text-xs text-slate-700 dark:text-stone-300">{label}</p>
    </div>
  )
}

// ============================================
// DAILY TIP
// ============================================

interface DailyTipCardProps {
  tip: { title: string; content: string }
}

function DailyTipCard({ tip }: DailyTipCardProps) {
  return (
    <div className="bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30 rounded-xl border border-teal-100 dark:border-teal-700 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="text-teal-600 dark:text-teal-400" size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-stone-100">{tip.title}</h4>
          <p className="text-sm text-slate-600 dark:text-stone-400 mt-1">{tip.content}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SECTION
// ============================================

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

// ============================================
// ARTICLE CARD
// ============================================

interface ArticleCardProps {
  article: ArticleWithProgress
  onClick: () => void
  showProgress?: boolean
  showRelevance?: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

function ArticleCard({ article, onClick, showProgress, showRelevance, t }: ArticleCardProps) {
  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    detailed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
  }

  const difficultyLabels = {
    easy: t('dashboard.learning.difficulty.easy'),
    medium: t('dashboard.learning.difficulty.medium'),
    detailed: t('dashboard.learning.difficulty.detailed')
  }

  const hasHighRelevance = showRelevance && article.relevanceScore && article.relevanceScore >= 60

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-stone-900 p-4 rounded-xl border transition-all cursor-pointer",
        article.isCompleted
          ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20"
          : hasHighRelevance
            ? "border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md"
            : "border-slate-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          article.isCompleted ? "bg-emerald-100 dark:bg-emerald-900/40" : hasHighRelevance ? "bg-amber-100 dark:bg-amber-900/40" : "bg-teal-100 dark:bg-teal-900/40"
        )}>
          {article.isCompleted ? (
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
          ) : hasHighRelevance ? (
            <Compass className="text-amber-600 dark:text-amber-400" size={20} />
          ) : (
            <FileText className="text-teal-600 dark:text-teal-400" size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold line-clamp-2",
            article.isCompleted ? "text-slate-700 dark:text-stone-300" : "text-slate-800 dark:text-stone-100"
          )}>
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              difficultyColors[article.difficulty]
            )}>
              {difficultyLabels[article.difficulty]}
            </span>
            <span className="text-xs text-slate-700 dark:text-stone-300 flex items-center gap-1">
              <Clock size={12} />
              {article.readingTime} min
            </span>
            {hasHighRelevance && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles size={12} />
                {t('dashboard.learning.matchesProfile')}
              </span>
            )}
          </div>
          {showProgress && article.progress > 0 && !article.isCompleted && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${article.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-700 dark:text-stone-300 mt-1">{t('dashboard.learning.percentRead', { percent: article.progress })}</span>
            </div>
          )}
        </div>
        {article.isCompleted && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 flex-shrink-0">
            <Award size={14} />
            +10 XP
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// EXERCISE CARD
// ============================================

interface ExerciseCardProps {
  exercise: ExerciseWithProgress
  onClick: () => void
  showRelevance?: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

function ExerciseCard({ exercise, onClick, showRelevance, t }: ExerciseCardProps) {
  const difficultyColors = {
    'Lätt': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'Medel': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'Utmanande': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
  }

  const hasHighRelevance = showRelevance && exercise.relevanceScore && exercise.relevanceScore >= 60

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-stone-900 p-4 rounded-xl border transition-all cursor-pointer",
        exercise.isCompleted
          ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20"
          : hasHighRelevance
            ? "border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md"
            : "border-slate-200 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          exercise.isCompleted ? "bg-emerald-100 dark:bg-emerald-900/40" : hasHighRelevance ? "bg-amber-100 dark:bg-amber-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
          {exercise.isCompleted ? (
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
          ) : hasHighRelevance ? (
            <Compass className="text-amber-600 dark:text-amber-400" size={20} />
          ) : (
            <Dumbbell className="text-emerald-600 dark:text-emerald-400" size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold line-clamp-2",
            exercise.isCompleted ? "text-slate-700 dark:text-stone-300" : "text-slate-800 dark:text-stone-100"
          )}>
            {exercise.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              difficultyColors[exercise.difficulty]
            )}>
              {exercise.difficulty}
            </span>
            <span className="text-xs text-slate-700 dark:text-stone-300 flex items-center gap-1">
              <Clock size={12} />
              {exercise.duration}
            </span>
            {hasHighRelevance && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles size={12} />
                {t('dashboard.learning.matchesProfile')}
              </span>
            )}
          </div>
        </div>
        {exercise.isCompleted && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 flex-shrink-0">
            <Award size={14} />
            +20 XP
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// CATEGORY CARD
// ============================================

interface CategoryCardProps {
  category: LearningCategory
  onClick: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function CategoryCard({ category, onClick, t }: CategoryCardProps) {
  const progress = category.articleCount > 0
    ? Math.round((category.completedCount / category.articleCount) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-slate-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-slate-800 dark:text-stone-100">{category.name}</h4>
        <ChevronRight className="text-slate-600 dark:text-stone-400" size={20} />
      </div>
      <p className="text-sm text-slate-700 dark:text-stone-300 line-clamp-2 mb-3">{category.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700 dark:text-stone-300">
          {t('dashboard.learning.articlesProgress', { completed: category.completedCount, total: category.articleCount })}
        </span>
        {progress > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{progress}%</span>
        )}
      </div>
      {progress > 0 && (
        <div className="h-1.5 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// CATEGORY VIEW
// ============================================

interface CategoryViewProps {
  category: LearningCategory
  articles: ArticleWithProgress[]
  isLoading: boolean
  onBack: () => void
  onSelectArticle: (article: ArticleWithProgress) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function CategoryView({ category, articles, isLoading, onBack, onSelectArticle, t }: CategoryViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('common.back')}
      </button>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-stone-100">{category.name}</h2>
        <p className="text-slate-700 dark:text-stone-300 mt-1">{category.description}</p>
      </div>

      <div className="space-y-3">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <ArticleCard
              article={article}
              onClick={() => onSelectArticle(article)}
              showProgress
              t={t}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// ARTICLE VIEW
// ============================================

interface ArticleViewProps {
  article: ArticleWithProgress
  onBack: () => void
  onComplete: () => Promise<boolean>
  t: (key: string, options?: Record<string, unknown>) => string
}

function ArticleView({ article, onBack, onComplete, t }: ArticleViewProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(article.isCompleted)

  const handleComplete = async () => {
    setIsCompleting(true)
    const success = await onComplete()
    if (success) {
      setIsCompleted(true)
    }
    setIsCompleting(false)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('common.back')}
      </button>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 rounded-full">
              {article.category}
            </span>
            <span className="text-xs text-slate-700 dark:text-stone-300 flex items-center gap-1">
              <Clock size={12} /> {article.readingTime} min
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-stone-100">{article.title}</h1>
          <p className="text-slate-600 dark:text-stone-400 mt-2">{article.summary}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {article.content.split('\n\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-slate-800 dark:text-stone-100">{paragraph.replace('## ', '')}</h2>
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <p key={i} className="font-semibold text-slate-800 dark:text-stone-200">{paragraph.replace(/\*\*/g, '')}</p>
              }
              return <p key={i} className="mb-4 text-slate-700 dark:text-stone-300">{paragraph}</p>
            })}
          </div>
        </div>

        {/* Complete button */}
        <div className="p-6 border-t border-slate-100 dark:border-stone-700">
          <Button
            onClick={handleComplete}
            className="w-full"
            disabled={isCompleted || isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isCompleted ? t('dashboard.learning.completed') : t('dashboard.learning.markAsRead')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EXERCISE VIEW
// ============================================

interface ExerciseViewProps {
  exercise: ExerciseWithProgress
  onBack: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function ExerciseView({ exercise, onBack, t }: ExerciseViewProps) {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('common.back')}
      </button>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-700 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full">
              {exercise.category}
            </span>
            <span className="text-xs text-slate-700 dark:text-stone-300 flex items-center gap-1">
              <Clock size={12} /> {exercise.duration}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-stone-100">{exercise.title}</h1>
          <p className="text-slate-600 dark:text-stone-400 mt-2">{exercise.description}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-stone-400">{t('dashboard.learning.stepOf', { current: currentStep + 1, total: exercise.steps.length })}</span>
            <span className="text-slate-700 dark:text-stone-300">{Math.round(((currentStep + 1) / exercise.steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / exercise.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100 mb-2">
                {exercise.steps[currentStep].title}
              </h3>
              <p className="text-slate-600 dark:text-stone-400">{exercise.steps[currentStep].description}</p>
            </div>

            <div className="space-y-4">
              {exercise.steps[currentStep].questions.map(question => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2">
                    {question.text}
                  </label>
                  <textarea
                    placeholder={question.placeholder}
                    className="w-full h-24 p-3 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-800 dark:text-stone-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-stone-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-6 border-t border-slate-100 dark:border-stone-700">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            {t('common.previous')}
          </Button>
          {currentStep < exercise.steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              {t('dashboard.learning.nextStep')}
            </Button>
          ) : (
            <Button>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('dashboard.learning.complete')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
