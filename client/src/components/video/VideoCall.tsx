/**
 * Video Call - Inbäddade videosamtal
 */
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Phone, PhoneOff, Mic, MicOff, VideoOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface VideoCallProps {
  isOpen: boolean
  onClose: () => void
  participantName: string
  isIncoming?: boolean
}

export function VideoCall({ isOpen, onClose, participantName, isIncoming = false }: VideoCallProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    if (!isConnected) return
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000)
    return () => clearInterval(timer)
  }, [isConnected])

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 bg-slate-800/50">
        <div>
          <h3 className="text-white font-semibold">{participantName}</h3>
          {isConnected && <p className="text-slate-400 text-sm">{formatDuration(callDuration)}</p>}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white"><X size={24} /></button>
      </div>

      <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
        {!isConnected && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4 text-white text-4xl">
              {participantName[0]}
            </div>
            <p className="text-white text-lg">{isIncoming ? 'Inkommande samtal...' : 'Ansluter...'}</p>
          </div>
        )}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden">
          {isVideoOff ? <div className="w-full h-full flex items-center justify-center"><VideoOff size={32} className="text-slate-400" /></div> : <div className="w-full h-full bg-slate-700" />}
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 flex justify-center gap-4">
        <button onClick={() => setIsMuted(!isMuted)} className={cn("w-14 h-14 rounded-full flex items-center justify-center", isMuted ? 'bg-red-500 text-white' : 'bg-slate-600 text-white')}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={onClose} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center">
          <PhoneOff size={28} />
        </button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={cn("w-14 h-14 rounded-full flex items-center justify-center", isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-600 text-white')}>
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
      </div>
    </motion.div>
  )
}

export default VideoCall
