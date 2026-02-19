import { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { occupationMatcher, type OccupationSuggestion } from '../services/occupationMatcher'
import { afApi } from '../services/arbetsformedlingenApi'

interface JobRecommendationsProps {
  query: string
  onSuggestionClick: (suggestion: string) => void
}

export default function JobRecommendations({ query, onSuggestionClick }: JobRecommendationsProps) {
  const [suggestions, setSuggestions] = useState<OccupationSuggestion[]>([])
  const [relatedJobs, setRelatedJobs] = useState<any[]>([])

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      setRelatedJobs([])
      return
    }

    // Hitta relaterade yrken
    const related = occupationMatcher.findRelated(query)
    setSuggestions(related)

    // Sök jobb i relaterade kategorier
    const loadRelatedJobs = async () => {
      try {
        const allJobs: any[] = []
        
        // Sök på några av de relaterade yrkena
        for (const suggestion of related.slice(0, 3)) {
          const response = await afApi.searchByQuery(suggestion.occupation, 3)
          allJobs.push(...response.hits.map(job => ({ ...job, relationType: suggestion.type })))
        }

        // Ta bort dubletter och begränsa
        const uniqueJobs = allJobs.filter((job, index, self) => 
          index === self.findIndex(j => j.id === job.id)
        ).slice(0, 5)

        setRelatedJobs(uniqueJobs)
      } catch (error) {
        console.error('Error loading related jobs:', error)
      }
    }

    loadRelatedJobs()
  }, [query])

  if (!query || suggestions.length === 0) return null

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'similar': return 'Liknande yrken'
      case 'alternative': return 'Alternativa karriärvägar'
      case 'progression': return 'Nästa steg i karriären'
      case 'related': return 'Relaterade områden'
      default: return 'Relaterat'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'similar': return 'bg-blue-100 text-blue-700'
      case 'alternative': return 'bg-amber-100 text-amber-700'
      case 'progression': return 'bg-green-100 text-green-700'
      case 'related': return 'bg-purple-100 text-purple-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-teal-900">
            Du sökte på "{query}" - kanske är du också intresserad av?
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 6).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(suggestion.occupation)}
              className="group flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-teal-200 hover:border-teal-400 hover:shadow-sm transition-all"
            >
              <span className="text-slate-700 group-hover:text-teal-700">
                {suggestion.occupation}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(suggestion.type)}`}>
                {getTypeLabel(suggestion.type)}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Related jobs */}
      {relatedJobs.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">Aktuella jobb inom relaterade områden</h3>
          </div>
          
          <div className="space-y-3">
            {relatedJobs.map((job) => (
              <div
                key={job.id}
                className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => onSuggestionClick(job.headline)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{job.headline}</h4>
                    <p className="text-sm text-slate-600">{job.employer.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      {job.workplace_address?.municipality && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {job.workplace_address.municipality}
                        </span>
                      )}
                      {job.relationType && (
                        <span className={`px-2 py-0.5 rounded-full ${getTypeColor(job.relationType)}`}>
                          {getTypeLabel(job.relationType)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Briefcase className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
