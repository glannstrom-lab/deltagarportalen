/**
 * Professional Sidebar Component
 * Compact design optimized for desktop - no scrolling needed
 */

import { Link, useLocation } from 'react-router-dom'
import { navItems, adminNavItems, consultantNavItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import {
  LogOut,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setIsExpanded(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isConsultant = user?.role === 'CONSULTANT' || isAdmin

  const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-lg pointer-events-none">
      {children}
      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
    </div>
  )

  const NavLink = ({ item, isActive, variant = 'default' }: {
    item: typeof navItems[0],
    isActive: boolean,
    variant?: 'default' | 'admin' | 'consultant'
  }) => {
    const Icon = item.icon
    const colors = {
      default: {
        active: 'bg-white/15 text-white',
        inactive: 'text-white/60 hover:text-white hover:bg-white/10'
      },
      admin: {
        active: 'bg-amber-500/20 text-amber-200',
        inactive: 'text-amber-200/50 hover:text-amber-200 hover:bg-amber-500/10'
      },
      consultant: {
        active: 'bg-teal-500/20 text-teal-200',
        inactive: 'text-teal-200/50 hover:text-teal-200 hover:bg-teal-500/10'
      }
    }

    return (
      <Link
        to={item.path}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'group relative flex items-center rounded-lg transition-all duration-150',
          isExpanded ? 'gap-2.5 px-2.5 py-1.5 mx-1.5' : 'justify-center mx-auto w-9 h-9',
          isActive ? colors[variant].active : colors[variant].inactive
        )}
      >
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
        {isExpanded && (
          <span className={cn('text-[13px]', isActive ? 'font-semibold' : 'font-medium')}>
            {item.label}
          </span>
        )}
        {!isExpanded && <Tooltip>{item.label}</Tooltip>}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header with Logo and User */}
      <div className={cn(
        'flex items-center h-14 border-b border-white/10 flex-shrink-0',
        isExpanded ? 'px-3 justify-between' : 'justify-center'
      )}>
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md transition-transform duration-150 group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          {isExpanded && (
            <span className="text-white font-bold text-base tracking-tight">Jobin</span>
          )}
        </Link>

        {isExpanded && !isMobile && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all"
            aria-label="Minimera"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* User Profile - Compact */}
      <Link
        to="/profile"
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'group relative flex items-center border-b border-white/10 transition-all flex-shrink-0',
          isExpanded
            ? 'gap-2.5 px-3 py-2.5 hover:bg-white/5'
            : 'justify-center py-2.5 hover:bg-white/10'
        )}
      >
        <div className={cn(
          'rounded-full bg-white/20 flex items-center justify-center flex-shrink-0',
          isExpanded ? 'w-8 h-8' : 'w-8 h-8'
        )}>
          <User size={14} className="text-white" />
        </div>
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-sm truncate leading-tight">
              {user?.firstName || 'Användare'}
            </p>
            <p className="text-white/40 text-[11px] truncate leading-tight">
              {user?.role === 'SUPERADMIN' ? 'Superadmin' :
               user?.role === 'ADMIN' ? 'Admin' :
               user?.role === 'CONSULTANT' ? 'Konsulent' : 'Deltagare'}
            </p>
          </div>
        )}
        {!isExpanded && <Tooltip>{user?.firstName || 'Profil'}</Tooltip>}
      </Link>

      {/* Main Navigation - Compact */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
          return <NavLink key={item.path} item={item} isActive={isActive} />
        })}

        {/* Consultant Section */}
        {isConsultant && !isAdmin && (
          <>
            <div className={cn('pt-2 mt-2 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-2')}>
              {isExpanded && (
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                  Konsulent
                </p>
              )}
            </div>
            {consultantNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return <NavLink key={item.path} item={item} isActive={isActive} variant="consultant" />
            })}
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className={cn('pt-2 mt-2 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-2')}>
              {isExpanded && (
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                  Admin
                </p>
              )}
            </div>
            {adminNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return <NavLink key={item.path} item={item} isActive={isActive} variant="admin" />
            })}
          </>
        )}
      </nav>

      {/* Bottom Actions - Compact */}
      <div className={cn(
        'border-t border-white/10 py-2 space-y-0.5 flex-shrink-0',
        isExpanded ? 'px-1.5' : 'px-0'
      )}>
        <Link
          to="/settings"
          onClick={() => isMobile && setMobileOpen(false)}
          className={cn(
            'group relative flex items-center rounded-lg transition-all duration-150',
            isExpanded ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center mx-auto w-9 h-9',
            location.pathname === '/settings'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <Settings size={18} strokeWidth={1.8} className="flex-shrink-0" />
          {isExpanded && <span className="text-[13px] font-medium">Inställningar</span>}
          {!isExpanded && <Tooltip>Inställningar</Tooltip>}
        </Link>

        <button
          onClick={() => {
            signOut()
            isMobile && setMobileOpen(false)
          }}
          className={cn(
            'group relative flex items-center rounded-lg transition-all duration-150 w-full',
            isExpanded ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center mx-auto w-9 h-9',
            'text-white/60 hover:text-red-300 hover:bg-red-500/15'
          )}
        >
          <LogOut size={18} strokeWidth={1.8} className="flex-shrink-0" />
          {isExpanded && <span className="text-[13px] font-medium">Logga ut</span>}
          {!isExpanded && <Tooltip>Logga ut</Tooltip>}
        </button>

        {/* Expand toggle at bottom when collapsed */}
        {!isExpanded && !isMobile && (
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative w-9 h-9 mx-auto flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all mt-1"
            aria-label="Expandera"
          >
            <ChevronRight size={16} />
            <Tooltip>Expandera</Tooltip>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'h-screen sticky top-0 flex-shrink-0 transition-all duration-200 ease-out z-40',
            'bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-lg',
            isExpanded ? 'w-52' : 'w-14'
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile */}
      {isMobile && (
        <>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              'fixed top-3 left-3 z-50 w-10 h-10 rounded-lg flex items-center justify-center lg:hidden transition-all',
              mobileOpen
                ? 'bg-white/20 text-white'
                : 'bg-white text-slate-700 shadow-md'
            )}
            aria-label={mobileOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <aside
            className={cn(
              'fixed inset-y-0 left-0 w-64 z-50 lg:hidden',
              'bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-xl',
              'transform transition-transform duration-200 ease-out',
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
