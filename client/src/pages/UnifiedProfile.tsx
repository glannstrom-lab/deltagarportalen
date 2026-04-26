/**
 * UnifiedProfilePage - Fas 2
 * 
 * Single source of truth för all profilinformation.
 * Sammanfogar data från CV, intresseguide, grundprofil, etc.
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Briefcase, MapPin, Mail, Phone,
  Edit2, Save, X, Camera, CheckCircle2,
  Target, Sparkles, GraduationCap, Award,
  TrendingUp, ChevronRight, Loader2
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { unifiedProfileApi, type UnifiedProfileData } from '@/services/unifiedProfileApi'
import { ImageUpload } from '@/components/ImageUpload'

export default function UnifiedProfilePage() {
  const { t, i18n } = useTranslation()
  const [profile, setProfile] = useState<Partial<UnifiedProfileData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'settings'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editedCore, setEditedCore] = useState<Partial<UnifiedProfileData['core']>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const data = await unifiedProfileApi.getProfile()
    setProfile(data)
    setEditedCore(data.core || {})
    setLoading(false)
  }

  const handleSaveCore = async () => {
    setSaving(true)
    try {
      await unifiedProfileApi.updateCore(editedCore)
      await loadProfile()
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (url: string) => {
    await unifiedProfileApi.updateCore({ ...profile.core, profileImageUrl: url })
    await loadProfile()
  }

  const completeness = unifiedProfileApi.calculateCompleteness(profile)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-brand-900" />
        </div>
      </div>
    )
  }

  const { core, professional, career, usage } = profile

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden mb-6">
        {/* Cover / Banner */}
        <div className="h-32 bg-brand-900" />
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-xl border-4 border-white dark:border-stone-800 bg-white dark:bg-stone-800 overflow-hidden">
                {core?.profileImageUrl ? (
                  <img 
                    src={core.profileImageUrl} 
                    alt="Profilbild"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center">
                    <User size={40} className="text-slate-600 dark:text-stone-400" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-900/90 transition-colors">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = await unifiedProfileApi.uploadProfileImage(file)
                      handleImageUpload(url)
                    }
                  }}
                />
              </label>
            </div>

            {/* Name & Title */}
            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-100">
                {core?.firstName} {core?.lastName}
              </h1>
              <p className="text-slate-700 dark:text-stone-300 flex flex-wrap items-center gap-3 mt-1">
                {core?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {core.location}
                  </span>
                )}
                {core?.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {core.email}
                  </span>
                )}
              </p>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 rounded-lg hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <Edit2 size={16} />
                  {t('unifiedProfile.edit')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedCore(core || {})
                    }}
                    className="p-2 text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleSaveCore}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-900/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {t('unifiedProfile.save')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Completeness Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-stone-300">
                {t('unifiedProfile.profileCompleteness')}
              </span>
              <span className={cn(
                "text-sm font-bold",
                completeness >= 80 ? "text-brand-900" :
                completeness >= 50 ? "text-amber-600" : "text-rose-600"
              )}>
                {completeness}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  completeness >= 80 ? "bg-brand-700" :
                  completeness >= 50 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-slate-700 dark:text-stone-300 mt-1.5">
              {completeness < 100
                ? t('unifiedProfile.completenessHint.incomplete')
                : t('unifiedProfile.completenessHint.complete')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-stone-700">
        {[
          { id: 'profile', label: t('unifiedProfile.tabs.profile'), icon: User },
          { id: 'career', label: t('unifiedProfile.tabs.career'), icon: Target },
          { id: 'settings', label: t('unifiedProfile.tabs.settings'), icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-brand-900 dark:text-brand-400 border-brand-900 dark:border-brand-400"
                : "text-slate-600 dark:text-stone-400 border-transparent hover:text-slate-900 dark:hover:text-stone-100"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <>
            {/* Core Info */}
            <Section title={t('unifiedProfile.sections.basicInfo')} icon={User}>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('unifiedProfile.fields.firstName')}
                    value={editedCore.firstName || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, firstName: v }))}
                  />
                  <Input
                    label={t('unifiedProfile.fields.lastName')}
                    value={editedCore.lastName || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, lastName: v }))}
                  />
                  <Input
                    label={t('unifiedProfile.fields.email')}
                    type="email"
                    value={editedCore.email || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, email: v }))}
                  />
                  <Input
                    label={t('unifiedProfile.fields.phone')}
                    value={editedCore.phone || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, phone: v }))}
                  />
                  <Input
                    label={t('unifiedProfile.fields.location')}
                    value={editedCore.location || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, location: v }))}
                    placeholder={t('unifiedProfile.fields.locationPlaceholder')}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">
                      {t('unifiedProfile.fields.summary')}
                    </label>
                    <textarea
                      value={editedCore.summary || ''}
                      onChange={(e) => setEditedCore(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder={t('unifiedProfile.fields.summaryPlaceholder')}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label={t('unifiedProfile.fields.firstName')} value={core?.firstName} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  <InfoItem label={t('unifiedProfile.fields.lastName')} value={core?.lastName} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  <InfoItem label={t('unifiedProfile.fields.email')} value={core?.email} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  <InfoItem label={t('unifiedProfile.fields.phone')} value={core?.phone} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  <InfoItem label={t('unifiedProfile.fields.location')} value={core?.location} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  <div className="sm:col-span-2">
                    <InfoItem label={t('unifiedProfile.fields.summary')} value={core?.summary} notSpecifiedText={t('unifiedProfile.notSpecified')} />
                  </div>
                </div>
              )}
            </Section>

            {/* Skills */}
            <Section title={t('unifiedProfile.sections.skills')} icon={Sparkles}>
              <div className="flex flex-wrap gap-2">
                {professional?.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-900 dark:text-brand-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {(!professional?.skills || professional.skills.length === 0) && (
                  <p className="text-slate-700 dark:text-stone-300 text-sm">
                    {t('unifiedProfile.noSkills')}{' '}
                    <Link to="/cv" className="text-brand-900 hover:underline">
                      {t('unifiedProfile.addInCVBuilder')}
                    </Link>
                  </p>
                )}
              </div>
            </Section>

            {/* Experience Preview */}
            <Section title={t('unifiedProfile.sections.experience')} icon={Briefcase}>
              {professional?.workExperience && professional.workExperience.length > 0 ? (
                <div className="space-y-3">
                  {professional.workExperience.slice(0, 3).map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase size={18} className="text-slate-700 dark:text-stone-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-stone-100">{exp.title}</p>
                        <p className="text-sm text-slate-700 dark:text-stone-300">{exp.company}</p>
                      </div>
                    </div>
                  ))}
                  {professional.workExperience.length > 3 && (
                    <Link
                      to="/cv"
                      className="text-sm text-brand-900 hover:underline flex items-center gap-1"
                    >
                      {t('unifiedProfile.seeAllExperiences', { count: professional.workExperience.length })}
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-slate-700 dark:text-stone-300 text-sm">
                  {t('unifiedProfile.noExperience')}{' '}
                  <Link to="/cv" className="text-brand-900 hover:underline">
                    {t('unifiedProfile.addInCVBuilder')}
                  </Link>
                </p>
              )}
            </Section>

            {/* Education Preview */}
            <Section title={t('unifiedProfile.sections.education')} icon={GraduationCap}>
              {professional?.education && professional.education.length > 0 ? (
                <div className="space-y-3">
                  {professional.education.slice(0, 2).map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={18} className="text-slate-700 dark:text-stone-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-stone-100">{edu.degree}</p>
                        <p className="text-sm text-slate-700 dark:text-stone-300">{edu.school}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700 dark:text-stone-300 text-sm">
                  {t('unifiedProfile.noEducation')}{' '}
                  <Link to="/cv" className="text-brand-900 hover:underline">
                    {t('unifiedProfile.addInCVBuilder')}
                  </Link>
                </p>
              )}
            </Section>
          </>
        )}

        {activeTab === 'career' && (
          <>
            {/* Interest Guide Results */}
            <Section title={t('unifiedProfile.sections.interests')} icon={Sparkles}>
              {career?.riasecScores ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(career.riasecScores).map(([type, score]) => (
                      <div
                        key={type}
                        className="bg-slate-50 dark:bg-stone-800 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize text-slate-700 dark:text-stone-300">
                            {t(`unifiedProfile.riasec.${type}`)}
                          </span>
                          <span className="text-sm font-bold text-brand-900 dark:text-brand-400">
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-900 rounded-full"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/interest-guide"
                    className="text-sm text-brand-900 hover:underline"
                  >
                    {t('unifiedProfile.retakeInterestGuide')}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-stone-800 rounded-xl">
                  <Sparkles size={32} className="mx-auto mb-3 text-slate-600 dark:text-stone-400" />
                  <p className="text-slate-600 dark:text-stone-400 mb-3">
                    {t('unifiedProfile.noInterestGuide')}
                  </p>
                  <Link
                    to="/interest-guide"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-900/90"
                  >
                    {t('unifiedProfile.takeInterestGuide')}
                  </Link>
                </div>
              )}
            </Section>

            {/* Top Occupations */}
            {career?.topOccupations && career.topOccupations.length > 0 && (
              <Section title={t('unifiedProfile.sections.recommendedJobs')} icon={Target}>
                <div className="flex flex-wrap gap-2">
                  {career.topOccupations.map((occupation, idx) => (
                    <Link
                      key={idx}
                      to={`/job-search?query=${encodeURIComponent(occupation)}`}
                      className="px-4 py-2 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-slate-700 dark:text-stone-300 hover:border-brand-300 dark:hover:border-brand-900/50 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                    >
                      {occupation}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Career Goals */}
            <Section title={t('unifiedProfile.sections.careerGoals')} icon={TrendingUp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-stone-800 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-stone-300 mb-1">{t('unifiedProfile.careerGoalsLabels.shortTerm')}</h4>
                  <p className="text-slate-900 dark:text-stone-100">
                    {career?.careerGoals?.shortTerm || t('unifiedProfile.careerGoalsLabels.notSpecified')}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-stone-800 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-stone-300 mb-1">{t('unifiedProfile.careerGoalsLabels.longTerm')}</h4>
                  <p className="text-slate-900 dark:text-stone-100">
                    {career?.careerGoals?.longTerm || t('unifiedProfile.careerGoalsLabels.notSpecified')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Preferred Roles */}
            <Section title={t('unifiedProfile.sections.preferredRoles')} icon={CheckCircle2}>
              {career?.preferredRoles && career.preferredRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {career.preferredRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-brand-100 dark:bg-brand-900/50 text-brand-900 dark:text-brand-300 rounded-full text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700 dark:text-stone-300 text-sm">
                  {t('unifiedProfile.noPreferredRoles')}
                </p>
              )}
            </Section>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* Usage Stats */}
            <Section title={t('unifiedProfile.sections.activity')} icon={TrendingUp}>
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label={t('unifiedProfile.stats.applications')}
                  value={usage?.applicationsCount || 0}
                  link="/job-tracker"
                />
                <StatCard
                  label={t('unifiedProfile.stats.coverLetters')}
                  value={usage?.coverLettersCount || 0}
                  link="/cover-letter"
                />
                <StatCard
                  label={t('unifiedProfile.stats.cvUpdate')}
                  value={usage?.cvLastUpdated
                    ? new Date(usage.cvLastUpdated).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', { month: 'short', day: 'numeric' })
                    : t('unifiedProfile.stats.never')
                  }
                  link="/cv"
                  isDate={!!usage?.cvLastUpdated}
                />
              </div>
            </Section>

            {/* Data Usage */}
            <Section title={t('unifiedProfile.sections.dataUsage')} icon={CheckCircle2}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-brand-900 dark:text-brand-400" />
                    <span className="text-slate-700 dark:text-stone-300">{t('unifiedProfile.dataUsageLabels.cvBuilder')}</span>
                  </div>
                  <span className="text-sm text-brand-900 dark:text-brand-400 font-medium">
                    {professional?.workExperience && professional.workExperience.length > 0 ? t('unifiedProfile.dataUsageLabels.active') : t('unifiedProfile.dataUsageLabels.empty')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-brand-900 dark:text-brand-400" />
                    <span className="text-slate-700 dark:text-stone-300">{t('unifiedProfile.dataUsageLabels.coverLetter')}</span>
                  </div>
                  <span className="text-sm text-brand-900 dark:text-brand-400 font-medium">
                    {usage?.coverLettersCount ? t('unifiedProfile.dataUsageLabels.saved', { count: usage.coverLettersCount }) : t('unifiedProfile.dataUsageLabels.noLetters')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-brand-900 dark:text-brand-400" />
                    <span className="text-slate-700 dark:text-stone-300">{t('unifiedProfile.dataUsageLabels.jobTracker')}</span>
                  </div>
                  <span className="text-sm text-brand-900 dark:text-brand-400 font-medium">
                    {usage?.applicationsCount ? t('unifiedProfile.dataUsageLabels.applicationsCount', { count: usage.applicationsCount }) : t('unifiedProfile.dataUsageLabels.noApplications')}
                  </span>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function Section({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon: React.ComponentType<{ size: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-6">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-stone-100 mb-4">
        <Icon size={20} className="text-brand-900" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoItem({ label, value, notSpecifiedText = 'Not specified' }: { label: string; value?: string; notSpecifiedText?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-0.5">
        {label}
      </label>
      <p className="text-slate-900 dark:text-stone-100">
        {value || <span className="text-slate-600 dark:text-stone-400 italic">{notSpecifiedText}</span>}
      </p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-900"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  link,
  isDate = false
}: {
  label: string
  value: string | number
  link: string
  isDate?: boolean
}) {
  return (
    <Link
      to={link}
      className="block bg-slate-50 dark:bg-stone-800 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
    >
      <p className={cn(
        "font-bold text-slate-900 dark:text-stone-100",
        isDate ? "text-lg" : "text-2xl"
      )}>
        {value}
      </p>
      <p className="text-sm text-slate-700 dark:text-stone-300">{label}</p>
    </Link>
  )
}
