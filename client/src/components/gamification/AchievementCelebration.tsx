import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
}

interface AchievementCelebrationProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementCelebration({ achievement, onClose }: AchievementCelebrationProps) {
  const triggerConfetti = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Teal and gold colors matching the portal theme
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#0d9488', '#f59e0b', '#6366f1', '#10b981', '#f97316']
      })
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#0d9488', '#f59e0b', '#6366f1', '#10b981', '#f97316']
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (achievement) {
      triggerConfetti()
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose, triggerConfetti])

  if (!achievement) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-in zoom-in-95 duration-300">
        <div className="text-6xl mb-4 animate-bounce">
          {achievement.icon}
        </div>
        <h2 
          id="achievement-title"
          className="text-2xl font-bold text-slate-800 mb-2"
        >
          {achievement.title}
        </h2>
        <p className="text-slate-600 mb-6">
          {achievement.description}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Fortsätt! 🎉
        </button>
      </div>
    </div>
  )
}

// Hook för att hantera achievements
export function useAchievements() {
  const checkAchievements = useCallback((stats: {
    cvProgress: number
    applications: number
    daysActive: number
    interestGuide: boolean
  }) => {
    const achievements: Achievement[] = []

    if (stats.cvProgress >= 100) {
      achievements.push({
        id: 'cv-complete',
        title: 'CV-mästare!',
        description: 'Du har skapat ett komplett CV. Du är redo att söka jobb!',
        icon: '📄'
      })
    }

    if (stats.applications >= 1) {
      achievements.push({
        id: 'first-application',
        title: 'Första steget!',
        description: 'Du har skickat din första ansökan. Det tar mod att söka jobb!',
        icon: '🚀'
      })
    }

    if (stats.applications >= 5) {
      achievements.push({
        id: 'five-applications',
        title: 'Jobbsökarhjälte!',
        description: 'Fem ansökningar skickade! Varje ansökan tar dig närmare målet.',
        icon: '⭐'
      })
    }

    if (stats.daysActive >= 7) {
      achievements.push({
        id: 'week-streak',
        title: 'En vecka stark!',
        description: 'Du har varit aktiv i en vecka. Fantastisk uthållighet!',
        icon: '🔥'
      })
    }

    if (stats.interestGuide) {
      achievements.push({
        id: 'interest-complete',
        title: 'Självkännare!',
        description: 'Du har upptäckt dina intressen. Det är första steget till rätt karriär!',
        icon: '🎯'
      })
    }

    return achievements
  }, [])

  return { checkAchievements }
}
