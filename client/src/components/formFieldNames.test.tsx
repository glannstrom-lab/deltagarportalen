/**
 * UX31 — regressionsvakt för tillgängliga namn på formulärfält.
 *
 * Buggen: 20 av 43 synliga fält (mätt i webbläsare, 2026-08-04) hade inget
 * tillgängligt namn. Mönstret var alltid detsamma — en `<label>` som SYSKON
 * till fältet, utan `htmlFor`/`id`. Skärmläsaren läste "redigera, tomt", och
 * placeholdern (som ibland fanns) försvinner så fort man börjar skriva.
 *
 * Här låses de DELADE komponenterna, för det är de som multiplicerar felet:
 *   - `FocusWizardFrame` — stegets rubrik är frågan till fältet. 36 fält över
 *     18 wizards pekar hit med `aria-labelledby`.
 *   - `OccupationPicker` — används i profil, jobbsök och önskade yrken.
 *   - `TagInput` — namnet kom tidigare bara från placeholdern.
 *
 * OBS: jsdom ljuger om synlighet (`offsetParent` är alltid `null`), så den
 * här filen bevisar KOPPLINGEN, inte att fältet syns. Att det syns mäts i
 * riktig webbläsare — se rapporten för UX31.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FocusSalaryWizard } from '@/components/focus/pages/FocusSalaryWizard'
import { OccupationPicker } from '@/components/occupation/OccupationPicker'
import { TagInput } from '@/components/profile/forms/TagInput'

vi.mock('@/services/afTaxonomyApi', () => ({
  autocompleteOccupations: vi.fn(async () => []),
}))

describe('UX31 — fält får sitt namn från synlig text, inte från placeholder', () => {
  it('FocusWizardFrame: fältet namnges av stegets rubrik', () => {
    render(
      <MemoryRouter>
        <FocusSalaryWizard onExit={() => {}} />
      </MemoryRouter>
    )

    // Steg 1 heter "Vilken roll vill du veta lön för?" — det är fältets namn.
    const field = screen.getByRole('textbox', { name: /vilken roll vill du veta lön för/i })
    expect(field).toBeInTheDocument()
    // Placeholdern får finnas kvar som exempel, men den är inte namnet.
    expect(field.getAttribute('placeholder')).not.toBe(
      field.getAttribute('aria-label')
    )
  })

  it('OccupationPicker med `label` får en riktig <label htmlFor>', () => {
    render(<OccupationPicker onSelect={() => {}} label="Lägg till yrke" />)

    const input = screen.getByLabelText('Lägg till yrke')
    expect(input.tagName).toBe('INPUT')
    // Kopplingen ska gå via htmlFor/id — inte via aria-label.
    expect(input.getAttribute('aria-label')).toBeNull()
    expect(input.id).toBeTruthy()
  })

  it('OccupationPicker utan `label` faller tillbaka på ett aria-label — aldrig namnlöst', () => {
    render(<OccupationPicker onSelect={() => {}} placeholder="T.ex. lagerarbetare" />)

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-label')).toBeTruthy()
  })

  it('TagInput med `label` kopplar label till inmatningsfältet', () => {
    render(
      <TagInput
        tags={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        label="Lägg till ett intresse"
        placeholder="T.ex. Teknik"
      />
    )

    const input = screen.getByLabelText('Lägg till ett intresse')
    expect(input.tagName).toBe('INPUT')
    expect(input.id).toBeTruthy()
  })
})
