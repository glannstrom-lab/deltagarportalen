/**
 * Occupations Tab - Recommended occupations based on test results
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  calculateUserProfile,
  calculateJobMatches,
  type UserProfile,
} from '@/services/interestGuideData'
import { JobCard } from '@/components/interest-guide/JobCard'
import { LoadingState, InfoCard, Button } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  ClipboardList,
  Sparkles,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react'

export default function OccupationsTab() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()

        if (data?.is_completed && data.answers) {
          const calculatedProfile = calculateUserProfile(data.answers)
          setProfile(calculatedProfile)
        }
      } catch (err) {
        console.error('Failed to load results:', err)
        setError('Kunde inte ladda resultaten')
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar yrken..." size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Genomför testet först</h2>
        <p className="text-gray-600 mb-6">
          Du behöver genomföra intressetestet för att få personliga yrkesförslag.
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Sparkles className="w-4 h-4" />
          Starta testet
        </Button>
      </div>
    )
  }

  const allMatches = calculateJobMatches(profile, filterUni)

  // Filter by search query
  const filteredMatches = searchQuery
    ? allMatches.filter(m =>
        m.occupation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.occupation.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMatches

  const displayedMatches = showAll ? filteredMatches : filteredMatches.slice(0, 10)

  // Stats
  const goodMatches = allMatches.filter(m => m.matchPercentage >= 70).length
  const growingJobs = allMatches.filter(m => m.occupation.prognosis === 'growing').slice(0, 10).length

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
          <Briefcase className="w-4 h-4" />
          Baserat på din profil
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Yrken som passar dig</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Vi har analyserat din profil och hittat yrken som matchar dina intressen,
          personlighet och förutsättningar.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{goodMatches}</p>
              <p className="text-sm text-gray-500">Bra matchningar (70%+)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{allMatches.length}</p>
              <p className="text-sm text-gray-500">Totalt antal yrken</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{growingJobs}</p>
              <p className="text-sm text-gray-500">Växande branscher (topp 10)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök yrken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Education Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-1">
              <button
                onClick={() => setFilterUni(null)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterUni === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alla
              </button>
              <button
                onClick={() => setFilterUni(true)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  filterUni === true
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Högskola
              </button>
              <button
                onClick={() => setFilterUni(false)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  filterUni === false
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Gym/YH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {displayedMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Inga yrken hittades med dina filter.</p>
          </div>
        ) : (
          displayedMatches.map((match, index) => (
            <div key={match.occupation.id} className="relative">
              {index < 3 && (
                <div className="absolute -left-2 -top-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 shadow-lg">
                  {index + 1}
                </div>
              )}
              <JobCard
                match={match}
                isSelected={false}
                onSelect={() => {}}
                showCompare={false}
              />
            </div>
          ))
        )}
      </div>

      {/* Show more */}
      {filteredMatches.length > 10 && !showAll && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            className="gap-2"
          >
            Visa alla {filteredMatches.length} yrken
          </Button>
        </div>
      )}

      {showAll && filteredMatches.length > 10 && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setShowAll(false)}
            className="gap-2"
          >
            Visa färre
          </Button>
        </div>
      )}
    </div>
  )
}
