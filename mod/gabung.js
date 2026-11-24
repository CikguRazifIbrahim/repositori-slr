/* Draf Tesis (v1.47.0): tab keenam dalam Tulisan Tesis, selepas Bab 5.
   Butang "Gabung" menghimpun ASAL semua seksyen Bab 1 hingga Bab 5 menjadi satu dokumen (paparan pada skrin dan fail Word), menulis
   nota ringkas berwarna tentang setiap penambahan pada hari itu, dan menaikkan kiraan "Draf Nombor:".
   (1) Draf Nombor ialah kiraan tekanan butang Gabung, bukan kiraan hari: Gabung hari ini = Draf Nombor: 1; jika butang itu tidak ditekan
       esok dan ditekan semula pada hari Khamis, Khamis ialah Draf Nombor: 2. Setiap draf direkodkan dengan cap masa; nombornya ialah
       kedudukan draf itu mengikut masa, maka rekod daripada dua peranti bergabung tanpa nombor berulang. Draf terakhir boleh dibatalkan.
   (2) Nota aktiviti hari itu diambil daripada log harian setiap bab (patah perkataan ditambah atau dikurangkan bagi setiap seksyen),
       seksyen yang dicipta atau dipadam hari itu, dan, pada peranti yang digunakan untuk menulis, perenggan yang ditambah atau diubah hari
       itu. Yang terakhir ini bersandar pada "asas harian": cap jari perenggan setiap seksyen sebelum suntingan pertamanya pada hari itu,
       disimpan pada peranti ini sahaja (tidak ke awan, supaya dokumen bab tidak membesar).
   (3) Nota juga merumuskan perubahan sejak draf terdahulu (jumlah patah dan pecahan mengikut hari), kerana Gabung tidak semestinya
       ditekan setiap hari.
   Simpanan: meta/tulisan_draf (rekod draf) dan salinan tempatan. Dokumen gabungan dibina daripada kandungan semasa setiap kali tab dibuka;
   salinan beku setiap draf ialah fail Word yang dimuat turun (dan diarkibkan dalam folder Tulisan di Google Drive jika disambung). */
export function initGabung(R, H) {
  const { esc, toast } = R;
  const $ = s => document.querySelector(s);
  const KUNCI = 'meta/tulisan_draf', LS = 'rslr_tulisan_draf', LS_ASAS = 'rslr_tulisan_asas_harian';
  const HAD_ITEM = 40, HAD_PENUH = 20, HAD_REKOD = 150;
  const WARNA = { tambah: '2E8B57', kurang: 'C0392B', baru: '2F6DB5', sunting: '7A8694' };
  const G = { d: null, dimuat: false, sibuk: false, dok: false, asas: null };
  const angka = n => Number(n || 0).toLocaleString('en-US');
  const tanda = n => (n > 0 ? '+' : n < 0 ? '−' : '') + angka(Math.abs(n));
  const hariIni = () => H.hariIni();
  const jam = ms => { try { return new Date(ms).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const potongKata = (t, n) => { t = String(t || ''); if (t.length <= n) return t; const p = t.slice(0, n); const i = p.lastIndexOf(' '); return (i > n * 0.6 ? p.slice(0, i) : p) + ' …'; };

  /* ---------------- rekod draf ---------------- */
  const kosong = () => ({ v: 1, rekod: {}, masa: 0 });
  function data() { if (!G.d) { const l = R.lsGet(LS, null); G.d = l && l.rekod ? l : kosong(); } return G.d; }
  function gabungData(a, b) {
    const out = kosong(); const ra = (a && a.rekod) || {}, rb = (b && b.rekod) || {};
    new Set(Object.keys(ra).concat(Object.keys(rb))).forEach(id => { const x = ra[id], y = rb[id]; out.rekod[id] = !x ? y : !y ? x : (y.ubah || y.masa || 0) > (x.ubah || x.masa || 0) ? y : x; });
    out.masa = Math.max((a && a.masa) || 0, (b && b.masa) || 0); return out;
  }
  async function muat() { let awan = null; try { awan = await R.db().get(KUNCI); } catch (e) {} if (awan && awan.rekod) { G.d = gabungData(data(), awan); R.lsSet(LS, G.d); } G.dimuat = true; return G.d; }
  async function simpan(ids) {
    const d = data(); d.masa = Date.now(); R.lsSet(LS, d); const patch = { v: 1, rekod: {}, masa: d.masa }; ids.forEach(id => { if (d.rekod[id]) patch.rekod[id] = d.rekod[id]; });
    try { await R.db().set(KUNCI, patch, true); return true; } catch (e) { console.warn('gabung: simpanan awan gagal', e); return false; }
  }
  /* Draf yang sah mengikut masa; nombor draf ialah kedudukannya (1, 2, 3, ...). */
  function senaraiDraf() { return Object.values(data().rekod).filter(r => r && r.id && !r.batal).sort((a, b) => (a.masa || 0) - (b.masa || 0)).map((r, i) => Object.assign({}, r, { no: i + 1 })); }
  const drafAkhir = () => { const s = senaraiDraf(); return s[s.length - 1] || null; };

  /* ---------------- asas harian (peranti ini sahaja) ---------------- */
  const badan = html => new DOMParser().parseFromString('<!doctype html><html><body>' + (html || '') + '</body></html>', 'text/html').body;
  function capTeks(t) { const s = String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ''); if (!s) return ''; let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + '.' + s.length.toString(36); }
  function capElemen(e) { const c = capTeks(e.textContent); if (c) return c; const im = e.tagName === 'IMG' ? e : e.querySelector && e.querySelector('img'); return im ? 'img.' + (im.getAttribute('data-imej') || im.getAttribute('alt') || '') : ''; }
  function asasHari() { const h = hariIni(); if (G.asas && G.asas.tarikh === h) return G.asas; const a = R.lsGet(LS_ASAS, null); G.asas = a && a.tarikh === h && a.s ? a : { tarikh: h, s: {} }; return G.asas; }
  /* Dipanggil oleh tulisSeksyen sebelum seksyen diubah: cap jari perenggan sebelum suntingan pertama hari ini. */
  function catatAsas(n, id, s) {
    try { const a = asasHari(); const k = n + ':' + id; if (a.s[k]) return; const c = Array.from(badan(s ? H.htmlSeksyen(s) : '').children).map(capElemen).filter(Boolean); if (c.length > 800) return; a.s[k] = c; R.lsSet(LS_ASAS, a); }
    catch (e) { console.warn('gabung: asas harian gagal', e); }
  }
  const petik = t => { const w = String(t || '').replace(/\s+/g, ' ').trim().split(' '); return w.slice(0, 12).join(' ') + (w.length > 12 ? ' …' : ''); };
  /* Perenggan (atau jadual, senarai, rajah) dalam seksyen yang tiada dalam asas harian: ditambah atau diubah hari ini. null jika tiada asas. */
  function blokHariIni(n, id, s) {
    const a = asasHari().s[n + ':' + id]; if (!a) return null; const set = new Set(a); const out = [];
    Array.from(badan(H.htmlSeksyen(s) || '').children).forEach(e => { const c = capElemen(e); if (c && !set.has(c)) out.push({ c, t: petik(e.tagName === 'TABLE' ? 'Jadual: ' + e.textContent : e.textContent || 'Rajah') }); });
    return out;
  }

  /* ---------------- aktiviti hari itu dan perubahan sejak draf terdahulu ---------------- */
  const jumlah = () => H.unit().reduce((s, [n]) => s + H.jumlahPatah(n), 0);
  function aktiviti(t) {
    const item = []; const hariSemasa = t === hariIni();
    H.unit().forEach(([n]) => {
      const d = H.doc(n); const l = (d.log || {})[t] || null; const nb = H.nombor(n); const susun = H.senarai(n);
      const ids = new Set(l ? Object.keys(l.seksyen || {}).concat(Object.keys(l.masa || {})) : []);
      const baruHari = s => !!s && H.tarikhStr(s.cipta || 0) === t && !(s.sumber && s.sumber.jenis === 'templat');
      Object.keys(d.seksyen || {}).forEach(id => { if (baruHari(d.seksyen[id])) ids.add(id); });
      ids.forEach(id => {
        const s = d.seksyen[id]; if (!s) return; const delta = l && l.seksyen ? (l.seksyen[id] || 0) : 0; const baru = baruHari(s); const padam = !!s.padam;
        const blok = hariSemasa && !padam ? blokHariIni(n, id, s) : null;
        if (!delta && !baru && !padam && !(blok && blok.length)) { if (blok) return; /* asas ada dan ASAL tidak berubah: hanya RAM atau tajuk disentuh */ }
        item.push({ n, id, no: nb[id] ? nb[id].no : '', tajuk: String(s.tajuk || 'Tanpa tajuk').slice(0, 140), delta, baru, padam, nBlok: blok ? blok.length : null, petik: blok ? blok.slice(0, 2).map(b => potongKata(b.t, 90)) : [], kedudukan: susun.indexOf(id) });
      });
    });
    item.sort((a, b) => (a.n - b.n) || ((a.kedudukan < 0 ? 1e9 : a.kedudukan) - (b.kedudukan < 0 ? 1e9 : b.kedudukan)));
    const tambah = item.reduce((s, x) => s + (x.delta > 0 ? x.delta : 0), 0), kurang = item.reduce((s, x) => s + (x.delta < 0 ? x.delta : 0), 0);
    return { tarikh: t, item, tambah, kurang, bersih: tambah + kurang, nSek: item.length, nBab: new Set(item.map(x => x.n)).size, nBaru: item.filter(x => x.baru && !x.padam).length, nPadam: item.filter(x => x.padam).length };
  }
  /* Perubahan sejak draf terdahulu: beza jumlah patah, dan jumlah bersih setiap hari selepas tarikh draf itu (daripada log harian). */
  function sejak(prev) {
    if (!prev) return null; const hari = {};
    H.unit().forEach(([n]) => { const lg = H.doc(n).log || {}; Object.keys(lg).forEach(k => { if (k > prev.tarikh && k <= hariIni() && lg[k] && lg[k].patah) hari[k] = (hari[k] || 0) + lg[k].patah; }); });
    return { no: prev.no, tarikh: prev.tarikh, dahulu: prev.patah || 0, kini: jumlah(), beza: jumlah() - (prev.patah || 0), hari: Object.keys(hari).sort().map(k => ({ t: k, v: hari[k] })).filter(x => x.v) };
  }
  const tarikhPendek = ymd => { const d = new Date(ymd + 'T00:00:00'); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'][d.getMonth()]; };

  /* ---------------- nota berwarna ---------------- */
  const namaBab = n => 'Bab ' + n + ' ' + H.tajukBab(n);
  function barisItem(x) {
    /* pulangkan bahagian nota bagi satu seksyen: [{ t, jenis }] dengan jenis tambah | kurang | baru | sunting | '' */
    const out = [{ t: (x.no ? x.no + ' ' : '') + x.tajuk + ': ', jenis: '' }];
    if (x.padam) out.push({ t: 'seksyen dipadam' + (x.delta ? ' (' + tanda(x.delta) + ' patah)' : ''), jenis: 'kurang' });
    else {
      if (x.baru) out.push({ t: 'seksyen baharu', jenis: 'baru' });
      if (x.delta > 0) out.push({ t: (x.baru ? ', ' : '') + tanda(x.delta) + ' patah', jenis: 'tambah' }); else if (x.delta < 0) out.push({ t: (x.baru ? ', ' : '') + tanda(x.delta) + ' patah', jenis: 'kurang' });
      if (x.nBlok) out.push({ t: (x.baru || x.delta ? '; ' : '') + x.nBlok + (x.delta < 0 ? ' perenggan diubah' : ' perenggan ditambah atau diubah'), jenis: x.delta < 0 ? 'sunting' : 'tambah' });
      if (!x.baru && !x.delta && !x.nBlok) out.push({ t: 'disunting tanpa perubahan bilangan patah', jenis: 'sunting' });
    }
    return out;
  }
  function ringkasHari(a) {
    if (!a.item.length) return [{ t: 'Tiada penambahan atau suntingan direkodkan pada hari ini.', jenis: 'sunting' }];
    const out = [];
    if (a.tambah) out.push({ t: tanda(a.tambah) + ' patah ditambah', jenis: 'tambah' });
    if (a.kurang) out.push({ t: a.tambah ? ', ' : '', jenis: '' }, { t: tanda(a.kurang) + ' patah dikurangkan', jenis: 'kurang' });
    if (a.tambah && a.kurang) out.push({ t: ' (bersih ' + tanda(a.bersih) + ')', jenis: '' });
    if (!a.tambah && !a.kurang) out.push({ t: 'Suntingan tanpa perubahan bilangan patah', jenis: 'sunting' });
    out.push({ t: ` dalam ${a.nSek} seksyen merentas ${a.nBab} bab`, jenis: '' });
    if (a.nBaru) out.push({ t: '; ', jenis: '' }, { t: a.nBaru + ' seksyen baharu', jenis: 'baru' });
    if (a.nPadam) out.push({ t: '; ', jenis: '' }, { t: a.nPadam + ' seksyen dipadam', jenis: 'kurang' });
    out.push({ t: '.', jenis: '' }); return out;
  }
  const span = b => (b.jenis ? `<span class="gb-${b.jenis}">${esc(b.t)}</span>` : esc(b.t));
  function htmlNota(a, sj, tajuk) {
    const kump = new Map(); a.item.forEach(x => { if (!kump.has(x.n)) kump.set(x.n, []); kump.get(x.n).push(x); });
    const lebih = a.lebih ? `<li class="gb-sunting">dan ${angka(a.lebih)} seksyen lagi</li>` : '';
    const senarai = Array.from(kump.entries()).map(([n, xs]) => { const b = xs.reduce((s, x) => s + x.delta, 0); return `<li><b>${esc(namaBab(n))}</b>${b ? ` <span class="gb-${b > 0 ? 'tambah' : 'kurang'}">${tanda(b)} patah</span>` : ''}<ul>${xs.map(x => `<li>${barisItem(x).map(span).join('')}${(x.petik || []).length ? `<div class="gb-petik">${x.petik.map(p => '<q>' + esc(p) + '</q>').join(' ')}</div>` : ''}</li>`).join('')}</ul></li>`; }).join('');
    const sejakHtml = sj ? `<p class="gb-sejak"><b>Sejak Draf Nombor: ${sj.no}</b> (${esc(H.tarikhPanjang(sj.tarikh))}): <span class="gb-${sj.beza > 0 ? 'tambah' : sj.beza < 0 ? 'kurang' : 'sunting'}">${tanda(sj.beza) || '0'} patah</span> (${angka(sj.dahulu)} kepada ${angka(sj.kini)} patah)${sj.hari.length ? '. Mengikut hari: ' + sj.hari.map(x => `${esc(tarikhPendek(x.t))} <span class="gb-${x.v > 0 ? 'tambah' : 'kurang'}">${tanda(x.v)}</span>`).join(' · ') : ''}.</p>` : '';
    return `<div class="gb-nota"><h3>${esc(tajuk)}</h3><p class="gb-ringkas">${ringkasHari(a).map(span).join('')}</p>${senarai ? `<ul class="gb-senarai">${senarai}${lebih}</ul>` : ''}${sejakHtml}<p class="gb-legenda"><span class="gb-tambah">&#9679; ditambah</span><span class="gb-kurang">&#9679; dikurangkan atau dipadam</span><span class="gb-baru">&#9679; seksyen baharu</span><span class="gb-sunting">&#9679; disunting</span></p></div>`;
  }

  /* ---------------- dokumen gabungan ---------------- */
  function cip(x) { if (!x) return ''; const b = barisItem(x).slice(1).filter(p => p.jenis); return b.length ? ` <span class="gb-cip">${b.map(p => `<span class="gb-${p.jenis}">${esc(p.t.replace(/^[,;]\s*/, ''))}</span>`).join(' ')} hari ini</span>` : ''; }
  function htmlDok(a) {
    const peta = new Map(a.item.map(x => [x.n + ':' + x.id, x])); let out = '';
    H.unit().forEach(([n, t]) => {
      const d = H.doc(n); const nb = H.nombor(n); const ids = H.senarai(n);
      out += `<section class="gb-bab"><h2 class="gb-bab-h"><span>BAB ${esc(String(n))}</span>${esc(String(t).toUpperCase())}</h2>`;
      if (!ids.length) out += '<p class="help">(Bab ini belum ada seksyen dalam sistem.)</p>';
      ids.forEach(id => { const s = d.seksyen[id]; const k = nb[id] || { no: '', aras: 1 }; const tg = 'h' + Math.min(6, k.aras + 2);
        out += `<${tg} class="gb-h a${k.aras}">${esc(k.no)} ${esc(s.tajuk || 'Tanpa tajuk')}${cip(peta.get(n + ':' + id))}</${tg}><div class="gb-isi" data-gbsek="${esc(n + ':' + id)}">${H.htmlSeksyen(s) || ''}</div>`; });
      out += '</section>';
    });
    return out;
  }
  /* tandakan perenggan yang ditambah atau diubah hari ini (jika asas harian ada pada peranti ini) */
  function tandaHari(root) {
    const a = asasHari().s; root.querySelectorAll('[data-gbsek]').forEach(el => { const asas = a[el.dataset.gbsek]; if (!asas) return; const set = new Set(asas); Array.from(el.children).forEach(e => { const c = capElemen(e); if (c && !set.has(c)) e.classList.add('gb-hari'); }); });
  }

  /* ---------------- paparan ---------------- */
  function tabHtml(on) {
    const d = drafAkhir();
    return `<button class="tul-tab gb-tab${on ? ' on' : ''}" data-draf="1" title="Gabungan Bab 1 hingga Bab 5 dalam satu dokumen, nota aktiviti hari ini dan kiraan draf"><span class="b">Draf Tesis</span><span class="t">Gabungan Bab 1 hingga Bab 5</span><span class="m">${d ? `Draf Nombor: ${d.no} · ${esc(tarikhPendek(d.tarikh))}` : 'Draf Nombor: belum ada'}</span></button>`;
  }
  function htmlSejarah(s) {
    if (!s.length) return '';
    const baris = s.slice().reverse().map((r, i) => `<tr><td><b>${r.no}</b></td><td>${esc(R.fmtTime(r.masa))}</td><td>${angka(r.patah)}</td><td>${r.sejak ? `<span class="gb-${r.sejak.beza > 0 ? 'tambah' : r.sejak.beza < 0 ? 'kurang' : 'sunting'}">${tanda(r.sejak.beza) || '0'}</span>` : ''}</td><td>${r.hari ? ringkasHari(r.hari).map(span).join('') : ''}</td><td>${r.fail && r.fail.link ? `<a href="${esc(r.fail.link)}" target="_blank" rel="noopener">${esc(r.fail.nama || 'Word')}</a>` : r.fail ? esc(r.fail.nama || '') : ''}</td><td>${i === 0 ? `<button class="btn btn-sm" data-gb="batal" data-id="${esc(r.id)}" title="Batalkan draf terakhir; kiraan Draf Nombor turun semula">Batalkan</button>` : ''}</td></tr>`).join('');
    return `<details class="gb-sejarah"><summary><b>Sejarah draf</b> <span class="ring">${s.length} draf direkodkan</span></summary><div class="sm-wrap"><table class="sm-tbl"><thead><tr><th>Draf Nombor</th><th>Digabung pada</th><th>Jumlah patah</th><th>Sejak draf terdahulu</th><th>Aktiviti hari itu</th><th>Fail Word</th><th></th></tr></thead><tbody>${baris}</tbody></table></div></details>`;
  }
  function render() {
    const el = $('#tulDraf'); if (!el) return; const s = senaraiDraf(); const akhir = s[s.length - 1] || null; const a = aktiviti(hariIni()); const kini = jumlah();
    const berubah = akhir ? kini - (akhir.patah || 0) : 0;
    const status = !akhir ? 'Belum ada draf. Tekan Gabung untuk menghimpun Bab 1 hingga Bab 5 dan merekodkan Draf Nombor: 1.'
      : `Draf Nombor: ${akhir.no} digabung pada ${R.fmtTime(akhir.masa)} (${angka(akhir.patah)} patah).${berubah ? ` Sejak itu ${tanda(berubah)} patah; tekan Gabung untuk merekodkan Draf Nombor: ${akhir.no + 1}.` : ' Tiada perubahan bilangan patah sejak itu.'}`;
    const notaAkhir = akhir && akhir.tarikh === hariIni() && akhir.hari ? htmlNota(akhir.hari, akhir.sejak, `Nota aktiviti Draf Nombor: ${akhir.no} (${H.tarikhPanjang(akhir.tarikh)})`) : '';
    const notaKini = !notaAkhir || berubah ? htmlNota(a, akhir && akhir.tarikh !== hariIni() ? sejak(akhir) : null, notaAkhir ? 'Aktiviti hari ini selepas draf itu (belum digabung)' : `Aktiviti hari ini setakat ini (${H.tarikhPanjang(hariIni())}; belum digabung)`) : '';
    el.innerHTML = `<div class="gb-head">
        <div class="gb-tajuk"><h2>Draf Tesis</h2><p class="sub">Gabungan Bab 1 hingga Bab 5 dalam satu dokumen. Setiap kali butang Gabung ditekan, satu draf baharu direkodkan bersama nota aktiviti hari itu. Draf Nombor mengira tekanan butang Gabung, bukan bilangan hari.</p></div>
        <div class="gb-kira" aria-live="polite"><span class="lbl">Draf Nombor:</span><b id="gbNombor">${akhir ? akhir.no : 0}</b><span class="m">${akhir ? esc(H.tarikhPanjang(akhir.tarikh)) : 'belum digabung'}</span></div>
        <div class="gb-acts"><button class="btn btn-primary gb-btn" data-gb="gabung"${G.sibuk ? ' disabled' : ''}>${G.sibuk ? 'Sedang menggabung' : 'Gabung'}</button><button class="btn" data-gb="word"${akhir && !G.sibuk ? '' : ' disabled'} title="Jana fail Word draf terakhir: muka depan dengan Draf Nombor dan nota aktiviti, diikuti Bab 1 hingga Bab 5">Muat turun Word${akhir ? ' (Draf ' + akhir.no + ')' : ''}</button></div>
      </div>
      <p class="gb-status">${esc(status)}</p>
      ${notaAkhir}${notaKini}
      ${htmlSejarah(s)}
      ${G.dok || akhir ? `<div class="gb-dok-h"><b>Dokumen gabungan</b><span>${angka(kini)} patah perkataan dalam ${H.unit().reduce((t, [n]) => t + H.senarai(n).length, 0)} seksyen, dihimpun daripada kandungan semasa ASAL Bab 1 hingga Bab 5 (RAM tidak disertakan). Perenggan bertanda hijau ditambah atau diubah hari ini pada peranti ini.</span></div><article class="gb-dok" id="gbDok"><header class="gb-muka"><h1>Draf Tesis</h1><p><b>Draf Nombor: ${akhir ? akhir.no : 0}</b>${akhir ? ' · ' + esc(R.fmtTime(akhir.masa)) : ''}</p></header>${htmlDok(a)}</article>` : '<div class="tul-kosong"><h3>Dokumen gabungan akan dipaparkan di sini</h3><p>Tekan <b>Gabung</b> untuk menghimpun semua seksyen Bab 1 hingga Bab 5 (ASAL sahaja) menjadi satu dokumen, merekodkan nota aktiviti hari ini dan memulakan kiraan Draf Nombor.</p></div>'}`;
    const dok = $('#gbDok'); if (dok) { tandaHari(dok); if (H.pasangImej) H.pasangImej(dok); }
    if (!G.dimuat) { G.dimuat = true; muat().then(() => { if (H.aktif()) { render(); H.renderBab(); } }); }
  }

  /* ---------------- tindakan ---------------- */
  function rekodBaru(prev) {
    const masa = Date.now(); const a = aktiviti(hariIni()); const lebih = Math.max(0, a.item.length - HAD_ITEM);
    const hari = Object.assign({}, a, { item: a.item.slice(0, HAD_ITEM).map(x => ({ n: x.n, id: x.id, no: x.no, tajuk: x.tajuk, delta: x.delta, baru: x.baru, padam: x.padam, nBlok: x.nBlok, petik: x.petik })), lebih });
    const bab = {}; H.unit().forEach(([n]) => { bab[n] = H.jumlahPatah(n); });
    return { id: 'g' + masa.toString(36), masa, ubah: masa, tarikh: hariIni(), patah: jumlah(), bab, nSek: H.unit().reduce((t, [n]) => t + H.senarai(n).length, 0), hari, sejak: sejak(prev) };
  }
  async function gabung() {
    if (G.sibuk) return; G.sibuk = true; render();
    try {
      await H.segar(); await muat();
      const prev = drafAkhir(); const r = rekodBaru(prev); const d = data(); d.rekod[r.id] = r; const ubah = [r.id];
      /* rekod lama diringkaskan (butiran seksyen dibuang) supaya dokumen rekod kekal kecil; rekod yang sangat lama dibuang daripada simpanan tempatan */
      const semua = Object.values(d.rekod).filter(x => x && x.id).sort((x, y) => (y.masa || 0) - (x.masa || 0));
      semua.slice(HAD_PENUH).forEach(x => { if (x.hari && x.hari.item && x.hari.item.length) { x.hari = Object.assign({}, x.hari, { lebih: (x.hari.lebih || 0) + x.hari.item.length, item: [] }); ubah.push(x.id); } });
      semua.slice(HAD_REKOD).forEach(x => { if (x.batal) delete d.rekod[x.id]; });
      const awan = await simpan(ubah); G.dok = true; G.sibuk = false; render(); H.renderBab();
      const baru = drafAkhir();
      toast(`Draf Nombor: ${baru.no} direkodkan. Bab 1 hingga Bab 5 digabung (${angka(baru.patah)} patah).${awan ? '' : ' Disimpan pada peranti ini sahaja buat masa ini.'}`, false, { label: 'Batalkan draf ini', fn: () => batal(r.id) });
      const el = $('#tulDraf'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (e) { console.warn('gabung: gagal', e); toast('Gabung gagal: ' + ((e && e.message) || e), true); }
    finally { if (G.sibuk) { G.sibuk = false; render(); } }
  }
  async function batal(id) {
    const d = data(); const r = d.rekod[id]; if (!r || r.batal) return; const akhir = drafAkhir(); if (!akhir || akhir.id !== id) { toast('Hanya draf terakhir boleh dibatalkan', true); return; }
    const ok = await R.confirmBox(`Batalkan Draf Nombor: ${akhir.no}?`, `Rekod draf yang digabung pada ${R.fmtTime(akhir.masa)} akan dibuang dan kiraan Draf Nombor turun kepada ${akhir.no - 1}. Tulisan dalam Bab 1 hingga Bab 5 tidak disentuh.`, 'Batalkan draf'); if (!ok) return;
    r.batal = true; r.ubah = Date.now(); await simpan([id]); render(); H.renderBab(); toast(`Draf Nombor: ${akhir.no} dibatalkan`);
  }
  /* Muka depan fail Word: Draf Nombor, tarikh, jumlah patah dan nota aktiviti berwarna (sama seperti pada skrin). */
  function mukaDepan(r) {
    const W = j => (j ? WARNA[j] : undefined); const b = (runs, o) => Object.assign({ runs }, o || {}); const out = [];
    out.push(b([{ t: 'DRAF TESIS', tebal: true }], { tengah: true, saiz: 32, selepas: 240 }));
    out.push(b([{ t: 'Draf Nombor: ' + r.no, tebal: true }], { tengah: true, saiz: 28, selepas: 120 }));
    out.push(b([{ t: H.tarikhPanjang(r.tarikh) + ', ' + jam(r.masa) }], { tengah: true, selepas: 120 }));
    out.push(b([{ t: `${angka(r.patah)} patah perkataan dalam ${angka(r.nSek)} seksyen: ` + H.unit().map(([n]) => `Bab ${n} ${angka((r.bab || {})[n] || 0)}`).join(', ') + '.' }], { tengah: true, selepas: 480 }));
    if (r.hari) {
      out.push(b([{ t: 'Nota aktiviti pada hari draf ini digabung', tebal: true }], { selepas: 120 }));
      out.push(b(ringkasHari(r.hari).map(p => ({ t: p.t, warna: W(p.jenis), tebal: !!p.jenis })), { selepas: 120 }));
      let babSemasa = null; (r.hari.item || []).forEach(x => { if (x.n !== babSemasa) { babSemasa = x.n; out.push(b([{ t: namaBab(x.n), tebal: true }], { selepas: 40 })); } out.push(b(barisItem(x).map(p => ({ t: p.t, warna: W(p.jenis) })), { inden: 360, selepas: 20 })); (x.petik || []).forEach(p => out.push(b([{ t: '“' + p + '”', condong: true, warna: W('sunting') }], { inden: 720, selepas: 20, saiz: 20 }))); });
      if (r.hari.lebih) out.push(b([{ t: `dan ${angka(r.hari.lebih)} seksyen lagi`, warna: W('sunting') }], { inden: 360 }));
    }
    if (r.sejak) out.push(b([{ t: `Sejak Draf Nombor: ${r.sejak.no} (${H.tarikhPanjang(r.sejak.tarikh)}): `, tebal: true }, { t: (tanda(r.sejak.beza) || '0') + ' patah', warna: W(r.sejak.beza > 0 ? 'tambah' : r.sejak.beza < 0 ? 'kurang' : 'sunting'), tebal: true }, { t: ` (${angka(r.sejak.dahulu)} kepada ${angka(r.sejak.kini)} patah)` + ((r.sejak.hari || []).length ? '. Mengikut hari: ' + r.sejak.hari.map(x => tarikhPendek(x.t) + ' ' + tanda(x.v)).join('; ') : '') + '.' }], { selepas: 120 }));
    return out;
  }
  async function word() {
    const r = drafAkhir(); if (!r) { toast('Tekan Gabung dahulu', true); return; } if (G.sibuk) return; G.sibuk = true; render(); toast('Menjana fail Word Draf Nombor: ' + r.no);
    try {
      await H.segar(); const babs = H.unit().map(x => x[0]);
      const blob = await H.janaDocx(babs, { depan: mukaDepan(r), tajuk: 'Draf Tesis, Draf Nombor ' + r.no, footer: `Draf Tesis, Draf Nombor: ${r.no}, digabung ${R.fmtTime(r.masa)}. Salinan gabungan untuk bacaan dan semakan; suntingan dibuat dalam sistem.` });
      const dt = new Date(); const nama = `Draf_Tesis_No-${String(r.no).padStart(2, '0')}_${r.tarikh}_${String(dt.getHours()).padStart(2, '0')}${String(dt.getMinutes()).padStart(2, '0')}.docx`;
      R.saveFile(nama, blob, H.MIME); let fail = { nama, masa: Date.now(), saiz: blob.size };
      try { if (R.drive().hasToken()) { const res = await R.drive().uploadAs(new File([blob], nama, { type: H.MIME }), { subfolder: H.SUB, mime: H.MIME, name: nama }); if (res && res.id) fail = Object.assign(fail, { id: res.id, link: res.webViewLink || R.drive().link(res.id) }); } } catch (e) { console.warn('gabung: salinan Drive gagal', e); }
      const d = data(); if (d.rekod[r.id]) { d.rekod[r.id].fail = fail; d.rekod[r.id].ubah = Date.now(); await simpan([r.id]); }
      toast(`Fail ${nama} dimuat turun${fail.id ? ' dan salinan disimpan dalam folder ' + H.SUB + ' di Drive' : ' (Drive tidak disambung; salinan tidak disimpan di Drive)'}.`);
    } catch (e) { console.warn('gabung: Word gagal', e); toast('Gagal menjana Word: ' + ((e && e.message) || e), true); }
    finally { G.sibuk = false; render(); }
  }
  function klik(e) {
    const b = e.target.closest('[data-gb]'); if (!b) return false; const a = b.dataset.gb;
    if (a === 'gabung') gabung(); else if (a === 'word') word(); else if (a === 'batal') batal(b.dataset.id);
    return true;
  }

  return { render, tabHtml, klik, catatAsas, muat, gabung, word, batal, senaraiDraf, aktiviti, sejak, state: G };
}
