/* Rekod daripada fail CSV (v1.39.0; kunci stabil dan statistik sejak v1.40.0). Pemilik memuat naik fail .csv yang dieksport dari Scopus (atau pangkalan data lain dengan
   lajur yang serupa) ke dalam Pandu Tulis. Rekod itu menjadi sumber tambahan bagi artikel yang sedang ditulis, di samping artikel sumber
   daripada repositori. Sistem hanya memegang metadata dan abstrak yang ada dalam fail itu: tiada apa-apa ditambah, dianggar atau direka.
   Modul ini tulen (tiada DOM): mengurai CSV, memetakan lajur, membina label sitasi dan rujukan APA 7 daripada metadata. */
const BOM = String.fromCharCode(0xFEFF);
const SEMPANG = new RegExp('[' + String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015) + ']', 'g');   // sempang panjang dalam julat muka surat

/* Pengurai CSV mengikut RFC 4180: medan berpetik boleh mengandungi pemisah, baris baharu dan petikan berganda. Pemisah dikesan daripada
   baris kepala (koma, koma bertitik atau tab). */
export function uraiCsv(teks) {
  let s = String(teks || ''); if (s.startsWith(BOM)) s = s.slice(1); s = s.replace(/\r\n?/g, '\n');
  const kepala = s.split('\n', 1)[0] || ''; const kira = c => { let n = 0, q = false; for (const ch of kepala) { if (ch === '"') q = !q; else if (ch === c && !q) n++; } return n; };
  const pem = [',', ';', '\t'].map(c => [c, kira(c)]).sort((a, b) => b[1] - a[1])[0][0];
  const baris = []; let medan = ''; let rekod = []; let q = false; let i = 0; const n = s.length;
  while (i < n) { const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { medan += '"'; i += 2; continue; } q = false; i++; continue; } medan += ch; i++; continue; }
    if (ch === '"' && medan === '') { q = true; i++; continue; }
    if (ch === pem) { rekod.push(medan); medan = ''; i++; continue; }
    if (ch === '\n') { rekod.push(medan); medan = ''; if (rekod.some(x => x.trim() !== '')) baris.push(rekod); rekod = []; i++; continue; }
    medan += ch; i++; }
  rekod.push(medan); if (rekod.some(x => x.trim() !== '')) baris.push(rekod);
  return baris;
}

const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/* Lajur yang dikenali (Scopus dahulu; kemudian nama lazim eksport lain). */
const LAJUR = {
  a: ['authors', 'author', 'author s', 'au', 'pengarang', 'penulis', 'author full names'], t: ['title', 'article title', 'document title', 'ti', 'tajuk'], y: ['year', 'publication year', 'py', 'tahun'],
  s: ['source title', 'source', 'journal', 'publication name', 'publication title', 'so', 'jurnal'], v: ['volume', 'vl'], i: ['issue', 'is', 'number'], an: ['art no', 'article number', 'ar'], h1: ['page start', 'start page', 'bp'], h2: ['page end', 'end page', 'ep'], h: ['pages', 'page range'],
  d: ['doi', 'di'], ab: ['abstract', 'ab', 'abstrak'], kw: ['author keywords', 'keywords', 'de', 'kata kunci'], jt: ['document type', 'dt', 'type', 'jenis dokumen'], c: ['cited by', 'times cited', 'citations', 'tc'], u: ['link', 'url']
};
const sebaris = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
const doiBersih = d => { const m = /10\.\d{4,9}\/[^\s"<>]+/i.exec(String(d || '')); return m ? m[0].toLowerCase().replace(/[.,;)\]]+$/, '') : ''; };
export const normTajuk = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 110);

/* Pengarang Scopus: "Luthra, A.; Dixit, S." (eksport baharu) atau "Luthra A., Dixit S." (eksport lama). Pulangan: [{ k: nama keluarga, p: parap }]. */
export function pengarang(teks) {
  const s = sebaris(teks); if (!s || /^\[?no author/i.test(s)) return [];
  let bah; if (s.includes(';')) bah = s.split(';'); else if (/^[^,]+,\s*(?:[A-Z]\.?[\s-]*)+$/.test(s)) bah = [s]; else bah = s.split(',');
  const parap = p => p.replace(/\(.*?\)/g, ' ').split(/[\s.-]+/).filter(Boolean).map(x => x[0].toUpperCase() + '.').join(' ');
  return bah.map(x => sebaris(x)).filter(Boolean).map(x => { let k = x, p = '';
    if (x.includes(',')) { const z = x.split(','); k = sebaris(z[0]); p = sebaris(z.slice(1).join(' ')); }
    else { const m = /^(.*?)\s+((?:[A-Z]\.?-?\s*){1,5})$/.exec(x); if (m && m[1]) { k = sebaris(m[1]); p = sebaris(m[2]); } }
    return { k, p: parap(p) }; }).filter(o => o.k);
}
/* Label sitasi dalam teks: seorang, dua orang (dan atau and), tiga atau lebih (et al.). */
export function namaSitasi(r, en) { const a = r.pg || []; const y = r.y || 't.t.'; if (!a.length) return sebaris(r.t).slice(0, 40) + ' (' + y + ')'; return (a.length === 1 ? a[0].k : a.length === 2 ? `${a[0].k} ${en ? 'and' : 'dan'} ${a[1].k}` : `${a[0].k} et al.`) + ' (' + y + ')'; }
/* Rujukan APA 7 daripada metadata CSV (bentuk artikel jurnal). Julat muka surat ditulis dengan sempang biasa. */
export function apaCsv(r) {
  const a = (r.pg || []).map(o => o.k + (o.p ? ', ' + o.p : '')); let pen = '';
  if (a.length === 1) pen = a[0]; else if (a.length === 2) pen = a[0] + ', & ' + a[1]; else if (a.length > 2 && a.length <= 20) pen = a.slice(0, -1).join(', ') + ', & ' + a[a.length - 1]; else if (a.length > 20) pen = a.slice(0, 19).join(', ') + ', . . . ' + a[a.length - 1];
  const titik = t => (/[.?!]$/.test(t) ? t : t + '.'); const hlm = r.h ? r.h : r.an ? 'Article ' + r.an : '';
  let x = (pen ? titik(pen) + ' ' : '') + '(' + (r.y || 't.t.') + '). ' + titik(sebaris(r.t));
  if (r.s) x += ' ' + r.s + (r.v ? ', ' + r.v + (r.i ? '(' + r.i + ')' : '') : '') + (hlm ? ', ' + hlm : '') + '.';
  if (r.d) x += ' https://doi.org/' + r.d;
  return x;
}

/* Baris CSV kepada rekod. Pulangan: { rekod, lajur (lajur yang dikenali), tiada (lajur wajib yang tiada), nBaris }. */
export function rekodCsv(baris) {
  if (!baris || baris.length < 2) return { rekod: [], lajur: [], tiada: ['tajuk'], nBaris: 0 };
  const kepala = baris[0].map(norm); const ix = {}; Object.keys(LAJUR).forEach(k => { for (const nm of LAJUR[k]) { const j = kepala.indexOf(nm); if (j >= 0) { ix[k] = j; break; } } });
  const tiada = []; if (ix.t == null) tiada.push('Title'); if (ix.a == null) tiada.push('Authors'); if (ix.y == null) tiada.push('Year'); if (tiada.length) return { rekod: [], lajur: Object.keys(ix), tiada, nBaris: baris.length - 1 };
  const g = (b, k) => (ix[k] == null ? '' : sebaris(b[ix[k]])); const rekod = [];
  baris.slice(1).forEach(b => { const t = g(b, 't'); if (!t) return; const y = (g(b, 'y').match(/(?:19|20)\d{2}/) || [''])[0]; const h1 = g(b, 'h1'), h2 = g(b, 'h2');
    const r = { t: t.slice(0, 400), a: g(b, 'a').slice(0, 600), y, s: g(b, 's').slice(0, 200), v: g(b, 'v').slice(0, 20), i: g(b, 'i').slice(0, 20), an: g(b, 'an').slice(0, 30), h: h1 && h2 && h1 !== h2 ? h1 + '-' + h2 : (h1 || g(b, 'h')).replace(SEMPANG, '-').slice(0, 30), d: doiBersih(g(b, 'd')), ab: g(b, 'ab').replace(/^\[no abstract available\]$/i, '').slice(0, 4000), kw: g(b, 'kw').slice(0, 400), jt: g(b, 'jt').slice(0, 60), c: g(b, 'c').replace(/[^0-9]/g, '').slice(0, 7), u: g(b, 'u').slice(0, 300) };
    r.pg = pengarang(r.a).slice(0, 60); r.k = kunciRekod(r); rekod.push(r); });
  return { rekod, lajur: Object.keys(ix), tiada: [], nBaris: baris.length - 1 };
}

/* Buang pendua dalam fail (DOI yang sama, atau tajuk dan tahun yang sama) dan tandakan rekod yang sudah ada dalam artikel sumber
   repositori (padanan DOI atau tajuk). sumber: [{ doi, tajuk }]. */
export function nyahPendua(rekod, sumber, sediaAda) {
  const dDoi = new Set(), dT = new Set(); (sediaAda || []).forEach(r => { if (r.d) dDoi.add(r.d); dT.add(normTajuk(r.t) + '|' + r.y); });
  const sDoi = new Set((sumber || []).map(x => doiBersih(x.doi)).filter(Boolean)); const sT = new Set((sumber || []).map(x => normTajuk(x.tajuk)).filter(Boolean));
  const out = []; let pendua = 0, dalamRepo = 0;
  rekod.forEach(r => { const kt = normTajuk(r.t) + '|' + r.y; if ((r.d && dDoi.has(r.d)) || dT.has(kt)) { pendua++; return; } if (r.d) dDoi.add(r.d); dT.add(kt);
    r.repo = !!((r.d && sDoi.has(r.d)) || sT.has(normTajuk(r.t))); if (r.repo) dalamRepo++; out.push(r); });
  return { rekod: out, pendua, dalamRepo };
}

/* ---- v1.40.0: kunci stabil dan statistik rekod ----
   Kunci stabil bagi satu rekod: daripada DOI jika ada, jika tidak daripada tajuk ternormal dan tahun. Kunci ini menjadi id rekod dalam
   senarai artikel panduan (csv:<kunci>), maka ia mesti sama setiap kali fail yang sama dimuatkan. Dua cincang 32-bit digabungkan. */
const cincang = s => { let a = 0x811c9dc5, b = 5381; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = (Math.imul(b, 33) + c) | 0; } return (a >>> 0).toString(36) + (b >>> 0).toString(36); };
export const kunciRekod = r => cincang(r.d ? 'd|' + r.d : 't|' + normTajuk(r.t) + '|' + (r.y || ''));

/* Statistik rekod CSV. Semua angka dikira terus daripada rekod, tanpa agen: taburan tahun, jenis dokumen, sumber, kata kunci pengarang,
   rekod paling banyak disitasi, dan bilangan rekod yang menyebut sesuatu istilah dalam tajuk, abstrak atau kata kunci. Angka yang sama
   diberikan kepada pemilik dan kepada agen, supaya agen tidak mengira sendiri. */
const normTeks = t => ' ' + String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
/* "school | sekolah; teacher" kepada [{ nama: 'school', frasa: ['school', 'sekolah'] }, { nama: 'teacher', frasa: ['teacher'] }] */
export function uraiIstilah(teks) {
  const out = []; const ada = new Set();
  String(teks || '').split(/[;\n]+/).forEach(b => { const fr = b.split('|').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => normTeks(x).trim().length >= 2); if (!fr.length) return; const k = normTeks(fr[0]).trim(); if (ada.has(k)) return; ada.add(k); out.push({ nama: fr[0].slice(0, 60), frasa: fr.slice(0, 8).map(x => x.slice(0, 60)) }); });
  return out.slice(0, 24);
}
/* Padanan frasa pada permulaan perkataan, maka "school" turut mengira "schools" dan "schooling". Frasa tiga aksara atau kurang (contohnya
   "AI") dipadankan sebagai perkataan penuh supaya tidak mengira perkataan lain yang bermula dengan huruf yang sama. */
const padan = (n, frasa) => frasa.some(f => { const x = normTeks(f).trim(); if (x.length < 2) return false; return x.length <= 3 ? n.includes(' ' + x + ' ') : n.includes(' ' + x); });
const susun = (peta, had) => Array.from(peta.values()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, had);
const HAD_SENARAI = 15;   // padanan yang sedikit disenaraikan satu demi satu supaya boleh dinamakan
export function ringkasCsv(rekod, istilah) {
  const rs = rekod || []; const tahun = new Map(), sumber = new Map(), jenis = new Map(), kata = new Map(); let adaAbs = 0, adaKata = 0;
  const tambah = (m, k, nama) => { const x = m.get(k); if (x) x[1]++; else m.set(k, [nama, 1]); };
  const N = rs.map(r => normTeks([r.t, r.ab, r.kw].join(' . ')));
  rs.forEach(r => {
    if (r.ab) adaAbs++; tambah(tahun, r.y || '', r.y || 't.t.');
    if (r.s) tambah(sumber, r.s.toLowerCase(), r.s); tambah(jenis, (r.jt || '').toLowerCase(), r.jt || 'tidak dinyatakan');
    if (r.kw) { adaKata++; const ks = r.kw.split(';').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean); if (r.kw.length >= 400) ks.pop(); new Set(ks.map(k => k.toLowerCase())).forEach(k => tambah(kata, k, k)); }
  });
  const th = Array.from(tahun.values()).sort((a, b) => (a[0] === 't.t.') - (b[0] === 't.t.') || String(a[0]).localeCompare(String(b[0]))); const thN = th.filter(x => x[0] !== 't.t.').map(x => +x[0]);
  const sitasi = rs.map((r, i) => ({ i, c: parseInt(r.c, 10) || 0 })).filter(x => x.c > 0).sort((a, b) => b.c - a.c || a.i - b.i).slice(0, 10);
  const ist = (istilah || []).map(t => { const idx = []; N.forEach((n, i) => { if (padan(n, t.frasa || [t.nama])) idx.push(i); }); return { nama: t.nama, frasa: t.frasa || [t.nama], asal: t.asal || '', n: idx.length, idx }; });
  const pasangan = []; const aktif = ist.filter(t => t.n > 0).slice(0, 8);
  for (let i = 0; i < aktif.length; i++) for (let j = i + 1; j < aktif.length; j++) { const sb = new Set(aktif[j].idx); const idx = aktif[i].idx.filter(x => sb.has(x)); pasangan.push({ a: aktif[i].nama, b: aktif[j].nama, n: idx.length, idx }); }
  return { n: rs.length, adaAbs, adaKata, tahun: th, julat: thN.length ? [Math.min(...thN), Math.max(...thN)] : null, jenis: susun(jenis, 12), sumber: susun(sumber, 10), nSumber: sumber.size, kata: susun(kata, 25), nKata: kata.size, sitasi, istilah: ist, pasangan };
}
export const peratus = (n, N) => (N ? (Math.round(1000 * n / N) / 10).toFixed(1) : '0.0');
/* Statistik sebagai teks bagi agen. Rekod dirujuk dengan nombornya dalam senarai ("CSV 12"), sama seperti dalam blok rekod. */
export function teksStat(S, rekod, en) {
  if (!S || !S.n) return ''; const sen = a => a.map(x => `${x[0]} (${x[1]})`).join('; '); const no = idx => idx.map(i => 'CSV ' + (i + 1)).join(', ');
  const L = [`- Jumlah rekod: ${S.n} (${S.adaAbs} mempunyai abstrak; ${S.adaKata} mempunyai kata kunci pengarang).`];
  if (S.tahun.length) L.push(`- Tahun terbitan${S.julat ? ', ' + S.julat[0] + ' hingga ' + S.julat[1] : ''}: ${sen(S.tahun)}.`);
  if (S.jenis.length) L.push(`- Jenis dokumen: ${sen(S.jenis)}.`);
  if (S.sumber.length) L.push(`- Sumber paling kerap (${S.sumber.length} teratas daripada ${S.nSumber} sumber): ${sen(S.sumber)}.`);
  if (S.kata.length) L.push(`- Kata kunci pengarang paling kerap (${S.kata.length} teratas daripada ${S.nKata} kata kunci berbeza): ${sen(S.kata)}.`);
  if (S.sitasi.length) L.push(`- Rekod paling banyak disitasi (lajur Cited by dalam fail): ${S.sitasi.map(x => `CSV ${x.i + 1} ${namaSitasi(rekod[x.i], en)} (${x.c})`).join('; ')}.`);
  if (S.istilah.length) { L.push('- Padanan istilah (frasa dicari dalam tajuk, abstrak dan kata kunci; padanan pada permulaan perkataan; ejaan, sinonim atau bahasa lain yang tidak disenaraikan tidak dikira, maka setiap angka ialah had bawah, dan sifar tidak bermakna tiada kajian):');
    S.istilah.forEach(t => L.push(`  - ${t.nama} [frasa: ${t.frasa.join(' | ')}]: ${t.n} rekod (${peratus(t.n, S.n)}%)${t.n && t.n <= HAD_SENARAI ? ': ' + no(t.idx) : ''}`)); }
  if (S.pasangan.length) { L.push('- Kemunculan bersama dua istilah dalam rekod yang sama:'); S.pasangan.forEach(p => L.push(`  - ${p.a} + ${p.b}: ${p.n} rekod (${peratus(p.n, S.n)}%)${p.n && p.n <= HAD_SENARAI ? ': ' + no(p.idx) : ''}`)); }
  return L.join('\n');
}
