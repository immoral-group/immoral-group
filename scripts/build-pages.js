#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const CONTENT = join(ROOT, 'content');
const TEMPLATES = join(ROOT, 'templates');

const env = nunjucks.configure(TEMPLATES, {
  autoescape: false,
  throwOnUndefined: false,
  trimBlocks: false,
  lstripBlocks: false,
});

const GENERATED_HEADER = '<!-- generated. Edita content/*.json, no este archivo. -->\n';

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function buildCasos() {
  const dir = join(CONTENT, 'casos');
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const data = loadJson(join(dir, file));
    const html = env.render('caso.html', data);
    const out = join(ROOT, `caso-${data.slug}.html`);
    writeFileSync(out, GENERATED_HEADER + html);
    console.log(`  wrote caso-${data.slug}.html`);
  }
}

function buildServicios() {
  const dir = join(CONTENT, 'servicios');
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const data = loadJson(join(dir, file));
    const html = env.render('servicio.html', data);
    const out = join(ROOT, `${data.slug}.html`);
    writeFileSync(out, GENERATED_HEADER + html);
    console.log(`  wrote ${data.slug}.html`);
  }
}

console.log('build-pages: start');
buildCasos();
buildServicios();
console.log('build-pages: done');
