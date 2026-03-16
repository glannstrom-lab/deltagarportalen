import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { navItems, adminNavItems, consultantNavItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)

  // Använd activeRole för att avgöra vilken vy som visas
  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin
  const isUser = activeRole === 'USER'

  const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
      {children}
    </div>
  )

  const NavLink = ({ 
    to, 
    icon: Icon, 
    label, 
    isActive,
    onClick,
    variant = 'default'
  }: { 
    to: string
    icon: React.ComponentType<{ className?: string }>
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
      danger: isActive
        ? 'bg-red-500/20 text-red-200'
        : 'text-red-200/50 hover:text-red-200 hover:bg-red-500/10',
    }

    return (
      <Link
        to={to}
        onClick={() => {
          onClick?.()
          onClose?.()
        }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
          colors[variant],
          !isExpanded && 'justify-center px-2'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', !isExpanded && 'w-6 h-6')} />
        {isExpanded ? (
          <span className="text-sm font-medium truncate">{label}</span>
        ) : (
          <Tooltip>{label}</Tooltip>
        )}
      </Link>
    )
  }

  const user = profile

  return (
    <aside
      className={cn(
        'h-full bg-[#4c37d2] flex flex-col transition-all duration-300',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[#4c37d2] font-bold text-lg">J</span>
          </div>
          {isExpanded && (
            <span className="text-white font-semibold text-lg">Jobin</span>
          )}
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={isExpanded ? 'Minimera sidomenyn' : 'Expandera sidomenyn'}
          aria-expanded={isExpanded}
        >
          <svg
            className={cn('w-5 h-5 transition-transform', !isExpanded && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* User Section - visas alltid */}
        <div className={cn('space-y-0.5', !isExpanded && 'space-y-0.5')}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
              />
            )
          })}
        </div>

        {/* Consultant Section - visas om aktiv roll är CONSULTANT, ADMIN eller SUPERADMIN */}
        {isConsultant && !isUser && (
          <div className={cn('mt-1 pt-1 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-3')}>
            {isExpanded && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                Konsulent
              </p>
            )}
            <div className={cn(!isExpanded && 'space-y-0.5')}>
              {consultantNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
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

        {/* Admin Section - visas om aktiv roll är ADMIN eller SUPERADMIN */}
        {isAdmin && (
          <div className={cn('mt-1 pt-1 border-t border-white/10', isExpanded ? 'mx-3' : 'mx-3')}>
            {isExpanded && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 px-1">
                Admin
              </p>
            )}
            <div className={cn(!isExpanded && 'space-y-0.5')}>
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
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

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-white/10">
        {/* Visa aktiv roll */}
        {isExpanded && (
          <div className="mb-2 px-3 py-1.5 bg-white/5 rounded-lg">
            <p className="text-xs text-white/40 uppercase tracking-wider">Aktiv roll</p>
            <p className="text-xs font-medium text-white">
              {activeRole === 'SUPERADMIN' ? 'Superadmin' :
               activeRole === 'ADMIN' ? 'Admin' :
               activeRole === 'CONSULTANT' ? 'Konsulent' : 'Deltagare'}
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-medium">
                {user?.first_name?.[0] || user?.email?.[0] || '?'}
              </span>
            )}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.first_name || user?.email}
              </p>
              <p className="text-white/40 text-xs truncate leading-tight">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        <NavLink
          to="/settings"
          icon={() => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          label="Inställningar"
          isActive={location.pathname === '/settings'}
        />

        <button
          onClick={() => signOut()}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-200/50 hover:text-red-200 hover:bg-red-500/10 group relative',
            !isExpanded && 'justify-center px-2'
          )}
          aria-label="Logga ut"
        >
          <svg className={cn('w-5 h-5 flex-shrink-0', !isExpanded && 'w-6 h-6')} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isExpanded ? (
            <span className="text-sm font-medium">Logga ut</span>
          ) : (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity" role="tooltip">
              Logga ut
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
