/**
 * Trending Tab
 * Popular content, new articles, and seasonal themes
 */

import { useMemo } from 'react'
import { Flame, TrendingUp, Clock, Sparkles, Calendar, Eye } from 'lucide-react'
import { Card } from '@/components/ui'
import { EnhancedArticleCard } from '../EnhancedArticleCard'
import type { Article } from '@/types/knowledge'

interface TrendingTabProps {
  articles: Article[]
}

export function TrendingTab({ articles }: TrendingTabProps) {
  // Get trending articles (highest rated)
  const trendingArticles = useMemo(() => {
    return [...articles]
      .filter(a => a.helpfulnessRating && a.helpfulnessRating >= 4)
      .sort((a, b) => (b.helpfulnessRating || 0) - (a.helpfulnessRating || 0))
      .slice(0, 6)
  }, [articles])
  
  // Get newest articles
  const newArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [articles])
  
  // Get most viewed (simulated)
  const mostViewed = useMemo(() => {
    return [...articles]
      .sort(() => Math.random() - 0.5) // In real app, this would be actual view count
      .slice(0, 4)
  }, [articles])
  
  // Seasonal content based on current month
  const currentMonth = new Date().getMonth()
  const seasonalTheme = useMemo(() => {
    const themes: Record<number, { title: string; description: string; icon: typeof Calendar }> = {
      0: { title: 'Nystart', description: 'Sätt jobbmål för det nya året', icon: Sparkles },
      2: { title: 'Vårkänslor', description: 'Hitta vårjobben', icon: Calendar },
      5: { title: 'Sommarjobb', description: 'Säsongstips och sommarjobb', icon: Calendar },
      7: { title: 'Höststart', description: 'Tillbaka efter semestern', icon: Calendar },
      8: { title: 'Nya möjligheter', description: 'Höstens rekryteringar', icon: Calendar },
      11: { title: 'Reflektion', description: 'Året som gått och framtiden', icon: Calendar },
    }
    return themes[currentMonth] || { title: 'Säsongens tema', description: 'Aktuella tips och råd', icon: Calendar }
  }, [currentMonth])
  
  const SeasonalIcon = seasonalTheme.icon
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Trendar nu
            </h2>
            <p className="text-slate-600 mt-1">
              Populärt innehåll just nu, nya artiklar och säsongstips.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Seasonal theme */}
      <section>
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <SeasonalIcon className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <span className="text-sm text-violet-600 font-medium">Säsongens tema</span>
              <h3 className="text-lg font-bold text-slate-900">{seasonalTheme.title}</h3>
              <p className="text-slate-600">{seasonalTheme.description}</p>
            </div>
          </div>
        </Card>
      </section>
      
      {/* Most popular */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-semibold text-slate-900">Mest populärt</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingArticles.map((article, index) => (
            <div key={article.id} className="relative">
              {index < 3 && (
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-10">
                  {index + 1}
                </div>
              )}
              <EnhancedArticleCard 
                article={article}
                variant={index < 2 ? 'featured' : 'default'}
              />
            </div>
          ))}
        </div>
      </section>
      
      {/* New articles */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-900">Nytt innehåll</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newArticles.map(article => (
            <EnhancedArticleCard 
              key={article.id}
              article={article}
              variant="compact"
            />
          ))}
        </div>
      </section>
      
      {/* Most viewed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Mest lästa denna vecka</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mostViewed.map(article => (
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
