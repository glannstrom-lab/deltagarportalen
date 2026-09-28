// Prodröktest SKK5: handläggaren laddar ner underlagspaketet (PDF) i efterhand.
module.exports = async (p, h) => {
  await h.go('/consultant')
  await p.waitForSelector('[data-testid="mottagna-underlag"]', { timeout: 20000 })
  const [dl] = await Promise.all([
    p.waitForEvent('download', { timeout: 30000 }).catch((e) => { h.log('ingen nedladdning', e.message.slice(0, 100)); return null }),
    p.getByRole('button', { name: /Ladda ner underlaget \(PDF\)/ }).first().click(),
  ])
  if (dl) {
    const vag = require('path').join(h.UT, dl.suggestedFilename())
    await dl.saveAs(vag)
    h.log('PDF', dl.suggestedFilename(), require('fs').statSync(vag).size, 'byte')
  }
}
