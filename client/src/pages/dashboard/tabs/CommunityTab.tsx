/**
 * CommunityTab - Peer support, grupper och socialt
 * Anslut med andra jobbsökande
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Calendar, UserPlus, Heart, Trophy, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PeerSupport } from '@/components/community/PeerSupport'
import { cn } from '@/lib/utils'

// Mock grupper
const myGroups = [
  { id: '1', name: 'Stockholm Tech-jobbare', members: 5, online: 2, progress: 70, lastMessage: 'Maria: Hur går det med ansökningarna?' },
  { id: '2', name: 'Karriärväxlare 40+', members: 8, online: 3, progress: 45, lastMessage: 'Erik: Någon som vill öva intervju?' },
]

const suggestedGroups = [
  { id: '3', name: 'Nyutexaminerade', members: 12, description: 'För dig som nyligen tagit examen' },
  { id: '4', name: 'Distansjobbare', members: 6, description: 'Fokus på remote-job' },
]

export default function CommunityTab() {
  const [showPeerSupport, setShowPeerSupport] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Community</h2>
          <p className="text-slate-500">Anslut med andra i samma situation</p>
        </div>
        <Button onClick={() => setShowPeerSupport(true)} className="bg-emerald-500 hover:bg-emerald-600">
          <MessageCircle size={18} className="mr-2" />
          Öppna chat
        </Button>
      </div>

      {/* Mina grupper */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Mina grupper</h3>
        <div className="space-y-3">
          {myGroups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setActiveGroup(group.id)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{group.name}</h4>
                    <p className="text-sm text-slate-500">{group.members} medlemmar • {group.online} online</p>
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{group.lastMessage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-600">{group.progress}% klart</div>
                  <ChevronRight size={20} className="text-slate-300 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Föreslagna grupper */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Föreslagna grupper</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {suggestedGroups.map(group => (
            <div key={group.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-slate-800">{group.name}</h4>
              <p className="text-sm text-slate-500">{group.members} medlemmar</p>
              <p className="text-sm text-slate-600 mt-2">{group.description}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <UserPlus size={16} className="mr-2" />
                Gå med
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Peer Support Modal */}
      {showPeerSupport && <PeerSupport />}
    </div>
  )
}
