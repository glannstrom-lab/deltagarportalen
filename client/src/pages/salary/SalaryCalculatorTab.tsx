/**
 * Salary Calculator Tab
 * Calculate expected salary based on role, experience, and location
 */
import { useState, useMemo } from 'react'
import { Calculator, MapPin, Briefcase, TrendingUp, Info, Sparkles } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// Swedish salary data by occupation category (monthly SEK, source: SCB approximations)
const SALARY_DATA: Record<string, { min: number; median: number; max: number; growth: number }> = {
  'IT & Systemutveckling': { min: 38000, median: 52000, max: 85000, growth: 4.2 },
  'Ekonomi & Finans': { min: 35000, median: 48000, max: 75000, growth: 3.1 },
  'Marknadsföring & Kommunikation': { min: 32000, median: 42000, max: 65000, growth: 2.8 },
  'HR & Personal': { min: 33000, median: 43000, max: 62000, growth: 2.5 },
  'Försäljning': { min: 30000, median: 40000, max: 70000, growth: 2.2 },
  'Administration': { min: 28000, median: 35000, max: 48000, growth: 1.8 },
  'Teknik & Ingenjör': { min: 36000, median: 48000, max: 72000, growth: 3.5 },
  'Hälso- & sjukvård': { min: 32000, median: 40000, max: 58000, growth: 2.9 },
  'Utbildning': { min: 30000, median: 38000, max: 52000, growth: 2.0 },
  'Bygg & Hantverk': { min: 32000, median: 38000, max: 55000, growth: 2.3 },
  'Juridik': { min: 38000, median: 55000, max: 95000, growth: 3.8 },
  'Design & Kreativt': { min: 30000, median: 40000, max: 60000, growth: 2.6 },
}

// Regional salary adjustments (percentage)
const REGION_ADJUSTMENTS: Record<string, number> = {
  'Stockholm': 15,
  'Göteborg': 8,
  'Malmö': 5,
  'Uppsala': 3,
  'Övriga storstadsregioner': 0,
  'Mellansverige': -5,
  'Norrland': -3,
}

// Experience multipliers
const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  '0-2 år': 0.85,
  '3-5 år': 1.0,
  '6-10 år': 1.15,
  '10+ år': 1.30,
}

export default function SalaryCalculatorTab() {
  const [occupation, setOccupation] = useState('')
  const [region, setRegion] = useState('')
  const [experience, setExperience] = useState('')
  const [showResult, setShowResult] = useState(false)

  const calculatedSalary = useMemo(() => {
    if (!occupation || !region || !experience) return null

    const baseSalary = SALARY_DATA[occupation]
    if (!baseSalary) return null

    const regionAdj = 1 + (REGION_ADJUSTMENTS[region] || 0) / 100
    const expMultiplier = EXPERIENCE_MULTIPLIERS[experience] || 1

    return {
      min: Math.round(baseSalary.min * regionAdj * expMultiplier),
      median: Math.round(baseSalary.median * regionAdj * expMultiplier),
      max: Math.round(baseSalary.max * regionAdj * expMultiplier),
      growth: baseSalary.growth,
    }
  }, [occupation, region, experience])

  const handleCalculate = () => {
    if (occupation && region && experience) {
      setShowResult(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lönekalkylator</h2>
            <p className="text-slate-600 mt-1">
              Beräkna förväntad lön baserat på yrke, erfarenhet och region. Data baserad på svensk lönestatistik.
            </p>
          </div>
        </div>
      </Card>

      {/* Calculator Form */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Ange dina uppgifter</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Yrkeskategori
            </label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Välj kategori...</option>
              {Object.keys(SALARY_DATA).map((occ) => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Välj region...</option>
              {Object.keys(REGION_ADJUSTMENTS).map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Erfarenhet
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Välj erfarenhet...</option>
              {Object.keys(EXPERIENCE_MULTIPLIERS).map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={!occupation || !region || !experience}
          className="mt-6 w-full sm:w-auto"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Beräkna lön
        </Button>
      </Card>

      {/* Results */}
      {showResult && calculatedSalary && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Ditt löneintervall</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-slate-500 mb-1">Minimum</p>
              <p className="text-2xl font-bold text-slate-700">
                {calculatedSalary.min.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-xs text-slate-400">per månad</p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-300 shadow-sm">
              <p className="text-sm text-emerald-600 font-medium mb-1">Median (rekommenderat)</p>
              <p className="text-3xl font-bold text-emerald-700">
                {calculatedSalary.median.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-xs text-slate-400">per månad</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-slate-500 mb-1">Maximum</p>
              <p className="text-2xl font-bold text-slate-700">
                {calculatedSalary.max.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-xs text-slate-400">per månad</p>
            </div>
          </div>

          {/* Annual salary */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Årslön (median)</p>
                <p className="text-xl font-bold text-slate-800">
                  {(calculatedSalary.median * 12).toLocaleString('sv-SE')} kr
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Löneökning/år (snitt)</p>
                <p className="text-xl font-bold text-emerald-600">+{calculatedSalary.growth}%</p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Om beräkningen</p>
              <p>
                Löneuppgifterna är baserade på branschstatistik och justerade för region och erfarenhet.
                Faktisk lön kan variera beroende på företag, specifik roll och individuella kvalifikationer.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tips section */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Tips för bättre lön</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-violet-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Bygg kompetens</p>
              <p className="text-sm text-slate-500">Certifieringar och specialkunskaper höjer lönen</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-violet-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Dokumentera resultat</p>
              <p className="text-sm text-slate-500">Konkreta exempel stärker din förhandlingsposition</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-violet-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Tajming är allt</p>
              <p className="text-sm text-slate-500">Förhandla efter framgångar eller vid nya ansvar</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-violet-600 font-bold">4</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Känn din marknad</p>
              <p className="text-sm text-slate-500">Ha koll på vad konkurrenter erbjuder</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
