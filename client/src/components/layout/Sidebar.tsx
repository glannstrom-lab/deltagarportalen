/**
 * Modern Sidebar Component
 * Features: Glassmorphism, smooth animations, improved grouping, hover effects
 * Accessibility: Full keyboard navigation, ARIA labels, focus indicators
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navGroups, adminNavItems, consultantNavItems, markFeatureVisited, shouldShowBadge, type NavItem } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ChevronDown, LogOut, Settings, Sparkles } from '@/components/ui/icons'

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
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset',
          // Default variant - teal theme
          variant === 'default' && [
            isActive
              ? 'bg-gradient-to-r from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-900/30 text-teal-800 dark:text-teal-200 font-semibold shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-teal-50/80 dark:hover:bg-stone-800/80 hover:text-teal-700 dark:hover:text-teal-300',
            'focus-visible:ring-teal-500'
          ],
          // Admin variant - amber theme
          variant === 'admin' && [
            isActive
              ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 text-amber-800 dark:text-amber-200 font-semibold'
              : 'text-amber-700/70 dark:text-amber-400/70 hover:bg-amber-50 dark:hover:bg-stone-800/80 hover:text-amber-800 dark:hover:text-amber-300',
            'focus-visible:ring-amber-500'
          ],
          // Consultant variant - violet theme
          variant === 'consultant' && [
            isActive
              ? 'bg-gradient-to-r from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-900/20 text-violet-800 dark:text-violet-200 font-semibold'
              : 'text-violet-700/70 dark:text-violet-400/70 hover:bg-violet-50 dark:hover:bg-stone-800/80 hover:text-violet-800 dark:hover:text-violet-300',
            'focus-visible:ring-violet-500'
          ],
          // Danger variant
          variant === 'danger' && [
            'text-rose-600/70 dark:text-rose-400/70 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400',
            'focus-visible:ring-rose-500'
          ]
        )}
      >
        {/* Active indicator bar */}
        {isActive && variant === 'default' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-teal-500 to-teal-600 rounded-r-full" />
        )}

        {/* Icon with hover effect */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
          isActive && variant === 'default' && 'bg-teal-200/50 dark:bg-teal-800/50',
          isActive && variant === 'admin' && 'bg-amber-200/50 dark:bg-amber-800/50',
          isActive && variant === 'consultant' && 'bg-violet-200/50 dark:bg-violet-800/50',
          !isActive && 'group-hover:bg-stone-100 dark:group-hover:bg-stone-700/50'
        )}>
          <Icon className={cn(
            'w-[18px] h-[18px] transition-transform duration-200',
            'group-hover:scale-110'
          )} />
        </div>

        {/* Label */}
        <span className="text-sm truncate flex-1">{label}</span>

        {/* New badge */}
        {showBadge && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-full shadow-sm animate-pulse-soft">
            <Sparkles className="w-3 h-3" />
            {t('common.new')}
          </span>
        )}

        {/* Hover arrow indicator */}
        {!isActive && (
          <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
        )}
      </Link>
    )
  }

  const user = profile

  return (
    <aside
      className={cn(
        'h-full flex flex-col transition-all duration-300 w-64',
        'bg-gradient-to-b from-stone-50 via-white to-stone-50',
        'dark:from-stone-900 dark:via-stone-900 dark:to-stone-950',
        'border-r border-stone-200/60 dark:border-stone-800'
      )}
    >
      {/* Navigation with Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all duration-200',
                  'text-stone-500 dark:text-stone-500',
                  'hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-stone-800/50',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset'
                )}
                aria-expanded={isGroupExpanded}
              >
                <span>{t(group.labelKey)}</span>
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200',
                  isGroupExpanded ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-stone-100 dark:bg-stone-800'
                )}>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      isGroupExpanded ? 'text-teal-600 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500',
                      !isGroupExpanded && '-rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Group Items with animation */}
              <div className={cn(
                'overflow-hidden transition-all duration-300',
                isGroupExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              )}>
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
              </div>
            </div>
          )
        })}

        {/* Consultant Section */}
        {isConsultant && !isUser && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700/50">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-violet-600/70 dark:text-violet-400/70 uppercase tracking-wider mb-2 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
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
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700/50">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-2 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-700/50 bg-gradient-to-b from-transparent via-stone-50/50 to-stone-100/50 dark:from-transparent dark:via-stone-800/30 dark:to-stone-800/50">
        {/* Active role badge */}
        <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
          <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wider font-semibold">{t('roles.activeRole')}</p>
          <p className="text-sm font-bold text-teal-800 dark:text-teal-200">
            {activeRole === 'SUPERADMIN' ? t('roles.superadmin') :
             activeRole === 'ADMIN' ? t('roles.admin') :
             activeRole === 'CONSULTANT' ? t('roles.consultant') : t('roles.participant')}
          </p>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-teal-200/50 dark:shadow-none">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {user?.first_name?.[0] || user?.email?.[0] || '?'}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-stone-800 dark:text-stone-100 text-sm font-semibold truncate">
              {user?.first_name || user?.email}
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-xs truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-1">
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
              'text-rose-600/70 dark:text-rose-400/70',
              'hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-inset'
            )}
            aria-label={t('nav.logout')}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-900/20">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
