/**
 * KursForslag (KC15) — i "Lägg till pass": välj en kurs så fylls rubrik, typ och
 * sluttid i (starttiden behålls, längden = kursens uppskattade tid). Inget sparas
 * förrän konsulenten klickar Lägg till. Ingen AI, ingen migration.
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { Select } from '@/components/ui/Input'
import { KURSER, kursMinuter, kursTillPass } from '@/data/kurser'

interface Props {
  startTid: string
  onValj: (f: ReturnType<typeof kursTillPass>) => void
}

export function KursForslag({ startTid, onValj }: Props) {
  return (
    <Select
      id="pass-kurs"
      label="Lägg in en kurs ur kunskapsbanken (valfritt)"
      options={[
        { value: '', label: 'Ingen kurs' },
        ...KURSER.map((k) => ({ value: k.id, label: `${k.namn} (ca ${kursMinuter(k.delar)} min)` })),
      ]}
      value=""
      onChange={(e) => {
        const kurs = KURSER.find((k) => k.id === e.target.value)
        if (kurs) onValj(kursTillPass(kurs, startTid))
      }}
      fullWidth
    />
  )
}
