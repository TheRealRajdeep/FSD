import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter for logo uploads
const logoFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// File filter for document uploads
const documentFilter = (req, file, cb) => {
  // Accept PDFs and documents
  if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) {
    return cb(new Error("Only document files are allowed!"), false);
  }
  cb(null, true);
};

// Create upload middleware for different use cases
export const uploadLogo = multer({
  storage: storage,
  fileFilter: logoFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
});

export const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max size
});

// Generic upload middleware (accepts all files)
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
});

export default {
  upload,
  uploadLogo,
  uploadDocument,
};
