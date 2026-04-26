/**
 * Sidebar Component - Clean minimal design
 * Only active item has background color
 * Single accent color approach
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navGroups, adminNavItems, consultantNavItems, markFeatureVisited, shouldShowBadge, type NavItem } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { LogOut, Settings } from '@/components/ui/icons'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { profile, signOut } = useAuthStore()
  const [expandedGroups] = useState<string[]>(['overview', 'job-search', 'development', 'wellbeing', 'resources'])

  useEffect(() => {
    markFeatureVisited(location.pathname)
  }, [location.pathname])

  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin
  const isUser = activeRole === 'USER'

  const NavLinkComponent = ({
    to,
    icon: Icon,
    label,
    item,
    isActive,
    onClick,
  }: {
    to: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    item?: NavItem
    isActive?: boolean
    onClick?: () => void
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
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset',
          isActive
            ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm flex-1">{label}</span>
        {showBadge && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-600 text-white rounded">
            {t('common.new')}
          </span>
        )}
      </Link>
    )
  }

  const user = profile

  return (
    <aside className="h-full flex flex-col w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
      {/* Navigation - no duplicate logo here, it's in TopBar */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)
          if (!isGroupExpanded) return null

          return (
            <div key={group.id} className="mb-4">
              {/* Group label - hide for first group to avoid "ÖVERSIKT" / "Översikt" clash */}
              {group.id !== 'overview' && (
                <p className="px-3 mb-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  {t(group.labelKey)}
                </p>
              )}

              {/* Group items */}
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
            </div>
          )
        })}

        {/* Consultant Section */}
        {isConsultant && !isUser && (
          <div className="mb-4 pt-3 border-t border-stone-100 dark:border-stone-800">
            <p className="px-3 mb-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
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
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="mb-4 pt-3 border-t border-stone-100 dark:border-stone-800">
            <p className="px-3 mb-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
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
                  />
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-stone-100 dark:border-stone-800">
        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.first_name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
              {user?.first_name || user?.email}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="space-y-0.5">
          <NavLinkComponent
            to="/settings"
            icon={Settings}
            label={t('nav.settings')}
            isActive={location.pathname === '/settings'}
          />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
