/* Ruang Output SPSS dan AMOS (Pandu Tulis, folder Dapatan, Metodologi dan Perbincangan bagi artikel empirikal): tempat output analisis pemilik
   dikumpul, dilabel dan dipaparkan sebelum dilaporkan. Jadual ditampal terus daripada SPSS, AMOS atau Excel (Ctrl+V; jadual HTML atau teks
   berpemisah tab), rajah (contohnya rajah model AMOS, graf) dimuat naik atau ditampal sebagai imej. Setiap output diberi label, kategori
   (profil, deskriptif, model pengukuran, kesahan diskriminan, indeks padanan, model berstruktur, kesan tidak langsung, rajah model dan
   seterusnya mengikut jenis artikel) dan sumber. Senarai semak menunjukkan kategori yang belum ada. Output boleh disisip ke RAM atau ASAL
   dengan kapsyen Jadual atau Rajah, dan dihantar kepada agen (teks jadual; imej sebagai blok imej) supaya agen melaporkan HANYA angka sebenar.
   Meter "Angka dan output" menyemak angka perpuluhan dalam ASAL terhadap angka dalam output. Simpanan: meta/pandu_<id>__output
   (jadual sebagai HTML bersih; imej dalam simpanan rajah editor, meta/tulisan_imej_<id>). */
export function initOutput(X) {
  const { R, P, D, esc, toast, angka, idBaru, sekarang, kel, en, sasaranRam, sisip, Teks, A } = X;
  const O = { id: null, d: null, awan: {}, timer: null }; let ELF = null;
  const kunci = id => 'meta/pandu_' + id + '__output', ls = id => 'rslr_pandu_' + id + '__output';
  const HAD_ITEM = 24, HAD_HTML = 70000, HAD_JUMLAH = 650000, HAD_TEKS_AGEN = 5000, HAD_AGEN = 26000, HAD_IMEJ_AGEN = 3;
  const SUMBER = ['SPSS', 'AMOS', 'Excel', 'NVivo atau ATLAS.ti', 'Lain'];
  const kosong = () => ({ v: 1, item: [], masa: 0 });
  function data() {
    if (O.id !== P.id || !O.d) { O.id = P.id; O.d = Object.assign(kosong(), R.lsGet(ls(P.id), null) || {}); if (!Array.isArray(O.d.item)) O.d.item = []; muatAwan(P.id); }
    return O.d;
  }
  async function muatAwan(id) { if (O.awan[id]) return; O.awan[id] = true; try { const a = await R.db().get(kunci(id)); if (a && O.id === id && (a.masa || 0) > (O.d.masa || 0)) { O.d = Object.assign(kosong(), a); if (!Array.isArray(O.d.item)) O.d.item = []; R.lsSet(ls(id), O.d); if (ELF && ELF.el.isConnected) render(ELF.el, ELF.f); X.kemasBar(); } } catch (e) {} }
  function simpan(segera) { const id = O.id; if (!id) return; O.d.masa = sekarang(); R.lsSet(ls(id), O.d); const dd = O.d; clearTimeout(O.timer); O.timer = setTimeout(async () => { try { await R.db().set(kunci(id), dd); } catch (e) { console.warn('pandu: output awan gagal', e); toast('Output belum dapat disimpan ke awan; salinan tempatan dikekalkan', true); } }, segera ? 0 : 900); }
  const kategori = () => D.OUTPUT_KAT[kel()] || D.OUTPUT_KAT.kuan;
  const namaKat = k => (kategori().find(x => x[0] === k) || [k, 'Lain-lain'])[1];
  const wajib = () => kategori().map(x => x[0]).filter(k => k !== 'lain' && k !== 'cmb' && k !== 'petikan');

  /* ---- jadual: HTML papan klip kepada jadual bersih dan teks ---- */
  function jadualDariHtml(html) {
    const dom = new DOMParser().parseFromString(String(html || ''), 'text/html'); const out = [];
    dom.querySelectorAll('table').forEach(t => { if (t.closest('table') !== t && t.parentElement && t.parentElement.closest('table')) return; const bersih = Teks.bersihHtml(t.outerHTML); if (/<table/i.test(bersih)) out.push(bersih); });
    return out;
  }
  function jadualDariTeks(txt) {
    const baris = String(txt || '').replace(/\r/g, '').split('\n').map(x => x.replace(/\s+$/, '')).filter(x => x.trim()); if (baris.length < 2) return null;
    const tab = baris.filter(x => x.includes('\t')).length >= baris.length * 0.6; const sel = baris.map(x => tab ? x.split('\t') : x.trim().split(/\s{2,}/)); const maks = Math.max(...sel.map(x => x.length)); if (maks < 2) return null;
    return '<table><tbody>' + sel.map((r, i) => '<tr>' + Array.from({ length: maks }, (_, j) => `<${i === 0 ? 'th' : 'td'}>${esc((r[j] || '').trim())}</${i === 0 ? 'th' : 'td'}>`).join('') + '</tr>').join('') + '</tbody></table>';
  }
  function teksJadual(html) { const dom = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'); return Array.from(dom.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(c => (c.textContent || '').replace(/\s+/g, ' ').trim()).join(' | ')).join('\n'); }
  function tambahJadual(html, asal) {
    const d = data(); if (d.item.length >= HAD_ITEM) { toast(`Had ${HAD_ITEM} output dicapai. Buang output yang tidak dilaporkan dahulu.`, true); return false; }
    if (html.length > HAD_HTML) { toast('Jadual ini terlalu besar untuk disimpan. Tampal bahagian yang dilaporkan sahaja.', true); return false; }
    if (JSON.stringify(d.item).length + html.length > HAD_JUMLAH) { toast('Ruang Output hampir penuh. Buang output yang tidak diperlukan dahulu.', true); return false; }
    const teks = teksJadual(html); const tk = D.tekaOutput(teks + ' ' + (asal || '')); const sah = kategori().some(x => x[0] === tk.kat) ? tk.kat : 'lain';
    d.item.push({ id: idBaru('o'), jenis: 'jadual', label: '', kat: sah, sumber: SUMBER.includes(tk.sumber) ? tk.sumber : 'Lain', html, teks: teks.slice(0, 12000), nota: '', guna: true, masa: sekarang() }); return true;
  }
  async function tambahImej(blob, nama) {
    const d = data(); if (d.item.length >= HAD_ITEM) { toast(`Had ${HAD_ITEM} output dicapai. Buang output yang tidak dilaporkan dahulu.`, true); return false; }
    const r = await Teks.simpanImej(blob, { n: A.id, id: null, nama: nama || 'Output' }); const label = String(nama || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
    d.item.push({ id: idBaru('o'), jenis: 'imej', label: /^(image|imej|screenshot|tangkapan)/i.test(label) ? '' : label, kat: kategori().some(x => x[0] === 'rajahmodel') ? 'rajahmodel' : 'lain', sumber: 'AMOS', imej: r.id, nota: '', guna: true, masa: sekarang() }); return true;
  }
  async function tampal(e) {
    const cd = e.clipboardData; if (!cd) return; const fail = Array.from(cd.files || []).filter(f => /^image\//.test(f.type)); const html = cd.getData('text/html'); const txt = cd.getData('text/plain'); let n = 0;
    const tj = html ? jadualDariHtml(html) : [];
    if (tj.length) { for (const h of tj) if (tambahJadual(h, txt)) n++; }
    else if (fail.length) { for (const f of fail) { try { if (await tambahImej(f, f.name)) n++; } catch (er) { toast('Imej gagal disimpan: ' + (er && er.message || er), true); } } }
    else if (txt) { const h = jadualDariTeks(txt); if (h) { if (tambahJadual(h, txt)) n++; } else { toast('Kandungan yang ditampal bukan jadual. Salin jadual daripada tetingkap output SPSS atau AMOS (klik jadual, Ctrl+C), kemudian tampal di sini.', true); return; } }
    if (n) { simpan(true); toast(`${n} output ditambah. Semak label dan kategori setiap satu.`); if (ELF) render(ELF.el, ELF.f); X.kemasBar(); }
  }

  /* ---- semakan ---- */
  const normNombor = s => { const m = /^(-?)0?(\.\d+)$/.exec(s) || /^(-?)(\d+\.\d+)$/.exec(s); return m ? m[1] + m[2].replace(/^0(?=\.)/, '') : s; };
  function nomborDalam(teks) { return (String(teks || '').replace(/(\d),(\d{3})\b/g, '$1$2').match(/-?\d*\.\d{2,}/g) || []).map(x => x.replace(/^(-?)\./, '$10.')); }
  function semakAngka(u) {
    const d = data(); const tj = d.item.filter(x => x.jenis === 'jadual'); if (!tj.length) return null;
    const out = new Set(); tj.forEach(x => nomborDalam(x.teks).forEach(v => out.add(v))); const asal = Array.from(new Set(nomborDalam(String(u.teks).replace(/\bp\s*[<>=≤]\s*-?0?\.\d+/gi, ' ')))); const tiada = []; /* nilai ambang p (p < .001) tidak disemak: output memaparkannya sebagai bintang */
    asal.forEach(v => { const dp = (v.split('.')[1] || '').length; const a = Math.abs(parseFloat(v)); let jumpa = false; for (const w of out) { const b = Math.abs(parseFloat(w)); if (Math.abs(b - a) < 1e-9 || Number(b.toFixed(dp)) === a) { jumpa = true; break; } } if (!jumpa) tiada.push(normNombor(v)); });
    return { n: asal.length, tiada };
  }
  function liputan() { const d = data(); const ada = new Set(d.item.map(x => x.kat)); const w = wajib(); return { w, ada, tiada: w.filter(k => !ada.has(k)) }; }
  function meter(u) {
    const d = data(); const lp = liputan(); const butir = []; const m = [];
    if (!d.item.length) { m.push({ k: 'output', nama: 'Output analisis', nilai: 5, status: 'gagal', teks: 'belum ada output', butir: ['Tampal jadual SPSS dan AMOS serta muat naik rajah model dalam Ruang Output sebelum menulis Dapatan. Agen hanya melaporkan angka yang ada di sana.'] }); return m; }
    if (lp.tiada.length) butir.push('Kategori yang belum ada: ' + lp.tiada.map(namaKat).join('; ') + '.'); const tanpaLabel = d.item.filter(x => !String(x.label || '').trim()).length; if (tanpaLabel) butir.push(`${tanpaLabel} output belum berlabel; label menjadi tajuk Jadual atau Rajah.`);
    const nilai = Math.round(100 * (lp.w.length - lp.tiada.length) / Math.max(1, lp.w.length)); m.push({ k: 'output', nama: 'Output analisis', nilai: Math.max(5, nilai), status: !lp.tiada.length && !tanpaLabel ? 'ok' : nilai >= 50 ? 'amaran' : 'gagal', teks: `${d.item.length} output · ${lp.w.length - lp.tiada.length} daripada ${lp.w.length} kategori`, butir });
    const sa = u && u.teks ? semakAngka(u) : null;
    if (sa && sa.n) { const b2 = []; if (sa.tiada.length) b2.push(`Angka dalam ASAL yang tidak ditemui dalam output: ${sa.tiada.slice(0, 10).join(', ')}${sa.tiada.length > 10 ? ' dan ' + (sa.tiada.length - 10) + ' lagi' : ''}. Semak salah taip atau tampal jadual yang berkenaan.`);
      const sifar = (String(u.teks).match(/(?:\b(?:p|r|R2|R²|CFI|TLI|RMSEA|SRMR|GFI|AGFI|NFI|IFI|AVE)|[βαρ])\s*[=<>]\s*-?0\.\d+/g) || []); if (sifar.length) b2.push(`Gaya APA: nilai yang tidak boleh melebihi 1 ditulis tanpa sifar di hadapan (${sifar.slice(0, 4).map(x => x.replace(/\s+/g, ' ')).join('; ')}).`);
      const ok = sa.n - sa.tiada.length; m.push({ k: 'angka', nama: 'Angka dan output', nilai: Math.max(5, Math.round(100 * ok / sa.n)), status: !sa.tiada.length && !sifar.length ? 'ok' : sa.tiada.length > sa.n * 0.3 ? 'gagal' : 'amaran', teks: `${ok} daripada ${sa.n} angka perpuluhan dalam ASAL ditemui dalam output`, butir: b2 }); }
    return m;
  }
  function ringkas() { const d = data(); if (!d.item.length) return 'belum ada output'; const lp = liputan(); const nj = d.item.filter(x => x.jenis === 'jadual').length; return `${d.item.length} output (${nj} jadual, ${d.item.length - nj} rajah) · ${lp.w.length - lp.tiada.length} daripada ${lp.w.length} kategori`; }
  async function untukAgen(denganImej) {
    const d = data(); const guna = d.item.filter(x => x.guna !== false); if (!guna.length) return { teks: 'OUTPUT ANALISIS: belum ada dalam Ruang Output. Jangan mereka angka, nilai statistik atau keputusan hipotesis; gunakan penanda [ISI: ...].', imej: [], n: 0 };
    let baki = HAD_AGEN; const bah = []; const imej = []; let no = 0;
    for (const x of guna) { no++; const kepala = `[OUTPUT ${no}] ${x.label || '(belum berlabel)'} · kategori: ${namaKat(x.kat)} · sumber: ${x.sumber || 'Lain'}${x.nota ? ' · nota Prof Dr: ' + x.nota : ''}`;
      if (x.jenis === 'jadual') { const t = String(x.teks || '').slice(0, Math.min(HAD_TEKS_AGEN, Math.max(0, baki))); baki -= t.length; bah.push(kepala + '\n' + (t || '(teks jadual dipotong kerana had panjang)')); }
      else { bah.push(kepala + (denganImej && imej.length < HAD_IMEJ_AGEN ? '\n(imej disertakan di bawah mengikut urutan)' : '\n(rajah; tidak disertakan sebagai imej dalam panggilan ini)')); if (denganImej && imej.length < HAD_IMEJ_AGEN) { try { const r = await Teks.muatImej(x.imej); const m = r && /^data:([^;]+);base64,(.+)$/.exec(r.url); if (m) imej.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }); } catch (e) {} } } }
    return { teks: 'OUTPUT ANALISIS PROF DR (daripada Ruang Output; ini satu-satunya sumber angka dapatan, jangan mereka atau membundarkan secara berbeza; nilai yang tidak boleh melebihi 1 ditulis tanpa sifar di hadapan):\n\n' + bah.join('\n\n'), imej, n: guna.length };
  }

  /* ---- paparan ---- */
  function render(el, f) {
    if (!el) return; ELF = { el, f }; const d = data(); const lp = liputan(); const kual = kel() === 'kual';
    const kad = x => `<div class="ot-item" data-oid="${esc(x.id)}"><div class="ot-h"><span class="tag${x.jenis === 'imej' ? ' ai' : ''}"><span>${x.jenis === 'imej' ? 'Rajah' : 'Jadual'}</span></span><input type="text" data-ot="label" value="${esc(x.label || '')}" placeholder="${x.jenis === 'imej' ? 'Label rajah (contohnya Model berstruktur dengan pekali laluan piawai)' : 'Label jadual (contohnya Indeks padanan model pengukuran)'}"><select data-ot="kat">${kategori().map(([k, n]) => `<option value="${k}"${x.kat === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><select data-ot="sumber">${SUMBER.map(s => `<option${x.sumber === s ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
      <div class="ot-b">${x.jenis === 'imej' ? `<img data-imej="${esc(x.imej)}" alt="${esc(x.label || 'Rajah output')}">` : `<div class="ot-jadual">${x.html}</div>`}</div>
      <div class="ot-k"><input type="text" data-ot="nota" value="${esc(x.nota || '')}" placeholder="Nota kepada diri atau agen (pilihan), contohnya: laporkan baris H1 hingga H4 sahaja"><label class="ot-guna" title="Jika ditanda, output ini dihantar kepada agen apabila berbincang, mencadang atau menyemak folder Dapatan"><input type="checkbox" data-ot="guna"${x.guna !== false ? ' checked' : ''}> kepada agen</label><button class="btn btn-sm btn-primary" data-ota="ram">Sisip ke RAM</button><button class="btn btn-sm" data-ota="asal">Sisip ke ASAL</button><button class="btn btn-sm" data-ota="buang">Buang</button></div></div>`;
    el.innerHTML = `<p class="help">${kual ? 'Kumpulkan bahan dapatan di sini: jadual peserta, jadual atau peta tema, dan petikan terpilih.' : 'Kumpulkan output analisis di sini sebelum menulis Dapatan. <b>Jadual:</b> dalam tetingkap output SPSS atau AMOS (atau Excel), klik jadual, salin (Ctrl+C), kemudian tampal dalam kotak di bawah (Ctrl+V). <b>Rajah:</b> simpan rajah model AMOS atau graf sebagai PNG atau JPG, kemudian muat naik atau tampal.'} Setiap output diberi label dan kategori; agen hanya melaporkan angka yang ada di sini.</p>
      <div class="ot-tampal" tabindex="0" data-otz="1" title="Klik di sini, kemudian tekan Ctrl+V"><b>Klik di sini dan tampal (Ctrl+V)</b><span>jadual daripada SPSS, AMOS atau Excel, atau imej rajah</span></div>
      <div class="pd-acts"><label class="btn btn-sm">Muat naik rajah (PNG atau JPG)<input type="file" data-ot="fail" accept="image/png,image/jpeg" multiple hidden></label><span class="help">${d.item.length} daripada ${HAD_ITEM} output</span></div>
      <div class="ot-semak"><b>Senarai semak output ${esc(D.NAMA_KELUARGA[kel()] || '')}</b><ul>${lp.w.map(k => `<li class="${lp.ada.has(k) ? 'ok' : 'tiada'}">${esc(namaKat(k))}${lp.ada.has(k) ? ` <small>(${d.item.filter(x => x.kat === k).length})</small>` : ''}</li>`).join('')}</ul>${kual ? '' : '<p class="help">Urutan pelaporan yang lazim: profil responden, statistik deskriptif dan normaliti, model pengukuran (CFA, kebolehpercayaan, kesahan), indeks padanan, model berstruktur dan ujian hipotesis, kemudian kesan tidak langsung. Jadual yang padat lebih mudah dibaca sebagai graf.</p>'}</div>
      <div class="ot-senarai">${d.item.map(kad).join('') || '<div class="pd-kosong">Belum ada output. Tampal jadual pertama di atas.</div>'}</div>`;
    el.querySelectorAll('img[data-imej]').forEach(async im => { try { const r = await Teks.muatImej(im.dataset.imej); if (r) im.src = r.url; else im.alt = 'Rajah tidak dapat dimuatkan'; } catch (e) {} });
  }
  const itemDari = t => { const k = t.closest('[data-oid]'); return k ? data().item.find(x => x.id === k.dataset.oid) : null; };
  function htmlSisip(x) {
    const e = en(); const label = String(x.label || '').trim() || (x.jenis === 'imej' ? (e ? 'Figure title' : 'Tajuk rajah') : (e ? 'Table title' : 'Tajuk jadual'));
    if (x.jenis === 'imej') { return { perluImej: true, kap: `<p><em>${e ? 'Figure [n].' : 'Rajah [n].'} ${esc(label)}</em></p>`, label }; }
    return { html: `<p><strong>${e ? 'Table [n].' : 'Jadual [n].'} ${esc(label)}</strong></p>${x.html}<p><em>${e ? 'Source: ' : 'Sumber: '}${e ? 'output of ' : 'output '}${esc(x.sumber || 'analisis')}${x.nota ? '. ' + esc(x.nota) : ''}</em></p>` };
  }
  async function klik(e) {
    const z = e.target.closest('[data-otz]'); if (z) { z.focus(); return; }
    const b = e.target.closest('[data-ota]'); if (!b || !ELF) return; e.preventDefault(); const x = itemDari(b); if (!x) return; const a = b.dataset.ota; const d = data();
    if (a === 'buang') { const ok = await R.confirmBox('Buang output ini?', `"${x.label || (x.jenis === 'imej' ? 'Rajah' : 'Jadual') + ' tanpa label'}" dibuang daripada Ruang Output. Salinan yang sudah disisip ke RAM atau ASAL tidak disentuh.`, 'Buang'); if (!ok) return; d.item = d.item.filter(y => y.id !== x.id); simpan(true); render(ELF.el, ELF.f); X.kemasBar(); return; }
    const sid = sasaranRam(ELF.f); if (!sid) { toast('Seksyen folder ini tiada', true); return; } const mana = a === 'asal' ? 'asal' : 'ram'; const h = htmlSisip(x); let html = h.html;
    if (h.perluImej) { const r = await Teks.muatImej(x.imej); if (!r) { toast('Rajah tidak dapat dimuatkan daripada simpanan', true); return; } html = `<p><img data-imej="${esc(x.imej)}" src="${r.url}" alt="${esc(h.label)}"></p>${h.kap}`; }
    if (sisip(sid, mana, html)) { toast(`${x.jenis === 'imej' ? 'Rajah' : 'Jadual'} disisip ke ${mana === 'asal' ? 'ASAL' : 'RAM'} seksyen. Gantikan [n] dengan nombor sebenar.`); X.renderFolder(); }
  }
  function input(e) {
    const el = e.target; const m = el.dataset && el.dataset.ot; if (!m || !ELF) return;
    if (m === 'fail') { const fs = Array.from(el.files || []); el.value = ''; (async () => { let n = 0; for (const f of fs) { try { if (await tambahImej(f, f.name)) n++; } catch (er) { toast('Imej gagal disimpan: ' + (er && er.message || er), true); } } if (n) { simpan(true); toast(`${n} rajah ditambah`); render(ELF.el, ELF.f); X.kemasBar(); } })(); return; }
    const x = itemDari(el); if (!x) return; if (m === 'guna') x.guna = !!el.checked; else if (m === 'label' || m === 'nota') x[m] = el.value.slice(0, 300); else if (m === 'kat' || m === 'sumber') x[m] = el.value; else return;
    simpan(); if (m === 'kat') { render(ELF.el, ELF.f); } if (m === 'kat' || m === 'label') X.kemasBar();
  }
  const dalam = t => ELF && ELF.el.isConnected && ELF.el.contains(t);
  document.addEventListener('click', e => { if (dalam(e.target)) klik(e); });
  document.addEventListener('input', e => { if (dalam(e.target) && !(e.target.dataset && e.target.dataset.ot === 'fail')) input(e); });
  document.addEventListener('change', e => { if (dalam(e.target) && e.target.dataset && e.target.dataset.ot === 'fail') input(e); });
  document.addEventListener('paste', e => { if (!dalam(e.target)) return; const t = e.target; if (t.matches && t.matches('input[type="text"], textarea')) return; e.preventDefault(); tampal(e); });
  return { meter, ringkas, render, untukAgen, data, tambahJadual, tambahImej, jadualDariHtml, jadualDariTeks, semakAngka, liputan, simpan };
}
