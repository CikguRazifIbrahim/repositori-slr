// Konfigurasi Repositori SLR.
// Nilai di bawah tidak sulit (ia memang dihantar ke pelayar), tetapi mesti tepat.
// Gantikan setiap nilai yang bermula dengan "ISI_" kemudian simpan fail ini.
window.RSLR_CONFIG = {
  // 1. Firebase: Project settings > Your apps > SDK setup and configuration (firebaseConfig).
  firebase: {
    apiKey: "ISI_API_KEY",
    authDomain: "ISI_PROJECT_ID.firebaseapp.com",
    projectId: "ISI_PROJECT_ID",
    storageBucket: "ISI_PROJECT_ID.appspot.com",
    messagingSenderId: "ISI_SENDER_ID",
    appId: "ISI_APP_ID"
  },
  // 2. Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID (Web application).
  googleClientId: "ISI_CLIENT_ID.apps.googleusercontent.com",
  // 3. E-mel akaun yang dibenarkan (sama dengan akaun log masuk Firebase dan peraturan Firestore).
  ownerEmail: "saya@cikgurazif.com",
  // 4. Nama folder dalam Google Drive tempat PDF disimpan (dicipta automatik).
  driveFolderName: "Repositori SLR",
  // 5. Nama koleksi Firestore.
  collection: "artikel"
};
