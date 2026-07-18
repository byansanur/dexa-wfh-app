# Dexa WFH App

Aplikasi manajemen kehadiran (Work From Home) karyawan dan monitoring HRD. Dibangun menggunakan arsitektur monorepo dengan NestJS di sisi backend dan React (Vite) di sisi frontend.

## Tech Stack

- **Frontend:** React + Vite, React Router, dan **ZenGrid Design System**.
- **Backend:** NestJS (REST API) + Helmet + Rate Limiter (`@nestjs/throttler`).
- **Database Utama:** PostgreSQL + Prisma ORM (lengkap dengan composite index pada data absensi).
- **Log Database:** MongoDB (untuk audit log terpisah secara schemaless).
- **Message Broker:** RabbitMQ (untuk streaming event log secara asinkron).
- **Object Storage:** MinIO (S3 Compatible) untuk backup log & simpan foto profil (auto-convert ke WebP menggunakan Sharp).
- **Real-time:** Socket.io (push notifikasi ke dashboard admin).
- **Scheduler:** `@nestjs/schedule` untuk auto-archive log ke MinIO dan auto-clockout lembur harian.
- **Containerization:** Docker (multi-stage build untuk backend/frontend) & Docker Compose.

---

## Fitur Utama

- **Secure Session:** Autentikasi JWT via HTTP-Only Cookie (`sameSite: lax`). Dilengkapi penanganan auto-logout saat token kedaluwarsa.
- **CRUD & Bulk Import Karyawan:** Tambah data karyawan satuan atau massal via upload file CSV pada modal dashboard admin.
- **Top 3 Punctual (Algoritma Adil):** Perhitungan tingkat kedisiplinan berdasarkan selisih waktu masuk dengan jam kerja masing-masing (bukan waktu masuk absolut).
- **GPS Geolocation:** Validasi koordinat GPS saat absen di backend via DTO (Regex) dan visualisasi lokasi presisi dengan link Google Maps di admin.
- **Audit Trail & Archival:** Log mutasi profile/absensi dialirkan via RabbitMQ ke MongoDB, lalu diekspor otomatis ke file `.log` di MinIO tiap hari.
- **Auto Clock-Out:** Sistem otomatis menutup sesi absen yang menggantung pada pukul 23:59 WIB menggunakan Prisma Transaction untuk menjaga konsistensi data.

---

## Keamanan (Security Hardening)

- **HTTP-Only Cookie:** Mencegah pencurian token JWT via XSS.
- **Rate Limiting & Helmet:** Proteksi brute-force (100 req/min per IP) dan pengaktifan header HTTP standar industri.
- **CORS Policy:** Akses REST API dibatasi hanya untuk origin terdaftar.
- **Strict Validation:** Sanitasi payload API menggunakan NestJS ValidationPipe dan class-validator DTO.
- **File Upload Guard:** Batasan ukuran file (2MB foto, 5MB CSV) serta bucket policy MinIO (hanya file gambar WebP yang boleh diakses publik).
- **Security Production:** Seeding db diblokir jika `NODE_ENV=production` dan inisialisasi app akan error jika `JWT_SECRET` kosong di production.
- **Password Security:** Password di-hash dengan bcrypt dan tidak pernah disertakan dalam response query DB/API.

---

## Panduan Lokal & Development

### 1. Jalankan Infrastruktur Lokal (Docker)
Infrastruktur (PostgreSQL, MongoDB, RabbitMQ, MinIO) dikonfigurasi dengan automatic healthcheck.
```bash
docker-compose up -d
```

### 2. Install Dependencies
Jalankan di root folder:
```bash
pnpm install
```

### 3. Setup Env & Database
Copy `.env.example` ke `.env` di `/apps/backend` dan `/apps/frontend`.
Lalu sinkronisasi database:
```bash
cd apps/backend
npx prisma generate
npx prisma db push
```

### 4. Jalankan Aplikasi
Frontend menggunakan Vite Proxy, sehingga request API (`/api`) dan WebSocket (`/socket.io`) diarahkan otomatis ke backend (port 3000) tanpa masalah CORS.

Jalankan di 2 terminal terpisah:
- **Backend:** `cd apps/backend && pnpm run start:dev`
- **Frontend:** `cd apps/frontend && pnpm run dev`

*Catatan: Jika ingin menggunakan Ngrok, Anda hanya perlu mengekspos port frontend saja (`5173`) karena proxy routing sudah otomatis terpusat.*

### 5. Jalankan Unit Test
```bash
cd apps/backend
pnpm run test
```

---

## Deployment Produksi (Docker)

Gunakan perintah build berikut dari root direktori:
```bash
# Build Backend
docker build -f apps/backend/Dockerfile -t dexa-wfh-backend .

# Build Frontend (Nginx Alpine)
docker build -f apps/frontend/Dockerfile -t dexa-wfh-frontend .
```

*Frontend image menyajikan file statis React via Nginx dan mem-proxy request API `/api/*` serta WebSocket `/socket.io/*` langsung ke container backend.*

---

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

