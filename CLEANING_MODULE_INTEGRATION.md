# Cleaner Panel Integration - Backend Implementation

## Overview
Successfully integrated the Cleaner Dashboard (frontend) with the backend by creating a complete cleaning module that handles cleaning records, file uploads, and data management.

---

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

**Added CLEANER role to UserRole enum:**
```prisma
enum UserRole {
  PATIENT
  DOCTOR
  ADMIN
  CASHIER
  LABORANT
  CLEANER  // ← NEW
}
```

**Added CleaningRecord model:**
```prisma
model CleaningRecord {
  id          Int      @id @default(autoincrement())
  personnelId Int
  personnel   User     @relation(fields: [personnelId], references: [id], onDelete: Cascade, name: "cleaningPersonnel")
  
  area        String       // Cleaning area (e.g., "Zemin Kat Koridor")
  time        String       // Time slot (e.g., "Sabah", "Öğle", "Akşam")
  photoUrl    String?      // URL to uploaded cleaning photo
  date        String       // Date in YYYY-MM-DD format
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("cleaning_records")
}
```

**Added relationship to User model:**
```prisma
cleaningRecords CleaningRecord[] @relation("cleaningPersonnel")
```

---

## Backend Files Created

### 2. Service Layer (`src/services/cleaning.service.js`)

**Functions:**
- `createCleaningRecord(userId, area, time, photoUrl)` - Create a new cleaning record
- `getCleaningRecordsByDate(date)` - Fetch records for a specific date
- `getCleaningRecordsByPersonnel(personnelId, date)` - Fetch records by personnel member
- `getAllCleaningRecords(filters)` - Get all records with optional filters
- `deleteCleaningRecord(recordId, personnelId)` - Delete a record (with authorization)

### 3. Controller Layer (`src/api/controllers/cleaning.controller.js`)

**Endpoints:**
- `POST /api/v1/cleaning` - Create cleaning record with photo
- `GET /api/v1/cleaning` - Get all records with filters (date, area, personnelId)
- `GET /api/v1/cleaning/date/:date` - Get records for specific date
- `GET /api/v1/cleaning/personnel/:personnelId` - Get records for specific personnel
- `DELETE /api/v1/cleaning/:recordId` - Delete a record

### 4. Routes (`src/api/routes/cleaning.routes.js`)

**Features:**
- Multer file upload configuration (5MB limit, JPEG/PNG only)
- Authentication & authorization middleware
- CLEANER and ADMIN role support
- Error handling for invalid file types

### 5. Main Routes Index (`src/api/routes/index.js`)

**Updated to include:**
```javascript
router.use("/cleaning", cleaningRouter);
```

---

## API Endpoints

### Create Cleaning Record
```http
POST /api/v1/cleaning
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- area: "Zemin Kat Koridor" (required)
- time: "Sabah" (required)
- photo: <image file> (required, JPEG/PNG, max 5MB)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "area": "Zemin Kat Koridor",
    "time": "Sabah",
    "date": "2025-12-06",
    "photoUrl": "/uploads/1733546400000-123456789.jpg",
    "personnel": {
      "id": 5,
      "firstName": "John",
      "lastName": "Cleaner",
      "email": "cleaner@hospital.com"
    }
  }
}
```

### Get Cleaning Records
```http
GET /api/v1/cleaning?date=2025-12-06&area=Zemin%20Kat%20Koridor
Authorization: Bearer <token>
```

### Get Records by Date
```http
GET /api/v1/cleaning/date/2025-12-06
Authorization: Bearer <token>
```

### Get Records by Personnel
```http
GET /api/v1/cleaning/personnel/5?date=2025-12-06
Authorization: Bearer <token>
```

### Delete Cleaning Record
```http
DELETE /api/v1/cleaning/1
Authorization: Bearer <token>
```

---

## Frontend Integration Points

The frontend (`CleanerDashboard.jsx`) now connects to these backend endpoints:

1. **POST to create record:**
   ```javascript
   await axios.post(`${BaseURL}/cleaning`, formData, {
     headers: {
       Authorization: `Bearer ${token}`,
       'Content-Type': 'multipart/form-data'
     }
   });
   ```

2. **GET to fetch daily records:**
   ```javascript
   const res = await axios.get(`${BaseURL}/cleaning`, {
     params: { date: viewDate },
     headers: { Authorization: `Bearer ${token}` }
   });
   ```

---

## Database Migration

To apply these changes to your database, run:

```bash
npx prisma migrate dev --name add_cleaning_module
```

This will:
1. Create the `cleaning_records` table
2. Add the CLEANER role to the UserRole enum
3. Add the relationship between User and CleaningRecord

---

## Next Steps

1. **Create CLEANER users** through your admin panel
2. **Set up upload directory:** Ensure the `uploads/` folder exists in your project root
3. **Test the endpoints** using the API examples above
4. **Configure file storage** (optional: migrate from local to Cloudinary/AWS S3)

---

## Features

✅ **Photo uploads** with validation (size, format)
✅ **Date-based tracking** of cleaning activities
✅ **Personnel-specific records** for accountability
✅ **Role-based access** (CLEANER, ADMIN only)
✅ **Flexible querying** with multiple filter options
✅ **Authorization checks** (personnel can only delete their own records)
✅ **Complete error handling** with meaningful messages

