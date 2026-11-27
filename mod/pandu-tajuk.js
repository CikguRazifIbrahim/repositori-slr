/* Pandu Tulis: TAJUK DAN SUBTAJUK ASAL artikel contoh (v1.53.0).
   Bagi setiap acuan terbina (pandu-acuan.js), fail ini menyimpan tajuk bahagian dan semua subtajuk SEPERTI YANG DICETAK dalam artikel
   contoh itu, mengikut urutan asalnya, supaya folder dan subseksyen manuskrip pemilik boleh disalin tepat daripadanya tanpa pemilik
   perlu menamakan subtajuk sendiri. Sumber: teks penuh setiap artikel dalam PubMed Central (PMCID dicatat pada setiap entri) atau laman penerbit.
   Yang disalin hanyalah tajuk dan subtajuk (bukan ayat artikel); nombor tajuk dibuang kerana aplikasi menomborkan sendiri.

   Bentuk: TAJUK[id acuan][kunci bahagian] = { t: [Bahasa Melayu, asal], sub: [[aras, asal, Bahasa Melayu], ...] }
   - "asal" ialah tajuk seperti dicetak (Bahasa Inggeris); lajur Bahasa Melayu ialah terjemahan setia bagi manuskrip berbahasa Melayu.
   - aras 2 ialah subtajuk di bawah tajuk bahagian; aras 3 ialah subtajuk di bawah subtajuk aras 2 sebelumnya. Aplikasi menyokong tiga aras.
   - Kunci bahagian sama dengan kunci folder (pendahuluan, literatur, kaedah, dapatan, perbincangan, kesimpulan, kerangka, badan, badan2).
   - Apabila artikel contoh mempunyai lebih banyak bahagian utama daripada folder (contohnya bahagian Limitations yang berdiri sendiri),
     bahagian utama tambahan itu diletakkan sebagai subtajuk aras 2 dalam folder yang memikulnya; hal ini dicatat dalam medan nota.
   Acuan yang tiada dalam fail ini (teks penuhnya tidak dapat dicapai ketika fail ini dibina) menggunakan subtajuk umum pandu-acuan.js. */
export const TAJUK = {
  /* Bice dan Tang (2022), PMC9002040 */
  'campur-bice-2022': {
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    literatur: { t: ['Kajian Literatur', 'Literature review'], sub: [
      [2, 'Technology integration', 'Integrasi teknologi'],
      [2, 'Teachers’ beliefs about technology', 'Kepercayaan guru tentang teknologi'],
      [3, 'Pedagogical beliefs', 'Kepercayaan pedagogi'],
      [3, 'Value beliefs', 'Kepercayaan nilai'],
      [2, 'Alignment of beliefs and practices', 'Keselarasan antara kepercayaan dengan amalan']] },
    kaedah: { t: ['Kaedah', 'Method'], sub: [
      [2, 'Setting', 'Latar kajian'],
      [2, 'Participants', 'Peserta'],
      [3, 'Survey participants', 'Peserta tinjauan'],
      [3, 'Interview and observation participants', 'Peserta temu bual dan pemerhatian'],
      [2, 'Data collection', 'Pengumpulan data'],
      [3, 'Survey', 'Tinjauan'],
      [3, 'Interviews', 'Temu bual'],
      [3, 'Observations', 'Pemerhatian'],
      [2, 'Data analysis', 'Analisis data'],
      [3, 'Quantitative', 'Kuantitatif'],
      [3, 'Qualitative', 'Kualitatif']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'Quantitative results', 'Dapatan kuantitatif'],
      [3, 'Technology access and support', 'Akses dan sokongan teknologi'],
      [3, 'Importance of technology in teaching and learning', 'Kepentingan teknologi dalam pengajaran dan pembelajaran'],
      [3, 'Technology use by students', 'Penggunaan teknologi oleh murid'],
      [3, 'Technology use by teachers', 'Penggunaan teknologi oleh guru'],
      [2, 'Qualitative findings', 'Dapatan kualitatif'],
      [3, 'Theme 1: Teachers’ beliefs about the role of technology are influenced by their level of technology integration', 'Tema 1: Kepercayaan guru tentang peranan teknologi dipengaruhi oleh tahap integrasi teknologi mereka'],
      [3, 'Theme 2: Teachers believe technology use should be balanced with multisensory methods', 'Tema 2: Guru percaya penggunaan teknologi perlu diseimbangkan dengan kaedah pelbagai deria'],
      [3, 'Theme 3: Teachers are motivated to use tools that are easy for them and their students', 'Tema 3: Guru terdorong menggunakan alat yang mudah bagi mereka dan murid mereka'],
      [3, 'Theme 4: Teachers’ beliefs are dynamic', 'Tema 4: Kepercayaan guru bersifat dinamik']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [
      [2, 'What are teachers’ beliefs about the role of technology in teaching and learning?', 'Apakah kepercayaan guru tentang peranan teknologi dalam pengajaran dan pembelajaran?'],
      [3, 'Teachers’ beliefs about technology and their practices of technology integration', 'Kepercayaan guru tentang teknologi dan amalan integrasi teknologi mereka'],
      [3, 'School culture influenced teachers’ beliefs', 'Budaya sekolah mempengaruhi kepercayaan guru'],
      [3, 'Teacher beliefs evolved with time', 'Kepercayaan guru berubah mengikut masa'],
      [2, 'How do teachers’ observed classroom practices align with their stated beliefs about technology?', 'Bagaimanakah amalan bilik darjah guru yang diperhatikan selaras dengan kepercayaan yang mereka nyatakan tentang teknologi?'],
      [2, 'Implications for practice', 'Implikasi kepada amalan'],
      [2, 'Limitations and future research', 'Batasan dan kajian lanjutan']] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusion'], sub: [] }
  },
  /* McLeod dan Dulsky (2021), teks penuh Frontiers in Education (JATS XML) */
  'kual-mcleod-2021': {
    nota: 'Bahagian pembuka artikel contoh tidak bertajuk, maka folder Pendahuluan mengekalkan tajuk umum.',
    pendahuluan: { sub: [] },
    literatur: { t: ['Ulasan Literatur', 'Review of the Literature'], sub: [
      [2, 'What Is Crisis Leadership?', 'Apakah Kepimpinan Krisis?'],
      [2, 'Crisis Leadership in Schools', 'Kepimpinan Krisis di Sekolah'],
      [2, 'Crisis Leadership in Schools During the Pandemic', 'Kepimpinan Krisis di Sekolah Semasa Pandemik']] },
    kaedah: { t: ['Kaedah', 'Methods'], sub: [] },
    dapatan: { t: ['Dapatan', 'Findings'], sub: [
      [2, 'Vision and Values', 'Visi dan Nilai'],
      [2, 'Communication and Family Community Engagement', 'Komunikasi dan Penglibatan Keluarga serta Komuniti'],
      [2, 'Staff Care, Instructional Leadership, and Organizational Capacity-Building', 'Penjagaan Staf, Kepimpinan Instruksional dan Pembinaan Kapasiti Organisasi'],
      [2, 'Equity-Oriented Leadership', 'Kepimpinan Berorientasikan Ekuiti'],
      [2, 'Silver Linings and Future Opportunities', 'Hikmah dan Peluang Masa Depan']] },
    perbincangan: { t: ['Perbincangan dan Implikasi', 'Discussion and Implications'], sub: [] }
  },
  /* Tzafilkou et al. (2022), PMC9107949 */
  'instr-tzafilkou-2022': {
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    literatur: { t: ['Kajian Berkaitan', 'Related works'], sub: [] },
    kaedah: { t: ['Bahan dan Kaedah', 'Materials and methods'], sub: [
      [2, 'Instrument', 'Instrumen'],
      [2, 'Sample characteristics and data collection', 'Ciri sampel dan pengumpulan data'],
      [2, 'Data analysis', 'Analisis data']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'Confirmatory factor analysis', 'Analisis faktor pengesahan'],
      [2, 'Student differences across the SDiCoS components', 'Perbezaan pelajar merentas komponen SDiCoS']] },
    perbincangan: { t: ['Perbincangan, Implikasi dan Batasan', 'Discussion, implications, and limitations'], sub: [] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusions'], sub: [] }
  },
  /* Karsikas et al. (2022), PMC9542587 */
  'skop-karsikas-2022': {
    nota: 'Artikel contoh mempunyai sembilan bahagian utama. Aim and research questions, Inclusion criteria, Limitations dan Implications for nursing management ialah bahagian utama dalam artikel itu; di sini setiap satunya menjadi subtajuk dalam folder yang memikulnya. Tiga tajuk tema aras empat di bawah Review findings tidak dimasukkan kerana aplikasi menyokong tiga aras.',
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [
      [2, 'Aim and research questions', 'Tujuan dan soalan kajian']] },
    kaedah: { t: ['Kaedah', 'Methods'], sub: [
      [2, 'Inclusion criteria', 'Kriteria penerimaan'],
      [2, 'Search strategy', 'Strategi carian'],
      [2, 'Study selection', 'Pemilihan kajian'],
      [2, 'Data extraction, analysis, and presentation', 'Pengekstrakan, analisis dan pembentangan data']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'Article inclusion', 'Artikel yang diterima'],
      [2, 'Characteristics of the included studies', 'Ciri kajian yang diterima'],
      [2, 'Review findings', 'Dapatan ulasan'],
      [3, 'Health care managers’ competence in knowledge management', 'Kompetensi pengurus penjagaan kesihatan dalam pengurusan pengetahuan'],
      [3, 'Instruments used to study managers’ competence in knowledge management', 'Instrumen yang digunakan untuk mengkaji kompetensi pengurus dalam pengurusan pengetahuan']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [
      [2, 'Limitations', 'Batasan']] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusions'], sub: [
      [2, 'Implications for nursing management', 'Implikasi kepada pengurusan kejururawatan']] }
  },
  /* Tummers dan Bakker (2021), PMC8514935 */
  'slr-tummers-2021': {
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    literatur: { t: ['Latar Teori JD-R dan Kepimpinan', 'A Background on JD-R Theory and Leadership'], sub: [
      [2, 'Job Demands-Resources Theory', 'Teori Tuntutan dan Sumber Kerja'],
      [2, 'Leadership', 'Kepimpinan']] },
    kaedah: { t: ['Kaedah', 'Method'], sub: [
      [2, 'Eligibility Criteria', 'Kriteria Kelayakan'],
      [2, 'Literature Search', 'Carian Literatur']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'Method and Design', 'Kaedah dan Reka Bentuk'],
      [2, 'Leadership Concepts', 'Konsep Kepimpinan'],
      [2, 'Connecting Leadership and Job-Demands Resources Theory', 'Menghubungkan Kepimpinan dengan Teori Tuntutan dan Sumber Kerja'],
      [2, 'Three Main Connections Between Leadership and JD-R Theory', 'Tiga Hubungan Utama antara Kepimpinan dengan Teori JD-R']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [
      [2, 'Future Research Directions', 'Arah Kajian Masa Depan'],
      [2, 'Implications for Practitioners', 'Implikasi kepada Pengamal']] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusion'], sub: [] }
  },
  /* Zeng et al. (2022), PMC9755589 */
  'meta-zeng-2022': {
    nota: 'Dalam artikel contoh, tiga subtajuk folder Kajian Literatur dicetak di bawah Introduction tanpa tajuk bahagian sendiri, maka tajuk folder itu bukan tajuk asal artikel. Limitations ialah bahagian yang berdiri sendiri dalam artikel; di sini ia menjadi subtajuk terakhir folder Perbincangan.',
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    literatur: { sub: [
      [2, 'Concept and measurement of information technology integration self-efficacy', 'Konsep dan pengukuran efikasi kendiri integrasi teknologi maklumat'],
      [2, 'The relationship between information technology integration self-efficacy and TPACK', 'Hubungan antara efikasi kendiri integrasi teknologi maklumat dengan TPACK'],
      [2, 'Moderating variables of the relationship between information technology integration self-efficacy and TPACK', 'Pemboleh ubah penyederhana bagi hubungan antara efikasi kendiri integrasi teknologi maklumat dengan TPACK'],
      [3, 'Gender', 'Jantina'],
      [3, 'Measurement tools', 'Alat pengukuran'],
      [3, 'Career stages, disciplines and teaching stages', 'Peringkat kerjaya, disiplin dan peringkat pengajaran']] },
    kaedah: { t: ['Kaedah dan Bahan', 'Methods and materials'], sub: [
      [2, 'Literature search and screening', 'Carian dan saringan literatur'],
      [3, 'Literature search', 'Carian literatur'],
      [3, 'Literature selection criteria', 'Kriteria pemilihan literatur'],
      [3, 'Literature screening process', 'Proses saringan literatur'],
      [2, 'Document coding', 'Pengekodan dokumen'],
      [2, 'Data analysis', 'Analisis data']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'Homogeneity test', 'Ujian homogeniti'],
      [2, 'Assessment of publication bias', 'Penilaian bias penerbitan'],
      [2, 'Main effect test', 'Ujian kesan utama'],
      [2, 'Moderating effect test', 'Ujian kesan penyederhana']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [
      [2, 'Relationship between teachers’ information technology integration self-efficacy and TPACK', 'Hubungan antara efikasi kendiri integrasi teknologi maklumat guru dengan TPACK'],
      [2, 'Moderating effect of the relationship between teachers’ information technology integration self-efficacy and TPACK', 'Kesan penyederhana bagi hubungan antara efikasi kendiri integrasi teknologi maklumat guru dengan TPACK'],
      [3, 'The moderating role of gender', 'Peranan penyederhana jantina'],
      [3, 'The moderating role of career stages', 'Peranan penyederhana peringkat kerjaya'],
      [3, 'The moderating role of measurement tools', 'Peranan penyederhana alat pengukuran'],
      [3, 'The moderating role of teaching stages and disciplines', 'Peranan penyederhana peringkat pengajaran dan disiplin'],
      [2, 'Limitations', 'Batasan']] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusions'], sub: [] }
  },
  /* Rojas-Sánchez et al. (2023), PMC9244075 */
  'biblio-rojas-2023': {
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    literatur: { t: ['Ulasan Literatur tentang Analisis Bibliometrik', 'Review of the literature on bibliometric analysis'], sub: [] },
    kaedah: { t: ['Metodologi', 'Methodology'], sub: [
      [2, 'Dataset', 'Set data'],
      [2, 'Identification of sources', 'Pengenalpastian sumber'],
      [2, 'Study selection criteria', 'Kriteria pemilihan kajian'],
      [2, 'Data analysis process', 'Proses analisis data']] },
    dapatan: { t: ['Dapatan', 'Results'], sub: [
      [2, 'SLR articles on VR and education', 'Artikel SLR tentang VR dan pendidikan'],
      [2, 'Main statistical indicators', 'Penunjuk statistik utama'],
      [2, 'Performance analysis', 'Analisis prestasi'],
      [3, 'Overview of the analyzed data set', 'Gambaran keseluruhan set data yang dianalisis'],
      [3, 'Relevant information on the journals included in the dataset', 'Maklumat berkaitan jurnal dalam set data'],
      [3, 'Authors with most impact according to h-index', 'Pengarang paling berimpak mengikut indeks h'],
      [3, 'Main documents and most frequently used words in the dataset', 'Dokumen utama dan perkataan paling kerap digunakan dalam set data'],
      [2, 'Scientific mapping analysis', 'Analisis pemetaan sains'],
      [3, 'Main topics in keywords plus according to factor analysis', 'Topik utama dalam Keywords Plus mengikut analisis faktor'],
      [3, 'Co-occurrence network mapping', 'Pemetaan rangkaian kewujudan bersama'],
      [3, 'Productivity mapping of items by country', 'Pemetaan produktiviti item mengikut negara'],
      [3, 'Collaboration between countries mapping', 'Pemetaan kerjasama antara negara'],
      [2, 'Second stage analysis', 'Analisis peringkat kedua'],
      [3, 'VR-based instruction and learning', 'Pengajaran dan pembelajaran berasaskan VR'],
      [3, 'VR learning environments', 'Persekitaran pembelajaran VR'],
      [3, 'Use of VR in various fields of knowledge', 'Penggunaan VR dalam pelbagai bidang ilmu'],
      [3, 'Learning with VR apps, devices or games', 'Pembelajaran dengan aplikasi, peranti atau permainan VR'],
      [3, 'Learning processes using simulation', 'Proses pembelajaran menggunakan simulasi'],
      [3, 'Topics published during the Covid-19 pandemic', 'Topik yang diterbitkan semasa pandemik Covid-19']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusions'], sub: [] }
  },
  /* Timotheou et al. (2023), PMC9684747 */
  'naratif-timotheou-2023': {
    nota: 'Dalam artikel contoh, kesan dan faktor berada di bawah satu bahagian Findings. Di sini bahagian itu dipecahkan kepada dua folder supaya nisbah panjangnya dapat dipandu: folder pertama membawa tajuk Findings dan folder kedua membawa tajuk subbahagian faktornya.',
    pendahuluan: { t: ['Pendahuluan', 'Introduction'], sub: [] },
    kaedah: { t: ['Metodologi', 'Methodology'], sub: [] },
    badan: { t: ['Dapatan', 'Findings'], sub: [
      [2, 'Impacts of digital technologies on students’ knowledge, skills, attitudes, and emotions', 'Kesan teknologi digital terhadap pengetahuan, kemahiran, sikap dan emosi murid'],
      [2, 'Impacts of digital technologies on equality, inclusion and social integration', 'Kesan teknologi digital terhadap kesaksamaan, keterangkuman dan integrasi sosial'],
      [2, 'Impacts of digital technologies on teachers’ professional and teaching practices', 'Kesan teknologi digital terhadap amalan profesional dan pengajaran guru'],
      [2, 'Impacts of digital technologies on other school-related aspects and stakeholders', 'Kesan teknologi digital terhadap aspek lain berkaitan sekolah dan pihak berkepentingan']] },
    badan2: { t: ['Faktor yang Mempengaruhi Integrasi Teknologi Digital', 'Factors that affect the integration of digital technologies'], sub: [
      [2, 'Digital competencies', 'Kompetensi digital'],
      [2, 'Teachers’ personal characteristics, training approaches, and professional development', 'Ciri peribadi guru, pendekatan latihan dan pembangunan profesional'],
      [2, 'School leadership and management', 'Kepimpinan dan pengurusan sekolah'],
      [2, 'Connectivity, infrastructure, and government and other support', 'Kesalinghubungan, infrastruktur serta sokongan kerajaan dan pihak lain'],
      [2, 'Administration and digital data management', 'Pentadbiran dan pengurusan data digital'],
      [2, 'Students’ socioeconomic background and family support', 'Latar sosioekonomi murid dan sokongan keluarga'],
      [2, 'Schools’ socioeconomic context and emergency situations', 'Konteks sosioekonomi sekolah dan situasi kecemasan']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [] },
    kesimpulan: { t: ['Kesimpulan', 'Conclusions'], sub: [
      [2, 'Study limitations and future directions', 'Batasan kajian dan arah masa depan']] }
  },
  /* Ng et al. (2023), PMC9943036 */
  'konsep-ng-2023': {
    nota: 'Artikel contoh tidak mempunyai tajuk Introduction; bahagian pembukanya bertajuk Opportunities and challenges brought by the pandemic, dan tajuk itulah yang disalin bagi folder Pendahuluan.',
    pendahuluan: { t: ['Peluang dan Cabaran yang Dibawa oleh Pandemik', 'Opportunities and challenges brought by the pandemic'], sub: [] },
    literatur: { t: ['Motivasi bagi Kompetensi Digital AI Guru', 'Motivation for teachers’ AI digital competency'], sub: [
      [2, 'AI turns online teaching crisis to opportunities', 'AI mengubah krisis pengajaran dalam talian menjadi peluang'],
      [2, 'Opportunities of using AIED for online teaching', 'Peluang penggunaan AIED bagi pengajaran dalam talian'],
      [2, 'Challenges of using AIED for online teaching', 'Cabaran penggunaan AIED bagi pengajaran dalam talian'],
      [2, 'AI competencies', 'Kompetensi AI'],
      [2, 'Teachers’ AI digital competency', 'Kompetensi digital AI guru']] },
    kerangka: { t: ['Kerangka Pendidikan bagi Pendidik', 'Educational frameworks for educators'], sub: [
      [2, 'DigCompEdu framework', 'Kerangka DigCompEdu'],
      [3, 'Professional engagement', 'Penglibatan profesional'],
      [3, 'Digital resources', 'Sumber digital'],
      [3, 'Teaching and learning', 'Pengajaran dan pembelajaran'],
      [3, 'Assessment', 'Pentaksiran'],
      [3, 'Empowering learners', 'Memperkasakan murid'],
      [3, 'Facilitating learners’ AI competency', 'Memudah cara kompetensi AI murid'],
      [2, 'P21’s framework for twenty-first century learning', 'Kerangka P21 bagi pembelajaran abad kedua puluh satu'],
      [3, 'Core subjects, 3Rs and twenty-first century themes', 'Mata pelajaran teras, 3M dan tema abad kedua puluh satu'],
      [3, 'Learning and innovation skills', 'Kemahiran pembelajaran dan inovasi'],
      [3, 'Information, media and technology skills', 'Kemahiran maklumat, media dan teknologi'],
      [3, 'Life and career skills', 'Kemahiran hidup dan kerjaya']] },
    perbincangan: { t: ['Perbincangan', 'Discussion'], sub: [
      [2, 'Recommendations', 'Cadangan']] },
    kesimpulan: { t: ['Kesimpulan dan Cadangan', 'Conclusions and recommendations'], sub: [] }
  }
};
/* Tajuk asal bagi satu bahagian acuan terbina, atau null jika belum direkodkan. */
export const tajukAsal = (idAcuan, kunciBahagian) => (TAJUK[idAcuan] || {})[kunciBahagian] || null;
export const notaTajuk = idAcuan => (TAJUK[idAcuan] || {}).nota || '';
