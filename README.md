# Node.js Authentication API

## 🚀 Features
- Register, Login, Logout
- JWT (Access + Refresh Token)
- Protected routes (middleware)
- Input validation (express-validator)
- Secure password hashing (bcrypt)

## 🛠️ Tech Stack
Node.js, Express, MongoDB, Mongoose

## 📦 API Endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/users

## 🔐 Security Features
- Password hashing (bcrypt)
- Token-based authentication
- Middleware protection
- Input validation

## ⚙️ Setup
npm install
npm run dev

## 🌐 Environment Variables
MONGO_URI=
JWT_SECRET=
REFRESH_SECRET=
