/* Cadangan Harian: tiga artikel sehari, satu bagi setiap pemboleh ubah, daripada OpenAlex.
   Menggantikan tugas berjadual "Sorotan literatur harian" yang dahulunya berjalan di luar aplikasi. */
export function initHarian(R) {
  const { $, esc, toast, TEMA } = R;
  const OA = 'https://api.openalex.org/works';
  const TEMA3 = [TEMA[0], TEMA[1], TEMA[2]];
  const VARIAN = {
    [TEMA[0]]: ['"digital leadership" school principal', '"technology leadership" principal school', '"digital leadership" teachers school', 'principal "digital leadership" competence', '"school leadership" digital transformation teachers', '"digital leadership" headteacher primary school'],
    [TEMA[1]]: ['"knowledge management" school teachers', '"knowledge sharing" teachers school', '"organizational knowledge" school teachers', '"knowledge management" principal leadership school', '"knowledge sharing behavior" teachers', '"knowledge management practices" schools'],
    [TEMA[2]]: ['"digital competence" teachers primary school', '"digital competence" teachers DigCompEdu', '"digital competence" teachers school leadership', '"ICT competence" primary school teachers', '"teacher digital competence" professional development', '"digital literacy" teachers primary school']
  };
  const TOLAK = /\b(TAM|UTAUT2?|technology acceptance model|unified theory of acceptance)\b/i;
  const SELECT = 'id,doi,title,display_name,publication_year,publication_date,authorships,primary_location,best_oa_location,open_access,cited_by_count,abstract_inverted_index,type,is_retracted';
  const H = { date: todayStr(), doc: null, seen: null, busy: false };

  const LKEY = d => 'rslr_cadangan_' + d;
  function rulesWarn(e) { const c = e && e.code ? String(e.code) : ''; if (c.includes('permission-denied') && !H.warned) { H.warned = true; toast('Peraturan Firestore belum membenarkan koleksi "cadangan". Cadangan disimpan pada peranti ini sahaja sehingga peraturan dikemas kini (lihat README).', true); } }
  async function saveDoc(doc, merge) {
    try { await R.db().set('cadangan/' + H.date, merge ? { items: doc.items } : doc, !!merge); R.lsSet(LKEY(H.date), null); }
    catch (e) { rulesWarn(e); R.lsSet(LKEY(H.date), doc); if (!(e && String(e.code || '').includes('permission-denied'))) throw e; }
  }
  async function loadDoc(date) {
    let doc = null; try { doc = await R.db().get('cadangan/' + date); } catch (e) { rulesWarn(e); }
    if (!doc) doc = R.lsGet(LKEY(date), null);
    return doc;
  }
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayIndex() { const d = new Date(); const start = new Date(d.getFullYear(), 0, 0); return Math.floor((d - start) / 86400000); }
  function abstractOf(inv) {
    if (!inv || typeof inv !== 'object') return '';
    const words = []; Object.keys(inv).forEach(w => { (inv[w] || []).forEach(p => { words[p] = w; }); });
    return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
  function authorsOf(w) { return (w.authorships || []).map(a => a.author && a.author.display_name ? a.author.display_name.trim() : '').filter(Boolean); }
  function apaName(full) {
    const parts = full.replace(/\s+/g, ' ').trim().split(' '); if (parts.length === 1) return parts[0];
    const sur = parts.pop(); const ini = parts.map(p => p.replace(/[^A-Za-zÀ-ɏ-]/g, '')).filter(Boolean).map(p => p.split('-').map(x => x[0].toUpperCase() + '.').join('-')).join(' ');
    return sur + ', ' + ini;
  }
  function apaAuthors(list) {
    const n = list.map(apaName); if (!n.length) return '';
    if (n.length === 1) return n[0]; if (n.length === 2) return n[0] + ', & ' + n[1];
    if (n.length <= 20) return n.slice(0, -1).join(', ') + ', & ' + n[n.length - 1];
    return n.slice(0, 19).join(', ') + ', ... ' + n[n.length - 1];
  }
  function penulisRingkas(list) { const s = list.map(x => x.split(' ').pop()); if (!s.length) return 'Tanpa penulis'; if (s.length === 1) return s[0]; if (s.length === 2) return s[0] + ' dan ' + s[1]; return s[0] + ' et al.'; }
  function apaRef(it) {
    const j = it.jurnal ? ' ' + it.jurnal + '.' : '';
    const doi = it.doi ? ' https://doi.org/' + it.doi : '';
    return `${apaAuthors(it.penulis)} (${it.tahun}). ${it.tajuk.replace(/\.$/, '')}.${j}${doi}`;
  }
  function compact(w) {
    const src = (w.primary_location && w.primary_location.source) || {};
    const best = w.best_oa_location || {}; const oa = w.open_access || {};
    const abs = abstractOf(w.abstract_inverted_index);
    return { oaId: w.id || '', doi: R.normDoi(w.doi || ''), tajuk: (w.title || w.display_name || '').trim(), penulis: authorsOf(w).slice(0, 25), tahun: String(w.publication_year || ''), tarikh: w.publication_date || '',
      jurnal: src.display_name || '', issn: src.issn_l || '', isCore: !!src.is_core, inDoaj: !!src.is_in_doaj, pdfUrl: best.pdf_url || '', oaUrl: oa.oa_url || best.landing_page_url || '', dipetik: Number(w.cited_by_count) || 0, abstrak: abs.slice(0, 1800) };
  }
  function skor(it, idx) {
    let s = 100 - idx * 2; if (it.isCore) s += 15; if (it.inDoaj) s += 8; if (it.pdfUrl) s += 10; s += Math.min(10, Math.log2(it.dipetik + 1) * 2);
    const t = (it.tajuk + ' ' + it.abstrak).toLowerCase();
    if (/\b(school|teacher|principal|headteacher|sekolah|guru)/.test(t)) s += 6; if (/malaysia/.test(t)) s += 5; if (/\b(primary|elementary)\b/.test(t)) s += 3;
    if (TOLAK.test(it.tajuk + ' ' + it.abstrak)) s -= 100;
    return s;
  }
  async function loadSeen() {
    if (H.seen) return H.seen;
    const set = new Set();
    try { const r = await fetch('./data/seen_dois.json', { cache: 'force-cache' }); if (r.ok) { const j = await r.json(); (j.dois || []).forEach(d => set.add(R.normDoi(d))); } } catch (e) {}
    H.seen = set; return set;
  }
  async function excluded() {
    const set = new Set(await loadSeen());
    R.S.docs.forEach(d => { const x = R.normDoi(d.doi); if (x) set.add(x); });
    try { const log = await R.db().get('meta/cadangan_log'); Object.keys((log && log.dois) || {}).forEach(d => set.add(d)); } catch (e) {}
    return set;
  }
  function doiKey(d) { return R.normDoi(d).replace(/[./]/g, '_'); }
  function excludedHas(set, doi) { const n = R.normDoi(doi); return set.has(n) || set.has(doiKey(n)); }
  async function oaFetch(filter, key) {
    const p = new URLSearchParams({ filter, 'per-page': '25', select: SELECT });
    if (key) p.set('api_key', key); else if (R.C.ownerEmail) p.set('mailto', R.C.ownerEmail);
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(OA + '?' + p.toString(), { signal: ctl.signal });
      if (r.status === 429) throw { code: 'kuota', message: 'Had permintaan OpenAlex hari ini dicapai. Cuba sebentar lagi atau tetapkan kunci API percuma dalam Tetapan.' };
      if (!r.ok) throw { code: 'http', message: 'OpenAlex memulangkan ralat ' + r.status };
      return (await r.json()).results || [];
    } finally { clearTimeout(tm); }
  }
  async function cariTema(tema, variant, excl, taken, key) {
    const from = new Date(); from.setFullYear(from.getFullYear() - 5);
    const base = [`title_and_abstract.search:${variant}`, `from_publication_date:${todayStr(from)}`, 'is_oa:true', 'type:article', 'primary_location.source.type:journal', 'has_doi:true', 'is_retracted:false'];
    const tiers = ['primary_location.source.is_core:true', 'primary_location.source.is_in_doaj:true', ''];
    const found = []; const ids = new Set();
    for (const tier of tiers) {
      let res; try { res = await oaFetch(base.concat(tier ? [tier] : []).join(','), key); } catch (e) { if (e.code === 'kuota') throw e; res = []; }
      res.forEach((w, i) => {
        const it = compact(w); if (!it.doi || !it.tajuk || ids.has(it.doi)) return; ids.add(it.doi);
        if (excludedHas(excl, it.doi) || taken.has(it.doi)) return; if (!it.pdfUrl && !it.oaUrl) return;
        const minY = new Date().getFullYear() - 5; if (Number(it.tahun) < minY) return;
        it.skor = skor(it, i); if (it.skor < 0) return; found.push(it);
      });
      if (found.filter(x => x.pdfUrl).length >= 3) break;
    }
    found.sort((a, b) => (b.pdfUrl ? 1 : 0) - (a.pdfUrl ? 1 : 0) || b.skor - a.skor);
    return found;
  }
  async function cari(force) {
    if (H.busy) return; H.busy = true; const btn = $('#btnHarianCari'); btn.disabled = true;
    $('#harianSub').textContent = 'Mencari dalam OpenAlex: artikel jurnal teras, akses terbuka, lima tahun terkini.';
    try {
      const meta = await R.db().getMeta(); const key = meta && meta.openalexKey ? String(meta.openalexKey).trim() : '';
      const excl = await excluded(); const taken = new Set(); const items = []; const kueri = {}; const di = dayIndex() + (force ? Math.floor(Math.random() * 6) : 0);
      for (const tema of TEMA3) {
        const vs = VARIAN[tema]; const variant = vs[di % vs.length]; kueri[tema] = variant;
        const found = await cariTema(tema, variant, excl, taken, key);
        if (found.length) { const pick = found[0]; taken.add(pick.doi); pick.tema = tema; pick.dibaca = false; pick.artikelId = null; pick.rujukan = apaRef(pick); pick.alt = found.slice(1, 6).map(a => Object.assign({}, a, { abstrak: a.abstrak.slice(0, 700), tema })); items.push(pick); }
        else items.push({ tema, kosong: true, kueri: variant });
      }
      const doc = { tarikh: H.date, dibuat: Date.now(), kueri, items };
      await saveDoc(doc, false);
      const add = {}; items.forEach(it => { if (it.doi) add[doiKey(it.doi)] = H.date; });
      try { if (Object.keys(add).length) await R.db().set('meta/cadangan_log', { dikemaskini: Date.now(), dois: add }, true); } catch (e) {}
      H.doc = doc; render(); await loadDates(); R.lsSet('rslr_harian_last', H.date);
    } catch (e) { toast('Carian harian gagal: ' + (e && e.message ? e.message : e && e.code ? e.code : 'ralat talian'), true); $('#harianSub').textContent = 'Carian gagal. Semak talian internet, kemudian klik Cari semula.'; }
    finally { H.busy = false; btn.disabled = false; }
  }
  async function loadDates() {
    let ids = []; try { ids = (await R.db().list('cadangan', 60)).map(x => x.id); } catch (e) {}
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rslr_cadangan_') && localStorage.getItem(k) !== 'null') ids.push(k.slice(14)); } } catch (e) {}
    ids = Array.from(new Set(ids)); if (!ids.includes(H.date)) ids.unshift(H.date); ids.sort().reverse();
    $('#harianTarikh').innerHTML = ids.map(d => `<option value="${esc(d)}"${d === H.date ? ' selected' : ''}>${esc(d)}</option>`).join('');
  }
  async function load(date, auto) {
    H.date = date || todayStr();
    const doc = await loadDoc(H.date);
    H.doc = doc; render(); badge();
    if (!doc && auto && navigator.onLine && H.date === todayStr()) cari(false);
  }
  function badge() {
    const b = $('#navBadge'); const doc = H.doc && H.doc.tarikh === todayStr() ? H.doc : null;
    const n = doc ? doc.items.filter(it => !it.kosong && !it.dibaca).length : 0;
    b.hidden = !n; b.textContent = String(n);
  }
  function temaClass(t) { return t === TEMA[0] ? 'kd' : t === TEMA[1] ? 'ppo' : t === TEMA[2] ? 'kdg' : 'lain'; }
  function render() {
    const box = $('#picks'); const doc = H.doc;
    if (!doc) { $('#harianSub').textContent = H.date === todayStr() ? 'Belum ada cadangan untuk hari ini.' : 'Tiada cadangan direkodkan pada tarikh ini.'; box.innerHTML = TEMA3.map(t => `<div class="pick ${temaClass(t)}"><span class="tag tema ${temaClass(t)}"><span>${esc(t)}</span></span><div class="empty-pick">${H.busy ? 'Mencari' : 'Klik Cari semula untuk mendapatkan cadangan.'}</div></div>`).join(''); return; }
    const n = doc.items.filter(it => !it.kosong).length; const read = doc.items.filter(it => it.dibaca).length;
    $('#harianSub').textContent = `${n} artikel dicadangkan pada ${doc.tarikh}, ${read} sudah dibaca. Kueri: ${TEMA3.map(t => (doc.kueri && doc.kueri[t]) || '').filter(Boolean).join(' | ')}`;
    box.innerHTML = doc.items.map((it, i) => {
      if (it.kosong) return `<div class="pick ${temaClass(it.tema)}"><span class="tag tema ${temaClass(it.tema)}"><span>${esc(it.tema)}</span></span><div class="empty-pick">Tiada artikel baharu yang memenuhi semua tapisan untuk kueri "${esc(it.kueri || '')}". Klik Cari semula untuk mencuba kueri lain.</div></div>`;
      const sjr = it.issn ? `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(it.issn.replace('-', ''))}&tip=iss&clean=0` : `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(it.jurnal)}`;
      return `<article class="pick ${temaClass(it.tema)}${it.dibaca ? ' done' : ''}" data-i="${i}">
        <div class="top"><span class="tag tema ${temaClass(it.tema)}"><span>${esc(it.tema)}</span></span><label><input type="checkbox" data-baca="${i}"${it.dibaca ? ' checked' : ''}> Sudah dibaca</label></div>
        <h3>${esc(it.tajuk)}</h3>
        <div class="meta">${esc(penulisRingkas(it.penulis))} (${esc(it.tahun)}). <i>${esc(it.jurnal || 'Jurnal tidak dinyatakan')}</i>${it.issn ? ', ISSN ' + esc(it.issn) : ''}</div>
        <div class="badges">${it.isCore ? '<span class="tag ok"><span>Jurnal teras (berwasit)</span></span>' : ''}${it.inDoaj ? '<span class="tag"><span>DOAJ</span></span>' : ''}<span class="tag pdf"><span>${it.pdfUrl ? 'PDF terbuka' : 'Akses terbuka'}</span></span><span class="tag"><span>Dipetik ${it.dipetik}</span></span>${it.artikelId ? '<span class="tag s-selesai"><span>Dalam repositori</span></span>' : ''}</div>
        <div class="abs" data-abs="${i}">${esc(it.abstrak || 'Abstrak tidak tersedia dalam OpenAlex.')}</div>
        <div class="why">Rujukan: ${esc(it.rujukan || apaRef(it))}</div>
        <div class="acts">
          ${it.pdfUrl ? `<button class="btn btn-sm btn-primary" data-dl="${i}">Muat turun PDF</button><button class="btn btn-sm" data-baca-sini="${i}">Baca di sini</button>` : `<a class="btn btn-sm btn-primary" href="${esc(it.oaUrl)}" target="_blank" rel="noopener">Buka versi terbuka</a>`}
          <a class="btn btn-sm" href="https://doi.org/${esc(it.doi)}" target="_blank" rel="noopener">DOI</a>
          <a class="btn btn-sm" href="${esc(sjr)}" target="_blank" rel="noopener" title="Semak pengindeksan Scopus dan kuartil SJR">Semak SJR</a>
          ${it.artikelId ? `<button class="btn btn-sm" data-buka="${i}">Buka rekod</button>` : `<button class="btn btn-sm" data-tambah="${i}">Tambah ke repositori</button>`}
          ${(it.alt || []).length ? `<button class="btn btn-sm" data-tukar="${i}" title="Ganti dengan calon seterusnya">Tukar</button>` : ''}
        </div></article>`;
    }).join('');
    badge();
  }
  async function simpan() { try { await saveDoc(H.doc, true); } catch (e) { toast('Perubahan tidak dapat disimpan: ' + (e.message || e.code || ''), true); } }
  async function dlPdf(it) {
    const name = ((it.penulis[0] || 'artikel').split(' ').pop() + '_' + it.tahun + '_' + it.tajuk.slice(0, 50)).replace(/[^\wÀ-ɏ-]+/g, '_') + '.pdf';
    toast('Memuat turun PDF daripada penerbit');
    try { const r = await fetch(it.pdfUrl, { mode: 'cors', credentials: 'omit' }); if (!r.ok) throw 0; const b = await r.blob(); if (b.size < 1000) throw 0; R.saveFile(name, b, 'application/pdf'); toast('PDF dimuat turun: ' + name); }
    catch (e) { window.open(it.pdfUrl, '_blank', 'noopener'); toast('Penerbit tidak membenarkan muat turun terus; PDF dibuka dalam tab baharu.'); }
  }
  function tambah(it) {
    const extra = { tajuk: it.tajuk, penulis: penulisRingkas(it.penulis), tahun: it.tahun, doi: it.doi, rujukan: it.rujukan || apaRef(it), jenis: 'Artikel jurnal', indeks: it.isCore ? 'Jurnal teras CWTS (semak Scopus/WoS melalui SJR)' : it.inDoaj ? 'DOAJ (semak Scopus/WoS)' : '', tema: it.tema, pautan: it.pdfUrl || it.oaUrl, status: 'Belum dibaca', catatan: 'Dicadangkan oleh Cadangan Harian pada ' + H.date + '.' + (it.jurnal ? ' Jurnal: ' + it.jurnal + '.' : '') };
    const id = R.createArticle(extra); R.renderList(); return id;
  }
  $('#picks').addEventListener('click', async e => {
    const b = e.target.closest('[data-dl],[data-baca-sini],[data-tambah],[data-buka],[data-tukar],[data-abs]'); if (!b || !H.doc) return;
    const it = H.doc.items[+(b.dataset.dl ?? b.dataset.bacaSini ?? b.dataset.tambah ?? b.dataset.buka ?? b.dataset.tukar ?? b.dataset.abs)]; if (!it) return;
    if (b.dataset.abs !== undefined) { b.classList.toggle('open'); return; }
    if (b.dataset.dl !== undefined) dlPdf(it);
    else if (b.dataset.bacaSini !== undefined) R.Flip.open({ title: penulisRingkas(it.penulis) + ' (' + it.tahun + ')', sub: it.tajuk, source: { kind: 'url', url: it.pdfUrl }, dl: it.pdfUrl, note: 'Dibaca terus daripada penerbit. Tambah ke repositori dan muat naik PDF untuk simpanan kekal.' });
    else if (b.dataset.tambah !== undefined) { it.artikelId = tambah(it); await simpan(); render(); toast('Rekod Bil. ' + ((R.S.docs.get(it.artikelId) || {}).bil || '') + ' dicipta', false, { label: 'Buka', fn: () => R.openRecord(it.artikelId) }); }
    else if (b.dataset.buka !== undefined) R.openRecord(it.artikelId);
    else if (b.dataset.tukar !== undefined) {
      const alt = (it.alt || []).shift(); if (!alt) return;
      const i = H.doc.items.indexOf(it); const nu = Object.assign({}, alt, { tema: it.tema, dibaca: false, artikelId: null, alt: it.alt }); nu.rujukan = apaRef(nu);
      H.doc.items[i] = nu; await simpan(); try { await R.db().set('meta/cadangan_log', { dois: { [doiKey(nu.doi)]: H.date } }, true); } catch (er) {}
      render();
    }
  });
  $('#picks').addEventListener('change', async e => { const c = e.target.closest('[data-baca]'); if (!c || !H.doc) return; const it = H.doc.items[+c.dataset.baca]; if (!it) return; it.dibaca = c.checked; await simpan(); render(); });
  $('#btnHarianCari').addEventListener('click', () => { H.date = todayStr(); cari(true); });
  $('#harianTarikh').addEventListener('change', e => load(e.target.value, false));

  return { load, cari, loadDates, badge, todayStr, state: H };
}
