/**
 * OrganisationSektion — konsulentens organisation, kollegor och (för chef)
 * caseload per konsulent (KM2). Ersätter den hårdkodade tomma teamlistan i
 * SettingsTab.
 *
 * Självbetjäning (KM2 steg 3): chef/admin lägger till kollegor på e-post,
 * byter roll och tar bort — genom vyn organization_colleagues, där en
 * INSTEAD OF-trigger i databasen är den som bestämmer (bara chef/admin i
 * organisationen, bara admin ger admin, sista chef/admin kan inte tas bort,
 * ingen ändrar sitt eget medlemskap). Databasens felmeddelanden är på svenska
 * och visas rakt av. Ingen inbjudan via mejl — DE1 blockerar utskick.
 *
 * Överlämning (KM2 steg 4): chef/admin flyttar HELA caseloaden från en
 * konsulent till en annan i organisationen — vyn organization_handover,
 * INSTEAD OF-trigger. Chefen behöver inte se deltagarna för det (bara tal).
 * Journal, mål och möten flyttas inte förrän ett beslut om arkivering finns
 * (KS2) — UI:t säger det rakt ut.
 *
 * Tre lägen: laddar / fel / klart. Utan medlemskap: ärlig text, ingen knapp
 * som inte gör något — organisationer läggs upp av superadmin i piloten.
 * Konsulentvyn översätts inte (DESIGN.md §2): svenska literaler.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Users, BarChart3, UserPlus, Trash2, ArrowRight } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import {
  orgApi,
  felText,
  ORG_KIND_ETIKETT,
  ORG_ROLL_ETIKETT,
  ORG_ROLLER,
  type CaseloadRow,
  type Colleague,
  type Organization,
  type OrgMembership,
  type OrgRole,
} from '@/services/orgApi'

type Medlemskap = OrgMembership & { organization: Organization }

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; medlemskap: Medlemskap[]; kollegor: Colleague[]; caseload: CaseloadRow[] | null }

function namn(c: { first_name: string | null; last_name: string | null; email?: string | null }): string {
  const n = [c.first_name, c.last_name].filter(Boolean).join(' ').trim()
  return n || c.email || 'Namn saknas'
}

function arLedning(role: OrgRole): boolean {
  return role === 'chef' || role === 'admin'
}

export function OrganisationSektion() {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const [caseloadBesked, setCaseloadBesked] = useState<string | null>(null)
  const [caseloadFel, setCaseloadFel] = useState<string | null>(null)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const medlemskap = await orgApi.myMemberships()
        if (medlemskap.length === 0) {
          if (aktiv) setLage({ status: 'klart', medlemskap: [], kollegor: [], caseload: null })
          return
        }
        const arChef = medlemskap.some((m) => arLedning(m.role))
        const [kollegor, caseload] = await Promise.all([
          orgApi.colleagues(),
          arChef ? orgApi.caseload() : Promise.resolve(null),
        ])
        if (aktiv) setLage({ status: 'klart', medlemskap, kollegor, caseload })
      } catch (e) {
        if (aktiv) setLage({ status: 'fel', fel: e instanceof Error ? e.message : 'Okänt fel' })
      }
    })()
    return () => {
      aktiv = false
    }
  }, [omgang])

  const ladda = () => {
    setLage({ status: 'laddar' })
    setOmgang((n) => n + 1)
  }

  // Efter en lyckad ändring (kollega tillagd, roll bytt, borttagen) hämtas
  // listan om UTAN att gå till "laddar": annars monteras organisationen om och
  // beskedet ("X är tillagd") försvinner i samma ögonblick som det visas.
  const laddaTyst = () => setOmgang((n) => n + 1)

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Din organisation</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">Kollegor och, om du är chef, caseload per konsulent.</p>
        </div>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Hämtar organisation…" />}
      {lage.status === 'fel' && (
        <ErrorState title="Organisationen kunde inte hämtas" message={lage.fel} onRetry={ladda} />
      )}

      {lage.status === 'klart' && lage.medlemskap.length === 0 && (
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Du tillhör ingen organisation än. Organisationer läggs upp av Jobin i samband med pilot — hör av dig.
        </p>
      )}

      {lage.status === 'klart' && lage.medlemskap.length > 0 && (
        <div className="space-y-6">
          {lage.medlemskap.map((m) => (
            <Organisation
              key={m.id}
              medlemskap={m}
              kollegor={lage.kollegor.filter((k) => k.org_id === m.org_id)}
              onAndrad={laddaTyst}
            />
          ))}

          {lage.caseload && (
            <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-stone-500" aria-hidden="true" />
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">Caseload</h4>
              </div>
              {lage.caseload.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">Inga konsulenter i organisationen än.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                        <th className="py-2 pr-3 font-medium">Konsulent</th>
                        <th className="py-2 pr-3 font-medium">Deltagare</th>
                        <th className="py-2 pr-3 font-medium">Aktiva planer</th>
                        <th className="py-2 pr-3 font-medium">Ogiltig frånvaro 30 d</th>
                        <th className="py-2 font-medium"><span className="sr-only">Åtgärd</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lage.caseload.map((r) => (
                        <CaseloadRad
                          key={`${r.org_id}-${r.consultant_id}`}
                          rad={r}
                          mottagare={lage.kollegor.filter((k) => k.org_id === r.org_id && k.user_id !== r.consultant_id && arMottagarroll(k.role))}
                          visaOrg={lage.medlemskap.length > 1}
                          onKlar={(besked) => {
                            setCaseloadFel(null)
                            setCaseloadBesked(besked)
                            laddaTyst()
                          }}
                          onFel={(fel) => {
                            setCaseloadBesked(null)
                            setCaseloadFel(fel)
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {caseloadFel && (
                <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                  {caseloadFel}
                </p>
              )}
              {caseloadBesked && !caseloadFel && (
                <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {caseloadBesked}
                </p>
              )}
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                Bara tal. Namn på deltagare, journal och mående syns inte här.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function arMottagarroll(role: OrgRole): boolean {
  return role === 'konsulent' || role === 'chef' || role === 'admin'
}

// ---------------------------------------------------------------------------
// PG19 / F13 (2026-09-13): organisationens AI-brytare, för chef/admin.
//
// Vad brytaren faktiskt gör (läst ur _shared/aiGate.ts checkOrgAiEnabled och
// client/api/ai.js checkOrgAiEnabled): en deltagare som är kopplad till en
// konsulent i den här organisationen nekas ALLA AI-funktioner i portalen —
// CV-hjälp, personligt brev, intervjuträning, AI-teamet, lönekompassen,
// företagssök m.fl. — med beskedet "AI-funktionerna är avstängda av <org>".
// Deltagarens egna AI-val påverkas inte i övrigt; brytaren ligger ovanpå.
// Konsulentens egna verktyg (rapportutkast) går genom samma grind.
// ---------------------------------------------------------------------------
function AiBrytare({ organisation, onAndrad }: { organisation: Organization; onAndrad: () => void }) {
  const { confirm } = useConfirmDialog()
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const pa = organisation.ai_enabled

  const vaxla = async () => {
    setFel(null)
    const ok = await confirm({
      title: pa ? `Stäng av AI för ${organisation.name}?` : `Slå på AI för ${organisation.name}?`,
      message: pa
        ? 'Alla deltagare som är kopplade till organisationens konsulenter nekas AI-funktionerna (CV-hjälp, personligt brev, intervjuträning, AI-teamet, lönekompassen med flera). De ser beskedet "AI-funktionerna är avstängda av din organisation". Deras egna texter skickas inte längre till någon modell. Du kan slå på igen när som helst.'
        : 'Deltagarna får använda AI-funktionerna igen, enligt sina egna inställningar. Text de skriver i AI-verktygen behandlas hos OpenRouter i USA — se integritetspolicyn.',
      confirmText: pa ? 'Stäng av AI' : 'Slå på AI',
      cancelText: 'Avbryt',
    })
    if (!ok) return
    setSparar(true)
    try {
      await orgApi.setOrgAiEnabled(organisation.id, !pa)
      onAndrad()
    } catch (e) {
      setFel(felText(e))
    } finally {
      setSparar(false)
    }
  }

  return (
    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-stone-900 dark:text-stone-100">AI-funktioner för era deltagare</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {pa
              ? 'På — deltagare kopplade till era konsulenter kan använda AI-verktygen enligt sina egna val.'
              : 'Av — deltagare kopplade till era konsulenter nekas alla AI-funktioner och ser att organisationen stängt av dem.'}
          </p>
        </div>
        <Button
          size="sm"
          variant={pa ? 'ghost' : 'primary'}
          disabled={sparar}
          onClick={() => void vaxla()}
          aria-pressed={pa}
          aria-label={pa ? `Stäng av AI för ${organisation.name}` : `Slå på AI för ${organisation.name}`}
        >
          {sparar ? 'Sparar…' : pa ? 'Stäng av AI' : 'Slå på AI'}
        </Button>
      </div>
      {fel && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{fel}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// En rad i caseload-tabellen, med överlämning för rader som har deltagare
// ---------------------------------------------------------------------------

function CaseloadRad({
  rad: r,
  mottagare,
  visaOrg,
  onKlar,
  onFel,
}: {
  rad: CaseloadRow
  mottagare: Colleague[]
  visaOrg: boolean
  onKlar: (besked: string) => void
  onFel: (fel: string) => void
}) {
  const { confirm } = useConfirmDialog()
  const [oppen, setOppen] = useState(false)
  const [tillId, setTillId] = useState('')
  const [sparar, setSparar] = useState(false)
  const panelId = `overlamning-${r.org_id}-${r.consultant_id}`
  const vald = mottagare.find((k) => k.user_id === tillId) ?? null

  const overlamna = async () => {
    if (!vald) return
    const ok = await confirm({
      title: `Överlämna deltagarna hos ${namn(r)} till ${namn(vald)}?`,
      message: `Alla ${r.antal_deltagare} deltagare flyttas till ${namn(vald)}. Deltagarna får en notis och en ny samtyckesfråga. Journal, mål och möten stannar hos den tidigare konsulenten tills ett beslut om arkivering finns.`,
      confirmText: `Överlämna ${r.antal_deltagare} deltagare`,
      cancelText: 'Avbryt',
      variant: 'warning',
    })
    if (!ok) return
    setSparar(true)
    try {
      const antal = await orgApi.handover(r.org_id, r.consultant_id, vald.user_id)
      setOppen(false)
      setTillId('')
      onKlar(`${antal} deltagare överlämnade till ${namn(vald)}.`)
    } catch (e) {
      onFel(felText(e))
    } finally {
      setSparar(false)
    }
  }

  return (
    <>
      <tr className="border-t border-stone-200 dark:border-stone-700">
        <td className="py-2 pr-3 text-stone-900 dark:text-stone-100">
          {namn(r)}
          <span className="block text-xs text-stone-500 dark:text-stone-400">
            {ORG_ROLL_ETIKETT[r.role]}
            {visaOrg ? ` · ${r.org_name}` : ''}
          </span>
        </td>
        <td className="py-2 pr-3 tabular-nums text-stone-900 dark:text-stone-100">
          {r.antal_deltagare === 0 ? <span className="text-stone-500 dark:text-stone-400">Inga deltagare än</span> : r.antal_deltagare}
        </td>
        <td className="py-2 pr-3 tabular-nums text-stone-900 dark:text-stone-100">{r.antal_aktiva_planer}</td>
        <td
          className={cn(
            'py-2 pr-3 tabular-nums',
            r.ogiltig_franvaro_30d > 0 ? 'text-red-700 dark:text-red-300 font-medium' : 'text-stone-900 dark:text-stone-100',
          )}
        >
          {r.ogiltig_franvaro_30d}
        </td>
        <td className="py-2">
          {r.antal_deltagare > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOppen((o) => !o)}
              aria-expanded={oppen}
              aria-controls={panelId}
              disabled={sparar}
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              Överlämna deltagare…
            </Button>
          )}
        </td>
      </tr>
      {oppen && r.antal_deltagare > 0 && (
        <tr className="bg-stone-50 dark:bg-stone-800">
          <td colSpan={5} className="p-3">
            <div id={panelId} className="space-y-2">
              {mottagare.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Ingen annan arbetskonsulent, chef eller administratör i organisationen att lämna över till. Lägg till en kollega först.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-end gap-2">
                    <Select
                      id={`${panelId}-till`}
                      label="Lämna över till"
                      value={tillId}
                      onChange={(e) => setTillId(e.target.value)}
                      disabled={sparar}
                      fullWidth={false}
                      options={[{ value: '', label: 'Välj kollega' }, ...mottagare.map((k) => ({ value: k.user_id, label: `${namn(k)} · ${ORG_ROLL_ETIKETT[k.role]}` }))]}
                    />
                    <Button size="sm" onClick={() => void overlamna()} disabled={!vald || sparar}>
                      {sparar ? 'Överlämnar…' : `Överlämna ${r.antal_deltagare} deltagare`}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setOppen(false)} disabled={sparar}>
                      Avbryt
                    </Button>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {vald
                      ? `Alla ${r.antal_deltagare} deltagare flyttas till ${namn(vald)}. `
                      : `Alla ${r.antal_deltagare} deltagare flyttas till den du väljer. `}
                    Deltagarna får en notis och en ny samtyckesfråga. Journal, mål och möten stannar hos den tidigare konsulenten tills ett beslut om arkivering finns.
                  </p>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// En organisation: rubrik, kollegor, och för chef/admin självbetjäningen
// ---------------------------------------------------------------------------

function Organisation({
  medlemskap: m,
  kollegor,
  onAndrad,
}: {
  medlemskap: Medlemskap
  kollegor: Colleague[]
  onAndrad: () => void
}) {
  const { confirm } = useConfirmDialog()
  const jagArLedning = arLedning(m.role)
  const jagArAdmin = m.role === 'admin'
  const [fel, setFel] = useState<string | null>(null)
  const [besked, setBesked] = useState<string | null>(null)
  const [sparar, setSparar] = useState<string | null>(null)

  const bytRoll = async (k: Colleague, roll: OrgRole) => {
    setFel(null)
    setBesked(null)
    setSparar(k.id)
    try {
      await orgApi.setColleagueRole(k.id, roll)
      setBesked(`${namn(k)} är nu ${ORG_ROLL_ETIKETT[roll].toLowerCase()}.`)
      onAndrad()
    } catch (e) {
      setFel(felText(e))
    } finally {
      setSparar(null)
    }
  }

  const taBort = async (k: Colleague) => {
    const ok = await confirm({
      title: `Ta bort ${namn(k)} ur ${m.organization.name}?`,
      message: 'Personen förlorar tillgången till organisationens mallar, katalog och caseload. Deltagarkopplingar påverkas inte.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    setFel(null)
    setBesked(null)
    setSparar(k.id)
    try {
      await orgApi.removeColleague(k.id)
      setBesked(`${namn(k)} är borttagen.`)
      onAndrad()
    } catch (e) {
      setFel(felText(e))
    } finally {
      setSparar(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-medium text-stone-900 dark:text-stone-100">{m.organization.name}</p>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {ORG_KIND_ETIKETT[m.organization.kind]}
          {m.organization.org_number ? ` · org.nr ${m.organization.org_number}` : ''}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-solid)]">
          Din roll: {ORG_ROLL_ETIKETT[m.role]}
        </span>
      </div>

      {jagArLedning && (
        <AiBrytare organisation={m.organization} onAndrad={onAndrad} />
      )}

      <ul className="space-y-2" aria-label={`Kollegor i ${m.organization.name}`}>
        {kollegor.map((k) => {
          const arJag = k.user_id === m.user_id
          const farAndra = jagArLedning && !arJag && (jagArAdmin || k.role !== 'admin')
          return (
            <li
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl"
            >
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {namn(k)}
                  {arJag && <span className="text-stone-500 dark:text-stone-400 font-normal"> (du)</span>}
                </p>
                {k.email && (
                  <a href={`mailto:${k.email}`} className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:underline">
                    {k.email}
                  </a>
                )}
              </div>
              {farAndra ? (
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`Roll för ${namn(k)}`}
                    value={k.role}
                    disabled={sparar === k.id}
                    onChange={(e) => void bytRoll(k, e.target.value as OrgRole)}
                    fullWidth={false}
                    options={ORG_ROLLER.filter((r) => jagArAdmin || r !== 'admin').map((r) => ({ value: r, label: ORG_ROLL_ETIKETT[r] }))}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={sparar === k.id}
                    onClick={() => void taBort(k)}
                    aria-label={`Ta bort ${namn(k)}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Ta bort
                  </Button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                  {ORG_ROLL_ETIKETT[k.role]}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {jagArLedning && (
        <LaggTillKollega
          orgId={m.org_id}
          orgNamn={m.organization.name}
          jagArAdmin={jagArAdmin}
          onTillagd={(text) => {
            setFel(null)
            setBesked(text)
            onAndrad()
          }}
        />
      )}

      {fel && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {fel}
        </p>
      )}
      {besked && !fel && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {besked}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formuläret "Lägg till kollega"
// ---------------------------------------------------------------------------

function LaggTillKollega({
  orgId,
  orgNamn,
  jagArAdmin,
  onTillagd,
}: {
  orgId: string
  orgNamn: string
  jagArAdmin: boolean
  onTillagd: (besked: string) => void
}) {
  const [epost, setEpost] = useState('')
  const [roll, setRoll] = useState<OrgRole>('konsulent')
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  const roller = ORG_ROLLER.filter((r) => jagArAdmin || r !== 'admin')

  const skicka = async (e: FormEvent) => {
    e.preventDefault()
    const adress = epost.trim()
    if (!adress || !adress.includes('@')) {
      setFel('Skriv en e-postadress.')
      return
    }
    setFel(null)
    setSparar(true)
    try {
      await orgApi.addColleagueByEmail(orgId, adress, roll)
      setEpost('')
      onTillagd(`${adress} är tillagd i ${orgNamn}.`)
    } catch (err) {
      setFel(felText(err))
    } finally {
      setSparar(false)
    }
  }

  return (
    <form onSubmit={(e) => void skicka(e)} className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3" aria-label={`Lägg till kollega i ${orgNamn}`}>
      <div className="flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-stone-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Lägg till kollega</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px_auto] gap-2 items-end">
        <Input
          id={`kollega-epost-${orgId}`}
          label="E-post"
          type="email"
          autoComplete="off"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          placeholder="fornamn.efternamn@kommun.se"
          disabled={sparar}
        />
        <Select
          id={`kollega-roll-${orgId}`}
          label="Roll"
          value={roll}
          onChange={(e) => setRoll(e.target.value as OrgRole)}
          disabled={sparar}
          options={roller.map((r) => ({ value: r, label: ORG_ROLL_ETIKETT[r] }))}
        />
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Lägger till…' : 'Lägg till'}
        </Button>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Personen behöver redan ha ett konto på jobin.se. Inbjudan via mejl kommer när utskick fungerar.
      </p>
      {fel && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {fel}
        </p>
      )}
    </form>
  )
}
