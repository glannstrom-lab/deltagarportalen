/**
 * SchemamallDialog — skapa eller redigera en schemamall för aktivitet (KM3).
 *
 * En mall är en vecka: pass per veckodag med tid, rubrik, aktivitetstyp
 * (lagens fyra + eget jobbsökande) och plats. Inga personuppgifter — det
 * personliga bor i planen som mallen tillämpas på.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2). Samma dialogprimitiv som
 * GoalCreationDialog: role="dialog", aria-modal, Esc, fokusfälla.
 */

import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Copy, Loader2, Clock } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { schemamallApi, type ActivityTemplate, type TemplateInput } from '@/services/aktivitetApi'
import {
  MAX_VECKOTIMMAR,
  mallensVeckotimmar,
  minuterMellan,
  validateTemplateItem,
  type ActivityType,
  type TemplateItem,
} from '@/services/aktivitetSchema'
import {
  AKTIVITETSTYP_ETIKETT,
  AKTIVITETSTYP_HJALP,
  AKTIVITETSTYP_ORDNING,
  VECKODAG_LANG,
  formatTimmar,
} from './aktivitetEtiketter'

interface SchemamallDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Anropas med den sparade mallen. */
  onSaved: (mall: ActivityTemplate) => void
  /** Finns den: redigera i stället för att skapa. */
  mall?: ActivityTemplate | null
}

interface RadForm extends TemplateItem {
  key: number
}

let radKey = 1
function nyRad(overrides: Partial<TemplateItem> = {}): RadForm {
  return {
    key: radKey++,
    weekday: 1,
    start_time: '09:00',
    end_time: '12:00',
    title: '',
    activity_type: 'jobsearch',
    location: '',
    notes: '',
    ...overrides,
  }
}

const VECKODAG_VAL = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: String(d), label: VECKODAG_LANG[d] }))
const TYP_VAL = AKTIVITETSTYP_ORDNING.map((t) => ({ value: t, label: AKTIVITETSTYP_ETIKETT[t] }))

export function SchemamallDialog(props: SchemamallDialogProps) {
  // Formuläret monteras bara när dialogen är öppen: färskt tillstånd varje
  // gång utan en återställande effekt (react-hooks/set-state-in-effect).
  if (!props.isOpen) return null
  return <SchemamallForm {...props} />
}

function SchemamallForm({ isOpen, onClose, onSaved, mall }: SchemamallDialogProps) {
  const [namn, setNamn] = useState(mall?.name ?? '')
  const [beskrivning, setBeskrivning] = useState(mall?.description ?? '')
  const [delad, setDelad] = useState(mall?.is_public ?? false)
  const [rader, setRader] = useState<RadForm[]>(() =>
    mall ? mall.items.map((it) => nyRad({ ...it, location: it.location ?? '', notes: it.notes ?? '' })) : [nyRad()],
  )
  const [forsokt, setForsokt] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [sparfel, setSparfel] = useState<string | null>(null)

  // Timmarna räknas på raderna med giltig tid — rubriken kan vara tom medan man skriver.
  const veckotimmar = useMemo(() => mallensVeckotimmar(rader.filter((r) => minuterMellan(r.start_time, r.end_time) > 0)), [rader])
  const radfel = useMemo(() => rader.map((r) => validateTemplateItem(r)), [rader])
  const namnfel = namn.trim() ? null : 'Mallen behöver ett namn'
  const harFel = namnfel !== null || radfel.some((f) => f !== null) || rader.length === 0

  const uppdatera = (key: number, patch: Partial<TemplateItem>) => {
    setRader((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const kopieraTillVardagar = (key: number) => {
    setRader((prev) => {
      const kalla = prev.find((r) => r.key === key)
      if (!kalla) return prev
      const nya = [1, 2, 3, 4, 5]
        .filter((d) => d !== kalla.weekday)
        .filter((d) => !prev.some((r) => r.weekday === d && r.start_time === kalla.start_time && r.title === kalla.title))
        .map((d) => nyRad({ ...kalla, weekday: d }))
      return [...prev, ...nya]
    })
  }

  const spara = async () => {
    setForsokt(true)
    if (harFel) return
    setSparar(true)
    setSparfel(null)
    const input: TemplateInput = {
      name: namn,
      description: beskrivning,
      is_public: delad,
      items: rader
        .slice()
        .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
        .map(({ key: _key, ...it }) => it),
    }
    try {
      const sparad = mall ? await schemamallApi.update(mall.id, input) : await schemamallApi.create(input)
      onSaved(sparad)
    } catch (err) {
      setSparfel(err instanceof Error ? err.message : 'Mallen kunde inte sparas. Försök igen.')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="schemamall-dialog-title"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="schemamall-dialog-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {mall ? 'Redigera schemamall' : 'Ny schemamall'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            En vecka med pass. Tillämpas sedan på en deltagare från ett startdatum.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="schemamall-namn"
            label="Namn"
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            error={forsokt ? namnfel ?? undefined : undefined}
            placeholder="Jobbsökarverkstad 30 h"
            fullWidth
          />
          <Checkbox
            id="schemamall-delad"
            label="Dela med andra konsulenter"
            description="Mallen blir läsbar för alla konsulenter i portalen. Inga personuppgifter ska stå i en mall."
            checked={delad}
            onChange={(e) => setDelad(e.target.checked)}
          />
        </div>
        <Textarea
          id="schemamall-beskrivning"
          label="Beskrivning"
          value={beskrivning}
          onChange={(e) => setBeskrivning(e.target.value)}
          rows={2}
          placeholder="Vem passar mallen för, och vad förväntas."
          fullWidth
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Pass per vecka</h3>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full',
              veckotimmar > MAX_VECKOTIMMAR
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
            )}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            {formatTimmar(veckotimmar)} av högst {MAX_VECKOTIMMAR} h per vecka
          </p>
        </div>
        {veckotimmar > MAX_VECKOTIMMAR && (
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Lagen sätter taket vid 40 timmar per vecka. Mallen går att spara, men planen måste anpassas per deltagare.
          </p>
        )}

        {forsokt && rader.length === 0 && (
          <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">Mallen behöver minst ett pass.</p>
        )}

        <ul className="space-y-3">
          {rader.map((rad, i) => {
            const fel = forsokt ? radfel[i] : null
            return (
              <li key={rad.key} className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select
                    id={`rad-${rad.key}-dag`}
                    label="Veckodag"
                    options={VECKODAG_VAL}
                    value={String(rad.weekday)}
                    onChange={(e) => uppdatera(rad.key, { weekday: Number(e.target.value) })}
                    fullWidth
                  />
                  <Input
                    id={`rad-${rad.key}-start`}
                    label="Start"
                    type="time"
                    value={rad.start_time}
                    onChange={(e) => uppdatera(rad.key, { start_time: e.target.value })}
                    fullWidth
                  />
                  <Input
                    id={`rad-${rad.key}-slut`}
                    label="Slut"
                    type="time"
                    value={rad.end_time}
                    onChange={(e) => uppdatera(rad.key, { end_time: e.target.value })}
                    fullWidth
                  />
                  <Select
                    id={`rad-${rad.key}-typ`}
                    label="Aktivitetstyp"
                    options={TYP_VAL}
                    value={rad.activity_type}
                    onChange={(e) => uppdatera(rad.key, { activity_type: e.target.value as ActivityType })}
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    id={`rad-${rad.key}-rubrik`}
                    label="Rubrik"
                    value={rad.title}
                    onChange={(e) => uppdatera(rad.key, { title: e.target.value })}
                    placeholder="Jobbsökarverkstad"
                    fullWidth
                  />
                  <Input
                    id={`rad-${rad.key}-plats`}
                    label="Plats"
                    value={rad.location ?? ''}
                    onChange={(e) => uppdatera(rad.key, { location: e.target.value })}
                    placeholder="Hjernet, Malmgatan 4"
                    fullWidth
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{AKTIVITETSTYP_HJALP[rad.activity_type]}</p>
                {fel && (
                  <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{fel}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button type="button" size="sm" variant="ghost" onClick={() => kopieraTillVardagar(rad.key)}>
                    <Copy className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Kopiera till alla vardagar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRader((prev) => prev.filter((r) => r.key !== rad.key))}
                    aria-label={`Ta bort passet ${rad.title || `på ${VECKODAG_LANG[rad.weekday]}`}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Ta bort
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>

        <Button type="button" variant="outline" onClick={() => setRader((prev) => [...prev, nyRad()])}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Lägg till pass
        </Button>

        {sparfel && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{sparfel}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button type="button" variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button type="button" onClick={spara} disabled={sparar}>
          {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
          {mall ? 'Spara ändringar' : 'Spara mall'}
        </Button>
      </div>
    </Dialog>
  )
}
