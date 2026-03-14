import { Link } from 'react-router-dom'
import { FileText, TrendingUp } from 'lucide-react'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'small' | 'medium' | 'large'
}

export function CVWidget({ 
  hasCV = false, 
  progress = 0,
  size = 'small'
}: CVWidgetProps) {
  
  if (size === 'small') {
    return (
      <Link to="/cv" className="block bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">CV</h3>
          <FileText size={18} className="text-violet-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{progress}%</span>
          {!hasCV && <span className="text-xs text-amber-600">Skapa CV</span>}
        </div>
        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
          <div 
            className="bg-violet-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Link>
    )
  }

  return (
    <Link to="/cv" className="block bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
          <FileText size={20} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Ditt CV</h3>
          <p className="text-sm text-slate-500">{progress}% komplett</p>
        </div>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {!hasCV && (
        <p className="mt-3 text-sm text-amber-600">
          Kom igång genom att skapa ditt CV
        </p>
      )}
    </Link>
  )
}

export default CVWidget
