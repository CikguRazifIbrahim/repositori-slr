/* Ruang Rajah Statistik (Pandu Tulis, folder Dapatan; PILIHAN). Rajah dibina daripada medan sebenar artikel sumber artikel ini (tahun,
   negara, reka bentuk dan seumpamanya) atau daripada data yang ditaip sendiri oleh pemilik: graf palang menegak, graf palang mendatar,
   carta pai dan graf garis. Tiada panggilan API dan tiada angka direka: kiraan datang terus daripada rekod. Rajah boleh disisip ke RAM
   atau ASAL sebagai imej berkapsyen, dimuat turun sebagai PNG, dan jadual kekerapannya boleh disisip ke RAM. Pilihan terakhir disimpan
   dalam tetapan Pandu Tulis (meta/pandu_<id>.rajah). */
export function initRajah(X) {
  const { R, C, P, esc, toast, angka, simpanT, en, sasaranRam, sisip, Teks, A } = X;
  const MEDAN = [['tahun', 'Tahun penerbitan', 'year of publication'], ['negara', 'Negara kajian', 'country'], ['rekaBentuk', 'Reka bentuk kajian', 'research design'], ['jenis', 'Jenis artikel', 'article type'], ['tema', 'Tema utama', 'main theme'], ['peringkat', 'Peringkat pendidikan', 'education level'], ['teknik', 'Teknik analisis', 'analysis technique'], ['indeks', 'Pengindeksan', 'indexing'], ['kuartil', 'Kuartil', 'quartile']];
  const JENIS = [['bar', 'Graf palang menegak'], ['barh', 'Graf palang mendatar'], ['pai', 'Carta pai'], ['garis', 'Graf garis']];
  const WARNA = ['#1F6F78', '#D98E04', '#5B8DB8', '#B4504A', '#6A8F4E', '#8C6BB1', '#C27BA0', '#4C5B6B', '#2A9D8F', '#E76F51', '#7D8597', '#A7C957', '#9AA5B1'];
  const TIADA = /^(|-|tiada dalam artikel|tidak dilaporkan|tidak pasti|tiada|not reported|n\/a)$/i;
  const HAD_KATEGORI = 12;
  const data = () => { if (!P.t.rajah || typeof P.t.rajah !== 'object') P.t.rajah = { medan: 'tahun', jenis: 'bar', tajuk: '', sendiri: '' }; return P.t.rajah; };
  const medanAda = () => MEDAN.filter(m => (R.FIELD_BY_KEY || {})[m[0]]);
  const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pendek = (t, n) => (String(t).length > n ? String(t).slice(0, n - 1).trim() + '…' : String(t));

  /* Kiraan kategori: [[label, n]] dan bilangan artikel yang menyumbang. Medan teks bebas dipecahkan pada koma bertitik, koma dan "dan". */
  function kira() {
    const d = data(); const e = en(); const tl = e ? 'Not reported' : 'Tidak dilaporkan';
    if (d.medan === 'sendiri') { const baris = String(d.sendiri || '').split('\n').map(l => { const m = /^(.*?)[,;\t]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(l.trim()); return m && m[1].trim() ? [m[1].trim(), Math.max(0, +m[2])] : null; }).filter(Boolean).slice(0, 24); return { baris, nArtikel: 0, jumlah: baris.reduce((s, x) => s + x[1], 0), sendiri: true }; }
    const dok = C.doc(); const ids = dok ? C.sumberAda(dok) : []; const peta = new Map(); const tambah = k => peta.set(k, (peta.get(k) || 0) + 1);
    ids.forEach(id => { const r = R.S.docs.get(id) || {}; const v = r[d.medan]; let nilai;
      if (d.medan === 'tahun') { const m = /\b(19|20)\d{2}\b/.exec(String(v || '')); nilai = [m ? m[0] : '']; }
      else nilai = (Array.isArray(v) ? v : String(v == null ? '' : v).split(/\s*;\s*|\s*,\s*|\s+dan\s+|\s+and\s+/)).map(x => String(x).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter((x, i, a) => a.indexOf(x) === i);
      if (!nilai.length) nilai = ['']; nilai.forEach(x => tambah(TIADA.test(x) ? tl : pendek(x.charAt(0).toUpperCase() + x.slice(1), 42))); });
    let baris = Array.from(peta.entries());
    if (d.medan === 'tahun') baris.sort((a, b) => (a[0] === tl) - (b[0] === tl) || a[0].localeCompare(b[0]));
    else { baris.sort((a, b) => (a[0] === tl) - (b[0] === tl) || b[1] - a[1] || a[0].localeCompare(b[0])); if (baris.length > HAD_KATEGORI) { const lebih = baris.slice(HAD_KATEGORI - 1).filter(x => x[0] !== tl); const kekal = baris.slice(0, HAD_KATEGORI - 1).concat(baris.slice(HAD_KATEGORI - 1).filter(x => x[0] === tl)); baris = kekal.concat([[e ? 'Others' : 'Lain-lain', lebih.reduce((s, x) => s + x[1], 0)]]); } }
    return { baris, nArtikel: ids.length, jumlah: baris.reduce((s, x) => s + x[1], 0), sendiri: false };
  }
  const namaMedan = () => { const d = data(); const m = MEDAN.find(x => x[0] === d.medan); return m ? (en() ? m[2] : m[1].toLowerCase()) : ''; };
  const kapsyen = () => { const d = data(); if (String(d.tajuk || '').trim()) return d.tajuk.trim(); if (d.medan === 'sendiri') return en() ? '[ISI: figure title]' : '[ISI: tajuk rajah]'; return en() ? `Distribution of the included studies by ${namaMedan()}` : `Taburan kajian yang dimasukkan mengikut ${namaMedan()}`; };
  const ringkas = () => { const k = kira(); const d = data(); return k.baris.length ? `${(JENIS.find(x => x[0] === d.jenis) || JENIS[0])[1].toLowerCase()} · ${k.baris.length} kategori` : 'pilihan; belum digunakan'; };

  /* ---- lukisan SVG ---- */
  function skala(maks) { const m = Math.max(1, maks); const kuasa = Math.pow(10, Math.floor(Math.log10(m))); const asas = [1, 2, 5, 10].find(x => m / (x * kuasa) <= 5) || 10; const langkah = Math.max(1, asas * kuasa); const atas = Math.ceil(m / langkah) * langkah; const tik = []; for (let v = 0; v <= atas + 1e-9; v += langkah) tik.push(Math.round(v * 100) / 100); return { atas, tik }; }
  function svg() {
    const k = kira(); const d = data(); const b = k.baris; const W = 760, H = 440; const F = 13; const paksiY = k.sendiri ? (en() ? 'Value' : 'Nilai') : (en() ? 'Number of studies' : 'Bilangan kajian');
    const kepala = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif" font-size="${F}" fill="#1f2937"><rect width="${W}" height="${H}" fill="#ffffff"/>`;
    if (!b.length) return kepala + `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#6b7280">${xml(k.sendiri ? 'Taip data: satu baris bagi setiap kategori, contohnya Malaysia, 6' : 'Tiada artikel sumber untuk dikira')}</text></svg>`;
    const maks = Math.max.apply(null, b.map(x => x[1])); let s = kepala;
    if (d.jenis === 'pai') {
      const cx = 215, cy = 220, r = 165; const jum = k.jumlah || 1; let sudut = -Math.PI / 2;
      b.forEach((x, i) => { const bhg = x[1] / jum; const a2 = sudut + bhg * 2 * Math.PI; const w = WARNA[i % WARNA.length];
        if (bhg >= 0.9999) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${w}"/>`;
        else if (bhg > 0) s += `<path d="M${cx},${cy} L${(cx + r * Math.cos(sudut)).toFixed(2)},${(cy + r * Math.sin(sudut)).toFixed(2)} A${r},${r} 0 ${bhg > 0.5 ? 1 : 0} 1 ${(cx + r * Math.cos(a2)).toFixed(2)},${(cy + r * Math.sin(a2)).toFixed(2)} Z" fill="${w}" stroke="#ffffff" stroke-width="1.5"/>`;
        sudut = a2; const ly = 46 + i * Math.min(28, 360 / b.length);
        s += `<rect x="430" y="${ly - 11}" width="14" height="14" fill="${w}"/><text x="452" y="${ly + 1}">${xml(pendek(x[0], 26))} (n = ${angka(x[1])}; ${(bhg * 100).toFixed(1)}%)</text>`; });
      return s + '</svg>';
    }
    if (d.jenis === 'barh') {
      const L = 210, Rt = 60, T = 18, B = 46; const lebar = W - L - Rt; const sk = skala(maks); const th = (H - T - B) / b.length; const bh = Math.min(30, th * 0.68);
      sk.tik.forEach(v => { const x = L + lebar * v / sk.atas; s += `<line x1="${x}" y1="${T}" x2="${x}" y2="${H - B}" stroke="#e5e7eb"/><text x="${x}" y="${H - B + 18}" text-anchor="middle" fill="#4b5563">${angka(v)}</text>`; });
      b.forEach((x, i) => { const y = T + th * i + (th - bh) / 2; const w = lebar * x[1] / sk.atas; s += `<rect x="${L}" y="${y.toFixed(1)}" width="${Math.max(1, w).toFixed(1)}" height="${bh.toFixed(1)}" fill="${WARNA[0]}"/><text x="${L - 8}" y="${(y + bh / 2 + 4.5).toFixed(1)}" text-anchor="end">${xml(pendek(x[0], 30))}</text><text x="${(L + w + 6).toFixed(1)}" y="${(y + bh / 2 + 4.5).toFixed(1)}">${angka(x[1])}</text>`; });
      return s + `<line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#1f2937"/><text x="${L + lebar / 2}" y="${H - 8}" text-anchor="middle" fill="#4b5563">${xml(paksiY)}</text></svg>`;
    }
    const condong = b.length > 6 || b.some(x => x[0].length > 12); const L = 62, Rt = 20, T = 24, B = condong ? 104 : 58; const lebar = W - L - Rt, tinggi = H - T - B; const sk = skala(maks); const tw = lebar / b.length;
    sk.tik.forEach(v => { const y = T + tinggi - tinggi * v / sk.atas; s += `<line x1="${L}" y1="${y}" x2="${W - Rt}" y2="${y}" stroke="#e5e7eb"/><text x="${L - 8}" y="${y + 4.5}" text-anchor="end" fill="#4b5563">${angka(v)}</text>`; });
    const titik = b.map((x, i) => [L + tw * i + tw / 2, T + tinggi - tinggi * x[1] / sk.atas]);
    if (d.jenis === 'garis') { s += `<polyline points="${titik.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${WARNA[0]}" stroke-width="2.5"/>`; titik.forEach((p, i) => { s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="${WARNA[0]}"/><text x="${p[0].toFixed(1)}" y="${(p[1] - 10).toFixed(1)}" text-anchor="middle">${angka(b[i][1])}</text>`; }); }
    else { const bw = Math.min(64, tw * 0.66); b.forEach((x, i) => { const h = tinggi * x[1] / sk.atas; const px = L + tw * i + (tw - bw) / 2; s += `<rect x="${px.toFixed(1)}" y="${(T + tinggi - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" fill="${WARNA[0]}"/><text x="${(px + bw / 2).toFixed(1)}" y="${(T + tinggi - h - 6).toFixed(1)}" text-anchor="middle">${angka(x[1])}</text>`; }); }
    b.forEach((x, i) => { const px = L + tw * i + tw / 2; const y = T + tinggi + 18; s += condong ? `<text transform="translate(${px.toFixed(1)} ${y}) rotate(-35)" text-anchor="end">${xml(pendek(x[0], 22))}</text>` : `<text x="${px.toFixed(1)}" y="${y}" text-anchor="middle">${xml(pendek(x[0], 14))}</text>`; });
    return s + `<line x1="${L}" y1="${T}" x2="${L}" y2="${T + tinggi}" stroke="#1f2937"/><line x1="${L}" y1="${T + tinggi}" x2="${W - Rt}" y2="${T + tinggi}" stroke="#1f2937"/><text transform="translate(16 ${T + tinggi / 2}) rotate(-90)" text-anchor="middle" fill="#4b5563">${xml(paksiY)}</text></svg>`;
  }
  function png(z) {
    return new Promise((res, rej) => { const src = svg(); const m = /viewBox="0 0 (\d+) (\d+)"/.exec(src); const w = +m[1], h = +m[2]; const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' })); const im = new Image();
      im.onload = () => { try { const c = document.createElement('canvas'); c.width = w * z; c.height = h * z; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('PNG gagal dijana')), 'image/png'); } catch (e) { URL.revokeObjectURL(url); rej(e); } };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Rajah gagal dilukis')); }; im.src = url; });
  }
  function htmlJadual(k) { const e = en(); const j = k.jumlah || 1; return `<table><tbody><tr><th>${e ? 'Category' : 'Kategori'}</th><th>n</th><th>%</th></tr>${k.baris.map(x => `<tr><td>${esc(x[0])}</td><td>${angka(x[1])}</td><td>${(x[1] / j * 100).toFixed(1)}</td></tr>`).join('')}<tr><td><strong>${e ? 'Total' : 'Jumlah'}</strong></td><td><strong>${angka(k.jumlah)}</strong></td><td><strong>100.0</strong></td></tr></tbody></table>`; }

  /* ---- paparan ---- */
  let ELF = null;
  function render(el, f) {
    if (!el) return; ELF = { el, f }; const d = data(); const k = kira(); const ma = medanAda(); if (d.medan !== 'sendiri' && !ma.some(m => m[0] === d.medan)) d.medan = ma.length ? ma[0][0] : 'sendiri';
    el.innerHTML = `<p class="help"><b>Pilihan, tidak wajib.</b> Rajah dibina daripada medan sebenar ${angka(k.nArtikel || (C.doc() ? C.sumberAda(C.doc()).length : 0))} artikel sumber artikel ini, atau daripada data yang Prof Dr taip sendiri. Tiada token digunakan dan tiada angka direka. Jika sesuatu artikel mempunyai lebih daripada satu nilai (contohnya dua negara), setiap nilai dikira, maka jumlah boleh melebihi bilangan artikel.</p>
      <div class="pr-grid rj-pilih"><label class="pr-f">Data <select data-rj="medan">${ma.map(m => `<option value="${m[0]}"${d.medan === m[0] ? ' selected' : ''}>${esc(m[1])}</option>`).join('')}<option value="sendiri"${d.medan === 'sendiri' ? ' selected' : ''}>Data sendiri (taip)</option></select></label>
        <label class="pr-f">Jenis rajah <select data-rj="jenis">${JENIS.map(j => `<option value="${j[0]}"${d.jenis === j[0] ? ' selected' : ''}>${esc(j[1])}</option>`).join('')}</select></label>
        <label class="pr-f rj-tajuk">Tajuk rajah (kapsyen) <input type="text" data-rj="tajuk" value="${esc(d.tajuk || '')}" placeholder="${esc(kapsyen())}"></label></div>
      ${d.medan === 'sendiri' ? `<label class="pr-f blok"><span>Data sendiri: satu baris bagi setiap kategori dalam bentuk "label, nilai"</span><textarea data-rj="sendiri" rows="5" placeholder="Kuantitatif, 9&#10;Kualitatif, 4&#10;Kaedah campuran, 3">${esc(d.sendiri || '')}</textarea></label>` : ''}
      <div class="pd-acts"><button class="btn btn-sm btn-primary" data-rja="ram">Sisip rajah ke RAM</button><button class="btn btn-sm" data-rja="asal">Sisip rajah ke ASAL</button><button class="btn btn-sm" data-rja="png">Muat turun PNG</button><button class="btn btn-sm" data-rja="jadual">Sisip jadual kekerapan ke RAM</button></div>
      <div id="rjRajah" class="pr-rajah">${svg()}</div><div id="rjJadual" class="rj-jadual">${k.baris.length ? htmlJadual(k) : ''}</div>`;
    const g = el.closest('details'); const rs = g && g.querySelector('summary .ring'); if (rs) rs.textContent = ringkas();
  }
  function segar() { if (!ELF || !ELF.el.isConnected) return; const r = ELF.el.querySelector('#rjRajah'); if (r) r.innerHTML = svg(); const j = ELF.el.querySelector('#rjJadual'); const k = kira(); if (j) j.innerHTML = k.baris.length ? htmlJadual(k) : ''; const t = ELF.el.querySelector('[data-rj="tajuk"]'); if (t) t.placeholder = kapsyen(); const g = ELF.el.closest('details'); const rs = g && g.querySelector('summary .ring'); if (rs) rs.textContent = ringkas(); }
  async function sisipRajah(mana) {
    const f = ELF && ELF.f; const sid = f && sasaranRam(f); if (!sid) { toast('Seksyen folder ini tiada', true); return; } const k = kira(); if (!k.baris.length) { toast('Tiada data untuk dilukis', true); return; }
    try { const kap = kapsyen(); const blob = await png(2); const r = await Teks.simpanImej(blob, { n: A.id, id: sid, nama: kap }); const e = en();
      const html = `<p><img data-imej="${r.id}" src="${r.dataUrl}" alt="${esc(kap)}"></p><p><em>${e ? 'Figure [n].' : 'Rajah [n].'} ${esc(kap)}${k.sendiri ? '' : ` (${e ? 'N' : 'N'} = ${angka(k.nArtikel)})`}.</em></p>`;
      if (sisip(sid, mana, html)) { toast(`Rajah disisip ke ${mana === 'asal' ? 'ASAL' : 'RAM'} seksyen. Semak kapsyen dan nombor rajah.`); X.renderFolder(); } } catch (e) { toast('Rajah gagal disisip: ' + (e && e.message || e), true); }
  }
  async function klik(e) {
    const b = e.target.closest('[data-rja]'); if (!b || !ELF) return; e.preventDefault(); const a = b.dataset.rja;
    if (a === 'ram') sisipRajah('ram'); else if (a === 'asal') sisipRajah('asal');
    else if (a === 'png') { try { const blob = await png(3); const u = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = u; l.download = 'Rajah_' + (data().medan || 'data') + '.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } catch (er) { toast('PNG gagal dijana: ' + (er && er.message || er), true); } }
    else if (a === 'jadual') { const k = kira(); const sid = sasaranRam(ELF.f); if (!k.baris.length) { toast('Tiada data untuk dijadualkan', true); return; } if (sid && sisip(sid, 'ram', `<p><strong>${esc((en() ? 'Table [n]. ' : 'Jadual [n]. ') + kapsyen())}</strong></p>` + htmlJadual(k))) toast('Jadual kekerapan disisip ke RAM seksyen'); }
  }
  function input(e) {
    const el = e.target; const m = el.dataset && el.dataset.rj; if (!m || !ELF) return; const d = data();
    if (m === 'medan') { d.medan = el.value; simpanT(); render(ELF.el, ELF.f); return; }
    if (m === 'jenis') d.jenis = JENIS.some(j => j[0] === el.value) ? el.value : 'bar'; else if (m === 'tajuk') d.tajuk = el.value.slice(0, 200); else if (m === 'sendiri') d.sendiri = el.value.slice(0, 4000); else return;
    simpanT(); segar();
  }
  document.addEventListener('click', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target)) klik(e); });
  document.addEventListener('input', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target) && e.target.tagName !== 'SELECT') input(e); });
  document.addEventListener('change', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target) && e.target.tagName === 'SELECT') input(e); });
  return { render, ringkas, kira, svg, png, data, kapsyen };
}
