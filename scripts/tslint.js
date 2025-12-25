#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import process from 'process';

// Получаем список staged файлов через git
const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .map((f) => resolve(process.cwd(), f));

// Кэш, чтобы не проверять один и тот же пакет несколько раз
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

  console.log(`Running tsc --noEmit for ${tsconfigPath}`);
  try {
    execSync(`npx tsc --noEmit --project "${tsconfigPath}"`, { stdio: 'inherit' });
  } catch {
    console.error(`TypeScript check failed for ${tsconfigPath}`);
    process.exit(1);
  }
}

console.log('TypeScript checks passed for all staged files.');
