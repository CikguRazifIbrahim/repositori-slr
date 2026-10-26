/* Peta Ayat: indeks teks setiap muka surat PDF (pdf.js), simpan dalam Firestore (koleksi "teks")
   dan cache IndexedDB, kemudian cari istilah dan kelompokkan ayat berpola sama berserta sumber. */
export function initPeta(R) {
  const { $, esc, toast, fmtTime } = R;
  const P = { pages: new Map(), loaded: false, lastSync: 0, busy: false, stop: false, hits: [], q: '' };
  const STOP = new Set(('a an the and or but of to in on at for with by from as is are was were be been being this that these those it its their there which who whom whose what when where why how not no nor so than then thus also into onto over under between among through during before after above below such more most less least very can could may might shall should will would do does did done have has had having we our us they them he she his her you your i me my one two three four five six seven eight nine ten first second third per via using used use based both each either neither other others another any all some many much few several only own same too about up down out off again further once here within without however therefore moreover furthermore although though while whereas because since if whether until unless yet et al e.g i.e fig table ' +
    'dan atau tetapi yang untuk dengan dalam pada daripada kepada dari ke di ini itu adalah ialah oleh bagi sebagai akan telah sudah masih juga serta iaitu tidak bukan lebih kurang sangat amat para ia mereka kami kita saya anda beliau dia nya pun lagi hanya sahaja agar supaya kerana sebab jika kalau maka lalu kemudian seperti antara terhadap tentang mengenai secara melalui hingga sehingga setiap semua segala suatu sesuatu beberapa pula boleh dapat perlu harus mesti dapatlah apabila bila ketika semasa sementara manakala walaupun meskipun namun bahawa sama tersebut berkenaan').split(/\s+/));
  const DB_NAME = 'rslr_teks';
  let idbP = null;
  function idb() {
    if (idbP) return idbP;
    idbP = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('IndexedDB tiada')); return; }
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('teks')) d.createObjectStore('teks', { keyPath: 'path' }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'k' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }).catch(e => { idbP = null; throw e; });
    return idbP;
  }
  function tx(store, mode, fn) { return idb().then(d => new Promise((res, rej) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })); }
  async function idbAll() { try { return await tx('teks', 'readonly', s => s.getAll()); } catch (e) { return []; } }
  async function idbPut(rows) { if (!rows.length) return; try { await tx('teks', 'readwrite', s => { rows.forEach(r => s.put(r)); }); } catch (e) {} }
  async function idbDel(paths) { if (!paths.length) return; try { await tx('teks', 'readwrite', s => { paths.forEach(p => s.delete(p)); }); } catch (e) {} }
  async function kvGet(k) { try { const r = await tx('kv', 'readonly', s => s.get(k)); return r ? r.v : null; } catch (e) { return null; } }
  async function kvSet(k, v) { try { await tx('kv', 'readwrite', s => { s.put({ k, v }); }); } catch (e) {} }

  /* ---- text extraction ---- */
  const ABBR = /\b(et al|e\.g|i\.e|Fig|Figs|No|Nos|vs|cf|Dr|Prof|Jr|Sr|St|Mr|Mrs|Ms|Vol|pp|p|ed|eds|approx|Inc|Ltd|Bhd|Sdn|Univ|Dept|Bil|Hlm|m\.s)\./g;
  function pageText(items) {
    let out = '';
    for (const it of items) { if (!it.str) { if (it.hasEOL) out += '\n'; continue; } out += it.str; out += it.hasEOL ? '\n' : (it.str.endsWith(' ') ? '' : ' '); }
    return out.replace(/([A-Za-zÀ-ɏ])-\n\s*([a-zÀ-ɏ])/g, '$1$2').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function sentences(text) {
    const masked = text.replace(ABBR, m => m.replace('.', '\u0001')).replace(/(\d)\.(\d)/g, '$1\u0002$2');
    const parts = masked.split(/(?<=[.!?])\s+(?=[A-ZÀ-Þ"'“‘(\[])/);
    const out = [];
    for (let s of parts) {
      s = s.replace(/\u0001/g, '.').replace(/\u0002/g, '.').trim();
      s = s.replace(/^(?:(?:Page|Muka surat|Halaman|Hlm\.?)\s*\d+|\d{1,4})\s+(?=[A-ZÀ-Þ"“(])/, '').trim();
      if (s.length < 40 || s.length > 700) continue;
      const words = s.split(/\s+/); if (words.length < 6) continue;
      const letters = (s.match(/[A-Za-zÀ-ɏ]/g) || []).length; if (letters / s.length < 0.62) continue;
      const digits = (s.match(/\d/g) || []).length; if (digits / s.length > 0.18) continue;
      if (/https?:\/\/|doi\.org|www\.|@/i.test(s)) continue;
      if (/\(\d{4}[a-z]?\)\.\s/.test(s) && /\b(Journal|Press|Review|Proceedings|Education|Research)\b/.test(s)) continue;
      if (/^(Table|Figure|Fig\.|Jadual|Rajah)\s*\d/i.test(s)) continue;
      out.push(s);
    }
    return out;
  }
  async function bufferOf(entry) {
    if (R.V.cache.has(entry.id)) return R.V.cache.get(entry.id).slice(0);
    const Drive = R.drive(); if (!Drive.hasToken()) { const ok = await R.ensureDrive(true); if (!ok) throw { code: 'no_token' }; }
    const b = await Drive.download(entry.id); R.keepCache(entry.id, b); return b.slice(0);
  }
  async function indexArticle(id, onProgress) {
    const d = R.S.docs.get(id); if (!d) throw new Error('rekod tiada');
    const entry = (d.fail || [])[0]; if (!entry) throw { code: 'no_pdf' };
    const lib = await R.loadPdfJs();
    const buf = await bufferOf(entry);
    const doc = await lib.getDocument({ data: buf, stopAtErrors: false }).promise;
    const rows = []; let total = 0; const t = Date.now();
    try {
      for (let p = 1; p <= doc.numPages; p++) {
        let a = [];
        try { const pg = await doc.getPage(p); const tc = await pg.getTextContent(); a = sentences(pageText(tc.items)); pg.cleanup && pg.cleanup(); } catch (e) {}
        if (a.length) { rows.push({ path: 'teks/' + id + '_' + p, data: { art: id, m: p, a, t } }); total += a.length; }
        if (onProgress) onProgress(p / doc.numPages);
      }
    } finally { try { await doc.destroy(); } catch (e) {} }
    const old = await R.db().teksOf(id).catch(() => []);
    const keep = new Set(rows.map(r => r.path)); const del = old.map(o => o.path).filter(p => !keep.has(p));
    let cloud = true;
    try { if (rows.length) await R.db().batchSet(rows); if (del.length) await R.db().batchDelete(del); }
    catch (e) { if (String(e && e.code || '').includes('permission-denied')) { cloud = false; if (!P.warned) { P.warned = true; toast('Peraturan Firestore belum membenarkan koleksi "teks". Indeks disimpan pada peranti ini sahaja sehingga peraturan dikemas kini (lihat README).', true); } } else throw e; }
    await R.writeNow(id, { indeks: { fail: entry.id, n: doc.numPages, ayat: total, t, awan: cloud } });
    await idbPut(rows.map(r => Object.assign({ path: r.path }, r.data))); await idbDel(del);
    rows.forEach(r => P.pages.set(r.path, Object.assign({ path: r.path }, r.data))); del.forEach(p => P.pages.delete(p));
    return { pages: doc.numPages, ayat: total };
  }
  async function removeArticleText(id) {
    try { const old = await R.db().teksOf(id); if (old.length) await R.db().batchDelete(old.map(o => o.path)); await idbDel(old.map(o => o.path)); old.forEach(o => P.pages.delete(o.path)); } catch (e) {}
  }
  async function ensureLoaded() {
    if (P.loaded) return;
    const all = await idbAll(); all.forEach(r => P.pages.set(r.path, r)); P.lastSync = Number(await kvGet('lastSync')) || 0; P.loaded = true;
  }
  async function sync(quiet) {
    await ensureLoaded();
    try {
      const rows = await R.db().teksSince(P.lastSync);
      if (rows.length) { const flat = rows.map(r => Object.assign({ path: r.path }, r.data)); flat.forEach(r => { P.pages.set(r.path, r); if (r.t > P.lastSync) P.lastSync = r.t; }); await idbPut(flat); await kvSet('lastSync', P.lastSync); }
      // buang muka surat milik artikel yang sudah dipadam
      const gone = []; P.pages.forEach((r, p) => { if (R.S.gotDefinitive && !R.S.docs.has(r.art)) gone.push(p); });
      if (gone.length) { gone.forEach(p => P.pages.delete(p)); await idbDel(gone); }
      if (!quiet) toast(rows.length ? `Indeks disegerakkan: ${rows.length} muka surat baharu` : 'Indeks sudah terkini');
    } catch (e) { if (!quiet) toast('Segerak indeks gagal: ' + (e.message || e.code || ''), true); }
    status();
  }
  function status() {
    const docs = Array.from(R.S.docs.entries()); const withPdf = docs.filter(([id, d]) => (d.fail || []).length);
    const indexed = withPdf.filter(([id, d]) => d.indeks && d.indeks.fail === d.fail[0].id);
    let ayat = 0; P.pages.forEach(r => { ayat += (r.a || []).length; });
    $('#idxStat').textContent = `${indexed.length} daripada ${withPdf.length} PDF diindeks, ${ayat} ayat dalam cache peranti ini${P.lastSync ? ', segerak ' + fmtTime(P.lastSync) : ''}.`;
    const pending = withPdf.length - indexed.length; $('#btnIdxSemua').textContent = P.busy ? 'Henti' : pending ? `Indeks ${pending} PDF yang belum` : 'Semua PDF diindeks';
    $('#btnIdxSemua').disabled = !P.busy && !pending;
  }
  async function indexAll() {
    if (P.busy) { P.stop = true; return; }
    const todo = Array.from(R.S.docs.entries()).filter(([id, d]) => (d.fail || []).length && !(d.indeks && d.indeks.fail === d.fail[0].id)).map(([id]) => id);
    if (!todo.length) return;
    if (!R.drive().hasToken()) { const ok = await R.ensureDrive(true); if (!ok) return; }
    P.busy = true; P.stop = false; status(); const meter = $('#idxMeter'); meter.hidden = false; let done = 0, fail = 0;
    for (const id of todo) {
      if (P.stop) break;
      try { await indexArticle(id, p => { meter.firstElementChild.style.width = Math.round(((done + p) / todo.length) * 100) + '%'; }); } catch (e) { fail++; }
      done++; status();
    }
    P.busy = false; meter.hidden = true; status();
    toast(`Pengindeksan selesai: ${done - fail} berjaya${fail ? ', ' + fail + ' gagal' : ''}${P.stop ? ' (dihentikan)' : ''}`, !!fail);
  }

  /* ---- search and clustering ---- */
  const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function terms(q) { return q.toLowerCase().replace(/["“”]/g, '').split(/[\s,;/]+/).map(t => t.trim()).filter(t => t.length >= 2); }
  function termRx(t) { return new RegExp('(?<![\\w\\u00C0-\\u024F])' + rxEsc(t) + '(?:s|es|an|kan|nya)?(?![\\w\\u00C0-\\u024F])', 'i'); }
  function tokens(s) { return s.toLowerCase().replace(/[^a-zÀ-ɏ0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)).map(w => w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w); }
  function search(q, exact) {
    const ts = terms(q); if (!ts.length) return { ts, hits: [] };
    const phrase = exact ? new RegExp('(?<![\\w\\u00C0-\\u024F])' + rxEsc(q.trim().toLowerCase().replace(/["“”]/g, '')).replace(/\s+/g, '\\s+') + '(?![\\w\\u00C0-\\u024F])', 'i') : null;
    const rxs = ts.map(termRx); const hits = [];
    P.pages.forEach(r => {
      const d = R.S.docs.get(r.art); if (!d) return;
      (r.a || []).forEach((s, k) => { if (phrase ? phrase.test(s) : rxs.every(rx => rx.test(s))) hits.push({ art: r.art, m: r.m, s, k, d }); });
    });
    return { ts, hits };
  }
  function cluster(hits, ts) {
    const qset = new Set(ts.map(t => t.toLowerCase()));
    const sigs = hits.map(h => { const tk = tokens(h.s).filter(w => !qset.has(w) && !ts.some(t => w.startsWith(t) || t.startsWith(w))); return new Set(tk); });
    const order = hits.map((h, i) => i).sort((a, b) => sigs[b].size - sigs[a].size);
    const clusters = [];
    const jacc = (a, b) => { if (!a.size || !b.size) return 0; let inter = 0; a.forEach(x => { if (b.has(x)) inter++; }); return inter / (a.size + b.size - inter); };
    for (const i of order) {
      let best = null, bs = 0;
      for (const c of clusters) { const j = jacc(sigs[i], c.centroid); if (j > bs) { bs = j; best = c; } }
      if (best && bs >= 0.16) { best.idx.push(i); sigs[i].forEach(w => best.freq.set(w, (best.freq.get(w) || 0) + 1)); best.centroid = new Set(Array.from(best.freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18).map(x => x[0])); }
      else { const freq = new Map(); sigs[i].forEach(w => freq.set(w, 1)); clusters.push({ idx: [i], freq, centroid: new Set(sigs[i]) }); }
    }
    // gabungkan kelompok tunggal ke dalam "Lain-lain" jika banyak
    const singles = clusters.filter(c => c.idx.length === 1); const multi = clusters.filter(c => c.idx.length > 1);
    multi.sort((a, b) => b.idx.length - a.idx.length);
    const out = multi.map(c => ({ label: Array.from(c.freq.entries()).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]), idx: c.idx }));
    if (singles.length) out.push({ label: [], idx: singles.flatMap(c => c.idx), lain: true });
    return out;
  }
  function mark(s, ts, exact, q) {
    let html = esc(s);
    const pats = exact ? [new RegExp(rxEsc(esc(q.trim())).replace(/\s+/g, '\\s+'), 'ig')] : ts.map(t => new RegExp('(?<![\\w\\u00C0-\\u024F])(' + rxEsc(esc(t)) + '(?:s|es|an|kan|nya)?)(?![\\w\\u00C0-\\u024F])', 'ig'));
    pats.forEach(rx => { html = html.replace(rx, m => '<mark>' + m + '</mark>'); });
    return html;
  }
  function srcLabel(h) { const d = h.d; return `Bil. ${d.bil || '?'} · ${d.penulis || 'Penulis belum diisi'} (${d.tahun || 't.t.'}) · m.s. ${h.m}`; }
  function citeText(h) { const d = h.d; const who = (d.penulis || 'Penulis').replace(/\s+dan\s+/g, ' dan ').replace(/\s*\(.*$/, ''); return `"${h.s}" (${who}, ${d.tahun || 't.t.'}, m.s. ${h.m})`; }
  function render(q, exact) {
    const { ts, hits } = search(q, exact); P.hits = hits; P.q = q;
    const box = $('#petaHasil'); $('#btnPetaCsv').hidden = !hits.length;
    if (!ts.length) { $('#petaStatus').textContent = 'Taip sekurang-kurangnya satu istilah.'; box.innerHTML = ''; return; }
    if (!hits.length) { $('#petaStatus').textContent = `Tiada ayat mengandungi "${q}" dalam ${P.pages.size} muka surat yang diindeks.`; box.innerHTML = `<div class="empty"><h3>Tiada padanan</h3><p>Cuba istilah lain, ejaan Inggeris atau bentuk tunggal. Pastikan PDF berkaitan telah diindeks.</p></div>`; return; }
    const cl = cluster(hits, ts); const arts = new Set(hits.map(h => h.art));
    $('#petaStatus').textContent = `${hits.length} ayat daripada ${arts.size} artikel, ${cl.filter(c => !c.lain).length} kelompok pola${cl.some(c => c.lain) ? ' dan ayat tunggal' : ''}.`;
    P.clusters = cl;
    box.innerHTML = cl.map((c, ci) => `<section class="cluster"><div class="cluster-head"><h3>${c.lain ? 'Ayat tanpa pola bersama' : 'Kelompok ' + (ci + 1)}</h3><span class="tag"><span>${c.idx.length} ayat</span></span><div class="terms">${c.label.map(w => `<span class="tag r-sed-tinggi"><span>${esc(w)}</span></span>`).join('')}</div></div>${c.idx.map(i => { const h = hits[i]; return `<div class="hit"><div class="ayat">${mark(h.s, ts, exact, q)}</div><div class="src"><span>${esc(srcLabel(h))}</span><button class="btn btn-sm" data-open="${i}">Buka m.s. ${h.m}</button><button class="btn btn-sm" data-copy="${i}">Salin dengan sitasi</button><button class="btn btn-sm" data-rec="${i}">Rekod</button></div></div>`; }).join('')}</section>`).join('');
  }
  function exportCsv() {
    if (!P.hits.length) return;
    const cols = ['Kelompok', 'Pola', 'Ayat', 'Bil.', 'Penulis', 'Tahun', 'Tajuk', 'Muka surat', 'DOI'];
    const cell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows = [cols.join(',')];
    (P.clusters || []).forEach((c, ci) => c.idx.forEach(i => { const h = P.hits[i]; rows.push([c.lain ? 'Tunggal' : 'Kelompok ' + (ci + 1), c.label.join(' '), h.s, h.d.bil, h.d.penulis, h.d.tahun, h.d.tajuk, h.m, h.d.doi].map(cell).join(',')); }));
    R.saveFile(`Peta_Ayat_${P.q.replace(/[^\w]+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
  }
  async function show() { await ensureLoaded(); status(); if (navigator.onLine) sync(true); }

  $('#petaForm').addEventListener('submit', e => { e.preventDefault(); render($('#petaQ').value, $('#petaFrasa').checked); });
  $('#petaFrasa').addEventListener('change', () => { if ($('#petaQ').value.trim()) render($('#petaQ').value, $('#petaFrasa').checked); });
  $('#btnPetaCsv').addEventListener('click', exportCsv);
  $('#btnIdxSemua').addEventListener('click', indexAll);
  $('#btnIdxSync').addEventListener('click', () => sync(false));
  $('#petaHasil').addEventListener('click', async e => {
    const b = e.target.closest('[data-open],[data-copy],[data-rec]'); if (!b) return;
    const h = P.hits[+(b.dataset.open ?? b.dataset.copy ?? b.dataset.rec)]; if (!h) return;
    if (b.dataset.rec !== undefined) { R.openRecord(h.art); return; }
    if (b.dataset.copy !== undefined) { try { await navigator.clipboard.writeText(citeText(h)); toast('Ayat dan sitasi disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
    const d = h.d; const entry = (d.fail || [])[0]; if (!entry) { toast('PDF tiada dalam rekod ini', true); return; }
    R.Flip.open({ title: `Bil. ${d.bil || '?'} ${d.penulis || ''} (${d.tahun || ''})`, sub: d.tajuk || entry.nama, source: { kind: 'drive', id: entry.id }, page: h.m, dl: entry.link || R.drive().link(entry.id), articleId: h.art, fileIdx: 0 });
  });

  return { show, sync, status, indexArticle, indexAll, removeArticleText, render, state: P };
}
