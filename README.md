# 🔐 Node.js Authentication API

A production-ready backend authentication system built using Node.js, Express, MongoDB, and JWT.  
This project follows **MVC architecture**, includes **phone-based OTP login**, **admin approval system**, **file upload**, and **centralized error handling**.

---

## 🚀 Features

- ✅ User Registration with bcrypt password hashing (admin)
- ✅ Phone-based OTP Login (no password for users)
- ✅ Admin approval flow for new users
- ✅ JWT Access Token (15min) + Refresh Token (7d)
- ✅ Secure Logout (invalidates refresh token)
- ✅ Role-based access control (admin / user)
- ✅ Update user profile
- ✅ Get user profile (protected)
- ✅ Upload profile picture (Multer)
- ✅ Input validation (express-validator)
- ✅ Rate limiting on auth routes
- ✅ Pagination & filtering on user list
- ✅ Admin dashboard (plain HTML)
- ✅ MVC Architecture
- ✅ Centralized Error Handling

---

## 🛠️ Tech Stack

- **Node.js** — Runtime
- **Express.js** — Framework
- **MongoDB + Mongoose** — Database
- **JWT** — Authentication
- **bcrypt** — Password hashing
- **express-validator** — Validation
- **multer** — File upload
- **express-rate-limit** — Rate limiting
- **cors** — Cross-origin requests

---

## 📁 Project Structure

```
node-auth/
├── controllers/
│   └── authController.js     # Business logic
├── middleware/
│   ├── authMiddleware.js      # JWT + admin check
│   ├── errorHandler.js        # Centralized error handling
│   ├── rateLimiter.js         # Rate limiting
│   └── upload.js              # Multer file upload
├── models/
│   └── User.js                # User schema
├── public/
│   └── admin-dashboard.html   # Admin dashboard UI
├── routes/
│   └── userRoutes.js          # All API routes
├── uploads/                   # Uploaded profile pictures
├── utils/
│   ├── AppError.js            # Custom error class
│   ├── otp.js                 # OTP generator
│   ├── sendOTP.js             # OTP sender (SMS / dev mode)
│   └── token.js               # JWT token generators
├── validator/
│   └── userValidator.js       # Input validation rules
├── .env                       # Environment variables
├── .gitignore
├── index.js                   # Entry point
└── package.json
```

---

## ⚙️ Installation

```bash
git clone https://github.com/tiwarishiv014-a11y/node-auth.git
cd node-auth
npm install
mkdir uploads
```

Create `.env` file:

```env
MONGO_URI=mongodb://127.0.0.1:27017/mydb
ACCESS_SECRET=your_access_secret_here
REFRESH_SECRET=your_refresh_secret_here
NODE_ENV=development
PORT=3000
```

Start server:

```bash
npm run dev
```

---

## 🔐 API Endpoints

### Auth (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Register admin user | ❌ |
| POST | `/api/login` | Phone login — new user → pending, approved user → OTP | ❌ |
| POST | `/api/verify-otp` | Verify OTP → returns access + refresh tokens | ❌ |
| POST | `/api/resend-otp` | Resend OTP to phone | ❌ |
| POST | `/api/refresh` | Get new access token using refresh token | ❌ |

### User (Protected)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile` | Get logged in user profile | ✅ |
| POST | `/api/update` | Update name, email, address, gender | ✅ |
| POST | `/api/upload-picture` | Upload profile picture (form-data) | ✅ |
| POST | `/api/logout` | Logout and clear refresh token | ✅ |

### Admin (Admin token required)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users with pagination + filters | 👮 |
| GET | `/api/admin/pending` | Get all pending approval requests | 👮 |
| POST | `/api/admin/status` | Approve or reject a user | 👮 |

> ✅ Bearer token required &nbsp;&nbsp; 👮 Admin role required

---

## 📱 Login Flow

```
User hits /api/login with phone number
            │
            ▼
      Found in DB?
      ┌──────┴──────┐
     NO            YES
      │              │
      ▼           status?
  Create user   ┌────┼────┐
  as pending  pend  rej  approved
      │          │    │      │
  "sent to     403  403   Send OTP
   admin"                    │
                              ▼
                      /api/verify-otp
                              │
                              ▼
                       accessToken
                       refreshToken
```

---

## 🧪 How to Test in Postman

### Step 1 — Setup Environment

Create a new environment called `node-auth-dev` with these variables:

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:3000/api` |
| `admin_token` | *(auto filled after login)* |
| `user_token` | *(auto filled after login)* |
| `otp` | *(auto filled after login)* |

---

### Step 2 — Auto Scripts (set once, works forever)

**In `POST /api/login` → Scripts tab → Post-response:**
```js
const data = pm.response.json();
if (data.otp) {
    pm.environment.set('otp', data.otp);
}
```

**In `POST /api/verify-otp` → Scripts tab → Post-response:**
```js
const data = pm.response.json();
if (data.accessToken) {
    if (data.user.role === 'admin') {
        pm.environment.set('admin_token', data.accessToken);
    } else {
        pm.environment.set('user_token', data.accessToken);
    }
}
```

---

### Step 3 — Create First Admin

Open MongoDB Compass → `mydb` → `users` → Insert Document:

```json
{
    "name": "Admin",
    "email": "admin@gmail.com",
    "phone": "9999999999",
    "role": "admin",
    "status": "approved",
    "isActive": true,
    "otp": null,
    "otpExpiry": null,
    "otpAttempts": 0,
    "refreshToken": null
}
```

---

### Step 4 — Test All Endpoints

#### 🔐 Register (admin only)
```
POST {{base_url}}/register
Body:
{
    "name": "Shivansh Tiwari",
    "email": "shivansh@gmail.com",
    "password": "admin123",
    "phone": "9999999999",
    "address": "Jabalpur",
    "gender": "male",
    "role": "admin"
}
```

---

#### 📱 Login
```
POST {{base_url}}/login
Body:
{
    "phone": "9999999999"
}

Response (dev mode):
{
    "status": "otp_sent",
    "otp": "482910"    ← auto saved to {{otp}}
}
```

---

#### ✅ Verify OTP
```
POST {{base_url}}/verify-otp
Body:
{
    "phone": "9999999999",
    "otp": "{{otp}}"
}

Response:
{
    "message": "Login successful",
    "accessToken": "eyJ...",    ← auto saved to {{admin_token}}
    "refreshToken": "eyJ..."
}
```

---

#### 👤 Get Profile
```
GET {{base_url}}/profile
Authorization: Bearer {{admin_token}}
```

---

#### ✏️ Update Profile
```
POST {{base_url}}/update
Authorization: Bearer {{user_token}}
Body:
{
    "name": "Shivansh",
    "address": "Rewa",
    "gender": "male"
}
```

---

#### 🖼️ Upload Profile Picture
```
POST {{base_url}}/upload-picture
Authorization: Bearer {{user_token}}
Body: form-data
  Key  : profilePicture  (type: File)
  Value: select any image from your computer
```

---

#### 🔄 Refresh Token
```
POST {{base_url}}/refresh
Body:
{
    "refreshToken": "eyJ..."
}
```

---

#### 🚪 Logout
```
POST {{base_url}}/logout
Authorization: Bearer {{user_token}}
```

---

#### 👮 Get All Users (admin)
```
GET {{base_url}}/users
Authorization: Bearer {{admin_token}}

With filters:
GET {{base_url}}/users?page=1&limit=10
GET {{base_url}}/users?status=pending
GET {{base_url}}/users?role=user
```

---

#### 👮 Get Pending Users (admin)
```
GET {{base_url}}/admin/pending
Authorization: Bearer {{admin_token}}
```

---

#### 👮 Approve or Reject User (admin)
```
POST {{base_url}}/admin/status
Authorization: Bearer {{admin_token}}
Body:
{
    "phone": "8888888888",
    "status": "approved"
}
```

---

## 🖥️ Admin Dashboard

After starting server open in browser:

```
http://localhost:3000/admin-dashboard.html
```

- Login with admin phone + OTP
- See all users with live status
- Approve / Reject pending users
- Search and filter users
- Metrics update in real time

---

## 📝 Notes

- In `NODE_ENV=development` → OTP is returned in API response for Postman testing
- In `NODE_ENV=production` → OTP is sent via SMS (Fast2SMS)
- Access token expires in **15 minutes**
- Refresh token expires in **7 days**
- Rate limit: **10 requests / 15 min** on auth routes

---

## 🔗 Repository

[github.com/tiwarishiv014-a11y/node-auth](https://github.com/tiwarishiv014-a11y/node-auth)
