/* Laporan PDF Agen Banding: menjana laporan bergrafik (kad artikel, carta radar, bar bercermin, jadual dan perenggan) bagi laporan
   yang dijana oleh Agen Banding Prof Dr Claude sahaja, daripada data yang disediakan oleh mod/banding.js. Modul ini tulen: tiada DOM, hanya jsPDF, jspdf-autotable dan fon
   terbenam daripada vendor/laporan.bundle.js, maka ia boleh diuji dalam Node. Saiz dalam milimeter, kertas A4 tegak.
   Warna siri: Artikel 1 biru (seperti skrin), Artikel 2 merah jambu tua yang lulus semakan keterbezaan pada kertas
   putih; poligon Artikel 2 bergaris putus dan berpenanda segi empat supaya kekal boleh dibezakan tanpa warna. */
export function janaPdf(lib, data) {
  const { jsPDF, autoTable, FON } = lib;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = { a: [58, 92, 168], b: [181, 48, 110], fg: [26, 34, 48], muted: [91, 102, 120], line: [211, 218, 227], lembut: [234, 238, 242], aLembut: [229, 235, 247], bLembut: [249, 229, 238], ok: [44, 122, 75], okLembut: [221, 241, 228], putih: [255, 255, 255] };
  const PW = 210, PH = 297, ML = 18, MR = 18, MT = 18, MB = 20, CW = PW - ML - MR, BAWAH = PH - MB;
  let y = MT;

  /* ---- fon ---- */
  [['LSerif-R.ttf', 'LSerif', 'normal', FON.serif], ['LSerif-B.ttf', 'LSerif', 'bold', FON.serifBold], ['LSerif-I.ttf', 'LSerif', 'italic', FON.serifItalic], ['LSerif-BI.ttf', 'LSerif', 'bolditalic', FON.serifBoldItalic], ['LSans-R.ttf', 'LSans', 'normal', FON.sans], ['LSans-B.ttf', 'LSans', 'bold', FON.sansBold]]
    .forEach(([fail, nama, gaya, b64]) => { doc.addFileToVFS(fail, b64); doc.addFont(fail, nama, gaya); });
  function fon(jenis, gaya) { gaya = gaya || 'normal'; if (jenis === 'sans' && gaya !== 'normal') gaya = 'bold'; doc.setFont(jenis === 'sans' ? 'LSans' : 'LSerif', gaya); }
  const mm = pt => pt * 0.3528;
  const warna = c => doc.setTextColor(c[0], c[1], c[2]);
  const isi = c => doc.setFillColor(c[0], c[1], c[2]);
  const garis = c => doc.setDrawColor(c[0], c[1], c[2]);
  const clamp = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const bersih = s => String(s == null ? '' : s).replace(/[\u00a0\t]/g, ' ').replace(/[\u2028\u2029\r]/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s*[\u2014\u2013]\s*/g, ', ');

  /* ---- muka surat ---- */
  function mukaBaru() { doc.addPage(); y = MT; }
  function pastikan(h) { if (y + h > BAWAH) mukaBaru(); }
  const tandaBuku = [];
  function catatBuku(tajuk, aras) { tandaBuku.push({ tajuk, aras: aras || 0, muka: doc.internal.getCurrentPageInfo().pageNumber }); }

  /* ---- perenggan kaya: segmen {t, b, i, c, jenis} disusun menjadi baris, dipecah muka surat baris demi baris ---- */
  function susun(segs, o) {
    if (typeof segs === 'string') segs = [{ t: segs }];
    const pt = o.pt || 10.5, jenis = o.jenis || 'serif', lebar = o.w || CW; const tinggi = mm(pt) * (o.faktor || 1.38);
    const token = [];
    segs.forEach(s => { const t = bersih(s.t); if (!t) return; const gaya = s.b && s.i ? 'bolditalic' : s.b ? 'bold' : s.i ? 'italic' : 'normal'; t.split(/\n/).forEach((para, pi) => { if (pi) token.push({ baris: true }); para.split(/\s+/).filter(Boolean).forEach(w => token.push({ t: w, gaya, jenis: s.jenis || jenis, c: s.c || o.c || W.fg })); }); });
    doc.setFontSize(pt); fon(jenis, 'normal'); const ruang = doc.getTextWidth(' ');
    const ukur = tk => { fon(tk.jenis, tk.gaya); doc.setFontSize(pt); return doc.getTextWidth(tk.t); };
    const baris = []; let cur = [], lebarCur = 0, x = 0;
    const tutup = () => { baris.push(cur); cur = []; lebarCur = 0; x = 0; };
    token.forEach(tk => {
      if (tk.baris) { tutup(); return; }
      let w = ukur(tk);
      if (w > lebar) { // perkataan terlalu panjang (DOI, URL): pecah mengikut aksara, setiap cebisan pada barisnya sendiri
        if (cur.length) tutup();
        let sisa = tk.t;
        while (sisa.length) {
          let n = sisa.length; while (n > 1 && ukur(Object.assign({}, tk, { t: sisa.slice(0, n) })) > lebar) n--;
          const bahagian = Object.assign({}, tk, { t: sisa.slice(0, n) }); bahagian.x = 0; bahagian.w = ukur(bahagian); cur.push(bahagian); x = bahagian.w; lebarCur = x;
          sisa = sisa.slice(n); if (sisa.length) tutup();
        }
        return;
      }
      if (cur.length && x + ruang + w > lebar) tutup();
      tk.x = cur.length ? x + ruang : 0; tk.w = w; cur.push(tk); x = tk.x + w; lebarCur = x;
    });
    if (cur.length) baris.push(cur);
    return { baris, tinggi, h: baris.length * tinggi, pt };
  }
  function lukisBaris(s, o) {
    const x0 = o.x == null ? ML : o.x;
    s.baris.forEach(b => { if (!o.tanpaPecah) pastikan(s.tinggi); b.forEach(tk => { fon(tk.jenis, tk.gaya); doc.setFontSize(s.pt); warna(tk.c); doc.text(tk.t, x0 + tk.x, y, { baseline: 'top' }); }); y += s.tinggi; });
  }
  function perenggan(segs, o) { o = o || {}; const s = susun(segs, o); lukisBaris(s, o); y += o.jarak == null ? 2.4 : o.jarak; return s.h; }
  function labelTeks(label, teks, o) { if (!bersih(teks).trim()) return; perenggan([{ t: label + ' ', b: true }, { t: teks }], o); }

  /* ---- tajuk ---- */
  function h1(t) { fon('serif', 'bold'); doc.setFontSize(21); warna(W.fg); doc.splitTextToSize(bersih(t), CW).forEach(l => { pastikan(10); doc.text(l, ML, y, { baseline: 'top' }); y += mm(21) * 1.2; }); y += 1.5; }
  function h2(t, keep) { pastikan(keep || 24); y += 3; fon('sans', 'bold'); doc.setFontSize(12.5); warna(W.fg); doc.text(bersih(t), ML, y, { baseline: 'top' }); y += mm(12.5) * 1.2 + 0.8; garis(W.line); doc.setLineWidth(0.45); doc.line(ML, y, ML + CW, y); y += 3.4; catatBuku(t, 0); }
  function h3(t, keep) { pastikan(keep || 18); y += 2.2; fon('sans', 'bold'); doc.setFontSize(10.5); warna(W.fg); doc.text(bersih(t), ML, y, { baseline: 'top' }); y += mm(10.5) * 1.25 + 1.4; catatBuku(t, 1); }
  function h4(t, c, keep) { pastikan(keep || 14); y += 1; fon('serif', 'bold'); doc.setFontSize(10.5); warna(c || W.fg); doc.text(bersih(t), ML, y, { baseline: 'top' }); y += mm(10.5) * 1.25 + 0.8; }
  function nota(t, o) { perenggan([{ t, i: true, c: W.muted }], Object.assign({ pt: 8.8, faktor: 1.3, jarak: 2.6 }, o || {})); }

  /* ---- jadual (jspdf-autotable); objek gaya digabung lapis demi lapis supaya fon terbenam tidak tertimpa ---- */
  function jadual(opt) {
    pastikan(26);
    const asas = { startY: y, margin: { left: ML, right: MR, top: MT, bottom: MB }, theme: 'grid', tableWidth: CW, rowPageBreak: 'auto',
      styles: { font: 'LSerif', fontStyle: 'normal', fontSize: 9, cellPadding: { top: 1.5, right: 1.8, bottom: 1.5, left: 1.8 }, lineColor: W.line, lineWidth: 0.2, textColor: W.fg, overflow: 'linebreak', valign: 'top' },
      headStyles: { font: 'LSans', fontStyle: 'bold', fontSize: 8.5, fillColor: W.lembut, textColor: W.fg, lineColor: W.line, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [250, 251, 252] } };
    const o = Object.assign({}, asas, opt);
    ['styles', 'headStyles', 'alternateRowStyles'].forEach(k => { if (opt[k]) o[k] = Object.assign({}, asas[k], opt[k]); });
    autoTable(doc, o);
    y = doc.lastAutoTable.finalY + 4;
  }

  /* ---- carta radar: pusat (cx, cy), jejari r, label dibalut 22 mm; ukurRadar mengira jangkauan sebenar label di atas dan di bawah
     pusat supaya blok tidak menempah ruang kosong; legenda dua lajur di bawah label terbawah ---- */
  const TH = mm(7) * 1.18, JARAK_LABEL = 3.2, BARIS_LABEL = 3, LEBAR_LABEL = 22;
  function poligon(pts, gaya) { if (pts.length < 2) return; const segs = []; for (let i = 1; i < pts.length; i++) segs.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]); doc.lines(segs, pts[0][0], pts[0][1], [1, 1], gaya, true); }
  function sudut(i, n) { return -Math.PI / 2 + i * 2 * Math.PI / n; }
  function barisLabel(l) { fon('sans', 'normal'); doc.setFontSize(7); return doc.splitTextToSize(bersih(l), LEBAR_LABEL).slice(0, BARIS_LABEL); }
  function letakLabel(s, yy, k) { return s < -0.25 ? yy - k * TH : s > 0.25 ? yy : yy - k * TH / 2; }
  function ukurRadar(r, labels) {
    const n = labels.length; let atas = r + JARAK_LABEL, bawah = r + JARAK_LABEL;
    labels.forEach((l, i) => { const sn = Math.sin(sudut(i, n)); const k = barisLabel(l).length; const yy = (r + JARAK_LABEL) * sn; const y0 = letakLabel(sn, yy, k); atas = Math.max(atas, -y0); bawah = Math.max(bawah, y0 + k * TH); });
    return { atas: atas + 0.5, bawahLabel: bawah, bawah: bawah + 3 + 3.6 + 2, tinggi: atas + 0.5 + bawah + 3 + 3.6 + 2 };
  }
  function radar(cx, cy, r, lebarLajur, labels, va, vb, namaA, namaB, u) {
    const n = labels.length; if (!n) return;
    const pt = (i, v) => { const ang = sudut(i, n); const rr = r * clamp(v) / 100; return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]; };
    garis(W.line); doc.setLineWidth(0.2);
    [25, 50, 75, 100].forEach(p => poligon(labels.map((_, i) => pt(i, p)), 'S'));
    labels.forEach((_, i) => { const [x, yy] = pt(i, 100); doc.line(cx, cy, x, yy); });
    fon('sans', 'normal'); doc.setFontSize(6); warna(W.muted); [50, 100].forEach(p => { const [x, yy] = pt(0, p); doc.text(String(p), x + 0.8, yy + 0.4, { baseline: 'middle' }); });
    const pa = va.map((v, i) => pt(i, v)), pb = vb.map((v, i) => pt(i, v));
    doc.setGState(new doc.GState({ opacity: 0.16 })); isi(W.a); poligon(pa, 'F'); isi(W.b); poligon(pb, 'F'); doc.setGState(new doc.GState({ opacity: 1 }));
    doc.setLineWidth(0.6); garis(W.a); poligon(pa, 'S'); garis(W.b); doc.setLineDashPattern([1.4, 0.9], 0); poligon(pb, 'S'); doc.setLineDashPattern([], 0);
    pa.forEach(([x, yy]) => { isi(W.putih); doc.circle(x, yy, 1.35, 'F'); isi(W.a); doc.circle(x, yy, 0.95, 'F'); });
    pb.forEach(([x, yy]) => { isi(W.putih); doc.rect(x - 1.35, yy - 1.35, 2.7, 2.7, 'F'); isi(W.b); doc.rect(x - 0.95, yy - 0.95, 1.9, 1.9, 'F'); });
    fon('sans', 'normal'); doc.setFontSize(7); warna(W.muted);
    labels.forEach((l, i) => {
      const ang = sudut(i, n); const c = Math.cos(ang), sn = Math.sin(ang); const x = cx + (r + JARAK_LABEL) * c, yy = cy + (r + JARAK_LABEL) * sn;
      const align = Math.abs(c) < 0.25 ? 'center' : c > 0 ? 'left' : 'right'; const ls = barisLabel(l); const y0 = letakLabel(sn, yy, ls.length);
      fon('sans', 'normal'); doc.setFontSize(7); warna(W.muted); ls.forEach((t, k) => doc.text(t, x, y0 + k * TH, { baseline: 'top', align }));
    });
    const ly = cy + (u || ukurRadar(r, labels)).bawahLabel + 3; const x0 = cx - lebarLajur / 2; fon('sans', 'normal'); doc.setFontSize(8); warna(W.fg);
    isi(W.a); doc.roundedRect(x0, ly, 3.6, 3.6, 0.8, 0.8, 'F'); doc.text(doc.splitTextToSize(bersih(namaA), lebarLajur / 2 - 7)[0] || '', x0 + 5.5, ly + 1.8, { baseline: 'middle' });
    isi(W.b); doc.roundedRect(x0 + lebarLajur / 2, ly, 3.6, 3.6, 0.8, 0.8, 'F'); doc.text(doc.splitTextToSize(bersih(namaB), lebarLajur / 2 - 7)[0] || '', x0 + lebarLajur / 2 + 5.5, ly + 1.8, { baseline: 'middle' });
  }

  /* ---- bar bercermin (Artikel 1 ke kiri, Artikel 2 ke kanan) ---- */
  function ukurBar(r, w) {
    fon('sans', 'normal'); doc.setFontSize(7); const sebA = r.sebabA ? doc.splitTextToSize(bersih(r.sebabA), w / 2 - 13) : [], sebB = r.sebabB ? doc.splitTextToSize(bersih(r.sebabB), w / 2 - 13) : [];
    const ul = r.ulasan ? susun(r.ulasan, { pt: 9.2, faktor: 1.34, w, c: W.muted }) : null;
    const h = 4.4 + 0.8 + 3.4 + (sebA.length || sebB.length ? 1 + Math.max(sebA.length, sebB.length) * 2.9 : 0) + (ul ? 1.4 + ul.h + 3.2 : 2);
    return { h, sebA, sebB, ul };
  }
  function barisBar(x, w, r, u) {
    const a = clamp(r.a), b = clamp(r.b); fon('sans', 'bold'); doc.setFontSize(8.4); warna(W.fg); doc.text(bersih(r.label), x + w / 2, y, { baseline: 'top', align: 'center' }); y += 4.4 + 0.8;
    const nw = 11, tx0 = x + nw, tx1 = x + w - nw, mid = (tx0 + tx1) / 2, half = (tx1 - tx0) / 2 - 0.9, hT = 3.4;
    isi(W.lembut); doc.roundedRect(tx0, y, tx1 - tx0, hT, 1.7, 1.7, 'F');
    const wa = half * a / 100, wb = half * b / 100;
    if (wa > 0.3) { isi(W.a); doc.roundedRect(mid - 0.9 - wa, y, wa, hT, Math.min(1.7, wa / 2), Math.min(1.7, wa / 2), 'F'); }
    if (wb > 0.3) { isi(W.b); doc.roundedRect(mid + 0.9, y, wb, hT, Math.min(1.7, wb / 2), Math.min(1.7, wb / 2), 'F'); }
    fon('sans', 'bold'); doc.setFontSize(10); warna(W.a); doc.text(String(a), tx0 - 2.2, y + hT / 2, { baseline: 'middle', align: 'right' }); warna(W.b); doc.text(String(b), tx1 + 2.2, y + hT / 2, { baseline: 'middle' });
    y += hT;
    if (u.sebA.length || u.sebB.length) { y += 1; fon('sans', 'normal'); doc.setFontSize(7); warna(W.muted); u.sebA.forEach((t, k) => doc.text(t, tx0, y + k * 2.9, { baseline: 'top' })); u.sebB.forEach((t, k) => doc.text(t, tx1, y + k * 2.9, { baseline: 'top', align: 'right' })); y += Math.max(u.sebA.length, u.sebB.length) * 2.9; }
    if (u.ul) { y += 1.4; lukisBaris(u.ul, { x, tanpaPecah: true }); y += 3.2; } else y += 2;
  }
  function kumpulanBar(x, w, rows) { rows.forEach(r => { const u = ukurBar(r, w); pastikan(u.h); barisBar(x, w, r, u); }); }
  const purata = v => v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : 0;
  const H_SKOR = mm(22) * 1.15 + 2;
  function skorBesar(x, w, va, vb) {
    const cx = x + w / 2; fon('sans', 'bold'); doc.setFontSize(22); warna(W.a); doc.text(String(purata(va)), cx - 9, y, { baseline: 'top', align: 'right' }); warna(W.b); doc.text(String(purata(vb)), cx + 9, y, { baseline: 'top' });
    fon('sans', 'normal'); doc.setFontSize(7.2); warna(W.muted); doc.text('PURATA', cx, y + mm(22) * 0.55, { baseline: 'middle', align: 'center' }); y += H_SKOR;
  }
  /* Blok carta: radar di kiri, skor purata dan bar di lajur kanan apabila keseluruhannya muat pada baki muka surat; jika tidak,
     radar yang lebih besar dan skor purata dahulu (bersebelahan), kemudian bar selebar 140 mm yang mengalir merentas muka surat.
     Tajuk seksyen dilukis bersama blok supaya tidak terpisah di hujung muka surat. */
  function blokRadarBar(tajuk, labels, va, vb, namaA, namaB, rows, arasH2) {
    const tajukkan = () => { if (!tajuk) return; if (arasH2) h2(tajuk); else h3(tajuk); };
    const hTajuk = tajuk ? (arasH2 ? 3 + mm(12.5) * 1.2 + 0.8 + 3.4 : mm(10.5) * 1.25 + 3.6) : 0; const jurang = 6;
    const r1 = 26, lebar1 = 92, lebarKanan = CW - lebar1 - jurang, xKanan = ML + lebar1 + jurang; const u1 = ukurRadar(r1, labels);
    const hKanan = H_SKOR + rows.reduce((s, rr) => s + ukurBar(rr, lebarKanan).h, 0); const hBlok = Math.max(u1.tinggi, hKanan);
    if (y + hTajuk + hBlok <= BAWAH) {
      tajukkan(); const y0 = y; radar(ML + lebar1 / 2, y0 + u1.atas, r1, lebar1, labels, va, vb, namaA, namaB, u1);
      y = y0; skorBesar(xKanan, lebarKanan, va, vb); rows.forEach(rr => barisBar(xKanan, lebarKanan, rr, ukurBar(rr, lebarKanan))); y = y0 + hBlok + 2;
    } else {
      /* radar besar jika muat pada baki muka surat, radar sederhana atau kecil jika hanya itu yang muat, jika tidak muka surat baharu dengan radar besar */
      const calon = [[32, 112], [26, 92], [22, 80]].map(([r, lebar]) => ({ r, lebar, u: ukurRadar(r, labels) }));
      let pilih = calon.find(c => y + hTajuk + c.u.tinggi <= BAWAH); if (!pilih) { mukaBaru(); pilih = calon[0]; }
      const { r: r2, lebar: lebar2, u: u2 } = pilih;
      tajukkan(); const y0 = y; radar(ML + lebar2 / 2, y0 + u2.atas, r2, lebar2, labels, va, vb, namaA, namaB, u2);
      y = y0 + Math.round(u2.tinggi / 2 - H_SKOR / 2); skorBesar(ML + lebar2 + jurang, CW - lebar2 - jurang, va, vb); y = y0 + u2.tinggi + 2;
      kumpulanBar(ML + 17, 140, rows); y += 2;
    }
  }

  /* ---- kotak verdict ---- */
  function kotak(segs, warnaIsi) {
    const pad = 4; const s = susun(segs, { pt: 10.5, w: CW - 2 * pad }); pastikan(s.h + 2 * pad + 2);
    isi(warnaIsi); garis(W.line); doc.setLineWidth(0.2); doc.roundedRect(ML, y, CW, s.h + 2 * pad, 2, 2, 'F'); y += pad; lukisBaris(s, { x: ML + pad, tanpaPecah: true }); y += pad + 3;
  }

  /* ================= kandungan: hanya laporan yang dijana oleh Agen Banding Prof Dr Claude =================
     Indeks pantas dan jadual A hingga F ialah isian Prof Dr sendiri yang boleh dibaca semula dalam aplikasi pada bila-bila masa, maka
     tidak dimuatkan; kad artikel dikekalkan sekadar untuk mengenal pasti pasangan yang dibandingkan. */
  const A1 = data.artikel[0], A2 = data.artikel[1]; const l = data.laporan;
  doc.setProperties({ title: `Laporan Agen Banding: ${A1.nama} lwn ${A2.nama}`, subject: 'Laporan Agen Banding Prof Dr Claude, Repositori SLR', author: 'Repositori SLR', creator: 'Repositori SLR' });

  fon('sans', 'bold'); doc.setFontSize(8); warna(W.muted); doc.text('REPOSITORI SLR  ·  BANDING ARTIKEL', ML, y, { baseline: 'top' }); y += 6;
  h1('Laporan Agen Banding Prof Dr Claude'); perenggan([{ t: `${A1.nama}  lwn  ${A2.nama}`, b: true }], { pt: 13, jarak: 1.5 });
  perenggan([{ t: `Dijana ${data.masa || data.dijana}${data.model ? ' oleh ' + String(data.model).replace('claude-', '') : ''}${data.token ? ' (token masuk ' + data.token.masuk + ', keluar ' + data.token.keluar + ')' : ''} daripada medan Bahagian A hingga F kedua-dua rekod, bukan PDF artikel; dimuat turun ${data.dijana}. Draf untuk disemak oleh Prof Dr; angka ialah skor penilaian agen, bukan ukuran empirikal.`, c: W.muted }], { pt: 9.2, faktor: 1.3, jarak: 4 });

  /* kad pengenalan artikel */
  const kad = a => [bersih(a.tajuk || 'Tajuk belum diisi'), bersih(a.rujukan || ''), (a.chips || []).map(bersih).filter(Boolean).join('  ·  '), `Bil. ${a.bil}  ·  ${a.status}${a.doi ? '  ·  https://doi.org/' + a.doi : ''}`];
  const k1 = kad(A1), k2 = kad(A2); const badan = [], jenisBaris = []; k1.forEach((_, i) => { if (k1[i] || k2[i]) { badan.push([k1[i], k2[i]]); jenisBaris.push(i); } });
  jadual({ head: [[`Artikel 1  ·  ${A1.nama}`, `Artikel 2  ·  ${A2.nama}`]], body: badan, columnStyles: { 0: { cellWidth: CW / 2 }, 1: { cellWidth: CW / 2 } }, alternateRowStyles: { fillColor: W.putih },
    didParseCell: h => { if (h.section === 'head') { h.cell.styles.fillColor = h.column.index === 0 ? W.aLembut : W.bLembut; h.cell.styles.textColor = h.column.index === 0 ? W.a : W.b; h.cell.styles.fontSize = 9.5; return; } const i = jenisBaris[h.row.index]; if (i === 0) { h.cell.styles.fontStyle = 'italic'; h.cell.styles.fontSize = 10; } else if (i === 1) { h.cell.styles.fontSize = 8.6; h.cell.styles.textColor = W.muted; } else { h.cell.styles.font = 'LSans'; h.cell.styles.fontSize = 8; h.cell.styles.textColor = W.muted; } } });

  if (!l) {
    nota('Laporan agen belum dijana bagi pasangan ini. Klik "Mohon Agen Banding Prof Dr Claude" dalam aplikasi, kemudian muat turun semula PDF ini.');
  } else {
    /* 1. Profil */
    h2('1. Profil kedua-dua artikel');
    jadual({ head: [[`Artikel 1  ·  ${A1.nama}`, `Artikel 2  ·  ${A2.nama}`]], body: [[bersih(l.profil.a), bersih(l.profil.b)]], columnStyles: { 0: { cellWidth: CW / 2 }, 1: { cellWidth: CW / 2 } }, styles: { fontSize: 9.6 },
      didParseCell: h => { if (h.section === 'head') { h.cell.styles.fillColor = h.column.index === 0 ? W.aLembut : W.bLembut; h.cell.styles.textColor = h.column.index === 0 ? W.a : W.b; h.cell.styles.fontSize = 9.5; } } });
    /* 2. Penilaian teknikal */
    if (l.skor && l.skor.length) {
      const va = l.skor.map(x => clamp(x.a)), vb = l.skor.map(x => clamp(x.b)); const labels = l.skor.map(x => x.dimensi);
      blokRadarBar('2. Penilaian teknikal agen', labels, va, vb, A1.nama, A2.nama, l.skor.map(x => ({ label: x.dimensi, a: x.a, b: x.b })), true);
      h4('Asas skor setiap dimensi');
      l.skor.forEach(x => perenggan([{ t: bersih(x.dimensi) + ' ', b: true }, { t: `(Artikel 1: ${clamp(x.a)}; Artikel 2: ${clamp(x.b)}). `, c: W.muted, jenis: 'sans' }, { t: x.ulasan }], { pt: 10 }));
    }
    /* 3. Dimensi konstruk */
    if (l.dimensi) {
      h2('3. Dimensi dan subdimensi konstruk', 60);
      nota('Dipetakan oleh agen daripada medan konstruk, definisi, teori dan instrumen. ● dimensi yang dikongsi kedua-dua artikel bagi peranan konstruk yang sama; ○ dimensi yang hanya ada pada artikel ini.');
      [['Artikel 1', A1.nama, l.dimensi.a, W.aLembut, W.a], ['Artikel 2', A2.nama, l.dimensi.b, W.bLembut, W.b]].forEach(([lbl, nm, arr, lembut, c]) => {
        const rows = (arr || []).map(k => [bersih(k.konstruk), bersih(k.peranan), bersih(k.kerangka || 'Tiada dalam rekod'), k.dimensi && k.dimensi.length ? k.dimensi.map(dd => (dd.sama ? '● ' : '○ ') + bersih(dd.nama) + (dd.sub && dd.sub.length ? ' (' + dd.sub.map(bersih).join('; ') + ')' : '')).join('\n') : 'Dimensi tidak dinyatakan dalam rekod (unidimensi atau belum diisi).']);
        jadual({ head: [[{ content: `${lbl}  ·  ${nm}`, colSpan: 4 }], ['Konstruk', 'Peranan', 'Kerangka sumber', 'Dimensi dan subdimensi']], body: rows.length ? rows : [[{ content: 'Tiada konstruk dapat dipetakan daripada rekod.', colSpan: 4, styles: { fontStyle: 'italic', textColor: W.muted } }]], columnStyles: { 0: { cellWidth: 44, fontStyle: 'bold' }, 1: { cellWidth: 24 }, 2: { cellWidth: 34 }, 3: { cellWidth: CW - 102 } },
          didParseCell: h => { if (h.section === 'head' && h.row.index === 0) { h.cell.styles.fillColor = lembut; h.cell.styles.textColor = c; h.cell.styles.fontSize = 9.5; } } });
      });
      const bd = l.bandingDimensi || {}; h4('Perbandingan dimensi');
      labelTeks('Persamaan.', bd.persamaan); labelTeks('Perbezaan.', bd.perbezaan); labelTeks('Implikasi kepada instrumen Prof Dr.', bd.implikasi);
    }
    /* 4. Bahagian A hingga F */
    h2('4. Perbandingan setiap bahagian');
    (l.bahagian || []).forEach(x => { const s = (data.bahagian || []).find(b => b.letter === x.bahagian); h4(`Bahagian ${x.bahagian}. ${s ? s.title : ''}`); labelTeks('Persamaan.', x.persamaan); labelTeks('Perbezaan.', x.perbezaan); labelTeks('Penilaian.', x.penilaian); });
    /* 5. Kekuatan dan kelemahan */
    h2('5. Kekuatan dan kelemahan', 50);
    jadual({ head: [['', `Artikel 1  ·  ${A1.nama}`, `Artikel 2  ·  ${A2.nama}`]], body: [['Kekuatan', bersih(l.kekuatan.a), bersih(l.kekuatan.b)], ['Kelemahan', bersih(l.kelemahan.a), bersih(l.kelemahan.b)]], columnStyles: { 0: { cellWidth: 24, font: 'LSans', fontStyle: 'bold', fontSize: 8.5 }, 1: { cellWidth: 75 }, 2: { cellWidth: 75 } }, styles: { fontSize: 9.6 }, alternateRowStyles: { fillColor: W.putih },
      didParseCell: h => { if (h.section === 'head' && h.column.index > 0) { h.cell.styles.fillColor = h.column.index === 1 ? W.aLembut : W.bLembut; h.cell.styles.textColor = h.column.index === 1 ? W.a : W.b; } } });
    /* 6 hingga 8. Keseluruhan, refleksi, sitasi, keputusan */
    h2('6. Laporan keseluruhan'); perenggan(l.keseluruhan, { pt: 10.5 });
    h2('7. Refleksi terhadap kajian Prof Dr'); perenggan(l.refleksi, { pt: 10.5 });
    h2('8. Cadangan sitasi bersama'); perenggan(l.sitasi, { pt: 10.5 });
    const menang = l.lebihBerguna === 'Artikel 1' ? `Artikel 1, ${A1.nama}` : l.lebihBerguna === 'Artikel 2' ? `Artikel 2, ${A2.nama}` : 'kedua-dua setara';
    kotak([{ t: `Lebih berguna untuk kajian Prof Dr: ${menang}. `, b: true, c: l.lebihBerguna === 'Artikel 1' ? W.a : l.lebihBerguna === 'Artikel 2' ? W.b : W.fg }, { t: l.sebab }], l.lebihBerguna === 'Artikel 1' ? W.aLembut : l.lebihBerguna === 'Artikel 2' ? W.bLembut : W.lembut);
  }

  /* ---- kaki muka surat dan tanda buku ---- */
  const N = doc.internal.getNumberOfPages();
  for (let p = 1; p <= N; p++) {
    doc.setPage(p); garis(W.line); doc.setLineWidth(0.2); doc.line(ML, PH - 13, ML + CW, PH - 13);
    fon('sans', 'normal'); doc.setFontSize(7.5); warna(W.muted);
    doc.text(`Repositori SLR  ·  Laporan Agen Banding  ·  ${bersih(A1.nama)} lwn ${bersih(A2.nama)}`.slice(0, 110), ML, PH - 10.5, { baseline: 'top' });
    doc.text(`Muka surat ${p} daripada ${N}`, ML + CW, PH - 10.5, { baseline: 'top', align: 'right' });
  }
  try { if (doc.outline && tandaBuku.length) { let induk = null; tandaBuku.forEach(b => { const node = doc.outline.add(b.aras === 0 ? null : induk, b.tajuk, { pageNumber: b.muka }); if (b.aras === 0) induk = node; }); } } catch (e) { /* tanda buku pilihan */ }
  return doc.output('arraybuffer');
}
