// Migration script to replace hardcoded border-radius values with design tokens
// Usage: node scripts/migrate-radius.cjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_MIGRATE = [
  'app/globals.css',
  'app/wisal-atelier.css',
  'app/wisal-atlas.css',
];

// Border-radius token mapping
const RADIUS_TOKEN_MAP = {
  // Full radius (pills, avatars)
  'border-radius: 999px': 'border-radius: var(--ds-radius-full)',
  'border-radius: 99px': 'border-radius: var(--ds-radius-full)',
  'border-radius: 9999px': 'border-radius: var(--ds-radius-full)',
  
  // Large radius (modals, large cards)
  'border-radius: 24px': 'border-radius: var(--ds-radius-lg)',
  'border-radius: 22px': 'border-radius: var(--ds-radius-lg)',
  'border-radius: 20px': 'border-radius: var(--ds-radius-lg)',
  'border-radius: 18px': 'border-radius: var(--ds-radius-lg)',
  'border-radius: 16px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 15px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 14px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 13px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 12px': 'border-radius: var(--ds-radius-md)',
  
  // Medium radius (cards, buttons)
  'border-radius: 11px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 10px': 'border-radius: var(--ds-radius-md)',
  'border-radius: 9px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 8px': 'border-radius: var(--ds-radius-sm)',
  
  // Small radius (inputs, badges)
  'border-radius: 7px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 6px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 5px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 4px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 3px': 'border-radius: var(--ds-radius-sm)',
  'border-radius: 2px': 'border-radius: var(--ds-radius-sm)',
  
  // Circle/avatars
  'border-radius: 50%': 'border-radius: 50%',
  'border-radius:50%': 'border-radius: 50%',
  
  // Special arch shapes (keep as-is for invitation openings)
  // 'border-radius: 100px 100px 0 0': '/* arch exception */',
  // 'border-radius: 120px 120px 0 0': '/* arch exception */',
  // 'border-radius: 120px 120px 12px 12px': '/* arch exception */',
  // 'border-radius: 290px 290px 12px 12px': '/* arch exception */',
  // 'border-radius: 180px 180px 8px 8px': '/* arch exception */',
  // 'border-radius: 170px 170px 6px 6px': '/* arch exception */',
  // 'border-radius: 100px 100px 0 0': '/* arch exception */',
  // 'border-radius: 100px 100px 6px 6px': '/* arch exception */',
  // 'border-radius: 120px 120px 0 0': '/* arch exception */',
};

// Sort by length (longest first) to avoid partial replacements
const sortedMappings = Object.entries(RADIUS_TOKEN_MAP)
  .sort((a, b) => b[0].length - a[0].length);

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [oldValue, newValue] of sortedMappings) {
    if (content.includes(oldValue)) {
      content = content.replace(new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newValue);
      modified = true;
      console.log(`  Replaced: ${oldValue} -> ${newValue}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${filePath}`);
  } else {
    console.log(`- No changes needed in ${filePath}`);
  }
}

console.log('Starting border-radius migration...\n');

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