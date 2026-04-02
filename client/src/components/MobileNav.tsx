import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navGroups, markFeatureVisited, shouldShowBadge } from './layout/navigation'
import {
  User,
  Menu,
  X,
  Settings,
} from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'

/**
 * MobileMenuButton - Knapp för att öppna menyn
 * Används i Layout.MobileTopBar
 * WCAG 2.2: Minimum touch target 44x44px
 */
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="Öppna meny"
    >
      <Menu className="w-6 h-6 text-slate-700" />
    </button>
  )
}

/**
 * MobileProfileButton - Knapp för att öppna profil-menyn
 * Används i Layout.MobileTopBar
 * WCAG 2.2: Minimum touch target 44x44px
 */
export function MobileProfileButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="Öppna profil"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
    </button>
  )
}

/**
 * SideMenu - Sidomeny som glider in från höger
 * Uses grouped navigation for better organization
 */
export function SideMenu({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const location = useLocation()
  const { t } = useTranslation()

  // Mark feature as visited when navigating
  useEffect(() => {
    if (isOpen) {
      markFeatureVisited(location.pathname)
    }
  }, [location.pathname, isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 bg-white z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[300px] max-w-[85vw]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigeringsmeny"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Meny</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Stäng meny"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.id} className="mb-4">
              {/* Group Label */}
              <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t(group.labelKey)}
              </h3>

              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const showBadge = shouldShowBadge(item)
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px]',
                        isActive
                          ? 'bg-violet-100 text-violet-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {showBadge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-full">
                          Ny!
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Settings */}
          <div className="border-t border-slate-200 pt-3 mt-2">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px]',
                isActive
                  ? 'bg-violet-100 text-violet-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
              )}
            >
              <Settings className="w-5 h-5" />
              <span>{t('nav.settings')}</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </>
  )
}

// Legacy exports for backward compatibility
export function MobileNav() {
  return null
}

export function MobileNavSimplified() {
  return null
}
