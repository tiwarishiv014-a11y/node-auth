
import './config/env.js'; // ← must be first
// console.log('ALL ENV KEYS:', Object.keys(process.env).filter(k => k.includes('SARVAM')));
// // ✅ DEBUG: Check all API keys
// console.log('🔍 Environment Variables Check:');
// console.log('SARVAM_API_KEY:', process.env.SARVAM_API_KEY ? '✅ Set (length: ' + process.env.SARVAM_API_KEY.length + ')' : '❌ Missing');
// console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set (length: ' + process.env.GROQ_API_KEY.length + ')' : '❌ Missing');
// // ✅ Check all keys containing 'API'
// console.log('🔑 All API-related env vars:', 
//     Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY'))
// );

import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
// app.use(cors());// for development purposes, you might want to restrict this in production
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://node-auth-frontend-zeta.vercel.app'
    ],
    credentials: true
}));
app.use(express.static(path.join(__dirname, 'public'))); 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(mongoSanitize());
// app.use(mongoSanitize({ replaceWith: '_' }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use('/api', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/pdf', pdfRoutes);
// Basic route
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT}`);
});

// Error handling middleware
app.use(errorHandler);