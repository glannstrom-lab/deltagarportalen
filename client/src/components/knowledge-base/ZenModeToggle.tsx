/**
 * Zen Mode Toggle
 * Simplified view for users with low energy or cognitive fatigue
 */

import { useState, useEffect } from 'react'
import { Leaf, X, Info } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface ZenModeToggleProps {
  isZenMode: boolean
  onToggle: (zen: boolean) => void
}

export function ZenModeToggle({ isZenMode, onToggle }: ZenModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Save preference
  useEffect(() => {
    localStorage.setItem('knowledge-base-zen-mode', String(isZenMode))
  }, [isZenMode])
  
  return (
    <div className="relative">
      <button
        onClick={() => onToggle(!isZenMode)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
          isZenMode
            ? "bg-[var(--c-accent)]/40 text-[var(--c-text)] border border-[var(--c-accent)]/60"
            : "bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
        )}
      >
        {isZenMode ? (
          <>
            <X className="w-4 h-4" />
            <span>Avsluta zen-läge</span>
          </>
        ) : (
          <>
            <Leaf className="w-4 h-4" />
            <span>Zen-läge</span>
          </>
        )}
      </button>
      
      {showTooltip && !isZenMode && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-stone-800 text-white text-sm rounded-lg shadow-lg z-50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Zen-läge visar en förenklad vy med mindre visuellt brus. 
              Perfekt när du behöver fokusera eller har låg energi.
            </p>
          </div>
          <div className="absolute -top-1 left-6 w-2 h-2 bg-stone-800 rotate-45" />
        </div>
      )}
    </div>
  )
}

// Zen mode article card - simplified
interface ZenArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    readingTime?: number
  }
  onClick?: () => void
}

export function ZenArticleCard({ article, onClick }: ZenArticleCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-stone-100 hover:border-[var(--c-accent)]/60 hover:bg-[var(--c-bg)]/30 transition-all group"
    >
      <h3 className="font-medium text-stone-800 group-hover:text-[var(--c-text)] text-lg mb-2">
        {article.title}
      </h3>
      <p className="text-stone-600 text-sm leading-relaxed mb-3">
        {article.summary}
      </p>
      {article.readingTime && (
        <span className="text-xs text-stone-600">
          {article.readingTime} min läsning
        </span>
      )}
    </button>
  )
}

// Zen mode layout wrapper
interface ZenLayoutProps {
  children: React.ReactNode
  title?: string
}

export function ZenLayout({ children, title }: ZenLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {title && (
          <h1 className="text-2xl font-bold text-stone-800 mb-8 text-center">
            {title}
          </h1>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
