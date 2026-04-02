/**
 * Portfolio Tab - Showcase your projects
 * Features: Cloud sync, better visuals, sharing
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Image,
  Link as LinkIcon,
  Github,
  Briefcase,
  Save,
  X,
  Star,
  Calendar,
  Copy,
  Check,
  Award,
  Loader2,
  ArrowUpDown,
  GripVertical,
  Share2
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { personalBrandApi, type PortfolioItem } from '@/services/cloudStorage'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

const ITEM_TYPES = {
  project: { label: 'Projekt', icon: Github, color: 'violet', description: 'Personliga eller arbetsrelaterade projekt' },
  work: { label: 'Arbete', icon: Briefcase, color: 'blue', description: 'Tidigare anställningar eller uppdrag' },
  certificate: { label: 'Certifikat', icon: Award, color: 'emerald', description: 'Certifieringar och utbildningar' },
  other: { label: 'Annat', icon: FolderOpen, color: 'slate', description: 'Övriga meriter och prestationer' },
}

export default function PortfolioTab() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'project' as PortfolioItem['item_type'],
    url: '',
    tags: '',
    start_date: '',
    end_date: '',
    is_featured: false
  })

  // Load from cloud
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      const data = await personalBrandApi.getPortfolioItems()
      setItems(data)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      item_type: 'project',
      url: '',
      tags: '',
      start_date: '',
      end_date: '',
      is_featured: false
    })
    setEditingItem(null)
    setIsEditing(false)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    setIsSaving(true)
    try {
      const itemData: PortfolioItem = {
        title: formData.title,
        description: formData.description,
        item_type: formData.item_type,
        url: formData.url || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_featured: formData.is_featured
      }

      if (editingItem?.id) {
        await personalBrandApi.updatePortfolioItem(editingItem.id, itemData)
      } else {
        await personalBrandApi.addPortfolioItem(itemData)
      }

      await loadItems()
      resetForm()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      item_type: item.item_type,
      url: item.url || '',
      tags: item.tags.join(', '),
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_featured: item.is_featured || false
    })
    setIsEditing(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ta bort detta objekt?')) return
    await personalBrandApi.deletePortfolioItem(id)
    await loadItems()
  }

  const toggleFeatured = async (item: PortfolioItem) => {
    if (!item.id) return
    await personalBrandApi.updatePortfolioItem(item.id, { is_featured: !item.is_featured })
    await loadItems()
  }

  const copyShareLink = () => {
    // In a real app, this would generate a shareable link
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const featuredItems = items.filter(i => i.is_featured)
  const regularItems = items.filter(i => !i.is_featured)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Din Portfolio</h2>
            <p className="text-slate-600 mt-1">
              Samla och visa upp dina projekt, arbeten och certifikat.
              Perfekt att länka till i ansökningar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyShareLink}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </Button>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Lägg till
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Add/Edit form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-amber-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                {editingItem ? 'Redigera objekt' : 'Nytt portfolioobjekt'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="T.ex. E-handelsplattform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(ITEM_TYPES).map(([key, type]) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setFormData(prev => ({ ...prev, item_type: key as PortfolioItem['item_type'] }))}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            formData.item_type === key
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5 mb-1",
                            formData.item_type === key ? "text-amber-600" : "text-slate-400"
                          )} />
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-slate-500 hidden sm:block">{type.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                    placeholder="Beskriv projektet eller arbetet. Inkludera din roll, tekniker och resultat."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Startdatum (valfritt)
                    </label>
                    <input
                      type="month"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Slutdatum (valfritt)
                    </label>
                    <input
                      type="month"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Länk (valfritt)
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Taggar (kommaseparerade)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="React, TypeScript, Design"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="is_featured" className="text-sm text-slate-700">
                    Markera som utvalt (visas överst)
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    {editingItem ? 'Uppdatera' : 'Spara'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-1" />
                    Avbryt
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured items */}
      {featuredItems.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Utvalda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredItems.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={toggleFeatured}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular items */}
      {regularItems.length > 0 ? (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
            : "space-y-3"
        )}>
          {regularItems.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFeatured={toggleFeatured}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      ) : items.length === 0 && !isEditing && (
        <Card className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Ingen portfolio ännu</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
            Lägg till dina projekt, arbeten och certifikat för att visa din kompetens.
            En stark portfolio kan göra skillnaden i jobbsökandet.
          </p>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Lägg till första
          </Button>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Tips för en stark portfolio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700 text-sm">Kvalitet över kvantitet</p>
              <p className="text-xs text-slate-500">Visa dina bästa 5-10 projekt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700 text-sm">Beskriv din roll</p>
              <p className="text-xs text-slate-500">Vad bidrog du med specifikt?</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700 text-sm">Visa resultat</p>
              <p className="text-xs text-slate-500">Siffror och konkreta outcomes</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Portfolio Card Component
function PortfolioCard({
  item,
  onEdit,
  onDelete,
  onToggleFeatured,
  featured = false,
  compact = false
}: {
  item: PortfolioItem
  onEdit: (item: PortfolioItem) => void
  onDelete: (id: string) => void
  onToggleFeatured: (item: PortfolioItem) => void
  featured?: boolean
  compact?: boolean
}) {
  const typeInfo = ITEM_TYPES[item.item_type]
  const TypeIcon = typeInfo.icon

  if (compact) {
    return (
      <Card className="p-3 hover:shadow-sm transition-shadow group">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            typeInfo.color === 'violet' && "bg-violet-100 text-violet-600",
            typeInfo.color === 'blue' && "bg-blue-100 text-blue-600",
            typeInfo.color === 'emerald' && "bg-emerald-100 text-emerald-600",
            typeInfo.color === 'slate' && "bg-slate-100 text-slate-600"
          )}>
            <TypeIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
            <p className="text-xs text-slate-500">{typeInfo.label}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onToggleFeatured(item)} className="p-1 hover:bg-slate-100 rounded">
              <Star className={cn("w-4 h-4", item.is_featured ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
            </button>
            <button onClick={() => onEdit(item)} className="p-1 hover:bg-slate-100 rounded">
              <Edit2 className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => item.id && onDelete(item.id)} className="p-1 hover:bg-rose-100 rounded">
              <Trash2 className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "group hover:shadow-md transition-all",
      featured && "ring-2 ring-amber-200 bg-amber-50/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          typeInfo.color === 'violet' && "bg-violet-100 text-violet-600",
          typeInfo.color === 'blue' && "bg-blue-100 text-blue-600",
          typeInfo.color === 'emerald' && "bg-emerald-100 text-emerald-600",
          typeInfo.color === 'slate' && "bg-slate-100 text-slate-600"
        )}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                {typeInfo.label}
                {item.start_date && (
                  <>
                    <span className="mx-1">•</span>
                    <Calendar className="w-3 h-3" />
                    {item.start_date}{item.end_date && ` - ${item.end_date}`}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onToggleFeatured(item)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Star className={cn(
                  "w-4 h-4",
                  item.is_featured ? "text-amber-500 fill-amber-500" : "text-slate-300"
                )} />
              </button>
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => item.id && onDelete(item.id)}
                className="p-1.5 hover:bg-rose-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-3">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
            >
              <ExternalLink className="w-4 h-4" />
              Visa projekt
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
