/**
 * Tid på dygnet och grafikstil för Jobin-staden (spår JS).
 *
 * Tiden följer klockan och kontrolleras var femte minut, så att staden tänder
 * sina fönster om man sitter kvar in på kvällen.
 */
import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { tidFor, type Tid } from '@/data/varld'

export function useTidPaDygnet(): Tid {
  const [tid, setTid] = useState<Tid>(() => tidFor(new Date()))
  useEffect(() => {
    const id = window.setInterval(() => setTid(tidFor(new Date())), 5 * 60_000)
    return () => window.clearInterval(id)
  }, [])
  return tid
}

export function useVarld() {
  const tid = useTidPaDygnet()
  const stil = useSettingsStore((s) => s.grafikstil)
  const lugnt = useSettingsStore((s) => s.calmMode)
  return { tid, stil, lugnt }
}
