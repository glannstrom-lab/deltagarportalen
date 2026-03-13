/**
 * Adaptation Tab - Workplace adaptation and support
 */
import { useState } from 'react'
import { 
  Accessibility, FileText, Building2, User, CheckCircle2,
  ChevronRight, Download, AlertCircle, HelpCircle
} from 'lucide-react'
import { Card, Button, Checkbox } from '@/components/ui'

interface AdaptationCategory {
  id: string
  title: string
  description: string
  options: string[]
}

const adaptationCategories: AdaptationCategory[] = [
  {
    id: 'physical',
    title: 'Fysiska anpassningar',
    description: 'Anpassningar som underlättar fysiska arbetsuppgifter',
    options: [
      'Ergonomisk arbetsstol',
      'Höj- och sänkbart skrivbord',
      'Förbättrad belysning',
      'Hörselhjälpmedel',
      'Synhjälpmedel',
      'Taktdämpning',
    ],
  },
  {
    id: 'cognitive',
    title: 'Kognitiva anpassningar',
    description: 'Stöd för minne, koncentration och planering',
    options: [
      'Skriftliga instruktioner',
      'Påminnelse-system',
      'Strukturerade arbetsuppgifter',
      'Minnesanteckningar tillåtna',
      'Tydliga rutiner och checklistor',
      'Mindre störande miljö',
    ],
  },
  {
    id: 'organizational',
    title: 'Organisatoriska anpassningar',
    description: 'Förändringar i arbetsorganisation och tider',
    options: [
      'Flexibel arbetstid',
      'Möjlighet till deltid',
      'Arbeta hemifrån',
      'Kortare arbetsdag',
      'Längre raster',
      'Gradvis återgång',
    ],
  },
  {
    id: 'social',
    title: 'Sociala anpassningar',
    description: 'Stöd för samarbete och kommunikation',
    options: [
      'Tydlig feedback',
      'Regelbundna avstämningar',
      'Mentor/buddy',
      'Mindre team',
      'Tydliga förväntningar',
      'Konflikthantering',
    ],
  },
]

export default function AdaptationTab() {
  const [selectedNeeds, setSelectedNeeds] = useState<Record<string, string[]>>({})
  const [showResults, setShowResults] = useState(false)

  const toggleOption = (categoryId: string, option: string) => {
    setSelectedNeeds(prev => {
      const current = prev[categoryId] || []
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option]
      return { ...prev, [categoryId]: updated }
    })
  }

  const generateDocument = () => {
    // Generate PDF with selected adaptations
    alert('Dokument genereras...')
  }

  const totalSelected = Object.values(selectedNeeds).flat().length

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Accessibility className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Arbetsanpassning</h3>
            <p className="text-slate-600">
              Här kan du identifiera vilka anpassningar som skulle hjälpa dig i arbetslivet. 
              Du kan sedan skapa ett dokument att dela med arbetsgivare, Försäkringskassan eller Arbetsförmedlingen.
            </p>
          </div>
        </div>
      </Card>

      {/* Self Assessment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Identifiera dina behov
        </h3>
        <p className="text-slate-600 mb-6">
          Markera de anpassningar som skulle hjälpa dig. Du kan välja flera i varje kategori.
        </p>

        <div className="space-y-6">
          {adaptationCategories.map((category) => (
            <div key={category.id} className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-1">{category.title}</h4>
              <p className="text-sm text-slate-500 mb-3">{category.description}</p>
              
              <div className="grid gap-2">
                {category.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedNeeds[category.id]?.includes(option) || false}
                      onCheckedChange={() => toggleOption(category.id, option)}
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {totalSelected > 0 && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-900">
                  Du har valt {totalSelected} anpassningar
                </p>
                <p className="text-sm text-indigo-700">
                  Generera ett dokument att dela med din arbetsgivare
                </p>
              </div>
              <Button onClick={generateDocument}>
                <Download className="w-4 h-4 mr-1" />
                Skapa dokument
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Dina rättigheter</h4>
              <p className="text-sm text-slate-600">
                Arbetsgivare har enligt arbetsmiljölagen ansvar att anpassa arbetsplatsen 
                för arbetstagare med funktionsnedsättning.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Stöd från Försäkringskassan</h4>
              <p className="text-sm text-slate-600">
                Försäkringskassan kan bidra till arbetshjälpmedel och stöd för att 
                underlätta din återgång till arbete.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Mallar för samtal
        </h3>
        <div className="space-y-3">
          {[
            { title: 'Prata med arbetsgivare', description: 'Hur du för dialogen om anpassningar' },
            { title: 'Ansök om stöd från FK', description: 'Exempel på ansökan till Försäkringskassan' },
            { title: 'Kontakta arbetskonsulent', description: 'Begära möte för arbetsanpassning' },
          ].map((template, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div>
                <h4 className="font-semibold text-slate-800">{template.title}</h4>
                <p className="text-sm text-slate-600">{template.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
