/**
 * Gör en namngiven ikonkomponent, t.ex. IkonNarvaro = skapaKvarterIkon('narvaro').
 * Egen .ts-fil med createElement: KvarterIkon.tsx får bara exportera
 * komponenter (react-refresh/only-export-components).
 */
import { createElement, forwardRef } from 'react'
import { KvarterIkon, type KvarterIkonProps } from './KvarterIkon'
import type { KvarterNamn } from './ritningar'

export function skapaKvarterIkon(namn: KvarterNamn) {
  const Ikon = forwardRef<SVGSVGElement, KvarterIkonProps>(function Ikon(props, ref) {
    return createElement(KvarterIkon, { ...props, ref, namn })
  })
  Ikon.displayName = `Kvarter(${namn})`
  return Ikon
}
