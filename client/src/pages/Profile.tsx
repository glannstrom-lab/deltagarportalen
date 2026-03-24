/**
 * Profile Page - Modern design with desired jobs, interests, and interest guide CTA
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userApi } from '../services/api'
import {
  User, Save, CheckCircle, Camera, Phone, MapPin, Mail,
  Sparkles, Compass, ChevronRight, Briefcase, Heart,
  Plus, X, Loader2, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'

// Suggested jobs for autocomplete
const SUGGESTED_JOBS = [
  'Projektledare', 'Utvecklare', 'Designer', 'Marknadsförare', 'Säljare',
  'Ekonom', 'HR-specialist', 'Lärare', 'Sjuksköterska', 'Ingenjör',
  'Konsult', 'Chef', 'Administratör', 'Analytiker', 'Koordinator'
]

// Suggested interests
const SUGGESTED_INTERESTS = [
  'Teknik', 'Kreativitet', 'Ledarskap', 'Problemlösning', 'Kommunikation',
  'Analys', 'Teamwork', 'Innovation', 'Strategi', 'Kundkontakt',
  'Projektledning', 'Design', 'Forskning', 'Utbildning', 'Hållbarhet'
]

export default function Profile() {
  const { t, i18n } = useTranslation()
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
  const [newJob, setNewJob] = useState('')
  const [showJobSuggestions, setShowJobSuggestions] = useState(false)

  // Interests (top 3)
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false)

  // Load profile and saved preferences
  useEffect(() => {
    loadProfile()
    loadPreferences()
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

  const loadPreferences = () => {
    try {
      const savedJobs = localStorage.getItem('profile-desired-jobs')
      if (savedJobs) setDesiredJobs(JSON.parse(savedJobs))

      const savedInterests = localStorage.getItem('profile-interests')
      if (savedInterests) setInterests(JSON.parse(savedInterests))
    } catch {
      // Ignore errors
    }
  }

  const savePreferences = (jobs: string[], ints: string[]) => {
    localStorage.setItem('profile-desired-jobs', JSON.stringify(jobs))
    localStorage.setItem('profile-interests', JSON.stringify(ints))
    // Also save profile-data for onboarding tracking
    localStorage.setItem('profile-data', JSON.stringify({
      firstName: formData.first_name,
      lastName: formData.last_name,
      email: profile?.email,
      phone: formData.phone,
      location: formData.location
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await userApi.updateProfile(formData)
      savePreferences(desiredJobs, interests)
      setSaved(true)
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

  const addJob = (job: string) => {
    if (job.trim() && desiredJobs.length < 3 && !desiredJobs.includes(job.trim())) {
      const updated = [...desiredJobs, job.trim()]
      setDesiredJobs(updated)
      savePreferences(updated, interests)
    }
    setNewJob('')
    setShowJobSuggestions(false)
  }

  const removeJob = (index: number) => {
    const updated = desiredJobs.filter((_, i) => i !== index)
    setDesiredJobs(updated)
    savePreferences(updated, interests)
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && interests.length < 3 && !interests.includes(interest.trim())) {
      const updated = [...interests, interest.trim()]
      setInterests(updated)
      savePreferences(desiredJobs, updated)
    }
    setNewInterest('')
    setShowInterestSuggestions(false)
  }

  const removeInterest = (index: number) => {
    const updated = interests.filter((_, i) => i !== index)
    setInterests(updated)
    savePreferences(desiredJobs, updated)
  }

  const filteredJobSuggestions = SUGGESTED_JOBS.filter(
    job => job.toLowerCase().includes(newJob.toLowerCase()) && !desiredJobs.includes(job)
  ).slice(0, 5)

  const filteredInterestSuggestions = SUGGESTED_INTERESTS.filter(
    int => int.toLowerCase().includes(newInterest.toLowerCase()) && !interests.includes(int)
  ).slice(0, 5)

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
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                <User className="w-14 h-14 text-white" />
              </div>
              <button
                className="absolute bottom-0 right-0 w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-50 transition-colors"
                onClick={() => alert('Bilduppladdning kommer snart!')}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Name & Email */}
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 -mt-4">

        {/* Interest Guide CTA - Show if not completed */}
        {!interestLoading && !interestProfile.hasResult && (
          <Link
            to="/interest-guide"
            className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Compass className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-amber-100 text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  Nästa steg
                </div>
                <h2 className="text-xl font-bold">Gör intresseguiden</h2>
                <p className="text-amber-100 text-sm mt-1">
                  Upptäck vilka yrken som passar dig bäst
                </p>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Top 3 Desired Jobs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Önskade jobb</h2>
              <p className="text-sm text-slate-500">Vilka roller drömmer du om? (max 3)</p>
            </div>
          </div>

          {/* Current jobs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {desiredJobs.map((job, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
              >
                <span className="font-medium">{job}</span>
                <button
                  onClick={() => removeJob(index)}
                  className="w-5 h-5 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {desiredJobs.length === 0 && (
              <p className="text-slate-400 text-sm italic">Inga jobb tillagda ännu</p>
            )}
          </div>

          {/* Add new job */}
          {desiredJobs.length < 3 && (
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newJob}
                  onChange={(e) => {
                    setNewJob(e.target.value)
                    setShowJobSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowJobSuggestions(newJob.length > 0)}
                  onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && addJob(newJob)}
                  placeholder="T.ex. Projektledare, UX-designer..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                />
                <button
                  onClick={() => addJob(newJob)}
                  disabled={!newJob.trim()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showJobSuggestions && filteredJobSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {filteredJobSuggestions.map((job) => (
                    <button
                      key={job}
                      onClick={() => addJob(job)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      {job}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top 3 Interests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Dina intressen</h2>
              <p className="text-sm text-slate-500">Vad brinner du för? (max 3)</p>
            </div>
          </div>

          {/* Current interests */}
          <div className="flex flex-wrap gap-2 mb-4">
            {interests.map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-full border border-rose-200"
              >
                <span className="font-medium">{interest}</span>
                <button
                  onClick={() => removeInterest(index)}
                  className="w-5 h-5 bg-rose-200 hover:bg-rose-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <p className="text-slate-400 text-sm italic">Inga intressen tillagda ännu</p>
            )}
          </div>

          {/* Add new interest */}
          {interests.length < 3 && (
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => {
                    setNewInterest(e.target.value)
                    setShowInterestSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowInterestSuggestions(newInterest.length > 0)}
                  onBlur={() => setTimeout(() => setShowInterestSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && addInterest(newInterest)}
                  placeholder="T.ex. Teknik, Kreativitet, Ledarskap..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white text-slate-900"
                />
                <button
                  onClick={() => addInterest(newInterest)}
                  disabled={!newInterest.trim()}
                  className="px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showInterestSuggestions && filteredInterestSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {filteredInterestSuggestions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => addInterest(interest)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interest Profile Results */}
        {!interestLoading && interestProfile.hasResult && interestProfile.dominantTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Din intresseprofil</h2>
                <p className="text-sm text-slate-500">Resultat från intresseguiden</p>
              </div>
            </div>

            <div className="space-y-4">
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

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Kontaktuppgifter</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Förnamn</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="Ditt förnamn"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Efternamn</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Ditt efternamn"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="070-123 45 67"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Stockholm"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">E-postadressen kan inte ändras</p>
          </div>
        </div>

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
