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

// Sidebar widths
const EXPANDED_WIDTH = 'w-52'
const COLLAPSED_WIDTH = 'w-16'

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
    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-lg pointer-events-none">
      {children}
      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
    </div>
  )

  const NavItem = ({
    to,
    icon: Icon,
    label,
    isActive,
    onClick,
    variant = 'default'
  }: {
    to?: string
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
    label: string
    isActive?: boolean
    onClick?: () => void
    variant?: 'default' | 'admin' | 'consultant' | 'danger'
  }) => {
    const colors = {
      default: isActive
        ? 'bg-white/15 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/10',
      admin: isActive
        ? 'bg-amber-500/20 text-amber-200'
        : 'text-amber-200/50 hover:text-amber-200 hover:bg-amber-500/10',
      consultant: isActive
        ? 'bg-teal-500/20 text-teal-200'
        : 'text-teal-200/50 hover:text-teal-200 hover:bg-teal-500/10',
      danger: 'text-white/60 hover:text-red-300 hover:bg-red-500/15'
    }

    const baseClasses = cn(
      'group relative flex items-center rounded-lg transition-all duration-150',
      colors[variant]
    )

    const expandedClasses = 'gap-2.5 px-3 py-2 mx-2'
    const collapsedClasses = 'w-10 h-10 mx-auto justify-center'

    const content = (
      <>
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
        {isExpanded && (
          <span className={cn('text-[13px]', isActive ? 'font-semibold' : 'font-medium')}>
            {label}
          </span>
        )}
        {!isExpanded && <Tooltip>{label}</Tooltip>}
      </>
    )

    if (to) {
      return (
        <Link
          to={to}
          onClick={() => { onClick?.(); isMobile && setMobileOpen(false) }}
          className={cn(baseClasses, isExpanded ? expandedClasses : collapsedClasses)}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        onClick={() => { onClick?.(); isMobile && setMobileOpen(false) }}
        className={cn(baseClasses, isExpanded ? expandedClasses : collapsedClasses)}
      >
        {content}
      </button>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed height */}
      <div className={cn(
        'flex items-center h-14 border-b border-white/10 shrink-0',
        isExpanded ? 'px-3 justify-between' : 'px-3 justify-center'
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

      {/* User Profile - Fixed height */}
      <Link
        to="/profile"
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'group relative flex items-center border-b border-white/10 transition-all shrink-0',
          isExpanded
            ? 'gap-2.5 px-3 py-2.5 hover:bg-white/5'
            : 'py-3 justify-center hover:bg-white/10'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
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

      {/* Main Navigation - Scrollable area */}
      <nav className="flex-1 min-h-0 py-2 overflow-y-auto">
        <div className={cn(!isExpanded && 'space-y-1')}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
            return (
              <NavItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
              />
            )
          })}
        </div>

        {/* Consultant Section */}
        {isConsultant && !isAdmin && (
          <div className={cn('mt-2 pt-2 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-3')}>
            {isExpanded && (
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                Konsulent
              </p>
            )}
            <div className={cn(!isExpanded && 'space-y-1')}>
              {consultantNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    variant="consultant"
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className={cn('mt-2 pt-2 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-3')}>
            {isExpanded && (
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                Admin
              </p>
            )}
            <div className={cn(!isExpanded && 'space-y-1')}>
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    variant="admin"
                  />
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Actions - Fixed at bottom */}
      <div className={cn(
        'border-t border-white/10 py-2 shrink-0 mt-auto',
        !isExpanded && 'space-y-1'
      )}>
        <NavItem
          to="/settings"
          icon={Settings}
          label="Inställningar"
          isActive={location.pathname === '/settings'}
        />

        <NavItem
          icon={LogOut}
          label="Logga ut"
          onClick={signOut}
          variant="danger"
        />

        {/* Expand toggle when collapsed */}
        {!isExpanded && !isMobile && (
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150 mt-1 text-white/40 hover:text-white hover:bg-white/10"
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
            'h-screen sticky top-0 shrink-0 transition-all duration-200 ease-out z-40',
            'bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-lg',
            isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
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
              'fixed inset-y-0 left-0 z-50 lg:hidden',
              'bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-xl',
              'transform transition-transform duration-200 ease-out',
              EXPANDED_WIDTH,
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
