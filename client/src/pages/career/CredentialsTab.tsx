/**
 * Credentials Tab - Track certifications and education requirements with cloud storage
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, CheckCircle, Plus, Trash2, Calendar, Award, BookOpen, Loader2 } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { credentialsApi, type UserCredential } from '@/services/careerApi'
import { showToast } from '@/components/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui'

/**
 * Förslag att lägga till med ett klick.
 *
 * Listan var skriven för fel person: Google Analytics, AWS, Scrum Master,
 * PMP, PRINCE2, Azure, HubSpot — sju av åtta IT- och projektledningscertifikat
 * för en portal vars målgrupp är långtidsarbetslösa, ofta med fysiska eller
 * psykiska hinder. PMP kräver dessutom tre års dokumenterad projektledning
 * och en avgift, men presenterades som en ettklicksknapp. Samma felklass som
 * `International.tsx` rättade 2026-08-20 ("skriven för fel person").
 *
 * Portalens egen data pekade åt andra hållet hela tiden: en flik bort visar
 * Arbetsmarknad att yrkesgrupperna med flest lediga jobb är personliga
 * assistenter, undersköterskor, sjuksköterskor och lärare.
 *
 * Listan nedan är yrkesbevis som är breda, konkreta och vanligt förekommande
 * som krav i svenska annonser. Inga kostnader, inga tidsangivelser och inga
 * behörighetsvillkor står här — de varierar per anordnare och skulle bli
 * gamla utan att någon märkte det. (2026-08-21)
 */
const POPULAR_CREDENTIALS = [
  { name: 'Truckkort A + B', issuer: 'TLP-10', type: 'license' as const },
  { name: 'YKB — yrkesförarkompetens', issuer: 'Transportstyrelsen', type: 'license' as const },
  { name: 'HLR och första hjälpen', issuer: 'HLR-rådet', type: 'course' as const },
  { name: 'Livsmedelshygien', issuer: 'Utbildningsanordnare', type: 'course' as const },
  { name: 'Heta arbeten', issuer: 'Brandskyddsföreningen', type: 'license' as const },
  { name: 'Delegering läkemedel', issuer: 'Arbetsgivare i vården', type: 'course' as const },
  { name: 'Väktarutbildning (VU1)', issuer: 'Auktoriserat bevakningsföretag', type: 'license' as const },
  { name: 'B-körkort', issuer: 'Transportstyrelsen', type: 'license' as const },
  { name: 'SFI — svenska för invandrare', issuer: 'Din kommun', type: 'course' as const },
  { name: 'Grundläggande datorkunskap', issuer: 'Utbildningsanordnare', type: 'course' as const },
]

type CredentialType = 'certification' | 'degree' | 'course' | 'license'

export default function CredentialsTab() {
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()
  const [credentials, setCredentials] = useState<UserCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
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

  /**
   * Fem felvägar sväljdes tyst i den här filen — `catch { console.error }`
   * utan toast, utan felläge, utan retry. Konkret: misslyckades hämtningen
   * släckte `finally` spinnern och användaren såg INGA meriter, inte "vi
   * kunde inte hämta dina meriter". Klickade man "Lägg till" och insertet
   * fallerade stannade formuläret kvar och ingenting hände. Nu har läsningen
   * ett tredje läge och varje mutation en toast.
   */
  const loadCredentials = async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const data = await credentialsApi.getAll()
      setCredentials(data)
    } catch (err) {
      console.error('Failed to load credentials:', err)
      setLoadError(true)
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
      showToast.error(t('career.credentials.saveFailed'))
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
      showToast.error(t('career.credentials.saveFailed'))
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
      showToast.error(t('career.credentials.saveFailed'))
    }
  }

  const deleteCredential = async (id: string) => {
    // Native confirm() stod här. Projektets egen dialog hanterar fokus och
    // går att formge; texten sa dessutom "denna credential" på en flik som
    // heter Meriter.
    const ok = await confirm({
      title: t('career.credentials.confirmDeleteTitle'),
      message: t('career.credentials.confirmDeleteBody'),
      confirmText: t('career.credentials.confirmDeleteCta'),
      cancelText: t('career.credentials.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await credentialsApi.delete(id)
      setCredentials(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete credential:', err)
      showToast.error(t('career.credentials.deleteFailed'))
    }
  }

  const stats = {
    completed: credentials.filter(c => c.status === 'completed').length,
    inProgress: credentials.filter(c => c.status === 'in-progress').length,
    planned: credentials.filter(c => c.status === 'planned').length,
  }

  const getTypeLabel = (type: CredentialType) => t(`career.credentials.types.${type}`)

  /** ISO-datum ur databasen renderades rått som "2026-09-01". */
  const visaDatum = (iso?: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)]" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <Card className="p-8 text-center" role="alert">
        <Award className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('career.credentials.loadErrorTitle')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mb-4 max-w-md mx-auto">
          {t('career.credentials.loadErrorBody')}
        </p>
        <Button onClick={loadCredentials}>{t('career.credentials.retry')}</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rubrik. Pastellbandet med ikonruta som stod här var en kvarglömd
          hjälte — skenan säger redan vilken sida det är (DESIGN.md §3). */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
          {t('career.credentials.title')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {t('career.credentials.description')}
        </p>
      </div>

      {/* Stats. Siffrorna ändras när man byter status på en merit; utan
          role="status" annonseras ingenting. */}
      {credentials.length > 0 && (
        <div className="grid grid-cols-3 gap-4" role="status" aria-live="polite">
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-[var(--c-text)] tabular-nums">{stats.completed}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.completed')}</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-[var(--c-text)] tabular-nums">{stats.inProgress}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.inProgress')}</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-stone-700 dark:text-stone-300 tabular-nums">{stats.planned}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.credentials.status.planned')}</p>
          </Card>
        </div>
      )}

      {/* Tomtillstånd. Sidan sa tidigare ingenstans att listan var tom — mellan
          "Lägg till"-knappen och förslagen fanns bara luft (DESIGN.md §7). */}
      {credentials.length === 0 && !isAdding && (
        <EmptyState
          illustration="karriar"
          title={t('career.credentials.emptyTitle')}
          description={t('career.credentials.emptyBody')}
          action={{
            label: t('career.credentials.addCredential'),
            onClick: () => setIsAdding(true),
          }}
        />
      )}

      {/* Add form */}
      {isAdding ? (
        <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-white dark:bg-stone-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.credentials.addCredential')}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="credentialstab-f1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.name')} *</label>
              <input
                id="credentialstab-f1"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('career.credentials.form.namePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="credentialstab-f2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.issuer')}</label>
                <input
                  id="credentialstab-f2"
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('career.credentials.form.issuerPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="credentialstab-f3" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.type')}</label>
                <select
                  id="credentialstab-f3"
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
              <label htmlFor="credentialstab-f4" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('career.credentials.form.targetDate')}</label>
              <input
                id="credentialstab-f4"
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
      ) : credentials.length > 0 ? (
        /* Bara när listan har innehåll. Är den tom bär tomtillståndet ovan
           samma knapp, och DESIGN.md §7 tillåter EN tydlig CTA — inte två
           identiska under varandra. */
        <Button onClick={() => setIsAdding(true)} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90">
          <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
          {t('career.credentials.addCredential')}
        </Button>
      ) : null}

      {/* My credentials */}
      {credentials.length > 0 && (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.credentials.myCredentials')}</h3>
          <div className="space-y-3">
            {credentials.map((cred) => {
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
                          {/* En sida = en hub-färg. Badgen bar tidigare
                              violet/blue/emerald/amber, och 'blue' renderade
                              dessutom hubbfärg i ljust läge men blått i
                              mörkt. Typen framgår av texten. */}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] border border-[var(--c-accent)] text-[var(--c-text)]">
                            {getTypeLabel(cred.type)}
                          </span>
                          {cred.target_date && cred.status !== 'completed' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {t('career.credentials.targetDateLabel')}: {visaDatum(cred.target_date)}
                            </span>
                          )}
                          {cred.completed_date && (
                            <span className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t('career.credentials.completedDateLabel')}: {visaDatum(cred.completed_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCredential(cred.id)}
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded text-rose-600 dark:text-rose-400"
                      aria-label={t('career.credentials.deleteLabel', { name: cred.name })}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Status buttons */}
                  {/* Signalerades tidigare ENBART med färg: ingen
                      role/aria-checked, ingen aria-pressed. En skärmläsare
                      hörde tre identiska knappar och fick ingen bekräftelse
                      på att något hände. */}
                  <div
                    className="flex gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-600"
                    role="group"
                    aria-label={t('career.credentials.statusGroupLabel', { name: cred.name })}
                  >
                    <button
                      onClick={() => updateStatus(cred.id, 'planned')}
                      aria-pressed={cred.status === 'planned'}
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
                      aria-pressed={cred.status === 'in-progress'}
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
                      aria-pressed={cred.status === 'completed'}
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
          {/* `.slice(0, 6)` stod här och dolde de sista posterna helt — SFI låg
              på index 8 och kunde aldrig visas förrän användaren lagt till två
              andra. Listan är kort nog att visas hel. */}
          {POPULAR_CREDENTIALS.filter(p => !credentials.find(c => c.name === p.name)).map((cred) => (
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
