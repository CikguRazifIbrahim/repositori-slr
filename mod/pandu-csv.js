/* Rekod tambahan daripada fail CSV (v1.39.0). Pemilik memuat naik fail .csv yang dieksport dari Scopus (atau pangkalan data lain dengan
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
    r.pg = pengarang(r.a).slice(0, 60); rekod.push(r); });
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
