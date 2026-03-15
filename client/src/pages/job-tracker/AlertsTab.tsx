/**
 * Alerts Tab - Saved searches and job alerts
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Search,
  MapPin,
  Briefcase,
  Trash2,
  Plus,
  Play,
  Calendar,
  Filter,
} from 'lucide-react'
import { Button, LoadingState } from '@/components/ui'
import { platsbankenApi } from '@/services/cloudStorage'

interface SavedSearch {
  id: string
  name: string
  query?: string
  municipality?: string
  employment_type?: string
  remote?: boolean
  notify?: boolean
  created_at?: string
}

export default function AlertsTab() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSearches = async () => {
      try {
        setIsLoading(true)
        const searches = await platsbankenApi.getSavedSearches()
        setSavedSearches(searches)
      } catch (err) {
        console.error('Failed to load saved searches:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSearches()
  }, [])

  const toggleAlert = async (searchId: string) => {
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, notify: !s.notify } : s))
    )
    // TODO: Save to backend
  }

  const deleteSearch = async (searchId: string) => {
    await platsbankenApi.removeSavedSearch(searchId)
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId))
  }

  const runSearch = (search: SavedSearch) => {
    // Navigate to search with these filters
    const params = new URLSearchParams()
    if (search.query) params.set('q', search.query)
    if (search.municipality) params.set('municipality', search.municipality)
    window.location.href = `/job-tracker?${params.toString()}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar bevakningar..." size="lg" />
      </div>
    )
  }

  if (savedSearches.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga bevakningar</h2>
        <p className="text-gray-600 mb-6">
          Spara en sökning för att få notiser när nya matchande jobb publiceras.
        </p>
        <Link to="/job-tracker">
          <Button className="gap-2">
            <Search className="w-4 h-4" />
            Gör en sökning
          </Button>
        </Link>

        {/* How it works */}
        <div className="mt-12 text-left bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Så fungerar bevakningar</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Sök efter jobb</p>
                <p className="text-sm text-gray-600">
                  Använd filter för att hitta rätt typ av jobb
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Spara sökningen</p>
                <p className="text-sm text-gray-600">Klicka på "Spara sökning" i filter-panelen</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Få notiser</p>
                <p className="text-sm text-gray-600">
                  Aktivera notiser för att bli meddelad om nya jobb
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Du har <span className="font-semibold text-gray-900">{savedSearches.length}</span>{' '}
            sparade sökningar
          </p>
        </div>
        <Link to="/job-tracker">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Ny bevakning
          </Button>
        </Link>
      </div>

      {/* Saved Searches */}
      <div className="space-y-4">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    search.notify
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                      : 'bg-gray-100'
                  }`}
                >
                  {search.notify ? (
                    <Bell className="w-6 h-6 text-white" />
                  ) : (
                    <BellOff className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{search.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {search.query && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        <Search className="w-3 h-3" />
                        {search.query}
                      </span>
                    )}
                    {search.municipality && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {search.municipality}
                      </span>
                    )}
                    {search.employment_type && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        <Briefcase className="w-3 h-3" />
                        {search.employment_type}
                      </span>
                    )}
                    {search.remote && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        Distans
                      </span>
                    )}
                  </div>
                  {search.created_at && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Skapad {new Date(search.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => runSearch(search)} className="gap-2">
                  <Play className="w-4 h-4" />
                  Kör sökning
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleAlert(search.id)}
                  className={search.notify ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                >
                  {search.notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteSearch(search.id)}
                  className="text-red-500 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Om jobbalerts</h4>
            <p className="text-blue-800 text-sm">
              När notiser är aktiverade får du ett meddelande när nya jobb publiceras som matchar
              din sparade sökning. Du kan hantera notifikationsinställningar i dina
              kontoinställningar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
