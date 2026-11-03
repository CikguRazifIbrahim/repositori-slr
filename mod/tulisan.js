/* Tulisan Tesis: buku nota penulisan Prof Dr di dalam sistem, disusun mengikut Bab 1 hingga Bab 5 dan seksyen. Sistem ialah
   sumber kebenaran tunggal: setiap seksyen disimpan automatik (Firestore meta/tulisan_b<N> dan salinan tempatan) dan disegerakkan
   antara peranti, maka tiada yang hilang dan tiada yang ditaip dua kali. MS Word ialah pintu masuk dan keluar: "Muat turun Word"
   menjana .docx bab (Times New Roman 12, langkau dua) dan menandakan bab itu "dipinjam keluar"; "Muat naik Word" membaca .docx,
   memadankan seksyen mengikut tajuk, menunjukkan pratonton gabungan (berserta amaran jika versi sistem lebih baharu daripada fail)
   dan hanya kemudian menimpa; setiap fail disimpan dalam subfolder Tulisan di Google Drive sebagai arkib. Peringatan dipaparkan
   selagi bab yang dipinjam keluar belum dimuat naik semula. Log harian merekodkan patah perkataan yang ditulis bagi setiap seksyen
   supaya esoknya Prof Dr nampak apa yang sudah ditulis semalam. */
export function initTulisan(R) {
  const { $, $$, esc, toast } = R;
  const BAB = [[1, 'Pengenalan'], [2, 'Sorotan Literatur'], [3, 'Metodologi'], [4, 'Dapatan Kajian'], [5, 'Perbincangan dan Kesimpulan']];
  const SUB = 'Tulisan';
  const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const T = { bab: 2, docs: {}, sek: null, timers: {}, loaded: false, bundle: null, cari: '', status: {}, mula: false };

  /* ---- utiliti ---- */
  const hariIni = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tarikhStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const patah = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const idBaru = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const norm = s => String(s || '').toLowerCase().replace(/^\s*(bab\s*\d+[.:]?\s*)?/i, '').replace(/^[\d.]+\s*/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const tajukBab = n => { const b = BAB.find(x => x[0] === n); return b ? b[1] : 'Bab ' + n; };
  const kunci = n => 'meta/tulisan_b' + n;
  const lsKey = n => 'rslr_tulisan_b' + n;
  function kosongDoc(n) { return { bab: n, tajuk: tajukBab(n), seksyen: {}, susunan: [], masa: 0, pinjam: null, log: {}, fail: [] }; }
  function doc(n) { if (!T.docs[n]) T.docs[n] = R.lsGet(lsKey(n), null) || kosongDoc(n); return T.docs[n]; }
  function senarai(n) { const d = doc(n); const ids = (d.susunan || []).filter(id => d.seksyen[id] && !d.seksyen[id].padam); Object.keys(d.seksyen).forEach(id => { if (!d.seksyen[id].padam && !ids.includes(id)) ids.push(id); }); return ids; }
  function gabung(a, b) {
    /* Gabungan dua salinan dokumen bab (tempatan dan awan): setiap seksyen diambil daripada salinan yang lebih baharu. */
    const out = kosongDoc(a.bab || b.bab); out.tajuk = a.tajuk || b.tajuk || out.tajuk;
    const ids = new Set(Object.keys(a.seksyen || {}).concat(Object.keys(b.seksyen || {})));
    ids.forEach(id => { const x = (a.seksyen || {})[id], y = (b.seksyen || {})[id]; out.seksyen[id] = !x ? y : !y ? x : (y.masa || 0) > (x.masa || 0) ? y : x; });
    const baru = (b.masa || 0) >= (a.masa || 0) ? b : a; const lama = baru === a ? b : a;
    out.susunan = (baru.susunan || []).slice(); (lama.susunan || []).forEach(id => { if (!out.susunan.includes(id)) out.susunan.push(id); });
    out.masa = Math.max(a.masa || 0, b.masa || 0);
    out.pinjam = (b.masa || 0) >= (a.masa || 0) ? (b.pinjam || null) : (a.pinjam || null);
    out.log = Object.assign({}, a.log || {}, b.log || {}); Object.keys(out.log).forEach(k => { if (a.log && b.log && a.log[k] && b.log[k]) out.log[k] = (a.log[k].patah || 0) >= (b.log[k].patah || 0) ? a.log[k] : b.log[k]; });
    const fail = {}; (a.fail || []).concat(b.fail || []).forEach(f => { fail[f.id || f.nama + f.masa] = f; }); out.fail = Object.values(fail).sort((x, y) => (y.masa || 0) - (x.masa || 0)).slice(0, 60);
    return out;
  }

  /* ---- muat dan simpan ---- */
  async function muatBab(n) {
    const lokal = R.lsGet(lsKey(n), null) || kosongDoc(n); let awan = null;
    try { awan = await R.db().get(kunci(n)); } catch (e) { T.status.awan = 'gagal'; }
    const d = awan ? gabung(lokal, awan) : lokal; T.docs[n] = d; R.lsSet(lsKey(n), d); return d;
  }
  async function muatSemua() { for (const [n] of BAB) await muatBab(n); T.loaded = true; }
  /* Had saiz dokumen Firestore 1 MiB: jika bab menghampiri had, versi lama seksyen (sejarah) dibuang dahulu. */
  function jagaSaiz(d) {
    const saiz = () => { try { return new Blob([JSON.stringify(d)]).size; } catch (e) { return JSON.stringify(d).length; } };
    if (saiz() < 800000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.sejarah && sk.sejarah.length > 1) sk.sejarah = sk.sejarah.slice(0, 1); });
    if (saiz() < 800000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.sejarah) sk.sejarah = []; });
    if (saiz() < 950000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.padam) sk.teks = ''; });
  }
  async function simpanAwan(n, patch) {
    const d = doc(n); jagaSaiz(d); R.lsSet(lsKey(n), d);
    if (patch && patch.seksyen) Object.keys(patch.seksyen).forEach(id => { if (d.seksyen[id]) patch.seksyen[id] = d.seksyen[id]; });
    try { await R.db().set(kunci(n), Object.assign({ bab: n, tajuk: d.tajuk, masa: d.masa }, patch), true); T.status.awan = 'ok'; return true; }
    catch (e) { T.status.awan = 'gagal'; console.warn('tulisan: simpanan awan gagal', e); return false; }
  }
  function catatLog(d, id, delta) {
    const h = hariIni(); d.log = d.log || {}; const l = d.log[h] || { patah: 0, seksyen: {}, masa: {} };
    l.masa = l.masa || {}; l.masa[id] = Date.now();
    if (delta) { l.patah = (l.patah || 0) + delta; l.seksyen = l.seksyen || {}; l.seksyen[id] = (l.seksyen[id] || 0) + delta; }
    d.log[h] = l;
    const keys = Object.keys(d.log).sort(); while (keys.length > 90) delete d.log[keys.shift()];
  }
  function tulisSeksyen(n, id, patch, opts) {
    opts = opts || {}; const d = doc(n); const s = d.seksyen[id] || { tajuk: '', teks: '', cipta: Date.now(), masa: 0, patah: 0 };
    const lama = s.patah || 0; Object.assign(s, patch); s.masa = Date.now(); s.patah = s.padam ? 0 : patah(s.teks); d.seksyen[id] = s;
    if (!d.susunan.includes(id)) d.susunan.push(id);
    catatLog(d, id, s.patah - lama); d.masa = s.masa;
    R.lsSet(lsKey(n), d); setStatus('Menyimpan');
    clearTimeout(T.timers[n + ':' + id]);
    T.timers[n + ':' + id] = setTimeout(async () => { const ok = await simpanAwan(n, { seksyen: { [id]: d.seksyen[id] }, susunan: d.susunan, log: d.log, masa: d.masa }); setStatus(ok ? 'Disimpan ' + R.fmtTime(Date.now()) : 'Disimpan pada peranti ini sahaja (awan menolak)'); if (!opts.senyap) { renderSenarai(); renderBab(); } }, opts.segera ? 0 : 1200);
  }
  function setStatus(t) { const el = $('#tulStatus'); if (el) el.textContent = t; }

  /* ---- seksyen ---- */
  function seksyenBaru(n, tajuk, teks, sumber) {
    const id = idBaru(); const d = doc(n); d.seksyen[id] = { tajuk: tajuk || '', teks: teks || '', cipta: Date.now(), masa: 0, patah: 0, sumber: sumber || null };
    d.susunan.push(id); tulisSeksyen(n, id, {}, { segera: true }); return id;
  }
  function padamSeksyen(n, id) { const d = doc(n); if (!d.seksyen[id]) return; tulisSeksyen(n, id, { padam: true }, { segera: true }); if (T.sek === id) T.sek = null; }
  function gerak(n, id, arah) { const d = doc(n); const ids = senarai(n); const i = ids.indexOf(id); const j = i + arah; if (i < 0 || j < 0 || j >= ids.length) return; ids.splice(i, 1); ids.splice(j, 0, id); d.susunan = ids.concat(Object.keys(d.seksyen).filter(k => !ids.includes(k))); d.masa = Date.now(); R.lsSet(lsKey(n), d); simpanAwan(n, { susunan: d.susunan, masa: d.masa }); renderSenarai(); renderEditor(); }

  /* ---- subtopik proposal (templat) ---- */
  /* Bab 1 hingga 3 mengikut tajuk dalam badan Kertas Cadangan (suntingan 27 Ogos 2026) berserta penyusunan semula blok PPDO (28 Ogos 2026);
     Bab 4 dan 5 ialah cadangan struktur mengikut reka bentuk kajian (H1 hingga H4, CB-SEM, perbandingan bandar dan luar bandar). Setiap baris: [aras, tajuk]. */
  const TEMPLAT = {
    1: [[1, 'Pendahuluan'], [1, 'Latar Belakang Kajian'], [1, 'Pernyataan Masalah'], [1, 'Tujuan Kajian'], [1, 'Objektif Kajian'], [1, 'Soalan dan Hipotesis Kajian'], [1, 'Kerangka Teoretikal Kajian'], [1, 'Kerangka Konseptual Kajian'], [1, 'Definisi Operasional'],
      [2, 'Kepimpinan Digital Guru Besar'], [3, 'Penyokong Kewarganegaraan Digital'], [3, 'Perancang Berwawasan'], [3, 'Pemimpin Pemerkasa'], [3, 'Pereka Bentuk Sistem'], [3, 'Pembelajar Berhubung'],
      [2, 'Pengurusan Pengetahuan Digital Organisasi'], [3, 'Pemerolehan Digital'], [3, 'Penyimpanan dan Pendokumentasian Digital'], [3, 'Perkongsian Digital'], [3, 'Penciptaan Digital'], [3, 'Pengaplikasian Digital'],
      [2, 'Kompetensi Digital Guru'], [3, 'Penglibatan Profesional'], [3, 'Sumber Digital'], [3, 'Pengajaran dan Pembelajaran'], [3, 'Pentaksiran'], [3, 'Memperkasa Murid'], [3, 'Membimbing Kompetensi Digital Murid'],
      [1, 'Batasan Kajian'], [1, 'Kepentingan Kajian'], [1, 'Rumusan']],
    2: [[1, 'Pendahuluan'], [1, 'Transformasi Pendidikan Digital Negara'], [1, 'Dasar Pendidikan Digital (2023-2030)'], [1, 'Kompetensi Digital Guru'], [1, 'Definisi Kompetensi Digital Guru'], [1, 'Kerangka Kompetensi Digital Guru'],
      [2, 'Kerangka Pengetahuan Teknologi, Pedagogi dan Kandungan (TPACK)'], [2, 'Model Kompetensi Digital Krumsvik (2014)'], [2, 'Kerangka UNESCO ICT-CFT (UNESCO, 2018)'], [2, 'Standard ISTE untuk Pendidik (ISTE, 2017)'], [2, 'Instrumen Kompetensi Digital Rubach dan Lazarides (2021)'], [2, 'Kerangka DigCompEdu (Redecker, 2017)'],
      [3, 'Penglibatan Profesional'], [3, 'Sumber Digital'], [3, 'Pengajaran dan Pembelajaran'], [3, 'Pentaksiran'], [3, 'Memperkasakan Murid'], [3, 'Memudah Cara Kompetensi Digital Murid'],
      [1, 'Kompetensi Digital Guru dalam Konteks Matlamat Pembangunan Mapan'], [1, 'Kompetensi Digital Guru dalam Konteks Sekolah Rendah'], [1, 'Evolusi Kepimpinan'], [1, 'Kepimpinan Digital Guru Besar'], [1, 'Definisi Kepimpinan Digital'], [1, 'Model Kepimpinan Digital'],
      [2, 'Kerangka Kepimpinan Transformasi Digital (Weber et al., 2022)'], [2, 'Sepuluh Ciri Pemimpin Digital untuk Era Norma Baharu (Budianto et al., 2022)'], [2, 'Model Taksonomi Kepimpinan Digital (Zulu dan Khosrowshahi, 2021)'], [2, 'Skala Kepimpinan Digital (DLS) (Büyükbeşe et al., 2022)'], [2, 'Skala Kepimpinan Digital Era Kecerdasan Buatan (Aydın dan Ceylan, 2026)'], [2, 'Model Pemimpin Digital (DLM) (Goh dan Mansor, 2024)'], [2, 'Standard ISTE untuk Pemimpin Pendidikan (2024)'],
      [3, 'Penyokong Kewarganegaraan Digital'], [3, 'Perancang Berwawasan'], [3, 'Pemimpin Pemerkasa'], [3, 'Pereka Bentuk Sistem'], [3, 'Pembelajar Berhubung'],
      [1, 'Perbandingan Model Kepimpinan Digital'], [1, 'Pengurusan Pengetahuan Organisasi'], [1, 'Pengetahuan: Daripada Data kepada Pengetahuan'],
      [2, 'Asal Usul Pengetahuan'], [2, 'Data'], [2, 'Maklumat'], [2, 'Kategori Pengetahuan'], [2, 'Perkongsian Pengetahuan'], [2, 'Pengetahuan Digital Organisasi'],
      [1, 'Definisi Pengurusan Pengetahuan Digital Organisasi'], [1, 'Pengurusan Pengetahuan Organisasi dalam Konteks Sekolah'], [1, 'Model Pengurusan Pengetahuan Organisasi'],
      [2, 'Model Wiig (Wiig, 1993)'], [2, 'Model Epistemologi Organisasi (Von Krogh et al., 1995)'], [2, 'Model Penciptaan Makna (Choo, 1998)'], [2, 'Model I-Space (Boisot, 1998)'], [2, 'Model SECI (Nonaka dan Takeuchi, 1995)'],
      [3, 'Sosialisasi (Socialization)'], [3, 'Eksternalisasi (Externalization)'], [3, 'Kombinasi (Combination)'], [3, 'Internalisasi (Internalization)'],
      [1, 'Perbandingan Model-Model Pengurusan Pengetahuan Organisasi'], [1, 'Dimensi Pengurusan Pengetahuan Digital Organisasi'],
      [2, 'Pemerolehan Digital'], [2, 'Penyimpanan dan Pendokumentasian Digital'], [2, 'Perkongsian Digital'], [2, 'Penciptaan Digital'], [2, 'Pengaplikasian Digital'],
      [1, 'Perkembangan Kajian Berkaitan Pengurusan Pengetahuan Digital Organisasi'], [1, 'Kepentingan Pengurusan Pengetahuan Digital Organisasi kepada Sekolah'], [1, 'Teori Kognitif Sosial'], [1, 'Kajian-kajian Lepas'],
      [2, 'Kajian Lepas Kompetensi Digital Guru'], [2, 'Kajian Lepas Kepimpinan Digital Guru Besar'], [2, 'Kajian Lepas Pengurusan Pengetahuan Organisasi'], [2, 'Hubungan Antara Kepimpinan Digital dan Pengurusan Pengetahuan Organisasi'], [2, 'Hubungan Antara Pengurusan Pengetahuan Organisasi dan Kompetensi Digital Guru'], [2, 'Hubungan Antara Kepimpinan Digital dan Kompetensi Digital Guru'], [2, 'Pengurusan Pengetahuan Organisasi Sebagai Perantara'], [2, 'Rumusan']],
    3: [[1, 'Pendahuluan'], [1, 'Reka Bentuk Kajian'], [2, 'Falsafah dan Pendekatan Kajian'], [2, 'Pendekatan Metodologi dan Strategi Kajian'],
      [1, 'Populasi dan Sampel Kajian'], [2, 'Populasi Kajian'], [2, 'Saiz Sampel Kajian'], [2, 'Kaedah Pensampelan'],
      [1, 'Instrumen Kajian'], [2, 'Pembangunan Instrumen Kajian'], [2, 'Penjanaan Item dan Spesifikasi Instrumen'], [2, 'Kesahan Instrumen Kajian'], [2, 'Kebolehpercayaan Instrumen Kajian'], [2, 'Kejelasan Item Kajian'], [2, 'Kajian Rintis'],
      [1, 'Prosedur Pengumpulan Data'], [1, 'Kaedah Analisis Data'], [2, 'Penyediaan dan Pemeriksaan Awal Data'], [2, 'Analisis Statistik Deskriptif'], [2, 'Analisis Statistik Inferensi'],
      [3, 'Analisis Faktor Pengesahan (CFA)'], [3, 'Penilaian Kesahan dan Kebolehpercayaan Konstruk'], [3, 'Analisis Laluan dan Penilaian Model Berstruktur'], [3, 'Analisis Kesan Perantara'],
      [2, 'Rumusan Persoalan Kajian, Hipotesis dan Analisis Data'], [1, 'Pertimbangan Etika'], [1, 'Rumusan']],
    4: [[1, 'Pendahuluan'], [1, 'Profil Responden dan Kadar Respons'], [1, 'Penyediaan dan Pemeriksaan Data'], [2, 'Data Hilang dan Nilai Ekstrem'], [2, 'Normaliti dan Multikolineariti'], [2, 'Bias Kaedah Sepunya'],
      [1, 'Analisis Deskriptif Pemboleh Ubah Kajian'], [2, 'Tahap Kepimpinan Digital Guru Besar'], [2, 'Tahap Pengurusan Pengetahuan Digital Organisasi'], [2, 'Tahap Kompetensi Digital Guru'],
      [1, 'Penilaian Model Pengukuran'], [2, 'Analisis Faktor Pengesahan (CFA)'], [2, 'Kesahan Konvergen dan Diskriminan'], [2, 'Kebolehpercayaan Konstruk'],
      [1, 'Penilaian Model Berstruktur'], [2, 'Indeks Padanan Model'], [2, 'Pengujian Hipotesis Kesan Langsung (H1 hingga H3)'], [2, 'Pengujian Kesan Perantara (H4)'],
      [1, 'Perbandingan Sekolah Bandar dan Luar Bandar'], [1, 'Rumusan Dapatan Mengikut Soalan Kajian'], [1, 'Rumusan']],
    5: [[1, 'Pendahuluan'], [1, 'Ringkasan Kajian'], [1, 'Perbincangan Dapatan Kajian'], [2, 'Tahap Kepimpinan Digital, Pengurusan Pengetahuan Digital Organisasi dan Kompetensi Digital Guru'], [2, 'Pengaruh Kepimpinan Digital Guru Besar terhadap Kompetensi Digital Guru'], [2, 'Pengaruh Kepimpinan Digital Guru Besar terhadap Pengurusan Pengetahuan Digital Organisasi'], [2, 'Pengaruh Pengurusan Pengetahuan Digital Organisasi terhadap Kompetensi Digital Guru'], [2, 'Pengurusan Pengetahuan Digital Organisasi sebagai Perantara'], [2, 'Perbandingan Sekolah Bandar dan Luar Bandar'],
      [1, 'Implikasi Kajian'], [2, 'Implikasi Teori'], [2, 'Implikasi Amalan'], [2, 'Implikasi Dasar'], [1, 'Batasan Kajian'], [1, 'Cadangan Kajian Lanjutan'], [1, 'Kesimpulan']]
  };
  const ARAS_MAKS = 3;
  function tanpaNombor(t) { return String(t || '').replace(/^\s*\d+(\.\d+)*\.?\s+/, '').trim(); }
  /* Nombor seksyen dikira daripada kedudukan dan aras (seperti tajuk berbilang aras Word): 2.3, 2.3.1, 2.3.1.1. Lompatan aras yang tidak sah
     (aras 3 terus selepas aras 1) dipaparkan sebagai aras yang dibenarkan. */
  function nombor(n) {
    const d = doc(n); const c = [0, 0, 0]; let prev = 0; const out = {};
    senarai(n).forEach(id => { let a = Math.max(1, Math.min(ARAS_MAKS, d.seksyen[id].aras || 1)); if (a > prev + 1) a = prev + 1; c[a - 1]++; for (let k = a; k < ARAS_MAKS; k++) c[k] = 0; out[id] = { aras: a, no: n + '.' + c.slice(0, a).join('.') }; prev = a; });
    return out;
  }
  function bolehDemosi(n, id) { const ids = senarai(n); const i = ids.indexOf(id); if (i <= 0) return false; const nb = nombor(n); const a = nb[id].aras; return a < ARAS_MAKS && a <= nb[ids[i - 1]].aras; }
  function bolehPromosi(n, id) { const nb = nombor(n); return !!nb[id] && nb[id].aras > 1; }
  function ubahAras(n, id, delta) {
    const nb = nombor(n); if (!nb[id]) return false; const a = nb[id].aras;
    if (delta > 0 && !bolehDemosi(n, id)) { toast('Seksyen pertama bab atau seksyen di bawah tajuk yang lebih rendah tidak boleh didemosi', true); return false; }
    if (delta < 0 && !bolehPromosi(n, id)) return false;
    tulisSeksyen(n, id, { aras: Math.max(1, Math.min(ARAS_MAKS, a + delta)) }, { segera: true }); renderSenarai(); renderEditor(); return true;
  }
  function susunSemula(n, id, indeks) {
    const d = doc(n); const ids = senarai(n); const i = ids.indexOf(id); if (i < 0) return;
    ids.splice(i, 1); if (indeks > i) indeks--; indeks = Math.max(0, Math.min(ids.length, indeks)); ids.splice(indeks, 0, id);
    d.susunan = ids.concat(Object.keys(d.seksyen).filter(k => !ids.includes(k))); d.masa = Date.now(); R.lsSet(lsKey(n), d); simpanAwan(n, { susunan: d.susunan, masa: d.masa }); renderSenarai(); renderEditor();
  }
  function isiTemplat(n, opts) {
    opts = opts || {}; const d = doc(n); const lama = senarai(n); const ada = new Set(lama.map(id => norm(d.seksyen[id].tajuk)).filter(Boolean));
    const baru = []; (TEMPLAT[n] || []).forEach(([aras, tajuk]) => { if (opts.semua || !ada.has(norm(tajuk))) { const id = idBaru(); d.seksyen[id] = { tajuk, teks: '', cipta: Date.now(), masa: Date.now(), patah: 0, aras, sumber: { jenis: 'templat' } }; baru.push(id); } });
    if (!baru.length) return 0;
    d.susunan = opts.depan ? baru.concat(lama) : lama.concat(baru); d.templat = true; d.masa = Date.now(); R.lsSet(lsKey(n), d);
    const patch = { seksyen: {}, susunan: d.susunan, masa: d.masa, templat: true }; baru.forEach(id => { patch.seksyen[id] = d.seksyen[id]; }); simpanAwan(n, patch); return baru.length;
  }
  /* Kali pertama: bab yang belum ada seksyen bertajuk atau bertulisan diisi dengan subtopik proposal secara automatik. */
  function templatAuto() {
    let jumlah = 0; BAB.forEach(([n]) => { const d = doc(n); if (d.templat) return; const kosong = senarai(n).every(id => !(d.seksyen[id].tajuk || '').trim() && !(d.seksyen[id].teks || '').trim()); if (kosong) jumlah += isiTemplat(n, { depan: true }); else { d.templat = true; R.lsSet(lsKey(n), d); simpanAwan(n, { templat: true }); } });
    if (jumlah) toast(jumlah + ' subtopik daripada proposal dimasukkan ke Bab 1 hingga Bab 5; semua boleh diubah suai.');
  }

  function gabungSeksyen(n, id, sasaran) {
    const d = doc(n); const a = d.seksyen[id], b = d.seksyen[sasaran]; if (!a || !b || id === sasaran) return false;
    const teks = [b.teks || '', a.teks || ''].filter(t => t.trim()).join('\n\n');
    tulisSeksyen(n, sasaran, { teks }, { senyap: true, segera: true }); padamSeksyen(n, id); return true;
  }
  async function gabungModal(n, id) {
    const d = doc(n); const s = d.seksyen[id]; const nb = nombor(n); const lain = senarai(n).filter(x => x !== id);
    if (!lain.length) { toast('Tiada seksyen lain dalam bab ini untuk digabungkan', true); return; }
    const okk = await R.richModal('Gabungkan seksyen', `<p>Teks "<b>${esc(s.tajuk || 'Tanpa tajuk')}</b>" (${s.patah || 0} patah) akan ditambah di hujung seksyen yang dipilih, kemudian seksyen asal dipadam.</p><select id="tulSasaran" class="modal-in">${lain.map(x => `<option value="${esc(x)}">${esc(nb[x].no)} ${esc(d.seksyen[x].tajuk || 'Tanpa tajuk')} (${d.seksyen[x].patah || 0} patah)</option>`).join('')}</select>`, 'Gabungkan', 'Batal');
    if (!okk) return; const sasaran = R.richModal.values.tulSasaran; if (gabungSeksyen(n, id, sasaran)) { T.bab = n; T.sek = sasaran; renderSemua(); toast('Seksyen digabungkan'); }
  }
  /* ---- semalam: jadual apa yang dibuat pada hari terakhir sebelum hari ini ---- */
  function hariAktifTerakhir() {
    const h = hariIni(); const tarikh = new Set();
    BAB.forEach(([n]) => Object.keys(doc(n).log || {}).forEach(k => { if (k < h) tarikh.add(k); }));
    return Array.from(tarikh).sort().pop() || null;
  }
  const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function tarikhPanjang(ymd) { const d = new Date(ymd + 'T00:00:00'); return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; }
  function renderSemalam() {
    const el = $('#tulSemalam'); if (!el) return;
    const t = hariAktifTerakhir(); const semalam = tarikhStr(Date.now() - 86400000);
    if (!t) { el.innerHTML = `<div class="sm-head"><h2>Semalam</h2><span class="sub">Belum ada rekod tulisan sebelum hari ini. Selepas Prof Dr menulis, jadual ini menyenaraikan setiap seksyen yang disentuh pada hari sebelumnya.</span></div>`; return; }
    const hariLalu = Math.round((new Date(hariIni() + 'T00:00:00') - new Date(t + 'T00:00:00')) / 86400000);
    const rows = [];
    BAB.forEach(([n]) => { const l = (doc(n).log || {})[t]; if (!l) return; const nb = nombor(n); const ids = new Set(Object.keys(l.seksyen || {}).concat(Object.keys(l.masa || {}))); ids.forEach(id => { const sk = doc(n).seksyen[id]; if (!sk) return; rows.push({ n, id, sk, delta: (l.seksyen || {})[id] || 0, masa: (l.masa || {})[id] || 0, no: nb[id] ? nb[id].no : (sk.padam ? 'dipadam' : '') }); }); });
    rows.sort((x, y) => (y.masa || 0) - (x.masa || 0));
    const jumlah = rows.reduce((a, r) => a + r.delta, 0);
    el.innerHTML = `<div class="sm-head"><h2>${hariLalu === 1 ? 'Semalam' : 'Hari terakhir menulis'}: ${esc(tarikhPanjang(t))}${hariLalu > 1 ? ' (' + hariLalu + ' hari lalu)' : ''}</h2><span class="sub">${rows.length} seksyen disentuh, ${jumlah >= 0 ? '+' : ''}${jumlah} patah perkataan. Sambung seksyen yang sama, gabungkan dengan seksyen lain, atau padam.</span></div>
      <div class="sm-wrap"><table class="sm-tbl"><thead><tr><th>Bab</th><th>Seksyen</th><th>Perubahan</th><th>Patah kini</th><th>Masa terakhir</th><th>Tindakan</th></tr></thead><tbody>${rows.map(r => `<tr${r.sk.padam ? ' class="padam"' : ''}><td>Bab ${r.n}</td><td>${esc(r.no)} ${esc(r.sk.tajuk || 'Tanpa tajuk')}${r.sk.padam ? ' (dipadam)' : ''}</td><td>${r.delta ? (r.delta > 0 ? '+' : '') + r.delta + ' patah' : 'disunting, bilangan patah sama'}</td><td>${r.sk.padam ? '' : (r.sk.patah || 0)}</td><td>${r.masa ? esc(R.fmtTime(r.masa)) : ''}</td><td>${r.sk.padam ? '' : `<button class="btn btn-sm btn-primary" data-buka="${r.n}|${esc(r.id)}">Sambung</button> <button class="btn btn-sm" data-gabung="${r.n}|${esc(r.id)}">Gabung</button> <button class="btn btn-sm btn-danger" data-padamsm="${r.n}|${esc(r.id)}">Padam</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ---- paparan ---- */
  function show() { if (!T.mula) { T.mula = true; muatSemua().then(() => { templatAuto(); renderSemua(); peringatan(); }); } renderSemua(); }
  function renderSemua() { renderSemalam(); renderBab(); renderSenarai(); renderEditor(); renderSambung(); renderCari(); }
  function jumlahPatah(n) { return senarai(n).reduce((s, id) => s + (doc(n).seksyen[id].patah || 0), 0); }
  function renderBab() {
    const el = $('#tulBab'); if (!el) return;
    el.innerHTML = BAB.map(([n, t]) => { const d = doc(n); return `<button class="tul-tab${n === T.bab ? ' on' : ''}" data-bab="${n}"><span class="b">Bab ${n}</span><span class="t">${esc(t)}</span><span class="m">${senarai(n).length} seksyen · ${jumlahPatah(n)} patah${d.pinjam ? ' · <b class="pinjam">dipinjam ke Word</b>' : ''}</span></button>`; }).join('');
  }
  function renderSenarai() {
    const el = $('#tulSenarai'); if (!el) return; const n = T.bab; const d = doc(n); const ids = senarai(n); const nb = nombor(n);
    const pj = d.pinjam ? `<div class="tul-pinjam">Bab ${n} dimuat turun sebagai Word pada ${esc(R.fmtTime(d.pinjam.masa))} (${esc(d.pinjam.fail || '')}) dan belum dimuat naik semula. Jika Prof Dr menaip dalam fail itu, muat naik dahulu sebelum menyunting di sini supaya tidak wujud dua versi. <button class="btn btn-sm" data-tulnaik="1">Muat naik Word</button> <button class="btn btn-sm" data-pinjamtutup="${n}" title="Fail Word itu tidak disunting; batalkan peringatan">Tidak disunting</button></div>` : '';
    el.innerHTML = pj + (ids.length ? ids.map(id => { const s = d.seksyen[id]; const k = nb[id]; return `<div class="tul-item a${k.aras}${id === T.sek ? ' on' : ''}${(s.patah || 0) ? '' : ' kosong'}" data-sek="${esc(id)}" role="button" tabindex="0"><span class="tul-grip" title="Seret untuk menyusun semula" aria-hidden="true">⋮⋮</span><div class="tul-item-isi"><div class="tj"><span class="no">${esc(k.no)}</span> ${esc(s.tajuk || 'Tanpa tajuk')}</div><div class="mt">${s.patah || 0} patah${s.patah || s.masa && !(s.sumber && s.sumber.jenis === 'templat') ? ' · ' + (s.masa ? esc(R.fmtTime(s.masa)) : 'belum disunting') : ' · belum ditulis'}${s.sumber && s.sumber.jenis !== 'templat' ? ' · ' + esc(s.sumber.jenis === 'banding' ? 'daripada Banding' : s.sumber.jenis === 'word' ? 'daripada Word' : s.sumber.jenis === 'artikel' ? 'daripada rekod' : '') : ''}</div></div><span class="tul-aras"><button class="ab" data-aras="-1" data-id="${esc(id)}" title="Promosi (naik satu aras)"${k.aras > 1 ? '' : ' disabled'}>&#8592;</button><button class="ab" data-aras="1" data-id="${esc(id)}" title="Demosi (turun satu aras, di bawah seksyen sebelumnya)"${bolehDemosi(n, id) ? '' : ' disabled'}>&#8594;</button></span></div>`; }).join('') : `<div class="help">Bab ${n} belum ada seksyen. Klik "Seksyen baharu" untuk mula menulis, "Subtopik proposal" untuk memasukkan senarai subtopik, atau muat naik fail Word.</div>`);
  }
  function renderEditor() {
    const el = $('#tulEditor'); if (!el) return; const n = T.bab; const d = doc(n); const s = T.sek ? d.seksyen[T.sek] : null;
    if (!s || s.padam) { el.innerHTML = `<div class="tul-kosong"><h3>Pilih seksyen di sebelah kiri atau cipta seksyen baharu</h3><p>Setiap seksyen disimpan automatik ke awan beberapa saat selepas Prof Dr berhenti menaip, dan disegerakkan ke semua peranti. Tulis dalam bentuk perenggan; pisahkan perenggan dengan satu baris kosong. Tanda **tebal** dan *condong* dikekalkan apabila dimuat turun sebagai Word.</p></div>`; return; }
    const k = nombor(n)[T.sek] || { aras: 1, no: n + '.?' };
    el.innerHTML = `<div class="tul-ed-head"><span class="tul-no" title="Nombor dikira automatik daripada kedudukan dan aras seksyen">${esc(k.no)}</span><input id="tulTajuk" class="tul-tajuk" placeholder="Tajuk seksyen, contohnya Kepimpinan digital dan pengurusan pengetahuan (nombor dijana automatik)" value="${esc(s.tajuk || '')}"><div class="tul-ed-acts"><button class="btn btn-sm" data-arased="-1" title="Promosi: naik satu aras (contoh 2.3.1 menjadi 2.4)"${k.aras > 1 ? '' : ' disabled'}>&#8592; Promosi</button><button class="btn btn-sm" data-arased="1" title="Demosi: turun satu aras di bawah seksyen sebelumnya (contoh 2.4 menjadi 2.3.1)"${bolehDemosi(n, T.sek) ? '' : ' disabled'}>Demosi &#8594;</button><button class="btn btn-sm" data-gerak="-1" title="Alih ke atas">Atas</button><button class="btn btn-sm" data-gerak="1" title="Alih ke bawah">Bawah</button><button class="btn btn-sm" data-salin="1">Salin teks</button><button class="btn btn-sm" data-gabung="${n}|${esc(T.sek)}" title="Tambah teks seksyen ini ke hujung seksyen lain, kemudian padam seksyen ini">Gabung</button><button class="btn btn-sm btn-danger" data-padamsek="1">Padam</button></div></div>
      ${s.word && !(s.sumber && s.sumber.jenis === 'word') ? `<div class="tul-sumber">Dikemas kini daripada Word: ${esc(s.word.fail || '')} (${esc(R.fmtTime(s.word.masa || 0))})</div>` : ''}
      ${s.sumber && s.sumber.jenis !== 'templat' ? `<div class="tul-sumber">${s.sumber.jenis === 'banding' ? `Ditulis daripada Banding Artikel: ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukabanding="${esc(s.sumber.idA)}|${esc(s.sumber.idB)}">Buka Banding</button>` : s.sumber.jenis === 'artikel' ? `Berkaitan rekod ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukarekod="${esc(s.sumber.id)}">Buka rekod</button>` : s.sumber.jenis === 'word' ? `Dimuat naik daripada Word: ${esc(s.sumber.fail || '')} (${esc(R.fmtTime(s.sumber.masa || 0))})` : ''}</div>` : ''}
      <textarea id="tulTeks" class="tul-teks" placeholder="Taip perenggan di sini. Satu baris kosong memisahkan perenggan.">${esc(s.teks || '')}</textarea>
      <div class="tul-ed-foot"><span id="tulPatah">${s.patah || 0} patah perkataan</span><span id="tulStatus">${s.masa ? 'Disimpan ' + esc(R.fmtTime(s.masa)) : 'Belum disimpan'}</span>${s.sejarah && s.sejarah.length ? `<button class="btn btn-sm" data-sejarah="1">Versi sebelum muat naik (${s.sejarah.length})</button>` : ''}</div>`;
    const ta = $('#tulTeks'); const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(260, ta.scrollHeight + 4) + 'px'; }; grow();
    ta.addEventListener('input', () => { grow(); $('#tulPatah').textContent = patah(ta.value) + ' patah perkataan'; tulisSeksyen(n, T.sek, { teks: ta.value }, { senyap: true }); });
    $('#tulTajuk').addEventListener('input', e => { tulisSeksyen(n, T.sek, { tajuk: tanpaNombor(e.target.value) }, { senyap: true }); });
    $('#tulTajuk').addEventListener('change', () => renderSenarai());
    ta.addEventListener('blur', () => { renderSenarai(); renderBab(); });
  }
  function semuaSeksyen() { const out = []; BAB.forEach(([n]) => senarai(n).forEach(id => out.push({ n, id, s: doc(n).seksyen[id] }))); return out; }
  function renderSambung() {
    const el = $('#tulSambung'); if (!el) return;
    const semua = semuaSeksyen(); const terkini = semua.filter(x => x.s.masa && (x.s.patah || 0) > 0).sort((a, b) => (b.s.masa || 0) - (a.s.masa || 0)).slice(0, 5);
    const h = hariIni(); const sm = tarikhStr(Date.now() - 86400000);
    const logHari = tgl => BAB.map(([n]) => { const l = (doc(n).log || {})[tgl]; if (!l) return null; const semuaItem = Object.keys(l.seksyen || {}).sort((a, b) => Math.abs(l.seksyen[b]) - Math.abs(l.seksyen[a])).map(id => { const s = doc(n).seksyen[id]; return s ? `${esc(s.tajuk || 'Tanpa tajuk')} (${l.seksyen[id] >= 0 ? '+' : ''}${l.seksyen[id]})` : null; }).filter(Boolean); const items = semuaItem.slice(0, 8); if (semuaItem.length > 8) items.push('dan ' + (semuaItem.length - 8) + ' seksyen lagi'); return `Bab ${n}: ${l.patah >= 0 ? '+' : ''}${l.patah} patah${items.length ? ' dalam ' + items.join(', ') : ''}`; }).filter(Boolean);
    const lh = logHari(h), ls = logHari(sm);
    const pinjam = BAB.filter(([n]) => doc(n).pinjam).map(([n]) => `Bab ${n} (sejak ${esc(R.fmtTime(doc(n).pinjam.masa))})`);
    const seminggu = BAB.reduce((s, [n]) => { const lg = doc(n).log || {}; return s + Object.keys(lg).filter(k => Date.now() - new Date(k + 'T00:00:00').getTime() < 7 * 86400000).reduce((a, k) => a + (lg[k].patah || 0), 0); }, 0);
    el.innerHTML = `<div class="tul-sambung-grid">
      <div><h3>Sambung semula</h3>${terkini.length ? terkini.map(x => `<button class="tul-link" data-buka="${x.n}|${esc(x.id)}"><b>${esc((nombor(x.n)[x.id] || {}).no || '')} ${esc(x.s.tajuk || 'Tanpa tajuk')}</b> <span>Bab ${x.n} · ${esc(R.fmtTime(x.s.masa))} · ${x.s.patah || 0} patah</span></button>`).join('') : '<div class="help">Belum ada tulisan. Mulakan dengan seksyen pertama.</div>'}</div>
      <div><h3>Apa yang sudah ditulis</h3><div class="tul-log"><b>Hari ini:</b> ${lh.length ? esc(lh.join('; ')) : 'belum ada'}</div><div class="tul-log"><b>Semalam:</b> ${ls.length ? esc(ls.join('; ')) : 'tiada'}</div><div class="tul-log"><b>Tujuh hari terakhir:</b> ${seminggu >= 0 ? '+' : ''}${seminggu} patah perkataan; keseluruhan ${BAB.reduce((s, [n]) => s + jumlahPatah(n), 0)} patah dalam ${semua.length} seksyen.</div>${pinjam.length ? `<div class="tul-log amaran"><b>Peringatan:</b> ${pinjam.join(', ')} dimuat turun ke Word dan belum dimuat naik semula.</div>` : ''}${T.status.awan === 'gagal' ? '<div class="tul-log amaran"><b>Awan:</b> simpanan awan gagal; tulisan tersimpan pada peranti ini sahaja buat masa ini.</div>' : ''}</div></div></div>`;
  }
  function renderCari() {
    const el = $('#tulCariHasil'); if (!el) return; const q = (T.cari || '').trim().toLowerCase();
    if (q.length < 2) { el.hidden = true; el.innerHTML = ''; return; }
    const hits = semuaSeksyen().map(x => { const t = (x.s.tajuk || '') + '\n' + (x.s.teks || ''); const i = t.toLowerCase().indexOf(q); if (i < 0) return null; const a = Math.max(0, i - 90), b = Math.min(t.length, i + q.length + 120); return { x, snip: (a > 0 ? '... ' : '') + t.slice(a, i) + '[[' + t.slice(i, i + q.length) + ']]' + t.slice(i + q.length, b) + (b < t.length ? ' ...' : '') }; }).filter(Boolean);
    el.hidden = false;
    el.innerHTML = `<div class="help">${hits.length} seksyen mengandungi "${esc(q)}"</div>` + hits.map(h => `<button class="tul-link" data-buka="${h.x.n}|${esc(h.x.id)}"><b>${esc((nombor(h.x.n)[h.x.id] || {}).no || 'Bab ' + h.x.n)} ${esc(h.x.s.tajuk || 'Tanpa tajuk')}</b> <span>${esc(h.snip).replace(/\[\[/g, '<mark>').replace(/\]\]/g, '</mark>')}</span></button>`).join('');
  }
  function buka(n, id) { T.bab = n; T.sek = id; renderSemua(); const ta = $('#tulTeks'); if (ta) { ta.focus(); } }
  function peringatan() {
    const p = BAB.filter(([n]) => doc(n).pinjam);
    if (p.length) toast('Peringatan Tulisan: ' + p.map(([n]) => 'Bab ' + n).join(', ') + ' dimuat turun ke Word dan belum dimuat naik semula.', false, { label: 'Buka Tulisan', fn: () => R.goView('tulisan') });
  }

  /* ---- Word: penjanaan ---- */
  async function bundle() { if (!T.bundle) T.bundle = await import('../vendor/tulisan.bundle.js'); return T.bundle; }
  function runs(docx, teks) {
    const out = []; const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g; let last = 0; let m;
    while ((m = re.exec(teks))) { if (m.index > last) out.push(new docx.TextRun(teks.slice(last, m.index))); const t = m[0]; if (t.startsWith('**')) out.push(new docx.TextRun({ text: t.slice(2, -2), bold: true })); else out.push(new docx.TextRun({ text: t.slice(1, -1), italics: true })); last = m.index + t.length; }
    if (last < teks.length) out.push(new docx.TextRun(teks.slice(last)));
    return out.length ? out : [new docx.TextRun('')];
  }
  function perenggan(docx, teks) {
    const out = []; String(teks || '').replace(/\r/g, '').split(/\n\s*\n/).forEach(blok => {
      const b = blok.trim(); if (!b) return;
      const baris = b.split('\n'); const butir = baris.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l));
      if (butir) baris.forEach(l => out.push(new docx.Paragraph({ children: runs(docx, l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')), numbering: { reference: 'butir', level: 0 }, spacing: { line: 480 }, alignment: docx.AlignmentType.JUSTIFIED })));
      else out.push(new docx.Paragraph({ children: runs(docx, baris.join(' ')), spacing: { line: 480, after: 0 }, alignment: docx.AlignmentType.JUSTIFIED, indent: { firstLine: 720 } }));
    });
    return out;
  }
  async function janaDocx(babs) {
    const { docx } = await bundle(); const kids = [];
    babs.forEach((n, i) => {
      const d = doc(n); const ids = senarai(n);
      kids.push(new docx.Paragraph({ text: `BAB ${n}`, heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, pageBreakBefore: i > 0 }));
      kids.push(new docx.Paragraph({ text: String(d.tajuk || tajukBab(n)).toUpperCase(), heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, spacing: { after: 480 } }));
      if (!ids.length) kids.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '(Bab ini belum ada seksyen dalam sistem.)', italics: true })] }));
      const nb = nombor(n); const HL = [docx.HeadingLevel.HEADING_2, docx.HeadingLevel.HEADING_3, docx.HeadingLevel.HEADING_4];
      ids.forEach(id => { const s = d.seksyen[id]; const k = nb[id]; kids.push(new docx.Paragraph({ text: k.no + ' ' + (s.tajuk || 'Tanpa tajuk'), heading: HL[k.aras - 1], spacing: { before: 360, after: 120 } })); kids.push(...perenggan(docx, s.teks)); });
    });
    const d = new docx.Document({
      creator: 'Repositori SLR', title: 'Tulisan Tesis ' + babs.map(n => 'Bab ' + n).join(', '),
      styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } }, paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 0, after: 120 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, italics: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } }] },
      numbering: { config: [{ reference: 'butir', levels: [{ level: 0, format: docx.LevelFormat.BULLET, text: '•', alignment: docx.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 2160, right: 1440 } } }, footers: { default: new docx.Footer({ children: [new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [new docx.TextRun({ text: 'Tulisan Tesis, Repositori SLR, dijana ' + R.fmtTime(Date.now()) + '. Muat naik semula fail ini ke sistem selepas disunting.', size: 16, color: '777777' })] })] }) }, children: kids }]
    });
    return docx.Packer.toBlob(d);
  }
  function namaFail(babs) { const d = new Date(); const st = tarikhStr(d.getTime()) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0'); const b = babs.length === 1 ? 'Bab' + babs[0] + '_' + tajukBab(babs[0]).replace(/[^A-Za-z0-9]+/g, '_') : 'Bab' + babs[0] + '-' + babs[babs.length - 1]; return `Tesis_${b}_${st}.docx`; }
  async function muatTurun() {
    const html = `<p>Pilih bab untuk dimuat turun sebagai fail Word (.docx, Times New Roman 12, langkau dua, tajuk seksyen sebagai Heading 2).</p><select id="tulPilihBab" class="modal-in"><option value="${T.bab}">Bab ${T.bab} ${esc(tajukBab(T.bab))} (bab semasa)</option>${BAB.filter(([n]) => n !== T.bab).map(([n, t]) => `<option value="${n}">Bab ${n} ${esc(t)}</option>`).join('')}<option value="semua">Semua bab (Bab 1 hingga Bab 5) dalam satu fail</option></select><p class="help">Bab yang dimuat turun ditanda "dipinjam ke Word" sehingga fail itu dimuat naik semula, supaya Prof Dr diingatkan. Salinan fail disimpan dalam folder Tulisan di Google Drive.</p>`;
    const ok = await R.richModal('Muat turun Word', html, 'Muat turun', 'Batal'); if (!ok) return;
    const v = R.richModal.values.tulPilihBab; const babs = v === 'semua' ? BAB.map(x => x[0]) : [parseInt(v, 10)];
    toast('Menjana fail Word'); let blob;
    try { blob = await janaDocx(babs); } catch (e) { toast('Gagal menjana Word: ' + (e && e.message || e), true); return; }
    const nama = namaFail(babs); R.saveFile(nama, blob, MIME);
    let drive = false; try { if (R.drive().hasToken()) { const f = new File([blob], nama, { type: MIME }); const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); drive = !!(res && res.id); babs.forEach(n => { const d = doc(n); d.fail = [{ id: res.id, nama, masa: Date.now(), jenis: 'muatturun', saiz: blob.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); }); } } catch (e) { console.warn('tulisan: salinan Drive gagal', e); }
    for (const n of babs) { const d = doc(n); d.pinjam = { masa: Date.now(), fail: nama }; d.masa = Date.now(); await simpanAwan(n, { pinjam: d.pinjam, fail: d.fail || [], masa: d.masa }); }
    renderSemua(); toast(`Fail ${nama} dimuat turun${drive ? ' dan salinan disimpan dalam folder Tulisan di Drive' : ' (Drive tidak disambung; salinan tidak disimpan)'}. Muat naik semula selepas disunting.`);
  }

  /* ---- Word: pembacaan dan gabungan ---- */
  function teksNod(node) {
    let out = '';
    node.childNodes.forEach(c => {
      if (c.nodeType === 3) { out += c.nodeValue; return; }
      if (c.nodeType !== 1) return; const tag = c.tagName.toLowerCase(); const dalam = teksNod(c);
      if (tag === 'strong' || tag === 'b') out += dalam.trim() ? '**' + dalam.trim() + '**' + (/\s$/.test(dalam) ? ' ' : '') : dalam;
      else if (tag === 'em' || tag === 'i') out += dalam.trim() ? '*' + dalam.trim() + '*' + (/\s$/.test(dalam) ? ' ' : '') : dalam;
      else if (tag === 'br') out += '\n';
      else out += dalam;
    });
    return out;
  }
  function huraiHtml(html, namaFail) {
    const dom = new DOMParser().parseFromString(html, 'text/html'); const kumpulan = []; let semasa = null; let sek = null;
    const bukaKumpulan = (bab, tajuk) => { semasa = { bab, tajuk, seksyen: [] }; kumpulan.push(semasa); sek = null; };
    const tambahBlok = teks => { teks = teks.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); if (!teks) return; if (!semasa) bukaKumpulan(null, ''); if (!sek) { sek = { tajuk: 'Tanpa tajuk (' + namaFail.replace(/\.docx$/i, '') + ')', teks: '' }; semasa.seksyen.push(sek); } sek.teks += (sek.teks ? '\n\n' : '') + teks; };
    Array.from(dom.body.children).forEach(el => {
      const tag = el.tagName.toLowerCase(); const t = teksNod(el).replace(/\s+/g, ' ').trim();
      if (tag === 'h1') { const m = /^\s*bab\s*(\d)\b[\s.:-]*(.*)$/i.exec(t); if (m) { const n = parseInt(m[1], 10); if (semasa && semasa.bab === n && !semasa.seksyen.length) { if (m[2]) semasa.tajuk = m[2]; } else bukaKumpulan(n, m[2] || ''); return; } if (semasa && !semasa.tajuk && !semasa.seksyen.length && semasa.bab) { semasa.tajuk = t; return; } if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: tanpaNombor(t), aras: 1, teks: '' }; semasa.seksyen.push(sek); return; }
      if (tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5') { if (!t) return; if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: tanpaNombor(t), aras: Math.min(ARAS_MAKS, { h2: 1, h3: 2, h4: 3, h5: 3 }[tag]), teks: '' }; semasa.seksyen.push(sek); return; }
      if (tag === 'p') { tambahBlok(teksNod(el)); return; }
      if (tag === 'ul' || tag === 'ol') { tambahBlok(Array.from(el.querySelectorAll('li')).map(li => '- ' + teksNod(li).replace(/\s+/g, ' ').trim()).join('\n')); return; }
      if (tag === 'table') { tambahBlok(Array.from(el.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => teksNod(td).replace(/\s+/g, ' ').trim()).join(' | ')).join('\n')); return; }
      if (t) tambahBlok(t);
    });
    kumpulan.forEach(k => { k.seksyen = k.seksyen.filter(s => s.tajuk || s.teks.trim()); k.seksyen.forEach(s => { s.teks = s.teks.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }); });
    return kumpulan.filter(k => k.seksyen.length);
  }
  function babDariNama(nama) { const m = /bab[\s_-]*(\d)/i.exec(nama || ''); return m ? parseInt(m[1], 10) : null; }
  async function muatNaik(files) {
    files = Array.from(files || []).filter(f => /\.docx$/i.test(f.name)); if (!files.length) { toast('Pilih fail Word (.docx)', true); return; }
    let lib; try { lib = await bundle(); } catch (e) { toast('Pembaca Word gagal dimuatkan; semak talian internet.', true); return; }
    for (const f of files) {
      let html; try { const ab = await f.arrayBuffer(); html = (await lib.mammoth.convertToHtml({ arrayBuffer: ab })).value; } catch (e) { toast('Fail ' + f.name + ' tidak dapat dibaca sebagai Word: ' + (e && e.message || e), true); continue; }
      const kumpulan = huraiHtml(html, f.name);
      if (!kumpulan.length) { toast('Fail ' + f.name + ' tidak mengandungi teks yang dapat dibaca', true); continue; }
      const tekaNama = babDariNama(f.name);
      for (const k of kumpulan) {
        let n = k.bab || (kumpulan.length === 1 ? tekaNama : null);
        if (!n) { const okk = await R.richModal('Bab untuk ' + f.name, `<p>Bab tidak dapat dikenal pasti daripada tajuk "Bab N" atau nama fail. Pilih bab bagi ${k.seksyen.length} seksyen ini (${esc(k.seksyen.map(s => s.tajuk).slice(0, 3).join('; '))}${k.seksyen.length > 3 ? '; ...' : ''}).</p><select id="tulBabPilih" class="modal-in">${BAB.map(([b, t]) => `<option value="${b}"${b === T.bab ? ' selected' : ''}>Bab ${b} ${esc(t)}</option>`).join('')}</select>`, 'Teruskan', 'Langkau'); if (!okk) continue; n = parseInt(R.richModal.values.tulBabPilih, 10); }
        await gabungWord(n, k, f);
      }
    }
    renderSemua();
  }
  async function gabungWord(n, k, f) {
    const d = doc(n); const ids = senarai(n); const dipakai = new Set();
    const padan = s => { const nt = norm(s.tajuk); let id = ids.find(x => !dipakai.has(x) && norm(d.seksyen[x].tajuk) === nt && nt); if (!id && nt) id = ids.find(x => !dipakai.has(x) && (norm(d.seksyen[x].tajuk).startsWith(nt) || nt.startsWith(norm(d.seksyen[x].tajuk))) && norm(d.seksyen[x].tajuk)); if (id) dipakai.add(id); return id || null; };
    const failMasa = f.lastModified || Date.now();
    const baris = k.seksyen.map((s, i) => { const id = padan(s); const lama = id ? d.seksyen[id] : null; const sama = lama && (lama.teks || '').trim() === s.teks.trim(); const sistemBaharu = lama && (lama.teks || '').trim() && (lama.masa || 0) > failMasa + 60000 && !sama; return { i, s, id, lama, status: !lama ? 'baharu' : sama ? 'sama' : 'ubah', sistemBaharu, pilih: !lama || (!sama && !sistemBaharu) }; });
    const tiada = ids.filter(id => !dipakai.has(id));
    const adaAmaran = baris.some(b => b.sistemBaharu);
    const html = `<p>Fail <b>${esc(f.name)}</b> (diubah ${esc(R.fmtTime(failMasa))}) dibaca untuk <b>Bab ${n} ${esc(d.tajuk || tajukBab(n))}</b>: ${k.seksyen.length} seksyen. Tanda seksyen yang mahu dimasukkan ke sistem.</p>
      ${adaAmaran ? '<p class="tul-amaran">Amaran: sesetengah seksyen disunting dalam sistem SELEPAS fail Word ini diubah. Seksyen itu tidak ditanda supaya tulisan terbaru dalam sistem tidak ditimpa; tanda sendiri jika Prof Dr pasti fail Word lebih lengkap.</p>' : ''}
      <div class="tul-gabung">${baris.map(b => `<label class="tul-gabung-row"><input type="checkbox" id="tulPilih_${b.i}"${b.pilih ? ' checked' : ''}${b.status === 'sama' ? ' disabled' : ''}><span class="st ${b.status}">${b.status === 'baharu' ? 'Baharu' : b.status === 'sama' ? 'Sama' : 'Dikemas kini'}</span><span class="tj">${esc(b.s.tajuk || 'Tanpa tajuk')}</span><span class="mt">${b.lama ? (b.lama.patah || 0) + ' patah dalam sistem' + (b.lama.masa ? ' (' + esc(R.fmtTime(b.lama.masa)) + ')' : '') + ' → ' : ''}${patah(b.s.teks)} patah dalam Word${b.sistemBaharu ? ' · <b>sistem lebih baharu</b>' : ''}</span></label>`).join('')}</div>
      ${tiada.length ? `<p class="help">${tiada.length} seksyen dalam sistem tiada dalam fail Word ini dan dikekalkan: ${esc(tiada.map(id => d.seksyen[id].tajuk || 'Tanpa tajuk').join('; '))}.</p>` : ''}
      <p class="help">Versi lama setiap seksyen yang ditimpa disimpan dalam sistem (butang "Versi sebelum muat naik") dan fail Word ini diarkibkan dalam folder Tulisan di Google Drive.</p>`;
    const okk = await R.richModal('Muat naik Word: pratonton gabungan', html, 'Masukkan ke sistem', 'Batal'); if (!okk) return;
    const v = R.richModal.values; let dikemas = 0, baru = 0; const masaKini = Date.now();
    baris.forEach(b => {
      if (b.status === 'sama' || !v['tulPilih_' + b.i]) return;
      if (b.id) { const lama = d.seksyen[b.id]; lama.sejarah = [{ masa: lama.masa || 0, teks: lama.teks || '' }].concat(lama.sejarah || []).slice(0, 3); tulisSeksyen(n, b.id, Object.assign({ teks: b.s.teks, word: { fail: f.name, masa: masaKini } }, b.s.aras ? { aras: b.s.aras } : {}), { senyap: true }); dikemas++; }
      else { const idb = seksyenBaru(n, b.s.tajuk, b.s.teks, { jenis: 'word', fail: f.name, masa: masaKini }); if (b.s.aras && b.s.aras > 1) d.seksyen[idb].aras = b.s.aras; baru++; }
    });
    let drive = false;
    try { if (R.drive().hasToken()) { const nama = f.name.replace(/\.docx$/i, '') + '_dimuatnaik_' + tarikhStr(masaKini) + '.docx'; const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); if (res && res.id) { drive = true; d.fail = [{ id: res.id, nama, masa: masaKini, jenis: 'muatnaik', saiz: f.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); } } } catch (e) { console.warn('tulisan: arkib Drive gagal', e); }
    d.pinjam = null; d.masa = masaKini; Object.keys(T.timers).forEach(k => { clearTimeout(T.timers[k]); });
    await simpanAwan(n, { seksyen: d.seksyen, susunan: d.susunan, log: d.log, pinjam: null, fail: d.fail || [], masa: d.masa });
    T.bab = n; toast(`Bab ${n}: ${dikemas} seksyen dikemas kini, ${baru} seksyen baharu daripada ${f.name}${drive ? '; fail diarkibkan di Drive' : ''}.`);
  }
  async function sejarahModal(n, id) {
    const s = doc(n).seksyen[id]; const html = (s.sejarah || []).map((h, i) => `<details${i === 0 ? ' open' : ''}><summary>Versi ${i + 1}: ${esc(R.fmtTime(h.masa))}, ${patah(h.teks)} patah</summary><pre class="tul-pre">${esc(h.teks)}</pre><button class="btn btn-sm" data-pulih="${i}">Pulihkan versi ini</button></details>`).join('');
    const modal = $('#modalText'); const onClick = e => { const b = e.target.closest('[data-pulih]'); if (!b) return; const h = s.sejarah[+b.dataset.pulih]; s.sejarah = [{ masa: s.masa || 0, teks: s.teks || '' }].concat(s.sejarah).slice(0, 3); tulisSeksyen(n, id, { teks: h.teks }, { segera: true }); $('#modalOk').click(); renderSemua(); toast('Versi dipulihkan'); };
    modal.addEventListener('click', onClick); await R.richModal('Versi sebelum muat naik', html || '<p>Tiada versi tersimpan.</p>', 'Tutup'); modal.removeEventListener('click', onClick);
  }

  /* ---- daripada Banding dan rekod ---- */
  function daripadaBanding(n, tajuk, teks, idA, idB, label) { const id = seksyenBaru(n || 2, tajuk, teks, { jenis: 'banding', idA, idB, label }); T.bab = n || 2; T.sek = id; return id; }

  /* ---- seret dan lepas (tetikus dan sentuh): pegang, seret, lepas; bingkai menunjukkan tempat seksyen akan diletakkan ---- */
  function seretLepas(list) {
    if (!list) return; let st = null;
    const bingkai = document.createElement('div'); bingkai.className = 'tul-drop'; bingkai.innerHTML = '<span>Letak di sini</span>';
    const items = () => Array.from(list.querySelectorAll('.tul-item'));
    const mula = () => {
      st.aktif = true; document.body.classList.add('tul-seret'); st.el.classList.add('dragging');
      st.ghost = st.el.cloneNode(true); st.ghost.className = 'tul-ghost'; st.ghost.style.width = st.el.offsetWidth + 'px'; document.body.appendChild(st.ghost);
      bingkai.style.height = st.el.offsetHeight + 'px'; gerakGhost(st.x, st.y); letakBingkai(st.y);
    };
    const gerakGhost = (x, y) => { if (st && st.ghost) { st.ghost.style.left = (x - st.dx) + 'px'; st.ghost.style.top = (y - st.dy) + 'px'; } };
    const letakBingkai = y => {
      const arr = items().filter(it => it !== st.el); let idx = arr.length;
      for (let i = 0; i < arr.length; i++) { const r = arr[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { idx = i; break; } }
      st.indeks = idx; const ref = arr[idx] || null; if (bingkai.parentNode !== list || bingkai.nextSibling !== ref) list.insertBefore(bingkai, ref);
      const lr = list.getBoundingClientRect(); if (y < lr.top + 28) list.scrollTop -= 8; else if (y > lr.bottom - 28) list.scrollTop += 8;
    };
    const tamat = (batal) => {
      if (!st) return; clearTimeout(st.timer);
      if (st.aktif) {
        document.body.classList.remove('tul-seret'); st.el.classList.remove('dragging'); if (st.ghost) st.ghost.remove();
        const arr = items().filter(it => it !== st.el); const idx = Math.min(st.indeks, arr.length); if (bingkai.parentNode) bingkai.remove();
        if (!batal) { const ids = senarai(T.bab); const target = idx >= arr.length ? ids.length : ids.indexOf(arr[idx].dataset.sek); if (target >= 0) susunSemula(T.bab, st.id, target); }
        const el = st.el; el.dataset.sekat = '1'; setTimeout(() => { delete el.dataset.sekat; }, 50);
      }
      st = null;
    };
    list.addEventListener('pointerdown', e => {
      const it = e.target.closest('.tul-item'); if (!it || e.button > 0 || e.target.closest('button')) return;
      const r = it.getBoundingClientRect(); st = { el: it, id: it.dataset.sek, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, aktif: false, indeks: 0, grip: !!e.target.closest('.tul-grip'), ptr: e.pointerId };
      try { it.setPointerCapture(e.pointerId); } catch (er) {}
      if (!st.grip && e.pointerType !== 'mouse') st.timer = setTimeout(() => { if (st && !st.aktif) mula(); }, 320);
    });
    list.addEventListener('pointermove', e => {
      if (!st) return; st.x = e.clientX; st.y = e.clientY;
      if (!st.aktif) { const d = Math.hypot(e.clientX - st.x0, e.clientY - st.y0); if (d > 6) { if (st.grip || e.pointerType === 'mouse') mula(); else { clearTimeout(st.timer); st = null; } } return; }
      e.preventDefault(); gerakGhost(e.clientX, e.clientY); letakBingkai(e.clientY);
    });
    list.addEventListener('pointerup', () => tamat(false));
    list.addEventListener('pointercancel', () => tamat(true));
    list.addEventListener('touchmove', e => { if (st && st.aktif) e.preventDefault(); }, { passive: false });
    list.addEventListener('click', e => { const it = e.target.closest('.tul-item'); if (it && it.dataset.sekat) { e.stopPropagation(); } }, true);
  }

  /* ---- peristiwa ---- */
  const root = $('#tulisan');
  if (root) {
    root.addEventListener('click', async e => {
      const tab = e.target.closest('[data-bab]'); if (tab) { T.bab = +tab.dataset.bab; T.sek = null; renderSemua(); return; }
      const it = e.target.closest('[data-sek]'); if (it) { T.sek = it.dataset.sek; renderSenarai(); renderEditor(); return; }
      const bk = e.target.closest('[data-buka]'); if (bk) { const [n, id] = bk.dataset.buka.split('|'); buka(+n, id); return; }
      const gb = e.target.closest('[data-gabung]'); if (gb) { const [n, id] = gb.dataset.gabung.split('|'); gabungModal(+n, id); return; }
      const ps = e.target.closest('[data-padamsm]'); if (ps) { const [n, id] = ps.dataset.padamsm.split('|'); const sk = doc(+n).seksyen[id]; if (!sk) return; const okk = await R.confirmBox('Padam seksyen?', `"${sk.tajuk || 'Tanpa tajuk'}" (${sk.patah || 0} patah) akan dipadam daripada Bab ${n}.`, 'Padam'); if (okk) { padamSeksyen(+n, id); renderSemua(); } return; }
      const ar = e.target.closest('[data-aras]'); if (ar) { e.stopPropagation(); if (!ar.disabled) { T.sek = ar.dataset.id; ubahAras(T.bab, ar.dataset.id, +ar.dataset.aras); } return; }
      const ae = e.target.closest('[data-arased]'); if (ae) { if (!ae.disabled) ubahAras(T.bab, T.sek, +ae.dataset.arased); return; }
      const g = e.target.closest('[data-gerak]'); if (g) { gerak(T.bab, T.sek, +g.dataset.gerak); return; }
      if (e.target.closest('[data-salin]')) { try { await navigator.clipboard.writeText($('#tulTeks').value); toast('Teks seksyen disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
      if (e.target.closest('[data-padamsek]')) { const s = doc(T.bab).seksyen[T.sek]; const okk = await R.confirmBox('Padam seksyen?', `"${s.tajuk || 'Tanpa tajuk'}" (${s.patah || 0} patah) akan dipadam daripada Bab ${T.bab}.`, 'Padam'); if (okk) { padamSeksyen(T.bab, T.sek); renderSemua(); } return; }
      if (e.target.closest('[data-sejarah]')) { sejarahModal(T.bab, T.sek); return; }
      const pt = e.target.closest('[data-pinjamtutup]'); if (pt) { const n = +pt.dataset.pinjamtutup; const d = doc(n); d.pinjam = null; d.masa = Date.now(); await simpanAwan(n, { pinjam: null, masa: d.masa }); renderSemua(); return; }
      if (e.target.closest('[data-tulnaik]')) { $('#tulFail').click(); return; }
      const bb = e.target.closest('[data-bukabanding]'); if (bb) { const [a, b] = bb.dataset.bukabanding.split('|'); R.Banding.state.a = a; R.Banding.state.b = b; R.goView('banding'); R.Banding.banding(); return; }
      const br = e.target.closest('[data-bukarekod]'); if (br) { R.openRecord(br.dataset.bukarekod); }
    });
    root.addEventListener('keydown', e => { const it = e.target.closest('[data-sek]'); if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); T.sek = it.dataset.sek; renderSenarai(); renderEditor(); } });
    $('#btnTulTemplat').addEventListener('click', async () => { const n = T.bab; const ada = new Set(senarai(n).map(id => norm(doc(n).seksyen[id].tajuk))); const kurang = (TEMPLAT[n] || []).filter(([a, t]) => !ada.has(norm(t))).length; if (!kurang) { toast('Semua subtopik proposal Bab ' + n + ' sudah ada dalam senarai'); return; } const okk = await R.confirmBox('Masukkan subtopik proposal?', `${kurang} subtopik Bab ${n} yang belum ada akan ditambah di hujung senarai (seksyen sedia ada tidak disentuh). Susun semula dengan seret dan lepas selepas itu.`, 'Masukkan', false); if (!okk) return; const j = isiTemplat(n); renderSemua(); toast(j + ' subtopik dimasukkan ke Bab ' + n); });
    seretLepas($('#tulSenarai'));
    $('#btnTulSeksyen').addEventListener('click', () => { const id = seksyenBaru(T.bab, '', ''); T.sek = id; renderSemua(); const tj = $('#tulTajuk'); if (tj) tj.focus(); });
    $('#btnTulTurun').addEventListener('click', () => muatTurun());
    $('#btnTulNaik').addEventListener('click', () => $('#tulFail').click());
    $('#tulFail').addEventListener('change', e => { const fs = e.target.files; muatNaik(fs); e.target.value = ''; });
    $('#tulCari').addEventListener('input', e => { T.cari = e.target.value; renderCari(); });
  }
  return { show, muatTurun, muatNaik, daripadaBanding, muatSemua, peringatan, huraiHtml, nombor, ubahAras, susunSemula, isiTemplat, gabungSeksyen, renderSemalam, hariAktifTerakhir, TEMPLAT, state: T, BAB };
}
