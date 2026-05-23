/**
 * Node-side smoke-test för AWP/MOHOST PDF-export.
 * Använder pdf-lib direkt mot template-fil och fyller form-fält manuellt
 * för att verifiera att fältnamnen är korrekta.
 */
const fs = require('fs')
const path = require('path')

async function main() {
  const pdfLibPath = path.join(__dirname, '..', 'client', 'node_modules', 'pdf-lib', 'cjs', 'index.js')
  const { PDFDocument } = require(pdfLibPath)

  const out = path.join(__dirname, 'screenshots', 'sta-pdf-export')
  fs.mkdirSync(out, { recursive: true })

  // === AWP test — verifierar att "Kunskap" → "välja använda efterfråga..." funkar ===
  {
    const tplPath = path.join(__dirname, '..', 'client', 'public', 'sta-templates', 'awp-2.0-mall.pdf')
    const bytes = fs.readFileSync(tplPath)
    const doc = await PDFDocument.load(bytes)
    const form = doc.getForm()

    // Lista alla text-fält
    const allFields = form.getFields().map((f) => f.getName())
    const textFields = form.getFields().filter((f) => f.constructor.name === 'PDFTextField').map((f) => f.getName())

    // Försök sätta text på de tidigare problematiska fälten
    const tests = [
      ['Kroppställning', 'TEST: comment for Kroppställning'],
      ['Rörlighet', 'TEST: rörlighet comment'],
      ['Kunskap', 'TEST: kunskap via primary'],
      ['välja använda efterfråga information slutföra', 'TEST: kunskap via long alias'],
    ]
    const results = []
    for (const [name, value] of tests) {
      try {
        const f = form.getField(name)
        if (f && 'setText' in f) {
          f.setText(value)
          results.push(`✓ ${name} satt`)
        } else {
          results.push(`✗ ${name} hittad men ej textfält`)
        }
      } catch (e) {
        results.push(`✗ ${name} EJ HITTAD: ${e.message.slice(0, 80)}`)
      }
    }
    console.log('AWP-test:')
    results.forEach((r) => console.log(' ', r))

    const outBytes = await doc.save()
    fs.writeFileSync(path.join(out, 'awp-node-test.pdf'), outBytes)
  }

  // === MOHOST test ===
  {
    const tplPath = path.join(__dirname, '..', 'client', 'public', 'sta-templates', 'mohost-sammanstallning-mall.pdf')
    const bytes = fs.readFileSync(tplPath)
    const doc = await PDFDocument.load(bytes)
    const form = doc.getForm()

    const tests = [
      ['Namn', 'TEST MOHOST Namn'],
      ['Arbetsterapeutens namn', 'TEST AT'],
      ['Datum ÅÅMMDD', '260523'],
      ['Födelsedata ÅÅMMDD', '000101'],
      ['Text1.0', 'kommentar item 1'],
      ['Text1.23', 'kommentar item 24'],
    ]
    const results = []
    for (const [name, value] of tests) {
      try {
        const f = form.getField(name)
        if (f && 'setText' in f) {
          f.setText(value)
          results.push(`✓ ${name} satt`)
        } else {
          results.push(`✗ ${name} typ: ${f && f.constructor.name}`)
        }
      } catch (e) {
        results.push(`✗ ${name} EJ HITTAD: ${e.message.slice(0, 100)}`)
      }
    }
    // Försök checka Rad1
    try {
      const f = form.getField('Rad1')
      if (f && 'check' in f) {
        f.check()
        results.push(`✓ Rad1 checked, type: ${f.constructor.name}`)
      } else {
        results.push(`✗ Rad1 typ: ${f && f.constructor.name}`)
      }
    } catch (e) {
      results.push(`✗ Rad1: ${e.message.slice(0, 100)}`)
    }
    console.log('\nMOHOST-test:')
    results.forEach((r) => console.log(' ', r))

    const outBytes = await doc.save()
    fs.writeFileSync(path.join(out, 'mohost-node-test.pdf'), outBytes)
  }

  console.log('\nSparade till:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
