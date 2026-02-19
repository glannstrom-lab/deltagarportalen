import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Compass, Briefcase } from 'lucide-react'

interface QuickActionsProps {
  hasCV: boolean
  hasInterestResult: boolean
}

export function QuickActions({ hasCV, hasInterestResult }: QuickActionsProps) {
  const actions = [
    {
      label: 'Fortsätt med CV',
      path: '/cv',
      status: hasCV ? 'Påbörjat' : 'Ej påbörjat',
      icon: FileText,
      color: 'bg-accent-orange',
    },
    {
      label: 'Intresseguide',
      path: '/interest-guide',
      status: hasInterestResult ? 'Genomförd' : 'Ej gjord',
      icon: Compass,
      color: 'bg-primary',
    },
    {
      label: 'Sök jobb',
      path: '/job-search',
      status: 'Hitta lediga jobb',
      icon: Briefcase,
      color: 'bg-accent-blue',
    },
  ]

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-6">Snabbåtgärder</h3>
      <div className="space-y-4">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white`}>
              <action.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{action.label}</p>
              <p className={`text-sm ${
                action.status === 'Påbörjat' || action.status === 'Genomförd' 
                  ? 'text-accent-green' 
                  : 'text-slate-500'
              }`}>
                {action.status}
              </p>
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-slate-600" />
          </Link>
        ))}
      </div>
    </div>
  )
}
