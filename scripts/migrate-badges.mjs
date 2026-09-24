#!/usr/bin/env node
/**
 * Migration script to replace hardcoded badge/status colors with design tokens
 * Usage: node scripts/migrate-badges.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_MIGRATE = [
  'app/globals.css',
];

const BADGE_MIGRATIONS = [
  // Status badge backgrounds
  {
    pattern: /\.em\.yes\{background:#e7f0e9;color:var\(--green\)\}/g,
    replacement: '.em.yes{background:color-mix(in srgb, var(--ds-success) 15%, var(--ds-surface));color:var(--ds-success)}',
    description: 'em.yes badge'
  },
  {
    pattern: /\.em\.pending\{background:#eee9ef;color:#6d596d\}/g,
    replacement: '.em.pending{background:color-mix(in srgb, var(--ds-warning) 15%, var(--ds-surface));color:var(--ds-warning)}',
    description: 'em.pending badge'
  },
  {
    pattern: /\.em\.no\{background:#f4e4e2;color:var\(--rose-dark\)\}/g,
    replacement: '.em.no{background:color-mix(in srgb, var(--ds-error) 15%, var(--ds-surface));color:var(--ds-error)}',
    description: 'em.no badge'
  },

  // Legend badges
  {
    pattern: /\.legend \.yes\{background:var\(--green\)\}/g,
    replacement: '.legend .yes{background:var(--ds-success)}',
    description: 'legend .yes badge'
  },
  {
    pattern: /\.legend \.maybe\{background:var\(--gold\)\}/g,
    replacement: '.legend .maybe{background:var(--ds-warning)}',
    description: 'legend .maybe badge'
  },
  {
    pattern: /\.legend \.no\{background:var\(--rose\)\}/g,
    replacement: '.legend .no{background:var(--ds-error)}',
    description: 'legend .no badge'
  },
  {
    pattern: /\.legend \.pending\{background:#d4cbd2\}/g,
    replacement: '.legend .pending{background:color-mix(in srgb, var(--ds-warning) 20%, var(--ds-surface))}',
    description: 'legend .pending badge'
  },

  // Admin status badges
  {
    pattern: /\.admin-status\.published,\.admin-table-row em\.published\{background:#e7f0e9;color:var\(--green\)\}/g,
    replacement: '.admin-status.published,.admin-table-row em.published{background:color-mix(in srgb, var(--ds-success) 15%, var(--ds-surface));color:var(--ds-success)}',
    description: 'admin published status'
  },
  {
    pattern: /\.admin-status\.archived,\.admin-table-row em\.archived\{background:#f4e4e2;color:var\(--rose-dark\)\}/g,
    replacement: '.admin-status.archived,.admin-table-row em.archived{background:color-mix(in srgb, var(--ds-error) 15%, var(--ds-surface));color:var(--ds-error)}',
    description: 'admin archived status'
  },

  // Ticket status badges
  {
    pattern: /\.ticket-status\.open\{background:#fff0dd;color:#9a641b\}/g,
    replacement: '.ticket-status.open{background:color-mix(in srgb, var(--ds-warning) 15%, var(--ds-surface));color:var(--ds-warning)}',
    description: 'ticket status open'
  },
  {
    pattern: /\.ticket-status\.in_progress\{background:#e9eff8;color:#375f91\}/g,
    replacement: '.ticket-status.in_progress{background:color-mix(in srgb, var(--ds-info) 15%, var(--ds-surface));color:var(--ds-info)}',
    description: 'ticket status in_progress'
  },
  {
    pattern: /\.ticket-status\.resolved\{background:#e4f1e7;color:var\(--green\)\}/g,
    replacement: '.ticket-status.resolved{background:color-mix(in srgb, var(--ds-success) 15%, var(--ds-surface));color:var(--ds-success)}',
    description: 'ticket status resolved'
  },
  {
    pattern: /\.ticket-status\.closed\{background:#eee9ef;color:var\(--muted\)\}/g,
    replacement: '.ticket-status.closed{background:color-mix(in srgb, var(--ds-ink-muted) 15%, var(--ds-surface));color:var(--ds-ink-muted)}',
    description: 'ticket status closed'
  },

  // Ticket priority badges
  {
    pattern: /\.ticket-priority\.normal\{background:#eee9ef;color:var\(--muted\)\}/g,
    replacement: '.ticket-priority.normal{background:color-mix(in srgb, var(--ds-ink-muted) 15%, var(--ds-surface));color:var(--ds-ink-muted)}',
    description: 'ticket priority normal'
  },
  {
    pattern: /\.ticket-priority\.high\{background:#fff0dd;color:#9a641b\}/g,
    replacement: '.ticket-priority.high{background:color-mix(in srgb, var(--ds-warning) 15%, var(--ds-surface));color:var(--ds-warning)}',
    description: 'ticket priority high'
  },
  {
    pattern: /\.ticket-priority\.urgent\{background:#f7dfdd;color:#a24747\}/g,
    replacement: '.ticket-priority.urgent{background:color-mix(in srgb, var(--ds-error) 15%, var(--ds-surface));color:var(--ds-error)}',
    description: 'ticket priority urgent'
  },

  // Message status badges
  {
    pattern: /\.message-status\.draft\{background:#eee9ef;color:var\(--plum\)\}/g,
    replacement: '.message-status.draft{background:color-mix(in srgb, var(--ds-brand) 10%, var(--ds-surface));color:var(--ds-brand)}',
    description: 'message status draft'
  },
  {
    pattern: /\.message-status\.scheduled\{background:#e7f0e9;color:var\(--green\)\}/g,
    replacement: '.message-status.scheduled{background:color-mix(in srgb, var(--ds-success) 15%, var(--ds-surface));color:var(--ds-success)}',
    description: 'message status scheduled'
  },

  // Admin support list badges
  {
    pattern: /\.admin-support-list>article>header>div{display:flex;gap:6px}\.ticket-status\.open\{background:#fff0dd;color:#9a641b\}/g,
    replacement: '.admin-support-list>article>header>div{display:flex;gap:6px}.ticket-status.open{background:color-mix(in srgb, var(--ds-warning) 15%, var(--ds-surface));color:var(--ds-warning)}',
    description: 'admin support open status'
  },
  {
    pattern: /\.ticket-status\.in_progress\{background:#e9eff8;color:#375f91\}/g,
    replacement: '.ticket-status.in_progress{background:color-mix(in srgb, var(--ds-info) 15%, var(--ds-surface));color:var(--ds-info)}',
    description: 'admin support in_progress status'
  },
  {
    pattern: /\.ticket-status\.resolved\{background:#e4f1e7;color:var\(--green\)\}/g,
    replacement: '.ticket-status.resolved{background:color-mix(in srgb, var(--ds-success) 15%, var(--ds-surface));color:var(--ds-success)}',
    description: 'admin support resolved status'
  },
  {
    pattern: /\.ticket-status\.closed\{background:#eee9ef;color:var\(--muted\)\}/g,
    replacement: '.ticket-status.closed{background:color-mix(in srgb, var(--ds-ink-muted) 15%, var(--ds-surface));color:var(--ds-ink-muted)}',
    description: 'admin support closed status'
  },

  // Admin ticket priority
  {
    pattern: /\.ticket-priority\.normal\{background:#eee9ef;color:var\(--muted\)\}/g,
    replacement: '.ticket-priority.normal{background:color-mix(in srgb, var(--ds-ink-muted) 15%, var(--ds-surface));color:var(--ds-ink-muted)}',
    description: 'admin ticket priority normal'
  },
  {
    pattern: /\.ticket-priority\.high\{background:#fff0dd;color:#9a641b\}/g,
    replacement: '.ticket-priority.high{background:color-mix(in srgb, var(--ds-warning) 15%, var(--ds-surface));color:var(--ds-warning)}',
    description: 'admin ticket priority high'
  },
  {
    pattern: /\.ticket-priority\.urgent\{background:#f7dfdd;color:#a24747\}/g,
    replacement: '.ticket-priority.urgent{background:color-mix(in srgb, var(--ds-error) 15%, var(--ds-surface));color:var(--ds-error)}',
    description: 'admin ticket priority urgent'
  },

  // Segment RSVP options
  {
    pattern: /\.segment-rsvp-options button\.selected\{background:var\(--plum\);border-color:var\(--plum\);color:#fff\}/g,
    replacement: '.segment-rsvp-options button.selected{background:var(--ds-brand);border-color:var(--ds-brand);color:#fff}',
    description: 'segment RSVP selected option'
  },
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const migration of BADGE_MIGRATIONS) {
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

console.log('Starting badge/status migration...\n');

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