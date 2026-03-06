import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { BottomBar } from './layout/BottomBar'
import { MobileNav, MobileNavSimplified } from './MobileNav'
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
        {/* TopBar - sticky header (endast desktop) */}
        {showBars && !isMobile && <TopBar />}
        
        {/* Mobil TopBar - förenklad */}
        {showBars && isMobile && <MobileTopBar />}
        
        {/* Main content */}
        <main 
          id="main-content"
          className={cn(
            'flex-1 overflow-auto',
            isMobile ? 'p-4 pb-28' : 'p-6' // Extra padding på mobil för bottom nav
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
      
      {/* Mobila navigeringskomponenter */}
      {isMobile && showBars && (
        <>
          <MobileNav />
          <MobileNavSimplified />
        </>
      )}
      
      {/* Tillbaka-knapp på mobil (alla sidor utom dashboard) */}
      {showBackButton && <MobileBackButton />}
      
      {/* Övriga komponenter */}
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}

// Förenklad mobil topbar
function MobileTopBar() {
  const location = useLocation()
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
  
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 safe-top">
      <div className="flex items-center justify-between">
        {/* Logo eller titel */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">DP</span>
          </div>
          {title && (
            <h1 className="font-semibold text-slate-800 text-lg">{title}</h1>
          )}
        </div>
        
        {/* Datum */}
        <span className="text-sm text-slate-500 capitalize">{currentDate}</span>
      </div>
    </header>
  )
}
