/**
 * ResourcesTab - Goal Templates, Job Collections, and Best Practices
 * Resource library for consultants to use with participants
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target,
  Briefcase,
  BookOpen,
  FileText,
  Search,
  Plus,
  Copy,
  Star,
  ChevronRight,
  Clock,
  Users,
  Lightbulb,
  CheckCircle,
  Folder,
  Tag,
  Download,
  Share2,
  MoreVertical,
  X,
  Save,
  Loader2,
  Edit2,
  Trash2,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface GoalTemplate {
  id: string
  title: string
  category: 'cv' | 'job_search' | 'interview' | 'networking' | 'skills'
  description: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
  usageCount: number
  isStarred: boolean
}

interface JobCollection {
  id: string
  name: string
  description: string
  industry: string
  jobCount: number
  createdAt: string
  sharedWith: number
}

interface BestPractice {
  id: string
  title: string
  category: 'onboarding' | 'coaching' | 'followup' | 'crisis'
  description: string
  steps: string[]
}

// Template Card Component
function TemplateCard({
  template,
  onUse,
  onStar,
  onEdit,
  onDelete,
}: {
  template: GoalTemplate
  onUse: (template: GoalTemplate) => void
  onStar: (id: string) => void
  onEdit: (template: GoalTemplate) => void
  onDelete: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const categoryLabels = {
    cv: { label: 'CV', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    job_search: { label: 'Jobbsökning', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    interview: { label: 'Intervju', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
    networking: { label: 'Nätverk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    skills: { label: 'Kompetens', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  }

  const category = categoryLabels[template.category]
  const isDefault = template.id.startsWith('default-')

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', category.color)}>
          {category.label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStar(template.id)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            disabled={isDefault}
          >
            <Star className={cn(
              'w-4 h-4',
              template.isStarred ? 'fill-amber-400 text-amber-400' : 'text-stone-400 dark:text-stone-500'
            )} />
          </button>
          {!isDefault && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                <MoreVertical className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => { onEdit(template); setShowMenu(false) }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Redigera
                  </button>
                  <button
                    onClick={() => { onDelete(template.id); setShowMenu(false) }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta bort
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
        {template.title}
      </h4>
      <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">
        {template.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Använd {template.usageCount} gånger
        </span>
        <Button size="sm" onClick={() => onUse(template)}>
          <Copy className="w-3 h-3 mr-1.5" />
          Använd
        </Button>
      </div>
    </Card>
  )
}

// Job Collection Card Component
function JobCollectionCard({
  collection,
  onView,
  onShare,
}: {
  collection: JobCollection
  onView: (collection: JobCollection) => void
  onShare: (id: string) => void
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
          <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <button className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
          <MoreVertical className="w-4 h-4 text-stone-500 dark:text-stone-400" />
        </button>
      </div>
      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
        {collection.name}
      </h4>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
        {collection.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mb-4">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {collection.jobCount} jobb
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {collection.industry}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(collection)}>
          Visa
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onShare(collection.id)}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

// Best Practice Card Component
function BestPracticeCard({
  practice,
  onView,
}: {
  practice: BestPractice
  onView: (practice: BestPractice) => void
}) {
  const categoryLabels = {
    onboarding: { label: 'Onboarding', icon: Users },
    coaching: { label: 'Coachning', icon: Lightbulb },
    followup: { label: 'Uppföljning', icon: Clock },
    crisis: { label: 'Krishantering', icon: Target },
  }

  const category = categoryLabels[practice.category]
  const Icon = category.icon

  return (
    <button
      onClick={() => onView(practice)}
      className="w-full text-left p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white dark:bg-stone-900 rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-1">
            {practice.title}
          </h4>
          <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
            {practice.description}
          </p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
            {practice.steps.length} steg
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  )
}

// Template Form Dialog
function TemplateFormDialog({
  isOpen,
  onClose,
  template,
  onSave,
  saving,
}: {
  isOpen: boolean
  onClose: () => void
  template: GoalTemplate | null
  onSave: (data: Partial<GoalTemplate>) => void
  saving: boolean
}) {
  const [formData, setFormData] = useState<Partial<GoalTemplate>>({
    title: '',
    category: 'cv',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  })

  useEffect(() => {
    if (template) {
      setFormData(template)
    } else {
      setFormData({
        title: '',
        category: 'cv',
        description: '',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
      })
    }
  }, [template, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {template ? 'Redigera mall' : 'Skapa ny mall'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Titel
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
              placeholder="T.ex. Förbättra CV till 80+ poäng"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Kategori
            </label>
            <select
              value={formData.category || 'cv'}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as GoalTemplate['category'] }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
            >
              <option value="cv">CV</option>
              <option value="job_search">Jobbsökning</option>
              <option value="interview">Intervju</option>
              <option value="networking">Nätverk</option>
              <option value="skills">Kompetens</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Beskrivning
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100 resize-none"
              rows={2}
              placeholder="Kort beskrivning av mallen"
            />
          </div>
          <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
            <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-3">SMART-mål</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">
                  <strong>S</strong>pecifikt
                </label>
                <input
                  type="text"
                  value={formData.specific || ''}
                  onChange={e => setFormData(prev => ({ ...prev, specific: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
                  placeholder="Vad exakt ska uppnås?"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">
                  <strong>M</strong>ätbart
                </label>
                <input
                  type="text"
                  value={formData.measurable || ''}
                  onChange={e => setFormData(prev => ({ ...prev, measurable: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
                  placeholder="Hur mäts framgång?"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">
                  <strong>A</strong>chievable (Uppnåeligt)
                </label>
                <input
                  type="text"
                  value={formData.achievable || ''}
                  onChange={e => setFormData(prev => ({ ...prev, achievable: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
                  placeholder="Hur är det möjligt att uppnå?"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">
                  <strong>R</strong>elevant
                </label>
                <input
                  type="text"
                  value={formData.relevant || ''}
                  onChange={e => setFormData(prev => ({ ...prev, relevant: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
                  placeholder="Varför är detta viktigt?"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">
                  <strong>T</strong>idsbestämt
                </label>
                <input
                  type="text"
                  value={formData.timeBound || ''}
                  onChange={e => setFormData(prev => ({ ...prev, timeBound: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100"
                  placeholder="När ska det vara klart?"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={() => onSave(formData)} disabled={saving || !formData.title}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {template ? 'Spara ändringar' : 'Skapa mall'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Template Detail Dialog
function TemplateDetailDialog({
  isOpen,
  onClose,
  template,
  onUseForParticipant,
}: {
  isOpen: boolean
  onClose: () => void
  template: GoalTemplate | null
  onUseForParticipant: () => void
}) {
  if (!isOpen || !template) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {template.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-stone-600 dark:text-stone-400">{template.description}</p>
          <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-stone-900 dark:text-stone-100">SMART-mål</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-amber-600 dark:text-amber-400">S - Specifikt:</span>
                <span className="text-stone-600 dark:text-stone-400 ml-2">{template.specific}</span>
              </div>
              <div>
                <span className="font-medium text-amber-600 dark:text-amber-400">M - Mätbart:</span>
                <span className="text-stone-600 dark:text-stone-400 ml-2">{template.measurable}</span>
              </div>
              <div>
                <span className="font-medium text-amber-600 dark:text-amber-400">A - Uppnåeligt:</span>
                <span className="text-stone-600 dark:text-stone-400 ml-2">{template.achievable}</span>
              </div>
              <div>
                <span className="font-medium text-amber-600 dark:text-amber-400">R - Relevant:</span>
                <span className="text-stone-600 dark:text-stone-400 ml-2">{template.relevant}</span>
              </div>
              <div>
                <span className="font-medium text-amber-600 dark:text-amber-400">T - Tidsbestämt:</span>
                <span className="text-stone-600 dark:text-stone-400 ml-2">{template.timeBound}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Använd {template.usageCount} gånger
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
          <Button onClick={onUseForParticipant}>
            <Copy className="w-4 h-4 mr-2" />
            Använd för deltagare
          </Button>
        </div>
      </div>
    </div>
  )
}

// Best Practice Detail Dialog
function BestPracticeDetailDialog({
  isOpen,
  onClose,
  practice,
}: {
  isOpen: boolean
  onClose: () => void
  practice: BestPractice | null
}) {
  if (!isOpen || !practice) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {practice.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-stone-600 dark:text-stone-400">{practice.description}</p>
          <div className="space-y-3">
            <h4 className="font-medium text-stone-900 dark:text-stone-100">Steg</h4>
            <ol className="space-y-2">
              {practice.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-stone-600 dark:text-stone-400 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex items-center justify-end p-4 border-t border-stone-200 dark:border-stone-700">
          <Button onClick={onClose}>
            Stäng
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ResourcesTab() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<'templates' | 'collections' | 'practices'>('templates')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Template state
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<GoalTemplate[]>([])
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [showTemplateDetail, setShowTemplateDetail] = useState(false)

  // Best Practice state
  const [selectedPractice, setSelectedPractice] = useState<BestPractice | null>(null)
  const [showPracticeDetail, setShowPracticeDetail] = useState(false)

  // Load templates from database
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('consultant_goal_templates')
        .select('*')
        .or(`consultant_id.eq.${user.id},is_shared.eq.true`)
        .order('usage_count', { ascending: false })

      if (error) throw error

      const formattedTemplates: GoalTemplate[] = (data || []).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        description: t.description || '',
        specific: t.specific || '',
        measurable: t.measurable || '',
        achievable: t.achievable || '',
        relevant: t.relevant || '',
        timeBound: t.time_bound || '',
        usageCount: t.usage_count || 0,
        isStarred: t.is_starred || false,
      }))

      setTemplates(formattedTemplates)
    } catch (err) {
      console.error('Error loading templates:', err)
      // Use default templates as fallback
      setTemplates(getDefaultTemplates())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTemplates = (): GoalTemplate[] => [
    {
      id: 'default-1',
      title: 'Förbättra CV till 80+ poäng',
      category: 'cv',
      description: 'Ett stegvist mål för att förbättra CV-kvaliteten med fokus på ATS-optimering.',
      specific: 'Förbättra mitt CV så att det får minst 80 poäng i ATS-systemet',
      measurable: 'CV-poäng ökar från nuvarande till minst 80/100',
      achievable: 'Genomförbart genom att följa CV-guiden och få feedback',
      relevant: 'Högre CV-poäng ökar chansen att passera första urvalet',
      timeBound: '2 veckor',
      usageCount: 47,
      isStarred: true,
    },
    {
      id: 'default-2',
      title: 'Skicka 10 ansökningar per vecka',
      category: 'job_search',
      description: 'Systematiskt jobbsökande med fokus på kvalitativa ansökningar.',
      specific: 'Skicka 10 kvalitativa jobbansökningar varje vecka',
      measurable: '10 ansökningar loggade i systemet per vecka',
      achievable: 'Ca 2 ansökningar per dag, 5 dagar i veckan',
      relevant: 'Fler ansökningar ökar chansen att få intervjuer',
      timeBound: 'Pågående, utvärdering varje fredag',
      usageCount: 34,
      isStarred: false,
    },
    {
      id: 'default-3',
      title: 'Förbereda för intervju',
      category: 'interview',
      description: 'Strukturerad förberedelse inför en kommande intervju.',
      specific: 'Förbereda svar på vanliga frågor och researcha företaget',
      measurable: '10 förberedda svar, 5 frågor till arbetsgivaren',
      achievable: 'Använd intervjusimulatorn och guider',
      relevant: 'God förberedelse ökar chansen att imponera',
      timeBound: '3 dagar före intervjun',
      usageCount: 28,
      isStarred: true,
    },
  ]

  const handleSaveTemplate = async (data: Partial<GoalTemplate>) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const templateData = {
        consultant_id: user.id,
        title: data.title,
        category: data.category,
        description: data.description,
        specific: data.specific,
        measurable: data.measurable,
        achievable: data.achievable,
        relevant: data.relevant,
        time_bound: data.timeBound,
        is_shared: false,
        updated_at: new Date().toISOString(),
      }

      if (editingTemplate && !editingTemplate.id.startsWith('default-')) {
        // Update existing
        const { error } = await supabase
          .from('consultant_goal_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)

        if (error) throw error

        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id
            ? { ...t, ...data }
            : t
        ))
      } else {
        // Create new
        const { data: newTemplate, error } = await supabase
          .from('consultant_goal_templates')
          .insert({ ...templateData, usage_count: 0, is_starred: false })
          .select()
          .single()

        if (error) throw error

        if (newTemplate) {
          setTemplates(prev => [{
            id: newTemplate.id,
            title: newTemplate.title,
            category: newTemplate.category,
            description: newTemplate.description || '',
            specific: newTemplate.specific || '',
            measurable: newTemplate.measurable || '',
            achievable: newTemplate.achievable || '',
            relevant: newTemplate.relevant || '',
            timeBound: newTemplate.time_bound || '',
            usageCount: 0,
            isStarred: false,
          }, ...prev])
        }
      }

      setShowTemplateForm(false)
      setEditingTemplate(null)
    } catch (err) {
      console.error('Error saving template:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStarTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id)
    if (!template || id.startsWith('default-')) return

    const newStarred = !template.isStarred

    // Optimistic update
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isStarred: newStarred } : t
    ))

    try {
      await supabase
        .from('consultant_goal_templates')
        .update({ is_starred: newStarred })
        .eq('id', id)
    } catch (err) {
      console.error('Error starring template:', err)
      // Revert on error
      setTemplates(prev => prev.map(t =>
        t.id === id ? { ...t, isStarred: !newStarred } : t
      ))
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (id.startsWith('default-')) return
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return

    try {
      await supabase
        .from('consultant_goal_templates')
        .delete()
        .eq('id', id)

      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Error deleting template:', err)
    }
  }

  const handleUseTemplate = async (template: GoalTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateDetail(true)

    // Increment usage count
    if (!template.id.startsWith('default-')) {
      try {
        await supabase
          .from('consultant_goal_templates')
          .update({ usage_count: template.usageCount + 1 })
          .eq('id', template.id)

        setTemplates(prev => prev.map(t =>
          t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
        ))
      } catch (err) {
        console.error('Error updating usage count:', err)
      }
    }
  }

  const handleUseForParticipant = () => {
    // In a real implementation, this would open a participant selector
    // and create a goal for the selected participant
    alert('Funktionen för att tilldela mål till deltagare kommer snart!')
    setShowTemplateDetail(false)
    setSelectedTemplate(null)
  }

  // Static data for collections and practices
  const jobCollections: JobCollection[] = [
    {
      id: '1',
      name: 'IT & Tech - Stockholm',
      description: 'Aktuella IT-jobb i Stockholmsområdet',
      industry: 'IT',
      jobCount: 24,
      createdAt: new Date().toISOString(),
      sharedWith: 3,
    },
    {
      id: '2',
      name: 'Ekonomi & Administration',
      description: 'Ekonomijobb för nyutexaminerade',
      industry: 'Ekonomi',
      jobCount: 18,
      createdAt: new Date().toISOString(),
      sharedWith: 5,
    },
    {
      id: '3',
      name: 'Vård & Omsorg',
      description: 'Jobb inom vårdsektorn',
      industry: 'Vård',
      jobCount: 31,
      createdAt: new Date().toISOString(),
      sharedWith: 2,
    },
  ]

  const bestPractices: BestPractice[] = [
    {
      id: '1',
      title: 'Första mötet med ny deltagare',
      category: 'onboarding',
      description: 'Checklista och tips för att skapa en bra start med nya deltagare.',
      steps: [
        'Välkomna och presentera dig',
        'Gå igenom deltagarens bakgrund och mål',
        'Förklara hur portalen fungerar',
        'Sätt upp första SMARTA-målet tillsammans',
        'Boka nästa möte',
      ],
    },
    {
      id: '2',
      title: 'Effektiv coachning-session',
      category: 'coaching',
      description: 'Struktur för en 30-minuters coachning-session.',
      steps: [
        'Check-in: Hur mår deltagaren? (5 min)',
        'Review: Genomgång av mål och framsteg (10 min)',
        'Fokus: Djupdyk i aktuellt område (10 min)',
        'Action: Sätt nya delmål (5 min)',
      ],
    },
    {
      id: '3',
      title: 'Uppföljning av inaktiv deltagare',
      category: 'followup',
      description: 'Hur du återengagerar en deltagare som blivit inaktiv.',
      steps: [
        'Skicka vänligt meddelande',
        'Ring om inget svar inom 2 dagar',
        'Fråga om hinder och utmaningar',
        'Anpassa målen om nödvändigt',
        'Sätt upp kort uppföljning',
      ],
    },
    {
      id: '4',
      title: 'Hantera motgångar och avslag',
      category: 'crisis',
      description: 'Stötta deltagare som fått avslag eller känner sig nedstämda.',
      steps: [
        'Lyssna aktivt och validera känslor',
        'Normalisera: avslag är en del av processen',
        'Analysera: vad kan vi lära oss?',
        'Fokusera framåt: nästa steg',
        'Följ upp inom kort',
      ],
    },
  ]

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSection('templates')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'templates'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <Target className="w-5 h-5" />
          Målmallar
        </button>
        <button
          onClick={() => setActiveSection('collections')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'collections'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <Briefcase className="w-5 h-5" />
          Jobbsamlingar
        </button>
        <button
          onClick={() => setActiveSection('practices')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'practices'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <BookOpen className="w-5 h-5" />
          Best Practices
        </button>
      </div>

      {/* Goal Templates Section */}
      {activeSection === 'templates' && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
              <input
                type="text"
                placeholder="Sök mallar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent focus:border-amber-500 dark:focus:border-amber-400',
                  'text-stone-900 dark:text-stone-100'
                )}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={cn(
                'px-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="all">Alla kategorier</option>
              <option value="cv">CV</option>
              <option value="job_search">Jobbsökning</option>
              <option value="interview">Intervju</option>
              <option value="networking">Nätverk</option>
              <option value="skills">Kompetens</option>
            </select>
            <Button onClick={() => { setEditingTemplate(null); setShowTemplateForm(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa mall
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <LoadingState message="Laddar mallar..." />
          )}

          {/* Templates Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                  onStar={handleStarTemplate}
                  onEdit={(t) => { setEditingTemplate(t); setShowTemplateForm(true) }}
                  onDelete={handleDeleteTemplate}
                />
              ))}
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 text-stone-300 dark:text-stone-500 mx-auto mb-4" />
              <p className="text-stone-500 dark:text-stone-400">
                Inga mallar matchade din sökning
              </p>
            </Card>
          )}
        </>
      )}

      {/* Job Collections Section */}
      {activeSection === 'collections' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-stone-500 dark:text-stone-400">
              Skapa och dela jobbsamlingar med dina deltagare
            </p>
            <Button onClick={() => alert('Funktion för att skapa jobbsamlingar kommer snart!')}>
              <Plus className="w-4 h-4 mr-2" />
              Ny samling
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCollections.map(collection => (
              <JobCollectionCard
                key={collection.id}
                collection={collection}
                onView={() => alert(`Visa samling: ${collection.name}\n\nDenna funktion kommer snart!`)}
                onShare={() => alert(`Dela samling med deltagare:\n${collection.name}\n\nDenna funktion kommer snart!`)}
              />
            ))}
          </div>
        </>
      )}

      {/* Best Practices Section */}
      {activeSection === 'practices' && (
        <>
          <p className="text-stone-500 dark:text-stone-400">
            Beprövade metoder och checklistor för effektivt konsulentarbete
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.map(practice => (
              <BestPracticeCard
                key={practice.id}
                practice={practice}
                onView={(p) => { setSelectedPractice(p); setShowPracticeDetail(true) }}
              />
            ))}
          </div>
        </>
      )}

      {/* Template Form Dialog */}
      <TemplateFormDialog
        isOpen={showTemplateForm}
        onClose={() => { setShowTemplateForm(false); setEditingTemplate(null) }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        saving={saving}
      />

      {/* Template Detail Dialog */}
      <TemplateDetailDialog
        isOpen={showTemplateDetail}
        onClose={() => { setShowTemplateDetail(false); setSelectedTemplate(null) }}
        template={selectedTemplate}
        onUseForParticipant={handleUseForParticipant}
      />

      {/* Best Practice Detail Dialog */}
      <BestPracticeDetailDialog
        isOpen={showPracticeDetail}
        onClose={() => { setShowPracticeDetail(false); setSelectedPractice(null) }}
        practice={selectedPractice}
      />
    </div>
  )
}
