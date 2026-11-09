/* Kalendar muat naik (panel Tapisan, Papan): kalendar bulanan kecil yang menandakan hari yang ada fail dimuat naik (bilangan artikel pada
   setiap hari, mengikut masa fail PDF terbaharu rekod itu; rekod tanpa PDF mengikut masa dicipta). Klik satu hari untuk menapis Papan kepada
   artikel hari itu sahaja (kumpulan pemboleh ubah dan susunan kekal); klik hari yang sama sekali lagi untuk membuka semula. Anak panah
   menukar bulan, "Hari ini" kembali ke bulan semasa. Tapisan disimpan sebagai nilai Dimuat naik = YYYY-MM-DD. */
export function initKalendar(R) {
  const { $, esc } = R;
  const K = { bulan: null, tanda: '' }; // bulan: 'YYYY-MM' yang dipaparkan
  const bulanDari = k => k ? k.slice(0, 7) : null;
  const bulanSemasa = () => R.kunciTarikh(Date.now()).slice(0, 7);
  const anjak = (ym, n) => { const [y, m] = ym.split('-').map(Number); const x = new Date(y, m - 1 + n, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
  const namaBulan = ym => { const [y, m] = ym.split('-').map(Number); return `${R.BULAN_NAMA[m - 1]} ${y}`; };
  function kiraan() {
    const c = new Map();
    R.S.docs.forEach((d0, id) => { const d = Object.assign({}, d0, R.S.pending[id] || {}); const t = R.masaNaik(d); if (!t) return; const k = R.kunciTarikh(t); c.set(k, (c.get(k) || 0) + 1); });
    return c;
  }
  function render() {
    const el = $('#kalNaik'); if (!el) return;
    const pilih = R.ialahTarikh(R.S.filters && R.S.filters.naik) ? R.S.filters.naik : '';
    if (!K.bulan) K.bulan = bulanDari(pilih) || bulanSemasa();
    const c = kiraan(); const hariIni = R.kunciTarikh(Date.now());
    const tanda = K.bulan + '|' + pilih + '|' + hariIni + '|' + Array.from(c.entries()).filter(([k]) => k.startsWith(K.bulan)).map(([k, n]) => k + n).join(',');
    if (tanda === K.tanda && el.children.length) return; K.tanda = tanda;
    const [y, m] = K.bulan.split('-').map(Number); const pertama = new Date(y, m - 1, 1); const nHari = new Date(y, m, 0).getDate();
    const mula = (pertama.getDay() + 6) % 7; // Isnin = lajur pertama
    const jumlahBulan = Array.from(c.entries()).filter(([k]) => k.startsWith(K.bulan)).reduce((a, [, n]) => a + n, 0);
    let sel = '';
    for (let i = 0; i < mula; i++) sel += '<span class="kal-sel kosong"></span>';
    for (let d = 1; d <= nHari; d++) {
      const k = `${K.bulan}-${String(d).padStart(2, '0')}`; const n = c.get(k) || 0;
      const cls = ['kal-sel'];
      if (n) cls.push('ada'); if (k === pilih) cls.push('pilih'); if (k === hariIni) cls.push('hariini');
      const masaDepan = k > hariIni;
      sel += `<button type="button" class="${cls.join(' ')}" data-tarikh="${k}"${masaDepan ? ' disabled' : ''} title="${esc(R.teksTarikh(k))}${n ? ': ' + n + ' artikel dimuat naik' : ''}${k === pilih ? ' (dipilih; klik untuk membuka semula)' : ''}"><span class="kal-no">${d}</span>${n ? `<span class="kal-n">${n}</span>` : ''}</button>`;
    }
    el.innerHTML = `<div class="kal-head"><button type="button" class="kal-nav" data-kal="-1" title="Bulan sebelumnya">&#9664;</button><span class="kal-bulan">${esc(namaBulan(K.bulan))}<small>${jumlahBulan ? jumlahBulan + ' artikel' : 'tiada muat naik'}</small></span><button type="button" class="kal-nav" data-kal="1" title="Bulan berikutnya"${K.bulan >= bulanSemasa() ? ' disabled' : ''}>&#9654;</button></div>
      <div class="kal-grid kal-nama">${['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd'].map(h => `<span>${h}</span>`).join('')}</div>
      <div class="kal-grid">${sel}</div>
      <div class="kal-kaki"><button type="button" class="btn-link" data-kal="hariini">Hari ini</button>${pilih ? `<span class="kal-pilih">Dipilih: ${esc(R.teksTarikh(pilih))}</span><button type="button" class="btn-link" data-kal="buka">Buka semula</button>` : '<span class="kal-pilih">Klik satu hari untuk menapis.</span>'}</div>`;
  }
  function klik(e) {
    const nav = e.target.closest('[data-kal]');
    if (nav) {
      e.preventDefault();
      const v = nav.dataset.kal;
      if (v === 'hariini') K.bulan = bulanSemasa();
      else if (v === 'buka') { R.pilihTarikhNaik(''); return; }
      else K.bulan = anjak(K.bulan || bulanSemasa(), Number(v));
      K.tanda = ''; render(); return;
    }
    const b = e.target.closest('[data-tarikh]'); if (!b || b.disabled) return;
    e.preventDefault();
    const k = b.dataset.tarikh; const semasa = R.S.filters && R.S.filters.naik;
    R.pilihTarikhNaik(semasa === k ? '' : k);
  }
  const el = $('#kalNaik'); if (el) el.addEventListener('click', klik);
  return { render, kiraan, bulan: () => K.bulan, tetapBulan: ym => { K.bulan = ym; K.tanda = ''; render(); } };
}
