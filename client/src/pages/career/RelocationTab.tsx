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
      <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Flytta för jobb</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Verktyg för att planera flytt till ny stad för jobbet.
              Jämför boendekostnader och hitta bostäder.
            </p>
          </div>
        </div>
      </Card>

      {/* Region comparison */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Jämför regioner
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-600">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Region</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Snittshyra</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Snittlön</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Bostadskö</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Pendling</th>
              </tr>
            </thead>
            <tbody>
              {REGION_DATA.map((region) => (
                <tr
                  key={region.name}
                  onClick={() => setSelectedRegion(region.name)}
                  className={cn(
                    "border-b border-stone-100 dark:border-stone-700 cursor-pointer transition-all",
                    selectedRegion === region.name
                      ? "bg-teal-50 dark:bg-teal-900/20"
                      : "hover:bg-stone-50 dark:hover:bg-stone-700"
                  )}
                >
                  <td className="py-3 px-2 font-medium text-gray-800 dark:text-gray-100">{region.name}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                    {region.avgRent.toLocaleString('sv-SE')} kr
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                    {region.avgSalary.toLocaleString('sv-SE')} kr
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{region.housingWait}</td>
                  <td className="py-3 px-2">
                    <div className="flex">
                      {[1, 2, 3].map((level) => (
                        <Car
                          key={level}
                          className={cn(
                            "w-4 h-4",
                            level <= region.commuteIndex ? "text-amber-500 dark:text-amber-400" : "text-stone-200 dark:text-stone-600"
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
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Beräkna bostadsbudget
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Din förväntade månadslön (före skatt)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100"
              placeholder="T.ex. 45000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Välj region
            </label>
            <select
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100"
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
              ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
          )}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Netto (ca)</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {affordability.afterTax.toLocaleString('sv-SE')} kr
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Hyra av lön</p>
                <p className={cn(
                  "text-xl font-bold",
                  affordability.isAffordable ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {affordability.rentPercentage}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Kvar efter hyra</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {affordability.remaining.toLocaleString('sv-SE')} kr
                </p>
              </div>
            </div>
            <p className={cn(
              "text-sm mt-3 text-center",
              affordability.isAffordable ? "text-teal-700 dark:text-teal-300" : "text-amber-700 dark:text-amber-300"
            )}>
              {affordability.isAffordable
                ? '✓ Bra budget! Rekommenderat max är 30% av nettolön på hyra.'
                : '⚠️ Hyran överstiger 30% av nettolön. Överväg billigare alternativ.'}
            </p>
          </div>
        )}
      </Card>

      {/* Housing links */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Hitta bostad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOUSING_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all group bg-white dark:bg-stone-700"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  {link.name}
                </h4>
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{link.desc}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* Moving checklist */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
                  ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700"
                  : "bg-stone-50 dark:bg-stone-700 border-stone-100 dark:border-stone-600 hover:border-stone-200 dark:hover:border-stone-500"
              )}
            >
              {checkedItems.includes(item.id) ? (
                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-500 shrink-0" />
              )}
              <div className="flex-1">
                <span className={cn(
                  "text-sm",
                  checkedItems.includes(item.id) ? "text-teal-800 dark:text-teal-200 line-through" : "text-gray-700 dark:text-gray-300"
                )}>
                  {item.label}
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.timeframe}</span>
            </button>
          ))}
        </div>

        {checkedItems.length > 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4">
            {checkedItems.length} av {MOVING_CHECKLIST.length} punkter klara
          </p>
        )}
      </Card>

      {/* Tips */}
      <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-teal-900 dark:text-teal-100">Tips för att hitta bostad</p>
            <ul className="text-sm text-teal-700 dark:text-teal-300 mt-2 space-y-1">
              <li>- Skriv dig i bostadskö tidigt - det tar tid</li>
              <li>- Andrahand via Blocket/Qasa är snabbast</li>
              <li>- Många företag hjälper till med bostad vid flytt</li>
              <li>- Överväg att pendla från närliggande ort initialt</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
