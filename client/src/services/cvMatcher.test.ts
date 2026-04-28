/**
 * Tester för cvMatcher — deterministisk matchning av CV mot jobbannons.
 * Detta är jobbsökningens kärna: scoren bestämmer relevans-rankning.
 */
import { describe, it, expect } from 'vitest'
import { cvMatcher, type CVData } from './cvMatcher'

const baseCV: CVData = {
  skills: ['JavaScript', 'TypeScript', 'React'],
  experiences: [
    {
      title: 'Frontend-utvecklare',
      description: 'Utvecklat webbappar i React och Node.js',
      years: 3,
    },
  ],
  education: [
    { degree: 'Kandidat', field: 'Datavetenskap' },
  ],
  languages: ['Svenska', 'Engelska'],
}

const baseJob = {
  id: 'job-1',
  headline: 'Frontend-utvecklare',
  description: { text: 'Vi söker en erfaren frontend-utvecklare med JavaScript och React.' },
  must_have: { skills: [{ label: 'JavaScript' }, { label: 'React' }] },
  occupation: { label: 'Webbutvecklare' },
} as Parameters<typeof cvMatcher.analyzeMatch>[1]

describe('cvMatcher.analyzeMatch', () => {
  it('returnerar matchningsstruktur med alla nödvändiga fält', () => {
    const result = cvMatcher.analyzeMatch(baseCV, baseJob)
    expect(result).toMatchObject({
      score: expect.any(Number),
      matchedSkills: expect.any(Array),
      missingSkills: expect.any(Array),
      recommendations: expect.any(Array),
      overallAssessment: expect.any(String),
    })
  })

  it('ger hög score (>50) när CV matchar huvudkraven', () => {
    const result = cvMatcher.analyzeMatch(baseCV, baseJob)
    expect(result.score).toBeGreaterThan(50)
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['javascript', 'react'])
    )
  })

  it('ger låg score (<30) när CV inte matchar', () => {
    const irrelevantCV: CVData = {
      skills: ['Snickeri', 'Möbelsnickeri'],
      experiences: [
        { title: 'Snickare', description: 'Bygger möbler i trä', years: 5 },
      ],
      education: [{ degree: 'Gymnasie', field: 'Hantverk' }],
      languages: ['Svenska'],
    }
    const result = cvMatcher.analyzeMatch(irrelevantCV, baseJob)
    expect(result.score).toBeLessThan(30)
    expect(result.missingSkills.length).toBeGreaterThan(0)
  })

  it('matchar via synonymer (javascript ↔ js)', () => {
    const cvWithJsAlias: CVData = {
      ...baseCV,
      skills: ['JS', 'TypeScript'],  // 'JS' istället för 'JavaScript'
    }
    const result = cvMatcher.analyzeMatch(cvWithJsAlias, baseJob)
    // 'javascript' i jobbet ska matcha via synonym till 'js' i CV:t
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['javascript'])
    )
  })

  it('extraherar kompetenser från experience-beskrivning, inte bara skills', () => {
    const cvOnlyExperience: CVData = {
      skills: [],
      experiences: [
        {
          title: 'Webbutvecklare',
          description: 'Skrev React-komponenter och TypeScript-kod dagligen',
          years: 2,
        },
      ],
      education: [],
      languages: [],
    }
    const result = cvMatcher.analyzeMatch(cvOnlyExperience, baseJob)
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['react'])
    )
  })

  it('returnerar max 10 matched och 10 missing skills', () => {
    const result = cvMatcher.analyzeMatch(baseCV, baseJob)
    expect(result.matchedSkills.length).toBeLessThanOrEqual(10)
    expect(result.missingSkills.length).toBeLessThanOrEqual(10)
  })

  it('cap:ar score till max 100', () => {
    const result = cvMatcher.analyzeMatch(baseCV, baseJob)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('hanterar tomt jobb utan att krascha', () => {
    const emptyJob = {
      id: 'empty',
      headline: '',
      description: { text: '' },
    } as Parameters<typeof cvMatcher.analyzeMatch>[1]
    const result = cvMatcher.analyzeMatch(baseCV, emptyJob)
    expect(result).toMatchObject({
      score: expect.any(Number),
      matchedSkills: expect.any(Array),
    })
  })
})
