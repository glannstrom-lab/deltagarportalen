/**
 * Kommandopaletten — Ctrl/⌘ K.  (Steg 1 i navigationsomläggningen, 2026-08-17)
 *
 * Varför den finns: genomgången 2026-08-17 fastställde att "svårt att hitta
 * saker" är ett navigationsproblem, inte ett tätshetsproblem. Portalen har
 * **25 undersidor bakom 5 hubbar** — för att nå Löneläget måste man i dag veta
 * att det ligger under Söka jobb, öppna hubben och läsa igenom nio kort.
 *
 * Paletten är medvetet **fristående**: den rör ingen layout, inget
 * designsystem och ingen route. Den fungerar lika bra i dagens luftiga
 * gränssnitt som i den tvåradiga toppnaven, och blir reservutgången om
 * toppnaven visar sig trång på mobil (beslut Mikael 2026-08-17).
 *
 * Vad den INTE gör, med flit:
 * - Ingen fuzzy-matchning à la fzf. Målgruppen har ofta låg digital vana;
 *   en sökning som hittar "Löneläget" på "lg" hittar också fel saker på
 *   stavfel, och en oväntad träfflista är värre än ingen. Substrängmatchning
 *   på ord, med normaliserade svenska tecken, är begripligt.
 * - Inga påhittade resultat. Listan byggs ur `navHubs` — samma källa som
 *   sidomenyn — så den kan aldrig visa en sida som inte finns. Jfr fyndet om
 *   artikellänkar mot en Set som inte var en routematchare.
 * - Ingen historik i v1. "Senast använt" kräver att vi börjar logga
 *   sidbesök, vilket är ett dataskyddsbeslut och inte ett UI-beslut.
 *
 * Tillgänglighet: combobox-mönstret enligt WAI-ARIA APG. Fokusfälla och
 * Escape via `useFocusTrap` (projektets etablerade hook, 13 modaler använder
 * den). `aria-activedescendant` flyttar skärmläsarens uppmärksamhet utan att
 * flytta tangentbordsfokus ur fältet, så man kan fortsätta skriva.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from '@/components/ui/icons'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAuthStore } from '@/stores/authStore'
import { navHubs, adminNavItems, consultantNavItems } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'
import { matchar, poang, type PalettMal } from '@/lib/palettMatchning'

export default function CommandPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [aktiv, setAktiv] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(open, {
    onEscape: () => setOpen(false),
    // Fältet fokuseras manuellt nedan; hookens autofokus hade tagit första
    // listposten i stället, och då kan man inte skriva.
    autoFocus: false,
  })

  const activeRole = profile?.activeRole || profile?.role || 'USER'
  const isSuperAdmin = activeRole === 'SUPERADMIN'
  const isAdmin = activeRole === 'ADMIN' || isSuperAdmin
  const isConsultant =
    activeRole === 'CONSULTANT' || activeRole === 'ARBETSTERAPEUT' || isAdmin

  /**
   * Målen byggs ur navHubs — samma källa som sidomenyn och bottennavet.
   * Att bygga en egen lista här hade varit den klassiska buggen: två listor
   * som glider isär, och en palett som skickar folk till sidor som tagits bort.
   */
  const mal = useMemo<PalettMal[]>(() => {
    const ut: PalettMal[] = []

    for (const hub of navHubs) {
      const hubLabel = t(hub.labelKey, hub.fallbackLabel)
      // Hubben själv är ett mål — den är en riktig sida med egen route.
      ut.push({ path: hub.path, label: hubLabel, grupp: hubLabel, domain: hub.domain })
      for (const item of hub.items) {
        ut.push({ path: item.path, label: t(item.labelKey), grupp: hubLabel, domain: hub.domain })
      }
    }

    if (isConsultant) {
      for (const item of consultantNavItems) {
        ut.push({ path: item.path, label: t(item.labelKey), grupp: t('nav.groups.consultant', 'Konsulent') })
      }
    }
    if (isAdmin) {
      for (const item of adminNavItems) {
        ut.push({ path: item.path, label: t(item.labelKey), grupp: t('nav.groups.admin', 'Admin') })
      }
    }

    // Dubbletter kan uppstå om en path råkar ligga i två listor. Första
    // förekomsten vinner — och lint:schema-lärdomen gäller här också: hellre
    // en deterministisk lista än en som beror på ordningen av en slump.
    const sedda = new Set<string>()
    return ut.filter((m) => (sedda.has(m.path) ? false : (sedda.add(m.path), true)))
  }, [t, isConsultant, isAdmin])

  const traffar = useMemo(() => {
    return mal
      .filter((m) => matchar(m, q))
      .sort((a, b) => poang(b, q) - poang(a, q))
      .slice(0, 12)
  }, [mal, q])

  /**
   * Markeringen KLÄMS under render i stället för att korrigeras i en effekt.
   *
   * Första versionen hade en `useEffect` som nollställde `aktiv` när träffarna
   * krympte. `react-hooks/set-state-in-effect` fällde den, och med rätta: det
   * ger en extra renderrunda där `aktiv` pekar utanför listan, och i den rundan
   * kan Enter aktivera en post som inte finns. Att räkna fram värdet direkt
   * gör mellanläget omöjligt.
   */
  const aktivIndex = traffar.length ? Math.min(aktiv, traffar.length - 1) : 0

  // Öppna/stäng med Ctrl/⌘ K. Lyssnaren sitter på document eftersom paletten
  // ska gå att öppna oavsett var fokus står. Nollställningen ligger här och
  // inte i en effekt — den hör till händelsen "paletten öppnades", inte till
  // ett tillstånd som behöver synkas.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => {
          if (!v) {
            setQ('')
            setAktiv(0)
          }
          return !v
        })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Fokus i fältet när panelen finns i DOM. Ingen setState här, så regeln
  // ovan gäller inte — det här är en riktig sidoeffekt mot omvärlden.
  useEffect(() => {
    if (!open) return
    // requestAnimationFrame: elementet finns först efter portalens rendering.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const ga = useCallback(
    (path: string) => {
      setOpen(false)
      navigate(path)
    },
    [navigate]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktiv((i) => (traffar.length ? (i + 1) % traffar.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktiv((i) => (traffar.length ? (i - 1 + traffar.length) % traffar.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const val = traffar[aktivIndex]
      if (val) ga(val.path)
    }
  }

  // Rulla den markerade posten i sikte utan att flytta tangentbordsfokus.
  useEffect(() => {
    const el = listRef.current?.children[aktivIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [aktivIndex])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center p-4 pt-[12vh] bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title', 'Sök och hoppa till')}
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <Search className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="palett-lista"
            aria-autocomplete="list"
            aria-activedescendant={traffar[aktivIndex] ? `palett-${aktivIndex}` : undefined}
            aria-label={t('palette.placeholder', 'Sök efter en sida eller ett verktyg')}
            placeholder={t('palette.placeholder', 'Sök efter en sida eller ett verktyg')}
            className="flex-1 bg-transparent text-[15px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            aria-label={t('common.close', 'Stäng')}
            className="p-1 rounded-md text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Antalet läses upp när det ändras — annars vet en skärmläsaranvändare
            inte om skrivandet gav noll eller tolv träffar. */}
        <p className="sr-only" role="status" aria-live="polite">
          {t('palette.resultCount', {
            defaultValue: '{{count}} träffar',
            count: traffar.length,
          })}
        </p>

        {traffar.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {t('palette.empty', 'Ingenting matchade det du skrev.')}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {t('palette.emptyHint', 'Prova ett kortare ord — till exempel "cv" eller "brev".')}
            </p>
          </div>
        ) : (
          <ul id="palett-lista" ref={listRef} role="listbox" className="max-h-80 overflow-y-auto py-1">
            {traffar.map((m, i) => (
              <li
                key={m.path}
                id={`palett-${i}`}
                role="option"
                aria-selected={i === aktivIndex}
                onMouseEnter={() => setAktiv(i)}
                onClick={() => ga(m.path)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 cursor-pointer text-[14px]',
                  i === aktivIndex ? 'bg-stone-100 dark:bg-stone-800' : ''
                )}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: m.domain ? `var(--${m.domain}-solid)` : 'var(--c-solid)' }}
                />
                <span className="text-stone-900 dark:text-stone-100 truncate">{m.label}</span>
                <span className="ml-auto text-xs text-stone-500 dark:text-stone-400 shrink-0">
                  {m.grupp}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-4 px-4 py-2 border-t border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400">
          <span>↑↓ {t('palette.hintMove', 'bläddra')}</span>
          <span>↵ {t('palette.hintOpen', 'öppna')}</span>
          <span>Esc {t('palette.hintClose', 'stäng')}</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
