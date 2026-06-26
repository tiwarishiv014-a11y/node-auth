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

import { getAiChatLogs, getUserChats } from '../controllers/chatController.js';
import { getPdfChatLogs, getUserPdfs } from '../controllers/pdfController.js';

const router = express.Router();

// ── Auth Routes ───────────────────────────────────────────
router.post('/register',    registervalidation, validate, authController.register);
router.post('/login',       loginvalidation, validate, authController.login);
router.post('/verify-otp',  authController.verifyOtp);
router.post('/refresh',     authController.refresh);
router.post('/logout',      authMiddleware, authController.logout);

// ── User Routes ───────────────────────────────────────────
router.get('/profile',        authMiddleware, authController.getProfile);
router.post('/update',        authMiddleware, updatevalidation, validate, authController.update);
router.post('/upload-picture',authMiddleware, upload.single('profilePicture'), authController.uploadPicture);

// ── Admin Routes ──────────────────────────────────────────
router.get('/users',                  authMiddleware, adminMiddleware, authController.getUsers);
router.get('/admin/dashboard',        authMiddleware, adminMiddleware, authController.getDashboardData);
router.get('/admin/pending',          authMiddleware, adminMiddleware, authController.getPendingUsers);
router.get('/admin/user/:phone',      authMiddleware, adminMiddleware, authController.getUserDetail);
router.put('/admin/user/:phone',      authMiddleware, adminMiddleware, authController.editUser);
router.delete('/admin/user/:phone',   authMiddleware, adminMiddleware, authController.deleteUser);
router.post('/admin/status',          authMiddleware, adminMiddleware, authController.updateUserStatus);

// ── Admin Log Routes ──────────────────────────────────────
router.get('/admin/logs/ai',  authMiddleware, adminMiddleware, getAiChatLogs);   // ✅ NEW
router.get('/admin/logs/pdf', authMiddleware, adminMiddleware, getPdfChatLogs);  // ✅ NEW

// ── Admin High Impact Routes ──────────────────────────────
router.post('/admin/ban',               authMiddleware, adminMiddleware, authController.banUser);
router.post('/admin/unban',             authMiddleware, adminMiddleware, authController.unbanUser);
router.post('/admin/reset-otp',         authMiddleware, adminMiddleware, authController.resetUserOtp);
router.get('/admin/user-chats/:userId', authMiddleware, adminMiddleware, getUserChats);
router.get('/admin/user-pdfs/:userId',  authMiddleware, adminMiddleware, getUserPdfs);
router.get('/admin/insights', authMiddleware, adminMiddleware, authController.getAdminInsights);

export default router;  