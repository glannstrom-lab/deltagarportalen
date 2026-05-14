/**
 * Snapshot-tester för 12 CV-mallar (D8, 2026-05-15)
 *
 * Skyddar mot visuell regression när vi refaktorerar.
 * Vid medveten ändring i mall: kör `npx vitest -u` för att uppdatera snapshot.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  MinimalTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  CreativeTemplate,
  NordicTemplate,
  CenteredTemplate,
  BudapestTemplate,
  RotterdamTemplate,
  ChicagoTemplate,
  AtelierTemplate,
  ManhattanTemplate,
  BerlinTemplate,
} from '../index'
import type { CVData } from '@/services/supabaseApi'

const sampleCV: CVData = {
  firstName: 'Anna',
  lastName: 'Andersson',
  title: 'Frontend Developer',
  email: 'anna@example.com',
  phone: '+46 70 123 45 67',
  location: 'Stockholm',
  summary:
    'Passionerad frontend-utvecklare med 5 års erfarenhet av React och TypeScript. Bygger användarvänliga gränssnitt med fokus på tillgänglighet.',
  workExperience: [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'Tech AB',
      startDate: '2022-01',
      endDate: '',
      current: true,
      description: 'Leder frontend-team. Migrerade legacy Angular till React.',
    },
    {
      id: '2',
      title: 'Frontend Developer',
      company: 'Webb-byrån',
      startDate: '2019-06',
      endDate: '2021-12',
      current: false,
      description: 'Byggde komponentbibliotek och e-handelslösningar.',
    },
  ],
  education: [
    {
      id: '1',
      degree: 'Civilingenjör',
      field: 'Datateknik',
      school: 'KTH',
      startDate: '2014',
      endDate: '2019',
    },
  ],
  skills: [
    { id: '1', name: 'React', level: 5 },
    { id: '2', name: 'TypeScript', level: 5 },
    { id: '3', name: 'CSS', level: 4 },
    { id: '4', name: 'Accessibility', level: 4 },
  ],
  languages: [
    { id: '1', name: 'Svenska', level: 'native' },
    { id: '2', name: 'Engelska', level: 'fluent' },
  ],
  certificates: [],
  links: [
    { id: '1', label: 'LinkedIn', url: 'https://linkedin.com/in/anna' },
  ],
  references: [],
  template: 'minimal',
  colorScheme: 'default',
}

const fullName = `${sampleCV.firstName} ${sampleCV.lastName}`

describe('CV-mallar — snapshot regression', () => {
  it('MinimalTemplate', () => {
    const { container } = render(<MinimalTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('ExecutiveTemplate', () => {
    const { container } = render(<ExecutiveTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('ModernTemplate', () => {
    const { container } = render(<ModernTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('CreativeTemplate', () => {
    const { container } = render(<CreativeTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('NordicTemplate', () => {
    const { container } = render(<NordicTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('CenteredTemplate', () => {
    const { container } = render(<CenteredTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('BudapestTemplate', () => {
    const { container } = render(<BudapestTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('RotterdamTemplate', () => {
    const { container } = render(<RotterdamTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('ChicagoTemplate', () => {
    const { container } = render(<ChicagoTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('AtelierTemplate', () => {
    const { container } = render(<AtelierTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('ManhattanTemplate', () => {
    const { container } = render(<ManhattanTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('BerlinTemplate', () => {
    const { container } = render(<BerlinTemplate data={sampleCV} fullName={fullName} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
