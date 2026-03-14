import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Compass, Briefcase, Mail, Target, Clock } from 'lucide-react'
import type { DashboardWidgetData } from '@/types/dashboard'

interface NextStepCardProps {
  data?: DashboardWidgetData | null
}

export function NextStepCard({ data }: NextStepCardProps) {
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
        color: 'from-violet-500 to-purple-600'
      }
    }
    
    if (data.cv?.progress < 100) {
      return {
        title: 'Färdigställ ditt CV',
        description: `Du har ${data.cv.progress}% klart. Lägg till mer information för att nå 100%`,
        action: 'Fortsätt bygga',
        link: '/cv',
        icon: <FileText size={24} />,
        time: '10 min',
        color: 'from-violet-500 to-purple-600'
      }
    }
    
    if (!data.interest?.hasResult) {
      return {
        title: 'Gör intresseguiden',
        description: 'Upptäck vilka yrken som passar dina intressen',
        action: 'Starta guiden',
        link: '/interest-guide',
        icon: <Compass size={24} />,
        time: '5 min',
        color: 'from-teal-500 to-emerald-600'
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
        color: 'from-blue-500 to-indigo-600'
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
        color: 'from-rose-500 to-pink-600'
      }
    }
    
    return {
      title: 'Skicka en ansökan',
      description: `Du har ${data.jobs?.savedCount} sparade jobb. Sök ett nu!`,
      action: 'Ansök nu',
      link: '/job-tracker',
      icon: <Target size={24} />,
      time: '20 min',
      color: 'from-amber-500 to-orange-600'
    }
  }

  const step = getNextStep()

  return (
    <Link to={step.link} className="block group">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${step.color} p-6 transition-all hover:shadow-lg hover:-translate-y-0.5`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
              <Target size={12} />
              Rekommenderat nästa steg
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-1">
                {step.title}
              </h3>
              <p className="text-white/90 text-sm mb-3">
                {step.description}
              </p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs text-white/80">
                  <Clock size={12} />
                  {step.time}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-sm font-semibold group-hover:bg-white/90 transition-colors">
                  {step.action}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default NextStepCard
