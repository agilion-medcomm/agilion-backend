# API Issues & Known Bugs

**Document Created:** December 12, 2025  
**Last Test Run:** 100.0% Pass Rate (82/82 tests) ✅  
**Last Full Review:** December 12, 2025  
**Branch:** feat/codebaseImprovements

This document tracks API issues discovered during comprehensive testing and frontend-backend integration review. Each issue is categorized by severity and includes the root cause analysis and suggested fix.

---

## ✅ Resolved Issues

### 1. ~~Doctor Profile Not Linked to User After Login~~ [FIXED]
**Status:** ✅ RESOLVED  
**Resolution:** The issue was in the test logic, not the backend. The test was using `meData.data.id` (Doctor profile ID) instead of `meData.data.userId` (User table ID) when looking up the doctor in the `/api/doctors` response.

**Fix Applied:** Updated `scripts/testApi.js` line ~733 to use `userId` from the `/api/auth/me` response.

### 2. ~~Doctor Specialization Filter Not Working~~ [FIXED]
**Status:** ✅ RESOLVED  
**Resolution:** Changed controller to use `specialization` query param to match the data model field.

**Fix Applied:** Updated `src/api/controllers/doctor.controller.js` to accept `?specialization=` instead of `?department=`.

---

## 🔴 Critical Issues

**Status:** ✅ All critical backend issues resolved - 100% test pass rate

---

## 🟠 Medium Issues - Frontend-Backend Mismatch

### 1. Missing Notifications API
**Frontend Calls:** 
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/sent`
- `POST /api/v1/notifications`

**Status:** ❌ Backend endpoints NOT implemented  
**Affected Components:** `AdminNotificationSender.jsx`, `NotificationContext.jsx`, `NotificationBadge.jsx`

**Current State:** Frontend has TODO comments with mock data. The notification system UI is built but has no backend support.

**Impact:** Admins cannot send notifications, users cannot receive notifications.

**Suggested Fix:** Implement notification routes, controller, service, and Prisma model as per `front/API_CONTRACTS.md`.

---

### 2. Missing Lab Tests API
**Frontend Calls:**
- `GET /api/v1/lab-tests`
- `PUT /api/v1/lab-tests/:id/start`
- `PUT /api/v1/lab-tests/:id/results`

**Status:** ❌ Backend endpoints NOT implemented  
**Affected Components:** `LabTechDashboard.jsx`, `LabResultsPage.jsx`

**Current State:** Frontend uses mock data with TODO comments.

**Impact:** Lab technicians cannot manage tests, doctors cannot view lab results.

**Suggested Fix:** Implement lab test routes, controller, service, and Prisma model.

---

### 3. Missing Appointment Review Endpoint
**Frontend Calls:** `POST /api/v1/appointments/:id/review`

**Status:** ❌ Backend endpoint NOT implemented  
**Affected Component:** `PatientDashboard.jsx`

**Current State:** Frontend allows patients to rate appointments, but backend doesn't save the reviews.

**Impact:** Patient feedback system is non-functional.

**Suggested Fix:** Add review endpoint to appointment.routes.js or create separate review system.

---

## ✅ Security Review

### Backend Security ✅
- ✅ No SQL injection vulnerabilities (Prisma parameterized queries)
- ✅ No XSS vulnerabilities (input sanitization in place)
- ✅ Authentication properly secured (JWT verification)
- ✅ Authorization checks correct (role-based access control)
- ✅ File uploads secured (MIME + extension validation, cryptographic filenames)
- ✅ CORS properly configured
- ✅ No dangerous code patterns (eval, exec, etc.)
- ✅ Rate limiting configured
- ✅ Security headers (Helmet, CSP) enabled
- ✅ No raw SQL queries (only safe health check)

### Frontend Security ✅
- ✅ **FIXED:** Removed password logging from LoginPage.jsx
- ✅ Tokens stored in localStorage (acceptable for this use case)
- ✅ No sensitive data in console logs
- ✅ Proper token handling in API calls

---

## 🟡 Design Notes (Not Bugs)

### 1. Cleaning Record Requires Photo Upload
**Endpoint:** `POST /api/v1/cleaning`  
**Behavior:** Returns `400: Photo is required for cleaning record.`

**Note:** This is **correct behavior** - the API requires multipart/form-data with an image file. The test properly handles this by expecting a 400 response when sending JSON.

### 2. Contact Form Requires Phone Field
**Endpoint:** `POST /api/v1/contact`  
**Required Fields:** `name`, `email`, `phone`, `subject`, `message`

**Note:** The test now includes the `phone` field and passes.

---

## 📋 Test Suite Improvements Made

The test suite has been hardened to:
1. **Fail properly** when API returns errors (no more "error is acceptable" passes)
2. **Cascade failures** - if a create test fails, dependent tests (update/delete) fail explicitly
3. **Include all required fields** - contact form now sends phone
4. **Send proper payloads** - leave request now includes personnelId, startTime, endTime
5. **Fixed doctor profile lookup** - uses `userId` field correctly for matching

---

## 📊 Frontend-Backend Integration Summary

### ✅ Working Correctly
- ✅ Authentication (patient & personnel login)
- ✅ Patient registration & email verification
- ✅ Password reset flow
- ✅ Doctor listings with specialization filter
- ✅ Patient profile management
- ✅ Appointments (create, list, update status)
- ✅ Leave requests (create, list, update status)
- ✅ Personnel management (CRUD operations)
- ✅ Cleaning records
- ✅ Contact form submissions
- ✅ Medical file uploads/downloads

### ❌ Frontend Features WITHOUT Backend Support
- ❌ Notifications system (frontend complete, backend missing)
- ❌ Lab tests management (frontend complete, backend missing)
- ❌ Appointment reviews/ratings (frontend complete, backend missing)

### ⚠️ API Prefix Inconsistencies
All backend routes use `/api/v1/` prefix. Frontend correctly uses:
- `BaseURL = ${API_BASE}/api/v1` (most files) ✅
- Some files default to port 3000 fallback (should use 5001) - acceptable with `.env` file ✅

---

## ✅ Quick Fix Checklist

| Issue | Priority | Effort | Status | Fix |
|-------|----------|--------|--------|-----|
| Doctor profile lookup failing | 🔴 Critical | Low | ✅ DONE | Fixed test to use userId |
| Filter param name (`department` → `specialization`) | 🟠 Medium | Low | ✅ DONE | Updated controller |
| Password logging in frontend | 🟡 Security | Low | ✅ DONE | Removed console.log |
| Notifications API missing | 🟠 Medium | High | 📋 PLANNED | Frontend ready, needs backend |
| Lab tests API missing | 🟠 Medium | High | 📋 PLANNED | Frontend ready, needs backend |
| Appointment review endpoint missing | 🟡 Low | Low | 📋 PLANNED | Frontend ready, needs backend |

---

## 🔧 Commands Reference

```bash
# Reset and seed fresh database
npm run db:reset

# Run API tests (requires server running)
npm run test:api

# Debug database
npx prisma studio

# Start server
npm run dev
```
