# Roadmap aplikasi Gītā Bali

Target akhir: satu basis produk untuk web, iOS, dan Android tanpa mengorbankan data akun atau pengalaman offline.

## Fondasi saat ini

- Tampilan responsif dan navigasi layar penuh untuk pembaca sloka.
- Autentikasi email/password melalui Supabase.
- Sloka tersimpan, catatan, dan agenda dipisahkan berdasarkan pengguna.
- Agenda tetap memiliki cache lokal ketika perangkat offline.

## Tahap sebelum pembungkusan aplikasi

1. Pisahkan frontend monolitik menjadi modul data, tampilan, autentikasi, kalender, dan agenda.
2. Tambahkan web app manifest, ikon aplikasi, service worker, cache offline, dan halaman status koneksi.
3. Tambahkan ekspor/hapus akun dan halaman kebijakan privasi.
4. Tambahkan pengingat lokal untuk agenda dan rahinan; minta izin notifikasi hanya setelah pengguna mengaktifkannya.
5. Uji aksesibilitas, ukuran teks, safe area, keyboard, gesture kembali, serta koneksi lambat.

## iOS dan Android

- Gunakan Capacitor setelah web app stabil agar kode utama dapat dipakai bersama.
- Gunakan penyimpanan aman native untuk sesi autentikasi.
- Gunakan local notifications untuk agenda; push notifications hanya jika ada kebutuhan server.
- Siapkan ikon, splash screen, screenshot toko, deskripsi, kategori, rating usia, support URL, privacy URL, dan account-deletion flow.
- Uji melalui TestFlight dan Google Play internal testing sebelum produksi.

## Syarat rilis

- Tidak ada konten sakral atau keputusan wariga yang diklaim mutlak tanpa sumber dan penelaah.
- Seluruh data pribadi dilindungi Row Level Security dan dapat diekspor atau dihapus pengguna.
- Terjemahan yang belum ditelaah tetap ditandai sebagai draf.
- Fitur inti tetap berguna saat koneksi terputus.
