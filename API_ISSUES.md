# API Issues & Known Bugs

**Document Created:** December 12, 2025  
**Last Test Run:** 95.1% Pass Rate (78/82 tests)  
**Branch:** feat/codebaseImprovements

This document tracks API issues discovered during comprehensive testing. Each issue is categorized by severity and includes the root cause analysis and suggested fix.

---

## 🔴 Critical Issues

### 1. Doctor Profile Not Linked to User After Login
**Endpoints Affected:** 
- `GET /api/v1/leave-requests` (as doctor)
- `POST /api/v1/leave-requests` (as doctor)

**Tests Failed:**
- "Doctor can view leave requests"
- "Create leave request as doctor"  
- "Update leave request status as admin" (cascade failure)

**Error:** `{"status":"error","message":"Doctor profile not found."}`

**Root Cause:**  
When a doctor logs in via `POST /api/v1/auth/personnel/login`, the JWT contains the user ID, but the leave request service cannot find the corresponding Doctor profile.

**Code Location:** `src/services/leaveRequest.service.js`
```javascript
const getLeaveRequests = async (userRole, userId) => {
    if (userRole === ROLES.DOCTOR) {
        const doctor = await prisma.doctor.findUnique({
            where: { userId },  // ← This lookup fails
        });
        if (!doctor) {
            throw new ApiError(404, 'Doctor profile not found.');
        }
        // ...
    }
};
```

**Investigation Required:**
1. Check if the Doctor table has the correct `userId` foreign key
2. Verify the doctor user from seeder has a Doctor profile entry
3. Check if JWT contains correct user ID

**Debug Command:**
```bash
# Check if doctor profile exists for user
npx prisma studio
# Look at Doctor table - verify userId matches User table
```

**Suggested Fix:**
Ensure doctor profiles are properly linked. The seeder creates doctors with:
```javascript
await prisma.doctor.create({
    data: {
        specialization: data.specialization,
        user: { create: baseUser }  // Creates both User and Doctor
    }
});
```
Verify the `userId` in Doctor table matches the logged-in user's ID.

---

## 🟠 Medium Issues

### 2. Doctor Specialization Filter Not Working
**Endpoint:** `GET /api/v1/doctors?specialization=Kardiyoloji`  
**Test:** "Get doctors filtered by specialization"  
**Error:** `All doctors should have Kardiyoloji specialization`

**Root Cause:**  
The API controller expects `department` as the query parameter, but the test (and likely frontend) sends `specialization`.

**Code Location:** `src/api/controllers/doctor.controller.js` (line 12)
```javascript
const getDoctors = async (req, res, next) => {
    const { department } = req.query;  // ← Expects 'department'
    const doctors = await doctorService.getAllDoctors(department);
};
```

**The Issue:**  
Naming inconsistency between API parameter (`department`) and data model field (`specialization`).

**Evidence:**
```bash
# This returns ALL doctors (filter ignored - wrong param name)
curl -s "http://localhost:5001/api/v1/doctors?specialization=Kardiyoloji" | jq '.data | length'
# Returns: 3 (all doctors)

# This SHOULD work (using expected param name)
curl -s "http://localhost:5001/api/v1/doctors?department=Kardiyoloji" | jq '.data | length'
# Returns: 1 (only Kardiyoloji doctor)
```

**Suggested Fix:**
Change controller to use `specialization` to match the data model:
```javascript
const { specialization } = req.query;
const doctors = await doctorService.getAllDoctors(specialization);
```

---

## 🟡 Design Notes (Not Bugs)

### 3. Cleaning Record Requires Photo Upload
**Endpoint:** `POST /api/v1/cleaning`  
**Behavior:** Returns `400: Photo is required for cleaning record.`

**Note:** This is **correct behavior** - the API requires multipart/form-data with an image file. The test properly handles this by expecting a 400 response when sending JSON.

### 4. Contact Form Requires Phone Field
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

---

## ✅ Quick Fix Checklist

| Issue | Priority | Effort | Status | Fix |
|-------|----------|--------|--------|-----|
| Doctor profile lookup failing | 🔴 Critical | Medium | TODO | Investigate User/Doctor table linkage |
| Filter param name (`department` → `specialization`) | 🟠 Medium | Low | TODO | Update controller |

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
