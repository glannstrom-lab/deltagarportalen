/**
 * Credentials Tab - Track certifications and education requirements with cloud storage
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, CheckCircle, Plus, Trash2, Calendar, Award, BookOpen, Loader2 } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { credentialsApi, type UserCredential } from '@/services/careerApi'

const POPULAR_CREDENTIALS = [
  { name: 'Google Analytics Certification', issuer: 'Google', type: 'certification' as const },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon', type: 'certification' as const },
  { name: 'Scrum Master Certification', issuer: 'Scrum.org', type: 'certification' as const },
  { name: 'Project Management Professional (PMP)', issuer: 'PMI', type: 'certification' as const },
  { name: 'PRINCE2 Foundation', issuer: 'Axelos', type: 'certification' as const },
  { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft', type: 'certification' as const },
  { name: 'HubSpot Inbound Marketing', issuer: 'HubSpot', type: 'certification' as const },
  { name: 'SFI - Svenska för invandrare', issuer: 'Kommun', type: 'course' as const },
]

type CredentialType = 'certification' | 'degree' | 'course' | 'license'

export default function CredentialsTab() {
  const { t } = useTranslation()
  const [credentials, setCredentials] = useState<UserCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    type: 'certification' as CredentialType,
    targetDate: '',
  })

  // Load from cloud
  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    setIsLoading(true)
    try {
      const data = await credentialsApi.getAll()
      setCredentials(data)
    } catch (err) {
      console.error('Failed to load credentials:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.name.trim()) return
    setIsSaving(true)
    try {
      const saved = await credentialsApi.save({
        name: formData.name,
        issuer: formData.issuer || undefined,
        type: formData.type,
        status: 'planned',
        target_date: formData.targetDate || undefined,
      })
      setCredentials(prev => [saved, ...prev])
      setFormData({ name: '', issuer: '', type: 'certification', targetDate: '' })
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to save credential:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPopular = async (cred: typeof POPULAR_CREDENTIALS[0]) => {
    setIsSaving(true)
    try {
      const saved = await credentialsApi.save({
        name: cred.name,
        issuer: cred.issuer,
        type: cred.type,
        status: 'planned',
      })
      setCredentials(prev => [saved, ...prev])
    } catch (err) {
      console.error('Failed to save credential:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const updateStatus = async (id: string, status: UserCredential['status']) => {
    try {
      const updated = await credentialsApi.updateStatus(id, status)
      setCredentials(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const deleteCredential = async (id: string) => {
    if (!confirm(t('career.credentials.confirmDelete'))) return
    try {
      await credentialsApi.delete(id)
      setCredentials(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete credential:', err)
    }
  }

  const stats = {
    completed: credentials.filter(c => c.status === 'completed').length,
    inProgress: credentials.filter(c => c.status === 'in-progress').length,
    planned: credentials.filter(c => c.status === 'planned').length,
  }

  const getTypeLabel = (type: CredentialType) => t(`career.credentials.types.${type}`)
  const getTypeColor = (type: CredentialType) => {
    const colors = {
      certification: 'violet',
      degree: 'blue',
      course: 'emerald',
      license: 'amber',
    }
    return colors[type]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)]" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[var(--c-bg)] to-violet-50 dark:from-[var(--c-bg)]/30 dark:to-violet-900/20 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('career.credentials.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('career.credentials.description')}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {credentials.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">{stats.completed}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.completed')}</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.inProgress')}</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.planned}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.planned')}</p>
          </Card>
        </div>
      )}

      {/* Add form */}
      {isAdding ? (
        <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-white dark:bg-stone-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.credentials.addCredential')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.name')} *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('career.credentials.form.namePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.issuer')}</label>
                <input
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('career.credentials.form.issuerPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CredentialType }))}
                  className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100"
                >
                  <option value="certification">{t('career.credentials.types.certification')}</option>
                  <option value="degree">{t('career.credentials.types.degree')}</option>
                  <option value="course">{t('career.credentials.types.course')}</option>
                  <option value="license">{t('career.credentials.types.license')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.targetDate')}</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!formData.name.trim() || isSaving} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90 dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {t('common.add')}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90 dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]">
          <Plus className="w-4 h-4 mr-1" />
          {t('career.credentials.addCredential')}
        </Button>
      )}

      {/* My credentials */}
      {credentials.length > 0 && (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.credentials.myCredentials')}</h3>
          <div className="space-y-3">
            {credentials.map((cred) => {
              const typeColor = getTypeColor(cred.type)
              return (
                <div
                  key={cred.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    cred.status === 'completed' && "bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50",
                    cred.status === 'in-progress' && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                    cred.status === 'planned' && "bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        cred.status === 'completed' && "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40",
                        cred.status === 'in-progress' && "bg-amber-100 dark:bg-amber-900/30",
                        cred.status === 'planned' && "bg-stone-100 dark:bg-stone-600"
                      )}>
                        {cred.status === 'completed' ? (
                          <Award className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                        ) : cred.status === 'in-progress' ? (
                          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{cred.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cred.issuer}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            typeColor === 'violet' && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
                            typeColor === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                            typeColor === 'emerald' && "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]",
                            typeColor === 'amber' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                          )}>
                            {getTypeLabel(cred.type)}
                          </span>
                          {cred.target_date && cred.status !== 'completed' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {t('career.credentials.targetDateLabel')}: {cred.target_date}
                            </span>
                          )}
                          {cred.completed_date && (
                            <span className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t('career.credentials.completedDateLabel')}: {cred.completed_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCredential(cred.id)}
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-600">
                    <button
                      onClick={() => updateStatus(cred.id, 'planned')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'planned'
                          ? "bg-gray-600 text-white"
                          : "bg-stone-100 dark:bg-stone-600 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-500"
                      )}
                    >
                      {t('career.credentials.status.planned')}
                    </button>
                    <button
                      onClick={() => updateStatus(cred.id, 'in-progress')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'in-progress'
                          ? "bg-amber-600 text-white"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                      )}
                    >
                      {t('career.credentials.status.inProgress')}
                    </button>
                    <button
                      onClick={() => updateStatus(cred.id, 'completed')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'completed'
                          ? "bg-[var(--c-solid)] text-white"
                          : "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-bg)]/50"
                      )}
                    >
                      {t('career.credentials.status.completed')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Popular suggestions */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.credentials.popularCredentials')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_CREDENTIALS.filter(p => !credentials.find(c => c.name === p.name)).slice(0, 6).map((cred) => (
            <button
              key={cred.name}
              onClick={() => handleAddPopular(cred)}
              disabled={isSaving}
              className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30 transition-all text-left group disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-lg flex items-center justify-center group-hover:bg-[var(--c-accent)]/60 dark:group-hover:bg-[var(--c-bg)]/50">
                <Plus className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{cred.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{cred.issuer}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
