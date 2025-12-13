# 🏥 Agilion MedComm - Hospital Management System

Full-featured hospital backend with JWT authentication, appointment management, medical files, and email notifications.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Docker Desktop
- Gmail account (for email features)

### Setup
```bash
# Clone and install
git clone https://github.com/agilion-medcomm/agilion-backend.git
cd agilion-backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start database
docker compose up -d

# Run migrations
npx prisma migrate dev

# Create admin user
node scripts/bootstrapAdmin.js

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

---

## 🔧 Tech Stack

- **Node.js** + **Express** - Server framework
- **PostgreSQL** + **Prisma** - Database ORM
- **JWT** + **Bcrypt** - Authentication & security
- **Nodemailer** - Email notifications
- **Multer** - File uploads
- **Docker** - Database containerization

---

## ✨ Features

### Authentication & Roles
- Multi-role system: `PATIENT`, `DOCTOR`, `ADMIN`, `CASHIER`, `LABORANT`
- JWT token-based auth
- Password reset via email (patients only)
- Email verification

### Core Modules
- **Appointments** - Scheduling with leave integration
- **Medical Files** - Lab results upload (PDF/JPG/PNG, soft delete)
- **Leave Requests** - Doctor time-off management
- **Personnel Management** - CRUD for staff (admin only)
- **Contact Forms** - Patient inquiries

---

## 📡 API Overview

Base URL: `http://localhost:5000/api/v1`

### Authentication
```bash
# Register patient
POST /auth/register
Body: { firstName, lastName, tckn, email, phoneNumber, password, dateOfBirth }

# Login
POST /auth/login
Body: { tckn, password }

# Personnel login
POST /auth/personnel/login
Body: { tckn, password }

# Get profile
GET /auth/me
Headers: Authorization: Bearer <token>

# Password reset
POST /auth/request-password-reset
Body: { email }

POST /auth/reset-password
Body: { token, newPassword }
```

### Appointments
```bash
# Get booked times
GET /appointments?doctorId=1&date=25.11.2025

# Create appointment
POST /appointments
Body: { doctorId, date, time, status }

# Update status
PUT /appointments/:id/status
Body: { status: "CANCELLED" }
```

### Medical Files
```bash
# Upload file (Laborant)
POST /medical-files
FormData: { patientId, testName, testDate, file, description }

# Get my files (Patient)
GET /medical-files/my

# Get patient files (Doctor/Admin)
GET /medical-files/patient/:patientId

# Soft delete
DELETE /medical-files/:id
```

### Personnel (Admin)
```bash
# List all
GET /personnel

# Create
POST /personnel
Body: { firstName, lastName, tckn, role, email, phoneNumber, password, specialization }

# Update
PUT /personnel/:id

# Delete
DELETE /personnel/:id
```

### Leave Requests
```bash
# List requests
GET /leave-requests

# Create (Doctor)
POST /leave-requests
Body: { personnelId, startDate, startTime, endDate, endTime, reason }

# Update status (Admin)
PUT /leave-requests/:id/status
Body: { status: "APPROVED" }
```

---

## 🗄️ Database Schema

### Core Models
- **User** - Base user (TCKN, email, password, role)
- **Patient** - Patient profile (address, emergency contact, blood type)
- **Doctor** - Doctor profile (specialization)
- **Admin** - Admin profile
- **Laborant** - Lab technician profile
- **Appointment** - Booking records
- **LeaveRequest** - Doctor time-off
- **MedicalFile** - Lab results (soft delete enabled)
- **ContactIssue** - Patient inquiries

### Key Features
- One-to-one user relationships
- Soft delete on medical files (`deletedAt`)
- Email verification tokens
- Password reset tokens (1-hour expiry)

---

## 📁 Project Structure

```
agilion-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── api/
│   │   ├── controllers/       # Route handlers
│   │   ├── middlewares/       # Auth, validation, errors
│   │   ├── routes/            # API routes
│   │   └── validations/       # Joi schemas
│   ├── config/
│   │   └── constants.js       # App configuration
│   ├── repositories/          # Database queries
│   ├── services/              # Business logic
│   └── utils/                 # Utilities
│       ├── idValidator.js
│       ├── responseFormatter.js
│       ├── logger.js
│       ├── passwordHelper.js
│       └── tokenHelper.js
├── uploads/                   # Medical files storage
├── scripts/
│   └── bootstrapAdmin.js      # Create initial admin
├── docker-compose.yml
└── package.json
```

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_db"

# JWT
JWT_SECRET="your-secret-key-here"

# Server
PORT=5000

# Email (Gmail)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:5173"

# Initial Admin
INITIAL_ADMIN_TCKN=99999999999
INITIAL_ADMIN_EMAIL=admin@agilion.local
INITIAL_ADMIN_PASSWORD=Admin123!
INITIAL_ADMIN_FIRSTNAME=Admin
INITIAL_ADMIN_LASTNAME=User
```

**Gmail Setup:**
1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `EMAIL_PASSWORD`

---

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:5000/api/v1/health

# Login as admin
curl -X POST http://localhost:5000/api/v1/auth/personnel/login \
  -H "Content-Type: application/json" \
  -d '{"tckn":"99999999999","password":"Admin123!"}'
```

### Test Flow: Password Reset
1. Register patient
2. Request reset: `POST /auth/request-password-reset`
3. Check email/console for token
4. Reset: `POST /auth/reset-password`
5. Login with new password

---

## 📚 Documentation

- **API Reference**: See endpoint examples above
- **Code Review**: See Remaining Tasks below for details
- **Utilities Guide**: Check `src/utils/` for helper functions

---

## ⚠️ Remaining Tasks

1. **Rotate Exposed Credentials**
   - Generate new JWT_SECRET: `openssl rand -base64 32`
   - Revoke Gmail password, generate new
   - Update .env file

2. **Rate Limiting** (`npm install express-rate-limit`)
   - /auth/login: 5 attempts per 15 min
   - /auth/register: 3 attempts per hour

3. **Fix Appointment Race Condition**
   - Add unique constraint on (doctorId, date, time)
   - Wrap creation in Prisma transaction

4. **Enhancements**
- Pagination support (patients, personnel, appointments)
- Unit tests for utilities
- API documentation (Swagger)
- Winston logger upgrade

---

## 🛡️ Security Features

- ✅ JWT token authentication
- ✅ Bcrypt password hashing (12 rounds)
- ✅ ID validation (prevents NaN injection)
- ✅ Role-based access control
- ✅ Secure token generation (crypto)
- ✅ Email verification
- ✅ Rate limiting ready (not yet implemented)

---

## 🚧 Production Checklist

Before deploying:
- [ ] Rotate `JWT_SECRET` - Generate: `openssl rand -base64 32`
- [ ] Update `EMAIL_PASSWORD` with production credentials
- [ ] Add rate limiting to auth endpoints
- [ ] Enable HTTPS
- [ ] Configure CORS for production frontend URL
- [ ] Set up proper logging (consider Winston)
- [ ] Add database backups
- [ ] Review `.gitignore` - ensure `.env` is excluded

---

## 👥 Backend Team

- **Griffinxd** - Yunus Emre Manav
- **Pikseel** - Mehmet Akif Çavuş
- **Linaruu** - Uğur Anıl Güney

---

## 📝 License

Private - Agilion MedComm © 2025
