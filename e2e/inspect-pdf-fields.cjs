/**
 * Inspect specific fields in AWP and MOHOST templates.
 */
const path = require('path')
const fs = require('fs')

async function main() {
  const pdfLibPath = path.join(__dirname, '..', 'client', 'node_modules', 'pdf-lib', 'cjs', 'index.js')
  const { PDFDocument } = require(pdfLibPath)

  // MOHOST Rad1 options
  {
    const bytes = fs.readFileSync(path.join(__dirname, '..', 'client', 'public', 'sta-templates', 'mohost-sammanstallning-mall.pdf'))
    const doc = await PDFDocument.load(bytes)
    const form = doc.getForm()
    const r1 = form.getField('Rad1')
    console.log('Rad1 type:', r1.constructor.name)
    console.log('Rad1 options:', r1.getOptions())
  }

  // AWP — search Kropp fields
  {
    const bytes = fs.readFileSync(path.join(__dirname, '..', 'client', 'public', 'sta-templates', 'awp-2.0-mall.pdf'))
    const doc = await PDFDocument.load(bytes)
    const form = doc.getForm()
    const matches = form.getFields().filter((f) => f.getName().toLowerCase().includes('kropp'))
    console.log('\nKropp-matches:', matches.length)
    for (const f of matches) {
      const name = f.getName()
      console.log(' ', JSON.stringify(name), 'type:', f.constructor.name, 'bytes:', Buffer.from(name).toString('hex').slice(0, 40))
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
