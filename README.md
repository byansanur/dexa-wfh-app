# Dexa WFH App

Aplikasi ini merupakan sistem manajemen kehadiran (Work From Home) yang dikembangkan untuk memfasilitasi pencatatan absensi karyawan secara seketika (real-time) dan pengelolaan data operasional oleh pengelola (admin). Proyek ini dibangun menggunakan arsitektur monorepo dengan pemisahan yang jelas antara sisi antarmuka pengguna (frontend) dan logika server (backend).

## Teknologi yang Digunakan

Aplikasi ini memanfaatkan serangkaian teknologi modern untuk memastikan skalabilitas dan keandalan sistem:

- **Frontend:** Dibangun menggunakan **React** dan **Vite**, serta React Router untuk navigasi antarmuka yang dinamis. Tampilan antarmuka (UI) dikembangkan secara penuh menggunakan pedoman **Design System [ZenGrid](https://designmd.ai/chef/zengrid)**.
- **Backend:** Menggunakan **NestJS** sebagai kerangka kerja utama pembuatan REST API.
- **Database Relasional:** **PostgreSQL** yang dioperasikan melalui **Prisma ORM** untuk menyimpan entitas data utama seperti pengguna dan catatan absensi.
- **Database NoSQL:** **MongoDB** untuk menyimpan rekam jejak (audit log) secara fleksibel dalam format dokumen JSON.
- **Message Broker:** **RabbitMQ** untuk menangani komunikasi antar layanan, khususnya dalam mengirimkan data log secara asinkron (Event-Driven) tanpa membebani proses utama.
- **Penyimpanan Objek & Optimasi:** **MinIO** (kompatibel dengan Amazon S3) untuk mengelola arsip log. Unggahan foto profil secara otomatis dikonversi ke format **WebP** menggunakan pustaka **Sharp** demi menghemat ruang penyimpanan.
- **WebSockets:** **Socket.io** digunakan untuk mendistribusikan notifikasi langsung kepada admin setiap kali terjadi perubahan data penting.
- **Penjadwalan (Cron):** `@nestjs/schedule` untuk proses pengarsipan log MongoDB ke MinIO secara otomatis setiap hari.
- **Geolocation API:** Terintegrasi pada frontend untuk mencatat lokasi akurat (*latitude/longitude*) karyawan saat absen.

## Fitur Utama

- **Autentikasi Pengguna:** Sistem login aman menggunakan JWT yang membedakan hak akses antara Karyawan dan Admin. Dilengkapi penanganan *Auto-Logout* jika token kadaluarsa (Pencegatan 401 Unauthorized).
- **Manajemen Karyawan:** Admin memiliki keleluasaan untuk menambahkan karyawan baru secara satuan atau massal via CSV. Mendukung jam kerja fleksibel dengan pengaturan *Single-Shift/Multi-Shift* dan jadwal masuk khusus (`officeHourStart`).
- **Pemantauan Langsung & Algoritma Adil:** Dasbor admin menampilkan status kehadiran *real-time* (WebSocket). Terdapat fitur **Peringkat 3 Terbaik (Top 3 Punctual)** yang menghitung tingkat kedisiplinan secara adil berdasarkan selisih waktu hadir dengan jam kerja masing-masing karyawan, bukan berdasarkan waktu absolut.
- **Pelacakan Lokasi (Geolocation):** Mencegah kecurangan dengan mewajibkan karyawan mengaktifkan akses lokasi (*GPS*) saat melakukan *Clock In/Out*. Lokasi ini dipetakan dan dapat dipantau langsung oleh Admin melalui tautan *Google Maps*.
- **Laporan Kehadiran:** Tersedia fitur laporan agregat di mana admin dapat menyaring data absensi berdasarkan rentang tanggal tertentu atau mencari karyawan secara global, diurutkan secara kronologis (terbaru di atas).
- **Rekam Jejak & Pengarsipan (Log Archival):** Sistem mencatat setiap perubahan profil dan absensi, disalurkan via RabbitMQ ke MongoDB, lalu diekspor secara *batch* ke MinIO secara otomatis.

## Panduan Instalasi dan Penggunaan

Pastikan komputer Anda sudah terpasang Node.js, pnpm, dan Docker.

1. **Persiapan Infrastruktur Lokal**
   Aplikasi membutuhkan beberapa layanan infrastruktur data. Anda dapat menjalankannya sekaligus menggunakan konfigurasi Docker Compose yang telah disediakan.
   ```bash
   docker-compose up -d
   ```

2. **Instalasi Dependensi**
   Karena proyek ini menggunakan ruang kerja pnpm (*pnpm workspace*), Anda cukup menjalankan satu perintah di direktori paling luar (root) untuk menginstal seluruh kebutuhan proyek.
   ```bash
   pnpm install
   ```

3. **Konfigurasi dan Database**
   Pastikan Anda menyalin pengaturan dari file `.env.example` menjadi `.env` pada direktori `/apps/backend` dan `/apps/frontend`. Setelah itu, bangun struktur *Client* dan sinkronkan database relasional menggunakan Prisma.
   ```bash
   cd apps/backend
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Menjalankan Aplikasi**
   Aplikasi ini telah dikonfigurasi dengan **Vite Proxy** di frontend. Hal ini menjamin bahwa seluruh API internal dan koneksi WebSockets tersalurkan (*proxied*) secara rapi melalui frontend, menghilangkan potensi CORS dan menyederhanakan konfigurasi port.
   
   Buka dua jendela terminal.
   **Terminal 1 (Backend):**
   ```bash
   cd apps/backend
   pnpm run start:dev
   ```
   
   **Terminal 2 (Frontend):**
   ```bash
   cd apps/frontend
   pnpm run dev
   ```

5. **Akses dari Luar (Ngrok)**
   Karena konsep Vite Proxy, Anda hanya perlu mengekspos 1 port (port frontend, bawaannya `5173`) menggunakan *ngrok* untuk mendemonstrasikan keseluruhan ekosistem secara utuh di internet publik:
   ```bash
   ngrok http 5173
   ```

## Struktur Proyek

- `/apps/backend`: Direktori tempat seluruh logika NestJS, integrasi database, penjadwalan *Cron*, dan layanan pesan berada.
- `/apps/frontend`: Direktori aplikasi React.js dan UI Vite (Design: ZenGrid).
- `/docker-compose.yml`: Konfigurasi infrastruktur (PostgreSQL, MongoDB, RabbitMQ, MinIO).
