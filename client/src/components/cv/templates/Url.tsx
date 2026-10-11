/**
 * En webbadress som får brytas efter snedstreck och punkter i stället för
 * mitt i ett ord ("linkedin.com/in/ | mikaelglannstrom", inte
 * "mikaelglanns | trom"). `<wbr>` är en brytmöjlighet utan tecken — den syns
 * inte och följer inte med när någon kopierar adressen ur PDF:en, vilket ett
 * osynligt mellanslag (U+200B) hade gjort.
 */

import { Fragment } from 'react'

export function Url({ text }: { text: string }) {
  const delar = text.split(/(?<=[/.?&=_-])/)
  return (
    <>
      {delar.map((d, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {d}
        </Fragment>
      ))}
    </>
  )
}
