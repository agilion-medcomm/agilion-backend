# Render.com Production Setup Guide

## 🚀 Quick Setup

### 1. Start Command
```bash
node scripts/production-start.js
```

This command will automatically:
- ✅ Run database migrations (`prisma migrate deploy`)
- ✅ Generate Prisma Client
- ✅ Seed database (if empty)
- ✅ Start Express server

### 2. Build Command
```bash
npm install && npx prisma generate
```

### 3. Required Environment Variables

Set these in Render Dashboard → Environment:

```bash
# Database (Render PostgreSQL)
DATABASE_URL=<your-render-postgres-connection-string>

# JWT Secret (generate a strong random string)
JWT_SECRET=<your-secure-jwt-secret-minimum-32-characters>

# Email Service (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASSWORD=<your-gmail-app-password>

# Frontend URL
FRONTEND_URL=https://zeytinburnucerrahitipmerkezi.com

# Node Environment
NODE_ENV=production

# Trust Proxy (required for Render)
TRUST_PROXY=true

# Port (Render sets this automatically)
PORT=10000

# CORS Origins (optional, defaults include production domain)
CORS_ORIGINS=https://zeytinburnucerrahitipmerkezi.com,https://www.zeytinburnucerrahitipmerkezi.com

# Optional: Disable features for production if needed
# RATE_LIMIT_ENABLED=true
# EMAIL_ENABLED=true
# HELMET_ENABLED=true
# CSP_ENABLED=true
```

---

## 📋 Deployment Checklist

### Before Deploying
- [ ] Ensure `DATABASE_URL` points to Render PostgreSQL instance
- [ ] Generate strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure Gmail App Password for `EMAIL_PASSWORD`
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable `TRUST_PROXY=true`
- [ ] Set `NODE_ENV=production`

### Render Dashboard Settings
- [ ] **Build Command:** `npm install && npx prisma generate`
- [ ] **Start Command:** `node scripts/production-start.js`
- [ ] **Node Version:** 18.x or higher
- [ ] **Auto-Deploy:** Enabled (optional)
- [ ] **Health Check Path:** `/api/v1/health` (if available)

### After First Deploy
- [ ] Check deployment logs for migration success
- [ ] Verify database seeding (should show "Database already has X users")
- [ ] Test API endpoint: `https://agilion-backend.onrender.com/api/v1/`
- [ ] Test CORS: Make a request from frontend
- [ ] Check admin login works
- [ ] Verify email notifications are sent

---

## 🔒 Security Recommendations

### JWT Secret Generation
```bash
# Generate a secure random JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Gmail App Password
1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

---

## 🗄️ Database Migrations

### Automatic (Production)
The `production-start.js` script runs migrations automatically:
```bash
npx prisma migrate deploy
```

### Manual Migration (if needed)
If automatic migration fails, run manually via Render Shell:
```bash
npx prisma migrate deploy
```

### Seeding
Database seeding happens automatically if database is empty. Manual seed:
```bash
node scripts/seedDatabase.js
```

---

## 🌐 CORS Configuration

### Default Allowed Origins
The backend automatically allows these origins:
- `http://localhost:5173` (development)
- `http://localhost:5174` (development)
- `https://zeytinburnucerrahitipmerkezi.com` (production)
- `https://www.zeytinburnucerrahitipmerkezi.com` (production with www)

### Custom Origins
Add via environment variable:
```bash
CORS_ORIGINS=https://example.com,https://api.example.com
```

---

## 📊 Monitoring & Logs

### Check Deployment Logs
```bash
Render Dashboard → Your Service → Logs
```

### Expected Startup Logs
```
[CHECK] Testing database connection...
✓ Database connection successful
[RUNNING] Running database migrations
✓ Running database migrations completed successfully
[CHECK] Checking if database needs seeding...
Database already has 10 users, skipping seed
[START] Starting Express server...
Server running on port 10000
```

### Common Issues

#### Migration Fails
```bash
# Solution: Check DATABASE_URL is correct
# Run manual migration via Render Shell
npx prisma migrate deploy
```

#### Prisma Client Not Generated
```bash
# Solution: Ensure build command includes prisma generate
npm install && npx prisma generate
```

#### CORS Errors
```bash
# Solution: Add frontend URL to CORS_ORIGINS
CORS_ORIGINS=https://zeytinburnucerrahitipmerkezi.com
```

#### Rate Limiting Issues
```bash
# Solution: Ensure TRUST_PROXY=true in production
# This is required for Render to detect correct client IP
TRUST_PROXY=true
```

---

## 🔄 Updates & Redeployment

### Automatic Updates
If auto-deploy is enabled, Render redeploys on every push to `main` branch.

### Manual Redeploy
Render Dashboard → Your Service → Manual Deploy → Deploy Latest Commit

### Rolling Back
Render Dashboard → Your Service → Manual Deploy → Select Previous Commit

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT signing (32+ chars) |
| `EMAIL_USER` | ✅ Yes | - | Gmail address for sending emails |
| `EMAIL_PASSWORD` | ✅ Yes | - | Gmail app password |
| `FRONTEND_URL` | ⚠️ Recommended | localhost:5173 | Frontend URL for password reset links |
| `NODE_ENV` | ⚠️ Recommended | development | Set to `production` |
| `TRUST_PROXY` | ⚠️ Recommended | false | Must be `true` on Render |
| `PORT` | No | 10000 | Render sets automatically |
| `EMAIL_SERVICE` | No | gmail | Email provider |
| `CORS_ORIGINS` | No | See above | Comma-separated allowed origins |
| `RATE_LIMIT_ENABLED` | No | true | Enable/disable rate limiting |
| `EMAIL_ENABLED` | No | true | Enable/disable email sending |
| `HELMET_ENABLED` | No | true | Enable/disable Helmet security |
| `CSP_ENABLED` | No | true | Enable/disable Content Security Policy |

---

## 🧪 Testing Production

### Test API Endpoint
```bash
# From your terminal
curl https://agilion-backend.onrender.com/api/v1/

# Or run the test suite
API_URL=https://agilion-backend.onrender.com node scripts/testApi.js
```

### Test CORS
```javascript
// From frontend console
fetch('https://agilion-backend.onrender.com/api/v1/', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## 📞 Support

### Backend Repository
https://github.com/agilion-medcomm/agilion-backend

### Production URLs
- **Backend:** https://agilion-backend.onrender.com
- **Frontend:** https://zeytinburnucerrahitipmerkezi.com

### Contact
For issues, create an issue in the GitHub repository.
