/**
 * Badge System - Gamification 2.0
 * Märken för achievements och framsteg
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, 
  Star, 
  Zap, 
  Target, 
  Flame,
  Crown,
  Medal,
  Trophy,
  X,
  Lock,
  CheckCircle2,
  Share2
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  tier: BadgeTier
  category: 'cv' | 'jobsearch' | 'engagement' | 'wellness' | 'special'
  requirement: string
  unlockedAt?: string
  isUnlocked: boolean
  progress?: number
  total?: number
}

// Badge definitions
export const badges: Omit<Badge, 'unlockedAt' | 'isUnlocked' | 'progress'>[] = [
  // CV Badges
  {
    id: 'cv-starter',
    name: 'CV-Nybörjare',
    description: 'Skapat ditt första CV',
    icon: <Target size={24} />,
    tier: 'bronze',
    category: 'cv',
    requirement: 'Skapa ett CV',
    total: 1
  },
  {
    id: 'cv-builder',
    name: 'CV-Byggare',
    description: 'Fyllt i alla sektioner i CV:t',
    icon: <Award size={24} />,
    tier: 'silver',
    category: 'cv',
    requirement: '100% komplett CV',
    total: 100
  },
  {
    id: 'cv-master',
    name: 'CV-Mästare',
    description: 'Nått ATS-score över 80',
    icon: <Crown size={24} />,
    tier: 'gold',
    category: 'cv',
    requirement: 'ATS-score 80+',
    total: 80
  },
  // Job Search Badges
  {
    id: 'job-scout',
    name: 'Jobbscout',
    description: 'Sparat ditt första jobb',
    icon: <Star size={24} />,
    tier: 'bronze',
    category: 'jobsearch',
    requirement: 'Spara 1 jobb',
    total: 1
  },
  {
    id: 'job-hunter',
    name: 'Jobbjägare',
    description: 'Skickat 5 ansökningar',
    icon: <Zap size={24} />,
    tier: 'silver',
    category: 'jobsearch',
    requirement: '5 ansökningar',
    total: 5
  },
  {
    id: 'job-master',
    name: 'Jobb-Mästare',
    description: 'Fått din första intervju',
    icon: <Trophy size={24} />,
    tier: 'gold',
    category: 'jobsearch',
    requirement: 'Boka intervju',
    total: 1
  },
  // Engagement Badges
  {
    id: 'streak-starter',
    name: 'Streak-Nybörjare',
    description: '3 dagar i rad på portalen',
    icon: <Flame size={24} />,
    tier: 'bronze',
    category: 'engagement',
    requirement: '3 dagars streak',
    total: 3
  },
  {
    id: 'streak-warrior',
    name: 'Streak-Krigare',
    description: '7 dagar i rad på portalen',
    icon: <Flame size={24} />,
    tier: 'silver',
    category: 'engagement',
    requirement: '7 dagars streak',
    total: 7
  },
  {
    id: 'streak-legend',
    name: 'Streak-Legend',
    description: '30 dagar i rad på portalen',
    icon: <Flame size={24} />,
    tier: 'gold',
    category: 'engagement',
    requirement: '30 dagars streak',
    total: 30
  },
  // Wellness Badges
  {
    id: 'mood-logger',
    name: 'Mood-Logger',
    description: 'Loggat humöret 7 gånger',
    icon: <Medal size={24} />,
    tier: 'bronze',
    category: 'wellness',
    requirement: 'Logga 7 gånger',
    total: 7
  },
  {
    id: 'wellness-warrior',
    name: 'Välmående-Krigare',
    description: '14 dagar med välmående-registrering',
    icon: <HeartIcon size={24} />,
    tier: 'silver',
    category: 'wellness',
    requirement: '14 dagar',
    total: 14
  },
  // Special Badges
  {
    id: 'first-week',
    name: 'Första Veckan',
    description: 'Avslutat första veckans alla quests',
    icon: <CheckCircle2 size={24} />,
    tier: 'silver',
    category: 'special',
    requirement: '7 dagars quests',
    total: 7
  },
  {
    id: 'quick-win',
    name: 'Quick-Win-Hjälte',
    description: 'Avslutat 10 quick wins',
    icon: <Zap size={24} />,
    tier: 'bronze',
    category: 'special',
    requirement: '10 quick wins',
    total: 10
  }
]

// Custom heart icon since Lucide's might vary
function HeartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// Badge showcase component
export function BadgeShowcase({ userBadges }: { userBadges: Badge[] }) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [filter, setFilter] = useState<'all' | Badge['category']>('all')

  const filteredBadges = userBadges.filter(badge => 
    filter === 'all' || badge.category === filter
  )

  const unlockedCount = userBadges.filter(b => b.isUnlocked).length
  const totalCount = userBadges.length

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            Dina Badges
          </h2>
          <p className="text-stone-700">
            {unlockedCount} av {totalCount} upplåsta
          </p>
        </div>
        <ProgressBadge unlocked={unlockedCount} total={totalCount} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'cv', 'jobsearch', 'engagement', 'wellness', 'special'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === cat
                ? 'bg-[var(--c-accent)]/40 text-[var(--c-text)]'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            {cat === 'all' ? 'Alla' : 
             cat === 'cv' ? 'CV' :
             cat === 'jobsearch' ? 'Jobbsök' :
             cat === 'engagement' ? 'Engagemang' :
             cat === 'wellness' ? 'Välmående' : 'Special'}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {filteredBadges.map((badge) => (
          <motion.button
            key={badge.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedBadge(badge)}
            className={cn(
              "relative aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-3",
              badge.isUnlocked
                ? getTierStyles(badge.tier)
                : 'bg-stone-50 border-stone-200 opacity-60'
            )}
          >
            {/* Badge Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-2",
              badge.isUnlocked ? 'bg-white/80' : 'bg-stone-200'
            )}>
              {badge.isUnlocked ? (
                badge.icon
              ) : (
                <Lock size={20} className="text-stone-600" />
              )}
            </div>

            {/* Badge Name */}
            <p className={cn(
              "text-xs font-medium text-center line-clamp-2",
              badge.isUnlocked ? 'text-stone-800' : 'text-stone-600'
            )}>
              {badge.name}
            </p>

            {/* Progress indicator for locked badges */}
            {!badge.isUnlocked && badge.progress !== undefined && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-stone-400 rounded-full"
                    style={{ width: `${(badge.progress / (badge.total || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-stone-600 text-center mt-0.5">
                  {badge.progress}/{badge.total}
                </p>
              </div>
            )}

            {/* New indicator */}
            {badge.isUnlocked && badge.unlockedAt && 
              new Date(badge.unlockedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal 
            badge={selectedBadge} 
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Progress badge showing overall progress
function ProgressBadge({ unlocked, total }: { unlocked: number; total: number }) {
  const percentage = Math.round((unlocked / total) * 100)
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-2xl font-bold text-stone-800">{percentage}%</p>
        <p className="text-xs text-stone-700">Komplett</p>
      </div>
      <div className="w-12 h-12 relative">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="4"
            strokeDasharray={`${(percentage / 100) * 125.6} 125.6`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy size={16} className="text-[var(--c-text)]" />
        </div>
      </div>
    </div>
  )
}

// Badge detail modal
function BadgeDetailModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const tierNames: Record<BadgeTier, string> = {
    bronze: 'Brons',
    silver: 'Silver',
    gold: 'Guld',
    platinum: 'Platinum'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden",
          !badge.isUnlocked && 'opacity-90'
        )}
      >
        {/* Background gradient for unlocked */}
        {badge.isUnlocked && (
          <div className={cn(
            "absolute inset-0 opacity-10",
            badge.tier === 'bronze' ? 'bg-amber-500' :
            badge.tier === 'silver' ? 'bg-stone-400' :
            badge.tier === 'gold' ? 'bg-yellow-400' :
            'bg-[var(--c-solid)]'
          )} />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"
        >
          <X size={18} className="text-stone-600" />
        </button>

        {/* Badge Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={cn(
            "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
            badge.isUnlocked 
              ? getTierStyles(badge.tier).replace('border-2', '')
              : 'bg-stone-100'
          )}
        >
          {badge.isUnlocked ? (
            <div className="text-4xl">{badge.icon}</div>
          ) : (
            <Lock size={32} className="text-stone-600" />
          )}
        </motion.div>

        {/* Badge Info */}
        <h3 className="text-xl font-bold text-stone-800 mb-1">{badge.name}</h3>
        <p className={cn(
          "text-sm font-medium mb-4",
          badge.tier === 'bronze' ? 'text-amber-600' :
          badge.tier === 'silver' ? 'text-stone-700' :
          badge.tier === 'gold' ? 'text-yellow-600' :
          'text-[var(--c-text)]'
        )}>
          {tierNames[badge.tier]}-nivå
        </p>

        <p className="text-stone-600 mb-4">{badge.description}</p>

        {/* Progress or Unlocked Date */}
        {badge.isUnlocked ? (
          <div className="p-3 bg-emerald-50 rounded-xl mb-4">
            <p className="text-emerald-700 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              Uplåst {badge.unlockedAt && new Date(badge.unlockedAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-stone-50 rounded-xl mb-4">
            <p className="text-sm text-stone-600 mb-2">Krav: {badge.requirement}</p>
            {badge.progress !== undefined && (
              <div>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(badge.progress / (badge.total || 1)) * 100}%` }}
                    className="h-full bg-[var(--c-solid)] rounded-full"
                  />
                </div>
                <p className="text-xs text-stone-700">
                  {badge.progress} av {badge.total} ({Math.round((badge.progress / (badge.total || 1)) * 100)}%)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Share button for unlocked badges */}
        {badge.isUnlocked && (
          <Button variant="outline" className="w-full" onClick={() => {
            // Share functionality would go here
            alert('Delningsfunktion kommer snart!')
          }}>
            <Share2 size={16} className="mr-2" />
            Dela framsteg
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Helper function to get tier styles
function getTierStyles(tier: BadgeTier): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-50 border-amber-300 text-amber-700'
    case 'silver':
      return 'bg-stone-50 border-stone-300 text-stone-700'
    case 'gold':
      return 'bg-yellow-50 border-yellow-300 text-yellow-700'
    case 'platinum':
      return 'bg-[var(--c-bg)] border-[var(--c-accent)] text-[var(--c-text)]'
    default:
      return 'bg-stone-50 border-stone-200 text-stone-700'
  }
}

// Hook för att beräkna badge-progress (mock för nu)
export function useBadges(userProgress: Record<string, number>): Badge[] {
  return badges.map(badge => {
    const isUnlocked = userProgress[badge.id] >= (badge.total || 1)

    return {
      ...badge,
      isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      progress: userProgress[badge.id] || 0
    }
  })
}

export default BadgeShowcase
