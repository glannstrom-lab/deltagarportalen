import { Link, useNavigate } from 'react-router-dom'
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Accessibility,
  Eye,
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

// ============================================
// ICON BUTTON COMPONENT
// ============================================

interface IconButtonProps {
  onClick?: () => void
  href?: string
  title: string
  children: React.ReactNode
  variant?: 'teal' | 'amber' | 'violet' | 'rose' | 'sky' | 'emerald' | 'stone'
  className?: string
}

function IconButton({ onClick, href, title, children, variant = 'stone', className }: IconButtonProps) {
  const variants = {
    teal: 'bg-teal-100/80 hover:bg-teal-200/90 text-teal-600 dark:bg-teal-900/40 dark:hover:bg-teal-800/50 dark:text-teal-400',
    amber: 'bg-amber-100/80 hover:bg-amber-200/90 text-amber-600 dark:bg-amber-900/40 dark:hover:bg-amber-800/50 dark:text-amber-400',
    violet: 'bg-violet-100/80 hover:bg-violet-200/90 text-violet-600 dark:bg-violet-900/40 dark:hover:bg-violet-800/50 dark:text-violet-400',
    rose: 'bg-rose-100/80 hover:bg-rose-200/90 text-rose-600 dark:bg-rose-900/40 dark:hover:bg-rose-800/50 dark:text-rose-400',
    sky: 'bg-sky-100/80 hover:bg-sky-200/90 text-sky-600 dark:bg-sky-900/40 dark:hover:bg-sky-800/50 dark:text-sky-400',
    emerald: 'bg-emerald-100/80 hover:bg-emerald-200/90 text-emerald-600 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/50 dark:text-emerald-400',
    stone: 'bg-stone-100/80 hover:bg-stone-200/90 text-stone-600 dark:bg-stone-800/60 dark:hover:bg-stone-700/70 dark:text-stone-400',
  }

  const baseClass = cn(
    'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
    'shadow-sm hover:shadow-md focus:outline-none',
    variants[variant],
    className
  )

  if (href) {
    return (
      <Link to={href} className={baseClass} title={title}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={baseClass} title={title}>
      {children}
    </button>
  )
}

// ============================================
// ACCESSIBILITY MENU (Language + Dark Mode + More)
// ============================================

function AccessibilityMenu() {
  const { isDark, toggleDarkMode } = useTheme()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        title={t('topbar.accessibility', 'Tillgänglighet')}
        variant="violet"
      >
        <Accessibility size={20} />
      </IconButton>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-stone-100 dark:border-stone-700">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Accessibility size={18} className="text-violet-500" />
                {t('topbar.accessibility', 'Tillgänglighet')}
              </h3>
            </div>

            <div className="p-2 space-y-1">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isDark ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'
                  )}>
                    {isDark ? (
                      <Sun size={18} className="text-amber-500" />
                    ) : (
                      <Moon size={18} className="text-indigo-500" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                      {isDark ? t('topbar.lightMode', 'Ljust läge') : t('topbar.darkMode', 'Mörkt läge')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-500">
                      {isDark ? t('topbar.switchToLight') : t('topbar.switchToDark')}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  isDark ? 'bg-violet-500' : 'bg-stone-300 dark:bg-stone-600'
                )}>
                  <div className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    isDark ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </div>
              </button>

              {/* Help Link */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-700">
                <Link
                  to="/help"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-100 dark:bg-sky-900/40">
                    <HelpCircle size={18} className="text-sky-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                      {t('topbar.help', 'Hjälp & Support')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-500">
                      {t('topbar.guidesAndFAQ')}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// MAIN TOPBAR COMPONENT
// ============================================

export function TopBar() {
  const { t } = useTranslation()
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
    <header className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200/60 dark:border-stone-700/60 px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-between">

        {/* Vänster - Logo och jobin.se */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <OptimizedImage
              src="/logo-jobin-new.png"
              alt="Jobin"
              loading="eager"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
              jobin.se
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-500 -mt-0.5 tracking-wide">
              {t('topbar.tagline')}
            </span>
          </div>
        </Link>

        {/* Höger - Actions */}
        <div className="flex items-center gap-2">
          {/* Crisis Support / Hjärtat - Pastel Rose */}
          <div className="hidden lg:block">
            <CrisisSupport variant="inline" />
          </div>

          {/* Language Switcher - Flag icons */}
          <LanguageSwitcher />

          {/* Google Translate - för fler språk */}
          <GoogleTranslate />

          {/* Accessibility Menu (Dark Mode + Help) */}
          <AccessibilityMenu />

          {/* Notifications - Pastel Emerald */}
          <NotificationBell variant="compact" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all duration-200',
                'bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30',
                'hover:from-teal-100 hover:to-sky-100 dark:hover:from-teal-900/40 dark:hover:to-sky-900/40',
                'border border-teal-200/50 dark:border-teal-700/50',
                'shadow-sm hover:shadow-md',
                showUserMenu && 'ring-2 ring-teal-400/50'
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-sky-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-inner overflow-hidden">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-200 leading-tight">
                  {profile?.first_name || t('topbar.profile')}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-500 leading-tight">
                  {profile?.last_name || ''}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-stone-400 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 border-b border-stone-100 dark:border-stone-700">
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : t('topbar.welcome')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-500 truncate">{user?.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 dark:bg-teal-900/40">
                        <User size={18} className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('topbar.profile', 'Min profil')}</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-100 dark:bg-stone-700/50">
                        <Settings size={18} className="text-stone-600 dark:text-stone-400" />
                      </div>
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('nav.settings', 'Inställningar')}</span>
                    </Link>

                    <div className="my-2 border-t border-stone-100 dark:border-stone-700" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                        <LogOut size={18} className="text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('nav.logout', 'Logga ut')}</span>
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
