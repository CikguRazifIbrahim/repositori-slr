/* Pandu Tulis (menu Artikel): bimbingan menulis artikel langkah demi langkah. Selepas artikel sumber dipilih, sistem menyediakan
   "folder" bagi setiap bahagian artikel mengikut jenisnya (pangkalan pengetahuan dalam pandu-data.js). Setiap folder dipetakan kepada
   satu seksyen aras 1 (berserta subseksyennya) dan melalui lima langkah: (1) artikel panduan utama dan sekunder, (2) soal jawab dengan
   agen tentang apa yang patut dimasukkan, (3) cadangan penulisan daripada agen, (4) penulisan ASAL oleh pemilik sendiri, (5) semakan
   bermeter (panjang, liputan pemboleh ubah, sitasi, gerakan retorik, parafrasa, gaya) dan semakan agen sebelum folder ditandakan siap.
   Semua keluaran agen masuk ke RAM seksyen; ASAL tidak pernah ditulis oleh agen. Abstrak ditulis paling akhir daripada ASAL folder lain;
   Rujukan dijana daripada sitasi. Simpanan: meta/pandu_<id> (tetapan, peta folder, status, PRISMA, token), meta/pandu_<id>__<folder>
   (pilihan sumber, jawapan, log agen) dan meta/pandu_gaya (peraturan gaya), berserta salinan tempatan.
   ACUAN: bagi setiap keluarga jenis artikel, satu artikel contoh sebenar telah dibedah (pandu-acuan.js). Apabila acuan aktif, folder dan
   subseksyen mengikut bahagian artikel contoh itu, sasaran panjang folder mengikut nisbahnya, setiap folder memaparkan peta perenggan
   (fungsi, cara dibina, panjang, sitasi, pola ayat) dan agen dibekalkan acuan yang sama. Pemilik boleh membedah artikel contoh sendiri
   daripada repositori (meta/pandu_acuan_<keluarga>) atau mematikan acuan. Sasaran lalai ialah jurnal berwasit berindeks MyCite. */
import * as D from './pandu-data.js';
import { ACUAN, POLA } from './pandu-acuan.js';
import * as DNA from './pandu-dna.js';
import { initPrisma } from './prisma.js';
import { initOutput } from './output.js';
import { PIAWAI_RINGKAS } from './bahasa-data.js';

export function initPandu(R, C) {
  const { $, esc, toast } = R; const { A, Teks } = C; const Bd = () => R.Banding;
  const P = { id: null, t: null, f: {}, ac: {}, gaya: null, buka: null, busy: null, timers: {}, awan: {}, cache: {}, terbuka: new Set(), kira: 0 };
  const HAD_PANGGIL = 12, TAMBAH_PANGGIL = 5, HAD_UTAMA = 6, HAD_LOG = 12, HAD_TEKS = 16000;
  const kunciT = id => 'meta/pandu_' + id, lsT = id => 'rslr_pandu_' + id;
  const kunciF = (id, k) => 'meta/pandu_' + id + '__' + k, lsF = (id, k) => 'rslr_pandu_' + id + '__' + k;
  const KUNCI_GAYA = 'meta/pandu_gaya', LS_GAYA = 'rslr_pandu_gaya';

  /* ---- utiliti ---- */
  const angka = n => Number(n || 0).toLocaleString('en-US');
  const anggarToken = t => Math.round(String(t || '').length / 3.6);
  const sekarang = () => Date.now();
  const idBaru = p => p + Date.now().toString(36) + (P.kira++).toString(36) + Math.random().toString(36).slice(2, 5);
  const patah = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const bersih = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const perenggan = t => String(t || '').replace(/\r/g, '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const tanpaSempang = t => String(t == null ? '' : t).replace(/\s*[—–―]\s*/g, ', ');
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const potong = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n) + ' [dipotong]' : t; };
  const dalamBersih = x => typeof x === 'string' ? tanpaSempang(x) : Array.isArray(x) ? x.map(dalamBersih) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, dalamBersih(v)])) : x;

  /* ---- simpanan ---- */
  const tKosong = () => ({ v: 1, sedia: false, bahasa: 'ms', sasaran: 6000, sasaranAuto: true, acuan: 'bina', aras: 'mycite', pemboleh: [], peta: {}, status: {}, prisma: null, token: { masuk: 0, keluar: 0, panggil: 0 }, menyeluruh: null, masa: 0 });
  const fKosong = k => ({ k, utama: [], sekunder: [], jawab: {}, balas: [], balasLama: [], log: [], padamLog: [], semak: null, arahan: '', tanya: '', had: HAD_PANGGIL, panggil: 0, masa: 0 });
  const penuh = x => !!(x && (x.jawapan || x.data));
  function muatLokal(id) { P.id = id; P.t = Object.assign(tKosong(), R.lsGet(lsT(id), null) || {}); P.f = {}; P.cache = {}; P.buka = R.lsGet('rslr_pandu_buka_' + id, null); P.terbuka = new Set(); }
  async function muatAwan(id) {
    if (P.awan[id]) return; P.awan[id] = true;
    try { const a = await R.db().get(kunciT(id)); if (a && P.id === id && (a.masa || 0) > (P.t.masa || 0)) { P.t = Object.assign(tKosong(), a); R.lsSet(lsT(id), P.t); render(); } } catch (e) {}
  }
  function simpanT(segera) {
    if (!P.id) return; P.t.masa = sekarang(); R.lsSet(lsT(P.id), P.t); const id = P.id; const data = P.t; clearTimeout(P.timers.t);
    P.timers.t = setTimeout(async () => { try { await R.db().set(kunciT(id), data); } catch (e) { console.warn('pandu: tetapan awan gagal', e); } }, segera ? 0 : 900);
  }
  function gabungF(l, a) {
    const baru = (a.masa || 0) > (l.masa || 0) ? a : l; const lama = baru === a ? l : a; const out = Object.assign(fKosong(baru.k), lama, baru); const log = {};
    (lama.log || []).concat(baru.log || []).forEach(x => { if (!log[x.id] || !penuh(log[x.id]) || penuh(x)) log[x.id] = x; });
    const padam = new Set((lama.padamLog || []).concat(baru.padamLog || [])); out.padamLog = Array.from(padam).slice(-40);
    out.log = Object.values(log).filter(x => !padam.has(x.id)).sort((x, y) => (x.masa || 0) - (y.masa || 0)).slice(-HAD_LOG); return out;
  }
  /* Salinan tempatan menyimpan teks penuh empat entri log terakhir sahaja (storan pelayar terhad); awan menyimpan semuanya. */
  const ringkasLokal = f => Object.assign({}, f, { log: (f.log || []).map((x, i, arr) => i >= arr.length - 4 ? x : Object.assign({}, x, { jawapan: undefined, data: undefined })) });
  function fd(k) { if (!P.f[k]) { P.f[k] = Object.assign(fKosong(k), R.lsGet(lsF(P.id, k), null) || {}); muatFolderAwan(k); } return P.f[k]; }
  async function muatFolderAwan(k) {
    const id = P.id; const kk = id + '__' + k; if (P.awan[kk]) return; P.awan[kk] = true;
    try { const a = await R.db().get(kunciF(id, k)); if (a && P.id === id) { P.f[k] = gabungF(P.f[k] || fKosong(k), a); R.lsSet(lsF(id, k), ringkasLokal(P.f[k])); if (P.buka === k && !P.busy) { const aktif = document.activeElement; if (!(aktif && aktif.closest && aktif.closest('#artPandu'))) renderFolder(); } } } catch (e) {}
  }
  function simpanF(k, segera) {
    const f = P.f[k]; if (!f || !P.id) return; f.masa = sekarang(); f.log = (f.log || []).slice(-HAD_LOG); R.lsSet(lsF(P.id, k), ringkasLokal(f)); const id = P.id; clearTimeout(P.timers['f' + k]);
    P.timers['f' + k] = setTimeout(async () => { try { await R.db().set(kunciF(id, k), f); } catch (e) { console.warn('pandu: folder awan gagal', e); } }, segera ? 0 : 900);
  }
  function gaya() { if (!P.gaya) P.gaya = Object.assign({}, D.GAYA_LALAI, R.lsGet(LS_GAYA, null) || {}); return P.gaya; }
  async function muatGaya() { if (P.awan.gaya) return; P.awan.gaya = true; try { const a = await R.db().get(KUNCI_GAYA); const l = R.lsGet(LS_GAYA, null) || {}; if (a && (a.masa || 0) > (l.masa || 0)) { P.gaya = Object.assign({}, D.GAYA_LALAI, a); R.lsSet(LS_GAYA, a); } } catch (e) {} }
  const senarai = (t, pemisah) => String(t || '').split(pemisah).map(x => x.trim()).filter(Boolean);

  /* ---- model: folder dan seksyen ---- */
  const kel = () => D.keluargaDari((C.doc() || {}).jenis);
  /* Acuan aktif: 'bina' (artikel contoh terbina), 'sendiri' (dibedah oleh agen daripada artikel repositori) atau 'tiada'. */
  const kunciAc = k => 'meta/pandu_acuan_' + k, lsAc = k => 'rslr_pandu_acuan_' + k;
  const PERANAN = ['pendahuluan', 'literatur', 'kaedah', 'dapatan', 'perbincangan', 'kesimpulan', 'kerangka', 'badan'];
  function kemasAcuan(a) {
    if (!a || !Array.isArray(a.bahagian)) return null; a.bahagian = a.bahagian.filter(b => b && b.bm); if (!a.bahagian.length) return null; const kira = {}; const jum = a.bahagian.reduce((s, b) => s + (Number(b.kata) || 0), 0);
    a.bahagian.forEach(b => { if (!PERANAN.includes(b.p)) b.p = 'badan'; kira[b.p] = (kira[b.p] || 0) + 1; b.k = kira[b.p] === 1 ? b.p : b.p + kira[b.p]; b.kata = Number(b.kata) || 0; b.peratus = jum ? Math.round(100 * b.kata / jum) : 0; b.en = b.en || b.bm; b.sub = (b.sub || []).filter(x => x && x.bm); b.peta = (b.peta || []).filter(x => x && x.f).map(x => Object.assign({}, x, { g: POLA[x.g] ? x.g : 'bukti' })); b.ajar = b.ajar || []; b.elak = b.elak || []; b.per = Number(b.per) || b.peta.length; b.sit = Number(b.sit) || 0; b.jadual = Number(b.jadual) || 0; b.rajah = Number(b.rajah) || 0; });
    a.ukuran = Object.assign({}, a.ukuran || {}); a.ukuran.badan = jum; a.ciri = a.ciri || []; a.suai = a.suai || []; a.abstrak = a.abstrak || {}; a.sendiri = true; return a;
  }
  function acuanSendiri(k) { if (!(k in P.ac)) { const l = R.lsGet(lsAc(k), null); P.ac[k] = l && l.acuan ? l : null; muatAcuanAwan(k); } return P.ac[k]; }
  async function muatAcuanAwan(k) { try { const a = await R.db().get(kunciAc(k)); if (a && a.acuan && (!P.ac[k] || (a.masa || 0) > (P.ac[k].masa || 0))) { P.ac[k] = a; R.lsSet(lsAc(k), a); if (P.t && P.t.acuan === 'sendiri') render(); } } catch (e) {} }
  function acuan() { const k = kel(); const pilih = (P.t && P.t.acuan) || 'bina'; if (pilih === 'tiada') return null; if (pilih === 'sendiri') { const x = acuanSendiri(k); if (x && x.acuan) return x.acuan; } return ACUAN[k] || null; }
  let memoF = { kunci: '', senarai: [] };
  const folders = () => {
    const d = C.doc(); if (!d || !d.jenis) return []; const ac = acuan(); const kunci = d.jenis + '|' + (ac ? ac.id : '-'); if (memoF.kunci === kunci) return memoF.senarai;
    const lalai = D.folderJenis(d.jenis, C.STRUKTUR[d.jenis]); let out = lalai;
    if (ac) { const cari = p => lalai.find(f => f.p === p); out = []; const abs = cari('abstrak'); if (abs) out.push(abs);
      ac.bahagian.forEach(b => out.push({ k: b.k, p: b.p, t: [b.bm, b.en || b.bm], sub: (b.sub || []).map(x => [x.bm, x.en || x.bm]), ac: b }));
      if (!ac.bahagian.some(b => b.p === 'kesimpulan')) { const kes = cari('kesimpulan'); if (kes) out.push(kes); } const ruj = cari('rujukan'); if (ruj) out.push(ruj); }
    memoF = { kunci, senarai: out }; return out;
  };
  const bulat = (n, g) => Math.round(n / g) * g;
  /* Jumlah sasaran: mengikut saiz badan artikel contoh (dihadkan mengikut aras jurnal) selagi pemilik tidak menetapkan angka sendiri. */
  function jumlahSasaran() { const ac = acuan(); if (P.t && P.t.sasaranAuto !== false && ac && ac.ukuran && ac.ukuran.badan) { const [lo, hi] = P.t.aras === 'scopus' ? [5000, 9000] : [4000, 7000]; return Math.min(hi, Math.max(lo, bulat(ac.ukuran.badan, 500))); } return (P.t && P.t.sasaran) || 6000; }
  function sasaran(f) { const j = jumlahSasaran(); if (f && f.ac && f.ac.peratus) { const t = j * f.ac.peratus / 100; return [Math.max(40, bulat(t * 0.8, 10)), Math.max(60, bulat(t * 1.2, 10))]; } return D.sasaranPatah(kel(), f, folders(), j); }
  const arasTeks = () => P.t && P.t.aras === 'scopus' ? 'jurnal berindeks Scopus atau Web of Science' : 'jurnal berwasit berindeks MyCite (piawaian penulisan tetap tinggi supaya artikel juga layak dipertimbangkan oleh jurnal berindeks Scopus)';
  const arasPenilai = () => P.t && P.t.aras === 'scopus' ? 'jurnal berindeks Scopus' : 'jurnal berwasit berindeks MyCite';
  const tulis = () => D.urutanTulis(folders());
  const folderDari = k => folders().find(f => f.k === k) || null;
  const specF = f => D.spec(kel(), f.p);
  const en = () => P.t && P.t.bahasa === 'en';
  const tajukF = f => f.t[en() ? 1 : 0];
  const namaBahasa = () => en() ? 'Bahasa Inggeris' : 'Bahasa Melayu Malaysia';
  const adaPrisma = () => D.ADA_PRISMA.has(kel());
  const adaOutput = () => D.ADA_OUTPUT.has(kel());
  /* DNA Pernyataan Masalah (pandu-dna.js): panel J, meter DNA jurang dan arahan agen bagi folder Pendahuluan sahaja. */
  const dnaAktif = f => !!(f && f.p === 'pendahuluan' && P.t && DNA.aktif(P.t, kel()));
  function dnaCtx() { const d = C.doc(); const ids = d ? C.sumberAda(d) : []; return { t: P.t, kel: kel(), en: en(), esc, sumber: ids.map(id => { const r = Bd().rekod(id) || {}; return { id, r, nama: Bd().nama(r) }; }) }; }
  function sidFolder(f) { const d = C.doc(); const id = f && P.t.peta ? P.t.peta[f.k] : null; return id && d && d.seksyen[id] && !d.seksyen[id].padam ? id : null; }
  function julat(f) {
    const sid = sidFolder(f); if (!sid) return []; const ids = Teks.senarai(A.id); const nb = Teks.nombor(A.id); const i = ids.indexOf(sid); if (i < 0) return [sid];
    const asas = (nb[sid] || { aras: 1 }).aras; const out = [sid]; for (let j = i + 1; j < ids.length; j++) { if ((nb[ids[j]] || { aras: 1 }).aras <= asas) break; out.push(ids[j]); } return out;
  }
  function folderSeksyen(sid) { if (!sid || !P.t || !P.t.sedia) return null; return folders().find(f => julat(f).includes(sid)) || null; }
  function htmlSek(id) { const d = C.doc(); const s = d && d.seksyen[id]; if (!s) return ''; if (Teks.state.bab === A.id && Teks.state.sek === id) { const ed = $('#artTeks'); if (ed) return ed.innerHTML; } return Teks.htmlSeksyen(s) || ''; }
  function urai(f) {
    const html = julat(f).map(htmlSek).join(''); const dom = new DOMParser().parseFromString('<!doctype html><html><body>' + html + '</body></html>', 'text/html').body; const per = []; let jadual = 0;
    Array.from(dom.children).forEach(e => { if (e.tagName === 'TABLE') { jadual++; return; } const t = (e.textContent || '').replace(/\s+/g, ' ').trim(); if (t) per.push(t); });
    const teks = Teks.teksDariHtml(html); return { html, teks, per, jadual, imej: dom.querySelectorAll('img').length, altImej: Array.from(dom.querySelectorAll('img')).map(i => i.getAttribute('alt') || '').join(' '), patah: patah(teks) };
  }
  const teksFolder = f => urai(f).teks;
  function sasaranRam(f) { const j = julat(f); return Teks.state.bab === A.id && j.includes(Teks.state.sek) ? Teks.state.sek : j[0] || null; }
  /* Menambah HTML di hujung RAM atau ASAL satu seksyen (suntingan yang belum disimpan dalam editor disimpan dahulu). */
  function sisip(sid, mana, html) {
    const d = C.doc(); const s = d && d.seksyen[sid]; if (!s || s.padam) return false; Teks.flushEditor();
    Teks.tulisSeksyen(A.id, sid, mana === 'asal' ? { html: (Teks.htmlSeksyen(s) || '') + html } : { ram: (s.ram || '') + html }, { senyap: true, segera: true });
    if (Teks.state.bab === A.id && Teks.state.sek === sid) Teks.renderEditor(); Teks.renderSenarai(); return true;
  }

  /* ---- sitasi: padankan Penulis (Tahun) dalam teks dengan rekod repositori ---- */
  const HENTI = new Set(['menurut', 'kajian', 'dapatan', 'jadual', 'rajah', 'table', 'figure', 'lihat', 'see', 'bab', 'seksyen', 'tahun', 'pada', 'dalam', 'oleh', 'dan', 'and', 'januari', 'februari', 'mac', 'april', 'mei', 'jun', 'julai', 'ogos', 'september', 'oktober', 'november', 'disember', 'january', 'february', 'march', 'may', 'june', 'july', 'august', 'october', 'december', 'according', 'study', 'studies', 'seterusnya', 'selain', 'namun', 'walau', 'sebaliknya', 'justeru', 'however', 'moreover', 'furthermore', 'similarly', 'likewise', 'while', 'whereas', 'both', 'begitu', 'malah', 'misalnya', 'contohnya', 'the', 'for', 'sebagai', 'seperti', 'kedua', 'manakala', 'sementara', 'oleh', 'berbeza', 'selari', 'in', 'as', 'by', 'kerana', 'bagi', 'daripada', 'kepada']);
  const RE_SIT = /(\p{Lu}[\p{L}'’-]+)(\s+\p{Lu}[\p{L}'’-]+)?(?:\s+et\s+al\.?|\s+dan\s+rakan(?:-rakan)?|\s*,?\s+(?:dan|and|&)\s+\p{Lu}[\p{L}'’-]+)?\s*(?:,\s*|\s*\(\s*)((?:19|20)\d{2})[a-z]?(?!\d)/gu;
  const kataKunci = w => bersih(w).replace(/[^a-z]/g, '');
  function indeks() {
    const d = C.doc(); const sumber = new Set((d && d.sumber) || []); if (P.cache.indeks && sekarang() - P.cache.indeksMasa < 4000 && P.cache.indeksN === R.S.docs.size + ':' + sumber.size) return P.cache.indeks;
    const out = [];
    R.S.docs.forEach((d0, id) => { const r = Bd().rekod(id); const pen = String(r.penulis || '').replace(/\(\s*\d{4}[a-z]?\s*\)/g, ' ').replace(/\s+/g, ' ').trim(); const th = (String(r.tahun || '').match(/(?:19|20)\d{2}/) || [])[0]; if (!pen || !th) return; const pertama = pen.split(/\s+et\s+al\b|\s+dan\s+|\s+and\s+|&|,|;/i)[0]; const tok = pertama.split(/\s+/).map(kataKunci).filter(w => w.length >= 2); if (!tok.length) return; out.push({ id, tok, tahun: th, nama: pen + ' (' + th + ')', dalam: sumber.has(id), rujukan: String(r.rujukan || '').trim(), bil: r.bil }); });
    P.cache.indeks = out; P.cache.indeksMasa = sekarang(); P.cache.indeksN = R.S.docs.size + ':' + sumber.size; return out;
  }
  function cariSitasi(teks) {
    const out = []; const ix = indeks(); let m; RE_SIT.lastIndex = 0; teks = String(teks || '');
    while ((m = RE_SIT.exec(teks))) {
      const asal = [m[1], (m[2] || '').trim()].filter(Boolean); const calon = asal.map(kataKunci).filter(w => w && !HENTI.has(w)); if (!calon.length) continue; const tahun = m[3];
      const padan = ix.filter(x => x.tahun === tahun && calon.some(c => x.tok.includes(c))); const p = padan.find(x => x.dalam) || padan[0] || null;
      const papar = asal.filter(w => !HENTI.has(kataKunci(w))).join(' ') + ' (' + tahun + ')';
      out.push({ i: m.index, tahun, id: p ? p.id : null, dalam: !!(p && p.dalam), kunci: p ? p.id : calon[calon.length - 1] + tahun, nama: p ? p.nama : papar });
    }
    return out;
  }
  const mulaPengarang = t => { RE_SIT.lastIndex = 0; const m = RE_SIT.exec(t); return !!(m && m.index <= 1 && !HENTI.has(kataKunci(m[1]))); };

  /* ---- meter failsafe ---- */
  const kataNorm = t => bersih(t).replace(/\[[^\]]{0,60}\]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  function kepingan(teks) { const w = kataNorm(teks); const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' ')); return s; }
  function teksAgen(F) { return (F.log || []).map(x => x.mod === 'bincang' && x.data ? [x.data.cadanganIsi].concat((x.data.rangka || []).map(r => r.isi)).join('\n') : x.mod === 'semak' ? '' : x.jawapan || '').join('\n'); }
  function adaPv(v, tn) { return [v.nama].concat(senarai(v.alias, /[,;]/)).map(x => bersih(x).trim()).filter(Boolean).some(n => new RegExp('(^|[^a-z0-9])' + escRe(n) + '([^a-z0-9]|$)').test(tn)); }
  const ayat = t => String(t || '').split(/(?<=[.!?])\s+(?=[\p{Lu}"“(])/u).map(x => x.trim()).filter(x => x.length > 2);
  function ukurGaya(f, sp, u, per) {
    const g = gaya(); const tn = ' ' + bersih(u.teks).replace(/\s+/g, ' ') + ' '; const butir = []; let berat = 0, ringan = 0;
    const sempang = (u.teks.match(/[—–―]/g) || []).length; if (sempang) { berat++; butir.push(`${sempang} tanda sempang panjang (em atau en) ditemui; gantikan dengan koma, "iaitu", "kerana" atau "hingga".`); }
    const larang = senarai(g.larang, /[,;\n]/).map(x => bersih(x)).filter(x => new RegExp('(^|[^a-z0-9-])' + escRe(x) + '([^a-z0-9-]|$)').test(tn)); if (larang.length) { berat++; butir.push('Istilah yang dilarang dalam peraturan gaya: ' + larang.join(', ') + '.'); }
    const frasa = senarai(g.frasa, /[;\n]/).map(x => bersih(x)).filter(x => tn.includes(' ' + x + ' ') || tn.includes(' ' + x + ',') || tn.includes(' ' + x + '.')); if (frasa.length) { ringan++; butir.push('Frasa yang berbunyi seperti tulisan mesin atau terjemahan terus: ' + frasa.map(x => '"' + x + '"').join(', ') + '.'); }
    if (/(^|[^a-z])di mana([^a-z]|$)/.test(tn) && !en()) { const kali = (tn.match(/ di mana /g) || []).length; if (kali) { ringan++; butir.push(`"di mana" digunakan ${kali} kali; jika ia berfungsi sebagai kata hubung, gantikan dengan "yang", "iaitu" atau pecahkan ayat.`); } }
    const pembuka = senarai(g.pembuka, /[;\n]/).map(x => bersih(x)); const soalan = ayat(u.teks).filter(a => /\?\s*$/.test(a) || /^(SK|RQ|Soalan)\s*\d/i.test(a)); const salahSoalan = soalan.filter(a => { const b = bersih(a).replace(/^(sk|rq|soalan( kajian| ulasan)?)\s*\d+\s*[:.)-]?\s*/, ''); return pembuka.some(p => b.startsWith(p)) || /\btahap\b/.test(b); });
    if (salahSoalan.length) { ringan++; butir.push(`${salahSoalan.length} soalan kajian bermula dengan "Apakah", "Sejauh mana" atau menggunakan "tahap": gunakan "Yang mana" atau "Bagaimana" (Which, How), satu soalan satu perkara.`); }
    const awal = per.filter(p => p.n >= 12).map(p => bersih(p.t).split(/[\s,]+/)[0]); for (let i = 0; i + 2 < awal.length; i++) if (awal[i] && awal[i] === awal[i + 1] && awal[i] === awal[i + 2]) { ringan++; butir.push(`Tiga perenggan berturut-turut bermula dengan "${awal[i]}"; pelbagaikan pembuka perenggan.`); break; }
    const ay = ayat(u.teks).map(patah).filter(n => n >= 3); if (ay.length >= 8) { const min = ay.reduce((s, x) => s + x, 0) / ay.length; const sp2 = Math.sqrt(ay.reduce((s, x) => s + (x - min) * (x - min), 0) / ay.length); if (sp2 / min < 0.28) butir.push(`Panjang ayat hampir seragam (purata ${Math.round(min)} patah); selang-selikan ayat pendek dengan ayat sederhana supaya tulisan bersuara.`); }
    const lain = en() ? [' yang ', ' dan ', ' dalam ', ' kepada ', ' untuk ', ' dengan ', ' adalah ', ' ini '] : [' the ', ' of ', ' and ', ' is ', ' are ', ' that ', ' with ', ' this ']; const w = u.patah || 1; const asing = lain.reduce((s, k) => s + (tn.split(k).length - 1), 0); if (u.patah >= 80 && asing / w > 0.07) butir.push(`Teks bercampur bahasa (kira-kira ${Math.round(100 * asing / w)}% kata tugas ${en() ? 'Bahasa Melayu' : 'Bahasa Inggeris'}); manuskrip ini ditetapkan dalam ${namaBahasa()}.`);
    if (f.p === 'dapatan' && D.kumpulanDari(kel()) === 'emp') { const sifar = (u.teks.match(/(?:\b[prR]|β|α|CR|AVE|RMSEA|CFI|TLI|SRMR)\s*[=<>]\s*-?0\.\d+/g) || []).length; if (sifar) butir.push(`${sifar} nilai statistik ditulis dengan sifar di hadapan (contoh 0.75); bagi nilai yang tidak boleh melebihi satu, gaya APA menulis .75.`); }
    const st = berat ? 'gagal' : ringan ? 'amaran' : 'ok';
    return { k: 'gaya', nama: 'Gaya', nilai: Math.max(0, 100 - berat * 30 - ringan * 12), status: u.patah ? st : 'info', teks: !u.patah ? 'belum ditulis' : berat + ringan ? `${berat + ringan} perkara perlu dibaiki` : 'mematuhi peraturan gaya', butir };
  }
  function ukur(f) {
    const sp = specF(f); const F = fd(f.k); const u = urai(f); const n = u.patah; const m = []; if (f.p === 'rujukan') return { n, meter: [], sedia: 0, isu: [], u };
    const per = u.per.map(t => ({ t, n: patah(t), sit: cariSitasi(t) })); const sit = per.flatMap(p => p.sit); const tn = bersih(u.teks); const g = gaya();
    /* panjang */
    const ss = sasaran(f);
    if (ss) { const [a, b] = ss; let st = 'ok'; const butir = [];
      if (!n) { st = 'gagal'; butir.push('ASAL folder ini belum ditulis.'); } else if (n < a * 0.6) { st = 'gagal'; butir.push(`Terlalu pendek: kurang ${angka(a - n)} patah perkataan untuk mencapai minimum.`); } else if (n < a) { st = 'amaran'; butir.push(`Kurang ${angka(a - n)} patah perkataan untuk mencapai minimum.`); } else if (n > b * (f.p === 'abstrak' ? 1 : 1.2)) { st = f.p === 'abstrak' ? 'gagal' : 'amaran'; butir.push(`Melebihi sasaran sebanyak ${angka(n - b)} patah perkataan; padatkan${f.p === 'abstrak' ? ' mengikut had jurnal' : ' atau pindahkan sebahagian ke folder lain'}.`); }
      m.push({ k: 'panjang', nama: 'Panjang', nilai: Math.min(100, Math.round(100 * n / a)), status: st, teks: `${angka(n)} daripada ${angka(a)} hingga ${angka(b)} patah`, butir }); }
    /* pemboleh ubah */
    if (sp.pemboleh !== 'tidak') { const pv = (P.t.pemboleh || []).filter(v => v.nama);
      if (!pv.length) m.push({ k: 'pemboleh', nama: 'Pemboleh ubah', nilai: 0, status: 'amaran', teks: 'belum ditetapkan', butir: ['Tetapkan pemboleh ubah atau konstruk utama artikel (butang Tetapkan di bahagian atas Pandu Tulis) supaya liputannya dapat disemak dalam setiap folder.'] });
      else { const tiada = pv.filter(v => !adaPv(v, tn)); const ada = pv.length - tiada.length; const wajib = sp.pemboleh === 'wajib'; const st = !tiada.length ? 'ok' : !wajib ? 'info' : !n || ada / pv.length < 0.5 ? 'gagal' : 'amaran';
        m.push({ k: 'pemboleh', nama: 'Pemboleh ubah', nilai: Math.round(100 * ada / pv.length), status: st, teks: `${ada} daripada ${pv.length} disebut`, butir: tiada.length ? [`Belum disebut dalam folder ini: ${tiada.map(v => v.nama).join('; ')}.${wajib ? ' Folder ini mesti mencerminkan semua pemboleh ubah artikel.' : ''}`] : [] }); } }
    /* sitasi */
    { const butir = []; const unik = new Map(); sit.forEach(s => { if (!unik.has(s.kunci)) unik.set(s.kunci, s); }); const dikenali = Array.from(unik.values()).filter(s => s.id); const luar = Array.from(unik.values()).filter(s => !s.id); const bukanSumber = dikenali.filter(s => !s.dalam);
      const utama = (F.utama || []).filter(id => R.S.docs.has(id)); const utamaTiada = utama.filter(id => !dikenali.some(s => s.id === id)); const liputan = utama.length ? (utama.length - utamaTiada.length) / utama.length : 1;
      const isi = per.filter(p => p.n >= 25); const tanpa = isi.filter(p => !p.sit.length).length; const satu = isi.filter(p => new Set(p.sit.map(s => s.kunci)).size === 1).length;
      const tahunKini = new Date().getFullYear(); const lama = Array.from(unik.values()).filter(s => +s.tahun < tahunKini - (+g.hadTahun || 5));
      let nilai = 100, st = 'ok', tk = `${sit.length} sitasi, ${unik.size} sumber`;
      if (sp.sitasi === 'tiada') { if (sit.length) { st = 'gagal'; nilai = 0; butir.push('Abstrak tidak mengandungi sitasi; buang ' + Array.from(unik.values()).map(s => s.nama).join('; ') + '.'); } else { tk = 'tiada sitasi (betul bagi abstrak)'; if (!n) st = 'info'; } }
      else if (sp.sitasi === 'sedikit') { if (unik.size > 3) { st = 'amaran'; nilai = 60; butir.push('Kesimpulan tidak sepatutnya memperkenalkan banyak sumber; kekalkan sitasi yang benar-benar perlu sahaja.'); } else if (!n) st = 'info'; }
      else if (!n) { st = 'gagal'; nilai = 0; tk = 'belum ditulis'; }
      else if (sp.sitasi === 'sederhana') { if (!sit.length && n >= 150) { st = 'amaran'; nilai = 40; butir.push('Tiada sitasi dikesan; kaedah dan pilihan analisis lazimnya disokong sekurang-kurangnya beberapa rujukan.'); } }
      else { const nisbah = isi.length ? tanpa / isi.length : 0; nilai = Math.round(60 * (1 - nisbah) + 40 * liputan); if (!sit.length && n >= 80) { st = 'gagal'; nilai = 0; butir.push('Tiada sitasi dikesan dalam folder ini; setiap dakwaan tentang kajian lepas memerlukan sitasi Penulis (Tahun).'); } else if (nisbah > 0.2 || liputan < 0.8) st = 'amaran';
        if (tanpa) butir.push(`${tanpa} daripada ${isi.length} perenggan tiada sitasi; ayat penyata tentang literatur dibaca sebagai dakwaan dan perlu disokong.`);
        if (satu >= 2) butir.push(`${satu} perenggan bergantung pada satu sumber sahaja; padankan dakwaan penting dengan dua sumber bebas atau lebih jika ada.`); }
      if (sp.sitasi !== 'tiada' && utamaTiada.length) butir.push('Artikel panduan utama yang belum disitasi dalam folder ini: ' + utamaTiada.map(id => (indeks().find(x => x.id === id) || {}).nama || 'rekod').join('; ') + '.');
      if (luar.length) butir.push('Sitasi yang tidak ditemui dalam repositori (sahkan sumbernya benar-benar wujud dan masukkan ke senarai rujukan secara manual): ' + luar.map(s => s.nama).slice(0, 10).join('; ') + (luar.length > 10 ? '; dan lain-lain' : '') + '.');
      if (bukanSumber.length) butir.push('Sitasi daripada repositori yang belum menjadi artikel sumber artikel ini: ' + bukanSumber.map(s => s.nama).join('; ') + '.');
      if (lama.length && sp.sitasi !== 'tiada') butir.push(`${lama.length} sumber melebihi ${g.hadTahun} tahun (${lama.map(s => s.nama).slice(0, 6).join('; ')}); kekalkan hanya karya teori asal atau garis panduan, selebihnya ganti dengan sumber terkini.`);
      if (st === 'ok' && luar.length) st = 'amaran';
      m.push({ k: 'sitasi', nama: 'Sitasi', nilai, status: st, teks: tk, butir, sit: Array.from(unik.values()) }); }
    /* gerakan retorik */
    { const hasil = sp.gerakan.map(gk => { let ada; if (gk.k === 'sintesis') { const isi = per.filter(p => p.n >= 35); const dua = isi.filter(p => new Set(p.sit.map(s => s.kunci)).size >= 2).length; ada = dua >= 1 && dua / Math.max(1, isi.length) >= 0.4; } else if (gk.k === 'jadual') ada = u.jadual + u.imej >= 1; else if (gk.k === 'prisma') ada = /prisma/i.test(u.altImej) || !!(P.t.prisma && P.t.prisma.sisip); else ada = !!gk.cue && gk.cue.test(u.teks); return { gk, ada }; });
      const wajib = hasil.filter(h => h.gk.wajib); const dapat = wajib.filter(h => h.ada).length; const butir = hasil.filter(h => !h.ada && h.gk.wajib).map(h => `Belum dikesan: ${h.gk.nama}. ${h.gk.ket}`);
      const lapor = per.filter(p => p.n >= 25 && mulaPengarang(p.t)).length; const isiN = per.filter(p => p.n >= 25).length; if (sp.sitasi === 'padat' && lapor >= 3 && lapor / Math.max(1, isiN) >= 0.5) butir.push(`${lapor} daripada ${isiN} perenggan bermula dengan nama pengarang (gaya laporan kajian demi kajian); mulakan perenggan dengan hujah atau pola, kemudian kelompokkan sumber yang menyokongnya.`);
      const nis = wajib.length ? dapat / wajib.length : 1; const st = !n ? 'gagal' : nis >= 1 ? (butir.length ? 'amaran' : 'ok') : nis >= 0.6 ? 'amaran' : 'gagal';
      m.push({ k: 'gerakan', nama: 'Gerakan retorik', nilai: Math.round(100 * nis), status: st, teks: `${dapat} daripada ${wajib.length} dikesan`, butir, hasil, anggaran: true }); }
    /* parafrasa berbanding teks agen */
    { const ta = teksAgen(F); if (!ta.trim() || n < 60) m.push({ k: 'parafrasa', nama: 'Parafrasa', nilai: 100, status: 'info', teks: !ta.trim() ? 'tiada teks agen untuk dibandingkan' : 'ASAL belum cukup panjang', butir: [] });
      else { const sa = kepingan(ta); const sb = kepingan(u.teks); let sama = 0; sb.forEach(x => { if (sa.has(x)) sama++; }); const pct = sb.size ? Math.round(100 * sama / sb.size) : 0; const butir = [];
        if (pct > 20) { const teruk = per.map((p, i) => { const s = kepingan(p.t); let k = 0; s.forEach(x => { if (sa.has(x)) k++; }); return { i: i + 1, p: s.size ? Math.round(100 * k / s.size) : 0 }; }).filter(x => x.p >= 40).slice(0, 5); butir.push(`ASAL masih ${pct}% serupa dengan teks agen. Tulis semula dengan ayat Prof Dr sendiri${teruk.length ? '; perenggan paling hampir: ' + teruk.map(x => 'perenggan ' + x.i + ' (' + x.p + '%)').join(', ') : ''}.`); }
        m.push({ k: 'parafrasa', nama: 'Parafrasa', nilai: Math.max(0, 100 - pct * 2), status: pct > 40 ? 'gagal' : pct > 20 ? 'amaran' : 'ok', teks: `${pct}% serupa dengan teks agen`, butir }); } }
    /* padanan acuan: bilangan perenggan dan kepadatan sitasi berbanding bahagian yang sama dalam artikel contoh */
    if (f.ac && n >= 40) { const b = f.ac; const butir = []; const np = u.per.length; const lo = Math.max(1, Math.floor(b.per * 0.6)), hi = Math.ceil(b.per * 1.5); let skor = 100;
      if (np < lo) { butir.push(`ASAL mempunyai ${np} perenggan; bahagian ini dalam artikel contoh mempunyai ${b.per}. Pecahkan hujah mengikut peta perenggan acuan.`); skor -= 35; } else if (np > hi) { butir.push(`ASAL mempunyai ${np} perenggan; artikel contoh ${b.per}. Gabungkan perenggan yang memikul fungsi yang sama.`); skor -= 20; }
      const dAc = b.kata ? b.sit / b.kata * 100 : 0; const dSy = n ? sit.length / n * 100 : 0; if (dAc >= 1 && dSy < dAc * 0.5) { butir.push(`Kepadatan sitasi ${dSy.toFixed(1)} bagi setiap 100 patah perkataan; artikel contoh ${dAc.toFixed(1)}.`); skor -= 30; }
      if (b.jadual && !u.jadual && n >= ss[0] * 0.6) { butir.push(`Bahagian ini dalam artikel contoh mempunyai ${b.jadual} jadual; ASAL belum ada jadual.`); skor -= 10; }
      m.push({ k: 'acuan', nama: 'Padanan acuan', nilai: Math.max(5, skor), status: skor >= 85 ? 'ok' : skor >= 60 ? 'amaran' : 'gagal', teks: `${np} perenggan (acuan ${b.per}) · ${dSy.toFixed(1)} sitasi setiap 100 patah (acuan ${dAc.toFixed(1)})`, butir }); }
    if (dnaAktif(f)) m.push(DNA.meter(dnaCtx(), u));
    m.push(ukurGaya(f, sp, u, per));
    if (f.p === 'kaedah' && adaPrisma()) Prisma.meter().forEach(x => m.push(x));
    if (f.p === 'dapatan' && adaOutput()) Output.meter(u).forEach(x => m.push(x));
    const kira = m.filter(x => x.status !== 'info'); const sedia = kira.length ? Math.round(kira.reduce((s, x) => s + x.nilai, 0) / kira.length) : 0;
    return { n, meter: m, sedia, isu: m.filter(x => x.status === 'gagal' || x.status === 'amaran'), u };
  }
  function statusFolder(f, uk) {
    const st = (P.t.status || {})[f.k]; if (st && st.siap) return ['siap', 'Siap']; const F = fd(f.k); const n = uk ? uk.n : patah(teksFolder(f));
    if (n >= 40) return ['draf', 'Sedang ditulis']; if ((F.log || []).length || Object.values(F.jawab || {}).some(x => String(x || '').trim()) || (F.utama || []).length) return ['bincang', 'Soal jawab']; return ['baru', 'Belum mula'];
  }

  /* ---- paparan ---- */
  const det = (id, cls, ringkasan, isi) => `<details class="${cls}" data-pdid="${esc(id)}"${P.terbuka.has(id) ? ' open' : ''}><summary>${ringkasan}</summary>${isi}</details>`;
  const htmlMeter = x => `<div class="pd-meter ${x.status}" data-pdm="${x.k}"><div class="h"><b>${esc(x.nama)}</b><span>${esc(x.teks)}</span></div><div class="mbar"><i style="width:${Math.max(3, Math.min(100, x.nilai))}%"></i></div>${x.anggaran ? '<div class="nota">Pengesanan automatik daripada kata isyarat; Semakan agen lebih tepat.</div>' : ''}${x.butir && x.butir.length ? `<ul>${x.butir.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>`;
  function render() {
    const el = $('#artPandu'); if (!el) return; const d = C.doc(); const kira = $('#artPanduKira');
    if (!d || !A.id) { el.innerHTML = ''; if (kira) kira.textContent = ''; kemasBar(); return; }
    if (P.id !== A.id) { muatLokal(A.id); muatAwan(A.id); muatGaya(); const f0 = d.jenis ? folderDari(P.buka) : null; if (f0 && P.t.sedia) P.terbuka = new Set(langkahLalai(f0)); }
    if (!d.jenis) { el.innerHTML = '<div class="help">Pilih jenis artikel di atas dahulu. Folder Pandu Tulis disediakan mengikut jenis artikel: artikel ulasan mendapat Ruang PRISMA dalam folder Metodologi, artikel empirikal mendapat Ruang Output SPSS dan AMOS dalam folder Dapatan.</div>'; if (kira) kira.textContent = ''; kemasBar(); return; }
    const fs = folders(); const tl = D.urutanTulis(fs); const perlu = P.t.sedia && fs.some(f => !sidFolder(f));
    el.innerHTML = htmlAtas(d, tl) + (P.t.sedia ? (perlu ? `<div class="pd-notis">Sesetengah folder belum mempunyai seksyen (jenis artikel ditukar atau seksyen dipadam). <button class="btn btn-sm btn-primary" data-pd="sedia">Kemas kini folder</button></div>` : '') + htmlRel(tl) + '<div id="pdFolder" class="pd-folder"></div>' : htmlSedia(d, tl));
    el.querySelectorAll('[data-pdsel="bahasa"]').forEach(s => { s.value = P.t.bahasa || 'ms'; });
    el.querySelectorAll('[data-pdsel="aras"]').forEach(s => { s.value = P.t.aras === 'scopus' ? 'scopus' : 'mycite'; });
    el.querySelectorAll('[data-pdsel="acuan"]').forEach(s => { const ac = acuan(); s.value = !ac ? 'tiada' : ac.sendiri ? 'sendiri' : 'bina'; });
    if (P.t.sedia) renderFolder();
    if (kira) kira.textContent = P.t.sedia ? `(${tl.filter(f => ((P.t.status || {})[f.k] || {}).siap).length}/${tl.length} folder siap)` : '(belum disediakan)';
    kemasBar();
  }
  function htmlAtas(d, tl) {
    const pv = (P.t.pemboleh || []).filter(v => v.nama); const ac = acuan(); const sendiri = acuanSendiri(kel());
    return `<div class="pd-atas"><div class="pd-tetap">
      <label class="pd-f"><span class="lbl">Bahasa manuskrip</span><select data-pdsel="bahasa"><option value="ms">Bahasa Melayu</option><option value="en">English</option></select></label>
      <label class="pd-f"><span class="lbl">Jurnal sasaran</span><select data-pdsel="aras" title="Menentukan piawaian yang digunakan agen ketika menyemak dan julat sasaran panjang"><option value="mycite">Berindeks MyCite</option><option value="scopus">Berindeks Scopus atau WoS</option></select></label>
      <label class="pd-f"><span class="lbl">Sasaran jumlah patah perkataan</span><input type="number" data-pdin="sasaran" min="1000" max="30000" step="500" value="${esc(jumlahSasaran())}" title="${ac && P.t.sasaranAuto !== false ? 'Mengikut saiz artikel contoh; taip angka lain untuk menetapkan sendiri' : 'Ditetapkan oleh Prof Dr'}">${ac && P.t.sasaranAuto === false ? '<button class="btn-link" data-pd="sasaranauto" title="Kembali kepada sasaran mengikut saiz artikel contoh">ikut acuan</button>' : ''}</label>
      <div class="pd-f pd-ac"><span class="lbl">Acuan artikel contoh</span><div><select data-pdsel="acuan" title="Artikel contoh yang strukturnya dijadikan acuan folder, sasaran dan bimbingan agen">${ACUAN[kel()] ? `<option value="bina">Terbina: ${esc(ACUAN[kel()].pendek)}</option>` : ''}${sendiri && sendiri.acuan ? `<option value="sendiri">Bedahan sendiri: ${esc(sendiri.acuan.pendek || 'artikel pilihan')}</option>` : ''}<option value="tiada">Tanpa acuan (struktur umum)</option></select> ${ac ? '<button class="btn btn-sm" data-pd="acuanlihat">Lihat acuan</button> ' : ''}<button class="btn btn-sm btn-ai" data-pd="bedah" title="Agen membaca teks penuh satu artikel dalam repositori dan membedahnya menjadi acuan (satu panggilan API)"${P.busy ? ' disabled' : ''}>${P.busy && P.busy.mod === 'bedah' ? 'Agen sedang membedah' : 'Bedah artikel contoh sendiri'}</button></div></div>
      <div class="pd-f pd-pv"><span class="lbl">Pemboleh ubah atau konstruk utama</span><div class="pd-pv-senarai">${pv.length ? pv.map(v => `<span class="tag ai" title="${esc(v.alias ? 'Padanan lain: ' + v.alias : 'Tiada padanan lain')}"><span>${esc(v.nama)}</span></span>`).join('') : '<span class="pd-kosong">Belum ditetapkan</span>'}<button class="btn btn-sm${pv.length ? '' : ' btn-primary'}" data-pd="pemboleh">${pv.length ? 'Ubah' : 'Tetapkan'}</button></div></div>
      <div class="pd-f pd-alat"><span class="lbl">Alat</span><div><button class="btn btn-sm" data-pd="gaya" title="Istilah dan frasa yang dilarang, had umur rujukan, had pangkalan data dan arahan gaya kepada agen">Peraturan gaya</button> <button class="btn btn-sm" data-pd="cara">Cara guna</button></div></div>
    </div>${ac ? det('acuanInduk', 'pd-hasil pd-acuan-induk', `Acuan artikel ini: <b>${esc(ac.pendek)}</b>, ${esc(ac.jurnal || '')} · badan ${angka(ac.ukuran.badan)} patah perkataan dalam ${ac.bahagian.length} bahagian`, htmlAcuanInduk(ac)) : ''}${P.t.sedia ? htmlKemajuan(tl) : ''}</div>`;
  }
  /* Kad acuan: artikel contoh yang dibedah, sebab dipilih, ukurannya dan cara menyesuaikannya. */
  function htmlAcuanInduk(ac) {
    const u = ac.ukuran || {}; const x = ac.sendiri ? acuanSendiri(kel()) : null; const doi = ac.doi ? `https://doi.org/${ac.doi}` : '';
    return `<div class="pd-ai-kepala"><p class="pd-ai-ruj">${esc(ac.rujukan || ac.tajuk || '')}${doi ? ` <a href="${esc(doi)}" target="_blank" rel="noopener">Buka artikel</a>` : ''}${ac.lesen ? ` <span class="tag"><span>${esc(ac.lesen)}</span></span>` : ''}</p>
      ${ac.sebab ? `<p><b>Mengapa artikel ini.</b> ${esc(ac.sebab)}</p>` : ''}${ac.reka ? `<p><b>Reka bentuk artikel contoh.</b> ${esc(ac.reka)}</p>` : ''}</div>
      <div class="pd-ai-grid"><div><b>Ciri penulisan yang ditiru</b><ul>${(ac.ciri || []).map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
      <div><b>Ukuran artikel contoh</b><div class="pd-ac-gulung"><table class="pd-ac-jadual"><thead><tr><th>Bahagian</th><th>Nisbah</th><th>Patah</th><th>Perenggan</th><th>Sitasi</th><th>Jadual, rajah</th></tr></thead><tbody>${ac.bahagian.map(b => `<tr><td>${esc(b.bm)}<small>${esc(b.en || '')}</small></td><td><span class="pd-ac-bar"><i style="width:${Math.min(100, b.peratus * 2)}%"></i></span>${b.peratus}%</td><td>${angka(b.kata)}</td><td>${b.per}</td><td>${b.sit}</td><td>${b.jadual || 0}, ${b.rajah || 0}</td></tr>`).join('')}</tbody></table></div>
      <p class="help">Abstrak ${u.abstrak ? 'kira-kira ' + angka(u.abstrak) + ' patah perkataan' : ''}${u.berstruktur ? ' (berstruktur)' : ''}${u.kataKunci ? ' · ' + u.kataKunci + ' kata kunci' : ''}${u.rujukan ? ' · ' + u.rujukan + ' rujukan' : ''}${u.jadual != null ? ' · ' + u.jadual + ' jadual, ' + (u.rajah || 0) + ' rajah' : ''}. ${ac.sendiri ? `Dibedah oleh agen${x && x.masa ? ' pada ' + esc(R.fmtTime(x.masa)) : ''}; angka ialah anggaran agen daripada teks PDF.` : ac.anggar ? 'Angka diukur daripada PDF artikel, maka bilangan perenggan ialah anggaran hampir.' : 'Angka diukur oleh skrip daripada teks penuh artikel.'}</p></div></div>
      ${(ac.suai || []).length ? `<div class="pd-ai-suai"><b>Penyesuaian untuk artikel Prof Dr</b><ul>${ac.suai.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
      <p class="help">Acuan ialah analisis struktur dan fungsi perenggan artikel contoh, ditulis semula dengan kata-kata sendiri. Ia menunjukkan <b>apa yang dilakukan oleh setiap perenggan</b>, bukan ayat untuk disalin. Peta perenggan bagi setiap bahagian ada dalam folder masing-masing (bahagian <b>A</b>).</p>`;
  }
  /* Acuan dalam folder: perbandingan draf dengan bahagian yang sama dalam artikel contoh, subtajuk, peta perenggan dan pola ayat. */
  function htmlAcuanFolder(f, uk) {
    const ac = acuan(); if (!ac) return '';
    if (f.p === 'abstrak') { const a = ac.abstrak || {}; return `<p><b>Abstrak ${esc(ac.pendek)}.</b> ${esc(a.bentuk || '')}</p><p>${esc(a.cara || '')}</p><p class="help">Ikut format abstrak jurnal sasaran (berstruktur atau satu perenggan) dan had patah perkataannya.</p>`; }
    const b = f.ac; if (!b) return ''; const u = uk.u; const ss = sasaran(f); const nSit = u.per.reduce((t, x) => t + cariSitasi(x).length, 0); const d = C.doc(); const subSy = julat(f).slice(1).map(id => (d.seksyen[id] || {}).tajuk).filter(Boolean);
    const baris = (nm, a, c, e) => `<tr><th>${nm}</th><td>${a}</td><td>${c}</td><td>${e}</td></tr>`;
    return `<div class="pd-ac-gulung"><table class="pd-ac-jadual pd-ac-banding"><thead><tr><th></th><th>Artikel contoh</th><th>ASAL Prof Dr</th><th>Panduan</th></tr></thead><tbody>
      ${baris('Panjang', `${angka(b.kata)} patah (${b.peratus}% badan)`, `${angka(uk.n)} patah`, ss ? `${angka(ss[0])} hingga ${angka(ss[1])} patah` : '')}
      ${baris('Perenggan', b.per, u.per.length, `${Math.max(1, Math.floor(b.per * 0.6))} hingga ${Math.ceil(b.per * 1.5)}`)}
      ${baris('Sitasi', `${b.sit}${b.kata ? ' (' + (b.sit / b.kata * 100).toFixed(1) + ' setiap 100 patah)' : ''}`, `${nSit}${uk.n ? ' (' + (nSit / uk.n * 100).toFixed(1) + ' setiap 100 patah)' : ''}`, b.sit ? 'kepadatan yang setara' : 'sedikit atau tiada')}
      ${baris('Jadual, rajah', `${b.jadual || 0}, ${b.rajah || 0}`, `${u.jadual}, ${u.imej}`, (b.jadual || b.rajah) ? 'jadual memikul butiran' : '')}</tbody></table></div>
      ${(b.sub || []).length ? `<p class="pd-ac-sub"><b>Subtajuk dalam artikel contoh:</b> ${b.sub.map(x => `${esc(x.bm)}${x.kata ? ' <small>(' + angka(x.kata) + ' patah' + (x.per ? ', ' + x.per + ' perenggan' : '') + ')</small>' : ''}`).join(' · ')}${subSy.length ? `<br><b>Subseksyen folder ini:</b> ${subSy.map(esc).join(' · ')}` : ''}</p>` : ''}
      <ol class="pd-ac-peta">${(b.peta || []).map(x => { const pl = POLA[x.g]; return `<li><div class="h"><span class="tag ai"><span>${esc(pl ? pl.nama : x.g)}</span></span><b>${esc(x.f)}</b><span class="uk">${[x.n > 1 ? x.n + ' perenggan' : '', x.w ? (x.anggar ? 'kira-kira ' : '') + angka(x.w) + ' patah' : '', x.cit != null ? x.cit + ' sitasi' : ''].filter(Boolean).join(' · ')}</span></div><div class="cara">${esc(x.cara)}</div>${pl ? `<details class="pd-ac-pola"><summary>Pola ayat ${esc(en() ? '(Bahasa Melayu; sesuaikan untuk manuskrip Bahasa Inggeris)' : '')}</summary><ul>${pl.pola.map(y => `<li>${esc(y)}</li>`).join('')}</ul></details>` : ''}</li>`; }).join('')}</ol>
      <div class="pd-ai-grid">${(b.ajar || []).length ? `<div><b>Patut ditiru</b><ul>${b.ajar.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}${(b.elak || []).length ? `<div class="elak"><b>Jangan tiru, atau sesuaikan</b><ul>${b.elak.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}</div>
      <p class="help">Pola ayat ialah rangka generik untuk diisi dengan fakta dan sumber Prof Dr sendiri; ia bukan ayat artikel contoh. Agen juga menerima peta perenggan ini apabila berbincang, mencadang dan menyemak.</p>`;
  }
  function htmlKemajuan(tl) {
    const isi = tl.filter(f => f.p !== 'rujukan'); const uk = isi.map(f => ({ f, uk: ukur(f) })); const jumlah = uk.filter(x => x.f.p !== 'abstrak').reduce((s, x) => s + x.uk.n, 0); const siap = isi.filter(f => ((P.t.status || {})[f.k] || {}).siap).length;
    const sedia = uk.length ? Math.round(uk.reduce((s, x) => s + x.uk.sedia, 0) / uk.length) : 0; const d = C.doc(); const sumber = C.sumberAda(d); const disitasi = new Set(); uk.forEach(x => { const ms = x.uk.meter.find(m => m.k === 'sitasi'); (ms && ms.sit || []).forEach(s => { if (s.id) disitasi.add(s.id); }); });
    const tk = P.t.token || {}; const my = P.t.menyeluruh; P.cache.uk = {}; uk.forEach(x => { P.cache.uk[x.f.k] = x.uk; });
    return `<div class="pd-kemajuan"><div class="pd-kj-bar" title="Purata kesediaan semua folder mengikut meter"><i style="width:${Math.max(2, sedia)}%"></i></div><div class="pd-kj-teks"><b>Kesediaan manuskrip ${sedia}%</b> · ${siap} daripada ${isi.length} folder siap · ${angka(jumlah)} daripada ${angka(jumlahSasaran())} patah perkataan · ${sumber.filter(id => disitasi.has(id)).length} daripada ${sumber.length} artikel sumber disitasi${tk.panggil ? ` · agen: ${tk.panggil} panggilan${tk.gagal ? ' (' + tk.gagal + ' gagal)' : ''}, token masuk ${angka(tk.masuk)}, keluar ${angka(tk.keluar)}` : ''}</div>
      <div class="pd-kj-acts"><button class="btn btn-sm btn-ai" data-pd="menyeluruh" title="Agen membaca ASAL semua folder dan menyemak keselarasan tujuan, kaedah, dapatan, perbincangan dan kesimpulan"${P.busy ? ' disabled' : ''}>${P.busy && P.busy.mod === 'menyeluruh' ? 'Agen sedang menyemak' : 'Semakan menyeluruh manuskrip (agen)'}</button></div>
      ${my && my.data ? det('menyeluruh', 'pd-hasil', `Semakan menyeluruh terakhir: kesediaan ${esc(my.data.kesediaan)}% · ${esc(R.fmtTime(my.masa))}`, htmlMenyeluruh(my.data)) : ''}</div>`;
  }
  function htmlSedia(d, tl) {
    const s = C.sumberAda(d); const belum = s.filter(id => !Bd().kelengkapan(Bd().rekod(id)).ok); const pv = (P.t.pemboleh || []).filter(v => v.nama); const j = C.JENIS_PETA[d.jenis];
    const li = (ok, t) => `<li class="${ok ? 'ok' : 'amaran'}">${t}</li>`;
    return `<div class="pd-sedia"><h3>Sediakan folder bagi artikel jenis "${esc(j ? j.nama : d.jenis)}"</h3>
      <p>${acuan() ? `Struktur mengikut acuan <b>${esc(acuan().pendek)}</b> (artikel contoh ${esc(D.NAMA_KELUARGA[kel()] || '')} yang telah dibedah; lihat kad acuan di atas)` : `Struktur piawai ${esc(D.NAMA_KELUARGA[kel()] || '')}`}: ${tl.length} folder. Seksyen sedia ada yang tajuknya sepadan dipadankan tanpa diubah; yang belum ada dicipta bersama subseksyen lazim. Urutan menulis dari kiri ke kanan; Abstrak ditulis paling akhir dan Rujukan dijana daripada sitasi.</p>
      <div class="pd-pratonton">${tl.map((f, i) => `<span class="pd-pra"><b>${i + 1}</b> ${esc(tajukF(f))}${f.p === 'kaedah' && adaPrisma() ? ' <em>Ruang PRISMA</em>' : ''}${f.p === 'dapatan' && adaOutput() ? ' <em>Ruang Output SPSS dan AMOS</em>' : ''}${f.p === 'abstrak' ? ' <em>paling akhir</em>' : ''}</span>`).join('<span class="pd-anak">&#8594;</span>')}</div>
      <ul class="pd-semak-awal">${li(s.length >= 5 && !belum.length, `Artikel sumber: ${s.length} dipilih${belum.length ? '; ' + belum.length + ' belum lengkap Bahagian A hingga F' : s.length ? '; semuanya lengkap A hingga F' : ''}`)}${li(pv.length > 0, pv.length ? `Pemboleh ubah: ${esc(pv.map(v => v.nama).join('; '))}` : 'Pemboleh ubah atau konstruk utama belum ditetapkan (butang Tetapkan di atas)')}${li(true, `Bahasa manuskrip: ${esc(namaBahasa())}; sasaran ${angka(jumlahSasaran())} patah perkataan (boleh diubah di atas)`)}</ul>
      <div class="pd-acts"><button class="btn btn-primary" data-pd="sedia">Sediakan folder</button><span class="help">Selepas disediakan, buka folder pertama dan ikut lima langkah: artikel panduan, soal jawab dengan agen, cadangan penulisan ke RAM, tulis ASAL dengan ayat sendiri, semak dan tandakan siap.</span></div></div>`;
  }
  function htmlRel(tl) {
    return `<div class="pd-rel" role="tablist">${tl.map((f, i) => { const uk = (P.cache.uk || {})[f.k] || (f.p === 'rujukan' ? { n: patah(teksFolder(f)), sedia: 0 } : ukur(f)); const [st, lb] = statusFolder(f, uk); const ss = sasaran(f); const tiada = !sidFolder(f);
      return `<button class="pd-kad ${st}${P.buka === f.k ? ' on' : ''}${tiada ? ' tiada' : ''}" data-pd="buka" data-k="${esc(f.k)}" role="tab" aria-selected="${P.buka === f.k}"><span class="no">${i + 1}</span><span class="nm">${esc(tajukF(f))}</span><span class="st">${tiada ? 'Seksyen tiada' : lb}${f.p === 'abstrak' ? ' · paling akhir' : ''}</span>${f.p === 'rujukan' ? '<span class="pt">dijana daripada sitasi</span>' : `<span class="mt"><i style="width:${Math.max(2, uk.sedia || 0)}%"></i></span><span class="pt">${angka(uk.n)}${ss ? ' / ' + angka(ss[0]) + ' hingga ' + angka(ss[1]) : ''} patah</span>`}</button>`; }).join('')}</div>`;
  }
  function langkahLalai(f) {
    if (!f) return []; if (f.p === 'rujukan') return ['ruj']; const sp = specF(f); const F = fd(f.k); const out = []; const n = patah(teksFolder(f)); const ss = sasaran(f);
    if (sp.bahan !== 'asal' && !(F.utama || []).length) out.push('L1'); else if (!(F.log || []).some(x => x.mod === 'bincang')) out.push('L2'); else if (!(F.log || []).some(x => x.mod === 'cadangan')) out.push('L3'); else if (ss && n < ss[0] * 0.6) out.push('L4'); else out.push('L5');
    if (f.p === 'kaedah' && adaPrisma()) out.push('prisma'); if (f.p === 'dapatan' && adaOutput()) out.push('output');
    if (acuan() && (f.ac || f.p === 'abstrak') && n < 40 && !(F.log || []).length) out.push('LA'); return out;
  }
  function syor(f, sp) {
    const d = C.doc(); const medan = sp.medan || []; return C.sumberAda(d).map(id => { const r = Bd().rekod(id); const rel = { 'Tinggi': 3, 'Sederhana-Tinggi': 2, 'Sederhana': 1 }[r.relevansi] || 0; const isi = medan.length ? medan.filter(k => !R.Isi.nilaiKosong(r[k])).length / medan.length : 0; const sebab = []; if (rel >= 2) sebab.push('relevansi ' + r.relevansi); if (isi >= 0.8 && medan.length) sebab.push('medan berkaitan lengkap'); if (r.status === 'Selesai') sebab.push('selesai dibaca'); return { id, skor: rel * 2 + isi * 3 + (r.status === 'Selesai' ? 1 : 0), sebab }; }).sort((a, b) => b.skor - a.skor);
  }
  function renderFolder() {
    const el = $('#pdFolder'); if (!el) return; const tl = tulis(); const f = tl.find(x => x.k === P.buka);
    if (!f) { el.innerHTML = '<div class="help">Pilih satu folder di atas untuk mula. Urutan yang disyorkan ialah dari kiri ke kanan; Abstrak paling akhir.</div>'; return; }
    const sp = specF(f); const sid = sidFolder(f); const i = tl.indexOf(f); const d = C.doc();
    if (!sid) { el.innerHTML = `<div class="pd-fh"><h3>Folder ${i + 1}: ${esc(tajukF(f))}</h3></div><div class="pd-notis">Seksyen bagi folder ini tiada (mungkin dipadam). <button class="btn btn-sm btn-primary" data-pd="sedia">Cipta semula</button> atau padankan dengan seksyen sedia ada: ${htmlPetaSel(f)}</div>`; return; }
    const uk = ukur(f); const [st, lb] = statusFolder(f, uk); const ss = sasaran(f); const s = d.seksyen[sid]; const no = (Teks.nombor(A.id)[sid] || {}).no || '';
    const kepala = `<div class="pd-fh"><h3><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Folder ${i + 1}: ${esc(tajukF(f))}</h3><span class="tag pd-st ${st}"><span>${lb}</span></span><span class="pd-fh-m">Seksyen ${esc(no)} ${esc(s.tajuk || '')}${julat(f).length > 1 ? ' dan ' + (julat(f).length - 1) + ' subseksyen' : ''} · ${angka(uk.n)} patah${ss ? ', sasaran ' + angka(ss[0]) + ' hingga ' + angka(ss[1]) : ''}</span><span class="spacer"></span><label class="pd-peta" title="Tukar seksyen yang mewakili folder ini">Seksyen ${htmlPetaSel(f)}</label><button class="btn btn-sm" data-pd="editor">Buka ASAL dan RAM</button>${i < tl.length - 1 ? `<button class="btn btn-sm" data-pd="buka" data-k="${esc(tl[i + 1].k)}">Folder seterusnya &#8594;</button>` : ''}</div><p class="pd-tujuan">${esc(sp.tujuan)}</p>`;
    if (f.p === 'rujukan') { el.innerHTML = kepala + htmlRujukan(f); return; }
    const F = fd(f.k); const sibuk = P.busy && P.busy.k === f.k ? P.busy.mod : null; const mati = P.busy ? ' disabled' : '';
    const logB = (F.log || []).filter(x => x.mod === 'bincang'); const bincang = logB[logB.length - 1]; const logC = (F.log || []).filter(x => x.mod === 'cadangan'); const cad = logC[logC.length - 1];
    /* langkah 1 */
    let L1;
    if (sp.bahan === 'asal') { const lain = tl.filter(x => x.p !== 'rujukan' && x.p !== 'abstrak' && x.k !== f.k); L1 = det('L1', 'pd-l', `<span class="no">1</span> Bahan folder ini: ASAL folder lain <span class="ring">${lain.filter(x => patah(teksFolder(x)) >= 40).length} daripada ${lain.length} folder sudah ada ASAL</span>`, `<p class="help">Folder ini tidak memilih artikel panduan: agen membaca ASAL folder lain yang sudah Prof Dr tulis, supaya ${esc(sp.nama.toLowerCase())} setia kepada manuskrip sendiri.</p><ul class="pd-bahan">${lain.map(x => { const n = patah(teksFolder(x)); const sp2 = ((P.t.status || {})[x.k] || {}).siap; return `<li class="${n >= 40 ? 'ok' : 'amaran'}">${esc(tajukF(x))}: ${angka(n)} patah perkataan${sp2 ? ', siap' : n >= 40 ? ', belum ditandakan siap' : ', belum ditulis'}</li>`; }).join('')}</ul>`); }
    else { const sy = syor(f, sp); const syorSet = new Set(sy.slice(0, 3).filter(x => x.skor > 2).map(x => x.id)); const ut = new Set(F.utama || []), sk = new Set(F.sekunder || []);
      L1 = det('L1', 'pd-l', `<span class="no">1</span> Artikel panduan <span class="ring">${ut.size} utama, ${sk.size} sekunder</span>`, `<p class="help">${sp.bahan === 'sendiri' ? 'Fakta folder ini datang daripada kajian Prof Dr sendiri. Artikel panduan di sini menjadi contoh cara melaporkan: pilih artikel yang kaedah atau pelaporannya mahu dicontohi.' : 'Artikel yang mana mahu dijadikan panduan utama bagi folder ini, dan yang mana sekunder? Utama membawa hujah dan bukti teras (cadangan dua hingga lima); sekunder memberi sokongan tambahan.'} Artikel sumber lain masih dikenali agen secara ringkas.</p>
        <div class="pd-sumber">${sy.length ? sy.map(x => { const r = Bd().rekod(x.id); const kl = Bd().kelengkapan(r); return `<div class="pd-sr${ut.has(x.id) ? ' utama' : sk.has(x.id) ? ' sekunder' : ''}"><span class="bil">Bil. ${esc(r.bil || '?')}</span><span class="nm">${esc(Bd().nama(r))}</span><span class="tj" title="${esc(r.tajuk || '')}">${esc(r.tajuk || 'Tajuk belum diisi')}</span>${r.relevansi ? `<span class="tag">${esc(r.relevansi)}</span>` : ''}${kl.ok ? '' : `<span class="tag pd-bl" title="Belum lengkap: ${esc(kl.bahagian.filter(b => !b.ok).map(b => b.letter).join(', '))}">belum lengkap</span>`}${syorSet.has(x.id) ? `<span class="tag ai" title="${esc(x.sebab.join('; '))}">disyorkan</span>` : ''}<span class="pd-sr-acts"><button class="pd-pil${ut.has(x.id) ? ' on' : ''}" data-pd="pilih" data-jenis="utama" data-id="${esc(x.id)}">Utama</button><button class="pd-pil${sk.has(x.id) ? ' on' : ''}" data-pd="pilih" data-jenis="sekunder" data-id="${esc(x.id)}">Sekunder</button><button class="btn btn-sm" data-bukarekod="${esc(x.id)}" title="Buka rekod artikel ini">Rekod</button></span></div>`; }).join('') : '<div class="help">Belum ada artikel sumber; pilih dalam bahagian "Artikel sumber daripada repositori" di atas.</div>'}</div>`); }
    /* langkah 2 */
    const nJawab = sp.soalan.filter(q => String((F.jawab || {})[q.k] || '').trim()).length;
    const L2 = det('L2', 'pd-l', `<span class="no">2</span> Soal jawab dengan agen <span class="ring">${nJawab} daripada ${sp.soalan.length} soalan panduan dijawab · ${logB.length} perbincangan</span>`, `<p class="help">Jawab ringkas dalam ayat sendiri (nota pun memadai). Agen membaca jawapan ini bersama artikel panduan, lalu membincangkan apa yang patut masuk ke dalam folder ini. Setiap soal jawab dimasukkan ke RAM.</p>
      <div class="pd-soalan">${sp.soalan.map(q => `<label class="pd-q"><span>${esc(q.t)}</span><textarea data-pdin="jawab" data-q="${esc(q.k)}" rows="2" placeholder="${esc(q.ph || 'Jawapan ringkas Prof Dr')}">${esc((F.jawab || {})[q.k] || '')}</textarea></label>`).join('')}</div>
      <div class="pd-acts"><button class="btn btn-ai" data-pd="agen" data-mod="bincang"${mati}>${sibuk === 'bincang' ? 'Agen sedang berbincang' : bincang ? 'Bincang semula dengan agen' : 'Bincang dengan agen: apa yang patut masuk'}</button><span class="help">Satu panggilan API; amaran kos dipaparkan dahulu. ${F.panggil || 0} daripada ${F.had || HAD_PANGGIL} panggilan agen folder ini digunakan.</span></div>
      ${bincang && bincang.data ? `<div class="pd-hasil"><div class="pd-hasil-h"><b>Perbincangan terakhir</b><span>${esc(R.fmtTime(bincang.masa))}${bincang.token ? ' · token masuk ' + angka(bincang.token.masuk) + ', keluar ' + angka(bincang.token.keluar) : ''} · sudah dalam RAM</span></div>${htmlBincang(bincang.data, true)}</div>` : ''}
      ${(F.balas || []).length ? `<div class="pd-balas"><b>Soalan agen kepada Prof Dr</b>${F.balas.map(b => `<label class="pd-q"><span>${esc(b.soalan)}</span><textarea data-pdin="balas" data-id="${esc(b.id)}" rows="2" placeholder="Jawapan Prof Dr; kemudian klik Bincang semula">${esc(b.jawapan || '')}</textarea></label>`).join('')}</div>` : ''}
      <div class="pd-tanya"><label class="pd-q"><span>Soalan bebas Prof Dr tentang folder ini</span><textarea data-pdin="tanya" rows="2" placeholder="Contoh: jurang yang mana paling kuat disokong oleh artikel panduan, dan artikel mana yang menyokongnya?">${esc(F.tanya || '')}</textarea></label><div class="pd-acts"><button class="btn btn-ai" data-pd="agen" data-mod="tanya"${mati}>${sibuk === 'tanya' ? 'Agen sedang menjawab' : 'Tanya agen'}</button></div></div>
      ${htmlLog(F)}`);
    /* langkah 3 */
    const L3 = det('L3', 'pd-l', `<span class="no">3</span> Cadangan penulisan daripada agen <span class="ring">${cad ? 'dijana ' + esc(R.fmtTime(cad.masa)) : 'belum dijana'}</span>`, `<p class="help">Agen menulis cadangan ${esc(sp.nama)} dalam ${esc(namaBahasa())}${ss ? ', ' + angka(ss[0]) + ' hingga ' + angka(ss[1]) + ' patah perkataan' : ''}, mengikut rangka perbincangan dan jawapan Prof Dr. Ia cadangan untuk diparafrasa dan masuk ke RAM; ASAL tetap ditulis oleh Prof Dr.${ss ? ' Had token keluar panggilan ini dikira daripada sasaran panjang itu, ditambah ruang berfikir model.' : ''}</p>
      <label class="pd-q"><span>Arahan khusus kepada agen (pilihan)</span><textarea data-pdin="arahan" rows="2" placeholder="Contoh: tumpukan jurang konteks Malaysia; empat perenggan sahaja.">${esc(F.arahan || '')}</textarea></label>
      <div class="pd-acts"><button class="btn btn-ai" data-pd="agen" data-mod="cadangan"${mati}>${sibuk === 'cadangan' ? 'Agen sedang menulis cadangan' : cad ? 'Jana cadangan baharu' : 'Jana cadangan penulisan'}</button></div>
      ${cad ? `<div class="pd-hasil"><div class="pd-hasil-h"><b>Cadangan terakhir</b><span>${esc(R.fmtTime(cad.masa))} · ${angka(patah(cad.jawapan))} patah · sudah dalam RAM</span></div><div class="pd-teks">${htmlCadangan(cad.jawapan)}</div></div>` : ''}`);
    /* langkah 4 */
    const L4 = det('L4', 'pd-l', `<span class="no">4</span> Tulis ASAL dengan ayat Prof Dr sendiri <span class="ring">${angka(uk.n)} patah dalam ASAL</span>`, `<ol class="pd-tip"><li>Baca cadangan dan soal jawab dalam RAM, satu perenggan demi satu perenggan, dan semak setiap dakwaan terhadap rekod artikel sumber.</li><li>Tulis semula hujah itu dalam ASAL dengan ayat sendiri; jangan pindahkan perenggan agen bulat-bulat. Meter Parafrasa memberi amaran jika ASAL terlalu hampir dengan teks agen.</li><li>Isi setiap penanda [ISI: ...] dan [PERLU SUMBER: ...] dengan fakta dan sumber yang benar.</li><li>Guna warna untuk menanda bahagian yang masih perlu disunting; meter di atas editor dikemas kini semasa menaip.</li></ol><div class="pd-acts"><button class="btn btn-primary" data-pd="editor">Buka ASAL dan RAM folder ini</button></div>`);
    /* langkah 5 */
    const siap = ((P.t.status || {})[f.k] || {}).siap;
    const L5 = det('L5', 'pd-l', `<span class="no">5</span> Semak dan tandakan siap <span class="ring">kesediaan ${uk.sedia}%${F.semak && F.semak.data ? ' · semakan agen: ' + esc(F.semak.data.keputusan || '') : ''}</span>`, `<div id="pdMeter" class="pd-meter-grid">${uk.meter.map(htmlMeter).join('')}</div>
      <div class="pd-acts"><button class="btn btn-sm" data-pd="segar">Kira semula meter</button><button class="btn btn-ai" data-pd="agen" data-mod="semak"${mati}>${sibuk === 'semak' ? 'Agen sedang menyemak' : 'Semakan agen (sebagai penilai jurnal)'}</button><button class="btn ${siap ? '' : 'btn-primary'}" data-pd="siap">${siap ? 'Buka semula folder ini' : 'Tanda folder siap'}</button></div>
      ${F.semak && F.semak.data ? `<div class="pd-hasil"><div class="pd-hasil-h"><b>Semakan agen terakhir: ${esc(F.semak.data.keputusan || '')}</b><span>${esc(R.fmtTime(F.semak.masa))}${F.semak.patah ? ' · ASAL ' + angka(F.semak.patah) + ' patah ketika disemak' : ''}${uk.n !== F.semak.patah ? ' · ASAL telah berubah sejak semakan ini' : ''}</span></div>${htmlSemak(F.semak.data)}</div>` : ''}`);
    const ruang = (f.p === 'kaedah' || f.p === 'dapatan') && adaPrisma() ? det('prisma', 'pd-l pd-ruang', `<span class="no ruang">P</span> Ruang PRISMA 2020 <span class="ring">${esc(Prisma.ringkas())}</span>`, '<div id="pdPrisma"></div>') : '';
    const ruangO = (f.p === 'dapatan' || f.p === 'kaedah' || f.p === 'perbincangan') && adaOutput() ? det('output', 'pd-l pd-ruang', `<span class="no ruang">O</span> Ruang Output ${kel() === 'kual' ? 'dan bahan dapatan' : 'SPSS dan AMOS'} <span class="ring">${esc(Output.ringkas())}</span>`, '<div id="pdOutput"></div>') : '';
    const acF = acuan(); const LA = acF && (f.ac || f.p === 'abstrak') ? det('LA', 'pd-l pd-acuan', `<span class="no ruang">A</span> Acuan: ${f.p === 'abstrak' ? 'abstrak' : 'bahagian ini dalam'} ${esc(acF.pendek)} <span class="ring">${f.ac ? `${f.ac.per} perenggan · ${angka(f.ac.kata)} patah · ${f.ac.sit} sitasi · ${f.ac.peratus}% badan` : esc((acF.abstrak || {}).bentuk || '')}</span>`, htmlAcuanFolder(f, uk)) : '';
    const LJ = f.p === 'pendahuluan' ? det('LJ', 'pd-l pd-acuan pd-dna', `<span class="no ruang">J</span> DNA jurang: acuan pernyataan masalah ${esc(DNA.PENDEK)} <span class="ring">${esc(DNA.ringkasan(dnaCtx()))}</span>`, DNA.html(dnaCtx())) : '';
    el.innerHTML = kepala + LA + LJ + L1 + L2 + (f.p === 'kaedah' ? ruang + ruangO : '') + (f.p === 'dapatan' ? ruangO + ruang : '') + (f.p === 'perbincangan' ? ruangO : '') + L3 + L4 + L5;
    const sel = el.querySelector('[data-pdsel="peta"]'); if (sel) sel.value = sid;
    if ($('#pdPrisma')) Prisma.render($('#pdPrisma'), f); if ($('#pdOutput')) Output.render($('#pdOutput'), f);
  }
  function htmlPetaSel(f) {
    const d = C.doc(); const nb = Teks.nombor(A.id); const guna = new Set(folders().filter(x => x.k !== f.k).map(x => sidFolder(x)).filter(Boolean));
    return `<select data-pdsel="peta" data-k="${esc(f.k)}"><option value="">Pilih seksyen</option>${Teks.senarai(A.id).filter(id => !guna.has(id)).map(id => `<option value="${esc(id)}">${esc((nb[id] || {}).no || '')} ${esc(d.seksyen[id].tajuk || 'Tanpa tajuk')}</option>`).join('')}</select>`;
  }
  function htmlBincang(x, ringkas) {
    return `<div class="pd-teks">${perenggan(x.cadanganIsi).map(p => `<p>${esc(p)}</p>`).join('')}</div>${(x.rangka || []).length ? `<div class="pd-jadual-wrap"><table class="pd-jadual"><thead><tr><th>Gerakan</th><th>Isi yang dicadangkan</th><th>Sumber dan bukti</th></tr></thead><tbody>${x.rangka.map(r => `<tr><td>${esc(r.gerakan)}</td><td>${esc(r.isi)}</td><td>${esc(r.sumber)}</td></tr>`).join('')}</tbody></table></div>` : ''}${x.sumberCadangan ? `<p class="pd-nota"><b>Tentang pilihan artikel panduan:</b> ${esc(x.sumberCadangan)}</p>` : ''}${(x.amaran || []).length ? `<ul class="pd-amaran-senarai">${x.amaran.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}${!ringkas && (x.soalanBalas || []).length ? `<p><b>Soalan agen kepada Prof Dr:</b></p><ol>${x.soalanBalas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}`;
  }
  const htmlCadangan = t => perenggan(t).map(p => { const m = /^\[([^\]]{2,80})\]\s*([\s\S]*)$/.exec(p); return m ? `<p><strong>[${esc(m[1])}]</strong>${m[2] ? ' ' + esc(m[2]) : ''}</p>` : /^(SUMBER DIGUNAKAN|KEPUTUSAN UNTUK PROF DR|SOURCES USED|DECISIONS FOR PROF DR|UJI KESATUAN|NOTA JUJUR|UNION TEST|HONEST NOTE)\s*:/i.test(p) ? `<p><strong>${esc(p.split(':')[0])}:</strong>${esc(p.slice(p.indexOf(':') + 1))}</p>` : `<p>${esc(p)}</p>`; }).join('');
  function htmlSemak(x) {
    const kelas = n => n >= 80 ? 'ok' : n >= 60 ? 'amaran' : 'gagal';
    return `<p class="pd-teks">${esc(x.ringkasan || '')}</p><div class="pd-skor">${(x.skor || []).map(s => `<div class="pd-meter ${kelas(+s.skor || 0)}"><div class="h"><b>${esc(s.kriteria)}</b><span>${esc(s.skor)} / 100</span></div><div class="bar"><i style="width:${Math.max(3, Math.min(100, +s.skor || 0))}%"></i></div><ul><li>${esc(s.ulasan)}</li></ul></div>`).join('')}</div>
      ${(x.isu || []).length ? `<div class="pd-isu"><b>Isu untuk dibaiki</b>${x.isu.map(i => `<div class="pd-isu-row"><span class="tag pd-th ${bersih(i.tahap)}"><span>${esc(i.tahap)}</span></span><div><div class="pk">${esc(i.perkara)}</div><div class="cd">${esc(i.cadangan)}</div></div></div>`).join('')}</div>` : ''}
      ${(x.tanpaSokongan || []).length ? `<div class="pd-isu"><b>Dakwaan tanpa sokongan yang memadai</b><ul>${x.tanpaSokongan.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${(x.pemboleh || []).length ? `<div class="pd-isu"><b>Liputan pemboleh ubah</b><ul>${x.pemboleh.map(v => `<li class="${v.memadai ? 'ok' : 'amaran'}">${esc(v.nama)}: ${v.memadai ? 'memadai' : 'belum memadai'}. ${esc(v.ulasan)}</li>`).join('')}</ul></div>` : ''}`;
  }
  function htmlMenyeluruh(x) {
    return `<p class="pd-teks">${esc(x.ringkasan || '')}</p>${(x.konsistensi || []).length ? `<div class="pd-jadual-wrap"><table class="pd-jadual"><thead><tr><th>Perkara</th><th>Status</th><th>Ulasan</th></tr></thead><tbody>${x.konsistensi.map(k => `<tr><td>${esc(k.perkara)}</td><td><span class="tag pd-th ${/^selaras/i.test(k.status) ? 'kecil' : /tidak selaras/i.test(k.status) ? 'kritikal' : 'sederhana'}"><span>${esc(k.status)}</span></span></td><td>${esc(k.ulasan)}</td></tr>`).join('')}</tbody></table></div>` : ''}${(x.isu || []).length ? `<div class="pd-isu"><b>Isu merentas folder</b>${x.isu.map(i => `<div class="pd-isu-row"><span class="tag pd-th ${bersih(i.tahap)}"><span>${esc(i.tahap)}</span></span><div><div class="pk">${esc(i.perkara)}</div><div class="cd">${esc(i.cadangan)}</div></div></div>`).join('')}</div>` : ''}`;
  }
  const NAMA_MOD = { bincang: 'Perbincangan isi', tanya: 'Soalan bebas', cadangan: 'Cadangan penulisan', semak: 'Semakan agen' };
  function htmlLog(F) {
    const log = (F.log || []).slice().reverse(); if (!log.length) return '';
    return det('log', 'pd-log', `Sejarah agen folder ini (${log.length})`, log.map(x => det('log-' + x.id, 'pd-log-item', `<b>${esc(NAMA_MOD[x.mod] || x.mod)}</b>${x.soalan ? ': ' + esc(potong(x.soalan, 90)) : ''} <span class="ring">${esc(R.fmtTime(x.masa))}${x.token ? ' · token ' + angka(x.token.masuk) + ' / ' + angka(x.token.keluar) : ''}</span>`, (penuh(x) ? (x.mod === 'bincang' ? htmlBincang(x.data) : x.mod === 'semak' ? htmlSemak(x.data) : `<div class="pd-teks">${x.soalan ? `<p><b>Soalan:</b> ${esc(x.soalan)}</p>` : ''}${htmlCadangan(x.jawapan)}</div>`) : '<div class="help">Teks penuh entri ini disimpan dalam awan dan sedang dimuatkan; ia juga sudah ada dalam RAM seksyen.</div>') + `<div class="pd-acts"><button class="btn btn-sm" data-pd="logram" data-id="${esc(x.id)}">Masukkan ke RAM sekali lagi</button><button class="btn btn-sm btn-danger" data-pd="logpadam" data-id="${esc(x.id)}">Padam daripada sejarah</button></div>`)).join(''));
  }

  /* ---- meter ringkas di atas editor ---- */
  function kemasBar() {
    const bar = $('#artPanduBar'); if (!bar) return; const d = C.doc(); const sid = Teks.state.bab === A.id ? Teks.state.sek : null; const f = d && P.t && P.id === A.id ? folderSeksyen(sid) : null;
    if (!f || f.p === 'rujukan') { bar.hidden = true; bar.innerHTML = ''; return; }
    const uk = ukur(f); const [, lb] = statusFolder(f, uk); bar.hidden = false; const hb = document.querySelector('header.bar') || document.querySelector('.bar'); bar.style.top = ((hb ? hb.offsetHeight : 0) + 4) + 'px';
    bar.innerHTML = `<button class="pd-bar-f" data-pd="buka" data-k="${esc(f.k)}" data-l="L5" title="Buka folder ini dalam Pandu Tulis"><b>Folder ${esc(tajukF(f))}</b><span>${lb} · kesediaan ${uk.sedia}%</span></button>${uk.meter.map(x => `<span class="pd-pil-m ${x.status}" title="${esc(x.nama + ': ' + x.teks + (x.butir && x.butir.length ? '\n' + x.butir.join('\n') : ''))}"><i></i>${esc(x.nama)} <em>${esc(x.k === 'panjang' ? angka(uk.n) + ' patah' : x.k === 'gerakan' || x.k === 'pemboleh' ? x.teks.replace(' daripada ', '/').replace(/ (dikesan|disebut)/, '') : x.k === 'parafrasa' ? x.teks.replace(' serupa dengan teks agen', '') : x.k === 'sitasi' ? x.teks.split(',')[0] : x.status === 'ok' ? 'baik' : x.status === 'info' ? 'tiada' : 'semak')}</em></span>`).join('')}`;
  }
  function kemasHidup() { clearTimeout(P.timers.hidup); P.timers.hidup = setTimeout(() => { kemasBar(); const f = folderDari(P.buka); const g = $('#pdMeter'); if (f && g && f.p !== 'rujukan') { const uk = ukur(f); g.innerHTML = uk.meter.map(htmlMeter).join(''); } }, 650); }

  /* ---- agen ---- */
  const SKEMA = {
    bincang: { type: 'object', additionalProperties: false, required: ['cadanganIsi', 'rangka', 'soalanBalas', 'sumberCadangan', 'amaran'], properties: { cadanganIsi: { type: 'string', description: 'Dua hingga empat perenggan nasihat dalam Bahasa Melayu tentang apa yang patut masuk ke dalam folder ini.' }, rangka: { type: 'array', description: 'Empat hingga lapan baris mengikut urutan gerakan retorik.', items: { type: 'object', additionalProperties: false, required: ['gerakan', 'isi', 'sumber'], properties: { gerakan: { type: 'string' }, isi: { type: 'string', description: 'Apa yang ditulis dalam perenggan itu, dua hingga tiga ayat, khusus kepada artikel ini.' }, sumber: { type: 'string', description: 'Penulis (Tahun) yang menyokong dengan bukti ringkas daripada medan; atau "Jawapan Prof Dr"; atau [PERLU SUMBER: perkara].' } } } }, soalanBalas: { type: 'array', items: { type: 'string' }, description: 'Dua hingga empat soalan kepada Prof Dr.' }, sumberCadangan: { type: 'string', description: 'Satu hingga tiga ayat tentang kesesuaian pilihan artikel panduan.' }, amaran: { type: 'array', items: { type: 'string' } } } },
    semak: { type: 'object', additionalProperties: false, required: ['ringkasan', 'keputusan', 'skor', 'isu', 'tanpaSokongan', 'pemboleh'], properties: { ringkasan: { type: 'string' }, keputusan: { type: 'string', enum: ['Sedia', 'Hampir sedia', 'Perlu pembaikan'] }, skor: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kriteria', 'skor', 'ulasan'], properties: { kriteria: { type: 'string' }, skor: { type: 'integer' }, ulasan: { type: 'string' } } } }, isu: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tahap', 'perkara', 'cadangan'], properties: { tahap: { type: 'string', enum: ['Kritikal', 'Sederhana', 'Kecil'] }, perkara: { type: 'string' }, cadangan: { type: 'string' } } } }, tanpaSokongan: { type: 'array', items: { type: 'string' } }, pemboleh: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nama', 'memadai', 'ulasan'], properties: { nama: { type: 'string' }, memadai: { type: 'boolean' }, ulasan: { type: 'string' } } } } } },
    menyeluruh: { type: 'object', additionalProperties: false, required: ['ringkasan', 'kesediaan', 'konsistensi', 'isu'], properties: { ringkasan: { type: 'string' }, kesediaan: { type: 'integer' }, konsistensi: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['perkara', 'status', 'ulasan'], properties: { perkara: { type: 'string' }, status: { type: 'string', enum: ['Selaras', 'Tidak selaras', 'Tidak pasti'] }, ulasan: { type: 'string' } } } }, isu: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tahap', 'perkara', 'cadangan'], properties: { tahap: { type: 'string', enum: ['Kritikal', 'Sederhana', 'Kecil'] }, perkara: { type: 'string' }, cadangan: { type: 'string' } } } } } }
  };
  const alat = mod => ({ name: 'pandu_' + mod, description: 'Pulangkan hasil mengikut struktur ini.', input_schema: SKEMA[mod] });
  /* Bajet JAWAPAN bagi setiap panggilan, dalam token (v1.31.1). Mod yang panjang jawapannya bergantung pada panjang artikel dikira
     daripada panjang itu: cadangan mengikut sasaran patah perkataan folder, semakan mengikut panjang teks yang disemak, semakan
     menyeluruh mengikut panjang ASAL semua folder, bedah mengikut panjang artikel contoh. Bincang dan soalan bebas mempunyai bentuk
     jawapan yang tetap. Ruang berfikir model ditambah di atas bajet ini oleh penghantar (R.Isi.hadKeluar). Had itu siling: yang dicaj
     hanyalah token yang benar-benar dijana, maka baki had tidak membazirkan apa-apa. */
  const HAD_TOKEN = { bincang: 3600, tanya: 3000, cadangan: 6000, semak: 3800, menyeluruh: 4200, bedah: 10000 };
  const TOKEN_SEPATAH = 3;   // anggaran selamat token bagi sepatah perkataan Bahasa Melayu; Bahasa Inggeris memerlukan kurang
  const kepit = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v / 100) * 100));
  function bajet(mod, n) {   // n: bilangan patah perkataan yang menentukan panjang jawapan
    n = Math.max(0, +n || 0);
    if (mod === 'cadangan') return n ? kepit(n * TOKEN_SEPATAH + 1200, 3000, 11000) : HAD_TOKEN.cadangan;
    if (mod === 'semak') return kepit(3000 + n * 0.6, HAD_TOKEN.semak, 7000);
    if (mod === 'menyeluruh') return kepit(3400 + n * 0.2, HAD_TOKEN.menyeluruh, 8000);
    if (mod === 'bedah') return kepit(4000 + n * 0.9, 8000, 11000);
    return HAD_TOKEN[mod];
  }
  /* Ayat had token keluar bagi dialog kos: jumlah had, bajet jawapan berserta asas kiraannya, dan ruang berfikir model. */
  const teksHad = (bj, asas) => { const penuh = R.Isi.hadKeluar(bj); return `had keluar ${angka(penuh)} token, iaitu ${angka(bj)} bagi jawapan${asas ? ' (' + asas + ')' : ''} dan ${angka(penuh - bj)} ruang berfikir model`; };
  const SILING = ' Had itu siling: yang dicaj hanyalah token yang benar-benar dijana.';
  const str = d => ({ type: 'string', description: d }), bil = d => ({ type: 'integer', description: d }), sen = (items, d) => ({ type: 'array', description: d, items });
  const obj = (props, d) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props, description: d });
  SKEMA.bedah = obj({
    pendek: str('Sitasi ringkas artikel: Pengarang (Tahun), Pengarang dan Pengarang (Tahun) atau Pengarang et al. (Tahun).'), tajuk: str('Tajuk artikel tepat seperti dalam teks.'), jurnal: str('Nama jurnal; rentetan kosong jika tidak pasti.'),
    reka: str('Dua hingga empat ayat: reka bentuk kajian, sampel atau bilangan sumber, kaedah analisis, bilangan soalan atau hipotesis, bilangan jadual dan rajah.'),
    ciri: sen({ type: 'string' }, 'Lima hingga lapan ciri penulisan artikel ini yang patut ditiru, setiap satu satu ayat.'),
    abstrak: obj({ bentuk: str('Berstruktur atau satu perenggan, anggaran patah perkataan, bilangan kata kunci.'), cara: str('Urutan kandungan abstrak dalam satu hingga dua ayat.'), kata: bil('Anggaran patah perkataan abstrak.') }),
    bahagian: sen(obj({
      p: { type: 'string', enum: PERANAN, description: 'Peranan bahagian dalam artikel.' }, bm: str('Tajuk bahagian dalam Bahasa Melayu (generik, sesuai dijadikan tajuk seksyen).'), en: str('Tajuk bahagian seperti dalam artikel.'),
      kata: bil('Anggaran patah perkataan bahagian ini termasuk subbahagiannya.'), per: bil('Bilangan perenggan.'), sit: bil('Bilangan sitasi dalam teks bahagian ini.'), jadual: bil('Bilangan jadual.'), rajah: bil('Bilangan rajah.'),
      sub: sen(obj({ bm: str('Subtajuk generik dalam Bahasa Melayu.'), en: str('Subtajuk seperti dalam artikel.') }), 'Subtajuk bahagian ini mengikut urutan; kosong jika tiada.'),
      peta: sen(obj({ g: { type: 'string', enum: Object.keys(POLA), description: 'Kod gerakan retorik.' }, f: str('Fungsi perenggan atau kumpulan perenggan, frasa pendek.'), cara: str('Cara ia dibina: bilangan ayat, apa yang dilakukan oleh ayat pertama dan seterusnya, penanda wacana, cara sitasi digunakan. Dua hingga empat ayat dengan kata-kata sendiri.'), w: bil('Anggaran patah perkataan.'), cit: bil('Bilangan sitasi.'), n: bil('Bilangan perenggan yang diliputi entri ini (1 jika satu perenggan).') }), 'Peta perenggan mengikut urutan. Bahagian Pendahuluan, Metodologi dan Perbincangan dipetakan perenggan demi perenggan; bahagian lain boleh dikumpulkan.'),
      ajar: sen({ type: 'string' }, 'Satu hingga tiga perkara yang patut ditiru.'), elak: sen({ type: 'string' }, 'Perkara yang tidak patut ditiru atau perlu disesuaikan; kosong jika tiada.')
    }), 'Bahagian utama badan artikel mengikut urutan (tidak termasuk abstrak dan senarai rujukan).'),
    suai: sen({ type: 'string' }, 'Tiga hingga lima nasihat menyesuaikan acuan ini untuk manuskrip jurnal berwasit Malaysia.')
  });
  function ringkasSumber(no, r, medan) {
    const F = R.FIELD_BY_KEY || {}; const ks = ['objektif'].concat(medan.filter(k => k !== 'objektif'));
    return `ARTIKEL ${no} (Bil. ${r.bil || '?'}): ${Bd().nama(r)}. ${r.tajuk || ''}\n` + ks.map(k => { const v = r[k]; if (R.Isi.nilaiKosong(v)) return null; return `- ${(F[k] && F[k].label) || k}: ${String(Array.isArray(v) ? v.join('; ') : v).slice(0, k === 'dapatan' ? 1400 : 800)}`; }).filter(Boolean).join('\n');
  }
  function blokSumber(f, sp, F) {
    const d = C.doc(); const semua = C.sumberAda(d); const ut = (F.utama || []).filter(id => semua.includes(id)); const sk = (F.sekunder || []).filter(id => semua.includes(id) && !ut.includes(id)); const lain = semua.filter(id => !ut.includes(id) && !sk.includes(id)); let no = 0; const bah = [];
    if (sp.bahan === 'asal') { bah.push('ARTIKEL SUMBER ARTIKEL INI (senarai ringkas; folder ini ditulis daripada ASAL Prof Dr, bukan daripada sumber):\n' + semua.map(id => { const r = Bd().rekod(id); return `- ${Bd().nama(r)}. ${String(r.tajuk || '').slice(0, 140)}`; }).join('\n')); return { teks: bah.join('\n\n'), ut, sk, lain }; }
    if (ut.length) bah.push(`[A] ARTIKEL PANDUAN UTAMA (${ut.length}; medan penuh Bahagian A hingga F):\n\n` + ut.map(id => Bd().teksRekod(++no, Bd().rekod(id))).join('\n\n'));
    if (sk.length) bah.push(`[B] ARTIKEL SEKUNDER (${sk.length}; medan terpilih):\n\n` + sk.map(id => ringkasSumber(++no, Bd().rekod(id), (sp.medan || []).concat(['dapatan', 'batasan']).filter((k, i, a) => a.indexOf(k) === i))).join('\n\n'));
    if (lain.length) bah.push(`[C] ARTIKEL SUMBER LAIN ARTIKEL INI (${lain.length}; ringkas, boleh disitasi jika relevan tetapi maklumatnya terhad):\n` + lain.map(id => { const r = Bd().rekod(id); return `- ARTIKEL ${++no}: ${Bd().nama(r)}. ${String(r.tajuk || '').slice(0, 140)}. Objektif: ${String(r.objektif || 'tiada dalam rekod').slice(0, 220)}`; }).join('\n'));
    return { teks: bah.join('\n\n') || 'TIADA ARTIKEL SUMBER DIPILIH.', ut, sk, lain };
  }
  function sistem(f, sp, F, t) {
    const d = C.doc(); const e = C.entri(A.id) || {}; const j = C.JENIS_PETA[d.jenis]; const g = gaya(); const pv = (P.t.pemboleh || []).filter(v => v.nama); const bs = blokSumber(f, sp, F); const ac = acuan();
    return { bs, teks: `Anda ialah Agen Pandu Tulis Prof Dr Claude: pembimbing penulisan artikel jurnal kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris yang menyasarkan ${arasTeks()}. Peranan anda ialah pembantu, bukan penulis ganti: anda membantu Prof Dr memutuskan apa yang patut ditulis, menyusun hujah daripada bukti, mencadangkan draf untuk DIPARAFRASA oleh Prof Dr, dan menyemak tulisan beliau dengan jujur dan tegas.

ARTIKEL YANG SEDANG DITULIS
Tajuk kerja: ${e.tajuk || 'belum bertajuk'}
Jenis: ${j ? j.nama : d.jenis} (struktur ${D.NAMA_KELUARGA[kel()] || 'lazim'})
Bahasa manuskrip: ${namaBahasa()}
Pemboleh ubah atau konstruk utama: ${pv.length ? pv.map(v => v.nama + (v.alias ? ' (padanan: ' + v.alias + ')' : '')).join('; ') : 'belum ditetapkan oleh Prof Dr'}
Sasaran panjang manuskrip: kira-kira ${angka(jumlahSasaran())} patah perkataan

PERATURAN TETAP
1. Sifar fabrikasi rujukan. Fakta dan dakwaan tentang kajian lepas HANYA daripada ARTIKEL SUMBER di bawah, disitasi sebagai Penulis (Tahun) tepat seperti kepala setiap artikel. Jika hujah memerlukan sumber yang tiada dalam senarai (contohnya teori asal atau garis panduan pelaporan), tulis penanda [PERLU SUMBER: perkara] dan jangan mereka nama, tahun atau angka.
2. Fakta tentang kajian atau ulasan Prof Dr sendiri (sampel, tarikh, pangkalan data, angka, keputusan analisis) HANYA daripada jawapan Prof Dr dan data yang disertakan dalam mesej. Jika tiada, tulis penanda [ISI: perkara] dan senaraikannya sebagai soalan atau keputusan untuk Prof Dr.
3. Bahasa: perbincangan, nasihat dan semakan ditulis dalam Bahasa Melayu Malaysia baku (istilah Malaysia: guru besar, dapatan, kajian); teks cadangan untuk manuskrip ditulis sepenuhnya dalam ${namaBahasa()}. Jangan gunakan sempang em atau en. Bagi setiap teks Bahasa Melayu, ikut PIAWAIAN BAHASA di bawah, termasuk senarai istilah Prof Dr.
4. Kepadatan sitasi: ayat penyata tentang literatur disokong sitasi; dakwaan penting disokong dua sumber bebas atau lebih jika senarai membenarkannya; elakkan satu sitasi di hujung perenggan sahaja.
5. Sintesis, bukan laporan: kelompokkan sumber mengikut pola dapatan, kaedah atau konteks dan bandingkan yang selari dengan yang bercanggah; jangan huraikan kajian demi kajian dan jangan mulakan perenggan berturut-turut dengan nama pengarang.
6. Jujur tentang had bukti: jika medan rekod tidak memadai, nyatakan artikel dan bahagian yang perlu dilengkapkan.
7. Peraturan gaya Prof Dr: istilah yang dilarang: ${g.larang}. Frasa yang dielakkan: ${g.frasa}. Rujukan diutamakan dalam tempoh ${g.hadTahun} tahun terkini kecuali karya teori asal dan garis panduan. ${g.arahan}
${ac ? `8. Acuan artikel contoh: susunan folder dan urutan perenggan artikel ini mengikut satu artikel contoh yang telah dibedah (lihat ACUAN). Tiru STRUKTUR, FUNGSI setiap perenggan, nisbah panjang dan kepadatan sitasinya. JANGAN menyalin ayat, contoh atau dapatan artikel contoh, dan jangan menyitasinya kecuali ia juga tersenarai sebagai ARTIKEL SUMBER. Jika acuan bercanggah dengan peraturan gaya Prof Dr atau dengan nota "Jangan tiru", peraturan Prof Dr yang dipakai.

ACUAN ARTIKEL CONTOH: ${ac.pendek}${ac.jurnal ? ', ' + ac.jurnal : ''}
Reka bentuk artikel contoh: ${ac.reka || 'tidak dinyatakan'}
Ciri penulisan yang ditiru:
${(ac.ciri || []).map(c => '- ' + c).join('\n')}
Nisbah bahagian (daripada badan ${ac.ukuran.badan} patah perkataan): ${ac.bahagian.map(b => `${b.bm} ${b.peratus}% (${b.per} perenggan, ${b.sit} sitasi)`).join('; ')}
Penyesuaian untuk artikel Prof Dr:
${(ac.suai || []).map(c => '- ' + c).join('\n')}
` : ''}
${PIAWAI_RINGKAS}

Profil kajian Prof Dr (konteks sahaja; artikel ini mungkin hanya sebahagian daripadanya):
${t.profil}

${bs.teks}` };
  }
  function konteksFolder(f, sp, F) {
    const tl = tulis(); const i = tl.indexOf(f); const ss = sasaran(f); const d = C.doc(); const sub = julat(f).slice(1).map(id => d.seksyen[id].tajuk).filter(Boolean);
    const jawab = sp.soalan.map(q => `- ${q.t}\n  Jawapan: ${String((F.jawab || {})[q.k] || '').trim() || '(belum dijawab)'}`).join('\n');
    const balas = (F.balasLama || []).concat(F.balas || []).filter(b => String(b.jawapan || '').trim()).slice(-10).map(b => `- ${b.soalan}\n  Jawapan: ${b.jawapan.trim()}`).join('\n');
    const dahulu = tl.slice(0, i).filter(x => x.p !== 'rujukan' && x.p !== 'abstrak').map(x => ({ x, t: teksFolder(x) })).filter(o => patah(o.t) >= 40).slice(-4).map(o => `[${tajukF(o.x)}] ${potong(o.t, 1800)}`).join('\n\n');
    return `FOLDER SEMASA: ${sp.nama} (seksyen "${d.seksyen[sidFolder(f)].tajuk || tajukF(f)}"), folder ${i + 1} daripada ${tl.length} dalam urutan menulis.
TUJUAN FOLDER: ${sp.tujuan}
GERAKAN RETORIK YANG LAZIM:
${sp.gerakan.map((g, n) => `${n + 1}. ${g.nama}${g.wajib ? '' : ' (pilihan)'}: ${g.ket}`).join('\n')}
${ss ? `SASARAN PANJANG FOLDER: ${ss[0]} hingga ${ss[1]} patah perkataan.` : ''}${sub.length ? `\nSUBSEKSYEN DALAM FOLDER: ${sub.join('; ')}.` : ''}

JAWAPAN PROF DR KEPADA SOALAN PANDUAN:
${jawab}${balas ? `\n\nJAWAPAN PROF DR KEPADA SOALAN AGEN TERDAHULU:\n${balas}` : ''}${dahulu ? `\n\nPETIKAN ASAL FOLDER TERDAHULU (untuk kesinambungan; ditulis oleh Prof Dr):\n${dahulu}` : ''}${teksAcuanFolder(f)}${dnaAktif(f) ? DNA.teksAgen(dnaCtx()) : ''}`;
  }
  /* Peta perenggan acuan bagi folder semasa, untuk agen. */
  function teksAcuanFolder(f) {
    const ac = acuan(); if (!ac) return '';
    if (f.p === 'abstrak') { const a = ac.abstrak || {}; return a.bentuk || a.cara ? `\n\nACUAN ABSTRAK (${ac.pendek}): ${a.bentuk || ''} ${a.cara || ''}` : ''; }
    const b = f.ac; if (!b) return '';
    return `\n\nACUAN BAGI FOLDER INI (bahagian "${b.en || b.bm}" dalam ${ac.pendek}: ${b.kata} patah perkataan, ${b.per} perenggan, ${b.sit} sitasi${b.jadual ? ', ' + b.jadual + ' jadual' : ''}${b.rajah ? ', ' + b.rajah + ' rajah' : ''}).${(b.sub || []).length ? '\nSubtajuk artikel contoh: ' + b.sub.map(x => x.bm).join('; ') + '.' : ''}
Peta perenggan mengikut urutan:
${(b.peta || []).map((x, i) => `${i + 1}. [${(POLA[x.g] || {}).nama || x.g}] ${x.f}. Cara dibina: ${x.cara}${x.w ? ' (' + (x.n > 1 ? x.n + ' perenggan, ' : '') + 'kira-kira ' + x.w + ' patah perkataan' + (x.cit != null ? ', ' + x.cit + ' sitasi' : '') + ')' : ''}`).join('\n')}${(b.ajar || []).length ? '\nPatut ditiru: ' + b.ajar.join(' ') : ''}${(b.elak || []).length ? '\nJangan tiru atau sesuaikan: ' + b.elak.join(' ') : ''}
ARAHAN ACUAN: rangka, cadangan dan semakan bagi folder ini mesti mengikut urutan fungsi dalam peta perenggan di atas, dengan panjang dan kepadatan sitasi yang setara secara nisbah. Gabungkan atau pecahkan perenggan hanya apabila jawapan Prof Dr atau bahan memerlukannya, dan nyatakan sebabnya. Isi setiap perenggan datang daripada artikel sumber dan jawapan Prof Dr, bukan daripada artikel contoh.`;
  }
  function asalSemua(kecuali, had) { return tulis().filter(x => x.p !== 'rujukan' && x.k !== kecuali).map(x => ({ x, t: teksFolder(x) })).filter(o => patah(o.t) >= 20).map(o => `=== ${tajukF(o.x)} (${patah(o.t)} patah) ===\n${potong(o.t, had || 9000)}`).join('\n\n'); }
  function ringkasMeter(uk) { return uk.meter.map(m => `- ${m.nama}: ${m.teks} (${m.status === 'ok' ? 'baik' : m.status === 'info' ? 'makluman' : m.status})${m.butir && m.butir.length ? '. ' + m.butir.join(' ') : ''}`).join('\n'); }
  /* Panggilan yang gagal selepas API menjana token (contohnya jawapan kosong pada had token) tetap dicaj: tokennya dimasukkan ke dalam
     jumlah artikel ini dan dikira sebagai panggilan gagal, supaya kiraan pada bar kesediaan jujur. */
  function catatGagal(e) {
    if (!e || !e.usage) return; const tk = P.t.token || { masuk: 0, keluar: 0, panggil: 0 };
    P.t.token = { masuk: (tk.masuk || 0) + R.Isi.masukSemua(e.usage), keluar: (tk.keluar || 0) + (e.usage.keluar || 0), panggil: (tk.panggil || 0) + 1, gagal: (tk.gagal || 0) + 1 }; simpanT(true);
  }
  async function agen(k, mod) {
    if (P.busy) return; const d = C.doc(); if (!d) return; const seluruh = mod === 'menyeluruh'; const f = seluruh ? null : folderDari(k); if (!seluruh && (!f || !sidFolder(f))) { toast('Seksyen folder ini tiada; kemas kini folder dahulu', true); return; }
    const t = await R.Isi.tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const sp = seluruh ? null : specF(f); const F = seluruh ? null : fd(k); let soalan = ''; let uk = null;
    if (!seluruh) simpanF(k, true);
    if (mod === 'tanya') { soalan = String(F.tanya || '').trim(); if (!soalan) { toast('Taip soalan dahulu dalam kotak soalan bebas', true); return; } }
    if (mod === 'semak') { uk = ukur(f); if (uk.n < 60) { toast('ASAL folder ini belum cukup untuk disemak (sekurang-kurangnya 60 patah perkataan). Tulis dahulu dalam ASAL.', true); return; } }
    if (seluruh) { const ada = tulis().filter(x => x.p !== 'rujukan' && patah(teksFolder(x)) >= 100).length; if (ada < 2) { toast('Semakan menyeluruh memerlukan sekurang-kurangnya dua folder yang sudah ada ASAL (100 patah perkataan atau lebih).', true); return; } }
    if (!seluruh && sp.bahan !== 'asal' && mod !== 'semak' && !(F.utama || []).length) {
      const sy = syor(f, sp).slice(0, 3).map(x => x.id); if (!sy.length) { toast('Pilih artikel sumber dahulu dalam bahagian "Artikel sumber daripada repositori"', true); return; }
      const ok = await R.richModal('Artikel panduan belum dipilih', `<p>Langkah 1 folder ini belum diisi: agen perlu tahu artikel yang mana menjadi panduan utama.</p><p>Guna cadangan sistem sebagai panduan utama?</p><ul>${sy.map(id => `<li>${esc(Bd().nama(Bd().rekod(id)))}</li>`).join('')}</ul><p class="help">Pilihan boleh diubah bila-bila masa dalam Langkah 1.</p>`, 'Guna cadangan ini', 'Saya pilih sendiri'); if (!ok) { P.terbuka.add('L1'); renderFolder(); return; }
      F.utama = sy; simpanF(k, true);
    }
    if (!seluruh && sp.bahan === 'asal' && mod !== 'semak') { const ada = tulis().filter(x => x.p !== 'rujukan' && x.p !== 'abstrak' && x.k !== k && patah(teksFolder(x)) >= 100).length; if (ada < 2) { const ok = await R.confirmBox(sp.nama + ' ditulis daripada ASAL folder lain', 'Kurang daripada dua folder lain mempunyai ASAL yang memadai (100 patah perkataan atau lebih). Agen akan mempunyai bahan yang sangat sedikit, dan hasilnya tidak akan mencerminkan manuskrip. Teruskan juga?', 'Teruskan juga', false); if (!ok) return; } }
    if (mod === 'cadangan' && sp.bahan !== 'asal' && !(F.log || []).some(x => x.mod === 'bincang') && !sp.soalan.some(q => String((F.jawab || {})[q.k] || '').trim())) { const ok = await R.confirmBox('Belum ada soal jawab bagi folder ini', 'Cadangan penulisan paling berguna selepas Langkah 2: jawab soalan panduan dan bincang dengan agen dahulu, supaya cadangan mengikut hujah Prof Dr sendiri dan bukan hujah agen. Jana cadangan tanpa soal jawab?', 'Jana juga', false); if (!ok) { P.terbuka.add('L2'); renderFolder(); return; } }
    if (!seluruh && (F.panggil || 0) >= (F.had || HAD_PANGGIL)) { const ok = await R.confirmBox('Had panggilan agen folder ini dicapai', `Folder ini sudah menggunakan ${F.panggil} panggilan agen (had ${F.had || HAD_PANGGIL}). Setiap panggilan melibatkan kos pada akaun Anthropic Prof Dr. Tambah ${TAMBAH_PANGGIL} panggilan lagi bagi folder ini?`, 'Tambah ' + TAMBAH_PANGGIL + ' panggilan', true); if (!ok) return; F.had = (F.had || HAD_PANGGIL) + TAMBAH_PANGGIL; simpanF(k, true); }
    /* bina mesej */
    let system, content = [], tugas, nImej = 0, ringkasBahan = '';
    if (seluruh) {
      const sp0 = D.spec(kel(), 'kesimpulan'); const s0 = sistem(tulis()[0], sp0, fKosong('x'), t); system = s0.teks;
      tugas = `[MOD:menyeluruh]\nASAL SEMUA FOLDER (ditulis oleh Prof Dr):\n\n${asalSemua(null, 7000)}${adaPrisma() ? '\n\n' + Prisma.teksAgen() : ''}\n\nTUGAS: Jalankan semakan menyeluruh manuskrip ini sebagai penilai ${arasPenilai()}. Semak keselarasan antara tujuan dan soalan (Pendahuluan), kaedah, dapatan, perbincangan, kesimpulan dan abstrak; keselarasan istilah bagi setiap pemboleh ubah; dakwaan atau angka yang tidak selaras antara folder; dan pengulangan. Pulangkan JSON: ringkasan (tiga hingga lima ayat), kesediaan (integer 0 hingga 100), konsistensi (lima hingga lapan perkara yang disemak, setiap satu dengan status Selaras, Tidak selaras atau Tidak pasti dan ulasan ringkas yang menamakan folder), isu (paling penting dahulu; tahap Kritikal, Sederhana atau Kecil; perkara; cadangan). Jangan menulis semula teks.`;
      ringkasBahan = 'ASAL semua folder';
    } else {
      const s0 = sistem(f, sp, F, t); system = s0.teks; const kf = konteksFolder(f, sp, F); const ss = sasaran(f); const bah = [kf];
      ringkasBahan = sp.bahan === 'asal' ? 'ASAL folder lain' : `${s0.bs.ut.length} artikel panduan utama (medan penuh), ${s0.bs.sk.length} sekunder dan ${s0.bs.lain.length} sumber lain secara ringkas`;
      if (sp.bahan === 'asal') bah.push('ASAL FOLDER LAIN (bahan utama folder ini; ditulis oleh Prof Dr):\n\n' + (asalSemua(k, f.p === 'abstrak' ? 9000 : 5000) || '(belum ada ASAL)'));
      if (adaPrisma() && (f.p === 'kaedah' || f.p === 'dapatan' || f.p === 'abstrak')) bah.push(Prisma.teksAgen());
      if (adaOutput() && (f.p === 'dapatan' || f.p === 'kaedah' || f.p === 'perbincangan' || f.p === 'abstrak')) { const o = await Output.untukAgen(f.p === 'dapatan'); if (o.teks) bah.push(o.teks); if (o.imej.length) { content = content.concat(o.imej); nImej = o.imej.length; } if (o.teks || o.imej.length) ringkasBahan += `, ${o.n} output analisis${nImej ? ' (' + nImej + ' imej)' : ''}`; }
      const asal = teksFolder(f);
      if (mod === 'bincang') tugas = `[MOD:bincang]\n${bah.join('\n\n')}${patah(asal) >= 20 ? `\n\nTEKS ASAL SEMASA FOLDER INI (ditulis oleh Prof Dr):\n${potong(asal, 5000)}` : ''}\n\nTUGAS: Bincangkan dengan Prof Dr apa yang sesuai dimasukkan ke dalam folder ini berdasarkan tajuk, pemboleh ubah, jawapan beliau dan bahan yang diberi. Pulangkan JSON:\n- cadanganIsi: dua hingga empat perenggan nasihat dalam Bahasa Melayu: fokus paling kuat bagi folder ini, hujah teras dan apa yang patut dielakkan; rujuk artikel dengan Penulis (Tahun).\n- rangka: empat hingga lapan baris mengikut urutan gerakan retorik; setiap baris: gerakan (nama gerakan), isi (apa yang ditulis dalam perenggan itu, dua hingga tiga ayat, khusus kepada artikel ini), sumber (Penulis (Tahun) yang menyokong dengan bukti ringkas daripada medan; atau "Jawapan Prof Dr"; atau [PERLU SUMBER: perkara]).\n- soalanBalas: dua hingga empat soalan kepada Prof Dr tentang perkara yang belum jelas atau belum dijawab dan yang akan mengubah tulisan; jangan ulang soalan yang sudah dijawab.\n- sumberCadangan: satu hingga tiga ayat: sama ada pilihan artikel panduan utama dan sekunder sesuai bagi folder ini, dan artikel lain dalam senarai yang wajar dinaikkan, dengan sebab.\n- amaran: perkara yang berisiko ditolak penilai (contohnya jurang tidak disokong, pemboleh ubah tidak diliputi, medan rekod tidak memadai); senarai kosong jika tiada.${dnaAktif(f) ? '\n' + DNA.arahanBincang() : ''}`;
      else if (mod === 'tanya') tugas = `[MOD:tanya]\n${bah.join('\n\n')}\n\nSOALAN PROF DR TENTANG FOLDER INI: ${soalan}\n\nTUGAS: Jawab dalam Bahasa Melayu, dua hingga lima perenggan padat tanpa pengantar, berpijak pada bahan yang diberi dan jawapan Prof Dr; namakan artikel yang menyokong setiap dakwaan. Akhiri dengan satu perenggan pendek bermula "Untuk folder ini:" tentang cara jawapan ini digunakan dalam tulisan.`;
      else if (mod === 'cadangan') { const lb = (F.log || []).filter(x => x.mod === 'bincang' && x.data).slice(-1)[0]; tugas = `[MOD:cadangan]\n${bah.join('\n\n')}${lb ? `\n\nRANGKA DARIPADA PERBINCANGAN TERAKHIR:\n${(lb.data.rangka || []).map((r, n) => `${n + 1}. ${r.gerakan}: ${r.isi} [${r.sumber}]`).join('\n')}` : ''}${patah(asal) >= 20 ? `\n\nTEKS ASAL SEMASA FOLDER INI (ditulis oleh Prof Dr; cadangan mesti melengkapi, bukan mengulang):\n${potong(asal, 5000)}` : ''}\n\nTUGAS: Tulis CADANGAN penulisan bagi folder ini dalam ${namaBahasa()}${ss ? ', ' + ss[0] + ' hingga ' + ss[1] + ' patah perkataan' : ''}, mengikut rangka dan jawapan Prof Dr. Ini cadangan untuk diparafrasa oleh Prof Dr, bukan teks akhir.\nFormat: perenggan prosa yang dipisahkan satu baris kosong; setiap perenggan didahului label fungsi dalam kurungan siku pada baris yang sama (contohnya [${en() ? 'Research gap' : 'Jurang kajian'}]); tiada senarai berbutir dan tiada tajuk lain. Selepas perenggan terakhir tulis dua perenggan pendek bermula "${en() ? 'SOURCES USED' : 'SUMBER DIGUNAKAN'}:" (Penulis (Tahun) yang disitasi) dan "${en() ? 'DECISIONS FOR PROF DR' : 'KEPUTUSAN UNTUK PROF DR'}:" (dua hingga empat perkara yang beliau perlu putuskan atau isi sendiri, termasuk setiap penanda [ISI: ...] dan [PERLU SUMBER: ...]).${String(F.arahan || '').trim() ? `\nARAHAN KHUSUS PROF DR: ${F.arahan.trim()}` : ''}${dnaAktif(f) ? '\n' + DNA.arahanCadangan(en()) : ''}`; }
      else tugas = `[MOD:semak]\n${bah.join('\n\n')}\n\nTEKS ASAL PROF DR BAGI FOLDER INI (${uk.n} patah perkataan):\n"""\n${potong(asal, 14000)}\n"""\n\nHASIL SEMAKAN AUTOMATIK SISTEM:\n${ringkasMeter(uk)}\n\nTUGAS: Nilai teks ASAL ini sebagai penilai ${arasPenilai()} yang adil tetapi tegas, berdasarkan tujuan dan gerakan folder serta bahan yang diberi. Pulangkan JSON:\n- ringkasan: tiga hingga lima ayat.\n- keputusan: Sedia, Hampir sedia atau Perlu pembaikan.\n- skor: satu item bagi setiap kriteria berikut, tepat mengikut nama: ${sp.kriteria.concat(dnaAktif(f) ? DNA.KRITERIA : []).join('; ')}. Skor integer 0 hingga 100 dengan ulasan satu hingga dua ayat yang merujuk teks.\n- isu: isu yang perlu dibaiki, paling penting dahulu; tahap Kritikal, Sederhana atau Kecil; perkara (petik frasa pendek daripada teks jika membantu); cadangan (cara membaikinya, tanpa menulis semula seluruh perenggan).\n- tanpaSokongan: ayat atau dakwaan yang tidak disokong sitasi, atau yang tidak sepadan dengan medan artikel yang disitasi (petik ringkas); senarai kosong jika tiada.\n- pemboleh: bagi setiap pemboleh ubah artikel: memadai (true atau false) dan ulasan ringkas; senarai kosong jika pemboleh ubah belum ditetapkan.\nJangan menulis semula teks; tugas ini semakan.${dnaAktif(f) ? '\n' + DNA.arahanSemak() : ''}`;
    }
    content.push({ type: 'text', text: tugas });
    const anggaran = anggarToken(system) + anggarToken(tugas) + nImej * 1600; const tk = P.t.token || { masuk: 0, keluar: 0, panggil: 0 };
    /* bajet jawapan mengikut panjang yang diminta */
    const ssF = seluruh ? null : sasaran(f); const nSemua = seluruh ? tulis().filter(x => x.p !== 'rujukan').reduce((n, x) => n + patah(teksFolder(x)), 0) : 0;
    const bj = bajet(mod, mod === 'cadangan' ? (ssF ? ssF[1] : 0) : mod === 'semak' ? uk.n : seluruh ? nSemua : 0);
    const asasBj = mod === 'cadangan' && ssF ? `mengikut sasaran ${angka(ssF[0])} hingga ${angka(ssF[1])} patah perkataan folder ini` : mod === 'semak' ? `mengikut ${angka(uk.n)} patah perkataan teks ASAL yang disemak` : seluruh ? `mengikut ${angka(nSemua)} patah perkataan ASAL semua folder` : '';
    const ok = await R.confirmBox(`${seluruh ? 'Semakan menyeluruh manuskrip' : NAMA_MOD[mod] + ': ' + sp.nama}: hantar kepada agen?`, `Panggilan ini menghantar ${ringkasBahan}${seluruh ? '' : ', jawapan Prof Dr dan konteks folder'} ke API Anthropic menggunakan kunci API Prof Dr (anggaran ${angka(anggaran)} token masuk; ${teksHad(bj, asasBj)}; model ${t.model.replace('claude-', '')}). Kosnya dicaj kepada akaun Anthropic Prof Dr.${SILING}${seluruh ? '' : ` Panggilan ke-${(F.panggil || 0) + 1} daripada ${F.had || HAD_PANGGIL} bagi folder ini.`} Setakat ini artikel ini: ${tk.panggil || 0} panggilan, token masuk ${angka(tk.masuk)}, keluar ${angka(tk.keluar)}.`, 'Hantar kepada agen', false);
    if (!ok) return;
    P.busy = { k: seluruh ? null : k, mod }; if (seluruh) render(); else renderFolder();
    try {
      const berstruktur = !!SKEMA[mod];
      const res = await R.Isi.hantar(t, { kunciMod: 'pandu-' + mod + ':' + t.model, system, content, skema: berstruktur ? SKEMA[mod] : undefined, alat: berstruktur ? alat(mod) : undefined, hadToken: bj });
      let data = null, jawapan = '';
      /* jawapan yang tiba tetapi tidak dapat dibaca tetap dicaj: tokennya dibawa bersama ralat supaya dikira (catatGagal) */
      if (berstruktur) { try { data = dalamBersih(res.input || R.Isi.parseJson(res.text, res.stop)); } catch (e) { if (e && typeof e === 'object') e.usage = res.usage; throw e; } if (!data || typeof data !== 'object') throw { code: 'json', stop: res.stop, usage: res.usage }; }
      else { jawapan = tanpaSempang(String(res.text || '').trim()).slice(0, HAD_TEKS); if (!jawapan) throw { code: 'kosong', stop: res.stop, had: res.had, usage: res.usage }; }
      P.t.token = { masuk: (tk.masuk || 0) + (res.usage ? res.usage.masuk + (res.usage.cacheBaca || 0) + (res.usage.cacheTulis || 0) : 0), keluar: (tk.keluar || 0) + (res.usage ? res.usage.keluar : 0), panggil: (tk.panggil || 0) + 1, gagal: tk.gagal || 0 };
      const masa = sekarang(); const token = res.usage ? { masuk: res.usage.masuk + (res.usage.cacheBaca || 0) + (res.usage.cacheTulis || 0), keluar: res.usage.keluar } : null;
      if (seluruh) { P.t.menyeluruh = { masa, data, model: t.model, token }; P.terbuka.add('menyeluruh'); simpanT(true); toast('Semakan menyeluruh siap: kesediaan ' + (data.kesediaan || 0) + '%'); }
      else {
        const rec = { id: idBaru('g'), mod, masa, model: t.model, token, soalan: soalan || undefined, jawapan: jawapan || undefined, data: data || undefined }; F.log = (F.log || []).concat([rec]).slice(-HAD_LOG); F.panggil = (F.panggil || 0) + 1;
        if (mod === 'bincang') { F.balasLama = (F.balasLama || []).concat((F.balas || []).filter(b => String(b.jawapan || '').trim())).slice(-12); F.balas = (data.soalanBalas || []).slice(0, 5).map(q => ({ id: idBaru('b'), soalan: q, jawapan: '' })); P.terbuka.add('L2'); }
        if (mod === 'tanya') { F.tanya = ''; P.terbuka.add('log'); P.terbuka.add('log-' + rec.id); }
        if (mod === 'cadangan') P.terbuka.add('L3');
        if (mod === 'semak') { F.semak = { masa, data, patah: uk.n, model: t.model }; P.terbuka.add('L5'); }
        simpanF(k, true); simpanT(true);
        const masuk = sisip(sasaranRam(f), 'ram', htmlRam(rec, sp)); toast(`${NAMA_MOD[mod]} siap${masuk ? ' dan dimasukkan ke RAM seksyen' : ''}${token ? ' (token masuk ' + angka(token.masuk) + ', keluar ' + angka(token.keluar) + ')' : ''}${res.ulang ? '. Percubaan pertama kehabisan had token semasa model berfikir, maka permintaan diulang sekali dengan had lebih tinggi dan kedalaman berfikir rendah; token kedua-dua percubaan dikira' : ''}${res.stop === 'max_tokens' ? '. Jawapan mencapai had token dan mungkin terpotong.' : ''}`);
      }
    } catch (e) { catatGagal(e); toast('Agen gagal: ' + R.Isi.msg(e), true); }
    finally { P.busy = null; render(); }
  }
  /* HTML bagi RAM: tag yang dibenarkan editor sahaja (perenggan, tebal, condong, senarai, jadual). */
  function htmlRam(rec, sp) {
    const kepala = `<p><strong>[Agen Pandu Tulis · ${esc(NAMA_MOD[rec.mod] || rec.mod)} · ${esc(sp.nama)} · ${esc(R.fmtTime(rec.masa))}]</strong></p>`; const kaki = '<p><em>Bahan agen untuk diparafrasa; semak setiap dakwaan terhadap rekod sebelum dipindahkan ke ASAL.</em></p>';
    if (rec.mod === 'bincang') { const x = rec.data; return kepala + perenggan(x.cadanganIsi).map(p => `<p>${esc(p)}</p>`).join('') + ((x.rangka || []).length ? `<table><tbody><tr><th>Gerakan</th><th>Isi yang dicadangkan</th><th>Sumber dan bukti</th></tr>${x.rangka.map(r => `<tr><td>${esc(r.gerakan)}</td><td>${esc(r.isi)}</td><td>${esc(r.sumber)}</td></tr>`).join('')}</tbody></table>` : '') + (x.sumberCadangan ? `<p><strong>Tentang artikel panduan:</strong> ${esc(x.sumberCadangan)}</p>` : '') + ((x.amaran || []).length ? `<p><strong>Amaran:</strong></p><ul>${x.amaran.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '') + ((x.soalanBalas || []).length ? `<p><strong>Soalan agen kepada Prof Dr:</strong></p><ol>${x.soalanBalas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : '') + kaki; }
    if (rec.mod === 'semak') { const x = rec.data; return kepala + `<p><strong>Keputusan: ${esc(x.keputusan || '')}.</strong> ${esc(x.ringkasan || '')}</p>` + ((x.skor || []).length ? `<table><tbody><tr><th>Kriteria</th><th>Skor</th><th>Ulasan</th></tr>${x.skor.map(s => `<tr><td>${esc(s.kriteria)}</td><td>${esc(s.skor)}</td><td>${esc(s.ulasan)}</td></tr>`).join('')}</tbody></table>` : '') + ((x.isu || []).length ? `<p><strong>Isu untuk dibaiki:</strong></p><ol>${x.isu.map(i => `<li><strong>${esc(i.tahap)}:</strong> ${esc(i.perkara)} ${esc(i.cadangan)}</li>`).join('')}</ol>` : '') + ((x.tanpaSokongan || []).length ? `<p><strong>Dakwaan tanpa sokongan:</strong></p><ul>${x.tanpaSokongan.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''); }
    return kepala + (rec.soalan ? `<p><strong>Soalan: ${esc(rec.soalan)}</strong></p>` : '') + htmlCadangan(rec.jawapan) + kaki;
  }

  /* ---- folder Rujukan: senarai dijana daripada sitasi, semakan dua hala ---- */
  function dataRujukan(f) {
    const tl = tulis().filter(x => x.p !== 'rujukan'); const peta = new Map(); const luar = new Map();
    tl.forEach(x => { cariSitasi(teksFolder(x)).forEach(s => { if (s.id) { if (!peta.has(s.id)) peta.set(s.id, new Set()); peta.get(s.id).add(tajukF(x)); } else { if (!luar.has(s.kunci)) luar.set(s.kunci, { nama: s.nama, di: new Set() }); luar.get(s.kunci).di.add(tajukF(x)); } }); });
    const ix = indeks(); const d = C.doc(); const sumber = C.sumberAda(d); const disitasi = Array.from(peta.keys()).map(id => ix.find(x => x.id === id)).filter(Boolean);
    const adaApa = disitasi.filter(x => x.rujukan).sort((a, b) => a.rujukan.localeCompare(b.rujukan, 'ms', { sensitivity: 'base' })); const tiadaApa = disitasi.filter(x => !x.rujukan);
    const belum = sumber.filter(id => !peta.has(id)).map(id => ix.find(x => x.id === id) || { id, nama: Bd().nama(Bd().rekod(id)) });
    /* entri dalam ASAL folder Rujukan yang tidak disitasi di mana-mana */
    const entri = urai(f).per.filter(p => /(19|20)\d{2}/.test(p) && p.length > 30); const semuaSit = new Set(); tl.forEach(x => cariSitasi(teksFolder(x)).forEach(s => semuaSit.add(s.kunci)));
    const yatim = entri.filter(p => { const m = /^([\p{L}'’-]+)[^()]{0,200}\(((?:19|20)\d{2})/u.exec(p); if (!m) return false; const nm = kataKunci(m[1]); const th = m[2]; const rec = ix.find(x => x.tahun === th && x.tok.includes(nm)); return rec ? !semuaSit.has(rec.id) : !semuaSit.has(nm + th); });
    return { peta, adaApa, tiadaApa, belum, luar: Array.from(luar.values()), yatim, nEntri: entri.length };
  }
  function htmlRujukan(f) {
    const x = dataRujukan(f); const li = (arr, fn) => arr.map(fn).join('');
    return `<div class="pd-ruj"><div class="pd-meter-grid">
      <div class="pd-meter ${x.adaApa.length ? 'ok' : 'info'}"><div class="h"><b>Disitasi dan ada rujukan APA</b><span>${x.adaApa.length} sumber</span></div><ul>${li(x.adaApa, r => `<li>${esc(r.rujukan)} <em>(disitasi dalam: ${esc(Array.from(x.peta.get(r.id)).join(', '))})</em></li>`) || '<li>Belum ada sitasi yang dikenali dalam ASAL.</li>'}</ul></div>
      <div class="pd-meter ${x.tiadaApa.length ? 'gagal' : 'ok'}"><div class="h"><b>Disitasi tetapi medan Rujukan APA 7 kosong</b><span>${x.tiadaApa.length}</span></div><ul>${li(x.tiadaApa, r => `<li>${esc(r.nama)} <button class="btn btn-sm" data-bukarekod="${esc(r.id)}">Buka rekod</button></li>`) || '<li>Tiada.</li>'}</ul></div>
      <div class="pd-meter ${x.belum.length ? 'amaran' : 'ok'}"><div class="h"><b>Artikel sumber yang belum disitasi di mana-mana</b><span>${x.belum.length}</span></div><ul>${li(x.belum, r => `<li>${esc(r.nama)}</li>`) || '<li>Semua artikel sumber sudah disitasi.</li>'}</ul>${x.belum.length ? '<div class="nota">Sitasi artikel ini dalam folder yang sesuai, atau buang daripada senarai sumber jika tidak digunakan.</div>' : ''}</div>
      <div class="pd-meter ${x.luar.length ? 'amaran' : 'ok'}"><div class="h"><b>Sitasi yang tidak ditemui dalam repositori</b><span>${x.luar.length}</span></div><ul>${li(x.luar, r => `<li>${esc(r.nama)} <em>(${esc(Array.from(r.di).join(', '))})</em></li>`) || '<li>Tiada.</li>'}</ul>${x.luar.length ? '<div class="nota">Sahkan setiap sumber ini benar-benar wujud dan taip entri rujukannya sendiri; sistem tidak mereka rujukan.</div>' : ''}</div>
      ${x.nEntri ? `<div class="pd-meter ${x.yatim.length ? 'gagal' : 'ok'}"><div class="h"><b>Entri dalam senarai rujukan yang tidak disitasi dalam teks</b><span>${x.yatim.length} daripada ${x.nEntri}</span></div><ul>${li(x.yatim, p => `<li>${esc(potong(p, 160))}</li>`) || '<li>Setiap entri disitasi dalam teks.</li>'}</ul></div>` : ''}
    </div><div class="pd-acts"><button class="btn btn-primary" data-pd="rujram"${x.adaApa.length ? '' : ' disabled'}>Masukkan senarai rujukan (${x.adaApa.length}) ke RAM folder ini</button><button class="btn btn-sm" data-pd="segar">Kira semula</button><span class="help">Senarai disusun mengikut abjad daripada medan Rujukan APA 7 setiap rekod yang disitasi. Semak format mengikut jurnal sasaran sebelum dipindahkan ke ASAL.</span></div></div>`;
  }

  /* ---- sediakan folder: padankan atau cipta seksyen mengikut struktur piawai ---- */
  /* Bedah artikel contoh sendiri: agen membaca teks penuh satu artikel repositori dan memulangkan acuan dalam bentuk yang sama dengan acuan terbina. */
  async function bedah() {
    if (P.busy) return; const d = C.doc(); if (!d || !d.jenis) { toast('Pilih jenis artikel dahulu', true); return; } const k = kel(); if (k === 'umum' && !D.NAMA_KELUARGA[k]) { /* tetap dibenarkan */ }
    const t = await R.Isi.tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const adaPdf = Array.from(R.S.docs.entries()).filter(([, r]) => (r.fail || []).length).map(([id]) => id); if (!adaPdf.length) { toast('Tiada rekod yang mempunyai PDF dalam repositori. Muat naik PDF artikel contoh dahulu.', true); return; }
    const semua = Array.from(R.S.docs.keys()); const tanpa = semua.filter(id => !adaPdf.includes(id)); const lama = acuanSendiri(k);
    const pilihan = R.Kumpulan ? R.Kumpulan.pilihanHtml({ pilih: lama && lama.rekod, lumpuh: tanpa }) : adaPdf.map(id => { const r = Bd().rekod(id); return `<option value="${esc(id)}">Bil. ${esc(r.bil || '?')} · ${esc(Bd().nama(r))} · ${esc(String(r.tajuk || '').slice(0, 90))}</option>`; }).join('');
    const ok = await R.richModal('Bedah artikel contoh sendiri', `<p>Pilih satu artikel dalam repositori yang mahu dijadikan acuan bagi artikel jenis <b>${esc(D.NAMA_KELUARGA[k] || 'ini')}</b>. Pilih artikel yang jenisnya sama dengan artikel yang sedang ditulis dan yang penulisannya Prof Dr kagumi, termasuk artikel jurnal MyCite berbahasa Melayu.</p>
      <label class="pd-q"><span>Artikel contoh (rekod yang mempunyai PDF)</span><select id="pdBedahRekod"><option value="">Pilih artikel</option>${pilihan}</select></label>
      <p class="help">Agen membaca teks penuh PDF itu sekali dan memulangkan: bahagian dan subtajuk, nisbah panjang, peta perenggan (fungsi dan cara dibina), serta nasihat penyesuaian. Tiada ayat artikel disalin. Satu panggilan API yang besar (teks penuh artikel dihantar); amaran kos dipaparkan sebelum dihantar.${lama && lama.acuan ? ' Bedahan sedia ada bagi jenis ini (' + esc(lama.acuan.pendek || '') + ') akan diganti.' : ''}</p>`, 'Teruskan', 'Batal');
    if (!ok) return; const id = (R.richModal.values || {}).pdBedahRekod; if (!id || !R.S.docs.has(id)) { toast('Pilih artikel dahulu', true); return; } const r = Bd().rekod(id);
    P.busy = { k: null, mod: 'bedah' }; render();
    try {
      let art; try { art = await R.Isi.bacaArtikel(id, st => toast('Bedah artikel: ' + st)); } catch (e) { toast('PDF artikel tidak dapat dibaca: ' + R.Isi.msg(e), true); return; }
      let teks = String(art.text || ''); if (teks.replace(/\s+/g, ' ').length < 4000) { toast('Teks PDF ini terlalu sedikit untuk dibedah (mungkin imbasan). Pilih artikel yang PDF-nya mempunyai teks.', true); return; }
      const iR = Math.max(teks.lastIndexOf('\nReferences'), teks.lastIndexOf('\nREFERENCES'), teks.lastIndexOf('\nRujukan'), teks.lastIndexOf('\nRUJUKAN')); const nRuj = iR > teks.length * 0.5 ? (teks.slice(iR).match(/\b(?:19|20)\d{2}[a-z]?\b/g) || []).length : 0; if (iR > teks.length * 0.5) teks = teks.slice(0, iR) + '\n[Senarai rujukan dibuang; kira-kira ' + nRuj + ' sebutan tahun di dalamnya.]';
      teks = potong(teks, 150000);
      const system = `Anda ialah penganalisis retorik artikel jurnal. Tugas anda: membedah SATU artikel contoh supaya struktur dan cara penulisannya boleh dijadikan acuan oleh seorang calon PhD yang menulis artikel jenis yang sama untuk ${arasTeks()}. Tulis semua huraian dalam Bahasa Melayu Malaysia baku dengan kata-kata sendiri. JANGAN menyalin ayat artikel; penanda wacana pendek (contohnya First, However, Therefore) boleh disebut. Jangan gunakan sempang em atau en. Kira perenggan, patah perkataan dan sitasi sebaik mungkin daripada teks; penanda [m.s. N] ialah nombor muka surat dan bukan sebahagian artikel. Jangan mereka kandungan yang tiada dalam teks.

${PIAWAI_RINGKAS}`;
      const tugas = `[MOD:bedah]\nKELUARGA JENIS ARTIKEL YANG SEDANG DITULIS OLEH PEMILIK: ${D.NAMA_KELUARGA[k] || k}\nREKOD REPOSITORI: ${Bd().nama(r)}. ${r.tajuk || ''}\n\nPERANAN BAHAGIAN YANG DIBENARKAN (medan p): pendahuluan (termasuk tujuan dan soalan), literatur (sorotan, teori, hipotesis), kaedah, dapatan, perbincangan (termasuk implikasi dan batasan jika tiada bahagian sendiri), kesimpulan, kerangka (cadangan kerangka atau model dalam kertas konsep), badan (bahagian bertema dalam ulasan naratif).\nKOD GERAKAN (medan g): ${Object.keys(POLA).map(g => g + ' = ' + POLA[g].nama).join('; ')}.\n\nTUGAS: Bedah artikel di bawah dan pulangkan JSON mengikut skema. Ikut urutan bahagian artikel. Bagi Pendahuluan, Metodologi dan Perbincangan, petakan perenggan demi perenggan; bagi bahagian lain, perenggan yang memikul fungsi sama boleh dikumpulkan dengan n lebih daripada 1. Dalam medan cara, terangkan BAGAIMANA perenggan itu dibina supaya boleh ditiru (bilangan ayat, peranan ayat pertama, susunan bukti, penanda wacana, cara dan bilangan sitasi), bukan apa kandungannya.\n\nTEKS PENUH ARTIKEL (${art.pages || '?'} muka surat):\n\"\"\"\n${teks}\n\"\"\"`;
      const anggaran = anggarToken(system) + anggarToken(tugas); const tk = P.t.token || { masuk: 0, keluar: 0, panggil: 0 }; const nBedah = patah(teks); const bj = bajet('bedah', nBedah);
      const ok2 = await R.confirmBox('Bedah artikel contoh: hantar kepada agen?', `Teks penuh "${Bd().nama(r)}" (${angka(nBedah)} patah perkataan) dihantar ke API Anthropic menggunakan kunci API Prof Dr (anggaran ${angka(anggaran)} token masuk; ${teksHad(bj, 'mengikut panjang artikel contoh')}; model ${t.model.replace('claude-', '')}). Kosnya dicaj kepada akaun Anthropic Prof Dr.${SILING} Setakat ini artikel ini: ${tk.panggil || 0} panggilan, token masuk ${angka(tk.masuk)}, keluar ${angka(tk.keluar)}.`, 'Hantar kepada agen', false);
      if (!ok2) return;
      const res = await R.Isi.hantar(t, { kunciMod: 'pandu-bedah:' + t.model, system, content: [{ type: 'text', text: tugas }], skema: SKEMA.bedah, alat: alat('bedah'), hadToken: bj });
      let data; try { data = dalamBersih(res.input || R.Isi.parseJson(res.text, res.stop)); } catch (e) { if (e && typeof e === 'object') e.usage = res.usage; throw e; } const masa = sekarang(); const ac = kemasAcuan(data);
      if (!ac) throw { code: 'json', stop: res.stop, usage: res.usage };
      ac.id = 'sendiri-' + id + '-' + masa.toString(36); ac.kel = k; ac.pendek = ac.pendek || Bd().nama(r); ac.tajuk = ac.tajuk || r.tajuk || ''; ac.rujukan = `${Bd().nama(r)}. ${r.tajuk || ac.tajuk}${ac.jurnal ? '. ' + ac.jurnal : ''}.`; ac.doi = String(r.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''); ac.lesen = ''; ac.sebab = 'Dipilih oleh Prof Dr daripada repositori sebagai artikel contoh bagi jenis ini.'; ac.ukuran.abstrak = (ac.abstrak && ac.abstrak.kata) || 0; ac.ukuran.rujukan = nRuj ? Math.round(nRuj / 1.15) : 0; ac.ukuran.jadual = ac.bahagian.reduce((x, b) => x + b.jadual, 0); ac.ukuran.rajah = ac.bahagian.reduce((x, b) => x + b.rajah, 0);
      const rekodAc = { v: 1, kel: k, masa, rekod: id, model: t.model, acuan: ac }; P.ac[k] = rekodAc; R.lsSet(lsAc(k), rekodAc); try { await R.db().set(kunciAc(k), rekodAc); } catch (e) { console.warn('pandu: acuan awan gagal', e); }
      P.t.token = { masuk: (tk.masuk || 0) + (res.usage ? res.usage.masuk + (res.usage.cacheBaca || 0) + (res.usage.cacheTulis || 0) : 0), keluar: (tk.keluar || 0) + (res.usage ? res.usage.keluar : 0), panggil: (tk.panggil || 0) + 1, gagal: tk.gagal || 0 };
      P.t.acuan = 'sendiri'; P.terbuka.add('acuanInduk'); P.cache = {}; simpanT(true);
      toast(`Acuan siap dibedah daripada ${ac.pendek}: ${ac.bahagian.length} bahagian, ${ac.bahagian.reduce((x, b) => x + b.peta.length, 0)} entri peta perenggan${res.stop === 'max_tokens' ? '. Jawapan mencapai had token dan mungkin tidak lengkap.' : ''}${P.t.sedia ? '. Klik Kemas kini folder jika notis muncul.' : ''}`);
    } catch (e) { catatGagal(e); toast('Bedah artikel gagal: ' + R.Isi.msg(e), true); }
    finally { P.busy = null; render(); }
  }
  async function sediakan() {
    const d = C.doc(); if (!d || !d.jenis) { toast('Pilih jenis artikel dahulu', true); return; } const fs = folders(); const s = C.sumberAda(d); const belum = s.filter(id => !Bd().kelengkapan(Bd().rekod(id)).ok); const amaran = [];
    if (!P.t.sedia) {
      if (!s.length) amaran.push('Belum ada artikel sumber dipilih. Agen menjawab berdasarkan artikel sumber; tanpa sumber, soal jawab dan cadangan tidak berpijak pada bukti.'); else if (s.length < 5) amaran.push(`Hanya ${s.length} artikel sumber dipilih. Artikel jurnal lazimnya memerlukan asas bukti yang lebih luas.`);
      if (belum.length) amaran.push(`${belum.length} artikel sumber belum lengkap Bahagian A hingga F (${belum.map(id => 'Bil. ' + (Bd().rekod(id).bil || '?')).join(', ')}); agen hanya berpijak pada medan yang diisi.`);
      if (!(P.t.pemboleh || []).some(v => v.nama)) amaran.push('Pemboleh ubah atau konstruk utama belum ditetapkan; meter liputan pemboleh ubah tidak berfungsi sehingga ditetapkan.');
      if (amaran.length) { const ok = await R.richModal('Semakan sebelum menyediakan folder', `<ul class="pd-amaran-senarai">${amaran.map(a => `<li>${esc(a)}</li>`).join('')}</ul><p class="help">Prof Dr boleh meneruskan dan melengkapkannya kemudian; meter dan amaran dalam setiap folder akan terus mengingatkan.</p>`, 'Teruskan juga', 'Kembali'); if (!ok) return; }
    }
    Teks.flushEditor(); const ix = en() ? 1 : 0; const lama = Teks.senarai(A.id); const nb = Teks.nombor(A.id); const peta = {}; const baru = {}; const blok = {}; const now = sekarang(); let cipta = 0, padan = 0;
    fs.forEach(f => { const id = (P.t.peta || {})[f.k]; if (id && d.seksyen[id] && !d.seksyen[id].padam) peta[f.k] = id; }); const guna = new Set(Object.values(peta));
    fs.forEach(f => { if (peta[f.k]) return; const id = lama.find(x => !guna.has(x) && (nb[x] || {}).aras === 1 && D.perananTajuk(d.seksyen[x].tajuk) === f.p); if (id) { peta[f.k] = id; guna.add(id); padan++; } });
    fs.forEach(f => { if (peta[f.k]) return; const id = idBaru('s'); d.seksyen[id] = { tajuk: f.t[ix], teks: '', cipta: now, masa: now, patah: 0, aras: 1, sumber: { jenis: 'templat' } }; baru[id] = 1; peta[f.k] = id; blok[f.k] = [id]; cipta++; f.sub.forEach(st => { const sid = idBaru('s'); d.seksyen[sid] = { tajuk: st[ix], teks: '', cipta: now, masa: now, patah: 0, aras: 2, sumber: { jenis: 'templat' } }; baru[sid] = 1; blok[f.k].push(sid); cipta++; }); });
    const dipeta = new Set(Object.values(peta)); const susun = []; const masuk = new Set(); const tambah = x => { if (!masuk.has(x)) { susun.push(x); masuk.add(x); } };
    const julatLama = id => { const i = lama.indexOf(id); const out = [id]; const asas = (nb[id] || { aras: 1 }).aras; for (let j = i + 1; j < lama.length; j++) { if ((nb[lama[j]] || { aras: 1 }).aras <= asas) break; out.push(lama[j]); } return out; };
    fs.forEach(f => { const id = peta[f.k]; if (blok[f.k]) { blok[f.k].forEach(tambah); return; } const ids = julatLama(id); ids.forEach(tambah); const i = lama.indexOf(ids[ids.length - 1]); for (let j = i + 1; j < lama.length; j++) { if (dipeta.has(lama[j])) break; tambah(lama[j]); } });
    lama.forEach(tambah);
    d.susunan = susun.concat(Object.keys(d.seksyen).filter(x => !masuk.has(x))); d.masa = now; Teks.simpanLokal(A.id, d); const patch = { seksyen: {}, susunan: d.susunan, masa: d.masa }; Object.keys(baru).forEach(id => { patch.seksyen[id] = d.seksyen[id]; }); Teks.simpanAwan(A.id, patch);
    const pertama = !P.t.sedia; P.t.peta = peta; P.t.sedia = true; simpanT(true); Teks.renderSemua();
    toast(`Folder disediakan: ${fs.length} folder${cipta ? ', ' + cipta + ' seksyen baharu dicipta' : ''}${padan ? ', ' + padan + ' seksyen sedia ada dipadankan' : ''}. Mulakan dengan folder pertama.`);
    if (pertama || !folderDari(P.buka)) bukaFolder(D.urutanTulis(fs)[0].k); else render();
  }
  async function bukaFolder(k, o) {
    const f = folderDari(k); if (!f) return; o = o || {};
    if (f.p === 'abstrak' && P.buka !== k) { const belum = tulis().filter(x => x.p !== 'abstrak' && x.p !== 'rujukan' && !((P.t.status || {})[x.k] || {}).siap); if (belum.length) { const ok = await R.richModal('Abstrak ditulis paling akhir', `<p>Abstrak merumuskan manuskrip yang sudah siap. ${belum.length} folder belum ditandakan siap:</p><ul>${belum.map(x => `<li>${esc(tajukF(x))}</li>`).join('')}</ul><p class="help">Jika abstrak ditulis sekarang, ia perlu ditulis semula apabila folder lain berubah.</p>`, 'Buka Abstrak juga', 'Kembali'); if (!ok) return; } }
    P.buka = k; R.lsSet('rslr_pandu_buka_' + P.id, k); P.terbuka = new Set(langkahLalai(f)); if (o.l) P.terbuka.add(o.l);
    const sid = sidFolder(f); if (sid && !(Teks.state.bab === A.id && julat(f).includes(Teks.state.sek))) { Teks.flushEditor(); Teks.state.sek = sid; Teks.renderSenarai(); Teks.renderEditor(); }
    render(); if (o.tatal) { const el = $('#pdFolder'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  }
  async function tandaSiap(k) {
    const f = folderDari(k); if (!f) return; P.t.status = P.t.status || {}; const st = P.t.status[k] || {};
    if (st.siap) { P.t.status[k] = { siap: false, masa: sekarang() }; simpanT(true); render(); toast('Folder dibuka semula'); return; }
    const uk = ukur(f); const F = fd(k); const isu = uk.isu.slice(); const tambahan = [];
    if (f.p !== 'rujukan' && !(F.semak && F.semak.data)) tambahan.push('Semakan agen belum dijalankan bagi folder ini.'); else if (F.semak && F.semak.data && /perlu pembaikan/i.test(F.semak.data.keputusan || '') && F.semak.patah === uk.n) tambahan.push('Semakan agen terakhir memutuskan "Perlu pembaikan" dan ASAL belum berubah sejak itu.');
    if (isu.length || tambahan.length) {
      const ok = await R.richModal('Semakan sistem sebelum folder ditandakan siap', `<p><b>${esc(tajukF(f))}</b>: ${isu.filter(x => x.status === 'gagal').length} perkara gagal dan ${isu.filter(x => x.status === 'amaran').length} amaran.</p><div class="pd-meter-grid satu">${isu.map(htmlMeter).join('')}</div>${tambahan.length ? `<ul class="pd-amaran-senarai">${tambahan.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}<p class="help">Folder yang ditandakan siap masih boleh dibuka semula dan disunting.</p>`, 'Tanda siap juga', 'Kembali membaiki');
      if (!ok) { P.terbuka.add('L5'); renderFolder(); return; }
    }
    P.t.status[k] = { siap: true, masa: sekarang(), sedia: uk.sedia }; simpanT(true); const tl = tulis(); const i = tl.findIndex(x => x.k === k); const seterus = tl[i + 1];
    toast(`Folder ${tajukF(f)} ditandakan siap${seterus ? '. Seterusnya: ' + tajukF(seterus) : ''}`, false, seterus ? { label: 'Buka ' + tajukF(seterus), fn: () => bukaFolder(seterus.k, { tatal: true }) } : undefined); render();
  }

  /* ---- tetapan: pemboleh ubah, peraturan gaya, cara guna ---- */
  function cadangPemboleh() {
    const d = C.doc(); const kira = new Map(); C.sumberAda(d).forEach(id => { const r = Bd().rekod(id); String(r.konstruk || '').split(/[;\n]/).forEach(b => { const nm = b.split(/[(:–-]/)[0].replace(/\b(bebas|perantara|bersandar|penyederhana|kawalan)\b/gi, '').trim(); if (nm.length >= 4 && nm.length <= 60 && patah(nm) <= 6) { const kk = bersih(nm); kira.set(kk, { nama: nm, n: ((kira.get(kk) || {}).n || 0) + 1 }); } }); });
    return Array.from(kira.values()).sort((a, b) => b.n - a.n).slice(0, 8).map(x => x.nama + (x.n > 1 ? ' (' + x.n + ' artikel)' : ''));
  }
  async function modalPemboleh() {
    const cad = cadangPemboleh(); const teks = (P.t.pemboleh || []).map(v => v.nama + (v.alias ? ' | ' + v.alias : '')).join('\n');
    const ok = await R.richModal('Pemboleh ubah atau konstruk utama artikel', `<p>Satu baris bagi setiap pemboleh ubah. Selepas tanda | tulis padanan lain yang dikira sebagai sebutan yang sama (istilah Inggeris, singkatan), dipisahkan dengan koma.</p><textarea id="pdPvTeks" class="modal-in" rows="6" placeholder="Pengurusan pengetahuan digital | digital knowledge management, DKM&#10;Kepimpinan digital | digital leadership">${esc(teks)}</textarea>${cad.length ? `<p class="help">Cadangan daripada medan konstruk artikel sumber (taip yang berkenaan): ${esc(cad.join('; '))}.</p>` : ''}<p class="help">Meter "Pemboleh ubah" dalam setiap folder menyemak sama ada setiap pemboleh ubah ini disebut. Pendahuluan, Kajian Literatur, Perbincangan, Kesimpulan dan Abstrak mesti mencerminkan kesemuanya.</p>`, 'Simpan', 'Batal');
    if (!ok) return; P.t.pemboleh = String(R.richModal.values.pdPvTeks || '').split('\n').map(l => { const [nama, ...al] = l.split('|'); return { nama: (nama || '').trim(), alias: al.join(',').trim() }; }).filter(x => x.nama).slice(0, 12); simpanT(true); render(); if (C.onTetapan) C.onTetapan('pemboleh'); toast(P.t.pemboleh.length + ' pemboleh ubah disimpan');
  }
  async function modalGaya() {
    const g = gaya();
    const ok = await R.richModal('Peraturan gaya Prof Dr', `<p class="help">Peraturan ini digunakan oleh meter Gaya dalam setiap folder dan dihantar kepada agen sebagai arahan gaya. Ia terpakai kepada semua artikel.</p><label for="pdGLarang">Istilah yang dilarang (dipisahkan dengan koma)</label><textarea id="pdGLarang" class="modal-in" rows="3">${esc(g.larang)}</textarea><label for="pdGFrasa">Frasa yang dielakkan (dipisahkan dengan titik koma)</label><textarea id="pdGFrasa" class="modal-in" rows="3">${esc(g.frasa)}</textarea><label for="pdGPembuka">Pembuka soalan kajian yang dielakkan (dipisahkan dengan titik koma)</label><input id="pdGPembuka" class="modal-in" type="text" value="${esc(g.pembuka)}"><div class="tul-jd-form"><label>Umur rujukan maksimum (tahun) <input id="pdGTahun" class="modal-in" type="number" min="1" max="30" value="${esc(g.hadTahun)}"></label><label>Pangkalan data maksimum bagi ulasan skop <input id="pdGPangkalan" class="modal-in" type="number" min="1" max="12" value="${esc(g.hadPangkalan)}"></label></div><label for="pdGArahan">Arahan gaya tambahan kepada agen</label><textarea id="pdGArahan" class="modal-in" rows="6">${esc(g.arahan)}</textarea><label class="tul-cb"><input id="pdGLalai" type="checkbox"> Pulihkan semua kepada peraturan lalai</label>`, 'Simpan', 'Batal');
    if (!ok) return; const v = R.richModal.values;
    const baru = v.pdGLalai ? Object.assign({}, D.GAYA_LALAI) : { larang: String(v.pdGLarang || '').trim(), frasa: String(v.pdGFrasa || '').trim(), pembuka: String(v.pdGPembuka || '').trim(), hadTahun: Math.max(1, parseInt(v.pdGTahun, 10) || 5), hadPangkalan: Math.max(1, parseInt(v.pdGPangkalan, 10) || 2), arahan: String(v.pdGArahan || '').trim() };
    baru.masa = sekarang(); P.gaya = Object.assign({}, D.GAYA_LALAI, baru); R.lsSet(LS_GAYA, baru); try { await R.db().set(KUNCI_GAYA, baru); } catch (e) {} render(); toast('Peraturan gaya disimpan');
  }
  function modalCara() {
    R.richModal('Cara guna Pandu Tulis', `<ol class="pd-tip"><li><b>Lengkapkan bahan.</b> Pilih artikel sumber (tiada had bilangan; lebih banyak artikel memerlukan lebih banyak token) dan pastikan Bahagian A hingga F setiap rekod lengkap; pilih jenis artikel, bahasa manuskrip dan tetapkan pemboleh ubah.</li><li><b>Acuan artikel contoh.</b> Bagi setiap jenis artikel, satu artikel sebenar yang sudah diterbitkan telah dibedah bahagian demi bahagian dan perenggan demi perenggan. Folder, subseksyen, sasaran panjang dan bimbingan agen mengikut acuan itu. Klik Lihat acuan untuk rujukan dan ukurannya; dalam setiap folder, bahagian A menunjukkan peta perenggan (fungsi, cara dibina, panjang, sitasi) dan pola ayat. Prof Dr boleh menukar kepada bedahan sendiri (Bedah artikel contoh sendiri, contohnya artikel jurnal MyCite berbahasa Melayu) atau mematikan acuan. Acuan menunjukkan struktur, bukan ayat untuk disalin.</li><li><b>Sediakan folder.</b> Sistem menyediakan satu folder bagi setiap bahagian artikel mengikut acuan atau, tanpa acuan, mengikut jenisnya. Artikel ulasan mendapat Ruang PRISMA dalam folder Metodologi; artikel empirikal mendapat Ruang Output SPSS dan AMOS dalam folder Dapatan.</li><li><b>Bagi setiap folder, ikut lima langkah:</b> (1) pilih artikel panduan utama dan sekunder; (2) jawab soalan panduan dan bincang dengan agen tentang apa yang patut masuk; (3) minta cadangan penulisan; (4) tulis ASAL dengan ayat sendiri berpandukan RAM; (5) semak meter dan Semakan agen, kemudian tandakan siap.</li><li><b>RAM dan ASAL.</b> Setiap jawapan agen masuk ke RAM seksyen. ASAL ditulis oleh Prof Dr sahaja; meter Parafrasa memberi amaran jika ASAL terlalu hampir dengan teks agen.</li><li><b>Failsafe.</b> Meter Panjang, Pemboleh ubah, Sitasi, Padanan acuan, Gerakan retorik, Parafrasa dan Gaya dikira semasa menaip dan dipaparkan di atas editor; amaran muncul sebelum folder ditandakan siap.</li><li><b>Abstrak paling akhir.</b> Agen menulis cadangan abstrak daripada ASAL folder lain, bukan daripada artikel sumber. Folder Rujukan menjana senarai daripada sitasi dan menyemak dua hala.</li><li><b>Kos.</b> Setiap panggilan agen memaparkan anggaran token dahulu dan dicaj kepada akaun Anthropic Prof Dr. Model dipilih dalam Tetapan; model Opus paling teliti dengan kos tertinggi.</li></ol>`, 'Faham');
  }

  /* ---- peristiwa ---- */
  const root = $('#artPandu');
  if (root) {
    root.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.pdid) { if (d.open) P.terbuka.add(d.dataset.pdid); else P.terbuka.delete(d.dataset.pdid); } }, true);
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-pd]'); if (!b || b.disabled) return; const a = b.dataset.pd; const k = P.buka; if (b.tagName === 'BUTTON') e.preventDefault();
      if (a === 'sedia') sediakan(); else if (a === 'pemboleh') modalPemboleh(); else if (a === 'gaya') modalGaya(); else if (a === 'cara') modalCara();
      else if (a === 'bedah') bedah();
      else if (a === 'acuanlihat') { if (P.terbuka.has('acuanInduk')) P.terbuka.delete('acuanInduk'); else P.terbuka.add('acuanInduk'); render(); const x = root.querySelector('[data-pdid="acuanInduk"]'); if (x && x.open) x.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      else if (a === 'sasaranauto') { P.t.sasaranAuto = true; simpanT(true); P.cache = {}; render(); toast('Sasaran panjang kembali mengikut saiz artikel contoh: ' + angka(jumlahSasaran()) + ' patah perkataan'); }
      else if (a === 'buka') bukaFolder(b.dataset.k, { tatal: !!b.closest('.pd-fh') });
      else if (a === 'editor') { const f = folderDari(k); const sid = f && sidFolder(f); if (!sid) return; if (!(Teks.state.bab === A.id && julat(f).includes(Teks.state.sek))) { Teks.flushEditor(); Teks.state.sek = sid; Teks.renderSenarai(); Teks.renderEditor(); } const ed = $('#artEditor'); if (ed) ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      else if (a === 'pilih') { const F = fd(k); const id = b.dataset.id; const jenis = b.dataset.jenis; const lain = jenis === 'utama' ? 'sekunder' : 'utama'; const ada = (F[jenis] || []).includes(id); F[jenis] = (F[jenis] || []).filter(x => x !== id); F[lain] = (F[lain] || []).filter(x => x !== id); if (!ada) { if (jenis === 'utama' && F.utama.length >= HAD_UTAMA) { toast(`Maksimum ${HAD_UTAMA} artikel panduan utama bagi satu folder; selebihnya jadikan sekunder supaya hujah kekal fokus dan kos terkawal.`, true); F.sekunder.push(id); } else F[jenis].push(id); } simpanF(k); P.terbuka.add('L1'); renderFolder(); kemasBar(); }
      else if (a === 'agen') agen(k, b.dataset.mod); else if (a === 'menyeluruh') agen(null, 'menyeluruh');
      else if (a === 'segar') { P.cache = {}; render(); toast('Meter dikira semula'); }
      else if (a === 'siap') tandaSiap(k);
      else if (a === 'dnasel') { DNA.kitarSel(P.t, b.dataset.id, b.dataset.el); simpanT(); P.cache = {}; P.terbuka.add('LJ'); renderFolder(); kemasBar(); }
      else if (a === 'dnaauto') { const okk = await R.confirmBox('Kembalikan Matriks Ketinggalan?', 'Semua sel yang Prof Dr pinda dalam Matriks Ketinggalan dikembalikan kepada anggaran automatik daripada medan rekod. Rekod artikel tidak disentuh.', 'Kembalikan'); if (!okk) return; P.t.dna = DNA.tetapan(P.t); P.t.dna.matriks = {}; simpanT(true); P.cache = {}; P.terbuka.add('LJ'); renderFolder(); kemasBar(); toast('Matriks Ketinggalan dikembalikan kepada anggaran automatik'); }
      else if (a === 'logram') { const F = fd(k); const x = (F.log || []).find(y => y.id === b.dataset.id); const f = folderDari(k); if (x && penuh(x) && f && sisip(sasaranRam(f), 'ram', htmlRam(x, specF(f)))) toast('Dimasukkan ke RAM seksyen'); else toast('Teks entri ini belum dimuatkan daripada awan; cuba sebentar lagi', true); }
      else if (a === 'logpadam') { const F = fd(k); const okk = await R.confirmBox('Padam daripada sejarah agen?', 'Entri ini dipadam daripada sejarah folder (salinan dalam RAM, jika ada, tidak disentuh). Meter Parafrasa tidak lagi membandingkan ASAL dengan teks ini.', 'Padam'); if (!okk) return; F.log = (F.log || []).filter(y => y.id !== b.dataset.id); F.padamLog = (F.padamLog || []).concat([b.dataset.id]); simpanF(k, true); renderFolder(); }
      else if (a === 'rujram') { const f = folderDari(k); const x = dataRujukan(f); if (!x.adaApa.length) return; const html = `<p><strong>[Senarai rujukan dijana daripada ${x.adaApa.length} sumber yang disitasi · ${esc(R.fmtTime(sekarang()))}]</strong></p>` + x.adaApa.map(r => `<p>${esc(r.rujukan)}</p>`).join(''); if (sisip(sasaranRam(f), 'ram', html)) toast(`${x.adaApa.length} entri rujukan dimasukkan ke RAM folder Rujukan; semak format, kemudian pindahkan ke ASAL`); }
    });
    root.addEventListener('input', e => {
      const el = e.target; const jenis = el.dataset && el.dataset.pdin; if (!jenis) return; const k = P.buka;
      if (jenis === 'sasaran') { const v = parseInt(el.value, 10); if (v >= 1000 && v <= 30000) { P.t.sasaran = v; P.t.sasaranAuto = false; simpanT(); clearTimeout(P.timers.sas); P.timers.sas = setTimeout(() => { if (document.activeElement !== el) render(); else { kemasBar(); } }, 900); } return; }
      if (jenis === 'dnanegara' || jenis === 'dnapaksi') { P.t.dna = DNA.tetapan(P.t); P.t.dna[jenis === 'dnanegara' ? 'negara' : 'paksi'] = el.value; simpanT(); P.cache = {}; return; }
      if (!k) return; const F = fd(k);
      if (jenis === 'jawab') { F.jawab = F.jawab || {}; F.jawab[el.dataset.q] = el.value; } else if (jenis === 'balas') { const b = (F.balas || []).find(x => x.id === el.dataset.id); if (b) b.jawapan = el.value; } else if (jenis === 'tanya') F.tanya = el.value; else if (jenis === 'arahan') F.arahan = el.value; else return;
      simpanF(k);
    });
    root.addEventListener('change', e => {
      const el = e.target; const s = el.dataset && el.dataset.pdsel; if (!s) { if (el.dataset && (el.dataset.pdin === 'sasaran' || el.dataset.pdin === 'dnanegara' || el.dataset.pdin === 'dnapaksi')) { if (el.dataset.pdin !== 'sasaran') P.terbuka.add('LJ'); render(); } return; }
      if (s === 'dnamod' || s === 'dnaperingkat' || s === 'dnaperantara') { P.t.dna = DNA.tetapan(P.t); if (s === 'dnamod') P.t.dna.mod = ['auto', 'aktif', 'tiada'].includes(el.value) ? el.value : 'auto'; else if (s === 'dnaperingkat') P.t.dna.peringkat = el.value; else P.t.dna.perantara = !!el.checked; simpanT(true); P.cache = {}; P.terbuka.add('LJ'); render(); if (s === 'dnamod') toast(DNA.aktif(P.t, kel()) ? 'DNA jurang aktif bagi folder Pendahuluan: agen, meter dan pola ayat mengikut acuan pernyataan masalah ' + DNA.PENDEK + '.' : 'DNA jurang tidak aktif bagi artikel ini.'); return; }
      if (s === 'bahasa') { P.t.bahasa = el.value === 'en' ? 'en' : 'ms'; simpanT(true); render(); if (C.onTetapan) C.onTetapan('bahasa'); toast('Bahasa manuskrip: ' + namaBahasa() + '. Tajuk seksyen sedia ada tidak diubah; cadangan agen akan ditulis dalam bahasa ini.'); }
      else if (s === 'aras') { P.t.aras = el.value === 'scopus' ? 'scopus' : 'mycite'; simpanT(true); P.cache = {}; render(); if (C.onTetapan) C.onTetapan('aras'); toast('Jurnal sasaran: ' + (P.t.aras === 'scopus' ? 'berindeks Scopus atau WoS' : 'berindeks MyCite') + '. Agen menyemak mengikut piawaian ini.'); }
      else if (s === 'acuan') { P.t.acuan = ['bina', 'sendiri', 'tiada'].includes(el.value) ? el.value : 'bina'; simpanT(true); P.cache = {}; if (P.t.acuan !== 'tiada') P.terbuka.add('acuanInduk'); render(); const ac = acuan(); toast(ac ? `Acuan: ${ac.pendek}. Folder, sasaran dan bimbingan agen mengikut artikel contoh ini.${P.t.sedia ? ' Seksyen sedia ada dikekalkan; klik Kemas kini folder jika notis muncul.' : ''}` : 'Acuan dimatikan: struktur umum digunakan.'); }
      else if (s === 'peta') { const k = el.dataset.k; if (!el.value) return; P.t.peta = P.t.peta || {}; P.t.peta[k] = el.value; simpanT(true); P.cache = {}; bukaFolder(k); toast('Folder dipadankan dengan seksyen yang dipilih'); }
    });
  }
  const bar = $('#artPanduBar'); if (bar) bar.addEventListener('click', e => { const b = e.target.closest('[data-pd="buka"]'); if (!b) return; const w = $('#artPanduWrap'); if (w) w.open = true; bukaFolder(b.dataset.k, { l: b.dataset.l, tatal: true }); });
  const edRoot = $('#artEditor'); if (edRoot) edRoot.addEventListener('input', () => kemasHidup());

  /* ---- ruang kerja folder ---- */
  const X = { R, C, P, D, Teks, A, esc, toast, angka, patah, bersih, sekarang, idBaru, simpanT, gaya, en, namaBahasa, kel, folderDari, sidFolder, julat, sasaranRam, sisip, urai, renderFolder: () => renderFolder(), render: () => render(), kemasBar: () => kemasBar(), terbuka: () => P.terbuka };
  const Prisma = initPrisma(X); const Output = initOutput(X);

  function onEditor() { kemasBar(); }
  function onTulis() { kemasHidup(); }
  return { render, onEditor, onTulis, sediakan, bukaFolder, tandaSiap, agen, bedah, bajet, acuan, kemasAcuan, sasaran, jumlahSasaran, ukur, cariSitasi, folders, tulis, folderDari, sidFolder, julat, fd, gaya, cadangPemboleh, state: P, Prisma, Output, D, ACUAN, POLA };
}
