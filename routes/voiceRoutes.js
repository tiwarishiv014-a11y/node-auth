// routes/voiceRoutes.js
import express from 'express';
import multer from 'multer';
import { transcribe, speak } from '../controllers/voiceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Store audio in memory (no disk write needed)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
router.use(authMiddleware);

router.post('/transcribe', upload.single('audio'), transcribe);  // STT
router.post('/speak',                               speak);       // TTS

export default router;