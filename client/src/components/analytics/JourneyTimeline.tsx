/**
 * Journey Timeline - Visualisering av jobbsökar-resan
 */
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Award, Target, Briefcase } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Milestone {
  date: string
  title: string
  type: 'cv' | 'application' | 'interview' | 'skill' | 'milestone'
  description: string
}

const milestones: Milestone[] = [
  { date: '2026-03-01', title: 'Skapade CV', type: 'cv', description: '85% komplett' },
  { date: '2026-03-05', title: 'Sparade första jobbet', type: 'application', description: 'Systemutvecklare på Spotify' },
  { date: '2026-03-10', title: 'Skickade 5 ansökningar', type: 'milestone', description: 'Veckomål nått!' },
  { date: '2026-03-12', title: 'Fick intervjubokning', type: 'interview', description: 'Spotify - imorgon 10:00' },
]

export function JourneyTimeline() {
  return (
    <div className="p-6 bg-white rounded-2xl border border-stone-200">
      <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-[var(--c-solid)]" size={24} />
        Din jobbsökar-resa
      </h2>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200" />
        
        {milestones.map((milestone, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-4 mb-6"
          >
            <div className={cn(
              "relative z-10 w-8 h-8 rounded-full flex items-center justify-center",
              milestone.type === 'cv' ? 'bg-[var(--c-accent)]/40 text-[var(--c-text)]' :
              milestone.type === 'application' ? 'bg-blue-100 text-blue-600' :
              milestone.type === 'interview' ? 'bg-emerald-100 text-emerald-600' :
              'bg-amber-100 text-amber-600'
            )}>
              {milestone.type === 'cv' && <Target size={16} />}
              {milestone.type === 'application' && <Briefcase size={16} />}
              {milestone.type === 'interview' && <Calendar size={16} />}
              {milestone.type === 'milestone' && <Award size={16} />}
            </div>
            
            <div className="flex-1 pb-6">
              <p className="text-xs text-stone-600">{milestone.date}</p>
              <h3 className="font-semibold text-stone-800">{milestone.title}</h3>
              <p className="text-sm text-stone-600">{milestone.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-[var(--c-bg)] rounded-xl border border-[var(--c-accent)]/60">
        <h4 className="font-semibold text-[var(--c-text)] mb-1">Prognos</h4>
        <p className="text-sm text-[var(--c-text)]">
          Baserat på din takt: <span className="font-bold">Jobberbjudande inom 3-4 veckor</span> 
          (konfidens: 78%)
        </p>
      </div>
    </div>
  )
}

export default JourneyTimeline
