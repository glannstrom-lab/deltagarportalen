import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExperienceEditor } from './ExperienceEditor'
import { ContextualHelp } from './ContextualHelp'
import { EducationEditor } from './EducationEditor'

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

describe('SV5-rest: inga interaktiva element i interaktiva element (WCAG 4.1.2)', () => {
  const exp = [
    { id: 'e1', title: 'Lagerarbetare', company: 'Nordfrakt', location: '', startDate: '', endDate: '', current: false, description: '' },
    { id: 'e2', title: 'Chaufför', company: 'Bilab', location: '', startDate: '', endDate: '', current: false, description: '' },
  ] as never[]
  const edu = [
    { id: 'u1', school: 'Komvux', degree: 'Truckförarbevis', field: '', startDate: '', endDate: '', current: false, description: '' },
    { id: 'u2', school: 'Folkhögskola', degree: 'Allmän kurs', field: '', startDate: '', endDate: '', current: false, description: '' },
  ] as never[]

  it('erfarenhetsraden är en riktig button och flytta-knapparna är dess syskon', () => {
    render(<ExperienceEditor experiences={exp} onChange={() => {}} />)
    const rad = screen.getByRole('button', { name: 'Lagerarbetare, Nordfrakt' })
    expect(rad.tagName).toBe('BUTTON')
    expect(rad).toHaveAttribute('aria-expanded', 'false')
    expect(rad.querySelector('button, [role="button"]')).toBeNull()
    expect(rad.contains(screen.getByRole('button', { name: /Flytta Lagerarbetare nedåt/ }))).toBe(false)
    expect(document.querySelectorAll('[role="button"] button').length).toBe(0)
  })

  it('utbildningsraden likaså', () => {
    render(<EducationEditor education={edu} onChange={() => {}} />)
    const rad = screen.getByRole('button', { name: 'Truckförarbevis, Komvux' })
    expect(rad.tagName).toBe('BUTTON')
    expect(rad.querySelector('button, [role="button"]')).toBeNull()
    expect(rad.contains(screen.getByRole('button', { name: /Flytta Truckförarbevis nedåt/ }))).toBe(false)
  })

  it('raden fäller ut med klick', () => {
    render(<ExperienceEditor experiences={exp} onChange={() => {}} />)
    const rad = screen.getByRole('button', { name: 'Lagerarbetare, Nordfrakt' })
    fireEvent.click(rad)
    expect(rad).toHaveAttribute('aria-expanded', 'true')
  })
})
