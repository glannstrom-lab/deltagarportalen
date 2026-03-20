/**
 * SendCheer - Form to send encouragement to others
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Sparkles, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ENCOURAGEMENT_TEMPLATES } from '@/types/community.types'
import type { SendCheerData } from '@/types/community.types'

interface SendCheerProps {
  onSend: (data: SendCheerData) => Promise<boolean>
}

export function SendCheer({ onSend }: SendCheerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSend = async () => {
    const finalMessage = selectedTemplate !== null
      ? ENCOURAGEMENT_TEMPLATES[selectedTemplate].text
      : message

    if (!finalMessage.trim()) return

    setIsSending(true)

    const success = await onSend({
      cheerType: 'encouragement',
      message: finalMessage,
      emoji: selectedTemplate !== null ? ENCOURAGEMENT_TEMPLATES[selectedTemplate].emoji : '💜'
    })

    setIsSending(false)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
        setMessage('')
        setSelectedTemplate(null)
      }, 1500)
    }
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">Skicka uppmuntran</h3>
          <p className="text-sm text-white/80">Stötta någon som söker jobb</p>
        </div>
      </div>

      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Skriv ett hejarop
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Quick templates */}
            <div className="flex flex-wrap gap-2">
              {ENCOURAGEMENT_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedTemplate(selectedTemplate === index ? null : index)
                    setMessage('')
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1",
                    selectedTemplate === index
                      ? "bg-white text-emerald-600"
                      : "bg-white/20 hover:bg-white/30"
                  )}
                >
                  <span>{template.emoji}</span>
                  <span>{template.text}</span>
                </button>
              ))}
            </div>

            {/* Custom message */}
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setSelectedTemplate(null)
                }}
                placeholder="Eller skriv eget meddelande..."
                className="w-full px-4 py-2 bg-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                disabled={isSending}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsOpen(false)
                  setMessage('')
                  setSelectedTemplate(null)
                }}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                disabled={isSending}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSend}
                variant="secondary"
                size="sm"
                className="flex-1 bg-white text-emerald-600 hover:bg-white/90 border-0"
                disabled={isSending || (!message.trim() && selectedTemplate === null)}
              >
                {showSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Skickat!
                  </>
                ) : isSending ? (
                  'Skickar...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Skicka hejarop
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default SendCheer
