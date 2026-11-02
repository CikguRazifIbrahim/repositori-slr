/* "Mohon Prof Dr Claude isikan": pembantu yang membaca keseluruhan PDF artikel dan mengisi medan satu bahagian
   (A hingga F) sebagai draf permulaan. Panggilan dibuat terus dari pelayar ke API Anthropic dengan kunci API
   Prof Dr sendiri (disimpan dalam Tetapan). Hanya medan yang masih kosong diisi; nilai yang sudah ditulis dikekalkan. */
export function initIsi(R) {
  const { $, $$, esc, toast, GROUPS, FIELD_BY_KEY } = R;
  const API = 'https://api.anthropic.com/v1/messages';
  const MODEL_DEFAULT = 'claude-sonnet-5-5';
  const MODELS = [['claude-sonnet-5-5', 'Claude Sonnet 5.5 (seimbang, disyorkan)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (paling pantas dan murah)'], ['claude-opus-5-5', 'Claude Opus 5.5 (paling teliti, kos tertinggi)']];
  const SKIP = new Set(['catatan']);
  const I = { cache: new Map(), busy: new Set(), semua: false, mod: {} };
  const PROFIL_DEFAULT = `Tajuk: Pengaruh Kepimpinan Digital Guru Besar terhadap Kompetensi Digital Guru dengan Pengurusan Pengetahuan Organisasi sebagai Perantara di Sekolah Rendah Negeri Perak (calon PhD, Universiti Pendidikan Sultan Idris).
Model: pemboleh ubah bebas Kepimpinan Digital Guru Besar (KD; kerangka ISTE Standards for Education Leaders 2024, lima dimensi: Penyokong Kewarganegaraan Digital, Perancang Berwawasan, Pemimpin Pemerkasa, Pereka Bentuk Sistem, Pembelajar Berhubung); pemboleh ubah perantara Pengurusan Pengetahuan Organisasi (PPO; Model SECI Nonaka dan Takeuchi: Sosialisasi, Eksternalisasi, Kombinasi, Internalisasi, serta konsep Ba dan Pandangan Berasaskan Pengetahuan Grant 1996; dilihat sebagai amalan dan tahap amalan); pemboleh ubah bersandar Kompetensi Digital Guru (KDG; DigCompEdu Redecker 2017, enam bidang, 22 kompetensi).
Hipotesis: H1 KD mempengaruhi KDG secara langsung; H2 KD mempengaruhi PPO; H3 PPO mempengaruhi KDG; H4 PPO mengantara hubungan KD dengan KDG (kesan tidak langsung a x b).
Teori penambat: Kepimpinan Transformasional (Bass), Teori Kognitif Sosial (Bandura), SECI dan Ba (Nonaka), KBV (Grant), model kesan perantara kepimpinan sekolah (Hallinger dan Heck 1998), kepimpinan berorientasikan pengetahuan (Donate dan Sanchez de Pablo 2015). Prinsip: laluan tingkah laku, bukan model penerimaan teknologi (TAM, UTAUT tidak sejajar).
Metodologi: kuantitatif, bukan eksperimen, keratan rentas, tinjauan soal selidik; guru menilai guru besar (penilaian silang) dan menilai diri bagi PPO dan KDG; sekolah rendah Negeri Perak dengan perbandingan bandar dan luar bandar; persampelan kelompok berstrata pelbagai peringkat; instrumen 138 item (KD 61, KDG 37, PPO 40), skala kekerapan 1 hingga 10; kesahan kandungan (CVI pakar), EFA dan CFA; analisis CB-SEM dengan IBM SPSS Amos; pengujian perantara dengan bootstrap 5,000 resampel dan selang keyakinan terbetul pincang 95 peratus mengikut tipologi Zhao, Lynch dan Chen (2010).
Bab tesis: Bab 1 Pengenalan dan pernyataan masalah; Bab 2 Sorotan literatur (konsep dan teori KD, PPO, KDG; kajian lepas; kerangka konseptual); Bab 3 Metodologi; Bab 4 Dapatan; Bab 5 Perbincangan.`;

  /* ---- tetapan ---- */
  async function tetapan() { let m = {}; try { m = (await R.db().getMeta()) || {}; } catch (e) {} return { key: String(m.anthropicKey || '').trim(), model: String(m.anthropicModel || MODEL_DEFAULT).trim() || MODEL_DEFAULT, profil: String(m.profilKajian || '').trim() || PROFIL_DEFAULT }; }

  /* ---- teks penuh artikel ---- */
  function pageText(items) {
    let out = '';
    for (const it of items) { if (!it.str) { if (it.hasEOL) out += '\n'; continue; } out += it.str; out += it.hasEOL ? '\n' : (it.str.endsWith(' ') ? '' : ' '); }
    return out.replace(/([A-Za-zÀ-ɏ])-\n\s*([a-zà-ɏ])/g, '$1$2').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function b64(buf) { const u8 = new Uint8Array(buf); let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
  async function bacaArtikel(id, onStatus) {
    const d = R.S.docs.get(id); const entry = (d && d.fail || [])[0]; if (!entry) throw { code: 'no_pdf' };
    if (I.cache.has(entry.id)) return I.cache.get(entry.id);
    onStatus && onStatus('Mengambil PDF');
    let buf;
    if (R.V.cache.has(entry.id)) buf = R.V.cache.get(entry.id).slice(0);
    else { if (!R.drive().hasToken()) { const ok = await R.ensureDrive(true); if (!ok) throw { code: 'no_token' }; } const b = await R.drive().download(entry.id); R.keepCache(entry.id, b); buf = b.slice(0); }
    onStatus && onStatus('Membaca teks PDF');
    const lib = await R.loadPdfJs(); const doc = await lib.getDocument({ data: buf.slice(0), stopAtErrors: false }).promise;
    let text = ''; const n = doc.numPages;
    try { for (let p = 1; p <= n; p++) { try { const pg = await doc.getPage(p); const tc = await pg.getTextContent(); text += `\n\n[m.s. ${p}]\n` + pageText(tc.items); } catch (e) {} } } finally { try { await doc.destroy(); } catch (e) {} }
    text = text.trim(); const HAD = 500000;
    if (text.length > HAD) { const potong = text.slice(0, HAD); const m = potong.match(/\[m\.s\. (\d+)\]/g); text = potong + `\n\n[Nota: teks dipotong selepas ${m ? m[m.length - 1] : '[m.s. ?]'} kerana terlalu panjang; ${n} muka surat kesemuanya.]`; }
    const out = { nama: entry.nama || '', pages: n, text, bytes: buf.byteLength, pdf: null };
    if (out.text.replace(/\[m\.s\. \d+\]/g, '').replace(/\s+/g, ' ').trim().length < 1500) { if (n > 100) throw { code: 'scan_besar', pages: n }; out.pdf = b64(buf); }
    I.cache.set(entry.id, out); return out;
  }

  /* ---- spesifikasi medan dan panduan bahagian ---- */
  const PANDUAN = {
    A: 'Ambil butiran daripada kepala artikel (jurnal, jilid, isu, halaman, DOI, tahun terbit sebenar). "rujukan": susun rujukan APA 7 lengkap daripada maklumat yang ada dalam PDF; jika jilid atau halaman tiada, tinggalkan bahagian itu dan jangan mereka. "penulis": nama keluarga penulis pertama diikuti "et al." jika tiga penulis atau lebih, atau "A dan B" jika dua. "jenis": ikut reka bentuk sebenar artikel. "indeks" dan "kuartil": hanya jika artikel sendiri menyatakannya, jika tidak "Tidak pasti". "negara": negara lokasi kutipan data. "peringkat" dan "lokasi": ikut sampel kajian. "tema": tema utama yang paling hampir dengan konstruk teras artikel.',
    B: '"objektif": perkara yang hendak dibuktikan, satu hingga dua ayat. "konstruk": senaraikan setiap konstruk dengan peranannya (bebas, perantara, penyederhana, bersandar, kawalan) dan dimensinya; gunakan titik koma antara konstruk. "definisi": takrif setiap konstruk teras dalam ayat sendiri, disertai petikan asal pendek dalam tanda petik dan muka surat. "teori": nama teori atau model yang dijadikan asas serta sumber primernya seperti yang disitasi artikel (penulis dan tahun). "asasTeori": Tingkah laku bagi teori kepimpinan, organisasi atau kognitif sosial; Teknologi bagi TAM, UTAUT, TPB penerimaan teknologi; Kedua-dua jika digabung.',
    C: '"rekaBentuk": ikut artikel. "penilai": siapa menilai siapa, misalnya guru menilai guru besar bermakna guru menjadi responden yang menilai pemimpin. "sampel": siapa, berapa ramai, cara dipilih, kadar respons, dengan muka surat. "instrumen": sumber adaptasi setiap skala, bilangan item, jenis skala, alfa Cronbach, CR dan AVE jika dilaporkan, dengan muka surat. "teknik": teknik analisis utama (contoh CB-SEM, PLS-SEM, regresi berganda, analisis tematik). "perisian": perisian dan prosedur (contoh AMOS, SmartPLS, bootstrapping 5,000).',
    D: '"dapatan": laporkan setiap laluan atau hipotesis dengan pekali (beta), nilai p atau t, R kuasa dua, kesan tidak langsung dan jenis perantaraan jika ada; masukkan juga laluan yang tidak signifikan; setiap angka dengan muka surat; gunakan titik koma antara dapatan; padatkan kepada kira-kira 1,500 aksara (dapatan paling penting dahulu). "cabaran": halangan atau cabaran yang dilaporkan berkaitan kepimpinan digital, perkongsian pengetahuan atau kompetensi digital guru. "implikasi": kesimpulan artikel serta implikasi teori dan implikasi amalan atau dasar seperti yang dinyatakan pengarang.',
    E: '"batasan": batasan dan cadangan kajian lanjutan yang diakui pengarang sendiri, dengan muka surat. "jurang": jurang yang terserlah daripada artikel ini dan cara kajian Prof Dr (lihat profil) boleh mengisinya; nyatakan secara spesifik (konteks, populasi, teori, kaedah atau empirikal). "jenisJurang": pilih jenis jurang yang berkaitan. "kekuatan": kekuatan metodologi dan sumbangan artikel. "kelemahan": kritikan kritis, misalnya bias kaedah sepunya, sampel kecil atau bukan rawak, dakwaan sebab akibat daripada data keratan rentas, kesahan instrumen tidak dilaporkan. "mmat": nilai lima kriteria MMAT 2018 bagi kategori reka bentuk berkenaan (contoh kuantitatif deskriptif: persampelan relevan, sampel mewakili, pengukuran sesuai, risiko bias bukan respons rendah, analisis statistik sesuai); tulis setiap kriteria sebagai Ya, Tidak atau Tidak pasti dengan sebab ringkas.',
    F: '"relevansi": Tinggi jika artikel mengkaji sekurang-kurangnya dua daripada tiga konstruk kajian Prof Dr (kepimpinan digital atau kepimpinan sekolah, pengurusan atau perkongsian pengetahuan, kompetensi digital guru) dalam konteks sekolah dengan kaedah kuantitatif; Sederhana-Tinggi jika satu konstruk teras dengan kaedah yang serupa atau dua konstruk dengan kaedah berbeza; Sederhana jika satu konstruk; Rendah jika hanya konteks umum. "jenisKesan": kesan yang diuji artikel (Langsung, Perantaraan, Kedua-dua, Tiada). "alasanRelevansi": satu ayat. "padananKdPpo": YA jika artikel memberi bukti empirikal atau hujah teori bagi hubungan kepimpinan (digital) dengan pengurusan atau perkongsian pengetahuan; "padananPpoKdg": YA jika bagi hubungan pengurusan pengetahuan dengan kompetensi digital guru; TIDAK jika hubungan itu tidak disentuh; Tidak pasti jika hanya tersirat. "bandingan": bandingkan dengan artikel lain dalam repositori Prof Dr yang disenaraikan (selari, bercanggah atau melanjutkan), rujuk sebagai Penulis (Tahun); jika senarai kosong, tulis "Tiada artikel lain untuk dibandingkan buat masa ini". "bab": bab tesis yang paling sesuai memetik artikel ini. "subtopik": cadangan subtopik Bab 2 secara umum, contohnya 2.x Kepimpinan digital dan pengurusan pengetahuan. "jejak": rujukan dalam artikel yang perlu dibaca daripada teks asal, terutamanya teori atau instrumen yang dipetik secara sekunder, dalam bentuk Penulis (Tahun) dan nama karya.'
  };
  function spec(letter) {
    const g = GROUPS.find(x => x.letter === letter); if (!g) return null;
    const fields = []; g.medan.forEach(m => m.fields.forEach(f => { if (!SKIP.has(f.k)) fields.push(Object.assign({ medan: m.n + '. ' + m.title }, f)); }));
    return { g, fields };
  }
  function fieldLine(f) {
    const jenis = f.type === 'select' ? `pilih TEPAT SATU daripada: ${f.opts.join(' | ')}` : f.type === 'multi' ? `senarai JSON, subset daripada: ${f.opts.join(' | ')}` : f.type === 'textarea' ? 'teks' : 'teks pendek';
    return `- "${f.k}" (${jenis}): ${f.label}${f.help ? '. ' + f.help : ''}`;
  }
  function nilaiKosong(v) { return v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === ''); }
  function rekodSemasa(id) { const d = R.S.docs.get(id) || {}; return Object.assign({}, d, R.S.pending[id] || {}); }
  function ringkasRekod(d) {
    const parts = []; [['tajuk', 'Tajuk'], ['penulis', 'Penulis'], ['tahun', 'Tahun'], ['tema', 'Tema'], ['doi', 'DOI'], ['objektif', 'Objektif'], ['konstruk', 'Konstruk'], ['rekaBentuk', 'Reka bentuk'], ['dapatan', 'Dapatan']].forEach(([k, l]) => { if (!nilaiKosong(d[k])) parts.push(l + ': ' + String(d[k]).slice(0, 400)); });
    return parts.join('\n');
  }
  function digestLain(id, tema) {
    const out = []; const arr = Array.from(R.S.docs.entries()).filter(([k, d]) => k !== id && (d.tajuk || d.penulis));
    arr.sort((a, b) => ((b[1].tema === tema) - (a[1].tema === tema)) || (parseInt(b[1].tahun, 10) || 0) - (parseInt(a[1].tahun, 10) || 0));
    arr.slice(0, 12).forEach(([k, d], i) => { out.push(`${i + 1}. ${d.penulis || 'Penulis tidak diisi'} (${d.tahun || 't.t.'}). ${(d.tajuk || '').slice(0, 160)}.${d.tema ? ' Tema: ' + d.tema + '.' : ''}${d.objektif ? ' Objektif: ' + String(d.objektif).slice(0, 180) + '.' : ''}${d.dapatan ? ' Dapatan: ' + String(d.dapatan).slice(0, 300) + '.' : ''}`); });
    return out.join('\n');
  }
  function systemPrompt(profil) {
    return `Anda ialah Prof Dr Claude, pembantu penyelidikan akademik kepada seorang calon PhD (dipanggil Prof Dr) di Universiti Pendidikan Sultan Idris. Tugas anda: membaca TEKS PENUH satu artikel jurnal dan mengisi medan ekstrak Jadual Sorotan Literatur Sistematik sebagai DRAF PERMULAAN yang akan disemak dan diperhalusi sendiri oleh Prof Dr selepas beliau membaca artikel itu.

Peraturan yang mesti dipatuhi:
1. Bahasa: Bahasa Melayu Malaysia baku, laras akademik setaraf penulisan Scopus dan Web of Science; gunakan istilah Malaysia (guru besar, dapatan, kajian, responden), bukan Indonesia. Nama konstruk, teori dan istilah teknikal Inggeris boleh dikekalkan dalam kurungan apabila membantu. Jangan gunakan sempang em atau en; gunakan koma, titik bertindih atau perkataan "hingga".
2. Sifar fabrikasi: tulis hanya apa yang dinyatakan dalam teks artikel. Jangan mereka angka, saiz sampel, nama instrumen, nilai alfa Cronbach, teori, rujukan atau nombor muka surat. Jika artikel tidak melaporkan sesuatu, tulis "Tiada dalam artikel". Jika anda tidak pasti, tulis "Tidak pasti" dan nyatakan sebabnya secara ringkas.
3. Jejak halaman: setiap angka statistik, definisi dan batasan disertai muka surat dalam bentuk (m.s. N) berdasarkan penanda [m.s. N] dalam teks artikel.
4. Salin tepat hanya tiga perkara: rujukan, angka statistik dan petikan definisi pendek (dalam tanda petik, bahasa asal). Selebihnya tulis dalam ayat sendiri yang padat, analitik dan bersifat sintesis.
5. Medan pilihan: pilih TEPAT satu pilihan daripada senarai yang diberi dan salin ejaannya tepat. Medan pilihan berbilang: pulangkan senarai JSON yang merupakan subset senarai pilihan (boleh kosong).
6. Medan teks: satu hingga tiga ayat; medan "dapatan", "instrumen" dan "konstruk" boleh lebih panjang tetapi padat. Jangan gunakan senarai berbutir Markdown; gunakan titik koma untuk memisahkan butiran.
7. Kaitkan dengan kajian Prof Dr (profil di bawah) hanya pada medan yang memintanya (jurang, relevansi, padanan, bandingan, bab, subtopik); jangan mengada-adakan kaitan jika memang tiada.
8. Format output: SATU objek JSON sahaja mengikut skema yang disediakan (atau melalui alat isi_medan jika alat itu diberi), tanpa teks pengantar, tanpa penutup dan tanpa pagar kod. Kunci tepat seperti yang diminta; kunci medan yang tidak diminta ditinggalkan, atau jika skema mewajibkannya, diisi dengan "-". Nilai rentetan dalam satu perenggan.

Profil kajian Prof Dr:
${profil}`;
  }
  function taskPrompt(letter, sp, d, lainTeks) {
    const kosong = sp.fields.filter(f => nilaiKosong(d[f.k])); const berisi = sp.fields.filter(f => !nilaiKosong(d[f.k]));
    return `Bahagian ${letter}. ${sp.g.title} (${sp.g.sub}).

Isi medan berikut (hanya medan yang disenaraikan) dan pulangkan satu objek JSON dengan kunci tepat:
${kosong.map(fieldLine).join('\n')}
${berisi.length ? `\nMedan berikut sudah diisi oleh Prof Dr dan TIDAK perlu dipulangkan (untuk konteks sahaja):\n${berisi.map(f => `- ${f.k}: ${String(Array.isArray(d[f.k]) ? d[f.k].join(', ') : d[f.k]).slice(0, 300)}`).join('\n')}\n` : ''}
Panduan khusus bahagian ini: ${PANDUAN[letter] || ''}
${lainTeks ? `\nArtikel lain dalam repositori Prof Dr (untuk medan bandingan silang sahaja):\n${lainTeks}\n` : ''}
Maklumat rekod sedia ada:
${ringkasRekod(d) || '(tiada)'}

Pulangkan JSON sekarang.`;
  }

  /* ---- panggilan API ---- */
  /* Output berstruktur. Model keluarga 5.5 (Sonnet, Opus) menolak tool_choice "tool" dan "any" dengan ralat 400, maka mod lalai ialah
     output_config.format (json_schema): API menjamin teks jawapan ialah JSON yang sah mengikut skema. Satu skema dikongsi oleh semua
     bahagian supaya awalan cache prompt kekal sama (menukar output_config.format membatalkan cache). Had API: 24 medan pilihan (optional)
     bagi setiap permintaan, maka 19 medan pendek diwajibkan (nilai "-" jika bukan bahagian yang diminta) dan 22 medan panjang dibiarkan pilihan.
     Jika API menolak skema (400), aplikasi beralih kepada alat isi_medan dengan tool_choice auto, kemudian kepada teks JSON biasa; mod
     yang berjaya diingati bagi setiap model (I.mod). Ralat 400 tidak dicaj token. */
  const MOD_TURUTAN = ['skema', 'alat', 'teks'];
  const WAJIB_TEKS = new Set(['penulis', 'tahun', 'doi', 'negara', 'teknik', 'perisian']);
  const TIADA = '-';
  function senaraiMedan() {
    const out = [];
    GROUPS.forEach(g => g.medan.forEach(m => m.fields.forEach(f => { if (!SKIP.has(f.k)) out.push(Object.assign({ letter: g.letter, n: m.n }, f)); })));
    return out;
  }
  function sifatMedan(f, wajib) {
    const desc = `${f.letter}${f.n} ${f.label}` + (wajib ? ` ("${TIADA}" jika bukan bahagian yang diminta atau tidak jelas daripada artikel)` : '');
    if (f.type === 'select') return { type: 'string', enum: wajib ? f.opts.concat([TIADA]) : f.opts, description: desc };
    if (f.type === 'multi') return { type: 'array', items: { type: 'string', enum: f.opts }, description: desc };
    return { type: 'string', description: desc };
  }
  function skemaJson() {
    const props = {}; const required = [];
    senaraiMedan().forEach(f => { const wajib = f.type === 'select' || WAJIB_TEKS.has(f.k); props[f.k] = sifatMedan(f, wajib); if (wajib) required.push(f.k); });
    return { type: 'object', properties: props, required, additionalProperties: false };
  }
  function alatIsi() {
    const props = {}; senaraiMedan().forEach(f => { props[f.k] = sifatMedan(f, false); });
    return { name: 'isi_medan', description: 'Isi medan ekstrak Jadual SLR yang diminta dalam arahan bahagian. Sertakan hanya kunci yang diminta; tinggalkan kunci lain. Nilai teks dalam Bahasa Melayu Malaysia akademik, dengan muka surat (m.s. N) bagi angka dan petikan.', input_schema: { type: 'object', properties: props, additionalProperties: false } };
  }
  function modSemasa(kunci) { return MOD_TURUTAN.includes(I.mod[kunci]) ? I.mod[kunci] : MOD_TURUTAN[0]; }
  function modSeterusnya(mod) { const i = MOD_TURUTAN.indexOf(mod); return i >= 0 && i < MOD_TURUTAN.length - 1 ? MOD_TURUTAN[i + 1] : null; }
  /* Ralat 400 yang berpunca daripada cara output diminta (bukan daripada kandungan) membolehkan peralihan mod. */
  function sebabMod(mod, mesej) {
    const m = String(mesej || '').toLowerCase();
    if (mod === 'skema') return !m || /output_config|output_format|schema|format|grammar|structured/.test(m);
    if (mod === 'alat') return !m || /tool/.test(m);
    return false;
  }
  const HAD_TOKEN = 8192, HAD_TOKEN_ULANG = 16384;
  /* Penghantar generik (digunakan oleh "isi medan" dan modul lain seperti Banding Artikel): mod skema -> alat -> teks dengan ingatan
     mod bagi setiap kunci (model atau tujuan:model). content ialah senarai blok kandungan pengguna; skema ialah JSON Schema jawapan;
     alat ialah definisi alat bagi mod sandaran. */
  async function hantar(t, p) {
    const kunci = p.kunciMod || t.model; let mod = modSemasa(kunci);
    for (;;) {
      const content = p.content.slice();
      if (mod === 'alat' && p.alat) { const last = content[content.length - 1]; if (last && last.type === 'text') content[content.length - 1] = { type: 'text', text: last.text + '\n\nPanggil alat ' + p.alat.name + ' untuk memulangkan jawapan; jangan balas dalam bentuk teks.' }; }
      const body = { model: t.model, max_tokens: p.hadToken || HAD_TOKEN, system: [{ type: 'text', text: p.system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content }] };
      if (mod === 'skema' && p.skema) body.output_config = { format: { type: 'json_schema', schema: p.skema } };
      else if (mod === 'alat' && p.alat) { body.tools = [p.alat]; body.tool_choice = { type: 'auto' }; }
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 240000);
      let r;
      try { r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': t.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body), signal: ctl.signal }); }
      catch (e) { throw { code: e && e.name === 'AbortError' ? 'masa' : 'rangkaian', message: String(e && e.message || e) }; }
      finally { clearTimeout(tm); }
      let j = null; try { j = await r.json(); } catch (e) {}
      const mesej = (j && j.error && j.error.message) || '';
      if (r.status === 400 && sebabMod(mod, mesej)) {
        const lagi = modSeterusnya(mod);
        if (lagi) { console.warn('isi: mod "' + mod + '" ditolak API (' + mesej + '); beralih kepada mod "' + lagi + '"'); I.mod[kunci] = lagi; mod = lagi; continue; }
      }
      if (!r.ok) throw { code: 'http', status: r.status, message: mesej };
      I.mod[kunci] = mod;
      const blocks = (j && j.content) || [];
      const tool = blocks.find(b => b.type === 'tool_use' && b.input && typeof b.input === 'object');
      const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const u = (j && j.usage) || {}; const stop = j && j.stop_reason;
      I.lastRaw = { mod, text, tool: tool ? tool.input : null, stop };
      if (stop === 'refusal') throw { code: 'refusal' };
      return { input: tool ? tool.input : null, text, usage: { masuk: u.input_tokens || 0, keluar: u.output_tokens || 0, cacheTulis: u.cache_creation_input_tokens || 0, cacheBaca: u.cache_read_input_tokens || 0 }, stop, mod };
    }
  }
  async function panggil(t, system, artikel, task, hadToken) {
    const artBlock = artikel.pdf ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: artikel.pdf }, cache_control: { type: 'ephemeral' } }
      : { type: 'text', text: 'TEKS PENUH ARTIKEL (fail ' + artikel.nama + ', ' + artikel.pages + ' muka surat):\n\n' + artikel.text, cache_control: { type: 'ephemeral' } };
    return hantar(t, { kunciMod: t.model, system, content: [artBlock, { type: 'text', text: task }], skema: skemaJson(), alat: alatIsi(), hadToken });
  }
  /* Sandaran: jika model membalas teks (bukan alat), baiki JSON yang lazim rosak: pagar kod, tanda petik tidak dilepaskan di dalam
     rentetan, baris baharu mentah, koma hujung dan kurungan yang terpotong. */
  function baikiJson(src) {
    let out = ''; let inStr = false; let esc = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        if (esc) { out += c; esc = false; continue; }
        if (c === '\\') { out += c; esc = true; continue; }
        if (c === '"') {
          const after = src.slice(i + 1, i + 80); const m = /^\s*([,}\]:])/.exec(after); let end = i === src.length - 1;
          if (m) { if (m[1] !== ',') end = true; else { const rest = after.slice(m[0].length); end = /^\s*["}\]]/.test(rest) || /^\s*$/.test(rest); } }
          if (end) { inStr = false; out += c; } else out += '\\"'; continue;
        }
        if (c === '\n') { out += '\\n'; continue; } if (c === '\r') continue; if (c === '\t') { out += '\\t'; continue; }
        if (c.charCodeAt(0) < 32) continue;
        out += c; continue;
      }
      if (c === '"') { inStr = true; out += c; continue; }
      out += c;
    }
    if (inStr) out += '"';
    out = out.replace(/,\s*$/, '');
    let depth = 0; inStr = false; esc = false; const stack = [];
    for (const c of out) { if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; } if (c === '"') inStr = true; else if (c === '{' || c === '[') stack.push(c); else if (c === '}' || c === ']') stack.pop(); }
    while (stack.length) out += stack.pop() === '{' ? '}' : ']';
    return out.replace(/,(\s*[}\]])/g, '$1');
  }
  function parseJson(text, stop) {
    let s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const a = s.indexOf('{'); if (a < 0) throw { code: 'json', stop };
    const b = s.lastIndexOf('}'); const raw = s.slice(a, b > a ? b + 1 : undefined);
    try { return JSON.parse(raw); } catch (e) {}
    try { return JSON.parse(baikiJson(raw)); } catch (e) { throw { code: 'json', message: e.message, stop }; }
  }
  function msg(e) {
    const c = e && e.code; const st = e && e.status;
    if (c === 'no_pdf') return 'rekod ini belum ada fail PDF. Muat naik PDF dahulu.';
    if (c === 'no_key') return 'kunci API Anthropic belum ditetapkan (menu Tetapan).';
    if (c === 'no_token') return 'Google Drive belum disambung.';
    if (c === 'scan_besar') return `PDF ini imbasan tanpa teks dan melebihi 100 muka surat (${e.pages}); tidak dapat dihantar.`;
    if (c === 'json') return e && e.stop === 'max_tokens' ? 'jawapan model terpotong kerana mencapai had token; cuba sekali lagi (medan yang panjang boleh diisi berasingan).' : 'jawapan model tidak dapat dibaca sebagai JSON walaupun selepas pembaikan; cuba sekali lagi.';
    if (c === 'refusal') return 'model enggan menjawab permintaan ini (stop_reason refusal); cuba sekali lagi atau tukar model dalam Tetapan.';
    if (c === 'masa') return 'tamat masa menunggu jawapan (4 minit).';
    if (c === 'rangkaian') return 'permintaan ke api.anthropic.com gagal (talian terputus atau disekat pelayar).';
    if (st === 401) return 'kunci API Anthropic tidak sah (semak Tetapan).';
    if (st === 403) return 'akses ditolak oleh API Anthropic.';
    if (st === 404) return 'model tidak ditemui; pilih model lain dalam Tetapan.';
    if (st === 429) return 'had kadar atau kredit akaun Anthropic habis; cuba sebentar lagi.';
    if (st === 413) return 'artikel terlalu besar untuk satu permintaan.';
    if (st >= 500) return 'pelayan Anthropic sibuk (' + st + '); cuba sebentar lagi.';
    return (st ? 'ralat ' + st + ': ' : '') + (e && e.message ? e.message : 'ralat tidak diketahui');
  }

  /* ---- isi satu bahagian ---- */
  function setBtn(letter, text, busy) { $$('[data-isi="' + letter + '"]').forEach(b => { b.disabled = !!busy; b.textContent = text || 'Mohon Prof Dr Claude isikan'; }); }
  async function isi(id, letter, opts) {
    opts = opts || {};
    if (!id || !R.S.docs.has(id)) { toast('Buka rekod artikel dahulu', true); return null; }
    const sp = spec(letter); if (!sp) return null;
    const kunci = letter + ':' + id; if (I.busy.has(kunci)) return null;
    const t = await tetapan();
    if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); throw { code: 'no_key' }; }
    const d0 = rekodSemasa(id); const kosong = sp.fields.filter(f => nilaiKosong(d0[f.k]));
    if (!kosong.length) { toast(`Bahagian ${letter}: semua medan sudah berisi. Kosongkan medan yang mahu diisi semula, kemudian klik lagi.`); return { diisi: 0, kekal: sp.fields.length }; }
    if (!opts.senyap && !R.lsGet('rslr_isi_faham', false)) {
      const okk = await R.confirmBox('Mohon Prof Dr Claude isikan', 'Teks penuh PDF artikel akan dihantar ke API Anthropic menggunakan kunci API Prof Dr, dan kos dicaj kepada akaun Anthropic Prof Dr (lazimnya beberapa sen bagi setiap bahagian; bahagian seterusnya artikel yang sama lebih murah kerana cache). Hanya medan yang masih kosong diisi, sebagai draf untuk disemak.', 'Faham, teruskan', false);
      if (!okk) return null; R.lsSet('rslr_isi_faham', true);
    }
    I.busy.add(kunci); setBtn(letter, 'Mengambil PDF', true);
    try {
      const artikel = await bacaArtikel(id, s => setBtn(letter, s, true));
      setBtn(letter, 'Claude sedang membaca ' + artikel.pages + ' muka surat', true);
      const lain = letter === 'F' ? digestLain(id, d0.tema) : '';
      const tugas = taskPrompt(letter, sp, d0, lain);
      let res = await panggil(t, systemPrompt(t.profil), artikel, tugas);
      if (res.stop === 'max_tokens') {
        /* Jawapan terpotong: ulang sekali dengan had token dua kali ganda dan arahan meringkaskan. Awalan (alat, sistem, artikel)
           sudah berada dalam cache, maka ulangan ini murah; token keluaran sahaja dijana semula. */
        console.warn('isi: jawapan mencapai had token bagi bahagian', letter, '; mengulang dengan had', HAD_TOKEN_ULANG);
        setBtn(letter, 'Jawapan terpotong; Claude mengulang dengan lebih ringkas', true);
        const u0 = res.usage;
        const res2 = await panggil(t, systemPrompt(t.profil), artikel, tugas + '\n\nPERHATIAN: jawapan sebelum ini terpotong kerana terlalu panjang. Ringkaskan setiap medan (tidak melebihi kira-kira 1,200 aksara setiap satu) sambil mengekalkan angka, petikan dan jejak muka surat yang paling penting.', HAD_TOKEN_ULANG);
        res2.usage = { masuk: u0.masuk + res2.usage.masuk, keluar: u0.keluar + res2.usage.keluar, cacheTulis: u0.cacheTulis + res2.usage.cacheTulis, cacheBaca: u0.cacheBaca + res2.usage.cacheBaca };
        /* Jika ulangan masih terpotong tetapi ada medan separa, gunakan mana yang lebih lengkap. */
        const n1 = res.input ? Object.keys(res.input).length : 0, n2 = res2.input ? Object.keys(res2.input).length : 0;
        res = (res2.input || res2.text) && (n2 >= n1 || !res.input) ? res2 : Object.assign({}, res, { usage: res2.usage });
      }
      const j = res.input || parseJson(res.text, res.stop);
      const d1 = rekodSemasa(id); const patch = {}; const diisi = []; const ditolak = [];
      sp.fields.forEach(f => {
        if (!nilaiKosong(d1[f.k])) return; let v = j[f.k]; if (v === undefined || v === null || v === TIADA) return;
        if (f.type === 'multi') { const arr = (Array.isArray(v) ? v : String(v).split(/[;,]/)).map(x => String(x).trim()); const ok = f.opts.filter(o => arr.some(x => x.toLowerCase() === o.toLowerCase())); if (!ok.length) return; patch[f.k] = ok; diisi.push(f.k); return; }
        v = String(Array.isArray(v) ? v.join('; ') : v).replace(/\s*[—–]\s*/g, ', ').replace(/\s+\n/g, '\n').trim(); if (!v || v === TIADA) return;
        if (f.type === 'select') { const o = f.opts.find(x => x.toLowerCase() === v.toLowerCase()) || f.opts.find(x => v.toLowerCase().startsWith(x.toLowerCase())); if (!o) { ditolak.push(f.k + ' (' + v.slice(0, 30) + ')'); return; } v = o; }
        if (f.k === 'tahun') { const m = /\b(19|20)\d{2}\b/.exec(v); if (!m) return; v = m[0]; }
        patch[f.k] = v; diisi.push(f.k);
      });
      const masa = Date.now(); const stat = { masa, model: t.model, medan: diisi, token: res.usage, mod: res.mod || null };
      patch.aiIsi = Object.assign({}, d1.aiIsi || {}, { [letter]: stat });
      await R.writeNow(id, patch);
      if (R.S.currentId === id) { R.mergeIntoForm(); renderStat(R.S.docs.get(id)); }
      const kekal = sp.fields.length - kosong.length;
      if (!opts.senyap) toast(`Bahagian ${letter}: ${diisi.length} medan diisi sebagai draf${kekal ? ', ' + kekal + ' medan sedia ada dikekalkan' : ''}${ditolak.length ? '; pilihan tidak padan: ' + ditolak.join(', ') : ''}. Sila semak selepas membaca.`);
      return { diisi: diisi.length, kekal, ditolak, usage: res.usage };
    } catch (e) { if (!opts.senyap) toast('Bahagian ' + letter + ' gagal: ' + msg(e), true); throw e; }
    finally { I.busy.delete(kunci); setBtn(letter, null, false); }
  }
  async function isiSemua(id) {
    if (I.semua) return; I.semua = true; const btn = $('#btnIsiSemua'); if (btn) { btn.disabled = true; }
    const hasil = []; let gagal = null;
    try {
      const t = await tetapan(); if (!t.key) { toast('Kunci API Anthropic belum ditetapkan. Buka menu tiga titik, Tetapan.', true, { label: 'Tetapan', fn: () => R.showTetapan() }); return; }
      if (!R.lsGet('rslr_isi_faham', false)) { const okk = await R.confirmBox('Isi semua bahagian A hingga F', 'Teks penuh PDF dihantar ke API Anthropic dengan kunci Prof Dr; enam panggilan berturut-turut (bahagian berikutnya lebih murah kerana cache). Hanya medan kosong diisi.', 'Faham, teruskan', false); if (!okk) return; R.lsSet('rslr_isi_faham', true); }
      for (const g of GROUPS) {
        if (btn) btn.textContent = 'Mengisi bahagian ' + g.letter + ' daripada F';
        try { const r = await isi(id, g.letter, { senyap: true }); if (r) hasil.push(g.letter + ': ' + r.diisi); } catch (e) { gagal = g.letter + ' (' + msg(e) + ')'; break; }
      }
      const jumlah = hasil.reduce((s, x) => s + (parseInt(x.split(': ')[1], 10) || 0), 0);
      toast(`Isi semua selesai: ${jumlah} medan diisi sebagai draf (${hasil.join(', ')})${gagal ? '. Terhenti pada bahagian ' + gagal : ''}. Sila semak selepas membaca.`, !!gagal);
    } finally { I.semua = false; if (btn) { btn.disabled = false; btn.textContent = 'Isi semua bahagian (A hingga F)'; } }
  }
  function renderStat(d) {
    const ai = (d && d.aiIsi) || {};
    GROUPS.forEach(g => { const el = document.querySelector('[data-aistat="' + g.letter + '"]'); if (!el) return; const s = ai[g.letter]; if (!s) { el.hidden = true; el.textContent = ''; return; } el.hidden = false; el.textContent = 'Draf AI ' + R.fmtTime(s.masa) + (s.model ? ' (' + String(s.model).replace('claude-', '') + ')' : '') + (s.medan ? ', ' + s.medan.length + ' medan' : ''); el.title = 'Diisi automatik daripada PDF; medan: ' + ((s.medan || []).join(', ') || 'tiada') + (s.token ? '; token masuk ' + s.token.masuk + ', keluar ' + s.token.keluar + ', cache dibaca ' + s.token.cacheBaca : '') + (s.mod ? '; mod output ' + s.mod : ''); });
    const b = $('#btnIsiSemua'); if (b) b.hidden = !(d && (d.fail || []).length);
  }
  $('#form').addEventListener('click', e => { const b = e.target.closest('[data-isi]'); if (!b) return; e.preventDefault(); isi(R.S.currentId, b.dataset.isi).catch(() => {}); });
  const bs = $('#btnIsiSemua'); if (bs) bs.addEventListener('click', () => isiSemua(R.S.currentId));
  return { isi, isiSemua, renderStat, tetapan, MODELS, MODEL_DEFAULT, PROFIL_DEFAULT, bacaArtikel, hantar, parseJson, msg, nilaiKosong, SKIP, state: I };
}
