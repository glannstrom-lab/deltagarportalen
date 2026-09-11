import { describe, it, expect } from 'vitest'
import { arTestkonto } from './testkonton'

describe('arTestkonto (BL5)', () => {
  it.each([
    'claude-playwright-consultant@jobin.test',
    'km-konsulent@jobin.test',
    'km-deltagare@jobin.test',
    'test@example.com',
    'testuser@example.com',
    'claude-playwright-test@jobin.se',
    'jobin.uxtest.karriar.2026@gmail.com',
  ])('känner igen %s som testkonto', (email) => {
    expect(arTestkonto(email)).toBe(true)
  })

  it('är skiftlägesokänslig', () => {
    expect(arTestkonto('Claude-Playwright-Test@Jobin.SE')).toBe(true)
    expect(arTestkonto('KM-KONSULENT@JOBIN.TEST')).toBe(true)
  })

  it.each([
    'anna@orebro.se',
    'mikael@jobin.se',
    'test@jobin.se',
    'jobin.uxtest.karriar@hotmail.com',
    'uxtest@gmail.com',
    'someone@notexample.com',
  ])('släpper igenom en riktig adress: %s', (email) => {
    expect(arTestkonto(email)).toBe(false)
  })

  it('tål tomt och trasigt', () => {
    expect(arTestkonto(null)).toBe(false)
    expect(arTestkonto(undefined)).toBe(false)
    expect(arTestkonto('')).toBe(false)
    expect(arTestkonto('@jobin.test')).toBe(false)
  })
})
