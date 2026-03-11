/**
 * Professional Compact Sidebar Component
 * Clean, minimal design with reduced spacing
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
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
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
  
  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isConsultant = user?.role === 'CONSULTANT' || isAdmin

  // Compact sidebar width: 64px, Expanded: 220px
  const sidebarWidth = isExpanded ? 'w-[220px]' : 'w-16'

  const NavLink = ({ item, isActive }: { item: typeof navItems[0], isActive: boolean }) => {
    const Icon = item.icon
    
    return (
      <Link
        to={item.path}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mx-2',
          isActive 
            ? 'bg-white/15 text-white shadow-sm' 
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        )}
        title={!isExpanded ? item.label : undefined}
      >
        <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
        {isExpanded && (
          <span className="font-medium text-sm truncate leading-none">{item.label}</span>
        )}
        
        {/* Tooltip for collapsed state */}
        {!isExpanded && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </div>
        )}
      </Link>
    )
  }

  const SidebarContent = () => (
    <>
      {/* Header - Compact */}
      <div className="flex items-center h-14 px-3 border-b border-white/10">
        {isExpanded ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Jobin</span>
            </Link>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Link to="/dashboard" className="flex justify-center w-full">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
            </Link>
            {!isMobile && (
              <button
                onClick={() => setIsExpanded(true)}
                className="absolute -right-3 w-6 h-6 bg-indigo-600 text-white rounded-full shadow-md flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* User - Compact */}
      <div className="px-2 py-2">
        <Link 
          to="/profile" 
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-white/10',
            isExpanded ? '' : 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/10">
            <User size={16} className="text-white" />
          </div>
          {isExpanded && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-white font-medium text-sm truncate leading-tight">
                {user?.firstName || 'Användare'}
              </p>
              <p className="text-white/40 text-xs truncate leading-tight">
                {user?.role === 'CONSULTANT' ? 'Konsulent' : 'Deltagare'}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation - Compact */}
      <nav className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          return <NavLink key={item.path} item={item} isActive={isActive} />
        })}
        
        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-4 pt-3 border-t border-white/10">
            {isExpanded && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Admin
              </div>
            )}
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mx-2',
                    isActive 
                      ? 'bg-amber-400/90 text-indigo-900' 
                      : 'text-amber-200/70 hover:bg-white/10 hover:text-white'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {isExpanded && (
                    <span className="font-medium text-sm truncate leading-none">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
        
        {/* Consultant Section */}
        {isConsultant && !isAdmin && (
          <div className="mt-4 pt-3 border-t border-white/10">
            {isExpanded && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Konsulent
              </div>
            )}
            {consultantNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mx-2',
                    isActive 
                      ? 'bg-teal-400/90 text-indigo-900' 
                      : 'text-teal-200/70 hover:bg-white/10 hover:text-white'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {isExpanded && (
                    <span className="font-medium text-sm truncate leading-none">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Bottom Actions - Compact */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <Link
          to="/settings"
          onClick={() => isMobile && setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all group relative',
            !isExpanded && 'justify-center'
          )}
          title={!isExpanded ? 'Inställningar' : undefined}
        >
          <Settings size={18} />
          {isExpanded && <span className="font-medium text-sm leading-none">Inställningar</span>}
          
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
              Inställningar
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </div>
          )}
        </Link>
        <button
          onClick={() => {
            signOut()
            isMobile && setMobileOpen(false)
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-red-500/20 hover:text-red-200 transition-all group relative',
            !isExpanded && 'justify-center'
          )}
          title={!isExpanded ? 'Logga ut' : undefined}
        >
          <LogOut size={18} />
          {isExpanded && <span className="font-medium text-sm leading-none">Logga ut</span>}
          
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
              Logga ut
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </div>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside 
          className={cn(
            'h-screen sticky top-0 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-50 bg-[#4f46e5]',
            sidebarWidth
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar - Drawer */}
      {isMobile && (
        <>
          {/* Mobile Toggle Button - Fixed */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="fixed top-4 left-4 z-50 w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center lg:hidden border border-slate-200"
          >
            {mobileOpen ? <X size={20} className="text-slate-700" /> : <Menu size={20} className="text-slate-700" />}
          </button>

          {/* Mobile Drawer */}
          <aside 
            className={cn(
              'fixed inset-y-0 left-0 w-[260px] flex flex-col z-50 bg-[#4f46e5] transform transition-transform duration-300 ease-in-out lg:hidden',
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}

export default Sidebar
