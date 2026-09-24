#!/usr/bin/env node
/**
 * Migration script to replace hardcoded form input styles with design tokens
 * Usage: node scripts/migrate-form-inputs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_MIGRATE = [
  'app/globals.css',
];

const FORM_INPUT_MIGRATIONS = [
  // Form grid inputs - border radius
  {
    pattern: /border-radius:\s*11px/g,
    replacement: 'border-radius: var(--ds-radius-md)',
    description: 'form inputs border-radius 11px -> md'
  },
  // form inputs border color
  {
    pattern: /border:1px solid var\(--line\)/g,
    replacement: 'border: 1px solid var(--ds-line)',
    description: 'form inputs border color'
  },
  // Focus border color
  {
    pattern: /border-color:var\(--rose\)/g,
    replacement: 'border-color: var(--ds-brand)',
    description: 'focus border color'
  },
  // Focus box shadow
  {
    pattern: /box-shadow:0 0 0 3px rgba\(242,177,153,\.14\)/g,
    replacement: 'box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-brand) 20%, transparent)',
    description: 'focus box shadow'
  },
  // Focus outline
  {
    pattern: /outline:3px solid rgba\(207,129,111,\.58\);outline-offset:3px/g,
    replacement: 'outline: 3px solid var(--ds-brand); outline-offset: 3px',
    description: 'focus outline'
  },
  // Input background
  {
    pattern: /background:#fcfaf8/g,
    replacement: 'background: var(--ds-surface)',
    description: 'input background'
  },
  // Input text color
  {
    pattern: /color:var\(--ink\)/g,
    replacement: 'color: var(--ds-ink)',
    description: 'input text color'
  },
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const migration of FORM_INPUT_MIGRATIONS) {
    const matches = content.match(migration.pattern);
    if (matches && matches.length > 0) {
      content = content.replace(migration.pattern, migration.replacement);
      console.log(`  Replaced: ${migration.description} (${matches.length} occurrences)`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${filePath}`);
  } else {
    console.log(`- No changes needed in ${filePath}`);
  }
}

console.log('Starting form input migration...\n');

for (const file of FILES_TO_MIGRATE) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`\nProcessing ${file}...`);
    migrateFile(fullPath);
  } else {
    console.log(`File not found: ${file}`);
  }
}

console.log('\nMigration complete!');