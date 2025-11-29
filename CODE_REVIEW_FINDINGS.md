# Code Review Findings - Agilion Backend
**Date**: November 29, 2025  
**Reviewer**: AI Code Review Agent

## 🔴 CRITICAL - Fix Immediately

### 1. **Rotate Exposed Credentials**
- [ ] Generate new JWT secret (32+ random characters)
- [ ] Revoke Gmail app password `wwmc hofd veoz wxss`
- [ ] Generate new app password
- [ ] Update `.env` file
- [ ] Verify `.env` is in `.gitignore` (✅ Already done)
- [ ] Check git history for leaked credentials:
```bash
git log --all --full-history -- .env
```

### 2. **Add Missing dotenv Configuration**
- [ ] Add `require('dotenv').config()` to `src/server.js`
- [ ] Verify all entry points load environment variables

### 3. **Implement Rate Limiting**
```bash
npm install express-rate-limit
```
Add to critical endpoints:
- [ ] `/auth/login` - 5 attempts per 15 minutes
- [ ] `/auth/personnel/login` - 5 attempts per 15 minutes
- [ ] `/auth/register` - 3 attempts per hour
- [ ] `/auth/request-password-reset` - 3 attempts per hour

### 4. **Fix Race Condition in Appointment Booking**
- [ ] Wrap appointment creation in Prisma transaction
- [ ] Add unique constraint on `(doctorId, date, time)` in schema
- [ ] Run new migration

---

## 🟠 HIGH PRIORITY - Fix This Week

### 5. **Input Validation Enhancement**
- [ ] Add parseInt validation wrapper:
```javascript
// src/utils/validators.js
const parseIdParam = (id) => {
    const parsed = parseInt(id);
    if (isNaN(parsed) || parsed <= 0) {
        throw new ApiError(400, 'Invalid ID format');
    }
    return parsed;
};
```
- [ ] Apply to all controllers accepting ID params

### 6. **Improve Error Handling**
- [ ] Remove useless try-catch blocks that just re-throw
- [ ] Add specific error context where needed
- [ ] Implement proper error logging

### 7. **Add Production Logging**
```bash
npm install winston
```
- [ ] Replace all `console.log/error` with Winston
- [ ] Configure log levels (info, warn, error)
- [ ] Add structured logging with context

### 8. **Database Health Check**
```javascript
// Add to /api/v1/health endpoint
try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'UP', database: 'connected' };
} catch (error) {
    return { status: 'DOWN', database: 'disconnected' };
}
```

### 9. **Increase Bcrypt Salt Rounds**
- [ ] Change from 10 to 12 rounds
- [ ] Update in all password hashing locations:
  - `src/services/personnel.service.js`
  - `src/services/auth/registration.service.js`
  - `src/services/auth/passwordReset.service.js`
  - `scripts/bootstrapAdmin.js`

---

## 🟡 MEDIUM PRIORITY - Fix This Sprint

### 10. **Remove Async from authMiddleware**
```javascript
// src/api/middlewares/authMiddleware.js
const authMiddleware = (req, res, next) => {  // Remove async
    try {
        // ... existing code
    } catch (error) {
        next(error);
    }
};
```

### 11. **Extract Inline Middleware**
- [ ] Move `requireAdminOrSelf` to `src/api/middlewares/requireAdminOrSelf.js`
- [ ] Move inline optional auth to `src/api/middlewares/optionalAuth.js`
- [ ] Update imports

### 12. **Add Pagination Support**
- [ ] Create pagination utility
- [ ] Add to `/api/v1/patients`
- [ ] Add to `/api/v1/personnel`
- [ ] Add to `/api/v1/appointments` (list mode)

### 13. **Configuration Constants**
```javascript
// src/config/constants.js
module.exports = {
    WORKING_HOURS: {
        START: 9,
        END: 17,
        INTERVAL: 30 // minutes
    },
    AUTH: {
        BCRYPT_ROUNDS: 12,
        JWT_EXPIRY: '30m',
        PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 hour
        EMAIL_VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
    }
};
```

### 14. **Remove Obsolete TODOs**
- [ ] Delete completed TODO comments in:
  - `src/app.js`
  - `src/server.js`

### 15. **Add Request Timeout**
```javascript
// src/app.js
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds
    next();
});
```

---

## 🔵 LOW PRIORITY - Technical Debt

### 16. **Standardize Response Format**
Create consistent API response wrapper:
```javascript
// src/utils/apiResponse.js
const success = (data, message = 'Success') => ({
    status: 'success',
    message,
    data
});

const error = (message, errors = null) => ({
    status: 'error',
    message,
    ...(errors && { errors })
});
```

### 17. **Add JSDoc Documentation**
- [ ] Document all public service functions
- [ ] Document middleware functions
- [ ] Use consistent JSDoc format

### 18. **Improve Type Safety**
Consider TypeScript migration or at least JSDoc type annotations:
```javascript
/**
 * @param {number} userId
 * @param {object} updates
 * @param {string} [updates.email]
 * @param {string} [updates.phoneNumber]
 * @returns {Promise<object>}
 */
```

### 19. **Add Unit Tests**
- [ ] Set up Jest properly
- [ ] Test utility functions (dateTimeValidator)
- [ ] Test middleware
- [ ] Test service layer

### 20. **Environment-Specific CORS**
```javascript
// src/config/cors.js
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:5174'];
```

---

## 📊 Code Metrics

| Metric | Count | Status |
|--------|-------|--------|
| Security Issues | 5 | 🔴 Critical |
| Console.log/error | 12 | 🟡 Replace |
| TODO Comments | 4 | 🟢 Low risk |
| Async without await | 1 | 🟡 Fix |
| parseInt without validation | 20+ | 🟠 Risky |
| Missing pagination | 3 endpoints | 🟡 Add later |

---

## ✅ What's Going Well

1. **Good separation of concerns** (controllers, services, repositories)
2. **Comprehensive validation** with Joi schemas
3. **Proper error handling middleware** with custom ApiError class
4. **Secure password hashing** with bcrypt
5. **Token-based authentication** properly implemented
6. **Database schema** is well-designed
7. **Code is mostly consistent** and readable
8. **Good documentation** in README

---

## 🎯 Recommended Action Plan

### Week 1 (Critical)
- Rotate all exposed credentials
- Add rate limiting
- Fix dotenv configuration
- Fix appointment race condition

### Week 2 (High Priority)
- Implement proper logging
- Add input validation wrappers
- Increase bcrypt rounds
- Add database health check

### Week 3 (Medium Priority)
- Refactor inline middleware
- Add pagination
- Create configuration constants
- Add request timeouts

### Future Sprints
- Add comprehensive unit tests
- Consider TypeScript migration
- Implement refresh tokens
- Add API documentation (Swagger/OpenAPI)

---

## 📚 Additional Recommendations

### Security Headers
Add helmet.js for security headers:
```bash
npm install helmet
```

### Request Validation
Add express-validator as backup to Joi:
```bash
npm install express-validator
```

### Monitoring
Consider adding:
- APM tool (New Relic, DataDog)
- Error tracking (Sentry)
- Log aggregation (Loggly, ELK)

### Documentation
- Add Swagger/OpenAPI spec
- Generate API documentation
- Add architecture diagrams

---

**Review Status**: ⚠️ Needs immediate attention before production deployment

**Next Review**: After critical issues are resolved
