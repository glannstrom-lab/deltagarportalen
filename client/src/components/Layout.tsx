import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Menu, X, User, Settings, LogOut, ChevronDown, HelpCircle
} from '@/components/ui/icons'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { BottomBar } from './layout/BottomBar'
import { MobileBackButton } from './MobileBackButton'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { SkipLinks } from './SkipLinks'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from './notifications/NotificationBell'
import { OptimizedImage } from './ui/OptimizedImage'
import { navGroups, adminNavItems, consultantNavItems, shouldShowBadge } from './layout/navigation'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()

  // Sidebar collapsed state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored === 'true'
  })

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
      return newValue
    })
  }

  // Visa TopBar och BottomBar på alla sidor förutom login/register
  const showBars = !['/login', '/register'].includes(location.pathname)

  // Bestäm om vi ska visa tillbaka-knapp (alla sidor utom startsidan)
  const showBackButton = isMobile && location.pathname !== '/'

  return (
    <>
      <SkipLinks />
      <div
        className={cn(
          'min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900',
          isMobile ? 'pb-safe' : ''
        )}
      >
        {/* TopBar - full width at top (desktop only) */}
        {showBars && !isMobile && <TopBar />}

        {/* Mobil TopBar med meny och profil */}
        {showBars && isMobile && <MobileTopBar />}

        {/* Main area with sidebar and content */}
        <div className="flex-1 flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block relative">
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
            />
          </div>

          {/* Huvudinnehåll */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main content */}
            <main
              id="main-content"
              className={cn(
                'flex-1 overflow-auto',
                isMobile ? 'p-4' : 'p-6'
              )}
              tabIndex={-1}
            >
              <div className={cn(
                'mx-auto',
                isMobile ? 'max-w-full' : 'max-w-7xl'
              )}>
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        {/* Tillbaka-knapp på mobil (alla sidor utom dashboard) */}
        {showBackButton && <MobileBackButton />}

        {/* FAQ BottomBar - always visible like TopBar */}
        {showBars && <BottomBar />}

        {/* Övriga komponenter */}
        <BreakReminder workDuration={15} />
        <ToastContainer />
      </div>
    </>
  )
}

// Mobil topbar med meny-knapp och profil
function MobileTopBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700/50 px-3 py-2 safe-top">
        <div className="flex items-center justify-between">
          {/* Vänster: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <OptimizedImage
              src="/logo-jobin-new.png"
              alt="Jobin"
              loading="eager"
              className="h-6 w-auto object-contain"
            />
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">jobin.se</span>
          </Link>

          {/* Höger: Notifikationer + Profil + Meny */}
          <div className="flex items-center gap-0.5">
            <NotificationBell variant="compact" />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={t('nav.profile')}
            >
              <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </div>
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={t('sidebar.menu')}
            >
              <Menu className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Meny overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidomeny (höger) - Huvudnavigation synkad med Desktop Sidebar */}
      <MobileMainMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Profil overlay */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Profil-meny (vänster) */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 bg-white dark:bg-stone-900 z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[260px] max-w-[80vw]',
          isProfileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Profil header */}
        <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700/50 safe-top">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">{t('nav.profile')}</h2>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        {/* Profil-info */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{user?.email || t('roles.user')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('roles.participant')}</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            <Link
              to="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              <User className="w-4 h-4 text-stone-400" />
              {t('topbar.profile')}
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              <Settings className="w-4 h-4 text-stone-400" />
              {t('nav.settings')}
            </Link>
          </nav>
        </div>

        {/* Logga ut */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-200 dark:border-stone-700/50 safe-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * MobileMainMenu - Fullständig navigation med alla sidor grupperade
 * Synkad med Desktop Sidebar via navGroups
 */
function MobileMainMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['overview', 'job-search'])

  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant = activeRole === 'CONSULTANT' || isAdmin

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 bg-white dark:bg-stone-900 z-50 shadow-xl',
        'transform transition-transform duration-300 ease-out',
        'w-[280px] max-w-[85vw] flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('sidebar.menu')}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700/50 safe-top shrink-0">
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">{t('sidebar.menu')}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.id)

          return (
            <div key={group.id} className="mb-1">
              {/* Group Header - Expandable */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-expanded={isGroupExpanded}
              >
                <span>{t(group.labelKey)}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform',
                    !isGroupExpanded && '-rotate-90'
                  )}
                />
              </button>

              {/* Group Items */}
              {isGroupExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                    const showBadge = shouldShowBadge(item)

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                          isActive
                            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {showBadge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full">
                            {t('common.new')}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Consultant Section */}
        {isConsultant && (
          <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700/50">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              {t('sidebar.consultantSection')}
            </p>
            <div className="space-y-0.5">
              {consultantNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                      isActive
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700/50">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('sidebar.adminSection')}
            </p>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Settings, Help, Logout */}
      <div className="shrink-0 p-2 border-t border-stone-200 dark:border-stone-700/50 safe-bottom space-y-0.5">
        <Link
          to="/settings"
          onClick={onClose}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
            location.pathname === '/settings'
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>{t('nav.settings')}</span>
        </Link>
        <Link
          to="/help"
          onClick={onClose}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm',
            location.pathname === '/help'
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('nav.help', 'Hjälp')}</span>
        </Link>
        <button
          onClick={() => {
            onClose()
            signOut()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  )
}
