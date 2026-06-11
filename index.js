import dotenv from 'dotenv';


dotenv.config({ override: true }); 
console.log('ALL ENV KEYS:', Object.keys(process.env).filter(k => k.includes('SARVAM')));

import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Basic route
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT}`);
});

// Error handling middleware
app.use(errorHandler);