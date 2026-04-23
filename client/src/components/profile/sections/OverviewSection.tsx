/**
 * OverviewSection - Basic info, desired jobs, interests, RIASEC
 * Combines the old "Grundinfo" tab content
 */

import { Link } from 'react-router-dom'
import { User, Briefcase, Heart, Compass, Sparkles, ChevronRight } from '@/components/ui/icons'
import { useProfileStore } from '@/stores/profileStore'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { SectionCard, CompactInput, TagInput } from '../forms'
import {
  SUGGESTED_JOBS,
  SUGGESTED_INTERESTS
} from '../constants'

export function OverviewSection() {
  const {
    profile,
    preferences,
    updateProfile,
    updatePreferences
  } = useProfileStore()

  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  // Handlers
  const handleChange = (field: string, value: string) => {
    updateProfile({ [field]: value })
  }

  const addJob = (job: string) => {
    const currentJobs = preferences.desired_jobs || []
    if (currentJobs.length < 5) {
      updatePreferences({ desired_jobs: [...currentJobs, job] })
    }
  }

  const removeJob = (index: number) => {
    const currentJobs = preferences.desired_jobs || []
    updatePreferences({ desired_jobs: currentJobs.filter((_, i) => i !== index) })
  }

  const addInterest = (interest: string) => {
    const currentInterests = preferences.interests || []
    if (currentInterests.length < 5) {
      updatePreferences({ interests: [...currentInterests, interest] })
    }
  }

  const removeInterest = (index: number) => {
    const currentInterests = preferences.interests || []
    updatePreferences({ interests: currentInterests.filter((_, i) => i !== index) })
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-overview"
      aria-labelledby="tab-overview"
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Contact info */}
      <SectionCard title="Kontaktuppgifter" icon={<User className="w-4 h-4" />} colorScheme="teal">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <CompactInput
              label="Förnamn"
              value={profile?.first_name || ''}
              onChange={(v) => handleChange('first_name', v)}
              placeholder="Förnamn"
            />
            <CompactInput
              label="Efternamn"
              value={profile?.last_name || ''}
              onChange={(v) => handleChange('last_name', v)}
              placeholder="Efternamn"
            />
          </div>
          <CompactInput
            label="Telefon"
            type="tel"
            value={profile?.phone || ''}
            onChange={(v) => handleChange('phone', v)}
            placeholder="070-123 45 67"
          />
          <CompactInput
            label="Ort"
            value={profile?.location || ''}
            onChange={(v) => handleChange('location', v)}
            placeholder="Stockholm"
          />
          <CompactInput
            label="E-post"
            value={profile?.email || ''}
            disabled
          />
        </div>
      </SectionCard>

      {/* Desired jobs */}
      <SectionCard title="Önskade jobb" icon={<Briefcase className="w-4 h-4" />} colorScheme="sky">
        <TagInput
          tags={preferences.desired_jobs || []}
          onAdd={addJob}
          onRemove={removeJob}
          suggestions={SUGGESTED_JOBS}
          placeholder="T.ex. Projektledare"
          maxTags={5}
          colorScheme="sky"
          hint="Lägg till de jobb du är intresserad av"
        />
      </SectionCard>

      {/* Interests */}
      <SectionCard title="Intressen" icon={<Heart className="w-4 h-4" />} colorScheme="amber">
        <TagInput
          tags={preferences.interests || []}
          onAdd={addInterest}
          onRemove={removeInterest}
          suggestions={SUGGESTED_INTERESTS}
          placeholder="T.ex. Teknik"
          maxTags={5}
          colorScheme="amber"
          hint="Vad intresserar dig i arbetslivet?"
        />
      </SectionCard>

      {/* RIASEC profile */}
      {!interestLoading && interestProfile.hasResult && (
        <SectionCard title="Intresseprofil (RIASEC)" icon={<Compass className="w-4 h-4" />} colorScheme="teal">
          <div className="space-y-2">
            {interestProfile.dominantTypes.slice(0, 3).map((type, i) => {
              const rt = RIASEC_TYPES[type.code]
              return (
                <div key={type.code} className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{['🥇', '🥈', '🥉'][i]}</span>
                  <span className="text-sm font-medium flex-1 text-stone-800 dark:text-stone-200">
                    {rt.nameSv}
                  </span>
                  <div
                    className="w-20 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={type.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${rt.nameSv}: ${type.score}%`}
                  >
                    <div
                      className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                      style={{ width: `${type.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-600 dark:text-stone-400 w-8">
                    {type.score}%
                  </span>
                </div>
              )
            })}
          </div>
          <Link
            to="/interest-guide"
            className="inline-flex items-center gap-1 mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            Gör om guiden <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </SectionCard>
      )}

      {/* Interest guide CTA */}
      {!interestLoading && !interestProfile.hasResult && (
        <Link
          to="/interest-guide"
          className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50 flex items-center gap-4 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-800 dark:text-amber-300">Upptäck dina styrkor</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Gör intresseguiden för personliga jobbförslag
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 dark:text-amber-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
