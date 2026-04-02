#!/usr/bin/env node
/**
 * Icon Migration Script
 *
 * Migrates imports from 'lucide-react' to '@/components/ui/icons'
 * for better tree-shaking.
 *
 * Usage: node scripts/migrate-icons.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const CLIENT_SRC = path.join(__dirname, '..', 'client', 'src');
const ICONS_FILE = path.join(CLIENT_SRC, 'components', 'ui', 'icons.ts');

// Read existing icons from barrel file
function getExportedIcons() {
  const content = fs.readFileSync(ICONS_FILE, 'utf-8');
  const exportMatch = content.match(/export\s*\{([^}]+)\}\s*from\s*'lucide-react'/);
  if (!exportMatch) return new Set();

  const icons = exportMatch[1]
    .split(',')
    .map(s => s.trim())
    .filter(s => s && !s.includes('//'));

  return new Set(icons);
}

// Find all TypeScript/TSX files
function findFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Extract icons from import statement
function extractIcons(importLine) {
  const match = importLine.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  if (!match) return [];

  return match[1]
    .split(',')
    .map(s => {
      // Handle "Icon as Alias" syntax
      const parts = s.trim().split(/\s+as\s+/);
      return parts[0].trim();
    })
    .filter(s => s && !s.startsWith('type ') && !s.startsWith('//'));
}

// Process a single file
function processFile(filePath, exportedIcons, missingIcons) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip the icons.ts file itself
  if (filePath.includes('components/ui/icons.ts')) return null;

  // Check if file imports from lucide-react
  const lucideImportRegex = /import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"]/g;
  const matches = content.match(lucideImportRegex);

  if (!matches) return null;

  let newContent = content;
  let fileIcons = [];

  for (const match of matches) {
    const icons = extractIcons(match);
    fileIcons.push(...icons);

    // Check for missing icons
    for (const icon of icons) {
      if (!exportedIcons.has(icon) && icon !== 'LucideIcon' && icon !== 'LucideProps') {
        missingIcons.add(icon);
      }
    }

    // Replace the import
    const newImport = match.replace("'lucide-react'", "'@/components/ui/icons'")
                          .replace('"lucide-react"', "'@/components/ui/icons'");
    newContent = newContent.replace(match, newImport);
  }

  if (newContent !== content) {
    return { filePath, newContent, icons: fileIcons };
  }

  return null;
}

// Main
function main() {
  console.log('🔍 Scanning for lucide-react imports...\n');

  const exportedIcons = getExportedIcons();
  console.log(`📦 Found ${exportedIcons.size} icons in barrel file\n`);

  const files = findFiles(CLIENT_SRC);
  const missingIcons = new Set();
  const changes = [];

  for (const file of files) {
    const result = processFile(file, exportedIcons, missingIcons);
    if (result) {
      changes.push(result);
    }
  }

  console.log(`📝 Found ${changes.length} files to update\n`);

  if (missingIcons.size > 0) {
    console.log('⚠️  Missing icons (need to add to icons.ts):');
    console.log('   ' + [...missingIcons].sort().join(', '));
    console.log('');
  }

  if (DRY_RUN) {
    console.log('🔍 DRY RUN - No files will be modified\n');
    for (const { filePath, icons } of changes) {
      const relative = path.relative(CLIENT_SRC, filePath);
      console.log(`  ${relative}`);
      console.log(`    Icons: ${icons.join(', ')}`);
    }
  } else {
    console.log('✏️  Updating files...\n');
    for (const { filePath, newContent } of changes) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      const relative = path.relative(CLIENT_SRC, filePath);
      console.log(`  ✓ ${relative}`);
    }
    console.log(`\n✅ Updated ${changes.length} files`);
  }

  if (missingIcons.size > 0) {
    console.log('\n📋 Add these to icons.ts:');
    console.log([...missingIcons].sort().join(',\n'));
  }
}

main();
