# 🔐 Node.js Authentication API

A production-ready backend authentication system built using Node.js, Express, MongoDB, and JWT.  
This project follows **MVC architecture**, includes **secure authentication**, **file upload**, and **centralized error handling**.

---

## 🚀 Features

- ✅ User Registration (bcrypt password hashing)
- ✅ Login with JWT (Access + Refresh Tokens)
- ✅ Secure Logout (invalidate refresh token)
- ✅ Refresh Token system
- ✅ Update user profile
- ✅ Get user profile (protected)
- ✅ Upload profile picture (Multer)
- ✅ Input validation (express-validator)
- ✅ MVC Architecture
- ✅ Centralized Error Handling

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (Authentication)
- bcrypt (Password hashing)
- express-validator (Validation)
- multer (File upload)

---

## 📁 Project Structure
project/
├── controllers/ # Business logic
├── models/ # Database schema
├── routes/ # API routes
├── middleware/ # Auth, error, upload
├── validator/ # Input validation
├── utils/ # Tokens & custom error
├── uploads/ # Uploaded files
├── index.js # Entry point


---

## 🔐 API Endpoints

| Method | Endpoint              | Description              | Auth |
|--------|----------------------|--------------------------|------|
| POST   | /api/register        | Register user            | ❌   |
| POST   | /api/login           | Login user               | ❌   |
| POST   | /api/update          | Update user              | ✅   |
| GET    | /api/profile         | Get profile              | ✅   |
| POST   | /api/upload-picture  | Upload profile image     | ✅   |
| POST   | /api/logout          | Logout user              | ✅   |
| POST   | /api/refresh         | Refresh access token     | ❌   |
| GET    | /api/users           | Get all users            | ❌   |

---

## ⚙️ Installation

```bash
git clone https://github.com/tiwarishiv014-a11y/node-auth.git
cd node-auth
npm install
npm run dev
