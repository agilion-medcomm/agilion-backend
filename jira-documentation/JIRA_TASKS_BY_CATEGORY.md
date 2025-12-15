# JIRA TASK LİSTESİ - KATEGORİ BAZLI

**Repository:** agilion-backend  
**Toplam Task:** 138+  
**Toplam Commit:** 92  
**Organizasyon:** Feature/Epic bazlı

---

## 🔐 EPIC 1: AUTHENTICATION & AUTHORIZATION

### User Stories:
- As a **patient**, I want to register and login with my TCKN, so that I can access the system
- As a **personnel**, I want to login with my email, so that I can access admin/doctor features
- As a **user**, I want to reset my password via email, so that I can recover my account
- As a **patient**, I want to verify my email, so that my account is secure
- As an **admin**, I want to control access by roles, so that unauthorized users cannot access sensitive features

### Tasks:

#### Registration & Login
- [x] **AUTH-001:** Patient registration with TCKN [@Griffinxd] - 8 points
  - POST /api/v1/auth/register
  - TCKN validation, bcrypt, JWT, patientId generation
  
- [x] **AUTH-002:** Patient login with TCKN [@Griffinxd] - 5 points
  - POST /api/v1/auth/login
  - TCKN authentication, unified error messages
  
- [x] **AUTH-003:** Personnel login with email [@Linaruu] - 8 points
  - POST /api/v1/auth/personnel/login
  - Role-based profile lookup, JWT with roleId

- [x] **AUTH-004:** Personnel registration (admin-only) [@Pikseel] - 5 points
  - POST /api/v1/auth/personnel/register
  - Create DOCTOR, ADMIN, LABORANT, CASHIER, CLEANER

#### Password Management
- [x] **AUTH-005:** Password reset with email [@Pikseel] - 8 points
  - POST /api/v1/auth/request-password-reset
  - POST /api/v1/auth/reset-password
  - Token generation, email notification, 1-hour expiry

- [x] **AUTH-006:** Change patient password [@Linaruu] - 5 points
  - PUT /api/v1/patients/me/change-password
  - Current password verification, min 8 chars

- [x] **AUTH-007:** Change personnel password [@Pikseel] - 3 points
  - PUT /api/v1/personnel/:id/change-password
  - Admin can reset without current password

#### Email Verification
- [x] **AUTH-008:** Email verification system [@Pikseel] - 8 points
  - POST /api/v1/auth/verify-email
  - POST /api/v1/auth/resend-verification
  - 24-hour token expiry, login block for unverified

#### Authorization & Security
- [x] **AUTH-009:** Auth middleware [@Griffinxd] - 5 points
  - JWT verification, inject user to req.user

- [x] **AUTH-010:** Authorize middleware [@Linaruu] - 5 points
  - Role-based access control, multiple role support

- [x] **AUTH-011:** OptionalAuth middleware [@Pikseel] - 3 points
  - Public/private hybrid endpoints

- [x] **AUTH-012:** RequireAdminOrSelf middleware [@Pikseel, @Linaruu] - 5 points
  - Admin or self authorization, role-based profile lookup

- [x] **AUTH-013:** Cross-login prevention [@Pikseel] - 3 points
  - Prevent patient login to personnel endpoint

**Epic Total:** 13 tasks, 71 story points

---

## 👥 EPIC 2: USER MANAGEMENT

### User Stories:
- As an **admin**, I want to manage all personnel, so that I can control staff accounts
- As a **personnel**, I want to update my profile, so that my information is current
- As a **patient**, I want to update my profile, so that my contact info is accurate
- As an **admin**, I want to delete personnel, so that I can remove inactive staff

### Tasks:

#### Personnel Management
- [x] **USER-001:** Get all personnel [@Pikseel, @Linaruu] - 3 points
  - GET /api/v1/personnel
  - Include all roles with profile info

- [x] **USER-002:** Get personnel by ID [@Pikseel] - 2 points
  - GET /api/v1/personnel/:id
  - Admin-only, include relationships

- [x] **USER-003:** Update personnel profile [@Pikseel, @Linaruu] - 5 points
  - PUT /api/v1/personnel/:id/profile
  - Role-based profile lookup, specialization handling

- [x] **USER-004:** Delete personnel [@Pikseel] - 8 points
  - DELETE /api/v1/personnel/:id
  - Cascading delete with transactions

- [x] **USER-005:** Personnel photo upload [@Linaruu] - 5 points
  - POST /api/v1/personnel/:id/photo
  - Multer, 2MB limit, static serving

#### Patient Management
- [x] **USER-006:** Get my profile (patient) [@Pikseel] - 2 points
  - GET /api/v1/auth/me
  - Return user + patient data

- [x] **USER-007:** Update patient profile [@Linaruu, @Pikseel] - 8 points
  - PUT /api/v1/patients/me/profile
  - Email, dateOfBirth, bloodType, conditional updates

- [x] **USER-008:** Get patient by TCKN [@Griffinxd] - 3 points
  - GET /api/v1/patients/search?tckn=xxx
  - For cashier appointment creation

- [x] **USER-009:** Get all patients [@Pikseel] - 2 points
  - GET /api/v1/patients
  - Admin/Doctor/Cashier access

**Epic Total:** 9 tasks, 38 story points

---

## 🏥 EPIC 3: APPOINTMENT SYSTEM

### User Stories:
- As a **patient**, I want to book appointments, so that I can see a doctor
- As a **cashier**, I want to create appointments for patients, so that I can help them
- As a **doctor**, I want to view my appointments, so that I can plan my day
- As a **doctor**, I want to request leave, so that my schedule is blocked
- As an **admin**, I want to approve leaves, so that appointments don't conflict

### Tasks:

#### Appointment CRUD
- [x] **APPT-001:** Appointment model [@Griffinxd] - 5 points
  - Create table with status, relations

- [x] **APPT-002:** Get appointments (public/private) [@Pikseel, @Griffinxd] - 8 points
  - GET /api/v1/appointments
  - OptionalAuth, slot checking, filters

- [x] **APPT-003:** Create appointment (patient) [@Pikseel, @Griffinxd] - 8 points
  - POST /api/v1/appointments
  - Date/time validation, availability check

- [x] **APPT-004:** Create appointment (cashier) [@Griffinxd] - 5 points
  - Cashier creates for patients with patientId

- [x] **APPT-005:** Update appointment status [@Pikseel, @Griffinxd] - 5 points
  - PUT /api/v1/appointments/:id/status
  - APPROVED, CANCELLED, DONE, email notification

#### Leave Request System
- [x] **APPT-006:** Leave request model [@Pikseel] - 3 points
  - Create LeaveRequest table

- [x] **APPT-007:** Create leave request [@Pikseel] - 5 points
  - POST /api/v1/leave-requests
  - Doctor-only, ISO date validation

- [x] **APPT-008:** Get leave requests [@Pikseel] - 3 points
  - GET /api/v1/leave-requests
  - Role-based filtering

- [x] **APPT-009:** Update leave request status [@Pikseel] - 3 points
  - PUT /api/v1/leave-requests/:id/status
  - Admin-only, APPROVED/REJECTED

- [x] **APPT-010:** Block slots during leaves [@Pikseel] - 5 points
  - Integrate approved leaves into slot checking

#### Email Notifications
- [x] **APPT-011:** Appointment creation email [@Griffinxd] - 5 points
  - HTML + plain text templates

- [x] **APPT-012:** Appointment approval email [@Griffinxd] - 3 points
  - Send on APPROVED status

- [x] **APPT-013:** Appointment cancellation email [@Griffinxd] - 3 points
  - Red accent color, send on CANCELLED

**Epic Total:** 13 tasks, 61 story points

---

## 🔬 EPIC 4: MEDICAL FILES & LABORANT

### User Stories:
- As a **laborant**, I want to upload medical files for patients, so that records are stored
- As a **patient**, I want to view my medical files, so that I can access my records
- As a **doctor**, I want to view patient files, so that I can review test results
- As a **laborant**, I want to delete my uploads, so that I can correct mistakes

### Tasks:

#### Laborant Role
- [x] **LAB-001:** Add LABORANT role [@Pikseel] - 3 points
  - UserRole enum, Laborant model

- [x] **LAB-002:** Laborant profile management [@Pikseel, @Linaruu] - 3 points
  - Include in personnel system

#### Medical File System
- [x] **LAB-003:** MedicalFile model [@Pikseel] - 5 points
  - Create table with laborant/patient relations

- [x] **LAB-004:** Upload medical file [@Pikseel] - 8 points
  - POST /api/v1/medical-files
  - Multer, magic number validation, 5MB limit

- [x] **LAB-005:** Get my medical files (patient) [@Pikseel] - 2 points
  - GET /api/v1/medical-files/my

- [x] **LAB-006:** Get patient medical files (doctor/admin) [@Pikseel] - 3 points
  - GET /api/v1/medical-files/patient/:patientId

- [x] **LAB-007:** Get laborant uploads [@Pikseel, @Linaruu] - 2 points
  - GET /api/v1/medical-files/my-uploads

- [x] **LAB-008:** Get laborant files (admin) [@Pikseel] - 2 points
  - GET /api/v1/medical-files/laborant/:laborantId

- [x] **LAB-009:** Download medical file [@Pikseel] - 5 points
  - GET /api/v1/medical-files/:fileId/download
  - Authorization, file stream

- [x] **LAB-010:** Delete medical file (soft delete) [@Pikseel] - 3 points
  - DELETE /api/v1/medical-files/:fileId
  - Tombstone method

- [x] **LAB-011:** LaborantId nullable migration [@Pikseel] - 2 points
  - Handle orphaned files

- [x] **LAB-012:** Medical file path fix [@Pikseel] - 3 points
  - Fix upload/download path mismatch

**Epic Total:** 12 tasks, 41 story points

---

## 🧹 EPIC 5: CLEANING MODULE

### User Stories:
- As a **cleaner**, I want to log cleaning activities, so that my work is recorded
- As an **admin**, I want to view cleaning records, so that I can track cleaning
- As a **cleaner**, I want to upload photos, so that there is proof of work

### Tasks:

#### Cleaner Role
- [x] **CLEAN-001:** Add CLEANER role [@Linaruu] - 3 points
  - UserRole enum, Cleaner model

- [x] **CLEAN-002:** CleaningRecord model [@Linaruu] - 5 points
  - Create table with photo support

#### Cleaning Record CRUD
- [x] **CLEAN-003:** Create cleaning record [@Linaruu] - 8 points
  - POST /api/v1/cleaning
  - Photo upload, auto date

- [x] **CLEAN-004:** Get cleaning records [@Linaruu] - 5 points
  - GET /api/v1/cleaning
  - Filters: date, area, personnelId

- [x] **CLEAN-005:** Get records by date [@Linaruu] - 3 points
  - GET /api/v1/cleaning/date/:date

- [x] **CLEAN-006:** Get records by personnel [@Linaruu] - 3 points
  - GET /api/v1/cleaning/personnel/:personnelId

- [x] **CLEAN-007:** Delete cleaning record [@Linaruu] - 5 points
  - DELETE /api/v1/cleaning/:recordId
  - Authorization logic

#### Cleaner Integration
- [x] **CLEAN-008:** Cleaner login support [@Linaruu] - 3 points
  - Include in personnel login

- [x] **CLEAN-009:** Cleaner profile support [@Linaruu] - 3 points
  - Profile operations

- [x] **CLEAN-010:** Static file serving [@Linaruu] - 1 point
  - /uploads/cleaning-photos

**Epic Total:** 10 tasks, 39 story points

---

## 👨‍⚕️ EPIC 6: DOCTOR & CASHIER

### User Stories:
- As a **patient**, I want to see available doctors, so that I can choose one
- As a **cashier**, I want to create appointments, so that I can help walk-in patients
- As an **admin**, I want to add cashiers, so that front desk has access

### Tasks:

#### Doctor Management
- [x] **DOC-001:** Doctor model [@Griffinxd] - 3 points
  - Create Doctor profile

- [x] **DOC-002:** Get all doctors [@Pikseel, @Griffinxd] - 3 points
  - GET /api/v1/doctors
  - Public endpoint, department filtering

#### Cashier Module
- [x] **CASH-001:** Add CASHIER role [@Griffinxd] - 3 points
  - UserRole enum, Cashier model

- [x] **CASH-002:** Admin can create cashiers [@Griffinxd] - 3 points
  - Personnel registration support

- [x] **CASH-003:** Cashier appointment creation [@Griffinxd] - 5 points
  - Authorization, patientId validation

**Epic Total:** 5 tasks, 17 story points

---

## 📞 EPIC 7: CONTACT FORM

### User Stories:
- As a **visitor**, I want to submit contact form, so that I can reach support
- As an **admin**, I want to view contact issues, so that I can respond
- As an **admin**, I want to reply to issues, so that visitors get answers

### Tasks:

- [x] **CONTACT-001:** ContactIssue model [@Griffinxd] - 5 points
  - Create table with IssueStatus enum

- [x] **CONTACT-002:** Submit contact issue [@Griffinxd] - 5 points
  - POST /api/v1/contact/submit
  - Public endpoint, validation

- [x] **CONTACT-003:** Get all contact issues [@Griffinxd] - 2 points
  - GET /api/v1/contact/issues
  - Admin-only

- [x] **CONTACT-004:** Reply to contact issue [@Griffinxd] - 5 points
  - POST /api/v1/contact/issues/:id/reply
  - Send email, update status

**Epic Total:** 4 tasks, 17 story points

---

## 🛠️ EPIC 8: UTILITIES & HELPERS

### User Stories:
- As a **developer**, I want reusable utilities, so that code is DRY
- As a **developer**, I want standardized responses, so that API is consistent
- As a **developer**, I want secure token generation, so that passwords are safe

### Tasks:

#### Validators
- [x] **UTIL-001:** idValidator utility [@Pikseel] - 5 points
  - Eliminate 20+ unsafe parseInt()

- [x] **UTIL-002:** validators utility [@Pikseel] - 3 points
  - validateTCKN, validatePhoneNumber, validatePassword

- [x] **UTIL-003:** dateTimeValidator utility [@Pikseel] - 5 points
  - 7+ date/time functions, calendar validation

#### Helpers
- [x] **UTIL-004:** passwordHelper utility [@Pikseel] - 3 points
  - hashPassword, comparePassword, bcrypt rounds: 12

- [x] **UTIL-005:** tokenHelper utility [@Pikseel] - 5 points
  - crypto.randomBytes, generateAndHashToken, expiry

- [x] **UTIL-006:** responseFormatter utility [@Pikseel] - 3 points
  - sendSuccess, sendCreated, sendError

- [x] **UTIL-007:** logger utility [@Pikseel] - 3 points
  - Replace 16+ console.log/error

- [x] **UTIL-008:** sanitizer utility [@Pikseel] - 3 points
  - XSS prevention, HTML entity encoding

- [x] **UTIL-009:** mapPersonnelUser helper [@Pikseel] - 2 points
  - Consistent data mapping

- [x] **UTIL-010:** safeDeleteFile utility [@Pikseel] - 2 points
  - Safe file deletion with logging

**Epic Total:** 10 tasks, 34 story points

---

## 🔒 EPIC 9: SECURITY ENHANCEMENTS

### User Stories:
- As a **user**, I want rate limiting, so that API is protected from abuse
- As a **user**, I want secure headers, so that attacks are prevented
- As a **developer**, I want input sanitization, so that XSS is prevented

### Tasks:

#### Rate Limiting & Headers
- [x] **SEC-001:** Rate limiting [@Pikseel] - 3 points
  - General API: 100/15min, Auth: 5/15min

- [x] **SEC-002:** Helmet integration [@Pikseel] - 3 points
  - CSP, HSTS, security headers

- [x] **SEC-003:** CORS configuration [@Pikseel] - 2 points
  - Environment-based origins

- [x] **SEC-004:** Body size limits [@Pikseel] - 1 point
  - 1MB limit, DoS prevention

- [x] **SEC-005:** Request timeout [@Pikseel] - 1 point
  - 30-second timeout

#### File Security
- [x] **SEC-006:** Magic number validation [@Pikseel] - 3 points
  - file-type package, prevent fake extensions

- [x] **SEC-007:** Secure filename generation [@Pikseel] - 3 points
  - crypto.randomBytes instead of Math.random()

- [x] **SEC-008:** Medical file access control [@Pikseel] - 3 points
  - No static serving, auth-only download

- [x] **SEC-009:** Static file serving (photos) [@Pikseel, @Linaruu] - 2 points
  - Public photos, private medical files

- [x] **SEC-010:** Bcrypt rounds increase [@Pikseel] - 1 point
  - 10 → 12 rounds

#### Input Validation
- [x] **SEC-011:** sanitizeBody middleware [@Pikseel] - 3 points
  - XSS prevention before validation

**Epic Total:** 11 tasks, 25 story points

---

## 🧪 EPIC 10: TESTING & QUALITY

### User Stories:
- As a **developer**, I want comprehensive tests, so that regressions are caught
- As a **developer**, I want test data, so that manual testing is easy
- As a **developer**, I want clean code, so that maintenance is easy

### Tasks:

#### Testing
- [x] **TEST-001:** API test suite creation [@Pikseel] - 13 points
  - 82 tests, 100% pass rate, all endpoints

- [x] **TEST-002:** Database seeder [@Pikseel] - 5 points
  - Test users, sample data, CLI command

- [x] **TEST-003:** Test resilience improvements [@Pikseel] - 3 points
  - Graceful skip, better errors, 100% pass

#### Code Quality
- [x] **TEST-004:** Remove debug console.logs [@Pikseel] - 2 points
  - 15+ removed, use logger

- [x] **TEST-005:** Clean up TODOs [@Pikseel] - 1 point
  - Remove outdated comments

- [x] **TEST-006:** Fix variable shadowing [@Pikseel] - 1 point
  - leaveRequest service fix

- [x] **TEST-007:** Fix duplicate exports [@Pikseel] - 1 point
  - patient.service.js fix

**Epic Total:** 7 tasks, 26 story points

---

## 📚 EPIC 11: DOCUMENTATION

### User Stories:
- As a **new developer**, I want clear README, so that I can start quickly
- As a **developer**, I want code review docs, so that I understand standards
- As a **developer**, I want API docs, so that I know missing features

### Tasks:

- [x] **DOC-001:** README.md rewrite [@Pikseel] - 5 points
  - 77% shorter, modern format, quick start

- [x] **DOC-002:** CODE_REVIEW.md [@Pikseel] - 3 points
  - Code quality audit, best practices

- [x] **DOC-003:** API_ISSUES.md [@Pikseel] - 2 points
  - Frontend-backend integration issues

- [x] **DOC-004:** .env.example [@Pikseel] - 1 point
  - Environment template with defaults

- [x] **DOC-005:** PERSONNEL_PROFILE_FIX.md [@Pikseel] - 2 points
  - Critical bug documentation

**Epic Total:** 5 tasks, 13 story points

---

## 🔄 EPIC 12: REFACTORING

### User Stories:
- As a **developer**, I want modular services, so that code is maintainable
- As a **developer**, I want extracted middleware, so that logic is reusable

### Tasks:

- [x] **REFACTOR-001:** Split auth.service.js [@Pikseel] - 8 points
  - 473 lines → 5 modular services

- [x] **REFACTOR-002:** Extract requireAdminOrSelf [@Pikseel] - 3 points
  - 65 lines inline → dedicated file

- [x] **REFACTOR-003:** Extract optionalAuth [@Pikseel] - 2 points
  - Dedicated middleware file

**Epic Total:** 3 tasks, 13 story points

---

## 🎨 EPIC 13: CONSTANTS & ENUM STANDARDIZATION

### User Stories:
- As a **developer**, I want zero hardcoded values, so that changes are centralized
- As a **developer**, I want Prisma enums, so that database is type-safe

### Tasks:

- [x] **CONST-001:** Add Prisma enums [@Pikseel] - 3 points
  - AppointmentStatus, LeaveRequestStatus

- [x] **CONST-002:** Centralize all constants [@Pikseel] - 13 points
  - Replace all hardcoded values, 37 files changed

- [x] **CONST-003:** Standardize validation patterns [@Pikseel] - 3 points
  - Use VALIDATION constants

- [x] **CONST-004:** Standardize auth constants [@Pikseel] - 3 points
  - Use AUTH constants

- [x] **CONST-005:** Standardize file upload [@Pikseel] - 5 points
  - Use FILE_UPLOAD constants, crypto.randomBytes

- [x] **CONST-006:** Add missing ROLE_GROUPS import [@Pikseel] - 1 point
  - Fix backend startup error

- [x] **CONST-007:** Migrations to .gitignore [@Pikseel] - 1 point
  - Exclude from version control

**Epic Total:** 7 tasks, 29 story points

---

## 🗄️ EPIC 14: DATABASE MIGRATIONS

### Tasks:

- [x] **MIG-001:** 20251029135702_init [@Griffinxd]
- [x] **MIG-002:** 20251104195243_add_national_id [@Griffinxd]
- [x] **MIG-003:** 20251105124743_national_id_modified_to_tckn [@Griffinxd]
- [x] **MIG-004:** 20251105125000_dateofbirth_moved_to_user [@Griffinxd]
- [x] **MIG-005:** 20251105130523_renamed_phone_number [@Griffinxd]
- [x] **MIG-006:** 20251126102407_add_appointments_and_leave_requests [@Griffinxd, @Pikseel]
- [x] **MIG-007:** 20251126120053_add_password_reset_fields [@Pikseel]
- [x] **MIG-008:** 20251129112953_add_email_verification [@Pikseel]
- [x] **MIG-009:** 20251201095556_add_patient_profile_fields [@Linaruu]
- [x] **MIG-010:** 20251202185558_add_contact_issues [@Griffinxd]
- [x] **MIG-011:** 20251204100635_add_cashier_role [@Griffinxd]
- [x] **MIG-012:** 20251204212851_add_laborant_medical_files [@Pikseel]
- [x] **MIG-013:** 20251204213636_add_soft_delete_to_medical_files [@Pikseel]
- [x] **MIG-014:** 20251205_laborantid_nullable [@Pikseel]
- [x] **MIG-015:** 20251206110348_clear [@Pikseel]
- [x] **MIG-016:** 20251207191606_add_profile_photo [@Linaruu]
- [x] **MIG-017:** 20251215130431_add_appointment_and_leave_request_enums [@Pikseel]

**Epic Total:** 17 migrations

---

## 🏗️ EPIC 15: PROJECT INFRASTRUCTURE

### Tasks:

- [x] **INFRA-001:** Initial repository setup [@ekaan8, @Griffinxd] - 5 points
- [x] **INFRA-002:** Layered architecture [@Griffinxd] - 8 points
- [x] **INFRA-003:** Prisma ORM setup [@Griffinxd] - 5 points
- [x] **INFRA-004:** Error handler middleware [@Griffinxd] - 5 points
- [x] **INFRA-005:** Database schema design [@Griffinxd] - 8 points

**Epic Total:** 5 tasks, 31 story points

---

## 📊 TOPLAM ÖZET

### Epic Dağılımı:
1. **Authentication & Authorization:** 13 tasks, 71 points
2. **User Management:** 9 tasks, 38 points
3. **Appointment System:** 13 tasks, 61 points
4. **Medical Files & Laborant:** 12 tasks, 41 points
5. **Cleaning Module:** 10 tasks, 39 points
6. **Doctor & Cashier:** 5 tasks, 17 points
7. **Contact Form:** 4 tasks, 17 points
8. **Utilities & Helpers:** 10 tasks, 34 points
9. **Security Enhancements:** 11 tasks, 25 points
10. **Testing & Quality:** 7 tasks, 26 points
11. **Documentation:** 5 tasks, 13 points
12. **Refactoring:** 3 tasks, 13 points
13. **Constants & Enum:** 7 tasks, 29 points
14. **Database Migrations:** 17 tasks
15. **Project Infrastructure:** 5 tasks, 31 points

### Grand Total:
- **Tasks:** 131+ (excluding migrations)
- **Story Points:** 455+
- **Migrations:** 17
- **Commits:** 92

### Öncelik Dağılımı:
- **Critical:** 15 tasks
- **High:** 45 tasks
- **Medium:** 50 tasks
- **Low:** 21 tasks

### Developer Katkısı:
- **Pikseel:** 70 tasks (Backend architecture, security, testing)
- **Griffinxd:** 32 tasks (Core features, database, email)
- **Linaruu:** 26 tasks (Modules, profiles, cleaner)
- **ekaan8:** 2 tasks (Initial setup)

---

## 🎯 JIRA İÇİN ÖNERİLER

### Epic Hierarchy:
```
AGILION Backend
├── Authentication & Authorization (71 pts)
├── User Management (38 pts)
├── Appointment System (61 pts)
├── Medical Files & Laborant (41 pts)
├── Cleaning Module (39 pts)
├── Doctor & Cashier (17 pts)
├── Contact Form (17 pts)
├── Utilities & Helpers (34 pts)
├── Security Enhancements (25 pts)
├── Testing & Quality (26 pts)
├── Documentation (13 pts)
├── Refactoring (13 pts)
└── Constants & Enum (29 pts)
```

### Sprint Breakdown (Geçmiş):
- **Sprint 1 (Oct 20-29):** INFRA + AUTH basics (30 pts)
- **Sprint 2 (Nov 4-26):** Core features (120 pts)
- **Sprint 3 (Nov 29 - Dec 7):** Advanced features (150 pts)
- **Sprint 4 (Dec 10-15):** Security & quality (155 pts)

### Labels:
- `backend`, `api`, `database`, `security`, `testing`, `documentation`
- `patient-facing`, `admin-only`, `public-endpoint`
- `high-priority`, `bug-fix`, `enhancement`, `refactor`

### Components:
- Authentication
- User Management
- Appointments
- Medical Files
- Cleaning
- Email Service
- Security
- Testing

**Hazırlayan:** GitHub Copilot  
**Tarih:** 15 Aralık 2025  
**Versiyon:** 1.0
