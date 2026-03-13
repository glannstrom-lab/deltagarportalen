/**
 * Explore Tab - Explore occupations (existing content)
 */
import { useState } from 'react'
import { 
  Search, Compass, Briefcase, GraduationCap, DollarSign,
  TrendingUp, MapPin, Clock, Star, Filter, ChevronRight
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

const occupations = [
  {
    id: '1',
    title: 'Systemutvecklare',
    category: 'IT',
    salary: '45 000 - 65 000 kr',
    demand: 'Hög',
    education: 'Högskoleutbildning',
    match: 95,
    description: 'Utvecklar och underhåller programvarusystem.'
  },
  {
    id: '2',
    title: 'Projektledare',
    category: 'Administration',
    salary: '40 000 - 60 000 kr',
    demand: 'Medel',
    education: 'Högskoleutbildning',
    match: 88,
    description: 'Leder och koordinerar projekt från start till mål.'
  },
  {
    id: '3',
    title: 'Sjuksköterska',
    category: 'Vård',
    salary: '35 000 - 50 000 kr',
    demand: 'Mycket hög',
    education: 'Universitetsutbildning',
    match: 82,
    description: 'Ger omvårdnad och behandling till patienter.'
  },
  {
    id: '4',
    title: 'Ekonomiassistent',
    category: 'Ekonomi',
    salary: '30 000 - 40 000 kr',
    demand: 'Medel',
    education: 'Gymnasium/Yrkeshögskola',
    match: 78,
    description: 'Hanterar fakturering, bokföring och ekonomiadministration.'
  },
]

const categories = ['Alla', 'IT', 'Vård', 'Ekonomi', 'Administration', 'Bygg', 'Utbildning']

export default function ExploreTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Alla')

  const filteredOccupations = occupations.filter(occ => {
    const matchesSearch = occ.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Alla' || occ.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Sök efter yrken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Occupations */}
      <div className="space-y-4">
        {filteredOccupations.map((occupation) => (
          <Card key={occupation.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{occupation.title}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {occupation.match}% match
                  </span>
                </div>
                <p className="text-slate-600 mb-4">{occupation.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    {occupation.salary}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                    Efterfrågan: {occupation.demand}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <GraduationCap className="w-4 h-4" />
                    {occupation.education}
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="flex items-center gap-1">
                Läs mer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredOccupations.length === 0 && (
        <div className="text-center py-12">
          <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Inga yrken hittades</h3>
          <p className="text-slate-500">Prova att ändra din sökning eller filter</p>
        </div>
      )}
    </div>
  )
}
