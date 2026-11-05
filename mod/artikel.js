/* Artikel Penerbitan: ruang menulis artikel jurnal dan persidangan daripada artikel yang sudah ada dalam repositori. Setiap artikel
   penerbitan mempunyai jenis (senarai jenis artikel akademik), sehingga 15 artikel sumber daripada repositori (dengan meter kelengkapan
   Bahagian A hingga F dan butang ke rekod), soal jawab pasangan artikel (sehingga 10 soalan yang dijawab agen berdasarkan medan A hingga F
   kedua-dua rekod, laporan Agen Banding sedia ada dan soalan terdahulu), dan seksyen dengan editor ASAL dan RAM yang sama seperti Tulisan
   Tesis (kilang initTulisan dengan konfigurasi artikel: tiada Bab 1 hingga Bab 5, hanya seksyen). Simpanan: meta/penerbitan_indeks
   (senarai artikel) dan meta/penerbitan_<id> (seksyen, jenis, sumber, soalan), berserta salinan tempatan. */
export function initArtikel(R, initTulisan) {
  const { $, $$, esc, toast } = R;
  const A = { indeks: null, id: null, busy: false, laporan: null, laporanKunci: '' };
  const HAD_SUMBER = 15, HAD_SOALAN = 10;
  const KUNCI_INDEKS = 'meta/penerbitan_indeks', LS_INDEKS = 'rslr_penerbitan_indeks', LS_SEMASA = 'rslr_penerbitan_semasa';

  /* ---- jenis artikel: kod, nama, keterangan ringkas ---- */
  const JENIS = [
    ['Artikel empirikal', [
      ['emp-kuantitatif', 'Kajian kuantitatif (tinjauan, keratan rentas)', 'Ujian hipotesis dengan data soal selidik atau ujian; SEM, regresi, ANOVA.'],
      ['emp-kualitatif', 'Kajian kualitatif (temu bual, fenomenologi, teori beralas)', 'Makna dan pengalaman peserta; analisis tematik, naratif atau teori beralas.'],
      ['emp-campuran', 'Kajian kaedah campuran', 'Gabungan kuantitatif dan kualitatif dalam satu reka bentuk (penerangan berurutan, penerokaan berurutan, selari serentak).'],
      ['emp-eksperimen', 'Eksperimen atau kuasi-eksperimen', 'Intervensi dengan kumpulan rawatan dan kawalan, ujian pra dan pasca.'],
      ['emp-kes', 'Kajian kes', 'Penerokaan mendalam satu atau beberapa kes dalam konteks sebenar.'],
      ['emp-longitudinal', 'Kajian longitudinal atau panel', 'Pengukuran berulang pada masa berbeza untuk melihat perubahan.'],
      ['emp-tindakan', 'Kajian tindakan', 'Kitaran rancang, bertindak, perhati dan refleksi oleh pengamal.'],
      ['emp-instrumen', 'Pembangunan dan pengesahan instrumen', 'Penjanaan item, kesahan kandungan, EFA, CFA, kebolehpercayaan.'],
      ['emp-dbr', 'Penyelidikan reka bentuk dan pembangunan (DBR, DDR)', 'Pembangunan produk atau modul dengan fasa analisis, reka bentuk, pembangunan dan penilaian.'],
      ['emp-sekunder', 'Analisis data sekunder', 'Analisis semula pangkalan data sedia ada (contohnya TALIS, PISA, data kementerian).']
    ]],
    ['Artikel ulasan dan sintesis', [
      ['ul-sistematik', 'Ulasan sistematik (SLR)', 'Carian berprotokol, penilaian kualiti dan sintesis bukti bagi soalan ulasan yang khusus (PRISMA 2020).'],
      ['ul-skop', 'Ulasan skop (scoping review)', 'Pemetaan keluasan bukti, konsep dan jurang tanpa penilaian kualiti wajib (PRISMA-ScR, JBI).'],
      ['ul-meta', 'Meta-analisis', 'Penggabungan statistik saiz kesan kajian terdahulu dengan heterogeniti dan bias penerbitan.'],
      ['ul-metasintesis', 'Sintesis meta kualitatif (meta-synthesis, meta-ethnography)', 'Sintesis dapatan kajian kualitatif menjadi tema aras tinggi.'],
      ['ul-naratif', 'Ulasan naratif atau tradisional', 'Tinjauan literatur bertema tanpa protokol carian yang ketat.'],
      ['ul-bersepadu', 'Ulasan bersepadu (integrative review)', 'Sintesis bukti empirikal dan teori daripada pelbagai reka bentuk.'],
      ['ul-kritikal', 'Ulasan kritikal', 'Penilaian kritis badan literatur dengan hujah dan kedudukan penulis.'],
      ['ul-payung', 'Ulasan payung (umbrella review)', 'Ulasan terhadap ulasan sistematik dan meta-analisis sedia ada.'],
      ['ul-pantas', 'Ulasan pantas (rapid review)', 'Ulasan sistematik yang dipermudah untuk keperluan dasar yang segera.'],
      ['ul-realis', 'Sintesis realis', 'Konfigurasi konteks, mekanisme dan hasil bagi intervensi.'],
      ['ul-pemetaan', 'Pemetaan sistematik (systematic mapping)', 'Pengelasan dan taburan kajian dalam sesuatu bidang.'],
      ['ul-bibliometrik', 'Analisis bibliometrik', 'Analisis prestasi dan pemetaan sains (petikan bersama, kata kunci, pengarang) daripada pangkalan data.']
    ]],
    ['Artikel konseptual dan teori', [
      ['kon-konseptual', 'Kertas konseptual', 'Hujah konseptual yang membina proposisi baharu daripada literatur tanpa data primer.'],
      ['kon-teori', 'Kertas pembangunan teori atau model', 'Mencadangkan teori atau model baharu dengan proposisi yang boleh diuji.'],
      ['kon-kerangka', 'Kertas kerangka (framework paper)', 'Kerangka kerja atau kerangka konseptual untuk amalan atau penyelidikan.'],
      ['kon-kedudukan', 'Kertas kedudukan (position paper)', 'Pendirian tentang isu dengan hujah dan bukti sokongan.'],
      ['kon-perspektif', 'Perspektif, pandangan atau esei kritis', 'Pandangan pakar yang mencabar atau memperluas wacana semasa.']
    ]],
    ['Artikel metodologi', [
      ['met-metodologi', 'Kertas metodologi', 'Membangunkan, menilai atau menambah baik kaedah penyelidikan atau analisis.'],
      ['met-protokol', 'Protokol kajian (study protocol)', 'Rancangan kajian yang diterbitkan sebelum data dikutip.'],
      ['met-replikasi', 'Kajian replikasi', 'Mengulang kajian terdahulu dalam konteks atau sampel lain.'],
      ['met-psikometrik', 'Nota psikometrik atau pengesahan silang budaya', 'Pengesahan instrumen dalam bahasa atau budaya lain; invarians pengukuran.']
    ]],
    ['Lain-lain', [
      ['lain-persidangan', 'Kertas persidangan (prosiding)', 'Kertas penuh atau ringkas untuk pembentangan persidangan.'],
      ['lain-ringkas', 'Komunikasi ringkas atau laporan pendek', 'Dapatan awal atau nota penyelidikan yang padat.'],
      ['lain-kes', 'Laporan kes', 'Huraian satu kes dengan pengajaran yang boleh dipindahkan.'],
      ['lain-dasar', 'Ringkasan dasar (policy brief) atau kertas putih', 'Bukti dan cadangan untuk pembuat dasar.'],
      ['lain-teknikal', 'Laporan teknikal', 'Laporan terperinci prosedur dan hasil untuk organisasi atau penaja.'],
      ['lain-data', 'Kertas data (data paper)', 'Menghuraikan set data yang dikongsi dan nilai guna semulanya.'],
      ['lain-editorial', 'Editorial atau komentar', 'Ulasan ringkas editor atau pakar tentang isu atau artikel.'],
      ['lain-surat', 'Surat kepada editor', 'Maklum balas ringkas terhadap artikel yang diterbitkan.'],
      ['lain-ulasanbuku', 'Ulasan buku', 'Penilaian kritis sebuah buku akademik.'],
      ['lain-bab', 'Bab buku', 'Bab dalam buku suntingan.'],
      ['lain-popular', 'Artikel popular atau majalah profesional', 'Tulisan untuk pengamal dan umum tanpa aparatus akademik penuh.'],
      ['lain-tesis', 'Artikel daripada tesis (thesis-to-article)', 'Satu bab atau dapatan tesis yang diolah menjadi artikel jurnal.']
    ]]
  ];
  const JENIS_PETA = {}; JENIS.forEach(([kump, items]) => items.forEach(([kod, nama, ket]) => { JENIS_PETA[kod] = { kod, nama, ket, kump }; }));
  const namaJenis = kod => JENIS_PETA[kod] ? JENIS_PETA[kod].nama : '';

  /* ---- struktur lazim mengikut jenis (pilihan, boleh diubah suai) ---- */
  const S_EMP = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Sorotan Literatur'], [2, 'Kerangka Teori'], [2, 'Pembangunan Hipotesis'], [1, 'Metodologi'], [2, 'Reka Bentuk Kajian'], [2, 'Populasi, Sampel dan Persampelan'], [2, 'Instrumen Kajian'], [2, 'Prosedur Pengumpulan Data'], [2, 'Analisis Data'], [1, 'Dapatan'], [1, 'Perbincangan'], [2, 'Implikasi Teori'], [2, 'Implikasi Amalan'], [2, 'Batasan dan Cadangan Kajian Lanjutan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_KUAL = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Sorotan Literatur'], [1, 'Metodologi'], [2, 'Reka Bentuk dan Pendekatan'], [2, 'Peserta dan Latar Kajian'], [2, 'Pengumpulan Data'], [2, 'Analisis Data'], [2, 'Kebolehpercayaan dan Kesahan'], [1, 'Dapatan'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_INSTR = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Sorotan Literatur dan Kerangka Konstruk'], [1, 'Metodologi'], [2, 'Fasa 1: Penjanaan Item dan Kesahan Kandungan'], [2, 'Fasa 2: Kajian Rintis dan Analisis Faktor Penerokaan'], [2, 'Fasa 3: Analisis Faktor Pengesahan dan Kesahan Konstruk'], [1, 'Dapatan'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_ULASAN = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kaedah'], [2, 'Protokol dan Pendaftaran'], [2, 'Kriteria Kelayakan'], [2, 'Sumber Maklumat dan Strategi Carian'], [2, 'Pemilihan Sumber Bukti'], [2, 'Pencarteran Data'], [2, 'Sintesis Dapatan'], [1, 'Dapatan'], [2, 'Pemilihan Sumber Bukti'], [2, 'Ciri Sumber Bukti'], [2, 'Sintesis Dapatan'], [1, 'Perbincangan'], [2, 'Rumusan Bukti'], [2, 'Batasan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_META = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kaedah'], [2, 'Kriteria Kelayakan'], [2, 'Strategi Carian'], [2, 'Pengekstrakan Data'], [2, 'Penilaian Kualiti dan Risiko Bias'], [2, 'Analisis Statistik'], [1, 'Dapatan'], [2, 'Kesan Keseluruhan'], [2, 'Heterogeniti dan Analisis Subkumpulan'], [2, 'Bias Penerbitan'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_NARATIF = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Latar Belakang'], [1, 'Tema 1'], [1, 'Tema 2'], [1, 'Tema 3'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_BIBLIO = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kaedah'], [2, 'Sumber Data dan Strategi Carian'], [2, 'Analisis Prestasi'], [2, 'Pemetaan Sains'], [1, 'Dapatan'], [2, 'Taburan Penerbitan dan Petikan'], [2, 'Pengarang, Institusi dan Negara'], [2, 'Analisis Kata Kunci dan Tema'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_KONSEP = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Latar Belakang Konsep'], [1, 'Asas Teori'], [1, 'Cadangan Model atau Kerangka'], [1, 'Proposisi'], [1, 'Implikasi'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_METOD = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Masalah Metodologi'], [1, 'Kaedah yang Dicadangkan'], [1, 'Ilustrasi dan Contoh'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_PROTOKOL = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Objektif dan Hipotesis'], [1, 'Kaedah'], [2, 'Reka Bentuk'], [2, 'Sampel'], [2, 'Instrumen'], [2, 'Analisis'], [1, 'Pertimbangan Etika'], [1, 'Jangkaan Hasil dan Penyebaran'], [1, 'Rujukan']];
  const S_REPLIKASI = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kajian Asal'], [1, 'Kaedah Replikasi'], [1, 'Dapatan'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_PENDEK = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kaedah'], [1, 'Dapatan'], [1, 'Perbincangan'], [1, 'Rujukan']];
  const S_KES = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Latar Belakang Kes'], [1, 'Huraian Kes'], [1, 'Perbincangan'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_DASAR = [[1, 'Ringkasan Eksekutif'], [1, 'Isu'], [1, 'Bukti'], [1, 'Pilihan Dasar'], [1, 'Cadangan'], [1, 'Rujukan']];
  const S_TEKNIKAL = [[1, 'Ringkasan'], [1, 'Pengenalan'], [1, 'Kaedah'], [1, 'Hasil'], [1, 'Cadangan'], [1, 'Rujukan']];
  const S_DATA = [[1, 'Abstrak'], [1, 'Pengenalan'], [1, 'Kaedah Pengumpulan Data'], [1, 'Huraian Set Data'], [1, 'Nilai Guna Semula'], [1, 'Rujukan']];
  const S_ESEI = [[1, 'Pengenalan'], [1, 'Hujah Utama'], [1, 'Kesimpulan'], [1, 'Rujukan']];
  const S_BAB = [[1, 'Pengenalan'], [1, 'Latar Belakang'], [1, 'Perbincangan'], [1, 'Rumusan'], [1, 'Rujukan']];
  const STRUKTUR = { 'emp-kuantitatif': S_EMP, 'emp-campuran': S_EMP, 'emp-eksperimen': S_EMP, 'emp-longitudinal': S_EMP, 'emp-sekunder': S_EMP, 'emp-tindakan': S_KUAL, 'emp-kes': S_KUAL, 'emp-kualitatif': S_KUAL, 'emp-instrumen': S_INSTR, 'emp-dbr': S_EMP, 'met-psikometrik': S_INSTR,
    'ul-sistematik': S_ULASAN, 'ul-skop': S_ULASAN, 'ul-pemetaan': S_ULASAN, 'ul-pantas': S_ULASAN, 'ul-payung': S_ULASAN, 'ul-bersepadu': S_ULASAN, 'ul-metasintesis': S_ULASAN, 'ul-realis': S_ULASAN, 'ul-meta': S_META, 'ul-naratif': S_NARATIF, 'ul-kritikal': S_NARATIF, 'ul-bibliometrik': S_BIBLIO,
    'kon-konseptual': S_KONSEP, 'kon-teori': S_KONSEP, 'kon-kerangka': S_KONSEP, 'kon-kedudukan': S_ESEI, 'kon-perspektif': S_ESEI, 'met-metodologi': S_METOD, 'met-protokol': S_PROTOKOL, 'met-replikasi': S_REPLIKASI,
    'lain-persidangan': S_PENDEK, 'lain-ringkas': S_PENDEK, 'lain-kes': S_KES, 'lain-dasar': S_DASAR, 'lain-teknikal': S_TEKNIKAL, 'lain-data': S_DATA, 'lain-editorial': S_ESEI, 'lain-surat': S_ESEI, 'lain-ulasanbuku': S_ESEI, 'lain-bab': S_BAB, 'lain-popular': S_ESEI, 'lain-tesis': S_EMP };

  /* ---- cadangan soalan pantas ---- */
  const CADANGAN = [
    'Apakah pola persamaan dan perbezaan utama antara kedua-dua artikel dari segi objektif, konstruk dan kerangka teori?',
    'Apakah limitasi yang berulang dalam kedua-dua kajian dan jurang yang sama yang boleh dijadikan justifikasi artikel saya?',
    'Bagaimanakah kaedah, sampel dan instrumen kedua-dua kajian berbeza, dan apakah implikasinya kepada kebolehbandingan dapatan?',
    'Adakah dapatan kedua-dua artikel selari atau bercanggah, dan apakah penjelasan yang munasabah berdasarkan konteks masing-masing?',
    'Tulis satu perenggan sintesis yang memetik kedua-dua artikel bersama dalam gaya sorotan literatur.'
  ];

  /* ---- indeks artikel penerbitan ---- */
  const idBaru = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ringkas = (t, n) => { t = String(t || '').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
  const slug = t => String(t || 'artikel').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40) || 'artikel';
  const entri = id => A.indeks && A.indeks.senarai[id] && !A.indeks.senarai[id].padam ? A.indeks.senarai[id] : null;
  function senaraiUnit() { if (!A.indeks) return []; return Object.values(A.indeks.senarai).filter(x => x && !x.padam).sort((x, y) => (x.cipta || 0) - (y.cipta || 0)); }
  function gabungIndeks(a, b) {
    const out = { senarai: {}, masa: Math.max(a.masa || 0, b.masa || 0) };
    const ids = new Set(Object.keys(a.senarai || {}).concat(Object.keys(b.senarai || {})));
    ids.forEach(id => { const x = (a.senarai || {})[id], y = (b.senarai || {})[id]; out.senarai[id] = !x ? y : !y ? x : (y.masa || 0) > (x.masa || 0) ? y : x; });
    return out;
  }
  async function muatIndeks() {
    const lokal = R.lsGet(LS_INDEKS, null) || { senarai: {}, masa: 0 }; let awan = null;
    try { awan = await R.db().get(KUNCI_INDEKS); } catch (e) {}
    A.indeks = awan ? gabungIndeks(lokal, awan) : lokal; R.lsSet(LS_INDEKS, A.indeks); return A.indeks;
  }
  async function simpanIndeks(ids) {
    A.indeks.masa = Date.now(); R.lsSet(LS_INDEKS, A.indeks);
    const patch = { senarai: {}, masa: A.indeks.masa }; (ids || Object.keys(A.indeks.senarai)).forEach(id => { patch.senarai[id] = A.indeks.senarai[id]; });
    try { await R.db().set(KUNCI_INDEKS, patch, true); return true; } catch (e) { console.warn('artikel: indeks awan gagal', e); return false; }
  }

  /* ---- editor seksyen: kilang Tulisan dengan konfigurasi artikel ---- */
  const cfg = {
    prefix: 'art', Prefix: 'Art', root: '#artikel', view: 'artikel', namaMenu: 'Artikel', sub: 'Artikel', tesis: false, kata: 'artikel', kolum: 'Artikel',
    unitMula: null, unit: () => senaraiUnit().map(x => [x.id, x.tajuk || 'Tanpa tajuk']), unitDari: v => String(v),
    tajukUnit: id => (entri(id) || {}).tajuk || 'Tanpa tajuk', label: id => ringkas((entri(id) || {}).tajuk || 'Tanpa tajuk', 48), tab: id => namaJenis((entri(id) || {}).jenis) || 'Jenis belum dipilih',
    kunci: id => 'meta/penerbitan_' + id, lsKey: id => 'rslr_penerbitan_' + id, awalan: () => '',
    templat: id => STRUKTUR[(Teks.doc(id) || {}).jenis] || [], templatAuto: false, templatNama: 'struktur lazim', templatPendek: 'seksyen', templatKosong: 'Pilih jenis artikel dahulu; struktur lazim bergantung pada jenis artikel',
    kosongTeks: () => 'Artikel ini belum ada seksyen. Klik "Seksyen baharu" untuk mula menulis, "Struktur lazim" untuk memasukkan seksyen yang lazim bagi jenis artikel ini, atau muat naik fail Word.',
    tiadaUnitTeks: 'Pilih artikel atau cipta artikel baharu dahulu.', tajukDocx: 'Artikel', footerDocx: 'Artikel Penerbitan, Repositori SLR',
    failDocx: (ids, st) => 'Artikel_' + slug((entri(ids[0]) || {}).tajuk) + '_' + st + '.docx',
    tambahan: () => ({ jenis: '', sumber: [], soalan: [], pasangan: [] }),
    onUnit: id => { A.id = id; R.lsSet(LS_SEMASA, id); renderPanel(); }
  };
  const Teks = initTulisan(R, cfg);
  const doc = () => A.id ? Teks.doc(A.id) : null;
  async function simpanDoc(patch) { const d = doc(); if (!d) return; d.masa = Date.now(); Teks.simpanLokal(A.id, d); await Teks.simpanAwan(A.id, Object.assign({ masa: d.masa }, patch)); }

  /* ---- paparan ---- */
  async function show() {
    await muatIndeks();
    const semasa = R.lsGet(LS_SEMASA, null); const ada = senaraiUnit();
    if (!A.id || !entri(A.id)) A.id = semasa && entri(semasa) ? semasa : (ada[0] ? ada[0].id : null);
    Teks.state.bab = A.id;
    if (!Teks.state.loaded) await Teks.muatSemua();
    for (const u of ada) if (!Teks.state.docs[u.id]) await Teks.muatBab(u.id);
    Teks.show(); renderPanel();
  }
  function renderPanel() {
    const panel = $('#artPanel'), kosong = $('#artKosong'); if (!panel) return;
    const d = doc();
    if (!d || !entri(A.id)) { panel.hidden = true; kosong.hidden = false; kosong.innerHTML = `<h3>${senaraiUnit().length ? 'Pilih artikel di atas' : 'Belum ada artikel penerbitan'}</h3><p>Setiap artikel mempunyai jenis, artikel sumber daripada repositori (sehingga ${HAD_SUMBER}), soal jawab pasangan artikel (sehingga ${HAD_SOALAN} soalan dijawab agen) dan seksyen dengan editor ASAL dan RAM seperti Tulisan Tesis. Tiada struktur bab yang tetap: tambah seksyen mengikut keperluan artikel.</p><button class="btn btn-primary" data-artbaru="1">Artikel baharu</button>`; return; }
    kosong.hidden = true; panel.hidden = false;
    renderKepala(d); renderSumber(d); renderSoal(d);
  }
  function renderKepala(d) {
    const el = $('#artKepala'); if (!el) return; const e = entri(A.id); const j = JENIS_PETA[d.jenis];
    el.innerHTML = `<div class="art-kepala-grid">
      <label class="field art-tajuk"><span class="lbl">Tajuk artikel</span><input id="artTajukArt" type="text" value="${esc(e.tajuk || '')}" placeholder="Tajuk kerja artikel, boleh diubah bila-bila masa"></label>
      <label class="field art-jenis"><span class="lbl">Jenis artikel</span><select id="artJenis"><option value="">Pilih jenis artikel</option>${JENIS.map(([kump, items]) => `<optgroup label="${esc(kump)}">${items.map(([kod, nama]) => `<option value="${kod}"${kod === d.jenis ? ' selected' : ''}>${esc(nama)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <div class="art-kepala-acts"><button class="btn btn-sm btn-danger" data-padamart="1" title="Buang artikel ini daripada senarai (seksyennya kekal tersimpan dalam awan)">Padam artikel</button></div>
    </div>
    <div class="help art-jenis-ket">${j ? esc(j.kump) + ': ' + esc(j.ket) + ' ' : 'Pilih satu jenis; ia disimpan bersama artikel dan menentukan struktur lazim yang ditawarkan. '}Dicipta ${esc(R.fmtTime(e.cipta || 0))}${d.masa ? ', disunting ' + esc(R.fmtTime(d.masa)) : ''} · ${Teks.senarai(A.id).length} seksyen · ${Teks.jumlahPatah(A.id)} patah perkataan.</div>`;
    $('#artTajukArt').addEventListener('input', ev => { const t = ev.target.value; const en = entri(A.id); if (!en) return; en.tajuk = t; en.masa = Date.now(); d.tajuk = t; clearTimeout(A.timerTajuk); A.timerTajuk = setTimeout(() => { simpanIndeks([A.id]); simpanDoc({ tajuk: t }); Teks.renderBab(); Teks.renderSambung(); }, 600); });
    $('#artJenis').addEventListener('change', async ev => { const v = ev.target.value; const en = entri(A.id); if (!en) return; d.jenis = v; en.jenis = v; en.masa = Date.now(); await Promise.all([simpanIndeks([A.id]), simpanDoc({ jenis: v })]); Teks.renderBab(); renderKepala(d); toast(v ? 'Jenis artikel: ' + namaJenis(v) : 'Jenis artikel dikosongkan'); });
  }

  /* ---- artikel sumber (sehingga 15) ---- */
  const Bd = () => R.Banding;
  const STATUS_KUMPULAN = [['Selesai', 'Selesai dibaca'], ['Sedang dibaca', 'Sedang dibaca'], ['Belum dibaca', 'Belum dibaca']];
  function senaraiRepo() { return Array.from(R.S.docs.keys()).map(id => [id, Bd().rekod(id)]).sort((x, y) => (x[1].bil || 0) - (y[1].bil || 0) || String(x[1].penulis || '').localeCompare(String(y[1].penulis || ''))); }
  /* Senarai sumber tidak ditapis secara automatik: rekod yang belum tiba daripada awan atau yang dipadam dipaparkan sebagai tidak ditemui
     supaya senarai Prof Dr tidak hilang; sumberAda() hanya untuk pasangan soal jawab. */
  function sumberSah(d) { if (!Array.isArray(d.sumber)) d.sumber = []; return d.sumber; }
  function sumberAda(d) { return sumberSah(d).filter(id => R.S.docs.has(id)); }
  function kelengkapanPenuh(rec) { const k = Bd().kelengkapan(rec); const semua = Bd().SEK.reduce((s, x) => s + x.fields.length, 0); const kosong = k.bahagian.reduce((s, b) => s + b.kosong.length, 0); return { k, peratus: semua ? Math.round(100 * (semua - kosong) / semua) : 0 }; }
  function renderSumber(d) {
    const el = $('#artSumber'); if (!el) return; const sumber = sumberSah(d); const dipilih = new Set(sumber);
    const kumpulan = {}; STATUS_KUMPULAN.forEach(([k]) => { kumpulan[k] = []; }); senaraiRepo().forEach(x => { const st = x[1].status || 'Belum dibaca'; (kumpulan[st] || (kumpulan[st] = [])).push(x); });
    const semua = STATUS_KUMPULAN.map(x => x[0]).concat(Object.keys(kumpulan).filter(k => !STATUS_KUMPULAN.some(x => x[0] === k)));
    const opt = ([id, r]) => { const k = Bd().kelengkapan(r); return `<option value="${esc(id)}"${dipilih.has(id) ? ' disabled' : ''}>Bil. ${esc(r.bil || '?')} ${esc(Bd().nama(r))} ${k.ok ? '[A hingga F lengkap]' : '[belum lengkap: ' + k.bahagian.filter(b => !b.ok).map(b => b.letter).join('') + ']'} ${esc(String(r.tajuk || '').slice(0, 70))}${dipilih.has(id) ? ' (sudah dipilih)' : ''}</option>`; };
    const penuh = sumber.length >= HAD_SUMBER;
    el.innerHTML = `<div class="art-sumber-pilih"><select id="artSumberSel"${penuh ? ' disabled' : ''}><option value="">${penuh ? 'Had ' + HAD_SUMBER + ' artikel dicapai; buang satu untuk menambah' : 'Tambah artikel sumber daripada repositori'}</option>${semua.map(k => { const items = kumpulan[k] || []; const label = (STATUS_KUMPULAN.find(x => x[0] === k) || [k, k])[1]; const lengkap = items.filter(x => Bd().kelengkapan(x[1]).ok).length; return `<optgroup label="${esc(label)} (${items.length} artikel, ${lengkap} lengkap A hingga F)">${items.length ? items.map(opt).join('') : '<option disabled>Tiada artikel</option>'}</optgroup>`; }).join('')}</select><span class="help"><b>${sumber.length}</b> daripada ${HAD_SUMBER} artikel dipilih. Pilih daripada senarai (dikumpulkan mengikut status bacaan) untuk menambah; meter menunjukkan kelengkapan medan A hingga F setiap rekod, dan rekod yang belum lengkap elok dilengkapkan dahulu supaya soal jawab dan penulisan berpijak pada bukti.</span></div>
      <div class="art-sumber-senarai">${sumber.length ? sumber.map((id, i) => { if (!R.S.docs.has(id)) return `<div class="art-row belum" data-sumber="${esc(id)}"><div class="art-no">${i + 1}</div><div class="avatar">?</div><div class="art-row-isi"><div class="nama">Rekod tidak ditemui dalam repositori</div><div class="tajuk">Mungkin belum dimuatkan daripada awan atau sudah dipadam. Jika kekal begini, buang daripada senarai.</div></div><div></div><div class="acts"><button class="btn btn-sm btn-danger" data-buang="${esc(id)}">Buang</button></div></div>`; const r = Bd().rekod(id); const { k, peratus } = kelengkapanPenuh(r); const dlmSoal = (d.soalan || []).some(q => q.idA === id || q.idB === id); return `<div class="art-row${k.ok ? '' : ' belum'}" data-sumber="${esc(id)}"><div class="art-no">${i + 1}</div><div class="avatar">${esc(inisial(r))}</div><div class="art-row-isi"><div class="nama">${esc(Bd().nama(r))} <span class="tag">Bil. ${esc(r.bil || '?')}</span> <span class="tag st">${esc(r.status || 'Belum dibaca')}</span>${(r.fail || []).length ? '' : ' <span class="tag">tiada PDF</span>'}${dlmSoal ? ' <span class="tag ai">dalam soal jawab</span>' : ''}</div><div class="tajuk">${esc(r.tajuk || 'Tajuk belum diisi')}</div><div class="art-meter" title="${peratus}% medan diisi"><span style="width:${peratus}%"></span></div></div><div class="band-lengkap" title="Kelengkapan Bahagian A hingga F">${k.bahagian.map(b => `<span class="${b.ok ? 'ok' : 'no'}" title="${esc(b.title + (b.ok ? ': lengkap' : ': kosong ' + b.kosong.join(', ')))}">${b.letter}</span>`).join('')}<span class="pct">${peratus}%</span></div><div class="acts"><button class="btn btn-sm${k.ok ? '' : ' btn-primary'}" data-bukarekod="${esc(id)}" title="${k.ok ? 'Buka rekod artikel ini' : 'Belum lengkap: ' + esc(k.bahagian.filter(b => !b.ok).map(b => b.letter).join(', ')) + '. Buka rekod untuk melengkapkan'}">Buka rekod</button>${(r.fail || []).length ? `<button class="btn btn-sm" data-flipart="${esc(id)}" title="Baca PDF dalam panel terapung">Baca</button>` : ''}<button class="btn btn-sm btn-danger" data-buang="${esc(id)}" title="Buang daripada senarai sumber artikel ini (rekod tidak dipadam)">Buang</button></div></div>`; }).join('') : '<div class="help">Belum ada artikel sumber. Pilih daripada senarai di atas.</div>'}</div>`;
    const sel = $('#artSumberSel'); if (sel) sel.addEventListener('change', async ev => { const id = ev.target.value; if (!id) return; await tambahSumber(id); });
    const kira = $('#artSumberKira'); if (kira) kira.textContent = `(${sumber.length}/${HAD_SUMBER})`;
  }
  function inisial(d) { const w = String(d.penulis || '?').replace(/et al\.?/i, '').trim().split(/\s+/).filter(Boolean); return (w.slice(0, 2).map(x => x[0]).join('') || '?').toUpperCase(); }
  async function tambahSumber(id) {
    const d = doc(); if (!d) return; const sumber = sumberSah(d);
    if (sumber.includes(id)) { toast('Artikel itu sudah ada dalam senarai sumber'); return; }
    if (sumber.length >= HAD_SUMBER) { toast(`Had ${HAD_SUMBER} artikel sumber bagi satu artikel penerbitan sudah dicapai. Buang satu artikel dahulu jika mahu menambah yang lain.`, true); renderSumber(d); return; }
    if (!R.S.docs.has(id)) { toast('Rekod itu tiada dalam repositori', true); return; }
    sumber.push(id); await simpanDoc({ sumber: d.sumber }); renderSumber(d); renderSoal(d);
    const r = Bd().rekod(id); const k = Bd().kelengkapan(r);
    toast(`${Bd().nama(r)} ditambah sebagai sumber (${sumber.length}/${HAD_SUMBER})${k.ok ? '' : '. Rekod ini belum lengkap Bahagian ' + k.bahagian.filter(b => !b.ok).map(b => b.letter).join(', ') + '; lengkapkan dahulu melalui Buka rekod'}`, !k.ok);
  }
  async function buangSumber(id) {
    const d = doc(); if (!d) return; const sumber = sumberSah(d); const i = sumber.indexOf(id); if (i < 0) return;
    const r = R.S.docs.has(id) ? Bd().rekod(id) : null; const nQ = (d.soalan || []).filter(q => q.idA === id || q.idB === id).length;
    const okk = await R.confirmBox('Buang artikel sumber?', `${r ? Bd().nama(r) : 'Rekod yang tidak ditemui'} akan dibuang daripada senarai sumber artikel ini${nQ ? '; ' + nQ + ' soal jawab yang melibatkannya kekal tersimpan' : ''}. Rekod dalam repositori tidak dipadam.`, 'Buang');
    if (!okk) return; sumber.splice(i, 1); if ((d.pasangan || []).includes(id)) d.pasangan = []; await simpanDoc({ sumber: d.sumber, pasangan: d.pasangan }); renderSumber(d); renderSoal(d); toast('Artikel sumber dibuang');
  }

  /* ---- soal jawab pasangan artikel (sehingga 10 soalan) ---- */
  function pasangan(d) { const s = sumberAda(d); let [a, b] = d.pasangan || []; if (!s.includes(a)) a = ''; if (!s.includes(b) || b === a) b = ''; if (!a) a = s.find(x => x !== b) || ''; if (!b) b = s.find(x => x !== a) || ''; d.pasangan = [a, b]; return d.pasangan; }
  function renderSoal(d) {
    const el = $('#artSoal'); if (!el) return; const s = sumberAda(d); const [a, b] = pasangan(d); const soalan = d.soalan || [];
    const opsi = pilih => `<option value="">Pilih</option>` + s.map(id => { const r = Bd().rekod(id); return `<option value="${esc(id)}"${id === pilih ? ' selected' : ''}>${esc(Bd().nama(r))}: ${esc(String(r.tajuk || '').slice(0, 60))}</option>`; }).join('');
    const kira = $('#artSoalKira'); if (kira) kira.textContent = `(${soalan.length}/${HAD_SOALAN})`;
    if (s.length < 2) { el.innerHTML = `<div class="help">Pilih sekurang-kurangnya dua artikel sumber di atas untuk memulakan soal jawab pasangan.</div>${renderJawapan(d)}`; return; }
    const penuh = soalan.length >= HAD_SOALAN; const jumlahToken = soalan.reduce((t, q) => ({ masuk: t.masuk + ((q.token || {}).masuk || 0), keluar: t.keluar + ((q.token || {}).keluar || 0) }), { masuk: 0, keluar: 0 });
    el.innerHTML = `<div class="art-pasangan"><label class="field"><span class="lbl">Artikel 1</span><select id="artPasA">${opsi(a)}</select></label><button id="btnArtTukar" class="btn btn-sm" title="Tukar kedudukan Artikel 1 dan Artikel 2">Tukar</button><label class="field"><span class="lbl">Artikel 2</span><select id="artPasB">${opsi(b)}</select></label></div>
      <div id="artLaporan" class="art-laporan"></div>
      <div class="art-tanya"><div class="art-cadangan"><span class="lbl">Soalan pantas:</span>${CADANGAN.map((c, i) => `<button class="chip" data-cadangan="${i}" title="${esc(c)}">${esc(ringkas(c, 46))}</button>`).join('')}</div>
        <textarea id="artSoalan" rows="3" placeholder="Taip soalan Prof Dr tentang pasangan ini, contohnya: apakah limitasi yang berulang dalam kedua-dua kajian dan jurang yang sama yang boleh saya isi?"${penuh ? ' disabled' : ''}></textarea>
        <div class="art-tanya-acts"><button id="btnArtTanya" class="btn btn-ai"${penuh || A.busy ? ' disabled' : ''}>${A.busy ? 'Agen sedang menjawab' : 'Tanya agen (' + soalan.length + '/' + HAD_SOALAN + ')'}</button><span class="help">${penuh ? 'Had ' + HAD_SOALAN + ' soalan bagi artikel ini sudah dicapai; padam soalan lama untuk bertanya lagi.' : 'Setiap soalan ialah satu panggilan API dengan kunci API Prof Dr: medan A hingga F kedua-dua rekod (bukan PDF), laporan Banding sedia ada jika ada, dan soalan terdahulu pasangan ini dihantar bersama. Satu soalan pada satu masa; jawapan disusun mengikut soalan di bawah.'}${soalan.length ? ` Token setakat ini: masuk ${jumlahToken.masuk}, keluar ${jumlahToken.keluar}.` : ''}</span></div></div>
      ${renderJawapan(d)}`;
    $('#artPasA').addEventListener('change', ev => { d.pasangan = [ev.target.value, d.pasangan[1] === ev.target.value ? '' : d.pasangan[1]]; simpanDoc({ pasangan: d.pasangan }); renderSoal(d); });
    $('#artPasB').addEventListener('change', ev => { d.pasangan = [d.pasangan[0] === ev.target.value ? '' : d.pasangan[0], ev.target.value]; simpanDoc({ pasangan: d.pasangan }); renderSoal(d); });
    $('#btnArtTukar').addEventListener('click', () => { d.pasangan = [d.pasangan[1], d.pasangan[0]]; simpanDoc({ pasangan: d.pasangan }); renderSoal(d); });
    $('#btnArtTanya').addEventListener('click', () => tanya());
    renderLaporan(d);
  }
  const perenggan = t => String(t || '').replace(/\r/g, '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  function renderJawapan(d) {
    const soalan = d.soalan || []; if (!soalan.length && !A.busy) return '';
    return `<div id="artJawapan" class="art-jawapan">${soalan.map((q, i) => `<article class="art-jawab" data-q="${esc(q.id)}"><div class="art-jawab-h"><b>Soalan ${i + 1}</b><span class="pair">Artikel 1: ${esc(q.namaA || '')} lwn Artikel 2: ${esc(q.namaB || '')}</span><span class="meta">${esc(R.fmtTime(q.masa || 0))}${q.model ? ' · ' + esc(String(q.model).replace('claude-', '')) : ''}${q.token ? ' · token masuk ' + esc(q.token.masuk) + ', keluar ' + esc(q.token.keluar) : ''}</span></div><p class="soalan">${esc(q.soalan)}</p><div class="jawapan">${perenggan(q.jawapan).map(p => `<p>${esc(p)}</p>`).join('')}</div><div class="acts"><button class="btn btn-sm btn-primary" data-ram="${esc(q.id)}" title="Masukkan soalan dan jawapan ini ke dalam RAM seksyen yang sedang dibuka untuk diolah">Pindah ke RAM seksyen semasa</button><button class="btn btn-sm" data-salinq="${esc(q.id)}">Salin</button><button class="btn btn-sm btn-danger" data-padamq="${esc(q.id)}">Padam</button></div></article>`).join('')}${A.busy ? '<div class="art-jawab menunggu"><div class="help">Agen sedang membaca medan A hingga F kedua-dua artikel dan menyusun jawapan. Lazimnya kurang seminit.</div></div>' : ''}</div>`;
  }
  async function renderLaporan(d) {
    const el = $('#artLaporan'); if (!el) return; const [a, b] = pasangan(d);
    if (!a || !b || a === b) { el.innerHTML = '<div class="help">Pilih dua artikel yang berbeza.</div>'; return; }
    const k = [a, b].sort().join('__');
    if (A.laporanKunci !== k) { A.laporanKunci = k; A.laporan = null; el.innerHTML = '<div class="help">Menyemak laporan Agen Banding sedia ada bagi pasangan ini...</div>'; let lap = null; try { lap = await Bd().muatSimpanan(a, b); } catch (e) {} if (A.laporanKunci !== k) return; A.laporan = lap; }
    const da = Bd().rekod(a), db = Bd().rekod(b); const ka = Bd().kelengkapan(da), kb = Bd().kelengkapan(db);
    const amaran = (!ka.ok || !kb.ok) ? `<div class="art-amaran">Belum lengkap: ${[!ka.ok ? 'Artikel 1 Bahagian ' + ka.bahagian.filter(x => !x.ok).map(x => x.letter).join(', ') : '', !kb.ok ? 'Artikel 2 Bahagian ' + kb.bahagian.filter(x => !x.ok).map(x => x.letter).join(', ') : ''].filter(Boolean).join('; ')}. Agen hanya menjawab daripada medan yang diisi; lengkapkan rekod dahulu untuk jawapan yang jitu.</div>` : '';
    if (!A.laporan) { el.innerHTML = amaran + `<div class="help">Belum ada laporan Agen Banding bagi pasangan ini. Soal jawab di bawah tetap boleh digunakan; jika mahu laporan penuh (profil, skor lapan dimensi, dimensi konstruk, perbandingan A hingga F), jana di menu Banding. <button class="btn btn-sm" data-bukabanding="${esc(a)}|${esc(b)}">Buka Banding</button></div>`; return; }
    const l = A.laporan.laporan; const menang = l.lebihBerguna === 'Artikel 1' ? Bd().nama(da) : l.lebihBerguna === 'Artikel 2' ? Bd().nama(db) : 'Kedua-dua setara';
    el.innerHTML = amaran + `<details class="art-lap"><summary><b>Laporan Agen Banding sedia ada</b> (dijana ${esc(R.fmtTime(A.laporan.masa || 0))}${A.laporan.model ? ', ' + esc(String(A.laporan.model).replace('claude-', '')) : ''}); baca di sini tanpa bertukar menu, dan agen soal jawab turut merujuknya.</summary>
      <div class="art-lap-isi"><div class="band-dua profil"><div class="band-profil a"><b>Artikel 1: ${esc(Bd().nama(da))}</b><p>${esc(l.profil.a)}</p></div><div class="band-profil b"><b>Artikel 2: ${esc(Bd().nama(db))}</b><p>${esc(l.profil.b)}</p></div></div>
      ${l.skor && l.skor.length ? `<table class="art-skor"><thead><tr><th>Dimensi penilaian</th><th>Artikel 1</th><th>Artikel 2</th></tr></thead><tbody>${l.skor.map(x => `<tr><td>${esc(x.dimensi)}<div class="ul">${esc(x.ulasan || '')}</div></td><td class="a">${esc(x.a)}</td><td class="b">${esc(x.b)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${(l.bahagian || []).map(x => { const s = Bd().SEK.find(y => y.letter === x.bahagian); return `<div class="band-sekagen"><h4>Bahagian ${esc(x.bahagian)}. ${esc(s ? s.title : '')}</h4><div class="tiga"><div><b>Persamaan</b>${esc(x.persamaan)}</div><div><b>Perbezaan</b>${esc(x.perbezaan)}</div><div><b>Penilaian</b>${esc(x.penilaian)}</div></div></div>`; }).join('')}
      <div class="band-dua kk"><div><h4>Artikel 1</h4><p><b>Kekuatan.</b> ${esc(l.kekuatan.a)}</p><p><b>Kelemahan.</b> ${esc(l.kelemahan.a)}</p></div><div><h4>Artikel 2</h4><p><b>Kekuatan.</b> ${esc(l.kekuatan.b)}</p><p><b>Kelemahan.</b> ${esc(l.kelemahan.b)}</p></div></div>
      <h4>Laporan keseluruhan</h4><p class="band-p">${esc(l.keseluruhan)}</p><h4>Refleksi terhadap kajian Prof Dr</h4><p class="band-p">${esc(l.refleksi)}</p><h4>Cadangan sitasi bersama</h4><p class="band-p">${esc(l.sitasi)}</p>
      <div class="band-verdict"><b>Lebih berguna untuk kajian Prof Dr: ${esc(menang)}.</b> ${esc(l.sebab)}</div>
      <div class="acts"><button class="btn btn-sm" data-bukabanding="${esc(a)}|${esc(b)}">Buka dalam Banding (carta dan PDF)</button><button class="btn btn-sm" data-lapram="1" title="Masukkan laporan keseluruhan, refleksi dan cadangan sitasi ke dalam RAM seksyen yang sedang dibuka">Pindah laporan ke RAM seksyen semasa</button></div></div></details>`;
  }
  function ringkasLaporan(l) {
    if (!l) return '';
    const bah = (l.bahagian || []).map(x => `Bahagian ${x.bahagian}: persamaan: ${x.persamaan} Perbezaan: ${x.perbezaan} Penilaian: ${x.penilaian}`).join('\n');
    const skor = (l.skor || []).map(x => `${x.dimensi}: Artikel 1 ${x.a}, Artikel 2 ${x.b} (${x.ulasan || ''})`).join('\n');
    return `LAPORAN AGEN BANDING SEDIA ADA (dijana lebih awal; gunakan sebagai konteks, bukan sumber tunggal):\nProfil Artikel 1: ${l.profil.a}\nProfil Artikel 2: ${l.profil.b}\n${bah}\nSkor:\n${skor}\nKekuatan Artikel 1: ${l.kekuatan.a}\nKelemahan Artikel 1: ${l.kelemahan.a}\nKekuatan Artikel 2: ${l.kekuatan.b}\nKelemahan Artikel 2: ${l.kelemahan.b}\nKeseluruhan: ${l.keseluruhan}\nRefleksi: ${l.refleksi}\nSitasi: ${l.sitasi}\nLebih berguna: ${l.lebihBerguna}. ${l.sebab}`.slice(0, 9000);
  }
  function systemPrompt(profil, d) {
    const j = JENIS_PETA[d.jenis]; const e = entri(A.id) || {};
    return `Anda ialah Agen Soal Jawab Artikel Prof Dr Claude, pembantu penulisan artikel penerbitan kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris. Prof Dr sedang menulis artikel penerbitan${j ? ' jenis "' + j.nama + '"' : ''}${e.tajuk ? ' bertajuk "' + e.tajuk + '"' : ''}. Tugas anda: menjawab SATU soalan Prof Dr tentang perbandingan DUA artikel sumber (Artikel 1 dan Artikel 2) berdasarkan medan ekstrak Bahagian A hingga F yang telah diisi dalam Repositori SLR (bukan teks penuh PDF), dan, jika disertakan, laporan Agen Banding sedia ada serta soalan dan jawapan terdahulu bagi pasangan yang sama.

Peraturan:
1. Bahasa Melayu Malaysia baku, laras akademik; istilah Malaysia (guru besar, dapatan, kajian); jangan gunakan sempang em atau en.
2. Sifar fabrikasi: hujah hanya daripada bahan yang diberi. Jika medan tidak memadai untuk menjawab, nyatakan "maklumat dalam rekod tidak memadai" dan namakan medan atau bahagian yang perlu dilengkapkan; jangan mengandaikan, mereka angka, nama atau rujukan.
3. Namakan artikel sebagai Artikel 1 dan Artikel 2 secara konsisten, disertai Penulis (Tahun) apabila sesuai.
4. Jawab terus dan jitu kepada soalan: dua hingga lima perenggan prosa yang padat, tanpa pengantar, tanpa penutup basa-basi, tanpa senarai berbutir kecuali soalan meminta senarai atau jadual.
5. Jika soalan tentang pola, persamaan, perbezaan, limitasi berulang, jurang, kaedah atau konteks, susun jawapan mengikut aspek itu dan sokong setiap dakwaan dengan medan yang berkenaan (contohnya sampel, instrumen, dapatan, batasan).
6. Akhiri dengan satu perenggan pendek bermula "Untuk artikel Prof Dr:" yang menyatakan cara jawapan ini boleh digunakan dalam artikel yang sedang ditulis (justifikasi jurang, sintesis, kaedah atau perbincangan).
7. Jika soalan meminta perenggan sintesis, tulis perenggan itu dalam gaya sorotan literatur dengan sitasi Penulis (Tahun) dan nyatakan hubungan (selari, bercanggah atau melengkapi).

Profil kajian Prof Dr:
${profil}`;
  }
  async function tanya() {
    const d = doc(); if (!d || A.busy) return; const [a, b] = pasangan(d); const ta = $('#artSoalan'); const q = ta ? ta.value.trim() : '';
    if (!a || !b || a === b) { toast('Pilih dua artikel sumber yang berbeza untuk pasangan', true); return; }
    if (!q) { toast('Taip soalan dahulu (atau klik satu soalan pantas)', true); if (ta) ta.focus(); return; }
    if ((d.soalan || []).length >= HAD_SOALAN) { toast(`Had ${HAD_SOALAN} soalan bagi artikel ini sudah dicapai. Padam soalan lama untuk bertanya lagi.`, true); return; }
    const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    if (!R.lsGet('rslr_artikel_faham', false)) {
      const okk = await R.confirmBox('Agen Soal Jawab Artikel Prof Dr Claude', 'Setiap soalan dihantar sebagai satu panggilan ke API Anthropic menggunakan kunci API Prof Dr dan dicaj kepada akaun Anthropic Prof Dr (medan A hingga F kedua-dua rekod, laporan Banding sedia ada jika ada, dan soalan terdahulu pasangan ini; bukan PDF). Jawapan disimpan bersama artikel supaya tidak perlu ditanya semula. Maksimum ' + HAD_SOALAN + ' soalan bagi setiap artikel penerbitan.', 'Faham, teruskan', false);
      if (!okk) return; R.lsSet('rslr_artikel_faham', true);
    }
    const da = Bd().rekod(a), db = Bd().rekod(b);
    A.busy = true; renderSoal(d);
    try {
      let lap = null; try { lap = await Bd().muatSimpanan(a, b); } catch (e) {}
      const dahulu = (d.soalan || []).filter(x => (x.idA === a && x.idB === b) || (x.idA === b && x.idB === a)).slice(-4);
      const teksDahulu = dahulu.length ? 'SOALAN DAN JAWAPAN TERDAHULU BAGI PASANGAN INI:\n' + dahulu.map((x, i) => `S${i + 1}: ${x.soalan}\nJ${i + 1}: ${String(x.jawapan || '').slice(0, 1500)}${x.idA !== a ? ' (nota: dalam soalan ini kedudukan Artikel 1 dan 2 adalah terbalik)' : ''}`).join('\n\n') : '';
      const user = [Bd().teksRekod(1, da), Bd().teksRekod(2, db), lap ? ringkasLaporan(lap.laporan) : '', teksDahulu, 'SOALAN PROF DR: ' + q + '\n\nJawab mengikut peraturan.'].filter(Boolean).join('\n\n');
      const res = await R.Isi.hantar(t, { kunciMod: 'artikel:' + t.model, system: systemPrompt(t.profil, d), content: [{ type: 'text', text: user }], hadToken: 3000 });
      const jawapan = String(res.text || (res.input && (res.input.jawapan || JSON.stringify(res.input))) || '').trim().replace(/\s*[—–]\s*/g, ', ');
      if (!jawapan) throw { code: 'kosong' };
      const rec = { id: 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), idA: a, idB: b, namaA: Bd().nama(da), namaB: Bd().nama(db), soalan: q, jawapan, masa: Date.now(), model: t.model, token: res.usage || null };
      d.soalan = (d.soalan || []).concat([rec]); await simpanDoc({ soalan: d.soalan });
      if (ta) ta.value = ''; toast('Jawapan agen siap dan disimpan bersama artikel');
    } catch (e) { toast('Agen gagal: ' + (e && e.code === 'kosong' ? 'jawapan kosong diterima; cuba sekali lagi.' : R.Isi.msg(e)), true); }
    finally { A.busy = false; renderSoal(d); const el = $('#artJawapan'); if (el) el.lastElementChild && el.lastElementChild.scrollIntoView({ block: 'nearest' }); }
  }
  async function padamSoalan(id) {
    const d = doc(); if (!d) return; const q = (d.soalan || []).find(x => x.id === id); if (!q) return;
    const okk = await R.confirmBox('Padam soal jawab?', `"${ringkas(q.soalan, 90)}" dan jawapannya akan dipadam daripada artikel ini.`, 'Padam'); if (!okk) return;
    d.soalan = d.soalan.filter(x => x.id !== id); await simpanDoc({ soalan: d.soalan }); renderSoal(d); toast('Soal jawab dipadam');
  }
  function keRam(html, apa) {
    const d = doc(); if (!d) return false; const sek = Teks.state.sek; const s = sek && d.seksyen[sek];
    if (!s || s.padam) { toast('Pilih atau cipta seksyen dahulu di bahagian bawah; ' + apa + ' akan dimasukkan ke RAM seksyen itu', true); return false; }
    Teks.flushEditor(); Teks.tulisSeksyen(A.id, sek, { ram: (s.ram || '') + html }, { senyap: true, segera: true }); Teks.renderEditor(); Teks.renderSenarai();
    toast(apa + ' dimasukkan ke RAM seksyen "' + (s.tajuk || 'Tanpa tajuk') + '"'); const ed = $('#artRam'); if (ed) ed.scrollIntoView({ block: 'nearest' }); return true;
  }
  function jawapanKeRam(id) {
    const d = doc(); if (!d) return; const i = (d.soalan || []).findIndex(x => x.id === id); if (i < 0) return; const q = d.soalan[i];
    const html = `<p><strong>Soalan ${i + 1}: ${esc(q.soalan)}</strong></p>` + perenggan(q.jawapan).map(p => `<p>${esc(p)}</p>`).join('') + `<p><em>Jawapan agen, Artikel 1 ${esc(q.namaA || '')} lwn Artikel 2 ${esc(q.namaB || '')}, ${esc(R.fmtTime(q.masa || 0))}.</em></p>`;
    keRam(html, 'Soal jawab ' + (i + 1));
  }
  function laporanKeRam() {
    const l = A.laporan && A.laporan.laporan; if (!l) return; const d = doc(); const [a, b] = pasangan(d); const na = Bd().nama(Bd().rekod(a)), nb = Bd().nama(Bd().rekod(b));
    const html = `<p><strong>Laporan Agen Banding: ${esc(na)} lwn ${esc(nb)}</strong></p><p>${esc(l.keseluruhan)}</p><p>${esc(l.refleksi)}</p><p>${esc(l.sitasi)}</p><p><em>Lebih berguna: ${esc(l.lebihBerguna)}. ${esc(l.sebab)}</em></p>`;
    keRam(html, 'Laporan Banding');
  }

  /* ---- artikel baharu dan padam ---- */
  async function artikelBaru() {
    if (!A.indeks) await muatIndeks();
    const okk = await R.richModal('Artikel baharu', `<label for="artTajukBaru">Tajuk kerja artikel</label><input id="artTajukBaru" class="modal-in" type="text" placeholder="Contohnya: Kepimpinan digital guru besar dan kompetensi digital guru: ulasan skop" autocomplete="off"><label for="artJenisBaru">Jenis artikel</label><select id="artJenisBaru" class="modal-in"><option value="">Pilih kemudian</option>${JENIS.map(([kump, items]) => `<optgroup label="${esc(kump)}">${items.map(([kod, nama]) => `<option value="${kod}">${esc(nama)}</option>`).join('')}</optgroup>`).join('')}</select><p class="help">Tajuk dan jenis boleh diubah bila-bila masa. Selepas dicipta, pilih artikel sumber daripada repositori, tanya agen tentang pasangan artikel, dan tulis seksyen dengan ASAL dan RAM.</p>`, 'Cipta', 'Batal');
    if (!okk) return null; const v = R.richModal.values || {}; const tajuk = String(v.artTajukBaru || '').trim() || 'Artikel tanpa tajuk'; const jenis = String(v.artJenisBaru || '');
    const id = idBaru(); const masa = Date.now(); A.indeks.senarai[id] = { id, tajuk, jenis, cipta: masa, masa };
    await simpanIndeks([id]);
    const d = Teks.doc(id); d.tajuk = tajuk; d.jenis = jenis; d.masa = masa; Teks.simpanLokal(id, d); await Teks.simpanAwan(id, { jenis, tajuk, sumber: [], soalan: [], pasangan: [], masa });
    A.id = id; R.lsSet(LS_SEMASA, id); Teks.state.bab = id; Teks.state.sek = null; Teks.renderSemua(); renderPanel();
    toast('Artikel "' + tajuk + '" dicipta' + (jenis && STRUKTUR[jenis] ? '. Klik "Struktur lazim" jika mahu seksyen lazim jenis ini dimasukkan' : ''));
    const k = $('#artKepala'); if (k) k.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return id;
  }
  async function padamArtikel() {
    const e = entri(A.id); if (!e) return; const d = doc();
    const okk = await R.confirmBox('Padam artikel penerbitan?', `"${e.tajuk || 'Tanpa tajuk'}" (${Teks.senarai(A.id).length} seksyen, ${Teks.jumlahPatah(A.id)} patah, ${(d.soalan || []).length} soal jawab) akan dibuang daripada senarai artikel. Dokumennya kekal dalam awan dan boleh dipulihkan oleh pentadbir jika perlu.`, 'Padam');
    if (!okk) return; e.padam = true; e.masa = Date.now(); await simpanIndeks([A.id]);
    const seterusnya = senaraiUnit()[0]; A.id = seterusnya ? seterusnya.id : null; R.lsSet(LS_SEMASA, A.id); Teks.state.bab = A.id; Teks.state.sek = null; Teks.renderSemua(); renderPanel(); toast('Artikel dibuang daripada senarai');
  }

  /* ---- peristiwa ---- */
  const root = $('#artikel');
  if (root) {
    root.addEventListener('click', async e => {
      if (e.target.closest('[data-artbaru]')) { artikelBaru(); return; }
      if (e.target.closest('[data-padamart]')) { padamArtikel(); return; }
      const bg = e.target.closest('[data-buang]'); if (bg) { buangSumber(bg.dataset.buang); return; }
      const fl = e.target.closest('[data-flipart]'); if (fl) { R.openFlip(fl.dataset.flipart, 0); return; }
      const cd = e.target.closest('[data-cadangan]'); if (cd) { const ta = $('#artSoalan'); if (ta && !ta.disabled) { ta.value = CADANGAN[+cd.dataset.cadangan] || ''; ta.focus(); } return; }
      const rm = e.target.closest('[data-ram]'); if (rm) { jawapanKeRam(rm.dataset.ram); return; }
      if (e.target.closest('[data-lapram]')) { laporanKeRam(); return; }
      const sq = e.target.closest('[data-salinq]'); if (sq) { const d = doc(); const q = d && (d.soalan || []).find(x => x.id === sq.dataset.salinq); if (!q) return; try { await navigator.clipboard.writeText('Soalan: ' + q.soalan + '\n\n' + q.jawapan); toast('Soal jawab disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
      const pq = e.target.closest('[data-padamq]'); if (pq) { padamSoalan(pq.dataset.padamq); return; }
    });
    $('#btnArtBaru').addEventListener('click', () => artikelBaru());
  }
  function peringatan() { Teks.peringatan(); }
  return { show, artikelBaru, padamArtikel, tambahSumber, buangSumber, tanya, padamSoalan, jawapanKeRam, renderPanel, muatIndeks, senaraiUnit, peringatan, JENIS, STRUKTUR, CADANGAN, HAD_SUMBER, HAD_SOALAN, Teks, state: A };
}
