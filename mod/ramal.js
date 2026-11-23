/* Ramalan ayat bersitasi dan rujukan APA 7 sitasi (v1.46.0), dikongsi oleh Tulisan Tesis dan Artikel (kilang initTulisan).
   (1) Ramalan ayat dalam RAM: apabila Prof Dr menamatkan ayat dengan noktah (atau tanda soal atau seru) di hujung perenggan dan berhenti
       menaip seketika, sistem mencadangkan satu ayat seterusnya sebagai teks bayang (kelabu) pada kedudukan kursor. Tab menerimanya, Esc
       menolaknya, Alt+] dan Alt+[ menukar cadangan, Ctrl+. meramal serta-merta; menaip apa-apa membuang bayang itu, maka aliran tulisan
       Prof Dr sendiri tidak pernah tersekat. Ramalan hanya dalam RAM: ASAL tidak pernah ditulis oleh agen.
   (2) Sumber repositori sahaja dan sitasi oleh sistem: model menerima ringkasan medan rekod repositori (R.S.docs) dengan kod R1, R2 dan
       seterusnya, dan hanya memulangkan ayat tanpa sitasi, kod rekod yang menyokongnya, serta petikan bukti yang disalin daripada medan
       rekod itu. Sistem menolak kod yang tidak wujud, menyemak petikan bukti dengan teks rekod sebenar, kemudian membina sitasi APA 7
       sendiri daripada medan Penulis dan Tahun rekod. Maka setiap sitasi dalam cadangan pasti wujud dalam repositori.
   (3) Popup rujukan: klik mana-mana sitasi dalam RAM atau ASAL (termasuk yang ditaip sendiri) memaparkan rujukan APA 7 lengkap rekod itu
       (medan Rujukan APA 7) dengan butang Salin, Buka rekod dan Senarai rujukan seksyen ini. Sitasi yang sepadan dengan rekod digaris
       bawah titik-titik melalui CSS Custom Highlight API (tanpa mengubah HTML yang disimpan).
   Kos: setiap ramalan ialah satu panggilan kecil ke API Anthropic dengan kunci Prof Dr (lalai Claude Opus 5.5 atas pilihan Prof Dr demi
   mutu bahasa akademik, effort rendah; Haiku 5.5 dan Sonnet 5.5 boleh dipilih dalam Tetapan ramalan).
   Pustaka repositori diletakkan dalam mesej sistem yang dicache, maka ramalan berturut-turut dalam masa lima minit membacanya daripada
   cache. Harga (USD per juta token, disemak dengan dokumentasi Anthropic pada 23 November 2026): Haiku 5.5 masuk 0.10, keluar 0.50;
   Sonnet 5.5 masuk 2, keluar 10; Opus 5.5 masuk 4, keluar 20; Fable 5.2 masuk 8, keluar 40. */
import { PIAWAI_RINGKAS } from './bahasa-data.js';

export function initRamal(R, H) {
  const { esc, toast } = R;
  const LS = 'rslr_ramal', LS_GUNA = 'rslr_ramal_guna';
  const MODEL_RAMAL = [['claude-opus-5-5', 'Claude Opus 5.5: bahasa akademik paling halus (lalai), lebih perlahan, kira-kira 30 kali kos Haiku 5.5'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5: seimbang, kira-kira separuh kos Opus 5.5'], ['claude-haiku-5-5', 'Claude Haiku 5.5: paling pantas dan paling murah'], ['tetapan', 'Ikut model dalam Tetapan aplikasi']];
  /* [masuk, keluar, cache dibaca, cache ditulis 5 minit] USD per juta token */
  const HARGA = { 'claude-haiku-5-5': [0.10, 0.50, 0.01, 0.125], 'claude-sonnet-5-5': [2, 10, 0.10, 2.5], 'claude-opus-5-5': [4, 20, 0.20, 5], 'claude-fable-5-2': [8, 40, 0.20, 10] };
  const JEDA = [[800, '0.8 saat'], [1200, '1.2 saat (lalai)'], [2000, '2 saat'], [3000, '3 saat']];
  const LALAI = { on: false, model: 'claude-opus-5-5', jeda: 1200, bil: 3, popup: true, had: 300 };
  /* Pustaka penuh dihantar jika anggarannya tidak melebihi had ini (supaya dicache); jika lebih, hanya rekod paling hampir. Had diletakkan
     jauh di bawah 100,000 token kerana Haiku 5.5 mengenakan kadar lebih tinggi bagi permintaan yang melebihi 100,000 token masuk. */
  const HAD_PENUH = 36000, BIL_HAMPIR = 45;
  const PREFIX = H.prefix || 'tul';
  const NAMA_SERLAH = 'sitasi-' + PREFIX;
  const Z = { timer: null, ctl: null, seq: 0, hantu: null, kad: null, calon: [], i: 0, julat: null, awalan: '', sisip: false, cache: new Map(), gagal: 0, tk: null, tkMasa: 0, pop: null, tSerlah: null, hadDimaklum: '', pustaka: null };

  /* ---------------- tetapan dan penggunaan (per peranti) ---------------- */
  function tet() {
    const t = Object.assign({}, LALAI, R.lsGet(LS, {}) || {});
    if (!MODEL_RAMAL.some(m => m[0] === t.model)) t.model = LALAI.model;
    if (!JEDA.some(j => j[0] === +t.jeda)) t.jeda = LALAI.jeda; else t.jeda = +t.jeda;
    t.bil = Math.max(1, Math.min(3, parseInt(t.bil, 10) || LALAI.bil)); t.had = Math.max(10, Math.min(5000, parseInt(t.had, 10) || LALAI.had));
    t.on = !!t.on; t.popup = t.popup !== false; return t;
  }
  function simpanTet(p) { R.lsSet(LS, Object.assign(tet(), p)); kemasButang(); }
  const hariIni = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function guna() { const g = R.lsGet(LS_GUNA, null); return g && g.tarikh === hariIni() ? g : { tarikh: hariIni(), n: 0, terima: 0, masuk: 0, keluar: 0, cacheBaca: 0, cacheTulis: 0, usd: 0 }; }
  function kosUsd(u, model) { const h = HARGA[model]; if (!h || !u) return 0; return ((u.masuk || 0) * h[0] + (u.keluar || 0) * h[1] + (u.cacheBaca || 0) * h[2] + (u.cacheTulis || 0) * h[3]) / 1e6; }
  function catatGuna(u, model) { const g = guna(); g.n++; if (u) { g.masuk += u.masuk || 0; g.keluar += u.keluar || 0; g.cacheBaca += u.cacheBaca || 0; g.cacheTulis += u.cacheTulis || 0; g.usd += kosUsd(u, model); } R.lsSet(LS_GUNA, g); }
  function catatTerima() { const g = guna(); g.terima++; R.lsSet(LS_GUNA, g); }
  const angka = n => Number(n || 0).toLocaleString('en-US');
  const usd = v => 'US$' + (v < 0.01 ? Number(v || 0).toFixed(4) : Number(v || 0).toFixed(3));
  async function kunci(model) {
    if (!Z.tk || Date.now() - Z.tkMasa > 60000) { Z.tk = await R.Isi.tetapan(); Z.tkMasa = Date.now(); }
    return Object.assign({}, Z.tk, { model: model === 'tetapan' ? Z.tk.model : model });
  }

  /* ---------------- teks dan token ---------------- */
  const bersih = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const patah = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const HENTI = new Set(('yang dan di ke dari daripada dalam untuk bagi pada oleh dengan ini itu adalah ialah merupakan juga atau serta tidak bukan telah sudah akan boleh dapat lebih kurang antara terhadap kepada sebagai seperti iaitu kerana sebab maka jika apabila manakala namun tetapi walau walaupun bahawa supaya agar hingga sehingga setiap semua para pula lagi masih hanya sahaja turut iaitu yakni tersebut mereka kita kami beliau ia dia nya kajian pengkaji penyelidik dapatan menunjukkan mendapati didapati menurut selain itu oleh itu malah bahkan justeru the and of to in on at for with by from as is are was were be been being this that these those which who whom whose it its their there than then also not no or but if into over under between among within across about such may can could would should must has have had do does did study studies research found finding findings shows showed show suggest suggests suggested indicate indicates indicated result results et al').split(' '));
  /* jambatan dwibahasa istilah teras: perkataan Inggeris dipadankan dengan istilah Melayu yang sama supaya carian merentas bahasa */
  const SINONIM = { leadership: 'kepimpinan', leaders: 'pemimpin', leader: 'pemimpin', principal: 'gurubesar', principals: 'gurubesar', headteacher: 'gurubesar', headteachers: 'gurubesar', headmaster: 'gurubesar', headmasters: 'gurubesar', pengetua: 'gurubesar', competence: 'kompetensi', competency: 'kompetensi', competencies: 'kompetensi', competences: 'kompetensi', knowledge: 'pengetahuan', management: 'pengurusan', teacher: 'guru', teachers: 'guru', school: 'sekolah', schools: 'sekolah', primary: 'rendah', secondary: 'menengah', organisational: 'organisasi', organizational: 'organisasi', organisation: 'organisasi', organization: 'organisasi', organisations: 'organisasi', organizations: 'organisasi', sharing: 'perkongsian', transformational: 'transformasi', transformation: 'transformasi', technology: 'teknologi', technologies: 'teknologi', technological: 'teknologi', training: 'latihan', professional: 'profesional', development: 'pembangunan', performance: 'prestasi', culture: 'budaya', innovation: 'inovasi', innovative: 'inovasi', readiness: 'kesediaan', efficacy: 'efikasi', mediating: 'perantara', mediation: 'perantara', mediator: 'perantara', mediates: 'perantara', effect: 'kesan', effects: 'kesan', impact: 'kesan', influence: 'pengaruh', influences: 'pengaruh', relationship: 'hubungan', relationships: 'hubungan', student: 'murid', students: 'murid', pupils: 'murid', pelajar: 'murid', learning: 'pembelajaran', teaching: 'pengajaran', challenge: 'cabaran', challenges: 'cabaran', barriers: 'cabaran', skills: 'kemahiran', skill: 'kemahiran', integration: 'integrasi', collaboration: 'kolaborasi', collaborative: 'kolaborasi', support: 'sokongan', vision: 'wawasan', visi: 'wawasan', policy: 'dasar', policies: 'dasar', rural: 'luarbandar', urban: 'bandar', creation: 'penciptaan', acquisition: 'pemerolehan', application: 'aplikasi', socialisation: 'sosialisasi', socialization: 'sosialisasi', externalisation: 'eksternalisasi', externalization: 'eksternalisasi', combination: 'kombinasi', internalisation: 'internalisasi', internalization: 'internalisasi', literacy: 'literasi', motivation: 'motivasi', satisfaction: 'kepuasan', commitment: 'komitmen', trust: 'kepercayaan', distributed: 'teragih', instructional: 'instruksional', pedagogical: 'pedagogi', pedagogy: 'pedagogi', online: 'dalam talian', model: 'model', framework: 'kerangka', theory: 'teori' };
  function token(s) {
    const t = bersih(s).replace(/guru\s+besar/g, 'gurubesar').replace(/luar\s+bandar/g, 'luarbandar').replace(/dalam\s+talian/g, 'dalamtalian');
    return t.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !HENTI.has(w)).map(w => SINONIM[w] || w).map(w => (w.length > 7 ? w.slice(0, 7) : w));
  }
  const kataKunci = w => bersih(w).replace(/[^a-z]/g, '');
  /* Nama yang tidak mungkin nama keluarga pengarang (kata pembuka ayat bertitik huruf besar). */
  const BUKAN_NAMA = new Set(['menurut', 'kajian', 'dapatan', 'jadual', 'rajah', 'table', 'figure', 'lihat', 'see', 'bab', 'seksyen', 'tahun', 'pada', 'dalam', 'oleh', 'dan', 'and', 'et', 'al', 'according', 'study', 'studies', 'seterusnya', 'selain', 'namun', 'walau', 'sebaliknya', 'justeru', 'however', 'moreover', 'furthermore', 'similarly', 'likewise', 'while', 'whereas', 'begitu', 'malah', 'misalnya', 'contohnya', 'the', 'for', 'sebagai', 'seperti', 'kedua', 'sementara', 'berbeza', 'selari', 'in', 'as', 'by', 'kerana', 'bagi', 'daripada', 'kepada', 'hasil', 'laporan', 'penyelidikan', 'research', 'kerangka', 'model', 'teori', 'dapatan', 'oleh', 'itu', 'ini', 'cth', 'rujuk', 'cf', 'eg', 'ie', 'bin', 'binti', 'bt', 'van', 'von', 'der', 'de']);
  const namaToken = s => String(s || '').split(/[\s,;&]+/).map(kataKunci).filter(w => w.length >= 2 && !BUKAN_NAMA.has(w));

  /* ---------------- pustaka repositori ---------------- */
  const MEDAN = [['objektif', 'Objektif', 260], ['konstruk', 'Konstruk', 240], ['definisi', 'Definisi', 320], ['teori', 'Teori', 200], ['dapatan', 'Dapatan', 700], ['cabaran', 'Cabaran', 260], ['implikasi', 'Implikasi', 320], ['batasan', 'Batasan', 240], ['jurang', 'Jurang', 240], ['bandingan', 'Bandingan', 260], ['alasanRelevansi', 'Relevansi', 200]];
  const rekod = id => (R.Banding && R.Banding.rekod ? R.Banding.rekod(id) : Object.assign({}, R.S.docs.get(id) || {}, (R.S.pending || {})[id] || {}));
  const satuBaris = s => String(s || '').replace(/\s+/g, ' ').trim();
  function potong(s, n) { s = satuBaris(s); if (s.length <= n) return s; const p = s.slice(0, n); const i = p.lastIndexOf(' '); return (i > n * 0.6 ? p.slice(0, i) : p) + '…'; }
  /* Penulis ringkas rekod ("Zhang et al.", "Ahmad dan Ismail", "Lee") kepada bentuk sitasi. */
  function urusPenulis(s) {
    let t = satuBaris(String(s || '').replace(/\(\s*(?:19|20)\d{2}[a-z]?\s*\)/g, ' ')).replace(/[.,;:\s]+$/, '');
    if (!t) return null;
    const etal = /\bet\s*al\b\.?/i.test(t) || /\bdan\s+rakan(?:-rakan)?\b/i.test(t);
    if (etal) { const a = t.split(/\s*,?\s*\bet\s*al\b|\s+dan\s+rakan/i)[0].replace(/[,;\s]+$/, '').trim(); return a ? { nama: [a], etal: true } : null; }
    const bahagian = t.split(/\s*(?:;|&|,\s*(?:dan|and)\s+|,|\s+dan\s+|\s+and\s+)\s*/i).map(x => x.trim()).filter(Boolean);
    if (!bahagian.length) return null; if (bahagian.length >= 3) return { nama: [bahagian[0]], etal: true };
    return { nama: bahagian, etal: false };
  }
  const tahunDari = s => { const m = /((?:19|20)\d{2})([a-z])?/.exec(String(s || '')); return m ? m[1] + (m[2] || '') : ''; };
  const kurungan = e => (e.pen.etal ? e.pen.nama[0] + ' et al.' : e.pen.nama.length === 2 ? e.pen.nama[0] + ' & ' + e.pen.nama[1] : e.pen.nama[0]) + ', ' + e.tahun;
  const naratif = (e, en) => (e.pen.etal ? e.pen.nama[0] + ' et al.' : e.pen.nama.length === 2 ? e.pen.nama[0] + (en ? ' and ' : ' dan ') + e.pen.nama[1] : e.pen.nama[0]) + ' (' + e.tahun + ')';
  function pustaka() {
    const docs = R.S.docs; let maks = 0; docs.forEach(d => { const t = (d && (d.dikemaskini || d.masa)) || 0; if (t > maks) maks = t; });
    const tanda = docs.size + ':' + maks + ':' + Object.keys(R.S.pending || {}).length;
    if (Z.pustaka && Z.pustaka.tanda === tanda) return Z.pustaka;
    const senarai = []; let tiada = 0; const df = new Map(); let jumlahLen = 0;
    Array.from(docs.keys()).sort().forEach(id => {
      const r = rekod(id); const pen = urusPenulis(r.penulis); const tahun = tahunDari(r.tahun); if (!pen || !tahun) { tiada++; return; }
      const e = { id, pen, tahun, tajuk: satuBaris(r.tajuk), rujukan: String(r.rujukan || '').trim(), doi: satuBaris(r.doi), r };
      e.tokPertama = namaToken(pen.nama[0]); e.tokKedua = pen.nama[1] ? namaToken(pen.nama[1]) : [];
      if (!e.tokPertama.length) { tiada++; return; }
      e.teksPenuh = [r.tajuk, r.objektif, r.konstruk, r.definisi, r.teori, r.dapatan, r.cabaran, r.implikasi, r.batasan, r.jurang, r.bandingan, r.alasanRelevansi, r.sampel].map(satuBaris).join(' ');
      const cari = [e.tajuk, e.tajuk, r.tema, r.negara, r.peringkat, r.konstruk, r.objektif, r.dapatan, r.definisi, r.teori, r.implikasi, r.cabaran, r.jurang, r.batasan, r.bandingan, r.alasanRelevansi].join(' ');
      const tf = new Map(); token(cari).forEach(w => tf.set(w, (tf.get(w) || 0) + 1)); e.tf = tf; e.len = Array.from(tf.values()).reduce((a, b) => a + b, 0) || 1; jumlahLen += e.len;
      tf.forEach((v, w) => df.set(w, (df.get(w) || 0) + 1));
      senarai.push(e);
    });
    senarai.forEach((e, i) => {
      e.kod = 'R' + (i + 1); const r = e.r;
      const konteks = [r.negara, r.peringkat, r.lokasi, r.rekaBentuk, r.jenis].map(satuBaris).filter(Boolean).join('; ');
      const baris = [`[${e.kod}] ${naratif(e, false)}`, e.tajuk ? 'Tajuk: ' + potong(e.tajuk, 260) : '', konteks ? 'Konteks: ' + konteks + (r.sampel ? '; sampel: ' + potong(r.sampel, 160) : '') : ''];
      MEDAN.forEach(([k, lbl, n]) => { if (satuBaris(r[k])) baris.push(lbl + ': ' + potong(r[k], n)); });
      e.ringkas = baris.filter(Boolean).join(' | '); e.token = Math.ceil(e.ringkas.length / 3.6);
    });
    Z.pustaka = { tanda, senarai, peta: new Map(senarai.map(e => [e.id, e])), kod: new Map(senarai.map(e => [e.kod, e])), df, N: senarai.length, avgdl: senarai.length ? jumlahLen / senarai.length : 1, tiada, token: senarai.reduce((a, e) => a + e.token, 0) };
    return Z.pustaka;
  }
  function bm25(P, qtok, utama) {
    const q = new Map(); qtok.forEach(([w, berat]) => q.set(w, (q.get(w) || 0) + berat)); const k1 = 1.2, b = 0.75;
    return P.senarai.map(e => { let s = 0; q.forEach((qf, w) => { const f = e.tf.get(w); if (!f) return; const d = P.df.get(w) || 0; const idf = Math.log(1 + (P.N - d + 0.5) / (d + 0.5)); s += qf * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * e.len / P.avgdl)); }); if (utama.has(e.id)) s = s * 1.3 + 0.2; return { e, s }; }).sort((x, y) => y.s - x.s);
  }

  /* ---------------- sitasi dalam teks: kenal pasti dan padankan dengan rekod ---------------- */
  const tahunSama = (a, b) => { const x = /^(\d{4})([a-z]?)$/.exec(a || ''), y = /^(\d{4})([a-z]?)$/.exec(b || ''); return !!(x && y && x[1] === y[1] && (!x[2] || !y[2] || x[2] === y[2])); };
  function padan(P, pengarang, tahun, utama) {
    const tok = namaToken(pengarang); if (!tok.length) return [];
    const etal = /\bet\s*al\b/i.test(pengarang); const dua = /\s(?:dan|and|&)\s/i.test(pengarang);
    const calon = P.senarai.filter(e => tahunSama(e.tahun, tahun) && e.tokPertama.some(t => tok.includes(t)));
    if (calon.length <= 1) return calon;
    const skor = e => (e.tokKedua.length && e.tokKedua.some(t => tok.includes(t)) ? 3 : 0) + (e.pen.etal === etal ? 1 : 0) + (dua === (e.pen.nama.length === 2) ? 1 : 0) + (e.tokPertama.every(t => tok.includes(t)) ? 1 : 0) + (utama && utama.has(e.id) ? 0.5 : 0);
    const maks = Math.max(...calon.map(skor)); return calon.filter(e => skor(e) === maks);
  }
  const NAMA = "\\p{Lu}[\\p{L}'’\\-]+";
  const RE_NARATIF = new RegExp(`((?:${NAMA}\\s+){0,3}${NAMA}(?:\\s+et\\s+al\\.?|\\s+dan\\s+rakan(?:-rakan)?|\\s+(?:dan|and|&)\\s+(?:${NAMA}\\s+){0,2}${NAMA}|(?:,\\s+${NAMA})+,?\\s+(?:dan|and|&)\\s+${NAMA})?)\\s*\\(\\s*((?:19|20)\\d{2}[a-z]?)(?=[\\s,;)])`, 'gu');
  const RE_KURUNG = /\(([^()]{3,500})\)/g;
  const RE_TAHUN = /(?:^|[^\d])((?:19|20)\d{2}[a-z]?)(?!\d)/g;
  const RE_AWALAN = /^\s*(?:(?:contohnya|misalnya|cth\.?|lihat\s+juga|lihat|rujuk|e\.g\.|see\s+also|see|cf\.|i\.e\.)\s*,?\s*)+/i;
  /* Pulangkan setiap sitasi dalam satu rentetan teks: { mula, akhir, pengarang, tahun, rekod: [entri pustaka] } */
  function cariSitasi(teks, utama) {
    teks = String(teks || ''); const out = []; const julatKurung = []; let m; const P = pustaka();
    RE_KURUNG.lastIndex = 0;
    while ((m = RE_KURUNG.exec(teks))) {
      const isi = m[1]; const asas = m.index + 1; if (!/(?:19|20)\d{2}/.test(isi)) continue; julatKurung.push([m.index, m.index + m[0].length]);
      let pos = 0;
      isi.split(';').forEach(bhg => {
        const off0 = asas + pos; pos += bhg.length + 1;
        /* "A, 2018, seperti yang dipetik dalam B, 2021" dan "as cited in": dua sitasi dalam satu bahagian */
        const pecah = []; const rx = /,?\s*(?:seperti\s+yang\s+dipetik\s+dalam|seperti\s+dipetik\s+dalam|dipetik\s+dalam|as\s+cited\s+in)\s+/i; const mc = rx.exec(bhg);
        if (mc) { pecah.push([bhg.slice(0, mc.index), 0]); pecah.push([bhg.slice(mc.index + mc[0].length), mc.index + mc[0].length]); } else pecah.push([bhg, 0]);
        pecah.forEach(([t, ro]) => {
          RE_TAHUN.lastIndex = 0; const tahunList = []; let mt; while ((mt = RE_TAHUN.exec(t))) tahunList.push({ i: mt.index + mt[0].length - mt[1].length, v: mt[1] });
          if (!tahunList.length) return; const pertama = tahunList[0];
          const kepala = t.slice(0, pertama.i); const aw = RE_AWALAN.exec(kepala); const mulaNama = aw ? aw[0].length : (kepala.length - kepala.trimStart().length);
          const pengarang = kepala.slice(mulaNama).replace(/[,\s]+$/, '');
          if (!/\p{Lu}[\p{L}'’\-]+/u.test(pengarang) || patah(pengarang) > 12) return;
          /* tahun tambahan pengarang yang sama ("Zhang, 2020, 2021"), sebelum penanda muka surat */
          const halaman = /\b(?:m\.s\.|ms\.|hlm\.|p\.|pp\.|para\.)/i.exec(t); const hadT = halaman ? halaman.index : t.length;
          tahunList.filter(y => y.i < hadT).forEach((y, k) => {
            const mula = off0 + ro + (k === 0 ? mulaNama : y.i), akhir = off0 + ro + y.i + y.v.length;
            out.push({ mula, akhir, pengarang, tahun: y.v, rekod: padan(P, pengarang, y.v, utama), naratif: false });
          });
        });
      });
    }
    RE_NARATIF.lastIndex = 0;
    while ((m = RE_NARATIF.exec(teks))) {
      const buka = m.index + m[0].lastIndexOf('('); if (julatKurung.some(([a, b]) => buka > a && buka < b)) continue;
      const tutup = teks.indexOf(')', m.index + m[0].length); const akhir = tutup >= 0 && tutup - (m.index + m[0].length) < 40 ? tutup + 1 : m.index + m[0].length;
      const rekodP = padan(P, m[1], m[2], utama); let mula = m.index;
      /* buang perkataan pembuka yang bukan nama (contohnya "Kajian Zhang et al. (2023)") */
      if (rekodP.length) { const tokSah = new Set(rekodP.flatMap(e => e.tokPertama)); const re = /\S+/g; let w; while ((w = re.exec(m[1]))) { if (tokSah.has(kataKunci(w[0]))) { mula = m.index + w.index; break; } } }
      else { const re = /\S+/g; let w; while ((w = re.exec(m[1]))) { if (!BUKAN_NAMA.has(kataKunci(w[0]))) { mula = m.index + w.index; break; } } }
      if (out.some(o => mula < o.akhir && akhir > o.mula)) continue;
      out.push({ mula, akhir, pengarang: m[1], tahun: m[2], rekod: rekodP, naratif: true });
    }
    return out.sort((a, b) => a.mula - b.mula);
  }
  /* Blok teks dalam satu editor: teks setiap perenggan, butir senarai atau sel jadual berserta peta nod teks (bayang ramalan dilangkau). */
  const BLOKTAG = /^(P|LI|TD|TH|BLOCKQUOTE|H[1-6]|DIV|PRE|FIGCAPTION)$/;
  function blokOf(n, root) { let e = n.nodeType === 3 ? n.parentNode : n; while (e && e !== root && !BLOKTAG.test(e.tagName)) e = e.parentNode; return e || root; }
  function blokTeks(root, hanya) {
    const out = []; const peta = new Map(); if (!root) return out;
    const w = document.createTreeWalker(hanya || root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => (n.nodeType === 1 && n.hasAttribute('data-ramal') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 1 && n.tagName !== 'BR') continue;
      const bl = blokOf(n, root); let b = peta.get(bl); if (!b) { b = { el: bl, teks: '', seg: [] }; peta.set(bl, b); out.push(b); }
      if (n.nodeType === 3) { b.seg.push([n, b.teks.length]); b.teks += n.nodeValue; } else b.teks += '\n';
    }
    return out;
  }
  function offsetDalam(b, node, offset) {
    for (const [tn, st] of b.seg) if (tn === node) return st + Math.min(offset, tn.length);
    const r = document.createRange(); try { r.setStart(b.el, 0); r.setEnd(node, offset); } catch (e) { return -1; }
    let pos = 0; for (const [tn, st] of b.seg) { if (r.comparePoint(tn, tn.length) !== 1) pos = st + tn.length; } return pos;
  }
  function titik(b, pos, akhir) { for (let i = 0; i < b.seg.length; i++) { const [tn, st] = b.seg[i]; const tamat = st + tn.length; if (pos < tamat || (pos === tamat && (akhir || i === b.seg.length - 1))) { if (pos >= st) return [tn, pos - st]; } } return null; }
  function julatDari(b, mula, akhir) { const a = titik(b, mula, false), z = titik(b, akhir, true); if (!a || !z) return null; const r = document.createRange(); try { r.setStart(a[0], a[1]); r.setEnd(z[0], z[1]); } catch (e) { return null; } return r; }
  const utamaSet = () => new Set((H.sumberUtama && H.sumberUtama()) || []);

  /* ---------------- serlahan sitasi (CSS Custom Highlight API) ---------------- */
  const BOLEH_SERLAH = typeof CSS !== 'undefined' && CSS.highlights && typeof window.Highlight === 'function';
  function serlah() {
    if (!BOLEH_SERLAH) return; const julat = []; const ut = utamaSet();
    ['asal', 'ram'].forEach(m => { const ed = H.editor(m); if (!ed || !ed.isConnected) return; blokTeks(ed).forEach(b => { if (!/(?:19|20)\d{2}/.test(b.teks)) return; cariSitasi(b.teks, ut).forEach(s => { if (!s.rekod.length) return; const r = julatDari(b, s.mula, s.akhir); if (r) julat.push(r); }); }); });
    try { if (julat.length) CSS.highlights.set(NAMA_SERLAH, new window.Highlight(...julat)); else CSS.highlights.delete(NAMA_SERLAH); } catch (e) {}
  }
  function jadualSerlah() { clearTimeout(Z.tSerlah); Z.tSerlah = setTimeout(serlah, 350); }

  /* ---------------- popup rujukan APA 7 ---------------- */
  /* Condongkan nama jurnal dan jilid (APA 7) jika bentuk "Tajuk. Jurnal, 12(3), 45-67." dapat dikenal pasti; jika tidak, teks biasa. */
  function apaHtml(ruj) {
    const s = String(ruj || ''); const pautan = t => esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const m = /^(.*?\(\s*(?:19|20)\d{2}[a-z]?[^)]*\)\.\s+.+?[.?!]\s+)([^.,()][^,()]{1,160}?),\s*(\d+)(\s*\([^)]*\))?,\s*([A-Za-z]?\d+[\d–—-]*[A-Za-z]?\d*)(.*)$/su.exec(s);
    if (!m) return pautan(s);
    return pautan(m[1]) + '<i>' + esc(m[2]) + ', ' + esc(m[3]) + '</i>' + esc(m[4] || '') + ', ' + esc(m[5]) + pautan(m[6]);
  }
  function apaTeks(e) {
    if (e.rujukan) return { teks: e.rujukan, bina: false };
    const pen = satuBaris(e.r.penulis) || e.pen.nama.join(', '); const doi = e.doi ? (/^https?:/i.test(e.doi) ? e.doi : 'https://doi.org/' + e.doi.replace(/^doi:\s*/i, '')) : '';
    return { teks: `${pen.replace(/\.$/, '')}. (${e.tahun}). ${e.tajuk ? e.tajuk.replace(/\.$/, '') + '.' : '[tajuk belum diisi].'}${doi ? ' ' + doi : ''}`, bina: true };
  }
  async function salin(teks, html) {
    try { if (html && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([teks], { type: 'text/plain' }) })]); else await navigator.clipboard.writeText(teks); return true; }
    catch (e) { try { await navigator.clipboard.writeText(teks); return true; } catch (er) { return false; } }
  }
  function tutupPopup() { if (Z.pop) { Z.pop.remove(); Z.pop = null; document.removeEventListener('mousedown', luarPopup, true); document.removeEventListener('keydown', escPopup, true); window.removeEventListener('scroll', tutupPopup, true); window.removeEventListener('resize', tutupPopup); } }
  function luarPopup(e) { if (Z.pop && !Z.pop.contains(e.target)) tutupPopup(); }
  function escPopup(e) { if (e.key === 'Escape' && Z.pop) { e.preventDefault(); e.stopPropagation(); tutupPopup(); } }
  function letak(el, x, y, atas) {
    const w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let left = Math.max(8, Math.min(x - 16, vw - w - 8)); let top = y + 14; if (top + h > vh - 8) top = Math.max(8, (atas != null ? atas : y) - h - 10);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  }
  function bukaPopup(s, x, y) {
    tutupPopup(); const pop = document.createElement('div'); pop.className = 'rm-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Rujukan APA 7');
    const papar = esc((s.naratif ? satuBaris(s.pengarang) + ' (' + s.tahun + ')' : satuBaris(s.pengarang) + ', ' + s.tahun));
    const kad = s.rekod.map(e => { const a = apaTeks(e); return `<div class="rm-ruj"><p class="rm-apa">${apaHtml(a.teks)}</p>${a.bina ? '<p class="rm-nota">Medan Rujukan APA 7 rekod ini masih kosong; rujukan di atas dibina daripada medan Penulis, Tahun, Tajuk dan DOI dan perlu dilengkapkan (nama jurnal, jilid, isu, halaman).</p>' : ''}<div class="rm-acts"><button class="btn btn-sm btn-primary" data-rm="salin" data-id="${esc(e.id)}">Salin APA 7</button><button class="btn btn-sm" data-rm="buka" data-id="${esc(e.id)}">Buka rekod</button>${e.doi ? `<a class="btn btn-sm" href="${esc(/^https?:/i.test(e.doi) ? e.doi : 'https://doi.org/' + e.doi.replace(/^doi:\s*/i, ''))}" target="_blank" rel="noopener">DOI</a>` : ''}</div></div>`; }).join('');
    pop.innerHTML = `<div class="rm-pop-h"><b>Rujukan APA 7</b><span>${papar}</span><button class="rm-x" data-rm="tutup" aria-label="Tutup">&times;</button></div>${s.rekod.length > 1 ? '<p class="rm-nota">Lebih daripada satu rekod sepadan dengan nama dan tahun ini. Pilih rujukan yang betul; jika perlu, tambah huruf a dan b pada tahun (APA 7).</p>' : ''}${kad || `<p class="rm-nota">Sitasi "${papar}" tidak sepadan dengan mana-mana rekod dalam repositori. Semak ejaan nama pengarang dan tahun, atau tambah artikel itu ke repositori dahulu supaya rujukannya boleh dijana.</p>`}<div class="rm-pop-f"><button class="btn btn-sm" data-rm="senarai">Senarai rujukan seksyen ini</button></div>`;
    document.body.appendChild(pop); Z.pop = pop; letak(pop, x, y);
    pop.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    pop.addEventListener('click', async e => {
      const b = e.target.closest('[data-rm]'); if (!b) return; const a = b.dataset.rm; const P = pustaka(); const ent = b.dataset.id ? P.peta.get(b.dataset.id) : null;
      if (a === 'tutup') tutupPopup();
      else if (a === 'salin' && ent) { const t = apaTeks(ent); const ok = await salin(t.teks, `<p style="margin-left:0.5in;text-indent:-0.5in">${apaHtml(t.teks)}</p>`); toast(ok ? 'Rujukan APA 7 disalin' : 'Papan keratan tidak tersedia', !ok); }
      else if (a === 'buka' && ent) { tutupPopup(); try { H.flush && H.flush(); } catch (er) {} R.openRecord(ent.id); }
      else if (a === 'senarai') { tutupPopup(); senaraiRujukan(); }
    });
    document.addEventListener('mousedown', luarPopup, true); document.addEventListener('keydown', escPopup, true); window.addEventListener('scroll', tutupPopup, true); window.addEventListener('resize', tutupPopup);
  }
  function klik(e, mana) {
    if (e.target && e.target.closest && e.target.closest('[data-ramal]')) return;
    if (!tet().popup) return; const sl = window.getSelection(); if (!sl || !sl.rangeCount || !sl.isCollapsed) return;
    const rg = sl.getRangeAt(0); const ed = H.editor(mana); if (!ed || !ed.contains(rg.startContainer)) return;
    const bl = blokOf(rg.startContainer, ed); const b = blokTeks(ed, bl === ed ? null : bl).find(x => x.el === bl); if (!b || !/(?:19|20)\d{2}/.test(b.teks)) return;
    const off = offsetDalam(b, rg.startContainer, rg.startOffset); if (off < 0) return;
    const s = cariSitasi(b.teks, utamaSet()).find(x => off > x.mula && off < x.akhir);
    if (s) bukaPopup(s, e.clientX, e.clientY);
  }
  /* Senarai rujukan seksyen semasa: semua sitasi dalam ASAL dan RAM yang sepadan dengan rekod, disusun mengikut abjad (APA 7). */
  async function senaraiRujukan() {
    const ut = utamaSet(); const ids = new Map(); const luar = new Map(); const kabur = new Map();
    ['asal', 'ram'].forEach(m => blokTeks(H.editor(m)).forEach(b => cariSitasi(b.teks, ut).forEach(s => { if (s.rekod.length === 1) ids.set(s.rekod[0].id, s.rekod[0]); else if (s.rekod.length > 1) kabur.set(satuBaris(s.pengarang) + ', ' + s.tahun, s.rekod); else luar.set(satuBaris(s.pengarang) + ', ' + s.tahun, 1); })));
    const susun = Array.from(ids.values()).sort((a, b) => bersih(apaTeks(a).teks).localeCompare(bersih(apaTeks(b).teks)) || a.tahun.localeCompare(b.tahun));
    const tk = susun.map(e => apaTeks(e).teks); const html = susun.map(e => `<p class="rm-senarai-i">${apaHtml(apaTeks(e).teks)}</p>`).join('');
    const ok = await R.richModal('Rujukan seksyen ini (APA 7)', `${susun.length ? `<div class="rm-senarai">${html}</div>` : '<p>Tiada sitasi dalam ASAL atau RAM seksyen ini yang sepadan dengan rekod repositori.</p>'}${kabur.size ? `<p class="help"><b>Sitasi yang sepadan dengan lebih daripada satu rekod</b> (klik sitasi untuk memilih): ${esc(Array.from(kabur.keys()).join('; '))}.</p>` : ''}${luar.size ? `<p class="help"><b>Sitasi tanpa rekod repositori</b> (rujukannya perlu ditulis sendiri): ${esc(Array.from(luar.keys()).join('; '))}.</p>` : ''}<p class="help">Disusun mengikut abjad nama pengarang pertama (APA 7). Rujukan diambil daripada medan Rujukan APA 7 setiap rekod; nama jurnal dan jilid dicondongkan apabila bentuknya dapat dikenal pasti.</p>`, susun.length ? 'Salin semua' : 'Tutup', susun.length ? 'Tutup' : null);
    if (ok && susun.length) { const jadi = await salin(tk.join('\n\n'), susun.map(e => `<p style="margin-left:0.5in;text-indent:-0.5in">${apaHtml(apaTeks(e).teks)}</p>`).join('')); toast(jadi ? susun.length + ' rujukan disalin (APA 7)' : 'Papan keratan tidak tersedia', !jadi); }
  }

  /* ---------------- ramalan ayat ---------------- */
  const RE_TAMAT = /[.?!]["'”’)\]]?[\s ]*$/;
  const SINGKATAN = /(?:\bet\s+al|\bdll|\bdsb|\bdsbnya|\bcth|\bmis|\bhlm|\bm\.s|\bms|\bDr|\bProf|\bEn|\bPn|\bSdn|\bBhd|\bNo|\bvol|\beds?|\bpp?|\be\.g|\bi\.e|\bcf|\bvs|\betc|\bJan|\bFeb|\bApr|\bOgos|\bSept|\bOkt|\bNov|\bDis|(?:^|\s)\p{Lu}|(?:^|\s)\d{1,2})\.[\s ]*$/u;
  function ayatTerakhir(t) {
    const s = String(t || '').replace(/[\s ]+$/, ''); const potongan = s.slice(0, -1);
    const re = /[.?!]["'”’)\]]?\s+(?=["'“‘(]?\p{Lu})/gu; let akhir = 0, m; while ((m = re.exec(potongan))) { if (!SINGKATAN.test(potongan.slice(0, m.index + 1))) akhir = m.index + m[0].length; }
    return s.slice(akhir).trim();
  }
  const kurungTerbuka = s => (String(s).match(/\(/g) || []).length > (String(s).match(/\)/g) || []).length;
  function bahasaInggeris(t) {
    const w = bersih(t).split(/[^a-z]+/); let bm = 0, en = 0;
    const BM = new Set(['yang', 'dan', 'dalam', 'ini', 'untuk', 'dengan', 'kepada', 'adalah', 'ialah', 'oleh', 'bagi', 'tidak', 'daripada', 'pada', 'telah', 'akan', 'boleh', 'kajian', 'guru', 'terhadap', 'merupakan']);
    const EN = new Set(['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'as', 'are', 'this', 'by', 'on', 'be', 'which', 'teachers', 'study', 'their', 'was', 'were']);
    w.forEach(x => { if (BM.has(x)) bm++; else if (EN.has(x)) en++; }); return en > bm * 1.2 && en >= 3;
  }
  /* Teks konteks sebelum kursor: perenggan semasa hingga kursor dan perenggan sebelumnya (sehingga kira-kira 1,600 aksara). */
  function konteksSebelum(ed, rg) {
    const r = document.createRange(); r.setStart(ed, 0); r.setEnd(rg.startContainer, rg.startOffset);
    const frag = r.cloneContents(); const tmp = document.createElement('div'); tmp.appendChild(frag); tmp.querySelectorAll('[data-ramal]').forEach(x => x.remove());
    tmp.querySelectorAll('p,li,td,th,div,br,tr').forEach(x => x.after(document.createTextNode('\n')));
    const t = tmp.textContent.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    if (t.length <= 1600) return t; const p = t.slice(-1600); const i = p.search(/[.?!]\s/); return i >= 0 && i < 400 ? p.slice(i + 2) : p;
  }
  function blokKursor(ed, node) { let e = node.nodeType === 3 ? node.parentNode : node; while (e && e !== ed && !/^(P|LI|TD|TH|BLOCKQUOTE|DIV)$/.test(e.tagName)) e = e.parentNode; return e && ed.contains(e) ? e : ed; }
  function teksSelepas(bl, rg) { const r = document.createRange(); r.setStart(rg.endContainer, rg.endOffset); r.setEnd(bl, bl.childNodes.length); const tmp = document.createElement('div'); tmp.appendChild(r.cloneContents()); tmp.querySelectorAll('[data-ramal]').forEach(x => x.remove()); return tmp.textContent; }
  function teksSebelumBlok(bl, rg) { const r = document.createRange(); r.setStart(bl, 0); r.setEnd(rg.startContainer, rg.startOffset); const tmp = document.createElement('div'); tmp.appendChild(r.cloneContents()); tmp.querySelectorAll('[data-ramal]').forEach(x => x.remove()); return tmp.textContent; }

  function batal() {
    clearTimeout(Z.timer); Z.timer = null; Z.seq++;
    if (Z.ctl) { try { Z.ctl.abort(); } catch (e) {} Z.ctl = null; }
    buangHantu(); tutupKad();
  }
  function buangHantu() {
    if (Z.hantu && Z.hantu.isConnected) Z.hantu.remove(); Z.hantu = null; Z.calon = []; Z.i = 0;
    const ed = H.editor('ram'); if (ed) ed.querySelectorAll('[data-ramal]').forEach(x => x.remove());
  }
  function tutupKad() { if (Z.kad) { Z.kad.remove(); Z.kad = null; window.removeEventListener('scroll', letakKad, true); window.removeEventListener('resize', letakKad); } }
  function pasangHantu(cls) {
    const ed = H.editor('ram'); const sl = window.getSelection(); if (!ed || !sl || !sl.rangeCount) return false;
    const rg = sl.getRangeAt(0).cloneRange(); if (!ed.contains(rg.startContainer)) return false;
    if (Z.hantu && Z.hantu.isConnected) Z.hantu.remove();
    const sp = document.createElement('span'); sp.className = 'tul-ramal' + (cls ? ' ' + cls : ''); sp.setAttribute('contenteditable', 'false'); sp.setAttribute('data-ramal', '1'); sp.setAttribute('aria-live', 'polite');
    rg.collapse(true); rg.insertNode(sp);
    const r2 = document.createRange(); r2.setStartBefore(sp); r2.collapse(true); sl.removeAllRanges(); sl.addRange(r2);
    Z.hantu = sp; Z.julat = r2.cloneRange(); return true;
  }
  function paparHantu() {
    const c = Z.calon[Z.i]; if (!Z.hantu || !c) return;
    const i = c.ayat.lastIndexOf(c.sit); const sebelum = i >= 0 ? c.ayat.slice(0, i) : c.ayat; const selepas = i >= 0 ? c.ayat.slice(i + c.sit.length) : '';
    Z.hantu.className = 'tul-ramal'; Z.hantu.title = 'Ramalan ayat: Tab terima, Esc tolak' + (Z.calon.length > 1 ? ', Alt+] cadangan lain' : '');
    Z.hantu.innerHTML = `${esc(Z.awalan + sebelum)}${i >= 0 ? `<span class="tr-sit" data-ids="${esc(c.ids.join(','))}" title="Klik untuk melihat rujukan APA 7">${esc(c.sit)}</span>` : ''}${esc(selepas)}`;
    paparKad();
  }
  function paparKad(mesej) {
    tutupKad(); if (!Z.hantu && !mesej) return; const c = Z.calon[Z.i]; const P = pustaka();
    const k = document.createElement('div'); k.className = 'rm-kad'; k.setAttribute('role', 'status');
    if (mesej) k.innerHTML = `<div class="rm-kad-b">${mesej}</div><div class="rm-kad-a"><button class="btn btn-sm" data-rk="tutup">Tutup</button><button class="btn btn-sm" data-rk="tetapan" title="Tetapan ramalan">Tetapan</button></div>`;
    else {
      const nama = c.ids.map(id => P.peta.get(id)).filter(Boolean).map(e => naratif(e, c.en)).join('; ');
      k.innerHTML = `<div class="rm-kad-h"><b>Ramalan ayat</b>${Z.calon.length > 1 ? `<span>${Z.i + 1}/${Z.calon.length}</span>` : ''}${c.fungsi ? `<span class="rm-fn">${esc(c.fungsi)}</span>` : ''}</div>
        <div class="rm-kad-b">Disokong oleh <b>${esc(nama)}</b>${c.bukti ? `, medan ${esc(c.medan || 'rekod')}: <q>${esc(potong(c.bukti, 220))}</q>` : ''}</div>
        ${c.lemah ? '<div class="rm-amaran">Petikan bukti tidak sepadan sepenuhnya dengan teks rekod. Semak rekod sebelum menggunakan ayat ini.</div>' : ''}
        <div class="rm-kad-a"><button class="btn btn-sm btn-primary" data-rk="terima">Terima <kbd>Tab</kbd></button>${Z.calon.length > 1 ? '<button class="btn btn-sm" data-rk="lain">Lain <kbd>Alt+]</kbd></button>' : ''}<button class="btn btn-sm" data-rk="tolak">Tolak <kbd>Esc</kbd></button><button class="btn btn-sm" data-rk="rujukan">Rujukan</button><button class="btn btn-sm" data-rk="tetapan" title="Tetapan ramalan">Tetapan</button></div>`;
    }
    document.body.appendChild(k); Z.kad = k; letakKad();
    k.addEventListener('mousedown', e => { e.preventDefault(); });
    k.addEventListener('click', e => {
      const b = e.target.closest('[data-rk]'); if (!b) return; const a = b.dataset.rk;
      if (a === 'terima') terima(); else if (a === 'lain') kitar(1); else if (a === 'tolak' || a === 'tutup') batal(); else if (a === 'tetapan') { batal(); bukaTetapan(); }
      else if (a === 'rujukan') { const c2 = Z.calon[Z.i]; if (c2) { const r = b.getBoundingClientRect(); bukaPopupIds(c2.ids, r.left, r.bottom); } }
    });
    window.addEventListener('scroll', letakKad, true); window.addEventListener('resize', letakKad);
    if (mesej) setTimeout(() => { if (Z.kad === k && !Z.hantu) tutupKad(); }, 4500);
  }
  function letakKad() {
    if (!Z.kad) return; let rect = null;
    if (Z.hantu && Z.hantu.isConnected) { const rs = Z.hantu.getClientRects(); rect = rs.length ? rs[rs.length - 1] : Z.hantu.getBoundingClientRect(); }
    else { const sl = window.getSelection(); if (sl && sl.rangeCount) rect = sl.getRangeAt(0).getBoundingClientRect(); }
    if (!rect || (!rect.width && !rect.height && !rect.top)) { const ed = H.editor('ram'); if (ed) rect = ed.getBoundingClientRect(); }
    if (!rect) return; const atas = Z.hantu && Z.hantu.isConnected ? (Z.hantu.getClientRects()[0] || rect).top : rect.top; letak(Z.kad, rect.left + 16, rect.bottom - 6, atas);
  }
  function bukaPopupIds(ids, x, y) { const P = pustaka(); const rek = ids.map(id => P.peta.get(id)).filter(Boolean); if (!rek.length) return; const e0 = rek[0]; bukaPopup({ pengarang: rek.map(e => kurungan(e).replace(/, [^,]+$/, '')).join('; '), tahun: e0.tahun, rekod: rek, naratif: false }, x, y); }
  function kitar(arah) { if (Z.calon.length < 2) return; Z.i = (Z.i + arah + Z.calon.length) % Z.calon.length; paparHantu(); }
  function terima() {
    const c = Z.calon[Z.i]; const ed = H.editor('ram'); if (!c || !ed || !Z.hantu) return;
    const julat = Z.julat; const teks = Z.awalan + c.ayat; Z.hantu.remove(); Z.hantu = null; tutupKad();
    ed.focus(); const sl = window.getSelection(); if (julat && ed.contains(julat.startContainer)) { sl.removeAllRanges(); sl.addRange(julat); }
    Z.sisip = true; let jadi = false; try { jadi = document.execCommand('insertText', false, teks); } finally { Z.sisip = false; }
    if (!jadi) { const r = sl.getRangeAt(0); r.insertNode(document.createTextNode(teks)); r.collapse(false); H.tandaKotor && H.tandaKotor('ram'); }
    Z.calon = []; Z.i = 0; catatTerima(); jadualSerlah();
  }
  function bersihAyat(s) {
    let t = satuBaris(s).replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
    t = t.replace(/\s*\([^()]*(?:19|20)\d{2}[^()]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '');
    t = t.replace(/\s*[—–]\s*/g, ', ').replace(/\s+([,.;:?!])/g, '$1').replace(/\s{2,}/g, ' ').trim();
    if (!t) return ''; if (!/[.?!]$/.test(t)) t += '.'; return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const tokenBukti = s => bersih(s).split(/[^a-z0-9]+/).filter(w => w.length >= 2);
  function nisbahBukti(bukti, e) { const tb = tokenBukti(bukti); if (tb.length < 3) return 0; const set = new Set(tokenBukti(e.teksPenuh)); return tb.filter(w => set.has(w)).length / tb.length; }
  function serupa(a, b) { const x = new Set(token(a)), y = token(b); if (!x.size || !y.length) return 0; return y.filter(w => x.has(w)).length / Math.max(x.size, y.length); }
  function sahkan(c, dibenar, ctx) {
    if (!c || typeof c.ayat !== 'string') return null;
    const kod = Array.from(new Set((Array.isArray(c.sumber) ? c.sumber : []).map(k => String(k).toUpperCase().replace(/[^R\d]/g, '')))).filter(k => dibenar.has(k)).slice(0, 2);
    const rek = kod.map(k => dibenar.get(k)); if (!rek.length) return null;
    if (/\bet\s+al\b/i.test(c.ayat)) return null;
    const ayat = bersihAyat(c.ayat); if (patah(ayat) < 6 || patah(ayat) > 60) return null;
    if (ctx.ayat.some(a => serupa(a, ayat) > 0.8)) return null;
    const nisbah = Math.max(...rek.map(e => nisbahBukti(c.bukti, e)));
    if (nisbah < 0.34) return null;
    /* susunan beberapa sumber dalam satu kurungan: tesis mengikut garis panduan UPSI (tahun terkini dahulu), artikel mengikut APA 7 (abjad) */
    const susun = rek.slice().sort((a, b) => H.tesis ? (b.tahun.localeCompare(a.tahun) || bersih(a.pen.nama[0]).localeCompare(bersih(b.pen.nama[0]))) : (bersih(a.pen.nama[0]).localeCompare(bersih(b.pen.nama[0])) || a.tahun.localeCompare(b.tahun)));
    const sit = '(' + susun.map(kurungan).join('; ') + ')';
    return { ayat: ayat.replace(/([.?!])$/, ' ' + sit + '$1'), sit, ids: susun.map(e => e.id), bukti: satuBaris(c.bukti), medan: satuBaris(c.medan).slice(0, 40), fungsi: satuBaris(c.fungsi).toLowerCase().slice(0, 30), lemah: nisbah < 0.75, en: ctx.en };
  }
  const ARAHAN = `Anda pembantu penulisan akademik bagi Prof Dr, calon PhD yang menulis tesis dan artikel jurnal berindeks Scopus dan WoS. Tugas anda: meramal AYAT SETERUSNYA yang menyambung idea Prof Dr secara logik supaya aliran penulisannya tidak terputus. Setiap ayat yang dicadangkan MESTI bersandarkan rekod dalam PUSTAKA REPOSITORI. Jangan gunakan pengetahuan luar, dan jangan mereka dapatan, angka, nama atau tahun.

PERATURAN:
1. Satu cadangan ialah SATU ayat lengkap (lazimnya 18 hingga 35 patah perkataan) yang menyambung ayat terakhir Prof Dr dengan fungsi yang paling wajar: menghuraikan, memberi bukti empirikal, membandingkan, menunjukkan percanggahan, merumus implikasi atau menonjolkan jurang.
2. Isi ayat mesti disokong secara langsung oleh medan rekod dalam "sumber". Jangan melampaui apa yang dinyatakan rekod: hubungan atau korelasi tidak boleh ditulis sebagai sebab-akibat, dan konteks kajian (negara, peringkat, sampel) dikekalkan apabila dakwaan bergantung padanya.
3. "sumber": satu atau dua kod rekod (contohnya ["R4"]) daripada PUSTAKA sahaja. Gunakan dua kod hanya jika kedua-dua rekod menyokong dakwaan yang sama.
4. JANGAN tulis sitasi, nama pengarang, tahun, "et al." atau kurungan dalam "ayat". Sistem membina sitasi APA 7 sendiri daripada rekod dan meletakkannya sebelum noktah.
5. "bukti": salin TEPAT satu frasa (8 hingga 25 patah perkataan) daripada medan rekod sumber yang menyokong ayat, tanpa mengubah satu perkataan pun. "medan": nama medan petikan itu (contohnya Dapatan, Implikasi, Definisi, Cabaran).
6. "fungsi": satu daripada huraian, bukti, perbandingan, percanggahan, implikasi, jurang.
7. Parafrasa: jangan salin lebih daripada lima perkataan berturut-turut daripada rekod ke dalam "ayat"; tulis dengan struktur ayat sendiri.
8. Jangan mengulang idea atau ayat yang sudah ada dalam TEKS SEBELUM. Mulakan ayat dengan penanda wacana yang sesuai dengan fungsinya, tetapi jangan gunakan penanda yang sama bagi setiap cadangan.
9. Bahasa ikut BAHASA TEKS. Bahasa Melayu: laras akademik baku Malaysia mengikut PIAWAIAN BAHASA di bawah, tanpa em-dash. Bahasa Inggeris: formal academic British English.
10. Cadangan yang berlainan mesti berbeza fungsi atau sumbernya, bukan parafrasa antara satu sama lain. Susun cadangan yang paling kukuh dahulu.
11. Jika tiada rekod yang benar-benar menyokong ayat seterusnya yang bermakna, pulangkan "cadangan": [] (senarai kosong). Tiada cadangan lebih baik daripada cadangan yang lemah.

${PIAWAI_RINGKAS}`;
  const SKEMA = { type: 'object', additionalProperties: false, required: ['cadangan'], properties: { cadangan: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['ayat', 'sumber', 'bukti', 'medan', 'fungsi'], properties: { ayat: { type: 'string' }, sumber: { type: 'array', items: { type: 'string' } }, bukti: { type: 'string' }, medan: { type: 'string' }, fungsi: { type: 'string' } } } } } };
  function hashTeks(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  /* kursor masih di tempat yang sama dan RAM masih difokus selepas menunggu (tetapan dimuatkan secara tak segerak) */
  function kursorSama(rg) { const sl = window.getSelection(); const ed = H.editor('ram'); if (!sl || !sl.rangeCount || !sl.isCollapsed || !ed || document.activeElement !== ed) return false; const k = sl.getRangeAt(0); try { return k.compareBoundaryPoints(Range.START_TO_START, rg) === 0; } catch (e) { return false; } }
  async function cuba(paksa) {
    const t = tet(); if (!paksa && !t.on) return;
    const ed = H.editor('ram'); const sl = window.getSelection(); if (!ed || !ed.isConnected || !sl || !sl.rangeCount) return;
    const rg = sl.getRangeAt(0).cloneRange(); if (!ed.contains(rg.startContainer)) { if (paksa) toast('Letakkan kursor dalam RAM dahulu', true); return; }
    if (!sl.isCollapsed) { if (paksa) toast('Nyahpilih teks dahulu, kemudian letakkan kursor di hujung ayat', true); return; }
    if (rg.startContainer.nodeType === 1 && rg.startContainer.closest && rg.startContainer.closest('table') || (rg.startContainer.parentNode && rg.startContainer.parentNode.closest && rg.startContainer.parentNode.closest('td,th'))) { if (paksa) toast('Ramalan ayat tidak dibuat di dalam jadual', true); return; }
    const bl = blokKursor(ed, rg.startContainer); const sebelumBlok = teksSebelumBlok(bl, rg);
    if (teksSelepas(bl, rg).replace(/[\s ]+/g, '')) { if (paksa) toast('Letakkan kursor di hujung perenggan untuk meramal ayat seterusnya', true); return; }
    if (!paksa && (!RE_TAMAT.test(sebelumBlok) || SINGKATAN.test(sebelumBlok))) return;
    const akhir = ayatTerakhir(sebelumBlok); if (kurungTerbuka(akhir)) return;
    if (!paksa && patah(akhir) < 5) return;
    const konteks = konteksSebelum(ed, rg); if (patah(konteks) < 4) { if (paksa) toast('Tulis sekurang-kurangnya satu ayat dahulu dalam RAM', true); return; }
    const g = guna(); if (g.n >= t.had) { if (Z.hadDimaklum !== g.tarikh || paksa) { Z.hadDimaklum = g.tarikh; toast(`Had ${t.had} ramalan sehari telah dicapai. Ubah had dalam Tetapan ramalan.`, true, { label: 'Tetapan', fn: () => bukaTetapan() }); } return; }
    const P = pustaka(); if (!P.N) { if (paksa) toast('Repositori belum ada rekod yang lengkap dengan Penulis dan Tahun untuk disitasi', true); return; }
    const seq = ++Z.seq; clearTimeout(Z.timer); Z.timer = null;
    let tk; try { tk = await kunci(t.model); } catch (e) { return; }
    if (seq !== Z.seq || !kursorSama(rg)) return;
    if (!tk.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); if (t.on) simpanTet({ on: false }); return; }
    const en = bahasaInggeris(konteks); const awalan = /[\s ]$/.test(sebelumBlok) || !sebelumBlok ? '' : ' ';
    const ut = utamaSet(); const ayatKonteks = konteks.split(/(?<=[.?!])\s+/).filter(Boolean);
    const kunciCache = tk.model + '|' + t.bil + '|' + hashTeks(konteks.slice(-900)) + '|' + P.tanda;
    if (!kursorSama(rg) || !pasangHantu('memuat')) return; Z.hantu.innerHTML = '<span class="tr-titik" aria-label="Sedang meramal">&#8943;</span>'; Z.hantu.title = 'Sedang meramal ayat seterusnya daripada repositori (Esc untuk batal)'; Z.awalan = awalan;
    let calon = Z.cache.get(kunciCache);
    if (!calon) {
      /* rekod yang dihantar: pustaka penuh (stabil, dicache) jika muat; jika tidak, rekod paling hampir mengikut carian kata */
      const q = token(akhir).map(w => [w, 2]).concat(token(konteks.slice(-700)).map(w => [w, 1]));
      const kx = H.konteks ? H.konteks() : {}; token((kx.seksyen || '') + ' ' + (kx.unit || '')).forEach(w => q.push([w, 1]));
      const rank = bm25(P, q, ut); const penuh = P.token <= HAD_PENUH;
      const dihantar = penuh ? P.senarai : rank.slice(0, BIL_HAMPIR).map(x => x.e).sort((a, b) => a.kod.localeCompare(b.kod, undefined, { numeric: true }));
      const dibenar = new Map(dihantar.map(e => [e.kod, e]));
      const hampir = rank.filter(x => x.s > 0).slice(0, 8).map(x => x.e.kod);
      const sudah = new Set(); cariSitasi(konteks.slice(-1200), ut).forEach(s => s.rekod.forEach(e => sudah.add(e.kod)));
      const utamaKod = P.senarai.filter(e => ut.has(e.id) && dibenar.has(e.kod)).map(e => e.kod);
      const system = `PUSTAKA REPOSITORI (${dihantar.length} rekod${penuh ? '' : ' paling hampir daripada ' + P.N}; satu-satunya sumber yang dibenarkan; setiap baris bermula dengan kod rekod):\n${dihantar.map(e => e.ringkas).join('\n')}`;
      const systemAwal = `${ARAHAN}\n\nPROFIL KAJIAN PROF DR (konteks sahaja, bukan sumber sitasi):\n${tk.profil || ''}`;
      const tugas = `BAHASA TEKS: ${en ? 'Bahasa Inggeris (formal academic British English)' : 'Bahasa Melayu Malaysia'}\nSASARAN: ${[kx.sasaran, kx.unit, kx.seksyen ? 'seksyen "' + kx.seksyen + '"' : ''].filter(Boolean).join(' · ') || 'RAM'}\nBILANGAN CADANGAN: sehingga ${t.bil}\n\nTEKS SEBELUM (ayat terakhir di hujung):\n"""\n${konteks}\n"""\n\nAYAT TERAKHIR PROF DR: "${akhir}"\n${sudah.size ? `SUMBER YANG SUDAH DISITASI DALAM TEKS SEBELUM: ${Array.from(sudah).join(', ')} (utamakan rekod lain jika sama kuat)\n` : ''}${hampir.length ? `REKOD PALING HAMPIR MENGIKUT CARIAN KATA (petunjuk, bukan had): ${hampir.join(', ')}\n` : ''}${utamaKod.length ? `SUMBER UTAMA ${H.tesis ? 'TULISAN' : 'ARTIKEL'} INI (utamakan jika menyokong): ${utamaKod.join(', ')}\n` : ''}\nRamalkan ayat seterusnya mengikut PERATURAN dan pulangkan JSON.`;
      const ctl = new AbortController(); Z.ctl = ctl; let res;
      try { res = await R.Isi.hantar(tk, { kunciMod: 'ramal:' + tk.model, systemAwal, system, content: [{ type: 'text', text: tugas }], skema: SKEMA, alat: { name: 'ramal_ayat', description: 'Pulangkan cadangan ayat seterusnya mengikut struktur ini.', input_schema: SKEMA }, hadToken: 1200, effort: 'low', signal: ctl.signal }); }
      catch (e) {
        if (Z.ctl === ctl) Z.ctl = null; if (e && e.usage) catatGuna(e.usage, tk.model);
        if (e && e.code === 'batal') return; if (seq !== Z.seq) return; buangHantu();
        Z.gagal++; const henti = Z.gagal >= 3 && tet().on; if (henti) simpanTet({ on: false });
        toast('Ramalan ayat gagal: ' + R.Isi.msg(e) + (henti ? ' Ramalan automatik dimatikan selepas tiga kegagalan berturut-turut; hidupkan semula dalam Tetapan ramalan.' : ''), true); return;
      }
      if (Z.ctl === ctl) Z.ctl = null; catatGuna(res.usage, tk.model); Z.gagal = 0;
      let j = res.input; if (!j) { try { j = R.Isi.parseJson(res.text, res.stop); } catch (e) { j = { cadangan: [] }; } }
      const ctx = { ayat: ayatKonteks, en };
      calon = (Array.isArray(j && j.cadangan) ? j.cadangan : []).map(c => sahkan(c, dibenar, ctx)).filter(Boolean);
      const unik = []; calon.forEach(c => { if (!unik.some(u => serupa(u.ayat, c.ayat) > 0.85)) unik.push(c); }); calon = unik.slice(0, t.bil);
      Z.cache.set(kunciCache, calon); if (Z.cache.size > 60) Z.cache.delete(Z.cache.keys().next().value);
    }
    if (seq !== Z.seq) return;
    if (!calon.length) { buangHantu(); paparKad('Tiada rekod repositori yang cukup kukuh menyokong ayat seterusnya bagi konteks ini. Teruskan menulis, atau tambah artikel yang berkaitan ke repositori.'); return; }
    if (!Z.hantu || !Z.hantu.isConnected) return;
    Z.calon = calon; Z.i = 0; paparHantu();
  }

  /* ---------------- pengendali peristiwa daripada editor ---------------- */
  function input(e, mana) {
    jadualSerlah(); if (Z.sisip) return;
    Z.seq++; clearTimeout(Z.timer); Z.timer = null; if (Z.hantu || Z.kad || Z.ctl) batal();
    if (mana !== 'ram' || !tet().on) return;
    /* hanya teks yang ditaip (bukan tampal, seret atau sisipan HTML) mencetuskan ramalan automatik */
    if (e && e.inputType && !/^insert(?:Text|CompositionText|ReplacementText)$/.test(e.inputType)) return;
    const ed = H.editor('ram'); const sl = window.getSelection(); if (!ed || !sl || !sl.rangeCount || !sl.isCollapsed) return;
    const rg = sl.getRangeAt(0); if (!ed.contains(rg.startContainer)) return; const bl = blokKursor(ed, rg.startContainer);
    const sb = teksSebelumBlok(bl, rg); if (!RE_TAMAT.test(sb) || SINGKATAN.test(sb)) return;
    Z.timer = setTimeout(() => { Z.timer = null; cuba(false); }, tet().jeda);
  }
  function kekunci(e, mana) {
    if (mana === 'ram' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === '.' || e.code === 'Period')) { e.preventDefault(); batal(); cuba(true); return true; }
    const pengubah = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'AltGraph'].includes(e.key);
    if (!pengubah && Z.pop && e.key !== 'Escape') tutupPopup();
    if (!Z.hantu && !Z.kad) { if (!pengubah) { clearTimeout(Z.timer); Z.timer = null; Z.seq++; if (Z.ctl) batal(); } return false; }
    if (e.key === 'Tab' && !e.shiftKey && Z.calon.length && Z.hantu) { e.preventDefault(); terima(); return true; }
    /* Tab semasa ramalan masih dimuatkan: kekal dalam RAM (jangan pindah fokus) sehingga cadangan tiba */
    if (e.key === 'Tab' && !e.shiftKey && Z.hantu && !Z.calon.length) { e.preventDefault(); return true; }
    if (e.key === 'Escape') { e.preventDefault(); batal(); return true; }
    if (e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft') && Z.calon.length > 1) { e.preventDefault(); kitar(e.code === 'BracketRight' ? 1 : -1); return true; }
    if (pengubah) return false;
    batal(); return false;
  }
  function tekan(e) {
    const g = e.target && e.target.closest ? e.target.closest('[data-ramal]') : null;
    if (g) { e.preventDefault(); const s = e.target.closest('.tr-sit'); if (s) bukaPopupIds(String(s.dataset.ids || '').split(',').filter(Boolean), e.clientX, e.clientY); return; }
    Z.seq++; if (Z.hantu || Z.kad || Z.ctl || Z.timer) batal();
  }
  function kabur() { setTimeout(() => { const ed = H.editor('ram'); if (Z.hantu && ed && document.activeElement !== ed) batal(); }, 0); }
  function pilihan() {
    if (!Z.hantu || !Z.hantu.isConnected) return; const sl = window.getSelection(); if (!sl || !sl.rangeCount) return;
    const rg = sl.getRangeAt(0); const ed = H.editor('ram'); if (!ed || !ed.contains(rg.startContainer)) return;
    try { if (!rg.collapsed || rg.comparePoint(Z.hantu, 0) !== 1) { batal(); return; } const r = document.createRange(); r.setStart(rg.startContainer, rg.startOffset); r.setEndBefore(Z.hantu); const tmp = document.createElement('div'); tmp.appendChild(r.cloneContents()); if (tmp.textContent.replace(/[\s ]+/g, '')) batal(); } catch (e) {}
  }

  /* ---------------- tetapan (modal) dan butang bar RAM ---------------- */
  async function bukaTetapan() {
    const t = tet(); const g = guna(); const P = pustaka(); const m = t.model === 'tetapan' ? ((Z.tk && Z.tk.model) || 'claude-opus-5-5') : t.model; const h = HARGA[m];
    const tokTetap = Math.round((ARAHAN.length + 2400) / 3.6) + Math.min(P.token, HAD_PENUH);
    const anggar = h ? `Anggaran setiap ramalan dengan ${esc(m.replace('claude-', ''))}: kira-kira ${usd((tokTetap * h[2] + 900 * h[0] + 500 * h[1]) / 1e6)} apabila pustaka dibaca daripada cache (ramalan dalam masa lima minit selepas ramalan sebelumnya) dan ${usd((tokTetap * h[3] + 900 * h[0] + 500 * h[1]) / 1e6)} bagi ramalan pertama selepas jeda.` : '';
    const ok = await R.richModal('Ramalan ayat bersitasi', `<p>Apabila hidup, setiap kali Prof Dr menamatkan ayat dalam <b>RAM</b> dengan noktah (atau tanda soal) di hujung perenggan dan berhenti menaip seketika, sistem mencadangkan satu ayat seterusnya yang berkaitan dengan ayat itu, sebagai teks bayang berwarna kelabu. Teruskan menaip seperti biasa jika tidak mahu menggunakannya; bayang itu hilang serta-merta.</p>
      <p>Ayat itu hanya bersandarkan <b>rekod dalam repositori</b> (${angka(P.N)} rekod boleh disitasi${P.tiada ? `; ${angka(P.tiada)} rekod tiada Penulis atau Tahun dan tidak digunakan` : ''}). Model hanya menulis ayat dan menamakan kod rekod; <b>sitasi APA 7 dibina oleh sistem</b> daripada medan Penulis dan Tahun rekod, dan petikan bukti disemak dengan teks rekod sebenar. Klik sitasi dalam RAM atau ASAL untuk melihat rujukan APA 7 lengkapnya.</p>
      <label class="tul-cb"><input type="checkbox" id="rmOn"${t.on ? ' checked' : ''}> Hidupkan ramalan automatik selepas noktah dalam RAM</label>
      <div class="rm-tet"><label>Model <select id="rmModel" class="modal-in">${MODEL_RAMAL.map(([v, l]) => `<option value="${v}"${v === t.model ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label>Jeda selepas noktah <select id="rmJeda" class="modal-in">${JEDA.map(([v, l]) => `<option value="${v}"${v === t.jeda ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label>Bilangan cadangan <select id="rmBil" class="modal-in">${[1, 2, 3].map(v => `<option value="${v}"${v === t.bil ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Had ramalan sehari <input id="rmHad" class="modal-in" type="number" min="10" max="5000" value="${t.had}"></label></div>
      <label class="tul-cb"><input type="checkbox" id="rmPopup"${t.popup ? ' checked' : ''}> Popup rujukan APA 7 apabila sitasi diklik (RAM dan ASAL)</label>
      <p class="help"><b>Kekunci:</b> Tab terima · Esc tolak · Alt+] atau Alt+[ cadangan lain · Ctrl+. ramal serta-merta (juga butang "Ramal ayat" dalam bar RAM, untuk iPad dan telefon). Ramalan hanya dibuat dalam RAM; ASAL tidak pernah ditulis oleh agen. Ayat yang diterima ialah bahan mentah: semak rekodnya dan olah dahulu sebelum dipindahkan ke ASAL.</p>
      <p class="help"><b>Kos:</b> setiap ramalan ialah satu panggilan ke API Anthropic dengan kunci API Prof Dr (effort rendah). ${anggar} Pustaka repositori kira-kira ${angka(P.token)} token${P.token > HAD_PENUH ? `; kerana melebihi ${angka(HAD_PENUH)} token, hanya ${BIL_HAMPIR} rekod paling hampir dihantar setiap kali` : ''}.</p>
      <p class="help"><b>Hari ini (peranti ini):</b> ${angka(g.n)} ramalan, ${angka(g.terima)} diterima; token masuk ${angka(g.masuk)}, cache dibaca ${angka(g.cacheBaca)}, cache ditulis ${angka(g.cacheTulis)}, keluar ${angka(g.keluar)}; anggaran ${usd(g.usd)}.</p>`, 'Simpan', 'Batal');
    if (!ok) return; const v = R.richModal.values || {};
    simpanTet({ on: !!v.rmOn, model: v.rmModel, jeda: +v.rmJeda, bil: +v.rmBil, had: +v.rmHad, popup: !!v.rmPopup });
    if (!tet().popup) tutupPopup(); serlah();
    toast(tet().on ? 'Ramalan ayat automatik dihidupkan dalam RAM' : 'Ramalan ayat automatik dimatikan; butang Ramal ayat dan Ctrl+. masih boleh digunakan');
  }
  function kemasButang() { document.querySelectorAll('.tul-bar [data-ramal="tetapan"]').forEach(b => { const on = tet().on; b.textContent = on ? 'Auto: Hidup' : 'Auto: Mati'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  function barHtml() { const on = tet().on; return `<span class="grp ramal"><button data-ramal="kini" title="Ramal satu ayat seterusnya bersitasi daripada rekod repositori pada kedudukan kursor (Ctrl+.)">Ramal ayat</button><button data-ramal="tetapan" class="rm-tog${on ? ' on' : ''}" aria-pressed="${on}" title="Tetapan ramalan ayat automatik selepas noktah">${on ? 'Auto: Hidup' : 'Auto: Mati'}</button><button data-ramal="rujukan" title="Senarai rujukan APA 7 bagi semua sitasi dalam ASAL dan RAM seksyen ini">Rujukan</button></span>`; }
  function butang(a) { if (a === 'kini') { batal(); cuba(true); } else if (a === 'tetapan') { batal(); bukaTetapan(); } else if (a === 'rujukan') { batal(); senaraiRujukan(); } }
  /* Dipanggil oleh renderEditor selepas editor baharu dipasang: tutup semua sisa ramalan dan kira serlahan sitasi. */
  function pasang() { batal(); tutupPopup(); serlah(); }
  function tutup() { batal(); tutupPopup(); }

  return { input, kekunci, tekan, klik, kabur, pilihan, pasang, tutup, butang, barHtml, serlah, bukaTetapan, senaraiRujukan,
    /* untuk ujian */ _: { cariSitasi, pustaka, urusPenulis, ayatTerakhir, sahkan, bersihAyat, apaHtml, nisbahBukti, bahasaInggeris, tet, guna, state: Z } };
}
