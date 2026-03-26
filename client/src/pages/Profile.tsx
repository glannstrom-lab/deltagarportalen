/**
 * Profile Page - Utökad med jobbsökarrelevant information
 * Inkluderar: Kontaktinfo, önskade jobb, intressen, tillgänglighet, mobilitet,
 * lön, arbetsmarknadsstatus, arbetspreferenser och fysiska förutsättningar
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
  ChevronDown, ChevronUp, Calendar, Globe, Home
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
  { value: 'freelance', label: 'Frilans/Konsult' },
  { value: 'temporary', label: 'Vikariat' },
  { value: 'internship', label: 'Praktik' },
]

const REMOTE_OPTIONS = [
  { value: 'yes', label: 'Ja, enbart distans' },
  { value: 'hybrid', label: 'Hybrid (delvis distans)' },
  { value: 'no', label: 'Nej, på plats' },
]

const DRIVERS_LICENSES = ['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C', 'CE', 'D', 'DE']

const SECTORS = [
  { value: 'private', label: 'Privat sektor' },
  { value: 'public', label: 'Offentlig sektor' },
  { value: 'nonprofit', label: 'Ideell sektor' },
]

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10 anställda)' },
  { value: 'small', label: 'Litet företag (11-50)' },
  { value: 'medium', label: 'Medelstort (51-200)' },
  { value: 'large', label: 'Stort företag (201-1000)' },
  { value: 'enterprise', label: 'Storföretag (1000+)' },
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

// ============== COMPONENTS ==============

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, badge }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {badge && (
              <span className="text-xs text-slate-500">{badge}</span>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 border-t border-slate-100">
          {children}
        </div>
      )}
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
  colorClass?: string
}

function TagInput({ tags, onAdd, onRemove, suggestions = [], placeholder, maxTags = 5, colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200' }: TagInputProps) {
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

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, index) => (
          <span
            key={index}
            className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm', colorClass)}
          >
            {tag}
            <button
              onClick={() => onRemove(index)}
              className="w-4 h-4 rounded-full bg-current/20 hover:bg-current/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
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
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <button
              onClick={() => handleAdd(input)}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAdd(suggestion)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-700 text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CheckboxGroupProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  columns?: number
}

function CheckboxGroup({ options, selected, onChange, columns = 2 }: CheckboxGroupProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1')}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors',
            selected.includes(option.value)
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">{option.label}</span>
        </label>
      ))}
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

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: ''
  })

  // Desired jobs (top 3)
  const [desiredJobs, setDesiredJobs] = useState<string[]>([])

  // Interests (top 3)
  const [interests, setInterests] = useState<string[]>([])

  // Extended profile data
  const [availability, setAvailability] = useState<ProfilePreferences['availability']>({})
  const [mobility, setMobility] = useState<ProfilePreferences['mobility']>({})
  const [salary, setSalary] = useState<ProfilePreferences['salary']>({})
  const [laborMarketStatus, setLaborMarketStatus] = useState<ProfilePreferences['labor_market_status']>({})
  const [workPreferences, setWorkPreferences] = useState<ProfilePreferences['work_preferences']>({})
  const [physicalRequirements, setPhysicalRequirements] = useState<ProfilePreferences['physical_requirements']>({})

  // Cloud sync status
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [cloudSynced, setCloudSynced] = useState(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load profile and saved preferences from cloud
  useEffect(() => {
    loadProfile()
    loadPreferencesFromCloud()
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

  // Auto-save to cloud with debounce
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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Job handlers
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

  // Interest handlers
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

  // Update helpers for nested objects
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Laddar profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                <User className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
              <button
                className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-50 transition-colors"
                onClick={() => alert('Bilduppladdning kommer snart!')}
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {formData.first_name || 'Din'} {formData.last_name || 'Profil'}
              </h1>
              <p className="text-indigo-200 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
              {formData.location && (
                <p className="text-indigo-200 mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-4 h-4" />
                  {formData.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6 -mt-4">

        {/* Interest Guide CTA */}
        {!interestLoading && !interestProfile.hasResult && (
          <Link
            to="/interest-guide"
            className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-amber-100 text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  Nästa steg
                </div>
                <h2 className="text-lg sm:text-xl font-bold">Gör intresseguiden</h2>
                <p className="text-amber-100 text-sm mt-1">
                  Upptäck vilka yrken som passar dig bäst
                </p>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform hidden sm:block" />
            </div>
          </Link>
        )}

        {/* Contact Information - Always Open */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Kontaktuppgifter</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Förnamn</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Ditt förnamn"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Ditt efternamn"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="070-123 45 67"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Stockholm"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">E-postadressen kan inte ändras</p>
            </div>
          </div>
        </div>

        {/* Desired Jobs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Önskade jobb</h2>
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
            colorClass="bg-blue-50 text-blue-700 border-blue-200"
          />
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Dina intressen</h2>
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
            colorClass="bg-rose-50 text-rose-700 border-rose-200"
          />
        </div>

        {/* RIASEC Results */}
        {!interestLoading && interestProfile.hasResult && interestProfile.dominantTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Din intresseprofil</h2>
                <p className="text-sm text-slate-500">Resultat från intresseguiden</p>
              </div>
            </div>
            <div className="space-y-3">
              {interestProfile.dominantTypes.slice(0, 3).map((type, index) => {
                const riasecType = RIASEC_TYPES[type.code]
                const medals = ['🥇', '🥈', '🥉']
                const colors = ['bg-amber-500', 'bg-slate-400', 'bg-amber-700']
                return (
                  <div key={type.code} className="flex items-center gap-4">
                    <span className="text-2xl">{medals[index]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-800">{riasecType.nameSv}</span>
                        <span className="text-sm text-slate-500">{type.score}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', colors[index])}
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
              className="inline-flex items-center gap-2 mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Gör om intresseguiden
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* === NEW SECTIONS === */}

        {/* 1. Availability & Job Search Status */}
        <CollapsibleSection
          title="Tillgänglighet"
          icon={<Clock className="w-5 h-5" />}
          badge={availability?.status ? EMPLOYMENT_STATUSES.find(s => s.value === availability.status)?.label : undefined}
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nuvarande status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMPLOYMENT_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateAvailability({ status: status.value as any })}
                    className={cn(
                      'px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      availability?.status === status.value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">När kan du börja?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'immediately', label: 'Omgående' },
                  { value: '2_weeks', label: '2 veckor' },
                  { value: '1_month', label: '1 månad' },
                  { value: '2_months', label: '2 månader' },
                  { value: '3_months', label: '3 månader' },
                  { value: 'other', label: 'Annat' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateAvailability({ availableFrom: option.value })}
                    className={cn(
                      'px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      availability?.availableFrom === option.value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Önskad anställningsform</label>
              <CheckboxGroup
                options={EMPLOYMENT_TYPES}
                selected={availability?.employmentTypes || []}
                onChange={(types) => updateAvailability({ employmentTypes: types as any })}
                columns={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Öppen för distansarbete?</label>
              <div className="grid grid-cols-3 gap-2">
                {REMOTE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateAvailability({ remoteWork: option.value as any })}
                    className={cn(
                      'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      availability?.remoteWork === option.value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Mobility & Drivers License */}
        <CollapsibleSection
          title="Mobilitet & Körkort"
          icon={<Car className="w-5 h-5" />}
          badge={mobility?.driversLicense?.length ? `Körkort ${mobility.driversLicense.join(', ')}` : undefined}
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Körkort</label>
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
                      'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                      mobility?.driversLicense?.includes(license)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {license}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                mobility?.hasCar ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
              )}>
                <input
                  type="checkbox"
                  checked={mobility?.hasCar || false}
                  onChange={(e) => updateMobility({ hasCar: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Har tillgång till bil</span>
              </label>

              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                mobility?.willingToTravel ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
              )}>
                <input
                  type="checkbox"
                  checked={mobility?.willingToTravel || false}
                  onChange={(e) => updateMobility({ willingToTravel: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Villig att resa i tjänsten</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max pendlingstid (minuter enkel väg)</label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={mobility?.maxCommuteMinutes || 45}
                onChange={(e) => updateMobility({ maxCommuteMinutes: parseInt(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>15 min</span>
                <span className="font-medium text-indigo-600">{mobility?.maxCommuteMinutes || 45} min</span>
                <span>120 min</span>
              </div>
            </div>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
              mobility?.willingToRelocate ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
            )}>
              <input
                type="checkbox"
                checked={mobility?.willingToRelocate || false}
                onChange={(e) => updateMobility({ willingToRelocate: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Villig att flytta för rätt jobb</span>
                <p className="text-xs text-slate-500 mt-0.5">Öppen för jobb i andra städer/regioner</p>
              </div>
            </label>
          </div>
        </CollapsibleSection>

        {/* 3. Salary & Benefits */}
        <CollapsibleSection
          title="Lön & Förmåner"
          icon={<Wallet className="w-5 h-5" />}
          badge={salary?.expectationMin ? `Från ${salary.expectationMin.toLocaleString()} kr/mån` : undefined}
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Löneanspråk (kr/månad före skatt)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Minimum</label>
                  <input
                    type="number"
                    value={salary?.expectationMin || ''}
                    onChange={(e) => updateSalary({ expectationMin: parseInt(e.target.value) || undefined })}
                    placeholder="25000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Önskat</label>
                  <input
                    type="number"
                    value={salary?.expectationMax || ''}
                    onChange={(e) => updateSalary({ expectationMax: parseInt(e.target.value) || undefined })}
                    placeholder="35000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Viktiga förmåner</label>
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
                      'px-3 py-1.5 rounded-full border text-sm transition-colors',
                      salary?.importantBenefits?.includes(benefit)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {benefit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 4. Labor Market Status */}
        <CollapsibleSection
          title="Arbetsmarknadsstatus"
          icon={<Building2 className="w-5 h-5" />}
          badge={laborMarketStatus?.registeredAtAF ? 'Registrerad hos AF' : undefined}
        >
          <div className="space-y-4 mt-4">
            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
              laborMarketStatus?.registeredAtAF ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.registeredAtAF || false}
                onChange={(e) => updateLaborMarketStatus({ registeredAtAF: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Registrerad hos Arbetsförmedlingen</span>
                <p className="text-xs text-slate-500 mt-0.5">Inskriven som arbetssökande</p>
              </div>
            </label>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
              laborMarketStatus?.participatingInProgram ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.participatingInProgram || false}
                onChange={(e) => updateLaborMarketStatus({ participatingInProgram: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Deltar i arbetsmarknadsåtgärd</span>
                <p className="text-xs text-slate-500 mt-0.5">T.ex. Jobbgarantin, Etablering, praktik</p>
              </div>
            </label>

            {laborMarketStatus?.participatingInProgram && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vilket program?</label>
                <select
                  value={laborMarketStatus?.programName || ''}
                  onChange={(e) => updateLaborMarketStatus({ programName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">Välj program...</option>
                  {AF_PROGRAMS.map((prog) => (
                    <option key={prog.value} value={prog.value}>{prog.label}</option>
                  ))}
                </select>
              </div>
            )}

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
              laborMarketStatus?.hasActivitySupport ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
            )}>
              <input
                type="checkbox"
                checked={laborMarketStatus?.hasActivitySupport || false}
                onChange={(e) => updateLaborMarketStatus({ hasActivitySupport: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Har aktivitetsstöd/ersättning</span>
                <p className="text-xs text-slate-500 mt-0.5">Aktivitetsstöd, a-kassa eller annan ersättning</p>
              </div>
            </label>
          </div>
        </CollapsibleSection>

        {/* 5. Work Preferences */}
        <CollapsibleSection
          title="Arbetspreferenser"
          icon={<Settings2 className="w-5 h-5" />}
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Önskad sektor</label>
              <CheckboxGroup
                options={SECTORS}
                selected={workPreferences?.sectors || []}
                onChange={(sectors) => updateWorkPreferences({ sectors: sectors as any })}
                columns={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Önskad företagsstorlek</label>
              <div className="flex flex-wrap gap-2">
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
                      'px-3 py-2 rounded-xl border text-sm transition-colors',
                      workPreferences?.companySizes?.includes(size.value as any)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Viktiga värden hos arbetsgivare</label>
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
                      'px-3 py-1.5 rounded-full border text-sm transition-colors',
                      workPreferences?.importantValues?.includes(value)
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
          icon={<Accessibility className="w-5 h-5" />}
          badge="Frivilligt"
        >
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                Denna information är helt frivillig och hjälper oss att matcha dig med jobb som passar dina behov.
                Informationen delas endast med arbetsgivare om du väljer det.
              </p>
            </div>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
              physicalRequirements?.hasAdaptationNeeds ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
            )}>
              <input
                type="checkbox"
                checked={physicalRequirements?.hasAdaptationNeeds || false}
                onChange={(e) => updatePhysicalRequirements({ hasAdaptationNeeds: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Jag har anpassningsbehov</span>
                <p className="text-xs text-slate-500 mt-0.5">T.ex. tillgänglighet, arbetstidsanpassning, hjälpmedel</p>
              </div>
            </label>

            {physicalRequirements?.hasAdaptationNeeds && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Beskriv dina behov (valfritt)</label>
                <textarea
                  value={physicalRequirements?.adaptationDescription || ''}
                  onChange={(e) => updatePhysicalRequirements({ adaptationDescription: e.target.value })}
                  placeholder="Beskriv eventuella anpassningar du behöver på arbetsplatsen..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Profilen har sparats!
          </div>
        )}

        {/* Cloud Sync Status */}
        <div className="flex items-center justify-center gap-2 text-sm">
          {cloudSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-slate-500">Synkar till molnet...</span>
            </>
          ) : cloudSynced ? (
            <>
              <Cloud className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">Synkat med molnet</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600">Ändringar ej sparade</span>
            </>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
            saving
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
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
