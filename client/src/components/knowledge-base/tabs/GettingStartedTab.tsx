/**
 * Getting Started Tab
 * Quick start guides for new users
 */

import { Rocket, CheckCircle2, Circle, ArrowRight, Sparkles } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import type { Article } from '@/types/knowledge'

interface GettingStartedTabProps {
  articles: Article[]
  completedArticles: string[]
}

const quickStartSteps = [
  {
    id: 'welcome',
    title: 'Välkommen till Deltagarportalen',
    description: 'Lär dig navigera och hitta det du behöver',
    readingTime: 3,
    category: 'intro',
    isIntro: true,
  },
  {
    id: 'first-cv',
    title: 'Skapa ditt första CV',
    description: 'Steg-för-steg guide för att komma igång',
    readingTime: 8,
    category: 'cv',
    action: 'Gå till CV-byggaren',
    actionLink: '/dashboard/cv',
  },
  {
    id: 'interest-guide',
    title: 'Gör intresseguiden',
    description: 'Upptäck vilka yrken som passar dig',
    readingTime: 10,
    category: 'career',
    action: 'Starta guiden',
    actionLink: '/dashboard/interest-guide',
  },
  {
    id: 'job-search-basics',
    title: 'Grunderna i jobbsökning',
    description: 'Var och hur du hittar lediga jobb',
    readingTime: 5,
    category: 'job-search',
  },
  {
    id: 'first-application',
    title: 'Skicka din första ansökan',
    description: 'Komplett guide till din första jobbansökan',
    readingTime: 12,
    category: 'applications',
  },
]

export default function GettingStartedTab({ 
  articles, 
  completedArticles
}: GettingStartedTabProps) {
  const completedCount = quickStartSteps.filter(step => 
    completedArticles.includes(step.id)
  ).length
  
  const progress = Math.round((completedCount / quickStartSteps.length) * 100)
  
  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              Komma igång
            </h2>
            <p className="text-slate-600 mt-1">
              Följ dessa steg för att komma igång med din jobbsökarresa. 
              Du har slutfört {completedCount} av {quickStartSteps.length} steg.
            </p>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-600 mt-2 font-medium">
                {progress}% klart
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Steps */}
      <div className="space-y-4">
        {quickStartSteps.map((step, index) => {
          const isCompleted = completedArticles.includes(step.id)
          const isNext = !isCompleted && 
            (index === 0 || completedArticles.includes(quickStartSteps[index - 1].id))
          
          return (
            <Card 
              key={step.id}
              className={`
                transition-all
                ${isCompleted ? 'opacity-60' : ''}
                ${isNext ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="shrink-0 mt-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium
                      ${isNext 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-slate-300 text-slate-400'}
                    `}>
                      {index + 1}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`
                        font-semibold text-lg
                        ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}
                      `}>
                        {step.title}
                      </h3>
                      <p className="text-slate-600 mt-1">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>{step.readingTime} min läsning</span>
                        {isCompleted && (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Avklarat
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action button */}
                    {!isCompleted && (
                      step.action ? (
                        <a
                          href={step.actionLink}
                          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          {step.action}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {}}
                          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                          Läs artikel
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      
      {/* Next steps after completion */}
      {completedCount === quickStartSteps.length && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Grattis! 🎉</h3>
              <p className="text-slate-600">
                Du har gått igenom alla komma-igång-steg. 
                Utforska fler artiklar i ämnes-fliken!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
