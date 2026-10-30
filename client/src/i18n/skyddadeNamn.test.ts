import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { delaPaSkyddadeNamn } from './skyddadeNamn'

const require = createRequire(import.meta.url)
const { skyddaNamn, renderGuide } = require('../../scripts/lib/guide-template.cjs') as {
  skyddaNamn: (html: string) => string
  renderGuide: (a: unknown, relaterade: unknown[]) => string
}

const skyddade = (t: string) => delaPaSkyddadeNamn(t).filter((b) => b.skyddad).map((b) => b.text)

describe('delaPaSkyddadeNamn (FN19)', () => {
  it('hittar namn och böjningsformer', () => {
    expect(skyddade('Kontakta Arbetsförmedlingen och Arbetsförmedlingens handläggare.')).toEqual([
      'Arbetsförmedlingen',
      'Arbetsförmedlingens',
    ])
    expect(skyddade('Din a-kassan, A-kassa och personnumret')).toEqual(['a-kassan', 'A-kassa', 'personnumret'])
  })

  it('träffar inte ord inuti andra ord', () => {
    expect(skyddade('ta-kassan CSNxyz xCSN Skatteverketsbyrå')).toEqual([])
  })

  it('bitarna sätts ihop till originaltexten', () => {
    const t = 'Ring CSN, sedan Migrationsverket.'
    expect(delaPaSkyddadeNamn(t).map((b) => b.text).join('')).toBe(t)
  })
})

describe('skyddaNamn i guidesidornas HTML (FN19)', () => {
  const html = skyddaNamn(
    '<p>Ring <a href="/Arbetsförmedlingen" title="CSN">Arbetsförmedlingens</a> och <code>CSN</code> CSN.</p>'
  )
  it('markerar textnoder', () => {
    expect(html).toContain('<span translate="no" class="notranslate">Arbetsförmedlingens</span>')
    expect(html).toContain('</code> <span translate="no" class="notranslate">CSN</span>.')
  })
  it('rör aldrig attribut eller kod', () => {
    expect(html).toContain('href="/Arbetsförmedlingen" title="CSN"')
    expect(html).toContain('<code>CSN</code>')
  })
  it('ger samma träffar som appens regex', () => {
    const t = 'Skatteverket, a-kassan, ta-kassa, CSN-lån, personnumrets, komvuxs.'
    const fran = [...skyddaNamn(`<p>${t}</p>`).matchAll(/notranslate">([^<]+)</g)].map((m) => m[1])
    expect(fran).toEqual(skyddade(t))
  })
})

describe('titel och ingress på guidesidan (FN19, rest)', () => {
  const art = {
    slug: 'a-kassa-start', title: 'Så ansöker du hos Arbetsförmedlingen & CSN',
    summary: 'Skatteverket och a-kassan förklarade.', content: '## Rubrik\n\nBrödtext.\n',
    category_key: 'cv', difficulty: 'medium', reading_time: 4,
    checklist: null, related_tools: null, actions: null,
  }
  const html = renderGuide(art, [])
  const NT = (n: string) => `<span translate="no" class="notranslate">${n}</span>`

  it('skyddar namn i <h1> och ingressen', () => {
    expect(html).toContain(`<h1>Så ansöker du hos ${NT('Arbetsförmedlingen')} &amp; ${NT('CSN')}</h1>`)
    expect(html).toContain(`<p class="lead">${NT('Skatteverket')} och ${NT('a-kassan')} förklarade.</p>`)
  })

  it('rör aldrig <title> eller meta-attribut', () => {
    const huvud = html.slice(0, html.indexOf('</head>'))
    expect(huvud).not.toContain('translate="no"')
    expect(huvud).toMatch(/<title>[^<]*Arbetsförmedlingen[^<]*<\/title>/)
  })
})
