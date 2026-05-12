/**
 * StartsamtalForm — konsulentens dokumentation av startsamtalet
 *
 * Ersätter externt system (Zynca). Datan flyter direkt in i:
 *   - sta_enrollments  (anpassningar, språkstöd, fokusyrke, aktivitetsomfattning)
 *   - sta_activities   (en post med activity_type='startsamtal')
 *   - sta_quick_notes  (eventuella röstanteckningar + observationer)
 *
 * Detta är källan till Initial planering — utan startsamtal, ingen Initial planering.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  CheckCircle2,
  MessageSquare,
  Mic,
  Save,
  AlertCircle,
  Briefcase,
  Globe,
  Calendar as CalendarIcon,
  Clock,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  staEnrollmentsApi,
  staActivitiesApi,
  staQuickNotesApi,
  type StaEnrollment,
} from '@/services/staApi'
import { VoiceInput } from './VoiceInput'

const LANGUAGES = ['Arabiska', 'Somaliska', 'Tigrinja', 'Dari', 'Pashtu', 'Annat']
const COMMUNICATION_AIDS = ['Bildstöd', 'Lättläst', 'Förstorat material', 'Tolk', 'Punktskrift']
const ADAPTATION_SUGGESTIONS = [
  'Kortare aktivitetspass (45 min)',
  'Tysta rum vid behov',
  'Möjlighet att gå utomhus mellan övningar',
  'Extra pauser',
  'Skriftliga instruktioner',
  'En-till-en-handledning',
  'Bildstöd vid instruktioner',
  'Flexibla starttider',
]

interface StartsamtalFormProps {
  enrollment: StaEnrollment
  onSaved?: (updated: StaEnrollment) => void
  onCancel?: () => void
}

export function StartsamtalForm({ enrollment, onSaved, onCancel }: StartsamtalFormProps) {
  // Checklista över obligatoriska genomgångar
  const [infoBladSent, setInfoBladSent] = useState(false)
  const [scheduleHandedOut, setScheduleHandedOut] = useState(false)
  const [absenceRulesExplained, setAbsenceRulesExplained] = useState(false)
  const [contactsExchanged, setContactsExchanged] = useState(false)

  // Aktivitetsomfattning initialt
  const [hoursPerWeek, setHoursPerWeek] = useState(20)

  // Fokusyrke
  const [focusOccupation, setFocusOccupation] = useState(enrollment.focus_occupation ?? '')
  const [focusIsSet, setFocusIsSet] = useState(!!enrollment.focus_occupation)

  // Anpassningar (multi-select chips + fritext)
  const [selectedAdaptations, setSelectedAdaptations] = useState<string[]>(
    enrollment.adaptations ? enrollment.adaptations.split(' · ') : [],
  )
  const [customAdaptation, setCustomAdaptation] = useState('')

  // Språkstöd
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(enrollment.language_support)
  const [selectedComms, setSelectedComms] = useState<string[]>(enrollment.communication_support)

  // Anteckning (text + voice)
  const [generalNote, setGeneralNote] = useState('')
  const [voiceTranscript, setVoiceTranscript] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      // Bygg ihop anpassningar som en sammanslagen sträng
      const allAdaptations = customAdaptation
        ? [...selectedAdaptations, customAdaptation]
        : selectedAdaptations
      const adaptationsText = allAdaptations.join(' · ')

      // 1. Uppdatera enrollment med strukturerade fält
      const updated = await staEnrollmentsApi.update(enrollment.id, {
        focus_occupation: focusIsSet ? focusOccupation : null,
        adaptations: adaptationsText || null,
        language_support: selectedLanguages,
        communication_support: selectedComms,
      })

      // 2. Skapa en aktivitet av typen 'startsamtal'
      await staActivitiesApi.upsert({
        enrollment_id: enrollment.id,
        part: 1,
        activity_type: 'startsamtal',
        activity_key: 'startsamtal',
        scheduled_for: new Date().toISOString().slice(0, 10),
        completed_at: new Date().toISOString(),
        duration_minutes: 60,
        metadata: {
          info_blad_sent: infoBladSent,
          schedule_handed_out: scheduleHandedOut,
          absence_rules_explained: absenceRulesExplained,
          contacts_exchanged: contactsExchanged,
          initial_hours_per_week: hoursPerWeek,
        },
      })

      // 3. Om vi har anteckning eller voice — spara som quick note
      if (generalNote.trim() || voiceTranscript.trim()) {
        await staQuickNotesApi.create({
          enrollment_id: enrollment.id,
          body: generalNote.trim() || null,
          voice_transcript: voiceTranscript.trim() || null,
          tags: ['startsamtal'],
          visibility: 'shared_in_report',
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara startsamtalet')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'white', color: 'var(--c-text)' }}
          >
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Startsamtal</h2>
            <p className="text-sm text-stone-700">
              Strukturerad dokumentation — datan utgör underlag för Initial planering till AF.
            </p>
          </div>
        </div>
      </Card>

      {/* Genomgångar */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <CheckCircle2 size={18} style={{ color: 'var(--c-solid)' }} />
          Genomgångar
        </h3>
        <div className="space-y-2">
          <CheckRow checked={infoBladSent} onChange={setInfoBladSent} label="Informationsbladet utdelat" />
          <CheckRow checked={scheduleHandedOut} onChange={setScheduleHandedOut} label="Schema utdelat" />
          <CheckRow
            checked={absenceRulesExplained}
            onChange={setAbsenceRulesExplained}
            label="Frånvaro-rutiner gått igenom"
          />
          <CheckRow checked={contactsExchanged} onChange={setContactsExchanged} label="Kontaktuppgifter utbytta" />
        </div>
      </Card>

      {/* Aktivitetsomfattning */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Clock size={18} style={{ color: 'var(--c-solid)' }} />
          Aktivitetsomfattning initialt
        </h3>
        <p className="text-sm text-stone-600 mb-3">Hur många timmar per vecka börjar deltagaren med?</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="flex-1"
          />
          <span
            className="text-lg font-semibold w-20 text-right"
            style={{ color: 'var(--c-text)' }}
          >
            {hoursPerWeek} tim/v
          </span>
        </div>
      </Card>

      {/* Fokusyrke */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Briefcase size={18} style={{ color: 'var(--c-solid)' }} />
          Fokusyrke
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={focusIsSet}
              onChange={() => setFocusIsSet(true)}
              className="w-4 h-4"
            />
            <span className="text-sm text-stone-700">Redan fastställt:</span>
          </label>
          {focusIsSet && (
            <Input
              placeholder="T.ex. administration, lager, butik..."
              value={focusOccupation}
              onChange={(e) => setFocusOccupation(e.target.value)}
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!focusIsSet}
              onChange={() => {
                setFocusIsSet(false)
                setFocusOccupation('')
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-stone-700">Identifieras under tjänsten</span>
          </label>
        </div>
      </Card>

      {/* Anpassningar */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <AlertCircle size={18} style={{ color: 'var(--c-solid)' }} />
          Anpassningsbehov
        </h3>
        <p className="text-sm text-stone-600 mb-3">Klicka för att lägga till. Du kan välja flera.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ADAPTATION_SUGGESTIONS.map((adaptation) => {
            const isSelected = selectedAdaptations.includes(adaptation)
            return (
              <button
                key={adaptation}
                type="button"
                onClick={() => setSelectedAdaptations((prev) => toggle(prev, adaptation))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                  isSelected
                    ? 'text-white border-transparent'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300',
                )}
                style={isSelected ? { background: 'var(--c-solid)' } : undefined}
              >
                {adaptation}
              </button>
            )
          })}
        </div>
        <Input
          placeholder="Egen anpassning (frivilligt)..."
          value={customAdaptation}
          onChange={(e) => setCustomAdaptation(e.target.value)}
        />
      </Card>

      {/* Språkstöd */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Globe size={18} style={{ color: 'var(--c-solid)' }} />
          Förstärkt språkstöd
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang)
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguages((prev) => toggle(prev, lang))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                  isSelected
                    ? 'text-white border-transparent'
                    : 'bg-white border-stone-200 text-stone-700',
                )}
                style={isSelected ? { background: 'var(--c-solid)' } : undefined}
              >
                {lang}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-stone-600 mb-2">Kommunikationsstöd:</p>
        <div className="flex flex-wrap gap-2">
          {COMMUNICATION_AIDS.map((aid) => {
            const isSelected = selectedComms.includes(aid)
            return (
              <button
                key={aid}
                type="button"
                onClick={() => setSelectedComms((prev) => toggle(prev, aid))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                  isSelected
                    ? 'text-white border-transparent'
                    : 'bg-white border-stone-200 text-stone-700',
                )}
                style={isSelected ? { background: 'var(--c-solid)' } : undefined}
              >
                {aid}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Anteckning */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Mic size={18} style={{ color: 'var(--c-solid)' }} />
          Övriga observationer
        </h3>
        <p className="text-sm text-stone-600 mb-3">
          Skriv eller tala in — det här blir underlag till delredovisning Del 1.
        </p>
        <VoiceInput
          value={voiceTranscript || generalNote}
          onChange={(text) => {
            if (voiceTranscript) setVoiceTranscript(text)
            else setGeneralNote(text)
          }}
          onVoiceTranscript={(transcript) => {
            setVoiceTranscript(transcript)
            setGeneralNote('')
          }}
          placeholder="T.ex. 'Deltagaren verkar pigg och engagerad. Nämnde att hen har god rutin men kämpar med stress på kvällar.'"
          rows={4}
        />
      </Card>

      {/* Spara-bar */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap p-4 rounded-xl bg-white border border-stone-200 sticky bottom-4">
        <div className="text-sm text-stone-600 flex items-center gap-1.5">
          <CalendarIcon size={14} />
          Sparas till deltagarens profil och blir tillgänglig för Initial planering
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Avbryt
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            leftIcon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          >
            {saved ? 'Sparat' : 'Spara startsamtal'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded"
      />
      <span className={cn('text-sm', checked ? 'text-stone-900 font-medium' : 'text-stone-700')}>{label}</span>
    </label>
  )
}
