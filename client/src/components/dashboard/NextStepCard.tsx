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
  Sparkles,
  ChevronRight
} from '@/components/ui/icons'
import type { DashboardWidgetData } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface NextStepCardProps {
  data?: DashboardWidgetData | null
}

// Enhanced color system
const colorSchemes = {
  violet: {
    gradient: 'from-teal-500 to-sky-600',
    bg: 'bg-teal-50',
    bgLight: 'bg-teal-100',
    text: 'text-teal-700',
    ring: 'focus:ring-teal-500'
  },
  teal: {
    gradient: 'from-teal-500 to-emerald-600',
    bg: 'bg-emerald-50',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'focus:ring-emerald-500'
  },
  blue: {
    gradient: 'from-blue-500 to-sky-600',
    bg: 'bg-blue-50',
    bgLight: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'focus:ring-blue-500'
  },
  rose: {
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    bgLight: 'bg-rose-100',
    text: 'text-rose-700',
    ring: 'focus:ring-rose-500'
  },
  amber: {
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    bgLight: 'bg-amber-100',
    text: 'text-amber-700',
    ring: 'focus:ring-amber-500'
  }
}

export function NextStepCard({ data }: NextStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  if (!data) return null

  // Bestäm nästa steg baserat på användarens progress
  const getNextStep = () => {
    if (!data.cv?.hasCV) {
      return {
        title: 'Skapa ditt CV',
        description: 'Börja med grundinformation för att komma igång',
        action: 'Starta nu',
        link: '/cv',
        icon: <FileText size={24} />,
        time: '15 min',
        color: colorSchemes.violet,
        priority: 'high'
      }
    }
    
    if (data.cv?.progress < 100) {
      return {
        title: 'Färdigställ ditt CV',
        description: `Du har ${data.cv.progress}% klart. Lägg till mer information.`,
        action: 'Fortsätt',
        link: '/cv',
        icon: <FileText size={24} />,
        time: '10 min',
        color: colorSchemes.violet,
        priority: 'medium'
      }
    }
    
    if (!data.interest?.hasResult) {
      return {
        title: 'Gör intresseguiden',
        description: 'Upptäck yrken som passar dina intressen',
        action: 'Starta',
        link: '/interest-guide',
        icon: <Compass size={24} />,
        time: '5 min',
        color: colorSchemes.teal,
        priority: 'medium'
      }
    }
    
    if (data.jobs?.savedCount === 0) {
      return {
        title: 'Spara ett jobb',
        description: 'Hitta och spara ditt första jobb att söka',
        action: 'Hitta jobb',
        link: '/job-search',
        icon: <Briefcase size={24} />,
        time: '2 min',
        color: colorSchemes.blue,
        priority: 'medium'
      }
    }
    
    if (data.coverLetters?.count === 0) {
      return {
        title: 'Skapa personligt brev',
        description: 'Skriv ett brev som kompletterar ditt CV',
        action: 'Skriv brev',
        link: '/cover-letter',
        icon: <Mail size={24} />,
        time: '10 min',
        color: colorSchemes.rose,
        priority: 'low'
      }
    }
    
    return {
      title: 'Skicka en ansökan',
      description: `Du har ${data.jobs?.savedCount} sparade jobb att söka!`,
      action: 'Ansök nu',
      link: '/job-search',
      icon: <Target size={24} />,
      time: '20 min',
      color: colorSchemes.amber,
      priority: 'high'
    }
  }

  const step = getNextStep()

  // Compact version
  if (!isExpanded) {
    return (
      <div className={cn(
        "rounded-2xl border-2 transition-all duration-300",
        step.color.bgLight,
        "border-transparent hover:border-slate-200",
        "hover:shadow-lg"
      )}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
              "bg-gradient-to-br",
              step.color.gradient
            )}>
              {step.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rekommenderat nästa steg
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-700 font-medium">
              <Clock size={14} />
              {step.time}
            </span>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              "bg-white group-hover:shadow-md transition-all duration-200",
              "group-hover:scale-105"
            )}>
              <ChevronDown size={18} className="text-slate-600" />
            </div>
          </div>
        </button>
      </div>
    )
  }

  // Expanded version
  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={step.link} 
        className={cn(
          "block focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-2xl",
          step.color.ring
        )}
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 transition-all duration-300",
          step.color.gradient,
          "hover:shadow-2xl",
          isHovered ? "-translate-y-1" : "translate-y-0"
        )}>
          {/* Animated background decorations */}
          <div 
            className={cn(
              "absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-transform duration-700",
              isHovered && "scale-110"
            )} 
          />
          <div 
            className={cn(
              "absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl transition-transform duration-700",
              isHovered && "scale-110"
            )} 
          />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                <Sparkles size={14} />
                Rekommenderat nästa steg
              </span>
              
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/90 font-medium">
                  <Clock size={14} />
                  {step.time}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsExpanded(false)
                  }}
                  className={cn(
                    "p-2 rounded-xl text-white/80 transition-all duration-200",
                    "hover:bg-white/20 hover:text-white",
                    "focus:outline-none focus:ring-2 focus:ring-white/50"
                  )}
                  aria-label="Minimera"
                >
                  <ChevronUp size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex items-start gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner transition-transform duration-300",
                isHovered && "scale-110"
              )}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-white/90 text-base mb-5 line-clamp-2">
                  {step.description}
                </p>
                
                <div className="flex items-center gap-4">
                  <span className="sm:hidden inline-flex items-center gap-1.5 text-sm text-white/80">
                    <Clock size={14} />
                    {step.time}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg transition-all duration-200",
                    "group-hover:bg-white/95 group-hover:shadow-xl",
                    "group-hover:gap-3"
                  )}>
                    {step.action}
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
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
