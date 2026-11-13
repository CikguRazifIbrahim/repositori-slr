"""Bina data/scopus.json dan data/scopus_henti.json daripada Scopus Source Title List (fail Excel rasmi Elsevier).

Guna:  python3 tools/bina_scopus.py "ext_list_Sep_2026.xlsx" data/scopus.json data/scopus_henti.json
           [--scimago "scimagojr 2025.csv"] [--kuartil scopus_lama.json]
Perlu: pip install openpyxl

Fail sumber dipautkan pada halaman "Scopus content policy and selection" (Elsevier) dan dikemas kini setiap bulan.

data/scopus.json        ISSN -> kuartil (1 hingga 4; 0 = jurnal Scopus tanpa kuartil). Hanya sumber berjenis Journal yang
                        berstatus Active dan tidak ditanda "Discontinued by Scopus" dalam helaian Sources diambil.
                        Asas kuartil, mengikut keutamaan:
                        (1) --scimago: fail "Download data" daripada halaman Journal Rankings SCImago Journal & Country
                            Rank (scimagojr.com/journalrank.php, semua bidang dan semua negara). Kuartil ialah lajur
                            "SJR Best Quartile", iaitu kuartil rasmi terbaik merentas kategori, dipadankan mengikut ISSN;
                            meta.kuartil_rasmi = true. Jurnal yang tiada kuartil dalam edisi itu mendapat 0.
                        (2) lajur SJR dalam helaian Sources (edisi lama): kuartil DIANGGAR mengikut kategori ASJC (kaedah
                            SCImago: kedudukan SJR dalam setiap kategori, Q1 = 25 peratus teratas; kuartil terbaik
                            merentas kategori disimpan).
                        (3) --kuartil: fail scopus.json terdahulu; kuartil dibawa mengikut ISSN dan jurnal yang baharu
                            mendapat 0 (digunakan bagi edisi tanpa lajur SJR, contohnya September 2026).
data/scopus_henti.json  ISSN (dan nama panjang ternormal) -> tahun liputan akhir bagi judul yang liputannya dihentikan oleh
                        Scopus: helaian Discontinued Titles, disatukan dengan baris yang ditanda "Discontinued by Scopus"
                        dalam helaian Sources (tahun akhir daripada lajur Coverage). ISSN yang gagal digit semak ditinggalkan;
                        judul itu masih dipadankan melalui nama.
"""
import bisect
import collections
import csv
import io
import json
import re
import sys
import unicodedata
from datetime import date

import openpyxl

BULAN = {"jan": "Januari", "feb": "Februari", "mar": "Mac", "apr": "April", "may": "Mei", "jun": "Jun", "jul": "Julai",
         "aug": "Ogos", "sep": "September", "oct": "Oktober", "nov": "November", "dec": "Disember"}
PANJANG_NAMA = 28  # hanya judul ternormal sepanjang ini atau lebih dipadankan melalui nama


def issn8(x):
    x = re.sub(r"[^0-9Xx]", "", str(x or ""))
    return x.upper() if len(x) == 8 else ""


def sah(issn):
    if not re.fullmatch(r"[0-9]{7}[0-9X]", issn):
        return False
    s = sum((8 - k) * int(c) for k, c in enumerate(issn[:7]))
    r = (11 - s % 11) % 11
    return ("X" if r == 10 else str(r)) == issn[7]


def norma(t):
    t = unicodedata.normalize("NFKD", str(t or "")).encode("ascii", "ignore").decode("ascii").lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def edisi(nama_helaian):
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(20\d\d)", nama_helaian)
    return (BULAN.get(m.group(1).lower(), m.group(1)) + " " + m.group(2)) if m else ""


def lajur(col, *awalan, wajib=True):
    for a in awalan:
        for h, i in col.items():
            if h == a or h.startswith(a):
                return i
    if wajib:
        raise SystemExit("Lajur tidak ditemui: " + " / ".join(awalan))
    return None


def baca_scimago(laluan):
    """Baca fail "Download data" SCImago Journal Rank: CSV (lazimnya bertitik bertindih, perpuluhan berkoma) dengan lajur
    Issn (satu atau lebih ISSN tanpa sempang, dipisah koma) dan SJR Best Quartile (Q1 hingga Q4, atau "-").
    Pulangan: (ISSN -> kuartil terbaik, ISSN yang ada dalam fail tetapi tiada kuartil, tahun edisi, ringkasan bilangan)."""
    teks = open(laluan, "rb").read().decode("utf-8-sig", errors="replace")
    kepala_mentah = teks.split("\n", 1)[0]
    pemisah = ";" if kepala_mentah.count(";") >= kepala_mentah.count(",") else ","
    rd = csv.reader(io.StringIO(teks, newline=""), delimiter=pemisah, quotechar='"')
    kepala = [str(h or "").strip().lower() for h in next(rd)]
    col = {h: i for i, h in enumerate(kepala)}
    if "issn" not in col or "sjr best quartile" not in col:
        raise SystemExit("Fail SCImago: lajur Issn atau SJR Best Quartile tidak ditemui. Kepala: " + " | ".join(kepala))
    i_issn, i_q, i_jenis = col["issn"], col["sjr best quartile"], col.get("type")
    tahun = next((m.group(1) for m in (re.search(r"\((20\d\d)\)", h) for h in kepala if h.startswith("total docs")) if m), "")
    if not tahun:
        m = re.search(r"(20\d\d)", laluan.split("/")[-1])
        tahun = m.group(1) if m else ""
    if not tahun:
        raise SystemExit("Fail SCImago: tahun edisi tidak dapat ditentukan daripada kepala lajur atau nama fail.")
    q, tanpa, jenis, taburan = {}, set(), collections.Counter(), collections.Counter()
    baris = dilapik = ditolak = bercanggah = pelik = 0
    for r in rd:
        if not r:
            continue
        if len(r) != len(kepala):   # petikan tidak berpasangan dalam tajuk boleh menganjak lajur; baris sebegini tidak dipercayai
            pelik += 1
            continue
        baris += 1
        if i_jenis is not None:
            jenis[r[i_jenis].strip().lower()] += 1
        m = re.fullmatch(r"Q([1-4])", r[i_q].strip().upper())
        taburan[m.group(0) if m else "tiada"] += 1
        for bahagian in re.split(r"[,;/\s]+", r[i_issn]):
            b = re.sub(r"[^0-9Xx]", "", bahagian).upper()
            if not b:
                continue
            if 5 <= len(b) < 8 and sah(b.zfill(8)):   # sifar di hadapan gugur (fail pernah disimpan semula oleh perisian hamparan)
                b = b.zfill(8)
                dilapik += 1
            if len(b) != 8:
                ditolak += 1
                continue
            if m:
                nilai = int(m.group(1))
                if b in q and q[b] != nilai:
                    bercanggah += 1
                q[b] = min(q.get(b, 9), nilai)
            else:
                tanpa.add(b)
    tanpa -= set(q)
    ringkasan = {"baris": baris, "jenis": dict(jenis), "taburan": dict(taburan), "issn_berkuartil": len(q), "issn_tanpa_kuartil": len(tanpa),
                 "issn_dilapik_sifar": dilapik, "issn_ditolak": ditolak, "issn_kuartil_bercanggah": bercanggah, "baris_lajur_tidak_sepadan": pelik}
    if not q:
        raise SystemExit("Fail SCImago: tiada satu pun ISSN berkuartil dibaca; semak fail. " + json.dumps(ringkasan, ensure_ascii=False))
    return q, tanpa, tahun, ringkasan


def main(src, dst, dst_henti, kuartil_lama, scimago=None):
    sc = baca_scimago(scimago) if scimago else None
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    nama = next((n for n in wb.sheetnames if n.lower().startswith(("scopus sources", "scopus active"))), None)
    if not nama:
        raise SystemExit("Helaian sumber Scopus tidak ditemui: " + ", ".join(wb.sheetnames))
    rows_iter = wb[nama].iter_rows(values_only=True)
    col = {str(h or "").replace("\n", " ").strip().lower(): i for i, h in enumerate(next(rows_iter))}
    i_tajuk, i_issn, i_eissn = lajur(col, "source title"), lajur(col, "issn"), lajur(col, "eissn")
    i_aktif, i_jenis, i_asjc = lajur(col, "active"), lajur(col, "source type"), lajur(col, "all science journal classification")
    i_henti, i_liputan = lajur(col, "titles discontinued", wajib=False), lajur(col, "coverage", wajib=False)
    i_sjr = next((i for h, i in col.items() if h.endswith(" sjr")), None)
    lama = json.load(open(kuartil_lama, encoding="utf-8")) if kuartil_lama else None
    if sc is None and i_sjr is None and lama is None:
        raise SystemExit("Helaian ini tiada lajur SJR; berikan --scimago <fail SCImago> bagi kuartil rasmi, atau --kuartil <scopus.json terdahulu> supaya anggaran lama dapat dibawa.")
    rows, henti, nama_henti = [], {}, {}
    for r in rows_iter:
        if not r or not r[0]:
            continue
        if str(r[i_jenis] or "").strip().lower() != "journal":
            continue
        issns = [x for x in (issn8(r[i_issn]), issn8(r[i_eissn])) if x]
        ditanda = i_henti is not None and str(r[i_henti] or "").strip() != ""
        if ditanda:
            tahun = max([int(y) for y in re.findall(r"(?:19|20)\d\d", str(r[i_liputan] or ""))] or [1]) if i_liputan is not None else 1
            for i in issns:
                if sah(i):
                    henti[i] = max(henti.get(i, 0), tahun)
            nm = norma(r[i_tajuk])
            if len(nm) >= PANJANG_NAMA:
                nama_henti[nm] = max(nama_henti.get(nm, 0), tahun)
            continue
        if str(r[i_aktif] or "").strip().lower() != "active" or not issns:
            continue
        try:
            sjr = float(r[i_sjr]) if i_sjr is not None and r[i_sjr] not in (None, "", "None") else None
        except (TypeError, ValueError):
            sjr = None
        codes = [c.strip() for c in str(r[i_asjc] or "").split(";") if c.strip()]
        rows.append((issns, sjr, codes))
    out, baharu, tambahan = {}, 0, {}
    if sc is not None:
        qs, tanpa_s, tahun_s, ring = sc
        tiada = tanpa_q = 0
        for issns, _sjr, _codes in rows:
            ada = [qs[i] for i in issns if i in qs]
            q = min(ada) if ada else 0
            if not ada:
                if any(i in tanpa_s for i in issns):
                    tanpa_q += 1
                else:
                    tiada += 1
            for i in issns:
                out[i] = q
        kuartil = "SJR " + tahun_s
        asas_kuartil = ("kuartil ialah lajur SJR Best Quartile (kuartil terbaik merentas kategori) dalam fail SCImago Journal & Country Rank edisi "
                        + tahun_s + ", dipadankan mengikut ISSN; jurnal yang tiada kuartil dalam edisi itu bernilai 0")
        tambahan = {"kuartil_rasmi": True, "sumber_kuartil": "SCImago Journal & Country Rank, edisi " + tahun_s + " (scimagojr.com), fail " + scimago.split("/")[-1],
                    "jurnal_tiada_dalam_scimago": tiada, "jurnal_scimago_tanpa_kuartil": tanpa_q, "scimago": ring}
        baharu = tiada + tanpa_q
    elif i_sjr is not None:
        bycat = collections.defaultdict(list)
        for issns, sjr, codes in rows:
            if sjr is not None:
                for c in codes:
                    bycat[c].append(sjr)
        for c in bycat:
            bycat[c].sort()
        for issns, sjr, codes in rows:
            q = 0
            if sjr is not None:
                best = 5
                for c in codes:
                    arr = bycat.get(c) or []
                    if not arr:
                        continue
                    higher = len(arr) - bisect.bisect_right(arr, sjr)
                    best = min(best, int(higher * 4 / len(arr)) + 1)
                q = best if best < 5 else 0
            for i in issns:
                if i in out and out[i] and (not q or out[i] <= q):
                    continue
                out[i] = q
        asas_kuartil = "kuartil dianggar daripada lajur SJR helaian itu mengikut kategori ASJC (kaedah SCImago)"
        kuartil = "SJR"
    else:
        ql = lama.get("q", {})
        for issns, _sjr, _codes in rows:
            ada = [int(ql[i]) for i in issns if i in ql]
            if not ada:
                baharu += 1
            q = min([x for x in ada if x] or [0])
            for i in issns:
                out[i] = q
        m = re.search(r"(20\d\d) SJR|SJR (20\d\d)", str(lama.get("meta", {}).get("sumber", "")))
        kuartil = "SJR " + (m.group(1) or m.group(2)) if m else str(lama.get("meta", {}).get("kuartil", "SJR"))
        asas_kuartil = "edisi ini tiada lajur SJR, maka kuartil dibawa mengikut ISSN daripada anggaran " + kuartil + " dalam binaan terdahulu; jurnal yang baharu dalam senarai tiada kuartil"
    ed = edisi(nama)
    meta = {"sumber": "Scopus Source Title List, " + ed + " (Elsevier, fail rasmi), helaian " + nama + ": jurnal berstatus Active yang tidak ditanda Discontinued by Scopus; " + asas_kuartil,
            "edisi": ed, "kuartil": kuartil, "fail": src.split("/")[-1], "tarikh_bina": date.today().isoformat(), "jumlah_jurnal": len(rows),
            ("jurnal_tanpa_kuartil" if sc is not None else "jurnal_tanpa_kuartil_baharu"): baharu}
    meta.update(tambahan)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "q": out}, f, ensure_ascii=False, separators=(",", ":"))
    print("jurnal aktif:", len(rows), "| ISSN:", len(out), "| asas kuartil:", kuartil + (" (rasmi, SCImago)" if sc is not None else " (anggaran)"),
          "| jurnal tanpa kuartil:", baharu, "| taburan ISSN:", dict(sorted(collections.Counter(out.values()).items())), "| ->", dst)
    if sc is not None:
        print("SCImago:", json.dumps(tambahan["scimago"], ensure_ascii=False), "| jurnal Scopus aktif tiada dalam fail:", tambahan["jurnal_tiada_dalam_scimago"],
              "| ada tetapi tanpa kuartil:", tambahan["jurnal_scimago_tanpa_kuartil"])

    # Judul yang liputannya dihentikan: helaian Discontinued Titles disatukan dengan baris bertanda dalam helaian Sources
    nd = next((n for n in wb.sheetnames if n.lower().startswith("discontinued")), None)
    judul, gagal, ubah = 0, [], collections.Counter()
    if nd:
        baris = list(wb[nd].iter_rows(values_only=True))
        k = next(i for i, r in enumerate(baris) if r and any(str(x or "").strip().lower().startswith("source title") for x in r))
        cd = {str(h or "").replace("\n", " ").strip().lower(): i for i, h in enumerate(baris[k])}
        d_tajuk, d_issn, d_eissn = lajur(cd, "source title"), lajur(cd, "issn"), lajur(cd, "eissn")
        d_ubah, d_tahun = lajur(cd, "indexation change", "reason", wajib=False), lajur(cd, "year", "coverage", wajib=False)
        for r in baris[k + 1:]:
            if not r or not r[d_tajuk]:
                continue
            judul += 1
            if d_ubah is not None:
                ubah[str(r[d_ubah] or "").strip() or "(kosong)"] += 1
            tahun = max([int(y) for y in re.findall(r"(?:19|20)\d\d", str(r[d_tahun] or ""))] or [1]) if d_tahun is not None else 1
            for i in (issn8(r[d_issn]), issn8(r[d_eissn])):
                if not i:
                    continue
                if not sah(i):
                    gagal.append(i)
                    continue
                henti[i] = max(henti.get(i, 0), tahun)
            nm = norma(r[d_tajuk])
            if len(nm) >= PANJANG_NAMA:
                nama_henti[nm] = max(nama_henti.get(nm, 0), tahun)
    bertindih = sorted(set(henti) & set(out))
    if bertindih:
        raise SystemExit("ISSN aktif yang juga dihentikan (semak fail sumber): " + ", ".join(bertindih[:10]))
    meta_h = {"sumber": "Scopus Source Title List, " + ed + " (Elsevier, fail rasmi): helaian " + (nd or "(tiada)") + " disatukan dengan baris bertanda Discontinued by Scopus dalam helaian " + nama,
              "edisi": ed, "fail": src.split("/")[-1], "tarikh_bina": date.today().isoformat(), "jumlah_judul": judul, "perubahan": dict(ubah), "issn_gagal_digit_semak": sorted(set(gagal))}
    with open(dst_henti, "w", encoding="utf-8") as f:
        json.dump({"meta": meta_h, "h": henti, "t": nama_henti}, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print("judul dihentikan:", judul, dict(ubah), "| ISSN:", len(henti), "| nama panjang:", len(nama_henti), "| ISSN gagal digit semak:", sorted(set(gagal)), "| ->", dst_henti)


if __name__ == "__main__":
    a, pilihan, k = [], {}, 1
    while k < len(sys.argv):
        if sys.argv[k] in ("--kuartil", "--scimago"):
            if k + 1 >= len(sys.argv):
                raise SystemExit(sys.argv[k] + " memerlukan laluan fail.\n" + __doc__)
            pilihan[sys.argv[k]] = sys.argv[k + 1]
            k += 2
        else:
            a.append(sys.argv[k])
            k += 1
    if len(a) != 3 or any(x.startswith("--") for x in a):
        raise SystemExit(__doc__)
    main(a[0], a[1], a[2], pilihan.get("--kuartil"), pilihan.get("--scimago"))
