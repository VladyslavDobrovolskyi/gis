#!/usr/bin/env node

/* 
  This script runs TypeScript type checks on staged .ts and .vue files.
  Note: It checks all files included in the corresponding tsconfig, 
  so it may be slow for large projects.
*/

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import process from 'process';

const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .map((f) => resolve(process.cwd(), f));

const checkedConfigs = new Set();

function findTsconfig(startDir) {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    const tsconfigBuild = join(dir, 'tsconfig.build.json');
    const tsconfig = join(dir, 'tsconfig.json');

    if (existsSync(tsconfigBuild)) return tsconfigBuild;
    if (existsSync(tsconfig)) return tsconfig;

    dir = dirname(dir);
  }
  return null;
}

for (const file of stagedFiles) {
  const pkgDir = dirname(file);
  const tsconfigPath = findTsconfig(pkgDir);

  if (!tsconfigPath) {
    console.warn(`No tsconfig found for ${file}, skipping`);
    continue;
  }

  if (checkedConfigs.has(tsconfigPath)) continue;
  checkedConfigs.add(tsconfigPath);

  console.log(`Running vue-tsc --noEmit for ${tsconfigPath}`);
  try {
    execSync(`npx vue-tsc --noEmit --project "${tsconfigPath}"`, { stdio: 'inherit' });
  } catch {
    console.error(`TypeScript check failed for ${tsconfigPath}`);
    process.exit(1);
  }
}

console.log('TypeScript checks passed for all staged files.');
