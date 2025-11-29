# Email Verification Implementation Guide

## 📋 Overview

The new schema includes email verification fields that allow you to verify user email addresses during registration. This is currently **integrated but not actively used** in your codebase.

## 🗄️ Database Schema

### Added Fields to User Model:
```prisma
model User {
  // ... existing fields
  
  // Email verification fields
  isEmailVerified   Boolean   @default(false)  // Whether email is verified
  emailToken        String?   @unique          // Verification token
  emailTokenExpiry  DateTime?                  // Token expiration time
}
```

## 📊 Current Usage Status

### ✅ What's Already Set Up:
1. **Schema fields** - Added to `prisma/schema.prisma`
2. **Migration** - `20251129112953_add_email_verification/migration.sql`
3. **Repository support** - `isEmailVerified` field in `createPersonnelWithUser()`
4. **Database ready** - Fields exist in database after migration

### ❌ What's NOT Implemented Yet:
1. Email verification service functions
2. Email verification email sending
3. Verification endpoints (send token, verify token)
4. Email verification middleware/checks
5. Frontend integration

## 🚀 How to Implement Email Verification

### Step 1: Add Email Verification Service Functions

Create new functions in `src/services/auth.service.js`:

```javascript
/**
 * Send email verification token
 * @param {number} userId - User's ID
 */
const sendEmailVerification = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, 'Email is already verified.');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage
    const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // Set token expiry (24 hours)
    const emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with verification token
    await prisma.user.update({
        where: { id: userId },
        data: {
            emailToken: hashedToken,
            emailTokenExpiry,
        },
    });

    // Send verification email
    await emailService.sendEmailVerification(
        user.email,
        verificationToken,
        user.firstName
    );

    return {
        status: 'success',
        message: 'Verification email sent.',
    };
};

/**
 * Verify email using token
 * @param {string} token - Verification token from email
 */
const verifyEmail = async (token) => {
    // Hash the provided token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
        where: {
            emailToken: hashedToken,
            emailTokenExpiry: {
                gt: new Date(), // Token must not be expired
            },
        },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token.');
    }

    // Mark email as verified and clear token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            emailToken: null,
            emailTokenExpiry: null,
        },
    });

    return {
        status: 'success',
        message: 'Email verified successfully.',
    };
};

// Add to module.exports:
module.exports = {
    // ... existing exports
    sendEmailVerification,
    verifyEmail,
};
```

### Step 2: Add Email Service Function

Create new function in `src/services/email.service.js`:

```javascript
/**
 * Send email verification email
 * @param {string} email - Recipient email
 * @param {string} verificationToken - Verification token
 * @param {string} firstName - User's first name
 */
const sendEmailVerification = async (email, verificationToken, firstName) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.error('Email transporter not configured.');
        console.log(`Verification token for ${email}: ${verificationToken}`);
        return;
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Doğrulama - Agilion MedComm',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Adresinizi Doğrulayın</h2>
                <p>Merhaba ${firstName},</p>
                <p>Hesabınızı aktif hale getirmek için email adresinizi doğrulamanız gerekmektedir.</p>
                <div style="margin: 30px 0;">
                    <a href="${verifyUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Email Adresimi Doğrula
                    </a>
                </div>
                <p style="color: #666;">Bu bağlantı 24 saat boyunca geçerlidir.</p>
                <p style="color: #666;">Eğer bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending verification email:', error.message);
        throw new Error('Failed to send verification email.');
    }
};

// Add to module.exports:
module.exports = {
    sendPasswordResetEmail,
    sendEmailVerification,
};
```

### Step 3: Add Controller Functions

Create new functions in `src/api/controllers/auth.controller.js`:

```javascript
// POST /api/v1/auth/send-verification
const sendVerification = async (req, res, next) => {
    try {
        const result = await authService.sendEmailVerification(req.user.userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/verify-email
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Add to module.exports:
module.exports = {
    // ... existing exports
    sendVerification,
    verifyEmail,
};
```

### Step 4: Add Routes

Add to `src/api/routes/auth.routes.js`:

```javascript
// POST /api/v1/auth/send-verification - Send verification email (requires auth)
router.post('/send-verification', authMiddleware, authController.sendVerification);

// POST /api/v1/auth/verify-email - Verify email with token (public)
router.post('/verify-email', authController.verifyEmail);
```

### Step 5: Add Validation

Add to `src/api/validations/auth.validation.js`:

```javascript
// Schema for POST /api/v1/auth/verify-email
const verifyEmailSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Verification token is required.',
    }),
});

// Add to module.exports:
module.exports = {
    // ... existing exports
    verifyEmailSchema,
};
```

### Step 6: Modify Registration Flow

Update `registerUser` in `auth.service.js` to send verification email automatically:

```javascript
const registerUser = async (userData) => {
    // ... existing code to create user

    const newUser = await userRepository.createUser({
        // ... existing fields
        isEmailVerified: false, // Explicitly set to false
    });

    // Send verification email automatically
    try {
        await sendEmailVerification(newUser.id);
    } catch (error) {
        console.error('Failed to send verification email:', error.message);
        // Don't fail registration if email fails
    }

    delete newUser.password;
    return newUser;
};
```

### Step 7: Add Middleware to Check Verification (Optional)

Create `src/api/middlewares/requireEmailVerified.js`:

```javascript
const { ApiError } = require('./errorHandler');

/**
 * Middleware to ensure user's email is verified
 * Use this on routes that require verified email
 */
const requireEmailVerified = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required.');
        }

        if (!req.user.isEmailVerified) {
            throw new ApiError(403, 'Email verification required. Please verify your email to access this resource.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = requireEmailVerified;
```

**Usage example:**
```javascript
// Require email verification for creating appointments
router.post('/', authMiddleware, requireEmailVerified, appointmentController.createAppointment);
```

## 🔄 Complete Flow Example

### 1. User Registration
```
POST /api/v1/auth/register
→ User created with isEmailVerified = false
→ Verification email sent automatically
→ User receives email with verification link
```

### 2. Email Verification
```
User clicks link in email
→ Frontend: GET /verify-email?token=abc123
→ Frontend: POST /api/v1/auth/verify-email { token: "abc123" }
→ Backend validates token
→ User.isEmailVerified = true
→ Success message returned
```

### 3. Resend Verification (if needed)
```
POST /api/v1/auth/send-verification
Headers: { Authorization: "Bearer <jwt>" }
→ New verification email sent
```

## 🔍 Checking Verification Status

### In getUserProfile:
```javascript
const getUserProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            // ... existing fields
            isEmailVerified: true, // Add this
        },
    });

    return {
        // ... existing fields
        isEmailVerified: user.isEmailVerified, // Return to frontend
    };
};
```

### In Login Response:
```javascript
const loginUser = async (tckn, password) => {
    // ... existing code
    
    return {
        token,
        user: {
            // ... existing fields
            isEmailVerified: user.isEmailVerified, // Add this
        },
    };
};
```

## ⚙️ Configuration

Add to `.env`:
```env
# Email verification settings (same as password reset)
EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASSWORD="your_app_password"
FRONTEND_URL="http://localhost:5173"
```

## 🧪 Testing

### Test Flow:
1. Register new user
2. Check database: `isEmailVerified` should be `false`
3. Check console for verification token (in development)
4. Use token to verify email
5. Check database: `isEmailVerified` should be `true`

### SQL Queries for Testing:
```sql
-- Check verification status
SELECT id, email, "isEmailVerified", "emailToken", "emailTokenExpiry" 
FROM users 
WHERE email = 'test@example.com';

-- Manually verify a user (for testing)
UPDATE users 
SET "isEmailVerified" = true, 
    "emailToken" = NULL, 
    "emailTokenExpiry" = NULL 
WHERE email = 'test@example.com';
```

## 🎯 Current vs Full Implementation

### Currently in Your Codebase:
- ✅ Database schema with email verification fields
- ✅ Migration file
- ✅ `isEmailVerified` supported in repository
- ❌ No email verification logic
- ❌ No verification endpoints
- ❌ No verification emails sent

### After Full Implementation:
- ✅ Complete email verification flow
- ✅ Automatic verification emails on registration
- ✅ Token-based email verification
- ✅ Resend verification option
- ✅ Optional middleware to require verification
- ✅ Frontend integration ready

## 📝 Summary

**The schema is ready, but the functionality needs to be implemented using the code examples above.**

To activate email verification:
1. Add service functions (Step 1)
2. Add email sending function (Step 2)
3. Add controllers (Step 3)
4. Add routes (Step 4)
5. Add validation (Step 5)
6. Modify registration to send emails (Step 6)
7. Optionally add verification middleware (Step 7)

Would you like me to implement any of these steps for you?
