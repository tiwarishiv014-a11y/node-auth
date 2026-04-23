import multer from 'multer';
import path from 'path';

// where to save files and what name to give
const storage = multer.diskStorage({

    // folder where files are saved
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    // file name = timestamp + original name
    // example: 1714000000000-photo.jpg
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);  // accept file
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false); // reject
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // max 2MB
});

export default upload;