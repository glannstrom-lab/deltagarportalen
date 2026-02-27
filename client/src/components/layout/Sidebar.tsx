import { Link, useLocation } from 'react-router-dom'
import { navItems, adminNavItems, consultantNavItems } from './navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { LogOut, Settings, User } from 'lucide-react'

export function Sidebar() {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  
  // Kontrollera användarens roll
  const isSuperAdmin = user?.role === 'SUPERADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isConsultant = user?.role === 'CONSULTANT' || isAdmin

  return (
    <aside 
      className="w-20 h-screen sticky top-0 flex flex-col py-6 flex-shrink-0" 
      style={{ backgroundColor: '#4f46e5' }}
    >
      {/* User Avatar */}
      <Link to="/profile" className="flex justify-center mb-8">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <User size={24} className="text-white" />
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto">
        {/* Standard navigation */}
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
                  ? 'bg-white text-[#4f46e5]' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              style={isActive ? { color: '#4f46e5' } : undefined}
              title={item.label}
            >
              <Icon size={22} />
            </Link>
          )
        })}
        
        {/* Admin-länkar */}
        {isAdmin && (
          <>
            <div className="w-8 h-px bg-white/20 my-2" />
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive 
                      ? 'bg-amber-400 text-[#4f46e5]' 
                      : 'text-amber-300 hover:bg-white/10 hover:text-white'
                  )}
                  title={item.label}
                >
                  <Icon size={22} />
                </Link>
              )
            })}
          </>
        )}
        
        {/* Konsulent-länkar */}
        {isConsultant && !isAdmin && (
          <>
            <div className="w-8 h-px bg-white/20 my-2" />
            {consultantNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive 
                      ? 'bg-teal-400 text-[#4f46e5]' 
                      : 'text-teal-300 hover:bg-white/10 hover:text-white'
                  )}
                  title={item.label}
                >
                  <Icon size={22} />
                </Link>
              )
            })}
          </>
        )}
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
