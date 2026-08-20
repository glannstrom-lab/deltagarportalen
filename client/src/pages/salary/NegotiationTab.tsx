/**
 * Förhandlingsfliken.
 *
 * Fliken var ett anslag: den bad deltagaren förbereda sex saker och erbjöd
 * inte ett enda ställe att göra dem på. Nu finns tre fält — målön, lägsta
 * nivå, mina argument — som sparas, så att det man tänkt ut finns kvar när
 * man sitter i mötet.
 *
 * Tre saker som var direkt fel och inte får återinföras:
 *
 * · Scenarierna visade fyra påhittade lönesiffror under etiketten "Marknad",
 *   utan yrke, region eller källa. Siffrorna är borta; situationerna och
 *   resonemangen finns kvar. Ett scenario behöver inte ett tal för att lära
 *   ut ett sätt att tänka.
 * · Ett scenario rådde deltagaren att begära 5 000 kr under marknadsnivån
 *   "för att visa flexibilitet" — till den som har svagast läge från början.
 *   Ett annat sa "du är redan över marknaden" till någon vars egna tal låg
 *   4 000 kr under.
 * · Allt sakinnehåll var hårdkodad svenska i en tvåspråkig portal. Det ligger
 *   nu i språkfilerna under `salary.negotiation.*`.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  TrendingUp, CheckCircle, AlertCircle, ChevronDown, MessageSquare,
  Target, Clock, Lightbulb, RotateCcw, ArrowRight,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { IconButton } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

const CHECKLIST_NYCKEL = 'negotiationChecklist'
const FORBEREDELSE_NYCKEL = 'negotiationPrep'
const ANTAL_CHECKPUNKTER = 6

interface Steg {
  title: string
  description: string
  tips: string[]
  phrases: string[]
}

interface Scenario {
  title: string
  description: string
  advice: string
}

interface Tidpunkt {
  title: string
  description: string
}

interface Forberedelse {
  malon: string
  lagsta: string
  argument: string
}

const TOM_FORBEREDELSE: Forberedelse = { malon: '', lagsta: '', argument: '' }

const STEG_ORDNING = ['preparation', 'opening', 'case', 'apart', 'closing'] as const
const SCENARIO_ORDNING = ['firstJob', 'offer', 'annual', 'newDuties'] as const
const TIDPUNKT_ORDNING = ['offer', 'annual', 'newDuties', 'wentWell'] as const

/** Läser sparat tillstånd utan att kunna vitna sidan på trasig data. */
function lasJson<T>(nyckel: string, arGiltig: (v: unknown) => v is T): T | null {
  try {
    const ratext = localStorage.getItem(nyckel)
    if (!ratext) return null
    const varde: unknown = JSON.parse(ratext)
    return arGiltig(varde) ? varde : null
  } catch (error) {
    logger.warn(`Kunde inte läsa ${nyckel} ur localStorage`, { error })
    return null
  }
}

const arBooleanLista = (v: unknown): v is boolean[] =>
  Array.isArray(v) && v.length === ANTAL_CHECKPUNKTER && v.every(x => typeof x === 'boolean')

const arForberedelse = (v: unknown): v is Forberedelse =>
  typeof v === 'object' && v !== null &&
  ['malon', 'lagsta', 'argument'].every(k => typeof (v as Record<string, unknown>)[k] === 'string')

export default function NegotiationTab() {
  const { t } = useTranslation()

  // Nycklade objekt, inte listor: språkfilernas dubblettvakt läser råtexten
  // och kan inte se att `title` i två listelement hör till olika objekt.
  // Stabila nycklar är dessutom lättare att översätta mot. Ordningen bor här.
  const steg = STEG_ORDNING.map(nyckel =>
    t(`salary.negotiation.steps.${nyckel}`, { returnObjects: true }) as unknown as Steg,
  )
  const scenarier = SCENARIO_ORDNING.map(nyckel =>
    t(`salary.negotiation.scenarios.items.${nyckel}`, { returnObjects: true }) as unknown as Scenario,
  )
  const tips = t('salary.negotiation.tips.items', { returnObjects: true }) as unknown as string[]
  const tidpunkter = TIDPUNKT_ORDNING.map(nyckel =>
    t(`salary.negotiation.timing.items.${nyckel}`, { returnObjects: true }) as unknown as Tidpunkt,
  )
  const gorLista = t('salary.negotiation.do.items', { returnObjects: true }) as unknown as string[]
  const undvikLista = t('salary.negotiation.dont.items', { returnObjects: true }) as unknown as string[]
  const checkpunkter = t('salary.negotiation.checklist.items', { returnObjects: true }) as unknown as string[]

  const [oppetSteg, setOppetSteg] = useState<number | null>(0)
  const [valtScenario, setValtScenario] = useState<number | null>(null)
  const [tipsIndex, setTipsIndex] = useState(0)
  const [visaMer, setVisaMer] = useState(false)
  const { confirm } = useConfirmDialog()

  const [avbockat, setAvbockat] = useState<boolean[]>(() =>
    lasJson(CHECKLIST_NYCKEL, arBooleanLista) ?? Array(ANTAL_CHECKPUNKTER).fill(false),
  )
  const [forberedelse, setForberedelse] = useState<Forberedelse>(() =>
    lasJson(FORBEREDELSE_NYCKEL, arForberedelse) ?? TOM_FORBEREDELSE,
  )
  const [sparatVid, setSparatVid] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_NYCKEL, JSON.stringify(avbockat))
    } catch (error) {
      logger.warn('Kunde inte spara checklistan', { error })
    }
  }, [avbockat])

  const sparaForberedelse = (nasta: Forberedelse) => {
    setForberedelse(nasta)
    try {
      localStorage.setItem(FORBEREDELSE_NYCKEL, JSON.stringify(nasta))
      setSparatVid(new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      logger.warn('Kunde inte spara förberedelsen', { error })
    }
  }

  const antalKlara = avbockat.filter(Boolean).length
  const harForberedelse = Object.values(forberedelse).some(v => v.trim().length > 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {t('salary.negotiation.description')}
      </p>

      {/* Så funkar det i Sverige */}
      <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border-[var(--c-accent)]/60">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {t('salary.negotiation.swedishMarket')}
            </h2>
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {t('salary.negotiation.swedishMarketDesc')}
            </p>
          </div>
        </div>
      </Card>

      {/* Din förberedelse — det som faktiskt sparas */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-3 mb-4">
          <Target className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('salary.negotiation.prep.title')}
            </h2>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {t('salary.negotiation.prep.intro')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prep-target" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('salary.negotiation.prep.targetLabel')}
            </label>
            <input
              id="prep-target"
              type="text"
              inputMode="numeric"
              value={forberedelse.malon}
              onChange={(e) => sparaForberedelse({ ...forberedelse, malon: e.target.value })}
              aria-describedby="prep-target-hint"
              className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
            />
            <p id="prep-target-hint" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {t('salary.negotiation.prep.targetHint')}
            </p>
          </div>

          <div>
            <label htmlFor="prep-floor" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('salary.negotiation.prep.floorLabel')}
            </label>
            <input
              id="prep-floor"
              type="text"
              inputMode="numeric"
              value={forberedelse.lagsta}
              onChange={(e) => sparaForberedelse({ ...forberedelse, lagsta: e.target.value })}
              aria-describedby="prep-floor-hint"
              className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
            />
            <p id="prep-floor-hint" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {t('salary.negotiation.prep.floorHint')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="prep-arguments" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            {t('salary.negotiation.prep.argumentsLabel')}
          </label>
          <textarea
            id="prep-arguments"
            rows={4}
            value={forberedelse.argument}
            onChange={(e) => sparaForberedelse({ ...forberedelse, argument: e.target.value })}
            aria-describedby="prep-arguments-hint"
            className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
          />
          <p id="prep-arguments-hint" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {t('salary.negotiation.prep.argumentsHint')}
          </p>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 mt-3" role="status" aria-live="polite">
          {harForberedelse && sparatVid
            ? t('salary.negotiation.prep.savedAt', { time: sparatVid })
            : t('salary.negotiation.prep.savesAutomatically')}
        </p>

        <Link
          to="/salary/market"
          className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
        >
          {t('salary.negotiation.links.toMarket')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </Card>

      {/* Checklista */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
            <CheckCircle className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            {t('salary.negotiation.checklist.title')}
          </h2>
          <IconButton
            icon={<RotateCcw className="w-4 h-4" />}
            label={t('salary.negotiation.checklist.resetLabel')}
            variant="ghost"
            size="sm"
            onClick={async () => {
              const jaTack = await confirm({
                title: t('salary.negotiation.checklist.resetLabel'),
                message: t('salary.negotiation.checklist.resetConfirm'),
                confirmText: t('salary.negotiation.checklist.resetConfirmAction'),
                cancelText: t('common.cancel'),
                variant: 'warning',
              })
              if (jaTack) setAvbockat(Array(ANTAL_CHECKPUNKTER).fill(false))
            }}
          />
        </div>

        <p className="text-sm text-stone-700 dark:text-stone-300 mb-3" role="status" aria-live="polite">
          {antalKlara === 0
            ? t('salary.negotiation.checklist.emptyHint')
            : t('salary.negotiation.checklist.progress', { done: antalKlara, total: ANTAL_CHECKPUNKTER })}
        </p>

        <div
          className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={antalKlara}
          aria-valuemin={0}
          aria-valuemax={ANTAL_CHECKPUNKTER}
          aria-label={t('salary.negotiation.checklist.title')}
        >
          <div
            className="h-full bg-[var(--c-solid)] transition-all"
            style={{ width: `${(antalKlara / ANTAL_CHECKPUNKTER) * 100}%` }}
          />
        </div>

        <ul className="space-y-2">
          {checkpunkter.map((punkt, i) => (
            <li key={punkt}>
              <button
                role="checkbox"
                aria-checked={avbockat[i] ?? false}
                onClick={() => setAvbockat(avbockat.map((v, j) => (j === i ? !v : v)))}
                className="w-full flex items-start gap-3 text-left p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 min-h-[44px]"
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center',
                    avbockat[i]
                      ? 'bg-[var(--c-solid)] border-[var(--c-solid)]'
                      : 'border-stone-400 dark:border-stone-500',
                  )}
                  aria-hidden="true"
                >
                  {avbockat[i] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </span>
                <span className={cn(
                  'text-sm text-stone-800 dark:text-stone-100',
                  avbockat[i] && 'line-through text-stone-600 dark:text-stone-400',
                )}>
                  {punkt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* Fem steg */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
          {t('salary.negotiation.stepsTitle')}
        </h2>

        <ul className="space-y-3">
          {steg.map((s, i) => {
            const oppen = oppetSteg === i
            return (
              <li key={s.title} className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOppetSteg(oppen ? null : i)}
                  aria-expanded={oppen}
                  aria-controls={`steg-${i}`}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700"
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    oppen
                      ? 'bg-[var(--c-solid)] text-white'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
                  )} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-stone-900 dark:text-stone-100">{s.title}</span>
                    <span className="block text-sm text-stone-600 dark:text-stone-300">{s.description}</span>
                  </span>
                  <ChevronDown className={cn('w-5 h-5 text-stone-500 transition-transform', oppen && 'rotate-180')} aria-hidden="true" />
                </button>

                <div id={`steg-${i}`} hidden={!oppen} className="px-4 pb-4">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {t('salary.negotiation.tipsLabel')}
                  </p>
                  <ul className="space-y-1 mb-4">
                    {s.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
                        <CheckCircle className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
                        {tip}
                      </li>
                    ))}
                  </ul>

                  <p className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    <MessageSquare className="w-4 h-4" aria-hidden="true" />
                    {t('salary.negotiation.phrasesLabel')}
                  </p>
                  <ul className="space-y-2">
                    {s.phrases.map((fras) => (
                      <li
                        key={fras}
                        className="text-sm italic text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-700 rounded-lg p-3 border border-stone-200 dark:border-stone-600"
                      >
                        {fras}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Gör / Undvik */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-3">
              <CheckCircle className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
              {t('salary.negotiation.do.title')}
            </h2>
            <ul className="space-y-2">
              {gorLista.map((rad) => (
                <li key={rad} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
                  <span className="text-[var(--c-text)] dark:text-[var(--c-text)] mt-0.5" aria-hidden="true">+</span>
                  {rad}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:border-l md:border-stone-200 md:dark:border-stone-700 md:pl-6">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-3">
              <AlertCircle className="w-5 h-5 text-stone-600 dark:text-stone-300" aria-hidden="true" />
              {t('salary.negotiation.dont.title')}
            </h2>
            <ul className="space-y-2">
              {undvikLista.map((rad) => (
                <li key={rad} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
                  <span className="text-stone-500 mt-0.5" aria-hidden="true">−</span>
                  {rad}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Öva på ett läge */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
          {t('salary.negotiation.scenarios.title')}
        </h2>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
          {t('salary.negotiation.scenarios.intro')}
        </p>

        {valtScenario === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarier.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setValtScenario(i)}
                className="text-left p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] hover:bg-[var(--c-bg)]/40 dark:hover:bg-[var(--c-bg)]/20 transition-colors min-h-[44px]"
              >
                <span className="block font-medium text-stone-900 dark:text-stone-100">{s.title}</span>
                <span className="block text-sm text-stone-600 dark:text-stone-300 mt-1">{s.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div role="status" aria-live="polite">
            <Button variant="ghost" size="sm" onClick={() => setValtScenario(null)} className="mb-3">
              ← {t('salary.negotiation.scenarios.back')}
            </Button>
            <div className="p-4 rounded-xl bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/60">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                {scenarier[valtScenario].title}
              </h3>
              <p className="text-sm text-stone-700 dark:text-stone-200 mb-3">
                {scenarier[valtScenario].description}
              </p>
              <p className="text-sm text-stone-800 dark:text-stone-100">
                <span className="font-medium">{t('salary.negotiation.scenarios.adviceLabel')}: </span>
                {scenarier[valtScenario].advice}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Mer om förhandling */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setVisaMer(!visaMer)}
          aria-expanded={visaMer}
          aria-controls="negotiation-more"
          className="w-full flex items-center justify-between gap-3 text-left min-h-[44px]"
        >
          <span className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
            <Lightbulb className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            {t('salary.negotiation.more.title')}
          </span>
          <ChevronDown className={cn('w-5 h-5 text-stone-500 transition-transform', visaMer && 'rotate-180')} aria-hidden="true" />
        </button>

        <div id="negotiation-more" hidden={!visaMer} className="mt-4 space-y-6">
          {/* Ett tips */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              {t('salary.negotiation.tips.title')}
            </p>
            <p className="text-stone-800 dark:text-stone-100" role="status" aria-live="polite">
              {tips[tipsIndex]}
            </p>
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTipsIndex((tipsIndex - 1 + tips.length) % tips.length)}
              >
                ← {t('common.previous')}
              </Button>
              <span className="text-xs text-stone-600 dark:text-stone-400">
                {t('salary.negotiation.tips.counter', { current: tipsIndex + 1, total: tips.length })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTipsIndex((tipsIndex + 1) % tips.length)}
              >
                {t('common.next')} →
              </Button>
            </div>
          </div>

          {/* När ska du förhandla */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100 mb-3">
              <Clock className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
              {t('salary.negotiation.timing.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tidpunkter.map((tp) => (
                <div
                  key={tp.title}
                  className="p-3 rounded-xl bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40"
                >
                  <p className="font-medium text-stone-900 dark:text-stone-100">{tp.title}</p>
                  <p className="text-sm text-stone-700 dark:text-stone-200">{tp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/salary"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline"
          >
            {t('salary.negotiation.links.toCalculator')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </Card>

    </div>
  )
}
