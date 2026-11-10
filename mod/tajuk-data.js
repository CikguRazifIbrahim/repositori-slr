/* Pembantu Tajuk: pangkalan pengetahuan (tanpa DOM). Mengandungi soalan pandu mengikut keluarga jenis artikel (MEDAN), penanda jenis
   kajian yang dicari dalam tajuk (PENANDA), katalog pola tajuk (POLA), peraturan tajuk berserta sumbernya (PERATURAN, SUMBER) dan
   semakan tajuk tanpa agen (semakTajuk). Peraturan dan sumber diisi daripada penyelidikan tentang ciri tajuk artikel jurnal; setiap
   sumber disahkan (DOI atau laman rasmi dibuka) sebelum dimasukkan. Tiada ayat sumber disalin; huraian ditulis dengan kata sendiri. */
import { keluargaDari } from './pandu-data.js';

export const keluargaTajuk = jenis => (jenis === 'emp-dbr' ? 'dbr' : keluargaDari(jenis));
export const patah = s => String(s || '').trim().split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)).length;
const rata = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---- soalan pandu: kunci, label, contoh, teras (unsur teras tajuk jenis ini), peranan ---- */
const M = (k, label, contoh, teras, peranan) => ({ k, label, contoh, teras: !!teras, peranan: peranan || '' });
const JURANG = M('jurang', 'Jurang atau sumbangan yang mahu ditonjolkan', 'contoh: belum ada kajian sekolah rendah yang menguji peranan pengantara ini', 0, 'jurang');
const KONTEKS = (teras, contoh) => M('konteks', 'Konteks (negeri, negara, sektor, peringkat)', contoh || 'contoh: sekolah rendah di Perak, Malaysia', teras, 'kon');
export const MEDAN = {
  kuan: [
    M('pvBebas', 'Pemboleh ubah bebas (peramal)', 'contoh: kepimpinan digital guru besar', 1, 'pv'),
    M('pvSandar', 'Pemboleh ubah bersandar (hasil)', 'contoh: kompetensi digital guru', 1, 'pv'),
    M('pvLain', 'Pengantara (perantara) atau penyederhana, jika ada', 'contoh: pengurusan pengetahuan organisasi sebagai pengantara', 0, 'pv'),
    M('populasi', 'Populasi atau responden', 'contoh: guru sekolah rendah', 1, 'pop'),
    KONTEKS(0),
    M('reka', 'Reka bentuk dan kaedah analisis', 'contoh: tinjauan keratan rentas, pemodelan persamaan struktur', 0, 'reka'),
    JURANG],
  kual: [
    M('fenomena', 'Fenomena, pengalaman atau amalan yang diteroka', 'contoh: cara guru besar memimpin perkongsian pengetahuan digital', 1, 'pv'),
    M('peserta', 'Peserta kajian', 'contoh: guru besar sekolah rendah luar bandar', 1, 'pop'),
    KONTEKS(1),
    M('reka', 'Pendekatan dan kaedah data', 'contoh: kajian kes pelbagai tapak, temu bual separa berstruktur', 0, 'reka'),
    JURANG],
  campur: [
    M('fokus', 'Fokus atau pemboleh ubah utama', 'contoh: kepimpinan digital dan kompetensi digital guru', 1, 'pv'),
    M('populasi', 'Populasi atau peserta', 'contoh: guru dan guru besar sekolah rendah', 1, 'pop'),
    KONTEKS(0),
    M('reka', 'Reka bentuk kaedah campuran', 'contoh: penerangan berurutan (tinjauan diikuti temu bual)', 1, 'reka'),
    JURANG],
  instr: [
    M('konstruk', 'Konstruk yang diukur', 'contoh: kepimpinan digital guru besar', 1, 'pv'),
    M('instrumen', 'Nama instrumen atau skala, jika ada', 'contoh: Instrumen Kepimpinan Digital Pemimpin Pertengahan', 0, 'lain'),
    M('populasi', 'Populasi sasaran instrumen', 'contoh: guru sekolah rendah', 1, 'pop'),
    KONTEKS(0),
    M('reka', 'Bukti kesahan yang dilaporkan', 'contoh: kesahan kandungan, analisis faktor penerokaan dan pengesahan', 0, 'reka'),
    JURANG],
  dbr: [
    M('produk', 'Produk, modul atau model yang dibangunkan', 'contoh: modul latihan kepimpinan digital', 1, 'pv'),
    M('tujuan', 'Kemahiran atau hasil yang disasarkan', 'contoh: kompetensi digital guru', 0, 'pv'),
    M('populasi', 'Pengguna sasaran', 'contoh: guru besar sekolah rendah', 1, 'pop'),
    KONTEKS(0),
    M('reka', 'Pendekatan pembangunan dan penilaian', 'contoh: reka bentuk dan pembangunan tiga fasa, teknik Fuzzy Delphi', 0, 'reka'),
    JURANG],
  skop: [
    M('konsep', 'Konsep atau fenomena utama', 'contoh: pengurusan pengetahuan digital organisasi', 1, 'pv'),
    M('populasi', 'Populasi atau peserta, jika berkenaan', 'contoh: pemimpin sekolah dan guru', 0, 'pop'),
    KONTEKS(1, 'contoh: sekolah dan institusi pendidikan'),
    M('tumpuan', 'Perkara yang dipetakan', 'contoh: takrif, kerangka, instrumen dan jurang kajian', 0, 'lain'),
    M('tempoh', 'Tempoh bukti', 'contoh: 2015 hingga 2026', 0, 'lain'),
    JURANG],
  slr: [
    M('topik', 'Hubungan, intervensi atau fenomena yang diulas', 'contoh: kepimpinan digital pemimpin sekolah dan integrasi teknologi guru', 1, 'pv'),
    M('populasi', 'Populasi', 'contoh: guru dan pemimpin sekolah', 1, 'pop'),
    KONTEKS(0, 'contoh: pendidikan rendah dan menengah'),
    M('hasil', 'Hasil atau pemboleh ubah hasil', 'contoh: kompetensi digital guru', 0, 'pv'),
    M('tempoh', 'Tempoh bukti', 'contoh: 2015 hingga 2026', 0, 'lain'),
    JURANG],
  meta: [
    M('hubungan', 'Hubungan atau kesan yang digabungkan', 'contoh: hubungan antara kepimpinan pengetua dengan efikasi kendiri guru', 1, 'pv'),
    M('populasi', 'Populasi', 'contoh: guru sekolah', 1, 'pop'),
    M('penyederhana', 'Penyederhana yang diuji, jika ada', 'contoh: peringkat sekolah, budaya negara', 0, 'pv'),
    M('tempoh', 'Tempoh atau bilangan kajian', 'contoh: 2000 hingga 2025', 0, 'lain'),
    JURANG],
  biblio: [
    M('bidang', 'Bidang atau topik yang dianalisis', 'contoh: kepimpinan digital dalam pendidikan', 1, 'pv'),
    M('tempoh', 'Tempoh penerbitan', 'contoh: 2000 hingga 2025', 1, 'lain'),
    M('pangkalan', 'Pangkalan data', 'contoh: Scopus', 0, 'lain'),
    M('tumpuan', 'Tumpuan analisis', 'contoh: trend penerbitan, pengarang berpengaruh dan peta tema', 0, 'lain'),
    JURANG],
  naratif: [
    M('topik', 'Topik ulasan', 'contoh: pengurusan pengetahuan dalam organisasi pendidikan', 1, 'pv'),
    M('sudut', 'Sudut atau hujah ulasan', 'contoh: peralihan daripada amalan konvensional kepada amalan digital', 1, 'lain'),
    KONTEKS(0, 'contoh: sektor pendidikan Malaysia'),
    M('tempoh', 'Tempoh literatur', 'contoh: dua dekad terakhir', 0, 'lain'),
    JURANG],
  konsep: [
    M('konsep', 'Konsep, model atau kerangka yang dicadangkan', 'contoh: kerangka pengurusan pengetahuan digital sekolah', 1, 'pv'),
    M('teori', 'Teori atau asas yang digabungkan', 'contoh: model SECI dan teori kepimpinan transformasi', 0, 'lain'),
    KONTEKS(1, 'contoh: sekolah rendah Malaysia'),
    M('sumbangan', 'Bentuk sumbangan', 'contoh: kerangka baharu dengan lima proposisi', 1, 'lain'),
    JURANG],
  umum: [
    M('topik', 'Topik atau isu utama', 'contoh: kesediaan sekolah melaksanakan Dasar Pendidikan Digital', 1, 'pv'),
    M('sasaran', 'Populasi, konteks atau pembaca sasaran', 'contoh: pentadbir sekolah di Malaysia', 0, 'pop'),
    M('sumbangan', 'Bentuk tulisan dan sumbangannya', 'contoh: protokol kajian, pendirian, cadangan dasar', 0, 'lain'),
    JURANG]
};
/* Pelarasan label bagi jenis tertentu dalam keluarga yang sama. */
const LARAS = {
  'emp-eksperimen': { pvBebas: ['Intervensi atau rawatan (pemboleh ubah bebas)', 'contoh: modul latihan kepimpinan digital'], reka: ['Reka bentuk dan kaedah analisis', 'contoh: kuasi-eksperimen ujian pra dan pasca dengan kumpulan kawalan'] },
  'emp-longitudinal': { reka: ['Reka bentuk dan kaedah analisis', 'contoh: panel tiga gelombang, model pertumbuhan laten'] },
  'emp-sekunder': { reka: ['Sumber data dan kaedah analisis', 'contoh: data TALIS 2018, pemodelan berbilang aras'] },
  'met-replikasi': { jurang: ['Kajian asal yang direplikasi dan sebabnya', 'contoh: replikasi model asal dalam konteks sekolah rendah Malaysia'] },
  'emp-tindakan': { fenomena: ['Masalah amalan dan tindakan yang dilaksanakan', 'contoh: bimbingan rakan sebaya untuk meningkatkan penggunaan pelantar digital'], reka: ['Pendekatan dan kaedah data', 'contoh: kajian tindakan dua kitaran, pemerhatian dan jurnal refleksi'] },
  'emp-kes': { reka: ['Pendekatan dan kaedah data', 'contoh: kajian kes tunggal, temu bual, pemerhatian dan analisis dokumen'] }
};
export function medanJenis(jenis) {
  const asas = MEDAN[keluargaTajuk(jenis)] || MEDAN.umum; const l = LARAS[jenis]; if (!l) return asas;
  return asas.map(m => l[m.k] ? Object.assign({}, m, { label: l[m.k][0], contoh: l[m.k][1] }) : m);
}

/* ---- penanda jenis kajian dalam tajuk: frasa BM, frasa Inggeris, corak carian, aras (wajib, syor, pilihan), sumber ---- */
const N = (ms, en, re, aras, s) => ({ ms, en, re, aras, s: s || [] });
const ULAS = '(?:ulasan|tinjauan|sorotan|kajian|semakan)';
export const PENANDA = {
  'ul-skop': N('ulasan skop', 'a scoping review', new RegExp('\\b' + ULAS + '\\s+(?:literatur\\s+|kepustakaan\\s+)?(?:ber)?skop\\b|\\bscoping\\s+(?:literature\\s+)?review\\b', 'i'), 'wajib', ['prismascr']),
  'ul-sistematik': N('ulasan sistematik', 'a systematic review', new RegExp('\\b' + ULAS + '\\s+(?:literatur\\s+|kepustakaan\\s+)?(?:secara\\s+)?(?:ber)?sistematik\\b|\\bsystematic\\s+(?:literature\\s+)?review\\b', 'i'), 'wajib', ['prisma2020']),
  'ul-meta': N('meta-analisis', 'a meta-analysis', /\bmeta[\s-]?analisis\b|\bmeta[\s-]?analy(?:sis|ses|tic)\b/i, 'wajib', ['jarsquant', 'prisma2020ee']),
  'ul-metasintesis': N('sintesis meta kualitatif', 'a qualitative meta-synthesis', /\b(?:sintesis\s+meta|meta[\s-]?sintesis|meta[\s-]?etnografi|sintesis\s+(?:bukti\s+)?kualitatif)\b|\bmeta[\s-]?(?:synthesis|ethnography)\b|\bqualitative\s+evidence\s+synthesis\b|\bqualitative\s+systematic\s+review\b/i, 'syor', ['jarsqual']),
  'ul-naratif': N('ulasan naratif', 'a narrative review', new RegExp('\\b' + ULAS + '\\s+(?:literatur\\s+)?naratif\\b|\\bnarrative\\s+(?:literature\\s+)?review\\b|\\b' + ULAS + '\\s+literatur\\b|\\bliterature\\s+review\\b', 'i'), 'syor'),
  'ul-bersepadu': N('ulasan bersepadu', 'an integrative review', new RegExp('\\b' + ULAS + '\\s+(?:literatur\\s+)?(?:bersepadu|integratif)\\b|\\bintegrative\\s+(?:literature\\s+)?review\\b', 'i'), 'syor'),
  'ul-kritikal': N('ulasan kritikal', 'a critical review', new RegExp('\\b' + ULAS + '\\s+(?:literatur\\s+)?(?:kritikal|kritis)\\b|\\bcritical\\s+(?:literature\\s+)?review\\b', 'i'), 'syor'),
  'ul-payung': N('ulasan payung', 'an umbrella review', new RegExp('\\b' + ULAS + '\\s+payung\\b|\\bumbrella\\s+review\\b|\\boverview\\s+of\\s+(?:systematic\\s+)?reviews\\b|\\bulasan\\s+terhadap\\s+ulasan\\b', 'i'), 'wajib', ['prior', 'jbipayung']),
  'ul-pantas': N('ulasan pantas', 'a rapid review', new RegExp('\\b' + ULAS + '\\s+pantas\\b|\\brapid\\s+(?:evidence\\s+)?review\\b', 'i'), 'syor'),
  'ul-realis': N('sintesis realis', 'a realist synthesis', /\b(?:sintesis|ulasan)\s+realis\b|\brealist\s+(?:synthesis|review)\b/i, 'wajib', ['rameses']),
  'ul-pemetaan': N('pemetaan sistematik', 'a systematic mapping study', /\bpemetaan\s+(?:literatur\s+)?(?:secara\s+)?sistematik\b|\bsystematic\s+mapping\b|\bmapping\s+(?:study|review)\b/i, 'syor'),
  'ul-bibliometrik': N('analisis bibliometrik', 'a bibliometric analysis', /\bbibliometri[kc]s?\b|\bscientometri[kc]s?\b|\bsaintometrik\b/i, 'syor', ['biblio']),
  'emp-kuantitatif': N('tinjauan keratan rentas', 'a cross-sectional study', /\bkeratan\s+rentas\b|\bcross[\s-]?sectional\b|\btinjauan\b|\bsurvey\b|\bpemodelan\s+persamaan\b|\bstructural\s+equation\b|\b(?:perantara|pengantara|penyederhana|moderator|mediat\w+|moderat\w+)\b/i, 'pilihan', ['strobe', 'cross']),
  'emp-kualitatif': N('kajian kualitatif', 'a qualitative study', /\bkualitatif\b|\bqualitative\b|\bfenomenologi\w*\b|\bphenomenolog\w+\b|\bteori\s+beralas\b|\bgrounded\s+theory\b|\bkajian\s+kes\b|\bcase\s+stud(?:y|ies)\b|\btemu\s?bual\b|\binterviews?\b|\bnaratif\b|\bnarrative\s+inquiry\b|\betnografi\b|\bethnograph\w+\b|\bkumpulan\s+fokus\b|\bfocus\s+groups?\b/i, 'syor', ['srqr']),
  'emp-campuran': N('kajian kaedah campuran', 'a mixed methods study', /\bkaedah\s+(?:campuran|gabungan)\b|\bmixed[\s-]?methods?\b/i, 'syor', ['jarsqual']),
  'emp-eksperimen': N('kajian kuasi-eksperimen', 'a quasi-experimental study', /\b(?:kuasi[\s-]?)?eksperimen\w*\b|\b(?:quasi[\s-]?)?experiment\w*\b|\bpercubaan\s+terkawal\b|\brandomi[sz]ed\b|\bujian\s+pra\b|\bpretest\b|\brawak\b/i, 'syor', ['consort', 'trend']),
  'emp-kes': N('kajian kes', 'a case study', /\bkajian\s+(?:pelbagai\s+)?kes\b|\b(?:multiple[\s-]?)?case\s+stud(?:y|ies)\b/i, 'syor', ['srqr']),
  'emp-longitudinal': N('kajian longitudinal', 'a longitudinal study', /\blongitudinal\b|\bpanel\b|\bgelombang\b|\bwaves?\b/i, 'pilihan'),
  'emp-tindakan': N('kajian tindakan', 'an action research study', /\bkajian\s+tindakan\b|\baction\s+research\b/i, 'pilihan'),
  'emp-instrumen': N('pembangunan dan pengesahan', 'development and validation', /\b(?:pembangunan|pembinaan|pengesahan|kesahan|psikometri\w*)\b|\b(?:development|validation|validity|validating|psychometric\w*)\b/i, 'syor', ['cosmin']),
  'met-psikometrik': N('pengesahan', 'validation', /\b(?:pengesahan|kesahan|psikometri\w*|invarians|adaptasi)\b|\b(?:validation|validity|psychometric\w*|invariance|adaptation)\b/i, 'syor', ['cosmin']),
  'emp-dbr': N('reka bentuk dan pembangunan', 'design and development', /\b(?:reka\s+bentuk\s+dan\s+pembangunan|pembangunan|pembinaan)\b|\b(?:design[\s-]?based|design\s+and\s+development|development)\b/i, 'pilihan'),
  'emp-sekunder': N('analisis data sekunder', 'a secondary data analysis', /\bdata\s+sekunder\b|\bsecondary\s+(?:data\s+)?analysis\b|\bTALIS\b|\bPISA\b|\bTIMSS\b/i, 'pilihan'),
  'kon-konseptual': N('kertas konsep', 'a conceptual paper', /\b(?:kertas|kerangka|model)\s+konsep\w*\b|\bkonseptual\b|\bconceptual\b|\bkerangka\b|\bframework\b|\bproposisi\b|\bpropositions?\b/i, 'pilihan'),
  'kon-teori': N('model teori', 'a theoretical model', /\bteori\w*\b|\bmodel\b|\btheor\w+\b|\bproposisi\b|\bpropositions?\b/i, 'pilihan'),
  'kon-kerangka': N('kerangka', 'a framework', /\bkerangka\b|\bframework\b|\bmodel\b/i, 'pilihan'),
  'met-protokol': N('protokol', 'a protocol', /\bprotokol\b|\bprotocol\b/i, 'syor', ['prismap']),
  'met-replikasi': N('kajian replikasi', 'a replication study', /\breplikasi\b|\breplicat\w+\b/i, 'syor', ['jarsquant'])
};

/* ---- pola tajuk: kod, nama, huraian, templat [BM, EN], keluarga yang sesuai; lalai: false = hanya apabila diminta atau sebagai pilihan kelima ----
   Bentuk dua bahagian (topik atau hubungan, titik bertindih, kemudian reka bentuk, konteks atau skop) ialah bentuk paling lazim dalam
   jurnal pendidikan dan sains sosial (Hudson, 2016; Hyland dan Zou, 2022), maka kebanyakan pola mengikutinya. Tajuk soalan dan tajuk
   dapatan bukan pilihan lalai kerana buktinya bercampur (Jamali dan Nikzad, 2011; Wager et al., 2016), dan tidak ditawarkan bagi ulasan
   sistematik, ulasan skop dan meta-analisis kerana Manual JBI meminta tajuk ulasan tidak ditulis sebagai soalan. Pola frasa menarik
   sebelum titik bertindih tidak ditawarkan (Sagi dan Yechiam, 2008; Keating et al., 2022). */
export const POLA = [
  { k: 'topik-jenis', nama: 'Topik, kemudian jenis kajian', hurai: 'Topik dan konteks sebagai tajuk utama; jenis kajian selepas titik bertindih. Bentuk paling lazim, dan bagi artikel ulasan ia memudahkan jenis ulasan dikesan.', t: ['[Konsep atau hubungan] dalam [konteks]: [jenis kajian]', '[Concept or relationship] in [context]: A [study type]'], kel: ['skop', 'slr', 'meta', 'biblio', 'naratif', 'kual', 'campur', 'kuan', 'instr', 'dbr', 'konsep', 'umum'] },
  { k: 'jenis-skop', nama: 'Jenis kajian berserta skopnya', hurai: 'Seperti pola pertama, tetapi bahagian selepas titik bertindih turut menyatakan skop ulasan: perkara yang dikumpul, bilangan kajian atau tempoh.', t: ['[Konsep] dalam [konteks]: [jenis ulasan] terhadap [perkara yang dikumpul atau tempoh]', '[Concept] in [context]: A [review type] of [what is collected or the period]'], kel: ['skop', 'slr', 'meta', 'biblio', 'naratif'] },
  { k: 'hubungan', nama: 'Hubungan antara pemboleh ubah', hurai: 'Frasa nama yang menamakan pemboleh ubah utama dan arah hubungannya, diikuti populasi.', t: ['Pengaruh [X] terhadap [Y] dalam kalangan [populasi]', 'The relationship between [X] and [Y] among [population]'], kel: ['kuan', 'campur', 'meta', 'slr'] },
  { k: 'peranan', nama: 'Peranan pengantara atau penyederhana', hurai: 'Menonjolkan mekanisme: pemboleh ubah ketiga yang menjelaskan atau mengubah hubungan. Sesuai bagi kajian pemodelan persamaan struktur.', t: ['[M] sebagai pengantara dalam hubungan antara [X] dengan [Y]', 'The mediating role of [M] in the relationship between [X] and [Y]'], kel: ['kuan', 'campur', 'meta'] },
  { k: 'dari-ke', nama: 'Daripada peramal kepada hasil', hurai: 'Menunjukkan arah model: peramal dan hasil sebagai tajuk utama, mekanisme yang menghubungkannya selepas titik bertindih.', t: ['Daripada [X] kepada [Y]: peranan [M] sebagai pengantara', 'From [X] to [Y]: The mediating role of [M]'], kel: ['kuan', 'campur'] },
  { k: 'bukti-dari', nama: 'Hubungan, kemudian sumber bukti', hurai: 'Hubungan atau topik sebagai tajuk utama; selepas titik bertindih, populasi atau data yang menjadi sumber bukti. Sesuai apabila populasi atau latar itulah yang membezakan kajian.', t: ['[X] dan [Y]: bukti daripada [populasi] di [konteks]', '[X] and [Y]: Evidence from [population] in [context]'], kel: ['kuan', 'campur', 'kual'] },
  { k: 'pemetaan', nama: 'Kata kerja pemetaan di hadapan', hurai: 'Bermula dengan perbuatan ulasan itu sendiri (memetakan, menjejaki, merumuskan), kemudian jenis ulasan.', t: ['Memetakan bukti tentang [konsep] dalam [konteks]: [jenis ulasan]', 'Mapping the evidence on [concept] in [context]: A [review type]'], kel: ['skop', 'biblio', 'naratif', 'slr'] },
  { k: 'tumpuan-dahulu', nama: 'Perkara yang dikumpul di hadapan', hurai: 'Bermula dengan apa yang dikumpul oleh ulasan (takrif, kerangka, instrumen, tema), kemudian konsep, konteks dan jenis ulasan.', t: ['[Takrif, kerangka dan instrumen] [konsep] dalam [konteks]: [jenis ulasan]', '[Definitions, frameworks and instruments] of [concept] in [context]: A [review type]'], kel: ['skop', 'slr', 'biblio', 'naratif'] },
  { k: 'konteks-dahulu', nama: 'Populasi di hadapan', hurai: 'Kumpulan yang dikaji disebut dahulu kerana di situlah letak sumbangan artikel; nama negara atau negeri, jika perlu, kekal di hujung.', t: ['[Populasi] dan [konsep]: [jenis kajian]', '[Population] and [concept]: A [study type]'], kel: ['kual', 'kuan', 'campur', 'skop', 'slr', 'meta', 'biblio', 'naratif', 'konsep', 'instr', 'dbr', 'umum'] },
  { k: 'pengalaman', nama: 'Pengalaman peserta', hurai: 'Menamakan peserta dan pengalaman atau amalan yang diteroka, diikuti pendekatan kualitatif.', t: ['Pengalaman [peserta] tentang [fenomena]: [pendekatan]', '[Participants\'] experiences of [phenomenon]: A [approach]'], kel: ['kual', 'campur'] },
  { k: 'cara', nama: 'Cara sesuatu amalan dilaksanakan', hurai: 'Klausa "cara" sebagai pernyataan (bukan soalan) tentang proses yang diteroka, diikuti pendekatan kajian.', t: ['Cara [peserta] [melaksanakan amalan] dalam [konteks]: [pendekatan]', 'How [participants] [carry out the practice] in [context]: A [approach]'], kel: ['kual', 'campur', 'dbr'] },
  { k: 'pembangunan', nama: 'Pembangunan dan pengesahan', hurai: 'Menamakan instrumen atau produk, konstruk yang diukur dan populasi sasaran.', t: ['Pembangunan dan pengesahan [instrumen] bagi mengukur [konstruk] dalam kalangan [populasi]', 'Development and validation of [instrument] to measure [construct] among [population]'], kel: ['instr', 'dbr'] },
  { k: 'sifat-psikometrik', nama: 'Sifat psikometrik instrumen', hurai: 'Menamakan instrumen dan populasi; sesuai apabila instrumen sedia ada disahkan atau diadaptasi.', t: ['Sifat psikometrik [instrumen] dalam kalangan [populasi]', 'Psychometric properties of [instrument] among [population]'], kel: ['instr'] },
  { k: 'mengukur', nama: 'Konstruk yang diukur di hadapan', hurai: 'Bermula dengan konstruk dan populasi; pembangunan serta pengesahan instrumen selepas titik bertindih.', t: ['Mengukur [konstruk] dalam kalangan [populasi]: pembangunan dan pengesahan [instrumen]', 'Measuring [construct] among [population]: Development and validation of [instrument]'], kel: ['instr'] },
  { k: 'reka-nilai', nama: 'Reka bentuk, pembangunan dan penilaian', hurai: 'Menamakan produk yang dibangunkan, tujuannya dan pengguna sasaran, mengikut fasa kajian.', t: ['Reka bentuk, pembangunan dan penilaian [produk] untuk [tujuan] [pengguna sasaran]', 'Design, development and evaluation of [product] for [purpose] among [target users]'], kel: ['dbr'] },
  { k: 'trend', nama: 'Trend dan arah penyelidikan', hurai: 'Menamakan bidang, tempoh yang diliputi dan sifat analisis bibliometrik.', t: ['Trend penyelidikan [bidang], [tempoh]: analisis bibliometrik', 'Research trends in [field], [period]: A bibliometric analysis'], kel: ['biblio'] },
  { k: 'kerangka', nama: 'Kerangka atau model yang dicadangkan', hurai: 'Menamakan sumbangan konseptual (kerangka, model, tipologi) dan konteks penggunaannya.', t: ['[Konsep]: kerangka konsep bagi [konteks]', '[Concept]: A conceptual framework for [context]'], kel: ['konsep', 'naratif', 'umum'] },
  { k: 'ke-arah', nama: 'Ke arah', hurai: 'Menandakan cadangan yang masih dibina; lazim bagi kertas konsep dan kertas kedudukan.', t: ['Ke arah [kerangka atau model] bagi [konteks]', 'Towards a [framework or model] of [concept] in [context]'], kel: ['konsep', 'umum', 'naratif'] },
  { k: 'agenda', nama: 'Topik, kemudian agenda atau implikasi', hurai: 'Topik sebagai tajuk utama; selepas titik bertindih, apa yang ditawarkan artikel: agenda kajian, hala tuju atau implikasi dasar.', t: ['[Topik] dalam [konteks]: agenda kajian dan implikasi dasar', '[Topic] in [context]: A research agenda and policy implications'], kel: ['konsep', 'umum', 'naratif'] },
  { k: 'soalan', nama: 'Tajuk soalan', lalai: false, hurai: 'Soalan terbuka sebagai tajuk dengan huraian yang jelas selepasnya. Bukan pilihan lalai: bukti tentang kesannya bercampur, dan soalan ya atau tidak dielakkan.', t: ['Bagaimana [X] membentuk [Y]? [Jenis kajian atau konteks]', 'How does [X] shape [Y]? [Study type or context]'], kel: ['kuan', 'kual', 'campur', 'naratif', 'konsep', 'dbr', 'umum'] },
  { k: 'dapatan', nama: 'Tajuk dapatan', lalai: false, hurai: 'Frasa atau ayat yang menyatakan dapatan utama. Hanya apabila dapatan itu sudah dinyatakan oleh penulis dalam pembayang dan jurnal sasaran membenarkannya.', t: ['[X] meningkatkan [Y] melalui [M]: [jenis kajian]', '[X] improves [Y] through [M]: [Study type]'], kel: ['kuan', 'campur'] }
];
export const polaKel = kel => POLA.filter(p => p.kel.includes(kel));
export const namaPola = k => { const p = POLA.find(x => x.k === String(k || '').trim()); return p ? p.nama : String(k || '').trim(); };
/* Jenis ulasan yang manualnya (JBI) meminta tajuk tidak ditulis sebagai soalan. */
export const TANPA_SOALAN = new Set(['ul-skop', 'ul-sistematik', 'ul-meta', 'ul-payung']);

/* ---- panjang tajuk (patah perkataan) ----
   Tajuk artikel berbahasa Inggeris kini lazimnya 11 hingga 15 patah perkataan (Jiang dan Hyland, 2023); dalam jurnal pendidikan terkemuka
   puratanya 14.2, dengan 48 peratus antara 11 hingga 15 dan 35 peratus melebihi 15 (Hyland dan Zou, 2022). Sasaran aplikasi: 10 hingga 15,
   kelonggaran hingga 17, amaran melebihi 17, gagal melebihi 20 atau kurang daripada 4 (Fox dan Burns, 2015, tentang tajuk yang sangat panjang). Belum ada kajian setara bagi tajuk Bahasa Melayu, maka
   julat yang sama digunakan sebagai panduan. APA Style tidak menetapkan had; had jurnal sasaran sentiasa mengatasi julat ini. */
export const PANJANG = { min: 6, sasar: [10, 15], lazim: 17, had: 20 };

/* ---- sumber: setiap satu disahkan (rekod Crossref atau laman rasmi dibuka) pada November 2026 ---- */
const S = (pendek, ruj, url) => ({ pendek, ruj, url });
export const SUMBER = {
  prisma2020: S('Page, McKenzie, et al. (2021)', 'Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., Shamseer, L., Tetzlaff, J. M., Akl, E. A., Brennan, S. E., Chou, R., Glanville, J., Grimshaw, J. M., Hróbjartsson, A., Lalu, M. M., Li, T., Loder, E. W., Mayo-Wilson, E., McDonald, S., ... Moher, D. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. BMJ, 372, Article n71.', 'https://doi.org/10.1136/bmj.n71'),
  prisma2020ee: S('Page, Moher, et al. (2021)', 'Page, M. J., Moher, D., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., Shamseer, L., Tetzlaff, J. M., Akl, E. A., Brennan, S. E., Chou, R., Glanville, J., Grimshaw, J. M., Hróbjartsson, A., Lalu, M. M., Li, T., Loder, E. W., Mayo-Wilson, E., McDonald, S., ... McKenzie, J. E. (2021). PRISMA 2020 explanation and elaboration: Updated guidance and exemplars for reporting systematic reviews. BMJ, 372, Article n160.', 'https://doi.org/10.1136/bmj.n160'),
  prismascr: S('Tricco et al. (2018)', 'Tricco, A. C., Lillie, E., Zarin, W., O\'Brien, K. K., Colquhoun, H., Levac, D., Moher, D., Peters, M. D. J., Horsley, T., Weeks, L., Hempel, S., Akl, E. A., Chang, C., McGowan, J., Stewart, L., Hartling, L., Aldcroft, A., Wilson, M. G., Garritty, C., ... Straus, S. E. (2018). PRISMA extension for scoping reviews (PRISMA-ScR): Checklist and explanation. Annals of Internal Medicine, 169(7), 467-473.', 'https://doi.org/10.7326/M18-0850'),
  jbiskop: S('Peters et al. (2024)', 'Peters, M. D. J., Godfrey, C., McInerney, P., Munn, Z., Tricco, A. C., & Khalil, H. (2024). Scoping reviews. In E. Aromataris, C. Lockwood, K. Porritt, B. Pilla, & Z. Jordan (Eds.), JBI manual for evidence synthesis. JBI. (Panduan tajuk terdapat dalam edisi 2020 dan 2024; bab ini ditulis semula pada 2026 dan teks baharu tidak lagi memuat panduan tajuk.)', 'https://doi.org/10.46658/JBIMES-24-09'),
  jbisr: S('Tufanaru et al. (2024)', 'Tufanaru, C., Munn, Z., Aromataris, E., Campbell, J., & Hopp, L. (2024). Systematic reviews of effectiveness. In E. Aromataris, C. Lockwood, K. Porritt, B. Pilla, & Z. Jordan (Eds.), JBI manual for evidence synthesis. JBI.', 'https://doi.org/10.46658/JBIMES-24-03'),
  jbipayung: S('Aromataris et al. (2024)', 'Aromataris, E., Fernandez, R., Godfrey, C., Holly, C., Khalil, H., & Tungpunkom, P. (2024). Umbrella reviews. In E. Aromataris, C. Lockwood, K. Porritt, B. Pilla, & Z. Jordan (Eds.), JBI manual for evidence synthesis. JBI.', 'https://doi.org/10.46658/JBIMES-24-08'),
  prior: S('Gates et al. (2022)', 'Gates, M., Gates, A., Pieper, D., Fernandes, R. M., Tricco, A. C., Moher, D., Brennan, S. E., Li, T., Pollock, M., Lunny, C., Sepúlveda, D., McKenzie, J. E., Scott, S. D., Robinson, K. A., Matthias, K., Bougioukas, K. I., Fusar-Poli, P., Whiting, P., Moss, S. J., & Hartling, L. (2022). Reporting guideline for overviews of reviews of healthcare interventions: Development of the PRIOR statement. BMJ, 378, Article e070849.', 'https://doi.org/10.1136/bmj-2022-070849'),
  stevens: S('Stevens et al. (2025)', 'Stevens, A., Hersi, M., Garritty, C., Hartling, L., Shea, B. J., Stewart, L. A., Welch, V. A., & Tricco, A. C. (2025). Rapid review method series: Interim guidance for the reporting of rapid reviews. BMJ Evidence-Based Medicine, 30(2), 118-123.', 'https://doi.org/10.1136/bmjebm-2024-112899'),
  rameses: S('Wong et al. (2013)', 'Wong, G., Greenhalgh, T., Westhorp, G., Buckingham, J., & Pawson, R. (2013). RAMESES publication standards: Realist syntheses. BMC Medicine, 11, Article 21.', 'https://doi.org/10.1186/1741-7015-11-21'),
  biblio: S('Montazeri et al. (2023)', 'Montazeri, A., Mohammadi, S., M.Hesari, P., Ghaemi, M., Riazi, H., & Sheikhi-Mobarakeh, Z. (2023). Preliminary guideline for reporting bibliometric reviews of the biomedical literature (BIBLIO): A minimum requirements. Systematic Reviews, 12, Article 239.', 'https://doi.org/10.1186/s13643-023-02410-2'),
  prismap: S('Moher et al. (2015)', 'Moher, D., Shamseer, L., Clarke, M., Ghersi, D., Liberati, A., Petticrew, M., Shekelle, P., Stewart, L. A., & PRISMA-P Group. (2015). Preferred reporting items for systematic review and meta-analysis protocols (PRISMA-P) 2015 statement. Systematic Reviews, 4, Article 1.', 'https://doi.org/10.1186/2046-4053-4-1'),
  jarsquant: S('Appelbaum et al. (2018)', 'Appelbaum, M., Cooper, H., Kline, R. B., Mayo-Wilson, E., Nezu, A. M., & Rao, S. M. (2018). Journal article reporting standards for quantitative research in psychology: The APA Publications and Communications Board task force report. American Psychologist, 73(1), 3-25.', 'https://doi.org/10.1037/amp0000191'),
  jarsqual: S('Levitt et al. (2018)', 'Levitt, H. M., Bamberg, M., Creswell, J. W., Frost, D. M., Josselson, R., & Suárez-Orozco, C. (2018). Journal article reporting standards for qualitative primary, qualitative meta-analytic, and mixed methods research in psychology: The APA Publications and Communications Board task force report. American Psychologist, 73(1), 26-46.', 'https://doi.org/10.1037/amp0000151'),
  srqr: S('O\'Brien et al. (2014)', 'O\'Brien, B. C., Harris, I. B., Beckman, T. J., Reed, D. A., & Cook, D. A. (2014). Standards for reporting qualitative research: A synthesis of recommendations. Academic Medicine, 89(9), 1245-1251.', 'https://doi.org/10.1097/ACM.0000000000000388'),
  strobe: S('Vandenbroucke et al. (2007)', 'Vandenbroucke, J. P., von Elm, E., Altman, D. G., Gøtzsche, P. C., Mulrow, C. D., Pocock, S. J., Poole, C., Schlesselman, J. J., Egger, M., & STROBE Initiative. (2007). Strengthening the Reporting of Observational Studies in Epidemiology (STROBE): Explanation and elaboration. PLoS Medicine, 4(10), Article e297.', 'https://doi.org/10.1371/journal.pmed.0040297'),
  cross: S('Sharma et al. (2021)', 'Sharma, A., Minh Duc, N. T., Luu Lam Thang, T., Nam, N. H., Ng, S. J., Abbas, K. S., Huy, N. T., Marušić, A., Paul, C. L., Kwok, J., Karbwang, J., de Waure, C., Drummond, F. J., Kizawa, Y., Taal, E., Vermeulen, J., Lee, G. H. M., Gyedu, A., To, K. G., ... Karamouzian, M. (2021). A consensus-based Checklist for Reporting of Survey Studies (CROSS). Journal of General Internal Medicine, 36(10), 3179-3187.', 'https://doi.org/10.1007/s11606-021-06737-1'),
  consort: S('Hopewell et al. (2025)', 'Hopewell, S., Chan, A.-W., Collins, G. S., Hróbjartsson, A., Moher, D., Schulz, K. F., Tunn, R., Aggarwal, R., Berkwits, M., Berlin, J. A., Bhandari, N., Butcher, N. J., Campbell, M. K., Chidebe, R. C. W., Elbourne, D., Farmer, A., Fergusson, D. A., Golub, R. M., Goodman, S. N., ... Boutron, I. (2025). CONSORT 2025 statement: Updated guideline for reporting randomised trials. BMJ, 389, Article e081123.', 'https://doi.org/10.1136/bmj-2024-081123'),
  trend: S('Des Jarlais et al. (2004)', 'Des Jarlais, D. C., Lyles, C., Crepaz, N., & TREND Group. (2004). Improving the reporting quality of nonrandomized evaluations of behavioral and public health interventions: The TREND statement. American Journal of Public Health, 94(3), 361-366.', 'https://doi.org/10.2105/AJPH.94.3.361'),
  cosmin: S('Gagnier et al. (2021)', 'Gagnier, J. J., Lai, J., Mokkink, L. B., & Terwee, C. B. (2021). COSMIN reporting guideline for studies on measurement properties of patient-reported outcome measures. Quality of Life Research, 30(8), 2197-2218.', 'https://doi.org/10.1007/s11136-021-02822-4'),
  delphistar: S('Niederberger et al. (2024)', 'Niederberger, M., Schifano, J., Deckert, S., Hirt, J., Homberg, A., Köberich, S., Kuhn, R., Rommel, A., Sonnberger, M., & the DEWISS network. (2024). Delphi studies in social and health sciences: Recommendations for an interdisciplinary standardized reporting (DELPHISTAR). Results of a Delphi study. PLOS ONE, 19(8), Article e0304651.', 'https://doi.org/10.1371/journal.pone.0304651'),
  accord: S('Gattrell et al. (2024)', 'Gattrell, W. T., Logullo, P., van Zuuren, E. J., Price, A., Hughes, E. L., Blazey, P., Winchester, C. C., Tovey, D., Goldman, K., Hungin, A. P., & Harrison, N. (2024). ACCORD (ACcurate COnsensus Reporting Document): A reporting guideline for consensus methods in biomedicine developed via a modified Delphi. PLOS Medicine, 21(1), Article e1004326.', 'https://doi.org/10.1371/journal.pmed.1004326'),
  aera: S('American Educational Research Association (2006)', 'American Educational Research Association. (2006). Standards for reporting on empirical social science research in AERA publications. Educational Researcher, 35(6), 33-40.', 'https://doi.org/10.3102/0013189X035006033'),
  apastyle: S('American Psychological Association (2022b)', 'American Psychological Association. (2022b, July). Title page setup. APA Style.', 'https://apastyle.apa.org/style-grammar-guidelines/paper-format/title-page'),
  apacase: S('American Psychological Association (2022a)', 'American Psychological Association. (2022a, July). Title case capitalization. APA Style.', 'https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case'),
  tnf: S('Taylor & Francis (t.t.)', 'Taylor & Francis. (n.d.). Using keywords to write your title and abstract. Author Services. Retrieved November 11, 2026.', 'https://authorservices.taylorandfrancis.com/publishing-your-research/writing-your-paper/using-keywords-to-write-title-and-abstract/'),
  dbphuruf: S('Dewan Bahasa dan Pustaka (t.t.-a)', 'Dewan Bahasa dan Pustaka. (n.d.-a). Khidmat Nasihat Bahasa: Jawapan tentang huruf besar, kata sendi nama dan kata hubung dalam tajuk. Pusat Rujukan Persuratan Melayu. Retrieved November 11, 2026.', 'https://prpm.dbp.gov.my/Cari1?keyword=tajuk+kata+sendi&d=175768&'),
  dbpfrasa: S('Dewan Bahasa dan Pustaka (t.t.-b)', 'Dewan Bahasa dan Pustaka. (n.d.-b). Khidmat Nasihat Bahasa: Jawapan tentang "dalam kalangan"; jawapan tentang "terhadap", "antara ... dengan", "pemboleh ubah" dan "pengantara" terdapat melalui carian kata itu dalam perkhidmatan yang sama. Pusat Rujukan Persuratan Melayu. Retrieved November 11, 2026.', 'https://prpm.dbp.gov.my/Cari1?keyword=dalam+kalangan&d=175768&'),
  mcc: S('Pusat Sitasi Malaysia (2018)', 'Pusat Sitasi Malaysia. (2018). Garis panduan penerbitan jurnal ilmiah Malaysia. Jabatan Pendidikan Tinggi, Kementerian Pendidikan Malaysia.', 'https://mycc.mohe.gov.my/images/Produk_Perkhidmatan/penerbitan/Garis_Panduan_Penerbitan_Jurnal_Ilmiah_Malaysia.pdf'),
  jpm: S('Jurnal Pendidikan Malaysia (t.t.)', 'Jurnal Pendidikan Malaysia. (n.d.). Submissions. Universiti Kebangsaan Malaysia. Retrieved November 11, 2026.', 'https://ejournal.ukm.my/jpend/about/submissions'),
  akademika: S('Akademika (t.t.)', 'Akademika. (n.d.). Submissions. Universiti Kebangsaan Malaysia. Retrieved November 10, 2026.', 'https://ejournal.ukm.my/akademika/about/submissions'),
  mrj: S('Management Research Journal (t.t.)', 'Management Research Journal. (n.d.). Author guidelines. Universiti Pendidikan Sultan Idris. Retrieved November 10, 2026.', 'https://ejournal.upsi.edu.my/index.php/MRJ/Author_Guidelines'),
  kousha: S('Kousha dan Thelwall (2024)', 'Kousha, K., & Thelwall, M. (2024). Factors associating with or predicting more cited or higher quality journal articles: An Annual Review of Information Science and Technology (ARIST) paper. Journal of the Association for Information Science and Technology, 75(3), 215-244.', 'https://doi.org/10.1002/asi.24810'),
  pottier: S('Pottier et al. (2024)', 'Pottier, P., Lagisz, M., Burke, S., Drobniak, S. M., Downing, P. A., Macartney, E. L., Martinig, A. R., Mizuno, A., Morrison, K., Pollo, P., Ricolfi, L., Tam, J., Williams, C., Yang, Y., & Nakagawa, S. (2024). Title, abstract and keywords: A practical guide to maximize the visibility and impact of academic papers. Proceedings of the Royal Society B: Biological Sciences, 291(2027), Article 20241222.', 'https://doi.org/10.1098/rspb.2024.1222'),
  hyland: S('Hyland dan Zou (2022)', 'Hyland, K., & Zou, H. (2022). Titles in research articles. Journal of English for Academic Purposes, 56, Article 101094.', 'https://doi.org/10.1016/j.jeap.2022.101094'),
  jiang: S('Jiang dan Hyland (2023)', 'Jiang, F. K., & Hyland, K. (2023). Titles in research articles: Changes across time and discipline. Learned Publishing, 36(2), 239-248.', 'https://doi.org/10.1002/leap.1498'),
  hudson: S('Hudson (2016)', 'Hudson, J. (2016). An analysis of the titles of papers submitted to the UK REF in 2014: Authors, disciplines, and stylistic details. Scientometrics, 109(2), 871-889.', 'https://doi.org/10.1007/s11192-016-2081-4'),
  fox: S('Fox dan Burns (2015)', 'Fox, C. W., & Burns, C. S. (2015). The relationship between manuscript title structure and success: Editorial decisions and citation performance for an ecological journal. Ecology and Evolution, 5(10), 1970-1980.', 'https://doi.org/10.1002/ece3.1480'),
  thelwall: S('Thelwall (2017)', 'Thelwall, M. (2017). Avoiding obscure topics and generalising findings produces higher impact research. Scientometrics, 110(1), 307-320.', 'https://doi.org/10.1007/s11192-016-2159-z'),
  martinez: S('Martínez dan Mammola (2021)', 'Martínez, A., & Mammola, S. (2021). Specialized terminology reduces the number of citations of scientific papers. Proceedings of the Royal Society B: Biological Sciences, 288(1948), Article 20202581.', 'https://doi.org/10.1098/rspb.2020.2581'),
  heard: S('Heard et al. (2023)', 'Heard, S. B., Cull, C. A., & White, E. R. (2023). If this title is funny, will you cite me? Citation impacts of humour and other features of article titles in ecology and evolution. FACETS, 8, 1-15.', 'https://doi.org/10.1139/facets-2022-0079'),
  abramo: S('Abramo et al. (2016)', 'Abramo, G., D\'Angelo, C. A., & Di Costa, F. (2016). The effect of a country\'s name in the title of a publication on its visibility and citability. Scientometrics, 109(3), 1895-1909.', 'https://doi.org/10.1007/s11192-016-2120-1'),
  burns: S('Burns dan Islam (2024)', 'Burns, C. S., & Islam, M. A. (2024). A citation analysis examining geographical specificity in article titles. Scientometrics, 129(7), 4317-4328.', 'https://doi.org/10.1007/s11192-024-05075-3'),
  sagi: S('Sagi dan Yechiam (2008)', 'Sagi, I., & Yechiam, E. (2008). Amusing titles in scientific journals and article citation. Journal of Information Science, 34(5), 680-687.', 'https://doi.org/10.1177/0165551507086261'),
  keating: S('Keating et al. (2022)', 'Keating, D. M., Richards, A. S., Palomares, N. A., Banas, J. A., Joyce, N., & Rains, S. A. (2022). Titling practices and their implications in communication research 1970-2010: Cutesy cues carry citation consequences. Communication Research, 49(5), 627-648.', 'https://doi.org/10.1177/0093650219887025'),
  jamali: S('Jamali dan Nikzad (2011)', 'Jamali, H. R., & Nikzad, M. (2011). Article title type and its relation with the number of downloads and citations. Scientometrics, 88(2), 653-661.', 'https://doi.org/10.1007/s11192-011-0412-z'),
  cofield: S('Cofield et al. (2010)', 'Cofield, S. S., Corona, R. V., & Allison, D. B. (2010). Use of causal language in observational studies of obesity and nutrition. Obesity Facts, 3(6), 353-356.', 'https://doi.org/10.1159/000322940'),
  dahabreh: S('Dahabreh dan Bibbins-Domingo (2024)', 'Dahabreh, I. J., & Bibbins-Domingo, K. (2024). Causal inference about the effects of interventions from observational studies in medical journals. JAMA, 331(21), 1845-1853.', 'https://doi.org/10.1001/jama.2024.7741'),
  annesley: S('Annesley (2010)', 'Annesley, T. M. (2010). The title says it all. Clinical Chemistry, 56(3), 357-360.', 'https://doi.org/10.1373/clinchem.2009.141523'),
  bahadoran: S('Bahadoran et al. (2019)', 'Bahadoran, Z., Mirmiran, P., Kashfi, K., & Ghasemi, A. (2019). The principles of biomedical scientific writing: Title. International Journal of Endocrinology and Metabolism, 17(4), Article e98326.', 'https://doi.org/10.5812/ijem.98326'),
  wager: S('Wager et al. (2016)', 'Wager, E., Altman, D. G., Simera, I., & Toma, T. P. (2016). Do declarative titles affect readers\' perceptions of research findings? A randomized trial. Research Integrity and Peer Review, 1, Article 11.', 'https://doi.org/10.1186/s41073-016-0018-3')
};

/* ---- peraturan tajuk: am (semua jenis), mengikut keluarga, dan mengikut jenis (ganti: true menggantikan peraturan keluarga) ----
   Ditulis dengan kata-kata sendiri daripada garis panduan dan kajian yang dinamakan; tiada ayat sumber disalin. */
const P = (t, ...s) => ({ t, s });
export const PERATURAN = {
  am: [
    P('Tajuk menyatakan dengan jelas apa yang dikaji dan memuat istilah utama yang dicari pembaca; fokus dan padat.', 'aera', 'apastyle'),
    P('APA Style tidak menetapkan had panjang. Tajuk artikel berbahasa Inggeris kini lazimnya 11 hingga 15 patah perkataan; dalam jurnal pendidikan terkemuka puratanya kira-kira 14 dan kira-kira satu pertiga melebihi 15. Sasaran di sini 10 hingga 15 dengan kelonggaran hingga 17, dan tajuk melebihi 20 ditanda terlalu panjang. Had jurnal sasaran mengatasi julat ini.', 'apastyle', 'jiang', 'hyland', 'fox'),
    P('Bentuk dua bahagian (topik atau hubungan, titik bertindih, kemudian reka bentuk, konteks atau skop) ialah bentuk paling lazim dalam jurnal pendidikan: kira-kira 61 peratus tajuk pendidikan dan 53 peratus tajuk perniagaan dan pengurusan dalam data penilaian penyelidikan United Kingdom 2014 mempunyai titik bertindih. Ia kurang lazim dalam ekonomi dan psikologi.', 'hudson', 'hyland'),
    P('Guna istilah yang lazim bagi konstruk utama; dalam beberapa sampel besar, istilah yang jarang digunakan dan jargon dikaitkan dengan sitasi yang lebih rendah. Elak singkatan, kecuali singkatan itu sendiri istilah carian yang mantap bagi sesuatu kerangka, instrumen atau kaedah.', 'thelwall', 'martinez', 'heard'),
    P('Dalam beberapa kajian, artikel yang menamakan negara dalam tajuk menerima sitasi yang sedikit lebih rendah (kesannya kecil). Maka nama negara, negeri atau tapak kajian wajar diletakkan di hujung tajuk atau selepas titik bertindih, dan hanya apabila latar itu sebahagian daripada sumbangan artikel atau diminta jurnal. Jangan pula meluaskan dakwaan melebihi data.', 'abramo', 'burns'),
    P('Elak jenaka, permainan kata, petikan dan frasa klise, terutama sebelum titik bertindih; dalam psikologi dan komunikasi, tajuk sebegini tidak menambah sitasi dan ada kalanya mengurangkannya.', 'sagi', 'keating'),
    P('Buang pembuka pengisi (contohnya "Satu kajian tentang", "A study of") dan kata sifat yang tidak menambah maklumat (contohnya baharu, novel, inovatif, komprehensif).', 'annesley', 'bahadoran', 'tnf'),
    P('Tajuk soalan dan tajuk yang menyatakan dapatan bukan pilihan lalai kerana buktinya bercampur. Jika tajuk soalan digunakan, pilih soalan terbuka dengan huraian yang jelas selepasnya.', 'jamali', 'wager'),
    P('Tajuk yang baik memudahkan artikel ditemui dan difahami. Kajian setakat ini tidak membuktikan bahawa mengubah ciri tajuk menaikkan sitasi; kesannya kecil berbanding jurnal, pengarang dan isi artikel.', 'kousha', 'pottier')
  ],
  skop: [
    P('Namakan artikel sebagai ulasan skop dalam tajuk (PRISMA-ScR, butiran 1).', 'prismascr'),
    P('Bina tajuk daripada populasi, konsep dan konteks. Hasil atau intervensi tidak perlu disebut; konteks dimasukkan apabila ia tumpuan utama ulasan.', 'jbiskop'),
    P('Letakkan jenis ulasan di hujung selepas titik bertindih dan jangan tulis tajuk sebagai soalan. Tajuk, soalan ulasan dan kriteria kelayakan mesti selaras.', 'jbiskop')
  ],
  slr: [
    P('Namakan artikel sebagai ulasan sistematik dalam tajuk (PRISMA 2020, butiran 1). Label "ulasan", "ulasan literatur" atau "sintesis bukti" sahaja tidak memadai kerana tidak membezakan ulasan sistematik daripada ulasan lain.', 'prisma2020', 'prisma2020ee'),
    P('Tajuk membawa objektif atau soalan utama ulasan, lazimnya populasi dan intervensi atau topik. Boleh ditambah: "dengan meta-analisis", reka bentuk kajian yang dimasukkan, atau status kemas kini.', 'prisma2020ee'),
    P('Manual JBI meminta tajuk ulasan sistematik tidak ditulis sebagai soalan.', 'jbisr')
  ],
  meta: [
    P('Nyatakan soalan kajian dan jenis sintesis, iaitu meta-analisis, dalam tajuk (piawaian APA bagi meta-analisis).', 'jarsquant'),
    P('Jika meta-analisis ini sebahagian daripada ulasan sistematik, kenal pasti artikel sebagai ulasan sistematik juga, contohnya "ulasan sistematik dan meta-analisis". Kedua-dua istilah itu tidak sama makna: meta-analisis hanya merujuk sintesis statistik.', 'prisma2020', 'prisma2020ee'),
    P('Manual JBI meminta tajuk ulasan sistematik tidak ditulis sebagai soalan.', 'jbisr')
  ],
  biblio: [
    P('Namakan artikel sebagai ulasan atau analisis bibliometrik dalam tajuk, dan nyatakan isu atau topik yang dikaji serta tempoh yang diliputi (BIBLIO, butiran 1 dan 2). BIBLIO ialah garis panduan awal daripada bidang bioperubatan; di luar bidang itu ia amalan baik, bukan kewajipan.', 'biblio')
  ],
  naratif: [
    P('Tiada garis panduan pelaporan yang menetapkan tajuk ulasan naratif atau ulasan kritikal. Sebagai amalan baik, nyatakan topik atau soalan dan jenis sintesis, selaras dengan piawaian APA bagi artikel sintesis.', 'jarsquant')
  ],
  kuan: [
    P('Tajuk mengenal pasti pemboleh ubah utama dan isu teori yang dikaji, hubungan antaranya, dan populasi yang dikaji (piawaian APA bagi kajian kuantitatif, Jadual 1).', 'jarsquant'),
    P('Bagi kajian pemodelan persamaan struktur, sebut mekanisme atau proses asas dalam model utama (contohnya peranan pengantara), bukan setiap pemboleh ubah (piawaian APA, Jadual 7).', 'jarsquant'),
    P('Istilah reka bentuk seperti "tinjauan" atau "keratan rentas" memadai jika muncul dalam tajuk atau abstrak (STROBE, butiran 1a; CROSS, butiran 1a).', 'strobe', 'cross'),
    P('Padankan kata penghubung dengan reka bentuk: "kesan", "impak" dan "pengaruh" membawa makna sebab-akibat, sedangkan kajian keratan rentas menunjukkan hubungan. Dalam satu audit jurnal obesiti dan pemakanan, kira-kira satu pertiga artikel pemerhatian menggunakan bahasa sebab-akibat dalam tajuk atau abstrak, dan sesetengah jurnal perubatan mengehadkan bahasa sebegini kepada percubaan rawak.', 'cofield', 'dahabreh')
  ],
  kual: [
    P('Tajuk mengenal pasti isu atau topik utama yang dikaji dan memberi gambaran ringkas tentang sifat kajian (piawaian APA bagi kajian kualitatif; SRQR, butiran S1).', 'jarsqual', 'srqr'),
    P('Disyorkan: kenal pasti kajian sebagai kualitatif, atau namakan pendekatan (contohnya kajian kes, fenomenologi, teori beralas) atau kaedah pengumpulan data (temu bual, kumpulan fokus).', 'srqr')
  ],
  campur: [
    P('Tajuk memenuhi piawaian tajuk kajian kuantitatif dan kajian kualitatif sekali gus, dan merujuk kaedah campuran yang digunakan (piawaian APA bagi kaedah campuran).', 'jarsqual'),
    P('Elak perkataan yang menandakan kajian kualitatif sahaja (contohnya meneroka, memahami) atau kuantitatif sahaja (contohnya penentu, korelat).', 'jarsqual')
  ],
  instr: [
    P('Kenal pasti artikel sebagai kajian sifat pengukuran, dan namakan instrumen, konstruk yang diukur serta populasi (COSMIN, butiran T1). COSMIN ditulis untuk instrumen kesihatan; bagi skala pendidikan dan pengurusan ia amalan baik.', 'cosmin'),
    P('Seperti kajian kuantitatif lain, tajuk menamakan konstruk utama dan populasi.', 'jarsquant')
  ],
  dbr: [
    P('Tiada garis panduan pelaporan yang menetapkan tajuk kajian reka bentuk dan pembangunan; peraturan am terpakai. Jika kajian mempunyai fasa konsensus pakar, kenal pasti prosedur Delphi dalam tajuk (DELPHISTAR, butiran 1; ACCORD, butiran T1).', 'delphistar', 'accord')
  ],
  konsep: [
    P('Tiada garis panduan pelaporan yang menetapkan tajuk kertas konsep, teori atau kerangka; peraturan am terpakai: topik yang jelas, istilah utama dan fokus. Namakan sumbangan artikel (kerangka, model, proposisi) supaya pembaca tahu ia bukan kajian empirikal.', 'apastyle')
  ],
  umum: [
    P('Tiada garis panduan pelaporan khusus bagi tajuk jenis artikel ini; peraturan am terpakai: topik yang jelas, istilah utama dan fokus.', 'apastyle')
  ],
  ms: [
    P('Huruf besar pada awal setiap perkataan kecuali kata sendi nama, kata hubung dan kata pemeri (contohnya yang, dan, dengan, di, dalam, antara, tentang, melalui, bagi, terhadap, untuk, daripada, kepada), dan huruf besar selepas titik bertindih; bagi kata ganda, hanya unsur pertama berhuruf besar.', 'dbphuruf'),
    P('Guna "dalam kalangan" (bukan "di kalangan"), "terhadap" selepas kesan atau pengaruh (bukan "ke atas"), "antara ... dengan ..." bagi hubungan dua perkara ("dan" hanya apabila lebih daripada dua perkara disenaraikan) dan "pemboleh ubah" sebagai dua perkataan. Padanan Melayu bagi mediator menurut Dewan Bahasa dan Pustaka ialah "pengantara"; "perantara" juga digunakan dalam jurnal, maka pilih satu dan gunakan secara tekal dalam seluruh manuskrip.', 'dbpfrasa'),
    P('Tajuk ditulis sepenuhnya dalam Bahasa Melayu baku dan lazimnya dibina pada kata nama (Pengaruh, Hubungan, Kesan, Peranan); nama ditulis penuh, dengan singkatan dalam kurungan jika perlu.', 'dbphuruf'),
    P('Artikel Bahasa Melayu dalam jurnal Malaysia perlu disertai tajuk Bahasa Inggeris.', 'mcc', 'jpm')
  ],
  en: [
    P('Gaya tajuk APA: huruf besar pada perkataan pertama, perkataan pertama selepas titik bertindih, semua perkataan utama dan setiap perkataan empat huruf atau lebih; huruf kecil hanya bagi kata hubung, artikel dan kata sendi yang tiga huruf atau kurang (contohnya and, as, but, for, or, a, an, the, at, by, in, of, on, to, via).', 'apacase'),
    P('Letakkan satu atau dua kata kunci utama dalam 65 aksara pertama tajuk supaya ia kelihatan dalam hasil carian.', 'tnf')
  ],
  jurnal: [
    P('Had jurnal Malaysia yang disemak pada November 2026: Jurnal Pendidikan Malaysia meminta tajuk sebaik-baiknya tidak melebihi 15 patah perkataan dan tajuk dalam dua bahasa; Akademika tidak melebihi 15 patah perkataan dan tajuk dalam dua bahasa; Management Research Journal tidak menetapkan had tetapi meminta singkatan, akronim dan ungkapan matematik dielakkan. Halaman panduan pengarang berubah dari semasa ke semasa; semak semula pada hari tajuk dimuktamadkan.', 'jpm', 'akademika', 'mrj')
  ],
  jenis: {
    'ul-payung': { ganti: true, senarai: [
      P('Namakan jenis ulasan dalam tajuk: "overview of reviews" mengikut PRIOR (butiran 1) atau "umbrella review" mengikut Manual JBI. Ikut garis panduan yang dinamakan oleh jurnal sasaran.', 'prior', 'jbipayung'),
      P('Manual JBI meminta frasa "umbrella review" dalam tajuk bersama unsur soalan ulasan (populasi, intervensi atau fenomena, konteks), tajuk yang bukan soalan dan bukan kesimpulan, dan menyebut kelaziman bahawa tajuk tidak melebihi 12 hingga 14 patah perkataan.', 'jbipayung')] },
    'ul-realis': { ganti: true, senarai: [P('Namakan artikel dalam tajuk sebagai sintesis realis atau ulasan realis (RAMESES, butiran 1).', 'rameses')] },
    'ul-metasintesis': { ganti: true, senarai: [P('Tajuk mengenal pasti isu atau topik utama dan menandakan bahawa artikel ini suatu bentuk sintesis kualitatif, contohnya sintesis meta kualitatif atau meta-etnografi (piawaian APA bagi meta-analisis kualitatif).', 'jarsqual')] },
    'ul-bersepadu': { ganti: true, senarai: [P('Tiada garis panduan pelaporan yang menetapkan tajuk ulasan bersepadu. Sebagai amalan baik, nyatakan topik atau soalan dan namakan jenis ulasan, selaras dengan piawaian APA bagi artikel sintesis.', 'jarsquant')] },
    'ul-pantas': { ganti: true, senarai: [P('Belum ada garis panduan pelaporan muktamad bagi ulasan pantas; panduan sementara menyarankan PRISMA 2020 sebagai asas. Menamakan artikel sebagai ulasan pantas ialah amalan baik, bukan butiran rasmi.', 'stevens', 'prisma2020')] },
    'ul-pemetaan': { ganti: true, senarai: [P('Tiada garis panduan pelaporan khusus ditemui bagi tajuk pemetaan sistematik dalam pendidikan. Sebagai amalan baik, namakan jenis kajian dan bina tajuk daripada konsep dan konteks.')] },
    'emp-eksperimen': { ganti: false, senarai: [P('Percubaan rawak: kenal pasti kajian sebagai percubaan rawak (CONSORT 2025, butiran 1a), lazimnya dengan perkataan "rawak" dalam tajuk. Kajian intervensi tanpa perawakan: nyatakan cara unit diagihkan dan populasi sasaran dalam tajuk atau abstrak (TREND, butiran 1).', 'consort', 'trend')] },
    'met-replikasi': { ganti: false, senarai: [P('Bagi kajian replikasi, beri maklumat yang cukup dalam tajuk dan teks supaya pembaca tahu ia replikasi dan jenisnya (piawaian APA, Jadual 6).', 'jarsquant')] },
    'emp-kes': { ganti: false, senarai: [P('Tiada peraturan rasmi bagi tajuk kajian kes sains sosial; menamakan "kajian kes" sebagai pendekatan selaras dengan syor SRQR.', 'srqr')] },
    'met-protokol': { ganti: false, senarai: [P('Protokol ulasan: kenal pasti artikel sebagai protokol ulasan sistematik dalam tajuk (PRISMA-P, butiran 1a).', 'prismap')] }
  }
};
export function peraturanJenis(jenis) {
  const khas = PERATURAN.jenis[jenis]; const kel = PERATURAN[keluargaTajuk(jenis)] || PERATURAN.umum;
  return { khas: khas ? (khas.ganti ? khas.senarai : kel.concat(khas.senarai)) : kel, am: PERATURAN.am };
}
export const peraturanBahasa = bahasa => (bahasa === 'en' ? PERATURAN.en : PERATURAN.ms);

/* ---- semakan tajuk tanpa agen ----
   o: { jenis, bahasa ('ms' atau 'en'), larang (rentetan dipisah koma), medan (jawapan soalan pandu), pv ([{nama, alias}]) }
   Pulangan: [{ k, status ('ok', 'amaran', 'gagal', 'info'), teks }]. Status info tidak dikira dalam skor. */
const BM_TANDA = /\b(?:dan|dalam|terhadap|kalangan|yang|bagi|untuk|dengan|antara|daripada|kepada|sebagai|tentang|melalui)\b/i;
const EN_TANDA = /\b(?:the|of|and|among|between|towards?|through|with|for|from|on|in|as|an?)\b/i;
export function bahasaTajuk(tajuk, lalai) { const t = String(tajuk || ''); const bm = (t.match(new RegExp(BM_TANDA.source, 'gi')) || []).length, en = (t.match(new RegExp(EN_TANDA.source, 'gi')) || []).length; if (bm === en) return lalai || 'ms'; return bm > en ? 'ms' : 'en'; }
const HENTI = new Set(['yang', 'dan', 'atau', 'dalam', 'dengan', 'untuk', 'bagi', 'pada', 'kepada', 'daripada', 'terhadap', 'antara', 'oleh', 'sebagai', 'tentang', 'jika', 'ada', 'contoh', 'the', 'and', 'for', 'with', 'from', 'that', 'this', 'among', 'between', 'into', 'their', 'sekolah', 'kajian']);
const token = s => rata(s).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !HENTI.has(w));
function memuat(tajukRata, frasa) { const tk = token(frasa); if (!tk.length) return null; const ada = tk.filter(w => tajukRata.includes(w.length > 6 ? w.slice(0, w.length - 2) : w)).length; return ada / tk.length; }
export function semakTajuk(tajuk, o) {
  o = o || {}; const t = String(tajuk || '').replace(/\s+/g, ' ').trim(); const out = [];
  if (!t || /^artikel tanpa tajuk$/i.test(t)) return [{ k: 'kosong', status: 'gagal', teks: 'Tajuk belum diisi.' }];
  const bhs = bahasaTajuk(t, o.bahasa); const n = patah(t); const P = PANJANG; const tr = rata(t);
  /* panjang */
  if (n < 4) out.push({ k: 'panjang', status: 'gagal', teks: `${n} patah perkataan: terlalu ringkas untuk menamakan topik, populasi dan jenis kajian.` });
  else if (n < P.min) out.push({ k: 'panjang', status: 'amaran', teks: `${n} patah perkataan: ringkas. Tajuk di bawah ${P.min} patah perkataan lazimnya kurang maklumat bagi artikel empirikal; pastikan topik, konteks dan jenis kajian masih jelas.` });
  else if (n <= P.lazim) out.push({ k: 'panjang', status: 'ok', teks: `${n} patah perkataan (sasaran ${P.sasar[0]} hingga ${P.sasar[1]}; sehingga ${P.lazim} masih biasa dalam jurnal pendidikan).` });
  else if (n <= P.had) out.push({ k: 'panjang', status: 'amaran', teks: `${n} patah perkataan: agak panjang (sasaran ${P.sasar[0]} hingga ${P.sasar[1]}). Buang kata yang tidak menambah makna dan semak had jurnal sasaran.` });
  else out.push({ k: 'panjang', status: 'gagal', teks: `${n} patah perkataan: terlalu panjang (melebihi ${P.had}). Pindahkan butiran kaedah atau lokasi ke abstrak.` });
  if (n > 15 && n <= P.lazim) out.push({ k: 'had15', status: 'info', teks: 'Beberapa jurnal Malaysia, contohnya Jurnal Pendidikan Malaysia dan Akademika, meminta tajuk tidak melebihi 15 patah perkataan; semak had jurnal sasaran.' });
  /* penanda jenis kajian */
  const pn = PENANDA[o.jenis];
  if (pn) {
    const ada = pn.re.test(t); const frasa = bhs === 'en' ? pn.en : pn.ms;
    if (ada) out.push({ k: 'jenis', status: 'ok', teks: 'Jenis kajian dinamakan dalam tajuk.' });
    else if (pn.aras === 'wajib') out.push({ k: 'jenis', status: 'gagal', teks: `Tajuk belum menamakan jenis artikel ("${frasa}"). Garis panduan pelaporan bagi jenis ini meminta jenis ulasan dinyatakan dalam tajuk.` });
    else if (pn.aras === 'syor') out.push({ k: 'jenis', status: 'amaran', teks: `Tajuk belum menamakan jenis kajian ("${frasa}"). Menyatakannya membantu pembaca dan enjin carian mengenal reka bentuk artikel.` });
    else out.push({ k: 'jenis', status: 'info', teks: `Jenis kajian ("${frasa}") tidak dinyatakan; ini pilihan penulis bagi jenis artikel ini.` });
  }
  /* unsur teras daripada soalan pandu dan pemboleh ubah Pandu Tulis */
  const calon = [];
  (o.pv || []).forEach(v => { if (v && v.nama) calon.push({ nama: v.nama, frasa: [v.nama].concat(String(v.alias || '').split(',').map(x => x.trim()).filter(Boolean)) }); });
  if (!calon.length && o.medan) medanJenis(o.jenis).filter(m => m.teras && m.peranan === 'pv').forEach(m => { const v = String(o.medan[m.k] || '').trim(); if (v) calon.push({ nama: v, frasa: [v] }); });
  if (calon.length) {
    const tiada = calon.filter(c => !c.frasa.some(f => { const s = memuat(tr, f); return s !== null && s >= 0.6; })).map(c => c.nama);
    if (!tiada.length) out.push({ k: 'unsur', status: 'ok', teks: `Semua pemboleh ubah atau konsep utama (${calon.length}) disebut dalam tajuk.` });
    else if (tiada.length === calon.length && bhs === 'en' && calon.every(c => bahasaTajuk(c.nama, 'ms') === 'ms')) out.push({ k: 'unsur', status: 'info', teks: 'Pemboleh ubah ditetapkan dalam Bahasa Melayu manakala tajuk dalam Bahasa Inggeris; padanan tidak dapat disemak secara automatik.' });
    else out.push({ k: 'unsur', status: 'amaran', teks: `Belum disebut dalam tajuk: ${tiada.join('; ')}.` });
  }
  /* singkatan */
  const huruf = t.replace(/[^A-Za-z]/g, ''); const besar = huruf.replace(/[^A-Z]/g, '').length;
  if (huruf.length && besar / huruf.length < 0.7) {
    const sing = Array.from(new Set(t.split(/[\s/():,;?-]+/).map(w => w.replace(/[^A-Za-z0-9]/g, '')).filter(w => /^[A-Z]{2,}[a-z]?$/.test(w) || /^[A-Z]+\d+[A-Z\d]*$/.test(w))));
    if (sing.length) out.push({ k: 'singkatan', status: 'amaran', teks: `Singkatan dalam tajuk: ${sing.join(', ')}. Eja penuh kecuali singkatan itu lebih dikenali pembaca daripada bentuk penuhnya.` });
    else out.push({ k: 'singkatan', status: 'ok', teks: 'Tiada singkatan.' });
  } else out.push({ k: 'singkatan', status: 'info', teks: 'Tajuk ditulis dengan huruf besar sepenuhnya; semakan singkatan dilangkau.' });
  /* kata pengisi di hadapan */
  const isi = /^(?:satu|suatu|sebuah)\s+(?:kajian|tinjauan|penyelidikan|analisis|penelitian)\s+(?:tentang|mengenai|terhadap|ke atas|berkenaan)\b|^(?:kajian|penyelidikan|penelitian)\s+(?:tentang|mengenai|berkenaan)\b|^(?:an?|the)\s+(?:study|investigation|examination|exploration|analysis|research)\s+(?:of|on|into)\b|^(?:an?\s+)?(?:empirical|experimental)\s+(?:study|investigation)\s+(?:of|on|into)\b|^(?:observations|notes|some\s+thoughts)\s+on\b/i;
  if (isi.test(t)) out.push({ k: 'pengisi', status: 'amaran', teks: 'Tajuk bermula dengan kata pengisi (contohnya "Satu kajian tentang" atau "A study of"). Mulakan terus dengan topik.' });
  else out.push({ k: 'pengisi', status: 'ok', teks: 'Tajuk bermula terus dengan topik.' });
  /* gaya dan tanda baca */
  const g = [];
  if (/[\u2014\u2013\u2015]/.test(t)) g.push('tanda sempang panjang (ganti dengan titik bertindih atau koma)');
  const larang = String(o.larang || '').split(',').map(x => x.trim()).filter(Boolean).filter(x => new RegExp('(^|[^a-z])' + rata(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(tr));
  if (larang.length) g.push('istilah yang dilarang dalam peraturan gaya: ' + larang.join(', '));
  if (/[.]$/.test(t)) g.push('noktah di hujung tajuk');
  if ((t.match(/:/g) || []).length > 1) g.push('lebih daripada satu titik bertindih');
  if (/&/.test(t)) g.push('simbol & (tulis "dan" atau "and")');
  const kosongSifat = t.match(/\b(?:novel|innovative|comprehensive|robust|improved|inovatif|komprehensif)\b/i); if (kosongSifat) g.push('kata sifat yang tidak menambah maklumat ("' + kosongSifat[0] + '")');
  if (bhs === 'ms') {
    if (/\bdi kalangan\b/i.test(t)) g.push('"di kalangan" (bentuk baku: "dalam kalangan")');
    if (/\b(?:kesan|pengaruh|impak|sumbangan)\b[^:?]*\bke atas\b/i.test(t)) g.push('"ke atas" selepas kesan atau pengaruh (Dewan Bahasa dan Pustaka lazimnya menyarankan "terhadap")');
    if (/\bpembolehubah\b/i.test(t)) g.push('"pembolehubah" (eja "pemboleh ubah")');
    const ant = t.match(/\b(?:hubungan|perkaitan|perbandingan|perbezaan)\s+(?:di\s+)?antara\b([^:?]*)/i);
    if (ant && /\bdan\b/i.test(ant[1]) && !/\bdengan\b/i.test(ant[1]) && !/,/.test(ant[1])) g.push('"antara ... dan" bagi dua perkara (bentuk baku: "antara ... dengan"; "dan" hanya apabila lebih daripada dua perkara disenaraikan)');
    if (/\banalisa\b/i.test(t)) g.push('"analisa" (bentuk baku: "analisis")');
    const kata = t.split(/\s+/); const besarAwal = kata.filter(w => /^[A-Z\u00C0-\u00DE]/.test(w)).length;
    if (kata.length >= 4 && besarAwal / kata.length >= 0.6) { const tugas = []; kata.forEach((w, i) => { if (i > 0 && !/[:?]$/.test(kata[i - 1]) && /^(?:Dan|Yang|Dengan|Di|Dalam|Antara|Tentang|Melalui|Bagi|Terhadap|Untuk|Daripada|Kepada|Ke|Dari|Pada|Atau|Serta|Seperti)$/.test(w.replace(/[^A-Za-z]/g, '')) && !tugas.includes(w)) tugas.push(w.replace(/[^A-Za-z]/g, '')); }); if (tugas.length) g.push('huruf besar pada kata tugas (' + tugas.join(', ') + '); dalam tajuk Bahasa Melayu, kata sendi nama dan kata hubung ditulis dengan huruf kecil'); }
    if (/\b(?:scoping|systematic|review|study|among|between|towards?|effects?|impacts?)\b/i.test(t)) g.push('perkataan Inggeris dalam tajuk Bahasa Melayu');
  }
  out.push(g.length ? { k: 'gaya', status: 'amaran', teks: 'Gaya dan tanda baca: ' + g.join('; ') + '.' } : { k: 'gaya', status: 'ok', teks: 'Gaya dan tanda baca kemas.' });
  if (/\?/.test(t)) out.push(TANPA_SOALAN.has(o.jenis) ? { k: 'soalan', status: 'amaran', teks: 'Tajuk berbentuk soalan. Manual JBI meminta tajuk ulasan tidak ditulis sebagai soalan; nyatakan topik dan jenis ulasan.' } : { k: 'soalan', status: 'info', teks: 'Tajuk berbentuk soalan: bukti tentang kesannya bercampur. Pastikan huraian selepasnya menamakan topik dan jenis kajian.' });
  if (o.jenis === 'ul-meta' && PENANDA['ul-meta'].re.test(t) && !PENANDA['ul-sistematik'].re.test(t)) out.push({ k: 'sistematik', status: 'info', teks: 'Jika meta-analisis ini berasaskan ulasan sistematik, PRISMA 2020 meminta artikel dikenal pasti sebagai ulasan sistematik juga, contohnya "ulasan sistematik dan meta-analisis".' });
  if ((o.jenis === 'emp-kuantitatif' || /keratan\s+rentas|cross[\s-]?sectional/i.test(String((o.medan || {}).reka || ''))) && keluargaTajuk(o.jenis) === 'kuan') { const ks = t.match(/\b(?:kesan|impak|pengaruh|penentu|effects?|impacts?|influences?|determinants?)\b/i); if (ks) out.push({ k: 'kausal', status: 'info', teks: `Kata "${ks[0]}" membawa makna sebab-akibat. Bagi kajian keratan rentas, pastikan kekuatan dakwaan dalam tajuk tidak melebihi reka bentuk; "hubungan" atau "peranan" lebih berhati-hati.` }); }
  if (o.jenis === 'emp-campuran') { const kw = t.match(/\b(?:meneroka|penerokaan|memahami|exploring|explore|understanding|understand|penentu|korelat|determinants?|correlates)\b/i); if (kw) out.push({ k: 'campuran', status: 'amaran', teks: `Perkataan "${kw[0]}" menandakan kajian kualitatif sahaja atau kuantitatif sahaja; piawaian APA bagi kaedah campuran menyarankan perkataan sebegini dielakkan dalam tajuk.` }); }
  return out;
}
export function skorSemak(senarai) { const kira = senarai.filter(x => x.status !== 'info'); const ok = kira.filter(x => x.status === 'ok').length; return { ok, jumlah: kira.length, peratus: kira.length ? Math.round(100 * ok / kira.length) : 0, teruk: kira.some(x => x.status === 'gagal') ? 'gagal' : kira.some(x => x.status === 'amaran') ? 'amaran' : 'ok' }; }
