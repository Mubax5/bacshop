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
- QRIS dinamis DOKU dibuat khusus untuk setiap pesanan melalui SNAP API. Hanya gambar QRIS yang tampil di halaman pembayaran; status lunas diverifikasi kembali lewat API status DOKU. Callback bertanda tangan membantu memperbarui status, tetapi tidak menggantikan pemeriksaan server. Konfirmasi manual dan QR statis tidak dipakai.

### Chat pelanggan–admin

- Pelanggan membuka `/#/chat` dari ikon chat, tombol **Tanya produk**, atau **Chat tentang pesanan**. Admin membalas dari `/#/admin/chat`; daftar percakapan menampilkan pesan terakhir dan jumlah pesan belum dibaca.
- Produk katalog dan produk dalam pesanan sendiri bisa dilampirkan. Nama, harga, spesifikasi, dan pemilik pesanan diperiksa oleh server; lampiran tidak mempercayai nominal dari browser.
- Gambar PNG/JPG/WebP dapat dikirim melalui pemilih file, paste clipboard, dan drag-and-drop. Maksimal 3 gambar per pesan, 5 MB per gambar, dan 10 MB total. Enter mengirim, Shift+Enter membuat baris baru.
- Percakapan tersimpan di `BACSHOP_DATA_DIR/chat/` (default `.bacshop-private/chat/`), termasuk gambar privat di subfolder `images/`. Hanya pemilik percakapan dan admin yang bisa mengaksesnya. Backup folder data ini bersama data akun/pesanan; jangan masukkan gambar chat ke aset publik atau Git.
- Pesan memakai waktu UTC dari server dan urutan pesan tersendiri. Jam dan pemisah hari/tanggal mengikuti zona waktu perangkat yang membukanya. Pemisah tanggal hanya berasal dari pesan yang berhasil tersimpan, bukan draft.
- Pesan baru dan tanda dibaca diperbarui realtime melalui koneksi EventSource terautentikasi, dengan pemeriksaan cadangan saat koneksi terputus. Status pesan menunjukkan **Terkirim** dan **Dibaca**; bila pengiriman gagal, draft tetap tersedia dengan tombol **Kirim ulang**. Bunyi notifikasi pesan masuk aktif secara bawaan dan dapat dimatikan dari header chat. Batas pengiriman 30 pesan/menit per sisi percakapan.

### Kredensial pembayaran

Checkout baru memakai DOKU. Salin `.env.example` menjadi `.env`, isi environment server, lalu mulai ulang aplikasi. File `.env` diabaikan Git; jangan bagikan atau commit file itu.

- `DOKU_CLIENT_ID` dan `DOKU_CLIENT_SECRET` — API credentials merchant dari DOKU.
- `DOKU_PRIVATE_KEY_BASE64` atau `DOKU_PRIVATE_KEY` — private key RSA yang pasangannya terdaftar di DOKU. Base64 lebih praktis untuk App Service; jangan masukkan private key ke Git atau chat.
- `DOKU_MERCHANT_ID`, `DOKU_TERMINAL_ID`, dan `DOKU_POSTAL_CODE` — identitas QRIS dan kode pos merchant yang disetujui DOKU.
- `DOKU_IS_PRODUCTION` — `false` untuk Sandbox dan `true` untuk Production.

Gunakan API credentials Sandbox di pengembangan. Production hanya bisa aktif dengan `NODE_ENV=production`, origin HTTPS, lokasi data persisten, dan semua konfigurasi DOKU Production yang valid. Bila konfigurasi DOKU belum lengkap, situs tetap dapat berjalan tetapi checkout tidak membuat pesanan sampai pembayaran disiapkan. Bila `DOKU_IS_PRODUCTION=true` namun kunci atau identitas tidak valid, startup Production akan berhenti agar tidak menerima pembayaran dalam konfigurasi yang keliru.

Contoh Sandbox:

```dotenv
DOKU_CLIENT_ID=<client-id-sandbox>
DOKU_CLIENT_SECRET=<client-secret-sandbox>
DOKU_PRIVATE_KEY_BASE64=<private-key-rsa-sandbox-dalam-base64>
DOKU_MERCHANT_ID=<merchant-id-sandbox>
DOKU_TERMINAL_ID=<terminal-id-sandbox>
DOKU_POSTAL_CODE=<kode-pos-5-digit>
DOKU_IS_PRODUCTION=false
```

Contoh Production memakai nama environment yang sama dengan nilai Production, `DOKU_IS_PRODUCTION=true`, dan origin publik HTTPS. Daftarkan URL notifikasi `https://<domain>/api/payments/doku/notify` di pengaturan QRIS DOKU. Callback diverifikasi dengan signature, lalu server meminta status transaksi langsung ke DOKU sebelum menandai pesanan lunas. Tombol periksa pembayaran juga menggunakan API status DOKU. Untuk menguji Sandbox, gunakan [QRIS Payment Simulator DOKU](https://sandbox.doku.com/qris-simulator/).

Credential `MIDTRANS_SERVER_KEY`, `MIDTRANS_MERCHANT_ID`, dan `MIDTRANS_IS_PRODUCTION` hanya diperlukan sementara untuk pemeriksaan atau refund pesanan historis Midtrans. Pesanan baru Bacshop tidak lagi dikirim ke Midtrans.

## Menjalankan di production

Production harus memakai satu proses Node.js pada satu server dengan penyimpanan disk yang persisten. Data akun, pesanan, audit, produk, dan unggahan disimpan sebagai file; jangan menjalankan beberapa replika Bacshop yang menulis folder data yang sama. Pasang TLS pada reverse proxy publik dan teruskan trafik ke Node di `127.0.0.1:4173`. Origin browser yang dikonfigurasi harus sama persis dengan domain publik HTTPS.

### Deploy ke satu VPS Linux dengan Docker

Repo menyediakan `Dockerfile` dan Compose untuk menjalankan satu kontainer Bacshop di belakang Caddy. Caddy mengurus TLS otomatis; data Bacshop, sertifikat TLS, dan konfigurasi Caddy memakai volume persisten. DNS domain harus mengarah ke VPS, port TCP 80/443 dan UDP 443 harus dibuka, dan subnet Docker `10.245.17.0/24` harus tidak bertabrakan dengan jaringan VPS.

Salin `deploy/production.env.example` menjadi `deploy/production.env` serta `deploy/caddy.env.example` menjadi `deploy/caddy.env`. Isi domain dan origin HTTPS yang sama, konfigurasi DOKU Production, dan kode setup admin acak minimal 32 karakter. `deploy/production.env` memuat rahasia dan diabaikan Git; `deploy/caddy.env` hanya memuat nama domain.

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
BACSHOP_PAYMENT_TEST_EMAIL=<email-akun-yang-boleh-menguji-pembayaran>
DOKU_CLIENT_ID=<client-id-production>
DOKU_CLIENT_SECRET=<client-secret-production>
DOKU_PRIVATE_KEY_BASE64=<private-key-rsa-production-dalam-base64>
DOKU_MERCHANT_ID=<merchant-id-production>
DOKU_TERMINAL_ID=<terminal-id-production>
DOKU_POSTAL_CODE=<kode-pos-5-digit>
DOKU_IS_PRODUCTION=true
```

Salin `data/products.json` ke `BACSHOP_PRODUCTS_FILE` saat menyiapkan server pertama kali. Pastikan folder data dan unggahan berada pada volume yang tetap ada saat aplikasi diperbarui, dibatasi ke akun proses Bacshop, dan masuk jadwal backup terenkripsi. Simpan kredensial di secret manager atau environment host; jangan masukkan nilainya ke Git, log deployment, tiket, atau chat. `BACSHOP_ADMIN_SETUP_CODE` dipakai satu kali saat membuat akun admin pertama dan tidak dicetak ke log production.

Jika memakai reverse proxy, set `BACSHOP_TRUSTED_PROXY_IPS` hanya ke alamat proxy yang benar-benar tersambung ke Node, dan pastikan proxy menghapus lalu menulis ulang `X-Forwarded-For`. Header tersebut hanya dipakai untuk pembatasan percobaan login; tanpa proxy yang dipercaya, aplikasi mengabaikannya.

Setelah konfigurasi benar, jalankan `npm start`. Startup production memvalidasi origin HTTPS dan penyimpanan persistent. Bila DOKU diaktifkan untuk Production, startup juga menolak konfigurasi DOKU yang belum lengkap atau private key yang tidak valid. Folder data pribadi dibatasi ke akun proses di sistem Unix. `GET /api/health` memberi status hidup dan `paymentConfigured`; nilai `true` menunjukkan konfigurasi server tersedia, bukan bukti QRIS sudah disetujui atau aktif pada akun DOKU. Daftarkan URL notifikasi Bacshop di dashboard DOKU, lalu pastikan callback diterima dan status server cocok sebelum menerima pesanan live.

Produk yang ditandai **Produk uji internal** disembunyikan dari pengunjung biasa dan ditolak lagi oleh server saat pemesanan. Atur `BACSHOP_PAYMENT_TEST_EMAIL` ke satu email akun uji yang sah sebelum membuat produk tersebut. Gunakan hanya untuk memverifikasi integrasi, lalu arsipkan atau hapus setelah pengujian selesai.

## Azure App Service

Deployment Bacshop menggunakan App Service Linux Basic B1, Node.js 24 LTS, satu instance, dan Always On. B1 memakai compute berbayar; kredit Azure for Students akan berkurang sesuai pemakaian. Pilih region yang diizinkan oleh policy subscription pemilik. Domain utama adalah `https://bacshop.id`, dengan DNS dikelola di IDwebhost dan sertifikat App Service Managed Certificate.

Aktifkan App Service Health Check dengan path `/api/health`. Endpoint harus merespons 200 pada hostname bawaan Azure tanpa redirect ke domain utama. Pemeriksaan ini memantau proses aplikasi; `paymentConfigured` hanya menandakan konfigurasi kunci tersedia dan tidak membuktikan kanal QRIS aktif. Satu instance tidak menyediakan pengalihan trafik saat instance gagal. Perubahan Health Check me-restart aplikasi dan mengakhiri sesi login yang tersimpan di memori.

Untuk deployment ZIP dari source, set `SCM_DO_BUILD_DURING_DEPLOYMENT=true` dan `ENABLE_ORYX_BUILD=true` sebelum deployment agar dependensi dari `package-lock.json` terpasang. Gunakan ZIP dari `git archive HEAD` untuk mengecualikan `.env`, data privat, dan unggahan. Pastikan `/api/health` dan katalog merespons setelah deployment; status build berhasil saja tidak menjamin proses aplikasi berhasil berjalan.

Alternatif jika build Azure tertahan: jalankan `npm ci --omit=dev`, buat ZIP dari `git archive HEAD`, lalu tambahkan hanya `node_modules/` ke ZIP tersebut. Set kedua flag build di atas ke `false` untuk paket yang sudah berisi dependensi produksi. Dependensi saat ini berupa JavaScript; jika menambahkan modul native, paket harus dibangun pada Linux yang sesuai dengan runtime Azure. Jangan mengubah app settings selama deployment masih membangun aplikasi.

Untuk domain apex, buat A record `@` menuju inbound IP App Service serta TXT `asuid` berisi custom domain verification ID. Pada IDwebhost, opsi `SPF (txt)` tersimpan sebagai TXT. Setelah DNS publik terverifikasi, tambahkan hostname `bacshop.id`, terbitkan managed certificate, dan pasang SNI SSL. Aktifkan HTTPS Only dan minimum TLS 1.2, lalu set `BACSHOP_PUBLIC_ORIGIN=https://bacshop.id` agar permintaan akun dan pesanan dari domain tersebut diterima. Daftarkan `https://bacshop.id/api/payments/doku/notify` sebagai URL notifikasi QRIS di dashboard DOKU.

Sebelum migrasi akun Azure, cadangkan seluruh `/home/bacshop-data/` melalui Kudu ZIP API dan pulihkan ke lokasi yang sama pada app tujuan sebelum menjalankan aplikasi. Cadangan berisi data privat; simpan di lokasi yang diabaikan Git dan jangan masukkan ke ZIP source. Verifikasi hasil pemulihan sebelum menghapus resource Bacshop lama.

### Free F1 untuk pilot sementara

Untuk pilot sementara tanpa biaya compute, aplikasi dapat dijalankan di Azure App Service Linux Free F1 menggunakan Node.js 24 LTS dan hostname HTTPS bawaan `*.azurewebsites.net`. Paket F1 memiliki batas CPU dan penyimpanan yang ketat serta tidak memiliki SLA; paket gratis/shared ditujukan untuk pengembangan dan pengujian, bukan toko live. Jangan menerima pesanan live sebelum hosting, backup, kapasitas, dan kanal pembayaran Production siap.

Saat membuat App Service, pilih Linux, Node 24 LTS, paket App Service F1 di region yang menyediakan F1, dan aktifkan HTTPS Only serta minimum TLS 1.2. Atur startup command menjadi `node deploy/azure-startup.js` dan aktifkan build deployment agar Azure memasang dependensi dari `package-lock.json`. Startup menyalin katalog awal ke `/home/bacshop-data/products.json` hanya pada inisialisasi pertama; perubahan katalog, akun, sesi, pesanan, audit, dan unggahan memakai `/home/bacshop-data/` yang persisten saat restart. Startup tidak menimpa katalog yang sudah ada. Atur app settings `NODE_ENV=production`, `HOST=0.0.0.0`, `BACSHOP_PUBLIC_ORIGIN=https://<nama-app>.azurewebsites.net`, `BACSHOP_DATA_DIR=/home/bacshop-data/private`, `BACSHOP_PRODUCTS_FILE=/home/bacshop-data/products.json`, `BACSHOP_UPLOADS_DIR=/home/bacshop-data/uploads`, `DOKU_IS_PRODUCTION=true`, `DOKU_CLIENT_ID`, `DOKU_CLIENT_SECRET`, `DOKU_PRIVATE_KEY_BASE64`, `DOKU_MERCHANT_ID`, `DOKU_TERMINAL_ID`, `DOKU_POSTAL_CODE`, dan `BACSHOP_ADMIN_SETUP_CODE` melalui Configuration di Azure; simpan rahasia sebagai app settings dan jangan masukkan ke ZIP atau Git. Port diambil dari `PORT` yang disediakan platform.

Setelah app hidup dan DOKU Production disetujui, daftarkan `https://bacshop.id/api/payments/doku/notify` sebagai URL notifikasi QRIS di dashboard DOKU. Periksa `/api/health`, lakukan backup sebelum pembaruan, dan pantau kuota F1; naikkan paket hanya setelah ada persetujuan biaya.

Sebelum menerima pembeli, verifikasi login admin, pendaftaran buyer, pesanan, QRIS, callback, refund, dan pemenuhan dengan akun serta simulator DOKU yang sesuai. QRIS dibuat setelah pesanan dikonfirmasi; status lunas hanya berubah setelah query DOKU cocok pada merchant, referensi, mata uang, nominal, dan status sukses.

Sebelum go-live, pastikan pendaftaran QRIS merchant DOKU disetujui, identitas merchant dan terminal Production benar, pasangan RSA terdaftar, URL notifikasi publik HTTPS sudah disimpan, dan transaksi uji berhasil dibuat, dibayar, diverifikasi, serta diterima callback-nya. Jika salah satu syarat ini belum siap, jangan aktifkan pembayaran Production.

Konten penjualan tidak mengarang ulasan, jumlah penjualan, atau pesanan. Informasi yang belum dikonfigurasi ditampilkan sebagai belum tersedia, bukan sebagai transaksi nyata.

## Login Google dan gambar auth

Halaman masuk dan daftar menyediakan login Google melalui authorization code flow dengan state yang terikat cookie, nonce, dan PKCE. Server memverifikasi signature, issuer, audience, masa berlaku ID token, nonce, dan email terverifikasi melalui `google-auth-library`. Token Google tidak disimpan atau dikirim ke frontend. Akun Google memakai sesi buyer biasa; akses reseller dan pesanan tetap mengikuti akun yang sama.

Di Google Auth Platform, buat OAuth client bertipe **Web application** untuk project Bacshop:

- Authorized JavaScript origin: `https://bacshop.id`.
- Authorized redirect URI: `https://bacshop.id/api/auth/google/callback`.
- Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` pada environment server Azure. Client Secret tidak boleh masuk Git atau CMS.
- Gunakan scope `openid email profile` saja. Periksa Audience dan publishing status; aplikasi yang masih Testing belum tersedia untuk seluruh pengguna. Isi branding, domain, dan tautan kebijakan privasi/ketentuan sesuai bisnis pemilik.
- Untuk pengembangan lokal, daftarkan origin `http://127.0.0.1:4173` dan redirect `http://127.0.0.1:4173/api/auth/google/callback` pada client pengembangan, lalu sesuaikan environment lokal. Jangan memakai callback produksi untuk server lokal.

`GET /api/auth/options` hanya mengembalikan ketersediaan login Google, tanpa kunci. Jika konfigurasi belum lengkap, tombol Google dinonaktifkan dan login email tetap tersedia. Google ID (`sub`) menjadi identitas stabil. Akun email yang sudah ada hanya disambungkan otomatis bila Google berwenang atas email itu (Gmail atau Google Workspace dengan email terverifikasi); email pihak ketiga yang sudah terdaftar tetap memerlukan login Bacshop. Foto Google disalin ke folder unggahan lokal jika format dan hostnya valid; foto yang sudah dipilih pengguna dipertahankan.

**Admin → Konten toko → Gambar auth** (`#/admin/toko/auth`) mengelola gambar panel kanan halaman masuk/daftar. Ukuran disarankan **1440 × 1800 px, rasio 4:5**, PNG/JPEG/WebP maksimal 5 MB. Gambar menyesuaikan panel dengan `object-fit: cover`, jadi letakkan isi penting di tengah. Panel gambar disembunyikan pada layar sampai 760 px. Tombol **Kembalikan placeholder** mengosongkan gambar setelah formulir disimpan. Data CMS dan file gambar memakai penyimpanan persistent yang sama dengan konten toko lainnya.

Logo Google resmi berasal dari [aset branding Google](https://developers.google.com/identity/branding-guidelines), dengan font Google Sans lokal berlisensi SIL OFL pada `assets/GOOGLE-SANS-OFL.txt`. Logo Bacshop tetap di pojok kanan atas pada halaman auth.

## Referensi dan aset

Tokopedia hanya menjadi referensi visual dan struktural. Tidak ada skrip atau layanan Tokopedia yang dimuat aplikasi. Aset font Plus Jakarta Sans dan Feather disimpan lokal beserta lisensinya.
