/**
 * Explore Tab - Browse all occupations and industries
 */
import { useState, useMemo } from 'react'
import { occupations, type Occupation } from '@/services/interestGuideData'
import { Button } from '@/components/ui'
import {
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Compass,
} from '@/components/ui/icons'

// Group occupations by field
const fields = [
  { id: 'tech', name: 'Teknik & IT', keywords: ['programmerar', 'IT', 'system', 'data', 'teknisk', 'ingenjör'] },
  { id: 'healthcare', name: 'Vård & Omsorg', keywords: ['vård', 'sjuk', 'hälsa', 'patient', 'omsorg', 'social'] },
  { id: 'education', name: 'Utbildning', keywords: ['lärare', 'undervisa', 'pedagogik', 'skola', 'förskola'] },
  { id: 'business', name: 'Affär & Ekonomi', keywords: ['ekonom', 'försälj', 'marknad', 'chef', 'företag', 'affär'] },
  { id: 'creative', name: 'Kreativt & Design', keywords: ['design', 'kreativ', 'konst', 'media', 'grafisk', 'film'] },
  { id: 'service', name: 'Service & Handel', keywords: ['service', 'kund', 'butik', 'restaurang', 'hotell'] },
  { id: 'construction', name: 'Bygg & Hantverk', keywords: ['bygg', 'snickare', 'elektriker', 'rör', 'målare', 'hantverk'] },
  { id: 'nature', name: 'Natur & Miljö', keywords: ['miljö', 'natur', 'djur', 'skog', 'jordbruk', 'trädgård'] },
]

function getOccupationField(occupation: Occupation): string {
  const text = `${occupation.name} ${occupation.description}`.toLowerCase()
  for (const field of fields) {
    if (field.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return field.id
    }
  }
  return 'other'
}

export default function ExploreTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [filterPrognosis, setFilterPrognosis] = useState<string | null>(null)
  const [expandedOccupation, setExpandedOccupation] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and group occupations
  const filteredOccupations = useMemo(() => {
    return occupations.filter(occ => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches =
          occ.name.toLowerCase().includes(query) ||
          occ.description.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Education filter
      if (filterUni !== null) {
        if (filterUni && !occ.requiresUniversity) return false
        if (!filterUni && occ.requiresUniversity) return false
      }

      // Prognosis filter
      if (filterPrognosis && occ.prognosis !== filterPrognosis) {
        return false
      }

      // Field filter
      if (selectedField && getOccupationField(occ) !== selectedField) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedField, filterUni, filterPrognosis])

  // Group by field for display
  const groupedOccupations = useMemo(() => {
    const groups: Record<string, Occupation[]> = {}
    filteredOccupations.forEach(occ => {
      const field = getOccupationField(occ)
      if (!groups[field]) groups[field] = []
      groups[field].push(occ)
    })
    return groups
  }, [filteredOccupations])

  const getPrognosisIcon = (prognosis: string) => {
    switch (prognosis) {
      case 'growing':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getPrognosisText = (prognosis: string) => {
    switch (prognosis) {
      case 'growing':
        return 'Växande'
      case 'declining':
        return 'Krympande'
      default:
        return 'Stabil'
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
          <Compass className="w-4 h-4" />
          Utforska yrken
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Alla yrken</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Bläddra bland alla yrken i vår databas. Filtrera efter bransch,
          utbildningsnivå eller framtidsutsikter.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök bland alla yrken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Field Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Bransch</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedField(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedField === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Alla
                </button>
                {fields.map(field => (
                  <button
                    key={field.id}
                    onClick={() => setSelectedField(field.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedField === field.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {field.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Education Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Utbildningsnivå</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterUni(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterUni === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Alla
                </button>
                <button
                  onClick={() => setFilterUni(true)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    filterUni === true
                      ? 'bg-purple-600 text-white'
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Gymnasium/YH
                </button>
              </div>
            </div>

            {/* Prognosis Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Framtidsutsikter</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterPrognosis(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterPrognosis === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Alla
                </button>
                <button
                  onClick={() => setFilterPrognosis('growing')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    filterPrognosis === 'growing'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Växande
                </button>
                <button
                  onClick={() => setFilterPrognosis('stable')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    filterPrognosis === 'stable'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Stabil
                </button>
                <button
                  onClick={() => setFilterPrognosis('declining')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    filterPrognosis === 'declining'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Krympande
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Visar <span className="font-medium text-gray-900">{filteredOccupations.length}</span> av {occupations.length} yrken
        </p>
      </div>

      {/* Occupation List */}
      {filteredOccupations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Inga yrken hittades med dina filter.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setSelectedField(null)
              setFilterUni(null)
              setFilterPrognosis(null)
            }}
            className="mt-4"
          >
            Rensa filter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOccupations.map(occupation => (
            <div
              key={occupation.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-200 transition-colors"
            >
              <button
                onClick={() => setExpandedOccupation(
                  expandedOccupation === occupation.id ? null : occupation.id
                )}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{occupation.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {occupation.requiresUniversity ? (
                          <><GraduationCap className="w-3 h-3" /> Högskola</>
                        ) : (
                          <><Users className="w-3 h-3" /> Gymnasium/YH</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        {getPrognosisIcon(occupation.prognosis)}
                        {getPrognosisText(occupation.prognosis)}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedOccupation === occupation.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedOccupation === occupation.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-700">{occupation.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Lön</p>
                        <p className="font-medium text-gray-900">{occupation.salary}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Utbildning</p>
                        <p className="font-medium text-gray-900">{occupation.education.length} alternativ</p>
                      </div>
                    </div>

                    {occupation.education && (
                      <div>
                        <p className="text-gray-500 text-sm mb-2">Utbildningsvägar</p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                          >
                            {occupation.education.name} ({occupation.education.length})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
