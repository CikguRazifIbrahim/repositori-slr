/* Bengkel Sintesis: pangkalan pengetahuan tanpa DOM (boleh diuji dalam Node).
   Kandungan: jenis sintesis, hubungan antara sumber, fungsi ayat dalam perenggan sintesis, tangga bantuan, pustaka penanda wacana dan
   kata kerja pelaporan (Bahasa Melayu dan Bahasa Inggeris), glosari, bentuk yang patut dielakkan, sumber yang disahkan, serta utiliti
   teks: pecah ayat, kesan sitasi, pengesan gaya laporan lawan sintesis, pertindihan dengan teks contoh dan semakan bahan.
   Semua frasa pustaka ditulis sendiri mengikut fungsi wacana; tiada senarai frasa disalin daripada mana-mana buku frasa. */

/* ---- jenis sintesis (senarai juntai). k = kunci; ms/en = nama; ket = bila digunakan; tanda = petunjuk dalam bahan; resipi = gerakan ayat;
   pustaka = kategori pustaka yang paling berguna; letak = tempat lazim hasilnya ditulis ---- */
export const JENIS = [
  { k: 'auto', ms: 'Biar pembantu cadangkan', en: 'Let the assistant suggest', ket: 'Pembantu meneliti hubungan antara ayat yang diberi dan memilih jenis sintesis yang paling sepadan, berserta sebabnya.', tanda: '', resipi: [], pustaka: [], letak: [] },
  { k: 'selari', ms: 'Kesepakatan', en: 'Convergence', ket: 'Beberapa sumber menyokong tuntutan yang sama. Sumber disatukan di bawah satu idea, bukan disenaraikan satu demi satu.', tanda: 'Dapatan atau hujah yang searah daripada sumber berlainan.', resipi: ['tuntutan', 'bukti', 'syarat', 'tafsir'], pustaka: ['sama', 'kumpul', 'lapor'], letak: ['Bab 2: subtopik pemboleh ubah', 'Pendahuluan artikel: latar bukti'] },
  { k: 'canggah', ms: 'Percanggahan', en: 'Contradiction', ket: 'Dapatan atau hujah bertentangan. Perenggan menyatakan percanggahan itu dan, jika bahan membenarkan, puncanya (kaedah, konteks atau ukuran).', tanda: 'Arah dapatan berlawanan, atau satu sumber menafikan sumber lain.', resipi: ['tuntutan', 'banding', 'syarat', 'tafsir'], pustaka: ['beza', 'syarat', 'nilai'], letak: ['Bab 2: perbahasan dapatan', 'Pernyataan masalah', 'Perbincangan dapatan'] },
  { k: 'lengkap', ms: 'Saling melengkapi', en: 'Complementary (line of argument)', ket: 'Setiap sumber menyumbang bahagian yang berlainan kepada satu gambaran atau hujah yang lebih besar.', tanda: 'Sumber membincangkan aspek berlainan bagi perkara yang sama.', resipi: ['tuntutan', 'bukti', 'bukti', 'tafsir', 'kait'], pustaka: ['tambah', 'kumpul', 'sebab'], letak: ['Bab 2: kerangka konsep', 'Pendahuluan artikel'] },
  { k: 'tema', ms: 'Tematik', en: 'Thematic', ket: 'Sumber dikumpulkan mengikut tema atau dimensi, dan setiap tema dihuraikan dengan beberapa sumber.', tanda: 'Bahan boleh dibahagikan kepada dua atau tiga tema.', resipi: ['tuntutan', 'bukti', 'banding', 'tafsir'], pustaka: ['kumpul', 'tambah', 'sama'], letak: ['Bab 2: dimensi konstruk', 'Sorotan literatur artikel ulasan'] },
  { k: 'kronologi', ms: 'Perkembangan mengikut masa', en: 'Chronological development', ket: 'Menunjukkan bagaimana idea, takrif atau dapatan berubah dari tahun ke tahun.', tanda: 'Sumber daripada tempoh berlainan dengan penekanan yang berubah.', resipi: ['tuntutan', 'bukti', 'banding', 'tafsir'], pustaka: ['masa', 'beza', 'tambah'], letak: ['Bab 2: evolusi konsep', 'Latar belakang kajian'] },
  { k: 'takrif', ms: 'Takrif dan konsep', en: 'Definition and concept', ket: 'Membandingkan beberapa takrif, menonjolkan unsur yang dikongsi dan yang berbeza, lalu merumus takrif kerja.', tanda: 'Ayat yang mentakrifkan atau menghuraikan konstruk yang sama.', resipi: ['tuntutan', 'banding', 'tafsir', 'kait'], pustaka: ['takrif', 'sama', 'beza', 'pendirian'], letak: ['Bab 1: definisi operasional', 'Bab 2: definisi konstruk'] },
  { k: 'teori', ms: 'Teori dengan bukti', en: 'Theory with evidence', ket: 'Tuntutan teori menjadi tulang belakang hujah; dapatan empirikal hadir sebagai sokongan atau cabaran.', tanda: 'Sekurang-kurangnya satu ayat teori atau model dan satu ayat dapatan.', resipi: ['tuntutan', 'bukti', 'banding', 'tafsir'], pustaka: ['teori', 'sama', 'nilai'], letak: ['Bab 2: seksyen teori dan model', 'Kerangka teori artikel'] },
  { k: 'mekanisme', ms: 'Sebab dan mekanisme', en: 'Causal chain and mechanism', ket: 'Merangkaikan dapatan menjadi satu laluan, contohnya pemboleh ubah bebas kepada pengantara kepada pemboleh ubah bersandar.', tanda: 'Dapatan tentang hubungan berangkai antara pemboleh ubah.', resipi: ['tuntutan', 'bukti', 'bukti', 'syarat', 'tafsir'], pustaka: ['sebab', 'syarat', 'tambah'], letak: ['Bab 2: pembinaan hipotesis', 'Kerangka konsep'] },
  { k: 'kaedah', ms: 'Metodologi', en: 'Methodological', ket: 'Membandingkan reka bentuk, sampel, instrumen atau analisis kajian lepas serta kekuatan dan kelemahannya.', tanda: 'Ayat tentang cara kajian dijalankan.', resipi: ['tuntutan', 'banding', 'syarat', 'tafsir', 'kait'], pustaka: ['nilai', 'beza', 'kumpul'], letak: ['Bab 3: justifikasi kaedah', 'Bab 2: kritikan kajian lepas'] },
  { k: 'konteks', ms: 'Perbandingan konteks', en: 'Cross-context comparison', ket: 'Menunjukkan sama ada dapatan kekal atau berubah merentas negara, peringkat sekolah atau populasi.', tanda: 'Dapatan yang serupa atau berbeza daripada latar berlainan.', resipi: ['tuntutan', 'banding', 'syarat', 'tafsir', 'kait'], pustaka: ['syarat', 'beza', 'sama'], letak: ['Bab 2: kajian luar negara dan dalam negara', 'Pernyataan masalah'] },
  { k: 'jurang', ms: 'Jurang kajian', en: 'Research gap', ket: 'Menyusun apa yang sudah dikaji lawan apa yang belum, lalu menyatakan jurang. Jurang ialah dakwaan tentang ketiadaan, maka ia dihadkan kepada sumber yang diteliti.', tanda: 'Sumber yang masing-masing meninggalkan satu unsur (pemboleh ubah, konteks, kaedah).', resipi: ['tuntutan', 'bukti', 'banding', 'jurang', 'kait'], pustaka: ['jurang', 'beza', 'kumpul'], letak: ['Bab 1: pernyataan masalah', 'Pendahuluan artikel', 'Penutup Bab 2'] },
  { k: 'pendirian', ms: 'Hujah dan pendirian penulis', en: 'Argument and stance', ket: 'Pandangan sumber dihuraikan dahulu, kemudian penulis menyatakan pendirian: setuju, tidak setuju dengan alasan, atau setuju bersyarat.', tanda: 'Sumber yang membawa pandangan atau tafsiran, bukan sekadar angka.', resipi: ['tuntutan', 'bukti', 'banding', 'tafsir', 'kait'], pustaka: ['pendirian', 'nilai', 'beza'], letak: ['Bab 2: hujah kritikal', 'Perbincangan'] },
  { k: 'dapatan', ms: 'Dapatan sendiri dengan kajian lepas', en: 'Own findings against prior studies', ket: 'Dapatan kajian Prof Dr dibandingkan dengan kajian lepas: yang menyokong, yang bercanggah, dan sebab perbezaannya. Tandakan satu ayat bahan sebagai "Dapatan saya".', tanda: 'Satu ayat dapatan sendiri dan beberapa ayat dapatan kajian lepas.', resipi: ['tuntutan', 'banding', 'banding', 'tafsir', 'kait'], pustaka: ['sama', 'beza', 'syarat', 'sebab'], letak: ['Bab 5: perbincangan dapatan', 'Perbincangan artikel empirikal'] }
];
export const JENIS_PETA = Object.fromEntries(JENIS.map(j => [j.k, j]));
export const namaJenis = (k, bhs) => { const j = JENIS_PETA[k]; return j ? (bhs === 'en' ? j.en : j.ms) : String(k || ''); };

/* ---- hubungan antara sumber: enam yang sama dengan Rantaian sintesis (medan 12) supaya istilah seragam, ditambah "tiada" ---- */
export const HUBUNGAN = [
  ['selari', 'Selari', 'menyokong atau konsisten antara satu dengan yang lain'],
  ['bercanggah', 'Bercanggah', 'dapatan atau hujahnya bertentangan'],
  ['melanjutkan', 'Melanjutkan', 'satu sumber meluaskan atau mendalami sumber yang lain'],
  ['melengkapi', 'Melengkapi', 'masing-masing mengisi aspek yang tidak diliputi oleh yang lain'],
  ['mengulang', 'Mengulang', 'mereplikasi atau mengulang dapatan yang sama'],
  ['berbeza', 'Berbeza konteks', 'persamaan umum tetapi konteks, populasi atau kaedah berlainan'],
  ['tiada', 'Tiada kaitan jelas', 'tidak berkongsi tumpuan yang membolehkan sintesis']
];
export const HUBUNGAN_PETA = Object.fromEntries(HUBUNGAN.map(h => [h[0], h]));

/* ---- fungsi ayat dalam perenggan sintesis (label pada setiap ayat contoh) ---- */
export const FUNGSI_AYAT = [
  ['tuntutan', 'Tuntutan', 'Ayat idea: menyatakan perkara yang hendak dihujahkan, bukan nama pengarang.'],
  ['bukti', 'Bukti bersama', 'Satu ayat memikul dua sumber atau lebih yang menyokong idea yang sama.'],
  ['banding', 'Perbandingan', 'Menyatakan persamaan atau perbezaan antara sumber.'],
  ['syarat', 'Syarat atau had', 'Bila, bagi siapa atau dalam konteks apa dapatan itu benar.'],
  ['tafsir', 'Tafsiran penulis', 'Apa makna hubungan antara sumber itu. Tiada sitasi kerana ini suara penulis.'],
  ['jurang', 'Pernyataan jurang', 'Apa yang belum dikaji, dihadkan kepada sumber yang diteliti.'],
  ['kait', 'Kaitan', 'Menyambungkan perenggan kepada konteks perbincangan atau kajian sendiri.']
];
export const FUNGSI_PETA = Object.fromEntries(FUNGSI_AYAT.map(f => [f[0], f]));

/* ---- tangga bantuan: daripada contoh penuh kepada rangka kepada menulis sendiri (bantuan dikurangkan berperingkat) ---- */
export const TAHAP = [
  { n: 1, k: 'contoh', nama: 'Contoh penuh', ringkas: 'Pembantu menunjukkan sintesis lengkap; Prof Dr menulis semula dengan ayat sendiri.', butang: 'Minta contoh sintesis', ket: 'Sesuai pada peringkat awal. Baca contoh, perhatikan fungsi setiap ayat dan penanda wacananya, kemudian tulis semula tanpa melihat contoh.' },
  { n: 2, k: 'rangka', nama: 'Rangka untuk dilengkapkan', ringkas: 'Pembantu memberi peta idea dan rangka ayat berlompang; Prof Dr melengkapkannya.', butang: 'Minta rangka', ket: 'Pembantu tidak lagi menulis perenggan penuh. Prof Dr memilih penanda wacana dan melengkapkan setiap ayat, kemudian meminta semakan.' },
  { n: 3, k: 'semak', nama: 'Saya tulis dahulu', ringkas: 'Prof Dr menulis sintesis sendiri; pembantu hanya menyemak dan memberi maklum balas.', butang: 'Semak tulisan saya', ket: 'Tahap berdikari. Pembantu menilai sama ada tulisan itu sintesis atau laporan, menyemak kesetiaan kepada sumber, dan mencadangkan pembaikan tanpa menulis semula perenggan.' }
];
export const HAD = { bahan: 10, aksaraBahan: 1500, konteks: 1200, tulisan: 6000, sesi: 8, minPatahTulisan: 15 };

/* ---- glosari istilah sintesis ---- */
export const GLOSARI = [
  ['Sintesis', 'synthesis', 'Menyepadukan idea daripada beberapa sumber menjadi satu hujah baharu yang disusun mengikut idea, bukan mengikut pengarang.'],
  ['Ringkasan', 'summary', 'Menyatakan semula isi satu sumber dengan lebih pendek. Beberapa ringkasan yang disusun berturutan belum menjadi sintesis.'],
  ['Penulisan laporan', 'report writing, listing', 'Sumber dihuraikan satu demi satu ("A mendapati..., B menyatakan...") tanpa dinyatakan hubungan antaranya.'],
  ['Berpusatkan pengarang', 'author-centric', 'Perenggan disusun mengikut siapa yang berkata. Tandanya: kebanyakan ayat bermula dengan nama pengarang.'],
  ['Berpusatkan idea', 'concept-centric', 'Perenggan disusun mengikut idea atau konsep, dan pengarang hadir sebagai bukti di dalam kurungan.'],
  ['Parafrasa', 'paraphrase', 'Menyatakan semula makna sumber dengan struktur ayat dan pilihan kata sendiri, disertai sitasi.'],
  ['Tulisan tampalan', 'patchwriting', 'Menyalin ayat sumber dan menukar beberapa perkataan sahaja. Lazim pada penulis yang sedang belajar, tetapi perlu ditinggalkan.'],
  ['Tuntutan', 'claim', 'Kenyataan yang hendak dipertahankan dalam perenggan.'],
  ['Bukti', 'evidence', 'Dapatan, data atau hujah sumber yang menyokong tuntutan.'],
  ['Tafsiran', 'interpretation', 'Penjelasan penulis tentang makna bukti: kenapa sumber selari, kenapa bercanggah, apa implikasinya.'],
  ['Pendirian', 'stance', 'Kedudukan penulis terhadap pandangan sumber: setuju, tidak setuju dengan alasan, atau setuju bersyarat.'],
  ['Jurang kajian', 'research gap', 'Perkara yang belum dikaji atau belum dijawab. Dakwaan jurang dihadkan kepada sumber yang telah diteliti.'],
  ['Penanda wacana', 'discourse marker', 'Perkataan atau frasa yang menunjukkan hubungan antara ayat: tambahan, pertentangan, sebab, kesimpulan dan sebagainya.'],
  ['Kata kerja pelaporan', 'reporting verb', 'Kata kerja yang memperkenalkan isi sumber, contohnya mendapati, menghujahkan, mencadangkan. Pilihannya menunjukkan sikap penulis.'],
  ['Sitasi naratif', 'integral citation', 'Nama pengarang menjadi sebahagian ayat: "Saha et al. (2020) mendapati...". Menonjolkan pengarang.'],
  ['Sitasi kurungan', 'non-integral citation', 'Nama pengarang di dalam kurungan: "... (Saha et al., 2020; Schmitt, 2021)". Menonjolkan idea dan memudahkan gabungan sumber.'],
  ['Matriks sintesis', 'synthesis matrix', 'Jadual yang barisnya idea atau tema dan lajurnya sumber, supaya kelihatan sumber mana menyokong idea mana.'],
  ['Pagar bahasa', 'hedging', 'Kata yang menunjukkan kehati-hatian: mungkin, cenderung, sebahagiannya. Digunakan apabila bukti terhad.'],
  ['Petikan langsung', 'direct quotation', 'Kata-kata asal sumber di dalam tanda petik dengan nombor muka surat. Gunakan berjimat dan sentiasa diikuti huraian.']
];

/* ================= utiliti teks ================= */
const TAHUN = '(?:1[89]|20)\\d{2}[a-z]?';
const SINGKATAN = ['et al', 'e.g', 'i.e', 'cf', 'vs', 'm.s', 'ms', 'hlm', 'dll', 'dsb', 'spt', 'Dr', 'Prof', 'Mr', 'Mrs', 'Ms', 'No', 'no', 'Bil', 'bil', 'Jil', 'jil', 'pp', 'p', 'Fig', 'Rajah', 'ed', 'eds', 'Pnyt', 'Vol', 'vol', 'St', 'Jr', 'Sdn', 'Bhd', 'Hj', 'Tn', 'Pn', 'Bt', 'bt', 'b'];
const TITIK = '․'; // pengganti sementara bagi titik yang bukan penamat ayat
export const patah = t => { const m = String(t || '').trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu); return m ? m.length : 0; };
export const bersih = s => String(s == null ? '' : s).replace(/\s*[—―]\s*/g, ', ').replace(/(\d)\s*–\s*(\d)/g, '$1-$2').replace(/\s*–\s*/g, ', ').replace(/[​-‍﻿]/g, '').replace(/[ \t]+/g, ' ').trim();
export function pecahAyat(teks) {
  let s = String(teks || '').replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim(); if (!s) return [];
  SINGKATAN.forEach(a => { s = s.replace(new RegExp('(^|[\\s(\\[])' + a.replace(/\./g, '\\.') + '\\.', 'g'), (m, p) => p + a.replace(/\./g, TITIK) + TITIK); });
  s = s.replace(/(\d)\.(\d)/g, '$1' + TITIK + '$2').replace(/\b([A-Z])\.(?=\s*[A-Z][.\s,])/g, '$1' + TITIK).replace(/\.(?=\s*[,;)])/g, TITIK);
  const out = []; let mula = 0; const re = /[.!?]+["'”’)\]]*\s+(?=["'“‘(\[]?[A-ZÀ-ɏ0-9])/g; let m;
  while ((m = re.exec(s))) { out.push(s.slice(mula, m.index + m[0].length).trim()); mula = m.index + m[0].length; }
  const baki = s.slice(mula).trim(); if (baki) out.push(baki);
  return out.map(a => a.split(TITIK).join('.')).filter(a => /[\p{L}]/u.test(a));
}
const tanpaDiakritik = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const KATA_BUANG = new Set(['et', 'al', 'dan', 'and', 'rakan', 'rakan-rakan', 'lihat', 'juga', 'contohnya', 'see', 'also', 'cf', 'eg', 'ie', 'cth', 'seperti', 'dalam', 'in', 'menurut', 'bagi', 'kajian', 'oleh', 'according', 'to', 'the', 'a', 'study', 'by', 'dapatan', 'research']);
/* Kunci sumber: perkataan pertama nama (berhuruf besar atau satu-satunya) + tahun, contohnya "saha2020". */
export function kunciSumber(pengarang, tahun) {
  const th = (String(tahun || '').match(/(?:1[89]|20)\d{2}/) || [''])[0];
  const tok = tanpaDiakritik(pengarang).replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
  const besar = tok.find(w => /^[A-Z]/.test(w) && !KATA_BUANG.has(w.toLowerCase())) || tok.find(w => !KATA_BUANG.has(w.toLowerCase())) || '';
  return besar ? besar.toLowerCase().replace(/[^a-z0-9]/g, '') + th : '';
}
/* Kesan sitasi APA dalam satu ayat atau perenggan. Pulangan: [{ kunci, pengarang, tahun, bentuk: 'naratif' | 'kurungan', pos }] */
export function kesanSitasi(teks) {
  const s = String(teks || ''); const out = []; const reK = /\(([^()]*)\)/g; let m;
  const reTahun = new RegExp(TAHUN); const reTahunSahaja = new RegExp('^\\s*' + TAHUN + '(?:\\s*,\\s*' + TAHUN + ')*(?:\\s*[,;:]\\s*(?:m\\.?\\s?s\\.?|hlm\\.?|pp?\\.?|para\\.?)\\s*[^()]*)?\\s*$');
  while ((m = reK.exec(s))) {
    const isi = m[1]; if (!reTahun.test(isi)) continue;
    if (reTahunSahaja.test(isi)) {
      const sebelum = s.slice(Math.max(0, m.index - 90), m.index); const tok = sebelum.trim().split(/\s+/); const nama = [];
      for (let i = tok.length - 1; i >= 0 && nama.length < 8; i--) { const w = tok[i]; const inti = w.replace(/[,.;:]+$/, ''); if (/^[A-ZÀ-ɏ][\p{L}'’-]*$/u.test(inti) || /^(et|al|dan|and|&|rakan-rakan|bin|binti|van|der|de|al-[A-Z]\p{L}+)$/iu.test(inti)) nama.unshift(w); else break; }
      while (nama.length && /^(dan|and|&|et|al\.?|bin|binti)$/i.test(nama[0].replace(/[,.;:]+$/, ''))) nama.shift();
      const p = nama.join(' ').replace(/[,;:]+$/, '').trim(); const th = (isi.match(reTahun) || [''])[0];
      if (p) out.push({ kunci: kunciSumber(p, th), pengarang: p, tahun: th, bentuk: 'naratif', pos: m.index });
    } else {
      isi.split(';').forEach(bhg => { const th = (bhg.match(reTahun) || [''])[0]; if (!th) return; const p = bhg.slice(0, bhg.search(reTahun)).replace(/^\s*(?:lihat juga|lihat|contohnya|cth\.?|seperti|see also|see|e\.g\.,?|cf\.?|i\.e\.,?)\s*,?\s*/i, '').replace(/[,\s]+$/, '').trim(); const k = kunciSumber(p, th); if (k && /[\p{L}]/u.test(p)) out.push({ kunci: k, pengarang: p, tahun: th, bentuk: 'kurungan', pos: m.index }); });
    }
  }
  return out;
}
const HENTI_MS = ['yang', 'dan', 'dengan', 'dalam', 'untuk', 'kepada', 'ini', 'itu', 'ialah', 'adalah', 'tidak', 'oleh', 'pada', 'daripada', 'bagi', 'juga', 'serta', 'atau', 'telah', 'akan', 'antara', 'terhadap', 'bahawa', 'mereka', 'guru', 'kajian'];
const HENTI_EN = ['the', 'of', 'and', 'to', 'in', 'that', 'is', 'for', 'with', 'as', 'was', 'were', 'on', 'by', 'this', 'are', 'from', 'their', 'which', 'has', 'have', 'between', 'these', 'study', 'teachers'];
export function bahasaTeks(teks) { const w = String(teks || '').toLowerCase().match(/[a-z]+/g) || []; if (w.length < 4) return ''; const set = new Set(w); let ms = 0, en = 0; w.forEach(x => { if (HENTI_MS.includes(x)) ms++; if (HENTI_EN.includes(x)) en++; }); if (!ms && !en) return ''; return ms >= en ? (ms === en && set.has('the') ? 'en' : 'ms') : 'en'; }
const kataNorm = t => tanpaDiakritik(String(t || '').toLowerCase()).replace(/\([^()]*\d{4}[^()]*\)/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
/* Pertindihan n-gram antara tulisan pengguna (a) dengan teks rujukan (b): peratus n-gram a yang turut ada dalam b, dan larian kata sama terpanjang. */
export function tindih(a, b, n) {
  n = n || 4; const A = kataNorm(a), B = kataNorm(b); if (A.length < n || B.length < n) return { peratus: 0, larian: 0, cukup: false };
  const gb = new Set(); for (let i = 0; i + n <= B.length; i++) gb.add(B.slice(i, i + n).join(' '));
  let sama = 0; const ga = A.length - n + 1; for (let i = 0; i < ga; i++) if (gb.has(A.slice(i, i + n).join(' '))) sama++;
  let larian = 0; const pos = new Map(); B.forEach((w, i) => { if (!pos.has(w)) pos.set(w, []); pos.get(w).push(i); });
  for (let i = 0; i < A.length; i++) (pos.get(A[i]) || []).forEach(j => { let k = 0; while (i + k < A.length && j + k < B.length && A[i + k] === B[j + k]) k++; if (k > larian) larian = k; });
  return { peratus: Math.round((sama / ga) * 100), larian, cukup: true };
}

/* ---- semakan bahan sebelum agen dipanggil (tanpa token). Pulangan: { boleh, amaran: [{ aras: 'halang' | 'amaran' | 'info', teks, id? }], sumber, bahasa } ---- */
export function semakBahan(bahan) {
  const isi = (bahan || []).filter(b => b && String(b.teks || '').trim()); const amaran = []; const kunci = new Map();
  isi.forEach(b => { const k = b.saya ? 'saya' : kunciSumber(b.pengarang, b.tahun) || ''; if (k) kunci.set(k, (kunci.get(k) || 0) + 1); });
  const tanpaSumber = isi.filter(b => !b.saya && !String(b.pengarang || '').trim()); const tanpaTahun = isi.filter(b => !b.saya && String(b.pengarang || '').trim() && !/(?:1[89]|20)\d{2}|t\.t\.|n\.d\./.test(String(b.tahun || '')));
  if (isi.length < 2) amaran.push({ aras: 'halang', teks: 'Sintesis memerlukan sekurang-kurangnya dua ayat daripada dua sumber berlainan. Tambah ayat daripada artikel kedua.' });
  else if (kunci.size < 2 && !tanpaSumber.length) amaran.push({ aras: 'halang', teks: 'Semua ayat datang daripada satu sumber sahaja. Itu ringkasan, bukan sintesis. Tambah ayat daripada sekurang-kurangnya satu sumber lain.' });
  tanpaSumber.forEach(b => amaran.push({ aras: 'halang', id: b.id, teks: 'Ayat ini belum ada sumber. Isi nama pengarang dan tahun supaya sitasi tidak direka.' }));
  tanpaTahun.forEach(b => amaran.push({ aras: 'amaran', id: b.id, teks: 'Tahun sumber belum diisi atau tidak dikenali.' }));
  const lihat = new Map();
  isi.forEach(b => {
    const n = patah(b.teks); const t = kataNorm(b.teks).join(' ');
    if (n < 6) amaran.push({ aras: 'amaran', id: b.id, teks: 'Ayat terlalu pendek (' + n + ' patah perkataan) untuk membawa satu dakwaan yang jelas.' });
    if (n > 110) amaran.push({ aras: 'amaran', id: b.id, teks: 'Petikan panjang (' + n + ' patah perkataan). Pilih satu atau dua ayat yang membawa dakwaan utama sahaja.' });
    if (lihat.has(t)) amaran.push({ aras: 'amaran', id: b.id, teks: 'Ayat ini sama dengan ayat lain dalam bahan.' }); else lihat.set(t, b.id);
    const dlm = kesanSitasi(b.teks).filter(c => c.kunci && c.kunci !== kunciSumber(b.pengarang, b.tahun));
    if (dlm.length && !b.saya) amaran.push({ aras: 'info', id: b.id, teks: 'Ayat ini memetik sumber lain (' + dlm.slice(0, 3).map(c => c.pengarang + ', ' + c.tahun).join('; ') + '). Itu sitasi sekunder: sitasikan artikel yang Prof Dr baca, atau cari sumber asalnya.' });
  });
  const bhs = new Set(isi.map(b => bahasaTeks(b.teks)).filter(Boolean));
  if (isi.length > 8) amaran.push({ aras: 'info', teks: 'Bahan melebihi lapan ayat. Satu perenggan elok memikul satu idea; pertimbangkan memecahkan bahan kepada dua kerja sintesis.' });
  return { boleh: !amaran.some(a => a.aras === 'halang'), amaran, sumber: kunci.size, bil: isi.length, bahasa: Array.from(bhs) };
}

/* ================= pustaka: penanda wacana dan rangka ayat mengikut fungsi (ditulis sendiri) =================
   Setiap entri: frasa atau [frasa, nota]. [X], [Y] = sumber; "..." = isi ayat. kesan = corak untuk mengesan fungsi itu dalam tulisan pengguna. */
export const PUSTAKA = [
  { k: 'sama', ms: 'Persamaan dan kesepakatan', en: 'Similarity and agreement', ket: 'Menunjukkan bahawa dua sumber atau lebih menyokong idea yang sama.',
    e: { ms: ['Selari dengan [X], [Y] turut mendapati bahawa ...', 'Sejajar dengan dapatan [X], ...', 'Dapatan ini konsisten dengan [X] dan [Y] yang ...', 'Seperti [X], [Y] juga melaporkan ...', 'Begitu juga, ...', 'Demikian juga halnya dengan ...', 'Kedua-dua kajian mendapati bahawa ...', 'Dapatan yang serupa dilaporkan oleh [X].', '[X] menyokong dapatan [Y] bahawa ...', 'Pola yang sama dikesan dalam ...', 'Hal ini diperkukuh oleh [X] yang ...', 'Kajian-kajian ini sepakat bahawa ...', 'Senada dengan itu, ...'],
      en: ['Consistent with [X], [Y] also found that ...', 'In line with [X], ...', 'Similarly, ...', 'Likewise, ...', 'Both [X] and [Y] report that ...', 'A similar pattern emerges in ...', 'These studies converge on the view that ...', '[X] corroborates the finding of [Y] that ...', 'This finding echoes ...', 'Taken together, these studies indicate that ...', 'There is broad agreement that ...', 'This is supported by [X], who ...'] },
    kesan: { ms: /\b(selari dengan|sejajar dengan|selaras dengan|konsisten dengan|begitu juga|demikian juga|senada dengan|dapatan (?:yang )?serupa|pola yang sama|kedua-dua (?:kajian|sumber|dapatan|pengkaji)|menyokong dapatan|diperkukuh oleh|turut (?:mendapati|melaporkan|menunjukkan|menyokong)|sepakat)\b/i, en: /\b(consistent with|in line with|similarly|likewise|both [^.]{1,40} and|a similar pattern|converge[sd]?|corroborat\w+|echo(?:es|ed)?|taken together|broad agreement|is supported by)\b/i } },
  { k: 'beza', ms: 'Perbezaan dan percanggahan', en: 'Contrast and disagreement', ket: 'Menunjukkan bahawa sumber berbeza arah, dan membuka ruang untuk menjelaskan puncanya.',
    e: { ms: [['Sebaliknya, [X] mendapati ...', 'Penghubung tentangan; boleh memulakan ayat (DBP, 11 Mei 2025).'], 'Berbeza dengan [X], [Y] melaporkan ...', ['Walau bagaimanapun, ...', 'Dieja "walau bagaimanapun" (DBP, 12 Januari 2017); penanda wacana pada awal ayat diikuti koma (DBP, 2 Januari 2021).'], ['Namun, ...', 'Jawapan DBP 2012 menerima "namun" sahaja; jawapan 27 Jun 2021 lebih menggemari "namun begitu" atau "namun demikian".'], 'Namun demikian, ...', 'Namun begitu, ...', 'Akan tetapi, ...', ['... lebih ... berbanding dengan ...', 'Ditulis "berbanding dengan" apabila bermaksud dibandingkan (DBP, 26 Februari 2010 dan 15 Mac 2021).'], 'Dapatan ini bercanggah dengan [X] yang ...', 'Tidak selari dengan [X], ...', ['[X] menekankan ..., manakala [Y] menumpukan ...', '"manakala" hadir di tengah ayat selepas koma dan tidak memulakan ayat (DBP, 24 Julai 2024).'], '[X] ..., sedangkan [Y] ...', 'Di satu pihak, ... Di pihak yang lain, ...', 'Percanggahan ini mungkin berpunca daripada ...', 'Perbezaan dapatan ini dapat dijelaskan melalui ...', 'Tidak semua kajian menyokong ...', 'Bertentangan dengan jangkaan, ...'],
      en: ['In contrast, [X] found ...', 'Unlike [X], [Y] reports ...', 'However, ...', 'Nevertheless, ...', 'Whereas [X] emphasises ..., [Y] focuses on ...', 'This finding conflicts with [X], who ...', 'Contrary to expectations, ...', 'On the one hand, ... On the other hand, ...', 'The discrepancy may stem from ...', 'This inconsistency can be explained by ...', 'Not all studies support ...', 'By comparison, ...', 'Conversely, ...'] },
    kesan: { ms: /\b(sebaliknya|berbeza dengan|berbanding dengan|walau bagaimanapun|namun|akan tetapi|bercanggah dengan|tidak selari dengan|bertentangan dengan|manakala|sedangkan|di pihak yang lain|percanggahan|perbezaan (?:dapatan|ini)|tidak semua kajian)\b/i, en: /\b(in contrast|unlike|however|nevertheless|nonetheless|whereas|conflicts? with|contrary to|on the other hand|discrepanc\w+|inconsisten\w+|not all studies|by comparison|conversely)\b/i } },
  { k: 'tambah', ms: 'Menambah dan meluaskan', en: 'Addition and extension', ket: 'Menambah bukti atau meluaskan idea yang sama. Gunakan berjimat: tambahan tanpa perbandingan mudah menjadi senarai.',
    e: { ms: [['Selain itu, ...', 'Bukan "selain daripada itu" (DBP, 24 Jun 2009). Jangan mulakan beberapa perenggan berturut-turut dengan frasa ini.'], ['Di samping itu, ...', 'Penghubung tambahan, dieja tiga perkataan (DBP, 3 April 2011 dan 2 Mei 2023).'], 'Tambahan pula, ...', 'Lebih daripada itu, ...', ['Malah, ...', 'Sama maksud dengan "bahkan" (DBP, 12 Jun 2012).'], 'Bukan sahaja ..., malah ...', ['Justeru, ...', 'Menurut DBP, "justeru" bermaksud malahan atau bahkan, bukan "oleh itu" (jawapan 28 Mei 2010 dan 21 November 2013). Guna untuk menambah penegasan sahaja.'], 'Seterusnya, ...', '[X] melanjutkan hujah ini dengan ...', 'Melangkaui dapatan itu, [X] menunjukkan ...', 'Dapatan [X] melengkapkan gambaran ini dengan ...', 'Lebih khusus lagi, ...'],
      en: ['In addition, ...', 'Moreover, ...', 'Furthermore, ...', 'Beyond this, [X] shows ...', '[X] extends this argument by ...', 'Not only ..., but also ...', 'More specifically, ...', 'Building on [X], [Y] ...', '[X] adds that ...', 'A further point is that ...'] },
    kesan: { ms: /\b(selain itu|di samping itu|tambahan pula|lebih daripada itu|malah|malahan|bahkan|justeru|bukan sahaja|seterusnya|melanjutkan|melangkaui|melengkapkan|lebih khusus lagi)\b/i, en: /\b(in addition|moreover|furthermore|beyond this|extends? this|not only|more specifically|building on|adds? that|a further point)\b/i } },
  { k: 'sebab', ms: 'Sebab, akibat dan implikasi', en: 'Cause, consequence and implication', ket: 'Menyatakan apa yang terhasil daripada gabungan bukti, atau kenapa sesuatu berlaku.',
    e: { ms: [['Oleh itu, ...', 'Penghubung musabab (DBP, 17 Mac 2022).'], 'Oleh sebab itu, ...', ['Oleh sebab ..., ...', 'Bukan "oleh kerana" (DBP, 20 Januari 2022).'], 'Oleh yang demikian, ...', 'Dengan demikian, ...', ['Hal ini dikatakan demikian kerana ...', 'DBP menolak bentuk "hal ini kerana" (jawapan 28 September 2020).'], 'Kesannya, ...', 'Akibatnya, ...', 'Lantaran itu, ...', 'Hal ini berpunca daripada ...', 'Hal ini menyebabkan ...', 'Implikasinya, ...', 'Dapatan ini membayangkan bahawa ...', ['Sehubungan dengan itu, ...', 'Bukan "sehubungan itu" (DBP, 13 Januari 2023).'], 'Maka, ...'],
      en: ['Therefore, ...', 'Thus, ...', 'Consequently, ...', 'As a result, ...', 'Hence, ...', 'This suggests that ...', 'This implies that ...', 'It follows that ...', 'For this reason, ...', 'This may explain why ...'] },
    kesan: { ms: /\b(oleh itu|oleh sebab|oleh yang demikian|dengan demikian|kesannya|akibatnya|lantaran itu|berpunca daripada|menyebabkan|implikasinya|membayangkan bahawa|sehubungan dengan itu|dikatakan demikian kerana|maka)\b/i, en: /\b(therefore|thus|consequently|as a result|hence|this suggests|this implies|it follows that|for this reason|may explain)\b/i } },
  { k: 'syarat', ms: 'Syarat, had dan konteks', en: 'Condition, limit and context', ket: 'Menyatakan bila, bagi siapa atau di mana sesuatu dapatan benar. Inilah yang mengubah senarai dapatan menjadi perbandingan.',
    e: { ms: ['Namun, dapatan ini terhad kepada ...', 'Dalam konteks ..., ...', 'Hubungan ini hanya ketara apabila ...', 'Kesan itu lebih kuat dalam kalangan ...', 'Dapatan ini tidak semestinya terpakai kepada ...', 'Bergantung pada ..., ...', 'Bagi [kumpulan A], ...; bagi [kumpulan B] pula, ...', 'Dengan syarat ..., ...', 'Sekurang-kurangnya dalam ..., ...', 'Setakat yang dilaporkan, ...'],
      en: ['This holds only when ...', 'In the context of ..., ...', 'The effect is stronger among ...', 'This finding may not generalise to ...', 'Provided that ..., ...', 'Depending on ..., ...', 'At least in ..., ...', 'To the extent that ..., ...', 'With the exception of ..., ...', 'This finding is limited to ...'] },
    kesan: { ms: /\b(terhad kepada|dalam konteks|hanya (?:ketara|berlaku|signifikan) apabila|lebih kuat dalam kalangan|tidak semestinya|bergantung (?:pada|kepada)|dengan syarat|sekurang-kurangnya dalam|setakat yang dilaporkan)\b/i, en: /\b(only when|in the context of|stronger among|may not generali[sz]e|provided that|depending on|at least in|to the extent that|with the exception of|limited to)\b/i } },
  { k: 'nilai', ms: 'Menilai dan mengkritik', en: 'Evaluation and critique', ket: 'Menimbang kekuatan dan kelemahan sumber. Kritikan mesti beralasan dan bersandar pada bahan.',
    e: { ms: ['Walaupun [X] ..., kajian itu tidak mengambil kira ...', 'Kekuatan kajian ini terletak pada ...', 'Kelemahan utamanya ialah ...', 'Dakwaan ini sukar dipertahankan kerana ...', 'Tafsiran itu tidak salah, tetapi tidak lengkap.', 'Reka bentuk keratan rentas mengehadkan ...', '[X] terlepas pandang ...', 'Aspek ... kurang diberi perhatian.', 'Bukti yang dikemukakan belum mencukupi untuk ...', 'Dapatan ini wajar ditafsir dengan berhati-hati kerana ...', 'Kajian ini bergantung sepenuhnya pada ...'],
      en: ['Although [X] ..., the study does not account for ...', 'A strength of this work is ...', 'Its main limitation is ...', 'This claim is difficult to sustain because ...', 'The cross-sectional design limits ...', '[X] overlooks ...', 'Little attention has been paid to ...', 'The evidence is insufficient to ...', 'These findings should be interpreted with caution because ...', 'The study relies solely on ...'] },
    kesan: { ms: /\b(tidak mengambil kira|kekuatan kajian|kelemahan(?:nya| utama(?:nya)?)?|sukar dipertahankan|tidak lengkap|mengehadkan|terlepas pandang|kurang diberi perhatian|belum mencukupi|berhati-hati|bergantung sepenuhnya)\b/i, en: /\b(does not account for|a strength of|main limitation|difficult to sustain|design limits|overlooks?|little attention|insufficient|interpreted with caution|relies (?:solely|entirely) on)\b/i } },
  { k: 'jurang', ms: 'Menyatakan jurang', en: 'Stating the gap', ket: 'Menyatakan apa yang belum dikaji. Hadkan dakwaan kepada sumber yang diteliti kerana ketiadaan sukar dibuktikan.',
    e: { ms: [['Berdasarkan sumber yang diteliti, belum ditemui kajian yang ...', 'Bentuk paling selamat: dakwaan dihadkan kepada sumber yang dibaca.'], 'Namun, masih kurang kajian yang ...', 'Kajian lepas lebih menumpukan ..., sedangkan ... kurang diteliti.', 'Persoalan tentang ... masih belum terjawab.', 'Kebanyakan kajian dijalankan di ..., manakala konteks ... jarang dikaji.', 'Hubungan antara [X] dengan [Y] telah banyak dikaji, tetapi peranan [M] sebagai pengantara ...', 'Sehingga kini, bukti tentang ... masih terhad.', 'Tiada satu pun daripada kajian ini yang menguji ...', 'Jurang ini mewajarkan kajian tentang ...'],
      en: [['Among the sources reviewed, no study was found that ...', 'Safest form: the claim is limited to the sources read.'], 'However, few studies have examined ...', 'Previous research has focused on ..., whereas ... remains underexplored.', 'The question of ... remains unanswered.', 'Most studies were conducted in ..., while ... contexts are rarely examined.', 'Evidence on ... remains limited.', 'None of these studies tested ...', 'This gap warrants a study of ...'] },
    kesan: { ms: /\b(belum ditemui kajian|masih kurang kajian|kurang diteliti|belum terjawab|jarang dikaji|masih terhad|tiada satu pun|belum ada kajian|jurang (?:ini|kajian))\b/i, en: /\b(few studies|no study has|remains? underexplored|remains? unanswered|rarely examined|remains? limited|none of these studies|no study was found|this gap)\b/i } },
  { k: 'pendirian', ms: 'Suara dan pendirian penulis', en: 'Writer voice and stance', ket: 'Memisahkan suara penulis daripada suara sumber. Tanpa ayat ini, perenggan kekal sebagai laporan.',
    e: { ms: ['Kajian ini berpendirian bahawa ...', 'Pada hemat pengkaji, ...', 'Pengkaji berpandangan bahawa ...', 'Bagi tujuan kajian ini, ...', 'Hujah ini diterima dengan syarat ...', 'Walaupun benar ..., namun ...', 'Ringkasnya, ...', 'Tegasnya, ...', 'Jelasnya, ...', 'Yang lebih penting, ...', 'Secara ringkas, ...'],
      en: ['This study takes the position that ...', 'In the view of the researcher, ...', 'For the purposes of this study, ...', 'While it is true that ..., ...', 'In short, ...', 'More importantly, ...', 'This study argues that ...', 'This argument is accepted on the condition that ...'] },
    kesan: { ms: /\b(berpendirian bahawa|pada hemat pengkaji|pengkaji berpandangan|bagi tujuan kajian ini|diterima dengan syarat|walaupun benar|ringkasnya|tegasnya|jelasnya|yang lebih penting|secara ringkas)\b/i, en: /\b(takes the position|view of the researcher|for the purposes of this study|while it is true|in short|more importantly|this study argues|on the condition that)\b/i } },
  { k: 'kumpul', ms: 'Mengumpulkan sumber', en: 'Grouping sources', ket: 'Menyebut beberapa sumber sebagai satu kumpulan di bawah satu idea, biasanya dengan sitasi berkumpulan dalam kurungan.',
    e: { ms: ['Beberapa kajian menunjukkan ... (A, 2020; B, 2021; C, 2022).', 'Sebilangan pengkaji ...', 'Kebanyakan kajian ...', 'Sekumpulan kajian menumpukan ..., manakala sekumpulan lagi ...', 'Dua aliran pemikiran dapat dikesan, iaitu ...', 'Kajian kuantitatif cenderung ..., manakala kajian kualitatif ...', 'Bukti daripada pelbagai konteks ...', 'Secara umum, literatur menunjukkan ...', 'Majoriti dapatan ...'],
      en: ['Several studies show ... (A, 2020; B, 2021; C, 2022).', 'A number of researchers ...', 'Most studies ...', 'One strand of research focuses on ..., while another ...', 'Two schools of thought can be identified: ...', 'Quantitative studies tend to ..., whereas qualitative studies ...', 'Across contexts, the evidence ...', 'The literature broadly indicates that ...'] },
    kesan: { ms: /\b(beberapa kajian|sebilangan pengkaji|kebanyakan kajian|sekumpulan kajian|dua aliran|kajian kuantitatif cenderung|pelbagai konteks|secara umum|majoriti dapatan)\b/i, en: /\b(several studies|a number of (?:researchers|studies)|most studies|one strand|two schools of thought|quantitative studies tend|across contexts|the literature (?:broadly )?indicates)\b/i } },
  { k: 'masa', ms: 'Kronologi dan perkembangan', en: 'Chronology and development', ket: 'Menunjukkan urutan masa atau peralihan tumpuan dalam literatur.',
    e: { ms: ['Pada peringkat awal, ...', 'Kajian terawal ...', 'Kemudian, ...', 'Seterusnya, ...', 'Sejak [tahun], tumpuan beralih kepada ...', 'Kajian mutakhir ...', 'Sementara itu, ...', 'Lama-kelamaan, ...', 'Sehingga kini, ...'],
      en: ['Early studies ...', 'Subsequently, ...', 'Since [year], attention has shifted to ...', 'More recent work ...', 'Meanwhile, ...', 'Over time, ...', 'To date, ...'] },
    kesan: { ms: /\b(pada peringkat awal|kajian terawal|kemudian|sejak (?:tahun )?\d{4}|kajian mutakhir|sementara itu|lama-kelamaan|sehingga kini)\b/i, en: /\b(early studies|subsequently|since \d{4}|more recent(?:ly)?|meanwhile|over time|to date)\b/i } },
  { k: 'takrif', ms: 'Takrif dan penjelasan istilah', en: 'Definition and gloss', ket: 'Memperkenalkan atau membandingkan takrif, dan menjelaskan istilah.',
    e: { ms: ['[X] mentakrifkan ... sebagai ...', ['... merujuk ...', 'Jawapan DBP 2026 menetapkan "merujuk" diikuti objeknya secara langsung; jawapan 20 Mac 2022 masih menerima "merujuk kepada".'], '... bermaksud ...', 'Dalam kajian ini, ... ditakrifkan sebagai ...', 'Dengan kata lain, ...', 'Secara khusus, ...', 'Takrif [X] menekankan ..., manakala takrif [Y] menekankan ...', 'Unsur yang dikongsi oleh takrif-takrif ini ialah ...', '..., iaitu ...'],
      en: ['[X] defines ... as ...', '... refers to ...', 'In this study, ... is defined as ...', 'In other words, ...', 'That is, ...', 'Specifically, ...', 'What these definitions share is ...'] },
    kesan: { ms: /\b(mentakrifkan|ditakrifkan sebagai|merujuk|bermaksud|dengan kata lain|secara khusus|iaitu)\b/i, en: /\b(defines? [^.]{1,40} as|refers to|is defined as|in other words|that is,|specifically)\b/i } },
  { k: 'teori', ms: 'Mengaitkan teori dengan bukti', en: 'Linking theory and evidence', ket: 'Tuntutan teori dinyatakan dahulu; dapatan hadir sebagai sokongan atau cabaran.',
    e: { ms: ['Berdasarkan [teori], ...', 'Dari sudut [teori], ...', '[Teori] menjangkakan bahawa ...; dapatan [X] menyokong jangkaan ini.', 'Sebagai sokongan, [X] mendapati ...', 'Dapatan ini memberi sokongan empirikal kepada ...', 'Dapatan ini mencabar andaian [teori] bahawa ...', 'Selaras dengan andaian [teori], ...', 'Mekanisme ini dijelaskan oleh [teori] melalui ...'],
      en: ['According to [theory], ...', 'From the perspective of [theory], ...', '[Theory] predicts that ...; the findings of [X] support this.', 'As supporting evidence, [X] found ...', 'This finding lends empirical support to ...', 'This challenges the assumption of [theory] that ...', 'This mechanism is explained by [theory] through ...'] },
    kesan: { ms: /\b(berdasarkan teori|dari sudut|menjangkakan bahawa|sebagai sokongan|sokongan empirikal|mencabar andaian|selaras dengan andaian|dijelaskan oleh)\b/i, en: /\b(according to [^.]{1,30}theory|from the perspective of|predicts that|as supporting evidence|empirical support|challenges the assumption|is explained by)\b/i } },
  { k: 'sitasi', ms: 'Bentuk sitasi untuk sintesis', en: 'Citation forms for synthesis', ket: 'Sitasi berkumpulan dalam kurungan menyatukan sumber di bawah satu idea; sitasi naratif menonjolkan pengarang dan elok digunakan berjimat.',
    e: { ms: [['... (B et al., 2021; A, 2020).', 'Sitasi berkumpulan: beberapa sumber menyokong satu ayat idea. Garis panduan tesis UPSI (16.10.2) menyusun mengikut tahun bermula yang terkini; APA 7 menyusun mengikut abjad. Pilih pada tetapan Susunan sitasi.'], ['A dan B (2020) mendapati ...', 'Naratif guna "dan"; dalam kurungan guna "&" (garis panduan tesis UPSI). Tiga pengarang atau lebih: et al.'], '... (contohnya, A, 2020; B, 2021).', '... (lihat juga A, 2020).'],
      en: [['... (A, 2020; B et al., 2021).', 'Grouped citation: several sources support one idea sentence. APA 7 orders sources alphabetically; the UPSI thesis guideline (16.10.2) orders them by year, most recent first.'], ['A and B (2020) found ...', 'Narrative uses "and"; parentheses use "&". Three or more authors: et al.'], '... (e.g., A, 2020; B, 2021).', '... (see also A, 2020).'] },
    kesan: null }
];
export const PUSTAKA_PETA = Object.fromEntries(PUSTAKA.map(p => [p.k, p]));
/* Kata kerja pelaporan mengikut sikap terhadap sumber. Pengelasan ini pengelasan kerja aplikasi (lihat NOTA_LAPOR). */
export const NOTA_LAPOR = 'Lima kumpulan ini ialah pengelasan kerja aplikasi mengikut sikap penulis terhadap sumber. Kajian kata kerja pelaporan bagi Bahasa Inggeris yang lazim dirujuk ialah Thompson dan Ye (1991) serta Hyland (1999); takrif asalnya belum disemak terus daripada artikel tersebut, dan tiada kajian tersemak tentang kata kerja pelaporan dalam tulisan akademik Bahasa Melayu ditemui. Anggaplah senarai ini sebagai panduan memilih, bukan piawaian.';
export const KATA_LAPOR = [
  { k: 'neutral', ms: 'Melapor (neutral)', en: 'Reporting (neutral)', ket: 'Menyampaikan isi sumber tanpa menilai.', e: { ms: ['menyatakan', 'melaporkan', 'menjelaskan', 'menghuraikan', 'menerangkan', 'mencatatkan', 'mengenal pasti', 'mendapati', 'menemui', 'menunjukkan', 'membincangkan', 'meneliti'], en: ['states', 'reports', 'describes', 'notes', 'identifies', 'finds', 'shows', 'examines', 'discusses', 'observes'] } },
  { k: 'tentatif', ms: 'Berhati-hati (tentatif)', en: 'Tentative', ket: 'Sumber mengemukakan kemungkinan, bukan kepastian.', e: { ms: ['mencadangkan', 'berpendapat', 'beranggapan', 'mengandaikan', 'membayangkan', 'menjangkakan'], en: ['suggests', 'proposes', 'assumes', 'hypothesises', 'implies', 'speculates'] } },
  { k: 'tegas', ms: 'Tegas', en: 'Strong', ket: 'Sumber mempertahankan dakwaannya dengan yakin.', e: { ms: ['menegaskan', 'menekankan', 'menghujahkan', 'membuktikan', 'mengesahkan', 'mempertahankan', 'merumuskan'], en: ['argues', 'asserts', 'maintains', 'demonstrates', 'establishes', 'emphasises', 'concludes'] } },
  { k: 'sokong', ms: 'Menyokong sumber lain', en: 'Supporting another source', ket: 'Menghubungkan dua sumber yang searah.', e: { ms: ['menyokong', 'mengukuhkan', 'memperkukuh', 'bersetuju dengan', 'mengesahkan dapatan'], en: ['supports', 'confirms', 'corroborates', 'reinforces', 'agrees with', 'echoes'] } },
  { k: 'kritis', ms: 'Mempersoalkan sumber lain', en: 'Questioning another source', ket: 'Menghubungkan dua sumber yang berlawanan.', e: { ms: ['mempersoalkan', 'mengkritik', 'menyangkal', 'menolak', 'meragui', 'mencabar'], en: ['questions', 'challenges', 'disputes', 'rejects', 'criticises', 'refutes'] } }
];
const RE_LAPOR = { ms: /\b(menyatakan|melaporkan|menjelaskan|menghuraikan|menerangkan|mencatatkan|mengenal pasti|mendapati|menemui|menunjukkan|membincangkan|meneliti|mencadangkan|berpendapat|beranggapan|mengandaikan|membayangkan|menjangkakan|menegaskan|menekankan|menghujahkan|membuktikan|mengesahkan|mempertahankan|merumuskan|menyokong|mengukuhkan|memperkukuh|mempersoalkan|mengkritik|menyangkal|menolak|meragui|mencabar|mentakrifkan)\b/gi, en: /\b(states?|reports?|describes?|notes?|identif(?:y|ies)|finds?|found|shows?|examines?|discusses?|observes?|suggests?|proposes?|assumes?|hypothesi[sz]es?|implies|argues?|asserts?|maintains?|demonstrates?|establish(?:es)?|emphasi[sz]es?|concludes?|supports?|confirms?|corroborates?|reinforces?|questions?|challenges?|disputes?|rejects?|critici[sz]es?|refutes?|defines?)\b/gi };

/* Bentuk yang patut dielakkan dalam Bahasa Melayu baku, dengan gantiannya. Entri bertanda dbp bersandar pada jawapan Khidmat Nasihat Bahasa DBP
   (tarikh jawapan dicatat); yang lain bersandar pada peraturan penulisan Prof Dr sendiri. */
export const ELAK = [
  { re: /\bdi kalangan\b/i, salah: 'di kalangan', betul: 'dalam kalangan', asas: 'dbp', nota: 'Jawapan DBP bertarikh 21 Januari 2012.' },
  { re: /\bpembolehubah\b/i, salah: 'pembolehubah', betul: 'pemboleh ubah', asas: 'dbp', nota: 'Dieja sebagai dua perkataan.' },
  { re: /\b(?:kesan|pengaruh|impak)\s+[^.,;]{0,60}?\bke atas\b/i, salah: 'kesan ... ke atas', betul: 'kesan ... terhadap', asas: 'dbp', nota: 'DBP memilih "terhadap" bagi sasaran sesuatu kesan atau pengaruh.' },
  { re: /\boleh kerana\b/i, salah: 'oleh kerana', betul: 'oleh sebab', asas: 'dbp', nota: 'Jawapan DBP bertarikh 20 Januari 2022: "oleh" mesti diikuti kata nama, dan "kerana" bukan kata nama.' },
  { re: /\bselain daripada itu\b/i, salah: 'selain daripada itu', betul: 'selain itu', asas: 'dbp', nota: 'Jawapan DBP bertarikh 24 Jun 2009 dan 21 Oktober 2015.' },
  { re: /\bsehubungan itu\b/i, salah: 'sehubungan itu', betul: 'sehubungan dengan itu', asas: 'dbp', nota: 'Jawapan DBP bertarikh 13 Januari 2023.' },
  { re: /\bberbanding(?!\s+dengan\b)\s+\p{L}/iu, salah: 'berbanding (tanpa dengan)', betul: 'berbanding dengan', asas: 'dbp', pesan: 'Ada "berbanding" tanpa "dengan". Apabila bermaksud dibandingkan, tulis "berbanding dengan" (jawapan DBP 26 Februari 2010 dan 15 Mac 2021).', nota: 'Apabila bermaksud dibandingkan (jawapan DBP 26 Februari 2010 dan 15 Mac 2021).' },
  { re: /(?:^|[.!?]["”’)]?\s+)Manakala\b/, salah: 'Manakala pada awal ayat', betul: '..., manakala ... (di tengah ayat selepas koma)', asas: 'dbp', pesan: 'Ada ayat bermula dengan "Manakala". Menurut DBP, "manakala" hadir di tengah ayat selepas koma dan tidak memulakan ayat (jawapan 24 Julai 2024).', nota: 'Jawapan DBP bertarikh 24 Julai 2024: "manakala" tidak memulakan ayat.' },
  { re: /\bhal ini kerana\b/i, salah: 'hal ini kerana', betul: 'hal ini dikatakan demikian kerana', asas: 'dbp', nota: 'Jawapan DBP bertarikh 28 September 2020.' },
  { re: /\bjusteru itu\b/i, salah: 'justeru itu', betul: 'justeru', asas: 'dbp', nota: 'Jawapan DBP bertarikh 23 Julai 2019.' },
  { re: /(?:^|[.!?]["”’)]?\s+)Justeru,/, salah: 'Justeru sebagai ganti "oleh itu"', betul: 'oleh itu (bagi kesimpulan); justeru hanya bagi maksud malahan atau bahkan', asas: 'dbp', aras: 'info', pesan: 'Ada ayat bermula dengan "Justeru,". Menurut DBP, "justeru" bermaksud malahan atau bahkan, bukan "oleh itu" (jawapan 28 Mei 2010 dan 21 November 2013). Jika maksudnya kesimpulan, guna "Oleh itu,".', nota: 'Jawapan DBP bertarikh 28 Mei 2010 dan 21 November 2013.' },
  { re: /\bmerujuk pada\b/i, salah: 'merujuk pada', betul: 'merujuk (terus diikuti objek)', asas: 'dbp', nota: 'Jawapan DBP bertarikh 20 Mac 2022.' },
  { re: /\bmerujuk kepada\b/i, salah: 'merujuk kepada', betul: 'merujuk (terus diikuti objek)', asas: 'dbp', aras: 'info', pesan: '"merujuk kepada": jawapan DBP pada 2026 (25 Mei, 1 Ogos dan 17 Ogos) menetapkan "merujuk" diikuti objeknya secara langsung; jawapan 20 Mac 2022 masih menerima "merujuk kepada". Bentuk yang lebih selamat dalam tesis ialah "merujuk" tanpa "kepada".', nota: 'Jawapan DBP 2026 berbeza daripada jawapan 20 Mac 2022 yang masih menerimanya.' },
  { re: /\bselaras daripada\b/i, salah: 'selaras daripada', betul: 'selaras dengan', asas: 'dbp', nota: 'Jawapan DBP bertarikh 15 Julai 2021.' },
  { re: /\bdisamping itu\b/i, salah: 'disamping itu', betul: 'di samping itu', asas: 'dbp', nota: 'Jawapan DBP bertarikh 2 Mei 2023.' },
  { re: /\bwalaubag[a]?imanapun\b/i, salah: 'walaubagaimanapun', betul: 'walau bagaimanapun', asas: 'dbp', nota: 'Jawapan DBP bertarikh 12 Januari 2017 dan 2 Januari 2025.' },
  { re: /\bianya\b/i, salah: 'ianya', betul: 'ia', asas: 'gaya', nota: 'Peraturan penulisan Prof Dr sendiri.' },
  { re: /\bberdasarkan kepada\b/i, salah: 'berdasarkan kepada', betul: 'berdasarkan', asas: 'gaya', nota: 'Peraturan penulisan Prof Dr sendiri.' },
  { re: /\badalah merupakan\b/i, salah: 'adalah merupakan', betul: 'ialah atau merupakan (pilih satu)', asas: 'gaya', nota: 'Peraturan penulisan Prof Dr sendiri.' }
];

/* Kesan fungsi wacana dalam satu teks. Pulangan: { kategori: { k: bilangan }, frasa: [{ k, frasa }], lapor: [kata] } */
export function cariPenanda(teks, bhs) {
  const s = String(teks || ''); const b = bhs === 'en' ? 'en' : 'ms'; const kategori = {}; const frasa = [];
  PUSTAKA.forEach(p => { if (!p.kesan) return; const re = new RegExp(p.kesan[b].source, 'gi'); let m, n = 0; while ((m = re.exec(s))) { n++; if (frasa.length < 40) frasa.push({ k: p.k, frasa: m[0].toLowerCase() }); if (m.index === re.lastIndex) re.lastIndex++; } if (n) kategori[p.k] = n; });
  const lapor = Array.from(new Set((s.match(RE_LAPOR[b]) || []).map(x => x.toLowerCase())));
  return { kategori, frasa, lapor };
}

/* ---- pengesan gaya: laporan (berpusatkan pengarang) lawan sintesis (berpusatkan idea). Petunjuk kasar tanpa token, bukan penghakiman.
   Pulangan: { cukup, skor 0..100, gaya: 'laporan' | 'separa' | 'sintesis' | '', ukur: {...}, bukti: [teks], ayat: [{ t, sumber, mula, penanda }] } ---- */
const RE_MULA = /^(?:["'“(]\s*)?(?:(?:menurut|bagi|kajian(?:\s+oleh)?|dapatan(?:\s+kajian)?(?:\s+oleh)?|dalam\s+kajian(?:nya)?(?:\s+oleh)?|according\s+to|in(?:\s+a\s+study\s+by)?|a\s+study\s+by|research\s+by)\s+)?[A-ZÀ-ɏ][\p{L}'’.-]+(?:\s+(?:et\s+al\.?|dan\s+rakan-rakan|dan|and|&|bin|binti|[A-ZÀ-ɏ][\p{L}'’.-]+)){0,6},?\s*\((?:1[89]|20)\d{2}/iu;
const SEPADU = ['sama', 'beza', 'syarat', 'kumpul', 'teori'], TAFSIR = ['sebab', 'pendirian', 'nilai', 'jurang'];
export function kesanGaya(teks, o) {
  o = o || {}; const bhs = o.bahasa === 'en' ? 'en' : (o.bahasa === 'ms' ? 'ms' : (bahasaTeks(teks) || 'ms'));
  const ay = pecahAyat(teks).map(t => { const sit = kesanSitasi(t); const kunci = Array.from(new Set(sit.map(c => c.kunci).filter(Boolean))); const pn = cariPenanda(t, bhs); return { t, sumber: kunci, mula: RE_MULA.test(t.trim()) || /^(?:menurut|according to)\b/i.test(t.trim()), naratif: sit.filter(c => c.bentuk === 'naratif').length, penanda: Object.keys(pn.kategori) }; });
  const nA = ay.length; const bersit = ay.filter(a => a.sumber.length); const unik = new Set(); ay.forEach(a => a.sumber.forEach(k => unik.add(k)));
  if (nA < 2 || !bersit.length) return { cukup: false, skor: 0, gaya: '', ukur: { ayat: nA, bersitasi: bersit.length, sumber: unik.size }, bukti: [nA < 2 ? 'Tulis sekurang-kurangnya dua ayat untuk dinilai.' : 'Belum ada sitasi dalam tulisan ini. Sintesis mesti menunjukkan sumber setiap dakwaan.'], ayat: ay };
  const satu = bersit.filter(a => a.sumber.length === 1).length, ramai = bersit.filter(a => a.sumber.length >= 2).length, mula = ay.filter(a => a.mula).length, tanpa = ay.filter(a => !a.sumber.length);
  const sepadu = ay.filter(a => a.penanda.some(k => SEPADU.includes(k))).length; const tafsir = tanpa.filter(a => a.penanda.some(k => TAFSIR.includes(k))).length;
  /* blok sumber: adakah setiap sumber hanya muncul dalam satu rangkaian ayat berturutan (A A B B) tanpa bertemu sumber lain */
  let blok = unik.size >= 2 && ramai === 0; if (blok) { const urut = bersit.map(a => a.sumber[0]); const lihat = new Set(); let lepas = null; urut.forEach(k => { if (k !== lepas) { if (lihat.has(k)) blok = false; lihat.add(k); lepas = k; } }); }
  let skor = 50; skor += Math.round((ramai / bersit.length) * 30); skor += Math.min(sepadu, 2) * 10; skor += tafsir ? 10 : (tanpa.length ? 4 : 0);
  skor -= Math.round((mula / nA) * 30); if (unik.size >= 2 && ramai === 0) skor -= 20; if (blok) skor -= 10; if (unik.size < 2) skor -= 15;
  skor = Math.max(0, Math.min(100, skor)); const gaya = skor >= 70 ? 'sintesis' : skor >= 40 ? 'separa' : 'laporan'; const bukti = [];
  if (mula) bukti.push(mula + ' daripada ' + nA + ' ayat bermula dengan nama pengarang: susunan berpusatkan pengarang.' + (mula / nA >= 0.5 ? ' Cuba mulakan ayat dengan idea, dan pindahkan pengarang ke dalam kurungan.' : ''));
  if (unik.size < 2) bukti.push('Hanya satu sumber disitasi. Sintesis memerlukan sekurang-kurangnya dua sumber yang dipertemukan.');
  else if (!ramai) bukti.push('Tiada ayat yang menggabungkan dua sumber atau lebih. Satukan sumber yang menyokong idea yang sama dalam satu ayat dengan sitasi berkumpulan.');
  else bukti.push(ramai + ' ayat menggabungkan dua sumber atau lebih.');
  if (!sepadu) bukti.push('Tiada penanda perbandingan atau pengumpulan (contohnya selari dengan, sebaliknya, manakala, beberapa kajian). Hubungan antara sumber belum dinyatakan.'); else bukti.push(sepadu + ' ayat menyatakan hubungan antara sumber (persamaan, perbezaan, syarat atau pengumpulan).');
  if (!tanpa.length) bukti.push('Tiada ayat suara penulis. Tambah satu ayat tafsiran: apa makna persamaan atau perbezaan itu bagi perbincangan.'); else if (!tafsir) bukti.push('Ada ' + tanpa.length + ' ayat tanpa sitasi, tetapi tiada yang jelas mentafsir (contohnya oleh itu, hal ini berpunca daripada, pada hemat pengkaji).'); else bukti.push(tafsir + ' ayat tafsiran penulis dikesan.');
  if (blok) bukti.push('Sumber muncul berblok (semua ayat sumber pertama, kemudian semua ayat sumber kedua). Itulah corak laporan.');
  return { cukup: true, skor, gaya, bahasa: bhs, ukur: { ayat: nA, bersitasi: bersit.length, satu, ramai, mula, tanpaSitasi: tanpa.length, sepadu, tafsir, sumber: unik.size, blok }, bukti, ayat: ay };
}

/* ---- semakan bahasa dan sitasi atas tulisan pengguna (tanpa token). o: { bahasa, larang, frasa, bahan, contoh } ---- */
export function semakTeks(teks, o) {
  o = o || {}; const s = String(teks || ''); const out = []; if (!s.trim()) return out; const bhs = o.bahasa === 'en' ? 'en' : 'ms'; const kecil = s.toLowerCase();
  if (/[—–―]/.test(s)) out.push({ aras: 'amaran', teks: 'Ada tanda sempang panjang. Gantikan dengan koma, "iaitu" atau "hingga".' });
  const larang = String(o.larang || '').split(/[,;]/).map(x => x.trim().toLowerCase()).filter(Boolean).filter(w => new RegExp('(^|[^\\p{L}])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u').test(kecil));
  if (larang.length) out.push({ aras: 'amaran', teks: 'Istilah yang Prof Dr larang: ' + Array.from(new Set(larang)).join(', ') + '.' });
  const frasa = String(o.frasa || '').split(';').map(x => x.trim().toLowerCase()).filter(Boolean).filter(f => kecil.includes(f));
  if (frasa.length) out.push({ aras: 'amaran', teks: 'Frasa klise yang patut dielakkan: ' + frasa.join('; ') + '.' });
  if (bhs === 'ms') {
    ELAK.forEach(e => { if (e.re.test(s)) out.push({ aras: e.aras || 'amaran', teks: e.pesan || ('"' + e.salah + '" patut ditulis "' + e.betul + '".' + (e.nota ? ' ' + e.nota : '')) }); });
    if (/\bantara\b[^.;,]{2,70}?\bdan\b/i.test(s) && !/\bantara\b[^.;]{2,70}?,[^.;]{2,60}?\bdan\b/i.test(s)) out.push({ aras: 'info', teks: 'Bagi dua perkara, pasangan yang betul ialah "antara ... dengan ...".' });
    if (/\bdi mana\b/i.test(s)) out.push({ aras: 'info', teks: '"di mana" sebagai kata hubung patut diganti dengan "yang", "iaitu" atau dipecahkan kepada dua ayat.' });
    if (bahasaTeks(s) === 'en') out.push({ aras: 'info', teks: 'Tulisan ini kelihatan dalam Bahasa Inggeris sedangkan bahasa hasil ialah Bahasa Melayu.' });
  } else if (bahasaTeks(s) === 'ms') out.push({ aras: 'info', teks: 'Tulisan ini kelihatan dalam Bahasa Melayu sedangkan bahasa hasil ialah Bahasa Inggeris.' });
  const ay = pecahAyat(s); const mula = {}; ay.forEach(a => { const k = a.trim().toLowerCase().split(/[\s,]+/).slice(0, 2).join(' '); mula[k] = (mula[k] || 0) + 1; });
  Object.keys(mula).forEach(k => { if (mula[k] >= 3 && k.length > 4) out.push({ aras: 'info', teks: mula[k] + ' ayat bermula dengan "' + k + '". Pelbagaikan pembuka ayat.' }); });
  const pj = ay.map(patah).filter(Boolean); if (pj.length >= 4) { const mx = Math.max(...pj), mn = Math.min(...pj); if (mx - mn <= 4) out.push({ aras: 'info', teks: 'Semua ayat hampir sama panjang (' + mn + ' hingga ' + mx + ' patah perkataan). Selang-selikan ayat pendek dengan ayat sederhana.' }); if (mx > 43) out.push({ aras: 'info', teks: 'Ada ayat sepanjang ' + mx + ' patah perkataan. Pecahkan ayat yang melebihi kira-kira 43 patah perkataan.' }); }
  if (o.bahan) {
    const sah = new Map(); (o.bahan || []).forEach(b => { if (b && !b.saya) { const k = kunciSumber(b.pengarang, b.tahun); if (k) sah.set(k, b); } });
    const sit = kesanSitasi(s); const guna = new Set(sit.map(c => c.kunci)); const asing = []; sit.forEach(c => { if (c.kunci && !sah.has(c.kunci) && !asing.some(x => x.kunci === c.kunci)) asing.push(c); });
    if (asing.length) out.push({ aras: 'halang', teks: 'Sitasi yang tiada dalam bahan: ' + asing.map(c => c.pengarang + ' (' + c.tahun + ')').join('; ') + '. Tambah ayat sumber itu ke dalam bahan, atau buang sitasinya.' });
    const tinggal = Array.from(sah.keys()).filter(k => !guna.has(k)); if (tinggal.length && sit.length) out.push({ aras: 'info', teks: 'Sumber dalam bahan yang belum disitasi: ' + tinggal.map(k => { const b = sah.get(k); return b.pengarang + ' (' + b.tahun + ')'; }).join('; ') + '.' });
    const rapat = (o.bahan || []).map(b => ({ b, t: tindih(s, b.teks, 5) })).filter(x => x.t.cukup && x.t.larian >= 8);
    if (rapat.length) out.push({ aras: 'amaran', teks: 'Rangkaian ' + Math.max(...rapat.map(x => x.t.larian)) + ' patah perkataan berturutan sama dengan ayat sumber (' + rapat.map(x => x.b.saya ? 'Dapatan saya' : x.b.pengarang).join('; ') + '). Itu tulisan tampalan: ubah struktur ayat, atau jadikan petikan langsung bertanda petik.' });
  }
  if (o.susunan) { const ss = semakSusunan(s, o.susunan); if (ss.length) out.push({ aras: 'info', teks: 'Susunan sitasi berkumpulan ' + ss[0].asal + ': ' + (o.susunan === 'apa' ? 'APA 7 menyusun mengikut abjad' : 'garis panduan tesis UPSI (16.10.2) menyusun mengikut tahun bermula yang terkini') + ', iaitu ' + ss[0].cadang + '.' + (ss.length > 1 ? ' Ada ' + (ss.length - 1) + ' kurungan lain yang serupa.' : '') }); }
  if (o.contoh) { const t = tindih(s, o.contoh, 4); if (t.cukup && (t.peratus >= 45 || t.larian >= 12)) out.push({ aras: 'amaran', teks: 'Tulisan ini masih terlalu hampir dengan contoh pembantu (' + t.peratus + '% rangkaian empat patah perkataan sama; larian terpanjang ' + t.larian + '). Tutup contoh dan tulis semula daripada peta idea.' }); }
  return out;
}

/* ---- susunan sitasi berkumpulan dalam satu kurungan. gaya: 'upsi' (tahun terkini dahulu, garis panduan tesis UPSI 16.10.2) atau 'apa' (abjad, APA 7).
   Pulangan: senarai kurungan yang tidak mengikut susunan itu: [{ asal, cadang }] ---- */
export function semakSusunan(teks, gaya) {
  const out = []; const re = /\(([^()]{6,400})\)/g; let m;
  while ((m = re.exec(String(teks || '')))) {
    const am = /^((?:contohnya|misalnya|lihat juga|lihat|e\.g\.|see also|see|cf\.),?\s*)/i.exec(m[1]); const awal = am ? am[1] : '';
    const bhg = m[1].slice(awal.length).split(';').map(x => x.trim()).filter(Boolean); if (bhg.length < 2) continue;
    const butir = bhg.map(b => { const y = /((?:1[89]|20)\d{2})[a-z]?\s*(?:,\s*(?:m\.?\s?s\.?|hlm\.?|pp?\.?)[^;]*)?$/i.exec(b); return y ? { asal: b, nama: b.toLowerCase(), tahun: +y[1] } : null; });
    if (butir.some(x => !x)) continue;
    const sama = gaya === 'apa' ? butir.every((x, i) => i === 0 || butir[i - 1].nama.localeCompare(x.nama) <= 0) : butir.every((x, i) => i === 0 || butir[i - 1].tahun >= x.tahun);
    if (sama) continue;
    const susun = butir.slice().sort((a, b) => (gaya === 'apa' ? a.nama.localeCompare(b.nama) || a.tahun - b.tahun : b.tahun - a.tahun || a.nama.localeCompare(b.nama)));
    out.push({ asal: '(' + m[1] + ')', cadang: '(' + awal + susun.map(x => x.asal).join('; ') + ')' });
  }
  return out;
}

/* ---- cadangan tahap bantuan daripada rekod kemajuan. maju: { semak: [{ masa, tahap, gaya, skor, tindih }] } ---- */
export function cadangTahap(maju) {
  const sm = ((maju && maju.semak) || []).slice().sort((a, b) => (a.masa || 0) - (b.masa || 0)); const baik = x => (x.gaya === 'sintesis' || (x.gaya !== 'laporan' && (x.skor || 0) >= 70)) && (x.tindih == null || x.tindih < 45);
  const di = n => sm.filter(x => x.tahap === n); const lulus = n => di(n).filter(baik).length; let tahap = 1, sebab = 'Mulakan dengan contoh penuh: baca, perhatikan gerakan ayat, kemudian tulis semula dengan ayat sendiri dan minta semakan.';
  if (lulus(1) >= 3) { tahap = 2; sebab = 'Tiga tulisan di Tahap 1 telah dinilai sebagai sintesis tanpa bergantung pada ayat contoh. Cuba Tahap 2: lengkapkan rangka tanpa contoh penuh.'; }
  if (lulus(2) >= 3) { tahap = 3; sebab = 'Tiga tulisan di Tahap 2 telah dinilai sebagai sintesis. Cuba Tahap 3: tulis dahulu, kemudian minta semakan sahaja.'; }
  const akhir = sm.slice(-2); if (tahap > 1 && akhir.length === 2 && akhir.every(x => x.tahap === tahap && x.gaya === 'laporan')) { tahap -= 1; sebab = 'Dua semakan terakhir masih bercorak laporan. Turun satu tahap buat sementara untuk melihat semula gerakan ayatnya.'; }
  return { tahap, sebab, lulus: { 1: lulus(1), 2: lulus(2), 3: lulus(3) }, bil: { 1: di(1).length, 2: di(2).length, 3: di(3).length } };
}

/* ---- asas bukti. Setiap sumber berDOI dipadankan dengan rekod Crossref pada 11 November 2026; laman rasmi dibuka pada tarikh yang sama.
   baca: sejauh mana sumber itu dibaca semasa menyediakan peraturan ('teks penuh', 'abstrak' atau 'laman rasmi'). ---- */
const S_ = (pendek, ruj, url, baca) => ({ pendek, ruj, url, baca });
export const SUMBER = {
  webster: S_('Webster dan Watson (2002)', 'Webster, J., & Watson, R. T. (2002). Analyzing the past to prepare for the future: Writing a literature review. MIS Quarterly, 26(2), xiii-xxiii.', 'https://doi.org/10.2307/4132319', 'teks penuh melalui ringkasan alat'),
  boote: S_('Boote dan Beile (2005)', 'Boote, D. N., & Beile, P. (2005). Scholars before researchers: On the centrality of the dissertation literature review in research preparation. Educational Researcher, 34(6), 3-15.', 'https://doi.org/10.3102/0013189X034006003', 'teks penuh'),
  torraco: S_('Torraco (2005)', 'Torraco, R. J. (2005). Writing integrative literature reviews: Guidelines and examples. Human Resource Development Review, 4(3), 356-367.', 'https://doi.org/10.1177/1534484305278283', 'abstrak'),
  spivey: S_('Spivey (1990)', 'Spivey, N. N. (1990). Transforming texts: Constructive processes in reading and writing. Written Communication, 7(2), 256-287.', 'https://doi.org/10.1177/0741088390007002004', 'abstrak'),
  holbrook: S_('Holbrook et al. (2007)', 'Holbrook, A., Bourke, S., Fairbairn, H., & Lovat, T. (2007). Examiner comment on the literature review in Ph.D. theses. Studies in Higher Education, 32(3), 337-356.', 'https://doi.org/10.1080/03075070701346899', 'abstrak'),
  hei: S_('Hei dan David (2015)', 'Hei, K. C., & David, M. K. (2015). Basic and advanced skills they don\'t have: The case of postgraduate and literature review writing. Malaysian Journal of Learning and Instruction, 12, 131-150.', 'https://doi.org/10.32890/mjli2015.12.7', 'abstrak'),
  ockenburg: S_('van Ockenburg et al. (2019)', 'van Ockenburg, L., van Weijen, D., & Rijlaarsdam, G. (2019). Learning to write synthesis texts in secondary education: A review of intervention studies. Journal of Writing Research, 10(3), 401-428.', 'https://doi.org/10.17239/jowr-2019.10.03.01', 'teks penuh'),
  barzilai: S_('Barzilai et al. (2018)', 'Barzilai, S., Zohar, A. R., & Mor-Hagani, S. (2018). Promoting integration of multiple texts: A review of instructional approaches and practices. Educational Psychology Review, 30(3), 973-999.', 'https://doi.org/10.1007/s10648-018-9436-8', 'abstrak'),
  luo: S_('Luo dan Kiewra (2019)', 'Luo, L., & Kiewra, K. (2019). Soaring to successful synthesis writing. Journal of Writing Research, 11(1), 163-209.', 'https://doi.org/10.17239/jowr-2019.11.01.06', 'teks penuh'),
  renkl: S_('Renkl dan Atkinson (2003)', 'Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition: A cognitive load perspective. Educational Psychologist, 38(1), 15-22.', 'https://doi.org/10.1207/S15326985EP3801_3', 'abstrak'),
  atkinson: S_('Atkinson et al. (2003)', 'Atkinson, R. K., Renkl, A., & Merrill, M. M. (2003). Transitioning from studying examples to solving problems: Effects of self-explanation prompts and fading worked-out steps. Journal of Educational Psychology, 95(4), 774-783.', 'https://doi.org/10.1037/0022-0663.95.4.774', 'abstrak'),
  merrienboer: S_('van Merriënboer (1990)', 'van Merriënboer, J. J. G. (1990). Strategies for programming instruction in high school: Program completion vs. program generation. Journal of Educational Computing Research, 6(3), 265-285.', 'https://doi.org/10.2190/4NK5-17L7-TWQV-1EHL', 'abstrak'),
  kalyuga: S_('Kalyuga et al. (2003)', 'Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. Educational Psychologist, 38(1), 23-31.', 'https://doi.org/10.1207/S15326985EP3801_4', 'abstrak'),
  belland: S_('Belland et al. (2017)', 'Belland, B. R., Walker, A. E., Kim, N. J., & Lefler, M. (2017). Synthesizing results from empirical research on computer-based scaffolding in STEM education: A meta-analysis. Review of Educational Research, 87(2), 309-344.', 'https://doi.org/10.3102/0034654316670999', 'abstrak'),
  bastani: S_('Bastani et al. (2025)', 'Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26), Article e2422633122.', 'https://doi.org/10.1073/pnas.2422633122', 'abstrak; notis pembetulan penerbit bertarikh 20 Ogos 2025 belum dibaca'),
  vandermeulen: S_('Vandermeulen et al. (2023)', 'Vandermeulen, N., Van Steendam, E., De Maeyer, S., & Rijlaarsdam, G. (2023). Writing process feedback based on keystroke logging and comparison with exemplars: Effects on the quality and process of synthesis texts. Written Communication, 40(1), 90-144.', 'https://doi.org/10.1177/07410883221127998', 'abstrak'),
  michiels: S_('Michiels et al. (2023)', 'Michiels, P., Kessler, K., & Rogers, P. (2023). Paraphrase patterns of expert academic writers: Implications for writing development, writing pedagogy, and plagiarism policies. Literatura y Lingüística, (46), 153-189.', 'https://doi.org/10.29344/0717621X.46.3133', 'abstrak'),
  mansourizadeh: S_('Mansourizadeh dan Ahmad (2011)', 'Mansourizadeh, K., & Ahmad, U. K. (2011). Citation practices among non-native expert and novice scientific writers. Journal of English for Academic Purposes, 10(3), 152-161.', 'https://doi.org/10.1016/j.jeap.2011.03.004', 'abstrak'),
  petric: S_('Petrić (2007)', 'Petrić, B. (2007). Rhetorical functions of citations in high- and low-rated master\'s theses. Journal of English for Academic Purposes, 6(3), 238-253.', 'https://doi.org/10.1016/j.jeap.2007.09.002', 'abstrak'),
  dbp: S_('Dewan Bahasa dan Pustaka (t.t.)', 'Dewan Bahasa dan Pustaka. (t.t.). Khidmat Nasihat Bahasa [jawapan tentang kata hubung dan penanda wacana; tarikh setiap jawapan dicatat pada entri berkenaan]. Pusat Rujukan Persuratan Melayu. Dicapai pada 11 November 2026.', 'https://prpm.dbp.gov.my/Cari1?keyword=penanda+wacana&d=175768&', 'laman rasmi'),
  upsi: S_('Universiti Pendidikan Sultan Idris (2024)', 'Universiti Pendidikan Sultan Idris. (2024). Garis panduan penulisan tesis/disertasi (diluluskan Senat Bil. 5/2023 pada 16 Mei 2023; dikemas kini November 2024).', 'https://postgrad.upsi.edu.my/thesis/1-1_TesisMalay.pdf', 'laman rasmi')
};
/* Peraturan menu Sintesis dan sandarannya. kuat: jenis dan kekuatan bukti, dinyatakan terus terang. */
export const ASAS = [
  { t: 'Sintesis disusun mengikut idea, bukan mengikut pengarang. Perenggan yang berjalan satu sumber demi satu sumber tidak mensintesis literatur; sebab itu pembantu memulakan perenggan dengan ayat tuntutan dan pengesan gaya mengira ayat yang bermula dengan nama pengarang.', kuat: 'panduan metodologi', s: ['webster'] },
  { t: 'Perenggan sintesis mengandungi ayat penulis yang menghubungkan sumber dan menyatakan sesuatu yang tidak dinyatakan oleh mana-mana sumber secara bersendirian: kekaburan takrif yang diselesaikan, hubungan antara pemboleh ubah, atau perspektif baharu. Sebab itu setiap contoh memuatkan ayat tafsiran tanpa sitasi.', kuat: 'rubrik penilaian dan abstrak kajian', s: ['boote', 'torraco', 'spivey'] },
  { t: 'Kelemahan ini lazim, bukan kelemahan peribadi. Dalam sampel disertasi yang dinilai oleh Boote dan Beile, kriteria mensintesis dan memberi perspektif baharu mendapat min terendah (1.42). Pemeriksa tesis PhD di lima universiti Australia mencari penilaian kritis dan kaitan literatur dengan dapatan, dan pelajar pascasiswazah di sebuah universiti awam Malaysia melaporkan kesukaran mensintesis.', kuat: 'kajian deskriptif', s: ['boote', 'holbrook', 'hei'] },
  { t: 'Tiga proses dilatih bersama: memilih, menyusun dan menghubungkan. Menu ini memisahkannya kepada kanvas BAHAN (memilih), peta idea (menyusun) dan hubungan antara sumber (menghubungkan).', kuat: 'ulasan sistematik 16 kajian intervensi, daripada Gred 6 hingga prasiswazah', s: ['spivey', 'ockenburg', 'barzilai'] },
  { t: 'Peta idea mendahului penulisan. Latihan matriks menaikkan susunan mengikut kategori daripada 14% kepada 49% dalam satu eksperimen (kumpulan kawalan 14% kepada 16%), tetapi tidak menambah ayat penghubung antara sumber. Sebab itu hubungan antara sumber ditunjukkan dan dilatih secara berasingan.', kuat: 'dua eksperimen dengan pelajar kolej (32 dan 116 orang)', s: ['luo'] },
  { t: 'Tangga bantuan bermula dengan contoh penuh, beralih kepada rangka untuk dilengkapkan, kemudian menulis sendiri. Prinsip ini datang daripada kajian contoh kerja dan pengurangan bantuan dalam matematik dan pengaturcaraan. Satu meta-analisis perancah berkomputer tidak menemui kesan purata yang berbeza apabila bantuan dikurangkan, maka tangga ini pilihan reka bentuk yang munasabah, bukan dapatan yang terbukti bagi penulisan. Syarat tiga tulisan lulus untuk naik tahap ialah ketetapan aplikasi.', kuat: 'sederhana pada prinsip, lemah bagi penulisan', s: ['renkl', 'atkinson', 'merrienboer', 'kalyuga', 'belland'] },
  { t: 'Ramalan dahulu, bantuan kemudian. Pelajar yang diminta menamakan prinsip di sebalik setiap langkah contoh menunjukkan pemindahan yang lebih baik; sebab itu ruang Ramalan saya meminta Prof Dr meneka hubungan antara sumber sebelum melihat dapatan pembantu.', kuat: 'dua eksperimen dalam domain lain; abstrak sahaja dibaca', s: ['atkinson'] },
  { t: 'Pembantu melatih, bukan menulis bagi pihak Prof Dr. Dalam eksperimen lapangan matematik sekolah menengah, murid yang menggunakan sembang AI biasa mendapat gred latihan 48% lebih tinggi, tetapi selepas alat itu ditarik balik skor mereka 17% lebih rendah berbanding dengan murid yang tidak pernah menggunakannya. Tutor AI yang direka untuk melindungi pembelajaran, iaitu memberi pembayang dan bukan jawapan, hampir menghapuskan kesan buruk itu. Sebab itu contoh mesti ditulis semula, dan Tahap 3 hanya memberi maklum balas. Angka ini diambil daripada abstrak; artikel itu mempunyai notis pembetulan penerbit yang kandungannya belum dibaca.', kuat: 'eksperimen lapangan besar, tetapi matematik dan bukan penulisan', s: ['bastani'] },
  { t: 'Maklum balas diberi atas tulisan sendiri, dengan contoh untuk dibandingkan selepas mencuba. Maklum balas proses yang disertai teladan menaikkan mutu teks sintesis murid Gred 10.', kuat: 'kajian dengan 65 murid Gred 10, dibandingkan dengan garis asas kebangsaan', s: ['vandermeulen'] },
  { t: 'Parafrasa disemak pada rangkaian perkataan yang panjang, bukan pada satu skor persamaan, dan sifar pertindihan bukan sasaran: parafrasa penulis pakar sendiri mengekalkan kira-kira 27% bahasa sumber dalam satu analisis 233 pasangan petikan.', kuat: 'kajian deskriptif', s: ['michiels'] },
  { t: 'Bahan disemak sebelum disintesis. Amaran diberi apabila istilah yang sama membawa takrif berlainan, unit analisis berbeza, atau kaedah yang berbeza boleh menjelaskan perbezaan dapatan. Amaran tentang populasi, konteks dan reka bentuk yang berbeza ialah lanjutan logik yang sama dan merupakan ketetapan aplikasi.', kuat: 'rubrik penilaian dan panduan metodologi', s: ['boote', 'webster'] },
  { t: 'Atribusi satu sumber demi satu sumber ialah corak penulis baharu. Dalam 14 kertas penulis bukan penutur jati di sebuah universiti Malaysia, penulis baharu kebanyakannya mengatribusi dan memetik sumber secara bersendirian, manakala penulis pakar menggabungkan beberapa sumber dan lebih kerap menggunakan sitasi dalam kurungan. Tesis sarjana bergred rendah juga kurang menggunakan sitasi untuk menilai dan menghubungkan sumber.', kuat: 'dua kajian deskriptif kecil; abstrak sahaja dibaca', s: ['mansourizadeh', 'petric'] },
  { t: 'Bentuk Bahasa Melayu dalam Pustaka dan senarai Bentuk dielakkan bersandar pada jawapan Khidmat Nasihat Bahasa Dewan Bahasa dan Pustaka, dengan tarikh jawapan dicatat. Jawapan DBP kadangkala berubah mengikut masa; apabila berbeza, jawapan yang lebih baharu diutamakan dan perbezaannya dinyatakan. Rangka ayat dalam Pustaka ditulis sendiri untuk aplikasi ini, dan pengelasan kata kerja pelaporan Melayu ialah pengelasan kerja aplikasi.', kuat: 'rujukan rasmi bahasa', s: ['dbp'] },
  { t: 'Sitasi naratif menggunakan "dan", sitasi dalam kurungan menggunakan "&". Bagi beberapa sumber dalam satu kurungan, garis panduan tesis UPSI (16.10.2) menyusun mengikut tahun bermula yang terkini, sedangkan APA 7 menyusun mengikut abjad; pilih pada tetapan Susunan sitasi dan sahkan dengan penyelia.', kuat: 'garis panduan universiti', s: ['upsi'] },
  { t: 'Had bukti: tiada kajian yang ditemui menguji reka bentuk ini (contoh daripada model diikuti parafrasa oleh pelajar) dalam kalangan calon kedoktoran atau dalam Bahasa Melayu. Ukuran kemajuan yang paling boleh dipercayai ialah tulisan Tahap 3 dan penilaian penyelia, bukan skor pengesan gaya.', kuat: 'had', s: [] }
];
