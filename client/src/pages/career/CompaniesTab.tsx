/**
 * Companies Tab - Explore employers and companies
 */
import { useState } from 'react'
import { 
  Building2, Search, MapPin, Star, Heart, ExternalLink,
  TrendingUp, Users, Briefcase, ChevronRight, Filter
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

interface Company {
  id: string
  name: string
  industry: string
  location: string
  employees: string
  rating: number
  reviews: number
  openPositions: number
  description: string
  benefits: string[]
  isFollowing: boolean
}

const companies: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions AB',
    industry: 'IT & Teknik',
    location: 'Stockholm',
    employees: '50-200',
    rating: 4.5,
    reviews: 23,
    openPositions: 5,
    description: 'Ett snabbväxande tech-företag som utvecklar innovativa lösningar för kunder världen över.',
    benefits: ['Flextid', 'Distansarbete', 'Kompetensutveckling'],
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Nordic Care',
    industry: 'Vård & Omsorg',
    location: 'Göteborg',
    employees: '200-500',
    rating: 4.2,
    reviews: 45,
    openPositions: 12,
    description: 'Ledande vårdföretag med fokus på personcentrerad vård och arbetsmiljö.',
    benefits: ['Förmånlig pension', 'Friskvård', 'Karriärvägar'],
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Green Energy Sweden',
    industry: 'Energi & Miljö',
    location: 'Malmö',
    employees: '100-200',
    rating: 4.7,
    reviews: 18,
    openPositions: 3,
    description: 'Hållbara energilösningar för en grönare framtid.',
    benefits: ['Elbil som tjänstebil', 'Hållbarhetsbonus', 'Utlandsresor'],
    isFollowing: false,
  },
]

const industries = ['Alla', 'IT & Teknik', 'Vård & Omsorg', 'Energi & Miljö', 'Handel', 'Tillverkning']
const locations = ['Alla', 'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Remote']

export default function CompaniesTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('Alla')
  const [selectedLocation, setSelectedLocation] = useState('Alla')
  const [following, setFollowing] = useState<string[]>(['2'])

  const toggleFollow = (id: string) => {
    setFollowing(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIndustry = selectedIndustry === 'Alla' || company.industry === selectedIndustry
    const matchesLocation = selectedLocation === 'Alla' || company.location === selectedLocation
    return matchesSearch && matchesIndustry && matchesLocation
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Sök efter företag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Bransch:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            >
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Plats:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Following Summary */}
      {following.length > 0 && (
        <Card className="p-6 bg-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-indigo-900">Du följer {following.length} företag</h3>
              <p className="text-sm text-indigo-700">Få notifikationer om nya jobb och uppdateringar</p>
            </div>
            <Button variant="outline" className="border-indigo-300">
              <Heart className="w-4 h-4 mr-1" />
              Se följda företag
            </Button>
          </div>
        </Card>
      )}

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{company.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {company.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {company.employees} anställda
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFollow(company.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        following.includes(company.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${following.includes(company.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 mt-3">{company.description}</p>

                {/* Rating and Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-slate-800">{company.rating}</span>
                    <span className="text-sm text-slate-500">({company.reviews} omdömen)</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{company.openPositions} lediga jobb</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {company.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm">
                    <Briefcase className="w-4 h-4 mr-1" />
                    Se jobb
                  </Button>
                  <Button variant="ghost" size="sm">
                    Läs mer
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Inga företag hittades</h3>
          <p className="text-slate-500">Prova att ändra dina filter</p>
        </div>
      )}

      {/* Tips */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-2">Tips för att hitta rätt arbetsgivare</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Följ företag du är intresserad av för att få uppdateringar om nya jobb</li>
          <li>• Läs omdömen från tidigare anställda för att få insikter om företagskulturen</li>
          <li>• Kolla företagets hållbarhetsarbete och värderingar</li>
          <li>• Se om företaget erbjuder de förmåner som är viktiga för dig</li>
        </ul>
      </Card>
    </div>
  )
}
