/**
 * BuddyPreferencesForm - Set buddy matching preferences
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Loader2, MessageCircle, Video, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { BuddyPreferences, UpdateBuddyPreferencesData, ContactPreference } from '@/types/community.types'

interface BuddyPreferencesFormProps {
  preferences: BuddyPreferences | null
  onSave: (data: UpdateBuddyPreferencesData) => Promise<boolean>
}

export function BuddyPreferencesForm({ preferences, onSave }: BuddyPreferencesFormProps) {
  const [lookingForBuddy, setLookingForBuddy] = useState(false)
  const [bio, setBio] = useState('')
  const [preferredContact, setPreferredContact] = useState<ContactPreference>('both')

  // What I want help with
  const [wantsInterviewPractice, setWantsInterviewPractice] = useState(false)
  const [wantsCvFeedback, setWantsCvFeedback] = useState(false)
  const [wantsMotivationSupport, setWantsMotivationSupport] = useState(false)
  const [wantsAccountability, setWantsAccountability] = useState(false)

  // What I can offer
  const [canHelpInterview, setCanHelpInterview] = useState(false)
  const [canHelpCv, setCanHelpCv] = useState(false)
  const [canHelpMotivation, setCanHelpMotivation] = useState(false)
  const [canHelpAccountability, setCanHelpAccountability] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (preferences) {
      setLookingForBuddy(preferences.lookingForBuddy)
      setBio(preferences.bio || '')
      setPreferredContact(preferences.preferredContact || 'both')
      setWantsInterviewPractice(preferences.wantsInterviewPractice)
      setWantsCvFeedback(preferences.wantsCvFeedback)
      setWantsMotivationSupport(preferences.wantsMotivationSupport)
      setWantsAccountability(preferences.wantsAccountability)
      setCanHelpInterview(preferences.canHelpInterview)
      setCanHelpCv(preferences.canHelpCv)
      setCanHelpMotivation(preferences.canHelpMotivation)
      setCanHelpAccountability(preferences.canHelpAccountability)
    }
  }, [preferences])

  const handleSave = async () => {
    setIsSaving(true)
    await onSave({
      lookingForBuddy,
      bio: bio.trim() || undefined,
      preferredContact,
      wantsInterviewPractice,
      wantsCvFeedback,
      wantsMotivationSupport,
      wantsAccountability,
      canHelpInterview,
      canHelpCv,
      canHelpMotivation,
      canHelpAccountability
    })
    setIsSaving(false)
  }

  const contactOptions: { value: ContactPreference; label: string; icon: React.ElementType }[] = [
    { value: 'chat', label: 'Chatt', icon: MessageCircle },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'both', label: 'Båda', icon: Sparkles }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6 space-y-6"
    >
      {/* Looking for buddy toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-slate-800">Letar efter buddy</h3>
          <p className="text-sm text-slate-500 mt-1">
            Aktivera för att synas i matchningen
          </p>
        </div>
        <button
          onClick={() => setLookingForBuddy(!lookingForBuddy)}
          className={cn(
            "w-12 h-6 rounded-full transition-colors relative",
            lookingForBuddy ? "bg-emerald-500" : "bg-slate-300"
          )}
        >
          <div className={cn(
            "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
            lookingForBuddy ? "translate-x-6" : "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Om dig (visas för potentiella buddies)
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Berätta kort om dig själv och din situation..."
          className="w-full h-24 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={500}
        />
      </div>

      {/* Contact preference */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Föredragen kontakt
        </label>
        <div className="flex gap-2">
          {contactOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPreferredContact(opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                preferredContact === opt.value
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* What I want help with */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Jag vill ha hjälp med
        </label>
        <div className="grid grid-cols-2 gap-2">
          <PreferenceToggle
            label="Intervjuträning"
            description="Öva inför intervjuer"
            checked={wantsInterviewPractice}
            onChange={setWantsInterviewPractice}
          />
          <PreferenceToggle
            label="CV-feedback"
            description="Få tips på ditt CV"
            checked={wantsCvFeedback}
            onChange={setWantsCvFeedback}
          />
          <PreferenceToggle
            label="Motivation"
            description="Peppande samtal"
            checked={wantsMotivationSupport}
            onChange={setWantsMotivationSupport}
          />
          <PreferenceToggle
            label="Ansvarsskyldighet"
            description="Hålla mig på banan"
            checked={wantsAccountability}
            onChange={setWantsAccountability}
          />
        </div>
      </div>

      {/* What I can offer */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Jag kan hjälpa till med
        </label>
        <div className="grid grid-cols-2 gap-2">
          <PreferenceToggle
            label="Intervjuträning"
            description="Öva med andra"
            checked={canHelpInterview}
            onChange={setCanHelpInterview}
          />
          <PreferenceToggle
            label="CV-feedback"
            description="Ge tips på CV"
            checked={canHelpCv}
            onChange={setCanHelpCv}
          />
          <PreferenceToggle
            label="Motivation"
            description="Peppa andra"
            checked={canHelpMotivation}
            onChange={setCanHelpMotivation}
          />
          <PreferenceToggle
            label="Ansvarsskyldighet"
            description="Hjälpa andra på banan"
            checked={canHelpAccountability}
            onChange={setCanHelpAccountability}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Spara inställningar
        </Button>
      </div>
    </motion.div>
  )
}

interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "p-3 rounded-lg border text-left transition-all",
        checked
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">{label}</span>
        <div className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
          checked
            ? "bg-emerald-500 border-emerald-500"
            : "border-slate-300"
        )}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </button>
  )
}

export default BuddyPreferencesForm
