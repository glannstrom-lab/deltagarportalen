/**
 * TopBar - Clean minimal design
 * No pastel squares - only neutral gray icons
 * Single accent color approach
 */

import { Link, useNavigate } from 'react-router-dom'
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Bell,
  Globe,
} from '@/components/ui/icons'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  first_name: string
  last_name: string
  profile_image_url?: string
}

export function TopBar() {
  const { t, i18n } = useTranslation()
  const { isDark, toggleDarkMode } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [hasUnreadNotifications] = useState(true) // TODO: Connect to real data
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfile()
  }, [user])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_image_url')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setShowLangMenu(false)
  }

  const currentLang = i18n.language?.startsWith('sv') ? 'SV' : 'EN'

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-2.5 sticky top-0 z-40">
      <div className="flex items-center justify-between">

        {/* Left - Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-900 rounded-lg" />
          <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
            jobin.se
          </span>
        </Link>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">

          {/* Language Switcher - Text button */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{currentLang}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showLangMenu && 'rotate-180')} />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 py-1 z-50">
                <button
                  onClick={() => changeLanguage('sv')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors',
                    currentLang === 'SV' ? 'text-brand-600 font-medium' : 'text-stone-700 dark:text-stone-300'
                  )}
                >
                  Svenska
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors',
                    currentLang === 'EN' ? 'text-brand-600 font-medium' : 'text-stone-700 dark:text-stone-300'
                  )}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={isDark ? 'Ljust läge' : 'Mörkt läge'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications - Gray bell with orange dot */}
          <Link
            to="/notifications"
            className="relative w-9 h-9 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="Notiser"
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </Link>

          {/* User Menu - Avatar + Name + Chevron, no background */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'
                )}
              </div>
              {/* Name */}
              <span className="hidden sm:block text-sm font-medium text-stone-700 dark:text-stone-200">
                {profile?.first_name || 'Profil'}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-stone-400 transition-transform',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-stone-500" />
                    Min profil
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-stone-500" />
                    Inställningar
                  </Link>

                  <div className="my-1 border-t border-stone-100 dark:border-stone-700" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-stone-500" />
                    Logga ut
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
