/**
 * Word and character counter with progress bar and warnings
 */

import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'

interface WordCounterProps {
  text: string
  minWords?: number
  maxWords?: number
  minChars?: number
  maxChars?: number
  showProgress?: boolean
  compact?: boolean
}

export function WordCounter({ 
  text, 
  minWords = 150, 
  maxWords = 400,
  minChars = 800,
  maxChars = 2500,
  showProgress = true,
  compact = false
}: WordCounterProps) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  
  // Calculate percentages
  const wordPercent = Math.min(100, (words / maxWords) * 100)
  const charPercent = Math.min(100, (chars / maxChars) * 100)
  
  // Determine status
  const isTooShort = words < minWords / 2
  const isShort = words >= minWords / 2 && words < minWords
  const isGood = words >= minWords && words <= maxWords
  const isLong = words > maxWords && words <= maxWords * 1.2
  const isTooLong = words > maxWords * 1.2
  
  const getStatusColor = () => {
    if (isTooShort || isTooLong) return 'text-red-600 bg-red-50 border-red-200'
    if (isShort || isLong) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }
  
  const getProgressColor = () => {
    if (isTooShort) return 'bg-red-500'
    if (isShort) return 'bg-amber-400'
    if (isGood) return 'bg-emerald-500'
    if (isLong) return 'bg-amber-400'
    return 'bg-red-500'
  }
  
  const getIcon = () => {
    if (isTooShort || isTooLong) return <AlertCircle className="w-4 h-4" />
    if (isShort || isLong) return <AlertTriangle className="w-4 h-4" />
    return <CheckCircle2 className="w-4 h-4" />
  }
  
  const getMessage = () => {
    if (isTooShort) return `För kort - lägg till mer (${minWords - words} ord till)`
    if (isShort) return `Bra början - ${minWords - words} ord till rekommenderat`
    if (isGood) return 'Perfekt längd!'
    if (isLong) return `Börjar bli långt - max ${maxWords} ord`
    return `För långt - ta bort ${words - maxWords} ord`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{words} ord</span>
        <span className="text-slate-300">|</span>
        <span>{chars} tecken</span>
        {showProgress && (
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${wordPercent}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()} transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium text-sm">{getMessage()}</span>
        </div>
        <div className="text-sm font-semibold">
          {words} / {maxWords} ord
        </div>
      </div>
      
      {showProgress && (
        <div className="space-y-1">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${wordPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-75">
            <span>Min: {minWords}</span>
            <span>Max: {maxWords}</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-2 text-xs opacity-75">
        <span>{chars} tecken</span>
        <span>Rekommenderat: {minWords}-{maxWords} ord</span>
      </div>
    </div>
  )
}

// Simple inline counter for textareas
export function InlineCounter({ text, maxLength }: { text: string; maxLength?: number }) {
  const length = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className={words < 50 ? 'text-amber-500' : words > 400 ? 'text-red-500' : ''}>
        {words} ord
      </span>
      {maxLength && (
        <span className={length > maxLength * 0.9 ? 'text-red-500' : ''}>
          {length}/{maxLength} tecken
        </span>
      )}
    </div>
  )
}
