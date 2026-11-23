/* Jadual dan rajah dalam jawapan agen (v1.39.0). Agen Pandu Tulis menulis jadual dan rajah dalam bentuk teks yang ringkas:

     [JADUAL: tajuk jadual]
     | Kajian | Negara | Reka bentuk |
     | --- | --- | --- |
     | Gao et al. (2025) | China | Tinjauan |

     [RAJAH: tajuk rajah]
     A[Kepimpinan digital] --> B[Pengurusan pengetahuan]
     B --> C[Kompetensi digital guru]
     A -->|kesan langsung| C

   Modul ini memecahkan teks agen kepada blok (perenggan, jadual, rajah), supaya sistem memaparkan jadual sebagai jadual sebenar dan rajah
   sebagai rajah sebenar (SVG; PNG apabila dimasukkan ke dalam manuskrip). Tiada pustaka luar. Isi jadual dan rajah datang daripada agen
   dan tertakluk kepada peraturan sifar fabrikasi yang sama seperti teksnya. */
const RX_JADUAL = /^\[(?:JADUAL|TABLE)\s*:\s*(.+?)\]\s*$/i;
/* CARTA: rajah statistik yang dibina sistem daripada medan sebenar artikel sumber (medan=tahun|negara|...) atau data baris "label, nilai" (medan=sendiri). */
const RX_CARTA = /^CARTA\s*:\s*(.+)$/i;
const RX_RAJAH = /^\[(?:RAJAH|FIGURE|DIAGRAM)\s*:\s*(.+?)\]\s*$/i;
const barisPaip = b => /^\s*\|.*\|\s*$/.test(b);
const pemisah = b => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(b);
const sel = b => { let t = b.trim(); if (t.startsWith('|')) t = t.slice(1); if (t.endsWith('|')) t = t.slice(0, -1); return t.split('|').map(x => x.trim()); };
const barisRajah = b => /-->|->|---/.test(b) || /^\s*[A-Za-z0-9_]+\s*[[(][^\])]*[\])]\s*$/.test(b) || /^\s*arah\s*:/i.test(b);

/* Pecahkan teks kepada blok: { jenis: 'p', teks } | { jenis: 'jadual', tajuk, kepala, baris } | { jenis: 'rajah', tajuk, spec }. */
export function blokTeks(teks) {
  const L = String(teks || '').replace(/\r/g, '').split('\n'); const out = []; let per = []; let i = 0;
  const tutup = () => { const t = per.join('\n').trim(); if (t) out.push({ jenis: 'p', teks: t }); per = []; };
  const ambilJadual = (mula, tajuk) => { let j = mula; while (j < L.length && !L[j].trim()) j++; const rs = []; while (j < L.length && barisPaip(L[j])) { rs.push(L[j]); j++; } if (rs.length < 2) return null;
    const isiR = rs.filter(r => !pemisah(r)).map(sel); if (isiR.length < 2) return null; const n = Math.max(...isiR.map(r => r.length)); const rata = r => r.concat(Array(Math.max(0, n - r.length)).fill('')).slice(0, n);
    return { blok: { jenis: 'jadual', tajuk: tajuk || '', kepala: rata(isiR[0]), baris: isiR.slice(1).map(rata) }, akhir: j }; };
  while (i < L.length) {
    const b = L[i]; let m;
    if ((m = RX_JADUAL.exec(b.trim()))) { const r = ambilJadual(i + 1, m[1].trim()); if (r) { tutup(); out.push(r.blok); i = r.akhir; continue; } }
    else if (barisPaip(b) && i + 1 < L.length && barisPaip(L[i + 1])) { const r = ambilJadual(i, ''); if (r) { tutup(); out.push(r.blok); i = r.akhir; continue; } }
    else if ((m = RX_CARTA.exec(b.trim()))) { const at = {}; m[1].split(';').forEach(x => { const q = /^\s*(\w+)\s*=\s*(.*)$/.exec(x); if (q) at[q[1].toLowerCase()] = q[2].trim(); }); let j = i + 1; const data = []; while (j < L.length && /^\s*[^|].*?[,;\t]\s*-?\d+(?:\.\d+)?\s*$/.test(L[j])) { data.push(L[j].trim()); j++; }
      tutup(); out.push({ jenis: 'carta', tajuk: at.tajuk || '', medan: at.medan || 'sendiri', carta: /^(bar|barh|pai|garis)$/.test(at.jenis || '') ? at.jenis : 'bar', data }); i = j; continue; }
    else if ((m = RX_RAJAH.exec(b.trim()))) { let j = i + 1; while (j < L.length && !L[j].trim()) j++; const rs = []; while (j < L.length && L[j].trim() && barisRajah(L[j])) { rs.push(L[j].trim()); j++; }
      const spec = uraiRajah(rs); if (spec.nod.length >= 2 && spec.tepi.length >= 1) { tutup(); out.push({ jenis: 'rajah', tajuk: m[1].trim(), spec }); i = j; continue; } }
    if (!b.trim()) tutup(); else per.push(b);
    i++;
  }
  tutup(); return out;
}

/* Rajah: nod "KOD[Label]" dan anak panah "A --> B" atau "A -->|label| B"; beberapa anak panah boleh dirantai dalam satu baris. */
export function uraiRajah(baris) {
  const nod = new Map(); const tepi = []; let arah = 'LR';
  const RX_NOD = /^\s*([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\(([^)]*)\))?/; const RX_ANAK = /^\s*(-->|->|---)\s*(?:\|([^|]*)\|)?/;
  (baris || []).forEach(b => {
    const ma = /^\s*arah\s*:\s*(\S+)/i.exec(b); if (ma) { arah = /^(tb|td|atas|bawah|menegak)/i.test(ma[1]) ? 'TB' : 'LR'; return; }
    let s = b; let dahulu = null; let label = null; let guard = 0;
    while (s.trim() && guard++ < 20) {
      const mn = RX_NOD.exec(s); if (!mn) break; const id = mn[1]; const lb = (mn[2] != null ? mn[2] : mn[3] != null ? mn[3] : '').trim();
      if (!nod.has(id)) nod.set(id, lb || id); else if (lb && nod.get(id) === id) nod.set(id, lb);
      if (dahulu && dahulu !== id) tepi.push({ a: dahulu, b: id, l: (label || '').trim() });
      s = s.slice(mn[0].length); const mk = RX_ANAK.exec(s); if (!mk) break; label = mk[2] || ''; dahulu = id; s = s.slice(mk[0].length);
    }
  });
  return { arah, nod: Array.from(nod.entries()).slice(0, 14).map(([id, label]) => ({ id, label })), tepi: tepi.filter(t => nod.has(t.a) && nod.has(t.b)).slice(0, 30) };
}

const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const balut = (t, max) => { const out = []; let cur = ''; String(t).split(/\s+/).filter(Boolean).forEach(w => { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); if (cur) out.push(cur); return out.length ? out : ['']; };

/* Susun atur berlapis yang ringkas: lapisan mengikut laluan terpanjang dari punca; anak panah antara lapisan bersebelahan lurus, yang lain
   melengkung di bawah (atau di kanan) supaya tidak melintasi kotak. Memadai bagi kerangka konsep dan aliran langkah sehingga 14 nod. */
export function svgRajah(spec) {
  const nod = spec.nod.map(n => ({ id: n.id, label: n.label })); const ix = new Map(nod.map((n, i) => [n.id, i])); const tepi = spec.tepi.filter(t => ix.has(t.a) && ix.has(t.b)); const TB = spec.arah === 'TB';
  const lap = nod.map(() => 0);
  for (let pus = 0; pus < nod.length; pus++) { let ubah = false; tepi.forEach(t => { const a = ix.get(t.a), b = ix.get(t.b); if (a !== b && lap[b] < lap[a] + 1 && lap[a] + 1 < nod.length) { lap[b] = lap[a] + 1; ubah = true; } }); if (!ubah) break; }
  const F = 12.5, LH = 15.5; nod.forEach((n, i) => { n.baris = balut(n.label, 22); n.w = Math.min(200, Math.max(96, Math.max(...n.baris.map(b => b.length)) * 6.5 + 24)); n.h = n.baris.length * LH + 18; n.lap = lap[i]; });
  const nLap = Math.max(...lap) + 1; const kump = Array.from({ length: nLap }, (_, k) => nod.filter(n => n.lap === k)); const M = 16;
  if (!TB) { const JX = 78, JY = 26; const tinggi = kump.map(g => g.reduce((s, n) => s + n.h, 0) + JY * (g.length - 1)); const H0 = Math.max(...tinggi); let x = M;
    kump.forEach((g, k) => { const lw = Math.max(...g.map(n => n.w)); let y = M + (H0 - tinggi[k]) / 2; g.forEach(n => { n.x = x + (lw - n.w) / 2; n.y = y; y += n.h + JY; }); x += lw + JX; }); }
  else { const JX = 30, JY = 52; const lebar = kump.map(g => g.reduce((s, n) => s + n.w, 0) + JX * (g.length - 1)); const W0 = Math.max(...lebar); let y = M;
    kump.forEach((g, k) => { const lh = Math.max(...g.map(n => n.h)); let x = M + (W0 - lebar[k]) / 2; g.forEach(n => { n.x = x; n.y = y + (lh - n.h) / 2; x += n.w + JX; }); y += lh + JY; }); }
  let maxX = Math.max(...nod.map(n => n.x + n.w)), maxY = Math.max(...nod.map(n => n.y + n.h)); let s = ''; let lbl = '';
  const label = (x, y, t) => { if (!t) return; const w = t.length * 6 + 10; lbl += `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="${w.toFixed(1)}" height="16" rx="3" fill="#ffffff"/><text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" font-size="11" text-anchor="middle" fill="#374151">${xml(t)}</text>`; };
  let lengkung = 0;
  tepi.forEach(t => { const a = nod[ix.get(t.a)], b = nod[ix.get(t.b)]; if (a === b) return; const beza = b.lap - a.lap; const garis = 'fill="none" stroke="#1f2937" stroke-width="1.3" marker-end="url(#rj)"';
    if (beza === 1) { const p = TB ? [a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y - 2] : [a.x + a.w, a.y + a.h / 2, b.x - 2, b.y + b.h / 2]; s += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${p[2].toFixed(1)}" y2="${p[3].toFixed(1)}" ${garis}/>`; label((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, t.l); }
    else if (beza === 0) { const atas = TB ? a.x < b.x : a.y < b.y; const p = TB ? (atas ? [a.x + a.w, a.y + a.h / 2, b.x - 2, b.y + b.h / 2] : [a.x, a.y + a.h / 2, b.x + b.w + 2, b.y + b.h / 2]) : (atas ? [a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y - 2] : [a.x + a.w / 2, a.y, b.x + b.w / 2, b.y + b.h + 2]); s += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${p[2].toFixed(1)}" y2="${p[3].toFixed(1)}" ${garis}/>`; label((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, t.l); }
    else { lengkung++; const lo = Math.min(a.lap, b.lap), hi = Math.max(a.lap, b.lap); const antara = nod.filter(n => n.lap >= lo && n.lap <= hi);
      if (!TB) { const dasar = Math.max(...antara.map(n => n.y + n.h)); const cy = dasar + 30 + lengkung * 14; const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y + b.h + 2; s += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} C${x1.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" ${garis}/>`; const ym = (y1 + y2) / 8 + cy * 0.75; label((x1 + x2) / 2, ym, t.l); maxY = Math.max(maxY, ym + 12); }
      else { const dasar = Math.max(...antara.map(n => n.x + n.w)); const cx = dasar + 34 + lengkung * 14; const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x + b.w + 2, y2 = b.y + b.h / 2; s += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} C${cx.toFixed(1)},${y1.toFixed(1)} ${cx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" ${garis}/>`; const xm = (x1 + x2) / 8 + cx * 0.75; label(xm, (y1 + y2) / 2, t.l); maxX = Math.max(maxX, xm + (t.l ? t.l.length * 3 + 8 : 6)); } } });
  const kotak = nod.map(n => `<rect x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${n.w.toFixed(1)}" height="${n.h.toFixed(1)}" rx="5" fill="#ffffff" stroke="#1f2937" stroke-width="1.3"/>` + n.baris.map((b, i) => `<text x="${(n.x + n.w / 2).toFixed(1)}" y="${(n.y + 9 + 11 + i * LH).toFixed(1)}" font-size="${F}" text-anchor="middle">${xml(b)}</text>`).join('')).join('');
  const W = Math.ceil(maxX + M), H = Math.ceil(maxY + M);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif" fill="#111827"><defs><marker id="rj" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f2937"/></marker></defs><rect width="${W}" height="${H}" fill="#ffffff"/>${s}${kotak}${lbl}</svg>`;
}

export function svgKePng(src, skala) {
  return new Promise((res, rej) => { const m = /^<svg[^>]*?viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(src); if (!m) { rej(new Error('rajah tidak sah')); return; } const w = Math.ceil(+m[1]), h = Math.ceil(+m[2]); const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' })); const im = new Image();
    im.onload = () => { try { const c = document.createElement('canvas'); const z = skala || 2; c.width = w * z; c.height = h * z; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('PNG gagal dijana')), 'image/png'); } catch (e) { URL.revokeObjectURL(url); rej(e); } };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Rajah gagal dilukis')); }; im.src = url; });
}

/* Teks agen yang ada jadual atau rajah? (untuk mengelak kerja yang tidak perlu) */
export const adaBlok = teks => /\[(?:JADUAL|TABLE|RAJAH|FIGURE|DIAGRAM)\s*:/i.test(String(teks || '')) || /(^|\n)\s*\|.*\|\s*\n\s*\|/.test(String(teks || ''));
