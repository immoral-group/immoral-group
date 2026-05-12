#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';
import * as cheerio from 'cheerio';

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

function patchHtml(data, rawDir) {
  const raw = join(ROOT, 'templates', rawDir, `${data.slug}.html`);
  if (!existsSync(raw)) throw new Error(`source HTML missing: ${raw}`);
  const html = readFileSync(raw, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  if (data.seo) {
    if (data.seo.title) $('title').first().text(data.seo.title);
    $('meta[name="description"]').remove();
    if (data.seo.meta_description) {
      $('head').append(`\n  <meta name="description" content="${data.seo.meta_description.replace(/"/g, '&quot;')}">`);
    }
    $('meta[property="og:image"]').remove();
    if (data.seo.og_image) {
      $('head').append(`\n  <meta property="og:image" content="${data.seo.og_image}">`);
    }
  }
  return $.html();
}

function buildServicios() {
  const dir = join(CONTENT, 'servicios');
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const data = loadJson(join(dir, file));
    let html;
    if (data.sections && data.sections.length) {
      html = GENERATED_HEADER + env.render('servicio.html', data);
    } else if (data.mode === 'patch') {
      html = GENERATED_HEADER + patchHtml(data, 'servicios-raw');
    } else {
      console.warn(`  ⚠ ${data.slug}: no sections[] ni mode=patch, skip`);
      continue;
    }
    const out = join(ROOT, `${data.slug}.html`);
    writeFileSync(out, html);
    console.log(`  wrote ${data.slug}.html`);
  }
}

function buildPaginas() {
  const dir = join(CONTENT, 'paginas');
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const data = loadJson(join(dir, file));
    let html;
    if (data.mode === 'template') {
      html = GENERATED_HEADER + env.render(`paginas/${data.slug}.html`, data);
    } else if (data.mode === 'patch') {
      html = GENERATED_HEADER + patchHtml(data, 'paginas-raw');
    } else {
      console.warn(`  ⚠ pagina ${data.slug}: mode=${data.mode || 'none'} no soportado`);
      continue;
    }
    const out = join(ROOT, `${data.slug}.html`);
    writeFileSync(out, html);
    console.log(`  wrote ${data.slug}.html`);
  }
}

console.log('build-pages: start');
buildCasos();
buildServicios();
buildPaginas();
console.log('build-pages: done');
