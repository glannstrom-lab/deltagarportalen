/**
 * Mobile Preview Floating Action Button
 * Quick access to preview on mobile devices
 */

import { Eye, X } from 'lucide-react'
import { useState } from 'react'
import { CVPreview } from './CVPreview'
import type { CVData } from '@/services/supabaseApi'

interface MobilePreviewFABProps {
  data: CVData
}

export function MobilePreviewFAB({ data }: MobilePreviewFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Förhandsgranska CV"
      >
        <Eye className="w-6 h-6" />
      </button>
      
      {/* Mobile Preview Modal */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50">
          <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-100 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
              <h2 className="font-semibold text-slate-800">Förhandsvisning</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Stäng"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto">
                <CVPreview data={data} />
              </div>
            </div>
            
            {/* Footer hint */}
            <div className="p-4 bg-white border-t text-center text-sm text-slate-500">
              Svep nedåt eller tryck X för att stänga
            </div>
          </div>
        </div>
      )}
    </>
  )
}
