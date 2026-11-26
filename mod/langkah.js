/* Langkah dan senarai semak menu Penerbitan (v1.48.0).
   Halaman artikel penerbitan dahulunya satu lajur yang panjang (tajuk, teras kajian, sumber, soal jawab, Pandu Tulis, editor). Kini ia
   dipecahkan kepada lima langkah; hanya satu langkah dipaparkan pada satu masa, maka halaman tidak lagi perlu ditatal jauh.
   Setiap langkah mempunyai senarai semak ringkas yang menggantikan teks bantuan yang panjang: setiap perkara mesti ditanda sebelum
   langkah seterusnya dibuka, supaya perkara itu dibaca dan difahami dahulu. Tanda disimpan pada peranti bagi setiap artikel.
   Teks bantuan yang panjang dipendekkan kepada dua baris; klik teks itu untuk membacanya sepenuhnya. */
export function initLangkah(R) {
  const { $, esc, toast } = R;
  const LANGKAH = [
    { n: 1, nama: 'Tajuk dan jenis', semak: ['Jenis artikel sudah saya pilih; jenis menentukan struktur folder dan soalan pandu.', 'Pembayang tajuk saya tulis dengan kata-kata sendiri, dan unsur teras bertanda bintang sudah diisi.', 'Saya faham setiap janaan cadangan tajuk ialah satu panggilan API berbayar, dengan amaran kos sebelum dihantar.', 'Tajuk rasmi saya pilih dan sunting sendiri; meter Semakan tajuk (tanpa kos) sudah saya baca.'] },
    { n: 2, nama: 'Teras kajian', semak: ['Pernyataan masalah sudah saya baca hingga habis dan jurangnya jelas.', 'Setiap objektif kajian mempunyai persoalan kajian yang sepadan.', 'Cadangan agen ialah bahan mentah; teks yang ditetapkan ialah keputusan saya sendiri (butang Sunting).', 'Saya faham agen membaca teras ini dalam setiap panggilan, maka perubahan di sini mengubah semua folder.'] },
    { n: 3, nama: 'Sumber dan soal jawab', semak: ['Artikel sumber sudah saya pilih (selepas folder disediakan, senarainya berada dalam tab Artikel panduan setiap folder).', 'Saya faham semakin banyak artikel sumber, semakin banyak token bagi setiap panggilan agen.', 'Soal jawab terhad kepada 10 soalan; agen membaca medan A hingga F rekod, bukan PDF.', 'Jawapan agen saya semak dengan rekod sebelum digunakan.'] },
    { n: 4, nama: 'Pandu Tulis', semak: ['Bahasa manuskrip, jurnal sasaran dan sasaran patah perkataan sudah saya tetapkan.', 'Acuan artikel contoh dan pemboleh ubah utama sudah saya semak.', 'Dalam setiap folder, saya memilih artikel panduan dahulu, kemudian menjana contoh penulisan.', 'Contoh penulisan agen masuk ke RAM sahaja; ASAL saya tulis sendiri.'] },
    { n: 5, nama: 'Tulis seksyen', semak: ['RAM ialah ruang draf dan bahan agen; ASAL ialah teks rasmi saya.', 'Setiap sitasi dalam ASAL saya semak dengan rekodnya.', 'Kerja disimpan automatik ke awan; MS Word hanya pintu masuk dan keluar.'] }
  ];
  const L = { id: null, d: null };
  const kunci = id => 'rslr_langkah_' + id;
  function muat(id) { if (L.id === id && L.d) return L.d; const v = R.lsGet(kunci(id), null) || {}; L.id = id; L.d = { l: Math.max(1, Math.min(5, parseInt(v.l, 10) || 1)), s: v.s && typeof v.s === 'object' ? v.s : {} }; return L.d; }
  const simpan = () => { if (L.id) R.lsSet(kunci(L.id), L.d); };
  const tanda = n => { const a = L.d.s[n] || []; return LANGKAH[n - 1].semak.map((x, i) => !!a[i]); };
  const lengkap = n => tanda(n).every(Boolean);
  /* langkah terjauh yang boleh dibuka: semua senarai semak sebelum langkah itu sudah lengkap */
  function had() { let n = 1; while (n < 5 && lengkap(n)) n++; return n; }
  function render(id) {
    const panel = $('#artPanel'), nav = $('#artLangkah'), sm = $('#artSemak'); if (!panel || !nav || !sm || !id) return; const d = muat(id); const h = had(); if (d.l > h) d.l = h;
    panel.dataset.langkah = d.l;
    nav.innerHTML = LANGKAH.map(x => { const t = tanda(x.n); const k = t.filter(Boolean).length; const kunciL = x.n > h; return `<button class="lk-t${x.n === d.l ? ' on' : ''}${k === t.length ? ' siap' : ''}${kunciL ? ' kunci' : ''}" data-lk-pergi="${x.n}" role="tab" aria-selected="${x.n === d.l}" title="${kunciL ? 'Lengkapkan senarai semak langkah sebelumnya dahulu' : esc(x.nama)}"><span class="no">${k === t.length ? '&#10003;' : x.n}</span><span class="nm">${esc(x.nama)}</span><span class="kr">${k}/${t.length}</span></button>`; }).join('');
    const x = LANGKAH[d.l - 1]; const t = tanda(d.l); const k = t.filter(Boolean).length; const siap = k === t.length;
    sm.innerHTML = `<details class="lk-kad${siap ? ' siap' : ''}"${siap && !L.bukaKad ? '' : ' open'}><summary><b>Senarai semak Langkah ${d.l}: ${esc(x.nama)}</b><span class="lk-kira">${k} daripada ${t.length} ditanda</span><span class="lk-bar"><i style="width:${Math.round(k / t.length * 100)}%"></i></span>${d.l < 5 ? `<button class="btn btn-sm btn-primary" data-lk-pergi="${d.l + 1}"${siap ? '' : ' disabled'}>Langkah seterusnya</button>` : ''}</summary><ul>${x.semak.map((s, i) => `<li><label><input type="checkbox" data-lk-cek="${i}"${t[i] ? ' checked' : ''}><span>${esc(s)}</span></label></li>`).join('')}</ul><div class="help lk-nota">Tandakan setiap perkara selepas dibaca dan difahami; langkah seterusnya dibuka apabila semuanya ditanda. Teks bantuan yang panjang dalam halaman ini dipendekkan kepada dua baris: klik teks itu untuk membacanya sepenuhnya.</div></details>`;
  }
  /* Beralih langkah. Mengembalikan false jika langkah itu masih terkunci. */
  function pergi(n, senyap) {
    if (!L.id) return false; n = Math.max(1, Math.min(5, +n || 1)); const h = had();
    if (n > h) { if (!senyap) toast(`Tandakan semua perkara dalam senarai semak Langkah ${h} (${LANGKAH[h - 1].nama}) dahulu`, true); if (L.d.l !== h) { L.d.l = h; simpan(); } L.bukaKad = true; render(L.id); const sm = $('#artSemak'); if (sm) sm.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
    if (L.d.l !== n) { L.d.l = n; simpan(); L.bukaKad = false; render(L.id); const nav = $('#artLangkah'); if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' }); }
    return true;
  }
  const semasa = () => (L.d ? L.d.l : 1);

  const panel = $('#artPanel');
  if (panel) {
    panel.addEventListener('change', e => { const c = e.target.closest('[data-lk-cek]'); if (!c || !L.d) return; const n = L.d.l; const a = tanda(n); a[+c.dataset.lkCek] = c.checked; L.d.s[n] = a; simpan(); L.bukaKad = true; render(L.id); });
    /* fasa tangkap: butang yang membawa ke bahagian dalam langkah lain menukar langkah dahulu, supaya sasaran tatalnya kelihatan */
    panel.addEventListener('click', e => {
      const p = e.target.closest('[data-lk-pergi]'); if (p) { e.preventDefault(); e.stopPropagation(); if (!p.disabled) pergi(p.dataset.lkPergi); return; }
      const b = e.target.closest('[data-pd]'); if (!b || b.disabled || !L.d) return; const a = b.dataset.pd; let n = 0;
      if (a === 'editor' || a === 'dfpergi') n = 5; else if (a === 'dfjudul') n = 1; else if (a === 'buka' && !b.closest('#artPandu')) n = 4;
      if (n && n !== L.d.l && !pergi(n)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  /* teks bantuan yang dipendekkan: klik untuk buka atau tutup */
  document.addEventListener('click', e => {
    if (e.target.closest('a,button,input,select,textarea,label,summary')) return;
    const h = e.target.closest('#artPanel p.help, #artPanel div.help, #artikel > .harian-note, #tulisan > .harian-note, #bengkel > .harian-note'); if (!h || h.classList.contains('lk-nota')) return;
    if (String(window.getSelection && window.getSelection()).trim()) return; h.classList.toggle('buka');
  });
  return { render, pergi, semasa, LANGKAH };
}
