/**
 * Extensive tests for job matching logic
 * Tests the three matching sources and profile preference boosts
 */

import { describe, it, expect } from 'vitest'

// Import the matching functions (we need to extract them for testing)
// For now, we'll test the logic inline

// ============================================
// MOCK DATA
// ============================================

interface MockJob {
  id: string
  headline: string
  description: { text: string }
  employer: { name: string }
  employment_type?: { label: string }
  occupation?: { label: string }
  remote_work?: { option: string }
  workplace_address?: { municipality: string }
}

interface MockPreferences {
  employmentTypes: string[]
  remoteWork: 'yes' | 'no' | 'hybrid' | null
  driversLicense: string[]
  hasCar: boolean
  maxCommuteMinutes: number | null
  industries: string[]
}

// ============================================
// MATCHING FUNCTIONS (copied for testing)
// ============================================

function matchesEmploymentType(job: MockJob, preferredTypes: string[]): { matches: boolean; boost: number } {
  if (preferredTypes.length === 0) return { matches: true, boost: 0 }

  const jobType = job.employment_type?.label?.toLowerCase() || ''

  const typeMapping: Record<string, string[]> = {
    'fulltime': ['heltid', 'tillsvidare', 'fast anställning'],
    'parttime': ['deltid', 'halvtid'],
    'temporary': ['vikariat', 'tidsbegränsad', 'visstid', 'säsong'],
    'freelance': ['frilans', 'konsult', 'uppdrag'],
    'internship': ['praktik', 'trainee', 'lärling']
  }

  for (const pref of preferredTypes) {
    const keywords = typeMapping[pref] || []
    if (keywords.some(kw => jobType.includes(kw))) {
      return { matches: true, boost: 10 }
    }
  }

  return { matches: true, boost: -5 }
}

function matchesRemoteWork(job: MockJob, preference: 'yes' | 'no' | 'hybrid' | null): { matches: boolean; boost: number } {
  if (!preference) return { matches: true, boost: 0 }

  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
  const remoteOption = job.remote_work?.option?.toLowerCase() || ''

  const isRemote = remoteOption.includes('remote') ||
    jobText.includes('distans') ||
    jobText.includes('remote') ||
    jobText.includes('hemarbete') ||
    jobText.includes('jobba hemifrån')

  const isHybrid = remoteOption.includes('hybrid') ||
    jobText.includes('hybrid') ||
    jobText.includes('delvis distans') ||
    jobText.includes('flexibel arbetsplats')

  if (preference === 'yes') {
    if (isRemote) return { matches: true, boost: 15 }
    if (isHybrid) return { matches: true, boost: 5 }
    return { matches: true, boost: -5 }
  }

  if (preference === 'hybrid') {
    if (isHybrid) return { matches: true, boost: 15 }
    if (isRemote) return { matches: true, boost: 5 }
    return { matches: true, boost: 0 }
  }

  // preference === 'no'
  if (!isRemote && !isHybrid) return { matches: true, boost: 5 }
  return { matches: true, boost: 0 }
}

function matchesDriversLicense(job: MockJob, userLicenses: string[]): { matches: boolean; boost: number; detail: string | null } {
  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()

  const requiresLicense = jobText.includes('körkort') ||
    jobText.includes('b-körkort') ||
    jobText.includes('c-körkort') ||
    jobText.includes('ce-körkort') ||
    jobText.includes('truckkort')

  if (!requiresLicense) {
    return { matches: true, boost: 0, detail: null }
  }

  if (userLicenses.length === 0) {
    return { matches: true, boost: -10, detail: 'Körkort krävs' }
  }

  const hasB = userLicenses.some(l => l.toUpperCase() === 'B')
  const hasC = userLicenses.some(l => l.toUpperCase() === 'C')
  const hasCE = userLicenses.some(l => l.toUpperCase() === 'CE')

  if (jobText.includes('ce-körkort') || jobText.includes('ce körkort')) {
    if (hasCE) return { matches: true, boost: 15, detail: 'Du har CE-körkort ✓' }
    return { matches: true, boost: -15, detail: 'CE-körkort krävs' }
  }

  if (jobText.includes('c-körkort') || jobText.includes('c körkort')) {
    if (hasC || hasCE) return { matches: true, boost: 15, detail: 'Du har C-körkort ✓' }
    return { matches: true, boost: -15, detail: 'C-körkort krävs' }
  }

  if (jobText.includes('b-körkort') || jobText.includes('b körkort') ||
      (jobText.includes('körkort') && !jobText.includes('c-') && !jobText.includes('ce-'))) {
    if (hasB || hasC || hasCE) return { matches: true, boost: 10, detail: 'Du har B-körkort ✓' }
    return { matches: true, boost: -10, detail: 'B-körkort krävs' }
  }

  return { matches: true, boost: 0, detail: null }
}

function applyProfileBoosts(
  job: MockJob,
  baseScore: number,
  preferences: MockPreferences
): { score: number; details: string[] } {
  let score = baseScore
  const details: string[] = []

  const empMatch = matchesEmploymentType(job, preferences.employmentTypes)
  score += empMatch.boost

  const remoteMatch = matchesRemoteWork(job, preferences.remoteWork)
  score += remoteMatch.boost
  if (remoteMatch.boost > 0 && preferences.remoteWork === 'yes') {
    details.push('Distansarbete ✓')
  }

  const licenseMatch = matchesDriversLicense(job, preferences.driversLicense)
  score += licenseMatch.boost
  if (licenseMatch.detail && licenseMatch.boost > 0) {
    details.push(licenseMatch.detail)
  }

  if (preferences.hasCar) {
    const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
    if (jobText.includes('egen bil') || jobText.includes('tillgång till bil')) {
      score += 10
      details.push('Har bil ✓')
    }
  }

  score = Math.max(0, Math.min(100, score))

  return { score, details }
}

// ============================================
// TEST SCENARIOS
// ============================================

describe('Employment Type Matching', () => {
  const fulltimeJob: MockJob = {
    id: '1',
    headline: 'Systemutvecklare',
    description: { text: 'Vi söker en systemutvecklare' },
    employer: { name: 'TechAB' },
    employment_type: { label: 'Heltid, tillsvidare' }
  }

  const parttimeJob: MockJob = {
    id: '2',
    headline: 'Receptionist',
    description: { text: 'Deltidstjänst' },
    employer: { name: 'HotelAB' },
    employment_type: { label: 'Deltid' }
  }

  const vikariateJob: MockJob = {
    id: '3',
    headline: 'Lärarvikariat',
    description: { text: 'Vikariat under sommaren' },
    employer: { name: 'Skolan' },
    employment_type: { label: 'Vikariat' }
  }

  it('should boost fulltime job for user wanting fulltime', () => {
    const result = matchesEmploymentType(fulltimeJob, ['fulltime'])
    expect(result.boost).toBe(10)
  })

  it('should penalize parttime job for user wanting fulltime', () => {
    const result = matchesEmploymentType(parttimeJob, ['fulltime'])
    expect(result.boost).toBe(-5)
  })

  it('should boost parttime job for user wanting parttime', () => {
    const result = matchesEmploymentType(parttimeJob, ['parttime'])
    expect(result.boost).toBe(10)
  })

  it('should boost vikariat for user accepting temporary', () => {
    const result = matchesEmploymentType(vikariateJob, ['temporary'])
    expect(result.boost).toBe(10)
  })

  it('should return no boost if user has no preference', () => {
    const result = matchesEmploymentType(fulltimeJob, [])
    expect(result.boost).toBe(0)
  })

  it('should handle multiple preferences', () => {
    const result = matchesEmploymentType(parttimeJob, ['fulltime', 'parttime'])
    expect(result.boost).toBe(10) // parttime matches
  })
})

describe('Remote Work Matching', () => {
  const remoteJob: MockJob = {
    id: '1',
    headline: 'Remote Developer',
    description: { text: 'Arbeta på distans, jobba hemifrån' },
    employer: { name: 'RemoteAB' },
    remote_work: { option: 'remote' }
  }

  const hybridJob: MockJob = {
    id: '2',
    headline: 'Hybrid konsult',
    description: { text: 'Flexibel arbetsplats, hybrid möjligt' },
    employer: { name: 'FlexAB' }
  }

  const onsiteJob: MockJob = {
    id: '3',
    headline: 'Lagerarbetare',
    description: { text: 'Arbete på plats i lagret' },
    employer: { name: 'LagerAB' }
  }

  it('should give +15 for remote job when user wants remote', () => {
    const result = matchesRemoteWork(remoteJob, 'yes')
    expect(result.boost).toBe(15)
  })

  it('should give +5 for hybrid job when user wants remote', () => {
    const result = matchesRemoteWork(hybridJob, 'yes')
    expect(result.boost).toBe(5)
  })

  it('should give -5 for onsite job when user wants remote', () => {
    const result = matchesRemoteWork(onsiteJob, 'yes')
    expect(result.boost).toBe(-5)
  })

  it('should give +15 for hybrid job when user wants hybrid', () => {
    const result = matchesRemoteWork(hybridJob, 'hybrid')
    expect(result.boost).toBe(15)
  })

  it('should give +5 for onsite job when user prefers onsite', () => {
    const result = matchesRemoteWork(onsiteJob, 'no')
    expect(result.boost).toBe(5)
  })

  it('should return 0 if user has no preference', () => {
    const result = matchesRemoteWork(remoteJob, null)
    expect(result.boost).toBe(0)
  })
})

describe('Drivers License Matching', () => {
  const driverJob: MockJob = {
    id: '1',
    headline: 'Chaufför',
    description: { text: 'Vi söker chaufför med B-körkort och egen bil' },
    employer: { name: 'TransportAB' }
  }

  const truckJob: MockJob = {
    id: '2',
    headline: 'Lastbilschaufför',
    description: { text: 'Krav: C-körkort för tunga fordon' },
    employer: { name: 'LogistikAB' }
  }

  const officeJob: MockJob = {
    id: '3',
    headline: 'Administratör',
    description: { text: 'Kontorsarbete i centrala Stockholm' },
    employer: { name: 'KontorAB' }
  }

  it('should give +10 for B-license job when user has B', () => {
    const result = matchesDriversLicense(driverJob, ['B'])
    expect(result.boost).toBe(10)
    expect(result.detail).toBe('Du har B-körkort ✓')
  })

  it('should give -10 for B-license job when user has no license', () => {
    const result = matchesDriversLicense(driverJob, [])
    expect(result.boost).toBe(-10)
    expect(result.detail).toBe('Körkort krävs')
  })

  it('should give +15 for C-license job when user has C', () => {
    const result = matchesDriversLicense(truckJob, ['B', 'C'])
    expect(result.boost).toBe(15)
  })

  it('should give -15 for C-license job when user only has B', () => {
    const result = matchesDriversLicense(truckJob, ['B'])
    expect(result.boost).toBe(-15)
    expect(result.detail).toBe('C-körkort krävs')
  })

  it('should give 0 for office job (no license required)', () => {
    const result = matchesDriversLicense(officeJob, [])
    expect(result.boost).toBe(0)
    expect(result.detail).toBe(null)
  })

  it('should accept CE for C-requirement', () => {
    const result = matchesDriversLicense(truckJob, ['B', 'CE'])
    expect(result.boost).toBe(15)
  })
})

describe('Combined Profile Boosts', () => {
  const perfectMatchJob: MockJob = {
    id: '1',
    headline: 'Remote Utvecklare',
    description: { text: 'Heltid, distansarbete möjligt, B-körkort krävs' },
    employer: { name: 'TechAB' },
    employment_type: { label: 'Heltid' }
  }

  it('should combine all boosts for perfect match', () => {
    const preferences: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: ['B'],
      hasCar: false,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(perfectMatchJob, 60, preferences)
    // Base: 60
    // Employment: +10 (heltid matches fulltime)
    // Remote: +15 (distansarbete matches 'yes')
    // License: +10 (B-körkort matches)
    // Total: 95
    expect(result.score).toBe(95)
    expect(result.details).toContain('Distansarbete ✓')
    expect(result.details).toContain('Du har B-körkort ✓')
  })

  it('should penalize mismatched preferences', () => {
    const onsiteJob: MockJob = {
      id: '2',
      headline: 'Kontorsassistent',
      description: { text: 'Deltid på kontoret, C-körkort krävs' },
      employer: { name: 'KontorAB' },
      employment_type: { label: 'Deltid' }
    }

    const preferences: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: ['B'],
      hasCar: false,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(onsiteJob, 60, preferences)
    // Base: 60
    // Employment: -5 (deltid doesn't match fulltime)
    // Remote: -5 (onsite doesn't match 'yes')
    // License: -15 (C required but user has B)
    // Total: 35
    expect(result.score).toBe(35)
  })

  it('should add car boost when job requires car and user has one', () => {
    const carRequiredJob: MockJob = {
      id: '3',
      headline: 'Hemtjänst',
      description: { text: 'B-körkort och egen bil krävs för arbetet' },
      employer: { name: 'KommunAB' },
      employment_type: { label: 'Heltid' }
    }

    const preferences: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: null,
      driversLicense: ['B'],
      hasCar: true,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(carRequiredJob, 50, preferences)
    // Base: 50
    // Employment: +10
    // Remote: 0 (no preference)
    // License: +10 (B-körkort)
    // Car: +10
    // Total: 80
    expect(result.score).toBe(80)
    expect(result.details).toContain('Har bil ✓')
  })

  it('should cap score at 100', () => {
    const perfectJob: MockJob = {
      id: '4',
      headline: 'Drömjobb',
      description: { text: 'Heltid, distansarbete, egen bil behövs, b-körkort' },
      employer: { name: 'DrömAB' },
      employment_type: { label: 'Heltid' }
    }

    const preferences: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: ['B'],
      hasCar: true,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(perfectJob, 90, preferences)
    // Base: 90
    // Employment: +10
    // Remote: +15
    // License: +10
    // Car: +10
    // Total would be 135, but capped at 100
    expect(result.score).toBe(100)
  })

  it('should floor score at 0', () => {
    const badMatchJob: MockJob = {
      id: '5',
      headline: 'Lastbilschaufför',
      description: { text: 'CE-körkort krävs, deltid' },
      employer: { name: 'TransportAB' },
      employment_type: { label: 'Deltid' }
    }

    const preferences: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: [],
      hasCar: false,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(badMatchJob, 10, preferences)
    // Base: 10
    // Employment: -5
    // Remote: -5
    // License: -10 (no license but körkort required)
    // Total would be -10, but floored at 0
    expect(result.score).toBe(0)
  })
})

describe('Real-world Scenarios', () => {
  describe('Scenario 1: Developer looking for remote work', () => {
    const userPrefs: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: ['B'],
      hasCar: false,
      maxCommuteMinutes: 45,
      industries: ['IT']
    }

    it('Perfect remote dev job should score high', () => {
      const job: MockJob = {
        id: '1',
        headline: 'Senior Fullstack Developer',
        description: { text: 'Heltidsanställning, 100% remote möjligt. JavaScript, React, Node.js' },
        employer: { name: 'TechStartup AB' },
        employment_type: { label: 'Heltid, tillsvidare' }
      }

      const result = applyProfileBoosts(job, 85, userPrefs)
      expect(result.score).toBeGreaterThanOrEqual(95)
    })

    it('Hybrid dev job should score well', () => {
      const job: MockJob = {
        id: '2',
        headline: 'React Developer',
        description: { text: 'Heltid med hybrid möjlighet, 2 dagar på kontoret' },
        employer: { name: 'ConsultAB' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 80, userPrefs)
      expect(result.score).toBeGreaterThanOrEqual(90)
    })

    it('Onsite-only job should score lower', () => {
      const job: MockJob = {
        id: '3',
        headline: 'Java Developer',
        description: { text: 'Heltid, arbete på plats i Kista' },
        employer: { name: 'BankAB' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 80, userPrefs)
      expect(result.score).toBeLessThan(90)
    })
  })

  describe('Scenario 2: Truck driver with CE license', () => {
    const userPrefs: MockPreferences = {
      employmentTypes: ['fulltime', 'temporary'],
      remoteWork: 'no',
      driversLicense: ['B', 'C', 'CE'],
      hasCar: true,
      maxCommuteMinutes: 60,
      industries: ['Transport']
    }

    it('CE truck job should score very high', () => {
      const job: MockJob = {
        id: '1',
        headline: 'Lastbilschaufför heltid',
        description: { text: 'CE-körkort krävs. Kör tunga transporter i hela Sverige.' },
        employer: { name: 'Schenker' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 70, userPrefs)
      // Base: 70, Employment: +10, Remote: +5 (onsite for 'no' pref), License: +15
      expect(result.score).toBe(100) // Capped
    })

    it('C-only truck job should also score high', () => {
      const job: MockJob = {
        id: '2',
        headline: 'Distributionschaufför',
        description: { text: 'C-körkort krävs. Lokala leveranser.' },
        employer: { name: 'PostNord' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 65, userPrefs)
      expect(result.score).toBeGreaterThanOrEqual(85)
    })

    it('Office job should score lower for truck driver', () => {
      const job: MockJob = {
        id: '3',
        headline: 'Transportadministratör',
        description: { text: 'Kontorsarbete, planering av transporter' },
        employer: { name: 'DHL' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 40, userPrefs)
      // No license boost, onsite boost
      expect(result.score).toBeLessThan(60)
    })
  })

  describe('Scenario 3: Part-time healthcare worker', () => {
    const userPrefs: MockPreferences = {
      employmentTypes: ['parttime'],
      remoteWork: 'no',
      driversLicense: ['B'],
      hasCar: true,
      maxCommuteMinutes: 30,
      industries: ['Vård']
    }

    it('Part-time care job with car requirement should score high', () => {
      const job: MockJob = {
        id: '1',
        headline: 'Undersköterska hemtjänst',
        description: { text: 'Deltid 75%, B-körkort och egen bil krävs' },
        employer: { name: 'Stockholms kommun' },
        employment_type: { label: 'Deltid' }
      }

      const result = applyProfileBoosts(job, 75, userPrefs)
      // Base: 75, Employment: +10 (parttime), Remote: +5 (onsite), License: +10, Car: +10
      expect(result.score).toBe(100) // Capped
      expect(result.details).toContain('Har bil ✓')
      expect(result.details).toContain('Du har B-körkort ✓')
    })

    it('Full-time care job should score lower', () => {
      const job: MockJob = {
        id: '2',
        headline: 'Sjuksköterska avdelning',
        description: { text: 'Heltid på sjukhus' },
        employer: { name: 'Region Stockholm' },
        employment_type: { label: 'Heltid' }
      }

      const result = applyProfileBoosts(job, 70, userPrefs)
      // Employment: -5 (not parttime)
      expect(result.score).toBeLessThan(75)
    })
  })

  describe('Scenario 4: Student looking for internship', () => {
    const userPrefs: MockPreferences = {
      employmentTypes: ['internship', 'parttime'],
      remoteWork: 'hybrid',
      driversLicense: [],
      hasCar: false,
      maxCommuteMinutes: 45,
      industries: []
    }

    it('Hybrid internship should score highest', () => {
      const job: MockJob = {
        id: '1',
        headline: 'UX Design Praktikant',
        description: { text: 'Praktik 6 månader, hybrid arbete möjligt' },
        employer: { name: 'DesignByrå AB' },
        employment_type: { label: 'Praktik' }
      }

      const result = applyProfileBoosts(job, 80, userPrefs)
      // Employment: +10 (internship), Remote: +15 (hybrid)
      expect(result.score).toBe(100) // 80 + 10 + 15 = 105, capped
    })

    it('Job requiring license should score lower', () => {
      const job: MockJob = {
        id: '2',
        headline: 'Sommarjobb butik',
        description: { text: 'B-körkort krävs för varuleveranser' },
        employer: { name: 'ICA' },
        employment_type: { label: 'Säsongsarbete' }
      }

      const result = applyProfileBoosts(job, 60, userPrefs)
      // License: -10 (required but student has none)
      expect(result.score).toBeLessThan(60)
    })
  })
})

// ============================================
// EDGE CASES
// ============================================

describe('Edge Cases', () => {
  it('should handle job with no employment type specified', () => {
    const job: MockJob = {
      id: '1',
      headline: 'Mystery Job',
      description: { text: 'No details available' },
      employer: { name: 'Unknown' }
    }

    const result = matchesEmploymentType(job, ['fulltime'])
    expect(result.boost).toBe(-5) // No match found
  })

  it('should handle empty description', () => {
    const job: MockJob = {
      id: '1',
      headline: 'Test',
      description: { text: '' },
      employer: { name: 'Test' }
    }

    const result = matchesDriversLicense(job, ['B'])
    expect(result.boost).toBe(0)
  })

  it('should handle null remote_work option', () => {
    const job: MockJob = {
      id: '1',
      headline: 'Test',
      description: { text: 'Normal office job' },
      employer: { name: 'Test' }
    }

    const result = matchesRemoteWork(job, 'yes')
    expect(result.boost).toBe(-5) // No remote indicators found
  })

  it('should handle license in headline', () => {
    const job: MockJob = {
      id: '1',
      headline: 'Chaufför med B-körkort',
      description: { text: 'Leveranser i stan' },
      employer: { name: 'Delivery' }
    }

    const result = matchesDriversLicense(job, ['B'])
    expect(result.boost).toBe(10)
  })

  it('should handle Swedish characters in job text', () => {
    const job: MockJob = {
      id: '1',
      headline: 'Sjuksköterska på vårdavdelning',
      description: { text: 'Arbete på heltid, möjlighet till distansarbete för dokumentation' },
      employer: { name: 'Karolinska' },
      employment_type: { label: 'Heltid, tillsvidare' }
    }

    const prefs: MockPreferences = {
      employmentTypes: ['fulltime'],
      remoteWork: 'yes',
      driversLicense: [],
      hasCar: false,
      maxCommuteMinutes: null,
      industries: []
    }

    const result = applyProfileBoosts(job, 70, prefs)
    expect(result.score).toBeGreaterThan(70)
  })
})

console.log('All tests defined. Run with: npm test')
