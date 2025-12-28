#!/usr/bin/env node

/*
  This script formats commit messages as: @scope/type: Message
  Required: @scope, type, message
  Example input:  "@core   feat    added new functionality"
  Result:         "@core/feat: Added new functionality"
*/

import fs from 'fs';

const msgFile = process.argv[2];
if (!msgFile) process.exit(0);

const originalMsg = fs.readFileSync(msgFile, 'utf8').trim();

const types = 'feat fix chore refactor docs test style perf build ci revert';
const availableTypes = types.split(' ');

const packageRegex = /@[a-zA-Z0-9_-]+/;
const typeRegex = new RegExp(`\\b(${availableTypes.join('|')})\\b`, 'i');

const packageMatch = originalMsg.match(packageRegex);
const pkg = packageMatch ? packageMatch[0].toLowerCase() : null;

const typeMatch = originalMsg.match(typeRegex);
const type = typeMatch ? typeMatch[0].toLowerCase() : null;

let cleanMsg = originalMsg
  .replace(packageRegex, '')
  .replace(typeRegex, '')
  .replace(/\s+/g, ' ')
  .replace(/^[^a-zA-Z0-9А-Яа-я]+/, '')
  .trim();

if (pkg && type && cleanMsg) {
  cleanMsg = cleanMsg.toLowerCase();

  const capitalizedMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);

  const finalMsg = `${pkg}/${type}: ${capitalizedMsg}`;

  fs.writeFileSync(msgFile, finalMsg);

  console.log('\x1b[36m%s\x1b[0m', '─── COMMIT FORMATTED (Node.js) ─────────────────────────────');
  console.log(`  \x1b[32m${finalMsg}\x1b[0m`);
  console.log('\x1b[36m%s\x1b[0m', '────────────────────────────────────────────────────────────');
  process.exit(0);
} else {
  console.error('\x1b[31m%s\x1b[0m', '  ✘ INVALID COMMIT MESSAGE');
  console.log('  ----------------------------------------------------------');
  console.log(`  Required: @package type message`);
  console.log(`  Allowed types: ${types}`);
  console.log(`  Your input: "${originalMsg}"`);
  console.log('  ----------------------------------------------------------');
  process.exit(1);
}
