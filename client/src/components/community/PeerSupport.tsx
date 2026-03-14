/**
 * Peer Support - Community och jobbsökar-buddy system
 * Kopplar ihop användare för ömsesidigt stöd
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageCircle, 
  Send, 
  Heart, 
  Trophy,
  Calendar,
  ChevronRight,
  X,
  MoreVertical,
  Smile,
  Paperclip,
  Phone,
  Video,
  UserPlus,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'

interface PeerGroup {
  id: string
  name: string
  members: PeerMember[]
  commonGoal: string
  weeklyProgress: number
  messages: Message[]
  upcomingEvents: Event[]
}

interface PeerMember {
  id: string
  name: string
  avatar: string
  role: 'member' | 'leader'
  status: 'online' | 'offline' | 'busy'
  progress: number
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  reactions: Reaction[]
}

interface Reaction {
  emoji: string
  count: number
  users: string[]
}

interface Event {
  id: string
  title: string
  date: string
  type: 'study' | 'practice' | 'social'
}

const mockGroups: PeerGroup[] = [
  {
    id: '1',
    name: 'Stockholm Tech-jobbare',
    members: [
      { id: '1', name: 'Maria L.', avatar: 'ML', role: 'leader', status: 'online', progress: 75 },
      { id: '2', name: 'Erik J.', avatar: 'EJ', role: 'member', status: 'online', progress: 60 },
      { id: '3', name: 'Anna S.', avatar: 'AS', role: 'member', status: 'offline', progress: 80 },
      { id: '4', name: 'Karl N.', avatar: 'KN', role: 'member', status: 'busy', progress: 45 },
    ],
    commonGoal: '10 ansökningar denna veckan',
    weeklyProgress: 7,
    messages: [
      {
        id: '1',
        senderId: '1',
        senderName: 'Maria L.',
        content: 'Hej alla! Hur går det med ansökningarna idag? 💪',
        timestamp: '10:30',
        reactions: [{ emoji: '💪', count: 3, users: ['2', '3', '4'] }]
      },
      {
        id: '2',
        senderId: '2',
        senderName: 'Erik J.',
        content: 'Jag har skickat 2 idag! En till Spotify och en till Klarna 🤞',
        timestamp: '10:35',
        reactions: [{ emoji: '🤞', count: 2, users: ['1', '3'] }]
      },
      {
        id: '3',
        senderId: '3',
        senderName: 'Anna S.',
        content: 'Fick faktiskt ett samtal från en rekryterare igår! Så nervös inför intervjun...',
        timestamp: '10:42',
        reactions: [{ emoji: '🎉', count: 4, users: ['1', '2', '4', '1'] }]
      }
    ],
    upcomingEvents: [
      { id: '1', title: 'Gemensam jobbsökning', date: 'Imorgon 10:00', type: 'study' },
      { id: '2', title: 'Intervjuövning', date: 'Torsdag 14:00', type: 'practice' },
    ]
  }
]

export function PeerSupport() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<PeerGroup>(mockGroups[0])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeGroup.messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: user?.firstName || 'Jag',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      reactions: []
    }
    
    activeGroup.messages.push(message)
    setNewMessage('')
  }

  return (
    <>
      {/* Peer Support Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-40 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium",
          "hover:shadow-xl transition-shadow"
        )}
      >
        <Users size={20} />
        <span className="hidden sm:inline">Min grupp</span>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
          2
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold">{activeGroup.name}</h2>
                      <p className="text-sm text-emerald-100">
                        {activeGroup.members.length} medlemmar • {activeGroup.members.filter(m => m.status === 'online').length} online
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Members Sidebar */}
                <div className="hidden md:block w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">Medlemmar</h3>
                  <div className="space-y-2">
                    {activeGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                            {member.avatar}
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-50",
                            member.status === 'online' ? 'bg-emerald-500' :
                            member.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.progress}% klart</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Chat */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeGroup.messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex gap-3",
                          message.senderId === 'me' ? 'flex-row-reverse' : ''
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {message.senderName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={cn("max-w-[70%]", message.senderId === 'me' ? 'text-right' : '')}>
                          <div className={cn(
                            "inline-block px-4 py-2 rounded-2xl text-sm",
                            message.senderId === 'me' 
                              ? 'bg-emerald-500 text-white rounded-br-md'
                              : 'bg-slate-100 text-slate-800 rounded-bl-md'
                          )}>
                            {message.content}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{message.timestamp}</span>
                            {message.reactions.length > 0 && (
                              <div className="flex gap-1">
                                {message.reactions.map((reaction, i) => (
                                  <span key={i} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">
                                    {reaction.emoji} {reaction.count}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Skriv ett meddelande..."
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        size="icon"
                        className="rounded-full bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Events Sidebar */}
                <div className="hidden lg:block w-64 bg-slate-50 border-l border-slate-200 p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">Aktiviteter</h3>
                  <div className="space-y-3">
                    {activeGroup.upcomingEvents.map((event) => (
                      <div key={event.id} className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="font-medium text-slate-800 text-sm">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{event.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default PeerSupport
