/**
 * AndraPassDialog — ändra ett pass, eller det och alla kommande i samma serie
 * på en gång (RK37, rollspelet 2026-09-27).
 *
 * SFT7: passet flyttas till annat datum, serien till annan veckodag.
 *
 * Tidigare gick ett pass bara att ta bort. Ändrades ett mallpass (ny tid, ny
 * lokal) fick konsulenten ta bort och lägga till vecka för vecka. En serie är
 * passen med samma veckodag, tid, rubrik och typ i planen (services/passSerie);
 * redan markerade pass rörs aldrig — de är utfall, inte schema.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { aktivitetsplanApi, type ActivitySession, type PassAndring } from '@/services/aktivitetApi'
import { valbaraPasstyper, type PassTyp } from '@/services/aktivitetSchema'
import { kommandeISerien, serieFlytt } from '@/services/passSerie'
import { isoWeekday } from '@/services/aktivitetSchema'
import { PLAN_PASS_KOLUMNER_FINNS, arFysisktPass, arLeverantorsledd } from '@/services/planMarkning'
import { AKTIVITETSTYP_ETIKETT, AKTIVITETSTYP_ORDNING, VECKODAG_LANG, kortDatum, langtDatum } from './aktivitetEtiketter'
import { PassFlaggorFalt, type Flaggor } from './PassFlaggorFalt'

interface Props {
  session: ActivitySession
  /** Alla pass i planen — serien räknas fram ur dem. */
  allaPass: readonly ActivitySession[]
  onClose: () => void
  /** Antal pass som ändrades. */
  onSparat: (antal: number) => void
  /** Injicerbar för test. */
  kolumnerFinns?: boolean
}

export function AndraPassDialog({ session, allaPass, onClose, onSparat, kolumnerFinns = PLAN_PASS_KOLUMNER_FINNS }: Props) {
  const serie = kommandeISerien(session, allaPass)
  const [omfang, setOmfang] = useState<'ett' | 'serie'>('ett')
  const [form, setForm] = useState({
    start_time: session.start_time,
    end_time: session.end_time,
    title: session.title,
    activity_type: session.activity_type as PassTyp,
    location: session.location ?? '',
  })
  // SFT7: ett pass flyttas till ett datum, en serie till en annan veckodag.
  const [nyttDatum, setNyttDatum] = useState(session.date)
  const [nyVeckodag, setNyVeckodag] = useState(isoWeekday(session.date))
  const passMarkerat = session.attendance !== null
  const [flaggor, setFlaggor] = useState<Flaggor>({ is_provider_led: arLeverantorsledd(session), is_physical: arFysisktPass(session) })
  const [flaggorRorda, setFlaggorRorda] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const flytt = passMarkerat
    ? []
    : omfang === 'serie'
      ? (nyVeckodag !== isoWeekday(session.date) ? serieFlytt(serie, nyVeckodag) : [])
      : (nyttDatum && nyttDatum !== session.date ? [{ id: session.id, date: nyttDatum }] : [])
  const faltAndrade = form.start_time !== session.start_time || form.end_time !== session.end_time
    || form.title !== session.title || form.activity_type !== session.activity_type
    || form.location.trim() !== (session.location ?? '') || (kolumnerFinns && flaggorRorda)

  const valideringsfel = !form.title.trim() ? 'Passet behöver en rubrik' : form.end_time <= form.start_time ? 'Sluttiden måste vara efter starttiden' : null

  const spara = async () => {
    if (valideringsfel) { setFel(valideringsfel); return }
    setSparar(true)
    setFel(null)
    const andring: PassAndring = { ...form, location: form.location.trim() || null }
    // Märkningen skrivs bara när den ändrats: ett omärkt pass ska inte få
    // härledningen inskriven som om någon bestämt den.
    const extra = kolumnerFinns && flaggorRorda ? { ...flaggor } : {}
    try {
      const ids = omfang === 'serie' ? serie.map((s) => s.id) : [session.id]
      // Bara en flytt: ingen fältändring att skriva, och EN notis (om flytten).
      if (flytt.length > 0) await aktivitetsplanApi.flyttaSessions(flytt, { tystNotis: faltAndrade })
      if (flytt.length > 0 && !faltAndrade) { onSparat(flytt.length); return }
      const andrade = await aktivitetsplanApi.updateSessions(ids, andring, extra)
      onSparat(andrade.length)
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Passet kunde inte ändras')
    } finally {
      setSparar(false)
    }
  }

  const sista = serie[serie.length - 1]
  return (
    <Dialog isOpen onClose={onClose} labelledBy="andra-pass-title" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="p-5 border-b border-stone-200 dark:border-stone-700">
        <h2 id="andra-pass-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">Ändra pass</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">{session.title} {kortDatum(session.date)}</p>
      </div>
      <div className="p-5 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-700 dark:text-stone-200">Vilka pass</legend>
          <label className="flex items-center gap-2 text-sm text-stone-800 dark:text-stone-100">
            <input type="radio" name="andra-omfang" checked={omfang === 'ett'} onChange={() => setOmfang('ett')} />
            Bara det här passet
          </label>
          <label className={`flex items-center gap-2 text-sm ${serie.length > 1 ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400'}`}>
            <input type="radio" name="andra-omfang" checked={omfang === 'serie'} disabled={serie.length < 2} onChange={() => setOmfang('serie')} />
            {serie.length > 1
              ? `Det här och alla kommande i serien (${serie.length} pass, det sista ${kortDatum(sista.date)})`
              : 'Det här och alla kommande i serien (inga fler omarkerade pass i serien)'}
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Serien är passen med samma veckodag, tid, rubrik och typ. Markerade pass ändras aldrig.
          </p>
        </fieldset>
        {passMarkerat ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">Passet är markerat och kan inte flyttas till en annan dag.</p>
        ) : omfang === 'serie' ? (
          <div>
            <Select
              id="andra-veckodag"
              label="Veckodag"
              options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: VECKODAG_LANG[n] }))}
              value={String(nyVeckodag)}
              onChange={(e) => setNyVeckodag(Number(e.target.value))}
              fullWidth
            />
            {flytt.length > 0 && (
              <p role="status" className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                {flytt.length} pass flyttas till {VECKODAG_LANG[nyVeckodag].toLowerCase()}ar, i sin egen vecka: {langtDatum(flytt[0].date)}
                {flytt.length > 1 ? ` till ${langtDatum(flytt[flytt.length - 1].date)}` : ''}. Deltagaren får en notis.
              </p>
            )}
          </div>
        ) : (
          <div>
            <Input id="andra-datum" label="Datum" type="date" value={nyttDatum} onChange={(e) => setNyttDatum(e.target.value)} fullWidth />
            {flytt.length > 0 && (
              <p role="status" className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                Passet flyttas från {langtDatum(session.date)} till {langtDatum(nyttDatum)}. Deltagaren får en notis.
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input id="andra-start" label="Start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} fullWidth />
          <Input id="andra-slut" label="Slut" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} fullWidth />
        </div>
        <Input id="andra-rubrik" label="Rubrik" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <Select
          id="andra-typ"
          label="Aktivitetstyp"
          options={valbaraPasstyper(AKTIVITETSTYP_ORDNING).map((t) => ({ value: t, label: AKTIVITETSTYP_ETIKETT[t] }))}
          value={form.activity_type}
          onChange={(e) => setForm({ ...form, activity_type: e.target.value as PassTyp })}
          fullWidth
        />
        <Input id="andra-plats" label="Plats" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} fullWidth />
        {kolumnerFinns && (
          <PassFlaggorFalt idPrefix="andra" varde={flaggor} onChange={(f) => { setFlaggor(f); setFlaggorRorda(true) }} />
        )}
        {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button onClick={() => void spara()} disabled={sparar}>
          {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
          {omfang === 'serie' ? `${flytt.length > 0 && !faltAndrade ? 'Flytta' : 'Ändra'} ${serie.length} pass` : flytt.length > 0 && !faltAndrade ? 'Flytta passet' : 'Spara'}
        </Button>
      </div>
    </Dialog>
  )
}
