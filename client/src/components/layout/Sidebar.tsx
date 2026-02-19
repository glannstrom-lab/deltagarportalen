import { Link, useLocation } from 'react-router-dom'
import { navItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { LogOut, Settings, User } from 'lucide-react'

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuthStore()

  return (
    <aside className="w-20 h-screen sticky top-0 flex flex-col py-6" style={{ backgroundColor: '#4f46e5' }}>
      {/* User Avatar */}
      <div className="flex justify-center mb-8">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
                isActive 
                  ? 'bg-white text-sidebar' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              title={item.label}
            >
              <Icon size={22} />
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <Link
          to="/settings"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all"
          title="Inställningar"
        >
          <Settings size={22} />
        </Link>
        <button
          onClick={logout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all"
          title="Logga ut"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  )
}
