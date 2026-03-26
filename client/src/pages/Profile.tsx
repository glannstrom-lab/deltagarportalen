/**
 * Profile Page - Premium Design
 * Modern, color-coded sections with smooth animations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userApi, type ProfilePreferences } from '../services/supabaseApi'
import {
  User, Save, CheckCircle, Camera, Phone, MapPin, Mail,
  Sparkles, Compass, ChevronRight, Briefcase, Heart,
  Plus, X, Loader2, ArrowRight, Cloud, CloudOff,
  Clock, Car, Wallet, Building2, Settings2, Accessibility,
  ChevronDown, Calendar, Globe, Home, Shield, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'

// ============== CONSTANTS ==============

const SUGGESTED_JOBS = [
  'Projektledare', 'Utvecklare', 'Designer', 'Marknadsförare', 'Säljare',
  'Ekonom', 'HR-specialist', 'Lärare', 'Sjuksköterska', 'Ingenjör',
  'Konsult', 'Chef', 'Administratör', 'Analytiker', 'Koordinator'
]

const SUGGESTED_INTERESTS = [
  'Teknik', 'Kreativitet', 'Ledarskap', 'Problemlösning', 'Kommunikation',
  'Analys', 'Teamwork', 'Innovation', 'Strategi', 'Kundkontakt',
  'Projektledning', 'Design', 'Forskning', 'Utbildning', 'Hållbarhet'
]

const EMPLOYMENT_STATUSES = [
  { value: 'unemployed', label: 'Arbetssökande', icon: '🔍' },
  { value: 'employed', label: 'Anställd', icon: '💼' },
  { value: 'student', label: 'Studerar', icon: '📚' },
  { value: 'parental_leave', label: 'Föräldraledig', icon: '👶' },
  { value: 'sick_leave', label: 'Sjukskriven', icon: '🏥' },
  { value: 'other', label: 'Annat', icon: '📋' },
]

const EMPLOYMENT_TYPES = [
  { value: 'fulltime', label: 'Heltid' },
  { value: 'parttime', label: 'Deltid' },
  { value: 'freelance', label: 'Frilans/Konsult' },
  { value: 'temporary', label: 'Vikariat' },
  { value: 'internship', label: 'Praktik' },
]

const REMOTE_OPTIONS = [
  { value: 'yes', label: 'Ja, enbart distans', icon: '🏠' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { value: 'no', label: 'På plats', icon: '🏢' },
]

const DRIVERS_LICENSES = ['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C', 'CE', 'D', 'DE']

const SECTORS = [
  { value: 'private', label: 'Privat sektor' },
  { value: 'public', label: 'Offentlig sektor' },
  { value: 'nonprofit', label: 'Ideell sektor' },
]

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup', desc: '1-10' },
  { value: 'small', label: 'Litet', desc: '11-50' },
  { value: 'medium', label: 'Medelstort', desc: '51-200' },
  { value: 'large', label: 'Stort', desc: '201-1000' },
  { value: 'enterprise', label: 'Storföretag', desc: '1000+' },
]

const BENEFITS = [
  'Friskvårdsbidrag', 'Tjänstepension', 'Flexibla arbetstider', 'Distansarbete',
  'Kompetensutveckling', 'Bonus', 'Tjänstebil', 'Lunch/mat', 'Försäkringar',
  'Extra semester', 'Föräldrarledighetstillägg', 'Aktieoption'
]

const VALUES = [
  'Hållbarhet', 'Innovation', 'Work-life balance', 'Mångfald', 'Karriärmöjligheter',
  'Platt organisation', 'Teamkänsla', 'Självständighet', 'Kreativitet', 'Samhällsnytta'
]

const AF_PROGRAMS = [
  { value: 'jobbgarantin', label: 'Jobb- och utvecklingsgarantin' },
  { value: 'etablering', label: 'Etableringsprogrammet' },
  { value: 'stod_matchning', label: 'Stöd och matchning' },
  { value: 'arbetsmarknadsutbildning', label: 'Arbetsmarknadsutbildning' },
  { value: 'praktik', label: 'Praktik' },
  { value: 'nystartsjobb', label: 'Nystartsjobb' },
  { value: 'other', label: 'Annat program' },
]

// Section color themes
const SECTION_THEMES = {
  contact: { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50', border: 'border-indigo-200', icon: 'bg-indigo-100 text-indigo-600', accent: 'indigo' },
  jobs: { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', accent: 'blue' },
  interests: { bg: 'bg-gradient-to-br from-rose-50 to-pink-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-600', accent: 'rose' },
  riasec: { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', accent: 'amber' },
  availability: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', accent: 'emerald' },
  mobility: { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', accent: 'violet' },
  salary: { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600', accent: 'green' },
  labor: { bg: 'bg-gradient-to-br from-sky-50 to-blue-50', border: 'border-sky-200', icon: 'bg-sky-100 text-sky-600', accent: 'sky' },
  preferences: { bg: 'bg-gradient-to-br from-fuchsia-50 to-pink-50', border: 'border-fuchsia-200', icon: 'bg-fuchsia-100 text-fuchsia-600', accent: 'fuchsia' },
  physical: { bg: 'bg-gradient-to-br from-slate-50 to-gray-50', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-600', accent: 'slate' },
}

// ============== COMPONENTS ==============

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
  theme: keyof typeof SECTION_THEMES
  completionCount?: number
  totalCount?: number
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, badge, theme, completionCount, totalCount }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const colors = SECTION_THEMES[theme]
  const hasCompletion = typeof completionCount === 'number' && typeof totalCount === 'number'
  const completionPercent = hasCompletion ? Math.round((completionCount / totalCount) * 100) : 0

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-300',
      colors.border,
      isOpen ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full p-4 sm:p-5 flex items-center justify-between transition-all duration-200',
          isOpen ? colors.bg : 'bg-white hover:bg-slate-50/50'
        )}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-200',
            colors.icon,
            isOpen && 'scale-110'
          )}>
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">{title}</h2>
            {badge && (
              <span className={cn(
                'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full',
                `bg-${colors.accent}-100 text-${colors.accent}-700`
              )}>
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasCompletion && !isOpen && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', `bg-${colors.accent}-500`)}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{completionPercent}%</span>
            </div>
          )}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
            isOpen ? `bg-${colors.accent}-200` : 'bg-slate-100'
          )}>
            <ChevronDown className={cn(
              'w-5 h-5 transition-transform duration-200',
              isOpen ? 'rotate-180 text-slate-700' : 'text-slate-400'
            )} />
          </div>
        </div>
      </button>

      <div className={cn(
        'transition-all duration-300 overflow-hidden',
        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className={cn('px-4 sm:px-5 pb-5 pt-3 border-t', colors.border, colors.bg)}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface TagInputProps {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (index: number) => void
  suggestions?: string[]
  placeholder: string
  maxTags?: number
  accentColor?: string
}

function TagInput({ tags, onAdd, onRemove, suggestions = [], placeholder, maxTags = 5, accentColor = 'indigo' }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ).slice(0, 5)

  const handleAdd = (tag: string) => {
    if (tag.trim() && tags.length < maxTags && !tags.includes(tag.trim())) {
      onAdd(tag.trim())
    }
    setInput('')
    setShowSuggestions(false)
  }

  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, index) => (
          <span
            key={index}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
              colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.indigo
            )}
          >
            {tag}
            <button
              onClick={() => onRemove(index)}
              className="w-5 h-5 rounded-full bg-current/10 hover:bg-current/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-slate-400 italic">Inga valda ännu</span>
        )}
      </div>
      {tags.length < maxTags && (
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowSuggestions(input.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(input)}
              placeholder={placeholder}
              className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm transition-all"
            />
            <button
              onClick={() => handleAdd(input)}
              disabled={!input.trim()}
              className={cn(
                'px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                input.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Lägg till</span>
            </button>
          </div>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
              <div className="p-2 text-xs font-medium text-slate-500 border-b border-slate-100">Förslag</div>
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAdd(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 text-slate-700 text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">{tags.length} av {maxTags} valda</p>
    </div>
  )
}

interface CheckboxGroupProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  columns?: number
  accentColor?: string
}

function CheckboxGroup({ options, selected, onChange, columns = 2, accentColor = 'indigo' }: CheckboxGroupProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={cn(
      'grid gap-2',
      columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      columns === 3 ? 'grid-cols-1 sm:grid-cols-3' :
      'grid-cols-1'
    )}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all',
            selected.includes(option.value)
              ? `bg-${accentColor}-50 border-${accentColor}-300 shadow-sm`
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          )}
        >
          <div className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
            selected.includes(option.value)
              ? `bg-${accentColor}-600 border-${accentColor}-600`
              : 'border-slate-300'
          )}>
            {selected.includes(option.value) && (
              <CheckCircle className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-slate-700">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// Styled input component
function StyledInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <input
        {...props}
        className={cn(
          'w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
          'text-sm transition-all placeholder:text-slate-400',
          props.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
          props.className
        )}
      />
    </div>
  )
}

// ============== MAIN COMPONENT ==============

export default function Profile() {
  const { t } = useTranslation()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  const [profile, setProfile] = useState<{
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    location?: string
    bio?: string
    created_at: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: ''
  })

  const [desiredJobs, setDesiredJobs] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [availability, setAvailability] = useState<ProfilePreferences['availability']>({})
  const [mobility, setMobility] = useState<ProfilePreferences['mobility']>({})
  const [salary, setSalary] = useState<ProfilePreferences['salary']>({})
  const [laborMarketStatus, setLaborMarketStatus] = useState<ProfilePreferences['labor_market_status']>({})
  const [workPreferences, setWorkPreferences] = useState<ProfilePreferences['work_preferences']>({})
  const [physicalRequirements, setPhysicalRequirements] = useState<ProfilePreferences['physical_requirements']>({})

  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [cloudSynced, setCloudSynced] = useState(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const profileSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadProfile()
    loadPreferencesFromCloud()

    // Cleanup timeouts on unmount
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      if (profileSyncTimeoutRef.current) clearTimeout(profileSyncTimeoutRef.current)
    }
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await userApi.getProfile()
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || ''
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(t('profile.errorLoading'))
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      console.error('Error loading preferences from cloud:', err)
    }
  }

  const savePreferencesToCloud = useCallback(async (updates: Partial<ProfilePreferences>) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    setCloudSynced(false)

    syncTimeoutRef.current = setTimeout(async () => {
      setCloudSyncing(true)
      try {
        await userApi.updatePreferences(updates)
        setCloudSynced(true)
      } catch (err) {
        console.error('Error saving to cloud:', err)
      } finally {
        setCloudSyncing(false)
      }
    }, 1000)
  }, [])

  const saveProfileToCloud = useCallback(async (updatedFormData: typeof formData) => {
    if (profileSyncTimeoutRef.current) {
      clearTimeout(profileSyncTimeoutRef.current)
    }

    setCloudSynced(false)

    profileSyncTimeoutRef.current = setTimeout(async () => {
      setCloudSyncing(true)
      try {
        await userApi.updateProfile(updatedFormData)

        // Mark onboarding step if name and email exist
        if (updatedFormData.first_name && profile?.email) {
          await userApi.updateOnboardingStep('profile', true)
        }

        setCloudSynced(true)
      } catch (err) {
        console.error('Error saving profile to cloud:', err)
      } finally {
        setCloudSyncing(false)
      }
    }, 1500) // Slightly longer delay for profile to reduce API calls while typing
  }, [profile?.email])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await userApi.updateProfile(formData)
      await userApi.updatePreferences({
        desired_jobs: desiredJobs,
        interests: interests,
        availability,
        mobility,
        salary,
        labor_market_status: laborMarketStatus,
        work_preferences: workPreferences,
        physical_requirements: physicalRequirements
      })

      if (formData.first_name && profile?.email) {
        await userApi.updateOnboardingStep('profile', true)
      }

      setSaved(true)
      setCloudSynced(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(t('profile.errorSaving'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    const updatedFormData = { ...formData, [field]: value }
    setFormData(updatedFormData)
    saveProfileToCloud(updatedFormData)
  }

  const addJob = (job: string) => {
    if (job.trim() && desiredJobs.length < 3 && !desiredJobs.includes(job.trim())) {
      const updated = [...desiredJobs, job.trim()]
      setDesiredJobs(updated)
      savePreferencesToCloud({ desired_jobs: updated })
    }
  }

  const removeJob = (index: number) => {
    const updated = desiredJobs.filter((_, i) => i !== index)
    setDesiredJobs(updated)
    savePreferencesToCloud({ desired_jobs: updated })
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && interests.length < 3 && !interests.includes(interest.trim())) {
      const updated = [...interests, interest.trim()]
      setInterests(updated)
      savePreferencesToCloud({ interests: updated })
    }
  }

  const removeInterest = (index: number) => {
    const updated = interests.filter((_, i) => i !== index)
    setInterests(updated)
    savePreferencesToCloud({ interests: updated })
  }

  const updateAvailability = (updates: Partial<ProfilePreferences['availability']>) => {
    const newAvailability = { ...availability, ...updates }
    setAvailability(newAvailability)
    savePreferencesToCloud({ availability: newAvailability })
  }

  const updateMobility = (updates: Partial<ProfilePreferences['mobility']>) => {
    const newMobility = { ...mobility, ...updates }
    setMobility(newMobility)
    savePreferencesToCloud({ mobility: newMobility })
  }

  const updateSalary = (updates: Partial<ProfilePreferences['salary']>) => {
    const newSalary = { ...salary, ...updates }
    setSalary(newSalary)
    savePreferencesToCloud({ salary: newSalary })
  }

  const updateLaborMarketStatus = (updates: Partial<ProfilePreferences['labor_market_status']>) => {
    const newStatus = { ...laborMarketStatus, ...updates }
    setLaborMarketStatus(newStatus)
    savePreferencesToCloud({ labor_market_status: newStatus })
  }

  const updateWorkPreferences = (updates: Partial<ProfilePreferences['work_preferences']>) => {
    const newPrefs = { ...workPreferences, ...updates }
    setWorkPreferences(newPrefs)
    savePreferencesToCloud({ work_preferences: newPrefs })
  }

  const updatePhysicalRequirements = (updates: Partial<ProfilePreferences['physical_requirements']>) => {
    const newReqs = { ...physicalRequirements, ...updates }
    setPhysicalRequirements(newReqs)
    savePreferencesToCloud({ physical_requirements: newReqs })
  }

  // Calculate profile completion
  const calculateCompletion = () => {
    let filled = 0
    let total = 10
    if (formData.first_name) filled++
    if (formData.last_name) filled++
    if (formData.phone) filled++
    if (formData.location) filled++
    if (desiredJobs.length > 0) filled++
    if (interests.length > 0) filled++
    if (availability?.status) filled++
    if (mobility?.driversLicense?.length) filled++
    if (workPreferences?.sectors?.length) filled++
    if (salary?.expectationMin) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }

  const completion = calculateCompletion()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Laddar profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDE0di0yaDIyek0zNiAxNHYySDR2LTJoMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center ring-4 ring-white/30 shadow-2xl transition-transform group-hover:scale-105">
                <User className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-11 sm:h-11 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-50 hover:scale-110 transition-all"
                onClick={() => alert('Bilduppladdning kommer snart!')}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {formData.first_name || 'Välkommen!'} {formData.last_name || ''}
              </h1>
              <div className="mt-2 space-y-1">
                <p className="text-indigo-200 flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>
                {formData.location && (
                  <p className="text-indigo-200 flex items-center justify-center sm:justify-start gap-2">
                    <MapPin className="w-4 h-4" />
                    {formData.location}
                  </p>
                )}
              </div>

              {/* Completion Badge */}
              <div className="mt-4 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  <span className="text-white font-medium text-sm">Profil {completion.percent}% klar</span>
                </div>
                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-4">

        {/* Cloud Sync Status - Inline indicator */}
        <div className="flex justify-end mb-2">
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
            cloudSyncing ? 'bg-indigo-100 text-indigo-700' :
            cloudSynced ? 'bg-emerald-100 text-emerald-700' :
            'bg-amber-100 text-amber-700 animate-pulse'
          )}>
            {cloudSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sparar...</span>
              </>
            ) : cloudSynced ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Sparat</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span>Ej sparat</span>
              </>
            )}
          </div>
        </div>

        {/* Interest Guide CTA */}
        {!interestLoading && !interestProfile.hasResult && (
          <Link
            to="/interest-guide"
            className="block bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Compass className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-amber-100 text-sm font-semibold mb-1">
                  <Sparkles className="w-4 h-4" />
                  Rekommenderat nästa steg
                </div>
                <h2 className="text-xl font-bold">Gör intresseguiden</h2>
                <p className="text-amber-100 text-sm mt-1">
                  Upptäck vilka yrken som passar dig bäst baserat på dina intressen
                </p>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform hidden sm:block" />
            </div>
          </Link>
        )}

        {/* Contact Information */}
        <div className={cn(
          'rounded-2xl border-2 p-5 sm:p-6',
          SECTION_THEMES.contact.border,
          SECTION_THEMES.contact.bg
        )}>
          <div className="flex items-center gap-3 mb-5">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', SECTION_THEMES.contact.icon)}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kontaktuppgifter</h2>
              <p className="text-sm text-slate-500">Grundläggande information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StyledInput
              label="Förnamn"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder="Ditt förnamn"
            />
            <StyledInput
              label="Efternamn"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder="Ditt efternamn"
            />
            <StyledInput
              label="Telefon"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="070-123 45 67"
            />
            <StyledInput
              label="Ort"
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Stockholm"
            />
            <div className="sm:col-span-2">
              <StyledInput
                label="E-post"
                type="email"
                value={profile?.email || ''}
                disabled
              />
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                E-postadressen kan inte ändras
              </p>
            </div>
          </div>
        </div>

        {/* Desired Jobs */}
        <div className={cn(
          'rounded-2xl border-2 p-5 sm:p-6',
          SECTION_THEMES.jobs.border,
          SECTION_THEMES.jobs.bg
        )}>
          <div className="flex items-center gap-3 mb-5">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', SECTION_THEMES.jobs.icon)}>
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Önskade jobb</h2>
              <p className="text-sm text-slate-500">Vilka roller drömmer du om? (max 3)</p>
            </div>
          </div>
          <TagInput
            tags={desiredJobs}
            onAdd={addJob}
            onRemove={removeJob}
            suggestions={SUGGESTED_JOBS}
            placeholder="T.ex. Projektledare, UX-designer..."
            maxTags={3}
            accentColor="blue"
          />
        </div>

        {/* Interests */}
        <div className={cn(
          'rounded-2xl border-2 p-5 sm:p-6',
          SECTION_THEMES.interests.border,
          SECTION_THEMES.interests.bg
        )}>
          <div className="flex items-center gap-3 mb-5">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', SECTION_THEMES.interests.icon)}>
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Dina intressen</h2>
              <p className="text-sm text-slate-500">Vad brinner du för? (max 3)</p>
            </div>
          </div>
          <TagInput
            tags={interests}
            onAdd={addInterest}
            onRemove={removeInterest}
            suggestions={SUGGESTED_INTERESTS}
            placeholder="T.ex. Teknik, Kreativitet, Ledarskap..."
            maxTags={3}
            accentColor="rose"
          />
        </div>

        {/* RIASEC Results */}
        {!interestLoading && interestProfile.hasResult && interestProfile.dominantTypes.length > 0 && (
          <div className={cn(
            'rounded-2xl border-2 p-5 sm:p-6',
            SECTION_THEMES.riasec.border,
            SECTION_THEMES.riasec.bg
          )}>
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', SECTION_THEMES.riasec.icon)}>
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Din intresseprofil</h2>
                <p className="text-sm text-slate-500">Resultat från intresseguiden</p>
              </div>
            </div>
            <div className="space-y-4">
              {interestProfile.dominantTypes.slice(0, 3).map((type, index) => {
                const riasecType = RIASEC_TYPES[type.code]
                const medals = ['🥇', '🥈', '🥉']
                const colors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-amber-700']
                return (
                  <div key={type.code} className="flex items-center gap-4 bg-white/50 rounded-xl p-4">
                    <span className="text-3xl">{medals[index]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">{riasecType.nameSv}</span>
                        <span className="text-sm font-semibold text-slate-600">{type.score}%</span>
                      </div>
                      <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                          className={cn('h-full rounded-full bg-gradient-to-r', colors[index])}
                          style={{ width: `${type.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link
              to="/interest-guide"
              className="inline-flex items-center gap-2 mt-4 text-sm text-amber-700 hover:text-amber-800 font-semibold"
            >
              Gör om intresseguiden
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Collapsible Sections */}

        {/* 1. Availability */}
        <CollapsibleSection
          title="Tillgänglighet"
          icon={<Clock className="w-6 h-6" />}
          theme="availability"
          badge={availability?.status ? EMPLOYMENT_STATUSES.find(s => s.value === availability.status)?.label : undefined}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Nuvarande status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMPLOYMENT_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateAvailability({ status: status.value as any })}
                    className={cn(
                      'px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2',
                      availability?.status === status.value
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">När kan du börja?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'immediately', label: 'Omgående', icon: '⚡' },
                  { value: '2_weeks', label: '2 veckor', icon: '📅' },
                  { value: '1_month', label: '1 månad', icon: '📆' },
                  { value: '2_months', label: '2 månader', icon: '🗓️' },
                  { value: '3_months', label: '3+ månader', icon: '📋' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateAvailability({ availableFrom: option.value })}
                    className={cn(
                      'px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                      availability?.availableFrom === option.value
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Önskad anställningsform</label>
              <CheckboxGroup
                options={EMPLOYMENT_TYPES}
                selected={availability?.employmentTypes || []}
                onChange={(types) => updateAvailability({ employmentTypes: types as any })}
                columns={2}
                accentColor="emerald"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Öppen för distansarbete?</label>
              <div className="grid grid-cols-3 gap-2">
                {REMOTE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateAvailability({ remoteWork: option.value as any })}
                    className={cn(
                      'px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-center',
                      availability?.remoteWork === option.value
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="text-lg block mb-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Mobility */}
        <CollapsibleSection
          title="Mobilitet & Körkort"
          icon={<Car className="w-6 h-6" />}
          theme="mobility"
          badge={mobility?.driversLicense?.length ? `Körkort ${mobility.driversLicense.join(', ')}` : undefined}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Körkort</label>
              <div className="flex flex-wrap gap-2">
                {DRIVERS_LICENSES.map((license) => (
                  <button
                    key={license}
                    onClick={() => {
                      const current = mobility?.driversLicense || []
                      const updated = current.includes(license)
                        ? current.filter(l => l !== license)
                        : [...current, license]
                      updateMobility({ driversLicense: updated })
                    }}
                    className={cn(
                      'w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all',
                      mobility?.driversLicense?.includes(license)
                        ? 'bg-violet-100 border-violet-400 text-violet-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {license}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                mobility?.hasCar ? 'bg-violet-50 border-violet-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}>
                <input
                  type="checkbox"
                  checked={mobility?.hasCar || false}
                  onChange={(e) => updateMobility({ hasCar: e.target.checked })}
                  className="sr-only"
                />
                <div className={cn(
                  'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                  mobility?.hasCar ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                )}>
                  {mobility?.hasCar && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-700 block">Har tillgång till bil</span>
                  <span className="text-xs text-slate-500">För att ta dig till jobbet</span>
                </div>
              </label>

              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                mobility?.willingToTravel ? 'bg-violet-50 border-violet-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}>
                <input
                  type="checkbox"
                  checked={mobility?.willingToTravel || false}
                  onChange={(e) => updateMobility({ willingToTravel: e.target.checked })}
                  className="sr-only"
                />
                <div className={cn(
                  'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                  mobility?.willingToTravel ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                )}>
                  {mobility?.willingToTravel && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-700 block">Villig att resa i tjänsten</span>
                  <span className="text-xs text-slate-500">Resor inom jobbet</span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Max pendlingstid (enkel väg)</label>
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={mobility?.maxCommuteMinutes || 45}
                  onChange={(e) => updateMobility({ maxCommuteMinutes: parseInt(e.target.value) })}
                  className="w-full accent-violet-600 h-2"
                />
                <div className="flex justify-between text-sm mt-3">
                  <span className="text-slate-500">15 min</span>
                  <span className="font-bold text-violet-700 text-lg">{mobility?.maxCommuteMinutes || 45} min</span>
                  <span className="text-slate-500">120 min</span>
                </div>
              </div>
            </div>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              mobility?.willingToRelocate ? 'bg-violet-50 border-violet-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}>
              <input
                type="checkbox"
                checked={mobility?.willingToRelocate || false}
                onChange={(e) => updateMobility({ willingToRelocate: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                mobility?.willingToRelocate ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
              )}>
                {mobility?.willingToRelocate && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Villig att flytta för rätt jobb</span>
                <span className="text-xs text-slate-500">Öppen för jobb i andra städer eller regioner</span>
              </div>
            </label>
          </div>
        </CollapsibleSection>

        {/* 3. Salary & Benefits */}
        <CollapsibleSection
          title="Lön & Förmåner"
          icon={<Wallet className="w-6 h-6" />}
          theme="salary"
          badge={salary?.expectationMin ? `Från ${salary.expectationMin.toLocaleString()} kr/mån` : undefined}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Löneanspråk (kr/månad före skatt)</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Minimum</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={salary?.expectationMin || ''}
                      onChange={(e) => updateSalary({ expectationMin: parseInt(e.target.value) || undefined })}
                      placeholder="25 000"
                      className="w-full text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kr</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Önskat</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={salary?.expectationMax || ''}
                      onChange={(e) => updateSalary({ expectationMax: parseInt(e.target.value) || undefined })}
                      placeholder="35 000"
                      className="w-full text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kr</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Viktiga förmåner</label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS.map((benefit) => (
                  <button
                    key={benefit}
                    onClick={() => {
                      const current = salary?.importantBenefits || []
                      const updated = current.includes(benefit)
                        ? current.filter(b => b !== benefit)
                        : [...current, benefit]
                      updateSalary({ importantBenefits: updated })
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                      salary?.importantBenefits?.includes(benefit)
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {benefit}
                  </button>
                ))}
              </div>
              {(salary?.importantBenefits?.length || 0) > 0 && (
                <p className="mt-3 text-sm text-green-700 font-medium">
                  {salary?.importantBenefits?.length} förmåner valda
                </p>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* 4. Labor Market Status */}
        <CollapsibleSection
          title="Arbetsmarknadsstatus"
          icon={<Building2 className="w-6 h-6" />}
          theme="labor"
          badge={laborMarketStatus?.registeredAtAF ? 'Registrerad hos AF' : undefined}
        >
          <div className="space-y-4">
            <label className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              laborMarketStatus?.registeredAtAF ? 'bg-sky-50 border-sky-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.registeredAtAF || false}
                onChange={(e) => updateLaborMarketStatus({ registeredAtAF: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                laborMarketStatus?.registeredAtAF ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
              )}>
                {laborMarketStatus?.registeredAtAF && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Registrerad hos Arbetsförmedlingen</span>
                <span className="text-xs text-slate-500">Inskriven som arbetssökande</span>
              </div>
            </label>

            <label className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              laborMarketStatus?.participatingInProgram ? 'bg-sky-50 border-sky-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.participatingInProgram || false}
                onChange={(e) => updateLaborMarketStatus({ participatingInProgram: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                laborMarketStatus?.participatingInProgram ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
              )}>
                {laborMarketStatus?.participatingInProgram && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Deltar i arbetsmarknadsåtgärd</span>
                <span className="text-xs text-slate-500">T.ex. Jobbgarantin, Etablering, praktik</span>
              </div>
            </label>

            {laborMarketStatus?.participatingInProgram && (
              <div className="pl-10">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vilket program?</label>
                <select
                  value={laborMarketStatus?.programName || ''}
                  onChange={(e) => updateLaborMarketStatus({ programName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm"
                >
                  <option value="">Välj program...</option>
                  {AF_PROGRAMS.map((prog) => (
                    <option key={prog.value} value={prog.value}>{prog.label}</option>
                  ))}
                </select>
              </div>
            )}

            <label className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              laborMarketStatus?.hasActivitySupport ? 'bg-sky-50 border-sky-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.hasActivitySupport || false}
                onChange={(e) => updateLaborMarketStatus({ hasActivitySupport: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                laborMarketStatus?.hasActivitySupport ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
              )}>
                {laborMarketStatus?.hasActivitySupport && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Har aktivitetsstöd/ersättning</span>
                <span className="text-xs text-slate-500">Aktivitetsstöd, a-kassa eller annan ersättning</span>
              </div>
            </label>
          </div>
        </CollapsibleSection>

        {/* 5. Work Preferences */}
        <CollapsibleSection
          title="Arbetspreferenser"
          icon={<Settings2 className="w-6 h-6" />}
          theme="preferences"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Önskad sektor</label>
              <CheckboxGroup
                options={SECTORS}
                selected={workPreferences?.sectors || []}
                onChange={(sectors) => updateWorkPreferences({ sectors: sectors as any })}
                columns={3}
                accentColor="fuchsia"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Önskad företagsstorlek</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => {
                      const current = workPreferences?.companySizes || []
                      const updated = current.includes(size.value as any)
                        ? current.filter(s => s !== size.value)
                        : [...current, size.value as any]
                      updateWorkPreferences({ companySizes: updated })
                    }}
                    className={cn(
                      'px-3 py-3 rounded-xl border-2 text-center transition-all',
                      workPreferences?.companySizes?.includes(size.value as any)
                        ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="block text-sm font-semibold">{size.label}</span>
                    <span className="block text-xs text-slate-500">{size.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Viktiga värden hos arbetsgivare</label>
              <div className="flex flex-wrap gap-2">
                {VALUES.map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      const current = workPreferences?.importantValues || []
                      const updated = current.includes(value)
                        ? current.filter(v => v !== value)
                        : [...current, value]
                      updateWorkPreferences({ importantValues: updated })
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                      workPreferences?.importantValues?.includes(value)
                        ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 6. Physical Requirements */}
        <CollapsibleSection
          title="Fysiska förutsättningar"
          icon={<Accessibility className="w-6 h-6" />}
          theme="physical"
          badge="Frivilligt"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-100/50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                Denna information är helt frivillig och hjälper oss att matcha dig med jobb som passar dina behov.
                Informationen delas endast med arbetsgivare om du väljer det.
              </p>
            </div>

            <label className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              physicalRequirements?.hasAdaptationNeeds ? 'bg-slate-100 border-slate-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}>
              <input
                type="checkbox"
                checked={physicalRequirements?.hasAdaptationNeeds || false}
                onChange={(e) => updatePhysicalRequirements({ hasAdaptationNeeds: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                physicalRequirements?.hasAdaptationNeeds ? 'bg-slate-600 border-slate-600' : 'border-slate-300'
              )}>
                {physicalRequirements?.hasAdaptationNeeds && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Jag har anpassningsbehov</span>
                <span className="text-xs text-slate-500">T.ex. tillgänglighet, arbetstidsanpassning, hjälpmedel</span>
              </div>
            </label>

            {physicalRequirements?.hasAdaptationNeeds && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Beskriv dina behov (valfritt)</label>
                <textarea
                  value={physicalRequirements?.adaptationDescription || ''}
                  onChange={(e) => updatePhysicalRequirements({ adaptationDescription: e.target.value })}
                  placeholder="Beskriv eventuella anpassningar du behöver på arbetsplatsen..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 text-sm resize-none"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5" />
            </div>
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-emerald-700 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="font-medium">Profilen har sparats!</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 shadow-lg',
            saving
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] hover:shadow-xl'
          )}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Spara profil
            </>
          )}
        </button>
      </div>
    </div>
  )
}
