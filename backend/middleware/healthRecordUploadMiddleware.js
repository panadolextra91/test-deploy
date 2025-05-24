const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create a temporary directory for uploads
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tmpDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'health-record-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    const allowedExt = /jpe?g|png|pdf|avif|webp|gif/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
  
    // Check allowed MIME types
    const allowedMime = /^(image\/(jpeg|pjpeg|png|avif|webp|gif)|application\/pdf)$/;
    const mimetype = allowedMime.test(file.mimetype);
  
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpg, jpeg, png, avif, webp, gif) and PDF files are allowed!'));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = upload; 