import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Menu, X, User, Settings, LogOut,
  LayoutDashboard, FileText, Mail, Briefcase, Target,
  Compass, Dumbbell, Heart, BookOpen, Bookmark
} from '@/components/ui/icons'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { MobileBackButton } from './MobileBackButton'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { SkipLinks } from './SkipLinks'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from './notifications/NotificationBell'
import { OptimizedImage } from './ui/OptimizedImage'

// Mobila navigeringsitems - synkade med Sidebar navigation.ts
const mobileNavItems = [
  { to: '/', label: 'Översikt', icon: LayoutDashboard },
  { to: '/cv', label: 'CV', icon: FileText },
  { to: '/cover-letter', label: 'Personligt brev', icon: Mail },
  { to: '/job-search', label: 'Sök jobb', icon: Briefcase },
  { to: '/career', label: 'Karriär', icon: Target },
  { to: '/interest-guide', label: 'Intresseguide', icon: Compass },
  { to: '/exercises', label: 'Övningar', icon: Dumbbell },
  { to: '/diary', label: 'Hälsa', icon: Heart },
  { to: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
  { to: '/resources', label: 'Resurser', icon: Bookmark },
]

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()

  // Visa TopBar och BottomBar på alla sidor förutom login/register
  const showBars = !['/login', '/register'].includes(location.pathname)

  // Bestäm om vi ska visa tillbaka-knapp (alla sidor utom startsidan)
  const showBackButton = isMobile && location.pathname !== '/'

  return (
    <>
      <SkipLinks />
      <div
        className={cn(
          'min-h-screen flex flex-col bg-gradient-to-b from-stone-50 via-white to-stone-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800',
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
          <div className="hidden lg:block">
            <Sidebar />
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

        {/* Övriga komponenter */}
        <BreakReminder workDuration={15} />
        <ToastContainer />
      </div>
    </>
  )
}

// Mobil topbar med meny-knapp och profil
function MobileTopBar() {
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
      <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-50 via-white to-stone-50 dark:from-teal-900/30 dark:via-stone-900 dark:to-stone-800 border-b border-teal-100 dark:border-stone-700 px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          {/* Vänster: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <OptimizedImage
              src="/logo-jobin-new.png"
              alt="Jobin"
              loading="eager"
              className="h-8 w-auto object-contain"
            />
            <span className="text-base font-semibold text-teal-700 dark:text-teal-300">jobin.se</span>
          </Link>

          {/* Höger: Notifikationer + Profil + Meny */}
          <div className="flex items-center gap-1">
            <NotificationBell variant="compact" />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-teal-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="Profil"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-sky-500 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-teal-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="Meny"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-stone-300" />
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
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 bg-white dark:bg-stone-900 z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[280px] max-w-[80vw]',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Meny header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-stone-700 safe-top">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Meny</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-stone-400" />
          </button>
        </div>

        {/* Meny-länkar - synkade med Desktop Sidebar */}
        <nav className="p-2 space-y-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-medium'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer i meny - Inställningar synkad med Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-stone-700 safe-bottom space-y-1">
          <Link
            to="/settings"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
              location.pathname === '/settings'
                ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-medium'
                : 'text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700'
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Inställningar</span>
          </Link>
        </div>
      </div>

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
          'w-[280px] max-w-[80vw]',
          isProfileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Profil header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-stone-700 safe-top">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Profil</h2>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-stone-400" />
          </button>
        </div>

        {/* Profil-info */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-sky-500 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-stone-100">{user?.email || 'Användare'}</p>
              <p className="text-sm text-slate-700 dark:text-stone-400">Deltagare</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
            >
              Min profil
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
            >
              Inställningar
            </Link>
          </nav>
        </div>

        {/* Logga ut - synkad med Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-stone-700 safe-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logga ut
          </button>
        </div>
      </div>
    </>
  )
}
