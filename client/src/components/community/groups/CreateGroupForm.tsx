/**
 * CreateGroupForm - Form to create a new accountability group
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { CreateGroupData, GroupGoalType } from '@/types/community.types'
import { GROUP_GOAL_LABELS } from '@/types/community.types'

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupData) => Promise<string | null>
}

export function CreateGroupForm({ onSubmit }: CreateGroupFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState(6)
  const [isPublic, setIsPublic] = useState(true)
  const [weeklyGoalType, setWeeklyGoalType] = useState<GroupGoalType>('applications')
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    const result = await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      maxMembers,
      isPublic,
      weeklyGoalType,
      weeklyGoalTarget
    })
    setIsSubmitting(false)

    if (result) {
      setIsOpen(false)
      setName('')
      setDescription('')
      setMaxMembers(6)
      setIsPublic(true)
      setWeeklyGoalType('applications')
      setWeeklyGoalTarget(5)
    }
  }

  const goalTypes: GroupGoalType[] = ['applications', 'articles', 'exercises', 'custom']

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
            Skapa grupp
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gruppnamn
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="T.ex. Jobbsökargruppen"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Beskrivning (valfritt)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv vad gruppen handlar om..."
                  className="w-full h-20 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Max members */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max medlemmar
                  </label>
                  <select
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} personer</option>
                    ))}
                  </select>
                </div>

                {/* Public toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Synlighet
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPublic(true)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        isPublic
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      Öppen
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        !isPublic
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      Privat
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekly goal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Veckomål
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {goalTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setWeeklyGoalType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        weeklyGoalType === type
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {GROUP_GOAL_LABELS[type]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Mål per person per vecka:</span>
                  <input
                    type="number"
                    value={weeklyGoalTarget}
                    onChange={(e) => setWeeklyGoalTarget(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={50}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Skapa grupp
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CreateGroupForm
