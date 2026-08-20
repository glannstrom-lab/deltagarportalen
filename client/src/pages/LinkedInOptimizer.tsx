import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Linkedin, Copy, Check, Sparkles, RefreshCw, Shield, AlertCircle,
  ChevronDown, ChevronUp, ArrowRight, Info,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageLayout } from '@/components/layout/PageLayout'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusLinkedInWizard } from '@/components/focus/pages/FocusLinkedInWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { articleChecklistApi } from '@/services/cloudStorage'
import { cvApi } from '@/services/supabaseApi'
import { useProfileStore } from '@/stores/profileStore'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

/**
 * LinkedIn — skriv texterna, och se vad som är kvar att fylla i.
 *
 * TRE SAKER SOM VAR FEL OCH INTE FÅR ÅTERINFÖRAS
 *
 * 1. **Checklistan gick inte att nå från sin egen flik.** `auditSections`
 *    fylldes bara av en knapp som renderades på rubrik-fliken, så den som
 *    klickade "Checklista" i sidoskenan fick en rubrik, ett stycke som sa
 *    "gå igenom listan" — och sedan ingenting. Innehållet ligger nu i
 *    språkfilerna och renderas alltid.
 * 2. **Reservmallen märktes som AI-genererad.** När anropet failade lades en
 *    handskriven mall i samma `resultat` som AI-svaret, och renderades med
 *    `data-ai-generated="true"` + "Detta förslag är genererat med AI-stöd".
 *    Mallen påstod dessutom saker om personen: "Erfaren specialist inom
 *    branschen", "Jag är en driven … med passion för …". Nu är mallen ett
 *    ifyllbart utkast med hålrum, tydligt märkt som mall — samma beslut som
 *    d2d1baf9/7c4d5435 tog för personligt brev.
 * 3. **Alla fel såg likadana ut.** Ett naket `catch` gjorde att "du har stängt
 *    av AI" (art. 21), utgången session, för många anrop och timeout blev
 *    samma mening: "AI-tjänsten är inte tillgänglig just nu" — osant i tre av
 *    fyra fall. `tolkaAiFel` skiljer dem åt, som i CoverLetterWrite.
 *
 * TECKENGRÄNSERNA är kontrollerade 2026-08-20: rubrik 220 (~70 syns i
 * sökträffar), Om 2 600 (~300 syns före "se mer"), inlägg 3 000 (~210 syns),
 * kontaktnotis ~200. Sidan sa tidigare 2 000 och 1 300 — det senare var
 * LinkedIns gräns före 2017.
 */

type Flik = 'headline' | 'about' | 'post' | 'connection' | 'audit'

/** LinkedIns fältgränser. Se filhuvudet för när de kontrollerades. */
const TECKENGRANS: Record<Exclude<Flik, 'audit'>, number> = {
  headline: 220,
  about: 2600,
  post: 3000,
  connection: 200,
}

/**
 * Checklistans struktur. Ordningen bor här, texterna i språkfilerna under
 * `linkedInOptimizer.audit.sections.*`. Nycklarna är också id:n för sparade
 * kryss — byt dem inte utan att tänka på att någons kryss då nollställs.
 */
const PROFILDELAR = [
  { nyckel: 'rubrik', punkter: ['yrke', 'sokord', 'synligt'], har: 'exempel' },
  { nyckel: 'om', punkter: ['borjan', 'konkret', 'kontakt', 'lasbar'], har: 'exempel' },
  { nyckel: 'erfarenhet', punkter: ['vadDuGjorde', 'konkret', 'luckor'], har: 'exempel' },
  { nyckel: 'rekommendationer', punkter: ['fragat', 'olika', 'kompetenser'], har: 'mall' },
] as const

/**
 * Kryssen sparas via `articleChecklistApi` — ett generiskt nyckel→lista-lager
 * med molnsynk och localStorage-fallback. Id:t är avsiktligt inte ett
 * artikel-id; tabellen `article_checklists` har ingen främmande nyckel mot
 * artiklar och unikhet på (user_id, article_id), så raden lever för sig.
 * En egen tabell vore renare men kräver en migration mot prod.
 */
const CHECKLIST_ID = 'linkedin-profil'

interface FormData {
  headline: { yrke: string; erfarenhet: string }
  about: { bakgrund: string; styrkor: string; mal: string }
  post: { amne: string; ton: string }
  connection: { namn: string; roll: string; syfte: string }
}

const TOM_FORM: FormData = {
  headline: { yrke: '', erfarenhet: '' },
  about: { bakgrund: '', styrkor: '', mal: '' },
  post: { amne: '', ton: 'professionell' },
  connection: { namn: '', roll: '', syfte: '' },
}

type Felsort = 'ai-avstangd' | 'inloggning' | 'for-manga' | 'ai'

/** Skiljer felen åt så användaren får rätt väg framåt. Samma mönster som
 *  `components/cover-letter/CoverLetterWrite.tsx` — `callAI` kastar
 *  `AiConsentRequiredError` för grinden men platt `Error` för resten. */
function tolkaAiFel(error: unknown): Felsort {
  if (error instanceof AiConsentRequiredError) return 'ai-avstangd'
  const text = error instanceof Error ? error.message : ''
  if (/inloggad|logga in|session/i.test(text)) return 'inloggning'
  if (/många förfrågningar/i.test(text)) return 'for-manga'
  return 'ai'
}

export default function LinkedInOptimizer() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  /**
   * Tillståndet bor här, inte i `Inner` — och fokusläget är ett ÖVERLÄGG,
   * inte en gren som byter ut sidan. Låg `if (isFocusMode) return …` här ute
   * avmonterades allt ifyllt när växeln slogs om, samma fel som b93be382
   * (intervjusimulatorn) och 00d8be26 (lönesidan) lagade. Växeln sitter på två
   * ställen som båda syns på rutten: toppnaven och "Lugnare läge".
   */
  const [aktivTab, setAktivTab] = useState<Flik>('headline')
  const [formData, setFormData] = useState<FormData>(TOM_FORM)

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>
        <LinkedInOptimizerInner
          aktivTab={aktivTab}
          setAktivTab={setAktivTab}
          formData={formData}
          setFormData={setFormData}
        />
      </div>

      {isFocusMode && (
        <PageFocusShell title={t('linkedInOptimizer.title')} icon={Linkedin} domain="activity">
          <FocusLinkedInWizard
            onTaMedTillNormalvy={(del, text) => {
              setAktivTab(del)
              setFormData((f) =>
                del === 'headline'
                  ? { ...f, headline: { ...f.headline, yrke: text } }
                  : del === 'about'
                    ? { ...f, about: { ...f.about, bakgrund: text } }
                    : { ...f, post: { ...f.post, amne: text } },
              )
            }}
            onExit={leaveWizard}
          />
        </PageFocusShell>
      )}
    </>
  )
}

interface InnerProps {
  aktivTab: Flik
  setAktivTab: (f: Flik) => void
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
}

function LinkedInOptimizerInner({ aktivTab, setAktivTab, formData, setFormData }: InnerProps) {
  const { t } = useTranslation()
  const profil = useProfileStore((s) => s.profile)

  // Ett resultat per flik: att byta flik ska inte radera en text man håller på
  // att läsa. Tidigare gjorde `bytTab` `setResultat('')` villkorslöst.
  const [resultatPerFlik, setResultatPerFlik] = useState<Partial<Record<Flik, string>>>({})
  const [kallaPerFlik, setKallaPerFlik] = useState<Partial<Record<Flik, 'ai' | 'mall'>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [felsort, setFelsort] = useState<Felsort | null>(null)
  const [kopieringsfel, setKopieringsfel] = useState(false)
  const [copied, setCopied] = useState(false)
  const [oppenDel, setOppenDel] = useState<string | null>(PROFILDELAR[0].nyckel)
  const [visaOrd, setVisaOrd] = useState<string | null>(null)
  const [visaRelevans, setVisaRelevans] = useState(false)
  const [kryssade, setKryssade] = useState<string[]>([])
  const [kryssKalla, setKryssKalla] = useState<'moln' | 'lokal'>('moln')
  const [forifyllt, setForifyllt] = useState(false)

  const resultat = resultatPerFlik[aktivTab] ?? ''
  const kalla = kallaPerFlik[aktivTab] ?? null

  // Portalen vet redan yrkestiteln — den står i CV:t användaren byggt här.
  const { data: cv } = useQuery({ queryKey: ['cv'], queryFn: () => cvApi.getCV(), staleTime: 300_000 })
  useEffect(() => {
    if (forifyllt || formData.headline.yrke || !cv?.title) return
    setFormData((f) => ({ ...f, headline: { ...f.headline, yrke: cv.title as string } }))
    setForifyllt(true)
  }, [cv?.title, formData.headline.yrke, forifyllt, setFormData])

  // Sparade kryss. Faller tillbaka på localStorage när molnet inte svarar —
  // och säger vilket det blev, i stället för att låtsas att allt är sparat.
  useEffect(() => {
    let avbruten = false
    articleChecklistApi
      .get(CHECKLIST_ID)
      .then((sparade: string[]) => {
        if (!avbruten) setKryssade(Array.isArray(sparade) ? sparade : [])
      })
      .catch((error: unknown) => {
        logger.warn('Kunde inte läsa LinkedIn-checklistan', { error })
        if (!avbruten) setKryssKalla('lokal')
      })
    return () => { avbruten = true }
  }, [])

  const vaxlaKryss = (id: string) => {
    const nasta = kryssade.includes(id) ? kryssade.filter((k) => k !== id) : [...kryssade, id]
    setKryssade(nasta)
    articleChecklistApi.update(CHECKLIST_ID, nasta).catch((error: unknown) => {
      logger.warn('Kunde inte spara LinkedIn-checklistan', { error })
      setKryssKalla('lokal')
    })
  }

  const allaPunkter = useMemo(
    () => PROFILDELAR.flatMap((d) => d.punkter.map((p) => `${d.nyckel}.${p}`)),
    [],
  )
  const antalKryssade = kryssade.filter((k) => allaPunkter.includes(k)).length
  const kvarAttGora = allaPunkter.filter((id) => !kryssade.includes(id))

  const harUnderlag = (flik: Exclude<Flik, 'audit'>): boolean => {
    switch (flik) {
      case 'headline': return formData.headline.yrke.trim().length > 0
      case 'about': return formData.about.bakgrund.trim().length > 0
      case 'post': return formData.post.amne.trim().length > 0
      case 'connection': return formData.connection.roll.trim().length > 0 && formData.connection.syfte.trim().length > 0
    }
  }

  /** Ifyllbara utkast. Hålrum, inga påståenden om personen. */
  const mallFor = (flik: Exclude<Flik, 'audit'>): string => {
    switch (flik) {
      case 'headline':
        return `${formData.headline.yrke || '[ditt yrke]'} | ${formData.headline.erfarenhet || '[något du kan]'} | söker arbete i [ort]`
      case 'about':
        return [
          `Jag är ${formData.about.bakgrund || '[ditt yrke]'} och har [antal] års erfarenhet av [vad du gjort].`,
          `Jag är van vid ${formData.about.styrkor || '[något konkret du kan]'}.`,
          `Just nu söker jag ${formData.about.mal || '[vilket jobb du söker]'} i [ort].`,
          'Hör gärna av dig här om du vill veta mer.',
        ].join('\n\n')
      case 'post':
        return [
          `[En mening om ${formData.post.amne || '[ditt ämne]'} — det här är det enda som syns innan "visa mer".]`,
          '[Berätta kort vad som hände och vad du tar med dig.]',
          '[Avsluta med vad du söker, eller en fråga till den som läser.]',
        ].join('\n\n')
      case 'connection':
        return `Hej ${formData.connection.namn || '[namn]'}! Jag såg att du arbetar som ${formData.connection.roll || '[roll]'}. ${formData.connection.syfte || '[varför du hör av dig]'}. Vänliga hälsningar, [ditt namn]`
    }
  }

  const generera = async () => {
    if (aktivTab === 'audit') return
    const flik = aktivTab
    setIsLoading(true)
    setFelsort(null)
    try {
      const data = await callAI<{ text: string }>('linkedin-optimering', {
        typ: flik,
        data: formData[flik],
        maxTecken: TECKENGRANS[flik],
      })
      const text = (data as { text?: string }).text?.trim() || ''
      if (!text) throw new Error('Tomt svar')
      setResultatPerFlik((r) => ({ ...r, [flik]: text }))
      setKallaPerFlik((k) => ({ ...k, [flik]: 'ai' }))
    } catch (error) {
      logger.warn('LinkedIn-generering misslyckades', { error })
      setFelsort(tolkaAiFel(error))
      setResultatPerFlik((r) => ({ ...r, [flik]: mallFor(flik) }))
      setKallaPerFlik((k) => ({ ...k, [flik]: 'mall' }))
    } finally {
      setIsLoading(false)
    }
  }

  const kopiera = async () => {
    setKopieringsfel(false)
    try {
      await navigator.clipboard.writeText(resultat)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.warn('Kunde inte kopiera texten', { error })
      setKopieringsfel(true)
    }
  }

  const flikar: { id: Flik; etikett: string }[] = [
    { id: 'headline', etikett: t('linkedInOptimizer.tabs.headline.label') },
    { id: 'about', etikett: t('linkedInOptimizer.tabs.about.label') },
    { id: 'post', etikett: t('linkedInOptimizer.tabs.post.label') },
    { id: 'connection', etikett: t('linkedInOptimizer.tabs.connection.label') },
    { id: 'audit', etikett: t('linkedInOptimizer.tabs.audit.label') },
  ]

  const faltklass =
    'w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100'
  const etikettklass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5'
  const fornamn = profil?.first_name?.trim()

  return (
    <PageLayout
      title={t('linkedInOptimizer.title')}
      subtitle={t('linkedInOptimizer.description')}
      domain="activity"
      sidoflikar={{
        poster: flikar.map((f) => ({ id: f.id, etikett: f.etikett })),
        aktiv: aktivTab,
        vidVal: (id: string) => setAktivTab(id as Flik),
      }}
      className="sidbredd"
      contentClassName="space-y-6"
    >
      {/* Är LinkedIn rätt kanal för dig? Sidan lovade tidigare synlighet utan
          förbehåll — för den som söker inom vård, lager, handel, bygg, städ
          eller restaurang är det ett råd som kostar tid utan att ge jobb. */}
      <Card className="p-0 overflow-hidden bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
        <button
          onClick={() => setVisaRelevans(!visaRelevans)}
          aria-expanded={visaRelevans}
          aria-controls="li-relevans"
          className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[44px]"
        >
          <span className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
            <Info className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            {t('linkedInOptimizer.relevance.title')}
          </span>
          {visaRelevans
            ? <ChevronUp className="w-5 h-5 text-stone-500" aria-hidden="true" />
            : <ChevronDown className="w-5 h-5 text-stone-500" aria-hidden="true" />}
        </button>
        <div id="li-relevans" hidden={!visaRelevans} className="px-4 pb-4">
          <p className="text-sm text-stone-700 dark:text-stone-200 mb-3">
            {t('linkedInOptimizer.relevance.body')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/spontanansökan" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline">
              {t('linkedInOptimizer.relevance.toSpontaneous')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to="/job-search" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline">
              {t('linkedInOptimizer.relevance.toJobSearch')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>

      {aktivTab !== 'audit' ? (
        <>
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              {t(`linkedInOptimizer.${aktivTab}.title`)}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 mb-4">
              {t(`linkedInOptimizer.${aktivTab}.description`)}
            </p>

            {aktivTab === 'headline' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="li-headline-jobtitle" className={etikettklass}>
                    {t('linkedInOptimizer.headline.jobTitleLabel')}
                  </label>
                  <input
                    id="li-headline-jobtitle"
                    type="text"
                    placeholder={t('linkedInOptimizer.headline.jobTitlePlaceholder')}
                    value={formData.headline.yrke}
                    onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, yrke: e.target.value } })}
                    aria-describedby={forifyllt ? 'li-headline-prefill' : undefined}
                    className={faltklass}
                  />
                  {forifyllt && (
                    <p id="li-headline-prefill" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {t('linkedInOptimizer.headline.prefilledFromCv')}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="li-headline-spec" className={etikettklass}>
                    {t('linkedInOptimizer.headline.specializationLabel')}
                  </label>
                  <input
                    id="li-headline-spec"
                    type="text"
                    placeholder={t('linkedInOptimizer.headline.specializationPlaceholder')}
                    value={formData.headline.erfarenhet}
                    onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, erfarenhet: e.target.value } })}
                    className={faltklass}
                  />
                </div>
                <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 p-4 rounded-lg border border-[var(--c-accent)]/60">
                  <p className="text-sm text-stone-800 dark:text-stone-100">
                    <strong>{t('linkedInOptimizer.headline.tipLabel')}:</strong>{' '}
                    {t('linkedInOptimizer.headline.tipText')}
                  </p>
                </div>
              </div>
            )}

            {aktivTab === 'about' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="li-about-background" className={etikettklass}>
                    {t('linkedInOptimizer.about.backgroundLabel')}
                  </label>
                  <textarea
                    id="li-about-background"
                    rows={3}
                    placeholder={t('linkedInOptimizer.about.backgroundPlaceholder')}
                    value={formData.about.bakgrund}
                    onChange={(e) => setFormData({ ...formData, about: { ...formData.about, bakgrund: e.target.value } })}
                    className={cn(faltklass, 'resize-y')}
                  />
                </div>
                <div>
                  <label htmlFor="li-about-strengths" className={etikettklass}>
                    {t('linkedInOptimizer.about.strengthsLabel')}
                  </label>
                  <textarea
                    id="li-about-strengths"
                    rows={3}
                    placeholder={t('linkedInOptimizer.about.strengthsPlaceholder')}
                    value={formData.about.styrkor}
                    onChange={(e) => setFormData({ ...formData, about: { ...formData.about, styrkor: e.target.value } })}
                    className={cn(faltklass, 'resize-y')}
                  />
                </div>
                <div>
                  <label htmlFor="li-about-goals" className={etikettklass}>
                    {t('linkedInOptimizer.about.goalsLabel')}
                  </label>
                  <input
                    id="li-about-goals"
                    type="text"
                    placeholder={t('linkedInOptimizer.about.goalsPlaceholder')}
                    value={formData.about.mal}
                    onChange={(e) => setFormData({ ...formData, about: { ...formData.about, mal: e.target.value } })}
                    className={faltklass}
                  />
                </div>
              </div>
            )}

            {aktivTab === 'post' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="li-post-topic" className={etikettklass}>
                    {t('linkedInOptimizer.post.topicLabel')}
                  </label>
                  <textarea
                    id="li-post-topic"
                    rows={4}
                    placeholder={t('linkedInOptimizer.post.topicPlaceholder')}
                    value={formData.post.amne}
                    onChange={(e) => setFormData({ ...formData, post: { ...formData.post, amne: e.target.value } })}
                    className={cn(faltklass, 'resize-y')}
                  />
                </div>
                <div>
                  <label htmlFor="li-post-tone" className={etikettklass}>
                    {t('linkedInOptimizer.post.toneLabel')}
                  </label>
                  <select
                    id="li-post-tone"
                    value={formData.post.ton}
                    onChange={(e) => setFormData({ ...formData, post: { ...formData.post, ton: e.target.value } })}
                    className={faltklass}
                  >
                    <option value="professionell">{t('linkedInOptimizer.post.tones.professional')}</option>
                    <option value="personlig">{t('linkedInOptimizer.post.tones.personal')}</option>
                    <option value="entusiastisk">{t('linkedInOptimizer.post.tones.enthusiastic')}</option>
                    <option value="formell">{t('linkedInOptimizer.post.tones.formal')}</option>
                  </select>
                </div>
              </div>
            )}

            {aktivTab === 'connection' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="li-conn-name" className={etikettklass}>
                    {t('linkedInOptimizer.connection.nameLabel')}
                  </label>
                  <input
                    id="li-conn-name"
                    type="text"
                    placeholder={t('linkedInOptimizer.connection.namePlaceholder')}
                    value={formData.connection.namn}
                    onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, namn: e.target.value } })}
                    className={faltklass}
                  />
                </div>
                <div>
                  <label htmlFor="li-conn-role" className={etikettklass}>
                    {t('linkedInOptimizer.connection.roleLabel')}
                  </label>
                  <input
                    id="li-conn-role"
                    type="text"
                    placeholder={t('linkedInOptimizer.connection.rolePlaceholder')}
                    value={formData.connection.roll}
                    onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, roll: e.target.value } })}
                    className={faltklass}
                  />
                </div>
                <div>
                  <label htmlFor="li-conn-purpose" className={etikettklass}>
                    {t('linkedInOptimizer.connection.purposeLabel')}
                  </label>
                  <textarea
                    id="li-conn-purpose"
                    rows={3}
                    placeholder={t('linkedInOptimizer.connection.purposePlaceholder')}
                    value={formData.connection.syfte}
                    onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, syfte: e.target.value } })}
                    className={cn(faltklass, 'resize-y')}
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={generera}
                disabled={isLoading || !harUnderlag(aktivTab)}
                aria-busy={isLoading}
                className="w-full sm:w-auto"
                leftIcon={isLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
              >
                {isLoading ? t('linkedInOptimizer.generating') : t('linkedInOptimizer.generate')}
              </Button>
              {!harUnderlag(aktivTab) && (
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                  {t('linkedInOptimizer.missingFields')}
                </p>
              )}
            </div>
          </Card>

          {/* Resultat */}
          <div role="status" aria-live="polite">
            {felsort && (
              <Card className="p-4 mb-4 bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-stone-800 dark:text-stone-100">
                      {t(`linkedInOptimizer.errors.${
                        felsort === 'ai-avstangd' ? 'aiOff'
                          : felsort === 'inloggning' ? 'login'
                            : felsort === 'for-manga' ? 'tooMany' : 'generic'
                      }`)}
                    </p>
                    {felsort === 'ai-avstangd' && (
                      <Link to="/settings" className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline mt-1 inline-block">
                        {t('linkedInOptimizer.errors.settingsLink')}
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {resultat && (
              <Card className={cn(
                'p-6',
                kalla === 'ai'
                  ? 'bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60'
                  : 'bg-white dark:bg-stone-800 border-dashed border-stone-400 dark:border-stone-500',
              )}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      {kalla === 'mall'
                        ? t('linkedInOptimizer.draft.title')
                        : fornamn
                          ? t('linkedInOptimizer.result.titleNamed', { name: fornamn })
                          : t('linkedInOptimizer.result.title')}
                    </h3>
                    {kalla === 'mall' && (
                      <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
                        {t('linkedInOptimizer.draft.body')}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={kopiera}
                    size="sm"
                    variant="outline"
                    className="gap-2 shrink-0"
                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? t('linkedInOptimizer.result.copied') : t('linkedInOptimizer.result.copy')}
                  </Button>
                </div>

                {kopieringsfel && (
                  <p className="text-sm text-stone-700 dark:text-stone-200 mb-2">
                    {t('linkedInOptimizer.result.copyFailed')}
                  </p>
                )}

                <p
                  className="whitespace-pre-wrap text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900/40 rounded-lg p-4 border border-stone-200 dark:border-stone-700"
                  {...(kalla === 'ai' ? { 'data-ai-generated': 'true' } : {})}
                >
                  {resultat}
                </p>

                {/* Teckenräknaren mäter mot LinkedIns riktiga gräns för fältet. */}
                <p className={cn(
                  'text-xs mt-2',
                  resultat.length > TECKENGRANS[aktivTab]
                    ? 'text-red-700 dark:text-red-300 font-medium'
                    : 'text-stone-600 dark:text-stone-400',
                )}>
                  {resultat.length > TECKENGRANS[aktivTab]
                    ? t('linkedInOptimizer.result.charCountOver', {
                        count: resultat.length,
                        over: resultat.length - TECKENGRANS[aktivTab],
                      })
                    : t('linkedInOptimizer.result.charCount', {
                        count: resultat.length,
                        limit: TECKENGRANS[aktivTab],
                      })}
                </p>

                {/* AI Act art. 50.2 — märkningen gäller bara det AI:n skrivit. */}
                {kalla === 'ai' && <AIGeneratedWatermark contentType="förslag" />}

                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-100 mb-2">
                    {t('linkedInOptimizer.result.beforeYouPaste')}
                  </p>
                  <ul className="space-y-1 text-sm text-stone-700 dark:text-stone-200">
                    {(['check1', 'check2', 'check3'] as const).map((n) => (
                      <li key={n} className="flex items-start gap-2">
                        <span className="text-[var(--c-text)] dark:text-[var(--c-text)] mt-0.5" aria-hidden="true">·</span>
                        {t(`linkedInOptimizer.result.${n}`)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-stone-700 dark:text-stone-200 mt-3">
                    {t(`linkedInOptimizer.${aktivTab}.pasteWhere`)}
                  </p>
                </div>
              </Card>
            )}
          </div>

          <RadgivarTips pathname="/linkedin-optimizer" index={0} />
        </>
      ) : (
        <>
          {/* Checklistan. Innehållet ligger i språkfilerna och renderas alltid —
              tidigare fylldes den av en knapp på en annan flik, så den här
              fliken var tom för den som klickade sig hit via skenan. */}
          <Card className="p-6 bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-2">
              <Shield className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
              {t('linkedInOptimizer.audit.title')}
            </h2>
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {t('linkedInOptimizer.audit.intro')}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
              {kryssKalla === 'moln'
                ? t('linkedInOptimizer.audit.saved')
                : t('linkedInOptimizer.audit.savedOffline')}
            </p>
          </Card>

          <div role="status" aria-live="polite">
            {/* En nolla är ett omdöme, inte en uppgift (DESIGN.md §7). Innan
                användaren kryssat något visas en invit i stället för talet. */}
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {antalKryssade === 0
                ? t('linkedInOptimizer.audit.emptyHint')
                : t('linkedInOptimizer.audit.yourTicks', { done: antalKryssade, total: allaPunkter.length })}
            </p>
            <div
              className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mt-2"
              role="progressbar"
              aria-valuenow={antalKryssade}
              aria-valuemin={0}
              aria-valuemax={allaPunkter.length}
              aria-label={t('linkedInOptimizer.audit.title')}
            >
              <div
                className="h-full bg-[var(--c-solid)] transition-all"
                style={{ width: `${(antalKryssade / allaPunkter.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {PROFILDELAR.map((del) => {
              const oppen = oppenDel === del.nyckel
              const bas = `linkedInOptimizer.audit.sections.${del.nyckel}`
              const klaraIDelen = del.punkter.filter((p) => kryssade.includes(`${del.nyckel}.${p}`)).length
              return (
                <Card key={del.nyckel} className="p-0 overflow-hidden bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                  <button
                    onClick={() => setOppenDel(oppen ? null : del.nyckel)}
                    aria-expanded={oppen}
                    aria-controls={`li-del-${del.nyckel}`}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[44px]"
                  >
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {t(`${bas}.name`)}
                      <span className="ml-2 text-sm font-normal text-stone-600 dark:text-stone-300">
                        {klaraIDelen}/{del.punkter.length}
                      </span>
                    </span>
                    {oppen
                      ? <ChevronUp className="w-5 h-5 text-stone-500" aria-hidden="true" />
                      : <ChevronDown className="w-5 h-5 text-stone-500" aria-hidden="true" />}
                  </button>

                  <div id={`li-del-${del.nyckel}`} hidden={!oppen} className="px-4 pb-4 space-y-4">
                    <ul className="space-y-2">
                      {del.punkter.map((punkt) => {
                        const id = `${del.nyckel}.${punkt}`
                        const ikryssad = kryssade.includes(id)
                        return (
                          <li key={id}>
                            <button
                              role="checkbox"
                              aria-checked={ikryssad}
                              onClick={() => vaxlaKryss(id)}
                              className="w-full flex items-start gap-3 text-left p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 min-h-[44px]"
                            >
                              <span
                                className={cn(
                                  'w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center',
                                  ikryssad
                                    ? 'bg-[var(--c-solid)] border-[var(--c-solid)]'
                                    : 'border-stone-400 dark:border-stone-500',
                                )}
                                aria-hidden="true"
                              >
                                {ikryssad && <Check className="w-3.5 h-3.5 text-white" />}
                              </span>
                              <span className={cn(
                                'text-sm text-stone-800 dark:text-stone-100',
                                ikryssad && 'line-through text-stone-600 dark:text-stone-400',
                              )}>
                                {t(`${bas}.points.${punkt}`)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>

                    {del.har === 'exempel' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
                          <p className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                            {t('linkedInOptimizer.audit.exampleBefore')}
                          </p>
                          <p className="text-sm text-stone-700 dark:text-stone-200">{t(`${bas}.exampleBefore`)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/60">
                          <p className="text-xs font-medium text-[var(--c-text)] dark:text-[var(--c-text)] mb-1">
                            {t('linkedInOptimizer.audit.exampleAfter')}
                          </p>
                          <p className="text-sm text-stone-800 dark:text-stone-100">{t(`${bas}.exampleAfter`)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-[var(--c-bg)]/60 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/60">
                        <p className="text-xs font-medium text-[var(--c-text)] dark:text-[var(--c-text)] mb-1">
                          {t('linkedInOptimizer.audit.askTemplate')}
                        </p>
                        <p className="text-sm text-stone-800 dark:text-stone-100 whitespace-pre-wrap">
                          {t(`${bas}.askTemplate`)}
                        </p>
                      </div>
                    )}

                    <div>
                      <button
                        onClick={() => setVisaOrd(visaOrd === del.nyckel ? null : del.nyckel)}
                        aria-expanded={visaOrd === del.nyckel}
                        aria-controls={`li-ord-${del.nyckel}`}
                        className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline min-h-[44px]"
                      >
                        {t('linkedInOptimizer.audit.findWords')}
                      </button>
                      <p
                        id={`li-ord-${del.nyckel}`}
                        hidden={visaOrd !== del.nyckel}
                        className="text-sm text-stone-700 dark:text-stone-200 mt-2"
                      >
                        {t(`${bas}.findWords`)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {kvarAttGora.length > 0 && (
            <Card className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">
                {t('linkedInOptimizer.audit.remaining')}
              </h3>
              <ol className="space-y-1 text-sm text-stone-700 dark:text-stone-200 list-decimal list-inside">
                {kvarAttGora.slice(0, 4).map((id) => {
                  const [delNyckel, punkt] = id.split('.')
                  return (
                    <li key={id}>
                      {t(`linkedInOptimizer.audit.sections.${delNyckel}.points.${punkt}`)}
                    </li>
                  )
                })}
              </ol>
            </Card>
          )}

          <RadgivarTips pathname="/linkedin-optimizer" index={1} />
        </>
      )}
    </PageLayout>
  )
}
