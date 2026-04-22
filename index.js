import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';

const app = express();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/mydb')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.use('/api', userRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});