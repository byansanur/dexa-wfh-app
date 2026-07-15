# Dexa WFH App - Core Features Task List

## Phase 5: Core WFH Features
- `[x]` Create AttendanceService for Clock In/Out logic
- `[x]` Create AttendanceController and register in module
- `[x]` Create AdminController for fetching employee list and attendance
- `[x]` Update React Frontend with Clock In/Out buttons
- `[x]` Update React Frontend with real-time Admin Table

## Phase 6: MinIO Object Storage
- `[x]` Update docker-compose and .env for MinIO
- `[x]` Install minio SDK and multer types in backend
- `[x]` Create StorageModule and StorageService for S3 uploads
- `[x]` Modify EmployeeController to accept multipart/form-data
- `[x]` Update React App.tsx to send file via FormData

## Phase 7: Backend Security & APIs
- `[x]` Install Auth and CSV dependencies
- `[x]` Scaffold AuthModule, Guards, and Decorators
- `[x]` Implement Employee CRUD & Bulk Upload in AdminController
- `[x]` Implement GET /attendance/history in AttendanceController
- `[x]` Implement GET log endpoints in AuditLogController

## Phase 8: Frontend Multi-Screen SPA
- `[x]` Install react-router-dom
- `[x]` Create Login Screen
- `[x]` Create Protected Routes (Employee & Admin)
- `[x]` Implement Admin Dashboard forms (Single & Bulk)
- `[x]` Implement Log Viewer tables in Admin Dashboard
