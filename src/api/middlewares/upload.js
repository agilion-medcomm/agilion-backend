const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/medical-files');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp + random string + original extension
        const randomString = Math.random().toString(36).substring(2, 11);
        const uniqueName = `${Date.now()}-${randomString}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter - only accept PDF, JPG, PNG
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    }
});

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: 'File size too large. Maximum 10MB allowed.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                status: 'error',
                message: 'Unexpected field name. Use "file" as the field name.'
            });
        }
        return res.status(400).json({
            status: 'error',
            message: `File upload error: ${err.message}`
        });
    }
    
    // Custom file filter error
    if (err && err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            status: 'error',
            message: err.message
        });
    }
    
    next(err);
};

module.exports = { upload, handleMulterError };
