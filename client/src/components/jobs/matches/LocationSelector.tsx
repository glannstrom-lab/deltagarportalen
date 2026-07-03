/**
 * LocationSelector - Kommunväljare (flerval med sökfält) för matchningsfliken.
 * Utbruten ur components/jobs/MatchesTab.tsx (2026-07-03).
 */

import { useState, useMemo } from 'react'
import { MapPin, ChevronDown, X } from '@/components/ui/icons'
import { SWEDISH_MUNICIPALITIES } from '@/services/arbetsformedlingenApi'
import { cn } from '@/lib/utils'

export function LocationSelector({
  selected,
  onChange,
  labels
}: {
  selected: string[]
  onChange: (locations: string[]) => void
  labels: {
    allLocations: string
    location: string
    locations: string
    searchLocation: string
    noResults: string
    clearAll: string
  }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredMunicipalities = useMemo(() =>
    SWEDISH_MUNICIPALITIES.filter(m =>
      m.label.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [search]
  )

  const toggleLocation = (location: string) => {
    if (selected.includes(location)) {
      onChange(selected.filter(l => l !== location))
    } else {
      onChange([...selected, location])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
      >
        <MapPin className="w-4 h-4 text-stone-700 dark:text-stone-300" />
        <span className="font-medium text-sm text-stone-700 dark:text-stone-300">
          {selected.length === 0
            ? labels.allLocations
            : `${selected.length} ${selected.length === 1 ? labels.location : labels.locations}`
          }
        </span>
        <ChevronDown className={cn("w-4 h-4 text-stone-600 dark:text-stone-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-stone-100 dark:border-stone-700">
              <input
                type="text"
                placeholder={labels.searchLocation}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
              />
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                <div className="flex flex-wrap gap-1">
                  {selected.map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className="flex items-center gap-1 px-2 py-1 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded-lg text-xs font-medium hover:bg-[var(--c-accent)]/60"
                    >
                      {loc}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-2">
              {filteredMunicipalities.length === 0 ? (
                <p className="text-sm text-stone-700 dark:text-stone-300 text-center py-4">{labels.noResults}</p>
              ) : (
                filteredMunicipalities.map(m => (
                  <button
                    key={m.concept_id}
                    onClick={() => toggleLocation(m.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selected.includes(m.label)
                        ? "bg-[var(--c-accent)]/40 text-[var(--c-text)] font-medium"
                        : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))
              )}
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-t border-stone-100 dark:border-stone-700">
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {labels.clearAll}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
