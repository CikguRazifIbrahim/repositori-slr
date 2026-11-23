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
/* v1.38.0: atas permintaan pemilik, ruang ini memaparkan RAJAH SAHAJA. Paparan pangkalan data dan rentetan carian, Jadual kriteria
   kelayakan, Saringan rekod dan medan angka aliran dibuang. Setiap kotak putih rajah ialah teks yang ditulis terus oleh pemilik (klik
   kotak untuk menyunting); kotak berwarna kekal mengikut templat. Pembayang terapung pada setiap kotak menerangkan apa yang patut
   ditulis dan mencadangkan teks. Sistem tidak lagi mengira atau mengisi angka: ia hanya menyemak kira-kira antara kotak dan memberi
   amaran. Data lama (d.pangkalan, d.kriteria dan log saringan) TIDAK dipadam: ia masih dibaca untuk agen dan boleh diambil di bawah
   "Rekod lama". Kandungan kotak pada kali pertama dibina daripada data lama itu (dariLama), supaya tiada angka hilang. Enjin carian
   (PENYAMBUNG) dan mod/saring.js disimpan tanpa paparan supaya log saringan lama masih boleh dibaca dan dieksport. */
import { initSaring } from './saring.js';
export function initPrisma(X) {
  const { R, C, P, D, esc, toast, angka, idBaru, simpanT, gaya, en, kel, sasaranRam, sisip, Teks, A } = X;
  const LBL2 = { en: { laman: 'Websites', organisasi: 'Organisations', sitasi: 'Citation searching' }, ms: { laman: 'Laman web', organisasi: 'Organisasi', sitasi: 'Carian sitasi' } };
  const kosong = () => ({ pangkalan: [], daftar: '', pendua: '', automasi: '', lainBuang: '', dikecualikan: '', tidak: '', sebab: [], guna2: true, laman: '', organisasi: '', sitasi: '', lain2t: '', lain2: '', tidak2: '', sebab2: [], laporan: '', bahasa: '' });
  /* Jadual kriteria kelayakan (Jadual 1 Metodologi): baris tetap bagi setiap artikel ulasan; label mengikut bahasa manuskrip kecuali diubah. */
  const KRITERIA_TETAP = [['populasi', 'Population', 'Populasi'], ['konsep', 'Concept', 'Konsep'], ['konteks', 'Context', 'Konteks'], ['reka', 'Study design', 'Reka bentuk kajian'], ['jenis', 'Publication type', 'Jenis penerbitan'], ['tahun', 'Publication year', 'Tahun penerbitan'], ['bahasa', 'Language', 'Bahasa'], ['capaian', 'Access', 'Capaian']];
  const barisTetap = kunci => ({ id: idBaru('k'), kunci, k: '', m: '', x: '' });
  function data() { if (!P.t.prisma || typeof P.t.prisma !== 'object') P.t.prisma = kosong(); const d = P.t.prisma; ['pangkalan', 'sebab', 'sebab2'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; }); if (d.guna2 === undefined) d.guna2 = true; if (!Array.isArray(d.kriteria)) d.kriteria = []; if (!d.kriteriaSedia) { if (!d.kriteria.length) d.kriteria = KRITERIA_TETAP.map(r => barisTetap(r[0])); d.kriteriaSedia = true; } return d; }
  const num = v => Math.max(0, parseInt(v, 10) || 0);
  const isi = v => String(v == null ? '' : v).trim() !== '';
  const bahasa = () => { const b = data().bahasa; return b === 'en' || b === 'ms' ? b : (en() ? 'en' : 'ms'); };

  /* Semua kotak yang boleh dikira dikira di sini; isu[] menyenaraikan percanggahan aritmetik dan maklumat yang belum lengkap. */
  function kira() {
    const d = data(); const g = gaya(); const nPang = d.pangkalan.reduce((s, x) => s + num(x.n), 0); const dikenal = nPang + num(d.daftar); const buang = num(d.pendua) + num(d.automasi) + num(d.lainBuang);
    const disaring = dikenal - buang; const dicari = disaring - num(d.dikecualikan); const dinilai = dicari - num(d.tidak); const nSebab = d.sebab.reduce((s, x) => s + num(x.n), 0); const masuk1 = dinilai - nSebab;
    const dikenal2 = d.guna2 ? num(d.laman) + num(d.organisasi) + num(d.sitasi) + num(d.lain2) : 0; const dinilai2 = dikenal2 - (d.guna2 ? num(d.tidak2) : 0); const nSebab2 = d.guna2 ? d.sebab2.reduce((s, x) => s + num(x.n), 0) : 0; const masuk2 = dinilai2 - nSebab2;
    /* Rekod pangkalan data yang dikenal pasti tetapi keputusan saringannya belum direkodkan tidak boleh mengalir terus ke "kajian dimasukkan".
       Selagi bilangan rekod dikecualikan belum diisi, kotak selepas saringan dipaparkan sebagai belum disaring, bukan sebagai angka. */
    const belumSaring = dikenal > 0 && !isi(d.dikecualikan);
    const belumNilai = !belumSaring && num(d.belumNilai) > 0; const kajian = belumSaring || belumNilai ? 0 : masuk1 + masuk2; const laporan = isi(d.laporan) ? num(d.laporan) : kajian; const isu = []; const info = [];
    const adaPang = d.pangkalan.filter(x => isi(x.nama)); const tanpaRentetan = adaPang.filter(x => !isi(x.rentetan)); const tanpaTarikh = adaPang.filter(x => !isi(x.tarikh)); const tanpaN = adaPang.filter(x => !isi(x.n));
    if (!adaPang.length) isu.push('Belum ada pangkalan data direkodkan.');
    if (tanpaRentetan.length) isu.push(`Rentetan carian belum diisi bagi: ${tanpaRentetan.map(x => x.nama).join(', ')}. Rentetan carian penuh perlu dicetak dalam manuskrip.`);
    if (tanpaTarikh.length) isu.push(`Tarikh carian belum diisi bagi: ${tanpaTarikh.map(x => x.nama).join(', ')}.`);
    if (tanpaN.length) isu.push(`Bilangan rekod belum diisi bagi: ${tanpaN.map(x => x.nama).join(', ')}.`);
    if (kel() === 'skop' && adaPang.length > (g.hadPangkalan || 2)) info.push(`Peraturan gaya Prof Dr sekarang: ulasan skop menggunakan paling banyak ${g.hadPangkalan || 2} pangkalan data; ${adaPang.length} direkodkan. Had ini boleh diubah dalam Peraturan gaya jika artikel ini memang menggunakan lebih banyak.`);
    if (dikenal > 0) {
      if (disaring < 0) isu.push(`Rekod dibuang sebelum saringan (${angka(buang)}) melebihi rekod dikenal pasti (${angka(dikenal)}).`);
      else if (dicari < 0) isu.push(`Rekod dikecualikan (${angka(num(d.dikecualikan))}) melebihi rekod disaring (${angka(disaring)}).`);
      else if (dinilai < 0) isu.push(`Laporan tidak diperoleh (${angka(num(d.tidak))}) melebihi laporan dicari (${angka(dicari)}).`);
      else if (masuk1 < 0) isu.push(`Jumlah laporan dikecualikan mengikut sebab (${angka(nSebab)}) melebihi laporan dinilai (${angka(dinilai)}).`);
      if (!isi(d.pendua)) info.push('Bilangan rekod pendua belum diisi (isi 0 jika tiada).');
      if (!isi(d.dikecualikan)) info.push(`Bilangan rekod dikecualikan pada saringan tajuk dan abstrak belum diisi. Kajian dimasukkan tidak dikira sehingga angka itu diisi: ${angka(Math.max(0, disaring))} rekod masih menunggu keputusan saringan.`);
      adaPang.filter(x => num(x.n) > 1000).forEach(x => info.push(`${x.nama}: ${angka(num(x.n))} rekod. Jumlah sebesar ini menandakan rentetan terlalu luas untuk disaring satu demi satu; kecilkan rentetan (frasa tepat, medan tajuk dan abstrak, had tahun) dan jalankan semula sebelum melaporkannya.`));
      if (nSebab > 0 && d.sebab.some(x => num(x.n) > 0 && !isi(x.t))) isu.push('Setiap bilangan laporan dikecualikan perlu disertai sebabnya.');
    }
    if (d.guna2 && dikenal2 > 0) { if (dinilai2 < 0) isu.push(`Kaedah lain: laporan tidak diperoleh (${angka(num(d.tidak2))}) melebihi rekod dikenal pasti (${angka(dikenal2)}).`); else if (masuk2 < 0) isu.push(`Kaedah lain: laporan dikecualikan (${angka(nSebab2)}) melebihi laporan dinilai (${angka(dinilai2)}).`); }
    if (d.guna2 && num(d.lain2) > 0 && !isi(d.lain2t)) isu.push('Kaedah lain: nyatakan nama kaedah bagi bilangan rekod yang diisi (contohnya carian berbantukan AI dengan nama alatnya).');
    if (belumNilai) info.push(`${angka(num(d.belumNilai))} laporan lulus saringan tajuk dan abstrak tetapi belum dinilai pada teks penuh dalam Saringan rekod. Kajian dimasukkan tidak dikira sehingga semuanya dinilai.`);
    const belumJalan = adaPang.filter(x => isi(x.rentetan) && (!isi(x.tarikh) || !isi(x.n))); if (belumJalan.length) info.push(`Rentetan carian belum dijalankan bagi: ${belumJalan.map(x => x.nama).join(', ')}. Jalankan dalam pangkalan data itu, kemudian isi tarikh carian dan bilangan rekod sebenar.`);
    if (isi(d.laporan) && laporan < kajian && kajian > 0) isu.push(`Laporan kajian yang dimasukkan (${angka(laporan)}) kurang daripada bilangan kajian (${angka(kajian)}).`);
    const dok = C.doc(); const nSumber = dok ? C.sumberAda(dok).length : 0; if (kajian > 0 && nSumber && nSumber !== kajian) info.push(`Kajian dimasukkan (${angka(kajian)}) berbeza daripada artikel sumber yang dipilih bagi artikel ini (${nSumber}). Ini dibenarkan, tetapi angka dalam teks mesti mengikut rajah.`);
    const lengkap = adaPang.length > 0 && !tanpaRentetan.length && !tanpaTarikh.length && !tanpaN.length && dikenal > 0 && isi(d.pendua) && isi(d.dikecualikan) && kajian > 0 && !isu.length;
    return { d, nPang, dikenal, buang, disaring, dicari, dinilai, nSebab, masuk1, dikenal2, dinilai2, nSebab2, masuk2, kajian, laporan, isu, info, lengkap, adaPang, belumJalan, belumSaring, belumNilai };
  }
  const adaRajah = () => { const dok = C.doc(); return !!dok && Object.values(dok.seksyen || {}).some(s => !s.padam && /alt="[^"]*PRISMA/i.test(String(s.html || '') + String(s.ram || ''))); };
  /* ---- v1.38.0: rajah sahaja. Setiap kotak putih ialah teks yang ditulis oleh pemilik; label berwarna kekal mengikut templat. ---- */
  const KOTAK = ['a1', 'a1s', 'b1', 'a2', 'a2s', 'a3', 'a3s', 'b3', 'b3s', 'a4', 'a4s', 'b4', 'b4s', 'a5'];
  const KOTAK2 = new Set(['b1', 'b3', 'b3s', 'b4', 'b4s']);   // lajur kaedah lain
  const NBSP = String.fromCharCode(160);
  const NAMA = { a1: 'Rekod dikenal pasti daripada pangkalan data dan daftar', a1s: 'Rekod dibuang sebelum saringan', b1: 'Rekod dikenal pasti melalui kaedah lain', a2: 'Rekod disaring', a2s: 'Rekod dikecualikan pada tajuk dan abstrak', a3: 'Laporan dicari untuk diperoleh', a3s: 'Laporan tidak diperoleh', b3: 'Laporan dicari (kaedah lain)', b3s: 'Laporan tidak diperoleh (kaedah lain)', a4: 'Laporan dinilai kelayakannya', a4s: 'Laporan dikecualikan selepas dinilai', b4: 'Laporan dinilai kelayakannya (kaedah lain)', b4s: 'Laporan dikecualikan selepas dinilai (kaedah lain)', a5: 'Kajian dimasukkan dalam ulasan' };
  /* Pembayang terapung: apa yang patut ditulis dalam setiap kotak (bahasa mudah). Diambil daripada panduan pengisian terdahulu. */
  const PANDUAN = {
    a1: 'Tulis nama setiap pangkalan data yang dicari dan bilangan rekod yang dipaparkan pada hari carian, satu baris bagi satu pangkalan data. Daftar ialah daftar kajian, contohnya daftar percubaan klinikal; tulis 0 jika tidak digunakan. Tanda * ialah nota templat untuk penulis dan boleh dibuang.',
    a1s: 'Rekod yang dibuang sebelum tajuk dan abstrak dibaca: pendua (rekod yang sama dalam dua pangkalan data), rekod yang ditolak oleh alat automasi, dan sebab lain. Tulis 0 jika tiada.',
    b1: 'Rekod yang ditemui di luar carian pangkalan data: laman web, organisasi, carian sitasi dan senarai rujukan. Artikel yang ditemui melalui pembantu AI ditulis pada baris sendiri dengan nama alatnya.',
    a2: 'Bilangan rekod yang tajuk dan abstraknya dibaca. Kiraannya: rekod dikenal pasti tolak rekod dibuang sebelum saringan.',
    a2s: 'Bilangan rekod yang ditolak selepas tajuk dan abstraknya dibaca. Sebab boleh disenaraikan di bawah jumlah itu, satu baris bagi satu sebab; jumlah semua sebab mesti sama dengan angka di atasnya. Tanda ** ialah nota templat dan boleh dibuang.',
    a3: 'Bilangan artikel yang teks penuhnya cuba diperoleh. Kiraannya: rekod disaring tolak rekod dikecualikan.',
    a3s: 'Bilangan artikel yang teks penuhnya sudah dicari tetapi tidak dapat diperoleh. Artikel yang belum dicari atau belum dibaca tidak dikira di sini. Tulis 0 jika semua diperoleh.',
    b3: 'Bilangan artikel daripada kaedah lain yang teks penuhnya cuba diperoleh. Lazimnya sama dengan jumlah kotak di atasnya.',
    b3s: 'Artikel daripada kaedah lain yang teks penuhnya dicari tetapi tidak dapat diperoleh. Tulis 0 jika semua diperoleh.',
    a4: 'Bilangan artikel yang teks penuhnya dibaca dan dinilai mengikut kriteria kelayakan. Kiraannya: laporan dicari tolak laporan tidak diperoleh.',
    a4s: 'Artikel yang ditolak selepas teks penuhnya dibaca. Tulis satu baris bagi satu sebab berserta bilangannya; sebab mesti sepadan dengan kriteria kelayakan dalam teks. Tulis (n = 0) jika tiada.',
    b4: 'Bilangan artikel daripada kaedah lain yang teks penuhnya dinilai. Kiraannya: laporan dicari tolak laporan tidak diperoleh.',
    b4s: 'Artikel daripada kaedah lain yang ditolak selepas dinilai, satu baris bagi satu sebab. Tulis (n = 0) jika tiada.',
    a5: 'Bilangan kajian yang dirangkum dalam ulasan ini. Kiraannya: laporan dinilai tolak laporan dikecualikan, campur kajian daripada kaedah lain. Tambah baris laporan hanya jika satu kajian dilaporkan dalam lebih daripada satu artikel.'
  };
  /* Teks templat PRISMA 2020 bagi kotak yang belum diisi; juga asas "cadangan teks" dalam pembayang. */
  function templat(lang) {
    const L = D.PRISMA_LABEL[lang] || D.PRISMA_LABEL.ms; const L2 = LBL2[lang] || LBL2.ms; const n = '(n = )';
    return { a1: `${L.dikenal}\n   ${L.pangkalan} ${n}\n   ${L.daftar} ${n}`, a1s: `${L.dibuang}\n   ${L.pendua} ${n}\n   ${L.automasi} ${n}\n   ${L.lain} ${n}`, b1: `${L.dikenalLain}\n   ${L2.laman} ${n}\n   ${L2.organisasi} ${n}\n   ${L2.sitasi} ${n}`,
      a2: `${L.disaring}\n${n}`, a2s: `${L.dikecualikan}\n${n}`, a3: `${L.dicari}\n${n}`, a3s: `${L.tidak}\n${n}`, b3: `${L.dicari}\n${n}`, b3s: `${L.tidak}\n${n}`,
      a4: `${L.dinilai}\n${n}`, a4s: `${L.laporanKecuali}\n   ${L.sebab} 1 ${n}\n   ${L.sebab} 2 ${n}`, b4: `${L.dinilai}\n${n}`, b4s: `${L.laporanKecuali}\n   ${n}`, a5: `${L.kajian}\n${n}` };
  }
  const MEDAN_LAMA = ['daftar', 'pendua', 'automasi', 'lainBuang', 'dikecualikan', 'tidak', 'laman', 'organisasi', 'sitasi', 'lain2', 'tidak2', 'laporan'];
  const adaLama = () => { const d = data(); return d.pangkalan.some(x => isi(x.nama) || isi(x.n)) || MEDAN_LAMA.some(m => isi(d[m])) || d.sebab.length > 0 || d.sebab2.length > 0; };
  /* Pemindahan sekali: kandungan kotak dibina daripada medan lama, tepat seperti rajah yang dilukis sebelum v1.38.0, supaya tiada angka hilang. */
  function dariLama(lang) {
    const k = kira(); const d = k.d; const L = D.PRISMA_LABEL[lang] || D.PRISMA_LABEL.ms; const L2 = LBL2[lang] || LBL2.ms; const sebaris = t => String(t || '').replace(/\s+/g, ' ').trim();
    const n = v => `(n = ${angka(v)})`; const nS = v => k.belumSaring ? '(n = )' : n(v); const nK = v => k.belumSaring || k.belumNilai ? '(n = )' : n(v);
    const sebabTeks = arr => { const a = (arr || []).filter(x => num(x.n) > 0 || isi(x.t)); return a.length ? a.map((x, i) => `   ${isi(x.t) ? sebaris(x.t) : L.sebab + ' ' + (i + 1)} ${n(num(x.n))}`).join('\n') : `   ${n(0)}`; };
    const pangTeks = k.adaPang.length && k.adaPang.length <= 4 ? k.adaPang.map(x => `   ${sebaris(x.nama)} ${isi(x.n) ? n(num(x.n)) : '(n = )'}`).join('\n') : `   ${L.pangkalan} ${n(k.nPang)}`;
    return { a1: `${L.dikenal}\n${pangTeks}\n   ${L.daftar} ${n(num(d.daftar))}`, a1s: `${L.dibuang}\n   ${L.pendua} ${n(num(d.pendua))}\n   ${L.automasi} ${n(num(d.automasi))}\n   ${L.lain} ${n(num(d.lainBuang))}`,
      b1: `${L.dikenalLain}\n   ${L2.laman} ${n(num(d.laman))}\n   ${L2.organisasi} ${n(num(d.organisasi))}\n   ${L2.sitasi} ${n(num(d.sitasi))}${isi(d.lain2t) || num(d.lain2) ? '\n   ' + (sebaris(d.lain2t) || (lang === 'en' ? 'Other method' : 'Kaedah lain')) + ' ' + n(num(d.lain2)) : ''}`,
      a2: `${L.disaring}\n${n(Math.max(0, k.disaring))}`, a2s: `${L.dikecualikan}\n${nS(num(d.dikecualikan))}${!k.belumSaring && (d.sebab0 || []).some(x => num(x.n) > 0) ? '\n' + sebabTeks(d.sebab0) : ''}`,
      a3: `${L.dicari}\n${nS(Math.max(0, k.dicari))}`, a3s: `${L.tidak}\n${n(num(d.tidak))}`, b3: `${L.dicari}\n${n(k.dikenal2)}`, b3s: `${L.tidak}\n${n(num(d.tidak2))}`,
      a4: `${L.dinilai}\n${nS(Math.max(0, k.dinilai))}`, a4s: `${L.laporanKecuali}\n${sebabTeks(d.sebab)}`, b4: `${L.dinilai}\n${n(Math.max(0, k.dinilai2))}`, b4s: `${L.laporanKecuali}\n${sebabTeks(d.sebab2)}`,
      a5: isi(d.laporan) && k.laporan !== k.kajian ? `${L.kajian}\n${nK(Math.max(0, k.kajian))}\n${L.laporan}\n${nK(Math.max(0, k.laporan))}` : `${L.kajian}\n${nK(Math.max(0, k.kajian))}` };
  }
  /* Apabila bahasa rajah ditukar, hanya frasa templat dalam kotak yang diterjemah; nama pangkalan data, sebab yang ditulis sendiri dan
     semua angka kekal. Dua laluan (penanda dahulu, kemudian gantian) mengelakkan satu gantian mengubah hasil gantian yang lain. */
  function alihBahasa(T, lama, baharu) {
    const A1 = D.PRISMA_LABEL[lama], B1 = D.PRISMA_LABEL[baharu]; if (!A1 || !B1 || lama === baharu) return; const ps = []; const kecil = t => t.charAt(0).toLowerCase() + t.slice(1); const ke = baharu === 'en';
    /* label yang tanda bintangnya sudah dibuang oleh pemilik turut diterjemah */
    ['dikenal', 'pangkalan', 'daftar', 'dibuang', 'pendua', 'automasi', 'lain', 'disaring', 'dikecualikan', 'dicari', 'tidak', 'dinilai', 'laporanKecuali', 'kajian', 'laporan', 'dikenalLain'].forEach(k => { ps.push([A1[k], B1[k]]); if (A1[k].includes('*')) ps.push([A1[k].replace(/\*/g, ''), B1[k].replace(/\*/g, '')]); });
    Object.keys(LBL2[lama]).forEach(k => ps.push([LBL2[lama][k], LBL2[baharu][k]]));
    KRITERIA_TETAP.forEach(r => { const e1 = `${r[1]} criterion not met`, m1 = `Kriteria ${kecil(r[2])} tidak dipenuhi`; ps.push(ke ? [m1, e1] : [e1, m1]); });
    [['Other reason', 'Sebab lain'], ['Reason not stated', 'Sebab belum dinyatakan'], ['Other method', 'Kaedah lain']].forEach(p => ps.push(ke ? [p[1], p[0]] : [p[0], p[1]]));
    const pp = ps.filter(p => p[0] && p[1] && p[0] !== p[1]).sort((a, b) => b[0].length - a[0].length); const tanda = i => String.fromCharCode(1) + i + String.fromCharCode(2);
    KOTAK.forEach(id => { let t = String(T[id] || ''); pp.forEach((p, i) => { t = t.split(p[0]).join(tanda(i)); }); pp.forEach((p, i) => { t = t.split(tanda(i)).join(p[1]); });
      T[id] = ke ? t.replace(/\bSebab (\d+)\b/g, 'Reason $1') : t.replace(/\bReason (\d+)\b/g, 'Sebab $1'); });
  }
  /* Teks semua kotak. Kali pertama (rajah belum wujud), kandungan dibina daripada data lama jika ada, atau daripada templat kosong.
     Selepas itu kotak inilah satu-satunya sumber rajah. Jika bahasa rajah berubah, frasa templat diselaraskan. */
  function kotakD() {
    const d = data(); const lang = bahasa();
    if (!d.rajah || typeof d.rajah !== 'object' || !d.rajah.kotak || typeof d.rajah.kotak !== 'object') d.rajah = { v: 1, bahasa: lang, kotak: Object.assign(templat(lang), adaLama() ? dariLama(lang) : {}) };
    const T = d.rajah.kotak; if (!d.rajah.lengkap) { const asas = templat(d.rajah.bahasa || lang); KOTAK.forEach(id => { if (typeof T[id] !== 'string') T[id] = asas[id]; }); d.rajah.lengkap = true; }
    if (d.rajah.bahasa !== lang) { alihBahasa(T, d.rajah.bahasa === 'en' ? 'en' : 'ms', lang); d.rajah.bahasa = lang; }
    return T;
  }
  const RX_N = /\(\s*n\s*=\s*([0-9][0-9.,\s]*)\)/i; const RX_N_SAHAJA = /^\(\s*n\s*=\s*[0-9][0-9.,\s]*\)$/i;
  const nBaris = b => { const m = RX_N.exec(b); if (!m) return null; const v = parseInt(m[1].replace(/[^0-9]/g, ''), 10); return Number.isFinite(v) ? v : null; };
  const barisKotak = id => String(kotakD()[id] || '').split('\n').map(x => x.trim()).filter(Boolean);
  /* Jumlah sesuatu kotak: angka pada baris label; jika tiada, baris yang hanya mengandungi "(n = N)"; jika tiada, jumlah semua baris. */
  function nilai(id) { const bs = barisKotak(id); if (!bs.length) return null; const n0 = nBaris(bs[0]); if (n0 != null) return n0; const t = bs.find(b => RX_N_SAHAJA.test(b)); if (t) return nBaris(t); const s = bs.map(nBaris).filter(v => v != null); return s.length ? s.reduce((a, v) => a + v, 0) : null; }
  /* Butiran berlabel dalam kotak (pangkalan data, sebab) berserta angkanya. */
  const butir = id => barisKotak(id).slice(1).filter(b => !RX_N_SAHAJA.test(b) && nBaris(b) != null).map(b => ({ t: b.replace(RX_N, '').replace(/[\s:;,]+$/, '').trim(), n: nBaris(b) }));
  const kotakAktif = () => KOTAK.filter(id => data().guna2 || !KOTAK2.has(id));
  /* Angka yang dijangka bagi kotak yang boleh dikira daripada kotak lain; sistem tidak mengisinya, ia hanya dipaparkan sebagai panduan dan semakan. */
  function jangka(id) {
    const v = nilai; const dua = !!data().guna2; const ada = (...ids) => ids.every(x => v(x) != null);
    if (id === 'a2' && ada('a1', 'a1s')) return { n: v('a1') - v('a1s'), cara: `rekod dikenal pasti (${angka(v('a1'))}) tolak rekod dibuang sebelum saringan (${angka(v('a1s'))})` };
    if (id === 'a3' && ada('a2', 'a2s')) return { n: v('a2') - v('a2s'), cara: `rekod disaring (${angka(v('a2'))}) tolak rekod dikecualikan (${angka(v('a2s'))})` };
    if (id === 'a4' && ada('a3', 'a3s')) return { n: v('a3') - v('a3s'), cara: `laporan dicari (${angka(v('a3'))}) tolak laporan tidak diperoleh (${angka(v('a3s'))})` };
    if (id === 'b3' && dua && ada('b1')) return { n: v('b1'), cara: `jumlah rekod kaedah lain (${angka(v('b1'))})` };
    if (id === 'b4' && dua && ada('b3', 'b3s')) return { n: v('b3') - v('b3s'), cara: `laporan dicari (${angka(v('b3'))}) tolak laporan tidak diperoleh (${angka(v('b3s'))})` };
    if (id === 'a5' && ada('a4', 'a4s') && (!dua || ada('b4', 'b4s'))) { const a = v('a4') - v('a4s'); const b = dua ? v('b4') - v('b4s') : 0; return { n: a + b, cara: dua ? `laporan dinilai tolak laporan dikecualikan (${angka(v('a4'))} tolak ${angka(v('a4s'))}), campur kaedah lain (${angka(v('b4'))} tolak ${angka(v('b4s'))})` : `laporan dinilai (${angka(v('a4'))}) tolak laporan dikecualikan (${angka(v('a4s'))})` }; }
    return null;
  }
  function semakKira() {
    const out = [];
    kotakAktif().forEach(id => { const j = jangka(id); const n = nilai(id);
      if (j && j.n < 0) out.push({ id, teks: `${NAMA[id]}: ${j.cara} memberi angka negatif. Semak kotak sebelumnya.` });
      else if (j && n != null && n !== j.n) out.push({ id, teks: `${NAMA[id]}: kotak ini menulis ${angka(n)}, tetapi ${j.cara} ialah ${angka(j.n)}.` });
      if (id === 'a2s' || id === 'a4s' || id === 'b4s') { const tot = barisKotak(id).find(b => RX_N_SAHAJA.test(b)); const pec = butir(id); if (tot && pec.length) { const s = pec.reduce((a, x) => a + x.n, 0); if (s !== nBaris(tot)) out.push({ id, teks: `${NAMA[id]}: jumlah mengikut sebab ialah ${angka(s)}, tetapi jumlah yang ditulis ialah ${angka(nBaris(tot))}.` }); } } });
    return out;
  }
  function meter() {
    const ids = kotakAktif(); const kosong = ids.filter(id => nilai(id) == null); const beza = semakKira(); const butirM = beza.map(x => x.teks);
    if (kosong.length) butirM.push(`Kotak rajah yang belum ada angka: ${kosong.map(id => NAMA[id]).join('; ')}. Klik kotak itu dalam Ruang PRISMA dan tulis angkanya (tulis 0 jika tiada).`);
    let nilaiM = Math.round(70 * (ids.length - kosong.length) / ids.length); if (!beza.length && !kosong.length) nilaiM += 20; else if (!beza.length && kosong.length < ids.length) nilaiM += 10;
    const raj = adaRajah(); if (raj) nilaiM += 10; else if (!kosong.length) butirM.push('Rajah aliran belum disisip ke dalam manuskrip (butang Sisip rajah dalam Ruang PRISMA).');
    const st = beza.length ? 'gagal' : nilaiM >= 90 ? 'ok' : nilaiM >= 45 ? 'amaran' : 'gagal';
    return [{ k: 'prisma', nama: 'PRISMA 2020', nilai: nilaiM, status: st, teks: ringkas(), butir: butirM }];
  }
  function ringkas() { const a = nilai('a1'), b = data().guna2 ? nilai('b1') : null, k = nilai('a5'); const beza = semakKira().length; if (a == null && b == null && k == null) return 'rajah belum diisi'; return `${angka((a || 0) + (b || 0))} rekod dikenal pasti · ${k != null ? angka(k) + ' kajian dimasukkan' : 'kajian dimasukkan belum ditulis'}${beza ? ' · ' + beza + ' perkara perlu disemak' : ''}`; }
  const labelK = r => { if (isi(r.k)) return String(r.k).trim(); const t = KRITERIA_TETAP.find(z => z[0] === r.kunci); return t ? (bahasa() === 'en' ? t[1] : t[2]) : (bahasa() === 'en' ? 'Criterion' : 'Kriteria'); };
  const barisKriteria = () => data().kriteria.filter(r => isi(r.m) || isi(r.x));
  function teksJadual() {
    const rows = barisKriteria(); const nK = bahasa() === 'en' ? 'Table' : 'Jadual'; const adaPang = data().pangkalan.some(x => isi(x.nama));
    const strategi = adaPang ? `\n${nK} ${rows.length ? 2 : 1} (strategi carian dan bilangan rekod mengikut pangkalan data) boleh disisip oleh Prof Dr daripada Ruang PRISMA; jika merujuknya, gunakan nombor itu.` : '';
    if (!rows.length) return '';   // sejak v1.38.0 tiada lagi paparan untuk mengisinya; agen tidak diarah mengisi jadual yang tiada
    return `JADUAL TETAP METODOLOGI (diisi oleh Prof Dr dalam Ruang PRISMA; jika seksyen ini menghuraikan kriteria kelayakan, rujuk jadual dengan nombor ini, selaraskan teks dengan isinya, jangan tambah kriteria yang tiada di dalamnya, dan jangan ulang semua barisnya dalam prosa):\n${nK} 1 (kriteria kelayakan): kriteria | diterima | ditolak\n${rows.map(r => `- ${labelK(r)} | ${String(r.m || '').trim() || 'belum diisi'} | ${String(r.x || '').trim() || 'belum diisi'}`).join('\n')}${strategi}`;
  }
  /* Bahan untuk agen penulisan: teks setiap kotak seperti yang ditulis oleh pemilik. Rekod carian, jadual kriteria dan kaedah saringan yang
     direkodkan sebelum v1.38.0 masih disertakan jika wujud, supaya teks Metodologi kekal setia kepada apa yang benar-benar dibuat. */
  function teksRajah() {
    const ids = kotakAktif(); if (!ids.some(id => nilai(id) != null)) return 'RAJAH ALIRAN PRISMA 2020: kotak rajah belum diisi oleh Prof Dr dalam Ruang PRISMA. Jangan mereka pangkalan data, tarikh, rentetan carian atau angka aliran; gunakan penanda [ISI: ...].';
    const beza = semakKira(); const nA5 = barisKotak('a5').filter(b => nBaris(b) != null).length;
    return `RAJAH ALIRAN PRISMA 2020 (teks setiap kotak ditulis oleh Prof Dr sendiri dalam Ruang PRISMA; ini satu-satunya sumber angka aliran. Laporkan angka tepat seperti dalam kotak. Jangan ubah, jumlahkan semula, anggar atau tambah angka; jika sesuatu angka tiada, gunakan penanda [ISI: ...]):
${ids.map(id => `- ${NAMA[id]}: ${barisKotak(id).join(' | ') || 'kotak kosong'}${nilai(id) == null ? ' [angka belum ditulis]' : ''}`).join('\n')}
Lajur kaedah lain: ${data().guna2 ? 'digunakan' : 'tidak digunakan'}.
${nA5 <= 1 ? 'Kotak akhir hanya menyebut kajian: gunakan istilah "studies" (kajian) sahaja bagi kajian yang dirangkum dan jangan sebut bilangan "reports" secara berasingan.\n' : ''}Semakan kira-kira sistem: ${beza.length ? beza.map(x => x.teks).join(' ') : 'tiada percanggahan.'}`;
  }
  function teksCarianLama() {
    const p = data().pangkalan.filter(x => isi(x.nama) && isi(x.rentetan)); if (!p.length) return '';
    return '\nREKOD CARIAN (direkodkan terdahulu dalam Ruang PRISMA; jika berbeza daripada rajah, angka dalam rajah yang dipakai):\n' + p.map(x => `- ${x.nama} (tarikh carian: ${x.tarikh || 'belum direkodkan'}; rekod: ${isi(x.n) ? num(x.n) : 'belum direkodkan'}; rentetan: ${String(x.rentetan).slice(0, 900)}${larianSah(x) ? '; kaedah larian: dijalankan oleh sistem melalui ' + x.jalan.kaedah : ''}${!isi(x.tarikh) || !isi(x.n) ? '; STATUS: RENTETAN BELUM DIJALANKAN (tiada tarikh carian atau bilangan rekod): jangan tulis sebagai carian yang sudah dibuat' : ''})`).join('\n');
  }
  function teksAgen() { const j = teksJadual(); return teksRajah() + teksCarianLama() + (j ? '\n' + j : '') + Saring.teksAgen(); }

  /* ---- rajah SVG mengikut templat PRISMA 2020 ---- */
  const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* Pembalut baris. "(n = 5)" dikekalkan pada satu baris: ruang di dalamnya diganti dengan ruang tidak boleh pisah, dan baris dipecahkan
     pada ruang biasa sahaja (dahulu \s turut memecahkan ruang tidak boleh pisah, lalu "(n =" dan "5)" terpisah). */
  function balut(t, max) {
    const out = [];
    String(t).split('\n').forEach(baris => { const inden = /^[ \t]+/.test(baris) ? '   ' : ''; let cur = '';
      baris.trim().replace(/\(\s*n\s*=\s*([^)]*)\)/gi, (m, v) => '(n' + NBSP + '=' + NBSP + String(v).trim() + ')').split(/[ \t]+/).forEach(w => { if ((cur + ' ' + w).length > max - inden.length && cur) { out.push(inden + cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
      out.push(inden + cur); });
    return out;
  }
  /* o.sunting: versi dalam halaman (kotak boleh diklik, kotak yang kira-kiranya bercanggah ditanda). Tanpa o: versi bersih untuk PNG dan manuskrip. */
  function svg(lang, o) {
    o = o || {}; const T = kotakD(); const L = D.PRISMA_LABEL[lang] || D.PRISMA_LABEL.ms; const dua = !!data().guna2; const beza = o.sunting ? new Set(semakKira().map(x => x.id)) : null;
    /* v1.45.0: huruf lebih besar (13.5) supaya rajah kekal jelas apabila dikecilkan ke lebar muka surat jurnal */
    const F = 13.5, LH = 18, PAD = 9; const cw = w => Math.floor((w - 2 * PAD) / 6.7);
    const X1 = 58, W1 = 262, XS = 356, WS = 270, X2 = 668, W2 = 168, XS2 = 858, WS2 = 172; const W = dua ? 1042 : 640;
    /* label fasa (tegak) mesti muat dalam jalurnya: baris pertama dan kotak akhir diberi tinggi minimum mengikut panjang label */
    const pj = t => Math.ceil(String(t || '').length * 7.8) + 14;
    const kotak = (id, x, y, w, minH) => { const teks = String(T[id] || ''); const baris = teks.trim() ? balut(teks, cw(w)) : []; const h = Math.max(minH || 0, 2 * LH + 2 * PAD - 3, baris.length * LH + 2 * PAD - 3);
      const isiS = baris.length ? baris.map((b, i) => `<text x="${x + PAD + (/^ {3}/.test(b) ? 12 : 0)}" y="${y + PAD + 10 + i * LH}" font-size="${F}">${xml(b.trim())}</text>`).join('') : (o.sunting ? `<text x="${x + PAD}" y="${y + PAD + 10}" font-size="${F}" fill="#9ca3af" font-style="italic">Klik untuk menulis</text>` : '');
      const ciri = o.sunting ? ` data-kotak="${id}" class="pr-k${beza.has(id) ? ' pr-k-beza' : ''}" tabindex="0" role="button" aria-label="${xml('Sunting kotak: ' + NAMA[id])}"` : '';
      return { x, y, w, h, svg: `<g${ciri}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#ffffff" stroke="#1f2937" stroke-width="1.2"/>${isiS}</g>` }; };
    const anak = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f2937" stroke-width="1.3" marker-end="url(#pa)"/>`;
    const y = 58; let s = '';
    /* baris 1: pengenalpastian */
    const a1 = kotak('a1', X1, y, W1); const a1s = kotak('a1s', XS, y, WS); const b1 = dua ? kotak('b1', X2, y, XS2 + WS2 - X2) : null;
    const r1 = Math.max(a1.h, a1s.h, b1 ? b1.h : 0, pj(L.fasa[0])); s += a1.svg + a1s.svg + (b1 ? b1.svg : '') + anak(X1 + W1, y + a1.h / 2, XS - 2, y + a1.h / 2);
    /* baris 2: disaring */
    const y2 = y + r1 + 34; const a2 = kotak('a2', X1, y2, W1); const a2s = kotak('a2s', XS, y2, WS); const r2 = Math.max(a2.h, a2s.h);
    s += a2.svg + a2s.svg + anak(X1 + W1 / 2, y + a1.h, X1 + W1 / 2, y2 - 2) + anak(X1 + W1, y2 + a2.h / 2, XS - 2, y2 + a2.h / 2);
    /* baris 3: dicari */
    const y3 = y2 + r2 + 34; const a3 = kotak('a3', X1, y3, W1); const a3s = kotak('a3s', XS, y3, WS); const b3 = dua ? kotak('b3', X2, y3, W2) : null; const b3s = dua ? kotak('b3s', XS2, y3, WS2) : null; const r3 = Math.max(a3.h, a3s.h, b3 ? b3.h : 0, b3s ? b3s.h : 0);
    s += a3.svg + a3s.svg + anak(X1 + W1 / 2, y2 + a2.h, X1 + W1 / 2, y3 - 2) + anak(X1 + W1, y3 + a3.h / 2, XS - 2, y3 + a3.h / 2);
    if (dua) s += b3.svg + b3s.svg + anak(X2 + W2 / 2, y + b1.h, X2 + W2 / 2, y3 - 2) + anak(X2 + W2, y3 + b3.h / 2, XS2 - 2, y3 + b3.h / 2);
    /* baris 4: dinilai */
    const y4 = y3 + r3 + 34; const a4 = kotak('a4', X1, y4, W1); const a4s = kotak('a4s', XS, y4, WS); const b4 = dua ? kotak('b4', X2, y4, W2) : null; const b4s = dua ? kotak('b4s', XS2, y4, WS2) : null; const r4 = Math.max(a4.h, a4s.h, b4 ? b4.h : 0, b4s ? b4s.h : 0);
    s += a4.svg + a4s.svg + anak(X1 + W1 / 2, y3 + a3.h, X1 + W1 / 2, y4 - 2) + anak(X1 + W1, y4 + Math.min(a4.h, a4s.h) / 2, XS - 2, y4 + Math.min(a4.h, a4s.h) / 2);
    if (dua) s += b4.svg + b4s.svg + anak(X2 + W2 / 2, y3 + b3.h, X2 + W2 / 2, y4 - 2) + anak(X2 + W2, y4 + Math.min(b4.h, b4s.h) / 2, XS2 - 2, y4 + Math.min(b4.h, b4s.h) / 2);
    /* baris 5: dimasukkan */
    const y5 = y4 + r4 + 40; const a5 = kotak('a5', X1, y5, W1, pj(L.fasa[2])); s += a5.svg + anak(X1 + W1 / 2, y4 + a4.h, X1 + W1 / 2, y5 - 2);
    if (dua) s += `<polyline points="${X2 + W2 / 2},${y4 + b4.h} ${X2 + W2 / 2},${y5 + a5.h / 2} ${X1 + W1 + 3},${y5 + a5.h / 2}" fill="none" stroke="#1f2937" stroke-width="1.3" marker-end="url(#pa)"/>`;
    const H = y5 + a5.h + 34;
    /* kepala lajur dan label fasa: tetap mengikut templat, tidak boleh disunting */
    const kepala = (x, w, t) => `<rect x="${x}" y="12" width="${w}" height="32" rx="3" fill="#f7c948" stroke="#1f2937" stroke-width="1.2"/><text x="${x + w / 2}" y="33" font-size="${F}" font-weight="700" text-anchor="middle">${xml(t)}</text>`;
    const fasa = (ya, yb, t) => `<rect x="12" y="${ya}" width="32" height="${yb - ya}" rx="3" fill="#a9c9ec" stroke="#1f2937" stroke-width="1.2"/><text transform="translate(33 ${(ya + yb) / 2}) rotate(-90)" font-size="${F}" font-weight="700" text-anchor="middle">${xml(t)}</text>`;
    const atas = kepala(X1, XS + WS - X1, L.h1) + (dua ? kepala(X2, XS2 + WS2 - X2, L.h2) : '') + fasa(y, y + r1, L.fasa[0]) + fasa(y2, y4 + r4, L.fasa[1]) + fasa(y5, y5 + a5.h, L.fasa[2]);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif" fill="#111827"><defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f2937"/></marker></defs><rect width="${W}" height="${H}" fill="#ffffff"/>${atas}${s}<text x="${X1}" y="${H - 12}" font-size="10.5" fill="#4b5563">${xml(L.nota)}</text></svg>`;
  }
  function png(lang, skala) {
    return new Promise((res, rej) => { const src = svg(lang); const m = /^<svg[^>]*?viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(src); const w = Math.ceil(+m[1]), h = Math.ceil(+m[2]); const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' })); const im = new Image();
      im.onload = () => { try { const c = document.createElement('canvas'); const z = skala || 2; c.width = w * z; c.height = h * z; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('PNG gagal dijana')), 'image/png'); } catch (e) { URL.revokeObjectURL(url); rej(e); } };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Rajah gagal dilukis')); }; im.src = url; });
  }
  function htmlStrategi() {
    const k = kira(); const e = bahasa() === 'en'; if (!k.adaPang.length) return '';
    return `<p><strong>${e ? 'Table' : 'Jadual'} ${barisKriteria().length ? 2 : 1}</strong></p><p><em>${e ? 'Search Strategy and Number of Records by Database' : 'Strategi Carian dan Bilangan Rekod mengikut Pangkalan Data'}</em></p><table><tbody><tr><th>${e ? 'Database' : 'Pangkalan data'}</th><th>${e ? 'Search date' : 'Tarikh carian'}</th><th>${e ? 'Search string' : 'Rentetan carian'}</th><th>${e ? 'Records' : 'Bilangan rekod'}</th></tr>${k.adaPang.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.tarikh || '')}</td><td>${esc(x.rentetan || '')}</td><td>${isi(x.n) ? angka(num(x.n)) : ''}</td></tr>`).join('')}<tr><td><strong>${e ? 'Total' : 'Jumlah'}</strong></td><td></td><td></td><td><strong>${angka(k.nPang)}</strong></td></tr></tbody></table>`;
  }
  function htmlKriteria() {
    const rows = barisKriteria(); const e = bahasa() === 'en'; if (!rows.length) return '';
    return `<p><strong>${e ? 'Table 1' : 'Jadual 1'}</strong></p><p><em>${e ? 'Inclusion and Exclusion Criteria' : 'Kriteria Penerimaan dan Penolakan'}</em></p><table><tbody><tr><th>${e ? 'Criterion' : 'Kriteria'}</th><th>${e ? 'Inclusion' : 'Penerimaan'}</th><th>${e ? 'Exclusion' : 'Penolakan'}</th></tr>${rows.map(r => `<tr><td>${esc(labelK(r))}</td><td>${esc(String(r.m || '').trim())}</td><td>${esc(String(r.x || '').trim())}</td></tr>`).join('')}</tbody></table>`;
  }
  /* Ayat aliran berangka: rangka fakta untuk diparafrasa oleh pemilik (bukan teks akhir). Setiap angka diambil tepat daripada kotak rajah;
     tiada angka dikira semula, supaya ayat dan rajah sentiasa sama. Kotak tanpa angka menjadi penanda [ISI: ...]. */
  function htmlAyat() {
    const e = bahasa() === 'en'; const dua = !!data().guna2; const v = id => { const n = nilai(id); return n == null ? `[ISI: ${NAMA[id].toLowerCase()}]` : angka(n); };
    if (nilai('a1') == null || nilai('a5') == null) return '';
    const sen = (id, semua) => { const b = butir(id).filter(x => semua || x.n > 0); return b.length ? ' (' + b.map(x => `${x.t}, n = ${angka(x.n)}`).join('; ') + ')' : ''; };
    const t = e
      ? `The search identified ${v('a1')} records${sen('a1', true)}. Before screening, ${v('a1s')} records were removed${sen('a1s')}. A total of ${v('a2')} records were screened by title and abstract, and ${v('a2s')} were excluded${sen('a2s')}. Of the ${v('a3')} reports sought for retrieval, ${v('a3s')} could not be retrieved and ${v('a4')} were assessed for eligibility, of which ${v('a4s')} were excluded${sen('a4s')}.${dua && nilai('b1') ? ` A further ${v('b1')} records were identified through other methods${sen('b1')}; ${v('b4')} reports were assessed for eligibility and ${v('b4s')} were excluded${sen('b4s')}.` : ''} In total, ${v('a5')} studies were included in the review (Figure [n]).`
      : `Carian mengenal pasti ${v('a1')} rekod${sen('a1', true)}. Sebelum saringan, ${v('a1s')} rekod dibuang${sen('a1s')}. Sebanyak ${v('a2')} rekod disaring berdasarkan tajuk dan abstrak, dan ${v('a2s')} dikecualikan${sen('a2s')}. Daripada ${v('a3')} laporan yang dicari, ${v('a3s')} tidak diperoleh dan ${v('a4')} dinilai kelayakannya, dan ${v('a4s')} daripadanya dikecualikan${sen('a4s')}.${dua && nilai('b1') ? ` Sebanyak ${v('b1')} rekod lagi dikenal pasti melalui kaedah lain${sen('b1')}; ${v('b4')} laporan dinilai kelayakannya dan ${v('b4s')} dikecualikan${sen('b4s')}.` : ''} Keseluruhannya, ${v('a5')} kajian dimasukkan dalam ulasan ini (Rajah [n]).`;
    return `<p><strong>[Ruang PRISMA · ayat aliran berangka untuk diparafrasa · ${esc(R.fmtTime(Date.now()))}]</strong></p><p>${esc(t)}</p>`;
  }

  let ELF = null;
  /* ---- paparan (v1.38.0): rajah sahaja; kotak putih disunting terus; pembayang terapung pada setiap kotak ---- */
  const E = { id: null, asal: '', ta: null };   // kotak yang sedang disunting
  const htmlSemakKira = () => { const b = semakKira(); return b.length ? `<div class="pr-semak amaran"><b>Kira-kira rajah belum selaras pada ${b.length} tempat</b><ul>${b.map(x => `<li class="isu">${esc(x.teks)}</li>`).join('')}</ul></div>` : ''; };
  function htmlLama() {
    const adaKrit = barisKriteria().length > 0; const st = Saring.keadaan(); const adaLog = !!(st && st.tarik); if (!adaKrit && !adaLog) return '';
    return `<details class="pr-lama"><summary>Rekod lama Ruang PRISMA</summary><p class="help">Paparan pangkalan data dan rentetan carian, kriteria kelayakan, saringan rekod dan medan angka telah dibuang daripada ruang ini. Data yang pernah direkodkan tidak dipadam. Butang di bawah hanya untuk mengambil data itu.</p><div class="pd-acts">${adaKrit ? '<button class="btn btn-sm" data-pra="kritram">Sisip Jadual kriteria ke RAM</button>' : ''}${adaLog ? '<button class="btn btn-sm" data-pra="csvlama">Muat turun log saringan (CSV)</button>' : ''}</div></details>`;
  }
  function render(el, f) {
    if (!el) return; if (E.ta) { try { kotakD()[E.id] = kemasTeks(E.ta.value, false); } catch (e) { /* abai */ } E.ta = null; E.id = null; } sorokBayang();
    ELF = { el, f }; const d = data(); const lang = bahasa(); kotakD(); const adaStr = d.pangkalan.some(x => isi(x.nama));
    el.innerHTML = `<p class="help">Klik mana-mana kotak putih untuk menulis atau membetulkan teksnya. Letak kursor pada kotak untuk melihat panduan dan cadangan teks. Kotak berwarna ialah label tetap templat PRISMA 2020. Angka dalam rajah ialah rekod carian dan saringan Prof Dr sendiri, maka sistem dan agen tidak mengisinya.</p>
      <div class="pd-acts"><label class="pr-f">Bahasa rajah <select data-pr="bahasa"><option value="ms"${lang === 'ms' ? ' selected' : ''}>Bahasa Melayu</option><option value="en"${lang === 'en' ? ' selected' : ''}>English</option></select></label><label class="pr-tog" title="Papar atau sembunyikan lajur kedua templat: laman web, organisasi, carian sitasi dan kaedah lain"><input type="checkbox" data-pr="guna2"${d.guna2 ? ' checked' : ''}> Lajur kaedah lain</label><button class="btn btn-sm btn-primary" data-pra="rajahram">Sisip rajah ke RAM</button><button class="btn btn-sm" data-pra="rajahasal">Sisip rajah ke ASAL</button><button class="btn btn-sm" data-pra="png">Muat turun PNG</button>${adaStr ? '<button class="btn btn-sm" data-pra="strategi">Sisip jadual strategi carian ke RAM</button>' : ''}<button class="btn btn-sm" data-pra="ayat">Sisip ayat aliran berangka ke RAM</button></div>
      <div id="prSemakKira">${htmlSemakKira()}</div>
      <div id="prRajah" class="pr-rajah pr-sunting"><div class="pr-kanvas">${svg(lang, { sunting: true })}</div></div>
      <div id="prLama">${htmlLama()}</div>`;
    const host = el.querySelector('#prRajah'); const dariKotak = t => (t && t.closest ? t.closest('[data-kotak]') : null);
    /* Dibuka pada mousedown, bukan click: jika editor lain sedang terbuka, penutupannya melukis semula rajah, lalu sasaran click hilang. */
    host.addEventListener('mousedown', e => { const g = dariKotak(e.target); if (g && e.button === 0) { e.preventDefault(); bukaEditor(g.dataset.kotak); } });
    host.addEventListener('click', e => { const g = dariKotak(e.target); if (g) bukaEditor(g.dataset.kotak); });
    host.addEventListener('keydown', e => { const g = dariKotak(e.target); if (g && e.target === g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bukaEditor(g.dataset.kotak); } });
    host.addEventListener('mouseover', e => { const g = dariKotak(e.target); if (g && !E.ta) tunjukBayang(g.dataset.kotak, false); });
    host.addEventListener('mouseout', e => { const g = dariKotak(e.target); if (g && !E.ta && !g.contains(e.relatedTarget)) sorokBayang(); });
    host.addEventListener('focusin', e => { const g = dariKotak(e.target); if (g && e.target === g && !E.ta) tunjukBayang(g.dataset.kotak, false); });
    host.addEventListener('focusout', e => { if (!E.ta && dariKotak(e.target)) sorokBayang(); });
  }
  const segarRing = () => { const g = ELF && ELF.el.closest('details'); const rs = g && g.querySelector('summary .ring'); if (rs) rs.textContent = ringkas(); };
  function segarRajah() { if (!ELF || !ELF.el.isConnected) return; const kv = ELF.el.querySelector('#prRajah .pr-kanvas'); if (kv) kv.innerHTML = svg(bahasa(), { sunting: true }); const sk = ELF.el.querySelector('#prSemakKira'); if (sk) sk.innerHTML = htmlSemakKira(); }
  /* Teks kotak dikemas: tab menjadi tiga ruang, ruang hujung baris dibuang; selepas selesai, baris kosong di awal dan di akhir dibuang. */
  const kemasTeks = (v, hidup) => { let t = String(v == null ? '' : v).replace(/\r/g, '').replace(/\t/g, '   ').split('\n').map(b => b.replace(/\s+$/, '')).join('\n').slice(0, 1500); if (!hidup) t = t.replace(/^\n+/, '').replace(/\n+$/, ''); return t; };
  /* Editor diletakkan tepat di atas kotak yang diklik. Rajah dilukis semula semasa menaip supaya saiz kotak dan anak panah mengikut teks. */
  function letakEditor() {
    if (!E.ta || !ELF || !ELF.el.isConnected) return; const host = ELF.el.querySelector('#prRajah'); const r = host && host.querySelector(`[data-kotak="${E.id}"] rect`); if (!r) return;
    const a = r.getBoundingClientRect(), h = host.getBoundingClientRect(); const skala = a.width / (parseFloat(r.getAttribute('width')) || a.width || 1); const kecil = window.innerWidth < 700; const s = E.ta.style;
    const lebar = Math.min(Math.max(a.width, 230), host.clientWidth - 8); let kiri = a.left - h.left - host.clientLeft + host.scrollLeft; kiri = Math.max(host.scrollLeft + 2, Math.min(kiri, host.scrollLeft + host.clientWidth - lebar - 4));
    s.left = Math.round(kiri) + 'px'; s.top = Math.round(a.top - h.top - host.clientTop + host.scrollTop) + 'px'; s.width = Math.round(lebar) + 'px';
    const fs = kecil ? 16 : Math.max(13, 12.5 * skala); s.fontSize = fs + 'px'; s.lineHeight = Math.round(fs * 1.32) + 'px'; s.padding = Math.max(5, Math.round(7 * skala)) + 'px ' + Math.max(6, Math.round(8 * skala)) + 'px';
    s.height = 'auto'; s.height = Math.max(a.height, E.ta.scrollHeight + 4) + 'px';
  }
  function bukaEditor(id) {
    if (!ELF || !ELF.el.isConnected || !KOTAK.includes(id)) return; if (E.ta && E.id === id) return; tutupEditor(true);
    const host = ELF.el.querySelector('#prRajah'); if (!host) return; const T = kotakD(); const ta = document.createElement('textarea');
    ta.className = 'pr-ed'; ta.value = T[id] || ''; ta.spellcheck = false; ta.dataset.prk = id; ta.setAttribute('aria-label', 'Teks kotak: ' + NAMA[id]);
    host.appendChild(ta); E.id = id; E.asal = T[id] || ''; E.ta = ta; letakEditor(); ta.focus({ preventScroll: true }); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { /* abai */ }
    ta.addEventListener('input', () => { if (E.ta !== ta) return; kotakD()[id] = kemasTeks(ta.value, true); simpanT(); segarRajah(); letakEditor(); tunjukBayang(id, true); });
    ta.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ta.value = E.asal; tutupEditor(true, true); } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); tutupEditor(true, true); } });
    ta.addEventListener('blur', () => { setTimeout(() => { if (E.ta === ta) tutupEditor(true); }, 0); });
    tunjukBayang(id, true);
  }
  function tutupEditor(simpan, fokus) {
    const ta = E.ta; if (!ta) return; const id = E.id; E.ta = null; E.id = null; if (simpan) { kotakD()[id] = kemasTeks(ta.value, false); simpanT(true); } ta.remove(); sorokBayang();
    if (ELF && ELF.el.isConnected) { segarRajah(); segarRing(); X.kemasBar(); if (fokus) { const g = ELF.el.querySelector(`#prRajah [data-kotak="${id}"]`); if (g && g.focus) g.focus({ preventScroll: true }); } }
  }
  /* Pembayang terapung: satu elemen dikongsi, diletakkan di sisi kotak (atau editor) dan tidak pernah terpotong oleh bekas rajah. */
  function elemBayang() { let b = document.getElementById('prBayang'); if (!b) { b = document.createElement('div'); b.id = 'prBayang'; b.className = 'pr-bayang'; b.setAttribute('role', 'tooltip'); b.hidden = true; document.body.appendChild(b);
      b.addEventListener('mousedown', e => { const t = e.target.closest('[data-prguna]'); if (!t || !E.ta) return; e.preventDefault(); E.ta.value = cadanganTeks(E.id); E.ta.dispatchEvent(new Event('input', { bubbles: true })); E.ta.focus(); }); } return b; }
  /* Cadangan teks: templat kotak itu; bagi kotak yang boleh dikira, angka yang dikira daripada kotak lain dimasukkan. */
  function cadanganTeks(id) { const j = jangka(id); const t = templat(bahasa())[id]; return j && j.n >= 0 ? t.replace('(n = )', `(n = ${angka(j.n)})`) : t.replace(/\(n = \)/g, '(n = ...)'); }
  function htmlBayang(id, sunting) {
    const j = jangka(id); const n = nilai(id); const beza = j && n != null && n !== j.n; const kosongEd = sunting && E.ta && !E.ta.value.trim();
    return `<b>${esc(NAMA[id])}</b><p>${esc(PANDUAN[id])}</p>${j ? `<p class="${beza || j.n < 0 ? 'beza' : 'kira'}">Kiraan daripada kotak lain: ${esc(angka(j.n))}, iaitu ${esc(j.cara)}.${beza ? ` Kotak ini menulis ${esc(angka(n))}.` : ''}</p>` : ''}<span class="lbl">Cadangan teks</span><pre>${esc(cadanganTeks(id))}</pre>${kosongEd ? '<button type="button" class="btn btn-sm" data-prguna="1">Guna cadangan teks</button>' : ''}<small>${sunting ? 'Klik di luar kotak untuk menyimpan. Esc untuk batal. Mulakan baris dengan ruang untuk menjorokkannya.' : 'Klik kotak untuk menulis.'}</small>`;
  }
  function tunjukBayang(id, sunting) {
    if (!ELF || !ELF.el.isConnected) return; const g = ELF.el.querySelector(`#prRajah [data-kotak="${id}"]`); if (!g) return; const b = elemBayang();
    b.innerHTML = htmlBayang(id, sunting); b.classList.toggle('sunting', !!sunting); b.dataset.id = id; b.hidden = false;
    const a = (sunting && E.ta ? E.ta : g).getBoundingClientRect(); const bw = b.offsetWidth, bh = b.offsetHeight; const vw = window.innerWidth, vh = window.innerHeight;
    let x = a.right + 10, y = a.top; if (x + bw > vw - 8) x = a.left - bw - 10;
    if (x < 8) { x = Math.max(8, Math.min(a.left, vw - bw - 8)); y = a.bottom + 8; if (y + bh > vh - 8) y = Math.max(8, a.top - bh - 8); } else if (y + bh > vh - 8) y = Math.max(8, vh - bh - 8);
    b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(Math.max(8, y)) + 'px';
  }
  function sorokBayang() { const b = document.getElementById('prBayang'); if (b) b.hidden = true; }
  /* Pembayang tidak boleh tertinggal apabila halaman ditatal, saiz tetingkap berubah, atau panel diganti semasa kursor masih di atas kotak. */
  window.addEventListener('scroll', () => { const b = document.getElementById('prBayang'); if (!b || b.hidden) return; if (E.ta && ELF && ELF.el.isConnected) tunjukBayang(E.id, true); else sorokBayang(); }, true);
  window.addEventListener('resize', () => { if (E.ta && ELF && ELF.el.isConnected) { letakEditor(); tunjukBayang(E.id, true); } else sorokBayang(); });
  document.addEventListener('mouseover', e => { const b = document.getElementById('prBayang'); if (!b || b.hidden || E.ta) return; const t = e.target; if (b.contains(t)) return; const g = t && t.closest ? t.closest('[data-kotak]') : null; if (!g || !ELF || !ELF.el.isConnected || !ELF.el.contains(g)) sorokBayang(); });
  /* v1.44.5: Ruang PRISMA kini dalam folder Dapatan (Results); jadual strategi carian dan kriteria kelayakan tetap milik folder Metodologi. */
  const folderKaedah = () => (X.tulis ? X.tulis() : []).find(g => g.p === 'kaedah') || null;
  /* v1.44.5: html rajah PRISMA (imej berkapsyen) untuk disisip di mana-mana; sid ialah seksyen pemilik imej. */
  async function htmlRajahPrisma(sid) {
    const lang = bahasa(); const blob = await png(lang, 2); const kap = lang === 'en' ? 'PRISMA 2020 flow diagram of the study selection process' : 'Rajah aliran PRISMA 2020 bagi proses pemilihan kajian'; const r = await Teks.simpanImej(blob, { n: A.id, id: sid, nama: kap });
    return `<p><img data-imej="${r.id}" src="${r.dataUrl}" alt="${esc(kap)}"></p><p><em>${lang === 'en' ? 'Figure [n].' : 'Rajah [n].'} ${esc(kap)}. ${lang === 'en' ? 'Adapted from Page et al. (2021).' : 'Diadaptasi daripada Page et al. (2021).'}</em></p>`;
  }
  async function sisipRajahDi(sid) { if (nilai('a1') == null && nilai('a5') == null) throw new Error('Kotak rajah PRISMA belum diisi'); return htmlRajahPrisma(sid); }
  async function sisipRajah(mana) {
    tutupEditor(true); const f = ELF && ELF.f; const sid = f && sasaranRam(f); if (!sid) { toast('Seksyen folder ini tiada', true); return; }
    if (nilai('a1') == null && nilai('a5') == null) { toast('Tulis angka dalam kotak rajah dahulu', true); return; }
    const beza = semakKira(); if (beza.length) { const ok = await R.confirmBox('Kira-kira rajah belum selaras', beza.map(x => x.teks).join(' ') + ' Sisip rajah juga?', 'Sisip juga', false); if (!ok) return; }
    try { const html = await htmlRajahPrisma(sid);
      /* ASAL: disisip terus selepas perenggan yang merujuk rajah aliran (PRISMA, Figure n dengan rekod atau kajian), jika ada; jika tiada, di hujung */
      if (mana === 'asal' && X.sisipSelepasRujukan && X.sisipSelepasRujukan(f, html, 'prisma')) { toast('Rajah aliran PRISMA disisip selepas perenggan yang merujuknya; nombor disusun berturutan. Tambah Page et al. (2021) dalam senarai rujukan.'); X.renderFolder(); return; }
      if (sisip(sid, mana, html)) { toast(`Rajah aliran PRISMA disisip ke ${mana === 'asal' ? 'ASAL' : 'RAM'} seksyen. Tambah Page et al. (2021) dalam senarai rujukan.`); X.renderFolder(); } } catch (e) { toast('Rajah gagal disisip: ' + (e && e.message || e), true); }
  }
  /* ---- larian sebenar oleh sistem (v1.34.0). Tidak terikat kepada mana-mana pangkalan data: setiap entri dipadankan dengan
     "penyambung" mengikut namanya. Pangkalan data yang mempunyai API rasmi terbuka (CORS dibenarkan) dijalankan terus oleh sistem;
     pangkalan data berlangganan atau tanpa API (Scopus, Web of Science, EBSCOhost, MyJurnal dan lain-lain) diisi oleh Prof Dr selepas
     larian di sana. Sistem tidak pernah menganggar atau mereka bilangan rekod: angka datang daripada jawapan API, atau daripada Prof Dr.
     Menambah pangkalan data baharu yang mempunyai API terbuka: tambah satu objek ke dalam PENYAMBUNG. ---- */
  const BULAN_PENUH = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const hariIni = () => { const x = new Date(); return `${x.getDate()} ${BULAN_PENUH[x.getMonth()]} ${x.getFullYear()}`; };
  const normT = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 110);
  const satuBaris = t => String(t || '').replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const ringkasRalat = t => String(typeof t === 'string' ? t : (t && (t.msg || t.message)) || '').split(/\r?\n/)[0].replace(/^[\w.]+(Exception|Error):\s*/, '').slice(0, 200);
  async function ambilJson(url) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 30000); let r;
    try { r = await fetch(url, { signal: ctl.signal, cache: 'no-store' }); } catch (e) { throw { code: 'rangkaian' }; } finally { clearTimeout(tm); }
    let j = null; try { j = await r.json(); } catch (e) { if (r.ok) throw { code: 'jawapan' }; }
    if (!r.ok) throw { code: r.status === 400 || r.status === 403 ? 'sintaks' : 'http', status: r.status, msg: ringkasRalat(j && (j.message || j.error)) };
    return j;
  }
  const tahunDari = o => { const a = parseInt(o && o.dari, 10), b = parseInt(o && o.hingga, 10); return a > 1900 && b > 1900 ? [Math.min(a, b), Math.max(a, b)] : null; };
  const rekod = (id, t, a, y, s, u) => ({ id: String(id || ''), t: String(t || '').replace(/<[^>]+>/g, '').slice(0, 240), a: String(a || '').slice(0, 100), y: String(y || ''), s: String(s || '').slice(0, 90), u: /^https?:\/\//i.test(String(u || '')) ? String(u) : '' });
  const doiDari = u => { const m = /10\.\d{4,9}\/[^\s"<>]+/i.exec(String(u || '')); return m ? m[0].toLowerCase().replace(/[.,;)\]]+$/, '') : ''; };
  /* Rekod penuh bagi Saringan rekod: tambah DOI (untuk membuang pendua) dan abstrak (jika API membekalkannya). */
  const rekodPenuh = (id, t, a, y, s, u, ab, uDoi) => Object.assign(rekod(id, t, a, y, s, u), { d: doiDari(uDoi || u), ab: String(ab || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200) });
  const tigaNama = (a, f) => (Array.isArray(a) ? a : []).slice(0, 3).map(f).filter(Boolean).join('; ');
  const PENYAMBUNG = [
    { id: 'eric', padan: /\beric\b/i, nama: 'ERIC', kaedah: 'API rasmi ERIC', petua: 'ERIC menerima AND, OR, kurungan dan tanda petik; operator pangkalan data lain seperti W/8, TITLE-ABS-KEY atau ? tidak diterima.',
      bina(q, o) { const th = tahunDari(o); const x = []; if (th && !/publicationdateyear\s*:/i.test(q)) x.push(`publicationdateyear:[${th[0]} TO ${th[1]}]`); if (o && o.wasit && !/peerreviewed\s*:/i.test(q)) x.push('peerreviewed:T'); if (o && o.jurnal && !/publicationtype\s*:/i.test(q)) x.push('publicationtype:"Journal Articles"'); return x.length ? `(${q}) AND ${x.join(' AND ')}` : q; },
      async halaman(q, o, mula) { const m = mula || 0; const j = await ambilJson('https://api.ies.ed.gov/eric/?search=' + encodeURIComponent(q) + '&format=json&rows=200&start=' + m + '&fields=id,title,author,source,publicationdateyear,url,description'); if (j && j.error) throw { code: 'sintaks', msg: ringkasRalat(j.error) }; if (!j || !j.response || typeof j.response.numFound !== 'number') throw { code: 'jawapan' }; const ds = j.response.docs || []; return { n: j.response.numFound, docs: ds.map(d => rekodPenuh('eric:' + d.id, d.title, tigaNama([].concat(d.author || []), a => a), d.publicationdateyear, d.source, 'https://eric.ed.gov/?id=' + encodeURIComponent(d.id || ''), d.description, d.url)), seterus: ds.length && m + ds.length < j.response.numFound ? m + ds.length : null }; },
      async tanya(q) { const j = await ambilJson('https://api.ies.ed.gov/eric/?search=' + encodeURIComponent(q) + '&format=json&rows=200&fields=id,title,author,source,publicationdateyear,url'); if (j && j.error) throw { code: 'sintaks', msg: ringkasRalat(j.error) }; if (!j || !j.response || typeof j.response.numFound !== 'number') throw { code: 'jawapan' }; return { n: j.response.numFound, docs: (j.response.docs || []).map(d => rekod(d.id, d.title, tigaNama([].concat(d.author || []), a => a), d.publicationdateyear, d.source, d.url || 'https://eric.ed.gov/?id=' + encodeURIComponent(d.id || ''))) }; } },
    { id: 'openalex', padan: /open\s*alex/i, nama: 'OpenAlex', kaedah: 'API rasmi OpenAlex', petua: 'OpenAlex menerima AND, OR, NOT, kurungan dan tanda petik tanpa simbol pemangkasan; koma tidak dibenarkan dalam ungkapan kerana koma memisahkan penapis.',
      bina(q, o) { let f = q; if (!/(^|,)\s*[a-z_.]*search\s*:/i.test(f)) { if (f.includes(',')) throw { code: 'sintaks', msg: 'buang koma daripada ungkapan carian' }; f = 'title_and_abstract.search:' + f; } const th = tahunDari(o); const x = []; if (th && !/publication_year\s*:/i.test(f)) x.push(`publication_year:${th[0]}-${th[1]}`); if (o && o.jurnal && !/(^|,)\s*type\s*:/i.test(f)) x.push('type:article'); return x.length ? f + ',' + x.join(',') : f; },
      async halaman(f, o, mula) { const m = mula || 0; const p = new URLSearchParams({ filter: f, 'per-page': '200', page: String(Math.floor(m / 200) + 1), select: 'id,doi,title,publication_year,authorships,primary_location,abstract_inverted_index' }); try { const mt = await R.db().getMeta(); if (mt && mt.openalexKey) p.set('api_key', String(mt.openalexKey)); else if (R.C && R.C.ownerEmail) p.set('mailto', R.C.ownerEmail); } catch (e) { /* tanpa kunci */ } const j = await ambilJson('https://api.openalex.org/works?' + p.toString()); if (!j || !j.meta || typeof j.meta.count !== 'number') throw { code: 'jawapan' }; const rs = j.results || []; const abs = inv => { if (!inv || typeof inv !== 'object') return ''; const w = []; Object.keys(inv).forEach(k => (inv[k] || []).forEach(i => { w[i] = k; })); return w.join(' '); }; return { n: j.meta.count, docs: rs.map(w => rekodPenuh('openalex:' + String(w.id || '').split('/').pop(), w.title, tigaNama(w.authorships, a => a && a.author && a.author.display_name), w.publication_year, w.primary_location && w.primary_location.source && w.primary_location.source.display_name, w.doi || w.id, abs(w.abstract_inverted_index), w.doi)), seterus: rs.length && m + rs.length < j.meta.count ? m + rs.length : null }; },
      async tanya(f) { const p = new URLSearchParams({ filter: f, 'per-page': '200', select: 'id,doi,title,publication_year,authorships,primary_location' }); try { const m = await R.db().getMeta(); if (m && m.openalexKey) p.set('api_key', String(m.openalexKey)); else if (R.C && R.C.ownerEmail) p.set('mailto', R.C.ownerEmail); } catch (e) { /* tanpa kunci */ } const j = await ambilJson('https://api.openalex.org/works?' + p.toString()); if (!j || !j.meta || typeof j.meta.count !== 'number') throw { code: 'jawapan' }; return { n: j.meta.count, docs: (j.results || []).map(w => rekod(w.id, w.title, tigaNama(w.authorships, a => a && a.author && a.author.display_name), w.publication_year, w.primary_location && w.primary_location.source && w.primary_location.source.display_name, w.doi || w.id)) }; } },
    { id: 'doaj', padan: /\bdoaj\b/i, nama: 'DOAJ', kaedah: 'API rasmi DOAJ', petua: 'DOAJ menerima AND, OR, kurungan dan tanda petik; medan ditulis seperti bibjson.title:"..." dan tahun seperti bibjson.year:[2022 TO 2026].',
      bina(q, o) { const th = tahunDari(o); return th && !/bibjson\.year\s*:/i.test(q) ? `(${q}) AND bibjson.year:[${th[0]} TO ${th[1]}]` : q; },
      async halaman(q, o, mula) { const m = mula || 0; const j = await ambilJson('https://doaj.org/api/search/articles/' + encodeURIComponent(q) + '?pageSize=100&page=' + (Math.floor(m / 100) + 1)); if (!j || typeof j.total !== 'number') throw { code: 'jawapan' }; const rs = j.results || []; return { n: j.total, docs: rs.map(r => { const b = (r && r.bibjson) || {}; const doi = (b.identifier || []).find(z => z && z.type === 'doi'); return rekodPenuh('doaj:' + r.id, b.title, tigaNama(b.author, a => a && a.name), b.year, b.journal && b.journal.title, doi ? 'https://doi.org/' + doi.id : 'https://doaj.org/article/' + r.id, b.abstract, doi ? doi.id : ''); }), seterus: rs.length && m + rs.length < j.total ? m + rs.length : null }; },
      async tanya(q) { const j = await ambilJson('https://doaj.org/api/search/articles/' + encodeURIComponent(q) + '?pageSize=100'); if (!j || typeof j.total !== 'number') throw { code: 'jawapan' }; return { n: j.total, docs: (j.results || []).map(r => { const b = (r && r.bibjson) || {}; const doi = (b.identifier || []).find(z => z && z.type === 'doi'); return rekod(r.id, b.title, tigaNama(b.author, a => a && a.name), b.year, b.journal && b.journal.title, doi ? 'https://doi.org/' + doi.id : 'https://doaj.org/article/' + r.id); }) }; } },
    { id: 'pubmed', padan: /pub\s*med|medline/i, nama: 'PubMed', kaedah: 'API rasmi NCBI E-utilities (PubMed)', petua: 'PubMed menerima AND, OR, NOT, kurungan, tanda petik dan tag medan seperti [tiab].',
      bina(q, o) { const th = tahunDari(o); const x = []; if (th && !/\[(dp|pdat|date - publication)\]/i.test(q)) x.push(`("${th[0]}"[dp] : "${th[1]}"[dp])`); if (o && o.jurnal && !/\[(pt|publication type)\]/i.test(q)) x.push('journal article[pt]'); return x.length ? `(${q}) AND ${x.join(' AND ')}` : q; },
      async halaman(q, o, mula) { const asas = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'; const m = mula || 0; const j = await ambilJson(asas + 'esearch.fcgi?db=pubmed&retmode=json&retmax=200&retstart=' + m + '&tool=repositori-slr&term=' + encodeURIComponent(q)); const e = j && j.esearchresult; if (!e || e.ERROR) throw { code: 'sintaks', msg: ringkasRalat(e && e.ERROR) }; const n = parseInt(e.count, 10); if (!(n >= 0)) throw { code: 'jawapan' }; const ids = e.idlist || []; let docs = []; if (ids.length) { const sm = await ambilJson(asas + 'esummary.fcgi?db=pubmed&retmode=json&tool=repositori-slr&id=' + ids.join(',')); const hs = (sm && sm.result) || {}; docs = ids.map(id => { const d = hs[id] || {}; const doi = (d.articleids || []).find(z => z && z.idtype === 'doi'); return rekodPenuh('pubmed:' + id, d.title, tigaNama(d.authors, a => a && a.name), String(d.pubdate || '').slice(0, 4), d.source, 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/', '', doi ? doi.value : ''); }); } return { n, docs, seterus: ids.length && m + ids.length < n ? m + ids.length : null }; },
      async tanya(q) { const asas = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'; const j = await ambilJson(asas + 'esearch.fcgi?db=pubmed&retmode=json&retmax=200&tool=repositori-slr&term=' + encodeURIComponent(q)); const e = j && j.esearchresult; if (!e || e.ERROR) throw { code: 'sintaks', msg: ringkasRalat(e && e.ERROR) }; const n = parseInt(e.count, 10); if (!(n >= 0)) throw { code: 'jawapan' }; let docs = []; const ids = e.idlist || []; if (n <= 200 && ids.length) { try { const sm = await ambilJson(asas + 'esummary.fcgi?db=pubmed&retmode=json&tool=repositori-slr&id=' + ids.join(',')); const hs = (sm && sm.result) || {}; docs = ids.map(id => { const d = hs[id] || {}; return rekod(id, d.title, tigaNama(d.authors, a => a && a.name), String(d.pubdate || '').slice(0, 4), d.source, 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/'); }); } catch (er) { docs = []; } } return { n, docs }; } },
    { id: 'europepmc', padan: /europe\s*pmc/i, nama: 'Europe PMC', kaedah: 'API rasmi Europe PMC', petua: 'Europe PMC menerima AND, OR, NOT, kurungan, tanda petik dan medan seperti TITLE:"..." atau ABSTRACT:"...".',
      bina(q, o) { const th = tahunDari(o); return th && !/PUB_YEAR\s*:/i.test(q) ? `(${q}) AND PUB_YEAR:[${th[0]} TO ${th[1]}]` : q; },
      async halaman(q, o, mula) { const j = await ambilJson('https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=' + encodeURIComponent(q) + '&format=json&resultType=core&pageSize=200&cursorMark=' + encodeURIComponent(mula || '*')); if (!j || typeof j.hitCount !== 'number') throw { code: 'jawapan' }; const rs = (j.resultList && j.resultList.result) || []; return { n: j.hitCount, docs: rs.map(r => rekodPenuh('epmc:' + r.id, r.title, r.authorString, r.pubYear, r.journalTitle || (r.journalInfo && r.journalInfo.journal && r.journalInfo.journal.title), r.doi ? 'https://doi.org/' + r.doi : 'https://europepmc.org/article/' + (r.source || 'MED') + '/' + r.id, r.abstractText, r.doi)), seterus: rs.length && j.nextCursorMark && j.nextCursorMark !== (mula || '*') ? j.nextCursorMark : null }; },
      async tanya(q) { const j = await ambilJson('https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=' + encodeURIComponent(q) + '&format=json&resultType=lite&pageSize=200'); if (!j || typeof j.hitCount !== 'number') throw { code: 'jawapan' }; return { n: j.hitCount, docs: ((j.resultList && j.resultList.result) || []).map(r => rekod(r.id, r.title, r.authorString, r.pubYear, r.journalTitle, r.doi ? 'https://doi.org/' + r.doi : 'https://europepmc.org/article/' + (r.source || 'MED') + '/' + r.id)) }; } },
    /* Scopus: Scopus Search API rasmi Elsevier (api.elsevier.com; CORS dibenarkan, disahkan 15 Nov 2026). Sistem hanya boleh mencapainya dengan
       kunci API pengguna sendiri (dev.elsevier.com), dan Elsevier yang menentukan sama ada kunci itu berhak (langganan institusi, rangkaian kampus). */
    { id: 'scopus', padan: /scopus/i, nama: 'Scopus', kaedah: 'API rasmi Scopus (Elsevier)', kunci: 'scopusKey', petua: 'API Scopus menerima sintaks carian lanjutan Scopus (TITLE-ABS-KEY, AND, OR, W/n, PUBYEAR, DOCTYPE, LANGUAGE); LIMIT-TO ialah penapis antara muka web dan tidak diterima.',
      bina(q, o) { if (/LIMIT-TO/i.test(q)) throw { code: 'sintaks', msg: 'LIMIT-TO ialah penapis antara muka web Scopus; tulis had sebagai PUBYEAR, DOCTYPE(ar) dan LANGUAGE(english) dalam rentetan' }; const th = tahunDari(o); const x = []; if (th && !/PUBYEAR/i.test(q)) x.push(`PUBYEAR > ${th[0] - 1} AND PUBYEAR < ${th[1] + 1}`); if (o && o.jurnal && !/DOCTYPE/i.test(q)) x.push('DOCTYPE(ar)'); return x.length ? `(${q}) AND ${x.join(' AND ')}` : q; },
      /* Halaman demi halaman bagi Saringan rekod: mula ialah ofset; saiz halaman 200 dicuba dahulu dan diturunkan kepada 25 jika aras perkhidmatan kunci itu menolaknya. */
      async halaman(q, o, mula) {
        const kunci = String(o && o.kunci || '').trim(); if (!kunci) throw { code: 'kunci' }; const m = mula || 0;
        const minta = async bil => { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 30000); let r; try { r = await fetch('https://api.elsevier.com/content/search/scopus?query=' + encodeURIComponent(q) + '&start=' + m + '&count=' + bil + '&view=STANDARD', { headers: { 'X-ELS-APIKey': kunci, Accept: 'application/json' }, signal: ctl.signal, cache: 'no-store' }); } catch (e) { throw { code: 'rangkaian' }; } finally { clearTimeout(tm); } let j = null; try { j = await r.json(); } catch (e) { j = null; } return { r, j }; };
        const status = j => { const st = j && j['service-error'] && j['service-error'].status; return { kod: String(st && st.statusCode || ''), teks: String(st && st.statusText || '') }; };
        let bil = (o && o.bil) || 200; let { r, j } = await minta(bil);
        if (!r.ok && r.status === 400 && bil > 25 && /maximum number|service level/i.test(status(j).teks)) { bil = 25; ({ r, j } = await minta(25)); }
        if (!r.ok) { const st = status(j); if (r.status === 401 && /AUTHENTICATION/i.test(st.kod)) throw { code: 'kunci' }; if (r.status === 401 || r.status === 403) throw { code: 'hak', msg: ringkasRalat(st.teks) }; if (r.status === 400) throw { code: 'sintaks', msg: ringkasRalat(st.teks) }; throw { code: 'http', status: r.status }; }
        if (o) o.bil = bil; const sr = j && j['search-results']; const n = parseInt(sr && sr['opensearch:totalResults'], 10); if (!(n >= 0)) throw { code: 'jawapan' }; const es = (sr.entry || []).filter(e => e && !e.error);
        return { n, docs: es.map(e => { const lk = (e.link || []).find(z => z && z['@ref'] === 'scopus'); const doi = e['prism:doi'] ? 'https://doi.org/' + e['prism:doi'] : ''; return rekodPenuh('scopus:' + String(e['dc:identifier'] || e.eid || '').replace(/^SCOPUS_ID:/, ''), e['dc:title'], e['dc:creator'], String(e['prism:coverDate'] || '').slice(0, 4), e['prism:publicationName'], (lk && lk['@href']) || doi, '', doi); }), seterus: es.length && m + es.length < n ? m + es.length : null };
      },
      async tanya(q, o) {
        const kunci = String(o && o.kunci || '').trim(); if (!kunci) throw { code: 'kunci' };
        const minta = async bil => { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 30000); let r; try { r = await fetch('https://api.elsevier.com/content/search/scopus?query=' + encodeURIComponent(q) + '&count=' + bil + '&view=STANDARD', { headers: { 'X-ELS-APIKey': kunci, Accept: 'application/json' }, signal: ctl.signal, cache: 'no-store' }); } catch (e) { throw { code: 'rangkaian' }; } finally { clearTimeout(tm); } let j = null; try { j = await r.json(); } catch (e) { j = null; } return { r, j }; };
        const status = j => { const st = j && j['service-error'] && j['service-error'].status; return { kod: String(st && st.statusCode || ''), teks: String(st && st.statusText || '') }; };
        let { r, j } = await minta(200);
        if (!r.ok && r.status === 400 && /maximum number|service level/i.test(status(j).teks)) ({ r, j } = await minta(25));
        if (!r.ok) { const st = status(j); if (r.status === 401 && /AUTHENTICATION/i.test(st.kod)) throw { code: 'kunci' }; if (r.status === 401 || r.status === 403) throw { code: 'hak', msg: ringkasRalat(st.teks) }; if (r.status === 400) throw { code: 'sintaks', msg: ringkasRalat(st.teks) }; throw { code: 'http', status: r.status }; }
        const sr = j && j['search-results']; const n = parseInt(sr && sr['opensearch:totalResults'], 10); if (!(n >= 0)) throw { code: 'jawapan' };
        return { n, docs: (sr.entry || []).filter(e => e && !e.error).map(e => rekod(e['dc:identifier'], e['dc:title'], e['dc:creator'], String(e['prism:coverDate'] || '').slice(0, 4), e['prism:publicationName'], e['prism:doi'] ? 'https://doi.org/' + e['prism:doi'] : '')) };
      } }
  ];
  const penyambung = x => PENYAMBUNG.find(p => p.padan.test(String(x && x.nama || ''))) || null;
  const kunciSimpan = async p => { try { const m = await R.db().getMeta(); return String(m && m[p.kunci] || '').trim(); } catch (e) { return ''; } };
  const larianSah = x => !!(x && x.jalan && isi(x.n) && num(x.n) === x.jalan.n && satuBaris(x.rentetan) === x.jalan.q);
  const mesejLarian = (e, p) => { const nm = p ? p.nama : 'pangkalan data'; return e && e.code === 'sintaks' ? `${nm} tidak dapat membaca rentetan ini${e.msg ? ' (' + e.msg + ')' : ''}. ${p ? p.petua : ''}` : e && e.code === 'http' ? `API ${nm} membalas ralat ${e.status}${e.status === 429 ? ' (terlalu banyak permintaan)' : ''}; cuba sebentar lagi.` : e && e.code === 'rangkaian' ? `API ${nm} tidak dapat dihubungi; semak sambungan internet dan cuba lagi.` : e && e.code === 'kosong' ? 'rentetan kosong.' : e && e.code === 'kunci' ? `kunci API ${nm} tiada atau tidak sah; semak kunci yang ditampal.` : e && e.code === 'hak' ? `Elsevier menolak kunci ini bagi carian ${nm}${e.msg ? ' (' + e.msg + ')' : ''}. Kunci hanya berhak jika institusi melanggan API Scopus; cuba dari rangkaian kampus atau VPN universiti, atau rujuk perpustakaan. Sementara itu, jalankan rentetan di ${nm} dan isi bilangan rekod sendiri.` : `jawapan API ${nm} tidak dapat dibaca; cuba sebentar lagi.`; };
  function padanSumber(docs) {
    const dok = C.doc(); const ids = dok ? C.sumberAda(dok) : []; const set = new Set((docs || []).map(x => normT(x.t)).filter(Boolean));
    const jumpa = ids.filter(id => { const r = R.S.docs.get(id); const t = normT(r && r.tajuk); return !!t && set.has(t); }); return { n: ids.length, k: jumpa.length, ids: jumpa };
  }
  /* Jadual kriteria dianggap sudah ada dalam manuskrip apabila tajuk atau baris kepalanya ditemui dalam ASAL atau RAM seksyen folder ini. */
  function jadualAda() {
    try { const f = ELF && ELF.f; const dok = C.doc(); if (!f || !dok) return false;
      return X.julat(f).some(sid => { const z = dok.seksyen[sid]; if (!z || z.padam) return false; const h = (Teks.htmlSeksyen(z) || '') + (z.ram || ''); return /Inclusion and Exclusion Criteria|Kriteria Penerimaan dan Penolakan/i.test(h) || /<th[^>]*>\s*(?:Inclusion|Penerimaan)\s*<\/th>/i.test(h); });
    } catch (e) { return false; }
  }
  async function klik(e) {
    const b = e.target.closest('[data-pra]'); if (!b || !ELF) return; e.preventDefault(); const a = b.dataset.pra;
    if (a === 'rajahram') sisipRajah('ram'); else if (a === 'rajahasal') sisipRajah('asal');
    else if (a === 'png') { tutupEditor(true); try { const blob = await png(bahasa(), 3); const u = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = u; l.download = 'Rajah_PRISMA_2020.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } catch (er) { toast('PNG gagal dijana: ' + (er && er.message || er), true); } }
    else if (a === 'strategi') { const h = htmlStrategi(); const sid = sasaranRam(folderKaedah() || ELF.f); if (!h) { toast('Tiada rekod pangkalan data untuk dijadualkan', true); return; } if (sid && sisip(sid, 'ram', h)) toast('Jadual strategi carian disisip ke RAM seksyen'); }
    else if (a === 'ayat') { tutupEditor(true); const h = htmlAyat(); const sid = sasaranRam(ELF.f); if (!h) { toast('Tulis angka dalam kotak pertama dan kotak akhir rajah dahulu', true); return; } if (sid && sisip(sid, 'ram', h)) toast('Ayat aliran berangka disisip ke RAM; parafrasa sebelum dipindahkan ke ASAL'); }
    else if (a === 'kritram') { const h = htmlKriteria(); const sid = sasaranRam(folderKaedah() || ELF.f); if (!h) { toast('Tiada baris kriteria yang direkodkan', true); return; } if (!sid) { toast('Seksyen folder ini tiada', true); return; } const sudah = jadualAda(); if (sisip(sid, 'ram', h)) toast(`Jadual kriteria kelayakan disisip ke RAM seksyen sebagai ${bahasa() === 'en' ? 'Table' : 'Jadual'} 1.${sudah ? ' Jadual kriteria yang lama masih ada dalam seksyen ini: buang yang lama.' : ''}`); }
    else if (a === 'csvlama') { if (!Saring.keadaan().n) { toast('Log saringan sedang dimuatkan daripada awan; cuba sebentar lagi', true); return; } Saring.csv(); }
  }
  function input(e) {
    const el = e.target; const m = el.dataset && el.dataset.pr; if (!m || !ELF) return; const d = data();
    if (m === 'guna2') { tutupEditor(true); d.guna2 = !!el.checked; simpanT(true); render(ELF.el, ELF.f); segarRing(); X.kemasBar(); }
    else if (m === 'bahasa') { tutupEditor(true); d.bahasa = el.value === 'en' ? 'en' : 'ms'; kotakD(); simpanT(true); render(ELF.el, ELF.f); }
  }
  const Saring = initSaring(X, { data, isi, num, penyambung, kunciSimpan, satuBaris, hariIni, normT, mesejLarian, padanSumber, labelK, bahasa, namaApi: PENYAMBUNG.map(p => p.nama).join(', '), kriteria: () => data().kriteria, segar: () => {}, segarMedan: () => {}, elf: () => null,
    selepasMuat: () => { const k = ELF && ELF.el.isConnected ? ELF.el.querySelector('#prLama') : null; if (k) k.innerHTML = htmlLama(); } });
  document.addEventListener('click', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target)) klik(e); });
  document.addEventListener('change', e => { if (ELF && ELF.el.isConnected && ELF.el.contains(e.target) && e.target.dataset && (e.target.dataset.pr === 'guna2' || e.target.dataset.pr === 'bahasa')) input(e); });
  return { butir, sisipRajahDi, meter, ringkas, render, teksAgen, kira, svg, png, data, htmlStrategi, htmlAyat, htmlKriteria, Saring, kotak: kotakD, nilai, jangka, semakKira, templat, bukaEditor, tutupEditor, KOTAK, NAMA };
}
