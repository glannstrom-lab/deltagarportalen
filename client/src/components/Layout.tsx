import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { BottomBar } from './layout/BottomBar'
import { MobileNav, MobileNavSimplified } from './MobileNav'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()
  
  // Visa TopBar och BottomBar på alla sidor förutom login/register
  const showBars = !['/login', '/register'].includes(location.pathname)

  return (
    <div 
      className={cn(
        'min-h-screen flex',
        isMobile && 'pb-20' // Padding för bottom navigation
      )}
      style={{ backgroundColor: '#eef2ff' }}
    >
      {/* Skip to main content - för skärmläsare */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        Hoppa till huvudinnehåll
      </a>
      
      {/* Sidebar - döljs på mobil */}
      <div className={cn(
        'hidden lg:block',
        isMobile && '!hidden'
      )}>
        <Sidebar />
      </div>
      
      {/* Huvudinnehåll */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopBar - sticky header */}
        {showBars && <TopBar />}
        
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
            'mx-auto pb-20',
            isMobile ? 'max-w-full' : 'max-w-7xl'
          )}>
            <Outlet />
          </div>
        </main>
        
        {/* BottomBar - fixed footer */}
        {showBars && <BottomBar />}
      </div>
      
      {/* Mobila navigeringskomponenter */}
      <MobileNav />
      <MobileNavSimplified />
      
      {/* Övriga komponenter */}
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}
