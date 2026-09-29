# Bacshop storefront

Storefront yang dibuat dari awal di workspace Tokopedia yang diunduh. HTML Tokopedia yang disediakan menjadi satu-satunya referensi tampilan; aplikasi ini tidak memakai kode produksi Tokopedia atau proyek Bacshop yang terpisah.

## Menjalankan aplikasi

Gunakan Node.js lalu jalankan `node server.js` dari folder ini. Server hanya mendengarkan di `127.0.0.1` dan mencetak alamat preview. Saat pertama dijalankan, server menampilkan kode setup admin sekali pakai. Buka `/#/admin`, masukkan kode tersebut, lalu buat email dan kata sandi admin. Kode kedaluwarsa saat server berhenti.

Data akun, sesi, pesanan, konten toko, dan audit admin disimpan di `.bacshop-private/`, yang tidak dilayani sebagai aset publik. Produk tersimpan di `data/products.json`; gambar unggahan disimpan di `assets/uploads/` dan divalidasi sebagai gambar sebelum diterima.

## Fitur

- Beranda, katalog, detail produk, pencarian, kategori, filter, promo, keranjang, checkout, FAQ, dan navigasi mobile.
- Login, pendaftaran, profil dan foto profil, pesanan, serta halaman pembayaran.
- Harga reseller produk terbuka setelah pesanan bulk produk yang sama dibayar, diverifikasi admin, dan tidak direfund. Paket reseller sekali bayar mulai Rp149.000 membuka harga reseller untuk seluruh katalog.
- Area admin terpisah untuk mengelola produk, kategori, banner, promo, syarat reseller, QRIS, dan pesanan.
- QRIS statis meminta pembeli memasukkan nominal. Admin mencocokkan transaksi secara manual sebelum menandai pembayaran lunas; unggahan bukti tidak mengonfirmasi pembayaran.

Konten penjualan tidak mengarang ulasan, jumlah penjualan, atau pesanan. Informasi yang belum dikonfigurasi ditampilkan sebagai belum tersedia, bukan sebagai transaksi nyata.

## Referensi dan aset

Tokopedia hanya menjadi referensi visual dan struktural. Tidak ada skrip atau layanan Tokopedia yang dimuat aplikasi. Aset font Plus Jakarta Sans dan Feather disimpan lokal beserta lisensinya.
