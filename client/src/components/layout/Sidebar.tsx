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
            ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-medium shadow-sm dark:shadow-none'
            : 'text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-stone-700 hover:text-teal-700 dark:hover:text-teal-400'),
          // Admin variant - warm amber
          variant === 'admin' && (isActive
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium'
            : 'text-amber-700/70 dark:text-amber-500/70 hover:bg-amber-50 dark:hover:bg-stone-700 hover:text-amber-800 dark:hover:text-amber-400'),
          // Consultant variant - soft violet
          variant === 'consultant' && (isActive
            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 font-medium'
            : 'text-violet-700/70 dark:text-violet-500/70 hover:bg-violet-50 dark:hover:bg-stone-700 hover:text-violet-800 dark:hover:text-violet-400'),
          // Danger variant
          variant === 'danger' && 'text-rose-600/70 dark:text-rose-400/70 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400'
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0 transition-colors" />
        <span className="text-sm truncate flex items-center gap-2">
          {label}
          {showBadge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-500 text-white rounded-full">
              Ny
            </span>
          )}
        </span>
      </Link>
    )
  }

  const user = profile

  return (
    <aside
      className={cn(
        'h-full flex flex-col transition-all duration-300 w-64',
        'bg-gradient-to-b from-teal-50 via-white to-stone-50',
        'dark:from-stone-900 dark:via-stone-900 dark:to-stone-950',
        'border-r border-teal-100 dark:border-stone-700'
      )}
    >
      {/* Navigation with Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-teal-700/70 dark:text-teal-400/70 uppercase tracking-wider hover:text-teal-800 dark:hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-50/50 dark:hover:bg-stone-700/50"
              >
                <span>{t(group.labelKey)}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform text-teal-500 dark:text-teal-400',
                    !isGroupExpanded && '-rotate-90'
                  )}
                />
              </button>

              {/* Group Items */}
              {isGroupExpanded && (
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
          <div className="mt-3 pt-3 border-t border-teal-100 dark:border-stone-700">
            <p className="text-[11px] font-semibold text-violet-600/70 dark:text-violet-400/70 uppercase tracking-wider mb-1.5 px-3">
              {t('sidebar.consultantSection')}
            </p>
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
          <div className="mt-3 pt-3 border-t border-teal-100 dark:border-stone-700">
            <p className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-1.5 px-3">
              {t('sidebar.adminSection')}
            </p>
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
      <div className="p-3 border-t border-teal-100 dark:border-stone-700 bg-gradient-to-b from-transparent to-teal-50/50 dark:to-stone-800/50">
        {/* Show active role */}
        <div className="mb-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800/30">
          <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wider font-medium">{t('roles.activeRole')}</p>
          <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
            {activeRole === 'SUPERADMIN' ? t('roles.superadmin') :
             activeRole === 'ADMIN' ? t('roles.admin') :
             activeRole === 'CONSULTANT' ? t('roles.consultant') : t('roles.participant')}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 dark:from-teal-600 dark:to-teal-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md shadow-teal-200 dark:shadow-none">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">
                {user?.first_name?.[0] || user?.email?.[0] || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 dark:text-gray-100 text-sm font-medium truncate">
              {user?.first_name || user?.email}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate leading-tight">
              {user?.email}
            </p>
          </div>
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-rose-600/70 dark:text-rose-400/70 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400"
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
