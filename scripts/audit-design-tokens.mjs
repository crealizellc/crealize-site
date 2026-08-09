#!/usr/bin/env node
/**
 * Repository-owned design-token drift check.
 *
 * The previous release gate called a script from another agent's home folder,
 * so a clean clone could not reproduce it. This validator compares the DTCG
 * contract with the shipped CSS and rejects raw palette/font additions in
 * consumer stylesheets without relying on machine-local configuration.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const contract = JSON.parse(readFileSync(join(ROOT, 'docs/design-system/tokens/crealize.tokens.json'), 'utf8'));
const tokenCss = readFileSync(join(ROOT, 'site/css/tokens.css'), 'utf8');
const cssWithoutComments = tokenCss.replace(/\/\*[\s\S]*?\*\//g, '');
const vars = new Map(
  [...cssWithoutComments.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)]
    .map((m) => [m[1], m[2].trim()]),
);

const compact = (value) => String(value).toLowerCase().replace(/[\s'"]/g, '');
const bezier = (parts) => `cubic-bezier(${parts.map((n) => String(n).replace(/^0\./, '.').replace(/^-0\./, '-.')).join(',')})`;
const checks = [
  ...Object.entries(contract.color).map(([name, token]) => [name, token.$value]),
  ...Object.entries(contract.fontSize).map(([name, token]) => [`fs-${name}`, token.$value]),
  ...Object.entries(contract.space).map(([name, token]) => [`s-${name}`, token.$value]),
  ...Object.entries(contract.radius).filter(([, token]) => token.$value).map(([name, token]) => [`r-${name}`, token.$value]),
  ['maxw', contract.layout.maxWidth.$value],
  ['gutter', contract.layout.gutter.$value],
  ['col-gap', contract.layout.colGap.$value],
  ['nav-h', contract.layout.navHeight.$value],
  ['ease-cond', bezier(contract.motion.easeCondensation.$value)],
  ['ease-in-cond', bezier(contract.motion.easeInCondensation.$value)],
  ['dur-1', contract.motion.dur1.$value],
  ['dur-2', contract.motion.dur2.$value],
  ['dur-3', contract.motion.dur3.$value],
];

const failures = [];
for (const [name, expected] of checks) {
  const actual = vars.get(name);
  if (!actual) failures.push(`missing --${name}`);
  else if (compact(actual) !== compact(expected)) failures.push(`--${name}: CSS=${actual} contract=${expected}`);
}

const GENERIC_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'ui-monospace']);
for (const [name, token] of Object.entries(contract.font)) {
  const actual = vars.get(`font-${name}`);
  if (!actual) {
    failures.push(`missing --font-${name}`);
    continue;
  }
  const expectedParts = token.$value.split(',').map((part) => compact(part));
  const actualParts = actual.split(',').map((part) => compact(part)).filter((part) => !GENERIC_FONTS.has(part));
  if (actualParts.slice(0, expectedParts.length).join(',') !== expectedParts.join(',')) {
    failures.push(`--font-${name}: CSS=${actual} contract=${token.$value}`);
  }
}

const consumers = ['site.css', 'sections.css', 'work-modal.css'];
const ALLOWED_RGB = new Set(['18,17,16', '255,255,255', '14,14,16']);
for (const file of consumers) {
  const css = readFileSync(join(ROOT, 'site/css', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) failures.push(`${file}: raw color ${m[0]}`);
  for (const m of css.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    const triplet = `${m[1]},${m[2]},${m[3]}`;
    if (!ALLOWED_RGB.has(triplet)) failures.push(`${file}: uncontracted rgb(${triplet})`);
  }
  for (const m of css.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    if (!m[1].includes('var(--font-')) failures.push(`${file}: raw font-family ${m[1].trim()}`);
  }
}

if (failures.length) {
  console.error(`❌ audit-design-tokens — ${failures.length} drift(s)`);
  failures.forEach((failure) => console.error(`   · ${failure}`));
  process.exit(2);
}

console.log(`✅ audit-design-tokens — ${checks.length + Object.keys(contract.font).length} contract tokens match shipped CSS; consumer palette/fonts are bounded`);
