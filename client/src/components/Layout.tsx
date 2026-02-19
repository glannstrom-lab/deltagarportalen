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
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
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
