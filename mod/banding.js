/* Banding Artikel: perbandingan kepala ke kepala dua artikel repositori berdasarkan Bahagian A hingga F, seperti perbandingan
   dua pemain bola sepak. Dua lapisan: (1) Indeks pantas yang dikira secara deterministik daripada medan rekod, berserta jadual
   bersebelahan A hingga F; (2) Agen Banding Prof Dr Claude, satu panggilan API (medan rekod sahaja, bukan PDF) yang memulangkan
   laporan berstruktur: profil, perbandingan setiap bahagian, penilaian teknikal, laporan keseluruhan ringkas dan refleksi
   terhadap kajian Prof Dr. Hanya artikel yang semua medan A hingga F sudah diisi boleh dibandingkan; jika belum, amaran dan
   butang ke rekod dipaparkan. Laporan agen disimpan (meta/banding_<kunci> dan salinan tempatan) supaya tidak perlu dijana semula. */
export function initBanding(R) {
  const { $, $$, esc, toast, GROUPS } = R;
  const B = { a: '', b: '', laporan: null, simpanan: null, busy: false, hasil: false, kayu: '', pasangan: [], sibukPeta: false };
  const PERANAN = ['Bebas', 'Perantara', 'Penyederhana', 'Bersandar', 'Kawalan', 'Lain'];
  const SKIP = R.Isi.SKIP;
  const SEK = GROUPS.map(g => ({ letter: g.letter, title: g.title, fields: [].concat(...g.medan.map(m => m.fields.filter(f => !SKIP.has(f.k)).map(f => Object.assign({ n: m.n }, f)))) }));
  const DIMENSI = ['Kekukuhan reka bentuk dan persampelan', 'Kualiti instrumen dan kebolehpercayaan', 'Kekuatan analisis statistik', 'Kejelasan dapatan dan bukti', 'Sumbangan teori', 'Padanan konteks dengan kajian Prof Dr', 'Padanan model KD, PPO dan KDG', 'Kebolehgunaan untuk Bab 2 dan Bab 5'];
  const PANTAS = ['Kekinian', 'Taraf jurnal', 'Kekukuhan kaedah', 'Kekuatan bukti', 'Relevansi', 'Padanan model', 'Asas teori', 'Padanan konteks'];

  /* ---- kelengkapan ---- */
  const kosong = v => R.Isi.nilaiKosong(v);
  function rekod(id) { const d = R.S.docs.get(id) || {}; return Object.assign({}, d, R.S.pending[id] || {}); }
  function kelengkapan(d) {
    const bahagian = SEK.map(s => { const kos = s.fields.filter(f => kosong(d[f.k])); return { letter: s.letter, title: s.title, kosong: kos.map(f => f.label), ok: !kos.length }; });
    return { ok: bahagian.every(b => b.ok), bahagian };
  }
  function nama(d) { return (d.penulis || 'Penulis belum diisi') + (d.tahun ? ' (' + d.tahun + ')' : ''); }
  function inisial(d) { const w = String(d.penulis || '?').replace(/et al\.?/i, '').trim().split(/\s+/).filter(Boolean); return (w.slice(0, 2).map(x => x[0]).join('') || '?').toUpperCase(); }

  /* ---- indeks pantas (heuristik telus daripada medan) ---- */
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x)));
  function nomborTerbesar(s) { let m = 0; String(s || '').replace(/\d[\d,]*/g, x => { const n = parseInt(x.replace(/,/g, ''), 10); if (n < 100000 && n > m) m = n; return x; }); return m; }
  function indeksPantas(d) {
    const tahunIni = new Date().getFullYear(); const th = parseInt(d.tahun, 10);
    const kekinian = th ? clamp(100 - (tahunIni - th) * 10, 10, 100) : 10;
    const kq = { Q1: 100, Q2: 80, Q3: 60, Q4: 45 }[d.kuartil]; const ki = /scopus|wos/i.test(d.indeks || '') ? 50 : /mycite|era/i.test(d.indeks || '') ? 35 : 20;
    const jurnal = kq || ki;
    let kaedah = { Kuantitatif: 30, 'Kaedah campuran': 25, Kualitatif: 15, 'Ulasan atau sintesis': 15, Konseptual: 5 }[d.rekaBentuk] || 0;
    const tk = (d.teknik || '') + ' ' + (d.perisian || '');
    if (/SEM|persamaan berstruktur|structural/i.test(tk)) kaedah += 30; else if (/regres|ANOVA|korelasi|HLM|multilevel|MANOVA/i.test(tk)) kaedah += 20; else if (/tematik|kualitatif|kandungan/i.test(tk)) kaedah += 10;
    if (/alfa|cronbach|\bCR\b|\bAVE\b|kebolehpercayaan|reliab|omega/i.test(d.instrumen || '')) kaedah += 20;
    const n = nomborTerbesar(d.sampel); kaedah += n >= 300 ? 20 : n >= 150 ? 12 : n >= 50 ? 6 : 0;
    const stat = (String(d.dapatan || '').match(/(β|beta|\bb\s*=|p\s*[<=>]|R\s*(kuasa dua|²|2)|\bt\s*=|\bCI\b|selang keyakinan|tidak langsung|indirect|signifikan)/gi) || []).length;
    let bukti = Math.min(60, stat * 8) + ({ Perantaraan: 25, 'Kedua-dua': 30, Langsung: 15 }[d.jenisKesan] || 0) + (d.jenis === 'Empirikal' ? 10 : 0);
    const relevansi = { Tinggi: 100, 'Sederhana-Tinggi': 75, Sederhana: 50, Rendah: 25 }[d.relevansi] || 0;
    const pad = v => ({ YA: 50, 'Tidak pasti': 25 }[v] || 0); const model = pad(d.padananKdPpo) + pad(d.padananPpoKdg);
    const teori = { 'Tingkah laku': 100, 'Kedua-dua': 70, Teknologi: 35, Tiada: 10 }[d.asasTeori] || 0;
    let konteks = /malaysia/i.test(d.negara || '') ? 40 : /indonesia|asia|china|turki|turkey|thailand|vietnam|filipina|philippines|singapura|singapore|brunei|korea|jepun|japan|india|pakistan|arab/i.test(d.negara || '') ? 20 : 8;
    konteks += { 'Sekolah Rendah': 40, 'Pelbagai peringkat': 25, 'Sekolah Menengah': 15, 'Pengajian Tinggi': 5 }[d.peringkat] || 0;
    konteks += { 'Bandar dan luar bandar': 20, Bandar: 10, 'Luar bandar': 10 }[d.lokasi] || 0;
    const v = [kekinian, jurnal, clamp(kaedah, 0, 100), clamp(bukti, 0, 100), relevansi, model, teori, clamp(konteks, 0, 100)];
    const sebab = [th ? 'tahun ' + th : 'tahun tidak diisi', d.kuartil && d.kuartil !== 'Tidak pasti' && d.kuartil !== 'Tiada' ? 'kuartil ' + d.kuartil : 'indeks ' + (d.indeks || 'tidak diisi'), (d.rekaBentuk || '') + (n ? ', n = ' + n : '') + (/SEM/i.test(tk) ? ', SEM' : ''), stat + ' penanda statistik dalam dapatan' + (d.jenisKesan ? ', kesan ' + d.jenisKesan.toLowerCase() : ''), 'relevansi ' + (d.relevansi || 'tidak diisi'), 'KD ke PPO ' + (d.padananKdPpo || '?') + ', PPO ke KDG ' + (d.padananPpoKdg || '?'), 'asas teori ' + (d.asasTeori || 'tidak diisi'), [d.negara, d.peringkat, d.lokasi].filter(Boolean).join(', ') || 'konteks tidak diisi'];
    return PANTAS.map((label, i) => ({ label, nilai: v[i], sebab: sebab[i] }));
  }

  /* ---- paparan ---- */
  function senaraiPilihan() {
    return Array.from(R.S.docs.entries()).map(([id, d]) => [id, rekod(id)]).sort((x, y) => (x[1].bil || 0) - (y[1].bil || 0) || String(x[1].penulis || '').localeCompare(String(y[1].penulis || '')));
  }
  function isiSelect(sel, pilih, lain) {
    const arr = senaraiPilihan();
    sel.innerHTML = '<option value="">Pilih artikel daripada repositori</option>' + arr.map(([id, d]) => { const k = kelengkapan(d); return `<option value="${esc(id)}"${id === pilih ? ' selected' : ''}${id === lain ? ' disabled' : ''}>Bil. ${esc(d.bil || '?')} ${esc(nama(d))} ${k.ok ? '[A hingga F lengkap]' : '[belum lengkap: ' + k.bahagian.filter(b => !b.ok).map(b => b.letter).join('') + ']'} ${esc(String(d.tajuk || '').slice(0, 70))}</option>`; }).join('');
  }
  function kad(id, sisi) {
    const el = $('#bandKad' + sisi.toUpperCase()); if (!el) return;
    if (!id || !R.S.docs.has(id)) { el.innerHTML = `<div class="empty-kad">Artikel ${sisi === 'a' ? '1' : '2'} belum dipilih. Pilihan hanya daripada artikel yang sudah ada dalam repositori.</div>`; return; }
    const d = rekod(id); const k = kelengkapan(d);
    const chips = [d.tema, d.jenis, d.rekaBentuk, d.indeks && d.indeks !== 'Tidak pasti' ? d.indeks + (d.kuartil && !/Tiada|Tidak pasti/.test(d.kuartil) ? ' ' + d.kuartil : '') : '', d.negara, d.peringkat, d.teknik].filter(Boolean);
    el.innerHTML = `<div class="kad-top"><div class="avatar">${esc(inisial(d))}</div><div class="kad-id"><div class="nama">${esc(nama(d))}${id === B.kayu ? ' <span class="tag kayu" title="Artikel kayu ukur: pasangan lain dibandingkan dengannya">Kayu ukur</span>' : ''}</div><div class="meta">Bil. ${esc(d.bil || '?')} · ${esc(d.status || 'Belum dibaca')}${(d.fail || []).length ? ' · PDF ada' : ' · tiada PDF'}</div></div></div>
      <div class="tajuk">${esc(d.tajuk || 'Tajuk belum diisi')}</div>
      <div class="chips">${chips.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>
      <div class="band-lengkap" title="Kelengkapan Bahagian A hingga F">${k.bahagian.map(b => `<span class="${b.ok ? 'ok' : 'no'}" title="${esc(b.title + (b.ok ? ': lengkap' : ': kosong ' + b.kosong.join(', ')))}">${b.letter}</span>`).join('')}</div>
      <div class="help">${k.ok ? 'Semua medan Bahagian A hingga F sudah diisi.' : 'Belum lengkap: ' + esc(k.bahagian.filter(b => !b.ok).map(b => b.letter + ' (' + b.kosong.length + ' medan)').join(', ')) + '.'}</div>
      <div class="acts"><button class="btn btn-sm" data-buka="${esc(id)}">Buka rekod</button>${(d.fail || []).length ? `<button class="btn btn-sm" data-flipb="${esc(id)}">Baca</button>` : ''}</div>`;
  }
  function show() { refresh(); muatKayu().then(() => { if (B.kayu && !B.a && R.S.docs.has(B.kayu)) { B.a = B.kayu; } refresh(); }); muatPasangan().then(() => renderPola()); }
  function refresh() {
    const sa = $('#bandA'), sb = $('#bandB'); if (!sa || !sb) return;
    if (B.a && !R.S.docs.has(B.a)) B.a = ''; if (B.b && !R.S.docs.has(B.b)) B.b = '';
    isiSelect(sa, B.a, B.b); isiSelect(sb, B.b, B.a); kad(B.a, 'a'); kad(B.b, 'b'); renderKayu(); renderPola();
    $('#btnBandingAgen').disabled = !B.hasil;
    if (B.hasil && (!B.a || !B.b)) { B.hasil = false; $('#bandHasil').innerHTML = ''; $('#btnBandingAgen').disabled = true; $('#btnBandingSalin').hidden = true; $('#btnBandingMd').hidden = true; }
  }

  /* ---- amaran kelengkapan (butang kembali ke rekod) ---- */
  function amaran(items) {
    const el = $('#bandAmaran'); if (!items.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<div class="amaran-t">Perbandingan hanya dibuat untuk artikel yang sudah siap ditulis Bahagian A hingga F.</div>` + items.map(it => `<div class="amaran-item"><div><b>Artikel ${it.no}</b>, ${esc(nama(it.d))}: belum lengkap ${it.k.bahagian.filter(b => !b.ok).map(b => `Bahagian ${b.letter} (${esc(b.kosong.join(', '))})`).join('; ')}.</div><button class="btn btn-sm btn-primary" data-buka="${esc(it.id)}">Buka rekod Artikel ${it.no} untuk melengkapkan</button></div>`).join('') + `<div class="help">Dalam rekod, Prof Dr boleh mengisi sendiri atau klik "Mohon Prof Dr Claude isikan" pada setiap bahagian (atau "Isi semua bahagian" di kepala rekod). Kembali ke Banding selepas itu; pilihan Prof Dr dikekalkan.</div>`;
  }

  /* ---- radar dan bar ---- */
  function baris(l, had) { const out = []; let cur = ''; l.split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > had && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out.slice(0, 3); }
  function radar(labels, va, vb, namaA, namaB) {
    const n = labels.length; const W = 600, H = 440; const cx = 300, cy = 206, r = 138; const pt = (i, v) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; const rr = r * clamp(v, 0, 100) / 100; return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]; };
    const poly = vals => vals.map((v, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
    const rings = [25, 50, 75, 100].map(p => `<polygon points="${labels.map((_, i) => pt(i, p).map(x => x.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('');
    const axes = labels.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`; }).join('');
    const teks = labels.map((l, i) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; const c = Math.cos(ang), sn = Math.sin(ang); const x = cx + (r + 14) * c, y = cy + (r + 14) * sn; const anchor = Math.abs(c) < 0.25 ? 'middle' : c > 0 ? 'start' : 'end'; const ls = baris(l, 20); const dy0 = sn < -0.25 ? -(ls.length - 1) * 1.15 - 0.2 : sn > 0.25 ? 0.95 : -(ls.length - 1) * 0.575 + 0.35; return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="var(--muted)">${ls.map((t, k) => `<tspan x="${x.toFixed(1)}" dy="${k === 0 ? dy0.toFixed(2) + 'em' : '1.15em'}">${esc(t)}</tspan>`).join('')}</text>`; }).join('');
    const dots = (vals, col) => vals.map((v, i) => { const [x, y] = pt(i, v); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${col}"><title>${esc(labels[i])}: ${clamp(v, 0, 100)}</title></circle>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carta radar perbandingan">${rings}${axes}<polygon points="${poly(va)}" fill="var(--kd)" fill-opacity=".18" stroke="var(--kd)" stroke-width="2.2"/><polygon points="${poly(vb)}" fill="var(--kdg)" fill-opacity=".18" stroke="var(--kdg)" stroke-width="2.2"/>${dots(va, 'var(--kd)')}${dots(vb, 'var(--kdg)')}${teks}
      <g font-size="12"><rect x="${cx - 190}" y="${H - 22}" width="12" height="12" rx="3" fill="var(--kd)"/><text x="${cx - 172}" y="${H - 12}" fill="var(--fg)">${esc(namaA)}</text><rect x="${cx + 20}" y="${H - 22}" width="12" height="12" rx="3" fill="var(--kdg)"/><text x="${cx + 38}" y="${H - 12}" fill="var(--fg)">${esc(namaB)}</text></g></svg>`;
  }
  function bars(rows) {
    return `<div class="band-bars">${rows.map(r => `<div class="bar-row"><div class="lbl">${esc(r.label)}${r.ulasan ? `<span class="ul" title="${esc(r.ulasan)}">i</span>` : ''}</div><div class="v a">${clamp(r.a, 0, 100)}</div><div class="track"><div class="half l"><span style="width:${clamp(r.a, 0, 100)}%"></span></div><div class="half r"><span style="width:${clamp(r.b, 0, 100)}%"></span></div></div><div class="v b">${clamp(r.b, 0, 100)}</div>${r.sebabA || r.sebabB ? `<div class="sebab"><span>${esc(r.sebabA || '')}</span><span>${esc(r.sebabB || '')}</span></div>` : ''}${r.ulasan ? `<div class="ulasan">${esc(r.ulasan)}</div>` : ''}</div>`).join('')}</div>`;
  }
  function purata(v) { return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : 0; }

  /* ---- jadual bersebelahan A hingga F ---- */
  function nilaiTeks(v) { return Array.isArray(v) ? v.join(', ') : String(v == null ? '' : v); }
  function jadualSisi(da, db) {
    return SEK.map(s => `<details class="band-sek" open><summary>Bahagian ${s.letter}. ${esc(s.title)}</summary><div class="band-tbl"><div class="h">Medan</div><div class="h a">Artikel 1</div><div class="h b">Artikel 2</div>${s.fields.map(f => { const va = nilaiTeks(da[f.k]), vb = nilaiTeks(db[f.k]); const sama = f.type === 'select' && va && va === vb; return `<div class="k">${esc(f.label)}</div><div class="${sama ? 'sama' : ''}">${esc(va) || '<i>kosong</i>'}</div><div class="${sama ? 'sama' : ''}">${esc(vb) || '<i>kosong</i>'}</div>`; }).join('')}</div></details>`).join('');
  }

  /* ---- banding (lapisan tempatan) ---- */
  async function banding() {
    const ids = [B.a, B.b];
    if (!ids[0] || !ids[1]) { toast('Pilih dua artikel daripada repositori dahulu', true); return; }
    if (ids[0] === ids[1]) { toast('Pilih dua artikel yang berbeza', true); return; }
    const da = rekod(ids[0]), db = rekod(ids[1]); const ka = kelengkapan(da), kb = kelengkapan(db);
    const tak = []; if (!ka.ok) tak.push({ no: 1, id: ids[0], d: da, k: ka }); if (!kb.ok) tak.push({ no: 2, id: ids[1], d: db, k: kb });
    amaran(tak); B.hasil = false; B.laporan = null; B.simpanan = null; $('#btnBandingSalin').hidden = true; $('#btnBandingMd').hidden = true; $('#btnBandingAgen').disabled = true;
    if (tak.length) { $('#bandHasil').innerHTML = ''; return; }
    const ia = indeksPantas(da), ib = indeksPantas(db); const va = ia.map(x => x.nilai), vb = ib.map(x => x.nilai);
    const rows = PANTAS.map((label, i) => ({ label, a: va[i], b: vb[i], sebabA: ia[i].sebab, sebabB: ib[i].sebab }));
    $('#bandHasil').innerHTML = `<section class="group band-grp"><div class="grp-head"><h2>Indeks pantas</h2><span class="sub">Dikira secara automatik dan telus daripada medan A hingga F (0 hingga 100); bukan penilaian agen.</span></div>
      <div class="band-dua"><div class="band-radar">${radar(PANTAS, va, vb, nama(da), nama(db))}</div><div><div class="band-skor"><span class="a">${purata(va)}</span><span class="vs">purata</span><span class="b">${purata(vb)}</span></div>${bars(rows)}</div></div></section>
      <section class="group band-grp"><div class="grp-head"><h2>Bahagian A hingga F bersebelahan</h2><span class="sub">Nilai medan kedua-dua rekod; pilihan yang sama ditanda hijau.</span></div>${jadualSisi(da, db)}</section>
      <section class="group band-grp" id="bandAgen"><div class="grp-head"><h2>Laporan Agen Banding Prof Dr Claude</h2><span class="sub">Perbandingan setiap bahagian, penilaian teknikal, laporan keseluruhan ringkas dan refleksi terhadap kajian Prof Dr.</span></div><div id="bandAgenIsi"><div class="help">Klik "Mohon Agen Banding" di atas untuk menjana laporan. Medan A hingga F kedua-dua rekod sahaja yang dihantar (bukan PDF), maka kosnya kecil.</div></div></section>`;
    B.hasil = true; $('#btnBandingAgen').disabled = false;
    const lama = await muatSimpanan(ids[0], ids[1]);
    if (lama) { B.laporan = lama.laporan; B.simpanan = lama; renderAgen(da, db); }
  }

  /* ---- simpanan laporan agen ---- */
  function kunci(a, b) { return [a, b].sort().join('__'); }
  function tukarSisi(l) {
    const s = o => o && typeof o === 'object' ? { a: o.b, b: o.a } : o;
    const out = Object.assign({}, l, { profil: s(l.profil), kekuatan: s(l.kekuatan), kelemahan: s(l.kelemahan) });
    out.skor = (l.skor || []).map(x => Object.assign({}, x, { a: x.b, b: x.a }));
    out.lebihBerguna = l.lebihBerguna === 'Artikel 1' ? 'Artikel 2' : l.lebihBerguna === 'Artikel 2' ? 'Artikel 1' : l.lebihBerguna;
    const ganti = t => String(t || '').replace(/Artikel 1/g, '\u0000').replace(/Artikel 2/g, 'Artikel 1').replace(/\u0000/g, 'Artikel 2');
    ['keseluruhan', 'refleksi', 'sitasi', 'sebab'].forEach(k => { out[k] = ganti(l[k]); });
    out.bahagian = (l.bahagian || []).map(x => ({ bahagian: x.bahagian, persamaan: ganti(x.persamaan), perbezaan: ganti(x.perbezaan), penilaian: ganti(x.penilaian) }));
    if (out.profil) { out.profil = { a: ganti(out.profil.a), b: ganti(out.profil.b) }; }
    if (out.kekuatan) out.kekuatan = { a: ganti(out.kekuatan.a), b: ganti(out.kekuatan.b) };
    if (out.kelemahan) out.kelemahan = { a: ganti(out.kelemahan.a), b: ganti(out.kelemahan.b) };
    out.skor.forEach(x => { x.ulasan = ganti(x.ulasan); });
    if (l.dimensi) out.dimensi = { a: l.dimensi.b || [], b: l.dimensi.a || [] };
    if (l.bandingDimensi) out.bandingDimensi = { persamaan: ganti(l.bandingDimensi.persamaan), perbezaan: ganti(l.bandingDimensi.perbezaan), implikasi: ganti(l.bandingDimensi.implikasi) };
    return out;
  }
  async function muatSimpanan(a, b) {
    const k = kunci(a, b); let rec = null;
    const lokal = (R.lsGet('rslr_banding', {}) || {})[k]; if (lokal) rec = lokal;
    try { const awan = await R.db().get('meta/banding_' + k); if (awan && awan.laporan && (!rec || (awan.masa || 0) > (rec.masa || 0))) rec = awan; } catch (e) {}
    if (!rec || !rec.laporan) return null;
    const out = Object.assign({}, rec); if (rec.idA !== a) out.laporan = tukarSisi(rec.laporan); return out;
  }
  async function simpan(a, b, data) {
    const k = kunci(a, b); const all = R.lsGet('rslr_banding', {}) || {}; all[k] = data;
    const keys = Object.keys(all).sort((x, y) => (all[y].masa || 0) - (all[x].masa || 0)); keys.slice(30).forEach(x => { delete all[x]; }); R.lsSet('rslr_banding', all);
    try { await R.db().set('meta/banding_' + k, data); return true; } catch (e) { console.warn('banding: simpanan awan gagal', e); return false; }
  }

  /* ---- agen banding ---- */
  function teksRekod(no, d) {
    return `ARTIKEL ${no} (Bil. ${d.bil || '?'}): ${nama(d)}. ${d.tajuk || ''}\n` + SEK.map(s => `Bahagian ${s.letter}. ${s.title}\n` + s.fields.map(f => `- ${f.label}: ${nilaiTeks(d[f.k]).slice(0, f.k === 'dapatan' ? 3000 : 1500)}`).join('\n')).join('\n');
  }
  function skemaLaporan() {
    const ab = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['a', 'b'], additionalProperties: false };
    return { type: 'object', additionalProperties: false, required: ['profil', 'dimensi', 'bandingDimensi', 'bahagian', 'skor', 'kekuatan', 'kelemahan', 'keseluruhan', 'refleksi', 'sitasi', 'lebihBerguna', 'sebab'], properties: {
      dimensi: { type: 'object', additionalProperties: false, required: ['a', 'b'], properties: { a: skemaKonstruk('Artikel 1'), b: skemaKonstruk('Artikel 2') } },
      bandingDimensi: { type: 'object', additionalProperties: false, required: ['persamaan', 'perbezaan', 'implikasi'], properties: { persamaan: { type: 'string', description: 'Dimensi dan subdimensi yang dikongsi kedua-dua artikel bagi konstruk yang sepadan (satu perenggan).' }, perbezaan: { type: 'string', description: 'Dimensi yang hanya ada pada satu artikel, perbezaan kerangka sumber dan perbezaan takrif; namakan Artikel 1 dan Artikel 2 (satu perenggan).' }, implikasi: { type: 'string', description: 'Implikasi perbezaan dimensi itu terhadap instrumen kajian Prof Dr (KD lima dimensi ISTE 2024, PPDO lima dimensi digital, KDG enam bidang DigCompEdu) dan cara menulis perbandingan ini dalam Bab 2 (satu perenggan).' } } },
      profil: Object.assign({}, ab, { description: 'Profil ringkas setiap artikel (dua hingga tiga ayat): apa yang dikaji, di mana, dengan kaedah apa, dapatan utama.' }),
      bahagian: { type: 'array', description: 'Tepat enam item, satu bagi setiap Bahagian A hingga F.', items: { type: 'object', additionalProperties: false, required: ['bahagian', 'persamaan', 'perbezaan', 'penilaian'], properties: { bahagian: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F'] }, persamaan: { type: 'string', description: 'Persamaan kedua-dua artikel dalam bahagian ini.' }, perbezaan: { type: 'string', description: 'Perbezaan utama, dengan Artikel 1 dan Artikel 2 dinamakan.' }, penilaian: { type: 'string', description: 'Penilaian kritis: mana yang lebih kukuh dalam bahagian ini dan mengapa.' } } } },
      skor: { type: 'array', description: 'Tepat lapan item, satu bagi setiap dimensi.', items: { type: 'object', additionalProperties: false, required: ['dimensi', 'a', 'b', 'ulasan'], properties: { dimensi: { type: 'string', enum: DIMENSI }, a: { type: 'integer', description: 'Skor Artikel 1 (0 hingga 100).' }, b: { type: 'integer', description: 'Skor Artikel 2 (0 hingga 100).' }, ulasan: { type: 'string', description: 'Asas skor, merujuk medan yang diberi.' } } } },
      kekuatan: Object.assign({}, ab, { description: 'Kekuatan utama setiap artikel, satu hingga dua ayat.' }),
      kelemahan: Object.assign({}, ab, { description: 'Kelemahan utama setiap artikel, satu hingga dua ayat.' }),
      keseluruhan: { type: 'string', description: 'Laporan keseluruhan ringkas kedua-dua artikel (satu perenggan, lima hingga tujuh ayat).' },
      refleksi: { type: 'string', description: 'Refleksi perkaitan kedua-dua artikel dengan kajian Prof Dr: sokongan hipotesis H1 hingga H4, konteks, kaedah dan cara memanfaatkannya (satu hingga dua perenggan).' },
      sitasi: { type: 'string', description: 'Cadangan cara memetik kedua-duanya bersama dalam Bab 2: selari, bercanggah atau melengkapi, dengan satu ayat sintesis contoh menggunakan Penulis (Tahun).' },
      lebihBerguna: { type: 'string', enum: ['Artikel 1', 'Artikel 2', 'Kedua-dua setara'], description: 'Artikel yang lebih berguna untuk kajian Prof Dr secara keseluruhan.' },
      sebab: { type: 'string', description: 'Sebab pilihan itu, dua hingga tiga ayat.' } } };
  }
  function skemaKonstruk(label) {
    return { type: 'array', description: `Setiap konstruk kajian ${label} dengan peranannya, kerangka atau instrumen sumber, dan dimensi serta subdimensinya seperti yang dinyatakan dalam medan konstruk, definisi, teori dan instrumen; jangan mereka dimensi yang tidak ada dalam rekod.`, items: { type: 'object', additionalProperties: false, required: ['konstruk', 'peranan', 'kerangka', 'dimensi'], properties: { konstruk: { type: 'string', description: 'Nama konstruk seperti dalam artikel (Bahasa Melayu, istilah Inggeris dalam kurungan jika perlu).' }, peranan: { type: 'string', enum: PERANAN }, kerangka: { type: 'string', description: 'Kerangka, model, teori atau instrumen sumber dimensi, contohnya ISTE 2024, SECI, DigCompEdu; "Tiada dalam rekod" jika tidak dinyatakan.' }, dimensi: { type: 'array', description: 'Dimensi konstruk; kosong jika artikel mengukurnya secara unidimensi atau rekod tidak menyatakannya.', items: { type: 'object', additionalProperties: false, required: ['nama', 'sub'], properties: { nama: { type: 'string' }, sub: { type: 'array', items: { type: 'string' }, description: 'Subdimensi atau komponen di bawah dimensi ini; kosong jika tiada.' } } } } } } };
  }
  function alatPeta() { return { name: 'peta_dimensi', description: 'Pulangkan peta konstruk dan dimensi satu artikel.', input_schema: { type: 'object', additionalProperties: false, required: ['konstruk'], properties: { konstruk: skemaKonstruk('artikel ini') } } }; }
  function alatLaporan() { const s = skemaLaporan(); return { name: 'laporan_banding', description: 'Pulangkan laporan perbandingan dua artikel mengikut struktur ini.', input_schema: s }; }
  function systemPrompt(profil) {
    return `Anda ialah Agen Banding Prof Dr Claude, penilai literatur akademik kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris. Tugas anda: membandingkan DUA artikel kepala ke kepala berdasarkan medan ekstrak Bahagian A hingga F yang telah diisi dalam Repositori SLR (bukan teks penuh PDF), seperti laporan teknikal perbandingan dua pemain.

Peraturan:
1. Bahasa Melayu Malaysia baku, laras akademik; istilah Malaysia (guru besar, dapatan, kajian); jangan gunakan sempang em atau en.
2. Sifar fabrikasi: hujah hanya daripada medan yang diberi. Jika sesuatu medan tidak memadai untuk dinilai, nyatakan "maklumat dalam rekod tidak memadai" dan jangan mengandaikan. Jangan mereka angka, nama atau rujukan.
3. Namakan artikel sebagai Artikel 1 dan Artikel 2 secara konsisten, boleh disertai Penulis (Tahun).
4. Skor setiap dimensi ialah integer 0 hingga 100 dengan asas yang dinyatakan dalam ulasan; bezakan skor hanya apabila medan memberi alasan. Dimensi tepat seperti dalam skema, lapan kesemuanya, dan perbandingan bahagian tepat enam, A hingga F mengikut urutan.
5. Penilaian kritis dan seimbang: akui kekuatan, dedahkan kelemahan (bias kaedah sepunya, sampel, dakwaan sebab akibat daripada data keratan rentas, kesahan instrumen), tanpa memperbesar.
6. Refleksi mesti merujuk kajian Prof Dr (profil di bawah): hipotesis H1 hingga H4, konteks sekolah rendah Perak, penilaian silang guru terhadap guru besar, CB-SEM, dan cara kedua-dua artikel boleh dipetik (Bab 2 sorotan literatur, Bab 5 perbincangan).
7. Ringkas dan padat; perenggan prosa, bukan senarai berbutir; nilai rentetan dalam satu perenggan.
9. Peta dimensi: bagi setiap artikel senaraikan setiap konstruk dengan peranan (bebas, perantara, penyederhana, bersandar, kawalan), kerangka atau instrumen sumbernya, dan dimensi serta subdimensinya tepat seperti yang dinyatakan dalam medan konstruk, definisi, teori dan instrumen; jika rekod tidak menyatakan dimensi, pulangkan senarai dimensi kosong dan bukan tekaan. Perbandingan dimensi menamakan dimensi yang dikongsi, yang hanya ada pada satu artikel, dan implikasinya kepada instrumen Prof Dr.
8. Format output: SATU objek JSON mengikut skema yang disediakan (atau melalui alat laporan_banding jika alat itu diberi), tanpa teks pengantar.

Profil kajian Prof Dr:
${profil}`;
  }
  function sahkan(j) {
    if (!j || typeof j !== 'object') throw { code: 'json' };
    const ab = o => ({ a: nilaiTeks(o && o.a), b: nilaiTeks(o && o.b) });
    const out = { profil: ab(j.profil), kekuatan: ab(j.kekuatan), kelemahan: ab(j.kelemahan), keseluruhan: nilaiTeks(j.keseluruhan), refleksi: nilaiTeks(j.refleksi), sitasi: nilaiTeks(j.sitasi), sebab: nilaiTeks(j.sebab) };
    const lb = nilaiTeks(j.lebihBerguna).toLowerCase(); out.lebihBerguna = /1/.test(lb) ? 'Artikel 1' : /2/.test(lb) ? 'Artikel 2' : 'Kedua-dua setara';
    const bh = Array.isArray(j.bahagian) ? j.bahagian : [];
    out.bahagian = SEK.map(s => { const x = bh.find(y => String(y && y.bahagian || '').trim().toUpperCase() === s.letter) || {}; return { bahagian: s.letter, persamaan: nilaiTeks(x.persamaan), perbezaan: nilaiTeks(x.perbezaan), penilaian: nilaiTeks(x.penilaian) }; });
    const sk = Array.isArray(j.skor) ? j.skor : [];
    out.skor = DIMENSI.map(dm => { const x = sk.find(y => String(y && y.dimensi || '').trim().toLowerCase() === dm.toLowerCase()) || sk.find(y => String(y && y.dimensi || '').toLowerCase().startsWith(dm.toLowerCase().slice(0, 12))); if (!x) return null; const num = v => { const n = parseFloat(v); return isNaN(n) ? null : clamp(n, 0, 100); }; return { dimensi: dm, a: num(x.a), b: num(x.b), ulasan: nilaiTeks(x.ulasan) }; }).filter(x => x && x.a != null && x.b != null);
    out.dimensi = { a: senaraiKonstruk(j.dimensi && j.dimensi.a), b: senaraiKonstruk(j.dimensi && j.dimensi.b) };
    const bd = j.bandingDimensi || {}; out.bandingDimensi = { persamaan: nilaiTeks(bd.persamaan), perbezaan: nilaiTeks(bd.perbezaan), implikasi: nilaiTeks(bd.implikasi) };
    ['keseluruhan', 'refleksi', 'sitasi', 'sebab'].forEach(k => { out[k] = out[k].replace(/\s*[—–]\s*/g, ', '); });
    return out;
  }
  function padanPeranan(v) { const t = nilaiTeks(v).toLowerCase(); return PERANAN.find(p => p.toLowerCase() === t) || PERANAN.find(p => t.startsWith(p.toLowerCase().slice(0, 5))) || (/bebas|independen|exogen|peramal/.test(t) ? 'Bebas' : /perantara|mediat/.test(t) ? 'Perantara' : /sederhana|moderat/.test(t) ? 'Penyederhana' : /bersandar|dependen|endogen|hasil|outcome/.test(t) ? 'Bersandar' : /kawalan|control/.test(t) ? 'Kawalan' : 'Lain'); }
  function senaraiKonstruk(arr) {
    return (Array.isArray(arr) ? arr : []).map(x => x && typeof x === 'object' ? { konstruk: nilaiTeks(x.konstruk).trim(), peranan: padanPeranan(x.peranan), kerangka: nilaiTeks(x.kerangka).trim() || 'Tiada dalam rekod', dimensi: (Array.isArray(x.dimensi) ? x.dimensi : []).map(dd => typeof dd === 'string' ? { nama: dd.trim(), sub: [] } : dd && typeof dd === 'object' ? { nama: nilaiTeks(dd.nama).trim(), sub: (Array.isArray(dd.sub) ? dd.sub : []).map(v => nilaiTeks(v).trim()).filter(Boolean) } : null).filter(dd => dd && dd.nama) } : null).filter(x => x && x.konstruk);
  }
  const normDim = t => String(t || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  async function simpanPeta(id, konstruk, model, sumber) {
    if (!id || !R.S.docs.has(id) || !konstruk || !konstruk.length) return false;
    try { await R.writeNow(id, { petaDimensi: { masa: Date.now(), model: model || null, sumber: sumber || 'banding', konstruk } }); return true; } catch (e) { console.warn('banding: peta dimensi tidak disimpan', e); return false; }
  }
  async function agen() {
    if (B.busy) return; if (!B.hasil || !B.a || !B.b) { toast('Klik "Banding sekarang" dahulu', true); return; }
    const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    if (B.simpanan) { const okk = await R.confirmBox('Jana semula laporan?', 'Laporan agen bagi pasangan ini sudah ada (' + R.fmtTime(B.simpanan.masa) + '). Jana semula akan menggunakan token sekali lagi.', 'Jana semula', false); if (!okk) return; }
    if (!R.lsGet('rslr_banding_faham', false)) {
      const okk = await R.confirmBox('Agen Banding Prof Dr Claude', 'Medan Bahagian A hingga F kedua-dua rekod (bukan PDF) akan dihantar ke API Anthropic menggunakan kunci API Prof Dr dan dicaj kepada akaun Anthropic Prof Dr (lazimnya beberapa sen setiap laporan). Laporan disimpan supaya tidak perlu dijana semula.', 'Faham, teruskan', false);
      if (!okk) return; R.lsSet('rslr_banding_faham', true);
    }
    const da = rekod(B.a), db = rekod(B.b); const btn = $('#btnBandingAgen');
    B.busy = true; btn.disabled = true; btn.textContent = 'Agen sedang membandingkan';
    $('#bandAgenIsi').innerHTML = '<div class="help">Agen sedang membaca medan A hingga F kedua-dua artikel dan menyusun laporan. Lazimnya kurang seminit.</div>';
    try {
      const user = `${teksRekod(1, da)}\n\n${teksRekod(2, db)}\n\nTugasan: bandingkan Artikel 1 dengan Artikel 2 kepala ke kepala mengikut Bahagian A hingga F, petakan konstruk, peranan, kerangka sumber serta dimensi dan subdimensi setiap artikel dan bandingkan dimensi itu (persamaan, perbezaan, implikasi kepada instrumen Prof Dr), beri skor lapan dimensi penilaian untuk kedua-duanya, kekuatan dan kelemahan masing-masing, laporan keseluruhan ringkas, refleksi perkaitan kedua-duanya dengan kajian Prof Dr, cadangan sitasi bersama, dan artikel yang lebih berguna untuk kajian Prof Dr berserta sebab. Pulangkan JSON mengikut skema.`;
      const res = await R.Isi.hantar(t, { kunciMod: 'banding:' + t.model, system: systemPrompt(t.profil), content: [{ type: 'text', text: user }], skema: skemaLaporan(), alat: alatLaporan(), hadToken: 8192 });
      const j = res.input || R.Isi.parseJson(res.text, res.stop); const lap = sahkan(j);
      const data = { idA: B.a, idB: B.b, masa: Date.now(), tarikh: new Date().toISOString().slice(0, 10), model: t.model, token: res.usage, mod: res.mod || null, laporan: lap };
      const awan = await simpan(B.a, B.b, data);
      await simpanPeta(B.a, lap.dimensi.a, t.model, 'banding'); await simpanPeta(B.b, lap.dimensi.b, t.model, 'banding');
      B.laporan = lap; B.simpanan = data; renderAgen(da, db); B.pasangan = null; muatPasangan().then(() => renderPola());
      toast('Laporan Agen Banding siap' + (awan ? ' dan disimpan ke awan.' : '; disimpan pada peranti ini sahaja (awan menolak).'));
    } catch (e) { $('#bandAgenIsi').innerHTML = `<div class="help bad">Agen gagal: ${esc(R.Isi.msg(e))}</div>`; toast('Agen Banding gagal: ' + R.Isi.msg(e), true); }
    finally { B.busy = false; btn.disabled = false; btn.textContent = 'Mohon Agen Banding Prof Dr Claude'; }
  }
  function renderAgen(da, db) {
    const l = B.laporan; const el = $('#bandAgenIsi'); if (!l || !el) return;
    const va = l.skor.map(x => x.a), vb = l.skor.map(x => x.b); const labels = l.skor.map(x => x.dimensi);
    const menang = l.lebihBerguna === 'Artikel 1' ? nama(da) : l.lebihBerguna === 'Artikel 2' ? nama(db) : 'Kedua-dua setara';
    el.innerHTML = `<div class="band-stat">Dijana ${esc(R.fmtTime(B.simpanan ? B.simpanan.masa : Date.now()))}${B.simpanan && B.simpanan.model ? ' (' + esc(String(B.simpanan.model).replace('claude-', '')) + ')' : ''}${B.simpanan && B.simpanan.token ? '; token masuk ' + esc(B.simpanan.token.masuk) + ', keluar ' + esc(B.simpanan.token.keluar) : ''}. Draf untuk disemak oleh Prof Dr.</div>
      <div class="band-dua profil"><div class="band-profil a"><b>Artikel 1: ${esc(nama(da))}</b><p>${esc(l.profil.a)}</p></div><div class="band-profil b"><b>Artikel 2: ${esc(nama(db))}</b><p>${esc(l.profil.b)}</p></div></div>
      ${l.skor.length ? `<h3 class="band-h3">Penilaian teknikal agen</h3><div class="band-dua"><div class="band-radar">${radar(labels, va, vb, nama(da), nama(db))}</div><div><div class="band-skor"><span class="a">${purata(va)}</span><span class="vs">purata</span><span class="b">${purata(vb)}</span></div>${bars(l.skor.map(x => ({ label: x.dimensi, a: x.a, b: x.b, ulasan: x.ulasan })))}</div></div>` : ''}
      ${seksyenDimensi(l, da, db)}
      <h3 class="band-h3">Perbandingan setiap bahagian</h3>
      ${l.bahagian.map(x => { const s = SEK.find(y => y.letter === x.bahagian); return `<div class="band-sekagen"><h4>Bahagian ${esc(x.bahagian)}. ${esc(s ? s.title : '')}</h4><div class="tiga"><div><b>Persamaan</b>${esc(x.persamaan)}</div><div><b>Perbezaan</b>${esc(x.perbezaan)}</div><div><b>Penilaian</b>${esc(x.penilaian)}</div></div></div>`; }).join('')}
      <div class="band-dua kk"><div><h4>Artikel 1</h4><p><b>Kekuatan.</b> ${esc(l.kekuatan.a)}</p><p><b>Kelemahan.</b> ${esc(l.kelemahan.a)}</p></div><div><h4>Artikel 2</h4><p><b>Kekuatan.</b> ${esc(l.kekuatan.b)}</p><p><b>Kelemahan.</b> ${esc(l.kelemahan.b)}</p></div></div>
      <h3 class="band-h3">Laporan keseluruhan</h3><p class="band-p">${esc(l.keseluruhan)}</p>
      <h3 class="band-h3">Refleksi terhadap kajian Prof Dr</h3><p class="band-p">${esc(l.refleksi)}</p>
      <h3 class="band-h3">Cadangan sitasi bersama</h3><p class="band-p">${esc(l.sitasi)}</p>
      <div class="band-verdict"><b>Lebih berguna untuk kajian Prof Dr: ${esc(menang)}.</b> ${esc(l.sebab)}</div>
      <div class="band-tulis"><button class="btn btn-primary" data-tulis="1">Tulis ke Tulisan Tesis (Bab 2)</button><span class="help">Laporan keseluruhan, refleksi dan cadangan sitasi dimasukkan sebagai seksyen baharu dalam Bab 2 Sorotan Literatur untuk Prof Dr olah menjadi perenggan tesis; tiada yang perlu ditaip semula.</span></div>`;
    $('#btnBandingSalin').hidden = false; $('#btnBandingMd').hidden = false;
  }

  /* ---- dimensi dan subdimensi konstruk ---- */
  function kadKonstruk(k, samaSet) {
    return `<div class="band-kons"><div class="kh"><b>${esc(k.konstruk)}</b><span class="tag p${PERANAN.indexOf(k.peranan)}">${esc(k.peranan)}</span></div><div class="kr">Kerangka: ${esc(k.kerangka || 'Tiada dalam rekod')}</div>${k.dimensi.length ? `<ul class="kd">${k.dimensi.map(dd => `<li class="${samaSet && samaSet.has(normDim(dd.nama)) ? 'sama' : ''}">${esc(dd.nama)}${dd.sub.length ? `<span class="sub">${esc(dd.sub.join('; '))}</span>` : ''}</li>`).join('')}</ul>` : '<div class="kd-tiada">Dimensi tidak dinyatakan dalam rekod (unidimensi atau belum diisi).</div>'}</div>`;
  }
  function setDim(arr, peranan) { const st = new Set(); (arr || []).forEach(k => { if (!peranan || k.peranan === peranan) k.dimensi.forEach(dd => st.add(normDim(dd.nama))); }); return st; }
  function samaMengikutPeranan(a, b) { const out = {}; PERANAN.forEach(p => { const sa = setDim(a, p), sb = setDim(b, p); out[p] = new Set([...sa].filter(x => sb.has(x))); }); return out; }
  function seksyenDimensi(l, da, db) {
    const dm = l.dimensi || { a: [], b: [] }; const bd = l.bandingDimensi || {}; const sama = samaMengikutPeranan(dm.a, dm.b);
    const kolum = (arr, sisi) => arr.length ? arr.map(k => kadKonstruk(k, sama[k.peranan])).join('') : '<div class="help">Tiada konstruk dapat dipetakan daripada rekod.</div>';
    const jumlahSama = PERANAN.reduce((s, p) => s + sama[p].size, 0);
    return `<h3 class="band-h3">Dimensi dan subdimensi konstruk</h3>
      <div class="help">Dipetakan oleh agen daripada medan konstruk, definisi, teori dan instrumen; dimensi yang dikongsi bagi peranan konstruk yang sama ditanda hijau (${jumlahSama} dikongsi). Peta setiap artikel disimpan dalam rekodnya untuk pola merentas artikel.</div>
      <div class="band-dua"><div class="band-kons-col a"><h4>Artikel 1: ${esc(nama(da))}</h4>${kolum(dm.a, 'a')}</div><div class="band-kons-col b"><h4>Artikel 2: ${esc(nama(db))}</h4>${kolum(dm.b, 'b')}</div></div>
      <div class="band-sekagen"><h4>Perbandingan dimensi</h4><div class="tiga"><div><b>Persamaan</b>${esc(bd.persamaan || '')}</div><div><b>Perbezaan</b>${esc(bd.perbezaan || '')}</div><div><b>Implikasi kepada instrumen Prof Dr</b>${esc(bd.implikasi || '')}</div></div></div>`;
  }

  /* ---- kayu ukur (artikel penanda aras) ---- */
  async function muatKayu() {
    let k = R.lsGet('rslr_banding_kayu', null); let masaL = k && k.masa || 0;
    try { const awan = await R.db().get('meta/banding_kayu'); if (awan && (awan.masa || 0) >= masaL) k = awan; } catch (e) {}
    B.kayu = k && k.id && R.S.docs.has(k.id) ? k.id : (k && k.id) || ''; return B.kayu;
  }
  async function tetapKayu(id) {
    B.kayu = id || ''; const data = { id: B.kayu, masa: Date.now() }; R.lsSet('rslr_banding_kayu', data);
    try { await R.db().set('meta/banding_kayu', data); } catch (e) { console.warn('banding: kayu ukur awan gagal', e); }
    refresh();
  }
  function renderKayu() {
    const el = $('#bandKayu'); if (!el) return;
    if (!B.kayu || !R.S.docs.has(B.kayu)) { el.innerHTML = `<span class="help">Belum ada kayu ukur. Pilih Artikel 1, kemudian klik "Jadikan Artikel 1 kayu ukur" supaya ia kekal sebagai penanda aras dan artikel lain digilirkan sebagai Artikel 2.</span><button class="btn btn-sm" data-kayuset="1"${B.a ? '' : ' disabled'}>Jadikan Artikel 1 kayu ukur</button>`; return; }
    const d = rekod(B.kayu); const dibanding = (B.pasangan || []).filter(p => p.idA === B.kayu || p.idB === B.kayu);
    el.innerHTML = `<span class="kayu-nama"><b>Kayu ukur:</b> ${esc(nama(d))}${dibanding.length ? ` · sudah dibanding dengan ${dibanding.length} artikel` : ''}</span>${B.a !== B.kayu ? '<button class="btn btn-sm" data-kayuguna="1">Guna sebagai Artikel 1</button>' : ''}<button class="btn btn-sm" data-kayuseterusnya="1" title="Pilih artikel lengkap seterusnya yang belum dibandingkan dengan kayu ukur">Artikel seterusnya</button><button class="btn btn-sm" data-kayubatal="1">Batal kayu ukur</button>`;
  }
  function seterusnya() {
    if (!B.kayu) return; const sudah = new Set((B.pasangan || []).filter(p => p.idA === B.kayu || p.idB === B.kayu).map(p => p.idA === B.kayu ? p.idB : p.idA));
    const calon = senaraiPilihan().map(x => x[0]).filter(id => id !== B.kayu && !sudah.has(id) && kelengkapan(rekod(id)).ok);
    if (!calon.length) { toast('Semua artikel lengkap sudah dibandingkan dengan kayu ukur'); return; }
    B.a = B.kayu; B.b = calon[0]; refresh(); banding();
  }

  /* ---- pola merentas artikel ---- */
  async function muatPasangan() {
    const all = R.lsGet('rslr_banding', {}) || {}; const map = {};
    Object.keys(all).forEach(k => { const v = all[k]; if (v && v.laporan) map[k] = { idA: v.idA, idB: v.idB, masa: v.masa || 0, lebihBerguna: v.laporan.lebihBerguna }; });
    try { const rows = await R.db().list('meta', 200); rows.forEach(r => { if (!/^banding_/.test(r.id) || !r.data || !r.data.laporan) return; const k = r.id.replace(/^banding_/, ''); if (!map[k] || (r.data.masa || 0) > map[k].masa) map[k] = { idA: r.data.idA, idB: r.data.idB, masa: r.data.masa || 0, lebihBerguna: r.data.laporan.lebihBerguna }; }); } catch (e) {}
    B.pasangan = Object.values(map).filter(p => R.S.docs.has(p.idA) && R.S.docs.has(p.idB)).sort((x, y) => y.masa - x.masa); return B.pasangan;
  }
  function artikelBerpeta() { return senaraiPilihan().filter(([id, d]) => d.petaDimensi && Array.isArray(d.petaDimensi.konstruk) && d.petaDimensi.konstruk.length).map(([id, d]) => ({ id, d, konstruk: d.petaDimensi.konstruk })); }
  function padananKayu(konstruk, kayuKonstruk) {
    const sa = setDim(konstruk), sb = setDim(kayuKonstruk); if (!sa.size && !sb.size) return null; const irisan = [...sa].filter(x => sb.has(x)).length; const kesatuan = new Set([...sa, ...sb]).size; return kesatuan ? Math.round(100 * irisan / kesatuan) : 0;
  }
  function renderPola() {
    const el = $('#bandPola'); if (!el) return;
    const semua = artikelBerpeta(); const kayu = B.kayu && R.S.docs.has(B.kayu) ? B.kayu : ''; const kayuK = kayu ? ((rekod(kayu).petaDimensi || {}).konstruk || []) : [];
    const tanpa = senaraiPilihan().filter(([id, d]) => !(d.petaDimensi && d.petaDimensi.konstruk && d.petaDimensi.konstruk.length) && !kosong(d.konstruk));
    semua.sort((x, y) => (y.id === kayu) - (x.id === kayu) || (parseInt(y.d.tahun, 10) || 0) - (parseInt(x.d.tahun, 10) || 0));
    const kekerapan = {}; const kerangkaK = {}; semua.forEach(x => x.konstruk.forEach(k => { const p = k.peranan; kekerapan[p] = kekerapan[p] || {}; const seen = new Set(); k.dimensi.forEach(dd => { const nd = normDim(dd.nama); if (!nd || seen.has(nd)) return; seen.add(nd); kekerapan[p][nd] = kekerapan[p][nd] || { nama: dd.nama, n: 0 }; kekerapan[p][nd].n++; }); const kr = normDim(k.kerangka); if (kr && kr !== normDim('Tiada dalam rekod')) { kerangkaK[p] = kerangkaK[p] || {}; kerangkaK[p][kr] = kerangkaK[p][kr] || { nama: k.kerangka, n: 0 }; kerangkaK[p][kr].n++; } }));
    const pasangan = (B.pasangan || []).filter(p => !kayu || p.idA === kayu || p.idB === kayu).slice(0, 30);
    const senaraiPas = pasangan.length ? `<div class="pola-pasangan">${pasangan.map(p => { const lain = kayu ? (p.idA === kayu ? p.idB : p.idA) : null; const da = rekod(p.idA), db = rekod(p.idB); return `<button class="tul-link" data-bukapasangan="${esc(p.idA)}|${esc(p.idB)}"><b>${kayu ? esc(nama(rekod(lain))) : esc(nama(da)) + ' lwn ' + esc(nama(db))}</b> <span>${esc(R.fmtTime(p.masa))}${p.lebihBerguna ? ' · lebih berguna: ' + esc(p.lebihBerguna) : ''}</span></button>`; }).join('')}</div>` : '<div class="help">Belum ada laporan agen tersimpan.</div>';
    const kolumPeranan = ['Bebas', 'Perantara', 'Bersandar', 'Lain'];
    const selPeranan = p => p === 'Penyederhana' || p === 'Kawalan' ? 'Lain' : p;
    const matriks = semua.length ? `<div class="pola-tbl"><div class="h">Artikel</div>${kolumPeranan.map(p => `<div class="h">${esc(p)}</div>`).join('')}<div class="h">Padanan kayu ukur</div>${semua.map(x => { const sama = kayu && x.id !== kayu ? samaMengikutPeranan(x.konstruk, kayuK) : null; const pd = kayu && x.id !== kayu ? padananKayu(x.konstruk, kayuK) : null; return `<div class="k${x.id === kayu ? ' kayu' : ''}"><b>${esc(nama(x.d))}</b>${x.id === kayu ? ' <span class="tag kayu">Kayu ukur</span>' : ''}<span class="sub">Bil. ${esc(x.d.bil || '?')} · ${esc(x.d.tema || '')}</span><button class="btn btn-sm" data-buka="${esc(x.id)}">Rekod</button></div>${kolumPeranan.map(p => { const ks = x.konstruk.filter(k => selPeranan(k.peranan) === p); return `<div>${ks.length ? ks.map(k => `<div class="pk"><b>${esc(k.konstruk)}</b> <i>${esc(k.kerangka)}</i><div class="chips">${k.dimensi.map(dd => `<span class="tag${sama && sama[k.peranan] && sama[k.peranan].has(normDim(dd.nama)) ? ' sama' : ''}" title="${esc(dd.sub.join('; '))}">${esc(dd.nama)}</span>`).join('') || '<span class="help">unidimensi atau tidak dinyatakan</span>'}</div></div>`).join('') : '<span class="help">tiada</span>'}</div>`; }).join('')}<div class="pdn">${pd == null ? (x.id === kayu ? 'rujukan' : 'tiada data') : pd + '%'}</div>`; }).join('')}</div>` : '<div class="help">Belum ada artikel berpeta dimensi. Peta dicipta automatik apabila Agen Banding dijalankan, atau dengan butang di bawah.</div>';
    const ringkas = Object.keys(kekerapan).length ? `<div class="pola-ringkas">${['Bebas', 'Perantara', 'Bersandar', 'Penyederhana', 'Kawalan', 'Lain'].filter(p => kekerapan[p]).map(p => { const dims = Object.values(kekerapan[p]).sort((x, y) => y.n - x.n).slice(0, 10); const krs = Object.values(kerangkaK[p] || {}).sort((x, y) => y.n - x.n).slice(0, 5); return `<div class="pola-kad"><h4>${esc(p)}</h4><div class="help">Dimensi paling kerap (bilangan artikel):</div><div class="chips">${dims.map(x => `<span class="tag">${esc(x.nama)} <b>${x.n}</b></span>`).join('')}</div>${krs.length ? `<div class="help">Kerangka sumber: ${krs.map(x => esc(x.nama) + ' (' + x.n + ')').join(', ')}</div>` : ''}</div>`; }).join('')}</div>` : '';
    el.innerHTML = `<div class="grp-head"><h2>Pola merentas artikel</h2><span class="sub">Peta dimensi semua artikel yang pernah dipetakan, dengan kayu ukur sebagai rujukan; dimensi yang sama dengan kayu ukur ditanda hijau dan padanan dikira sebagai peratus dimensi yang dikongsi (Jaccard).</span></div>
      <div class="pola-grid"><div><h4>Pasangan dengan ${kayu ? 'kayu ukur' : 'laporan tersimpan'} (${pasangan.length})</h4>${senaraiPas}</div><div><h4>Peta dimensi (${semua.length} artikel)</h4><div class="band-acts"><button class="btn btn-sm btn-ai" data-janapeta="1"${tanpa.length && !B.sibukPeta ? '' : ' disabled'}>${B.sibukPeta ? 'Sedang memetakan' : 'Jana peta dimensi bagi ' + tanpa.length + ' artikel tanpa peta'}</button><button class="btn btn-sm" data-polacsv="1"${semua.length ? '' : ' disabled'}>Eksport pola (CSV)</button></div><div class="help">Peta dijana daripada medan konstruk, definisi, teori dan instrumen rekod (bukan PDF); artikel yang medan konstruknya kosong dilangkau.</div></div></div>
      ${matriks}${ringkas}`;
  }
  async function janaPeta() {
    if (B.sibukPeta) return; const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const senarai = senaraiPilihan().filter(([id, d]) => !(d.petaDimensi && d.petaDimensi.konstruk && d.petaDimensi.konstruk.length) && !kosong(d.konstruk));
    if (!senarai.length) { toast('Semua artikel yang ada medan konstruk sudah berpeta'); return; }
    const okk = await R.confirmBox('Jana peta dimensi?', `${senarai.length} artikel akan dipetakan satu demi satu (medan konstruk, definisi, teori dan instrumen sahaja; kira-kira satu hingga dua sen setiap artikel).`, 'Jana', false); if (!okk) return;
    B.sibukPeta = true; renderPola(); let siap = 0, gagal = 0;
    for (const [id, d] of senarai) {
      try {
        const teks = `ARTIKEL (Bil. ${d.bil || '?'}): ${nama(d)}. ${d.tajuk || ''}\n- Objektif: ${nilaiTeks(d.objektif).slice(0, 800)}\n- Konstruk dan peranannya: ${nilaiTeks(d.konstruk).slice(0, 2000)}\n- Definisi konstruk: ${nilaiTeks(d.definisi).slice(0, 2000)}\n- Teori atau model: ${nilaiTeks(d.teori).slice(0, 1000)}\n- Instrumen: ${nilaiTeks(d.instrumen).slice(0, 2000)}\n- Dapatan (ringkas): ${nilaiTeks(d.dapatan).slice(0, 800)}\n\nTugasan: petakan setiap konstruk artikel ini dengan peranan, kerangka atau instrumen sumber, dan dimensi serta subdimensinya tepat seperti dalam medan; senarai dimensi kosong jika tidak dinyatakan. Pulangkan JSON mengikut skema.`;
        const res = await R.Isi.hantar(t, { kunciMod: 'peta:' + t.model, system: systemPrompt(t.profil), content: [{ type: 'text', text: teks }], skema: { type: 'object', additionalProperties: false, required: ['konstruk'], properties: { konstruk: skemaKonstruk('artikel ini') } }, alat: alatPeta(), hadToken: 4096 });
        const j = res.input || R.Isi.parseJson(res.text, res.stop); const konstruk = senaraiKonstruk(j && j.konstruk);
        if (konstruk.length && await simpanPeta(id, konstruk, t.model, 'agen')) siap++; else gagal++;
      } catch (e) { gagal++; console.warn('peta dimensi gagal', id, e); }
      renderPola();
    }
    B.sibukPeta = false; renderPola(); toast(`Peta dimensi: ${siap} artikel dipetakan${gagal ? ', ' + gagal + ' gagal' : ''}.`);
  }
  function polaCsv() {
    const baris = [['Bil', 'Penulis', 'Tahun', 'Tema', 'Peranan', 'Konstruk', 'Kerangka', 'Dimensi', 'Subdimensi', 'Kayu ukur']];
    artikelBerpeta().forEach(x => x.konstruk.forEach(k => { (k.dimensi.length ? k.dimensi : [{ nama: '', sub: [] }]).forEach(dd => baris.push([x.d.bil || '', x.d.penulis || '', x.d.tahun || '', x.d.tema || '', k.peranan, k.konstruk, k.kerangka, dd.nama, dd.sub.join('; '), x.id === B.kayu ? 'Ya' : ''])); }));
    const csv = '﻿' + baris.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    R.saveFile('Pola_Dimensi_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
  }

  /* ---- eksport laporan ---- */
  function laporanMd() {
    const da = rekod(B.a), db = rekod(B.b); const l = B.laporan; const ia = indeksPantas(da), ib = indeksPantas(db);
    const out = [`# Banding Artikel: ${nama(da)} lwn ${nama(db)}`, '', `Artikel 1: ${nama(da)}. ${da.tajuk || ''}${da.doi ? ' https://doi.org/' + da.doi : ''}`, `Artikel 2: ${nama(db)}. ${db.tajuk || ''}${db.doi ? ' https://doi.org/' + db.doi : ''}`, '', '## Indeks pantas (automatik daripada medan)', '', '| Dimensi | Artikel 1 | Artikel 2 |', '|---|---|---|'];
    PANTAS.forEach((p, i) => out.push(`| ${p} | ${ia[i].nilai} (${ia[i].sebab}) | ${ib[i].nilai} (${ib[i].sebab}) |`));
    if (l) {
      out.push('', `## Laporan Agen Banding Prof Dr Claude${B.simpanan ? ' (' + R.fmtTime(B.simpanan.masa) + ', ' + (B.simpanan.model || '') + ')' : ''}`, '', `**Artikel 1.** ${l.profil.a}`, '', `**Artikel 2.** ${l.profil.b}`, '');
      if (l.skor.length) { out.push('### Penilaian teknikal', '', '| Dimensi | Artikel 1 | Artikel 2 | Ulasan |', '|---|---|---|---|'); l.skor.forEach(x => out.push(`| ${x.dimensi} | ${x.a} | ${x.b} | ${x.ulasan.replace(/\|/g, '/')} |`)); out.push(''); }
      if (l.dimensi) { out.push('### Dimensi dan subdimensi konstruk', ''); [['Artikel 1', l.dimensi.a], ['Artikel 2', l.dimensi.b]].forEach(([lbl, arr]) => { out.push(`**${lbl}**`, ''); (arr || []).forEach(k => { out.push(`- ${k.konstruk} (${k.peranan}; kerangka: ${k.kerangka}): ${k.dimensi.length ? k.dimensi.map(dd => dd.nama + (dd.sub.length ? ' [' + dd.sub.join('; ') + ']' : '')).join('; ') : 'dimensi tidak dinyatakan'}`); }); out.push(''); }); const bd = l.bandingDimensi || {}; out.push(`Persamaan dimensi: ${bd.persamaan || ''}`, '', `Perbezaan dimensi: ${bd.perbezaan || ''}`, '', `Implikasi kepada instrumen: ${bd.implikasi || ''}`, ''); }
      out.push('### Perbandingan setiap bahagian', ''); l.bahagian.forEach(x => { const s = SEK.find(y => y.letter === x.bahagian); out.push(`**Bahagian ${x.bahagian}. ${s ? s.title : ''}**`, '', `Persamaan: ${x.persamaan}`, '', `Perbezaan: ${x.perbezaan}`, '', `Penilaian: ${x.penilaian}`, ''); });
      out.push('### Kekuatan dan kelemahan', '', `Artikel 1. Kekuatan: ${l.kekuatan.a} Kelemahan: ${l.kelemahan.a}`, '', `Artikel 2. Kekuatan: ${l.kekuatan.b} Kelemahan: ${l.kelemahan.b}`, '', '### Laporan keseluruhan', '', l.keseluruhan, '', '### Refleksi terhadap kajian Prof Dr', '', l.refleksi, '', '### Cadangan sitasi bersama', '', l.sitasi, '', `**Lebih berguna untuk kajian Prof Dr: ${l.lebihBerguna}.** ${l.sebab}`);
    }
    return out.join('\n');
  }
  async function salin() { const md = laporanMd(); try { await navigator.clipboard.writeText(md); toast('Laporan disalin ke papan keratan (Markdown)'); } catch (e) { R.saveFile('banding.md', md, 'text/markdown'); } }
  function muatTurun() { const da = rekod(B.a), db = rekod(B.b); const nm = (s => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, ''))(`Banding_${da.penulis || 'A'}_${da.tahun || ''}_lwn_${db.penulis || 'B'}_${db.tahun || ''}`); R.saveFile(nm + '.md', laporanMd(), 'text/markdown'); }

  /* ---- peristiwa ---- */
  const root = $('#banding');
  if (root) {
    $('#bandA').addEventListener('change', e => { B.a = e.target.value; refresh(); });
    $('#bandB').addEventListener('change', e => { B.b = e.target.value; refresh(); });
    $('#btnBandingTukar').addEventListener('click', () => { const t = B.a; B.a = B.b; B.b = t; refresh(); if (B.hasil) banding(); });
    $('#btnBanding').addEventListener('click', () => banding());
    $('#btnBandingAgen').addEventListener('click', () => agen());
    $('#btnBandingSalin').addEventListener('click', () => salin());
    $('#btnBandingMd').addEventListener('click', () => muatTurun());
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-buka]'); if (b) { R.openRecord(b.dataset.buka); return; }
      if (e.target.closest('[data-kayuset]')) { if (B.a) tetapKayu(B.a); return; }
      if (e.target.closest('[data-kayubatal]')) { tetapKayu(''); return; }
      if (e.target.closest('[data-kayuguna]')) { if (B.b === B.kayu) B.b = ''; B.a = B.kayu; refresh(); return; }
      if (e.target.closest('[data-kayuseterusnya]')) { seterusnya(); return; }
      const bp = e.target.closest('[data-bukapasangan]'); if (bp) { const [x, y] = bp.dataset.bukapasangan.split('|'); if (B.kayu && y === B.kayu) { B.a = y; B.b = x; } else { B.a = x; B.b = y; } refresh(); banding(); window.scrollTo(0, 0); return; }
      if (e.target.closest('[data-janapeta]')) { janaPeta(); return; }
      if (e.target.closest('[data-polacsv]')) { polaCsv(); return; }
      const f = e.target.closest('[data-flipb]'); if (f) { R.openFlip(f.dataset.flipb, 0); return; }
      if (e.target.closest('[data-tulis]') && B.laporan && R.Tulisan) {
        const da = rekod(B.a), db = rekod(B.b); const l = B.laporan;
        const teks = [`Perbandingan ${nama(da)} dengan ${nama(db)}.`, l.keseluruhan, l.refleksi, l.sitasi].filter(Boolean).join('\n\n');
        R.Tulisan.daripadaBanding(2, `Banding: ${nama(da)} lwn ${nama(db)}`, teks, B.a, B.b, `${nama(da)} lwn ${nama(db)}`);
        R.goView('tulisan'); toast('Seksyen baharu dicipta dalam Bab 2 daripada laporan Banding');
      }
    });
  }
  return { show, refresh, banding, agen, indeksPantas, kelengkapan, laporanMd, senaraiKonstruk, janaPeta, tetapKayu, renderPola, state: B };
}
