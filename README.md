# Bacshop storefront

Storefront yang dibuat dari awal di workspace Tokopedia yang diunduh. HTML Tokopedia yang disediakan menjadi satu-satunya referensi tampilan; aplikasi ini tidak memakai kode produksi Tokopedia atau proyek Bacshop yang terpisah.

## Menjalankan aplikasi

Gunakan Node.js 18 atau lebih baru. Jalankan `npm install`, lalu `node server.js` dari folder ini. Server lokal mendengarkan di `127.0.0.1` dan mencetak alamat preview. Saat pertama dijalankan, server menampilkan kode setup admin sekali pakai. Buka `/#/admin`, masukkan kode tersebut, lalu buat email dan kata sandi admin. Kode kedaluwarsa saat server berhenti.

Data akun, sesi, pesanan, konten toko, dan audit admin disimpan di `.bacshop-private/`, yang tidak dilayani sebagai aset publik. Produk tersimpan di `data/products.json`; gambar unggahan disimpan di `assets/uploads/` dan divalidasi sebagai gambar sebelum diterima.

## Fitur

- Beranda, katalog, detail produk, pencarian, kategori, filter, promo, keranjang, checkout, FAQ, dan navigasi mobile.
- Login, pendaftaran, profil dan foto profil, pesanan, serta halaman pembayaran.
- Harga reseller produk terbuka setelah pesanan bulk produk yang sama dibayar dan tidak direfund. Paket reseller sekali bayar mulai Rp149.000 membuka harga reseller untuk seluruh katalog.
- Area admin terpisah untuk mengelola produk, kategori, banner placeholder, promo, syarat reseller, dan pemenuhan pesanan.
- QRIS dinamis dibuat untuk setiap transaksi melalui Core API. Hanya gambar QRIS yang tampil di halaman pembayaran; integrasi tidak memakai halaman checkout atau widget pihak pemroses. Status pembayaran diperiksa melalui callback bertanda tangan atau pemeriksaan status server. Konfirmasi manual dan QR statis tidak dipakai.

### Kredensial pembayaran

Checkout tetap tertutup sampai server memiliki Server Key. Salin `.env.example` menjadi `.env`, lalu isi file `.env` di folder aplikasi. Server membaca file itu saat mulai; environment yang sudah diatur pada host tetap memiliki prioritas. File `.env` diabaikan Git dan jangan dibagikan atau di-commit.

- `MIDTRANS_SERVER_KEY` — Server Key yang aktif untuk sandbox atau production.
- `MIDTRANS_MERCHANT_ID` — opsional, untuk mencocokkan identitas merchant pada respons pembayaran.
- `MIDTRANS_IS_PRODUCTION` — set `true` untuk production; tanpa ini server memakai sandbox.

Untuk sandbox, isi `.env` seperti ini lalu mulai ulang server:

```dotenv
MIDTRANS_SERVER_KEY=<server-key-sandbox>
MIDTRANS_MERCHANT_ID=<merchant-id>
MIDTRANS_IS_PRODUCTION=false
```

Untuk production, gunakan Server Key production dan ubah `MIDTRANS_IS_PRODUCTION=true`:

```dotenv
MIDTRANS_SERVER_KEY=<server-key-production>
MIDTRANS_MERCHANT_ID=<merchant-id>
MIDTRANS_IS_PRODUCTION=true
```

Kemudian jalankan:

```powershell
node server.js
```

Daftarkan callback HTTPS publik `https://<domain>/api/payments/notify` pada dashboard akun pembayaran agar status pesanan diperbarui otomatis. Callback lokal `127.0.0.1` tidak dapat dijangkau dari internet; tombol periksa pembayaran tetap menggunakan status API server. Untuk production, gunakan Server Key production dan set `MIDTRANS_IS_PRODUCTION=true`. Client Key tidak diperlukan karena pembayaran memakai Core API dari server dan tidak memuat Snap.js.

Konten penjualan tidak mengarang ulasan, jumlah penjualan, atau pesanan. Informasi yang belum dikonfigurasi ditampilkan sebagai belum tersedia, bukan sebagai transaksi nyata.

## Referensi dan aset

Tokopedia hanya menjadi referensi visual dan struktural. Tidak ada skrip atau layanan Tokopedia yang dimuat aplikasi. Aset font Plus Jakarta Sans dan Feather disimpan lokal beserta lisensinya.
