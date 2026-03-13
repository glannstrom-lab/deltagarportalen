/**
 * Quests Tab - Gamification with daily challenges and achievements
 */
import { useState } from 'react'
import { 
  Trophy, Star, Target, Flame, CheckCircle2, Lock,
  Zap, Calendar, TrendingUp, Gift, ChevronRight
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface Quest {
  id: string
  title: string
  description: string
  xp: number
  completed: boolean
  category: 'daily' | 'weekly' | 'achievement'
  icon: React.ElementType
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ElementType
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const dailyQuests: Quest[] = [
  { id: '1', title: 'Spara 3 jobb', description: 'Spara intressanta jobbannonser', xp: 50, completed: true, category: 'daily', icon: Target },
  { id: '2', title: 'Uppdatera CV', description: 'Gör en förbättring i ditt CV', xp: 100, completed: false, category: 'daily', icon: Zap },
  { id: '3', title: 'Kontakta nätverk', description: 'Skicka ett meddelande till en kontakt', xp: 75, completed: false, category: 'daily', icon: Flame },
]

const weeklyQuests: Quest[] = [
  { id: '4', title: 'Skicka 5 ansökningar', description: 'Skicka minst 5 jobbansökningar', xp: 300, completed: false, category: 'weekly', icon: Trophy },
  { id: '5', title: 'Gå på intervju', description: 'Genomför en jobbintervju', xp: 500, completed: false, category: 'weekly', icon: Star },
]

const achievements: Achievement[] = [
  { id: '1', title: 'Första steget', description: 'Skapa ditt första CV', icon: Trophy, unlocked: true, rarity: 'common' },
  { id: '2', title: 'Nätverkare', description: 'Kontakta 5 personer', icon: Flame, unlocked: true, rarity: 'common' },
  { id: '3', title: 'Intervjuproffs', description: 'Gå på 3 intervjuer', icon: Star, unlocked: false, rarity: 'rare' },
  { id: '4', title: 'Comeback Kid', description: 'Få ett jobberbjudande', icon: Trophy, unlocked: false, rarity: 'epic' },
  { id: '5', title: 'Mästare', description: 'Fullfölj alla dagliga uppdrag i 30 dagar', icon: Trophy, unlocked: false, rarity: 'legendary' },
]

const rarityColors = {
  common: 'bg-slate-100 text-slate-600 border-slate-300',
  rare: 'bg-blue-100 text-blue-600 border-blue-300',
  epic: 'bg-purple-100 text-purple-600 border-purple-300',
  legendary: 'bg-amber-100 text-amber-600 border-amber-300',
}

export default function QuestsTab() {
  const [quests, setQuests] = useState<Quest[]>([...dailyQuests, ...weeklyQuests])
  const [streak, setStreak] = useState(5)
  const [totalXP, setTotalXP] = useState(1250)
  const [level, setLevel] = useState(3)

  const toggleQuest = (id: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        const newCompleted = !q.completed
        setTotalXP(xp => newCompleted ? xp + q.xp : xp - q.xp)
        return { ...q, completed: newCompleted }
      }
      return q
    }))
  }

  const completedDaily = quests.filter(q => q.category === 'daily' && q.completed).length
  const completedWeekly = quests.filter(q => q.category === 'weekly' && q.completed).length
  const unlockedAchievements = achievements.filter(a => a.unlocked).length

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-bold">Nivå {level}</h3>
              <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="font-bold">{streak} dagar</span>
              </div>
            </div>
            <p className="text-indigo-100 mb-3">Jobbsökar-äventyrare</p>
            
            {/* XP Bar */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{totalXP} XP</span>
              <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all"
                  style={{ width: '65%' }}
                />
              </div>
              <span className="text-sm text-indigo-200">{1500 - totalXP} till nivå {level + 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Quests */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Dagens uppdrag</h3>
              <p className="text-sm text-slate-500">{completedDaily} av {dailyQuests.length} avklarade</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Återställs om</p>
            <p className="font-mono font-bold text-slate-700">14:32:15</p>
          </div>
        </div>

        <div className="space-y-3">
          {dailyQuests.map((quest) => {
            const Icon = quest.icon
            return (
              <div
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  quest.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  quest.completed ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {quest.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Icon className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className={`font-semibold ${quest.completed ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                    {quest.title}
                  </h4>
                  <p className="text-sm text-slate-500">{quest.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    +{quest.xp} XP
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Weekly Quests */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Veckovisa utmaningar</h3>
            <p className="text-sm text-slate-500">{completedWeekly} av {weeklyQuests.length} avklarade</p>
          </div>
        </div>

        <div className="space-y-3">
          {weeklyQuests.map((quest) => {
            const Icon = quest.icon
            return (
              <div
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  quest.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  quest.completed ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {quest.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Icon className="w-6 h-6 text-purple-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className={`font-semibold ${quest.completed ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                    {quest.title}
                  </h4>
                  <p className="text-sm text-slate-500">{quest.description}</p>
                </div>

                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  +{quest.xp} XP
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Achievements</h3>
              <p className="text-sm text-slate-500">{unlockedAchievements} av {achievements.length} upplåsta</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 ${
                  achievement.unlocked
                    ? rarityColors[achievement.rarity]
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {achievement.unlocked ? (
                    <Icon className="w-8 h-8" />
                  ) : (
                    <Lock className="w-8 h-8 text-slate-400" />
                  )}
                  {achievement.unlocked && (
                    <span className="text-xs px-2 py-1 bg-white/50 rounded-full capitalize">
                      {achievement.rarity}
                    </span>
                  )}
                </div>
                <h4 className={`font-semibold ${achievement.unlocked ? '' : 'text-slate-500'}`}>
                  {achievement.title}
                </h4>
                <p className="text-sm opacity-80">{achievement.description}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Rewards Preview */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Gift className="w-7 h-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">Kommande belöningar</h4>
            <p className="text-slate-600">
              Nå nivå 5 för att låsa upp exklusiva CV-mallar och premium-funktioner!
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </Card>
    </div>
  )
}
