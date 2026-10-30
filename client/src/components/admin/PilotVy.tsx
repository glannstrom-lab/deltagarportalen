/**
 * PilotVy (FN8) — hur används piloten, per organisation, de senaste 14 dagarna.
 * Superadmins vy under organisationstabellen. Aggregerat: bara tal, aldrig ett
 * namn eller id på en deltagare eller konsulent.
 *
 * Tre av fem mått kan inte mätas härifrån (superadmin får inte läsa planer,
 * pass och underlag genom RLS) och visas som "—" med en rad om varför — aldrig
 * som 0. Se services/pilotvy.ts.
 * Admin- och konsulentvyn översätts inte (DESIGN.md §2): svenska literaler.
 */

import { useEffect, useState } from 'react'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import type { Organization, OrgMembership } from '@/services/orgApi'
import { AKTIV_DAGAR, pilotvyApi, type PilotRad } from '@/services/pilotvy'

interface Props {
  orgs: Organization[]
  medlemmar: Record<string, OrgMembership[]>
}

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; rader: PilotRad[] }

function Varde({ v, enhet }: { v: number | null; enhet: string }) {
  if (v === null) {
    return (
      <>
        <span aria-hidden="true" className="text-stone-500 dark:text-stone-400">—</span>
        <span className="sr-only">kan inte mätas</span>
      </>
    )
  }
  return (
    <>
      {v}
      <span className="sr-only"> {enhet}</span>
    </>
  )
}

export function PilotVy({ orgs, medlemmar }: Props) {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    let aktiv = true
    const plattaMedlemmar = orgs.flatMap((o) =>
      (medlemmar[o.id] ?? []).map((m) => ({ org_id: o.id, user_id: m.user_id, role: m.role })),
    )
    pilotvyApi
      .hamta(
        orgs.map((o) => ({ id: o.id, name: o.name, kind: o.kind })),
        plattaMedlemmar,
      )
      .then((rader) => aktiv && setLage({ status: 'klart', rader }))
      .catch((e) => aktiv && setLage({ status: 'fel', fel: e instanceof Error ? e.message : 'Okänt fel' }))
    return () => {
      aktiv = false
    }
  }, [orgs, medlemmar, omgang])

  return (
    <section aria-labelledby="pilotvy-rubrik" className="bg-white dark:bg-stone-900 rounded-lg border border-gray-200 dark:border-stone-700 p-5 space-y-3">
      <div>
        <h3 id="pilotvy-rubrik" className="font-semibold text-gray-900 dark:text-stone-100">
          Pilotvy — senaste {AKTIV_DAGAR} dagarna
        </h3>
        <p className="text-sm text-gray-600 dark:text-stone-400">
          Används piloten? Bara tal per organisation, inga uppgifter om enskilda deltagare.
        </p>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Mäter pilotanvändningen…" />}
      {lage.status === 'fel' && (
        <ErrorState
          title="Pilotvyn kunde inte hämtas"
          message={lage.fel}
          onRetry={() => {
            setLage({ status: 'laddar' })
            setOmgang((n) => n + 1)
          }}
        />
      )}

      {lage.status === 'klart' && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Pilotanvändning per organisation, senaste {AKTIV_DAGAR} dagarna</caption>
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-stone-400">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Organisation</th>
                  <th scope="col" className="px-3 py-2 font-medium">Personal</th>
                  <th scope="col" className="px-3 py-2 font-medium">Aktiva konsulenter</th>
                  <th scope="col" className="px-3 py-2 font-medium">Kopplade deltagare</th>
                  <th scope="col" className="px-3 py-2 font-medium">Deltagare med plan</th>
                  <th scope="col" className="px-3 py-2 font-medium">Loggade pass</th>
                  <th scope="col" className="px-3 py-2 font-medium">Nämndunderlag</th>
                </tr>
              </thead>
              <tbody>
                {lage.rader.map((r) => (
                  <tr key={r.orgId} className="border-t border-gray-200 dark:border-stone-700">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-gray-900 dark:text-stone-100">{r.orgNamn}</th>
                    <td className="px-3 py-2 tabular-nums"><Varde v={r.personal} enhet="i personalen" /></td>
                    <td className="px-3 py-2 tabular-nums">
                      <Varde v={r.aktivaKonsulenter} enhet="aktiva" />
                      {r.aktivaKonsulenter !== null && <span className="text-gray-500 dark:text-stone-400"> av {r.personal}</span>}
                    </td>
                    <td className="px-3 py-2 tabular-nums"><Varde v={r.kopplade} enhet="deltagare" /></td>
                    <td className="px-3 py-2 tabular-nums"><Varde v={r.deltagareMedPlan} enhet="deltagare" /></td>
                    <td className="px-3 py-2 tabular-nums"><Varde v={r.loggadePass} enhet="pass" /></td>
                    <td className="px-3 py-2"><Varde v={null} enhet="" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul
            className="text-xs rounded-lg p-3 space-y-1"
            style={{ background: 'var(--s-vantar-bg)', color: 'var(--s-vantar-text)' }}
          >
            <li>
              <strong>Aktiv konsulent</strong> = personal som öppnat en deltagares uppgifter senaste {AKTIV_DAGAR} dagarna (åtkomstloggen).
              Utan personal i organisationen visas &quot;—&quot;.
            </li>
            <li>
              <strong>Deltagare med plan, loggade pass och nämndunderlag</strong> visas som &quot;—&quot;: superadmin får inte läsa
              planer, pass och underlag, och en fråga ger då 0 rader utan fel. De mäts först när databasen har en aggregerad funktion för det.
            </li>
          </ul>
        </>
      )}
    </section>
  )
}
