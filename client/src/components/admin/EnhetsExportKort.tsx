/**
 * EnhetsExportKort (FN12) — chef/admin tar ut enhetens data som zip med CSV vid
 * avtalsslut. Visas bara för den som är chef/admin i en organisation.
 *
 * Tre ärlighetsregler:
 *  - Utan tvåstegsinloggning (aal2) nekar databasen chefen planer, pass och
 *    underlag genom att svara med 0 rader. Då erbjuds inget uttag alls.
 *  - Ett uttag där allt är tomt laddas inte ned som "klart".
 *  - Journalen kräver ett aktivt val, och orosanteckningarna ett till.
 * Kortet raderar ingenting. Konsulentvyn översätts inte: svenska literaler.
 */

import { useEffect, useState } from 'react'
import { Download, Loader2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { orgApi, type Organization, type OrgMembership } from '@/services/orgApi'
import { mfaApi } from '@/services/mfaApi'
import { arTom, byggZip, enhetsExportApi, exportFilnamn } from '@/services/enhetsExport'

type Medlemskap = OrgMembership & { organization: Organization }

type Lage =
  | { status: 'laddar' }
  | { status: 'ingen' }
  | { status: 'klart'; orgar: Medlemskap[]; aal2: boolean }

function ladda(bytes: Uint8Array, filnamn: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnamn
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function EnhetsExportKort() {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [valdOrg, setValdOrg] = useState('')
  const [journal, setJournal] = useState(false)
  const [oro, setOro] = useState(false)
  const [arbetar, setArbetar] = useState(false)
  const [besked, setBesked] = useState<{ typ: 'ok' | 'fel'; text: string } | null>(null)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const medlemskap = await orgApi.myMemberships()
        const orgar = medlemskap.filter((m) => m.role === 'chef' || m.role === 'admin')
        if (orgar.length === 0) {
          if (aktiv) setLage({ status: 'ingen' })
          return
        }
        const assurans = await mfaApi.assurans()
        if (aktiv) {
          setValdOrg(orgar[0].org_id)
          setLage({ status: 'klart', orgar, aal2: assurans.nuvarande === 'aal2' })
        }
      } catch {
        // Kortet är ett tillägg: ett fel här ska inte fälla inställningssidan.
        if (aktiv) setLage({ status: 'ingen' })
      }
    })()
    return () => {
      aktiv = false
    }
  }, [])

  if (lage.status !== 'klart') return null

  const org = lage.orgar.find((m) => m.org_id === valdOrg) ?? lage.orgar[0]
  // Demoorganisationer undantas från aal2-kravet i RLS (policyn släpper dem igenom).
  const kanExportera = lage.aal2 || org.organization.is_demo === true

  const exportera = async () => {
    setArbetar(true)
    setBesked(null)
    try {
      const val = { journal, oro: journal && oro }
      const data = await enhetsExportApi.hamta(org.org_id, val)
      if (arTom(data)) {
        setBesked({
          typ: 'fel',
          text: 'Inga planer, pass eller underlag hittades för organisationen. Ingen fil skapades — det kan vara att det inte finns något, eller att du saknar behörighet att läsa det.',
        })
        return
      }
      const nu = new Date()
      ladda(byggZip(org.organization.name, data, val, nu), exportFilnamn(org.organization.name, nu))
      setBesked({
        typ: 'ok',
        text: `Filen är nedladdad: ${data.planer.length} planer, ${data.pass.length} pass, ${data.underlag.length} lämnade underlag, ${data.overforingar.length} överföringar${
          data.journal ? `, ${data.journal.length} journalanteckningar` : ''
        }.`,
      })
    } catch (e) {
      setBesked({ typ: 'fel', text: `Exporten misslyckades: ${e instanceof Error ? e.message : 'okänt fel'}` })
    } finally {
      setArbetar(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-stone-900 dark:text-stone-100">Exportera enhetens data</h3>
      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
        En zip med planer, pass och närvaro, lämnade underlag och överföringar till kommunens system som CSV (semikolon, öppnas direkt i Excel). Det här är en kopia — inget raderas.
      </p>

      {lage.orgar.length > 1 && (
        <label className="block text-sm mt-4">
          <span className="text-stone-700 dark:text-stone-300">Organisation</span>
          <select
            value={valdOrg}
            onChange={(e) => setValdOrg(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800"
          >
            {lage.orgar.map((m) => (
              <option key={m.org_id} value={m.org_id}>{m.organization.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={journal}
            onChange={(e) => {
              setJournal(e.target.checked)
              if (!e.target.checked) setOro(false)
            }}
            className="w-4 h-4 rounded border-stone-300 accent-stone-700"
          />
          <span className="text-sm text-stone-700 dark:text-stone-300">Ta med journalen</span>
        </label>
        <p className="text-xs text-stone-500 dark:text-stone-400 px-1">
          Journalen tas inte med om du inte väljer det. Du får bara de anteckningar du själv har rätt att läsa — andra konsulenters journal ingår inte.
        </p>
        {journal && (
          <label className="flex items-center gap-2 cursor-pointer ml-6">
            <input
              type="checkbox"
              checked={oro}
              onChange={(e) => setOro(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 accent-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">Ta med orosanteckningar</span>
          </label>
        )}
      </div>

      {!kanExportera && (
        <p
          role="status"
          className="mt-4 text-sm rounded-lg p-3"
          style={{ background: 'var(--s-vantar-bg)', color: 'var(--s-vantar-text)' }}
        >
          Exporten kräver tvåstegsinloggning. Utan den svarar databasen med tomma listor, och en tom fil vore missvisande.
        </p>
      )}

      <button
        type="button"
        onClick={() => void exportera()}
        disabled={arbetar || !kanExportera}
        className="mt-4 w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-60"
      >
        <span className="font-medium text-stone-900 dark:text-stone-100">Exportera enhetens data</span>
        {arbetar ? (
          <Loader2 className="w-5 h-5 text-stone-400 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="w-5 h-5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
        )}
      </button>

      {besked && (
        <p
          role={besked.typ === 'fel' ? 'alert' : 'status'}
          className="mt-3 text-sm"
          style={{ color: besked.typ === 'fel' ? 'var(--s-ogiltig-text)' : 'var(--s-narvarande-text)' }}
        >
          {besked.text}
        </p>
      )}

      <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
        Avslut och raderingsfrist för en hel enhet finns inte än: gallringen tar inte planer, pass eller underlag, och en borttagen organisation
        behåller sina planer utan koppling. Ta ut filen innan avtalet löper ut och kontakta Jobin för radering.
      </p>
    </Card>
  )
}
