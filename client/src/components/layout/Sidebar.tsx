/**
 * Improved Sidebar Component
 * Compact design with expand/collapse functionality
 */

import { Link, useLocation } from 'react-router-dom'
import { navItems, adminNavItems, consultantNavItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { 
  LogOut, 
  Settings, 
  User, 
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsExpanded(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Kontrollera användarens roll
  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isConsultant = user?.role === 'CONSULTANT' || isAdmin

  const sidebarWidth = isExpanded ? 'w-64' : 'w-16'

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <aside 
        className={cn(
          'h-screen sticky top-0 flex flex-col flex-shrink-0 transition-all duration-300 z-50',
          sidebarWidth,
          isMobile && !isExpanded && '-ml-16',
          isMobile && isExpanded && 'fixed left-0'
        )}
        style={{ backgroundColor: '#4f46e5' }}
      >
        {/* Logo / Toggle */}
        <div className={cn(
          'flex items-center py-4 px-3',
          isExpanded ? 'justify-between' : 'justify-center'
        )}>
          {isExpanded ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-white font-bold text-lg">Jobin</span>
              </Link>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Expandera menyn"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* User Profile */}
        <Link 
          to="/profile" 
          className={cn(
            'mx-3 mb-4 p-2 rounded-xl transition-colors',
            isExpanded ? 'flex items-center gap-3 hover:bg-white/10' : 'flex justify-center hover:bg-white/10'
          )}
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <User size={20} className="text-white" />
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.firstName || 'Användare'}
              </p>
              <p className="text-white/60 text-xs truncate">
                {user?.role === 'CONSULTANT' ? 'Arbetskonsulent' : 'Deltagare'}
              </p>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-2">
          {/* Standard navigation */}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsExpanded(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isExpanded && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                  </div>
                )}
              </Link>
            )
          })}
          
          {/* Admin-länkar */}
          {isAdmin && (
            <>
              <div className={cn(
                'my-2 border-t border-white/20',
                isExpanded ? 'mx-3' : 'mx-2'
              )} />
              <div className={cn(
                'text-xs font-medium text-white/40 mb-1',
                isExpanded ? 'px-3' : 'text-center'
              )}>
                {isExpanded ? 'Admin' : '•'}
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setIsExpanded(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive 
                        ? 'bg-amber-400 text-indigo-900 shadow-sm' 
                        : 'text-amber-300 hover:bg-white/10 hover:text-white'
                    )}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {isExpanded && (
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    )}
                    
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </Link>
                )
              })}
            </>
          )}
          
          {/* Konsulent-länkar */}
          {isConsultant && !isAdmin && (
            <>
              <div className={cn(
                'my-2 border-t border-white/20',
                isExpanded ? 'mx-3' : 'mx-2'
              )} />
              <div className={cn(
                'text-xs font-medium text-white/40 mb-1',
                isExpanded ? 'px-3' : 'text-center'
              )}>
                {isExpanded ? 'Konsulent' : '•'}
              </div>
              {consultantNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setIsExpanded(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive 
                        ? 'bg-teal-400 text-indigo-900 shadow-sm' 
                        : 'text-teal-300 hover:bg-white/10 hover:text-white'
                    )}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {isExpanded && (
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    )}
                    
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className={cn(
          'flex flex-col gap-1 p-2 mt-auto',
          !isExpanded && 'items-center'
        )}>
          <Link
            to="/settings"
            onClick={() => isMobile && setIsExpanded(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all group relative',
              !isExpanded && 'justify-center w-10 h-10 p-0'
            )}
            title={!isExpanded ? 'Inställningar' : undefined}
          >
            <Settings size={20} />
            {isExpanded && <span className="font-medium text-sm">Inställningar</span>}
            
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Inställningar
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            )}
          </Link>
          <button
            onClick={() => {
              signOut()
              isMobile && setIsExpanded(false)
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all group relative',
              !isExpanded && 'justify-center w-10 h-10 p-0'
            )}
            title={!isExpanded ? 'Logga ut' : undefined}
          >
            <LogOut size={20} />
            {isExpanded && <span className="font-medium text-sm">Logga ut</span>}
            
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Logga ut
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button - Fixed at bottom */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center lg:hidden"
        >
          {isExpanded ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      )}
    </>
  )
}

export default Sidebar
