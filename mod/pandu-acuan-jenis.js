/* Pandu Tulis: ACUAN KHUSUS MENGIKUT JENIS ARTIKEL (v1.54.0).
   pandu-acuan.js menyimpan satu artikel contoh bagi setiap KELUARGA jenis artikel. Sesetengah jenis dalam satu keluarga mempunyai
   struktur yang cukup berbeza sehingga wajar mempunyai artikel contoh sendiri. Fail ini menyimpan acuan bagi jenis sedemikian; apabila
   jenis artikel ada di sini, acuan ini digunakan sebagai acuan terbina dan bukan acuan keluarganya. Tetapan lain (gerakan, sasaran,
   PRISMA dan sebagainya) tetap mengikut keluarga.
   - ul-payung (ulasan payung): Wohlfart dan Wagner (2023), dipilih oleh pemilik.
   - ul-bersepadu (ulasan bersepadu): Gause et al. (2022), dipilih oleh pemilik.
   Sumber teks penuh: PubMed Central. Angka Wohlfart dan Wagner dikira oleh skrip daripada teks penuh itu; angka Gause et al. ialah
   anggaran hampir daripada bacaan teks penuh (medan anggar). Huraian fungsi ditulis dengan kata-kata sendiri; tiada ayat artikel disalin.
   Tajuk dan subtajuk asal kedua-dua artikel berada dalam pandu-tajuk.js di bawah id yang sama. */
const siap = a => {
  const kira = {}; const jum = a.bahagian.reduce((s, b) => s + b.kata, 0);
  a.bahagian.forEach(b => { kira[b.p] = (kira[b.p] || 0) + 1; b.k = kira[b.p] === 1 ? b.p : b.p + kira[b.p]; b.peratus = Math.round(100 * b.kata / jum); b.sub = b.sub || []; b.ajar = b.ajar || []; b.elak = b.elak || []; b.jadual = b.jadual || 0; b.rajah = b.rajah || 0; });
  a.ukuran.badan = jum; return a;
};
const P = (g, f, cara, w, cit, n) => Object.assign({ g, f, cara, w, cit }, n > 1 ? { n } : {});
const S = (bm, en, kata, per, sit) => ({ bm, en, kata, per, sit });

const PAYUNG = siap({
  id: 'payung-wohlfart-2023', kel: 'slr', pendek: 'Wohlfart dan Wagner (2023)', notaUkur: 'Angka dikira oleh skrip daripada teks penuh artikel dalam PubMed Central; bilangan rujukan tidak direkodkan.',
  rujukan: 'Wohlfart, O., & Wagner, I. (2023). Teachers’ role in digitalizing education: An umbrella review. Educational Technology Research and Development, 71(2), 339-365. https://doi.org/10.1007/s11423-022-10166-0',
  doi: '10.1007/s11423-022-10166-0', jurnal: 'Educational Technology Research and Development', lesen: 'Akses terbuka',
  tajuk: 'Teachers’ role in digitalizing education: An umbrella review',
  sebab: 'Ulasan payung dalam bidang pendidikan yang paling hampir dengan bidang pemilik: peranan guru dalam pendigitalan pendidikan, literasi digital guru, TPACK dan integrasi teknologi. Unit analisisnya ialah ulasan sistematik, bukan kajian primer, dan kaedahnya mengikut protokol ulasan payung Joanna Briggs Institute. Dipilih oleh Prof Dr.',
  reka: 'Ulasan payung mengikut protokol Joanna Briggs Institute (Aromataris et al., 2015). Carian melalui EBSCOhost, saringan oleh dua penyelidik, penilaian kualiti dengan senarai semak JBI bagi ulasan sistematik, dan analisis tematik. 23 ulasan sistematik (2006 hingga 2020) yang merangkum 1,062 kajian primer selepas pertindihan dibuang. Empat soalan kajian. Dua jadual dan dua rajah.',
  ciri: [
    'Pendahuluan hanya tiga perenggan, kemudian empat soalan kajian disenaraikan dengan label RQ1 hingga RQ4.',
    'Metodologi dibuka dengan satu perenggan yang mewajarkan ulasan payung dan menamakan protokol yang diikuti.',
    'Kriteria penolakan teks penuh ditulis sebagai senarai bernombor yang pendek.',
    'Pertindihan kajian primer antara ulasan dilaporkan dengan angka sebelum dan selepas pendua dibuang.',
    'Dapatan dipecahkan kepada hasil kuantitatif (ciri ulasan yang dirangkum) dan dapatan kualitatif yang disusun tepat mengikut soalan kajian.',
    'Setiap subbahagian dapatan dibuka dengan satu ayat yang menyebut soalan kajian yang dijawab.',
    'Arah kajian masa depan ditulis sebagai lima butiran bernombor, setiap satu dengan tajuk kecil.',
    'Perbincangan dipisahkan daripada Implikasi dan daripada Batasan, masing-masing dengan subtajuk sendiri.'
  ],
  abstrak: { bentuk: 'Satu perenggan kira-kira 135 patah perkataan.', cara: 'Kepentingan guru dalam pendigitalan, kaedah ulasan payung dan bilangan ulasan yang dirangkum, tema utama yang ditemui, dan arah kajian masa depan.' },
  ukuran: { abstrak: 136, berstruktur: false, kataKunci: 0, rujukan: 0, jadual: 2, rajah: 2 },
  suai: [
    'Gunakan garis panduan pelaporan yang terkini bagi ulasan payung (PRIOR, atau Manual JBI edisi semasa) dan rajah aliran PRISMA 2020; artikel contoh menggunakan rajah PRISMA 2009.',
    'Cetak rentetan carian penuh dan cari dalam sekurang-kurangnya dua pangkalan data; artikel contoh bergantung pada satu enjin carian.',
    'Laporkan pertindihan kajian primer secara eksplisit, contohnya dengan matriks sitasi atau indeks pertindihan.',
    'Tukar tema dapatan (literasi digital, TPACK, integrasi teknologi) kepada tema kajian Prof Dr; kekalkan susunannya yang mengikut soalan kajian.'
  ],
  bahagian: [
    { p: 'pendahuluan', bm: 'Pendahuluan', en: 'Introduction', kata: 609, per: 4, sit: 12,
      peta: [
        P('konteks', 'Kepentingan topik dan aktor utama', 'Enam ayat. Ayat pertama menamakan pihak yang terlibat dan menegaskan peranan guru, dengan dua kumpulan sitasi. Ayat seterusnya meluaskan hujah kepada tuntutan terhadap guru.', 199, 7),
        P('bukti', 'Apa yang sudah dikaji', 'Satu perenggan sederhana yang merumuskan tumpuan kajian lepas tentang peranan guru, dengan empat sitasi.', 129, 4),
        P('jurang', 'Mengapa ulasan terhadap ulasan diperlukan', 'Enam ayat. Bermula dengan pertumbuhan literatur dan banyaknya ulasan sedia ada, kemudian menyatakan bahawa gambaran menyeluruh sukar diperoleh, lalu memperkenalkan ulasan payung sebagai jalan keluar.', 191, 1),
        P('soalan', 'Empat soalan kajian', 'Senarai berlabel RQ1 hingga RQ4, setiap satu satu ayat tanya, diikuti satu ayat penutup yang menyatakan jenis sumber yang dianalisis.', 90, 0)
      ],
      ajar: ['Pendahuluan ringkas dan terus sampai kepada soalan kajian.', 'Jurang dibina daripada lambakan ulasan sedia ada, bukan daripada kekurangan kajian primer.'],
      elak: ['Latar konsep sangat nipis dalam Pendahuluan; jika jurnal sasaran meminta takrif konsep, tambah satu perenggan takrif.'] },
    { p: 'kaedah', bm: 'Metodologi', en: 'Method', kata: 894, per: 13, sit: 11, rajah: 1,
      sub: [S('Kriteria Penerimaan', 'Inclusion criteria', 58, 1, 1), S('Prosedur Carian', 'Search procedure', 268, 2, 1), S('Pemilihan Kajian', 'Study selection', 354, 8, 7), S('Analisis Data', 'Data analysis', 104, 1, 1)],
      peta: [
        P('reka', 'Justifikasi ulasan payung dan protokol', 'Empat ayat sebelum subtajuk pertama: banyaknya kajian, peranan ulasan sistematik, tujuan menggabungkan ulasan, dan protokol yang diikuti (satu sitasi kaedah).', 110, 1),
        P('kriteria', 'Kriteria penerimaan', 'Satu perenggan pendek yang mentakrifkan jenis sintesis bukti yang diterima, dengan satu sitasi.', 58, 1),
        P('carian', 'Prosedur carian', 'Dua perenggan. Yang pertama menamakan enjin carian dan pangkalan data; yang kedua (tujuh ayat) menceritakan percubaan carian pertama, bilangan hasil, dan cara rentetan carian diperhalus. Rajah aliran dirujuk di sini.', 268, 1, 2),
        P('pilih', 'Saringan, penolakan dan penilaian kualiti', 'Lapan perenggan pendek: saringan oleh dua penyelidik, bilangan teks penuh, tiga sebab penolakan sebagai senarai bernombor, cara perselisihan diselesaikan, penilaian kualiti dengan senarai semak, dan bilangan akhir yang dirangkum.', 354, 7, 8),
        P('analisis', 'Analisis data', 'Satu perenggan: analisis kuantitatif ciri ulasan dan analisis tematik kualitatif, dengan sitasi kaedah dan perisian yang digunakan.', 104, 1)
      ],
      ajar: ['Sebab penolakan ditulis sebagai senarai bernombor supaya mudah diimbas.', 'Penilaian kualiti ulasan yang dirangkum dilaporkan bersama alatnya.'],
      elak: ['Carian bergantung pada satu enjin carian dan rentetan carian penuh tidak dicetak; untuk artikel sendiri, cetak rentetan carian dan gunakan lebih daripada satu pangkalan data.'] },
    { p: 'dapatan', bm: 'Hasil Kuantitatif', en: 'Quantitative results', kata: 121, per: 2, sit: 1, rajah: 1,
      peta: [
        P('ciri', 'Ciri ulasan yang dirangkum', 'Dua perenggan pendek: bilangan ulasan dan jurnal, kemudian tempoh penerbitan kajian primer serta bilangannya sebelum dan selepas pertindihan dibuang. Satu rajah perkembangan penerbitan.', 121, 1, 2)
      ],
      ajar: ['Pertindihan kajian primer dilaporkan dengan dua angka.'], elak: [] },
    { p: 'dapatan', bm: 'Dapatan Kualitatif', en: 'Qualitative findings', kata: 3040, per: 34, sit: 76, jadual: 2,
      sub: [S('Tumpuan Kajian Ulasan Terdahulu', 'Research focus of previous reviews', 363, 9, 14), S('Literasi Digital', 'Digital literacy', 1485, 14, 35), S('Integrasi Teknologi', 'Technology integration', 694, 4, 18), S('Kajian Masa Depan', 'Future research', 406, 6, 9)],
      peta: [
        P('rumus', 'Pengantar dapatan', 'Satu perenggan yang menyatakan bahawa analisis dipandu oleh soalan kajian dan menggariskan susunan subbahagian.', 92, 0),
        P('tema', 'Tema tumpuan ulasan (RQ1)', 'Satu ayat yang menyebut soalan kajian, senarai enam tema bernombor, kemudian satu perenggan panjang (sepuluh ayat) yang menghuraikan tema paling menonjol dengan bilangan ulasan bagi setiap tema. Jadual gambaran keseluruhan ulasan diletakkan di sini.', 363, 14, 9),
        P('definisi', 'Konsep utama dan kerangkanya (RQ2)', 'Satu ayat pengantar, satu perenggan takrif yang membandingkan definisi antara ulasan, kemudian lima perenggan tentang satu kerangka (kemunculan, domain pengetahuan, pengukuran, konteks) dengan jadual tematik sendiri.', 803, 22, 7),
        P('bukti', 'Pendekatan dan keperluan pembangunan (RQ2)', 'Tujuh perenggan dalam dua subtajuk. Setiap perenggan memikul satu strategi atau satu syarat, dibuka dengan bilangan ulasan yang menyokongnya.', 682, 13, 7),
        P('hubung', 'Integrasi dan penerimaan teknologi (RQ3)', 'Satu ayat pengantar, satu perenggan panjang (sebelas ayat) tentang strategi, syarat dan halangan, kemudian dua perenggan tentang penerimaan teknologi dan pemboleh ubah penyederhananya.', 694, 18, 4),
        P('agenda', 'Arah kajian masa depan (RQ4)', 'Satu ayat pengantar dan lima butiran bernombor, setiap satu bermula dengan tajuk kecil dua hingga tiga patah perkataan dan diikuti dua hingga empat ayat.', 406, 9, 6)
      ],
      ajar: ['Setiap subbahagian dibuka dengan ayat yang menyebut soalan kajian yang dijawab.', 'Dapatan disintesis merentas ulasan (bilangan ulasan yang bersetuju disebut), bukan dilaporkan satu ulasan demi satu ulasan.', 'Jadual memikul butiran setiap ulasan supaya teks boleh menumpu kepada sintesis.'],
      elak: ['Tema dan kerangka (TPACK) adalah khusus kepada topik artikel contoh; gantikan dengan tema kajian sendiri.'] },
    { p: 'perbincangan', bm: 'Perbincangan', en: 'Discussion', kata: 1404, per: 13, sit: 15,
      sub: [S('Implikasi', 'Implications', 427, 4, 3), S('Batasan dan Cadangan Kajian Lanjutan', 'Limitations and recommendations for future research', 430, 4, 7)],
      peta: [
        P('rumus', 'Rumusan dapatan utama', 'Satu perenggan yang bermula dengan bilangan ulasan yang disintesis dan menyatakan dapatan menyeluruh, tanpa sitasi.', 104, 0),
        P('tafsir', 'Tafsiran merentas tema', 'Empat perenggan. Setiap satu mengambil satu dapatan dan menafsirkannya pada aras sistem (guru, institusi, konteks), dengan sitasi yang sedikit.', 443, 5, 4),
        P('implikasi', 'Implikasi', 'Empat perenggan dengan penanda urutan (pertama, kedua, ketiga, akhirnya): pemimpin sekolah dan penggubal dasar, institusi pendidikan guru, pembangunan profesional, dan komuniti penyelidik.', 427, 3, 4),
        P('had', 'Batasan', 'Satu perenggan panjang (lapan ayat): kekuatan kaedah dahulu, kemudian batasannya, termasuk kebergantungan pada kualiti ulasan yang dirangkum.', 220, 4),
        P('agenda', 'Cadangan kajian lanjutan', 'Tiga perenggan pendek, setiap satu satu cadangan yang diturunkan daripada dapatan.', 210, 3, 3)
      ],
      ajar: ['Implikasi disusun mengikut pihak yang dituju.', 'Batasan dibuka dengan kekuatan kaedah sebelum kelemahannya.'], elak: [] },
    { p: 'kesimpulan', bm: 'Kesimpulan', en: 'Conclusion', kata: 113, per: 1, sit: 0,
      peta: [P('kesimpulan', 'Kesimpulan', 'Satu perenggan tanpa sitasi: penegasan semula peranan guru, dapatan terpenting dan mesej akhir.', 113, 0)],
      ajar: ['Kesimpulan satu perenggan sahaja dan tidak mengulang angka.'], elak: [] }
  ]
});

const BERSEPADU = siap({
  id: 'bersepadu-gause-2022', kel: 'slr', pendek: 'Gause et al. (2022)', anggar: true, notaUkur: 'Angka ialah anggaran hampir daripada bacaan teks penuh artikel dalam PubMed Central.',
  rujukan: 'Gause, G., Mokgaola, I. O., & Rakhudu, M. A. (2022). Technology usage for teaching and learning in nursing education: An integrative review. Curationis, 45(1), e1-e9. https://doi.org/10.4102/curationis.v45i1.2261',
  doi: '10.4102/curationis.v45i1.2261', jurnal: 'Curationis', lesen: 'Akses terbuka',
  tajuk: 'Technology usage for teaching and learning in nursing education: An integrative review',
  sebab: 'Ulasan bersepadu yang paling jelas memperlihatkan reka bentuknya: lima langkah Whittemore dan Knafl (2005) dijadikan subtajuk Metodologi, dan dapatan disusun mengikut tema. Topiknya, penggunaan teknologi dalam pengajaran dan pembelajaran, dekat dengan bidang pemilik walaupun konteksnya pendidikan kejururawatan. Dipilih oleh Prof Dr.',
  reka: 'Ulasan literatur bersepadu mengikut kerangka lima langkah Whittemore dan Knafl (2005): pengenalpastian masalah, carian literatur, penilaian data, analisis data dan pembentangan data. Carian dalam tiga pangkalan data (2016 hingga 2021), rajah aliran PRISMA yang diadaptasi, penilaian kualiti empat domain, dan analisis tematik induktif enam langkah. 19 artikel empirikal dan bukan empirikal. Enam tema. Satu jadual dan tiga rajah.',
  ciri: [
    'Pendahuluan empat perenggan: kepentingan, peranan, faedah, kemudian cabaran; tujuan dan soalan ulasan diberi subtajuk sendiri, masing-masing satu ayat.',
    'Metodologi dibuka dengan takrif ulasan bersepadu dan menamakan kerangka lima langkah, yang ditunjukkan dalam satu rajah.',
    'Setiap langkah kerangka menjadi satu subtajuk Metodologi, dengan nombor langkah dalam tajuknya.',
    'Keputusan persampelan (kata kunci, tempoh, penapis, kriteria) diwajarkan satu demi satu, seperti yang diminta oleh kerangka.',
    'Penilaian kualiti dilaporkan dalam satu jadual yang juga memikul tujuan, reka bentuk dan dapatan utama setiap artikel.',
    'Tema disenaraikan dalam Analisis Data dan diulang sebagai peta jalan pada awal Dapatan.',
    'Setiap tema dibuka dengan satu atau dua ayat yang menyatakan apa yang dibincangkan, kemudian dipecahkan mengikut konteks (bilik darjah dan klinikal).',
    'Batasan diberi subtajuk sendiri selepas Perbincangan, dan Kesimpulan ditutup dengan cadangan kajian lanjutan.'
  ],
  abstrak: { bentuk: 'Berstruktur dengan enam label (Background, Objectives, Method, Results, Conclusion, Contribution), kira-kira 215 patah perkataan.', cara: 'Latar tiga ayat, tujuan satu ayat, kerangka dan pangkalan data, bilangan artikel dan senarai tema, kesimpulan dua ayat, dan sumbangan satu ayat.' },
  ukuran: { abstrak: 215, berstruktur: true, kataKunci: 0, rujukan: 0, jadual: 1, rajah: 3 },
  suai: [
    'Kekalkan lima langkah Whittemore dan Knafl sebagai subtajuk Metodologi; itulah ciri pengenalan ulasan bersepadu.',
    'Cetak rentetan carian penuh bagi setiap pangkalan data dan gunakan rajah aliran PRISMA 2020.',
    'Perkukuh penilaian kualiti dengan alat yang sesuai bagi pelbagai reka bentuk, contohnya MMAT, kerana ulasan bersepadu menggabungkan kajian kuantitatif, kualitatif dan teori.',
    'Perbincangan artikel contoh ringkas dan kurang bersandar pada teori; untuk jurnal berindeks Scopus atau WoS, tambah tafsiran berteori dan bandingkan dengan ulasan lain.',
    'Tukar tema kepada tema kajian Prof Dr dan pecahkan setiap tema mengikut konteks kajian sendiri.'
  ],
  bahagian: [
    { p: 'pendahuluan', bm: 'Pendahuluan', en: 'Introduction', kata: 700, per: 6, sit: 17,
      sub: [S('Tujuan', 'Aim', 22, 1, 0), S('Soalan Ulasan Bersepadu', 'Integrative review question', 14, 1, 0)],
      peta: [
        P('konteks', 'Kepentingan dan perubahan landskap', 'Enam ayat. Bermula dengan pemerhatian umum tentang teknologi dalam kehidupan harian, menyempit kepada pengajaran dan pembelajaran, dan berakhir dengan peristiwa semasa yang menjadikan topik mendesak.', 150, 4),
        P('bukti', 'Peranan teknologi dan faedahnya', 'Dua perenggan. Yang pertama menegaskan peranan teknologi dan ditutup dengan tiga kajian yang melaporkan faedah; yang kedua menghuraikan faedah itu dalam dua konteks.', 375, 9, 2),
        P('jurang', 'Cabaran yang masih ada', 'Satu perenggan yang membawa pandangan bertentangan dan empat jenis cabaran, setiap satu dengan sitasi. Ayat terakhir perenggan sebelumnya menjadi jambatan (walaupun ada faedah, masih ada cabaran).', 135, 4),
        P('tujuan', 'Tujuan ulasan', 'Satu ayat di bawah subtajuk sendiri, dengan dua kata kerja (meneroka dan menghuraikan).', 22, 0),
        P('soalan', 'Soalan ulasan', 'Satu soalan sahaja di bawah subtajuk sendiri, bermula dengan frasa tentang bukti yang wujud.', 14, 0)
      ],
      ajar: ['Tujuan dan soalan ulasan mudah dicari kerana diberi subtajuk sendiri.', 'Satu soalan ulasan yang luas, sesuai dengan sifat ulasan bersepadu.'],
      elak: ['Jurang tidak dinyatakan secara eksplisit dalam Pendahuluan (ia muncul dalam Langkah 1); untuk artikel sendiri, nyatakan apa yang belum disintesis sebelum tujuan.'] },
    { p: 'kaedah', bm: 'Reka Bentuk dan Kaedah', en: 'Design and methods', kata: 1125, per: 10, sit: 8, jadual: 1, rajah: 3,
      sub: [S('Langkah 1: Pengenalpastian Masalah', 'Step 1: Problem identification', 150, 2, 0), S('Langkah 2: Carian Literatur', 'Step 2: Literature search', 430, 3, 3), S('Langkah 3: Penilaian Data', 'Step 3: Data evaluation', 150, 1, 2), S('Langkah 4: Analisis Data', 'Step 4: Data analysis', 180, 1, 0), S('Pertimbangan Etika', 'Ethical considerations', 60, 1, 0), S('Langkah 5: Pembentangan Data', 'Step 5: Data presentation', 18, 1, 0)],
      peta: [
        P('reka', 'Reka bentuk dan kerangka', 'Lima ayat sebelum subtajuk pertama: reka bentuk dinamakan, ulasan bersepadu ditakrifkan dengan sitasi, kepentingannya dinyatakan, dan kerangka lima langkah dinamakan serta dirujuk kepada satu rajah.', 135, 3),
        P('jurang', 'Langkah 1: masalah dan tujuan', 'Dua perenggan. Yang pertama mewajarkan ulasan daripada perubahan semasa yang belum diliputi kajian lepas; yang kedua mengulang tujuan dan menamakan pemboleh ubah serta populasi ulasan.', 150, 0, 2),
        P('carian', 'Langkah 2: carian dan kriteria', 'Satu perenggan sangat panjang yang menamakan pangkalan data dan sebab pemilihannya, kata kunci dan operator Boolean dengan contoh, sinonim, tempoh berserta justifikasinya dan penapis, kemudian dua perenggan pendek yang merujuk rajah aliran dan rajah kriteria.', 430, 3, 3),
        P('ekstrak', 'Langkah 3: penilaian kualiti', 'Satu perenggan: bilangan artikel akhir, alat penilaian dan empat domainnya, skala tiga mata, sebab alat dipilih, dan pernyataan bahawa tiada artikel ditolak atas dasar kualiti. Ditutup dengan taburan reka bentuk kajian. Jadual penilaian diletakkan di sini.', 150, 2),
        P('analisis', 'Langkah 4: analisis tematik', 'Satu perenggan yang menyenaraikan enam langkah analisis tematik, menerangkan setiap langkah dengan penanda urutan, menyatakan pendekatan induktif, dan menyenaraikan tema yang muncul.', 180, 0),
        P('etika', 'Pertimbangan etika', 'Tiga ayat: kelulusan jawatankuasa etika dengan nombor rujukan, pematuhan piawaian, dan syarat bahawa kajian yang dirangkum mempunyai kelulusan etika.', 60, 0),
        P('rumus', 'Langkah 5: pembentangan', 'Satu ayat jambatan yang menyerahkan pembaca kepada bahagian Dapatan.', 18, 0)
      ],
      ajar: ['Setiap langkah kerangka boleh dikesan terus daripada subtajuk.', 'Setiap keputusan carian diberi sebab, bukan sekadar dilaporkan.'],
      elak: ['Rentetan carian penuh bagi setiap pangkalan data tidak dicetak, dan bilangan rekod pada setiap peringkat hanya ada dalam rajah; nyatakan kedua-duanya dalam teks artikel sendiri.', 'Kriteria penerimaan dan penolakan berada dalam rajah; jurnal lazimnya lebih suka jadual.'] },
    { p: 'dapatan', bm: 'Dapatan', en: 'Results', kata: 1750, per: 16, sit: 35,
      sub: [S('Tema 1', 'Theme 1', 190, 2, 4), S('Tema 2', 'Theme 2', 500, 4, 12), S('Tema 3', 'Theme 3', 200, 2, 3), S('Tema 4', 'Theme 4', 300, 3, 7), S('Tema 5', 'Theme 5', 230, 3, 5), S('Tema 6', 'Theme 6', 215, 1, 4)],
      peta: [
        P('rumus', 'Peta jalan dapatan', 'Dua ayat utama: senarai tema bernombor dalam satu ayat, dan satu ayat tentang istilah setara yang turut dirangkum.', 95, 0),
        P('tema', 'Tema tentang kekerapan atau keluasan fenomena', 'Satu ayat pengantar tema, kemudian satu perenggan yang bergerak daripada tuntutan umum kepada bukti khusus, dengan empat sitasi.', 190, 4, 2),
        P('tema', 'Tema yang dipecahkan mengikut dua konteks', 'Satu ayat pengantar, kemudian subtajuk aras tiga bagi setiap konteks. Setiap perenggan dibuka dengan nama pengarang dan menyusun bukti daripada kegunaan lazim kepada pengecualian atau pandangan bertentangan.', 500, 12, 4),
        P('tema', 'Tema tentang prasyarat', 'Dua ayat pengantar, kemudian satu perenggan yang menyenaraikan prasyarat, menyokongnya dengan tiga kajian, dan ditutup dengan satu ayat rumusan pengulas sendiri.', 200, 3, 2),
        P('banding', 'Tema kelebihan dan kekurangan', 'Dua tema berpasangan, setiap satu dipecahkan mengikut dua konteks. Perenggan menggabungkan peratusan daripada kajian primer dengan tafsiran pengulas.', 530, 12, 6),
        P('tema', 'Tema tentang peristiwa semasa', 'Satu perenggan panjang: kesan peristiwa, tiga cabaran sebagai senarai bernombor dalam ayat, punca cabaran, dan satu ayat penutup yang kembali kepada trend umum.', 215, 4)
      ],
      ajar: ['Setiap tema dibuka dengan ayat yang menyatakan skopnya.', 'Pemecahan mengikut konteks menjadikan perbandingan antara konteks mudah dilihat.'],
      elak: ['Sesetengah subtajuk hanya mempunyai satu subtajuk aras tiga; elakkan subtajuk tunggal dalam artikel sendiri.', 'Ciri artikel yang dirangkum (negara, reka bentuk, tahun) tidak dirumuskan dalam teks; tambah satu perenggan ciri sebelum tema.'] },
    { p: 'perbincangan', bm: 'Perbincangan', en: 'Discussion', kata: 520, per: 4, sit: 4,
      sub: [S('Batasan Kajian', 'Limitations of the study', 125, 1, 0)],
      peta: [
        P('rumus', 'Dapatan utama dan sokongannya', 'Lima ayat: sumbangan ulasan, dapatan menyeluruh, bukti yang menyokong, satu kajian yang selari, dan apa lagi yang dirumuskan.', 120, 1),
        P('tafsir', 'Dapatan merentas konteks dan percanggahan', 'Satu perenggan yang membandingkan dua konteks, mengemukakan dapatan yang bercanggah dengan dua sitasi, dan ditutup dengan pernyataan tentang apa yang belum dibuktikan.', 135, 2),
        P('banding', 'Kekurangan dan konteks pengulas', 'Satu perenggan yang mengaitkan cabaran dalam literatur dengan konteks geografi pengulas, dan ditutup dengan pemerhatian tentang ciri bersama artikel yang dirangkum.', 140, 1),
        P('had', 'Batasan', 'Satu perenggan dengan tiga batasan bertanda urutan: istilah carian, tempoh, dan skop disiplin, setiap satu dengan kesannya terhadap dapatan.', 125, 0)
      ],
      ajar: ['Batasan dinyatakan bersama kesannya terhadap dapatan.'],
      elak: ['Perbincangan pendek dan hampir tanpa teori (kira-kira 12% badan teks, empat sitasi); untuk artikel sendiri, panjangkan dan sandarkan tafsiran pada teori serta ulasan lain.', 'Implikasi kepada amalan tidak ditulis sebagai bahagian sendiri; tambah jika jurnal sasaran memintanya.'] },
    { p: 'kesimpulan', bm: 'Kesimpulan', en: 'Conclusion', kata: 110, per: 1, sit: 0,
      peta: [P('kesimpulan', 'Kesimpulan dan cadangan', 'Satu perenggan lima ayat tanpa sitasi: dapatan utama, dapatan kedua, jurang yang masih ada, dan dua cadangan kajian lanjutan.', 110, 0)],
      ajar: ['Kesimpulan ditutup dengan cadangan kajian yang khusus.'], elak: [] }
  ]
});

export const ACUAN_JENIS = { 'ul-payung': PAYUNG, 'ul-bersepadu': BERSEPADU };
