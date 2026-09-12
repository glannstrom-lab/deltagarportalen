/**
 * ForetagsTrad — meddelandetråden företag ↔ konsulent på ett accepterat
 * förslag (employer_messages, AG6 §7). Aldrig till deltagaren (beslut 2).
 *
 * Konsulenten läser hela tråden (RLS: egna förslag oavsett status) men kan
 * bara SKRIVA på ett accepterat förslag — därför öppnar PlatserTab dialogen
 * bara då. Vid öppning markeras företagets meddelanden som lästa
 * (foretagsTradApi.markeraLasta). Notiser till motparten skapas av
 * databasens trigger, inte här.
 */

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { AlertCircle, MessageSquare, Send } from '@/components/ui/icons'
import { foretagsTradApi, type Delningsforslag } from '@/services/delningsforslagApi'

interface Props {
  open: boolean
  forslag: Delningsforslag
  foretagsnamn: string
  onClose: () => void
}

export const QK_TRAD = (proposalId: string) => ['foretags-trad', proposalId] as const
export const QK_TRAD_OLASTA = ['foretags-trad-olasta'] as const

/** Supabase kastar ett PostgrestError-objekt (inte Error) — RLS-nekandet ska synas som text. */
function felText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const m = (e as { message: string }).message.trim()
    if (m) return m
  }
  return 'Kunde inte skicka'
}

function tid(iso: string): string {
  const d = new Date(iso)
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`
}

export function ForetagsTrad({ open, forslag, foretagsnamn, onClose }: Props) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [fel, setFel] = useState<string | null>(null)

  const { data: meddelanden, isLoading, error, refetch } = useQuery({
    queryKey: QK_TRAD(forslag.id),
    queryFn: () => foretagsTradApi.lista(forslag.id),
    enabled: open,
  })

  // Läskvitto när tråden öppnas. Misslyckas markeringen är det inte värt en
  // felruta — meddelandena visas ändå; räknaren rättar sig nästa gång.
  useEffect(() => {
    if (!open) return
    foretagsTradApi
      .markeraLasta(forslag.id)
      .then(() => queryClient.invalidateQueries({ queryKey: QK_TRAD_OLASTA }))
      .catch(() => {})
  }, [open, forslag.id, queryClient])

  const skicka = useMutation({
    mutationFn: (innehall: string) => foretagsTradApi.skicka(forslag.id, 'konsulent', innehall),
    onSuccess: () => {
      setText('')
      setFel(null)
      queryClient.invalidateQueries({ queryKey: QK_TRAD(forslag.id) })
    },
    onError: (e) => setFel(felText(e)),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    skicka.mutate(text)
  }

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      labelledBy="foretags-trad-title"
      className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-stone-700" />
          <h2 id="foretags-trad-title" className="font-semibold text-stone-900">
            Tråd med {foretagsnamn}
          </h2>
        </div>
        <CloseButton onClick={onClose} aria-label="Stäng" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2 min-h-[160px]">
        {isLoading || (!meddelanden && !error) ? (
          <LoadingState title="Hämtar tråden" message="Ett ögonblick…" />
        ) : error ? (
          <ErrorState
            title="Tråden kunde inte hämtas"
            message={error instanceof Error ? error.message : 'Ett okänt fel inträffade.'}
            onRetry={() => refetch()}
          />
        ) : meddelanden.length === 0 ? (
          <p className="text-sm text-stone-500">Inga meddelanden än. Skriv det första nedan.</p>
        ) : (
          <ul className="space-y-2">
            {meddelanden.map((m) => (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.sender_kind === 'konsulent'
                    ? 'ml-auto bg-stone-800 text-white'
                    : 'mr-auto bg-stone-100 text-stone-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[11px] ${m.sender_kind === 'konsulent' ? 'text-stone-300' : 'text-stone-500'}`}>
                  {m.sender_kind === 'konsulent' ? 'Du' : foretagsnamn} · {tid(m.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-stone-100 space-y-2">
        {fel && (
          <div role="alert" className="flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <span>{fel}</span>
          </div>
        )}
        <label className="block">
          <span className="sr-only">Nytt meddelande</span>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            placeholder="Skriv till företaget…"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="primary" leftIcon={<Send size={13} />} isLoading={skicka.isPending} disabled={!text.trim()}>
            Skicka
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
