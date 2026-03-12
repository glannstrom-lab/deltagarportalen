/**
 * For You Tab - Personalized content based on user profile
 */

import { useState, useMemo } from 'react'
import { Sparkles, Target, Flame, BookOpen, Zap, TrendingUp } from 'lucide-react'
import { useArticles, useBookmarks, usePersonalizedArticles } from '@/hooks/knowledge-base/useArticles'
import { useEnergyLevel } from '@/hooks/useEnergyLevel'
import EnhancedArticleCard from '../EnhancedArticleCard'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Article } from '@/types/knowledge'

interface ForYouTabProps {
  userProfile: {
    name: string
    interests: string[]
    completedArticles: string[]
    streak: number
  }
}

export function ForYouTab({ userProfile }: ForYouTabProps) {
  const { data: articles, isLoading } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()
  const [energyLevel] = useEnergyLevel()
  const { getRecommendations } = usePersonalizedArticles()
  
  const recommendations = useMemo(() => {
    if (!articles) return []
    return getRecommendations({
      readArticles: userProfile.completedArticles,
      interests: userProfile.interests,
      energyLevel,
    })
  }, [articles, userProfile, energyLevel, getRecommendations])
  
  // Get trending articles
  const trendingArticles = useMemo(() => {
    if (!articles) return []
    return [...articles]
      .filter(a => a.helpfulnessRating && a.helpfulnessRating >= 4.5)
      .sort((a, b) => (b.helpfulnessRating || 0) - (a.helpfulnessRating || 0))
      .slice(0, 3)
  }, [articles])
  
  // Get quick wins based on energy
  const quickWins = useMemo(() => {
    if (!articles) return []
    const maxTime = energyLevel === 'low' ? 3 : energyLevel === 'medium' ? 8 : 15
    return articles
      .filter(a => a.readingTime && a.readingTime <= maxTime && a.difficulty === 'easy')
      .slice(0, 3)
  }, [articles, energyLevel])
  
  // Get continue reading
  const continueReading = useMemo(() => {
    if (!articles) return []
    return articles.filter(a => {
      const progress = localStorage.getItem(`article-progress-${a.id}`)
      return progress && parseInt(progress) > 0 && parseInt(progress) < 100
    }).slice(0, 2)
  }, [articles])
  
  if (isLoading) {
    return <ForYouSkeleton />
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              Hej {userProfile.name}! 👋
            </h2>
            <p className="text-slate-600 mt-1">
              Här är dagens utvalda innehåll baserat på dina intressen och mål.
            </p>
            {userProfile.streak > 0 && (
              <div className="flex items-center gap-2 mt-3 text-amber-600">
                <Flame className="w-5 h-5" />
                <span className="font-medium">🔥 {userProfile.streak} dagars lässtreak!</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Continue reading */}
      {continueReading.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">Fortsätt där du slutade</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continueReading.map((article: Article) => {
              const progress = parseInt(localStorage.getItem(`article-progress-${article.id}`) || '0')
              return (
                <div key={article.id} className="relative">
                  <EnhancedArticleCard article={article} />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-lg overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
      
      {/* Energy-adapted quick wins */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className={cn(
            "w-5 h-5",
            energyLevel === 'low' && "text-sky-500",
            energyLevel === 'medium' && "text-amber-500",
            energyLevel === 'high' && "text-rose-500"
          )} />
          <h3 className="text-lg font-semibold text-slate-900">
            Anpassat för {energyLevel === 'low' ? 'låg' : energyLevel === 'medium' ? 'medel' : 'hög'} energi
          </h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {energyLevel === 'low' 
            ? 'Korta artiklar under 5 minuter för när du behöver ta det lugnt.'
            : energyLevel === 'medium'
            ? 'Balanserat innehåll för en stadig dag.'
            : 'Djupgående material för när du har energi att lära mycket!'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickWins.map((article: Article) => (
            <EnhancedArticleCard 
              key={article.id} 
              article={article}
              variant="compact"
            />
          ))}
        </div>
      </section>
      
      {/* Personalized recommendations */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Rekommenderat för dig
            </h3>
            <span className="text-sm text-slate-400">
              Baserat på dina intressen
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((article: Article) => (
              <EnhancedArticleCard 
                key={article.id} 
                article={article}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Trending now */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-semibold text-slate-900">Trendar nu</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingArticles.map((article: Article) => (
            <EnhancedArticleCard 
              key={article.id} 
              article={article}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ForYouSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-slate-100 rounded-xl" />
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-slate-100 rounded-xl" />
          <div className="h-40 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
