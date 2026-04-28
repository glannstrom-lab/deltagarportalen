import { describe, it } from 'vitest'

/**
 * HUB-01 loader tests — Wave 0 stubs (Plan 03 fills implementation).
 * Each it.skip names a behavior Plan 03's wiring task must satisfy.
 */
describe('useJobsokHubSummary', () => {
  it.skip('fires Promise.all of 5 supabase selects on mount (HUB-01 loader)', () => {
    // Plan 03 wires real assertions
  })

  it.skip('populates [application-stats] cache key after loader resolves (HUB-01 cache-sync)', () => {
    // After loader resolves, queryClient.getQueryData(['application-stats']) returns stats
  })

  it.skip('populates [cv-versions] and [cover-letters] cache keys after loader resolves (HUB-01 cache-sync)', () => {
    // Deep-link cache pre-populated for instant /cv and /cover-letter navigation
  })
})
