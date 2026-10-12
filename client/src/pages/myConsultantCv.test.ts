import { describe, it, expect } from 'vitest'
import { cvIfyllda } from './myConsultantCv'

describe('cvIfyllda (KSL26b)', () => {
  it('listar bara delar med innehåll, aldrig en procent', () => {
    expect(cvIfyllda({ summary: ' ', work_experience: [], education: [{}], skills: [{ name: 'x' }] })).toEqual(['education', 'skills'])
  })
  it('tomt CV ger tom lista', () => {
    expect(cvIfyllda({ summary: null, skills: null })).toEqual([])
  })
})
