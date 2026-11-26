/* Peta Ayat: indeks teks setiap muka surat PDF (pdf.js), simpan dalam Firestore (koleksi "teks")
   dan cache IndexedDB, kemudian cari istilah dan kelompokkan ayat berpola sama berserta sumber. */
export function initPeta(R) {
  const { $, esc, toast, fmtTime } = R;
  const P = { pages: new Map(), loaded: false, lastSync: 0, busy: false, stop: false, hits: [], q: '', ver: 0, papar: 10 };
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
    rows.forEach(r => P.pages.set(r.path, Object.assign({ path: r.path }, r.data))); del.forEach(p => P.pages.delete(p)); P.ver++;
    return { pages: doc.numPages, ayat: total };
  }
  async function removeArticleText(id) {
    try { const old = await R.db().teksOf(id); if (old.length) await R.db().batchDelete(old.map(o => o.path)); await idbDel(old.map(o => o.path)); old.forEach(o => P.pages.delete(o.path)); P.ver++; } catch (e) {}
  }
  async function ensureLoaded() {
    if (P.loaded) return;
    const all = await idbAll(); all.forEach(r => P.pages.set(r.path, r)); P.ver++; P.lastSync = Number(await kvGet('lastSync')) || 0; P.loaded = true;
  }
  async function sync(quiet) {
    await ensureLoaded();
    try {
      const rows = await R.db().teksSince(P.lastSync);
      if (rows.length) { const flat = rows.map(r => Object.assign({ path: r.path }, r.data)); flat.forEach(r => { P.pages.set(r.path, r); if (r.t > P.lastSync) P.lastSync = r.t; }); await idbPut(flat); await kvSet('lastSync', P.lastSync); P.ver++; }
      // buang muka surat milik artikel yang sudah dipadam
      const gone = []; P.pages.forEach((r, p) => { if (R.S.gotDefinitive && !R.S.docs.has(r.art)) gone.push(p); });
      if (gone.length) { gone.forEach(p => P.pages.delete(p)); await idbDel(gone); P.ver++; }
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
  async function indexAll(senyap) {
    if (P.busy) { if (!senyap) P.stop = true; return; }
    const todo = Array.from(R.S.docs.entries()).filter(([id, d]) => (d.fail || []).length && !(d.indeks && d.indeks.fail === d.fail[0].id)).map(([id]) => id);
    if (!todo.length) return;
    if (!R.drive().hasToken()) { if (senyap) return; const ok = await R.ensureDrive(true); if (!ok) return; }
    P.busy = true; P.stop = false; status(); const meter = $('#idxMeter'); meter.hidden = false; let done = 0, fail = 0;
    for (const id of todo) {
      if (P.stop) break;
      try { await indexArticle(id, p => { meter.firstElementChild.style.width = Math.round(((done + p) / todo.length) * 100) + '%'; }); } catch (e) { fail++; }
      done++; status(); segarHasil();
    }
    P.busy = false; meter.hidden = true; status();
    toast(`Pengindeksan selesai: ${done - fail} berjaya${fail ? ', ' + fail + ' gagal' : ''}${P.stop ? ' (dihentikan)' : ''}`, !!fail);
  }

  /* ---- carian (v1.48.0): kamus ayat ----
     Peta Ayat berfungsi seperti kamus: Prof Dr menaip beberapa patah perkataan, dan sistem memulangkan ayat lengkap daripada PDF repositori
     yang mengandunginya, disusun mengikut kekuatan padanan (frasa tepat, kemudian semua perkataan berdekatan, kemudian semua perkataan),
     sepuluh ayat pada satu masa, setiap satu dengan sitasi sedia salin. Padanan merentas bahasa: "kepimpinan digital" turut menemui
     "digital leadership". Ayat diagihkan merentas artikel supaya sepuluh padanan teratas tidak datang daripada satu atau dua artikel sahaja.
     Jika tiada ayat memuatkan semua perkataan, padanan separa dipaparkan dan ditanda. */
  const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SEMPADAN_A = '(?<![\\w\\u00C0-\\u024F])', SEMPADAN_Z = '(?![\\w\\u00C0-\\u024F])';
  const DWI = [['guru besar', 'headteacher', 'headteachers', 'head teacher', 'head teachers', 'principal', 'principals', 'headmaster', 'headmasters', 'school leader', 'school leaders', 'school head', 'pengetua'], ['sekolah rendah', 'primary school', 'primary schools', 'elementary school', 'elementary schools'], ['sekolah menengah', 'secondary school', 'secondary schools'], ['pembangunan profesional', 'professional development'], ['efikasi kendiri', 'self-efficacy', 'self efficacy'], ['luar bandar', 'rural'], ['dalam talian', 'online'], ['pengajian tinggi', 'higher education'],
    ['kepimpinan', 'leadership'], ['pemimpin', 'leader', 'leaders'], ['pengurusan', 'management'], ['pengetahuan', 'knowledge'], ['kompetensi', 'competence', 'competency', 'competencies', 'competences'], ['guru', 'teacher', 'teachers'], ['sekolah', 'school', 'schools'], ['organisasi', 'organisation', 'organization', 'organisational', 'organizational'], ['perkongsian', 'sharing'], ['teknologi', 'technology', 'technologies', 'technological'], ['pembelajaran', 'learning'], ['pengajaran', 'teaching'], ['kemahiran', 'skill', 'skills'], ['literasi', 'literacy'], ['inovasi', 'innovation', 'innovative'], ['budaya', 'culture'], ['prestasi', 'performance'], ['kerangka', 'framework', 'frameworks'], ['teori', 'theory', 'theories'], ['cabaran', 'challenge', 'challenges', 'barrier', 'barriers'], ['pengantara', 'perantara', 'mediator', 'mediating', 'mediation', 'mediates'], ['hubungan', 'relationship', 'relationships'], ['kesan', 'effect', 'effects', 'impact'], ['pengaruh', 'influence', 'influences'], ['penciptaan', 'creation'], ['pemerolehan', 'acquisition'], ['penyimpanan', 'storage'], ['penggunaan', 'aplikasi', 'application', 'utilisation', 'utilization'], ['latihan', 'training'], ['transformasi', 'transformation', 'transformational'], ['murid', 'pelajar', 'student', 'students', 'pupils'], ['kepuasan', 'satisfaction'], ['komitmen', 'commitment'], ['kesediaan', 'readiness'], ['integrasi', 'integration'], ['dasar', 'policy', 'policies'], ['jurang', 'gap', 'gaps'], ['pendidikan', 'education', 'educational'], ['kolaborasi', 'collaboration', 'collaborative'], ['sokongan', 'support'], ['wawasan', 'visi', 'vision'], ['amalan', 'practice', 'practices'], ['kecekapan', 'efficiency'], ['keberkesanan', 'effectiveness'], ['definisi', 'takrif', 'definition', 'defined'], ['dimensi', 'dimension', 'dimensions'], ['konsep', 'concept', 'concepts'], ['sosialisasi', 'socialisation', 'socialization'], ['eksternalisasi', 'externalisation', 'externalization'], ['kombinasi', 'combination'], ['internalisasi', 'internalisation', 'internalization'], ['tersirat', 'tacit'], ['tersurat', 'eksplisit', 'explicit']];
  const DWI_PETA = new Map(); DWI.forEach(g => g.forEach(w => { if (!DWI_PETA.has(w)) DWI_PETA.set(w, g); }));
  const DWI_FRASA = Array.from(DWI_PETA.keys()).filter(w => w.includes(' ')).sort((a, b) => b.length - a.length);
  const altRx = a => a.split(/[\s-]+/).map(rxEsc).join('[\\s-]+');
  function terms(q) { return q.toLowerCase().replace(/["“”]/g, '').split(/[\s,;/]+/).map(t => t.trim()).filter(t => t.length >= 2); }
  /* Unit carian: setiap unit ialah satu perkataan (atau frasa kamus dwibahasa) berserta padanan bahasa keduanya. */
  function units(q, dwibahasa) {
    let s = ' ' + q.toLowerCase().replace(/["“”]/g, ' ').replace(/[\s,;/]+/g, ' ').trim() + ' '; const out = [];
    if (dwibahasa) DWI_FRASA.forEach(f => { const i = s.indexOf(' ' + f + ' '); if (i >= 0) { out.push({ asal: f, alt: DWI_PETA.get(f), pos: i }); s = s.slice(0, i + 1) + ' '.repeat(f.length) + s.slice(i + 1 + f.length); } });
    const re = /\S+/g; let m; const kata = []; while ((m = re.exec(s))) kata.push({ w: m[0], pos: m.index });
    const isi = kata.filter(k => k.w.length >= 2 && !STOP.has(k.w)); (isi.length || out.length ? isi : kata.filter(k => k.w.length >= 2)).forEach(k => out.push({ asal: k.w, alt: (dwibahasa && DWI_PETA.get(k.w)) || [k.w], pos: k.pos }));
    out.sort((a, b) => a.pos - b.pos);
    out.forEach(u => { const lain = u.alt.filter(a => a !== u.asal); u.rxAsal = new RegExp(SEMPADAN_A + altRx(u.asal) + '(?:s|es|an|kan|nya)?' + SEMPADAN_Z, 'i'); u.rx = lain.length ? new RegExp(SEMPADAN_A + '(?:' + [u.asal].concat(lain).map(altRx).join('|') + ')(?:s|es|an|kan|nya)?' + SEMPADAN_Z, 'i') : u.rxAsal; });
    return out;
  }
  function tokens(s) { return s.toLowerCase().replace(/[^a-zÀ-ɏ0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)).map(w => w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w); }
  const sitasiSah = d => !!(String(d.penulis || '').trim() && String(d.tahun || '').trim());
  function search(q, exact) {
    const ts = terms(q); if (!ts.length) return { ts, us: [], hits: [], separa: false };
    const frasa = new RegExp(SEMPADAN_A + ts.map(rxEsc).join('[\\s-]+') + '(?:s|es|an|kan|nya)?' + SEMPADAN_Z, 'i');
    const us = units(q, !exact); const n = us.length; const penuh = [], separa = []; const minSepara = Math.max(1, Math.ceil(n / 2));
    P.pages.forEach(r => {
      const d = R.S.docs.get(r.art); if (!d) return;
      (r.a || []).forEach((s, k) => {
        const adaFrasa = ts.length > 1 && frasa.test(s); if (exact) { if (ts.length > 1 ? adaFrasa : frasa.test(s)) penuh.push({ art: r.art, m: r.m, s, k, d, skor: 150 + mutu(s, d), jenis: 'frasa' }); return; }
        let kena = 0, asal = 0, lo = Infinity, hi = -1;
        for (const u of us) { const mm = u.rx.exec(s); if (!mm) continue; kena++; if (u.rxAsal.test(s)) asal++; if (mm.index < lo) lo = mm.index; if (mm.index + mm[0].length > hi) hi = mm.index + mm[0].length; }
        if (!kena) return;
        if (kena === n) { const rapat = n > 1 ? Math.max(0, 24 - (hi - lo) / 6) : 0; penuh.push({ art: r.art, m: r.m, s, k, d, skor: (adaFrasa ? 150 : 60) + rapat + asal * 3 + mutu(s, d), jenis: adaFrasa ? 'frasa' : asal === n ? 'semua' : 'dwibahasa' }); }
        else if (n > 1 && kena >= minSepara) separa.push({ art: r.art, m: r.m, s, k, d, skor: 30 * kena / n + asal * 3 + mutu(s, d), jenis: 'separa', kena });
      });
    });
    const guna = penuh.length ? penuh : separa;
    return { ts, us, hits: agih(guna), separa: !penuh.length && separa.length > 0, nSepara: separa.length };
  }
  /* Mutu ayat sebagai bahan petikan: panjang yang sederhana dan rekod yang sudah boleh disitasi didahulukan. */
  function mutu(s, d) { const w = s.split(/\s+/).length; return (w >= 12 && w <= 50 ? 6 : w < 9 ? -6 : 0) + (sitasiSah(d) ? 4 : 0); }
  /* Susunan akhir: skor menurun, dengan denda bagi setiap ayat tambahan daripada artikel yang sama, supaya padanan teratas merentas artikel. */
  function agih(hits) {
    const baki = hits.slice().sort((a, b) => b.skor - a.skor); const kira = new Map(); const out = [];
    const DENDA = 14; let had = Math.min(baki.length, 400);
    while (out.length < had && baki.length) {
      let bi = 0, bs = -Infinity; const lihat = Math.min(baki.length, 200);
      for (let i = 0; i < lihat; i++) { const v = baki[i].skor - DENDA * (kira.get(baki[i].art) || 0); if (v > bs) { bs = v; bi = i; } if (baki[i].skor <= bs) break; }
      const h = baki.splice(bi, 1)[0]; kira.set(h.art, (kira.get(h.art) || 0) + 1); out.push(h);
    }
    return out.concat(baki);
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
    const singles = clusters.filter(c => c.idx.length === 1); const multi = clusters.filter(c => c.idx.length > 1);
    multi.sort((a, b) => b.idx.length - a.idx.length);
    const out = multi.map(c => ({ label: Array.from(c.freq.entries()).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]), idx: c.idx }));
    if (singles.length) out.push({ label: [], idx: singles.flatMap(c => c.idx), lain: true });
    return out;
  }
  function mark(s, us, exact, ts) {
    let html = esc(s);
    const pats = exact ? [new RegExp(SEMPADAN_A + '(' + ts.map(t => rxEsc(esc(t))).join('[\\s-]+') + '(?:s|es|an|kan|nya)?)' + SEMPADAN_Z, 'ig')] : us.map(u => new RegExp(SEMPADAN_A + '((?:' + u.alt.concat([u.asal]).map(a => altRx(esc(a))).join('|') + ')(?:s|es|an|kan|nya)?)' + SEMPADAN_Z, 'ig'));
    pats.forEach(rx => { html = html.replace(rx, m => '<mark>' + m + '</mark>'); });
    return html.replace(/<mark>([^<]*)<mark>([^<]*)<\/mark>([^<]*)<\/mark>/g, '<mark>$1$2$3</mark>');
  }
  const siapa = d => String(d.penulis || '').replace(/\s*\(.*$/, '').trim();
  function sitasi(h) { const d = h.d; return `(${siapa(d) || 'Penulis belum diisi'}, ${String(d.tahun || '').trim() || 't.t.'}, m.s. ${h.m})`; }
  function citeText(h) { return `"${h.s}" ${sitasi(h)}`; }
  const JENIS = { frasa: 'frasa tepat', semua: 'semua perkataan', dwibahasa: 'padanan dwibahasa', separa: 'padanan separa' };
  const HAD_PAPAR = 10;
  function hitHtml(h, i, no, us, exact, ts) {
    const d = h.d; const sah = sitasiSah(d);
    return `<div class="hit"><div class="ayat">${no ? `<span class="hit-no">${no}</span>` : ''}${mark(h.s, us, exact, ts)} <b class="hit-sit${sah ? '' : ' belum'}">${esc(sitasi(h))}</b></div><div class="src"><span class="tag${h.jenis === 'frasa' ? ' r-tinggi' : h.jenis === 'separa' ? ' s-belum' : ''}"><span>${JENIS[h.jenis] || ''}</span></span><span class="hit-tajuk" title="${esc(d.tajuk || '')}">Bil. ${esc(d.bil || '?')} · ${esc(d.tajuk || 'Tajuk belum diisi')}</span><button class="btn btn-sm btn-primary" data-copy="${i}">Salin ayat dan sitasi</button><button class="btn btn-sm" data-open="${i}">Buka m.s. ${h.m}</button><button class="btn btn-sm" data-rec="${i}">${sah ? 'Rekod' : 'Lengkapkan Penulis dan Tahun'}</button></div></div>`;
  }
  function render(q, exact) {
    const hasil = search(q, exact); const { ts, us, hits } = hasil; P.hits = hits; P.q = q; P.us = us; P.exact = !!exact; P.ts = ts; P.papar = HAD_PAPAR; P.separa = hasil.separa;
    const box = $('#petaHasil'); $('#btnPetaCsv').hidden = !hits.length;
    if (!ts.length) { $('#petaStatus').textContent = 'Taip sekurang-kurangnya satu perkataan.'; box.innerHTML = ''; return; }
    if (!hits.length) {
      const b = belumIndeks(); $('#petaStatus').textContent = `Tiada ayat mengandungi "${q}" dalam ${P.pages.size} muka surat yang diindeks.`;
      box.innerHTML = `<div class="empty"><h3>Tiada padanan</h3><p>${b.belum ? `Hanya ${b.sudah} daripada ${b.jumlah} PDF sudah diindeks, maka ${b.belum} artikel belum boleh dicari. ${P.busy ? 'Pengindeksan sedang berjalan; hasil dikemas kini secara automatik.' : 'Klik butang di bawah untuk mengindeks bakinya.'}` : 'Semua PDF sudah diindeks. Cuba perkataan lain, ejaan Inggeris, atau matikan Frasa tepat.'}</p>${b.belum && !P.busy ? '<button class="btn btn-primary" data-idx="semua" style="margin-top:12px">Indeks PDF yang belum</button>' : ''}</div>`; return;
    }
    paparHasil();
  }
  function paparHasil() {
    const box = $('#petaHasil'); const hits = P.hits; if (!hits.length) return; const arts = new Set(hits.map(h => h.art)); const b = belumIndeks();
    const pola = ($('#petaSusun') || {}).value === 'pola';
    const nota = (P.separa ? ' Tiada ayat memuatkan semua perkataan; yang dipaparkan ialah padanan separa.' : '') + (b.belum ? ` ${b.belum} PDF belum diindeks dan belum dicari.` : '');
    if (pola) {
      const cl = cluster(hits, P.ts); P.clusters = cl;
      $('#petaStatus').textContent = `${hits.length} ayat daripada ${arts.size} artikel, ${cl.filter(c => !c.lain).length} kelompok pola${cl.some(c => c.lain) ? ' dan ayat tunggal' : ''}.` + nota;
      box.innerHTML = cl.map((c, ci) => `<section class="cluster"><div class="cluster-head"><h3>${c.lain ? 'Ayat tanpa pola bersama' : 'Kelompok ' + (ci + 1)}</h3><span class="tag"><span>${c.idx.length} ayat</span></span><div class="terms">${c.label.map(w => `<span class="tag r-sed-tinggi"><span>${esc(w)}</span></span>`).join('')}</div></div>${c.idx.map(i => hitHtml(hits[i], i, 0, P.us, P.exact, P.ts)).join('')}</section>`).join('');
      return;
    }
    P.clusters = null; const n = Math.min(P.papar, hits.length); const artsPapar = new Set(hits.slice(0, n).map(h => h.art));
    $('#petaStatus').textContent = `${n} padanan terbaik daripada ${hits.length} ayat (${arts.size} artikel); yang dipaparkan datang daripada ${artsPapar.size} artikel.` + nota;
    box.innerHTML = `<section class="cluster"><div class="cluster-head"><h3>${n} padanan teratas bagi "${esc(P.q)}"</h3><span class="tag"><span>${hits.length} ayat ditemui</span></span><span class="spacer"></span><button class="btn btn-sm" data-salin-semua="1" title="Salin semua ayat yang dipaparkan berserta sitasinya">Salin ${n} ayat ini</button></div>${hits.slice(0, n).map((h, i) => hitHtml(h, i, i + 1, P.us, P.exact, P.ts)).join('')}${n < hits.length ? `<div class="hit hit-lagi"><button class="btn" data-lagi="1">Tunjuk ${Math.min(HAD_PAPAR, hits.length - n)} padanan lagi</button><span class="help">${hits.length - n} ayat lagi</span></div>` : ''}</section>`;
  }
  function belumIndeks() { const withPdf = Array.from(R.S.docs.values()).filter(d => (d.fail || []).length); const sudah = withPdf.filter(d => d.indeks && d.indeks.fail === d.fail[0].id).length; return { jumlah: withPdf.length, sudah, belum: withPdf.length - sudah }; }
  function exportCsv() {
    if (!P.hits.length) return;
    const cols = ['Kedudukan', 'Jenis padanan', 'Ayat', 'Sitasi', 'Bil.', 'Penulis', 'Tahun', 'Tajuk', 'Muka surat', 'DOI'];
    const cell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows = [cols.join(',')];
    P.hits.forEach((h, i) => rows.push([i + 1, JENIS[h.jenis] || '', h.s, sitasi(h), h.d.bil, h.d.penulis, h.d.tahun, h.d.tajuk, h.m, h.d.doi].map(cell).join(',')));
    R.saveFile(`Peta_Ayat_${P.q.replace(/[^\w]+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
  }

  /* ---- carian berpemberat bagi modul lain (Ramal ayat): indeks songsang ayat PDF mengikut penoken pemanggil, skor idf dan agihan merentas
     artikel. q ialah senarai [token, berat]; boleh(art) menapis artikel; perArtikel mengehadkan ayat bagi satu artikel. ---- */
  const IX = { ver: -1, tok: null, map: null, ayat: null };
  function indeksKata(tok) {
    if (IX.map && IX.ver === P.ver && IX.tok === tok) return IX;
    const map = new Map(); const ayat = [];
    P.pages.forEach(r => (r.a || []).forEach(s => { const i = ayat.length; const set = new Set(tok(s)); ayat.push({ art: r.art, m: r.m, s, n: set.size }); set.forEach(w => { let a = map.get(w); if (!a) map.set(w, a = []); a.push(i); }); }));
    IX.ver = P.ver; IX.tok = tok; IX.map = map; IX.ayat = ayat; return IX;
  }
  function cariAyat(o) {
    const ix = indeksKata(o.tok); const N = ix.ayat.length; if (!N) return [];
    const q = new Map(); (o.q || []).forEach(([w, b]) => q.set(w, Math.max(q.get(w) || 0, b)));
    const skor = new Map(); const kena = new Map();
    q.forEach((berat, w) => { const senarai = ix.map.get(w); if (!senarai) return; const idf = Math.log(1 + (N - senarai.length + 0.5) / (senarai.length + 0.5)); senarai.forEach(i => { skor.set(i, (skor.get(i) || 0) + berat * idf); kena.set(i, (kena.get(i) || 0) + 1); }); });
    const calon = []; skor.forEach((s, i) => { const a = ix.ayat[i]; if ((kena.get(i) || 0) < (o.minKena || 2)) return; if (o.boleh && !o.boleh(a.art)) return; const w = a.s.split(/\s+/).length; if (w < 10 || w > 70) return; calon.push({ art: a.art, m: a.m, s: a.s, skor: s / Math.sqrt(8 + a.n) + (o.galak && o.galak(a.art) ? o.galakNilai || 0 : 0) }); });
    calon.sort((x, y) => y.skor - x.skor); const per = o.perArtikel || 2; const kira = new Map(); const out = [];
    for (const c of calon) { const k = kira.get(c.art) || 0; if (k >= per) continue; kira.set(c.art, k + 1); out.push(c); if (out.length >= (o.had || 20)) break; }
    return out;
  }

  async function show() {
    await ensureLoaded(); status(); if (navigator.onLine) await sync(true);
    /* indeks automatik: PDF yang belum diindeks terus diindeks apabila Drive sudah disambung, tanpa perlu menekan butang */
    const b = belumIndeks(); if (b.belum && !P.busy && navigator.onLine && R.drive().hasToken()) indexAll(true);
  }
  let tSegar = null;
  function segarHasil() { clearTimeout(tSegar); tSegar = setTimeout(() => { if (R.S.view === 'peta' && P.q && $('#petaQ').value.trim() === P.q.trim()) { const lama = P.papar; const y = window.scrollY; render(P.q, P.exact); if (P.hits.length) { P.papar = Math.max(lama || HAD_PAPAR, HAD_PAPAR); paparHasil(); window.scrollTo(0, y); } } }, 600); }

  $('#petaForm').addEventListener('submit', e => { e.preventDefault(); render($('#petaQ').value, $('#petaFrasa').checked); });
  $('#petaFrasa').addEventListener('change', () => { if ($('#petaQ').value.trim()) render($('#petaQ').value, $('#petaFrasa').checked); });
  if ($('#petaSusun')) $('#petaSusun').addEventListener('change', () => { if (P.hits.length) paparHasil(); });
  $('#btnPetaCsv').addEventListener('click', exportCsv);
  $('#btnIdxSemua').addEventListener('click', () => indexAll(false));
  $('#btnIdxSync').addEventListener('click', () => sync(false));
  $('#petaHasil').addEventListener('click', async e => {
    if (e.target.closest('[data-idx]')) { indexAll(false); return; }
    if (e.target.closest('[data-lagi]')) { P.papar += HAD_PAPAR; const y = window.scrollY; paparHasil(); window.scrollTo(0, y); return; }
    if (e.target.closest('[data-salin-semua]')) { const n = Math.min(P.papar, P.hits.length); try { await navigator.clipboard.writeText(P.hits.slice(0, n).map((h, i) => (i + 1) + '. ' + citeText(h)).join('\n\n')); toast(n + ' ayat dan sitasinya disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
    const b = e.target.closest('[data-open],[data-copy],[data-rec]'); if (!b) return;
    const h = P.hits[+(b.dataset.open ?? b.dataset.copy ?? b.dataset.rec)]; if (!h) return;
    if (b.dataset.rec !== undefined) { R.openRecord(h.art); return; }
    if (b.dataset.copy !== undefined) { try { await navigator.clipboard.writeText(citeText(h)); toast('Ayat dan sitasi disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
    const d = h.d; const entry = (d.fail || [])[0]; if (!entry) { toast('PDF tiada dalam rekod ini', true); return; }
    R.Flip.open({ title: `Bil. ${d.bil || '?'} ${d.penulis || ''} (${d.tahun || ''})`, sub: d.tajuk || entry.nama, source: { kind: 'drive', id: entry.id }, page: h.m, dl: entry.link || R.drive().link(entry.id), articleId: h.art, fileIdx: 0 });
  });

  return { show, sync, status, indexArticle, indexAll, removeArticleText, render, ensureLoaded, tokens, cariAyat, search, state: P };
}
