/* Flipbook terapung: panel kecil yang boleh diseret dan diubah saiz untuk membaca PDF
   tanpa meninggalkan skrin semasa. Sumber: fail Drive, URL terbuka, atau penimbal. */
export function initFlip(R) {
  const { $, esc, toast } = R;
  const el = $('#flip'), stage = $('#flipStage'), pageEl = $('#flipPage'), canvas = $('#flipCanvas'), msg = $('#flipMsg'), note = $('#flipNote');
  const F = { doc: null, page: 1, zoom: 1, token: 0, task: null, src: null, title: '', min: false, dl: '', pos: null };

  function show(html) { msg.hidden = false; msg.innerHTML = html; }
  function hide() { msg.hidden = true; msg.innerHTML = ''; }
  function setNote(t) { note.textContent = t || ''; note.classList.toggle('show', !!t); }
  function restorePos() {
    const p = R.lsGet('rslr_flip_pos', null);
    if (p && window.innerWidth > 700) { el.style.left = Math.min(Math.max(0, p.x), window.innerWidth - 120) + 'px'; el.style.top = Math.min(Math.max(0, p.y), window.innerHeight - 80) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; if (p.w) el.style.width = p.w + 'px'; if (p.h) el.style.height = p.h + 'px'; }
    else { el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.bottom = ''; el.style.width = ''; el.style.height = ''; }
  }
  function savePos() { if (window.innerWidth <= 700) return; const r = el.getBoundingClientRect(); R.lsSet('rslr_flip_pos', { x: r.left, y: r.top, w: r.width, h: r.height }); }

  async function fetchSource(src, token) {
    if (src.kind === 'buffer') return src.buf.slice(0);
    if (src.kind === 'drive') {
      const Drive = R.drive();
      if (R.V.cache.has(src.id)) return R.V.cache.get(src.id).slice(0);
      if (!Drive.hasToken()) { const ok = await R.ensureDrive(false); if (!ok) throw { code: 'no_token' }; }
      const b = await Drive.download(src.id, p => { if (token === F.token) { const bar = $('#flipProg'); if (bar) bar.style.width = Math.round(p * 100) + '%'; } });
      R.keepCache(src.id, b); return b.slice(0);
    }
    if (src.kind === 'url') {
      let r;
      try { r = await fetch(src.url, { mode: 'cors', credentials: 'omit' }); }
      catch (e) { throw { code: 'cors', message: 'Penerbit tidak membenarkan fail dibaca terus dari aplikasi.' }; }
      if (!r.ok) throw { code: 'http', status: r.status };
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      const buf = await r.arrayBuffer();
      const head = new TextDecoder('latin1').decode(new Uint8Array(buf.slice(0, 1024)));
      if (!head.includes('%PDF') && !ct.includes('pdf')) throw { code: 'not_pdf' };
      return buf;
    }
    throw { code: 'bad_source' };
  }

  async function open(opts) {
    const token = ++F.token;
    if (F.task) { try { F.task.cancel(); } catch (e) {} F.task = null; }
    if (F.doc) { try { F.doc.destroy(); } catch (e) {} F.doc = null; }
    F.src = opts.source; F.title = opts.title || 'Flipbook'; F.page = Math.max(1, opts.page | 0 || 1); F.zoom = 1; F.dl = opts.dl || '';
    F.min = false; el.classList.remove('min');
    $('#flipTitle').textContent = F.title; $('#flipSub').textContent = opts.sub || '';
    $('#flipTotal').textContent = '0'; $('#flipPageInput').value = String(F.page);
    const dl = $('#flipDl'); if (F.dl) { dl.hidden = false; dl.href = F.dl; } else dl.hidden = true;
    $('#flipFull').hidden = !(opts.source && (opts.source.kind === 'drive' && opts.articleId !== undefined || opts.source.kind === 'url'));
    F.articleId = opts.articleId; F.fileIdx = opts.fileIdx || 0;
    setNote(opts.note || '');
    restorePos(); el.hidden = false;
    show(`<div>${esc(opts.source.kind === 'url' ? 'Mengambil PDF daripada penerbit' : 'Memuat turun PDF')}</div><div class="prog" style="width:70%;height:6px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden"><span id="flipProg" style="display:block;height:100%;background:#5EC4C6;width:0"></span></div>`);
    let lib, buf;
    try { lib = await R.loadPdfJs(); } catch (e) { show('<div>Pemapar PDF gagal dimuatkan. Semak talian internet.</div>'); return; }
    try { buf = await fetchSource(opts.source, token); }
    catch (e) {
      if (token !== F.token) return;
      const link = F.dl ? `<a class="vbtn" href="${esc(F.dl)}" target="_blank" rel="noopener">Buka PDF dalam tab baharu</a>` : '';
      if (e.code === 'cors' || e.code === 'not_pdf' || e.code === 'http') show(`<div>${esc(e.code === 'cors' ? 'Penerbit ini tidak membenarkan PDF dibaca terus dalam aplikasi.' : e.code === 'not_pdf' ? 'Pautan ini tidak memulangkan fail PDF (mungkin halaman web penerbit).' : 'Pelayan penerbit menolak permintaan (' + e.status + ').')}</div><div>Muat turun fail itu, kemudian muat naik ke repositori untuk membacanya di sini.</div>${link}`);
      else if (e.code === 'no_token') { show(`<div>Google Drive belum disambung.</div><button class="vbtn" id="flipConnect">Sambung Drive</button>`); $('#flipConnect').addEventListener('click', async () => { if (await R.ensureDrive(true)) open(opts); }); }
      else show(`<div>${esc('Fail tidak dapat dimuat turun: ' + R.driveMsg(e))}</div>${link}`);
      return;
    }
    if (token !== F.token) return;
    show('<div>Membuka dokumen</div>');
    try {
      const doc = await lib.getDocument({ data: buf, standardFontDataUrl: R.V.stdFonts, stopAtErrors: false }).promise;
      if (token !== F.token) { try { doc.destroy(); } catch (e) {} return; }
      F.doc = doc; F.page = Math.min(doc.numPages, F.page);
      $('#flipTotal').textContent = String(doc.numPages);
      hide(); await render();
    } catch (e) { if (token === F.token) show(`<div>Fail ini tidak dapat dibaca sebagai PDF${e && e.name === 'PasswordException' ? ' (dilindungi kata laluan)' : ''}.</div>`); }
  }

  async function render() {
    if (!F.doc) return;
    const token = F.token, no = F.page;
    let page; try { page = await F.doc.getPage(no); } catch (e) { return; }
    if (token !== F.token || no !== F.page) return;
    const base = page.getViewport({ scale: 1 });
    const availW = Math.max(100, stage.clientWidth - 24);
    const scale = Math.min(6, Math.max(0.2, (availW / base.width) * F.zoom));
    const vp = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    let out = dpr; const maxPx = 9e6; if (vp.width * vp.height * out * out > maxPx) out = Math.sqrt(maxPx / (vp.width * vp.height));
    if (F.task) { try { F.task.cancel(); } catch (e) {} F.task = null; }
    canvas.width = Math.max(1, Math.floor(vp.width * out)); canvas.height = Math.max(1, Math.floor(vp.height * out));
    canvas.style.width = Math.floor(vp.width) + 'px'; canvas.style.height = Math.floor(vp.height) + 'px';
    const ctx = canvas.getContext('2d', { alpha: false }); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({ canvasContext: ctx, viewport: vp, transform: out !== 1 ? [out, 0, 0, out, 0, 0] : null }); F.task = task;
    try { await task.promise; } catch (e) { return; }
    if (F.task === task) F.task = null;
    $('#flipPageInput').value = String(F.page);
    $('#flipPrev').disabled = F.page <= 1; $('#flipNext').disabled = F.page >= F.doc.numPages;
  }
  let turning = false;
  async function goto(n, animate) {
    if (!F.doc) return; n = Math.min(F.doc.numPages, Math.max(1, n | 0)); if (n === F.page || turning) return;
    const dir = n > F.page ? 'turn-next' : 'turn-prev';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (animate !== false && !reduce) {
      turning = true; pageEl.classList.add(dir);
      await new Promise(r => setTimeout(r, 200));
      F.page = n; stage.scrollTop = 0; await render();
      pageEl.classList.remove(dir); turning = false;
    } else { F.page = n; stage.scrollTop = 0; await render(); }
  }
  function close() {
    el.hidden = true; F.token++;
    if (F.task) { try { F.task.cancel(); } catch (e) {} F.task = null; }
    if (F.doc) { try { F.doc.destroy(); } catch (e) {} F.doc = null; }
    F.src = null;
  }
  function isOpen() { return !el.hidden; }

  $('#flipPrev').addEventListener('click', () => goto(F.page - 1));
  $('#flipNext').addEventListener('click', () => goto(F.page + 1));
  $('#flipZoomIn').addEventListener('click', () => { F.zoom = Math.min(4, F.zoom * 1.2); render(); });
  $('#flipZoomOut').addEventListener('click', () => { F.zoom = Math.max(0.4, F.zoom / 1.2); render(); });
  $('#flipClose').addEventListener('click', close);
  $('#flipMin').addEventListener('click', () => { F.min = !F.min; el.classList.toggle('min', F.min); if (!F.min) render(); });
  $('#flipFull').addEventListener('click', () => {
    if (F.src && F.src.kind === 'drive' && F.articleId) { const p = F.page; close(); R.openViewer(F.articleId, F.fileIdx).then(() => { setTimeout(() => R.gotoPage(p), 400); }); }
    else if (F.dl) window.open(F.dl, '_blank', 'noopener');
  });
  $('#flipPageInput').addEventListener('change', e => goto(parseInt(e.target.value, 10) || 1, false));
  $('#flipPageInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); goto(parseInt(e.target.value, 10) || 1, false); e.target.blur(); } });
  stage.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); F.zoom = Math.min(4, Math.max(0.4, F.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); render(); } }, { passive: false });
  document.addEventListener('keydown', e => {
    if (el.hidden || F.min || !F.doc || !$('#viewer').hidden) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowLeft') { goto(F.page - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { goto(F.page + 1); e.preventDefault(); } else if (e.key === 'Escape') close();
  });
  // swipe on touch
  let tx = 0, ty = 0, tt = 0;
  stage.addEventListener('touchstart', e => { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now(); } }, { passive: true });
  stage.addEventListener('touchend', e => { if (!e.changedTouches.length || !F.doc) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Date.now() - tt < 700 && Math.abs(dx) > 60 && Math.abs(dy) < 50 && stage.scrollWidth <= stage.clientWidth + 4) goto(dx < 0 ? F.page + 1 : F.page - 1); }, { passive: true });
  // drag by header
  const head = $('#flipHead'); let drag = null;
  const start = (x, y) => { if (window.innerWidth <= 700) return; const r = el.getBoundingClientRect(); drag = { dx: x - r.left, dy: y - r.top }; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; };
  const move = (x, y) => { if (!drag) return; el.style.left = Math.min(Math.max(0, x - drag.dx), window.innerWidth - 100) + 'px'; el.style.top = Math.min(Math.max(0, y - drag.dy), window.innerHeight - 60) + 'px'; };
  head.addEventListener('mousedown', e => { if (e.target.closest('button')) return; start(e.clientX, e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => { if (drag) { drag = null; savePos(); } });
  head.addEventListener('touchstart', e => { if (e.target.closest('button')) return; start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  head.addEventListener('touchmove', e => { if (drag) { move(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
  head.addEventListener('touchend', () => { if (drag) { drag = null; savePos(); } });
  if (window.ResizeObserver) { let rt = null; new ResizeObserver(() => { if (el.hidden) return; clearTimeout(rt); rt = setTimeout(() => { savePos(); if (F.doc) render(); }, 150); }).observe(el); }
  window.addEventListener('resize', () => { if (!el.hidden && F.doc) render(); });

  return { open, close, goto, isOpen, state: F };
}
