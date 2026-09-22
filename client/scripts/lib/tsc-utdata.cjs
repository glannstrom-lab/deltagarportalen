/**
 * Klassar tsc-utdata i filfel och globala fel (2026-09-22).
 *
 * Ett filfel bär en sökväg och position:
 *   src/a.ts(3,7): error TS2304: …          (--pretty false, eller ej TTY)
 *   src/a.ts:3:7 - error TS2304: …          (--pretty)
 *
 * Ett globalt fel saknar fil — det är konfigurationen som är trasig, och då
 * har tsc inte typkontrollerat något alls:
 *   error TS18003: No inputs were found in config file …
 *   error TS5058: The specified path does not exist: …
 *
 * typecheck-ceiling och typecheck-critical räknade tidigare bara
 * `error TS\d+:`, och gick därför gröna på en tsconfig som inte kontrollerade
 * en enda fil. Vaktat av src/test/skript-typecheck-falskt-gront.test.ts.
 */

const FILFEL = /^\S.*(?:\(\d+,\d+\):|:\d+:\d+ -) error (TS\d+):/
const NAGOT_FEL = /\berror (TS\d+):/

/**
 * @param {string} utdata
 * @returns {{ filfel: Array<{ kod: string, rad: string }>, globala: Array<{ kod: string, rad: string }> }}
 */
function klassaTscUtdata(utdata) {
  const filfel = []
  const globala = []
  for (const rad of String(utdata || '').split(/\r?\n/)) {
    const fil = rad.match(FILFEL)
    if (fil) {
      filfel.push({ kod: fil[1], rad })
      continue
    }
    const annat = rad.match(NAGOT_FEL)
    if (annat) globala.push({ kod: annat[1], rad })
  }
  return { filfel, globala }
}

module.exports = { klassaTscUtdata }
