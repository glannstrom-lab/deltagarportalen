/**
 * TopBar Component - Clean Pastel Design
 * White background, minimal elements, clean typography
 * No gradients, subtle borders
 */

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
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import CrisisSupport from '@/components/CrisisSupport'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { LanguageSwitcher } from './LanguageSwitcher'
import { GoogleTranslate } from './GoogleTranslate'

interface UserProfile {
  first_name: string
  last_name: string
  profile_image_url?: string
}

export function TopBar() {
  const { t } = useTranslation()
  const { isDark, toggleDarkMode } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfile()
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

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

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-2.5 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <OptimizedImage
            src="/logo-jobin-new.png"
            alt="Jobin"
            loading="eager"
            className="h-8 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
              jobin.se
            </span>
            <p className="text-[10px] text-stone-500 dark:text-stone-500 -mt-0.5">
              {t('topbar.tagline')}
            </p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Crisis Support */}
          <div className="hidden lg:block">
            <CrisisSupport variant="inline" />
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Google Translate */}
          <GoogleTranslate />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Help */}
          <Link
            to="/help"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title={t('topbar.help')}
          >
            <HelpCircle size={18} />
          </Link>

          {/* Notifications */}
          <NotificationBell variant="compact" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors',
                'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700',
                showUserMenu && 'ring-2 ring-teal-500'
              )}
            >
              <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center overflow-hidden">
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal-700 dark:text-teal-400 text-sm font-medium">
                    {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-stone-700 dark:text-stone-300">
                {profile?.first_name || t('topbar.profile')}
              </span>
              <ChevronDown
                size={14}
                className={cn('text-stone-400 transition-transform', showUserMenu && 'rotate-180')}
              />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                    <p className="font-medium text-stone-800 dark:text-stone-100">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : t('topbar.welcome')}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      <User size={16} className="text-stone-500" />
                      <span className="text-sm text-stone-700 dark:text-stone-300">{t('topbar.profile')}</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      <Settings size={16} className="text-stone-500" />
                      <span className="text-sm text-stone-700 dark:text-stone-300">{t('nav.settings')}</span>
                    </Link>

                    <div className="my-2 border-t border-stone-100 dark:border-stone-700" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <LogOut size={16} className="text-rose-500" />
                      <span className="text-sm text-rose-600 dark:text-rose-400">{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
