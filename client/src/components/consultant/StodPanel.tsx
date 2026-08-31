/**
 * StodPanel — stödkalkylatorn (spår AG2). Konsulentvyn, medvetet oöversatt
 * (DESIGN.md §2), svenska strängar rakt av.
 *
 * VIKTIGT om vad panelen INTE gör: den räknar aldrig fram ett belopp — se
 * `services/stodMatchning.ts` och `data/anstallningsstod.ts` för varför.
 * Panelen visar bara "kan vara aktuellt / för lite underlag / troligen
 * inte aktuellt" per stödform, plus en länk till Arbetsförmedlingen.
 *
 * VIKTIGT om datan: det finns i dag ingen tabell för personens eller
 * platsens uppgifter (arbetslöshetstid, funktionsnedsättning, etc.) —
 * konsulenten fyller i dem här, i samtalet med deltagaren, varje gång.
 * Inget sparas. Att bygga persistens är ett eget beslut (kräver en
 * migration, se CLAUDE.md om art. 9-lagring), inte en del av AG2.
 *
 * ART. 9: fälten om funktionsnedsättning är hälsonära uppgifter. Den här
 * panelen är BARA för konsulenten. Resultatet får aldrig serialiseras in i
 * något arbetsgivarvänt underlag — se `byggArbetsgivarUnderlag()` i
 * placeringarApi.ts för mönstret att INTE göra samma sak med, och
 * kommentaren i stodMatchning.ts.
 */

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Info,
  ShieldAlert,
  XCircle,
} from '@/components/ui/icons'
import { ANSTALLNINGSSTOD, type Anstallningsstod } from '@/data/anstallningsstod'
import {
  GRUND_LABEL,
  matchaStod,
  starttidVarning,
  tomPersonUppgifter,
  tomPlatsUppgifter,
  type ArbetsgivarTyp,
  type Bedomning,
  type FunktionsnedsattningTyp,
  type MatchningsResultat,
  type PersonUppgifter,
  type PlatsUppgifter,
} from '@/services/stodMatchning'

// ============================================================================
// SMÅ FORMULÄRBYGGSTENAR — tri-state (Ja / Nej / Okänt), inte bara sant/falskt.
// "Okänt" är ett eget läge (regeln om att ett tomt fält inte är en nolla).
// ============================================================================

type TriState = 'ja' | 'nej' | 'okant'

function triStateTillBool(v: TriState): boolean | null {
  if (v === 'ja') return true
  if (v === 'nej') return false
  return null
}

function boolTillTriState(v: boolean | null): TriState {
  if (v === true) return 'ja'
  if (v === false) return 'nej'
  return 'okant'
}

const selectKlass =
  'w-full px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300'
const inputKlass =
  'w-full px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300'
const labelKlass = 'block text-xs font-medium text-stone-600 mb-1'

function TriSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: TriState
  onChange: (v: TriState) => void
}) {
  return (
    <div>
      <span className={labelKlass}>{label}</span>
      <select className={selectKlass} value={value} onChange={(e) => onChange(e.target.value as TriState)}>
        <option value="okant">Okänt</option>
        <option value="ja">Ja</option>
        <option value="nej">Nej</option>
      </select>
    </div>
  )
}

// ============================================================================
// BEDÖMNINGENS UTSEENDE
// ============================================================================

const BEDOMNING_KLASS: Record<Bedomning, string> = {
  kan_vara_aktuellt: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  for_lite_underlag: 'bg-stone-50 border-stone-200 text-stone-700',
  troligen_inte_aktuellt: 'bg-rose-50 border-rose-200 text-rose-900',
}

const BEDOMNING_IKON: Record<Bedomning, React.ComponentType<{ size?: number; className?: string }>> = {
  kan_vara_aktuellt: CheckCircle,
  for_lite_underlag: HelpCircle,
  troligen_inte_aktuellt: XCircle,
}

const BEDOMNING_LABEL: Record<Bedomning, string> = {
  kan_vara_aktuellt: 'Kan vara aktuellt',
  for_lite_underlag: 'För lite underlag',
  troligen_inte_aktuellt: 'Troligen inte aktuellt',
}

function StodResultatKort({ resultat, stod }: { resultat: MatchningsResultat; stod: Anstallningsstod }) {
  const Ikon = BEDOMNING_IKON[resultat.bedomning]
  return (
    <div className={`rounded-xl border p-3.5 ${BEDOMNING_KLASS[resultat.bedomning]}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Ikon size={16} className="shrink-0" />
          <h4 className="text-sm font-semibold">{stod.namn}</h4>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
          {BEDOMNING_LABEL[resultat.bedomning]}
        </span>
      </div>
      <p className="text-xs mt-1.5">{resultat.text}</p>
      {resultat.grund.length > 0 && (
        <ul className="text-xs mt-2 list-disc list-inside space-y-0.5 opacity-90">
          {resultat.grund.map((g) => (
            <li key={g}>{GRUND_LABEL[g] ?? g}</li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
        <span className="text-[11px] opacity-80">Beslut krävs innan anställningen börjar — {resultat.ansokningsansvarig === 'arbetsgivaren' ? 'arbetsgivaren ansöker' : 'ansökan sker via Arbetsförmedlingen'}.</span>
        <a
          href={resultat.lank}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline hover:no-underline"
        >
          Läs mer hos Arbetsförmedlingen <ExternalLink size={12} />
        </a>
      </div>
      {stod.ejBelagt.length > 0 && (
        <details className="mt-2 text-[11px] opacity-80">
          <summary className="cursor-pointer select-none">Vad som inte gick att belägga ({stod.ejBelagt.length})</summary>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            {stod.ejBelagt.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </details>
      )}
      {stod.konsulentErfarenhet && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] rounded-lg bg-black/5 p-2">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>
            <strong>Erfarenhet, inte en regel</strong> — {stod.konsulentErfarenhet.text}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PANELEN
// ============================================================================

export interface StodPanelProps {
  /** Förifyllning från en placering — helt valfritt, panelen fungerar utan. */
  initialArbetsgivartyp?: ArbetsgivarTyp | null
  initialPlaneratStartdatum?: string | null
  deltagarNamn?: string
  companyName?: string
}

export function StodPanel({
  initialArbetsgivartyp = null,
  initialPlaneratStartdatum = null,
  deltagarNamn,
  companyName,
}: StodPanelProps) {
  const [person, setPerson] = useState<PersonUppgifter>(tomPersonUppgifter())
  const [plats, setPlats] = useState<PlatsUppgifter>({
    ...tomPlatsUppgifter(),
    arbetsgivartyp: initialArbetsgivartyp,
    planeratStartdatum: initialPlaneratStartdatum,
  })

  const resultat = useMemo(() => matchaStod(person, plats), [person, plats])
  const varning = useMemo(() => starttidVarning(plats.planeratStartdatum), [plats.planeratStartdatum])

  const funktionsnedsattningTyper: { value: FunktionsnedsattningTyp; label: string }[] = [
    { value: 'kognitiv', label: 'Kognitiv funktionsnedsättning' },
    { value: 'missbruk', label: 'Missbruks-/beroendeproblem' },
    { value: 'psykisk_sjukdom', label: 'Svår psykisk sjukdom' },
    { value: 'lss', label: 'Rätt till insatser enligt LSS' },
    { value: 'fysisk', label: 'Fysisk funktionsnedsättning' },
    { value: 'annan', label: 'Annan' },
  ]

  const toggleTyp = (t: FunktionsnedsattningTyp) => {
    setPerson((p) => {
      const nuvarande = p.funktionsnedsattningTyp ?? []
      const ny = nuvarande.includes(t) ? nuvarande.filter((x) => x !== t) : [...nuvarande, t]
      return { ...p, funktionsnedsattningTyp: ny.length > 0 ? ny : null }
    })
  }

  return (
    <Card variant="flat" padding="lg" className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-stone-500" />
          <h3 className="text-base font-semibold text-stone-900">Stöd som kan vara aktuella</h3>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {deltagarNamn || companyName
            ? `${deltagarNamn ?? 'Deltagaren'}${companyName ? ` hos ${companyName}` : ''} — `
            : ''}
          Fyll i det du vet. Ofullständigt underlag ger &quot;för lite underlag&quot;, aldrig ett gissat svar. Panelen
          räknar aldrig fram ett belopp — kontrollera alltid ersättningens storlek med Arbetsförmedlingen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Personen</h4>
          <div>
            <span className={labelKlass}>Ålder</span>
            <input
              type="number"
              min={16}
              max={100}
              className={inputKlass}
              value={person.alder ?? ''}
              onChange={(e) => setPerson((p) => ({ ...p, alder: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Okänd"
            />
          </div>
          <div>
            <span className={labelKlass}>Arbetslös sedan (datum)</span>
            <input
              type="date"
              className={inputKlass}
              value={person.arbetslosSedan ?? ''}
              onChange={(e) => setPerson((p) => ({ ...p, arbetslosSedan: e.target.value || null }))}
            />
          </div>
          <TriSelect
            label="Inskriven hos Arbetsförmedlingen"
            value={boolTillTriState(person.inskrivenHosAf)}
            onChange={(v) => setPerson((p) => ({ ...p, inskrivenHosAf: triStateTillBool(v) }))}
          />
          <TriSelect
            label="Deltar i jobb- och utvecklingsgarantin"
            value={boolTillTriState(person.deltarIJobbOchUtvecklingsgaranti)}
            onChange={(v) => setPerson((p) => ({ ...p, deltarIJobbOchUtvecklingsgaranti: triStateTillBool(v) }))}
          />
          <TriSelect
            label="Deltar i etableringsprogram"
            value={boolTillTriState(person.deltarIEtableringsprogram)}
            onChange={(v) => setPerson((p) => ({ ...p, deltarIEtableringsprogram: triStateTillBool(v) }))}
          />
          <div>
            <span className={labelKlass}>Dagar i jobbgaranti för ungdomar (med ersättning)</span>
            <input
              type="number"
              min={0}
              className={inputKlass}
              value={person.deltarIUngdomsgarantiDagar ?? ''}
              onChange={(e) =>
                setPerson((p) => ({ ...p, deltarIUngdomsgarantiDagar: e.target.value ? Number(e.target.value) : null }))
              }
              placeholder="Okänt"
            />
          </div>
          <TriSelect
            label="Nyanländ i Sverige"
            value={boolTillTriState(person.arNyanland)}
            onChange={(v) => setPerson((p) => ({ ...p, arNyanland: triStateTillBool(v) }))}
          />
          {person.arNyanland === true && (
            <div>
              <span className={labelKlass}>Datum för uppehållstillstånd/uppehållskort</span>
              <input
                type="date"
                className={inputKlass}
                value={person.uppehallstillstandDatum ?? ''}
                onChange={(e) => setPerson((p) => ({ ...p, uppehallstillstandDatum: e.target.value || null }))}
              />
            </div>
          )}

          <div className="pt-1 border-t border-stone-200">
            <div className="flex items-start gap-1.5 text-[11px] text-stone-500 mb-2 mt-2">
              <ShieldAlert size={13} className="shrink-0 mt-0.5" />
              <span>Hälsonära uppgifter — bara för dig som konsulent. Delas aldrig med arbetsgivaren.</span>
            </div>
            <TriSelect
              label="Funktionsnedsättning som medför nedsatt arbetsförmåga"
              value={boolTillTriState(person.harFunktionsnedsattningSomPaverkarArbetsformaga)}
              onChange={(v) =>
                setPerson((p) => ({ ...p, harFunktionsnedsattningSomPaverkarArbetsformaga: triStateTillBool(v) }))
              }
            />
            {person.harFunktionsnedsattningSomPaverkarArbetsformaga === true && (
              <fieldset className="mt-2">
                <legend className={labelKlass}>Typ (kryssa i det som stämmer)</legend>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {funktionsnedsattningTyper.map((t) => (
                    <label key={t.value} className="inline-flex items-center gap-1.5 text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={person.funktionsnedsattningTyp?.includes(t.value) ?? false}
                        onChange={() => toggleTyp(t.value)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Platsen</h4>
          <div>
            <span className={labelKlass}>Arbetsgivartyp</span>
            <select
              className={selectKlass}
              value={plats.arbetsgivartyp ?? ''}
              onChange={(e) =>
                setPlats((pl) => ({ ...pl, arbetsgivartyp: (e.target.value || null) as ArbetsgivarTyp | null }))
              }
            >
              <option value="">Okänt</option>
              <option value="privat">Privat</option>
              <option value="kommun">Kommun</option>
              <option value="region">Region</option>
              <option value="statlig_myndighet">Statlig myndighet</option>
            </select>
          </div>
          <TriSelect
            label="Har sagt upp personal (arbetsbrist) senaste 12 månaderna"
            value={boolTillTriState(plats.harSagtUppPersonalSenaste12Man)}
            onChange={(v) => setPlats((pl) => ({ ...pl, harSagtUppPersonalSenaste12Man: triStateTillBool(v) }))}
          />
          <div>
            <span className={labelKlass}>Planerat startdatum</span>
            <input
              type="date"
              className={inputKlass}
              value={plats.planeratStartdatum ?? ''}
              onChange={(e) => setPlats((pl) => ({ ...pl, planeratStartdatum: e.target.value || null }))}
            />
          </div>
          {varning && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {varning}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Resultat</h4>
        {resultat.map((r) => (
          <StodResultatKort key={r.stodform} resultat={r} stod={ANSTALLNINGSSTOD.find((s) => s.id === r.stodform)!} />
        ))}
      </div>
    </Card>
  )
}
