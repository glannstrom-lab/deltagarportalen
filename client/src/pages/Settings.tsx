import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { userApi } from '../services/supabaseApi'
import {
  Bell, Lock, User, Palette, Shield,
  ChevronRight, Save,
  Accessibility, X, Menu,
  Monitor
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import { RoleSelector } from '@/components/settings/RoleSelector'
import {
  Card, CardHeader, CardSection,
  Input, Button, Toggle,
  LoadingState, InfoCard
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface SettingSection {
  id: string
  titleKey: string
  descKey: string
  icon: React.ElementType
}

const sectionDefs: SettingSection[] = [
  { id: 'profile', titleKey: 'settings.sections.profile', descKey: 'settings.sections.profileDesc', icon: User },
  { id: 'accessibility', titleKey: 'settings.sections.accessibility', descKey: 'settings.sections.accessibilityDesc', icon: Accessibility },
  { id: 'notifications', titleKey: 'settings.sections.notifications', descKey: 'settings.sections.notificationsDesc', icon: Bell },
  { id: 'appearance', titleKey: 'settings.sections.appearance', descKey: 'settings.sections.appearanceDesc', icon: Palette },
  { id: 'privacy', titleKey: 'settings.sections.privacy', descKey: 'settings.sections.privacyDesc', icon: Shield },
  { id: 'security', titleKey: 'settings.sections.security', descKey: 'settings.sections.securityDesc', icon: Lock },
]

export default function Settings() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState('profile')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  })

  const { user } = useAuthStore()

  const {
    calmMode, toggleCalmMode,
    emailNotifications, setEmailNotifications,
    pushNotifications, setPushNotifications,
    weeklySummary, setWeeklySummary,
    highContrast, toggleHighContrast,
    largeText, toggleLargeText,
  } = useSettingsStore()

  // Build sections with translated titles
  const sections = sectionDefs.map((s) => ({
    ...s,
    title: t(s.titleKey),
    description: t(s.descKey),
  }))

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true)
        if (user) {
          setProfileData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
          }))
        }
        const profile = await userApi.getProfile()
        if (profile) {
          setProfileData({
            firstName: profile.first_name || user?.firstName || '',
            lastName: profile.last_name || user?.lastName || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || '',
            bio: profile.bio || '',
          })
        }
      } catch (error) {
        console.error(t('settings.profile.errorLoading'), error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [user])

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await userApi.updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        bio: profileData.bio,
      })
    } catch (error) {
      console.error(t('settings.profile.errorSaving'), error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <CardHeader
              title={t('settings.profile.title')}
              description={t('settings.profile.description')}
            />

            {isLoadingProfile ? (
              <LoadingState message={t('settings.profile.loadingProfile')} />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-50 rounded-full flex items-center justify-center">
                    <User size={32} className="text-violet-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <Button variant="secondary" size="sm">
                      {t('settings.profile.changePhoto')}
                    </Button>
                    <p className="text-sm text-stone-500 mt-1">{t('settings.profile.photoHint')}</p>
                  </div>
                </div>

                <CardSection title={t('settings.profile.personalInfo')}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('settings.profile.firstName')}
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    />
                    <Input
                      label={t('settings.profile.lastName')}
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    />
                  </div>
                </CardSection>

                <CardSection title={t('settings.profile.contactInfo')}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('settings.profile.email')}
                      type="email"
                      value={profileData.email}
                      disabled
                      hint={t('settings.profile.emailHint')}
                    />
                    <Input
                      label={t('settings.profile.phone')}
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                </CardSection>

                <CardSection title={t('settings.profile.aboutMe')}>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder={t('settings.profile.aboutMePlaceholder')}
                    className={cn(
                      "w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-lg",
                      "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100",
                      "focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500",
                      "resize-none text-base transition-theme"
                    )}
                  />
                </CardSection>

                <RoleSelector />

                <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    leftIcon={<Save size={18} />}
                    touchOptimized
                  >
                    {t('common.saveChanges')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-6">
            <CardHeader
              title={t('settings.accessibility.title')}
              description={t('settings.accessibility.description')}
            />

            <div className="space-y-4">
              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.accessibility.highContrast')}
                  description={t('settings.accessibility.highContrastDesc')}
                  checked={highContrast}
                  onChange={toggleHighContrast}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.accessibility.largeText')}
                  description={t('settings.accessibility.largeTextDesc')}
                  checked={largeText}
                  onChange={toggleLargeText}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.accessibility.calmMode')}
                  description={t('settings.accessibility.calmModeDesc')}
                  checked={calmMode}
                  onChange={toggleCalmMode}
                />
              </Card>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <CardHeader
              title={t('settings.notifications.title')}
              description={t('settings.notifications.description')}
            />

            <div className="space-y-4">
              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.notifications.email')}
                  description={t('settings.notifications.emailDesc')}
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.notifications.push')}
                  description={t('settings.notifications.pushDesc')}
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label={t('settings.notifications.weekly')}
                  description={t('settings.notifications.weeklyDesc')}
                  checked={weeklySummary}
                  onChange={() => setWeeklySummary(!weeklySummary)}
                />
              </Card>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <AppearanceSettings />
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <CardHeader
              title={t('settings.privacy.title')}
              description={t('settings.privacy.description')}
            />

            <div className="space-y-4">
              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">{t('settings.privacy.shareActivity')}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('settings.privacy.shareActivityDesc')}</p>
                <button className="text-violet-600 font-medium text-sm hover:text-violet-700">
                  {t('settings.privacy.learnMore')}
                </button>
              </Card>

              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">{t('settings.privacy.profileVisibility')}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('settings.privacy.profileVisibilityDesc')}</p>
                <select className={cn(
                  "w-full px-4 py-2 border rounded-lg transition-theme",
                  "bg-white dark:bg-stone-800",
                  "border-stone-200 dark:border-stone-700",
                  "text-stone-900 dark:text-stone-100"
                )}>
                  <option>{t('settings.privacy.onlyMe')}</option>
                  <option>{t('settings.privacy.caseworkers')}</option>
                  <option>{t('settings.privacy.everyone')}</option>
                </select>
              </Card>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <CardHeader
              title={t('settings.security.title')}
              description={t('settings.security.description')}
            />

            <div className="space-y-4">
              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4">{t('settings.security.changePassword')}</h3>
                <div className="space-y-4">
                  <Input
                    label={t('settings.security.currentPassword')}
                    type="password"
                    placeholder={t('settings.security.currentPasswordPlaceholder')}
                  />
                  <Input
                    label={t('settings.security.newPassword')}
                    type="password"
                    placeholder={t('settings.security.newPasswordPlaceholder')}
                  />
                  <Input
                    label={t('settings.security.confirmPassword')}
                    type="password"
                    placeholder={t('settings.security.confirmPasswordPlaceholder')}
                  />
                  <Button variant="primary" touchOptimized fullWidth>
                    {t('settings.security.updatePassword')}
                  </Button>
                </div>
              </Card>

              <Card variant="flat" padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">{t('settings.security.twoFactor')}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{t('settings.security.twoFactorDesc')}</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    {t('common.activate')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <PageLayout
      title={t('settings.title')}
      description={t('settings.description')}
      showTabs={false}
    >
      {/* Mobile: Dropdown menu */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl transition-theme",
            "bg-white dark:bg-stone-800",
            "border border-stone-200 dark:border-stone-700"
          )}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const section = sections.find(s => s.id === activeSection)
              const Icon = section?.icon || User
              return (
                <>
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Icon size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="font-medium text-stone-900 dark:text-stone-100">{section?.title}</span>
                </>
              )
            })()}
          </div>
          {showMobileMenu ? <X size={20} className="text-stone-400" /> : <Menu size={20} className="text-stone-400" />}
        </button>

        {showMobileMenu && (
          <div className={cn(
            "mt-2 rounded-xl overflow-hidden border transition-theme",
            "bg-white dark:bg-stone-800",
            "border-stone-200 dark:border-stone-700"
          )}>
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id)
                    setShowMobileMenu(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors",
                    activeSection === section.id 
                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100' 
                      : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeSection === section.id 
                      ? 'bg-violet-500 text-white' 
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                  )}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">{section.title}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{section.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desktop Settings Navigation */}
        <div className="hidden lg:block lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left relative",
                  isActive 
                    ? 'bg-violet-50 dark:bg-violet-900/20' 
                    : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full" />
                )}
                
                <div className={cn(
                  "p-2 rounded-lg",
                  isActive 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                )}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold",
                    isActive 
                      ? 'text-violet-900 dark:text-violet-100' 
                      : 'text-stone-900 dark:text-stone-100'
                  )}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{section.description}</p>
                </div>
                <ChevronRight size={18} className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? 'text-violet-500' : 'text-stone-400 dark:text-stone-500'
                )} />
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            {renderSectionContent()}
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

// Appearance Settings Component
function AppearanceSettings() {
  const { t } = useTranslation()
  const { theme, setTheme, isDark, systemPreference } = useTheme()

  const themes = [
    {
      id: 'light' as const,
      label: t('settings.appearance.light'),
      icon: '☀️',
      description: t('settings.appearance.lightDesc'),
    },
    {
      id: 'dark' as const,
      label: t('settings.appearance.dark'),
      icon: '🌙',
      description: t('settings.appearance.darkDesc'),
    },
    {
      id: 'system' as const,
      label: t('settings.appearance.system'),
      icon: '💻',
      description: t('settings.appearance.systemDesc'),
    },
  ]

  return (
    <div className="space-y-6">
      <CardHeader
        title={t('settings.appearance.title')}
        description={t('settings.appearance.description')}
      />

      {/* Theme Selection */}
      <CardSection title={t('settings.appearance.theme')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all",
                theme === themeOption.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-violet-300 dark:hover:border-violet-700'
              )}
            >
              <div className="text-2xl mb-2">{themeOption.icon}</div>
              <div className={cn(
                "font-medium",
                theme === themeOption.id
                  ? 'text-violet-900 dark:text-violet-100'
                  : 'text-stone-900 dark:text-stone-100'
              )}>
                {themeOption.label}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {themeOption.description}
              </div>
              {theme === themeOption.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {theme === 'system' && (
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">
            {t('settings.appearance.systemCurrent')} <strong>{systemPreference === 'dark' ? t('settings.appearance.darkMode') : t('settings.appearance.lightMode')}</strong>.
          </p>
        )}
      </CardSection>

      {/* Preview */}
      <CardSection title={t('settings.appearance.preview')}>
        <div className={cn(
          "p-6 rounded-xl border transition-theme",
          "bg-stone-50 dark:bg-stone-900",
          "border-stone-200 dark:border-stone-700"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
              <span className="text-white text-lg">🎨</span>
            </div>
            <div>
              <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('settings.appearance.exampleCard')}</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('settings.appearance.previewText', { mode: isDark ? t('settings.appearance.darkMode') : t('settings.appearance.lightMode') })}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">{t('settings.appearance.primaryButton')}</Button>
            <Button variant="secondary" size="sm">{t('settings.appearance.secondaryButton')}</Button>
          </div>
        </div>
      </CardSection>

      {/* Info */}
      <InfoCard variant="info" icon={<Monitor size={20} />}>
        <p>
          {t('settings.appearance.autoSaveInfo')}
        </p>
      </InfoCard>
    </div>
  )
}
