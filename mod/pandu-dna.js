/* DNA Pernyataan Masalah bagi folder Pendahuluan dalam Pandu Tulis (acuan jurang Luthra et al., 2025).
   Dikod bersama Prof Dr dalam skill dna-pernyataan-masalah: tiga kitaran jurang yang setiap satunya ditutup dengan tujuan,
   rantaian kritikan melalui ketinggalan (setiap kajian lepas meninggalkan sekurang-kurangnya satu elemen model kajian dan
   gabungan ketinggalan sama dengan model kajian), rumusan sudah dikaji lawan belum dikaji, ayat pengisian jurang, serta
   soalan dan objektif yang sejajar dengan hipotesis. Modul ini menyediakan pangkalan pengetahuan (kod seni bina, formula
   ayat BM dan EN, peraturan sitasi, kelemahan exemplar), Matriks Ketinggalan yang diisi automatik daripada medan rekod
   tanpa agen dan boleh dipinda pemilik, Uji Kesatuan, meter "DNA jurang" dan teks arahan untuk agen.
   Seni bina diambil daripada exemplar; peraturan sitasi dan integriti diambil daripada Prof Dr. Tiada ayat exemplar disalin.
   Simpanan: P.t.dna dalam meta/pandu_<id> (mod, peringkat, negara, perantara, pindaan matriks). */

export const PENDEK = 'Luthra et al. (2025)';
export const RUJUKAN = 'Luthra, A., Pancholi, N., Dixit, S., Singh, A., & Garg, S. (2025). Cultivating digital culture: Exploring the impact of digital knowledge management on employee performance in higher educational institutions. International Journal of System Assurance Engineering and Management. https://doi.org/10.1007/s13198-024-02648-6';
export const DOI = 'https://doi.org/10.1007/s13198-024-02648-6';
export const PERINGKAT = ['Sekolah Rendah', 'Sekolah Menengah', 'Pengajian Tinggi', 'Bukan Pendidikan', 'Pelbagai peringkat'];
/* Kata yang dikira sebagai sebutan konteks dalam ayat kritikan (contohnya "guru sekolah" bagi sekolah rendah). */
const KATA_PERINGKAT = { 'Sekolah Rendah': ['sekolah rendah', 'sekolah', 'guru besar', 'primary school', 'elementary school', 'school'], 'Sekolah Menengah': ['sekolah menengah', 'sekolah', 'pengetua', 'secondary school', 'high school', 'school'], 'Pengajian Tinggi': ['pengajian tinggi', 'universiti', 'IPT', 'pensyarah', 'higher education', 'university', 'universities'], 'Bukan Pendidikan': ['syarikat', 'organisasi', 'firma', 'korporat', 'sektor', 'company', 'firm', 'corporate', 'sector'], 'Pelbagai peringkat': ['peringkat', 'level'] };
const ULASAN = new Set(['Ulasan sistematik', 'Ulasan skop', 'Meta-analisis']);

export const PRINSIP = [
  ['Jurang berperingkat dalam tiga kitaran', 'Setiap kitaran bergerak daripada wilayah kepada jurang kepada tujuan. Tujuan dinyatakan tiga kali dengan kekhususan yang bertambah: objektif awal selepas jurang pertama, ayat jambatan selepas jurang teras, dan ayat pengisian jurang selepas kritikan terakhir. Pembaca melihat tujuan lahir daripada bukti.'],
  ['Prinsip pemetaan', 'Setiap kajian yang dikritik meninggalkan sekurang-kurangnya satu elemen model kajian semasa, dan gabungan semua ketinggalan sama dengan model kajian semasa. Dalam exemplar, ketinggalan itu ialah prestasi staf (DV), konteks institusi pengajian tinggi, pendigitalan dan peranan budaya digital (IV).'],
  ['Kritikan melalui ketinggalan dengan konstruk paksi', 'Semua kajian yang dikritik berkongsi satu konstruk paksi (dalam exemplar: pengurusan pengetahuan), jadi rantaian membentuk satu keluarga kajian yang berbeza hanya pada apa yang ditinggalkan. Setiap ayat kritikan membawa empat unsur: apa yang dikaji, latar, penanda ketinggalan dan elemen yang tertinggal.'],
  ['Arah DV dahulu', 'Rantaian bergerak ke belakang sepanjang model: hasil (DV), kemudian konteks, kemudian dimensi digital, dan akhir sekali peranan IV. Hujah bermula daripada jurang DV, bukan daripada kenyataan bahawa IV penting.'],
  ['Bukti melekat pada dakwaan', 'Dakwaan jurang teras (J2) diikuti serta-merta oleh kajian bernama dan satu mandat ulasan. Rumusan R1 dan R2 mengabstrakkan rantaian itu; ia bukan dakwaan baharu.'],
  ['Konteks berulang', 'Lapan daripada sepuluh ayat jurang exemplar menamakan konteks. Ulang konteks dalam setiap ayat jurang dengan bentuk yang berubah-ubah supaya jurang sentiasa terikat pada latar kajian.']
];

/* Seni bina berkod: [kitaran, kod, fungsi, sitasi] */
export const KOD = [
  ['1 Pembuka', 'W1', 'Trend dalam konteks', 'dua sumber atau lebih'],
  ['1 Pembuka', 'W2', 'Kepentingan IV atau M (dakwaan normatif)', 'dua sumber atau lebih'],
  ['1 Pembuka', 'W3', 'Rantaian mekanisme IV ke M ke DV dalam satu ayat ("yang seterusnya")', 'dua sumber atau lebih'],
  ['1 Pembuka', 'J1', 'Jurang hubungan seluruh model dalam konteks, dengan sub-konteks', 'ulasan atau kluster'],
  ['1 Pembuka', 'T1', 'Tujuan awal: objektif utama, huraian, tujuan praktikal', 'pilihan'],
  ['2 Teras bukti', 'W4', 'Wilayah semula bagi konstruk paksi', 'dua sumber atau lebih'],
  ['2 Teras bukti', 'J2', 'Jurang teras pada satu laluan, lazimnya kesan langsung M ke DV', 'ulasan, atau bentuk positif dahulu'],
  ['2 Teras bukti', 'K', 'Tiga hingga lima ayat kritikan: K-HASIL, K-ULASAN, K-KONTEKS, K-DIGITAL', 'naratif, satu kajian seayat'],
  ['2 Teras bukti', 'R1', 'Rumusan "sudah dikaji"', 'kluster kajian dalam K'],
  ['2 Teras bukti', 'R2', 'Rumusan "belum dikaji"', 'dakwaan negatif relatif'],
  ['2 Teras bukti', 'T2', 'Jambatan tujuan', 'tiada'],
  ['3 Pengisian', 'K-PERANAN', 'Kritikan sisi IV (fungsi IV dalam proses M)', 'naratif'],
  ['3 Pengisian', 'I', 'Pengisian jurang', 'tiada'],
  ['3 Pengisian', 'SK', 'Soalan kajian (Bagaimanakah, Yang mana; How, Which)', 'tiada'],
  ['3 Pengisian', 'OK', 'Objektif bernombor (1), (2), (3) dalam satu ayat (artikel)', 'tiada'],
  ['3 Pengisian', 'S', 'Sumbangan integratif', 'pilihan'],
  ['Koda', 'P', 'Kepentingan praktikal kepada pemimpin dan penggubal dasar', 'satu sumber'],
  ['Koda', 'O', 'Organisasi artikel (artikel sahaja, pilihan)', 'tiada']
];

/* Formula ayat: slot dalam kurungan kerinting; diisi dengan fakta dan sumber Prof Dr sendiri. */
export const FORMULA = [
  ['W1', 'Dalam persekitaran yang semakin digital, {KONTEKS} semakin bergantung pada {X} bagi menyokong {fungsi} (S1; S2).', 'In an increasingly digital environment, {KONTEKS} rely more and more on {X} to support {fungsi} (S1; S2).'],
  ['W2', 'Pemupukan {IV} menjadi syarat penting bagi {hasil 1} dan {hasil 2} (S1; S2).', 'Fostering {IV} is essential for {hasil 1} and {hasil 2} (S1; S2).'],
  ['W3', 'Kajian terkini menekankan peranan {IV} dalam memudahkan {M}, yang seterusnya meningkatkan {DV} melalui {mekanisme a}, {mekanisme b} dan {mekanisme c} (S1; S2).', 'Recent research has emphasised the role of {IV} in facilitating {M}, which, in turn, enhances {DV} through {mekanisme a}, {mekanisme b} and {mekanisme c} (S1; S2).'],
  ['J1', 'Namun begitu, hubungan antara {IV}, {M} dan {DV} dalam {KONTEKS} masih kurang diterokai, khususnya dalam {SUB}.', 'However, the relationship among {IV}, {M} and {DV} in {KONTEKS} remains underexplored, particularly in {SUB}.'],
  ['T1', 'Objektif utama kajian ini ialah meneliti cara {IV} mempengaruhi {M} dan {DV} dalam {KONTEKS}. Secara khusus, kajian ini berusaha menentukan ciri {IV} yang memupuk amalan {M} yang lebih baik, seterusnya meningkatkan {faset DV 1} dan {faset DV 2}.', 'The main objective of this study is to examine how {IV} influences {M} and {DV} in {KONTEKS}. Specifically, the study seeks to determine which features of {IV} foster better {M} practice, thereby enhancing {faset DV 1} and {faset DV 2}.'],
  ['W4', 'Kajian terkini menunjukkan {M} sebagai pemacu utama {keluarga hasil} merentas sektor, khususnya dalam {konteks luas} (S1; S2).', 'Recent studies have shown {M} to be a key driver of {keluarga hasil} across sectors, particularly in {konteks luas} (S1; S2).'],
  ['J2', 'Walau bagaimanapun, kajian tentang kesan langsung {M} terhadap {DV} dalam {KONTEKS} masih terhad.', 'However, research on the direct effects of {M} on {DV} within {KONTEKS} remains limited.'],
  ['J2 positif dahulu', 'Walau bagaimanapun, bukti tersebut diperoleh daripada {latar A} dan {latar B} (S1; S2), manakala kesan langsung {M} terhadap {DV} dalam {KONTEKS} masih terhad.', 'However, this evidence comes from {latar A} and {latar B} (S1; S2), while the direct effects of {M} on {DV} in {KONTEKS} remain largely untested.'],
  ['K-HASIL', '{Pengarang} ({Tahun}) meneliti pengaruh {X} terhadap {Y lain} dalam {latar sempit}, tetapi tidak mengambil kira implikasinya yang lebih luas terhadap {DV}.', '{Pengarang} ({Tahun}) examined how {X} affects {Y lain} in {latar sempit} but did not consider its broader implications for {DV}.'],
  ['K-ULASAN', 'Melalui sorotan sistematik terhadap {n} kajian, {Pengarang} ({Tahun}) merumuskan bahawa penyelidikan {konstruk} berkaitan {keluarga hasil} dalam {KONTEKS} masih memerlukan penerokaan lanjut.', 'In a systematic review of {n} studies, {Pengarang} ({Tahun}) concluded that research on {konstruk} in relation to {keluarga hasil} in {KONTEKS} still requires further exploration.'],
  ['K-KONTEKS', '{Pengarang} ({Tahun}) memberikan tumpuan utama kepada {X} bagi {Y} dalam {latar lain} sahaja, dan bukannya meneliti isu tersebut daripada perspektif {KONTEKS}.', '{Pengarang} ({Tahun}) focused primarily on {X} for {Y} only in {latar lain} rather than examining these issues from the perspective of {KONTEKS}.'],
  ['K-DIGITAL', '{Pengarang} ({Tahun}) tidak meneliti kesannya terhadap {DV}; kajian tersebut sebaliknya meneliti interaksi antara {M umum} dengan {Y lain} dalam {KONTEKS} tanpa menyentuh aspek pendigitalan.', '{Pengarang} ({Tahun}) did not examine the effect on {DV}; instead, they studied the interaction between {M umum} and {Y lain} within {KONTEKS} without addressing digitalisation.'],
  ['R1', 'Oleh itu, kajian sedia ada lebih tertumpu pada hubungan antara {A} dengan {B} dalam {KONTEKS} (S1; S2; S3).', 'Existing studies have thus concentrated on the association between {A} and {B} within {KONTEKS} (S1; S2; S3).'],
  ['R2', 'Sebaliknya, kesan {unsur digital} terhadap {DV} dalam {KONTEKS} masih kurang diberi perhatian.', 'Far less attention has been paid to the effects of {unsur digital} on {DV} in {KONTEKS}.'],
  ['T2', 'Sehubungan itu, kajian ini meneliti secara sistematik pengaruh {M} terhadap {DV} dalam {KONTEKS} bagi memberikan kefahaman yang lebih jelas tentang {fenomena} dalam latar tersebut.', 'Accordingly, the present study systematically examines the influence of {M} on {DV} in {KONTEKS} to offer a clearer understanding of {fenomena} in such settings.'],
  ['K-PERANAN', '{Pengarang} ({Tahun}) meneliti hubungan antara {amalan M} dengan {Y lain} tanpa mengambil kira peranan khusus {IV} dalam proses tersebut.', '{Pengarang} ({Tahun}) investigated the relationship between {amalan M} and {Y lain} without considering the specific role of {IV} within these processes.'],
  ['I', 'Kajian ini mengisi jurang tersebut dengan meneliti ciri khusus {KONTEKS} serta menyiasat cara elemen {IV} membentuk {M} dan, melaluinya, {penunjuk DV}.', 'This study addresses these gaps by examining the distinctive features of {KONTEKS} and by investigating how the elements of {IV} shape {M} and, through it, {penunjuk DV}.'],
  ['SK', 'Kajian ini dipandu oleh soalan berikut: Bagaimanakah {IV} mempengaruhi {M} dalam {KONTEKS}? Bagaimanakah {M} mempengaruhi {DV}? Bagaimanakah {M} mengantara hubungan antara {IV} dengan {DV}?', 'The following research questions guide this study: How does {IV} influence {M} in {KONTEKS}? How does {M} influence {DV}? How does {M} mediate the relationship between {IV} and {DV}?'],
  ['OK', 'Kajian ini mempunyai tiga objektif, iaitu (1) meneliti hubungan antara {IV} dengan {M} dalam {KONTEKS}, (2) menilai kesan {M} terhadap {DV}, dan (3) menguji peranan {M} sebagai perantara.', 'This study pursues three objectives: (1) to examine the relationship between {IV} and {M} in {KONTEKS}, (2) to evaluate the effect of {M} on {DV}, and (3) to test the mediating role of {M}.'],
  ['S', 'Dengan itu, kajian ini menghimpunkan cabang literatur {IV}, {M} dan {DV} yang selama ini terpisah.', 'In doing so, the study brings together separate strands of the literature on {IV}, {M} and {DV}.'],
  ['P', 'Dapatan kajian ini dijangka memberikan panduan praktikal kepada {pemimpin} bagi membangunkan {IV} yang meningkatkan {DV} melalui {M} yang lebih mantap (S1).', 'The findings will provide {pemimpin} with practical guidance for developing {IV} that improves {DV} through stronger {M} (S1).'],
  ['AB2 (abstrak)', 'Kajian ini menyumbang kepada literatur dengan meneliti hubungan saling kait antara {IV}, {M} dan {DV} yang masih kurang dikaji dalam {KONTEKS}.', 'This research adds to existing scholarship by investigating the interrelationship among {IV}, {M} and {DV}, which remains under-researched in {KONTEKS}.']
];

export const PERATURAN = [
  'Kritikan menggunakan sitasi naratif (pengarang sebagai subjek), satu kajian bagi setiap ayat K, dan setiap ayat K bermula dengan pengarang-tahun.',
  'Gunakan "gagal" atau "failed to" hanya jika kajian itu sendiri mendakwa meneliti perkara tersebut; jika tidak, tulis "tidak meneliti" atau "did not examine".',
  'Setiap ayat wilayah (W) membawa dua sumber atau lebih; satu sitasi di hujung perenggan tidak memadai.',
  'Dakwaan jurang J1, J2 dan R2 mesti relatif ("masih terhad", "masih kurang diberi perhatian"), tidak mutlak ("tiada kajian"); sandarkan kepada ulasan atau gunakan bentuk positif dahulu yang menyitasi kajian sebenar.',
  'Ketinggalan disahkan daripada pemboleh ubah dalam abstrak atau kaedah (medan konstruk, objektif, sampel dan peringkat rekod), bukan daripada tajuk.',
  'Sumber tidak melebihi had umur rujukan dalam peraturan gaya; sitasi sekunder hanya apabila sumber asal tidak dapat diperoleh, dan ditanda.',
  'Satu ayat kritikan boleh membawa dua atau tiga ketinggalan (contoh K-KONTEKS+HASIL), tetapi tidak melebihi 45 patah perkataan.',
  'Sifar rekaan: jika sesuatu elemen model tiada kajian yang meninggalkannya, tulis [PERLU SUMBER: kajian yang meninggalkan elemen ini] dan jangan reka kajian.'
];

export const ELAK = [
  'Tujuh ayat dakwaan exemplar tanpa sitasi (W1, W2, W4, J1, J2, R1, R2); exemplar hanya mempunyai lapan sitasi dalam 24 ayat. Baiki: dua sumber bagi setiap W; ulasan atau bentuk positif dahulu bagi J dan R.',
  'Sumber lama (2001, 2017, 2019) dalam artikel 2025. Baiki: patuhi had umur rujukan.',
  'Kritikan tergantung: klausa pertama ayat kritikan terakhir exemplar tidak mempunyai pengarang dan tahun. Baiki: setiap K bermula dengan pengarang-tahun.',
  'R1 exemplar menyatakan jurang terletak pada perkara yang sudah dikaji. Baiki: R1 menyebut yang sudah dikaji, R2 menyebut yang belum dikaji.',
  'Rujukan kabur "this development" dalam J1. Baiki: namakan hubungan itu.',
  'Label konstruk berubah (DKM menjadi KM) dan frasa "these two variables" bagi tiga konstruk. Baiki: label seragam dan bilangan tepat.',
  'Soalan dan objektif exemplar tidak meliputi kesan langsung IV ke DV dan pengantaraan walaupun kedua-duanya dihipotesiskan. Baiki: jajaran satu banding satu termasuk pengantaraan.',
  'Entri rujukan Razzaq et al. (2019) dalam exemplar tidak sepadan dengan huraian dalam teks. Baiki: semak padanan teks dengan entri rujukan bagi setiap kajian yang dikritik.',
  'Nada "failed to address" terhadap kajian yang tidak berniat mengkaji DV. Baiki: "did not examine".'
];

/* Peta rantaian exemplar untuk kalibrasi: [kajian, kod, yang dikaji, yang ditinggalkan] */
export const KALIBRASI = [
  ['Islam et al. (2017)', 'K-HASIL', 'pengurusan pengetahuan dan inovasi perkhidmatan, perpustakaan akademik', 'produktiviti staf universiti'],
  ['Quarchioni et al. (2022)', 'K-ULASAN', 'sorotan pengurusan pengetahuan dalam pengajian tinggi', 'hasil sumber manusia masih perlu diterokai'],
  ['Kianto et al. (2017)', 'K-KONTEKS', 'amalan sumber manusia berasaskan pengetahuan, modal intelek dan inovasi, latar korporat', 'perspektif institusi pengajian tinggi'],
  ['Ibarra-Cisneros et al. (2023)', 'K-DIGITAL', 'pengurusan pengetahuan dan inovasi dalam pengajian tinggi', 'prestasi staf dan pendigitalan'],
  ['Razzaq et al. (2019)', 'K-PERANAN', 'amalan pengurusan pengetahuan dan komitmen organisasi', 'fungsi budaya digital']
];

export const CONTOH = 'Kajian terkini menunjukkan bahawa pengurusan pengetahuan digital organisasi (PPDO) berkait secara positif dengan hasil kerja warga organisasi (Gao et al., 2025; Luthra et al., 2025). Walau bagaimanapun, bukti tersebut diperoleh daripada syarikat berasaskan teknologi dan institusi pengajian tinggi (Gao et al., 2025; Luthra et al., 2025), manakala kesan langsung PPDO terhadap kompetensi digital guru (KDG) di sekolah rendah masih terhad. Luthra et al. (2025) meneliti pengaruh budaya digital terhadap PPDO dan prestasi 364 orang pensyarah di wilayah Delhi/NCR, India, tetapi tidak melibatkan guru sekolah dan tidak menjadikan kompetensi digital sebagai hasil kajian. Gao et al. (2025) pula menguji kesan PPDO terhadap tingkah laku inovatif pekerja dalam 125 buah syarikat berasaskan teknologi di Beijing, dan bukannya dalam organisasi sekolah.\n\nDalam konteks sekolah, Arslan et al. (2025) mendapati perkongsian pengetahuan guru mengantara pengaruh kepimpinan berpusatkan pembelajaran pengetua terhadap amalan inovatif guru di Turki, tetapi kepimpinan itu bukan kepimpinan digital, pengetahuannya tidak diukur sebagai PPDO dan hasilnya bukan kompetensi digital guru. Malah dalam institusi pengajian tinggi, sorotan sistematik Quarchioni et al. (2022) terhadap 121 artikel mendapati penyelidikan pengurusan pengetahuan masih di peringkat awal dan berpecah-pecah. Oleh itu, kajian terkini lebih tertumpu pada hubungan PPDO dengan hasil kerja di luar sekolah, serta pada perkongsian pengetahuan dalam sekolah (Arslan et al., 2025; Gao et al., 2025; Luthra et al., 2025). Sebaliknya, cara PPDO menyalurkan pengaruh kepimpinan digital guru besar kepada KDG masih kurang diberi perhatian. Sehubungan itu, kajian ini meneliti secara sistematik pengaruh PPDO terhadap KDG serta peranannya sebagai perantara antara kepimpinan digital guru besar dengan KDG dalam kalangan guru sekolah rendah di Negeri Perak.';
export const CONTOH_KOD = 'Perenggan 1: W4, J2 (positif dahulu), K-KONTEKS+HASIL, K-KONTEKS+HASIL. Perenggan 2: K-DIGITAL+PERANAN+HASIL, K-ULASAN, R1, R2, T2.';

export const KRITERIA = ['DNA: tiga kitaran jurang, setiap satu ditutup dengan tujuan', 'DNA: rantaian kritikan melalui ketinggalan dan Uji Kesatuan', 'DNA: rumusan sudah dikaji lawan belum dikaji', 'DNA: kesejajaran soalan, objektif dan hipotesis'];

/* ---- tetapan ---- */
export const lalaiAktif = kel => kel === 'kuan' || kel === 'campur';
export function tetapan(t) {
  const x = Object.assign({ mod: 'auto', peringkat: 'Sekolah Rendah', negara: 'Malaysia', paksi: '', perantara: null, matriks: {} }, (t && t.dna) || {});
  x.matriks = x.matriks || {}; return x;
}
export function aktif(t, kel) { const x = tetapan(t); return x.mod === 'aktif' ? true : x.mod === 'tiada' ? false : lalaiAktif(kel); }

/* ---- utiliti teks ---- */
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ');
const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ada = (teks, kata) => { const t = ' ' + norm(teks) + ' '; return kata.map(norm).filter(Boolean).some(k => new RegExp('(^|[^a-z0-9])' + escRe(k) + '([^a-z0-9]|$)').test(t)); };
const RE_NARATIF = /(\p{Lu}[\p{L}'’-]+)(?:\s+et\s+al\.|\s+(?:dan|and|&)\s+\p{Lu}[\p{L}'’-]+)?\s*\(\s*(?:19|20)\d{2}[a-z]?(?:\s*,\s*(?:ms|hlm|p|pp)\.?\s*\d+)?\s*\)/u;
const TINGGAL = ['tanpa', 'tidak mengambil kira', 'tidak meneliti', 'tidak melibatkan', 'tidak menyentuh', 'tidak menguji', 'tidak diukur', 'tidak menjadikan', 'bukannya', 'bukan ', 'sahaja', 'masih', 'kurang', 'memerlukan', 'without', 'did not', 'does not', 'rather than', 'only', 'failed to', 'not ', 'still', 'lack', 'further', 'little'];
const KONTRAS = ['walau bagaimanapun', 'namun begitu', 'meskipun demikian', 'akan tetapi', 'namun', 'sebaliknya', 'however', 'nevertheless', 'nonetheless', 'even so', 'yet'];
const RE_TUJUAN = /\b(kajian ini|artikel ini|penyelidikan ini|this study|this article|this research|the present study|the current study|this investigation)\b/i;
const RE_R1 = /lebih tertumpu|tertumpu pada|banyak tertumpu|memberikan tumpuan|sedia ada lebih|telah meneliti|concentrated on|focused (?:mainly|primarily|largely) on|have (?:largely |mostly )?(?:examined|studied)|existing studies have/i;
const RE_R2 = /kurang diberi perhatian|kurang mendapat perhatian|masih terhad|masih kurang (?:dikaji|diterokai|diteliti|diuji)|belum banyak (?:diuji|dikaji|diteliti)|little attention|less attention|remains? (?:limited|underexplored|under-researched|scarce)|under-?researched|under-?explored|largely untested/i;
const RE_MUTLAK = /\b(?:tiada|belum ada|tidak ada)\s+(?:sebarang\s+|satu pun\s+)?(?:kajian|penyelidikan)\b|\bno\s+(?:prior\s+|previous\s+|empirical\s+)?(?:study|studies|research)\b|has never been (?:studied|examined|investigated)/i;
const RE_PERANTARA = /mengantara|perantara|pengantara|mediat/i;
function pecahAyat(teks) {
  const t = String(teks || '').replace(/\bet al\./g, 'et al․').replace(/\b([A-Z])\.(?=\s|,)/g, '$1․').replace(/\b(ms|hlm|pp?)\./g, '$1․');
  return t.split(/(?<=[.?!])\s+(?=[\p{Lu}"“(\[])/u).map(x => x.replace(/․/g, '.').trim()).filter(x => x.length > 2);
}

/* ---- Kad Model dan Matriks Ketinggalan ---- */
/* Elemen model: konstruk paksi (keluarga yang dikongsi kajian yang dikritik; tidak perlu ditinggalkan), setiap pemboleh ubah,
   konteks (peringkat dan negara) dan pengantaraan (jika model mempunyai perantara). */
const pecahSinonim = teks => { const [nama, ...al] = String(teks || '').split('|'); return [nama.trim()].concat(al.join(',').split(/[,;]/).map(s => s.trim())).filter(Boolean); };
export function elemen(t) {
  const x = tetapan(t); const pv = ((t && t.pemboleh) || []).filter(v => v && v.nama); const out = [];
  const paksi = pecahSinonim(x.paksi); if (paksi.length) out.push({ k: 'paksi', jenis: 'paksi', nama: 'Paksi: ' + paksi[0], kata: paksi });
  pv.forEach((v, i) => out.push({ k: 'v' + i, jenis: 'pv', nama: v.nama, kata: [v.nama].concat(String(v.alias || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)) }));
  if (x.peringkat) out.push({ k: 'peringkat', jenis: 'peringkat', nama: 'Konteks: ' + x.peringkat, nilai: x.peringkat });
  if (String(x.negara || '').trim()) out.push({ k: 'negara', jenis: 'negara', nama: 'Negara: ' + x.negara.trim(), nilai: x.negara.trim() });
  const perantara = x.perantara == null ? pv.length >= 3 : !!x.perantara; if (perantara) out.push({ k: 'perantara', jenis: 'perantara', nama: 'Kesan pengantaraan' });
  return out;
}
/* Nilai automatik satu sel: 'a' dikongsi, 't' ditinggalkan, '?' belum pasti (medan rekod kosong). */
export function selAuto(r, e) {
  r = r || {};
  if (e.jenis === 'pv' || e.jenis === 'paksi') { const teks = [r.tajuk, r.objektif, r.konstruk, r.definisi].filter(Boolean).join(' '); if (!teks.trim()) return '?'; return ada(teks, e.kata) ? 'a' : 't'; }
  if (e.jenis === 'peringkat') { if (!r.peringkat || r.peringkat === 'Pelbagai peringkat') return '?'; return norm(r.peringkat) === norm(e.nilai) ? 'a' : 't'; }
  if (e.jenis === 'negara') { if (!String(r.negara || '').trim()) return '?'; return ada(r.negara, [e.nilai]) ? 'a' : 't'; }
  if (e.jenis === 'perantara') { const j = r.jenisKesan || ''; if (!j || j === 'Tiada') return '?'; return j === 'Perantaraan' || j === 'Kedua-dua' ? 'a' : 't'; }
  return '?';
}
export function matriks(t, sumber) {
  const x = tetapan(t); const el = elemen(t);
  const baris = sumber.map(s => { const pinda = x.matriks[s.id] || {}; const sel = {}; el.forEach(e => { sel[e.k] = pinda[e.k] || selAuto(s.r, e); });
    const kongsi = el.filter(e => sel[e.k] === 'a').length; const tinggal = el.filter(e => e.jenis !== 'paksi' && sel[e.k] === 't').length; const ulasan = ULASAN.has((s.r || {}).jenis);
    return { id: s.id, nama: s.nama, tahun: s.r && s.r.tahun, ulasan, sel, pinda, kongsi, tinggal, layak: !ulasan && kongsi >= 1 && tinggal >= 1 }; });
  return { el, baris };
}
export function ujiKesatuan(mx) {
  const pemilik = mx.el.filter(e => e.jenis !== 'paksi').map(e => ({ e, oleh: mx.baris.filter(b => b.layak && b.sel[e.k] === 't').map(b => b.nama) }));
  const tanpa = pemilik.filter(p => !p.oleh.length).map(p => p.e.nama); const layak = mx.baris.filter(b => b.layak).length; const ulasan = mx.baris.filter(b => b.ulasan).length;
  return { pemilik, tanpa, layak, ulasan, n: pemilik.length, lulus: pemilik.length > 0 && !tanpa.length && layak >= 3 };
}
/* Kitaran nilai apabila sel diklik: auto, kemudian dikongsi, ditinggalkan, belum pasti, dan kembali auto. */
export function kitarSel(t, id, k) {
  t.dna = tetapan(t); const m = t.dna.matriks[id] = Object.assign({}, t.dna.matriks[id] || {}); const urut = [undefined, 'a', 't', '?'];
  const i = urut.indexOf(m[k]); const baru = urut[(i + 1) % urut.length]; if (baru === undefined) delete m[k]; else m[k] = baru; if (!Object.keys(m).length) delete t.dna.matriks[id]; return baru;
}

/* ---- meter DNA jurang ---- */
export function meter(ctx, u) {
  const mx = matriks(ctx.t, ctx.sumber); const uk = ujiKesatuan(mx); const butir = []; const komp = []; const n = u ? u.patah : 0;
  if (!mx.el.length) butir.push('Tetapkan pemboleh ubah (butang Tetapkan di atas Pandu Tulis) dan konteks dalam panel DNA jurang supaya Matriks Ketinggalan dapat dibina.');
  else {
    komp.push(uk.n ? (uk.n - uk.tanpa.length) / uk.n : 0); komp.push(Math.min(1, uk.layak / 4)); komp.push(uk.ulasan ? 1 : 0.5);
    if (uk.tanpa.length) butir.push(`Elemen model yang belum dimiliki mana-mana kritikan dalam Matriks Ketinggalan: ${uk.tanpa.join('; ')}. Cari kajian yang meninggalkan elemen ini, atau tandakan slot [PERLU SUMBER] dalam tulisan.${mx.el.some(e => e.jenis === 'perantara' && uk.tanpa.includes(e.nama)) ? ' Bagi kesan pengantaraan, kritikan yang lazim ialah kajian yang menguji kesan langsung IV ke DV sahaja tanpa perantara (gerakan K-PERANAN).' : ''}`);
    if (uk.layak < 3) butir.push(`Hanya ${uk.layak} artikel sumber empirikal layak dikritik (berkongsi sekurang-kurangnya satu elemen atau konstruk paksi dan meninggalkan sekurang-kurangnya satu elemen); DNA memerlukan tiga hingga lima.${mx.el.some(e => e.jenis === 'paksi') ? '' : ' Isi Konstruk paksi dalam Kad Model supaya kajian sekeluarga (contohnya pengurusan pengetahuan umum) dikira berkongsi.'}`);
    if (!uk.ulasan) butir.push('Tiada ulasan (sorotan sistematik, ulasan skop atau meta-analisis) dalam artikel sumber untuk gerakan K-ULASAN; tambah satu jika ada.');
  }
  const teks = u ? u.teks : ''; let kritik = 0, tanpaPenanda = 0, tujuan = 0; const pembuka = {}; let r1 = false, r2 = false, mutlak = [], soalanMed = null;
  if (n >= 40) {
    const ay = pecahAyat(teks); const ayK = [];
    ay.forEach(s => { const r = norm(s); if (RE_NARATIF.test(s)) { if (TINGGAL.some(w => r.includes(w))) { kritik++; ayK.push(s); } else tanpaPenanda++; }
      for (const kt of KONTRAS) { if (r.startsWith(kt)) { pembuka[kt] = (pembuka[kt] || 0) + 1; break; } }
      if (RE_TUJUAN.test(s)) tujuan++; if (RE_R1.test(s)) r1 = true; if (RE_R2.test(s)) r2 = true; const m = RE_MUTLAK.exec(s); if (m) mutlak.push(m[0]); });
    komp.push(Math.min(1, kritik / 3));
    if (kritik < 3) butir.push(`Ayat kritikan dikesan: ${kritik} (sasaran tiga hingga lima). Setiap ayat kritikan bermula dengan Pengarang (Tahun) dan membawa penanda ketinggalan seperti "tetapi tidak mengambil kira", "tanpa" atau "dan bukannya".`);
    if (tanpaPenanda) butir.push(`${tanpaPenanda} ayat bersitasi naratif tanpa penanda ketinggalan; jadikan ia kritikan (apa yang dikaji, latar, apa yang tertinggal) atau pindahkan ke ayat wilayah dengan sitasi dalam kurungan.`);
    const nPivot = Object.values(pembuka).reduce((s, x) => s + x, 0); const ulang = Object.entries(pembuka).filter(([, x]) => x > 2);
    komp.push(nPivot ? (ulang.length ? 0.6 : 1) : 0);
    if (!nPivot) butir.push('Tiada ayat jurang yang dibuka dengan penanda kontras (Walau bagaimanapun, Namun begitu, Sebaliknya); jurang J1 dan J2 belum jelas.');
    ulang.forEach(([kt, x]) => butir.push(`Penanda kontras "${kt}" membuka ${x} ayat; pelbagaikan supaya satu penanda tidak membuka lebih daripada dua ayat.`));
    komp.push(Math.min(1, tujuan / 3));
    if (tujuan < 3) butir.push(`Ayat tujuan dikesan: ${tujuan}. DNA menutup setiap kitaran dengan tujuan: objektif awal (T1), ayat jambatan (T2) dan ayat pengisian jurang (I).`);
    komp.push((r1 ? 0.5 : 0) + (r2 ? 0.5 : 0));
    if (!r1) butir.push('Rumusan "sudah dikaji" (R1) belum dikesan, contohnya "Oleh itu, kajian sedia ada lebih tertumpu pada ...".');
    if (!r2) butir.push('Rumusan "belum dikaji" (R2) belum dikesan, contohnya "... masih kurang diberi perhatian".');
    komp.push(mutlak.length ? 0 : 1);
    if (mutlak.length) butir.push(`Dakwaan negatif mutlak dikesan ("${mutlak[0]}"); tukar kepada bentuk relatif seperti "masih terhad" atau "masih kurang diberi perhatian".`);
    const elTeks = mx.el.filter(e => e.jenis === 'pv' || e.jenis === 'peringkat');
    if (elTeks.length && ayK.length) { const gab = ayK.join(' '); const belum = elTeks.filter(e => !ada(gab, e.jenis === 'pv' ? e.kata : [e.nilai].concat(KATA_PERINGKAT[e.nilai] || []))); komp.push((elTeks.length - belum.length) / elTeks.length);
      if (belum.length) butir.push(`Elemen yang belum disebut dalam mana-mana ayat kritikan: ${belum.map(e => e.nama).join('; ')}. Prinsip pemetaan memerlukan setiap elemen ditinggalkan oleh sekurang-kurangnya satu kajian yang dikritik.`); }
    if (mx.el.some(e => e.jenis === 'perantara') && ay.some(s => /\?\s*$/.test(s) || /\bobjektif\b|\bobjectives?\b/i.test(s))) { soalanMed = ay.some(s => (/\?\s*$/.test(s) || /\bobjektif\b|\bobjectives?\b/i.test(s)) && RE_PERANTARA.test(s)); if (!soalanMed) { komp.push(0.5); butir.push('Model mempunyai perantara tetapi soalan atau objektif pengantaraan belum dikesan; jajarkan SK, OK dan hipotesis satu banding satu.'); } }
  }
  const nilai = komp.length ? Math.round(100 * komp.reduce((s, x) => s + x, 0) / komp.length) : 0;
  const status = n < 40 ? 'info' : (kritik < 2 || (mx.el.length && uk.tanpa.length > mx.el.length / 2)) ? 'gagal' : butir.length ? 'amaran' : 'ok';
  const ringkas = [uk.n ? `Uji Kesatuan ${uk.n - uk.tanpa.length}/${uk.n} elemen` : 'model belum ditetapkan'];
  if (n >= 40) ringkas.push(`${kritik} kritikan`, `${tujuan} ayat tujuan`);
  return { k: 'dna', nama: 'DNA jurang', nilai: n < 40 ? Math.max(0, nilai) : nilai, status, teks: ringkas.join(' · '), butir, anggaran: true };
}

/* ---- teks untuk agen ---- */
export function teksAgen(ctx) {
  const mx = matriks(ctx.t, ctx.sumber); const uk = ujiKesatuan(mx); const en = ctx.en; const kodLabel = { a: 'dikongsi', t: 'ditinggalkan', '?': 'belum pasti' };
  return `\n\nDNA PERNYATAAN MASALAH (acuan jurang ${PENDEK}; aktif bagi folder ini)
Bagi folder Pendahuluan, DNA ini mengatasi peta perenggan acuan artikel contoh bagi urutan latar, jurang dan tujuan. Kekalkan sasaran panjang folder dan jadikan perenggan sumbangan acuan sebagai koda (kod P). Tiru seni bina dan fungsi ayat; jangan salin ayat exemplar dan jangan sitasi exemplar kecuali ia juga artikel sumber.
PRINSIP:
${PRINSIP.map((p, i) => `${i + 1}. ${p[0]}: ${p[1]}`).join('\n')}
SENI BINA BERKOD (urutan wajib): Kitaran 1: W1, W2, W3, J1, T1. Kitaran 2: W4, J2, kemudian tiga hingga lima ayat K mengikut arah DV dahulu (K-HASIL, K-ULASAN selepas kritikan pertama atau sebagai penutup rantaian, K-KONTEKS, K-DIGITAL), R1, R2, T2. Kitaran 3: K-PERANAN, I, kemudian SK, OK dan S (artikel). Koda: P, dan O jika perlu. Bagi Bahasa Melayu, lima perenggan: (1) W1 W2 W3 J1 T1; (2) W4 J2 dan dua K; (3) baki K, R1, R2, T2; (4) K-PERANAN, I, SK, OK, S; (5) P. Ayat berfungsi jurang kira-kira 35 hingga 50 peratus daripada semua ayat.
FORMULA AYAT (${en ? 'Bahasa Inggeris' : 'Bahasa Melayu'}; slot dalam kurungan kerinting diisi dengan fakta dan sumber sebenar):
${FORMULA.map(f => `- ${f[0]}: ${en ? f[2] : f[1]}`).join('\n')}
PERATURAN SITASI DAN INTEGRITI:
${PERATURAN.map(p => '- ' + p).join('\n')}
JANGAN TIRU KELEMAHAN EXEMPLAR:
${ELAK.map(p => '- ' + p).join('\n')}
KAD MODEL (elemen yang mesti dimiliki oleh sekurang-kurangnya satu kritikan): ${mx.el.filter(e => e.jenis !== 'paksi').map(e => e.nama).join('; ') || 'belum ditetapkan'}${mx.el.some(e => e.jenis === 'paksi') ? `\nKONSTRUK PAKSI (keluarga yang dikongsi semua kajian yang dikritik; bukan elemen untuk ditinggalkan): ${mx.el.find(e => e.jenis === 'paksi').kata.join(', ')}` : ''}
MATRIKS KETINGGALAN (diisi automatik daripada medan rekod, kemudian disemak Prof Dr; sel yang dipinda Prof Dr ditanda *):
${mx.baris.length ? mx.baris.map(b => `- ${b.nama}${b.ulasan ? ' [ulasan untuk K-ULASAN]' : b.layak ? '' : ' [tidak layak dikritik]'}: ${mx.el.map(e => `${e.nama} ${e.jenis === 'paksi' ? ({ a: 'sekeluarga', t: 'di luar keluarga paksi' }[b.sel[e.k]] || 'belum pasti') : (kodLabel[b.sel[e.k]] || 'belum pasti')}${b.pinda[e.k] ? '*' : ''}`).join(', ')}`).join('\n') : '- tiada artikel sumber'}
UJI KESATUAN: ${uk.lulus ? 'lulus' : 'belum lulus'}; ${uk.layak} kajian layak dikritik; ${uk.ulasan} ulasan${uk.tanpa.length ? '; elemen tanpa pemilik: ' + uk.tanpa.join('; ') : ''}.
ARAHAN DNA: Bina rantaian K hanya daripada sel "ditinggalkan" yang disokong medan rekod artikel itu (konstruk, objektif, sampel, peringkat, negara, kesan yang diuji); semak semula setiap ketinggalan terhadap medan sebelum menulisnya. Sel "belum pasti" tidak boleh dijadikan dakwaan ketinggalan. Jika sesuatu elemen tiada pemilik, tulis [PERLU SUMBER: kajian yang meninggalkan elemen ini] dan nyatakannya dalam keputusan untuk Prof Dr.`;
}
export const arahanBincang = () => 'ARAHAN DNA BAGI RANGKA: namakan setiap baris rangka dengan kod DNA (contohnya "J2", "K-HASIL", "R1", "T2") mengikut urutan seni bina berkod; bagi setiap baris K, nyatakan kajian, apa yang dikaji, latar dan elemen yang ditinggalkannya berdasarkan Matriks Ketinggalan. Dalam amaran, sebut elemen model yang belum ada pemilik dan dakwaan negatif yang perlu disandarkan.';
export const arahanCadangan = en => `ARAHAN DNA BAGI CADANGAN: label fungsi setiap perenggan menyenaraikan kod DNA ayat-ayatnya mengikut urutan, contohnya [Kitaran 2: W4 J2 K-HASIL K-KONTEKS]. Selepas perenggan ${en ? 'DECISIONS FOR PROF DR' : 'KEPUTUSAN UNTUK PROF DR'}, tulis satu perenggan pendek bermula "${en ? 'UNION TEST' : 'UJI KESATUAN'}:" yang memadankan setiap elemen model dengan kajian yang memilikinya, dan satu perenggan bermula "${en ? 'HONEST NOTE' : 'NOTA JUJUR'}:" yang menyenaraikan setiap dakwaan negatif relatif berserta skopnya, setiap sitasi sekunder dan setiap penanda [PERLU SUMBER: ...].`;
export const arahanSemak = () => 'ARAHAN DNA BAGI SEMAKAN: nilai juga sama ada tiga kitaran wujud dan setiap satu ditutup dengan tujuan; setiap ayat kritikan bermula dengan pengarang-tahun dan membawa penanda ketinggalan; rantaian mengikut arah DV dahulu; R1 menyebut yang sudah dikaji dan R2 yang belum dikaji; tiada dakwaan negatif mutlak; setiap elemen model dimiliki sekurang-kurangnya satu kritikan; serta soalan, objektif dan hipotesis sejajar satu banding satu termasuk pengantaraan.';

/* ---- paparan panel J dalam folder Pendahuluan ---- */
export function ringkasan(ctx) {
  const on = aktif(ctx.t, ctx.kel); const mx = matriks(ctx.t, ctx.sumber); const uk = ujiKesatuan(mx);
  return on ? `aktif · Uji Kesatuan ${uk.lulus ? 'lulus' : 'belum lulus'} (${uk.n - uk.tanpa.length}/${uk.n} elemen, ${uk.layak} kajian layak)` : 'tidak aktif';
}
export function html(ctx) {
  const esc = ctx.esc; const x = tetapan(ctx.t); const on = aktif(ctx.t, ctx.kel); const en = ctx.en;
  const pilihMod = `<label class="pd-dna-mod">DNA jurang <select data-pdsel="dnamod"><option value="auto"${x.mod === 'auto' ? ' selected' : ''}>Automatik (aktif bagi empirikal kuantitatif dan kaedah campuran)</option><option value="aktif"${x.mod === 'aktif' ? ' selected' : ''}>Aktif</option><option value="tiada"${x.mod === 'tiada' ? ' selected' : ''}>Tidak aktif</option></select></label>`;
  const kepala = `<div class="pd-ai-kepala"><p class="pd-ai-ruj">${esc(RUJUKAN)} <a href="${esc(DOI)}" target="_blank" rel="noopener">Buka artikel</a></p>
    <p><b>Apa ini.</b> Seni bina jurang kajian yang dikod daripada Pengenalan ${esc(PENDEK)} (24 ayat, 685 patah, tiga perenggan): jurang dibina berperingkat dalam tiga kitaran, setiap kitaran ditutup dengan tujuan, dan setiap kajian lepas dikritik kerana meninggalkan satu elemen model kajian Prof Dr. Seni bina diambil daripada exemplar; peraturan sitasi dan integriti diambil daripada Prof Dr. Apabila aktif, agen menulis, membincang dan menyemak folder ini mengikut DNA, dan meter <b>DNA jurang</b> ditambah dalam Langkah 5.</p>
    <div class="pd-acts">${pilihMod}</div></div>`;
  if (!on) return kepala + '<p class="help">DNA jurang tidak aktif bagi artikel ini. Pilih Aktif untuk menggunakannya, contohnya bagi Bab 1 tesis atau artikel empirikal jenis lain.</p>';
  const mx = matriks(ctx.t, ctx.sumber); const uk = ujiKesatuan(mx); const lbl = { a: 'Ada', t: 'Tiada', '?': '?' };
  const kad = `<div class="pd-dna-kad"><b>Kad Model</b><div class="tul-jd-form"><label>Peringkat konteks <select data-pdsel="dnaperingkat"><option value="">Tidak dinyatakan</option>${PERINGKAT.map(p => `<option${x.peringkat === p ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></label><label>Negara <input type="text" data-pdin="dnanegara" value="${esc(x.negara || '')}" placeholder="contoh: Malaysia"></label><label>Konstruk paksi <input type="text" data-pdin="dnapaksi" value="${esc(x.paksi || '')}" placeholder="Pengurusan pengetahuan | knowledge management, perkongsian pengetahuan" size="42"></label><label class="tul-cb"><input type="checkbox" data-pdsel="dnaperantara"${(x.perantara == null ? ((ctx.t.pemboleh || []).filter(v => v.nama).length >= 3) : x.perantara) ? ' checked' : ''}> Model mempunyai perantara</label></div>
    <p class="help">Elemen: ${mx.el.length ? mx.el.map(e => `<span class="tag"><span>${esc(e.nama)}</span></span>`).join(' ') : 'tetapkan pemboleh ubah dahulu (butang Tetapkan di atas Pandu Tulis).'} Konstruk paksi ialah keluarga konstruk yang dikongsi semua kajian yang dikritik (dalam exemplar: pengurusan pengetahuan); ia menjadikan kajian sekeluarga layak dikritik tetapi tidak perlu ditinggalkan. Tulis nama, kemudian tanda | dan sinonim dipisahkan koma.</p></div>`;
  const jadual = mx.baris.length && mx.el.length ? `<div class="pd-ac-gulung"><table class="pd-ac-jadual pd-dna-mx"><thead><tr><th>Artikel sumber</th>${mx.el.map(e => `<th>${esc(e.nama)}</th>`).join('')}<th>Status</th></tr></thead><tbody>${mx.baris.map(b => `<tr><th>${esc(b.nama)}${b.ulasan ? ' <small>ulasan</small>' : ''}</th>${mx.el.map(e => { const v = b.sel[e.k]; const p = b.pinda[e.k]; return `<td><button type="button" class="pd-dna-sel ${v === 'a' ? 'a' : v === 't' ? 't' : 'q'}${p ? ' pinda' : ''}" data-pd="dnasel" data-id="${esc(b.id)}" data-el="${esc(e.k)}" title="${p ? 'Dipinda Prof Dr' : 'Anggaran automatik daripada medan rekod'}; klik untuk menukar">${lbl[v] || '?'}${p ? '*' : ''}</button></td>`; }).join('')}<td>${b.ulasan ? '<span class="tag ok"><span>ulasan untuk K-ULASAN</span></span>' : b.layak ? '<span class="tag ok"><span>layak dikritik</span></span>' : '<span class="tag"><span>tidak layak</span></span>'}</td></tr>`).join('')}</tbody></table></div>
    <p class="help"><b>Ada</b>: elemen dikongsi dengan model Prof Dr. <b>Tiada</b>: elemen ditinggalkan, iaitu bahan ayat kritikan. <b>?</b>: medan rekod belum cukup. Nilai awal dianggar tanpa agen daripada medan tajuk, objektif, konstruk, peringkat, negara dan kesan yang diuji; klik sel untuk meminda (tanda * bermaksud dipinda), dan klik sehingga kembali kepada anggaran automatik. Sahkan setiap Tiada terhadap abstrak atau kaedah artikel sebelum ditulis sebagai kritikan.</p>
    <div class="pd-acts"><button class="btn btn-sm" data-pd="dnaauto">Kembalikan semua sel kepada anggaran automatik</button></div>` : '<p class="help">Matriks Ketinggalan muncul selepas artikel sumber dipilih dan pemboleh ubah ditetapkan.</p>';
  const uji = `<div class="pd-dna-uji ${uk.lulus ? 'ok' : 'amaran'}"><b>Uji Kesatuan: ${uk.lulus ? 'lulus' : 'belum lulus'}</b><ul>${uk.pemilik.map(p => `<li class="${p.oleh.length ? 'ok' : 'amaran'}">${esc(p.e.nama)}: ${p.oleh.length ? 'ditinggalkan oleh ' + esc(p.oleh.join('; ')) : 'belum ada kajian yang meninggalkannya'}</li>`).join('')}<li class="${uk.layak >= 3 ? 'ok' : 'amaran'}">${uk.layak} kajian layak dikritik (sasaran tiga hingga lima)</li><li class="${uk.ulasan ? 'ok' : 'amaran'}">${uk.ulasan ? uk.ulasan + ' ulasan untuk K-ULASAN' : 'tiada ulasan untuk K-ULASAN'}</li></ul><p class="help">Lulus apabila setiap elemen model ditinggalkan oleh sekurang-kurangnya satu kajian yang layak dikritik, dan sekurang-kurangnya tiga kajian layak. Inilah pengawal "Pendahuluan tidak mencerminkan semua pemboleh ubah".</p></div>`;
  const prinsip = `<details class="pd-ac-pola"><summary>Enam prinsip DNA dan sebabnya</summary><ol class="pd-dna-ol">${PRINSIP.map(p => `<li><b>${esc(p[0])}.</b> ${esc(p[1])}</li>`).join('')}</ol></details>`;
  const seni = `<details class="pd-ac-pola"><summary>Seni bina berkod (18 kod)</summary><div class="pd-ac-gulung"><table class="pd-ac-jadual"><thead><tr><th>Kitaran</th><th>Kod</th><th>Fungsi</th><th>Sitasi</th></tr></thead><tbody>${KOD.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div><p class="help">Susunan rantaian K: K-HASIL dahulu, K-ULASAN selepas kritikan pertama atau sebagai penutup dengan "Malah", kemudian K-KONTEKS, dan K-DIGITAL terakhir sebelum R1. K-PERANAN sentiasa dalam Kitaran 3. Bagi Bahasa Melayu, gunakan lima perenggan dengan tiga hingga enam ayat setiap satu.</p></details>`;
  const formula = `<details class="pd-ac-pola"><summary>Formula ayat ${en ? 'Bahasa Inggeris dan Bahasa Melayu' : 'Bahasa Melayu dan Bahasa Inggeris'}</summary><div class="pd-ac-gulung"><table class="pd-ac-jadual"><thead><tr><th>Kod</th><th>${en ? 'Bahasa Inggeris' : 'Bahasa Melayu'}</th><th>${en ? 'Bahasa Melayu' : 'Bahasa Inggeris'}</th></tr></thead><tbody>${FORMULA.map(f => `<tr><td><b>${esc(f[0])}</b></td><td>${esc(en ? f[2] : f[1])}</td><td>${esc(en ? f[1] : f[2])}</td></tr>`).join('')}</tbody></table></div><p class="help">Formula ialah rangka; isi slot dengan fakta dan sumber yang disahkan. Pelbagaikan penanda kontras supaya satu penanda tidak membuka lebih daripada dua ayat.</p></details>`;
  const peraturan = `<details class="pd-ac-pola"><summary>Peraturan sitasi dan kelemahan exemplar yang tidak boleh ditiru</summary><div class="pd-ai-grid"><div><b>Peraturan sitasi dan integriti</b><ul>${PERATURAN.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><div class="elak"><b>Jangan tiru</b><ul>${ELAK.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div><p class="help">Ketelitian apabila memetik dapatan ${esc(PENDEK)}: pekali beta tidak tekal antara abstrak, Jadual 6 dan perbincangan; Jadual 3 melaporkan AVE .177 dan CR .692 bagi prestasi staf walaupun teks mendakwa semua ambang dipenuhi. Petik arah hubungan sahaja, atau laporkan percanggahan itu.</p></details>`;
  const kalib = `<details class="pd-ac-pola"><summary>Kalibrasi: peta rantaian exemplar dan contoh Kitaran 2</summary><div class="pd-ac-gulung"><table class="pd-ac-jadual"><thead><tr><th>Kajian dikritik</th><th>Kod</th><th>Yang dikaji</th><th>Yang ditinggalkan</th></tr></thead><tbody>${KALIBRASI.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div><p class="help">Kesatuan ketinggalan exemplar: prestasi staf, konteks institusi pengajian tinggi, pendigitalan dan budaya digital, iaitu model exemplar sendiri.</p><div class="pd-teks pd-dna-contoh">${CONTOH.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}<p><b>Peta Kod:</b> ${esc(CONTOH_KOD)}</p></div><p class="help">Contoh kalibrasi bagi tesis Prof Dr (sumber disemak 11 November 2026). Jangan disalin bulat-bulat; sahkan semula sebelum digunakan.</p></details>`;
  return kepala + kad + jadual + uji + prinsip + seni + formula + peraturan + kalib;
}
