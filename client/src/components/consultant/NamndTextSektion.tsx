/**
 * NamndTextSektion — AIX16, i nämndrapportens alternativsteg.
 *
 * Chefen kan be om ett utkast till en löptext ("Under kvartalet …") ur den
 * redan räknade statistiken. Texten är ett TILLÄGG som chefen redigerar och som
 * hamnar under tabellen i PDF:en med märkningen "Utkast med AI-stöd, granskat av
 * …". Den ersätter aldrig tabellerna. Visas bara när spärren A2 är hävd.
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2, Sparkles } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AiConsentRequiredError } from '@/services/aiApi'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import { useAuthStore } from '@/stores/authStore'
import type { Namndrapport } from '@/services/namndrapportPdf'
import { foreslaNamndtext } from '@/services/namndTextApi'

interface Props {
  /** Hämtar (och räknar om) kvartalets underlag — samma som PDF:en bygger på. */
  hamtaUnderlag: () => Promise<Namndrapport>
  text: string
  /** `franAi` = texten kommer från ett AI-utkast (märks i PDF:en); handskrivet ändrar inte märkningen. */
  onText: (text: string, franAi?: boolean) => void
}

export function NamndTextSektion({ hamtaUnderlag, text, onText }: Props) {
  const orgSparr = useOrgAiSparr()
  const egenAiAv = useAuthStore((s) => s.profile?.ai_enabled === false)
  const aiAv = orgSparr != null || egenAiAv

  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [struket, setStruket] = useState(0)

  if (aiAv) {
    return (
      <p className="m-0 text-xs text-stone-500 dark:text-stone-400" role="status" data-testid="namndtext">
        AI är avstängd. Tabellerna räcker som rapport, eller skriv ett eget tillägg ovan.
      </p>
    )
  }

  const skriv = async () => {
    if (laddar) return
    setLaddar(true)
    setFel(null)
    setStruket(0)
    try {
      const forslag = await foreslaNamndtext(await hamtaUnderlag())
      onText(forslag.text, true)
      setStruket(forslag.struket)
    } catch (err) {
      console.error('Nämndtexten kunde inte skrivas:', err)
      setFel(
        err instanceof AiConsentRequiredError
          ? 'AI-funktionerna är avstängda för din organisation, eller så gick det inte att kontrollera inställningen just nu.'
          : err instanceof Error && /för litet/.test(err.message)
            ? err.message
            : 'Utkastet kunde inte skrivas. Försök igen, eller skriv tillägget själv.',
      )
    } finally {
      setLaddar(false)
    }
  }

  return (
    <div className="space-y-2" data-testid="namndtext">
      <label htmlFor="namnd-tillagg" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        Text till nämnden (tillägg, valfritt)
      </label>
      <textarea
        id="namnd-tillagg"
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={6}
        maxLength={1800}
        className="w-full px-4 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void skriv()}
          disabled={laddar}
          leftIcon={laddar ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
        >
          {laddar ? 'Skriver …' : 'Skriv ett utkast med AI'}
        </Button>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          AI:n får bara kvartalets summor per grupp, aldrig enskilda deltagare, och inga tal under 5. Texten hamnar under tabellerna och ersätter dem inte.
        </span>
      </div>
      {struket > 0 && (
        <p role="status" className="m-0 text-xs text-stone-500 dark:text-stone-400">
          {struket === 1 ? 'En mening' : `${struket} meningar`} togs bort automatiskt: de nämnde ett tal som inte finns i underlaget, en orsak eller en jämförelse över tid. Läs ändå igenom texten: den är kontrollerad mot underlaget, inte mot sanningen.
        </p>
      )}
      {fel && <p role="alert" className="text-sm text-[var(--s-ogiltig-text)]">{fel}</p>}
    </div>
  )
}
