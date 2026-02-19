import { useState } from 'react'
import { 
  calculateJobMatches, 
  type UserProfile
} from '@/services/interestGuideData'
import { RiasecChart } from './RiasecChart'
import { BigFiveChart } from './BigFiveChart'
import { ICFSection } from './ICFSection'
import { JobCard } from './JobCard'
import { Button } from '@/components/ui/Button'
import { 
  Download, 
  Share2, 
  RotateCcw, 
  GraduationCap,
  Briefcase,
  CheckSquare,
  X,
  BarChart3
} from 'lucide-react'

interface ResultsViewProps {
  profile: UserProfile
  onRestart: () => void
}

export function ResultsView({ profile, onRestart }: ResultsViewProps) {
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs'>('profile')

  const matches = calculateJobMatches(profile, filterUni)
  const topMatches = matches.slice(0, 10)

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleShare = () => {
    // Spara resultat i localStorage för delning
    const shareData = {
      profile,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('interest-guide-share', JSON.stringify(shareData))
    
    // Kopiera länk till clipboard
    const shareUrl = `${window.location.origin}/interest-guide/shared`
    navigator.clipboard.writeText(shareUrl)
    alert('Länk kopierad till urklipp!')
  }

  const handleDownload = () => {
    // Skapa en enkel text-export
    const data = {
      profil: profile,
      matchningar: topMatches.map(m => ({
        yrke: m.occupation.name,
        matchning: m.matchPercentage,
      })),
      exporterad: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'intresseguide-resultat.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedMatches = matches.filter(m => selectedJobs.has(m.occupation.id))

  return (
    <div className="max-w-5xl mx-auto transition-all duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dina resultat
        </h1>
        <p className="text-gray-500">
          Baserat på dina svar har vi analyserat din profil och matchat dig mot yrken
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <Button
          variant="outline"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Dela
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Spara
        </Button>
        <Button
          variant="outline"
          onClick={onRestart}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Gör om testet
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-5 h-5 inline mr-2" />
          Din profil
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'jobs'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Briefcase className="w-5 h-5 inline mr-2" />
          Yrkesmatchningar
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {topMatches.length}
          </span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* RIASEC */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              RIASEC-profil
            </h2>
            <div className="flex justify-center">
              <RiasecChart scores={profile.riasec} size={320} />
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              {Object.entries(profile.riasec)
                .sort(([, a], [, b]) => b - a)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <div className={`w-6 h-6 rounded bg-gradient-to-br ${
                      key === 'R' ? 'from-red-500 to-red-600' :
                      key === 'I' ? 'from-blue-500 to-blue-600' :
                      key === 'A' ? 'from-purple-500 to-purple-600' :
                      key === 'S' ? 'from-green-500 to-green-600' :
                      key === 'E' ? 'from-amber-500 to-amber-600' :
                      'from-teal-500 to-teal-600'
                    } flex items-center justify-center text-white font-bold text-xs`}>
                      {key}
                    </div>
                    <span className="text-gray-600">{value}/5</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Big Five */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Big Five - Personlighetsprofil
            </h2>
            <div className="max-w-lg mx-auto">
              <BigFiveChart scores={profile.bigFive} />
            </div>
          </div>

          {/* ICF */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              ICF - Funktionsförutsättningar
            </h2>
            <div className="max-w-lg mx-auto">
              <ICFSection scores={profile.icf} />
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div>
          {/* Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Button
              variant={filterUni === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(null)}
              className={filterUni === null ? 'bg-indigo-600' : ''}
            >
              Alla yrken
            </Button>
            <Button
              variant={filterUni === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(true)}
              className={filterUni === true ? 'bg-indigo-600' : ''}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Högskola
            </Button>
            <Button
              variant={filterUni === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(false)}
              className={filterUni === false ? 'bg-indigo-600' : ''}
            >
              <Briefcase className="w-4 h-4 mr-1" />
              Gymnasium
            </Button>
          </div>

          {/* Compare bar */}
          {selectedJobs.size > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 flex items-center gap-4 z-50 max-w-md w-full mx-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">{selectedJobs.size} valda</span>
              </div>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedJobs(new Set())}
              >
                <X className="w-4 h-4 mr-1" />
                Rensa
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={selectedJobs.size < 2}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Jämför
              </Button>
            </div>
          )}

          {/* Job list */}
          <div className="space-y-4">
            {topMatches.map((match) => (
              <JobCard
                key={match.occupation.id}
                match={match}
                isSelected={selectedJobs.has(match.occupation.id)}
                onSelect={(selected) => {
                  if (selected) {
                    toggleJobSelection(match.occupation.id)
                  } else {
                    toggleJobSelection(match.occupation.id)
                  }
                }}
                showCompare={true}
              />
            ))}
          </div>

          {/* Show more button */}
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => {}}>
              Visa fler yrken
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && selectedMatches.length >= 2 && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowComparison(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Jämför yrken</h2>
              <button
                onClick={() => setShowComparison(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 rounded-tl-lg">Egenskap</th>
                    {selectedMatches.map(m => (
                      <th key={m.occupation.id} className="p-3 bg-gray-50 text-center min-w-[150px]">
                        {m.occupation.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b font-medium">Matchning</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center">
                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                          m.matchPercentage >= 80 ? 'bg-green-100 text-green-700' :
                          m.matchPercentage >= 60 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {m.matchPercentage}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Lön</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.salary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Utbildning</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.education.length}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Prognos</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.prognosis === 'growing' ? 'Växande' :
                         m.occupation.prognosis === 'declining' ? 'Krympande' : 'Stabil'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
