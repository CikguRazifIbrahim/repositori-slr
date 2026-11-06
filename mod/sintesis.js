/* Rantaian sintesis (medan 12 Bandingan silang): jejak artikel yang berkaitan supaya sintesis merentas artikel dapat ditulis dengan tepat
   walaupun artikel pertama sudah lama dibaca. Setiap rekod menyimpan senarai `hubungan` berstruktur (artikel lain, jenis hubungan, aspek,
   nota ringkas) di samping teks bebas medan 12. Panel di bawah medan 12 memaparkan (1) hubungan yang ditulis daripada rekod ini,
   (2) "Dirujuk oleh": hubungan yang ditulis daripada rekod lain ke rekod ini (automatik, dua hala), (3) cadangan "Mungkin berkaitan" yang
   dikira daripada medan rekod (tema, teori sepunya, reka bentuk, konteks, kesan yang diuji, istilah sepunya TF-IDF), setiap satu dengan
   Ringkasan kilat (objektif, konstruk, teori, kaedah, dapatan, jurang) supaya artikel lain diingat semula tanpa membukanya; serta Rangka
   sintesis (perenggan rangka daripada hubungan, tanpa token) dan Peta sintesis seluruh repositori (kelompok artikel yang saling berkait). */
export function initSintesis(R) {
  const { $, $$, esc, toast } = R;
  const JENIS = [
    ['selari', 'Selari', 'menyokong atau konsisten dengan'],
    ['bercanggah', 'Bercanggah', 'dapatan atau hujahnya bertentangan dengan'],
    ['melanjutkan', 'Melanjutkan', 'melanjutkan atau memperluas'],
    ['melengkapi', 'Melengkapi', 'mengisi aspek yang tidak diliputi oleh'],
    ['mengulang', 'Mengulang', 'mereplikasi atau mengulang dapatan'],
    ['berbeza', 'Berbeza konteks', 'berkongsi persamaan umum tetapi berbeza konteks dengan']
  ];
  const JENIS_PETA = Object.fromEntries(JENIS.map(j => [j[0], j]));
  const ASPEK = ['Teori', 'Konstruk', 'Kaedah', 'Instrumen', 'Sampel dan konteks', 'Dapatan', 'Jurang', 'Implikasi'];
  const TEORI = [['SECI', /\bSECI\b|nonaka/i], ['TPACK', /\bTPACK\b/i], ['DigCompEdu', /digcompedu|redecker/i], ['ISTE', /\bISTE\b/i], ['UTAUT', /\bUTAUT/i], ['TAM', /\bTAM\b|technology acceptance/i], ['kepimpinan transformasi', /transformas|transformation/i], ['Teori Kognitif Sosial', /kognitif sosial|social cognitive|bandura/i], ['efikasi kendiri', /efikasi|self-efficacy|self efficacy/i], ['kepimpinan teragih', /teragih|distributed leadership/i], ['KBV', /\bKBV\b|knowledge-based view|knowledge based view/i], ['Hallinger dan Heck', /hallinger/i], ['TPB', /\bTPB\b|planned behavio/i], ['difusi inovasi', /difusi|diffusion of innovation|rogers/i], ['kepimpinan instruksional', /instruksional|instructional leadership/i], ['LMX', /\bLMX\b|leader-member/i], ['JD-R', /JD-R|job demands/i], ['pembelajaran organisasi', /pembelajaran organisasi|organi[sz]ational learning/i], ['budaya atau iklim sekolah', /budaya sekolah|school culture|school climate|iklim sekolah/i], ['TOE', /\bTOE\b/i], ['DOI Rogers', /\bDOI\b(?!\s*:)/], ['modal psikologi', /psycap|psychological capital|modal psikologi/i], ['pengurusan pengetahuan', /knowledge management|pengurusan pengetahuan/i]];
  const SIN = { vec: null, vecMasa: 0 };

  /* ---- data ---- */
  function rekod(id) { const d = R.S.docs.get(id) || {}; return Object.assign({}, d, R.S.pending[id] || {}); }
  const nama = d => (d.penulis || 'Penulis belum diisi') + (d.tahun ? ' (' + d.tahun + ')' : '');
  const namaId = id => R.S.docs.has(id) ? nama(rekod(id)) : 'Rekod tidak ditemui';
  const potong = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
  const hubungan = d => (Array.isArray(d.hubungan) ? d.hubungan : []).filter(h => h && h.ke);
  const idBaru = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const kelasStatus = st => /selesai/i.test(st || '') ? 's-selesai' : /sedang/i.test(st || '') ? 's-sedang' : 's-belum';
  function teoriDalam(d) { const t = [d.teori, d.definisi, d.konstruk, d.instrumen].filter(Boolean).join(' '); return TEORI.filter(([n, re]) => re.test(t)).map(x => x[0]); }
  /* Hubungan yang ditulis daripada rekod lain ke rekod ini (dua hala tanpa perlu ditulis dua kali). */
  function dirujukOleh(id) { const out = []; R.S.docs.forEach((d0, lain) => { if (lain === id) return; hubungan(rekod(lain)).forEach(h => { if (h.ke === id) out.push(Object.assign({}, h, { dari: lain })); }); }); return out.sort((a, b) => (b.masa || 0) - (a.masa || 0)); }
  function semuaHubungan() { const out = []; R.S.docs.forEach((d0, id) => { hubungan(rekod(id)).forEach(h => out.push(Object.assign({}, h, { dari: id }))); }); return out; }

  /* ---- persamaan antara rekod: TF-IDF istilah medan dan padanan medan kategori, dengan sebab yang telus ---- */
  function teksRekod(d) { return [d.tajuk, d.objektif, d.konstruk, d.definisi, d.teori, d.instrumen, d.dapatan, d.jurang, d.subtopik, d.implikasi].filter(Boolean).join(' '); }
  function vektor() {
    const masa = Date.now(); if (SIN.vec && masa - SIN.vecMasa < 4000 && SIN.vecN === R.S.docs.size) return SIN.vec;
    const ids = Array.from(R.S.docs.keys()); const docs = ids.map(id => R.Peta.tokens(teksRekod(rekod(id)))); const df = new Map(); const N = docs.length || 1;
    docs.forEach(tk => new Set(tk).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    const out = new Map();
    ids.forEach((id, i) => { const tf = new Map(); docs[i].forEach(t => tf.set(t, (tf.get(t) || 0) + 1)); const v = new Map(); let norm = 0; tf.forEach((c, t) => { const w = (1 + Math.log(c)) * Math.log(1 + N / (df.get(t) || 1)); v.set(t, w); norm += w * w; }); out.set(id, { vec: v, norm: Math.sqrt(norm) || 1 }); });
    SIN.vec = out; SIN.vecMasa = masa; SIN.vecN = R.S.docs.size; return out;
  }
  function kosinus(a, b) { if (!a || !b) return { cs: 0, sepunya: [] }; let s = 0; const sep = []; const [x, y] = a.vec.size < b.vec.size ? [a, b] : [b, a]; x.vec.forEach((w, t) => { const w2 = y.vec.get(t); if (w2) { s += w * w2; sep.push([t, w * w2]); } }); sep.sort((p, q) => q[1] - p[1]); return { cs: s / (a.norm * b.norm), sepunya: sep.slice(0, 4).map(p => p[0]) }; }
  const normT = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function serupa(id, had) {
    const a = rekod(id); const V = vektor(); const ta = teoriDalam(a); const sudah = new Set(hubungan(a).map(h => h.ke).concat(dirujukOleh(id).map(h => h.dari)));
    const calon = [];
    R.S.docs.forEach((d0, lain) => {
      if (lain === id || sudah.has(lain)) return; const b = rekod(lain); let skor = 0; const sebab = [];
      if (a.tema && a.tema === b.tema) { skor += 1; sebab.push('tema sama'); }
      const tb = teoriDalam(b); const tSama = ta.filter(t => tb.includes(t)); if (tSama.length) { skor += Math.min(2, tSama.length) * 1.2; sebab.push('teori sepunya: ' + tSama.slice(0, 3).join(', ')); }
      if (a.rekaBentuk && a.rekaBentuk === b.rekaBentuk) { skor += 0.4; sebab.push('reka bentuk ' + a.rekaBentuk.toLowerCase()); }
      if (a.jenisKesan && a.jenisKesan === b.jenisKesan && /Perantaraan|Kedua-dua/.test(a.jenisKesan)) { skor += 0.5; sebab.push('kedua-dua menguji kesan perantaraan'); }
      if (a.peringkat && a.peringkat === b.peringkat) { skor += 0.5; sebab.push('peringkat ' + a.peringkat.toLowerCase()); }
      if (a.negara && normT(a.negara) === normT(b.negara)) { skor += 0.4; sebab.push('negara ' + a.negara); }
      if (a.asasTeori && a.asasTeori === b.asasTeori && a.asasTeori !== 'Tiada') { skor += 0.3; sebab.push('asas teori ' + a.asasTeori.toLowerCase()); }
      if (a.subtopik && normT(a.subtopik) && normT(a.subtopik) === normT(b.subtopik)) { skor += 0.8; sebab.push('subtopik sama: ' + potong(a.subtopik, 40)); }
      const { cs, sepunya } = kosinus(V.get(id), V.get(lain)); if (cs >= 0.06) { skor += Math.min(3, cs * 4); sebab.push('istilah sepunya: ' + sepunya.join(', ') + ' (' + Math.round(cs * 100) + '%)'); }
      if (skor >= 1.2) calon.push({ id: lain, d: b, skor, sebab });
    });
    return calon.sort((x, y) => y.skor - x.skor).slice(0, had || 6);
  }

  /* ---- paparan ---- */
  function ringkasan(d) {
    const baris = [['Objektif', d.objektif], ['Konstruk', d.konstruk], ['Teori', d.teori], ['Kaedah', [d.rekaBentuk, d.sampel, d.teknik].filter(Boolean).join('; ')], ['Instrumen', d.instrumen], ['Dapatan', d.dapatan], ['Jurang', d.jurang], ['Relevansi', [d.relevansi, d.alasanRelevansi].filter(Boolean).join(': ')]].filter(b => String(b[1] || '').trim());
    return `<details class="sin-ringkas"><summary>Ringkasan kilat</summary><div class="sin-ringkas-isi">${baris.length ? baris.map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(potong(v, 260))}</span></div>`).join('') : '<div class="help">Medan rekod ini belum diisi.</div>'}</div></details>`;
  }
  function kepalaArtikel(id, d) {
    return `<div class="sin-nama"><span class="avatar">${esc(inisial(d))}</span><div><div class="n">${esc(nama(d))} <span class="tag">Bil. ${esc(d.bil || '?')}</span> <span class="tag ${kelasStatus(d.status)}">${esc(d.status || 'Belum dibaca')}</span>${d.tema ? ` <span class="tag">${esc(potong(d.tema, 30))}</span>` : ''}</div><div class="t">${esc(potong(d.tajuk || 'Tajuk belum diisi', 120))}</div></div></div>`;
  }
  function inisial(d) { const w = String(d.penulis || '?').replace(/et al\.?/i, '').trim().split(/\s+/).filter(Boolean); return (w.slice(0, 2).map(x => x[0]).join('') || '?').toUpperCase(); }
  const aspekHtml = h => (h.aspek || []).map(a => `<span class="tag asp">${esc(a)}</span>`).join('');
  function barisHub(h, lain, arah) {
    const ada = R.S.docs.has(lain); const d = ada ? rekod(lain) : null; const j = JENIS_PETA[h.jenis] || [h.jenis, h.jenis || 'Hubungan', ''];
    return `<div class="sin-row" data-hub="${esc(h.id || '')}" data-lain="${esc(lain)}">
      <div class="sin-jenis"><span class="tag jn ${esc(h.jenis || '')}" title="${esc(arah === 'masuk' ? 'Ditulis daripada rekod itu: artikel itu ' + j[2] + ' artikel ini' : 'Artikel ini ' + j[2] + ' artikel itu')}">${arah === 'masuk' ? '&#8592; ' : ''}${esc(j[1])}${arah === 'masuk' ? '' : ' &#8594;'}</span></div>
      <div class="sin-isi">${ada ? kepalaArtikel(lain, d) : '<div class="sin-nama"><div><div class="n">Rekod tidak ditemui (mungkin dipadam)</div></div></div>'}<div class="sin-aspek">${aspekHtml(h)}</div>${h.nota ? `<div class="sin-nota">${esc(h.nota)}</div>` : ''}${ada ? ringkasan(d) : ''}</div>
      <div class="sin-acts">${ada ? `<button class="btn btn-sm" data-bukarek="${esc(lain)}">Buka rekod</button><button class="btn btn-sm" data-banding="${esc(lain)}" title="Banding kepala ke kepala dalam menu Banding">Banding</button>` : ''}${arah === 'masuk' ? `<button class="btn btn-sm" data-balas="${esc(lain)}" title="Tulis hubungan daripada rekod ini pula (dua hala)">Balas hubungan</button>` : `<button class="btn btn-sm" data-sunting="${esc(h.id || '')}">Sunting</button><button class="btn btn-sm btn-danger" data-buang="${esc(h.id || '')}">Buang</button>`}</div>
    </div>`;
  }
  function render(d) {
    const el = $('#sintesisPanel'); if (!el) return; const id = R.S.currentId; if (!id || !d) { el.innerHTML = ''; SIN.tanda = ''; return; }
    const hub = hubungan(d); const masuk = dirujukOleh(id); const cadangan = serupa(id, 6);
    /* Panel dilukis semula hanya apabila kandungannya berubah (mergeIntoForm dipanggil pada setiap focusout borang), dan Ringkasan kilat
       yang sedang dibuka dikekalkan supaya bacaan Prof Dr tidak terganggu. */
    const tanda = JSON.stringify([id, hub, masuk.map(h => [h.dari, h.id, h.masa]), cadangan.map(c => [c.id, Math.round(c.skor * 10), c.sebab])]);
    if (tanda === SIN.tanda && el.childNodes.length) return; SIN.tanda = tanda;
    const terbuka = new Set($$('.sin-row', el).filter(r => { const dt = r.querySelector('details'); return dt && dt.open; }).map(r => r.dataset.lain + '|' + (r.dataset.hub || '')));
    el.innerHTML = `<div class="sin-head"><div><b>Rantaian sintesis</b><span class="help">Jejak artikel yang berkaitan dengan rekod ini supaya sintesis merentas artikel dapat ditulis walaupun artikel itu sudah lama dibaca: setiap hubungan menyimpan jenis, aspek dan nota, dan Ringkasan kilat memaparkan medan utama artikel itu di sini.</span></div><div class="sin-head-acts"><button class="btn btn-sm btn-primary" data-tambah="1">Tambah hubungan</button><button class="btn btn-sm" data-rangka="1" title="Jana perenggan rangka daripada semua hubungan rekod ini (tanpa token) untuk diolah dalam medan 12">Rangka sintesis</button><button class="btn btn-sm" data-peta="1" title="Kelompok artikel yang saling berkait dalam seluruh repositori">Peta sintesis</button></div></div>
      <div class="sin-sek"><h4>Hubungan daripada rekod ini <span>(${hub.length})</span></h4>${hub.length ? hub.map(h => barisHub(h, h.ke, 'keluar')).join('') : '<div class="help">Belum ada hubungan. Klik "Tambah hubungan" atau pilih daripada cadangan di bawah.</div>'}</div>
      <div class="sin-sek"><h4>Dirujuk oleh rekod lain <span>(${masuk.length})</span></h4>${masuk.length ? masuk.map(h => barisHub(h, h.dari, 'masuk')).join('') : '<div class="help">Tiada rekod lain yang menulis hubungan ke rekod ini setakat ini.</div>'}</div>
      <div class="sin-sek"><h4>Mungkin berkaitan <span>(cadangan automatik daripada medan)</span></h4>${cadangan.length ? cadangan.map(c => `<div class="sin-row cadangan" data-lain="${esc(c.id)}"><div class="sin-jenis"><span class="tag skor" title="Skor persamaan">${c.skor.toFixed(1)}</span></div><div class="sin-isi">${kepalaArtikel(c.id, c.d)}<div class="sin-sebab">${esc(c.sebab.join(' · '))}</div>${ringkasan(c.d)}</div><div class="sin-acts"><button class="btn btn-sm btn-primary" data-tambahke="${esc(c.id)}">Tambah hubungan</button><button class="btn btn-sm" data-bukarek="${esc(c.id)}">Buka rekod</button><button class="btn btn-sm" data-banding="${esc(c.id)}">Banding</button></div></div>`).join('') : '<div class="help">Tiada cadangan buat masa ini; cadangan muncul apabila medan B hingga F rekod ini dan rekod lain sudah diisi.</div>'}</div>`;
    if (terbuka.size) $$('.sin-row', el).forEach(r => { if (terbuka.has(r.dataset.lain + '|' + (r.dataset.hub || ''))) { const dt = r.querySelector('details'); if (dt) dt.open = true; } });
  }

  /* ---- tambah, sunting, buang ---- */
  function pilihanArtikel(pilih, kecuali) {
    const K = [['Selesai', 'Selesai dibaca'], ['Sedang dibaca', 'Sedang dibaca'], ['Belum dibaca', 'Belum dibaca']]; const kumpulan = {}; K.forEach(([k]) => { kumpulan[k] = []; });
    Array.from(R.S.docs.keys()).filter(id => id !== kecuali).map(id => [id, rekod(id)]).sort((x, y) => (x[1].bil || 0) - (y[1].bil || 0)).forEach(x => { const st = x[1].status || 'Belum dibaca'; (kumpulan[st] || (kumpulan[st] = [])).push(x); });
    const semua = K.map(x => x[0]).concat(Object.keys(kumpulan).filter(k => !K.some(x => x[0] === k)));
    return '<option value="">Pilih artikel</option>' + semua.map(k => { const items = kumpulan[k] || []; const label = (K.find(x => x[0] === k) || [k, k])[1]; return `<optgroup label="${esc(label)} (${items.length})">${items.map(([id, d]) => `<option value="${esc(id)}"${id === pilih ? ' selected' : ''}>Bil. ${esc(d.bil || '?')} ${esc(nama(d))}: ${esc(potong(d.tajuk, 70))}</option>`).join('')}</optgroup>`; }).join('');
  }
  async function modalHubungan(pra) {
    const id = R.S.currentId; if (!id) return; const d = rekod(id); const lama = pra && pra.id ? hubungan(d).find(h => h.id === pra.id) : null; const h = Object.assign({ ke: '', jenis: 'selari', aspek: [], nota: '' }, lama || {}, pra && !pra.id ? pra : {});
    const html = `<label for="sinKe">Artikel yang berkaitan</label><select id="sinKe" class="modal-in">${pilihanArtikel(h.ke, id)}</select>
      <label for="sinJenis">Jenis hubungan (artikel ini ... artikel itu)</label><select id="sinJenis" class="modal-in">${JENIS.map(j => `<option value="${j[0]}"${j[0] === h.jenis ? ' selected' : ''}>${esc(j[1])}: ${esc(j[2])}</option>`).join('')}</select>
      <div class="lbl-k">Aspek yang dibandingkan</div><div class="sin-cb">${ASPEK.map((a, i) => `<label><input type="checkbox" id="sinAspek_${i}" value="${esc(a)}"${(h.aspek || []).includes(a) ? ' checked' : ''}> ${esc(a)}</label>`).join('')}</div>
      <label for="sinNota">Nota ringkas (satu atau dua ayat: apa yang sama, berbeza atau dilanjutkan)</label><textarea id="sinNota" class="modal-in" rows="3" placeholder="Contohnya: kedua-duanya mengukur kompetensi digital guru dengan DigCompEdu, tetapi artikel itu menguji kesan langsung sahaja tanpa perantara.">${esc(h.nota || '')}</textarea>
      <p class="help">Hubungan ini disimpan dalam rekod ini dan dipaparkan juga dalam rekod artikel itu di bawah "Dirujuk oleh", maka cukup ditulis sekali. Rangka sintesis menyusun semua nota ini menjadi perenggan rangka.</p>`;
    const okk = await R.richModal(lama ? 'Sunting hubungan' : 'Tambah hubungan sintesis', html, 'Simpan', 'Batal'); if (!okk) return;
    const v = R.richModal.values || {}; const ke = v.sinKe; if (!ke || !R.S.docs.has(ke)) { toast('Pilih artikel yang berkaitan dahulu', true); return; }
    const baru = { id: lama ? lama.id : idBaru(), ke, jenis: JENIS_PETA[v.sinJenis] ? v.sinJenis : 'selari', aspek: ASPEK.filter((a, i) => v['sinAspek_' + i]), nota: String(v.sinNota || '').trim().replace(/\s*[—–]\s*/g, ', '), masa: Date.now() };
    const senarai = hubungan(d).filter(x => x.id !== baru.id); const pendua = senarai.find(x => x.ke === ke && x.jenis === baru.jenis); if (pendua && !lama) { const teruskan = await R.confirmBox('Hubungan serupa sudah ada', `Hubungan "${JENIS_PETA[baru.jenis][1]}" dengan ${namaId(ke)} sudah ada. Simpan sebagai hubungan tambahan?`, 'Simpan juga', false); if (!teruskan) return; }
    senarai.push(baru); await simpan(id, senarai); toast(lama ? 'Hubungan dikemas kini' : 'Hubungan disimpan: ' + JENIS_PETA[baru.jenis][1] + ' dengan ' + namaId(ke));
  }
  async function simpan(id, senarai) { try { await R.writeNow(id, { hubungan: senarai }); } catch (e) { toast('Gagal menyimpan hubungan: ' + (e && e.message || e), true); } render(rekod(id)); }
  async function buang(hid) { const id = R.S.currentId; const d = rekod(id); const h = hubungan(d).find(x => x.id === hid); if (!h) return; const okk = await R.confirmBox('Buang hubungan?', `Hubungan "${JENIS_PETA[h.jenis] ? JENIS_PETA[h.jenis][1] : h.jenis}" dengan ${namaId(h.ke)} akan dibuang daripada rekod ini.`, 'Buang'); if (!okk) return; await simpan(id, hubungan(d).filter(x => x.id !== hid)); toast('Hubungan dibuang'); }

  /* ---- rangka sintesis: perenggan rangka daripada hubungan (deterministik, tanpa token) ---- */
  function ayat(namaA, namaB, h) {
    const asp = (h.aspek || []).length ? ' dari segi ' + (h.aspek || []).map(a => a.toLowerCase()).join(', ') : ''; const nota = (h.nota || '').trim().replace(/[.。]\s*$/, '');
    const n = nota ? ': ' + nota : '';
    switch (h.jenis) {
      case 'bercanggah': return `${namaA} bercanggah dengan ${namaB}${asp}${n}.`;
      case 'melanjutkan': return `${namaA} melanjutkan ${namaB}${asp}${n}.`;
      case 'melengkapi': return `${namaA} melengkapi ${namaB}${asp}${n}.`;
      case 'mengulang': return `${namaA} mengulang dapatan ${namaB}${asp}${n}.`;
      case 'berbeza': return `${namaA} berkongsi persamaan umum dengan ${namaB} tetapi berbeza${asp}${n}.`;
      default: return `${namaA} selari dengan ${namaB}${asp}${n}.`;
    }
  }
  function rangkaTeks(id) {
    const d = rekod(id); const A = nama(d); const keluar = hubungan(d).filter(h => R.S.docs.has(h.ke)).map(h => ({ h, a: A, b: namaId(h.ke) })); const masuk = dirujukOleh(id).filter(h => R.S.docs.has(h.dari)).map(h => ({ h, a: namaId(h.dari), b: A }));
    const semua = keluar.concat(masuk); if (!semua.length) return '';
    const kump = (jenis) => semua.filter(x => jenis.includes(x.h.jenis)).map(x => ayat(x.a, x.b, x.h));
    const p1 = kump(['selari', 'mengulang', 'melengkapi']), p2 = kump(['bercanggah', 'berbeza']), p3 = kump(['melanjutkan']);
    const para = [];
    if (p1.length) para.push('Dari segi persamaan dan sokongan, kajian ' + p1.join(' '));
    if (p2.length) para.push('Walau bagaimanapun, perbezaan turut wujud. ' + p2.join(' '));
    if (p3.length) para.push('Dari segi kesinambungan, kajian ' + p3.join(' '));
    para.push(`Secara keseluruhan, [lengkapkan: pola yang muncul daripada ${semua.length} hubungan di atas, misalnya aspek yang disepakati, aspek yang masih dipertikaikan, dan kedudukan kajian ini dalam perbualan itu].`);
    return para.join('\n\n');
  }
  async function rangkaModal() {
    const id = R.S.currentId; if (!id) return; const teks = rangkaTeks(id);
    if (!teks) { toast('Belum ada hubungan untuk disusun. Tambah hubungan dahulu.', true); return; }
    const html = `<p class="help">Perenggan rangka disusun daripada setiap hubungan (jenis, aspek dan nota), termasuk hubungan yang ditulis daripada rekod lain ke rekod ini. Ia rangka untuk diolah, bukan teks akhir; bahagian dalam kurungan siku perlu dilengkapkan.</p><textarea id="sinRangka" class="modal-in" rows="12">${esc(teks)}</textarea><p class="help">"Masukkan ke medan 12" menambah rangka ini di hujung teks Bandingan silang rekod ini (teks sedia ada dikekalkan).</p>`;
    const okk = await R.richModal('Rangka sintesis: ' + namaId(id), html, 'Masukkan ke medan 12', 'Tutup'); if (!okk) return;
    const v = (R.richModal.values || {}).sinRangka || teks; const d = rekod(id); const lama = String(d.bandingan || '').trim(); const baru = (lama ? lama + '\n\n' : '') + v.trim();
    try { await R.writeNow(id, { bandingan: baru }); const ta = $('#f_bandingan'); if (ta) ta.value = baru; toast('Rangka dimasukkan ke medan 12 Bandingan silang'); } catch (e) { toast('Gagal menyimpan: ' + (e && e.message || e), true); }
  }

  /* ---- peta sintesis seluruh repositori: kelompok artikel yang saling berkait ---- */
  function kelompok(edges) {
    const induk = new Map(); const cari = x => { while (induk.get(x) !== x) { induk.set(x, induk.get(induk.get(x))); x = induk.get(x); } return x; };
    const tambah = x => { if (!induk.has(x)) induk.set(x, x); };
    edges.forEach(e => { tambah(e.dari); tambah(e.ke); const a = cari(e.dari), b = cari(e.ke); if (a !== b) induk.set(a, b); });
    const groups = new Map(); induk.forEach((v, k) => { const r = cari(k); if (!groups.has(r)) groups.set(r, { ahli: new Set(), edges: [] }); groups.get(r).ahli.add(k); });
    edges.forEach(e => { groups.get(cari(e.dari)).edges.push(e); });
    return Array.from(groups.values()).map(g => ({ ahli: Array.from(g.ahli), edges: g.edges })).sort((x, y) => y.ahli.length - x.ahli.length || y.edges.length - x.edges.length);
  }
  function petaHtml(aspek, jenis) {
    let edges = semuaHubungan().filter(e => R.S.docs.has(e.ke)); if (aspek) edges = edges.filter(e => (e.aspek || []).includes(aspek)); if (jenis) edges = edges.filter(e => e.jenis === jenis);
    const kel = kelompok(edges); const semuaN = new Set(); edges.forEach(e => { semuaN.add(e.dari); semuaN.add(e.ke); });
    const kepala = `<div class="sin-peta-tapis"><label>Aspek <select id="sinPetaAspek" class="modal-in"><option value="">Semua aspek</option>${ASPEK.map(a => `<option value="${esc(a)}"${a === aspek ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select></label><label>Jenis <select id="sinPetaJenis" class="modal-in"><option value="">Semua jenis</option>${JENIS.map(j => `<option value="${j[0]}"${j[0] === jenis ? ' selected' : ''}>${esc(j[1])}</option>`).join('')}</select></label><span class="help">${edges.length} hubungan, ${semuaN.size} artikel, ${kel.length} kelompok.</span><button class="btn btn-sm" data-petacsv="1">Eksport CSV</button></div>`;
    if (!kel.length) return kepala + '<div class="help">Belum ada hubungan sintesis yang sepadan. Tambah hubungan dalam medan 12 setiap rekod.</div>';
    return kepala + kel.map((g, i) => `<div class="sin-kel"><h4>Kelompok ${i + 1} <span>${g.ahli.length} artikel · ${g.edges.length} hubungan</span> <button class="btn btn-sm" data-rangkakel="${i}" title="Perenggan rangka daripada semua hubungan kelompok ini">Rangka kelompok</button></h4><div class="sin-kel-ahli">${g.ahli.map(id => { const d = rekod(id); return `<button class="sin-chip" data-bukarek="${esc(id)}" title="${esc(potong(d.tajuk, 140))}">${esc(nama(d))} <small>Bil. ${esc(d.bil || '?')}</small></button>`; }).join('')}</div><table class="sin-tbl"><thead><tr><th>Daripada</th><th>Hubungan</th><th>Kepada</th><th>Aspek</th><th>Nota</th></tr></thead><tbody>${g.edges.map(e => `<tr><td>${esc(namaId(e.dari))}</td><td><span class="tag jn ${esc(e.jenis)}">${esc((JENIS_PETA[e.jenis] || [0, e.jenis])[1])}</span></td><td>${esc(namaId(e.ke))}</td><td>${esc((e.aspek || []).join(', '))}</td><td>${esc(e.nota || '')}</td></tr>`).join('')}</tbody></table></div>`).join('');
  }
  async function petaModal() {
    let aspek = '', jenis = ''; const modal = $('#modalText'); let kel = [];
    const lukis = () => { modal.innerHTML = petaHtml(aspek, jenis); let edges = semuaHubungan().filter(e => R.S.docs.has(e.ke)); if (aspek) edges = edges.filter(e => (e.aspek || []).includes(aspek)); if (jenis) edges = edges.filter(e => e.jenis === jenis); kel = kelompok(edges); };
    let tindak = null;
    const onChange = e => { if (e.target.id === 'sinPetaAspek') { aspek = e.target.value; lukis(); } else if (e.target.id === 'sinPetaJenis') { jenis = e.target.value; lukis(); } };
    const onClick = e => {
      const b = e.target.closest('[data-bukarek]'); if (b) { tindak = { buka: b.dataset.bukarek }; $('#modalOk').click(); return; }
      const rk = e.target.closest('[data-rangkakel]'); if (rk) { tindak = { rangka: kel[+rk.dataset.rangkakel] }; $('#modalOk').click(); return; }
      if (e.target.closest('[data-petacsv]')) { petaCsv(aspek, jenis); }
    };
    modal.addEventListener('click', onClick); modal.addEventListener('change', onChange); const kad = $('#modal .modal-card'); if (kad) kad.classList.add('lebar');
    const p = R.richModal('Peta sintesis seluruh repositori', '<div class="help">Memuatkan...</div>', 'Tutup'); lukis(); await p;
    modal.removeEventListener('click', onClick); modal.removeEventListener('change', onChange); if (kad) kad.classList.remove('lebar');
    if (tindak && tindak.buka) { setTimeout(() => R.openRecord(tindak.buka), 60); }
    else if (tindak && tindak.rangka) { setTimeout(() => rangkaKelompokModal(tindak.rangka), 60); }
  }
  function rangkaKelompok(g) {
    const edges = g.edges.map(e => ({ h: e, a: namaId(e.dari), b: namaId(e.ke) }));
    const kump = jenis => edges.filter(x => jenis.includes(x.h.jenis)).map(x => ayat(x.a, x.b, x.h));
    const p1 = kump(['selari', 'mengulang', 'melengkapi']), p2 = kump(['bercanggah', 'berbeza']), p3 = kump(['melanjutkan']); const para = [];
    para.push(`Kelompok ini menghimpunkan ${g.ahli.length} kajian yang saling berkait: ${g.ahli.map(namaId).join('; ')}.`);
    if (p1.length) para.push('Dari segi persamaan dan sokongan, kajian ' + p1.join(' '));
    if (p2.length) para.push('Walau bagaimanapun, perbezaan turut wujud. ' + p2.join(' '));
    if (p3.length) para.push('Dari segi kesinambungan, kajian ' + p3.join(' '));
    para.push('Secara keseluruhan, [lengkapkan: pola yang muncul daripada kelompok ini dan kedudukan kajian Prof Dr dalam perbualan itu].');
    return para.join('\n\n');
  }
  async function rangkaKelompokModal(g) {
    const teks = rangkaKelompok(g);
    const html = `<p class="help">Perenggan rangka daripada semua hubungan dalam kelompok ini, untuk diolah menjadi sintesis Bab 2 atau artikel. Salin ke RAM seksyen Tulisan atau Artikel.</p><textarea id="sinRangkaKel" class="modal-in" rows="14">${esc(teks)}</textarea>`;
    const okk = await R.richModal('Rangka sintesis kelompok', html, 'Salin', 'Tutup'); if (!okk) return;
    const v = (R.richModal.values || {}).sinRangkaKel || teks; try { await navigator.clipboard.writeText(v); toast('Rangka kelompok disalin ke papan keratan'); } catch (e) { toast('Papan keratan tidak tersedia', true); }
  }
  function petaCsv(aspek, jenis) {
    let edges = semuaHubungan().filter(e => R.S.docs.has(e.ke)); if (aspek) edges = edges.filter(e => (e.aspek || []).includes(aspek)); if (jenis) edges = edges.filter(e => e.jenis === jenis);
    const sel = v => { const s = String(v ?? '').replace(/\r\n|\r|\n/g, '\n'); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows = [['Bil. daripada', 'Daripada', 'Hubungan', 'Bil. kepada', 'Kepada', 'Aspek', 'Nota', 'Masa'].map(sel).join(',')].concat(edges.map(e => { const a = rekod(e.dari), b = rekod(e.ke); return [a.bil || '', nama(a), (JENIS_PETA[e.jenis] || [0, e.jenis])[1], b.bil || '', nama(b), (e.aspek || []).join('; '), e.nota || '', e.masa ? R.fmtTime(e.masa) : ''].map(sel).join(','); }));
    const d = new Date(); const st = d.toISOString().slice(0, 10) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    R.saveFile(`Peta_Sintesis_${st}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8'); toast('Peta sintesis dieksport sebagai CSV');
  }
  function teksCsv(d) { return hubungan(d).map(h => `${(JENIS_PETA[h.jenis] || [0, h.jenis])[1]} ${namaId(h.ke)}${(h.aspek || []).length ? ' [' + h.aspek.join(', ') + ']' : ''}${h.nota ? ': ' + h.nota : ''}`).join('; '); }

  /* ---- peristiwa ---- */
  const root = $('#rekod');
  if (root) {
    root.addEventListener('click', e => {
      const panel = e.target.closest('#sintesisPanel'); if (!panel) return;
      if (e.target.closest('[data-tambah]')) { modalHubungan(null); return; }
      const tk = e.target.closest('[data-tambahke]'); if (tk) { modalHubungan({ ke: tk.dataset.tambahke }); return; }
      const bl = e.target.closest('[data-balas]'); if (bl) { modalHubungan({ ke: bl.dataset.balas }); return; }
      const su = e.target.closest('[data-sunting]'); if (su) { modalHubungan({ id: su.dataset.sunting }); return; }
      const bg = e.target.closest('[data-buang]'); if (bg) { buang(bg.dataset.buang); return; }
      if (e.target.closest('[data-rangka]')) { rangkaModal(); return; }
      if (e.target.closest('[data-peta]')) { petaModal(); return; }
      const br = e.target.closest('[data-bukarek]'); if (br) { R.openRecord(br.dataset.bukarek); return; }
      const bd = e.target.closest('[data-banding]'); if (bd && R.Banding) { R.Banding.state.a = R.S.currentId; R.Banding.state.b = bd.dataset.banding; R.goView('banding'); R.Banding.banding(); }
    });
  }
  return { render, serupa, rangkaTeks, dirujukOleh, semuaHubungan, kelompok, teksCsv, modalHubungan, petaModal, JENIS, ASPEK };
}
