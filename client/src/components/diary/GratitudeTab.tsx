/**
 * GratitudeTab - Daily gratitude journaling
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Heart, Plus, Check, Calendar, Sparkles,
  ChevronLeft, ChevronRight, Sun, Star
} from '@/components/ui/icons'
import { useGratitude } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

function TodayGratitude() {
  const { todayEntry, createEntry, hasLoggedToday, isLoading } = useGratitude()
  const [item1, setItem1] = useState(todayEntry?.item1 || '')
  const [item2, setItem2] = useState(todayEntry?.item2 || '')
  const [item3, setItem3] = useState(todayEntry?.item3 || '')
  const [reflection, setReflection] = useState(todayEntry?.reflection || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!item1.trim()) return

    setIsSaving(true)
    try {
      await createEntry({
        item1: item1.trim(),
        item2: item2.trim() || undefined,
        item3: item3.trim() || undefined,
        reflection: reflection.trim() || undefined
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-rose-900">Dagens tacksamhet</h3>
            <p className="text-sm text-rose-600">
              {new Date().toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
        {hasLoggedToday && (
          <span className="px-3 py-1 bg-brand-100 text-brand-900 rounded-full text-sm font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Loggat
          </span>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-rose-800 font-medium">
          Vad är du tacksam för idag?
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 font-bold text-sm">
              1
            </span>
            <input
              type="text"
              value={item1}
              onChange={(e) => setItem1(e.target.value)}
              placeholder="Jag är tacksam för..."
              className="flex-1 px-4 py-3 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 font-bold text-sm">
              2
            </span>
            <input
              type="text"
              value={item2}
              onChange={(e) => setItem2(e.target.value)}
              placeholder="Jag är tacksam för... (valfritt)"
              className="flex-1 px-4 py-3 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 font-bold text-sm">
              3
            </span>
            <input
              type="text"
              value={item3}
              onChange={(e) => setItem3(e.target.value)}
              placeholder="Jag är tacksam för... (valfritt)"
              className="flex-1 px-4 py-3 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-rose-700 mb-2">
            Reflektion (valfritt)
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Varför är dessa saker viktiga för dig?"
            rows={3}
            className="w-full px-4 py-3 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none bg-white"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!item1.trim() || isSaving}
          className="w-full bg-rose-600 hover:bg-rose-700"
        >
          {isSaving ? 'Sparar...' : saved ? '✓ Sparat!' : 'Spara tacksamhet'}
        </Button>
      </div>
    </Card>
  )
}

function GratitudeHistory() {
  const { entries, isLoading } = useGratitude()
  const [currentPage, setCurrentPage] = useState(0)
  const entriesPerPage = 7

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded" />
          ))}
        </div>
      </Card>
    )
  }

  const totalPages = Math.ceil(entries.length / entriesPerPage)
  const paginatedEntries = entries.slice(
    currentPage * entriesPerPage,
    (currentPage + 1) * entriesPerPage
  )

  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-700 mb-2">Ingen historik än</h3>
        <p className="text-sm text-slate-700">
          Börja logga din dagliga tacksamhet för att se din historik här
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          Historik
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 hover:bg-slate-100 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <span className="text-sm text-slate-700">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 hover:bg-slate-100 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {paginatedEntries.map((entry) => (
          <div
            key={entry.id}
            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <Calendar className="w-4 h-4" />
              {new Date(entry.entry_date).toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>

            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{entry.item1}</span>
              </li>
              {entry.item2 && (
                <li className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{entry.item2}</span>
                </li>
              )}
              {entry.item3 && (
                <li className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{entry.item3}</span>
                </li>
              )}
            </ul>

            {entry.reflection && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-100">
                <p className="text-sm text-slate-600 italic">"{entry.reflection}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function GratitudeStats() {
  const { entries } = useGratitude()

  // Calculate streak
  let streak = 0
  const today = new Date()
  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i].entry_date)
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)

    if (entryDate.toDateString() === expectedDate.toDateString()) {
      streak++
    } else {
      break
    }
  }

  // Count total items
  const totalItems = entries.reduce((sum, e) => {
    let count = 1
    if (e.item2) count++
    if (e.item3) count++
    return sum + count
  }, 0)

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
        <Sun className="w-6 h-6 text-amber-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-amber-700">{streak}</p>
        <p className="text-sm text-amber-600">dagar i rad</p>
      </Card>

      <Card className="p-4 text-center">
        <Calendar className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
        <p className="text-sm text-slate-700">inlägg totalt</p>
      </Card>

      <Card className="p-4 text-center">
        <Star className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
        <p className="text-sm text-slate-700">saker att vara tacksam för</p>
      </Card>
    </div>
  )
}

export function GratitudeTab() {
  const { isLoading } = useGratitude()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="p-5 bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Varför tacksamhet?</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              Forskning visar att daglig tacksamhet förbättrar välbefinnande, minskar stress och hjälper
              oss att fokusera på det positiva. Ta en stund varje dag för att reflektera över vad du
              uppskattar - det kan vara stora eller små saker.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <GratitudeStats />

      {/* Today's entry */}
      <TodayGratitude />

      {/* History */}
      <GratitudeHistory />
    </div>
  )
}

export default GratitudeTab
