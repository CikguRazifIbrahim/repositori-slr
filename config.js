// Konfigurasi Repositori SLR.
// Nilai di bawah tidak sulit (ia memang dihantar ke pelayar), tetapi mesti tepat.
// Gantikan setiap nilai yang bermula dengan "ISI_" kemudian simpan fail ini.
window.RSLR_CONFIG = {
  // 1. Firebase: Project settings > Your apps > SDK setup and configuration (firebaseConfig).
  firebase: {
    apiKey: "AIzaSyDuDUS6pVbVlTOY9Z2veIodiCxnL-8pOQc",
    authDomain: "mykajian-ebe7e.firebaseapp.com",
    projectId: "mykajian-ebe7e",
    storageBucket: "mykajian-ebe7e.firebasestorage.app",
    messagingSenderId: "351646083181",
    appId: "1:351646083181:web:cbe520f6168564a6687764"
  },
  // 2. Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID (Web application).
  googleClientId: "351646083181-46pt1ej3okd7of2v34d74hvhfhlalfll.apps.googleusercontent.com",
  // 3. E-mel akaun yang dibenarkan (sama dengan akaun log masuk Firebase dan peraturan Firestore).
  ownerEmail: "saya@cikgurazif.com",
  // 4. Nama folder dalam Google Drive tempat PDF disimpan (dicipta automatik).
  driveFolderName: "Repositori SLR",
  // 5. Nama koleksi Firestore.
  collection: "artikel"
};
