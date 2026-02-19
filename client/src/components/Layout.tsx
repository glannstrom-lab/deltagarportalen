import { Outlet } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { Header } from './layout/Header'
import CrisisSupport from './CrisisSupport'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <Header />
          <div className="p-8 lg:p-12 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CrisisSupport />
      <BreakReminder workDuration={15} />
      <ToastContainer />
    </div>
  )
}
