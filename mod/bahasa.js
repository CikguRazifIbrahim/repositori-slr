/* Agen Bahasa Prof Dr Claude (v1.31.0): agen khas yang memiawaikan teks medan ekstrak kepada Bahasa Melayu Malaysia akademik, selaras
   dengan senarai istilah Prof Dr (mod/bahasa-data.js). Tiga lapisan:
   1. Pencegahan: arahan setiap agen memuatkan PIAWAIAN BAHASA yang sama (bahasa-data.js).
   2. Pengesan tanpa token: setiap bahagian rekod disemak dengan senarai GLOSARI; istilah yang terlepas ditanda pada kepala bahagian.
   3. Agen Bahasa: satu panggilan kecil ke API Anthropic (teks medan sahaja, bukan PDF). Dijalankan selepas "Mohon Prof Dr Claude isikan"
      mengikut Tetapan, dan atas permintaan melalui butang "Piawaikan bahasa" bagi teks yang sudah ada dalam rekod.
   Agen hanya meminda bahasa. Pengawal isi (jagaIsi) menolak sebarang teks baharu yang angka, simbol statistik, petikan atau jejak muka
   suratnya berubah. Bagi teks sedia ada, pindaan dipaparkan dahulu dan hanya medan yang ditanda diterima. */
import { PIAWAI_PENUH, semakIstilah, jagaIsi, JENIS_NAMA } from './bahasa-data.js';

export function initBahasa(R) {
  const { $, $$, esc, toast, GROUPS } = R;
  /* Medan yang tidak dipiawaikan: disalin tepat daripada artikel (tajuk, rujukan, DOI, jejak sumber), nama subtopik tesis, atau catatan
     Prof Dr sendiri. */
  const KECUALI = new Set(['tajuk', 'rujukan', 'doi', 'penulis', 'tahun', 'negara', 'subtopik', 'jejak', 'catatan', 'pautan']);
  const HAD_PINDAAN = 40, PANJANG_MIN = 20;
  const Bh = { busy: new Set(), terakhir: null };
  const angka = n => Number(n || 0).toLocaleString('en-US');
  const anggarToken = teks => Math.round(String(teks || '').length / 3.6);
  const bolehPiawai = k => { const f = R.FIELD_BY_KEY[k]; return !!f && (f.type === 'textarea' || f.type === 'text') && !KECUALI.has(k); };
  function medanBahagian(letter) { const g = GROUPS.find(x => x.letter === letter); const out = []; if (g) g.medan.forEach(m => m.fields.forEach(f => { if (bolehPiawai(f.k)) out.push(f); })); return out; }
  function rekodSemasa(id) { const d = R.S.docs.get(id) || {}; return Object.assign({}, d, R.S.pending[id] || {}); }
  /* Pengesan tanpa token bagi satu bahagian: [{ k, label, hits }] */
  function semakBahagian(d, letter) {
    const out = []; medanBahagian(letter).forEach(f => { const v = d && d[f.k]; if (typeof v !== 'string' || v.trim().length < 3) return; const hits = semakIstilah(v); if (hits.length) out.push({ k: f.k, label: f.label, hits }); });
    return out;
  }

  /* ---- arahan agen ---- */
  function systemPrompt() {
    return `Anda ialah Agen Bahasa Prof Dr Claude, penyunting bahasa akademik kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris. Tugas anda satu sahaja: memiawaikan bahasa teks medan ekstrak Jadual Sorotan Literatur Sistematik kepada Bahasa Melayu Malaysia akademik yang setaraf laras tesis PhD, TANPA mengubah isi. Teks itu lazimnya draf yang diterjemah daripada artikel berbahasa Inggeris.

Peraturan penyuntingan:
1. Pinda bahasa sahaja: istilah, ejaan, kata sendi, struktur ayat yang janggal dan kesan terjemahan, mengikut PIAWAIAN BAHASA di bawah. Jangan ubah fakta, tafsiran, susunan butiran atau kesimpulan. Jangan tambah atau buang maklumat, dan jangan memanjangkan teks.
2. Kekalkan tepat seperti asal: setiap angka dan simbol statistik (β, α, R², f², p, t, =, <, >, %), setiap jejak muka surat dalam bentuk (m.s. N), nama pengarang dan tahun, nama jurnal, institusi, program, instrumen, teori dan model, singkatan (CR, AVE, SEM, PLS-SEM, CB-SEM, HTMT, VIF), kod item dan hipotesis (contohnya H1 atau q17), serta ungkapan "Tiada dalam artikel" dan "Tidak pasti".
3. Teks di dalam tanda petik ialah petikan asal daripada artikel: salin semula tanpa sebarang perubahan walaupun dalam bahasa lain. Istilah Inggeris dalam kurungan yang menerangkan istilah Melayu dikekalkan.
4. Jika sesuatu medan sudah menepati piawaian, jangan pulangkan medan itu. Jangan menukar perkataan yang sudah betul semata-mata untuk kelainan.
5. Format output: SATU objek JSON mengikut skema yang disediakan (atau melalui alat piawai_bahasa jika alat itu diberi), tanpa teks pengantar. "medan": hanya medan yang dipinda, setiap satu dengan kunci tepat dan teks penuh selepas pindaan, dalam satu perenggan. "pindaan": setiap pindaan sebagai kunci medan, frasa asal, frasa baharu dan sebab ringkas (contohnya "istilah Prof Dr bagi response rate", "bentuk Indonesia", "kesan terjemahan" atau "ejaan"). Jika tiada apa-apa yang perlu dipinda, pulangkan kedua-duanya sebagai senarai kosong.

${PIAWAI_PENUH}`;
  }
  const tugas = senarai => `Piawaikan bahasa ${senarai.length} medan berikut. Kunci setiap medan berada dalam atribut k.\n\n` + senarai.map(x => `<medan k="${x.k}" label="${x.label}">\n${x.teks}\n</medan>`).join('\n\n') + '\n\nPulangkan JSON sekarang.';
  const SKEMA = { type: 'object', additionalProperties: false, required: ['medan', 'pindaan'], properties: {
    medan: { type: 'array', description: 'Hanya medan yang dipinda', items: { type: 'object', additionalProperties: false, required: ['k', 'teks'], properties: { k: { type: 'string', description: 'Kunci medan tepat seperti atribut k' }, teks: { type: 'string', description: 'Teks penuh medan selepas pindaan' } } } },
    pindaan: { type: 'array', description: 'Setiap pindaan bahasa', items: { type: 'object', additionalProperties: false, required: ['k', 'asal', 'baharu', 'sebab'], properties: { k: { type: 'string', description: 'Kunci medan' }, asal: { type: 'string', description: 'Frasa asal' }, baharu: { type: 'string', description: 'Frasa selepas pindaan' }, sebab: { type: 'string', description: 'Sebab ringkas' } } } } } };
  const ALAT = { name: 'piawai_bahasa', description: 'Pulangkan medan yang dipinda dan senarai pindaan bahasa. Sertakan hanya medan yang dipinda.', input_schema: SKEMA };

  /* ---- panggilan agen: senarai = [{ k, label, teks }] ---- */
  async function agen(t, senarai) {
    const jumlah = senarai.reduce((n, x) => n + x.teks.length, 0);
    /* Had token keluar = bajet jawapan mengikut panjang teks yang dihantar (jawapan paling panjang ialah semua medan ditulis semula berserta
       senarai pindaan) + ruang berfikir model, dengan siling HAD_MAKS. Had ini siling sahaja: yang dicaj ialah token yang benar-benar
       dijana. Agen ini mengurus ulangannya sendiri (ulang: false). */
    const had = Math.min(R.Isi.HAD_MAKS, Math.max(2200, Math.round(jumlah / 2)) + R.Isi.RUANG_FIKIR);
    const p = { kunciMod: 'bahasa:' + t.model, system: systemPrompt(), content: [{ type: 'text', text: tugas(senarai) }], skema: SKEMA, alat: ALAT, hadToken: had, ulang: false };
    let res = await R.Isi.hantar(t, p);
    if (res.stop === 'max_tokens') {
      /* Jawapan yang terpotong TIDAK dibaiki: teks medan yang terpotong tidak boleh menggantikan teks asal. Ulang sekali pada siling
         HAD_MAKS dengan effort rendah (kurang pemikiran, lebih ruang untuk jawapan); jika masih terpotong, agen berhenti dan teks asal kekal. */
      const had2 = R.Isi.HAD_MAKS; console.warn('bahasa: jawapan mencapai had token', had, '; mengulang dengan had', had2);
      const u0 = res.usage; res = await R.Isi.hantar(t, Object.assign({}, p, { hadToken: had2, effort: 'low' }));
      res.usage = { masuk: u0.masuk + res.usage.masuk, keluar: u0.keluar + res.usage.keluar, cacheTulis: u0.cacheTulis + res.usage.cacheTulis, cacheBaca: u0.cacheBaca + res.usage.cacheBaca };
      if (res.stop === 'max_tokens') throw { code: 'bahasa_potong' };
    }
    /* JSON dihurai secara ketat. Pembaikan JSON yang digunakan oleh agen isian tidak dipakai di sini kerana teks yang "dibaiki" boleh
       terpotong, dan teks medan yang terpotong tidak boleh menggantikan teks asal. */
    const j = res.input || huraiKetat(res.text);
    const peta = new Map(senarai.map(x => [x.k, x])); const baharu = {}; const ditolak = [];
    (Array.isArray(j.medan) ? j.medan : []).forEach(m => {
      const x = m && peta.get(String(m.k || '').trim()); if (!x) return;
      const v = String(m.teks || '').replace(/\s*[—–―]\s*/g, ', ').replace(/\s+\n/g, '\n').trim(); if (!v || v === x.teks.trim()) return;
      const jg = jagaIsi(x.teks, v); if (!jg.ok) { ditolak.push({ k: x.k, label: x.label, sebab: jg.sebab }); return; }
      baharu[x.k] = v;
    });
    const pindaan = (Array.isArray(j.pindaan) ? j.pindaan : []).map(p => p && ({ k: String(p.k || '').trim(), asal: String(p.asal || '').trim().slice(0, 200), baharu: String(p.baharu || '').trim().slice(0, 200), sebab: String(p.sebab || '').trim().slice(0, 140) }))
      .filter(p => p && baharu[p.k] !== undefined && p.asal && p.baharu && p.asal !== p.baharu).slice(0, HAD_PINDAAN);
    return { baharu, pindaan, ditolak, usage: res.usage, mod: res.mod || null, model: t.model };
  }
  function huraiKetat(text) {
    const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); const a = s.indexOf('{'); const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw { code: 'bahasa_json' };
    try { const j = JSON.parse(s.slice(a, b + 1)); if (!j || typeof j !== 'object') throw new Error('bukan objek'); return j; } catch (e) { throw { code: 'bahasa_json', message: String(e && e.message || e) }; }
  }
  const msg = e => e && e.code === 'bahasa_potong' ? 'jawapan agen bahasa terpotong pada had token walaupun selepas diulang; piawaikan satu bahagian pada satu masa melalui butang Piawaikan bahasa.' : e && e.code === 'bahasa_json' ? 'jawapan agen bahasa tidak dapat dibaca sebagai JSON yang sah; cuba sekali lagi.' : R.Isi.msg(e);
  /* Ringkasan satu larian selepas isian, untuk makluman kepada Prof Dr */
  const ringkas = b => !b || b.dilangkau ? '' : b.gagal ? 'agen bahasa gagal (' + b.gagal + '), teks isian dikekalkan' : 'agen bahasa: ' + (b.n ? b.n + ' pindaan istilah' : (b.medan || []).length ? b.medan.length + ' medan dipinda' : 'tiada pindaan diperlukan') + ((b.ditolak || []).length ? ', ' + b.ditolak.length + ' cadangan ditolak oleh pengawal isi' : '');
  /* Catatan ringkas yang disimpan pada rekod bagi satu bahagian */
  function catatan(r, letter, kunci, cara) {
    const medan = kunci.filter(k => r.baharu[k] !== undefined);
    return { masa: Date.now(), model: r.model, cara, medan, n: r.pindaan.filter(p => medan.includes(p.k)).length, pindaan: r.pindaan.filter(p => medan.includes(p.k)), ditolak: r.ditolak.filter(x => kunci.includes(x.k)).map(x => x.k + ' (' + x.sebab + ')'), token: r.usage, mod: r.mod };
  }

  /* ---- selepas "Mohon Prof Dr Claude isikan": memiawaikan medan teks yang baru diisi ----
     Isian (patch) sudah disimpan sebelum fungsi ini dipanggil, supaya kelewatan atau kegagalan agen tidak menghilangkan isian. Pindaan
     ditulis sebagai tulisan kedua, dan hanya pada medan yang masih sama dengan teks yang dihantar kepada agen (medan yang sempat disunting
     oleh Prof Dr tidak ditimpa). Larian yang tidak meminda apa-apa tidak menimpa catatan pindaan terdahulu bagi bahagian yang sama.
     t.bahasaAuto: 'sentiasa' (lalai), 'perlu' (hanya jika pengesan menemui istilah) atau 'tidak'. */
  async function selepasIsi(t, id, letter, patch, diisi) { return selepasIsiSemua(t, id, [{ letter, patch, diisi }]); }
  /* Satu panggilan agen bagi satu atau beberapa bahagian yang baru diisi ("Isi semua" memanggilnya sekali di hujung, bukan enam kali).
     bahagian = [{ letter, patch, diisi }]. Memulangkan ringkasan gabungan { masa, n, medan, ditolak, basi }, atau null. */
  async function selepasIsiSemua(t, id, bahagian) {
    if (t.bahasaAuto === 'tidak') return null;
    const senarai = []; const kunciL = {}; const asal = {};
    bahagian.forEach(b => { const kunci = (b.diisi || []).filter(k => bolehPiawai(k) && typeof b.patch[k] === 'string' && b.patch[k].trim().length >= PANJANG_MIN); kunciL[b.letter] = kunci; kunci.forEach(k => { asal[k] = b.patch[k]; senarai.push({ k, label: R.FIELD_BY_KEY[k].label, teks: b.patch[k], letter: b.letter }); }); });
    if (!senarai.length) return null;
    if (t.bahasaAuto === 'perlu' && !senarai.some(x => semakIstilah(x.teks).length)) return { dilangkau: true };
    const r = await agen(t, senarai);
    const d2 = rekodSemasa(id); const pinda = {}; const basi = [];
    Object.keys(r.baharu).forEach(k => { if (String(d2[k] == null ? '' : d2[k]) === asal[k]) pinda[k] = r.baharu[k]; else basi.push(k); });
    const rT = Object.assign({}, r, { baharu: pinda, pindaan: r.pindaan.filter(p => pinda[p.k] !== undefined) });
    const berkongsi = bahagian.filter(b => kunciL[b.letter].length).length > 1 ? bahagian.filter(b => kunciL[b.letter].length).map(b => b.letter).join('') : '';
    const logSemua = Object.assign({}, d2.bahasaIsi || {}); let ubahLog = false; const gabung = { masa: Date.now(), model: r.model, cara: 'auto', medan: [], n: 0, ditolak: [], basi, token: r.usage };
    bahagian.forEach(b => {
      const kunci = kunciL[b.letter]; if (!kunci.length) return; const log = catatan(rT, b.letter, kunci, 'auto'); const bs = basi.filter(k => kunci.includes(k)); if (bs.length) log.basi = bs;
      if (berkongsi) log.kongsi = berkongsi;
      gabung.medan.push(...log.medan); gabung.n += log.n; gabung.ditolak.push(...log.ditolak);
      if (log.medan.length || log.ditolak.length || !logSemua[b.letter]) { logSemua[b.letter] = log; ubahLog = true; }
    });
    const tulis = Object.assign({}, pinda); if (ubahLog) tulis.bahasaIsi = logSemua;
    if (Object.keys(tulis).length) { await R.writeNow(id, tulis); if (R.S.currentId === id) R.mergeIntoForm(); }
    return gabung;
  }

  /* ---- atas permintaan: teks yang sudah ada dalam rekod (satu bahagian atau A hingga F dalam satu panggilan) ---- */
  function julat(teks, frasa) {
    const r = []; frasa.forEach(f => { if (!f || f.length < 2) return; let i = teks.indexOf(f); while (i >= 0) { r.push([i, i + f.length]); i = teks.indexOf(f, i + f.length); } });
    r.sort((a, b) => a[0] - b[0]); const out = []; r.forEach(x => { const l = out[out.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else out.push(x.slice()); }); return out;
  }
  function serlah(teks, frasa) { const s = String(teks || ''); let out = ''; let p = 0; julat(s, frasa).forEach(([a, b]) => { out += esc(s.slice(p, a)) + '<mark>' + esc(s.slice(a, b)) + '</mark>'; p = b; }); return out + esc(s.slice(p)); }
  function htmlSemak(berubah, r) {
    const nP = r.pindaan.length;
    return `<div class="help">Agen bahasa mencadangkan pindaan pada ${berubah.length} medan${nP ? ' (' + nP + ' pindaan disenaraikan)' : ''}. Angka, simbol statistik, petikan dan jejak muka surat sudah disahkan tidak berubah. Buang tanda pada medan yang tidak mahu dipinda, kemudian klik Terima pindaan terpilih.</div>
      ${berubah.map(x => { const pind = r.pindaan.filter(p => p.k === x.k); return `<div class="bh-medan"><label class="bh-pilih"><input type="checkbox" id="bhT_${esc(x.k)}" checked> <b>${esc(x.label)}</b> <small>Bahagian ${esc(x.letter)}</small></label><div class="bh-dua"><div><span>Sebelum</span><p>${serlah(x.teks, pind.map(p => p.asal))}</p></div><div><span>Selepas</span><p>${serlah(r.baharu[x.k], pind.map(p => p.baharu))}</p></div></div>${pind.length ? `<ul class="bh-pindaan">${pind.map(p => `<li><s>${esc(p.asal)}</s> <b>${esc(p.baharu)}</b>${p.sebab ? ' <i>' + esc(p.sebab) + '</i>' : ''}</li>`).join('')}</ul>` : ''}</div>`; }).join('')}
      ${r.ditolak.length ? `<div class="help bad">Pindaan pada ${r.ditolak.map(x => esc(x.label) + ' (' + esc(x.sebab) + ')').join('; ')} tidak diterima oleh pengawal isi; teks asal medan itu dikekalkan.</div>` : ''}`;
  }
  function setBtn(letters, text, busy) {
    letters.forEach(L => $$('[data-piawai="' + L + '"]').forEach(b => { b.disabled = !!busy; b.textContent = text || 'Piawaikan bahasa'; }));
    const s = $('#btnPiawaiSemua'); if (s && letters.length > 1) { s.disabled = !!busy; s.textContent = text || 'Piawaikan bahasa (A hingga F)'; }
  }
  async function piawaikan(id, letters) {
    if (!id || !R.S.docs.has(id)) { toast('Buka rekod artikel dahulu', true); return null; }
    const sibuk = 'bh:' + id; if (Bh.busy.has(sibuk)) return null;
    const t = await R.Isi.tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return null; }
    const d0 = rekodSemasa(id); const senarai = [];
    letters.forEach(L => medanBahagian(L).forEach(f => { const v = d0[f.k]; if (typeof v === 'string' && v.trim().length >= PANJANG_MIN) senarai.push({ k: f.k, label: f.label, teks: v, letter: L }); }));
    const skop = letters.length > 1 ? 'Bahagian ' + letters[0] + ' hingga ' + letters[letters.length - 1] : 'Bahagian ' + letters[0];
    if (!senarai.length) { toast(skop + ': tiada teks yang cukup panjang untuk dipiawaikan.'); return null; }
    const anggaran = anggarToken(systemPrompt()) + anggarToken(tugas(senarai));
    if (!R.lsGet('rslr_bahasa_faham', false)) {
      const okk = await R.confirmBox('Agen Bahasa Prof Dr Claude', `Teks ${senarai.length} medan (bukan PDF) akan dihantar ke API Anthropic menggunakan kunci API Prof Dr dan dicaj kepada akaun Anthropic Prof Dr: anggaran ${angka(anggaran)} token masuk bagi panggilan ini, jauh lebih kecil daripada isian daripada PDF. Agen hanya meminda bahasa; pindaan dipaparkan dahulu untuk disemak sebelum diterima.`, 'Faham, teruskan', false);
      if (!okk) return null; R.lsSet('rslr_bahasa_faham', true);
    }
    Bh.busy.add(sibuk); setBtn(letters, 'Agen bahasa sedang menyemak', true);
    try {
      const r = await agen(t, senarai); Bh.terakhir = r;
      const berubah = senarai.filter(x => r.baharu[x.k] !== undefined);
      const tokenTeks = `token masuk ${angka(r.usage.masuk + r.usage.cacheBaca + r.usage.cacheTulis)}, keluar ${angka(r.usage.keluar)}`;
      if (!berubah.length) { toast(`${skop}: agen bahasa tidak menemui apa-apa yang perlu dipinda${r.ditolak.length ? '; ' + r.ditolak.length + ' cadangan ditolak oleh pengawal isi' : ''} (${tokenTeks}).`); return r; }
      const ok = await R.richModal('Pindaan bahasa untuk disemak', htmlSemak(berubah, r), 'Terima pindaan terpilih', 'Batal');
      if (!ok) { toast('Tiada pindaan dibuat; teks asal dikekalkan.'); return r; }
      const v = R.richModal.values || {}; const d1 = rekodSemasa(id); const patch = {}; const basi = [];
      berubah.forEach(x => { if (v['bhT_' + x.k] === false) return; if (String(d1[x.k] || '') !== x.teks) { basi.push(x.label); return; } patch[x.k] = r.baharu[x.k]; });
      const diterima = Object.keys(patch);
      if (!diterima.length) { toast(basi.length ? 'Medan berubah semasa agen bekerja (' + basi.join(', ') + '); tiada pindaan dibuat.' : 'Tiada medan ditanda; teks asal dikekalkan.', !!basi.length); return r; }
      const rTerima = Object.assign({}, r, { baharu: patch, pindaan: r.pindaan.filter(p => patch[p.k] !== undefined) });
      const log = Object.assign({}, d1.bahasaIsi || {});
      letters.forEach(L => { const kunci = senarai.filter(x => x.letter === L).map(x => x.k); if (kunci.some(k => patch[k] !== undefined)) log[L] = catatan(rTerima, L, kunci, 'minta'); });
      patch.bahasaIsi = log;
      await R.writeNow(id, patch);
      if (R.S.currentId === id) R.mergeIntoForm();
      toast(`${skop}: bahasa ${diterima.length} medan dipiawaikan (${rTerima.pindaan.length} pindaan disenaraikan; ${tokenTeks})${basi.length ? '. Tidak dipinda kerana berubah semasa agen bekerja: ' + basi.join(', ') : ''}.`);
      return r;
    } catch (e) { toast('Agen bahasa gagal: ' + msg(e) + ' Teks asal tidak diubah.', true); return null; }
    finally { Bh.busy.delete(sibuk); setBtn(letters, null, false); }
  }

  /* ---- cip status pada kepala setiap bahagian ---- */
  function renderStat(d0) {
    const id = R.S.currentId; const d = d0 ? Object.assign({}, d0, (id && R.S.pending[id]) || {}) : null;
    GROUPS.forEach(g => {
      const el = document.querySelector('[data-bhstat="' + g.letter + '"]'); if (!el) return;
      if (!d) { el.hidden = true; el.textContent = ''; return; }
      const n = semakBahagian(d, g.letter).reduce((s, x) => s + x.hits.length, 0); const st = (d.bahasaIsi || {})[g.letter];
      if (n) { el.hidden = false; el.className = 'ai-stat bh-stat warn'; el.textContent = n + ' istilah untuk disemak'; el.title = 'Pengesan istilah (tanpa token) menemui ' + n + ' perkara dalam bahagian ini. Klik untuk melihat senarainya.'; }
      else if (st && st.masa) { el.hidden = false; el.className = 'ai-stat bh-stat'; el.textContent = (st.medan || []).length ? 'Bahasa dipiawaikan' + (st.n ? ', ' + st.n + ' pindaan' : '') : 'Bahasa disemak, tiada pindaan'; el.title = 'Agen bahasa ' + R.fmtTime(st.masa) + (st.model ? ' (' + String(st.model).replace('claude-', '') + ')' : '') + (st.token ? '; token masuk ' + ((st.token.masuk || 0) + (st.token.cacheBaca || 0) + (st.token.cacheTulis || 0)) + ', keluar ' + (st.token.keluar || 0) + (st.kongsi ? ' (satu panggilan bagi bahagian ' + st.kongsi + ')' : '') : '') + '. Klik untuk melihat pindaan.'; }
      else { el.hidden = true; el.textContent = ''; }
    });
    const b = $('#btnPiawaiSemua'); if (b) b.hidden = !d;
  }
  async function bukaStat(letter) {
    const id = R.S.currentId; if (!id) return; const d = rekodSemasa(id); const semak = semakBahagian(d, letter); const st = (d.bahasaIsi || {})[letter];
    if (semak.length) {
      const html = `<div class="help">Pengesan ini berjalan pada peranti dan tidak menggunakan token. Ia menanda bentuk Indonesia, istilah yang tidak selaras dengan senarai istilah Prof Dr, kesan terjemahan dan perkataan yang dilarang. Teks dalam tanda petik tidak disemak kerana ia petikan asal. Betulkan sendiri, atau minta agen bahasa memiawaikan bahagian ini.</div>
        ${semak.map(x => `<div class="bh-medan"><b>${esc(x.label)}</b><ul class="bh-pindaan">${x.hits.map(h => `<li><s>${esc(h.asal)}</s> <b>${esc(h.ganti)}</b> <i>${esc(JENIS_NAMA[h.jenis] || '')}</i></li>`).join('')}</ul></div>`).join('')}`;
      const ok = await R.richModal('Bahagian ' + letter + ': istilah untuk disemak', html, 'Piawaikan bahasa bahagian ini', 'Tutup');
      if (ok) piawaikan(id, [letter]);
      return;
    }
    if (st && st.masa) {
      const html = `<div class="help">Agen bahasa ${esc(R.fmtTime(st.masa))}${st.model ? ' (' + esc(String(st.model).replace('claude-', '')) + ')' : ''}, ${st.cara === 'auto' ? 'selepas isian automatik' : 'atas permintaan'}: ${(st.medan || []).length} medan dipinda.${st.token ? ' Token masuk ' + angka((st.token.masuk || 0) + (st.token.cacheBaca || 0) + (st.token.cacheTulis || 0)) + ', keluar ' + angka(st.token.keluar) + '.' : ''}${(st.ditolak || []).length ? ' Ditolak oleh pengawal isi: ' + esc(st.ditolak.join('; ')) + '.' : ''}</div>
        ${(st.pindaan || []).length ? `<ul class="bh-pindaan">${st.pindaan.map(p => `<li><small>${esc((R.FIELD_BY_KEY[p.k] || {}).label || p.k)}</small> <s>${esc(p.asal)}</s> <b>${esc(p.baharu)}</b>${p.sebab ? ' <i>' + esc(p.sebab) + '</i>' : ''}</li>`).join('')}</ul>` : '<div class="help">Tiada pindaan disenaraikan.</div>'}`;
      await R.richModal('Bahagian ' + letter + ': pindaan bahasa terakhir', html, 'Tutup');
    }
  }
  $('#form').addEventListener('click', e => {
    const b = e.target.closest('[data-piawai]'); if (b) { e.preventDefault(); piawaikan(R.S.currentId, [b.dataset.piawai]); return; }
    const c = e.target.closest('[data-bhstat]'); if (c) { e.preventDefault(); bukaStat(c.dataset.bhstat); }
  });
  /* ---- semakan bahasa semua rekod (tanpa token): rekod mana yang masih memuatkan istilah untuk dipiawaikan ---- */
  function semakSemua() {
    const out = [];
    R.S.docs.forEach((d0, id) => {
      const d = Object.assign({}, d0, R.S.pending[id] || {}); let n = 0; const kira = new Map(); const bahagian = [];
      GROUPS.forEach(g => { const s = semakBahagian(d, g.letter); const m = s.reduce((a, x) => a + x.hits.length, 0); if (!m) return; n += m; bahagian.push(g.letter); s.forEach(x => x.hits.forEach(h => { const k = h.asal.toLowerCase(); kira.set(k, (kira.get(k) || 0) + 1); })); });
      if (n) out.push({ id, bil: Number(d.bil) || 0, nama: (d.penulis || 'Penulis belum diisi') + (d.tahun ? ' (' + d.tahun + ')' : ''), n, bahagian, istilah: Array.from(kira.entries()).sort((a, b) => b[1] - a[1]).map(x => x[0]) });
    });
    return out.sort((a, b) => b.n - a.n || a.bil - b.bil);
  }
  const HAD_LAPORAN = 300;
  async function laporanSemua() {
    const jumlahRekod = R.S.docs.size; if (!jumlahRekod) { toast('Belum ada rekod dalam repositori.'); return []; }
    const s = semakSemua();
    if (!s.length) { toast(`Semakan bahasa: tiada istilah untuk disemak dalam ${angka(jumlahRekod)} rekod.`); return s; }
    const jumlah = s.reduce((a, x) => a + x.n, 0);
    const html = `<div class="help">Pengesan istilah berjalan pada peranti ini dan tidak menggunakan token. Ia menemui ${angka(jumlah)} perkara dalam ${angka(s.length)} daripada ${angka(jumlahRekod)} rekod: bentuk Indonesia, istilah yang tidak selaras dengan senarai istilah Prof Dr, kesan terjemahan dan perkataan yang dilarang. Rekod disusun daripada yang paling banyak. Klik Buka rekod, kemudian gunakan butang Piawaikan bahasa (A hingga F) pada rekod itu; pengesan hanya menanda dan tiada teks yang diubah di sini.</div>
      <div class="bh-senarai">${s.slice(0, HAD_LAPORAN).map(x => `<div class="bh-baris"><span class="bh-bil">Bil. ${esc(x.bil || '?')}</span><span class="bh-nama"><b>${esc(x.nama)}</b><small>Bahagian ${esc(x.bahagian.join(', '))}: ${esc(x.istilah.slice(0, 5).join(', '))}${x.istilah.length > 5 ? ' dan ' + (x.istilah.length - 5) + ' lagi' : ''}</small></span><span class="bh-n" title="Bilangan perkara untuk disemak">${x.n}</span><button type="button" class="btn btn-sm" data-bhbuka="${esc(x.id)}">Buka rekod</button></div>`).join('')}</div>${s.length > HAD_LAPORAN ? `<div class="help">${angka(s.length - HAD_LAPORAN)} rekod lagi tidak dipaparkan; piawaikan rekod di atas dahulu, kemudian buka semakan ini semula.</div>` : ''}`;
    await R.richModal('Semakan bahasa semua rekod', html, 'Tutup');
    return s;
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-bhbuka]'); if (!b) return; e.preventDefault(); const id = b.dataset.bhbuka; $('#modalOk').click(); R.openRecord(id); });
  /* Cip dikemas kini semasa Prof Dr membetulkan teks sendiri (tanpa token; selepas berhenti menaip seketika). */
  let tmCip = null;
  $('#form').addEventListener('input', e => { const k = e.target && e.target.dataset && e.target.dataset.k; if (!k || !bolehPiawai(k)) return; clearTimeout(tmCip); tmCip = setTimeout(() => { const id = R.S.currentId; if (id && R.S.docs.has(id)) renderStat(R.S.docs.get(id)); }, 600); });
  /* Cip status boleh dicapai dengan papan kekunci (Enter atau Space), seperti butang. */
  $('#form').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('[data-bhstat]')) { e.preventDefault(); bukaStat(e.target.dataset.bhstat); } });
  const bs = $('#btnPiawaiSemua'); if (bs) bs.addEventListener('click', () => piawaikan(R.S.currentId, GROUPS.map(g => g.letter)));
  return { piawaikan, selepasIsi, selepasIsiSemua, agen, renderStat, bukaStat, semakBahagian, semakSemua, laporanSemua, bolehPiawai, systemPrompt, tugas, msg, ringkas, SKEMA, KECUALI, state: Bh };
}
