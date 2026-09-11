/**
 * TillampaMallDialog — tillämpa en schemamall på en deltagare och skapa den
 * individuella planen (KM3/KM5).
 *
 * Veckomålet föreslås ur lagen (40 h, −10 h vid barn under 8, minus
 * deltidsarbete) och är alltid redigerbart — men avviker det från förslaget
 * krävs en motivering, för planen är ett myndighetsdokument. Ingen AI här.
 */

import { useEffect, useMemo, useState } from 'react'
import { X, Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi, schemamallApi, type ActivityPlan, type ActivityTemplate } from '@/services/aktivitetApi'
import {
  addDays,
  foreslagetVeckomal,
  formatLocalDate,
  generateSessions,
  isoWeekday,
  mallensVeckotimmar,
} from '@/services/aktivitetSchema'
import { formatTimmar } from './aktivitetEtiketter'

interface TillampaMallDialogProps {
  isOpen: boolean
  onClose: () => void
  participantId: string
  participantName: string
  onCreated: (plan: ActivityPlan) => void
}

/** Nästa måndag (idag om det är måndag). */
function nastaMandag(): string {
  const idag = formatLocalDate(new Date())
  const wd = isoWeekday(idag)
  return wd === 1 ? idag : addDays(idag, 8 - wd)
}

type MallLage = { status: 'laddar' } | { status: 'fel'; fel: string } | { status: 'klart'; mallar: ActivityTemplate[] }

export function TillampaMallDialog(props: TillampaMallDialogProps) {
  // Monteras bara öppen: färskt tillstånd per öppning utan återställande effekt.
  if (!props.isOpen) return null
  return <TillampaMallForm {...props} />
}

function TillampaMallForm({ isOpen, onClose, participantId, participantName, onCreated }: TillampaMallDialogProps) {
  const [mallLage, setMallLage] = useState<MallLage>({ status: 'laddar' })
  const [mallId, setMallId] = useState('')
  const [start, setStart] = useState(nastaMandag)
  const [slut, setSlut] = useState(() => addDays(nastaMandag(), 12 * 7 - 1))
  const [barnUnder8, setBarnUnder8] = useState(false)
  const [deltid, setDeltid] = useState('')
  const [veckomal, setVeckomal] = useState<string>('')
  const [malRortManuellt, setMalRortManuellt] = useState(false)
  const [motivering, setMotivering] = useState('')
  const [jobbsok, setJobbsok] = useState('0')
  const [planText, setPlanText] = useState('')
  const [beslutsdatum, setBeslutsdatum] = useState(() => formatLocalDate(new Date()))
  const [forsokt, setForsokt] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [sparfel, setSparfel] = useState<string | null>(null)

  const forslag = foreslagetVeckomal({ barnUnder8, deltidTimmar: Number(deltid) || 0 })

  useEffect(() => {
    let aktiv = true
    schemamallApi.list()
      .then((mallar) => {
        if (!aktiv) return
        setMallLage({ status: 'klart', mallar })
        if (mallar.length > 0) setMallId((prev) => prev || mallar[0].id)
      })
      .catch((err) => { if (aktiv) setMallLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Mallarna kunde inte hämtas.' }) })
    return () => { aktiv = false }
  }, [])

  // Förslaget följer kryssrutan och deltiden tills konsulenten själv rört talet — härlett, ingen effekt.
  const veckomalVisat = malRortManuellt ? veckomal : String(forslag)

  const mall = mallLage.status === 'klart' ? mallLage.mallar.find((m) => m.id === mallId) ?? null : null
  const antalPass = useMemo(() => (mall && start && slut ? generateSessions(mall.items, start, slut).length : 0), [mall, start, slut])
  const malTal = Number(veckomalVisat)
  const avviker = Number.isFinite(malTal) && malTal !== forslag
  const fel = {
    mall: mall ? null : 'Välj en mall',
    start: start ? null : 'Ange startdatum',
    slut: !slut ? 'Ange slutdatum' : slut < start ? 'Slutdatum måste vara efter startdatum' : null,
    veckomal: !Number.isFinite(malTal) || malTal < 0 || malTal > 40 ? 'Veckomålet ska vara 0–40 timmar' : null,
    motivering: avviker && !motivering.trim() ? 'Motivera varför målet avviker från lagens förslag' : null,
  }
  const harFel = Object.values(fel).some((f) => f !== null)

  const skapa = async () => {
    setForsokt(true)
    if (harFel || !mall) return
    setSparar(true)
    setSparfel(null)
    try {
      const { plan } = await aktivitetsplanApi.createFromTemplate({
        participantId,
        templateId: mall.id,
        startDate: start,
        endDate: slut,
        weeklyHoursTarget: malTal,
        jobsearchHoursPerWeek: Number(jobbsok) || 0,
        targetReason: avviker ? motivering : null,
        planText,
        decidedAt: beslutsdatum || null,
      })
      onCreated(plan)
    } catch (err) {
      setSparfel(err instanceof Error ? err.message : 'Planen kunde inte skapas. Försök igen.')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="tillampa-mall-title"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="tillampa-mall-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Tillämpa schemamall
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Individuell plan för {participantName}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Stäng" className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {mallLage.status === 'laddar' && <LoadingState message="Hämtar mallar…" size="sm" />}
        {mallLage.status === 'fel' && <ErrorState title="Mallarna kunde inte hämtas" message={mallLage.fel} />}
        {mallLage.status === 'klart' && mallLage.mallar.length === 0 && (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Det finns inga schemamallar än. Skapa en under Resurser → Schemamallar först.
          </p>
        )}
        {mallLage.status === 'klart' && mallLage.mallar.length > 0 && (
          <>
            <Select
              id="tillampa-mall"
              label="Schemamall"
              options={mallLage.mallar.map((m) => ({ value: m.id, label: `${m.name} · ${formatTimmar(mallensVeckotimmar(m.items))}/vecka` }))}
              value={mallId}
              onChange={(e) => setMallId(e.target.value)}
              error={forsokt ? fel.mall ?? undefined : undefined}
              fullWidth
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="tillampa-start" label="Startdatum" type="date" value={start} onChange={(e) => setStart(e.target.value)} error={forsokt ? fel.start ?? undefined : undefined} fullWidth />
              <Input id="tillampa-slut" label="Slutdatum" type="date" value={slut} onChange={(e) => setSlut(e.target.value)} error={forsokt ? fel.slut ?? undefined : undefined} hint="Förslag: 12 veckor" fullWidth />
            </div>

            <fieldset className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
              <legend className="px-1 text-sm font-semibold text-stone-900 dark:text-stone-100">Veckomål</legend>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Lagen: högst 40 timmar per vecka, 10 timmar mindre vid barn under 8 år, proportionellt lägre vid deltidsarbete.
              </p>
              <Checkbox
                id="tillampa-barn"
                label="Barn under 8 år i hushållet"
                checked={barnUnder8}
                onChange={(e) => setBarnUnder8(e.target.checked)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="tillampa-deltid"
                  label="Deltidsarbete, timmar per vecka"
                  type="number"
                  min={0}
                  max={40}
                  value={deltid}
                  onChange={(e) => setDeltid(e.target.value)}
                  placeholder="0"
                  fullWidth
                />
                <Input
                  id="tillampa-veckomal"
                  label="Veckomål, timmar"
                  type="number"
                  min={0}
                  max={40}
                  step={0.5}
                  value={veckomalVisat}
                  onChange={(e) => { setMalRortManuellt(true); setVeckomal(e.target.value) }}
                  hint={`Förslag enligt lagen: ${forslag} h`}
                  error={forsokt ? fel.veckomal ?? undefined : undefined}
                  fullWidth
                />
              </div>
              {avviker && (
                <Textarea
                  id="tillampa-motivering"
                  label="Motivering till avvikelsen"
                  value={motivering}
                  onChange={(e) => setMotivering(e.target.value)}
                  rows={2}
                  error={forsokt ? fel.motivering ?? undefined : undefined}
                  hint="Krävs när målet avviker från förslaget. Står med i planen."
                  fullWidth
                />
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="tillampa-jobbsok"
                label="Tid för eget jobbsökande, h/vecka"
                type="number"
                min={0}
                step={0.5}
                value={jobbsok}
                onChange={(e) => setJobbsok(e.target.value)}
                hint="Ska framgå av planen. Räknas inte som anvisad aktivitet."
                fullWidth
              />
              <Input id="tillampa-beslut" label="Beslutsdatum" type="date" value={beslutsdatum} onChange={(e) => setBeslutsdatum(e.target.value)} fullWidth />
            </div>

            <Textarea
              id="tillampa-plantext"
              label="Plan i text"
              value={planText}
              onChange={(e) => setPlanText(e.target.value)}
              rows={4}
              placeholder="Mål, anpassningar och överenskommelser. Skrivs av dig, inte av någon modell."
              fullWidth
            />

            <p role="status" aria-live="polite" className="text-sm rounded-xl bg-stone-100 dark:bg-stone-800 px-4 py-3 text-stone-700 dark:text-stone-200">
              {mall
                ? `${antalPass} pass genereras ur "${mall.name}" mellan ${start} och ${slut}. Passen går att ändra ett och ett efteråt.`
                : 'Välj en mall så visas hur många pass som genereras.'}
            </p>

            {sparfel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{sparfel}</p>}
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button type="button" variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button type="button" onClick={skapa} disabled={sparar || mallLage.status !== 'klart' || mallLage.mallar.length === 0}>
          {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
          Skapa plan
        </Button>
      </div>
    </Dialog>
  )
}
