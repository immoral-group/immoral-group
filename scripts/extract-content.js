#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const CONTENT_CASOS = join(ROOT, 'content', 'casos');

if (!existsSync(CONTENT_CASOS)) mkdirSync(CONTENT_CASOS, { recursive: true });

function txt(el) {
  if (!el || el.length === 0) return null;
  return el.text().replace(/\s+/g, ' ').trim();
}
function multilineTxt(el) {
  if (!el || el.length === 0) return null;
  return el.text().trim();
}
function attr(el, name) {
  if (!el || el.length === 0) return null;
  return el.attr(name) || null;
}

function extractCaso(file) {
  const html = readFileSync(file, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  const slug = file.match(/caso-(.+)\.html$/)[1];

  // Hero
  const heroSection = $('section').filter((i, el) =>
    $(el).find('header p.text-blue-500').length > 0 &&
    $(el).find('header h1').length > 0
  ).first();

  const eyebrow = txt(heroSection.find('header p.text-blue-500').first());
  const h1 = heroSection.find('header h1').first();
  const h1Html = h1.html() || '';
  const titleParts = h1Html.split(/\s+/).map(s => s.trim()).filter(Boolean);
  const descP = heroSection.find('div.reveal-lines p').first();
  const heroDesc = multilineTxt(descP);
  const logoImg = heroSection.find('img').first();

  // Reto (challenge section bg-blue-500)
  const retoSection = $('section').filter((i, el) =>
    $(el).find('h2').text().trim() === 'Reto'
  ).first();
  const retoParas = [];
  retoSection.find('p.reveal-lines').each((i, el) => {
    const t = multilineTxt($(el));
    if (t) retoParas.push(t);
  });

  // Image section (full-width image after reto)
  const imgSection = $('section').filter((i, el) => {
    const cls = $(el).attr('class') || '';
    return cls.includes('h-64') && cls.includes('overflow-hidden');
  }).first();
  const heroImg = imgSection.find('img').first();

  // Solución section
  const soluH2 = $('h2').filter((i, el) => $(el).text().replace(/\s+/g, ' ').trim().startsWith('La solución') || $(el).text().replace(/\s+/g, ' ').trim().startsWith('La\n              solución') || $(el).text().replace(/\s+/g, ' ').trim() === 'La solución').first();
  const soluContainer = soluH2.closest('div.flex').find('div.space-y-6').first();
  const soluParas = [];
  soluContainer.find('p').each((i, el) => {
    soluParas.push(multilineTxt($(el)));
  });

  // KPIs (grid sm:grid-cols-3 with text-center divs)
  const kpis = [];
  $('div.grid.sm\\:grid-cols-3, div.grid.grid-cols-1.sm\\:grid-cols-3').first().find('div.text-center').each((i, el) => {
    const h2El = $(el).find('h2').first();
    const v = txt(h2El);
    const l = multilineTxt($(el).find('p').first());
    const sizeMatch = (h2El.attr('class') || '').match(/text-(\d+)xl\s+sm:text-(\d+)xl/);
    const size_class = sizeMatch ? `text-${sizeMatch[1]}xl sm:text-${sizeMatch[2]}xl` : 'text-5xl sm:text-6xl';
    if (v) kpis.push({ value: v, label: l, size_class });
  });

  // Testimonios title (3 a tags inside h2)
  const testHeader = $('section').filter((i, el) =>
    $(el).find('#simple-testimonials-carousel').length > 0
  ).first();
  const titleH2 = testHeader.find('h2').first();
  const titleAnchors = titleH2.find('a');
  const testimonios_titulo = titleAnchors.length >= 3 ? {
    linea1: $(titleAnchors[0]).text(),
    linea2: $(titleAnchors[1]).text(),
    linea3_highlight: $(titleAnchors[2]).find('span').text() || $(titleAnchors[2]).text(),
  } : null;

  // Testimonios cards
  const testimonios = [];
  let testimoniosLogo = null;
  let testimoniosLogoAlt = null;
  testHeader.find('.testimonial-card').each((i, el) => {
    const card = $(el);
    const cardImg = card.find('img').first();
    if (!testimoniosLogo) {
      testimoniosLogo = attr(cardImg, 'src');
      testimoniosLogoAlt = attr(cardImg, 'alt');
    }
    testimonios.push({
      titulo: multilineTxt(card.find('h3').first()),
      quote: multilineTxt(card.find('p.text-gray-700').first()),
      autor: txt(card.find('p.text-gray-900').first()),
      rol: txt(card.find('p.text-gray-600').first()),
      logo_class: attr(cardImg, 'class'),
    });
  });

  // SEO
  const title = txt($('title').first());

  // Build cliente name from h1 (join parts)
  const cliente = h1.text().replace(/\s+/g, ' ').trim();
  const [tp1, ...tp2parts] = cliente.split(' ');

  return {
    slug,
    cliente,
    logo: {
      src: attr(logoImg, 'src'),
      alt: attr(logoImg, 'alt'),
    },
    hero: {
      eyebrow,
      title_part1: tp1 || cliente,
      title_part2: tp2parts.join(' '),
      description: heroDesc,
    },
    reto: retoParas,
    image: {
      src: attr(heroImg, 'src'),
      alt: attr(heroImg, 'alt'),
    },
    solucion: soluParas,
    kpis,
    testimonios_titulo,
    testimonios,
    testimonios_logo: testimoniosLogo,
    testimonios_logo_alt: testimoniosLogoAlt,
    seo: {
      title,
      meta_description: null,
      og_image: null,
    },
  };
}

const casos = readdirSync(ROOT).filter(f => /^caso-.*\.html$/.test(f) && f !== 'casos-de-exito.html');
console.log(`extract: ${casos.length} casos`);
const warnings = [];
for (const file of casos) {
  const path = join(ROOT, file);
  try {
    const data = extractCaso(path);
    const issues = [];
    if (!data.hero.description) issues.push('hero.description vacío');
    if (!data.reto || data.reto.length === 0) issues.push('reto vacío');
    if (!data.image.src) issues.push('image vacío');
    if (data.solucion.length === 0) issues.push('solucion vacío');
    if (data.kpis.length === 0) issues.push('kpis vacío');
    if (data.testimonios.length === 0) issues.push('testimonios vacío');
    if (issues.length) warnings.push(`  ${file}: ${issues.join(', ')}`);
    const out = join(CONTENT_CASOS, `${data.slug}.json`);
    writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✓ ${data.slug} (kpis:${data.kpis.length}, test:${data.testimonios.length}, sol:${data.solucion.length})`);
  } catch (e) {
    console.error(`  ✗ ${file}: ${e.message}`);
    warnings.push(`  ${file}: ERROR ${e.message}`);
  }
}
if (warnings.length) {
  console.log('\nwarnings:');
  warnings.forEach(w => console.log(w));
}
console.log('extract: done');
