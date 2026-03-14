import { Link } from 'react-router-dom'
import { Briefcase, Bookmark } from 'lucide-react'

interface JobSearchWidgetProps {
  savedCount?: number
  size?: 'small' | 'medium' | 'large'
}

export function JobSearchWidget({ 
  savedCount = 0,
  size = 'small'
}: JobSearchWidgetProps) {
  
  if (size === 'small') {
    return (
      <Link to="/job-search" className="block bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Jobb</h3>
          <Briefcase size={18} className="text-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{savedCount}</span>
          <span className="text-sm text-slate-500">sparade</span>
        </div>
      </Link>
    )
  }

  return (
    <Link to="/job-search" className="block bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bookmark size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Sparade jobb</h3>
          <p className="text-sm text-slate-500">{savedCount} jobb i din lista</p>
        </div>
      </div>
      
      {savedCount === 0 ? (
        <p className="text-sm text-blue-600">
          Börja spara jobb som intresserar dig
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Klicka för att se dina sparade jobb
        </p>
      )}
    </Link>
  )
}

export default JobSearchWidget
