/* Pustaka prompt (v1.51.0): blok arahan yang disaring daripada koleksi prompt Prof Dr dan disesuaikan dengan agen sedia ada.
   Setiap blok hanya ditambah di hujung arahan agen yang berkenaan; tiada skema jawapan yang diubah, maka paparan sedia ada kekal.
   Bahagian prompt asal yang tidak sesuai dengan sistem ini dibuang, dan sebabnya dicatat pada setiap blok supaya keputusan itu boleh
   disemak semula.

   Sumber (26 November 2026) dan agen yang menggunakannya:
   1. Journal Submission Check  -> RUBRIK_HANTARAN  -> Semakan menyeluruh manuskrip (mod/pandu.js, mod menyeluruh)
   2. References                -> AUDIT_SITASI     -> Semakan sitasi oleh agen dalam Draf Akhir (mod/pandu-draf.js)
   3. Humanize                  -> GAYA_TULISAN     -> arahan gaya semua agen penulisan Pandu Tulis (mod/pandu.js, peraturan gaya)
   4. Data Screening            -> SARINGAN_TAJUK   -> agen saringan tajuk dan abstrak Ruang PRISMA (mod/saring.js)
   5. Title (dan abstrak)       -> STRATEGI_TAJUK   -> Pembantu tajuk (mod/tajuk.js) */

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
