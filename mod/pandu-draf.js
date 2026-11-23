/* v1.45.0: Sub-menu reflektif dan folder Draf Akhir (Pandu Tulis, menu Artikel).
   (1) SUB-MENU: setiap folder dibaca perenggan demi perenggan (ASAL folder dan subseksyennya) dan dipecahkan kepada subseksyen aras 2
       yang tajuknya diambil daripada isi sebenar: konstruk kajian dalam Kajian Literatur, langkah kaedah dalam Metodologi, pemilihan,
       ciri dan tema dalam Dapatan, implikasi dan batasan dalam Perbincangan. Pendahuluan, Abstrak dan Rujukan tidak bersub-menu. Susunan
       perenggan TIDAK diubah; tajuk diletakkan pada sempadan perubahan isi. Apabila sistem tidak pasti, struktur dibiarkan dan seksyen
       ditanda merah dalam senarai seksyen. Pratonton dipaparkan dahulu; setiap perubahan boleh dibatalkan.
   (2) DRAF AKHIR: semua folder dihimpunkan menjadi satu manuskrip mengikut susunan artikel: tajuk seksyen bernombor, setiap jadual dan
       rajah diletakkan selepas perenggan yang mula-mula merujuknya dengan nombor berturutan mengikut sebutan pertama (rajah PRISMA dalam
       Dapatan), label Table/Figure tanpa objek dibuang, dan senarai rujukan APA 7 dijana daripada sitasi.
   (3) SEMAKAN KESEDIAAN HANTARAN (tanpa token): ayat tanpa sitasi, sitasi yang tidak ditemui atau tahunnya salah, et al. dan & mengikut
       APA 7, susunan sitasi berbilang, rujukan APA kosong, penomboran jadual, rajah dan RQ, bahasa manuskrip, label agen tertinggal,
       [ISI: ...], em-dash, seksyen kosong. Pembetulan yang selamat dibuat terus dalam ASAL (boleh dibatalkan). Semakan sitasi oleh agen
       (pilihan, satu panggilan) mencadangkan sumber bagi ayat tanpa sitasi dan menilai sama ada sumber yang disitasi menyokong ayatnya. */

export function initDraf(X) {
  const { R, C, P, Teks, A, esc, toast, angka, patah, bersih, sekarang, idBaru, simpanT, en } = X;
  const $ = R.$;
  const KUNCI = 'drafakhir';

  /* ---------------- utiliti ---------------- */
  const badan = html => new DOMParser().parseFromString('<!doctype html><html><body>' + (html || '') + '</body></html>', 'text/html').body;
  const teksE = e => String((e && e.textContent) || '').replace(/\s+/g, ' ').trim();
  const norm = t => ' ' + bersih(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const adaImej = e => !!(e && e.nodeType === 1 && (e.tagName === 'IMG' || (e.querySelector && e.querySelector('img,svg'))));
  const KECIL = new Set(['and', 'of', 'in', 'the', 'for', 'on', 'to', 'a', 'an', 'with', 'dan', 'dalam', 'di', 'untuk', 'yang', 'bagi', 'serta', 'atau', 'or', 'by', 'as', 'at', 'ke', 'daripada']);
  const hurufTajuk = t => String(t).split(/\s+/).filter(Boolean).map((w, i) => /^[A-Z0-9]{2,}$/.test(w) || /[A-Z].*[A-Z]/.test(w) ? w : (i && KECIL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
  /* pemecah ayat: singkatan lazim (et al., e.g., i.e., Fig., inisial nama, perpuluhan) dilindungi dahulu */
  function pecahAyat(t) {
    const L = String(t || '').replace(/\s+/g, ' ').trim(); if (!L) return [];
    const lindung = L.replace(/\b(et al|e\.g|i\.e|cf|vs|Fig|No|Vol|pp|ed|eds|Dr|Prof|Mr|Ms|Mrs|St|dll|dsb|cth|iaitu|Jan|Feb|Mac|Apr|Jun|Jul|Aug|Ogos|Sep|Sept|Oct|Okt|Nov|Dec|Dis)\./gi, m => m.replace(/\./g, '․'))
      .replace(/\b([A-Z])\.(?=\s*[A-Z][a-z]?\.?)/g, '$1․').replace(/(\d)\.(\d)/g, '$1․$2');
    return lindung.split(/(?<=[.!?])\s+(?=["'“(\[]?[\p{Lu}\d])/u).map(x => x.replace(/․/g, '.').trim()).filter(Boolean);
  }
  const dokumen = () => C.doc();
  const seksyen = id => { const d = dokumen(); const s = d && d.seksyen[id]; return s && !s.padam ? s : null; };
  const htmlS = id => { const s = seksyen(id); return s ? Teks.htmlSeksyen(s) || '' : ''; };
  const nombor = () => Teks.nombor(A.id);
  const asalD = () => { if (!P.t.draf || typeof P.t.draf !== 'object') P.t.draf = { nomborTajuk: true }; return P.t.draf; };
  const tanda = () => { if (!P.t.tandaSub || typeof P.t.tandaSub !== 'object') P.t.tandaSub = {}; return P.t.tandaSub; };

  /* ---------------- (1) SUB-MENU REFLEKTIF ---------------- */
  /* Kategori isi bagi setiap peranan folder: [kunci, tajuk Inggeris, tajuk Bahasa Melayu, kata isyarat (regex, huruf kecil)]. */
  const K = (k, enT, msT, kata) => ({ k, t: [msT, enT], kata });
  const KAEDAH_ULASAN = [
    K('reka', 'Review Design and Protocol', 'Reka Bentuk dan Protokol Ulasan', ['prisma', 'prisma-scr', 'protocol', 'protokol', 'registered', 'didaftar', 'prospero', 'osf', 'arksey', 'levac', 'joanna briggs', 'jbi', 'review design', 'reka bentuk ulasan', 'scoping review followed', 'systematic review followed', 'guideline', 'garis panduan']),
    K('kelayakan', 'Eligibility Criteria', 'Kriteria Kelayakan', ['eligib', 'inclusion', 'exclusion', 'included if', 'excluded if', 'kriteria', 'kelayakan', 'dimasukkan jika', 'dikecualikan', 'pcc', 'pico', 'population', 'concept', 'context']),
    K('carian', 'Information Sources and Search Strategy', 'Sumber Maklumat dan Strategi Carian', ['search', 'searched', 'database', 'scopus', 'eric', 'web of science', 'wos', 'boolean', 'string', 'keyword', 'carian', 'pangkalan data', 'rentetan', 'kata kunci', 'google scholar', 'returned', 'records']),
    K('pemilihan', 'Selection of Sources of Evidence', 'Pemilihan Sumber Bukti', ['screen', 'saring', 'duplicate', 'pendua', 'reviewer', 'penilai', 'title and abstract', 'tajuk dan abstrak', 'full text', 'full-text', 'teks penuh', 'agreement', 'kappa', 'rayyan', 'covidence', 'selection process']),
    K('ekstrak', 'Data Charting and Extraction', 'Pencartaan dan Pengekstrakan Data', ['chart', 'extract', 'ekstrak', 'carta', 'form', 'borang', 'coding', 'pengekodan', 'data items']),
    K('kualiti', 'Quality Appraisal', 'Penilaian Kualiti', ['quality', 'kualiti', 'mmat', 'casp', 'risk of bias', 'risiko bias', 'appraisal', 'penilaian kritis']),
    K('sintesis', 'Synthesis of Results', 'Sintesis Dapatan', ['synthes', 'sintesis', 'thematic', 'tematik', 'narrative', 'naratif', 'braun', 'analysed', 'dianalisis', 'categor', 'kategori'])
  ];
  const KAEDAH_EMP = [
    K('reka', 'Research Design', 'Reka Bentuk Kajian', ['design', 'reka bentuk', 'cross-sectional', 'keratan rentas', 'survey design', 'tinjauan', 'quantitative approach', 'pendekatan kuantitatif', 'qualitative approach', 'pendekatan kualitatif', 'mixed method', 'kaedah campuran']),
    K('sampel', 'Population, Sample and Sampling', 'Populasi, Sampel dan Persampelan', ['population', 'populasi', 'sample', 'sampel', 'sampling', 'persampelan', 'respondent', 'responden', 'participant', 'peserta', 'krejcie', 'g*power', 'stratified', 'berstrata']),
    K('instrumen', 'Instruments', 'Instrumen Kajian', ['instrument', 'instrumen', 'questionnaire', 'soal selidik', 'item', 'scale', 'skala', 'likert', 'adapted', 'diadaptasi', 'interview protocol', 'protokol temu bual']),
    K('prosedur', 'Data Collection Procedure', 'Prosedur Pengumpulan Data', ['procedure', 'prosedur', 'collected', 'dikumpul', 'distributed', 'diedarkan', 'permission', 'kebenaran', 'ethic', 'etika', 'consent', 'persetujuan', 'pilot', 'rintis']),
    K('analisis', 'Data Analysis', 'Analisis Data', ['analys', 'analisis', 'spss', 'amos', 'smartpls', 'pls-sem', 'cb-sem', 'sem', 'regression', 'regresi', 'nvivo', 'atlas.ti', 'thematic', 'tematik', 'descriptive', 'deskriptif'])
  ];
  const DAPATAN_ULASAN = [
    K('pemilihan', 'Selection of Sources of Evidence', 'Pemilihan Sumber Bukti', ['prisma', 'flow diagram', 'rajah aliran', 'records', 'rekod', 'screened', 'disaring', 'duplicates', 'pendua', 'excluded', 'dikecualikan', 'retrieved', 'included after', 'dimasukkan selepas', 'search identified', 'carian mengenal pasti']),
    K('ciri', 'Characteristics of the Included Studies', 'Ciri Kajian yang Dimasukkan', ['characteristic', 'ciri', 'published', 'diterbitkan', 'country', 'countries', 'negara', 'region', 'design', 'reka bentuk', 'distribution', 'taburan', 'year', 'tahun', 'journal', 'jurnal', 'sample size', 'saiz sampel']),
    K('kualiti', 'Quality of the Included Studies', 'Kualiti Kajian yang Dimasukkan', ['quality', 'kualiti', 'mmat', 'casp', 'risk of bias', 'risiko bias', 'appraisal'])
  ];
  const DAPATAN_EMP = [
    K('profil', 'Respondent Profile', 'Profil Responden', ['demograph', 'demografi', 'profile', 'profil', 'gender', 'jantina', 'age', 'umur', 'experience', 'pengalaman', 'respondents were', 'responden terdiri']),
    K('deskriptif', 'Descriptive Statistics', 'Statistik Deskriptif', ['mean', 'min', 'standard deviation', 'sisihan piawai', 'descriptive', 'deskriptif', 'level of', 'tahap']),
    K('pengukuran', 'Measurement Model', 'Model Pengukuran', ['measurement model', 'model pengukuran', 'loading', 'muatan', 'ave', 'composite reliability', 'kebolehpercayaan komposit', 'htmt', 'fornell', 'discriminant', 'diskriminan', 'convergent', 'konvergen', 'cronbach']),
    K('struktur', 'Structural Model and Hypothesis Testing', 'Model Berstruktur dan Ujian Hipotesis', ['structural model', 'model berstruktur', 'hypothes', 'hipotesis', 'path', 'laluan', 'beta', 'β', 'r2', 'r²', 'mediat', 'pengantara', 'supported', 'disokong', 'bootstrap'])
  ];
  const BINCANG = [
    K('teori', 'Theoretical Implications', 'Implikasi Teori', ['theoretical implication', 'implikasi teori', 'contributes to theory', 'menyumbang kepada teori', 'theoretical contribution', 'sumbangan teori', 'extends the theory', 'memperluas teori']),
    K('amalan', 'Practical and Policy Implications', 'Implikasi Amalan dan Dasar', ['implication', 'implikasi', 'practitioner', 'pengamal', 'policy', 'dasar', 'school leaders should', 'pemimpin sekolah perlu', 'should', 'perlu', 'recommend', 'syor']),
    K('batasan', 'Limitations', 'Batasan', ['limitation', 'batasan', 'limited', 'terhad', 'only two databases', 'grey literature', 'bias', 'caution', 'berhati-hati']),
    K('lanjutan', 'Future Research', 'Cadangan Kajian Lanjutan', ['future research', 'future studies', 'kajian lanjutan', 'kajian akan datang', 'further research', 'should test', 'should examine', 'perlu menguji', 'perlu meneliti'])
  ];
  const TEORI = K('teori', 'Theoretical Framework', 'Kerangka Teori', ['theory', 'teori', 'theoretical', 'model', 'framework', 'kerangka', 'lens', 'lensa', 'view of the firm', 'pandangan berasaskan']);
  const JURANG = K('jurang', 'Research Gap', 'Jurang Kajian', ['gap', 'jurang', 'few studies', 'little is known', 'remains unclear', 'under-researched', 'kurang dikaji', 'masih kurang', 'belum dikaji', 'rarely', 'jarang']);
  const ulasanKel = () => ['skop', 'slr', 'meta', 'biblio'].includes(X.kel());
  /* Konstruk: nama dan padanan lain pemboleh ubah. Tajuk sub-menu = varian yang benar-benar muncul dalam teks folder itu. */
  const bahasaFrasa = x => String(x).toLowerCase().split(/[^a-z]+/).filter(Boolean).some(w => /^(?:pe|ke|pem|pen|peng|per|pel)[a-z]{3,}an$/.test(w) || /^(?:guru|sekolah|murid|pelajar|dan|dalam|terhadap|amalan|budaya|prestasi)$/.test(w)) ? 'ms' : 'en';
  function konstruk(teksFolder) {
    const n = norm(teksFolder);
    return (P.t.pemboleh || []).filter(v => v && v.nama).map((v, i) => {
      const varian = [v.nama].concat(String(v.alias || '').split(/[;,]/)).map(x => x.trim()).filter(x => x.length >= 2);
      const kira = varian.map(x => ({ x, n: (n.match(new RegExp(' ' + escRe(norm(x).trim()) + ' ', 'g')) || []).length }));
      const ada = kira.filter(x => x.n > 0).sort((a, b) => (b.x.length > 4) - (a.x.length > 4) || b.x.split(' ').length - a.x.split(' ').length || b.n - a.n);
      const tajuk = ada.length ? hurufTajuk(ada.find(x => x.x.length > 4 && !/^[A-Z]{2,6}$/.test(x.x)) ? ada.find(x => x.x.length > 4 && !/^[A-Z]{2,6}$/.test(x.x)).x : ada[0].x) : v.nama;
      /* tajuk utama: nama konstruk (atau padanan pertamanya) dalam bahasa manuskrip, bukan sub-konsep yang kebetulan muncul */
      const primer = [v.nama, varian[1]].filter(x => x && x.length > 4 && !/^[A-Z]{2,6}$/.test(x)).find(x => bahasaFrasa(x) === (en() ? 'en' : 'ms'));
      if (primer && ada.length) return { k: 'pv' + i, t: [hurufTajuk(primer), hurufTajuk(primer)], kata: varian.map(x => bersih(x)), muncul: true };
      return { k: 'pv' + i, t: [tajuk, tajuk], kata: varian.map(x => bersih(x)), muncul: ada.length > 0 };
    }).filter(x => x.muncul);
  }
  function kategori(f, teksFolder) {
    const kv = konstruk(teksFolder);
    if (f.p === 'literatur') return kv.concat([TEORI, JURANG]);
    if (f.p === 'kaedah') return ulasanKel() ? KAEDAH_ULASAN : KAEDAH_EMP;
    if (f.p === 'dapatan') return ulasanKel() ? DAPATAN_ULASAN.concat(kv) : DAPATAN_EMP;
    if (f.p === 'perbincangan') return BINCANG;
    if (f.p === 'badan' || f.p === 'kerangka') return kv.concat([TEORI]);
    return [];
  }
  const TANPA_SUB = new Set(['abstrak', 'pendahuluan', 'rujukan']);
  /* Blok folder: semua anak elemen ASAL seksyen utama dan subseksyennya mengikut urutan. */
  function blokFolder(f) {
    const ids = X.julat(f); const nb = nombor(); const out = [];
    ids.forEach((sid, j) => { Array.from(badan(htmlS(sid)).children).forEach(e => out.push({ e, sid, j, html: e.outerHTML, teks: teksE(e) })); });
    return { ids, nb, blok: out };
  }
  const blokTeks = b => b.e.tagName !== 'TABLE' && !adaImej(b.e) && b.teks.length > 0;
  const RX_KAP = /^(Tables?|Jadual|Figures?|Rajah)\s+(\d+|\[n\])(?=[\s.:,;)]|$)/i;
  const kapsyen = b => RX_KAP.test(b.teks) && b.teks.length <= 300 && (b.teks.length <= 14 || !!(b.e.querySelector && b.e.querySelector('strong,em,b,i')));
  function skor(teks, kat) {
    const n = norm(teks); const pertama = norm(pecahAyat(teks)[0] || '');
    return kat.map(c => { let s = 0; c.kata.forEach(w => { const re = new RegExp(' ' + escRe(norm(w).trim()), 'g'); s += (n.match(re) || []).length + 2 * (pertama.match(re) || []).length; }); return s; });
  }
  /* Rancangan bagi satu folder: { f, ubah, segmen: [{ kat, mula (indeks blok), tajuk }], tanda: { sid: sebab }, nota } */
  function rancangFolder(f) {
    const B = blokFolder(f); const E = en() ? 1 : 0; const sub = B.ids.slice(1); const subIsi = sub.filter(id => (seksyen(id) || {}).patah > 0);
    const out = { f, ids: B.ids, segmen: [], tanda: {}, nota: '', ubah: false, lama: sub.map(id => (seksyen(id) || {}).tajuk || ''), nPer: 0 };
    const perIdx = B.blok.map((b, i) => blokTeks(b) && !kapsyen(b) ? i : -1).filter(i => i >= 0); out.nPer = perIdx.length;
    if (TANPA_SUB.has(f.p)) { out.ubah = sub.length > 0; out.nota = sub.length ? (subIsi.length ? 'Isi sub-menu digabungkan ke dalam ' + X.tajukF(f) + ' kerana bahagian ini tidak memerlukan sub-menu.' : 'Sub-menu kosong dibuang; bahagian ini tidak memerlukan sub-menu.') : 'Tiada sub-menu (sudah betul).'; return out; }
    if (f.p === 'kesimpulan') { if (sub.length && !subIsi.length) { out.ubah = true; out.nota = 'Sub-menu kosong dibuang; Kesimpulan lazimnya tanpa sub-menu.'; } else if (subIsi.length) { subIsi.forEach(id => { out.tanda[id] = 'Kesimpulan lazimnya tanpa sub-menu. Pertimbangkan untuk menggabungkan sub-menu ini ke dalam Kesimpulan.'; }); out.nota = 'Sub-menu berisi dikekalkan dan ditanda merah untuk pertimbangan Prof Dr.'; } else out.nota = 'Tiada sub-menu (sudah betul).'; return out; }
    const kat = kategori(f, B.blok.map(b => b.teks).join(' '));
    if (!kat.length || perIdx.length < 3) { out.ubah = sub.length > 0 && !subIsi.length; out.nota = perIdx.length < 3 ? (perIdx.length ? 'Terlalu pendek untuk dipecahkan (' + perIdx.length + ' perenggan).' : 'Folder belum berisi.') + (out.ubah ? ' Sub-menu kosong dibuang.' : '') : 'Tiada kategori isi yang dikenali.'; if (!perIdx.length) out.ubah = false; return out; }
    /* kelas setiap perenggan */
    const kelas = perIdx.map(i => { const s = skor(B.blok[i].teks, kat); const m = Math.max(...s); if (m < 2) return { i, k: null, s: m }; const top = s.indexOf(m); const kedua = Math.max(...s.filter((x, q) => q !== top), 0); return { i, k: kedua * 1.4 > m ? null : top, s: m }; });
    /* segmentasi tanpa mengubah susunan: tajuk baharu hanya apabila kategori baharu bermula dan disokong perenggan seterusnya atau skornya kuat */
    const guna = new Set(); let semasa = null; const seg = []; const luar = [];
    kelas.forEach((c, q) => {
      if (c.k == null || c.k === semasa) return; const lepas = kelas[q + 1]; const kuat = c.s >= 4 || (lepas && lepas.k === c.k) || /^(?:theme|tema|rq|sk|research question|persoalan kajian)\s*\d/i.test(B.blok[c.i].teks);
      if (!guna.has(c.k) && kuat) { guna.add(c.k); semasa = c.k; seg.push({ kat: c.k, mula: c.i, n: 0 }); return; }
      if (semasa != null) luar.push({ i: c.i, k: c.k });
    });
    seg.forEach((s, q) => { const akhir = q + 1 < seg.length ? seg[q + 1].mula : B.blok.length; s.n = perIdx.filter(i => i >= s.mula && i < akhir).length; });
    /* gabung kategori Batasan + Kajian Lanjutan yang bersebelahan */
    for (let q = seg.length - 2; q >= 0; q--) { const a = kat[seg[q].kat], b = kat[seg[q + 1].kat]; if (a.k === 'batasan' && b.k === 'lanjutan') { seg[q].gabung = true; seg[q].n += seg[q + 1].n; seg.splice(q + 1, 1); } }
    const nTak = kelas.filter(c => c.k == null).length; const mula0 = seg.length ? perIdx.filter(i => i < seg[0].mula).length : perIdx.length;
    if (seg.length >= 2) {
      out.segmen = seg.map(s => ({ mula: s.mula, n: s.n, tajuk: s.gabung ? (E ? 'Limitations and Future Research' : 'Batasan dan Cadangan Kajian Lanjutan') : kat[s.kat].t[E], kat: kat[s.kat].k }));
      out.ubah = JSON.stringify(out.segmen.map(s => s.tajuk)) !== JSON.stringify(out.lama) || true;
      out.nota = `${out.segmen.length} sub-menu mengikut isi${mula0 ? '; ' + mula0 + ' perenggan pembuka kekal di bawah ' + X.tajukF(f) : ''}.`;
      luar.forEach(x => { out.raguan = (out.raguan || []).concat([`Perenggan ${perIdx.indexOf(x.i) + 1} lebih dekat kepada "${kat[x.k].t[E]}" tetapi berada di bawah sub-menu lain; susunan asal dikekalkan.`]); });
      if (nTak / perIdx.length > 0.5) out.raguan = (out.raguan || []).concat([`${nTak} daripada ${perIdx.length} perenggan tidak jelas kategorinya.`]);
    } else {
      out.ubah = sub.length > 0 && !subIsi.length; const panjang = perIdx.length >= 6 || patah(B.blok.map(b => b.teks).join(' ')) >= 700;
      out.nota = (seg.length === 1 ? 'Isi folder ini berpusat pada satu perkara ("' + kat[seg[0].kat].t[E] + '"); satu sub-menu sahaja tidak wajar (APA: sekurang-kurangnya dua).' : 'Sistem tidak pasti pecahan isi folder ini.') + (out.ubah ? ' Sub-menu kosong dibuang.' : '');
      if (panjang && !subIsi.length) out.tanda[B.ids[0]] = `Seeloknya ada sub-menu di sini (${perIdx.length} perenggan), tetapi sistem tidak pasti tajuknya. Pecahkan mengikut ${f.p === 'literatur' ? 'konstruk' : f.p === 'dapatan' ? 'tema atau persoalan kajian' : 'isi'}, atau tekan "Cadangkan dengan agen".`;
    }
    if (out.raguan && out.raguan.length && out.segmen.length) out.tandaRagu = out.raguan.join(' ');
    /* sub-menu berisi yang sedia ada: semak sama ada tajuknya mencerminkan isinya */
    if (subIsi.length && !out.segmen.length) subIsi.forEach(id => { const s = seksyen(id); const t = teksE(badan(Teks.htmlSeksyen(s))); const sk = skor(t, kat); const m = Math.max(...sk); if (m < 2) return; const k = kat[sk.indexOf(m)]; const tj = norm(s.tajuk); if (!k.kata.some(w => tj.includes(' ' + norm(w).trim())) && !tj.includes(norm(k.t[E]).trim())) out.tanda[id] = `Tajuk "${s.tajuk}" mungkin tidak mencerminkan isinya; isi lebih kepada "${k.t[E]}".`; });
    return out;
  }
  function rancangSemua() { return X.tulis().filter(f => X.sidFolder(f)).map(rancangFolder); }
  /* Terapkan rancangan: blok dipecahkan pada sempadan segmen; id subseksyen sedia ada digunakan semula; yang berlebihan dipadam (RAM-nya disatukan ke RAM seksyen utama). */
  function terapFolder(r, sandaran) {
    const d = dokumen(); const B = blokFolder(r.f); const ids = B.ids; const main = ids[0]; const sub = ids.slice(1);
    ids.forEach(id => { if (!(id in sandaran.seksyen)) sandaran.seksyen[id] = JSON.parse(JSON.stringify(d.seksyen[id])); });
    const html = (a, b) => B.blok.slice(a, b).map(x => x.html).join('');
    if (f0Tanpa(r) || (!r.segmen.length && r.ubah)) {
      /* gabung isi sub-menu ke seksyen utama (atau buang sub-menu kosong) */
      const semua = html(0, B.blok.length); const ram = ids.map(id => (seksyen(id) || {}).ram || '').filter(h => h && h.trim());
      Teks.tulisSeksyen(A.id, main, { html: semua, ram: ram.join('') }, { senyap: true, segera: true });
      sub.forEach(id => Teks.tulisSeksyen(A.id, id, { padam: true }, { senyap: true, segera: true }));
      return { baru: [], padam: sub };
    }
    if (!r.segmen.length) return { baru: [], padam: [] };
    const E = en() ? 1 : 0; const guna = sub.slice(); const baru = []; const susunF = [main]; const now = sekarang();
    Teks.tulisSeksyen(A.id, main, { html: html(0, r.segmen[0].mula) }, { senyap: true, segera: true });
    r.segmen.forEach((s, q) => { const akhir = q + 1 < r.segmen.length ? r.segmen[q + 1].mula : B.blok.length; let id = guna.shift();
      if (!id) { id = idBaru('s'); d.seksyen[id] = { tajuk: s.tajuk, teks: '', cipta: now, masa: now, patah: 0, aras: 2, sumber: { jenis: 'submenu' } }; baru.push(id); }
      Teks.tulisSeksyen(A.id, id, { tajuk: s.tajuk, aras: 2, html: html(s.mula, akhir), padam: false }, { senyap: true, segera: true }); susunF.push(id); });
    /* sub-menu sedia ada yang tidak digunakan: RAM disatukan ke seksyen utama, kemudian dipadam */
    const ramLebih = guna.map(id => (seksyen(id) || {}).ram || '').filter(h => h && h.trim()).join('');
    if (ramLebih) Teks.tulisSeksyen(A.id, main, { ram: ((seksyen(main) || {}).ram || '') + ramLebih }, { senyap: true, segera: true });
    guna.forEach(id => Teks.tulisSeksyen(A.id, id, { padam: true }, { senyap: true, segera: true }));
    /* susunan: julat lama folder digantikan dengan susunan baharu di tempat yang sama */
    const s0 = (d.susunan || []).slice(); const i0 = s0.indexOf(main); const dalam = new Set(ids.concat(baru));
    const lain = s0.filter(id => !dalam.has(id)); const pos = s0.slice(0, i0).filter(id => !dalam.has(id)).length; lain.splice(pos, 0, ...susunF); d.susunan = lain.concat(guna);
    return { baru, padam: guna };
  }
  const f0Tanpa = r => TANPA_SUB.has(r.f.p) && r.ubah;
  const LS_SAND = () => 'rslr_pandu_sub_sandaran_' + A.id;
  function terapSub(rancang, pilih) {
    const d = dokumen(); if (!d) return; Teks.flushEditor(); const sandaran = { masa: sekarang(), susunan: (d.susunan || []).slice(), seksyen: {}, tanda: JSON.parse(JSON.stringify(tanda())), baru: [] };
    let nUbah = 0, nSub = 0; const T = tanda();
    rancang.forEach(r => { r.ids.forEach(id => { delete T[id]; }); if (pilih.has(r.f.k) && r.ubah) { const h = terapFolder(r, sandaran); sandaran.baru = sandaran.baru.concat(h.baru); nUbah++; nSub += r.segmen.length; }
      Object.assign(T, r.tanda); if (r.tandaRagu) { const ids = X.julat(r.f); const id = ids[ids.length - 1]; T[id] = r.tandaRagu; } });
    d.masa = sekarang(); Teks.simpanLokal(A.id, d); const patch = { seksyen: {}, susunan: d.susunan, masa: d.masa }; Object.keys(sandaran.seksyen).concat(sandaran.baru).forEach(id => { if (d.seksyen[id]) patch.seksyen[id] = d.seksyen[id]; }); Teks.simpanAwan(A.id, patch);
    R.lsSet(LS_SAND(), sandaran); simpanT(true); P.cache = {}; Teks.renderSemua(); X.render();
    const nT = Object.keys(T).length;
    toast(`${nUbah ? nUbah + ' folder disusun semula, ' + nSub + ' sub-menu mengikut isi' : 'Tiada folder diubah'}${nT ? '; ' + nT + ' seksyen ditanda merah untuk pertimbangan Prof Dr' : ''}.`, false, nUbah ? { label: 'Batal', fn: () => batalSub() } : null);
  }
  function batalSub() {
    const s = R.lsGet(LS_SAND(), null); const d = dokumen(); if (!s || !d) { toast('Tiada susunan sub-menu untuk dibatalkan', true); return; } Teks.flushEditor();
    Object.keys(s.seksyen).forEach(id => { d.seksyen[id] = Object.assign({}, s.seksyen[id], { masa: sekarang() }); }); (s.baru || []).forEach(id => { if (d.seksyen[id]) d.seksyen[id] = Object.assign({}, d.seksyen[id], { padam: true, masa: sekarang() }); });
    d.susunan = s.susunan; d.masa = sekarang(); Teks.simpanLokal(A.id, d); const patch = { seksyen: {}, susunan: d.susunan, masa: d.masa }; Object.keys(s.seksyen).concat(s.baru || []).forEach(id => { if (d.seksyen[id]) patch.seksyen[id] = d.seksyen[id]; }); Teks.simpanAwan(A.id, patch);
    P.t.tandaSub = s.tanda || {}; simpanT(true); R.lsSet(LS_SAND(), null); P.cache = {}; Teks.renderSemua(); X.render(); toast('Susunan seksyen sebelum sub-menu dipulihkan');
  }
  /* Pratonton sebelum diterapkan: setiap folder dengan sebelum, selepas dan nota; kotak tanda bagi folder yang diubah. */
  async function modalSub(rancang, sumberAgen) {
    const E = en(); const baris = rancang.map(r => { const sid = r.ids[0]; const tj = (seksyen(sid) || {}).tajuk || X.tajukF(r.f);
      const selepas = r.segmen.length ? r.segmen.map(s => `<li>${esc(s.tajuk)} <small>(${s.n} perenggan)</small></li>`).join('') : '';
      const tnd = Object.values(r.tanda).concat(r.tandaRagu ? [r.tandaRagu] : []);
      return `<div class="df-sub-r${r.ubah ? '' : ' tetap'}"><label class="df-sub-h"><input type="checkbox" id="dfsub_${esc(r.f.k)}" data-dfsub="${esc(r.f.k)}"${r.ubah ? ' checked' : ' disabled'}> <b>${esc(tj)}</b></label>
        <div class="df-sub-c"><div><span class="lbl">Kini</span>${r.lama.length ? `<ul>${r.lama.map(t => `<li>${esc(t || 'Tanpa tajuk')}</li>`).join('')}</ul>` : '<p class="help">Tiada sub-menu</p>'}</div><div><span class="lbl">Selepas</span>${selepas ? `<ul>${selepas}</ul>` : `<p class="help">${r.ubah ? 'Tiada sub-menu' : 'Tidak diubah'}</p>`}</div></div>
        <p class="help">${esc(r.nota)}</p>${tnd.length ? `<p class="df-merah">&#9679; ${tnd.map(esc).join('<br>&#9679; ')}</p>` : ''}</div>`; }).join('');
    const ok = await R.richModal(sumberAgen ? 'Sub-menu cadangan agen' : 'Susun sub-menu mengikut isi', `<p>Setiap folder dibaca perenggan demi perenggan. Tajuk sub-menu diambil daripada isi sebenar ASAL (konstruk, langkah kaedah, tema, implikasi dan batasan), dalam ${esc(X.namaBahasa())}. <b>Susunan perenggan tidak diubah</b>; tajuk diletakkan di sempadan perubahan isi. Folder yang tidak pasti dibiarkan dan ditanda <span class="df-merah">merah</span> dalam senarai seksyen.</p>${baris}<p class="help">Boleh dibatalkan selepas diterapkan (butang Batal pada notis, atau "Batalkan sub-menu" dalam folder Draf Akhir).${sumberAgen ? '' : ' Jika tajuk kurang tepat, cuba "Cadangkan dengan agen" (satu panggilan).'}</p>`, 'Terapkan', 'Batal');
    if (!ok) return; const nilai = R.richModal.values || {}; const pilih = new Set(rancang.filter(r => r.ubah && nilai['dfsub_' + r.f.k] !== false).map(r => r.f.k));
    terapSub(rancang, pilih);
  }
  /* Agen (pilihan): segmentasi dan tajuk daripada model, satu panggilan, perenggan dipendekkan. Hasilnya melalui pratonton yang sama. */
  async function agenSub() {
    if (P.busy) return; const t = await R.Isi.tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const fs = X.tulis().filter(f => X.sidFolder(f) && !TANPA_SUB.has(f.p) && f.p !== 'kesimpulan'); const data = fs.map(f => { const B = blokFolder(f); const per = B.blok.map((b, i) => ({ i, b })).filter(x => blokTeks(x.b) && !kapsyen(x.b)); return { f, B, per }; }).filter(x => x.per.length >= 3);
    if (!data.length) { toast('Tiada folder yang cukup panjang untuk dipecahkan kepada sub-menu', true); return; }
    const E = en(); const pendek = s => { const w = s.split(/\s+/); return w.length > 90 ? w.slice(0, 90).join(' ') + ' ...' : s; };
    const tugas = `BAHASA MANUSKRIP: ${E ? 'English' : 'Bahasa Melayu Malaysia'} (SEMUA tajuk mesti dalam bahasa ini).\nKONSTRUK KAJIAN: ${(P.t.pemboleh || []).filter(v => v.nama).map(v => v.nama + (v.alias ? ' (' + v.alias + ')' : '')).join('; ') || '-'}\n${X.teksTeras ? X.teksTeras() : ''}\n\n` + data.map(x => `FOLDER ${x.f.k} (${X.tajukF(x.f)}):\n` + x.per.map((p, q) => `[${q + 1}] ${pendek(p.b.teks)}`).join('\n')).join('\n\n') +
      `\n\nTUGAS: Bagi setiap folder, tentukan sama ada sub-menu (subtajuk aras 2) diperlukan dan di mana. Peraturan: (1) susunan perenggan TIDAK boleh diubah; segmen ialah julat perenggan berturutan; (2) tajuk mesti mencerminkan isi perenggan di bawahnya, ringkas (2 hingga 7 patah), gaya jurnal Scopus, tanpa nombor; Kajian Literatur mengikut konstruk; Dapatan mengikut pemilihan, ciri kajian dan tema; Perbincangan mengikut tafsiran, implikasi dan batasan; (3) jika ada sub-menu, sekurang-kurangnya dua; perenggan pembuka sebelum segmen pertama kekal di bawah tajuk folder; (4) jika tidak pasti, perlu = false dan nyatakan sebab dalam ragu.`;
    const system = 'Anda penyunting kanan jurnal berindeks Scopus dan WoS. Tugas anda menentukan subtajuk manuskrip daripada isi perenggan sahaja. Jangan cipta isi. Pulangkan JSON mengikut skema.';
    const skema = { type: 'object', additionalProperties: false, required: ['folder'], properties: { folder: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['k', 'perlu', 'segmen', 'ragu'], properties: { k: { type: 'string' }, perlu: { type: 'boolean' }, ragu: { type: 'string' }, segmen: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['mula', 'tajuk'], properties: { mula: { type: 'integer' }, tajuk: { type: 'string' } } } } } } } } };
    const anggaran = Math.round((system.length + tugas.length) / 3.6);
    const ok = await R.confirmBox('Cadangkan sub-menu dengan agen?', `Satu panggilan (anggaran ${angka(anggaran)} token masuk; model ${t.model.replace('claude-', '')}). Perenggan ${data.length} folder dihantar dalam bentuk ringkas. Hasilnya dipaparkan sebagai pratonton dahulu; tiada apa-apa diubah tanpa klik Terapkan.`, 'Hantar', false);
    if (!ok) return; P.busy = { mod: 'agensub' }; X.render();
    try {
      const res = await R.Isi.hantar(t, { kunciMod: 'pandu-sub:' + t.model, system, content: [{ type: 'text', text: tugas }], skema, alat: { name: 'pandu_submenu', description: 'Pulangkan hasil mengikut struktur ini.', input_schema: skema }, hadToken: 2400 });
      const j = res.input || R.Isi.parseJson(res.text, res.stop); X.kiraTokenRes(res); simpanT(true);
      const rancang = rancangSemua().map(r => { const x = data.find(y => y.f.k === r.f.k); const a = ((j && j.folder) || []).find(y => y.k === r.f.k); if (!x || !a) return r;
        const seg = (a.perlu ? a.segmen : []).map(s => ({ q: (s.mula | 0) - 1, tajuk: String(s.tajuk || '').replace(/^[\d.\s]+/, '').trim() })).filter(s => x.per[s.q] && s.tajuk).sort((p, q) => p.q - q.q).filter((s, i, arr) => !i || s.q !== arr[i - 1].q);
        const out = Object.assign({}, r, { tanda: {}, tandaRagu: '' });
        if (seg.length >= 2) { out.segmen = seg.map((s, i) => ({ mula: x.per[s.q].i, tajuk: s.tajuk, n: (i + 1 < seg.length ? seg[i + 1].q : x.per.length) - s.q })); out.ubah = true; out.nota = `${seg.length} sub-menu cadangan agen.`; if (a.ragu) out.tandaRagu = a.ragu; }
        else { out.segmen = []; out.ubah = r.lama.length > 0 && !r.ids.slice(1).some(id => (seksyen(id) || {}).patah > 0); out.nota = 'Agen: tiada sub-menu diperlukan.' + (a.ragu ? ' ' + a.ragu : ''); if (a.ragu) out.tanda[r.ids[0]] = 'Agen tidak pasti: ' + a.ragu; }
        return out; });
      P.busy = null; X.render(); await modalSub(rancang, true);
    } catch (e) { toast('Agen gagal: ' + R.Isi.msg(e), true); }
    finally { P.busy = null; X.render(); }
  }
  /* Penanda merah dalam senarai seksyen (Tulisan/Artikel). */
  function tandaSeksyen(n, id) { if (!P.t || n !== A.id || P.id !== A.id) return ''; const s = (P.t.tandaSub || {})[id]; return s ? `<span class="tul-tanda" title="${esc(s)}">&#9679; ${esc(en() ? 'Sub-menu?' : 'Sub-menu?')}</span>` : ''; }

  /* ---------------- (2) DRAF AKHIR: himpunan manuskrip ---------------- */
  const RX_RUJ = /\b(Tables?|Jadual|Figures?|Rajah)(\s+)(\d+|\[n\])(?![\d])/gi;
  const jenisKap = w => /^(table|jadual)/i.test(w) ? 'T' : 'F';
  const RX_RASMI = /PRISMA 2020 flow diagram|Rajah aliran PRISMA 2020/i; const RX_ALIRAN = /PRISMA|flow ?(?:diagram|chart)|flow of (?:the )?(?:study|studies|articles?|records?|literature)|study selection|selection (?:process|flow)|rajah aliran|carta aliran|aliran pemilihan|proses pemilihan|pemilihan (?:kajian|artikel)/i;
  const RX_LABEL_AGEN = /^\s*\[(?!ISI\s*:)[^\]\n]{2,70}\]\s*/i;
  const RX_EKOR_AGEN = /^\s*(SUMBER DIGUNAKAN|SOURCES USED|PENDIRIAN AGEN|AGENT'S STANCE|KEPUTUSAN UNTUK PROF DR|DECISIONS FOR PROF DR|\[Agen Pandu Tulis)\b/i;
  const RX_ISI = /\[ISI\s*:[^\]]*\]/gi;
  /* Pecahkan blok satu seksyen kepada aliran teks dan objek (jadual atau rajah bersama kapsyen, tajuk dan nota). */
  function objekSeksyen(sid, blok) {
    const guna = new Set(); const objek = []; const yatim = [];
    const kap = (j, jenis) => { const e = blok[j]; if (!e || guna.has(j) || e.tagName === 'TABLE' || adaImej(e)) return null; const t = teksE(e); const m = RX_KAP.exec(t); if (!m || jenisKap(m[1]) !== jenis || t.length > 300) return null; return { j, lama: m[2], rest: t.slice(m[0].length).replace(/^\s*[.:\-–]\s*/, '').trim() }; };
    const tajukItalik = j => { const e = blok[j]; if (!e || guna.has(j) || e.tagName === 'TABLE' || adaImej(e)) return null; const t = teksE(e); if (!t || t.length > 220 || RX_KAP.test(t)) return null; const em = e.querySelector && e.querySelector('em,i'); return em && teksE(em) === t ? t : null; };
    blok.forEach((e, i) => {
      const T = e.tagName === 'TABLE'; const F = !T && adaImej(e); if (!T && !F) return; const jenis = T ? 'T' : 'F'; let c = null; const ahli = [i];
      for (const j of (T ? [i - 1, i - 2, i + 1] : [i - 1, i - 2, i + 1, i + 2])) { c = kap(j, jenis); if (c) break; }
      let tajuk = c ? c.rest : ''; if (c) { ahli.push(c.j); if (!tajuk) { const cand = c.j < i ? c.j + 1 : c.j + 1; const tt = cand !== i ? tajukItalik(cand) : null; if (tt) { tajuk = tt; ahli.push(cand); } else { const tt2 = tajukItalik(c.j - 1); if (tt2 && c.j - 1 !== i) { tajuk = tt2; ahli.push(c.j - 1); } } } }
      const nota = blok[Math.max(...ahli) + 1]; if (nota && /^(Note|Nota|Sumber|Source)\s*[.:]/i.test(teksE(nota))) ahli.push(Math.max(...ahli) + 1);
      ahli.forEach(j => guna.add(j)); const im = F ? (e.tagName === 'IMG' ? e : e.querySelector('img')) : null;
      objek.push({ sid, jenis, lama: c ? c.lama : null, tajuk, ahli: ahli.sort((a, b) => a - b), pos: Math.min(...ahli), el: e, nota: ahli.length && blok[ahli[ahli.length - 1]] && /^(Note|Nota|Sumber|Source)\s*[.:]/i.test(teksE(blok[ahli[ahli.length - 1]])) ? blok[ahli[ahli.length - 1]].innerHTML : '', rasmi: !!(im && RX_RASMI.test(im.getAttribute('alt') || '')), prisma: !!(im && RX_RASMI.test(im.getAttribute('alt') || '')) || (F && RX_ALIRAN.test((tajuk || '') + ' ' + ((im && im.getAttribute('alt')) || ''))) });
    });
    blok.forEach((e, i) => { if (guna.has(i) || e.tagName === 'TABLE' || adaImej(e)) return; const t = teksE(e); const m = RX_KAP.exec(t); if (!m) return; const gaya = e.querySelector && e.querySelector('strong,em,b,i'); if (t.length <= 14 || (gaya && teksE(gaya) === t && t.length <= 160)) { yatim.push({ sid, j: i, label: t.slice(0, 80), jenis: jenisKap(m[1]), no: m[2] }); guna.add(i); } });
    return { objek, guna, yatim };
  }
  function susun() {
    const d = dokumen(); if (!d) return null; const E = en(); const nb = nombor(); const fs = X.folders(); const peta = {}; fs.forEach(f => { const sid = X.sidFolder(f); if (sid) X.julat(f).forEach(id => { peta[id] = f; }); });
    const ids = Teks.senarai(A.id); const isu = []; const tambah = (tahap, kat, mesej, o) => isu.push(Object.assign({ tahap, kat, mesej }, o || {}));
    const fRuj = fs.find(f => f.p === 'rujukan'); const fAbs = fs.find(f => f.p === 'abstrak'); const idsRuj = fRuj && X.sidFolder(fRuj) ? new Set(X.julat(fRuj)) : new Set(); const idsAbs = fAbs && X.sidFolder(fAbs) ? new Set(X.julat(fAbs)) : new Set();
    /* nombor tajuk: aras 1 tanpa Abstrak dan Rujukan */
    const c = [0, 0, 0]; let prev = 0; const noTajuk = {};
    ids.forEach(id => { if (idsRuj.has(id) || idsAbs.has(id)) { noTajuk[id] = ''; return; } let a = Math.max(1, Math.min(3, (nb[id] || {}).aras || 1)); if (a > prev + 1) a = prev + 1; c[a - 1]++; for (let k = a; k < 3; k++) c[k] = 0; noTajuk[id] = c.slice(0, a).join('.'); prev = a; });
    const S = ids.map(id => { const s = d.seksyen[id]; const blok = Array.from(badan(Teks.htmlSeksyen(s) || '').children); const f = peta[id] || null; const ob = objekSeksyen(id, blok); return { id, s, f, p: f ? f.p : 'badan', aras: Math.max(1, Math.min(3, (nb[id] || {}).aras || 1)), no: noTajuk[id], tajuk: s.tajuk || '', blok, ob, abs: idsAbs.has(id), ruj: idsRuj.has(id) }; });
    /* objek dan sebutan */
    const objek0 = []; S.forEach(x => x.ob.objek.forEach(o => { o.x = x; objek0.push(o); }));
    /* rajah aliran pendua: hanya SATU rajah PRISMA dikekalkan, iaitu rajah PRISMA 2020 rasmi (yang dalam Dapatan didahulukan); carta aliran bebas atau salinan lain dibuang dalam draf */
    const aliran = objek0.filter(o => o.jenis === 'F' && o.prisma); let simpan = null;
    if (aliran.length > 1) { const rasmi = aliran.filter(o => o.rasmi); simpan = rasmi.find(o => o.x.p === 'dapatan') || rasmi[0] || aliran.find(o => o.x.p === 'dapatan') || aliran[0];
      aliran.filter(o => o !== simpan).forEach(o => { o.pendua = simpan; tambah('kritikal', 'objek', `Rajah aliran pendua dalam ${o.x.tajuk}${o.lama ? ' (' + (E ? 'Figure ' : 'Rajah ') + o.lama + ')' : ''}${o.rasmi ? '' : ', iaitu carta aliran bebas yang bukan format PRISMA 2020 rasmi'}. Hanya satu rajah PRISMA dikekalkan${simpan.rasmi ? ' (rajah PRISMA 2020 rasmi)' : ''}; yang ini dibuang dalam draf.`, { sid: o.x.id, betul: 'pendua' }); }); }
    const objek = objek0.filter(o => !o.pendua); const sebut = [];
    S.forEach((x, si) => { if (x.ruj) return; x.blok.forEach((e, bi) => { if (x.ob.guna.has(bi) || e.tagName === 'TABLE' || adaImej(e)) return; const t = e.textContent || ''; RX_RUJ.lastIndex = 0; let m; while ((m = RX_RUJ.exec(t))) sebut.push({ si, bi, jenis: jenisKap(m[1]), no: m[3], kata: m[1] }); }); });
    const cariObj = (sb) => { const c1 = objek0.filter(o => o.jenis === sb.jenis && o.lama === sb.no); const o = c1.find(z => z.x === S[sb.si]) || c1[0] || null; return o && o.pendua ? o.pendua : o; };
    sebut.forEach(sb => { sb.o = sb.no === '[n]' ? null : cariObj(sb); if (sb.o && !sb.o.pertama) sb.o.pertama = sb; if (sb.o && sb.o.x === S[sb.si] && !sb.o.pertamaRumah) sb.o.pertamaRumah = sb; });
    /* PRISMA: rumah rajah aliran ialah Dapatan bagi artikel ulasan */
    const SDap = S.find(x => x.p === 'dapatan' && x.f && X.sidFolder(x.f) === x.id);
    objek.forEach(o => { o.rumah = o.x; if (o.prisma && SDap && X.adaPrisma() && o.x.p !== 'dapatan') { o.rumah = SDap; tambah('amaran', 'objek', `Rajah PRISMA berada dalam ${o.x.tajuk}; dalam draf ia dipindahkan ke ${SDap.tajuk} (Dapatan).`, { sid: o.x.id, betul: 'objek' }); } });
    /* nombor baharu: mengikut sebutan pertama; objek tanpa sebutan menyusul mengikut kedudukan */
    const kunciP = o => o.pertama ? [o.pertama.si, o.pertama.bi] : [S.indexOf(o.x), o.pos + 0.5];
    ['T', 'F'].forEach(j => { const ls = objek.filter(o => o.jenis === j).sort((a, b) => { const p = kunciP(a), q = kunciP(b); return p[0] - q[0] || p[1] - q[1]; }); ls.forEach((o, i) => { o.baru = i + 1; }); });
    const nama = j => j === 'T' ? (E ? 'Table' : 'Jadual') : (E ? 'Figure' : 'Rajah');
    objek.forEach(o => { const lbl = `${nama(o.jenis)} ${o.baru}`;
      if (!o.lama) tambah('kritikal', 'objek', `${o.jenis === 'T' ? 'Jadual' : 'Rajah'} dalam ${o.x.tajuk} tiada label nombor dan tajuk.`, { sid: o.x.id });
      else if (o.lama === '[n]') tambah('amaran', 'nombor', `${nama(o.jenis)} [n] dalam ${o.x.tajuk} belum bernombor; draf menomborkannya ${lbl}.`, { sid: o.x.id, betul: 'nombor' });
      else if (String(o.baru) !== o.lama) tambah('amaran', 'nombor', `${nama(o.jenis)} ${o.lama} dalam ${o.x.tajuk} dinomborkan semula sebagai ${lbl} mengikut sebutan pertama.`, { sid: o.x.id, betul: 'nombor' });
      if (!o.tajuk) tambah('kritikal', 'objek', `${lbl} tiada tajuk.`, { sid: o.x.id });
      if (!o.pertama) tambah('kritikal', 'objek', `${lbl} ("${(o.tajuk || '').slice(0, 60)}") tidak dirujuk dalam teks. APA 7 mewajibkan setiap jadual dan rajah disebut sebelum ia muncul.`, { sid: o.x.id }); });
    const lihatT = new Set(); sebut.filter(sb => !sb.o).forEach(sb => { const k = sb.jenis + sb.no + ':' + sb.si; if (lihatT.has(k)) return; lihatT.add(k); tambah('kritikal', 'objek', `${sb.kata} ${sb.no} disebut dalam ${S[sb.si].tajuk} tetapi tiada ${sb.jenis === 'T' ? 'jadual' : 'rajah'} sebenar dengan nombor itu.`, { sid: S[sb.si].id, folder: S[sb.si].f ? S[sb.si].f.k : null, betul: 'jana' }); });
    S.forEach(x => x.ob.yatim.forEach(y => tambah('kritikal', 'objek', `Label "${y.label}" dalam ${x.tajuk} tidak disertai ${y.jenis === 'T' ? 'jadual' : 'rajah'}; label ini dibuang dalam draf.`, { sid: x.id, betul: 'yatim' })));
    /* peletakan: selepas perenggan sebutan pertama dalam seksyen rumahnya */
    const RX_PILIH = /records?|rekod|screen|disaring|saringan|included|dimasukkan|identified|dikenal pasti|retrieved|duplicates?|pendua/i;
    const perenggan = (x, uji) => x.blok.findIndex((e, i) => !x.ob.guna.has(i) && e.tagName !== 'TABLE' && !adaImej(e) && teksE(e) && !RX_KAP.test(teksE(e)) && (!uji || uji(teksE(e))));
    objek.forEach(o => { const R0 = o.rumah; const sb = sebut.find(s => s.o === o && S[s.si] === R0); if (sb) { o.letak = { x: R0, bi: sb.bi }; return; }
      if (R0 !== o.x) {
        /* rajah dipindahkan ke Dapatan: cari dalam seksyen utama Dapatan dan sub-menunya; utamakan sebutan, kemudian perenggan tentang pemilihan rekod, kemudian perenggan pertama */
        const C = S.filter(x => x === R0 || (R0.f && x.f === R0.f));
        const sb2 = sebut.find(s => s.o === o && C.includes(S[s.si])); if (sb2) { o.letak = { x: S[sb2.si], bi: sb2.bi }; return; }
        for (const uji of [t => RX_ALIRAN.test(t), t => RX_PILIH.test(t), null]) { const x = C.find(z => perenggan(z, uji) >= 0); if (x) { o.letak = { x, bi: perenggan(x, uji) }; return; } }
        o.letak = { x: R0, bi: -1 }; return; }
      o.letak = { x: R0, bi: o.pos - 1, asal: true }; });
    /* teks: semakan ayat */
    const T = X.teras ? X.teras() : null; const nRq = T ? X.barisTr(T.soalan).length : 0; const nRo = T ? X.barisTr(T.objektif).length : 0;
    const rekodMap = new Map(); X.indeks().forEach(r => rekodMap.set(r.id, r));
    S.forEach(x => { x.per = []; x.blok.forEach((e, bi) => { if (x.ob.guna.has(bi) || e.tagName === 'TABLE' || adaImej(e)) return; const t = teksE(e); if (!t) return;
      if (RX_EKOR_AGEN.test(t)) { tambah('kritikal', 'isi', `Sisa keluaran agen ("${t.slice(0, 50)}...") dalam ${x.tajuk}; dibuang dalam draf.`, { sid: x.id, betul: 'agen' }); x.ob.guna.add(bi); return; }
      x.per.push({ bi, e, t }); }); });
    const adaSubIsi = x => { const i = S.indexOf(x); for (let j = i + 1; j < S.length && S[j].aras > 1; j++) if (S[j].per.length || S[j].ob.objek.length) return true; return false; };
    S.forEach(x => {
      if (x.ruj) return; const peranan = x.p; const kata = x.per.reduce((s, p) => s + patah(p.t), 0); x.kata = kata;
      if (!kata && !x.ob.objek.length && !(x.aras === 1 && adaSubIsi(x))) tambah('kritikal', 'struktur', `${x.aras > 1 ? 'Sub-menu' : 'Seksyen'} "${x.tajuk || 'Tanpa tajuk'}" kosong.`, { sid: x.id, betul: x.aras > 1 ? 'submenu' : null });
      if (!x.abs && x.aras === 1 && x.f && X.sidFolder(x.f) === x.id) { const betulT = x.f.t[E ? 1 : 0]; const D = X.D; const p0 = D.perananTajuk(x.tajuk); if (p0 && x.f.t.indexOf(x.tajuk.replace(/^\s*[\d.]+\s*/, '').trim()) < 0 && bahasaTajuk(x.tajuk) !== (E ? 'en' : 'ms')) tambah('kritikal', 'bahasa', `Tajuk "${x.tajuk}" bukan dalam ${X.namaBahasa()}; sepatutnya "${betulT}".`, { sid: x.id, betul: 'tajuk', nilai: betulT }); }
      else if (x.abs && bahasaTajuk(x.tajuk) && bahasaTajuk(x.tajuk) !== (E ? 'en' : 'ms')) tambah('kritikal', 'bahasa', `Tajuk "${x.tajuk}" bukan dalam ${X.namaBahasa()}; sepatutnya "${E ? 'Abstract' : 'Abstrak'}".`, { sid: x.id, betul: 'tajuk', nilai: E ? 'Abstract' : 'Abstrak' });
      x.per.forEach((p, pi) => {
        p.ayat = pecahAyat(p.t.replace(RX_LABEL_AGEN, '')).map(a => ({ a, isu: [] }));
        if (RX_LABEL_AGEN.test(p.t)) tambah('amaran', 'isi', `Label kerangka agen "${(RX_LABEL_AGEN.exec(p.t) || [''])[0].trim()}" tertinggal di awal perenggan dalam ${x.tajuk}; dibuang dalam draf.`, { sid: x.id, betul: 'label' });
        if (/\*\*[^*]+\*\*/.test(p.t)) tambah('amaran', 'isi', `Tanda Markdown ** tertinggal dalam ${x.tajuk}.`, { sid: x.id, betul: 'label' });
        if (/\s[—–―]\s|[A-Za-z][—―][A-Za-z]/.test(p.t)) tambah('amaran', 'gaya', `Em-dash dalam ${x.tajuk} ("${(p.t.match(/.{0,30}[—–―].{0,30}/) || [''])[0]}"); peraturan gaya Prof Dr melarangnya.`, { sid: x.id, betul: 'sempang' });
        (p.t.match(RX_ISI) || []).forEach(m => tambah('kritikal', 'isi', `Maklumat belum diisi dalam ${x.tajuk}: ${m}`, { sid: x.id }));
        let sitSebelum = false;
        p.ayat.forEach((A0, ai) => {
          const a = A0.a; const sit = X.cariSitasi(a); const adaSit = sit.length > 0 || /\((?:[^()]*?,\s*)?(?:19|20)\d{2}[a-z]?(?:,\s*p+\.\s*\d+)?\)/.test(a);
          /* bahasa ayat */
          const lb = bahasaAyat(a); if (lb && lb !== (E ? 'en' : 'ms')) { A0.isu.push('bahasa'); tambah('kritikal', 'bahasa', `Ayat dalam ${lb === 'ms' ? 'Bahasa Melayu' : 'Bahasa Inggeris'} dalam manuskrip ${X.namaBahasa()} (${x.tajuk}): "${a.slice(0, 90)}${a.length > 90 ? '...' : ''}"`, { sid: x.id, ayat: a }); }
          /* RQ dan RO */
          for (const m of a.matchAll(/\b(RQ|SK|RO|OK)\s?(\d+)\b/g)) { const n = +m[2]; const had = /RQ|SK/.test(m[1]) ? nRq : nRo; if (had && n > had) { A0.isu.push('nombor'); tambah('kritikal', 'nombor', `${m[1]}${n} disebut dalam ${x.tajuk} tetapi hanya ${had} ${/RQ|SK/.test(m[1]) ? 'persoalan' : 'objektif'} kajian ditetapkan dalam panel teras kajian.`, { sid: x.id, ayat: a }); } }
          /* sitasi: kesahan */
          sit.forEach(s => { const r = s.id ? rekodMap.get(s.id) : null;
            if (!s.id) { const lain = X.indeks().filter(q => q.tok.includes(bersih(s.nama.split(/\s|\(/)[0]).replace(/[^a-z]/g, ''))); const satu = lain.length === 1 ? lain[0] : null;
              A0.isu.push('sitasi'); tambah('kritikal', 'sitasi', satu ? `Sitasi ${s.nama} dalam ${x.tajuk}: tahun mungkin salah; rekod yang ada ialah ${satu.nama}.` : `Sitasi ${s.nama} dalam ${x.tajuk} tidak ditemui dalam repositori atau rekod CSV. Sahkan sumber ini wujud, kemudian tambah rekodnya.`, { sid: x.id, ayat: a, betul: satu ? 'tahun' : null, dari: s, ke: satu ? satu.tahun : null }); return; }
            if (r && !r.rujukan) tambah('kritikal', 'sitasi', `${r.nama} disitasi tetapi medan Rujukan APA 7 rekodnya kosong; senarai rujukan tidak lengkap.`, { rekod: r.id, kunci: 'apa:' + r.id });
            const nP = r ? bilPengarang(r) : 0; const bentuk = bentukSitasi(a, s); if (nP && bentuk) { const jangka = nP >= 3 ? 'etal' : nP === 2 ? 'dua' : 'satu'; if (jangka !== bentuk) { A0.isu.push('sitasi'); tambah('amaran', 'sitasi', `${s.nama} dalam ${x.tajuk}: rekod mempunyai ${nP} pengarang, maka APA 7 menulis ${jangka === 'etal' ? '"et al."' : jangka === 'dua' ? 'kedua-dua nama pengarang' : 'satu nama sahaja'}.`, { sid: x.id, ayat: a }); } } });
          /* & dalam sitasi naratif, "and" dalam kurungan */
          if (/\b\p{Lu}[\p{L}'’-]+\s+&\s+\p{Lu}[\p{L}'’-]+\s+\((?:19|20)\d{2}/u.test(a)) { A0.isu.push('sitasi'); tambah('amaran', 'sitasi', `Sitasi naratif menggunakan "&" dalam ${x.tajuk}; APA 7 menulis "${E ? 'and' : 'dan'}" di luar kurungan.`, { sid: x.id, ayat: a, betul: 'dan' }); }
          if (/\([^()]*\b\p{Lu}[\p{L}'’-]+\s+(?:and|dan)\s+\p{Lu}[\p{L}'’-]+,\s*(?:19|20)\d{2}/u.test(a)) { A0.isu.push('sitasi'); tambah('amaran', 'sitasi', `Sitasi dalam kurungan menggunakan "and/dan" dalam ${x.tajuk}; APA 7 menulis "&" dalam kurungan.`, { sid: x.id, ayat: a, betul: 'dan' }); }
          /* sitasi berbilang mengikut abjad */
          for (const m of a.matchAll(/\(([^()]*?(?:19|20)\d{2}[a-z]?[^()]*?;[^()]*?)\)/g)) { const bah = m[1].split(';').map(z => z.trim()); const kunci = bah.map(z => bersih(z.replace(/^(e\.g\.,?|see|lihat|contohnya,?)\s+/i, ''))); const susun2 = kunci.slice().sort((p, q) => p.localeCompare(q)); if (kunci.join('|') !== susun2.join('|')) { A0.isu.push('sitasi'); tambah('amaran', 'sitasi', `Sitasi berbilang tidak mengikut abjad dalam ${x.tajuk}: (${m[1]}).`, { sid: x.id, ayat: a, betul: 'abjad' }); } }
          /* ayat tanpa sitasi */
          const perlu = perluSitasi(peranan, a, x); if (!adaSit && perlu) { const sambung = sitSebelum && /^(This|These|Such|It|They|Their|Its|In this|Hal ini|Ini|Mereka|Keadaan ini|Dapatan ini)\b/.test(a);
            A0.isu.push(sambung ? 'sambung' : 'tanpa'); tambah(sambung ? 'amaran' : 'kritikal', 'tanpasitasi', `${sambung ? 'Ayat bersambung tanpa sitasi' : 'Ayat tanpa sitasi'} (${x.tajuk}): "${a.slice(0, 110)}${a.length > 110 ? '...' : ''}"`, { sid: x.id, ayat: a, peranan }); }
          if (adaSit && x.abs) { A0.isu.push('sitasi'); tambah('amaran', 'sitasi', `Abstrak mengandungi sitasi; abstrak jurnal lazimnya tanpa sitasi.`, { sid: x.id, ayat: a }); }
          sitSebelum = adaSit;
        });
      });
    });
    /* abstrak: panjang */
    const SAbs = S.filter(x => x.abs); if (SAbs.length) { const n = SAbs.reduce((s, x) => s + (x.kata || 0), 0); const [lo, hi] = X.D.ABSTRAK_PATAH; if (n && (n < lo * 0.6 || n > hi)) tambah('amaran', 'struktur', `Abstrak ${n} patah perkataan; lazimnya ${lo} hingga ${hi}.`, { sid: SAbs[0].id }); if (!n) tambah('kritikal', 'struktur', 'Abstrak belum ditulis.', { sid: SAbs[0].id }); }
    else tambah('kritikal', 'struktur', 'Tiada seksyen Abstrak.', {});
    /* angka PRISMA */
    fs.filter(f => ['kaedah', 'dapatan', 'abstrak'].includes(f.p) && X.sidFolder(f)).forEach(f => { const A2 = X.semakAsal(f); (A2.angka || []).forEach(z => tambah('kritikal', 'nombor', `${z.label} dalam ${X.tajukF(f)}: ASAL menulis ${angka(z.tulis)}, Ruang PRISMA ${angka(z.betul)}.`, { sid: z.sid, folder: f.k, betul: 'prisma' })); });
    /* rujukan */
    const dr = fRuj ? X.dataRujukan(fRuj) : { adaApa: [], tiadaApa: [], belum: [], luar: [] };
    (dr.belum || []).forEach(r => tambah('info', 'sitasi', `Artikel sumber belum disitasi di mana-mana: ${r.nama}.`, {}));
    /* nyah pendua isu (kunci sama) */
    const lihat = new Set(); const isu2 = isu.filter(z => { const k = z.kunci || z.tahap + z.mesej; if (lihat.has(k)) return false; lihat.add(k); return true; });
    return { S, objek, sebut, isu: isu2, rujukan: dr.adaApa.map(r => r.rujukan), tiadaApa: dr.tiadaApa, E };
  }
  const MS_K = new Set('yang dan untuk dengan ini dalam kepada bagi oleh adalah tidak telah akan kajian guru sekolah pengurusan pengetahuan daripada merupakan serta iaitu memetakan dalam kalangan di pada sebagai ialah tersebut mereka boleh lebih juga atau'.split(' '));
  const EN_K = new Set('the of and is are was were which that this with for from these those has have been be by an as on to it its their there however'.split(' '));
  function bahasaAyat(a) { const w = bersih(a).replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).filter(Boolean); if (w.length < 6) return null; let m = 0, e = 0; w.forEach(x => { if (MS_K.has(x)) m++; if (EN_K.has(x)) e++; }); if (m >= 3 && m > e * 1.5) return 'ms'; if (e >= 4 && e > m * 2 && m <= 1) return 'en'; return null; }
  const TAJUK_MS = /^(abstrak|pendahuluan|pengenalan|kajian literatur|sorotan literatur|metodologi|kaedah|dapatan|keputusan|perbincangan|kesimpulan|rumusan|rujukan|batasan|implikasi)/i;
  const TAJUK_EN = /^(abstract|introduction|literature review|background|methods?|methodology|results|findings|discussion|conclusions?|references|limitations|implications)/i;
  const bahasaTajuk = t => { const s = String(t || '').replace(/^\s*[\d.]+\s*/, '').trim(); return TAJUK_MS.test(s) ? 'ms' : TAJUK_EN.test(s) ? 'en' : null; };
  function bilPengarang(r) { if (r.csv) { const x = (X.csvAktif() || []).find(q => 'csv:' + q.k === r.id); return x && x.pg ? x.pg.length : 0; }
    const rk = R.Banding ? R.Banding.rekod(r.id) : null; const p = String((rk && rk.penulis) || r.nama || ''); if (/et al/i.test(p)) return 3; const n = (p.match(/\p{Lu}[\p{L}'’-]+,\s*(?:\p{Lu}\.\s*-?\s*)+/gu) || []).length; return n; }
  function bentukSitasi(a, s) { const i = a.indexOf(s.nama.split(' (')[0].split(' ')[0]); const sek = i >= 0 ? a.slice(i, i + 80) : ''; if (/^\S+\s+et\s+al\b/.test(sek)) return 'etal'; if (/^\S+\s*,?\s+(?:&|and|dan)\s+\p{Lu}/u.test(sek)) return 'dua'; if (/^\S+\s*(?:,\s*|\s*\(\s*)(?:19|20)\d{2}/.test(sek)) return 'satu'; return null; }
  const RX_DIRI = /\b(this (review|study|paper|article|scoping review|systematic review|analysis)|the present (review|study)|we\b|our\b|kajian ini|ulasan ini|artikel ini|penyelidik|pengkaji)/i;
  const RX_KAEDAH_NAMA = /\b(PRISMA(?:-ScR)?|PCC|PICO|JBI|Joanna Briggs|Arksey|O['’]Malley|Levac|MMAT|CASP|thematic analysis|analisis tematik|Braun|Cohen['’]s kappa|Krejcie|PLS-SEM|CB-SEM|Fornell|HTMT)\b/i;
  function perluSitasi(peranan, a, x) {
    if (x.abs || /\?$/.test(a) || patah(a) < 7) return false; if (/\b(Tables?|Jadual|Figures?|Rajah)\s+\d/.test(a)) return false;
    if (/\b(RQ|SK|RO|OK)\s?\d|research questions?|review questions?|objective|persoalan kajian|soalan kajian|objektif kajian/i.test(a)) return false;
    if (peranan === 'kaedah') return RX_KAEDAH_NAMA.test(a);
    if (peranan === 'dapatan') return ulasanKel() && /\b(studies|study|articles?|kajian|artikel)\b.*\b(found|reported|showed|measured|indicated|mendapati|melaporkan|menunjukkan|mengukur)\b/i.test(a) && !/\b\d+\s+(studies|kajian|articles|artikel)\b/i.test(a);
    if (['pendahuluan', 'literatur', 'perbincangan', 'badan', 'kerangka'].includes(peranan)) return !RX_DIRI.test(a);
    return false;
  }

  /* HTML draf: objek dikeluarkan daripada aliran dan diletakkan selepas perenggan sebutan pertama; nombor sebutan dikemas kini. */
  function htmlDraf(M, o) {
    o = o || {}; const E = M.E; const tanda = !o.eksport; const nama = j => j === 'T' ? (E ? 'Table' : 'Jadual') : (E ? 'Figure' : 'Rajah'); const D0 = asalD();
    const letak = new Map(); M.objek.forEach(ob => { const k = ob.letak.x.id + ':' + ob.letak.bi; if (!letak.has(k)) letak.set(k, []); letak.get(k).push(ob); });
    const htmlObj = ob => { const kap = `<p class="df-kap"><strong>${nama(ob.jenis)} ${ob.baru}</strong></p><p class="df-kap-t"><em>${esc(ob.tajuk || (tanda ? '[tajuk belum ada]' : ''))}</em></p>`; const el = ob.el.cloneNode(true); return `<div class="df-objek">${kap}${el.outerHTML}${ob.nota ? `<p class="df-nota">${ob.nota}</p>` : ''}</div>`; };
    const petaNo = sb => sb.o ? String(sb.o.baru) : null; let out = '';
    const d = dokumen(); out += `<h1 class="df-judul">${esc(d.tajuk || '')}</h1>`;
    M.S.forEach(x => {
      if (x.ruj) return; const no = D0.nomborTajuk !== false && x.no ? x.no + (x.aras === 1 ? '.' : '') + ' ' : ''; const tg = x.abs ? 'h2' : 'h' + Math.min(4, x.aras + 1);
      out += `<${tg} class="df-h${x.aras}${tanda && P.t.tandaSub && P.t.tandaSub[x.id] ? ' df-tanda' : ''}"${tanda && P.t.tandaSub && P.t.tandaSub[x.id] ? ` title="${esc(P.t.tandaSub[x.id])}"` : ''}>${esc(no + x.tajuk.replace(/^\s*[\d.]+\s+/, ''))}</${tg}>`;
      if (tanda && P.t.tandaSub && P.t.tandaSub[x.id]) out += `<p class="df-merah-nota">&#9679; ${esc(P.t.tandaSub[x.id])}</p>`;
      const awal = letak.get(x.id + ':-1') || []; awal.forEach(ob => { out += htmlObj(ob); });
      x.blok.forEach((e, bi) => {
        if (!x.ob.guna.has(bi) && e.tagName !== 'TABLE' && !adaImej(e)) {
          const el = e.cloneNode(true); const per = x.per.find(p => p.bi === bi);
          /* buang label agen dan tanda Markdown; nombor sebutan */
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode); let pertama = true; let k = 0; const sbBlok = M.sebut.filter(s => M.S[s.si] === x && s.bi === bi);
          nodes.forEach(nd => { let t = nd.nodeValue; if (pertama && t.trim()) { t = t.replace(RX_LABEL_AGEN, ''); pertama = false; } t = t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+[—–―]\s+/g, ', ');
            t = t.replace(RX_RUJ, (m0, w1, sp, no2) => { const sb = sbBlok[k++]; const b = sb ? petaNo(sb) : null; return b ? w1 + sp + b : (tanda ? `\u0001${m0}\u0002` : m0); }); nd.nodeValue = t; });
          let h = el.outerHTML; if (tanda) h = h.replace(/\u0001([^\u0002]*)\u0002/g, '<mark class="df-x" title="Tiada objek dengan nombor ini">$1</mark>');
          if (tanda && per) h = tandaAyat(h, per); out += h;
        }
        (letak.get(x.id + ':' + bi) || []).forEach(ob => { out += htmlObj(ob); });
      });
    });
    const tj = E ? 'References' : 'Rujukan'; out += `<h2 class="df-h1">${tj}</h2>`;
    out += M.rujukan.length ? M.rujukan.map(r => `<p class="df-ruj">${esc(r)}</p>`).join('') : `<p class="help">Belum ada sitasi yang dikenali.</p>`;
    return out;
  }
  /* serlah ayat bermasalah (pratonton sahaja) */
  function tandaAyat(h, per) {
    let out = h; per.ayat.forEach(A0 => { if (!A0.isu.length) return; const kelas = A0.isu.includes('tanpa') || A0.isu.includes('bahasa') || A0.isu.includes('nombor') ? 'df-m' : A0.isu.includes('sitasi') ? 'df-k' : 'df-k'; const hujung = A0.a.slice(-Math.min(40, A0.a.length)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); const i = out.indexOf(hujung); if (i < 0) return; out = out.slice(0, i + hujung.length) + `<sup class="${kelas}" title="${esc(A0.isu.map(z => ({ tanpa: 'Ayat tanpa sitasi', sambung: 'Ayat bersambung tanpa sitasi', sitasi: 'Masalah sitasi', bahasa: 'Bahasa lain', nombor: 'Penomboran' }[z] || z)).join(', '))}">&#9679;</sup>` + out.slice(i + hujung.length); });
    return out;
  }

  /* ---------------- (3) PEMBETULAN DALAM ASAL (boleh dibatalkan) ---------------- */
  function tulisSek(sid, html, sandaran) { const s = seksyen(sid); if (!s) return; if (!(sid in sandaran)) sandaran[sid] = Teks.htmlSeksyen(s) || ''; Teks.tulisSeksyen(A.id, sid, { html }, { senyap: true, segera: true }); }
  function ubahTeks(sid, fn, sandaran) { const h = htmlS(sid); const b = badan(h); const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode); let ubah = 0; nodes.forEach((nd, i) => { const t = fn(nd.nodeValue, nd, i); if (t !== nd.nodeValue) { nd.nodeValue = t; ubah++; } }); if (ubah) tulisSek(sid, b.innerHTML, sandaran); return ubah; }
  function betul(jenis, M, sandaran, sasaran) {
    let n = 0; const E = M.E; const isu = sasaran ? [sasaran] : M.isu.filter(z => z.betul === jenis);
    if (jenis === 'label' || jenis === 'agen' || jenis === 'sempang') {
      const sids = new Set(isu.map(z => z.sid).filter(Boolean));
      sids.forEach(sid => { if (jenis === 'agen') { const b = badan(htmlS(sid)); let u = 0; Array.from(b.children).forEach(e => { if (RX_EKOR_AGEN.test(teksE(e))) { e.remove(); u++; } }); if (u) { tulisSek(sid, b.innerHTML, sandaran); n += u; } return; }
        const b = badan(htmlS(sid)); let u = 0; Array.from(b.children).forEach(e => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let pertama = true; while (w.nextNode()) { const nd = w.currentNode; let t = nd.nodeValue; if (jenis === 'label') { if (pertama && t.trim()) { t = t.replace(RX_LABEL_AGEN, ''); pertama = false; } t = t.replace(/\*\*([^*]+)\*\*/g, '$1'); } else t = t.replace(/\s+[—–―]\s+/g, ', ').replace(/([A-Za-z])[—―]([A-Za-z])/g, '$1, $2'); if (t !== nd.nodeValue) { nd.nodeValue = t; u++; } } }); if (u) { tulisSek(sid, b.innerHTML, sandaran); n += u; } });
    } else if (jenis === 'abjad') {
      new Set(isu.map(z => z.sid)).forEach(sid => { n += ubahTeks(sid, t => t.replace(/\(([^()]*?(?:19|20)\d{2}[a-z]?[^()]*?;[^()]*?)\)/g, (m0, isi) => { const bah = isi.split(';').map(z => z.trim()); const awalan = /^(e\.g\.,?|see|lihat|contohnya,?)\s+/i.exec(bah[0]); if (awalan) bah[0] = bah[0].slice(awalan[0].length); const s2 = bah.slice().sort((p, q) => bersih(p).localeCompare(bersih(q))); return '(' + (awalan ? awalan[0] : '') + s2.join('; ') + ')'; }), sandaran); });
    } else if (jenis === 'dan') {
      new Set(isu.map(z => z.sid)).forEach(sid => { n += ubahTeks(sid, t => t.replace(/\b(\p{Lu}[\p{L}'’-]+)\s+&\s+(\p{Lu}[\p{L}'’-]+)(\s+\((?:19|20)\d{2})/gu, `$1 ${E ? 'and' : 'dan'} $2$3`).replace(/(\([^()]*\b\p{Lu}[\p{L}'’-]+)\s+(?:and|dan)\s+(\p{Lu}[\p{L}'’-]+,\s*(?:19|20)\d{2})/gu, '$1 & $2'), sandaran); });
    } else if (jenis === 'tahun') {
      isu.forEach(z => { if (!z.ke || !z.dari) return; const nm = z.dari.nama.split(' (')[0].split(' ')[0]; n += ubahTeks(z.sid, t => t.replace(new RegExp('(' + escRe(nm) + '[^()]{0,40}?(?:\\(|,\\s*))' + z.dari.tahun + '(?![\\d])', 'g'), '$1' + z.ke), sandaran); });
    } else if (jenis === 'tajuk') {
      isu.forEach(z => { const s = seksyen(z.sid); if (!s || !z.nilai) return; sandaran['__tajuk:' + z.sid] = s.tajuk; Teks.tulisSeksyen(A.id, z.sid, { tajuk: z.nilai }, { senyap: true, segera: true }); n++; });
    } else if (jenis === 'yatim') {
      const sids = new Set(isu.map(z => z.sid)); sids.forEach(sid => { const b = badan(htmlS(sid)); const blok = Array.from(b.children); const ob = objekSeksyen(sid, blok); if (!ob.yatim.length) return; ob.yatim.map(y => y.j).sort((p, q) => q - p).forEach(j => blok[j].remove()); tulisSek(sid, b.innerHTML, sandaran); n += ob.yatim.length; });
    } else if (jenis === 'pendua') {
      const sids = new Set(isu.map(z => z.sid)); sids.forEach(sid => { const b = badan(htmlS(sid)); const blok = Array.from(b.children); const x = M.S.find(y => y.id === sid); if (!x) return; const buang = new Set(); x.ob.objek.filter(o => o.pendua).forEach(o => o.ahli.forEach(j => buang.add(j))); if (!buang.size) return; Array.from(buang).sort((p, q) => q - p).forEach(j => blok[j] && blok[j].remove()); tulisSek(sid, b.innerHTML, sandaran); n += 1; });
    } else if (jenis === 'nombor' || jenis === 'objek') {
      n += betulObjek(M, sandaran);
    } else if (jenis === 'prisma') {
      new Set(isu.map(z => z.folder)).forEach(k => { if (k) X.semakAngka(k); n++; });
    }
    return n;
  }
  /* Nombor objek mengikut sebutan pertama (kapsyen dan rujukan dalam teks) dan peletakan selepas perenggan sebutan pertama dalam seksyen rumahnya. */
  function betulObjek(M, sandaran) {
    const E = M.E; let n = 0; const ubahS = new Map(); const ambil = x => { if (!ubahS.has(x.id)) ubahS.set(x.id, { x, blok: x.blok.map(e => e.cloneNode(true)) }); return ubahS.get(x.id); };
    /* (a) nombor: kapsyen dan sebutan diganti mengikut peta lama -> baru */
    M.objek.forEach(ob => { if (!ob.lama || String(ob.baru) === ob.lama) return; const U = ambil(ob.x); const cap = ob.ahli.map(j => U.blok[j]).find(e => e && RX_KAP.test(teksE(e))); if (!cap) return; const w = document.createTreeWalker(cap, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const nd = w.currentNode; const t = nd.nodeValue.replace(/\b(Tables?|Jadual|Figures?|Rajah)(\s+)(\d+|\[n\])/i, (m0, a, sp) => a + sp + ob.baru); if (t !== nd.nodeValue) { nd.nodeValue = t; n++; break; } } });
    const ikut = new Map(); M.sebut.forEach(sb => { const k = sb.si + ':' + sb.bi; if (!ikut.has(k)) ikut.set(k, []); ikut.get(k).push(sb); });
    ikut.forEach((ls, k) => { const [si, bi] = k.split(':').map(Number); const x = M.S[si]; if (!ls.some(sb => sb.o && String(sb.o.baru) !== sb.no)) return; const U = ambil(x); const e = U.blok[bi]; let q = 0; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode); nodes.forEach(nd => { nd.nodeValue = nd.nodeValue.replace(RX_RUJ, (m0, w1, sp, no) => { const sb = ls[q++]; if (sb && sb.o && String(sb.o.baru) !== no) { n++; return w1 + sp + sb.o.baru; } return m0; }); }); });
    /* (b) peletakan: objek yang bukan di tempat sebutan pertama dipindahkan */
    const pindah = M.objek.filter(ob => !ob.letak.asal && !(ob.letak.x === ob.x && ob.letak.bi === ob.pos - 1) && !(ob.letak.x === ob.x && ob.ahli.every(j => j > ob.letak.bi) && !ob.x.blok.slice(ob.letak.bi + 1, ob.pos).some((e, i) => teksE(e) && !ob.x.ob.guna.has(ob.letak.bi + 1 + i))));
    pindah.forEach(ob => { const Ua = ambil(ob.x); const Ub = ambil(ob.letak.x); const nod = ob.ahli.map(j => Ua.blok[j]); ob._nod = nod; });
    pindah.forEach(ob => { const Ub = ambil(ob.letak.x); const sas = ob.letak.bi >= 0 ? Ub.blok[ob.letak.bi] : null; const frag = ob._nod.map(e => { const p = e.parentNode; if (p) p.removeChild(e); return e; });
      /* nod mungkin belum berada dalam badan (salinan baharu): nod diletakkan semula selepas perenggan sasaran */
      ob._frag = frag; ob._sas = sas; n++; });
    /* bina semula setiap seksyen yang berubah */
    ubahS.forEach(U => { const b = document.createElement('div'); U.blok.forEach(e => { if (!pindah.some(ob => ob._nod && ob._nod.includes(e))) b.appendChild(e); pindah.filter(ob => ob._sas === e).forEach(ob => ob._frag.forEach(z => b.appendChild(z))); });
      pindah.filter(ob => ob.letak.x === U.x && !ob._sas).forEach(ob => { const tmp = document.createElement('div'); ob._frag.forEach(z => tmp.appendChild(z)); b.insertBefore(tmp, b.firstChild); tmp.replaceWith(...Array.from(tmp.childNodes)); });
      tulisSek(U.x.id, b.innerHTML, sandaran); });
    return n;
  }
  function batalBetul() { const s = P.sandaranDraf; if (!s) { toast('Tiada pembetulan untuk dibatalkan', true); return; } Teks.flushEditor(); Object.keys(s).forEach(k => { if (k.startsWith('__tajuk:')) Teks.tulisSeksyen(A.id, k.slice(8), { tajuk: s[k] }, { senyap: true, segera: true }); else Teks.tulisSeksyen(A.id, k, { html: s[k] }, { senyap: true, segera: true }); }); P.sandaranDraf = null; P.cache = {}; Teks.renderSemua(); X.render(); toast('ASAL sebelum pembetulan dipulihkan'); }
  const LABEL_BETUL = { label: 'Buang label agen dan tanda **', agen: 'Buang sisa keluaran agen', sempang: 'Ganti em-dash', abjad: 'Susun sitasi berbilang mengikut abjad', dan: 'Betulkan & dan "and" dalam sitasi', tahun: 'Betulkan tahun sitasi', tajuk: 'Betulkan bahasa tajuk', yatim: 'Buang label jadual/rajah tanpa objek', nombor: 'Susun nombor dan letak jadual/rajah selepas sebutan pertama', objek: 'Susun nombor dan letak jadual/rajah selepas sebutan pertama', prisma: 'Betulkan angka PRISMA', pendua: 'Buang rajah aliran pendua' };
  function betulSemua(jenisList) {
    const M = susun(); if (!M) return; Teks.flushEditor(); const sandaran = {}; let n = 0; const done = new Set();
    const urut = ['agen', 'label', 'sempang', 'pendua', 'yatim', 'tajuk', 'tahun', 'abjad', 'dan', 'prisma', 'nombor', 'objek']; jenisList = jenisList.slice().sort((p, q) => urut.indexOf(p) - urut.indexOf(q));
    for (const j of jenisList) { const jj = j === 'objek' ? 'nombor' : j; if (done.has(jj)) continue; done.add(jj); const M2 = susun(); n += betul(j, M2, sandaran); }
    P.sandaranDraf = Object.assign({}, sandaran); P.cache = {}; Teks.renderSemua(); X.render();
    toast(n ? `${n} pembetulan dibuat terus dalam ASAL. Draf dihimpun semula.` : 'Tiada apa-apa untuk dibetulkan secara automatik.', false, n ? { label: 'Batal', fn: () => batalBetul() } : null);
  }

  /* ---------------- (4) SEMAKAN SITASI OLEH AGEN (pilihan) ---------------- */
  async function agenSitasi() {
    if (P.busy) return; const t = await R.Isi.tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const M = susun(); const tanpa = M.isu.filter(z => z.kat === 'tanpasitasi').slice(0, 60); const disitasi = []; const rekodMap = new Map(); X.indeks().forEach(r => rekodMap.set(r.id, r));
    M.S.forEach(x => (x.per || []).forEach(p => (p.ayat || []).forEach(A0 => { const s = X.cariSitasi(A0.a).filter(z => z.id); if (s.length && disitasi.length < 80) disitasi.push({ sid: x.id, a: A0.a, ids: s.map(z => z.id) }); })));
    if (!tanpa.length && !disitasi.length) { toast('Tiada ayat untuk disemak', true); return; }
    const guna = new Set(); disitasi.forEach(z => z.ids.forEach(i => guna.add(i))); const ix = X.indeks().filter(r => r.dalam); ix.forEach(r => guna.add(r.id));
    const ringkas = id => { const r = rekodMap.get(id); if (!r) return ''; if (r.csv) { const c = (X.csvAktif() || []).find(q => 'csv:' + q.k === id); return `${r.nama}: ${c ? (c.t || '') + '. ' + String(c.ab || '').slice(0, 420) : ''}`; } const rk = R.Banding.rekod(id) || {}; return `${r.nama}: ${rk.tajuk || ''}. Objektif: ${String(rk.objektif || '').slice(0, 200)} Dapatan: ${String(rk.dapatan || '').slice(0, 320)} Konstruk: ${String(rk.konstruk || '').slice(0, 120)}`; };
    const senarai = Array.from(guna).map((id, i) => `[S${i + 1}] ${ringkas(id)}`); const kod = new Map(Array.from(guna).map((id, i) => ['S' + (i + 1), id]));
    const tugas = `SUMBER (hanya ini yang boleh dicadangkan):\n${senarai.join('\n')}\n\nA. AYAT TANPA SITASI:\n${tanpa.map((z, i) => `[A${i + 1}] ${z.ayat}`).join('\n') || '-'}\n\nB. AYAT BERSITASI (nilai sama ada sumber yang disitasi menyokong ayat):\n${disitasi.map((z, i) => `[B${i + 1}] ${z.a}  {disitasi: ${z.ids.map(id => (rekodMap.get(id) || {}).nama).join('; ')}}`).join('\n') || '-'}\n\nTUGAS: (1) Bagi setiap ayat A, cadangkan kod sumber S yang benar-benar menyokong dakwaannya berdasarkan ringkasan sumber; jika tiada, sumber = [] dan beri saranan ringkas (contohnya lembutkan dakwaan, buang, atau cari sumber luar). (2) Bagi setiap ayat B, status: sokong, separa atau tidak, dengan ulasan satu ayat. Jangan reka sumber. Tulis ulasan dalam Bahasa Melayu mudah.`;
    const system = 'Anda penyemak sitasi jurnal berindeks Scopus dan WoS yang teliti. Nilai hanya berdasarkan ringkasan sumber yang diberi. Pulangkan JSON mengikut skema.';
    const skema = { type: 'object', additionalProperties: false, required: ['tanpa', 'semak'], properties: { tanpa: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['a', 'sumber', 'saranan'], properties: { a: { type: 'string' }, sumber: { type: 'array', items: { type: 'string' } }, saranan: { type: 'string' } } } }, semak: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['b', 'status', 'ulasan'], properties: { b: { type: 'string' }, status: { type: 'string', enum: ['sokong', 'separa', 'tidak'] }, ulasan: { type: 'string' } } } } } };
    const anggaran = Math.round((system.length + tugas.length) / 3.6);
    const ok = await R.confirmBox('Semakan sitasi oleh agen?', `Satu panggilan (anggaran ${angka(anggaran)} token masuk; model ${t.model.replace('claude-', '')}): ${tanpa.length} ayat tanpa sitasi dan ${disitasi.length} ayat bersitasi, dengan ringkasan ${guna.size} sumber. Agen hanya boleh mencadangkan sumber daripada senarai Prof Dr; sitasi disisip ke ASAL hanya selepas Prof Dr klik.`, 'Hantar', false);
    if (!ok) return; P.busy = { mod: 'agensitasi' }; X.render();
    try {
      const res = await R.Isi.hantar(t, { kunciMod: 'pandu-sitasi:' + t.model, system, content: [{ type: 'text', text: tugas }], skema, alat: { name: 'pandu_sitasi', description: 'Pulangkan hasil mengikut struktur ini.', input_schema: skema }, hadToken: 5000 });
      const j = res.input || R.Isi.parseJson(res.text, res.stop); X.kiraTokenRes(res);
      const D0 = asalD(); D0.agen = { masa: sekarang(), tanpa: (j.tanpa || []).map(z => { const i = parseInt(String(z.a).replace(/\D/g, ''), 10) - 1; const s = tanpa[i]; return s ? { sid: s.sid, ayat: s.ayat, sumber: (z.sumber || []).map(k => kod.get(String(k).replace(/[^S\d]/g, ''))).filter(Boolean), saranan: z.saranan || '' } : null; }).filter(Boolean),
        semak: (j.semak || []).map(z => { const i = parseInt(String(z.b).replace(/\D/g, ''), 10) - 1; const s = disitasi[i]; return s ? { sid: s.sid, ayat: s.a, status: z.status, ulasan: z.ulasan || '' } : null; }).filter(x => x && x.status !== 'sokong') };
      simpanT(true); toast(`Semakan sitasi siap: ${D0.agen.tanpa.filter(z => z.sumber.length).length} cadangan sumber, ${D0.agen.semak.length} sitasi perlu diteliti.`);
    } catch (e) { toast('Agen gagal: ' + R.Isi.msg(e), true); }
    finally { P.busy = null; X.render(); }
  }
  /* Sisip sitasi di hujung ayat dalam ASAL (sebelum tanda noktah). */
  function sisipSitasi(sid, ayat, ids) {
    const rekodMap = new Map(); X.indeks().forEach(r => rekodMap.set(r.id, r)); const nama = ids.map(id => rekodMap.get(id)).filter(Boolean).map(r => { const m = /^(.*)\s\((\d{4}[a-z]?|t\.t\.)\)$/.exec(r.nama); return m ? m[1].replace(/\s+(and|dan)\s+/, ' & ') + ', ' + m[2] : r.nama; }).sort((a, b) => bersih(a).localeCompare(bersih(b)));
    if (!nama.length) return false; const sit = ' (' + nama.join('; ') + ')'; const hujung = ayat.replace(/[.!?]\s*$/, ''); const ekor = hujung.slice(-Math.min(30, hujung.length)); const sandaran = {}; let jadi = false;
    ubahTeks(sid, t => { if (jadi) return t; const i = t.indexOf(ekor); if (i < 0) return t; jadi = true; return t.slice(0, i + ekor.length) + sit + t.slice(i + ekor.length); }, sandaran);
    if (jadi) { P.sandaranDraf = sandaran; const D0 = asalD(); if (D0.agen) D0.agen.tanpa = D0.agen.tanpa.filter(z => !(z.sid === sid && z.ayat === ayat)); simpanT(true); P.cache = {}; Teks.renderSemua(); X.render(); toast('Sitasi disisip ke ASAL' + sit, false, { label: 'Batal', fn: () => batalBetul() }); }
    else toast('Ayat itu tidak ditemui lagi dalam ASAL (mungkin sudah disunting)', true); return jadi;
  }

  /* ---------------- (5) WORD ---------------- */
  async function muatTurunWord() {
    const M = susun(); if (!M) return; const kritikal = M.isu.filter(z => z.tahap === 'kritikal').length;
    if (kritikal) { const ok = await R.confirmBox('Masih ada perkara kritikal', `${kritikal} perkara kritikal belum selesai (ayat tanpa sitasi, objek tanpa nombor atau seumpamanya). Muat turun juga sebagai draf kerja?`, 'Muat turun juga', false); if (!ok) return; }
    const html = htmlDraf(M, { eksport: true }); const d = dokumen();
    try { const blob = await Teks.docxHtml(d.tajuk || 'Manuskrip', html); const nama = 'Draf_Akhir_' + String(d.tajuk || 'artikel').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40) + '.docx'; R.saveFile(nama, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); toast('Draf akhir dimuat turun: ' + nama); }
    catch (e) { toast('Gagal menjana Word: ' + ((e && e.message) || e), true); }
  }

  /* ---------------- paparan ---------------- */
  const NAMA_KAT = { tanpasitasi: 'Ayat tanpa sitasi', sitasi: 'Sitasi dan rujukan', objek: 'Jadual dan rajah', nombor: 'Penomboran', bahasa: 'Bahasa manuskrip', isi: 'Isi belum lengkap atau sisa agen', struktur: 'Struktur dan sub-menu', gaya: 'Gaya' };
  function htmlKad() { const on = P.buka === KUNCI; const M = P.cache.draf; const n = M ? M.isu.filter(z => z.tahap === 'kritikal').length : null;
    return `<button class="pd-kad df-kad ${n === 0 ? 'siap' : 'draf'}${on ? ' on' : ''}" data-pd="buka" data-k="${KUNCI}" role="tab" aria-selected="${on}"><span class="no">&#10003;</span><span class="nm">Draf Akhir</span><span class="st">${n == null ? 'himpun semua folder' : n ? n + ' perkara kritikal' : 'sedia untuk hantaran'}</span><span class="pt">jadual, rajah, nombor dan sitasi disemak</span></button>`; }
  function render(el) {
    const M = susun(); P.cache.draf = M; if (!M) { el.innerHTML = ''; return; } const D0 = asalD(); const kr = M.isu.filter(z => z.tahap === 'kritikal'); const am = M.isu.filter(z => z.tahap === 'amaran'); const inf = M.isu.filter(z => z.tahap === 'info');
    const sibuk = P.busy ? P.busy.mod : null; const mati = P.busy ? ' disabled' : ''; const nT = M.objek.filter(o => o.jenis === 'T').length, nF = M.objek.filter(o => o.jenis === 'F').length;
    const kumpul = {}; M.isu.forEach((z, i) => { z.i = i; (kumpul[z.kat] = kumpul[z.kat] || []).push(z); });
    const jenisBetul = Array.from(new Set(M.isu.filter(z => z.betul && LABEL_BETUL[z.betul] && z.betul !== 'jana' && z.betul !== 'submenu').map(z => z.betul === 'objek' ? 'nombor' : z.betul)));
    const status = kr.length ? `<div class="df-status gagal"><b>Belum sedia untuk hantaran:</b> ${kr.length} perkara kritikal, ${am.length} amaran.</div>` : am.length ? `<div class="df-status amaran"><b>Hampir sedia:</b> tiada perkara kritikal; ${am.length} amaran untuk diteliti.</div>` : `<div class="df-status ok"><b>Sedia untuk hantaran.</b> Tiada perkara kritikal atau amaran yang dikesan oleh semakan sistem.</div>`;
    const bar = (z, q) => { const sek = z.sid ? seksyen(z.sid) : null; return `<li class="df-i ${z.tahap}"><span class="df-t">${z.tahap === 'kritikal' ? 'Kritikal' : z.tahap === 'amaran' ? 'Amaran' : 'Info'}</span> ${esc(z.mesej)}<span class="df-acts">${z.betul && LABEL_BETUL[z.betul] ? `<button class="btn btn-sm" data-pd="dfbetul" data-j="${esc(z.betul)}" data-i="${z.i}" title="${esc(LABEL_BETUL[z.betul])}">Betulkan</button>` : ''}${z.betul === 'jana' && z.folder ? `<button class="btn btn-sm" data-pd="buka" data-k="${esc(z.folder)}" title="Folder itu mempunyai butang Jana bagi jadual atau rajah ini">Jana dalam folder</button>` : ''}${z.betul === 'submenu' ? '<button class="btn btn-sm" data-pd="dfsub">Susun sub-menu</button>' : ''}${sek ? `<button class="btn btn-sm" data-pd="dfpergi" data-sid="${esc(z.sid)}">Pergi</button>` : ''}${z.rekod ? `<button class="btn btn-sm" data-bukarekod="${esc(z.rekod)}">Buka rekod</button>` : ''}</span></li>`; };
    const senarai = Object.keys(NAMA_KAT).filter(k => kumpul[k]).map(k => { const ls = kumpul[k]; const nk = ls.filter(z => z.tahap === 'kritikal').length; return `<details class="df-kump"${nk && k !== 'tanpasitasi' ? ' open' : ''}><summary><b>${NAMA_KAT[k]}</b> <span class="ring">${nk ? nk + ' kritikal' : ''}${nk && ls.length - nk ? ', ' : ''}${ls.length - nk ? (ls.length - nk) + ' lain' : ''}</span></summary><ul class="df-isu">${ls.slice(0, 120).map(bar).join('')}</ul>${ls.length > 120 ? `<p class="help">${ls.length - 120} lagi tidak dipaparkan.</p>` : ''}</details>`; }).join('');
    const ag = D0.agen; const rekodMap = new Map(); X.indeks().forEach(r => rekodMap.set(r.id, r));
    const htmlAgen = ag ? `<details class="df-kump" open><summary><b>Semakan sitasi oleh agen</b> <span class="ring">${esc(R.fmtTime(ag.masa))}</span></summary><ul class="df-isu">${ag.tanpa.map((z, q) => `<li class="df-i ${z.sumber.length ? 'amaran' : 'kritikal'}">"${esc(z.ayat.slice(0, 140))}"<br>${z.sumber.length ? `Sumber dicadangkan: <b>${esc(z.sumber.map(id => (rekodMap.get(id) || {}).nama || id).join('; '))}</b>` : 'Tiada sumber dalam senarai yang menyokong ayat ini.'} ${esc(z.saranan)}<span class="df-acts">${z.sumber.length ? `<button class="btn btn-sm btn-primary" data-pd="dfsisip" data-q="${q}">Sisip sitasi ke ASAL</button>` : ''}<button class="btn btn-sm" data-pd="dfpergi" data-sid="${esc(z.sid)}">Pergi</button></span></li>`).join('')}${ag.semak.map(z => `<li class="df-i ${z.status === 'tidak' ? 'kritikal' : 'amaran'}">${z.status === 'tidak' ? 'Sumber tidak menyokong' : 'Sokongan separa'}: "${esc(z.ayat.slice(0, 140))}" <em>${esc(z.ulasan)}</em><span class="df-acts"><button class="btn btn-sm" data-pd="dfpergi" data-sid="${esc(z.sid)}">Pergi</button></span></li>`).join('')}${!ag.tanpa.length && !ag.semak.length ? '<li class="df-i ok">Semua sitasi yang disemak disokong oleh sumbernya.</li>' : ''}</ul></details>` : '';
    const ada = !!R.lsGet(LS_SAND(), null);
    el.innerHTML = `<div class="pd-fh"><h3>&#10003; Draf Akhir: manuskrip lengkap untuk hantaran</h3><span class="pd-fh-m">${M.S.filter(x => !x.ruj).length} seksyen · ${angka(M.S.reduce((s, x) => s + (x.abs || x.ruj ? 0 : x.kata || 0), 0))} patah (tanpa abstrak dan rujukan) · ${nT} jadual · ${nF} rajah · ${M.rujukan.length} rujukan</span></div>
      <p class="pd-tujuan">Semua folder dihimpunkan mengikut susunan artikel. Setiap jadual dan rajah diletakkan selepas perenggan yang mula-mula merujuknya, dinomborkan mengikut sebutan pertama (APA 7: nombor tebal dan tajuk condong di atas objek); rajah PRISMA berada dalam Dapatan; label tanpa objek dan sisa agen dibuang; senarai rujukan APA 7 dijana daripada sitasi. Draf dibina semula setiap kali folder ini dibuka, maka ASAL kekal sebagai sumber tunggal.</p>
      ${status}
      <div class="pd-acts df-alat"><button class="btn btn-primary" data-pd="dfbetulsemua" data-j="${esc(jenisBetul.join(','))}"${jenisBetul.length ? '' : ' disabled'} title="${esc(jenisBetul.map(j => LABEL_BETUL[j]).join('; '))}">Betulkan semua yang selamat dalam ASAL (${jenisBetul.length} jenis)</button><button class="btn" data-pd="dfsegar" title="Himpun semula daripada ASAL terkini">Himpun semula</button><button class="btn" data-pd="dfword">Muat turun Word (draf akhir)</button><button class="btn btn-ai" data-pd="dfagen"${mati}>${sibuk === 'agensitasi' ? 'Agen sedang menyemak sitasi' : 'Semakan sitasi oleh agen'}</button><button class="btn" data-pd="dfsub"${mati}>Susun sub-menu mengikut isi</button><button class="btn btn-ai" data-pd="dfsubagen"${mati}>${sibuk === 'agensub' ? 'Agen sedang mencadangkan' : 'Cadangkan sub-menu dengan agen'}</button>${ada ? '<button class="btn btn-sm" data-pd="dfsubbatal">Batalkan sub-menu</button>' : ''}${P.sandaranDraf ? '<button class="btn btn-sm" data-pd="dfbatal">Batalkan pembetulan terakhir</button>' : ''}<label class="pr-tog"><input type="checkbox" data-pdcek="dfnombor"${D0.nomborTajuk !== false ? ' checked' : ''}> Nombor tajuk seksyen</label></div>
      <p class="help">"Betulkan semua yang selamat" hanya membuat pembetulan mekanikal dalam ASAL (boleh dibatalkan). Ayat tanpa sitasi, sitasi yang tidak ditemui dan objek yang tiada tidak diteka: sistem tidak mereka sumber atau angka. Gunakan "Semakan sitasi oleh agen" untuk cadangan sumber daripada senarai Prof Dr sendiri.</p>
      ${htmlAgen}${senarai ? `<div class="df-senarai">${senarai}</div>` : ''}
      <div class="df-legenda"><span><sup class="df-m">&#9679;</sup> ayat tanpa sitasi, bahasa lain atau nombor salah</span><span><sup class="df-k">&#9679;</sup> masalah sitasi lain</span><span><mark class="df-x">Table 3</mark> rujukan tanpa objek</span><span class="df-merah">&#9679; seeloknya ada sub-menu</span></div>
      <article class="df-draf" lang="${M.E ? 'en' : 'ms'}">${htmlDraf(M)}</article>`;
  }
  async function klik(a, b) {
    if (a === 'dfsub') { await modalSub(rancangSemua(), false); return true; }
    if (a === 'dfsubagen') { await agenSub(); return true; }
    if (a === 'dfsubbatal') { batalSub(); return true; }
    if (a === 'dfbatal') { batalBetul(); return true; }
    if (a === 'dfsegar') { Teks.flushEditor(); P.cache = {}; X.render(); toast('Draf dihimpun semula daripada ASAL terkini'); return true; }
    if (a === 'dfword') { await muatTurunWord(); return true; }
    if (a === 'dfagen') { await agenSitasi(); return true; }
    if (a === 'dfbetulsemua') { betulSemua(String(b.dataset.j || '').split(',').filter(Boolean)); return true; }
    if (a === 'dfbetul') { const M = susun(); const z = M.isu[+b.dataset.i]; Teks.flushEditor(); const sandaran = {}; const n = z && z.betul === b.dataset.j ? betul(z.betul, M, sandaran, ['label', 'sempang', 'agen', 'abjad', 'dan', 'yatim', 'nombor', 'objek', 'prisma', 'pendua'].includes(z.betul) ? null : z) : 0; P.sandaranDraf = sandaran; P.cache = {}; Teks.renderSemua(); X.render(); toast(n ? `${LABEL_BETUL[b.dataset.j]}: ${n} pembetulan dalam ASAL` : 'Tiada perubahan', false, n ? { label: 'Batal', fn: () => batalBetul() } : null); return true; }
    if (a === 'dfpergi') { const sid = b.dataset.sid; if (!seksyen(sid)) return true; Teks.flushEditor(); Teks.state.bab = A.id; Teks.state.sek = sid; Teks.renderSenarai(); Teks.renderEditor(); const ed = $('#artEditor'); if (ed) ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); return true; }
    if (a === 'dfsisip') { const z = (asalD().agen || { tanpa: [] }).tanpa[+b.dataset.q]; if (z) sisipSitasi(z.sid, z.ayat, z.sumber); return true; }
    return false;
  }
  function ubahCek(el) { if (el.dataset.pdcek !== 'dfnombor') return false; asalD().nomborTajuk = !!el.checked; simpanT(true); X.render(); return true; }
  return { KUNCI, htmlKad, render, klik, ubahCek, tandaSeksyen, rancangSemua, rancangFolder, terapSub, batalSub, susun, htmlDraf, betulSemua, betul, pecahAyat, bahasaAyat, sisipSitasi };
}
