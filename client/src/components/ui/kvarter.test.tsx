/**
 * Omtaget "Kvarter" (2026-10-11): primitiverna och ikonsetet.
 *
 * Testerna kontrollerar det som förslaget kräver och som kan falla tyst:
 * att ett statuschip aldrig blir bara färg, att närvarovalet är en riktig
 * radiogrupp med piltangenter, att veckoremsan har text för skärmläsare och
 * att ett nästa steg har exakt en primärknapp.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { StatusChip } from './StatusChip'
import { NastaSteg } from './NastaSteg'
import { NarvaroVal } from './NarvaroVal'
import { Veckoremsa } from './Veckoremsa'
import { PersonRad } from './PersonRad'
import { MerMeny } from './MerMeny'
import { STATUSAR, NARVARO_STANDARDVAL, STATUS_ORD_SV, franNarvarovarde, initialerAv } from './kvarterStatus'
import * as Kvarter from './icons/kvarter'

describe('StatusChip', () => {
  it.each(STATUSAR)('status %s har alltid ord och ikon', (status) => {
    const { container } = render(<StatusChip status={status} />)
    const chip = container.querySelector(`[data-status="${status}"]`) as HTMLElement
    expect(chip).not.toBeNull()
    expect(chip.textContent?.trim()).toBe(STATUS_ORD_SV[status])
    expect(chip.querySelector('svg[data-kvarter]')).not.toBeNull()
  })

  it('ett tomt barn ger statusens ord, inte en tom färgklick', () => {
    const { container } = render(<StatusChip status="ogiltig">{'   '}</StatusChip>)
    expect(container.textContent?.trim()).toBe('Ogiltig frånvaro')
  })

  it('egen text ersätter ordet', () => {
    render(<StatusChip status="vantar">Väntar på kvittens</StatusChip>)
    expect(screen.getByText('Väntar på kvittens')).toBeInTheDocument()
  })

  it('färgen kommer ur tokens, inte ur Tailwind-färgklasser', () => {
    const { container } = render(<StatusChip status="sjuk" />)
    const chip = container.firstElementChild as HTMLElement
    expect(chip.style.backgroundColor).toBe('var(--s-sjuk-bg)')
    expect(chip.style.color).toBe('var(--s-sjuk-text)')
    expect(chip.className).not.toMatch(/\b(text|bg)-(stone|red|green|amber|blue|purple)-\d/)
  })
})

describe('NastaSteg', () => {
  it('har exakt en primärknapp — också med sekundär handling', () => {
    const { container } = render(
      <NastaSteg
        rubrik="Markera närvaro för gruppträffen"
        text="Fyra har checkat in själva."
        tid="13:00"
        handling={{ etikett: 'Markera närvaro', onClick: () => {} }}
        sekundar={{ etikett: 'Senare', onClick: () => {} }}
      />,
    )
    expect(container.querySelectorAll('[data-variant="primary"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-variant="secondary"]')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Markera närvaro' })).toHaveAttribute('data-variant', 'primary')
  })

  it('är en namngiven region med rubriken och etiketten "Nästa steg · tid"', () => {
    render(
      <NastaSteg rubrik="Skriv en rad om Leila" tid="13:00" handling={{ etikett: 'Skriv', onClick: () => {} }} />,
    )
    expect(screen.getByRole('region', { name: 'Skriv en rad om Leila' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Skriv en rad om Leila' })).toBeInTheDocument()
    expect(screen.getByText('Nästa steg · 13:00')).toBeInTheDocument()
  })

  it('primärknappen kör handlingen', () => {
    const klick = vi.fn()
    render(<NastaSteg rubrik="R" handling={{ etikett: 'Gör det', onClick: klick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gör det' }))
    expect(klick).toHaveBeenCalledTimes(1)
  })
})

function KontrolleradNarvaro({ start = null as string | null, onChange = (_v: string) => {} }) {
  const [v, setV] = useState<string | null>(start)
  return (
    <NarvaroVal
      etikett="Närvaro för Leila Haddad"
      alternativ={NARVARO_STANDARDVAL}
      varde={v}
      onChange={(n) => {
        setV(n)
        onChange(n)
      }}
    />
  )
}

describe('NarvaroVal', () => {
  it('är en namngiven radiogrupp med ett radio per val', () => {
    render(<KontrolleradNarvaro />)
    const grupp = screen.getByRole('radiogroup', { name: 'Närvaro för Leila Haddad' })
    const radios = within(grupp).getAllByRole('radio')
    expect(radios.map((r) => r.textContent)).toEqual(['Här', 'Giltig', 'Ogiltig', 'Sjuk'])
    radios.forEach((r) => expect(r).toHaveAttribute('aria-checked', 'false'))
  })

  it('har en tabbstopp: första valet när inget är valt, annars det valda', () => {
    const { unmount } = render(<KontrolleradNarvaro />)
    let tabbar = screen.getAllByRole('radio').map((r) => r.tabIndex)
    expect(tabbar).toEqual([0, -1, -1, -1])
    unmount()
    render(<KontrolleradNarvaro start="absent_invalid" />)
    tabbar = screen.getAllByRole('radio').map((r) => r.tabIndex)
    expect(tabbar).toEqual([-1, -1, 0, -1])
    expect(screen.getByRole('radio', { name: 'Ogiltig' })).toHaveAttribute('aria-checked', 'true')
  })

  it('pil höger väljer nästa och flyttar fokus; pil vänster går runt till sista', () => {
    const andrat = vi.fn()
    render(<KontrolleradNarvaro start="present" onChange={andrat} />)
    const har = screen.getByRole('radio', { name: 'Här' })
    har.focus()
    fireEvent.keyDown(har, { key: 'ArrowRight' })
    const giltig = screen.getByRole('radio', { name: 'Giltig' })
    expect(giltig).toHaveAttribute('aria-checked', 'true')
    expect(har).toHaveAttribute('aria-checked', 'false')
    expect(document.activeElement).toBe(giltig)
    expect(andrat).toHaveBeenLastCalledWith('absent_valid')

    fireEvent.keyDown(giltig, { key: 'ArrowLeft' })
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Här' }), { key: 'ArrowLeft' })
    const sjuk = screen.getByRole('radio', { name: 'Sjuk' })
    expect(sjuk).toHaveAttribute('aria-checked', 'true')
    expect(document.activeElement).toBe(sjuk)
  })

  it('pil ned/upp, Home och End fungerar som i en radiogrupp', () => {
    render(<KontrolleradNarvaro start="present" />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Här' }), { key: 'End' })
    expect(screen.getByRole('radio', { name: 'Sjuk' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Sjuk' }), { key: 'ArrowDown' })
    expect(screen.getByRole('radio', { name: 'Här' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Här' }), { key: 'ArrowUp' })
    expect(screen.getByRole('radio', { name: 'Sjuk' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Sjuk' }), { key: 'Home' })
    expect(screen.getByRole('radio', { name: 'Här' })).toHaveAttribute('aria-checked', 'true')
  })

  it('mellanslag väljer det fokuserade valet; klick väljer', () => {
    render(<KontrolleradNarvaro />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Här' }), { key: ' ' })
    expect(screen.getByRole('radio', { name: 'Här' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Ogiltig' }))
    expect(screen.getByRole('radio', { name: 'Ogiltig' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })

  it('etiketterna kommer från props — kundtypen styr orden', () => {
    render(
      <NarvaroVal
        etikett="Närvaro"
        varde={null}
        onChange={() => {}}
        alternativ={[
          { varde: 'present', etikett: 'På plats', status: 'narvarande' },
          { varde: 'external', etikett: 'Annan aktivitet', status: 'narvarande' },
        ]}
      />,
    )
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['På plats', 'Annan aktivitet'])
  })
})

describe('Veckoremsa', () => {
  const dagar = [
    { datum: '2026-10-05', status: 'narvarande' as const, detalj: 'Språkcafé' },
    { datum: '2026-10-06', status: null },
    { datum: '2026-10-07', status: 'vantar' as const },
    { datum: '2026-10-08', status: 'sjuk' as const },
    { datum: '2026-10-09', status: 'ogiltig' as const, detalj: 'Gruppträff' },
  ]

  it.each(['kompakt', 'stor'] as const)('%s: varje dag har skärmläsartext med veckodag, datum och status', (storlek) => {
    render(<Veckoremsa rubrik="Leilas vecka" dagar={dagar} storlek={storlek} />)
    const lista = screen.getByRole('list', { name: 'Leilas vecka' })
    const poster = within(lista).getAllByRole('listitem')
    expect(poster).toHaveLength(5)
    const texter = poster.map((p) => p.querySelector('.sr-only')?.textContent)
    expect(texter).toEqual([
      'Måndag 5 oktober: Närvarande. Språkcafé',
      'Tisdag 6 oktober: Inget pass',
      'Onsdag 7 oktober: Väntar på dig',
      'Torsdag 8 oktober: Sjuk',
      'Fredag 9 oktober: Ogiltig frånvaro. Gruppträff',
    ])
  })

  it('datumet tolkas som lokal dag, inte UTC-midnatt', () => {
    // I svensk tid ger new Date('2026-10-05') ändå rätt dag (02:00), så felet
    // syns bara väster om UTC. Kör därför testet i New York-tid.
    const forra = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      render(<Veckoremsa rubrik="v" dagar={[{ datum: '2026-10-05', status: 'narvarande' }]} />)
      expect(screen.getByText(/^Måndag 5 oktober/)).toBeInTheDocument()
    } finally {
      process.env.TZ = forra
    }
  })

  it('dagens datum markeras med aria-current="date"', () => {
    render(<Veckoremsa rubrik="v" dagar={dagar} idag="2026-10-07" />)
    const poster = screen.getAllByRole('listitem')
    expect(poster[2]).toHaveAttribute('aria-current', 'date')
    expect(poster.filter((p) => p.hasAttribute('aria-current'))).toHaveLength(1)
  })
})

describe('PersonRad', () => {
  it('visar namn, läget som mening, status med ord och en handling som säger vem', () => {
    const klick = vi.fn()
    render(
      <ul>
        <PersonRad
          namn="Leila Haddad"
          lage="Var inte på gruppträffen i fredags"
          detalj="Ingen rad om varför än"
          status="ogiltig"
          fler={2}
          handling={{ etikett: 'Skriv raden', onClick: klick }}
        />
      </ul>,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('Leila Haddad')
    expect(screen.getByText('LH')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Ogiltig frånvaro')).toBeInTheDocument()
    expect(screen.getByText(/\+2 till/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Skriv raden: Leila Haddad' }))
    expect(klick).toHaveBeenCalled()
  })

  it('initialer ur namnet', () => {
    expect(initialerAv('Leila Haddad')).toBe('LH')
    expect(initialerAv('Sami')).toBe('S')
    expect(initialerAv('  Anna Maria Ek ')).toBe('AE')
    expect(initialerAv('')).toBe('?')
  })
})

describe('MerMeny', () => {
  it('är en menyknapp; farliga val hamnar sist efter en avdelare', () => {
    render(
      <MerMeny
        val={[
          { etikett: 'Avsluta plan', farlig: true, onClick: () => {} },
          { etikett: 'Plan som PDF', ikon: 'dokument', onClick: () => {} },
        ]}
      />,
    )
    const knapp = screen.getByRole('button', { name: 'Mer' })
    expect(knapp).toHaveAttribute('aria-haspopup', 'menu')
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(knapp)
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
    const meny = screen.getByRole('menu')
    const val = within(meny).getAllByRole('menuitem').map((v) => v.textContent)
    expect(val).toEqual(['Plan som PDF', 'Avsluta plan'])
    expect(within(meny).getByRole('separator')).toBeInTheDocument()
  })

  it('kör valet och stänger', () => {
    const pdf = vi.fn()
    render(<MerMeny val={[{ etikett: 'Plan som PDF', onClick: pdf }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mer' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Plan som PDF' }))
    expect(pdf).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('baraIkon ger knappen ett namn ändå', () => {
    render(<MerMeny baraIkon etikett="Fler val för Leila" val={[{ etikett: 'x', onClick: () => {} }]} />)
    expect(screen.getByRole('button', { name: 'Fler val för Leila' })).toBeInTheDocument()
  })
})

describe('franNarvarovarde', () => {
  it('mappar databasens värden; external räknas som närvaro som i NARVARANDE_UTFALL', () => {
    expect(franNarvarovarde('present')).toBe('narvarande')
    expect(franNarvarovarde('external')).toBe('narvarande')
    expect(franNarvarovarde('absent_valid')).toBe('giltig')
    expect(franNarvarovarde('absent_invalid')).toBe('ogiltig')
    expect(franNarvarovarde('sick_certified')).toBe('sjuk')
    expect(franNarvarovarde(null)).toBeNull()
    expect(franNarvarovarde('okänt')).toBeNull()
  })
})

describe('Ikonsetet Kvarter', () => {
  it('har förslagets 32 ikoner, var och en med en namngiven komponent', () => {
    expect(Kvarter.KVARTER_NAMN).toHaveLength(32)
    for (const namn of Kvarter.KVARTER_NAMN) {
      const komponent = `Ikon${namn[0].toUpperCase()}${namn.slice(1)}` as keyof typeof Kvarter
      expect(Kvarter[komponent], komponent).toBeDefined()
    }
  })

  it('är dekorativ som standard och följer lucides API (size, strokeWidth, className)', () => {
    const { container } = render(<Kvarter.IkonKalender className="w-5 h-5" size={20} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveAttribute('stroke-width', '1.75')
    expect(svg).toHaveAttribute('class', 'w-5 h-5')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  it('title gör den meningsbärande', () => {
    render(<Kvarter.IkonVarning title="Varning" />)
    expect(screen.getByRole('img', { name: 'Varning' })).toBeInTheDocument()
  })

  it('ton färgar bara den fyllda detaljen; linjen förblir currentColor', () => {
    const { container } = render(<Kvarter.IkonNarvaro ton="narvarande" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    const fyllda = Array.from(svg.querySelectorAll('[fill]')).filter((e) => e.getAttribute('fill') !== 'none')
    expect(fyllda.length).toBeGreaterThan(0)
    fyllda.forEach((e) => expect(e.getAttribute('fill')).toBe('var(--s-narvarande-ikon)'))
  })
})
