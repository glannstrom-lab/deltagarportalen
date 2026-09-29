import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExperienceEditor } from './ExperienceEditor'
import { ContextualHelp } from './ContextualHelp'

describe('SV5: erfarenhetsradens tillgängliga namn', () => {
  it('är titel och företag, inte flytta-knappar och räknare', () => {
    render(
      <ExperienceEditor
        experiences={[{ id: 'e1', title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' } as never]}
        onChange={() => {}}
      />,
    )
    const rad = screen.getByRole('button', { name: 'Ny position' })
    expect(rad).toBeTruthy()
  })
})

describe('UT2: tidslucks-tipset', () => {
  it('visas inte utan jobb', () => {
    render(<ContextualHelp context="experience" data={[]} />)
    expect(screen.queryByText('Tidsluckor')).toBeNull()
  })
  it('visas när datumen har en lucka', () => {
    render(<ContextualHelp context="experience" data={[
      { startDate: '2015-01', endDate: '2016-01' },
      { startDate: '2019-01', endDate: '2020-01' },
    ]} />)
    expect(screen.getByText('Tidsluckor')).toBeTruthy()
  })
})
