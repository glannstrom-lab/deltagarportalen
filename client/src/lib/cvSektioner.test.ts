import { describe, it, expect } from 'vitest'
import { tommaCvSektioner, arCvPaborjat } from './cvSektioner'

describe('cvSektioner (FN4)', () => {
  it('listar tomma sektioner i CV-byggarens ordning', () => {
    expect(tommaCvSektioner({ summary: '', work_experience: [], education: [], skills: [] }))
      .toEqual(['summary', 'work_experience', 'education', 'skills'])
    expect(tommaCvSektioner({ summary: 'Hej', work_experience: [{ title: 'Lager' }], education: null, skills: [] }))
      .toEqual(['education', 'skills'])
  })

  it('skills i prod-formen (objekt) räknas som ifyllt; blanka strängar som tomma', () => {
    expect(tommaCvSektioner({
      summary: '   ',
      work_experience: [{}],
      education: [{}],
      skills: [{ id: 'a', name: 'Truck', level: 3, category: 'x' }],
    })).toEqual(['summary'])
  })

  it('påbörjat = namn eller minst en sektion', () => {
    expect(arCvPaborjat({})).toBe(false)
    expect(arCvPaborjat({ first_name: 'Anna' })).toBe(true)
    expect(arCvPaborjat({ skills: [{ name: 'x' }] })).toBe(true)
    expect(arCvPaborjat({ first_name: ' ', summary: '', skills: [] })).toBe(false)
  })
})
