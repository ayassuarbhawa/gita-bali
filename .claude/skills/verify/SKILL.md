---
name: verify
summary: Verifikasi frontend statis lewat Chrome headless
---

# Verifikasi frontend

1. Jalankan dari root: `python3 -m http.server <port> --bind 127.0.0.1`.
2. Buka `http://127.0.0.1:<port>/preview/` memakai Chrome headless dengan profil `mktemp -d`, `--dump-dom`, dan `--screenshot`.
3. Periksa screenshot desktop dan mobile; periksa DOM hasil render untuk empty state, toolbar, dan pesan error.
4. Untuk jalur error, layani hanya direktori `preview/` pada port lain agar `../data/bab-02.json` mengembalikan HTTP 404.
5. Hentikan kedua server setelah selesai.

Chrome macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Chrome headless kadang tidak keluar sendiri; jalankan lewat Python `subprocess`, beri timeout 20 detik, lalu hentikan process group. Screenshot dan DOM sudah tersimpan sebelum proses dihentikan.
