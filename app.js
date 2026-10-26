/* Repositori SLR: aplikasi web boleh pasang (PWA).
   Rekod disimpan dalam Firestore (segerak masa nyata, luar talian disokong), PDF dalam Google Drive. */
'use strict';
import { initFlip } from './mod/flip.js';
import { initHarian } from './mod/harian.js';
import { initPeta } from './mod/peta.js';
const VERSION = '1.2.0';
const C = window.RSLR_CONFIG || {};
const TEST = !!window.__RSLR_TEST;
const COLL = C.collection || 'artikel';
const MAX_PDF = 100 * 1024 * 1024;

if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => Date.now();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtTime = ts => { if (!ts) return ''; try { return new Date(ts).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return new Date(ts).toLocaleString(); } };
const fmtBytes = b => { b = Number(b) || 0; if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' KB'; if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB'; return (b / 1073741824).toFixed(2) + ' GB'; };

/* ---------- field definitions: the 13 extraction fields, grouped A to F ---------- */
const TEMA = ['Kepimpinan Digital', 'Pengurusan Pengetahuan Organisasi', 'Kompetensi Digital Guru', 'Lain-lain / Konteks Umum'];
const RELEVANSI = ['Tinggi', 'Sederhana-Tinggi', 'Sederhana', 'Rendah'];
const GROUPS = [
  { id: 'secA', letter: 'A', title: 'Identiti', sub: 'Medan 1 dan 2', medan: [
    { n: 1, title: 'Rujukan dan jenis sumber', fields: [
      { k: 'penulis', label: 'Penulis ringkas', type: 'text', help: 'Contoh: Zhang et al.' },
      { k: 'tahun', label: 'Tahun', type: 'text', help: 'Tahun terbit sebenar, bukan tahun fail.', attrs: 'inputmode="numeric" maxlength="4"' },
      { k: 'tajuk', label: 'Tajuk penuh (bahasa asal)', type: 'textarea', rows: 2, wide: true },
      { k: 'rujukan', label: 'Rujukan APA 7 lengkap', type: 'textarea', rows: 3, wide: true, help: 'Disalin tepat. Penulis, tahun, tajuk, jurnal, jilid(isu), halaman, DOI.' },
      { k: 'doi', label: 'DOI', type: 'text', help: 'Contoh: 10.1111/ejed.70600. Semak pautan berfungsi.' },
      { k: 'jenis', label: 'Jenis sumber', type: 'select', opts: ['Empirikal', 'Ulasan sistematik', 'Ulasan skop', 'Meta-analisis', 'Konseptual', 'Laporan dasar', 'Instrumen dan pengesahan', 'Lain-lain'] },
      { k: 'indeks', label: 'Pengindeksan', type: 'select', opts: ['Scopus', 'WoS', 'Scopus dan WoS', 'MyCite', 'ERA', 'Tiada', 'Tidak pasti'] },
      { k: 'kuartil', label: 'Kuartil', type: 'select', opts: ['Q1', 'Q2', 'Q3', 'Q4', 'Tiada', 'Tidak pasti'] }
    ] },
    { n: 2, title: 'Konteks dan tema', fields: [
      { k: 'negara', label: 'Negara', type: 'text', list: 'negaraList' },
      { k: 'peringkat', label: 'Peringkat pendidikan', type: 'select', opts: ['Sekolah Rendah', 'Sekolah Menengah', 'Pengajian Tinggi', 'Bukan Pendidikan', 'Pelbagai peringkat'] },
      { k: 'lokasi', label: 'Lokasi sekolah', type: 'select', opts: ['Bandar', 'Luar bandar', 'Bandar dan luar bandar', 'Tidak dilaporkan'] },
      { k: 'tema', label: 'Tema utama', type: 'select', opts: TEMA }
    ] }
  ] },
  { id: 'secB', letter: 'B', title: 'Isi kajian', sub: 'Medan 3 dan 4', medan: [
    { n: 3, title: 'Objektif dan konstruk', fields: [
      { k: 'objektif', label: 'Objektif kajian', type: 'textarea', rows: 2, wide: true, help: 'Perkara yang hendak dibuktikan, dalam satu atau dua ayat.' },
      { k: 'konstruk', label: 'Konstruk dan peranannya', type: 'textarea', rows: 3, wide: true, help: 'Pemboleh ubah bebas, perantara, moderator dan bersandar, berserta dimensi setiap satu.' }
    ] },
    { n: 4, title: 'Definisi dan teori', fields: [
      { k: 'definisi', label: 'Definisi konstruk', type: 'textarea', rows: 3, wide: true, help: 'Takrif dalam ayat sendiri, disertai petikan asal pendek dan muka surat.' },
      { k: 'teori', label: 'Teori atau model dan sumber primernya', type: 'textarea', rows: 2, wide: true },
      { k: 'asasTeori', label: 'Asas teori', type: 'select', opts: ['Tingkah laku', 'Teknologi', 'Kedua-dua', 'Tiada'], help: 'Tingkah laku (contoh: transformasi, SCT) atau teknologi (contoh: TAM, UTAUT).' }
    ] }
  ] },
  { id: 'secC', letter: 'C', title: 'Kaedah', sub: 'Medan 5 dan 6', medan: [
    { n: 5, title: 'Reka bentuk dan sampel', fields: [
      { k: 'rekaBentuk', label: 'Reka bentuk', type: 'select', opts: ['Kuantitatif', 'Kualitatif', 'Kaedah campuran', 'Ulasan atau sintesis', 'Konseptual'] },
      { k: 'penilai', label: 'Siapa menilai siapa', type: 'select', opts: ['Penilaian kendiri', 'Guru menilai guru besar', 'Guru besar menilai diri', 'Pelbagai penilai', 'Tidak berkenaan'], help: 'Preseden bagi reka bentuk penilaian silang.' },
      { k: 'sampel', label: 'Sampel dan persampelan', type: 'textarea', rows: 2, wide: true, help: 'Siapa, berapa ramai dan cara dipilih.' }
    ] },
    { n: 6, title: 'Instrumen dan analisis', fields: [
      { k: 'instrumen', label: 'Instrumen', type: 'textarea', rows: 3, wide: true, help: 'Sumber adaptasi, bilangan item, skala, alfa Cronbach, CR dan AVE.' },
      { k: 'teknik', label: 'Teknik analisis', type: 'text', help: 'CB-SEM, PLS-SEM, regresi, analisis tematik.' },
      { k: 'perisian', label: 'Perisian dan prosedur', type: 'text', help: 'AMOS, SmartPLS, bootstrapping 5,000.' }
    ] }
  ] },
  { id: 'secD', letter: 'D', title: 'Dapatan', sub: 'Medan 7 dan 8', medan: [
    { n: 7, title: 'Dapatan utama', fields: [
      { k: 'dapatan', label: 'Dapatan utama', type: 'textarea', rows: 5, wide: true, help: 'Pekali laluan, nilai p, R kuasa dua, kesan tidak langsung dan jenis perantaraan. Masukkan laluan yang tidak signifikan, berserta muka surat.' }
    ] },
    { n: 8, title: 'Cabaran dan implikasi', fields: [
      { k: 'cabaran', label: 'Cabaran yang dilaporkan', type: 'textarea', rows: 2, wide: true, help: 'Halangan kepada kepimpinan digital, perkongsian pengetahuan atau kompetensi digital guru.' },
      { k: 'implikasi', label: 'Kesimpulan dan implikasi', type: 'textarea', rows: 2, wide: true, help: 'Implikasi teori, serta implikasi amalan atau dasar.' }
    ] }
  ] },
  { id: 'secE', letter: 'E', title: 'Penilaian', sub: 'Medan 9 dan 10', medan: [
    { n: 9, title: 'Batasan dan jurang', fields: [
      { k: 'batasan', label: 'Batasan dan cadangan pengarang', type: 'textarea', rows: 2, wide: true, help: 'Perkara yang diakui sendiri oleh pengarang. Sumber jurang yang paling selamat dipetik.' },
      { k: 'jurang', label: 'Jurang dan cara kajian Prof Dr mengisinya', type: 'textarea', rows: 2, wide: true },
      { k: 'jenisJurang', label: 'Jenis jurang', type: 'multi', opts: ['Konteks', 'Populasi', 'Teori', 'Kaedah', 'Empirikal'], wide: true }
    ] },
    { n: 10, title: 'Kritikan sendiri', fields: [
      { k: 'kekuatan', label: 'Kekuatan', type: 'textarea', rows: 2 },
      { k: 'kelemahan', label: 'Kelemahan', type: 'textarea', rows: 2, help: 'Contoh: bias kaedah sepunya, sampel kecil, dakwaan sebab-akibat daripada data keratan rentas.' },
      { k: 'mmat', label: 'Nota MMAT', type: 'text', wide: true, help: 'Lima kriteria bagi kategori reka bentuk berkenaan, jika penarafan formal diperlukan.' }
    ] }
  ] },
  { id: 'secF', letter: 'F', title: 'Kaitan dengan kajian', sub: 'Medan 11 hingga 13', medan: [
    { n: 11, title: 'Relevansi dan padanan', fields: [
      { k: 'relevansi', label: 'Relevansi', type: 'select', opts: RELEVANSI },
      { k: 'jenisKesan', label: 'Kesan yang diuji', type: 'select', opts: ['Langsung', 'Perantaraan', 'Kedua-dua', 'Tiada'] },
      { k: 'alasanRelevansi', label: 'Alasan relevansi (satu ayat)', type: 'text', wide: true },
      { k: 'padananKdPpo', label: 'Padanan Kepimpinan Digital ke PPO', type: 'select', opts: ['YA', 'TIDAK', 'Tidak pasti'] },
      { k: 'padananPpoKdg', label: 'Padanan PPO ke Kompetensi Digital Guru', type: 'select', opts: ['YA', 'TIDAK', 'Tidak pasti'] }
    ] },
    { n: 12, title: 'Bandingan silang', fields: [
      { k: 'bandingan', label: 'Bandingan silang', type: 'textarea', rows: 3, wide: true, help: 'Selari, bercanggah atau melanjutkan artikel lain yang telah dibaca. Inilah benih sintesis Bab 2.' }
    ] },
    { n: 13, title: 'Kegunaan dan jejak sumber', fields: [
      { k: 'bab', label: 'Bab yang akan memetik', type: 'multi', opts: ['Bab 1', 'Bab 2', 'Bab 3', 'Bab 4', 'Bab 5'] },
      { k: 'subtopik', label: 'Subtopik', type: 'text', help: 'Contoh: 2.7 Model kepimpinan digital.' },
      { k: 'jejak', label: 'Sumber primer untuk dijejak', type: 'textarea', rows: 2, wide: true, help: 'Rujukan dalam artikel yang perlu dibaca daripada teks asal, terutamanya teori yang dipetik secara sekunder.' },
      { k: 'catatan', label: 'Catatan', type: 'textarea', rows: 2, wide: true }
    ] }
  ] }
];
const FIELDS = [];
GROUPS.forEach(g => g.medan.forEach(m => m.fields.forEach(f => FIELDS.push(f))));
const FIELD_BY_KEY = Object.fromEntries(FIELDS.map(f => [f.k, f]));
const TEXT_KEYS = FIELDS.filter(f => f.type !== 'multi').map(f => f.k).concat(['pautan']);
const ALL_KEYS = FIELDS.map(f => f.k).concat(['bil', 'status', 'pautan']);
function defaults() {
  const d = { bil: 0, status: 'Belum dibaca', fail: [], pautan: '' };
  FIELDS.forEach(f => { d[f.k] = f.type === 'multi' ? [] : ''; });
  return d;
}

/* ---------- state ---------- */
const S = {
  user: null, docs: new Map(), gotDefinitive: false, view: 'papan', currentId: null,
  filters: {}, sort: 'dikemaskini', pending: {}, timers: {}, dirty: {}, lastError: null,
  split: false, unsub: null, online: navigator.onLine, installPrompt: null, pendingUpload: null
};
const searchCache = new WeakMap();

/* ---------- small UI helpers ---------- */
function toast(msg, bad, action) {
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.addEventListener('click', () => { t.remove(); action.fn(); }); t.appendChild(b); }
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), action ? 12000 : bad ? 6000 : 3200);
}
let modalResolve = null;
function confirmBox(title, text, okLabel, danger = true) {
  $('#modalTitle').textContent = title; $('#modalText').textContent = text; const ok = $('#modalOk'); ok.textContent = okLabel || 'Padam';
  ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  $('#modal').hidden = false; ok.focus();
  return new Promise(res => { modalResolve = res; });
}
$('#modalCancel').addEventListener('click', () => { $('#modal').hidden = true; modalResolve && modalResolve(false); });
$('#modalOk').addEventListener('click', () => { $('#modal').hidden = true; modalResolve && modalResolve(true); });
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) { $('#modal').hidden = true; modalResolve && modalResolve(false); } });

function setConn(kind, text) {
  const c = $('#connChip'); c.className = 'chip';
  const pend = Object.keys(S.pending).length;
  if (kind === 'ok') { c.classList.add('ok'); c.textContent = pend ? `Disegerakkan, ${pend} menunggu` : 'Disegerakkan'; }
  else if (kind === 'cache') { c.classList.add('info', 'busy'); c.textContent = text || 'Memuatkan'; }
  else if (kind === 'luar') { c.classList.add('warn'); c.textContent = text || 'Luar talian, perubahan ditahan'; }
  else if (kind === 'tiada') { c.classList.add('bad'); c.textContent = text || 'Storan tidak tersedia'; }
  else if (kind === 'ralat') { c.classList.add('bad'); c.textContent = text || 'Ralat storan'; }
  else { c.classList.add('busy'); c.textContent = text || 'Menyambung'; }
}
function setSave(kind, text) {
  const chip = $('#saveChip'); const line = $('#saveLine');
  chip.hidden = false; chip.className = 'chip chip-save';
  if (kind === 'menyimpan') { chip.classList.add('busy'); chip.textContent = 'Menyimpan'; line.textContent = 'Menyimpan perubahan'; }
  else if (kind === 'ok') { chip.classList.add('ok'); chip.textContent = 'Disimpan'; line.textContent = 'Disimpan ' + fmtTime(now()); }
  else if (kind === 'luar') { chip.classList.add('warn'); chip.textContent = 'Menunggu talian'; line.textContent = 'Perubahan disimpan pada peranti ini dan akan dihantar apabila talian kembali.'; }
  else if (kind === 'gagal') { chip.classList.add('bad'); chip.textContent = 'Gagal simpan'; line.textContent = 'Gagal menyimpan: ' + (text || 'ralat tidak diketahui') + '.'; }
  else { chip.hidden = true; line.textContent = 'Perubahan disimpan secara automatik.'; }
}
function setDriveChip(state) {
  const c = $('#driveChip'); c.hidden = false; c.className = 'chip';
  if (state === 'ok') { c.classList.add('ok'); c.textContent = 'Drive disambung'; c.title = 'Google Drive disambung'; }
  else if (state === 'tiada') { c.classList.add('bad'); c.textContent = 'Drive tidak tersedia'; c.title = 'Skrip Google tidak dimuatkan'; }
  else { c.classList.add('warn'); c.textContent = 'Sambung Drive'; c.title = 'Klik untuk menyambung Google Drive'; }
}
function showBanner(text, kind, action) {
  const b = $('#banner'); b.className = 'banner' + (kind ? ' ' + kind : ''); b.textContent = text; b.hidden = !text;
  if (text && action) { const btn = document.createElement('button'); btn.className = 'btn btn-sm'; btn.textContent = action.label; btn.addEventListener('click', action.fn); b.appendChild(btn); }
}
function showView(name) {
  ['setup', 'login', 'papan', 'harian', 'peta', 'rekod'].forEach(v => { $('#' + v).hidden = v !== name; });
  const inApp = name === 'papan' || name === 'harian' || name === 'peta' || name === 'rekod';
  $('#barActions').hidden = !inApp;
  $('#nav').hidden = !inApp;
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === (name === 'rekod' ? 'papan' : name)));
}
function goView(name) {
  if (name === 'papan') { goPapan(); return; }
  S.view = name; showView(name); savePrefs(); window.scrollTo(0, 0);
  if (name === 'harian') Harian.load(Harian.state.date, false);
  if (name === 'peta') { Peta.show(); setTimeout(() => $('#petaQ').focus(), 50); }
}

/* ---------- local persistence (per device conveniences) ---------- */
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function savePrefs() { lsSet('rslr_prefs', { filters: S.filters, sort: S.sort, split: S.split, view: S.view, currentId: S.currentId }); }

/* ---------- adapters: Auth, DB (Firestore), Drive (Google Drive) ---------- */
let Auth, DB, Drive;

function configMissing() {
  const miss = [];
  const f = C.firebase || {};
  ['apiKey', 'authDomain', 'projectId', 'appId'].forEach(k => { if (!f[k] || String(f[k]).startsWith('ISI_')) miss.push('firebase.' + k); });
  if (!C.googleClientId || String(C.googleClientId).startsWith('ISI_')) miss.push('googleClientId');
  if (!C.ownerEmail) miss.push('ownerEmail');
  return miss;
}

function makeTestAdapters() {
  const docs = new Map(); const listeners = new Set(); let n = 0; let meta = {};
  const fire = () => { const arr = Array.from(docs.entries()).map(([id, d]) => ({ id, data: JSON.parse(JSON.stringify(d)) })); listeners.forEach(fn => fn({ docs: arr, fromCache: false, pending: false })); };
  Auth = { user: null, cb: null, onChange(cb) { this.cb = cb; setTimeout(() => cb(this.user), 30); },
    async login(email) { this.user = { email, uid: 'u_test' }; this.cb && this.cb(this.user); },
    async logout() { this.user = null; this.cb && this.cb(null); } };
  if (window.__RSLR_TEST_USER) Auth.user = { email: window.__RSLR_TEST_USER, uid: 'u_test' };
  const other = new Map(); // dokumen lain: 'cadangan/2026-01-01', 'meta/x', 'teks/id_1'
  const clone = x => JSON.parse(JSON.stringify(x));
  const deepMerge = (a, b) => { Object.keys(b).forEach(k => { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], b[k]); else a[k] = clone(b[k]); }); return a; };
  DB = { subscribe(onSnap) { listeners.add(onSnap); setTimeout(fire, 40); return () => listeners.delete(onSnap); },
    create(data) { const id = 'd' + (++n); docs.set(id, clone(data)); window.__creates = (window.__creates || 0) + 1; setTimeout(fire, 10); return id; },
    async update(id, patch) { if (!docs.has(id)) throw { code: 'not-found' }; docs.set(id, Object.assign({}, docs.get(id), clone(patch))); window.__updates = (window.__updates || 0) + 1; setTimeout(fire, 10); },
    async remove(id) { docs.delete(id); setTimeout(fire, 10); },
    async getMeta() { return meta; }, async setMeta(p) { Object.assign(meta, p); },
    async get(path) { if (path === 'meta/tetapan') return meta; return other.has(path) ? clone(other.get(path)) : null; },
    async set(path, data, merge) { if (path === 'meta/tetapan') { Object.assign(meta, data); return; } other.set(path, merge && other.has(path) ? deepMerge(other.get(path), data) : clone(data)); window.__sets = (window.__sets || 0) + 1; },
    async list(coll, limit) { return Array.from(other.keys()).filter(k => k.startsWith(coll + '/')).sort().reverse().slice(0, limit || 50).map(k => ({ id: k.slice(coll.length + 1), data: clone(other.get(k)) })); },
    async batchSet(items) { items.forEach(it => other.set(it.path, clone(it.data))); window.__batch = (window.__batch || 0) + items.length; },
    async batchDelete(paths) { paths.forEach(p => other.delete(p)); },
    async teksSince(t) { return Array.from(other.entries()).filter(([k, v]) => k.startsWith('teks/') && (v.t || 0) > t).map(([k, v]) => ({ path: k, data: clone(v) })); },
    async teksOf(art) { return Array.from(other.entries()).filter(([k, v]) => k.startsWith('teks/') && v.art === art).map(([k, v]) => ({ path: k, data: clone(v) })); } };
  const files = new Map(); let fn2 = 0; let token = null;
  Drive = { ready: () => true, hasToken: () => !!token, lastError: null, justRedirected: false, redirectUri: new URL('./', location.href).href, tokenExpiry: () => Date.now() + 3600000, forget() { token = null; },
    async connect() { token = 't'; setDriveChip('ok'); return token; },
    connectRedirect() { token = 't'; setDriveChip('ok'); window.__redirected = true; },
    async about() { return { user: { emailAddress: 'ujian@contoh.my' }, storageQuota: { usage: '1048576', limit: '16106127360' } }; },
    async upload(file, onProgress) { if (!token) throw { code: 'no_token' }; const buf = await file.arrayBuffer(); const id = 'f' + (++fn2); files.set(id, buf); onProgress && onProgress(1); return { id, name: file.name, size: buf.byteLength, webViewLink: 'https://drive.google.com/file/d/' + id + '/view' }; },
    async download(id, onProgress) { if (!token) throw { code: 'no_token' }; const b = files.get(id); if (!b) throw { code: 'download', status: 404 }; onProgress && onProgress(1); return b.slice(0); },
    async remove(id) { files.delete(id); },
    link: id => 'https://drive.google.com/file/d/' + id + '/view' };
}

async function makeRealAdapters() {
  const FB = await import('./vendor/firebase.bundle.js');
  const app = FB.initializeApp(C.firebase);
  const auth = FB.getAuth(app);
  try { await FB.setPersistence(auth, FB.browserLocalPersistence); } catch (e) {}
  let db;
  try { db = FB.initializeFirestore(app, { localCache: FB.persistentLocalCache({ tabManager: FB.persistentMultipleTabManager() }) }); }
  catch (e) { db = FB.initializeFirestore(app, {}); }
  Auth = {
    onChange(cb) { FB.onAuthStateChanged(auth, u => cb(u ? { email: u.email, uid: u.uid } : null)); },
    async login(email, pw) { await FB.signInWithEmailAndPassword(auth, email, pw); },
    async logout() { await FB.signOut(auth); }
  };
  DB = {
    subscribe(onSnap, onErr) {
      return FB.onSnapshot(FB.collection(db, COLL), { includeMetadataChanges: true }, snap => {
        onSnap({ docs: snap.docs.map(d => ({ id: d.id, data: d.data() })), fromCache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites });
      }, err => onErr && onErr(err));
    },
    create(data) { const ref = FB.doc(FB.collection(db, COLL)); FB.setDoc(ref, data).catch(e => { toast('Gagal mencipta rekod: ' + dbMsg(e), true); }); return ref.id; },
    update(id, patch) { return FB.updateDoc(FB.doc(db, COLL, id), patch); },
    remove(id) { return FB.deleteDoc(FB.doc(db, COLL, id)); },
    async getMeta() { try { const s = await FB.getDoc(FB.doc(db, 'meta', 'tetapan')); return s.exists() ? s.data() : {}; } catch (e) { return {}; } },
    async setMeta(p) { try { await FB.setDoc(FB.doc(db, 'meta', 'tetapan'), p, { merge: true }); } catch (e) {} },
    async get(path) { const s = await FB.getDoc(FB.doc(db, path)); return s.exists() ? s.data() : null; },
    set(path, data, merge) { return FB.setDoc(FB.doc(db, path), data, merge ? { merge: true } : {}); },
    async list(coll, limit) { const q = FB.query(FB.collection(db, coll), FB.orderBy('tarikh', 'desc'), FB.limit(limit || 50)); const s = await FB.getDocs(q); return s.docs.map(d => ({ id: d.id, data: d.data() })); },
    async batchSet(items) { for (let i = 0; i < items.length; i += 400) { const b = FB.writeBatch(db); items.slice(i, i + 400).forEach(it => b.set(FB.doc(db, it.path), it.data)); await b.commit(); } },
    async batchDelete(paths) { for (let i = 0; i < paths.length; i += 400) { const b = FB.writeBatch(db); paths.slice(i, i + 400).forEach(p => b.delete(FB.doc(db, p))); await b.commit(); } },
    async teksSince(t) {
      const out = []; let since = t || 0;
      for (let round = 0; round < 20; round++) {
        const q = FB.query(FB.collection(db, 'teks'), FB.where('t', '>', since), FB.orderBy('t', 'asc'), FB.limit(500));
        const s = await FB.getDocs(q); s.docs.forEach(d => { out.push({ path: 'teks/' + d.id, data: d.data() }); since = Math.max(since, d.data().t || 0); });
        if (s.size < 500) break;
      }
      return out;
    },
    async teksOf(art) { const s = await FB.getDocs(FB.query(FB.collection(db, 'teks'), FB.where('art', '==', art))); return s.docs.map(d => ({ path: 'teks/' + d.id, data: d.data() })); }
  };
  Drive = makeDriveAdapter();
}
function dbMsg(e) {
  const c = e && e.code ? String(e.code) : '';
  if (c.includes('permission-denied')) return 'akaun ini tidak dibenarkan menulis (semak peraturan Firestore dan e-mel pemilik)';
  if (c.includes('unavailable')) return 'storan tidak dapat dihubungi';
  if (c.includes('resource-exhausted')) return 'kuota Firestore hari ini habis';
  if (c.includes('not-found')) return 'rekod tidak lagi wujud';
  if (c.includes('unauthenticated')) return 'sesi tamat, log masuk semula';
  return c || (e && e.message) || 'ralat tidak diketahui';
}

function makeDriveAdapter() {
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const API = 'https://www.googleapis.com/drive/v3/';
  let token = null, exp = 0, client = null, folderId = null;
  const self = { lastError: null, redirectUri: new URL('./', location.href).href.split('#')[0].split('?')[0] };
  function keep(t, e) { token = t; exp = e; try { localStorage.setItem('rslr_drive', JSON.stringify({ token, exp })); sessionStorage.removeItem('rslr_drive'); } catch (er) {} lsSet('rslr_drive_ok', true); }
  try { const s = JSON.parse(localStorage.getItem('rslr_drive') || sessionStorage.getItem('rslr_drive') || 'null'); if (s && s.token && s.exp > now() + 60000) { token = s.token; exp = s.exp; } } catch (e) {}
  // Token yang kembali melalui lencongan (response_type=token) berada dalam #hash.
  try {
    if (location.hash && location.hash.includes('access_token=')) {
      const h = new URLSearchParams(location.hash.slice(1));
      if (h.get('state') === 'rslr_drive' && h.get('access_token')) { keep(h.get('access_token'), now() + (Number(h.get('expires_in')) || 3600) * 1000); lsSet('rslr_drive_redirect_ok', true); self.justRedirected = true; }
      else if (h.get('error')) self.lastError = { code: h.get('error'), message: h.get('error_description') || '' };
      history.replaceState(null, '', location.pathname + location.search);
    }
  } catch (e) {}
  const gisReady = () => !!(window.google && window.google.accounts && window.google.accounts.oauth2);
  function hasToken() { return !!token && now() < exp - 30000; }
  function connect(interactive) {
    if (hasToken() && !interactive) return Promise.resolve(token);
    if (!gisReady()) { self.lastError = { code: 'gis_missing' }; return Promise.reject({ code: 'gis_missing' }); }
    return new Promise((res, rej) => {
      const fail = e => { self.lastError = e; rej(e); };
      if (!client) client = window.google.accounts.oauth2.initTokenClient({ client_id: C.googleClientId, scope: SCOPE, callback: () => {} });
      client.callback = r => {
        if (!r || r.error) { fail({ code: r && r.error ? r.error : 'token_error', message: r && r.error_description }); return; }
        keep(r.access_token, now() + (Number(r.expires_in) || 3600) * 1000); self.lastError = null; setDriveChip('ok'); res(token);
      };
      client.error_callback = e => fail({ code: e && e.type ? e.type : 'popup', message: e && e.message });
      try { client.requestAccessToken({ prompt: interactive ? 'consent' : '', login_hint: C.ownerEmail || undefined }); } catch (e) { fail({ code: 'request_failed', message: String(e) }); }
    });
  }
  function connectRedirect() {
    const p = new URLSearchParams({ client_id: C.googleClientId, redirect_uri: self.redirectUri, response_type: 'token', scope: SCOPE, include_granted_scopes: 'true', state: 'rslr_drive', prompt: 'consent' });
    if (C.ownerEmail) p.set('login_hint', C.ownerEmail);
    flushAll(); savePrefs();
    location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + p.toString());
  }
  async function about() {
    const r = await authed('about?fields=user(emailAddress),storageQuota(usage,limit)');
    if (!r.ok) throw { code: 'about', status: r.status, message: await safeText(r) };
    return r.json();
  }
  async function authed(path, opts = {}, retry = true) {
    const t = await connect(false);
    const headers = Object.assign({ Authorization: 'Bearer ' + t }, opts.headers || {});
    const r = await fetch(path.startsWith('http') ? path : API + path, Object.assign({}, opts, { headers }));
    if (r.status === 401 && retry) { token = null; await connect(false); return authed(path, opts, false); }
    return r;
  }
  async function ensureFolder() {
    if (folderId) return folderId;
    const meta = await DB.getMeta();
    if (meta && meta.driveFolderId) {
      try { const r = await authed(`files/${meta.driveFolderId}?fields=id,trashed`); if (r.ok) { const j = await r.json(); if (!j.trashed) { folderId = j.id; return folderId; } } } catch (e) {}
    }
    const name = C.driveFolderName || 'Repositori SLR';
    const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    let id = null;
    try { const r = await authed(`files?q=${q}&fields=files(id,name)&spaces=drive`); if (r.ok) { const j = await r.json(); if (j.files && j.files.length) id = j.files[0].id; } } catch (e) {}
    if (!id) {
      const r = await authed('files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }) });
      if (!r.ok) throw { code: 'folder', status: r.status, message: await safeText(r) };
      id = (await r.json()).id;
    }
    folderId = id; await DB.setMeta({ driveFolderId: id, driveFolderName: name }); return id;
  }
  async function upload(file, onProgress) {
    const t = await connect(false);
    const folder = await ensureFolder();
    const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,webViewLink', {
      method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'application/pdf', 'X-Upload-Content-Length': String(file.size) },
      body: JSON.stringify({ name: file.name, parents: [folder], mimeType: 'application/pdf' })
    });
    if (!init.ok) throw { code: 'upload_init', status: init.status, message: await safeText(init) };
    const loc = init.headers.get('Location') || init.headers.get('location');
    if (!loc) throw { code: 'upload_init', status: init.status, message: 'Tiada URL sesi muat naik' };
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest(); x.open('PUT', loc);
      x.setRequestHeader('Content-Type', 'application/pdf');
      x.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      x.onload = () => { if (x.status >= 200 && x.status < 300) { try { res(JSON.parse(x.responseText)); } catch (e) { res({ id: null }); } } else rej({ code: 'upload', status: x.status, message: x.responseText }); };
      x.onerror = () => rej({ code: 'network' });
      x.send(file);
    });
  }
  function downloadOnce(id, t, onProgress) {
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest(); x.open('GET', `${API}files/${encodeURIComponent(id)}?alt=media`);
      x.responseType = 'arraybuffer'; x.setRequestHeader('Authorization', 'Bearer ' + t);
      x.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      x.onload = () => { if (x.status === 200) res(x.response); else rej({ code: 'download', status: x.status }); };
      x.onerror = () => rej({ code: 'network' });
      x.send();
    });
  }
  async function download(id, onProgress) {
    let t = await connect(false);
    try { return await downloadOnce(id, t, onProgress); }
    catch (e) { if (e && e.status === 401) { token = null; t = await connect(false); return downloadOnce(id, t, onProgress); } throw e; }
  }
  async function remove(id) { const r = await authed(`files/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!r.ok && r.status !== 404) throw { code: 'delete', status: r.status }; }
  async function safeText(r) { try { return (await r.text()).slice(0, 300); } catch (e) { return ''; } }
  return { ready: gisReady, hasToken, connect, connectRedirect, about, upload, download, remove, link: id => `https://drive.google.com/file/d/${id}/view`,
    get lastError() { return self.lastError; }, get justRedirected() { return !!self.justRedirected; }, redirectUri: self.redirectUri, tokenExpiry: () => exp, forget() { token = null; exp = 0; try { localStorage.removeItem('rslr_drive'); sessionStorage.removeItem('rslr_drive'); } catch (e) {} } };
}
function driveMsg(e) {
  const c = e && e.code; const st = e && e.status;
  if (c === 'gis_missing') return 'skrip Google tidak dimuatkan. Semak talian internet dan muat semula.';
  if (c === 'no_token') return 'Google Drive belum disambung.';
  if (c === 'popup_closed') return 'tetingkap kebenaran Google ditutup sebelum selesai.';
  if (c === 'popup_failed_to_open') return 'tetingkap kebenaran Google disekat. Benarkan pop-up untuk laman ini.';
  if (c === 'access_denied') return 'kebenaran Google Drive ditolak.';
  if (c === 'popup') return 'tetingkap kebenaran Google tidak dapat dibuka dalam mod aplikasi.';
  if (c === 'invalid_client' || c === 'unauthorized_client') return 'Client ID tidak sah atau belum diterbitkan (semak Google Auth Platform).';
  if (c === 'redirect_uri_mismatch') return 'URI lencongan belum didaftar pada OAuth client.';
  if (c === 'invalid_request') return 'permintaan ditolak Google: ' + (e.message || 'semak asal (origin) yang didaftar.');
  if (c === 'immediate_failed' || c === 'interaction_required' || c === 'consent_required' || c === 'login_required') return 'Google memerlukan log masuk atau kebenaran semula.';
  if (c === 'network') return 'talian terputus semasa pemindahan.';
  if (st === 401) return 'sesi Google tamat. Sambung semula Drive.';
  if (st === 403) return 'Google menolak permintaan (semak Drive API diaktifkan dan kuota storan Drive). ' + (e.message || '');
  if (st === 404) return 'fail tidak ditemui dalam Drive. Ia mungkin telah dipadam.';
  return (c ? c + ' ' : '') + (st ? st + ' ' : '') + (e && e.message ? e.message : '');
}

/* ---------- derived data ---------- */
function searchText(d) {
  let t = searchCache.get(d);
  if (t) return t;
  const parts = [];
  for (const k of TEXT_KEYS) if (d[k]) parts.push(String(d[k]));
  parts.push(String(d.bil || ''), String(d.status || ''));
  (d.bab || []).forEach(x => parts.push(x)); (d.jenisJurang || []).forEach(x => parts.push(x));
  (d.fail || []).forEach(f => parts.push(f.nama || ''));
  t = parts.join(' \n ').toLowerCase();
  searchCache.set(d, t);
  return t;
}
const REL_ORDER = { 'Tinggi': 0, 'Sederhana-Tinggi': 1, 'Sederhana': 2, 'Rendah': 3 };
function filteredEntries() {
  const f = S.filters; const q = (f.q || '').trim().toLowerCase();
  let arr = Array.from(S.docs.entries()).filter(([id, d]) => {
    if (f.tema && d.tema !== f.tema) return false;
    if (f.relevansi && d.relevansi !== f.relevansi) return false;
    if (f.peringkat && d.peringkat !== f.peringkat) return false;
    if (f.jenis && d.jenis !== f.jenis) return false;
    if (f.status && (d.status || 'Belum dibaca') !== f.status) return false;
    if (f.negara && !(String(d.negara || '').toLowerCase().includes(f.negara.toLowerCase()))) return false;
    if (f.bab && !(d.bab || []).includes(f.bab)) return false;
    if (f.padanan === 'kd' && d.padananKdPpo !== 'YA') return false;
    if (f.padanan === 'ppo' && d.padananPpoKdg !== 'YA') return false;
    if (f.padanan === 'kedua' && !(d.padananKdPpo === 'YA' && d.padananPpoKdg === 'YA')) return false;
    const nFail = (d.fail || []).length;
    if (f.pdf === 'ada' && !nFail) return false;
    if (f.pdf === 'tiada' && nFail) return false;
    const y = parseInt(d.tahun, 10);
    if (f.tahunDari && !(y >= parseInt(f.tahunDari, 10))) return false;
    if (f.tahunHingga && !(y <= parseInt(f.tahunHingga, 10))) return false;
    if (q && !searchText(d).includes(q)) return false;
    return true;
  });
  const s = S.sort;
  const cmpStr = (a, b) => String(a || '').localeCompare(String(b || ''), 'ms', { sensitivity: 'base' });
  arr.sort(([ia, a], [ib, b]) => {
    if (s === 'bil') return (Number(a.bil) || 0) - (Number(b.bil) || 0);
    if (s === 'bil-desc') return (Number(b.bil) || 0) - (Number(a.bil) || 0);
    if (s === 'tahun') return (parseInt(b.tahun, 10) || 0) - (parseInt(a.tahun, 10) || 0) || cmpStr(a.penulis, b.penulis);
    if (s === 'penulis') return cmpStr(a.penulis, b.penulis) || (parseInt(a.tahun, 10) || 0) - (parseInt(b.tahun, 10) || 0);
    if (s === 'relevansi') return (REL_ORDER[a.relevansi] ?? 9) - (REL_ORDER[b.relevansi] ?? 9) || (b.dikemaskini || 0) - (a.dikemaskini || 0);
    return (b.dikemaskini || 0) - (a.dikemaskini || 0);
  });
  return arr;
}
function maxBil() { let m = 0; S.docs.forEach(d => { const n = Number(d.bil) || 0; if (n > m) m = n; }); return m; }
function normDoi(s) { return String(s || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, ''); }
function findDuplicates(id, d) {
  const out = []; const doi = normDoi(d.doi); const tj = String(d.tajuk || '').trim().toLowerCase().replace(/\s+/g, ' ');
  S.docs.forEach((o, oid) => {
    if (oid === id) return;
    if (doi && normDoi(o.doi) === doi) out.push({ bil: o.bil, why: 'DOI sama' });
    else if (tj && tj.length > 20 && String(o.tajuk || '').trim().toLowerCase().replace(/\s+/g, ' ') === tj) out.push({ bil: o.bil, why: 'tajuk sama' });
  });
  return out;
}
function findByFilename(name) {
  const n = name.trim().toLowerCase(); let hit = null;
  S.docs.forEach(d => { if (!hit && (d.fail || []).some(f => String(f.nama || '').trim().toLowerCase() === n)) hit = d; });
  return hit;
}

/* ---------- rendering: dashboard ---------- */
const temaClass = t => t === TEMA[0] ? 'kd' : t === TEMA[1] ? 'ppo' : t === TEMA[2] ? 'kdg' : 'lain';
const temaShort = t => t === TEMA[0] ? 'KD' : t === TEMA[1] ? 'PPO' : t === TEMA[2] ? 'KDG' : t ? 'Lain' : '';
const relClass = r => r === 'Tinggi' ? 'r-tinggi' : r === 'Sederhana-Tinggi' ? 'r-sed-tinggi' : r === 'Sederhana' ? 'r-sed' : 'r-rendah';
const statusClass = s => s === 'Selesai' ? 's-selesai' : s === 'Sedang dibaca' ? 's-sedang' : 's-belum';

function renderStats() {
  const all = Array.from(S.docs.values()); const n = all.length;
  const cT = {}; TEMA.forEach(t => cT[t] = 0); let tNone = 0;
  const cR = {}; RELEVANSI.forEach(r => cR[r] = 0);
  let selesai = 0, sedang = 0, pdf = 0, bytes = 0;
  all.forEach(d => { if (cT[d.tema] !== undefined) cT[d.tema]++; else tNone++; if (cR[d.relevansi] !== undefined) cR[d.relevansi]++; if (d.status === 'Selesai') selesai++; if (d.status === 'Sedang dibaca') sedang++; if ((d.fail || []).length) { pdf++; (d.fail || []).forEach(f => bytes += Number(f.saiz) || 0); } });
  const pct = x => n ? (x / n * 100).toFixed(1) + '%' : '0%';
  $('#stats').innerHTML = `
    <div class="tile"><div class="k">Jumlah artikel</div><div class="v">${n}</div><div class="sub">${pdf} dengan PDF</div></div>
    <div class="tile"><div class="k">Bacaan</div><div class="v">${selesai}</div><div class="sub">selesai, ${sedang} sedang dibaca, ${n - selesai - sedang} belum</div></div>
    <div class="tile"><div class="k">Tema utama</div><div class="bars">${TEMA.map(t => `<span style="width:${pct(cT[t])};background:var(--${temaClass(t)})"></span>`).join('')}</div><div class="legend">${TEMA.map(t => `<span><i style="background:var(--${temaClass(t)})"></i>${temaShort(t)} ${cT[t]}</span>`).join('')}${tNone ? `<span>Tiada tema ${tNone}</span>` : ''}</div></div>
    <div class="tile"><div class="k">Relevansi</div><div class="legend" style="margin-top:6px">${RELEVANSI.map(r => `<span class="tag ${relClass(r)}"><span>${esc(r)} ${cR[r]}</span></span>`).join('')}</div></div>
    <div class="tile"><div class="k">PDF dalam Drive</div><div class="v">${esc(fmtBytes(bytes))}</div><div class="sub">${pdf} fail dalam folder "${esc(C.driveFolderName || 'Repositori SLR')}"</div></div>`;
}
function renderList() {
  renderStats();
  const list = $('#list'); const arr = filteredEntries(); const total = S.docs.size;
  const negara = new Set(); S.docs.forEach(d => { if (d.negara) negara.add(String(d.negara).trim()); });
  $('#negaraList').innerHTML = Array.from(negara).sort().map(x => `<option value="${esc(x)}">`).join('');
  if (!total) {
    $('#hasilCount').textContent = S.gotDefinitive ? '0 artikel' : 'Memuatkan';
    if (!S.gotDefinitive) { list.innerHTML = `<div class="empty"><h3>Memuatkan repositori</h3><p>Menyambung ke storan dan mengambil rekod.</p></div>`; return; }
    list.innerHTML = `<div class="empty"><h3>Repositori masih kosong</h3><p>Muat naik PDF artikel pertama, atau cipta rekod kosong dan isi 13 medan ekstrak. Setiap rekod disegerakkan ke semua peranti Prof Dr.</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px"><label class="btn btn-primary">Muat naik PDF<input type="file" accept=".pdf,application/pdf" multiple hidden data-upload="papan"></label><button class="btn" data-act="baharu">Rekod kosong</button></div></div>`;
    return;
  }
  $('#hasilCount').textContent = arr.length === total ? `${total} artikel` : `${arr.length} daripada ${total} artikel`;
  if (!arr.length) { list.innerHTML = `<div class="empty"><h3>Tiada padanan</h3><p>Tiada artikel memenuhi tapisan semasa.</p><button class="btn" data-act="reset" style="margin-top:12px">Set semula tapisan</button></div>`; return; }
  list.innerHTML = arr.map(([id, d]) => {
    const nF = (d.fail || []).length; const unread = (d.status || 'Belum dibaca') !== 'Selesai';
    const acts = nF && unread ? `<div class="row-acts"><button class="btn btn-sm" data-flip="${esc(id)}" title="Baca dalam flipbook terapung">Baca</button><button class="btn btn-sm" data-dl="${esc(id)}" title="Muat turun PDF ke peranti ini">Muat turun</button></div>` : '';
    return `<div class="row" role="button" tabindex="0" data-id="${esc(id)}">
      <div class="row-main">
        <div class="row-top"><span class="bil">Bil. ${esc(d.bil || '?')}</span><span class="who">${esc(d.penulis || 'Penulis belum diisi')}${d.tahun ? ' (' + esc(d.tahun) + ')' : ''}</span><span class="tag ${statusClass(d.status)}"><span>${esc(d.status || 'Belum dibaca')}</span></span></div>
        <div class="row-title">${esc(d.tajuk || 'Tajuk belum diisi')}</div>
        <div class="row-chips">${d.tema ? `<span class="tag tema ${temaClass(d.tema)}"><span>${esc(d.tema)}</span></span>` : ''}${d.relevansi ? `<span class="tag ${relClass(d.relevansi)}"><span>${esc(d.relevansi)}</span></span>` : ''}${d.peringkat ? `<span class="tag"><span>${esc(d.peringkat)}</span></span>` : ''}${d.negara ? `<span class="tag"><span>${esc(d.negara)}</span></span>` : ''}${(d.bab || []).length ? `<span class="tag"><span>${esc(d.bab.join(', '))}</span></span>` : ''}${nF ? `<span class="tag pdf"><span>PDF ${nF > 1 ? nF : ''}</span></span>` : ''}${d.indeks && nF && d.indeks.fail === d.fail[0].id ? `<span class="tag"><span>Diindeks</span></span>` : ''}</div>
        ${acts}
      </div>
      <div class="row-meta">${esc(fmtTime(d.dikemaskini))}</div>
    </div>`;
  }).join('');
}
async function downloadPdf(id, idx) {
  const d = S.docs.get(id); const entry = (d && d.fail || [])[idx || 0]; if (!entry) { toast('Tiada fail PDF', true); return; }
  if (!Drive.hasToken() && !V.cache.has(entry.id)) { const ok = await ensureDrive(true); if (!ok) return; }
  toast('Memuat turun ' + (entry.nama || 'PDF'));
  try { const buf = V.cache.has(entry.id) ? V.cache.get(entry.id).slice(0) : await Drive.download(entry.id); keepCache(entry.id, buf); saveFile(entry.nama || 'artikel.pdf', buf, 'application/pdf'); }
  catch (e) { toast('Muat turun gagal: ' + driveMsg(e), true, { label: 'Buka di Drive', fn: () => window.open(entry.link || Drive.link(entry.id), '_blank', 'noopener') }); }
}
function openFlip(id, idx, page) {
  const d = S.docs.get(id); const entry = (d && d.fail || [])[idx || 0]; if (!entry) { toast('Tiada fail PDF', true); return; }
  Flip.open({ title: `Bil. ${d.bil || '?'} ${d.penulis || ''}${d.tahun ? ' (' + d.tahun + ')' : ''}`, sub: d.tajuk || entry.nama, source: { kind: 'drive', id: entry.id }, page: page || 1, dl: entry.link || Drive.link(entry.id), articleId: id, fileIdx: idx || 0 });
}

/* ---------- rendering: record form ---------- */
function buildForm() {
  $('#form').innerHTML = GROUPS.map(g => `<section id="${g.id}" class="group"><h2>${g.letter}. ${esc(g.title)} <small>${esc(g.sub)}</small></h2>${g.medan.map(m => `<div class="medan"><h3><b>${m.n}</b>${esc(m.title)}</h3><div class="fgrid">${m.fields.map(fieldHtml).join('')}</div></div>`).join('')}</section>`).join('');
}
function fieldHtml(f) {
  const id = 'f_' + f.k; const wide = f.wide ? ' wide' : ''; const help = f.help ? `<div class="help">${esc(f.help)}</div>` : '';
  if (f.type === 'textarea') return `<div class="field${wide}"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" rows="${f.rows || 2}" data-k="${f.k}"></textarea>${help}</div>`;
  if (f.type === 'select') return `<div class="field${wide}"><label for="${id}">${esc(f.label)}</label><select id="${id}" data-k="${f.k}"><option value="">Pilih</option>${f.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>${help}</div>`;
  if (f.type === 'multi') return `<div class="field${wide}"><span class="lbl">${esc(f.label)}</span><div class="checks" data-k="${f.k}">${f.opts.map((o, i) => `<label><input type="checkbox" id="${id}_${i}" value="${esc(o)}" data-k="${f.k}">${esc(o)}</label>`).join('')}</div>${help}</div>`;
  return `<div class="field${wide}"><label for="${id}">${esc(f.label)}</label><input id="${id}" type="text" data-k="${f.k}" ${f.attrs || ''} ${f.list ? `list="${f.list}"` : ''}>${help}</div>`;
}
function readControl(k) {
  const f = FIELD_BY_KEY[k];
  if (f && f.type === 'multi') return $$(`input[data-k="${k}"]`).filter(c => c.checked).map(c => c.value);
  if (k === 'bil') { const v = $('#f_bil').value.trim(); return v === '' ? 0 : Number(v); }
  const el = $('#f_' + k); return el ? el.value : '';
}
function writeControl(k, v) {
  const f = FIELD_BY_KEY[k];
  if (f && f.type === 'multi') { const arr = Array.isArray(v) ? v : []; $$(`input[data-k="${k}"]`).forEach(c => { c.checked = arr.includes(c.value); }); return; }
  const el = $('#f_' + k); if (!el) return;
  if (k === 'bil') { const s = v ? String(v) : ''; if (el.value !== s) el.value = s; return; }
  const s = v === null || v === undefined ? '' : String(v);
  if (el.value !== s) el.value = s;
}
function fillForm(d) { ALL_KEYS.forEach(k => writeControl(k, d[k])); renderRecordHead(d); renderFiles(d); }
function mergeIntoForm() {
  const d = S.docs.get(S.currentId); if (!d) return;
  const dirty = S.dirty[S.currentId] || new Set(); const active = document.activeElement;
  ALL_KEYS.forEach(k => {
    if (dirty.has(k)) return;
    const el = FIELD_BY_KEY[k] && FIELD_BY_KEY[k].type === 'multi' ? null : $('#f_' + k);
    if (el && active === el) return;
    writeControl(k, d[k]);
  });
  renderRecordHead(d); renderFiles(d);
}
function renderRecordHead(d) {
  const t = (d.penulis || 'Penulis belum diisi') + (d.tahun ? ' (' + d.tahun + ')' : '');
  $('#rekodTitle').textContent = t + (d.tajuk ? '. ' + d.tajuk : '');
  const dups = findDuplicates(S.currentId, d); const dl = $('#dupLine');
  if (dups.length) { dl.hidden = false; dl.textContent = 'Kemungkinan pendua: ' + dups.map(x => `Bil. ${x.bil} (${x.why})`).join(', '); } else dl.hidden = true;
  const hasPdf = (d.fail || []).length > 0;
  $('#btnViewPdf').hidden = !hasPdf;
  $('#btnSplit').hidden = !(hasPdf && window.innerWidth >= 1100);
  const po = $('#pautanOpen'); if (d.pautan && /^https?:\/\//i.test(d.pautan)) { po.hidden = false; po.href = d.pautan; } else po.hidden = true;
}
function renderFiles(d) {
  const fl = $('#fileList'); const files = d.fail || [];
  const idxOk = d.indeks && files.length && d.indeks.fail === files[0].id;
  fl.innerHTML = files.length ? files.map((f, i) => `<div class="file"><span class="name" title="${esc(f.nama)}">${esc(f.nama || 'fail.pdf')}</span><span class="size">${esc(fmtBytes(f.saiz))}${f.masa ? ' · ' + esc(fmtTime(f.masa)) : ''}</span><button class="btn btn-sm btn-primary" data-view="${i}">Lihat</button><button class="btn btn-sm" data-flip="${i}" title="Baca dalam panel terapung sambil mengisi borang">Flipbook</button><button class="btn btn-sm" data-dl="${i}">Muat turun</button>${i === 0 ? `<button class="btn btn-sm" data-idx="${i}" title="Ekstrak ayat untuk Peta Ayat">${idxOk ? 'Indeks semula' : 'Indeks ayat'}</button>` : ''}<a class="btn btn-sm" href="${esc(f.link || Drive.link(f.id))}" target="_blank" rel="noopener">Buka di Drive</a><button class="btn btn-sm btn-danger" data-delfile="${i}">Padam</button></div>`).join('') + (idxOk ? `<div class="help">Diindeks untuk Peta Ayat: ${esc(d.indeks.ayat)} ayat daripada ${esc(d.indeks.n)} muka surat, ${esc(fmtTime(d.indeks.t))}.</div>` : '') : `<div class="help">Tiada fail PDF dimuat naik untuk artikel ini.</div>`;
}

/* ---------- navigation ---------- */
function goPapan() { S.view = 'papan'; showView('papan'); savePrefs(); if (!V.docked) closeViewer(); window.scrollTo(0, 0); }
function openRecord(id) {
  const d = S.docs.get(id); if (!d) { toast('Rekod tidak ditemui', true); return; }
  if (S.currentId !== id && V.doc) closeViewer(true);
  S.currentId = id; S.view = 'rekod'; savePrefs();
  fillForm(d);
  const pend = S.pending[id]; if (pend) Object.keys(pend).forEach(k => writeControl(k, pend[k]));
  showView('rekod'); window.scrollTo(0, 0);
  setSave(S.pending[id] ? (S.online ? 'menyimpan' : 'luar') : '');
  applySplitLayout();
}

/* ---------- writes (debounced per record; Firestore queues them offline) ---------- */
function queueUpdate(id, patch) {
  S.pending[id] = Object.assign(S.pending[id] || {}, patch);
  const set = S.dirty[id] || (S.dirty[id] = new Set()); Object.keys(patch).forEach(k => set.add(k));
  setSave(S.online ? 'menyimpan' : 'luar');
  clearTimeout(S.timers[id]); S.timers[id] = setTimeout(() => flush(id), 700);
}
async function flush(id) {
  const patch = S.pending[id]; if (!patch) return;
  delete S.pending[id];
  const body = Object.assign({}, patch, { dikemaskini: now(), oleh: S.user ? S.user.uid : null });
  const local = S.docs.get(id); if (local) S.docs.set(id, Object.assign({}, local, body));
  const p = DB.update(id, body);
  if (!S.online) { if (S.currentId === id) setSave('luar'); }
  try { await p; clearDirty(id, patch); if (S.currentId === id && !S.pending[id]) setSave('ok'); setConn('ok'); }
  catch (e) { S.lastError = dbMsg(e); if (S.currentId === id) setSave('gagal', S.lastError); toast('Gagal menyimpan: ' + S.lastError, true); }
}
function clearDirty(id, patch) {
  const set = S.dirty[id]; if (!set) return;
  Object.keys(patch).forEach(k => { const cur = S.pending[id]; if (!cur || !(k in cur)) set.delete(k); });
  if (!set.size) delete S.dirty[id];
}
async function writeNow(id, patch) { clearTimeout(S.timers[id]); S.pending[id] = Object.assign(S.pending[id] || {}, patch); await flush(id); }
function flushAll() { Object.keys(S.pending).forEach(id => { clearTimeout(S.timers[id]); flush(id); }); }
function createArticle(extra) {
  const data = Object.assign(defaults(), { bil: maxBil() + 1, dicipta: now(), dikemaskini: now(), oleh: S.user ? S.user.uid : null }, extra || {});
  const id = DB.create(data);
  S.docs.set(id, data);
  return id;
}
async function deleteArticle(id) {
  const d = S.docs.get(id); if (!d) return;
  const okk = await confirmBox('Padam artikel ini?', `Bil. ${d.bil || '?'}: ${d.tajuk || d.penulis || 'rekod'}${(d.fail || []).length ? '. Fail PDF dalam Drive turut dipadam.' : ''} Tindakan ini tidak boleh dibatalkan.`, 'Padam');
  if (!okk) return;
  try {
    for (const f of (d.fail || [])) { try { await Drive.remove(f.id); } catch (e) {} }
    delete S.pending[id]; delete S.dirty[id]; clearTimeout(S.timers[id]);
    if (Flip.state.articleId === id) Flip.close();
    S.docs.delete(id); goPapan(); renderList();
    await DB.remove(id); toast('Artikel dipadam');
    Peta.removeArticleText(id);
  } catch (e) { toast('Gagal memadam: ' + dbMsg(e), true); }
}

/* ---------- uploads ---------- */
const ulog = { open() { $('#uploadLog').hidden = false; }, row(name, size) {
  const el = document.createElement('div'); el.className = 'urow'; el.innerHTML = `<span class="n"></span><span class="z"></span><span class="s">Menunggu</span><div class="p" hidden><span></span></div>`;
  el.querySelector('.n').textContent = name; el.querySelector('.z').textContent = size; $('#ulogRows').prepend(el);
  const bar = el.querySelector('.p'); const fill = bar.querySelector('span');
  return { status(t) { el.className = 'urow'; el.querySelector('.s').textContent = t; }, progress(p) { bar.hidden = false; fill.style.width = Math.round(p * 100) + '%'; }, ok(t) { el.className = 'urow ok'; bar.hidden = true; el.querySelector('.s').textContent = t; }, fail(t) { el.className = 'urow bad'; bar.hidden = true; el.querySelector('.s').textContent = t; } };
} };
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
const POPUP_CODES = ['popup_failed_to_open', 'popup_closed', 'popup', 'interaction_required', 'consent_required', 'login_required', 'gis_missing', 'request_failed', 'token_error'];
async function offerRedirect(e) {
  if (TEST && !window.__RSLR_TEST_REDIRECT) return false;
  const okk = await confirmBox('Guna cara lencongan?', `Tetingkap kebenaran Google tidak berjaya (${driveMsg(e)}). Aplikasi boleh beralih ke halaman kebenaran Google dan kembali ke sini selepas Prof Dr membenarkan akses.`, 'Teruskan', false);
  if (okk) { Drive.connectRedirect(); return true; }
  return false;
}
async function ensureDrive(interactive) {
  if (Drive.hasToken()) return true;
  try { await Drive.connect(!!interactive); return true; }
  catch (e) {
    if (!interactive && (POPUP_CODES.includes(e.code) || e.code === 'access_denied')) {
      try { await Drive.connect(true); return true; }
      catch (e2) { if (POPUP_CODES.includes(e2.code) && (isStandalone() || lsGet('rslr_drive_redirect_ok', false))) { await offerRedirect(e2); return false; } toast('Google Drive tidak dapat disambung: ' + driveMsg(e2), true); return false; }
    }
    if (POPUP_CODES.includes(e.code) && (isStandalone() || lsGet('rslr_drive_redirect_ok', false))) { await offerRedirect(e); return false; }
    toast('Google Drive tidak dapat disambung: ' + driveMsg(e), true, { label: 'Cara lencongan', fn: () => Drive.connectRedirect() }); return false;
  }
}
function richModal(title, html, okLabel, cancelLabel) {
  $('#modalTitle').textContent = title; const p = $('#modalText'); p.className = 'modal-rich'; p.innerHTML = html;
  const ok = $('#modalOk'); ok.textContent = okLabel || 'Tutup'; ok.className = 'btn btn-primary'; $('#modalCancel').hidden = !cancelLabel; if (cancelLabel) $('#modalCancel').textContent = cancelLabel;
  $('#modal').hidden = false;
  return new Promise(res => { modalResolve = v => { const inp = p.querySelector('input'); richModal.lastValue = inp ? inp.value : null; p.className = ''; p.innerHTML = ''; $('#modalCancel').hidden = false; $('#modalCancel').textContent = 'Batal'; res(v); }; });
}
async function showDiag() {
  const li = (k, v, cls) => `<li class="${cls || ''}"><b>${esc(k)}</b><span>${esc(v)}</span></li>`;
  const rows = [];
  rows.push(li('Mod paparan', isStandalone() ? 'Aplikasi dipasang (standalone)' : 'Pelayar'));
  rows.push(li('Talian', navigator.onLine ? 'Dalam talian' : 'Luar talian', navigator.onLine ? 'ok' : 'bad'));
  rows.push(li('Skrip Google (GIS)', Drive.ready() ? 'Dimuatkan' : 'Tidak dimuatkan', Drive.ready() ? 'ok' : 'bad'));
  rows.push(li('Token Drive', Drive.hasToken() ? 'Ada, tamat ' + fmtTime(Drive.tokenExpiry()) : 'Tiada', Drive.hasToken() ? 'ok' : 'bad'));
  rows.push(li('Client ID', String(C.googleClientId || '').slice(0, 14) + '…'));
  rows.push(li('Asal (origin) yang mesti didaftar', location.origin));
  rows.push(li('URI lencongan yang mesti didaftar', Drive.redirectUri || ''));
  const le = Drive.lastError; rows.push(li('Ralat terakhir', le ? (le.code || '') + (le.message ? ': ' + le.message : '') : 'Tiada', le ? 'bad' : 'ok'));
  let test = 'Token tiada, ujian dilangkau';
  if (Drive.hasToken()) { try { const a = await Drive.about(); test = `${a.user && a.user.emailAddress ? a.user.emailAddress + ', ' : ''}storan ${fmtBytes(a.storageQuota && a.storageQuota.usage)} daripada ${fmtBytes(a.storageQuota && a.storageQuota.limit)}`; } catch (e) { test = 'Gagal: ' + driveMsg(e); } }
  rows.push(li('Ujian panggilan Drive', test, /^Gagal|dilangkau/.test(test) ? 'bad' : 'ok'));
  const tips = `<div class="help">Jika tetingkap kebenaran tidak muncul dalam aplikasi yang dipasang, guna menu "Sambung Drive (cara lencongan)". URI lencongan di atas mesti ada dalam senarai Authorized redirect URIs pada OAuth client "Repositori SLR Web" di Google Cloud Console.</div>`;
  await richModal('Diagnostik Google Drive', `<ul class="diag">${rows.join('')}</ul>${tips}`, 'Tutup');
}
async function showTetapan() {
  const meta = await DB.getMeta(); const cur = meta && meta.openalexKey ? String(meta.openalexKey) : '';
  const okk = await richModal('Tetapan', `<div class="help">Kunci API OpenAlex (disyorkan, percuma). Tanpa kunci, carian harian berkongsi bajet awam kecil (kira-kira 100 carian sehari untuk semua pengguna pada alamat IP yang sama, contohnya rangkaian kampus) dan boleh ditolak dengan ralat 429. Dengan kunci, bajet ialah 1,000 carian sehari untuk Prof Dr sahaja.<br>Cara: buka <a href="https://openalex.org/settings/api" target="_blank" rel="noopener">openalex.org/settings/api</a>, daftar akaun percuma dengan e-mel (30 saat), salin kunci dan tampal di bawah. Kunci disimpan dalam Firestore dan dikongsi semua peranti.</div><label for="tetKey">Kunci API OpenAlex</label><input id="tetKey" class="modal-in" type="text" autocomplete="off" value="${esc(cur)}" placeholder="kosongkan untuk tidak menggunakan kunci">`, 'Simpan', 'Batal');
  if (!okk) return;
  const v = String(richModal.lastValue ?? cur).trim();
  await DB.setMeta({ openalexKey: v }); toast(v ? 'Kunci OpenAlex disimpan' : 'Kunci OpenAlex dibuang');
}
async function uploadFiles(files, articleId) {
  files = Array.from(files || []); if (!files.length) return;
  if (!Drive.ready()) { toast('Skrip Google belum dimuatkan. Semak talian internet dan muat semula.', true); return; }
  if (!Drive.hasToken()) {
    S.pendingUpload = { files, articleId };
    const okk = await confirmBox('Sambung Google Drive', 'PDF disimpan dalam Google Drive Prof Dr. Benarkan akses sekali, kemudian muat naik akan diteruskan.', 'Sambung Drive', false);
    if (!okk) { S.pendingUpload = null; return; }
    const ok2 = await ensureDrive(true); if (!ok2) { S.pendingUpload = null; return; }
    const p = S.pendingUpload; S.pendingUpload = null; if (!p) return;
    files = p.files; articleId = p.articleId;
  }
  ulog.open();
  for (const f of files) await uploadOne(f, articleId);
}
async function uploadOne(file, articleId) {
  const row = ulog.row(file.name, fmtBytes(file.size));
  const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
  if (!isPdf) { row.fail('Bukan fail PDF'); return; }
  if (!file.size) { row.fail('Fail kosong'); return; }
  if (file.size > MAX_PDF) { row.fail('Melebihi had 100 MB'); return; }
  if (!articleId) { const dup = findByFilename(file.name); if (dup) { row.fail(`Dilangkau: fail dengan nama sama sudah ada pada Bil. ${dup.bil}`); return; } }
  let meta = null;
  if (!articleId) { row.status('Membaca metadata PDF'); try { meta = await Promise.race([readPdfMeta(file), sleep(15000).then(() => null)]); } catch (e) { meta = null; } }
  row.status('Memuat naik ke Google Drive'); row.progress(0);
  let res = null, err = null;
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    try { res = await Drive.upload(file, p => row.progress(p)); }
    catch (e) { err = e; if (attempt === 0 && (e.code === 'network' || (e.status && e.status >= 500))) await sleep(1500); else break; }
  }
  if (!res || !res.id) { row.fail('Gagal: ' + driveMsg(err || { code: 'upload' })); return; }
  const entry = { id: res.id, nama: file.name, saiz: Number(res.size) || file.size, masa: now(), link: res.webViewLink || Drive.link(res.id) };
  try {
    if (articleId) {
      const d = S.docs.get(articleId) || {}; const pend = S.pending[articleId] && S.pending[articleId].fail;
      const fail = (pend || d.fail || []).concat([entry]);
      await writeNow(articleId, { fail });
      if (S.currentId === articleId) { const nd = S.docs.get(articleId); if (nd) { renderRecordHead(nd); renderFiles(nd); } }
    } else {
      const extra = { fail: [entry], status: 'Belum dibaca' };
      if (meta) { extra.tajuk = meta.title || stripExt(file.name); if (meta.doi) extra.doi = meta.doi; if (meta.year) extra.tahun = meta.year; } else extra.tajuk = stripExt(file.name);
      articleId = createArticle(extra);
      if (meta && meta.doi) { try { await Harian.linkByDoi(articleId, meta.doi); } catch (e) {} }
    }
    row.ok('Selesai' + (meta && meta.doi ? ', DOI dikesan' : '') + '. Bil. ' + ((S.docs.get(articleId) || {}).bil || ''));
    renderList(); if (S.view === 'harian') Harian.render();
  } catch (e) {
    row.fail('Fail dimuat naik ke Drive tetapi rekod gagal disimpan (' + dbMsg(e) + ').');
  }
}
function stripExt(n) { return String(n || '').replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim(); }
async function readPdfMeta(file) {
  const lib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buf, stopAtErrors: false }).promise;
  const out = { title: '', doi: '', year: '' };
  try { const m = await doc.getMetadata(); const t = m && m.info && m.info.Title ? String(m.info.Title).trim() : ''; if (t.length >= 12 && !/\.(pdf|docx?|indd)$/i.test(t) && !/^(untitled|microsoft word|doi:|\d+$)/i.test(t)) out.title = t; } catch (e) {}
  try {
    const p = await doc.getPage(1); const tc = await p.getTextContent(); const text = tc.items.map(i => i.str).join(' ');
    const dm = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/); if (dm) out.doi = dm[0].replace(/[).,;]+$/, '');
    const years = (text.match(/\b(19[89]\d|20[0-4]\d)\b/g) || []); const cur = new Date().getFullYear() + 1; const cnt = {};
    years.forEach(y => { const n = +y; if (n <= cur) cnt[n] = (cnt[n] || 0) + 1; });
    let best = '', bc = 0; Object.keys(cnt).forEach(y => { if (cnt[y] > bc || (cnt[y] === bc && +y > +best)) { best = y; bc = cnt[y]; } });
    out.year = best;
  } catch (e) {}
  try { await doc.destroy(); } catch (e) {}
  return out;
}

/* ---------- PDF viewer ---------- */
let pdfjsPromise = null;
function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('./vendor/pdf.min.mjs').then(lib => {
      lib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', document.baseURI).href;
      return lib;
    }).catch(e => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}
const V = { doc: null, page: 1, scale: 1, mode: 'width', rotation: 0, task: null, token: 0, articleId: null, entry: null, docked: false, cache: new Map(), stdFonts: new URL('./vendor/standard_fonts/', document.baseURI).href };
const stage = $('#stage'), canvas = $('#pdfCanvas'), vMsg = $('#vMsg');
function vShowMsg(html) { vMsg.hidden = false; vMsg.innerHTML = html; }
function vHideMsg() { vMsg.hidden = true; vMsg.innerHTML = ''; }
async function openViewer(articleId, idx) {
  const d = S.docs.get(articleId); if (!d) return;
  const entry = (d.fail || [])[idx || 0]; if (!entry) { toast('Tiada fail PDF', true); return; }
  V.articleId = articleId; V.entry = entry;
  $('#vTitle').textContent = (d.penulis || 'Artikel') + (d.tahun ? ' (' + d.tahun + ')' : '') + (d.bil ? ', Bil. ' + d.bil : '');
  $('#vSub').textContent = entry.nama || '';
  $('#vOpen').href = entry.link || Drive.link(entry.id);
  const canDock = window.innerWidth >= 1100 && S.view === 'rekod';
  $('#vDock').hidden = !canDock;
  if (S.split && canDock) dockViewer(true); else dockViewer(false);
  $('#viewer').hidden = false;
  if (!Drive.hasToken() && !V.cache.has(entry.id)) { const ok = await ensureDrive(false); if (!ok) { vShowMsg(`<div>Google Drive belum disambung.</div><button class="vbtn" id="vConnect">Sambung Drive</button>`); $('#vConnect').addEventListener('click', async () => { if (await ensureDrive(true)) loadPdfInto(entry); }); return; } }
  await loadPdfInto(entry);
}
function closeViewer(keepDock) {
  const viewer = $('#viewer');
  if (!keepDock && V.docked) dockViewer(false);
  viewer.hidden = true;
  if (V.task) { try { V.task.cancel(); } catch (e) {} V.task = null; }
  if (V.doc) { try { V.doc.destroy(); } catch (e) {} V.doc = null; }
  V.token++;
  if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
}
function dockViewer(on) {
  const viewer = $('#viewer'); const pane = $('#viewerPane');
  if (on) { if (!V.docked) { pane.appendChild(viewer); viewer.classList.add('docked'); V.docked = true; } pane.hidden = false; $('#vDock').classList.add('on'); $('#rekodWrap').classList.add('split'); }
  else { if (V.docked) { document.body.appendChild(viewer); viewer.classList.remove('docked'); V.docked = false; } pane.hidden = true; $('#vDock').classList.remove('on'); $('#rekodWrap').classList.remove('split'); }
  $('#btnSplit').classList.toggle('on', on);
  if (V.doc) scheduleRerender();
}
function applySplitLayout() {
  const canDock = window.innerWidth >= 1100 && S.view === 'rekod';
  if (!canDock && V.docked) { dockViewer(false); if (!$('#viewer').hidden) closeViewer(); }
  const d = S.docs.get(S.currentId); if (d) $('#btnSplit').hidden = !((d.fail || []).length && window.innerWidth >= 1100);
}
function keepCache(id, buf) { V.cache.set(id, buf); while (V.cache.size > 3) { const k = V.cache.keys().next().value; V.cache.delete(k); } }
async function loadPdfInto(entry) {
  const token = ++V.token;
  if (V.task) { try { V.task.cancel(); } catch (e) {} V.task = null; }
  if (V.doc) { try { V.doc.destroy(); } catch (e) {} V.doc = null; }
  $('#vPageTotal').textContent = '0'; $('#vPageInput').value = '1';
  vShowMsg(`<div>Memuat turun PDF dari Google Drive</div><div class="prog"><span id="vProg"></span></div>`);
  let lib;
  try { lib = await loadPdfJs(); }
  catch (e) { vShowMsg(`<div>Pemapar PDF gagal dimuatkan. Semak talian internet, kemudian cuba lagi.</div><a class="vbtn" href="${esc(entry.link || Drive.link(entry.id))}" target="_blank" rel="noopener">Buka di Google Drive</a>`); return; }
  let buf;
  try {
    if (V.cache.has(entry.id)) buf = V.cache.get(entry.id).slice(0);
    else { const b = await Drive.download(entry.id, p => { const el = $('#vProg'); if (el) el.style.width = Math.round(p * 100) + '%'; }); keepCache(entry.id, b); buf = b.slice(0); }
  } catch (e) {
    if (token !== V.token) return;
    vShowMsg(`<div>${esc('Fail tidak dapat dimuat turun: ' + driveMsg(e))}</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="vbtn" id="vRetry">Cuba lagi</button><button class="vbtn" id="vConnect">Sambung Drive</button><a class="vbtn" href="${esc(entry.link || Drive.link(entry.id))}" target="_blank" rel="noopener">Buka di Google Drive</a></div>`);
    $('#vRetry').addEventListener('click', () => loadPdfInto(entry));
    $('#vConnect').addEventListener('click', async () => { if (await ensureDrive(true)) loadPdfInto(entry); });
    return;
  }
  if (token !== V.token) return;
  vShowMsg(`<div>Membuka dokumen</div>`);
  try {
    const doc = await lib.getDocument({ data: buf, standardFontDataUrl: V.stdFonts, stopAtErrors: false }).promise;
    if (token !== V.token) { try { doc.destroy(); } catch (e) {} return; }
    V.doc = doc; V.page = 1; V.rotation = 0; V.mode = 'width';
    $('#vPageTotal').textContent = String(doc.numPages);
    vHideMsg();
    await renderPage();
  } catch (e) {
    if (token !== V.token) return;
    vShowMsg(`<div>Fail ini tidak dapat dibaca sebagai PDF${e && e.name === 'PasswordException' ? ' (dilindungi kata laluan)' : ''}.</div><a class="vbtn" href="${esc(entry.link || Drive.link(entry.id))}" target="_blank" rel="noopener">Buka di Google Drive</a>`);
  }
}
async function renderPage() {
  if (!V.doc) return;
  const token = V.token; const pageNo = V.page;
  let page;
  try { page = await V.doc.getPage(pageNo); } catch (e) { if (token === V.token) vShowMsg('<div>Muka surat ini tidak dapat dipaparkan.</div>'); return; }
  if (token !== V.token || pageNo !== V.page) return;
  const base = page.getViewport({ scale: 1, rotation: V.rotation });
  const availW = Math.max(120, stage.clientWidth - 24), availH = Math.max(120, stage.clientHeight - 24);
  if (V.mode === 'width') V.scale = availW / base.width;
  else if (V.mode === 'page') V.scale = Math.min(availW / base.width, availH / base.height);
  V.scale = Math.min(8, Math.max(0.2, V.scale));
  const vp = page.getViewport({ scale: V.scale, rotation: V.rotation });
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  let out = dpr; const maxDim = 4096, maxPx = 14e6;
  const cw = vp.width * out, ch = vp.height * out;
  if (cw > maxDim || ch > maxDim || cw * ch > maxPx) out = Math.min(maxDim / vp.width, maxDim / vp.height, Math.sqrt(maxPx / (vp.width * vp.height)));
  if (V.task) { try { V.task.cancel(); } catch (e) {} V.task = null; }
  canvas.width = Math.max(1, Math.floor(vp.width * out)); canvas.height = Math.max(1, Math.floor(vp.height * out));
  canvas.style.width = Math.floor(vp.width) + 'px'; canvas.style.height = Math.floor(vp.height) + 'px'; canvas.style.transform = '';
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const task = page.render({ canvasContext: ctx, viewport: vp, transform: out !== 1 ? [out, 0, 0, out, 0, 0] : null });
  V.task = task;
  try { await task.promise; } catch (e) { if (!(e && e.name === 'RenderingCancelledException')) { if (token === V.token) vShowMsg('<div>Muka surat ini tidak dapat dipaparkan.</div>'); } return; }
  if (V.task === task) V.task = null;
  $('#vPageInput').value = String(V.page); $('#vZoom').textContent = Math.round(V.scale * 100) + '%';
  $('#vPrev').disabled = V.page <= 1; $('#vNext').disabled = V.page >= V.doc.numPages;
  $('#vFitW').classList.toggle('on', V.mode === 'width'); $('#vFitP').classList.toggle('on', V.mode === 'page');
}
let rerenderTimer = null;
function scheduleRerender() { clearTimeout(rerenderTimer); rerenderTimer = setTimeout(() => { if (V.doc && (V.mode === 'width' || V.mode === 'page')) renderPage(); }, 160); }
function gotoPage(n) { if (!V.doc) return; n = Math.min(V.doc.numPages, Math.max(1, n | 0)); if (n === V.page) return; V.page = n; stage.scrollTop = 0; renderPage(); }
function zoomBy(f) { if (!V.doc) return; V.mode = 'custom'; V.scale = Math.min(8, Math.max(0.2, V.scale * f)); renderPage(); }
$('#vPrev').addEventListener('click', () => gotoPage(V.page - 1));
$('#vNext').addEventListener('click', () => gotoPage(V.page + 1));
$('#vZoomIn').addEventListener('click', () => zoomBy(1.2));
$('#vZoomOut').addEventListener('click', () => zoomBy(1 / 1.2));
$('#vFitW').addEventListener('click', () => { V.mode = 'width'; renderPage(); });
$('#vFitP').addEventListener('click', () => { V.mode = 'page'; renderPage(); });
$('#vRotate').addEventListener('click', () => { V.rotation = (V.rotation + 90) % 360; renderPage(); });
$('#vPageInput').addEventListener('change', e => gotoPage(parseInt(e.target.value, 10) || 1));
$('#vPageInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); gotoPage(parseInt(e.target.value, 10) || 1); e.target.blur(); } });
$('#vClose').addEventListener('click', () => closeViewer());
$('#vDock').addEventListener('click', () => { S.split = !V.docked; savePrefs(); dockViewer(S.split); });
$('#vFull').addEventListener('click', () => {
  const el = $('#viewer');
  if (V.docked) { S.split = false; savePrefs(); dockViewer(false); }
  if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} return; }
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
});
document.addEventListener('fullscreenchange', () => scheduleRerender());
document.addEventListener('keydown', e => {
  if ($('#viewer').hidden || !V.doc) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { gotoPage(V.page - 1); e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') { gotoPage(V.page + 1); e.preventDefault(); }
  else if (e.key === '+' || e.key === '=') zoomBy(1.2);
  else if (e.key === '-') zoomBy(1 / 1.2);
  else if (e.key === '0') { V.mode = 'width'; renderPage(); }
  else if (e.key === 'Escape') { if (!V.docked) closeViewer(); }
  else if (e.key === 'f' || e.key === 'F') $('#vFull').click();
});
stage.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); } }, { passive: false });
const T = { x0: 0, y0: 0, t0: 0, pinch: false, d0: 0, s0: 1, factor: 1 };
stage.addEventListener('touchstart', e => {
  if (e.touches.length === 2) { T.pinch = true; T.d0 = dist(e.touches); T.s0 = V.scale; T.factor = 1; }
  else if (e.touches.length === 1) { T.pinch = false; T.x0 = e.touches[0].clientX; T.y0 = e.touches[0].clientY; T.t0 = now(); }
}, { passive: true });
stage.addEventListener('touchmove', e => {
  if (T.pinch && e.touches.length === 2) { e.preventDefault(); const f = dist(e.touches) / (T.d0 || 1); T.factor = Math.min(8 / T.s0, Math.max(0.2 / T.s0, f)); canvas.style.transform = `scale(${T.factor})`; }
}, { passive: false });
stage.addEventListener('touchend', e => {
  if (T.pinch) { if (e.touches.length === 0) { T.pinch = false; canvas.style.transform = ''; if (Math.abs(T.factor - 1) > 0.02) { V.mode = 'custom'; V.scale = Math.min(8, Math.max(0.2, T.s0 * T.factor)); renderPage(); } } return; }
  if (!e.changedTouches || !e.changedTouches.length || !V.doc) return;
  const dx = e.changedTouches[0].clientX - T.x0, dy = e.changedTouches[0].clientY - T.y0, dt = now() - T.t0;
  const scrollable = stage.scrollWidth > stage.clientWidth + 4;
  if (!scrollable && dt < 700 && Math.abs(dx) > 70 && Math.abs(dy) < 60) { if (dx < 0) gotoPage(V.page + 1); else gotoPage(V.page - 1); }
}, { passive: true });
function dist(t) { const a = t[0], b = t[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
let drag = null;
stage.addEventListener('mousedown', e => { if (e.button !== 0) return; if (stage.scrollWidth <= stage.clientWidth && stage.scrollHeight <= stage.clientHeight) return; drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop }; stage.classList.add('grab'); });
window.addEventListener('mousemove', e => { if (!drag) return; stage.scrollLeft = drag.l - (e.clientX - drag.x); stage.scrollTop = drag.t - (e.clientY - drag.y); });
window.addEventListener('mouseup', () => { drag = null; stage.classList.remove('grab'); });
window.addEventListener('resize', () => { applySplitLayout(); scheduleRerender(); });

/* ---------- export ---------- */
const CSV_COLS = [['bil', 'Bil.'], ['status', 'Status bacaan'], ['penulis', 'Penulis'], ['tahun', 'Tahun'], ['tajuk', 'Tajuk'], ['rujukan', 'Rujukan APA 7'], ['doi', 'DOI'], ['jenis', 'Jenis sumber'], ['indeks', 'Pengindeksan'], ['kuartil', 'Kuartil'], ['negara', 'Negara'], ['peringkat', 'Peringkat pendidikan'], ['lokasi', 'Lokasi sekolah'], ['tema', 'Tema utama'], ['objektif', 'Objektif'], ['konstruk', 'Konstruk dan peranan'], ['definisi', 'Definisi konstruk'], ['teori', 'Teori dan sumber primer'], ['asasTeori', 'Asas teori'], ['rekaBentuk', 'Reka bentuk'], ['penilai', 'Siapa menilai siapa'], ['sampel', 'Sampel dan persampelan'], ['instrumen', 'Instrumen'], ['teknik', 'Teknik analisis'], ['perisian', 'Perisian dan prosedur'], ['dapatan', 'Dapatan utama'], ['cabaran', 'Cabaran'], ['implikasi', 'Kesimpulan dan implikasi'], ['batasan', 'Batasan dan cadangan pengarang'], ['jurang', 'Jurang'], ['jenisJurang', 'Jenis jurang'], ['kekuatan', 'Kekuatan'], ['kelemahan', 'Kelemahan'], ['mmat', 'Nota MMAT'], ['relevansi', 'Relevansi'], ['alasanRelevansi', 'Alasan relevansi'], ['jenisKesan', 'Kesan yang diuji'], ['padananKdPpo', 'Padanan KD ke PPO'], ['padananPpoKdg', 'Padanan PPO ke KDG'], ['bandingan', 'Bandingan silang'], ['bab', 'Bab'], ['subtopik', 'Subtopik'], ['jejak', 'Sumber primer untuk dijejak'], ['catatan', 'Catatan'], ['fail', 'Fail PDF'], ['failLink', 'Pautan Drive'], ['pautan', 'Pautan luar'], ['dicipta', 'Dicipta'], ['dikemaskini', 'Dikemas kini']];
function csvCell(v) { const s = String(v ?? '').replace(/\r\n|\r|\n/g, '\n'); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCSV(entries) {
  const head = CSV_COLS.map(c => csvCell(c[1])).join(',');
  const rows = entries.map(([id, d]) => CSV_COLS.map(([k]) => {
    let v = d[k];
    if (k === 'fail') v = (d.fail || []).map(f => f.nama).join('; ');
    else if (k === 'failLink') v = (d.fail || []).map(f => f.link || Drive.link(f.id)).join('; ');
    else if (Array.isArray(v)) v = v.join('; ');
    else if (k === 'dicipta' || k === 'dikemaskini') v = v ? fmtTime(v) : '';
    return csvCell(v);
  }).join(','));
  return [head].concat(rows).join('\r\n');
}
function saveFile(filename, data, type) {
  const blob = new Blob([data], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
}
function exportData(what) {
  const entries = what === 'csv-tapisan' ? filteredEntries() : Array.from(S.docs.entries()).sort((a, b) => (Number(a[1].bil) || 0) - (Number(b[1].bil) || 0));
  if (!entries.length) { toast('Tiada rekod untuk dieksport', true); return; }
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (what === 'json-semua') saveFile(`Repositori_SLR_${stamp}.json`, JSON.stringify(entries.map(([id, d]) => Object.assign({ id }, d)), null, 2), 'application/json');
  else saveFile(`Repositori_SLR_${stamp}${what === 'csv-tapisan' ? '_tapisan' : ''}.csv`, '﻿' + toCSV(entries), 'text/csv;charset=utf-8');
  toast('Fail dimuat turun');
}

/* ---------- events: dashboard ---------- */
$('#btnHome').addEventListener('click', () => { if (S.user) goPapan(); });
$('#btnBack').addEventListener('click', goPapan);
$('#btnNew').addEventListener('click', () => { const id = createArticle({}); renderList(); openRecord(id); $('#f_penulis').focus(); });
$('#list').addEventListener('click', e => {
  const fl = e.target.closest('[data-flip]'); if (fl) { e.stopPropagation(); openFlip(fl.dataset.flip, 0); return; }
  const dl = e.target.closest('[data-dl]'); if (dl) { e.stopPropagation(); downloadPdf(dl.dataset.dl, 0); return; }
  const row = e.target.closest('.row'); if (row) { openRecord(row.dataset.id); return; }
  const act = e.target.closest('[data-act]'); if (act) { if (act.dataset.act === 'baharu') $('#btnNew').click(); if (act.dataset.act === 'reset') resetFilters(); }
});
$('#list').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('row')) { e.preventDefault(); openRecord(e.target.dataset.id); } });
$('#nav').addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (b && S.user) goView(b.dataset.view); });
$('#list').addEventListener('change', e => { if (e.target.matches('input[data-upload]')) { const files = Array.from(e.target.files); e.target.value = ''; uploadFiles(files, null); } });
$('#fileTop').addEventListener('change', e => { const files = Array.from(e.target.files); e.target.value = ''; uploadFiles(files, null); });
$('#fileRekod').addEventListener('change', e => { const files = Array.from(e.target.files); e.target.value = ''; if (S.currentId) uploadFiles(files, S.currentId); });
$('#btnMore').addEventListener('click', e => { e.stopPropagation(); $('#moreMenu').hidden = !$('#moreMenu').hidden; });
$('#moreMenu').addEventListener('click', async e => {
  const b = e.target.closest('button[data-x]'); if (!b) return; $('#moreMenu').hidden = true;
  const x = b.dataset.x;
  if (x === 'keluar') { const okk = await confirmBox('Log keluar?', 'Rekod yang belum dihantar akan dihantar apabila log masuk semula.', 'Log keluar', false); if (okk) { flushAll(); await Auth.logout(); } }
  else if (x === 'drive') { await ensureDrive(true); }
  else if (x === 'drive-redirect') { const okk = await confirmBox('Sambung Drive melalui lencongan', 'Aplikasi akan beralih ke halaman kebenaran Google dan kembali ke sini selepas akses dibenarkan. Perubahan yang belum dihantar disimpan dahulu.', 'Teruskan', false); if (okk) Drive.connectRedirect(); }
  else if (x === 'diag') { await showDiag(); }
  else if (x === 'tetapan') { await showTetapan(); }
  else if (x === 'pasang') { if (S.installPrompt) { S.installPrompt.prompt(); try { await S.installPrompt.userChoice; } catch (er) {} S.installPrompt = null; $('#btnInstall').hidden = true; } }
  else exportData(x);
});
document.addEventListener('click', e => { if (!e.target.closest('.menu-wrap')) $('#moreMenu').hidden = true; });
$('#driveChip').addEventListener('click', () => ensureDrive(true));
$('#btnFilterToggle').addEventListener('click', () => $('#filters').classList.toggle('open'));
$('#btnCloseLog').addEventListener('click', () => { $('#uploadLog').hidden = true; });
const FILTER_IDS = { q: 'q', tema: 'fTema', relevansi: 'fRel', status: 'fStatus', peringkat: 'fPeringkat', jenis: 'fJenis', negara: 'fNegara', bab: 'fBab', padanan: 'fPadanan', tahunDari: 'fTahunDari', tahunHingga: 'fTahunHingga', pdf: 'fPdf' };
function readFilters() { const f = {}; Object.entries(FILTER_IDS).forEach(([k, id]) => { f[k] = $('#' + id).value; }); S.filters = f; S.sort = $('#sort').value; savePrefs(); renderList(); }
function writeFilters() { Object.entries(FILTER_IDS).forEach(([k, id]) => { $('#' + id).value = S.filters[k] || ''; }); $('#sort').value = S.sort || 'dikemaskini'; }
function resetFilters() { S.filters = {}; writeFilters(); savePrefs(); renderList(); }
let filterTimer = null;
$('#filters').addEventListener('input', e => { clearTimeout(filterTimer); filterTimer = setTimeout(readFilters, e.target.id === 'q' ? 180 : 0); });
$('#filters').addEventListener('submit', e => e.preventDefault());
$('#btnReset').addEventListener('click', resetFilters);
$('#sort').addEventListener('change', readFilters);
let dragDepth = 0;
document.addEventListener('dragenter', e => { if (!hasFiles(e) || !S.user) return; dragDepth++; if (S.view === 'papan') $('#dropHint').hidden = false; else if (S.view === 'rekod') $('#uploadBox').classList.add('over'); });
document.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) { $('#dropHint').hidden = true; $('#uploadBox').classList.remove('over'); $$('#picks .pick.over').forEach(p => p.classList.remove('over')); } });
document.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
document.addEventListener('drop', e => {
  if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('#dropHint').hidden = true; $('#uploadBox').classList.remove('over');
  if (!S.user) return;
  const files = Array.from(e.dataTransfer.files || []);
  const pick = S.view === 'harian' ? e.target.closest('.pick[data-i]') : null;
  if (pick) { Harian.intake(+pick.dataset.i, files); return; }
  if (S.view === 'rekod' && S.currentId) uploadFiles(files, S.currentId); else uploadFiles(files, null);
});
document.addEventListener('dragover', e => { if (!hasFiles(e) || S.view !== 'harian') return; $$('#picks .pick').forEach(p => p.classList.toggle('over', p.contains(e.target))); });
document.addEventListener('drop', () => $$('#picks .pick.over').forEach(p => p.classList.remove('over')));
function hasFiles(e) { return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files'); }

/* ---------- events: record ---------- */
buildForm();
function onFieldInput(e) {
  const k = e.target.dataset.k || (e.target.id === 'f_bil' ? 'bil' : e.target.id === 'f_status' ? 'status' : e.target.id === 'f_pautan' ? 'pautan' : null);
  if (!k || !S.currentId) return;
  queueUpdate(S.currentId, { [k]: readControl(k) });
  if (k === 'penulis' || k === 'tahun' || k === 'tajuk' || k === 'doi' || k === 'pautan') { const d = Object.assign({}, S.docs.get(S.currentId) || {}, S.pending[S.currentId] || {}); renderRecordHead(d); }
}
$('#rekod').addEventListener('input', e => { if (e.target.matches('textarea, input[type="text"], input[type="url"], input[type="number"]')) onFieldInput(e); });
$('#rekod').addEventListener('change', e => { if (e.target.matches('select, input[type="checkbox"], input[type="number"]')) onFieldInput(e); });
$('#rekod').addEventListener('focusout', () => { if (S.currentId && S.docs.get(S.currentId)) setTimeout(mergeIntoForm, 50); });
$('#btnDelete').addEventListener('click', () => { if (S.currentId) deleteArticle(S.currentId); });
$('#btnViewPdf').addEventListener('click', () => openViewer(S.currentId, 0));
$('#btnSplit').addEventListener('click', () => { S.split = !S.split; savePrefs(); if ($('#viewer').hidden) openViewer(S.currentId, 0); else dockViewer(S.split); });
$('#fileList').addEventListener('click', async e => {
  const v = e.target.closest('[data-view]'); if (v) { openViewer(S.currentId, +v.dataset.view); return; }
  const fl = e.target.closest('[data-flip]'); if (fl) { openFlip(S.currentId, +fl.dataset.flip); return; }
  const dl = e.target.closest('[data-dl]'); if (dl) { downloadPdf(S.currentId, +dl.dataset.dl); return; }
  const ix = e.target.closest('[data-idx]');
  if (ix) {
    const id = S.currentId; ix.disabled = true; ix.textContent = 'Mengindeks';
    try { const r = await Peta.indexArticle(id, p => { ix.textContent = 'Mengindeks ' + Math.round(p * 100) + '%'; }); toast(`Diindeks: ${r.ayat} ayat daripada ${r.pages} muka surat`); const nd = S.docs.get(id); if (nd && S.currentId === id) { renderFiles(nd); } }
    catch (er) { toast('Pengindeksan gagal: ' + (er && (er.message || driveMsg(er)) || ''), true); const nd = S.docs.get(id); if (nd && S.currentId === id) renderFiles(nd); }
    return;
  }
  const del = e.target.closest('[data-delfile]');
  if (del) {
    const d = S.docs.get(S.currentId); const i = +del.dataset.delfile; const f = (d.fail || [])[i]; if (!f) return;
    const okk = await confirmBox('Padam fail PDF?', `${f.nama}. Fail dibuang daripada Google Drive dan daripada rekod ini.`, 'Padam fail');
    if (!okk) return;
    if (V.entry && V.entry.id === f.id) closeViewer();
    try { if (!Drive.hasToken()) await ensureDrive(true); await Drive.remove(f.id); } catch (er) { toast('Fail tidak dapat dipadam dari Drive: ' + driveMsg(er) + '. Rekod tetap dikemas kini.', true); }
    V.cache.delete(f.id);
    const fail = (d.fail || []).filter((x, j) => j !== i);
    try { await writeNow(S.currentId, { fail }); const nd = S.docs.get(S.currentId); if (nd) { renderRecordHead(nd); renderFiles(nd); } toast('Fail dipadam'); } catch (er) {}
  }
});
$('#secNav').addEventListener('click', e => { const a = e.target.closest('a[data-sec]'); if (!a) return; e.preventDefault(); const sec = $('#' + a.dataset.sec); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); $$('#secNav a').forEach(x => x.classList.toggle('on', x === a)); });
$('#uploadBox').addEventListener('dragover', e => e.preventDefault());

/* ---------- login ---------- */
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const btn = $('#loginBtn'); btn.disabled = true; $('#loginErr').textContent = '';
  try { await Auth.login($('#loginEmail').value.trim(), $('#loginPw').value); }
  catch (er) { const c = er && er.code ? String(er.code) : ''; $('#loginErr').textContent = c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('invalid-login') ? 'E-mel atau kata laluan salah.' : c.includes('user-not-found') ? 'Akaun tidak ditemui.' : c.includes('too-many') ? 'Terlalu banyak percubaan. Cuba sebentar lagi.' : c.includes('network') ? 'Talian internet terputus.' : 'Log masuk gagal: ' + (c || 'ralat'); }
  btn.disabled = false;
});

/* ---------- connection ---------- */
function subscribe() {
  if (S.unsub) { try { S.unsub(); } catch (e) {} S.unsub = null; }
  S.unsub = DB.subscribe(snap => {
    const m = new Map(); snap.docs.forEach(d => m.set(d.id, d.data));
    Object.keys(S.pending).forEach(id => { if (m.has(id)) m.set(id, Object.assign({}, m.get(id), S.pending[id])); });
    S.docs = m;
    if (!snap.fromCache) { S.gotDefinitive = true; setConn(S.online ? 'ok' : 'luar'); }
    else if (!S.gotDefinitive) { if (m.size) { S.gotDefinitive = true; setConn(S.online ? 'cache' : 'luar', S.online ? 'Dari cache, menyegerakkan' : 'Luar talian, data dari cache'); } else setConn('cache'); }
    if (!snap.pending && snap.fromCache === false && S.currentId && !S.pending[S.currentId] && !$('#saveChip').hidden && $('#saveChip').classList.contains('warn')) setSave('ok');
    renderList();
    if (S.view === 'rekod' && S.currentId) { if (m.has(S.currentId)) mergeIntoForm(); else if (S.gotDefinitive && !S.pending[S.currentId]) { toast('Rekod ini telah dipadam di peranti lain'); goPapan(); } }
  }, err => {
    const c = err && err.code ? String(err.code) : '';
    if (c.includes('permission-denied')) { setConn('tiada', 'Tiada kebenaran'); showBanner('Akaun ini tidak dibenarkan membaca koleksi. Semak peraturan Firestore dan e-mel pemilik dalam config.js.', 'bad'); }
    else { setConn('ralat', 'Sambungan storan terputus'); setTimeout(subscribe, 4000); }
  });
}
window.addEventListener('online', () => { S.online = true; setConn('ok'); flushAll(); });
window.addEventListener('offline', () => { S.online = false; setConn('luar'); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) flushAll(); });

/* ---------- fail yang dikongsi ke aplikasi (Web Share Target, Android dan Windows) ---------- */
async function intakeShared() {
  if (!('caches' in window)) return;
  let files = [];
  try {
    const cache = await caches.open('rslr-kongsi'); const keys = await cache.keys();
    for (const req of keys) { const res = await cache.match(req); if (!res) continue; const name = decodeURIComponent(res.headers.get('x-nama') || 'kongsi.pdf'); const blob = await res.blob(); files.push(new File([blob], name, { type: 'application/pdf' })); await cache.delete(req); }
  } catch (e) { return; }
  if (/[?&]kongsi=1/.test(location.search)) history.replaceState(null, '', location.pathname);
  if (!files.length) return;
  toast(files.length + ' fail diterima daripada Kongsi. Menyimpan ke Google Drive.');
  const d = S.view === 'rekod' && S.currentId ? S.currentId : null;
  await uploadFiles(files, d);
}
if (TEST) window.__RSLR_intakeShared = intakeShared;

/* ---------- PWA: service worker and install prompt ---------- */
function registerSW() {
  if (!('serviceWorker' in navigator) || TEST) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Versi baharu tersedia', false, { label: 'Muat semula', fn: () => { w.postMessage('SKIP_WAITING'); } });
      });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); S.installPrompt = e; $('#btnInstall').hidden = false;
  if (!lsGet('rslr_install_shown', false) && S.user) { lsSet('rslr_install_shown', true); showBanner('Pasang Repositori SLR sebagai aplikasi pada peranti ini.', 'info', { label: 'Pasang', fn: async () => { showBanner(''); if (S.installPrompt) { S.installPrompt.prompt(); try { await S.installPrompt.userChoice; } catch (er) {} S.installPrompt = null; $('#btnInstall').hidden = true; } } }); }
});
window.addEventListener('appinstalled', () => { $('#btnInstall').hidden = true; showBanner(''); toast('Aplikasi dipasang'); });

/* ---------- boot ---------- */
async function start() {
  $('#menuVersi').textContent = 'Repositori SLR v' + VERSION;
  const prefs = lsGet('rslr_prefs', {});
  S.filters = prefs.filters || {}; S.sort = prefs.sort || 'dikemaskini'; S.split = !!prefs.split;
  writeFilters();
  const miss = configMissing();
  if (!TEST && miss.length) {
    $('#setupList').innerHTML = miss.map(m => `<li>Nilai <code>${esc(m)}</code> dalam <code>config.js</code></li>`).join('') + `<li>Peraturan Firestore dan OAuth client ID mengikut panduan dalam README.</li>`;
    showView('setup'); setConn('tiada', 'Persediaan belum lengkap'); return;
  }
  try { if (TEST) makeTestAdapters(); else await makeRealAdapters(); }
  catch (e) { showView('setup'); $('#setupList').innerHTML = `<li>Firebase gagal dimulakan: <code>${esc(e && e.message ? e.message : String(e))}</code>. Semak nilai dalam config.js.</li>`; setConn('tiada'); return; }
  registerSW();
  Auth.onChange(user => {
    if (user && C.ownerEmail && String(user.email).toLowerCase() !== String(C.ownerEmail).toLowerCase() && !TEST) {
      showView('login'); $('#loginErr').textContent = 'Akaun ' + user.email + ' bukan pemilik repositori ini.'; Auth.logout(); return;
    }
    S.user = user;
    if (!user) { if (S.unsub) { try { S.unsub(); } catch (e) {} S.unsub = null; } S.docs = new Map(); S.gotDefinitive = false; showView('login'); setConn('tiada', 'Belum log masuk'); $('#driveChip').hidden = true; return; }
    $('#menuEmail').textContent = user.email || '';
    setDriveChip(Drive.ready() ? (Drive.hasToken() ? 'ok' : 'sambung') : 'tiada');
    if (!Drive.ready()) { let tries = 0; const iv = setInterval(() => { tries++; if (Drive.ready()) { clearInterval(iv); setDriveChip(Drive.hasToken() ? 'ok' : 'sambung'); } else if (tries > 40) clearInterval(iv); }, 500); }
    if (Drive.lastError && Drive.lastError.code && !Drive.hasToken()) toast('Google menolak lencongan: ' + driveMsg(Drive.lastError), true);
    if (Drive.justRedirected && Drive.hasToken()) toast('Google Drive disambung melalui lencongan');
    setConn('cache'); S.gotDefinitive = false;
    const wantId = prefs.view === 'rekod' ? prefs.currentId : null;
    const wantView = prefs.view === 'harian' || prefs.view === 'peta' ? prefs.view : 'papan';
    showView('papan'); renderList(); subscribe();
    if (wantView !== 'papan') goView(wantView);
    if (wantId) { const iv = setInterval(() => { if (S.docs.has(wantId)) { clearInterval(iv); if (S.view === 'papan') openRecord(wantId); } else if (S.gotDefinitive) clearInterval(iv); }, 300); setTimeout(() => clearInterval(iv), 15000); }
    // Cadangan Harian: muat (dan cari sekali sehari secara automatik) selepas rekod repositori tiba.
    const hv = setInterval(() => { if (S.gotDefinitive || !navigator.onLine) { clearInterval(hv); Harian.load(Harian.todayStr(), true).then(() => Harian.loadDates()).then(() => intakeShared()); } }, 400); setTimeout(() => clearInterval(hv), 20000);
  });
}

/* ---------- modul: flipbook, cadangan harian, peta ayat ---------- */
const R = {
  $, $$, esc, toast, confirmBox, fmtTime, fmtBytes, lsGet, lsSet, saveFile, normDoi, TEMA, C, S, V,
  db: () => DB, drive: () => Drive, loadPdfJs, ensureDrive, driveMsg, keepCache, openViewer, gotoPage, openRecord, createArticle, writeNow, renderList,
  uploadFiles, openFlip, downloadPdf
};
const Flip = initFlip(R); R.Flip = Flip;
const Harian = initHarian(R); R.Harian = Harian;
const Peta = initPeta(R); R.Peta = Peta;
if (TEST) window.__RSLR = { R, Flip, Harian, Peta, S };
start();
