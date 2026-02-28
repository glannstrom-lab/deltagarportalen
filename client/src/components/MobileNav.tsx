import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'
import {
  LayoutDashboard,
  FileText,
  Search,
  BookOpen,
  Compass,
  Calendar,
  Heart,
  User,
  Menu,
  X,
  BookHeart,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
}

/**
 * MobileNav - Mobil navigation med bottom bar och hamburger-meny
 * 
 * Funktioner:
 * - Bottom navigation för snabb åtkomst
 * - Hamburger-meny för alla länkar
 * - Touch-vänliga stora knappar
 * - Aktivt tillstånd-indikation
 * - Säkerhetszon för hemknapp/notch
 */
export function MobileNav() {
  const { isMobile } = useMobileOptimizer()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  if (!isMobile) return null

  const mainNavItems: NavItem[] = [
    { to: '/', label: 'Översikt', icon: <LayoutDashboard className="w-6 h-6" /> },
    { to: '/cv', label: 'CV', icon: <FileText className="w-6 h-6" /> },
    { to: '/job-search', label: 'Jobb', icon: <Search className="w-6 h-6" /> },
    { to: '/knowledge-base', label: 'Lär dig', icon: <BookOpen className="w-6 h-6" /> },
  ]

  const menuItems: NavItem[] = [
    { to: '/', label: 'Översikt', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/cv', label: 'CV-byggare', icon: <FileText className="w-5 h-5" /> },
    { to: '/cover-letter-generator', label: 'Personligt brev', icon: <FileText className="w-5 h-5" /> },
    { to: '/interest-guide', label: 'Intresseguiden', icon: <Compass className="w-5 h-5" /> },
    { to: '/job-search', label: 'Sök jobb', icon: <Search className="w-5 h-5" /> },
    { to: '/job-tracker', label: 'Ansökningar', icon: <FileText className="w-5 h-5" /> },
    { to: '/knowledge-base', label: 'Kunskapsbank', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/diary', label: 'Dagbok', icon: <BookHeart className="w-5 h-5" /> },
    { to: '/wellness', label: 'Mående', icon: <Heart className="w-5 h-5" /> },
    { to: '/profile', label: 'Profil', icon: <User className="w-5 h-5" /> },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay för meny */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 mobile-menu-overlay open"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidomeny (hamburger) */}
      <div 
        className={cn(
          'fixed top-0 left-0 bottom-0 w-[280px] max-w-[80vw] bg-white dark:bg-slate-800 z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'overflow-y-auto',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobil navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Meny
          </h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Stäng meny"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Navigationslänkar */}
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive: active }) => cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    'min-h-[48px]',
                    active
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  )}
                >
                  <span className={cn(
                    'shrink-0',
                    isActive(item.to)
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-violet-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Deltagarportalen
          </p>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav 
        className={cn(
          'mobile-bottom-nav',
          'bg-white dark:bg-slate-800',
          'border-t border-slate-200 dark:border-slate-700'
        )}
        role="navigation"
        aria-label="Primär navigation"
      >
        {/* Meny-knapp (hamburger) */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            'mobile-bottom-nav-item',
            isMenuOpen && 'active'
          )}
          aria-label="Öppna meny"
          aria-expanded={isMenuOpen}
        >
          <Menu className="w-6 h-6" />
          <span>Meny</span>
        </button>

        {/* Huvudnavigationslänkar */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'mobile-bottom-nav-item',
              isActive && 'active'
            )}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

// Förenklad version för very small screens
export function MobileNavSimplified() {
  const { isMobile, isSimplifiedView } = useMobileOptimizer()
  const location = useLocation()

  if (!isMobile || !isSimplifiedView) return null

  const navItems = [
    { to: '/', label: 'Hem', icon: <LayoutDashboard className="w-6 h-6" /> },
    { to: '/cv', label: 'CV', icon: <FileText className="w-6 h-6" /> },
    { to: '/job-search', label: 'Jobb', icon: <Search className="w-6 h-6" /> },
  ]

  return (
    <nav 
      className="mobile-bottom-nav bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
      role="navigation"
      aria-label="Förenklad navigation"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            'mobile-bottom-nav-item',
            isActive && 'active'
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

// Floating Action Button för snabb åtkomst till vanliga åtgärder
interface MobileFabProps {
  onClick?: () => void
  icon?: React.ReactNode
  label?: string
  className?: string
}

export function MobileFab({ 
  onClick, 
  icon, 
  label = 'Snabbåtgärd',
  className 
}: MobileFabProps) {
  const { isMobile, isSimplifiedView } = useMobileOptimizer()

  if (!isMobile || isSimplifiedView) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'mobile-fab',
        'bg-violet-600 dark:bg-violet-500',
        'hover:bg-violet-700 dark:hover:bg-violet-600',
        className
      )}
      aria-label={label}
    >
      {icon || <span className="text-2xl">+</span>}
    </button>
  )
}
