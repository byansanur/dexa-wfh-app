# Dexa WFH App

Aplikasi ini merupakan sistem manajemen kehadiran (Work From Home) yang dikembangkan untuk memfasilitasi pencatatan absensi karyawan secara seketika (real-time) dan pengelolaan data operasional oleh pengelola (admin). Proyek ini dibangun menggunakan arsitektur monorepo dengan pemisahan yang jelas antara sisi antarmuka pengguna (frontend) dan logika server (backend).

## Teknologi yang Digunakan

Aplikasi ini memanfaatkan serangkaian teknologi modern untuk memastikan skalabilitas dan keandalan sistem:

- Frontend: Dibangun menggunakan React dan Vite, serta React Router untuk navigasi antarmuka yang dinamis.
- Backend: Menggunakan NestJS sebagai kerangka kerja utama pembuatan REST API.
- Database Relasional: PostgreSQL yang dioperasikan melalui Prisma ORM untuk menyimpan entitas data utama seperti pengguna dan catatan absensi.
- Database NoSQL: MongoDB untuk menyimpan rekam jejak (audit log) secara fleksibel.
- Message Broker: RabbitMQ untuk menangani komunikasi antar layanan, khususnya dalam mengirimkan data log secara asinkron tanpa membebani proses utama.
- Penyimpanan Objek: MinIO (kompatibel dengan S3) untuk mengelola unggahan berkas seperti foto profil karyawan.
- WebSockets: Socket.io digunakan untuk mendistribusikan notifikasi langsung kepada admin setiap kali terjadi perubahan data penting.

## Fitur Utama

- Autentikasi Pengguna: Sistem login aman menggunakan JWT yang membedakan hak akses antara Karyawan dan Admin.
- Manajemen Karyawan: Admin memiliki keleluasaan untuk menambahkan karyawan baru secara satuan atau mengunggah banyak data sekaligus menggunakan format CSV.
- Pemantauan Langsung: Dasbor admin menampilkan status kehadiran karyawan hari ini secara langsung. Status akan otomatis berubah ketika karyawan melakukan absensi.
- Laporan Kehadiran: Tersedia fitur laporan agregat di mana admin dapat menyaring data absensi berdasarkan rentang tanggal tertentu atau mencari karyawan secara global.
- Rekam Jejak (Audit Logs): Sistem mencatat setiap perubahan pada profil karyawan dan riwayat absensi. Data log ini dikirim secara asinkron melalui RabbitMQ ke MongoDB, dan dapat dipantau oleh admin pada menu khusus.

## Panduan Instalasi dan Penggunaan

Pastikan komputer Anda sudah terpasang Node.js, pnpm, dan Docker.

1. Persiapan Infrastruktur Lokal
   Aplikasi membutuhkan beberapa layanan pihak ketiga. Anda dapat menjalankannya sekaligus menggunakan konfigurasi Docker Compose yang telah disediakan.
   
   docker-compose up -d

2. Instalasi Dependensi
   Karena proyek ini menggunakan ruang kerja pnpm (pnpm workspace), Anda cukup menjalankan satu perintah di direktori paling luar (root) untuk menginstal seluruh kebutuhan proyek.
   
   pnpm install

3. Konfigurasi dan Database
   Pastikan Anda menyalin pengaturan dari file .env.example menjadi .env pada direktori backend. Setelah itu, sinkronkan struktur database relasional menggunakan Prisma.
   
   cd apps/backend
   npx prisma migrate dev

4. Menjalankan Aplikasi
   Anda dapat menjalankan sisi frontend dan backend secara terpisah untuk tahap pengembangan.
   
   Jalankan backend:
   cd apps/backend
   pnpm run start:dev
   
   Jalankan frontend:
   cd apps/frontend
   pnpm run dev

## Struktur Proyek

- /apps/backend: Direktori tempat seluruh logika NestJS, integrasi database, dan layanan pesan berada.
- /apps/frontend: Direktori aplikasi React untuk antarmuka pengguna.
