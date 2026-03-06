import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { 
  Bell, 
  Lock, 
  User, 
  Palette, 
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Save,
  Accessibility,
  X,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

const sections: SettingSection[] = [
  { 
    id: 'profile', 
    title: 'Profil', 
    description: 'Hantera dina personuppgifter', 
    icon: User 
  },
  { 
    id: 'accessibility', 
    title: 'Tillgänglighet', 
    description: 'Anpassa efter dina behov', 
    icon: Accessibility 
  },
  { 
    id: 'notifications', 
    title: 'Notifikationer', 
    description: 'Välj hur du vill bli kontaktad', 
    icon: Bell 
  },
  { 
    id: 'appearance', 
    title: 'Utseende', 
    description: 'Anpassa portalens utseende', 
    icon: Palette 
  },
  { 
    id: 'privacy', 
    title: 'Integritet', 
    description: 'Hantera dina sekretessinställningar', 
    icon: Shield 
  },
  { 
    id: 'security', 
    title: 'Säkerhet', 
    description: 'Ändra lösenord och tvåfaktorsauth', 
    icon: Lock 
  },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [darkMode, setDarkMode] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Settings from store
  const {
    calmMode,
    toggleCalmMode,
    emailNotifications,
    setEmailNotifications,
    pushNotifications,
    setPushNotifications,
    weeklySummary,
    setWeeklySummary,
    highContrast,
    toggleHighContrast,
    largeText,
    toggleLargeText,
  } = useSettingsStore()

  // Aktiv sektion innehåll
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Profilinställningar</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                <User size={32} className="text-teal-700" />
              </div>
              <div className="text-center sm:text-left">
                <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors min-h-[44px]">
                  Byt profilbild
                </button>
                <p className="text-sm text-slate-500 mt-1">JPG, PNG eller GIF. Max 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Förnamn</label>
                <input 
                  type="text" 
                  defaultValue="Anna"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
                <input 
                  type="text" 
                  defaultValue="Andersson"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                <input 
                  type="email" 
                  defaultValue="anna.andersson@email.se"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input 
                  type="tel" 
                  defaultValue="070-123 45 67"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Om mig</label>
              <textarea 
                rows={3}
                placeholder="Berätta kort om dig själv..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors min-h-[48px]">
                <Save size={18} />
                Spara ändringar
              </button>
            </div>
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Tillgänglighet</h2>
            <p className="text-slate-500">Anpassa portalen efter dina behov och preferenser.</p>

            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Hög kontrast</h3>
                  <p className="text-sm text-slate-500">Ökar kontrasten för bättre läsbarhet</p>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    highContrast ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    highContrast ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Större text</h3>
                  <p className="text-sm text-slate-500">Ökar textstorleken i hela appen</p>
                </div>
                <button
                  onClick={toggleLargeText}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    largeText ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    largeText ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              {/* Calm Mode */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Lugnt läge</h3>
                  <p className="text-sm text-slate-500">Reducerar animationer och distraktioner</p>
                </div>
                <button
                  onClick={toggleCalmMode}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    calmMode ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    calmMode ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Notifikationer</h2>
            <p className="text-slate-500">Välj hur du vill bli kontaktad om uppdateringar.</p>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">E-postnotifikationer</h3>
                  <p className="text-sm text-slate-500">Få uppdateringar via e-post</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    emailNotifications ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    emailNotifications ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Push-notifikationer</h3>
                  <p className="text-sm text-slate-500">Få notiser i webbläsaren</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    pushNotifications ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    pushNotifications ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              {/* Weekly Summary */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Veckosammanfattning</h3>
                  <p className="text-sm text-slate-500">Få en veckovis sammanfattning</p>
                </div>
                <button
                  onClick={() => setWeeklySummary(!weeklySummary)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative",
                    weeklySummary ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                    weeklySummary ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Utseende</h2>
            <p className="text-slate-500">Anpassa portalens utseende efter din smak.</p>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-slate-600" />}
                <div>
                  <h3 className="font-medium text-slate-900">Mörkt läge</h3>
                  <p className="text-sm text-slate-500">Byt till mörkt tema</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "w-14 h-8 rounded-full transition-colors relative",
                  darkMode ? "bg-teal-600" : "bg-slate-300"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform",
                  darkMode ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Integritet</h2>
            <p className="text-slate-500">Hantera dina sekretessinställningar.</p>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Dela aktivitet</h3>
                <p className="text-sm text-slate-500 mb-3">Tillåt delning av anonymiserad användningsstatistik för att förbättra tjänsten.</p>
                <button className="text-teal-600 font-medium text-sm">Läs mer om dataintegritet</button>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Profilsynlighet</h3>
                <p className="text-sm text-slate-500 mb-3">Välj vem som kan se din profil.</p>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                  <option>Endast jag</option>
                  <option>Arbetsförmedlare</option>
                  <option>Alla</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Säkerhet</h2>
            <p className="text-slate-500">Hantera lösenord och säkerhetsinställningar.</p>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Ändra lösenord</h3>
                <div className="space-y-3 mt-4">
                  <input 
                    type="password" 
                    placeholder="Nuvarande lösenord"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base"
                  />
                  <input 
                    type="password" 
                    placeholder="Nytt lösenord"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base"
                  />
                  <input 
                    type="password" 
                    placeholder="Bekräfta nytt lösenord"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base"
                  />
                  <button className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 min-h-[48px]">
                    Uppdatera lösenord
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-900">Tvåfaktorsautentisering</h3>
                  <p className="text-sm text-slate-500">Lägg till extra säkerhet</p>
                </div>
                <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 min-h-[44px]">
                  Aktivera
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Inställningar</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Anpassa portalen efter dina behov</p>
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="lg:hidden">
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
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Icon size={20} className="text-teal-700" />
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
                      ? 'bg-teal-50 text-teal-900' 
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeSection === section.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
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
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                  activeSection === section.id 
                    ? 'bg-teal-50 border-2 border-teal-500' 
                    : 'bg-white border-2 border-transparent hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  activeSection === section.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold",
                    activeSection === section.id ? 'text-teal-900' : 'text-slate-900'
                  )}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">{section.description}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
