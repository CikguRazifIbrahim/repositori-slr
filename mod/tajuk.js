/* Pembantu Tajuk (menu Artikel). Selepas jenis artikel dipilih, pemilik menulis pembayang tajuk: teks bebas dan soalan pandu mengikut
   jenis artikel (pemboleh ubah, populasi, konteks, reka bentuk, jurang). Agen mencadangkan tiga atau lima tajuk yang berbeza polanya dan
   memaparkannya dalam tetingkap timbul; klik satu cadangan mengisi medan Tajuk artikel yang rasmi, dan medan itu kekal boleh disunting
   bila-bila masa. Agen tidak pernah mengisi medan Tajuk tanpa klik pemilik. Meter Semakan tajuk (tanpa agen, tanpa kos) menyemak tajuk
   rasmi setiap kali ia berubah: panjang, penanda jenis kajian, pemboleh ubah, singkatan, kata pengisi dan gaya. Peraturan dan pola tajuk
   (tajuk-data.js) berasaskan garis panduan pelaporan dan kajian tentang ciri tajuk, setiap satu dengan sumbernya. Simpanan:
   meta/tajuk_<id> (pembayang, jawapan, sesi cadangan, pilihan, tajuk terdahulu, token), berserta salinan tempatan. */
import * as TD from './tajuk-data.js';
import { GAYA_LALAI } from './pandu-data.js';

export function initTajuk(R, C) {
  const { $, esc, toast } = R; const { A } = C; const Bd = () => R.Banding;
  const T = { id: null, d: null, busy: false, timers: {}, awan: {}, fokus: 'bebas' };
  const HAD_SESI = 6, HAD_LAMA = 6, HAD_SOALAN = 3;
  const kunci = id => 'meta/tajuk_' + id, ls = id => 'rslr_tajuk_' + id, lsBuka = id => 'rslr_tajuk_buka_' + id;
  const angka = n => Number(n || 0).toLocaleString('en-US');
  const anggarToken = t => Math.round(String(t || '').length / 3.6);
  const idBaru = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const kosong = () => ({ v: 1, bebas: '', medan: {}, jawab: {}, bil: 3, bahasa: '', huruf: 'tajuk', padanan: null, sesi: [], lama: [], pilih: null, token: { masuk: 0, keluar: 0, panggil: 0 }, masa: 0 });

  /* ---- simpanan ---- */
  function muat(id) {
    if (T.id === id && T.d) return T.d;
    T.id = id; T.d = Object.assign(kosong(), R.lsGet(ls(id), null) || {}); T.buka = R.lsGet(lsBuka(id), null); T.fokus = 'bebas'; muatAwan(id); return T.d;
  }
  async function muatAwan(id) {
    if (T.awan[id]) return; T.awan[id] = true;
    try { const a = await R.db().get(kunci(id)); if (a && T.id === id && (a.masa || 0) > (T.d.masa || 0)) { T.d = Object.assign(kosong(), a); R.lsSet(ls(id), T.d); const aktif = document.activeElement; if (!(aktif && aktif.closest && aktif.closest('.tj-panel'))) render(); } } catch (e) {}
  }
  function simpan(segera) {
    if (!T.id || !T.d) return; T.d.masa = Date.now(); R.lsSet(ls(T.id), T.d); const id = T.id, data = T.d; clearTimeout(T.timers.s);
    T.timers.s = setTimeout(async () => { try { await R.db().set(kunci(id), data); } catch (e) { console.warn('tajuk: simpanan awan gagal', e); } }, segera ? 0 : 900);
  }

  /* ---- konteks artikel ---- */
  const jenis = () => (C.doc() || {}).jenis || '';
  const kel = () => TD.keluargaTajuk(jenis());
  const tP = () => { const P = C.Pandu && C.Pandu.state; return P && P.id === A.id && P.t ? P.t : (R.lsGet('rslr_pandu_' + A.id, null) || {}); };
  const bahasa = () => (T.d && T.d.bahasa) || (tP().bahasa === 'en' ? 'en' : 'ms');
  const namaBahasa = b => (b === 'en' ? 'Bahasa Inggeris' : 'Bahasa Melayu Malaysia');
  const aras = () => (tP().aras === 'scopus' ? 'scopus' : 'mycite');
  const gaya = () => { try { return C.Pandu ? C.Pandu.gaya() : GAYA_LALAI; } catch (e) { return GAYA_LALAI; } };
  const pvPandu = () => (tP().pemboleh || []).filter(v => v && v.nama);
  const tajukSemasa = () => String((C.entri(A.id) || {}).tajuk || '').trim();
  const tajukSah = t => !!t && !/^artikel tanpa tajuk$/i.test(t);
  const mahuPadanan = () => bahasa() === 'ms' && T.d.padanan !== false;
  const terbuka = () => T.buka === true || (T.buka == null && !!jenis() && !T.d.pilih);
  const semak = (t, bhs) => TD.semakTajuk(t, { jenis: jenis(), bahasa: bhs || bahasa(), larang: gaya().larang, medan: T.d ? T.d.medan : {}, pv: pvPandu() });
  const bersihTajuk = s => { let t = String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^["'\u201C\u201D\u2018\u2019]+|["'\u201C\u201D\u2018\u2019]+$/g, '').trim(); t = t.replace(/\s*[\u2014\u2013\u2015]\s*/g, t.includes(':') ? ', ' : ': '); return t.replace(/\.$/, '').trim(); };
  const bersihTeks = s => String(s == null ? '' : s).replace(/\s*[\u2014\u2013\u2015]\s*/g, ', ').replace(/\s+/g, ' ').trim();

  /* ---- pembayang ---- */
  function lengkap() {
    const md = TD.medanJenis(jenis()); const nilai = k => String((T.d.medan || {})[k] || '').trim(); const teras = md.filter(m => m.teras); const belum = teras.filter(m => !nilai(m.k));
    return { n: teras.length - belum.length, jumlah: teras.length, belum, diisi: md.filter(m => nilai(m.k)).length, bebas: TD.patah(T.d.bebas) };
  }
  function teksPembayang() {
    const d = T.d; const baris = []; if (String(d.bebas || '').trim()) baris.push('Pembayang bebas: ' + d.bebas.trim());
    TD.medanJenis(jenis()).forEach(m => { const v = String((d.medan || {})[m.k] || '').trim(); if (v) baris.push(m.label + ': ' + v); });
    const s0 = d.sesi[0]; const jw = s0 ? (s0.soalan || []).map(q => [q, String((d.jawab || {})[q] || '').trim()]).filter(x => x[1]) : [];
    if (jw.length) baris.push('Jawapan Prof Dr kepada soalan agen:\n' + jw.map(x => '- ' + x[0] + ' Jawapan: ' + x[1]).join('\n'));
    return baris.join('\n');
  }
  function sumberRingkas() {
    const d = C.doc(); if (!d) return []; return C.sumberAda(d).slice(0, C.HAD_SUMBER).map((id, i) => { const r = Bd().rekod(id); return `${i + 1}. ${Bd().nama(r)}. ${String(r.tajuk || '').replace(/\s+/g, ' ').trim().slice(0, 220)}${r.tema ? ' [' + r.tema + ']' : ''}`; });
  }
  function cip() {
    const set = new Map(); pvPandu().forEach(v => set.set(v.nama.toLowerCase(), v.nama)); const d = C.doc(); const lain = (R.TEMA || [])[3];
    if (d) C.sumberAda(d).forEach(id => { const t = String(Bd().rekod(id).tema || '').trim(); if (t && t !== lain) set.set(t.toLowerCase(), t); });
    try { if (d && C.Pandu && C.Pandu.cadangPemboleh) C.Pandu.cadangPemboleh().forEach(x => { const nm = String(x).replace(/\s*\(\d+ artikel\)$/, '').trim(); if (nm && !set.has(nm.toLowerCase())) set.set(nm.toLowerCase(), nm); }); } catch (e) {}
    return Array.from(set.values()).slice(0, 12);
  }
  function petikanManuskrip() {
    const d = C.doc(); if (!d || !d.seksyen) return ''; const sek = Object.values(d.seksyen).filter(s => s && !s.padam);
    const teks = re => { const s = sek.find(x => re.test(String(x.tajuk || ''))); return s ? String(s.teks || '').replace(/\s+/g, ' ').trim() : ''; };
    const ab = teks(/abstrak|abstract/i); if (TD.patah(ab) >= 40) return 'ABSTRAK (ditulis oleh Prof Dr dalam ASAL): ' + ab.slice(0, 1800);
    const pd = teks(/pengenalan|pendahuluan|introduction/i); if (TD.patah(pd) >= 60) return 'PENDAHULUAN (ditulis oleh Prof Dr dalam ASAL; petikan awal): ' + pd.slice(0, 1500);
    return '';
  }

  /* ---- arahan kepada agen ---- */
  const SKEMA = { type: 'object', additionalProperties: false, required: ['cadangan', 'soalan', 'nota'], properties: {
    cadangan: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tajuk', 'padanan', 'pola', 'unsur', 'sebab'], properties: { tajuk: { type: 'string' }, padanan: { type: 'string' }, pola: { type: 'string' }, unsur: { type: 'array', items: { type: 'string' } }, sebab: { type: 'string' } } } },
    soalan: { type: 'array', items: { type: 'string' } }, nota: { type: 'string' } } };
  const ALAT = { name: 'cadang_tajuk', description: 'Pulangkan cadangan tajuk mengikut struktur ini.', input_schema: SKEMA };
  const hadToken = n => (n > 3 ? 2800 : 2000);
  /* sitasi dalam kurungan: "Tricco et al. (2018)" menjadi "Tricco et al., 2018" */
  const sit = ss => (ss || []).map(x => (TD.SUMBER[x] || {}).pendek || '').filter(Boolean).map(x => x.replace(/\s*\(([^()]+)\)$/, ', $1')).join('; ');
  function ayatPenanda(b) {
    const pn = TD.PENANDA[jenis()]; if (!pn) return null; const f = b === 'en' ? pn.en : pn.ms;
    return { t: pn.aras === 'wajib' ? `Setiap tajuk MESTI menamakan jenis artikel dengan frasa "${f}" atau padanan yang lazim, kerana garis panduan pelaporan bagi jenis ini memintanya.` : pn.aras === 'syor' ? `Tajuk elok menamakan jenis kajian ("${f}"); sekurang-kurangnya dua cadangan mesti menamakannya.` : `Menamakan jenis kajian ("${f}") ialah pilihan penulis; gunakannya dalam sekurang-kurangnya satu cadangan.`, s: pn.s };
  }
  function teksPeraturan(b) {
    const pj = TD.peraturanJenis(jenis()); const pn = ayatPenanda(b); const baris = (pn ? [pn] : []).concat(pj.khas, TD.peraturanBahasa(b), pj.am, aras() === 'mycite' ? TD.PERATURAN.jurnal : []);
    return baris.map((r, i) => `${i + 1}. ${r.t}${sit(r.s) ? ' (' + sit(r.s) + ')' : ''}`).join('\n');
  }
  function sistem(t, n) {
    const d = C.doc(); const j = C.JENIS_PETA[d.jenis] || { nama: 'artikel akademik', ket: '' }; const b = bahasa(); const P = TD.PANJANG; const g = gaya(); const pola = TD.polaKel(kel());
    return `Anda ialah Agen Tajuk Artikel Prof Dr Claude, pembantu kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris. Prof Dr sedang menyediakan artikel jenis "${j.nama}" (${j.ket}) untuk ${aras() === 'scopus' ? 'jurnal berindeks Scopus atau Web of Science' : 'jurnal berwasit berindeks MyCite (piawaian tajuk tetap tinggi supaya artikel juga layak dipertimbangkan oleh jurnal berindeks Scopus)'}. Tugas anda: mencadangkan ${n} tajuk artikel daripada pembayang yang ditulis oleh Prof Dr. Prof Dr yang memilih dan menyunting tajuk; anda pembantu, bukan penulis.

PERATURAN TAJUK (berasaskan garis panduan pelaporan dan kajian tentang ciri tajuk artikel):
${teksPeraturan(b)}

POLA TAJUK YANG SESUAI BAGI JENIS INI (kod: nama. huraian. templat):
${pola.map(p => `- ${p.k}${p.lalai === false ? ' (bukan lalai)' : ''}: ${p.nama}. ${p.hurai} Templat: ${p.t[b === 'en' ? 1 : 0]}`).join('\n')}

CARA KERJA:
1. Setiap cadangan menggunakan pola yang berbeza supaya Prof Dr mempunyai pilihan yang benar-benar berlainan; tulis kod pola itu dalam medan "pola". Susun cadangan daripada yang paling sesuai. Pola bertanda "bukan lalai" hanya digunakan apabila lima cadangan diminta (paling banyak satu, sebagai cadangan terakhir) atau apabila Prof Dr memintanya dalam pembayang.
2. Tulis setiap tajuk dalam ${namaBahasa(b)}. ${mahuPadanan() ? 'Dalam medan "padanan" tulis padanan tajuk yang sama dalam Bahasa Inggeris akademik (untuk jurnal yang meminta tajuk dwibahasa).' : 'Biarkan medan "padanan" sebagai rentetan kosong.'}
3. Sifar rekaan: gunakan hanya pemboleh ubah, konsep, populasi, konteks, kaedah dan dapatan yang dinyatakan dalam pembayang, jawapan Prof Dr, tajuk kerja atau petikan manuskrip. Jangan menambah negara, sampel, kaedah, dapatan atau dakwaan kebaharuan yang tidak disebut. Senarai artikel sumber hanya untuk memahami bidang dan istilah yang lazim; jangan salin atau tiru tajuk mana-mana artikel sumber.
4. Jika unsur teras tiada dalam pembayang, tulis tajuk tanpa unsur itu (jangan letak kurungan siku atau tempat kosong) dan tanyakan unsur itu dalam "soalan".
5. Panjang sasaran ${P.sasar[0]} hingga ${P.sasar[1]} patah perkataan, paling banyak ${P.lazim}, dan jangan sekali-kali melebihi ${P.had}; istilah kunci utama dalam kira-kira 65 aksara pertama; tiada singkatan kecuali yang ditulis sendiri oleh Prof Dr dalam pembayang dan memang lebih dikenali daripada bentuk penuhnya; tiada kata pengisi di hadapan (contohnya "Satu kajian tentang", "A study of"); tiada noktah di hujung; paling banyak satu titik bertindih.
6. Huruf besar: ${T.d.huruf === 'ayat' ? 'gaya ayat (hanya huruf pertama tajuk, huruf pertama selepas titik bertindih dan kata nama khas)' : b === 'en' ? 'gaya tajuk APA (huruf besar pada perkataan utama dan perkataan empat huruf atau lebih; kata sendi, kata hubung dan artikel pendek dengan huruf kecil kecuali di awal tajuk atau selepas titik bertindih)' : 'gaya tajuk Bahasa Melayu (huruf besar pada awal setiap perkataan kecuali kata sendi nama, kata hubung dan kata pemeri seperti di, ke, dari, daripada, dan, yang, untuk, dalam, dengan, terhadap, bagi, antara, kepada, tentang, melalui, atau, serta, apabila tidak berada di awal tajuk atau selepas titik bertindih; bagi kata ganda hanya unsur pertama berhuruf besar)'}.
7. Gaya Prof Dr: ${b === 'en' ? 'Bahasa Inggeris akademik yang jelas' : 'Bahasa Melayu Malaysia baku dengan istilah Malaysia (guru besar, dapatan, kajian, pemboleh ubah, pengantara bagi mediator, penyederhana bagi moderator); gunakan "dalam kalangan" (bukan "di kalangan"), "terhadap" selepas kesan atau pengaruh (bukan "ke atas") dan "antara ... dengan" bagi hubungan dua perkara; bina tajuk pada kata nama'}; jangan campurkan Bahasa Melayu dan Bahasa Inggeris dalam satu tajuk; jangan gunakan sempang em atau en; jangan gunakan istilah ini: ${g.larang}. Jika pola soalan digunakan, mulakan dengan "${b === 'en' ? 'How' : 'Bagaimana'}" atau "${b === 'en' ? 'Which' : 'Yang mana'}", bukan "${b === 'en' ? 'What is the level of' : 'Apakah'}" atau "${b === 'en' ? 'To what extent' : 'Sejauh mana'}", dan elakkan perkataan "${b === 'en' ? 'level' : 'tahap'}".
8. Medan "sebab": satu atau dua ayat Bahasa Melayu tentang apa yang ditonjolkan oleh tajuk itu dan bila ia pilihan yang baik. Medan "unsur": senarai pendek unsur pembayang yang dimuat oleh tajuk (contohnya "pemboleh ubah bebas", "populasi", "konteks", "jenis kajian"). Medan "soalan": paling banyak ${HAD_SOALAN} soalan pendek kepada Prof Dr tentang maklumat yang, jika dijawab, akan menajamkan tajuk; senarai kosong jika pembayang sudah lengkap. Medan "nota": satu ayat jika ada perkara yang Prof Dr perlu tahu (contohnya unsur teras tiada, atau kata sebab-akibat tidak sepadan dengan reka bentuk); rentetan kosong jika tiada.

Profil kajian Prof Dr:
${t.profil}`;
  }
  function tugas(n) {
    const d = C.doc(); const j = C.JENIS_PETA[d.jenis] || { nama: '' }; const tj = tajukSemasa(); const sr = sumberRingkas(); const pv = pvPandu(); const pm = petikanManuskrip(); const bah = [];
    bah.push(`JENIS ARTIKEL: ${j.nama}\nBAHASA TAJUK: ${namaBahasa(bahasa())}`);
    bah.push('PEMBAYANG TAJUK DARIPADA PROF DR:\n' + (teksPembayang() || '(tiada)'));
    if (tajukSah(tj)) bah.push('TAJUK KERJA SEMASA (ditulis oleh Prof Dr; boleh diperbaiki, jangan diulang bulat-bulat): ' + tj);
    if (pv.length) bah.push('PEMBOLEH UBAH ATAU KONSTRUK UTAMA ARTIKEL (daripada tetapan Pandu Tulis): ' + pv.map(v => v.nama + (v.alias ? ' (' + v.alias + ')' : '')).join('; '));
    if (pm) bah.push(pm);
    if (sr.length) bah.push(`ARTIKEL SUMBER YANG DIKUMPULKAN (${sr.length}; untuk memahami bidang sahaja):\n` + sr.join('\n'));
    const dahulu = []; T.d.sesi.slice(0, 2).forEach(s => (s.cadangan || []).forEach(c => dahulu.push(c.tajuk)));
    if (dahulu.length) bah.push('CADANGAN TERDAHULU (sudah dilihat oleh Prof Dr; jangan ulang, hasilkan pilihan yang berbeza):\n' + dahulu.map(x => '- ' + x).join('\n'));
    bah.push(`TUGAS: Cadangkan ${n} tajuk mengikut peraturan dan cara kerja dalam arahan sistem. Pulangkan JSON dengan medan cadangan (tepat ${n} item; setiap item: tajuk, padanan, pola, unsur, sebab), soalan dan nota.`);
    return bah.join('\n\n');
  }

  /* ---- paparan ---- */
  const LABEL_SEMAK = { kosong: 'belum diisi', panjang: 'panjang', jenis: 'jenis kajian belum dinamakan', unsur: 'unsur utama belum disebut', singkatan: 'ada singkatan', pengisi: 'kata pengisi di hadapan', gaya: 'gaya atau tanda baca', soalan: 'tajuk soalan', campuran: 'perkataan satu kaedah sahaja' };
  function htmlSemak(buka) {
    const t = tajukSemasa(); const sm = semak(t); const sk = TD.skorSemak(sm); const isu = sm.filter(x => x.status === 'gagal' || x.status === 'amaran');
    const nota = tajukSah(t) ? `${TD.patah(t)} patah perkataan${isu.length ? ' · ' + isu.map(x => LABEL_SEMAK[x.k] || x.k).join(' · ') : ' · tiada isu dikesan'}` : 'Tajuk belum diisi';
    return `<details class="tj-sm ${sk.teruk}"${buka ? ' open' : ''}><summary title="Semakan automatik tajuk rasmi (tanpa agen, tanpa kos). Klik untuk butiran."><span class="tj-mbar"><i style="width:${tajukSah(t) ? sk.peratus : 0}%"></i></span><b>Semakan tajuk ${tajukSah(t) ? sk.ok + '/' + sk.jumlah : ''}</b><span class="tj-nota">${esc(nota)}</span></summary><ul class="tj-sm-senarai">${sm.map(x => `<li class="${x.status}">${esc(x.teks)}</li>`).join('')}</ul></details>`;
  }
  function htmlBar(smBuka) {
    const s0 = T.d.sesi[0]; const buka = terbuka();
    return `<div class="tj-bar">${htmlSemak(smBuka)}<div class="tj-bar-acts">${s0 ? `<button type="button" class="btn btn-sm" data-tj="lihat" title="Buka semula cadangan terakhir tanpa memanggil agen">Cadangan terakhir (${s0.cadangan.length})</button>` : ''}<button type="button" class="btn btn-sm ${buka ? '' : 'btn-ai'}" data-tj="togol" aria-expanded="${buka}">${buka ? 'Tutup pembantu tajuk' : 'Pembantu tajuk'}</button></div></div>`;
  }
  function htmlLengkap() {
    const l = lengkap(); const p = l.jumlah ? Math.round(100 * l.n / l.jumlah) : 0;
    return `<span class="tj-mbar"><i style="width:${p}%"></i></span><b>Kelengkapan pembayang: ${l.n}/${l.jumlah} unsur teras</b><span class="tj-nota">${l.belum.length ? 'Belum diisi: ' + esc(l.belum.map(m => m.label.replace(/\s*\(.*\)$/, '')).join('; ')) + (l.bebas >= 12 ? '. Abaikan jika sudah disebut dalam pembayang bebas.' : '.') : 'Semua unsur teras bagi jenis ini sudah diisi.'}</span>`;
  }
  function htmlPanduan() {
    const b = bahasa(); const pj = TD.peraturanJenis(jenis()); const pn = ayatPenanda(b); const pb = TD.peraturanBahasa(b); const guna = []; const catat = r => (r.s || []).forEach(x => { if (TD.SUMBER[x] && !guna.includes(x)) guna.push(x); });
    const li = r => { catat(r); return `<li>${esc(r.t)}${sit(r.s) ? ' <span class="tj-sit">(' + esc(sit(r.s)) + ')</span>' : ''}</li>`; };
    const pnj = TD.PENANDA[jenis()]; const penanda = pn && pnj.aras !== 'wajib' ? li({ t: pn.t.replace('; sekurang-kurangnya dua cadangan mesti menamakannya', '').replace('; gunakannya dalam sekurang-kurangnya satu cadangan', ''), s: pn.s }) : '';
    const pola = TD.polaKel(kel());
    const isi = `<p class="lbl">Bagi jenis artikel ini</p><ol class="tj-peraturan">${penanda}${pj.khas.map(li).join('')}</ol><p class="lbl">Bagi tajuk ${b === 'en' ? 'Bahasa Inggeris' : 'Bahasa Melayu'}</p><ol class="tj-peraturan">${pb.map(li).join('')}</ol><p class="lbl">Bagi semua jenis artikel</p><ol class="tj-peraturan">${pj.am.map(li).join('')}</ol><p class="lbl">Jurnal Malaysia</p><ol class="tj-peraturan">${TD.PERATURAN.jurnal.map(li).join('')}</ol><p class="lbl">Pola tajuk yang ditawarkan kepada agen</p><ul class="tj-pola">${pola.map(p => `<li><b>${esc(p.nama)}${p.lalai === false ? ' (bukan lalai)' : ''}.</b> ${esc(p.hurai)} <span class="tj-templat">${esc(p.t[b === 'en' ? 1 : 0])}</span></li>`).join('')}</ul>`;
    return `<details class="tj-lipat tj-panduan"><summary>Panduan tajuk bagi jenis artikel ini, pola dan sumbernya</summary><div class="tj-lipat-isi">${isi}<p class="lbl">Sumber (disahkan pada November 2026)</p><ul class="tj-sumber">${guna.map(x => TD.SUMBER[x]).map(x => `<li>${esc(x.ruj)} <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.url)}</a></li>`).join('')}</ul></div></details>`;
  }
  function htmlPanel() {
    const d = T.d; const j = C.JENIS_PETA[jenis()]; const md = TD.medanJenis(jenis()); const cp = cip(); const s0 = d.sesi[0]; const b = bahasa(); const tk = d.token || {};
    const soalan = s0 ? (s0.soalan || []) : [];
    return `<div class="tj-panel"><div class="tj-ph"><b>Pembantu tajuk</b><span>Tulis pembayang dengan kata-kata Prof Dr sendiri; agen mencadangkan tajuk untuk dipilih dan disunting. Agen tidak mengisi medan Tajuk tanpa klik Prof Dr.</span></div>
      ${j ? '' : '<div class="pd-notis">Pilih jenis artikel dahulu di sebelah kanan medan Tajuk; soalan pandu, pola dan peraturan tajuk bergantung pada jenis artikel.</div>'}
      <label class="tj-f tj-bebas"><span class="lbl">Pembayang tajuk (tulis bebas: apa yang dikaji, siapa, di mana, dan apa yang mahu ditonjolkan)</span><textarea data-tjm="bebas" rows="3" placeholder="contoh: saya mahu tajuk yang menunjukkan bahawa pengurusan pengetahuan digital di sekolah masih kurang dikaji berbanding sektor lain, dengan tumpuan kepada peranan pemimpin sekolah">${esc(d.bebas || '')}</textarea></label>
      <div class="tj-ph2"><b>Soalan pandu${j ? ' bagi ' + esc(j.nama) : ''}</b><span>Jawab mana-mana yang berkaitan; yang bertanda bintang ialah unsur teras tajuk jenis ini.</span></div>
      <div class="tj-grid">${md.map(m => `<label class="tj-f${m.teras ? ' teras' : ''}"><span class="lbl">${esc(m.label)}${m.teras ? ' <i title="Unsur teras">*</i>' : ''}</span><input type="text" data-tjm="${esc(m.k)}" value="${esc((d.medan || {})[m.k] || '')}" placeholder="${esc(m.contoh)}" autocomplete="off"></label>`).join('')}</div>
      ${cp.length ? `<div class="tj-cip"><span class="lbl">Klik untuk memasukkan ke medan yang sedang ditaip (daripada tetapan Pandu Tulis, label dan medan konstruk artikel sumber):</span>${cp.map(c => `<button type="button" class="tj-c" data-tj="cip" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
      ${soalan.length ? `<div class="tj-soalan"><b>Soalan agen daripada cadangan terakhir</b><span class="help">Jawapan dihantar bersama pembayang apabila cadangan dijana semula.</span>${soalan.map((q, i) => `<label class="pd-q"><span>${esc(q)}</span><input type="text" data-tjm="j:${i}" value="${esc((d.jawab || {})[q] || '')}" autocomplete="off"></label>`).join('')}</div>` : ''}
      <div class="tj-lengkap" id="tjLengkap">${htmlLengkap()}</div>
      <div class="tj-acts">
        <label class="pd-f"><span class="lbl">Bilangan cadangan</span><select data-tjs="bil"><option value="3"${d.bil === 5 ? '' : ' selected'}>3 cadangan</option><option value="5"${d.bil === 5 ? ' selected' : ''}>5 cadangan</option></select></label>
        <label class="pd-f"><span class="lbl">Bahasa tajuk</span><select data-tjs="bahasa"><option value=""${d.bahasa ? '' : ' selected'}>Ikut manuskrip (${tP().bahasa === 'en' ? 'English' : 'Bahasa Melayu'})</option><option value="ms"${d.bahasa === 'ms' ? ' selected' : ''}>Bahasa Melayu</option><option value="en"${d.bahasa === 'en' ? ' selected' : ''}>English</option></select></label>
        <label class="pd-f"><span class="lbl">Huruf besar</span><select data-tjs="huruf"><option value="tajuk"${d.huruf === 'ayat' ? '' : ' selected'}>Gaya tajuk</option><option value="ayat"${d.huruf === 'ayat' ? ' selected' : ''}>Gaya ayat</option></select></label>
        ${b === 'ms' ? `<label class="tj-semak-kotak"><input type="checkbox" data-tjs="padanan"${mahuPadanan() ? ' checked' : ''}> Sertakan padanan Bahasa Inggeris <span class="help">(jurnal Malaysia lazimnya meminta tajuk dalam dua bahasa)</span></label>` : ''}
        <button type="button" class="btn btn-ai" data-tj="jana"${T.busy || !j ? ' disabled' : ''}>${T.busy ? 'Agen sedang mencadangkan tajuk' : 'Jana ' + (d.bil === 5 ? 5 : 3) + ' cadangan tajuk'}</button>
      </div>
      <div class="help">Setiap janaan ialah satu panggilan API yang kecil dengan kunci API Prof Dr: pembayang, jawapan soalan pandu, tajuk kerja dan senarai ringkas artikel sumber (penulis, tahun dan tajuk sahaja). Amaran kos dipaparkan sebelum dihantar.${tk.panggil ? ` Setakat ini bagi tajuk artikel ini: ${angka(tk.panggil)} panggilan, token masuk ${angka(tk.masuk)}, keluar ${angka(tk.keluar)}.` : ''}</div>
      ${d.sesi.length ? `<details class="tj-lipat"><summary>Cadangan terdahulu (${d.sesi.length} sesi tersimpan)</summary><div class="tj-lipat-isi"><ul class="tj-sesi">${d.sesi.map((s, i) => `<li><button type="button" class="btn-link" data-tj="sesi" data-i="${i}">${esc(R.fmtTime(s.masa || 0))}</button> · ${s.cadangan.length} cadangan · ${esc(namaBahasa(s.bahasa))}${s.pilih != null && s.cadangan[s.pilih] ? ' · dipilih: <i>' + esc(s.cadangan[s.pilih].tajuk) + '</i>' : ''}</li>`).join('')}</ul></div></details>` : ''}
      ${(d.lama || []).length ? `<details class="tj-lipat"><summary>Tajuk rasmi sebelum ini (${d.lama.length})</summary><div class="tj-lipat-isi"><ul class="tj-sesi">${d.lama.map((x, i) => `<li>${esc(x.tajuk)} <span class="help">(${esc(R.fmtTime(x.masa || 0))})</span> <button type="button" class="btn-link" data-tj="pulih" data-i="${i}">Pulihkan</button></li>`).join('')}</ul></div></details>` : ''}
      ${j ? htmlPanduan() : ''}
    </div>`;
  }
  function htmlPadanan() {
    const p = T.d.pilih; if (!p || !p.padanan) return ''; const sama = p.tajuk === tajukSemasa();
    return `<div class="tj-padanan"><span class="lbl">Padanan Bahasa Inggeris bagi tajuk yang dipilih${sama ? '' : ' (tajuk sudah disunting selepas itu; kemas kini padanan ini jika perlu)'}:</span> <span class="tj-padanan-teks">${esc(p.padanan)}</span> <button type="button" class="btn-link" data-tj="salinpadanan">Salin</button></div>`;
  }
  function render() {
    const el = $('#artTajukBantu'); if (!el) return; const d = C.doc();
    if (!d || !C.entri(A.id)) { el.innerHTML = ''; return; }
    muat(A.id); const sm = el.querySelector('.tj-sm'); const smBuka = !!(sm && sm.open);
    el.innerHTML = htmlBar(smBuka) + htmlPadanan() + (terbuka() ? htmlPanel() : '');
  }
  function kemasSemak() { const el = $('#artTajukBantu'); const sm = el && el.querySelector('.tj-sm'); if (!sm || !T.d) return; sm.outerHTML = htmlSemak(sm.open); const pd = el.querySelector('.tj-padanan'); if (pd) pd.outerHTML = htmlPadanan(); }
  function kemasLengkap() { const el = $('#tjLengkap'); if (el) el.innerHTML = htmlLengkap(); }

  /* ---- tetingkap timbul cadangan ---- */
  function htmlCadangan(s) {
    const lain = s.bahasa === 'en' ? 'Bahasa Melayu' : 'Bahasa Inggeris'; const jw = T.d.jawab || {};
    return `<div class="tj-pop"><p class="help">Klik satu cadangan untuk mengisinya ke medan Tajuk artikel. Tajuk itu kekal boleh disunting bila-bila masa, dan semua cadangan tersimpan untuk dirujuk semula. Dijana ${esc(R.fmtTime(s.masa || 0))}${s.model ? ', model ' + esc(String(s.model).replace('claude-', '')) : ''}${s.token ? ', token masuk ' + angka(s.token.masuk) + ' dan keluar ' + angka(s.token.keluar) : ''}.</p>
      ${s.nota ? `<div class="pd-notis">${esc(s.nota)}</div>` : ''}
      <div class="tj-kad-senarai">${s.cadangan.map((c, i) => { const sm = semak(c.tajuk, s.bahasa); const isu = sm.filter(x => x.status === 'gagal' || x.status === 'amaran'); return `<div class="tj-kad${s.pilih === i ? ' on' : ''}" data-tjpilih="${i}" role="button" tabindex="0" title="Klik untuk mengisi medan Tajuk artikel dengan cadangan ini"><span class="no">${i + 1}</span><div class="tj-kad-isi"><div class="tj-t">${esc(c.tajuk)}</div><div class="tj-meta">${TD.patah(c.tajuk)} patah perkataan · Pola: ${esc(TD.namaPola(c.pola))}${s.pilih === i ? ' · <b>dipilih</b>' : ''}</div>${c.sebab ? `<div class="tj-sebab">${esc(c.sebab)}</div>` : ''}${c.padanan ? `<div class="tj-pad"><b>Padanan ${lain}:</b> ${esc(c.padanan)}</div>` : ''}<div class="tj-tanda">${(c.unsur || []).slice(0, 6).map(u => `<span class="tag">${esc(u)}</span>`).join('')}${isu.length ? isu.map(x => `<span class="tag ${x.status}" title="${esc(x.teks)}">${esc(LABEL_SEMAK[x.k] || x.k)}</span>`).join('') : '<span class="tag ok">lulus semakan tajuk</span>'}</div></div><div class="tj-kad-acts"><span class="btn btn-sm btn-primary">Guna tajuk ini</span><button type="button" class="btn btn-sm" data-tjsalin="${i}">Salin</button></div></div>`; }).join('')}</div>
      ${(s.soalan || []).length ? `<div class="tj-soalan"><b>Soalan agen untuk menajamkan tajuk</b><span class="help">Jawab mana-mana yang berkaitan, kemudian jana semula; jawapan dihantar bersama pembayang.</span>${s.soalan.map((q, i) => `<label class="pd-q"><span>${esc(q)}</span><input type="text" id="tjJ${i}" class="modal-in" value="${esc(jw[q] || '')}" autocomplete="off"></label>`).join('')}<div><button type="button" class="btn btn-ai" data-tjlagi="1">Simpan jawapan dan jana semula</button></div></div>` : `<div class="tj-pop-acts"><button type="button" class="btn btn-ai" data-tjlagi="1">Jana set cadangan yang lain</button><span class="help">Ubah pembayang dahulu jika mahu arah yang berbeza.</span></div>`}
    </div>`;
  }
  async function bukaCadangan(si) {
    const s = T.d.sesi[si]; if (!s) { toast('Belum ada cadangan tajuk bagi artikel ini', true); return; }
    let tindak = null; const modal = $('#modalText'); const kad = $('#modal .modal-card');
    const onClick = async e => {
      const sl = e.target.closest('[data-tjsalin]'); if (sl) { e.stopPropagation(); const c = s.cadangan[+sl.dataset.tjsalin]; try { await navigator.clipboard.writeText(c.tajuk); toast('Tajuk disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } return; }
      if (e.target.closest('[data-tjlagi]')) { tindak = { lagi: true }; $('#modalOk').click(); return; }
      const p = e.target.closest('[data-tjpilih]'); if (p) { tindak = { pilih: +p.dataset.tjpilih }; $('#modalOk').click(); }
    };
    const onKey = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-tjpilih]')) { e.preventDefault(); tindak = { pilih: +e.target.dataset.tjpilih }; $('#modalOk').click(); } };
    modal.addEventListener('click', onClick); modal.addEventListener('keydown', onKey); if (kad) kad.classList.add('lebar');
    await R.richModal(`Cadangan tajuk (${s.cadangan.length})`, htmlCadangan(s), 'Tutup');
    modal.removeEventListener('click', onClick); modal.removeEventListener('keydown', onKey); if (kad) kad.classList.remove('lebar');
    const v = R.richModal.values || {}; let ubah = false; (s.soalan || []).forEach((q, i) => { const jw = v['tjJ' + i]; if (typeof jw === 'string' && jw !== String((T.d.jawab || {})[q] || '')) { T.d.jawab[q] = jw; ubah = true; } }); if (ubah) simpan();
    if (tindak && tindak.pilih != null) pilih(si, tindak.pilih);
    else if (tindak && tindak.lagi) setTimeout(() => jana(), 80);
    else if (ubah) render();
  }

  /* ---- pilih, pulih ---- */
  function catatLama(lama, baharu) { if (tajukSah(lama) && lama !== baharu) T.d.lama = [{ tajuk: lama, masa: Date.now() }].concat((T.d.lama || []).filter(x => x.tajuk !== lama && x.tajuk !== baharu)).slice(0, HAD_LAMA); }
  function isiTajuk(t) { C.tetapTajuk(t, true); if (C.medanTajuk) C.medanTajuk(t); else { const inp = $('#artTajukArt'); if (inp) inp.value = t; } }
  function pilih(si, i) {
    const s = T.d.sesi[si]; const c = s && s.cadangan[i]; if (!c) return; const lama = tajukSemasa();
    catatLama(lama, c.tajuk); s.pilih = i; T.d.pilih = { sesi: s.id, i, tajuk: c.tajuk, padanan: c.padanan || '', masa: Date.now() }; T.buka = false; R.lsSet(lsBuka(T.id), false);
    simpan(true); isiTajuk(c.tajuk); render();
    toast('Tajuk diisi ke medan Tajuk artikel. Prof Dr boleh menyuntingnya bila-bila masa.', false, tajukSah(lama) && lama !== c.tajuk ? { label: 'Batal', fn: () => pulih(lama) } : undefined);
    const inp = $('#artTajukArt'); if (inp) { inp.scrollIntoView({ block: 'nearest' }); inp.focus(); }
  }
  function pulih(tajuk) {
    const kini = tajukSemasa(); if (!tajuk || tajuk === kini) return; catatLama(kini, tajuk); T.d.lama = (T.d.lama || []).filter(x => x.tajuk !== tajuk); simpan(true); isiTajuk(tajuk); render(); toast('Tajuk terdahulu dipulihkan');
  }

  /* ---- jana cadangan ---- */
  async function jana() {
    const d = C.doc(); if (!d || T.busy) return; muat(A.id); const n = T.d.bil === 5 ? 5 : 3;
    if (!jenis()) { toast('Pilih jenis artikel dahulu; soalan pandu dan peraturan tajuk bergantung padanya', true); const s = $('#artJenis'); if (s) s.focus(); return; }
    const l = lengkap();
    if (!l.diisi && l.bebas < 3 && !tajukSah(tajukSemasa())) { toast('Tulis pembayang tajuk dahulu: beberapa patah perkataan tentang apa yang dikaji sudah memadai', true); const ta = $('#artTajukBantu [data-tjm="bebas"]'); if (ta) ta.focus(); return; }
    const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
    const system = sistem(t, n), user = tugas(n); const anggaran = anggarToken(system) + anggarToken(user); const tk = T.d.token || { masuk: 0, keluar: 0, panggil: 0 }; const nS = sumberRingkas().length;
    const amaran = l.belum.length && l.bebas < 12 ? `<div class="pd-notis"><b>Pembayang belum lengkap.</b> Unsur teras yang belum diisi: ${esc(l.belum.map(m => m.label.replace(/\s*\(.*\)$/, '')).join('; '))}. Cadangan akan dibuat tanpa unsur ini dan agen akan bertanya tentangnya.</div>` : '';
    const ok = await R.richModal(`Jana ${n} cadangan tajuk?`, `${amaran}<p>Panggilan ini menghantar pembayang, jawapan soalan pandu, tajuk kerja semasa${nS ? ' dan senarai ringkas ' + nS + ' artikel sumber (penulis, tahun dan tajuk sahaja)' : ''} ke API Anthropic menggunakan kunci API Prof Dr.</p><p class="help">Anggaran ${angka(anggaran)} token masuk dan sehingga ${angka(hadToken(n))} token keluar, model ${esc(t.model.replace('claude-', ''))}. Kosnya dicaj kepada akaun Anthropic Prof Dr.${tk.panggil ? ` Setakat ini bagi tajuk artikel ini: ${angka(tk.panggil)} panggilan, token masuk ${angka(tk.masuk)}, keluar ${angka(tk.keluar)}.` : ''}</p>`, amaran ? 'Jana juga' : 'Jana cadangan', amaran ? 'Lengkapkan dahulu' : 'Batal');
    if (!ok) { if (amaran) { const f = l.belum[0]; const inp = f && $(`#artTajukBantu [data-tjm="${f.k}"]`); if (inp) inp.focus(); } return; }
    T.busy = true; render();
    try {
      const res = await R.Isi.hantar(t, { kunciMod: 'tajuk:' + t.model, system, content: [{ type: 'text', text: user }], skema: SKEMA, alat: ALAT, hadToken: hadToken(n) });
      const data = res.input || R.Isi.parseJson(res.text, res.stop); if (!data || typeof data !== 'object') throw { code: 'json' };
      const lihat = new Set(); const cadangan = (Array.isArray(data.cadangan) ? data.cadangan : []).map(c => ({ tajuk: bersihTajuk(c && c.tajuk), padanan: mahuPadanan() ? bersihTajuk(c && c.padanan) : '', pola: String((c && c.pola) || '').trim(), unsur: (Array.isArray(c && c.unsur) ? c.unsur : []).map(bersihTeks).filter(Boolean).slice(0, 8), sebab: bersihTeks(c && c.sebab) })).filter(c => { const k = c.tajuk.toLowerCase(); if (!c.tajuk || lihat.has(k)) return false; lihat.add(k); return true; }).slice(0, n);
      if (!cadangan.length) throw { code: 'kosong' };
      const masuk = res.usage ? res.usage.masuk + (res.usage.cacheBaca || 0) + (res.usage.cacheTulis || 0) : 0, keluar = res.usage ? res.usage.keluar : 0;
      const sesi = { id: idBaru(), masa: Date.now(), model: t.model, token: res.usage ? { masuk, keluar } : null, jenis: jenis(), bahasa: bahasa(), bil: n, pembayang: teksPembayang(), cadangan, soalan: (Array.isArray(data.soalan) ? data.soalan : []).map(bersihTeks).filter(Boolean).slice(0, HAD_SOALAN), nota: bersihTeks(data.nota), pilih: null };
      T.d.sesi = [sesi].concat(T.d.sesi || []).slice(0, HAD_SESI); T.d.token = { masuk: (tk.masuk || 0) + masuk, keluar: (tk.keluar || 0) + keluar, panggil: (tk.panggil || 0) + 1 }; simpan(true);
      T.busy = false; render(); toast(`${cadangan.length} cadangan tajuk siap${res.usage ? ' (token masuk ' + angka(masuk) + ', keluar ' + angka(keluar) + ')' : ''}`);
      bukaCadangan(0);
    } catch (e) { T.busy = false; render(); toast('Agen gagal mencadangkan tajuk: ' + (e && e.code === 'kosong' ? 'tiada cadangan diterima; cuba sekali lagi.' : R.Isi.msg(e)), true); }
  }

  /* ---- peristiwa ---- */
  function aksi(a, b) {
    if (a === 'togol') { T.buka = !terbuka(); R.lsSet(lsBuka(T.id), T.buka); render(); if (T.buka) { const ta = $('#artTajukBantu [data-tjm="bebas"]'); if (ta) ta.focus(); } }
    else if (a === 'jana') jana();
    else if (a === 'lihat') bukaCadangan(0);
    else if (a === 'sesi') bukaCadangan(+b.dataset.i);
    else if (a === 'pulih') { const x = (T.d.lama || [])[+b.dataset.i]; if (x) pulih(x.tajuk); }
    else if (a === 'salinpadanan') { const p = T.d.pilih; if (p && p.padanan) navigator.clipboard.writeText(p.padanan).then(() => toast('Padanan disalin'), () => toast('Papan keratan tidak tersedia', true)); }
    else if (a === 'cip') {
      const v = b.dataset.v || ''; let k = T.fokus || 'bebas'; let el = $(`#artTajukBantu [data-tjm="${k}"]`);
      if (!el || k.startsWith('j:')) { k = 'bebas'; el = $('#artTajukBantu [data-tjm="bebas"]'); } if (!el) return;
      const lama = el.value.trim(); el.value = lama ? lama + (k === 'bebas' ? ' ' : ', ') + v : v; if (k === 'bebas') T.d.bebas = el.value; else T.d.medan[k] = el.value; simpan(); kemasLengkap(); el.focus();
    }
  }
  const akar = $('#artKepala');
  if (akar) {
    akar.addEventListener('click', e => { const b = e.target.closest('[data-tj]'); if (!b || !akar.contains(b) || !T.d) return; aksi(b.dataset.tj, b); });
    akar.addEventListener('input', e => {
      const m = e.target.closest('[data-tjm]'); if (!m || !T.d) return; const k = m.dataset.tjm;
      if (k === 'bebas') T.d.bebas = m.value; else if (k.startsWith('j:')) { const q = ((T.d.sesi[0] || {}).soalan || [])[+k.slice(2)]; if (q) T.d.jawab[q] = m.value; } else T.d.medan[k] = m.value;
      simpan(); kemasLengkap(); if (!k.startsWith('j:') && k !== 'bebas') kemasSemak();
    });
    akar.addEventListener('change', e => {
      const s = e.target.closest('[data-tjs]'); if (!s || !T.d) return; const k = s.dataset.tjs;
      if (k === 'bil') T.d.bil = s.value === '5' ? 5 : 3; else if (k === 'bahasa') T.d.bahasa = s.value === 'en' ? 'en' : s.value === 'ms' ? 'ms' : ''; else if (k === 'huruf') T.d.huruf = s.value === 'ayat' ? 'ayat' : 'tajuk'; else if (k === 'padanan') T.d.padanan = !!s.checked;
      simpan(); render();
    });
    akar.addEventListener('focusin', e => { const m = e.target.closest('[data-tjm]'); if (m) T.fokus = m.dataset.tjm; });
  }
  /* dipanggil oleh menu Artikel */
  function onTajuk() { if (T.d && T.id === A.id) kemasSemak(); }
  function onJenis() { if (!C.doc()) return; muat(A.id); if (jenis()) { T.buka = true; R.lsSet(lsBuka(T.id), true); } render(); const p = $('#artTajukBantu .tj-panel'); if (p && jenis()) { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); const ta = p.querySelector('[data-tjm="bebas"]'); if (ta) ta.focus({ preventScroll: true }); } }
  function buka() { if (!C.doc()) return; muat(A.id); T.buka = true; R.lsSet(lsBuka(T.id), true); render(); const ta = $('#artTajukBantu [data-tjm="bebas"]'); if (ta) ta.focus(); }

  return { render, onTajuk, onJenis, buka, jana, bukaCadangan, pilih, pulih, semak, lengkap, teksPembayang, sistem, tugas, state: T, TD };
}
