/**
 * WhyItMatters - Förklarar VARFÖR användaren ska göra något
 * "Show the value, not just the task"
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Lightbulb, ArrowRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface WhyItMattersProps {
  title: string
  reason: string
  statistic?: string
  benefit?: string
  variant?: 'inline' | 'tooltip' | 'expandable'
  className?: string
}

// Inline variant - visas alltid
export function WhyItMattersInline({ 
  reason, 
  statistic, 
  benefit,
  className 
}: Omit<WhyItMattersProps, 'variant' | 'title'>) {
  return (
    <div className={cn("text-sm text-slate-500 mt-2 space-y-1", className)}>
      <div className="flex items-start gap-2">
        <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <span>{reason}</span>
      </div>
      {statistic && (
        <div className="flex items-center gap-2 ml-5 text-xs text-slate-400">
          <span>📊</span>
          <span>{statistic}</span>
        </div>
      )}
      {benefit && (
        <div className="flex items-center gap-2 ml-5 text-xs text-emerald-600 font-medium">
          <span>✨</span>
          <span>{benefit}</span>
        </div>
      )}
    </div>
  )
}

// Tooltip variant - visas vid hover
export function WhyItMattersTooltip({ 
  title,
  reason, 
  statistic,
  benefit 
}: WhyItMattersProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors"
      >
        <HelpCircle size={14} />
        <span>Varför?</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 left-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-lg border border-slate-200"
          >
            <div className="text-sm text-slate-700">
              <p className="font-medium text-slate-900 mb-1">{title}</p>
              <p className="mb-2">{reason}</p>
              {statistic && (
                <p className="text-xs text-slate-500 mb-1">📊 {statistic}</p>
              )}
              {benefit && (
                <p className="text-xs text-emerald-600 font-medium">✨ {benefit}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Expandable variant - kan expanderas
export function WhyItMattersExpandable({ 
  title,
  reason, 
  statistic,
  benefit 
}: WhyItMattersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
      >
        <Lightbulb size={16} />
        <span>Varför är detta viktigt?</span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight size={14} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Lightbulb size={16} className="text-violet-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
                  <p className="text-sm text-slate-600 mb-2">{reason}</p>
                  
                  {statistic && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">📊</span>
                      <span>{statistic}</span>
                    </div>
                  )}
                  
                  {benefit && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✨</span>
                      <span>{benefit}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full hover:bg-white/50 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Badge variant - liten badge som kan klickas
export function WhyItMattersBadge({ 
  reason,
  className 
}: { 
  reason: string
  className?: string 
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium cursor-help">
        <Lightbulb size={10} />
        <span>Varför?</span>
      </span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg"
          >
            {reason}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Fördefinierade "Varför"-texter för olika widgets
export const whyItMattersContent = {
  cv: {
    title: 'Varför behöver jag ett CV?',
    reason: 'Ditt CV är den första kontakten med arbetsgivare. Det visar vem du är och vad du kan.',
    statistic: '8 av 10 arbetsgivare tittar på CV först',
    benefit: 'Ett bra CV ökar chansen till intervju med 65%',
  },
  interestGuide: {
    title: 'Varför göra intresseguiden?',
    reason: 'Testet hjälper dig upptäcka yrken som matchar din personlighet och styrkor.',
    statistic: '73% hittar nya yrkesvägar de inte tänkt på',
    benefit: 'Ökar chansen att trivas på jobbet',
  },
  jobSearch: {
    title: 'Varför spara jobb?',
    reason: 'Att spara jobb hjälper dig hålla koll på möjligheter utan att känna stress.',
    statistic: 'De som sparar jobb söker i genomsnitt 3x fler',
    benefit: 'Mindre stress, bättre översikt',
  },
  coverLetter: {
    title: 'Varför personligt brev?',
    reason: 'Brevet visar vem DU är bakom CV:t. Det är chansen att förklara varför just du passar.',
    statistic: '67% av arbetsgivare läser brevet noga',
    benefit: 'Skiljer dig från andra sökande',
  },
  applications: {
    title: 'Varför följa upp ansökningar?',
    reason: 'Att ha koll på dina ansökningar gör dig förberedd och professionell.',
    statistic: '30% glömmer bort vilka jobb de sökt',
    benefit: 'Bättre förberedd vid samtal',
  },
  wellness: {
    title: 'Varför logga välmående?',
    reason: 'Att reflektera över hur du mår hjälper dig ta hand om dig själv.',
    statistic: 'Regelbunden reflektion minskar stress med 23%',
    benefit: 'Bättre självkännedom',
  },
  exercises: {
    title: 'Varför göra övningar?',
    reason: 'Övningarna förbereder dig inför intervjuer och svåra samtal.',
    statistic: 'De som övar är 40% mer säkra i intervjuer',
    benefit: 'Mindre nervös inför viktiga möten',
  },
  knowledge: {
    title: 'Varför läsa artiklar?',
    reason: 'Kunskap om jobbsökande gör dig till en starkare kandidat.',
    statistic: 'Väl informerade sökande får fler erbjudanden',
    benefit: 'Känner dig mer förberedd',
  },
  quests: {
    title: 'Varför göra quests?',
    reason: 'Små dagliga mål bygger vanor och ger dig momentum i jobbsökandet.',
    statistic: 'Små dagliga steg leder till 80% större framgång',
    benefit: 'Bygger positiva vanor',
  },
}

export default WhyItMattersInline
