/**
 * Sidebar Component - Clean Pastel Design
 * White background, subtle borders, soft pastel hover states
 * No gradients, minimal visual clutter
 */

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
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset',
          // Default variant
          variant === 'default' && [
            isActive
              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200'
          ],
          // Admin variant
          variant === 'admin' && [
            isActive
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 hover:text-amber-700 dark:hover:text-amber-400'
          ],
          // Consultant variant
          variant === 'consultant' && [
            isActive
              ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-violet-50 dark:hover:bg-stone-800 hover:text-violet-700 dark:hover:text-violet-400'
          ],
          // Danger variant
          variant === 'danger' && 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
        )}
      >
        {/* Active indicator */}
        {isActive && variant === 'default' && (
          <div className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full" />
        )}

        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span className="text-sm truncate flex-1">{label}</span>

        {/* New badge */}
        {showBadge && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 rounded">
            Ny
          </span>
        )}
      </Link>
    )
  }

  const user = profile

  return (
    <aside className="h-full flex flex-col w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-lg transition-colors',
                  'text-stone-400 dark:text-stone-500',
                  'hover:text-stone-600 dark:hover:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset'
                )}
                aria-expanded={isGroupExpanded}
              >
                <span>{t(group.labelKey)}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    !isGroupExpanded && '-rotate-90'
                  )}
                />
              </button>

              {/* Group Items */}
              {isGroupExpanded && (
                <div className="space-y-0.5 pl-1">
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
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="px-3 py-2 text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              {t('sidebar.consultantSection')}
            </p>
            <div className="space-y-0.5 pl-1">
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
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('sidebar.adminSection')}
            </p>
            <div className="space-y-0.5 pl-1">
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

      {/* User Profile & Actions */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-700">
        {/* Active role */}
        <div className="mb-3 px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
          <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">Aktiv roll</p>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {activeRole === 'SUPERADMIN' ? t('roles.superadmin') :
             activeRole === 'ADMIN' ? t('roles.admin') :
             activeRole === 'CONSULTANT' ? t('roles.consultant') : t('roles.participant')}
          </p>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 mb-3 px-2 py-2">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-700 dark:text-teal-400 text-sm font-medium">
                {user?.first_name?.[0] || user?.email?.[0] || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
              {user?.first_name || user?.email}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-0.5">
          <NavLinkComponent
            to="/settings"
            icon={Settings}
            label={t('nav.settings')}
            isActive={location.pathname === '/settings'}
          />

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
