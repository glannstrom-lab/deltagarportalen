/**
 * KF2 (2026-10-18): månadsunderlag för grundersättningen i Rusta och matcha 2 —
 * leverantörens egen avstämning mot AF:s "Underlag ekonomi" i Mina sidor och
 * inköpsordern. Jobin fakturerar inte och skickar inget till AF.
 *
 * Regel (FFU Af-2025/0017 v3 §5.1): dagbelopp efter nivå (A 55 / B 70 / C 90 kr),
 * femdagarsvecka utan röda dagar, från startdatum till avbrott, 80 % vid
 * anvisning under 100 %. Saknas nivå eller deltagandegrad räknas ingen summa —
 * raden säger vad som saknas i stället för att gissa.
 *
 * Det AF kräver för rätten att fakturera (godkänd gemensam planering, periodisk
 * redovisning) syns inte i Jobin och står därför som en påminnelse i filen.
 * Inget personnummer i filen — ärendenumret är matchningsnyckeln.
 */
import { GRUND_PER_DAG } from './rom2Ersattning'
import { ersattningsbaraDagar } from '@/lib/svenskaHelgdagar'
import type { ActivityPlan } from './aktivitetApi'

export interface GrundRad {
  namn: string
  arende: string | null
  niva: 'A' | 'B' | 'C' | null
  start: string
  slut: string | null
  deltagandegrad: number | null
  dagar: number
  dagbelopp: number | null
  faktor: number | null
  summa: number | null
  anmarkning: string
}

function manadensGranser(manad: string) {
  const [ar, m] = manad.split('-').map(Number)
  const sista = new Date(ar, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return { forsta: `${manad}-01`, sista: `${ar}-${mm}-${String(sista).padStart(2, '0')}` }
}

export function grundersattningRader(
  planer: readonly ActivityPlan[],
  manad: string,
  namnFor: (p: ActivityPlan) => string,
): GrundRad[] {
  const { forsta, sista } = manadensGranser(manad)
  return planer
    .filter((p) => p.start_date <= sista && (!p.end_date || p.end_date >= forsta))
    .map((p) => {
      const niva = p.rom_niva ?? null
      const grad = p.deltagandegrad ?? null
      const dagar = ersattningsbaraDagar(manad, p.start_date, p.end_date)
      const saknas = [!niva && 'nivå', grad == null && 'deltagandegrad'].filter(Boolean) as string[]
      const dagbelopp = niva ? GRUND_PER_DAG[niva] : null
      const faktor = grad == null ? null : grad < 100 ? 0.8 : 1
      const summa = dagbelopp != null && faktor != null ? Math.round(dagar * dagbelopp * faktor * 100) / 100 : null
      return {
        namn: namnFor(p),
        arende: p.case_reference ?? null,
        niva, start: p.start_date, slut: p.end_date, deltagandegrad: grad, dagar, dagbelopp, faktor, summa,
        anmarkning: saknas.length ? `Ange ${saknas.join(' och ')} på planen` : '',
      }
    })
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
}

const cell = (v: string | number | null) => {
  if (v == null) return ''
  const s = typeof v === 'number' ? String(v).replace('.', ',') : v
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Semikolon och decimalkomma — öppnas rätt i svensk Excel. BOM så å/ä/ö överlever. */
export function grundersattningCsv(rader: readonly GrundRad[], manad: string): string {
  const huvud = ['Deltagare', 'Ärendenummer', 'Nivå', 'Startdatum', 'Avbrott/slut', 'Deltagandegrad %', 'Ersättningsbara dagar', 'Dagbelopp kr', 'Faktor', 'Grundersättning kr (exkl. moms)', 'Anmärkning']
  const rows = rader.map((r) => [r.namn, r.arende, r.niva, r.start, r.slut, r.deltagandegrad, r.dagar, r.dagbelopp, r.faktor, r.summa, r.anmarkning].map(cell).join(';'))
  const total = rader.reduce((s, r) => s + (r.summa ?? 0), 0)
  const ofullstandiga = rader.filter((r) => r.summa == null).length
  return '﻿' + [
    `Grundersättning Rusta och matcha — ${manad};;;;;;;;;;`,
    `Källa: FFU Af-2025/0017 v3 §5.1. Avstäm mot AF:s "Underlag ekonomi" i Mina sidor. Rätten att fakturera kräver godkänd gemensam planering och periodisk redovisning — det syns inte i Jobin.;;;;;;;;;;`,
    huvud.join(';'),
    ...rows,
    `Summa;;;;;;;;;${cell(Math.round(total * 100) / 100)};${ofullstandiga ? cell(`${ofullstandiga} rad(er) utan summa`) : ''}`,
  ].join('\r\n')
}
