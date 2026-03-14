/**
 * ParticipantAnalytics - Dashboard för arbetskonsulenter
 * Översikt över deltagares aktivitet, riskindikatorer och framsteg
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Mail,
  Calendar,
  Activity,
  FileText,
  Zap,
  Heart,
  Briefcase
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

// Mock-data för demo
interface Participant {
  id: string
  name: string
  email: string
  lastActive: string
  cvProgress: number
  applicationsSent: number
  wellnessStreak: number
  energyLevel: 'low' | 'medium' | 'high'
  riskFlags: string[]
  notes: string
}

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Anna Svensson',
    email: 'anna.svensson@example.com',
    lastActive: 'Idag',
    cvProgress: 85,
    applicationsSent: 3,
    wellnessStreak: 5,
    energyLevel: 'high',
    riskFlags: [],
    notes: 'Gör bra framsteg'
  },
  {
    id: '2',
    name: 'Erik Johansson',
    email: 'erik.j@example.com',
    lastActive: '4 dagar sedan',
    cvProgress: 45,
    applicationsSent: 0,
    wellnessStreak: 0,
    energyLevel: 'low',
    riskFlags: ['inactive-3-days', 'cv-stalled'],
    notes: 'Behöver uppmuntran'
  },
  {
    id: '3',
    name: 'Maria Lindqvist',
    email: 'maria.l@example.com',
    lastActive: 'Igår',
    cvProgress: 100,
    applicationsSent: 5,
    wellnessStreak: 7,
    energyLevel: 'high',
    riskFlags: [],
    notes: 'Mycket aktiv'
  }
]

export default function ParticipantAnalytics() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)

  const stats = {
    total: mockParticipants.length,
    atRisk: mockParticipants.filter(p => p.riskFlags.length > 0).length,
    activeToday: 1,
    avgProgress: Math.round(mockParticipants.reduce((acc, p) => acc + p.cvProgress, 0) / mockParticipants.length)
  }

  const filteredParticipants = mockParticipants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageLayout
      title="Deltagaranalys"
      description="Översikt och insikter om dina deltagare"
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Totalt" value={stats.total} color="blue" />
        <StatCard icon={<AlertTriangle size={20} />} label="Behöver stöd" value={stats.atRisk} color="red" />
        <StatCard icon={<Activity size={20} />} label="Aktiva idag" value={stats.activeToday} color="emerald" />
        <StatCard icon={<TrendingUp size={20} />} label="CV-snitt" value={`${stats.avgProgress}%`} color="violet" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <Input
          placeholder="Sök deltagare..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {filteredParticipants.map((p) => (
          <div
            key={p.id}
            className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
            onClick={() => setSelectedParticipant(p)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.riskFlags.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {p.riskFlags.length} risk
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{p.email} • {p.lastActive}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedParticipant && (
        <DetailModal participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />
      )}
    </PageLayout>
  )
}

function StatCard({ icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700'
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", colors[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

function DetailModal({ participant, onClose }: { participant: Participant, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{participant.name}</h2>
        
        {participant.riskFlags.length > 0 ? (
          <div className="p-4 bg-red-50 rounded-xl mb-4">
            <p className="font-semibold text-red-800">⚠️ Riskindikatorer</p>
            {participant.riskFlags.map((flag, i) => (
              <span key={i} className="text-sm text-red-600 block">{flag}</span>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-xl mb-4">
            <p className="text-emerald-800">✅ Allt ser bra ut!</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="flex items-center gap-2"><FileText size={16} /> CV Progress</span>
            <span className="font-semibold">{participant.cvProgress}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="flex items-center gap-2"><Briefcase size={16} /> Ansökningar</span>
            <span className="font-semibold">{participant.applicationsSent}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="flex items-center gap-2"><Heart size={16} /> Välmående</span>
            <span className="font-semibold">{participant.wellnessStreak} dagar</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1"><Mail size={16} className="mr-2" /> Meddelande</Button>
          <Button variant="outline" className="flex-1"><Calendar size={16} className="mr-2" /> Boka möte</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
