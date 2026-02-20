import { useState, useEffect } from 'react'

interface ReadingProgressProps {
  articleId: string
}

export default function ReadingProgress({ articleId }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    // Load saved progress
    const saved = localStorage.getItem(`article-progress-${articleId}`)
    if (saved) {
      setProgress(parseInt(saved, 10))
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      
      setProgress(Math.min(Math.round(scrollPercent), 100))
      localStorage.setItem(`article-progress-${articleId}`, String(Math.round(scrollPercent)))

      // Show reminder after 10 minutes
      if (scrollPercent < 100 && scrollPercent > 0) {
        setTimeout(() => setShowReminder(true), 10 * 60 * 1000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [articleId])

  if (progress === 0) return null

  return (
    <>
      {/* Fixed progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-teal-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading reminder */}
      {showReminder && progress < 100 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 animate-slide-up">
          <p className="text-sm text-slate-700 mb-2">
            Du har läst {progress}% av artikeln. Vill du ta en paus eller fortsätta?
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowReminder(false)}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
            >
              Fortsätt läsa
            </button>
            <button 
              onClick={() => {
                setShowReminder(false)
                localStorage.setItem(`article-pause-${articleId}`, new Date().toISOString())
              }}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200"
            >
              Pausa
            </button>
          </div>
        </div>
      )}
    </>
  )
}
