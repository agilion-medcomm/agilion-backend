# 🏥 Agilion MedComm - Complete Backend Documentation

**Full-featured hospital management system with password reset functionality**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Quick Start](#quick-start)
5. [API Documentation](#api-documentation)
6. [Password Reset Feature](#password-reset-feature)
7. [Database Schema](#database-schema)
8. [Project Structure](#project-structure)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)
11. [Git Workflow](#git-workflow)

---

## 🎯 Overview

Agilion MedComm is a comprehensive hospital management system backend built with Node.js, Express, Prisma, and PostgreSQL. It features multi-role authentication, appointment management, doctor leave tracking, patient registration, and a complete password reset system for patients.

### Key Capabilities
- ✅ Multi-role authentication (Patient, Doctor, Admin, Cashier, Laborant)
- ✅ **Password reset for patients via email**
- ✅ **Medical files system with soft delete (tombstone)**
- ✅ Appointment management with leave request integration
- ✅ Doctor leave/time-off system
- ✅ Personnel management (CRUD operations)
- ✅ Patient registration and search
- ✅ Automatic slot blocking based on approved leaves
- ✅ Role-based access control
- ✅ Secure token-based password reset
- ✅ File upload (PDF, JPG, PNG) with validation

---

## 🛠 Tech Stack

- **Node.js (LTS)** - JavaScript runtime
- **Express** - Web framework
- **Prisma** - ORM for PostgreSQL
- **PostgreSQL** - Database (Docker containerized)
- **Docker** - Database containerization
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi** - Request validation
- **Nodemailer** - Email service for password reset
- **Crypto** - Secure token generation

---

## ✨ Features

### Authentication & Authorization
- Multi-role system (PATIENT, DOCTOR, ADMIN, CASHIER, LABORANT)
- JWT-based authentication with role-specific IDs
- Role-based access control
- **Password reset via email (patient only)**
- Personnel login with extended user data (doctorId, adminId, laborantId)

### Appointment Management
- Create and manage appointments
- View booked time slots
- Automatic slot blocking for doctor leaves
- Appointment status tracking (PENDING, APPROVED, CANCELLED, COMPLETED)

### Leave Request System
- Doctors can request time off
- Admin approval workflow
- Automatic appointment slot blocking for approved leaves
- Leave status tracking (PENDING, APPROVED, REJECTED)

### Personnel Management (Admin Only)
- Register new personnel (doctors, admins)
- Update personnel information
- Delete personnel
- List all personnel

### Password Reset System
- Secure token-based reset
- Email notifications (Turkish language)
- 1-hour token expiry
- One-time use tokens
- Patient-only restriction
- No email enumeration (security)

### Medical Files System (Laborant)
- File upload (PDF, JPG, PNG up to 10MB)
- Soft delete with audit trail (tombstone method)
- Role-based file access control
- Patient test result management
- File metadata tracking (test name, date, description)
- Secure file storage with validation
- Recovery capability for deleted files

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### 1. Clone & Install

```bash
git clone https://github.com/agilion-medcomm/agilion-backend.git
cd agilion-backend
npm install
```

### 2. Environment Setup

Create `.env` file in project root:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server Configuration
PORT=5000

# Email Configuration (for Password Reset)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
FRONTEND_URL="http://localhost:5174"

# Initial Admin Credentials (for bootstrap script)
INITIAL_ADMIN_TCKN=99999999999
INITIAL_ADMIN_EMAIL=admin@agilion.local
INITIAL_ADMIN_PASSWORD=Admin123!
INITIAL_ADMIN_FIRSTNAME=Admin
INITIAL_ADMIN_LASTNAME=User
```

#### Gmail App Password Setup
1. Enable 2-Step Verification in your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

**Note:** Without email configuration, password reset tokens will be logged to console (perfect for development).

### 3. Start Database

```bash
docker compose up -d
```

PostgreSQL starts on `localhost:5432`

### 4. Run Migrations

```bash
npx prisma migrate dev
```

This creates all database tables including password reset fields.

### 5. Create Initial Admin

```bash
node scripts/bootstrapAdmin.js
```

Creates the first admin user with credentials from `.env`.

### 6. Start Server

```bash
npm run dev
```

Server runs on configured port (default: `http://localhost:5000`)

### 7. Test API

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Login as admin
curl -X POST http://localhost:5000/api/v1/auth/personnel/login \
  -H "Content-Type: application/json" \
  -d '{"tckn":"99999999999","password":"Admin123!"}'
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### POST `/auth/register`
Register new patient

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "tckn": "12345678901",
  "email": "john@example.com",
  "phoneNumber": "+15551234567",
  "dateOfBirth": "1990-01-01",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully.",
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "firstName": "John",
    "role": "PATIENT"
  }
}
```

#### POST `/auth/login`
Login (all roles)

**Request:**
```json
{
  "tckn": "12345678901",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful.",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "role": "PATIENT",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      ...
    }
  }
}
```

#### POST `/auth/personnel/login`
Personnel login (returns extended user object)

**Request:**
```json
{
  "tckn": "11111111111",
  "password": "admin123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful.",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "role": "ADMIN",
      "firstName": "Admin",
      "lastName": "User",
      "doctorId": null,
      "adminId": 1,
      ...
    }
  }
}
```

#### GET `/auth/me`
Get current user profile

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": {
    "id": 1,
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "role": "PATIENT",
    ...
  }
}
```

#### POST `/auth/request-password-reset` 🔑
Request password reset (patient only)

**Request:**
```json
{
  "email": "patient@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "If the email exists, a password reset link has been sent."
}
```

**Notes:**
- Always returns success message (security: don't reveal if email exists)
- Only sends email if user is a PATIENT
- Token expires in 1 hour
- Email contains reset link with token

#### POST `/auth/reset-password` 🔑
Reset password using token

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Password has been reset successfully."
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Invalid or expired reset token."
}
```

#### POST `/auth/personnel/register`
Admin creates personnel

**Headers:** `Authorization: Bearer <admin-token>` (or token in body)

**Request:**
```json
{
  "token": "admin-jwt-token",
  "tckn": "11111111115",
  "firstName": "Doctor",
  "lastName": "Smith",
  "password": "password123",
  "role": "DOCTOR",
  "phoneNumber": "+15551234567",
  "email": "doctor@example.com",
  "dateOfBirth": "1980-01-01",
  "specialization": "Cardiology"
}
```

### Doctor Endpoints

#### GET `/doctors`
Get all doctors (public endpoint)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "Doctor",
      "lastName": "Smith",
      "specialization": "Cardiology",
      ...
    }
  ]
}
```

### Patient Endpoints

#### GET `/patients`
Get all patients (for doctor search)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "tckn": "12345678901",
      "firstName": "John",
      "lastName": "Doe",
      ...
    }
  ]
}
```

### Personnel Endpoints (Admin Only)

#### GET `/personnel`
List all personnel

**Headers:** `Authorization: Bearer <admin-token>`

#### POST `/personnel`
Register new personnel (same as `/auth/personnel/register`)

#### PUT `/personnel/:id`
Update personnel details

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "email": "newemail@example.com",
  "phoneNumber": "+15559876543",
  "specialization": "Neurology"
}
```

#### DELETE `/personnel/:id`
Delete personnel

**Headers:** `Authorization: Bearer <admin-token>`

### Appointment Endpoints

#### GET `/appointments`
Get appointments

**Query Parameters:**
- `list=true&doctorId=1` - Get appointments for doctor panel
- `doctorId=1&date=25.11.2025` - Get booked times for appointment booking

**Response (booked times):**
```json
{
  "status": "success",
  "data": {
    "bookedTimes": ["09:00", "09:30", "10:00", ...]
  }
}
```

#### POST `/appointments`
Create new appointment

**Request:**
```json
{
  "doctorId": 1,
  "patientId": 1,
  "date": "25.11.2025",
  "time": "10:00",
  "status": "APPROVED"
}
```

#### PUT `/appointments/:id/status`
Update appointment status

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "CANCELLED"
}
```

Status options: `PENDING`, `APPROVED`, `CANCELLED`, `COMPLETED`

### Leave Request Endpoints

#### GET `/leave-requests`
Get leave requests

**Headers:** `Authorization: Bearer <token>`

- Admins see all leave requests
- Doctors see only their own

#### POST `/leave-requests`
Create leave request (doctor only)

**Headers:** `Authorization: Bearer <doctor-token>`

**Request:**
```json
{
  "personnelId": 1,
  "startDate": "2025-12-01",
  "startTime": "09:00",
  "endDate": "2025-12-01",
  "endTime": "18:00",
  "reason": "Personal leave"
}
```

#### PUT `/leave-requests/:id/status`
Update leave request status (admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "status": "APPROVED"
}
```

Status options: `APPROVED`, `REJECTED`

### Date/Time Formats

- **Appointment dates:** `DD.MM.YYYY` (e.g., "25.11.2025")
- **Appointment times:** `HH:MM` (e.g., "10:00")
- **Leave dates:** `YYYY-MM-DD` (e.g., "2025-12-01")
- **Birth dates:** `YYYY-MM-DD`

### Error Responses

**Standard Error:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

**Validation Error:**
```json
{
  "status": "error",
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

---

## 🔐 Password Reset Feature

### Overview

Complete password reset functionality for patient accounts with:
- Secure token-based authentication
- Email notifications (Turkish language)
- 1-hour token expiration
- One-time use tokens
- Patient-only access restriction

### Implementation Details

#### Database Schema
Added to `User` model:
```prisma
model User {
  // ... existing fields
  
  // Password reset fields
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  
  // ... rest of model
}
```

#### Security Features

1. **Token Hashing:** Reset tokens are hashed with SHA-256 before storage
2. **Time-Limited:** Tokens expire after 1 hour
3. **One-Time Use:** Token is deleted after successful password reset
4. **Role Restriction:** Only PATIENT role can reset passwords
5. **No Email Enumeration:** Same response whether email exists or not
6. **Password Requirements:** Minimum 8 characters

#### Email Template

Turkish language email includes:
- Personalized greeting with user's first name
- Clear call-to-action button
- Expiry information (1 hour)
- Security reminder
- Professional branding

Example:
```
Subject: Şifre Sıfırlama - Agilion MedComm

Merhaba [Name],

Hesabınız için şifre sıfırlama talebinde bulundunuz.
Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:

[Şifremi Sıfırla]

Bu bağlantı 1 saat boyunca geçerlidir.

Eğer şifre sıfırlama talebinde bulunmadıysanız,
bu e-postayı görmezden gelebilirsiniz.
```

#### Workflow

```
1. User visits login page
   ↓
2. Clicks "Şifremi Unuttum" (Forgot Password)
   ↓
3. Enters email address
   ↓
4. Backend generates secure token
   ↓
5. Token hashed and stored in database
   ↓
6. Email sent with reset link
   ↓
7. User clicks link in email
   ↓
8. Opens reset password page with token
   ↓
9. Enters new password (twice)
   ↓
10. Backend validates token
    ↓
11. Password updated, token deleted
    ↓
12. Success message + redirect to login
    ↓
13. User logs in with new password ✅
```

#### Files Structure

**Backend:**
- `src/services/email.service.js` - Email sending
- `src/services/auth.service.js` - Password reset logic
- `src/api/controllers/auth.controller.js` - HTTP handlers
- `src/api/validations/auth.validation.js` - Input validation
- `src/api/routes/auth.routes.js` - Route definitions

**Frontend:**
- `src/components/pages/ForgotPasswordPage.jsx` - Request reset
- `src/components/pages/ResetPasswordPage.jsx` - Reset with token
- `src/components/pages/LoginPage.jsx` - Updated with link
- `src/App.jsx` - Routes configured

---

## 🏥 Medical Files API

### Overview
The Medical Files System allows laborants to upload patient test results (PDF, JPG, PNG) with full audit trail using soft delete (tombstone method).

### Endpoints

#### 1. Upload Medical File
**POST** `/api/v1/medical-files`

**Authorization:** Laborant only  
**Content-Type:** `multipart/form-data`

```bash
curl -X POST http://localhost:5001/api/v1/medical-files \
  -H "Authorization: Bearer <laborant_token>" \
  -F "file=@test.pdf" \
  -F "patientId=5" \
  -F "testName=Hemogram" \
  -F "testDate=2025-12-04" \
  -F "description=Normal values"
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Medical file uploaded successfully.",
  "data": {
    "id": 1,
    "patientId": 5,
    "laborantId": 3,
    "fileName": "test.pdf",
    "fileUrl": "/uploads/medical-files/1733341731123.pdf",
    "fileType": "application/pdf",
    "fileSizeKB": 192.5,
    "testName": "Hemogram",
    "testDate": "2025-12-04T00:00:00.000Z",
    "description": "Normal values",
    "createdAt": "2025-12-04T21:28:51.123Z"
  }
}
```

#### 2. Get My Medical Files
**GET** `/api/v1/medical-files/my`

**Authorization:** Patient only

```bash
curl -X GET http://localhost:5001/api/v1/medical-files/my \
  -H "Authorization: Bearer <patient_token>"
```

#### 3. Get Patient Medical Files
**GET** `/api/v1/medical-files/patient/:patientId`

**Authorization:** Doctor or Admin only

```bash
curl -X GET http://localhost:5001/api/v1/medical-files/patient/5 \
  -H "Authorization: Bearer <doctor_token>"
```

#### 4. Get Single File
**GET** `/api/v1/medical-files/:fileId`

**Authorization:** Required (role-based access)

#### 5. Get Laborant's Files
**GET** `/api/v1/medical-files/laborant/:laborantId`

**Authorization:** Admin only

#### 6. Delete File (Soft Delete)
**DELETE** `/api/v1/medical-files/:fileId`

**Authorization:** Laborant (own files) or Admin

```bash
curl -X DELETE http://localhost:5001/api/v1/medical-files/1 \
  -H "Authorization: Bearer <laborant_token>"
```

**Note:** Files are soft-deleted (tombstone method) - `deletedAt` timestamp is set instead of removing the record.

#### 7. Download File
**GET** `/uploads/medical-files/:filename`

Static file serving - no authentication required for direct file access.

### File Upload Configuration
- **Allowed Types:** PDF, JPG, PNG
- **Max Size:** 10MB
- **Storage:** Local filesystem (`/uploads/medical-files/`)
- **Naming:** Timestamp-based unique filenames

### Soft Delete (Tombstone)
Files are not permanently deleted. Instead:
- `deletedAt` timestamp is set
- Files hidden from all queries
- Physical files preserved for audit/recovery
- Can be restored by setting `deletedAt = NULL`

### Authorization Matrix

| Role | Upload | View Own | View Patient | View All | Delete Own | Delete Any |
|------|--------|----------|--------------|----------|------------|------------|
| PATIENT | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DOCTOR | ❌ | N/A | ✅ | ✅ | ❌ | ❌ |
| ADMIN | ❌ | N/A | ✅ | ✅ | ❌ | ✅ |
| LABORANT | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### Testing Medical Files

#### Create Test Laborant
```bash
node scripts/createTestLaborant.js
```

This creates:
- Email: laborant.test@hospital.com
- TCKN: 12345678901
- Password: password123

#### Login as Laborant
```bash
curl -X POST http://localhost:5001/api/v1/auth/personnel/login \
  -H "Content-Type: application/json" \
  -d '{"tckn": "12345678901", "password": "password123"}'
```

---

## 🗄 Database Schema

```prisma
enum UserRole {
  PATIENT
  DOCTOR
  ADMIN
  CASHIER
  LABORANT
}

model User {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  password         String
  role             UserRole  @default(PATIENT)
  firstName        String
  lastName         String
  tckn             String    @unique
  phoneNumber      String?   @unique
  dateOfBirth      DateTime?
  
  // Password reset fields
  resetToken       String?   @unique
  resetTokenExpiry DateTime?
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  patient          Patient?
  doctor           Doctor?
  admin            Admin?
  laborant         Laborant?
}

model Patient {
  id           Int           @id @default(autoincrement())
  userId       Int           @unique
  user         User          @relation(fields: [userId], references: [id])
  appointments Appointment[]
  medicalFiles MedicalFile[]
}

model Doctor {
  id             Int            @id @default(autoincrement())
  userId         Int            @unique
  user           User           @relation(fields: [userId], references: [id])
  specialization String
  appointments   Appointment[]
  leaveRequests  LeaveRequest[]
}

model Admin {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])
}

model Laborant {
  id           Int           @id @default(autoincrement())
  userId       Int           @unique
  user         User          @relation(fields: [userId], references: [id])
  medicalFiles MedicalFile[]
}

model MedicalFile {
  id          Int       @id @default(autoincrement())
  patientId   Int
  patient     Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  laborantId  Int
  laborant    Laborant  @relation(fields: [laborantId], references: [id], onDelete: SetNull)
  fileName    String
  fileUrl     String
  fileType    String
  fileSizeKB  Float
  testName    String
  testDate    DateTime
  description String?
  deletedAt   DateTime? // Soft delete (tombstone)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Appointment {
  id        Int      @id @default(autoincrement())
  patientId Int
  patient   Patient  @relation(fields: [patientId], references: [id])
  doctorId  Int
  doctor    Doctor   @relation(fields: [doctorId], references: [id])
  date      String   // DD.MM.YYYY
  time      String   // HH:MM
  status    String   // PENDING, APPROVED, CANCELLED, COMPLETED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LeaveRequest {
  id          Int       @id @default(autoincrement())
  doctorId    Int
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  startDate   String    // YYYY-MM-DD
  startTime   String    // HH:MM
  endDate     String    // YYYY-MM-DD
  endTime     String    // HH:MM
  reason      String
  status      String    // PENDING, APPROVED, REJECTED
  requestedAt DateTime  @default(now())
  resolvedAt  DateTime?
}
```

### Relationships
- `User` → one-to-one → `Patient | Doctor | Admin | Laborant`
- `Doctor` → one-to-many → `Appointments`
- `Doctor` → one-to-many → `LeaveRequests`
- `Patient` → one-to-many → `Appointments`
- `Patient` → one-to-many → `MedicalFiles`
- `Laborant` → one-to-many → `MedicalFiles`

---

## 📁 Project Structure

```
agilion-backend/
├── prisma/
│   ├── schema.prisma              # Database models
│   └── migrations/                # Migration history
│       └── 20251126120053_add_password_reset_fields/
├── scripts/
│   ├── bootstrapAdmin.js          # Initial admin creation
│   └── createTestLaborant.js      # Create test laborant user
├── src/
│   ├── api/
│   │   ├── controllers/           # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── appointment.controller.js
│   │   │   ├── doctor.controller.js
│   │   │   ├── leaveRequest.controller.js
│   │   │   ├── patient.controller.js
│   │   │   ├── personnel.controller.js
│   │   │   └── medicalFile.controller.js
│   │   ├── middlewares/           # Auth, validation, errors
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── requireAdmin.js
│   │   │   ├── validate.js
│   │   │   └── upload.js         # Multer file upload
│   │   ├── routes/                # Express routes
│   │   │   ├── index.js
│   │   │   ├── auth.routes.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── doctor.routes.js
│   │   │   ├── leaveRequest.routes.js
│   │   │   ├── patient.routes.js
│   │   │   ├── personnel.routes.js
│   │   │   └── medicalFile.routes.js
│   │   └── validations/           # Joi schemas
│   │       ├── auth.validation.js
│   │       └── medicalFile.validation.js
│   ├── config/
│   │   └── db.js                  # Prisma client
│   ├── repositories/              # Database access
│   │   ├── appointment.repository.js
│   │   ├── leaveRequest.repository.js
│   │   ├── user.repository.js
│   │   └── medicalFile.repository.js
│   ├── services/                  # Business logic
│   │   ├── auth.service.js
│   │   ├── email.service.js       # Password reset emails
│   │   └── medicalFile.service.js # Medical files management
│   ├── app.js                     # Express app setup
│   └── server.js                  # Server entry point
├── uploads/
│   └── medical-files/             # Uploaded medical files storage
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── docker-compose.yml             # PostgreSQL container
├── package.json                   # Dependencies
└── README.md                      # This file
```

---

## 🧪 Testing Guide

### Manual API Testing

#### Test Password Reset Flow

1. **Start Backend:**
```bash
cd /path/to/agilion-backend
npm run dev
```

2. **Register Test Patient:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Patient",
    "tckn": "12345678901",
    "email": "test@example.com",
    "phoneNumber": "+905551234567",
    "dateOfBirth": "1990-01-01",
    "password": "password123"
  }'
```

3. **Request Password Reset:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

4. **Check Console/Email:**
   - If email configured: Check inbox for reset link
   - If no email: Check backend console for token

5. **Reset Password:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "newPassword": "newPassword123"
  }'
```

6. **Login with New Password:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tckn": "12345678901",
    "password": "newPassword123"
  }'
```

### Frontend Testing

#### Prerequisites
```bash
cd agilion-frontend
npm run dev
```

#### Test Steps

1. **Navigate to Login:**
   - Open: `http://localhost:5174/login`

2. **Request Reset:**
   - Click: "Şifremi Unuttum"
   - Enter: patient email
   - Submit form
   - See success message

3. **Get Token:**
   - Check email inbox (if configured)
   - Or check backend console logs
   - Copy reset URL or token

4. **Reset Password:**
   - Visit: `http://localhost:5174/reset-password?token=YOUR_TOKEN`
   - Enter new password (twice)
   - Submit form
   - See success message

5. **Login:**
   - Auto-redirected to login page
   - Enter TCKN and new password
   - Successfully logged in! ✅

### Test Cases

| Test Case | Input | Expected Result |
|-----------|-------|----------------|
| Valid patient email | `patient@example.com` | Success message, email sent |
| Invalid email format | `not-an-email` | Validation error |
| Non-existent email | `fake@example.com` | Generic success (security) |
| Non-patient email | `doctor@example.com` | Generic success (no email sent) |
| Valid token | Valid token + password | Password reset success |
| Expired token | 1+ hour old token | "Invalid or expired token" |
| Invalid token | Random string | "Invalid or expired token" |
| Short password | Less than 8 chars | "Password must be at least 8 characters" |
| Password mismatch | Different passwords | "Passwords don't match" |
| Reused token | Already used token | "Invalid or expired token" |

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Error:** `Can't reach database server at localhost:5432`

**Solution:**
```bash
# Check if Docker is running
docker ps

# If not running, start database
docker compose up -d

# Or start existing container
docker start hospital_db_postgres
```

#### 2. Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port
lsof -ti:5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### 3. JWT Token Invalid
**Error:** `Invalid token` or `jwt malformed`

**Solution:**
- Check `JWT_SECRET` in `.env` matches across services
- Ensure token is properly formatted: `Authorization: Bearer <token>`
- Token might be expired (30-minute expiry)

#### 4. Password Reset Email Not Received
**Solution:**
- Check spam folder
- Verify email credentials in `.env`
- Check backend console for errors
- For Gmail: use app-specific password, not regular password
- If no email configured: token is logged to console

#### 5. "Invalid or expired reset token"
**Solution:**
- Token expires after 1 hour
- Request new reset link
- Make sure token is correctly copied from email
- Token can only be used once

#### 6. CORS Errors in Frontend
**Solution:**
- Ensure backend CORS allows frontend URL
- Check `FRONTEND_URL` in backend `.env`
- Verify frontend is calling correct backend URL

#### 7. Prisma Client Not Generated
**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npx prisma generate
npm install @prisma/client
```

#### 8. Migration Failed
**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or apply specific migration
npx prisma migrate deploy
```

### Logging & Debugging

Enable detailed password reset logs:
- All password reset operations log to console with `[PASSWORD RESET]` prefix
- Check backend terminal for token if email not configured
- Email service errors are logged with full error details

---

## 📚 Git Workflow

### Branch Strategy

**Main Branch:** 
- Stable production code
- Never push directly to main
- Always use pull requests

**Feature Branches:**
- Create for each new feature or fix
- Naming: `feature/BE-[number]-[description]`
- Example: `feature/BE-1-password-reset`

### Workflow Steps

#### 1. Create Feature Branch
```bash
git checkout -b feature/BE-[number]-[description]
# Example: git checkout -b feature/BE-1-password-reset
```

#### 2. Make Changes and Commit
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add password reset functionality"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `style:` - Code style/formatting
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Adding tests

#### 3. Push to GitHub
```bash
git push origin feature/BE-[number]-[description]
```

#### 4. Create Pull Request
1. Go to GitHub repository
2. Click "Compare & Pull Request"
3. Add description of changes
4. Request review from team members
5. Wait for at least 1 approval
6. Merge after approval

#### 5. Clean Up Branch
```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Delete local branch
git branch -d feature/BE-1-password-reset

# Delete remote branch
git push origin --delete feature/BE-1-password-reset
```

### Working Directory
All git commands should be run from the project root:
```bash
cd ~/Desktop/agilion-backend
```

---

## 📝 Additional Resources

### Useful Commands

```bash
# Database Management
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create and apply migration
npx prisma generate        # Generate Prisma Client
npx prisma db push         # Push schema without migration

# Development
npm run dev                # Start development server
npm test                   # Run tests

# Docker
docker compose up -d       # Start database
docker compose down        # Stop database
docker ps                  # List running containers
docker logs <container>    # View container logs
```

### Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"

# Optional
PORT=5000

# Email (optional but recommended)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="app-password"
FRONTEND_URL="http://localhost:5174"

# Bootstrap Admin (optional)
INITIAL_ADMIN_TCKN=99999999999
INITIAL_ADMIN_EMAIL=admin@agilion.local
INITIAL_ADMIN_PASSWORD=Admin123!
INITIAL_ADMIN_FIRSTNAME=Admin
INITIAL_ADMIN_LASTNAME=User
```

### Dependencies

**Production:**
- `@prisma/client` - Database ORM
- `express` - Web framework
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `joi` - Validation
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `nodemailer` - Email service
- `pg` - PostgreSQL driver
- `multer` - File upload handling

**Development:**
- `nodemon` - Auto-restart on changes
- `prisma` - Database toolkit
- `jest` - Testing framework

---

## 🎉 Success Checklist

After setup, verify everything works:

- [ ] Database running (`docker ps` shows postgres container)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Can register new patient (`POST /auth/register`)
- [ ] Can login as patient (`POST /auth/login`)
- [ ] Can login as admin (`POST /auth/personnel/login`)
- [ ] Can request password reset (`POST /auth/request-password-reset`)
- [ ] Receive email or see token in console
- [ ] Can reset password (`POST /auth/reset-password`)
- [ ] Can login with new password
- [ ] Can create appointment (`POST /appointments`)
- [ ] Can list doctors (`GET /doctors`)
- [ ] Can create test laborant (`node scripts/createTestLaborant.js`)
- [ ] Laborant can upload medical file (`POST /medical-files`)
- [ ] Patient can view own medical files (`GET /medical-files/my`)

---

## 👥 Contributors

- **Backend Team** - Agilion MedComm
- **Created by:** Emre Kaan Şahin

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review error logs in terminal
3. Check GitHub Issues
4. Contact team lead

---

**Last Updated:** December 5, 2025

**Version:** 2.1.0 (with Medical Files System & Soft Delete)
