/**
 * AktivitetsforslagYta — AIX21, överst i "Lägg till pass".
 *
 * Konsulenten skriver deltagarens mål; AI:n föreslår poster ur organisationens
 * katalog. Ett förslag fyller bara i formuläret under — passet skapas först när
 * konsulenten klickar "Lägg till". Visas bara när spärren A2 är hävd (a2Sparr.ts).
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2, Sparkles } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { aktivitetskatalogApi } from '@/services/aktivitetskatalogApi'
import { AiConsentRequiredError } from '@/services/aiApi'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import { useAuthStore } from '@/stores/authStore'
import { AKTIVITETSTYP_ETIKETT } from '../aktivitetEtiketter'
import { foreslaAktiviteter, forslagTillPass, MAL_MAX_TECKEN, type Aktivitetsforslag, type PassForslag } from './aktivitetsforslag'

interface Props {
  /** Datumet som passet annars får — en post med fast veckodag flyttar det till nästa sådan dag. */
  franDatum: string
  onValj: (forslag: PassForslag) => void
}

export function AktivitetsforslagYta({ franDatum, onValj }: Props) {
  const orgSparr = useOrgAiSparr()
  const egenAiAv = useAuthStore((s) => s.profile?.ai_enabled === false)
  const aiAv = orgSparr != null || egenAiAv

  const [mal, setMal] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [forslag, setForslag] = useState<Aktivitetsforslag[] | null>(null)
  const [valt, setValt] = useState<string | null>(null)

  if (aiAv) {
    return (
      <p className="m-0 text-xs text-[var(--j-blak-3)]" role="status" data-testid="aktivitetsforslag">
        AI är avstängd. Välj aktivitet själv ur katalogen eller skriv passet nedan.
      </p>
    )
  }

  const foresla = async () => {
    if (!mal.trim() || laddar) return
    setLaddar(true)
    setFel(null)
    setForslag(null)
    setValt(null)
    try {
      const poster = await aktivitetskatalogApi.list()
      setForslag(await foreslaAktiviteter(mal, poster))
    } catch (err) {
      console.error('Aktivitetsförslag misslyckades:', err)
      setFel(
        err instanceof AiConsentRequiredError
          ? 'AI-funktionerna är avstängda för din organisation, eller så gick det inte att kontrollera inställningen just nu.'
          : err instanceof Error && /Skriv först|inga aktiva/.test(err.message)
            ? err.message
            : 'Förslagen kunde inte hämtas. Försök igen eller fyll i passet själv.',
      )
    } finally {
      setLaddar(false)
    }
  }

  return (
    <div className="grid gap-3 p-3 rounded-[var(--j-r-m)] border border-[var(--j-linje-2)]" data-testid="aktivitetsforslag">
      <Textarea
        id="forslag-mal"
        label="Deltagarens mål (valfritt, för förslag ur katalogen)"
        value={mal}
        maxLength={MAL_MAX_TECKEN}
        rows={2}
        onChange={(e) => setMal(e.target.value)}
        hint="Skriv utan namn. AI:n väljer bara bland kommunens egna aktiviteter och sparar inget."
      />
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void foresla()}
          disabled={!mal.trim() || laddar}
          leftIcon={laddar ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
        >
          {laddar ? 'Letar …' : 'Föreslå ur katalogen'}
        </Button>
      </div>
      {fel && <p role="alert" className="m-0 text-sm text-[var(--s-ogiltig-text)]">{fel}</p>}
      {forslag && forslag.length === 0 && (
        <p role="status" className="m-0 text-sm text-[var(--j-blak-2)]">Inget i katalogen passar tydligt till det målet.</p>
      )}
      {forslag && forslag.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-2" aria-label="Förslag ur katalogen">
          {forslag.map(({ post, motivering }) => (
            <li key={post.id} className="grid gap-1 p-3 rounded-[var(--j-r-m)] bg-[var(--j-sankt)]">
              <p className="m-0 text-sm font-medium text-[var(--j-blak)]">{post.title}</p>
              <p className="m-0 text-xs text-[var(--j-blak-3)]">
                {[AKTIVITETSTYP_ETIKETT[post.activity_type], post.location].filter(Boolean).join(' · ')}
              </p>
              <p className="m-0 text-sm text-[var(--j-blak-2)]" data-ai-generated="true">{motivering}</p>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setValt(post.id); onValj(forslagTillPass(post, franDatum)) }}
                >
                  {valt === post.id ? 'Ifyllt nedan' : 'Fyll i passet'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {forslag && forslag.length > 0 && (
        <p className="m-0 text-xs text-[var(--j-blak-3)]">Inget sparas förrän du klickar Lägg till.</p>
      )}
    </div>
  )
}
