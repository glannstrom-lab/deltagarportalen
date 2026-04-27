/**
 * Sidebar Component - Compact Design (Vercel/Supabase style)
 * Minimal padding, flat groups, subtle interactions
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navGroups, adminNavItems, consultantNavItems, markFeatureVisited, shouldShowBadge, type NavItem } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, LogOut, Settings } from '@/components/ui/icons'

interface SidebarProps {
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { profile, signOut } = useAuthStore()

  useEffect(() => {
    markFeatureVisited(location.pathname)
  }, [location.pathname])

  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin
  const isUser = activeRole === 'USER'

  const NavLink = ({
    to,
    icon: Icon,
    label,
    item,
    isActive,
    variant = 'default'
  }: {
    to: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    item?: NavItem
    isActive?: boolean
    variant?: 'default' | 'admin'
  }) => {
    const showBadge = item && shouldShowBadge(item)

    return (
      <Link
        to={to}
        onClick={onClose}
        title={isCollapsed ? label : undefined}
        className={cn(
          'group flex items-center gap-2.5 rounded-md transition-colors relative border-l-2 border-transparent',
          isCollapsed ? 'p-2 justify-center' : 'px-2 py-1.5',
          // Default variant — använder --c-* från group-wrapper (data-domain)
          variant === 'default' && [
            isActive
              ? 'bg-[var(--c-bg)] text-[var(--c-text)] border-l-[var(--c-solid)] font-semibold'
              : 'text-stone-600 dark:text-stone-400 hover:bg-[var(--c-bg)]/40 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)]'
          ],
          // Admin variant — semantisk status-färg, inte domän
          variant === 'admin' && [
            isActive
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-l-amber-500'
              : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50/50 dark:hover:bg-stone-800/50 hover:text-amber-700 dark:hover:text-amber-400'
          ]
        )}
      >
        <Icon className={cn(
          'shrink-0 transition-colors',
          isCollapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4',
          isActive ? 'text-current' : 'text-stone-400 dark:text-stone-500 group-hover:text-current'
        )} />

        {!isCollapsed && (
          <span className="text-[13px] truncate flex-1">{label}</span>
        )}

        {/* Badge — använder aktiva domänens färg */}
        {showBadge && !isCollapsed && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--c-bg)] text-[var(--c-text)] rounded">
            Ny
          </span>
        )}
        {showBadge && isCollapsed && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]" />
        )}
      </Link>
    )
  }

  const user = profile

  return (
    <aside className={cn(
      'h-full flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-200',
      isCollapsed ? 'w-[52px]' : 'w-[220px]'
    )}>
      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-16 z-10 w-6 h-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          aria-label={isCollapsed ? t('sidebar.expand', 'Expandera') : t('sidebar.collapse', 'Minimera')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-stone-500" />
          )}
        </button>
      )}

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto py-3',
        isCollapsed ? 'px-1.5' : 'px-2'
      )}>
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            data-domain={group.domain}
            className={cn(groupIndex > 0 && 'mt-4')}
          >
            {/* Group Label med färgpunkt — Only show expanded */}
            {!isCollapsed && (
              <div className="px-2 mb-1.5 flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  {t(group.labelKey, group.fallbackLabel)}
                </span>
              </div>
            )}

            {/* Collapsed separator */}
            {isCollapsed && groupIndex > 0 && (
              <div className="mx-2 mb-2 border-t border-stone-100 dark:border-stone-800" />
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
                return (
                  <NavLink
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
        ))}

        {/* Consultant Section — använder Reflection-domän (lila) */}
        {isConsultant && !isUser && (
          <div
            data-domain="reflection"
            className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800"
          >
            {!isCollapsed && (
              <div className="px-2 mb-1 flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-[var(--c-text)] uppercase tracking-wide">
                  {t('sidebar.consultantSection')}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {consultantNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
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
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
            {!isCollapsed && (
              <div className="px-2 mb-1">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {t('sidebar.adminSection')}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
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

      {/* Footer - User & Actions */}
      <div className={cn(
        'border-t border-stone-100 dark:border-stone-800',
        isCollapsed ? 'p-1.5' : 'p-2'
      )}>
        {/* User */}
        <Link
          to="/profile"
          onClick={onClose}
          className={cn(
            'flex items-center rounded-md transition-colors mb-1',
            isCollapsed ? 'p-2 justify-center' : 'gap-2.5 px-2 py-1.5',
            location.pathname === '/profile'
              ? 'bg-stone-100 dark:bg-stone-800'
              : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
          )}
          title={isCollapsed ? user?.first_name || user?.email : undefined}
        >
          <div className={cn(
            'rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium',
            isCollapsed ? 'w-7 h-7 text-xs' : 'w-6 h-6 text-[11px]'
          )}>
            {user?.first_name?.[0] || user?.email?.[0] || '?'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 truncate">
                {user?.first_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                {activeRole === 'SUPERADMIN' ? 'Superadmin' :
                 activeRole === 'ADMIN' ? 'Admin' :
                 activeRole === 'CONSULTANT' ? 'Konsulent' : 'Deltagare'}
              </p>
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="space-y-0.5">
          <NavLink
            to="/settings"
            icon={Settings}
            label={t('nav.settings')}
            isActive={location.pathname === '/settings'}
          />

          <button
            onClick={() => signOut()}
            title={isCollapsed ? t('nav.logout') : undefined}
            className={cn(
              'w-full flex items-center rounded-md text-stone-500 dark:text-stone-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors',
              isCollapsed ? 'p-2 justify-center' : 'gap-2.5 px-2 py-1.5'
            )}
            aria-label={t('nav.logout')}
          >
            <LogOut className={cn(isCollapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4')} />
            {!isCollapsed && <span className="text-[13px]">{t('nav.logout')}</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
