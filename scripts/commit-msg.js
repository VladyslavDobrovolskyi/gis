#!/usr/bin/env node

import fs from 'fs';

const msgFile = process.argv[2];
if (!msgFile) process.exit(0);

const originalMsg = fs.readFileSync(msgFile, 'utf8').trim();

// Allowed types
const types = 'feat fix chore refactor docs test style perf build ci revert';
const availableTypes = types.split(' ');

// 1. Parse Package (Example: @scope/pkg)
const packageRegex = /^@([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
const packageMatch = originalMsg.match(packageRegex);

let pkg = null;
let pkgSuffix = null; // The part after slash

if (packageMatch) {
  pkg = packageMatch[0].toLowerCase(); // @docs/feat
  pkgSuffix = packageMatch[2].toLowerCase(); // feat
}

// 2. Determine Type (Strict Logic)
let type = null;
let typeFoundInHeader = false;

// Priority A: Check if the package suffix itself is a valid type (e.g., @docs/feat)
if (pkgSuffix && availableTypes.includes(pkgSuffix)) {
  type = pkgSuffix;
  typeFoundInHeader = true;
}

// Prepare the body for parsing (remove the package header)
let rawBody = originalMsg.replace(packageRegex, '').trim();
// Remove leading punctuation (colon, space) to find the next word cleanly
let cleanBodyStart = rawBody.replace(/^[^a-zA-Z0-9А-Яа-я@]+/, '');

// Priority B: If header didn't have a type, check the FIRST word of the message
if (!type) {
  // Regex looks for type ONLY at the start of the remaining string
  const typeStartRegex = new RegExp(`^(${availableTypes.join('|')})\\b`, 'i');
  const typeMatch = cleanBodyStart.match(typeStartRegex);

  if (typeMatch) {
    type = typeMatch[0].toLowerCase();
    // Remove the type from the body since we found it there
    cleanBodyStart = cleanBodyStart.replace(typeStartRegex, '').trim();
  }
}

// 3. Parse Flags (Look in the remaining text)
const hasE2EF = /\B@e2ef\b/i.test(originalMsg); // Search generally to be safe, or stick to rawBody
const hasDocs = /\B@docs\b/i.test(originalMsg);
const hasE2E = /\B@e2e\b/i.test(originalMsg);

// 4. Construct Header
let header;
if (pkg && type) {
  if (typeFoundInHeader) {
    // Case: @docs/feat -> Header: @docs/feat
    header = pkg;
  } else {
    // Case: @package fix -> Header: @package/fix
    header = `${pkg}/${type}`;
  }
} else {
  header = null;
}

// 5. Final Message Cleanup
let finalBody = cleanBodyStart
  .replace(/\B@docs\b/gi, '') // Remove @docs tag everywhere
  .replace(/\B@e2ef\b/gi, '') // Remove @e2ef tag everywhere
  .replace(/\B@e2e\b/gi, '') // Remove @e2e tag everywhere
  .replace(/^[^a-zA-Z0-9А-Яа-я]+/, '') // Remove remaining punctuation at start (colon, etc)
  .replace(/\s+/g, ' ') // Normalize spaces
  .trim();

// 6. Generate Output
if (header && finalBody) {
  finalBody = finalBody.toLowerCase();
  const capitalizedMsg = finalBody.charAt(0).toUpperCase() + finalBody.slice(1);

  let suffix = '';
  if (hasE2EF) {
    suffix = ' [E2EF]';
  } else if (hasE2E) {
    suffix = ' [E2E]';
  } else if (hasDocs) {
    suffix = ' [DOCS]';
  }

  const finalMsg = `${header}: ${capitalizedMsg}${suffix}`;

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
