/* Peta Tema rekod CSV (v1.43.0). Modul tulen (tiada DOM, tiada rangkaian, tiada token): mengelompokkan rekod CSV yang besar (sehingga
   beberapa ribu) kepada tema mengikut kata kunci pengarang, tajuk dan abstrak, kemudian menyusun tema mengikut kaitannya dengan objektif,
   persoalan dan pemboleh ubah kajian Prof Dr. Kaedah: vektor TF-IDF (kata kunci pengarang sebagai frasa berpemberat), k-means sfera
   dengan permulaan k-means++ yang berbenih tetap (hasil sama bagi fail yang sama), dan label tema daripada istilah yang paling
   membezakan tema itu daripada keseluruhan rekod. Rekod dirujuk melalui kunci stabilnya (r.k), bukan kedudukan. */

const HENTI = new Set(('a about above after again against all also although among an and any are as at be because been before being below between both but by can could did do does doing during each either et al etc few for from further had has have having he her here hers him his how however i if in into is it its itself just more most much must my nor not of off on once only or other our out over own per same she should so some such than that the their them then there these they this those through thus to too under until up upon us very via was we were what when where whether which while who whom why will with within without would yet you your ' +
  'study studies research paper article review results result findings finding find found show shows shown showed suggest suggests suggested indicate indicates indicated reveal reveals revealed provide provides provided based using use used uses approach approaches method methods methodology data analysis analyses analyzed analysed examine examines examined explore explores explored investigate investigates investigated aim aims aimed purpose objective objectives conclusion conclusions implications implication significant significantly effect effects impact impacts role relationship relationships among new well various different however therefore moreover furthermore present presents current within across toward towards including include includes included related relation level levels high higher low lower one two three first second also may can however although through rights reserved copyright elsevier springer taylor francis wiley sage emerald published publishing author authors ltd inc ' +
  'dan yang di ke dari dalam untuk pada dengan ini itu adalah ialah oleh atau juga tidak akan telah boleh lebih serta bagi kepada antara tersebut kajian dapatan hasil menunjukkan terhadap secara sebagai iaitu manakala namun bahawa').split(/\s+/));

const ASAS = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
/* Pemangkasan ringan supaya bentuk tunggal dan jamak dikira sama (teachers -> teacher, studies -> study). */
function punca(w) {
  if (w.length > 5 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es') && /(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}
export function token(teks) { return ASAS(teks).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !HENTI.has(w) && !/^\d+$/.test(w)).map(punca).filter(w => !HENTI.has(w)); }
const frasaKk = kw => String(kw || '').split(/[;|]+/).map(x => token(x).join(' ')).filter(x => x && x.length >= 3);

/* Penjana nombor rawak berbenih (mulberry32) supaya Peta Tema sama setiap kali dibina daripada fail yang sama. */
function rawak(benih) { let a = benih >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* Ciri satu rekod: kata kunci pengarang sebagai frasa (pemberat 3), token tajuk (2), token kata kunci (1,5) dan token abstrak (1). */
function ciri(r) {
  const m = new Map(); const tambah = (k, w) => m.set(k, (m.get(k) || 0) + w);
  frasaKk(r.kw).forEach(f => { if (f.includes(' ')) tambah('#' + f, 3); });
  token(r.t).forEach(w => tambah(w, 2)); token(String(r.kw || '').replace(/[;|]/g, ' ')).forEach(w => tambah(w, 1.5)); token(r.ab).forEach(w => tambah(w, 1));
  return m;
}
const papar = k => k[0] === '#' ? k.slice(1) : k;

function vektor(peta, V, idf) {
  const ent = []; peta.forEach((tf, k) => { const j = V.get(k); if (j !== undefined) ent.push([j, (1 + Math.log(tf)) * idf[j]]); });
  let n = 0; ent.forEach(e => { n += e[1] * e[1]; }); n = Math.sqrt(n) || 1; ent.forEach(e => { e[1] /= n; }); return ent;
}
const dot = (ent, c) => { let s = 0; for (const [j, w] of ent) s += w * c[j]; return s; };

/* Bilangan tema lalai: kira-kira punca kuasa dua (n/3), antara 3 dan 14. */
export function kLalai(n) { if (n < 8) return 1; if (n < 24) return Math.max(2, Math.round(n / 8)); return Math.max(3, Math.min(14, Math.round(Math.sqrt(n / 3)))); }

/* rekod: [{ k, t, ab, kw, y, ... }]; o.istilah: rentetan (objektif, persoalan, pemboleh ubah dan padanannya); o.k: bilangan tema.
   Pulangan: { v, n, k, tema: [{ id, label, kata, kunci: [r.k disusun daripada paling berkaitan], n, tahun: [min, maks], kaitan }] }. */
export function petaTema(rekod, o = {}) {
  const rs = (rekod || []).filter(r => r && r.k); const n = rs.length; if (!n) return { v: 1, n: 0, k: 0, tema: [] };
  const peta = rs.map(ciri); const df = new Map(); peta.forEach(m => m.forEach((_, k) => df.set(k, (df.get(k) || 0) + 1)));
  const minDf = n >= 40 ? 2 : 1, maksDf = Math.max(3, Math.floor(n * 0.45));
  const calon = Array.from(df.entries()).filter(([, c]) => c >= minDf && c <= maksDf).sort((a, b) => b[1] - a[1]).slice(0, 4000);
  const V = new Map(); const kata = []; const idf = []; calon.forEach(([k, c], j) => { V.set(k, j); kata.push(k); idf.push(Math.log((n + 1) / (c + 1)) + 1); });
  const X = peta.map(m => vektor(m, V, idf)); const D = kata.length;
  const qPeta = new Map(); token(o.istilah || '').forEach(w => qPeta.set(w, (qPeta.get(w) || 0) + 1)); frasaKk(String(o.istilah || '').replace(/[,.\n]/g, ';')).forEach(f => { if (f.includes(' ')) qPeta.set('#' + f, 2); });
  const q = vektor(qPeta, V, idf); const qD = new Float32Array(D); q.forEach(([j, w]) => { qD[j] = w; }); const adaQ = q.length > 0;
  const kait = X.map(x => adaQ ? dot(x, qD) : 0);
  const k = Math.max(1, Math.min(o.k || kLalai(n), n)); const rnd = rawak(20261122 + n);
  /* permulaan k-means++ */
  const C = []; const jarak = new Float64Array(n).fill(Infinity); const dense = ent => { const c = new Float32Array(D); ent.forEach(([j, w]) => { c[j] = w; }); return c; };
  let pertama = 0; for (let i = 1; i < n; i++) if (X[i].length > X[pertama].length) pertama = i; C.push(dense(X[pertama]));
  while (C.length < k) { const c = C[C.length - 1]; let jum = 0; for (let i = 0; i < n; i++) { const d = 1 - dot(X[i], c); if (d < jarak[i]) jarak[i] = d; jum += Math.max(0, jarak[i]) ** 2; }
    let sasar = rnd() * jum, pilih = n - 1; for (let i = 0; i < n; i++) { sasar -= Math.max(0, jarak[i]) ** 2; if (sasar <= 0) { pilih = i; break; } } C.push(dense(X[pilih])); }
  /* lelaran k-means sfera */
  const ahli = new Int32Array(n).fill(-1); const sim = new Float32Array(n);
  for (let it = 0; it < 30; it++) { let ubah = 0;
    for (let i = 0; i < n; i++) { let b = 0, bs = -Infinity; for (let c = 0; c < k; c++) { const s = dot(X[i], C[c]); if (s > bs) { bs = s; b = c; } } sim[i] = bs; if (ahli[i] !== b) { ahli[i] = b; ubah++; } }
    const baru = Array.from({ length: k }, () => new Float32Array(D)); const bil = new Int32Array(k);
    for (let i = 0; i < n; i++) { const c = ahli[i]; bil[c]++; for (const [j, w] of X[i]) baru[c][j] += w; }
    for (let c = 0; c < k; c++) { if (!bil[c]) { let jauh = 0; for (let i = 1; i < n; i++) if (sim[i] < sim[jauh]) jauh = i; baru[c] = dense(X[jauh]); ahli[jauh] = c; sim[jauh] = 1; ubah++; continue; }
      let nn = 0; for (let j = 0; j < D; j++) nn += baru[c][j] * baru[c][j]; nn = Math.sqrt(nn) || 1; for (let j = 0; j < D; j++) baru[c][j] /= nn; }
    for (let c = 0; c < k; c++) C[c] = baru[c]; if (!ubah && it > 0) break; }
  /* tema yang terlalu kecil (kurang daripada 3 rekod atau 1.5 peratus) dileburkan ke tema besar yang paling hampir */
  { const bil = new Int32Array(k); for (let i = 0; i < n; i++) bil[ahli[i]]++; const minS = Math.max(3, Math.ceil(n * 0.015)); const besar = []; for (let c = 0; c < k; c++) if (bil[c] >= minS) besar.push(c);
    if (besar.length && besar.length < k) for (let i = 0; i < n; i++) if (bil[ahli[i]] < minS) { let b = besar[0], bs = -Infinity; for (const c of besar) { const s = dot(X[i], C[c]); if (s > bs) { bs = s; b = c; } } ahli[i] = b; } }
  /* purata global bagi label yang membezakan */
  const g = new Float32Array(D); X.forEach(x => x.forEach(([j, w]) => { g[j] += w / n; }));
  const tema = []; for (let c = 0; c < k; c++) {
    const idx = []; for (let i = 0; i < n; i++) if (ahli[i] === c) idx.push(i); if (!idx.length) continue;
    const skorKata = []; for (let j = 0; j < D; j++) { const v = C[c][j] - g[j]; if (v > 0) skorKata.push([j, v * (kata[j][0] === '#' ? 1.3 : 1)]); } skorKata.sort((a, b) => b[1] - a[1]);
    const pilihan = []; for (const [j] of skorKata) { const w = papar(kata[j]); if (pilihan.some(p => p.includes(w) || w.includes(p))) continue; pilihan.push(w); if (pilihan.length >= 6) break; }
    idx.sort((a, b) => (kait[b] - kait[a]) || (dot(X[b], C[c]) - dot(X[a], C[c])));
    const th = idx.map(i => parseInt(rs[i].y, 10)).filter(y => y > 1900); const kt = idx.reduce((s, i) => s + kait[i], 0) / idx.length;
    tema.push({ label: pilihan.slice(0, 3).join(' · ') || 'tema ' + (c + 1), kata: pilihan, kunci: idx.map(i => rs[i].k), n: idx.length, tahun: th.length ? [Math.min(...th), Math.max(...th)] : null, kaitanMentah: kt });
  }
  const maksK = Math.max(1e-9, ...tema.map(t => t.kaitanMentah));
  tema.forEach(t => { t.kaitan = adaQ ? Math.round(100 * t.kaitanMentah / maksK) : null; delete t.kaitanMentah; });
  tema.sort((a, b) => ((b.kaitan || 0) - (a.kaitan || 0)) || (b.n - a.n)); tema.forEach((t, i) => { t.id = 'T' + (i + 1); });
  return { v: 1, n, k: tema.length, adaQ, tema };
}

/* Kumpulan rekod bagi satu panggilan Kad Tema: paling banyak `saiz` rekod, dibahagi sama rata supaya kelompok akhir tidak terlalu kecil. */
export function kelompok(senarai, saiz = 45) { const n = senarai.length; if (!n) return []; const b = Math.ceil(n / saiz); const s = Math.ceil(n / b); const out = []; for (let i = 0; i < n; i += s) out.push(senarai.slice(i, i + s)); return out; }
