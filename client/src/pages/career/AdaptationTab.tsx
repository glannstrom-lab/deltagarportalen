/**
 * Adaptation Tab - Workplace adaptation and support
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accessibility, FileText, Building2, User, CheckCircle2,
  ChevronRight, Download, AlertCircle, HelpCircle
} from 'lucide-react'
import { Card, Button, Checkbox } from '@/components/ui'

interface AdaptationCategory {
  id: string
  title: string
  description: string
  options: { key: string; label: string }[]
}

// Category definitions with option keys
const categoryDefs = [
  {
    id: 'physical',
    titleKey: 'career.adaptation.categories.physical.title',
    descriptionKey: 'career.adaptation.categories.physical.description',
    optionKeys: ['chair', 'desk', 'lighting', 'hearing', 'vision', 'soundproofing'],
  },
  {
    id: 'cognitive',
    titleKey: 'career.adaptation.categories.cognitive.title',
    descriptionKey: 'career.adaptation.categories.cognitive.description',
    optionKeys: ['writtenInstructions', 'reminders', 'structuredTasks', 'notes', 'checklists', 'quietEnvironment'],
  },
  {
    id: 'organizational',
    titleKey: 'career.adaptation.categories.organizational.title',
    descriptionKey: 'career.adaptation.categories.organizational.description',
    optionKeys: ['flextime', 'partTime', 'remote', 'shorterDays', 'longerBreaks', 'gradualReturn'],
  },
  {
    id: 'social',
    titleKey: 'career.adaptation.categories.social.title',
    descriptionKey: 'career.adaptation.categories.social.description',
    optionKeys: ['feedback', 'checkins', 'mentor', 'smallTeam', 'expectations', 'conflict'],
  },
]

export default function AdaptationTab() {
  const { t } = useTranslation()

  // Build translated categories
  const adaptationCategories = useMemo(() => categoryDefs.map(cat => ({
    id: cat.id,
    title: t(cat.titleKey),
    description: t(cat.descriptionKey),
    options: cat.optionKeys.map(key => ({
      key,
      label: t(`career.adaptation.categories.${cat.id}.options.${key}`)
    }))
  })), [t])
  const [selectedNeeds, setSelectedNeeds] = useState<Record<string, string[]>>({})
  const [showResults, setShowResults] = useState(false)

  const toggleOption = (categoryId: string, optionKey: string) => {
    setSelectedNeeds(prev => {
      const current = prev[categoryId] || []
      const updated = current.includes(optionKey)
        ? current.filter(o => o !== optionKey)
        : [...current, optionKey]
      return { ...prev, [categoryId]: updated }
    })
  }

  const generateDocument = () => {
    // Generate PDF with selected adaptations
    alert(t('career.adaptation.createDocument') + '...')
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
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('career.adaptation.workAdaptation')}</h3>
            <p className="text-slate-600">
              {t('career.adaptation.introText')}
            </p>
          </div>
        </div>
      </Card>

      {/* Self Assessment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {t('career.adaptation.identifyNeeds')}
        </h3>
        <p className="text-slate-600 mb-6">
          {t('career.adaptation.selectHelpful')}
        </p>

        <div className="space-y-6">
          {adaptationCategories.map((category) => (
            <div key={category.id} className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-1">{category.title}</h4>
              <p className="text-sm text-slate-500 mb-3">{category.description}</p>
              
              <div className="grid gap-2">
                {category.options.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedNeeds[category.id]?.includes(option.key) || false}
                      onCheckedChange={() => toggleOption(category.id, option.key)}
                    />
                    <span className="text-slate-700">{option.label}</span>
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
                  {t('career.adaptation.youSelected', { count: totalSelected })}
                </p>
                <p className="text-sm text-indigo-700">
                  {t('career.adaptation.generateDoc')}
                </p>
              </div>
              <Button onClick={generateDocument}>
                <Download className="w-4 h-4 mr-1" />
                {t('career.adaptation.createDocument')}
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
              <h4 className="font-semibold text-slate-800 mb-2">{t('career.adaptation.yourRights')}</h4>
              <p className="text-sm text-slate-600">
                {t('career.adaptation.rightsText')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('career.adaptation.fkSupport')}</h4>
              <p className="text-sm text-slate-600">
                {t('career.adaptation.fkSupportText')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
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
