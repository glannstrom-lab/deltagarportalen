import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userApi } from '../services/api'
import {
  User, Save, CheckCircle, Camera, Phone, MapPin, Mail,
  FileText, Sparkles, Lightbulb, Compass, ChevronRight
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import {
  Card,
  CardHeader,
  CardSection,
  Input,
  Textarea,
  Button,
  LoadingState,
  ErrorState,
  InfoCard,
  StatCard
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { getPersonalityStrengths } from '@/services/interestPersonalization'

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
    _count?: {
      cv?: number
      coverLetters?: number
    }
    interestResult?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
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

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await userApi.updateProfile(formData)
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

  if (loading) {
    return (
      <PageLayout title={t('profile.title')} showTabs={false}>
        <LoadingState
          title={t('profile.loading')}
          message={t('profile.loadingMessage')}
          fullHeight
        />
      </PageLayout>
    )
  }

  if (error && !profile) {
    return (
      <PageLayout title={t('profile.title')} showTabs={false}>
        <ErrorState
          title={t('profile.errorLoadingTitle')}
          message={error}
          onRetry={loadProfile}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('profile.title')}
      description={t('profile.description')}
      showTabs={false}
      className="max-w-3xl mx-auto"
    >
      {/* Profile Card */}
      <Card variant="elevated">
        {/* Profile Header with Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-slate-100">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center shadow-inner">
              <User size={48} className="text-indigo-600" />
            </div>
            <button 
              className={cn(
                'absolute -bottom-1 -right-1 w-8 h-8',
                'bg-indigo-600 hover:bg-indigo-700 text-white',
                'rounded-full flex items-center justify-center shadow-md',
                'transition-colors'
              )}
              title={t('profile.uploadPhotoSoon')}
              onClick={() => alert(t('profile.uploadPhotoSoon'))}
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-800">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 mt-1">
              <Mail size={14} />
              <span>{profile?.email || t('profile.noEmail')}</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {t('profile.memberSince')} {new Date(profile?.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name Fields */}
          <CardSection title={t('profile.personalInfo')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.firstName')}
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder={t('profile.firstNamePlaceholder')}
                leftIcon={<User size={16} />}
              />
              <Input
                label={t('profile.lastName')}
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder={t('profile.lastNamePlaceholder')}
                leftIcon={<User size={16} />}
              />
            </div>
          </CardSection>

          {/* Contact Fields */}
          <CardSection title={t('profile.contactInfo')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t('profile.phonePlaceholder')}
                leftIcon={<Phone size={16} />}
              />
              <Input
                label={t('profile.location')}
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={t('profile.locationPlaceholder')}
                leftIcon={<MapPin size={16} />}
              />
            </div>
          </CardSection>

          {/* Bio Field */}
          <CardSection title={t('profile.aboutMe')}>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              hint={t('profile.bioHint')}
              maxLength={500}
            />
          </CardSection>

          {/* Email Field (Read-only) */}
          <CardSection>
            <Input
              label={t('profile.email')}
              type="email"
              value={profile?.email || ''}
              disabled
              leftIcon={<Mail size={16} />}
              hint={t('profile.emailHint')}
            />
          </CardSection>

          {/* Error Message */}
          {error && (
            <InfoCard variant="error" title={t('profile.errorOccurred')}>
              {error}
            </InfoCard>
          )}

          {/* Success Message */}
          {saved && (
            <InfoCard variant="success" title={t('profile.savedTitle')}>
              {t('profile.savedMessage')}
            </InfoCard>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              loadingText={t('profile.saving')}
              leftIcon={saved ? <CheckCircle size={18} /> : <Save size={18} />}
              touchOptimized
            >
              {saved ? t('profile.savedTitle') : t('profile.saveChanges')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          value={profile?._count?.cv !== undefined ? profile._count.cv : '—'}
          label={t('profile.cvUpdates')}
          icon={<FileText className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          value={profile?._count?.coverLetters !== undefined ? profile._count.coverLetters : '—'}
          label={t('profile.coverLetters')}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          value={profile?.interestResult ? '✓' : '—'}
          label={t('profile.interestGuide')}
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* RIASEC Profile Section */}
      {!interestLoading && interestProfile.hasResult && interestProfile.riasecScores && (
        <Card variant="elevated">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Din intresseprofil
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Baserat på ditt resultat från intresseguiden
              </p>

              {/* Dominant Types */}
              {interestProfile.dominantTypes.length > 0 && (
                <div className="mt-4 space-y-3">
                  {interestProfile.dominantTypes.slice(0, 3).map((type, index) => {
                    const riasecType = RIASEC_TYPES[type.code]
                    const percentage = type.score
                    return (
                      <div key={type.code}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {index === 0 && '🥇 '}
                            {index === 1 && '🥈 '}
                            {index === 2 && '🥉 '}
                            {riasecType.nameSv}
                          </span>
                          <span className="text-sm text-slate-500">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              index === 0 ? "bg-amber-500" :
                              index === 1 ? "bg-amber-400" : "bg-amber-300"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{riasecType.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Strengths */}
              {interestProfile.riasecScores && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Dina styrkor</h4>
                  <div className="flex flex-wrap gap-2">
                    {getPersonalityStrengths(interestProfile.riasecScores).slice(0, 6).map((strength, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full border border-amber-200"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to Interest Guide */}
              <Link
                to="/interest-guide"
                className="inline-flex items-center gap-2 mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Gör om intresseguiden
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* CTA to complete Interest Guide */}
      {!interestLoading && !interestProfile.hasResult && (
        <Link to="/interest-guide" className="block">
          <Card variant="elevated" className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 hover:border-violet-300 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Compass className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  Upptäck din intresseprofil
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Gör intresseguiden för att få personaliserade rekommendationer
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-violet-400" />
            </div>
          </Card>
        </Link>
      )}

      {/* Quick Tips */}
      <InfoCard
        variant="info"
        icon={<Lightbulb className="w-5 h-5" />}
        title={t('profile.tipsTitle')}
      >
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>{t('profile.tip1')}</li>
          <li>{t('profile.tip2')}</li>
          <li>{t('profile.tip3')}</li>
        </ul>
      </InfoCard>
    </PageLayout>
  )
}
