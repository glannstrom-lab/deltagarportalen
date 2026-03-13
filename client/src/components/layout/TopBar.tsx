import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Moon, 
  Sun, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  HelpCircle,
  ChevronDown,
  Flame
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  first_name: string
  last_name: string
  avatar_url?: string
}

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: 'info' | 'success' | 'warning'
}

export function TopBar() {
  const [isDark, setIsDark] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [streak, setStreak] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()

  useEffect(() => {
    // Formatera datum på svenska
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    }
    setCurrentDate(date.toLocaleDateString('sv-SE', options))
    
    // Kolla om dark mode är sparat
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode === 'true') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }

    // Ladda profil
    loadProfile()
    
    // Ladda notifikationer
    loadNotifications()
    
    // Ladda streak
    loadStreak()
  }, [])

  const loadProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  const loadNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setNotifications(data)
  }

  const loadStreak = async () => {
    // Hämta från localStorage för nu (kan flyttas till databas senare)
    const savedStreak = localStorage.getItem('user_streak')
    const lastVisit = localStorage.getItem('last_visit_date')
    const today = new Date().toDateString()
    
    if (lastVisit === today) {
      setStreak(parseInt(savedStreak || '0'))
    } else if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
      // Besökte igår - fortsätt streak
      const newStreak = parseInt(savedStreak || '0') + 1
      setStreak(newStreak)
      localStorage.setItem('user_streak', newStreak.toString())
      localStorage.setItem('last_visit_date', today)
    } else {
      // Bröt streak
      setStreak(1)
      localStorage.setItem('user_streak', '1')
      localStorage.setItem('last_visit_date', today)
    }
  }

  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem('darkMode', String(newMode))
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/job-search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const markNotificationAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.length

  // Bestäm vilken sökplaceholder som ska visas baserat på sida
  const getSearchPlaceholder = () => {
    const path = location.pathname
    if (path.includes('knowledge')) return 'Sök artiklar...'
    if (path.includes('job')) return 'Sök jobb...'
    return 'Sök jobb, artiklar...'
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Vänster - Logo/Datum + Streak */}
        <div className="flex items-center gap-3">
          <Link to="/" className="lg:hidden flex items-center gap-2">
            <img 
              src="/jobin-logo.png" 
              alt="Jobin" 
              className="w-8 h-8 rounded-xl object-contain bg-white shadow-md"
            />
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 text-slate-600">
            <span className="text-sm font-medium capitalize">{currentDate}</span>
            {streak > 1 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                <Flame size={12} />
                <span>{streak} dagar</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Mitten - Global sök */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 rounded-2xl border border-transparent
                         focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:bg-white focus:border-violet-200
                         text-sm transition-all placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Höger - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">


          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            title={isDark ? 'Ljust läge' : 'Mörkt läge'}
          >
            {isDark ? (
              <Sun size={20} className="text-amber-500" />
            ) : (
              <Moon size={20} className="text-slate-500" />
            )}
          </button>

          {/* Help */}
          <Link
            to="/help"
            className="hidden sm:flex p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            title="Hjälp & Support"
          >
            <HelpCircle size={20} className="text-slate-500" />
          </Link>

          {/* Notifikationer */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
              className={cn(
                "p-2.5 rounded-xl transition-colors relative",
                showNotifications ? "bg-violet-100" : "hover:bg-slate-100"
              )}
            >
              <Bell size={20} className={showNotifications ? "text-violet-600" : "text-slate-500"} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifikations-dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Notifikationer</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-xs text-violet-600 hover:text-violet-700"
                      >
                        Markera alla lästa
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-6">Inga nya notifikationer</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
              className={cn(
                "flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-colors",
                showUserMenu ? "bg-violet-100" : "hover:bg-slate-100"
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-medium text-sm">
                {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <ChevronDown size={16} className="hidden sm:block text-slate-400" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-800">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user?.email}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors mt-1"
                  >
                    <User size={18} className="text-slate-500" />
                    <span className="text-slate-700">Min profil</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={18} className="text-slate-500" />
                    <span className="text-slate-700">Inställningar</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors mt-1 text-red-600"
                  >
                    <LogOut size={18} />
                    <span>Logga ut</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
