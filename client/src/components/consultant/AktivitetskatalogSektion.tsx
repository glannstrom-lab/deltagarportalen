/**
 * AktivitetskatalogSektion — kommunens utbud av gruppaktiviteter (KM8) i fliken
 * Resurser. Det schemamallarna hämtar rader ur.
 *
 * Tre lägen: laddar / fel / klart. Tomt är tomt, med EN väg vidare. Utan
 * organisationsmedlemskap är katalogen personlig — det sägs rakt ut.
 * Konsulentvyn översätts inte (DESIGN.md §2). Ingen AI.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Library, Plus, Edit2, Trash2, MapPin, Clock, Users, X, Loader2 } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { notifications } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { aktivitetskatalogApi, type CatalogItem, type CatalogItemInput } from '@/services/aktivitetskatalogApi'
import { orgApi, type Organization, type OrgRole } from '@/services/orgApi'
import { minuterMellan, type ActivityType } from '@/services/aktivitetSchema'
import {
  AKTIVITETSTYP_CHIP,
  AKTIVITETSTYP_ETIKETT,
  AKTIVITETSTYP_HJALP,
  AKTIVITETSTYP_ORDNING,
  VECKODAG_KORT,
  VECKODAG_LANG,
} from './aktivitetEtiketter'

type Medlemskap = { org: Organization; role: OrgRole }
type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; poster: CatalogItem[]; medlemskap: Medlemskap[]; userId: string | null }

const TYP_VAL = AKTIVITETSTYP_ORDNING.map((t) => ({ value: t, label: AKTIVITETSTYP_ETIKETT[t] }))
const DAG_VAL = [{ value: '', label: 'Ingen fast dag' }, ...[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: String(d), label: VECKODAG_LANG[d] }))]

export function AktivitetskatalogSektion() {
  const { confirm } = useConfirmDialog()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [dialog, setDialog] = useState<{ open: boolean; post: CatalogItem | null }>({ open: false, post: null })

  const [omgang, setOmgang] = useState(0)
  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [{ data: { user } }, poster, medlemskap] = await Promise.all([
          supabase.auth.getUser(),
          aktivitetskatalogApi.list(),
          orgApi.myMemberships(),
        ])
        if (!aktiv) return
        setLage({
          status: 'klart',
          poster,
          medlemskap: medlemskap.map((m) => ({ org: m.organization, role: m.role })),
          userId: user?.id ?? null,
        })
      } catch (err) {
        if (aktiv) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Katalogen kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [omgang])

  const ladda = useCallback(() => {
    setLage({ status: 'laddar' })
    setOmgang((n) => n + 1)
  }, [])

  const taBort = async (post: CatalogItem) => {
    const ok = await confirm({
      title: 'Ta bort aktiviteten ur katalogen?',
      message: `"${post.title}" tas bort. Schemamallar och planer som redan hämtat den påverkas inte.`,
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await aktivitetskatalogApi.remove(post.id)
      notifications.success('Aktiviteten är borttagen')
      ladda()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Kunde inte ta bort')
    }
  }

  const vaxlaAktiv = async (post: CatalogItem) => {
    try {
      const uppdaterad = await aktivitetskatalogApi.setActive(post.id, !post.is_active)
      setLage((prev) => prev.status === 'klart'
        ? { ...prev, poster: prev.poster.map((p) => (p.id === post.id ? uppdaterad : p)) }
        : prev)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Kunde inte spara')
    }
  }

  const medlemskap = lage.status === 'klart' ? lage.medlemskap : []
  const chefOrgs = medlemskap.filter((m) => m.role === 'chef' || m.role === 'admin').map((m) => m.org)
  const orgNamn = (id: string | null) => medlemskap.find((m) => m.org.id === id)?.org.name ?? null

  const farRedigera = (post: CatalogItem) =>
    lage.status === 'klart' && (post.owner_id === lage.userId || (post.org_id !== null && chefOrgs.some((o) => o.id === post.org_id)))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Aktivitetskatalog</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-prose">
            Det kommunen erbjuder: gruppaktiviteter med plats och tid, som schemamallarna hämtar rader ur.
            Praktikplatser hanteras under Platser, inte här.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, post: null })}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Ny aktivitet
        </Button>
      </div>

      {lage.status === 'klart' && medlemskap.length === 0 && (
        <p className="text-sm text-stone-600 dark:text-stone-300 rounded-lg bg-stone-100 dark:bg-stone-800 px-4 py-3 max-w-prose">
          Du tillhör ingen organisation än, så katalogen är din egen. När Jobin lagt upp din kommun
          delas organisationens aktiviteter med alla konsulenter där.
        </p>
      )}

      {lage.status === 'laddar' && <LoadingState message="Hämtar katalogen…" />}
      {lage.status === 'fel' && (
        <ErrorState title="Katalogen kunde inte hämtas" message={lage.fel} onRetry={ladda} />
      )}
      {lage.status === 'klart' && lage.poster.length === 0 && (
        <EmptyState
          icon={Library}
          title="Inga aktiviteter i katalogen än"
          description="Lägg in det ni erbjuder — jobbsökarverkstad, språkcafé, hälsogrupp — med plats och tid."
          action={{ label: 'Lägg in första aktiviteten', onClick: () => setDialog({ open: true, post: null }) }}
        />
      )}
      {lage.status === 'klart' && lage.poster.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Aktivitetskatalog">
          {lage.poster.map((post) => {
            const tid = post.start_time && post.end_time ? `${post.start_time}–${post.end_time}` : null
            const dag = post.weekday ? VECKODAG_KORT[post.weekday] : null
            const org = orgNamn(post.org_id)
            return (
              <li key={post.id}>
                <Card className={cn('p-5 h-full flex flex-col gap-3', !post.is_active && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate">{post.title}</h3>
                      {post.description && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{post.description}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
                        post.is_active
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                      )}
                    >
                      {post.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', AKTIVITETSTYP_CHIP[post.activity_type])}>
                      {AKTIVITETSTYP_ETIKETT[post.activity_type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {org ?? 'Din egen'}
                    </span>
                  </div>
                  <dl className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-300 flex-wrap">
                    {(dag || tid) && (
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <dt className="sr-only">Dag och tid</dt>
                        <dd>{[dag, tid].filter(Boolean).join(' ')}</dd>
                      </div>
                    )}
                    {post.location && (
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <dt className="sr-only">Plats</dt>
                        <dd>{post.location}</dd>
                      </div>
                    )}
                    {post.capacity !== null && (
                      <div className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <dt className="sr-only">Platser</dt>
                        <dd>{post.capacity} platser</dd>
                      </div>
                    )}
                  </dl>
                  {post.contact && (
                    <p className="text-sm text-stone-500 dark:text-stone-400">Kontakt: {post.contact}</p>
                  )}
                  {farRedigera(post) && (
                    <div className="mt-auto flex items-center gap-2 pt-1 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, post })}>
                        <Edit2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Redigera
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => vaxlaAktiv(post)}>
                        {post.is_active ? 'Gör inaktiv' : 'Gör aktiv'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => taBort(post)}>
                        <Trash2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Ta bort
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <KatalogDialog
        isOpen={dialog.open}
        post={dialog.post}
        chefOrgs={chefOrgs}
        onClose={() => setDialog({ open: false, post: null })}
        onSaved={() => {
          setDialog({ open: false, post: null })
          notifications.success('Aktiviteten är sparad')
          ladda()
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dialogen — skapa/redigera en katalogpost
// ---------------------------------------------------------------------------

interface KatalogDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (post: CatalogItem) => void
  post: CatalogItem | null
  /** Organisationer där jag är chef/admin — bara de går att välja som ägare. */
  chefOrgs: Organization[]
}

export function KatalogDialog(props: KatalogDialogProps) {
  // Monteras bara öppen: färskt formulär varje gång utan återställande effekt.
  if (!props.isOpen) return null
  return <KatalogForm {...props} />
}

function KatalogForm({ isOpen, onClose, onSaved, post, chefOrgs }: KatalogDialogProps) {
  const [titel, setTitel] = useState(post?.title ?? '')
  const [typ, setTyp] = useState<ActivityType>(post?.activity_type ?? 'jobsearch')
  const [beskrivning, setBeskrivning] = useState(post?.description ?? '')
  const [plats, setPlats] = useState(post?.location ?? '')
  const [dag, setDag] = useState(post?.weekday ? String(post.weekday) : '')
  const [start, setStart] = useState(post?.start_time ?? '')
  const [slut, setSlut] = useState(post?.end_time ?? '')
  const [platser, setPlatser] = useState(post?.capacity ? String(post.capacity) : '')
  const [kontakt, setKontakt] = useState(post?.contact ?? '')
  const [aktiv, setAktiv] = useState(post?.is_active ?? true)
  const [orgId, setOrgId] = useState<string>(post?.org_id ?? (chefOrgs[0]?.id ?? ''))
  const [forsokt, setForsokt] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [sparfel, setSparfel] = useState<string | null>(null)

  const fel = useMemo(() => {
    const f: Record<string, string> = {}
    if (!titel.trim()) f.titel = 'Aktiviteten behöver ett namn'
    const harStart = start.trim() !== '', harSlut = slut.trim() !== ''
    if (harStart !== harSlut) f.tid = 'Ange både start och slut, eller ingen tid alls'
    else if (harStart && harSlut && minuterMellan(start, slut) <= 0) f.tid = 'Sluttiden måste vara efter starttiden'
    if (platser.trim() !== '' && !(Number(platser) > 0 && Number.isInteger(Number(platser)))) f.platser = 'Antal platser ska vara ett heltal över noll'
    return f
  }, [titel, start, slut, platser])
  const harFel = Object.keys(fel).length > 0

  const spara = async () => {
    setForsokt(true)
    if (harFel) return
    setSparar(true)
    setSparfel(null)
    const input: CatalogItemInput = {
      org_id: orgId || null,
      title: titel,
      activity_type: typ,
      description: beskrivning,
      location: plats,
      weekday: dag ? Number(dag) : null,
      start_time: start || null,
      end_time: slut || null,
      capacity: platser.trim() ? Number(platser) : null,
      contact: kontakt,
      is_active: aktiv,
    }
    try {
      const sparad = post ? await aktivitetskatalogApi.update(post.id, input) : await aktivitetskatalogApi.create(input)
      onSaved(sparad)
    } catch (err) {
      setSparfel(err instanceof Error ? err.message : 'Aktiviteten kunde inte sparas. Försök igen.')
    } finally {
      setSparar(false)
    }
  }

  const agareVal = [
    { value: '', label: 'Bara jag (personlig katalog)' },
    ...chefOrgs.map((o) => ({ value: o.id, label: o.name })),
  ]

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="katalog-dialog-title"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="katalog-dialog-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {post ? 'Redigera aktivitet' : 'Ny aktivitet i katalogen'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            En återkommande gruppaktivitet. Dag och tid är valfria — vissa aktiviteter är drop-in.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="katalog-titel"
            label="Namn"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            error={forsokt ? fel.titel : undefined}
            placeholder="Språkcafé"
            fullWidth
          />
          <Select
            id="katalog-typ"
            label="Aktivitetstyp"
            options={TYP_VAL}
            value={typ}
            onChange={(e) => setTyp(e.target.value as ActivityType)}
            fullWidth
          />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">{AKTIVITETSTYP_HJALP[typ]}</p>
        <Textarea
          id="katalog-beskrivning"
          label="Beskrivning"
          value={beskrivning}
          onChange={(e) => setBeskrivning(e.target.value)}
          rows={2}
          placeholder="Vad man gör, vem det passar."
          fullWidth
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select id="katalog-dag" label="Veckodag" options={DAG_VAL} value={dag} onChange={(e) => setDag(e.target.value)} fullWidth />
          <Input id="katalog-start" label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} fullWidth />
          <Input id="katalog-slut" label="Slut" type="time" value={slut} onChange={(e) => setSlut(e.target.value)} error={forsokt ? fel.tid : undefined} fullWidth />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input id="katalog-plats" label="Plats" value={plats} onChange={(e) => setPlats(e.target.value)} placeholder="Hjernet, Malmgatan 4" fullWidth />
          <Input id="katalog-platser" label="Antal platser" type="number" min={1} value={platser} onChange={(e) => setPlatser(e.target.value)} error={forsokt ? fel.platser : undefined} fullWidth />
          <Input id="katalog-kontakt" label="Kontakt" value={kontakt} onChange={(e) => setKontakt(e.target.value)} placeholder="Namn eller telefon" fullWidth />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="katalog-agare"
            label="Vem ser aktiviteten"
            options={agareVal}
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            hint={chefOrgs.length === 0 ? 'Bara chef eller admin kan lägga in aktiviteter i organisationens katalog.' : undefined}
            fullWidth
          />
          <Checkbox
            id="katalog-aktiv"
            label="Aktiv"
            description="Inaktiva aktiviteter ligger kvar men går inte att hämta till nya mallar."
            checked={aktiv}
            onChange={(e) => setAktiv(e.target.checked)}
          />
        </div>
        {sparfel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{sparfel}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button type="button" variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button type="button" onClick={spara} disabled={sparar}>
          {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
          {post ? 'Spara ändringar' : 'Spara aktivitet'}
        </Button>
      </div>
    </Dialog>
  )
}
