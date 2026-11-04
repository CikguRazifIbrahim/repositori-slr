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
  /* ---- teks kaya ----
     Setiap seksyen menyimpan `html` (HTML yang telah disaring: perenggan, tebal, condong, garis bawah, superskrip, subskrip, senarai,
     jadual, rajah, pautan) dan `teks` (teks biasa yang diterbitkan daripadanya untuk kiraan patah, carian, panel Semalam dan gabungan).
     Seksyen lama yang hanya ada `teks` ditukar kepada HTML ketika dipaparkan dan disimpan sebagai HTML pada suntingan seterusnya.
     Rajah tidak disimpan dalam dokumen bab (had 1 MiB Firestore) tetapi dalam dokumen sendiri meta/tulisan_imej_<id>, dirujuk melalui
     atribut data-imej; saiznya dikecilkan (sisi terpanjang 1600 px, 600 KB) sebelum disimpan. */
  const el = tag => document.createElement(tag);
  const BLOK = /^(p|div|blockquote|figure|figcaption|section|article|header|footer|main|aside|pre|h[1-6]|ul|ol|table|li|center|form|fieldset|address|details|summary|nav|tbody|thead|tfoot|tr|td|th|dl|dt|dd|hr)$/;
  const INLINE = { strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'u', s: 's', strike: 's', del: 's', sup: 'sup', sub: 'sub', a: 'a' };
  const adaBlok = node => Array.from(node.querySelectorAll('*')).some(e => BLOK.test(e.tagName.toLowerCase()));
  /* Warna teks untuk melabel kepentingan: enam warna sederhana yang lazim dalam penulisan (nama, heks skrin terang, heks skrin gelap, maksud).
     Disimpan sebagai kelas w-<nama> supaya warna gelap dan terang ditentukan oleh CSS; warna daripada fail Word dipadankan ke warna terdekat. */
  const WARNA = { merah: ['#C0392B', '#FF8A80', 'paling mendesak untuk ditambah atau disunting'], biru: ['#2F6DB5', '#8FB8F0', 'kepentingan sederhana'], hijau: ['#2E8B57', '#7FD6A3', 'pilihan, boleh diganti atau dikekalkan'], oren: ['#D98324', '#F5B36B', 'perlu disemak'], ungu: ['#7B5EA7', '#C5A8EE', 'nota atau rujukan'], kelabu: ['#7A8694', '#A8B2BF', 'kurang penting'] };
  const heksWarna = nama => WARNA[nama] ? WARNA[nama][0] : null;
  const temaGelap = () => { const t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || (t !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); };
  const heksTema = nama => WARNA[nama] ? WARNA[nama][temaGelap() ? 1 : 0] : null;
  function rgbDari(v) {
    v = String(v || '').trim().toLowerCase(); let m;
    if ((m = /^#?([0-9a-f]{6})$/.exec(v))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    if ((m = /^#?([0-9a-f]{3})$/.exec(v))) return m[1].split('').map(x => parseInt(x + x, 16));
    if ((m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(v))) return [+m[1], +m[2], +m[3]];
    const nama = { red: '#C0392B', blue: '#2F6DB5', green: '#2E8B57', orange: '#D98324', purple: '#7B5EA7', gray: '#7A8694', grey: '#7A8694' }[v]; return nama ? rgbDari(nama) : null;
  }
  /* Padankan sebarang warna kepada palet: null jika hampir hitam atau hampir putih (warna lalai), jika tidak warna palet terdekat. */
  function padanWarna(v) {
    const c = rgbDari(v); if (!c) return null; const maks = Math.max(...c), min = Math.min(...c);
    if (maks < 0x58 || (min > 0xE0) || (maks - min < 0x18 && maks < 0x70)) return null;
    let terbaik = null, jarak = Infinity; Object.keys(WARNA).forEach(k => [0, 1].forEach(v => { const w = rgbDari(WARNA[k][v]); const d = Math.hypot(c[0] - w[0], c[1] - w[1], c[2] - w[2]); if (d < jarak) { jarak = d; terbaik = k; } }));
    return terbaik;
  }
  function warnaElemen(c) {
    const kelas = /(?:^|\s)w-(merah|biru|hijau|oren|ungu|kelabu)(?:\s|$)/.exec(c.getAttribute('class') || ''); if (kelas) return kelas[1];
    const gaya = c.getAttribute('style') || ''; const m = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(gaya); const v = m ? m[1] : c.tagName.toLowerCase() === 'font' ? c.getAttribute('color') : '';
    return v ? padanWarna(v) : null;
  }
  function imejBersih(c) {
    const im = el('img'); const id = (c.getAttribute('data-imej') || '').trim(); const src = c.getAttribute('src') || '';
    if (/^[a-z0-9]+$/i.test(id)) im.setAttribute('data-imej', id); else if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(src)) im.setAttribute('src', src); else return null;
    const alt = (c.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (alt) im.setAttribute('alt', alt); return im;
  }
  function salinInline(src, dst) {
    src.childNodes.forEach(c => {
      if (c.nodeType === 3) { dst.appendChild(document.createTextNode(c.nodeValue.replace(/[ ]/g, ' '))); return; }
      if (c.nodeType !== 1) return; const tag = c.tagName.toLowerCase();
      if (tag === 'img') { const im = imejBersih(c); if (im) dst.appendChild(im); return; }
      if (tag === 'br') { dst.appendChild(el('br')); return; }
      if (tag === 'script' || tag === 'style' || tag === 'template' || tag === 'noscript') return;
      if (tag === 'span' || tag === 'font') {
        /* span bergaya (Chrome dengan styleWithCSS, Google Docs, Word dalam talian): tebal, condong, garis bawah, coretan, superskrip, subskrip dan warna ditukar kepada tag */
        const w = warnaElemen(c); const gaya = (c.getAttribute('style') || '').toLowerCase(); const balut = [];
        if (/font-weight\s*:\s*(bold|bolder|[6-9]00)/.test(gaya)) balut.push('strong'); if (/font-style\s*:\s*(italic|oblique)/.test(gaya)) balut.push('em'); if (/text-decoration[^;]*underline/.test(gaya)) balut.push('u'); if (/text-decoration[^;]*line-through/.test(gaya)) balut.push('s'); if (/vertical-align\s*:\s*super/.test(gaya)) balut.push('sup'); else if (/vertical-align\s*:\s*sub/.test(gaya)) balut.push('sub'); if (w) balut.push('w-' + w);
        if (!balut.length) { salinInline(c, dst); return; }
        let luar = null, dalam = null; balut.forEach(t => { let e; if (t.startsWith('w-')) { e = el('span'); e.className = t; } else e = el(t); if (!luar) luar = e; else dalam.appendChild(e); dalam = e; });
        salinInline(c, dalam); if (dalam.childNodes.length) dst.appendChild(luar); return;
      }
      const map = INLINE[tag];
      if (map) {
        const e = el(map);
        if (map === 'a') { const href = (c.getAttribute('href') || '').trim(); if (!/^https?:\/\//i.test(href)) { salinInline(c, dst); return; } e.setAttribute('href', href); e.setAttribute('target', '_blank'); e.setAttribute('rel', 'noopener'); }
        salinInline(c, e); if (!e.childNodes.length) return; const wm = warnaElemen(c); if (wm) { const sp = el('span'); sp.className = 'w-' + wm; sp.appendChild(e); dst.appendChild(sp); } else dst.appendChild(e); return;
      }
      if (BLOK.test(tag)) { if (dst.childNodes.length) dst.appendChild(el('br')); salinInline(c, dst); return; }
      salinInline(c, dst);
    });
  }
  /* Sel dengan satu perenggan sahaja disimpan tanpa <p>; kepala jadual (th) yang keseluruhannya tebal dibuka kerana th memang tebal. Bentuk kanonik ini
     membolehkan fail Word yang dimuat turun lalu dimuat naik semula dikenali sebagai Sama. */
  function kemasSel(cell) {
    const anak = Array.from(cell.childNodes).filter(x => !(x.nodeType === 3 && !x.nodeValue.trim()));
    if (anak.length === 1 && anak[0].nodeType === 1 && anak[0].tagName === 'P') { const p = anak[0]; cell.innerHTML = ''; while (p.firstChild) cell.appendChild(p.firstChild); }
    if (cell.tagName === 'TH') { const a2 = Array.from(cell.childNodes).filter(x => !(x.nodeType === 3 && !x.nodeValue.trim())); if (a2.length === 1 && a2[0].nodeType === 1 && a2[0].tagName === 'STRONG') { const st = a2[0]; cell.innerHTML = ''; while (st.firstChild) cell.appendChild(st.firstChild); } }
  }
  function jadualBersih(c) {
    const t = el('table'); const tb = el('tbody'); let n = 0;
    Array.from(c.querySelectorAll('tr')).forEach(tr => {
      if (tr.closest('table') !== c) return; const r = el('tr');
      Array.from(tr.children).forEach(td => { const tg = td.tagName.toLowerCase(); if (tg !== 'td' && tg !== 'th') return; const cell = el(tg); ['colspan', 'rowspan'].forEach(a => { const v = parseInt(td.getAttribute(a), 10); if (v > 1 && v < 60) cell.setAttribute(a, v); }); if (adaBlok(td)) { const tmp = el('div'); salinBlok(td, tmp); Array.from(tmp.childNodes).forEach(x => cell.appendChild(x)); } else salinInline(td, cell); kemasSel(cell); if (!cell.childNodes.length) cell.appendChild(el('br')); r.appendChild(cell); n++; });
      if (r.childNodes.length) tb.appendChild(r);
    });
    if (!n) return null;
    /* Word sering menanda setiap baris sebagai baris kepala (mammoth memulangkan th bagi semuanya); jika semua baris th, hanya baris pertama kekal kepala. */
    const rows = Array.from(tb.children); if (rows.length > 1 && rows.every(r => Array.from(r.children).every(c => c.tagName === 'TH'))) rows.slice(1).forEach(r => Array.from(r.children).forEach(c => { const td = el('td'); ['colspan', 'rowspan'].forEach(a => { if (c.hasAttribute(a)) td.setAttribute(a, c.getAttribute(a)); }); while (c.firstChild) td.appendChild(c.firstChild); c.replaceWith(td); }));
    t.appendChild(tb); return t;
  }
  function salinBlok(src, out) {
    let para = null;
    const flush = () => { if (para) { if (para.textContent.trim() || para.querySelector('img')) out.appendChild(para); para = null; } };
    Array.from(src.childNodes).forEach(c => {
      const tag = c.nodeType === 1 ? c.tagName.toLowerCase() : '';
      if (c.nodeType === 3 || (c.nodeType === 1 && !BLOK.test(tag))) { if (c.nodeType === 3 && !c.nodeValue.trim() && !para) return; if (tag === 'script' || tag === 'style' || tag === 'template') return; if (!para) para = el('p'); const tmp = el('span'); tmp.appendChild(c.cloneNode(true)); salinInline(tmp, para); return; }
      if (c.nodeType !== 1) return;
      flush();
      if (/^h[1-6]$/.test(tag)) { const p = el('p'); const st = el('strong'); salinInline(c, st); if (st.textContent.trim()) { p.appendChild(st); out.appendChild(p); } return; }
      if (tag === 'ul' || tag === 'ol') {
        const l = el(tag);
        Array.from(c.children).forEach(li => { if (li.tagName.toLowerCase() !== 'li') return; const item = el('li'); if (adaBlok(li)) { const tmp = el('div'); salinBlok(li, tmp); Array.from(tmp.childNodes).forEach(x => { if (x.tagName === 'P') { if (item.childNodes.length) item.appendChild(el('br')); while (x.firstChild) item.appendChild(x.firstChild); } else item.appendChild(x); }); } else salinInline(li, item); if (item.textContent.trim() || item.querySelector('img')) l.appendChild(item); });
        if (l.childNodes.length) out.appendChild(l); return;
      }
      if (tag === 'table') { const t = jadualBersih(c); if (t) out.appendChild(t); return; }
      if (tag === 'pre') { const p = el('p'); p.appendChild(document.createTextNode(c.textContent)); if (p.textContent.trim()) out.appendChild(p); return; }
      if (tag === 'hr' || tag === 'dt' || tag === 'dd' || tag === 'li' || tag === 'tr' || tag === 'td' || tag === 'th' || tag === 'tbody' || tag === 'thead' || tag === 'tfoot') { if (adaBlok(c)) salinBlok(c, out); else { const p = el('p'); salinInline(c, p); if (p.textContent.trim() || p.querySelector('img')) out.appendChild(p); } return; }
      if (adaBlok(c)) salinBlok(c, out); else { const p = el('p'); salinInline(c, p); if (p.textContent.trim() || p.querySelector('img')) out.appendChild(p); }
    });
    flush();
  }
  function bersihHtml(html) { const src = new DOMParser().parseFromString('<!doctype html><html><body>' + String(html || '') + '</body></html>', 'text/html').body; const out = el('div'); salinBlok(src, out); return out.innerHTML; }
  function teksDariHtml(html) {
    const dom = new DOMParser().parseFromString('<!doctype html><html><body>' + String(html || '') + '</body></html>', 'text/html').body; const blok = [];
    const dalam = node => { let t = ''; node.childNodes.forEach(c => { if (c.nodeType === 3) t += c.nodeValue; else if (c.nodeType === 1) { const tg = c.tagName.toLowerCase(); if (tg === 'br') t += '\n'; else if (tg === 'img') t += c.getAttribute('alt') ? '[Rajah: ' + c.getAttribute('alt') + ']' : '[Rajah]'; else if (tg === 'p' || tg === 'li') t += dalam(c) + '\n'; else t += dalam(c); } }); return t; };
    const kemas = t => t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
    Array.from(dom.children).forEach(e => { const tg = e.tagName.toLowerCase(); if (tg === 'ul' || tg === 'ol') blok.push(Array.from(e.children).map((li, i) => (tg === 'ol' ? (i + 1) + '. ' : '- ') + kemas(dalam(li)).replace(/\n/g, ' ')).join('\n')); else if (tg === 'table') blok.push(Array.from(e.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => kemas(dalam(td)).replace(/\n/g, ' ')).join(' | ')).join('\n')); else blok.push(kemas(dalam(e))); });
    return blok.filter(Boolean).join('\n\n');
  }
  function htmlDariTeks(teks) {
    const esc2 = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = t => esc2(t).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    return String(teks || '').replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => { const baris = b.split('\n'); if (baris.every(l => /^\s*[-*•]\s+/.test(l))) return '<ul>' + baris.map(l => '<li>' + inline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>').join('') + '</ul>'; if (baris.length > 1 && baris.every(l => /^\s*\d+[.)]\s+/.test(l))) return '<ol>' + baris.map(l => '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>'; return '<p>' + baris.map(inline).join('<br>') + '</p>'; }).join('');
  }
  const htmlSeksyen = s => s && s.html != null ? s.html : htmlDariTeks(s && s.teks);
  const kiraTag = (html, tag) => (String(html || '').match(new RegExp('<' + tag + '[\\s>]', 'gi')) || []).length;
  /* Simpanan (awan dan tempatan) menyimpan `html` sahaja bagi seksyen berformat; `teks` diterbitkan semula ketika dimuatkan supaya dokumen bab
     tidak berganda saiznya (had 1 MiB Firestore). Versi lama (sejarah) juga disimpan sebagai html sahaja. */
  const persis = sk => { if (!sk || sk.html == null) return sk; const o = Object.assign({}, sk); o.teks = null; /* null, bukan dibuang: gabungan Firestore mengekalkan medan lama jika hanya ditinggalkan */ if (o.sejarah) o.sejarah = o.sejarah.map(h => h.html != null ? { masa: h.masa || 0, html: h.html } : h); return o; };
  function docPersis(d) { const o = Object.assign({}, d, { seksyen: {} }); Object.keys(d.seksyen || {}).forEach(id => { o.seksyen[id] = persis(d.seksyen[id]); }); return o; }
  function lengkapkanTeks(d) { Object.values(d.seksyen || {}).forEach(sk => { if (sk && sk.html != null && sk.teks == null) sk.teks = teksDariHtml(sk.html); if (sk && sk.patah == null) sk.patah = sk.padam ? 0 : patah(sk.teks); }); return d; }
  function simpanLokal(n, d) { R.lsSet(lsKey(n), docPersis(d)); }
  const teksSejarah = h => h.html != null ? teksDariHtml(h.html) : (h.teks || '');

  /* ---- rajah: simpanan dan paparan ---- */
  T.imej = {};
  const kunciImej = id => 'meta/tulisan_imej_' + id;
  async function muatImej(id) {
    if (T.imej[id]) return T.imej[id];
    try { const d = await R.db().get(kunciImej(id)); if (d && d.data) { T.imej[id] = { url: 'data:' + (d.mime || 'image/png') + ';base64,' + d.data, mime: d.mime || 'image/png', lebar: d.lebar || 0, tinggi: d.tinggi || 0 }; return T.imej[id]; } } catch (e) { console.warn('tulisan: rajah tidak dimuatkan', id, e); }
    return null;
  }
  function pasangImej(root) { if (!root) return; root.querySelectorAll('img[data-imej]').forEach(async im => { if (im.getAttribute('src')) return; const u = await muatImej(im.dataset.imej); if (u) im.src = u.url; else { im.classList.add('hilang'); im.alt = im.alt || 'Rajah tidak dapat dimuatkan'; } }); }
  function bacaDataUrl(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }); }
  function dataUrlKeBlob(u) { const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(u); if (!m) return null; const mime = m[1]; const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); }
  async function bacaImej(blob) { const url = URL.createObjectURL(blob); try { return await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Imej tidak dapat dibaca')); im.src = url; }); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); } }
  async function kecilkanImej(blob) {
    const im = await bacaImej(blob); const png = /png|gif|bmp|svg/i.test(blob.type || '');
    const cuba = async (maks, mime, q) => { const sk = Math.min(1, maks / Math.max(im.naturalWidth, im.naturalHeight)); const w = Math.max(1, Math.round(im.naturalWidth * sk)), h = Math.max(1, Math.round(im.naturalHeight * sk)); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); if (mime === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); } cx.drawImage(im, 0, 0, w, h); const out = await new Promise(res => cv.toBlob(res, mime, q)); return { blob: out, mime, lebar: w, tinggi: h }; };
    const HAD = 600000; let k;
    if (png) { k = await cuba(1600, 'image/png'); if (k.blob.size > HAD) k = await cuba(1200, 'image/png'); if (k.blob.size > HAD) k = await cuba(1600, 'image/jpeg', 0.9); }
    else { k = await cuba(1600, 'image/jpeg', 0.86); if (k.blob.size > HAD) k = await cuba(1200, 'image/jpeg', 0.8); }
    if (k.blob.size > HAD) k = await cuba(900, 'image/jpeg', 0.72);
    return k;
  }
  async function simpanImej(blob, ctx) {
    const k = await kecilkanImej(blob); const dataUrl = await bacaDataUrl(k.blob); const b64 = dataUrl.split(',')[1];
    const id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await R.db().set(kunciImej(id), { id, mime: k.mime, data: b64, lebar: k.lebar, tinggi: k.tinggi, saiz: k.blob.size, masa: Date.now(), bab: ctx && ctx.n || null, seksyen: ctx && ctx.id || null, nama: ctx && ctx.nama || '' });
    T.imej[id] = { url: 'data:' + k.mime + ';base64,' + b64, mime: k.mime, lebar: k.lebar, tinggi: k.tinggi }; return { id, dataUrl: T.imej[id].url, lebar: k.lebar, tinggi: k.tinggi };
  }
  /* Rajah yang masih berupa data URL (ditampal atau daripada fail Word) dipindahkan ke simpanan rajah; HTML yang dipulangkan hanya merujuk id. */
  async function naikImejDalamHtml(html, ctx, onProgress) {
    const dom = new DOMParser().parseFromString('<!doctype html><html><body>' + String(html || '') + '</body></html>', 'text/html').body;
    const imgs = Array.from(dom.querySelectorAll('img[src^="data:"]:not([data-imej])')); let gagal = 0;
    for (let i = 0; i < imgs.length; i++) {
      const im = imgs[i]; if (onProgress) onProgress(i + 1, imgs.length);
      try { const blob = dataUrlKeBlob(im.getAttribute('src')); if (!blob) throw new Error('data URL rosak'); const r = await simpanImej(blob, Object.assign({}, ctx, { nama: im.getAttribute('alt') || '' })); im.setAttribute('data-imej', r.id); im.removeAttribute('src'); }
      catch (e) { gagal++; console.warn('tulisan: rajah gagal disimpan', e); }
    }
    return { html: dom.innerHTML, jumlah: imgs.length, gagal };
  }

  function kosongDoc(n) { return { bab: n, tajuk: tajukBab(n), seksyen: {}, susunan: [], masa: 0, pinjam: null, log: {}, fail: [] }; }
  function doc(n) { if (!T.docs[n]) T.docs[n] = lengkapkanTeks(R.lsGet(lsKey(n), null) || kosongDoc(n)); return T.docs[n]; }
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
    const d = lengkapkanTeks(awan ? gabung(lokal, awan) : lokal); T.docs[n] = d; simpanLokal(n, d); return d;
  }
  async function muatSemua() { for (const [n] of BAB) await muatBab(n); T.loaded = true; }
  /* Had saiz dokumen Firestore 1 MiB: jika bab menghampiri had, versi lama seksyen (sejarah) dibuang dahulu. */
  function jagaSaiz(d) {
    const saiz = () => { const j = JSON.stringify(docPersis(d)); try { return new Blob([j]).size; } catch (e) { return j.length; } };
    if (saiz() < 800000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.sejarah && sk.sejarah.length > 1) sk.sejarah = sk.sejarah.slice(0, 1); });
    if (saiz() < 800000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.sejarah) sk.sejarah = []; });
    if (saiz() < 950000) return;
    Object.values(d.seksyen).forEach(sk => { if (sk.padam) { sk.teks = ''; sk.html = ''; } });
  }
  async function simpanAwan(n, patch) {
    const d = doc(n); jagaSaiz(d); simpanLokal(n, d);
    if (patch && patch.seksyen) { const sek = {}; Object.keys(patch.seksyen).forEach(id => { sek[id] = persis(d.seksyen[id] || patch.seksyen[id]); }); patch = Object.assign({}, patch, { seksyen: sek }); }
    try { await R.db().set(kunci(n), Object.assign({ bab: n, tajuk: d.tajuk, masa: d.masa }, patch), true); T.status.awan = 'ok'; return true; }
    catch (e) { T.status.awan = 'gagal'; console.warn('tulisan: simpanan awan gagal', e); return false; }
  }
  function catatLog(d, id, delta) {
    const h = hariIni(); d.log = d.log || {}; const l = d.log[h] || { patah: 0, seksyen: {}, masa: {} };
    l.masa = l.masa || {}; l.masa[id] = Date.now();
    if (delta) { l.patah = (l.patah || 0) + delta; l.seksyen = l.seksyen || {}; l.seksyen[id] = (l.seksyen[id] || 0) + delta; }
    d.log[h] = l;
    const keys = Object.keys(d.log).sort(); while (keys.length > 90) delete d.log[keys.shift()];
  }
  function tulisSeksyen(n, id, patch, opts) {
    opts = opts || {}; const d = doc(n); const s = d.seksyen[id] || { tajuk: '', teks: '', cipta: Date.now(), masa: 0, patah: 0 };
    if (patch && patch.html !== undefined && patch.teks === undefined) patch.teks = teksDariHtml(patch.html);
    const lama = s.patah || 0; Object.assign(s, patch); s.masa = Date.now(); s.patah = s.padam ? 0 : patah(s.teks); d.seksyen[id] = s;
    if (!d.susunan.includes(id)) d.susunan.push(id);
    catatLog(d, id, s.patah - lama); d.masa = s.masa;
    simpanLokal(n, d); setStatus('Menyimpan');
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
  function gerak(n, id, arah) { const d = doc(n); const ids = senarai(n); const i = ids.indexOf(id); const j = i + arah; if (i < 0 || j < 0 || j >= ids.length) return; ids.splice(i, 1); ids.splice(j, 0, id); d.susunan = ids.concat(Object.keys(d.seksyen).filter(k => !ids.includes(k))); d.masa = Date.now(); simpanLokal(n, d); simpanAwan(n, { susunan: d.susunan, masa: d.masa }); renderSenarai(); renderEditor(); }

  /* ---- subtopik proposal (templat) ---- */
  /* Bab 1 hingga 3 mengikut tajuk dalam badan Kertas Cadangan (suntingan 27 Ogos 2026) berserta penyusunan semula blok PPDO (28 Ogos 2026);
     Bab 4 dan 5 ialah cadangan struktur mengikut reka bentuk kajian (H1 hingga H4, CB-SEM, perbandingan bandar dan luar bandar). Setiap baris: [aras, tajuk]. */
  const TEMPLAT = {
    1: [[1, 'Pendahuluan'], [1, 'Latar Belakang Kajian'], [1, 'Pernyataan Masalah'], [1, 'Tujuan Kajian'], [1, 'Objektif Kajian'], [1, 'Soalan dan Hipotesis Kajian'], [1, 'Kerangka Teoretikal Kajian'], [1, 'Kerangka Konseptual Kajian'], [1, 'Definisi Operasional'],
      [2, 'Kepimpinan Digital Guru Besar'], [3, 'Penyokong Kewarganegaraan Digital'], [3, 'Perancang Berwawasan'], [3, 'Pemimpin Pemerkasa'], [3, 'Pereka Bentuk Sistem'], [3, 'Pembelajar Berhubung'],
      [2, 'Pengurusan Pengetahuan Digital Organisasi'], [3, 'Pemerolehan Digital'], [3, 'Penyimpanan dan Pendokumentasian Digital'], [3, 'Perkongsian Digital'], [3, 'Penciptaan Digital'], [3, 'Pengaplikasian Digital'],
      [2, 'Kompetensi Digital Guru'], [3, 'Penglibatan Profesional'], [3, 'Sumber Digital'], [3, 'Pengajaran dan Pembelajaran'], [3, 'Pentaksiran'], [3, 'Memperkasa Murid'], [3, 'Membimbing Kompetensi Digital Murid'],
      [1, 'Batasan Kajian'], [1, 'Kepentingan Kajian'], [1, 'Rumusan']],
    2: [[1, 'Pendahuluan'], [1, 'Transformasi Pendidikan Digital Negara'], [1, 'Dasar Pendidikan Digital (2023-2030)'], [1, 'Kompetensi Digital Guru'], [1, 'Definisi Kompetensi Digital Guru'], [1, 'Kerangka Kompetensi Digital Guru'],
      [2, 'Kerangka Pengetahuan Teknologi, Pedagogi dan Kandungan (TPACK)'], [2, 'Model Kompetensi Digital Krumsvik (2014)'], [2, 'Kerangka UNESCO ICT-CFT (UNESCO, 2018)'], [2, 'Standard ISTE untuk Pendidik (ISTE, 2017)'], [2, 'Instrumen Kompetensi Digital Rubach dan Lazarides (2021)'], [2, 'Kerangka DigCompEdu (Redecker, 2017)'],
      [3, 'Penglibatan Profesional'], [3, 'Sumber Digital'], [3, 'Pengajaran dan Pembelajaran'], [3, 'Pentaksiran'], [3, 'Memperkasakan Murid'], [3, 'Memudah Cara Kompetensi Digital Murid'],
      [1, 'Kompetensi Digital Guru dalam Konteks Matlamat Pembangunan Mapan'], [1, 'Kompetensi Digital Guru dalam Konteks Sekolah Rendah'], [1, 'Evolusi Kepimpinan'], [1, 'Kepimpinan Digital Guru Besar'], [1, 'Definisi Kepimpinan Digital'], [1, 'Model Kepimpinan Digital'],
      [2, 'Kerangka Kepimpinan Transformasi Digital (Weber et al., 2022)'], [2, 'Sepuluh Ciri Pemimpin Digital untuk Era Norma Baharu (Budianto et al., 2022)'], [2, 'Model Taksonomi Kepimpinan Digital (Zulu dan Khosrowshahi, 2021)'], [2, 'Skala Kepimpinan Digital (DLS) (Büyükbeşe et al., 2022)'], [2, 'Skala Kepimpinan Digital Era Kecerdasan Buatan (Aydın dan Ceylan, 2026)'], [2, 'Model Pemimpin Digital (DLM) (Goh dan Mansor, 2024)'], [2, 'Standard ISTE untuk Pemimpin Pendidikan (2024)'],
      [3, 'Penyokong Kewarganegaraan Digital'], [3, 'Perancang Berwawasan'], [3, 'Pemimpin Pemerkasa'], [3, 'Pereka Bentuk Sistem'], [3, 'Pembelajar Berhubung'],
      [1, 'Perbandingan Model Kepimpinan Digital'], [1, 'Pengurusan Pengetahuan Organisasi'], [1, 'Pengetahuan: Daripada Data kepada Pengetahuan'],
      [2, 'Asal Usul Pengetahuan'], [2, 'Data'], [2, 'Maklumat'], [2, 'Kategori Pengetahuan'], [2, 'Perkongsian Pengetahuan'], [2, 'Pengetahuan Digital Organisasi'],
      [1, 'Definisi Pengurusan Pengetahuan Digital Organisasi'], [1, 'Pengurusan Pengetahuan Organisasi dalam Konteks Sekolah'], [1, 'Model Pengurusan Pengetahuan Organisasi'],
      [2, 'Model Wiig (Wiig, 1993)'], [2, 'Model Epistemologi Organisasi (Von Krogh et al., 1995)'], [2, 'Model Penciptaan Makna (Choo, 1998)'], [2, 'Model I-Space (Boisot, 1998)'], [2, 'Model SECI (Nonaka dan Takeuchi, 1995)'],
      [3, 'Sosialisasi (Socialization)'], [3, 'Eksternalisasi (Externalization)'], [3, 'Kombinasi (Combination)'], [3, 'Internalisasi (Internalization)'],
      [1, 'Perbandingan Model-Model Pengurusan Pengetahuan Organisasi'], [1, 'Dimensi Pengurusan Pengetahuan Digital Organisasi'],
      [2, 'Pemerolehan Digital'], [2, 'Penyimpanan dan Pendokumentasian Digital'], [2, 'Perkongsian Digital'], [2, 'Penciptaan Digital'], [2, 'Pengaplikasian Digital'],
      [1, 'Perkembangan Kajian Berkaitan Pengurusan Pengetahuan Digital Organisasi'], [1, 'Kepentingan Pengurusan Pengetahuan Digital Organisasi kepada Sekolah'], [1, 'Teori Kognitif Sosial'], [1, 'Kajian-kajian Lepas'],
      [2, 'Kajian Lepas Kompetensi Digital Guru'], [2, 'Kajian Lepas Kepimpinan Digital Guru Besar'], [2, 'Kajian Lepas Pengurusan Pengetahuan Organisasi'], [2, 'Hubungan Antara Kepimpinan Digital dan Pengurusan Pengetahuan Organisasi'], [2, 'Hubungan Antara Pengurusan Pengetahuan Organisasi dan Kompetensi Digital Guru'], [2, 'Hubungan Antara Kepimpinan Digital dan Kompetensi Digital Guru'], [2, 'Pengurusan Pengetahuan Organisasi Sebagai Perantara'], [2, 'Rumusan']],
    3: [[1, 'Pendahuluan'], [1, 'Reka Bentuk Kajian'], [2, 'Falsafah dan Pendekatan Kajian'], [2, 'Pendekatan Metodologi dan Strategi Kajian'],
      [1, 'Populasi dan Sampel Kajian'], [2, 'Populasi Kajian'], [2, 'Saiz Sampel Kajian'], [2, 'Kaedah Pensampelan'],
      [1, 'Instrumen Kajian'], [2, 'Pembangunan Instrumen Kajian'], [2, 'Penjanaan Item dan Spesifikasi Instrumen'], [2, 'Kesahan Instrumen Kajian'], [2, 'Kebolehpercayaan Instrumen Kajian'], [2, 'Kejelasan Item Kajian'], [2, 'Kajian Rintis'],
      [1, 'Prosedur Pengumpulan Data'], [1, 'Kaedah Analisis Data'], [2, 'Penyediaan dan Pemeriksaan Awal Data'], [2, 'Analisis Statistik Deskriptif'], [2, 'Analisis Statistik Inferensi'],
      [3, 'Analisis Faktor Pengesahan (CFA)'], [3, 'Penilaian Kesahan dan Kebolehpercayaan Konstruk'], [3, 'Analisis Laluan dan Penilaian Model Berstruktur'], [3, 'Analisis Kesan Perantara'],
      [2, 'Rumusan Persoalan Kajian, Hipotesis dan Analisis Data'], [1, 'Pertimbangan Etika'], [1, 'Rumusan']],
    4: [[1, 'Pendahuluan'], [1, 'Profil Responden dan Kadar Respons'], [1, 'Penyediaan dan Pemeriksaan Data'], [2, 'Data Hilang dan Nilai Ekstrem'], [2, 'Normaliti dan Multikolineariti'], [2, 'Bias Kaedah Sepunya'],
      [1, 'Analisis Deskriptif Pemboleh Ubah Kajian'], [2, 'Tahap Kepimpinan Digital Guru Besar'], [2, 'Tahap Pengurusan Pengetahuan Digital Organisasi'], [2, 'Tahap Kompetensi Digital Guru'],
      [1, 'Penilaian Model Pengukuran'], [2, 'Analisis Faktor Pengesahan (CFA)'], [2, 'Kesahan Konvergen dan Diskriminan'], [2, 'Kebolehpercayaan Konstruk'],
      [1, 'Penilaian Model Berstruktur'], [2, 'Indeks Padanan Model'], [2, 'Pengujian Hipotesis Kesan Langsung (H1 hingga H3)'], [2, 'Pengujian Kesan Perantara (H4)'],
      [1, 'Perbandingan Sekolah Bandar dan Luar Bandar'], [1, 'Rumusan Dapatan Mengikut Soalan Kajian'], [1, 'Rumusan']],
    5: [[1, 'Pendahuluan'], [1, 'Ringkasan Kajian'], [1, 'Perbincangan Dapatan Kajian'], [2, 'Tahap Kepimpinan Digital, Pengurusan Pengetahuan Digital Organisasi dan Kompetensi Digital Guru'], [2, 'Pengaruh Kepimpinan Digital Guru Besar terhadap Kompetensi Digital Guru'], [2, 'Pengaruh Kepimpinan Digital Guru Besar terhadap Pengurusan Pengetahuan Digital Organisasi'], [2, 'Pengaruh Pengurusan Pengetahuan Digital Organisasi terhadap Kompetensi Digital Guru'], [2, 'Pengurusan Pengetahuan Digital Organisasi sebagai Perantara'], [2, 'Perbandingan Sekolah Bandar dan Luar Bandar'],
      [1, 'Implikasi Kajian'], [2, 'Implikasi Teori'], [2, 'Implikasi Amalan'], [2, 'Implikasi Dasar'], [1, 'Batasan Kajian'], [1, 'Cadangan Kajian Lanjutan'], [1, 'Kesimpulan']]
  };
  const ARAS_MAKS = 3;
  function tanpaNombor(t) { return String(t || '').replace(/^\s*\d+(\.\d+)*\.?\s+/, '').trim(); }
  /* Nombor seksyen dikira daripada kedudukan dan aras (seperti tajuk berbilang aras Word): 2.3, 2.3.1, 2.3.1.1. Lompatan aras yang tidak sah
     (aras 3 terus selepas aras 1) dipaparkan sebagai aras yang dibenarkan. */
  function nombor(n) {
    const d = doc(n); const c = [0, 0, 0]; let prev = 0; const out = {};
    senarai(n).forEach(id => { let a = Math.max(1, Math.min(ARAS_MAKS, d.seksyen[id].aras || 1)); if (a > prev + 1) a = prev + 1; c[a - 1]++; for (let k = a; k < ARAS_MAKS; k++) c[k] = 0; out[id] = { aras: a, no: n + '.' + c.slice(0, a).join('.') }; prev = a; });
    return out;
  }
  function bolehDemosi(n, id) { const ids = senarai(n); const i = ids.indexOf(id); if (i <= 0) return false; const nb = nombor(n); const a = nb[id].aras; return a < ARAS_MAKS && a <= nb[ids[i - 1]].aras; }
  function bolehPromosi(n, id) { const nb = nombor(n); return !!nb[id] && nb[id].aras > 1; }
  function ubahAras(n, id, delta) {
    const nb = nombor(n); if (!nb[id]) return false; const a = nb[id].aras;
    if (delta > 0 && !bolehDemosi(n, id)) { toast('Seksyen pertama bab atau seksyen di bawah tajuk yang lebih rendah tidak boleh didemosi', true); return false; }
    if (delta < 0 && !bolehPromosi(n, id)) return false;
    tulisSeksyen(n, id, { aras: Math.max(1, Math.min(ARAS_MAKS, a + delta)) }, { segera: true }); renderSenarai(); renderEditor(); return true;
  }
  function susunSemula(n, id, indeks) {
    const d = doc(n); const ids = senarai(n); const i = ids.indexOf(id); if (i < 0) return;
    ids.splice(i, 1); if (indeks > i) indeks--; indeks = Math.max(0, Math.min(ids.length, indeks)); ids.splice(indeks, 0, id);
    d.susunan = ids.concat(Object.keys(d.seksyen).filter(k => !ids.includes(k))); d.masa = Date.now(); simpanLokal(n, d); simpanAwan(n, { susunan: d.susunan, masa: d.masa }); renderSenarai(); renderEditor();
  }
  function isiTemplat(n, opts) {
    opts = opts || {}; const d = doc(n); const lama = senarai(n); const ada = new Set(lama.map(id => norm(d.seksyen[id].tajuk)).filter(Boolean));
    const baru = []; (TEMPLAT[n] || []).forEach(([aras, tajuk]) => { if (opts.semua || !ada.has(norm(tajuk))) { const id = idBaru(); d.seksyen[id] = { tajuk, teks: '', cipta: Date.now(), masa: Date.now(), patah: 0, aras, sumber: { jenis: 'templat' } }; baru.push(id); } });
    if (!baru.length) return 0;
    d.susunan = opts.depan ? baru.concat(lama) : lama.concat(baru); d.templat = true; d.masa = Date.now(); simpanLokal(n, d);
    const patch = { seksyen: {}, susunan: d.susunan, masa: d.masa, templat: true }; baru.forEach(id => { patch.seksyen[id] = d.seksyen[id]; }); simpanAwan(n, patch); return baru.length;
  }
  /* Kali pertama: bab yang belum ada seksyen bertajuk atau bertulisan diisi dengan subtopik proposal secara automatik. */
  function templatAuto() {
    let jumlah = 0; BAB.forEach(([n]) => { const d = doc(n); if (d.templat) return; const kosong = senarai(n).every(id => !(d.seksyen[id].tajuk || '').trim() && !(d.seksyen[id].teks || '').trim()); if (kosong) jumlah += isiTemplat(n, { depan: true }); else { d.templat = true; simpanLokal(n, d); simpanAwan(n, { templat: true }); } });
    if (jumlah) toast(jumlah + ' subtopik daripada proposal dimasukkan ke Bab 1 hingga Bab 5; semua boleh diubah suai.');
  }

  function gabungSeksyen(n, id, sasaran) {
    const d = doc(n); const a = d.seksyen[id], b = d.seksyen[sasaran]; if (!a || !b || id === sasaran) return false;
    const html = [htmlSeksyen(b), htmlSeksyen(a)].filter(h => h && h.trim()).join('');
    tulisSeksyen(n, sasaran, { html }, { senyap: true, segera: true }); padamSeksyen(n, id); return true;
  }
  async function gabungModal(n, id) {
    const d = doc(n); const s = d.seksyen[id]; const nb = nombor(n); const lain = senarai(n).filter(x => x !== id);
    if (!lain.length) { toast('Tiada seksyen lain dalam bab ini untuk digabungkan', true); return; }
    const okk = await R.richModal('Gabungkan seksyen', `<p>Teks "<b>${esc(s.tajuk || 'Tanpa tajuk')}</b>" (${s.patah || 0} patah) akan ditambah di hujung seksyen yang dipilih, kemudian seksyen asal dipadam.</p><select id="tulSasaran" class="modal-in">${lain.map(x => `<option value="${esc(x)}">${esc(nb[x].no)} ${esc(d.seksyen[x].tajuk || 'Tanpa tajuk')} (${d.seksyen[x].patah || 0} patah)</option>`).join('')}</select>`, 'Gabungkan', 'Batal');
    if (!okk) return; const sasaran = R.richModal.values.tulSasaran; if (gabungSeksyen(n, id, sasaran)) { T.bab = n; T.sek = sasaran; renderSemua(); toast('Seksyen digabungkan'); }
  }
  /* ---- semalam: jadual apa yang dibuat pada hari terakhir sebelum hari ini ---- */
  function hariAktifTerakhir() {
    const h = hariIni(); const tarikh = new Set();
    BAB.forEach(([n]) => Object.keys(doc(n).log || {}).forEach(k => { if (k < h) tarikh.add(k); }));
    return Array.from(tarikh).sort().pop() || null;
  }
  const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function tarikhPanjang(ymd) { const d = new Date(ymd + 'T00:00:00'); return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; }
  function renderSemalam() {
    const el = $('#tulSemalam'); if (!el) return;
    const t = hariAktifTerakhir(); const semalam = tarikhStr(Date.now() - 86400000);
    if (!t) { el.innerHTML = `<div class="sm-head"><h2>Semalam</h2><span class="sub">Belum ada rekod tulisan sebelum hari ini. Selepas Prof Dr menulis, jadual ini menyenaraikan setiap seksyen yang disentuh pada hari sebelumnya.</span></div>`; return; }
    const hariLalu = Math.round((new Date(hariIni() + 'T00:00:00') - new Date(t + 'T00:00:00')) / 86400000);
    const rows = [];
    BAB.forEach(([n]) => { const l = (doc(n).log || {})[t]; if (!l) return; const nb = nombor(n); const ids = new Set(Object.keys(l.seksyen || {}).concat(Object.keys(l.masa || {}))); ids.forEach(id => { const sk = doc(n).seksyen[id]; if (!sk) return; rows.push({ n, id, sk, delta: (l.seksyen || {})[id] || 0, masa: (l.masa || {})[id] || 0, no: nb[id] ? nb[id].no : (sk.padam ? 'dipadam' : '') }); }); });
    rows.sort((x, y) => (y.masa || 0) - (x.masa || 0));
    const jumlah = rows.reduce((a, r) => a + r.delta, 0);
    el.innerHTML = `<div class="sm-head"><h2>${hariLalu === 1 ? 'Semalam' : 'Hari terakhir menulis'}: ${esc(tarikhPanjang(t))}${hariLalu > 1 ? ' (' + hariLalu + ' hari lalu)' : ''}</h2><span class="sub">${rows.length} seksyen disentuh, ${jumlah >= 0 ? '+' : ''}${jumlah} patah perkataan. Sambung seksyen yang sama, gabungkan dengan seksyen lain, atau padam.</span></div>
      <div class="sm-wrap"><table class="sm-tbl"><thead><tr><th>Bab</th><th>Seksyen</th><th>Perubahan</th><th>Patah kini</th><th>Masa terakhir</th><th>Tindakan</th></tr></thead><tbody>${rows.map(r => `<tr${r.sk.padam ? ' class="padam"' : ''}><td>Bab ${r.n}</td><td>${esc(r.no)} ${esc(r.sk.tajuk || 'Tanpa tajuk')}${r.sk.padam ? ' (dipadam)' : ''}</td><td>${r.delta ? (r.delta > 0 ? '+' : '') + r.delta + ' patah' : 'disunting, bilangan patah sama'}</td><td>${r.sk.padam ? '' : (r.sk.patah || 0)}</td><td>${r.masa ? esc(R.fmtTime(r.masa)) : ''}</td><td>${r.sk.padam ? '' : `<button class="btn btn-sm btn-primary" data-buka="${r.n}|${esc(r.id)}">Sambung</button> <button class="btn btn-sm" data-gabung="${r.n}|${esc(r.id)}">Gabung</button> <button class="btn btn-sm btn-danger" data-padamsm="${r.n}|${esc(r.id)}">Padam</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ---- paparan ---- */
  function show() { if (!T.mula) { T.mula = true; muatSemua().then(() => { templatAuto(); renderSemua(); peringatan(); }); } renderSemua(); }
  function renderSemua() { renderSemalam(); renderBab(); renderSenarai(); renderEditor(); renderSambung(); renderCari(); }
  function jumlahPatah(n) { return senarai(n).reduce((s, id) => s + (doc(n).seksyen[id].patah || 0), 0); }
  function renderBab() {
    const el = $('#tulBab'); if (!el) return;
    el.innerHTML = BAB.map(([n, t]) => { const d = doc(n); return `<button class="tul-tab${n === T.bab ? ' on' : ''}" data-bab="${n}"><span class="b">Bab ${n}</span><span class="t">${esc(t)}</span><span class="m">${senarai(n).length} seksyen · ${jumlahPatah(n)} patah${d.pinjam ? ' · <b class="pinjam">dipinjam ke Word</b>' : ''}</span></button>`; }).join('');
  }
  function renderSenarai() {
    const el = $('#tulSenarai'); if (!el) return; const n = T.bab; const d = doc(n); const ids = senarai(n); const nb = nombor(n);
    const pj = d.pinjam ? `<div class="tul-pinjam">Bab ${n} dimuat turun sebagai Word pada ${esc(R.fmtTime(d.pinjam.masa))} (${esc(d.pinjam.fail || '')}) dan belum dimuat naik semula. Jika Prof Dr menaip dalam fail itu, muat naik dahulu sebelum menyunting di sini supaya tidak wujud dua versi. <button class="btn btn-sm" data-tulnaik="1">Muat naik Word</button> <button class="btn btn-sm" data-pinjamtutup="${n}" title="Fail Word itu tidak disunting; batalkan peringatan">Tidak disunting</button></div>` : '';
    el.innerHTML = pj + (ids.length ? ids.map(id => { const s = d.seksyen[id]; const k = nb[id]; return `<div class="tul-item a${k.aras}${id === T.sek ? ' on' : ''}${(s.patah || 0) ? '' : ' kosong'}" data-sek="${esc(id)}" role="button" tabindex="0"><span class="tul-grip" title="Seret untuk menyusun semula" aria-hidden="true">⋮⋮</span><div class="tul-item-isi"><div class="tj"><span class="no">${esc(k.no)}</span> ${esc(s.tajuk || 'Tanpa tajuk')}</div><div class="mt">${s.patah || 0} patah${s.patah || s.masa && !(s.sumber && s.sumber.jenis === 'templat') ? ' · ' + (s.masa ? esc(R.fmtTime(s.masa)) : 'belum disunting') : ' · belum ditulis'}${s.sumber && s.sumber.jenis !== 'templat' ? ' · ' + esc(s.sumber.jenis === 'banding' ? 'daripada Banding' : s.sumber.jenis === 'word' ? 'daripada Word' : s.sumber.jenis === 'artikel' ? 'daripada rekod' : '') : ''}</div></div><span class="tul-aras"><button class="ab" data-aras="-1" data-id="${esc(id)}" title="Promosi (naik satu aras)"${k.aras > 1 ? '' : ' disabled'}>&#8592;</button><button class="ab" data-aras="1" data-id="${esc(id)}" title="Demosi (turun satu aras, di bawah seksyen sebelumnya)"${bolehDemosi(n, id) ? '' : ' disabled'}>&#8594;</button></span></div>`; }).join('') : `<div class="help">Bab ${n} belum ada seksyen. Klik "Seksyen baharu" untuk mula menulis, "Subtopik proposal" untuk memasukkan senarai subtopik, atau muat naik fail Word.</div>`);
  }
  /* ---- editor teks kaya ---- */
  const ED = { n: null, id: null, timer: null, kotor: false };
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  function editor() { return $('#tulTeks'); }
  function serialisasi(ed) { return bersihHtml(ed.innerHTML); }
  function simpanEditor(segera) {
    const ed = editor(); if (!ed || ED.id == null || !ED.kotor) return; ED.kotor = false; clearTimeout(ED.timer);
    const html = serialisasi(ed); const pt = $('#tulPatah'); const teks = teksDariHtml(html); if (pt) pt.textContent = patah(teks) + ' patah perkataan';
    tulisSeksyen(ED.n, ED.id, { html, teks }, { senyap: true, segera });
  }
  function tandaKotor() { ED.kotor = true; clearTimeout(ED.timer); ED.timer = setTimeout(() => simpanEditor(false), 450); setStatus('Menyimpan'); }
  function flushEditor() { if (ED.kotor) simpanEditor(true); }
  const selNod = () => { const sl = window.getSelection(); if (!sl || !sl.rangeCount) return null; let nd = sl.getRangeAt(0).startContainer; if (nd.nodeType === 3) nd = nd.parentNode; return nd; };
  function selDalam(pilih) { const nd = selNod(); const ed = editor(); const e = nd && nd.closest ? nd.closest(pilih) : null; return e && ed && ed.contains(e) && e !== ed ? e : null; }
  function letakKursor(node, hujung) { const r = document.createRange(); r.selectNodeContents(node); r.collapse(!hujung); const sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r); }
  function pastikanFokus() { const ed = editor(); if (!ed) return; if (!ed.contains(selNod())) { ed.focus(); letakKursor(ed, true); } }
  /* Blok aras atas (anak terus editor) yang mengandungi kursor; sisipan jadual dan rajah dibuat pada aras ini dengan DOM, bukan insertHTML,
     kerana Chrome memecahkan jadual yang disisip melalui insertHTML di dalam perenggan. */
  function blokSemasa() { const ed = editor(); let nd = selNod(); if (!ed || !nd || nd === ed || !ed.contains(nd)) return null; while (nd.parentNode && nd.parentNode !== ed) nd = nd.parentNode; return nd.parentNode === ed ? nd : null; }
  function sisipBlok(html) {
    const ed = editor(); if (!ed) return []; const tmp = el('div'); tmp.innerHTML = html; const nodes = Array.from(tmp.childNodes);
    const ref = blokSemasa(); const kosong = ref && ref.tagName === 'P' && !ref.textContent.trim() && !ref.querySelector('img');
    if (!ref) nodes.forEach(nd => ed.appendChild(nd)); else if (kosong) { nodes.forEach(nd => ed.insertBefore(nd, ref)); ref.remove(); } else { let selepas = ref; nodes.forEach(nd => { selepas.after(nd); selepas = nd; }); }
    return nodes;
  }
  function kemasKosong() { const ed = editor(); if (!ed) return; const kosong = !ed.textContent.trim() && !ed.querySelector('img,table'); ed.classList.toggle('kosong', kosong); if (!ed.childNodes.length) ed.innerHTML = '<p><br></p>'; }
  function jadualHtml(r, c, kepala) { let h = '<table><tbody>'; for (let i = 0; i < r; i++) { h += '<tr>'; for (let j = 0; j < c; j++) h += kepala && i === 0 ? '<th><br></th>' : '<td><br></td>'; h += '</tr>'; } return h + '</tbody></table><p><br></p>'; }
  function selCell() { return selDalam('td,th'); }
  function jadualOps(op) {
    const cell = selCell(); if (!cell) { toast('Letakkan kursor di dalam jadual dahulu', true); return; }
    const tr = cell.closest('tr'); const tbl = cell.closest('table'); if (!tr || !tbl) return; const idx = Array.from(tr.children).indexOf(cell);
    if (op === 'baris+' || op === 'baris-') { const baru = tr.cloneNode(true); baru.querySelectorAll('td,th').forEach(c => { c.innerHTML = '<br>'; }); baru.querySelectorAll('th').forEach(th => { const td = el('td'); td.innerHTML = '<br>'; th.replaceWith(td); }); if (op === 'baris+') tr.after(baru); else tr.before(baru); letakKursor(baru.children[Math.min(idx, baru.children.length - 1)], false); }
    else if (op === 'padambaris') { const rows = Array.from(tbl.querySelectorAll('tr')).filter(r => r.closest('table') === tbl); if (rows.length <= 1) { padamJadual(tbl); return; } const seterusnya = tr.nextElementSibling || tr.previousElementSibling; tr.remove(); if (seterusnya) letakKursor(seterusnya.children[Math.min(idx, seterusnya.children.length - 1)], false); }
    else if (op === 'lajur+' || op === 'lajur-') { Array.from(tbl.querySelectorAll('tr')).filter(r => r.closest('table') === tbl).forEach(r => { const ref = r.children[Math.min(idx, r.children.length - 1)]; if (!ref) return; const c = el(ref.tagName.toLowerCase()); c.innerHTML = '<br>'; if (op === 'lajur+') ref.after(c); else ref.before(c); }); letakKursor(tr.children[op === 'lajur+' ? idx + 1 : idx], false); }
    else if (op === 'padamlajur') { const rows = Array.from(tbl.querySelectorAll('tr')).filter(r => r.closest('table') === tbl); if (tr.children.length <= 1) { padamJadual(tbl); return; } rows.forEach(r => { const c = r.children[idx]; if (c) c.remove(); }); letakKursor(tr.children[Math.min(idx, tr.children.length - 1)], false); }
    else if (op === 'kepala') { Array.from(tr.children).forEach(c => { const baru = el(c.tagName.toLowerCase() === 'th' ? 'td' : 'th'); while (c.firstChild) baru.appendChild(c.firstChild); c.replaceWith(baru); }); }
    else if (op === 'padamjadual') { padamJadual(tbl); return; }
    tandaKotor();
  }
  function padamJadual(tbl) { const p = el('p'); p.innerHTML = '<br>'; tbl.replaceWith(p); letakKursor(p, false); tandaKotor(); }
  async function sisipJadual() {
    const okk = await R.richModal('Sisip jadual', `<div class="tul-jd-form"><label>Baris <input id="tulJdBaris" type="number" min="1" max="60" value="3" class="modal-in"></label><label>Lajur <input id="tulJdLajur" type="number" min="1" max="12" value="3" class="modal-in"></label><label class="tul-cb"><input id="tulJdKepala" type="checkbox" checked> Baris pertama sebagai kepala jadual</label></div><p class="help">Jadual dikekalkan dalam fail Word yang dimuat turun (garis tunggal, langkau satu). Sel dibesarkan mengikut kandungan; Tab berpindah ke sel seterusnya.</p>`, 'Sisip', 'Batal');
    if (!okk) return; const v = R.richModal.values; const r = Math.max(1, Math.min(60, parseInt(v.tulJdBaris, 10) || 3)), c = Math.max(1, Math.min(12, parseInt(v.tulJdLajur, 10) || 3));
    pastikanFokus(); const nodes = sisipBlok(jadualHtml(r, c, !!v.tulJdKepala)); const tbl = nodes.find(x => x.tagName === 'TABLE'); if (tbl) letakKursor(tbl.querySelector('th,td'), false); kemasKosong(); tandaKotor();
  }
  async function masukImej(files) {
    const ed = editor(); if (!ed) return; const fs = Array.from(files || []).filter(f => /^image\//.test(f.type)); if (!fs.length) { toast('Pilih fail imej (PNG, JPG)', true); return; }
    for (const f of fs) {
      toast('Menyimpan rajah ' + f.name);
      try { const r = await simpanImej(f, { n: ED.n, id: ED.id, nama: f.name }); pastikanFokus(); const nodes = sisipBlok(`<p><img data-imej="${r.id}" src="${r.dataUrl}" alt="${esc(f.name.replace(/\.[a-z0-9]+$/i, ''))}"></p><p><br></p>`); letakKursor(nodes[nodes.length - 1], false); kemasKosong(); tandaKotor(); }
      catch (e) { console.warn('tulisan: rajah gagal', e); toast('Rajah gagal disimpan: ' + (e && e.message || e), true); }
    }
  }
  function perintah(cmd) { pastikanFokus(); document.execCommand(cmd, false, null); tandaKotor(); }
  /* Warna teks melalui foreColor dengan styleWithCSS (Chrome menghasilkan span bergaya); 'inherit' membuang warna, dan penyaring menukar gaya kepada kelas palet. */
  function warnakan(nama) { pastikanFokus(); try { document.execCommand('styleWithCSS', false, true); } catch (e) {} document.execCommand('foreColor', false, nama === 'asal' ? 'inherit' : heksTema(nama) || 'inherit'); try { document.execCommand('styleWithCSS', false, false); } catch (e) {} kemasWarna(); tandaKotor(); }
  /* Dalam editor, warna disimpan sebagai gaya sebaris (bukan kelas) supaya Chrome membelah span dengan betul apabila warna ditukar atau
     dibuang pada sebahagian teks; penyaring menukarnya kepada kelas palet ketika disimpan. Span yang gayanya "inherit" (hasil butang Asal)
     dibuka, dan heks ditetapkan mengikut tema terang atau gelap. */
  function pasangWarna(root) { if (!root) return; root.querySelectorAll('span, font').forEach(sp => { const kelas = sp.getAttribute('class') || ''; const gaya = sp.getAttribute('style') || ''; if (!/w-/.test(kelas) && !/color/i.test(gaya) && sp.tagName !== 'FONT') return; const w = warnaElemen(sp); if (w) { if (sp.tagName === 'FONT') { const e = el('span'); while (sp.firstChild) e.appendChild(sp.firstChild); sp.replaceWith(e); sp = e; } sp.removeAttribute('class'); sp.removeAttribute('color'); sp.style.color = heksTema(w); } else if (/color/i.test(gaya) || sp.tagName === 'FONT') { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); } }); }
  function kemasWarna() { pasangWarna(editor()); }
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => pasangWarna(editor())); } catch (e) {} }
  async function salinSeksyen() {
    const ed = editor(); if (!ed) return; const html = serialisasi(ed).replace(/class="w-(merah|biru|hijau|oren|ungu|kelabu)"/g, (m, k) => `style="color:${heksWarna(k)}"`); const teks = teksDariHtml(html);
    try { if (window.ClipboardItem && navigator.clipboard.write) { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([teks], { type: 'text/plain' }) })]); } else await navigator.clipboard.writeText(teks); toast('Seksyen disalin (boleh ditampal ke Word dengan format)'); }
    catch (e) { try { await navigator.clipboard.writeText(teks); toast('Teks seksyen disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } }
  }
  function tampal(e) {
    const cd = e.clipboardData; if (!cd) return;
    const files = Array.from(cd.files || []).filter(f => /^image\//.test(f.type)); const html = cd.getData('text/html'); const teks = cd.getData('text/plain');
    if (files.length && !html) { e.preventDefault(); masukImej(files); return; }
    if (html) { e.preventDefault(); const bersih = bersihHtml(html); const hilang = kiraTag(html, 'img') - kiraTag(bersih, 'img'); tampalHtml(bersih); if (hilang) toast(hilang + ' imej daripada papan keratan tidak dapat ditampal; gunakan butang Rajah untuk memuat naik fail imej', true); if (kiraTag(bersih, 'img')) naikImejTertunda(); return; }
    if (teks && /\n/.test(teks)) { e.preventDefault(); tampalHtml(htmlDariTeks(teks)); }
  }
  /* Satu perenggan ditampal di tempat kursor (teks sebaris); kandungan berbilang blok (perenggan, jadual, senarai) disisip selepas blok semasa. */
  function tampalHtml(bersih) {
    const tmp = el('div'); tmp.innerHTML = bersih; const blok = Array.from(tmp.children);
    if (!blok.length) return;
    if (blok.length === 1 && blok[0].tagName === 'P' && !blok[0].querySelector('img')) document.execCommand('insertHTML', false, blok[0].innerHTML);
    else { pastikanFokus(); const nodes = sisipBlok(bersih); const akhir = nodes[nodes.length - 1]; if (akhir && akhir.nodeType === 1) letakKursor(akhir, true); }
    kemasKosong(); pasangWarna(editor()); tandaKotor();
  }
  /* Rajah yang ditampal sebagai data URL dipindahkan ke simpanan rajah di latar supaya dokumen bab kekal kecil. */
  async function naikImejTertunda() {
    const ed = editor(); if (!ed) return; const imgs = Array.from(ed.querySelectorAll('img[src^="data:"]:not([data-imej])')); if (!imgs.length) return;
    for (const im of imgs) { try { const blob = dataUrlKeBlob(im.getAttribute('src')); const r = await simpanImej(blob, { n: ED.n, id: ED.id, nama: im.getAttribute('alt') || '' }); im.setAttribute('data-imej', r.id); im.src = r.dataUrl; } catch (e) { console.warn('tulisan: rajah tampal gagal', e); } }
    tandaKotor();
  }
  function kekunci(e) {
    if (e.key === 'Tab') { const cell = selCell(); if (!cell) return; e.preventDefault(); const tr = cell.closest('tr'); let sasaran = e.shiftKey ? cell.previousElementSibling : cell.nextElementSibling; if (!sasaran) { const baris = e.shiftKey ? tr.previousElementSibling : tr.nextElementSibling; if (baris) sasaran = e.shiftKey ? baris.lastElementChild : baris.firstElementChild; else if (!e.shiftKey) { jadualOps('baris+'); return; } } if (sasaran) letakKursor(sasaran, false); }
  }
  function kemasBar() { const bar = $('#tulBar'); if (!bar) return; const dalam = !!selCell(); bar.classList.toggle('jadual', dalam); }
  document.addEventListener('selectionchange', () => { if (editor()) kemasBar(); });
  function renderEditor() {
    flushEditor();
    const el2 = $('#tulEditor'); if (!el2) return; const n = T.bab; const d = doc(n); const s = T.sek ? d.seksyen[T.sek] : null;
    if (!s || s.padam) { ED.n = null; ED.id = null; ED.kotor = false; el2.innerHTML = `<div class="tul-kosong"><h3>Pilih seksyen di sebelah kiri atau cipta seksyen baharu</h3><p>Setiap seksyen disimpan automatik ke awan beberapa saat selepas Prof Dr berhenti menaip, dan disegerakkan ke semua peranti. Editor berfungsi seperti Word: tebal, condong, garis bawah, superskrip, senarai, jadual dan rajah dikekalkan apabila dimuat turun sebagai Word, dan teks yang ditampal daripada Word mengekalkan formatnya. Fail Word juga boleh dimuat naik terus ke dalam satu seksyen.</p></div>`; return; }
    ED.n = n; ED.id = T.sek; ED.kotor = false;
    const k = nombor(n)[T.sek] || { aras: 1, no: n + '.?' };
    el2.innerHTML = `<div class="tul-ed-head"><span class="tul-no" title="Nombor dikira automatik daripada kedudukan dan aras seksyen">${esc(k.no)}</span><input id="tulTajuk" class="tul-tajuk" placeholder="Tajuk seksyen, contohnya Kepimpinan digital dan pengurusan pengetahuan (nombor dijana automatik)" value="${esc(s.tajuk || '')}"><div class="tul-ed-acts"><button class="btn btn-sm" data-arased="-1" title="Promosi: naik satu aras (contoh 2.3.1 menjadi 2.4)"${k.aras > 1 ? '' : ' disabled'}>&#8592; Promosi</button><button class="btn btn-sm" data-arased="1" title="Demosi: turun satu aras di bawah seksyen sebelumnya (contoh 2.4 menjadi 2.3.1)"${bolehDemosi(n, T.sek) ? '' : ' disabled'}>Demosi &#8594;</button><button class="btn btn-sm" data-gerak="-1" title="Alih ke atas">Atas</button><button class="btn btn-sm" data-gerak="1" title="Alih ke bawah">Bawah</button><button class="btn btn-sm" data-salin="1" title="Salin seksyen ke papan keratan dengan format (boleh ditampal ke Word)">Salin</button><button class="btn btn-sm" data-gabung="${n}|${esc(T.sek)}" title="Tambah teks seksyen ini ke hujung seksyen lain, kemudian padam seksyen ini">Gabung</button><button class="btn btn-sm btn-danger" data-padamsek="1">Padam</button></div></div>
      ${s.word && !(s.sumber && s.sumber.jenis === 'word') ? `<div class="tul-sumber">Dikemas kini daripada Word: ${esc(s.word.fail || '')} (${esc(R.fmtTime(s.word.masa || 0))})</div>` : ''}
      ${s.sumber && s.sumber.jenis !== 'templat' ? `<div class="tul-sumber">${s.sumber.jenis === 'banding' ? `Ditulis daripada Banding Artikel: ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukabanding="${esc(s.sumber.idA)}|${esc(s.sumber.idB)}">Buka Banding</button>` : s.sumber.jenis === 'artikel' ? `Berkaitan rekod ${esc(s.sumber.label || '')} <button class="btn btn-sm" data-bukarekod="${esc(s.sumber.id)}">Buka rekod</button>` : s.sumber.jenis === 'word' ? `Dimuat naik daripada Word: ${esc(s.sumber.fail || '')} (${esc(R.fmtTime(s.sumber.masa || 0))})` : ''}</div>` : ''}
      <div id="tulBar" class="tul-bar" role="toolbar" aria-label="Format">
        <span class="grp"><button data-cmd="bold" title="Tebal (Ctrl+B)"><b>B</b></button><button data-cmd="italic" title="Condong (Ctrl+I)"><i>I</i></button><button data-cmd="underline" title="Garis bawah (Ctrl+U)"><u>U</u></button><button data-cmd="superscript" title="Superskrip, contohnya R<sup>2</sup>">x<sup>2</sup></button><button data-cmd="subscript" title="Subskrip, contohnya H<sub>1</sub>">x<sub>2</sub></button><button data-cmd="removeFormat" title="Buang format pada teks yang dipilih">Buang format</button></span>
        <span class="grp warna"><span class="lbl" title="Pilih teks (seret), kemudian klik warna; Asal membuang warna">Warna:</span>${Object.keys(WARNA).map(k => `<button class="w-dot" data-warna="${k}" style="--w:${WARNA[k][0]}" title="${k.charAt(0).toUpperCase() + k.slice(1)}: ${WARNA[k][2]}"><span></span></button>`).join('')}<button data-warna="asal" title="Warna asal (buang warna pada teks yang dipilih)">Asal</button></span>
        <span class="grp"><button data-cmd="insertUnorderedList" title="Senarai berbutir">&#8226; Senarai</button><button data-cmd="insertOrderedList" title="Senarai bernombor">1. Senarai</button></span>
        <span class="grp"><button data-jadual="sisip" title="Sisip jadual pada kedudukan kursor">Jadual</button><button data-imejbtn="1" title="Sisip rajah (fail imej PNG atau JPG) pada kedudukan kursor">Rajah</button><button data-naikseksyen="1" class="naik" title="Baca fail Word (.docx) dan masukkan keseluruhan kandungannya, termasuk jadual dan rajah, ke dalam seksyen ini">Muat naik Word ke seksyen ini</button></span>
        <span class="grp jd"><span class="lbl">Jadual:</span><button data-jadual="baris+" title="Tambah baris di bawah">+ Baris</button><button data-jadual="baris-" title="Tambah baris di atas">Baris di atas</button><button data-jadual="padambaris" title="Padam baris ini">&#8722; Baris</button><button data-jadual="lajur+" title="Tambah lajur di kanan">+ Lajur</button><button data-jadual="padamlajur" title="Padam lajur ini">&#8722; Lajur</button><button data-jadual="kepala" title="Jadikan atau batalkan baris ini sebagai kepala jadual">Kepala</button><button data-jadual="padamjadual" title="Padam keseluruhan jadual">Padam jadual</button></span>
      </div>
      <div id="tulTeks" class="tul-teks tul-kaya" contenteditable="true" spellcheck="true" data-placeholder="Taip perenggan di sini seperti dalam Word. Enter memulakan perenggan baharu; tebal, condong, senarai, jadual dan rajah dikekalkan apabila dimuat turun sebagai Word."></div>
      <input id="tulImejFail" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden>
      <div class="tul-ed-foot"><span id="tulPatah">${s.patah || 0} patah perkataan</span><span id="tulStatus">${s.masa ? 'Disimpan ' + esc(R.fmtTime(s.masa)) : 'Belum disimpan'}</span>${s.sejarah && s.sejarah.length ? `<button class="btn btn-sm" data-sejarah="1">Versi sebelum muat naik (${s.sejarah.length})</button>` : ''}</div>`;
    const ed = editor(); const html = htmlSeksyen(s); ed.innerHTML = html || '<p><br></p>'; kemasKosong(); pasangWarna(ed); pasangImej(ed);
    ed.addEventListener('input', () => { kemasKosong(); tandaKotor(); });
    ed.addEventListener('paste', tampal);
    ed.addEventListener('keydown', kekunci);
    ed.addEventListener('blur', () => { flushEditor(); renderSenarai(); renderBab(); });
    const bar = $('#tulBar');
    bar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.cmd) perintah(b.dataset.cmd); else if (b.dataset.warna) warnakan(b.dataset.warna); else if (b.dataset.jadual === 'sisip') sisipJadual(); else if (b.dataset.jadual) jadualOps(b.dataset.jadual); else if (b.dataset.imejbtn) $('#tulImejFail').click(); else if (b.dataset.naikseksyen) $('#tulFailSek').click(); });
    $('#tulImejFail').addEventListener('change', e => { masukImej(e.target.files); e.target.value = ''; });
    $('#tulTajuk').addEventListener('input', e => { tulisSeksyen(n, T.sek, { tajuk: tanpaNombor(e.target.value) }, { senyap: true }); });
    $('#tulTajuk').addEventListener('change', () => renderSenarai());
    kemasBar();
  }
  function semuaSeksyen() { const out = []; BAB.forEach(([n]) => senarai(n).forEach(id => out.push({ n, id, s: doc(n).seksyen[id] }))); return out; }
  function renderSambung() {
    const el = $('#tulSambung'); if (!el) return;
    const semua = semuaSeksyen(); const terkini = semua.filter(x => x.s.masa && (x.s.patah || 0) > 0).sort((a, b) => (b.s.masa || 0) - (a.s.masa || 0)).slice(0, 5);
    const h = hariIni(); const sm = tarikhStr(Date.now() - 86400000);
    const logHari = tgl => BAB.map(([n]) => { const l = (doc(n).log || {})[tgl]; if (!l) return null; const semuaItem = Object.keys(l.seksyen || {}).sort((a, b) => Math.abs(l.seksyen[b]) - Math.abs(l.seksyen[a])).map(id => { const s = doc(n).seksyen[id]; return s ? `${esc(s.tajuk || 'Tanpa tajuk')} (${l.seksyen[id] >= 0 ? '+' : ''}${l.seksyen[id]})` : null; }).filter(Boolean); const items = semuaItem.slice(0, 8); if (semuaItem.length > 8) items.push('dan ' + (semuaItem.length - 8) + ' seksyen lagi'); return `Bab ${n}: ${l.patah >= 0 ? '+' : ''}${l.patah} patah${items.length ? ' dalam ' + items.join(', ') : ''}`; }).filter(Boolean);
    const lh = logHari(h), ls = logHari(sm);
    const pinjam = BAB.filter(([n]) => doc(n).pinjam).map(([n]) => `Bab ${n} (sejak ${esc(R.fmtTime(doc(n).pinjam.masa))})`);
    const seminggu = BAB.reduce((s, [n]) => { const lg = doc(n).log || {}; return s + Object.keys(lg).filter(k => Date.now() - new Date(k + 'T00:00:00').getTime() < 7 * 86400000).reduce((a, k) => a + (lg[k].patah || 0), 0); }, 0);
    el.innerHTML = `<div class="tul-sambung-grid">
      <div><h3>Sambung semula</h3>${terkini.length ? terkini.map(x => `<button class="tul-link" data-buka="${x.n}|${esc(x.id)}"><b>${esc((nombor(x.n)[x.id] || {}).no || '')} ${esc(x.s.tajuk || 'Tanpa tajuk')}</b> <span>Bab ${x.n} · ${esc(R.fmtTime(x.s.masa))} · ${x.s.patah || 0} patah</span></button>`).join('') : '<div class="help">Belum ada tulisan. Mulakan dengan seksyen pertama.</div>'}</div>
      <div><h3>Apa yang sudah ditulis</h3><div class="tul-log"><b>Hari ini:</b> ${lh.length ? esc(lh.join('; ')) : 'belum ada'}</div><div class="tul-log"><b>Semalam:</b> ${ls.length ? esc(ls.join('; ')) : 'tiada'}</div><div class="tul-log"><b>Tujuh hari terakhir:</b> ${seminggu >= 0 ? '+' : ''}${seminggu} patah perkataan; keseluruhan ${BAB.reduce((s, [n]) => s + jumlahPatah(n), 0)} patah dalam ${semua.length} seksyen.</div>${pinjam.length ? `<div class="tul-log amaran"><b>Peringatan:</b> ${pinjam.join(', ')} dimuat turun ke Word dan belum dimuat naik semula.</div>` : ''}${T.status.awan === 'gagal' ? '<div class="tul-log amaran"><b>Awan:</b> simpanan awan gagal; tulisan tersimpan pada peranti ini sahaja buat masa ini.</div>' : ''}</div></div></div>`;
  }
  function renderCari() {
    const el = $('#tulCariHasil'); if (!el) return; const q = (T.cari || '').trim().toLowerCase();
    if (q.length < 2) { el.hidden = true; el.innerHTML = ''; return; }
    const hits = semuaSeksyen().map(x => { const t = (x.s.tajuk || '') + '\n' + (x.s.teks || ''); const i = t.toLowerCase().indexOf(q); if (i < 0) return null; const a = Math.max(0, i - 90), b = Math.min(t.length, i + q.length + 120); return { x, snip: (a > 0 ? '... ' : '') + t.slice(a, i) + '[[' + t.slice(i, i + q.length) + ']]' + t.slice(i + q.length, b) + (b < t.length ? ' ...' : '') }; }).filter(Boolean);
    el.hidden = false;
    el.innerHTML = `<div class="help">${hits.length} seksyen mengandungi "${esc(q)}"</div>` + hits.map(h => `<button class="tul-link" data-buka="${h.x.n}|${esc(h.x.id)}"><b>${esc((nombor(h.x.n)[h.x.id] || {}).no || 'Bab ' + h.x.n)} ${esc(h.x.s.tajuk || 'Tanpa tajuk')}</b> <span>${esc(h.snip).replace(/\[\[/g, '<mark>').replace(/\]\]/g, '</mark>')}</span></button>`).join('');
  }
  function buka(n, id) { T.bab = n; T.sek = id; renderSemua(); const ta = $('#tulTeks'); if (ta) { ta.focus(); } }
  function peringatan() {
    const p = BAB.filter(([n]) => doc(n).pinjam);
    if (p.length) toast('Peringatan Tulisan: ' + p.map(([n]) => 'Bab ' + n).join(', ') + ' dimuat turun ke Word dan belum dimuat naik semula.', false, { label: 'Buka Tulisan', fn: () => R.goView('tulisan') });
  }

  /* ---- Word: penjanaan ---- */
  async function bundle() { if (!T.bundle) T.bundle = await import('../vendor/tulisan.bundle.js'); return T.bundle; }
  const nodHtml = html => new DOMParser().parseFromString('<!doctype html><html><body>' + String(html || '') + '</body></html>', 'text/html').body;
  const LEBAR_TEKS = 8306; /* lebar teks muka surat dalam twip: A4 11906 tolak jidar kiri 2160 dan kanan 1440 */
  function runsDocx(docx, node, st, imej) {
    const out = [];
    node.childNodes.forEach(c => {
      if (c.nodeType === 3) { const t = c.nodeValue.replace(/\s+/g, ' '); if (t) out.push(new docx.TextRun(Object.assign({ text: t }, st))); return; }
      if (c.nodeType !== 1) return; const tg = c.tagName.toLowerCase();
      if (tg === 'br') { out.push(new docx.TextRun({ break: 1 })); return; }
      if (tg === 'img') {
        const id = c.getAttribute('data-imej'); const im = id && imej[id]; const alt = (c.getAttribute('alt') || '').trim();
        if (im && im.data) { const sk = Math.min(1, 547 / (im.lebar || 547)); const o = { type: im.jenis, data: im.data, transformation: { width: Math.max(1, Math.round((im.lebar || 547) * sk)), height: Math.max(1, Math.round((im.tinggi || 400) * sk)) } }; if (alt) o.altText = { title: alt, description: alt, name: alt }; out.push(new docx.ImageRun(o)); }
        else out.push(new docx.TextRun(Object.assign({ text: '[Rajah tidak dapat dimuatkan]', italics: true }, st)));
        return;
      }
      const st2 = Object.assign({}, st); if (tg === 'strong') st2.bold = true; else if (tg === 'em') st2.italics = true; else if (tg === 'u') st2.underline = {}; else if (tg === 's') st2.strike = true; else if (tg === 'sup') st2.superScript = true; else if (tg === 'sub') st2.subScript = true;
      if (tg === 'span') { const w = warnaElemen(c); if (w) st2.color = heksWarna(w).slice(1); }
      out.push(...runsDocx(docx, c, st2, imej));
    });
    return out;
  }
  function paraDocx(docx, node, imej, dalamJadual, st) {
    const kids = runsDocx(docx, node, st || {}, imej); const adaImej = kids.some(k => k instanceof docx.ImageRun); const adaTeks = (node.textContent || '').trim().length > 0;
    if (adaImej && !adaTeks) return new docx.Paragraph({ children: kids, alignment: docx.AlignmentType.CENTER, spacing: { before: 120, after: 240, line: 240 }, keepNext: false });
    if (dalamJadual) return new docx.Paragraph({ children: kids.length ? kids : [new docx.TextRun('')], spacing: { line: 240, before: 0, after: 0 }, alignment: docx.AlignmentType.LEFT });
    return new docx.Paragraph({ children: kids.length ? kids : [new docx.TextRun('')], spacing: { line: 480, after: 0 }, alignment: docx.AlignmentType.JUSTIFIED, indent: { firstLine: 720 } });
  }
  function blokNod(docx, node, imej, dalamJadual, st) {
    const out = []; const anak = Array.from(node.childNodes); const adaB = anak.some(x => x.nodeType === 1 && BLOK.test(x.tagName.toLowerCase()));
    if (!adaB) { out.push(paraDocx(docx, node, imej, dalamJadual, st)); return out; }
    anak.forEach(e => {
      if (e.nodeType === 3) { if (e.nodeValue.trim()) { const sp = el('span'); sp.textContent = e.nodeValue; out.push(paraDocx(docx, sp, imej, dalamJadual, st)); } return; }
      if (e.nodeType !== 1) return; const tg = e.tagName.toLowerCase();
      if (tg === 'ul' || tg === 'ol') { Array.from(e.children).forEach(li => out.push(new docx.Paragraph({ children: runsDocx(docx, li, st || {}, imej), numbering: { reference: tg === 'ol' ? 'nombor' : 'butir', level: 0 }, spacing: dalamJadual ? { line: 240, after: 0 } : { line: 480 }, alignment: dalamJadual ? docx.AlignmentType.LEFT : docx.AlignmentType.JUSTIFIED }))); return; }
      if (tg === 'table') { out.push(jadualDocx(docx, e, imej)); out.push(new docx.Paragraph({ children: [new docx.TextRun('')], spacing: { line: 240, after: 120 } })); return; }
      if (BLOK.test(tg) && Array.from(e.children).some(x => BLOK.test(x.tagName.toLowerCase()))) { out.push(...blokNod(docx, e, imej, dalamJadual, st)); return; }
      out.push(paraDocx(docx, e, imej, dalamJadual, st));
    });
    return out;
  }
  function jadualDocx(docx, tbl, imej) {
    const rows = Array.from(tbl.querySelectorAll('tr')).filter(r => r.closest('table') === tbl);
    const nLajur = Math.max(1, ...rows.map(r => Array.from(r.children).reduce((a2, c) => a2 + (parseInt(c.getAttribute('colspan'), 10) || 1), 0)));
    const lebar = Math.floor(LEBAR_TEKS / nLajur);
    return new docx.Table({ width: { size: LEBAR_TEKS, type: docx.WidthType.DXA }, columnWidths: Array(nLajur).fill(lebar), rows: rows.map(r => {
      const sel = Array.from(r.children); const kepala = sel.length > 0 && sel.every(c => c.tagName.toLowerCase() === 'th');
      return new docx.TableRow({ tableHeader: kepala, cantSplit: true, children: sel.map(c => { const th = c.tagName.toLowerCase() === 'th'; const cs = parseInt(c.getAttribute('colspan'), 10) || 1; const rs = parseInt(c.getAttribute('rowspan'), 10) || 1; const o = { children: blokNod(docx, c, imej, true, th ? { bold: true } : {}), width: { size: lebar * cs, type: docx.WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, verticalAlign: docx.VerticalAlign.TOP }; if (cs > 1) o.columnSpan = cs; if (rs > 1) o.rowSpan = rs; if (th) o.shading = { fill: 'EAEEF2', type: docx.ShadingType.CLEAR, color: 'auto' }; return new docx.TableCell(o); }) });
    }) });
  }
  /* Rajah bagi semua seksyen yang dieksport dibaca daripada simpanan rajah menjadi bait untuk ImageRun. */
  async function kumpulImej(babs) {
    const imej = {}; const ids = new Set();
    babs.forEach(n => senarai(n).forEach(id => { const h = htmlSeksyen(doc(n).seksyen[id]); (h.match(/data-imej="([a-z0-9]+)"/gi) || []).forEach(m => ids.add(m.slice(11, -1))); }));
    for (const id of ids) { try { const rec = await muatImej(id); if (!rec) continue; const blob = dataUrlKeBlob(rec.url); const data = new Uint8Array(await blob.arrayBuffer()); let lebar = rec.lebar, tinggi = rec.tinggi; if (!lebar || !tinggi) { try { const im = await bacaImej(blob); lebar = im.naturalWidth; tinggi = im.naturalHeight; } catch (e) {} } imej[id] = { data, jenis: /jpe?g/i.test(rec.mime) ? 'jpg' : /gif/i.test(rec.mime) ? 'gif' : 'png', lebar, tinggi }; } catch (e) { console.warn('tulisan: rajah eksport gagal', id, e); } }
    return imej;
  }
  async function janaDocx(babs) {
    const { docx } = await bundle(); const kids = []; const imej = await kumpulImej(babs);
    babs.forEach((n, i) => {
      const d = doc(n); const ids = senarai(n);
      kids.push(new docx.Paragraph({ text: `BAB ${n}`, heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, pageBreakBefore: i > 0 }));
      kids.push(new docx.Paragraph({ text: String(d.tajuk || tajukBab(n)).toUpperCase(), heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER, spacing: { after: 480 } }));
      if (!ids.length) kids.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '(Bab ini belum ada seksyen dalam sistem.)', italics: true })] }));
      const nb = nombor(n); const HL = [docx.HeadingLevel.HEADING_2, docx.HeadingLevel.HEADING_3, docx.HeadingLevel.HEADING_4];
      ids.forEach(id => { const s = d.seksyen[id]; const k = nb[id]; kids.push(new docx.Paragraph({ text: k.no + ' ' + (s.tajuk || 'Tanpa tajuk'), heading: HL[k.aras - 1], spacing: { before: 360, after: 120 } })); kids.push(...blokNod(docx, nodHtml(htmlSeksyen(s)), imej, false)); });
    });
    const d = new docx.Document({
      creator: 'Repositori SLR', title: 'Tulisan Tesis ' + babs.map(n => 'Bab ' + n).join(', '),
      styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } }, paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 0, after: 120 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, italics: true, font: 'Times New Roman' }, paragraph: { spacing: { line: 480, before: 240, after: 120 } } }] },
      numbering: { config: [
        { reference: 'butir', levels: [{ level: 0, format: docx.LevelFormat.BULLET, text: '•', alignment: docx.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: 'nombor', levels: [{ level: 0, format: docx.LevelFormat.DECIMAL, text: '%1.', alignment: docx.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
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
  /* Warna teks daripada fail Word: mammoth membuang warna, maka document.xml dibaca sendiri (JSZip). Run berwarna disusun mengikut
     urutan dokumen dan dipadankan aksara demi aksara (ruang putih diabaikan) dengan nod teks HTML mammoth; bahagian yang sepadan dibalut
     <span class="w-..."> mengikut palet. Jika penjajaran gagal di satu tempat (aksara yang mammoth tukar atau langkau), ia cuba menyegerak
     semula dalam jendela kecil; jika gagal, teks selepas itu dibiarkan tanpa warna. */
  const NAMA_LANGKAU = ['w:del', 'w:txbxContent', 'w:instrText', 'w:delText', 'mc:Fallback'];
  function adaLeluhur(n, nama) { for (let p2 = n.parentNode; p2 && p2.nodeType === 1; p2 = p2.parentNode) if (nama.includes(p2.nodeName)) return true; return false; }
  async function warnaDariDocx(ab, html) {
    let xml; try { const lib = await bundle(); if (!lib.JSZip) return html; const zip = await lib.JSZip.loadAsync(ab); const f = zip.file('word/document.xml'); if (!f) return html; xml = await f.async('string'); } catch (e) { return html; }
    if (!/<w:color /.test(xml)) return html;
    const doc2 = new DOMParser().parseFromString(xml, 'application/xml'); if (doc2.getElementsByTagName('parsererror').length) return html;
    const X = [];
    Array.from(doc2.getElementsByTagName('w:r')).forEach(r => {
      if (adaLeluhur(r, NAMA_LANGKAU)) return;
      let t = ''; Array.from(r.childNodes).forEach(c => { const n = c.nodeName; if (n === 'w:t') t += c.textContent; else if (n === 'w:noBreakHyphen') t += '‑'; });
      if (!t) return; let w = null; const rPr = Array.from(r.childNodes).find(c => c.nodeName === 'w:rPr'); if (rPr) { const col = Array.from(rPr.childNodes).find(c => c.nodeName === 'w:color'); if (col) { const v = col.getAttribute('w:val'); if (v && v !== 'auto') w = padanWarna('#' + v); } }
      for (const ch of t) if (!/\s/.test(ch)) X.push([ch, w]);
    });
    if (!X.some(x => x[1])) return html;
    const dom = new DOMParser().parseFromString('<!doctype html><html><body>' + html + '</body></html>', 'text/html');
    const walker = dom.createTreeWalker(dom.body, NodeFilter.SHOW_TEXT); const nodes = []; let nd; while ((nd = walker.nextNode())) nodes.push(nd);
    let i = 0, gagal = false;
    for (const tn of nodes) {
      if (gagal || i >= X.length) break; const teks = tn.nodeValue; const cols = new Array(teks.length).fill(undefined); let ada = false;
      for (let k = 0; k < teks.length; k++) {
        const ch = teks[k]; if (/\s/.test(ch)) continue; if (i >= X.length) break;
        if (X[i][0] !== ch) {
          let j = i + 1; while (j < X.length && j < i + 30 && X[j][0] !== ch) j++;
          let m2 = k + 1; while (m2 < teks.length && m2 < k + 30 && teks[m2] !== X[i][0]) m2++;
          const skipX = j < X.length && j < i + 30 ? j - i : Infinity, skipH = m2 < teks.length && m2 < k + 30 ? m2 - k : Infinity;
          if (skipX === Infinity && skipH === Infinity) { gagal = true; break; }
          if (skipX <= skipH) i = j; else { k = m2 - 1; continue; }
        }
        cols[k] = X[i][1]; if (X[i][1]) ada = true; i++;
      }
      if (!ada) continue;
      /* ruang putih mengambil warna hanya jika aksara sebelum dan selepasnya sewarna; jika tidak, tanpa warna */
      const asal = cols.slice(); let prev = null; for (let k = 0; k < cols.length; k++) { if (asal[k] === undefined) { let j = k + 1; while (j < cols.length && asal[j] === undefined) j++; const next = j < cols.length ? asal[j] : null; cols[k] = prev && prev === next ? prev : null; } else prev = asal[k]; }
      const frag = dom.createDocumentFragment(); let start = 0;
      for (let k = 1; k <= cols.length; k++) { if (k === cols.length || cols[k] !== cols[start]) { const part = teks.slice(start, k); if (cols[start]) { const sp = dom.createElement('span'); sp.className = 'w-' + cols[start]; sp.textContent = part; frag.appendChild(sp); } else frag.appendChild(dom.createTextNode(part)); start = k; } }
      tn.parentNode.replaceChild(frag, tn);
    }
    return dom.body.innerHTML;
  }
  /* Pembacaan Word: setiap tajuk (h1 hingga h5) memulakan seksyen; blok di bawahnya (perenggan, senarai, jadual, rajah) disimpan sebagai HTML
     yang disaring, dan teks biasa diterbitkan daripadanya untuk perbandingan dan kiraan. */
  function huraiHtml(html, namaFail) {
    const dom = new DOMParser().parseFromString(html, 'text/html'); const kumpulan = []; let semasa = null; let sek = null;
    const bukaKumpulan = (bab, tajuk) => { semasa = { bab, tajuk, seksyen: [] }; kumpulan.push(semasa); sek = null; };
    const tambahBlok = h => { if (!h) return; if (!semasa) bukaKumpulan(null, ''); if (!sek) { sek = { tajuk: 'Tanpa tajuk (' + namaFail.replace(/\.docx$/i, '') + ')', html: '' }; semasa.seksyen.push(sek); } sek.html += h; };
    Array.from(dom.body.children).forEach(e => {
      const tag = e.tagName.toLowerCase(); const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (tag === 'h1') { const m = /^\s*bab\s*(\d)\b[\s.:-]*(.*)$/i.exec(t); if (m) { const n = parseInt(m[1], 10); if (semasa && semasa.bab === n && !semasa.seksyen.length) { if (m[2]) semasa.tajuk = m[2]; } else bukaKumpulan(n, m[2] || ''); return; } if (semasa && !semasa.tajuk && !semasa.seksyen.length && semasa.bab) { semasa.tajuk = t; return; } if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: tanpaNombor(t), aras: 1, html: '' }; semasa.seksyen.push(sek); return; }
      if (tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5') { if (!t) return; if (!semasa) bukaKumpulan(null, ''); sek = { tajuk: tanpaNombor(t), aras: Math.min(ARAS_MAKS, { h2: 1, h3: 2, h4: 3, h5: 3 }[tag]), html: '' }; semasa.seksyen.push(sek); return; }
      if (t || e.querySelector('img')) tambahBlok(e.outerHTML);
    });
    kumpulan.forEach(k => { k.seksyen.forEach(x => { x.html = bersihHtml(x.html); x.teks = teksDariHtml(x.html); }); k.seksyen = k.seksyen.filter(x => x.tajuk || x.teks.trim() || kiraTag(x.html, 'img')); });
    return kumpulan.filter(k => k.seksyen.length);
  }
  function babDariNama(nama) { const m = /bab[\s_-]*(\d)/i.exec(nama || ''); return m ? parseInt(m[1], 10) : null; }
  async function muatNaik(files) {
    files = Array.from(files || []).filter(f => /\.docx$/i.test(f.name)); if (!files.length) { toast('Pilih fail Word (.docx)', true); return; }
    let lib; try { lib = await bundle(); } catch (e) { toast('Pembaca Word gagal dimuatkan; semak talian internet.', true); return; }
    for (const f of files) {
      let html; try { const ab = await f.arrayBuffer(); html = (await lib.mammoth.convertToHtml({ arrayBuffer: ab })).value; html = await warnaDariDocx(ab, html); } catch (e) { toast('Fail ' + f.name + ' tidak dapat dibaca sebagai Word: ' + (e && e.message || e), true); continue; }
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
    const baris = k.seksyen.map((s, i) => { const id = padan(s); const lama = id ? d.seksyen[id] : null; const samaTeks = lama && (lama.teks || '').trim() === s.teks.trim(); const tanpaImej = h => bersihHtml(h).replace(/<img[^>]*>/g, '<img>'); const sama = samaTeks && tanpaImej(htmlSeksyen(lama)) === tanpaImej(s.html); const format = samaTeks && !sama; const sistemBaharu = lama && (lama.teks || '').trim() && (lama.masa || 0) > failMasa + 60000 && !sama; return { i, s, id, lama, status: !lama ? 'baharu' : sama ? 'sama' : format ? 'format' : 'ubah', sistemBaharu, pilih: !lama || (!sama && !sistemBaharu) }; });
    const tiada = ids.filter(id => !dipakai.has(id));
    const adaAmaran = baris.some(b => b.sistemBaharu);
    const html = `<p>Fail <b>${esc(f.name)}</b> (diubah ${esc(R.fmtTime(failMasa))}) dibaca untuk <b>Bab ${n} ${esc(d.tajuk || tajukBab(n))}</b>: ${k.seksyen.length} seksyen. Tanda seksyen yang mahu dimasukkan ke sistem.</p>
      ${adaAmaran ? '<p class="tul-amaran">Amaran: sesetengah seksyen disunting dalam sistem SELEPAS fail Word ini diubah. Seksyen itu tidak ditanda supaya tulisan terbaru dalam sistem tidak ditimpa; tanda sendiri jika Prof Dr pasti fail Word lebih lengkap.</p>' : ''}
      <div class="tul-gabung">${baris.map(b => `<label class="tul-gabung-row"><input type="checkbox" id="tulPilih_${b.i}"${b.pilih ? ' checked' : ''}${b.status === 'sama' ? ' disabled' : ''}><span class="st ${b.status}">${b.status === 'baharu' ? 'Baharu' : b.status === 'sama' ? 'Sama' : b.status === 'format' ? 'Format sahaja' : 'Dikemas kini'}</span><span class="tj">${esc(b.s.tajuk || 'Tanpa tajuk')}</span><span class="mt">${b.lama ? (b.lama.patah || 0) + ' patah dalam sistem' + (b.lama.masa ? ' (' + esc(R.fmtTime(b.lama.masa)) + ')' : '') + ' → ' : ''}${patah(b.s.teks)} patah dalam Word${b.sistemBaharu ? ' · <b>sistem lebih baharu</b>' : ''}${b.status === 'format' ? ' · teks sama, format (warna, tebal, jadual) berbeza' : ''}</span></label>`).join('')}</div>
      ${tiada.length ? `<p class="help">${tiada.length} seksyen dalam sistem tiada dalam fail Word ini dan dikekalkan: ${esc(tiada.map(id => d.seksyen[id].tajuk || 'Tanpa tajuk').join('; '))}.</p>` : ''}
      <p class="help">Versi lama setiap seksyen yang ditimpa disimpan dalam sistem (butang "Versi sebelum muat naik") dan fail Word ini diarkibkan dalam folder Tulisan di Google Drive.</p>`;
    const okk = await R.richModal('Muat naik Word: pratonton gabungan', html, 'Masukkan ke sistem', 'Batal'); if (!okk) return;
    const v = R.richModal.values; let dikemas = 0, baru = 0, rajah = 0, rajahGagal = 0; const masaKini = Date.now();
    for (const b of baris) {
      if (b.status === 'sama' || !v['tulPilih_' + b.i]) continue;
      const r = await naikImejDalamHtml(b.s.html, { n, id: b.id || null, nama: b.s.tajuk }, (i, j) => setStatus(`Menyimpan rajah ${i}/${j}`)); rajah += r.jumlah - r.gagal; rajahGagal += r.gagal;
      if (b.id) { const lama = d.seksyen[b.id]; lama.sejarah = [{ masa: lama.masa || 0, html: htmlSeksyen(lama) }].concat(lama.sejarah || []).slice(0, 3); tulisSeksyen(n, b.id, Object.assign({ html: r.html, word: { fail: f.name, masa: masaKini } }, b.s.aras ? { aras: b.s.aras } : {}), { senyap: true }); dikemas++; }
      else { const idb = seksyenBaru(n, b.s.tajuk, '', { jenis: 'word', fail: f.name, masa: masaKini }); if (b.s.aras && b.s.aras > 1) d.seksyen[idb].aras = b.s.aras; tulisSeksyen(n, idb, { html: r.html }, { senyap: true }); baru++; }
    }
    let drive = false;
    try { if (R.drive().hasToken()) { const nama = f.name.replace(/\.docx$/i, '') + '_dimuatnaik_' + tarikhStr(masaKini) + '.docx'; const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); if (res && res.id) { drive = true; d.fail = [{ id: res.id, nama, masa: masaKini, jenis: 'muatnaik', saiz: f.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); } } } catch (e) { console.warn('tulisan: arkib Drive gagal', e); }
    d.pinjam = null; d.masa = masaKini; Object.keys(T.timers).forEach(k => { clearTimeout(T.timers[k]); });
    await simpanAwan(n, { seksyen: d.seksyen, susunan: d.susunan, log: d.log, pinjam: null, fail: d.fail || [], masa: d.masa });
    T.bab = n; toast(`Bab ${n}: ${dikemas} seksyen dikemas kini, ${baru} seksyen baharu daripada ${f.name}${rajah ? ', ' + rajah + ' rajah disimpan' : ''}${rajahGagal ? ', ' + rajahGagal + ' rajah gagal' : ''}${drive ? '; fail diarkibkan di Drive' : ''}.`);
  }
  /* Muat naik Word terus ke seksyen semasa: keseluruhan kandungan fail (tajuk di dalamnya menjadi perenggan tebal) menggantikan atau
     menyambung kandungan seksyen; versi lama disimpan, rajah dipindahkan ke simpanan rajah, fail diarkibkan di Drive. */
  async function muatNaikSeksyen(f) {
    if (!f || !/\.docx$/i.test(f.name)) { toast('Pilih fail Word (.docx)', true); return; }
    const n = ED.n != null ? ED.n : T.bab, id = ED.id || T.sek; const d = doc(n); const s = id && d.seksyen[id]; if (!s || s.padam) { toast('Pilih seksyen dahulu', true); return; }
    flushEditor();
    let lib; try { lib = await bundle(); } catch (e) { toast('Pembaca Word gagal dimuatkan; semak talian internet.', true); return; }
    let html; try { const ab = await f.arrayBuffer(); html = (await lib.mammoth.convertToHtml({ arrayBuffer: ab })).value; html = await warnaDariDocx(ab, html); } catch (e) { toast('Fail ' + f.name + ' tidak dapat dibaca sebagai Word: ' + (e && e.message || e), true); return; }
    const bersih = bersihHtml(html); const teks = teksDariHtml(bersih);
    if (!teks.trim() && !kiraTag(bersih, 'img')) { toast('Fail ' + f.name + ' tidak mengandungi teks yang dapat dibaca', true); return; }
    const nP = kiraTag(bersih, 'p'), nJ = kiraTag(bersih, 'table'), nI = kiraTag(bersih, 'img'), nPt = patah(teks); const adaLama = (s.patah || 0) > 0 || kiraTag(htmlSeksyen(s), 'img') > 0; const nb = nombor(n)[id];
    const okk = await R.richModal('Muat naik Word ke seksyen ini', `<p>Fail <b>${esc(f.name)}</b> dibaca: ${nP} perenggan, ${nJ} jadual, ${nI} rajah, ${nPt} patah perkataan. Keseluruhan kandungannya akan dimasukkan ke dalam seksyen <b>${esc(nb ? nb.no : '')} ${esc(s.tajuk || 'Tanpa tajuk')}</b>; tajuk seksyen dikekalkan dan tajuk di dalam fail menjadi perenggan tebal.</p><select id="tulCaraSek" class="modal-in"><option value="ganti"${adaLama ? '' : ' selected'}>Ganti kandungan seksyen ini${adaLama ? ' (' + (s.patah || 0) + ' patah sedia ada disimpan sebagai versi lama)' : ''}</option><option value="tambah"${adaLama ? ' selected' : ''}>Tambah di hujung kandungan sedia ada</option></select><p class="help">Rajah disimpan dalam simpanan rajah sistem (saiz dikecilkan) dan fail Word diarkibkan dalam folder Tulisan di Google Drive. Warna latar atau serlahan dalam Word tidak dikekalkan.</p>`, 'Masukkan', 'Batal');
    if (!okk) return; const cara = R.richModal.values.tulCaraSek; const masaKini = Date.now();
    if (nI) toast('Menyimpan ' + nI + ' rajah');
    const r = await naikImejDalamHtml(bersih, { n, id, nama: s.tajuk || f.name }, (i, j) => setStatus(`Menyimpan rajah ${i}/${j}`));
    s.sejarah = [{ masa: s.masa || 0, html: htmlSeksyen(s) }].concat(s.sejarah || []).slice(0, 3);
    const baru = cara === 'tambah' && adaLama ? htmlSeksyen(s) + r.html : r.html;
    tulisSeksyen(n, id, { html: baru, word: { fail: f.name, masa: masaKini } }, { senyap: true, segera: true });
    let drive = false;
    try { if (R.drive().hasToken()) { const nama = f.name.replace(/\.docx$/i, '') + '_seksyen_' + tarikhStr(masaKini) + '.docx'; const res = await R.drive().uploadAs(f, { subfolder: SUB, mime: MIME, name: nama }); if (res && res.id) { drive = true; d.fail = [{ id: res.id, nama, masa: masaKini, jenis: 'muatnaik', saiz: f.size, link: res.webViewLink || R.drive().link(res.id) }].concat(d.fail || []).slice(0, 60); d.masa = masaKini; await simpanAwan(n, { fail: d.fail, masa: d.masa }); } } } catch (e) { console.warn('tulisan: arkib Drive gagal', e); }
    T.bab = n; T.sek = id; renderSemua();
    toast(`Kandungan ${f.name} dimasukkan ke seksyen: ${nPt} patah, ${nJ} jadual, ${nI - r.gagal} rajah${r.gagal ? ' (' + r.gagal + ' rajah gagal disimpan)' : ''}${drive ? '; fail diarkibkan di Drive' : ''}.`);
  }
  async function sejarahModal(n, id) {
    const s = doc(n).seksyen[id]; const html = (s.sejarah || []).map((h, i) => { const t = teksSejarah(h); return `<details${i === 0 ? ' open' : ''}><summary>Versi ${i + 1}: ${esc(R.fmtTime(h.masa))}, ${patah(t)} patah</summary><pre class="tul-pre">${esc(t)}</pre><button class="btn btn-sm" data-pulih="${i}">Pulihkan versi ini</button></details>`; }).join('');
    const modal = $('#modalText'); const onClick = e => { const b = e.target.closest('[data-pulih]'); if (!b) return; const h = s.sejarah[+b.dataset.pulih]; s.sejarah = [{ masa: s.masa || 0, html: htmlSeksyen(s) }].concat(s.sejarah).slice(0, 3); tulisSeksyen(n, id, { html: h.html != null ? h.html : htmlDariTeks(h.teks) }, { segera: true }); $('#modalOk').click(); renderSemua(); toast('Versi dipulihkan'); };
    modal.addEventListener('click', onClick); await R.richModal('Versi sebelum muat naik', html || '<p>Tiada versi tersimpan.</p>', 'Tutup'); modal.removeEventListener('click', onClick);
  }

  /* ---- daripada Banding dan rekod ---- */
  function daripadaBanding(n, tajuk, teks, idA, idB, label) { const id = seksyenBaru(n || 2, tajuk, teks, { jenis: 'banding', idA, idB, label }); T.bab = n || 2; T.sek = id; return id; }

  /* ---- seret dan lepas (tetikus dan sentuh): pegang, seret, lepas; bingkai menunjukkan tempat seksyen akan diletakkan ---- */
  function seretLepas(list) {
    if (!list) return; let st = null;
    const bingkai = document.createElement('div'); bingkai.className = 'tul-drop'; bingkai.innerHTML = '<span>Letak di sini</span>';
    const items = () => Array.from(list.querySelectorAll('.tul-item'));
    const mula = () => {
      st.aktif = true; document.body.classList.add('tul-seret'); st.el.classList.add('dragging');
      st.ghost = st.el.cloneNode(true); st.ghost.className = 'tul-ghost'; st.ghost.style.width = st.el.offsetWidth + 'px'; document.body.appendChild(st.ghost);
      bingkai.style.height = st.el.offsetHeight + 'px'; gerakGhost(st.x, st.y); letakBingkai(st.y);
    };
    const gerakGhost = (x, y) => { if (st && st.ghost) { st.ghost.style.left = (x - st.dx) + 'px'; st.ghost.style.top = (y - st.dy) + 'px'; } };
    const letakBingkai = y => {
      const arr = items().filter(it => it !== st.el); let idx = arr.length;
      for (let i = 0; i < arr.length; i++) { const r = arr[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { idx = i; break; } }
      st.indeks = idx; const ref = arr[idx] || null; if (bingkai.parentNode !== list || bingkai.nextSibling !== ref) list.insertBefore(bingkai, ref);
      const lr = list.getBoundingClientRect(); if (y < lr.top + 28) list.scrollTop -= 8; else if (y > lr.bottom - 28) list.scrollTop += 8;
    };
    const tamat = (batal) => {
      if (!st) return; clearTimeout(st.timer);
      if (st.aktif) {
        document.body.classList.remove('tul-seret'); st.el.classList.remove('dragging'); if (st.ghost) st.ghost.remove();
        const arr = items().filter(it => it !== st.el); const idx = Math.min(st.indeks, arr.length); if (bingkai.parentNode) bingkai.remove();
        if (!batal) { const ids = senarai(T.bab); const target = idx >= arr.length ? ids.length : ids.indexOf(arr[idx].dataset.sek); if (target >= 0) susunSemula(T.bab, st.id, target); }
        const el = st.el; el.dataset.sekat = '1'; setTimeout(() => { delete el.dataset.sekat; }, 50);
      }
      st = null;
    };
    list.addEventListener('pointerdown', e => {
      const it = e.target.closest('.tul-item'); if (!it || e.button > 0 || e.target.closest('button')) return;
      const r = it.getBoundingClientRect(); st = { el: it, id: it.dataset.sek, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, aktif: false, indeks: 0, grip: !!e.target.closest('.tul-grip'), ptr: e.pointerId };
      try { it.setPointerCapture(e.pointerId); } catch (er) {}
      if (!st.grip && e.pointerType !== 'mouse') st.timer = setTimeout(() => { if (st && !st.aktif) mula(); }, 320);
    });
    list.addEventListener('pointermove', e => {
      if (!st) return; st.x = e.clientX; st.y = e.clientY;
      if (!st.aktif) { const d = Math.hypot(e.clientX - st.x0, e.clientY - st.y0); if (d > 6) { if (st.grip || e.pointerType === 'mouse') mula(); else { clearTimeout(st.timer); st = null; } } return; }
      e.preventDefault(); gerakGhost(e.clientX, e.clientY); letakBingkai(e.clientY);
    });
    list.addEventListener('pointerup', () => tamat(false));
    list.addEventListener('pointercancel', () => tamat(true));
    list.addEventListener('touchmove', e => { if (st && st.aktif) e.preventDefault(); }, { passive: false });
    list.addEventListener('click', e => { const it = e.target.closest('.tul-item'); if (it && it.dataset.sekat) { e.stopPropagation(); } }, true);
  }

  /* ---- peristiwa ---- */
  const root = $('#tulisan');
  if (root) {
    root.addEventListener('click', async e => {
      const tab = e.target.closest('[data-bab]'); if (tab) { T.bab = +tab.dataset.bab; T.sek = null; renderSemua(); return; }
      const it = e.target.closest('[data-sek]'); if (it) { T.sek = it.dataset.sek; renderSenarai(); renderEditor(); return; }
      const bk = e.target.closest('[data-buka]'); if (bk) { const [n, id] = bk.dataset.buka.split('|'); buka(+n, id); return; }
      const gb = e.target.closest('[data-gabung]'); if (gb) { const [n, id] = gb.dataset.gabung.split('|'); gabungModal(+n, id); return; }
      const ps = e.target.closest('[data-padamsm]'); if (ps) { const [n, id] = ps.dataset.padamsm.split('|'); const sk = doc(+n).seksyen[id]; if (!sk) return; const okk = await R.confirmBox('Padam seksyen?', `"${sk.tajuk || 'Tanpa tajuk'}" (${sk.patah || 0} patah) akan dipadam daripada Bab ${n}.`, 'Padam'); if (okk) { padamSeksyen(+n, id); renderSemua(); } return; }
      const ar = e.target.closest('[data-aras]'); if (ar) { e.stopPropagation(); if (!ar.disabled) { T.sek = ar.dataset.id; ubahAras(T.bab, ar.dataset.id, +ar.dataset.aras); } return; }
      const ae = e.target.closest('[data-arased]'); if (ae) { if (!ae.disabled) ubahAras(T.bab, T.sek, +ae.dataset.arased); return; }
      const g = e.target.closest('[data-gerak]'); if (g) { gerak(T.bab, T.sek, +g.dataset.gerak); return; }
      if (e.target.closest('[data-salin]')) { salinSeksyen(); return; }
      if (e.target.closest('[data-padamsek]')) { const s = doc(T.bab).seksyen[T.sek]; const okk = await R.confirmBox('Padam seksyen?', `"${s.tajuk || 'Tanpa tajuk'}" (${s.patah || 0} patah) akan dipadam daripada Bab ${T.bab}.`, 'Padam'); if (okk) { padamSeksyen(T.bab, T.sek); renderSemua(); } return; }
      if (e.target.closest('[data-sejarah]')) { sejarahModal(T.bab, T.sek); return; }
      const pt = e.target.closest('[data-pinjamtutup]'); if (pt) { const n = +pt.dataset.pinjamtutup; const d = doc(n); d.pinjam = null; d.masa = Date.now(); await simpanAwan(n, { pinjam: null, masa: d.masa }); renderSemua(); return; }
      if (e.target.closest('[data-tulnaik]')) { $('#tulFail').click(); return; }
      const bb = e.target.closest('[data-bukabanding]'); if (bb) { const [a, b] = bb.dataset.bukabanding.split('|'); R.Banding.state.a = a; R.Banding.state.b = b; R.goView('banding'); R.Banding.banding(); return; }
      const br = e.target.closest('[data-bukarekod]'); if (br) { R.openRecord(br.dataset.bukarekod); }
    });
    root.addEventListener('keydown', e => { const it = e.target.closest('[data-sek]'); if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); T.sek = it.dataset.sek; renderSenarai(); renderEditor(); } });
    $('#btnTulTemplat').addEventListener('click', async () => { const n = T.bab; const ada = new Set(senarai(n).map(id => norm(doc(n).seksyen[id].tajuk))); const kurang = (TEMPLAT[n] || []).filter(([a, t]) => !ada.has(norm(t))).length; if (!kurang) { toast('Semua subtopik proposal Bab ' + n + ' sudah ada dalam senarai'); return; } const okk = await R.confirmBox('Masukkan subtopik proposal?', `${kurang} subtopik Bab ${n} yang belum ada akan ditambah di hujung senarai (seksyen sedia ada tidak disentuh). Susun semula dengan seret dan lepas selepas itu.`, 'Masukkan', false); if (!okk) return; const j = isiTemplat(n); renderSemua(); toast(j + ' subtopik dimasukkan ke Bab ' + n); });
    seretLepas($('#tulSenarai'));
    $('#btnTulSeksyen').addEventListener('click', () => { const id = seksyenBaru(T.bab, '', ''); T.sek = id; renderSemua(); const tj = $('#tulTajuk'); if (tj) tj.focus(); });
    $('#btnTulTurun').addEventListener('click', () => muatTurun());
    $('#btnTulNaik').addEventListener('click', () => $('#tulFail').click());
    $('#tulFail').addEventListener('change', e => { const fs = e.target.files; muatNaik(fs); e.target.value = ''; });
    $('#tulFailSek').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; muatNaikSeksyen(f); e.target.value = ''; });
    $('#tulCari').addEventListener('input', e => { T.cari = e.target.value; renderCari(); });
  }
  return { show, muatTurun, muatNaik, muatNaikSeksyen, daripadaBanding, muatSemua, peringatan, huraiHtml, bersihHtml, teksDariHtml, htmlDariTeks, warnaDariDocx, padanWarna, WARNA, nombor, ubahAras, susunSemula, isiTemplat, gabungSeksyen, renderSemalam, hariAktifTerakhir, simpanEditor, TEMPLAT, state: T, BAB };
}
