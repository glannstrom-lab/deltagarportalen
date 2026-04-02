/**
 * My Journey Tab
 * Track progress, bookmarks, and completed articles
 */

import { useMemo } from 'react'
import { Route, Bookmark, CheckCircle2, Clock, TrendingUp, Calendar, Target } from '@/components/ui/icons'
import { Card, Progress } from '@/components/ui'
import EnhancedArticleCard from '../EnhancedArticleCard'
import type { Article } from '@/types/knowledge'

interface MyJourneyTabProps {
  articles: Article[]
  bookmarks: string[]
  completedArticles: string[]
  streak: number
  weeklyGoal: number
  weeklyProgress: number
}

export default function MyJourneyTab({
  articles,
  bookmarks,
  completedArticles,
  streak,
  weeklyGoal,
  weeklyProgress,
}: MyJourneyTabProps) {
  // Get bookmarked articles
  const bookmarkedArticles = useMemo(() => {
    return articles.filter(a => bookmarks.includes(a.id))
  }, [articles, bookmarks])
  
  // Get in-progress articles
  const inProgressArticles = useMemo(() => {
    return articles.filter(a => {
      const progress = localStorage.getItem(`article-progress-${a.id}`)
      return progress && parseInt(progress) > 0 && parseInt(progress) < 100
    })
  }, [articles])
  
  // Get recently completed
  const recentlyCompleted = useMemo(() => {
    return articles
      .filter(a => completedArticles.includes(a.id))
      .slice(0, 5)
  }, [articles, completedArticles])
  
  // Calculate stats
  const totalReadingTime = useMemo(() => {
    return completedArticles.reduce((total, id) => {
      const article = articles.find(a => a.id === id)
      return total + (article?.readingTime || 0)
    }, 0)
  }, [articles, completedArticles])
  
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    completedArticles.forEach(id => {
      const article = articles.find(a => a.id === id)
      if (article) {
        breakdown[article.category] = (breakdown[article.category] || 0) + 1
      }
    })
    return breakdown
  }, [articles, completedArticles])
  
  return (
    <div className="space-y-8">
      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-violet-50 border-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedArticles.length}</p>
              <p className="text-sm text-slate-600">Artiklar lästa</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalReadingTime}</p>
              <p className="text-sm text-slate-600">Minuter läsning</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-rose-50 border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{streak}</p>
              <p className="text-sm text-slate-600">Dagars streak</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{bookmarks.length}</p>
              <p className="text-sm text-slate-600">Sparade</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Weekly goal */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Veckans mål</h3>
              <p className="text-sm text-slate-600">
                {weeklyProgress} av {weeklyGoal} artiklar lästa
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {Math.round((weeklyProgress / weeklyGoal) * 100)}%
          </span>
        </div>
        <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-2" />
      </Card>
      
      {/* In progress */}
      {inProgressArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Påbörjade artiklar</h3>
          </div>
          <div className="space-y-3">
            {inProgressArticles.map(article => {
              const progress = parseInt(localStorage.getItem(`article-progress-${article.id}`) || '0')
              return (
                <Card key={article.id} className="relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{article.title}</h4>
                      <p className="text-sm text-slate-500">{article.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-amber-600">{progress}%</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}
      
      {/* Bookmarks */}
      {bookmarkedArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Sparade artiklar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarkedArticles.map(article => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
                variant="compact"
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Recently completed */}
      {recentlyCompleted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-slate-900">Nyligen avklarade</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentlyCompleted.map(article => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
                variant="compact"
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Category breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">Din utveckling</h3>
          </div>
          <Card>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-slate-700 capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(count / completedArticles.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-8">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
