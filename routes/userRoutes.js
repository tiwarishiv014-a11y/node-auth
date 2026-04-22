import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registervalidation, loginvalidation, updatevalidation, validate } from '../validator/userValidator.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();
// const SECRET_KEY = "your_secret_key"; // In production, use environment variables to store secrets



router.post('/register', registervalidation, validate,authController.register);
router.post('/login', loginvalidation, validate, authController.login);
router.post('/update', authMiddleware, updatevalidation, validate, authController.update);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/users', authController.getUsers);




    
export default router;