# Bacshop storefront

Storefront yang dibuat dari awal di workspace Tokopedia yang diunduh. HTML Tokopedia yang disediakan menjadi satu-satunya referensi tampilan; aplikasi ini tidak memakai kode produksi Tokopedia atau proyek Bacshop yang terpisah.

## Menjalankan aplikasi

Gunakan Node.js 18 atau lebih baru. Jalankan `npm install`, lalu `node server.js` dari folder ini. Server lokal mendengarkan di `127.0.0.1` dan mencetak alamat preview. Saat pertama dijalankan, server menampilkan kode setup admin sekali pakai. Buka `/#/admin`, masukkan kode tersebut, lalu buat email dan kata sandi admin. Kode kedaluwarsa saat server berhenti.

Data akun, sesi, pesanan, konten toko, dan audit admin disimpan di `.bacshop-private/`, yang tidak dilayani sebagai aset publik. Produk tersimpan di `data/products.json`; gambar unggahan disimpan di `assets/uploads/` dan divalidasi sebagai gambar sebelum diterima.

## Fitur

- Beranda, katalog, detail produk, pencarian, kategori, filter, promo, keranjang, checkout, FAQ, dan navigasi mobile.
- Login, pendaftaran, profil dan foto profil, pesanan, serta halaman pembayaran.
- Harga reseller produk terbuka setelah pesanan bulk produk yang sama dibayar melalui DANA dan tidak direfund. Paket reseller sekali bayar mulai Rp149.000 membuka harga reseller untuk seluruh katalog.
- Area admin terpisah untuk mengelola produk, kategori, banner placeholder, promo, syarat reseller, dan pemenuhan pesanan.
- QRIS dibuat dari DANA untuk setiap transaksi dan nominal. QR yang dibuat dari API ditampilkan sebagai gambar DANA atau dirender dari `qrContent`; pembayaran hanya terkonfirmasi lewat callback bertanda tangan atau pemeriksaan status API DANA. Konfirmasi manual dan QR statis tidak dipakai.

### Kredensial DANA

Checkout tetap tertutup sampai server memiliki kredensial DANA. Atur environment berikut di host server, jangan di frontend atau repo:

- `DANA_API_BASE_URL` — alamat API sandbox atau produksi DANA.
- `DANA_MERCHANT_ID`, `DANA_CLIENT_ID`, `DANA_STORE_ID`, `DANA_CHANNEL_ID`, dan `DANA_ORIGIN`.
- `DANA_PRIVATE_KEY_FILE` — path ke private key merchant format PEM. Alternatifnya, isi `DANA_PRIVATE_KEY` dengan private key PEM.
- `DANA_PUBLIC_KEY` — public key DANA untuk memverifikasi callback pembayaran.

Daftarkan URL notifikasi HTTPS publik `https://<domain>/api/payments/dana/notify` di konfigurasi integrasi DANA. Callback perlu menjangkau server dari jaringan DANA; localhost hanya cukup untuk uji integrasi lokal. Tanpa kredensial yang sesuai lingkungan, pembuatan QRIS akan gagal tertutup dan tidak membuat pesanan.

Konten penjualan tidak mengarang ulasan, jumlah penjualan, atau pesanan. Informasi yang belum dikonfigurasi ditampilkan sebagai belum tersedia, bukan sebagai transaksi nyata.

## Referensi dan aset

Tokopedia hanya menjadi referensi visual dan struktural. Tidak ada skrip atau layanan Tokopedia yang dimuat aplikasi. Aset font Plus Jakarta Sans dan Feather disimpan lokal beserta lisensinya.
