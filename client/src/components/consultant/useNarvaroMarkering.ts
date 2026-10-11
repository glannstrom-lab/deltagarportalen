/**
 * useNarvaroMarkering — att spara närvaro för en lista pass (omtaget, steg 4).
 *
 * Delas av Gruppnärvaron och Dagens pass så att reglerna bor på ett ställe:
 *   - varje skrivning går genom `aktivitetsplanApi.markAttendance`, samma väg
 *     som deltagarsidan
 *   - massåtgärder tar ett pass i taget; ett fel stoppar inte resten och varje
 *     fel namnges
 *   - "Ångra" (nollställ) finns bara för det som markerats på den här skärmen —
 *     då vet vi att det inte fanns någon anteckning som en nollställning raderar
 *     (markAttendance skriver om attendance_note)
 *
 * Ett val i en rad sparas efter en kort paus (SPARA_EFTER_MS). NarvaroVal är en
 * radiogrupp där piltangenten flyttar OCH väljer; utan pausen skulle en pil från
 * "Här" till "Sjuk" passera "Ogiltig" och skicka deltagaren en notis om ogiltig
 * frånvaro i förbifarten. Valet syns direkt (utkast) och skrivs när det står still.
 *
 * Inget sparas utan konsulentens klick. Förslagen (lib/gruppnarvaro.ts) är bara
 * förslag tills någon av funktionerna här anropas.
 */
import { useEffect, useRef, useState } from 'react'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'
import type { PassIdag } from '@/lib/dagensPass'

/** Hur länge ett val får stå still innan det skrivs. */
export const SPARA_EFTER_MS = 500

function med(mangd: Set<string>, id: string, pa: boolean): Set<string> {
  const ny = new Set(mangd)
  if (pa) ny.add(id)
  else ny.delete(id)
  return ny
}

export function useNarvaroMarkering(args: {
  namnFor: (participantId: string) => string
  /** Anropas med det sparade passet så att föräldern kan uppdatera sin lista. */
  onSparat: (id: string, attendance: Attendance | null) => void
}) {
  const { namnFor, onSparat } = args
  const [sparar, setSparar] = useState<Set<string>>(new Set())
  const [markeradeHar, setMarkeradeHar] = useState<Set<string>>(new Set())
  const [besked, setBesked] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [utkast, setUtkast] = useState<Map<string, Attendance>>(new Map())
  const timrar = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; skriv: () => void }>())

  const spara = async (p: PassIdag, attendance: Attendance | null): Promise<boolean> => {
    setSparar((s) => med(s, p.id, true))
    try {
      const uppdaterad = await aktivitetsplanApi.markAttendance(p.id, { attendance })
      onSparat(p.id, uppdaterad.attendance)
      setMarkeradeHar((m) => med(m, p.id, attendance !== null))
      return true
    } catch {
      return false
    } finally {
      setSparar((s) => med(s, p.id, false))
    }
  }

  /** Ett val i en rad. */
  const markera = async (p: PassIdag, attendance: Attendance | null) => {
    setBesked(null)
    setFel(null)
    if (!(await spara(p, attendance))) setFel(`Närvaron för ${namnFor(p.participant_id)} kunde inte sparas. Försök igen.`)
  }

  /** Ett val i radiogruppen: syns direkt, skrivs när det stått still SPARA_EFTER_MS. */
  const valj = (p: PassIdag, attendance: Attendance) => {
    setUtkast((u) => new Map(u).set(p.id, attendance))
    const fore = timrar.current.get(p.id)
    if (fore) clearTimeout(fore.timer)
    const skriv = () => {
      timrar.current.delete(p.id)
      void markera(p, attendance).finally(() =>
        setUtkast((u) => {
          if (u.get(p.id) !== attendance) return u
          const ny = new Map(u)
          ny.delete(p.id)
          return ny
        }),
      )
    }
    timrar.current.set(p.id, { timer: setTimeout(skriv, SPARA_EFTER_MS), skriv })
  }

  // Lämnar konsulenten skärmen mitt i en paus skrivs valet ändå — hon har klickat.
  useEffect(() => {
    const vantande = timrar.current
    return () => {
      for (const { timer, skriv } of vantande.values()) {
        clearTimeout(timer)
        skriv()
      }
    }
  }, [])

  /** Flera pass, ett i taget. `text(n)` blir beskedet för de som lyckades. */
  const markeraFlera = async (lista: ReadonlyArray<{ pass: PassIdag; varde: Attendance }>, text: (n: number) => string) => {
    setBesked(null)
    setFel(null)
    const misslyckade: string[] = []
    for (const { pass, varde } of lista) {
      if (!(await spara(pass, varde))) misslyckade.push(namnFor(pass.participant_id))
    }
    const lyckade = lista.length - misslyckade.length
    if (lyckade > 0) setBesked(text(lyckade))
    if (misslyckade.length > 0) setFel(`Kunde inte spara för ${misslyckade.join(', ')}. Försök igen.`)
  }

  return { sparar, markeradeHar, besked, fel, utkast, markera, valj, markeraFlera, upptagen: sparar.size > 0 || utkast.size > 0 }
}
