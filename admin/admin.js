const api = {
  list: (type) => fetch(`/api/content/${type}`).then(r => r.json()),
  get: (type, slug) => fetch(`/api/content/${type}/${slug}`).then(r => r.json()),
  save: (type, slug, data) => fetch(`/api/content/${type}/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  build: () => fetch('/api/content/build', { method: 'POST' }).then(r => r.json()),
};

const state = {
  view: 'list',          // 'list' | 'edit'
  type: 'casos',         // casos | servicios | paginas
  slug: null,
  data: null,
  dirty: false,
  filter: '',
  cache: { casos: null, servicios: null, paginas: [] },
};

function setHash(type, slug) {
  if (slug) location.hash = `#/${type}/${slug}`;
  else location.hash = `#/${type}`;
}

function parseHash() {
  const m = location.hash.match(/^#\/(casos|servicios|paginas)(?:\/(.+))?$/);
  if (!m) return { type: 'casos', slug: null };
  return { type: m[1], slug: m[2] || null };
}

async function navigate(type, slug) {
  if (state.dirty && !confirm('Hay cambios sin guardar. ¿Descartar?')) return;
  state.type = type;
  state.slug = slug;
  state.dirty = false;
  setHash(type, slug);
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.type === type);
  });
  if (slug) {
    state.view = 'edit';
    state.data = await api.get(type, slug);
    renderEdit();
  } else {
    state.view = 'list';
    if (!state.cache[type]) {
      try { state.cache[type] = (await api.list(type)).items; } catch { state.cache[type] = []; }
    }
    renderList();
  }
}

async function refreshCounts() {
  const c = await api.list('casos').catch(() => ({ items: [] }));
  const s = await api.list('servicios').catch(() => ({ items: [] }));
  state.cache.casos = c.items;
  state.cache.servicios = s.items;
  document.getElementById('count-casos').textContent = c.items.length;
  document.getElementById('count-servicios').textContent = s.items.length;
}

function renderList() {
  const el = document.getElementById('editor');
  el.className = 'editor list-view';
  const items = (state.cache[state.type] || []).slice();
  const labels = { casos: 'Casos de éxito', servicios: 'Servicios', paginas: 'Páginas' };

  if (state.type === 'paginas') {
    el.innerHTML = `<div class="list-toolbar"><h1>${labels[state.type]}</h1></div><p style="color:#888">Aún sin migrar al CMS. Próximamente.</p>`;
    return;
  }

  el.innerHTML = '';
  const tb = document.createElement('div');
  tb.className = 'list-toolbar';
  const h1 = document.createElement('h1');
  h1.textContent = `${labels[state.type]} (${items.length})`;
  tb.appendChild(h1);
  const search = document.createElement('input');
  search.className = 'search';
  search.placeholder = 'Buscar…';
  search.value = state.filter;
  search.oninput = (e) => { state.filter = e.target.value.toLowerCase(); renderList(); };
  tb.appendChild(search);
  el.appendChild(tb);

  const filtered = items.filter(i => !state.filter || i.cliente.toLowerCase().includes(state.filter) || i.slug.toLowerCase().includes(state.filter));
  filtered.sort((a, b) => a.cliente.localeCompare(b.cliente));

  const table = document.createElement('table');
  table.className = 'items-table';
  const isCasos = state.type === 'casos';
  table.innerHTML = `
    <thead>
      <tr>
        <th>${isCasos ? 'Cliente' : 'Título'}</th>
        <th>Slug</th>
        <th>URL pública</th>
        <th class="actions">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  for (const item of filtered) {
    const tr = document.createElement('tr');
    const publicPath = isCasos ? `/caso-${item.slug}.html` : `/${item.slug}.html`;
    tr.innerHTML = `
      <td class="cliente">${escapeHtml(item.cliente)}</td>
      <td class="slug">${escapeHtml(item.slug)}</td>
      <td class="meta"><a href="${publicPath}" target="_blank" style="color:#4889eb;text-decoration:none">${publicPath} ↗</a></td>
      <td class="actions"><a class="edit-link">Editar</a></td>
    `;
    tr.onclick = (e) => {
      if (e.target.closest('a[target=_blank]')) return;
      navigate(state.type, item.slug);
    };
    tbody.appendChild(tr);
  }
  el.appendChild(table);

  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.style.color = '#888';
    empty.style.padding = '16px';
    empty.textContent = state.filter ? `Sin resultados para "${state.filter}"` : 'No hay items';
    el.appendChild(empty);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function field(label, value, onChange, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const lab = document.createElement('label');
  lab.textContent = label;
  wrap.appendChild(lab);
  const input = document.createElement(opts.multiline ? 'textarea' : 'input');
  if (!opts.multiline) input.type = opts.type || 'text';
  input.value = value == null ? '' : value;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  input.oninput = (e) => { onChange(e.target.value); state.dirty = true; updateStatus('dirty'); };
  wrap.appendChild(input);
  return wrap;
}

function arrayEditor(label, items, mkFields, addEmpty) {
  const wrap = document.createElement('fieldset');
  const leg = document.createElement('legend');
  leg.textContent = `${label} (${items.length})`;
  wrap.appendChild(leg);
  const container = document.createElement('div');
  wrap.appendChild(container);

  function render() {
    container.innerHTML = '';
    leg.textContent = `${label} (${items.length})`;
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'array-item';
      const rm = document.createElement('button');
      rm.className = 'remove';
      rm.textContent = '×';
      rm.title = 'Eliminar';
      rm.onclick = () => { items.splice(i, 1); state.dirty = true; updateStatus('dirty'); render(); };
      card.appendChild(rm);
      mkFields(card, item, i);
      container.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'add-btn';
    add.textContent = `+ Añadir ${label.toLowerCase().replace(/s$/, '')}`;
    add.onclick = () => { items.push(addEmpty()); state.dirty = true; updateStatus('dirty'); render(); };
    container.appendChild(add);
  }
  render();
  return wrap;
}

function renderEdit() {
  const el = document.getElementById('editor');
  el.className = 'editor edit-view';
  if (state.type === 'casos') renderCasoEditor();
  else if (state.type === 'servicios') renderServicioEditor();
}

function backLink() {
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = `← Volver a ${state.type === 'casos' ? 'Casos' : 'Servicios'}`;
  a.style.cssText = 'color:#4889eb;text-decoration:none;font-size:13px;display:inline-block;margin-bottom:12px';
  a.onclick = (e) => { e.preventDefault(); navigate(state.type, null); };
  return a;
}

function renderCasoEditor() {
  const el = document.getElementById('editor');
  const d = state.data;
  el.innerHTML = '';
  el.appendChild(backLink());

  const bc = document.createElement('div');
  bc.className = 'breadcrumb';
  bc.textContent = `casos / ${d.slug}`;
  el.appendChild(bc);

  const title = document.createElement('h2');
  title.textContent = d.cliente || d.slug;
  el.appendChild(title);

  el.appendChild(field('Cliente', d.cliente, v => d.cliente = v));

  const logoSet = document.createElement('fieldset');
  const logoLeg = document.createElement('legend');
  logoLeg.textContent = 'Logo';
  logoSet.appendChild(logoLeg);
  d.logo = d.logo || {};
  logoSet.appendChild(field('Src', d.logo.src, v => d.logo.src = v));
  logoSet.appendChild(field('Alt', d.logo.alt, v => d.logo.alt = v));
  el.appendChild(logoSet);

  const heroSet = document.createElement('fieldset');
  const heroLeg = document.createElement('legend');
  heroLeg.textContent = 'Hero';
  heroSet.appendChild(heroLeg);
  d.hero = d.hero || {};
  heroSet.appendChild(field('Eyebrow', d.hero.eyebrow, v => d.hero.eyebrow = v));
  const titleRow = document.createElement('div');
  titleRow.className = 'field-row';
  titleRow.appendChild(field('Title parte 1', d.hero.title_part1, v => d.hero.title_part1 = v));
  titleRow.appendChild(field('Title parte 2', d.hero.title_part2, v => d.hero.title_part2 = v));
  heroSet.appendChild(titleRow);
  heroSet.appendChild(field('Descripción', d.hero.description, v => d.hero.description = v, { multiline: true }));
  el.appendChild(heroSet);

  d.reto = d.reto || [];
  el.appendChild(arrayEditor('Reto (párrafos)', d.reto, (card, item, i) => {
    card.appendChild(field(`Párrafo ${i + 1}`, item, v => d.reto[i] = v, { multiline: true }));
  }, () => ''));

  const imgSet = document.createElement('fieldset');
  const imgLeg = document.createElement('legend');
  imgLeg.textContent = 'Imagen';
  imgSet.appendChild(imgLeg);
  d.image = d.image || {};
  imgSet.appendChild(field('Src', d.image.src, v => d.image.src = v));
  imgSet.appendChild(field('Alt', d.image.alt, v => d.image.alt = v));
  el.appendChild(imgSet);

  d.solucion = d.solucion || [];
  el.appendChild(arrayEditor('Solución (párrafos)', d.solucion, (card, item, i) => {
    card.appendChild(field(`Párrafo ${i + 1}`, item, v => d.solucion[i] = v, { multiline: true }));
  }, () => ''));

  d.kpis = d.kpis || [];
  el.appendChild(arrayEditor('KPIs', d.kpis, (card, item) => {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.appendChild(field('Valor', item.value, v => item.value = v));
    row.appendChild(field('Label', item.label, v => item.label = v));
    card.appendChild(row);
    card.appendChild(field('Size class', item.size_class || '', v => item.size_class = v, { placeholder: 'text-5xl sm:text-6xl' }));
  }, () => ({ value: '', label: '', size_class: 'text-5xl sm:text-6xl' })));

  if (d.testimonios_titulo) {
    const tt = document.createElement('fieldset');
    const ttLeg = document.createElement('legend');
    ttLeg.textContent = 'Testimonios · Título';
    tt.appendChild(ttLeg);
    tt.appendChild(field('Línea 1', d.testimonios_titulo.linea1, v => d.testimonios_titulo.linea1 = v));
    tt.appendChild(field('Línea 2', d.testimonios_titulo.linea2, v => d.testimonios_titulo.linea2 = v));
    tt.appendChild(field('Línea 3 (highlight)', d.testimonios_titulo.linea3_highlight, v => d.testimonios_titulo.linea3_highlight = v));
    el.appendChild(tt);
  }

  d.testimonios = d.testimonios || [];
  el.appendChild(arrayEditor('Testimonios', d.testimonios, (card, item) => {
    card.appendChild(field('Título', item.titulo, v => item.titulo = v));
    card.appendChild(field('Quote', item.quote, v => item.quote = v, { multiline: true }));
    const row = document.createElement('div');
    row.className = 'field-row';
    row.appendChild(field('Autor', item.autor, v => item.autor = v));
    row.appendChild(field('Rol', item.rol, v => item.rol = v));
    card.appendChild(row);
  }, () => ({ titulo: '', quote: '', autor: '', rol: '', logo_class: 'h-16 w-16 object-contain' })));

  const seoSet = document.createElement('fieldset');
  const seoLeg = document.createElement('legend');
  seoLeg.textContent = 'SEO';
  seoSet.appendChild(seoLeg);
  d.seo = d.seo || {};
  seoSet.appendChild(field('Title', d.seo.title, v => d.seo.title = v));
  seoSet.appendChild(field('Meta description', d.seo.meta_description || '', v => d.seo.meta_description = v || null, { multiline: true }));
  seoSet.appendChild(field('OG image', d.seo.og_image || '', v => d.seo.og_image = v || null));
  el.appendChild(seoSet);

  el.appendChild(toolbar());
}

function renderServicioEditor() {
  const el = document.getElementById('editor');
  const d = state.data;
  const isPatchMode = d.mode === 'patch' || !d.sections;
  el.innerHTML = '';
  el.appendChild(backLink());

  const bc = document.createElement('div');
  bc.className = 'breadcrumb';
  bc.textContent = `servicios / ${d.slug}`;
  el.appendChild(bc);

  const title = document.createElement('h2');
  title.textContent = d.title || d.slug;
  el.appendChild(title);

  if (isPatchMode) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fff8e1;border:1px solid #f5d97a;padding:10px 14px;border-radius:4px;margin-bottom:16px;font-size:13px;color:#8a6d00';
    banner.textContent = '⚙ Modo patch: este servicio mantiene su HTML original. Solo SEO es editable desde aquí. Cuerpo se actualiza editando templates/servicios-raw/' + d.slug + '.html';
    el.appendChild(banner);
  }

  el.appendChild(field('Title (interno)', d.title, v => d.title = v));
  if (!isPatchMode) {
    el.appendChild(field('Accent color', d.accent_color, v => d.accent_color = v, { placeholder: '#2f80ed' }));
  }

  const seoSet = document.createElement('fieldset');
  const seoLeg = document.createElement('legend');
  seoLeg.textContent = 'SEO';
  seoSet.appendChild(seoLeg);
  d.seo = d.seo || {};
  seoSet.appendChild(field('Title', d.seo.title, v => d.seo.title = v));
  seoSet.appendChild(field('Meta description', d.seo.meta_description || '', v => d.seo.meta_description = v || null, { multiline: true }));
  seoSet.appendChild(field('OG image', d.seo.og_image || '', v => d.seo.og_image = v || null));
  el.appendChild(seoSet);

  if (!isPatchMode) {
    d.sections = d.sections || [];
    d.sections.forEach((section, idx) => {
      el.appendChild(renderSectionEditor(section, idx, d));
    });
  }

  el.appendChild(toolbar());
}

function toolbar() {
  const tb = document.createElement('div');
  tb.className = 'toolbar';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Guardar';
  saveBtn.onclick = saveCurrent;
  tb.appendChild(saveBtn);
  const buildBtn = document.createElement('button');
  buildBtn.className = 'btn-secondary';
  buildBtn.textContent = 'Guardar + Build';
  buildBtn.onclick = async () => { await saveCurrent(); await runBuild(); };
  tb.appendChild(buildBtn);
  const status = document.createElement('span');
  status.className = 'status';
  status.id = 'editor-status';
  tb.appendChild(status);
  return tb;
}

function renderSectionEditor(section, idx) {
  const wrap = document.createElement('fieldset');
  const leg = document.createElement('legend');
  leg.textContent = `Sección ${idx + 1}: ${section.type}`;
  wrap.appendChild(leg);
  switch (section.type) {
    case 'hero_scroll':
      wrap.appendChild(field('Eyebrow', section.eyebrow, v => section.eyebrow = v));
      wrap.appendChild(field('Title (HTML)', section.title_html, v => section.title_html = v, { multiline: true }));
      wrap.appendChild(field('Subtitle (HTML)', section.subtitle_html, v => section.subtitle_html = v, { multiline: true }));
      wrap.appendChild(field('Body text', section.body_text, v => section.body_text = v, { multiline: true }));
      wrap.appendChild(field('Spline URL', section.spline_url, v => section.spline_url = v));
      section.tagline_lines_html = section.tagline_lines_html || [];
      wrap.appendChild(arrayEditor('Tagline lines (HTML)', section.tagline_lines_html, (card, item, i) => {
        card.appendChild(field(`Línea ${i + 1}`, item, v => section.tagline_lines_html[i] = v, { multiline: true }));
      }, () => ''));
      break;
    case 'plataformas':
      wrap.appendChild(field('Title (HTML)', section.title_html, v => section.title_html = v));
      wrap.appendChild(field('Subtitle', section.subtitle, v => section.subtitle = v, { multiline: true }));
      section.items = section.items || [];
      wrap.appendChild(arrayEditor('Plataformas', section.items, (card, item) => {
        const row = document.createElement('div');
        row.className = 'field-row';
        row.appendChild(field('Nombre', item.name, v => item.name = v));
        row.appendChild(field('Hover color', item.hover_color, v => item.hover_color = v));
        card.appendChild(row);
        card.appendChild(field('Icon path', item.icon, v => item.icon = v));
        card.appendChild(field('Descripción', item.description, v => item.description = v, { multiline: true }));
      }, () => ({ name: '', icon: '', description: '', hover_color: '#000', text_on_hover: 'white', icon_class: 'w-auto h-7 self-start mb-4', icon_invert_on_hover: false, span_full_width: false })));
      break;
    case 'faq_accordion':
      wrap.appendChild(field('Title', section.title, v => section.title = v));
      wrap.appendChild(field('Subtitle', section.subtitle, v => section.subtitle = v, { multiline: true }));
      section.items = section.items || [];
      wrap.appendChild(arrayEditor('FAQ items', section.items, (card, item) => {
        card.appendChild(field('Pregunta', item.question, v => item.question = v));
        card.appendChild(field('Respuesta', item.answer, v => item.answer = v, { multiline: true }));
      }, () => ({ question: '', answer: '' })));
      break;
    case 'how_we_do_it':
      wrap.appendChild(field('Title', section.title, v => section.title = v));
      wrap.appendChild(field('Bg image', section.bg_image, v => section.bg_image = v));
      section.panels = section.panels || [];
      wrap.appendChild(arrayEditor('Panels', section.panels, (card, item) => {
        const row = document.createElement('div');
        row.className = 'field-row';
        row.appendChild(field('Número', item.number, v => item.number = parseInt(v) || 1));
        row.appendChild(field('Color bg', item.color_bg, v => item.color_bg = v));
        card.appendChild(row);
        card.appendChild(field('Text color', item.text_color, v => item.text_color = v, { placeholder: 'white o black' }));
        card.appendChild(field('H3 (HTML)', item.h3_html, v => item.h3_html = v, { multiline: true }));
        card.appendChild(field('Descripción', item.description, v => item.description = v, { multiline: true }));
      }, () => ({ number: 1, h3_html: '', description: '', color_bg: '#2f80ed', text_color: 'white' })));
      break;
    case 'kpis_simple':
      wrap.appendChild(field('Title', section.title, v => section.title = v));
      section.items = section.items || [];
      wrap.appendChild(arrayEditor('KPIs', section.items, (card, item) => {
        card.appendChild(field('Icon GIF path', item.icon_gif, v => item.icon_gif = v));
        const row = document.createElement('div');
        row.className = 'field-row';
        row.appendChild(field('Valor', item.value, v => item.value = v));
        row.appendChild(field('Label', item.label, v => item.label = v));
        card.appendChild(row);
      }, () => ({ icon_gif: '', value: '', label: '' })));
      break;
    case 'final_cta':
      wrap.appendChild(field('Title', section.title, v => section.title = v));
      wrap.appendChild(field('CTA text', section.cta_text, v => section.cta_text = v));
      wrap.appendChild(field('CTA href', section.cta_href, v => section.cta_href = v));
      break;
    default:
      const pre = document.createElement('pre');
      pre.style.cssText = 'font-size:11px;background:#fff;padding:8px;overflow:auto';
      pre.textContent = JSON.stringify(section, null, 2);
      wrap.appendChild(pre);
  }
  return wrap;
}

function updateStatus(s) {
  const el = document.getElementById('editor-status');
  if (!el) return;
  if (s === 'dirty') { el.textContent = 'Cambios sin guardar'; el.className = 'status'; }
  else if (s === 'saved') { el.textContent = 'Guardado ✓'; el.className = 'status success'; }
  else if (s === 'error') { el.textContent = 'Error al guardar'; el.className = 'status error'; }
}

async function saveCurrent() {
  if (!state.slug || !state.data) return;
  try {
    await api.save(state.type, state.slug, state.data);
    state.dirty = false;
    updateStatus('saved');
  } catch (e) {
    updateStatus('error');
    console.error(e);
  }
}

async function runBuild() {
  const s = document.getElementById('build-status');
  s.textContent = 'Building…';
  s.className = 'status';
  try {
    const r = await api.build();
    if (r.ok) { s.textContent = 'Build ✓'; s.className = 'status success'; }
    else { s.textContent = 'Build error'; s.className = 'status error'; console.error(r.stderr); }
  } catch (e) {
    s.textContent = 'Build error'; s.className = 'status error';
    console.error(e);
  }
}

document.getElementById('build-btn').onclick = runBuild;
document.querySelectorAll('.nav-link').forEach(a => {
  a.onclick = (e) => { e.preventDefault(); navigate(a.dataset.type, null); };
});

window.addEventListener('hashchange', () => {
  const { type, slug } = parseHash();
  navigate(type, slug);
});

(async () => {
  await refreshCounts();
  const { type, slug } = parseHash();
  navigate(type, slug);
})();
