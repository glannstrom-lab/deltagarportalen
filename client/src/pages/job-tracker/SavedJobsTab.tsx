/**
 * Saved Jobs Tab - View and manage saved job listings
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Trash2,
  Search,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { Button, LoadingState } from '@/components/ui'
import { platsbankenApi } from '@/services/cloudStorage'
import type { JobAd } from '@/services/arbetsformedlingenApi'

export default function SavedJobsTab() {
  const [savedJobs, setSavedJobs] = useState<JobAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        setIsLoading(true)
        const jobs = await platsbankenApi.getSavedJobs()
        setSavedJobs(jobs)
      } catch (err) {
        console.error('Failed to load saved jobs:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSavedJobs()
  }, [])

  const removeJob = async (jobId: string) => {
    await platsbankenApi.removeSavedJob(jobId)
    setSavedJobs((prev) => prev.filter((job) => job.id !== jobId))
  }

  const openApplication = (job: JobAd) => {
    const url =
      job.application_details?.url ||
      `https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/${job.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const filteredJobs = savedJobs.filter((job) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      job.headline?.toLowerCase().includes(query) ||
      job.employer?.name?.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar sparade jobb..." size="lg" />
      </div>
    )
  }

  if (savedJobs.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Bookmark className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga sparade jobb</h2>
        <p className="text-gray-600 mb-6">
          Spara intressanta jobb när du söker för att enkelt hitta dem senare.
        </p>
        <Link to="/job-tracker">
          <Button className="gap-2">
            <Search className="w-4 h-4" />
            Sök jobb
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Du har <span className="font-semibold text-gray-900">{savedJobs.length}</span> sparade
            jobb
          </p>
        </div>

        {savedJobs.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sök bland sparade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{job.headline}</h3>
                  <p className="text-gray-600">{job.employer?.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.workplace_address?.municipality || 'Ort ej angiven'}
                    </span>
                    {job.publication_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Publicerad{' '}
                        {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                    {job.application_deadline && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-4 h-4" />
                        Sista ansökan{' '}
                        {new Date(job.application_deadline).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => openApplication(job)} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Ansök
                </Button>
                <Button
                  variant="outline"
                  onClick={() => removeJob(job.id)}
                  className="text-red-500 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {job.description?.text && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {job.description.text.substring(0, 200)}...
              </p>
            )}
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Inga jobb matchar din sökning</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-2">Nästa steg</h3>
        <p className="text-indigo-700 text-sm mb-4">
          Håll koll på dina ansökningar genom att lägga till dem i ansökningsfliken.
        </p>
        <Link to="/job-tracker/applications">
          <Button variant="outline" className="gap-2">
            Gå till Ansökningar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
