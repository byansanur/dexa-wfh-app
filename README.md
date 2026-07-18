# Dexa WFH App

Aplikasi ini merupakan sistem manajemen kehadiran (Work From Home) yang dikembangkan untuk memfasilitasi pencatatan absensi karyawan secara seketika (real-time) dan pengelolaan data operasional oleh pengelola (admin). Proyek ini dibangun menggunakan arsitektur monorepo dengan pemisahan yang jelas antara sisi antarmuka pengguna (frontend) dan logika server (backend).

## Teknologi yang Digunakan

Aplikasi ini memanfaatkan serangkaian teknologi modern untuk memastikan skalabilitas dan keandalan sistem:

- **Frontend:** Dibangun menggunakan **React** dan **Vite**, serta React Router untuk navigasi antarmuka yang dinamis. Tampilan antarmuka (UI) dikembangkan secara penuh menggunakan pedoman **Design System [ZenGrid](https://designmd.ai/chef/zengrid)**.
- **Backend:** Menggunakan **NestJS** sebagai kerangka kerja utama pembuatan REST API, dilengkapi middleware keamanan **Helmet** dan **Rate Limiting** (`@nestjs/throttler`).
- **Database Relasional:** **PostgreSQL** yang dioperasikan melalui **Prisma ORM** untuk menyimpan entitas data utama seperti pengguna dan catatan absensi, dilengkapi **indeks komposit** untuk optimasi kueri.
- **Database NoSQL:** **MongoDB** untuk menyimpan rekam jejak (audit log) secara fleksibel dalam format dokumen JSON.
- **Message Broker:** **RabbitMQ** untuk menangani komunikasi antar layanan, khususnya dalam mengirimkan data log secara asinkron (Event-Driven) tanpa membebani proses utama.
- **Penyimpanan Objek & Optimasi:** **MinIO** (kompatibel dengan Amazon S3) untuk mengelola arsip log. Unggahan foto profil secara otomatis dikonversi ke format **WebP** menggunakan pustaka **Sharp** demi menghemat ruang penyimpanan. Kebijakan *bucket* membatasi akses publik hanya untuk berkas gambar.
- **WebSockets:** **Socket.io** digunakan untuk mendistribusikan notifikasi langsung kepada admin setiap kali terjadi perubahan data penting.
- **Penjadwalan (Cron):** `@nestjs/schedule` untuk proses pengarsipan log MongoDB ke MinIO dan *auto clock-out* lembur secara otomatis setiap hari.
- **Geolocation API:** Terintegrasi pada frontend untuk mencatat lokasi akurat (*latitude/longitude*) karyawan saat absen.
- **Containerization:** **Docker** dengan multi-stage Dockerfile untuk backend (NestJS) dan frontend (Nginx), serta **Docker Compose** untuk orkestrasi infrastruktur lokal.

## Fitur Utama

- **Autentikasi Pengguna:** Sistem login aman menggunakan JWT yang disimpan dalam **HTTP-Only Cookie** (`httpOnly`, `sameSite: 'lax'`, `secure` di produksi) yang membedakan hak akses antara Karyawan dan Admin. Dilengkapi endpoint `POST /auth/logout` untuk pembersihan sesi dan penanganan *Auto-Logout* jika token kadaluarsa (Pencegatan 401 Unauthorized).
- **Manajemen Karyawan:** Admin memiliki keleluasaan untuk menambahkan karyawan baru secara satuan atau massal via CSV melalui **modal popup** interaktif. Mendukung jam kerja fleksibel dengan pengaturan *Single-Shift/Multi-Shift* dan jadwal masuk khusus (`officeHourStart`).
- **Pemantauan Langsung & Algoritma Adil:** Dasbor admin menampilkan status kehadiran *real-time* (WebSocket). Terdapat fitur **Peringkat 3 Terbaik (Top 3 Punctual)** yang menghitung tingkat kedisiplinan secara adil berdasarkan selisih waktu hadir dengan jam kerja masing-masing karyawan, bukan berdasarkan waktu absolut.
- **Pelacakan Lokasi (Geolocation):** Mencegah kecurangan dengan mewajibkan karyawan mengaktifkan akses lokasi (*GPS*) saat melakukan *Clock In/Out*. Koordinat GPS divalidasi menggunakan DTO di backend. Lokasi ini dipetakan dan dapat dipantau langsung oleh Admin melalui tautan *Google Maps*.
- **Laporan Kehadiran:** Tersedia fitur laporan agregat di mana admin dapat menyaring data absensi berdasarkan rentang tanggal tertentu atau mencari karyawan secara global, diurutkan secara kronologis (terbaru di atas).
- **Rekam Jejak & Pengarsipan (Log Archival):** Sistem mencatat setiap perubahan profil dan absensi, disalurkan via RabbitMQ ke MongoDB, lalu diekspor secara *batch* ke MinIO secara otomatis.
- **Auto Clock-Out Lembur:** Cron job harian (`23:59:59 WIB`) secara otomatis menutup sesi absensi yang masih aktif menggunakan **Prisma Transaction** untuk menjamin atomisitas operasi.

## Keamanan (Security Hardening)

Sistem mengadopsi prinsip pengamanan berstandar industri:

- **HTTP-Only Cookie Auth:** JWT tidak pernah disimpan di `localStorage` (rentan XSS), melainkan di dalam HTTP-Only Cookie yang tidak dapat diakses oleh JavaScript sisi klien.
- **Helmet:** Middleware keamanan HTTP headers standar industri aktif secara global.
- **Rate Limiting:** Maksimal 100 request per menit per IP menggunakan `@nestjs/throttler`.
- **CORS Policy:** Origin dibatasi melalui variabel lingkungan `ALLOWED_ORIGINS` dengan mode `credentials: true`.
- **Input Validation:** Seluruh input divalidasi menggunakan DTO dan `ValidationPipe` (`whitelist: true`, `transform: true`).
- **File Upload Limits:** Foto profil maks 2MB, CSV maks 5MB.
- **MinIO Bucket Policy:** Akses publik hanya untuk tipe gambar; berkas `.log` bersifat privat.
- **Production Seed Guard:** Proses *seeding* data demo diblokir saat `NODE_ENV=production`.
- **Password Hash Exclusion:** Hash password tidak pernah dikembalikan dalam respon API.

## Panduan Instalasi dan Penggunaan

Pastikan komputer Anda sudah terpasang Node.js, pnpm, dan Docker.

1. **Persiapan Infrastruktur Lokal**
   Aplikasi membutuhkan beberapa layanan infrastruktur data. Anda dapat menjalankannya sekaligus menggunakan konfigurasi Docker Compose yang telah disediakan. Seluruh layanan dilengkapi *healthcheck* otomatis dan kebijakan `restart: unless-stopped`.
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
   npx prisma db push
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

6. **Unit Test**
   Menjalankan seluruh pengujian unit backend:
   ```bash
   cd apps/backend
   pnpm run test
   ```

## Deployment Produksi (Docker)

Proyek ini menyediakan **multi-stage Dockerfile** untuk backend dan frontend:

```bash
# Build backend image (dari root monorepo)
docker build -f apps/backend/Dockerfile -t dexa-wfh-backend .

# Build frontend image (dari root monorepo)
docker build -f apps/frontend/Dockerfile -t dexa-wfh-frontend .
```

- **Backend:** Image `node:20-alpine`, dijalankan dengan non-root user `node`, `NODE_ENV=production`, expose port `3000`.
- **Frontend:** Image `nginx:alpine` menyajikan aset statis React, dengan konfigurasi `nginx.conf` yang merutekan `/api/*` dan `/socket.io/*` ke container backend.

## Struktur Proyek

```
dexa-wfh-app/
├── apps/
│   ├── backend/                 # NestJS API Server
│   │   ├── prisma/              # Prisma Schema & Migrations
│   │   ├── src/
│   │   │   ├── auth/            # Autentikasi (JWT Cookie, Login/Logout)
│   │   │   ├── employee/        # Manajemen Karyawan (CRUD, CSV, Profil)
│   │   │   ├── attendance/      # Absensi (Clock-In/Out, Auto Clock-Out)
│   │   │   ├── audit-log/       # Audit Trail (RabbitMQ Consumer, Cron Export)
│   │   │   ├── notification/    # WebSocket Gateway (Real-time Events)
│   │   │   ├── storage/         # MinIO Object Storage (Sharp Image Processing)
│   │   │   ├── prisma/          # PrismaService (Connection Lifecycle)
│   │   │   └── common/          # Shared Utilities (Date, Pagination)
│   │   └── Dockerfile           # Multi-stage production Dockerfile
│   └── frontend/                # React.js SPA (Vite + ZenGrid Design System)
│       ├── src/
│       │   ├── admin/           # Subkomponen & View khusus Admin (Dashboard, Reports, Logs)
│       │   ├── employee/        # Subkomponen & View khusus Employee (History, Actions)
│       │   ├── components/
│       │   │   ├── ui/          # ZenGrid UI Core (Button, Input, Card, dll)
│       │   │   └── ErrorBoundary.tsx # Peningkat Keandalan (Catch React Crashes)
│       │   ├── pages/           # Halaman Utama (Admin, Employee, NotFound)
│       │   ├── utils/           # Utility Pendukung (API Client, Socket, Formatters)
│       │   ├── App.tsx          # Routing Utama & Root Redirector
│       │   ├── Login.tsx        # Halaman Otentikasi Masuk
│       │   └── main.tsx         # Entry Point Aplikasi (Bungkus ErrorBoundary)
│       ├── nginx.conf           # Konfigurasi Reverse Proxy Nginx (Produksi)
│       └── Dockerfile           # Multi-stage production Dockerfile
├── docker-compose.yml           # Orkestrasi Infrastruktur (PostgreSQL, MongoDB, RabbitMQ, MinIO)
├── sample_employees.csv         # Contoh data karyawan untuk bulk upload
└── pnpm-workspace.yaml          # Konfigurasi monorepo pnpm workspace
```
