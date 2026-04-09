/**
 * Relocation Tab - Housing and moving assistance
 */
import { useState } from 'react'
import { Home, MapPin, Calculator, TrendingUp, ExternalLink, CheckCircle, AlertCircle, Car } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// Swedish regions with cost of living data
const REGION_DATA = [
  { name: 'Stockholm', avgRent: 14500, avgSalary: 48000, commuteIndex: 3, housingWait: '5-15 år' },
  { name: 'Göteborg', avgRent: 10500, avgSalary: 44000, commuteIndex: 2, housingWait: '3-8 år' },
  { name: 'Malmö', avgRent: 9500, avgSalary: 42000, commuteIndex: 2, housingWait: '2-5 år' },
  { name: 'Uppsala', avgRent: 11000, avgSalary: 41000, commuteIndex: 2, housingWait: '4-10 år' },
  { name: 'Linköping', avgRent: 8500, avgSalary: 40000, commuteIndex: 1, housingWait: '1-3 år' },
  { name: 'Västerås', avgRent: 8000, avgSalary: 40000, commuteIndex: 1, housingWait: '1-3 år' },
  { name: 'Örebro', avgRent: 7500, avgSalary: 39000, commuteIndex: 1, housingWait: '1-2 år' },
  { name: 'Umeå', avgRent: 8500, avgSalary: 39000, commuteIndex: 1, housingWait: '1-3 år' },
]

const HOUSING_LINKS = [
  { name: 'Blocket Bostad', url: 'https://www.blocket.se/bostad', desc: 'Privatuthyrning och andrahand' },
  { name: 'Qasa', url: 'https://www.qasa.se', desc: 'Säker andrahandsuthyrning' },
  { name: 'Bostadsportalen', url: 'https://www.bostadsportalen.se', desc: 'Aggregator för hyresbostäder' },
  { name: 'Samtrygg', url: 'https://www.samtrygg.se', desc: 'Andrahandsuthyrning med trygghet' },
  { name: 'HomeQ', url: 'https://www.homeq.se', desc: 'Bostadsköer utan kötid' },
]

const MOVING_CHECKLIST = [
  { id: 'address-change', label: 'Anmäl adressändring till Skatteverket', timeframe: 'Senast flyttdagen' },
  { id: 'mail-forward', label: 'Beställ eftersändning av post', timeframe: '2 veckor före' },
  { id: 'utilities', label: 'Teckna elavtal för nya bostaden', timeframe: '2-4 veckor före' },
  { id: 'internet', label: 'Beställ bredband/fiber', timeframe: '2-4 veckor före' },
  { id: 'insurance', label: 'Teckna/uppdatera hemförsäkring', timeframe: 'Innan inflyttning' },
  { id: 'cleaning', label: 'Boka flyttstädning', timeframe: '2-4 veckor före' },
  { id: 'parking', label: 'Ordna parkeringstillstånd om behövs', timeframe: '1-2 veckor före' },
  { id: 'keys', label: 'Hämta/lämna nycklar', timeframe: 'Flyttdagen' },
]

export default function RelocationTab() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [salary, setSalary] = useState<string>('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])

  const selectedRegionData = REGION_DATA.find(r => r.name === selectedRegion)

  const toggleCheck = (id: string) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const calculateAffordability = () => {
    if (!selectedRegionData || !salary) return null
    const monthlySalary = parseInt(salary)
    const afterTax = monthlySalary * 0.7 // Rough estimate after tax
    const rentPercentage = Math.round((selectedRegionData.avgRent / afterTax) * 100)
    const remaining = afterTax - selectedRegionData.avgRent

    return {
      afterTax: Math.round(afterTax),
      rentPercentage,
      remaining: Math.round(remaining),
      isAffordable: rentPercentage <= 30,
    }
  }

  const affordability = calculateAffordability()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-orange-50 border-rose-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Flytta för jobb</h2>
            <p className="text-slate-600 mt-1">
              Verktyg för att planera flytt till ny stad för jobbet.
              Jämför boendekostnader och hitta bostäder.
            </p>
          </div>
        </div>
      </Card>

      {/* Region comparison */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rose-600" />
          Jämför regioner
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Region</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Snittshyra</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Snittlön</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Bostadskö</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Pendling</th>
              </tr>
            </thead>
            <tbody>
              {REGION_DATA.map((region) => (
                <tr
                  key={region.name}
                  onClick={() => setSelectedRegion(region.name)}
                  className={cn(
                    "border-b border-slate-100 cursor-pointer transition-all",
                    selectedRegion === region.name
                      ? "bg-rose-50"
                      : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-3 px-2 font-medium text-slate-800">{region.name}</td>
                  <td className="py-3 px-2 text-slate-600">
                    {region.avgRent.toLocaleString('sv-SE')} kr
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    {region.avgSalary.toLocaleString('sv-SE')} kr
                  </td>
                  <td className="py-3 px-2 text-slate-600">{region.housingWait}</td>
                  <td className="py-3 px-2">
                    <div className="flex">
                      {[1, 2, 3].map((level) => (
                        <Car
                          key={level}
                          className={cn(
                            "w-4 h-4",
                            level <= region.commuteIndex ? "text-amber-500" : "text-slate-200"
                          )}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Affordability calculator */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-rose-600" />
          Beräkna bostadsbudget
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Din förväntade månadslön (före skatt)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="T.ex. 45000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Välj region
            </label>
            <select
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Välj region...</option>
              {REGION_DATA.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {affordability && (
          <div className={cn(
            "mt-4 p-4 rounded-xl border",
            affordability.isAffordable
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          )}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-700">Netto (ca)</p>
                <p className="text-xl font-bold text-slate-800">
                  {affordability.afterTax.toLocaleString('sv-SE')} kr
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-700">Hyra av lön</p>
                <p className={cn(
                  "text-xl font-bold",
                  affordability.isAffordable ? "text-emerald-600" : "text-amber-600"
                )}>
                  {affordability.rentPercentage}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-700">Kvar efter hyra</p>
                <p className="text-xl font-bold text-slate-800">
                  {affordability.remaining.toLocaleString('sv-SE')} kr
                </p>
              </div>
            </div>
            <p className={cn(
              "text-sm mt-3 text-center",
              affordability.isAffordable ? "text-emerald-700" : "text-amber-700"
            )}>
              {affordability.isAffordable
                ? '✓ Bra budget! Rekommenderat max är 30% av nettolön på hyra.'
                : '⚠️ Hyran överstiger 30% av nettolön. Överväg billigare alternativ.'}
            </p>
          </div>
        )}
      </Card>

      {/* Housing links */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-rose-600" />
          Hitta bostad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOUSING_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800 group-hover:text-rose-600">
                  {link.name}
                </h4>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-rose-600" />
              </div>
              <p className="text-sm text-slate-700 mt-1">{link.desc}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* Moving checklist */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-rose-600" />
          Flyttchecklista
        </h3>

        <div className="space-y-2">
          {MOVING_CHECKLIST.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                checkedItems.includes(item.id)
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-100 hover:border-slate-200"
              )}
            >
              {checkedItems.includes(item.id) ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
              )}
              <div className="flex-1">
                <span className={cn(
                  "text-sm",
                  checkedItems.includes(item.id) ? "text-emerald-800 line-through" : "text-slate-700"
                )}>
                  {item.label}
                </span>
              </div>
              <span className="text-xs text-slate-600">{item.timeframe}</span>
            </button>
          ))}
        </div>

        {checkedItems.length > 0 && (
          <p className="text-sm text-slate-700 mt-4">
            {checkedItems.length} av {MOVING_CHECKLIST.length} punkter klara
          </p>
        )}
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Tips för att hitta bostad</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Skriv dig i bostadskö tidigt - det tar tid</li>
              <li>• Andrahand via Blocket/Qasa är snabbast</li>
              <li>• Många företag hjälper till med bostad vid flytt</li>
              <li>• Överväg att pendla från närliggande ort initialt</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
