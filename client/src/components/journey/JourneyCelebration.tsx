/**
 * JourneyCelebration - Celebration modal for milestone/achievement completions
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Star, Zap, PartyPopper, X, Trophy } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { JOURNEY_PHASES } from '@/data/journeyData'
import type { Achievement } from '@/services/journeyService'

interface JourneyCelebrationProps {
  completedMilestones?: string[]
  unlockedAchievements?: Achievement[]
  xpEarned: number
  onDismiss: () => void
}

export function JourneyCelebration({
  completedMilestones = [],
  unlockedAchievements = [],
  xpEarned,
  onDismiss
}: JourneyCelebrationProps) {
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number; color: string }[]>([])

  const hasMilestones = completedMilestones.length > 0
  const hasAchievements = unlockedAchievements.length > 0

  // Get milestone details
  const milestoneDetails = completedMilestones.map(id => {
    for (const phase of JOURNEY_PHASES) {
      const milestone = phase.milestones.find(m => m.id === id || m.key === id)
      if (milestone) return { ...milestone, phaseName: phase.name }
    }
    return null
  }).filter(Boolean)

  // Generate confetti on mount
  useEffect(() => {
    const colors = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899']
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    setConfetti(particles)
  }, [])

  const getTitle = () => {
    if (hasMilestones && hasAchievements) return 'Dubbel framgång!'
    if (hasAchievements) return 'Badge upplåst!'
    return 'Grattis!'
  }

  const getSubtitle = () => {
    const parts = []
    if (hasMilestones) {
      parts.push(completedMilestones.length === 1 ? 'en ny milstolpe' : `${completedMilestones.length} nya milstolpar`)
    }
    if (hasAchievements) {
      parts.push(unlockedAchievements.length === 1 ? 'en ny badge' : `${unlockedAchievements.length} nya badges`)
    }
    return `Du har uppnått ${parts.join(' och ')}!`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDismiss} />

        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ y: -20, x: `${particle.x}vw`, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: Math.random() * 720 - 360,
                opacity: 0
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: particle.delay,
                ease: 'easeIn'
              }}
              className="absolute w-3 h-3"
              style={{ backgroundColor: particle.color }}
            />
          ))}
        </div>

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-white rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors z-10"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          {/* Header */}
          <div className={`p-8 text-center ${
            hasAchievements
              ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500'
              : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
          }`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4"
            >
              {hasAchievements ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <PartyPopper className="w-10 h-10 text-white" />
              )}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {getTitle()}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80"
            >
              {getSubtitle()}
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* XP Earned */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 rounded-full py-2 px-4 mb-6"
            >
              <Zap className="w-5 h-5" />
              <span className="font-bold text-lg">+{xpEarned} XP</span>
            </motion.div>

            {/* Achievements list */}
            {hasAchievements && (
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide">Badges</h4>
                {unlockedAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{achievement.name}</h4>
                      <p className="text-sm text-slate-700">{achievement.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4" fill="currentColor" />
                      <span className="text-sm font-medium">+{achievement.xp_reward}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Milestones list */}
            {hasMilestones && (
              <div className="space-y-3 mb-6">
                {hasAchievements && (
                  <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide">Milstolpar</h4>
                )}
                {milestoneDetails.map((milestone, index) => (
                  <motion.div
                    key={milestone!.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (hasAchievements ? unlockedAchievements.length : 0) * 0.1 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{milestone!.name}</h4>
                      <p className="text-sm text-slate-700">{milestone!.phaseName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4" fill="currentColor" />
                      <span className="text-sm font-medium">+{milestone!.xpReward}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <Button onClick={onDismiss} className="w-full">
              Fortsätt din resa
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default JourneyCelebration
