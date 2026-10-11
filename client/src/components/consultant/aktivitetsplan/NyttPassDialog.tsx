/**
 * NyttPassDialog — "Lägg till pass" i aktivitetsplanen (flyttad ur
 * AktivitetsplanSektion i omtaget "Kvarter", steg 5, 2026-10-11; innehållet
 * är oförändrat). RK28: upprepa varje vecka till planens slut. RR27: märkningen
 * förväljs ur typ och plats tills konsulenten själv ändrar den.
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Input, Select, Checkbox } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { aktivitetsplanApi, type SessionInput } from '@/services/aktivitetApi'
import { valbaraPasstyper, veckovisaDatum, type PassTyp } from '@/services/aktivitetSchema'
import { PLAN_PASS_KOLUMNER_FINNS, forvaldaFlaggor } from '@/services/planMarkning'
import { PassFlaggorFalt, type Flaggor } from '../PassFlaggorFalt'
import { AKTIVITETSTYP_ETIKETT, AKTIVITETSTYP_ORDNING, kortDatum } from '../aktivitetEtiketter'

export interface NyttPassDialogProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  participantId: string
  defaultDate: string
  /** Planens slutdatum — "upprepa varje vecka" går till och med det. */
  planSlut: string | null
  /** Antal pass som lades till (fler än ett vid upprepning). */
  onCreated: (antal: number) => void
}

export function NyttPassDialog(props: NyttPassDialogProps) {
  // Monteras bara öppen: färskt formulär per öppning utan återställande effekt.
  if (!props.isOpen) return null
  return <NyttPassForm {...props} />
}

function NyttPassForm({ isOpen, onClose, planId, participantId, defaultDate, planSlut, onCreated }: NyttPassDialogProps) {
  const [form, setForm] = useState<SessionInput>({ date: defaultDate, start_time: '09:00', end_time: '12:00', title: '', activity_type: 'jobsearch', location: '' })
  // RK28: upprepa varje vecka till planens slut. Utan slutdatum finns inget slut att gå till.
  const [upprepa, setUpprepa] = useState(false)
  // RR27: märkningen förväljs ur typ och plats tills konsulenten själv ändrar den.
  const [egnaFlaggor, setEgnaFlaggor] = useState<Flaggor | null>(null)
  const flaggor = egnaFlaggor ?? forvaldaFlaggor({ activity_type: form.activity_type, location: form.location ?? null })
  const upprepadeDatum = upprepa && planSlut && form.date ? veckovisaDatum(form.date, planSlut) : []
  const [forsokt, setForsokt] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const valideringsfel = !form.title.trim() ? 'Passet behöver en rubrik' : form.end_time <= form.start_time ? 'Sluttiden måste vara efter starttiden' : !form.date ? 'Ange datum' : null

  const spara = async () => {
    setForsokt(true)
    if (valideringsfel) return
    setSparar(true)
    setFel(null)
    try {
      // Märkningen skickas bara när kolumnerna finns — före migrationen är anropen oförändrade.
      const extra = PLAN_PASS_KOLUMNER_FINNS ? [{ ...flaggor }] as const : [] as const
      if (upprepa && planSlut) {
        const skapade = await aktivitetsplanApi.addWeeklySessions(planId, participantId, form, planSlut, ...extra)
        onCreated(skapade.length)
      } else {
        await aktivitetsplanApi.addSession(planId, participantId, form, ...extra)
        onCreated(1)
      }
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Passet kunde inte sparas')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="nytt-pass-title" className="bg-[var(--j-kort)] text-[var(--j-blak)] rounded-[var(--j-r-l)] shadow-[var(--j-skugga-stor)] w-full max-w-lg overflow-hidden">
      <div className="p-5 border-b border-[var(--j-linje)]">
        <h2 id="nytt-pass-title" className="m-0 font-rubrik text-lg font-bold">Lägg till pass</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input id="pass-datum" label="Datum" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth />
          <Input id="pass-start" label="Start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} fullWidth />
          <Input id="pass-slut" label="Slut" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} fullWidth />
        </div>
        <Input id="pass-rubrik" label="Rubrik" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <Select
          id="pass-typ"
          label="Aktivitetstyp"
          options={valbaraPasstyper(AKTIVITETSTYP_ORDNING).map((t) => ({ value: t, label: AKTIVITETSTYP_ETIKETT[t] }))}
          value={form.activity_type}
          onChange={(e) => setForm({ ...form, activity_type: e.target.value as PassTyp })}
          fullWidth
        />
        <Input id="pass-plats" label="Plats" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} fullWidth />
        {PLAN_PASS_KOLUMNER_FINNS && <PassFlaggorFalt idPrefix="pass" varde={flaggor} onChange={setEgnaFlaggor} />}
        <Checkbox
          id="pass-upprepa"
          label="Upprepa varje vecka till planens slut"
          description={!planSlut
            ? 'Planen har inget slutdatum. Lägg passet i en schemamall om det ska gälla tills vidare.'
            : upprepadeDatum.length > 1
              ? `${upprepadeDatum.length} pass, det sista ${kortDatum(upprepadeDatum[upprepadeDatum.length - 1])}.`
              : `Samma veckodag och tid till och med ${kortDatum(planSlut)}.`}
          checked={upprepa}
          disabled={!planSlut}
          onChange={(e) => setUpprepa(e.target.checked)}
        />
        {forsokt && valideringsfel && <p role="alert" className="text-sm text-[var(--s-ogiltig-text)]">{valideringsfel}</p>}
        {fel && <p role="alert" className="text-sm text-[var(--s-ogiltig-text)]">{fel}</p>}
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-[var(--j-linje)]">
        <Button ton="kvarter" variant="tertiary" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button ton="kvarter" variant="primary" onClick={spara} disabled={sparar}>{sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}Lägg till</Button>
      </div>
    </Dialog>
  )
}
