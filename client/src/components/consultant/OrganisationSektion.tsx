/**
 * OrganisationSektion — konsulentens organisation, kollegor och (för chef)
 * caseload per konsulent (KM2). Ersätter den hårdkodade tomma teamlistan i
 * SettingsTab.
 *
 * Tre lägen: laddar / fel / klart. Utan medlemskap: ärlig text, ingen knapp
 * som inte gör något — organisationer läggs upp av superadmin i piloten.
 * Konsulentvyn översätts inte (DESIGN.md §2): svenska literaler.
 */

import { useEffect, useState } from 'react'
import { Users, BarChart3 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import {
  orgApi,
  ORG_KIND_ETIKETT,
  ORG_ROLL_ETIKETT,
  type CaseloadRow,
  type Colleague,
  type Organization,
  type OrgMembership,
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

export function OrganisationSektion() {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const medlemskap = await orgApi.myMemberships()
        if (medlemskap.length === 0) {
          if (aktiv) setLage({ status: 'klart', medlemskap: [], kollegor: [], caseload: null })
          return
        }
        const arChef = medlemskap.some((m) => m.role === 'chef' || m.role === 'admin')
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
          {lage.medlemskap.map((m) => {
            const kollegor = lage.kollegor.filter((k) => k.org_id === m.org_id)
            return (
              <div key={m.id} className="space-y-3">
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

                <ul className="space-y-2" aria-label={`Kollegor i ${m.organization.name}`}>
                  {kollegor.map((k) => (
                    <li
                      key={k.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-stone-900 dark:text-stone-100">
                          {namn(k)}
                          {k.user_id === m.user_id && <span className="text-stone-500 dark:text-stone-400 font-normal"> (du)</span>}
                        </p>
                        {k.email && (
                          <a href={`mailto:${k.email}`} className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:underline">
                            {k.email}
                          </a>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                        {ORG_ROLL_ETIKETT[k.role]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

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
                        <th className="py-2 font-medium">Ogiltig frånvaro 30 d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lage.caseload.map((r) => (
                        <tr key={`${r.org_id}-${r.consultant_id}`} className="border-t border-stone-200 dark:border-stone-700">
                          <td className="py-2 pr-3 text-stone-900 dark:text-stone-100">
                            {namn(r)}
                            <span className="block text-xs text-stone-500 dark:text-stone-400">
                              {ORG_ROLL_ETIKETT[r.role]}
                              {lage.medlemskap.length > 1 ? ` · ${r.org_name}` : ''}
                            </span>
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-stone-900 dark:text-stone-100">
                            {r.antal_deltagare === 0 ? <span className="text-stone-500 dark:text-stone-400">Inga deltagare än</span> : r.antal_deltagare}
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-stone-900 dark:text-stone-100">{r.antal_aktiva_planer}</td>
                          <td
                            className={cn(
                              'py-2 tabular-nums',
                              r.ogiltig_franvaro_30d > 0 ? 'text-red-700 dark:text-red-300 font-medium' : 'text-stone-900 dark:text-stone-100',
                            )}
                          >
                            {r.ogiltig_franvaro_30d}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
