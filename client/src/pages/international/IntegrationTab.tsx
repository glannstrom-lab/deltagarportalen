/**
 * Integration Tab - Checklist for establishing yourself in Sweden
 * With cloud sync, notes, and target dates
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calendar,
  Download,
  Trash2,
  Save,
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { integrationChecklistApi } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'

interface ChecklistItem {
  id: string
  title: string
  description: string
  timeframe: string
  links?: { label: string; url: string }[]
  priority: 'critical' | 'important' | 'recommended'
}

interface ItemProgress {
  id: string
  completed: boolean
  completedAt?: string
  notes?: string
  targetDate?: string
}

const CHECKLIST_CATEGORIES = [
  {
    id: 'before-arrival',
    title: 'Före ankomst',
    items: [
      {
        id: 'visa',
        title: 'Arbetstillstånd',
        description: 'Ansök om och få godkänt arbetstillstånd innan du reser till Sverige.',
        timeframe: '1-4 månader före',
        priority: 'critical',
        links: [{ label: 'Migrationsverket', url: 'https://www.migrationsverket.se' }],
      },
      {
        id: 'housing-search',
        title: 'Börja leta bostad',
        description: 'Bostadsmarknaden i Sverige är svår. Börja leta i god tid.',
        timeframe: '2-3 månader före',
        priority: 'important',
        links: [{ label: 'Blocket Bostad', url: 'https://www.blocket.se/bostad' }],
      },
      {
        id: 'job-contract',
        title: 'Signera anställningsavtal',
        description: 'Säkerställ att alla villkor är tydliga och skriftliga.',
        timeframe: 'Innan ansökan',
        priority: 'critical',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'first-week',
    title: 'Första veckan',
    items: [
      {
        id: 'personnummer',
        title: 'Ansök om personnummer',
        description: 'Registrera dig hos Skatteverket för att få svenskt personnummer. Krävs för det mesta.',
        timeframe: 'Dag 1-2',
        priority: 'critical',
        links: [{ label: 'Skatteverket', url: 'https://www.skatteverket.se/privat/folkbokforing/flyttatillsverige.4.76a43be412206334b89800052051.html' }],
      },
      {
        id: 'id-card',
        title: 'ID-kort',
        description: 'Boka tid för ID-kort hos Skatteverket (när personnummer är klart).',
        timeframe: 'Efter personnummer',
        priority: 'important',
      },
      {
        id: 'bank-account',
        title: 'Öppna bankkonto',
        description: 'Behövs för lön. Vissa banker kräver personnummer, andra accepterar samordningsnummer.',
        timeframe: 'Vecka 1',
        priority: 'critical',
        links: [
          { label: 'Nordea', url: 'https://www.nordea.se' },
          { label: 'Handelsbanken', url: 'https://www.handelsbanken.se' },
        ],
      },
      {
        id: 'phone',
        title: 'Svenskt mobilnummer',
        description: 'Skaffa svenskt SIM-kort. Behövs för BankID och många tjänster.',
        timeframe: 'Dag 1',
        priority: 'important',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'first-month',
    title: 'Första månaden',
    items: [
      {
        id: 'bankid',
        title: 'BankID',
        description: 'Digital identifiering för nästan allt i Sverige. Kräver personnummer och bankkonto.',
        timeframe: '2-4 veckor',
        priority: 'critical',
      },
      {
        id: 'forsakringskassan',
        title: 'Registrera hos Försäkringskassan',
        description: 'För socialförsäkring, föräldrapenning, etc.',
        timeframe: 'Vecka 2-4',
        priority: 'important',
        links: [{ label: 'Försäkringskassan', url: 'https://www.forsakringskassan.se' }],
      },
      {
        id: 'healthcare',
        title: 'Registrera hos vårdcentral',
        description: 'Välj en vårdcentral i ditt område för primärvård.',
        timeframe: 'Vecka 2-4',
        priority: 'important',
        links: [{ label: '1177 Vårdguiden', url: 'https://www.1177.se' }],
      },
      {
        id: 'sfi',
        title: 'Anmäl dig till SFI',
        description: 'Svenska för invandrare - gratis svenskundervisning.',
        timeframe: 'Vecka 1-4',
        priority: 'recommended',
      },
    ] as ChecklistItem[],
  },
  {
    id: 'settling-in',
    title: 'Etablering (1-3 månader)',
    items: [
      {
        id: 'drivers-license',
        title: 'Körkortsfrågor',
        description: 'Kontrollera om ditt körkort gäller i Sverige eller behöver bytas.',
        timeframe: '1-3 månader',
        priority: 'recommended',
        links: [{ label: 'Transportstyrelsen', url: 'https://www.transportstyrelsen.se' }],
      },
      {
        id: 'pension',
        title: 'Pensionsfrågor',
        description: 'Förstå det svenska pensionssystemet och dina rättigheter.',
        timeframe: '1-3 månader',
        priority: 'recommended',
        links: [{ label: 'Pensionsmyndigheten', url: 'https://www.pensionsmyndigheten.se' }],
      },
      {
        id: 'tax-return',
        title: 'Förstå skattedeklaration',
        description: 'Lär dig om svensk skatt och SINK-skatt för nyanlända.',
        timeframe: 'Inom 3 månader',
        priority: 'important',
      },
    ] as ChecklistItem[],
  },
]

export default function IntegrationTab() {
  const [itemProgress, setItemProgress] = useState<Record<string, ItemProgress>>({})
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load from cloud storage
  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true)
      try {
        const data = await integrationChecklistApi.getProgress()
        if (data?.items) {
          setItemProgress(data.items)
        }
      } catch (error) {
        console.error('[IntegrationTab] Failed to load progress:', error)
        // Fallback to localStorage
        const saved = localStorage.getItem('integration-checklist')
        if (saved) {
          const parsed = JSON.parse(saved)
          // Convert old format to new format
          const converted: Record<string, ItemProgress> = {}
          Object.entries(parsed).forEach(([id, completed]) => {
            converted[id] = { id, completed: !!completed }
          })
          setItemProgress(converted)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadProgress()
  }, [])

  const toggleItem = useCallback(async (id: string) => {
    const currentState = itemProgress[id]?.completed || false
    const newCompleted = !currentState

    // Optimistic update
    setItemProgress(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : undefined,
      }
    }))

    // Sync to cloud
    await integrationChecklistApi.toggleItem(id, newCompleted)
  }, [itemProgress])

  const saveNotes = useCallback(async (id: string) => {
    if (!tempNotes.trim()) return
    setIsSaving(true)

    setItemProgress(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        completed: prev[id]?.completed || false,
        notes: tempNotes,
      }
    }))

    await integrationChecklistApi.updateItemNotes(id, tempNotes)
    setEditingNotes(null)
    setTempNotes('')
    setIsSaving(false)
  }, [tempNotes])

  const setTargetDate = useCallback(async (id: string, date: string) => {
    setItemProgress(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        completed: prev[id]?.completed || false,
        targetDate: date,
      }
    }))

    await integrationChecklistApi.setTargetDate(id, date)
  }, [])

  const exportChecklist = useCallback(async () => {
    const data = await integrationChecklistApi.exportProgress()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `integrations-checklista-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const totalItems = CHECKLIST_CATEGORIES.flatMap(c => c.items).length
  const completedItems = Object.values(itemProgress).filter(p => p.completed).length
  const progress = Math.round((completedItems / totalItems) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Integrationschecklista</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Steg-för-steg guide för att etablera dig i Sverige.
              Markera punkter som klara för att spara din progress.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-sky-100 dark:border-sky-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sky-800 dark:text-sky-200">Din framsteg</span>
            <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{completedItems}/{totalItems} ({progress}%)</span>
          </div>
          <div className="h-3 bg-sky-100 dark:bg-sky-900/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-500 dark:bg-sky-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Export button */}
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={exportChecklist}
            className="gap-2 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700"
          >
            <Download className="w-4 h-4" />
            Exportera checklista
          </Button>
        </div>
      </Card>

      {/* Checklist categories */}
      {CHECKLIST_CATEGORIES.map((category) => (
        <Card key={category.id} className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            {category.title}
          </h3>

          <div className="space-y-3">
            {category.items.map((item) => {
              const itemState = itemProgress[item.id]
              const isCompleted = itemState?.completed || false
              const isExpanded = expandedItem === item.id

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border transition-all overflow-hidden",
                    isCompleted
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
                      : item.priority === 'critical'
                      ? "bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800"
                      : "bg-slate-50 dark:bg-stone-700 border-slate-100 dark:border-stone-600"
                  )}
                >
                  {/* Main item row */}
                  <div
                    className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-stone-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn(
                            "font-medium",
                            isCompleted ? "text-emerald-800 dark:text-emerald-200 line-through" : "text-gray-800 dark:text-gray-100"
                          )}>
                            {item.title}
                          </h4>
                          {item.priority === 'critical' && !isCompleted && (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-full font-medium">
                              Kritiskt
                            </span>
                          )}
                          {itemState?.notes && (
                            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs rounded-full">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              Anteckning
                            </span>
                          )}
                          {itemState?.targetDate && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(itemState.targetDate).toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          isCompleted ? "text-emerald-600 dark:text-emerald-300" : "text-gray-600 dark:text-gray-300"
                        )}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {item.timeframe}
                          </span>
                          {item.links && (
                            <div className="flex gap-2 flex-wrap">
                              {item.links.map((link) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1"
                                >
                                  {link.label}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedItem(isExpanded ? null : item.id)
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-expanded={isExpanded}
                        aria-label="Visa mer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-inherit"
                      >
                        <div className="p-4 space-y-4 bg-white/50 dark:bg-black/20">
                          {/* Target date */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Måldatum
                            </label>
                            <Input
                              type="date"
                              value={itemState?.targetDate?.split('T')[0] || ''}
                              onChange={(e) => setTargetDate(item.id, e.target.value)}
                              className="max-w-[200px] text-sm"
                            />
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              Anteckningar
                            </label>
                            {editingNotes === item.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Lägg till anteckningar..."
                                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-stone-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveNotes(item.id)}
                                    disabled={isSaving}
                                    className="gap-1"
                                  >
                                    <Save className="w-3 h-3" />
                                    {isSaving ? 'Sparar...' : 'Spara'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingNotes(null)
                                      setTempNotes('')
                                    }}
                                  >
                                    Avbryt
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {itemState?.notes ? (
                                  <div
                                    className="p-2 bg-white dark:bg-stone-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-700"
                                    onClick={() => {
                                      setEditingNotes(item.id)
                                      setTempNotes(itemState.notes || '')
                                    }}
                                  >
                                    {itemState.notes}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingNotes(item.id)
                                      setTempNotes('')
                                    }}
                                    className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300"
                                  >
                                    + Lägg till anteckning
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Completed timestamp */}
                          {isCompleted && itemState?.completedAt && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Avklarat {new Date(itemState.completedAt).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {/* Tips */}
      <Card className="bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sky-900 dark:text-sky-100">Bra att veta</p>
            <ul className="text-sm text-sky-700 dark:text-sky-300 mt-2 space-y-1">
              <li>- Personnummer kan ta 2-8 veckor att få</li>
              <li>- BankID kräver svenskt personnummer och bankkonto</li>
              <li>- Många tjänster fungerar inte utan BankID</li>
              <li>- Spara alla kvitton och dokument digitalt</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
