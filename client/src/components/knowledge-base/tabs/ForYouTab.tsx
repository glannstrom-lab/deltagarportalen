/**
 * For You Tab - Personalized content based on user profile, RIASEC, and mood
 * Only uses real data from Supabase - no mock data or localStorage
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Target, Compass, BookOpen, Heart, ChevronRight } from '@/components/ui/icons'
import EnhancedArticleCard from '../EnhancedArticleCard'
import { Card } from '@/components/ui'
import { useInterestProfile } from '@/hooks/useInterestProfile'
import { useMoodRecommendations } from '@/hooks/useMoodRecommendations'
import { calculateArticleRelevance, type RiasecScores } from '@/services/interestPersonalization'
import { RiasecPersonalizationBanner } from '../RiasecPersonalizationBanner'
import type { Article } from '@/types/knowledge'
import type { EnhancedArticle } from '@/services/articleData'

interface ForYouTabProps {
  articles: Article[]
  userName: string
}

// Recommendation algorithm using RIASEC profile from database
function getRecommendations(
  articles: Article[],
  riasecScores?: RiasecScores | null
): Array<Article & { relevanceScore?: number }> {
  if (!riasecScores) {
    // Without RIASEC, just return articles in order
    return articles.slice(0, 6).map(article => ({
      ...article,
      relevanceScore: undefined
    }))
  }

  return articles
    .map(article => {
      const relevance = calculateArticleRelevance(article as EnhancedArticle, riasecScores)
      return {
        article: {
          ...article,
          relevanceScore: relevance
        },
        score: relevance
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => item.article)
}

export default function ForYouTab({ articles, userName }: ForYouTabProps) {
  const { t } = useTranslation()
  const { profile: riasecProfile } = useInterestProfile()
  const moodData = useMoodRecommendations(articles as EnhancedArticle[])

  // Get recommendations with RIASEC integration
  const recommendations = useMemo(() => {
    return getRecommendations(
      articles,
      riasecProfile.hasResult ? riasecProfile.riasecScores : null
    )
  }, [articles, riasecProfile])

  // Get recent articles (newest first, based on createdAt from database)
  const recentArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 3)
  }, [articles])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:block">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 sm:hidden">
              {t('knowledgeBase.forYou.greeting', { name: userName })}
            </h2>
          </div>
          <div className="flex-1">
            <h2 className="hidden sm:block text-xl font-bold text-slate-900">
              {t('knowledgeBase.forYou.greeting', { name: userName })}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 sm:mt-1">
              {riasecProfile.hasResult
                ? t('knowledgeBase.forYou.personalizedContent')
                : t('knowledgeBase.forYou.curatedContent')}
            </p>
          </div>
        </div>
      </Card>

      {/* RIASEC Personalization Banner - prompts user to take test if not done */}
      <RiasecPersonalizationBanner />

      {/* Mood-based suggestion (if mood logged today) */}
      {moodData.hasMoodToday && moodData.currentMood && (
        <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xl">{moodData.moodEmoji}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Baserat på ditt humör
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {moodData.encouragingMessage}
              </p>
              {moodData.recommendations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {moodData.recommendations.slice(0, 2).map(rec => (
                    <Link
                      key={rec.id}
                      to={rec.link}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      {rec.title}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Personalized recommendations (if RIASEC done) or all articles */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            {riasecProfile.hasResult ? (
              <Compass className="w-5 h-5 text-amber-600" />
            ) : (
              <Target className="w-5 h-5 text-teal-600" />
            )}
            <h3 className="text-lg font-semibold text-slate-900">
              {riasecProfile.hasResult
                ? t('knowledgeBase.forYou.recommended')
                : t('knowledgeBase.forYou.allArticles')}
            </h3>
            {riasecProfile.hasResult && (
              <span className="text-sm text-slate-400">
                {t('knowledgeBase.forYou.basedOnProfile')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((article) => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
                variant={riasecProfile.hasResult ? "featured" : "default"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent articles - based on createdAt from database */}
      {recentArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              {t('knowledgeBase.forYou.recentArticles')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentArticles.map((article) => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('knowledgeBase.forYou.noArticles')}
          </h3>
          <p className="text-slate-500">
            {t('knowledgeBase.forYou.noArticlesDescription')}
          </p>
        </Card>
      )}
    </div>
  )
}
