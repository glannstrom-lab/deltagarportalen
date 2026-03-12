/**
 * "I Can't Read Right Now" Button
 * Empathetic button that normalizes not having energy
 */

import { useState } from 'react'
import { Heart, Clock, Bookmark, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { getSupportiveMessage } from '@/utils/supportiveMessages'

interface CantReadButtonProps {
  articleId: string
  articleTitle: string
  onSaveForLater: () => void
  onShowShorterAlternative?: () => void
}

export function CantReadButton({
  articleId,
  articleTitle,
  onSaveForLater,
  onShowShorterAlternative,
}: CantReadButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  
  const handleSaveForLater = () => {
    onSaveForLater()
    setShowMessage(true)
    setTimeout(() => setShowMessage(false), 5000)
  }
  
  return (
    <div className="relative">
      {/* Supportive message toast */}
      {showMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Heart className="w-5 h-5 fill-current" />
            <p>{getSupportiveMessage('save_for_later')}</p>
          </div>
        </div>
      )}
      
      {/* Main button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
          isExpanded
            ? "bg-sky-50 border-sky-200"
            : "bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/50"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-800">
            Jag orkar inte läsa just nu
          </p>
          <p className="text-sm text-slate-500">
            Det är helt okej! Vi kan spara den till senare.
          </p>
        </div>
        <ChevronRight className={cn(
          "w-5 h-5 text-slate-400 transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>
      
      {/* Expanded options */}
      {isExpanded && (
        <div className="mt-3 pl-4 space-y-2 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={handleSaveForLater}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-left"
          >
            <Bookmark className="w-4 h-4 text-sky-500" />
            <div>
              <p className="font-medium text-slate-800 text-sm">Spara till senare</p>
              <p className="text-xs text-slate-500">Vi påminner dig om ett tag</p>
            </div>
          </button>
          
          {onShowShorterAlternative && (
            <button
              onClick={onShowShorterAlternative}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-left"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <p className="font-medium text-slate-800 text-sm">Visa kortare alternativ</p>
                <p className="text-xs text-slate-500">Artiklar under 3 minuter</p>
              </div>
            </button>
          )}
          
          <p className="text-xs text-slate-400 pt-2 italic">
            "Det är normalt att inte orka ibland. Din hälsa kommer alltid först. 💙"
          </p>
        </div>
      )}
    </div>
  )
}
