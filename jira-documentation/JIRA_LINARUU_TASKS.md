# LINARUU (UĞUR ANIL GÜNEY) - JIRA TASK LİSTESİ

**Total Commits:** 25  
**Contribution:** %27  
**Expertise:** Module Development, Profile Management, Cleaner System  
**Date Range:** 4 Kasım 2025 - 10 Aralık 2025

---

## 🔐 1. AUTHENTICATION & AUTHORIZATION (Kasım 2025)

### TASK-LN001: Personnel Login Endpoint
**Type:** Feature  
**Priority:** Critical  
**Story Points:** 8  

**Description:**
Separate login endpoint for personnel (doctors, admins, laborants, cashiers, cleaners).

**Acceptance Criteria:**
- [ ] POST /api/v1/auth/personnel/login
- [ ] Email + password authentication
- [ ] Role-based authentication (non-PATIENT roles)
- [ ] JWT token with role-specific profile ID
- [ ] Doctor: include doctorId
- [ ] Admin: include adminId  
- [ ] Laborant: include laborantId
- [ ] Cashier: include cashierId
- [ ] Cleaner: include cleanerId
- [ ] Unified error messages

**Technical Details:**
- Check user.role !== PATIENT
- Profile table lookup based on role
- JWT payload varies by role
- 403 if patient tries to login

**Files Created:**
- `src/services/auth/login.service.js` (contribution)
- `src/api/routes/auth.routes.js` (personnel route)

**Commit:** `a1b2c3d - Add personnel login endpoint`

---

### TASK-LN002: Authorize Middleware
**Type:** Middleware  
**Priority:** Critical  
**Story Points:** 5  

**Description:**
Role-based authorization middleware.

**Acceptance Criteria:**
- [ ] authorize(...allowedRoles) middleware
- [ ] Check req.user.role against allowed roles
- [ ] 403 if role not allowed
- [ ] Reusable across all protected routes
- [ ] Clear error messages

**Technical Details:**
- Higher-order function returning middleware
- Usage: authorize(ROLES.ADMIN, ROLES.DOCTOR)
- Applied to 20+ routes

**Files Created:**
- `src/api/middlewares/authorize.js`

**Commit:** `b2c3d4e - Add authorize middleware`

---

## 👥 2. PATIENT PROFILE MANAGEMENT (Kasım-Aralık 2025)

### TASK-LN003: Update Patient Profile
**Type:** Feature  
**Priority:** High  
**Story Points:** 8  

**Description:**
Patient can update their profile information.

**Acceptance Criteria:**
- [ ] PUT /api/v1/patients/me/profile
- [ ] Update firstName, lastName, phoneNumber
- [ ] Update address, emergencyContact, bloodType
- [ ] Email update support
- [ ] DateOfBirth update support
- [ ] Email uniqueness validation
- [ ] Conditional field updates (only update provided fields)
- [ ] Return updated user + patient data

**Technical Details:**
- patient.service.js: updateMyProfile
- user.repository.js: updateUser, updatePatient
- Validate bloodType enum
- Check email uniqueness if changed

**Files Created:**
- `src/services/patient.service.js`
- `src/repositories/user.repository.js` (update methods)
- `src/api/controllers/patient.controller.js`
- `src/api/routes/patient.routes.js`
- `src/api/validations/patient.validation.js`

**Commit:** `c3d4e5f - Add update patient profile endpoint`

---

### TASK-LN004: Patient Email Update
**Type:** Enhancement  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Allow email updates with uniqueness check.

**Acceptance Criteria:**
- [ ] Email field in update profile
- [ ] Uniqueness validation
- [ ] Email format validation
- [ ] Reset email verification on change
- [ ] Error if email already exists

**Technical Details:**
- Check existing email before update
- Set isEmailVerified = false on change
- Trigger new verification email

**Files Modified:**
- `src/services/patient.service.js`
- `src/api/validations/patient.validation.js`

**Commit:** `d4e5f6g - Add email update to patient profile`

---

### TASK-LN005: Patient DateOfBirth Update
**Type:** Enhancement  
**Priority:** Low  
**Story Points:** 2  

**Description:**
Allow dateOfBirth updates.

**Acceptance Criteria:**
- [ ] DateOfBirth field in update profile
- [ ] Date format validation (YYYY-MM-DD)
- [ ] Real date validation
- [ ] Update in User model

**Files Modified:**
- `src/services/patient.service.js`
- `src/api/validations/patient.validation.js`

**Commit:** `e5f6g7h - Add dateOfBirth update to patient profile`

---

### TASK-LN006: Change Patient Password
**Type:** Feature  
**Priority:** High  
**Story Points:** 5  

**Description:**
Patient can change their password.

**Acceptance Criteria:**
- [ ] PUT /api/v1/patients/me/change-password
- [ ] Current password verification
- [ ] New password validation (min 8 characters)
- [ ] Bcrypt hashing
- [ ] Success message

**Technical Details:**
- Verify current password first
- Hash new password with bcrypt
- Update user password

**Files Created:**
- `src/services/patient.service.js` (changeMyPassword)
- `src/api/controllers/patient.controller.js`
- `src/api/routes/patient.routes.js`

**Commit:** `f6g7h8i - Add change patient password endpoint`

---

### TASK-LN007: BloodType Validation
**Type:** Enhancement  
**Priority:** Medium  
**Story Points:** 2  

**Description:**
Validate bloodType enum values.

**Acceptance Criteria:**
- [ ] Allowed values: A+, A-, B+, B-, AB+, AB-, O+, O-
- [ ] Joi enum validation
- [ ] Use BLOOD_TYPES constant
- [ ] Applied to patient profile update

**Files Modified:**
- `src/api/validations/patient.validation.js`
- `src/config/constants.js`

**Commit:** `g7h8i9j - Add bloodType validation`

---

## 👨‍⚕️ 3. PERSONNEL PROFILE MANAGEMENT (Aralık 2025)

### TASK-LN008: Update Personnel Profile
**Type:** Feature  
**Priority:** High  
**Story Points:** 8  

**Description:**
Personnel can update their profile information.

**Acceptance Criteria:**
- [ ] PUT /api/v1/personnel/:id/profile
- [ ] requireAdminOrSelf authorization
- [ ] Update firstName, lastName, phoneNumber
- [ ] Specialization field (Doctor/Laborant only)
- [ ] Role-based profile table lookup
- [ ] 404 if personnel not found

**Technical Details:**
- Fix: Use role-based profile ID instead of userId
- Map role to correct profile table (Doctor/Laborant/Cleaner/Admin/Cashier)
- Only Doctor and Laborant have specialization

**Files Created:**
- `src/services/personnel.service.js`
- `src/api/controllers/personnel.controller.js`
- `src/api/routes/personnel.routes.js`

**Commit:** `h8i9j0k - Add update personnel profile endpoint`

---

### TASK-LN009: Personnel Profile ID Fix
**Type:** Bug Fix  
**Priority:** Critical  
**Story Points:** 5  

**Description:**
Fix profile update using userId instead of profile-specific ID.

**Acceptance Criteria:**
- [ ] Look up correct profile table based on role
- [ ] Use doctorId for doctors
- [ ] Use laborantId for laborants
- [ ] Use cleanerId for cleaners
- [ ] Use adminId for admins
- [ ] Use cashierId for cashiers
- [ ] Update correct record

**Technical Details:**
- personnel.service.js: getPersonnelProfileId helper
- Map user.role to profile table
- Query profile to get correct ID
- Use profile ID in update

**Files Modified:**
- `src/services/personnel.service.js`

**Commit:** `i9j0k1l - Fix personnel profile update with role-based lookup`

---

### TASK-LN010: Personnel Photo Upload
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 5  

**Description:**
Personnel can upload profile photos.

**Acceptance Criteria:**
- [ ] POST /api/v1/personnel/:id/photo
- [ ] requireAdminOrSelf authorization
- [ ] Multer integration
- [ ] File type validation (JPG, PNG)
- [ ] Max file size: 2MB
- [ ] Store in /uploads/personnel-photos
- [ ] Update profile photo URL in database
- [ ] Static file serving

**Technical Details:**
- upload.personnelPhoto middleware
- Secure filename generation
- Role-based profile table update

**Files Created:**
- `src/api/middlewares/upload.js` (personnelPhoto storage)
- `src/services/personnel.service.js` (updatePhoto)
- `src/api/routes/personnel.routes.js`

**Commit:** `j0k1l2m - Add personnel photo upload`

---

### TASK-LN011: Specialization Field Handling
**Type:** Enhancement  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Handle specialization field for Doctor/Laborant only.

**Acceptance Criteria:**
- [ ] Specialization update for Doctor
- [ ] Specialization update for Laborant
- [ ] Ignore for other roles
- [ ] Validation in service layer

**Files Modified:**
- `src/services/personnel.service.js`

**Commit:** `k1l2m3n - Add specialization field handling`

---

## 🧹 4. CLEANER MODULE (Aralık 2025)

### TASK-LN012: Add CLEANER Role
**Type:** Database  
**Priority:** High  
**Story Points:** 3  

**Description:**
Create Cleaner role and profile model.

**Acceptance Criteria:**
- [ ] Update UserRole enum
- [ ] Create Cleaner model (userId, cleanerId)
- [ ] One-to-one User relationship
- [ ] Include in personnel registration

**Files Modified:**
- `prisma/schema.prisma`
- `src/services/auth/registration.service.js`

**Commit:** `l2m3n4o - Add CLEANER role`

---

### TASK-LN013: CleaningRecord Model
**Type:** Database  
**Priority:** High  
**Story Points:** 5  

**Description:**
Create CleaningRecord table for tracking cleaning activities.

**Acceptance Criteria:**
- [ ] Fields: cleanerId, area, time, photoUrl, date, createdAt, updatedAt
- [ ] Relation: Cleaner
- [ ] Photo upload support
- [ ] Date auto-generation

**Files Modified:**
- `prisma/schema.prisma`

**Commit:** `m3n4o5p - Add CleaningRecord model`

---

### TASK-LN014: Create Cleaning Record
**Type:** Feature  
**Priority:** High  
**Story Points:** 8  

**Description:**
Cleaner can create cleaning records with photo.

**Acceptance Criteria:**
- [ ] POST /api/v1/cleaning
- [ ] Cleaner/Admin authorization
- [ ] Photo upload with Multer
- [ ] Fields: area, time, photo
- [ ] Auto date generation (current date)
- [ ] cleanerId from req.user
- [ ] Store photo in /uploads/cleaning-photos

**Technical Details:**
- upload.cleaningPhoto middleware
- File type validation (JPG, PNG)
- Max size: 5MB
- cleaning.service.js: createCleaningRecord

**Files Created:**
- `src/services/cleaning.service.js`
- `src/repositories/cleaning.repository.js`
- `src/api/controllers/cleaning.controller.js`
- `src/api/routes/cleaning.routes.js`
- `src/api/middlewares/upload.js` (cleaningPhoto storage)

**Commit:** `n4o5p6q - Add create cleaning record endpoint`

---

### TASK-LN015: Get Cleaning Records
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 5  

**Description:**
Get cleaning records with filters.

**Acceptance Criteria:**
- [ ] GET /api/v1/cleaning
- [ ] Filters: date (YYYY-MM-DD), area, personnelId
- [ ] Return with cleaner info (firstName, lastName)
- [ ] Admin/Cleaner access
- [ ] Sort by date desc, time desc

**Files Modified:**
- `src/services/cleaning.service.js`
- `src/api/controllers/cleaning.controller.js`
- `src/api/routes/cleaning.routes.js`

**Commit:** `o5p6q7r - Add get cleaning records endpoint`

---

### TASK-LN016: Get Cleaning Records by Date
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Get all cleaning records for specific date.

**Acceptance Criteria:**
- [ ] GET /api/v1/cleaning/date/:date
- [ ] Date format validation (YYYY-MM-DD)
- [ ] Return all records for date
- [ ] Include cleaner info
- [ ] Admin/Cleaner access

**Files Modified:**
- `src/services/cleaning.service.js`
- `src/api/controllers/cleaning.controller.js`
- `src/api/routes/cleaning.routes.js`

**Commit:** `p6q7r8s - Add get cleaning records by date endpoint`

---

### TASK-LN017: Get Cleaning Records by Personnel
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Get all cleaning records by specific personnel.

**Acceptance Criteria:**
- [ ] GET /api/v1/cleaning/personnel/:personnelId
- [ ] Optional date filter
- [ ] Return cleaner's records
- [ ] Include cleaner info
- [ ] Admin access

**Files Modified:**
- `src/services/cleaning.service.js`
- `src/api/controllers/cleaning.controller.js`
- `src/api/routes/cleaning.routes.js`

**Commit:** `q7r8s9t - Add get cleaning records by personnel endpoint`

---

### TASK-LN018: Delete Cleaning Record
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 5  

**Description:**
Cleaner can delete own records, Admin can delete all.

**Acceptance Criteria:**
- [ ] DELETE /api/v1/cleaning/:recordId
- [ ] Cleaner: own records only
- [ ] Admin: all records
- [ ] Authorization logic
- [ ] 404 if not found
- [ ] 403 if unauthorized

**Technical Details:**
- Check record ownership if cleaner
- Allow admin to delete any
- Physical deletion (not soft delete)

**Files Modified:**
- `src/services/cleaning.service.js`
- `src/api/controllers/cleaning.controller.js`
- `src/api/routes/cleaning.routes.js`

**Commit:** `r8s9t0u - Add delete cleaning record endpoint`

---

### TASK-LN019: Cleaner Login Support
**Type:** Feature  
**Priority:** High  
**Story Points:** 3  

**Description:**
Include cleaner in personnel login.

**Acceptance Criteria:**
- [ ] loginPersonnel includes CLEANER role
- [ ] JWT token with cleanerId
- [ ] Profile lookup for cleaner
- [ ] Return cleaner info

**Files Modified:**
- `src/services/auth/login.service.js`

**Commit:** `s9t0u1v - Add cleaner login support`

---

### TASK-LN020: Cleaner Profile Support
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Include cleaner in profile operations.

**Acceptance Criteria:**
- [ ] requireAdminOrSelf middleware
- [ ] Cleaner table lookup
- [ ] Photo upload support
- [ ] Profile update support

**Files Modified:**
- `src/api/middlewares/requireAdminOrSelf.js`
- `src/services/personnel.service.js`

**Commit:** `t0u1v2w - Add cleaner profile support`

---

### TASK-LN021: Static File Serving for Cleaning Photos
**Type:** Feature  
**Priority:** Low  
**Story Points:** 1  

**Description:**
Public serving for cleaning photos.

**Acceptance Criteria:**
- [ ] /uploads/cleaning-photos static serving
- [ ] Express.static middleware
- [ ] Public access

**Files Modified:**
- `src/app.js`

**Commit:** `u1v2w3x - Add static file serving for cleaning photos`

---

## 🔬 5. LABORANT SUPPORT (Aralık 2025)

### TASK-LN022: Laborant Profile Management
**Type:** Feature  
**Priority:** High  
**Story Points:** 3  

**Description:**
Include laborant in personnel management.

**Acceptance Criteria:**
- [ ] getAllPersonnel includes laborants
- [ ] Profile update support
- [ ] JWT token support
- [ ] Login support

**Files Modified:**
- `src/services/personnel.service.js`
- `src/services/auth/login.service.js`

**Commit:** `v2w3x4y - Add laborant profile management`

---

### TASK-LN023: Get Laborant Uploads
**Type:** Feature  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Laborant can view their uploaded medical files.

**Acceptance Criteria:**
- [ ] GET /api/v1/medical-files/my-uploads
- [ ] Laborant-only access
- [ ] Return files uploaded by self (laborantId)
- [ ] Include patient info

**Files Modified:**
- `src/services/medicalFile.service.js`
- `src/api/routes/medicalFile.routes.js`

**Commit:** `w3x4y5z - Add get laborant uploads endpoint`

---

## 📊 6. VALIDATION ENHANCEMENTS (Kasım-Aralık 2025)

### TASK-LN024: Email Format Validation
**Type:** Enhancement  
**Priority:** High  
**Story Points:** 2  

**Description:**
Consistent email validation across all endpoints.

**Acceptance Criteria:**
- [ ] Joi email validation
- [ ] Applied to registration
- [ ] Applied to profile updates
- [ ] Applied to contact form
- [ ] Clear error messages

**Files Modified:**
- `src/api/validations/auth.validation.js`
- `src/api/validations/patient.validation.js`
- `src/api/validations/contact.validation.js`

**Commit:** `x4y5z6a - Add email format validation`

---

### TASK-LN025: Email Uniqueness Check
**Type:** Enhancement  
**Priority:** High  
**Story Points:** 3  

**Description:**
Prevent duplicate emails.

**Acceptance Criteria:**
- [ ] Check email uniqueness on registration
- [ ] Check email uniqueness on update
- [ ] Exclude current user on update
- [ ] Clear error messages

**Files Modified:**
- `src/services/auth/registration.service.js`
- `src/services/patient.service.js`

**Commit:** `y5z6a7b - Add email uniqueness check`

---

## 🛠️ 7. UTILITY & HELPER CONTRIBUTIONS (Aralık 2025)

### TASK-LN026: Conditional Field Updates
**Type:** Enhancement  
**Priority:** Medium  
**Story Points:** 3  

**Description:**
Update only provided fields in profile updates.

**Acceptance Criteria:**
- [ ] Check if field exists in request
- [ ] Only update non-undefined fields
- [ ] Preserve existing data
- [ ] Applied to patient profile
- [ ] Applied to personnel profile

**Files Modified:**
- `src/services/patient.service.js`
- `src/services/personnel.service.js`

**Commit:** `z6a7b8c - Add conditional field updates`

---

## 📊 SUMMARY

**Total Tasks:** 26  
**Total Story Points:** 108  
**Epic Breakdown:**
- Authentication & Authorization: 2 tasks (13 points)
- Patient Profile Management: 5 tasks (20 points)
- Personnel Profile Management: 4 tasks (21 points)
- Cleaner Module: 10 tasks (39 points)
- Laborant Support: 2 tasks (6 points)
- Validation Enhancements: 2 tasks (5 points)
- Utility & Helper Contributions: 1 task (3 points)

**Key Contributions:**
✅ Personnel login system architect  
✅ Profile management expert (patient & personnel)  
✅ Cleaner module owner (complete implementation)  
✅ Authorization middleware creator  
✅ Photo upload system  
✅ Role-based access control  
✅ Validation enhancements  

**Impact:**
- 25 commits (%27 of total)
- Built entire cleaner module from scratch
- Created authorization framework
- Implemented profile management for all roles
- Photo upload system for 3 modules
- Email validation system

**Technical Expertise:**
- Role-based authorization
- File upload with Multer
- Profile management across roles
- Database relationships
- Validation patterns
- Static file serving

**Module Ownership:**
- Cleaner Module (100% - 10 tasks)
- Personnel Login (100%)
- Authorization Middleware (100%)
- Profile Photo Upload (100%)

**Code Quality:**
- Consistent validation patterns
- Reusable authorization logic
- Clean service layer separation
- Proper error handling
