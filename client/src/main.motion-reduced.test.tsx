/**
 * TI2 — MotionConfig i roten ska respektera prefers-reduced-motion.
 *
 * main.tsx själv går inte att montera i ett test (den gör
 * `ReactDOM.createRoot` mot ett riktigt DOM-element och drar in hela App-
 * trädet med routing, Sentry-lazy-load osv). Det här testet monterar därför
 * EXAKT samma primitiv main.tsx nu använder — `<MotionConfig
 * reducedMotion="user">` från framer-motion — och läser samma interna hook
 * (`useReducedMotionConfig`) som Framer Motions animationsmotor själv
 * konsulterar för att avgöra om en transform-animation ska köras.
 *
 * Viktigt att veta om mekanismen (läst i node_modules/framer-motion, källan
 * till varför testet ser ut som det gör):
 * - `useReducedMotion()` läser OS-inställningen en gång per process
 *   (`prefersReducedMotion` i motion-dom är en modul-singleton) — den cachas
 *   alltså över hela testfilen efter första anropet och kan INTE flippas
 *   fram och tillbaka mellan tester. Därför sätts OS-preferensen till "true"
 *   en gång, före allt annat.
 * - Det som faktiskt avgör om en animation stängs av är
 *   `useReducedMotionConfig()`: den kombinerar OS-preferensen med
 *   `reducedMotion`-värdet i `MotionConfigContext`. Utan en MotionConfig-
 *   förälder är kontextens default `reducedMotion: "never"` — vilket
 *   uttryckligen IGNORERAR OS-inställningen. Det är precis den bristen TI2
 *   stänger: main.tsx saknade en `MotionConfig reducedMotion="user"` i
 *   roten, så alla 25 filer som importerar framer-motion körde animationer
 *   even om användaren bett om reducerad rörelse.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { MotionConfig, useReducedMotionConfig } from 'framer-motion'

function ReducedMotionConfigProbe() {
  const shouldReduceMotion = useReducedMotionConfig()
  return <div data-testid="probe">{String(shouldReduceMotion)}</div>
}

describe('TI2 — rot-MotionConfig (main.tsx) och prefers-reduced-motion', () => {
  beforeAll(() => {
    // Sätts EN gång: framer-motions OS-avläsning är en modul-singleton och
    // cachas för resten av processen vid första anropet (se filhuvudet).
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    cleanup()
  })

  it('under MotionConfig reducedMotion="user" (main.tsx:s rot-konfiguration) respekteras OS-inställningen: animationsmotorn ser shouldReduceMotion = true', () => {
    render(
      <MotionConfig reducedMotion="user">
        <ReducedMotionConfigProbe />
      </MotionConfig>
    )

    expect(screen.getByTestId('probe').textContent).toBe('true')
  })

  it('utan MotionConfig-roten ignoreras samma OS-inställning helt — framer-motions default (reducedMotion="never") gör att animationsmotorn ser shouldReduceMotion = false. Det är exakt den brist TI2 stänger genom main.tsx.', () => {
    render(<ReducedMotionConfigProbe />)

    expect(screen.getByTestId('probe').textContent).toBe('false')
  })

  it('MotionConfig reducedMotion="never" (framer-motions default, uttryckligt) ger samma resultat som ingen MotionConfig alls — bekräftar att det är värdet "user", inte bara närvaron av MotionConfig, som gör skillnaden', () => {
    render(
      <MotionConfig reducedMotion="never">
        <ReducedMotionConfigProbe />
      </MotionConfig>
    )

    expect(screen.getByTestId('probe').textContent).toBe('false')
  })
})
