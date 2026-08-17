/**
 * Vakt för uppläsningens textutdrag (TG2, genomgången 2026-08-17).
 *
 * `lyssna.client.js` läste tidigare `text.innerText`. `innerText` bryr sig
 * varken om `aria-hidden` eller om `.sr-only`, så uppläsningen sa emojinamnen
 * ("kryssmarkering") före varje rad i gör/gör-inte-listorna — åtta gånger i rad
 * på `cv-grunder`.
 *
 * Efter att markdown-renderaren börjat slå in tecknen i `aria-hidden` hade
 * `innerText` läst **båda**: "kryssmarkering Undvik:". Alltså sämre än förut.
 * Halva TG2 satt i renderaren, halva här.
 *
 * För lättläst-nischen är uppläsningen inte en extrafunktion utan poängen
 * (K17) — det är den grupp som drabbas hårdast av bruset.
 *
 * Testet laddar den riktiga klientfilen och plockar ut funktionen, i stället
 * för att skriva av logiken. En kopia hade kunnat gå isär från filen som
 * faktiskt levereras till webbläsaren.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Extraherar `upplasningstext` ur klientskriptet och gör den anropbar.
 * Filen är en IIFE avsedd för webbläsaren, så den kan inte importeras rakt av.
 */
function laddaUpplasningstext(): (rot: Element) => string {
  const kalla = readFileSync(resolve(__dirname, '../../scripts/lib/lyssna.client.js'), 'utf8')
  const start = kalla.indexOf('function upplasningstext')
  expect(start, 'upplasningstext saknas i lyssna.client.js — har den bytt namn?').toBeGreaterThan(-1)

  // Klipp ut funktionen fram till dess avslutande rad på samma indentering.
  const slut = kalla.indexOf('\n  }', start) + '\n  }'.length
  const kod = kalla.slice(start, slut)
  return new Function(`${kod}; return upplasningstext`)() as (rot: Element) => string
}

const upplasningstext = laddaUpplasningstext()

function html(s: string): Element {
  const d = document.createElement('div')
  d.innerHTML = s
  document.body.appendChild(d)
  return d
}

describe('TG2: uppläsningen hoppar över emojin men behåller ordet', () => {
  it('läser inte upp tecknet', () => {
    const el = html(
      '<p><span aria-hidden="true">❌</span><span class="sr-only">Undvik: </span>Låta AI ljuga</p>'
    )
    const text = upplasningstext(el)
    expect(text, 'emojin läses fortfarande upp som "kryssmarkering"').not.toContain('❌')
  })

  it('behåller sr-only-ordet — det är det som bär betydelsen', () => {
    const el = html(
      '<p><span aria-hidden="true">❌</span><span class="sr-only">Undvik: </span>Låta AI ljuga</p>'
    )
    expect(upplasningstext(el)).toBe('Undvik: Låta AI ljuga')
  })

  it('vänder inte betydelsen — raden får inte bli ett råd att göra saken', () => {
    const el = html(
      '<p><span aria-hidden="true">❌</span><span class="sr-only">Undvik: </span>Kopiera AI-text rakt av</p>'
    )
    const text = upplasningstext(el)
    expect(text.startsWith('Undvik:')).toBe(true)
  })

  it('hanterar flera markörer i följd', () => {
    const el = html(
      '<p><span aria-hidden="true">✅</span><span class="sr-only">Gör så här: </span>Ett ' +
        '<span aria-hidden="true">✅</span><span class="sr-only">Gör så här: </span>Två</p>'
    )
    const text = upplasningstext(el)
    expect(text).not.toContain('✅')
    expect(text.match(/Gör så här:/g)).toHaveLength(2)
  })

  it('rör inte vanlig brödtext', () => {
    expect(upplasningstext(html('<p>En vanlig mening.</p>'))).toBe('En vanlig mening.')
  })

  it('normaliserar blanksteg så uppläsningen inte får långa pauser', () => {
    expect(upplasningstext(html('<p>Rad ett</p>\n\n   <p>Rad två</p>'))).toBe('Rad ett Rad två')
  })

  it('lämnar originalet orört — klonen får inte tömma sidan', () => {
    const el = html('<p><span aria-hidden="true">❌</span>Text</p>')
    upplasningstext(el)
    expect(el.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('ett naivt textContent hade tagit med emojin', () => {
    // Bevisar att funktionen gör något: samma indata genom textContent ger
    // tecknet tillbaka. Utan den här raden kan testerna ovan vara gröna för
    // att jsdom råkar bete sig snällt.
    const el = html('<p><span aria-hidden="true">❌</span><span class="sr-only">Undvik: </span>X</p>')
    expect(el.textContent).toContain('❌')
    expect(upplasningstext(el)).not.toContain('❌')
  })
})
