/**
 * ProfileSharing - Skapa och hantera delbara profillänkar
 * Updated with ARIA attributes and toast notifications
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Copy, QrCode, Trash2, Loader2, Plus, Eye, Calendar, Check, ExternalLink } from '@/components/ui/icons'
import { profileShareApi, type ProfileShare } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'
import { notifications } from '@/lib/toast'

interface Props {
  className?: string
}

export function ProfileSharing({ className }: Props) {
  const { t } = useTranslation()
  const [shares, setShares] = useState<ProfileShare[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // New share form
  const [formData, setFormData] = useState({
    name: '',
    show_contact: true,
    show_skills: true,
    show_experience: true,
    show_education: true,
    show_documents: false,
    show_summary: true,
    expires_in_days: 30,
    max_views: 0 // 0 = unlimited
  })

  useEffect(() => {
    loadShares()
  }, [])

  const loadShares = async () => {
    try {
      const data = await profileShareApi.getAll()
      setShares(data)
    } catch (err) {
      console.error('Error loading shares:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const share = await profileShareApi.create({
        name: formData.name || undefined,
        show_contact: formData.show_contact,
        show_skills: formData.show_skills,
        show_experience: formData.show_experience,
        show_education: formData.show_education,
        show_documents: formData.show_documents,
        show_summary: formData.show_summary,
        expires_in_days: formData.expires_in_days || undefined,
        max_views: formData.max_views || undefined
      })
      setShares(prev => [share, ...prev])
      setShowForm(false)
      setFormData({
        name: '',
        show_contact: true,
        show_skills: true,
        show_experience: true,
        show_education: true,
        show_documents: false,
        show_summary: true,
        expires_in_days: 30,
        max_views: 0
      })
    } catch (err) {
      console.error('Error creating share:', err)
    } finally {
      setCreating(false)
    }
  }

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await profileShareApi.delete(id)
        setShares(prev => prev.filter(s => s.id !== id))
        notifications.success(t('profile.sharing.deleteSuccess'))
      } catch (err) {
        console.error('Error deleting share:', err)
        notifications.error(t('profile.sharing.deleteError'))
      } finally {
        setDeleteConfirm(null)
      }
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const copyToClipboard = async (shareCode: string) => {
    try {
      const url = profileShareApi.getShareUrl(shareCode)
      await navigator.clipboard.writeText(url)
      setCopied(shareCode)
      notifications.success(t('profile.sharing.linkCopied'))
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      notifications.error(t('profile.sharing.copyError'))
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE')
  }

  const isExpired = (share: ProfileShare) => {
    if (!share.expires_at) return false
    return new Date(share.expires_at) < new Date()
  }

  const getQRCodeUrl = (shareCode: string) => {
    const shareUrl = profileShareApi.getShareUrl(shareCode)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Create new share button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl hover:border-brand-300 dark:hover:border-brand-900/50 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors"
        >
          <Plus className="w-5 h-5 text-brand-900" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {t('profile.sharing.createNewLink')}
          </span>
        </button>
      ) : (
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">
              {t('profile.sharing.newShareLink')}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              {t('common.cancel')}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              {t('profile.sharing.nameOptional')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('profile.sharing.namePlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
              {t('profile.sharing.whatToShow')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'show_summary', labelKey: 'profile.sharing.summary' },
                { key: 'show_contact', labelKey: 'profile.sharing.contactInfo' },
                { key: 'show_skills', labelKey: 'profile.sharing.skills' },
                { key: 'show_experience', labelKey: 'profile.sharing.experience' },
                { key: 'show_education', labelKey: 'profile.sharing.education' },
                { key: 'show_documents', labelKey: 'profile.sharing.documents' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[item.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{t(item.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                {t('profile.sharing.validFor')}
              </label>
              <select
                value={formData.expires_in_days}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
              >
                <option value="7">{t('profile.sharing.days', { count: 7 })}</option>
                <option value="30">{t('profile.sharing.days', { count: 30 })}</option>
                <option value="90">{t('profile.sharing.days', { count: 90 })}</option>
                <option value="365">{t('profile.sharing.oneYear')}</option>
                <option value="0">{t('profile.sharing.unlimited')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                {t('profile.sharing.maxViews')}
              </label>
              <select
                value={formData.max_views}
                onChange={(e) => setFormData(prev => ({ ...prev, max_views: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
              >
                <option value="0">{t('profile.sharing.unlimited')}</option>
                <option value="1">1</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full px-4 py-2 bg-brand-900 hover:bg-brand-900/90 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('profile.sharing.creating')}
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                {t('profile.sharing.createLink')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Shares list */}
      {shares.length > 0 ? (
        <div className="space-y-2">
          {shares.map(share => (
            <div
              key={share.id}
              className={cn(
                'p-4 bg-white dark:bg-stone-800 rounded-xl border transition-colors',
                isExpired(share)
                  ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
                  : 'border-stone-200 dark:border-stone-700'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-4 h-4 text-brand-900" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                      {share.name || t('profile.sharing.shareLink')}
                    </span>
                    {isExpired(share) && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                        {t('profile.sharing.expired')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {t('profile.sharing.viewCount', { count: share.view_count })}
                      {share.max_views && ` / ${share.max_views}`}
                    </span>
                    {share.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t('profile.sharing.validUntil', { date: formatDate(share.expires_at) })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                    {share.show_summary && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">{t('profile.sharing.summary')}</span>}
                    {share.show_contact && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">{t('profile.sharing.contact')}</span>}
                    {share.show_skills && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">{t('profile.sharing.skills')}</span>}
                    {share.show_experience && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">{t('profile.sharing.experience')}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(share.share_code)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      copied === share.share_code
                        ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500'
                    )}
                    title={t('profile.sharing.copyLink')}
                  >
                    {copied === share.share_code ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={profileShareApi.getShareUrl(share.share_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 rounded-lg transition-colors"
                    title={t('profile.sharing.openLink')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <a
                    href={getQRCodeUrl(share.share_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 rounded-lg transition-colors"
                    title={t('profile.sharing.showQRCode')}
                  >
                    <QrCode className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDelete(share.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                    title={t('common.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
          {t('profile.sharing.noShareLinks')}
        </p>
      )}
    </div>
  )
}
