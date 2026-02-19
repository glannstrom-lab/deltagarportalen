import { Card } from '@/components/ui'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Briefcase, Compass } from 'lucide-react'

interface QuickLinksProps {
  hasCV: boolean
  hasInterestResult: boolean
}

export function QuickLinks({ hasCV, hasInterestResult }: QuickLinksProps) {
  const links = [
    { 
      label: 'Fortsätt med CV', 
      path: '/cv', 
      desc: hasCV ? 'Påbörjat' : 'Inte påbörjat', 
      done: hasCV,
      icon: FileText
    },
    { 
      label: 'Intresseguide', 
      path: '/interest-guide', 
      desc: hasInterestResult ? 'Genomförd' : 'Ej gjord', 
      done: hasInterestResult,
      icon: Compass
    },
    { 
      label: 'Sök jobb', 
      path: '/job-search', 
      desc: 'Hitta lediga jobb', 
      done: false,
      icon: Briefcase
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Snabbåtgärder</h3>
      
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div>
              <div className="text-sm font-medium text-slate-900">{link.label}</div>
              <div className={`text-xs ${link.done ? 'text-emerald-600' : 'text-slate-500'}`}>
                {link.desc}
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600" />
          </Link>
        ))}
      </div>
    </Card>
  )
}
