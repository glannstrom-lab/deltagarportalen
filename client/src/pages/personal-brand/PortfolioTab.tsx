/**
 * Arbetsprover — det användaren gjort, samlat på ett ställe.
 *
 * Vad som var fel till 2026-08-21:
 *
 * · **Datumfälten gjorde hela posten osparbar.** Fälten är `type="month"`,
 *   som ger värdet `"2026-03"`. Det gick rakt in i `start_date`/`end_date`,
 *   och kolumnerna är av typen `date`. `pg_input_is_valid('2026-03','date')`
 *   är **false** (mätt mot prod), så inserten svarade 400, felet sväljdes av
 *   `handleStorageError`, formuläret stängdes och listan var oförändrad.
 *   Användaren fyllde i titel, beskrivning, taggar och datum, tryckte Spara
 *   — och arbetet var borta utan ett ord. `lint:schema` kan inte se det:
 *   kolumnnamnet är rätt, det är värdet som är fel.
 *
 * · **Delningsknappen delade ingenting.** `copyShareLink` kopierade
 *   `window.location.href`, alltså den inloggningsskyddade rutten. Kodens
 *   egen kommentar sa "In a real app, this would generate a shareable link",
 *   samtidigt som ingressen två rader ovanför lovade "Perfekt att länka till
 *   i ansökningar". Portalen sa alltså till en arbetssökande att skicka en
 *   länk till en arbetsgivare som bara leder till en inloggningssida.
 *   Knappen och löftet är borta tills det finns en riktig delningsvy.
 *
 * · **Sju ikonknappar utan tillgängligt namn**, varav en raderar. Fyra av
 *   dem låg dessutom bakom `opacity-0 group-hover:opacity-100` utan
 *   `focus-within` — en tangentbordsanvändare tabbade in i osynliga knappar.
 *
 * · **URL:en gick orörd in i `href`.** `type="url"` validerades aldrig (det
 *   finns inget `<form>`; Spara är en `onClick`), så `javascript:` gick
 *   igenom. `sanitizeHref` fanns redan i projektet och används nu.
 *
 * · **`viewMode` var dödkod** — `useState` utan setter, så hela
 *   `compact`-grenen (~32 rader) var onåbar. Borttagen.
 */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen, Plus, ExternalLink, Trash2, Edit2, Link as LinkIcon, Github,
  Briefcase, Save, X, Star, Calendar, Award, Loader2, AlertCircle, RefreshCw,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { sanitizeHref } from '@/utils/sanitize'
import { manadTillDatum, datumTillManad, visaPeriod } from './portfolioDatum'
import { personalBrandApi, type PortfolioItem } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'

const TYP_IKON = {
  project: Github,
  work: Briefcase,
  certificate: Award,
  other: FolderOpen,
} as const

type Typ = keyof typeof TYP_IKON
const TYPER = Object.keys(TYP_IKON) as Typ[]

const TOM_FORM = {
  title: '',
  description: '',
  item_type: 'project' as Typ,
  url: '',
  tags: '',
  start_date: '',
  end_date: '',
  is_featured: false,
}

export default function PortfolioTab() {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirmDialog()
  const dateLocale = i18n.language === 'sv' ? 'sv-SE' : 'en-US'

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [laddningsfel, setLaddningsfel] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [urlFel, setUrlFel] = useState(false)
  const [formData, setFormData] = useState(TOM_FORM)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setLaddningsfel(false)
    try {
      setItems(await personalBrandApi.getPortfolioItems())
    } catch (err) {
      // `try/finally` utan `catch` gjorde ett läsfel identiskt med tomt —
      // sidan sa "Ingen portfolio ännu" till någon med sparade poster.
      console.error('Arbetsprover: kunde inte hämta', err)
      setLaddningsfel(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadItems() }, [loadItems])

  const resetForm = () => {
    setFormData(TOM_FORM)
    setEditingItem(null)
    setIsEditing(false)
    setUrlFel(false)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    const rensadUrl = formData.url.trim() ? sanitizeHref(formData.url.trim()) : null
    if (formData.url.trim() && !rensadUrl) {
      setUrlFel(true)
      return
    }
    setUrlFel(false)

    setIsSaving(true)
    try {
      const itemData: PortfolioItem = {
        title: formData.title,
        description: formData.description,
        item_type: formData.item_type,
        url: rensadUrl ?? undefined,
        tags: formData.tags.split(',').map(x => x.trim()).filter(Boolean),
        start_date: manadTillDatum(formData.start_date),
        end_date: manadTillDatum(formData.end_date),
        is_featured: formData.is_featured,
      }

      if (editingItem?.id) {
        await personalBrandApi.updatePortfolioItem(editingItem.id, itemData)
      } else {
        await personalBrandApi.addPortfolioItem(itemData)
      }

      await loadItems()
      resetForm()
      showToast.success(t('personalBrand.portfolio.saved'))
    } catch (err) {
      // Formuläret stängs INTE vid fel — det ifyllda ligger kvar.
      console.error('Arbetsprover: kunde inte spara', err)
      showToast.error(t('personalBrand.portfolio.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      item_type: item.item_type as Typ,
      url: item.url || '',
      tags: item.tags.join(', '),
      start_date: datumTillManad(item.start_date),
      end_date: datumTillManad(item.end_date),
      is_featured: item.is_featured || false,
    })
    setIsEditing(true)
  }

  const handleDelete = async (id: string, titel: string) => {
    const bekraftat = await confirm({
      title: t('personalBrand.portfolio.deleteTitle'),
      message: t('personalBrand.portfolio.deleteBody', { titel }),
      confirmText: t('common.delete'),
      variant: 'danger',
    })
    if (!bekraftat) return

    try {
      await personalBrandApi.deletePortfolioItem(id)
      await loadItems()
      showToast.success(t('personalBrand.portfolio.deleted'))
    } catch (err) {
      // Sväljdes tidigare — användaren trodde att posten var borta.
      console.error('Arbetsprover: kunde inte ta bort', err)
      showToast.error(t('personalBrand.portfolio.deleteFailed'))
    }
  }

  const toggleFeatured = async (item: PortfolioItem) => {
    if (!item.id) return
    try {
      await personalBrandApi.updatePortfolioItem(item.id, { is_featured: !item.is_featured })
      await loadItems()
    } catch (err) {
      console.error('Arbetsprover: kunde inte ändra', err)
      showToast.error(t('personalBrand.portfolio.saveFailed'))
    }
  }

  const utvalda = items.filter(i => i.is_featured)
  const ovriga = items.filter(i => !i.is_featured)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-solid)]" aria-hidden="true" />
        <span className="sr-only">{t('personalBrand.portfolio.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6 text-white dark:text-stone-900" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {t('personalBrand.portfolio.title')}
            </h2>
            <p className="text-stone-700 dark:text-stone-300 mt-1">
              {t('personalBrand.portfolio.intro')}
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
              {t('personalBrand.portfolio.add')}
            </Button>
          )}
        </div>
      </Card>

      {laddningsfel && (
        <Card className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="alert">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
            <p className="text-sm text-stone-800 dark:text-stone-100 flex-1">
              {t('personalBrand.portfolio.loadFailed')}
            </p>
            <Button variant="outline" onClick={loadItems}>
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('common.tryAgain')}
            </Button>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-white dark:bg-stone-800">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                {editingItem ? t('personalBrand.portfolio.editHeading') : t('personalBrand.portfolio.newHeading')}
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pb-portfolio-titel" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('personalBrand.portfolio.fieldTitle')}
                  </label>
                  <input
                    id="pb-portfolio-titel"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    placeholder={t('personalBrand.portfolio.titlePlaceholder')}
                  />
                </div>

                <fieldset>
                  {/* Var tidigare fyra knappar utan tillstånd för skärmläsare
                      — markeringen bars bara av ram och bakgrund. */}
                  <legend className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('personalBrand.portfolio.fieldType')}
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={t('personalBrand.portfolio.fieldType')}>
                    {TYPER.map((typ) => {
                      const Ikon = TYP_IKON[typ]
                      const vald = formData.item_type === typ
                      return (
                        <button
                          key={typ}
                          type="button"
                          role="radio"
                          aria-checked={vald}
                          onClick={() => setFormData(p => ({ ...p, item_type: typ }))}
                          className={cn(
                            'p-3 rounded-lg border text-left transition-all',
                            vald
                              ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30'
                              : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                          )}
                        >
                          <Ikon className={cn('w-5 h-5 mb-1', vald ? 'text-[var(--c-solid)]' : 'text-stone-600 dark:text-stone-400')} aria-hidden="true" />
                          <span className="block font-medium text-sm text-stone-800 dark:text-stone-100">
                            {t(`personalBrand.portfolio.types.${typ}.label`)}
                          </span>
                          <span className="block text-xs text-stone-700 dark:text-stone-400 hidden sm:block">
                            {t(`personalBrand.portfolio.types.${typ}.description`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="pb-portfolio-beskrivning" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('personalBrand.portfolio.fieldDescription')}
                  </label>
                  <textarea
                    id="pb-portfolio-beskrivning"
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] min-h-[100px] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    placeholder={t('personalBrand.portfolio.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pb-portfolio-start" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t('personalBrand.portfolio.fieldStart')}
                    </label>
                    <input
                      id="pb-portfolio-start"
                      type="month"
                      value={formData.start_date}
                      onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="pb-portfolio-slut" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      {t('personalBrand.portfolio.fieldEnd')}
                    </label>
                    <input
                      id="pb-portfolio-slut"
                      type="month"
                      value={formData.end_date}
                      onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pb-portfolio-url" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                    {t('personalBrand.portfolio.fieldUrl')}
                  </label>
                  <input
                    id="pb-portfolio-url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => { setFormData(p => ({ ...p, url: e.target.value })); setUrlFel(false) }}
                    aria-invalid={urlFel}
                    aria-describedby={urlFel ? 'pb-portfolio-url-fel' : undefined}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    placeholder="https://..."
                  />
                  {urlFel && (
                    <p id="pb-portfolio-url-fel" className="text-sm text-stone-800 dark:text-stone-100 mt-1" role="alert">
                      {t('personalBrand.portfolio.urlInvalid')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="pb-portfolio-taggar" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('personalBrand.portfolio.fieldTags')}
                  </label>
                  <input
                    id="pb-portfolio-taggar"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                    placeholder={t('personalBrand.portfolio.tagsPlaceholder')}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pb-portfolio-utvald"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(p => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 border-stone-300 dark:border-stone-600 rounded focus:ring-[var(--c-solid)]"
                  />
                  <label htmlFor="pb-portfolio-utvald" className="text-sm text-stone-700 dark:text-stone-300">
                    {t('personalBrand.portfolio.featureLabel')}
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSaving}>
                    {isSaving
                      ? <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                      : <Save className="w-4 h-4 mr-1" aria-hidden="true" />}
                    {editingItem ? t('personalBrand.portfolio.saveEdit') : t('personalBrand.portfolio.save')}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-1" aria-hidden="true" />
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {utvalda.length > 0 && (
        <section>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--c-solid)] fill-[var(--c-solid)]" aria-hidden="true" />
            {t('personalBrand.portfolio.featured')}
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
            {utvalda.map((item) => (
              <li key={item.id}>
                <PortfolioKort item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleFeatured={toggleFeatured} dateLocale={dateLocale} featured />
              </li>
            ))}
          </ul>
        </section>
      )}

      {ovriga.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
          {ovriga.map((item) => (
            <li key={item.id}>
              <PortfolioKort item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleFeatured={toggleFeatured} dateLocale={dateLocale} />
            </li>
          ))}
        </ul>
      ) : items.length === 0 && !isEditing && !laddningsfel && (
        // Handrullat tomtillstånd tidigare, i strid med DESIGN.md §7 — och
        // rubriken beskrev vad som saknades i stället för vad sidan är.
        <EmptyState
          icon={FolderOpen}
          title={t('personalBrand.portfolio.emptyTitle')}
          description={t('personalBrand.portfolio.emptyBody')}
          action={{ label: t('personalBrand.portfolio.addFirst'), onClick: () => setIsEditing(true) }}
        />
      )}

      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
        <h3 className="font-semibold text-[var(--c-text)] dark:text-stone-100 mb-3">
          {t('personalBrand.portfolio.tipsTitle')}
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {(['quality', 'role', 'result'] as const).map((nyckel, i) => {
            const Ikon = [Star, Briefcase, Award][i]
            return (
              <li key={nyckel} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--c-accent)]/40 dark:bg-[var(--c-solid)]/40 rounded-lg flex items-center justify-center shrink-0">
                  <Ikon className="w-4 h-4 text-[var(--c-text)] dark:text-stone-100" aria-hidden="true" />
                </div>
                <div>
                  {/* `dark:text-[var(--c-accent)]` mätte 1,55:1 här — mörk
                      plommon på mörk bakgrund, i praktiken osynlig. */}
                  <p className="font-medium text-[var(--c-text)] dark:text-stone-100 text-sm">
                    {t(`personalBrand.portfolio.tips.${nyckel}.title`)}
                  </p>
                  <p className="text-xs text-[var(--c-text)] dark:text-stone-300">
                    {t(`personalBrand.portfolio.tips.${nyckel}.body`)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function PortfolioKort({
  item, onEdit, onDelete, onToggleFeatured, dateLocale, featured = false,
}: {
  item: PortfolioItem
  onEdit: (item: PortfolioItem) => void
  onDelete: (id: string, titel: string) => void
  onToggleFeatured: (item: PortfolioItem) => void
  dateLocale: string
  featured?: boolean
}) {
  const { t } = useTranslation()
  const Ikon = TYP_IKON[item.item_type as Typ] ?? FolderOpen
  const period = visaPeriod(item.start_date, item.end_date, dateLocale)
  const lank = sanitizeHref(item.url)

  return (
    <Card className={cn(
      'group h-full hover:shadow-md transition-all bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      featured && 'ring-2 ring-[var(--c-accent)]/60 bg-[var(--c-bg)]/30 dark:bg-[var(--c-bg)]/20'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-solid)]">
          <Ikon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-stone-800 dark:text-stone-100">{item.title}</h4>
              <p className="text-xs text-stone-700 dark:text-stone-400 flex flex-wrap items-center gap-1 mt-0.5">
                <span>{t(`personalBrand.portfolio.types.${item.item_type}.label`)}</span>
                {period && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    <span>{period}</span>
                  </>
                )}
              </p>
            </div>
            {/* `opacity-0 group-hover:opacity-100` utan `focus-within` gjorde
                de här osynliga för tangentbord (SC 2.4.7). Och ingen av dem
                hade ett tillgängligt namn — den sista raderar. */}
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onToggleFeatured(item)}
                aria-pressed={!!item.is_featured}
                aria-label={t('personalBrand.portfolio.featureAria', { titel: item.title })}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <Star className={cn('w-4 h-4', item.is_featured
                  ? 'text-[var(--c-solid)] fill-[var(--c-solid)]'
                  : 'text-stone-500 dark:text-stone-400')} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={t('personalBrand.portfolio.editAria', { titel: item.title })}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-stone-700 dark:text-stone-300" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => item.id && onDelete(item.id, item.title)}
                aria-label={t('personalBrand.portfolio.deleteAria', { titel: item.title })}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-700 dark:text-red-300" aria-hidden="true" />
              </button>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-stone-700 dark:text-stone-300 mt-2 line-clamp-2">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <ul className="flex gap-1 flex-wrap mt-3 list-none p-0 m-0">
              {item.tags.map((tag, idx) => (
                <li key={idx} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded text-xs">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {lank && (
            <a
              href={lank}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--c-text)] dark:text-stone-200 underline mt-3"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              {t('personalBrand.portfolio.openLink')}
              <span className="sr-only">{t('common.opensInNewTab')}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
