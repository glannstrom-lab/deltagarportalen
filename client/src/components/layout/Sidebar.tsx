import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navGroups, adminNavItems, consultantNavItems, markFeatureVisited, shouldShowBadge, type NavItem } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ChevronDown } from '@/components/ui/icons'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { profile, signOut } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['job-search', 'development', 'wellbeing', 'resources'])

  // Mark feature as visited when navigating
  useEffect(() => {
    markFeatureVisited(location.pathname)
  }, [location.pathname])

  // Använd activeRole för att avgöra vilken vy som visas
  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin
  const isUser = activeRole === 'USER'

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
      {children}
    </div>
  )

  const NavLinkComponent = ({
    to,
    icon: Icon,
    label,
    item,
    isActive,
    onClick,
    variant = 'default'
  }: {
    to: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    item?: NavItem
    isActive?: boolean
    onClick?: () => void
    variant?: 'default' | 'admin' | 'consultant' | 'danger'
  }) => {
    const showBadge = item && shouldShowBadge(item)

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
          <span className="text-sm font-medium truncate flex items-center gap-2">
            {label}
            {showBadge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-full">
                Ny!
              </span>
            )}
          </span>
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
          aria-label={isExpanded ? t('sidebar.minimize') : t('sidebar.expand')}
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

      {/* Navigation with Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Group Header */}
              {isExpanded && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
                >
                  <span>{t(group.labelKey)}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      !isGroupExpanded && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {/* Group Items */}
              {(isGroupExpanded || !isExpanded) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                    return (
                      <NavLinkComponent
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={t(item.labelKey)}
                        item={item}
                        isActive={isActive}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Consultant Section - visas om aktiv roll är CONSULTANT, ADMIN eller SUPERADMIN */}
        {isConsultant && !isUser && (
          <div className={cn('mt-2 pt-2 border-t border-white/10', isExpanded ? 'mx-0' : 'mx-0')}>
            {isExpanded && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 px-3">
                {t('sidebar.consultantSection')}
              </p>
            )}
            <div className="space-y-0.5">
              {consultantNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLinkComponent
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={t(item.labelKey)}
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
          <div className={cn('mt-2 pt-2 border-t border-white/10', isExpanded ? 'mx-0' : 'mx-0')}>
            {isExpanded && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 px-3">
                {t('sidebar.adminSection')}
              </p>
            )}
            <div className="space-y-0.5">
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLinkComponent
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={t(item.labelKey)}
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
            <p className="text-xs text-white/40 uppercase tracking-wider">{t('roles.activeRole')}</p>
            <p className="text-xs font-medium text-white">
              {activeRole === 'SUPERADMIN' ? t('roles.superadmin') :
               activeRole === 'ADMIN' ? t('roles.admin') :
               activeRole === 'CONSULTANT' ? t('roles.consultant') : t('roles.participant')}
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

        <NavLinkComponent
          to="/settings"
          icon={() => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          label={t('nav.settings')}
          isActive={location.pathname === '/settings'}
        />

        <button
          onClick={() => signOut()}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-200/50 hover:text-red-200 hover:bg-red-500/10 group relative',
            !isExpanded && 'justify-center px-2'
          )}
          aria-label={t('nav.logout')}
        >
          <svg className={cn('w-5 h-5 flex-shrink-0', !isExpanded && 'w-6 h-6')} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isExpanded ? (
            <span className="text-sm font-medium">{t('nav.logout')}</span>
          ) : (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity" role="tooltip">
              {t('nav.logout')}
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
