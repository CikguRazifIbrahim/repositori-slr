/* Tulisan Tesis: buku nota penulisan Prof Dr di dalam sistem, disusun mengikut Bab 1 hingga Bab 5 dan seksyen. Sistem ialah
   sumber kebenaran tunggal: setiap seksyen disimpan automatik (Firestore meta/tulisan_b<N> dan salinan tempatan) dan disegerakkan
   antara peranti, maka tiada yang hilang dan tiada yang ditaip dua kali. MS Word ialah pintu masuk dan keluar: "Muat turun Word"
   menjana .docx bab (Times New Roman 12, langkau dua) dan menandakan bab itu "dipinjam keluar"; "Muat naik Word" membaca .docx,
   memadankan seksyen mengikut tajuk, menunjukkan pratonton gabungan (berserta amaran jika versi sistem lebih baharu daripada fail)
   dan hanya kemudian menimpa; setiap fail disimpan dalam subfolder Tulisan di Google Drive sebagai arkib. Peringatan dipaparkan
   selagi bab yang dipinjam keluar belum dimuat naik semula. Log harian merekodkan patah perkataan yang ditulis bagi setiap seksyen
   supaya esoknya Prof Dr nampak apa yang sudah ditulis semalam. */
export function initTulisan(R) {
  const { $, $$, esc, toast } = R;
  const BAB = [[1, 'Pengenalan'], [2, 'Sorotan Literatur'], [3, 'Metodologi'], [4, 'Dapatan Kajian'], [5, 'Perbincangan dan Kesimpulan']];
  const SUB = 'Tulisan';
  const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const T = { bab: 2, docs: {}, sek: null, timers: {}, loaded: false, bundle: null, cari: '', status: {}, mula: false };

  /* ---- utiliti ---- */
  const hariIni = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tarikhStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const patah = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const idBaru = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const norm = s => String(s || '').toLowerCase().replace(/^\s*(bab\s*\d+[.:]?\s*)?/i, '').replace(/^[\d.]+\s*/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const tajukBab = n => { const b = BAB.find(x => x[0] === n); return b ? b[1] : 'Bab ' + n; };
  const kunci = n => 'meta/tulisan_b' + n;
  const lsKey = n => 'rslr_tulisan_b' + n;
  function kosongDoc(n) { return { bab: n, tajuk: tajukBab(n), seksyen: {}, susunan: [], masa: 0, pinjam: null, log: {}, fail: [] }; }
  function doc(n) { if (!T.docs[n]) T.docs[n] = R.lsGet(lsKey(n), null) || kosongDoc(n); return T.docs[n]; }
  function senarai(n) { const d = doc(n); const ids = (d.susunan || []).filter(id => d.seksyen[id] && !d.seksyen[id].padam); Object.keys(d.seksyen).forEach(id => { if (!d.seksyen[id].padam && !ids.includes(id)) ids.push(id); }); return ids; }
  function gabung(a, b) {
    /* Gabungan dua salinan dokumen bab (tempatan dan awan): setiap seksyen diambil daripada salinan yang lebih baharu. */
    const out = kosongDoc(a.bab || b.bab); out.tajuk = a.tajuk || b.tajuk || out.tajuk;
    const ids = new Set(Object.keys(a.seksyen || {}).concat(Object.keys(b.seksyen || {})));
    ids.forEach(id => { const x = (a.seksyen || {})[id], y = (b.seksyen || {})[id]; out.seksyen[id] = !x ? y : !y ? x : (y.masa || 0) > (x.masa || 0) ? y : x; });
    const baru = (b.masa || 0) >= (a.masa || 0) ? b : a; const lama = baru === a ? b : a;
    out.susunan = (baru.susunan || []).slice(); (lama.susunan || []).forEach(id => { if (!out.susunan.includes(id)) out.susunan.push(id); });
    out.masa = Math.max(a.masa || 0, b.masa || 0);
    out.pinjam = (b.masa || 0) >= (a.masa || 0) ? (b.pinjam || null) : (a.pinjam || null);
    out.log = Object.assign({}, a.log || {}, b.log || {}); Object.keys(out.log).forEach(k => { if (a.log && b.log && a.log[k] && b.log[k]) out.log[k] = (a.log[k].patah || 0) >= (b.log[k].patah || 0) ? a.log[k] : b.log[k]; });
    const fail = {}; (a.fail || []).concat(b.fail || []).forEach(f => { fail[f.id || f.nama + f.masa] = f; }); out.fail = Object.values(fail).sort((x, y) => (y.masa || 0) - (x.masa || 0)).slice(0, 60);
    return out;
  }

  /* ---- muat dan simpan ---- */
  async function muatBab(n) {
    const lokal = R.lsGet(lsKey(n), null) || kosongDoc(n); let awan = null;
    try { awan = await R.db().get(kunci(n)); } catch (e) { T.status.awan = 'gagal'; }
    const d = awan ? gabung(lokal, awan) : lokal; T.docs[n] = d; R.lsSet(lsKey(n), d); return d;
  }
  async function muatSemua() { for (const [n] of BAB) await muatBab(n); T.loaded = true; }
  async function simpanAwan(n, patch) {
    const d = doc(n); R.lsSet(lsKey(n), d);
    try { await R.db().set(kunci(n), Object.assign({ bab: n, tajuk: d.tajuk, masa: d.masa }, patch), true); T.status.awan = 'ok'; return true; }
    catch (e) { T.status.awan = 'gagal'; console.warn('tulisan: simpanan awan gagal', e); return false; }
  }
  function catatLog(d, id, delta) {
    if (!delta) return; const h = hariIni(); d.log = d.log || {}; const l = d.log[h] || { patah: 0, seksyen: {} };
    l.patah = (l.patah || 0) + delta; l.seksyen = l.seksyen || {}; l.seksyen[id] = (l.seksyen[id] || 0) + delta; d.log[h] = l;
    const keys = Object.keys(d.log).sort(); while (keys.length > 90) delete d.log[keys.shift()];
  }
  function tulisSeksyen(n, id, patch, opts) {
    opts = opts || {}; const d = doc(n); const s = d.seksyen[id] || { tajuk: '', teks: '', cipta: Date.now(), masa: 0, patah: 0 };
    const lama = s.patah || 0; Object.assign(s, patch); s.masa = Date.now(); s.patah = patah(s.teks); d.seksyen[id] = s;
    if (!d.susunan.includes(id)) d.susunan.push(id);
    catatLog(d, id, s.patah - lama); d.masa = s.masa;
    R.lsSet(lsKey(n), d); setStatus('Menyimpan');
    clearTimeout(T.timers[n + ':' + id]);
    T.timers[n + ':' + id] = setTimeout(async () => { const ok = await simpanAwan(n, { seksyen: { [id]: d.seksyen[id] }, susunan: d.susunan, log: d.log, masa: d.masa }); setStatus(ok ? 'Disimpan ' + R.fmtTime(Date.now()) : 'Disimpan pada peranti ini sahaja (awan menolak)'); if (!opts.senyap) { renderSenarai(); renderBab(); } }, opts.segera ? 0 : 1200);
  }
  function setStatus(t) { const el = $('#tulStatus'); if (el) el.textContent = t; }

  /* ---- seksyen ---- */
  function seksyenBaru(n, tajuk, teks, sumber) {
    const id = idBaru(); const d = doc(n); d.seksyen[id] = { tajuk: tajuk || '', teks: teks || '', cipta: Date.now(), masa: 0, patah: 0, sumber: sumber || null };
    d.susunan.push(id); tulisSeksyen(n, id, {}, { segera: true }); return id;
  }
  function padamSeksyen(n, id) { const d = doc(n); if (!d.seksyen[id]) return; tulisSeksyen(n, id, { padam: true }, { segera: true }); if (T.sek === id) T.sek = null; }
  function gerak(n, id, arah) { const d = doc(n); const ids = senarai(n); const i = ids.indexOf(id); const j = i + arah; if (i < 0 || j < 0 || j >= ids.length) return; ids.splice(i, 1); ids.splice(j, 0, id); d.susunan = ids.concat(Object.keys(d.seksyen).filter(k => !ids.includes(k))); d.masa = Date.now(); R.lsSet(lsKey(n), d); simpanAwan(n, { susunan: d.susunan, masa: d.masa }); renderSenarai(); }

  /* ---- paparan ---- */
  function show() { if (!T.mula) { T.mula = true; muatSemua().then(() => { renderSemua(); peringatan(); }); } renderSemua(); }
  function renderSemua() { renderBab(); renderSenarai(); renderEditor(); renderSambung(); renderCari(); }
  function jumlahPatah(n) { return senarai(n).reduce((s, id) => s + (doc(n).seksyen[id].patah || 0), 0); }
  function renderBab() {
    const el = $('#tulBab'); if (!el) return;
    el.innerHTML = BAB.map(([n, t]) => { const d = doc(n); return `<button class="tul-tab${n === T.bab ? ' on' : ''}" data-bab="${n}"><span class="b">Bab ${n}</span><span class="t">${esc(t)}</span><span class="m">${senarai(n).length} seksyen · ${jumlahPatah(n)} patah${d.pinjam ? ' · <b class="pinjam">dipinjam ke Word</b>' : ''}</span></button>`; }).join('');
  }
  function renderSenarai() {
    const el = $('#tulSenarai'); if (!el) return; const n = T.bab; const d = doc(n); const ids = senarai(n);
    const pj = d.pinjam ? `<div class="tul-pinjam">Bab ${n} dimuat turun sebagai Word pada ${esc(R.fmtTime(d.pinjam.masa))} (${esc(d.pinjam.fail || '')}) dan belum dimuat naik semula. Jika Prof Dr menaip dalam fail itu, muat naik dahulu sebelum menyunting di sini supaya tidak wujud dua versi. <button class="btn btn-sm" data-tulnaik="1">Muat naik Word</button> <button class="btn btn-sm" data-pinjamtutup="${n}" title="Fail Word itu tidak disunting; batalkan peringatan">Tidak disunting</button></div>` : '';
    el.innerHTML = pj + (ids.length ? ids.map(id => { const s = d.seksyen[id]; return `<div class="tul-item${id === T.sek ? ' on' : ''}" data-sek="${esc(id)}" role="button" tabindex="0"><div class="tj">${esc(s.tajuk || 'Tanpa tajuk')}</div><div class="mt">${s.patah || 0} patah · ${s.masa ? esc(R.fmtTime(s.masa)) : 'belum disunting'}${s.sumber ? ' · ' + esc(s.sumber.jenis === 'banding' ? 'daripada Banding' : s.sumber.jenis === 'word' ? 'daripada Word' : s.sumber.jenis === 'artikel' ? 'daripada rekod' : '') : ''}</div></div>`; }).join('') : `<div class="help">Bab ${n} belum ada seksyen. Klik "Seksyen baharu" untuk mula menulis, atau muat naik fail Word.</div>`);
  }
  function renderEditor() {
    const el = $('#tulEditor'); if (!el) return; const n = T.bab; const d = doc(n); const s = T.sek ? d.seksyen[T.sek] : null;
    if (!s || s.padam) { el.innerHTML = `<div class="tul-kosong"><h3>Pilih seksyen di sebelah kiri atau cipta seksyen baharu</h3><p>Setiap seksyen disimpan automatik ke awan beberapa saat selepas Prof Dr berhenti menaip, dan disegerakkan ke semua peranti. Tulis dalam bentuk perenggan; pisahkan perenggan dengan satu baris kosong. Tanda **tebal** dan *condong* dikekalkan apabila dimuat turun sebagai Word.</p></div>`; return; }
    el.innerHTML = `<div class="tul-ed-head"><input id="tulTajuk" class="tul-tajuk" placeholder="Tajuk seksyen, contohnya 2.3 Kepimpinan digital dan pengurusan pengetahuan" value="${esc(s.tajuk || '')}"><div class="tul-ed-acts"><button class="btn btn-sm" data-gerak="-1" title="Alih ke atas">Atas</button><button class="btn btn-sm" data-gerak="1" title="Alih ke bawah">Bawah</button><button class="btn btn-sm" data-salin="1">Salin teks</button><button class="btn btn-sm btn-danger" data-padamsek="1">Padam</button></div></div>
      ${s.word && !(s.sumber && s.sumber.jenis === 'word') ? `<div class="tul-sumber">Dikemas kini daripada Word: ${esc(s.word.fail || '')} (${esc(R.fmtTime(s.word.masa || 0))})</div>` : ''}
      ${s.sumber ? `<div class="tul-sumber">${s.sumber.jenis === 'banding' ? `Ditulis daripada Banding Artikel: ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukabanding="${esc(s.sumber.idA)}|${esc(s.sumber.idB)}">Buka Banding</button>` : s.sumber.jenis === 'artikel' ? `Berkaitan rekod ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukarekod="${esc(s.sumber.id)}">Buka rekod</button>` : s.sumber.jenis === 'word' ? `Dimuat naik daripada Word: ${esc(s.sumber.fail || '')} (${esc(R.fmtTime(s.sumber.masa || 0))})` : ''}</div>` : ''}
      <textarea id="tulTeks" class="tul-teks" placeholder="Taip perenggan di sini. Satu baris kosong memisahkan perenggan.">${esc(s.teks || '')}</textarea>
      <div class="tul-ed-foot"><span id="tulPatah">${s.patah || 0} patah perkataan</span><span id="tulStatus">${s.masa ? 'Disimpan ' + esc(R.fmtTime(s.masa)) : 'Belum disimpan'}</span>${s.sejarah && s.sejarah.length ? `<button class="btn btn-sm" data-sejarah="1">Versi sebelum muat naik (${s.sejarah.length})</button>` : ''}</div>`;
    const ta = $('#tulTeks'); const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(260, ta.scrollHeight + 4) + 'px'; }; grow();
    ta.addEventListener('input', () => { grow(); $('#tulPatah').textContent = patah(ta.value) + ' patah perkataan'; tulisSeksyen(n, T.sek, { teks: ta.value }, { senyap: true }); });
    $('#tulTajuk').addEventListener('input', e => { tulisSeksyen(n, T.sek, { tajuk: e.target.value }, { senyap: true }); });
    $('#tulTajuk').addEventListener('change', () => renderSenarai());
    ta.addEventListener('blur', () => { renderSenarai(); renderBab(); });
  }
  function semuaSeksyen() { const out = []; BAB.forEach(([n]) => senarai(n).forEach(id => out.push({ n, id, s: doc(n).seksyen[id] }))); return out; }
  function renderSambung() {
    const el = $('#tulSambung'); if (!el) return;
    const semua = semuaSeksyen(); const terkini = semua.filter(x => x.s.masa).sort((a, b) => (b.s.masa || 0) - (a.s.masa || 0)).slice(0, 5);
    const h = hariIni(); const sm = tarikhStr(Date.now() - 86400000);
    const logHari = tgl => BAB.map(([n]) => { const l = (doc(n).log || {})[tgl]; if (!l) return null; const items = Object.keys(l.seksyen || {}).map(id => { const s = doc(n).seksyen[id]; return s ? `${esc(s.tajuk || 'Tanpa tajuk')} (${l.seksyen[id] >= 0 ? '+' : ''}${l.seksyen[id]})` : null; }).filter(Boolean); return `Bab ${n}: ${l.patah >= 0 ? '+' : ''}${l.patah} patah${items.length ? ' dalam ' + items.join(', ') : ''}`; }).filter(Boolean);
    const lh = logHari(h), ls = logHari(sm);
    const pinjam = BAB.filter(([n]) => doc(n).pinjam).map(([n]) => `Bab ${n} (sejak ${esc(R.fmtTime(doc(n).pinjam.masa))})`);
    const seminggu = BAB.reduce((s, [n]) => { const lg = doc(n).log || {}; return s + Object.keys(lg).filter(k => Date.now() - new Date(k + 'T00:00:00').getTime() < 7 * 86400000).reduce((a, k) => a + (lg[k].patah || 0), 0); }, 0);
    el.innerHTML = `<div class="tul-sambung-grid">
      <div><h3>Sambung semula</h3>${terkini.length ? terkini.map(x => `<button class="tul-link" data-buka="${x.n}|${esc(x.id)}"><b>${esc(x.s.tajuk || 'Tanpa tajuk')}</b> <span>Bab ${x.n} · ${esc(R.fmtTime(x.s.masa))} · ${x.s.patah || 0} patah</span></button>`).join('') : '<div class="help">Belum ada tulisan. Mulakan dengan seksyen pertama.</div>'}</div>
      <div><h3>Apa yang sudah ditulis</h3><div class="tul-log"><b>Hari ini:</b> ${lh.length ? esc(lh.join('; ')) : 'belum ada'}</div><div class="tul-log"><b>Semalam:</b> ${ls.length ? esc(ls.join('; ')) : 'tiada'}</div><div class="tul-log"><b>Tujuh hari terakhir:</b> ${seminggu >= 0 ? '+' : ''}${seminggu} patah perkataan; keseluruhan ${BAB.reduce((s, [n]) => s + jumlahPatah(n), 0)} patah dalam ${semua.length} seksyen.</div>${pinjam.length ? `<div class="tul-log amaran"><b>Peringatan:</b> ${pinjam.join(', ')} dimuat turun ke Word dan belum dimuat naik semula.</div>` : ''}${T.status.awan === 'gagal' ? '<div class="tul-log amaran"><b>Awan:</b> simpanan awan gagal; tulisan tersimpan pada peranti ini sahaja buat masa ini.</div>' : ''}</div></div></div>`;
  }
  function renderCari() {
    const el = $('#tulCariHasil'); if (!el) return; const q = (T.cari || '').trim().toLowerCase();
    if (q.length < 2) { el.hidden = true; el.innerHTML = ''; return; }
    const hits = semuaSeksyen().map(x => { const t = (x.s.tajuk || '') + '\n' + (x.s.teks || ''); const i = t.toLowerCase().indexOf(q); if (i < 0) return null; const a = Math.max(0, i - 90), b = Math.min(t.length, i + q.length + 120); return { x, snip: (a > 0 ? '... ' : '') + t.slice(a, i) + '[[' + t.slice(i, i + q.length) + ']]' + t.slice(i + q.length, b) + (b < t.length ? ' ...' : '') }; }).filter(Boolean);
    el.hidden = false;
    el.innerHTML = `<div class="help">${hits.length} seksyen mengandungi "${esc(q)}"</div>` + hits.map(h => `<button class="tul-link" data-buka="${h.x.n}|${esc(h.x.id)}"><b>Bab ${h.x.n} · ${esc(h.x.s.tajuk || 'Tanpa tajuk')}</b> <span>${esc(h.snip).replace(/\[\[/g, '<mark>').replace(/\]\]/g, '</mark>')}</span></button>`).join('');
  }
  function buka(n, id) { T.bab = n; T.sek = id; renderSemua(); const ta = $('#tulTeks'); if (ta) { ta.focus(); } }
  function peringatan() {
    const p = BAB.filter(([n]) => doc(n).pinjam);
    if (p.length) toast('Peringatan Tulisan: ' + p.map(([n]) => 'Bab ' + n).join(', ') + ' dimuat turun ke Word dan belum dimuat naik semula.', false, { label: 'Buka Tulisan', fn: () => R.goView('tulisan') });
  }

  /* ---- Word: penjanaan ---- */
  async function bundle() { if (!T.bundle) T.bundle = await import('../vendor/tulisan.bundle.js'); return T.bundle; }
  function runs(docx, teks) {
    const out = []; const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g; let last = 0; let m;
    while ((m = re.exec(teks))) { if (m.index > last) out.push(new docx.TextRun(teks.slice(last, m.index))); const t = m[0]; if (t.startsWith('**')) out.push(new docx.TextRun({ text: t.slice(2, -2), bold: true })); else out.push(new docx.TextRun({ text: t.slice(1, -1), italics: true })); last = m.index + t.length; }
    if (last < teks.length) out.push(new docx.TextRun(teks.slice(last)));
    return out.length ? out : [new docx.TextRun('')];
  }
  function perenggan(docx, teks) {
    const out = []; String(teks || '').replace(/\r/g, '').split(/\n\s*\n/).forEach(blok => {
      const b = blok.trim(); if (!b) return;
      const baris = b.split('\n'); const butir = baris.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l));
      if (butir) baris.forEach(l => out.push(new docx.Paragraph({ children: runs(docx, l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')), numbering: { reference: 'butir', level: 0 }, spacing: { line: 480 }, alignment: docx.AlignmentType.JUSTIFIED })));
      else out.push(new docx.Paragraph({ children: runs(docx, baris.join(' ')), spacing: { line: 480, after: 0 }, alignment: docx.AlignmentType.JUSTIFIED, indent: { firstLine: 720 } }));
    });
    return out;
  }
  async function janaDocx(babs) {
    const { docx } = await bundle(); const kids = [];
    babs.forEach((n, i) => {
      const d = doc(n); const ids = senarai(n);
      kids.push(new docx.Paragraph({ text: `BAB ${n}`, heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, pageBreakBefore: i > 0 }));
      kids.push(new docx.Paragraph({ text: String(d.tajuk || tajukBab(n)).toUpperCase(), heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, spacing: { after: 480 } }));
      if (!ids.length) kids.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '(Bab ini belum ada seksyen dalam sistem.)', italics: true })] }));
      ids.forEach(id => { const s = d.seksyen[id]; kids.push(new docx.Paragraph({ text: s.tajuk || 'Tanpa tajuk', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 } })); kids.push(...perenggan(docx, s.teks)); });
    });
    const d = new docx.Document({
      creator: 'Repositori SLR', title: 'Tulisan Tesis ' + babs.map(n => 'Bab ' + n).join(', '),
      styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } }, paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 0, after: 120 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } }] },
      numbering: { config: [{ reference: 'butir', levels: [{ level: 0, format: docx.LevelFormat.BULLET, text: '•', alignment: docx.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 2160, right: 1440 } } }, footers: { default: new docx.Footer({ children: [new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [new docx.TextRun({ text: 'Tulisan Tesis, Repositori SLR, dijana ' + R.fmtTime(Date.now()) + '. Muat naik semula fail ini ke sistem selepas disunting.', size: 16, color: '777777' })] })] }) }, children: kids }]
    });
    return docx.Packer.toBlob(d);
  }
  function namaFail(babs) { const d = new Date(); const st = tarikhStr(d.getTime()) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0'); const b = babs.length === 1 ? 'Bab' + babs[0] + '_' + tajukBab(babs[0]).replace(/[^A-Za-z0-9]+/g, '_') : 'Bab' + babs[0] + '-' + babs[babs.length - 1]; return `Tesis_${b}_${st}.docx`; }
  async function muatTurun() {
    const html = `<p>Pilih bab untuk dimuat turun sebagai fail Word (.docx, Times New Roman 12, langkau dua, tajuk seksyen sebagai Heading 2).</p><select id="tulPilihBab" class="modal-in"><option value="${T.bab}">Bab ${T.bab} ${esc(tajukBab(T.bab))} (bab semasa)</option>${BAB.filter(([n]) => n !== T.bab).map(([n, t]) => `<option value="${n}">Bab ${n} ${esc(t)}</option>`).join('')}<option value="semua">Semua bab (Bab 1 hingga Bab 5) dalam satu fail</option></select><p class="help">Bab yang dimuat turun ditanda "dipinjam ke Word" sehingga fail itu dimuat naik semula, supaya Prof Dr diingatkan. Salinan fail disimpan dalam folder Tulisan di Google Drive.</p>`;
    const ok = await R.richModal('Muat turun Word', html, 'Muat turun', 'Batal'); if (!ok) return;
    const v = R.richModal.values.tulPilihBab; const babs = v === 'semua' ? BAB.map(x => x[0]) : [parseInt(v, 10)];
    toast('Menjana fail Word'); let blob;
    try { blob = await janaDocx(babs); } catch (e) { toast('Gagal menjana Word: ' + (e && e.message || e), true); return; }
    const nama = namaFail(babs); R.saveFile(nama, blob, MIME);
    let drive = false; try { if (R.drive().hasToken()) { const f = new File([blob], nama, { type: MIME }); const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); drive = !!(res && res.id); babs.forEach(n => { const d = doc(n); d.fail = [{ id: res.id, nama, masa: Date.now(), jenis: 'muatturun', saiz: blob.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); }); } } catch (e) { console.warn('tulisan: salinan Drive gagal', e); }
    for (const n of babs) { const d = doc(n); d.pinjam = { masa: Date.now(), fail: nama }; d.masa = Date.now(); await simpanAwan(n, { pinjam: d.pinjam, fail: d.fail || [], masa: d.masa }); }
    renderSemua(); toast(`Fail ${nama} dimuat turun${drive ? ' dan salinan disimpan dalam folder Tulisan di Drive' : ' (Drive tidak disambung; salinan tidak disimpan)'}. Muat naik semula selepas disunting.`);
  }

  /* ---- Word: pembacaan dan gabungan ---- */
  function teksNod(node) {
    let out = '';
    node.childNodes.forEach(c => {
      if (c.nodeType === 3) { out += c.nodeValue; return; }
      if (c.nodeType !== 1) return; const tag = c.tagName.toLowerCase(); const dalam = teksNod(c);
      if (tag === 'strong' || tag === 'b') out += dalam.trim() ? '**' + dalam.trim() + '**' + (/\s$/.test(dalam) ? ' ' : '') : dalam;
      else if (tag === 'em' || tag === 'i') out += dalam.trim() ? '*' + dalam.trim() + '*' + (/\s$/.test(dalam) ? ' ' : '') : dalam;
      else if (tag === 'br') out += '\n';
      else out += dalam;
    });
    return out;
  }
  function huraiHtml(html, namaFail) {
    const dom = new DOMParser().parseFromString(html, 'text/html'); const kumpulan = []; let semasa = null; let sek = null;
    const bukaKumpulan = (bab, tajuk) => { semasa = { bab, tajuk, seksyen: [] }; kumpulan.push(semasa); sek = null; };
    const tambahBlok = teks => { teks = teks.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); if (!teks) return; if (!semasa) bukaKumpulan(null, ''); if (!sek) { sek = { tajuk: 'Tanpa tajuk (' + namaFail.replace(/\.docx$/i, '') + ')', teks: '' }; semasa.seksyen.push(sek); } sek.teks += (sek.teks ? '\n\n' : '') + teks; };
    Array.from(dom.body.children).forEach(el => {
      const tag = el.tagName.toLowerCase(); const t = teksNod(el).replace(/\s+/g, ' ').trim();
      if (tag === 'h1') { const m = /^\s*bab\s*(\d)\b[\s.:-]*(.*)$/i.exec(t); if (m) { const n = parseInt(m[1], 10); if (semasa && semasa.bab === n && !semasa.seksyen.length) { if (m[2]) semasa.tajuk = m[2]; } else bukaKumpulan(n, m[2] || ''); return; } if (semasa && !semasa.tajuk && !semasa.seksyen.length && semasa.bab) { semasa.tajuk = t; return; } if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: t, teks: '' }; semasa.seksyen.push(sek); return; }
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') { if (!t) return; if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: t, teks: '' }; semasa.seksyen.push(sek); return; }
      if (tag === 'p') { tambahBlok(teksNod(el)); return; }
      if (tag === 'ul' || tag === 'ol') { tambahBlok(Array.from(el.querySelectorAll('li')).map(li => '- ' + teksNod(li).replace(/\s+/g, ' ').trim()).join('\n')); return; }
      if (tag === 'table') { tambahBlok(Array.from(el.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => teksNod(td).replace(/\s+/g, ' ').trim()).join(' | ')).join('\n')); return; }
      if (t) tambahBlok(t);
    });
    kumpulan.forEach(k => { k.seksyen = k.seksyen.filter(s => s.tajuk || s.teks.trim()); k.seksyen.forEach(s => { s.teks = s.teks.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }); });
    return kumpulan.filter(k => k.seksyen.length);
  }
  function babDariNama(nama) { const m = /bab[\s_-]*(\d)/i.exec(nama || ''); return m ? parseInt(m[1], 10) : null; }
  async function muatNaik(files) {
    files = Array.from(files || []).filter(f => /\.docx$/i.test(f.name)); if (!files.length) { toast('Pilih fail Word (.docx)', true); return; }
    let lib; try { lib = await bundle(); } catch (e) { toast('Pembaca Word gagal dimuatkan; semak talian internet.', true); return; }
    for (const f of files) {
      let html; try { const ab = await f.arrayBuffer(); html = (await lib.mammoth.convertToHtml({ arrayBuffer: ab })).value; } catch (e) { toast('Fail ' + f.name + ' tidak dapat dibaca sebagai Word: ' + (e && e.message || e), true); continue; }
      const kumpulan = huraiHtml(html, f.name);
      if (!kumpulan.length) { toast('Fail ' + f.name + ' tidak mengandungi teks yang dapat dibaca', true); continue; }
      const tekaNama = babDariNama(f.name);
      for (const k of kumpulan) {
        let n = k.bab || (kumpulan.length === 1 ? tekaNama : null);
        if (!n) { const okk = await R.richModal('Bab untuk ' + f.name, `<p>Bab tidak dapat dikenal pasti daripada tajuk "Bab N" atau nama fail. Pilih bab bagi ${k.seksyen.length} seksyen ini (${esc(k.seksyen.map(s => s.tajuk).slice(0, 3).join('; '))}${k.seksyen.length > 3 ? '; ...' : ''}).</p><select id="tulBabPilih" class="modal-in">${BAB.map(([b, t]) => `<option value="${b}"${b === T.bab ? ' selected' : ''}>Bab ${b} ${esc(t)}</option>`).join('')}</select>`, 'Teruskan', 'Langkau'); if (!okk) continue; n = parseInt(R.richModal.values.tulBabPilih, 10); }
        await gabungWord(n, k, f);
      }
    }
    renderSemua();
  }
  async function gabungWord(n, k, f) {
    const d = doc(n); const ids = senarai(n); const dipakai = new Set();
    const padan = s => { const nt = norm(s.tajuk); let id = ids.find(x => !dipakai.has(x) && norm(d.seksyen[x].tajuk) === nt && nt); if (!id && nt) id = ids.find(x => !dipakai.has(x) && (norm(d.seksyen[x].tajuk).startsWith(nt) || nt.startsWith(norm(d.seksyen[x].tajuk))) && norm(d.seksyen[x].tajuk)); if (id) dipakai.add(id); return id || null; };
    const failMasa = f.lastModified || Date.now();
    const baris = k.seksyen.map((s, i) => { const id = padan(s); const lama = id ? d.seksyen[id] : null; const sama = lama && (lama.teks || '').trim() === s.teks.trim(); const sistemBaharu = lama && (lama.masa || 0) > failMasa + 60000 && !sama; return { i, s, id, lama, status: !lama ? 'baharu' : sama ? 'sama' : 'ubah', sistemBaharu, pilih: !lama || (!sama && !sistemBaharu) }; });
    const tiada = ids.filter(id => !dipakai.has(id));
    const adaAmaran = baris.some(b => b.sistemBaharu);
    const html = `<p>Fail <b>${esc(f.name)}</b> (diubah ${esc(R.fmtTime(failMasa))}) dibaca untuk <b>Bab ${n} ${esc(d.tajuk || tajukBab(n))}</b>: ${k.seksyen.length} seksyen. Tanda seksyen yang mahu dimasukkan ke sistem.</p>
      ${adaAmaran ? '<p class="tul-amaran">Amaran: sesetengah seksyen disunting dalam sistem SELEPAS fail Word ini diubah. Seksyen itu tidak ditanda supaya tulisan terbaru dalam sistem tidak ditimpa; tanda sendiri jika Prof Dr pasti fail Word lebih lengkap.</p>' : ''}
      <div class="tul-gabung">${baris.map(b => `<label class="tul-gabung-row"><input type="checkbox" id="tulPilih_${b.i}"${b.pilih ? ' checked' : ''}${b.status === 'sama' ? ' disabled' : ''}><span class="st ${b.status}">${b.status === 'baharu' ? 'Baharu' : b.status === 'sama' ? 'Sama' : 'Dikemas kini'}</span><span class="tj">${esc(b.s.tajuk || 'Tanpa tajuk')}</span><span class="mt">${b.lama ? (b.lama.patah || 0) + ' patah dalam sistem' + (b.lama.masa ? ' (' + esc(R.fmtTime(b.lama.masa)) + ')' : '') + ' → ' : ''}${patah(b.s.teks)} patah dalam Word${b.sistemBaharu ? ' · <b>sistem lebih baharu</b>' : ''}</span></label>`).join('')}</div>
      ${tiada.length ? `<p class="help">${tiada.length} seksyen dalam sistem tiada dalam fail Word ini dan dikekalkan: ${esc(tiada.map(id => d.seksyen[id].tajuk || 'Tanpa tajuk').join('; '))}.</p>` : ''}
      <p class="help">Versi lama setiap seksyen yang ditimpa disimpan dalam sistem (butang "Versi sebelum muat naik") dan fail Word ini diarkibkan dalam folder Tulisan di Google Drive.</p>`;
    const okk = await R.richModal('Muat naik Word: pratonton gabungan', html, 'Masukkan ke sistem', 'Batal'); if (!okk) return;
    const v = R.richModal.values; let dikemas = 0, baru = 0; const masaKini = Date.now();
    baris.forEach(b => {
      if (b.status === 'sama' || !v['tulPilih_' + b.i]) return;
      if (b.id) { const lama = d.seksyen[b.id]; lama.sejarah = [{ masa: lama.masa || 0, teks: lama.teks || '' }].concat(lama.sejarah || []).slice(0, 3); tulisSeksyen(n, b.id, { teks: b.s.teks, word: { fail: f.name, masa: masaKini } }, { senyap: true }); dikemas++; }
      else { seksyenBaru(n, b.s.tajuk, b.s.teks, { jenis: 'word', fail: f.name, masa: masaKini }); baru++; }
    });
    let drive = false;
    try { if (R.drive().hasToken()) { const nama = f.name.replace(/\.docx$/i, '') + '_dimuatnaik_' + tarikhStr(masaKini) + '.docx'; const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); if (res && res.id) { drive = true; d.fail = [{ id: res.id, nama, masa: masaKini, jenis: 'muatnaik', saiz: f.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); } } } catch (e) { console.warn('tulisan: arkib Drive gagal', e); }
    d.pinjam = null; d.masa = masaKini; Object.keys(T.timers).forEach(k => { clearTimeout(T.timers[k]); });
    await simpanAwan(n, { seksyen: d.seksyen, susunan: d.susunan, log: d.log, pinjam: null, fail: d.fail || [], masa: d.masa });
    T.bab = n; toast(`Bab ${n}: ${dikemas} seksyen dikemas kini, ${baru} seksyen baharu daripada ${f.name}${drive ? '; fail diarkibkan di Drive' : ''}.`);
  }
  async function sejarahModal(n, id) {
    const s = doc(n).seksyen[id]; const html = (s.sejarah || []).map((h, i) => `<details${i === 0 ? ' open' : ''}><summary>Versi ${i + 1}: ${esc(R.fmtTime(h.masa))}, ${patah(h.teks)} patah</summary><pre class="tul-pre">${esc(h.teks)}</pre><button class="btn btn-sm" data-pulih="${i}">Pulihkan versi ini</button></details>`).join('');
    const modal = $('#modalText'); const onClick = e => { const b = e.target.closest('[data-pulih]'); if (!b) return; const h = s.sejarah[+b.dataset.pulih]; s.sejarah = [{ masa: s.masa || 0, teks: s.teks || '' }].concat(s.sejarah).slice(0, 3); tulisSeksyen(n, id, { teks: h.teks }, { segera: true }); $('#modalOk').click(); renderSemua(); toast('Versi dipulihkan'); };
    modal.addEventListener('click', onClick); await R.richModal('Versi sebelum muat naik', html || '<p>Tiada versi tersimpan.</p>', 'Tutup'); modal.removeEventListener('click', onClick);
  }

  /* ---- daripada Banding dan rekod ---- */
  function daripadaBanding(n, tajuk, teks, idA, idB, label) { const id = seksyenBaru(n || 2, tajuk, teks, { jenis: 'banding', idA, idB, label }); T.bab = n || 2; T.sek = id; return id; }

  /* ---- peristiwa ---- */
  const root = $('#tulisan');
  if (root) {
    root.addEventListener('click', async e => {
      const tab = e.target.closest('[data-bab]'); if (tab) { T.bab = +tab.dataset.bab; T.sek = null; renderSemua(); return; }
      const it = e.target.closest('[data-sek]'); if (it) { T.sek = it.dataset.sek; renderSenarai(); renderEditor(); return; }
      const bk = e.target.closest('[data-buka]'); if (bk) { const [n, id] = bk.dataset.buka.split('|'); buka(+n, id); return; }
      const g = e.target.closest('[data-gerak]'); if (g) { gerak(T.bab, T.sek, +g.dataset.gerak); return; }
      if (e.target.closest('[data-salin]')) { try { await navigator.clipboard.writeText($('#tulTeks').value); toast('Teks seksyen disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
      if (e.target.closest('[data-padamsek]')) { const s = doc(T.bab).seksyen[T.sek]; const okk = await R.confirmBox('Padam seksyen?', `"${s.tajuk || 'Tanpa tajuk'}" (${s.patah || 0} patah) akan dipadam daripada Bab ${T.bab}.`, 'Padam'); if (okk) { padamSeksyen(T.bab, T.sek); renderSemua(); } return; }
      if (e.target.closest('[data-sejarah]')) { sejarahModal(T.bab, T.sek); return; }
      const pt = e.target.closest('[data-pinjamtutup]'); if (pt) { const n = +pt.dataset.pinjamtutup; const d = doc(n); d.pinjam = null; d.masa = Date.now(); await simpanAwan(n, { pinjam: null, masa: d.masa }); renderSemua(); return; }
      if (e.target.closest('[data-tulnaik]')) { $('#tulFail').click(); return; }
      const bb = e.target.closest('[data-bukabanding]'); if (bb) { const [a, b] = bb.dataset.bukabanding.split('|'); R.Banding.state.a = a; R.Banding.state.b = b; R.goView('banding'); R.Banding.banding(); return; }
      const br = e.target.closest('[data-bukarekod]'); if (br) { R.openRecord(br.dataset.bukarekod); }
    });
    root.addEventListener('keydown', e => { const it = e.target.closest('[data-sek]'); if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); T.sek = it.dataset.sek; renderSenarai(); renderEditor(); } });
    $('#btnTulSeksyen').addEventListener('click', () => { const id = seksyenBaru(T.bab, '', ''); T.sek = id; renderSemua(); const tj = $('#tulTajuk'); if (tj) tj.focus(); });
    $('#btnTulTurun').addEventListener('click', () => muatTurun());
    $('#btnTulNaik').addEventListener('click', () => $('#tulFail').click());
    $('#tulFail').addEventListener('change', e => { const fs = e.target.files; muatNaik(fs); e.target.value = ''; });
    $('#tulCari').addEventListener('input', e => { T.cari = e.target.value; renderCari(); });
  }
  return { show, muatTurun, muatNaik, daripadaBanding, muatSemua, peringatan, huraiHtml, state: T, BAB };
}
