/**
 * Stories Tab - Success stories and peer mentoring
 */
import { useState } from 'react'
import { 
  Users, Play, MessageCircle, Heart, Share2, Filter,
  Quote, Star, ChevronRight, Search
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

interface Story {
  id: string
  name: string
  avatar: string
  occupation: string
  background: string
  summary: string
  duration: string
  likes: number
  tags: string[]
  hasVideo: boolean
}

const stories: Story[] = [
  {
    id: '1',
    name: 'Maria, 34',
    avatar: 'M',
    occupation: 'Systemutvecklare',
    background: 'Långtidsarbetslös efter föräldraledighet',
    summary: 'Efter 18 månader hemma med barnen kände jag mig osäker på att komma tillbaka. Genom kompetensutveckling och stöd hittade jag tillbaka till arbetslivet starkare än någonsin.',
    duration: '8 månader tillbaka till jobb',
    likes: 45,
    tags: ['Karriäromställning', 'IT', 'Förälder'],
    hasVideo: true,
  },
  {
    id: '2',
    name: 'Anders, 52',
    avatar: 'A',
    occupation: 'Projektledare',
    background: 'Omskolering efter nedläggning',
    summary: 'När fabriken lades ner trodde jag det var för sent att börja om. Men det visade sig att mina erfarenheter var värdefulla på ett helt nytt sätt.',
    duration: '12 månader tillbaka till jobb',
    likes: 38,
    tags: ['Omskolering', 'Tillverkning', 'Ledarskap'],
    hasVideo: false,
  },
  {
    id: '3',
    name: 'Sofia, 28',
    avatar: 'S',
    occupation: 'Sjuksköterska',
    background: 'Nyexaminerad med osäkerhet',
    summary: 'Som nyexaminerad var jag rädd att jag inte skulle räcka till. Men med rätt mentorskap och stöd hittade jag mitt drömjobb inom vården.',
    duration: '4 månader till första jobbet',
    likes: 62,
    tags: ['Nyanställd', 'Vård', 'Examen'],
    hasVideo: true,
  },
]

const filters = ['Alla', 'Långtidsarbetslös', 'Karriäromställning', 'Nyexaminerad', 'Omskolering']

export default function StoriesTab() {
  const [selectedFilter, setSelectedFilter] = useState('Alla')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedStories, setLikedStories] = useState<string[]>([])

  const toggleLike = (id: string) => {
    setLikedStories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredStories = stories.filter(story => {
    const matchesFilter = selectedFilter === 'Alla' || story.tags.some(t => t.includes(selectedFilter))
    const matchesSearch = story.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Quote className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Success stories</h3>
            <p className="text-slate-600 mt-1">
              Läs inspirerande berättelser från andra som varit i din situation. 
              Du är inte ensam - och det finns hopp!
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">127</p>
          <p className="text-sm text-slate-600">Berättelser</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">89%</p>
          <p className="text-sm text-slate-600">Hittade jobb</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">6.2</p>
          <p className="text-sm text-slate-600">Månader i snitt</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Sök berättelser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          >
            {filters.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Peer Matching */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Hitta en mentor</h4>
              <p className="text-sm text-slate-600">Matchas med någon som har liknande bakgrund</p>
            </div>
          </div>
          <Button>
            Hitta matchning
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Stories List */}
      <div className="space-y-4">
        {filteredStories.map((story) => (
          <Card key={story.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">{story.avatar}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{story.name}</h4>
                    <p className="text-indigo-600 font-medium">{story.occupation}</p>
                    <p className="text-sm text-slate-500">{story.background}</p>
                  </div>
                  {story.hasVideo && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">
                      <Play className="w-4 h-4" />
                      Video
                    </div>
                  )}
                </div>

                <blockquote className="mt-4 text-slate-700 italic border-l-4 border-indigo-200 pl-4">
                  "{story.summary}"
                </blockquote>

                <div className="flex items-center gap-4 mt-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {story.duration}
                  </span>
                  {story.tags.map((tag, index) => (
                    <span key={index} className="text-sm text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => toggleLike(story.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      likedStories.includes(story.id) ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedStories.includes(story.id) ? 'fill-current' : ''}`} />
                    {story.likes + (likedStories.includes(story.id) ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Kommentera
                  </button>
                  <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Dela
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Q&A Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          Ställ frågor anonymt
        </h4>
        <p className="text-slate-600 mb-4">
          Har du frågor till de som delat sina berättelser? Ställ dem anonymt här.
        </p>
        <div className="flex gap-3">
          <Input placeholder="Vad undrar du över?" className="flex-1" />
          <Button>Skicka fråga</Button>
        </div>
      </Card>

      {/* Share Your Story */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Star className="w-7 h-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">Dela din berättelse</h4>
            <p className="text-slate-600">
              Har du hittat jobb? Dela din resa och inspirera andra som är på samma väg.
            </p>
          </div>
          <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
            Dela min story
          </Button>
        </div>
      </Card>
    </div>
  )
}
