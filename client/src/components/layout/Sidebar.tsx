import { Link, useLocation } from 'react-router-dom'
import { navItems, bottomItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Briefcase, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuthStore()
  const [expanded, setExpanded] = useState(true)

  return (
    <aside className={cn(
      "bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col transition-all duration-300",
      expanded ? "w-64" : "w-20"
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <span className="font-semibold text-slate-900 whitespace-nowrap">Deltagarportalen</span>
          )}
        </Link>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
        >
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                isActive 
                  ? 'bg-violet-50 text-violet-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              title={!expanded ? item.label : undefined}
            >
              <Icon size={20} />
              {expanded && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-slate-100">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1',
                isActive 
                  ? 'bg-violet-50 text-violet-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              title={!expanded ? item.label : undefined}
            >
              <Icon size={18} />
              {expanded && <span>{item.label}</span>}
            </Link>
          )
        })}
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
          title={!expanded ? "Logga ut" : undefined}
        >
          <LogOut size={18} />
          {expanded && <span>Logga ut</span>}
        </button>
      </div>
    </aside>
  )
}
