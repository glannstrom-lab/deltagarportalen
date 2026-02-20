import { Outlet } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import CrisisSupport from './CrisisSupport'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'

export default function Layout() {
  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: '#eef2ff' }}
    >
      {/* Skip to main content - för skärmläsare */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        Hoppa till huvudinnehåll
      </a>
      
      <Sidebar />
      <main 
        id="main-content"
        className="flex-1 p-8 overflow-auto"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <CrisisSupport />
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}
