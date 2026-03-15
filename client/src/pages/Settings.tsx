import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { userApi } from '../services/supabaseApi'
import { 
  Bell, Lock, User, Palette, Shield,
  ChevronRight, Save,
  Accessibility, X, Menu, Loader2,
  Eye, EyeOff, Monitor
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
  title: string
  description: string
  icon: React.ElementType
}

const sections: SettingSection[] = [
  { id: 'profile', title: 'Profil', description: 'Hantera dina personuppgifter', icon: User },
  { id: 'accessibility', title: 'Tillgänglighet', description: 'Anpassa efter dina behov', icon: Accessibility },
  { id: 'notifications', title: 'Notifikationer', description: 'Välj hur du vill bli kontaktad', icon: Bell },
  { id: 'appearance', title: 'Utseende', description: 'Anpassa portalens utseende', icon: Palette },
  { id: 'privacy', title: 'Integritet', description: 'Hantera dina sekretessinställningar', icon: Shield },
  { id: 'security', title: 'Säkerhet', description: 'Ändra lösenord och tvåfaktorsauth', icon: Lock },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
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
        console.error('Fel vid laddning av profil:', error)
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
      console.error('Fel vid sparande av profil:', error)
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
              title="Profilinställningar"
              description="Hantera dina personuppgifter och profilbild"
            />
            
            {isLoadingProfile ? (
              <LoadingState message="Laddar profil..." />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-50 rounded-full flex items-center justify-center">
                    <User size={32} className="text-violet-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <Button variant="secondary" size="sm">
                      Byt profilbild
                    </Button>
                    <p className="text-sm text-stone-500 mt-1">JPG, PNG eller GIF. Max 2MB.</p>
                  </div>
                </div>

                <CardSection title="Personlig information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Förnamn"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    />
                    <Input
                      label="Efternamn"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    />
                  </div>
                </CardSection>

                <CardSection title="Kontaktuppgifter">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="E-post"
                      type="email"
                      value={profileData.email}
                      disabled
                      hint="E-post kan inte ändras här"
                    />
                    <Input
                      label="Telefon"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                </CardSection>

                <CardSection title="Om mig">
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Berätta kort om dig själv..."
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
                    Spara ändringar
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
              title="Tillgänglighet"
              description="Anpassa portalen efter dina behov och preferenser"
            />

            <div className="space-y-4">
              <Card variant="flat" padding="sm">
                <Toggle
                  label="Hög kontrast"
                  description="Ökar kontrasten för bättre läsbarhet"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label="Större text"
                  description="Ökar textstorleken i hela appen"
                  checked={largeText}
                  onChange={toggleLargeText}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label="Lugnt läge"
                  description="Reducerar animationer och distraktioner"
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
              title="Notifikationer"
              description="Välj hur du vill bli kontaktad om uppdateringar"
            />

            <div className="space-y-4">
              <Card variant="flat" padding="sm">
                <Toggle
                  label="E-postnotifikationer"
                  description="Få uppdateringar via e-post"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label="Push-notifikationer"
                  description="Få notiser i webbläsaren"
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
              </Card>

              <Card variant="flat" padding="sm">
                <Toggle
                  label="Veckosammanfattning"
                  description="Få en veckovis sammanfattning"
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
              title="Integritet"
              description="Hantera dina sekretessinställningar"
            />

            <div className="space-y-4">
              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">Dela aktivitet</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Tillåt delning av anonymiserad användningsstatistik för att förbättra tjänsten.</p>
                <button className="text-violet-600 font-medium text-sm hover:text-violet-700">
                  Läs mer om dataintegritet
                </button>
              </Card>

              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">Profilsynlighet</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Välj vem som kan se din profil.</p>
                <select className={cn(
                  "w-full px-4 py-2 border rounded-lg transition-theme",
                  "bg-white dark:bg-stone-800",
                  "border-stone-200 dark:border-stone-700",
                  "text-stone-900 dark:text-stone-100"
                )}>
                  <option>Endast jag</option>
                  <option>Arbetsförmedlare</option>
                  <option>Alla</option>
                </select>
              </Card>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <CardHeader 
              title="Säkerhet"
              description="Hantera lösenord och säkerhetsinställningar"
            />

            <div className="space-y-4">
              <Card variant="flat">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4">Ändra lösenord</h3>
                <div className="space-y-4">
                  <Input
                    label="Nuvarande lösenord"
                    type="password"
                    placeholder="Ange ditt nuvarande lösenord"
                  />
                  <Input
                    label="Nytt lösenord"
                    type="password"
                    placeholder="Ange nytt lösenord (minst 8 tecken)"
                  />
                  <Input
                    label="Bekräfta nytt lösenord"
                    type="password"
                    placeholder="Upprepa det nya lösenordet"
                  />
                  <Button variant="primary" touchOptimized fullWidth>
                    Uppdatera lösenord
                  </Button>
                </div>
              </Card>

              <Card variant="flat" padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">Tvåfaktorsautentisering</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Lägg till extra säkerhet</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Aktivera
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
      title="Inställningar"
      description="Anpassa portalen efter dina behov"
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
  const { theme, setTheme, isDark, systemPreference } = useTheme()

  const themes = [
    { 
      id: 'light' as const, 
      label: 'Ljust', 
      icon: '☀️',
      description: 'Perfekt för dagtid'
    },
    { 
      id: 'dark' as const, 
      label: 'Mörkt', 
      icon: '🌙',
      description: 'Skonsamt för ögonen'
    },
    { 
      id: 'system' as const, 
      label: 'System', 
      icon: '💻',
      description: 'Följer din enhet'
    },
  ]

  return (
    <div className="space-y-6">
      <CardHeader 
        title="Utseende"
        description="Anpassa portalens utseende efter din smak"
      />

      {/* Theme Selection */}
      <CardSection title="Tema">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all",
                theme === t.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-violet-300 dark:hover:border-violet-700'
              )}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className={cn(
                "font-medium",
                theme === t.id 
                  ? 'text-violet-900 dark:text-violet-100' 
                  : 'text-stone-900 dark:text-stone-100'
              )}>
                {t.label}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t.description}
              </div>
              {theme === t.id && (
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
            Systemet är för närvarande inställt på <strong>{systemPreference === 'dark' ? 'mörkt' : 'ljust'}</strong> läge.
          </p>
        )}
      </CardSection>

      {/* Preview */}
      <CardSection title="Förhandsgranskning">
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
              <h4 className="font-medium text-stone-900 dark:text-stone-100">Exempel-kort</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">Så här ser det ut i {isDark ? 'mörkt' : 'ljust'} läge</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">Primär knapp</Button>
            <Button variant="secondary" size="sm">Sekundär</Button>
          </div>
        </div>
      </CardSection>

      {/* Info */}
      <InfoCard variant="info" icon={<Monitor size={20} />}>
        <p>
          Ditt val sparas automatiskt och gäller för alla dina enheter. 
          Om du väljer "System" följer portalen din enhets inställningar.
        </p>
      </InfoCard>
    </div>
  )
}
