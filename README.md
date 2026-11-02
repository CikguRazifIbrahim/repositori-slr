# Repositori SLR

Aplikasi web boleh pasang (PWA) untuk merekod 13 medan ekstrak bagi setiap artikel jurnal, menyimpan PDF dalam Google Drive dan menyegerakkan rekod ke semua peranti (Windows, Android, pelayar).

Rekod disimpan dalam **Firestore** (projek Firebase sendiri, percuma, sokongan luar talian). Fail PDF disimpan dalam folder **"Repositori SLR"** di **Google Drive** akaun sendiri (percuma, 15 GB). Kod aplikasi dihoskan di **GitHub Pages**.

## Persediaan sekali sahaja

Semua langkah di bawah dibuat dalam pelayar pada komputer. Anggaran masa: 20 minit.

### A. Firebase (Firestore dan log masuk)

1. Buka https://console.firebase.google.com dan pilih projek sedia ada (contoh: projek MyKajian) atau cipta projek baharu.
2. **Authentication > Sign-in method**: pastikan **Email/Password** diaktifkan. Pada tab **Users**, pastikan akaun e-mel pemilik wujud (tambah jika belum).
3. **Authentication > Settings > Authorized domains**: tambah domain GitHub Pages, contohnya `cikgurazifibrahim.github.io`.
4. **Firestore Database**: jika belum ada, klik **Create database** (mod *production*, lokasi `asia-southeast1`).
5. **Firestore Database > Rules**: gantikan peraturan dengan blok berikut (atau tambah koleksi `teks` dan `cadangan` jika blok `artikel` dan `meta` sudah ada), kemudian **Publish**. Gantikan e-mel dengan e-mel pemilik.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function pemilik() { return request.auth != null && request.auth.token.email == "saya@cikgurazif.com"; }
       match /artikel/{id} { allow read, write: if pemilik(); }
       match /meta/{id} { allow read, write: if pemilik(); }
       match /teks/{id} { allow read, write: if pemilik(); }
       match /cadangan/{id} { allow read, write: if pemilik(); }
       match /users/{uid}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == uid; }
     }
   }
   ```

   Koleksi `teks` menyimpan ayat yang diekstrak daripada PDF (Peta Ayat) dan `cadangan` menyimpan tiga artikel harian. Tanpa dua baris itu, kedua-dua ciri berfungsi pada satu peranti sahaja (disimpan setempat) dan aplikasi memaparkan amaran.

6. **Project settings (ikon gear) > General > Your apps**: pilih aplikasi web (ikon `</>`) atau cipta satu, kemudian salin objek `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

### B. Google Cloud (akses Google Drive)

Projek Firebase ialah projek Google Cloud yang sama. Buka https://console.cloud.google.com dan pilih projek itu di bahagian atas.

1. **APIs & Services > Library**: cari **Google Drive API** dan klik **Enable**.
2. **APIs & Services > OAuth consent screen** (atau **Google Auth Platform > Branding**):
   - App name: `Repositori SLR`; User support email dan Developer contact: e-mel sendiri.
   - **Audience**: External. Selepas disimpan, klik **Publish app** supaya statusnya *In production* (tanpa langkah ini, kebenaran tamat setiap 7 hari).
   - **Data access / Scopes**: tambah skop `https://www.googleapis.com/auth/drive.file` (skop bukan sensitif, tidak memerlukan pengesahan Google).
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**:
   - Application type: **Web application**; Name: `Repositori SLR Web`.
   - **Authorized JavaScript origins**: `https://cikgurazifibrahim.github.io` (tanpa laluan, tanpa garis miring di hujung).
   - **Authorized redirect URIs**: `https://cikgurazifibrahim.github.io/repositori-slr/` (dengan garis miring di hujung). Ini membolehkan "Sambung Drive (cara lencongan)" apabila tetingkap kebenaran Google disekat dalam aplikasi yang dipasang.
   - Klik **Create** dan salin **Client ID** (berakhir dengan `.apps.googleusercontent.com`).

### C. Masukkan nilai ke dalam `config.js`

Buka fail `config.js` dalam repo ini (boleh diedit terus di GitHub: klik fail, ikon pensel, edit, *Commit changes*). Gantikan setiap nilai yang bermula dengan `ISI_`:

- `firebase.*` daripada langkah A6
- `googleClientId` daripada langkah B3
- `ownerEmail` ialah e-mel akaun log masuk (mesti sama dengan e-mel dalam peraturan Firestore)

GitHub Pages menerbitkan semula secara automatik dalam satu hingga dua minit.

### D. Pasang sebagai aplikasi

- **Windows (Chrome atau Edge)**: buka alamat aplikasi, klik ikon *Install* di hujung bar alamat, atau menu tiga titik > *Cast, save and share* > *Install page as app*. Aplikasi muncul di menu Start.
- **Android (Chrome)**: buka alamat aplikasi, menu tiga titik > *Add to Home screen* > *Install*. Aplikasi muncul di skrin utama dan dibuka tanpa bar pelayar.

Kali pertama memuat naik PDF pada setiap peranti, Google akan meminta kebenaran akses Drive sekali.

Jika tetingkap kebenaran tidak muncul dalam aplikasi yang dipasang (biasa berlaku pada Windows apabila pop-up disekat), buka menu tiga titik dan pilih **Sambung Drive (cara lencongan)**. Aplikasi beralih ke halaman Google, kemudian kembali dengan token. Menu **Diagnostik Drive** menunjukkan punca sebenar sebarang kegagalan dan nilai yang mesti didaftar dalam Google Cloud.

## Ciri utama

- **Papan**: senarai artikel dengan tapisan, statistik, muat naik PDF (seret dan lepas), butang **Baca** (flipbook terapung) dan **Muat turun** bagi artikel yang belum selesai dibaca.
- **Rekod**: 13 medan ekstrak, pemapar PDF skrin penuh atau bersebelahan borang, flipbook, muat turun, dan **Indeks ayat** untuk Peta Ayat.
- **Mohon Prof Dr Claude isikan**: butang pada setiap bahagian A hingga F (dan "Isi semua bahagian" di kepala rekod). Aplikasi mengekstrak teks penuh PDF artikel (penanda muka surat [m.s. N]; PDF imbasan tanpa teks dihantar sebagai dokumen, maksimum 100 muka surat), menghantarnya terus dari pelayar ke API Anthropic (Messages API, `https://api.anthropic.com/v1/messages`, pengepala `anthropic-dangerous-direct-browser-access`) dengan kunci API Prof Dr yang disimpan dalam Tetapan, dan mengisi hanya medan yang masih kosong sebagai draf; nilai yang sudah ditulis tidak disentuh. Arahan kepada model: Bahasa Melayu Malaysia akademik, sifar fabrikasi ("Tiada dalam artikel" jika tidak dilaporkan), jejak muka surat bagi angka dan definisi, salin tepat hanya rujukan, statistik dan petikan definisi, pilihan senarai mesti tepat. Jawapan diterima melalui output berstruktur `output_config.format` (`json_schema`): API menjamin jawapan ialah JSON yang sah mengikut satu skema semua medan (skema yang sama bagi setiap bahagian supaya cache prompt kekal sah; 19 medan pendek diwajibkan dengan nilai "-" jika bukan bahagian yang diminta, 22 medan panjang pilihan, mematuhi had API 24 medan pilihan), maka nilai tidak lagi rosak pada tanda petik atau baris baharu seperti teks bebas. `tool_choice` jenis `tool` atau `any` tidak digunakan kerana model keluarga 5.5 menolaknya dengan ralat 400. Jika API menolak skema (ralat 400, tidak dicaj), aplikasi beralih secara automatik kepada alat `isi_medan` dengan `tool_choice` `auto`, kemudian kepada teks JSON biasa, dan mengingati mod yang berjaya bagi model itu. Had token keluaran 8,192; jika jawapan terpotong (`stop_reason: max_tokens`), aplikasi mengulang sekali secara automatik dengan had 16,384 dan arahan meringkaskan (awalan sudah dalam cache, maka ulangan murah). Jika jawapan tiba sebagai teks yang rosak, pembaikan JSON sandaran (pagar kod, tanda petik tidak dilepaskan, baris baharu mentah, koma hujung, kurungan terpotong) dicuba sebelum ralat dilaporkan. Bahagian E dan F merujuk profil kajian Prof Dr (boleh disunting dalam Tetapan) dan bahagian F turut menerima ringkasan artikel lain dalam repositori untuk bandingan silang. Teks artikel dan arahan sistem ditanda `cache_control` supaya bahagian berikutnya artikel yang sama lebih murah. Setiap bahagian yang diisi ditanda "Draf AI" dengan masa, model dan bilangan medan (disimpan dalam medan `aiIsi` rekod). Model: Claude Sonnet 5.5 (lalai), Haiku 5.5 atau Opus 5.5.
- **Hari ini**: tiga artikel sehari daripada OpenAlex, satu bagi setiap pemboleh ubah (Kepimpinan Digital, Pengurusan Pengetahuan Organisasi, Kompetensi Digital Guru). Susunan keutamaan: (1) jenis artikel, iaitu empirikal kuantitatif dahulu (termasuk kaedah campuran, pengesahan instrumen dan eksperimen), kemudian jenis yang tidak dapat dipastikan, kualitatif, ulasan dan konseptual; (2) pengindeksan, iaitu jurnal **Scopus** dahulu (Q1 hingga Q4 mengikut anggaran kuartil SJR, kemudian Scopus tanpa kuartil), diikuti jurnal teras CWTS, kemudian DOAJ, manakala artikel yang tidak dapat disahkan diindeks dan berwasit ditolak; (3) padanan metodologi dengan kajian Prof Dr (tinjauan soal selidik keratan rentas, responden guru sekolah rendah, SEM atau CB-SEM/AMOS, analisis perantara, Malaysia); (4) istilah konstruk dalam tajuk, kuartil, ketersediaan PDF. Jenis dan padanan dikesan automatik daripada tajuk dan abstrak dengan senarai petunjuk yang dipaparkan pada kad (sahkan selepas membaca). Jika kolam empirikal kuantitatif nipis, kueri tambahan dengan istilah metodologi ("structural equation", "survey") dijalankan. Tapisan lain: tahun penerbitan dalam julat lima tahun kalendar terkini, artikel jurnal, akses terbuka, berkonteks pendidikan, bukan TAM atau UTAUT. Carian berjalan automatik sekali sehari apabila aplikasi dibuka (selepas rekod repositori tiba dari pelayan). Setiap kad: **Simpan ke Drive**, Muat turun PDF, Baca di sini, DOI, Semak SJR, Tambah ke repositori (medan Jenis sumber, Reka bentuk, Pengindeksan dan Kuartil diisi awal daripada pengesanan automatik dan dicatat dalam Catatan), Sudah dibaca, Tukar.
- **Banding Artikel** (tab Banding): perbandingan kepala ke kepala dua artikel repositori, seperti perbandingan dua pemain. Pilihan terhad kepada artikel dalam repositori (tiada carian web) dan hanya dua artikel pada satu masa. Perbandingan dibuat hanya jika semua medan Bahagian A hingga F kedua-dua rekod sudah diisi; jika belum, amaran menyenaraikan bahagian dan medan yang kosong berserta butang "Buka rekod" untuk melengkapkannya (sendiri atau dengan "Mohon Prof Dr Claude isikan"), dan pilihan dikekalkan apabila kembali. Tiga lapisan: (1) indeks pantas 0 hingga 100 yang dikira secara telus daripada medan (kekinian, taraf jurnal, kekukuhan kaedah, kekuatan bukti, relevansi, padanan model, asas teori, padanan konteks) dengan carta radar dan bar kepala ke kepala; (2) jadual bersebelahan semua medan A hingga F; (3) Agen Banding Prof Dr Claude, satu panggilan API Anthropic (medan rekod sahaja, bukan PDF, maka kos kecil) yang memulangkan laporan berstruktur: profil ringkas kedua-dua artikel, penilaian teknikal lapan dimensi, persamaan, perbezaan dan penilaian bagi setiap bahagian A hingga F, kekuatan dan kelemahan, laporan keseluruhan ringkas, refleksi perkaitan dengan kajian Prof Dr, cadangan sitasi bersama dan artikel yang lebih berguna berserta sebab. Laporan disimpan dalam `meta/banding_<kunci>` dan salinan tempatan, dimuat semula secara automatik bagi pasangan yang sama (termasuk susunan terbalik), dan boleh disalin atau dimuat turun sebagai Markdown.
- **Tulisan Tesis** (tab Tulisan): buku nota penulisan Bab 1 hingga Bab 5 di dalam sistem supaya tiada perenggan yang hilang atau ditaip dua kali. Setiap bab mengandungi seksyen (tajuk dan perenggan); setiap seksyen disimpan automatik ke awan (`meta/tulisan_b<N>`, gabungan setiap seksyen mengikut masa terbaharu) dan salinan peranti, dan disegerakkan ke semua peranti. Panel "Sambung semula" menyenaraikan seksyen yang terakhir disunting, dan "Apa yang sudah ditulis" merekodkan patah perkataan yang ditulis hari ini, semalam dan tujuh hari terakhir mengikut seksyen; carian merentas semua bab menunjukkan petikan. MS Word ialah pintu masuk dan keluar: "Muat turun fail MS Word" menjana .docx bab (Times New Roman 12, langkau dua, Heading 1 bab, Heading 2 seksyen, inden baris pertama, butir) dan menandakan bab itu "dipinjam ke Word"; "Muat naik fail MS Word" membaca .docx (mammoth), mengenal pasti bab daripada tajuk "Bab N" atau nama fail, memadankan seksyen mengikut tajuk, menunjukkan pratonton gabungan (Baharu, Dikemas kini, Sama) dengan amaran jika versi dalam sistem disunting selepas fail Word diubah, menyimpan versi lama setiap seksyen yang ditimpa (boleh dipulihkan), membatalkan tanda pinjaman, dan mengarkibkan fail dalam subfolder Tulisan di Google Drive (setiap muat naik dan muat turun). Peringatan dipaparkan ketika log masuk dan dalam tab selagi ada bab yang dipinjam keluar belum dimuat naik semula. Laporan Agen Banding boleh dihantar terus sebagai seksyen baharu Bab 2 ("Tulis ke Tulisan Tesis"). Kedua-dua butang Word turut ada dalam menu tiga titik.
- **Semakan pendua**: sebelum pemilihan, aplikasi mengecualikan semua DOI yang pernah dicadangkan (log awan `meta/cadangan_log`, log tempatan peranti, sejarah cadangan awan dan tempatan), DOI dan tajuk rekod repositori, ID OpenAlex, serta 497 DOI daripada log tugas harian lama (`data/seen_dois.json`). Baris "Semakan pendua" di bawah kad memaparkan bilangan yang dikecualikan dan status log awan; jika log awan tidak dapat dibaca atau ditulis (peraturan Firestore belum diterbitkan), semakan hanya tepat pada peranti itu dan amaran dipaparkan. Muat naik PDF yang DOI-nya sudah ada dalam repositori dipautkan ke rekod sedia ada atau dilangkau.
- **Rantaian artikel** (konsep *connected papers*): bagi setiap konstruk, calon hari ini diambil daripada senarai Rujukan artikel yang dicadangkan sebelumnya, dengan tapisan yang sama (Scopus dahulu, julat tahun, akses terbuka, relevansi istilah konstruk). Rantaian diteruskan selagi senarai Rujukan masih mengandungi penerbitan dalam julat tahun itu; jika tiada, carian baharu dimulakan dan sebabnya dinyatakan pada kad. Setiap kad menunjukkan "Rantaian ke-n" bersama artikel asalnya, dan bahagian "Rantaian artikel" di bawah kad memaparkan keseluruhan rantaian setiap konstruk mengikut tarikh.
- **Web Artikel** (rajah jaringan bibliometrik tempatan): klik mana-mana rujukan dalam bahagian Rantaian artikel untuk membuka tetingkap jaringan dengan artikel itu di tengah. Nod ialah artikel dalam repositori dan cadangan harian sahaja (tiada carian baharu), dalam julat tahun yang sama. Kekuatan hubungan dikira daripada rantaian atau petikan terus (senarai rujukan OpenAlex), gandingan bibliografi (rujukan sepunya), persamaan teks TF-IDF (tajuk, abstrak, medan ekstrak dan ayat yang diindeks dalam Peta Ayat), penulis pertama, tema dan jurnal; garisan tebal dan pekat bermakna hubungan kuat, nipis dan pudar bermakna lemah, dan nod disusun dalam tiga gelang mengikut kekuatan. Klik dua kali nod atau "Jadikan pusat" untuk menjadikannya pusat; PNG mengeksport rajah.
- **Senarai Scopus**: `data/scopus.json` dibina daripada Scopus Source Title List November 2024 (senarai awam Elsevier, helaian Scopus Active, 28,766 jurnal) dengan `tools/bina_scopus.py`; kuartil ialah anggaran daripada SJR 2023 mengikut kategori ASJC, maka pengesahan rasmi tetap melalui pautan Semak SJR. Untuk mengemas kini, muat turun senarai terbaru dari https://www.elsevier.com/resources/scopus-titlelists dan jalankan skrip itu.
- **Satu sumber untuk semua peranti**: setiap PDF, sama ada dimuat naik di Windows, Android atau pelayar, disimpan dalam folder "Repositori SLR" di Google Drive dan rekodnya dalam Firestore; peranti lain membacanya terus dari situ. "Simpan ke Drive" mencuba tiga laluan mengikut urutan: salinan OpenAlex (`content.openalex.org`, kira-kira 100 fail sehari dengan kunci API percuma), pautan penerbit (jika penerbit membenarkan), dan akhirnya langkah manual (Buka PDF, simpan, kemudian Pilih fail PDF atau seret ke kad). Di Android, fail PDF juga boleh dikongsi terus ke aplikasi (Kongsi > Repositori SLR); fail yang dikongsi dimuat naik ke Drive dan, jika DOI dalam PDF sepadan dengan cadangan hari ini, dipautkan ke kad itu secara automatik.
- **Peta Ayat**: taip istilah; semua ayat yang mengandunginya daripada semua PDF yang diindeks dikumpulkan, dikelompokkan mengikut pola istilah yang sama, dengan sumber (Bil., penulis, tahun, muka surat), butang Buka (flipbook pada muka surat itu), Salin dengan sitasi dan Eksport CSV. "Frasa tepat" mencari urutan perkataan yang sama.
- **Tetapan**: kunci API OpenAlex (percuma, disyorkan), kunci API Anthropic dan model untuk "Mohon Prof Dr Claude isikan", serta profil kajian. Tetapan disimpan dalam Firestore (`meta/tetapan`) dan salinan tempatan peranti; jika Firestore menolak, aplikasi memberitahu bahawa tetapan hanya tersimpan pada peranti itu. Tanpa kunci, bajet awam ialah kira-kira 100 carian atau 10 muat turun sehari yang dikongsi semua pengguna pada alamat IP yang sama; dengan kunci, 1,000 carian atau 100 muat turun sehari.

## Fail dalam repo

- `index.html`, `app.js`, `config.js`: aplikasi; `mod/flip.js` (flipbook), `mod/harian.js` (cadangan harian), `mod/peta.js` (peta ayat), `mod/web.js` (web artikel), `mod/isi.js` (Mohon Prof Dr Claude isikan), `mod/banding.js` (Banding Artikel), `mod/tulisan.js` (Tulisan Tesis)
- `data/seen_dois.json`: DOI yang pernah dicadangkan oleh tugas harian lama (dikecualikan daripada cadangan baharu); `data/scopus.json`: senarai ISSN jurnal Scopus aktif dengan anggaran kuartil; `tools/bina_scopus.py`: penjana fail itu
- `sw.js`, `manifest.webmanifest`, `icons/`: sokongan pemasangan, luar talian dan sasaran Kongsi (Web Share Target)
- `vendor/firebase.bundle.js`: Firebase SDK (app, auth, firestore) versi 10.14.1, dibungkus dengan esbuild; `vendor/tulisan.bundle.js`: docx 9.5.1 (penjanaan .docx) dan mammoth 1.11.0 (pembacaan .docx), dibungkus dengan esbuild, dimuatkan hanya apabila fail Word dijana atau dibaca
- `vendor/pdf.min.mjs`, `vendor/pdf.worker.min.mjs`, `vendor/standard_fonts/`: pdf.js 4.10.38 (lesen Apache 2.0, lihat `vendor/LICENSE-pdfjs.txt`)

## Eksport

Menu tiga titik > Eksport CSV (dibuka terus dalam Excel, lajur mengikut 13 medan) atau JSON lengkap sebagai sandaran.
