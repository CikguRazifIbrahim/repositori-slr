/* Web Artikel ("spider-web"): rajah jaringan bibliometrik tempatan. Nod = artikel dalam repositori dan
   cadangan harian; tiada carian baharu. Hubungan dikira daripada data yang sedia ada:
   rantaian/petikan terus (senarai rujukan OpenAlex), gandingan bibliografi (rujukan sepunya),
   persamaan teks (TF-IDF kosinus tajuk, abstrak, medan ekstrak dan ayat terindeks), penulis, tema, jurnal. */
export function initWeb(R) {
  const { $, esc, toast, TEMA } = R;
  const W = { nodes: [], byKey: new Map(), centre: null, scale: 1, tx: 0, ty: 0, drag: null, shown: [], hidden: 0 };
  const el = $('#web'), svg = $('#webSvg'), side = $('#webSide'), ttl = $('#webTitle');
  const temaClass = t => t === TEMA[0] ? 'kd' : t === TEMA[1] ? 'ppo' : t === TEMA[2] ? 'kdg' : 'lain';
  const temaShort = t => t === TEMA[0] ? 'KD' : t === TEMA[1] ? 'PPO' : t === TEMA[2] ? 'KDG' : t ? 'Lain' : '';
  const minYear = () => new Date().getFullYear() - 4;
  const surname = s => { const t = String(s || '').replace(/\s+et\s+al\.?.*$/i, '').replace(/\s+(dan|and|&)\s+.*$/i, '').replace(/[,;(].*$/, '').trim().split(/\s+/); return t[t.length - 1] || ''; };
  const penulisRingkas = list => { const s = (list || []).map(x => String(x).split(' ').pop()); if (!s.length) return 'Tanpa penulis'; if (s.length === 1) return s[0]; if (s.length === 2) return s[0] + ' dan ' + s[1]; return s[0] + ' et al.'; };

  /* ---- bina nod daripada repositori dan sejarah cadangan ---- */
  async function build() {
    const nodes = []; const byDoi = new Map(); const byKey = new Map();
    try { await R.Peta.ensureLoaded(); } catch (e) {}
    const pages = R.Peta.state.pages;
    const teksRekod = new Map(); pages.forEach(p => { if (!teksRekod.has(p.art)) teksRekod.set(p.art, []); const a = teksRekod.get(p.art); if (a.length < 80) (p.a || []).slice(0, 12).forEach(s => a.push(s)); });
    R.S.docs.forEach((d, id) => {
      const doi = R.normDoi(d.doi);
      const n = { key: 'r:' + id, id, doi, tajuk: d.tajuk || '', penulisLabel: d.penulis || '', tahun: parseInt(d.tahun, 10) || 0, tema: d.tema || '', jurnal: '', rujukan: d.rujukan || '', inRepo: true, bil: d.bil, refs: new Set(), oaId: '', kelas: 0,
        teks: [d.tajuk, d.objektif, d.konstruk, d.definisi, d.teori, d.dapatan, d.implikasi, d.jurang, d.subtopik, d.catatan, d.bandingan].filter(Boolean).join(' ') + ' ' + (teksRekod.get(id) || []).join(' ') };
      nodes.push(n); byKey.set(n.key, n); if (doi) byDoi.set(doi, n);
    });
    const sejarah = R.Harian.state.sejarah || new Map();
    const dates = Array.from(sejarah.keys()).sort();
    dates.forEach(d => (sejarah.get(d).items || []).forEach(it => {
      if (it.kosong || !it.doi) return;
      const doi = R.normDoi(it.doi); let n = byDoi.get(doi) || (it.artikelId && byKey.get('r:' + it.artikelId));
      const refs = new Set((it.refs || []).map(x => String(x).replace(/^https?:\/\/openalex\.org\//, '')));
      if (n) { n.pick = it; n.tarikh = d; n.oaId = it.oaId || n.oaId; refs.forEach(x => n.refs.add(x)); n.kelas = it.kelas || n.kelas; n.jurnal = it.jurnal || n.jurnal; n.teks += ' ' + (it.abstrak || ''); if (!n.rujukan) n.rujukan = it.rujukan || ''; n.rantai = it.rantai; if (!n.tahun) n.tahun = parseInt(it.tahun, 10) || 0; if (!n.tema) n.tema = it.tema; return; }
      n = { key: 'p:' + doi, id: null, doi, tajuk: it.tajuk || '', penulisLabel: penulisRingkas(it.penulis), tahun: parseInt(it.tahun, 10) || 0, tema: it.tema || '', jurnal: it.jurnal || '', rujukan: it.rujukan || '', inRepo: false, pick: it, tarikh: d, refs, oaId: it.oaId || '', kelas: it.kelas || 0, rantai: it.rantai, teks: (it.tajuk || '') + ' ' + (it.abstrak || '') };
      nodes.push(n); byKey.set(n.key, n); byDoi.set(doi, n);
    }));
    // julat tahun yang dibenarkan: tahun semasa tolak empat hingga tahun semasa; rekod tanpa tahun dikekalkan tetapi ditanda
    const y0 = minYear(), y1 = new Date().getFullYear();
    W.nodes = nodes.filter(n => !n.tahun || (n.tahun >= y0 && n.tahun <= y1)); W.byKey = new Map(W.nodes.map(n => [n.key, n]));
    W.byDoi = new Map(); W.nodes.forEach(n => { if (n.doi) W.byDoi.set(n.doi, n); if (n.oaId) W.byDoi.set('oa:' + n.oaId, n); });
    tfidf();
  }
  function tfidf() {
    const docs = W.nodes.map(n => R.Peta.tokens(n.teks || '')); const df = new Map(); const N = docs.length || 1;
    docs.forEach(tk => new Set(tk).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    W.nodes.forEach((n, i) => {
      const tf = new Map(); docs[i].forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
      const v = new Map(); let norm = 0;
      tf.forEach((c, t) => { const w = (1 + Math.log(c)) * Math.log(1 + N / (df.get(t) || 1)); v.set(t, w); norm += w * w; });
      n.vec = v; n.norm = Math.sqrt(norm) || 1;
    });
  }
  function cosine(a, b) { if (!a.vec || !b.vec) return 0; let s = 0; const [x, y] = a.vec.size < b.vec.size ? [a, b] : [b, a]; x.vec.forEach((w, t) => { const w2 = y.vec.get(t); if (w2) s += w * w2; }); return s / (a.norm * b.norm); }
  /* ---- hubungan antara dua nod ---- */
  function relate(a, b) {
    const parts = []; let w = 0;
    const cites = (x, y) => y.oaId && x.refs.has(y.oaId);
    const rantai = (x, y) => x.rantai && x.rantai.dari && !x.rantai.baharu && y.doi && R.normDoi(x.rantai.dari.doi) === y.doi;
    if (rantai(a, b) || rantai(b, a)) { parts.push({ j: 'Rantaian langsung (artikel ' + (rantai(a, b) ? 'ini diambil daripada senarai Rujukan artikel pusat' : 'pusat diambil daripada senarai Rujukan artikel ini') + ')', w: 1 }); w += 1; }
    else if (cites(a, b)) { parts.push({ j: 'Artikel pusat merujuk artikel ini', w: 1 }); w += 1; }
    else if (cites(b, a)) { parts.push({ j: 'Artikel ini merujuk artikel pusat', w: 1 }); w += 1; }
    if (a.refs.size && b.refs.size) { let sh = 0; a.refs.forEach(x => { if (b.refs.has(x)) sh++; }); if (sh) { const c = sh / Math.sqrt(a.refs.size * b.refs.size); const ww = Math.min(1, c * 3); parts.push({ j: `Gandingan bibliografi: ${sh} rujukan sepunya`, w: ww }); w += 0.8 * ww; } }
    const cs = cosine(a, b); if (cs >= 0.04) { parts.push({ j: `Persamaan teks (TF-IDF): ${Math.round(cs * 100)}%`, w: cs }); w += 0.9 * Math.min(1, cs * 1.6); }
    const sa = surname(a.penulisLabel), sb = surname(b.penulisLabel); if (sa && sb && sa.toLowerCase() === sb.toLowerCase()) { parts.push({ j: 'Penulis pertama sama', w: 0.3 }); w += 0.25; }
    if (a.tema && a.tema === b.tema) { parts.push({ j: 'Tema sama (' + temaShort(a.tema) + ')', w: 0.15 }); w += 0.1; }
    if (a.jurnal && a.jurnal === b.jurnal) { parts.push({ j: 'Jurnal sama', w: 0.1 }); w += 0.1; }
    return { w: Math.min(1, w), parts };
  }
  /* ---- susun atur jejaring (gelang mengikut kekuatan) ---- */
  function layout(centre) {
    const rel = W.nodes.filter(n => n !== centre).map(n => ({ n, r: relate(centre, n) })).filter(x => x.r.w >= 0.06).sort((a, b) => b.r.w - a.r.w);
    const shown = rel.slice(0, 28); W.hidden = rel.length - shown.length;
    const ring = x => x.r.w >= 0.6 ? 1 : x.r.w >= 0.3 ? 2 : 3;
    const groups = { 1: [], 2: [], 3: [] }; shown.forEach(x => groups[ring(x)].push(x));
    const RAD = { 1: 165, 2: 285, 3: 400 };
    Object.keys(groups).forEach(k => { const g = groups[k]; const n = g.length; g.forEach((x, i) => { const ang = -Math.PI / 2 + (2 * Math.PI * i) / n + (k % 2 ? 0 : Math.PI / n); x.x = Math.cos(ang) * RAD[k]; x.y = Math.sin(ang) * RAD[k]; x.ring = +k; }); });
    // hubungan silang antara jiran (jaringan sarang labah-labah)
    const cross = [];
    for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) { const r = relate(shown[i].n, shown[j].n); if (r.w >= 0.3) cross.push({ a: shown[i], b: shown[j], w: r.w }); }
    W.shown = shown; W.cross = cross; return { shown, cross };
  }
  function label(n) { const s = surname(n.penulisLabel) || 'Tanpa penulis'; return s + (n.tahun ? ' (' + n.tahun + ')' : ' (t.t.)'); }
  function draw() {
    const c = W.centre; const { shown, cross } = layout(c);
    const g = []; const col = t => `var(--${temaClass(t)})`;
    cross.forEach(e => g.push(`<line x1="${e.a.x.toFixed(1)}" y1="${e.a.y.toFixed(1)}" x2="${e.b.x.toFixed(1)}" y2="${e.b.y.toFixed(1)}" stroke="var(--muted)" stroke-width="${(0.6 + e.w * 1.6).toFixed(2)}" stroke-opacity="${(0.08 + e.w * 0.25).toFixed(2)}" stroke-dasharray="4 4"/>`));
    shown.forEach(x => g.push(`<line class="edge" data-key="${esc(x.n.key)}" x1="0" y1="0" x2="${x.x.toFixed(1)}" y2="${x.y.toFixed(1)}" stroke="${x.r.w >= 0.6 ? 'var(--accent)' : 'var(--muted)'}" stroke-width="${(1 + x.r.w * 7).toFixed(2)}" stroke-opacity="${(0.18 + x.r.w * 0.82).toFixed(2)}" stroke-linecap="round"/>`));
    [1, 2, 3].forEach(k => g.push(`<circle cx="0" cy="0" r="${{ 1: 165, 2: 285, 3: 400 }[k]}" fill="none" stroke="var(--line)" stroke-dasharray="3 6" stroke-opacity=".9"/>`));
    shown.forEach(x => {
      const n = x.n; const r = 15 + x.r.w * 8;
      g.push(`<g class="node" data-key="${esc(n.key)}" transform="translate(${x.x.toFixed(1)},${x.y.toFixed(1)})" tabindex="0"><circle r="${r.toFixed(1)}" fill="${n.inRepo ? col(n.tema) : 'var(--surface)'}" stroke="${col(n.tema)}" stroke-width="${n.inRepo ? 2 : 3}" ${n.tahun ? '' : 'stroke-dasharray="4 3"'}/><text class="lbl" y="${(r + 15).toFixed(1)}" text-anchor="middle">${esc(label(n))}</text><text class="pct" text-anchor="middle" dy="4" fill="${n.inRepo ? '#fff' : col(n.tema)}">${Math.round(x.r.w * 100)}</text></g>`);
    });
    g.push(`<g class="node centre" data-key="${esc(c.key)}" tabindex="0"><circle r="34" fill="${col(c.tema)}" stroke="var(--fg)" stroke-width="3"/><text class="lbl big" y="54" text-anchor="middle">${esc(label(c))}</text><text class="pct" text-anchor="middle" dy="5" fill="#fff" font-size="13">${esc(temaShort(c.tema) || 'Pusat')}</text></g>`);
    svg.innerHTML = `<g id="webRoot" transform="translate(${W.tx},${W.ty}) scale(${W.scale})">${g.join('')}</g>`;
    ttl.innerHTML = `<b>${esc(c.tajuk || 'Tanpa tajuk')}</b><small>${esc(c.rujukan || (c.penulisLabel + ' (' + (c.tahun || 't.t.') + ')'))}</small>`;
    renderSide(shown);
    fit();
  }
  function fit() { const box = svg.getBoundingClientRect(); const need = 2 * 400 + 140; const s = Math.min(1.6, Math.max(0.35, Math.min(box.width, box.height) / need)); W.scale = s; W.tx = box.width / 2; W.ty = box.height / 2; applyT(); }
  function applyT() { const r = $('#webRoot'); if (r) r.setAttribute('transform', `translate(${W.tx},${W.ty}) scale(${W.scale})`); }
  function renderSide(shown) {
    const c = W.centre;
    const head = `<div class="web-centre"><span class="tag tema ${temaClass(c.tema)}"><span>${esc(c.tema || 'Tiada tema')}</span></span> ${c.inRepo ? `<span class="tag s-selesai"><span>Dalam repositori, Bil. ${esc(c.bil || '?')}</span></span>` : '<span class="tag"><span>Cadangan harian, belum dalam repositori</span></span>'}${c.tarikh ? `<span class="tag"><span>Dicadangkan ${esc(c.tarikh)}</span></span>` : ''}<div class="acts">${c.inRepo ? `<button class="btn btn-sm" data-webrek="${esc(c.id)}">Buka rekod</button>` : ''}${c.doi ? `<a class="btn btn-sm" href="https://doi.org/${esc(c.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}</div></div>`;
    const list = shown.length ? shown.map(x => `<div class="web-item" data-key="${esc(x.n.key)}"><div class="w"><span class="bar"><span style="width:${Math.round(x.r.w * 100)}%"></span></span><b>${Math.round(x.r.w * 100)}%</b></div><div class="t">${esc(x.n.rujukan || (x.n.penulisLabel + ' (' + (x.n.tahun || 't.t.') + '). ' + x.n.tajuk))}</div><div class="j">${x.r.parts.map(p => esc(p.j)).join(' · ')}</div><div class="acts"><button class="btn btn-sm btn-primary" data-webgo="${esc(x.n.key)}">Jadikan pusat</button>${x.n.inRepo ? `<button class="btn btn-sm" data-webrek="${esc(x.n.id)}">Rekod</button>` : ''}${x.n.doi ? `<a class="btn btn-sm" href="https://doi.org/${esc(x.n.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}</div></div>`).join('') : `<div class="help">Tiada artikel lain yang berkaitan dalam julat tahun ${minYear()} hingga ${new Date().getFullYear()}. Hubungan akan muncul apabila lebih banyak artikel dicadangkan atau diindeks (Peta Ayat).</div>`;
    side.innerHTML = head + `<h3>Artikel berkaitan (${shown.length}${W.hidden ? ', ' + W.hidden + ' lagi di bawah ambang' : ''})</h3>` + list;
  }
  async function open(key) {
    await build();
    let c = W.byKey.get(key);
    if (!c && key.startsWith('p:')) { const doi = key.slice(2); c = W.byDoi.get(doi); }
    if (!c) { toast('Artikel ini di luar julat tahun yang dibenarkan atau tiada dalam data.', true); return; }
    W.centre = c; el.hidden = false; document.body.classList.add('web-open'); draw();
    $('#webLegend').innerHTML = `<span><i class="sw solid"></i>Garisan tebal dan pekat = hubungan kuat; nipis dan pudar = lemah</span><span><i class="sw ring"></i>Gelang: kuat (≥ 60), sederhana (30 hingga 59), lemah</span><span><i class="dot full"></i>Dalam repositori</span><span><i class="dot hollow"></i>Cadangan belum disimpan</span><span><i class="dot dash"></i>Tahun tidak diisi</span><span>Warna: ${TEMA.slice(0, 3).map(t => `<i class="dot full" style="background:var(--${temaClass(t)});border-color:var(--${temaClass(t)})"></i>${esc(temaShort(t))}`).join(' ')}</span><span>Julat tahun ${minYear()} hingga ${new Date().getFullYear()}; nod = ${W.nodes.length} artikel (repositori dan cadangan harian)</span>`;
  }
  function close() { el.hidden = true; document.body.classList.remove('web-open'); svg.innerHTML = ''; }
  function recentre(key) { const n = W.byKey.get(key); if (!n) return; W.centre = n; draw(); }
  function exportPng() {
    try {
      const c = W.centre; const box = svg.getBoundingClientRect(); const S = 2;
      const css = getComputedStyle(document.documentElement); const bg = css.getPropertyValue('--surface').trim() || '#fff';
      const inner = svg.innerHTML.replace(/var\(--([a-z0-9-]+)\)/g, (m, v) => css.getPropertyValue('--' + v).trim() || '#888');
      const fg = css.getPropertyValue('--fg').trim() || '#1A2230';
      const src = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(box.width)}" height="${Math.round(box.height)}"><style>text{font-family:'Source Sans 3','Segoe UI',system-ui,sans-serif}.lbl{font-size:12px;fill:${fg};paint-order:stroke;stroke:${bg};stroke-width:3px;stroke-linejoin:round}.lbl.big{font-size:14px;font-weight:700}.pct{font-size:11px;font-weight:700}</style><rect width="100%" height="100%" fill="${bg}"/>${inner}</svg>`;
      const img = new Image(); const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => { const cv = document.createElement('canvas'); cv.width = Math.round(box.width * S); cv.height = Math.round(box.height * S); const ctx = cv.getContext('2d'); ctx.scale(S, S); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); cv.toBlob(b => { if (!b) { toast('Eksport PNG gagal', true); return; } R.saveFile('Web_Artikel_' + (surname(c.penulisLabel) || 'artikel') + '_' + (c.tahun || '') + '.png', b, 'image/png'); toast('Rajah disimpan sebagai PNG'); }, 'image/png'); };
      img.onerror = () => { URL.revokeObjectURL(url); toast('Eksport PNG gagal dalam pelayar ini', true); };
      img.src = url;
    } catch (e) { toast('Eksport PNG gagal', true); }
  }
  // interaksi: klik nod, hover, zum, seret
  svg.addEventListener('click', e => { const n = e.target.closest('.node'); if (!n || n.classList.contains('centre')) return; const item = side.querySelector(`.web-item[data-key="${CSS.escape(n.dataset.key)}"]`); if (item) { side.querySelectorAll('.web-item.on').forEach(x => x.classList.remove('on')); item.classList.add('on'); item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } });
  svg.addEventListener('dblclick', e => { const n = e.target.closest('.node'); if (n && !n.classList.contains('centre')) recentre(n.dataset.key); });
  svg.addEventListener('keydown', e => { const n = e.target.closest('.node'); if (n && e.key === 'Enter') recentre(n.dataset.key); });
  svg.addEventListener('mouseover', e => { const n = e.target.closest('.node'); svg.querySelectorAll('.edge.hi').forEach(x => x.classList.remove('hi')); if (n) { const ed = svg.querySelector(`.edge[data-key="${CSS.escape(n.dataset.key)}"]`); if (ed) ed.classList.add('hi'); } });
  svg.addEventListener('wheel', e => { e.preventDefault(); const f = e.deltaY < 0 ? 1.12 : 1 / 1.12; const box = svg.getBoundingClientRect(); const mx = e.clientX - box.left, my = e.clientY - box.top; W.tx = mx - (mx - W.tx) * f; W.ty = my - (my - W.ty) * f; W.scale = Math.min(4, Math.max(0.2, W.scale * f)); applyT(); }, { passive: false });
  svg.addEventListener('mousedown', e => { if (e.target.closest('.node')) return; W.drag = { x: e.clientX, y: e.clientY, tx: W.tx, ty: W.ty }; svg.classList.add('grab'); });
  window.addEventListener('mousemove', e => { if (!W.drag) return; W.tx = W.drag.tx + (e.clientX - W.drag.x); W.ty = W.drag.ty + (e.clientY - W.drag.y); applyT(); });
  window.addEventListener('mouseup', () => { W.drag = null; svg.classList.remove('grab'); });
  let pinch = null;
  svg.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), s: W.scale }; else if (e.touches.length === 1 && !e.target.closest('.node')) W.drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: W.tx, ty: W.ty }; }, { passive: true });
  svg.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); W.scale = Math.min(4, Math.max(0.2, pinch.s * d / pinch.d)); applyT(); } else if (W.drag && e.touches.length === 1) { W.tx = W.drag.tx + (e.touches[0].clientX - W.drag.x); W.ty = W.drag.ty + (e.touches[0].clientY - W.drag.y); applyT(); } }, { passive: false });
  svg.addEventListener('touchend', () => { pinch = null; W.drag = null; }, { passive: true });
  side.addEventListener('click', e => { const g = e.target.closest('[data-webgo]'); if (g) { recentre(g.dataset.webgo); return; } const r = e.target.closest('[data-webrek]'); if (r) { close(); R.openRecord(r.dataset.webrek); } });
  side.addEventListener('mouseover', e => { const it = e.target.closest('.web-item'); svg.querySelectorAll('.edge.hi').forEach(x => x.classList.remove('hi')); if (it) { const ed = svg.querySelector(`.edge[data-key="${CSS.escape(it.dataset.key)}"]`); if (ed) ed.classList.add('hi'); } });
  $('#webClose').addEventListener('click', close);
  $('#webZoomIn').addEventListener('click', () => { W.scale = Math.min(4, W.scale * 1.2); applyT(); });
  $('#webZoomOut').addEventListener('click', () => { W.scale = Math.max(0.2, W.scale / 1.2); applyT(); });
  $('#webFit').addEventListener('click', fit);
  $('#webPng').addEventListener('click', exportPng);
  el.addEventListener('click', e => { if (e.target === el) close(); });
  document.addEventListener('keydown', e => { if (!el.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);
  window.addEventListener('resize', () => { if (!el.hidden && W.centre) fit(); });
  return { open, close, recentre, relate, build, state: W };
}
