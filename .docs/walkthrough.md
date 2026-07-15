# 🚀 Dexa Group WFH System - Implementation Walkthrough

> [!IMPORTANT]
> The architectural foundation and the vertical slice for the **Update Profile** feature are now complete and functional.

This document summarizes the changes made and how they fulfill the constraints established in `SKILL.md` and the system architecture diagram.

## 🏗️ 1. Infrastructure & Backend Scaffold
- **Monorepo Setup**: Configured a `pnpm` workspace containing `apps/backend` (NestJS) and `apps/frontend` (React + Vite).
- **Docker Compose**: Spun up local instances of PostgreSQL (Port `5432`), MongoDB, and RabbitMQ via Docker.
- **NestJS Modulith**: Scaffolded modular monolith components: `AuthModule`, `EmployeeModule`, `AttendanceModule`, `AuditLogModule`, and `NotificationModule`.

## 🧪 2. Test-Driven Development (TDD)
In strict compliance with `SKILL.md`, the "Update Profile" vertical slice was implemented using Red-Green-Refactor:
- **Red**: Wrote a failing unit test in [`employee.service.spec.ts`](file:///Users/sgo-byan/project/dexa-wfh-app/apps/backend/src/employee/employee.service.spec.ts) asserting Prisma, WebSocket, and RabbitMQ interactions.
- **Green**: Implemented the logic in [`employee.service.ts`](file:///Users/sgo-byan/project/dexa-wfh-app/apps/backend/src/employee/employee.service.ts).
- **Result**: Tests successfully passed! 🎉 (Bypassed the Node v23 issue by downgrading Prisma to v5.21.0 to ensure execution).

## 🐇 3. Event-Driven RabbitMQ & MongoDB
- The `EmployeeService` publishes a `ProfileUpdated` message to RabbitMQ upon a successful update.
- Implemented [`audit-log.controller.ts`](file:///Users/sgo-byan/project/dexa-wfh-app/apps/backend/src/audit-log/audit-log.controller.ts) to consume the `ProfileUpdated` event asynchronously.
- The `AuditLogService` stores the raw payload as a schemaless JSON document in MongoDB.

## 🖥️ 4. Core WFH Features (Clock-In/Out & Admin Dashboard)
- **Attendance Module**: Menambahkan API `POST /attendance/clock-in` dan `POST /attendance/clock-out`. Data absensi harian dicatat menggunakan `upsert` pada tabel `Attendance`.
- **Admin Module**: Menambahkan API `GET /admin/employees` untuk memuat seluruh karyawan beserta status kehadirannya secara *eager load*.
- Seluruh kejadian (Clock In/Out) otomatis memicu penyimpanan jejak log ke RabbitMQ dan memancarkan notifikasi *real-time* via WebSocket.

## 🎨 5. Frontend MVP (React + Vite)
- UI diperkaya dengan antarmuka **Tabel Admin** yang elegan, menampilkan status absen (Hadir/Tidak Hadir) dan foto profil.
- Tabel terhubung ke WebSockets. Ketika karyawan menekan tombol **Clock In**, **Clock Out**, atau mengedit profil, tabel Admin akan memuat ulang datanya secara otomatis dan menampilkan *Toast Animation* (🔔).

## 🪣 6. MinIO Object Storage (Enterprise File Upload)
- **Infrastructure**: Added `minio` to `docker-compose.yml` to provide S3-compatible local object storage.
- **StorageModule**: Scaffolded `StorageService` using the `minio` SDK to automatically provision a `dexa-uploads` bucket on startup and configure it with a public read-only policy (`s3:GetObject`).
- **FileInterceptor**: Modified `EmployeeController` and `EmployeeService` to accept `multipart/form-data` uploads, forward the raw buffer to MinIO, and seamlessly inject the persistent public image URL back into the user's Prisma record.
- **FormData**: Updated the React frontend to transmit binary image data, bringing the vertical slice to full enterprise-grade maturity.

## 🔐 7. Backend Security & Admin APIs (Phase 7)
- **JWT & Passport**: Integrated `@nestjs/jwt`, `passport-jwt`, and `bcryptjs` for secure user authentication. Added `JwtStrategy`, `JwtAuthGuard`, and `RolesGuard` for role-based access control (RBAC).
- **Admin Management**: Scaffolded `AdminController` with endpoints to add employees (single) and perform Bulk Uploads via CSV parsing (`csv-parser`).
- **Database Seeding**: The `AuthService` now automatically seeds default `ADMIN` and `EMPLOYEE` accounts upon initialization.
- **Log Exposure**: Added explicit MongoDB read capabilities to `AuditLogController` via Mongoose connection to expose real-time audit trails to the HR portal.
- **RxJS Hotfix**: Resolved eventual consistency and queue silent failures by forcefully subscribing to `ClientProxy.emit()` for both Profile Updates and Attendance Logs.

## 🚀 8. React SPA & Multi-Screen Routing (Phase 8)
- **React Router DOM**: Overhauled the monolithic UI into a sophisticated Single Page Application.
- **Protected Routes**: Implemented client-side routing logic redirecting unauthenticated traffic to `/login` while bifurcating authenticated users to `/employee/*` or `/admin/*`.
- **Employee Portal**: Dedicated screen featuring one-click attendance logging, interactive profile editing (MinIO image uploads), and personal attendance history.
- **HR Command Center**: Real-time websocket-powered dashboard featuring instantaneous employee tracking, single/bulk addition forms, and a live MongoDB Audit Trail view. Eventual consistency race conditions were mitigated via a 500ms staggered UI fetch.

## 🛠️ Infrastructure Monitoring & Access

Anda dapat mengakses panel kendali infrastruktur secara langsung melalui peramban (*browser*) maupun *Database Client* pilihan Anda (seperti DBeaver atau TablePlus):

- **RabbitMQ Management UI**: [http://localhost:15672](http://localhost:15672)
  - **Username**: `guest`
  - **Password**: `guest`
- **MinIO Object Storage Console**: [http://localhost:9001](http://localhost:9001)
  - **Username**: `minioadmin`
  - **Password**: `minioadmin`
- **PostgreSQL Database**:
  - **Host**: `localhost:5432`
  - **User**: `admin`
  - **Password**: `secretpassword`
  - **Database**: `dexa_wfh`
- **MongoDB**: Terbuka di `localhost:27017` tanpa *auth* (khusus *development* lokal).

---

> [!TIP]
> **How to Run the Application Locally:**
> 
> 1. Pastikan Docker *container* masih berjalan (`docker compose up -d`).
> 2. Jalankan Backend: `cd apps/backend && npm run start:dev`
> 3. Jalankan Frontend: `cd apps/frontend && npm run dev`
> 4. Buka `http://localhost:5173` di *browser* Anda untuk melihat hasil akhirnya.
