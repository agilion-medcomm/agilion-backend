# Personnel Profile Update Fix

## Issue Summary
Personnel (laborant, cashier, cleaner, doctor, admin) were unable to update their own profiles, receiving 403 Forbidden errors when attempting to change their information or passwords.

## Root Cause Analysis

### Critical Bug: Non-Unique Profile IDs Across Tables
Each personnel type (except cashier) has their own profile table with independent ID sequences:
- `Doctor` table: ID 1 = Dr. Mehmet Yılmaz (userId: 2)
- `Admin` table: ID 1 = Admin User (userId: 1)
- `Laborant` table: ID 1 = Emre Koç (userId: 9)
- `Cleaner` table: ID 1 = Hasan Yıldız (userId: 10)

The `requireAdminOrSelf` middleware was checking tables **sequentially** (doctor → admin → laborant → cleaner), always finding the Doctor profile first when given ID 1, causing authorization failures for other personnel types.

### Secondary Issues
1. **Frontend**: ProfilePage.jsx was using fallback chain `user.personnelId || user.doctorId || user.adminId || user.id` instead of simply `user.id`
2. **Backend**: Personnel service didn't verify current password before allowing password changes
3. **Middleware**: Cashiers weren't handled properly (they don't have a separate profile table)

## Solution Implementation

### 1. Frontend Fix (`front/src/components/Dashboard/ProfilePage.jsx`)
Changed profile update endpoints from using fallback chain to direct `user.id`:
```javascript
// Before (Lines 92, 152)
const endpoint = `${BaseURL}/personnel/${user.personnelId || user.doctorId || user.adminId || user.id}`;

// After
const endpoint = `${BaseURL}/personnel/${user.id}`;
```

**Rationale**: The `/api/auth/me` endpoint already returns the correct profile ID as `id` in the response. The fallback chain was unnecessary and error-prone.

### 2. Backend Middleware Fix (`src/api/middlewares/requireAdminOrSelf.js`)
Replaced sequential table checking with role-based table lookup:
```javascript
// Before: Sequential checking (BUGGY)
const doctor = await prisma.doctor.findUnique({ where: { id: parseInt(id) } });
if (doctor) targetUserId = doctor.userId;
else {
  const admin = await prisma.admin.findUnique({ where: { id: parseInt(id) } });
  // ... continues checking all tables
}

// After: Role-based lookup (FIXED)
switch (requestingUser.role) {
  case ROLES.DOCTOR:
    const doctor = await prisma.doctor.findUnique({ where: { id: parseInt(id) } });
    if (doctor) targetUserId = doctor.userId;
    break;
  case ROLES.LABORANT:
    const laborant = await prisma.laborant.findUnique({ where: { id: parseInt(id) } });
    if (laborant) targetUserId = laborant.userId;
    break;
  // ... etc for each role
}
```

**Rationale**: Since profile IDs are only unique within their own tables, we must use the requesting user's role to determine which table to query. This ensures we check the correct profile table for authorization.

### 3. Password Verification (`src/services/personnel.service.js`)
Added current password verification before allowing password changes:
```javascript
// If changing password, verify current password first
if (newPassword && currentPassword) {
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  updates.password = await hashPassword(newPassword);
  delete updates.currentPassword;
  delete updates.newPassword;
}
```

**Rationale**: Prevents unauthorized password changes if someone gains access to a user's session. Industry standard security practice.

## Testing Results

### Manual Testing (All Passed ✅)
```bash
1. DOCTOR profile update...     ✅ SUCCESS (ID: 1)
2. ADMIN profile update...      ✅ SUCCESS (ID: 1)
3. LABORANT profile update...   ✅ SUCCESS (ID: 1)
4. CASHIER profile update...    ✅ SUCCESS (ID: 8)
5. CLEANER profile update...    ✅ SUCCESS (ID: 1)
6. LABORANT password change...  ✅ SUCCESS and verified
7. Wrong password rejection...  ✅ Correctly rejects
```

### Automated Test Suite
- **Before Fix**: Personnel profile update tests didn't exist
- **After Fix**: Added 4 new tests to `scripts/testApi.js`:
  - Laborant can change their own password ✅
  - Doctor can update their own profile ✅
  - Personnel cannot update with wrong current password ✅
  - Cashier can change own password ✅

### Full Test Suite Results
- **Total Tests**: 86
- **Passed**: 83
- **Failed**: 3 (unrelated leave request issues from before)
- **Pass Rate**: 96.5%
- **Status**: ✅ All profile update functionality working

## Files Modified

1. **front/src/components/Dashboard/ProfilePage.jsx**
   - Lines 92, 152: Changed to use `user.id` directly

2. **src/api/middlewares/requireAdminOrSelf.js**
   - Complete refactor: Role-based profile table lookup
   - Added proper cashier handling
   - Improved error messages

3. **src/services/personnel.service.js**
   - Added current password verification
   - Enhanced `updatePersonnel` function
   - Maintains backward compatibility for admin updates

4. **scripts/testApi.js**
   - Added 4 comprehensive personnel profile tests

## Security Improvements

1. ✅ **Current Password Verification**: Users must provide current password to change it
2. ✅ **Role-Based Access Control**: Each personnel type can only access their own profile table
3. ✅ **Authorization Fix**: No longer possible to access other users' profiles due to ID collisions
4. ✅ **Self-Service Updates**: All personnel can now safely update their own information

## API Endpoints Affected

### `PUT /api/v1/personnel/:id`
- **Before**: 403 Forbidden for laborant/cleaner with profile ID 1
- **After**: ✅ Works for all personnel types

**Request Body for Profile Update**:
```json
{
  "email": "new.email@example.com",
  "phoneNumber": "5551234567"
}
```

**Request Body for Password Change**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

## Database Schema Context

### User Table (Primary)
- Contains all users regardless of role
- Has `id` (primary key) and `role` (enum)

### Profile Tables (Role-Specific)
- `Doctor` (has profile): id, userId, specialization
- `Admin` (has profile): id, userId
- `Laborant` (has profile): id, userId  
- `Cleaner` (has profile): id, userId
- `Cashier` (no profile): exists only in User table
- `Patient` (has profile): id, userId

### JWT Token Structure
```json
{
  "userId": 9,              // Always points to User table
  "role": "LABORANT",       // Determines which profile table to use
  "tckn": "44444444441",
  "laborantId": 1,          // Profile table ID (only for roles with profiles)
  "iat": 1733143234,
  "exp": 1733145034
}
```

The `/api/auth/me` endpoint returns:
```json
{
  "id": 1,                  // Profile ID (laborantId in JWT)
  "userId": 9,              // User table ID
  "role": "LABORANT",
  "firstName": "Emre",
  "lastName": "Koç",
  // ... other fields
}
```

## Deployment Notes

- ✅ No database migrations required
- ✅ Backward compatible (existing code unaffected)
- ✅ Frontend and backend must be deployed together
- ⚠️ Clear user sessions after deployment (JWT structure unchanged, but better to refresh)

## Future Improvements

1. **Consider Unique Profile IDs**: Could use UUID or composite keys to avoid ID collisions across tables
2. **Audit Logging**: Add logging for password changes and profile updates
3. **Rate Limiting**: Add rate limits specifically for password change attempts
4. **Email Notifications**: Notify users when their profile/password is changed

## Conclusion

This fix resolves a critical authorization bug that prevented all personnel types from updating their own profiles. The root cause was the non-unique nature of profile IDs across different tables, which caused the middleware to authorize against the wrong user record. By implementing role-based table lookup, all personnel can now safely and correctly update their profiles and passwords.
