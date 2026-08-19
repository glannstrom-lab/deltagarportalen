/**
 * Vakt mot att en användares hämtade data överlever in i nästa användares
 * session i samma flik.
 *
 * Bakgrund (2026-08-19): utloggningen rensade localStorage (A31) men inte
 * React Query-cachen, och `signOut` navigerar bara — ingen omladdning tömmer
 * den åt oss. Cachenycklar utan användar-id, som `['spontaneous-companies']`,
 * matchade därför nästa inloggade person, och med `gcTime: 10 min` hann ingen
 * ny hämtning ske innan hon såg föregående deltagares uppgifter. Målgruppen
 * sitter ofta på delade datorer — det är hela motiveringen bakom A31.
 *
 * Två oberoende skydd testas här, för de skyddar mot olika saker:
 *  1. `rensaAllCache()` tömmer — skyddar när utloggningen körs.
 *  2. nyckeln bär användar-id — skyddar när den INTE körs (stängd flik,
 *     kraschad session, kontobyte via onAuthStateChange).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { queryClient, rensaAllCache } from './queryClient'
import { SPONTANEOUS_COMPANIES_KEY } from '@/hooks/useSpontaneousCompanies'

beforeEach(() => {
  queryClient.clear()
})

describe('rensaAllCache', () => {
  it('tömmer cachen så att nästa användare inte ser föregåendes data', async () => {
    queryClient.setQueryData(['spontaneous-companies', 'user-a'], [{ id: '1', name: 'A:s företag' }])
    queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)

    await rensaAllCache()

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(queryClient.getQueryData(['spontaneous-companies', 'user-a'])).toBeUndefined()
    expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
  })

  it('tömmer, inte bara invaliderar — den gamla datan får inte ligga kvar under tiden', async () => {
    queryClient.setQueryData(['saved-jobs'], [{ id: 'jobb-1' }])
    await rensaAllCache()
    // `invalidateQueries` hade lämnat värdet kvar tills en ny hämtning svarat,
    // och det fönstret är precis där fel persons uppgifter syns.
    expect(queryClient.getQueryData(['saved-jobs'])).toBeUndefined()
  })
})

describe('SPONTANEOUS_COMPANIES_KEY', () => {
  it('bär användarens id, så två användare aldrig delar cachepost', () => {
    const a = SPONTANEOUS_COMPANIES_KEY('user-a')
    const b = SPONTANEOUS_COMPANIES_KEY('user-b')
    expect(a).not.toEqual(b)
    expect(a).toContain('user-a')
  })

  it('separerar utloggat läge från en inloggad användare', () => {
    expect(SPONTANEOUS_COMPANIES_KEY(undefined)).not.toEqual(SPONTANEOUS_COMPANIES_KEY('user-a'))
  })

  it('två användares data lever sida vid sida utan att skriva över varandra', () => {
    queryClient.setQueryData(SPONTANEOUS_COMPANIES_KEY('user-a'), [{ id: '1' }])
    queryClient.setQueryData(SPONTANEOUS_COMPANIES_KEY('user-b'), [{ id: '2' }, { id: '3' }])

    expect(queryClient.getQueryData(SPONTANEOUS_COMPANIES_KEY('user-a'))).toHaveLength(1)
    expect(queryClient.getQueryData(SPONTANEOUS_COMPANIES_KEY('user-b'))).toHaveLength(2)
  })
})
