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
- **Hari ini**: tiga artikel sehari daripada OpenAlex, satu bagi setiap pemboleh ubah (Kepimpinan Digital, Pengurusan Pengetahuan Organisasi, Kompetensi Digital Guru). Tapisan: lima tahun terkini, artikel jurnal teras CWTS atau DOAJ, akses terbuka dengan PDF, berkonteks pendidikan, bukan TAM atau UTAUT, belum ada dalam repositori dan belum pernah dicadangkan (termasuk 497 DOI daripada log tugas harian lama dalam `data/seen_dois.json`). Carian berjalan automatik sekali sehari apabila aplikasi dibuka. Setiap kad: **Simpan ke Drive** (PDF dimasukkan ke folder Google Drive dan dipautkan ke rekod, jadi tersedia di semua peranti), Muat turun PDF (salinan ke peranti ini), Baca di sini, DOI, Semak SJR (Scopus dan kuartil), Tambah ke repositori, Sudah dibaca, Tukar.
- **Satu sumber untuk semua peranti**: setiap PDF, sama ada dimuat naik di Windows, Android atau pelayar, disimpan dalam folder "Repositori SLR" di Google Drive dan rekodnya dalam Firestore; peranti lain membacanya terus dari situ. "Simpan ke Drive" mencuba tiga laluan mengikut urutan: salinan OpenAlex (`content.openalex.org`, kira-kira 100 fail sehari dengan kunci API percuma), pautan penerbit (jika penerbit membenarkan), dan akhirnya langkah manual (Buka PDF, simpan, kemudian Pilih fail PDF atau seret ke kad). Di Android, fail PDF juga boleh dikongsi terus ke aplikasi (Kongsi > Repositori SLR); fail yang dikongsi dimuat naik ke Drive dan, jika DOI dalam PDF sepadan dengan cadangan hari ini, dipautkan ke kad itu secara automatik.
- **Peta Ayat**: taip istilah; semua ayat yang mengandunginya daripada semua PDF yang diindeks dikumpulkan, dikelompokkan mengikut pola istilah yang sama, dengan sumber (Bil., penulis, tahun, muka surat), butang Buka (flipbook pada muka surat itu), Salin dengan sitasi dan Eksport CSV. "Frasa tepat" mencari urutan perkataan yang sama.
- **Tetapan**: kunci API OpenAlex (percuma, disyorkan). Tanpa kunci, bajet awam ialah kira-kira 100 carian atau 10 muat turun sehari yang dikongsi semua pengguna pada alamat IP yang sama; dengan kunci, 1,000 carian atau 100 muat turun sehari.

## Fail dalam repo

- `index.html`, `app.js`, `config.js`: aplikasi; `mod/flip.js` (flipbook), `mod/harian.js` (cadangan harian), `mod/peta.js` (peta ayat)
- `data/seen_dois.json`: DOI yang pernah dicadangkan oleh tugas harian lama (dikecualikan daripada cadangan baharu)
- `sw.js`, `manifest.webmanifest`, `icons/`: sokongan pemasangan, luar talian dan sasaran Kongsi (Web Share Target)
- `vendor/firebase.bundle.js`: Firebase SDK (app, auth, firestore) versi 10.14.1, dibungkus dengan esbuild
- `vendor/pdf.min.mjs`, `vendor/pdf.worker.min.mjs`, `vendor/standard_fonts/`: pdf.js 4.10.38 (lesen Apache 2.0, lihat `vendor/LICENSE-pdfjs.txt`)

## Eksport

Menu tiga titik > Eksport CSV (dibuka terus dalam Excel, lajur mengikut 13 medan) atau JSON lengkap sebagai sandaran.
