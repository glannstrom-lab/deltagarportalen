/**
 * PassFlaggorFalt — de två märkningarna per pass (RR27, rollspelet 2026-09-27):
 * vem som håller i passet och om det är fysiskt eller digitalt. Används av
 * "Lägg till pass" och "Ändra pass". Visas bara när kolumnerna finns
 * (PENDING_20260927d, se services/planMarkning.ts) — anroparen avgör det.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { Select } from '@/components/ui/Input'

export interface Flaggor {
  is_provider_led: boolean
  is_physical: boolean
}

export function PassFlaggorFalt({ idPrefix, varde, onChange }: { idPrefix: string; varde: Flaggor; onChange: (f: Flaggor) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Select
        id={`${idPrefix}-ledning`}
        label="Vem håller i passet"
        options={[
          { value: 'ja', label: 'Verksamheten (leverantörsledd)' },
          { value: 'nej', label: 'Deltagarens egen aktivitet' },
        ]}
        value={varde.is_provider_led ? 'ja' : 'nej'}
        onChange={(e) => onChange({ ...varde, is_provider_led: e.target.value === 'ja' })}
        hint="Avtalsloggen räknar bara pass som verksamheten håller i."
        fullWidth
      />
      <Select
        id={`${idPrefix}-form`}
        label="Form"
        options={[
          { value: 'fysiskt', label: 'Fysiskt' },
          { value: 'digitalt', label: 'Digitalt' },
        ]}
        value={varde.is_physical ? 'fysiskt' : 'digitalt'}
        onChange={(e) => onChange({ ...varde, is_physical: e.target.value === 'fysiskt' })}
        hint="Andelen fysiska aktiviteter räknas på det här."
        fullWidth
      />
    </div>
  )
}
