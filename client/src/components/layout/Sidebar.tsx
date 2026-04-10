import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navGroups, adminNavItems, consultantNavItems, markFeatureVisited, shouldShowBadge, type NavItem } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ChevronDown, LogOut, Settings } from '@/components/ui/icons'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { profile, signOut } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['overview', 'job-search', 'development', 'wellbeing', 'resources'])

  useEffect(() => {
    markFeatureVisited(location.pathname)
  }, [location.pathname])

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
    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
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

    return (
      <Link
        to={to}
        onClick={() => {
          onClick?.()
          onClose?.()
        }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
          // Default variant - pastel teal
          variant === 'default' && (isActive
            ? 'bg-teal-100 text-teal-800 font-medium shadow-sm'
            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'),
          // Admin variant - warm amber
          variant === 'admin' && (isActive
            ? 'bg-amber-100 text-amber-800 font-medium'
            : 'text-amber-700/70 hover:bg-amber-50 hover:text-amber-800'),
          // Consultant variant - soft violet
          variant === 'consultant' && (isActive
            ? 'bg-violet-100 text-violet-800 font-medium'
            : 'text-violet-700/70 hover:bg-violet-50 hover:text-violet-800'),
          // Danger variant
          variant === 'danger' && 'text-rose-600/70 hover:bg-rose-50 hover:text-rose-700',
          !isExpanded && 'justify-center px-2'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', !isExpanded && 'w-5 h-5')} />
        {isExpanded ? (
          <span className="text-sm truncate flex items-center gap-2">
            {label}
            {showBadge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-500 text-white rounded-full">
                Ny
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
        'h-full flex flex-col transition-all duration-300',
        'bg-gradient-to-b from-teal-50 via-white to-stone-50',
        'border-r border-teal-100',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-teal-100/50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-200">
            <span className="text-white font-bold text-lg">J</span>
          </div>
          {isExpanded && (
            <span className="text-gray-800 font-semibold text-lg tracking-tight">Jobin</span>
          )}
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-teal-50 transition-colors"
          aria-label={isExpanded ? t('sidebar.minimize') : t('sidebar.expand')}
          aria-expanded={isExpanded}
        >
          <svg
            className={cn('w-4 h-4 transition-transform', !isExpanded && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
        </button>
      </div>

      {/* Navigation with Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Group Header */}
              {isExpanded && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-teal-700/70 uppercase tracking-wider hover:text-teal-800 transition-colors rounded-lg hover:bg-teal-50/50"
                >
                  <span>{t(group.labelKey)}</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform text-teal-500',
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

        {/* Consultant Section */}
        {isConsultant && !isUser && (
          <div className={cn('mt-3 pt-3 border-t border-teal-100', isExpanded ? 'mx-0' : 'mx-0')}>
            {isExpanded && (
              <p className="text-[11px] font-semibold text-violet-600/70 uppercase tracking-wider mb-1.5 px-3">
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

        {/* Admin Section */}
        {isAdmin && (
          <div className={cn('mt-3 pt-3 border-t border-teal-100', isExpanded ? 'mx-0' : 'mx-0')}>
            {isExpanded && (
              <p className="text-[11px] font-semibold text-amber-600/70 uppercase tracking-wider mb-1.5 px-3">
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
      <div className="p-3 border-t border-teal-100 bg-gradient-to-b from-transparent to-teal-50/50">
        {/* Show active role */}
        {isExpanded && (
          <div className="mb-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
            <p className="text-[10px] text-teal-600 uppercase tracking-wider font-medium">{t('roles.activeRole')}</p>
            <p className="text-xs font-semibold text-teal-800">
              {activeRole === 'SUPERADMIN' ? t('roles.superadmin') :
               activeRole === 'ADMIN' ? t('roles.admin') :
               activeRole === 'CONSULTANT' ? t('roles.consultant') : t('roles.participant')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md shadow-teal-200">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">
                {user?.first_name?.[0] || user?.email?.[0] || '?'}
              </span>
            )}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm font-medium truncate">
                {user?.first_name || user?.email}
              </p>
              <p className="text-gray-500 text-xs truncate leading-tight">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <NavLinkComponent
            to="/settings"
            icon={Settings}
            label={t('nav.settings')}
            isActive={location.pathname === '/settings'}
          />

          <button
            onClick={() => signOut()}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-rose-600/70 hover:bg-rose-50 hover:text-rose-700 group relative',
              !isExpanded && 'justify-center px-2'
            )}
            aria-label={t('nav.logout')}
          >
            <LogOut className={cn('w-5 h-5 flex-shrink-0', !isExpanded && 'w-5 h-5')} />
            {isExpanded ? (
              <span className="text-sm">{t('nav.logout')}</span>
            ) : (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                {t('nav.logout')}
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
