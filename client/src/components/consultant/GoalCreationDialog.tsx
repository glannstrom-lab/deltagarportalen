/**
 * GoalCreationDialog
 * Dialog för att skapa SMARTA-mål för deltagare med mallar och AI-förslag
 */

import { useState, useEffect } from 'react'
import {
  X,
  Target,
  User,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Calendar,
  Flag,
  Lightbulb,
  FileText,
  Briefcase,
  MessageSquare,
  Users,
  GraduationCap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
  ats_score?: number | null
  has_cv?: boolean
  saved_jobs_count?: number
}

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
  defaultDeadlineDays: number
  icon: React.ElementType
}

interface GoalCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedParticipant?: Participant
}

const goalTemplates: GoalTemplate[] = [
  {
    id: 'cv-improve',
    title: 'Förbättra CV till 80+ poäng',
    category: 'cv',
    description: 'Uppnå ett CV-score på minst 80% genom optimering',
    specific: 'Förbättra mitt CV så att det får minst 80 poäng i ATS-systemet genom att optimera nyckelord, struktur och innehåll',
    measurable: 'CV-poängen ökar från nuvarande nivå till minst 80/100',
    achievable: 'Genomförbart genom att följa CV-guiden steg för steg och få feedback',
    relevant: 'Högre CV-poäng ökar chansen att passera automatiska urvalssystem',
    timeBound: '2 veckor',
    defaultDeadlineDays: 14,
    icon: FileText,
  },
  {
    id: 'job-applications',
    title: 'Skicka 10 ansökningar per vecka',
    category: 'job_search',
    description: 'Systematiskt jobbsökande med fokus på kvalitet',
    specific: 'Skicka 10 kvalitativa, anpassade jobbansökningar varje vecka inom mitt yrkesområde',
    measurable: '10 ansökningar loggade i systemet varje vecka',
    achievable: 'Ca 2 ansökningar per dag, 5 dagar i veckan är rimligt',
    relevant: 'Fler kvalitativa ansökningar ökar chansen att få intervjuer',
    timeBound: 'Pågående, utvärdering varje fredag',
    defaultDeadlineDays: 7,
    icon: Briefcase,
  },
  {
    id: 'interview-prep',
    title: 'Förbereda för intervju',
    category: 'interview',
    description: 'Strukturerad förberedelse inför kommande intervju',
    specific: 'Förbereda svar på de 10 vanligaste intervjufrågorna och researcha företaget grundligt',
    measurable: '10 förberedda svar nedskrivna, 5 frågor till arbetsgivaren, företagsresearch klar',
    achievable: 'Använd intervjusimulatorn och läs guider i kunskapsbanken',
    relevant: 'God förberedelse ökar chansen att imponera och få jobbet',
    timeBound: 'Klart minst 2 dagar före intervjun',
    defaultDeadlineDays: 5,
    icon: MessageSquare,
  },
  {
    id: 'linkedin-network',
    title: 'Utöka LinkedIn-nätverket',
    category: 'networking',
    description: 'Strategiskt nätverkande för att öka synlighet',
    specific: 'Anslut med 20 nya relevanta kontakter inom min bransch och engagera mig i minst 5 inlägg per vecka',
    measurable: '20 nya accepterade kontakter, 5 kommentarer/delningar per vecka',
    achievable: 'Skicka 3-4 personliga inbjudningar dagligen',
    relevant: 'Större nätverk ökar chansen att hitta dolda jobbmöjligheter',
    timeBound: '1 månad',
    defaultDeadlineDays: 30,
    icon: Users,
  },
  {
    id: 'new-skill',
    title: 'Lära sig ny kompetens',
    category: 'skills',
    description: 'Strukturerat lärande av efterfrågad kompetens',
    specific: 'Genomföra en online-kurs inom vald kompetens och tillämpa kunskapen i ett eget projekt',
    measurable: 'Kurs genomförd med certifikat, projekt dokumenterat',
    achievable: '1-2 timmar studier per dag under kursperioden',
    relevant: 'Ökar anställningsbarhet och ger konkurrensfördelar',
    timeBound: '4 veckor',
    defaultDeadlineDays: 28,
    icon: GraduationCap,
  },
]

const categoryInfo = {
  cv: { label: 'CV', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  job_search: { label: 'Jobbsökning', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  interview: { label: 'Intervju', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  networking: { label: 'Nätverk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  skills: { label: 'Kompetens', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
}

const priorities = [
  { value: 'HIGH', label: 'Hög', color: 'text-rose-600' },
  { value: 'MEDIUM', label: 'Medel', color: 'text-amber-600' },
  { value: 'LOW', label: 'Låg', color: 'text-stone-500' },
]

export function GoalCreationDialog({
  isOpen,
  onClose,
  onSuccess,
  preselectedParticipant,
}: GoalCreationDialogProps) {
  const [step, setStep] = useState<'participant' | 'template' | 'customize'>('participant')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    preselectedParticipant || null
  )
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [customGoal, setCustomGoal] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    deadline: '',
  })
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && !preselectedParticipant) {
      fetchParticipants()
    }
    if (preselectedParticipant) {
      setSelectedParticipant(preselectedParticipant)
      setStep('template')
    }
  }, [isOpen, preselectedParticipant])

  useEffect(() => {
    if (selectedTemplate) {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + selectedTemplate.defaultDeadlineDays)

      setCustomGoal({
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        specific: selectedTemplate.specific,
        measurable: selectedTemplate.measurable,
        achievable: selectedTemplate.achievable,
        relevant: selectedTemplate.relevant,
        timeBound: selectedTemplate.timeBound,
        priority: 'MEDIUM',
        deadline: deadline.toISOString().split('T')[0],
      })
    }
  }, [selectedTemplate])

  const fetchParticipants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email, ats_score, has_cv, saved_jobs_count')
        .eq('consultant_id', user.id)

      if (data) {
        setParticipants(data)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const generateAISuggestions = async () => {
    if (!selectedParticipant) return

    setAiLoading(true)
    try {
      // Simulate AI suggestions based on participant data
      const suggestions: string[] = []

      if (!selectedParticipant.has_cv) {
        suggestions.push('Skapa ett första utkast av CV inom 1 vecka')
      } else if ((selectedParticipant.ats_score || 0) < 70) {
        suggestions.push('Förbättra CV-poängen till minst 70% genom att lägga till nyckelord')
      }

      if ((selectedParticipant.saved_jobs_count || 0) < 5) {
        suggestions.push('Spara minst 10 relevanta jobbannonser att analysera')
      }

      suggestions.push('Genomför en mock-intervju via simulatorn')
      suggestions.push('Uppdatera LinkedIn-profilen med ny sammanfattning')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedParticipant || !customGoal.title) return

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('consultant_goals')
        .insert({
          consultant_id: user.id,
          participant_id: selectedParticipant.participant_id,
          title: customGoal.title,
          description: customGoal.description,
          specific: customGoal.specific,
          measurable: customGoal.measurable,
          achievable: customGoal.achievable,
          relevant: customGoal.relevant,
          time_bound: customGoal.timeBound,
          priority: customGoal.priority,
          deadline: customGoal.deadline ? new Date(customGoal.deadline).toISOString() : null,
          status: 'NOT_STARTED',
          progress: 0,
        })

      if (error) throw error

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('participant')
    setSelectedParticipant(null)
    setSelectedTemplate(null)
    setCustomGoal({
      title: '',
      description: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: '',
      priority: 'MEDIUM',
      deadline: '',
    })
    setAiSuggestions([])
    setSearchQuery('')
  }

  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Skapa mål
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {step === 'participant' && 'Välj deltagare'}
              {step === 'template' && 'Välj mall eller skapa eget'}
              {step === 'customize' && 'Anpassa målet'}
            </p>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Select Participant */}
          {step === 'participant' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Sök deltagare..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-violet-500',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredParticipants.map(p => (
                  <button
                    key={p.participant_id}
                    onClick={() => {
                      setSelectedParticipant(p)
                      setStep('template')
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl transition-colors',
                      'hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-medium">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {p.email}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-stone-500">CV: {p.ats_score || '—'}%</p>
                      <p className="text-stone-400">{p.saved_jobs_count || 0} sparade jobb</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 'template' && (
            <div className="space-y-6">
              {/* Selected participant */}
              {selectedParticipant && (
                <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                  <User className="w-5 h-5 text-violet-600" />
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {selectedParticipant.first_name} {selectedParticipant.last_name}
                  </span>
                  {!preselectedParticipant && (
                    <button
                      onClick={() => setStep('participant')}
                      className="ml-auto text-sm text-violet-600 hover:underline"
                    >
                      Ändra
                    </button>
                  )}
                </div>
              )}

              {/* AI Suggestions */}
              <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      AI-förslag
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={generateAISuggestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Generera förslag'
                    )}
                  </Button>
                </div>
                {aiSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCustomGoal(prev => ({
                            ...prev,
                            title: suggestion,
                            description: '',
                            specific: suggestion,
                            measurable: '',
                            achievable: '',
                            relevant: '',
                            timeBound: '',
                          }))
                          setStep('customize')
                        }}
                        className="w-full text-left p-3 bg-white dark:bg-stone-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="text-stone-700 dark:text-stone-300">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Klicka på "Generera förslag" för att få AI-baserade målförslag baserat på deltagarens profil.
                  </p>
                )}
              </div>

              {/* Templates */}
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Välj mall
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {goalTemplates.map(template => {
                    const Icon = template.icon
                    const category = categoryInfo[template.category]
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template)
                          setStep('customize')
                        }}
                        className="text-left p-4 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-violet-500 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                            <Icon className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', category.color)}>
                                {category.label}
                              </span>
                            </div>
                            <h4 className="font-medium text-stone-900 dark:text-stone-100">
                              {template.title}
                            </h4>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Create custom */}
              <button
                onClick={() => {
                  setSelectedTemplate(null)
                  setStep('customize')
                }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 hover:border-violet-500 transition-colors text-center"
              >
                <Target className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                <p className="font-medium text-stone-700 dark:text-stone-300">
                  Skapa eget mål
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Skapa ett anpassat SMART-mål från grunden
                </p>
              </button>
            </div>
          )}

          {/* Step 3: Customize Goal */}
          {step === 'customize' && (
            <div className="space-y-5">
              {/* Goal Title */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Måltitel *
                </label>
                <input
                  type="text"
                  value={customGoal.title}
                  onChange={e => setCustomGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Vad ska uppnås?"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-violet-500',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>

              {/* SMART Fields */}
              <div className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                <h4 className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-600" />
                  SMART-definition
                </h4>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                    S - Specifikt
                  </label>
                  <textarea
                    value={customGoal.specific}
                    onChange={e => setCustomGoal(prev => ({ ...prev, specific: e.target.value }))}
                    placeholder="Vad exakt ska göras?"
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none text-sm',
                      'bg-white dark:bg-stone-800',
                      'border border-stone-200 dark:border-stone-700 focus:border-violet-500',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                    M - Mätbart
                  </label>
                  <textarea
                    value={customGoal.measurable}
                    onChange={e => setCustomGoal(prev => ({ ...prev, measurable: e.target.value }))}
                    placeholder="Hur mäts framgång?"
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none text-sm',
                      'bg-white dark:bg-stone-800',
                      'border border-stone-200 dark:border-stone-700 focus:border-violet-500',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                    A - Accepterat/Uppnåeligt
                  </label>
                  <textarea
                    value={customGoal.achievable}
                    onChange={e => setCustomGoal(prev => ({ ...prev, achievable: e.target.value }))}
                    placeholder="Varför är detta realistiskt?"
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none text-sm',
                      'bg-white dark:bg-stone-800',
                      'border border-stone-200 dark:border-stone-700 focus:border-violet-500',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                    R - Relevant
                  </label>
                  <textarea
                    value={customGoal.relevant}
                    onChange={e => setCustomGoal(prev => ({ ...prev, relevant: e.target.value }))}
                    placeholder="Varför är detta viktigt?"
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none text-sm',
                      'bg-white dark:bg-stone-800',
                      'border border-stone-200 dark:border-stone-700 focus:border-violet-500',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                    T - Tidsbundet
                  </label>
                  <textarea
                    value={customGoal.timeBound}
                    onChange={e => setCustomGoal(prev => ({ ...prev, timeBound: e.target.value }))}
                    placeholder="Tidsram och milstolpar"
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none text-sm',
                      'bg-white dark:bg-stone-800',
                      'border border-stone-200 dark:border-stone-700 focus:border-violet-500',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>
              </div>

              {/* Priority and Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Prioritet
                  </label>
                  <div className="flex gap-2">
                    {priorities.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setCustomGoal(prev => ({ ...prev, priority: p.value as 'HIGH' | 'MEDIUM' | 'LOW' }))}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                          customGoal.priority === p.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="date"
                      value={customGoal.deadline}
                      onChange={e => setCustomGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 rounded-xl',
                        'bg-stone-100 dark:bg-stone-800',
                        'border-2 border-transparent focus:border-violet-500',
                        'text-stone-900 dark:text-stone-100'
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-stone-200 dark:border-stone-700">
          <div>
            {step !== 'participant' && (
              <Button
                variant="ghost"
                onClick={() => setStep(step === 'customize' ? 'template' : 'participant')}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Tillbaka
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { onClose(); resetForm(); }}>
              Avbryt
            </Button>
            {step === 'customize' && (
              <Button onClick={handleSubmit} disabled={loading || !customGoal.title}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Skapa mål
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
