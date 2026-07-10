/**
 * Pitch Tab - Create and practice your elevator pitch
 * Features: Pitch builder, practice mode with timer, AI feedback
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Edit2,
  Star,
  Clock,
  Target,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  X,
  MessageSquare
} from '@/components/ui/icons'
import { Card, Button, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { personalBrandApi, type ElevatorPitch } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'

// Fallback-texter (svenska) — översätts via personalBrand.pitch.* i locale-filerna
const PITCH_TYPES = {
  general: { label: 'Generell', color: 'teal', description: 'Fungerar i alla situationer' },
  'job-specific': { label: 'Jobbspecifik', color: 'blue', description: 'Anpassad för en specifik tjänst' },
  networking: { label: 'Nätverkande', color: 'emerald', description: 'För mingel och events' },
  interview: { label: 'Intervju', color: 'amber', description: 'För jobbintervjuer' },
} as const

const PITCH_TEMPLATES = [
  {
    id: 'classic',
    name: 'Klassisk',
    structure: ['Vem jag är', 'Vad jag gör', 'Vad jag söker', 'Varför vi borde prata'],
    example: 'Hej! Jag heter [Namn] och arbetar som [Roll]. Jag har [X] års erfarenhet av [Område] och är särskilt bra på [Styrka]. Just nu söker jag [Mål]. Jag skulle gärna höra mer om [Deras projekt/företag].'
  },
  {
    id: 'problem-solution',
    name: 'Problem-Lösning',
    structure: ['Problem jag löser', 'Hur jag löser det', 'Resultat jag uppnått', 'Call to action'],
    example: 'Vet du hur företag ofta kämpar med [Problem]? Jag hjälper dem att [Lösning] genom att [Metod]. Senast sparade jag [Företag] [X] timmar/kronor. Låt mig veta om ni har liknande utmaningar!'
  },
  {
    id: 'story',
    name: 'Berättande',
    structure: ['Bakgrund', 'Vändpunkt', 'Nuläge', 'Framtid'],
    example: 'Jag började min karriär som [Start] men upptäckte snart att min passion var [Passion]. Efter att ha [Prestation] insåg jag att jag ville [Mål]. Nu söker jag en möjlighet att [Nästa steg].'
  }
] as const

export default function PitchTab() {
  const { t } = useTranslation()
  const [pitches, setPitches] = useState<ElevatorPitch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPitch, setSelectedPitch] = useState<ElevatorPitch | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPracticing, setIsPracticing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Practice mode state
  const [practiceTime, setPracticeTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<ElevatorPitch>>({
    title: '',
    content: '',
    duration_seconds: 30,
    pitch_type: 'general',
    target_audience: '',
    key_points: []
  })
  const [newKeyPoint, setNewKeyPoint] = useState('')

  // Översatta typ-etiketter och mallar (fallback = svenska konstanterna ovan)
  const pitchTypeLabel = (type: ElevatorPitch['pitch_type']) =>
    t(`personalBrand.pitch.types.${type}.label`, PITCH_TYPES[type].label)

  const templates = useMemo(
    () =>
      PITCH_TEMPLATES.map((tpl) => ({
        id: tpl.id,
        name: t(`personalBrand.pitch.templates.${tpl.id}.name`, tpl.name),
        structure: tpl.structure.map((s, i) =>
          t(`personalBrand.pitch.templates.${tpl.id}.structure${i + 1}`, s)
        ),
        example: t(`personalBrand.pitch.templates.${tpl.id}.example`, tpl.example),
      })),
    [t]
  )

  // Load pitches
  useEffect(() => {
    loadPitches()
  }, [])

  const loadPitches = async () => {
    setIsLoading(true)
    try {
      const data = await personalBrandApi.getPitches()
      setPitches(data)
      if (data.length > 0 && !selectedPitch) {
        setSelectedPitch(data[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setPracticeTime(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startPractice = () => {
    setPracticeTime(0)
    setIsTimerRunning(true)
    setIsPracticing(true)
  }

  const stopPractice = async () => {
    setIsTimerRunning(false)
    if (selectedPitch?.id) {
      await personalBrandApi.recordPractice(selectedPitch.id)
      loadPitches()
    }
  }

  const resetPractice = () => {
    setPracticeTime(0)
    setIsTimerRunning(false)
  }

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) return

    const pitchData: ElevatorPitch = {
      title: formData.title,
      content: formData.content,
      duration_seconds: formData.duration_seconds || 30,
      pitch_type: formData.pitch_type as ElevatorPitch['pitch_type'],
      target_audience: formData.target_audience,
      key_points: formData.key_points || []
    }

    if (selectedPitch?.id && isEditing) {
      await personalBrandApi.updatePitch(selectedPitch.id, pitchData)
    } else {
      const newPitch = await personalBrandApi.addPitch(pitchData)
      if (newPitch) {
        setSelectedPitch(newPitch)
      }
    }

    await loadPitches()
    setIsEditing(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('personalBrand.pitch.confirmDelete', 'Ta bort denna pitch?'))) return
    await personalBrandApi.deletePitch(id)
    if (selectedPitch?.id === id) {
      setSelectedPitch(null)
    }
    await loadPitches()
  }

  const handleEdit = (pitch: ElevatorPitch) => {
    setFormData({
      title: pitch.title,
      content: pitch.content,
      duration_seconds: pitch.duration_seconds,
      pitch_type: pitch.pitch_type,
      target_audience: pitch.target_audience,
      key_points: pitch.key_points
    })
    setSelectedPitch(pitch)
    setIsEditing(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      duration_seconds: 30,
      pitch_type: 'general',
      target_audience: '',
      key_points: []
    })
    setNewKeyPoint('')
  }

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        key_points: [...(prev.key_points || []), newKeyPoint.trim()]
      }))
      setNewKeyPoint('')
    }
  }

  const removeKeyPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points?.filter((_, i) => i !== index) || []
    }))
  }

  const applyTemplate = (template: { example: string; structure: string[] }) => {
    setFormData(prev => ({
      ...prev,
      content: template.example,
      key_points: template.structure
    }))
  }

  const copyToClipboard = () => {
    if (selectedPitch) {
      navigator.clipboard.writeText(selectedPitch.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getTargetTime = () => selectedPitch?.duration_seconds || 30
  const isOverTime = practiceTime > getTargetTime()
  const isNearTarget = practiceTime >= getTargetTime() - 5 && practiceTime <= getTargetTime() + 5

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center shrink-0">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {t('personalBrand.pitch.header.title', 'Din personliga pitch')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('personalBrand.pitch.header.description', 'Skapa och öva på din hiss-pitch. En bra pitch tar 30-60 sekunder och lämnar ett starkt intryck.')}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsEditing(true); setSelectedPitch(null); }}>
            <Plus className="w-4 h-4 mr-1" />
            {t('personalBrand.pitch.newPitch', 'Ny pitch')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            {t('personalBrand.pitch.yourPitches', 'Dina pitchar')}
          </h3>

          {pitches.length === 0 && !isLoading ? (
            <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <EmptyState
                compact
                icon={MessageSquare}
                title={t('personalBrand.pitch.emptyList.title', 'Dina pitchar samlas här')}
                description={t('personalBrand.pitch.emptyList.description', 'En kort presentation av dig själv som du kan öva på och använda när det gäller.')}
                action={{
                  label: t('personalBrand.pitch.emptyList.action', 'Skapa din första pitch'),
                  onClick: () => { resetForm(); setIsEditing(true) },
                }}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {pitches.map((pitch) => {
                const typeInfo = PITCH_TYPES[pitch.pitch_type]
                return (
                  <button
                    key={pitch.id}
                    onClick={() => { setSelectedPitch(pitch); setIsEditing(false); setIsPracticing(false); }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all",
                      selectedPitch?.id === pitch.id
                        ? "border-[var(--c-accent)] dark:border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30"
                        : "border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-500"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{pitch.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            typeInfo.color === 'teal' && "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-accent)]",
                            typeInfo.color === 'blue' && "bg-blue-100 dark:bg-blue-900/50 text-[var(--c-text)] dark:text-blue-300",
                            typeInfo.color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                            typeInfo.color === 'amber' && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                          )}>
                            {pitchTypeLabel(pitch.pitch_type)}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {pitch.duration_seconds}s
                          </span>
                        </div>
                      </div>
                      {pitch.is_favorite && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    {pitch.practice_count && pitch.practice_count > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {t('personalBrand.pitch.practicedTimes', 'Övat {{count}} gånger', { count: pitch.practice_count })}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* Practice Mode */}
            {isPracticing && selectedPitch && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-white dark:bg-stone-800">
                  <div className="text-center py-8">
                    {/* Timer */}
                    <div className={cn(
                      "text-6xl font-bold mb-4 transition-colors",
                      isOverTime ? "text-rose-600 dark:text-rose-400" : isNearTarget ? "text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-gray-100"
                    )}>
                      {formatTime(practiceTime)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {t('personalBrand.pitch.practice.target', 'Mål: {{time}}', { time: formatTime(getTargetTime()) })}
                      {isNearTarget && ` - ${t('personalBrand.pitch.practice.perfectTiming', 'Perfekt timing!')}`}
                      {isOverTime && ` - ${t('personalBrand.pitch.practice.tryShorten', 'Försök korta ner')}`}
                    </p>

                    {/* Controls */}
                    <div className="flex justify-center gap-3 mb-8">
                      {isTimerRunning ? (
                        <Button onClick={stopPractice} size="lg" className="bg-rose-600 hover:bg-rose-700">
                          <Pause className="w-5 h-5 mr-2" />
                          {t('personalBrand.pitch.practice.stop', 'Stoppa')}
                        </Button>
                      ) : (
                        <Button onClick={() => setIsTimerRunning(true)} size="lg">
                          <Play className="w-5 h-5 mr-2" />
                          {practiceTime > 0
                            ? t('personalBrand.pitch.practice.continue', 'Fortsätt')
                            : t('personalBrand.pitch.practice.start', 'Starta')}
                        </Button>
                      )}
                      <Button variant="outline" onClick={resetPractice}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        {t('personalBrand.pitch.practice.reset', 'Återställ')}
                      </Button>
                    </div>

                    {/* Pitch content */}
                    <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-6 text-left max-h-60 overflow-y-auto">
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedPitch.content}</p>
                    </div>

                    {/* Key points */}
                    {selectedPitch.key_points.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {selectedPitch.key_points.map((point, idx) => (
                          <span key={idx} className="px-3 py-1 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-accent)] rounded-full text-sm">
                            {point}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      className="mt-6"
                      onClick={() => setIsPracticing(false)}
                    >
                      {t('personalBrand.pitch.practice.end', 'Avsluta övning')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Edit/Create Mode */}
            {isEditing && !isPracticing && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    {selectedPitch
                      ? t('personalBrand.pitch.form.editTitle', 'Redigera pitch')
                      : t('personalBrand.pitch.form.createTitle', 'Skapa ny pitch')}
                  </h3>

                  {/* Templates */}
                  {!selectedPitch && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                        {t('personalBrand.pitch.form.chooseTemplate', 'Välj en mall att utgå från')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => applyTemplate(template)}
                            className="p-3 rounded-lg border border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/40 transition-all text-left"
                          >
                            <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">{template.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {t('personalBrand.pitch.form.templateParts', '{{count}} delar', { count: template.structure.length })}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {t('personalBrand.pitch.form.titleLabel', 'Titel')}
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                        placeholder={t('personalBrand.pitch.form.titlePlaceholder', 'T.ex. Min generella pitch')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {t('personalBrand.pitch.form.typeLabel', 'Typ')}
                        </label>
                        <select
                          value={formData.pitch_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, pitch_type: e.target.value as ElevatorPitch['pitch_type'] }))}
                          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                        >
                          {(Object.keys(PITCH_TYPES) as Array<keyof typeof PITCH_TYPES>).map((key) => (
                            <option key={key} value={key}>{pitchTypeLabel(key)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {t('personalBrand.pitch.form.durationLabel', 'Mållängd (sek)')}
                        </label>
                        <select
                          value={formData.duration_seconds}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                        >
                          {[30, 45, 60, 90].map((sec) => (
                            <option key={sec} value={sec}>
                              {t('personalBrand.pitch.form.seconds', '{{count}} sekunder', { count: sec })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {t('personalBrand.pitch.form.audienceLabel', 'Målgrupp (valfritt)')}
                      </label>
                      <input
                        type="text"
                        value={formData.target_audience || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                        placeholder={t('personalBrand.pitch.form.audiencePlaceholder', 'T.ex. Rekryterare inom tech')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {t('personalBrand.pitch.form.contentLabel', 'Din pitch')}
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] min-h-[150px] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                        placeholder={t('personalBrand.pitch.form.contentPlaceholder', 'Skriv din pitch här...')}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {t('personalBrand.pitch.form.readingTime', 'Ca {{seconds}} sekunder att läsa ({{chars}} tecken)', {
                          seconds: Math.round((formData.content?.length || 0) / 15),
                          chars: formData.content?.length || 0,
                        })}
                      </p>
                    </div>

                    {/* Key points */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {t('personalBrand.pitch.form.keyPointsLabel', 'Nyckelpoänger att komma ihåg')}
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newKeyPoint}
                          onChange={(e) => setNewKeyPoint(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyPoint())}
                          className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100"
                          placeholder={t('personalBrand.pitch.form.keyPointPlaceholder', 'Lägg till en nyckelpoäng')}
                        />
                        <Button variant="outline" onClick={addKeyPoint} aria-label={t('personalBrand.pitch.form.addKeyPoint', 'Lägg till nyckelpoäng')}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.key_points?.map((point, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                            {point}
                            <button
                              onClick={() => removeKeyPoint(idx)}
                              className="hover:text-rose-600 dark:hover:text-rose-400"
                              aria-label={t('personalBrand.pitch.form.removeKeyPoint', 'Ta bort nyckelpoäng')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={!formData.title?.trim() || !formData.content?.trim()}>
                        <Save className="w-4 h-4 mr-1" />
                        {t('personalBrand.pitch.form.save', 'Spara')}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsEditing(false); resetForm(); }}>
                        {t('personalBrand.pitch.form.cancel', 'Avbryt')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* View Mode */}
            {selectedPitch && !isEditing && !isPracticing && (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedPitch.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          PITCH_TYPES[selectedPitch.pitch_type].color === 'teal' && "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-accent)]",
                          PITCH_TYPES[selectedPitch.pitch_type].color === 'blue' && "bg-blue-100 dark:bg-blue-900/50 text-[var(--c-text)] dark:text-blue-300",
                          PITCH_TYPES[selectedPitch.pitch_type].color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                          PITCH_TYPES[selectedPitch.pitch_type].color === 'amber' && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                        )}>
                          {pitchTypeLabel(selectedPitch.pitch_type)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {t('personalBrand.pitch.view.seconds', '{{count}} sek', { count: selectedPitch.duration_seconds })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(selectedPitch)}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        aria-label={t('common.edit', 'Redigera')}
                      >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => selectedPitch.id && handleDelete(selectedPitch.id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        aria-label={t('common.delete', 'Ta bort')}
                      >
                        <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {selectedPitch.target_audience && (
                    <div className="mb-4 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <Target className="w-4 h-4 inline mr-1" />
                        {t('personalBrand.pitch.view.audience', 'Målgrupp: {{audience}}', { audience: selectedPitch.target_audience })}
                      </p>
                    </div>
                  )}

                  <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-6 mb-4">
                    <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                      {selectedPitch.content}
                    </p>
                  </div>

                  {selectedPitch.key_points.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                        {t('personalBrand.pitch.view.remember', 'Kom ihåg:')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPitch.key_points.map((point, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-accent)] rounded-full text-sm">
                            <CheckCircle className="w-3 h-3" />
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={startPractice} className="bg-[var(--c-solid)] hover:bg-[var(--c-text)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]">
                      <Play className="w-4 h-4 mr-1" />
                      {t('personalBrand.pitch.view.practiceNow', 'Öva nu')}
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard}>
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied
                        ? t('personalBrand.pitch.view.copied', 'Kopierad!')
                        : t('personalBrand.pitch.view.copy', 'Kopiera')}
                    </Button>
                  </div>

                  {selectedPitch.practice_count && selectedPitch.practice_count > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      {t('personalBrand.pitch.view.practicedStats', 'Du har övat på denna pitch {{count}} gånger', { count: selectedPitch.practice_count })}
                      {selectedPitch.last_practiced_at && (
                        <span>
                          {t('personalBrand.pitch.view.lastPracticed', ', senast {{date}}', {
                            date: new Date(selectedPitch.last_practiced_at).toLocaleDateString('sv-SE'),
                          })}
                        </span>
                      )}
                    </p>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Empty state when no pitch selected and not editing */}
            {!selectedPitch && !isEditing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                  <EmptyState
                    icon={Mic}
                    title={t('personalBrand.pitch.empty.title', 'Här skapar du din pitch')}
                    description={t('personalBrand.pitch.empty.description', 'En bra hiss-pitch är nyckeln till att göra ett starkt första intryck. Börja med en generell pitch som du kan anpassa efter situation.')}
                    action={{
                      label: t('personalBrand.pitch.empty.action', 'Skapa pitch'),
                      onClick: () => { resetForm(); setIsEditing(true) },
                    }}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <h3 className="font-semibold text-[var(--c-text)] dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
          {t('personalBrand.pitch.tips.title', 'Tips för en kraftfull pitch')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-sm">
            <p className="font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
              {t('personalBrand.pitch.tips.specific.title', 'Var specifik')}
            </p>
            <p className="text-[var(--c-text)] dark:text-[var(--c-accent)] text-xs mt-1">
              {t('personalBrand.pitch.tips.specific.text', 'Undvik vaga uttalanden. "Jag sparade företaget 2 miljoner" är bättre än "jag är bra på att spara pengar".')}
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
              {t('personalBrand.pitch.tips.adapt.title', 'Anpassa efter lyssnaren')}
            </p>
            <p className="text-[var(--c-text)] dark:text-[var(--c-accent)] text-xs mt-1">
              {t('personalBrand.pitch.tips.adapt.text', 'Ha olika versioner för olika målgrupper och situationer.')}
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
              {t('personalBrand.pitch.tips.aloud.title', 'Öva högt')}
            </p>
            <p className="text-[var(--c-text)] dark:text-[var(--c-accent)] text-xs mt-1">
              {t('personalBrand.pitch.tips.aloud.text', 'En pitch ska kännas naturlig. Öva tills den sitter utan att den låter inövad.')}
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
              {t('personalBrand.pitch.tips.question.title', 'Avsluta med en fråga')}
            </p>
            <p className="text-[var(--c-text)] dark:text-[var(--c-accent)] text-xs mt-1">
              {t('personalBrand.pitch.tips.question.text', 'Bjud in till dialog istället för att bara prata om dig själv.')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
