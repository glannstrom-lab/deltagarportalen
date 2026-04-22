import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, FileText, Compass, Mail, Briefcase, 
  MessageSquare, Award, CheckCircle2, Lock
} from '@/components/ui/icons'

interface RoadmapStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  locked: boolean
  action: string
  href: string
}

interface CareerRoadmapProps {
  stats: {
    hasProfile: boolean
    cvProgress: number
    interestGuideCompleted: boolean
    coverLetterCount: number
    applicationsCount: number
    hasConsultantContact: boolean
  }
}

export function CareerRoadmap({ stats }: CareerRoadmapProps) {
  const [animatedSteps, setAnimatedSteps] = useState<string[]>([])

  useEffect(() => {
    // Animera in stegen en i taget
    const steps = ['profile', 'cv', 'interest', 'cover-letter', 'apply', 'consultant', 'interview']
    const timeouts: ReturnType<typeof setTimeout>[] = []

    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setAnimatedSteps(prev => [...prev, step])
      }, index * 150)
      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const steps: RoadmapStep[] = [
    {
      id: 'profile',
      title: 'Skapa profil',
      description: 'Din grund för allt annat',
      icon: <User className="w-5 h-5" />,
      completed: stats.hasProfile,
      locked: false,
      action: 'Profil klar',
      href: '/profile'
    },
    {
      id: 'cv',
      title: 'Bygg ditt CV',
      description: 'Visa vad du kan',
      icon: <FileText className="w-5 h-5" />,
      completed: stats.cvProgress >= 100,
      locked: !stats.hasProfile,
      action: stats.cvProgress >= 100 ? 'CV klart' : `${stats.cvProgress}% klart`,
      href: '/cv-builder'
    },
    {
      id: 'interest',
      title: 'Utforska intressen',
      description: 'Hitta rätt riktning',
      icon: <Compass className="w-5 h-5" />,
      completed: stats.interestGuideCompleted,
      locked: !stats.hasProfile,
      action: stats.interestGuideCompleted ? 'Guide klar' : 'Starta guiden',
      href: '/interest-guide'
    },
    {
      id: 'cover-letter',
      title: 'Personligt brev',
      description: 'Berätta din historia',
      icon: <Mail className="w-5 h-5" />,
      completed: stats.coverLetterCount > 0,
      locked: stats.cvProgress < 50,
      action: stats.coverLetterCount > 0 ? 'Brev skapat' : 'Skapa brev',
      href: '/cover-letter'
    },
    {
      id: 'apply',
      title: 'Sök jobb',
      description: 'Ta första steget',
      icon: <Briefcase className="w-5 h-5" />,
      completed: stats.applicationsCount > 0,
      locked: stats.cvProgress < 100,
      action: stats.applicationsCount > 0 ? `${stats.applicationsCount} ansökningar` : 'Hitta jobb',
      href: '/jobs'
    },
    {
      id: 'consultant',
      title: 'Träffa konsulent',
      description: 'Få personligt stöd',
      icon: <MessageSquare className="w-5 h-5" />,
      completed: stats.hasConsultantContact,
      locked: stats.applicationsCount === 0,
      action: stats.hasConsultantContact ? 'Kontakt etablerad' : 'Boka möte',
      href: '/profile'
    },
    {
      id: 'interview',
      title: 'Gå på intervju',
      description: 'Närmare målet!',
      icon: <Award className="w-5 h-5" />,
      completed: false,
      locked: stats.applicationsCount < 3,
      action: 'Förbered dig',
      href: '/knowledge-base'
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Din väg till jobbet</h3>
          <p className="text-sm text-slate-700 mt-1">
            {progressPercent === 100 
              ? '🎉 Du är redo för intervjuer!'
              : `Du har kommit ${progressPercent}% på vägen`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-600">
            {completedCount}/{steps.length}
          </div>
          <div className="text-xs text-slate-600">steg klara</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isVisible = animatedSteps.includes(step.id)
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              } ${
                step.completed 
                  ? 'bg-teal-50 border border-teal-100' 
                  : step.locked
                    ? 'bg-slate-50 opacity-60'
                    : 'bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm'
              }`}
            >
              {/* Icon/Status */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                step.completed
                  ? 'bg-teal-500 text-white'
                  : step.locked
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-teal-100 text-teal-600'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : step.locked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${
                    step.completed ? 'text-teal-900' : 'text-slate-800'
                  }`}>
                    {step.title}
                  </h4>
                  {step.completed && (
                    <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">
                      Klar
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  step.locked ? 'text-slate-600' : 'text-slate-700'
                }`}>
                  {step.locked ? 'Låst - slutför föregående steg' : step.description}
                </p>
              </div>

              {/* Action */}
              {step.locked ? (
                <span
                  className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg text-slate-600 cursor-not-allowed ${
                    step.completed ? 'bg-teal-100 text-teal-700' : 'bg-slate-100'
                  }`}
                >
                  {step.action}
                </span>
              ) : (
                <Link
                  to={step.href}
                  className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    step.completed
                      ? 'text-teal-700 bg-teal-100 hover:bg-teal-200'
                      : 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                  }`}
                >
                  {step.action}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Motivational message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-teal-50 rounded-xl border border-amber-100">
        <p className="text-sm text-slate-700">
          {progressPercent === 0 ? (
            'Varje resa börjar med ett första steg. Du kan göra det! 💪'
          ) : progressPercent < 30 ? (
            'Bra start! Fortsätt i din egen takt. 🌱'
          ) : progressPercent < 60 ? (
            'Du är på god väg! Varje steg räknas. 🎯'
          ) : progressPercent < 90 ? (
            'Så nära nu! Du ska vara stolt över din insats. ⭐'
          ) : progressPercent < 100 ? (
            'Snart är du redo att söka ditt drömjobb! 🚀'
          ) : (
            'Du är redo! Nu gäller det att hitta rätt matchning. 🎉'
          )}
        </p>
      </div>
    </div>
  )
}
