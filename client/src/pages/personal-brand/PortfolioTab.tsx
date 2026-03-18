/**
 * Portfolio Tab - Showcase your projects
 */
import { useState, useEffect } from 'react'
import { FolderOpen, Plus, ExternalLink, Trash2, Edit2, Image, Link, Github, Briefcase, Save, X } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PortfolioItem {
  id: string
  title: string
  description: string
  type: 'project' | 'work' | 'certificate' | 'other'
  url?: string
  imageUrl?: string
  tags: string[]
  date: string
}

const ITEM_TYPES = {
  project: { label: 'Projekt', icon: Github, color: 'violet' },
  work: { label: 'Arbete', icon: Briefcase, color: 'blue' },
  certificate: { label: 'Certifikat', icon: Image, color: 'emerald' },
  other: { label: 'Annat', icon: FolderOpen, color: 'slate' },
}

export default function PortfolioTab() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'project' as PortfolioItem['type'],
    url: '',
    tags: '',
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('portfolio-items')
    if (saved) {
      setItems(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio-items', JSON.stringify(items))
  }, [items])

  const resetForm = () => {
    setFormData({ title: '', description: '', type: 'project', url: '', tags: '' })
    setEditingItem(null)
    setIsEditing(false)
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) return

    const newItem: PortfolioItem = {
      id: editingItem?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      url: formData.url || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      date: new Date().toISOString().split('T')[0],
    }

    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? newItem : item))
    } else {
      setItems(prev => [newItem, ...prev])
    }

    resetForm()
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      url: item.url || '',
      tags: item.tags.join(', '),
    })
    setIsEditing(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Ta bort detta objekt?')) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
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
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Lägg till
            </Button>
          )}
        </div>
      </Card>

      {/* Add/Edit form */}
      {isEditing && (
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
              <div className="flex gap-2 flex-wrap">
                {Object.entries(ITEM_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setFormData(prev => ({ ...prev, type: key as PortfolioItem['type'] }))}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                      formData.type === key
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                placeholder="Beskriv projektet eller arbetet..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Link className="w-4 h-4 inline mr-1" />
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

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
                <Save className="w-4 h-4 mr-1" />
                {editingItem ? 'Uppdatera' : 'Spara'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" />
                Avbryt
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio items */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const typeInfo = ITEM_TYPES[item.type]
            const TypeIcon = typeInfo.icon

            return (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    typeInfo.color === 'violet' && "bg-violet-100 text-violet-600",
                    typeInfo.color === 'blue' && "bg-blue-100 text-blue-600",
                    typeInfo.color === 'emerald' && "bg-emerald-100 text-emerald-600",
                    typeInfo.color === 'slate' && "bg-slate-100 text-slate-600"
                  )}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-rose-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                    {item.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Visa
                        </a>
                      )}
                      <span className="text-xs text-slate-400">{item.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : !isEditing && (
        <Card className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Ingen portfolio ännu</h3>
          <p className="text-sm text-slate-500 mb-4">
            Lägg till dina projekt, arbeten och certifikat för att visa din kompetens.
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
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• <strong>Kvalitet över kvantitet</strong> - Visa dina bästa 5-10 projekt</li>
          <li>• <strong>Beskriv din roll</strong> - Vad bidrog du med specifikt?</li>
          <li>• <strong>Visa resultat</strong> - Siffror och konkreta outcomes imponerar</li>
          <li>• <strong>Håll det aktuellt</strong> - Ta bort gamla projekt som inte är relevanta</li>
          <li>• <strong>Använd länkar</strong> - Låt besökare se projekten själva</li>
        </ul>
      </Card>
    </div>
  )
}
