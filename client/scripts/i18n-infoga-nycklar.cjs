#!/usr/bin/env node
/**
 * Sätter in nya i18n-nycklar i sv.json/en.json UTAN att serialisera om filen.
 *
 * VARFÖR: locale-filerna är inte JSON.stringify-normaliserade (lärdomen
 * i18n-svep-monster.md / CLAUDE.md). Att läsa in som objekt och skriva ut
 * igen ger en diff över hela filen. Den här modulen parsar filen EN gång
 * med en egen offset-medveten JSON-tokenizer (inte JSON.parse) så att varje
 * objektnods `{`/`}`-positioner i RÅ TEXT är kända, och sätter sedan in nya
 * rader som ren textsplicing på exakta positioner. Resten av filen rörs inte.
 *
 * ANVÄNDNING (som modul, inte CLI): se addKeys() nedan. Tar en lista av
 * {path: 'namespace.sub.key', value: 'text'} och en rå JSON-text, returnerar
 * ny rå text. Anropas en gång per locale-fil med ALLA nycklar för den filen
 * samlade, så varje delat föräldraobjekt bara får en insättning.
 *
 * Indragsregeln: filen är genomgående 2-mellanslag-per-djup (verifierat
 * manuellt på stickprov 2026-09-02). Ett nytt löv på sökvägens djup D får
 * indraget D*2 mellanslag (D = antal segment, root-nycklar har D=1).
 */
'use strict'

/** Egen minimal JSON-tokenizer/parser som sparar offset för varje objektnod. */
function parseWithOffsets(text) {
  let i = 0
  const n = text.length

  function skipWs() {
    while (i < n && /\s/.test(text[i])) i++
  }

  function parseString() {
    const start = i
    if (text[i] !== '"') throw new Error(`Väntade " vid ${i}`)
    i++
    while (i < n) {
      if (text[i] === '\\') { i += 2; continue }
      if (text[i] === '"') { i++; break }
      i++
    }
    return text.slice(start, i)
  }

  function parseValue() {
    skipWs()
    const c = text[i]
    if (c === '{') return parseObject()
    if (c === '[') return parseArray()
    if (c === '"') { parseString(); return { type: 'leaf' } }
    // number / true / false / null
    const start = i
    while (i < n && !/[,}\]\s]/.test(text[i])) i++
    if (i === start) throw new Error(`Kunde inte tolka värde vid ${i}: ${text.slice(i, i + 20)}`)
    return { type: 'leaf' }
  }

  function parseArray() {
    const start = i
    i++ // [
    skipWs()
    if (text[i] === ']') { i++; return { type: 'leaf', start, end: i } }
    while (true) {
      parseValue()
      skipWs()
      if (text[i] === ',') { i++; skipWs(); continue }
      if (text[i] === ']') { i++; break }
      throw new Error(`Väntade , eller ] vid ${i}`)
    }
    return { type: 'leaf', start, end: i }
  }

  function parseObject() {
    const start = i
    i++ // {
    const children = {}
    let lastChildEnd = null // offset direkt efter senaste barnets värde (före ev. komma)
    skipWs()
    if (text[i] === '}') { i++; return { type: 'object', start, end: i, children, lastChildEnd: null, empty: true } }
    while (true) {
      skipWs()
      const keyRaw = parseString()
      const key = JSON.parse(keyRaw)
      skipWs()
      if (text[i] !== ':') throw new Error(`Väntade : vid ${i}`)
      i++
      skipWs()
      const val = parseValue()
      lastChildEnd = i
      children[key] = val
      skipWs()
      if (text[i] === ',') { i++; continue }
      if (text[i] === '}') { i++; break }
      throw new Error(`Väntade , eller } vid ${i} (efter nyckel "${key}")`)
    }
    return { type: 'object', start, end: i, children, lastChildEnd, empty: false }
  }

  skipWs()
  const root = parseValue()
  return root
}

/**
 * Lägger till nycklar i en JSON-text. `entries`: [{path: 'a.b.c', value: '...'}]
 * Returnerar { text: nyRåText, insatta: [...path], konflikter: [...path som redan fanns] }
 */
function addKeys(rawText, entries) {
  const root = parseWithOffsets(rawText)
  if (root.type !== 'object') throw new Error('Root är inte ett objekt')

  // Gruppera per närmast BEFINTLIGA förälder-sökväg.
  // insertionsPlan: Map<objectNode, Array<{key, value, extraNesting: string[]}>>
  const plan = new Map()
  const insatta = []
  const konflikter = []

  for (const { path, value } of entries) {
    const segments = path.split('.')
    let node = root
    let i = 0
    while (i < segments.length - 1 && node.children && Object.prototype.hasOwnProperty.call(node.children, segments[i])) {
      const child = node.children[segments[i]]
      if (child.type !== 'object') break // finns men är inte ett objekt — kan inte gå djupare
      node = child
      i++
    }
    // Om HELA sökvägen redan finns (inkl. sista segmentet) → konflikt, hoppa.
    const lastKey = segments[segments.length - 1]
    if (i === segments.length - 1 && node.children && Object.prototype.hasOwnProperty.call(node.children, lastKey)) {
      konflikter.push(path)
      continue
    }
    const remaining = segments.slice(i) // segment som ska skapas, sista är lövet
    if (!plan.has(node)) plan.set(node, [])
    plan.get(node).push({ remaining, value, path })
    insatta.push(path)
  }

  // Bygg text-insättningar, en per föräldraobjekt-nod.
  //
  // Icke-tomt objekt: `node.lastChildEnd` pekar direkt efter sista barnets
  // värde. Texten DÄREFTER i originalfilen är redan "\n  }" (indrag + slut-
  // klammer) — den rörs inte, så vi lägger bara till ",\n<nya rader>" före den.
  //
  // Tomt objekt (`{}`): det finns ingen befintlig "\n  }" att luta sig mot,
  // så vi måste själva lägga till avslutande radbrytning + indrag.
  const splices = [] // {pos, text}
  for (const [node, items] of plan.entries()) {
    const baseDepth = depthOfNode(node, root)
    // VIKTIGT: items som delar en ännu icke-existerande mellannivå (t.ex.
    // två nya nycklar under samma nya "review"-objekt) måste slås ihop till
    // EN nästlad struktur, annars skrivs samma nyckel ("review") ut flera
    // gånger i följd — giltig JS-syntax, men bara den SISTA vinner vid
    // JSON.parse och resten blir osynliga dubbletter i filen.
    const tree = buildTree(items)
    const lines = renderTree(tree, baseDepth + 1)
    let insertText
    let pos
    if (node.empty) {
      pos = node.start + 1
      insertText = '\n' + lines + '\n' + '  '.repeat(baseDepth)
    } else {
      pos = node.lastChildEnd
      insertText = ',\n' + lines
    }
    splices.push({ pos, text: insertText })
  }

  // Applicera splices i FALLANDE positionsordning så tidigare offsets inte förskjuts.
  splices.sort((a, b) => b.pos - a.pos)
  let out = rawText
  for (const { pos, text } of splices) {
    out = out.slice(0, pos) + text + out.slice(pos)
  }

  return { text: out, insatta, konflikter }
}

/** Djup i termer av "antal nyckelsegment för att nå denna nod" (root = 0). */
function depthOfNode(target, root) {
  function walk(node, depth) {
    if (node === target) return depth
    if (node.type !== 'object') return -1
    for (const key of Object.keys(node.children)) {
      const r = walk(node.children[key], depth + 1)
      if (r !== -1) return r
    }
    return -1
  }
  return walk(root, 0)
}

/**
 * Bygger ett träd (trie) av flera {remaining, value}-poster som ska in under
 * SAMMA befintliga förälder, så att delade nya mellannivåer (t.ex. flera
 * nycklar under ett ännu icke-existerande "review"-objekt) blir EN nästlad
 * struktur i stället för en duplicerad nyckel per post.
 * Nod-form: { children: { segment: nod }, value?: string } — `value` sätts
 * bara på lövnoder (sista segmentet i en post).
 */
function buildTree(items) {
  const root = { children: {} }
  for (const { remaining, value } of items) {
    let cur = root
    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i]
      if (!cur.children[seg]) cur.children[seg] = { children: {} }
      cur = cur.children[seg]
      if (i === remaining.length - 1) cur.value = value
    }
  }
  return root
}

/** Renderar ett buildTree()-träd till JSON-textrader (utan inledande/avslutande komma). */
function renderTree(node, depth) {
  const indent = '  '.repeat(depth)
  const keys = Object.keys(node.children)
  return keys
    .map((key) => {
      const child = node.children[key]
      const hasChildren = Object.keys(child.children).length > 0
      if (hasChildren) {
        const inner = renderTree(child, depth + 1)
        return `${indent}${JSON.stringify(key)}: {\n${inner}\n${indent}}`
      }
      return `${indent}${JSON.stringify(key)}: ${JSON.stringify(child.value)}`
    })
    .join(',\n')
}

module.exports = { parseWithOffsets, addKeys }
