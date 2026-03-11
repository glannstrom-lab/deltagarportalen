import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { userApi } from '../services/supabaseApi'
import { 
  Bell, Lock, User, Palette, Shield,
  ChevronRight, Moon, Sun, Save,
  Accessibility, X, Menu, Loader2,
  Eye, EyeOff
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
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
  const [darkMode, setDarkMode] = useState(false)
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
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center">
                    <User size={32} className="text-indigo-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <Button variant="secondary" size="sm">
                      Byt profilbild
                    </Button>
                    <p className="text-sm text-slate-500 mt-1">JPG, PNG eller GIF. Max 2MB.</p>
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
                      "w-full px-4 py-3 border border-slate-200 rounded-lg",
                      "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                      "resize-none text-base"
                    )}
                  />
                </CardSection>

                <div className="flex justify-end pt-4 border-t border-slate-100">
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
          <div className="space-y-6">
            <CardHeader 
              title="Utseende"
              description="Anpassa portalens utseende efter din smak"
            />

            <Card variant="flat" padding="sm">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-slate-600" />}
                <div className="flex-1">
                  <Toggle
                    label="Mörkt läge"
                    description="Byt till mörkt tema"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                </div>
              </div>
            </Card>
          </div>
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
                <h3 className="font-medium text-slate-900 mb-2">Dela aktivitet</h3>
                <p className="text-sm text-slate-500 mb-3">Tillåt delning av anonymiserad användningsstatistik för att förbättra tjänsten.</p>
                <button className="text-indigo-600 font-medium text-sm hover:text-indigo-700">
                  Läs mer om dataintegritet
                </button>
              </Card>

              <Card variant="flat">
                <h3 className="font-medium text-slate-900 mb-2">Profilsynlighet</h3>
                <p className="text-sm text-slate-500 mb-3">Välj vem som kan se din profil.</p>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg">
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
                <h3 className="font-medium text-slate-900 mb-4">Ändra lösenord</h3>
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
                    <h3 className="font-medium text-slate-900">Tvåfaktorsautentisering</h3>
                    <p className="text-sm text-slate-500">Lägg till extra säkerhet</p>
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
          className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            {(() => {
              const section = sections.find(s => s.id === activeSection)
              const Icon = section?.icon || User
              return (
                <>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Icon size={20} className="text-indigo-600" />
                  </div>
                  <span className="font-medium text-slate-900">{section?.title}</span>
                </>
              )
            })()}
          </div>
          {showMobileMenu ? <X size={20} className="text-slate-400" /> : <Menu size={20} className="text-slate-400" />}
        </button>

        {showMobileMenu && (
          <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                      ? 'bg-indigo-50 text-indigo-900' 
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeSection === section.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                  )}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{section.title}</h3>
                    <p className="text-xs text-slate-500">{section.description}</p>
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
                    ? 'bg-indigo-50' 
                    : 'bg-white hover:bg-slate-50'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                )}
                
                <div className={cn(
                  "p-2 rounded-lg",
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold",
                    isActive ? 'text-indigo-900' : 'text-slate-900'
                  )}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">{section.description}</p>
                </div>
                <ChevronRight size={18} className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? 'text-indigo-500' : 'text-slate-400'
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
