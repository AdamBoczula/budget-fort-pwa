#!/usr/bin/env node
/**
 * Skrypt przygotowujący build pod Firebase Hosting.
 *
 * Struktura builda z Angular (i18n):
 *   dist/budget-fort/browser/pl/  → build polski
 *   dist/budget-fort/browser/en/  → build angielski
 *
 * Firebase Hosting serwuje pliki z katalogu `public`.
 * Polski build musi być w katalogu głównym (root), a angielski pod `/en/`.
 *
 * Ten skrypt:
 *   1. Kopiuje build polski z `pl/` do katalogu głównego `browser/`
 *   2. Usuwa katalog `pl/`
 *   3. Weryfikuje, że build angielski istnieje w `en/`
 */
import { cp, rm, access, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BROWSER_DIR = join(ROOT, 'dist', 'budget-fort', 'browser');
const PL_DIR = join(BROWSER_DIR, 'pl');
const EN_DIR = join(BROWSER_DIR, 'en');

async function main() {
  console.log('📦 Przygotowywanie builda pod Firebase Hosting...');

  // 1. Sprawdź, czy buildy istnieją
  if (!existsSync(PL_DIR)) {
    console.error(`❌ Brak builda polskiego w: ${PL_DIR}`);
    console.error('   Uruchom najpierw: nx run budget-fort:build:production');
    process.exit(1);
  }

  if (!existsSync(EN_DIR)) {
    console.error(`❌ Brak builda angielskiego w: ${EN_DIR}`);
    console.error('   Uruchom najpierw: nx run budget-fort:build:production-en');
    process.exit(1);
  }

  // 2. Skopiuj build polski do katalogu głównego
  console.log(`📂 Kopiowanie builda polskiego z ${PL_DIR} do ${BROWSER_DIR}...`);
  const files = await readdir(PL_DIR);
  for (const file of files) {
    const src = join(PL_DIR, file);
    const dest = join(BROWSER_DIR, file);
    await cp(src, dest, { recursive: true, force: true });
  }

  // 3. Usuń katalog pl/
  console.log('🗑️  Usuwanie katalogu pl/...');
  await rm(PL_DIR, { recursive: true, force: true });

  // 3b. Upewnij się, że base href w index.html wskazuje na "/"
  const rootIndexHtmlPath = join(BROWSER_DIR, 'index.html');
  if (existsSync(rootIndexHtmlPath)) {
    let indexHtml = await readFile(rootIndexHtmlPath, 'utf-8');
    if (indexHtml.includes('<base href="/pl/">')) {
      console.log('🔧 Podmienianie <base href="/pl/"> na <base href="/"> w index.html...');
      indexHtml = indexHtml.replace('<base href="/pl/">', '<base href="/">');
      await writeFile(rootIndexHtmlPath, indexHtml, 'utf-8');
    }
  }

  // 3c. Upewnij się, że base href w en/index.html wskazuje na "/en/"
  const enIndexHtmlPath = join(EN_DIR, 'index.html');
  if (existsSync(enIndexHtmlPath)) {
    let enHtml = await readFile(enIndexHtmlPath, 'utf-8');
    if (enHtml.includes('<base href="/en/en/">')) {
      console.log('🔧 Podmienianie <base href="/en/en/"> na <base href="/en/"> w en/index.html...');
      enHtml = enHtml.replace('<base href="/en/en/">', '<base href="/en/">');
      await writeFile(enIndexHtmlPath, enHtml, 'utf-8');
    }
  }

  // 4. Weryfikacja
  const rootFiles = await readdir(BROWSER_DIR);
  const enFiles = await readdir(EN_DIR);

  if (!rootFiles.includes('index.html')) {
    console.error('❌ Brak index.html w katalogu głównym builda!');
    process.exit(1);
  }

  if (!enFiles.includes('index.html')) {
    console.error('❌ Brak index.html w katalogu en/!');
    process.exit(1);
  }

  console.log('✅ Build gotowy do deployu!');
  console.log(`   Katalog główny (PL): ${BROWSER_DIR}`);
  console.log(`   Katalog /en/ (EN):   ${EN_DIR}`);
  console.log('');
  console.log('   Następny krok: firebase deploy --only hosting');
}

main().catch((err) => {
  console.error('❌ Błąd podczas przygotowywania builda:', err);
  process.exit(1);
});
