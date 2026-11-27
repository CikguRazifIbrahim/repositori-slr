/* Pustaka prompt (v1.51.0): blok arahan yang disaring daripada koleksi prompt Prof Dr dan disesuaikan dengan agen sedia ada.
   Setiap blok hanya ditambah di hujung arahan agen yang berkenaan; tiada skema jawapan yang diubah, maka paparan sedia ada kekal.
   Bahagian prompt asal yang tidak sesuai dengan sistem ini dibuang, dan sebabnya dicatat pada setiap blok supaya keputusan itu boleh
   disemak semula.

   Sumber (26 November 2026) dan agen yang menggunakannya:
   1. Journal Submission Check  -> RUBRIK_HANTARAN  -> Semakan menyeluruh manuskrip (mod/pandu.js, mod menyeluruh)
   2. References                -> AUDIT_SITASI     -> Semakan sitasi oleh agen dalam Draf Akhir (mod/pandu-draf.js)
   3. Humanize                  -> GAYA_TULISAN     -> arahan gaya semua agen penulisan Pandu Tulis (mod/pandu.js, peraturan gaya)
   4. Data Screening            -> SARINGAN_TAJUK   -> agen saringan tajuk dan abstrak Ruang PRISMA (mod/saring.js)
   5. Title (dan abstrak)       -> STRATEGI_TAJUK   -> Pembantu tajuk (mod/tajuk.js)
   Kumpulan kedua (26 November 2026):
   6. INTRODUCTION              -> resipiTambahan('pendahuluan')   -> Contoh penulisan folder Pendahuluan
   7. LITERATURE REVIEW         -> resipiTambahan('literatur')     -> Contoh penulisan folder Kajian Literatur (artikel ulasan sahaja)
   8. METHODS                   -> resipiTambahan('kaedah')        -> Contoh penulisan folder Metodologi (artikel ulasan; alat bibliometrik bagi jenis bibliometrik)
   9. DISCUSSION                -> resipiTambahan('perbincangan')  -> Contoh penulisan folder Perbincangan
   10. CONCLUSION (sebenarnya audit manuskrip penuh) -> AUDIT_PENJAJARAN -> Semakan menyeluruh manuskrip; sebahagiannya ke
       resipiTambahan('dapatan', 'kesimpulan', 'abstrak')
   Menu Tesis: GAYA_TULISAN -> Cadangan Sintesis (mod/bengkel.js); GAYA_AYAT -> Ramal ayat (mod/ramal.js); lihat nota di hujung fail.
   11. ANALYSIS                 -> DIBUANG: prompt ini mengaudit set data mentah (tinjauan, transkrip temu bual) tanpa menganalisisnya.
       Sistem ini tidak menerima set data mentah: Ruang Output menerima output SPSS dan AMOS yang sudah siap dianalisis, dan fail CSV
       di sini ialah rekod bibliografi yang kualitinya sudah disemak oleh statistik CSV dan saringan. Tiada agen yang boleh memikulnya. */

/* 1. Journal Submission Check. Diambil: keputusan editor, risiko penolakan, ujian sumbangan, ujian "jadi apa" dan "siapa peduli", audit
   setiap seksyen, penjajaran tujuan hingga perbincangan, audit mutu tulisan dan keutamaan pembetulan. Disesuaikan: sepuluh bahagian laporan
   asal dipetakan ke medan sedia ada (ringkasan, kesediaan, konsistensi, isu). Dibuang: nota sulit kepada editor (mengulang keputusan) dan
   arahan menulis semula sepuluh ayat (agen semakan tidak menulis semula teks Prof Dr; ayat yang lemah hanya dipetik sebagai isu). */
export const RUBRIK_HANTARAN = `RUBRIK PRA-HANTARAN (nilai sebagai editor dan Penilai 2 yang tegas; jangan andaikan manuskrip ini baik, dan nilai kebolehterbitan, bukan usaha):
(a) "ringkasan" bermula dengan satu keputusan editor dalam kurungan siku: [Tolak di meja editor], [Tolak], [Semakan besar], [Semakan kecil] atau [Berpotensi diterima], diikuti justifikasinya; "kesediaan" mesti sepadan dengan keputusan itu (Tolak di meja editor di bawah 30; Tolak 30 hingga 44; Semakan besar 45 hingga 69; Semakan kecil 70 hingga 84; Berpotensi diterima 85 ke atas).
(b) Selain perkara keselarasan di atas, "konsistensi" mesti memuatkan tiga perkara ini: "Sumbangan" (apa yang didakwa lawan apa yang benar-benar disumbangkan; adakah ia baharu, tidak jelas dengan sendirinya dan bermakna kepada bidang), "Jadi apa dan siapa peduli" (adakah manuskrip menerangkan mengapa dapatan penting melampaui pemerihalan, dan kaitannya dengan teori serta amalan), dan "Sintesis lawan ringkasan" (adakah sorotan literatur mensintesis atau sekadar melaporkan kajian satu demi satu).
(c) "isu" disusun mengikut risiko penolakan, paling berat dahulu, paling banyak sepuluh. Pertimbangkan: sumbangan lemah, tiada kebaharuan, kedudukan dalam literatur lemah, kelemahan kaedah, perbincangan yang mengulang dapatan tanpa tafsiran, dan mutu tulisan. Bagi setiap isu, "perkara" menyatakan masalah, folder yang terlibat dan mengapa ia penting kepada penilai; "cadangan" menyatakan cara membetulkannya dan sama ada ia pembetulan cepat atau semakan mendalam.
(d) Audit setiap seksyen sebelum menulis isu: Pendahuluan (pembuka dan jurang meyakinkan?), Literatur (sintesis?), Kaedah (telus dan berjustifikasi?), Dapatan (jelas dan tepat?), Perbincangan (tafsiran mendalam atau ulangan?), Kesimpulan (penutup yang kukuh?).
(e) Mutu tulisan: jika ada ayat yang kabur, berlebihan atau lemah, petik sehingga lima ayat itu dalam "isu" (tahap Kecil atau Sederhana) dengan folder asalnya dan nyatakan apa yang lemah; jangan tulis semula ayat itu.`;

/* 2. References. Diambil: jangan reka rujukan, tanda apa yang tidak dapat disahkan, semakan dakwaan lawan sitasi (sokongan lemah, sitasi
   tidak relevan, sitasi tampalan, dakwaan terlalu kuat bagi sumbernya, sitasi tiada), dan sebut JENIS karya yang hilang tanpa menamakan
   sitasi tertentu. Dibuang: semakan kewujudan rujukan dan DOI (agen ini tiada capaian web, maka ia hanya boleh meneka; kewujudan dijamin
   dengan cara lain, iaitu setiap sitasi dipadankan dengan rekod repositori) dan pembinaan semula senarai APA 7 (senarai dijana oleh sistem
   daripada medan Rujukan APA 7 setiap rekod, bukan oleh agen). */
export const AUDIT_SITASI = `PERATURAN AUDIT SITASI:
1. Integriti akademik didahulukan: jangan reka sumber, pengarang, tahun atau dapatan. Jika ringkasan sumber tidak cukup untuk memutuskan, nyatakan "tidak dapat disahkan daripada ringkasan" dan jangan teka.
2. Bagi ayat B, nilai kekuatan sokongan, bukan sekadar kaitan topik. Gunakan "separa" apabila sumber menyokong sebahagian dakwaan sahaja, dan "tidak" apabila sumber tidak menyokongnya. Dalam "ulasan", namakan jenis masalahnya dengan salah satu label ini: sokongan lemah; sitasi tidak relevan; sitasi tampalan (beberapa sumber disenaraikan tetapi hanya satu yang menyokong); dakwaan terlalu kuat bagi sumbernya (contohnya korelasi ditulis sebagai sebab-akibat, atau dapatan satu konteks digeneralisasi); angka atau konteks tidak sepadan.
3. Bagi ayat A, bezakan dua keadaan. Jika ayat itu kenyataan kaedah, dapatan atau kesimpulan penulis sendiri, sumber = [] dan "saranan" mesti bermula dengan "Kenyataan penulis sendiri:" diikuti sebab ringkas mengapa sitasi tidak diperlukan. Jika ayat itu dakwaan tentang literatur atau fakta luar yang memerlukan sokongan tetapi tiada sumber dalam senarai yang menyokongnya, "saranan" mesti bermula dengan "Perlu sumber:" dan menyatakan JENIS karya yang patut dicari (contohnya garis panduan metodologi, kajian empirikal sekolah rendah, dokumen dasar), tanpa menamakan pengarang atau tajuk tertentu.
4. Jangan cadangkan sumber hanya kerana topiknya serupa; sumber dicadangkan hanya jika ringkasannya menyokong dakwaan ayat itu secara langsung.`;

/* 3. Humanize. Diambil: pola yang juga melemahkan tulisan akademik, iaitu pembesaran kepentingan tanpa bukti, atribusi kabur, tafsiran
   "-ing" yang kosong, arka "walaupun cabaran", kata kerja pengganti "ialah", binaan "bukan X tetapi Y", tiga serangkai automatik, istilah
   yang bertukar-tukar bagi perkara yang sama, julat palsu, lindung nilai bertindan, frasa pengisi, ayat yang mengumumkan apa yang akan
   dikatakan dan penutup umum. Dibuang, dengan sebab:
   - matlamat "tidak dapat dikesan sebagai AI": sistem ini menulis contoh ke RAM untuk diolah oleh Prof Dr; ukurannya ialah mutu akademik,
     bukan mengelak pengesan;
   - larangan "framework", "furthermore", "moreover", "landscape": ini istilah dan penanda wacana yang sah dalam penulisan akademik;
   - buang sempang kata majmuk ("data-driven" menjadi "data driven"): salah dari segi ejaan;
   - tajuk huruf kecil: bercanggah dengan gaya tajuk APA yang digunakan jurnal;
   - mula dengan butiran yang mengejutkan, perenggan satu ayat, suara "berpendirian": tidak sesuai dengan laras jurnal;
   - suara pasif diharamkan: suara pasif lazim dan wajar dalam seksyen Kaedah;
   - artifak bual (emoji, "I hope this helps"), petikan lurus lawan melengkung: tidak berlaku dalam agen berstruktur ini.
   Em-dash sudah dilarang oleh piawaian bahasa sedia ada. */
export const GAYA_TULISAN = `Elakkan pola tulisan generik yang melemahkan hujah akademik: (1) jangan membesarkan kepentingan tanpa bukti ("penting", "pivotal", "transformative", "anjakan paradigma"); nyatakan fakta, angka atau dapatannya. (2) Jangan guna atribusi kabur ("kajian menunjukkan", "pakar berpendapat", "studies show") tanpa menamakan sumbernya. (3) Jangan tambah tafsiran kosong di hujung ayat ("mencerminkan", "menonjolkan", "underscoring", "highlighting") kecuali tafsiran itu bersumber. (4) Jangan guna arka "walaupun berdepan cabaran, X terus berkembang"; namakan cabaran dan hasilnya. (5) Guna "ialah" atau "adalah" (is, are), bukan "berfungsi sebagai", "bertindak sebagai", "serves as", "stands as". (6) Jangan guna binaan "bukan sekadar X, tetapi Y" sebagai hiasan; nyatakan hujahnya terus. (7) Senaraikan tiga perkara hanya jika memang ada tiga; jangan menambah perkara ketiga untuk rentak. (8) Satu istilah bagi satu konstruk di sepanjang manuskrip; jangan menukar-nukar sinonim bagi pemboleh ubah yang sama. (9) Jangan guna julat palsu ("daripada X hingga Y", "merentas semua sektor") jika yang dimaksudkan hanya beberapa perkara; senaraikan perkara itu. (10) Satu lindung nilai bagi satu dakwaan ("mungkin" atau "may"), bukan bertindan ("could potentially", "berkemungkinan boleh"). (11) Buang frasa pengisi: "in order to" menjadi "to", "due to the fact that" menjadi "because", "prior to" menjadi "before"; dalam Bahasa Melayu, "dalam usaha untuk" menjadi "untuk", "disebabkan oleh fakta bahawa" menjadi "kerana". (12) Jangan umumkan apa yang akan ditulis ("bahagian ini akan membincangkan", "in this section, we will explore"); tulis perkaranya. (13) Jangan tutup perenggan atau seksyen dengan ayat harapan umum ("masa depan cerah", "the possibilities are endless"); tutup dengan dapatan, implikasi khusus atau persoalan yang masih terbuka. Peraturan ini tidak mengubah fakta, angka, nama, tahun atau makna sumber.`;

/* 4. Data Screening. Diambil: tajuk sebagai lapisan saringan pertama, ujian kepusatan (topik menjadi tumpuan utama atau sekadar latar),
   kata kunci sebagai bukti sokongan sahaja, dan justifikasi yang khusus. Disesuaikan: prinsip asal "jangan selamatkan rekod dengan abstrak"
   dilembutkan supaya selaras dengan peraturan sedia ada (jangan kecualikan kerana ragu), kerana saringan PRISMA yang berhati-hati lebih
   selamat daripada pengecualian yang tersilap. Dibuang: output Excel berwarna dan penukaran CSV (sistem menyimpan keputusan dalam Ruang
   PRISMA dan mengira angka aliran daripadanya), pengesanan pendua (sudah dibuat oleh sistem mengikut DOI dan tajuk sebelum agen dipanggil),
   lima label relevansi dan aras keyakinan (sistem menggunakan tiga keputusan: lulus, kecuali, tidak pasti). */
export const SARINGAN_TAJUK = `KAEDAH TAJUK DAHULU: (5) Baca tajuk dahulu. Jika tajuk dengan jelas menunjukkan fenomena utama yang lain daripada topik ulasan, itu petunjuk yang kuat untuk X, dan kata kunci yang bertindih tidak menyelamatkannya; abstrak dibaca dengan teliti apabila tajuk kabur, luas atau hanya sebahagiannya berkaitan. (6) Ujian kepusatan: tanya sama ada topik ulasan menjadi tumpuan utama rekod itu atau hanya latar belakang. Rekod yang menyebut topik sebagai latar sahaja bukan L; pilih X jika jelas, atau S jika abstrak tidak cukup untuk memutuskan. (7) Kata kunci hanya bukti sokongan; jangan pilih L semata-mata kerana kata kunci atau istilah yang serupa. (8) Nota "n" mesti khusus: nyatakan tentang apa rekod itu sebenarnya dan sama ada topik ulasan menjadi tumpuan atau latar. Jangan tulis nota umum seperti "berkaitan dengan topik" atau "mungkin relevan".`;

/* 5. Title. Diambil: analisis kedudukan sebelum menulis tajuk (apa yang menarik perhatian editor, apa yang menandakan kebaharuan dan
   ketelitian, apa yang tidak boleh dibesar-besarkan) dan tiga kategori pembingkaian (konservatif, berimpak tinggi, hibrid "selamat tetapi
   kuat") dengan penilaian setiap tajuk. Disesuaikan: 25 tajuk dalam prompt asal dikurangkan kepada bilangan yang Prof Dr pilih (tiga atau
   lima), kerana setiap cadangan disemak satu per satu; penilaian ditulis dalam medan "sebab". Dibuang: "kata yang meningkatkan sitasi"
   sebagai matlamat tersendiri (peraturan tajuk sedia ada sudah berasaskan garis panduan pelaporan), dan medan jurnal sasaran serta nada
   (sudah ditentukan oleh tetapan jurnal sasaran dan jenis artikel). Nama dokumen menyebut abstrak, tetapi kandungannya hanya tentang tajuk. */
export const STRATEGI_TAJUK = `9. Analisis kedudukan sebelum menulis: daripada pembayang dan petikan manuskrip, kenal pasti dahulu masalah kajian, jurang, objektif, kaedah, konteks dan sumbangan yang menjadikan kajian ini berbeza; kemudian tentukan pembingkaian yang paling jujur bagi kajian ini (pemerihalan, hubungan atau kesan, perbandingan, pemetaan, atau sumbangan konsep). Jangan membesar-besarkan: tajuk tidak boleh menjanjikan sebab-akibat, generalisasi atau kebaharuan yang tidak disokong oleh reka bentuk kajian.
10. Kepelbagaian pembingkaian: antara cadangan, mesti ada sekurang-kurangnya satu tajuk KONSERVATIF (jelas, tepat, gaya akademik tradisional, risiko penolakan rendah), satu tajuk BERIMPAK (pembingkaian lebih kuat dan sumbangan lebih menonjol, tetapi masih akademik) dan satu tajuk HIBRID (selamat tetapi kuat: mengimbangi kredibiliti dengan daya tarikan); tajuk hibrid yang terbaik diletakkan pertama.
11. Dalam medan "sebab", selepas ayat tentang apa yang ditonjolkan, tambah penilaian ringkas dalam bentuk ini: "Kategori: konservatif, berimpak atau hibrid. Keselamatan: tinggi, sederhana atau rendah. Kemungkinan teguran penilai: ..." (satu frasa tentang apa yang mungkin dipersoalkan oleh penilai, atau "tiada yang ketara").`;

/* 10. CONCLUSION. Walaupun bernama Conclusion, dokumen ini ialah audit manuskrip penuh tiga belas tugas. Diambil bagi Semakan menyeluruh:
   penjajaran setiap persoalan kajian daripada kaedah hingga kesimpulan, ketekalan angka, prinsip Dapatan lawan Perbincangan, dakwaan
   sumbangan dan kebaharuan yang boleh dipertahankan, penjajaran tajuk, abstrak dan kesimpulan, serta susunan keutamaan (integriti dahulu).
   Dibuang: menyunting terus dalam Microsoft Word dengan Track Changes (dalam sistem ini ASAL ditulis dan disunting oleh Prof Dr; agen
   semakan hanya melaporkan), pengesahan luaran setiap rujukan melalui Crossref, penerbit dan pangkalan data (agen tiada capaian web; prompt
   itu sendiri mensyaratkan pengesahan sedemikian dilabel "tidak dilakukan" jika alatnya tiada), pembacaan pruf seluruh dokumen (kerja Agen
   Bahasa dan Prof Dr), dan semakan nombor jadual serta rujukan silang (sudah dibuat tanpa token oleh Draf Akhir). */
export const AUDIT_PENJAJARAN = `AUDIT PENJAJARAN DAN INTEGRITI (keutamaan: 1 integriti ilmiah, iaitu angka, dakwaan tanpa sokongan dan sitasi; 2 kepaduan intelektual, iaitu penjajaran persoalan, kaedah, dapatan dan perbincangan; 3 hujah ilmiah, iaitu jurang dan sumbangan; 4 bahasa):
(f) Bagi SETIAP persoalan kajian dalam TERAS KAJIAN, jejaki rantaian ini: persoalan, prosedur atau teknik analisis yang menjawabnya (Kaedah), dapatan, jadual atau rajah yang menjawabnya (Dapatan), tafsirannya (Perbincangan) dan sintesisnya (Kesimpulan). Masukkan satu perkara "konsistensi" bagi setiap persoalan yang rantaiannya putus, dengan menamakan pautan yang hilang (contohnya "RQ3: tiada dapatan yang menjawabnya" atau "RQ2: perbincangan tidak mentafsir dapatannya").
(g) Ketekalan angka: bandingkan saiz sampel, bilangan kajian, peratus, jumlah dan nilai statistik yang sama merentas abstrak, kaedah, dapatan, perbincangan dan kesimpulan; kira semula jumlah mudah jika inputnya ada. Laporkan setiap percanggahan sebagai isu Kritikal dengan kedua-dua angka dan foldernya. Jangan cadangkan angka pengganti; yang betul ditentukan oleh Prof Dr daripada data asal.
(h) Dapatan menetapkan apa yang ditemui; Perbincangan menerangkan maksudnya, kaitannya dengan pengetahuan sedia ada dan mengapa ia penting. Tandakan Dapatan yang mentafsir, Perbincangan yang hanya mengulang angka, tafsiran sebab-akibat yang tidak disokong reka bentuk kajian, dan kekeliruan antara signifikan statistik, saiz kesan dan kepentingan praktikal.
(i) Dakwaan sumbangan dan kebaharuan: tandakan dakwaan seperti "kajian pertama" atau "belum ada kajian" yang tidak disokong bukti dalam manuskrip, sumbangan teori yang sebenarnya hanya pemerihalan aktiviti kajian, dan kesimpulan yang melampaui bukti atau memperkenalkan dakwaan empirikal baharu.
(j) Tajuk, abstrak, kata kunci dan kesimpulan: semak bahawa latar, tujuan, kaedah, dapatan dan sumbangan dalam abstrak sepadan tepat dengan teks utama, dan bahawa istilah bagi setiap konstruk sama di semua tempat.
(k) Jika sesuatu percanggahan tidak dapat diputuskan daripada teks yang diberi, nyatakan dengan tepat apa yang perlu disahkan oleh Prof Dr; jangan teka dan jangan reka pembetulan.`;

/* 6 hingga 10: tambahan kepada resipi penulisan setiap folder. Ditambah selepas resipi sedia ada (atau selepas struktur DNA jurang bagi
   Pendahuluan) dan tidak mengubah struktur itu, sasaran panjang folder atau peraturan sumber.
   Dibuang daripada semua prompt penulisan asal: arahan mencari 12 hingga 20 sumber dan mengesahkan DOI daripada ingatan model (sumber yang
   dibenarkan hanyalah artikel rujukan Prof Dr; fakta yang tiada ditanda [PERLU SUMBER] atau [ISI]), panjang tetap (900 hingga 1,200 atau
   1,500 hingga 2,500 patah perkataan; sasaran folder yang menentukan), tajuk bernombor tetap 5.1 hingga 5.5 (struktur mengikut acuan artikel
   contoh), dan senarai rujukan serta "nota pengesahan" yang ditulis agen (senarai rujukan dijana oleh sistem daripada rekod).
   INTRODUCTION: langkah "analisis penjaga pintu editorial" 300 hingga 400 patah perkataan dibuang sebagai output, tetapi isinya dijadikan
   peraturan menulis. LITERATURE REVIEW: prompt asal mengekstrak jadual daripada PDF yang dimuat naik; di sini jadual dibina daripada medan
   rekod, dan lajur "Search Query" digabungkan ke lajur data kerana medan rekod jarang menyimpannya. METHODS: prompt asal khusus bagi kajian
   bibliometrik; bahagian umum (justifikasi pangkalan data, medan carian, proses pemilihan, kebolehulangan) dipakai bagi semua artikel
   ulasan, manakala peranan VOSviewer, Biblioshiny, Bibliomagika dan OpenRefine hanya bagi jenis bibliometrik dan hanya jika Prof Dr
   menyatakan alat itu digunakan. DISCUSSION: unsur bibliometrik (kelompok, kejadian bersama) digeneralisasikan kepada "pola dapatan". */
const R_PENDAHULUAN = `TAMBAHAN PENDAHULUAN (tulis untuk penilai yang memutuskan dalam tiga halaman pertama sama ada mahu terus membaca; jika STRUKTUR DNA JURANG diberi di atas, struktur itu kekal dan panduan ini hanya menentukan mutu isinya):
1. Pembuka: perenggan pertama memuatkan tiga unsur yang dijalin secara semula jadi, bukan sebagai senarai: satu pemerhatian yang tidak dijangka, kurang diberi perhatian atau berlawanan dengan jangkaan dalam bidang ini; sekurang-kurangnya satu bukti konkrit daripada artikel rujukan (angka, pola empirikal atau trend) yang disitasi dengan tepat; dan satu teka-teki yang tersirat, iaitu perkara yang belum dapat dijelaskan sepenuhnya oleh kajian sedia ada. Jangan buka dengan takrif, sejarah ringkas atau dakwaan kepentingan umum.
2. Pembingkaian masalah: sintesiskan apa yang dipersetujui, percanggahan yang berterusan dan andaian atau titik buta yang berulang dalam literatur; tunjukkan mengapa penjelasan sedia ada tidak lengkap. Gunakan sekurang-kurangnya dua lagi angka daripada rekod untuk menunjukkan skop dan akibat isu itu. Jangan senaraikan kajian satu demi satu.
3. Logik sumbangan sebagai satu rantaian yang ringkas: apa yang dijelaskan dengan baik oleh kajian lepas; apa yang selalu tertinggal atau dianggap sedia maklum; mengapa ketinggalan itu penting dari segi teori atau empirikal; dan bagaimana kajian ini mengubah kefahaman, bukan sekadar menambah satu lagi kajian. Nyatakan mengapa sumbangan itu tidak jelas dengan sendirinya.
4. Elakkan tanda pendahuluan yang lemah: frasa generik ("semakin mendapat perhatian", "has received increasing attention"), jurang yang diumumkan tanpa dibina, dan sumbangan yang kedengaran tokokan kecil atau boleh diramal.`;
const R_LITERATUR = `TAMBAHAN KAJIAN LITERATUR: (1) Bina hujah, bukan senarai: tetapkan perbahasan teori dan empirikal yang utama, bezakan pengetahuan yang sudah mantap daripada persoalan yang belum selesai, bandingkan kajian secara kritis, dan tunjukkan mengapa kajian ini perlu. Jangan mendakwa "kajian pertama" atau "tiada kajian". (2) Jika sekurang-kurangnya tiga artikel rujukan ialah artikel ulasan (skop, sistematik, meta-analisis atau bibliometrik), sertakan satu jadual ringkasan ulasan terdahulu dengan lajur: Pengarang (tahun); Domain; Objektif; Bilangan dokumen, sumber data dan tempoh liputan; Atribut yang diteliti; Dapatan utama. Satu ulasan satu baris, dalam frasa pendek dan padat, menggunakan istilah artikel itu sendiri. Isi sel hanya dengan maklumat yang tertulis dalam rekod; jika tiada, tulis "Tidak dilaporkan" dan jangan teka atau tafsir.`;
const R_KAEDAH_ULASAN = `TAMBAHAN METODOLOGI ARTIKEL ULASAN (pembaca ialah penilai yang skeptikal; setiap pilihan kaedah yang utama mesti berjustifikasi, dan nada kekal neutral tanpa membesar-besarkan kaedah):
1. Pangkalan data: nyatakan mengapa pangkalan data yang dipilih sesuai (liputan, kawalan mutu, metadata sitasi, keluasan disiplin) dan bandingkan secara tersirat, bukan agresif, dengan alternatifnya.
2. Strategi carian: nyatakan medan carian (contohnya tajuk sahaja atau tajuk, abstrak dan kata kunci), sebab pilihan itu, dan tukar ganti antara perolehan (recall) dengan ketepatan (precision).
3. Proses pemilihan: huraikan langkah demi langkah selaras dengan rajah aliran (rekod ditemui, pendua dibuang, saringan, kelayakan, dimasukkan) dan rujuk rajah itu secara jelas dengan nombornya. Angka mesti sama dengan Ruang PRISMA.
4. Pembersihan dan penyelarasan data: nyatakan bagaimana isu mutu data ditangani dan mengapa ia meningkatkan kesahan dan kebolehpercayaan analisis.
5. Tutup dengan pernyataan ketelusan dan kebolehulangan: semua langkah didokumenkan dan parameter dilaporkan supaya kajian boleh diulang.
6. Justifikasi kaedah hanya disitasi kepada sumber metodologi dalam senarai artikel rujukan; jika tiada, tulis [PERLU SUMBER: sumber metodologi bagi perkara itu] dan jangan sitasi daripada ingatan.`;
const R_KAEDAH_BIBLIO = `TAMBAHAN KHUSUS BIBLIOMETRIK (hanya bagi alat yang dinyatakan oleh Prof Dr dalam catatan, arahan khusus atau ASAL; jangan andaikan alat yang tidak disebut, dan tandakan [ISI: alat dan parameter] jika belum dinyatakan): terangkan reka bentuk bibliometrik dan pemetaan sains serta sebab ia sesuai dengan objektif; analisis prestasi (penerbitan, sitasi, pengarang, sumber) sebagai langkah sebelum pemetaan sains; peranan setiap alat secara berasingan, contohnya OpenRefine bagi pembersihan dan penyelarasan kata kunci pengarang, Bibliomagika bagi penyeragaman nama institusi dan penunjuk prestasi, VOSviewer bagi rangkaian kejadian bersama, pengesanan kelompok dan visualisasi (dengan pilihan parameter seperti kaedah pengiraan dan ambang), dan Biblioshiny (Bibliometrix) bagi peta tematik dan struktur konsep; serta bagaimana peta tematik melengkapi visualisasi rangkaian.`;
const R_DAPATAN = `TAMBAHAN DAPATAN: dapatan disusun mengikut objektif atau persoalan kajian dan menjawabnya terus; jangan ulang dalam teks semua nilai yang sudah kelihatan dalam jadual atau rajah, hanya yang menjawab persoalan; bezakan bukti yang diperhatikan daripada tafsiran (tafsiran ditulis dalam Perbincangan); setiap jadual dan rajah dirujuk dalam teks dengan nombornya.`;
const R_PERBINCANGAN = `TAMBAHAN PERBINCANGAN (tafsiran, bukan ulangan dapatan; yakin tetapi berhati-hati; tiada dakwaan kebaharuan yang berlebihan):
1. Sebelum menulis, kelaskan pola dapatan kepada yang dijangka, yang tidak dijangka, yang kurang diteroka dan yang signifikan dari segi teori; perbincangan dibina di sekeliling pengelasan itu.
2. Rumusan dapatan utama ditulis ringkas: hanya pola yang paling penting dan maknanya bagi bidang, tanpa mengulang banyak angka.
3. Tafsiran ialah teras: terangkan MENGAPA pola itu muncul, bagaimana pola-pola itu berkait antara satu sama lain, dan apa yang mengejutkan. Bagi setiap pola, nyatakan sama ada ia selari atau bercanggah dengan artikel rujukan dan terangkan sebab persamaan atau percanggahan itu; sitasi digunakan untuk menganalisis, bukan untuk memerihal. Bezakan tafsiran daripada spekulasi, dan jangan beri penjelasan sebab-akibat yang tidak disokong reka bentuk kajian.
4. Implikasi teori ialah sumbangan utama dan ditulis paling mendalam: bagaimana dapatan memajukan kefahaman konsep, menjelaskan hubungan antara konstruk, mendedahkan titik buta teori atau mencadangkan pemurnian dan penyepaduan konsep; nyatakan sumbangan itu dengan jelas dan mengapa ia tidak jelas dengan sendirinya.
5. Implikasi amalan dan dasar: setiap implikasi mesti dipautkan kepada satu dapatan yang khusus dan menamakan pihak yang terlibat (contohnya guru besar, guru, pejabat pendidikan daerah, penggubal dasar). Tiada pernyataan umum.
6. Arah kajian lanjutan sebagai agenda yang strategik dalam tiga jenis: teori (persoalan konsep baharu, konstruk yang kurang dibangunkan), metodologi (sumber data, reka bentuk campuran atau longitudinal) dan empirikal (konteks, wilayah atau populasi yang kurang dikaji). Setiap cadangan mesti lahir secara logik daripada dapatan atau batasan kajian ini, khusus dan boleh dilaksanakan.
7. Jika sesuatu dakwaan tidak dapat disokong oleh artikel rujukan, tulis dengan berhati-hati sebagai kemungkinan, atau tandakan [PERLU SUMBER].`;
const R_KESIMPULAN = `TAMBAHAN KESIMPULAN: jawab setiap objektif kajian secara ringkas; sintesiskan dapatan utama, bukan mengulangnya; nyatakan hanya sumbangan yang disokong oleh dapatan; akui batasan yang berkaitan; jangan perkenalkan dakwaan empirikal, angka atau sitasi baharu; setiap implikasi dipautkan kepada dapatan yang khusus.`;
const R_ABSTRAK = `TAMBAHAN ABSTRAK: latar, tujuan, kaedah, dapatan dan sumbangan mesti sepadan tepat dengan ASAL folder lain; setiap angka dalam abstrak mesti sama dengan angka dalam Kaedah dan Dapatan; istilah bagi setiap konstruk sama seperti dalam teks utama; tiada dakwaan yang tiada dalam manuskrip.`;
/* v1.54.2: resipi pernyataan masalah bagi agen Teras kajian (Langkah 2 Penerbitan). Diturunkan daripada prompt INTRODUCTION Prof Dr (butiran 2
   hingga 4 R_PENDAHULUAN: pembingkaian masalah, rantaian logik sumbangan, tanda pendahuluan yang lemah), dipadatkan kepada satu perenggan,
   dan ditambah peraturan kebolehbacaan kerana perenggan itu dibaca oleh Prof Dr sebelum ditetapkan sebagai tulang belakang artikel. */
export const RESIPI_MASALAH = `CARA MENULIS PERNYATAAN MASALAH (mengikut prompt Pendahuluan Prof Dr; perenggan ini mesti difahami pada bacaan pertama oleh pembaca yang belum membaca artikel rujukan):
1. Rantaian logik, satu langkah satu atau dua ayat, mengikut urutan: (a) apa yang sudah dijelaskan dengan baik oleh kajian lepas, disintesis merentas sumber dan bukan diceritakan satu kajian demi satu kajian; (b) apa yang selalu tertinggal, bercanggah atau dianggap sedia maklum, iaitu jurang, dibina daripada bukti dan bukan sekadar diumumkan; (c) mengapa ketinggalan itu penting kepada teori, amalan atau dasar, dengan akibatnya dinamakan (siapa yang terkesan dan bagaimana); (d) apa yang dilakukan oleh artikel ini dan bagaimana ia mengubah kefahaman, bukan sekadar menambah satu lagi kajian.
2. Kebolehbacaan: satu ayat satu idea, tidak melebihi kira-kira 30 patah perkataan; ayat pertama menyatakan isu dalam konteks kajian Prof Dr sendiri (populasi dan konstruknya), bukan konteks artikel rujukan; konstruk utama dinamakan dengan satu istilah yang sama sepanjang perenggan dan diterangkan secara ringkas ketika pertama kali disebut; setiap ayat bersambung dengan ayat sebelumnya melalui penanda wacana yang sesuai.
3. Jangan lakukan: memerihalkan kaedah atau butiran dalaman sesebuah artikel rujukan (bilangan artikel yang diulasnya, disiplinnya, senarai dapatannya) kecuali butiran itu sendiri ialah bukti jurang; mengulang sitasi yang sama pada setiap ayat (sitasi sekali bagi setiap dakwaan sudah memadai); frasa generik seperti "semakin mendapat perhatian"; jurang yang bergantung pada satu sumber sahaja apabila sumber lain turut menyentuhnya; sumbangan yang kedengaran tokokan kecil.
4. Perenggan mesti bersih: JANGAN letakkan penanda [PERLU SUMBER], [ISI] atau sebarang kurungan siku di dalam pernyataan masalah. Jika sesuatu dakwaan belum dapat disokong oleh artikel rujukan, tulis dakwaan itu secara berhati-hati tanpa sitasi, atau tinggalkannya. Jangan minta Prof Dr mencari sumber atau menyemak apa-apa.`;
/* v1.54.4: sintesis merentas semua artikel sumber bagi agen Teras kajian. n ialah bilangan artikel sumber; tiada arahan jika kurang daripada dua. */
export const sintesisTeras = n => n < 2 ? '' : `SINTESIS MERENTAS SUMBER (${n} artikel sumber; wajib):
1. Baca KESEMUA ${n} artikel sumber sebelum menulis. Urutan senarai tidak membawa makna keutamaan: jangan bersandar pada artikel pertama. Utamakan sumber yang paling dekat dengan konstruk dan konteks kajian Prof Dr.
2. Sebelum menulis, kelompokkan sumber secara senyap: apa yang dipersetujui oleh beberapa sumber, di mana sumber bercanggah, dan apa yang ditinggalkan oleh kebanyakan sumber (konstruk, populasi, konteks, kaedah).
3. Dalam pernyataan masalah, langkah (a) dan langkah (b) masing-masing bersandar pada sekurang-kurangnya dua sumber berbeza, sama ada disitasi bersama dalam satu kurungan atau dibandingkan dalam satu ayat (bentuk: "X dan Y melaporkan ..., manakala Z ..."). Jangan menceritakan satu kajian dalam satu ayat, dan jangan bina jurang daripada satu sumber jika sumber lain turut menyentuh perkara itu.
4. Pernyataan masalah menyitasi sekurang-kurangnya ${Math.min(n, 4)} sumber berbeza, selagi setiap sitasi benar-benar menyokong ayatnya; jangan memaksa sitasi yang tidak berkaitan.
5. Objektif dan persoalan diturunkan daripada jurang yang disintesis itu, bukan daripada satu artikel.
6. Dalam medan sebab, nyatakan berapa daripada ${n} sumber yang disitasi, dan namakan sumber yang tidak digunakan berserta sebab ringkas.`;
/* o.ulasan: artikel ulasan (skop, sistematik, meta-analisis, bibliometrik); o.biblio: jenis bibliometrik */
export function resipiTambahan(peranan, o) {
  o = o || {};
  if (peranan === 'pendahuluan') return R_PENDAHULUAN;
  if (peranan === 'literatur') return o.ulasan ? R_LITERATUR : R_LITERATUR.split(' (2) ')[0];
  if (peranan === 'kaedah') return o.ulasan ? R_KAEDAH_ULASAN + (o.biblio ? '\n' + R_KAEDAH_BIBLIO : '') : '';
  if (peranan === 'dapatan') return R_DAPATAN;
  if (peranan === 'perbincangan') return R_PERBINCANGAN;
  if (peranan === 'kesimpulan') return R_KESIMPULAN;
  if (peranan === 'abstrak') return R_ABSTRAK;
  return '';
}

/* Semakan silang menu Tesis (v1.51.1). Menu Tesis tidak mempunyai agen penulisan folder atau agen semakan sendiri: teksnya ditulis oleh
   Prof Dr, dan agen hanya menyumbang melalui tiga laluan, iaitu Ramal ayat dalam RAM (mod/ramal.js), Cadangan Sintesis daripada menu
   Sintesis yang dihantar ke RAM (mod/bengkel.js) dan contoh penulisan yang dihantar dari Penerbitan. Maka hanya prompt gaya (Humanize) yang
   terpakai kepada Tesis: GAYA_TULISAN disambung kepada Cadangan Sintesis, dan GAYA_AYAT, iaitu bentuk ringkasnya bagi satu ayat, kepada
   Ramal ayat. Prompt lain tidak disambung kepada Tesis, dengan sebab: resipi Pendahuluan, Metodologi, Perbincangan dan Kesimpulan ditulis
   bagi artikel jurnal (bab tesis mengikut struktur dan panduan UPSI, dan tiada agen yang menulis bab); rubrik pra-hantaran, audit penjajaran
   dan audit sitasi memerlukan agen semakan yang tidak wujud dalam Tesis (Draf Tesis hanya menggabung bab dan mencatat aktiviti, tanpa
   token); saringan tajuk dahulu dan strategi tajuk khusus bagi Ruang PRISMA dan Pembantu tajuk artikel. */
export const GAYA_AYAT = `Mutu ayat: jangan membesarkan kepentingan tanpa bukti ("penting", "pivotal", "anjakan paradigma"); jangan guna atribusi kabur ("kajian menunjukkan", "pakar berpendapat") kerana sumbernya sudah dinamakan oleh sitasi sistem; jangan tambah tafsiran kosong di hujung ayat ("mencerminkan", "menonjolkan", "underscoring", "highlighting"); guna "ialah" atau "adalah" (is, are), bukan "berfungsi sebagai" atau "serves as"; jangan guna binaan "bukan sekadar X, tetapi Y" sebagai hiasan; senaraikan tiga perkara hanya jika rekod memang menyebut tiga; guna istilah konstruk yang sama seperti dalam TEKS SEBELUM, bukan sinonimnya; satu lindung nilai sahaja bagi satu dakwaan; buang frasa pengisi ("dalam usaha untuk" menjadi "untuk", "in order to" menjadi "to"); dan jangan umumkan apa yang akan ditulis.`;
