/**
 * OmFlik — om företaget: profilen (employer_profiles, en rad per konto),
 * organisationens namn/org.nr (läses bara — de sätts av inbjudan) och
 * kollegorna (organization_colleagues) med inbjudan och borttagning.
 * Databasens svenska felmeddelanden visas rakt av.
 *
 * Profilformuläret är en egen komponent som får sin startdata via `key`
 * (updated_at) i stället för en effekt som kopierar in den — så en sparning
 * eller en omhämtning ger ett nytt, rent formulär utan cascading renders.
 */

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserPlus } from '@/components/ui/icons'
import { orgApi, type Organization } from '@/services/orgApi'
import { foretagApi, fulltNamn, type ForetagsProfil, type ForetagsProfilInput } from '@/services/foretagApi'
import { FelRuta, FelText, Laddar } from '@/components/foretag/Tillstand'
import { BjudInKollegaDialog } from '@/components/foretag/BjudInKollegaDialog'
import { ETIKETT_KLASS, FALT_KLASS, foretagNycklar } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

type Form = {
  description: string
  accepts_interns: '' | 'ja' | 'nej'
  typical_needs: string
  website: string
  city: string
  industry: string
  employee_count: string
}

function franProfil(p: ForetagsProfil | null): Form {
  return {
    description: p?.description ?? '',
    accepts_interns: p?.accepts_interns === true ? 'ja' : p?.accepts_interns === false ? 'nej' : '',
    typical_needs: p?.typical_needs ?? '',
    website: p?.website ?? '',
    city: p?.city ?? '',
    industry: p?.industry ?? '',
    employee_count: p?.employee_count ?? '',
  }
}

function tillInput(form: Form): ForetagsProfilInput {
  return {
    description: form.description.trim() || null,
    accepts_interns: form.accepts_interns === '' ? null : form.accepts_interns === 'ja',
    typical_needs: form.typical_needs.trim() || null,
    website: form.website.trim() || null,
    city: form.city.trim() || null,
    industry: form.industry.trim() || null,
    employee_count: form.employee_count.trim() || null,
  }
}

function ProfilForm({ profil, onSpara }: { profil: ForetagsProfil | null; onSpara: (input: ForetagsProfilInput) => Promise<unknown> }) {
  const [form, setForm] = useState<Form>(() => franProfil(profil))
  const [sparar, setSparar] = useState(false)
  const [sparat, setSparat] = useState(false)
  const [fel, setFel] = useState<unknown>(null)

  const satt = (falt: keyof Form) => (e: { target: { value: string } }) => {
    setSparat(false)
    setForm((f) => ({ ...f, [falt]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFel(null)
    setSparat(false)
    setSparar(true)
    try {
      await onSpara(tillInput(form))
      setSparat(true)
    } catch (err) {
      setFel(err)
    } finally {
      setSparar(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="om-description" className={ETIKETT_KLASS}>Om oss</label>
        <textarea id="om-description" rows={4} value={form.description} onChange={satt('description')} className={`${FALT_KLASS} resize-none`} placeholder="Vad ni gör, hur det är att jobba hos er, vad ni brukar kunna erbjuda." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="om-interns" className={ETIKETT_KLASS}>Tar ni emot praktikanter?</label>
          <select id="om-interns" value={form.accepts_interns} onChange={satt('accepts_interns')} className={FALT_KLASS}>
            <option value="">Vet inte än</option>
            <option value="ja">Ja</option>
            <option value="nej">Nej</option>
          </select>
        </div>
        <div>
          <label htmlFor="om-needs" className={ETIKETT_KLASS}>Vad ni brukar behöva</label>
          <input id="om-needs" type="text" value={form.typical_needs} onChange={satt('typical_needs')} className={FALT_KLASS} placeholder="T.ex. lager, kök, kundtjänst" />
        </div>
        <div>
          <label htmlFor="om-industry" className={ETIKETT_KLASS}>Bransch</label>
          <input id="om-industry" type="text" value={form.industry} onChange={satt('industry')} className={FALT_KLASS} />
        </div>
        <div>
          <label htmlFor="om-city" className={ETIKETT_KLASS}>Ort</label>
          <input id="om-city" type="text" value={form.city} onChange={satt('city')} className={FALT_KLASS} />
        </div>
        <div>
          <label htmlFor="om-employees" className={ETIKETT_KLASS}>Antal anställda (ungefär)</label>
          <input id="om-employees" type="text" value={form.employee_count} onChange={satt('employee_count')} className={FALT_KLASS} placeholder="T.ex. 10–20" />
        </div>
        <div>
          <label htmlFor="om-website" className={ETIKETT_KLASS}>Webbplats</label>
          <input id="om-website" type="url" value={form.website} onChange={satt('website')} className={FALT_KLASS} placeholder="https://" />
        </div>
      </div>
      <FelText fel={fel} />
      {sparat && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Sparat.</p>}
      <div className="flex justify-end">
        <Button type="submit" isLoading={sparar} loadingText="Sparar…">Spara</Button>
      </div>
    </form>
  )
}

export function OmFlik({ org }: Props) {
  const queryClient = useQueryClient()
  const { confirm } = useConfirmDialog()
  const [taBortFel, setTaBortFel] = useState<unknown>(null)
  const [bjudIn, setBjudIn] = useState(false)

  const profilQ = useQuery({ queryKey: foretagNycklar.profil(org.id), queryFn: () => foretagApi.getProfil(org.id) })
  const kollegorQ = useQuery({
    queryKey: foretagNycklar.kollegor(org.id),
    queryFn: async () => (await orgApi.colleagues()).filter((k) => k.org_id === org.id),
  })

  const spara = useMutation({
    mutationFn: (input: ForetagsProfilInput) => foretagApi.upsertProfil(org.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foretagNycklar.profil(org.id) }),
  })
  const taBort = useMutation({
    mutationFn: (membershipId: string) => orgApi.removeColleague(membershipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foretagNycklar.kollegor(org.id) }),
  })

  const taBortKollega = async (id: string, namn: string) => {
    const ok = await confirm({
      title: `Ta bort ${namn} från företagskontot?`,
      message: 'Personen ser inte längre förslag, platser eller meddelanden. Kontot i sig finns kvar.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    setTaBortFel(null)
    try {
      await taBort.mutateAsync(id)
    } catch (err) {
      setTaBortFel(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Om företaget</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">Det konsulenterna ser om er när de letar plats åt någon.</p>
      </div>

      <Card className="space-y-3">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Organisation</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div><dt className="text-stone-500 dark:text-stone-400">Namn</dt><dd className="text-stone-900 dark:text-stone-100">{org.name}</dd></div>
          <div><dt className="text-stone-500 dark:text-stone-400">Organisationsnummer</dt><dd className="text-stone-900 dark:text-stone-100">{org.org_number || 'Inte angivet'}</dd></div>
        </dl>
        <p className="text-xs text-stone-600 dark:text-stone-300">Namn och organisationsnummer sattes vid inbjudan. Behöver de ändras — säg till er konsulent.</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">Presentation</h3>
        {profilQ.isLoading || (profilQ.data === undefined && !profilQ.error) ? (
          <Laddar text="Hämtar profilen…" />
        ) : profilQ.error ? (
          <FelRuta fel={profilQ.error} vad="profilen" onForsokIgen={() => profilQ.refetch()} />
        ) : (
          <ProfilForm key={profilQ.data?.updated_at ?? 'ny'} profil={profilQ.data ?? null} onSpara={(input) => spara.mutateAsync(input)} />
        )}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Kollegor med tillgång</h3>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />} onClick={() => setBjudIn(true)}>
            Bjud in kollega
          </Button>
        </div>
        <FelText fel={taBortFel} />
        {kollegorQ.isLoading || (!kollegorQ.data && !kollegorQ.error) ? (
          <Laddar text="Hämtar kollegor…" />
        ) : kollegorQ.error ? (
          <FelRuta fel={kollegorQ.error} vad="kollegorna" onForsokIgen={() => kollegorQ.refetch()} />
        ) : kollegorQ.data.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-300">Vi kunde inte se någon medlem i kontot — ladda om sidan, eller kontakta er konsulent.</p>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-stone-700">
            {kollegorQ.data.map((k) => {
              const namn = fulltNamn(k.first_name, k.last_name) || k.email || 'Kollega'
              return (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{namn}</p>
                    {k.email && <p className="text-xs text-stone-600 dark:text-stone-300">{k.email}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => taBortKollega(k.id, namn)}>Ta bort</Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <BjudInKollegaDialog
        open={bjudIn}
        onBjudIn={(email, namn) => foretagApi.bjudInKollega(org.id, email, namn)}
        onClose={() => {
          setBjudIn(false)
          queryClient.invalidateQueries({ queryKey: foretagNycklar.kollegor(org.id) })
        }}
      />
    </div>
  )
}
