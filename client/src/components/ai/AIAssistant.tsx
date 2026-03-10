/**
 * AI Assistant Component - Fas 3
 * 
 * Intelligent widget som visar personliga rekommendationer
 * baserat på all användardata.
 */

import { useState, useEffect } from 'react'
import { 
  Sparkles, AlertCircle, Lightbulb, Calendar, 
  PartyPopper, ChevronRight, X, CheckCircle2,
  TrendingUp, Clock, Loader2, Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  aiAssistantApi, 
  type AIRecommendation, 
  type RecommendationPriority,
  type RecommendationType 
} from '@/services/ai/aiAssistant'

interface AIAssistantProps {
  className?: string
}

export function AIAssistant({ className }: AIAssistantProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
    
    // Uppdatera var 5:e minut
    const interval = setInterval(loadRecommendations, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const recs = await aiAssistantApi.getRecommendations()
      setRecommendations(recs)
    } catch (error) {
      console.error('Fel vid hämtning av rekommendationer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (id: string) => {
    setDismissedIds(prev => [...prev, id])
    await aiAssistantApi.dismissRecommendation(id)
  }

  const handleComplete = async (id: string) => {
    setDismissedIds(prev => [...prev, id])
    await aiAssistantApi.completeRecommendation(id)
  }

  // Filtrera bort avfärdade
  const visibleRecommendations = recommendations.filter(
    r => !dismissedIds.includes(r.id)
  )

  // Gruppera efter prioritet
  const critical = visibleRecommendations.filter(r => r.priority === 'critical')
  const high = visibleRecommendations.filter(r => r.priority === 'high')
  const medium = visibleRecommendations.filter(r => r.priority === 'medium')
  const low = visibleRecommendations.filter(r => r.priority === 'low')

  if (loading) {
    return (
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 p-6",
        className
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={20} className="animate-spin text-violet-500" />
          <span className="text-slate-600">Analyserar din data...</span>
        </div>
      </div>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6",
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Din assistent</h3>
            <p className="text-sm text-slate-500">Allt ser bra ut just nu!</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Fortsätt med ditt arbete. Jag håller koll på dina jobb, intervjuer och deadlines 
          och meddelar dig när det är dags att agera.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden",
      className
    )}>
      {/* Header -->
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Din assistent</h3>
              <p className="text-sm text-white/80">
                {visibleRecommendations.length} rekommendationer
              </p>
            </div>
          </div>
          <button
            onClick={loadRecommendations}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Uppdatera"
          >
            <Loader2 size={18} />
          </button>
        </div>
      </div>

      {/* Critical Priority */}
      {critical.length > 0 && (
        <div className="p-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-rose-600" />
            <span className="font-semibold text-rose-900 text-sm">KRÄVER ÅTGÄRD</span>
          </div>
          <div className="space-y-3">
            {critical.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedId === rec.id}
                onExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                onDismiss={() => handleDismiss(rec.id)}
                onComplete={() => handleComplete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* High Priority */}
      {high.length > 0 && (
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-500" />
            <span className="font-semibold text-slate-700 text-sm">REKOMMENDERAT</span>
          </div>
          <div className="space-y-3">
            {high.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedId === rec.id}
                onExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                onDismiss={() => handleDismiss(rec.id)}
                onComplete={() => handleComplete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium & Low Priority */}
      {(medium.length > 0 || low.length > 0) && (
        <div className="p-4">
          {(medium.length > 0 || low.length > 0) && (
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-blue-500" />
              <span className="font-semibold text-slate-700 text-sm">INSIGHTS & TIPS</span>
            </div>
          )}
          <div className="space-y-3">
            {[...medium, ...low].map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedId === rec.id}
                onExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                onDismiss={() => handleDismiss(rec.id)}
                onComplete={() => handleComplete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// RECOMMENDATION CARD
// ============================================

interface RecommendationCardProps {
  recommendation: AIRecommendation
  isExpanded: boolean
  onExpand: () => void
  onDismiss: () => void
  onComplete: () => void
}

function RecommendationCard({ 
  recommendation, 
  isExpanded, 
  onExpand, 
  onDismiss,
  onComplete 
}: RecommendationCardProps) {
  const { priority, type, title, description, reasoning, action, deadline, expectedOutcome } = recommendation

  const getIcon = () => {
    switch (type) {
      case 'action': return <Zap size={18} />
      case 'insight': return <Lightbulb size={18} />
      case 'reminder': return <Clock size={18} />
      case 'celebration': return <PartyPopper size={18} />
    }
  }

  const getColors = () => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          icon: 'bg-rose-100 text-rose-600',
          title: 'text-rose-900'
        }
      case 'high':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'bg-amber-100 text-amber-600',
          title: 'text-amber-900'
        }
      case 'medium':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          title: 'text-blue-900'
        }
      case 'low':
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          icon: 'bg-slate-100 text-slate-600',
          title: 'text-slate-900'
        }
    }
  }

  const colors = getColors()

  const formatDeadline = (date: Date) => {
    const now = new Date()
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Idag'
    if (days === 1) return 'Imorgon'
    if (days < 0) return 'Passerat'
    return `Om ${days} dagar`
  }

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      colors.bg,
      colors.border,
      isExpanded ? "p-4" : "p-3"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          colors.icon
        )}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", colors.title)}>
            {title}
          </h4>
          
          {!isExpanded ? (
            <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
              {description}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-slate-700">
                {description}
              </p>
              
              {reasoning && (
                <div className="bg-white/50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Varför:</span> {reasoning}
                  </p>
                </div>
              )}
              
              {expectedOutcome && (
                <div className="flex items-center gap-1.5 text-xs text-green-700">
                  <TrendingUp size={12} />
                  <span>{expectedOutcome}</span>
                </div>
              )}
              
              {deadline && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>{formatDeadline(deadline)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Link
              to={action.link}
              onClick={onComplete}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                priority === 'critical' 
                  ? "bg-rose-500 text-white hover:bg-rose-600" :
                priority === 'high'
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              )}
            >
              {action.label}
              <ChevronRight size={14} />
            </Link>
            
            {action.dismissLabel && (
              <button
                onClick={onDismiss}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
              >
                {action.dismissLabel}
              </button>
            )}
          </div>
        </div>
        
        {/* Expand/Close buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onExpand}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded"
          >
            {isExpanded ? <X size={14} /> : <ChevronRight size={14} className="rotate-90" />}
          </button>
          {!isExpanded && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
