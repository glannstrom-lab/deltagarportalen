/**
 * Auto-fixa brutna relatedArticles/relatedExercises-refs i articleData.ts
 * genom att ta bort de IDs som inte motsvarar existerande artiklar/övningar.
 *
 * Kör: node scripts/fix-article-refs.cjs
 */

const fs = require('fs')

const articlePath = 'client/src/services/articleData.ts'
const exercisePath = 'client/src/data/exercises.ts'

const articleSrc = fs.readFileSync(articlePath, 'utf-8')
const exerciseSrc = fs.readFileSync(exercisePath, 'utf-8')

const articleIds = new Set([...articleSrc.matchAll(/^\s*id:\s*'([^']+)'/gm)].map(m => m[1]))
const exerciseIds = new Set([...exerciseSrc.matchAll(/^\s*id:\s*'([^']+)'/gm)].map(m => m[1]))

let removed = { articles: 0, exercises: 0 }

// Stega igenom relatedArticles: [...] och relatedExercises: [...]
function fixRefArray(src, fieldName, validIds, kind) {
  const re = new RegExp(`(${fieldName}:\\s*\\[)([^\\]]*)(\\])`, 'g')
  return src.replace(re, (full, open, body, close) => {
    const refs = [...body.matchAll(/'([^']+)'/g)].map(m => m[1])
    const valid = refs.filter(r => validIds.has(r))
    const invalid = refs.filter(r => !validIds.has(r))
    removed[kind] += invalid.length
    if (valid.length === refs.length) return full  // inget att ändra
    if (valid.length === 0) return `${open}${close}`
    // Bevara samma formatering — comma-separated quoted strings
    return `${open}${valid.map(r => `'${r}'`).join(', ')}${close}`
  })
}

let fixed = articleSrc
fixed = fixRefArray(fixed, 'relatedArticles', articleIds, 'articles')
fixed = fixRefArray(fixed, 'relatedExercises', exerciseIds, 'exercises')

fs.writeFileSync(articlePath, fixed)

console.log(`✅ Rensade ${removed.articles} brutna relatedArticles-refs`)
console.log(`✅ Rensade ${removed.exercises} brutna relatedExercises-refs`)
console.log(`Filen är uppdaterad: ${articlePath}`)
