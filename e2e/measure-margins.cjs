/**
 * Mät top-margin på sida 1 och 2 för alla CV-PDFs i pdf-verify/.
 * Hittar var första icke-vit pixel börjar vid mid-x och rapporterar i mm.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('./../client/node_modules/sharp');

const PDF_DIR = path.join(__dirname, '..', 'pdf-verify');
const TMP = path.join(__dirname, '..', 'pdf-verify', 'measure-tmp');

(async () => {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
  const pdfs = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf') && !f.includes('LIVE'));

  console.log('mall'.padEnd(15), 's1-mid', 's1-left', 's2-mid');
  console.log('-'.repeat(50));

  for (const pdf of pdfs) {
    const base = pdf.replace('.pdf', '');
    const pdfPath = path.join(PDF_DIR, pdf);
    const pngBase = path.join(TMP, base);
    try {
      execSync(`pdftoppm -r 150 -f 1 -l 2 "${pdfPath}" "${pngBase}" -png`, { stdio: 'pipe' });
    } catch { continue; }

    const measureFile = async (pngFile, x) => {
      if (!fs.existsSync(pngFile)) return null;
      const buf = fs.readFileSync(pngFile);
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      for (let y = 0; y < info.height; y++) {
        const i = (y * info.width + x) * info.channels;
        const r = data[i], g = data[i+1], b = data[i+2];
        if (r < 250 || g < 250 || b < 250) {
          return (y / info.height * 297).toFixed(1) + 'mm';
        }
      }
      return '—';
    };

    const p1 = `${pngBase}-1.png`;
    const p2 = `${pngBase}-2.png`;
    if (!fs.existsSync(p1)) { console.log(base.padEnd(15), 'no p1'); continue; }
    const meta = await sharp(fs.readFileSync(p1)).metadata();
    const midX = Math.floor(meta.width / 2);
    const leftX = 80;

    const s1mid = await measureFile(p1, midX);
    const s1left = await measureFile(p1, leftX);
    const s2mid = await measureFile(p2, midX);

    console.log(base.padEnd(15), (s1mid || '—').padEnd(7), (s1left || '—').padEnd(8), s2mid || '—');
  }
})();
