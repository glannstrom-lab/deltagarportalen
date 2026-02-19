import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import CrisisSupport from './CrisisSupport'
import BreakReminder from './BreakReminder'
import { ToastContainer } from './Toast'

import {
  LayoutDashboard,
  FileText,
  Compass,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Briefcase,
  Calendar,
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { calmMode } = useSettingsStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems: NavItem[] = [
    { path: '/', label: 'Översikt', icon: LayoutDashboard },
    { path: '/cv', label: 'CV', icon: FileText },
    { path: '/job-search', label: 'Sök jobb', icon: Briefcase },
    { path: '/interest-guide', label: 'Intresseguide', icon: Compass },
    { path: '/calendar', label: 'Kalender', icon: Calendar },
    { path: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
  ]

  const bottomItems: NavItem[] = [
    { path: '/settings', label: 'Inställningar', icon: Settings },
    { path: '/profile', label: 'Profil', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`min-h-screen bg-white ${calmMode ? 'calm-mode' : ''}`}>
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-semibold text-slate-900">Deltagarportalen</span>
        <div className="w-10" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transform lg:transform-none transition-transform duration-200 lg:translate-x-0 w-64 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col py-6">
            {/* Logo */}
            <div className="px-6 mb-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-slate-900 text-base">Deltagarportalen</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm
                      ${active 
                        ? 'bg-violet-50 text-violet-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Bottom section */}
            <div className="px-4 pt-4 border-t border-slate-100 mt-4">
              {bottomItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm mb-1
                      ${active 
                        ? 'bg-violet-50 text-violet-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors mt-1 text-sm"
              >
                <LogOut size={18} />
                <span>Logga ut</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Minimal header */}
          <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-end">
            <Link to="/profile" className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-violet-600" />
              </div>
            </Link>
          </header>

          {/* Page content */}
          <div className="p-8 lg:p-12 bg-slate-50/50 min-h-[calc(100vh-64px)]">
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
