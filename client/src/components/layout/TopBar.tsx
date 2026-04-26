/**
 * TopBar Component - LinkedIn-inspired minimal design
 * Clean icons without backgrounds, subtle hover states
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
  Globe,
} from '@/components/ui/icons'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
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
  const { t, i18n } = useTranslation()
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

  // Shared icon button style - minimal like LinkedIn
  const iconButtonClass = cn(
    'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full',
    'text-stone-500 dark:text-stone-400',
    'hover:bg-stone-100 dark:hover:bg-stone-800',
    'transition-colors'
  )

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-3 sm:px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <OptimizedImage
            src="/logo-jobin-new.png"
            alt="Jobin"
            loading="eager"
            className="h-7 sm:h-8 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <span className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              jobin<span className="text-teal-600 dark:text-teal-400">.se</span>
            </span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Language Switcher - hidden on mobile */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Google Translate - hidden on mobile */}
          <div className="hidden md:block">
            <GoogleTranslate />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={iconButtonClass}
            title={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
          >
            {isDark ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
          </button>

          {/* Help - hidden on mobile */}
          <Link
            to="/help"
            className={cn(iconButtonClass, 'hidden sm:flex')}
            title={t('topbar.help')}
          >
            <HelpCircle size={20} />
          </Link>

          {/* Notifications */}
          <NotificationBell variant="compact" />

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-6 w-px bg-stone-200 dark:bg-stone-700 mx-1" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 rounded-full transition-colors',
                'hover:bg-stone-100 dark:hover:bg-stone-800',
                showUserMenu && 'bg-stone-100 dark:bg-stone-800'
              )}
            >
              {/* Avatar - round like LinkedIn */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden">
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm font-medium">
                    {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  'text-stone-400 transition-transform hidden sm:block',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg overflow-hidden z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden">
                        {profile?.profile_image_url ? (
                          <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-stone-600 dark:text-stone-300 text-lg font-medium">
                            {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 dark:text-stone-100 truncate">
                          {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : t('topbar.welcome')}
                        </p>
                        <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="mt-3 block w-full text-center py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      {t('topbar.viewProfile', 'Visa profil')}
                    </Link>
                  </div>

                  <div className="p-1.5">
                    {/* Language switcher - mobile only */}
                    <div className="sm:hidden px-3 py-2.5">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe size={18} className="text-stone-400" />
                        <span className="text-sm text-stone-600 dark:text-stone-300">{t('language.label')}</span>
                      </div>
                      <div className="flex gap-2 ml-7">
                        <button
                          onClick={() => i18n.changeLanguage('sv')}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                            i18n.language === 'sv'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                          )}
                        >
                          Svenska
                        </button>
                        <button
                          onClick={() => i18n.changeLanguage('en')}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                            i18n.language === 'en'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                          )}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    <div className="sm:hidden my-1.5 mx-3 border-t border-stone-100 dark:border-stone-700" />

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      <Settings size={18} className="text-stone-400" />
                      <span className="text-sm">{t('nav.settings')}</span>
                    </Link>

                    <Link
                      to="/help"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      <HelpCircle size={18} className="text-stone-400" />
                      <span className="text-sm">{t('topbar.help')}</span>
                    </Link>

                    <div className="my-1.5 mx-3 border-t border-stone-100 dark:border-stone-700" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      <LogOut size={18} className="text-stone-400" />
                      <span className="text-sm">{t('nav.logout')}</span>
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
