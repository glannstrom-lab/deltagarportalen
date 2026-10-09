/**
 * RD16 (rollspelet 2026-09-27): profilen mötte Anna med en välkomstguide i
 * fyra steg ("Varje steg räknas!") och med tal som "0 av 5" och "(0/10)" vid
 * tomma fält. Ett tomt fält är en invit, inte en nolla (CLAUDE.md, DESIGN.md
 * §1 och §12: hellre inline-tips än modal, och aldrig samma tour två gånger).
 *
 * Mutationer: lägg tillbaka <OnboardingModal /> i Profile.tsx, eller visa
 * räknaren när listan är tom → faller.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'
import { TagInput } from './forms/TagInput'
import { DesiredJobsList } from '@/components/occupation/DesiredJobsList'
import sv from '@/i18n/locales/sv.json'

vi.mock('@/components/occupation/OccupationPicker', () => ({ OccupationPicker: () => null }))

afterEach(cleanup)

describe('Profilen utan prestationstal (RD16)', () => {
  // Designpass 2026-10-09: det stängbara tipset är också borta — rådgivarens
  // hälsning överst (RadgivarHalsning) säger samma sak. Vakten gäller modalen.
  it('ingen välkomstmodal på profilsidan', () => {
    const kallkod = readFileSync(join(__dirname, '../../pages/Profile.tsx'), 'utf8')
    const utanKommentarer = kallkod.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/.*$/gm, '')
    expect(utanKommentarer).not.toMatch(/<OnboardingModal\b/)
  })

  it('en tom intresselista visar ingen räknare "0 av 5"', () => {
    render(<TagInput tags={[]} onAdd={() => {}} onRemove={() => {}} maxTags={5} />)
    expect(screen.queryByText(/0 av 5/)).toBeNull()
  })

  it('räknaren finns kvar när något är ifyllt', () => {
    render(<TagInput tags={['Bak']} onAdd={() => {}} onRemove={() => {}} maxTags={5} />)
    expect(screen.getByText('1 av 5')).toBeInTheDocument()
  })

  it('tom lista med önskade yrken: knappen säger "Lägg till yrke", utan (0/10)', () => {
    render(<DesiredJobsList jobs={[]} onChange={vi.fn()} maxJobs={10} />)
    expect(screen.getByRole('button', { name: 'Lägg till yrke' })).toBeInTheDocument()
    expect(screen.queryByText(/\(0\/10\)/)).toBeNull()
  })

  it('Din vardag säger inte "Ifylld" om en profil som själv säger att något saknas', () => {
    // Kortet räknar fyra fält; profilen räknar tolv. "Ifylld" sa emot "Att fylla i".
    expect(sv.minVardagHub.features.profile.filled).not.toBe('Ifylld')
  })
})
