/**
 * Adaptation Tab - Workplace adaptation and support
 * Now with cloud storage for persistent data
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accessibility, FileText, Building2, User, CheckCircle2,
  ChevronRight, Download, AlertCircle, HelpCircle, X, Info,
  Zap, Users, Clock, Layout, Loader2, Save, Cloud, CloudOff
} from '@/components/ui/icons'
import { Card, Button, Checkbox } from '@/components/ui'
import { cn } from '@/lib/utils'
import { adaptationsApi, type UserAdaptations } from '@/services/careerApi'
import { showToast } from '@/components/Toast'

// Category definitions with option keys
const categoryDefs = [
  {
    id: 'physical',
    titleKey: 'career.adaptation.categories.physical.title',
    descriptionKey: 'career.adaptation.categories.physical.description',
    icon: <Zap className="w-5 h-5" />,
    optionKeys: ['chair', 'desk', 'lighting', 'hearing', 'vision', 'soundproofing'],
  },
  {
    id: 'cognitive',
    titleKey: 'career.adaptation.categories.cognitive.title',
    descriptionKey: 'career.adaptation.categories.cognitive.description',
    icon: <Layout className="w-5 h-5" />,
    optionKeys: ['writtenInstructions', 'reminders', 'structuredTasks', 'notes', 'checklists', 'quietEnvironment'],
  },
  {
    id: 'organizational',
    titleKey: 'career.adaptation.categories.organizational.title',
    descriptionKey: 'career.adaptation.categories.organizational.description',
    icon: <Clock className="w-5 h-5" />,
    optionKeys: ['flextime', 'partTime', 'remote', 'shorterDays', 'longerBreaks', 'gradualReturn'],
  },
  {
    id: 'social',
    titleKey: 'career.adaptation.categories.social.title',
    descriptionKey: 'career.adaptation.categories.social.description',
    icon: <Users className="w-5 h-5" />,
    optionKeys: ['feedback', 'checkins', 'mentor', 'smallTeam', 'expectations', 'conflict'],
  },
]

export default function AdaptationTab() {
  const { t, i18n } = useTranslation()

  // Build translated categories
  const adaptationCategories = useMemo(() => categoryDefs.map(cat => ({
    id: cat.id,
    title: t(cat.titleKey),
    description: t(cat.descriptionKey),
    icon: cat.icon,
    options: cat.optionKeys.map(key => ({
      key,
      label: t(`career.adaptation.categories.${cat.id}.options.${key}`)
    }))
  })), [t])

  const [selectedNeeds, setSelectedNeeds] = useState<Record<string, string[]>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // Cloud storage state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load adaptations from cloud on mount
  useEffect(() => {
    const loadAdaptations = async () => {
      try {
        const data = await adaptationsApi.get()
        if (data) {
          setSelectedNeeds({
            physical: data.physical_adaptations || [],
            cognitive: data.cognitive_adaptations || [],
            organizational: data.organizational_adaptations || [],
            social: data.social_adaptations || []
          })
          setLastSaved(new Date(data.updated_at))
        }
      } catch (err) {
        console.error('Failed to load adaptations:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadAdaptations()
  }, [])

  // Auto-save when changes are made (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || isLoading) return

    const saveTimeout = setTimeout(async () => {
      await saveToCloud()
    }, 2000) // Auto-save after 2 seconds of no changes

    return () => clearTimeout(saveTimeout)
  }, [selectedNeeds, hasUnsavedChanges, isLoading])

  const saveToCloud = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const summary = generateSummaryText()
      await adaptationsApi.save({
        physical_adaptations: selectedNeeds.physical || [],
        cognitive_adaptations: selectedNeeds.cognitive || [],
        organizational_adaptations: selectedNeeds.organizational || [],
        social_adaptations: selectedNeeds.social || [],
        summary
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Failed to save adaptations:', err)
      showToast.error(i18n.language === 'en' ? 'Failed to save' : 'Kunde inte spara')
    } finally {
      setIsSaving(false)
    }
  }, [selectedNeeds, isSaving, i18n.language])

  const generateSummaryText = useCallback(() => {
    const parts: string[] = []
    Object.entries(selectedNeeds).forEach(([catId, options]) => {
      const cat = adaptationCategories.find(c => c.id === catId)
      if (cat && options.length > 0) {
        parts.push(`${cat.title}: ${options.map(o => cat.options.find(opt => opt.key === o)?.label).filter(Boolean).join(', ')}`)
      }
    })
    return parts.join('\n')
  }, [selectedNeeds, adaptationCategories])

  const toggleOption = (categoryId: string, optionKey: string) => {
    setSelectedNeeds(prev => {
      const current = prev[categoryId] || []
      const updated = current.includes(optionKey)
        ? current.filter(o => o !== optionKey)
        : [...current, optionKey]
      return { ...prev, [categoryId]: updated }
    })
    setHasUnsavedChanges(true)
  }

  const generateDocument = () => {
    // Generate a text document with selected adaptations
    const summary = generateSummaryText()
    if (!summary) {
      showToast.error(i18n.language === 'en' ? 'Select at least one adaptation first' : 'Välj minst en anpassning först')
      return
    }

    const header = i18n.language === 'en'
      ? 'WORKPLACE ADAPTATIONS - PERSONAL SUMMARY'
      : 'ARBETSPLATSANPASSNINGAR - PERSONLIG SAMMANFATTNING'

    const date = new Date().toLocaleDateString(i18n.language === 'en' ? 'en-SE' : 'sv-SE')

    const document = `${header}
================================
${i18n.language === 'en' ? 'Date' : 'Datum'}: ${date}

${summary}

================================
${i18n.language === 'en' ? 'Generated from Deltagarportalen' : 'Genererat från Deltagarportalen'}
`

    // Create and download text file
    const blob = new Blob([document], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anpassningar-${date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast.success(i18n.language === 'en' ? 'Document downloaded!' : 'Dokument nedladdat!')
  }

  const generateSummary = () => {
    return generateSummaryText()
  }

  const clearAll = async () => {
    setSelectedNeeds({})
    setHasUnsavedChanges(true)
    // Also delete from cloud
    try {
      await adaptationsApi.delete()
      setLastSaved(null)
      setHasUnsavedChanges(false)
      showToast.success(i18n.language === 'en' ? 'All cleared' : 'Allt rensat')
    } catch (err) {
      console.error('Failed to clear adaptations:', err)
    }
  }

  const totalSelected = Object.values(selectedNeeds).flat().length
  const completionPercentage = Math.round((Object.keys(selectedNeeds).filter(
    id => selectedNeeds[id]?.length > 0
  ).length / adaptationCategories.length) * 100)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mr-3" aria-hidden="true" />
        <span className="text-gray-600 dark:text-gray-400">
          {i18n.language === 'en' ? 'Loading your adaptations...' : 'Laddar dina anpassningar...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-end gap-2 text-sm">
        {isSaving ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {i18n.language === 'en' ? 'Saving...' : 'Sparar...'}
          </span>
        ) : hasUnsavedChanges ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <CloudOff className="w-4 h-4" />
            {i18n.language === 'en' ? 'Unsaved changes' : 'Osparade ändringar'}
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Cloud className="w-4 h-4" />
            {i18n.language === 'en' ? 'Saved to cloud' : 'Sparat i molnet'}
          </span>
        ) : null}
      </div>

      {/* Introduction */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
            <Accessibility className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('career.adaptation.workAdaptation')}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('career.adaptation.introText')}
            </p>
          </div>
        </div>
      </Card>

      {/* Progress Indicator */}
      {totalSelected > 0 && (
        <Card className="p-4 bg-gradient-to-r from-teal-50 to-violet-50 dark:from-teal-900/20 dark:to-violet-900/20 border border-teal-200 dark:border-teal-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
              {i18n.language === 'en' ? 'Your adaptations' : 'Dina anpassningar'}
            </h4>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
              {totalSelected} {i18n.language === 'en' ? 'selected' : 'valda'}
            </span>
          </div>
          <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {completionPercentage}% {i18n.language === 'en' ? 'of categories' : 'av kategorierna'} - {Object.keys(selectedNeeds).filter(
              id => selectedNeeds[id]?.length > 0
            ).length}/{adaptationCategories.length} {i18n.language === 'en' ? 'categories filled' : 'kategorier ifyllda'}
          </p>
        </Card>
      )}

      {/* Self Assessment */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t('career.adaptation.identifyNeeds')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('career.adaptation.selectHelpful')}
        </p>

        <div className="space-y-3">
          {adaptationCategories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-all',
                  expandedCategory === category.id
                    ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-teal-300 dark:hover:border-teal-600',
                  selectedNeeds[category.id]?.length > 0 && 'border-teal-300 dark:border-teal-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    selectedNeeds[category.id]?.length > 0 ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400'
                  )}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{category.title}</h4>
                    {selectedNeeds[category.id]?.length > 0 && (
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{selectedNeeds[category.id]?.length} valda</p>
                    )}
                  </div>
                  <ChevronRight className={cn(
                    'w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform',
                    expandedCategory === category.id && 'rotate-90'
                  )} />
                </div>
              </button>

              {expandedCategory === category.id && (
                <div className="mt-2 p-4 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {category.options.map((option) => (
                      <div
                        key={option.key}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer group"
                        onMouseEnter={() => setShowTooltip(option.key)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <label className="flex items-start gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedNeeds[category.id]?.includes(option.key) || false}
                            onChange={() => toggleOption(category.id, option.key)}
                            className="mt-1 w-5 h-5 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:text-teal-400 cursor-pointer"
                          />
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{option.label}</span>
                        </label>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setShowTooltip(showTooltip === option.key ? null : option.key)
                          }}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Section */}
        {totalSelected > 0 && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-600">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {i18n.language === 'en' ? 'Summary' : 'Sammanfattning'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{generateSummary()}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={generateDocument}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
              >
                <Download className="w-4 h-4" />
                {i18n.language === 'en' ? 'Download document' : 'Ladda ner dokument'}
              </Button>
              <Button
                variant="outline"
                onClick={saveToCloud}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {i18n.language === 'en' ? 'Save now' : 'Spara nu'}
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
                {i18n.language === 'en' ? 'Clear all' : 'Rensa alla'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('career.adaptation.yourRights')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('career.adaptation.rightsText')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('career.adaptation.fkSupport')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('career.adaptation.fkSupportText')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Templates */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t('career.adaptation.dialogTemplates')}
        </h3>
        <div className="space-y-3">
          {[
            { key: 'employer', title: t('career.adaptation.templates.employer.title'), description: t('career.adaptation.templates.employer.description') },
            { key: 'fk', title: t('career.adaptation.templates.fk.title'), description: t('career.adaptation.templates.fk.description') },
            { key: 'consultant', title: t('career.adaptation.templates.consultant.title'), description: t('career.adaptation.templates.consultant.description') },
          ].map((template, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-transparent hover:border-teal-200 dark:hover:border-teal-700 transition-all cursor-pointer"
            >
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{template.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
