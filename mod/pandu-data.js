/* Pandu Tulis: pangkalan pengetahuan folder. Setiap jenis artikel dipetakan kepada satu keluarga (empirikal kuantitatif, kualitatif,
   ulasan berprotokol, konseptual dan lain-lain); setiap keluarga mempunyai senarai folder mengikut susunan manuskrip, dan setiap folder
   mempunyai peranan (pendahuluan, literatur, kaedah, dapatan, perbincangan, kesimpulan, abstrak, rujukan atau badan). Bagi setiap peranan:
   tujuan, gerakan retorik yang lazim dalam jurnal berindeks (dengan pola isyarat dwibahasa untuk pengesanan automatik), soalan panduan
   kepada penulis, kriteria semakan agen, bahagian patah perkataan dan jangkaan sitasi. Fail ini data sahaja; tiada akses DOM. */

/* ---- jenis artikel kepada keluarga ---- */
export const KELUARGA = {
  'emp-kuantitatif': 'kuan', 'emp-eksperimen': 'kuan', 'emp-longitudinal': 'kuan', 'emp-sekunder': 'kuan', 'emp-dbr': 'kuan', 'lain-tesis': 'kuan', 'met-replikasi': 'kuan',
  'emp-campuran': 'campur', 'emp-kualitatif': 'kual', 'emp-kes': 'kual', 'emp-tindakan': 'kual',
  'emp-instrumen': 'instr', 'met-psikometrik': 'instr',
  'ul-skop': 'skop', 'ul-pemetaan': 'skop', 'ul-sistematik': 'slr', 'ul-pantas': 'slr', 'ul-payung': 'slr', 'ul-bersepadu': 'slr', 'ul-metasintesis': 'slr', 'ul-realis': 'slr', 'ul-meta': 'meta',
  'ul-bibliometrik': 'biblio', 'ul-naratif': 'naratif', 'ul-kritikal': 'naratif',
  'kon-konseptual': 'konsep', 'kon-teori': 'konsep', 'kon-kerangka': 'konsep'
};
export const NAMA_KELUARGA = { kuan: 'empirikal kuantitatif', campur: 'kaedah campuran', kual: 'empirikal kualitatif', instr: 'pembangunan instrumen', skop: 'ulasan skop (PRISMA-ScR)', slr: 'ulasan sistematik (PRISMA 2020)', meta: 'meta-analisis (PRISMA 2020)', biblio: 'analisis bibliometrik', naratif: 'ulasan naratif', konsep: 'konseptual', umum: 'struktur lazim jenis ini' };
const KUMPULAN = { kuan: 'emp', campur: 'emp', instr: 'emp', kual: 'kual', skop: 'ulasan', slr: 'ulasan', meta: 'ulasan', biblio: 'ulasan', konsep: 'konsep', naratif: 'naratif' };
export const keluargaDari = jenis => KELUARGA[jenis] || 'umum';
export const kumpulanDari = kel => KUMPULAN[kel] || 'umum';
export const ADA_PRISMA = new Set(['skop', 'slr', 'meta']);
export const ADA_OUTPUT = new Set(['kuan', 'campur', 'instr', 'kual']);

/* ---- folder setiap keluarga, mengikut susunan manuskrip: kunci, peranan, tajuk [BM, EN], subseksyen [[BM, EN]] ---- */
const F = (k, p, t, sub) => ({ k, p, t, sub: sub || [] });
const ABS = F('abstrak', 'abstrak', ['Abstrak', 'Abstract']);
const PEN = F('pendahuluan', 'pendahuluan', ['Pendahuluan', 'Introduction']);
const KES = F('kesimpulan', 'kesimpulan', ['Kesimpulan', 'Conclusion']);
const RUJ = F('rujukan', 'rujukan', ['Rujukan', 'References']);
const BIN = F('perbincangan', 'perbincangan', ['Perbincangan', 'Discussion'], [['Implikasi Teori', 'Theoretical Implications'], ['Implikasi Amalan dan Dasar', 'Practical and Policy Implications'], ['Batasan dan Cadangan Kajian Lanjutan', 'Limitations and Future Research']]);
const BIN_UL = F('perbincangan', 'perbincangan', ['Perbincangan', 'Discussion'], [['Rumusan Bukti', 'Summary of Evidence'], ['Implikasi', 'Implications'], ['Batasan', 'Limitations']]);
const FOLDER = {
  kuan: [ABS, PEN,
    F('literatur', 'literatur', ['Kajian Literatur', 'Literature Review'], [['Kerangka Teori', 'Theoretical Framework'], ['Pembangunan Hipotesis', 'Hypothesis Development']]),
    F('kaedah', 'kaedah', ['Metodologi', 'Methodology'], [['Reka Bentuk Kajian', 'Research Design'], ['Populasi, Sampel dan Persampelan', 'Population, Sample and Sampling'], ['Instrumen Kajian', 'Instruments'], ['Prosedur Pengumpulan Data', 'Data Collection Procedure'], ['Analisis Data', 'Data Analysis']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Profil Responden', 'Respondent Profile'], ['Model Pengukuran', 'Measurement Model'], ['Model Berstruktur dan Ujian Hipotesis', 'Structural Model and Hypothesis Testing']]),
    BIN, KES, RUJ],
  campur: [ABS, PEN,
    F('literatur', 'literatur', ['Kajian Literatur', 'Literature Review'], [['Kerangka Teori', 'Theoretical Framework']]),
    F('kaedah', 'kaedah', ['Metodologi', 'Methodology'], [['Reka Bentuk Kaedah Campuran', 'Mixed Methods Design'], ['Fasa Kuantitatif', 'Quantitative Phase'], ['Fasa Kualitatif', 'Qualitative Phase'], ['Integrasi Data', 'Data Integration']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Dapatan Kuantitatif', 'Quantitative Results'], ['Dapatan Kualitatif', 'Qualitative Findings'], ['Integrasi Dapatan', 'Integrated Findings']]),
    BIN, KES, RUJ],
  kual: [ABS, PEN,
    F('literatur', 'literatur', ['Kajian Literatur', 'Literature Review']),
    F('kaedah', 'kaedah', ['Metodologi', 'Methodology'], [['Reka Bentuk dan Pendekatan', 'Design and Approach'], ['Peserta dan Latar Kajian', 'Participants and Setting'], ['Pengumpulan Data', 'Data Collection'], ['Analisis Data', 'Data Analysis'], ['Kebolehpercayaan Kajian', 'Trustworthiness']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Findings']),
    BIN, KES, RUJ],
  instr: [ABS, PEN,
    F('literatur', 'literatur', ['Kajian Literatur dan Kerangka Konstruk', 'Literature Review and Construct Framework']),
    F('kaedah', 'kaedah', ['Metodologi', 'Methodology'], [['Penjanaan Item dan Kesahan Kandungan', 'Item Generation and Content Validity'], ['Sampel dan Prosedur', 'Sample and Procedure'], ['Analisis Data', 'Data Analysis']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Analisis Faktor Penerokaan', 'Exploratory Factor Analysis'], ['Analisis Faktor Pengesahan', 'Confirmatory Factor Analysis'], ['Kebolehpercayaan dan Kesahan', 'Reliability and Validity']]),
    BIN, KES, RUJ],
  skop: [ABS, PEN,
    F('kaedah', 'kaedah', ['Metodologi', 'Methods'], [['Protokol dan Kerangka Ulasan', 'Protocol and Review Framework'], ['Kriteria Kelayakan', 'Eligibility Criteria'], ['Sumber Maklumat dan Strategi Carian', 'Information Sources and Search Strategy'], ['Pemilihan Sumber Bukti', 'Selection of Sources of Evidence'], ['Pencartaan Data', 'Data Charting'], ['Sintesis Dapatan', 'Synthesis of Results']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Pemilihan Sumber Bukti', 'Selection of Sources of Evidence'], ['Ciri Sumber Bukti', 'Characteristics of Sources of Evidence'], ['Dapatan Mengikut Soalan Ulasan', 'Results by Review Question']]),
    BIN_UL, KES, RUJ],
  slr: [ABS, PEN,
    F('kaedah', 'kaedah', ['Metodologi', 'Methods'], [['Protokol dan Pendaftaran', 'Protocol and Registration'], ['Kriteria Kelayakan', 'Eligibility Criteria'], ['Sumber Maklumat dan Strategi Carian', 'Information Sources and Search Strategy'], ['Pemilihan Kajian', 'Study Selection'], ['Pengekstrakan Data', 'Data Extraction'], ['Penilaian Kualiti', 'Quality Appraisal'], ['Sintesis Dapatan', 'Synthesis of Results']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Pemilihan Kajian', 'Study Selection'], ['Ciri Kajian', 'Study Characteristics'], ['Kualiti Kajian', 'Quality of Studies'], ['Sintesis Dapatan', 'Synthesis of Results']]),
    BIN_UL, KES, RUJ],
  meta: [ABS, PEN,
    F('kaedah', 'kaedah', ['Metodologi', 'Methods'], [['Kriteria Kelayakan', 'Eligibility Criteria'], ['Strategi Carian', 'Search Strategy'], ['Pengekstrakan Data', 'Data Extraction'], ['Penilaian Risiko Bias', 'Risk of Bias Assessment'], ['Analisis Statistik', 'Statistical Analysis']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Pemilihan Kajian', 'Study Selection'], ['Kesan Keseluruhan', 'Overall Effect'], ['Heterogeniti dan Analisis Subkumpulan', 'Heterogeneity and Subgroup Analysis'], ['Bias Penerbitan', 'Publication Bias']]),
    BIN_UL, KES, RUJ],
  biblio: [ABS, PEN,
    F('kaedah', 'kaedah', ['Metodologi', 'Methods'], [['Sumber Data dan Strategi Carian', 'Data Source and Search Strategy'], ['Analisis Prestasi dan Pemetaan Sains', 'Performance Analysis and Science Mapping']]),
    F('dapatan', 'dapatan', ['Dapatan', 'Results'], [['Taburan Penerbitan dan Petikan', 'Publication and Citation Trends'], ['Pengarang, Institusi dan Negara', 'Authors, Institutions and Countries'], ['Analisis Kata Kunci dan Tema', 'Keyword and Thematic Analysis']]),
    BIN_UL, KES, RUJ],
  naratif: [ABS, PEN, F('badan1', 'badan', ['Tema 1', 'Theme 1']), F('badan2', 'badan', ['Tema 2', 'Theme 2']), F('badan3', 'badan', ['Tema 3', 'Theme 3']), F('perbincangan', 'perbincangan', ['Perbincangan', 'Discussion']), KES, RUJ],
  konsep: [ABS, PEN, F('literatur', 'literatur', ['Latar Konsep dan Asas Teori', 'Conceptual Background and Theoretical Foundation']), F('kerangka', 'kerangka', ['Cadangan Kerangka dan Proposisi', 'Proposed Framework and Propositions']), F('perbincangan', 'perbincangan', ['Implikasi', 'Implications']), KES, RUJ]
};

/* ---- pengecaman peranan daripada tajuk seksyen sedia ada (BM dan Inggeris) ---- */
export const KENAL = [
  ['abstrak', /^(abstrak|abstract|ringkasan eksekutif|ringkasan)\b/i],
  ['pendahuluan', /^(pendahuluan|pengenalan|introduction)\b/i],
  ['literatur', /^((sorotan|kajian|tinjauan|ulasan)\s+(literatur|kajian lepas|kepustakaan)|literature review|kerangka teori|theoretical (background|framework)|latar( belakang)? (konsep|teori)|asas teori)/i],
  ['kaedah', /^(metodologi|kaedah|methods?\b|methodology|bahan dan kaedah|materials and methods)/i],
  ['dapatan', /^(dapatan|keputusan|hasil\b|results?\b|findings)/i],
  ['perbincangan', /^(perbincangan|discussion|implikasi|implications)\b/i],
  ['kesimpulan', /^(kesimpulan|rumusan|conclusions?|penutup)\b/i],
  ['rujukan', /^(rujukan|references|bibliografi)\b/i]
];
export function perananTajuk(tajuk) { const t = String(tajuk || '').replace(/^\s*[\d.]+\s*/, '').trim(); for (const [p, re] of KENAL) if (re.test(t)) return p; return null; }

/* Senarai folder bagi satu jenis artikel. Keluarga tanpa senarai khusus diterbitkan daripada struktur lazim jenis itu (STRUKTUR dalam
   modul Artikel): tajuk aras 1 menjadi folder dengan peranan yang dikenali daripada tajuknya, atau "badan" jika tidak dikenali. */
export function folderJenis(jenis, struktur) {
  const kel = keluargaDari(jenis); if (FOLDER[kel]) return FOLDER[kel].map(x => Object.assign({}, x));
  const out = []; let semasa = null; const guna = {};
  (struktur || []).forEach(([aras, tajuk]) => {
    if (aras === 1) { let p = perananTajuk(tajuk) || 'badan'; if (p !== 'badan' && guna[p]) p = 'badan'; guna[p] = (guna[p] || 0) + 1; semasa = F(p === 'badan' ? 'badan' + guna[p] : p, p, [tajuk, tajuk]); out.push(semasa); }
    else if (semasa) semasa.sub.push([tajuk, tajuk]);
  });
  if (!out.length) return [ABS, PEN, F('badan1', 'badan', ['Isi', 'Body']), KES, RUJ].map(x => Object.assign({}, x));
  return out;
}
/* Urutan menulis: folder isi mengikut susunan manuskrip, Abstrak paling akhir, kemudian Rujukan (senarai dijana daripada sitasi). */
export function urutanTulis(folders) { const isi = folders.filter(f => f.p !== 'abstrak' && f.p !== 'rujukan'); return isi.concat(folders.filter(f => f.p === 'abstrak'), folders.filter(f => f.p === 'rujukan')); }

/* ---- bahagian patah perkataan (peratus daripada sasaran jumlah) ---- */
const BAHAGI = {
  emp: { pendahuluan: [10, 14], literatur: [20, 28], kaedah: [12, 18], dapatan: [14, 20], perbincangan: [16, 22], kesimpulan: [3, 6] },
  kual: { pendahuluan: [10, 14], literatur: [16, 24], kaedah: [12, 18], dapatan: [24, 34], perbincangan: [14, 20], kesimpulan: [3, 6] },
  ulasan: { pendahuluan: [12, 16], kaedah: [14, 20], dapatan: [28, 38], perbincangan: [16, 24], kesimpulan: [3, 6] },
  konsep: { pendahuluan: [12, 16], literatur: [28, 38], kerangka: [20, 30], perbincangan: [12, 18], kesimpulan: [3, 6] },
  naratif: { pendahuluan: [10, 15], badan: [18, 24], perbincangan: [12, 18], kesimpulan: [4, 7] },
  umum: { pendahuluan: [12, 18], kesimpulan: [4, 8] }
};
export const ABSTRAK_PATAH = [150, 250];
export function sasaranPatah(kel, folder, folders, jumlah) {
  if (folder.p === 'abstrak') return ABSTRAK_PATAH.slice(); if (folder.p === 'rujukan') return null;
  const g = BAHAGI[kumpulanDari(kel)] || BAHAGI.umum; let b = g[folder.p];
  if (!b) { const isi = folders.filter(f => f.p !== 'abstrak' && f.p !== 'rujukan'); const tetap = isi.filter(f => g[f.p]); const baki = 100 - tetap.reduce((s, f) => s + (g[f.p][0] + g[f.p][1]) / 2, 0); const n = Math.max(1, isi.length - tetap.length); const tengah = Math.max(6, baki / n); b = [tengah * 0.8, tengah * 1.2]; }
  const bulat = v => Math.max(50, Math.round(v / 50) * 50);
  return [bulat(jumlah * b[0] / 100), bulat(jumlah * b[1] / 100)];
}

/* ---- gerakan retorik: [kunci, nama, keterangan, pola isyarat, wajib] ---- */
const G = (k, nama, ket, cue, wajib) => ({ k, nama, ket, cue: cue || null, wajib: wajib !== false });
const C = {
  latar: /(semakin|kian|pesat|transformasi|pendigitalan|dasar|pelan|penting|kritikal|cabaran|increasingly|rapid|transformation|digitali[sz]ation|policy|crucial|critical|challenge)/iu,
  lepas: /(kajian(-kajian)? (lepas|terdahulu|lalu|sedia ada)|penyelidik(an)? terdahulu|literatur (sedia ada|semasa)|sarjana|previous (studies|research)|prior (studies|research)|existing (literature|studies|research)|scholars)/iu,
  jurang: /(jurang|kurang (diberi perhatian|diteroka|dikaji|difahami)|masih (terhad|kurang|belum|kabur)|belum (diteroka|dikaji|jelas|diuji)|namun|walau bagaimanapun|\bhowever\b|\bgaps?\b|remains? (unclear|limited|under-?explored|scarce)|little is known|few studies|scant|lacking|under-?researched)/iu,
  tujuan: /((kajian|artikel|ulasan|kertas) ini (bertujuan|meneliti|mengkaji|memetakan|menguji)|tujuan (kajian|artikel|ulasan)|objektif (kajian|ulasan)|soalan (kajian|ulasan)|this (study|article|paper|review) (aims|seeks|examines|investigates|maps|tests)|the (aim|purpose|objective)s? of this|research questions?|review questions?|\bRQ ?\d|\bSK ?\d)/iu,
  sumbangan: /(sumbangan|menyumbang|kepentingan (kajian|artikel)|memperluas|contribut(es|ion|ions)|significance|adds to|extends)/iu,
  susunan: /((artikel|kertas) ini disusun|bahagian (seterusnya|berikutnya)|seksyen (berikut|seterusnya)|the remainder of|is (organi[sz]ed|structured) as follows)/iu,
  jenisulasan: /(ulasan skop|scoping review|ulasan sistematik|systematic review|meta-?analisis|meta-?analysis|ulasan terdahulu|previous reviews?|earlier reviews?|PRISMA|Arksey|JBI)/iu,
  takrif: /(ditakrifkan|didefinisikan|merujuk kepada|bermaksud|takrif|definisi|is defined as|refers to|defin(ed|ition|itions)|conceptuali[sz]ed as)/iu,
  teori: /(teori|model|kerangka (teori|konseptual)|theor(y|ies|etical)|framework)/iu,
  hipotesis: /(hipotesis|\bH\d\b|dihipotesiskan|hypothes[ie]s|hypothesi[sz]ed|proposisi|propositions?)/iu,
  rumusjurang: /(jurang|justeru|oleh itu|secara keseluruhan|taken together|in sum|therefore|\bgaps?\b)/iu,
  rekabentuk: /(reka bentuk|keratan rentas|tinjauan|kuantitatif|kualitatif|eksperimen|kajian kes|fenomenologi|research design|cross-sectional|survey|quantitative|qualitative|experimental|case study|phenomenolog)/iu,
  sampel: /(populasi|sampel|persampelan|responden|peserta kajian|population|sampl(e|ing)|respondents|participants)/iu,
  instrumen: /(instrumen|soal selidik|\bitem\b|skala|diadaptasi|protokol temu bual|questionnaire|instrument|scale|items|adapted from|interview protocol)/iu,
  kesahan: /(kesahan|kebolehpercayaan|alfa cronbach|cronbach|\bCVI\b|validity|reliability|composite reliability|\bAVE\b|trustworthiness|kredibiliti|credibility)/iu,
  prosedur: /(prosedur|kutipan data|pengumpulan data|kebenaran|etika|persetujuan termaklum|data collection|procedure|ethic|informed consent|approval)/iu,
  analisis: /(analisis|\bSEM\b|AMOS|SmartPLS|SPSS|regresi|\bCFA\b|bootstrap|tematik|analy[sz](is|ed)|structural equation|regression|thematic)/iu,
  integrasi: /(integrasi|penggabungan|triangulasi|integration|merg(e|ing)|joint display|triangulation)/iu,
  kerangkaulasan: /(PRISMA|Arksey|O.?Malley|JBI|Levac|protokol|protocol|didaftarkan|registered|\bOSF\b|PROSPERO)/iu,
  kelayakan: /(kriteria (kelayakan|penerimaan|pengecualian|inklusi|eksklusi)|eligibility|inclusion criteria|exclusion criteria|\bPCC\b|\bPICO\b)/iu,
  pangkalan: /(pangkalan data|Scopus|Web of Science|\bERIC\b|OpenAlex|EBSCO|ProQuest|databases?)/iu,
  rentetan: /("[^"]{2,60}"\s+(AND|OR)\s+|\bAND\b[^.]{1,120}\bOR\b|\bOR\b[^.]{1,120}\bAND\b|TITLE-ABS-KEY|rentetan carian|search string)/u,
  saringan: /(saringan|disaring|penilai|pendua|screen(ed|ing)|reviewers?|duplicates?)/iu,
  carta: /(pencartaan|pengekstrakan data|borang (pencartaan|pengekstrakan)|data charting|data extraction|charting form|extraction form)/iu,
  kualiti: /(penilaian kualiti|risiko bias|\bMMAT\b|\bCASP\b|JBI critical|quality (appraisal|assessment)|risk of bias)/iu,
  sintesiskaedah: /(sintesis|analisis tematik|naratif|ringkasan berangka|synthesi[sz]|thematic|narrative|numerical summary)/iu,
  alatbiblio: /(VOSviewer|Bibliometrix|biblioshiny|CiteSpace|co-?citation|petikan bersama|co-?occurrence|kejadian bersama)/iu,
  penjanaan: /(penjanaan item|kolam item|item pool|item generation|generated items)/iu,
  efa: /(analisis faktor penerokaan|\bEFA\b|\bKMO\b|Bartlett|exploratory factor)/iu,
  cfa: /(analisis faktor pengesahan|\bCFA\b|model pengukuran|confirmatory factor|measurement model)/iu,
  profil: /(profil responden|demografi|kadar respons|respondent profile|demographic|response rate)/iu,
  pengukuran: /(model pengukuran|\bCFA\b|muatan faktor|measurement model|factor loadings?|\bAVE\b|composite reliability)/iu,
  struktur: /(model berstruktur|hipotesis|\bH\d\b|disokong|structural model|hypothes|supported|β|\bbeta\b|pekali laluan|path coefficient)/iu,
  perantara: /(perantara|pengantara|tidak langsung|bootstrap|mediat|indirect effect)/iu,
  peserta: /(peserta|informan|participants?|informants?)/iu,
  tema: /(\btema\b|subtema|themes?|subthemes?)/iu,
  petikan: /("[^"]{20,}"|“[^”]{20,}”|\(P\d+\)|\(Peserta \d+\))/u,
  aliran: /(rekod|dikenal pasti|disaring|dimasukkan|records|identified|screened|included)/iu,
  ciri: /(tahun penerbitan|negara|reka bentuk|taburan|publication year|countr(y|ies)|study design|distribution)/iu,
  ikutsoalan: /(soalan (ulasan|kajian)|\bSK ?\d|\bRQ ?\d|\btema\b|themes?)/iu,
  taburan: /(taburan|trend|pertumbuhan|penerbitan tahunan|annual (publications|growth)|trends?)/iu,
  pengarang: /(pengarang|institusi|negara|authors?|institutions?|countr(y|ies))/iu,
  katakunci: /(kata kunci|kluster|keywords?|clusters?|thematic map)/iu,
  ringkas: /(dapatan (utama|kajian|ulasan) (menunjukkan|mendapati)|(kajian|ulasan) ini (mendapati|menunjukkan)|findings (show|indicate|reveal|suggest)|this (study|review) (found|shows|reveals)|results (show|indicate))/iu,
  banding: /(selari dengan|konsisten dengan|bercanggah dengan|berbeza daripada|menyokong dapatan|sejajar dengan|consistent with|in line with|contrary to|in contrast|corroborat|aligns? with)/iu,
  impteori: /(implikasi teori|sumbangan teori|dari sudut teori|theoretical (implications?|contributions?))/iu,
  impamalan: /(implikasi (amalan|praktikal|dasar)|pembuat dasar|pengamal|practical implications?|policy implications?|practitioners|policymakers)/iu,
  batasan: /(batasan|limitasi|kekangan|limitations?)/iu,
  lanjutan: /(kajian (lanjutan|akan datang|masa hadapan)|penyelidikan (lanjutan|akan datang)|future (research|studies))/iu,
  jawab: /(kesimpulannya|secara keseluruhan|(kajian|ulasan|artikel) ini (menunjukkan|membuktikan|merumuskan)|in conclusion|this (study|review|article) (shows|concludes|demonstrates)|overall)/iu,
  saranan: /(implikasi|saranan|disarankan|cadangan|wajar|implications?|recommend)/iu,
  abstujuan: /(bertujuan|tujuan|objektif|\baims?\b|purpose|objective)/iu,
  abskaedah: /(reka bentuk|kaedah|sampel|responden|pangkalan data|ulasan skop|tinjauan|design|methods?|sample|databases?|scoping review|survey)/iu,
  absdapatan: /(dapatan|menunjukkan|mendapati|findings?|results?|show(s|ed)?|reveal(s|ed)?)/iu,
  abskesimpulan: /(implikasi|kesimpulan|sumbangan|implications?|conclusions?|contribut)/iu,
  abskunci: /(kata kunci|keywords?)\s*:/iu,
  hujah: /(.)/u,
  kaitan: /(tujuan (artikel|kajian)|soalan (kajian|ulasan)|objektif|the aim of this|research questions?)/iu,
  komponen: /(komponen|dimensi|unsur|elemen|components?|dimensions?|elements?)/iu,
  hubungan: /(hubungan|mempengaruhi|menyumbang kepada|relationships?|influences?|leads? to)/iu,
  proposisi: /(proposisi|\bP\d\b|propositions?)/iu,
  sempadan: /(andaian|sempadan|syarat|assumptions?|boundary conditions?)/iu
};

const S = (k, t, ph) => ({ k, t, ph: ph || '' });

/* ---- spesifikasi peranan mengikut keluarga ---- */
export function spec(kel, peranan) {
  const g = kumpulanDari(kel);
  if (peranan === 'pendahuluan') {
    const gerakan = [
      G('latar', 'Latar dan kepentingan isu', 'Buka dengan isu atau fenomena, konteksnya dan sebab ia penting sekarang, disokong sitasi atau dokumen dasar.', C.latar),
      G('lepas', 'Apa yang sudah diketahui', 'Rumuskan arah kajian lepas bagi setiap pemboleh ubah dalam beberapa ayat bersitasi; sorotan penuh ditulis dalam folder lain.', C.lepas),
      G('jurang', 'Jurang atau masalah', 'Nyatakan apa yang belum diketahui, bercanggah atau belum diuji dalam konteks ini, dengan bukti daripada artikel sumber.', C.jurang)];
    if (g === 'ulasan') gerakan.push(G('jenisulasan', 'Justifikasi jenis ulasan', 'Sebab jenis ulasan ini dipilih, dan ulasan terdahulu yang berkaitan serta bezanya.', C.jenisulasan));
    gerakan.push(G('tujuan', 'Tujuan dan soalan', 'Tujuan artikel serta soalan kajian atau soalan ulasan; satu soalan menanyakan satu perkara.', C.tujuan), G('sumbangan', 'Sumbangan', 'Apa yang ditambah kepada teori, amalan atau dasar.', C.sumbangan), G('susunan', 'Susunan artikel', 'Satu ayat tentang susunan bahagian seterusnya (pilihan).', C.susunan, false));
    return { nama: 'Pendahuluan', tujuan: 'Membawa pembaca daripada isu umum kepada jurang yang khusus, kemudian menyatakan tujuan, soalan dan sumbangan artikel. Penilai jurnal menilai tiga perkara di sini: isu itu penting, jurang itu nyata dan bersitasi, dan tujuan artikel padan dengan jurang tersebut.', gerakan,
      soalan: [S('isu', 'Isu atau fenomena yang mana mahu dijadikan pembuka, dan dalam konteks yang mana (negara, sektor, peringkat)?', 'Tulis dalam ayat Prof Dr sendiri; agen akan memadankannya dengan bukti artikel sumber.'), S('jurang', 'Jurang yang mana mahu diisi (konteks, populasi, teori, kaedah atau empirikal)? Tulis seperti yang Prof Dr faham sekarang.'), S('tujuan', g === 'ulasan' ? 'Tujuan ulasan dan soalan ulasan (satu soalan satu baris).' : 'Tujuan artikel dan soalan kajian atau hipotesis (satu baris setiap satu).'), S('sumbangan', 'Sumbangan yang mahu dijanjikan kepada teori, amalan atau dasar.'), S('konteks', 'Dasar, pelan atau dokumen rasmi yang perlu disebut, jika ada.')],
      kriteria: ['Kejelasan isu dan konteks', 'Sokongan literatur dan kepadatan sitasi', 'Ketajaman jurang', 'Kejelasan tujuan dan soalan', 'Liputan semua pemboleh ubah', 'Sumbangan dinyatakan', 'Aliran hujah daripada umum kepada khusus'], pemboleh: 'wajib', sitasi: 'padat', bahan: 'sumber', medan: ['objektif', 'jurang', 'dapatan', 'implikasi', 'batasan'] };
  }
  if (peranan === 'literatur') {
    const gerakan = [G('takrif', 'Takrif konsep dan pemboleh ubah', 'Takrifkan setiap pemboleh ubah dan dimensinya dengan sumber.', C.takrif), G('teori', 'Teori atau model sandaran', 'Teori yang menjelaskan mengapa pemboleh ubah itu berkait.', C.teori), G('sintesis', 'Sintesis kajian lepas', 'Kelompokkan kajian mengikut pola dapatan, kaedah atau konteks; bandingkan yang selari dengan yang bercanggah. Dikira daripada perenggan yang memetik dua sumber atau lebih.', null)];
    if (g === 'emp') gerakan.push(G('hipotesis', 'Hipotesis atau kerangka', 'Setiap hipotesis didahului hujah dan bukti; kerangka konseptual dinyatakan.', C.hipotesis));
    else if (g === 'konsep') gerakan.push(G('hipotesis', 'Arah kepada kerangka', 'Tunjukkan bagaimana literatur membawa kepada kerangka atau proposisi yang dicadangkan.', C.hipotesis, false));
    gerakan.push(G('rumusjurang', 'Rumusan jurang', 'Tutup dengan jurang yang membawa terus kepada kajian ini.', C.rumusjurang));
    return { nama: 'Kajian Literatur', tujuan: 'Membina hujah daripada literatur: takrif setiap pemboleh ubah, teori yang menghubungkannya, dan sintesis kajian lepas yang membawa kepada hipotesis atau kerangka kajian. Yang dinilai ialah sintesis, iaitu perbandingan dan pengelompokan sumber, bukan laporan kajian demi kajian.', gerakan,
      soalan: [S('konsep', 'Konsep dan pemboleh ubah yang mana perlu ditakrifkan, dan takrif pilihan Prof Dr bagi setiap satu?'), S('teori', 'Teori atau model sandaran yang mana, dan bagaimana ia menghubungkan pemboleh ubah?'), S('hubungan', 'Hubungan atau hipotesis yang mana mahu dihujahkan (contoh: H1, H2)?'), S('canggah', 'Dapatan bercanggah yang mana Prof Dr sedar, dan pendirian Prof Dr terhadapnya?'), S('susun', 'Susunan tema yang diingini (mengikut pemboleh ubah, mengikut hubungan atau mengikut masa)?')],
      kriteria: ['Takrif konstruk', 'Asas teori', 'Sintesis, bukan laporan kajian demi kajian', 'Hujah bagi setiap hubungan atau hipotesis', 'Kekinian dan keluasan sumber', 'Jurang yang membawa kepada kajian', 'Liputan semua pemboleh ubah'], pemboleh: 'wajib', sitasi: 'padat', bahan: 'sumber', medan: ['definisi', 'teori', 'konstruk', 'dapatan', 'bandingan'] };
  }
  if (peranan === 'kaedah') {
    if (g === 'ulasan' && kel !== 'biblio') {
      const wajibKualiti = kel === 'slr' || kel === 'meta';
      return { nama: 'Metodologi', tujuan: 'Menerangkan cara ulasan dijalankan supaya boleh diulang: kerangka dan garis panduan pelaporan, kriteria kelayakan, sumber maklumat, rentetan carian penuh, proses pemilihan, pencartaan data dan kaedah sintesis. Fakta dalam folder ini datang daripada proses Prof Dr sendiri; angka aliran diisi dalam Ruang PRISMA.',
        gerakan: [G('kerangkaulasan', 'Kerangka ulasan dan protokol', 'Kerangka (contohnya Arksey dan O\'Malley, JBI), garis panduan pelaporan PRISMA dan status protokol.', C.kerangkaulasan), G('kelayakan', 'Kriteria kelayakan', 'Kriteria penerimaan dan pengecualian: populasi, konsep, konteks, tahun, bahasa dan jenis penerbitan.', C.kelayakan), G('pangkalan', 'Sumber maklumat dan tarikh carian', 'Pangkalan data yang dicari dan tarikh larian carian muktamad.', C.pangkalan), G('rentetan', 'Rentetan carian dicetak', 'Rentetan carian penuh dicetak dalam manuskrip, sebaik-baiknya dalam jadual.', C.rentetan), G('saringan', 'Pemilihan sumber bukti', 'Peringkat saringan, bilangan penilai, cara pendua dibuang dan cara percanggahan diselesaikan.', C.saringan), G('carta', 'Pencartaan atau pengekstrakan data', 'Borang dan item data yang diekstrak.', C.carta), G('kualiti', 'Penilaian kualiti', wajibKualiti ? 'Alat penilaian kualiti atau risiko bias dan cara ia digunakan.' : 'Tidak wajib bagi ulasan skop; nyatakan sama ada dibuat dan sebabnya.', C.kualiti, wajibKualiti), G('sintesiskaedah', 'Kaedah sintesis', 'Cara dapatan disintesis (contohnya ringkasan berangka dan analisis tematik).', C.sintesiskaedah), G('prisma', 'Rajah aliran PRISMA 2020', 'Rajah aliran mengikut templat rasmi, dibina dalam Ruang PRISMA dan disisipkan ke dalam manuskrip.', null)],
        soalan: [S('kerangka', 'Kerangka ulasan dan garis panduan pelaporan yang mana digunakan, dan status protokol (didaftarkan di mana, atau tidak didaftarkan)?'), S('kelayakan', 'Kriteria kelayakan: populasi, konsep, konteks, julat tahun, bahasa dan jenis penerbitan.'), S('carian', 'Pangkalan data, tarikh larian carian muktamad dan rentetan carian penuh (boleh diisi dalam Ruang PRISMA di bawah).'), S('saringan', 'Proses saringan: bilangan penilai, peringkat, perisian dan cara pendua dibuang.'), S('carta', 'Borang pencartaan, item data yang diekstrak dan kaedah sintesis.')],
        kriteria: ['Kerangka dan garis panduan pelaporan', 'Kriteria kelayakan', 'Sumber maklumat dan strategi carian (rentetan dicetak)', 'Proses pemilihan', 'Pencartaan data', 'Kaedah sintesis', 'Ketelusan dan kebolehulangan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['rekaBentuk', 'sampel', 'teknik', 'perisian'] };
    }
    if (kel === 'biblio') return { nama: 'Metodologi', tujuan: 'Menerangkan sumber data bibliometrik, rentetan carian, kriteria penerimaan, pembersihan data dan teknik analisis supaya analisis boleh diulang.',
      gerakan: [G('pangkalan', 'Sumber data dan justifikasi', 'Pangkalan data yang digunakan dan sebab ia dipilih.', C.pangkalan), G('rentetan', 'Rentetan carian dan tarikh', 'Rentetan carian penuh dan tarikh larian.', C.rentetan), G('kelayakan', 'Kriteria penerimaan', 'Julat tahun, jenis dokumen, bahasa.', C.kelayakan), G('alatbiblio', 'Alat dan teknik analisis', 'Analisis prestasi dan pemetaan sains serta perisian yang digunakan.', C.alatbiblio)],
      soalan: [S('data', 'Pangkalan data yang mana, tarikh larian dan rentetan carian penuh?'), S('kriteria', 'Kriteria penerimaan dan langkah pembersihan data.'), S('teknik', 'Teknik analisis dan perisian yang digunakan.')],
      kriteria: ['Sumber data dan justifikasi', 'Strategi carian', 'Kriteria dan pembersihan data', 'Teknik analisis', 'Kebolehulangan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['teknik', 'perisian'] };
    if (g === 'kual') return { nama: 'Metodologi', tujuan: 'Menerangkan reka bentuk kualitatif, peserta, pengumpulan dan analisis data serta langkah menjamin kebolehpercayaan kajian, dengan cukup terperinci untuk dinilai. Fakta dalam folder ini datang daripada kajian Prof Dr sendiri.',
      gerakan: [G('rekabentuk', 'Reka bentuk dan pendekatan', 'Pendekatan kualitatif yang dipilih dan sebabnya.', C.rekabentuk), G('sampel', 'Peserta dan persampelan', 'Siapa peserta, cara dipilih dan berapa ramai.', C.sampel), G('instrumen', 'Pengumpulan data', 'Protokol temu bual, pemerhatian atau dokumen.', C.instrumen), G('analisis', 'Analisis data', 'Langkah analisis, contohnya analisis tematik.', C.analisis), G('kesahan', 'Kebolehpercayaan kajian', 'Kredibiliti, kebolehpindahan, kebolehharapan dan kebolehsahan.', C.kesahan), G('prosedur', 'Etika', 'Kebenaran dan persetujuan termaklum.', C.prosedur)],
      soalan: [S('rekabentuk', 'Reka bentuk dan pendekatan kualitatif yang digunakan, serta justifikasinya.'), S('sampel', 'Peserta: siapa, berapa ramai, cara dipilih.'), S('data', 'Cara data dikumpul (protokol, tempoh, rakaman).'), S('analisis', 'Langkah analisis data dan perisian, serta langkah kebolehpercayaan kajian.')],
      kriteria: ['Reka bentuk dan justifikasi', 'Peserta dan persampelan', 'Pengumpulan data', 'Analisis data', 'Kebolehpercayaan kajian', 'Etika'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['rekaBentuk', 'sampel', 'instrumen', 'teknik'] };
    if (kel === 'instr') return { nama: 'Metodologi', tujuan: 'Menerangkan setiap fasa pembangunan instrumen: penjanaan item, kesahan kandungan, sampel setiap fasa dan analisis faktor, supaya bukti kesahan boleh dinilai. Fakta dalam folder ini datang daripada kajian Prof Dr sendiri.',
      gerakan: [G('penjanaan', 'Penjanaan item', 'Sumber item dan cara item dibina.', C.penjanaan), G('kesahan', 'Kesahan kandungan', 'Panel pakar dan indeks kesahan kandungan.', C.kesahan), G('sampel', 'Sampel setiap fasa', 'Sampel bagi kajian rintis, EFA dan CFA.', C.sampel), G('efa', 'Analisis faktor penerokaan', 'Kaedah pengekstrakan, putaran dan kriteria.', C.efa), G('cfa', 'Analisis faktor pengesahan', 'Model pengukuran dan indeks padanan.', C.cfa), G('prosedur', 'Prosedur dan etika', 'Cara data dikutip dan kelulusan.', C.prosedur)],
      soalan: [S('item', 'Sumber item, bilangan item awal dan skala.'), S('pakar', 'Panel pakar, kaedah kesahan kandungan dan keputusan.'), S('sampel', 'Sampel bagi setiap fasa dan cara dipilih.'), S('analisis', 'Analisis yang dijalankan, perisian dan kriteria.')],
      kriteria: ['Penjanaan item', 'Kesahan kandungan', 'Persampelan setiap fasa', 'Analisis faktor dan kriteria', 'Kebolehulangan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['instrumen', 'sampel', 'teknik', 'perisian'] };
    if (g === 'emp') {
      const gerakan = [G('rekabentuk', 'Reka bentuk kajian', 'Reka bentuk dan justifikasinya.', C.rekabentuk), G('sampel', 'Populasi, sampel dan persampelan', 'Populasi, saiz sampel, teknik persampelan dan justifikasi saiz.', C.sampel), G('instrumen', 'Instrumen', 'Sumber adaptasi, bilangan item dan skala bagi setiap pemboleh ubah.', C.instrumen), G('kesahan', 'Kesahan dan kebolehpercayaan', 'Bukti kesahan dan kebolehpercayaan instrumen.', C.kesahan), G('prosedur', 'Prosedur dan etika', 'Cara data dikutip, tarikh dan kelulusan etika.', C.prosedur), G('analisis', 'Analisis data', 'Teknik, perisian dan kriteria yang digunakan.', C.analisis)];
      if (kel === 'campur') gerakan.push(G('integrasi', 'Integrasi dua jenis data', 'Titik dan cara data kuantitatif dan kualitatif digabungkan.', C.integrasi));
      return { nama: 'Metodologi', tujuan: 'Menerangkan apa yang dibuat dengan cukup terperinci supaya kajian boleh diulang dan dinilai: reka bentuk, sampel, instrumen, prosedur dan analisis, setiap satu dengan justifikasi. Fakta dalam folder ini datang daripada kajian Prof Dr sendiri; artikel panduan hanya menjadi contoh cara melaporkan.', gerakan,
        soalan: [S('rekabentuk', 'Reka bentuk kajian dan justifikasinya.'), S('sampel', 'Populasi, saiz sampel sebenar, teknik persampelan dan kadar respons.'), S('instrumen', 'Instrumen bagi setiap pemboleh ubah: sumber adaptasi, bilangan item, skala, bukti kesahan dan kebolehpercayaan.'), S('prosedur', 'Prosedur kutipan data dan kelulusan etika (tarikh, kebenaran).'), S('analisis', 'Teknik analisis, perisian dan kriteria (contohnya indeks padanan, bootstrap).')],
        kriteria: ['Reka bentuk dan justifikasi', 'Persampelan dan saiz sampel', 'Instrumen, kesahan dan kebolehpercayaan', 'Prosedur dan etika', 'Analisis data dan kriteria', 'Kebolehulangan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['rekaBentuk', 'sampel', 'instrumen', 'teknik', 'perisian'] };
    }
    return { nama: 'Kaedah', tujuan: 'Menerangkan pendekatan, bahan dan prosedur yang digunakan supaya pembaca boleh menilai dan mengulanginya.', gerakan: [G('rekabentuk', 'Pendekatan', 'Pendekatan dan justifikasinya.', C.rekabentuk), G('prosedur', 'Bahan dan prosedur', 'Bahan atau data serta langkah yang diambil.', C.prosedur), G('analisis', 'Analisis', 'Cara bahan dianalisis.', C.analisis)], soalan: [S('pendekatan', 'Pendekatan yang digunakan dan justifikasinya.'), S('prosedur', 'Bahan atau data dan langkah yang diambil.')], kriteria: ['Kejelasan pendekatan', 'Prosedur', 'Analisis', 'Kebolehulangan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['rekaBentuk', 'teknik'] };
  }
  if (peranan === 'dapatan') {
    if (g === 'ulasan' && kel !== 'biblio') return { nama: 'Dapatan', tujuan: 'Melaporkan hasil ulasan: aliran pemilihan dengan angka yang sama seperti rajah PRISMA, ciri sumber bukti, dan sintesis mengikut setiap soalan ulasan. Sumber bukti dibandingkan dan dikelompokkan, bukan disenaraikan satu demi satu; rajah lebih jelas daripada jadual yang padat.',
      gerakan: [G('aliran', 'Aliran pemilihan', 'Bilangan rekod dikenal pasti, disaring dan dimasukkan, selaras dengan rajah PRISMA.', C.aliran), G('ciri', 'Ciri sumber bukti', 'Taburan tahun, negara, reka bentuk dan konteks.', C.ciri), G('ikutsoalan', 'Dapatan mengikut soalan ulasan', 'Satu bahagian bagi setiap soalan ulasan, dengan sintesis merentas sumber.', C.ikutsoalan), G('sintesis', 'Sintesis merentas sumber', 'Dikira daripada perenggan yang memetik dua sumber atau lebih.', null), G('jadual', 'Rajah atau jadual ringkasan', 'Sekurang-kurangnya satu rajah atau jadual.', null)],
      soalan: [S('aliran', 'Angka aliran pemilihan (isi dalam Ruang PRISMA folder Metodologi) dan tarikh carian.'), S('ciri', 'Ciri sumber bukti yang mahu dilaporkan (tahun, negara, reka bentuk, peringkat).'), S('dapatan', 'Dapatan utama bagi setiap soalan ulasan, dalam nota ringkas.'), S('rajah', 'Rajah atau graf yang mahu disertakan (contohnya taburan tahun, taburan negara, peta bukti).')],
      kriteria: ['Aliran pemilihan selaras dengan PRISMA', 'Ciri sumber bukti', 'Sintesis mengikut soalan ulasan', 'Penggunaan rajah dan jadual', 'Kesetiaan kepada sumber'], pemboleh: 'disyor', sitasi: 'padat', bahan: 'sumber', medan: ['dapatan', 'rekaBentuk', 'sampel', 'negara', 'teori', 'batasan'] };
    if (kel === 'biblio') return { nama: 'Dapatan', tujuan: 'Melaporkan hasil analisis prestasi dan pemetaan sains dengan rajah yang jelas dan tafsiran ringkas bagi setiap rajah.', gerakan: [G('taburan', 'Taburan penerbitan dan petikan', 'Trend tahunan penerbitan dan petikan.', C.taburan), G('pengarang', 'Pengarang, institusi dan negara', 'Penyumbang utama dan kerjasama.', C.pengarang), G('katakunci', 'Kata kunci dan tema', 'Kluster kata kunci dan tema penyelidikan.', C.katakunci), G('jadual', 'Rajah atau jadual', 'Sekurang-kurangnya satu rajah atau jadual.', null)], soalan: [S('trend', 'Trend penerbitan dan petikan yang mahu ditonjolkan.'), S('penyumbang', 'Pengarang, institusi dan negara utama.'), S('tema', 'Kluster dan tema utama yang ditemui.')], kriteria: ['Analisis prestasi', 'Pemetaan sains', 'Rajah dan jadual', 'Tafsiran setiap rajah'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['dapatan'] };
    if (g === 'kual') return { nama: 'Dapatan', tujuan: 'Melaporkan tema yang muncul daripada data, setiap satu disokong petikan peserta, dan dikaitkan dengan soalan kajian. Angka dan petikan mesti sama seperti data Prof Dr.', gerakan: [G('peserta', 'Gambaran peserta', 'Ringkasan peserta kajian.', C.peserta), G('tema', 'Tema dan subtema', 'Tema disusun mengikut soalan kajian.', C.tema), G('petikan', 'Petikan sebagai bukti', 'Setiap tema disokong petikan peserta.', C.petikan), G('ikutsoalan', 'Kaitan dengan soalan kajian', 'Setiap tema menjawab soalan kajian yang mana.', C.ikutsoalan)], soalan: [S('peserta', 'Ringkasan peserta (bilangan, latar).'), S('tema', 'Tema dan subtema yang ditemui.'), S('petikan', 'Petikan terpilih bagi setiap tema (letak dalam Ruang Output atau RAM).')], kriteria: ['Kejelasan tema', 'Bukti petikan', 'Kaitan dengan soalan kajian', 'Kedalaman huraian'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['dapatan'] };
    if (kel === 'instr') return { nama: 'Dapatan', tujuan: 'Melaporkan bukti kesahan dan kebolehpercayaan instrumen mengikut fasa, dengan angka yang tepat sama seperti output analisis.', gerakan: [G('efa', 'Analisis faktor penerokaan', 'KMO, ujian Bartlett, bilangan faktor dan muatan.', C.efa), G('cfa', 'Analisis faktor pengesahan', 'Muatan faktor dan indeks padanan.', C.cfa), G('kesahan', 'Kesahan dan kebolehpercayaan', 'CR, AVE, kesahan diskriminan, alfa Cronbach.', C.kesahan), G('jadual', 'Jadual atau rajah', 'Sekurang-kurangnya satu jadual atau rajah.', null)], soalan: [S('efa', 'Keputusan EFA (KMO, Bartlett, faktor, varians).'), S('cfa', 'Keputusan CFA (muatan, indeks padanan).'), S('kesahan', 'Keputusan kebolehpercayaan dan kesahan.')], kriteria: ['Kelengkapan bukti kesahan', 'Ketepatan statistik', 'Jadual dan rajah', 'Keselarasan dengan kaedah'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['dapatan', 'instrumen'] };
    if (g === 'emp') {
      const gerakan = [G('profil', 'Profil responden', 'Ciri responden dan kadar respons.', C.profil), G('pengukuran', 'Model pengukuran', 'Muatan faktor, kebolehpercayaan komposit, AVE dan kesahan diskriminan.', C.pengukuran), G('struktur', 'Model berstruktur dan hipotesis', 'Indeks padanan, pekali laluan dan keputusan setiap hipotesis mengikut urutan.', C.struktur), G('perantara', 'Kesan perantara', 'Kesan tidak langsung dengan selang keyakinan bootstrap (jika berkenaan).', C.perantara, false), G('jadual', 'Jadual atau rajah', 'Sekurang-kurangnya satu jadual atau rajah daripada Ruang Output.', null)];
      if (kel === 'campur') gerakan.push(G('tema', 'Dapatan kualitatif', 'Tema dan petikan.', C.tema), G('integrasi', 'Integrasi dapatan', 'Titik temu dan percanggahan dua jenis data.', C.integrasi));
      return { nama: 'Dapatan', tujuan: 'Melaporkan keputusan analisis mengikut urutan hipotesis atau soalan kajian, dengan angka yang tepat sama seperti output SPSS dan AMOS, tanpa tafsiran yang panjang (tafsiran ditulis dalam Perbincangan). Output dan rajah diletakkan dalam Ruang Output folder ini.', gerakan,
        soalan: [S('profil', 'Profil responden dan kadar respons (angka).'), S('pengukuran', 'Keputusan model pengukuran yang mahu dilaporkan (muatan, CR, AVE, kesahan diskriminan).'), S('hipotesis', 'Indeks padanan dan keputusan setiap hipotesis (pekali, nilai p, keputusan).'), S('tambahan', 'Kesan perantara atau analisis tambahan (selang keyakinan bootstrap, perbandingan kumpulan).')],
        kriteria: ['Urutan pelaporan mengikut hipotesis', 'Ketepatan dan kelengkapan statistik', 'Jadual dan rajah', 'Tiada tafsiran berlebihan', 'Keselarasan dengan kaedah'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['dapatan', 'teknik'] };
    }
    return { nama: 'Dapatan', tujuan: 'Melaporkan apa yang ditemui dengan jelas dan teratur, disokong bukti, tanpa tafsiran yang panjang.', gerakan: [G('ringkas', 'Dapatan utama', 'Dapatan dinyatakan dengan jelas.', C.absdapatan), G('jadual', 'Jadual atau rajah', 'Sekurang-kurangnya satu jadual atau rajah.', null, false)], soalan: [S('dapatan', 'Dapatan utama yang mahu dilaporkan, mengikut urutan.')], kriteria: ['Kejelasan dapatan', 'Bukti', 'Susunan'], pemboleh: 'disyor', sitasi: 'sederhana', bahan: 'sendiri', medan: ['dapatan'] };
  }
  if (peranan === 'perbincangan') {
    const ul = g === 'ulasan';
    return { nama: 'Perbincangan', tujuan: ul ? 'Mentafsir bukti yang dipetakan: apa yang sudah kukuh, apa yang bercanggah dan apa yang masih kosong, berbanding ulasan dan kajian lain, serta implikasi dan batasan ulasan. Setiap rumusan merujuk semula sumber bukti.' : 'Mentafsir dapatan: apa maknanya, bagaimana ia berbanding kajian lepas, apa implikasinya kepada teori, amalan dan dasar, serta batasan yang jujur. Setiap dapatan utama dibincang dengan merujuk semula literatur.',
      gerakan: [G('ringkas', ul ? 'Rumusan bukti' : 'Ringkasan dapatan utama', ul ? 'Rumusan bukti mengikut soalan ulasan.' : 'Dapatan utama dinyatakan semula berbanding tujuan kajian.', C.ringkas), G('banding', 'Perbandingan dengan kajian lepas', 'Dapatan yang selari dan yang bercanggah dengan kajian lepas, dengan penjelasan.', C.banding), G('impteori', 'Implikasi teori', 'Apa yang berubah atau diperkukuh dalam teori.', C.impteori), G('impamalan', 'Implikasi amalan dan dasar', 'Untuk siapa dan tindakan apa.', C.impamalan), G('batasan', 'Batasan', 'Batasan yang jujur dan kesannya kepada tafsiran.', C.batasan), G('lanjutan', 'Cadangan kajian lanjutan', 'Soalan yang wajar dikaji seterusnya.', C.lanjutan)],
      soalan: [S('utama', 'Tiga dapatan paling penting mengikut pandangan Prof Dr.'), S('banding', 'Dapatan yang mana selari dan yang mana bercanggah dengan kajian lepas, dan penjelasan Prof Dr?'), S('teori', 'Implikasi teori yang mahu ditonjolkan.'), S('amalan', 'Implikasi amalan dan dasar: untuk siapa, tindakan apa.'), S('batasan', 'Batasan dan cadangan kajian lanjutan.')],
      kriteria: ['Tafsiran dapatan utama', 'Perbandingan dengan kajian lepas', 'Implikasi teori', 'Implikasi amalan dan dasar', 'Batasan', 'Cadangan kajian lanjutan', 'Liputan semua pemboleh ubah'], pemboleh: 'wajib', sitasi: 'padat', bahan: 'sumber', medan: ['dapatan', 'implikasi', 'batasan', 'jurang', 'bandingan'] };
  }
  if (peranan === 'kesimpulan') return { nama: 'Kesimpulan', tujuan: 'Menutup artikel dengan jawapan ringkas kepada tujuan, sumbangan paling penting dan saranan. Tiada bahan, angka atau sitasi baharu; agen membaca ASAL folder lain, bukan artikel sumber.',
    gerakan: [G('jawab', 'Jawapan kepada tujuan', 'Apa yang telah ditunjukkan berbanding tujuan artikel.', C.jawab), G('sumbangan', 'Sumbangan utama', 'Sumbangan paling penting dalam satu atau dua ayat.', C.sumbangan), G('saranan', 'Saranan penutup', 'Implikasi atau saranan ringkas.', C.saranan)],
    soalan: [S('mesej', 'Mesej utama yang pembaca mesti ingat (satu atau dua ayat).'), S('sumbangan', 'Sumbangan paling penting.'), S('saranan', 'Saranan penutup.')],
    kriteria: ['Menjawab tujuan artikel', 'Sumbangan dinyatakan', 'Tiada bahan baharu', 'Padat'], pemboleh: 'wajib', sitasi: 'sedikit', bahan: 'asal', medan: [] };
  if (peranan === 'abstrak') return { nama: 'Abstrak', tujuan: 'Ditulis paling akhir, daripada ASAL semua folder lain: tujuan, kaedah, dapatan utama dan kesimpulan dalam had patah perkataan jurnal, diikuti kata kunci. Abstrak mesti boleh difahami tanpa membaca artikel dan tidak mengandungi sitasi.',
    gerakan: [G('abstujuan', 'Tujuan', 'Latar ringkas dan tujuan.', C.abstujuan), G('abskaedah', 'Kaedah', 'Reka bentuk, sampel atau sumber data, dan analisis.', C.abskaedah), G('absdapatan', 'Dapatan utama', 'Dapatan paling penting, dengan angka jika ada.', C.absdapatan), G('abskesimpulan', 'Kesimpulan dan implikasi', 'Maksud dapatan dan sumbangannya.', C.abskesimpulan), G('abskunci', 'Kata kunci', 'Empat hingga enam kata kunci selepas abstrak.', C.abskunci)],
    soalan: [S('had', 'Had patah perkataan dan format abstrak jurnal sasaran (berstruktur atau satu perenggan).'), S('kunci', 'Empat hingga enam kata kunci pilihan Prof Dr.')],
    kriteria: ['Tujuan', 'Kaedah', 'Dapatan utama', 'Kesimpulan dan implikasi', 'Liputan pemboleh ubah', 'Panjang dan kata kunci'], pemboleh: 'wajib', sitasi: 'tiada', bahan: 'asal', medan: [] };
  if (peranan === 'kerangka') return { nama: 'Kerangka dan Proposisi', tujuan: 'Mengemukakan model, kerangka atau proposisi baharu yang dibina daripada literatur: takrif setiap komponen, hubungan antara komponen dan logik setiap proposisi.',
    gerakan: [G('komponen', 'Komponen kerangka', 'Setiap komponen ditakrifkan.', C.komponen), G('hubungan', 'Hubungan antara komponen', 'Arah dan logik hubungan.', C.hubungan), G('proposisi', 'Proposisi', 'Proposisi yang boleh diuji, setiap satu dengan hujah.', C.proposisi), G('sempadan', 'Andaian dan sempadan', 'Syarat kerangka terpakai.', C.sempadan, false)],
    soalan: [S('komponen', 'Komponen kerangka dan takrif setiap satu.'), S('hubungan', 'Hubungan yang dicadangkan dan logiknya.'), S('proposisi', 'Proposisi yang mahu dikemukakan.')],
    kriteria: ['Kejelasan komponen', 'Logik hubungan', 'Proposisi boleh diuji', 'Sokongan literatur', 'Keaslian sumbangan'], pemboleh: 'wajib', sitasi: 'padat', bahan: 'sumber', medan: ['teori', 'konstruk', 'definisi', 'dapatan'] };
  if (peranan === 'rujukan') return { nama: 'Rujukan', tujuan: 'Senarai rujukan dijana daripada sitasi dalam ASAL semua folder dan medan Rujukan APA 7 setiap rekod. Semakan dua hala: setiap sitasi ada entri, dan setiap entri disitasi.', gerakan: [], soalan: [], kriteria: [], pemboleh: 'tidak', sitasi: 'tiada', bahan: 'tiada', medan: [] };
  return { nama: 'Bahagian isi', tujuan: 'Bahagian isi: satu hujah utama yang disokong bukti bersitasi, disintesis merentas sumber dan dikaitkan dengan tujuan artikel.',
    gerakan: [G('hujah', 'Hujah atau fokus bahagian', 'Ayat topik yang menyatakan hujah bahagian ini.', C.hujah), G('sintesis', 'Sintesis sumber', 'Dikira daripada perenggan yang memetik dua sumber atau lebih.', null), G('kaitan', 'Kaitan dengan tujuan artikel', 'Bahagian ini dikaitkan dengan tujuan atau soalan artikel.', C.kaitan, false)],
    soalan: [S('hujah', 'Hujah utama bahagian ini.'), S('bukti', 'Sumber dan bukti utama yang mahu digunakan.'), S('kaitan', 'Kaitan bahagian ini dengan bahagian sebelum dan selepasnya.')],
    kriteria: ['Kejelasan hujah', 'Sokongan bukti', 'Sintesis sumber', 'Kaitan dengan tujuan artikel'], pemboleh: 'disyor', sitasi: 'padat', bahan: 'sumber', medan: ['dapatan', 'teori', 'jurang'] };
}

/* ---- peraturan gaya lalai (boleh diubah dalam Peraturan gaya) ---- */
export const GAYA_LALAI = {
  larang: 'korpus, corpus, bottleneck, lewah, berlewah-lewah, sauh, menyauh, disauh, bersauh, jangkar, menjangkar, dijangkar, penjangkaran, mengkonseptualisasikan, dikonseptualisasikan, konseptualisasi, mengoperasionalisasikan, mengoperasionalkan, parsimoni, dikotomi, songsang, menyongsang, artikulasi, mengartikulasikan, epistemologi, ontologi, lakuran, meleburkan, substantif, kontingen',
  frasa: 'adalah penting untuk diperhatikan bahawa; perlu ditekankan di sini bahawa; dalam era globalisasi yang serba mencabar ini; tidak dapat dinafikan bahawa; secara keseluruhannya dapat dirumuskan bahawa; dengan itu, dapat disimpulkan bahawa; ianya; berdasarkan kepada; it is important to note that; it is worth noting that; in today\'s rapidly; delve into; a myriad of; plays a pivotal role; in the realm of',
  pembuka: 'apakah; sejauh mana; sejauh manakah; to what extent; what is the level',
  hadTahun: 5, hadPangkalan: 2,
  arahan: 'Ayat pelbagai panjang, satu ayat satu idea, suara aktif lebih kerap. Mulakan perenggan dengan dapatan atau hujah, bukan dengan ayat yang menerangkan apa yang akan diterangkan. Setiap kali sumber disebut, lakukan analisis (apa yang didapati, dengan angka jika ada) dan sintesis (bagaimana ia selari atau bercanggah dengan sumber lain) serentak. Elakkan frasa pembuka klise dan tiga kata sifat berturutan. Jangan guna "di mana" sebagai kata hubung, "ianya" atau "berdasarkan kepada". Nilai statistik yang tidak boleh melebihi satu ditulis tanpa sifar di hadapan (.75). Soalan kajian bermula dengan "Yang mana" atau "Bagaimana" (Which, How), tidak menggunakan "Apakah", "Sejauh mana" atau perkataan "tahap", dan tidak menggabungkan dua perkara dalam satu soalan. Bagi ulasan skop: maksimum dua pangkalan data, rentetan carian dicetak penuh, rajah aliran mengikut templat rasmi PRISMA 2020. Jangan campurkan Bahasa Melayu dan Bahasa Inggeris dalam satu teks.'
};

/* ---- kategori output analisis (Ruang Output) mengikut keluarga ---- */
const O_SEM = [['profil', 'Profil responden dan kadar respons'], ['deskriptif', 'Statistik deskriptif dan normaliti'], ['cmb', 'Bias kaedah sepunya'], ['pengukuran', 'Model pengukuran (CFA): muatan faktor, CR, AVE'], ['diskriminan', 'Kesahan diskriminan'], ['padanan', 'Indeks padanan model'], ['struktur', 'Model berstruktur: pekali laluan dan ujian hipotesis'], ['perantara', 'Kesan tidak langsung (bootstrap)'], ['rajahmodel', 'Rajah model (AMOS)'], ['lain', 'Lain-lain']];
export const OUTPUT_KAT = {
  kuan: O_SEM,
  campur: O_SEM.slice(0, -1).concat([['tema', 'Jadual atau peta tema (kualitatif)'], ['lain', 'Lain-lain']]),
  instr: [['cvi', 'Kesahan kandungan (CVI)'], ['efa', 'Analisis faktor penerokaan (KMO, Bartlett, matriks faktor)'], ['pengukuran', 'Analisis faktor pengesahan (CFA)'], ['kebolehpercayaan', 'Kebolehpercayaan (alfa Cronbach, CR)'], ['diskriminan', 'Kesahan diskriminan'], ['padanan', 'Indeks padanan model'], ['rajahmodel', 'Rajah model'], ['lain', 'Lain-lain']],
  kual: [['peserta', 'Jadual peserta'], ['tema', 'Jadual atau peta tema'], ['petikan', 'Petikan terpilih'], ['lain', 'Lain-lain']]
};
/* Tekaan kategori dan sumber daripada kandungan jadual yang ditampal (kepala jadual SPSS dan AMOS yang lazim). */
export function tekaOutput(teks) {
  const t = String(teks || ''); let kat = 'lain', sumber = 'Lain';
  if (/Indirect|Lower Bound|Upper Bound|Bootstrap|Tidak langsung/i.test(t)) kat = 'perantara';
  else if (/HTMT|Fornell|Discriminant|Diskriminan/i.test(t)) kat = 'diskriminan';
  else if (/\bAVE\b|Composite Reliab|Standardized Regression Weights|Factor Loading|Muatan faktor/i.test(t)) kat = 'pengukuran';
  else if (/CMIN|RMSEA|\bCFI\b|\bTLI\b|\bGFI\b|Model Fit|Padanan/i.test(t)) kat = 'padanan';
  else if (/Regression Weights|C\.R\.|Pekali laluan|Hipotesis|Hypothes/i.test(t)) kat = 'struktur';
  else if (/KMO|Bartlett|Rotated|Pattern Matrix|Eigenvalue/i.test(t)) kat = 'efa';
  else if (/Cronbach/i.test(t)) kat = 'kebolehpercayaan';
  else if (/Skewness|Kurtosis|Std\. Deviation|Sisihan piawai|Kepencongan/i.test(t)) kat = 'deskriptif';
  else if (/Frequency|Percent|Kekerapan|Peratus|Jantina|Gender/i.test(t)) kat = 'profil';
  if (/Regression Weights|CMIN|C\.R\.|Standardized Total Effects|Squared Multiple|Amos/i.test(t)) sumber = 'AMOS';
  else if (/Valid Percent|Cumulative Percent|Std\. Deviation|Cronbach|KMO|Statistic|Sig\./i.test(t)) sumber = 'SPSS';
  return { kat, sumber };
}

/* ---- label rasmi rajah aliran PRISMA 2020 (Page et al., 2021; templat berlesen CC BY 4.0) dalam Inggeris dan terjemahan Bahasa Melayu ---- */
export const PRISMA_LABEL = {
  en: { h1: 'Identification of studies via databases and registers', h2: 'Identification of studies via other methods', fasa: ['Identification', 'Screening', 'Included'], dikenal: 'Records identified from*:', pangkalan: 'Databases', daftar: 'Registers', dibuang: 'Records removed before screening:', pendua: 'Duplicate records removed', automasi: 'Records marked as ineligible by automation tools', lain: 'Records removed for other reasons', disaring: 'Records screened', dikecualikan: 'Records excluded**', dicari: 'Reports sought for retrieval', tidak: 'Reports not retrieved', dinilai: 'Reports assessed for eligibility', laporanKecuali: 'Reports excluded:', kajian: 'Studies included in review', laporan: 'Reports of included studies', dikenalLain: 'Records identified from:', nota: 'Template: PRISMA 2020 flow diagram (Page et al., 2021), CC BY 4.0.', sebab: 'Reason' },
  ms: { h1: 'Pengenalpastian kajian melalui pangkalan data dan daftar', h2: 'Pengenalpastian kajian melalui kaedah lain', fasa: ['Pengenalpastian', 'Saringan', 'Dimasukkan'], dikenal: 'Rekod dikenal pasti daripada*:', pangkalan: 'Pangkalan data', daftar: 'Daftar', dibuang: 'Rekod dibuang sebelum saringan:', pendua: 'Rekod pendua dibuang', automasi: 'Rekod ditanda tidak layak oleh alat automasi', lain: 'Rekod dibuang atas sebab lain', disaring: 'Rekod disaring', dikecualikan: 'Rekod dikecualikan**', dicari: 'Laporan dicari untuk diperoleh', tidak: 'Laporan tidak diperoleh', dinilai: 'Laporan dinilai kelayakannya', laporanKecuali: 'Laporan dikecualikan:', kajian: 'Kajian dimasukkan dalam ulasan', laporan: 'Laporan kajian yang dimasukkan', dikenalLain: 'Rekod dikenal pasti daripada:', nota: 'Templat: rajah aliran PRISMA 2020 (Page et al., 2021), CC BY 4.0.', sebab: 'Sebab' }
};
