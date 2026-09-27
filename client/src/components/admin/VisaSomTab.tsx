/**
 * Superadmin → "Visa som" (2026-09-27). Listar demo- och testkonton och öppnar
 * portalen som ett av dem — för kunddemonstrationer och för att se vad varje
 * roll faktiskt ser. Servern (superadmin-visa-som) släpper bara igenom fiktiva
 * konton och loggar varje öppning i audit_logs.
 *
 * Svenska literaler med flit: superadmin-panelen översätts inte.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Eye } from '@/components/ui/icons'
import { beskrivRoll, visaSomApi, visaSomUrl, type VisaSomKonto } from '@/services/visaSomApi'

const GRUPPER: { id: VisaSomKonto['grupp']; rubrik: string; text: string }[] = [
  { id: 'demo', rubrik: 'Demokonton', text: 'Det kunderna ser i en demo: Demokommunens chef och deltagare, och demoföretaget.' },
  { id: 'test', rubrik: 'Testkonton', text: 'Konton för testerna, t.ex. aktivitetskravet i Testkommun.' },
  { id: 'ovrigt', rubrik: 'Övriga fiktiva konton', text: 'Äldre konton på @example.com.' },
]

type Lage = { kontoId: string; url: string; kopierad: boolean } | null

export function VisaSomTab() {
  const q = useQuery({ queryKey: ['visa-som-konton'], queryFn: () => visaSomApi.lista() })
  const [lage, setLage] = useState<Lage>(null)
  const [arbetar, setArbetar] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [visaOvriga, setVisaOvriga] = useState(false)

  const skapaLank = async (k: VisaSomKonto) => {
    setFel(null)
    setArbetar(k.id)
    try {
      const url = visaSomUrl(await visaSomApi.oppna(k.id))
      let kopierad = false
      try {
        await navigator.clipboard.writeText(url)
        kopierad = true
      } catch {
        // urklipp nekat — länken visas ändå för manuell kopiering
      }
      setLage({ kontoId: k.id, url, kopierad })
    } catch (e) {
      setFel(e instanceof Error ? e.message : 'Kunde inte skapa länken')
    } finally {
      setArbetar(null)
    }
  }

  if (q.isLoading) return <p className="text-gray-600">Hämtar demo- och testkonton …</p>
  if (q.isError) {
    return (
      <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
        Kunde inte hämta kontona: {q.error instanceof Error ? q.error.message : 'okänt fel'}
      </p>
    )
  }

  const konton = q.data ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-1">
        <p className="font-medium text-gray-900">Så fungerar det</p>
        <p>
          Klicka <strong>Skapa länk</strong> vid ett konto. Länken kopieras. Öppna ett <strong>privat fönster</strong>{' '}
          (Ctrl+Skift+N i Chrome/Edge) och klistra in den — där är du inloggad som kontot, med en blå rad överst.
          Din egen inloggning ligger kvar i det här fönstret.
        </p>
        <p className="text-gray-500">Länken fungerar en gång och i en timme. Bara demo- och testkonton går att öppna, och varje öppning loggas.</p>
      </div>

      {fel && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
          {fel}
        </p>
      )}

      {GRUPPER.map((g) => {
        const rader = konton.filter((k) => k.grupp === g.id)
        if (rader.length === 0) return null
        const dold = g.id === 'ovrigt' && !visaOvriga
        return (
          <section key={g.id} className="rounded-lg border border-gray-200 bg-white">
            <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {g.rubrik} <span className="font-normal text-gray-500">({rader.length})</span>
                </h2>
                <p className="text-sm text-gray-600">{g.text}</p>
              </div>
              {g.id === 'ovrigt' && (
                <button
                  type="button"
                  aria-expanded={visaOvriga}
                  onClick={() => setVisaOvriga((v) => !v)}
                  className="text-sm font-medium text-primary-700 hover:underline shrink-0"
                >
                  {visaOvriga ? 'Dölj' : 'Visa'}
                </button>
              )}
            </header>
            {!dold && (
              <ul className="divide-y divide-gray-100">
                {rader.map((k) => (
                  <li key={k.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex-1 min-w-[14rem]">
                        <p className="font-medium text-gray-900">
                          {beskrivRoll(k)}
                          {k.organisation && <span className="font-normal text-gray-600"> · {k.organisation}</span>}
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          {k.namn ? `${k.namn} — ` : ''}
                          {k.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => skapaLank(k)}
                        disabled={arbetar !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Eye size={16} aria-hidden="true" />
                        {arbetar === k.id ? 'Skapar …' : 'Skapa länk'}
                      </button>
                    </div>
                    {lage?.kontoId === k.id && (
                      <div className="mt-3 rounded-md bg-sky-50 border border-sky-200 p-3 text-sm text-sky-950 space-y-2">
                        <p role="status">
                          {lage.kopierad
                            ? 'Länken är kopierad. Klistra in den i ett privat fönster.'
                            : 'Kopiera länken nedan och klistra in den i ett privat fönster.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <input
                            readOnly
                            value={lage.url}
                            aria-label="Inloggningslänk"
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 min-w-0 rounded border border-sky-300 bg-white px-2 py-1 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(lage.url).then(() => setLage({ ...lage, kopierad: true })).catch(() => {})}
                            className="inline-flex items-center gap-1 rounded border border-sky-300 bg-white px-2 py-1"
                          >
                            <Copy size={14} aria-hidden="true" /> Kopiera
                          </button>
                          <a
                            href={lage.url}
                            onClick={(e) => {
                              if (!window.confirm('Öppna här? Då loggas du ut som superadmin i det här fönstret.')) e.preventDefault()
                            }}
                            className="inline-flex items-center gap-1 rounded border border-sky-300 bg-white px-2 py-1"
                          >
                            <ExternalLink size={14} aria-hidden="true" /> Öppna här i stället
                          </a>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
