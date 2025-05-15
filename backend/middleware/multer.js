const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Ensure temporary upload directory exists
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    // Preserve original name with timestamp prefix
    const timestamp = Date.now();
    const basename  = path.basename(file.originalname, path.extname(file.originalname));
    const ext       = path.extname(file.originalname).toLowerCase();
    cb(null, `${basename}-${timestamp}${ext}`);
  }
});

// Only accept .csv files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMime = ['text/csv', 'application/vnd.ms-excel'];
  if (ext === '.csv' && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Export factory to create multer instance
module.exports = () => multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});
