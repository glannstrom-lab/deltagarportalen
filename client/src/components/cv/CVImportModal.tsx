/**
 * "Importera CV" — läser ett befintligt CV (PDF eller .docx) och fyller
 * CV-byggarens fält med innehållet.
 *
 * Ligger på **Skapa CV**, inte på Dina sparade CV. Skillnaden är avsiktlig:
 * här görs filen om till redigerbara fält, medan `CVFileUploadModal` på
 * Dina sparade CV lägger undan filen precis som den är. Den som redan har ett
 * färdigt CV ska inte tvingas genom byggaren bara för att få in det i portalen.
 *
 * Fyra saker som är avsiktliga, inte tillfälligheter:
 *
 * 1. **Filen lämnar aldrig enheten.** Utläsningen sker lokalt (se
 *    `services/cvFileImport.ts`). Bara den utlästa texten går till /api/ai,
 *    och den passerar PII-saneringen där personnummer stryks helt.
 * 2. **AI:n formaterar, den skriver inte.** Prompterna i `client/api/ai.js`
 *    förbjuder omskrivningar och påhitt, och servervalidatorn fäller ett svar
 *    utan läsbara fält hellre än att fylla byggaren med tomhet.
 * 3. **Två anrop, parallellt.** Uppmätt mot prod 2026-08-19: modellen ger
 *    ~9 tokens/s och Vercel-funktionen dör vid 60 s. Ett odelat anrop som
 *    skulle återge ett helt CV krävde 800–1200 tokens och gav 504 för varje
 *    CV av normal längd. Slår du ihop dem igen är timeouten tillbaka.
 * 4. **Halvt resultat är bättre än inget.** Går erfarenhetsdelen fel men
 *    rubrikdelen igenom får personen det som kom fram, med besked om vad som
 *    saknas — i stället för ett tomt felmeddelande efter en minuts väntan.
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, Loader2, X, Check, AlertCircle, Sparkles, RefreshCw
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import {
  lasTextUrCvFil, CvImportError, ACCEPTERADE_FILTYPER,
  type ImportFel
} from '@/services/cvFileImport'
import type { CVData, Language, Skill } from '@/services/supabaseApi'

interface CVImportModalProps {
  isOpen: boolean
  onClose: () => void
  /** Tar emot de fält som lästes ur filen. Byggaren avgör hur de vävs in. */
  onImported: (fält: Partial<CVData>) => void
}

/** Del 1 av AI-svaret: rubrik, profiltext, kompetenser, språk, certifikat. */
interface ImporteradRubrik {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  skills?: string[]
  languages?: Array<{ language?: string; level?: string }>
  certificates?: Array<{ name?: string; issuer?: string; date?: string }>
}

/** Del 2 av AI-svaret: erfarenhet och utbildning. Utan beskrivningar. */
interface ImporteradErfarenhet {
  workExperience?: Array<{
    title?: string; company?: string; location?: string
    startDate?: string; endDate?: string; current?: boolean
  }>
  education?: Array<{
    school?: string; degree?: string; field?: string
    startDate?: string; endDate?: string
  }>
}

type Steg = 'val' | 'laser' | 'strukturerar' | 'granska' | 'fel'

/** Felkoder utöver filläsningens egna. */
type UtokatFel = ImportFel | 'ai' | 'ai-avstangd'

/**
 * Språknivåerna i `Language['level']` är deklarerade som svenska ord, men
 * CV-byggarens select och mallarna använder 'basic' | 'good' | 'fluent' |
 * 'native' (se LANGUAGE_LEVELS i CVBuilder.tsx). Vi följer det som faktiskt
 * renderas. Säger texten inget vi känner igen blir nivån 'basic' — det är
 * det lägsta påståendet, och personen höjer det själv i byggaren.
 */
function tolkaSprakniva(ratext: string | undefined): string {
  const text = (ratext || '').toLowerCase()
  if (/modersmål|native|first language/.test(text)) return 'native'
  if (/flytande|fluent|c1|c2|avancerad|advanced/.test(text)) return 'fluent'
  if (/god|bra|good|b1|b2|mellan|intermediate/.test(text)) return 'good'
  return 'basic'
}

let raknare = 0
const nyttId = () => `imp-${Date.now()}-${raknare++}`

/**
 * Serverns PII-strykning (`stripPii` i client/api/ai.js) ersätter e-post,
 * telefon, personnummer och kontonummer med platshållare INNAN texten når
 * modellen. Modellen kan alltså svara med `[BORTTAGET-EPOST]` som e-postadress
 * — och utan den här vakten hade den strängen hamnat i deltagarens CV och
 * följt med ut till en arbetsgivare.
 *
 * Uppmätt mot prod 2026-08-19: exakt det hände. Fältet ska vara tomt i stället,
 * så att personen ser att det är hennes tur att fylla i.
 */
const ÄR_PLATSHÅLLARE = /^\s*\[BORTTAGET-[A-ZÅÄÖ]+\]\s*$/
const utanPlatshallare = (v: string | undefined): string => {
  const t = (v || '').trim()
  if (!t || ÄR_PLATSHÅLLARE.test(t)) return ''
  // Även inbäddad platshållare i en längre sträng ska bort — en profiltext som
  // innehåller "kontakta mig på [BORTTAGET-EPOST]" ska inte visa det.
  return t.replace(/\[BORTTAGET-[A-ZÅÄÖ]+\]/g, '').replace(/\s{2,}/g, ' ').trim()
}

/** Gör AI-svaren till CVData-fält. Ingenting fylls i som inte kom med. */
function tillCvFalt(rubrik: ImporteradRubrik | null, erfarenhet: ImporteradErfarenhet | null): Partial<CVData> {
  const ut: Partial<CVData> = {}

  if (rubrik) {
    const rent = {
      firstName: utanPlatshallare(rubrik.firstName),
      lastName: utanPlatshallare(rubrik.lastName),
      title: utanPlatshallare(rubrik.title),
      email: utanPlatshallare(rubrik.email),
      phone: utanPlatshallare(rubrik.phone),
      location: utanPlatshallare(rubrik.location),
      summary: utanPlatshallare(rubrik.summary),
    }
    if (rent.firstName) ut.firstName = rent.firstName
    if (rent.lastName) ut.lastName = rent.lastName
    if (rent.title) ut.title = rent.title
    if (rent.email) ut.email = rent.email
    if (rent.phone) ut.phone = rent.phone
    if (rent.location) ut.location = rent.location
    if (rent.summary) ut.summary = rent.summary
    if (rubrik.skills?.length) {
      ut.skills = rubrik.skills.map((namn) => ({
        id: nyttId(),
        name: namn,
        // 3 av 5 är byggarens eget standardvärde för en ny kompetens — vi
        // påstår alltså inget utöver vad verktyget självt gör.
        level: 3,
        category: 'other',
      })) as Skill[]
    }
    if (rubrik.languages?.length) {
      ut.languages = rubrik.languages.map((s) => ({
        id: nyttId(),
        language: s.language || '',
        level: tolkaSprakniva(s.level),
      })) as unknown as Language[]
    }
    if (rubrik.certificates?.length) {
      ut.certificates = rubrik.certificates.map((c) => ({
        id: nyttId(),
        name: c.name || '',
        issuer: c.issuer || '',
        date: c.date || '',
      }))
    }
  }

  if (erfarenhet?.workExperience?.length) {
    ut.workExperience = erfarenhet.workExperience.map((w) => ({
      id: nyttId(),
      title: w.title || '',
      company: w.company || '',
      location: w.location || '',
      startDate: w.startDate || '',
      endDate: w.endDate || '',
      current: w.current === true,
      // Beskrivningen följer med flit inte med — se prompten i ai.js.
      description: '',
    }))
  }
  if (erfarenhet?.education?.length) {
    ut.education = erfarenhet.education.map((e) => ({
      id: nyttId(),
      school: e.school || '',
      degree: e.degree || '',
      field: e.field || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
    }))
  }

  return ut
}

export function CVImportModal({ isOpen, onClose, onImported }: CVImportModalProps) {
  const { t } = useTranslation()
  const [steg, setSteg] = useState<Steg>('val')
  const [felkod, setFelkod] = useState<UtokatFel | null>(null)
  const [filnamn, setFilnamn] = useState('')
  const [resultat, setResultat] = useState<Partial<CVData> | null>(null)
  const [erfarenhetSaknas, setErfarenhetSaknas] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const stang = useCallback(() => {
    setSteg('val'); setFelkod(null); setFilnamn(''); setResultat(null); setErfarenhetSaknas(false)
    onClose()
  }, [onClose])

  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: stang,
    restoreFocus: true,
    autoFocus: true,
  })

  const hanteraFil = async (file: File) => {
    setFilnamn(file.name)
    setFelkod(null)
    setErfarenhetSaknas(false)
    setSteg('laser')

    let text: string
    try {
      text = await lasTextUrCvFil(file)
    } catch (e) {
      setFelkod(e instanceof CvImportError ? e.kod : 'kunde-inte-lasa')
      setSteg('fel')
      return
    }

    setSteg('strukturerar')

    // Parallellt, inte i följd: två svar på 20–35 s vardera ryms i
    // funktionens 60 s när de körs samtidigt, men inte efter varandra.
    const [rubrikSvar, erfarenhetSvar] = await Promise.allSettled([
      callAI<ImporteradRubrik>('cv-import', { cvText: text }),
      callAI<ImporteradErfarenhet>('cv-import-erfarenhet', { cvText: text }),
    ])

    const rubrik = rubrikSvar.status === 'fulfilled'
      ? (rubrikSvar.value as { cv?: ImporteradRubrik }).cv ?? null
      : null
    const erfarenhet = erfarenhetSvar.status === 'fulfilled'
      ? (erfarenhetSvar.value as { cv?: ImporteradErfarenhet }).cv ?? null
      : null

    if (!rubrik && !erfarenhet) {
      const fel = rubrikSvar.status === 'rejected' ? rubrikSvar.reason : undefined
      console.error('CV-import misslyckades:', fel)
      // Har personen stängt av AI-behandling (GDPR art. 21-brytaren) är det
      // inte ett tillfälligt fel utan ett val hen gjort — "försök igen om en
      // stund" hade varit ett råd som aldrig kan funka.
      setFelkod(fel instanceof AiConsentRequiredError ? 'ai-avstangd' : 'ai')
      setSteg('fel')
      return
    }

    if (erfarenhetSvar.status === 'rejected') {
      console.error('Erfarenhetsdelen av importen misslyckades:', erfarenhetSvar.reason)
      setErfarenhetSaknas(true)
    }

    setResultat(tillCvFalt(rubrik, erfarenhet))
    setSteg('granska')
  }

  const anvand = () => {
    if (!resultat) return
    onImported(resultat)
    stang()
  }

  if (!isOpen) return null

  const felmeddelanden: Record<UtokatFel, string> = {
    'for-stor': t('cv.upload.errors.tooLarge', 'Filen är större än 10 MB. Spara om den i mindre storlek och försök igen.'),
    'okant-format': t('cv.upload.errors.format', 'Vi kan läsa PDF och Word (.docx). Spara om filen i något av de formaten.'),
    'gammalt-word': t('cv.upload.errors.oldWord', 'Formatet .doc är för gammalt. Öppna filen i Word och välj "Spara som" och sedan .docx eller PDF.'),
    'tom-text': t('cv.upload.errors.noText', 'Vi hittade nästan ingen text i filen. Är den inskannad som bild? Då behöver du fylla i CV:t för hand.'),
    'kunde-inte-lasa': t('cv.upload.errors.unreadable', 'Filen gick inte att öppna. Kontrollera att den inte är lösenordsskyddad.'),
    ai: t('cv.upload.errors.ai', 'Vi kunde läsa filen men inte sortera innehållet just nu. Försök igen om en stund.'),
    'ai-avstangd': t('cv.upload.errors.aiOff', 'Vi läste filen, men du har stängt av AI-behandling av dina uppgifter. Slå på den i Inställningar om du vill att vi sorterar innehållet åt dig — annars kan du fylla i CV:t för hand.'),
  }

  const antal = resultat
    ? {
        erfarenheter: resultat.workExperience?.length || 0,
        utbildningar: resultat.education?.length || 0,
        kompetenser: resultat.skills?.length || 0,
        sprak: resultat.languages?.length || 0,
      }
    : null

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-import-rubrik"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Rubrikrad */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="cv-import-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">
                {t('cv.import.title', 'Importera ett CV du redan har')}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
                {filnamn || t('cv.import.subtitle', 'Vi fyller i fälten åt dig — PDF eller Word (.docx)')}
              </p>
            </div>
          </div>
          <button
            onClick={stang}
            className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            aria-label={t('common.close', 'Stäng')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Steg 1: välj fil */}
          {steg === 'val' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) void hanteraFil(file)
                }}
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                  dragOver
                    ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                    : 'border-stone-300 dark:border-stone-600'
                )}
              >
                <FileText className="w-10 h-10 mx-auto text-stone-400 mb-3" aria-hidden="true" />
                <p className="text-stone-700 dark:text-stone-300 mb-1">
                  {t('cv.import.dropHere', 'Dra hit ditt CV, eller välj det från datorn.')}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                  {t('cv.upload.formats', 'PDF eller Word (.docx), max 10 MB.')}
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110 transition"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {t('cv.upload.choose', 'Välj fil')}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTERADE_FILTYPER}
                  className="sr-only"
                  aria-label={t('cv.upload.choose', 'Välj fil')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void hanteraFil(file)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Vad som händer med filen. Står här, före valet, inte efteråt. */}
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  {t('cv.upload.privacyTitle', 'Så här hanteras filen')}
                </h3>
                <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1.5">
                  <li>{t('cv.upload.privacy1', 'Filen läses i din webbläsare och laddas aldrig upp någonstans.')}</li>
                  <li>{t('cv.upload.privacy2', 'Texten skickas till AI:n som sorterar den i rätt fält. Personnummer tas bort automatiskt först.')}</li>
                  <li>{t('cv.upload.privacy3', 'AI:n får inte skriva om eller lägga till något — bara flytta det som står i filen.')}</li>
                  <li>{t('cv.import.privacyDescriptions', 'Dina egna beskrivningar av tjänsterna följer inte med — dem skriver du in själv, så att de blir precis som du vill ha dem.')}</li>
                  <li>{t('cv.import.privacyContact', 'E-post och telefonnummer stryks innan texten skickas, så de fylls inte i automatiskt. Det är din integritet det handlar om — skriv in dem själv i byggaren.')}</li>
                  <li>{t('cv.upload.privacy4', 'Du ser resultatet och godkänner det innan något sparas.')}</li>
                </ul>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400">
                {t('cv.import.orKeepFile', 'Vill du hellre spara filen som den är, utan att göra om den till fält?')}{' '}
                <Link to="/cv/my-cvs" onClick={stang} className="text-[var(--c-text)] font-medium hover:underline">
                  {t('cv.import.orKeepFileLink', 'Ladda upp den under Dina sparade CV')}
                </Link>
              </p>
            </div>
          )}

          {/* Steg 2 och 3: arbete pågår */}
          {(steg === 'laser' || steg === 'strukturerar') && (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <Loader2 className="w-10 h-10 mx-auto text-[var(--c-solid)] animate-spin mb-4" aria-hidden="true" />
              <p className="text-stone-800 dark:text-stone-200 font-medium">
                {steg === 'laser'
                  ? t('cv.upload.reading', 'Läser filen i din webbläsare…')
                  : t('cv.upload.structuring', 'Sorterar innehållet i rätt fält…')}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                {t('cv.import.wait', 'Det tar ungefär en halv minut. Stäng inte fönstret.')}
              </p>
            </div>
          )}

          {/* Fel */}
          {steg === 'fel' && felkod && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className="text-stone-800 dark:text-stone-200 mb-6 max-w-md mx-auto">
                {felmeddelanden[felkod]}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {felkod === 'ai-avstangd' ? (
                  <>
                    <Link
                      to="/profile?tab=installningar"
                      onClick={stang}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110"
                    >
                      {t('cv.upload.openSettings', 'Öppna Inställningar')}
                    </Link>
                    <Link
                      to="/cv/my-cvs"
                      onClick={stang}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      {t('cv.import.saveFileInstead', 'Spara filen som den är i stället')}
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setSteg('val'); setFelkod(null); setFilnamn('') }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      {t('cv.upload.tryAgain', 'Försök med en annan fil')}
                    </button>
                    <Link
                      to="/cv/my-cvs"
                      onClick={stang}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      {t('cv.import.saveFileInstead', 'Spara filen som den är i stället')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Granska innan fälten fylls i */}
          {steg === 'granska' && resultat && antal && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl bg-[var(--c-bg)] border border-[var(--c-solid)]/30 p-4">
                <Sparkles className="w-5 h-5 text-[var(--c-text)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[var(--c-text)]">
                  {t('cv.import.reviewHint', 'Sorterat med AI-stöd ur din fil. Läs igenom att det stämmer — allt går att ändra i byggaren efteråt.')}
                </p>
              </div>

              {erfarenhetSaknas && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4">
                  <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {t('cv.import.experienceFailed', 'Vi fick med dina uppgifter och kompetenser, men inte arbetslivserfarenheten den här gången. Du kan lägga till tjänsterna för hand, eller stänga och försöka igen.')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { v: antal.erfarenheter, l: t('cv.upload.counts.experience', 'erfarenheter') },
                  { v: antal.utbildningar, l: t('cv.upload.counts.education', 'utbildningar') },
                  { v: antal.kompetenser, l: t('cv.upload.counts.skills', 'kompetenser') },
                  { v: antal.sprak, l: t('cv.upload.counts.languages', 'språk') },
                ].map((kort) => (
                  <div key={kort.l} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 text-center">
                    <div className="text-xl font-semibold text-stone-900 dark:text-stone-100">{kort.v}</div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">{kort.l}</div>
                  </div>
                ))}
              </div>

              <dl className="rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-200 dark:divide-stone-700 text-sm">
                {[
                  { k: t('cv.upload.fields.name', 'Namn'), v: [resultat.firstName, resultat.lastName].filter(Boolean).join(' ') },
                  { k: t('cv.upload.fields.title', 'Yrkestitel'), v: resultat.title || '' },
                  { k: t('cv.upload.fields.contact', 'Kontakt'), v: [resultat.email, resultat.phone, resultat.location].filter(Boolean).join(' · ') },
                ].map((rad) => (
                  <div key={rad.k} className="flex gap-4 px-4 py-2.5">
                    <dt className="w-28 flex-shrink-0 text-stone-600 dark:text-stone-400">{rad.k}</dt>
                    <dd className="min-w-0 text-stone-900 dark:text-stone-100 break-words">
                      {rad.v || (
                        // Tomt fält är tomt — inte ett streck som ser ut som ett värde.
                        <span className="text-stone-600 dark:text-stone-400 italic">
                          {t('cv.upload.notFound', 'hittades inte i filen')}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {resultat.workExperience && resultat.workExperience.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                    {t('cv.upload.fields.experience', 'Erfarenheter vi hittade')}
                  </h3>
                  <ul className="space-y-1.5">
                    {resultat.workExperience.map((w) => (
                      <li key={w.id} className="text-sm text-stone-700 dark:text-stone-300 flex gap-2">
                        <Check className="w-4 h-4 text-[var(--c-solid)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                          {w.title || t('cv.upload.noTitle', 'Titel saknas')}
                          {w.company ? ` — ${w.company}` : ''}
                          {w.startDate ? ` (${w.startDate}${w.endDate ? `–${w.endDate}` : ''})` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    {t('cv.import.noDescriptions', 'Beskrivningarna av vad du gjorde följer inte med — dem skriver du in själv i byggaren.')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fotrad — bara när det finns något att göra */}
        {steg === 'granska' && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={() => { setSteg('val'); setResultat(null); setFilnamn('') }}
              className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              {t('cv.upload.chooseOther', 'Välj en annan fil')}
            </button>
            <button
              onClick={anvand}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              {t('cv.import.use', 'Fyll i mitt CV med det här')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CVImportModal
