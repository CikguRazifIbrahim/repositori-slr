/* Ruang PRISMA 2020 (Pandu Tulis, folder Metodologi dan Dapatan bagi artikel ulasan): tempat pemilik dan sistem membina rajah aliran bersama.
   Pemilik mengisi (1) pangkalan data: nama, tarikh carian, rentetan carian penuh dan bilangan rekod; (2) angka aliran: pendua, saringan,
   laporan tidak diperoleh, sebab pengecualian teks penuh; (3) kaedah lain (laman web, organisasi, carian sitasi) jika digunakan.
   Sistem mengira kotak yang boleh dikira (rekod disaring, laporan dicari, laporan dinilai, kajian dimasukkan), menyemak aritmetik, dan melukis
   rajah mengikut templat rasmi PRISMA 2020 (Page et al., 2021; CC BY 4.0) dua lajur dalam Bahasa Melayu atau Inggeris. Rajah boleh disisip
   ke RAM atau ASAL sebagai imej, dimuat turun sebagai PNG, dan jadual strategi carian serta ayat aliran berangka boleh disisip ke RAM.
   Data disimpan dalam tetapan Pandu Tulis (meta/pandu_<id>.prisma). Tiada angka direka: kotak kosong kekal kosong sehingga diisi.
   v1.33.0: (a) agen boleh MENCADANGKAN rentetan carian untuk dijalankan oleh pemilik (ia tidak menjalankan carian dan tidak mengisi tarikh
   atau bilangan rekod; rentetan tanpa tarikh dan bilangan rekod ditanda belum dijalankan dan agen penulisan dilarang menulisnya sebagai
   carian yang sudah dibuat); (b) panduan pengisian tanpa token bagi setiap kotak; (c) baris "kaedah lain (nyatakan)" pada lajur kedua
   supaya rekod yang dikenal pasti melalui cara lain, contohnya carian berbantukan AI, dilaporkan dengan namanya yang sebenar. Angka aliran
   tidak pernah dicadangkan oleh agen kerana ia rekod proses pemilik sendiri. */
export function initPrisma(X) {
  const { R, C, P, D, esc, toast, angka, idBaru, simpanT, gaya, en, kel, sasaranRam, sisip, Teks, A } = X;
  const LBL2 = { en: { laman: 'Websites', organisasi: 'Organisations', sitasi: 'Citation searching' }, ms: { laman: 'Laman web', organisasi: 'Organisasi', sitasi: 'Carian sitasi' } };
  const kosong = () => ({ pangkalan: [], daftar: '', pendua: '', automasi: '', lainBuang: '', dikecualikan: '', tidak: '', sebab: [], guna2: true, laman: '', organisasi: '', sitasi: '', lain2t: '', lain2: '', tidak2: '', sebab2: [], laporan: '', bahasa: '' });
  function data() { if (!P.t.prisma || typeof P.t.prisma !== 'object') P.t.prisma = kosong(); const d = P.t.prisma; ['pangkalan', 'sebab', 'sebab2'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; }); if (d.guna2 === undefined) d.guna2 = true; return d; }
  const num = v => Math.max(0, parseInt(v, 10) || 0);
  const isi = v => String(v == null ? '' : v).trim() !== '';
  const bahasa = () => { const b = data().bahasa; return b === 'en' || b === 'ms' ? b : (en() ? 'en' : 'ms'); };

  /* Semua kotak yang boleh dikira dikira di sini; isu[] menyenaraikan percanggahan aritmetik dan maklumat yang belum lengkap. */
  function kira() {
    const d = data(); const g = gaya(); const nPang = d.pangkalan.reduce((s, x) => s + num(x.n), 0); const dikenal = nPang + num(d.daftar); const buang = num(d.pendua) + num(d.automasi) + num(d.lainBuang);
    const disaring = dikenal - buang; const dicari = disaring - num(d.dikecualikan); const dinilai = dicari - num(d.tidak); const nSebab = d.sebab.reduce((s, x) => s + num(x.n), 0); const masuk1 = dinilai - nSebab;
    const dikenal2 = d.guna2 ? num(d.laman) + num(d.organisasi) + num(d.sitasi) + num(d.lain2) : 0; const dinilai2 = dikenal2 - (d.guna2 ? num(d.tidak2) : 0); const nSebab2 = d.guna2 ? d.sebab2.reduce((s, x) => s + num(x.n), 0) : 0; const masuk2 = dinilai2 - nSebab2;
    const kajian = masuk1 + masuk2; const laporan = isi(d.laporan) ? num(d.laporan) : kajian; const isu = []; const info = [];
    const adaPang = d.pangkalan.filter(x => isi(x.nama)); const tanpaRentetan = adaPang.filter(x => !isi(x.rentetan)); const tanpaTarikh = adaPang.filter(x => !isi(x.tarikh)); const tanpaN = adaPang.filter(x => !isi(x.n));
    if (!adaPang.length) isu.push('Belum ada pangkalan data direkodkan.');
    if (tanpaRentetan.length) isu.push(`Rentetan carian belum diisi bagi: ${tanpaRentetan.map(x => x.nama).join(', ')}. Rentetan carian penuh perlu dicetak dalam manuskrip.`);
    if (tanpaTarikh.length) isu.push(`Tarikh carian belum diisi bagi: ${tanpaTarikh.map(x => x.nama).join(', ')}.`);
    if (tanpaN.length) isu.push(`Bilangan rekod belum diisi bagi: ${tanpaN.map(x => x.nama).join(', ')}.`);
    if (kel() === 'skop' && adaPang.length > (g.hadPangkalan || 2)) isu.push(`Peraturan gaya Prof Dr: ulasan skop menggunakan paling banyak ${g.hadPangkalan || 2} pangkalan data; ${adaPang.length} direkodkan.`);
    if (dikenal > 0) {
      if (disaring < 0) isu.push(`Rekod dibuang sebelum saringan (${angka(buang)}) melebihi rekod dikenal pasti (${angka(dikenal)}).`);
      else if (dicari < 0) isu.push(`Rekod dikecualikan (${angka(num(d.dikecualikan))}) melebihi rekod disaring (${angka(disaring)}).`);
      else if (dinilai < 0) isu.push(`Laporan tidak diperoleh (${angka(num(d.tidak))}) melebihi laporan dicari (${angka(dicari)}).`);
      else if (masuk1 < 0) isu.push(`Jumlah laporan dikecualikan mengikut sebab (${angka(nSebab)}) melebihi laporan dinilai (${angka(dinilai)}).`);
      if (!isi(d.pendua)) info.push('Bilangan rekod pendua belum diisi (isi 0 jika tiada).');
      if (!isi(d.dikecualikan)) info.push('Bilangan rekod dikecualikan pada saringan tajuk dan abstrak belum diisi.');
      if (nSebab > 0 && d.sebab.some(x => num(x.n) > 0 && !isi(x.t))) isu.push('Setiap bilangan laporan dikecualikan perlu disertai sebabnya.');
    }
    if (d.guna2 && dikenal2 > 0) { if (dinilai2 < 0) isu.push(`Kaedah lain: laporan tidak diperoleh (${angka(num(d.tidak2))}) melebihi rekod dikenal pasti (${angka(dikenal2)}).`); else if (masuk2 < 0) isu.push(`Kaedah lain: laporan dikecualikan (${angka(nSebab2)}) melebihi laporan dinilai (${angka(dinilai2)}).`); }
    if (d.guna2 && num(d.lain2) > 0 && !isi(d.lain2t)) isu.push('Kaedah lain: nyatakan nama kaedah bagi bilangan rekod yang diisi (contohnya carian berbantukan AI dengan nama alatnya).');
    const belumJalan = adaPang.filter(x => isi(x.rentetan) && (!isi(x.tarikh) || !isi(x.n))); if (belumJalan.length) info.push(`Rentetan carian belum dijalankan bagi: ${belumJalan.map(x => x.nama).join(', ')}. Jalankan dalam pangkalan data itu, kemudian isi tarikh carian dan bilangan rekod sebenar.`);
    if (isi(d.laporan) && laporan < kajian && kajian > 0) isu.push(`Laporan kajian yang dimasukkan (${angka(laporan)}) kurang daripada bilangan kajian (${angka(kajian)}).`);
    const dok = C.doc(); const nSumber = dok ? C.sumberAda(dok).length : 0; if (kajian > 0 && nSumber && nSumber !== kajian) info.push(`Kajian dimasukkan (${angka(kajian)}) berbeza daripada artikel sumber yang dipilih bagi artikel ini (${nSumber}). Ini dibenarkan, tetapi angka dalam teks mesti mengikut rajah.`);
    const lengkap = adaPang.length > 0 && !tanpaRentetan.length && !tanpaTarikh.length && !tanpaN.length && dikenal > 0 && isi(d.pendua) && isi(d.dikecualikan) && kajian > 0 && !isu.length;
    return { d, nPang, dikenal, buang, disaring, dicari, dinilai, nSebab, masuk1, dikenal2, dinilai2, nSebab2, masuk2, kajian, laporan, isu, info, lengkap, adaPang, belumJalan };
  }
  const adaRajah = () => { const dok = C.doc(); return !!dok && Object.values(dok.seksyen || {}).some(s => !s.padam && /alt="[^"]*PRISMA/i.test(String(s.html || '') + String(s.ram || ''))); };
  function meter() {
    const k = kira(); const butir = k.isu.concat(k.info); let nilai = 0; const p = k.adaPang;
    if (p.length) nilai += 20; if (p.length && p.every(x => isi(x.rentetan))) nilai += 25; if (p.length && p.every(x => isi(x.tarikh) && isi(x.n))) nilai += 10;
    if (k.dikenal > 0 && isi(k.d.pendua) && isi(k.d.dikecualikan)) nilai += 15; if (k.kajian > 0 && !k.isu.some(x => /melebihi|kurang daripada/.test(x))) nilai += 20;
    const raj = adaRajah(); if (raj) nilai += 10; else if (k.kajian > 0) butir.push('Rajah aliran belum disisip ke dalam manuskrip (butang Sisip rajah dalam Ruang PRISMA).');
    const st = k.isu.some(x => /melebihi|kurang daripada|Peraturan gaya/.test(x)) ? 'gagal' : nilai >= 90 ? 'ok' : nilai >= 45 ? 'amaran' : 'gagal';
    return [{ k: 'prisma', nama: 'PRISMA 2020', nilai, status: st, teks: ringkas(), butir }];
  }
  function ringkas() { const k = kira(); if (!k.adaPang.length && !k.dikenal && !k.dikenal2) return 'belum diisi'; return `${k.adaPang.length} pangkalan data · ${angka(k.dikenal + k.dikenal2)} rekod · ${k.kajian > 0 ? angka(k.kajian) + ' kajian dimasukkan' : 'aliran belum lengkap'}${k.isu.length ? ' · ' + k.isu.length + ' perkara perlu disemak' : ''}`; }
  function teksAgen() {
    const k = kira(); const d = k.d; if (!k.adaPang.length && !k.dikenal && !k.dikenal2) return 'DATA PRISMA: belum diisi oleh Prof Dr dalam Ruang PRISMA. Jangan mereka pangkalan data, tarikh, rentetan carian atau angka aliran; gunakan penanda [ISI: ...].';
    return `DATA PRISMA 2020 (diisi oleh Prof Dr dalam Ruang PRISMA; ini satu-satunya sumber angka aliran):
Pangkalan data: ${k.adaPang.map(x => `${x.nama} (tarikh carian: ${x.tarikh || 'belum diisi'}; rekod: ${isi(x.n) ? num(x.n) : 'belum diisi'}; rentetan: ${x.rentetan ? x.rentetan.slice(0, 900) : 'belum diisi'}${isi(x.rentetan) && (!isi(x.tarikh) || !isi(x.n)) ? (x.cad ? '; STATUS: RENTETAN CADANGAN AGEN YANG BELUM DIJALANKAN' : '; STATUS: RENTETAN BELUM DIJALANKAN (tiada tarikh carian atau bilangan rekod)') : ''})`).join(' | ') || 'belum diisi'}${k.belumJalan.length ? '\nPERINGATAN: rentetan yang belum dijalankan TIDAK boleh ditulis sebagai carian yang sudah dibuat. Jangan nyatakan tarikh, bilangan rekod atau hasil bagi pangkalan data itu; gunakan penanda [ISI: tarikh carian dan bilangan rekod selepas rentetan dijalankan].' : ''}
Daftar: ${num(d.daftar)}. Rekod dikenal pasti (pangkalan data dan daftar): ${k.dikenal}.
Dibuang sebelum saringan: pendua ${num(d.pendua)}, ditanda tidak layak oleh alat automasi ${num(d.automasi)}, sebab lain ${num(d.lainBuang)}.
Rekod disaring: ${k.disaring}. Rekod dikecualikan: ${num(d.dikecualikan)}. Laporan dicari: ${k.dicari}. Laporan tidak diperoleh: ${num(d.tidak)}. Laporan dinilai kelayakan: ${k.dinilai}.
Laporan dikecualikan mengikut sebab: ${d.sebab.filter(x => num(x.n)).map(x => `${x.t || 'sebab belum dinyatakan'} (${num(x.n)})`).join('; ') || 'tiada direkodkan'}.
${d.guna2 ? `Kaedah lain: laman web ${num(d.laman)}, organisasi ${num(d.organisasi)}, carian sitasi ${num(d.sitasi)}${isi(d.lain2t) || num(d.lain2) ? ', ' + (d.lain2t || 'kaedah lain yang belum dinamakan') + ' ' + num(d.lain2) : ''}; tidak diperoleh ${num(d.tidak2)}; dinilai ${k.dinilai2}; dikecualikan: ${d.sebab2.filter(x => num(x.n)).map(x => `${x.t || 'sebab belum dinyatakan'} (${num(x.n)})`).join('; ') || 'tiada'}.` : 'Kaedah lain: tidak digunakan.'}
Kajian dimasukkan dalam ulasan: ${k.kajian}. Laporan kajian yang dimasukkan: ${k.laporan}.
Semakan aritmetik sistem: ${k.isu.length ? k.isu.join(' ') : 'tiada percanggahan.'}`;
  }

  /* ---- rajah SVG mengikut templat PRISMA 2020 ---- */
  const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function balut(t, max) { const out = []; String(t).replace(/\(n = ([^)]*)\)/g, '(n\u00a0=\u00a0$1)').split('\n').forEach(baris => { const inden = /^\s+/.test(baris) ? '   ' : ''; let cur = ''; baris.trim().split(/\s+/).forEach(w => { if ((cur + ' ' + w).trim().length > max - inden.length && cur) { out.push(inden + cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); out.push(inden + cur); }); return out; }
  function svg(lang) {
    const k = kira(); const d = k.d; const L = D.PRISMA_LABEL[lang] || D.PRISMA_LABEL.ms; const L2 = LBL2[lang] || LBL2.ms; const n = v => `(n = ${angka(v)})`; const dua = !!d.guna2;
    const F = 12.5, LH = 16.5, PAD = 9; const cw = w => Math.floor((w - 2 * PAD) / 6.15);
    const X1 = 58, W1 = 262, XS = 356, WS = 270, X2 = 668, W2 = 168, XS2 = 858, WS2 = 172; const W = dua ? 1042 : 640;
    const kotak = (x, y, w, teks, o) => { o = o || {}; const baris = balut(teks, cw(w)); const h = Math.max(o.minH || 0, baris.length * LH + 2 * PAD - 3); return { x, y, w, h, svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${o.fill || '#ffffff'}" stroke="#1f2937" stroke-width="1.2"/>` + baris.map((b, i) => `<text x="${x + PAD + (/^ {3}/.test(b) ? 12 : 0)}" y="${y + PAD + 10 + i * LH}" font-size="${F}" ${o.tebal && i === 0 ? 'font-weight="700"' : ''}>${xml(b.trim())}</text>`).join('') }; };
    const anak = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f2937" stroke-width="1.3" marker-end="url(#pa)"/>`;
    const sebabTeks = (arr) => { const a = arr.filter(x => num(x.n) > 0 || isi(x.t)); return a.length ? a.map((x, i) => `   ${isi(x.t) ? x.t : L.sebab + ' ' + (i + 1)} ${n(num(x.n))}`).join('\n') : `   ${n(0)}`; };
    const pangTeks = k.adaPang.length && k.adaPang.length <= 4 ? k.adaPang.map(x => `   ${x.nama} ${isi(x.n) ? n(num(x.n)) : '(n = )'}`).join('\n') : `   ${L.pangkalan} ${n(k.nPang)}`;
    let y = 58; const bh = []; let s = '';
    /* baris 1: pengenalpastian */
    const a1 = kotak(X1, y, W1, `${L.dikenal}\n${pangTeks}\n   ${L.daftar} ${n(num(d.daftar))}`); const a1s = kotak(XS, y, WS, `${L.dibuang}\n   ${L.pendua} ${n(num(d.pendua))}\n   ${L.automasi} ${n(num(d.automasi))}\n   ${L.lain} ${n(num(d.lainBuang))}`);
    const b1 = dua ? kotak(X2, y, W2 + (XS2 + WS2 - X2 - W2), `${L.dikenalLain}\n   ${L2.laman} ${n(num(d.laman))}\n   ${L2.organisasi} ${n(num(d.organisasi))}\n   ${L2.sitasi} ${n(num(d.sitasi))}${isi(d.lain2t) || num(d.lain2) ? '\n   ' + (d.lain2t || (lang === 'en' ? 'Other method' : 'Kaedah lain')) + ' ' + n(num(d.lain2)) : ''}`) : null;
    const r1 = Math.max(a1.h, a1s.h, b1 ? b1.h : 0); bh.push([y, r1]); s += a1.svg + a1s.svg + (b1 ? b1.svg : '') + anak(X1 + W1, y + a1.h / 2, XS - 2, y + a1.h / 2);
    /* baris 2: disaring */
    let y2 = y + r1 + 34; const a2 = kotak(X1, y2, W1, `${L.disaring}\n${n(Math.max(0, k.disaring))}`); const a2s = kotak(XS, y2, WS, `${L.dikecualikan}\n${n(num(d.dikecualikan))}`); const r2 = Math.max(a2.h, a2s.h);
    s += a2.svg + a2s.svg + anak(X1 + W1 / 2, y + a1.h, X1 + W1 / 2, y2 - 2) + anak(X1 + W1, y2 + a2.h / 2, XS - 2, y2 + a2.h / 2);
    /* baris 3: dicari */
    const y3 = y2 + r2 + 34; const a3 = kotak(X1, y3, W1, `${L.dicari}\n${n(Math.max(0, k.dicari))}`); const a3s = kotak(XS, y3, WS, `${L.tidak}\n${n(num(d.tidak))}`);
    const b3 = dua ? kotak(X2, y3, W2, `${L.dicari}\n${n(k.dikenal2)}`) : null; const b3s = dua ? kotak(XS2, y3, WS2, `${L.tidak}\n${n(num(d.tidak2))}`) : null; const r3 = Math.max(a3.h, a3s.h, b3 ? b3.h : 0, b3s ? b3s.h : 0);
    s += a3.svg + a3s.svg + anak(X1 + W1 / 2, y2 + a2.h, X1 + W1 / 2, y3 - 2) + anak(X1 + W1, y3 + a3.h / 2, XS - 2, y3 + a3.h / 2);
    if (dua) s += b3.svg + b3s.svg + anak(X2 + W2 / 2, y + b1.h, X2 + W2 / 2, y3 - 2) + anak(X2 + W2, y3 + b3.h / 2, XS2 - 2, y3 + b3.h / 2);
    /* baris 4: dinilai */
    const y4 = y3 + r3 + 34; const a4 = kotak(X1, y4, W1, `${L.dinilai}\n${n(Math.max(0, k.dinilai))}`); const a4s = kotak(XS, y4, WS, `${L.laporanKecuali}\n${sebabTeks(d.sebab)}`);
    const b4 = dua ? kotak(X2, y4, W2, `${L.dinilai}\n${n(Math.max(0, k.dinilai2))}`) : null; const b4s = dua ? kotak(XS2, y4, WS2, `${L.laporanKecuali}\n${sebabTeks(d.sebab2)}`) : null; const r4 = Math.max(a4.h, a4s.h, b4 ? b4.h : 0, b4s ? b4s.h : 0);
    s += a4.svg + a4s.svg + anak(X1 + W1 / 2, y3 + a3.h, X1 + W1 / 2, y4 - 2) + anak(X1 + W1, y4 + Math.min(a4.h, a4s.h) / 2, XS - 2, y4 + Math.min(a4.h, a4s.h) / 2);
    if (dua) s += b4.svg + b4s.svg + anak(X2 + W2 / 2, y3 + b3.h, X2 + W2 / 2, y4 - 2) + anak(X2 + W2, y4 + Math.min(b4.h, b4s.h) / 2, XS2 - 2, y4 + Math.min(b4.h, b4s.h) / 2);
    /* baris 5: dimasukkan */
    const y5 = y4 + r4 + 40; const a5 = kotak(X1, y5, W1, `${L.kajian}\n${n(Math.max(0, k.kajian))}\n${L.laporan}\n${n(Math.max(0, k.laporan))}`);
    s += a5.svg + anak(X1 + W1 / 2, y4 + a4.h, X1 + W1 / 2, y5 - 2);
    if (dua) s += `<polyline points="${X2 + W2 / 2},${y4 + b4.h} ${X2 + W2 / 2},${y5 + a5.h / 2} ${X1 + W1 + 3},${y5 + a5.h / 2}" fill="none" stroke="#1f2937" stroke-width="1.3" marker-end="url(#pa)"/>`;
    const H = y5 + a5.h + 34;
    /* kepala lajur dan label fasa */
    const kepala = (x, w, t) => `<rect x="${x}" y="12" width="${w}" height="32" rx="3" fill="#f7c948" stroke="#1f2937" stroke-width="1.2"/><text x="${x + w / 2}" y="33" font-size="${F}" font-weight="700" text-anchor="middle">${xml(t)}</text>`;
    const fasa = (ya, yb, t) => `<rect x="12" y="${ya}" width="32" height="${yb - ya}" rx="3" fill="#a9c9ec" stroke="#1f2937" stroke-width="1.2"/><text transform="translate(33 ${(ya + yb) / 2}) rotate(-90)" font-size="${F}" font-weight="700" text-anchor="middle">${xml(t)}</text>`;
    const atas = kepala(X1, XS + WS - X1, L.h1) + (dua ? kepala(X2, XS2 + WS2 - X2, L.h2) : '') + fasa(y, y + r1, L.fasa[0]) + fasa(y2, y4 + r4, L.fasa[1]) + fasa(y5, y5 + a5.h, L.fasa[2]);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif" fill="#111827"><defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f2937"/></marker></defs><rect width="${W}" height="${H}" fill="#ffffff"/>${atas}${s}<text x="${X1}" y="${H - 12}" font-size="10.5" fill="#4b5563">${xml(L.nota)}</text></svg>`;
  }
  function png(lang, skala) {
    return new Promise((res, rej) => { const src = svg(lang); const m = /viewBox="0 0 (\d+) (\d+)"/.exec(src); const w = +m[1], h = +m[2]; const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' })); const im = new Image();
      im.onload = () => { try { const c = document.createElement('canvas'); const z = skala || 2; c.width = w * z; c.height = h * z; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('PNG gagal dijana')), 'image/png'); } catch (e) { URL.revokeObjectURL(url); rej(e); } };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Rajah gagal dilukis')); }; im.src = url; });
  }
  function htmlStrategi() {
    const k = kira(); const e = bahasa() === 'en'; if (!k.adaPang.length) return '';
    return `<p><strong>${e ? 'Table. Search strategy and number of records by database' : 'Jadual. Strategi carian dan bilangan rekod mengikut pangkalan data'}</strong></p><table><tbody><tr><th>${e ? 'Database' : 'Pangkalan data'}</th><th>${e ? 'Search date' : 'Tarikh carian'}</th><th>${e ? 'Search string' : 'Rentetan carian'}</th><th>${e ? 'Records' : 'Bilangan rekod'}</th></tr>${k.adaPang.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.tarikh || '')}</td><td>${esc(x.rentetan || '')}</td><td>${isi(x.n) ? angka(num(x.n)) : ''}</td></tr>`).join('')}<tr><td><strong>${e ? 'Total' : 'Jumlah'}</strong></td><td></td><td></td><td><strong>${angka(k.nPang)}</strong></td></tr></tbody></table>`;
  }
  /* Ayat aliran berangka: rangka fakta untuk diparafrasa oleh pemilik (bukan teks akhir); hanya angka yang sudah diisi digunakan. */
  function htmlAyat() {
    const k = kira(); const d = k.d; const e = bahasa() === 'en'; if (!k.dikenal) return ''; const nama = k.adaPang.map(x => x.nama); const senarai = nama.length > 1 ? nama.slice(0, -1).join(', ') + (e ? ' and ' : ' dan ') + nama[nama.length - 1] : nama[0] || ''; const sb = d.sebab.filter(x => num(x.n) && isi(x.t)).map(x => `${x.t} (n = ${num(x.n)})`).join('; ');
    const t = e
      ? `The search of ${senarai} identified ${angka(k.dikenal)} records. After ${angka(k.buang)} records were removed before screening (${angka(num(d.pendua))} duplicates), ${angka(k.disaring)} records were screened by title and abstract and ${angka(num(d.dikecualikan))} were excluded. Of the ${angka(k.dicari)} reports sought for retrieval, ${angka(num(d.tidak))} could not be retrieved, and ${angka(k.dinilai)} were assessed for eligibility. ${angka(k.nSebab)} reports were excluded${sb ? ' (' + sb + ')' : ''}.${d.guna2 && k.dikenal2 ? ` A further ${angka(k.dikenal2)} records were identified through other methods, of which ${angka(Math.max(0, k.masuk2))} met the criteria.` : ''} In total, ${angka(k.kajian)} studies were included in the review (Figure [n]).`
      : `Carian dalam ${senarai} mengenal pasti ${angka(k.dikenal)} rekod. Selepas ${angka(k.buang)} rekod dibuang sebelum saringan (${angka(num(d.pendua))} pendua), ${angka(k.disaring)} rekod disaring berdasarkan tajuk dan abstrak, dan ${angka(num(d.dikecualikan))} dikecualikan. Daripada ${angka(k.dicari)} laporan yang dicari, ${angka(num(d.tidak))} tidak diperoleh dan ${angka(k.dinilai)} dinilai kelayakannya. Sebanyak ${angka(k.nSebab)} laporan dikecualikan${sb ? ' (' + sb + ')' : ''}.${d.guna2 && k.dikenal2 ? ` Sebanyak ${angka(k.dikenal2)} rekod lagi dikenal pasti melalui kaedah lain, dan ${angka(Math.max(0, k.masuk2))} daripadanya memenuhi kriteria.` : ''} Keseluruhannya, ${angka(k.kajian)} kajian dimasukkan dalam ulasan ini (Rajah [n]).`;
    return `<p><strong>[Ruang PRISMA · ayat aliran berangka untuk diparafrasa · ${esc(R.fmtTime(Date.now()))}]</strong></p><p>${esc(t)}</p>`;
  }

  /* ---- paparan ---- */
  let ELF = null;
  const HAD_RENTETAN = 3000;
  const SKEMA_RENTETAN = { type: 'object', additionalProperties: false, required: ['konsep', 'pangkalan', 'langkah', 'semakan'], properties: {
    konsep: { type: 'array', description: 'Konsep carian dan istilahnya', items: { type: 'object', additionalProperties: false, required: ['nama', 'istilah'], properties: { nama: { type: 'string' }, istilah: { type: 'array', items: { type: 'string' } } } } },
    pangkalan: { type: 'array', description: 'Satu entri bagi setiap pangkalan data yang diminta', items: { type: 'object', additionalProperties: false, required: ['nama', 'rentetan', 'had', 'nota'], properties: { nama: { type: 'string', description: 'Nama pangkalan data tepat seperti diminta' }, rentetan: { type: 'string', description: 'Rentetan carian penuh mengikut sintaks pangkalan data itu' }, had: { type: 'string', description: 'Had dan penapis yang perlu ditetapkan' }, nota: { type: 'string', description: 'Nota sintaks atau perkara yang perlu disemak' } } } },
    langkah: { type: 'array', description: 'Langkah menjalankan dan merekod carian', items: { type: 'string' } },
    semakan: { type: 'array', description: 'Artikel sumber yang patut ditemui semula oleh rentetan', items: { type: 'string' } } } };
  const inp = (medan, v, o) => `<input type="number" min="0" step="1" data-pr="${medan}"${o && o.i != null ? ` data-i="${o.i}"` : ''} value="${esc(isi(v) ? v : '')}" placeholder="0">`;
  const kiraHtml = k => `<span class="pr-kira" data-prk="1">${angka(Math.max(0, k))}</span>`;
  function htmlSemak(k) { return `<div class="pr-semak ${k.isu.length ? 'amaran' : k.lengkap ? 'ok' : ''}"><b>${k.isu.length ? 'Perlu disemak' : k.lengkap ? 'Aritmetik selaras dan maklumat lengkap' : 'Aritmetik selaras setakat ini'}</b>${k.isu.length || k.info.length ? `<ul>${k.isu.map(x => `<li class="isu">${esc(x)}</li>`).join('')}${k.info.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`; }
  function render(el, f) {
    if (!el) return; ELF = { el, f }; const d = data(); const k = kira(); const g = gaya(); const lang = bahasa();
    const sebabHtml = (arr, medan) => `<div class="pr-sebab">${arr.map((x, i) => `<div class="pr-sb"><input type="text" data-pr="${medan}t" data-i="${i}" value="${esc(x.t || '')}" placeholder="Sebab pengecualian (contohnya bukan konteks sekolah)">${inp(medan + 'n', x.n, { i })}<button class="btn btn-sm" data-pra="buang" data-m="${medan}" data-i="${i}" title="Buang sebab ini">Buang</button></div>`).join('')}<button class="btn btn-sm" data-pra="tambah" data-m="${medan}">Tambah sebab</button></div>`;
    el.innerHTML = `<p class="help">Isi angka sebenar daripada carian dan saringan Prof Dr. Sistem mengira kotak yang boleh dikira, menyemak aritmetik dan melukis rajah mengikut templat rasmi PRISMA 2020. Agen boleh mencadangkan rentetan carian untuk Prof Dr jalankan; angka aliran tidak dicadangkan oleh agen kerana ia rekod proses Prof Dr sendiri. <button class="btn btn-sm" data-pra="panduan">Panduan pengisian</button> ${kel() === 'skop' ? `Peraturan gaya: ulasan skop menggunakan paling banyak ${g.hadPangkalan || 2} pangkalan data, dan rentetan carian dicetak penuh dalam manuskrip.` : 'Rentetan carian penuh setiap pangkalan data perlu dicetak dalam manuskrip.'}</p>
      <h4>1. Pangkalan data dan rentetan carian</h4>
      <div class="pr-pang">${d.pangkalan.map((x, i) => `<div class="pr-pg"><input type="text" data-pr="pnama" data-i="${i}" value="${esc(x.nama || '')}" placeholder="Nama pangkalan data (contohnya Scopus)"><input type="text" data-pr="ptarikh" data-i="${i}" value="${esc(x.tarikh || '')}" placeholder="Tarikh carian (contohnya 12 Oktober 2026)">${inp('pn', x.n, { i })}<button class="btn btn-sm" data-pra="buangpang" data-i="${i}">Buang</button><textarea data-pr="prentetan" data-i="${i}" rows="2" placeholder="Rentetan carian penuh, tepat seperti yang dimasukkan ke dalam pangkalan data, termasuk medan dan had">${esc(x.rentetan || '')}</textarea><span class="help pr-belum" data-prb="${i}"${teksBelum(x) ? '' : ' hidden'}>${esc(teksBelum(x))}</span></div>`).join('') || '<div class="pd-kosong">Belum ada pangkalan data.</div>'}
        <div class="pd-acts"><button class="btn btn-sm btn-primary" data-pra="tambahpang">Tambah pangkalan data</button><button class="btn btn-sm btn-ai" data-pra="cadang"${P.busy ? ' disabled' : ''} title="Agen mencadangkan rentetan carian mengikut sintaks setiap pangkalan data, untuk dijalankan oleh Prof Dr. Ia tidak menjalankan carian dan tidak mengisi tarikh atau bilangan rekod.">${P.busy && P.busy.mod === 'rentetan' ? 'Agen sedang menyusun rentetan' : 'Mohon Prof Dr Claude cadangkan rentetan carian'}</button><label class="pr-f">Daftar (jika ada) ${inp('daftar', d.daftar)}</label><span class="help">Rekod dikenal pasti: <b data-prv="dikenal">${angka(k.dikenal)}</b></span></div></div>
      <h4>2. Aliran pangkalan data dan daftar</h4>
      <div class="pr-grid">
        <label class="pr-f">Rekod pendua dibuang ${inp('pendua', d.pendua)}</label><label class="pr-f">Ditanda tidak layak oleh alat automasi ${inp('automasi', d.automasi)}</label><label class="pr-f">Dibuang atas sebab lain ${inp('lainBuang', d.lainBuang)}</label>
        <div class="pr-f auto">Rekod disaring <b data-prv="disaring">${angka(Math.max(0, k.disaring))}</b></div><label class="pr-f">Rekod dikecualikan (tajuk dan abstrak) ${inp('dikecualikan', d.dikecualikan)}</label>
        <div class="pr-f auto">Laporan dicari <b data-prv="dicari">${angka(Math.max(0, k.dicari))}</b></div><label class="pr-f">Laporan tidak diperoleh ${inp('tidak', d.tidak)}</label>
        <div class="pr-f auto">Laporan dinilai kelayakan <b data-prv="dinilai">${angka(Math.max(0, k.dinilai))}</b></div></div>
      <div class="pr-f blok"><span>Laporan dikecualikan selepas dinilai, mengikut sebab</span>${sebabHtml(d.sebab, 'sebab')}</div>
      <h4>3. Kaedah lain <label class="pr-tog"><input type="checkbox" data-pr="guna2"${d.guna2 ? ' checked' : ''}> lajur kedua templat (laman web, organisasi, carian sitasi)</label></h4>
      ${d.guna2 ? `<div class="pr-grid"><label class="pr-f">Laman web ${inp('laman', d.laman)}</label><label class="pr-f">Organisasi ${inp('organisasi', d.organisasi)}</label><label class="pr-f">Carian sitasi dan senarai rujukan ${inp('sitasi', d.sitasi)}</label><label class="pr-f">Kaedah lain (nyatakan) <input type="text" data-pr="lain2t" value="${esc(d.lain2t || '')}" placeholder="Contohnya carian berbantukan AI (nama alat)">${inp('lain2', d.lain2)}</label><label class="pr-f">Laporan tidak diperoleh ${inp('tidak2', d.tidak2)}</label><div class="pr-f auto">Laporan dinilai kelayakan <b data-prv="dinilai2">${angka(Math.max(0, k.dinilai2))}</b></div></div>
        <div class="pr-f blok"><span>Laporan dikecualikan (kaedah lain), mengikut sebab</span>${sebabHtml(d.sebab2, 'sebab2')}</div>` : '<p class="help">Lajur kedua dimatikan: rajah dilukis dengan lajur pangkalan data dan daftar sahaja. Hidupkan jika carian manual, senarai rujukan atau laman web digunakan.</p>'}
      <h4>4. Dimasukkan</h4>
      <div class="pr-grid"><div class="pr-f auto">Kajian dimasukkan dalam ulasan <b data-prv="kajian">${angka(Math.max(0, k.kajian))}</b></div><label class="pr-f">Laporan kajian yang dimasukkan (kosongkan jika sama) ${inp('laporan', d.laporan)}</label></div>
      <div id="prSemak">${htmlSemak(k)}</div>
      <h4>5. Rajah aliran PRISMA 2020</h4>
      <div class="pd-acts"><label class="pr-f">Bahasa rajah <select data-pr="bahasa"><option value="ms"${lang === 'ms' ? ' selected' : ''}>Bahasa Melayu</option><option value="en"${lang === 'en' ? ' selected' : ''}>English</option></select></label><button class="btn btn-sm btn-primary" data-pra="rajahram">Sisip rajah ke RAM</button><button class="btn btn-sm" data-pra="rajahasal">Sisip rajah ke ASAL</button><button class="btn btn-sm" data-pra="png">Muat turun PNG</button><button class="btn btn-sm" data-pra="strategi">Sisip jadual strategi carian ke RAM</button><button class="btn btn-sm" data-pra="ayat">Sisip ayat aliran berangka ke RAM</button></div>
      <div id="prRajah" class="pr-rajah">${svg(lang)}</div>`;
  }
  const teksBelum = x => isi(x.rentetan) && (!isi(x.tarikh) || !isi(x.n)) ? `${x.cad ? 'Cadangan agen. ' : ''}Belum dijalankan: jalankan rentetan ini dalam ${String(x.nama || '').trim() || 'pangkalan data'}, kemudian isi tarikh carian dan bilangan rekod sebenar.${x.nota ? ' Had dan nota: ' + x.nota + '.' : ''}` : '';
  const segarRing = () => { const g = ELF && ELF.el.closest('details'); const rs = g && g.querySelector('summary .ring'); if (rs) rs.textContent = ringkas(); };
  function segarHidup() { if (!ELF || !ELF.el.isConnected) return; const k = kira(); ELF.el.querySelectorAll('[data-prv]').forEach(b => { const v = k[b.dataset.prv]; b.textContent = angka(Math.max(0, v || 0)); }); const s = ELF.el.querySelector('#prSemak'); if (s) s.innerHTML = htmlSemak(k); const r = ELF.el.querySelector('#prRajah'); if (r) r.innerHTML = svg(bahasa()); ELF.el.querySelectorAll('[data-prb]').forEach(b => { const t = teksBelum(k.d.pangkalan[parseInt(b.dataset.prb, 10)] || {}); b.hidden = !t; b.textContent = t; }); segarRing(); X.kemasBar(); }
  async function sisipRajah(mana) {
    const f = ELF && ELF.f; const sid = f && sasaranRam(f); if (!sid) { toast('Seksyen folder ini tiada', true); return; } const k = kira(); if (!k.dikenal) { toast('Isi sekurang-kurangnya bilangan rekod pangkalan data dahulu', true); return; }
    if (k.isu.some(x => /melebihi|kurang daripada/.test(x))) { const ok = await R.confirmBox('Aritmetik rajah belum selaras', k.isu.filter(x => /melebihi|kurang daripada/.test(x)).join(' ') + ' Sisip rajah juga?', 'Sisip juga', false); if (!ok) return; }
    try { const lang = bahasa(); const blob = await png(lang, 2); const kap = lang === 'en' ? 'PRISMA 2020 flow diagram of the study selection process' : 'Rajah aliran PRISMA 2020 bagi proses pemilihan kajian'; const r = await Teks.simpanImej(blob, { n: A.id, id: sid, nama: kap });
      const html = `<p><img data-imej="${r.id}" src="${r.dataUrl}" alt="${esc(kap)}"></p><p><em>${lang === 'en' ? 'Figure [n].' : 'Rajah [n].'} ${esc(kap)}. ${lang === 'en' ? 'Adapted from Page et al. (2021).' : 'Diadaptasi daripada Page et al. (2021).'}</em></p>`;
      if (sisip(sid, mana, html)) { toast(`Rajah aliran PRISMA disisip ke ${mana === 'asal' ? 'ASAL' : 'RAM'} seksyen. Tambah Page et al. (2021) dalam senarai rujukan.`); X.renderFolder(); } } catch (e) { toast('Rajah gagal disisip: ' + (e && e.message || e), true); }
  }
  /* Panduan pengisian (tanpa token): maksud setiap kotak, dari mana angkanya datang, dan statusnya sekarang. */
  function panduan() {
    const k = kira(); const d = k.d; const dok = C.doc(); const nS = dok ? C.sumberAda(dok).length : 0; const p = k.adaPang;
    const li = (ok, tajuk, teks) => `<li class="${ok ? 'ok' : 'amaran'}"><b>${tajuk}</b> ${ok ? '<em>(sudah diisi)</em>' : '<em>(belum diisi)</em>'}<br>${teks}</li>`;
    R.richModal('Panduan pengisian Ruang PRISMA 2020', `<p>Rajah aliran ialah rekod proses carian dan saringan Prof Dr sendiri, dan penilai boleh meminta buktinya. Sebab itu sistem dan agen tidak mengisi angka aliran. Isi mengikut urutan berikut.</p><ol class="pd-semak-awal pr-panduan">
      ${li(p.length > 0 && p.every(x => isi(x.rentetan)), '1. Rentetan carian setiap pangkalan data.', 'Taip sendiri, atau klik "Mohon Prof Dr Claude cadangkan rentetan carian" untuk mendapat draf mengikut sintaks pangkalan data. Draf itu perlu disemak dan dijalankan oleh Prof Dr.')}
      ${li(p.length > 0 && p.every(x => isi(x.tarikh) && isi(x.n)), '2. Tarikh carian dan bilangan rekod.', 'Jalankan setiap rentetan dalam pangkalan datanya. Catat tarikh carian dan bilangan hasil yang dipaparkan pada tarikh itu, dan simpan eksport atau tangkapan skrin sebagai bukti.')}
      ${li(isi(d.pendua), '3. Rekod pendua dibuang.', 'Bilangan rekod yang sama merentas pangkalan data, daripada pengurus rujukan (Zotero, Mendeley, EndNote) atau kiraan manual. Isi 0 jika hanya satu pangkalan data dan tiada pendua.')}
      ${li(isi(d.dikecualikan), '4. Rekod dikecualikan pada saringan tajuk dan abstrak.', 'Bilangan rekod yang ditolak selepas tajuk dan abstraknya dibaca berpandukan kriteria kelayakan.')}
      ${li(isi(d.tidak), '5. Laporan tidak diperoleh.', 'Bilangan artikel yang teks penuhnya tidak dapat diakses. Isi 0 jika semua diperoleh.')}
      ${li(d.sebab.some(x => isi(x.t) && isi(x.n)), '6. Laporan dikecualikan selepas dinilai, mengikut sebab.', 'Satu baris bagi setiap sebab (contohnya bukan konteks sekolah, bukan kajian empirikal), dengan bilangannya. Sebab mesti sepadan dengan kriteria kelayakan dalam teks.')}
      ${li(!d.guna2 || k.dikenal2 > 0, '7. Kaedah lain (lajur kedua).', 'Rekod yang dikenal pasti di luar carian pangkalan data: laman web, organisasi, carian sitasi dan senarai rujukan. Artikel yang ditemui melalui pembantu AI dilaporkan pada baris "Kaedah lain (nyatakan)" dengan nama alatnya, bukan sebagai hasil pangkalan data, dan penggunaannya diisytiharkan dalam pernyataan penggunaan AI jurnal. Matikan lajur ini jika tiada kaedah lain digunakan.')}
      ${li(k.kajian > 0 && (!nS || nS === k.kajian), '8. Semakan akhir.', `Sistem mengira kajian yang dimasukkan: ${angka(Math.max(0, k.kajian))}. Artikel sumber yang dipilih bagi artikel ini: ${angka(nS)}. Kedua-dua angka sepatutnya sama; jika berbeza, semak angka aliran atau senarai artikel sumber.`)}
      </ol><p class="help">Rentetan yang belum dijalankan ditanda "belum dijalankan" dan agen penulisan tidak akan menulisnya sebagai carian yang sudah dibuat.</p>`, 'Faham');
  }
  /* Agen mencadangkan rentetan carian untuk DIJALANKAN oleh pemilik. Ia tidak menjalankan carian: tarikh dan bilangan rekod kekal kosong. */
  async function cadangRentetan() {
    if (P.busy) return; const dok = C.doc(); if (!dok) return; const d = data(); const g = gaya(); const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const pv = (P.t.pemboleh || []).filter(v => v.nama); const e = C.entri(A.id) || {}; const sedia = d.pangkalan.filter(x => isi(x.nama)).map(x => x.nama); const had = kel() === 'skop' ? (g.hadPangkalan || 2) : 4;
    const ok = await R.richModal('Cadangan rentetan carian: hantar kepada agen?', `<p>Agen menyusun rentetan carian mengikut sintaks setiap pangkalan data, berdasarkan tajuk kerja, pemboleh ubah, jawapan Prof Dr dalam folder Pendahuluan dan Metodologi, serta tajuk artikel sumber. <b>Agen tidak menjalankan carian.</b> Tarikh carian dan bilangan rekod kekal kosong sehingga Prof Dr menjalankan rentetan itu dan mengisi angka sebenar.</p>
      <label class="pd-q"><span>Pangkalan data (pisahkan dengan koma${kel() === 'skop' ? '; peraturan gaya: paling banyak ' + had : ''})</span><input type="text" id="prPang" class="modal-in" value="${esc(sedia.join(', ') || 'ERIC, OpenAlex')}"></label>
      <label class="pd-q"><span>Julat tahun dan had lain (pilihan)</span><input type="text" id="prHad" class="modal-in" placeholder="Contohnya 2021 hingga 2026; artikel jurnal berwasit; Bahasa Inggeris dan Bahasa Melayu"></label>
      <p class="help">Satu panggilan API dengan kunci API Prof Dr (had keluar ${angka(R.Isi.hadKeluar(HAD_RENTETAN))} token, iaitu ${angka(HAD_RENTETAN)} bagi jawapan dan ${angka(R.Isi.hadKeluar(HAD_RENTETAN) - HAD_RENTETAN)} ruang berfikir model; yang dicaj hanyalah token yang benar-benar dijana). Cadangan penuh juga dimasukkan ke RAM seksyen Metodologi.</p>`, 'Hantar kepada agen', 'Batal');
    if (!ok) return; const v = R.richModal.values || {}; const nama = String(v.prPang || '').split(/[,;]/).map(x => x.trim()).filter(Boolean).slice(0, 6); if (!nama.length) { toast('Nyatakan sekurang-kurangnya satu pangkalan data', true); return; }
    const jawab = k => { const F = X.fd ? X.fd(k) : null; return F && F.jawab ? Object.values(F.jawab).map(x => String(x || '').trim()).filter(Boolean).join(' | ').slice(0, 1800) : ''; };
    const sumber = C.sumberAda(dok).slice(0, 40).map(id => { const r = R.S.docs.get(id) || {}; return `- ${r.penulis || '?'} (${r.tahun || '?'}). ${String(r.tajuk || '').slice(0, 160)}`; }).join('\n');
    const system = `Anda ialah pakar maklumat (pustakawan penyelidikan) yang membantu seorang calon PhD menyusun strategi carian bagi satu artikel ulasan. Tugas anda: MENCADANGKAN rentetan carian yang boleh dijalankan semula, mengikut sintaks rasmi setiap pangkalan data yang diminta. Anda TIDAK menjalankan carian dan tidak tahu bilangan hasil: jangan nyatakan atau anggarkan bilangan rekod, tarikh carian atau hasil carian.
Peraturan: (1) Pecahkan topik kepada konsep (contohnya mengikut Populasi, Konsep, Konteks); bagi setiap konsep senaraikan istilah sinonim, variasi ejaan dan istilah berkaitan dalam Bahasa Inggeris (tambah Bahasa Melayu jika pangkalan data itu mengindeks jurnal berbahasa Melayu). (2) Gabungkan istilah dalam satu konsep dengan OR dan antara konsep dengan AND; frasa dalam tanda petik. (3) Ikut sintaks pangkalan data itu: contohnya Scopus menggunakan TITLE-ABS-KEY( ), Web of Science menggunakan TS=( ), ERIC menerima AND, OR dan tanda petik, OpenAlex menerima AND, OR dan tanda petik tanpa simbol pemangkasan. Jika tidak pasti tentang sesuatu operator, pilih bentuk paling asas dan nyatakan dalam nota. (4) Had (julat tahun, jenis dokumen, bahasa) ditulis dalam medan "had" sebagai arahan penapis, kecuali pangkalan data itu memang menulisnya dalam rentetan. (5) Rentetan mesti cukup luas untuk menemui semula ARTIKEL SUMBER yang disenaraikan; dalam "semakan", namakan tiga hingga enam artikel sumber yang patut ditemui oleh rentetan itu supaya Prof Dr boleh mengujinya. (6) Tulis nota, langkah dan semakan dalam Bahasa Melayu Malaysia; rentetan dalam bahasa pangkalan data. Jangan gunakan sempang em atau en. Pulangkan JSON mengikut skema.`;
    const user = `[MOD:rentetan]\nTAJUK KERJA: ${e.tajuk || 'belum bertajuk'}\nJENIS ARTIKEL: ${(C.JENIS_PETA[dok.jenis] || {}).nama || dok.jenis}\nPEMBOLEH UBAH ATAU KONSTRUK UTAMA: ${pv.length ? pv.map(x => x.nama + (x.alias ? ' (padanan: ' + x.alias + ')' : '')).join('; ') : 'belum ditetapkan'}\nJAWAPAN PROF DR (Pendahuluan): ${jawab('pendahuluan') || 'tiada'}\nJAWAPAN PROF DR (Metodologi): ${jawab('kaedah') || 'tiada'}\nHAD YANG DIMINTA: ${String(v.prHad || '').trim() || 'tidak dinyatakan; cadangkan had yang munasabah dan nyatakan sebagai cadangan'}\nPANGKALAN DATA YANG DIMINTA: ${nama.join('; ')}\n\nARTIKEL SUMBER (sudah dikumpul oleh Prof Dr; rentetan patut menemuinya semula):\n${sumber || 'tiada'}\n\nTUGAS: Cadangkan satu rentetan carian bagi setiap pangkalan data yang diminta.`;
    P.busy = { k: null, mod: 'rentetan' }; if (ELF) render(ELF.el, ELF.f); const tk = P.t.token || { masuk: 0, keluar: 0, panggil: 0 };
    try {
      const res = await R.Isi.hantar(t, { kunciMod: 'pandu-rentetan:' + t.model, system, content: [{ type: 'text', text: user }], skema: SKEMA_RENTETAN, alat: { name: 'cadang_rentetan', description: 'Pulangkan cadangan rentetan carian mengikut struktur ini.', input_schema: SKEMA_RENTETAN }, hadToken: HAD_RENTETAN });
      let j; try { j = res.input || R.Isi.parseJson(res.text, res.stop); } catch (er) { if (er && typeof er === 'object') er.usage = res.usage; throw er; }
      const senarai = (Array.isArray(j && j.pangkalan) ? j.pangkalan : []).map(x => ({ nama: String(x && x.nama || '').trim(), rentetan: String(x && x.rentetan || '').replace(/\s*[—–]\s*/g, ' ').trim(), had: String(x && x.had || '').trim(), nota: String(x && x.nota || '').trim() })).filter(x => x.nama && x.rentetan);
      if (!senarai.length) throw { code: 'json', stop: res.stop, usage: res.usage };
      let isiBaru = 0, kekal = 0; const masa = Date.now();
      senarai.forEach(x => { let p = d.pangkalan.find(y => String(y.nama || '').trim().toLowerCase() === x.nama.toLowerCase()); if (!p) { p = { id: idBaru('p'), nama: x.nama, tarikh: '', rentetan: '', n: '' }; d.pangkalan.push(p); } if (isi(p.rentetan)) { kekal++; return; } p.rentetan = x.rentetan; p.cad = masa; p.nota = [x.had, x.nota].map(z => String(z || '').trim().replace(/\s*[.;]+$/, '')).filter(Boolean).join('. ').slice(0, 500); isiBaru++; });
      P.t.token = { masuk: (tk.masuk || 0) + R.Isi.masukSemua(res.usage), keluar: (tk.keluar || 0) + (res.usage ? res.usage.keluar : 0), panggil: (tk.panggil || 0) + 1, gagal: tk.gagal || 0 }; simpanT(true);
      const senaraiTeks = a => (Array.isArray(a) ? a : []).map(x => String(x || '').trim()).filter(Boolean);
      const html = `<p><strong>[Ruang PRISMA · cadangan rentetan carian (BELUM DIJALANKAN) · ${esc(R.fmtTime(masa))}]</strong></p>` + ((Array.isArray(j.konsep) ? j.konsep : []).length ? `<table><tbody><tr><th>Konsep</th><th>Istilah</th></tr>${j.konsep.map(c => `<tr><td>${esc(c && c.nama || '')}</td><td>${esc(senaraiTeks(c && c.istilah).join('; '))}</td></tr>`).join('')}</tbody></table>` : '') + senarai.map(x => `<p><strong>${esc(x.nama)}:</strong> ${esc(x.rentetan)}${x.had ? '<br><em>Had:</em> ' + esc(x.had) : ''}${x.nota ? '<br><em>Nota:</em> ' + esc(x.nota) : ''}</p>`).join('') + (senaraiTeks(j.langkah).length ? `<p><strong>Langkah menjalankan:</strong></p><ol>${senaraiTeks(j.langkah).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '') + (senaraiTeks(j.semakan).length ? `<p><strong>Artikel sumber yang patut ditemui semula (uji rentetan):</strong></p><ul>${senaraiTeks(j.semakan).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '') + '<p><em>Cadangan agen. Jalankan rentetan dalam setiap pangkalan data, catat tarikh carian dan bilangan rekod sebenar dalam Ruang PRISMA, dan laporkan dalam manuskrip hanya carian yang benar-benar dijalankan.</em></p>';
      const sid = ELF && sasaranRam(ELF.f); const keRam = sid ? sisip(sid, 'ram', html) : false;
      toast(`Cadangan rentetan carian siap: ${isiBaru} rentetan diisi${kekal ? ', ' + kekal + ' rentetan sedia ada tidak ditimpa' : ''}${keRam ? '; cadangan penuh dalam RAM' : ''} (token masuk ${angka(R.Isi.masukSemua(res.usage))}, keluar ${angka(res.usage ? res.usage.keluar : 0)}). Jalankan rentetan itu, kemudian isi tarikh dan bilangan rekod sebenar.`);
    } catch (er) {
      if (er && er.usage) { P.t.token = { masuk: (tk.masuk || 0) + R.Isi.masukSemua(er.usage), keluar: (tk.keluar || 0) + (er.usage.keluar || 0), panggil: (tk.panggil || 0) + 1, gagal: (tk.gagal || 0) + 1 }; simpanT(true); }
      toast('Cadangan rentetan gagal: ' + R.Isi.msg(er), true);
    } finally { P.busy = null; X.render(); }
  }
  async function klik(e) {
    const b = e.target.closest('[data-pra]'); if (!b || !ELF) return; e.preventDefault(); const a = b.dataset.pra; const d = data(); const i = parseInt(b.dataset.i, 10);
    if (a === 'tambahpang') { d.pangkalan.push({ id: idBaru('p'), nama: '', tarikh: '', rentetan: '', n: '' }); simpanT(); render(ELF.el, ELF.f); const x = ELF.el.querySelectorAll('[data-pr="pnama"]'); if (x.length) x[x.length - 1].focus(); }
    else if (a === 'buangpang') { const x = d.pangkalan[i]; if (x && (isi(x.nama) || isi(x.rentetan) || isi(x.n))) { const ok = await R.confirmBox('Buang pangkalan data ini?', `"${x.nama || 'tanpa nama'}" berserta tarikh, rentetan carian dan bilangan rekodnya dibuang daripada Ruang PRISMA.`, 'Buang'); if (!ok) return; } d.pangkalan.splice(i, 1); simpanT(true); render(ELF.el, ELF.f); X.kemasBar(); }
    else if (a === 'tambah') { d[b.dataset.m].push({ id: idBaru('s'), t: '', n: '' }); simpanT(); render(ELF.el, ELF.f); }
    else if (a === 'buang') { d[b.dataset.m].splice(i, 1); simpanT(true); render(ELF.el, ELF.f); }
    else if (a === 'panduan') panduan(); else if (a === 'cadang') cadangRentetan();
    else if (a === 'rajahram') sisipRajah('ram'); else if (a === 'rajahasal') sisipRajah('asal');
    else if (a === 'png') { try { const blob = await png(bahasa(), 3); const u = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = u; l.download = 'Rajah_PRISMA_2020.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } catch (er) { toast('PNG gagal dijana: ' + (er && er.message || er), true); } }
    else if (a === 'strategi') { const h = htmlStrategi(); const sid = sasaranRam(ELF.f); if (!h) { toast('Belum ada pangkalan data untuk dijadualkan', true); return; } if (sid && sisip(sid, 'ram', h)) toast('Jadual strategi carian disisip ke RAM seksyen'); }
    else if (a === 'ayat') { const h = htmlAyat(); const sid = sasaranRam(ELF.f); if (!h) { toast('Isi angka aliran dahulu', true); return; } if (sid && sisip(sid, 'ram', h)) toast('Ayat aliran berangka disisip ke RAM; parafrasa sebelum dipindahkan ke ASAL'); }
  }
  function input(e) {
    const el = e.target; const m = el.dataset && el.dataset.pr; if (!m || !ELF) return; const d = data(); const i = parseInt(el.dataset.i, 10);
    if (m === 'pnama' || m === 'ptarikh' || m === 'prentetan' || m === 'pn') { const x = d.pangkalan[i]; if (!x) return; x[{ pnama: 'nama', ptarikh: 'tarikh', prentetan: 'rentetan', pn: 'n' }[m]] = el.value; }
    else if (/^sebab2?[tn]$/.test(m)) { const arr = d[m.slice(0, -1)]; const x = arr[i]; if (!x) return; x[m.slice(-1)] = el.value; }
    else if (m === 'guna2') { d.guna2 = !!el.checked; simpanT(true); render(ELF.el, ELF.f); X.kemasBar(); return; }
    else if (m === 'bahasa') { d.bahasa = el.value === 'en' ? 'en' : 'ms'; simpanT(); segarHidup(); return; }
    else if (m in kosong()) d[m] = el.value; else return;
    simpanT(); segarHidup();
  }
  document.addEventListener('click', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target)) klik(e); });
  document.addEventListener('input', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target)) input(e); });
  document.addEventListener('change', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target) && e.target.dataset && (e.target.dataset.pr === 'guna2' || e.target.dataset.pr === 'bahasa')) input(e); });
  return { meter, ringkas, render, teksAgen, kira, svg, png, data, htmlStrategi, htmlAyat };
}
