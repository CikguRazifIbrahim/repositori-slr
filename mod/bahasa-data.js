/* Piawaian Bahasa Melayu Malaysia akademik (v1.31.0): satu sumber bagi semua agen dan bagi pengesan istilah tanpa token.

   Mengapa fail ini wujud. Bagi model keluarga 5.5 (Sonnet, Opus, Haiku), dokumentasi API meminta Temperature, Top-K dan Top-P ditinggalkan;
   Sonnet 5.5 dan Opus 5.5 menolak permintaan yang menetapkannya dengan ralat 400. Bahasa keluaran model hanya dapat dikawal melalui
   arahan. Maka arahan bahasa setiap agen kini datang dari sini, dan teks yang dijana disemak sekali lagi oleh Agen Bahasa (mod/bahasa.js).

   Sumber istilah. ISTILAH ialah senarai istilah metodologi kuantitatif Prof Dr (lajur Bahasa Melayu ialah istilah yang wajib digunakan),
   ditambah kumpulan Teori kepimpinan yang mengikut istilah dalam proposal beliau.
   GLOSARI ialah senarai pengesan: bentuk Indonesia yang lazim terbawa masuk, bentuk yang tidak selaras dengan senarai istilah Prof Dr,
   perkataan yang beliau larang, dan kesan terjemahan. Pengesan hanya menanda; ia tidak menukar teks. */

/* [kumpulan, [[Inggeris, Bahasa Melayu yang wajib], ...]] */
export const ISTILAH = [
  ['Reka bentuk kajian', [['research design', 'reka bentuk kajian'], ['cross-sectional', 'keratan rentas'], ['longitudinal', 'longitud atau kajian merentas masa'], ['survey', 'tinjauan'], ['explanatory sequential design', 'reka bentuk berurutan penerangan'], ['mixed methods', 'kaedah campuran'], ['deductive, inductive', 'deduktif, induktif'], ['post-positivism', 'pasca positivisme'], ['unit of analysis', 'unit analisis']]],
  ['Populasi dan persampelan', [['population', 'populasi'], ['sample, sampling', 'sampel, persampelan'], ['sampling frame', 'rangka persampelan'], ['multi-stage sampling', 'persampelan pelbagai peringkat'], ['stratified random sampling', 'persampelan rawak berstrata'], ['systematic random sampling', 'persampelan rawak sistematik'], ['simple random sampling without replacement', 'persampelan rawak mudah tanpa penggantian'], ['purposive sampling', 'persampelan bertujuan'], ['response rate', 'kadar pulangan'], ['usable responses', 'set boleh guna'], ['attrition', 'kadar susut']]],
  ['Pemboleh ubah', [['independent variable', 'pemboleh ubah bebas atau pemboleh ubah tidak bersandar'], ['dependent variable', 'pemboleh ubah bersandar'], ['mediator, mediating variable', 'pengantara atau pemboleh ubah perantara'], ['moderator', 'penyederhana'], ['control variable', 'pemboleh ubah kawalan'], ['exogenous, endogenous', 'eksogenus, endogenus'], ['construct', 'konstruk'], ['dimension', 'dimensi'], ['indicator', 'petunjuk atau indikator'], ['item', 'item']]],
  ['Instrumen', [['questionnaire', 'soal selidik'], ['instrument', 'instrumen'], ['scale', 'skala'], ['Likert scale', 'skala Likert'], ['interval scale', 'skala interval'], ['anchor label', 'label hujung skala'], ['item stem', 'batang soalan'], ['response option', 'pilihan jawapan'], ['forward translation', 'terjemahan hadapan'], ['back translation', 'terjemahan balik'], ['adaptation', 'penyesuaian atau adaptasi'], ['pilot study', 'kajian rintis'], ['pre-test', 'pra ujian'], ['self-administered', 'ditadbir sendiri']]],
  ['Kesahan dan kebolehpercayaan', [['validity', 'kesahan'], ['reliability', 'kebolehpercayaan'], ['content validity', 'kesahan kandungan'], ['face validity', 'kesahan muka'], ['construct validity', 'kesahan konstruk'], ['convergent validity', 'kesahan menumpu'], ['discriminant validity', 'kesahan mencapah'], ['criterion validity', 'kesahan kriteria'], ['Content Validity Ratio (CVR)', 'Nisbah Kesahan Kandungan'], ['Content Validity Index (CVI)', 'Indeks Kesahan Kandungan'], ['critical value', 'nilai kritikal'], ['cut-off value', 'nilai potong'], ['threshold', 'nilai ambang'], ['internal consistency', 'ketekalan dalaman'], ["Cronbach's alpha", 'Cronbach Alpha atau nilai alpha'], ['composite reliability (CR)', 'kebolehpercayaan komposit'], ['average variance extracted (AVE)', 'purata varians diekstrak'], ['corrected item-total correlation', 'korelasi item dengan jumlah terbetul'], ['inter-item correlation', 'korelasi antara item'], ['item clarity', 'kejelasan item']]],
  ['Analisis faktor', [['exploratory factor analysis (EFA)', 'analisis faktor penerokaan'], ['confirmatory factor analysis (CFA)', 'analisis faktor pengesahan'], ['second-order CFA', 'analisis faktor pengesahan aras kedua'], ['principal component analysis', 'analisis komponen utama'], ['maximum likelihood', 'kemungkinan maksimum'], ['Varimax, Promax rotation', 'putaran Varimax, putaran Promax'], ['orthogonal, oblique', 'ortogon, serong'], ['factor loading', 'muatan faktor'], ['cross-loading', 'muatan silang'], ['communality', 'komunaliti'], ['eigenvalue', 'nilai eigen'], ['variance explained', 'varians diterangkan atau varians dijelaskan'], ['Kaiser-Meyer-Olkin (KMO)', 'nilai KMO'], ["Bartlett's test of sphericity", 'ujian kesferaan Bartlett'], ['scree plot', 'plot skri'], ['modification index', 'indeks pengubahsuaian'], ['item redundancy, overlap', 'pertindihan item']]],
  ['Analisis inferensi', [['descriptive statistics', 'statistik deskriptif'], ['inferential statistics', 'statistik inferensi'], ['mean, standard deviation', 'min, sisihan piawai'], ['skewness, kurtosis', 'kepencongan, kurtosis'], ['outlier', 'data terpencil atau pencilan'], ['Mahalanobis distance', 'jarak Mahalanobis'], ['normality', 'normaliti'], ['multicollinearity', 'multikolineariti'], ['correlation', 'korelasi'], ['multiple regression', 'regresi berganda'], ['hierarchical multiple regression', 'regresi berganda berhierarki'], ['stepwise regression', 'regresi mengikut langkah'], ['structural equation modeling (SEM)', 'pemodelan persamaan berstruktur'], ['path analysis', 'analisis laluan'], ['standardised path coefficient', 'pekali laluan piawai'], ['critical ratio', 'nisbah kritikal'], ['measurement model', 'model pengukuran'], ['structural model', 'model struktur'], ['model fit indices', 'indeks kesepadanan model'], ['relative chi-square', 'khi kuasa dua relatif'], ['statistical power', 'kuasa statistik'], ['effect size', 'saiz kesan'], ['significance level', 'aras signifikan'], ['confidence interval', 'selang keyakinan']]],
  ['Pengantaraan', [['mediation', 'pengantaraan'], ['full mediation', 'pengantaraan penuh'], ['partial mediation', 'pengantaraan separa'], ['complementary mediation', 'pengantaraan pelengkap'], ['competitive mediation', 'pengantaraan bersaing'], ['indirect-only mediation', 'pengantaraan tidak langsung sahaja'], ['direct effect', 'kesan langsung'], ['indirect effect', 'kesan tidak langsung'], ['total effect', 'kesan jumlah'], ['causal step approach', 'pendekatan langkah sebab akibat'], ['bootstrapping', 'bootstrapping atau persampelan semula'], ['bias-corrected bootstrapping', 'bootstrapping terbetul bias'], ['bootstrap samples', 'sampel bootstrap'], ['Sobel test', 'ujian Sobel'], ['common method bias', 'bias kaedah sepunya'], ['Harman single-factor test', 'ujian faktor tunggal Harman']]],
  ['Teori kepimpinan', [['transformational leadership', 'kepimpinan transformasi'], ['transactional leadership', 'kepimpinan transaksi'], ['idealized influence', 'pengaruh ideal'], ['inspirational motivation', 'motivasi berinspirasi'], ['intellectual stimulation', 'rangsangan intelektual'], ['individualized consideration', 'pertimbangan individu'], ['authentic leadership', 'kepimpinan autentik'], ['self-awareness', 'kesedaran kendiri'], ['relational transparency', 'ketelusan hubungan'], ['internalized moral perspective', 'perspektif moral yang dihayati'], ['balanced processing', 'pemprosesan seimbang']]],
  ['Etika dan prosedur', [['informed consent', 'persetujuan termaklum'], ['ethics approval', 'kelulusan etika'], ['anonymity, confidentiality', 'kerahsiaan identiti, kerahsiaan maklumat'], ['data collection procedure', 'prosedur pengumpulan data'], ['data screening', 'penapisan data'], ['missing data', 'data hilang']]]
];
const teksIstilah = kumpulan => ISTILAH.filter(([n]) => !kumpulan || kumpulan.includes(n)).map(([n, s]) => n + ': ' + s.map(([en, bm]) => en + ' = ' + bm).join('; ') + '.').join('\n');

const P1 = 'Bahasa Melayu Malaysia baku, laras tesis PhD dan jurnal berindeks; ejaan dan istilah mengikut Dewan Bahasa dan Pustaka. Jangan gunakan bentuk Indonesia. Tulis kajian (bukan penelitian), pengkaji atau penyelidik (bukan peneliti), dapatan (bukan temuan), soal selidik (bukan kuesioner atau angket), pemboleh ubah, dua perkataan (bukan variabel atau pembolehubah), kesahan (bukan validitas), kebolehpercayaan (bukan reliabilitas), pekali (bukan koefisien), guru besar bagi sekolah rendah dan pengetua bagi sekolah menengah (bukan kepala sekolah; pemimpin sekolah jika peringkat tidak dinyatakan), pensyarah (bukan dosen), murid atau pelajar (bukan siswa), universiti, fakulti, kualiti, aktiviti (bukan universitas, fakultas, kualitas, aktivitas), keberkesanan (bukan efektivitas), pengurusan (bukan manajemen), kepimpinan (bukan kepemimpinan), maklumat (bukan informasi), temu bual (bukan wawancara), pemerhatian (bukan observasi), penilaian (bukan evaluasi), pelaksanaan (bukan implementasi), prestasi (bukan kinerja), cabaran (bukan tantangan), kesan (bukan dampak atau efek), dasar (bukan kebijakan), kerajaan (bukan pemerintah), latihan (bukan pelatihan), pembangunan profesional (bukan pengembangan profesional), efikasi kendiri dan laporan kendiri (bukan efikasi diri, laporan diri), peratus dan peratusan (bukan persen, persentase), purata atau min (bukan rata-rata), sisihan piawai (bukan simpangan baku atau standar deviasi), kajian rintis (bukan uji coba atau ujian rintis), sekolah rendah (bukan sekolah dasar), institusi pengajian tinggi (bukan perguruan tinggi), peringkat (bukan jenjang), dalam talian (bukan daring), lelaki (bukan pria atau laki-laki), bandar dan luar bandar (bukan perkotaan, pedesaan), kerana, iaitu, berbeza (bukan karena, yaitu, berbeda), analisis, risiko, hipotesis, subjek, objek, amalan atau praktik, kaedah (bukan analisa, resiko, hipotesa, subyek, obyek, praktek, metode). Nama khas (institusi, program, dokumen dasar, jurnal, instrumen, teori) dikekalkan dalam bentuk asalnya.';
const P3 = 'Pilihan istilah Prof Dr yang kerap tersasar: kadar pulangan (bukan kadar respons); taburan sampel atau taburan responden (bukan komposisi sampel); pengantaraan bagi mediation (bukan perantaraan atau mediasi), dan pengantara atau pemboleh ubah perantara bagi mediator; penyederhana bagi moderator; kesahan menumpu dan kesahan mencapah (bukan kesahan konvergen, kesahan diskriminan); Cronbach Alpha atau nilai alpha (bukan alfa Cronbach); indeks kesepadanan model (bukan indeks padanan); rangka persampelan (bukan kerangka persampelan); purata varians diekstrak; kebolehpercayaan komposit; bootstrapping terbetul bias; kepimpinan transformasi dan kepimpinan transaksi (bukan transformasional, transaksional); himpunan rekod atau pangkalan literatur (bukan korpus).';
const P4 = 'Buang kesan terjemahan: "di mana" sebagai kata hubung (guna yang, iaitu, bagi, atau pecahkan ayat); "adalah" sebelum kata adjektif (tulis "Instrumen ini sah"); "ianya" (guna ia); "berdasarkan kepada" (guna berdasarkan); "oleh kerana" (guna oleh sebab); "di kalangan" (guna dalam kalangan); "selain daripada itu" (guna selain itu); "ke atas" bagi sasaran kesan atau pengaruh (guna terhadap); "merujuk kepada" yang berulang (selang-selikan dengan iaitu atau bermaksud).';
const P5 = 'Larangan: sempang em dan sempang en (guna koma, titik bertindih atau perkataan "hingga"); perkataan lewah, sauh, jangkar, parsimoni, dikotomi, songsang, artikulasi, epistemologi, ontologi, lakuran, meleburkan, substantif, kontingen, holistik, mengkonseptualisasikan, mengoperasionalisasikan dan bentuk terbitannya (guna berjela, sandaran, ringkas, pembahagian dua, terbalik, menyatakan, cara pengetahuan dibina, gabungan, penting, bergantung kepada keadaan, menyeluruh, mentakrifkan, menetapkan cara mengukur); frasa pembuka kosong seperti "Adalah penting untuk diperhatikan bahawa", "Tidak dapat dinafikan bahawa", "Dalam era globalisasi" dan "Secara keseluruhannya dapat dirumuskan bahawa".';
const P6 = 'Gaya: ayat aktif lebih kerap daripada ayat pasif; satu ayat satu idea utama; panjang ayat berbeza-beza; tiada kata sifat yang tidak menambah maklumat; kenyataan yang jelas apabila bukti menyokongnya. Istilah Inggeris yang tiada padanan ditulis sekali dalam kurungan selepas istilah Melayu. Singkatan antarabangsa (EFA, CFA, SEM, CR, AVE, KMO, CVI, HTMT, VIF) dan nama ujian daripada nama orang (Bartlett, Cronbach, Harman, Mahalanobis, Sobel) dikekalkan. Nama instrumen dan teori asing tidak diterjemah.';

/* Blok penuh: agen isian (terjemahan daripada artikel) dan Agen Bahasa. */
export const PIAWAI_PENUH = `PIAWAIAN BAHASA (wajib bagi setiap teks Bahasa Melayu yang anda tulis):
1. ${P1}
2. Istilah metodologi yang wajib, mengikut senarai istilah Prof Dr (Inggeris = Bahasa Melayu):
${teksIstilah()}
3. ${P3}
4. ${P4}
5. ${P5}
6. ${P6}`;
/* Blok ringkas: agen lain yang menulis daripada medan rekod (Banding, soal jawab Artikel, Pandu Tulis, Sintesis, Tajuk). */
export const PIAWAI_RINGKAS = `PIAWAIAN BAHASA (wajib bagi setiap teks Bahasa Melayu yang anda tulis; tidak terpakai pada teks Bahasa Inggeris):
1. ${P1}
2. Istilah metodologi mengikut senarai istilah Prof Dr (Inggeris = Bahasa Melayu):
${teksIstilah(['Populasi dan persampelan', 'Pemboleh ubah', 'Kesahan dan kebolehpercayaan', 'Pengantaraan', 'Teori kepimpinan'])}
Juga: model fit indices = indeks kesepadanan model; factor loading = muatan faktor; structural equation modeling = pemodelan persamaan berstruktur; path coefficient = pekali laluan; effect size = saiz kesan; confidence interval = selang keyakinan; pilot study = kajian rintis; cross-sectional = keratan rentas; survey = tinjauan.
3. ${P3}
4. ${P4}
5. ${P5}`;

/* ---- pengesan istilah (tanpa token) ---- */
export const JENIS_NAMA = { id: 'bentuk Indonesia', laras: 'tidak selaras dengan senarai istilah Prof Dr', larang: 'perkataan atau frasa yang dilarang', terjemah: 'kesan terjemahan' };
/* [corak (serpihan ungkapan nalar, tidak peka huruf besar), ganti, jenis] */
const SENARAI = [
  // bentuk Indonesia
  ['penelitian(?:nya)?', 'kajian', 'id'], ['peneliti', 'pengkaji atau penyelidik', 'id'], ['kuesioner', 'soal selidik', 'id'], ['angket', 'soal selidik', 'id'], ['variabel', 'pemboleh ubah', 'id'],
  ['validitas', 'kesahan', 'id'], ['reliabilitas', 'kebolehpercayaan', 'id'], ['koefisien', 'pekali', 'id'], ['kualitas', 'kualiti', 'id'], ['kuantitas', 'kuantiti', 'id'], ['aktivitas', 'aktiviti', 'id'],
  ['efektivitas', 'keberkesanan', 'id'], ['kreativitas', 'kreativiti', 'id'], ['produktivitas', 'produktiviti', 'id'], ['universitas', 'universiti', 'id'], ['fakultas', 'fakulti', 'id'], ['kapasitas', 'keupayaan atau kapasiti', 'id'],
  ['identitas', 'identiti', 'id'], ['komunitas', 'komuniti', 'id'], ['prioritas', 'keutamaan', 'id'], ['fasilitas', 'kemudahan', 'id'], ['kompleksitas', 'kerumitan', 'id'],
  ['manajemen', 'pengurusan', 'id'], ['kepemimpinan', 'kepimpinan', 'id'], ['informasi', 'maklumat', 'id'], ['karena', 'kerana', 'id'], ['yaitu', 'iaitu', 'id'], ['berbeda', 'berbeza', 'id'], ['perbedaan', 'perbezaan', 'id'], ['membedakan', 'membezakan', 'id'],
  ['kepala\\s+sekolah', 'guru besar (sekolah rendah) atau pengetua (sekolah menengah)', 'id'], ['dosen', 'pensyarah', 'id'], ['siswa(?!\\s+guru)', 'murid atau pelajar (jika maksudnya murid sekolah)', 'id'], ['persentase', 'peratusan', 'id'], ['persen', 'peratus', 'id'],
  ['simpangan\\s+baku', 'sisihan piawai', 'id'], ['standar\\s+deviasi', 'sisihan piawai', 'id'], ['standar', 'piawai atau standard', 'id'], ['rata-rata', 'purata atau min (jika maksudnya nilai purata)', 'id'], ['uji\\s+coba', 'kajian rintis', 'id'],
  ['wawancara', 'temu bual', 'id'], ['observasi', 'pemerhatian', 'id'], ['evaluasi', 'penilaian', 'id'], ['implementasi', 'pelaksanaan', 'id'], ['signifikansi', 'kesignifikanan atau aras signifikan', 'id'], ['temuan', 'dapatan', 'id'],
  ['sekolah\\s+dasar', 'sekolah rendah', 'id'], ['perguruan\\s+tinggi', 'institusi pengajian tinggi', 'id'], ['jenjang', 'peringkat', 'id'], ['pelatihan', 'latihan', 'id'], ['pengembangan', 'pembangunan (jika maksudnya development)', 'id'],
  ['daring', 'dalam talian', 'id'], ['luring', 'luar talian', 'id'], ['kinerja', 'prestasi', 'id'], ['tantangan', 'cabaran', 'id'], ['kebijakan', 'dasar', 'id'], ['pemerintah', 'kerajaan', 'id'], ['pria', 'lelaki', 'id'], ['laki-laki', 'lelaki', 'id'],
  ['pedesaan', 'luar bandar', 'id'], ['perkotaan', 'bandar', 'id'], ['mediasi', 'pengantaraan', 'id'], ['(?:me|di|ter)mediasi', 'mengantara atau diantarai', 'id'], ['moderasi', 'penyederhanaan', 'id'], ['(?:me|di|ter)moderasi', 'menyederhanakan atau disederhanakan', 'id'],
  ['dampak', 'kesan', 'id'], ['berdampak', 'memberi kesan', 'id'], ['efek', 'kesan', 'id'], ['analisa', 'analisis', 'id'], ['resiko', 'risiko', 'id'], ['hipotesa', 'hipotesis', 'id'], ['subyek', 'subjek', 'id'], ['obyek', 'objek', 'id'],
  ['praktek', 'amalan atau praktik', 'id'], ['sistim', 'sistem', 'id'], ['metode', 'kaedah', 'id'], ['bisa', 'boleh atau dapat', 'id'], ['efikasi\\s+diri', 'efikasi kendiri', 'id'], ['laporan\\s+diri', 'laporan kendiri', 'id'],
  // tidak selaras dengan senarai istilah Prof Dr
  ['kadar\\s+respons', 'kadar pulangan', 'laras'], ['kadar\\s+maklum\\s+balas', 'kadar pulangan', 'laras'], ['komposisi', 'taburan atau pecahan (taburan sampel, taburan responden)', 'laras'], ['perantaraan', 'pengantaraan', 'laras'], ['moderator', 'penyederhana', 'laras'],
  ['kesahan\\s+diskriminan', 'kesahan mencapah', 'laras'], ['kesahan\\s+konvergen', 'kesahan menumpu', 'laras'], ['al(?:f|ph)a\\s+Cronbach', 'Cronbach Alpha', 'laras'], ['indeks\\s+padanan', 'indeks kesepadanan', 'laras'], ['padanan\\s+model', 'kesepadanan model', 'laras'],
  ['kerangka\\s+persampelan', 'rangka persampelan', 'laras'], ['persampelan\\s+purposif', 'persampelan bertujuan', 'laras'], ['ujian\\s+rintis', 'kajian rintis', 'laras'], ['pembolehubah', 'pemboleh ubah', 'laras'], ['korpus', 'himpunan rekod atau pangkalan literatur', 'laras'],
  ['terbetul\\s+pincang', 'terbetul bias', 'laras'], ['transformasional', 'transformasi (kepimpinan transformasi, pemimpin transformasi)', 'laras'], ['transaksional', 'transaksi (kepimpinan transaksi)', 'laras'], ['kebolehpercayaan\\s+gabungan', 'kebolehpercayaan komposit', 'laras'], ['(?:purata\\s+varians|varians\\s+purata)\\s+terekstrak', 'purata varians diekstrak', 'laras'],
  // kesan terjemahan
  ['di\\s+mana(?!-)', 'yang, iaitu, bagi, atau pecahkan ayat', 'terjemah'], ['ianya', 'ia', 'terjemah'], ['berdasarkan\\s+kepada', 'berdasarkan', 'terjemah'], ['oleh\\s+kerana', 'oleh sebab', 'terjemah'], ['di\\s+kalangan', 'dalam kalangan', 'terjemah'], ['selain\\s+daripada\\s+itu', 'selain itu', 'terjemah'],
  // perkataan dan frasa yang dilarang oleh Prof Dr
  ['berlewah-lewah|lewah', 'berjela atau berulang', 'larang'], ['menyauh|disauh|bersauh|sauh', 'sandaran atau disandarkan kepada', 'larang'], ['menjangkar|dijangkar|penjangkaran|jangkar', 'sandaran atau titik rujukan', 'larang'],
  ['(?:meng|di)konseptualisasikan|konseptualisasi', 'mentakrifkan atau merangka konsep', 'larang'], ['mengoperasionalisasikan|mengoperasionalkan|operasionalisasi', 'menetapkan cara mengukur', 'larang'], ['parsimoni', 'ringkas atau jimat', 'larang'], ['dikotomi', 'pembahagian dua', 'larang'],
  ['menyongsang|songsang', 'terbalik atau bertentangan arah', 'larang'], ['mengartikulasikan|artikulasi', 'menyatakan atau menjelaskan', 'larang'], ['epistemologi', 'cara pengetahuan dibina', 'larang'], ['ontologi', 'sifat sesuatu perkara', 'larang'],
  ['lakuran', 'gabungan', 'larang'], ['meleburkan', 'menggabungkan', 'larang'], ['substantif', 'penting atau bermakna', 'larang'], ['kontingen', 'bergantung kepada keadaan', 'larang'], ['holistik', 'menyeluruh', 'larang'],
  ['adalah\\s+penting\\s+untuk\\s+diperhatikan\\s+bahawa', 'buang frasa pembuka ini', 'larang'], ['perlu\\s+ditekankan\\s+di\\s+sini\\s+bahawa', 'buang frasa pembuka ini', 'larang'], ['tidak\\s+dapat\\s+dinafikan\\s+bahawa', 'buang frasa pembuka ini', 'larang'],
  ['dalam\\s+era\\s+globalisasi', 'buang frasa pembuka ini', 'larang'], ['secara\\s+keseluruhannya\\s+dapat\\s+dirumuskan\\s+bahawa', 'buang frasa pembuka ini', 'larang']
];
const HURUF = 'A-Za-zÀ-ɏ0-9';
export const GLOSARI = SENARAI.map(([src, ganti, jenis]) => ({ src, ganti, jenis, rx: new RegExp('(?<![' + HURUF + '])(' + src + ')(?![' + HURUF + '])', 'gi') }));
/* Laluan pantas: satu ungkapan gabungan menentukan sama ada teks mempunyai sebarang kejadian; teks yang bersih tidak melalui 126 corak. */
const RX_SEMUA = new RegExp('(?<![' + HURUF + '])(?:' + SENARAI.map(x => x[0]).join('|') + ')(?![' + HURUF + '])|[—–―]', 'i');
const RX_PETIK = /"[^"\n]{0,800}"|“[^”\n]{0,800}”/g;
const RX_SEMPANG = /[—–―]/g;
/* Nama khas: perkataan berhuruf besar di tengah ayat, atau diikuti perkataan berhuruf besar (contoh: Universitas Negeri Malang). */
function namaKhas(s, i, asal) {
  if (!/^[A-ZÀ-Þ]/.test(asal)) return false;
  const selepas = /^\s+[A-ZÀ-Þ]/.test(s.slice(i + asal.length, i + asal.length + 3));
  let j = i - 1; while (j >= 0 && /\s/.test(s[j])) j--;
  const awalAyat = j < 0 || /[.!?;:(\[\n]/.test(s[j]);
  return selepas || !awalAyat;
}
/* Senarai kejadian dalam satu teks: [{ asal, ganti, jenis, i }]. Teks di dalam tanda petik ialah petikan asal dan tidak disemak. */
export function semakIstilah(teks) {
  const s = String(teks || ''); if (s.length < 3) return [];
  const topeng = s.replace(RX_PETIK, m => ' '.repeat(m.length)); const out = [];
  if (!RX_SEMUA.test(topeng)) return out;
  GLOSARI.forEach(g => { g.rx.lastIndex = 0; let m; while ((m = g.rx.exec(topeng))) { const i = m.index; const asal = s.slice(i, i + m[1].length); if (!namaKhas(s, i, asal)) out.push({ asal, ganti: g.ganti, jenis: g.jenis, i }); if (!m[1].length) g.rx.lastIndex++; } });
  RX_SEMPANG.lastIndex = 0; let d; while ((d = RX_SEMPANG.exec(topeng))) out.push({ asal: d[0], ganti: 'koma, titik bertindih atau perkataan "hingga"', jenis: 'larang', i: d.index });
  out.sort((a, b) => a.i - b.i || b.asal.length - a.asal.length);
  // kejadian yang terkandung dalam kejadian lebih panjang (contoh "standar" dalam "standar deviasi") digugurkan
  const bersih = []; let hujung = -1; out.forEach(h => { if (h.i >= hujung) { bersih.push(h); hujung = h.i + h.asal.length; } });
  return bersih;
}
/* Pengawal isi bagi Agen Bahasa: teks baharu ditolak jika angka, simbol statistik, petikan atau jejak muka surat berubah, atau jika
   panjangnya berubah terlalu banyak. Pemiawaian bahasa tidak boleh menyentuh perkara yang mesti disalin tepat daripada artikel. */
const tandaAngka = t => (String(t).match(/\d+(?:[.,]\d+)*/g) || []).map(x => x.replace(/,(?=\d{3}(?!\d))/g, '')).sort().join('|');
const tandaPetik = t => (String(t).match(RX_PETIK) || []).map(x => x.replace(/\s+/g, ' ')).sort().join('|');
const tandaSimbol = t => (String(t).match(/[βαρχληΔσμ²³→←↔=<>≥≤%±×]/g) || []).sort().join('');
const bilMs = t => (String(t).match(/m\.s\./g) || []).length;
export function jagaIsi(asal, baharu) {
  const a = String(asal || ''), b = String(baharu || '');
  if (!b.trim()) return { ok: false, sebab: 'teks baharu kosong' };
  if (tandaAngka(a) !== tandaAngka(b)) return { ok: false, sebab: 'angka berubah' };
  if (tandaSimbol(a) !== tandaSimbol(b)) return { ok: false, sebab: 'simbol statistik berubah' };
  if (tandaPetik(a) !== tandaPetik(b)) return { ok: false, sebab: 'petikan dalam tanda petik berubah' };
  if (bilMs(a) !== bilMs(b)) return { ok: false, sebab: 'jejak muka surat berubah' };
  if (a.length >= 40) { const n = b.length / a.length; if (n < 0.6 || n > 1.6) return { ok: false, sebab: 'panjang teks berubah terlalu banyak' }; }
  return { ok: true, sebab: '' };
}
