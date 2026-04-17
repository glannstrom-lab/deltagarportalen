/**
 * Profile Page - Compact Professional Design
 * Organized into tabs for better navigation and less dead space
 *
 * Features:
 * - Profile image upload
 * - CV integration
 * - AI-generated summary
 * - Skills with levels
 * - Document uploads
 * - Profile sharing
 * - Career timeline
 * - Notification & visibility settings
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userApi, cvApi, type ProfilePreferences } from '../services/supabaseApi'
import { cvIntegrationApi, profileExportApi, profileSkillsApi, profileDocumentsApi } from '../services/profileEnhancementsApi'
import {
  User, CheckCircle, Camera, Phone, MapPin, Mail,
  Sparkles, Compass, ChevronRight, Briefcase, Heart,
  Plus, X, Loader2, Cloud, CloudOff, Download, Upload,
  Clock, Car, Wallet, Building2, Accessibility, Share2,
  Calendar, Target, Activity, FileText, Users, Settings,
  Zap, Brain, ClipboardList, TrendingUp, AlertCircle, Star, Linkedin,
  Bell, Eye
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import {
  ProfileImageUpload,
  SkillsSection,
  DocumentsSection,
  ProfileSharing,
  AISummary,
  CompletionGuide,
  ProfileHistory,
  CareerTimeline,
  NotificationSettingsSection,
  VisibilitySettingsSection
} from '@/components/profile'

// ============== CONSTANTS ==============

const SUGGESTED_JOBS = [
  'Projektledare', 'Utvecklare', 'Designer', 'Marknadsförare', 'Säljare',
  'Ekonom', 'HR-specialist', 'Lärare', 'Sjuksköterska', 'Ingenjör',
  'Konsult', 'Chef', 'Administratör', 'Analytiker', 'Koordinator'
]

const SUGGESTED_INTERESTS = [
  'Teknik', 'Kreativitet', 'Ledarskap', 'Problemlösning', 'Kommunikation',
  'Analys', 'Teamwork', 'Innovation', 'Strategi', 'Kundkontakt'
]

const EMPLOYMENT_STATUSES = [
  { value: 'unemployed', label: 'Arbetssökande' },
  { value: 'employed', label: 'Anställd' },
  { value: 'student', label: 'Studerar' },
  { value: 'parental_leave', label: 'Föräldraledig' },
  { value: 'sick_leave', label: 'Sjukskriven' },
  { value: 'other', label: 'Annat' },
]

const EMPLOYMENT_TYPES = [
  { value: 'fulltime', label: 'Heltid' },
  { value: 'parttime', label: 'Deltid' },
  { value: 'freelance', label: 'Frilans' },
  { value: 'temporary', label: 'Vikariat' },
  { value: 'internship', label: 'Praktik' },
]

const DRIVERS_LICENSES = ['B', 'A', 'C', 'D', 'BE', 'CE']

const SECTORS = [
  { value: 'private', label: 'Privat' },
  { value: 'public', label: 'Offentlig' },
  { value: 'nonprofit', label: 'Ideell' },
]

const BENEFITS = [
  'Friskvård', 'Pension', 'Flex-tid', 'Distans', 'Utbildning', 'Bonus'
]

const AF_PROGRAMS = [
  { value: 'jobbgarantin', label: 'Jobbgarantin' },
  { value: 'etablering', label: 'Etablering' },
  { value: 'stod_matchning', label: 'Stöd & matchning' },
  { value: 'praktik', label: 'Praktik' },
  { value: 'nystartsjobb', label: 'Nystartsjobb' },
]

const WORK_BARRIERS = [
  { value: 'language', label: 'Språknivå' },
  { value: 'license', label: 'Saknar körkort' },
  { value: 'validation', label: 'Validering av utbildning' },
  { value: 'experience', label: 'Saknar erfarenhet' },
  { value: 'health', label: 'Hälsorelaterat' },
  { value: 'childcare', label: 'Barnomsorg' },
]

const ADAPTATION_NEEDS = [
  { value: 'ergonomic', label: 'Ergonomisk arbetsplats' },
  { value: 'parttime', label: 'Deltidsarbete' },
  { value: 'breaks', label: 'Regelbundna pauser' },
  { value: 'quiet', label: 'Tyst miljö' },
  { value: 'flexible_hours', label: 'Flexibla tider' },
  { value: 'remote', label: 'Distansarbete' },
  { value: 'reduced_pace', label: 'Anpassat tempo' },
  { value: 'written_instructions', label: 'Skriftliga instruktioner' },
]

const SWEDISH_REGIONS = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
  'Örebro', 'Västerås', 'Helsingborg', 'Norrköping', 'Jönköping',
  'Umeå', 'Lund', 'Borås', 'Sundsvall', 'Gävle'
]

const INDUSTRIES = [
  'IT & Tech', 'Vård & omsorg', 'Bygg', 'Transport', 'Handel',
  'Utbildning', 'Industri', 'Bank & finans', 'Media', 'Restaurang'
]

// ============== TAB DEFINITIONS ==============

type TabId = 'basic' | 'jobbsok' | 'stod' | 'mal' | 'kompetenser' | 'dokument' | 'dela' | 'tidslinje' | 'installningar'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'basic', label: 'Grundinfo', icon: <User className="w-4 h-4" /> },
  { id: 'jobbsok', label: 'Jobbsökning', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'kompetenser', label: 'Kompetenser', icon: <Star className="w-4 h-4" /> },
  { id: 'dokument', label: 'Dokument', icon: <FileText className="w-4 h-4" /> },
  { id: 'stod', label: 'Stöd', icon: <Heart className="w-4 h-4" /> },
  { id: 'mal', label: 'Mål', icon: <Target className="w-4 h-4" /> },
  { id: 'tidslinje', label: 'Tidslinje', icon: <Calendar className="w-4 h-4" /> },
  { id: 'dela', label: 'Dela', icon: <Share2 className="w-4 h-4" /> },
  { id: 'installningar', label: 'Inställningar', icon: <Settings className="w-4 h-4" /> },
]

// ============== COMPACT COMPONENTS ==============

function CompactInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">{label}</label>
      <input
        {...props}
        className={cn(
          'w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500',
          'placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all',
          props.disabled && 'bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400',
          props.className
        )}
      />
    </div>
  )
}

function CompactSelect({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">{label}</label>
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500',
          'transition-all',
          props.className
        )}
      >
        <option value="">Välj...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function CompactTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">{label}</label>
      <textarea
        {...props}
        className={cn(
          'w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500',
          'placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all',
          props.className
        )}
      />
    </div>
  )
}

function ChipSelect({
  options,
  selected,
  onChange,
  multiple = false,
  size = 'sm'
}: {
  options: { value: string; label: string }[]
  selected: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  size?: 'sm' | 'md'
}) {
  const isSelected = (value: string) =>
    multiple ? (selected as string[]).includes(value) : selected === value

  const toggle = (value: string) => {
    if (multiple) {
      const arr = selected as string[]
      onChange(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
    } else {
      onChange(value)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            'rounded-full border font-medium transition-all',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            isSelected(opt.value)
              ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-teal-200 dark:hover:border-teal-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
  placeholder,
  maxTags = 5
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (index: number) => void
  suggestions?: string[]
  placeholder: string
  maxTags?: number
}) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ).slice(0, 4)

  const handleAdd = (tag: string) => {
    if (tag.trim() && tags.length < maxTags && !tags.includes(tag.trim())) {
      onAdd(tag.trim())
    }
    setInput('')
    setShowSuggestions(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
            {tag}
            <button onClick={() => onRemove(i)} className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      {tags.length < maxTags && (
        <div className="relative">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd(input))}
              placeholder={placeholder}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/30 focus:border-teal-400 dark:focus:border-teal-500 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
            <button
              type="button"
              onClick={() => handleAdd(input)}
              disabled={!input.trim()}
              className="px-2 py-1.5 bg-teal-500 dark:bg-teal-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg z-10 py-1">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAdd(s)}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-900/40 text-stone-700 dark:text-stone-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, icon, children, className, colorScheme = 'teal' }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; colorScheme?: 'teal' | 'sky' | 'amber' }) {
  const colors = {
    teal: {
      border: 'border-teal-200 dark:border-teal-800/50',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      titleColor: 'text-teal-800 dark:text-teal-300'
    },
    sky: {
      border: 'border-sky-200 dark:border-sky-800/50',
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      iconColor: 'text-sky-600 dark:text-sky-400',
      titleColor: 'text-sky-800 dark:text-sky-300'
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-800/50',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-800 dark:text-amber-300'
    }
  }
  const c = colors[colorScheme]

  return (
    <div className={cn('bg-white dark:bg-stone-800/50 rounded-2xl border p-5', c.border, className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.iconBg)}>
            <div className={c.iconColor}>{icon}</div>
          </div>
        )}
        <h3 className={cn('font-semibold text-sm', c.titleColor)}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ProgressSlider({
  value,
  onChange,
  label
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</span>
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer accent-teal-500"
      />
    </div>
  )
}

// ============== MAIN COMPONENT ==============

export default function Profile() {
  const { t } = useTranslation()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [profile, setProfile] = useState<{
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    location?: string
    bio?: string
    profile_image_url?: string
    ai_summary?: string
    created_at: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
  })

  // CV data for integration
  const [cvData, setCvData] = useState<{
    summary?: string
    workExperience?: unknown[]
    education?: unknown[]
    skills?: unknown[]
  } | null>(null)

  // Profile enhancements state
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [skillsCount, setSkillsCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [hasSummary, setHasSummary] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Preferences state
  const [desiredJobs, setDesiredJobs] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [availability, setAvailability] = useState<ProfilePreferences['availability']>({})
  const [mobility, setMobility] = useState<ProfilePreferences['mobility']>({})
  const [salary, setSalary] = useState<ProfilePreferences['salary']>({})
  const [laborMarketStatus, setLaborMarketStatus] = useState<ProfilePreferences['labor_market_status']>({})
  const [workPreferences, setWorkPreferences] = useState<ProfilePreferences['work_preferences']>({})
  const [physicalRequirements, setPhysicalRequirements] = useState<ProfilePreferences['physical_requirements']>({})

  // New professional fields
  const [consultantData, setConsultantData] = useState<ProfilePreferences['consultant_data']>({})
  const [therapistData, setTherapistData] = useState<ProfilePreferences['therapist_data']>({})
  const [supportGoals, setSupportGoals] = useState<ProfilePreferences['support_goals']>({})

  // Sync state
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [cloudSynced, setCloudSynced] = useState(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadProfile()
    loadPreferencesFromCloud()
    loadCvData()
    loadProfileEnhancements()
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current) }
  }, [])

  const loadProfileEnhancements = async () => {
    try {
      const [skills, documents] = await Promise.all([
        profileSkillsApi.getAll(),
        profileDocumentsApi.getAll()
      ])
      setSkillsCount(skills.length)
      setDocumentsCount(documents.length)
    } catch (err) {
      console.error('Error loading profile enhancements:', err)
    }
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await userApi.getProfile()
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        location: data.location || '',
      })
      setProfileImageUrl(data.profile_image_url || null)
      setHasSummary(Boolean(data.ai_summary))
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCvData = async () => {
    try {
      const cv = await cvApi.getCV()
      if (cv) {
        setCvData({
          summary: cv.summary || undefined,
          workExperience: cv.workExperience || [],
          education: cv.education || [],
          skills: cv.skills || []
        })
      }
    } catch (err) {
      console.error('Error loading CV data:', err)
    }
  }

  const handleImportFromCV = async () => {
    setImporting(true)
    try {
      const result = await cvIntegrationApi.importToProfile()
      if (result.imported.length > 0) {
        alert(`Importerade: ${result.imported.join(', ')}`)
        loadProfile() // Reload profile to show imported data
      } else {
        alert('Inga nya fält att importera från CV.')
      }
    } catch (err) {
      console.error('Error importing from CV:', err)
      alert('Kunde inte importera från CV')
    } finally {
      setImporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const blob = await profileExportApi.toPDF()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `profil_${formData.first_name}_${formData.last_name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('Kunde inte exportera PDF. Kontrollera att du har ett CV.')
    } finally {
      setExporting(false)
    }
  }

  const handleProfileImageChange = (url: string | null) => {
    setProfileImageUrl(url)
    setProfile(prev => prev ? { ...prev, profile_image_url: url || undefined } : prev)
  }

  const loadPreferencesFromCloud = async () => {
    try {
      const prefs = await userApi.getPreferences()
      if (prefs.desired_jobs) setDesiredJobs(prefs.desired_jobs)
      if (prefs.interests) setInterests(prefs.interests)
      if (prefs.availability) setAvailability(prefs.availability)
      if (prefs.mobility) setMobility(prefs.mobility)
      if (prefs.salary) setSalary(prefs.salary)
      if (prefs.labor_market_status) setLaborMarketStatus(prefs.labor_market_status)
      if (prefs.work_preferences) setWorkPreferences(prefs.work_preferences)
      if (prefs.physical_requirements) setPhysicalRequirements(prefs.physical_requirements)
      if (prefs.consultant_data) setConsultantData(prefs.consultant_data)
      if (prefs.therapist_data) setTherapistData(prefs.therapist_data)
      if (prefs.support_goals) setSupportGoals(prefs.support_goals)
    } catch (err) {
      console.error('Error loading preferences:', err)
    }
  }

  const saveToCloud = useCallback(async (updates: Partial<ProfilePreferences>) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    setCloudSynced(false)
    syncTimeoutRef.current = setTimeout(async () => {
      setCloudSyncing(true)
      try {
        await userApi.updatePreferences(updates)
        setCloudSynced(true)
      } catch (err) {
        console.error('Save error:', err)
      } finally {
        setCloudSyncing(false)
      }
    }, 800)
  }, [])

  const saveProfileToCloud = useCallback(async (data: typeof formData) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    setCloudSynced(false)
    syncTimeoutRef.current = setTimeout(async () => {
      setCloudSyncing(true)
      try {
        await userApi.updateProfile(data)
        setCloudSynced(true)
      } catch (err) {
        console.error('Save error:', err)
      } finally {
        setCloudSyncing(false)
      }
    }, 1000)
  }, [])

  // Update handlers
  const handleChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    saveProfileToCloud(updated)
  }

  const updateAvailability = (updates: Partial<typeof availability>) => {
    const newVal = { ...availability, ...updates }
    setAvailability(newVal)
    saveToCloud({ availability: newVal })
  }

  const updateMobility = (updates: Partial<typeof mobility>) => {
    const newVal = { ...mobility, ...updates }
    setMobility(newVal)
    saveToCloud({ mobility: newVal })
  }

  const updateSalary = (updates: Partial<typeof salary>) => {
    const newVal = { ...salary, ...updates }
    setSalary(newVal)
    saveToCloud({ salary: newVal })
  }

  const updateLaborMarketStatus = (updates: Partial<typeof laborMarketStatus>) => {
    const newVal = { ...laborMarketStatus, ...updates }
    setLaborMarketStatus(newVal)
    saveToCloud({ labor_market_status: newVal })
  }

  const updateWorkPreferences = (updates: Partial<typeof workPreferences>) => {
    const newVal = { ...workPreferences, ...updates }
    setWorkPreferences(newVal)
    saveToCloud({ work_preferences: newVal })
  }

  const updatePhysicalRequirements = (updates: Partial<typeof physicalRequirements>) => {
    const newVal = { ...physicalRequirements, ...updates }
    setPhysicalRequirements(newVal)
    saveToCloud({ physical_requirements: newVal })
  }

  const updateConsultantData = (updates: Partial<typeof consultantData>) => {
    const newVal = { ...consultantData, ...updates }
    setConsultantData(newVal)
    saveToCloud({ consultant_data: newVal })
  }

  const updateTherapistData = (updates: Partial<typeof therapistData>) => {
    const newVal = { ...therapistData, ...updates }
    setTherapistData(newVal)
    saveToCloud({ therapist_data: newVal })
  }

  const updateSupportGoals = (updates: Partial<typeof supportGoals>) => {
    const newVal = { ...supportGoals, ...updates }
    setSupportGoals(newVal)
    saveToCloud({ support_goals: newVal })
  }

  const addJob = (job: string) => {
    if (job.trim() && desiredJobs.length < 5 && !desiredJobs.includes(job.trim())) {
      const updated = [...desiredJobs, job.trim()]
      setDesiredJobs(updated)
      saveToCloud({ desired_jobs: updated })
    }
  }

  const removeJob = (index: number) => {
    const updated = desiredJobs.filter((_, i) => i !== index)
    setDesiredJobs(updated)
    saveToCloud({ desired_jobs: updated })
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && interests.length < 5 && !interests.includes(interest.trim())) {
      const updated = [...interests, interest.trim()]
      setInterests(updated)
      saveToCloud({ interests: updated })
    }
  }

  const removeInterest = (index: number) => {
    const updated = interests.filter((_, i) => i !== index)
    setInterests(updated)
    saveToCloud({ interests: updated })
  }

  // Calculate completion
  const calculateCompletion = () => {
    let filled = 0
    const total = 12
    if (formData.first_name) filled++
    if (formData.last_name) filled++
    if (formData.phone) filled++
    if (formData.location) filled++
    if (desiredJobs.length > 0) filled++
    if (availability?.status) filled++
    if (consultantData?.cvStatus) filled++
    if (therapistData?.energyLevel?.sustainableHoursPerDay) filled++
    if (supportGoals?.shortTerm?.goal) filled++
    if (supportGoals?.longTerm?.goal) filled++
    if (laborMarketStatus?.registeredAtAF !== undefined) filled++
    if (workPreferences?.sectors?.length) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }

  const completion = calculateCompletion()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">Laddar profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header - Soft Pastel Style */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-900/20 dark:via-stone-900 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 mb-6">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="flex items-center gap-4">
            {/* Profile Image Upload */}
            <ProfileImageUpload
              currentImage={profileImageUrl}
              onImageChange={handleProfileImageChange}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-teal-800 dark:text-teal-300 truncate">
                {formData.first_name || 'Välkommen!'} {formData.last_name}
              </h1>
              <p className="text-teal-600 dark:text-teal-400 text-sm truncate">{profile?.email}</p>
            </div>

            {/* Action buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {/* CV Import */}
              <button
                onClick={handleImportFromCV}
                disabled={importing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-stone-800 border border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50"
                title="Importera data från ditt CV"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                CV
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-stone-800 border border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50"
                title="Exportera profil som PDF"
              >
                {exporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                PDF
              </button>

              {/* Completion indicator */}
              <div className="flex items-center gap-2 bg-white/60 dark:bg-stone-800/60 rounded-full px-3 py-1.5 border border-teal-200 dark:border-teal-800">
                <div className="w-12 h-1.5 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all" style={{ width: `${completion.percent}%` }} />
                </div>
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{completion.percent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-r from-teal-50/50 via-white to-sky-50/50 dark:from-stone-800/50 dark:via-stone-800 dark:to-stone-800/50 rounded-xl border border-teal-100 dark:border-stone-700 mb-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-teal-50 dark:hover:bg-stone-700'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {/* Sync indicator */}
            <div className="ml-auto flex items-center gap-1.5 px-3 text-xs bg-white/50 dark:bg-stone-700/50 rounded-lg">
              {cloudSyncing ? (
                <><Loader2 className="w-3 h-3 animate-spin text-teal-600 dark:text-teal-400" /><span className="text-teal-600 dark:text-teal-400">Sparar</span></>
              ) : cloudSynced ? (
                <><Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /><span className="text-emerald-600 dark:text-emerald-400">Sparat</span></>
              ) : (
                <><CloudOff className="w-3 h-3 text-amber-600 dark:text-amber-400" /><span className="text-amber-600 dark:text-amber-400">Ej sparat</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto">

        {/* TAB: Grundinfo */}
        {activeTab === 'basic' && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kontakt */}
            <SectionCard title="Kontaktuppgifter" icon={<User className="w-4 h-4" />} colorScheme="teal">
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <CompactInput label="Förnamn" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="Förnamn" />
                  <CompactInput label="Efternamn" value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Efternamn" />
                </div>
                <CompactInput label="Telefon" type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="070-123 45 67" />
                <CompactInput label="Ort" value={formData.location} onChange={e => handleChange('location', e.target.value)} placeholder="Stockholm" />
                <CompactInput label="E-post" value={profile?.email || ''} disabled />
              </div>
            </SectionCard>

            {/* Önskade jobb */}
            <SectionCard title="Önskade jobb" icon={<Briefcase className="w-4 h-4" />} colorScheme="sky">
              <TagInput tags={desiredJobs} onAdd={addJob} onRemove={removeJob} suggestions={SUGGESTED_JOBS} placeholder="T.ex. Projektledare" maxTags={5} />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">{desiredJobs.length}/5 valda</p>
            </SectionCard>

            {/* Intressen */}
            <SectionCard title="Intressen" icon={<Heart className="w-4 h-4" />} colorScheme="amber">
              <TagInput tags={interests} onAdd={addInterest} onRemove={removeInterest} suggestions={SUGGESTED_INTERESTS} placeholder="T.ex. Teknik" maxTags={5} />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">{interests.length}/5 valda</p>
            </SectionCard>

            {/* RIASEC */}
            {!interestLoading && interestProfile.hasResult && (
              <SectionCard title="Intresseprofil (RIASEC)" icon={<Compass className="w-4 h-4" />} colorScheme="teal">
                <div className="space-y-2">
                  {interestProfile.dominantTypes.slice(0, 3).map((type, i) => {
                    const rt = RIASEC_TYPES[type.code]
                    return (
                      <div key={type.code} className="flex items-center gap-2">
                        <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                        <span className="text-sm font-medium flex-1 text-stone-800 dark:text-stone-200">{rt.nameSv}</span>
                        <div className="w-20 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full" style={{ width: `${type.score}%` }} />
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-400 w-8">{type.score}%</span>
                      </div>
                    )
                  })}
                </div>
                <Link to="/interest-guide" className="inline-flex items-center gap-1 mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                  Gör om guiden <ChevronRight className="w-3 h-3" />
                </Link>
              </SectionCard>
            )}

            {/* Intresseguide CTA */}
            {!interestLoading && !interestProfile.hasResult && (
              <Link to="/interest-guide" className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50 flex items-center gap-4 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 dark:text-amber-300">Upptäck dina styrkor</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Gör intresseguiden för personliga jobbförslag</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 dark:text-amber-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        )}

        {/* TAB: Jobbsökning */}
        {activeTab === 'jobbsok' && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status & tillgänglighet */}
            <SectionCard title="Status & tillgänglighet" icon={<Clock className="w-4 h-4" />} colorScheme="sky">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Nuvarande status</label>
                  <ChipSelect options={EMPLOYMENT_STATUSES} selected={availability?.status || ''} onChange={v => updateAvailability({ status: v as any })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Önskad anställningsform</label>
                  <ChipSelect options={EMPLOYMENT_TYPES} selected={availability?.employmentTypes || []} onChange={v => updateAvailability({ employmentTypes: v as any })} multiple />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Distansarbete</label>
                  <ChipSelect
                    options={[{ value: 'yes', label: 'Ja' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'no', label: 'På plats' }]}
                    selected={availability?.remoteWork || ''}
                    onChange={v => updateAvailability({ remoteWork: v as any })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* CV & Aktivitet (Arbetskonsulent) */}
            <SectionCard title="CV & aktivitetsnivå" icon={<FileText className="w-4 h-4" />} colorScheme="sky">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">CV-status</label>
                  <ChipSelect
                    options={[{ value: 'complete', label: 'Komplett' }, { value: 'needs_update', label: 'Behöver uppdateras' }, { value: 'missing', label: 'Saknas' }]}
                    selected={consultantData?.cvStatus || ''}
                    onChange={v => updateConsultantData({ cvStatus: v as any })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <CompactInput
                    label="Ansökningar"
                    type="number"
                    value={consultantData?.activityLevel?.applicationsSent || ''}
                    onChange={e => updateConsultantData({ activityLevel: { ...consultantData?.activityLevel, applicationsSent: parseInt(e.target.value) || 0 }})}
                    placeholder="0"
                  />
                  <CompactInput
                    label="Intervjuer"
                    type="number"
                    value={consultantData?.activityLevel?.interviews || ''}
                    onChange={e => updateConsultantData({ activityLevel: { ...consultantData?.activityLevel, interviews: parseInt(e.target.value) || 0 }})}
                    placeholder="0"
                  />
                  <CompactInput
                    label="Kontakter"
                    type="number"
                    value={consultantData?.activityLevel?.employerContacts || ''}
                    onChange={e => updateConsultantData({ activityLevel: { ...consultantData?.activityLevel, employerContacts: parseInt(e.target.value) || 0 }})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Referenser</label>
                  <ChipSelect
                    options={[{ value: 'available', label: 'Finns' }, { value: 'missing', label: 'Saknas' }, { value: 'needs_contact', label: 'Behöver kontaktas' }]}
                    selected={consultantData?.references || ''}
                    onChange={v => updateConsultantData({ references: v as any })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Arbetsmarknadsstatus */}
            <SectionCard title="Arbetsmarknadsstatus" icon={<Building2 className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laborMarketStatus?.registeredAtAF || false}
                    onChange={e => updateLaborMarketStatus({ registeredAtAF: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Registrerad hos Arbetsförmedlingen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laborMarketStatus?.participatingInProgram || false}
                    onChange={e => updateLaborMarketStatus({ participatingInProgram: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Deltar i program</span>
                </label>
                {laborMarketStatus?.participatingInProgram && (
                  <CompactSelect
                    label="Program"
                    options={AF_PROGRAMS}
                    value={laborMarketStatus?.programName || ''}
                    onChange={e => updateLaborMarketStatus({ programName: e.target.value })}
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laborMarketStatus?.hasActivitySupport || false}
                    onChange={e => updateLaborMarketStatus({ hasActivitySupport: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Har aktivitetsstöd/ersättning</span>
                </label>
              </div>
            </SectionCard>

            {/* Mobilitet */}
            <SectionCard title="Mobilitet & körkort" icon={<Car className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Körkort</label>
                  <ChipSelect
                    options={DRIVERS_LICENSES.map(l => ({ value: l, label: l }))}
                    selected={mobility?.driversLicense || []}
                    onChange={v => updateMobility({ driversLicense: v as string[] })}
                    multiple
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobility?.hasCar || false}
                      onChange={e => updateMobility({ hasCar: e.target.checked })}
                      className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-300">Har bil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobility?.willingToRelocate || false}
                      onChange={e => updateMobility({ willingToRelocate: e.target.checked })}
                      className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-300">Kan flytta</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Max pendling: {mobility?.maxCommuteMinutes || 45} min</label>
                  <input
                    type="range"
                    min="15" max="120" step="15"
                    value={mobility?.maxCommuteMinutes || 45}
                    onChange={e => updateMobility({ maxCommuteMinutes: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Hinder för arbete */}
            <SectionCard title="Hinder för arbete" icon={<AlertCircle className="w-4 h-4" />} colorScheme="amber">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Eventuella hinder</label>
                  <ChipSelect
                    options={WORK_BARRIERS}
                    selected={consultantData?.workBarriers || []}
                    onChange={v => updateConsultantData({ workBarriers: v as string[] })}
                    multiple
                  />
                </div>
                {(consultantData?.workBarriers?.length || 0) > 0 && (
                  <CompactTextarea
                    label="Beskriv närmare (valfritt)"
                    value={consultantData?.barrierDetails || ''}
                    onChange={e => updateConsultantData({ barrierDetails: e.target.value })}
                    rows={2}
                    placeholder="T.ex. behöver SFI-nivå D..."
                  />
                )}
              </div>
            </SectionCard>

            {/* Lön & förmåner */}
            <SectionCard title="Lön & förmåner" icon={<Wallet className="w-4 h-4" />} colorScheme="sky">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <CompactInput
                    label="Lägsta lön (kr/mån)"
                    type="number"
                    value={salary?.expectationMin || ''}
                    onChange={e => updateSalary({ expectationMin: parseInt(e.target.value) || undefined })}
                    placeholder="25 000"
                  />
                  <CompactInput
                    label="Önskad lön"
                    type="number"
                    value={salary?.expectationMax || ''}
                    onChange={e => updateSalary({ expectationMax: parseInt(e.target.value) || undefined })}
                    placeholder="35 000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Viktiga förmåner</label>
                  <ChipSelect
                    options={BENEFITS.map(b => ({ value: b, label: b }))}
                    selected={salary?.importantBenefits || []}
                    onChange={v => updateSalary({ importantBenefits: v as string[] })}
                    multiple
                  />
                </div>
              </div>
            </SectionCard>

            {/* Arbetspreferenser */}
            <SectionCard title="Arbetspreferenser" icon={<Building2 className="w-4 h-4" />} colorScheme="sky">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Sektor</label>
                  <ChipSelect
                    options={SECTORS}
                    selected={workPreferences?.sectors || []}
                    onChange={v => updateWorkPreferences({ sectors: v as any })}
                    multiple
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Geografiskt område</label>
                  <ChipSelect
                    options={SWEDISH_REGIONS.slice(0, 8).map(r => ({ value: r, label: r }))}
                    selected={consultantData?.geographicScope || []}
                    onChange={v => updateConsultantData({ geographicScope: v as string[] })}
                    multiple
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Branscher</label>
                  <ChipSelect
                    options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                    selected={consultantData?.targetIndustries || []}
                    onChange={v => updateConsultantData({ targetIndustries: v as string[] })}
                    multiple
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* TAB: Stöd & anpassning */}
        {activeTab === 'stod' && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Energi & ork */}
            <SectionCard title="Energi & ork" icon={<Zap className="w-4 h-4" />} colorScheme="amber">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Hållbar arbetstid: {therapistData?.energyLevel?.sustainableHoursPerDay || 8} tim/dag
                  </label>
                  <input
                    type="range"
                    min="1" max="10" step="1"
                    value={therapistData?.energyLevel?.sustainableHoursPerDay || 8}
                    onChange={e => updateTherapistData({ energyLevel: { ...therapistData?.energyLevel, sustainableHoursPerDay: parseInt(e.target.value) }})}
                    className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Hållbara dagar: {therapistData?.energyLevel?.sustainableDaysPerWeek || 5} dagar/vecka
                  </label>
                  <input
                    type="range"
                    min="1" max="7" step="1"
                    value={therapistData?.energyLevel?.sustainableDaysPerWeek || 5}
                    onChange={e => updateTherapistData({ energyLevel: { ...therapistData?.energyLevel, sustainableDaysPerWeek: parseInt(e.target.value) }})}
                    className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Bästa tid på dagen</label>
                  <ChipSelect
                    options={[{ value: 'morning', label: 'Förmiddag' }, { value: 'afternoon', label: 'Eftermiddag' }, { value: 'varies', label: 'Varierar' }]}
                    selected={therapistData?.energyLevel?.bestTimeOfDay || ''}
                    onChange={v => updateTherapistData({ energyLevel: { ...therapistData?.energyLevel, bestTimeOfDay: v as any }})}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Funktionsnivå */}
            <SectionCard title="Funktionsnivå" icon={<Activity className="w-4 h-4" />} colorScheme="amber">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Fysisk</label>
                  <ChipSelect
                    options={[{ value: 'full', label: 'Full' }, { value: 'limited', label: 'Begränsad' }, { value: 'significantly_limited', label: 'Betydligt begränsad' }]}
                    selected={therapistData?.functionalLevel?.physical || ''}
                    onChange={v => updateTherapistData({ functionalLevel: { ...therapistData?.functionalLevel, physical: v as any }})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Kognitiv</label>
                  <ChipSelect
                    options={[{ value: 'full', label: 'Full' }, { value: 'limited', label: 'Begränsad' }, { value: 'significantly_limited', label: 'Betydligt begränsad' }]}
                    selected={therapistData?.functionalLevel?.cognitive || ''}
                    onChange={v => updateTherapistData({ functionalLevel: { ...therapistData?.functionalLevel, cognitive: v as any }})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Social</label>
                  <ChipSelect
                    options={[{ value: 'full', label: 'Full' }, { value: 'limited', label: 'Begränsad' }, { value: 'significantly_limited', label: 'Betydligt begränsad' }]}
                    selected={therapistData?.functionalLevel?.social || ''}
                    onChange={v => updateTherapistData({ functionalLevel: { ...therapistData?.functionalLevel, social: v as any }})}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Anpassningsbehov */}
            <SectionCard title="Anpassningsbehov" icon={<Accessibility className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={physicalRequirements?.hasAdaptationNeeds || false}
                    onChange={e => updatePhysicalRequirements({ hasAdaptationNeeds: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Jag har anpassningsbehov</span>
                </label>
                {physicalRequirements?.hasAdaptationNeeds && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Typ av anpassning</label>
                      <ChipSelect
                        options={ADAPTATION_NEEDS}
                        selected={therapistData?.adaptationNeeds || []}
                        onChange={v => updateTherapistData({ adaptationNeeds: v as string[] })}
                        multiple
                      />
                    </div>
                    <CompactTextarea
                      label="Beskriv närmare (valfritt)"
                      value={therapistData?.adaptationDetails || ''}
                      onChange={e => updateTherapistData({ adaptationDetails: e.target.value })}
                      rows={2}
                      placeholder="Beskriv dina specifika behov..."
                    />
                  </>
                )}
              </div>
            </SectionCard>

            {/* Rehabilitering */}
            <SectionCard title="Rehabilitering" icon={<TrendingUp className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">Rehabiliteringsfas</label>
                  <ChipSelect
                    options={[
                      { value: 'early', label: 'Tidig' },
                      { value: 'ongoing', label: 'Pågående' },
                      { value: 'late', label: 'Sen' },
                      { value: 'completed', label: 'Avslutad' }
                    ]}
                    selected={therapistData?.rehabilitationPhase || ''}
                    onChange={v => updateTherapistData({ rehabilitationPhase: v as any })}
                  />
                </div>
                <CompactInput
                  label="Nästa uppföljning"
                  type="date"
                  value={therapistData?.followUpDate || ''}
                  onChange={e => updateTherapistData({ followUpDate: e.target.value })}
                />
                <CompactTextarea
                  label="Anteckningar"
                  value={therapistData?.followUpNotes || ''}
                  onChange={e => updateTherapistData({ followUpNotes: e.target.value })}
                  rows={2}
                  placeholder="Egna anteckningar..."
                />
              </div>
            </SectionCard>

            {/* Arbetsförmågebedömning */}
            <SectionCard title="Arbetsförmågebedömning" icon={<ClipboardList className="w-4 h-4" />} className="md:col-span-2" colorScheme="amber">
              <div className="grid gap-3 md:grid-cols-3">
                <CompactInput
                  label="Bedömningsdatum"
                  type="date"
                  value={therapistData?.workCapacityAssessment?.date || ''}
                  onChange={e => updateTherapistData({ workCapacityAssessment: { ...therapistData?.workCapacityAssessment, date: e.target.value }})}
                />
                <CompactInput
                  label="Resultat"
                  value={therapistData?.workCapacityAssessment?.result || ''}
                  onChange={e => updateTherapistData({ workCapacityAssessment: { ...therapistData?.workCapacityAssessment, result: e.target.value }})}
                  placeholder="T.ex. 50% arbetsförmåga"
                />
                <CompactInput
                  label="Rekommendationer"
                  value={therapistData?.workCapacityAssessment?.recommendations || ''}
                  onChange={e => updateTherapistData({ workCapacityAssessment: { ...therapistData?.workCapacityAssessment, recommendations: e.target.value }})}
                  placeholder="T.ex. deltidsarbete"
                />
              </div>
            </SectionCard>

            {/* Hjälpmedel */}
            <SectionCard title="Hjälpmedel" icon={<Brain className="w-4 h-4" />} className="md:col-span-2" colorScheme="sky">
              <div className="grid gap-3 md:grid-cols-3">
                <CompactTextarea
                  label="Beviljade"
                  value={therapistData?.assistiveTools?.granted?.join(', ') || ''}
                  onChange={e => updateTherapistData({ assistiveTools: { ...therapistData?.assistiveTools, granted: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }})}
                  rows={2}
                  placeholder="T.ex. höj- och sänkbart skrivbord"
                />
                <CompactTextarea
                  label="Ansökta"
                  value={therapistData?.assistiveTools?.applied?.join(', ') || ''}
                  onChange={e => updateTherapistData({ assistiveTools: { ...therapistData?.assistiveTools, applied: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }})}
                  rows={2}
                  placeholder="T.ex. ergonomisk stol"
                />
                <CompactTextarea
                  label="Rekommenderade"
                  value={therapistData?.assistiveTools?.recommended?.join(', ') || ''}
                  onChange={e => updateTherapistData({ assistiveTools: { ...therapistData?.assistiveTools, recommended: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }})}
                  rows={2}
                  placeholder="T.ex. skärmläsare"
                />
              </div>
            </SectionCard>
          </div>
        )}

        {/* TAB: Mål & uppföljning */}
        {activeTab === 'mal' && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kortsiktigt mål */}
            <SectionCard title="Kortsiktigt mål" icon={<Target className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-3">
                <CompactTextarea
                  label="Mål"
                  value={supportGoals?.shortTerm?.goal || ''}
                  onChange={e => updateSupportGoals({ shortTerm: { ...supportGoals?.shortTerm, goal: e.target.value }})}
                  rows={2}
                  placeholder="T.ex. Skicka 5 ansökningar i veckan"
                />
                <CompactInput
                  label="Deadline"
                  type="date"
                  value={supportGoals?.shortTerm?.deadline || ''}
                  onChange={e => updateSupportGoals({ shortTerm: { ...supportGoals?.shortTerm, deadline: e.target.value }})}
                />
                <ProgressSlider
                  label="Framsteg"
                  value={supportGoals?.shortTerm?.progress || 0}
                  onChange={v => updateSupportGoals({ shortTerm: { ...supportGoals?.shortTerm, progress: v }})}
                />
              </div>
            </SectionCard>

            {/* Långsiktigt mål */}
            <SectionCard title="Långsiktigt mål" icon={<TrendingUp className="w-4 h-4" />} colorScheme="sky">
              <div className="space-y-3">
                <CompactTextarea
                  label="Mål"
                  value={supportGoals?.longTerm?.goal || ''}
                  onChange={e => updateSupportGoals({ longTerm: { ...supportGoals?.longTerm, goal: e.target.value }})}
                  rows={2}
                  placeholder="T.ex. Få fast anställning inom mitt område"
                />
                <CompactInput
                  label="Deadline"
                  type="date"
                  value={supportGoals?.longTerm?.deadline || ''}
                  onChange={e => updateSupportGoals({ longTerm: { ...supportGoals?.longTerm, deadline: e.target.value }})}
                />
                <ProgressSlider
                  label="Framsteg"
                  value={supportGoals?.longTerm?.progress || 0}
                  onChange={v => updateSupportGoals({ longTerm: { ...supportGoals?.longTerm, progress: v }})}
                />
              </div>
            </SectionCard>

            {/* Praktik/arbetsträning */}
            <SectionCard title="Praktik / Arbetsträning" icon={<Users className="w-4 h-4" />} colorScheme="amber">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consultantData?.internship?.active || false}
                    onChange={e => updateConsultantData({ internship: { ...consultantData?.internship, active: e.target.checked }})}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Pågående praktik/arbetsträning</span>
                </label>
                {consultantData?.internship?.active && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <CompactInput
                        label="Företag"
                        value={consultantData?.internship?.company || ''}
                        onChange={e => updateConsultantData({ internship: { ...consultantData?.internship, company: e.target.value }})}
                        placeholder="Företagsnamn"
                      />
                      <CompactInput
                        label="Handledare"
                        value={consultantData?.internship?.supervisor || ''}
                        onChange={e => updateConsultantData({ internship: { ...consultantData?.internship, supervisor: e.target.value }})}
                        placeholder="Namn"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <CompactInput
                        label="Startdatum"
                        type="date"
                        value={consultantData?.internship?.startDate || ''}
                        onChange={e => updateConsultantData({ internship: { ...consultantData?.internship, startDate: e.target.value }})}
                      />
                      <CompactInput
                        label="Slutdatum"
                        type="date"
                        value={consultantData?.internship?.endDate || ''}
                        onChange={e => updateConsultantData({ internship: { ...consultantData?.internship, endDate: e.target.value }})}
                      />
                    </div>
                  </>
                )}
              </div>
            </SectionCard>

            {/* Nästa steg */}
            <SectionCard title="Nästa steg" icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
              <div className="space-y-2">
                {(consultantData?.nextSteps || []).map((step, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={e => {
                        const steps = [...(consultantData?.nextSteps || [])]
                        steps[i] = { ...steps[i], completed: e.target.checked }
                        updateConsultantData({ nextSteps: steps })
                      }}
                      className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
                    />
                    <span className={cn('flex-1 text-sm text-stone-700 dark:text-stone-300', step.completed && 'line-through text-stone-400 dark:text-stone-500')}>{step.activity}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{step.date}</span>
                    <button
                      onClick={() => {
                        const steps = (consultantData?.nextSteps || []).filter((_, idx) => idx !== i)
                        updateConsultantData({ nextSteps: steps })
                      }}
                      className="p-1 hover:bg-stone-200 dark:hover:bg-stone-600 rounded"
                    >
                      <X className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Ny aktivitet..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const steps = [...(consultantData?.nextSteps || []), {
                          activity: e.currentTarget.value.trim(),
                          date: new Date().toISOString().split('T')[0],
                          completed: false
                        }]
                        updateConsultantData({ nextSteps: steps })
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Anteckningar */}
            <SectionCard title="Anteckningar" icon={<FileText className="w-4 h-4" />} className="md:col-span-2" colorScheme="sky">
              <CompactTextarea
                label=""
                value={supportGoals?.notes || ''}
                onChange={e => updateSupportGoals({ notes: e.target.value })}
                rows={4}
                placeholder="Övriga anteckningar, observationer eller reflektioner..."
              />
            </SectionCard>
          </div>
        )}

        {/* TAB: Kompetenser */}
        {activeTab === 'kompetenser' && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Skills Section */}
            <SectionCard title="Mina kompetenser" icon={<Star className="w-4 h-4" />} className="md:col-span-2" colorScheme="amber">
              <SkillsSection />
            </SectionCard>

            {/* AI Summary */}
            <SectionCard title="Profilsammanfattning" icon={<Sparkles className="w-4 h-4" />} className="md:col-span-2" colorScheme="teal">
              <AISummary />
            </SectionCard>

            {/* Completion Guide */}
            <SectionCard title="Kompletteringsguide" icon={<CheckCircle className="w-4 h-4" />} className="md:col-span-2" colorScheme="sky">
              <CompletionGuide
                profile={profile}
                cv={cvData}
                skillsCount={skillsCount}
                documentsCount={documentsCount}
                hasSummary={hasSummary}
              />
            </SectionCard>
          </div>
        )}

        {/* TAB: Dokument */}
        {activeTab === 'dokument' && (
          <div className="grid gap-4">
            <SectionCard title="Certifikat & dokument" icon={<FileText className="w-4 h-4" />} colorScheme="sky">
              <DocumentsSection />
            </SectionCard>

            {/* LinkedIn Import Placeholder */}
            <div className="p-6 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl border border-sky-200 dark:border-sky-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0077b5] flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sky-800 dark:text-sky-300">Importera från LinkedIn</p>
                  <p className="text-sm text-sky-600 dark:text-sky-400">
                    Importera din profil direkt från LinkedIn (kommer snart)
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-[#0077b5] text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                >
                  Kommer snart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Tidslinje */}
        {activeTab === 'tidslinje' && (
          <div className="grid gap-4">
            <SectionCard title="Karriärtidslinje" icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
              <CareerTimeline />
            </SectionCard>

            {/* Profile History */}
            <SectionCard title="Ändringshistorik" icon={<Activity className="w-4 h-4" />} colorScheme="sky">
              <ProfileHistory />
            </SectionCard>
          </div>
        )}

        {/* TAB: Dela */}
        {activeTab === 'dela' && (
          <div className="grid gap-4">
            <SectionCard title="Dela din profil" icon={<Share2 className="w-4 h-4" />} colorScheme="teal">
              <ProfileSharing />
            </SectionCard>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Tips för delning</p>
                  <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 space-y-1">
                    <li>• Skapa olika länkar för olika ändamål (t.ex. per jobbansökan)</li>
                    <li>• Sätt en giltighetstid för att kontrollera åtkomst</li>
                    <li>• Välj vilka delar av din profil som ska visas</li>
                    <li>• Använd QR-koden på visitkort eller CV</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Inställningar */}
        {activeTab === 'installningar' && (
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Notifikationer" icon={<Bell className="w-4 h-4" />} colorScheme="teal">
              <NotificationSettingsSection />
            </SectionCard>

            <SectionCard title="Synlighet" icon={<Eye className="w-4 h-4" />} colorScheme="sky">
              <VisibilitySettingsSection />
            </SectionCard>
          </div>
        )}
      </div>
      <HelpButton content={helpContent.profile} />
    </div>
  )
}
