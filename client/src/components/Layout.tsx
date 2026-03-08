import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { BottomBar } from './layout/BottomBar'
import { MobileNav } from './MobileNav'
import { MobileBackButton } from './MobileBackButton'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()
  
  // Visa TopBar och BottomBar på alla sidor förutom login/register
  const showBars = !['/login', '/register'].includes(location.pathname)
  
  // Bestäm om vi ska visa tillbaka-knapp (alla sidor utom dashboard)
  const showBackButton = isMobile && location.pathname !== '/'

  return (
    <div 
      className={cn(
        'min-h-screen flex',
        isMobile ? 'pb-safe' : ''
      )}
      style={{ backgroundColor: '#eef2ff' }}
    >
      {/* Sidebar - döljs på mobil */}
      <div className={cn(
        'hidden lg:block',
        isMobile && '!hidden'
      )}>
        <Sidebar />
      </div>
      
      {/* Huvudinnehåll */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopBar - desktop */}
        {showBars && !isMobile && <TopBar />}
        
        {/* Mobil TopBar med meny och profil */}
        {showBars && isMobile && <MobileTopBar />}
        
        {/* Main content */}
        <main 
          id="main-content"
          className={cn(
            'flex-1 overflow-auto',
            isMobile ? 'p-4' : 'p-6' // Ingen extra padding för bottom nav på mobil
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
        
        {/* Desktop footer */}
        {!isMobile && showBars && <BottomBar />}
      </div>
      
      {/* Mobil sidomeny (hamburger) - ingen bottom nav */}
      {isMobile && showBars && <MobileNav />}
      
      {/* Tillbaka-knapp på mobil (alla sidor utom dashboard) */}
      {showBackButton && <MobileBackButton />}
      
      {/* Övriga komponenter */}
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}

// Mobil topbar med meny-knapp och profil
import { useState } from 'react'
import { Menu, X, User, ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

function MobileTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const currentDate = new Date().toLocaleDateString('sv-SE', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  })
  
  // Hämta sidtitel baserat på path
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Översikt'
    if (path.includes('cv')) return 'CV'
    if (path.includes('cover-letter')) return 'Personligt brev'
    if (path.includes('job-search')) return 'Sök jobb'
    if (path.includes('job-tracker')) return 'Ansökningar'
    if (path.includes('knowledge')) return 'Kunskapsbank'
    if (path.includes('interest')) return 'Intresseguiden'
    if (path.includes('career')) return 'Karriär'
    if (path.includes('diary')) return 'Dagbok'
    if (path.includes('wellness')) return 'Mående'
    if (path.includes('profile')) return 'Profil'
    if (path.includes('settings')) return 'Inställningar'
    return ''
  }
  
  const title = getPageTitle()
  
  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }
  
  // Meny-items
  const menuItems = [
    { to: '/dashboard', label: 'Översikt' },
    { to: '/dashboard/cv', label: 'CV-byggare' },
    { to: '/dashboard/cover-letter', label: 'Personligt brev' },
    { to: '/dashboard/interest-guide', label: 'Intresseguiden' },
    { to: '/job-search', label: 'Sök jobb' },
    { to: '/job-tracker', label: 'Ansökningar' },
    { to: '/career', label: 'Karriär' },
    { to: '/knowledge-base', label: 'Kunskapsbank' },
    { to: '/diary', label: 'Dagbok' },
    { to: '/wellness', label: 'Mående' },
  ]
  
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          {/* Vänster: Profil-knapp */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Profil"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
          
          {/* Mitten: Titel */}
          <div className="flex-1 text-center">
            {title && (
              <h1 className="font-semibold text-slate-800 text-lg">{title}</h1>
            )}
          </div>
          
          {/* Höger: Meny-knapp */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Meny"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </header>
      
      {/* Meny overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Sidomeny (höger) */}
      <div 
        className={cn(
          'fixed top-0 right-0 bottom-0 bg-white z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[280px] max-w-[80vw]',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Meny header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 safe-top">
          <h2 className="text-lg font-semibold text-slate-800">Meny</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        {/* Meny-länkar */}
        <nav className="p-2">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                'flex items-center px-4 py-3 rounded-xl transition-colors',
                location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  ? 'bg-violet-100 text-violet-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Footer i meny */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 safe-bottom">
          <Link
            to="/settings"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Inställningar
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
          'fixed top-0 left-0 bottom-0 bg-white z-50 shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'w-[280px] max-w-[80vw]',
          isProfileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Profil header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 safe-top">
          <h2 className="text-lg font-semibold text-slate-800">Profil</h2>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        {/* Profil-info */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.email || 'Användare'}</p>
              <p className="text-sm text-slate-500">Deltagare</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            <Link
              to="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Min profil
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Inställningar
            </Link>
          </nav>
        </div>
        
        {/* Logga ut */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 safe-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            Logga ut
          </button>
        </div>
      </div>
    </>
  )
}
