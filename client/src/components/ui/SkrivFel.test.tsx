/**
 * RD26: det gemensamma felmönstret. Tre beteenden som kan falla:
 *   1. useSkrivning kastar aldrig — ett fel blir läget 'fel', och `kor` svarar false.
 *      Mutation: låt catch-grenen kasta vidare → första testet faller (ohanterat löfte).
 *   2. forsokIgen gör om samma skrivning med samma argument.
 *   3. SkrivFel säger "Din text är kvar" och "Försök igen" anropar callbacken.
 */
import { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import { SkrivFel } from './SkrivFel'
import { useSkrivning } from './useSkrivning'

afterEach(cleanup)

function Formular({ skicka }: { skicka: (text: string) => Promise<unknown> }) {
  const [text, setText] = useState('Hej konsulenten')
  const s = useSkrivning(skicka)
  return (
    <div>
      <label>
        Meddelande
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button onClick={async () => { if (await s.kor(text)) setText('') }}>Skicka</button>
      {s.lage === 'fel' && <SkrivFel onForsokIgen={async () => { if (await s.forsokIgen()) setText('') }} />}
      <p data-testid="lage">{s.lage}</p>
    </div>
  )
}

describe('useSkrivning + SkrivFel (RD26)', () => {
  it('ett fel behåller texten och säger det', async () => {
    const skicka = vi.fn().mockRejectedValue(new Error('403'))
    render(<Formular skicka={skicka} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skicka' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Det gick inte att skicka. Din text är kvar.')
    expect(screen.getByLabelText('Meddelande')).toHaveValue('Hej konsulenten')
    expect(screen.getByTestId('lage')).toHaveTextContent('fel')
  })

  it('Försök igen skickar samma text en gång till, och tömmer fältet när det går', async () => {
    const skicka = vi.fn().mockRejectedValueOnce(new Error('nät')).mockResolvedValueOnce({ id: 'm1' })
    render(<Formular skicka={skicka} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skicka' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Försök igen' }))
    await waitFor(() => expect(skicka).toHaveBeenCalledTimes(2))
    expect(skicka.mock.calls[1]).toEqual(['Hej konsulenten'])
    await waitFor(() => expect(screen.getByLabelText('Meddelande')).toHaveValue(''))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('SkrivFel för formulär säger spara, och visar ingen knapp utan callback', () => {
    render(<SkrivFel sort="spara" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Det gick inte att spara. Det du skrev är kvar.')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
