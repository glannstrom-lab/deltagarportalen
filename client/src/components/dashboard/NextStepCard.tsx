import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  FileText, 
  Compass, 
  Briefcase, 
  Mail, 
  Target, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
import type { DashboardWidgetData } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface NextStepCardProps {
  data?: DashboardWidgetData | null
}

export function NextStepCard({ data }: NextStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (!data) return null

  // Bestäm nästa steg baserat på användarens progress
  const getNextStep = () => {
    if (!data.cv?.hasCV) {
      return {
        title: 'Skapa ditt CV',
        description: 'Börja med grundinformation för att komma igång',
        action: 'Starta nu',
        link: '/cv',
        icon: <FileText size={20} />,
        time: '15 min',
        color: 'from-violet-500 to-purple-600',
        bgColor: 'bg-violet-50',
        priority: 'high'
      }
    }
    
    if (data.cv?.progress < 100) {
      return {
        title: 'Färdigställ ditt CV',
        description: `Du har ${data.cv.progress}% klart. Lägg till mer information.`,
        action: 'Fortsätt',
        link: '/cv',
        icon: <FileText size={20} />,
        time: '10 min',
        color: 'from-violet-500 to-purple-600',
        bgColor: 'bg-violet-50',
        priority: 'medium'
      }
    }
    
    if (!data.interest?.hasResult) {
      return {
        title: 'Gör intresseguiden',
        description: 'Upptäck yrken som passar dina intressen',
        action: 'Starta',
        link: '/interest-guide',
        icon: <Compass size={20} />,
        time: '5 min',
        color: 'from-teal-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        priority: 'medium'
      }
    }
    
    if (data.jobs?.savedCount === 0) {
      return {
        title: 'Spara ett jobb',
        description: 'Hitta och spara ditt första jobb att söka',
        action: 'Hitta jobb',
        link: '/job-search',
        icon: <Briefcase size={20} />,
        time: '2 min',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        priority: 'medium'
      }
    }
    
    if (data.coverLetters?.count === 0) {
      return {
        title: 'Skapa personligt brev',
        description: 'Skriv ett brev som kompletterar ditt CV',
        action: 'Skriv brev',
        link: '/cover-letter',
        icon: <Mail size={20} />,
        time: '10 min',
        color: 'from-rose-500 to-pink-600',
        bgColor: 'bg-rose-50',
        priority: 'low'
      }
    }
    
    return {
      title: 'Skicka en ansökan',
      description: `Du har ${data.jobs?.savedCount} sparade jobb att söka!`,
      action: 'Ansök nu',
      link: '/job-tracker',
      icon: <Target size={20} />,
      time: '20 min',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      priority: 'high'
    }
  }

  const step = getNextStep()

  // Compact version
  if (!isExpanded) {
    return (
      <div className={cn(
        "rounded-2xl border-2 transition-all duration-300",
        step.bgColor.replace('50', '100'),
        "border-transparent hover:border-slate-200"
      )}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
              "bg-gradient-to-br",
              step.color
            )}>
              {step.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-amber-500" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Nästa steg
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
              <Clock size={12} />
              {step.time}
            </span>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ChevronDown size={16} className="text-slate-600" />
            </div>
          </div>
        </button>
      </div>
    )
  }

  // Expanded version
  return (
    <div className="relative group">
      <Link 
        to={step.link} 
        className="block focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-2xl"
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 transition-all duration-300",
          step.color,
          "hover:shadow-xl hover:-translate-y-0.5",
          "shadow-lg"
        )}>
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                <Sparkles size={12} />
                Rekommenderat nästa steg
              </span>
              
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-white/80">
                  <Clock size={12} />
                  {step.time}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsExpanded(false)
                  }}
                  className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label="Minimera"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-white/90 text-sm mb-4 line-clamp-2">
                  {step.description}
                </p>
                
                <div className="flex items-center gap-3">
                  <span className="sm:hidden inline-flex items-center gap-1 text-xs text-white/80">
                    <Clock size={12} />
                    {step.time}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold shadow-lg group-hover:bg-white/90 group-hover:shadow-xl transition-all">
                    {step.action}
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default NextStepCard
