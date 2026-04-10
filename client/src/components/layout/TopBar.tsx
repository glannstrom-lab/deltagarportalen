import { Link, useNavigate } from 'react-router-dom'
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
} from '@/components/ui/icons'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import CrisisSupport from '@/components/CrisisSupport'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface UserProfile {
  first_name: string
  last_name: string
  avatar_url?: string
}

export function TopBar() {
  const { isDark, toggleDarkMode } = useTheme()
  const { t } = useTranslation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-gradient-to-r from-teal-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 border-b border-teal-100 dark:border-stone-700 px-4 sm:px-6 py-1.5 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3">

        {/* Vänster - Logo och jobin.se */}
        <Link to="/" className="flex items-center gap-2">
          <OptimizedImage
            src="/logo-jobin-new.png"
            alt="Jobin"
            loading="eager"
            className="h-7 w-auto object-contain"
          />
          <span className="text-base font-semibold text-teal-700 dark:text-teal-400 hidden sm:block">
            jobin.se
          </span>
        </Link>

        {/* Höger - Actions */}
        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-teal-100 dark:hover:bg-stone-800 transition-colors"
            title={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
          >
            {isDark ? (
              <Sun size={16} className="text-amber-500" />
            ) : (
              <Moon size={16} className="text-stone-500 dark:text-stone-600" />
            )}
          </button>

          {/* Help */}
          <Link
            to="/help"
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-teal-100 dark:hover:bg-stone-800 transition-colors"
            title={t('topbar.help')}
          >
            <HelpCircle size={16} className="text-stone-500 dark:text-stone-600" />
          </Link>

          {/* Crisis Support / Hjärtat */}
          <div className="hidden lg:block">
            <CrisisSupport variant="inline" />
          </div>

          {/* Notifikationer */}
          <NotificationBell />

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-teal-200 dark:bg-stone-700 mx-1" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-1 p-0.5 pr-1.5 rounded-lg transition-colors",
                showUserMenu ? "bg-teal-100 dark:bg-teal-900/30" : "hover:bg-teal-100 dark:hover:bg-stone-800"
              )}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-sky-500 rounded-md flex items-center justify-center text-white font-medium text-xs">
                {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <ChevronDown size={12} className="hidden sm:block text-stone-600 dark:text-stone-500" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 p-2 z-50">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700">
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user?.email}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-600">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors mt-1"
                  >
                    <User size={18} className="text-stone-500 dark:text-stone-600" />
                    <span className="text-stone-700 dark:text-stone-200">{t('topbar.profile')}</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <Settings size={18} className="text-stone-500 dark:text-stone-600" />
                    <span className="text-stone-700 dark:text-stone-200">{t('nav.settings')}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1 text-red-600"
                  >
                    <LogOut size={18} />
                    <span>{t('nav.logout')}</span>
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
