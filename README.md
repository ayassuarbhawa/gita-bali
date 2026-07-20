# Gita Bali — Fondasi Data

Basis data Bhagawad Gita dengan terjemahan Bahasa Indonesia dan Bahasa Bali.
Proyek ini memuat fondasi data, alat bantu verifikasi, dan frontend pembaca
statis. Tidak memakai framework, proses build, atau dependency.

## Struktur

```
data/
  schema.json     JSON Schema untuk acuan struktur
  bab-01.json     data Bab 1 (47 sloka, prioritas utama)
  bab-02.json     data Bab 2 (72 sloka, masih kosong)
tools/
  validate.mjs    validator integritas data
  stats.mjs       laporan progres pengisian
preview/
  index.html      frontend pembaca publik statis
```

## Cara menjalankan

Semua perintah dijalankan dari root project (`/Users/ayas/gita-bali`).

### Validasi

```bash
node tools/validate.mjs
# atau untuk file lain:
node tools/validate.mjs data/bab-02.json
```

Yang dicek:
- File valid UTF-8; melaporkan karakter pengganti `U+FFFD` (indikasi teks rusak).
- Struktur dasar sesuai skema.
- Nomor sloka berurutan `1..N` tanpa lompat atau duplikat.
- Jumlah entri `sloka` cocok dengan `jumlah_sloka`.
- Diakritik IAST mencurigakan: karakter non-ASCII di field `iast` yang **bukan**
  bagian dari set IAST sah (`āīūṛṝḷḹēōṅñṭḍṇśṣṁḥ` beserta versi kapitalnya).
- Field `id` tidak boleh persis sama dengan field `iast` (indikasi salah paste).

Keluar dengan kode `1` bila ada error, `0` bila lolos.

### Laporan progres

```bash
node tools/stats.mjs
```

Menampilkan: jumlah field terisi per field dan per status, persentase progres
`id` dan `ban`, serta daftar nomor sloka yang masih kosong.

### Frontend pembaca

```bash
python3 -m http.server
```

Lalu buka <http://localhost:8000/preview/>. Frontend membaca
`data/bab-02.json`, menampilkan teks Sanskrit/IAST, pilihan terjemahan Indonesia
atau Bali, serta pencarian nomor dan isi sloka. Jika belum ada teks yang dapat
dibaca, halaman menampilkan keadaan kosong tanpa membuat konten contoh.

> Server HTTP diperlukan karena frontend memakai `fetch`; membuka file `.html`
> langsung lewat `file://` akan diblokir browser.

## Arti field

| Field         | Arti |
|---------------|------|
| `bab`         | Nomor bab (1–18). |
| `judul`       | Judul bab: `sanskrit`, `id` (Indonesia), `ban` (Bali, `null` bila belum ada). |
| `jumlah_sloka`| Jumlah sloka resmi pada bab ini. |
| `sumber`      | Rujukan teks: `sanskrit`, `terjemahan_id`, `terjemahan_ban`. |
| `sloka[]`     | Daftar sloka. |

Tiap entri `sloka`:

| Field        | Arti |
|--------------|------|
| `no`         | Nomor sloka, berurutan mulai 1. |
| `devanagari` | Teks Devanagari (aksara Sanskrit). |
| `iast`       | Transliterasi Latin berdiakritik (IAST). |
| `id`         | Terjemahan Bahasa Indonesia. |
| `ban`        | Terjemahan Bahasa Bali (`null` bila belum digarap). |
| `status`     | Status penggarapan per bahasa: `{ id, ban }`. |
| `catatan`    | Catatan bebas untuk editor. |

## Nilai status

| Nilai    | Arti |
|----------|------|
| `kosong` | Belum ada isi. |
| `draf`   | Draf awal, belum ditinjau. |
| `review` | Sedang / sudah ditinjau, belum final. |
| `final`  | Sudah final, siap terbit. |

## Catatan penting

**Field `sumber` (sanskrit, terjemahan_id, terjemahan_ban) WAJIB diisi sebelum
publikasi.** Teks terjemahan harus punya rujukan yang jelas dan sah. `validate.mjs`
dan `stats.mjs` akan mengingatkan bila sumber masih kosong.
