/**
 * ProfileSharing - Skapa och hantera delbara profillänkar
 */

import { useState, useEffect } from 'react'
import { Link2, Copy, QrCode, Trash2, Loader2, Plus, Eye, Calendar, Check, ExternalLink } from '@/components/ui/icons'
import { profileShareApi, type ProfileShare } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function ProfileSharing({ className }: Props) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Vill du ta bort denna delningslänk?')) return

    try {
      await profileShareApi.delete(id)
      setShares(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting share:', err)
    }
  }

  const copyToClipboard = async (shareCode: string) => {
    const url = profileShareApi.getShareUrl(shareCode)
    await navigator.clipboard.writeText(url)
    setCopied(shareCode)
    setTimeout(() => setCopied(null), 2000)
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
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Create new share button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors"
        >
          <Plus className="w-5 h-5 text-teal-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Skapa ny delningslänk
          </span>
        </button>
      ) : (
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">
              Ny delningslänk
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              Avbryt
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Namn (valfritt)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="T.ex. Jobbansökan Volvo"
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
              Vad ska visas?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'show_summary', label: 'Sammanfattning' },
                { key: 'show_contact', label: 'Kontaktinfo' },
                { key: 'show_skills', label: 'Kompetenser' },
                { key: 'show_experience', label: 'Erfarenhet' },
                { key: 'show_education', label: 'Utbildning' },
                { key: 'show_documents', label: 'Dokument' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[item.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Giltig i (dagar)
              </label>
              <select
                value={formData.expires_in_days}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              >
                <option value="7">7 dagar</option>
                <option value="30">30 dagar</option>
                <option value="90">90 dagar</option>
                <option value="365">1 år</option>
                <option value="0">Obegränsat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Max visningar
              </label>
              <select
                value={formData.max_views}
                onChange={(e) => setFormData(prev => ({ ...prev, max_views: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              >
                <option value="0">Obegränsat</option>
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
            className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Skapar...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Skapa länk
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
                    <Link2 className="w-4 h-4 text-teal-500" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                      {share.name || 'Delningslänk'}
                    </span>
                    {isExpired(share) && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                        Utgången
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {share.view_count} visningar
                      {share.max_views && ` / ${share.max_views}`}
                    </span>
                    {share.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Giltigt t.o.m. {formatDate(share.expires_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                    {share.show_summary && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">Sammanfattning</span>}
                    {share.show_contact && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">Kontakt</span>}
                    {share.show_skills && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">Skills</span>}
                    {share.show_experience && <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded">Erfarenhet</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(share.share_code)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      copied === share.share_code
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-600'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500'
                    )}
                    title="Kopiera länk"
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
                    title="Öppna länk"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <a
                    href={getQRCodeUrl(share.share_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 rounded-lg transition-colors"
                    title="Visa QR-kod"
                  >
                    <QrCode className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDelete(share.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Ta bort"
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
          Inga delningslänkar skapade än. Skapa en länk för att dela din profil med arbetsgivare.
        </p>
      )}
    </div>
  )
}
