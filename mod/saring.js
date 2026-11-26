/* Saringan rekod (Ruang PRISMA, v1.37.0): angka aliran PRISMA dihasilkan daripada keputusan sebenar bagi setiap rekod, bukan ditaip.
   Langkah 1 menjalankan semula rentetan yang direkodkan bagi setiap pangkalan data yang dicapai oleh sistem, menarik KESEMUA rekod
   (semua halaman API) dan membuang pendua mengikut DOI dan tajuk. Langkah 2 (pilihan) meminta agen MENCADANGKAN keputusan tajuk dan
   abstrak mengikut Jadual kriteria kelayakan; cadangan bukan keputusan sehingga disahkan oleh pemilik. Pemilik merekod keputusan tajuk dan
   abstrak serta penilaian teks penuh bagi setiap rekod. Langkah 3 mengisi medan bahagian 2 Ruang PRISMA (pendua, rekod dikecualikan dan
   sebabnya, laporan tidak diperoleh, laporan dikecualikan mengikut sebab) daripada keputusan yang disahkan; selepas itu medan tersebut
   dikemas kini sendiri setiap kali keputusan berubah, sehingga pemilik menaip sendiri ke dalam medan itu. Tiada angka dianggar.
   Simpanan: meta/pandu_<id>__saring (ringkasan tarikan dan keputusan) dan meta/pandu_<id>__saring_<i> (cebisan rekod). */
import { SARINGAN_TAJUK } from './prompt-pustaka.js';
export function initSaring(X, H) {
  const { R, C, P, esc, toast, angka, simpanT, sekarang, idBaru } = X; const isi = H.isi, num = H.num;
  const HAD_REKOD = 2000, KELOMPOK = 30, HAD_SARING = 3000, SAIZ_HAL = 15, HAD_CEBIS = 600000, HAD_LS = 700000;
  const S = { id: null, d: null, rekod: null, kep: new Map(), awan: {}, timer: null, tSync: null, tapis: 'semua', hal: 0, papar: false, buka: {}, no: {}, sibuk: null, henti: false };
  const kunci = id => 'meta/pandu_' + id + '__saring', kunciC = (id, i) => kunci(id) + '_' + i, ls = id => 'rslr_pandu_' + id + '__saring', lsR = id => 'rslr_pandu_' + id + '__saring_r';
  const kosong = () => ({ v: 1, masa: 0, tarik: null, kep: [] }); const K0 = Object.freeze({});
  const doiDari = u => { const m = /10\.\d{4,9}\/[^\s"<>]+/i.exec(String(u || '')); return m ? m[0].toLowerCase().replace(/[.,;)\]]+$/, '') : ''; };
  const kep = r => S.kep.get(r.rid) || K0;
  const kepTulis = r => { let z = S.kep.get(r.rid); if (!z) { z = { r: r.rid }; S.kep.set(r.rid, z); } return z; };
  const cari = rid => (S.rekod || []).find(r => r.rid === rid) || null;
  function pasang(d) { S.d = Object.assign(kosong(), d || {}); if (!Array.isArray(S.d.kep)) S.d.kep = []; S.kep = new Map(S.d.kep.filter(z => z && z.r).map(z => [z.r, z])); }
  function data() {
    if (S.id !== P.id || !S.d) { S.id = P.id; pasang(R.lsGet(ls(P.id), null)); const rr = R.lsGet(lsR(P.id), null); S.rekod = Array.isArray(rr) ? rr : null; S.tapis = 'semua'; S.hal = 0; S.buka = {}; S.papar = false; muatAwan(P.id); }
    return S.d;
  }
  async function muatAwan(id) {
    if (S.awan[id]) return; S.awan[id] = true;
    try {
      const a = await R.db().get(kunci(id)); if (!a || S.id !== id) return; if ((a.masa || 0) > (S.d.masa || 0)) { pasang(a); R.lsSet(ls(id), S.d); }
      const t = S.d.tarik; if (t && t.cebis && (!S.rekod || S.rekod.length !== t.unik)) { const out = []; for (let i = 0; i < t.cebis; i++) { const c = await R.db().get(kunciC(id, i)); if (c && Array.isArray(c.rekod)) out.push(...c.rekod); } if (S.id === id && out.length) S.rekod = out; }
      if (S.id === id) { segar(); if (H.selepasMuat) H.selepasMuat(); }
    } catch (e) { /* tanpa awan: salinan pada peranti digunakan */ }
  }
  function simpan(segera) {
    const id = S.id; if (!id || !S.d) return; S.d.kep = Array.from(S.kep.values()).filter(z => z.k1 || z.c); S.d.masa = sekarang(); R.lsSet(ls(id), S.d); const dd = JSON.parse(JSON.stringify(S.d));
    clearTimeout(S.timer); S.timer = setTimeout(async () => { try { await R.db().set(kunci(id), dd); } catch (e) { console.warn('saring: simpanan awan gagal', e); toast('Keputusan saringan belum dapat disimpan ke awan; salinan pada peranti ini dikekalkan', true); } }, segera ? 0 : 900);
  }
  async function simpanRekod() {
    const id = S.id; const rs = S.rekod || []; const cebis = []; let cur = [], saiz = 0;
    rs.forEach(r => { const z = JSON.stringify(r).length; if (cur.length && saiz + z > HAD_CEBIS) { cebis.push(cur); cur = []; saiz = 0; } cur.push(r); saiz += z; }); if (cur.length) cebis.push(cur);
    S.d.tarik.cebis = cebis.length; if (JSON.stringify(rs).length < HAD_LS) R.lsSet(lsR(id), rs); else { try { localStorage.removeItem(lsR(id)); } catch (e) { /* abai */ } }
    try { for (let i = 0; i < cebis.length; i++) await R.db().set(kunciC(id, i), { v: 1, i, rekod: cebis[i] }); return true; } catch (e) { console.warn('saring: rekod belum disimpan ke awan', e); return false; }
  }

  /* ---- kriteria sebagai sebab pengecualian ---- */
  const barisK = () => H.kriteria().filter(r => isi(r.m) || isi(r.x)); const kunciK = r => r.kunci || r.id;
  const pilihanSebab = () => barisK().map(r => [kunciK(r), H.labelK(r)]).concat([['lain', 'Sebab lain']]);
  const labelSebab = k => { const p = pilihanSebab().find(z => z[0] === k); return p ? p[1] : k ? 'Sebab lain' : 'Sebab belum dinyatakan'; };
  const teksSebab = k => { const e = H.bahasa() === 'en'; if (!k) return e ? 'Reason not stated' : 'Sebab belum dinyatakan'; const r = barisK().find(z => kunciK(z) === k); if (!r) return e ? 'Other reason' : 'Sebab lain'; const lab = H.labelK(r); return e ? `${lab} criterion not met` : `Kriteria ${lab.charAt(0).toLowerCase() + lab.slice(1)} tidak dipenuhi`; };

  /* ---- artikel sumber artikel ini: padanan dengan rekod pangkalan data mengikut DOI atau tajuk ---- */
  function sumberArtikel() { const dok = C.doc(); const ids = dok ? C.sumberAda(dok) : []; return ids.map(id => { const r = R.S.docs.get(id) || {}; return { id, d: doiDari(r.doi), t: H.normT(r.tajuk) }; }); }
  function padanSemasa() {
    const sm = sumberArtikel(); const rs = S.rekod || []; const doi = new Set(rs.map(r => r.d).filter(Boolean)); const taj = new Set(rs.map(r => H.normT(r.t)).filter(z => z.length >= 12));
    const jumpa = sm.filter(z => (z.d && doi.has(z.d)) || (z.t.length >= 12 && taj.has(z.t))); return { n: sm.length, k: jumpa.length };
  }
  function tandaSumber(rs) { const sm = sumberArtikel(); const doi = new Set(sm.map(z => z.d).filter(Boolean)); const taj = new Set(sm.map(z => z.t).filter(z => z.length >= 12)); rs.forEach(r => { if ((r.d && doi.has(r.d)) || taj.has(H.normT(r.t))) r.sm = 1; else delete r.sm; }); }

  function status() {
    const rs = S.rekod || []; const o = { n: rs.length, belum1: 0, x1: 0, l1: 0, cad: 0, cadX: 0, cadL: 0, cadS: 0, tiada: 0, t2: 0, m2: 0, x2: 0, belum2: 0, sm: 0, ai: 0, tanpaSebab: 0, masukLuar: 0 };
    rs.forEach(r => { const k = kep(r); if (r.sm) o.sm++; if (k.ai) o.ai++;
      if (k.k1 === 'X') { o.x1++; if (!k.s1) o.tanpaSebab++; } else if (k.k1 === 'L') { o.l1++; if (k.k2 === 'T') o.t2++; else if (k.k2 === 'M') { o.m2++; if (!r.sm) o.masukLuar++; } else if (k.k2 === 'X') { o.x2++; if (!k.s2) o.tanpaSebab++; } else o.belum2++; }
      else { o.belum1++; if (k.c) { o.cad++; if (k.c.k === 'X') o.cadX++; else if (k.c.k === 'L') o.cadL++; else o.cadS++; } else o.tiada++; } });
    return o;
  }

  /* ---- langkah 1: tarik semua rekod dan buang pendua ---- */
  function nyahPendua(semua) {
    const unik = []; const olehDoi = new Map(), olehTajuk = new Map(); let pendua = 0;
    semua.forEach(r => { const kt = H.normT(r.t); const tk = kt.length >= 12 ? kt : ''; let m = (r.d && olehDoi.get(r.d)) || null;
      if (!m && tk) m = (olehTajuk.get(tk) || []).find(z => (!z.d || !r.d) && (!z.y || !r.y || Math.abs((+z.y || 0) - (+r.y || 0)) <= 1)) || null;
      if (m) { pendua++; (r.db || []).forEach(n => { if (!m.db.includes(n)) m.db.push(n); }); if (!m.ab && r.ab) m.ab = r.ab; if (!m.d && r.d) { m.d = r.d; olehDoi.set(r.d, m); } return; }
      unik.push(r); if (r.d) olehDoi.set(r.d, r); if (tk) { const a = olehTajuk.get(tk) || []; a.push(r); olehTajuk.set(tk, a); } });
    unik.forEach(r => { r.rid = r.d ? 'doi:' + r.d : r.id; }); return { unik, pendua };
  }
  /* Abstrak yang tidak dibekalkan oleh API pangkalan data (contohnya Scopus) dicari dalam OpenAlex mengikut DOI, tanpa menghantar sebarang
     maklumat pengguna. Kegagalan tidak menghalang saringan: rekod itu kekal tanpa abstrak dan pautan tajuknya digunakan. */
  async function lengkapAbstrak(rs) {
    const perlu = rs.filter(r => r.d && !r.ab && !/[|,\s]/.test(r.d)); let dapat = 0; if (!perlu.length) return { perlu: 0, dapat: 0 };
    let kunciOA = ''; try { const m = await R.db().getMeta(); kunciOA = String(m && m.openalexKey || ''); } catch (e) { /* tanpa kunci */ }
    const peta = new Map(perlu.map(r => [r.d, r])); const dois = Array.from(peta.keys());
    for (let i = 0; i < dois.length; i += 40) {
      try {
        const p = new URLSearchParams({ filter: 'doi:' + dois.slice(i, i + 40).join('|'), 'per-page': '50', select: 'doi,abstract_inverted_index' }); if (kunciOA) p.set('api_key', kunciOA);
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000); let j = null; try { const rr = await fetch('https://api.openalex.org/works?' + p.toString(), { signal: ctl.signal, cache: 'no-store' }); if (!rr.ok) break; j = await rr.json(); } finally { clearTimeout(tm); }
        ((j && j.results) || []).forEach(w => { const r = peta.get(doiDari(w && w.doi)); const inv = w && w.abstract_inverted_index; if (!r || r.ab || !inv || typeof inv !== 'object') return; const kata = []; Object.keys(inv).forEach(k => (inv[k] || []).forEach(n => { kata[n] = k; })); const t = kata.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1200); if (t) { r.ab = t; r.abx = 'OpenAlex'; dapat++; } });
      } catch (e) { break; }
      await new Promise(z => setTimeout(z, 150));
    }
    return { perlu: perlu.length, dapat };
  }
  async function tarik() {
    if (S.sibuk || P.busy) return; data(); const d = H.data(); const adaNama = d.pangkalan.filter(x => isi(x.nama));
    const boleh = adaNama.filter(x => { const p = H.penyambung(x); return isi(x.rentetan) && p && p.halaman; }); const tinggal = adaNama.filter(x => !boleh.includes(x));
    if (!boleh.length) { toast(`Tiada pangkalan data yang boleh ditarik oleh sistem. Rekodkan rentetan carian bagi pangkalan data yang mempunyai API (${H.namaApi}) dalam bahagian 1 dahulu.`, true); return; }
    const kunciApi = {}; for (const x of boleh) { const p = H.penyambung(x); if (!p.kunci) continue; const k = await H.kunciSimpan(p); if (!k) { toast(`Kunci API ${p.nama} belum disimpan. Klik "Jalankan dalam ${p.nama} (sistem)" sekali dan tampal kunci Prof Dr di situ, kemudian ulang langkah ini.`, true); return; } kunciApi[p.id] = k; }
    const ada = !!(S.d.tarik && S.rekod && S.rekod.length);
    const ok = await R.richModal('Tarik semua rekod dan buang pendua', `<p>Sistem menjalankan semula rentetan yang direkodkan bagi <b>${esc(boleh.map(x => x.nama).join(', '))}</b>, menarik <b>kesemua</b> rekod (tajuk, pengarang, tahun, sumber, dan abstrak jika API membekalkannya), kemudian membuang pendua mengikut DOI dan tajuk. Abstrak yang tidak dibekalkan oleh API (contohnya Scopus) dicari dalam OpenAlex mengikut DOI. Bilangan rekod dan tarikh carian setiap pangkalan data dikemas kini kepada hasil tarikan ini. Tiada token digunakan.</p><p>Selepas ini, medan bahagian 2 (rekod pendua, rekod dikecualikan, laporan tidak diperoleh dan sebab pengecualian) diisi oleh sistem daripada keputusan saringan dan menggantikan angka yang ditaip sebelum ini.</p>${tinggal.length ? `<p class="help">Tidak ditarik: ${esc(tinggal.map(x => x.nama).join(', '))}. Sistem tiada capaian API kepadanya, jadi saringan rekodnya tidak dapat direkodkan di sini.</p>` : ''}${ada ? '<p class="help">Senarai rekod sedia ada digantikan. Keputusan yang sudah direkodkan dikekalkan bagi rekod yang masih muncul.</p>' : ''}`, 'Tarik sekarang', 'Batal');
    if (!ok) return; S.sibuk = { mod: 'tarik', teks: 'Menarik rekod' }; segar(); let pSemasa = null;
    try {
      const semua = []; const sumber = [];
      for (const x of boleh) {
        const p = H.penyambung(x); pSemasa = p; const q = H.satuBaris(x.rentetan); const o = { kunci: kunciApi[p.id] || '' }; const docs = []; let mula = 0, n = 0, pus = 0;
        for (;;) {
          const r = await p.halaman(q, o, mula); n = r.n; if (n > HAD_REKOD) throw { code: 'besar', nama: x.nama, n };
          r.docs.forEach(z => { z.db = [x.nama]; docs.push(z); }); pus++; S.sibuk.teks = `Menarik rekod ${x.nama}: ${angka(docs.length)} daripada ${angka(n)}`; segarKepala();
          if (r.seterus == null || docs.length >= n || pus >= 90) break; mula = r.seterus; await new Promise(z => setTimeout(z, 220));
        }
        if (docs.length < n) throw { code: 'kurang', nama: x.nama, n, dapat: docs.length };
        x.rentetan = q; x.n = String(n); x.tarikh = H.hariIni(); x.jalan = { q, masa: Date.now(), n, kaedah: p.kaedah }; delete x.cad; delete x.nota;
        if (docs.length <= 200) { x.hasil = docs.map(z => ({ id: z.id, t: z.t, a: z.a, y: z.y, s: z.s, u: z.u })); x.padan = H.padanSumber(docs); } else { delete x.hasil; delete x.padan; }
        sumber.push({ nama: x.nama, n }); semua.push(...docs);
      }
      const { unik, pendua } = nyahPendua(semua); tandaSumber(unik); S.sibuk.teks = 'Mencari abstrak yang tidak dibekalkan oleh API'; segarKepala(); const abs = await lengkapAbstrak(unik); const sah = new Set(unik.map(r => r.rid)); let gugur = 0;
      Array.from(S.kep.keys()).forEach(k => { if (!sah.has(k)) { S.kep.delete(k); gugur++; } });
      /* Artikel yang sudah ada dalam senarai sumber artikel ini memang telah dicari teks penuhnya: ia lulus peringkat tajuk dan abstrak. */
      unik.forEach(r => { if (r.sm && !kep(r).k1) { const z = kepTulis(r); z.k1 = 'L'; z.auto = 1; delete z.c; } });
      S.rekod = unik; S.d.tarik = { masa: Date.now(), sumber, jumlah: semua.length, pendua, unik: unik.length, cebis: 0, absLuar: abs.dapat, tinggal: tinggal.filter(x => num(x.n) > 0 || isi(x.rentetan)).map(x => x.nama) };
      const awan = await simpanRekod(); simpan(true); S.tapis = 'semua'; S.hal = 0; S.sibuk = null; isiAngka({ senyap: true, penuh: true });
      const pd = padanSemasa();
      toast(`${angka(semua.length)} rekod ditarik (${sumber.map(z => z.nama + ' ' + angka(z.n)).join(', ')}); ${angka(pendua)} pendua dibuang; ${angka(unik.length)} rekod unik untuk disaring. ${pd.k} daripada ${pd.n} artikel sumber artikel ini ditemui dalam rekod itu.${abs.perlu ? ` Abstrak yang tidak dibekalkan oleh API: ${angka(abs.dapat)} daripada ${angka(abs.perlu)} ditemui dalam OpenAlex mengikut DOI.` : ''}${gugur ? ` ${gugur} keputusan lama digugurkan kerana rekodnya tidak lagi muncul.` : ''}${awan ? '' : ' Senarai rekod belum dapat disimpan ke awan; ia kekal pada peranti ini sahaja.'}`);
    } catch (e) {
      S.sibuk = null;
      toast('Rekod tidak dapat ditarik: ' + (e && e.code === 'besar' ? `${e.nama} memulangkan ${angka(e.n)} rekod, melebihi had ${angka(HAD_REKOD)} bagi saringan satu demi satu. Kecilkan rentetan (frasa tepat, medan tajuk dan abstrak, had tahun) dan cuba lagi.` : e && e.code === 'kurang' ? `${e.nama} hanya membekalkan ${angka(e.dapat)} daripada ${angka(e.n)} rekod melalui API. Senarai tidak lengkap tidak digunakan; cuba sebentar lagi.` : H.mesejLarian(e, pSemasa)), true); H.segar();
    }
  }

  /* ---- langkah 3: angka aliran daripada keputusan yang disahkan ---- */
  function isiAngka(o) {
    o = o || {}; data(); const t = S.d.tarik; if (!t || !S.rekod) { if (!o.senyap) toast('Tarik semua rekod dahulu (langkah 1)', true); return false; }
    const d = H.data(); const st = status(); const rs = S.rekod;
    const kumpul = (arr, f) => { const m = new Map(); arr.forEach(r => { const s = teksSebab(f(kep(r))); m.set(s, (m.get(s) || 0) + 1); }); return Array.from(m, ([tt, n]) => ({ id: idBaru('s'), t: tt, n: String(n) })).sort((a, b) => num(b.n) - num(a.n)); };
    const luar = (t.tinggal || []).length > 0; d.pendua = String(t.pendua);
    if (st.belum1 > 0 || luar) { d.dikecualikan = ''; delete d.sebab0; d.tidak = ''; d.sebab = []; delete d.belumNilai; }
    else { d.dikecualikan = String(st.x1); d.sebab0 = kumpul(rs.filter(r => kep(r).k1 === 'X'), z => z.s1); d.tidak = String(st.t2); d.sebab = kumpul(rs.filter(r => kep(r).k1 === 'L' && kep(r).k2 === 'X'), z => z.s2); if (st.belum2 > 0) d.belumNilai = st.belum2; else delete d.belumNilai; }
    d.dariSaring = { masa: Date.now(), unik: t.unik, ai: st.ai }; const pd = padanSemasa(); let isiLain = 0;
    if (!o.senyap && pd.n > pd.k && (!isi(d.lain2) || num(d.lain2) === 0)) { isiLain = pd.n - pd.k; d.lain2 = String(isiLain); if (!isi(d.lain2t)) d.lain2t = 'Carian berbantukan AI (Claude)'; d.guna2 = true; }
    simpanT(!o.senyap); if (o.senyap && !o.penuh) H.segarMedan(); else H.segar();
    if (!o.senyap) {
      const b = [['ok', `Rekod pendua dibuang: ${angka(t.pendua)}, dikira daripada DOI dan tajuk ${angka(t.jumlah)} rekod yang ditarik.`]];
      if (luar) b.push(['amaran', `Rekod daripada ${t.tinggal.join(', ')} tidak dapat ditarik oleh sistem, jadi keputusan saringannya tiada di sini. Medan rekod dikecualikan dikosongkan; jika pangkalan data itu digunakan, rekodkan saringannya dan isi medan bahagian 2 sendiri.`]);
      else if (st.belum1 > 0) b.push(['amaran', `${angka(st.belum1)} rekod belum diputuskan pada tajuk dan abstrak${st.cad ? ` (${angka(st.cad)} daripadanya ada cadangan yang menunggu pengesahan)` : ''}. Rekod dikecualikan, laporan dicari dan angka selepasnya kekal kosong sehingga semua rekod diputuskan.`]);
      else { b.push(['ok', `Rekod dikecualikan pada tajuk dan abstrak: ${angka(st.x1)}. Laporan dicari: ${angka(st.l1)}.`]); b.push([st.belum2 ? 'amaran' : 'ok', st.belum2 ? `${angka(st.belum2)} laporan belum dinilai pada teks penuh. Bilangan kajian dimasukkan tidak dikira sehingga semuanya dinilai. Butang di bawah membuka terus rekod itu.` : `Teks penuh: ${angka(st.t2)} tidak diperoleh, ${angka(st.x2)} dikecualikan selepas dinilai, ${angka(st.m2)} dimasukkan daripada pangkalan data.`]); }
      if (st.tanpaSebab) b.push(['amaran', `${angka(st.tanpaSebab)} pengecualian belum mempunyai sebab. Pilih sebabnya dalam senarai rekod.`]);
      if (!luar && !st.belum1 && st.masukLuar) b.push(['amaran', `${angka(st.masukLuar)} rekod ditanda "Dimasukkan dalam ulasan" tetapi belum ada dalam senarai sumber artikel ini. Kajian yang dirangkum mesti dicartakan dalam Dapatan: tambah artikel itu ke repositori dan ke senarai sumber artikel ini, atau ubah keputusannya jika ia sebenarnya tidak memenuhi kriteria.`]);
      const perlu = luar ? '' : st.belum1 ? 'belum1' : st.belum2 ? 'belum2' : st.tanpaSebab ? 'tanpaSebab' : st.masukLuar ? 'masukLuar' : '';
      if (isiLain) b.push(['', `Kaedah lain: ${angka(isiLain)} artikel sumber artikel ini tidak ditemui dalam rekod pangkalan data, lalu diisi sebagai "${d.lain2t}". Angka ini mengandaikan semua artikel itu calon ulasan; kurangkan jika ada antaranya sumber latar atau rujukan kaedah sahaja.`]);
      else if (pd.n > pd.k && num(d.lain2) !== pd.n - pd.k) b.push(['', `Kaedah lain direkodkan ${angka(num(d.lain2))}, sedangkan ${angka(pd.n - pd.k)} artikel sumber artikel ini tidak ditemui dalam rekod pangkalan data. Semak bahawa angka itu hanya mengira artikel yang dinilai untuk ulasan ini.`]);
      R.richModal('Angka aliran daripada rekod saringan', `<ul class="pd-semak-awal pr-panduan">${b.map(z => `<li class="${z[0]}">${esc(z[1])}</li>`).join('')}</ul><p class="help">Medan itu kini dikemas kini sendiri setiap kali keputusan dalam senarai rekod berubah. Jika Prof Dr menaip sendiri ke dalam medan tersebut, sistem berhenti mengemas kininya sehingga butang ini diklik semula.</p>`, perlu ? 'Tunjukkan rekod itu' : 'Faham', perlu ? 'Tutup' : undefined).then(ya => { if (ya && perlu) tunjuk(perlu); });
    }
    return true;
  }
  function sync() { if (!H.data().dariSaring) return; clearTimeout(S.tSync); S.tSync = setTimeout(() => { isiAngka({ senyap: true }); }, 450); }

  /* ---- langkah 2: agen mencadangkan keputusan tajuk dan abstrak ---- */
  const SEMPANG = new RegExp('\\s*[' + String.fromCharCode(8212, 8211) + ']\\s*', 'g');
  const SKEMA = { type: 'object', additionalProperties: false, required: ['keputusan'], properties: { keputusan: { type: 'array', description: 'Satu entri bagi setiap rekod, dengan nombor yang sama seperti dalam senarai', items: { type: 'object', additionalProperties: false, required: ['i', 'k', 's', 'n'], properties: { i: { type: 'integer' }, k: { type: 'string', enum: ['L', 'X', 'S'], description: 'L lulus ke teks penuh; X jelas gagal kriteria; S tidak pasti' }, s: { type: 'string', description: 'Kunci kriteria yang gagal jika k ialah X; rentetan kosong jika tidak' }, n: { type: 'string', description: 'Nota tidak lebih 15 patah perkataan yang memetik petunjuk dalam tajuk atau abstrak' } } } } } };
  async function agen() {
    if (S.sibuk || P.busy) return; data(); const rs = S.rekod; if (!rs || !rs.length) { toast('Tarik semua rekod dahulu (langkah 1)', true); return; }
    const kr = barisK(); if (!kr.length) { toast('Isi Jadual kriteria kelayakan dahulu (di bahagian atas Ruang PRISMA). Agen menyaring mengikut jadual itu, bukan mengikut tekaan.', true); return; }
    const t = await R.Isi.tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const sasaran = rs.filter(r => { const k = kep(r); return !k.k1 && !k.c; }); if (!sasaran.length) { toast('Tiada rekod yang menunggu cadangan: semua rekod sudah mempunyai keputusan atau cadangan.'); return; }
    const nPanggil = Math.ceil(sasaran.length / KELOMPOK);
    const ok = await R.richModal('Saring tajuk dan abstrak: hantar kepada agen?', `<p>Agen membaca tajuk dan abstrak <b>${angka(sasaran.length)} rekod</b> dan MENCADANGKAN satu daripada tiga keputusan bagi setiap rekod mengikut Jadual kriteria kelayakan: lulus ke teks penuh, dikecualikan (dengan kriteria yang gagal), atau tidak pasti. <b>Cadangan bukan keputusan.</b> Prof Dr mengesahkan atau mengubah setiap cadangan, dan hanya keputusan yang disahkan dikira dalam rajah.</p><p class="help">${angka(nPanggil)} panggilan API dengan kunci API Prof Dr (${KELOMPOK} rekod setiap panggilan; had keluar ${angka(R.Isi.hadKeluar(HAD_SARING))} token setiap panggilan, dan yang dicaj hanyalah token yang benar-benar dijana). Saringan boleh dihentikan pada bila-bila masa; cadangan yang sudah diterima dikekalkan. Penggunaan AI dalam saringan perlu diisytiharkan dalam Metodologi, dan sistem memaklumkannya kepada agen penulisan.</p>`, 'Hantar kepada agen', 'Batal');
    if (!ok) return; const ent = C.entri(X.A.id) || {}; const pv = (P.t.pemboleh || []).filter(v => v.nama); const kunciSah = new Set(kr.map(kunciK));
    const system = `Anda membantu seorang calon PhD menyaring rekod pada peringkat tajuk dan abstrak bagi satu artikel ulasan. Anda MENCADANGKAN keputusan; keputusan muktamad dibuat oleh pengkaji selepas membaca cadangan anda.
KRITERIA KELAYAKAN (kunci | kriteria | diterima | ditolak):
${kr.map(r => `- ${kunciK(r)} | ${H.labelK(r)} | ${String(r.m || '').trim() || 'tidak dinyatakan'} | ${String(r.x || '').trim() || 'tidak dinyatakan'}`).join('\n')}
PERATURAN: (1) Bagi setiap rekod pulangkan satu keputusan. L bermaksud rekod itu berpotensi memenuhi kriteria dan teks penuhnya patut dibaca. X bermaksud tajuk atau abstrak dengan JELAS menunjukkan rekod itu gagal sekurang-kurangnya satu kriteria. S bermaksud maklumat tidak mencukupi untuk memutuskan. (2) Jangan kecualikan kerana ragu: jika ragu pilih S atau L. Rekod tanpa abstrak dinilai daripada tajuk dan sumbernya sahaja, dan dikecualikan hanya jika tajuknya jelas di luar skop. (3) Bagi X, nyatakan dalam "s" kunci kriteria yang gagal, tepat seperti salah satu kunci di atas, dan dalam "n" satu nota tidak lebih 15 patah perkataan yang memetik petunjuk dalam tajuk atau abstrak. Bagi L dan S, "s" ialah rentetan kosong dan "n" menyatakan sebabnya secara ringkas. (4) Had tahun, bahasa, jenis penerbitan dan capaian biasanya sudah dikuatkuasakan oleh rentetan carian; jangan kecualikan atas kriteria itu kecuali rekod itu sendiri jelas menunjukkannya. (5) Jangan mereka maklumat yang tiada dalam rekod, dan jangan gunakan sempang em atau en. Pulangkan JSON mengikut skema, satu entri bagi setiap rekod dengan nombor "i" yang sama.
${SARINGAN_TAJUK}`;
    S.sibuk = { mod: 'agen', teks: `Agen menyaring: 0 daripada ${angka(sasaran.length)} rekod` }; S.henti = false; P.busy = { k: null, mod: 'saring' }; segar();
    const tk = P.t.token || { masuk: 0, keluar: 0, panggil: 0 }; let masuk = 0, keluar = 0, panggil = 0, gagal = 0, siap = 0, ralat = null; const bersih = z => String(z || '').replace(SEMPANG, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    try {
      for (let i = 0; i < sasaran.length && !S.henti; i += KELOMPOK) {
        const kel = sasaran.slice(i, i + KELOMPOK);
        const user = `[MOD:saring]\nTAJUK KERJA ULASAN: ${ent.tajuk || 'belum bertajuk'}\nKONSTRUK UTAMA: ${pv.length ? pv.map(x => x.nama + (x.alias ? ' (' + x.alias + ')' : '')).join('; ') : 'belum ditetapkan'}\nREKOD (${kel.length}):\n${kel.map((r, j) => `[${j + 1}] Tajuk: ${r.t || 'tiada'} | Tahun: ${r.y || 'tiada'} | Sumber: ${r.s || 'tiada'}\n    Abstrak: ${r.ab ? r.ab.slice(0, 700) : 'tiada dalam rekod'}`).join('\n')}\n\nTUGAS: Cadangkan keputusan bagi setiap rekod.`;
        let res; try { res = await R.Isi.hantar(t, { kunciMod: 'pandu-saring:' + t.model, system, content: [{ type: 'text', text: user }], skema: SKEMA, alat: { name: 'cadang_saringan', description: 'Pulangkan cadangan keputusan saringan mengikut struktur ini.', input_schema: SKEMA }, hadToken: HAD_SARING }); } catch (er) { if (er && er.usage) { masuk += R.Isi.masukSemua(er.usage); keluar += er.usage.keluar || 0; panggil++; gagal++; } ralat = er; break; }
        panggil++; masuk += R.Isi.masukSemua(res.usage); keluar += res.usage ? res.usage.keluar : 0; let j = null; try { j = res.input || R.Isi.parseJson(res.text, res.stop); } catch (er) { gagal++; ralat = er; break; }
        const senarai = Array.isArray(j && j.keputusan) ? j.keputusan : []; if (!senarai.length) { gagal++; ralat = { code: 'json', stop: res.stop }; break; }
        senarai.forEach(z => { const r = kel[parseInt(z && z.i, 10) - 1]; if (!r || !/^[LXS]$/.test(String(z.k || ''))) return; const cur = kepTulis(r); if (cur.k1) return; cur.c = { k: z.k, s: z.k === 'X' && kunciSah.has(String(z.s || '')) ? String(z.s) : '', n: bersih(z.n), a: 1 }; });
        siap = Math.min(sasaran.length, i + KELOMPOK); S.sibuk.teks = `Agen menyaring: ${angka(siap)} daripada ${angka(sasaran.length)} rekod`; simpan(); segarKepala();
      }
    } finally {
      P.t.token = { masuk: (tk.masuk || 0) + masuk, keluar: (tk.keluar || 0) + keluar, panggil: (tk.panggil || 0) + panggil, gagal: (tk.gagal || 0) + gagal }; simpanT(true); simpan(true); const henti = S.henti; S.sibuk = null; S.henti = false; P.busy = null; const st = status();
      if (ralat) toast(`Saringan agen terhenti selepas ${angka(siap)} rekod: ${R.Isi.msg(ralat)} Cadangan yang sudah diterima dikekalkan; klik langkah 2 semula untuk menyambung.`, true);
      else toast(`${henti ? 'Saringan agen dihentikan' : 'Saringan agen selesai'}: ${angka(siap)} rekod dibaca dalam ${angka(panggil)} panggilan (token masuk ${angka(masuk)}, keluar ${angka(keluar)}). Cadangan: ${angka(st.cadX)} kecualikan, ${angka(st.cadL)} lulus, ${angka(st.cadS)} tidak pasti. Buka senarai rekod dan sahkan setiap cadangan; cadangan belum dikira dalam rajah.`);
      S.papar = true; if (st.cadS) S.tapis = 'cadS'; else if (st.cadX) S.tapis = 'cadX'; S.hal = 0; X.render();
    }
  }
  function terima(r) { const z = kepTulis(r); const c = z.c; if (!c || c.k === 'S' || z.k1) return false; z.k1 = c.k; if (c.k === 'X') z.s1 = c.s || 'lain'; else delete z.s1; if (c.a) z.ai = 1; delete z.c; return true; }
  async function sahSemua() {
    const t = S.tapis; if (t !== 'cadX' && t !== 'cadL') return; const rs = (S.rekod || []).filter(r => padanTapis(r, t)); if (!rs.length) return;
    const ok = await R.richModal(`Sahkan ${angka(rs.length)} cadangan?`, `<p>${t === 'cadX' ? `<b>${angka(rs.length)} rekod</b> akan direkodkan sebagai <b>dikecualikan pada tajuk dan abstrak</b>, dengan sebab yang dicadangkan bagi setiap satu.` : `<b>${angka(rs.length)} rekod</b> akan direkodkan sebagai <b>lulus ke peringkat teks penuh</b>.`} Keputusan ini dilaporkan dalam rajah sebagai keputusan Prof Dr, maka sahkan hanya selepas membaca senarainya. Mana-mana rekod boleh diubah semula kemudian.</p>`, 'Sahkan semua', 'Batal');
    if (!ok) return; rs.forEach(terima); simpan(true); S.hal = 0; S.tapis = status().cad ? S.tapis : 'semua'; segar(); sync();
  }
  function csv() {
    data(); const rs = S.rekod || []; if (!rs.length) return; const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; const k1 = { L: 'Lulus ke teks penuh', X: 'Dikecualikan' }; const k2 = { M: 'Dimasukkan dalam ulasan', X: 'Dikecualikan selepas dinilai', T: 'Teks penuh tidak diperoleh' };
    const baris = [['Bil', 'Pangkalan data', 'Tajuk', 'Pengarang', 'Tahun', 'Sumber', 'DOI', 'Pautan', 'Keputusan tajuk dan abstrak', 'Sebab', 'Bermula sebagai cadangan AI', 'Penilaian teks penuh', 'Sebab teks penuh', 'Artikel sumber'].map(q).join(',')].concat(rs.map((r, i) => { const k = kep(r); return [i + 1, (r.db || []).join('; '), r.t, r.a, r.y, r.s, r.d, r.u, k1[k.k1] || 'Belum diputuskan', k.k1 === 'X' ? labelSebab(k.s1) : '', k.ai ? 'Ya' : 'Tidak', k.k1 === 'L' ? (k2[k.k2] || 'Belum dinilai') : '', k.k1 === 'L' && k.k2 === 'X' ? labelSebab(k.s2) : '', r.sm ? 'Ya' : ''].map(q).join(','); }));
    const u = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + baris.join('\r\n')], { type: 'text/csv;charset=utf-8' })); const l = document.createElement('a'); l.href = u; l.download = 'Log_Saringan_PRISMA.csv'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  }

  /* ---- paparan ---- */
  /* [kunci, label, kumpulan (1 tajuk dan abstrak, 2 teks penuh), sentiasa dipaparkan]; cip lain hanya muncul apabila ada rekodnya. */
  const TAPIS = [['semua', 'Semua', 1, 1], ['belum1', 'Belum diputuskan', 1, 0], ['tiada', 'Belum ada cadangan', 1, 0], ['cadX', 'Cadangan: kecualikan', 1, 0], ['cadL', 'Cadangan: lulus', 1, 0], ['cadS', 'Cadangan: tidak pasti', 1, 0], ['lulus', 'Lulus saringan', 1, 1], ['kecuali', 'Dikecualikan', 1, 1], ['sumber', 'Artikel sumber', 1, 1],
    ['belum2', 'Belum dinilai', 2, 1], ['masuk', 'Dimasukkan', 2, 1], ['x2', 'Dikecualikan selepas dinilai', 2, 0], ['t2', 'Tidak diperoleh', 2, 0], ['masukLuar', 'Dimasukkan, tiada dalam sumber', 2, 0], ['tanpaSebab', 'Pengecualian tanpa sebab', 2, 0]];
  const PERLU = new Set(['belum1', 'tiada', 'cadX', 'cadL', 'cadS', 'belum2', 'masukLuar', 'tanpaSebab']);
  const padanTapis = (r, t) => { const k = kep(r); return t === 'belum1' ? !k.k1 : t === 'tiada' ? !k.k1 && !k.c : t === 'cadX' ? !k.k1 && !!k.c && k.c.k === 'X' : t === 'cadL' ? !k.k1 && !!k.c && k.c.k === 'L' : t === 'cadS' ? !k.k1 && !!k.c && k.c.k === 'S' : t === 'lulus' ? k.k1 === 'L' : t === 'kecuali' ? k.k1 === 'X' : t === 'sumber' ? !!r.sm : t === 'belum2' ? k.k1 === 'L' && !k.k2 : t === 'masuk' ? k.k1 === 'L' && k.k2 === 'M' : t === 'x2' ? k.k1 === 'L' && k.k2 === 'X' : t === 't2' ? k.k1 === 'L' && k.k2 === 'T' : t === 'masukLuar' ? k.k1 === 'L' && k.k2 === 'M' && !r.sm : t === 'tanpaSebab' ? (k.k1 === 'X' && !k.s1) || (k.k1 === 'L' && k.k2 === 'X' && !k.s2) : true; };
  function teksStatus() {
    if (S.sibuk) return S.sibuk.teks + '…'; const t = S.d.tarik; if (!t) return 'Belum ada rekod ditarik. Langkah 1 menjalankan semula rentetan yang direkodkan dan menarik kesemua rekod; ia tidak menggunakan token.';
    if (!S.rekod) return `Rekod terakhir ditarik pada ${R.fmtTime(t.masa)} (${angka(t.unik)} rekod unik), tetapi senarainya belum dimuat pada peranti ini. Klik langkah 1 untuk menariknya semula; keputusan yang direkodkan dikekalkan.`;
    const st = status(); const pd = padanSemasa();
    return `${angka(t.jumlah)} rekod ditarik pada ${R.fmtTime(t.masa)} (${t.sumber.map(z => z.nama + ' ' + angka(z.n)).join(', ')}); ${angka(t.pendua)} pendua dibuang; ${angka(t.unik)} rekod unik. Tajuk dan abstrak: ${angka(st.x1)} dikecualikan, ${angka(st.l1)} lulus, ${angka(st.belum1)} belum diputuskan${st.cad ? ` (${angka(st.cad)} cadangan menunggu pengesahan)` : ''}. Teks penuh: ${angka(st.m2)} dimasukkan, ${angka(st.x2)} dikecualikan, ${angka(st.t2)} tidak diperoleh, ${angka(st.belum2)} belum dinilai.${st.tanpaSebab ? ` ${angka(st.tanpaSebab)} pengecualian belum ada sebab.` : ''} ${pd.k} daripada ${pd.n} artikel sumber artikel ini ditemui dalam rekod pangkalan data.`;
  }
  function htmlCip() {
    const rs = S.rekod || []; const bil = {}; TAPIS.forEach(z => { bil[z[0]] = 0; }); rs.forEach(r => TAPIS.forEach(z => { if (padanTapis(r, z[0])) bil[z[0]]++; }));
    const kump = g => TAPIS.filter(z => z[2] === g && (z[3] || bil[z[0]] > 0 || S.tapis === z[0])).map(([k, n]) => `<button data-sra="tapis" data-v="${k}" class="${S.tapis === k ? 'aktif' : ''}${PERLU.has(k) && bil[k] > 0 ? ' perlu' : ''}">${n} (${angka(bil[k])})</button>`).join('');
    return `<span class="sr-lbl">Tajuk dan abstrak</span>${kump(1)}<span class="sr-jeda"></span><span class="sr-lbl">Teks penuh</span>${kump(2)}`;
  }
  /* Perkara yang masih menghalang angka aliran, setiap satu dengan butang yang membuka tepat rekod berkenaan. */
  function htmlPerlu() {
    if (S.sibuk || !S.rekod || !S.d.tarik) return ''; const st = status(); const b = [];
    if (st.belum1) b.push(['belum1', `${angka(st.belum1)} rekod belum diputuskan`]); if (st.belum2) b.push(['belum2', `${angka(st.belum2)} laporan belum dinilai`]); if (st.tanpaSebab) b.push(['tanpaSebab', `${angka(st.tanpaSebab)} pengecualian tanpa sebab`]); if (st.masukLuar) b.push(['masukLuar', `${angka(st.masukLuar)} kajian dimasukkan yang tiada dalam sumber`]);
    return b.length ? '<span class="sr-lbl">Perlu tindakan:</span>' + b.map(([k, n]) => `<button class="btn btn-sm sr-btnperlu" data-sra="tunjuk" data-v="${k}">Tunjukkan ${n}</button>`).join('') : '';
  }
  function htmlBaris(r, no) {
    const k = kep(r); const ps = pilihanSebab(); const rid = esc(r.rid); const ops = v => '<option value="">Pilih sebab</option>' + ps.map(([a, b]) => `<option value="${esc(a)}"${v === a ? ' selected' : ''}>${esc(b)}</option>`).join('');
    const pjg = r.ab && r.ab.length > 280; const ab = r.ab ? esc(pjg && !S.buka[r.rid] ? r.ab.slice(0, 260) + '…' : r.ab) + (pjg ? ` <button class="sr-pautan" data-sra="abs" data-id="${rid}">${S.buka[r.rid] ? 'ringkaskan' : 'papar penuh'}</button>` : '') + (r.abx ? ` <span class="sr-tanda">(abstrak daripada ${esc(r.abx)})</span>` : '') : '<i>Abstrak tiada dalam rekod API. Buka pautan tajuk untuk membacanya.</i>';
    const cad = !k.k1 && k.c ? `<div class="sr-ai">${k.c.a ? 'Cadangan agen' : 'Cadangan sistem'}: <b>${k.c.k === 'X' ? 'kecualikan' : k.c.k === 'L' ? 'lulus ke teks penuh' : 'tidak pasti'}</b>${k.c.k === 'X' && k.c.s ? ' · ' + esc(labelSebab(k.c.s)) : ''}${k.c.n ? ' · ' + esc(k.c.n) : ''}${k.c.k !== 'S' ? ` <button class="btn btn-sm" data-sra="sah" data-id="${rid}">Sahkan</button>` : ''}</div>` : '';
    return `<div class="sr-row${k.k1 === 'X' ? ' sr-x' : ''}" data-rid="${rid}"><div class="sr-t"><span class="sr-no">${no}.</span> ${r.u ? `<a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t || 'Tanpa tajuk')}</a>` : esc(r.t || 'Tanpa tajuk')}${r.sm ? ' <span class="sr-sm" title="Artikel ini ada dalam senarai sumber artikel ini">★ artikel sumber</span>' : ''}</div>
      <div class="sr-m">${esc([r.a, r.y, r.s, (r.db || []).join(', ')].filter(Boolean).join(' · '))}</div><div class="sr-ab">${ab}</div>${cad}
      <div class="sr-k"><select data-sr="k1" data-id="${rid}" aria-label="Keputusan tajuk dan abstrak"><option value=""${!k.k1 ? ' selected' : ''}>Belum diputuskan</option><option value="L"${k.k1 === 'L' ? ' selected' : ''}>Lulus ke teks penuh</option><option value="X"${k.k1 === 'X' ? ' selected' : ''}>Dikecualikan</option></select>${k.k1 === 'X' ? `<select data-sr="s1" data-id="${rid}" aria-label="Sebab pengecualian"${k.s1 ? '' : ' class="sr-perlu"'}>${ops(k.s1 || '')}</select>` : ''}${k.k1 === 'L' ? `<select data-sr="k2" data-id="${rid}" aria-label="Penilaian teks penuh"${k.k2 ? '' : ' class="sr-perlu"'}><option value=""${!k.k2 ? ' selected' : ''}>Teks penuh: belum dinilai</option><option value="M"${k.k2 === 'M' ? ' selected' : ''}>Dimasukkan dalam ulasan</option><option value="X"${k.k2 === 'X' ? ' selected' : ''}>Dikecualikan selepas dinilai</option><option value="T"${k.k2 === 'T' ? ' selected' : ''}>Teks penuh tidak diperoleh</option></select>${k.k2 === 'X' ? `<select data-sr="s2" data-id="${rid}" aria-label="Sebab pengecualian teks penuh"${k.s2 ? '' : ' class="sr-perlu"'}>${ops(k.s2 || '')}</select>` : ''}` : ''}${k.ai ? '<span class="sr-tanda" title="Keputusan ini bermula sebagai cadangan agen dan disahkan oleh Prof Dr">bermula sebagai cadangan agen</span>' : k.auto && k.k1 === 'L' ? '<span class="sr-tanda">lulus kerana sudah ada dalam senarai sumber</span>' : ''}</div></div>`;
  }
  function htmlSenarai() {
    const rs = (S.rekod || []); const tap = rs.filter(r => padanTapis(r, S.tapis)); const hal = Math.max(1, Math.ceil(tap.length / SAIZ_HAL)); if (S.hal >= hal) S.hal = hal - 1; const mula = S.hal * SAIZ_HAL; S.no = {};
    const semua = new Map(rs.map((r, i) => [r.rid, i + 1])); const pukal = (S.tapis === 'cadX' || S.tapis === 'cadL') && tap.length ? `<button class="btn btn-sm btn-primary" data-sra="sahsemua">Sahkan ${angka(tap.length)} cadangan dalam tapisan ini</button>` : '';
    return `<div class="sr-cip" id="srCip">${htmlCip()}</div>${pukal ? `<div class="pd-acts">${pukal}<span class="help">Baca senarainya dahulu; setiap rekod boleh diubah satu demi satu.</span></div>` : ''}<div id="srBaris">${tap.slice(mula, mula + SAIZ_HAL).map(r => { const no = semua.get(r.rid); S.no[r.rid] = no; return htmlBaris(r, no); }).join('') || '<div class="pd-kosong">Tiada rekod dalam tapisan ini.</div>'}</div>
      <div class="sr-hal"><button class="btn btn-sm" data-sra="hal" data-v="-1"${S.hal <= 0 ? ' disabled' : ''}>Sebelum</button><span>Halaman ${S.hal + 1} daripada ${hal} · ${angka(tap.length)} rekod</span><button class="btn btn-sm" data-sra="hal" data-v="1"${S.hal >= hal - 1 ? ' disabled' : ''}>Seterusnya</button></div>`;
  }
  function html() {
    data(); const t = S.d.tarik; const sib = S.sibuk; const ada = !!(t && S.rekod);
    return `<h4>Saringan rekod <span class="help">(mengisi bahagian 2 daripada keputusan sebenar)</span></h4>
      <p class="help">Angka aliran datang daripada keputusan bagi setiap rekod, bukan ditaip. Langkah 1 menarik semua rekod daripada pangkalan data yang dijalankan oleh sistem dan membuang pendua. Langkah 2 (pilihan) meminta agen mencadangkan keputusan tajuk dan abstrak mengikut Jadual kriteria kelayakan; cadangan itu bukan keputusan sehingga Prof Dr mengesahkannya. Langkah 3 mengisi medan bahagian 2 daripada keputusan yang disahkan.</p>
      <div class="pd-acts"><button class="btn btn-sm btn-primary" data-sra="tarik"${sib || P.busy ? ' disabled' : ''}>${t ? '1. Tarik semula semua rekod' : '1. Tarik semua rekod dan buang pendua'}</button><button class="btn btn-sm btn-ai" data-sra="agen"${sib || P.busy || !ada ? ' disabled' : ''}>2. Mohon Prof Dr Claude saring tajuk dan abstrak</button><button class="btn btn-sm" data-sra="isi"${sib || !ada ? ' disabled' : ''}>3. Isi angka aliran daripada saringan</button>${ada ? `<button class="btn btn-sm" data-sra="papar"${sib ? ' disabled' : ''}>${S.papar ? 'Sembunyi senarai rekod' : 'Papar senarai rekod'}</button><button class="btn btn-sm" data-sra="csv">Muat turun log saringan (CSV)</button>` : ''}${sib && sib.mod === 'agen' ? '<button class="btn btn-sm" data-sra="henti">Hentikan</button>' : ''}</div>
      <p class="help" id="srStatus">${esc(teksStatus())}</p><div class="pd-acts" id="srPerlu">${htmlPerlu()}</div>${ada && S.papar && !sib ? `<div id="srSenarai">${htmlSenarai()}</div>` : ''}`;
  }
  const kotak = () => { const e = H.elf(); return e && e.el.isConnected ? e.el.querySelector('#prSaring') : null; };
  function segar() { const k = kotak(); if (k) k.innerHTML = html(); }
  function segarKepala() { const k = kotak(); if (!k) return; const st = k.querySelector('#srStatus'); if (st) st.textContent = teksStatus(); const c = k.querySelector('#srCip'); if (c) c.innerHTML = htmlCip(); const pl = k.querySelector('#srPerlu'); if (pl) pl.innerHTML = htmlPerlu(); }
  /* Membuka senarai pada tapisan yang diberi, menatal ke rekod pertama dan menyerlahkannya seketika. */
  function tunjuk(t) { data(); if (!S.rekod || !TAPIS.some(z => z[0] === t)) return; S.papar = true; S.tapis = t; S.hal = 0; segar(); const k = kotak(); const sasar = k && (k.querySelector('#srBaris .sr-row') || k.querySelector('#srSenarai')); if (!sasar) return; sasar.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (sasar.classList.contains('sr-row')) { sasar.classList.add('sr-kilat'); setTimeout(() => { sasar.classList.remove('sr-kilat'); }, 2600); } }
  function segarBaris(rid) { const k = kotak(); const r = cari(rid); if (!k || !r) return; const el = Array.from(k.querySelectorAll('.sr-row')).find(z => z.dataset.rid === rid); if (el) el.outerHTML = htmlBaris(r, S.no[rid] || 0); }
  async function klik(b) {
    const a = b.dataset.sra; data();
    if (a === 'tarik') return tarik(); if (a === 'agen') return agen(); if (a === 'isi') return isiAngka({}); if (a === 'csv') return csv(); if (a === 'sahsemua') return sahSemua();
    if (a === 'henti') { S.henti = true; b.disabled = true; b.textContent = 'Berhenti selepas kelompok ini'; return; }
    if (a === 'tunjuk') { tunjuk(b.dataset.v); return; }
    if (a === 'papar') { S.papar = !S.papar; segar(); return; }
    if (a === 'tapis') { S.tapis = b.dataset.v; S.hal = 0; segar(); return; }
    if (a === 'hal') { S.hal = Math.max(0, S.hal + parseInt(b.dataset.v, 10)); segar(); return; }
    if (a === 'abs') { S.buka[b.dataset.id] = !S.buka[b.dataset.id]; segarBaris(b.dataset.id); return; }
    if (a === 'sah') { const r = cari(b.dataset.id); if (r && terima(r)) { simpan(); segarBaris(r.rid); segarKepala(); sync(); } }
  }
  function ubah(el) {
    data(); const r = cari(el.dataset.id); if (!r) return; const z = kepTulis(r); const m = el.dataset.sr; const v = el.value;
    if (m === 'k1') { const c = z.c; delete z.auto; if (v) { z.k1 = v; if (v === 'X') { if (!z.s1) z.s1 = c && c.k === 'X' && c.s ? c.s : ''; delete z.k2; delete z.s2; } else delete z.s1; if (c && c.a && c.k === v) z.ai = 1; else delete z.ai; delete z.c; } else { delete z.k1; delete z.s1; delete z.k2; delete z.s2; delete z.ai; } }
    else if (m === 's1') z.s1 = v; else if (m === 'k2') { if (v) z.k2 = v; else delete z.k2; if (v !== 'X') delete z.s2; } else if (m === 's2') z.s2 = v; else return;
    simpan(); segarBaris(r.rid); segarKepala(); sync();
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sra]'); if (!b || !b.closest('#prSaring')) return; e.preventDefault(); klik(b); });
  document.addEventListener('change', e => { const el = e.target; if (!el || !el.dataset || !el.dataset.sr || !el.closest('#prSaring')) return; ubah(el); });

  /* Kaedah saringan untuk agen penulisan: hanya apabila angka aliran memang diisi daripada rekod saringan. */
  function teksAgen() {
    data(); const d = H.data(); const t = S.d.tarik; if (!d.dariSaring || !t) return ''; const st = S.rekod ? status() : null; const ai = st ? st.ai : (d.dariSaring.ai || 0);
    return `\nKAEDAH SARINGAN (direkodkan oleh sistem dalam Saringan rekod): ${t.unik} rekod unik disaring pada tajuk dan abstrak selepas ${t.pendua} pendua dibuang secara automatik mengikut DOI dan tajuk.${t.absLuar ? ` Abstrak ${t.absLuar} rekod yang tidak dibekalkan oleh API pangkalan data diambil daripada OpenAlex mengikut DOI.` : ''} ${ai ? `Bagi ${ai} rekod, keputusan awal dicadangkan oleh model AI mengikut Jadual kriteria kelayakan dan setiap cadangan disahkan atau diubah oleh pengkaji sebelum dikira. Nyatakan perkara ini dalam Metodologi, dan jangan tulis bahawa saringan dibuat oleh dua penyaring bebas.` : 'Semua keputusan dibuat oleh pengkaji tanpa cadangan AI; jangan tulis bahawa saringan dibuat oleh dua penyaring bebas kecuali Prof Dr menyatakannya.'}${st && st.belum1 ? ` STATUS: ${st.belum1} rekod belum diputuskan pada tajuk dan abstrak.` : ''}`;
  }
  const keadaan = () => { data(); return { tarik: S.d.tarik, n: (S.rekod || []).length, status: S.rekod ? status() : null, tapis: S.tapis, hal: S.hal, papar: S.papar, kep: Array.from(S.kep.values()), rekod: S.rekod || [] }; };
  return { html, teksAgen, isiAngka, segar, keadaan, tunjuk, csv };
}
