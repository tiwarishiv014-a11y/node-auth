import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
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
mongoose.connect('mongodb://127.0.0.1:27017/mydb')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use('/api', userRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});

// Error handling middleware
app.use(errorHandler);