/**
 * Professional Sidebar Component
 * Modern design with smooth animations and clean UX
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
      if (mobile) {
        setIsExpanded(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isConsultant = user?.role === 'CONSULTANT' || isAdmin

  const NavLink = ({ item, isActive }: { item: typeof navItems[0], isActive: boolean }) => {
    const Icon = item.icon

    return (
      <Link
        to={item.path}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'group relative flex items-center rounded-xl transition-all duration-200',
          isExpanded
            ? 'gap-3 px-3 py-2.5 mx-2'
            : 'justify-center mx-auto w-11 h-11',
          isActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/8'
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className={cn(
            'absolute left-0 bg-white rounded-full transition-all duration-200',
            isExpanded ? 'w-1 h-5 -ml-2' : 'w-1 h-6 -ml-3.5'
          )} />
        )}

        <Icon
          size={20}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        />

        {isExpanded && (
          <span className={cn(
            'text-sm transition-all duration-200',
            isActive ? 'font-semibold' : 'font-medium'
          )}>
            {item.label}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {!isExpanded && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
          </div>
        )}
      </Link>
    )
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    isExpanded ? (
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        {children}
      </div>
    ) : (
      <div className="mx-3 my-2 border-t border-white/10" />
    )
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 border-b border-white/10',
        isExpanded ? 'px-4 justify-between' : 'justify-center'
      )}>
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-3 group',
            !isExpanded && 'justify-center'
          )}
        >
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          {isExpanded && (
            <span className="text-white font-bold text-lg tracking-tight">Jobin</span>
          )}
        </Link>

        {isExpanded && !isMobile && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            aria-label="Minimera sidofält"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className={cn('py-4', isExpanded ? 'px-3' : 'px-2')}>
        <Link
          to="/profile"
          onClick={() => isMobile && setMobileOpen(false)}
          className={cn(
            'flex items-center rounded-xl transition-all duration-200 group',
            isExpanded
              ? 'gap-3 p-3 hover:bg-white/8'
              : 'justify-center w-11 h-11 mx-auto hover:bg-white/10'
          )}
        >
          <div className={cn(
            'rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20 transition-all duration-200 group-hover:ring-white/30',
            isExpanded ? 'w-10 h-10' : 'w-9 h-9'
          )}>
            <User size={isExpanded ? 18 : 16} className="text-white" />
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">
                {user?.firstName || 'Användare'}
              </p>
              <p className="text-white/50 text-xs truncate mt-0.5">
                {user?.role === 'SUPERADMIN' ? 'Superadmin' :
                 user?.role === 'ADMIN' ? 'Admin' :
                 user?.role === 'CONSULTANT' ? 'Konsulent' : 'Deltagare'}
              </p>
            </div>
          )}

          {/* Tooltip for collapsed user */}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
              {user?.firstName || 'Profil'}
              <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
          return <NavLink key={item.path} item={item} isActive={isActive} />
        })}

        {/* Consultant Section */}
        {isConsultant && !isAdmin && (
          <>
            <SectionLabel>Konsulent</SectionLabel>
            {consultantNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center rounded-xl transition-all duration-200',
                    isExpanded
                      ? 'gap-3 px-3 py-2.5 mx-2'
                      : 'justify-center mx-auto w-11 h-11',
                    isActive
                      ? 'bg-teal-400/20 text-teal-300'
                      : 'text-teal-300/60 hover:text-teal-300 hover:bg-teal-400/10'
                  )}
                >
                  {isActive && (
                    <div className={cn(
                      'absolute left-0 bg-teal-400 rounded-full transition-all duration-200',
                      isExpanded ? 'w-1 h-5 -ml-2' : 'w-1 h-6 -ml-3.5'
                    )} />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                  {isExpanded && (
                    <span className={cn('text-sm', isActive ? 'font-semibold' : 'font-medium')}>
                      {item.label}
                    </span>
                  )}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
                    </div>
                  )}
                </Link>
              )
            })}
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <SectionLabel>Administration</SectionLabel>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center rounded-xl transition-all duration-200',
                    isExpanded
                      ? 'gap-3 px-3 py-2.5 mx-2'
                      : 'justify-center mx-auto w-11 h-11',
                    isActive
                      ? 'bg-amber-400/20 text-amber-300'
                      : 'text-amber-300/60 hover:text-amber-300 hover:bg-amber-400/10'
                  )}
                >
                  {isActive && (
                    <div className={cn(
                      'absolute left-0 bg-amber-400 rounded-full transition-all duration-200',
                      isExpanded ? 'w-1 h-5 -ml-2' : 'w-1 h-6 -ml-3.5'
                    )} />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                  {isExpanded && (
                    <span className={cn('text-sm', isActive ? 'font-semibold' : 'font-medium')}>
                      {item.label}
                    </span>
                  )}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
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
        'border-t border-white/10 py-3 space-y-1',
        isExpanded ? 'px-3' : 'px-2'
      )}>
        <Link
          to="/settings"
          onClick={() => isMobile && setMobileOpen(false)}
          className={cn(
            'group relative flex items-center rounded-xl transition-all duration-200',
            isExpanded
              ? 'gap-3 px-3 py-2.5'
              : 'justify-center mx-auto w-11 h-11',
            location.pathname === '/settings'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/8'
          )}
        >
          <Settings size={20} strokeWidth={1.8} className="flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Inställningar</span>}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
              Inställningar
              <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
            </div>
          )}
        </Link>

        <button
          onClick={() => {
            signOut()
            isMobile && setMobileOpen(false)
          }}
          className={cn(
            'group relative flex items-center rounded-xl transition-all duration-200 w-full',
            isExpanded
              ? 'gap-3 px-3 py-2.5'
              : 'justify-center mx-auto w-11 h-11',
            'text-white/60 hover:text-red-300 hover:bg-red-500/15'
          )}
        >
          <LogOut size={20} strokeWidth={1.8} className="flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Logga ut</span>}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
              Logga ut
              <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle for Desktop (at bottom when collapsed) */}
      {!isExpanded && !isMobile && (
        <div className="px-2 pb-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-11 h-11 mx-auto flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            aria-label="Expandera sidofält"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ease-out z-40',
            'bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700',
            'shadow-xl shadow-indigo-900/20',
            isExpanded ? 'w-64' : 'w-[72px]'
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile */}
      {isMobile && (
        <>
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              'fixed top-4 left-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center lg:hidden transition-all duration-300',
              mobileOpen
                ? 'bg-white/20 text-white'
                : 'bg-white text-slate-700 shadow-lg shadow-black/10'
            )}
            aria-label={mobileOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Drawer */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 w-72 z-50 lg:hidden',
              'bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700',
              'shadow-2xl shadow-black/30',
              'transform transition-transform duration-300 ease-out',
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
