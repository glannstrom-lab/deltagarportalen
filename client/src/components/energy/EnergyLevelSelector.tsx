/**
 * Energy Level Selector Component
 * Allows users to set their energy level and adapts the UI accordingly
 * Förbättrad med:
 * - Mer accepterande språk
 * - Distinkta färger per energinivå
 * - Micro-task alternativ för låg energi
 * - Tydligare visuell feedback
 */

import { useSettingsStore, type EnergyLevel } from '@/stores/settingsStore'
import { BatteryLow, BatteryMedium, BatteryFull, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EnergyLevelSelectorProps {
  onSelect?: (level: EnergyLevel) => void
  showDescription?: boolean
  showMicroTasks?: boolean
  className?: string
}

interface EnergyOption {
  level: EnergyLevel
  label: string
  description: string
  encouragement: string
  color: {
    bg: string
    border: string
    text: string
    iconBg: string
    selectedBg: string
  }
  icon: LucideIcon
}

// Förbättrad energikonfiguration med distinkta färger och accepterande språk
const energyOptions: EnergyOption[] = [
  {
    level: 'low',
    label: 'Lugn dag',
    description: 'Jag har inte så mycket energi idag – visa mig små, hanterbara steg',
    encouragement: 'Det är helt okej att ta det lugnt idag. Att vila är också ett steg framåt. 💙',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      iconBg: 'bg-sky-500',
      selectedBg: 'bg-sky-100'
    },
    icon: BatteryLow,
  },
  {
    level: 'medium',
    label: 'Balanserad dag',
    description: 'Jag klarar av de flesta uppgifter i min egen takt',
    encouragement: 'Bra att du hittar din egen rytm! Du gör framsteg i din takt. 💪',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      iconBg: 'bg-amber-500',
      selectedBg: 'bg-amber-100'
    },
    icon: BatteryMedium,
  },
  {
    level: 'high',
    label: 'Energidag',
    description: 'Jag känner mig stark idag – visa mig vad som finns att göra!',
    encouragement: 'Härligt att du har energi idag! Passa på att göra det som känns viktigt. 🚀',
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      iconBg: 'bg-rose-500',
      selectedBg: 'bg-rose-100'
    },
    icon: BatteryFull,
  },
]

// Micro-task alternativ för låg energi
const microAlternatives: Record<string, { low: string[]; medium: string[] }> = {
  'diary': {
    low: [
      'Välj en humör-emoji',
      'Skriv ett ord som beskriver dagen',
      'Ta en djup andetag och reflektera'
    ],
    medium: [
      'Skriv 3 meningar om dagen',
      'Svara på en reflektionsfråga',
      'Dela en positiv tanke'
    ]
  },
  'cv': {
    low: [
      'Uppdatera din e-postadress',
      'Lägg till ett telefonnummer',
      'Välj en profilbild'
    ],
    medium: [
      'Skriv en kort sammanfattning',
      'Lägg till en kompetens',
      'Uppdatera din titel'
    ]
  },
  'interest': {
    low: [
      'Svara på 1 fråga i taget',
      'Läs om ett yrke som verkar intressant',
      'Spara ett resultat till senare'
    ],
    medium: [
      'Besvara 3 intressefrågor',
      'Utforska ditt högst rankade yrke',
      'Jämför två yrkesalternativ'
    ]
  }
}

export function EnergyLevelSelector({ 
  onSelect, 
  showDescription = true,
  showMicroTasks = false,
  className 
}: EnergyLevelSelectorProps) {
  const { energyLevel, setEnergyLevel } = useSettingsStore()

  const handleSelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    onSelect?.(level)
  }

  const selectedOption = energyOptions.find(opt => opt.level === energyLevel)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header med förklaring */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Hur är din energi idag?</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Välj din energinivå så visar vi lämpliga uppgifter. Det är okej att ändra under dagen.
          </p>
        </div>
      </div>
      
      {/* Energy options */}
      <div className="grid gap-3" role="radiogroup" aria-label="Välj energinivå">
        {energyOptions.map((option) => {
          const Icon = option.icon
          const isSelected = energyLevel === option.level
          
          return (
            <button
              key={option.level}
              onClick={() => handleSelect(option.level)}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2',
                isSelected
                  ? `${option.color.border} ${option.color.selectedBg} shadow-md focus:ring-${option.color.iconBg.split('-')[1]}-500`
                  : `${option.color.border.replace('200', '100')} bg-white hover:${option.color.bg} hover:${option.color.border} focus:ring-slate-400`
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0',
                  isSelected ? option.color.iconBg : 'bg-slate-100',
                  isSelected ? 'text-white' : 'text-slate-500'
                )}
                aria-hidden="true"
              >
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'font-semibold text-base',
                  isSelected ? option.color.text : 'text-slate-800'
                )}>
                  {option.label}
                </div>
                {showDescription && (
                  <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                    {option.description}
                  </div>
                )}
              </div>
              
              {isSelected && (
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  option.color.iconBg
                )}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Uppmuntrande meddelande baserat på val */}
      {selectedOption && (
        <div 
          className={cn(
            'p-4 rounded-xl border-2 text-sm leading-relaxed',
            selectedOption.color.bg,
            selectedOption.color.border,
            selectedOption.color.text
          )}
          role="status"
          aria-live="polite"
        >
          {selectedOption.encouragement}
        </div>
      )}

      {/* Micro-task alternativ (valfritt) */}
      {showMicroTasks && energyLevel === 'low' && (
        <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
          <h4 className="font-medium text-sky-800 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Små steg som fungerar idag
          </h4>
          <p className="text-sm text-sky-600 mb-3">
            Här är några minimala uppgifter du kan göra även när energin är låg:
          </p>
          <div className="space-y-2">
            {Object.entries(microAlternatives).slice(0, 2).map(([key, tasks]) => (
              <div key={key} className="bg-white rounded-lg p-3 border border-sky-100">
                <p className="text-xs font-medium text-sky-700 uppercase mb-1.5">
                  {key === 'diary' ? 'Dagbok' : key === 'cv' ? 'CV' : 'Intresseguide'}
                </p>
                <ul className="space-y-1">
                  {tasks.low.slice(0, 2).map((task, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <ChevronRight className="w-3 h-3 text-sky-400 shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to get energy-appropriate content
 * Förbättrad med mer motiverande uppgifter och tydligare förklaringar
 */
export function useEnergyAdaptedContent() {
  const { energyLevel } = useSettingsStore()

  const getVisibleWidgets = (allWidgets: string[]): string[] => {
    switch (energyLevel) {
      case 'low':
        // Show only 2-3 essential widgets for low energy
        return allWidgets.slice(0, 3)
      case 'medium':
        // Show 5-6 widgets
        return allWidgets.slice(0, 6)
      case 'high':
        // Show all widgets
        return allWidgets
      default:
        return allWidgets
    }
  }

  const getQuickTasks = (): { 
    label: string
    description: string
    duration: string
    action: string
    whyHelpful: string
  }[] => {
    switch (energyLevel) {
      case 'low':
        return [
          { 
            label: 'Skriv ner en sak du är stolt över', 
            description: 'Reflektera över något positivt',
            duration: '2 min', 
            action: '/dashboard/diary',
            whyHelpful: 'Att fokusera på det positiva stärker självförtroendet'
          },
          { 
            label: 'Hur mår du just nu?', 
            description: 'Markera dagens humör',
            duration: '1 min', 
            action: '/dashboard/diary',
            whyHelpful: 'Att tracka måendet hjälper dig förstå dina mönster'
          },
          { 
            label: 'Titta på ett sparat jobb', 
            description: 'Utforska utan press',
            duration: '3 min', 
            action: '/dashboard/job-search',
            whyHelpful: 'Att bara titta är ett steg i rätt riktning'
          },
          { 
            label: 'Läs en inspirerande artikel', 
            description: 'Ta del av motivation och tips',
            duration: '5 min', 
            action: '/dashboard/knowledge-base',
            whyHelpful: 'Inspiration kan ge ny energi och perspektiv'
          },
        ]
      case 'medium':
        return [
          { 
            label: 'Uppdatera din kontaktinfo', 
            description: 'Se över dina uppgifter',
            duration: '10 min', 
            action: '/dashboard/cv',
            whyHelpful: 'Uppdaterad information ökar chanserna att bli kontaktad'
          },
          { 
            label: 'Besvara 3 frågor i intresseguiden', 
            description: 'Utforska dina intressen',
            duration: '5 min', 
            action: '/dashboard/interest-guide',
            whyHelpful: 'Att förstå dina intressen hjälper dig hitta rätt riktning'
          },
          { 
            label: 'Sök efter nya jobb', 
            description: 'Hitta möjligheter som passar dig',
            duration: '10 min', 
            action: '/dashboard/job-search',
            whyHelpful: 'Ju fler du hittar, desto större är chansen att hitta det rätta'
          },
          { 
            label: 'Skriv några rader i dagboken', 
            description: 'Reflektera över din resa',
            duration: '5 min', 
            action: '/dashboard/diary',
            whyHelpful: 'Reflektion hjälper dig se din utveckling över tid'
          },
        ]
      case 'high':
        return [
          { 
            label: 'Lägg till en arbetslivserfarenhet', 
            description: 'Berika ditt CV med erfarenhet',
            duration: '30 min', 
            action: '/dashboard/cv',
            whyHelpful: 'Ett komplett CV ökar chanserna att bli kallad till intervju'
          },
          { 
            label: 'Gör klart intresseguiden', 
            description: 'Få insikter om din karriärväg',
            duration: '15 min', 
            action: '/dashboard/interest-guide',
            whyHelpful: 'Resultaten ger dig en klarare bild av vilka yrken som passar'
          },
          { 
            label: 'Skriv ett personligt brev', 
            description: 'Förbered en ansökan',
            duration: '20 min', 
            action: '/dashboard/cover-letter',
            whyHelpful: 'Ett bra brev kan öppna dörrar till drömjobbet'
          },
          { 
            label: 'Spara 5 intressanta jobb', 
            description: 'Bygg din jobbshortlist',
            duration: '15 min', 
            action: '/dashboard/job-search',
            whyHelpful: 'Att ha alternativ ger dig fler möjligheter att välja rätt'
          },
        ]
    }
  }

  const getEncouragingMessage = (): string => {
    switch (energyLevel) {
      case 'low':
        return 'Det är helt okej att ta det lugnt idag. Att vila är också ett steg framåt. 💙'
      case 'medium':
        return 'Bra att du hittar din egen rytm! Du gör framsteg i din takt. 💪'
      case 'high':
        return 'Härligt att du har energi idag! Passa på att göra det som känns viktigt. 🚀'
    }
  }

  const getEnergyColor = (): string => {
    switch (energyLevel) {
      case 'low':
        return 'sky'
      case 'medium':
        return 'amber'
      case 'high':
        return 'rose'
    }
  }

  return {
    energyLevel,
    getVisibleWidgets,
    getQuickTasks,
    getEncouragingMessage,
    getEnergyColor,
    isLowEnergy: energyLevel === 'low',
    isMediumEnergy: energyLevel === 'medium',
    isHighEnergy: energyLevel === 'high',
  }
}

export default EnergyLevelSelector
