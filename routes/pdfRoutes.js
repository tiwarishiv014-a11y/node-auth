import express from 'express';
import multer from 'multer';

import { authMiddleware } from '../middleware/authMiddleware.js';
import {uploadPdf, chatWithPdf, listPdfs, deletePdf } from '../controllers/pdfController.js';


const upload = multer({ 
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files allowed'), false);
    }
});
const router = express.Router();
router.use(authMiddleware); // Apply auth middleware to all routes

router.post('/upload',  upload.single('pdf'), uploadPdf);
router.post('/chat', chatWithPdf);
router.get('/list', listPdfs);
router.delete('/:id',    deletePdf);

export default router;