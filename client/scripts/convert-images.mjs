/**
 * Convert PNG images to WebP format for better compression
 * Run: node scripts/convert-images.mjs
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, parse } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const publicDir = join(__dirname, '..', 'public')

async function convertToWebP() {
  const files = await readdir(publicDir)
  const pngFiles = files.filter(f => f.endsWith('.png'))

  console.log(`Found ${pngFiles.length} PNG files to convert`)

  for (const file of pngFiles) {
    const inputPath = join(publicDir, file)
    const { name } = parse(file)
    const outputPath = join(publicDir, `${name}.webp`)

    const originalStats = await stat(inputPath)

    await sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath)

    const webpStats = await stat(outputPath)
    const savings = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1)

    console.log(`✓ ${file} → ${name}.webp`)
    console.log(`  ${(originalStats.size / 1024).toFixed(1)}KB → ${(webpStats.size / 1024).toFixed(1)}KB (${savings}% smaller)`)
  }

  console.log('\nDone! Update your code to use WebP with PNG fallback.')
}

convertToWebP().catch(console.error)
