/* Cadangan Harian: tiga artikel sehari, satu bagi setiap pemboleh ubah, daripada OpenAlex.
   Menggantikan tugas berjadual "Sorotan literatur harian" yang dahulunya berjalan di luar aplikasi. */
export function initHarian(R) {
  const { $, esc, toast, TEMA } = R;
  const OA = 'https://api.openalex.org/works';
  const TEMA3 = [TEMA[0], TEMA[1], TEMA[2]];
  const VARIAN = {
    [TEMA[0]]: ['"digital leadership" school principal', '"digital leadership" teachers school', '"digital leadership" education school', '"technology leadership" principal school', '"digital leadership" teachers "professional development"', '"school leadership" digital transformation teachers', 'principal "technology leadership" teachers'],
    [TEMA[1]]: ['"knowledge management" school teachers', '"knowledge sharing" teachers school', '"knowledge management" schools leadership', '"knowledge creation" school teachers', '"knowledge sharing behavior" teachers', '"knowledge sharing" principal school', '"organizational learning" teachers school knowledge'],
    [TEMA[2]]: ['"digital competence" teachers primary school', '"digital competence" teachers DigCompEdu', '"teacher digital competence" professional development', '"digital literacy" teachers primary school', '"digital competence" teachers school leadership', '"digital competence" teachers "self-efficacy" school', '"ICT competence" primary school teachers']
  };
  const TOLAK = /\b(TAM|UTAUT2?|technology acceptance model|unified theory of acceptance)\b/i;
  // Istilah konstruk bagi setiap tema: menentukan relevansi (dalam tajuk = 2, dalam abstrak = 1, tiada = ditolak).
  const ISTILAH = {
    [TEMA[0]]: ['digital leadership', 'technology leadership', 'school leadership', 'e-leadership', 'ICT leadership', 'principal leadership', 'leadership for digital', 'digital transformation leadership', 'technology-enhanced leadership'],
    [TEMA[1]]: ['knowledge management', 'knowledge sharing', 'knowledge creation', 'knowledge transfer', 'organizational learning', 'organizational knowledge', 'learning organization', 'SECI', 'knowledge-based view', 'knowledge exchange'],
    [TEMA[2]]: ['digital competence', 'digital competency', 'digital competencies', 'digital literacy', 'ICT competence', 'ICT competency', 'DigCompEdu', 'TPACK', 'technological pedagogical', 'digital skills', 'teacher digital']
  };
  const RX_CACHE = {};
  function temaRx(tema) {
    if (RX_CACHE[tema]) return RX_CACHE[tema];
    const alts = (ISTILAH[tema] || []).map(p => p.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[sz]ation/g, '[sz]ation').replace(/i[sz]e/g, 'i[sz]e')).join('[\\s-]+') + '(?:s|es|ies)?');
    RX_CACHE[tema] = new RegExp('\\b(?:' + alts.join('|') + ')\\b', 'i'); return RX_CACHE[tema];
  }
  function relevansiOf(it, tema) { const rx = temaRx(tema); if (rx.test(it.tajuk || '')) return 2; if (rx.test(it.abstrak || '')) return 1; return 0; }
  const SELECT = 'id,doi,title,display_name,publication_year,publication_date,authorships,primary_location,best_oa_location,open_access,cited_by_count,abstract_inverted_index,type,is_retracted,has_content,referenced_works_count,referenced_works';
  const CONTENT = 'https://content.openalex.org/works/';
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
    return { oaId: String(w.id || '').replace(/^https?:\/\/openalex\.org\//, ''), hasContent: !!(w.has_content && w.has_content.pdf), doi: R.normDoi(w.doi || ''), tajuk: (w.title || w.display_name || '').trim(), penulis: authorsOf(w).slice(0, 25), tahun: String(w.publication_year || ''), tarikh: w.publication_date || '',
      jurnal: src.display_name || '', issn: src.issn_l || '', issns: Array.from(new Set([src.issn_l].concat(src.issn || []).filter(Boolean).map(issn8))), isCore: !!src.is_core, inDoaj: !!src.is_in_doaj, pdfUrl: best.pdf_url || '', oaUrl: oa.oa_url || best.landing_page_url || '', dipetik: Number(w.cited_by_count) || 0, abstrak: abs.slice(0, 1800),
      nRefs: Number(w.referenced_works_count) || (w.referenced_works || []).length, refs: (w.referenced_works || []).slice(0, 400).map(x => String(x).replace(/^https?:\/\/openalex\.org\//, '')) };
  }
  function issn8(x) { return String(x || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
  /* Senarai Scopus: data/scopus.json (ISSN -> anggaran kuartil SJR; 0 = Scopus tanpa SJR). */
  async function loadScopus() {
    if (H.scopus) return H.scopus;
    try { const r = await fetch('./data/scopus.json', { cache: 'force-cache' }); if (r.ok) { const j = await r.json(); H.scopus = { q: j.q || {}, meta: j.meta || {} }; } } catch (e) {}
    if (!H.scopus) H.scopus = { q: {}, meta: {} };
    return H.scopus;
  }
  function scopusOf(it) {
    const m = H.scopus && H.scopus.q; if (!m) return null;
    let best = null; (it.issns || []).forEach(i => { if (i in m) { const q = Number(m[i]) || 0; if (best === null || (q && (!best.q || q < best.q))) best = { q }; } });
    return best;
  }
  // Kelas keutamaan: 1-4 Scopus Q1-Q4, 5 Scopus tanpa kuartil, 6 jurnal teras CWTS, 7 DOAJ, 99 ditolak (tidak dapat disahkan diindeks dan berwasit).
  function kelasOf(it) {
    const sc = scopusOf(it);
    if (sc) return sc.q ? sc.q : 5;
    if (it.isCore) return 6; if (it.inDoaj) return 7; return 99;
  }
  function kelasLabel(k) { return k <= 4 ? 'Scopus Q' + k : k === 5 ? 'Scopus' : k === 6 ? 'Jurnal teras (berwasit)' : k === 7 ? 'DOAJ (berwasit)' : ''; }
  function minYear() { return new Date().getFullYear() - 4; }
  const EDU = /\b(schools?|teachers?|principals?|head ?teachers?|headmasters?|educat\w*|sekolah|guru|classrooms?|students?|pupils?|pedagog\w*)\b/i;
  const HEALTH = /\b(diseases?|patients?|clinical|nurs(?:e|es|ing)|hospitals?|medical|medicine|pharmac\w*|surgery|cancer|epidemiolog\w*)\b/i;
  function phraseRx(variant) {
    const m = /"([^"]+)"/.exec(variant); if (!m) return null;
    const words = m[1].trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[sz]ation/g, '[sz]ation').replace(/i[sz]e/g, 'i[sz]e'));
    return new RegExp('\\b' + words.join('[\\s-]+') + '(?:s|es)?\\b', 'i');
  }
  function skor(it, idx, variant) {
    const tajuk = it.tajuk || ''; const teks = tajuk + ' ' + it.abstrak;
    if (!EDU.test(teks)) return -1;
    if (TOLAK.test(teks)) return -1;
    let s = 100 - idx * 2; if (it.isCore) s += 15; if (it.inDoaj) s += 8; if (it.pdfUrl) s += 10; if (it.hasContent) s += 8; if (it.nRefs > 0) s += 6; s += Math.min(10, Math.log2(it.dipetik + 1) * 2);
    const rx = phraseRx(variant);
    if (rx) { if (rx.test(tajuk)) s += 18; else if (rx.test(it.abstrak)) s += 4; else s -= 25; }
    if (EDU.test(tajuk)) s += 8;
    if (/malaysia/i.test(teks)) s += 5; if (/\b(primary|elementary)\b/i.test(teks)) s += 3;
    if (/\bmediat/i.test(teks)) s += 4; if (/structural equation|\bSEM\b|PLS-SEM/i.test(teks)) s += 3;
    if (HEALTH.test(teks)) s -= 30;
    if (!it.abstrak) s -= 10;
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
  async function oaFetch(filter, key, perPage) {
    const p = new URLSearchParams({ filter, 'per-page': String(perPage || 100), select: SELECT });
    if (key) p.set('api_key', key); else if (R.C.ownerEmail) p.set('mailto', R.C.ownerEmail);
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(OA + '?' + p.toString(), { signal: ctl.signal });
      if (r.status === 429) throw { code: 'kuota', message: 'Had permintaan OpenAlex hari ini dicapai. Cuba sebentar lagi atau tetapkan kunci API percuma dalam Tetapan.' };
      if (!r.ok) throw { code: 'http', message: 'OpenAlex memulangkan ralat ' + r.status };
      return (await r.json()).results || [];
    } finally { clearTimeout(tm); }
  }
  const BASE = () => [`from_publication_date:${minYear()}-01-01`, 'is_oa:true', 'type:article', 'primary_location.source.type:journal', 'has_doi:true', 'is_retracted:false'];
  const kumpulan = k => k <= 5 ? 0 : k === 6 ? 1 : 2;
  function susun(found) {
    // Keutamaan: kumpulan Scopus dahulu, kemudian jurnal teras, kemudian DOAJ; dalam kumpulan yang sama: istilah konstruk dalam tajuk,
    // kemudian kuartil (Q1 ke Q4), kemudian ada PDF, kemudian skor relevansi.
    found.sort((a, b) => kumpulan(a.kelas) - kumpulan(b.kelas) || b.relevansi - a.relevansi || a.kelas - b.kelas || (b.pdfUrl ? 1 : 0) - (a.pdfUrl ? 1 : 0) || b.skor - a.skor);
    return found;
  }
  function terima(w, i, variant, excl, taken, ids, tema) {
    const it = compact(w); if (!it.doi || !it.tajuk || ids.has(it.doi)) return null; ids.add(it.doi);
    if (excludedHas(excl, it.doi) || taken.has(it.doi)) return null; if (!it.pdfUrl && !it.oaUrl) return null;
    if (Number(it.tahun) < minYear()) return null;
    it.kelas = kelasOf(it); if (it.kelas >= 99) return null;
    it.skor = skor(it, i, variant); if (it.skor < 0) return null;
    it.relevansi = tema ? relevansiOf(it, tema) : 1; if (!it.relevansi) return null;
    return it;
  }
  async function cariTema(tema, variant, excl, taken, key) {
    const base = [`title_and_abstract.search:${variant}`].concat(BASE());
    const found = []; const ids = new Set();
    let res; try { res = await oaFetch(base.join(','), key, 100); } catch (e) { if (e.code === 'kuota') throw e; res = []; }
    res.forEach((w, i) => { const it = terima(w, i, variant, excl, taken, ids, tema); if (it) found.push(it); });
    if (found.filter(x => x.kelas <= 5).length < 2) {
      let res2; try { res2 = await oaFetch(base.concat(['primary_location.source.is_core:true']).join(','), key, 100); } catch (e) { if (e.code === 'kuota') throw e; res2 = []; }
      res2.forEach((w, i) => { const it = terima(w, i, variant, excl, taken, ids, tema); if (it) found.push(it); });
    }
    return susun(found);
  }
  // Rantaian rujukan ("connected papers"): calon esok diambil daripada senarai Rujukan artikel semalam bagi konstruk yang sama.
  async function cariRujukan(tema, seed, excl, taken, key) {
    const refs = (seed.refs || []).filter(x => /^W\d+$/.test(x)); if (!refs.length) return [];
    const variant = VARIAN[tema][0]; const found = []; const ids = new Set();
    for (let i = 0; i < refs.length && i < 400; i += 100) {
      const chunk = refs.slice(i, i + 100);
      let res; try { res = await oaFetch(['ids.openalex:' + chunk.join('|')].concat(BASE()).join(','), key, 100); } catch (e) { if (e.code === 'kuota') throw e; res = []; }
      res.forEach((w, j) => { const it = terima(w, 0, variant, excl, taken, ids, tema); if (it) found.push(it); });
    }
    return susun(found);
  }
  function ringkasSeed(seed, tarikh) { return { oaId: seed.oaId || '', doi: seed.doi || '', tajuk: seed.tajuk || '', penulis: penulisRingkas(seed.penulis || []), tahun: seed.tahun || '', tarikh: tarikh || '', artikelId: seed.artikelId || null, nRefs: seed.nRefs || (seed.refs || []).length }; }
  async function loadSejarah() {
    const m = new Map();
    try { (await R.db().list('cadangan', 90)).forEach(x => { if (x.data && x.data.tarikh) m.set(x.data.tarikh, x.data); }); } catch (e) {}
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rslr_cadangan_')) { const v = R.lsGet(k, null); if (v && v.tarikh && !m.has(v.tarikh)) m.set(v.tarikh, v); } } } catch (e) {}
    H.sejarah = m; return m;
  }
  function seedFor(tema) {
    if (!H.sejarah) return null;
    const dates = Array.from(H.sejarah.keys()).filter(d => d < H.date).sort().reverse();
    for (const d of dates) {
      const doc = H.sejarah.get(d); const it = (doc.items || []).find(x => x.tema === tema && !x.kosong);
      if (it) return { it, tarikh: d };
    }
    return null;
  }
  async function cari(force) {
    if (H.busy) return; H.busy = true; const btn = $('#btnHarianCari'); btn.disabled = true;
    $('#harianSub').textContent = 'Mencari dalam OpenAlex: keutamaan Scopus, kemudian jurnal teras dan DOAJ; akses terbuka; ' + minYear() + ' hingga ' + new Date().getFullYear() + '.';
    try {
      const meta = await R.db().getMeta(); const key = meta && meta.openalexKey ? String(meta.openalexKey).trim() : '';
      await loadScopus(); await loadSejarah();
      const excl = await excluded(); const taken = new Set(); const items = []; const kueri = {}; const di = dayIndex() + (force ? Math.floor(Math.random() * 6) : 0);
      for (const tema of TEMA3) {
        let found = []; let rantai = null; const seed = seedFor(tema);
        if (seed && (seed.it.refs || []).length) {
          found = await cariRujukan(tema, seed.it, excl, taken, key);
          if (found.length) { rantai = { panjang: ((seed.it.rantai && seed.it.rantai.panjang) || 1) + 1, dari: ringkasSeed(seed.it, seed.tarikh) }; kueri[tema] = 'Rujukan artikel ' + seed.tarikh; }
        }
        if (!found.length) {
          const vs = VARIAN[tema]; let variant = vs[di % vs.length]; kueri[tema] = variant;
          found = await cariTema(tema, variant, excl, taken, key);
          for (let k = 1; k <= 2 && !found.length; k++) { variant = vs[(di + k) % vs.length]; kueri[tema] = variant; found = await cariTema(tema, variant, excl, taken, key); }
          const sebab = !seed ? 'Tiada artikel terdahulu bagi konstruk ini, maka carian baharu.' : !(seed.it.refs || []).length ? `Artikel ${seed.tarikh} tiada senarai rujukan dalam OpenAlex, maka carian baharu.` : `Senarai rujukan artikel ${seed.tarikh} (${(seed.it.refs || []).length} rujukan) tiada lagi penerbitan ${minYear()} hingga ${new Date().getFullYear()} yang memenuhi kriteria, maka rantaian baharu dimulakan.`;
          rantai = { panjang: 1, baharu: true, sebab, dari: seed ? ringkasSeed(seed.it, seed.tarikh) : null };
        }
        if (found.length) { const pick = found[0]; taken.add(pick.doi); pick.tema = tema; pick.dibaca = false; pick.artikelId = null; pick.rujukan = apaRef(pick); pick.rantai = rantai; pick.alt = found.slice(1, 6).map(a => Object.assign({}, a, { abstrak: a.abstrak.slice(0, 700), tema, rantai })); items.push(pick); }
        else items.push({ tema, kosong: true, kueri: kueri[tema], rantai });
      }
      const doc = { tarikh: H.date, dibuat: Date.now(), kueri, items };
      await saveDoc(doc, false);
      const add = {}; items.forEach(it => { if (it.doi) add[doiKey(it.doi)] = H.date; });
      try { if (Object.keys(add).length) await R.db().set('meta/cadangan_log', { dikemaskini: Date.now(), dois: add }, true); } catch (e) {}
      H.doc = doc; if (H.sejarah) H.sejarah.set(H.date, doc); render(); await loadDates(); R.lsSet('rslr_harian_last', H.date);
    } catch (e) { toast('Carian harian gagal: ' + (e && e.message ? e.message : e && e.code ? e.code : 'ralat talian'), true); $('#harianSub').textContent = 'Carian gagal. Semak talian internet, kemudian klik Cari semula.'; }
    finally { H.busy = false; btn.disabled = false; }
  }
  async function loadDates() {
    await loadSejarah();
    let ids = Array.from(H.sejarah.keys()); if (!ids.includes(H.date)) ids.unshift(H.date); ids.sort().reverse();
    $('#harianTarikh').innerHTML = ids.map(d => `<option value="${esc(d)}"${d === H.date ? ' selected' : ''}>${esc(d)}</option>`).join('');
    renderRantaian();
  }
  function renderRantaian() {
    const box = $('#rantaian'); if (!box || !H.sejarah) return;
    const dates = Array.from(H.sejarah.keys()).sort();
    const cols = TEMA3.map(tema => {
      const steps = []; dates.forEach(d => { const it = (H.sejarah.get(d).items || []).find(x => x.tema === tema && !x.kosong); if (it) steps.push({ d, it }); });
      if (!steps.length) return `<div class="rantai-col"><h3><span class="tag tema ${temaClass(tema)}"><span>${esc(tema)}</span></span></h3><div class="help">Belum ada cadangan.</div></div>`;
      return `<div class="rantai-col"><h3><span class="tag tema ${temaClass(tema)}"><span>${esc(tema)}</span></span></h3><ol>${steps.map(({ d, it }, k) => {
        const r = it.rantai || {}; const sambung = k > 0 && r.panjang > 1 && !r.baharu;
        return `<li class="${sambung ? 'sambung' : 'mula'}" title="${esc(sambung ? 'Disenaraikan dalam Rujukan artikel sebelumnya' : 'Rantaian baharu (carian baharu)')}"><span class="d">${esc(d)}</span> <span class="k">${esc(kelasLabel(it.kelas || kelasOf(it)) || '')}</span> ${esc(penulisRingkas(it.penulis || []))} (${esc(it.tahun)}). ${esc((it.tajuk || '').slice(0, 90))}${(it.tajuk || '').length > 90 ? '…' : ''}${it.artikelId && R.S.docs.has(it.artikelId) ? ` <button class="btn btn-sm" data-rek="${esc(it.artikelId)}">Rekod</button>` : ''}</li>`;
      }).join('')}</ol></div>`;
    });
    box.innerHTML = `<h2>Rantaian artikel <small>Setiap anak panah bermakna artikel di bawahnya diambil daripada senarai Rujukan artikel di atasnya; garis putus bermakna rantaian baharu.</small></h2><div class="rantai-grid">${cols.join('')}</div>`;
  }
  async function load(date, auto) {
    H.date = date || todayStr();
    await loadScopus();
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
        ${it.rantai ? `<div class="rantai-line">${it.rantai.baharu ? `<b>Rantaian baharu.</b> ${esc(it.rantai.sebab || '')}` : `<b>Rantaian ke-${esc(it.rantai.panjang)}.</b> Disenaraikan dalam Rujukan artikel ${esc(it.rantai.dari.tarikh)}: ${esc(it.rantai.dari.penulis)} (${esc(it.rantai.dari.tahun)}), «${esc(it.rantai.dari.tajuk)}»${it.rantai.dari.doi ? ` <a href="https://doi.org/${esc(it.rantai.dari.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}${it.rantai.dari.artikelId && R.S.docs.has(it.rantai.dari.artikelId) ? ` <button class="btn btn-sm" data-rek="${esc(it.rantai.dari.artikelId)}">Rekod</button>` : ''}`}</div>` : ''}
        <div class="badges">${(it.kelas || kelasOf(it)) <= 5 ? `<span class="tag ok"><span>${esc(kelasLabel(it.kelas || kelasOf(it)))}${(it.kelas || kelasOf(it)) <= 4 ? ' (anggaran SJR)' : ''}</span></span>` : it.isCore ? '<span class="tag ok"><span>Jurnal teras (berwasit)</span></span>' : it.inDoaj ? '<span class="tag ok"><span>DOAJ (berwasit)</span></span>' : ''}${it.inDoaj && (it.kelas || kelasOf(it)) !== 7 ? '<span class="tag"><span>DOAJ</span></span>' : ''}${it.nRefs ? `<span class="tag" title="Bilangan rujukan dalam OpenAlex; asas rantaian esok"><span>${esc(it.nRefs)} rujukan</span></span>` : ''}<span class="tag pdf"><span>${it.pdfUrl ? 'PDF terbuka' : 'Akses terbuka'}</span></span><span class="tag"><span>Dipetik ${it.dipetik}</span></span>${pdfDalamDrive(it) ? '<span class="tag s-selesai"><span>PDF dalam Drive</span></span>' : it.artikelId && R.S.docs.has(it.artikelId) ? '<span class="tag s-selesai"><span>Dalam repositori</span></span>' : ''}${it.hasContent ? '<span class="tag"><span>Salinan OpenAlex</span></span>' : ''}</div>
        <div class="abs" data-abs="${i}">${esc(it.abstrak || 'Abstrak tidak tersedia dalam OpenAlex.')}</div>
        <div class="why">Rujukan: ${esc(it.rujukan || apaRef(it))}</div>
        ${it.manual ? `<div class="manual"><b>Langkah manual.</b> ${esc(it.manual)}. Klik <b>Buka PDF</b>, simpan fail itu, kemudian pilih fail yang dimuat turun di sini (atau seret ke kad ini; di Android, buka fail dan Kongsi ke aplikasi Repositori SLR). Fail terus disimpan dalam Google Drive dan dipautkan ke rekod.<div class="acts" style="margin-top:6px">${it.pdfUrl ? `<a class="btn btn-sm btn-primary" href="${esc(it.pdfUrl)}" target="_blank" rel="noopener">Buka PDF</a>` : `<a class="btn btn-sm btn-primary" href="${esc(it.oaUrl)}" target="_blank" rel="noopener">Buka versi terbuka</a>`}<label class="btn btn-sm">Pilih fail PDF<input type="file" accept=".pdf,application/pdf" hidden data-pickfile="${i}"></label></div></div>` : ''}
        <div class="acts">
          ${pdfDalamDrive(it) ? `<button class="btn btn-sm btn-primary" data-baca-drive="${i}">Baca</button><button class="btn btn-sm" data-dl-drive="${i}">Muat turun</button>` : `<button class="btn btn-sm btn-primary" data-simpan="${i}" title="Simpan PDF ke Google Drive dan pautkan ke rekod">Simpan ke Drive</button>${it.pdfUrl ? `<button class="btn btn-sm" data-dl="${i}" title="Salinan ke peranti ini sahaja">Muat turun PDF</button><button class="btn btn-sm" data-baca-sini="${i}">Baca di sini</button>` : `<a class="btn btn-sm" href="${esc(it.oaUrl)}" target="_blank" rel="noopener">Buka versi terbuka</a>`}`}
          <a class="btn btn-sm" href="https://doi.org/${esc(it.doi)}" target="_blank" rel="noopener">DOI</a>
          <a class="btn btn-sm" href="${esc(sjr)}" target="_blank" rel="noopener" title="Semak pengindeksan Scopus dan kuartil SJR">Semak SJR</a>
          ${it.artikelId && R.S.docs.has(it.artikelId) ? `<button class="btn btn-sm" data-buka="${i}">Buka rekod</button>` : `<button class="btn btn-sm" data-tambah="${i}">Tambah ke repositori</button>`}
          ${(it.alt || []).length ? `<button class="btn btn-sm" data-tukar="${i}" title="Ganti dengan calon seterusnya">Tukar</button>` : ''}
        </div></article>`;
    }).join('');
    badge();
  }
  async function simpan() { try { await saveDoc(H.doc, true); } catch (e) { toast('Perubahan tidak dapat disimpan: ' + (e.message || e.code || ''), true); } }
  async function apiKey() { try { const m = await R.db().getMeta(); return m && m.openalexKey ? String(m.openalexKey).trim() : ''; } catch (e) { return ''; } }
  function namaFail(it) { return (((it.penulis || [])[0] || 'artikel').split(' ').pop() + '_' + (it.tahun || '') + '_' + (it.tajuk || '').slice(0, 60)).replace(/[^\wÀ-ɏ-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '.pdf'; }
  // Rantaian satu sumber: salinan OpenAlex (CORS dibenarkan) -> URL penerbit -> manual (Buka PDF, pilih fail, seret, atau kongsi dari Android)
  async function ambilPdf(it, onStatus) {
    const key = await apiKey(); const tries = [];
    if (it.hasContent && it.oaId) tries.push({ url: CONTENT + it.oaId + '.pdf' + (key ? '?api_key=' + encodeURIComponent(key) : ''), sumber: 'OpenAlex' });
    if (it.pdfUrl) tries.push({ url: it.pdfUrl, sumber: 'penerbit' });
    let last = { code: 'tiada' };
    for (const t of tries) {
      if (onStatus) onStatus('Mengambil PDF daripada ' + t.sumber);
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 60000);
        let r; try { r = await fetch(t.url, { mode: 'cors', credentials: 'omit', signal: ctl.signal }); } finally { clearTimeout(tm); }
        if (r.status === 429) { last = { code: 'kuota', sumber: t.sumber }; continue; }
        if (!r.ok) { last = { code: 'http', status: r.status, sumber: t.sumber }; continue; }
        const buf = await r.arrayBuffer();
        const head = new TextDecoder('latin1').decode(new Uint8Array(buf.slice(0, 1024)));
        if (!head.includes('%PDF')) { last = { code: 'not_pdf', sumber: t.sumber }; continue; }
        return { buf, sumber: t.sumber };
      } catch (e) { last = { code: e && e.name === 'AbortError' ? 'masa' : 'cors', sumber: t.sumber }; }
    }
    throw last;
  }
  function ambilMsg(e) {
    const c = e && e.code;
    if (c === 'kuota') return 'bajet OpenAlex hari ini habis (tetapkan kunci API dalam Tetapan)';
    if (c === 'cors') return 'penerbit menyekat muat turun automatik dari aplikasi';
    if (c === 'not_pdf') return 'pautan penerbit memulangkan halaman web, bukan fail PDF';
    if (c === 'http') return 'pelayan menolak permintaan (' + e.status + ')';
    if (c === 'masa') return 'tamat masa menunggu penerbit';
    return 'tiada pautan PDF';
  }
  async function dlPdf(it, i) {
    setBusy(i, 'Mengambil PDF');
    try { const { buf, sumber } = await ambilPdf(it, t => setBusy(i, t)); R.saveFile(namaFail(it), buf, 'application/pdf'); toast('PDF dimuat turun ke peranti ini (sumber: ' + sumber + ')'); }
    catch (e) { if (it.pdfUrl) window.open(it.pdfUrl, '_blank', 'noopener'); toast('Muat turun automatik gagal: ' + ambilMsg(e) + (it.pdfUrl ? '. PDF dibuka dalam tab baharu.' : ''), true); }
    finally { setBusy(i, null); }
  }
  function setBusy(i, text) { const el = $(`#picks .pick[data-i="${i}"] [data-simpan]`); if (!el) return; if (text) { el.disabled = true; el.textContent = text; } else { el.disabled = false; el.textContent = 'Simpan ke Drive'; } }
  function pdfDalamDrive(it) { const d = it.artikelId ? R.S.docs.get(it.artikelId) : null; return !!(d && (d.fail || []).length); }
  // Simpan ke Drive: PDF dimasukkan ke folder Google Drive dan dipautkan ke rekod repositori, lalu tersedia di semua peranti.
  async function simpanKeDrive(i) {
    const it = H.doc.items[i]; if (!it || it.kosong) return;
    if (!R.drive().hasToken()) { const ok = await R.ensureDrive(true); if (!ok) return; }
    setBusy(i, 'Mengambil PDF');
    try {
      const { buf, sumber } = await ambilPdf(it, t => setBusy(i, t));
      await intakeFile(it, new File([buf], namaFail(it), { type: 'application/pdf' }), sumber);
    } catch (e) {
      it.manual = ambilMsg(e); setBusy(i, null); render();
      toast('Muat turun automatik gagal: ' + ambilMsg(e) + '. Gunakan langkah manual pada kad.', true);
    }
  }
  async function intakeFile(it, file, sumber) {
    if (!it.artikelId || !R.S.docs.has(it.artikelId)) it.artikelId = tambah(it);
    await R.uploadFiles([file], it.artikelId);
    const ok = pdfDalamDrive(it);
    if (ok) { it.manual = null; it.pdfDrive = true; }
    await simpan(); render();
    if (ok) toast(`PDF disimpan dalam Google Drive dan dipautkan ke rekod Bil. ${(R.S.docs.get(it.artikelId) || {}).bil || ''}${sumber ? ' (sumber: ' + sumber + ')' : ''}`, false, { label: 'Buka rekod', fn: () => R.openRecord(it.artikelId) });
    return ok;
  }
  async function intake(i, files) {
    const it = H.doc && H.doc.items[i]; if (!it || it.kosong) return false;
    const f = Array.from(files || []).find(x => /\.pdf$/i.test(x.name) || x.type === 'application/pdf'); if (!f) { toast('Pilih fail PDF', true); return false; }
    return intakeFile(it, f, 'fail yang dipilih');
  }
  // Padankan fail yang dimuat naik (DOI dikesan daripada PDF) dengan cadangan hari ini.
  async function linkByDoi(articleId, doi) {
    const n = R.normDoi(doi); if (!n || !H.doc) return false;
    const it = H.doc.items.find(x => !x.kosong && x.doi === n); if (!it) return false;
    it.artikelId = articleId; it.manual = null;
    const d = R.S.docs.get(articleId) || {}; const patch = {};
    const want = { tajuk: it.tajuk, penulis: penulisRingkas(it.penulis), tahun: it.tahun, rujukan: it.rujukan || apaRef(it), jenis: 'Artikel jurnal', tema: it.tema, pautan: it.pdfUrl || it.oaUrl, indeks: it.isCore ? 'Jurnal teras CWTS (semak Scopus/WoS melalui SJR)' : it.inDoaj ? 'DOAJ (semak Scopus/WoS)' : '' };
    Object.keys(want).forEach(k => { if (want[k] && !(d[k] && String(d[k]).trim())) patch[k] = want[k]; });
    if (!d.catatan) patch.catatan = 'Dicadangkan oleh Cadangan Harian pada ' + H.date + '.' + (it.jurnal ? ' Jurnal: ' + it.jurnal + '.' : '');
    if (Object.keys(patch).length) { try { await R.writeNow(articleId, patch); } catch (e) {} }
    await simpan(); render(); toast('PDF dipadankan dengan cadangan hari ini: ' + it.tema);
    return true;
  }
  function tambah(it) {
    const extra = { tajuk: it.tajuk, penulis: penulisRingkas(it.penulis), tahun: it.tahun, doi: it.doi, rujukan: it.rujukan || apaRef(it), jenis: 'Artikel jurnal', indeks: it.isCore ? 'Jurnal teras CWTS (semak Scopus/WoS melalui SJR)' : it.inDoaj ? 'DOAJ (semak Scopus/WoS)' : '', tema: it.tema, pautan: it.pdfUrl || it.oaUrl, status: 'Belum dibaca', catatan: 'Dicadangkan oleh Cadangan Harian pada ' + H.date + '.' + (it.jurnal ? ' Jurnal: ' + it.jurnal + '.' : '') };
    const id = R.createArticle(extra); R.renderList(); return id;
  }
  $('#picks').addEventListener('click', async e => {
    const b = e.target.closest('[data-dl],[data-baca-sini],[data-tambah],[data-buka],[data-tukar],[data-abs],[data-simpan],[data-baca-drive],[data-dl-drive]'); if (!b || !H.doc) return;
    const i = +(b.dataset.dl ?? b.dataset.bacaSini ?? b.dataset.tambah ?? b.dataset.buka ?? b.dataset.tukar ?? b.dataset.abs ?? b.dataset.simpan ?? b.dataset.bacaDrive ?? b.dataset.dlDrive);
    const it = H.doc.items[i]; if (!it) return;
    if (b.dataset.abs !== undefined) { b.classList.toggle('open'); return; }
    if (b.dataset.simpan !== undefined) simpanKeDrive(i);
    else if (b.dataset.bacaDrive !== undefined) R.openFlip(it.artikelId, 0);
    else if (b.dataset.dlDrive !== undefined) R.downloadPdf(it.artikelId, 0);
    else if (b.dataset.dl !== undefined) dlPdf(it, i);
    else if (b.dataset.bacaSini !== undefined) R.Flip.open({ title: penulisRingkas(it.penulis) + ' (' + it.tahun + ')', sub: it.tajuk, source: { kind: 'url', url: it.pdfUrl }, dl: it.pdfUrl, note: 'Dibaca terus daripada penerbit. Tambah ke repositori dan muat naik PDF untuk simpanan kekal.' });
    else if (b.dataset.tambah !== undefined) { it.artikelId = tambah(it); await simpan(); render(); toast('Rekod Bil. ' + ((R.S.docs.get(it.artikelId) || {}).bil || '') + ' dicipta', false, { label: 'Buka', fn: () => R.openRecord(it.artikelId) }); }
    else if (b.dataset.buka !== undefined) R.openRecord(it.artikelId);
    else if (b.dataset.tukar !== undefined) {
      const alt = (it.alt || []).shift(); if (!alt) return;
      const i = H.doc.items.indexOf(it); const nu = Object.assign({}, alt, { tema: it.tema, dibaca: false, artikelId: null, alt: it.alt, rantai: alt.rantai || it.rantai }); nu.rujukan = apaRef(nu);
      H.doc.items[i] = nu; await simpan(); try { await R.db().set('meta/cadangan_log', { dois: { [doiKey(nu.doi)]: H.date } }, true); } catch (er) {}
      render();
    }
  });
  $('#harian').addEventListener('click', e => { const b = e.target.closest('[data-rek]'); if (b) R.openRecord(b.dataset.rek); });
  $('#picks').addEventListener('change', async e => {
    const pf = e.target.closest('[data-pickfile]'); if (pf) { const files = Array.from(pf.files || []); pf.value = ''; intake(+pf.dataset.pickfile, files); return; }
    const c = e.target.closest('[data-baca]'); if (!c || !H.doc) return; const it = H.doc.items[+c.dataset.baca]; if (!it) return; it.dibaca = c.checked; await simpan(); render(); });
  $('#btnHarianCari').addEventListener('click', () => { H.date = todayStr(); cari(true); });
  $('#harianTarikh').addEventListener('change', e => load(e.target.value, false));

  return { load, cari, loadDates, badge, todayStr, intake, linkByDoi, render, renderRantaian, state: H };
}
