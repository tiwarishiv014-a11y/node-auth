import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registervalidation, loginvalidation, updatevalidation, validate } from '../validator/userValidator.js';
import * as authController from '../controllers/authController.js';
import upload from '../middleware/upload.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
// const SECRET_KEY = "your_secret_key"; // In production, use environment variables to store secrets



router.post('/register', registervalidation, validate,authController.register);

router.post('/update', authMiddleware, updatevalidation, validate, authController.update);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/users', authMiddleware, adminMiddleware, authController.getUsers);
router.get('/profile', authMiddleware, authController.getProfile);

// Add these alongside your existing routes:
router.post('/login',         loginvalidation, validate, authController.login);
router.post('/verify-otp',    authController.verifyOtp);
router.get ('/admin/pending', authMiddleware, adminMiddleware, authController.getPendingUsers);
router.post('/admin/status',  authMiddleware, adminMiddleware, authController.updateUserStatus);


router.post('/upload-picture', authMiddleware, upload.single('profilePicture'), authController.uploadPicture);
export default router;




    
