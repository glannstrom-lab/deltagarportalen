/**
 * CreateTopicForm - Form to create a new discussion topic
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { DiscussionCategory, CreateTopicData } from '@/types/community.types'

interface CreateTopicFormProps {
  categories: DiscussionCategory[]
  onSubmit: (data: CreateTopicData) => Promise<string | null>
}

export function CreateTopicForm({ categories, onSubmit }: CreateTopicFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!categoryId || !title.trim() || !content.trim() || isSubmitting) return

    setIsSubmitting(true)
    const result = await onSubmit({
      categoryId,
      title: title.trim(),
      content: content.trim()
    })
    setIsSubmitting(false)

    if (result) {
      setIsOpen(false)
      setCategoryId('')
      setTitle('')
      setContent('')
    }
  }

  return (
    <div>
      {/* Toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? 'secondary' : 'primary'}
        className="w-full sm:w-auto"
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4 mr-2" />
            Avbryt
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Ny diskussion
          </>
        )}
      </Button>

      {/* Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        categoryId === cat.id
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Skriv en tydlig rubrik..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={200}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Innehåll
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Beskriv din fråga eller dela dina tankar..."
                  className="w-full h-32 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!categoryId || !title.trim() || !content.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Publicera
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CreateTopicForm
