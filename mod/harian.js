/* Cadangan Harian: satu artikel sehari bagi setiap pemboleh ubah (IV, mediator, DV) dan satu lagi bagi Pengurusan Pengetahuan Digital
   Organisasi (digital knowledge management), daripada OpenAlex.
   Menggantikan tugas berjadual "Sorotan literatur harian" yang dahulunya berjalan di luar aplikasi. */
export function initHarian(R) {
  const { $, esc, toast, TEMA } = R;
  const OA = 'https://api.openalex.org/works';
  /* Slot keempat (v1.29.0): artikel yang menamakan konstruk "digital knowledge management" (DKM). Label ini hanya digunakan dalam Cadangan
     Harian; apabila artikelnya ditambah ke repositori, temanya ialah Pengurusan Pengetahuan Organisasi (senarai tema repositori kekal). */
  const TEMA_DKM = 'Pengurusan Pengetahuan Digital Organisasi (DKM)';
  const SLOT = [TEMA[0], TEMA[1], TEMA_DKM, TEMA[2]];        // susunan paparan: IV, mediator (umum, kemudian digital), DV
  const SLOT_CARI = [TEMA[0], TEMA[2], TEMA[1], TEMA_DKM];   // susunan carian: IV dan DV dahulu supaya pemilihan dan bajet permintaan mereka tidak bergantung pada mediator
  const ENJIN = 2;                                            // versi peraturan pemilihan; cadangan hari ini daripada enjin lama dikemas kini sekali
  const temaRekod = t => (t === TEMA_DKM ? TEMA[1] : t);
  const VARIAN = {
    [TEMA[0]]: ['"digital leadership" school principal', '"digital leadership" teachers school', '"digital leadership" education school', '"technology leadership" principal school', '"digital leadership" teachers "professional development"', '"school leadership" digital transformation teachers', 'principal "technology leadership" teachers'],
    /* Mediator (v1.29.0): setiap varian menamakan "knowledge management" supaya kolam calon bertumpu pada konstruk itu, bukan pada tingkah laku
       berkongsi pengetahuan atau pembelajaran organisasi secara umum. Saiz kolam setiap varian disemak dalam OpenAlex pada 13 November 2026. */
    [TEMA[1]]: ['"knowledge management" school teachers', '"knowledge management" schools principals', '"knowledge management practices" education', '"knowledge management" teachers leadership', '"knowledge management processes" education', '"knowledge management" "knowledge sharing" teachers', '"knowledge management" education Malaysia', '"knowledge management" school leadership digital', '"knowledge management" "higher education" teachers', '"knowledge creation" SECI teachers'],
    [TEMA_DKM]: ['"digital knowledge management"'],
    [TEMA[2]]: ['"digital competence" teachers primary school', '"digital competence" teachers DigCompEdu', '"teacher digital competence" professional development', '"digital literacy" teachers primary school', '"digital competence" teachers school leadership', '"digital competence" teachers "self-efficacy" school', '"ICT competence" primary school teachers']
  };
  const TOLAK = /\b(TAM|UTAUT2?|technology acceptance model|unified theory of acceptance)\b/i;
  // Istilah konstruk bagi IV dan DV: menentukan relevansi (dalam tajuk = 2, dalam abstrak = 1, tiada = ditolak). Mediator dan DKM menggunakan
  // pintu fokus konstruk di bawah (fokusPP dan fokusDKM), bukan senarai ini.
  const ISTILAH = {
    [TEMA[0]]: ['digital leadership', 'technology leadership', 'school leadership', 'e-leadership', 'ICT leadership', 'principal leadership', 'leadership for digital', 'digital transformation leadership', 'technology-enhanced leadership'],
    [TEMA[2]]: ['digital competence', 'digital competency', 'digital competencies', 'digital literacy', 'ICT competence', 'ICT competency', 'DigCompEdu', 'TPACK', 'technological pedagogical', 'digital skills', 'teacher digital']
  };
  const RX_CACHE = {};
  function temaRx(tema) {
    if (RX_CACHE[tema]) return RX_CACHE[tema];
    const alts = (ISTILAH[tema] || []).map(p => p.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[sz]ation/g, '[sz]ation').replace(/i[sz]e/g, 'i[sz]e')).join('[\\s-]+') + '(?:s|es|ies)?');
    RX_CACHE[tema] = new RegExp('\\b(?:' + alts.join('|') + ')\\b', 'i'); return RX_CACHE[tema];
  }
  function relevansiOf(it, tema) { const rx = temaRx(tema); if (rx.test(it.tajuk || '')) return 2; if (rx.test(it.abstrak || '')) return 1; return 0; }

  /* ---- Fokus konstruk bagi mediator (v1.29.0) ----
     Punca cadangan mediator hanyut: pintu lama menerima artikel yang abstraknya menyebut satu istilah keluarga pengetahuan sekali sahaja
     (contohnya "knowledge sharing" pada ayat akhir abstrak sebuah kajian kurikulum), susunan pula mendahulukan reka bentuk kuantitatif dan
     indeks jurnal sebelum relevansi, dan rantaian rujukan menggandakan kelonggaran itu dari hari ke hari. Pintu baharu menuntut kajian
     itu menumpukan konstruknya:
     PPO  aras 3: "knowledge management" (atau pengurusan pengetahuan) dalam tajuk;
          aras 2: istilah keluarga pengurusan pengetahuan dalam tajuk (proses, pengetahuan tasit atau organisasi, SECI) DAN kajian itu
                  menamakan knowledge management dalam abstrak, atau merujuk model SECI;
          selain itu ditolak. Kajian "knowledge sharing" yang tidak pernah menamakan knowledge management tidak diterima.
     DKM  aras 3: frasa "digital knowledge management" dalam tajuk; aras 2: frasa itu sekurang-kurangnya dua kali dalam abstrak; sebutan
          sekali lalu ditolak. Hanya sumber yang menamakan konstruk itu dikira, mengikut takrif Prof Dr. */
  const RX_PP = /\b(?:knowledge[\s-]+management|pengurusan\s+pengetahuan|manajemen\s+pengetahuan)\b/gi;
  const RX_PP_KELUARGA = /\bknowledge[\s-]+(?:sharing|creation|conversion|creating|acquisition|application|utili[sz]ation|storage|retention|transfer|capture)\b|\b(?:tacit|organi[sz]ational)\s+knowledge\b|\bSECI\b/i;
  const RX_SECI = /\bSECI\b/;
  const RX_DKM = /\b(?:digital[\s-]+knowledge[\s-]+management|pengurusan\s+pengetahuan\s+digital|manajemen\s+pengetahuan\s+digital)\b/gi;
  const semuaPadan = (rx, t) => String(t || '').match(rx) || [];
  const kecil = x => String(x || '').toLowerCase().replace(/[\s-]+/g, ' ');
  function fokusDKM(it) {
    const t = semuaPadan(RX_DKM, it && it.tajuk), a = semuaPadan(RX_DKM, it && it.abstrak).length;
    if (t.length) return { aras: 3, slot: 'dkm', di: 'tajuk', istilah: kecil(t[0]), sebut: a };
    if (a >= 2) return { aras: 2, slot: 'dkm', di: 'abstrak', istilah: 'digital knowledge management', sebut: a };
    return { aras: 0, slot: 'dkm', sebut: a };
  }
  function fokusPP(it) {
    const tajuk = (it && it.tajuk) || '', abs = (it && it.abstrak) || ''; const t = semuaPadan(RX_PP, tajuk), a = semuaPadan(RX_PP, abs).length;
    if (t.length) return { aras: 3, slot: 'ppo', di: 'tajuk', istilah: kecil(t[0]), sebut: a };
    const m = RX_PP_KELUARGA.exec(tajuk); const seci = RX_SECI.test(tajuk) || RX_SECI.test(abs);
    if (m && (a > 0 || seci)) return { aras: 2, slot: 'ppo', di: 'tajuk', istilah: /^seci$/i.test(m[0]) ? 'SECI' : kecil(m[0]), sebut: a, seci: !a };
    return { aras: 0, slot: 'ppo', sebut: a };
  }
  const PINTU = { [TEMA[1]]: fokusPP, [TEMA_DKM]: fokusDKM };
  /* Ayat ringkas pada kad: mengapa artikel ini dianggap menumpukan konstruk. */
  function teksFokus(it) {
    const f = (it && it.fokus) || {}; const n = f.sebut || 0; if (!f.aras) return '';
    if (f.slot === 'dkm') return f.di === 'tajuk' ? `Tajuk menamakan "${f.istilah}"${n ? '; frasa itu disebut ' + n + ' kali dalam abstrak' : ''}.` : `Abstrak menamakan "digital knowledge management" ${n} kali; frasa itu tiada dalam tajuk.`;
    if (f.aras === 3) return `Tajuk menamakan "${f.istilah}"${n ? '; disebut ' + n + ' kali dalam abstrak' : ''}.`;
    return `Tajuk memuatkan "${f.istilah}"${n ? ', dan abstrak menamakan "knowledge management" ' + n + ' kali' : ', dan kajian merujuk model SECI'}.`;
  }

  /* ---- Jenis artikel (dikesan daripada tajuk dan abstrak) ----
     Tingkat keutamaan: 0 empirikal kuantitatif (termasuk campuran, pengesahan instrumen, eksperimen), 1 tidak pasti,
     2 empirikal kualitatif, 3 ulasan/sintesis, 4 konseptual. */
  const CUES = {
    ulasan: [
      [/\bsystematic (?:literature )?review\b/i, 'ulasan sistematik'], [/\bscoping review\b/i, 'ulasan skop'], [/\bmeta-?analy(?:sis|ses|tic)\b/i, 'meta-analisis'],
      [/\bbibliometric\b/i, 'bibliometrik'], [/\b(?:literature|narrative|integrative|umbrella|critical|rapid|comprehensive) review\b/i, 'ulasan literatur'],
      [/\breview of (?:the )?(?:literature|studies|research|empirical|existing)\b/i, 'ulasan literatur'], [/\b(?:this|the present|the current|a) review\b/i, 'ulasan'],
      [/\bPRISMA\b/, 'PRISMA'], [/\b(?:mapping|state[- ]of[- ]the[- ]art) (?:study|review)\b/i, 'ulasan pemetaan'],
      [/\b(?:\d+|several|selected|eligible|included) (?:studies|articles|papers|publications|records) (?:were|was) (?:reviewed|analy[sz]ed|included|screened|synthesi[sz]ed|identified|selected)\b/i, 'sintesis kajian']
    ],
    konsep: [
      [/\bconceptual (?:paper|framework|model|analysis|article|study)\b/i, 'konseptual'], [/\btheoretical (?:paper|framework|analysis|article|model|lens)\b/i, 'teoretis'],
      [/\b(?:position paper|viewpoint|commentary|editorial|perspective article|essay)\b/i, 'kertas pandangan'],
      [/\bthis (?:paper|article|chapter) (?:argues|proposes|discusses|conceptuali[sz]es|theori[sz]es|outlines)\b/i, 'perbincangan konseptual']
    ],
    campuran: [
      [/\bmixed[- ]methods?\b/i, 'kaedah campuran'], [/\b(?:sequential explanatory|explanatory sequential|exploratory sequential|convergent(?: parallel)?) (?:design|approach|mixed)/i, 'reka bentuk campuran'],
      [/\bquantitative and qualitative\b|\bqualitative and quantitative\b/i, 'kuantitatif dan kualitatif']
    ],
    kualitatif: [
      [/\bqualitative\b/i, 'kualitatif'], [/\b(?:semi-?structured|in-?depth) interviews?\b|\binterviews? (?:were|was) conducted\b|\binterviewed\b/i, 'temu bual'],
      [/\bfocus groups?\b/i, 'kumpulan fokus'], [/\bthematic analysis\b/i, 'analisis tematik'], [/\bphenomenolog\w*\b/i, 'fenomenologi'], [/\bgrounded theory\b/i, 'grounded theory'],
      [/\bethnograph\w*\b/i, 'etnografi'], [/\b(?:multiple |single )?case stud(?:y|ies)\b/i, 'kajian kes'], [/\bdocument analysis\b|\bnarrative inquiry\b/i, 'analisis dokumen']
    ],
    kuantitatif: [
      [/\bsurvey(?:s|ed)?\b/i, 'tinjauan'], [/\bquestionnaires?\b/i, 'soal selidik'], [/\brespondents?\b/i, 'responden'], [/\bcross-?sectional\b/i, 'keratan rentas'], [/\bquantitative\b/i, 'kuantitatif'],
      [/\bstructural equation\b|\bSEM\b|\bPLS-?SEM\b|\bpartial least squares?\b|\bAMOS\b|\bpath (?:analysis|model(?:ing|ling)?)\b/i, 'SEM'], [/\b(?:multiple |linear |logistic |hierarchical )?regression\b/i, 'regresi'],
      [/\bcorrelat(?:ion|ional|ed)\b/i, 'korelasi'], [/\bM?ANOVA\b|\bt-?tests?\b|\bchi-?square\b/i, 'ujian statistik'], [/\bLikert\b/i, 'skala Likert'],
      [/\bCronbach\b|\breliability\b|\bvalidity\b/i, 'kebolehpercayaan dan kesahan'], [/\b(?:confirmatory|exploratory) factor analysis\b|\bCFA\b|\bEFA\b/i, 'analisis faktor'],
      [/\bmediat(?:ing|ion|or|ors|es|ed)\b|\bindirect effects?\b/i, 'perantara'], [/\bmoderat(?:ing|ion|or|ors|es|ed)\b/i, 'penyederhana'], [/\bhypothes[ie]s\b/i, 'hipotesis'],
      [/\bstatistically significant\b|\bsignificant(?:ly)? (?:positive|negative|direct|indirect)?\s*(?:effect|relationship|influence|predict)/i, 'signifikan statistik'],
      [/\b[nN]\s*=\s*\d{2,}/, 'saiz sampel'], [/\b(?:sample|total) of \d{2,}\b|\b\d{2,}\s+(?:school )?(?:teachers|principals|respondents|participants|students|educators|school leaders)\b/i, 'saiz sampel']
    ],
    instrumen: [
      [/\b(?:scale|instrument|questionnaire) (?:development|validation)\b|\bdevelop(?:ed|ment|ing) and validat(?:ed|ion|ing)\b|\bvalidat(?:ion|ing|ed) (?:of )?(?:a|the|an) (?:scale|instrument|questionnaire|measure)\b/i, 'pembangunan dan pengesahan instrumen'],
      [/\bpsychometric\b|\bmeasurement invariance\b/i, 'psikometrik']
    ],
    eksperimen: [[/\bquasi-?experiment\w*\b|\bexperimental (?:design|study|group|research)\b|\brandomi[sz]ed\b|\bcontrol group\b|\bpre-?test\b|\bpost-?test\b|\bintervention (?:study|program(?:me)?|group)\b/i, 'eksperimen atau intervensi']]
  };
  const PRIMER = ['tinjauan', 'soal selidik', 'responden', 'saiz sampel', 'SEM', 'regresi', 'skala Likert', 'keratan rentas'];
  function kesan(rows, text) { const out = []; rows.forEach(([rx, l]) => { if (rx.test(text) && !out.includes(l)) out.push(l); }); return out; }
  function jenisOf(it) {
    const tajuk = it.tajuk || '', abs = it.abstrak || '', teks = tajuk + '. ' + abs;
    const u = kesan(CUES.ulasan, teks), uT = kesan(CUES.ulasan, tajuk), k = kesan(CUES.konsep, teks), c = kesan(CUES.campuran, teks);
    const ql = kesan(CUES.kualitatif, teks), qn = kesan(CUES.kuantitatif, teks), ins = kesan(CUES.instrumen, teks), ex = kesan(CUES.eksperimen, teks);
    const primer = qn.filter(x => PRIMER.includes(x)).length; const qlKuat = ql.filter(x => x !== 'kajian kes').length;
    let jenis, tier, pet;
    if (it.oaType === 'review' || uT.length || (u.length && primer < 2)) { jenis = u.includes('meta-analisis') ? 'Meta-analisis' : u.includes('ulasan skop') ? 'Ulasan skop' : u.includes('ulasan sistematik') ? 'Ulasan sistematik' : u.includes('bibliometrik') ? 'Analisis bibliometrik' : 'Ulasan atau sintesis'; tier = 3; pet = u.length ? u : ['jenis OpenAlex: review']; }
    else if (k.length && !primer && !qlKuat) { jenis = 'Konseptual'; tier = 4; pet = k; }
    else if (c.length || (primer >= 2 && qlKuat >= 2)) { jenis = 'Kaedah campuran'; tier = 0; pet = c.concat(qn, ql); }
    else if (primer >= 1 && ins.length) { jenis = 'Pengesahan instrumen (kuantitatif)'; tier = 0; pet = ins.concat(qn); }
    else if (primer >= 1 && ex.length) { jenis = 'Eksperimen atau intervensi (kuantitatif)'; tier = 0; pet = ex.concat(qn); }
    else if ((primer >= 1 && qn.length >= 2) || qn.length >= 3) { jenis = 'Empirikal kuantitatif'; tier = 0; pet = qn; }
    else if (qlKuat >= 1 && !primer) { jenis = 'Empirikal kualitatif'; tier = 2; pet = ql; }
    else if (qn.length >= 1) { jenis = 'Tidak pasti, cenderung kuantitatif'; tier = 1; pet = qn; }
    else { jenis = abs ? 'Tidak pasti' : 'Tidak pasti (tiada abstrak)'; tier = 1; pet = []; }
    const yakin = pet.length >= 3 ? 'tinggi' : pet.length === 2 ? 'sederhana' : pet.length === 1 ? 'rendah' : 'tiada';
    return { jenis, tier, petunjuk: pet.slice(0, 8), yakin };
  }
  /* ---- Padanan metodologi dengan kajian Prof Dr: tinjauan soal selidik keratan rentas, responden guru sekolah rendah, SEM (CB-SEM/AMOS), analisis perantara ---- */
  const KAEDAH = [
    { l: 'tinjauan soal selidik', w: 2, rx: /\bsurvey(?:s|ed)?\b|\bquestionnaires?\b|\bLikert\b/i },
    { l: 'SEM', w: 3, rx: /\bstructural equation\b|\bSEM\b|\bPLS-?SEM\b|\bpartial least squares?\b|\bAMOS\b|\bpath (?:analysis|model(?:ing|ling)?)\b/i },
    { l: 'CB-SEM/AMOS', w: 1, rx: /\bAMOS\b|\bcovariance-?based\b|\bCB-?SEM\b/i },
    { l: 'perantara (mediasi)', w: 3, rx: /\bmediat(?:ing|ion|or|ors|es|ed)\b|\bindirect effects?\b/i },
    { l: 'penyederhana', w: 1, rx: /\bmoderat(?:ing|ion|or|ors|es|ed)\b/i },
    { l: 'responden guru', w: 2, rx: /\b\d{2,}\s+(?:school |primary |elementary )?teachers\b|\bteachers?\s+(?:were|participated|responded|completed|rated|surveyed|perceived)\b|\bsample[^.]{0,80}\bteachers\b|\bteacher respondents\b|\bteachers['’]\s+(?:perceptions?|perspectives?|views?|ratings?|responses?)\b|\bamong (?:school |primary |elementary )?teachers\b|\bdata (?:were |was )?collected from[^.]{0,40}teachers\b/i },
    { l: 'guru besar atau pengetua', w: 1, rx: /\bprincipals?\b|\bhead ?teachers?\b|\bheadmasters?\b|\bschool leaders?\b/i },
    { l: 'sekolah rendah', w: 2, rx: /\b(?:primary|elementary) schools?\b/i },
    { l: 'keratan rentas', w: 1, rx: /\bcross-?sectional\b/i },
    { l: 'CFA atau kesahan konstruk', w: 1, rx: /\bconfirmatory factor\b|\bCFA\b|\bCronbach\b|\bconstruct validity\b|\bdiscriminant validity\b|\bcomposite reliability\b/i },
    { l: 'Malaysia', w: 2, rx: /\bMalaysia/i },
    { l: 'saiz sampel dinyatakan', w: 1, rx: /\b[nN]\s*=\s*\d{2,}|\b(?:sample|total) of \d{2,}\b|\b\d{2,}\s+(?:teachers|principals|respondents|participants)\b/i }
  ];
  const PADANAN_RUJUK = 15; // jumlah pemberat yang dicapai kajian dengan metodologi yang sama
  function padananOf(it) { const teks = (it.tajuk || '') + '. ' + (it.abstrak || ''); let s = 0; const hits = []; KAEDAH.forEach(k => { if (k.rx.test(teks)) { s += k.w; hits.push(k.l); } }); return { skor: s, peratus: Math.min(100, Math.round(s / PADANAN_RUJUK * 100)), petunjuk: hits }; }
  function klas(it) { if (it.jenis && it.tier !== undefined && it.padanan !== undefined) return it; const j = jenisOf(it), p = padananOf(it); return { jenis: j.jenis, tier: j.tier, petunjuk: j.petunjuk, yakin: j.yakin, padanan: p.peratus, padananPetunjuk: p.petunjuk }; }
  function tierLabel(t) { return t === 0 ? 'keutamaan tertinggi' : t === 1 ? 'tidak dapat dipastikan' : t === 2 ? 'kualitatif' : t === 3 ? 'ulasan' : 'konseptual'; }
  const SELECT = 'id,doi,title,display_name,publication_year,publication_date,authorships,primary_location,best_oa_location,open_access,cited_by_count,abstract_inverted_index,type,is_retracted,has_content,referenced_works_count,referenced_works';
  const CONTENT = 'https://content.openalex.org/works/';
  const H = { date: todayStr(), doc: null, seen: null, busy: false };

  const LKEY = d => 'rslr_cadangan_' + d;
  function rulesWarn(e) { const c = e && e.code ? String(e.code) : ''; if (c.includes('permission-denied') && !H.warned) { H.warned = true; toast('Peraturan Firestore belum membenarkan koleksi "cadangan". Cadangan disimpan pada peranti ini sahaja sehingga peraturan dikemas kini (lihat README).', true); } }
  async function saveDoc(doc, merge, tarikh) {
    const d = tarikh || H.date;   // carian latar menyatakan tarikh dokumennya sendiri supaya pertukaran tarikh paparan tidak menyebabkan salah tulis
    try { await R.db().set('cadangan/' + d, merge ? { items: doc.items } : doc, !!merge); R.lsSet(LKEY(d), null); }
    catch (e) { rulesWarn(e); R.lsSet(LKEY(d), doc); if (!(e && String(e.code || '').includes('permission-denied'))) throw e; }
  }
  async function loadDoc(date) {
    let doc = null; try { doc = await R.db().get('cadangan/' + date); } catch (e) { rulesWarn(e); }
    if (!doc) doc = R.lsGet(LKEY(date), null);
    return doc;
  }
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayIndex() { const d = new Date(); const start = new Date(d.getFullYear(), 0, 0); return Math.floor((d - start) / 86400000); }
  function abstractOf(inv) {
    if (!inv || typeof inv !== 'object') return '';
    const words = []; Object.keys(inv).forEach(w => { (inv[w] || []).forEach(p => { words[p] = w; }); });
    return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
  function authorsOf(w) { return (w.authorships || []).map(a => a.author && a.author.display_name ? a.author.display_name.trim() : '').filter(Boolean); }
  function apaName(full) {
    const parts = full.replace(/\s+/g, ' ').trim().split(' '); if (parts.length === 1) return parts[0];
    const sur = parts.pop(); const ini = parts.map(p => p.replace(/[^A-Za-zÀ-ɏ-]/g, '')).filter(Boolean).map(p => p.split('-').map(x => x[0].toUpperCase() + '.').join('-')).join(' ');
    return sur + ', ' + ini;
  }
  function apaAuthors(list) {
    const n = list.map(apaName); if (!n.length) return '';
    if (n.length === 1) return n[0]; if (n.length === 2) return n[0] + ', & ' + n[1];
    if (n.length <= 20) return n.slice(0, -1).join(', ') + ', & ' + n[n.length - 1];
    return n.slice(0, 19).join(', ') + ', ... ' + n[n.length - 1];
  }
  function penulisRingkas(list) { const s = list.map(x => x.split(' ').pop()); if (!s.length) return 'Tanpa penulis'; if (s.length === 1) return s[0]; if (s.length === 2) return s[0] + ' dan ' + s[1]; return s[0] + ' et al.'; }
  function apaRef(it) {
    const j = it.jurnal ? ' ' + it.jurnal + '.' : '';
    const doi = it.doi ? ' https://doi.org/' + it.doi : '';
    return `${apaAuthors(it.penulis)} (${it.tahun}). ${it.tajuk.replace(/\.$/, '')}.${j}${doi}`;
  }
  function compact(w) {
    const src = (w.primary_location && w.primary_location.source) || {};
    const best = w.best_oa_location || {}; const oa = w.open_access || {};
    const abs = abstractOf(w.abstract_inverted_index);
    return { oaType: w.type || '', oaId: String(w.id || '').replace(/^https?:\/\/openalex\.org\//, ''), hasContent: !!(w.has_content && w.has_content.pdf), doi: R.normDoi(w.doi || ''), tajuk: (w.title || w.display_name || '').trim(), penulis: authorsOf(w).slice(0, 25), tahun: String(w.publication_year || ''), tarikh: w.publication_date || '',
      jurnal: src.display_name || '', issn: src.issn_l || '', issns: Array.from(new Set([src.issn_l].concat(src.issn || []).filter(Boolean).map(issn8))), isCore: !!src.is_core, inDoaj: !!src.is_in_doaj, pdfUrl: best.pdf_url || '', oaUrl: oa.oa_url || best.landing_page_url || '', dipetik: Number(w.cited_by_count) || 0, abstrak: abs.slice(0, 1800),
      nRefs: Number(w.referenced_works_count) || (w.referenced_works || []).length, refs: (w.referenced_works || []).slice(0, 400).map(x => String(x).replace(/^https?:\/\/openalex\.org\//, '')) };
  }
  function issn8(x) { return String(x || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
  /* Senarai Scopus: data/scopus.json (ISSN -> anggaran kuartil SJR; 0 = Scopus tanpa SJR). */
  async function loadScopus() {
    if (H.scopus) return H.scopus;
    try { const r = await fetch('./data/scopus.json', { cache: 'force-cache' }); if (r.ok) { const j = await r.json(); H.scopus = { q: j.q || {}, meta: j.meta || {} }; } } catch (e) {}
    if (!H.scopus) H.scopus = { q: {}, meta: {} };
    return H.scopus;
  }
  function scopusOf(it) {
    const m = H.scopus && H.scopus.q; if (!m) return null;
    let best = null; const list = it.issns && it.issns.length ? it.issns : [issn8(it.issn)].filter(Boolean);
    list.forEach(i => { if (i in m) { const q = Number(m[i]) || 0; if (best === null || (q && (!best.q || q < best.q))) best = { q }; } });
    return best;
  }
  // Kelas keutamaan: 1-4 Scopus Q1-Q4, 5 Scopus tanpa kuartil, 6 jurnal teras CWTS, 7 DOAJ, 99 ditolak (tidak dapat disahkan diindeks dan berwasit).
  function kelasOf(it) {
    const sc = scopusOf(it);
    if (sc) return sc.q ? sc.q : 5;
    if (it.isCore) return 6; if (it.inDoaj) return 7; return 99;
  }
  function kelasLabel(k) { return k <= 4 ? 'Scopus Q' + k : k === 5 ? 'Scopus' : k === 6 ? 'Jurnal teras (berwasit)' : k === 7 ? 'DOAJ (berwasit)' : ''; }
  function minYear() { return new Date().getFullYear() - 4; }
  const EDU = /\b(schools?|teachers?|principals?|head ?teachers?|headmasters?|educat\w*|sekolah|guru|classrooms?|students?|pupils?|pedagog\w*)\b/i;
  const HEALTH = /\b(diseases?|patients?|clinical|nurs(?:e|es|ing)|hospitals?|medical|medicine|pharmac\w*|surgery|cancer|epidemiolog\w*)\b/i;
  function phraseRx(variant) {
    const m = /"([^"]+)"/.exec(variant); if (!m) return null;
    const words = m[1].trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[sz]ation/g, '[sz]ation').replace(/i[sz]e/g, 'i[sz]e'));
    return new RegExp('\\b' + words.join('[\\s-]+') + '(?:s|es)?\\b', 'i');
  }
  function skor(it, idx, variant, tanpaEdu) {
    const tajuk = it.tajuk || ''; const teks = tajuk + ' ' + it.abstrak;
    if (!tanpaEdu && !EDU.test(teks)) return -1;
    if (TOLAK.test(teks)) return -1;
    let s = 100 - idx * 2; if (it.isCore) s += 15; if (it.inDoaj) s += 8; if (it.pdfUrl) s += 10; if (it.hasContent) s += 8; if (it.nRefs > 0) s += 6; s += Math.min(10, Math.log2(it.dipetik + 1) * 2);
    const rx = phraseRx(variant);
    if (rx) { if (rx.test(tajuk)) s += 18; else if (rx.test(it.abstrak)) s += 4; else s -= 25; }
    if (EDU.test(tajuk)) s += 8;
    if (/malaysia/i.test(teks)) s += 5; if (/\b(primary|elementary)\b/i.test(teks)) s += 3;
    if (/\bmediat/i.test(teks)) s += 4; if (/structural equation|\bSEM\b|PLS-SEM/i.test(teks)) s += 3;
    if (HEALTH.test(teks)) s -= 30;
    if (!it.abstrak) s -= 10;
    return s;
  }
  async function loadSeen() {
    if (H.seen) return H.seen;
    const set = new Set();
    try { const r = await fetch('./data/seen_dois.json', { cache: 'force-cache' }); if (r.ok) { const j = await r.json(); (j.dois || []).forEach(d => set.add(R.normDoi(d))); } } catch (e) {}
    H.seen = set; return set;
  }
  /* ---- Semakan pendua: gabungan log awan (meta/cadangan_log), log tempatan peranti ini, sejarah cadangan (awan dan tempatan),
     DOI dan tajuk rekod repositori, serta log tugas harian lama. Tajuk dan ID OpenAlex turut disemak supaya DOI yang berbeza bentuk tidak terlepas. ---- */
  const LOGKEY = 'rslr_cadangan_log';
  function localLog() { const l = R.lsGet(LOGKEY, null); return l && typeof l === 'object' ? l : {}; }
  function normTitle(t) { const x = String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); return x.length >= 25 ? x : ''; }
  async function logPicks(items) {
    const add = {}; (items || []).forEach(it => { if (it && it.doi && !it.kosong) add[doiKey(it.doi)] = H.date; });
    if (!Object.keys(add).length) return;
    const l = localLog(); Object.assign(l, add); R.lsSet(LOGKEY, l);
    try { await R.db().set('meta/cadangan_log', { dikemaskini: Date.now(), dois: add }, true); H.logAwan = 'ditulis'; }
    catch (e) { H.logAwan = 'gagal ditulis (' + ((e && e.code) || 'ralat') + ')'; }
  }
  async function excluded() {
    const set = new Set(await loadSeen()); const titles = new Set(); const oa = new Set();
    const stat = { lama: set.size, repo: 0, logAwan: null, logTempatan: 0, sejarah: 0 };
    R.S.docs.forEach(d => { const x = R.normDoi(d.doi); if (x) { set.add(x); stat.repo++; } const t = normTitle(d.tajuk); if (t) titles.add(t); });
    try { const log = await R.db().get('meta/cadangan_log'); const ks = Object.keys((log && log.dois) || {}); ks.forEach(d => set.add(d)); stat.logAwan = ks.length; }
    catch (e) { stat.logAwan = null; stat.logRalat = (e && e.code) ? String(e.code) : 'ralat'; }
    const ll = localLog(); Object.keys(ll).forEach(d => set.add(d)); stat.logTempatan = Object.keys(ll).length;
    if (!H.sejarah) await loadSejarah();
    H.sejarah.forEach(doc => (doc.items || []).forEach(it => { if (it.kosong) return; if (it.doi) { set.add(R.normDoi(it.doi)); stat.sejarah++; } if (it.oaId) oa.add(it.oaId); const t = normTitle(it.tajuk); if (t) titles.add(t); }));
    H.excl = { set, titles, oa, stat }; stat.jumlah = set.size;
    return set;
  }
  function doiKey(d) { return R.normDoi(d).replace(/[./]/g, '_'); }
  function excludedHas(set, doi) { const n = R.normDoi(doi); return set.has(n) || set.has(doiKey(n)); }
  function excludedLain(it) { const X = H.excl; if (!X) return false; if (it.oaId && X.oa.has(it.oaId)) return true; const t = normTitle(it.tajuk); return !!(t && X.titles.has(t)); }
  async function oaFetch(filter, key, perPage) {
    const p = new URLSearchParams({ filter, 'per-page': String(perPage || 100), select: SELECT });
    if (key) p.set('api_key', key); else if (R.C.ownerEmail) p.set('mailto', R.C.ownerEmail);
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(OA + '?' + p.toString(), { signal: ctl.signal });
      if (r.status === 429) throw { code: 'kuota', message: 'Had permintaan OpenAlex hari ini dicapai. Cuba sebentar lagi atau tetapkan kunci API percuma dalam Tetapan.' };
      if (!r.ok) throw { code: 'http', message: 'OpenAlex memulangkan ralat ' + r.status };
      return (await r.json()).results || [];
    } finally { clearTimeout(tm); }
  }
  const BASE = () => [`from_publication_date:${minYear()}-01-01`, 'is_oa:true', 'type:article', 'primary_location.source.type:journal', 'has_doi:true', 'is_retracted:false'];
  const kumpulan = k => k <= 5 ? 0 : k === 6 ? 1 : 2;
  function susun(found, tema) {
    const pdf = (a, b) => (b.pdfUrl ? 1 : 0) - (a.pdfUrl ? 1 : 0);
    // Mediator: semua calon sudah melepasi pintu fokus konstruk. Susunan: jenis artikel (kuantitatif dahulu), aras fokus ("knowledge
    // management" dalam tajuk mendahului istilah proses), konteks bukan kesihatan dahulu, kemudian kumpulan pengindeksan, padanan
    // metodologi, kuartil, PDF dan skor.
    const sihat = (a, b) => (a.sihat || 0) - (b.sihat || 0);
    if (tema === TEMA[1]) { found.sort((a, b) => a.tier - b.tier || b.relevansi - a.relevansi || sihat(a, b) || kumpulan(a.kelas) - kumpulan(b.kelas) || b.padanan - a.padanan || a.kelas - b.kelas || pdf(a, b) || b.skor - a.skor); return found; }
    // DKM: kolamnya kecil, maka artikel yang menamakan konstruk itu dalam tajuk didahulukan, kemudian jenis artikel, konteks bukan kesihatan
    // dan pengindeksan.
    if (tema === TEMA_DKM) { found.sort((a, b) => b.relevansi - a.relevansi || a.tier - b.tier || sihat(a, b) || kumpulan(a.kelas) - kumpulan(b.kelas) || b.padanan - a.padanan || a.kelas - b.kelas || pdf(a, b) || b.skor - a.skor); return found; }
    // IV dan DV (tidak diubah). Keutamaan: (1) jenis artikel: empirikal kuantitatif dahulu, kemudian tidak pasti, kualitatif, ulasan, konseptual;
    // (2) kumpulan pengindeksan: Scopus, kemudian jurnal teras, kemudian DOAJ; (3) padanan metodologi dengan kajian Prof Dr;
    // (4) istilah konstruk dalam tajuk; (5) kuartil Q1 ke Q4; (6) ada PDF; (7) skor relevansi.
    found.sort((a, b) => a.tier - b.tier || kumpulan(a.kelas) - kumpulan(b.kelas) || b.padanan - a.padanan || b.relevansi - a.relevansi || a.kelas - b.kelas || (b.pdfUrl ? 1 : 0) - (a.pdfUrl ? 1 : 0) || b.skor - a.skor);
    return found;
  }
  function terima(w, i, variant, excl, taken, ids, tema) {
    const it = compact(w); if (!it.doi || !it.tajuk || ids.has(it.doi)) return null; ids.add(it.doi);
    if (excludedHas(excl, it.doi) || taken.has(it.doi) || excludedLain(it)) return null; if (!it.pdfUrl && !it.oaUrl) return null;
    if (Number(it.tahun) < minYear()) return null;
    it.kelas = kelasOf(it); if (it.kelas >= 99) return null;
    it.skor = skor(it, i, variant, tema === TEMA_DKM); if (it.skor < 0) return null;
    const pintu = PINTU[tema];
    if (pintu) {
      // Mediator dan DKM: kajian mesti menumpukan konstruknya. Artikel yang menamakan DKM diserahkan kepada slot DKM, bukan slot mediator umum.
      const f = pintu(it); if (!f.aras || (tema === TEMA[1] && fokusDKM(it).aras)) return null; it.relevansi = f.aras; it.fokus = f; it.sihat = HEALTH.test((it.tajuk || '') + ' ' + it.abstrak) ? 1 : 0;
    } else { it.relevansi = tema ? relevansiOf(it, tema) : 1; if (!it.relevansi) return null; }
    Object.assign(it, klas(it));
    return it;
  }
  const kuantScopus = found => found.filter(x => x.tier === 0 && kumpulan(x.kelas) === 0).length;
  async function cariTema(tema, variant, excl, taken, key, ringkas) {
    const base = [`title_and_abstract.search:${variant}`].concat(BASE());
    const found = []; const ids = new Set(); const dkm = tema === TEMA_DKM;
    // DKM: kolamnya kecil (puluhan artikel), maka satu permintaan 200 hasil meliputi kesemuanya dan kedudukan dalam hasil tidak dijadikan penalti.
    const ambil = async (filter) => { let res; try { res = await oaFetch(filter, key, dkm ? 200 : 100); } catch (e) { if (e.code === 'kuota') throw e; res = []; } res.forEach((w, i) => { const it = terima(w, dkm ? 0 : i, variant, excl, taken, ids, tema); if (it) found.push(it); }); };
    await ambil(base.join(','));
    // ringkas: varian gantian mediator hanya membuat satu permintaan supaya bajet harian OpenAlex tidak habis apabila kolam semakin nipis
    if (dkm || ringkas) return susun(found, tema);
    if (found.filter(x => x.kelas <= 5).length < 2) await ambil(base.concat(['primary_location.source.is_core:true']).join(','));
    // Kolam empirikal kuantitatif nipis: cuba kueri yang ditambah istilah metodologi (SEM, kemudian tinjauan).
    if (kuantScopus(found) < 2) await ambil([`title_and_abstract.search:${variant} "structural equation"`].concat(BASE()).join(','));
    if (kuantScopus(found) < 2) await ambil([`title_and_abstract.search:${variant} survey`].concat(BASE()).join(','));
    return susun(found, tema);
  }
  // Rantaian rujukan ("connected papers"): calon esok diambil daripada senarai Rujukan artikel semalam bagi konstruk yang sama.
  async function cariRujukan(tema, seed, excl, taken, key) {
    const refs = (seed.refs || []).filter(x => /^W\d+$/.test(x)); if (!refs.length) return [];
    const variant = VARIAN[tema][0]; const found = []; const ids = new Set();
    for (let i = 0; i < refs.length && i < 400; i += 100) {
      const chunk = refs.slice(i, i + 100);
      let res; try { res = await oaFetch(['ids.openalex:' + chunk.join('|')].concat(BASE()).join(','), key, 100); } catch (e) { if (e.code === 'kuota') throw e; res = []; }
      res.forEach((w, j) => { const it = terima(w, 0, variant, excl, taken, ids, tema); if (it) found.push(it); });
    }
    return susun(found, tema);
  }
  function ringkasSeed(seed, tarikh) { return { oaId: seed.oaId || '', doi: seed.doi || '', tajuk: seed.tajuk || '', penulis: penulisRingkas(seed.penulis || []), tahun: seed.tahun || '', tarikh: tarikh || '', artikelId: seed.artikelId || null, nRefs: seed.nRefs || (seed.refs || []).length }; }
  async function loadSejarah() {
    const m = new Map();
    try { (await R.db().list('cadangan', 90)).forEach(x => { if (x.data && x.data.tarikh) m.set(x.data.tarikh, x.data); }); } catch (e) {}
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rslr_cadangan_')) { const v = R.lsGet(k, null); if (v && v.tarikh && !m.has(v.tarikh)) m.set(v.tarikh, v); } } } catch (e) {}
    H.sejarah = m; return m;
  }
  function seedFor(tema) {
    if (!H.sejarah) return null;
    const dates = Array.from(H.sejarah.keys()).filter(d => d < H.date).sort().reverse();
    for (const d of dates) {
      const doc = H.sejarah.get(d); const it = (doc.items || []).find(x => x.tema === tema && !x.kosong);
      if (it) return { it, tarikh: d };
    }
    return null;
  }
  /* Cari satu slot: rantaian rujukan dahulu (calon diambil daripada senarai Rujukan artikel terdahulu bagi konstruk yang sama), kemudian
     carian baharu. Bagi IV dan DV aliran ini sama seperti sebelum v1.29.0. Bagi mediator dan DKM: rantaian hanya disambung jika artikel
     terdahulu sendiri menumpukan konstruk itu, dan semua varian kueri dicuba sebelum slot diisytiharkan kosong. */
  async function cariSlot(tema, ctx, opt) {
    const { excl, taken, key, di, kueri } = ctx; opt = opt || {};
    let found = []; let rantai = null; const seed = opt.tanpaBenih ? null : seedFor(tema); const pintu = PINTU[tema];
    const benihSah = !seed || !pintu || pintu(seed.it).aras > 0;
    if (seed && benihSah && (seed.it.refs || []).length) {
      found = await cariRujukan(tema, seed.it, excl, taken, key);
      if (found.length) { rantai = { panjang: ((seed.it.rantai && seed.it.rantai.panjang) || 1) + 1, dari: ringkasSeed(seed.it, seed.tarikh) }; kueri[tema] = 'Rujukan artikel ' + seed.tarikh; }
    }
    if (!found.length) {
      const vs = VARIAN[tema]; let variant = vs[di % vs.length]; kueri[tema] = variant;
      found = await cariTema(tema, variant, excl, taken, key);
      const lagi = pintu ? vs.length - 1 : 2;
      for (let k = 1; k <= lagi && !found.length; k++) { variant = vs[(di + k) % vs.length]; kueri[tema] = variant; found = await cariTema(tema, variant, excl, taken, key, !!pintu); }
      const sebab = opt.sebab ? opt.sebab : !seed ? 'Tiada artikel terdahulu bagi konstruk ini, maka carian baharu.' : !benihSah ? `Artikel ${seed.tarikh} tidak menumpukan ${tema === TEMA_DKM ? 'digital knowledge management' : 'pengurusan pengetahuan'}, maka rantaian tidak disambung dan carian baharu dimulakan.` : !(seed.it.refs || []).length ? `Artikel ${seed.tarikh} tiada senarai rujukan dalam OpenAlex, maka carian baharu.` : `Senarai rujukan artikel ${seed.tarikh} (${(seed.it.refs || []).length} rujukan) tiada lagi penerbitan ${minYear()} hingga ${new Date().getFullYear()} yang memenuhi kriteria, maka rantaian baharu dimulakan.`;
      rantai = { panjang: 1, baharu: true, sebab, dari: seed ? ringkasSeed(seed.it, seed.tarikh) : null };
    }
    if (found.length) { const pick = found[0]; taken.add(pick.doi); pick.tema = tema; pick.dibaca = false; pick.artikelId = null; pick.rujukan = apaRef(pick); pick.rantai = rantai; if (pintu) pick.kolam = found.length; pick.alt = found.slice(1, 9).map(a => Object.assign({}, a, { abstrak: a.abstrak.slice(0, 700), tema, rantai })); return pick; }
    return { tema, kosong: true, kueri: kueri[tema], rantai };
  }
  async function cari(force) {
    if (H.busy) return; H.busy = true; const btn = $('#btnHarianCari'); btn.disabled = true;
    $('#harianSub').textContent = 'Mencari dalam OpenAlex: artikel empirikal kuantitatif dahulu (padanan metodologi), keutamaan Scopus, kemudian jurnal teras dan DOAJ; akses terbuka; ' + minYear() + ' hingga ' + new Date().getFullYear() + '; semakan pendua terhadap semua cadangan terdahulu.';
    try {
      const meta = await R.db().getMeta(); const key = meta && meta.openalexKey ? String(meta.openalexKey).trim() : '';
      await loadScopus(); await loadSejarah();
      const excl = await excluded(); const taken = new Set(); const kueri = {}; const di = dayIndex() + (force ? Math.floor(Math.random() * 6) : 0);
      const ctx = { excl, taken, key, di, kueri }; const hasil = {};
      for (const tema of SLOT_CARI) {
        try { hasil[tema] = await cariSlot(tema, ctx); }
        catch (e) { if (!(PINTU[tema] && e && e.code === 'kuota')) throw e; hasil[tema] = { tema, kosong: true, kuota: true, kueri: kueri[tema] || '', rantai: null }; }
      }
      const items = SLOT.map(t => hasil[t]);
      await logPicks(items);
      const semak = Object.assign({}, (H.excl && H.excl.stat) || {}, { logTulis: H.logAwan || '' });
      const doc = { tarikh: H.date, dibuat: Date.now(), enjin: ENJIN, kueri, items, semak };
      await saveDoc(doc, false);
      H.doc = doc; if (H.sejarah) H.sejarah.set(H.date, doc); render(); await loadDates(); R.lsSet('rslr_harian_last', H.date);
    } catch (e) { toast('Carian harian gagal: ' + (e && e.message ? e.message : e && e.code ? e.code : 'ralat talian'), true); $('#harianSub').textContent = 'Carian gagal. Semak talian internet, kemudian klik Cari semula.'; }
    finally { H.busy = false; btn.disabled = false; }
  }
  /* Kemas kini sekali bagi cadangan HARI INI yang dijana oleh enjin lama: (1) artikel mediator yang belum dibaca, belum ditambah ke repositori
     dan tidak menumpukan pengurusan pengetahuan diganti melalui carian baharu; (2) slot DKM ditambah. Kad IV dan DV tidak disentuh.
     Artikel yang diganti kekal dalam log cadangan, maka ia tidak dicadangkan lagi. */
  async function kemasMediator() {
    const doc = H.doc; if (H.busy || !doc || doc.tarikh !== todayStr() || (doc.enjin || 1) >= ENJIN) return false;
    // Tunggu rekod repositori tiba dari pelayan supaya semakan pendua lengkap; muatan automatik selepas itu akan mencuba semula.
    if (R.S && !R.S.fromServer) return false;
    H.busy = true; const btn = $('#btnHarianCari'); if (btn) btn.disabled = true; const baharu = []; let diganti = null; let lengkap = true;
    try {
      const meta = await R.db().getMeta(); const key = meta && meta.openalexKey ? String(meta.openalexKey).trim() : '';
      await loadScopus(); await loadSejarah(); const excl = await excluded(); const items = doc.items.slice();
      const taken = new Set(items.filter(x => !x.kosong && x.doi).map(x => x.doi)); const kueri = Object.assign({}, doc.kueri || {}); const ctx = { excl, taken, key, di: dayIndex(), kueri };
      // had permintaan OpenAlex: langkah itu ditangguhkan ke muatan berikutnya, tanpa menggagalkan langkah yang sudah berjaya
      const cuba = async fn => { try { return await fn(); } catch (e) { if (e && e.code === 'kuota') { lengkap = false; return null; } throw e; } };
      const i = items.findIndex(x => x.tema === TEMA[1]); const lama = i >= 0 ? items[i] : null;
      if (lama && !lama.kosong && !lama.dibaca && !lama.artikelId && !fokusPP(lama).aras) {
        const ganti = await cuba(() => cariSlot(TEMA[1], ctx, { tanpaBenih: true, sebab: `Cadangan awal hari ini (${penulisRingkas(lama.penulis || [])}, ${lama.tahun || 't.t.'}) tidak menumpukan pengurusan pengetahuan, maka ia diganti melalui carian baharu dengan tapisan fokus konstruk.` }));
        if (ganti && !ganti.kosong) { items[i] = ganti; baharu.push(ganti); diganti = lama; }
      }
      if (!items.some(x => x.tema === TEMA_DKM)) {
        const dk = await cuba(() => cariSlot(TEMA_DKM, ctx));
        if (dk) { const j = items.findIndex(x => x.tema === TEMA[1]); items.splice(j >= 0 ? j + 1 : items.length, 0, dk); if (!dk.kosong) baharu.push(dk); }
      }
      if (!lengkap && !baharu.length) return false;
      doc.items = items; doc.kueri = kueri; if (lengkap) doc.enjin = ENJIN; await logPicks(baharu); await saveDoc(doc, false, doc.tarikh);
      if (H.doc === doc) { if (H.sejarah) H.sejarah.set(doc.tarikh, doc); render(); await loadDates(); }
      if (diganti) toast('Artikel Pengurusan Pengetahuan Organisasi hari ini diganti kerana cadangan awal tidak menumpukan pengurusan pengetahuan');
      return true;
    } catch (e) { console.warn('harian: kemas kini mediator gagal', e); return false; }
    finally { H.busy = false; if (btn) btn.disabled = false; }
  }
  async function loadDates() {
    await loadSejarah();
    let ids = Array.from(H.sejarah.keys()); if (!ids.includes(H.date)) ids.unshift(H.date); ids.sort().reverse();
    $('#harianTarikh').innerHTML = ids.map(d => `<option value="${esc(d)}"${d === H.date ? ' selected' : ''}>${esc(d)}</option>`).join('');
    renderRantaian();
  }
  function renderRantaian() {
    const box = $('#rantaian'); if (!box || !H.sejarah) return;
    const dates = Array.from(H.sejarah.keys()).sort();
    const cols = SLOT.map(tema => {
      const steps = []; dates.forEach(d => { const it = (H.sejarah.get(d).items || []).find(x => x.tema === tema && !x.kosong); if (it) steps.push({ d, it }); });
      if (!steps.length) return `<div class="rantai-col"><h3><span class="tag tema ${temaClass(tema)}"><span>${esc(tema)}</span></span></h3><div class="help">Belum ada cadangan.</div></div>`;
      return `<div class="rantai-col"><h3><span class="tag tema ${temaClass(tema)}"><span>${esc(tema)}</span></span></h3><ol>${steps.map(({ d, it }, k) => {
        const r = it.rantai || {}; const sambung = k > 0 && r.panjang > 1 && !r.baharu;
        const ruj = it.rujukan || apaRef(it);
        return `<li class="${sambung ? 'sambung' : 'mula'}" title="${esc(sambung ? 'Disenaraikan dalam Rujukan artikel sebelumnya' : 'Rantaian baharu (carian baharu)')}"><div class="hd"><span class="d">${esc(d)}</span> <span class="k">${esc(kelasLabel(it.kelas || kelasOf(it)) || '')}</span>${sambung ? ' <span class="s">daripada Rujukan artikel ' + esc(it.rantai.dari && it.rantai.dari.tarikh || '') + '</span>' : ''}</div><div class="ruj" data-web="p:${esc(R.normDoi(it.doi))}" title="Klik untuk membuka Web Artikel">${esc(ruj)}</div><div class="acts"><button class="btn btn-sm btn-primary" data-web="p:${esc(R.normDoi(it.doi))}">Web artikel</button>${it.doi ? `<a class="btn btn-sm" href="https://doi.org/${esc(it.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}<button class="btn btn-sm" data-salin="${esc(ruj)}">Salin rujukan</button>${it.artikelId && R.S.docs.has(it.artikelId) ? `<button class="btn btn-sm" data-rek="${esc(it.artikelId)}">Rekod</button>` : ''}</div></li>`;
      }).join('')}</ol></div>`;
    });
    box.innerHTML = `<h2>Rantaian artikel <small>Setiap anak panah bermakna artikel di bawahnya diambil daripada senarai Rujukan artikel di atasnya; garis putus bermakna rantaian baharu. Klik mana-mana rujukan untuk membuka Web Artikel (jaringan hubungan dengan artikel lain dalam repositori dan cadangan harian).</small></h2><div class="rantai-grid">${cols.join('')}</div>`;
  }
  async function load(date, auto) {
    H.date = date || todayStr();
    await loadScopus();
    const doc = await loadDoc(H.date);
    H.doc = doc; render(); badge();
    if (!doc && auto && navigator.onLine && H.date === todayStr()) cari(false);
    else if (doc && navigator.onLine && H.date === todayStr() && (doc.enjin || 1) < ENJIN) kemasMediator();
  }
  function badge() {
    const b = $('#navBadge'); const doc = H.doc && H.doc.tarikh === todayStr() ? H.doc : null;
    const n = doc ? doc.items.filter(it => !it.kosong && !it.dibaca).length : 0;
    b.hidden = !n; b.textContent = String(n);
  }
  function temaClass(t) { return t === TEMA[0] ? 'kd' : t === TEMA[1] ? 'ppo' : t === TEMA[2] ? 'kdg' : t === TEMA_DKM ? 'ppd' : 'lain'; }
  function render() {
    const box = $('#picks'); const doc = H.doc;
    if (!doc) { $('#harianSub').textContent = H.date === todayStr() ? 'Belum ada cadangan untuk hari ini.' : 'Tiada cadangan direkodkan pada tarikh ini.'; box.innerHTML = SLOT.map(t => `<div class="pick ${temaClass(t)}"><span class="tag tema ${temaClass(t)}"><span>${esc(t)}</span></span><div class="empty-pick">${H.busy ? 'Mencari' : 'Klik Cari semula untuk mendapatkan cadangan.'}</div></div>`).join(''); return; }
    const n = doc.items.filter(it => !it.kosong).length; const read = doc.items.filter(it => it.dibaca).length;
    $('#harianSub').textContent = `${n} artikel dicadangkan pada ${doc.tarikh}, ${read} sudah dibaca. Kueri: ${SLOT.map(t => (doc.kueri && doc.kueri[t]) || '').filter(Boolean).join(' | ')}`;
    box.innerHTML = doc.items.map((it, i) => {
      if (it.kosong) return `<div class="pick ${temaClass(it.tema)}"><span class="tag tema ${temaClass(it.tema)}"><span>${esc(it.tema)}</span></span><div class="empty-pick">${it.kuota ? 'Had permintaan OpenAlex hari ini dicapai sebelum kad ini sempat dicari. Klik Cari semula kemudian, atau tetapkan kunci API OpenAlex percuma dalam Tetapan.' : it.tema === TEMA_DKM ? 'Tiada artikel baharu yang menamakan digital knowledge management dan memenuhi semua tapisan (akses terbuka, jurnal berindeks, lima tahun terkini, belum pernah dicadangkan). Kolam artikel yang menamakan konstruk ini masih kecil; kad ini akan terisi semula apabila ada penerbitan baharu.' : `Tiada artikel baharu yang memenuhi semua tapisan untuk kueri "${esc(it.kueri || '')}". Klik Cari semula untuk mencuba kueri lain.`}</div></div>`;
      const sjr = it.issn ? `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(it.issn.replace('-', ''))}&tip=iss&clean=0` : `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(it.jurnal)}`;
      return `<article class="pick ${temaClass(it.tema)}${it.dibaca ? ' done' : ''}" data-i="${i}">
        <div class="top"><span class="tag tema ${temaClass(it.tema)}"><span>${esc(it.tema)}</span></span><label><input type="checkbox" data-baca="${i}"${it.dibaca ? ' checked' : ''}> Sudah dibaca</label></div>
        <h3>${esc(it.tajuk)}</h3>
        <div class="meta">${esc(penulisRingkas(it.penulis))} (${esc(it.tahun)}). <i>${esc(it.jurnal || 'Jurnal tidak dinyatakan')}</i>${it.issn ? ', ISSN ' + esc(it.issn) : ''}</div>
        ${it.rantai ? `<div class="rantai-line">${it.rantai.baharu ? `<b>Rantaian baharu.</b> ${esc(it.rantai.sebab || '')}` : `<b>Rantaian ke-${esc(it.rantai.panjang)}.</b> Disenaraikan dalam Rujukan artikel ${esc(it.rantai.dari.tarikh)}: ${esc(it.rantai.dari.penulis)} (${esc(it.rantai.dari.tahun)}), «${esc(it.rantai.dari.tajuk)}»${it.rantai.dari.doi ? ` <a href="https://doi.org/${esc(it.rantai.dari.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}${it.rantai.dari.artikelId && R.S.docs.has(it.rantai.dari.artikelId) ? ` <button class="btn btn-sm" data-rek="${esc(it.rantai.dari.artikelId)}">Rekod</button>` : ''}`}</div>` : ''}
        <div class="badges">${(it.kelas || kelasOf(it)) <= 5 ? `<span class="tag ok"><span>${esc(kelasLabel(it.kelas || kelasOf(it)))}${(it.kelas || kelasOf(it)) <= 4 ? ' (anggaran SJR)' : ''}</span></span>` : it.isCore ? '<span class="tag ok"><span>Jurnal teras (berwasit)</span></span>' : it.inDoaj ? '<span class="tag ok"><span>DOAJ (berwasit)</span></span>' : ''}${it.inDoaj && (it.kelas || kelasOf(it)) !== 7 ? '<span class="tag"><span>DOAJ</span></span>' : ''}${it.nRefs ? `<span class="tag" title="Bilangan rujukan dalam OpenAlex; asas rantaian esok"><span>${esc(it.nRefs)} rujukan</span></span>` : ''}<span class="tag pdf"><span>${it.pdfUrl ? 'PDF terbuka' : 'Akses terbuka'}</span></span><span class="tag"><span>Dipetik ${it.dipetik}</span></span>${pdfDalamDrive(it) ? '<span class="tag s-selesai"><span>PDF dalam Drive</span></span>' : it.artikelId && R.S.docs.has(it.artikelId) ? '<span class="tag s-selesai"><span>Dalam repositori</span></span>' : ''}${it.hasContent ? '<span class="tag"><span>Salinan OpenAlex</span></span>' : ''}</div>
        ${(() => { const K = klas(it); return `<div class="kaedah"><span class="tag j${K.tier}"><span>${esc(K.jenis)}</span></span><span class="padan" title="Padanan dengan metodologi kajian Prof Dr: tinjauan soal selidik, responden guru sekolah rendah, SEM, analisis perantara"><i><b style="width:${K.padanan}%"></b></i>Padanan metodologi ${K.padanan}%</span><div class="pet">${K.petunjuk && K.petunjuk.length ? 'Petunjuk jenis (keyakinan ' + esc(K.yakin) + '): ' + esc(K.petunjuk.join(', ')) + '. ' : 'Tiada petunjuk jenis dalam abstrak. '}${K.padananPetunjuk && K.padananPetunjuk.length ? 'Padanan: ' + esc(K.padananPetunjuk.join(', ')) + '. ' : 'Tiada padanan metodologi dikesan. '}<span class="auto">Dikesan automatik daripada tajuk dan abstrak; sahkan selepas membaca.</span></div></div>`; })()}
        ${it.fokus && it.fokus.aras ? `<div class="fokus-line"><b>Fokus konstruk.</b> ${esc(teksFokus(it))}${it.tema === TEMA_DKM && it.kolam && !(it.rantai && !it.rantai.baharu) ? ` <span class="auto">Kolam semasa: ${esc(it.kolam - 1)} artikel lagi menamakan konstruk ini dan memenuhi semua tapisan.</span>` : ''}</div>` : ''}
        <div class="abs" data-abs="${i}">${esc(it.abstrak || 'Abstrak tidak tersedia dalam OpenAlex.')}</div>
        <div class="why">Rujukan: ${esc(it.rujukan || apaRef(it))}</div>
        ${it.manual ? `<div class="manual"><b>Langkah manual.</b> ${esc(it.manual)}. Klik <b>Buka PDF</b>, simpan fail itu, kemudian pilih fail yang dimuat turun di sini (atau seret ke kad ini; di Android, buka fail dan Kongsi ke aplikasi Repositori SLR). Fail terus disimpan dalam Google Drive dan dipautkan ke rekod.<div class="acts" style="margin-top:6px">${it.pdfUrl ? `<a class="btn btn-sm btn-primary" href="${esc(it.pdfUrl)}" target="_blank" rel="noopener">Buka PDF</a>` : `<a class="btn btn-sm btn-primary" href="${esc(it.oaUrl)}" target="_blank" rel="noopener">Buka versi terbuka</a>`}<label class="btn btn-sm">Pilih fail PDF<input type="file" accept=".pdf,application/pdf" hidden data-pickfile="${i}"></label></div></div>` : ''}
        <div class="acts">
          ${pdfDalamDrive(it) ? `<button class="btn btn-sm btn-primary" data-baca-drive="${i}">Baca</button><button class="btn btn-sm" data-dl-drive="${i}">Muat turun</button>` : `<button class="btn btn-sm btn-primary" data-simpan="${i}" title="Simpan PDF ke Google Drive dan pautkan ke rekod">Simpan ke Drive</button>${it.pdfUrl ? `<button class="btn btn-sm" data-dl="${i}" title="Salinan ke peranti ini sahaja">Muat turun PDF</button><button class="btn btn-sm" data-baca-sini="${i}">Baca di sini</button>` : `<a class="btn btn-sm" href="${esc(it.oaUrl)}" target="_blank" rel="noopener">Buka versi terbuka</a>`}`}
          <a class="btn btn-sm" href="https://doi.org/${esc(it.doi)}" target="_blank" rel="noopener">DOI</a>
          <a class="btn btn-sm" href="${esc(sjr)}" target="_blank" rel="noopener" title="Semak pengindeksan Scopus dan kuartil SJR">Semak SJR</a>
          ${it.artikelId && R.S.docs.has(it.artikelId) ? `<button class="btn btn-sm" data-buka="${i}">Buka rekod</button>` : `<button class="btn btn-sm" data-tambah="${i}">Tambah ke repositori</button>`}
          ${(it.alt || []).length ? `<button class="btn btn-sm" data-tukar="${i}" title="Ganti dengan calon seterusnya">Tukar</button>` : ''}
        </div></article>`;
    }).join('');
    renderSemak(doc);
    badge();
  }
  function renderSemak(doc) {
    const el = $('#harianSemak'); if (!el) return;
    const st = doc && doc.semak; if (!st) { el.hidden = true; el.innerHTML = ''; return; }
    const awanBaca = st.logAwan === null || st.logAwan === undefined ? null : st.logAwan;
    const masalah = awanBaca === null || /gagal/.test(st.logTulis || '');
    el.hidden = false; el.className = 'harian-semak' + (masalah ? ' bad' : '');
    el.innerHTML = `<b>Semakan pendua:</b> ${esc(st.jumlah || 0)} DOI dikecualikan sebelum pemilihan (repositori ${esc(st.repo || 0)}, cadangan terdahulu ${esc(st.sejarah || 0)}, log peranti ini ${esc(st.logTempatan || 0)}, log tugas lama ${esc(st.lama || 0)}); tajuk dan ID OpenAlex turut disemak. Log awan: ${awanBaca === null ? 'tidak dapat dibaca' + (st.logRalat ? ' (' + esc(st.logRalat) + ')' : '') : esc(awanBaca) + ' DOI dibaca'}${st.logTulis ? ', ' + esc(st.logTulis) : ''}.${masalah ? ' <b>Amaran:</b> log awan tidak berfungsi, maka semakan pendua hanya tepat pada peranti ini. Terbitkan peraturan Firestore (koleksi meta dan cadangan) supaya semua peranti berkongsi log yang sama.' : ''}`;
  }
  async function simpan() { try { await saveDoc(H.doc, true); } catch (e) { toast('Perubahan tidak dapat disimpan: ' + (e.message || e.code || ''), true); } }
  async function apiKey() { try { const m = await R.db().getMeta(); return m && m.openalexKey ? String(m.openalexKey).trim() : ''; } catch (e) { return ''; } }
  function namaFail(it) { return (((it.penulis || [])[0] || 'artikel').split(' ').pop() + '_' + (it.tahun || '') + '_' + (it.tajuk || '').slice(0, 60)).replace(/[^\wÀ-ɏ-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '.pdf'; }
  // Rantaian satu sumber: salinan OpenAlex (CORS dibenarkan) -> URL penerbit -> manual (Buka PDF, pilih fail, seret, atau kongsi dari Android)
  async function ambilPdf(it, onStatus) {
    const key = await apiKey(); const tries = [];
    if (it.hasContent && it.oaId) tries.push({ url: CONTENT + it.oaId + '.pdf' + (key ? '?api_key=' + encodeURIComponent(key) : ''), sumber: 'OpenAlex' });
    if (it.pdfUrl) tries.push({ url: it.pdfUrl, sumber: 'penerbit' });
    let last = { code: 'tiada' };
    for (const t of tries) {
      if (onStatus) onStatus('Mengambil PDF daripada ' + t.sumber);
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 60000);
        let r; try { r = await fetch(t.url, { mode: 'cors', credentials: 'omit', signal: ctl.signal }); } finally { clearTimeout(tm); }
        if (r.status === 429) { last = { code: 'kuota', sumber: t.sumber }; continue; }
        if (!r.ok) { last = { code: 'http', status: r.status, sumber: t.sumber }; continue; }
        const buf = await r.arrayBuffer();
        const head = new TextDecoder('latin1').decode(new Uint8Array(buf.slice(0, 1024)));
        if (!head.includes('%PDF')) { last = { code: 'not_pdf', sumber: t.sumber }; continue; }
        return { buf, sumber: t.sumber };
      } catch (e) { last = { code: e && e.name === 'AbortError' ? 'masa' : 'cors', sumber: t.sumber }; }
    }
    throw last;
  }
  function ambilMsg(e) {
    const c = e && e.code;
    if (c === 'kuota') return 'bajet OpenAlex hari ini habis (tetapkan kunci API dalam Tetapan)';
    if (c === 'cors') return 'penerbit menyekat muat turun automatik dari aplikasi';
    if (c === 'not_pdf') return 'pautan penerbit memulangkan halaman web, bukan fail PDF';
    if (c === 'http') return 'pelayan menolak permintaan (' + e.status + ')';
    if (c === 'masa') return 'tamat masa menunggu penerbit';
    return 'tiada pautan PDF';
  }
  async function dlPdf(it, i) {
    setBusy(i, 'Mengambil PDF');
    try { const { buf, sumber } = await ambilPdf(it, t => setBusy(i, t)); R.saveFile(namaFail(it), buf, 'application/pdf'); toast('PDF dimuat turun ke peranti ini (sumber: ' + sumber + ')'); }
    catch (e) { if (it.pdfUrl) window.open(it.pdfUrl, '_blank', 'noopener'); toast('Muat turun automatik gagal: ' + ambilMsg(e) + (it.pdfUrl ? '. PDF dibuka dalam tab baharu.' : ''), true); }
    finally { setBusy(i, null); }
  }
  function setBusy(i, text) { const el = $(`#picks .pick[data-i="${i}"] [data-simpan]`); if (!el) return; if (text) { el.disabled = true; el.textContent = text; } else { el.disabled = false; el.textContent = 'Simpan ke Drive'; } }
  function pdfDalamDrive(it) { const d = it.artikelId ? R.S.docs.get(it.artikelId) : null; return !!(d && (d.fail || []).length); }
  // Simpan ke Drive: PDF dimasukkan ke folder Google Drive dan dipautkan ke rekod repositori, lalu tersedia di semua peranti.
  async function simpanKeDrive(i) {
    const it = H.doc.items[i]; if (!it || it.kosong) return;
    if (!R.drive().hasToken()) { const ok = await R.ensureDrive(true); if (!ok) return; }
    setBusy(i, 'Mengambil PDF');
    try {
      const { buf, sumber } = await ambilPdf(it, t => setBusy(i, t));
      await intakeFile(it, new File([buf], namaFail(it), { type: 'application/pdf' }), sumber);
    } catch (e) {
      it.manual = ambilMsg(e); setBusy(i, null); render();
      toast('Muat turun automatik gagal: ' + ambilMsg(e) + '. Gunakan langkah manual pada kad.', true);
    }
  }
  async function intakeFile(it, file, sumber) {
    if (!it.artikelId || !R.S.docs.has(it.artikelId)) it.artikelId = tambah(it);
    await R.uploadFiles([file], it.artikelId);
    const ok = pdfDalamDrive(it);
    if (ok) { it.manual = null; it.pdfDrive = true; }
    await simpan(); render();
    if (ok) toast(`PDF disimpan dalam Google Drive dan dipautkan ke rekod Bil. ${(R.S.docs.get(it.artikelId) || {}).bil || ''}${sumber ? ' (sumber: ' + sumber + ')' : ''}`, false, { label: 'Buka rekod', fn: () => R.openRecord(it.artikelId) });
    return ok;
  }
  async function intake(i, files) {
    const it = H.doc && H.doc.items[i]; if (!it || it.kosong) return false;
    const f = Array.from(files || []).find(x => /\.pdf$/i.test(x.name) || x.type === 'application/pdf'); if (!f) { toast('Pilih fail PDF', true); return false; }
    return intakeFile(it, f, 'fail yang dipilih');
  }
  // Padankan fail yang dimuat naik (DOI dikesan daripada PDF) dengan cadangan hari ini.
  async function linkByDoi(articleId, doi, baru) {
    const n = R.normDoi(doi); if (!n || !H.doc) return false;
    const it = H.doc.items.find(x => !x.kosong && x.doi === n); if (!it) return false;
    it.artikelId = articleId; it.manual = null;
    const d = R.S.docs.get(articleId) || {}; const patch = {};
    const want = Object.assign({ tajuk: it.tajuk, penulis: penulisRingkas(it.penulis), tahun: it.tahun, rujukan: it.rujukan || apaRef(it), tema: temaRekod(it.tema), pautan: it.pdfUrl || it.oaUrl }, medanDaripada(it));
    // Rekod yang baru dicipta daripada PDF: metadata OpenAlex (tajuk, penulis, tahun) lebih dipercayai daripada tekaan daripada teks PDF.
    const utama = baru ? ['tajuk', 'penulis', 'tahun', 'rujukan'] : [];
    Object.keys(want).forEach(k => { if (want[k] && (utama.includes(k) || !(d[k] && String(d[k]).trim()))) patch[k] = want[k]; });
    if (Object.keys(patch).length) { try { await R.writeNow(articleId, patch); } catch (e) {} }
    await simpan(); render(); toast('PDF dipadankan dengan cadangan hari ini: ' + it.tema);
    return true;
  }
  // Medan rekod yang boleh diisi awal daripada cadangan (pilihan senarai mengikut borang 13 medan; butiran automatik dicatat untuk disahkan).
  function medanDaripada(it) {
    const K = klas(it); const kelas = it.kelas || kelasOf(it);
    const jenis = /^Meta/.test(K.jenis) ? 'Meta-analisis' : /^Ulasan skop/.test(K.jenis) ? 'Ulasan skop' : /^(Ulasan|Analisis bibliometrik)/.test(K.jenis) ? 'Ulasan sistematik' : /^Konseptual/.test(K.jenis) ? 'Konseptual' : /instrumen/i.test(K.jenis) ? 'Instrumen dan pengesahan' : K.tier === 0 || K.tier === 2 ? 'Empirikal' : '';
    const rekaBentuk = K.tier === 0 ? (/campuran/i.test(K.jenis) ? 'Kaedah campuran' : 'Kuantitatif') : K.tier === 2 ? 'Kualitatif' : K.tier === 3 ? 'Ulasan atau sintesis' : K.tier === 4 ? 'Konseptual' : '';
    const indeks = kelas <= 5 ? 'Scopus' : 'Tidak pasti'; const kuartil = kelas <= 4 ? 'Q' + kelas : 'Tidak pasti';
    const catatan = `Dicadangkan oleh Cadangan Harian pada ${H.date}.${it.tema === TEMA_DKM ? ' Slot carian: Pengurusan Pengetahuan Digital Organisasi (digital knowledge management, DKM).' : ''}${it.fokus && it.fokus.aras ? ' Fokus konstruk: ' + teksFokus(it) : ''}${it.jurnal ? ' Jurnal: ' + it.jurnal + '.' : ''} Jenis dan reka bentuk dikesan automatik daripada tajuk dan abstrak: ${K.jenis}${K.petunjuk && K.petunjuk.length ? ' (petunjuk: ' + K.petunjuk.slice(0, 6).join(', ') + ')' : ''}; padanan metodologi ${K.padanan}%${K.padananPetunjuk && K.padananPetunjuk.length ? ' (' + K.padananPetunjuk.join(', ') + ')' : ''}. Pengindeksan mengikut senarai Scopus Nov 2024; kuartil anggaran SJR. Sila sahkan selepas membaca.`;
    return { jenis, rekaBentuk, indeks, kuartil, catatan };
  }
  function tambah(it) {
    // Elak pendua: jika rekod dengan DOI yang sama sudah ada (mungkin dicipta di peranti lain), guna rekod itu.
    const n = R.normDoi(it.doi); let ada = null;
    if (n) R.S.docs.forEach((d, id) => { if (!ada && R.normDoi(d.doi) === n) ada = id; });
    H.reused = !!ada; if (ada) return ada;
    const extra = Object.assign({ tajuk: it.tajuk, penulis: penulisRingkas(it.penulis), tahun: it.tahun, doi: it.doi, rujukan: it.rujukan || apaRef(it), tema: temaRekod(it.tema), pautan: it.pdfUrl || it.oaUrl, status: 'Belum dibaca' }, medanDaripada(it));
    const id = R.createArticle(extra); R.renderList(); return id;
  }
  $('#picks').addEventListener('click', async e => {
    const b = e.target.closest('[data-dl],[data-baca-sini],[data-tambah],[data-buka],[data-tukar],[data-abs],[data-simpan],[data-baca-drive],[data-dl-drive]'); if (!b || !H.doc) return;
    const i = +(b.dataset.dl ?? b.dataset.bacaSini ?? b.dataset.tambah ?? b.dataset.buka ?? b.dataset.tukar ?? b.dataset.abs ?? b.dataset.simpan ?? b.dataset.bacaDrive ?? b.dataset.dlDrive);
    const it = H.doc.items[i]; if (!it) return;
    if (b.dataset.abs !== undefined) { b.classList.toggle('open'); return; }
    if (b.dataset.simpan !== undefined) simpanKeDrive(i);
    else if (b.dataset.bacaDrive !== undefined) R.openFlip(it.artikelId, 0);
    else if (b.dataset.dlDrive !== undefined) R.downloadPdf(it.artikelId, 0);
    else if (b.dataset.dl !== undefined) dlPdf(it, i);
    else if (b.dataset.bacaSini !== undefined) R.Flip.open({ title: penulisRingkas(it.penulis) + ' (' + it.tahun + ')', sub: it.tajuk, source: { kind: 'url', url: it.pdfUrl }, dl: it.pdfUrl, note: 'Dibaca terus daripada penerbit. Tambah ke repositori dan muat naik PDF untuk simpanan kekal.' });
    else if (b.dataset.tambah !== undefined) { it.artikelId = tambah(it); await simpan(); render(); toast((H.reused ? 'Rekod sedia ada (DOI sama) digunakan: Bil. ' : 'Rekod Bil. ') + ((R.S.docs.get(it.artikelId) || {}).bil || '') + (H.reused ? '' : ' dicipta'), false, { label: 'Buka', fn: () => R.openRecord(it.artikelId) }); }
    else if (b.dataset.buka !== undefined) R.openRecord(it.artikelId);
    else if (b.dataset.tukar !== undefined) {
      const alt = (it.alt || []).shift(); if (!alt) return;
      const i = H.doc.items.indexOf(it); const nu = Object.assign({}, alt, { tema: it.tema, dibaca: false, artikelId: null, alt: it.alt, rantai: alt.rantai || it.rantai }); nu.rujukan = apaRef(nu);
      H.doc.items[i] = nu; await simpan(); await logPicks([nu]);
      render();
    }
  });
  $('#harian').addEventListener('click', async e => {
    const b = e.target.closest('[data-rek]'); if (b) { R.openRecord(b.dataset.rek); return; }
    const w = e.target.closest('[data-web]'); if (w) { R.Web.open(w.dataset.web); return; }
    const c = e.target.closest('[data-salin]'); if (c) { try { await navigator.clipboard.writeText(c.dataset.salin); toast('Rujukan APA 7 disalin'); } catch (er) { toast('Papan keratan tidak tersedia', true); } }
  });
  $('#picks').addEventListener('change', async e => {
    const pf = e.target.closest('[data-pickfile]'); if (pf) { const files = Array.from(pf.files || []); pf.value = ''; intake(+pf.dataset.pickfile, files); return; }
    const c = e.target.closest('[data-baca]'); if (!c || !H.doc) return; const it = H.doc.items[+c.dataset.baca]; if (!it) return; it.dibaca = c.checked; await simpan(); render(); });
  $('#btnHarianCari').addEventListener('click', () => { H.date = todayStr(); cari(true); });
  $('#harianTarikh').addEventListener('change', e => load(e.target.value, false));

  return { load, cari, loadDates, badge, todayStr, intake, linkByDoi, render, renderRantaian, klas, jenisOf, padananOf, fokusPP, fokusDKM, teksFokus, kemasMediator, TEMA_DKM, SLOT, ENJIN, VARIAN, state: H };
}
