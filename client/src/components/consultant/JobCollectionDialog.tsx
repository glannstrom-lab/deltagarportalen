/**
 * JobCollectionDialog
 * Skapa/redigera en jobbsamling (consultant_job_collections).
 * Jobben anges som titel + valfri länk och lagras i job_ids TEXT[].
 */

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Loader2, Briefcase } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { CollectionJob } from '@/pages/consultant/ResourcesTab'

export interface JobCollectionFormData {
  name: string
  description: string
  industry: string
  jobs: CollectionJob[]
}

interface JobCollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  collection: {
    id: string
    name: string
    description: string
    industry: string
    jobs: CollectionJob[]
  } | null
  onSave: (data: JobCollectionFormData) => void
  saving: boolean
}

const EMPTY_FORM: JobCollectionFormData = {
  name: '',
  description: '',
  industry: '',
  jobs: [],
}

const inputClass = cn(
  'w-full px-3 py-2 rounded-lg',
  'bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600',
  'focus:border-amber-500 dark:focus:border-amber-400',
  'text-stone-900 dark:text-stone-100'
)

export function JobCollectionDialog({
  isOpen,
  onClose,
  collection,
  onSave,
  saving,
}: JobCollectionDialogProps) {
  const [form, setForm] = useState<JobCollectionFormData>(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) return
    if (collection) {
      setForm({
        name: collection.name,
        description: collection.description,
        industry: collection.industry,
        jobs: collection.jobs.map(j => ({ ...j })),
      })
    } else {
      setForm({ ...EMPTY_FORM, jobs: [{ title: '', url: '' }] })
    }
  }, [collection, isOpen])

  const updateJob = (index: number, field: keyof CollectionJob, value: string) => {
    setForm(prev => ({
      ...prev,
      jobs: prev.jobs.map((j, i) => (i === index ? { ...j, [field]: value } : j)),
    }))
  }

  const addJob = () => {
    setForm(prev => ({ ...prev, jobs: [...prev.jobs, { title: '', url: '' }] }))
  }

  const removeJob = (index: number) => {
    setForm(prev => ({ ...prev, jobs: prev.jobs.filter((_, i) => i !== index) }))
  }

  const handleSave = () => {
    // Filtrera bort tomma jobbrader innan sparning
    onSave({
      ...form,
      name: form.name.trim(),
      jobs: form.jobs
        .map(j => ({ title: j.title.trim(), url: j.url.trim() }))
        .filter(j => j.title.length > 0),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {collection ? 'Redigera samling' : 'Ny jobbsamling'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Namn *
            </label>
            <input
              id="collection-name"
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              placeholder="T.ex. Lagerjobb i Göteborg"
            />
          </div>

          <div>
            <label htmlFor="collection-description" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Beskrivning
            </label>
            <textarea
              id="collection-description"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className={cn(inputClass, 'resize-none')}
              rows={2}
              placeholder="Vad samlar du här och för vem?"
            />
          </div>

          <div>
            <label htmlFor="collection-industry" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Bransch
            </label>
            <input
              id="collection-industry"
              type="text"
              value={form.industry}
              onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
              className={inputClass}
              placeholder="T.ex. Lager & logistik"
            />
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Jobb i samlingen
              </h4>
              <Button size="sm" variant="outline" onClick={addJob}>
                <Plus className="w-4 h-4 mr-1" />
                Lägg till jobb
              </Button>
            </div>

            {form.jobs.length === 0 && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Inga jobb tillagda än.
              </p>
            )}

            <div className="space-y-3">
              {form.jobs.map((job, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={job.title}
                      onChange={e => updateJob(index, 'title', e.target.value)}
                      className={inputClass}
                      placeholder="Jobbtitel, t.ex. Lagermedarbetare — Acme AB"
                      aria-label={`Jobbtitel ${index + 1}`}
                    />
                    <input
                      type="url"
                      value={job.url}
                      onChange={e => updateJob(index, 'url', e.target.value)}
                      className={inputClass}
                      placeholder="Länk till annonsen (valfritt)"
                      aria-label={`Länk till jobb ${index + 1}`}
                    />
                  </div>
                  <button
                    onClick={() => removeJob(index)}
                    aria-label={`Ta bort jobb ${index + 1}`}
                    className="p-2 mt-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {collection ? 'Spara ändringar' : 'Skapa samling'}
          </Button>
        </div>
      </div>
    </div>
  )
}
