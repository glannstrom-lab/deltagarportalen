/**
 * af-taxonomy /concepts ignorerade `type` (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read supabase/functions/af-taxonomy/typ.test.ts
 *
 * `/concepts?q=svets&type=skill` svarade med YRKEN — samma uppslag som utan
 * typ, med 200. `afTaxonomyApi.searchSkills()` bygger precis det anropet och
 * hade alltså fått yrkesnamn märkta `type: 'skill'`. (Premissen föll delvis:
 * searchSkills/autocompleteSkills har i dag inga anropare i portalen, så felet
 * var latent.) Uppslaget kan bara yrken; en annan typ får nu ett ärligt 400 i
 * stället för ett svar som ser rätt ut.
 */

import { arYrkestyp } from './kallor.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

Deno.test('yrkestyper och ingen typ godtas', () => {
  for (const t of [null, '', 'occupation', 'occupation-name']) {
    assert(arYrkestyp(t), `borde godtas: ${JSON.stringify(t)}`)
  }
})

Deno.test('andra typer avvisas', () => {
  for (const t of ['skill', 'occupation-field', 'language', 'x']) {
    assert(!arYrkestyp(t), `borde avvisas: ${t}`)
  }
})

Deno.test('GRIND: /concepts kontrollerar typen före uppslaget', () => {
  const kalla = Deno.readTextFileSync(new URL('./index.ts', import.meta.url)).replace(/\r\n/g, '\n')
  const kontroll = kalla.indexOf("arYrkestyp(params.get('type'))")
  const uppslag = kalla.indexOf('getOccupations(')
  assert(kontroll > 0, "index.ts kontrollerar inte params.get('type')")
  assert(kontroll < uppslag, 'typkontrollen måste ske före getOccupations()')
})
