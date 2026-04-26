/**
 * OverviewSection - Enhanced design with icons and better UX
 * Contact info, desired jobs, interests, RIASEC profile
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  User, Briefcase, Heart, Compass, Sparkles, ChevronRight,
  Phone, MapPin, Mail, RefreshCw
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { SectionCard, CompactInput, TagInput } from '../forms'
import {
  SUGGESTED_JOBS,
  SUGGESTED_INTERESTS
} from '../constants'

export function OverviewSection() {
  const { t } = useTranslation()
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
      className="grid gap-4 lg:grid-cols-2"
    >
      {/* Contact info - with icons */}
      <SectionCard title={t('profile.overview.contactInfo')} icon={<User className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <CompactInput
              label={t('profile.overview.firstName')}
              value={profile?.first_name || ''}
              onChange={(v) => handleChange('first_name', v)}
              placeholder={t('profile.overview.firstName')}
            />
            <CompactInput
              label={t('profile.overview.lastName')}
              value={profile?.last_name || ''}
              onChange={(v) => handleChange('last_name', v)}
              placeholder={t('profile.overview.lastName')}
            />
          </div>

          {/* Phone with icon */}
          <CompactInput
            label={t('profile.overview.phone')}
            type="tel"
            value={profile?.phone || ''}
            onChange={(v) => handleChange('phone', v)}
            placeholder="070-123 45 67"
            icon={<Phone className="w-4 h-4" />}
          />

          {/* Location with icon */}
          <CompactInput
            label={t('profile.overview.location')}
            value={profile?.location || ''}
            onChange={(v) => handleChange('location', v)}
            placeholder={t('profile.overview.locationPlaceholder')}
            icon={<MapPin className="w-4 h-4" />}
          />

          {/* Email with icon (disabled) */}
          <CompactInput
            label={t('profile.overview.email')}
            value={profile?.email || ''}
            disabled
            icon={<Mail className="w-4 h-4" />}
          />
        </div>
      </SectionCard>

      {/* Desired jobs - improved */}
      <SectionCard title={t('profile.overview.desiredJobs')} icon={<Briefcase className="w-4 h-4" />} colorScheme="sky">
        <TagInput
          tags={preferences.desired_jobs || []}
          onAdd={addJob}
          onRemove={removeJob}
          suggestions={SUGGESTED_JOBS}
          placeholder={t('profile.overview.desiredJobsPlaceholder')}
          maxTags={5}
          colorScheme="sky"
          hint={t('profile.overview.desiredJobsHint')}
        />
      </SectionCard>

      {/* Interests - improved */}
      <SectionCard title={t('profile.overview.interests')} icon={<Heart className="w-4 h-4" />} colorScheme="amber">
        <TagInput
          tags={preferences.interests || []}
          onAdd={addInterest}
          onRemove={removeInterest}
          suggestions={SUGGESTED_INTERESTS}
          placeholder={t('profile.overview.interestsPlaceholder')}
          maxTags={5}
          colorScheme="amber"
          hint={t('profile.overview.interestsHint')}
        />
      </SectionCard>

      {/* RIASEC profile - enhanced */}
      {!interestLoading && interestProfile.hasResult && (
        <SectionCard title={t('profile.overview.interestProfile')} icon={<Compass className="w-4 h-4" />} colorScheme="teal">
          <div className="space-y-3">
            {/* Explanation */}
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Dina tre starkaste intresseprofiler baserat på intresseguiden:
            </p>

            {interestProfile.dominantTypes.slice(0, 3).map((type, i) => {
              const rt = RIASEC_TYPES[type.code]
              const typeName = t(`interestGuide.riasec.${type.code}`, { defaultValue: rt.nameSv })
              const colors = [
                'bg-amber-500 dark:bg-amber-400',
                'bg-stone-400 dark:bg-stone-500',
                'bg-amber-700 dark:bg-amber-600'
              ]
              return (
                <div key={type.code} className="group">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-stone-400' : 'bg-amber-700'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                          {typeName}
                        </span>
                        <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 ml-2">
                          {type.score}%
                        </span>
                      </div>
                      <div
                        className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={type.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${typeName}: ${type.score}%`}
                      >
                        <div
                          className={cn('h-full rounded-full transition-all', colors[i])}
                          style={{ width: `${type.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Redo guide button */}
            <Link
              to="/interest-guide"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('profile.overview.redoGuide')}
            </Link>
          </div>
        </SectionCard>
      )}

      {/* Interest guide CTA - when no result */}
      {!interestLoading && !interestProfile.hasResult && (
        <Link
          to="/interest-guide"
          className="lg:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50 flex items-center gap-4 hover:shadow-lg transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-800 dark:text-amber-300">{t('profile.overview.discoverStrengths')}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('profile.overview.takeInterestGuide')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 dark:text-amber-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
