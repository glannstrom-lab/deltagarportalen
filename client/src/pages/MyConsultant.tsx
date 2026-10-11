/**
 * MyConsultant - Min konsulent-sidan
 * Visar deltagarens koppling till sin arbetskonsulent
 *
 * Design baserad på input från:
 * - Arbetskonsulent: Delad information, uppföljning
 * - Långtidsarbetssökande: Trygghet, energianpassat, positiv ton
 * - UX-designer: Progressiv disclosure, max 3-5 val
 * - Accessibility Specialist: WCAG 2.1 AA
 */

import { useState, useEffect, useEffectEvent, useRef } from 'react'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/EmptyState'
import { Send, Eye, EyeOff, UserCheck } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusMyConsultantWizard } from '@/components/focus/pages/FocusMyConsultantWizard'
import { supabase } from '@/lib/supabase'
import { applicationsApi } from '@/services/applicationsApi'
import { getMyConsultant } from '@/services/myConsultantApi'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
// RD26 (rollspelet 2026-09-27): inget tyst fel när ett meddelande inte går fram
import { SkrivFel } from '@/components/ui/SkrivFel'
import { useSkrivning } from '@/components/ui/useSkrivning'
import { cn } from '@/lib/utils'
import { PageLayout } from '@/components/layout/PageLayout'
import { RevokeConsultantLinkSection } from '@/components/consultant/RevokeConsultantLinkSection'
import { VemHarOppnatKort } from '@/components/consultant/VemHarOppnatKort'
import { Delningsforslag } from '@/components/participant/Delningsforslag'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'
import { MerMeny, type MerMenyVal } from '@/components/ui/MerMeny'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'
import { MerLista, MerRad } from '@/components/minvecka/MerRad'
import { datumSprak, kortDatum } from '@/lib/datumsprak'

// Types
interface ConsultantInfo {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  title?: string
}

interface NextMeeting {
  id: string
  scheduled_at: string
  type: 'video' | 'phone' | 'in_person'
  location?: string
  meeting_link?: string
  notes?: string
}

interface SharedInfo {
  category: string
  items: {
    label: string
    value: string
    status: 'good' | 'neutral' | 'attention'
    isShared: boolean
  }[]
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
}

interface Goal {
  id: string
  title: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  deadline?: string
}

/** Initialer i stället för bild när konsulenten saknar en egen. */
function initialer(forn: string, efter: string): string {
  return `${forn.trim().charAt(0)}${efter.trim().charAt(0)}`.toUpperCase() || '?'
}

const MOTES_IKON: Record<NextMeeting['type'], KvarterNamn> = {
  video: 'digitalt',
  phone: 'samtal',
  in_person: 'fysiskt',
}

/**
 * Omtaget steg 6: vem, hur du når hen och ert nästa möte — överst, på en yta.
 * En primärknapp ("Skriv" → meddelandefältet), en ramad (Ring, eller Mejla
 * utan telefonnummer) och resten i Mer-menyn.
 */
export function KonsulentHuvud({
  consultant,
  nextMeeting,
  onSkriv,
  onBoka,
}: {
  consultant: ConsultantInfo
  nextMeeting: NextMeeting | null
  onSkriv: () => void
  onBoka: () => void
}) {
  const { t, i18n } = useTranslation()
  const namn = `${consultant.first_name} ${consultant.last_name}`.trim()
  const tel = consultant.phone?.replace(/\s/g, '')
  const mejla = () => { window.location.href = `mailto:${consultant.email}` }
  const ring = () => { if (tel) window.location.href = `tel:${tel}` }

  const merVal: MerMenyVal[] = [
    ...(tel && consultant.email ? [{ etikett: t('myConsultant.quickActions.sendEmail'), ikon: 'meddelande' as const, onClick: mejla }] : []),
    ...(consultant.email ? [{ etikett: t('myConsultant.quickActions.bookMeeting'), ikon: 'kalender' as const, onClick: onBoka }] : []),
  ]

  return (
    <section
      aria-labelledby="min-konsulent-namn"
      className="overflow-hidden rounded-j-m border border-j-linje bg-j-kort text-j-blak shadow-j"
      data-testid="konsulent-huvud"
    >
      <div className="flex items-center gap-4 p-5 sm:p-6">
        {consultant.avatar_url ? (
          <img src={consultant.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-j-gran-mjuk font-rubrik text-xl font-bold text-j-gran-text">
            {initialer(consultant.first_name, consultant.last_name)}
          </span>
        )}
        <div className="min-w-0">
          <h2 id="min-konsulent-namn" className="m-0 break-words font-rubrik text-[1.5rem] font-bold leading-tight">
            {namn}
          </h2>
          <p className="m-0 text-[0.9375rem] text-j-blak-2">
            {consultant.title || t('myConsultant.consultant.yourConsultant')}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button ton="kvarter" variant="primary" onClick={onSkriv} className="w-full sm:w-auto"
            leftIcon={<KvarterIkon namn="meddelande" size={20} />}>
            {t('myConsultant.kontakt.skriv', 'Skriv')}
          </Button>
          {tel ? (
            <Button ton="kvarter" variant="secondary" onClick={ring} className="w-full sm:w-auto"
              leftIcon={<KvarterIkon namn="samtal" size={20} ton="gran" />}>
              {t('myConsultant.quickActions.call')}
            </Button>
          ) : consultant.email ? (
            <Button ton="kvarter" variant="secondary" onClick={mejla} className="w-full sm:w-auto"
              leftIcon={<KvarterIkon namn="meddelande" size={20} ton="gran" />}>
              {t('myConsultant.quickActions.sendEmail')}
            </Button>
          ) : null}
          {merVal.length > 0 && <MerMeny val={merVal} align="start" className="self-start" />}
        </div>
        {/* Numret och adressen som text också — den som vill skriva av dem ska kunna det. */}
        <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem] text-j-blak-2">
          {consultant.phone && (
            <a href={`tel:${tel}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-j-blak-2 underline-offset-2 hover:underline sm:min-h-0">
              <KvarterIkon namn="samtal" size={16} />{consultant.phone}
            </a>
          )}
          {consultant.email && (
            <a href={`mailto:${consultant.email}`} className="inline-flex min-h-[44px] items-center gap-1.5 break-all text-j-blak-2 underline-offset-2 hover:underline sm:min-h-0">
              <KvarterIkon namn="meddelande" size={16} />{consultant.email}
            </a>
          )}
        </p>
      </div>

      {/* Ert nästa möte */}
      <div className="border-t border-j-linje bg-j-sankt/60 px-5 py-4 sm:px-6" data-testid="nasta-mote">
        <p className="m-0 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-glod">
          {t('myConsultant.nextMeeting.title')}
        </p>
        {nextMeeting ? (
          <div className="mt-2 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-j-m bg-j-kort">
              <KvarterIkon namn={MOTES_IKON[nextMeeting.type] ?? 'digitalt'} size={24} ton="gran" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-base font-semibold first-letter:uppercase">
                {new Date(nextMeeting.scheduled_at).toLocaleDateString(datumSprak(i18n.language), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="m-0 text-[0.9375rem] text-j-blak-2">
                {t(MOTES_TYP_NYCKEL[nextMeeting.type] ?? MOTES_TYP_NYCKEL.video)}
                {nextMeeting.location ? ` · ${nextMeeting.location}` : ''}
              </p>
              {nextMeeting.meeting_link && (
                <a
                  href={nextMeeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-j-gran-text underline underline-offset-2"
                >
                  <KvarterIkon namn="digitalt" size={18} />
                  {t('myConsultant.nextMeeting.joinMeeting')}
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="m-0 mt-1 text-[0.9375rem] text-j-blak-2">{t('myConsultant.nextMeeting.noMeetings')}</p>
        )}
      </div>
    </section>
  )
}

/** Hela nycklar som literaler — UX24-vakten ska se dem. */
const MOTES_TYP_NYCKEL: Record<NextMeeting['type'], string> = {
  video: 'myConsultant.nextMeeting.meetingTypes.video',
  phone: 'myConsultant.nextMeeting.meetingTypes.phone',
  in_person: 'myConsultant.nextMeeting.meetingTypes.inPerson',
}

// Shared Information Section — innehållet i raden "Det här ser {{namn}}"
function SharedInformationSection({ sharedInfo }: { sharedInfo: SharedInfo[] }) {
  const { t } = useTranslation()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['progress'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // UX24: bara tre kategorier produceras någonsin av datan nedan
  // (`progress`, `cv`, `wellbeing` — se sharedInfoItems).
  const categoryIcons: Record<string, KvarterNamn> = {
    progress: 'jobb',
    cv: 'dokument',
    wellbeing: 'deltagare',
  }

  const categoryLabels: Record<string, string> = {
    progress: t('myConsultant.sharedInfo.categories.progress'),
    cv: t('myConsultant.sharedInfo.categories.cv'),
    wellbeing: t('myConsultant.sharedInfo.categories.wellbeing'),
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-j-m border border-j-linje">
        {sharedInfo.map(category => {
          const isExpanded = expandedCategories.includes(category.category)
          const label = categoryLabels[category.category] || category.category

          return (
            <div key={category.category} className="border-b border-j-linje last:border-b-0">
              <button
                type="button"
                onClick={() => toggleCategory(category.category)}
                aria-expanded={isExpanded}
                aria-controls={`shared-${category.category}`}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left hover:bg-j-sankt focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-[var(--j-fokus)]"
              >
                <span className="flex items-center gap-3 font-semibold text-j-blak">
                  <KvarterIkon namn={categoryIcons[category.category] ?? 'plan'} size={20} ton="gran" />
                  {label}
                </span>
                <KvarterIkon namn="pil" size={18} className={cn('text-j-blak-3 transition-transform motion-reduce:transition-none', isExpanded && 'rotate-90')} />
              </button>

              {isExpanded && (
                <div id={`shared-${category.category}`} role="region" aria-label={label} className="px-4 pb-4">
                  <ul className="m-0 list-none space-y-2.5 p-0">
                    {category.items.map((item, index) => (
                      <li key={index} className="flex items-start justify-between gap-3 text-[0.9375rem]">
                        <span className="flex items-center gap-2 text-j-blak-2">
                          {/* Nycklarna låg under sharedInfo, inte direkt under
                              myConsultant — aria-labeln var tom före 2026-07-27. */}
                          {item.isShared ? (
                            <Eye className="h-4 w-4 shrink-0 text-j-gran-text" aria-label={t('myConsultant.sharedInfo.shared', 'Delas')} />
                          ) : (
                            <EyeOff className="h-4 w-4 shrink-0 text-j-blak-3" aria-label={t('myConsultant.sharedInfo.notShared', 'Delas ej')} />
                          )}
                          <span>{item.label}</span>
                        </span>
                        <span className={cn('text-right font-semibold', item.status === 'attention' ? 'text-s-vantar' : 'text-j-blak')}>
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* G13 (2026-07-27): förklara ikonerna och gör transparensen handlingsbar. */}
      <div className="flex flex-col gap-1.5 text-[0.9375rem] text-j-blak-2 sm:flex-row sm:gap-5">
        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-j-gran-text" aria-hidden="true" />
          {t('myConsultant.legend.shared', 'Din konsulent kan se det här')}
        </span>
        <span className="flex items-center gap-1.5">
          <EyeOff className="h-4 w-4 text-j-blak-3" aria-hidden="true" />
          {t('myConsultant.legend.notShared', 'Bara du kan se det här')}
        </span>
      </div>

      {/* Rådgivarens hälsning (radgivarHalsningar.ts, myConsultant) pekar hit. */}
      <Link
        to="/settings?section=privacy"
        className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-j-gran-text no-underline hover:underline"
      >
        {t('myConsultant.legend.changeSharing', 'Ändra vad du delar')}
        <KvarterIkon namn="pil" size={18} />
      </Link>
    </div>
  )
}

/** Hur många meddelanden som syns innan "Visa äldre". */
const SENASTE = 4

// Messages Section
export function MessagesSection({
  messages,
  consultant,
  onSendMessage,
  loading,
  textRef,
}: {
  messages: Message[]
  consultant: ConsultantInfo | null
  onSendMessage: (content: string) => Promise<void>
  loading: boolean
  /** Omtaget: "Skriv" överst flyttar fokus hit. */
  textRef?: React.Ref<HTMLTextAreaElement>
}) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const [visaAlla, setVisaAlla] = useState(false)
  // RD1/RD26: fältet töms BARA när meddelandet gått fram. Ett fel visas med
  // "Din text är kvar" och Försök igen — tidigare tömdes fältet ändå, tyst.
  const skickning = useSkrivning((text: string) => onSendMessage(text))
  const sending = skickning.lage === 'skickar'
  const listRef = useRef<HTMLDivElement>(null)
  // RD23 (rollspelet 2026-09-27): "Tryck Enter för att skicka" på mobil, där
  // Enter på tangentbordet betyder ny rad. På pekskärm skickar bara knappen.
  const [pekskarm] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  )

  // Nyaste meddelandet syns: listan rullas inom sig själv, inte hela sidan.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, visaAlla])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    if (await skickning.kor(newMessage.trim())) setNewMessage('')
  }

  const handleForsokIgen = async () => {
    if (await skickning.forsokIgen()) setNewMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (pekskarm) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!consultant) {
    return null
  }

  const synliga = visaAlla ? messages : messages.slice(-SENASTE)
  const dolda = messages.length - synliga.length

  return (
    <section aria-labelledby="min-konsulent-meddelanden" className="rounded-j-m border border-j-linje bg-j-kort text-j-blak">
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h2 id="min-konsulent-meddelanden" className="m-0 flex items-center gap-2 font-rubrik text-lg font-bold">
          <KvarterIkon namn="meddelande" size={22} ton="gran" />
          {t('myConsultant.messages.title')}
        </h2>
        <p className="m-0 mt-0.5 text-[0.9375rem] text-j-blak-2">
          {t('myConsultant.messages.writeTo', { name: consultant.first_name })}
        </p>
      </div>

      {/* Messages list */}
      <div
        ref={listRef}
        className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-3 sm:px-6"
        role="log"
        aria-live="polite"
        aria-label={t('myConsultant.messages.history')}
      >
        {loading ? (
          <LoadingState />
        ) : messages.length === 0 ? (
          <p className="m-0 rounded-j-m bg-j-sankt px-4 py-3 text-[0.9375rem] text-j-blak-2">
            <span className="block font-semibold text-j-blak">{t('myConsultant.messages.noMessages')}</span>
            {t('myConsultant.messages.startConversation')}
          </p>
        ) : (
          <>
            {dolda > 0 && (
              <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => setVisaAlla(true)}>
                {t('myConsultant.messages.visaAldre', { count: dolda, defaultValue: 'Visa {{count}} äldre' })}
              </Button>
            )}
            {synliga.map(message => {
              const isOwn = message.sender_id === user?.id
              return (
                <div key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-j-m px-4 py-2.5',
                      isOwn
                        ? 'rounded-br-[4px] bg-j-gran text-j-pa-gran'
                        : 'rounded-bl-[4px] bg-j-sankt text-j-blak'
                    )}
                  >
                    <p className="m-0 whitespace-pre-wrap text-[0.9375rem] leading-[1.45]">{message.content}</p>
                    <p className={cn('m-0 mt-1 text-[0.8125rem]', isOwn ? 'text-j-pa-gran' : 'text-j-blak-3')}>
                      {new Date(message.created_at).toLocaleTimeString(datumSprak(i18n.language), {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-j-linje px-5 py-4 sm:px-6">
        <label htmlFor="message-input" className="sr-only">
          {t('myConsultant.messages.writeMessage')}
        </label>
        <textarea
          id="message-input"
          ref={textRef}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('myConsultant.messages.placeholder')}
          rows={2}
          className={cn(
            'w-full resize-none rounded-j-m border border-j-linje-2 bg-j-kort px-4 py-3',
            'text-base text-j-blak placeholder:text-j-blak-3',
            'focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--j-fokus)]'
          )}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {!pekskarm ? (
            <p className="m-0 text-[0.8125rem] text-j-blak-3">
              {t('myConsultant.messages.pressEnterToSend')}
            </p>
          ) : <span />}
          <Button
            ton="kvarter"
            variant="secondary"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            leftIcon={<Send className="h-5 w-5" aria-hidden="true" />}
          >
            {t('myConsultant.messages.sendMessage')}
          </Button>
        </div>
        {skickning.lage === 'fel' && (
          <SkrivFel className="mt-2" onForsokIgen={handleForsokIgen} forsoker={sending} />
        )}
      </div>
    </section>
  )
}

// Goals Section — innehållet i raden "Era mål"
export function GoalsSection({ goals }: { goals: Goal[] }) {
  const { t, i18n } = useTranslation()

  if (goals.length === 0) {
    return null
  }

  // RD15: "0 av 1 mål avklarade" stod i rubrikposition — ett prestationstal
  // (DESIGN.md §1). Varje mål har sin egen status, i ord och med ikon.
  // Statusfärgerna är reserverade för närvaro (omtaget), så målen har ingen.
  const statusConfig: Record<Goal['status'], { label: string; ikon: KvarterNamn }> = {
    NOT_STARTED: { label: t('myConsultant.goals.notStarted'), ikon: 'tid' },
    IN_PROGRESS: { label: t('myConsultant.goals.inProgress'), ikon: 'uppfoljning' },
    COMPLETED: { label: t('myConsultant.goals.completed'), ikon: 'klart' },
  }

  return (
    <div>
      <p className="m-0 mb-2 text-[0.9375rem] text-j-blak-2">{t('myConsultant.goals.agreedGoals')}</p>
      <ul className="m-0 list-none space-y-2 p-0">
        {goals.map(goal => {
          const config = statusConfig[goal.status] ?? statusConfig.NOT_STARTED
          return (
            <li key={goal.id} className="flex items-start gap-3 rounded-j-m bg-j-sankt px-4 py-3">
              <KvarterIkon namn={config.ikon} size={22} ton="gran" className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                {/* RD15: "Tre ansökninga…" — målet är det deltagaren ska kunna läsa, hela */}
                <p className="m-0 break-words font-semibold text-j-blak">
                  {goal.title}
                </p>
                <p className="m-0 text-[0.9375rem] text-j-blak-2">
                  {config.label}
                  {goal.deadline ? ` · ${t('myConsultant.goals.deadline')}: ${kortDatum(goal.deadline, i18n.language)}` : ''}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Main Page Component
export default function MyConsultant() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('myConsultant.title', 'Min konsulent')}
      icon={UserCheck}
      domain="wellbeing"
      guide={<FocusMyConsultantWizard onExit={leaveWizard} />}
    >
      <MyConsultantInner />
    </FokusVaxel>
  )
}

function MyConsultantInner() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null)
  const [nextMeeting, setNextMeeting] = useState<NextMeeting | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [sharedInfo, setSharedInfo] = useState<SharedInfo[]>([])
  /** UX12: skiljer "ingen konsulent tilldelad" från "hämtningen gick fel". */
  const [loadError, setLoadError] = useState(false)

  // Hämtningen körs om när användaren, konsulentkopplingen eller språket byts.
  // Förr bara på [user]: fetchConsultantData läser profile.consultant_id och
  // lägger ÖVERSATTA strängar i state (titel, delad info), så ett språkbyte
  // lämnade dem på det gamla språket och en ny koppling syntes inte förrän
  // sidan laddades om (react-hooks/exhaustive-deps, 2026-09-24).
  const userId = user?.id
  const consultantId = profile?.consultant_id
  const hamta = useEffectEvent(() => { void fetchConsultantData() })
  useEffect(() => {
    if (userId) hamta()
  }, [userId, consultantId, t])

  const fetchConsultantData = async () => {
    try {
      setLoading(true)
      setLoadError(false)

      // Get user's consultant_id from profile
      const consultantId = profile?.consultant_id

      if (!consultantId) {
        setLoading(false)
        return
      }

      // UX12: går via RPC, inte via profiles. Deltagaren har ingen SELECT-rätt
      // på sin konsulents rad — den här läsningen gav 406 PGRST116 och sidan
      // visade "Ingen konsulent tilldelad ännu" för alla 31 kopplade deltagare.
      const consultantData = await getMyConsultant()

      if (consultantData) {
        setConsultant({
          id: consultantData.id,
          // RPC:n ger nullable fält (profilen kan vara ofullständig). Vyn vill
          // ha strängar — tomt är bättre än "null" i gränssnittet.
          first_name: consultantData.first_name ?? '',
          last_name: consultantData.last_name ?? '',
          email: consultantData.email ?? '',
          phone: consultantData.phone ?? undefined,
          avatar_url: consultantData.avatar_url ?? undefined,
          title: t('myConsultant.consultant.yourConsultant'),
        })
      }

      // Fetch next meeting
      // 2026-09-22: .single() kräver EXAKT en rad — PostgREST svarar 406
      // PGRST116 för varje deltagare utan ett bokat kommande möte (samma
      // buggklass som redan slog ut get_my_consultant, se UX12-kommentaren
      // ovan). .maybeSingle() ger 0 eller 1 rad utan fel, och felet loggas nu
      // i stället för att svaljas tyst.
      const { data: meetingData, error: meetingError } = await supabase
        .from('consultant_meetings')
        .select('*')
        .eq('participant_id', user?.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (meetingError) {
        console.error('Could not fetch next meeting:', meetingError)
      }

      if (meetingData) {
        // Persona-fynd 2026-09-12 (agent F): kolumnen heter `meeting_type`, inte `type`,
        // och MeetingSchedulerDialog skriver 'physical' där den här sidan väntade
        // 'in_person'. `meetingTypeIcons[undefined]` gav React #130 för varje deltagare
        // med ett kommande möte — km-deltagare klarade sig bara för att hon saknade ett.
        const rad = meetingData as Record<string, unknown>
        const typRaw = (rad.meeting_type ?? rad.type) as string | undefined
        const typ: NextMeeting['type'] = typRaw === 'physical' || typRaw === 'in_person' ? 'in_person' : typRaw === 'phone' ? 'phone' : 'video'
        setNextMeeting({ ...(meetingData as NextMeeting), type: typ })
      }

      // Fetch messages
      setMessagesLoading(true)
      const { data: messagesData } = await supabase
        .from('consultant_messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .or(`sender_id.eq.${consultantId},receiver_id.eq.${consultantId}`)
        .order('created_at', { ascending: true })
        .limit(50)

      if (messagesData) {
        // Filter to only show messages between user and their consultant
        const relevantMessages = messagesData.filter(
          m =>
            (m.sender_id === user?.id && m.receiver_id === consultantId) ||
            (m.sender_id === consultantId && m.receiver_id === user?.id)
        )
        setMessages(relevantMessages)
      }
      setMessagesLoading(false)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('consultant_goals')
        .select('id, title, status, deadline')
        .eq('participant_id', user?.id)
        .order('created_at', { ascending: false })

      if (goalsData) {
        setGoals(goalsData)
      }

      // Build shared info based on user data
      await buildSharedInfo(consultantId)
    } catch (error) {
      console.error('Error fetching consultant data:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  /**
   * H4 + G13 (2026-07-27) — tre fel rättade i den här funktionen.
   *
   * 1. **`wellness_entries` finns inte i produktionsdatabasen.** Måendet
   *    hämtades från en fantomtabell → sektionen visade alltid "Inte loggat",
   *    oavsett hur mycket deltagaren hade loggat. Rätt tabell är `mood_logs`
   *    (`mood_level`, `energy_level`, `log_date`).
   * 2. **`job_applications` är utfasad** (E12) → "Skickade ansökningar" var
   *    alltid 0. Räkningen går nu via `applicationsApi.getStats()`, samma väg
   *    som Kanban-vyn. Samtidigt rättat: "Sparade jobb" räknade tidigare ALLA
   *    rader i `saved_jobs` — men den tabellen bär hela pipelinen, så
   *    ansökningar räknades som sparade jobb. Nu `stats.saved + interested`.
   * 3. **Ögonikonen ljög.** Varje post var hårdkodad `isShared: true`. Måendet
   *    delas i verkligheten bara om deltagaren har gett samtycke i
   *    `participant_data_sharing` (UX7). En transparenssida som påstår att
   *    konsulenten ser mer än hen gör är värre än ingen sida alls — det är
   *    hela G13:s poäng. Samtycket läses nu och styr ikonen.
   *
   * Fel sväljs inte tyst: misslyckas en hämtning visas "Kunde inte läsas"
   * i stället för ett nollvärde som ser ut som ett faktum.
   */
  const buildSharedInfo = async (consultantId: string) => {
    const UNKNOWN = t('myConsultant.sharedInfo.couldNotRead', 'Kunde inte läsas')

    // CV — maybeSingle: .single() gav PGRST116 när användaren saknar CV
    const { data: cvData } = await supabase
      .from('cvs')
      .select('ats_score, updated_at')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Ansökningar + sparade jobb via samma API som Kanban-vyn
    let savedCount: number | null = null
    let sentCount: number | null = null
    try {
      const stats = await applicationsApi.getStats()
      savedCount = (stats.saved || 0) + (stats.interested || 0)
      // "Skickad" = allt som passerat sparad/intresserad
      sentCount = Math.max(0, (stats.total || 0) - savedCount)
    } catch (err) {
      console.error('MyConsultant: kunde inte läsa ansökningsstatistik', err)
    }

    // Mående — senaste loggen ur mood_logs
    const { data: moodData, error: moodError } = await supabase
      .from('mood_logs')
      .select('mood_level, energy_level, log_date')
      .eq('user_id', user?.id)
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (moodError) {
      console.error('MyConsultant: kunde inte läsa mående', moodError)
    }

    // G13 — delas måendet faktiskt med den här konsulenten?
    let wellnessIsShared = false
    const { data: sharing, error: sharingError } = await supabase
      .from('participant_data_sharing')
      .select('share_health_data, share_wellness_data')
      .eq('participant_id', user?.id)
      .eq('consultant_id', consultantId)
      .maybeSingle()

    if (sharingError) {
      console.error('MyConsultant: kunde inte läsa delningssamtycke', sharingError)
    } else {
      wellnessIsShared = !!(sharing?.share_wellness_data || sharing?.share_health_data)
    }

    // RD6: 'en-US' gav 9/27/2026. kortDatum skriver ut månaden på engelska.
    const sprak = i18n.language

    const info: SharedInfo[] = [
      {
        category: 'progress',
        items: [
          {
            // 2026-09-22: `profile.last_login` finns varken i typen eller i
            // prod-schemat (profiles har ingen inloggningskolumn) — fältet var
            // alltid `undefined` och visade därför "Idag" för ALLA deltagare
            // oavsett verklig aktivitet. `user.last_sign_in_at` kommer från
            // Supabase Auth och är den faktiska källan.
            label: t('myConsultant.sharedInfo.lastLogin'),
            value: user?.last_sign_in_at
              ? kortDatum(user.last_sign_in_at, sprak)
              : UNKNOWN,
            status: user?.last_sign_in_at ? 'good' : 'neutral',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.savedJobs'),
            value: savedCount === null ? UNKNOWN : t('myConsultant.sharedInfo.countUnit', { count: savedCount }),
            status: savedCount === null ? 'neutral' : savedCount > 0 ? 'good' : 'neutral',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.sentApplications'),
            value: sentCount === null ? UNKNOWN : t('myConsultant.sharedInfo.countUnit', { count: sentCount }),
            status: sentCount === null ? 'neutral' : sentCount > 0 ? 'good' : 'neutral',
            isShared: true,
          },
        ],
      },
      {
        category: 'cv',
        items: [
          {
            label: t('myConsultant.sharedInfo.cvStatus'),
            value: cvData ? t('myConsultant.sharedInfo.created') : t('myConsultant.sharedInfo.notCreated'),
            status: cvData ? 'good' : 'attention',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.atsScore'),
            value: cvData?.ats_score ? `${cvData.ats_score}%` : t('myConsultant.sharedInfo.notCalculated'),
            status: cvData?.ats_score && cvData.ats_score >= 70 ? 'good' : cvData?.ats_score ? 'attention' : 'neutral',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.lastUpdated'),
            value: cvData?.updated_at
              ? kortDatum(cvData.updated_at, sprak)
              : '-',
            status: 'neutral',
            isShared: true,
          },
        ],
      },
      {
        category: 'wellbeing',
        items: [
          {
            label: t('myConsultant.sharedInfo.energyLevel'),
            value: moodData?.energy_level
              ? `${moodData.energy_level}/5`
              : t('myConsultant.sharedInfo.notLogged'),
            status: moodData?.energy_level && moodData.energy_level >= 3 ? 'good' : moodData?.energy_level ? 'attention' : 'neutral',
            // G13: ikonen speglar det faktiska samtycket, inte en förhoppning
            isShared: wellnessIsShared,
          },
          {
            label: t('myConsultant.sharedInfo.latestMood'),
            value: moodData?.mood_level
              ? `${moodData.mood_level}/5`
              : t('myConsultant.sharedInfo.notLogged'),
            status: 'neutral',
            isShared: wellnessIsShared,
          },
          {
            label: t('myConsultant.sharedInfo.lastLogged'),
            value: moodData?.log_date
              ? kortDatum(moodData.log_date, sprak)
              : t('myConsultant.sharedInfo.notLogged'),
            status: 'neutral',
            isShared: wellnessIsShared,
          },
        ],
      },
    ]

    setSharedInfo(info)
  }

  const handleSendMessage = async (content: string) => {
    if (!consultant || !user) throw new Error('Ingen konsulent att skicka till')
    // F8 (2026-09-13): EN sändväg — samma API som "Fråga om passet" i Min vecka
    // (konsulentMeddelandeApi), i stället för ett eget insert här. Fel sväljs
    // inte längre tyst.
    // RD1/RD26: felet kastas vidare till MessagesSection, som behåller texten
    // och visar <SkrivFel>. Här svaldes det tidigare med en console.warn.
    const skickat = await konsulentMeddelandeApi.skickaTillMinKonsulent(content)
    setMessages(prev => [...prev, { ...skickat, sender_id: user.id, is_read: false } as unknown as (typeof prev)[number]])
  }

  const handleBookMeeting = () => {
    // For now, open email with meeting request
    if (consultant) {
      const subject = encodeURIComponent(t('myConsultant.email.bookingSubject'))
      const body = encodeURIComponent(t('myConsultant.email.bookingBody', { name: consultant.first_name }))
      window.location.href = `mailto:${consultant.email}?subject=${subject}&body=${body}`
    }
  }

  const handleConsultantRevoked = () => {
    // Uppsägning lyckades — rensa lokal state och uppdatera profilen i store
    // så att resten av appen direkt ser att kopplingen försvunnit.
    setConsultant(null)
    setNextMeeting(null)
    setMessages([])
    setGoals([])
    setSharedInfo([])
    useAuthStore.setState((state) => ({
      profile: state.profile ? { ...state.profile, consultant_id: null } : null,
    }))
  }

  const skrivRef = useRef<HTMLTextAreaElement>(null)
  const handleSkriv = () => {
    const ruta = skrivRef.current
    if (!ruta) return
    ruta.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ruta.focus({ preventScroll: true })
  }

  if (loading) {
    return (
      <PageLayout
        title={t('myConsultant.title')}
        domain="wellbeing"
        showTabs={false}
        className="sidbredd"
      >
        <LoadingState fullHeight />
      </PageLayout>
    )
  }

  const fornamn = consultant?.first_name?.trim() || null

  return (
    <PageLayout
      title={t('myConsultant.title')}
      subtitle={consultant
        ? t('myConsultant.subtitle', { name: consultant.first_name })
        : t('myConsultant.subtitleNoConsultant')}
      domain="wellbeing"
      showTabs={false}
      className="sidbredd"
    >

      {/* UX12: "ingen konsulent" och "vi kunde inte hämta" är två olika
          besked. Att visa det första när det andra är sant är precis vad som
          dolde den saknade RLS-policyn — sidan såg lugn och korrekt ut. */}
      {!consultant && loadError && (
        <section className="max-w-2xl rounded-j-m border border-j-linje bg-j-kort p-6 text-center text-j-blak sm:p-8">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-s-vantar-bg">
            <KvarterIkon namn="varning" size={30} ton="vantar" />
          </span>
          <h2 className="m-0 mb-2 font-rubrik text-xl font-bold">
            {t('myConsultant.loadErrorTitle', 'Vi kunde inte hämta din konsulent just nu')}
          </h2>
          <p className="mx-auto m-0 max-w-md text-j-blak-2">
            {t('myConsultant.loadErrorDesc', 'Det är ett tillfälligt fel hos oss — inte något du har gjort. Ladda om sidan om en stund.')}
          </p>
        </section>
      )}

      {/* BL1 (2026-09-08): ingen konsulent = ett tomtillstånd med EN väg vidare.
          CTA:n är en riktig <a href="mailto:"> (WCAG — inte en knapp som byter
          window.location), och adressen är den Terms.tsx redan anger. */}
      {!consultant && !loadError && (
        <section className="max-w-2xl rounded-j-m border border-j-linje bg-j-kort p-4 sm:p-8">
          <EmptyState
            icon={UserCheck}
            title={t('myConsultant.noConsultant')}
            description={t('myConsultant.noConsultantFullDesc')}
            className="pb-0"
          />
          <div className="flex justify-center mt-6 pb-4">
            <a
              href={`mailto:support@jobin.se?subject=${encodeURIComponent(t('myConsultant.noConsultantMailSubject'))}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-j-m bg-j-gran px-5 font-semibold text-j-pa-gran no-underline hover:brightness-110 focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]"
            >
              <KvarterIkon namn="meddelande" size={20} />
              {t('myConsultant.noConsultantCta')}
            </a>
          </div>
        </section>
      )}

      {/* AG5/AG8 (2026-09-13): konsulentens förslag att dela uppgifter med ett
          företag. Notisen "foretag_forslag" länkar hit, så frågan ska ligga högst
          upp — före meddelandelistan. Renderas oavsett koppling. Utan förslag
          renderar komponenten null, så marginalen bor på komponenten. */}
      <Delningsforslag className="mb-6" />

      {/* Omtaget steg 6: nio skärmhöjder blir en. Vem, hur du når hen, nästa
          möte och meddelandena står öppet; resten är en rad var. */}
      {consultant && (
        <div className="max-w-2xl space-y-6">
          <KonsulentHuvud
            consultant={consultant}
            nextMeeting={nextMeeting}
            onSkriv={handleSkriv}
            onBoka={handleBookMeeting}
          />

          <MessagesSection
            messages={messages}
            consultant={consultant}
            onSendMessage={handleSendMessage}
            loading={messagesLoading}
            textRef={skrivRef}
          />

          <MerLista
            rubrik={fornamn
              ? t('myConsultant.mer.rubrik', { defaultValue: 'Mer om dig och {{namn}}', namn: fornamn })
              : t('myConsultant.mer.rubrikUtanNamn', 'Mer om dig och din konsulent')}
            rubrikId="min-konsulent-mer"
          >
            {goals.length > 0 && (
              <MerRad
                ikon="plan"
                rubrik={t('myConsultant.mer.mal', 'Era mål')}
                text={t('myConsultant.mer.malText', { count: goals.length, defaultValue: '{{count}} mål som ni har kommit överens om' })}
              >
                <GoalsSection goals={goals} />
              </MerRad>
            )}
            <MerRad
              ikon="deltagare"
              rubrik={fornamn
                ? t('myConsultant.mer.serNamn', { defaultValue: 'Det här ser {{namn}}', namn: fornamn })
                : t('myConsultant.sharedInfoTitle', 'Det här ser din konsulent')}
              text={t('myConsultant.mer.serText', 'Vad du delar, och hur du ändrar det.')}
            >
              <SharedInformationSection sharedInfo={sharedInfo} />
            </MerRad>
            <MerRad
              ikon="tid"
              rubrik={t('myConsultant.laslogg.title', 'Vem har öppnat dina uppgifter')}
              text={t('myConsultant.mer.lasloggText', 'Varje gång din konsulent öppnar din sida.')}
            >
              <VemHarOppnatKort />
            </MerRad>
            <MerRad
              ikon="franvaro"
              rubrik={t('myConsultant.revoke.title', 'Säg upp kopplingen')}
              text={t('myConsultant.mer.revokeText', 'Om du inte vill ha kvar kopplingen till din konsulent.')}
            >
              <RevokeConsultantLinkSection
                consultantId={consultant.id}
                consultantName={`${consultant.first_name} ${consultant.last_name}`.trim()}
                onRevoked={handleConsultantRevoked}
              />
            </MerRad>
          </MerLista>
        </div>
      )}
    </PageLayout>
  )
}
