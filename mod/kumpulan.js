/* Kumpulan label (Papan): senarai artikel dikelompokkan mengikut label, iaitu Tema utama rekod (Kepimpinan Digital di atas, Pengurusan
   Pengetahuan Organisasi di tengah, Kompetensi Digital Guru di bawah, kemudian Lain-lain). Artikel yang belum dilabel diletakkan paling
   atas dengan cip label pantas dan cadangan automatik (peraturan istilah pada tajuk, objektif, konstruk dan subtopik, serta jiran terdekat
   TF-IDF dalam kalangan artikel yang sudah dilabel); menerima cadangan menetapkan Tema utama rekod, maka artikel itu berpindah ke kumpulannya.
   Dalam setiap kumpulan, artikel Selesai disusun di atas, kemudian Sedang dibaca dan Belum dibaca, mengikut pilihan Susun sebagai urutan
   kedua. Baris dipaparkan padat (tanpa butang Baca dan Muat turun); tiada ketinggian tetap bagi kumpulan. */
export function initKumpulan(R) {
  const { $, esc, toast, TEMA } = R;
  const KOD = { [TEMA[0]]: 'kd', [TEMA[1]]: 'ppo', [TEMA[2]]: 'kdg', [TEMA[3]]: 'lain' };
  const NAMA = { kd: TEMA[0], ppo: TEMA[1], kdg: TEMA[2], lain: TEMA[3] };
  const PENDEK = { kd: 'KD', ppo: 'PPO', kdg: 'KDG', lain: 'Lain' };
  const URUTAN = ['tiada', 'kd', 'ppo', 'kdg', 'lain'];
  const PERATURAN = {
    kd: [[/digital leadership|kepimpinan digital|e-leadership|technology leadership|technological leadership|digital transformational leadership/i, 3], [/\bprincipal|pengetua|guru besar|school leader|head ?teacher|school head|headmaster/i, 2], [/leadership|kepimpinan|leader/i, 1]],
    ppo: [[/knowledge management|pengurusan pengetahuan|knowledge sharing|perkongsian pengetahuan|knowledge creation|penciptaan pengetahuan|\bSECI\b|knowledge-based view/i, 3], [/organi[sz]ational (knowledge|learning|memory)|intellectual capital|knowledge transfer|tacit knowledge|explicit knowledge|pembelajaran organisasi/i, 2], [/knowledge|pengetahuan/i, 1]],
    kdg: [[/digital competenc|kompetensi digital|digcompedu|ict competenc|digital literacy|literasi digital|digital skills|kemahiran digital|teacher digital/i, 3], [/\bTPACK\b|technological pedagogical|technology integration|integrasi teknologi|teachers'? (digital|technology|ict)/i, 2], [/competenc|kompetensi|literacy|literasi/i, 1]]
  };
  const K = { vec: null, masa: 0, n: 0 };
  const rekod = id => Object.assign({}, R.S.docs.get(id) || {}, R.S.pending[id] || {});
  const kodTema = d => KOD[d.tema] || (d.tema ? 'lain' : 'tiada');
  const pangkatStatus = d => d.status === 'Selesai' ? 0 : d.status === 'Sedang dibaca' ? 1 : 2;
  const teksLabel = d => [d.tajuk, d.objektif, d.konstruk, d.subtopik, d.definisi, d.teori].filter(Boolean).join(' ').slice(0, 3000);

  /* ---- cadangan label automatik ---- */
  function vektor() {
    const masa = Date.now(); if (K.vec && masa - K.masa < 4000 && K.n === R.S.docs.size) return K.vec;
    const ids = Array.from(R.S.docs.keys()); const docs = ids.map(id => R.Peta.tokens(teksLabel(rekod(id)))); const df = new Map(); const N = docs.length || 1;
    docs.forEach(tk => new Set(tk).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    const out = new Map();
    ids.forEach((id, i) => { const tf = new Map(); docs[i].forEach(t => tf.set(t, (tf.get(t) || 0) + 1)); const v = new Map(); let norm = 0; tf.forEach((c, t) => { const w = (1 + Math.log(c)) * Math.log(1 + N / (df.get(t) || 1)); v.set(t, w); norm += w * w; }); out.set(id, { vec: v, norm: Math.sqrt(norm) || 1 }); });
    K.vec = out; K.masa = masa; K.n = R.S.docs.size; return out;
  }
  function kosinus(a, b) { if (!a || !b) return 0; let s = 0; const [x, y] = a.vec.size < b.vec.size ? [a, b] : [b, a]; x.vec.forEach((w, t) => { const w2 = y.vec.get(t); if (w2) s += w * w2; }); return s / (a.norm * b.norm); }
  function cadang(id) {
    const d = rekod(id); const teks = teksLabel(d); if (!teks.trim()) return null;
    const skor = { kd: 0, ppo: 0, kdg: 0 }; const sebab = { kd: [], ppo: [], kdg: [] };
    Object.keys(PERATURAN).forEach(k => PERATURAN[k].forEach(([re, w]) => { const m = re.exec(teks); if (m) { skor[k] += w; sebab[k].push(m[0].toLowerCase()); } }));
    const V = vektor(); const va = V.get(id); const jiran = [];
    if (va) R.S.docs.forEach((d0, lain) => { if (lain === id) return; const b = rekod(lain); const k = KOD[b.tema]; if (!k || k === 'lain') return; const cs = kosinus(va, V.get(lain)); if (cs >= 0.08) jiran.push({ id: lain, k, cs, bil: b.bil }); });
    jiran.sort((x, y) => y.cs - x.cs); jiran.slice(0, 6).forEach(j => { skor[j.k] += 4 * j.cs; sebab[j.k].push('serupa dengan Bil. ' + (j.bil || '?')); });
    const susun = Object.keys(skor).sort((x, y) => skor[y] - skor[x]); const terbaik = susun[0], kedua = susun[1];
    if (skor[terbaik] < 1) return null;
    const unik = Array.from(new Set(sebab[terbaik])).slice(0, 4);
    return { kod: terbaik, tema: NAMA[terbaik], skor: skor[terbaik], yakin: skor[terbaik] >= 2 && skor[terbaik] - skor[kedua] >= 1, sebab: unik };
  }

  /* ---- paparan berkumpulan ---- */
  function kumpul(arr) {
    const g = {}; URUTAN.forEach(k => { g[k] = []; });
    arr.forEach(([id, d]) => { g[kodTema(d)].push([id, d]); });
    URUTAN.forEach(k => { g[k] = g[k].map((x, i) => [x, i]).sort((p, q) => pangkatStatus(p[0][1]) - pangkatStatus(q[0][1]) || p[1] - q[1]).map(x => x[0]); });
    return g;
  }
  function barisPadat(id, d, kod) {
    const nF = (d.fail || []).length; const c = kod === 'tiada' ? cadang(id) : null;
    const label = kod === 'tiada' ? `<div class="kum-label"><span class="lbl">Label:</span>${['kd', 'ppo', 'kdg', 'lain'].map(k => `<button class="kum-cip ${k}${c && c.kod === k ? ' cadang' : ''}" data-label="${k}" data-id="${esc(id)}" title="${esc('Tetapkan Tema utama: ' + NAMA[k])}">${PENDEK[k]}</button>`).join('')}${c ? `<span class="kum-cadang">Cadangan: <b>${PENDEK[c.kod]}</b>${c.sebab.length ? ' (' + esc(c.sebab.join('; ')) + ')' : ''}${c.yakin ? '' : ' <i>kurang pasti</i>'}</span>` : '<span class="kum-cadang">Tiada cadangan; isi tajuk atau objektif dahulu, atau pilih label.</span>'}</div>` : '';
    return `<div class="row padat${kod === 'tiada' ? ' tiada' : ''}" role="button" tabindex="0" data-id="${esc(id)}">
      <div class="padat-baris"><span class="bil">Bil. ${esc(d.bil || '?')}</span><span class="who">${esc(d.penulis || 'Penulis belum diisi')}${d.tahun ? ' (' + esc(d.tahun) + ')' : ''}</span><span class="tag ${d.status === 'Selesai' ? 's-selesai' : d.status === 'Sedang dibaca' ? 's-sedang' : 's-belum'}"><span>${esc(d.status || 'Belum dibaca')}</span></span><span class="row-title padat-tajuk" title="${esc(d.tajuk || '')}">${esc(d.tajuk || 'Tajuk belum diisi')}</span><span class="padat-chips">${d.relevansi ? `<span class="tag ${d.relevansi === 'Tinggi' ? 'r-tinggi' : d.relevansi === 'Sederhana-Tinggi' ? 'r-sed-tinggi' : d.relevansi === 'Sederhana' ? 'r-sed' : 'r-rendah'}"><span>${esc(d.relevansi)}</span></span>` : ''}${nF ? `<span class="tag pdf"><span>PDF</span></span>` : ''}</span><span class="row-meta">${R.metaMasa ? R.metaMasa(d) : esc(R.fmtTime(d.dikemaskini))}</span></div>${label}
    </div>`;
  }
  function html(arr) {
    const g = kumpul(arr); const lipat = R.S.lipat || {};
    return URUTAN.filter(k => g[k].length).map(k => {
      const items = g[k]; const n = items.length; const selesai = items.filter(x => x[1].status === 'Selesai').length, sedang = items.filter(x => x[1].status === 'Sedang dibaca').length; const belum = n - selesai - sedang;
      const yakin = k === 'tiada' ? items.filter(([id]) => { const c = cadang(id); return c && c.yakin; }).length : 0;
      const tutup = !!lipat[k];
      return `<section class="kum ${k}${tutup ? ' tutup' : ''}" data-kum="${k}"><div class="kum-head"><button class="kum-lipat" data-lipat="${k}" aria-expanded="${tutup ? 'false' : 'true'}" title="${tutup ? 'Buka kumpulan' : 'Lipat kumpulan'}">${tutup ? '&#9656;' : '&#9662;'}</button><span class="kum-dot"></span><h3>${k === 'tiada' ? 'Belum dilabel' : esc(NAMA[k])}</h3><span class="kum-kira">${n} artikel · ${selesai} selesai · ${sedang} sedang dibaca · ${belum} belum</span><span class="spacer"></span>${k === 'tiada' && yakin ? `<button class="btn btn-sm btn-primary" data-terima-semua="1" title="Tetapkan Tema utama bagi setiap artikel yang cadangannya pasti">Terima ${yakin} cadangan yang pasti</button>` : ''}</div><div class="kum-badan"${tutup ? ' hidden' : ''}>${items.map(([id, d]) => barisPadat(id, d, k)).join('')}</div></section>`;
    }).join('');
  }

  /* ---- tindakan ---- */
  async function label(id, kod) {
    const tema = NAMA[kod]; if (!tema || !R.S.docs.has(id)) return;
    try { await R.writeNow(id, { tema }); toast('Bil. ' + (rekod(id).bil || '?') + ' dilabel ' + PENDEK[kod] + ' (Tema utama: ' + tema + ')'); } catch (e) { toast('Gagal melabel: ' + (e && e.message || e), true); }
    R.renderList();
  }
  async function terimaSemua() {
    const calon = []; R.S.docs.forEach((d0, id) => { const d = rekod(id); if (kodTema(d) !== 'tiada') return; const c = cadang(id); if (c && c.yakin) calon.push({ id, c, d }); });
    if (!calon.length) { toast('Tiada cadangan yang pasti untuk diterima'); return; }
    const okk = await R.confirmBox('Terima semua cadangan label?', `${calon.length} artikel yang belum dilabel akan ditetapkan Tema utamanya mengikut cadangan (${['kd', 'ppo', 'kdg'].map(k => PENDEK[k] + ' ' + calon.filter(x => x.c.kod === k).length).join(', ')}). Label boleh ditukar bila-bila masa dalam rekod atau melalui cip label.`, 'Terima', false);
    if (!okk) return; let n = 0;
    for (const x of calon) { try { await R.writeNow(x.id, { tema: x.c.tema }); n++; } catch (e) {} }
    toast(n + ' artikel dilabel mengikut cadangan'); R.renderList();
  }
  function lipat(kod) { R.S.lipat = R.S.lipat || {}; R.S.lipat[kod] = !R.S.lipat[kod]; R.savePrefs(); R.renderList(); }

  /* ---- senarai juntai artikel yang dikongsi (Banding, Artikel sumber, pasangan soal jawab, Tambah hubungan sintesis): optgroup mengikut
     pemboleh ubah (KD, PPO, KDG, Lain, kemudian Belum dilabel) dengan bilangan mengikut status; dalam setiap kumpulan Selesai dahulu,
     kemudian Sedang dibaca dan Belum dibaca, mengikut Bil.; setiap baris membawa status, Bil., penulis, tahun, kelengkapan A hingga F
     dan tajuk supaya semua maklumat kekal walaupun dikelompokkan. ---- */
  const GLIF = { 0: '\u2714 Selesai', 1: '\u25D0 Sedang', 2: '\u25CB Belum' };
  function pilihanHtml(o) {
    o = o || {}; const kecuali = new Set(o.kecuali || []); const dipilih = new Set(o.dipilih || []); const lumpuh = new Set(o.lumpuh || []); const pilih = o.pilih || '';
    const ids = (o.ids || Array.from(R.S.docs.keys())).filter(id => !kecuali.has(id) && R.S.docs.has(id));
    const g = {}; URUTAN.forEach(k => { g[k] = []; }); ids.forEach(id => { const d = rekod(id); g[kodTema(d)].push([id, d]); });
    const susun = ['kd', 'ppo', 'kdg', 'lain', 'tiada'];
    return susun.filter(k => g[k].length).map(k => {
      const items = g[k].sort((x, y) => pangkatStatus(x[1]) - pangkatStatus(y[1]) || (Number(x[1].bil) || 0) - (Number(y[1].bil) || 0));
      const n = items.length, selesai = items.filter(x => pangkatStatus(x[1]) === 0).length, sedang = items.filter(x => pangkatStatus(x[1]) === 1).length;
      const label = `${k === 'tiada' ? 'Belum dilabel' : NAMA[k]} (${n} artikel: ${selesai} selesai, ${sedang} sedang dibaca, ${n - selesai - sedang} belum dibaca)`;
      return `<optgroup label="${esc(label)}">${items.map(([id, d]) => { const kl = R.Banding ? R.Banding.kelengkapan(d) : null; const lengkap = kl ? (kl.ok ? '[A hingga F lengkap]' : '[belum lengkap: ' + kl.bahagian.filter(b => !b.ok).map(b => b.letter).join('') + ']') : ''; return `<option value="${esc(id)}"${id === pilih ? ' selected' : ''}${lumpuh.has(id) || dipilih.has(id) ? ' disabled' : ''}>${GLIF[pangkatStatus(d)]} \u00b7 Bil. ${esc(d.bil || '?')} ${esc((d.penulis || 'Penulis belum diisi') + (d.tahun ? ' (' + d.tahun + ')' : ''))} ${lengkap} ${esc(String(d.tajuk || 'Tajuk belum diisi').slice(0, 70))}${dipilih.has(id) ? ' (sudah dipilih)' : ''}</option>`; }).join('')}</optgroup>`;
    }).join('');
  }
  return { html, cadang, kumpul, label, terimaSemua, lipat, pilihanHtml, URUTAN, NAMA, PENDEK };
}
