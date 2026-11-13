"""ARKIB (v1.30.0). Sejak v1.30.1, data/scopus_henti.json dibina oleh tools/bina_scopus.py daripada fail rasmi Scopus.
Skrip dan senarai ini disimpan sebagai rekod cara senarai sementara v1.30.0 dibina.

Bina data/scopus_henti.json daripada senarai judul yang dihentikan liputannya oleh Scopus.

Guna:  python3 tools/arkib/bina_henti.py tools/arkib/scopus_henti_ogos2026.txt <fail keluaran.json>

Fail sumber ialah teks biasa, satu judul sebaris:
    TAJUK | ISSN | EISSN | PERUBAHAN | TAHUN LIPUTAN AKHIR | EDISI
Baris yang bermula dengan # ialah catatan. Senarai asal: Scopus Discontinued Titles (Elsevier), yang dikemas kini
setiap bulan dan dipautkan daripada halaman "Scopus content policy and selection". Setiap ISSN disahkan dengan digit
semak (mod 11) sebelum ditulis. Judul yang panjang turut disimpan dalam bentuk ternormal supaya jurnal yang ISSN-nya
dicetak berbeza dalam senarai masih dapat dipadankan melalui nama.

Senarai ini pelengkap kepada data/scopus.json: jurnal yang masih "Active" dalam Scopus Source Title List yang lebih
lama tetapi liputannya sudah dihentikan tidak lagi dikira sebagai jurnal Scopus oleh Cadangan Harian.
"""
import json
import re
import sys
import unicodedata
from datetime import date

PANJANG_NAMA = 28  # hanya judul ternormal sepanjang ini atau lebih dipadankan melalui nama


def sah(issn):
    if not re.fullmatch(r"[0-9]{7}[0-9X]", issn):
        return False
    s = sum((8 - k) * int(c) for k, c in enumerate(issn[:7]))
    r = (11 - s % 11) % 11
    return ("X" if r == 10 else str(r)) == issn[7]


def norma(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode("ascii").lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def main(src, dst):
    h, t, n, catatan = {}, {}, 0, []
    for ln in open(src, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if not ln.strip():
            continue
        if ln.startswith("#"):
            catatan.append(ln.lstrip("# ").strip())
            continue
        p = [x.strip() for x in ln.split("|")]
        if len(p) != 6:
            raise SystemExit("Baris tidak lengkap: " + ln)
        tajuk, i1, i2, ubah, tahun, _edisi = p
        if ubah not in ("Discontinuation", "Journal change policy"):
            raise SystemExit("Perubahan tidak dikenali: " + ln)
        tahun = int(tahun)
        for i in (i1, i2):
            if not i:
                continue
            if not sah(i):
                raise SystemExit("ISSN gagal digit semak: " + ln)
            h[i] = max(h.get(i, 0), tahun)
        nm = norma(tajuk)
        if len(nm) >= PANJANG_NAMA:
            t[nm] = max(t.get(nm, 0), tahun)
        n += 1
    meta = {
        "sumber": "Scopus Discontinued Titles (Elsevier), status Ogos 2026; dibaca daripada salinan PDF Perpustakaan Tunku Tun Aminah UTHM dan disilang dengan edisi Februari 2026",
        "pautan": "https://ptta.uthm.edu.my/images/Picture/Research%20Support/Predatory%20Journal/Discontinued%20title%20Aug%202026.pdf",
        "edisi": "Ogos 2026",
        "liputan": "judul dengan liputan akhir 2024 hingga 2026, serta 15 judul pendidikan dan sains sosial dengan liputan akhir 2023",
        "fail": src.split("/")[-1],
        "tarikh_bina": date.today().isoformat(),
        "jumlah_judul": n,
    }
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "h": h, "t": t}, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print("judul:", n, "| ISSN:", len(h), "| nama panjang:", len(t), "| ->", dst)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
