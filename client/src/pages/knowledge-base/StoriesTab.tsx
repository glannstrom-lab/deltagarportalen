/**
 * Stories Tab - Success stories and peer mentoring
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Play, MessageCircle, Heart, Share2, Filter,
  Quote, Star, ChevronRight, Search, Bookmark, Clock,
  TrendingUp, Award, Zap, X
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Story {
  id: string
  name: string
  avatar: string
  avatarColor: string
  occupation: string
  background: string
  summary: string
  duration: string
  readingTime?: number
  likes: number
  tags: string[]
  hasVideo: boolean
  views?: number
  category?: string
}

const stories: Story[] = [
  {
    id: '1',
    name: 'Maria, 34',
    avatar: 'M',
    avatarColor: 'from-pink-400 to-rose-400',
    occupation: 'Systemutvecklare',
    background: 'Långtidsarbetslös efter föräldraledighet',
    category: 'Karriäromställning',
    summary: 'Efter 18 månader hemma med barnen kände jag mig osäker på att komma tillbaka. Genom kompetensutveckling och stöd hittade jag tillbaka till arbetslivet starkare än någonsin.',
    duration: '8 månader tillbaka till jobb',
    readingTime: 5,
    likes: 45,
    views: 234,
    tags: ['Karriäromställning', 'IT', 'Förälder'],
    hasVideo: true,
  },
  {
    id: '2',
    name: 'Anders, 52',
    avatar: 'A',
    avatarColor: 'from-blue-400 to-cyan-400',
    occupation: 'Projektledare',
    background: 'Omskolering efter nedläggning',
    category: 'Omskolering',
    summary: 'När fabriken lades ner trodde jag det var för sent att börja om. Men det visade sig att mina erfarenheter var värdefulla på ett helt nytt sätt.',
    duration: '12 månader tillbaka till jobb',
    readingTime: 7,
    likes: 38,
    views: 156,
    tags: ['Omskolering', 'Tillverkning', 'Ledarskap'],
    hasVideo: false,
  },
  {
    id: '3',
    name: 'Sofia, 28',
    avatar: 'S',
    avatarColor: 'from-emerald-400 to-teal-400',
    occupation: 'Sjuksköterska',
    background: 'Nyexaminerad med osäkerhet',
    category: 'Nyexaminerad',
    summary: 'Som nyexaminerad var jag rädd att jag inte skulle räcka till. Men med rätt mentorskap och stöd hittade jag mitt drömjobb inom vården.',
    duration: '4 månader till första jobbet',
    readingTime: 4,
    likes: 62,
    views: 412,
    tags: ['Nyanställd', 'Vård', 'Examen'],
    hasVideo: true,
  },
  {
    id: '4',
    name: 'Jamal, 31',
    avatar: 'J',
    avatarColor: 'from-amber-400 to-orange-400',
    occupation: 'Säljare',
    background: 'Återvändande från utomlands',
    category: 'Nyanlände',
    summary: 'Jag återvände till Sverige efter 5 år i London. Genom nätverkande och att bygga en lokal nätverk hittade jag ett fantastiskt jobb.',
    duration: '6 månader till jobb',
    readingTime: 6,
    likes: 28,
    views: 89,
    tags: ['Internationell', 'Nätverkande', 'Försäljning'],
    hasVideo: false,
  },
]

const categories = ['Alla', 'Karriäromställning', 'Omskolering', 'Nyexaminerad', 'Långtidsarbetslös', 'Nyanlände']

export default function StoriesTab() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState('Alla')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedStories, setLikedStories] = useState<string[]>([])
  const [bookmarkedStories, setBookmarkedStories] = useState<string[]>([])
  const [expandedStory, setExpandedStory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent')

  const toggleLike = (id: string) => {
    setLikedStories(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleBookmark = (id: string) => {
    setBookmarkedStories(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredStories = useMemo(() => {
    let filtered = stories.filter(story => {
      const matchesCategory = selectedCategory === 'Alla' || story.category === selectedCategory
      const matchesSearch =
        story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })

    // Sort stories
    if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0))
    } else if (sortBy === 'trending') {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes)
    }

    return filtered
  }, [selectedCategory, searchQuery, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 border border-teal-200 dark:border-teal-800">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-14 h-14 bg-white dark:bg-stone-700 rounded-2xl flex items-center justify-center shadow-md"
            >
              <Quote className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Framgångsberättelser</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-lg">
                Läs inspirerande berättelser från andra som varit i din situation och hittat vägen till sitt nästa jobb. Du är inte ensam - och det finns alltid hopp!
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">127</p>
          <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">Berättelser</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">89%</p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">Hittade jobb</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">6.2</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Månad i snitt</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800">
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{bookmarkedStories.length}</p>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">Sparade</p>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder={t('common.search') || 'Sök berättelser...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="recent">Senaste först</option>
            <option value="popular">Mest sedda</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-teal-600 dark:bg-teal-700 text-white shadow-md'
                  : 'bg-stone-100 dark:bg-stone-700 text-gray-700 dark:text-gray-200 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {searchQuery || selectedCategory !== 'Alla' ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Visar <span className="font-semibold text-teal-600 dark:text-teal-400">{filteredStories.length}</span> av{' '}
            <span className="font-semibold">{stories.length}</span> berättelser
          </p>
        ) : null}
      </motion.div>

      {/* Peer Matching */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center shadow-sm"
              >
                <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">Hitta en mentor</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Matchas med någon som har liknande bakgrund</p>
              </div>
            </div>
            <Button className="gap-2 bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-600">
              Hitta matchning
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Stories List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {filteredStories.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-700 dark:text-gray-200 font-medium">Inga berättelser hittades</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Försök med en annan sökning eller kategori</p>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        'w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md',
                        `${story.avatarColor}`
                      )}
                    >
                      {story.avatar}
                    </motion.div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{story.name}</h4>
                          <p className="text-teal-600 dark:text-teal-400 font-semibold">{story.occupation}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{story.background}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {story.hasVideo && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium whitespace-nowrap">
                              <Play className="w-3 h-3" />
                              Video
                            </div>
                          )}
                          {story.category === 'Nyanlände' && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-600 rounded-full text-xs font-medium whitespace-nowrap">
                              🌍 Nyanlände
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary/Quote */}
                      <blockquote className="mt-3 text-gray-700 dark:text-gray-200 italic border-l-4 border-teal-300 dark:border-teal-600 pl-4 py-2 bg-stone-50 dark:bg-stone-900/50 rounded-r-lg">
                        "{story.summary}"
                      </blockquote>

                      {/* Bottom Info Row */}
                      <div className="flex items-center gap-3 mt-4 flex-wrap">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                          {story.duration}
                        </span>
                        {story.readingTime && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {story.readingTime} min läsning
                          </span>
                        )}
                        {story.views && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {story.views} visningar
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {story.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(story.id)
                          }}
                          className={cn(
                            'flex items-center gap-1.5 text-sm transition-colors font-medium',
                            likedStories.includes(story.id)
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'
                          )}
                        >
                          <Heart
                            className="w-4 h-4"
                            fill={likedStories.includes(story.id) ? 'currentColor' : 'none'}
                          />
                          {story.likes + (likedStories.includes(story.id) ? 1 : 0)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBookmark(story.id)
                          }}
                          className={cn(
                            'flex items-center gap-1.5 text-sm transition-colors font-medium',
                            bookmarkedStories.includes(story.id)
                              ? 'text-amber-500 dark:text-amber-400'
                              : 'text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400'
                          )}
                        >
                          <Bookmark
                            className="w-4 h-4"
                            fill={bookmarkedStories.includes(story.id) ? 'currentColor' : 'none'}
                          />
                          Spara
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
                          <MessageCircle className="w-4 h-4" />
                          Kommentera
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
                          <Share2 className="w-4 h-4" />
                          Dela
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Section */}
                  <AnimatePresence>
                    {expandedStory === story.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 rounded-lg p-4"
                      >
                        <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Tips från {story.name.split(',')[0]}
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                          <li>Personlig tipning baserad på denna berättelse</li>
                          <li>"Det viktigaste var att tro på mig själv och ta ett steg i taget"</li>
                          <li>"Nätverkande och att be om hjälp var nyckeln till min framgång"</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Q&A Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Ställ dina frågor anonymt
          </h4>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Har du frågor till de som delat sina berättelser? Ställ dem anonymt och få svar från vår community.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="Vad undrar du över?"
              className="flex-1"
            />
            <Button className="bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-600 whitespace-nowrap">
              Skicka fråga
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Share Your Story CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20 border-amber-200 dark:border-amber-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <Star className="w-32 h-32 absolute top-2 right-4 text-amber-600" />
          </div>
          <div className="relative flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-14 h-14 bg-white dark:bg-stone-700 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
            >
              <Zap className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </motion.div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Dela din berättelse</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Har du hittat jobb? Dela din resa och inspirera andra som är på samma väg. Din berättelse kan ge hopp till många!
              </p>
            </div>
            <Button
              variant="outline"
              className="border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-stone-600 whitespace-nowrap flex-shrink-0"
            >
              Dela min story
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Related Stories Suggestion */}
      {filteredStories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-4 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Förslag: Läs berättelser från kategori "<span className="text-teal-600 dark:text-teal-400">{selectedCategory}</span>"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Vi har valt ut de mest inspirerande berättelserna för din situation.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
