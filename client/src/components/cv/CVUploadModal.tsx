/**
 * "Ladda upp ditt CV" — tar emot en PDF eller ett .docx, läser ut texten i
 * WEBBLÄSAREN, låter AI:n sortera innehållet i CV-byggarens fält och sparar
 * resultatet som ett CV i "Dina CV" (`cv_versions`).
 *
 * Tre saker som är avsiktliga, inte tillfälligheter:
 *
 * 1. **Filen lämnar aldrig enheten.** Utläsningen sker lokalt (se
 *    `services/cvFileImport.ts`). Bara den utlästa texten går till /api/ai,
 *    och den passerar PII-saneringen där personnummer stryks helt.
 * 2. **AI:n formaterar, den skriver inte.** Prompten `cv-import` i
 *    `client/api/ai.js` förbjuder uttryckligen omskrivningar och påhitt, och
 *    serverns validator fäller ett svar utan läsbara fält i stället för att
 *    spara ett tomt CV som ser lyckat ut.
 * 3. **Inget sparas förrän personen sett vad vi hittade.** Granskningssteget
 *    visar antal och innehåll innan spara-knappen finns.
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Upload, FileText, Loader2, X, Check, AlertCircle, Sparkles, RefreshCw
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cvApi } from '@/services/cvApi'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { showToast } from '@/components/Toast'
import {
  lasTextUrCvFil, CvImportError, ACCEPTERADE_FILTYPER,
  type ImportFel
} from '@/services/cvFileImport'
import type { CVData, Language, Skill } from '@/services/supabaseApi'

interface CVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  /** Anropas när ett CV sparats, så listan kan laddas om. */
  onSaved: () => void
}

/** Formen AI:n svarar med — samma fält som prompten i client/api/ai.js listar. */
interface ImporteratCv {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  workExperience?: Array<{
    title?: string; company?: string; location?: string
    startDate?: string; endDate?: string; current?: boolean; description?: string
  }>
  education?: Array<{
    school?: string; degree?: string; field?: string
    startDate?: string; endDate?: string
  }>
  skills?: string[]
  languages?: Array<{ language?: string; level?: string }>
  certificates?: Array<{ name?: string; issuer?: string; date?: string }>
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

/** Gör AI-svaret till CVData. Ingenting fylls i som inte kom med i svaret. */
function tillCvData(importerat: ImporteratCv): CVData {
  return {
    firstName: importerat.firstName || '',
    lastName: importerat.lastName || '',
    title: importerat.title || '',
    email: importerat.email || '',
    phone: importerat.phone || '',
    location: importerat.location || '',
    summary: importerat.summary || '',
    workExperience: (importerat.workExperience || []).map((w) => ({
      id: nyttId(),
      title: w.title || '',
      company: w.company || '',
      location: w.location || '',
      startDate: w.startDate || '',
      endDate: w.endDate || '',
      current: w.current === true,
      description: w.description || '',
    })),
    education: (importerat.education || []).map((e) => ({
      id: nyttId(),
      school: e.school || '',
      degree: e.degree || '',
      field: e.field || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
    })),
    skills: (importerat.skills || []).map((namn) => ({
      id: nyttId(),
      name: namn,
      // Nivån står sällan i ett CV. 3 av 5 är byggarens eget standardvärde för
      // en nyskapad kompetens — vi påstår alltså inget utöver det verktyget
      // självt gör, och personen justerar i byggaren.
      level: 3,
      category: 'other',
    })) as Skill[],
    languages: (importerat.languages || []).map((s) => ({
      id: nyttId(),
      language: s.language || '',
      level: tolkaSprakniva(s.level),
    })) as unknown as Language[],
    certificates: (importerat.certificates || []).map((c) => ({
      id: nyttId(),
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || '',
    })),
    links: [],
    references: [],
    template: 'sidebar',
  }
}

export function CVUploadModal({ isOpen, onClose, onSaved }: CVUploadModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [steg, setSteg] = useState<Steg>('val')
  const [felkod, setFelkod] = useState<UtokatFel | null>(null)
  const [filnamn, setFilnamn] = useState('')
  const [resultat, setResultat] = useState<CVData | null>(null)
  const [namn, setNamn] = useState('')
  const [sparar, setSparar] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const stang = useCallback(() => {
    if (sparar) return
    setSteg('val'); setFelkod(null); setFilnamn(''); setResultat(null); setNamn('')
    onClose()
  }, [onClose, sparar])

  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: stang,
    restoreFocus: true,
    autoFocus: true,
  })

  const hanteraFil = async (file: File) => {
    setFilnamn(file.name)
    setFelkod(null)
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
    try {
      // `callAI` returnerar hela svarskuvertet ({ success, [responseKey]: … }),
      // så nyckeln plockas ut som i JobAdaptPanel.
      const svar = await callAI<ImporteratCv>('cv-import', { cvText: text })
      const importerat = (svar as { cv?: ImporteratCv }).cv
      if (!importerat || typeof importerat !== 'object') {
        throw new Error('Tomt AI-svar')
      }
      const cvData = tillCvData(importerat)
      setResultat(cvData)
      // Förslag på namn: yrkestiteln om den finns, annars filnamnet utan ändelse.
      const bas = cvData.title?.trim() || file.name.replace(/\.[^.]+$/, '')
      setNamn(bas.slice(0, 60))
      setSteg('granska')
    } catch (e) {
      console.error('CV-import misslyckades:', e)
      // Har personen stängt av AI-behandling (GDPR art. 21-brytaren) är det
      // inte ett tillfälligt fel — det är ett val hen gjort, och "försök igen
      // om en stund" hade varit ett råd som aldrig kan funka. Uppmätt i drift
      // 2026-08-19: testkontot hade AI av, och modalen svarade ändå
      // "försök igen om en stund".
      setFelkod(e instanceof AiConsentRequiredError ? 'ai-avstangd' : 'ai')
      setSteg('fel')
    }
  }

  const spara = async () => {
    if (!resultat || !namn.trim() || sparar) return
    setSparar(true)
    try {
      await cvApi.saveVersion(namn.trim(), resultat)
      // `useDocuments` (dokumentväljaren i ansökningsmodalen) läser samma CV
      // ur React Query-nyckeln ['cv-versions'] med fem minuters staleTime.
      // Utan den här raden fanns det nyss uppladdade CV:t inte att välja när
      // man registrerade ansökan man laddade upp det för.
      await queryClient.invalidateQueries({ queryKey: ['cv-versions'] })
      showToast.success(t('cv.upload.saved', 'CV:t är sparat i Dina CV.'))
      onSaved()
      setSparar(false)
      stang()
    } catch (e) {
      console.error('Kunde inte spara importerat CV:', e)
      showToast.error(t('cv.upload.saveFailed', 'Kunde inte spara CV:t just nu. Försök igen om en stund.'))
      setSparar(false)
    }
  }

  if (!isOpen) return null

  const felmeddelanden: Record<UtokatFel, string> = {
    'for-stor': t('cv.upload.errors.tooLarge', 'Filen är större än 10 MB. Spara om den i mindre storlek och försök igen.'),
    'okant-format': t('cv.upload.errors.format', 'Vi kan läsa PDF och Word (.docx). Spara om filen i något av de formaten.'),
    'gammalt-word': t('cv.upload.errors.oldWord', 'Formatet .doc är för gammalt. Öppna filen i Word och välj "Spara som" → .docx eller PDF.'),
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
        aria-labelledby="cv-upload-rubrik"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Rubrikrad */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="cv-upload-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">
                {t('cv.upload.title', 'Ladda upp ditt CV')}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
                {filnamn || t('cv.upload.subtitle', 'PDF eller Word (.docx)')}
              </p>
            </div>
          </div>
          <button
            onClick={stang}
            disabled={sparar}
            className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg disabled:opacity-50"
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
                  {t('cv.upload.dropHere', 'Dra hit din CV-fil, eller välj den från datorn.')}
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
                  <li>{t('cv.upload.privacy4', 'Du ser resultatet och godkänner det innan något sparas.')}</li>
                </ul>
              </div>
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
                {t('cv.upload.wait', 'Det tar oftast under en minut.')}
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
                {/* En annan fil hjälper inte den som stängt av AI — då är
                    vägen framåt inställningarna, eller att fylla i för hand. */}
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
                      to="/cv"
                      onClick={stang}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      {t('cv.upload.fillByHand', 'Fyll i för hand i stället')}
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { setSteg('val'); setFelkod(null); setFilnamn('') }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    {t('cv.upload.tryAgain', 'Försök med en annan fil')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Granska innan sparning */}
          {steg === 'granska' && resultat && antal && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl bg-[var(--c-bg)] border border-[var(--c-solid)]/30 p-4">
                <Sparkles className="w-5 h-5 text-[var(--c-text)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[var(--c-text)]">
                  {t('cv.upload.reviewHint', 'Sorterat med AI-stöd ur din fil. Läs igenom att det stämmer — du kan ändra allt i CV-byggaren efteråt.')}
                </p>
              </div>

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
                    {resultat.workExperience.slice(0, 6).map((w) => (
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
                </div>
              )}

              <div>
                <label htmlFor="cv-upload-namn" className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1.5">
                  {t('cv.upload.nameLabel', 'Vad ska CV:t heta?')}
                </label>
                <input
                  id="cv-upload-namn"
                  type="text"
                  value={namn}
                  maxLength={60}
                  onChange={(e) => setNamn(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fotrad — bara när det finns något att göra */}
        {steg === 'granska' && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={() => { setSteg('val'); setResultat(null); setFilnamn('') }}
              disabled={sparar}
              className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
            >
              {t('cv.upload.chooseOther', 'Välj en annan fil')}
            </button>
            <button
              onClick={spara}
              disabled={sparar || !namn.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110 disabled:opacity-50"
            >
              {sparar
                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                : <Check className="w-4 h-4" aria-hidden="true" />}
              {t('cv.upload.save', 'Spara i Dina CV')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CVUploadModal
