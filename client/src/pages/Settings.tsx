import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { 
  Bell, 
  Lock, 
  User, 
  Palette, 
  Globe, 
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Save,
  Heart,
  Accessibility,
  Type,
  Contrast
} from 'lucide-react'

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
  const [language, setLanguage] = useState('sv')
  
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inställningar</h1>
        <p className="text-slate-500 mt-1">Anpassa portalen efter dina behov</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left
                  ${activeSection === section.id 
                    ? 'bg-teal-50 border-2 border-teal-500' 
                    : 'bg-white border-2 border-transparent hover:bg-slate-50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg
                  ${activeSection === section.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'}
                `}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${activeSection === section.id ? 'text-teal-900' : 'text-slate-900'}`}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500">{section.description}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Profilinställningar</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                  <User size={32} className="text-teal-700" />
                </div>
                <div>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
                  <input 
                    type="text" 
                    defaultValue="Andersson"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                  <input 
                    type="email" 
                    defaultValue="anna.andersson@email.se"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input 
                    type="tel" 
                    defaultValue="070-123 45 67"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Om mig</label>
                <textarea 
                  rows={3}
                  placeholder="Berätta kort om dig själv..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
                  <Save size={18} />
                  Spara ändringar
                </button>
              </div>
            </div>
          )}

          {/* Accessibility Section */}
          {activeSection === 'accessibility' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Tillgänglighet</h2>
                <p className="text-slate-500 mt-1">Anpassa portalen efter dina behov</p>
              </div>

              {/* Calm Mode */}
              <div className="p-5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-500 text-white rounded-xl">
                      <Heart size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-900 text-lg">Lugn läge</h3>
                      <p className="text-teal-700 mt-1">
                        Ett mjukare gränssnitt med större knappar, färre val och mer stöttande feedback. 
                        Perfekt när energin är låg.
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-teal-600">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                          Större knappar och text
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                          Färre alternativ synliga samtidigt
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                          Ingen "skam-skapande" statistik
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                          Påminnelser om pauser
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={toggleCalmMode}
                    className={`
                      w-14 h-8 rounded-full transition-colors relative flex-shrink-0
                      ${calmMode ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm
                      ${calmMode ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>
              </div>

              {/* Visual Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Visuella inställningar</h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Type size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Större text</h4>
                      <p className="text-sm text-slate-500">Ökar textstorleken i hela portalen</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleLargeText}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${largeText ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${largeText ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Contrast size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Hög kontrast</h4>
                      <p className="text-sm text-slate-500">Starkare färger för bättre läsbarhet</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleHighContrast}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${highContrast ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${highContrast ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>
              </div>

              {/* Crisis Support Info */}
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={18} className="text-rose-600" />
                  <h3 className="font-medium text-rose-900">Behöver du stöd?</h3>
                </div>
                <p className="text-sm text-rose-700 mb-3">
                  Det finns alltid hjälp att få. Krisstöd-knappen finns alltid synlig längst ner till höger.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white text-rose-700 rounded-full text-sm font-medium">
                    Jourhavande medmänniska: 08-702 16 80
                  </span>
                  <span className="px-3 py-1 bg-white text-rose-700 rounded-full text-sm font-medium">
                    1177: 1177
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Notifikationsinställningar</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">E-postnotifikationer</h3>
                      <p className="text-sm text-slate-500">Få uppdateringar via e-post</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${emailNotifications ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${emailNotifications ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Push-notifikationer</h3>
                      <p className="text-sm text-slate-500">Få notifikationer i webbläsaren</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${pushNotifications ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${pushNotifications ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Veckosammanfattning</h3>
                      <p className="text-sm text-slate-500">Få en sammanfattning varje vecka</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWeeklySummary(!weeklySummary)}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${weeklySummary ? 'bg-teal-500' : 'bg-slate-300'}
                    `}
                  >
                    <span className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${weeklySummary ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Utseende</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Tema</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${!darkMode ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}
                    `}
                  >
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <Sun size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-medium ${!darkMode ? 'text-teal-900' : 'text-slate-900'}`}>Ljust</h3>
                      <p className="text-sm text-slate-500">Standardläge</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDarkMode(true)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${darkMode ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}
                    `}
                  >
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Moon size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-medium ${darkMode ? 'text-teal-900' : 'text-slate-900'}`}>Mörkt</h3>
                      <p className="text-sm text-slate-500">Kommer snart</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Språk</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="sv">Svenska</option>
                  <option value="en">English</option>
                  <option value="no">Norsk</option>
                  <option value="da">Dansk</option>
                </select>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Integritet</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-2">Dela profil med arbetskonsulent</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Tillåt din arbetskonsulent att se din aktivitet och dina framsteg i portalen.
                  </p>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Hantera delning
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-2">Exportera din data</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Ladda ner en kopia av alla dina data från portalen.
                  </p>
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    Exportera data
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h3 className="font-medium text-red-900 mb-2">Radera konto</h3>
                  <p className="text-sm text-red-600 mb-3">
                    Detta kommer permanent radera ditt konto och all associerad data.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Radera konto
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Säkerhet</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-2">Ändra lösenord</h3>
                  <div className="space-y-3 mt-3">
                    <input 
                      type="password" 
                      placeholder="Nuvarande lösenord"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <input 
                      type="password" 
                      placeholder="Nytt lösenord"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <input 
                      type="password" 
                      placeholder="Bekräfta nytt lösenord"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <button className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Uppdatera lösenord
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Tvåfaktorsautentisering</h3>
                      <p className="text-sm text-slate-500">Öka säkerheten på ditt konto</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                      Aktivera
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-medium text-slate-900 mb-2">Aktiva sessioner</h3>
                  <p className="text-sm text-slate-500 mb-3">Du är för närvarande inloggad på:</p>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">Chrome på Windows</p>
                        <p className="text-xs text-slate-500">Stockholm, Sverige • Nuvarande session</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
