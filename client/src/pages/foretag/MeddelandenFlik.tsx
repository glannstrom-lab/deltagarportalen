/**
 * MeddelandenFlik — en tråd per förslag mellan företaget och konsulenten
 * (employer_messages via foretagsTradApi). Aldrig till deltagaren (beslut 2,
 * 2026-09-13) — det står överst, inte bara i koden.
 *
 * Trådarna byggs ur employer_proposals OCH employer_placements (proposal_id):
 * en placering vars förslag inte längre syns i förslagsvyn (utgånget) har ändå
 * en tråd. RLS läser bara trådar på förslag företaget ser; en sådan tråd blir
 * tom och ett försök att skriva ger databasens fel — som visas.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MessageSquare, Send } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { Organization } from '@/services/orgApi'
import { foretagApi, fulltNamn } from '@/services/foretagApi'
import { foretagsTradApi } from '@/services/delningsforslagApi'
import { FelRuta, FelText, Laddar } from '@/components/foretag/Tillstand'
import { ETIKETT_KLASS, FALT_KLASS, foretagNycklar } from '@/components/foretag/foretagEtiketter'

interface Props {
  org: Organization
}

export interface Trad {
  proposalId: string
  person: string
  plats: string
  konsulent: string
}

export function MeddelandenFlik({ org }: Props) {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const valtId = params.get('forslag')
  const [text, setText] = useState('')
  const [skickaFel, setSkickaFel] = useState<unknown>(null)
  const markerade = useRef<Set<string>>(new Set())

  const forslagQ = useQuery({ queryKey: foretagNycklar.forslag(org.id), queryFn: () => foretagApi.listaForslag(org.id) })
  const pagaendeQ = useQuery({ queryKey: foretagNycklar.pagaende(org.id), queryFn: () => foretagApi.listaPagaende(org.id) })

  const tradar = useMemo<Trad[]>(() => {
    const karta = new Map<string, Trad>()
    for (const f of forslagQ.data ?? []) {
      karta.set(f.id, {
        proposalId: f.id,
        person: fulltNamn(f.participant_first_name, f.participant_last_name) || 'Personen',
        plats: f.place_title || f.occupation || 'Plats hos er',
        konsulent: fulltNamn(f.consultant_first_name, f.consultant_last_name) || 'Konsulenten',
      })
    }
    for (const p of pagaendeQ.data ?? []) {
      if (!karta.has(p.proposal_id)) {
        karta.set(p.proposal_id, {
          proposalId: p.proposal_id,
          person: fulltNamn(p.participant_first_name, p.participant_last_name) || 'Personen',
          plats: p.place_title || p.occupation || 'Plats hos er',
          konsulent: fulltNamn(p.consultant_first_name, p.consultant_last_name) || 'Konsulenten',
        })
      }
    }
    return [...karta.values()]
  }, [forslagQ.data, pagaendeQ.data])

  const vald = tradar.find((t) => t.proposalId === valtId) ?? null

  const tradQ = useQuery({
    queryKey: foretagNycklar.trad(vald?.proposalId ?? ''),
    queryFn: () => foretagsTradApi.lista(vald!.proposalId),
    enabled: vald !== null,
  })

  useEffect(() => {
    if (!vald || !tradQ.data || markerade.current.has(vald.proposalId)) return
    if (!tradQ.data.some((m) => !m.is_read && m.sender_kind === 'konsulent')) return
    markerade.current.add(vald.proposalId)
    foretagsTradApi.markeraLasta(vald.proposalId).catch(() => {
      // Läskvittot är en bekvämlighet, inte data — ett fel här ska inte blockera tråden.
      markerade.current.delete(vald.proposalId)
    })
  }, [vald, tradQ.data])

  const skicka = useMutation({
    mutationFn: ({ proposalId, innehall }: { proposalId: string; innehall: string }) => foretagsTradApi.skicka(proposalId, 'foretag', innehall),
    onSuccess: (_d, v) => queryClient.invalidateQueries({ queryKey: foretagNycklar.trad(v.proposalId) }),
  })

  const valj = (t: Trad) => {
    const nasta = new URLSearchParams(params)
    nasta.set('forslag', t.proposalId)
    setParams(nasta)
    setText('')
    setSkickaFel(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!vald || !text.trim()) return
    setSkickaFel(null)
    try {
      await skicka.mutateAsync({ proposalId: vald.proposalId, innehall: text })
      setText('')
    } catch (err) {
      setSkickaFel(err)
    }
  }

  const laddar = (!forslagQ.data && !forslagQ.error) || (!pagaendeQ.data && !pagaendeQ.error)
  const listFel = forslagQ.error ?? pagaendeQ.error

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Meddelanden</h2>
        <p className="text-sm text-stone-700 dark:text-stone-200 mt-1">Meddelanden går till konsulenten, inte till deltagaren.</p>
      </div>

      {laddar ? (
        <Laddar text="Hämtar trådar…" />
      ) : listFel ? (
        <FelRuta fel={listFel} vad="trådarna" onForsokIgen={() => { forslagQ.refetch(); pagaendeQ.refetch() }} />
      ) : tradar.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Här pratar ni med konsulenten"
            description="En tråd öppnas för varje förslag ni får. Än så länge finns inget att svara på."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_2fr] gap-4">
          <ul className="space-y-2" aria-label="Trådar">
            {tradar.map((t) => (
              <li key={t.proposalId}>
                <button
                  type="button"
                  onClick={() => valj(t)}
                  aria-current={vald?.proposalId === t.proposalId ? 'true' : undefined}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-colors',
                    vald?.proposalId === t.proposalId
                      ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                      : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700',
                  )}
                >
                  <p className="font-medium text-stone-900 dark:text-stone-100">{t.person}</p>
                  <p className="text-sm text-stone-700 dark:text-stone-200">{t.plats} · {t.konsulent}</p>
                </button>
              </li>
            ))}
          </ul>

          <Card className="flex flex-col min-h-[320px]">
            {!vald ? (
              <EmptyState compact icon={MessageSquare} title="Välj en tråd" description="Meddelandena visas här." />
            ) : (
              <>
                <p className="text-sm text-stone-700 dark:text-stone-200 mb-3">
                  Tråd med <span className="font-medium text-stone-900 dark:text-stone-100">{vald.konsulent}</span> om {vald.person} · {vald.plats}
                </p>
                <div className="flex-1 space-y-2 overflow-y-auto" aria-live="polite">
                  {tradQ.error ? (
                    <FelRuta fel={tradQ.error} vad="tråden" onForsokIgen={() => tradQ.refetch()} />
                  ) : !tradQ.data ? (
                    <Laddar text="Hämtar tråden…" />
                  ) : tradQ.data.length === 0 ? (
                    <p className="text-sm text-stone-600 dark:text-stone-300">Inga meddelanden än. Skriv det första.</p>
                  ) : (
                    tradQ.data.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                          m.sender_kind === 'foretag'
                            ? 'ml-auto bg-[var(--c-bg)] text-[var(--c-text)]'
                            : 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100',
                        )}
                      >
                        <p className="text-xs text-stone-600 dark:text-stone-300 mb-0.5">
                          {m.sender_kind === 'foretag' ? 'Ni' : vald.konsulent} · {new Date(m.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSubmit} className="mt-3 space-y-2">
                  <label htmlFor="meddelande-text" className={ETIKETT_KLASS}>Skriv till {vald.konsulent}</label>
                  <textarea
                    id="meddelande-text"
                    rows={3}
                    maxLength={4000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={`${FALT_KLASS} resize-none`}
                  />
                  <FelText fel={skickaFel} />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" isLoading={skicka.isPending} loadingText="Skickar…" disabled={!text.trim()} leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}>
                      Skicka
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
