# Repositori SLR

Aplikasi web boleh pasang (PWA) untuk merekod 13 medan ekstrak bagi setiap artikel jurnal, menyimpan PDF dalam Google Drive dan menyegerakkan rekod ke semua peranti (Windows, Android, pelayar).

Rekod disimpan dalam **Firestore** (projek Firebase sendiri, percuma, sokongan luar talian). Fail PDF disimpan dalam folder **"Repositori SLR"** di **Google Drive** akaun sendiri (percuma, 15 GB). Kod aplikasi dihoskan di **GitHub Pages**.

## Persediaan sekali sahaja

Semua langkah di bawah dibuat dalam pelayar pada komputer. Anggaran masa: 20 minit.

### A. Firebase (Firestore dan log masuk)

1. Buka https://console.firebase.google.com dan pilih projek sedia ada (contoh: projek MyKajian) atau cipta projek baharu.
2. **Authentication > Sign-in method**: pastikan **Email/Password** diaktifkan. Pada tab **Users**, pastikan akaun e-mel pemilik wujud (tambah jika belum).
3. **Authentication > Settings > Authorized domains**: tambah domain GitHub Pages, contohnya `cikgurazif.github.io`.
4. **Firestore Database**: jika belum ada, klik **Create database** (mod *production*, lokasi `asia-southeast1`).
5. **Firestore Database > Rules**: tambah dua blok berikut DI DALAM blok `match /databases/{database}/documents { ... }` yang sedia ada, kemudian **Publish**. Gantikan e-mel dengan e-mel pemilik.

   ```
   match /artikel/{id} {
     allow read, write: if request.auth != null && request.auth.token.email == "saya@cikgurazif.com";
   }
   match /meta/{id} {
     allow read, write: if request.auth != null && request.auth.token.email == "saya@cikgurazif.com";
   }
   ```

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
   - **Authorized JavaScript origins**: `https://cikgurazif.github.io` (tanpa laluan, tanpa garis miring di hujung).
   - Authorized redirect URIs: biarkan kosong.
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

## Fail dalam repo

- `index.html`, `app.js`, `config.js`: aplikasi
- `sw.js`, `manifest.webmanifest`, `icons/`: sokongan pemasangan dan luar talian
- `vendor/firebase.bundle.js`: Firebase SDK (app, auth, firestore) versi 10.14.1, dibungkus dengan esbuild
- `vendor/pdf.min.mjs`, `vendor/pdf.worker.min.mjs`, `vendor/standard_fonts/`: pdf.js 4.10.38 (lesen Apache 2.0, lihat `vendor/LICENSE-pdfjs.txt`)

## Eksport

Menu tiga titik > Eksport CSV (dibuka terus dalam Excel, lajur mengikut 13 medan) atau JSON lengkap sebagai sandaran.
