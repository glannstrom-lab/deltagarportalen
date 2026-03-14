/**
 * InsightsTab - AI-analys, prognoser och data
 * Djupa insikter om din jobbsökar-resa
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, Target, Lightbulb, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { cn } from '@/lib/utils'

// Mock AI-insikter
const aiInsights = {
  prediction: 78,
  daysToInterview: 14,
  bestTime: 'Tisdag 10:00',
  optimalEnergy: 'Medium',
  trend: 'up',
  recommendations: [
    { id: '1', action: 'Sök 2 jobb idag', impact: '+5% chans', reason: 'Din CV är redo och du har energi' },
    { id: '2', action: 'Öva intervju', impact: 'Förberedelse', reason: 'Du har intervju om 2 veckor' },
    { id: '3', action: 'Uppdatera LinkedIn', impact: 'Synlighet', reason: 'Rekryterare är aktiva nu' },
  ],
  patterns: [
    'Du är 40% mer aktiv på tisdagar',
    'Dina ansökningar får 3x fler svar när du söker före lunch',
    'När du loggar välmående ökar din aktivitet med 25%',
  ]
}

export default function InsightsTab() {
  const { data } = useDashboardData()
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="text-violet-500" size={28} />
            Mina insikter
          </h2>
          <p className="text-slate-500">AI-analys och personliga rekommendationer</p>
        </div>
      </div>

      {/* Huvud-prognos */}
      <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Din prognos</h3>
            <p className="text-violet-100 text-sm">Baserat på din aktivitet</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{aiInsights.prediction}%</p>
            <p className="text-sm text-violet-100">chans till intervju</p>
          </div>
        </div>
        
        <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${aiInsights.prediction}%` }}
            className="h-full bg-white rounded-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{aiInsights.daysToInterview}</p>
            <p className="text-xs text-violet-100">dagar till intervju</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{aiInsights.bestTime}</p>
            <p className="text-xs text-violet-100">bästa tiden</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{aiInsights.optimalEnergy}</p>
            <p className="text-xs text-violet-100">optimal energi</p>
          </div>
        </div>
      </div>

      {/* Rekommendationer */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target size={20} className="text-violet-500" />
          AI-rekommendationer
        </h3>
        <div className="space-y-3">
          {aiInsights.recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors cursor-pointer"
              onClick={() => setExpandedInsight(expandedInsight === rec.id ? null : rec.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <TrendingUp size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{rec.action}</h4>
                    <p className="text-sm text-emerald-600 font-medium">{rec.impact}</p>
                  </div>
                </div>
                {expandedInsight === rec.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
              {expandedInsight === rec.id && (
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }}
                  className="mt-3 pt-3 border-t border-slate-100"
                >
                  <p className="text-sm text-slate-600">{rec.reason}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mönster */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-500" />
          Dina mönster
        </h3>
        <div className="space-y-3">
          {aiInsights.patterns.map((pattern, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <TrendingUp size={14} className="text-violet-500" />
              </div>
              <p className="text-slate-700">{pattern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant - alltid tillgänglig */}
      <AIAssistant />
    </div>
  )
}
