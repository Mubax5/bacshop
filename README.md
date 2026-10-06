# Bacshop storefront

Ini adalah repo kanonis Bacshop dengan storefront Node.js yang memakai `server.js`, `index.html`, `app.js`, dan `styles.css`. Tokopedia hanya menjadi referensi tampilan; aplikasi ini tidak memuat kode atau aset produksi Tokopedia.

## Menjalankan aplikasi

Gunakan Node.js 22 atau 24 LTS. Jalankan `npm install`, lalu `npm start` dari folder ini. Server lokal mendengarkan di `127.0.0.1:4173` secara default; port dapat diganti melalui `PORT`. Saat pertama dijalankan, server menampilkan kode setup admin sekali pakai. Buka `/#/admin`, masukkan kode tersebut, lalu buat email dan kata sandi admin. Kode kedaluwarsa saat server berhenti.

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

Kunci dan mode Production hanya dapat dipakai saat `NODE_ENV=production` dengan origin HTTPS dan lokasi penyimpanan production yang terkonfigurasi. Jangan taruh Server Key Production di `.env` development; pakai kredensial Sandbox untuk preview lokal.

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

## Menjalankan di production

Production harus memakai satu proses Node.js pada satu server dengan penyimpanan disk yang persisten. Data akun, pesanan, audit, produk, dan unggahan disimpan sebagai file; jangan menjalankan beberapa replika Bacshop yang menulis folder data yang sama. Pasang TLS pada reverse proxy publik dan teruskan trafik ke Node di `127.0.0.1:4173`. Origin browser yang dikonfigurasi harus sama persis dengan domain publik HTTPS.

### Deploy ke satu VPS Linux dengan Docker

Repo menyediakan `Dockerfile` dan Compose untuk menjalankan satu kontainer Bacshop di belakang Caddy. Caddy mengurus TLS otomatis; data Bacshop, sertifikat TLS, dan konfigurasi Caddy memakai volume persisten. DNS domain harus mengarah ke VPS, port TCP 80/443 dan UDP 443 harus dibuka, dan subnet Docker `10.245.17.0/24` harus tidak bertabrakan dengan jaringan VPS.

Salin `deploy/production.env.example` menjadi `deploy/production.env` serta `deploy/caddy.env.example` menjadi `deploy/caddy.env`. Isi domain dan origin HTTPS yang sama, Server Key Production, Merchant ID, dan kode setup admin acak minimal 32 karakter. `deploy/production.env` memuat rahasia dan diabaikan Git; `deploy/caddy.env` hanya memuat nama domain.

```sh
cp deploy/production.env.example deploy/production.env
cp deploy/caddy.env.example deploy/caddy.env
chmod 600 deploy/production.env
docker compose --env-file deploy/production.env config --quiet
docker compose --env-file deploy/production.env up -d --build
```

Jika subnet `10.245.17.0/24` sudah dipakai, ganti `BACSHOP_DOCKER_SUBNET`, `BACSHOP_CADDY_IP`, dan `BACSHOP_TRUSTED_PROXY_IPS` di `deploy/production.env` dengan subnet kosong lain yang konsisten. Jangan publikasikan port Node `4173`; hanya Caddy yang menerima trafik internet. Jangan menghapus volume `bacshop_data` saat memperbarui aplikasi. Backup ketiga volume Compose secara terenkripsi dan berkala.

Atur environment production berikut sebelum mulai:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=4173
BACSHOP_PUBLIC_ORIGIN=https://shop.domain-anda.id
BACSHOP_DATA_DIR=/var/lib/bacshop/private
BACSHOP_PRODUCTS_FILE=/var/lib/bacshop/products.json
BACSHOP_UPLOADS_DIR=/var/lib/bacshop/uploads
BACSHOP_ADMIN_SETUP_CODE=<kode-acak-minimal-32-karakter>
MIDTRANS_SERVER_KEY=<server-key-production>
MIDTRANS_MERCHANT_ID=<merchant-id-production>
MIDTRANS_IS_PRODUCTION=true
```

Salin `data/products.json` ke `BACSHOP_PRODUCTS_FILE` saat menyiapkan server pertama kali. Pastikan folder data dan unggahan berada pada volume yang tetap ada saat aplikasi diperbarui, dibatasi ke akun proses Bacshop, dan masuk jadwal backup terenkripsi. Simpan kredensial di secret manager atau environment host; jangan masukkan nilainya ke Git, log deployment, tiket, atau chat. `BACSHOP_ADMIN_SETUP_CODE` dipakai satu kali saat membuat akun admin pertama dan tidak dicetak ke log production.

Jika memakai reverse proxy, set `BACSHOP_TRUSTED_PROXY_IPS` hanya ke alamat proxy yang benar-benar tersambung ke Node, dan pastikan proxy menghapus lalu menulis ulang `X-Forwarded-For`. Header tersebut hanya dipakai untuk pembatasan percobaan login; tanpa proxy yang dipercaya, aplikasi mengabaikannya.

Setelah konfigurasi benar, jalankan `npm start`. Startup production gagal dengan pesan yang tidak memuat rahasia jika origin HTTPS, folder persistent yang bisa ditulis, atau kunci Midtrans Production belum disiapkan. Folder data pribadi dibatasi ke akun proses di sistem Unix. `GET /api/health` memberi status hidup dan apakah kunci pembayaran terkonfigurasi; status itu tidak membuktikan QRIS aktif di akun Midtrans. Daftarkan `https://shop.domain-anda.id/api/payments/notify` sebagai HTTP notification URL Production pada dashboard Midtrans.

## Azure App Service gratis (pilot sementara)

Untuk pilot sementara tanpa biaya compute, aplikasi dapat dijalankan di Azure App Service Linux Free F1 menggunakan Node.js 24 LTS dan hostname HTTPS bawaan `*.azurewebsites.net`. Paket F1 memiliki batas CPU dan penyimpanan yang ketat serta tidak memiliki SLA; paket gratis/shared ditujukan untuk pengembangan dan pengujian, bukan toko live. Jangan menerima pesanan live sebelum hosting, backup, kapasitas, dan kanal pembayaran Production siap.

Saat membuat App Service, pilih Linux, Node 24 LTS, paket App Service F1 di region yang menyediakan F1, dan aktifkan HTTPS Only serta minimum TLS 1.2. Atur startup command menjadi `node deploy/azure-startup.js` dan aktifkan build deployment agar Azure memasang dependensi dari `package-lock.json`. Startup menyalin katalog awal ke `/home/bacshop-data/products.json` hanya pada inisialisasi pertama; perubahan katalog, akun, sesi, pesanan, audit, dan unggahan memakai `/home/bacshop-data/` yang persisten saat restart. Startup tidak menimpa katalog yang sudah ada. Atur app settings `NODE_ENV=production`, `HOST=0.0.0.0`, `BACSHOP_PUBLIC_ORIGIN=https://<nama-app>.azurewebsites.net`, `BACSHOP_DATA_DIR=/home/bacshop-data/private`, `BACSHOP_PRODUCTS_FILE=/home/bacshop-data/products.json`, `BACSHOP_UPLOADS_DIR=/home/bacshop-data/uploads`, `MIDTRANS_IS_PRODUCTION=true`, `MIDTRANS_SERVER_KEY`, dan `BACSHOP_ADMIN_SETUP_CODE` melalui Configuration di Azure; simpan rahasia sebagai app settings dan jangan masukkan ke ZIP atau Git. Port diambil dari `PORT` yang disediakan platform.

Setelah app hidup, daftarkan `https://<nama-app>.azurewebsites.net/api/payments/notify` sebagai HTTP notification URL Production Midtrans. Endpoint publik dan hostname HTTPS tidak mengaktifkan Core API Production atau QRIS pada akun Midtrans. Periksa `/api/health`, lakukan backup sebelum pembaruan, dan pantau kuota F1; naikkan paket hanya setelah ada persetujuan biaya.

Sebelum menerima pembeli, jalankan `npm test`, lalu cek login admin, pendaftaran buyer, pesanan, QRIS, callback, dan pemenuhan. QRIS dibuat setelah pesanan dikonfirmasi; status lunas hanya berubah setelah respons status/callback Midtrans cocok pada ID merchant, mata uang, nominal, metode QRIS, dan fraud status.

Core API Production dan QRIS dinamis harus aktif pada akun merchant Production. Sandbox aktif secara default, tetapi [Core API Production perlu diminta aktivasinya](https://docs.midtrans.com/docs/custom-interface-core-api), dan status kanal QRIS dikelola pada [dashboard Production Midtrans](https://docs.midtrans.com/docs/payment-methods). Sebelum go-live, ikuti [panduan Production Midtrans](https://docs.midtrans.com/docs/how-do-i-migrate-my-account-from-sandbox-to-production): kirim dan bayar transaksi nyata minimal Rp10.000, lalu pastikan callback pembayaran berhasil diterima. Jika provider mengembalikan `402 Payment channel is not activated`, jangan membuka penjualan live sebelum aktivasi dan transaksi uji berhasil.

Konten penjualan tidak mengarang ulasan, jumlah penjualan, atau pesanan. Informasi yang belum dikonfigurasi ditampilkan sebagai belum tersedia, bukan sebagai transaksi nyata.

## Referensi dan aset

Tokopedia hanya menjadi referensi visual dan struktural. Tidak ada skrip atau layanan Tokopedia yang dimuat aplikasi. Aset font Plus Jakarta Sans dan Feather disimpan lokal beserta lisensinya.
