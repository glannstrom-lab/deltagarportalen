import { Outlet } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { MobileNav, MobileNavSimplified } from './MobileNav'
import CrisisSupport from './CrisisSupport'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()

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
      <main 
        id="main-content"
        className={cn(
          'flex-1 overflow-auto',
          isMobile ? 'p-4' : 'p-8'
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
      
      {/* Mobila navigeringskomponenter */}
      <MobileNav />
      <MobileNavSimplified />
      
      {/* Övriga komponenter */}
      <CrisisSupport />
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}
