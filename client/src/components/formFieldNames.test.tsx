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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FocusDiaryWizard } from '@/components/focus/pages/FocusDiaryWizard'
import { FocusSalaryWizard } from '@/components/focus/pages/FocusSalaryWizard'
import { OccupationPicker } from '@/components/occupation/OccupationPicker'
import { TagInput } from '@/components/profile/forms/TagInput'

vi.mock('@/services/afTaxonomyApi', () => ({
  autocompleteOccupations: vi.fn(async () => []),
}))

describe('UX31 — fält får sitt namn från synlig text, inte från placeholder', () => {
  it('FocusWizardFrame: fältet namnges av stegets rubrik', () => {
    // Dagboksguiden i stället för lönegudien: lönegudien har inga fritextfält
    // längre (2026-08-20), den väljer i samma listor som kalkylatorn. Ramen
    // är densamma och det är den som lockas här.
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <FocusDiaryWizard onExit={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const field = screen.getByRole('textbox', { name: /vad hände idag/i })
    expect(field).toBeInTheDocument()
    // Placeholdern får finnas kvar som exempel, men den är inte namnet.
    expect(field.getAttribute('placeholder')).not.toBe(
      field.getAttribute('aria-label')
    )
  })

  it('FocusSalaryWizard: valen är knappar med läsbart namn och tillstånd', () => {
    // Guiden bytte från två fritextfält (vars svar aldrig gick någonstans)
    // till val ur samma listor som kalkylatorn använder. Då är kravet ett
    // annat: varje val ska ha ett namn och ett avläsbart valt-läge.
    render(
      <MemoryRouter>
        <FocusSalaryWizard
          val={{ yrke: '', region: '', erfarenhet: '' }}
          onValChange={() => {}}
          onExit={() => {}}
        />
      </MemoryRouter>
    )

    const val = screen.getByRole('button', { name: /administration/i })
    expect(val).toHaveAttribute('aria-pressed', 'false')
    // Inget namnlöst fält får finnas kvar i steget.
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
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
