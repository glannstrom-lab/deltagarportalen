/**
 * OrganisationerTab — superadmin skapar organisationer (kommun/leverantör)
 * och hanterar medlemskap (KM2). Medlemmar väljs ur panelens redan hämtade
 * användarlista (prop), ingen egen hämtning av profiles.
 *
 * Bara superadmin når panelen; RLS släpper bara igenom is_admin_or_superadmin()
 * för skrivning. Ingen självbetjäning för org-admin ännu (se orgApi.ts).
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, Building2 } from '@/components/ui/icons'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  orgAdminApi,
  ORG_KIND_ETIKETT,
  ORG_ROLL_ETIKETT,
  ORG_ROLLER,
  type Organization,
  type OrgKind,
  type OrgMembership,
  type OrgRole,
} from '@/services/orgApi'

export interface PanelUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

interface Props {
  users: PanelUser[]
}

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; orgs: Organization[]; medlemmar: Record<string, OrgMembership[]> }

function namn(u: PanelUser | undefined): string {
  if (!u) return 'Okänd användare'
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return n || u.email
}

function felText(e: unknown): string {
  return e instanceof Error ? e.message : 'Okänt fel'
}

export function OrganisationerTab({ users }: Props) {
  const { confirm } = useConfirmDialog()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const [vald, setVald] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [visaNy, setVisaNy] = useState(false)
  const [sparAi, setSparAi] = useState<string | null>(null)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const orgs = await orgAdminApi.listOrganizations()
        const listor = await Promise.all(orgs.map((o) => orgAdminApi.listMembers(o.id)))
        const medlemmar: Record<string, OrgMembership[]> = {}
        orgs.forEach((o, i) => {
          medlemmar[o.id] = listor[i]
        })
        if (aktiv) setLage({ status: 'klart', orgs, medlemmar })
      } catch (e) {
        if (aktiv) setLage({ status: 'fel', fel: felText(e) })
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

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  if (lage.status === 'laddar') return <LoadingState message="Hämtar organisationer…" />
  if (lage.status === 'fel') return <ErrorState title="Organisationerna kunde inte hämtas" message={lage.fel} onRetry={ladda} />

  const { orgs, medlemmar } = lage
  const valdOrg = orgs.find((o) => o.id === vald) ?? null

  const uppdateraMedlemmar = (orgId: string, rader: OrgMembership[]) =>
    setLage({ status: 'klart', orgs, medlemmar: { ...medlemmar, [orgId]: rader } })

  const handleSkapad = (org: Organization) => {
    setLage({ status: 'klart', orgs: [...orgs, org].sort((a, b) => a.name.localeCompare(b.name, 'sv')), medlemmar: { ...medlemmar, [org.id]: [] } })
    setVisaNy(false)
    setVald(org.id)
  }

  // PUB-avvikelse 5: AI-brytare per organisation. Läses av båda AI-grindarna
  // (client/api/ai.js och supabase/functions/_shared/aiGate.ts) med service role
  // via consultant_participants → organization_members → organizations.
  const vaxlaAi = async (org: Organization) => {
    setFel(null)
    setSparAi(org.id)
    try {
      const uppdaterad = await orgAdminApi.updateOrganization(org.id, { ai_enabled: !org.ai_enabled })
      setLage({ status: 'klart', orgs: orgs.map((o) => (o.id === org.id ? { ...o, ai_enabled: uppdaterad.ai_enabled } : o)), medlemmar })
    } catch (e) {
      setFel(`Kunde inte ändra AI-brytaren: ${felText(e)}`)
    } finally {
      setSparAi(null)
    }
  }

  const taBortOrg = async (org: Organization) => {
    const ok = await confirm({
      title: `Ta bort ${org.name}?`,
      message: 'Medlemskapen försvinner. Planer och mallar som pekar på organisationen behålls men tappar kopplingen.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    setFel(null)
    try {
      await orgAdminApi.deleteOrganization(org.id)
      const rest = { ...medlemmar }
      delete rest[org.id]
      setLage({ status: 'klart', orgs: orgs.filter((o) => o.id !== org.id), medlemmar: rest })
      if (vald === org.id) setVald(null)
    } catch (e) {
      setFel(`Kunde inte ta bort organisationen: ${felText(e)}`)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Medlemmar kan bara läggas till här tills självbetjäning för organisationens administratör finns. Chef och administratör ser caseload för sin organisation.
      </p>

      {fel && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
          {fel}
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Organisationer</h2>
        <button
          type="button"
          onClick={() => setVisaNy((v) => !v)}
          aria-expanded={visaNy}
          aria-controls="ny-organisation"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Ny organisation
        </button>
      </div>

      {visaNy && (
        <div id="ny-organisation">
          <NyOrganisationForm onSkapad={handleSkapad} onAvbryt={() => setVisaNy(false)} />
        </div>
      )}

      {orgs.length === 0 && !visaNy && (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <Building2 className="w-10 h-10 mx-auto text-gray-400 mb-3" aria-hidden="true" />
          <p className="font-medium text-gray-900">Inga organisationer än</p>
          <p className="text-sm text-gray-500 mt-1">Skapa den första när en pilotkommun sagt ja.</p>
        </div>
      )}

      {orgs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Namn</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Org.nr</th>
                <th className="px-4 py-3 font-medium">Medlemmar</th>
                <th className="px-4 py-3 font-medium">AI-funktioner</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Åtgärder</span></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className={`border-t border-gray-200 ${vald === o.id ? 'bg-primary-50' : ''}`}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setVald(o.id)}
                      aria-pressed={vald === o.id}
                      className="font-medium text-gray-900 hover:underline text-left"
                    >
                      {o.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{ORG_KIND_ETIKETT[o.kind]}</td>
                  <td className="px-4 py-3 text-gray-700">{o.org_number || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{(medlemmar[o.id] ?? []).length}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={o.ai_enabled}
                      aria-label={`AI-funktioner för ${o.name}s deltagare`}
                      disabled={sparAi === o.id}
                      onClick={() => void vaxlaAi(o)}
                      className={`inline-flex items-center gap-2 text-sm rounded-full px-3 py-1 border ${o.ai_enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'} disabled:opacity-60`}
                    >
                      <span className={`w-2 h-2 rounded-full ${o.ai_enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                      {o.ai_enabled ? 'På' : 'Av'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void taBortOrg(o)}
                      className="inline-flex items-center gap-1 text-sm text-red-700 hover:underline"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Ta bort
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
            AI-funktioner: Av = alla deltagare kopplade till organisationens konsulenter nekas AI-funktioner, oavsett egen inställning. Gäller båda AI-backenderna.
          </p>
        </div>
      )}

      {valdOrg && (
        <Medlemmar
          org={valdOrg}
          rader={medlemmar[valdOrg.id] ?? []}
          users={users}
          userById={userById}
          onFel={setFel}
          onUppdaterad={(rader) => uppdateraMedlemmar(valdOrg.id, rader)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function NyOrganisationForm({ onSkapad, onAvbryt }: { onSkapad: (o: Organization) => void; onAvbryt: () => void }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<OrgKind>('kommun')
  const [orgNumber, setOrgNumber] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const spara = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFel('Organisationen behöver ett namn')
      return
    }
    setSparar(true)
    setFel(null)
    try {
      const org = await orgAdminApi.createOrganization({ name, kind, org_number: orgNumber || null })
      onSkapad(org)
    } catch (err) {
      setFel(`Kunde inte skapa organisationen: ${felText(err)}`)
    } finally {
      setSparar(false)
    }
  }

  return (
    <form onSubmit={spara} className="bg-white p-5 rounded-lg border border-gray-200 space-y-4">
      <h3 className="font-semibold text-gray-900">Ny organisation</h3>
      {fel && <p role="alert" className="text-sm text-red-700">{fel}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block text-sm">
          <span className="text-gray-700">Namn</span>
          <input
            id="ny-org-namn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Typ</span>
          <select
            id="ny-org-typ"
            value={kind}
            onChange={(e) => setKind(e.target.value as OrgKind)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {(Object.keys(ORG_KIND_ETIKETT) as OrgKind[]).map((k) => (
              <option key={k} value={k}>{ORG_KIND_ETIKETT[k]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Org.nr (valfritt)</span>
          <input
            id="ny-org-orgnr"
            type="text"
            value={orgNumber}
            onChange={(e) => setOrgNumber(e.target.value)}
            placeholder="212000-0000"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={sparar} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
          {sparar ? 'Skapar…' : 'Skapa organisation'}
        </button>
        <button type="button" onClick={onAvbryt} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Avbryt
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------

function Medlemmar({
  org,
  rader,
  users,
  userById,
  onFel,
  onUppdaterad,
}: {
  org: Organization
  rader: OrgMembership[]
  users: PanelUser[]
  userById: Map<string, PanelUser>
  onFel: (fel: string | null) => void
  onUppdaterad: (rader: OrgMembership[]) => void
}) {
  const { confirm } = useConfirmDialog()
  const [sok, setSok] = useState('')
  const [valdUser, setValdUser] = useState<string>('')
  const [roll, setRoll] = useState<OrgRole>('konsulent')
  const [sparar, setSparar] = useState(false)

  const redanMedlem = new Set(rader.map((r) => r.user_id))
  const q = sok.trim().toLowerCase()
  const traffar = q.length < 2
    ? []
    : users
        .filter((u) => !redanMedlem.has(u.id))
        .filter((u) => u.email.toLowerCase().includes(q) || namn(u).toLowerCase().includes(q))
        .slice(0, 8)

  const laggTill = async () => {
    if (!valdUser) {
      onFel('Välj en användare att lägga till')
      return
    }
    setSparar(true)
    onFel(null)
    try {
      const ny = await orgAdminApi.addMember(org.id, valdUser, roll)
      onUppdaterad([...rader, ny])
      setValdUser('')
      setSok('')
    } catch (e) {
      onFel(`Kunde inte lägga till medlemmen: ${felText(e)}`)
    } finally {
      setSparar(false)
    }
  }

  const bytRoll = async (m: OrgMembership, nyRoll: OrgRole) => {
    onFel(null)
    try {
      const upp = await orgAdminApi.setMemberRole(m.id, nyRoll)
      onUppdaterad(rader.map((r) => (r.id === m.id ? upp : r)))
    } catch (e) {
      onFel(`Kunde inte byta roll: ${felText(e)}`)
    }
  }

  const taBort = async (m: OrgMembership) => {
    const ok = await confirm({
      title: `Ta bort ${namn(userById.get(m.user_id))} ur ${org.name}?`,
      message: 'Personen tappar åtkomst till organisationens mallar och caseload. Kontot finns kvar.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    onFel(null)
    try {
      await orgAdminApi.removeMember(m.id)
      onUppdaterad(rader.filter((r) => r.id !== m.id))
    } catch (e) {
      onFel(`Kunde inte ta bort medlemmen: ${felText(e)}`)
    }
  }

  return (
    <section aria-labelledby="medlemmar-rubrik" className="bg-white p-5 rounded-lg border border-gray-200 space-y-5">
      <h3 id="medlemmar-rubrik" className="font-semibold text-gray-900">
        Medlemmar i {org.name}
      </h3>

      {rader.length === 0 ? (
        <p className="text-sm text-gray-500">Inga medlemmar än.</p>
      ) : (
        <ul className="divide-y divide-gray-200" aria-label={`Medlemmar i ${org.name}`}>
          {rader.map((m) => {
            const u = userById.get(m.user_id)
            return (
              <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{namn(u)}</p>
                  <p className="text-sm text-gray-500">{u?.email ?? m.user_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700">
                    <span className="sr-only">Roll för {namn(u)}</span>
                    <select
                      value={m.role}
                      onChange={(e) => void bytRoll(m, e.target.value as OrgRole)}
                      className="px-2 py-1 border border-gray-300 rounded-lg"
                    >
                      {ORG_ROLLER.map((r) => (
                        <option key={r} value={r}>{ORG_ROLL_ETIKETT[r]}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void taBort(m)}
                    className="inline-flex items-center gap-1 text-sm text-red-700 hover:underline"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Ta bort
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="pt-4 border-t border-gray-200 space-y-3">
        <h4 className="font-medium text-gray-900">Lägg till medlem</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">Sök användare (e-post eller namn)</span>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                id={`sok-medlem-${org.id}`}
                type="text"
                value={sok}
                onChange={(e) => {
                  setSok(e.target.value)
                  setValdUser('')
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Roll</span>
            <select
              id={`roll-medlem-${org.id}`}
              value={roll}
              onChange={(e) => setRoll(e.target.value as OrgRole)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {ORG_ROLLER.map((r) => (
                <option key={r} value={r}>{ORG_ROLL_ETIKETT[r]}</option>
              ))}
            </select>
          </label>
        </div>

        {q.length >= 2 && (
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200" aria-label="Sökträffar">
            {traffar.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Ingen användare matchar, eller alla träffar är redan medlemmar.</li>}
            {traffar.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setValdUser(u.id)}
                  aria-pressed={valdUser === u.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${valdUser === u.id ? 'bg-primary-50' : ''}`}
                >
                  <span className="font-medium text-gray-900">{namn(u)}</span>
                  <span className="text-gray-500"> · {u.email} · {u.role}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => void laggTill()}
          disabled={sparar || !valdUser}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          {sparar ? 'Lägger till…' : 'Lägg till medlem'}
        </button>
      </div>
    </section>
  )
}
