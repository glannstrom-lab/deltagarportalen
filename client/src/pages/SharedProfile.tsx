/**
 * SharedProfile - Public view of a shared profile
 * Accessible via /profile/shared/:shareCode
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Star, FileText, Calendar, Loader2, AlertCircle, ArrowLeft
} from '@/components/ui/icons'
import { profileShareApi, type ProfileShare } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

export default function SharedProfile() {
  const { t } = useTranslation()
  const { shareCode } = useParams<{ shareCode: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [share, setShare] = useState<ProfileShare | null>(null)

  useEffect(() => {
    loadSharedProfile()
  }, [shareCode])

  const loadSharedProfile = async () => {
    if (!shareCode) {
      setError(t('sharedProfile.noShareCode'))
      setLoading(false)
      return
    }

    try {
      const result = await profileShareApi.getSharedProfile(shareCode)
      if (!result) {
        setError(t('sharedProfile.linkInvalid'))
        setLoading(false)
        return
      }

      setProfile(result.profile)
      setShare(result.share)
    } catch (err) {
      console.error('Error loading shared profile:', err)
      setError(t('sharedProfile.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            {t('sharedProfile.couldNotDisplay')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {error || t('sharedProfile.linkInvalid')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('sharedProfile.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 to-sky-500 h-24" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-700 border-4 border-white dark:border-stone-700 shadow-lg overflow-hidden flex items-center justify-center">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url as string}
                    alt="Profilbild"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-stone-400" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-200">
                  {profile.first_name as string} {profile.last_name as string}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        {share?.show_contact && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
              {t('sharedProfile.contactInfo')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-teal-500" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">{profile.email as string}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal-500" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">{profile.phone as string}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">{profile.location as string}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {share?.show_summary && profile.ai_summary && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
              {t('sharedProfile.aboutMe')}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
              {profile.ai_summary as string}
            </p>
          </div>
        )}

        {/* Skills */}
        {share?.show_skills && (profile.skills as unknown[])?.length > 0 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {t('sharedProfile.skills')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skills as Array<{ name: string; level: number }>).map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg"
                >
                  <span className="text-sm text-stone-700 dark:text-stone-300">{skill.name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          level <= skill.level
                            ? 'bg-amber-400'
                            : 'bg-stone-300 dark:bg-stone-600'
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {share?.show_experience && (profile.work_experience as unknown[])?.length > 0 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              {t('sharedProfile.workExperience')}
            </h2>
            <div className="space-y-4">
              {(profile.work_experience as Array<{
                title: string
                company: string
                startDate: string
                endDate?: string
                current?: boolean
                description?: string
              }>).map((job, i) => (
                <div key={i} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  <h3 className="font-medium text-stone-800 dark:text-stone-200">{job.title}</h3>
                  <p className="text-sm text-teal-600 dark:text-teal-400">{job.company}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(job.startDate)} - {job.current ? t('common.today') : job.endDate ? formatDate(job.endDate) : ''}
                  </p>
                  {job.description && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {share?.show_education && (profile.education as unknown[])?.length > 0 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              {t('sharedProfile.education')}
            </h2>
            <div className="space-y-4">
              {(profile.education as Array<{
                degree: string
                school: string
                startDate: string
                endDate?: string
              }>).map((edu, i) => (
                <div key={i} className="border-l-2 border-purple-200 dark:border-purple-800 pl-4">
                  <h3 className="font-medium text-stone-800 dark:text-stone-200">{edu.degree}</h3>
                  <p className="text-sm text-teal-600 dark:text-teal-400">{edu.school}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {share?.show_documents && (profile.documents as unknown[])?.length > 0 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-500" />
              {t('sharedProfile.documents')}
            </h2>
            <div className="grid gap-2">
              {(profile.documents as Array<{ name: string; type: string; file_url: string }>).map((doc, i) => (
                <a
                  key={i}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  <FileText className="w-5 h-5 text-sky-500" />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{doc.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-stone-400 dark:text-stone-500 mt-8">
          <p>{t('sharedProfile.sharedVia')}</p>
          {share?.expires_at && (
            <p className="mt-1">
              {t('sharedProfile.linkValidUntil', { date: new Date(share.expires_at).toLocaleDateString('sv-SE') })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
