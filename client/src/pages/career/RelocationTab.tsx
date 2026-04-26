/**
 * Relocation Tab - Housing and moving assistance with cloud storage
 * Features: Region comparison, budget calculator, checklist (saved), profile integration
 */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Home, MapPin, Calculator, TrendingUp, ExternalLink, CheckCircle,
  AlertCircle, Car, Loader2, Cloud, CloudOff, Star, Heart, X
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { relocationApi, type RelocationPreferences } from '@/services/careerApi'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { showToast } from '@/components/Toast'

// Swedish regions with cost of living data
const REGION_DATA = [
  { id: 'stockholm', name: 'Stockholm', avgRent: 14500, avgSalary: 48000, commuteIndex: 3, housingWait: '5-15 år', jobMarket: 'Mycket stark' },
  { id: 'gothenburg', name: 'Göteborg', avgRent: 10500, avgSalary: 44000, commuteIndex: 2, housingWait: '3-8 år', jobMarket: 'Stark' },
  { id: 'malmo', name: 'Malmö', avgRent: 9500, avgSalary: 42000, commuteIndex: 2, housingWait: '2-5 år', jobMarket: 'Stark' },
  { id: 'uppsala', name: 'Uppsala', avgRent: 11000, avgSalary: 41000, commuteIndex: 2, housingWait: '4-10 år', jobMarket: 'God' },
  { id: 'linkoping', name: 'Linköping', avgRent: 8500, avgSalary: 40000, commuteIndex: 1, housingWait: '1-3 år', jobMarket: 'God' },
  { id: 'vasteras', name: 'Västerås', avgRent: 8000, avgSalary: 40000, commuteIndex: 1, housingWait: '1-3 år', jobMarket: 'God' },
  { id: 'orebro', name: 'Örebro', avgRent: 7500, avgSalary: 39000, commuteIndex: 1, housingWait: '1-2 år', jobMarket: 'Medel' },
  { id: 'umea', name: 'Umeå', avgRent: 8500, avgSalary: 39000, commuteIndex: 1, housingWait: '1-3 år', jobMarket: 'God' },
  { id: 'jonkoping', name: 'Jönköping', avgRent: 7000, avgSalary: 38000, commuteIndex: 1, housingWait: '1-2 år', jobMarket: 'Medel' },
  { id: 'norrkoping', name: 'Norrköping', avgRent: 7000, avgSalary: 37000, commuteIndex: 1, housingWait: '1-2 år', jobMarket: 'Medel' },
  { id: 'lulea', name: 'Luleå', avgRent: 7500, avgSalary: 40000, commuteIndex: 1, housingWait: '0-1 år', jobMarket: 'Växande (tech)' },
  { id: 'sundsvall', name: 'Sundsvall', avgRent: 6500, avgSalary: 37000, commuteIndex: 1, housingWait: '0-1 år', jobMarket: 'Medel' },
]

// Housing links
const HOUSING_LINKS = [
  { key: 'blocket', name: 'Blocket Bostad', url: 'https://www.blocket.se/bostad', desc: 'Störst utbud, privata & mäklare' },
  { key: 'qasa', name: 'Qasa', url: 'https://www.qasa.se', desc: 'Trygga hyreskontrakt' },
  { key: 'bostadsportalen', name: 'Bostadsportalen', url: 'https://www.bostadsportalen.se', desc: 'Bostadsköer & förstahandskontrakt' },
  { key: 'samtrygg', name: 'Samtrygg', url: 'https://www.samtrygg.se', desc: 'Andrahandsuthyrning med garanti' },
  { key: 'homeq', name: 'HomeQ', url: 'https://www.homeq.se', desc: 'Hyresrätter utan kö' },
  { key: 'bostad-direkt', name: 'Bostad Direkt', url: 'https://www.bostaddirekt.com', desc: 'Möblerade lägenheter' },
]

// Moving checklist
const MOVING_CHECKLIST = [
  { id: 'housing-queue', label: 'Ställ dig i bostadskö', timeframe: '6+ månader innan', priority: 'high' },
  { id: 'job-search', label: 'Börja söka jobb i nya staden', timeframe: '3-6 månader innan', priority: 'high' },
  { id: 'address-change', label: 'Anmäl adressändring (Skatteverket)', timeframe: '1 vecka innan', priority: 'high' },
  { id: 'mail-forward', label: 'Eftersändning av post', timeframe: '1 vecka innan', priority: 'medium' },
  { id: 'utilities', label: 'Säg upp/teckna el & värme', timeframe: '2 veckor innan', priority: 'medium' },
  { id: 'internet', label: 'Beställ internet till nya bostaden', timeframe: '2 veckor innan', priority: 'medium' },
  { id: 'insurance', label: 'Uppdatera hemförsäkring', timeframe: 'Flyttdagen', priority: 'high' },
  { id: 'bank', label: 'Meddela bank om ny adress', timeframe: 'Efter flytt', priority: 'low' },
  { id: 'healthcare', label: 'Byt vårdcentral', timeframe: 'Efter flytt', priority: 'low' },
  { id: 'cleaning', label: 'Städa gamla bostaden', timeframe: 'Flyttdagen', priority: 'high' },
  { id: 'parking', label: 'Ordna parkeringstillstånd', timeframe: 'Innan flytt', priority: 'low' },
  { id: 'keys', label: 'Lämna nycklar till gamla hyresvärden', timeframe: 'Flyttdagen', priority: 'high' },
]

export default function RelocationTab() {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  // State
  const [targetRegions, setTargetRegions] = useState<string[]>([])
  const [currentRegion, setCurrentRegion] = useState<string>('')
  const [salary, setSalary] = useState<string>('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [profileLocation, setProfileLocation] = useState<string>('')

  // Cloud storage state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load relocation preferences
        const prefs = await relocationApi.get()
        if (prefs) {
          setTargetRegions(prefs.target_regions || [])
          setCurrentRegion(prefs.current_region || '')
          setSalary(prefs.expected_salary?.toString() || '')
          setCheckedItems(prefs.checklist_completed || [])
          setLastSaved(new Date(prefs.updated_at))
        }

        // Load profile location
        const profile = await unifiedProfileApi.getProfile()
        if (profile?.core?.location) {
          setProfileLocation(profile.core.location)
          // If no current region set, try to match profile location
          if (!prefs?.current_region) {
            const matchedRegion = REGION_DATA.find(r =>
              profile.core.location.toLowerCase().includes(r.name.toLowerCase())
            )
            if (matchedRegion) {
              setCurrentRegion(matchedRegion.id)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load relocation data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-save when changes are made
  useEffect(() => {
    if (!hasUnsavedChanges || isLoading) return

    const saveTimeout = setTimeout(async () => {
      await saveToCloud()
    }, 2000)

    return () => clearTimeout(saveTimeout)
  }, [targetRegions, currentRegion, salary, checkedItems, hasUnsavedChanges, isLoading])

  const saveToCloud = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      await relocationApi.save({
        target_regions: targetRegions,
        current_region: currentRegion || undefined,
        expected_salary: salary ? parseInt(salary) : undefined,
        checklist_completed: checkedItems,
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Failed to save:', err)
      showToast.error(isEn ? 'Failed to save' : 'Kunde inte spara')
    } finally {
      setIsSaving(false)
    }
  }, [targetRegions, currentRegion, salary, checkedItems, isSaving, isEn])

  const toggleTargetRegion = (regionId: string) => {
    setTargetRegions(prev =>
      prev.includes(regionId) ? prev.filter(r => r !== regionId) : [...prev, regionId]
    )
    setHasUnsavedChanges(true)
  }

  const toggleCheck = (id: string) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
    setHasUnsavedChanges(true)
  }

  const calculateAffordability = (regionId: string) => {
    const region = REGION_DATA.find(r => r.id === regionId)
    if (!region || !salary) return null

    const monthlySalary = parseInt(salary)
    const afterTax = monthlySalary * 0.7
    const rentPercentage = Math.round((region.avgRent / afterTax) * 100)
    const remaining = afterTax - region.avgRent

    return {
      afterTax: Math.round(afterTax),
      rentPercentage,
      remaining: Math.round(remaining),
      isAffordable: rentPercentage <= 30,
      region
    }
  }

  // Get best target region affordability
  const getBestAffordability = () => {
    if (targetRegions.length === 0 || !salary) return null
    const affordabilities = targetRegions
      .map(r => calculateAffordability(r))
      .filter(Boolean)
      .sort((a, b) => (a?.rentPercentage || 100) - (b?.rentPercentage || 100))
    return affordabilities[0]
  }

  const bestAffordability = getBestAffordability()
  const checklistProgress = Math.round((checkedItems.length / MOVING_CHECKLIST.length) * 100)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-900" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          {isEn ? 'Loading...' : 'Laddar...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Status */}
      <div className="flex items-center justify-end gap-2 text-sm">
        {isSaving ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEn ? 'Saving...' : 'Sparar...'}
          </span>
        ) : hasUnsavedChanges ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <CloudOff className="w-4 h-4" />
            {isEn ? 'Unsaved changes' : 'Osparade ändringar'}
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-brand-900 dark:text-brand-400">
            <Cloud className="w-4 h-4" />
            {isEn ? 'Saved' : 'Sparat'}
          </span>
        ) : null}
      </div>

      {/* Header with profile location */}
      <Card className="p-6 bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-900/20 dark:to-sky-900/20 border-brand-200 dark:border-brand-900">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-brand-900 dark:text-brand-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isEn ? 'Relocation Planning' : 'Planera flytt'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isEn
                ? 'Compare regions, calculate your budget, and track your moving progress.'
                : 'Jämför regioner, beräkna din budget och följ din flyttprocess.'}
            </p>
            {profileLocation && (
              <p className="text-sm text-brand-900 dark:text-brand-300 mt-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {isEn ? 'Current location from profile:' : 'Nuvarande plats från profil:'} <strong>{profileLocation}</strong>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      {(targetRegions.length > 0 || checkedItems.length > 0) && (
        <Card className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-200 dark:border-violet-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                {isEn ? 'Your Relocation Plan' : 'Din flyttplan'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {targetRegions.length} {isEn ? 'target regions' : 'målregioner'} • {checklistProgress}% {isEn ? 'checklist done' : 'av checklistan klar'}
              </p>
            </div>
            {bestAffordability && (
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                bestAffordability.isAffordable
                  ? "bg-brand-100 text-brand-900 dark:bg-brand-900/30 dark:text-brand-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}>
                {isEn ? 'Best option:' : 'Bäst alternativ:'} {bestAffordability.region?.name} ({bestAffordability.rentPercentage}% {isEn ? 'of income' : 'av inkomst'})
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Budget Calculator */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-brand-900 dark:text-brand-400" />
          {isEn ? 'Budget Calculator' : 'Budgetkalkylator'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isEn ? 'Expected monthly salary (SEK)' : 'Förväntad månadslön (kr)'}
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-700 text-gray-800 dark:text-gray-100"
              placeholder="35000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isEn ? 'Current region' : 'Nuvarande region'}
            </label>
            <select
              value={currentRegion}
              onChange={(e) => { setCurrentRegion(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">{isEn ? 'Select...' : 'Välj...'}</option>
              {REGION_DATA.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {isEn ? 'Click on regions below to add them as targets:' : 'Klicka på regioner nedan för att lägga till dem som mål:'}
        </p>
      </Card>

      {/* Region Comparison */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-900 dark:text-brand-400" />
          {isEn ? 'Compare Regions' : 'Jämför regioner'}
          {targetRegions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300 rounded-full text-xs">
              {targetRegions.length} {isEn ? 'selected' : 'valda'}
            </span>
          )}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-600">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300"></th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Region' : 'Region'}</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Avg Rent' : 'Snitthyra'}</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Avg Salary' : 'Snittlön'}</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Queue' : 'Kötid'}</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Job Market' : 'Jobbmarknad'}</th>
                {salary && <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">{isEn ? 'Rent %' : 'Hyra %'}</th>}
              </tr>
            </thead>
            <tbody>
              {REGION_DATA.map((region) => {
                const isTarget = targetRegions.includes(region.id)
                const isCurrent = currentRegion === region.id
                const affordability = salary ? calculateAffordability(region.id) : null

                return (
                  <tr
                    key={region.id}
                    onClick={() => toggleTargetRegion(region.id)}
                    className={cn(
                      "border-b border-stone-100 dark:border-stone-700 cursor-pointer transition-all",
                      isTarget && "bg-brand-50 dark:bg-brand-900/20",
                      isCurrent && "bg-blue-50 dark:bg-blue-900/20",
                      !isTarget && !isCurrent && "hover:bg-stone-50 dark:hover:bg-stone-700"
                    )}
                  >
                    <td className="py-3 px-2">
                      {isTarget ? (
                        <Heart className="w-5 h-5 text-brand-900 fill-current" />
                      ) : (
                        <Heart className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{region.name}</span>
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          {isEn ? 'Current' : 'Nu'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {region.avgRent.toLocaleString('sv-SE')} kr
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {region.avgSalary.toLocaleString('sv-SE')} kr
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{region.housingWait}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        region.jobMarket.includes('stark') || region.jobMarket.includes('Mycket') ? "bg-brand-100 text-brand-900 dark:bg-brand-900/30 dark:text-brand-300" :
                        region.jobMarket.includes('Växande') ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                        "bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                      )}>
                        {region.jobMarket}
                      </span>
                    </td>
                    {salary && affordability && (
                      <td className="py-3 px-2">
                        <span className={cn(
                          "font-semibold",
                          affordability.isAffordable ? "text-brand-900 dark:text-brand-400" : "text-amber-600 dark:text-amber-400"
                        )}>
                          {affordability.rentPercentage}%
                        </span>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          {isEn ? '* Recommendation: Rent should not exceed 30% of net income' : '* Rekommendation: Hyran bör inte överstiga 30% av nettoinkomst'}
        </p>
      </Card>

      {/* Housing Links */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-brand-900 dark:text-brand-400" />
          {isEn ? 'Find Housing' : 'Hitta bostad'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOUSING_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-brand-300 dark:hover:border-brand-900 hover: transition-all group bg-white dark:bg-stone-700"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-brand-900 dark:group-hover:text-brand-400">
                  {link.name}
                </h4>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-brand-900 dark:group-hover:text-brand-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{link.desc}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* Moving Checklist */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-900 dark:text-brand-400" />
            {isEn ? 'Moving Checklist' : 'Flyttchecklista'}
          </h3>
          <span className="text-sm font-medium text-brand-900 dark:text-brand-400">
            {checkedItems.length}/{MOVING_CHECKLIST.length} ({checklistProgress}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-brand-700 to-brand-900 transition-all duration-300"
            style={{ width: `${checklistProgress}%` }}
          />
        </div>

        <div className="space-y-2">
          {MOVING_CHECKLIST.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                checkedItems.includes(item.id)
                  ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-900"
                  : "bg-stone-50 dark:bg-stone-700 border-stone-100 dark:border-stone-600 hover:border-stone-200 dark:hover:border-stone-500"
              )}
            >
              {checkedItems.includes(item.id) ? (
                <CheckCircle className="w-5 h-5 text-brand-900 dark:text-brand-400 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-500 shrink-0" />
              )}
              <div className="flex-1">
                <span className={cn(
                  "text-sm",
                  checkedItems.includes(item.id) ? "text-brand-900 dark:text-brand-200 line-through" : "text-gray-700 dark:text-gray-300"
                )}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  item.priority === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                  item.priority === 'medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                  "bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                )}>
                  {item.priority === 'high' ? (isEn ? 'Important' : 'Viktigt') :
                   item.priority === 'medium' ? (isEn ? 'Medium' : 'Medel') : (isEn ? 'Low' : 'Låg')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.timeframe}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {isEn ? 'Tips for Moving' : 'Tips för flytt'}
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
              <li>• {isEn ? 'Register for housing queues as early as possible - some have 10+ year waits' : 'Ställ dig i bostadskö så tidigt som möjligt - vissa har 10+ års väntetid'}</li>
              <li>• {isEn ? 'Consider subletting or renting privately while waiting for queue' : 'Överväg att hyra i andra hand medan du väntar på förstahandskontrakt'}</li>
              <li>• {isEn ? 'Secure a job before moving if possible - easier to get housing' : 'Säkra ett jobb innan flytt om möjligt - lättare att få bostad'}</li>
              <li>• {isEn ? 'Budget for higher costs the first months (deposits, furnishing)' : 'Budgetera för högre kostnader första månaderna (deposition, möbler)'}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
