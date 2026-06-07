# 🔐 Node.js Authentication API

A production-ready REST API with **phone-based OTP login**, **admin approval system**, and a built-in **admin dashboard**.

> Built with Node.js · Express · MongoDB · JWT

---

## What this project does

- New users login with their **phone number only** — no password
- First-time users are held in **pending** status until an admin approves them
- Approved users receive an **OTP** to verify and get their JWT token
- Admins manage everything from a **live HTML dashboard**

---

## Tech Stack

Node.js · Express.js · MongoDB · JWT · bcrypt · Multer · express-validator · cors · express-rate-limit

---

## Key Features

| Feature | Details |
|---|---|
| Phone OTP Login | No password — OTP sent on every login |
| Admin Approval | New users stay pending until admin approves |
| JWT Auth | Access token (15min) + Refresh token (7d) |
| Role-based Access | Admin and user roles with protected routes |
| Admin Dashboard | View, edit, delete, approve users from browser |
| Activity Log | Tracks login, OTP requests, failures, logout per user |
| File Upload | Profile picture upload via Multer |
| Rate Limiting | 10 requests / 15 min on auth routes |

---

## Project Structure

```
node-auth/
├── controllers/
│   └── authController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── upload.js
├── models/
│   └── User.js
├── public/
│   └── admin-dashboard.html
├── routes/
│   └── userRoutes.js
├── uploads/
├── utils/
│   ├── AppError.js
│   ├── otp.js
│   ├── sendOTP.js
│   └── token.js
├── validator/
│   └── userValidator.js
├── .env
├── index.js
└── package.json
```

---

## Getting Started

```bash
git clone https://github.com/tiwarishiv014-a11y/node-auth.git
cd node-auth
npm install
mkdir uploads
```

Create `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/mydb
ACCESS_SECRET=your_secret_here
REFRESH_SECRET=your_secret_here
NODE_ENV=development
PORT=3000
OTP_EXPIRY_MINUTES=10
```

```bash
npm run dev
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register an admin user |
| POST | `/api/login` | Login with phone |
| POST | `/api/verify-otp` | Verify OTP and receive tokens |
| POST | `/api/resend-otp` | Resend OTP |
| POST | `/api/refresh` | Refresh access token |

### User (token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get profile |
| POST | `/api/update` | Update profile |
| POST | `/api/upload-picture` | Upload profile picture |
| POST | `/api/logout` | Logout |

### Admin (admin token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Metrics and all users in one call |
| GET | `/api/admin/pending` | All pending users |
| POST | `/api/admin/status` | Approve or reject a user |
| GET | `/api/admin/user/:phone` | Single user detail and activity log |
| PUT | `/api/admin/user/:phone` | Edit user |
| DELETE | `/api/admin/user/:phone` | Delete user |
| GET | `/api/users` | All users with pagination and filters |

---

## How Login Works

```
User sends phone number
        |
        v
   Found in DB?
   |           |
  NO          YES
   |            |
   v         status?
Create     pend  rej  approved
pending     |     |      |
            403  403   Send OTP
                       Return OTP (dev)
```

- Phone not found — user created with status pending, must wait for admin
- Found but pending — blocked with 403
- Found but rejected — blocked with 403
- Found and approved — OTP generated, saved to DB, returned in response (dev mode)

---

## How Verify OTP Works

```
User sends phone + OTP
        |
        v
  Attempts >= 3?  →  block 429
        |
        v
  OTP expired?    →  clear OTP, block 400
        |
        v
  OTP wrong?      →  attempts++, block 400
        |
        v
      SUCCESS
  Clear OTP and attempts
  Generate accessToken and refreshToken
  Save refreshToken to DB
  Log activity, return tokens
```

- Max 3 wrong attempts — locked out, must login again for new OTP
- OTP expires in 10 minutes
- On success — OTP cleared from DB, tokens returned, activity logged

---

## How Admin Approval Works

```
Admin sends phone + status
        |
        v
  Valid token?   NO  →  401
        |
        v
  Role = admin?  NO  →  403
        |
        v
  Find user by phone
  Update status in DB
        |
   approved      rejected
      |               |
  User gets       User is
  OTP on          blocked
  next login
```

- Admin must have a valid JWT with role: admin
- Updates status field to approved or rejected
- After approval — user next login gets OTP instead of pending message

---

## Complete Flow

```
1. User   POST /api/login          phone only — status pending
2. Admin  POST /api/login          gets OTP
3. Admin  POST /api/verify-otp     gets admin token
4. Admin  POST /api/admin/status   approves user
5. User   POST /api/login          gets OTP now
6. User   POST /api/verify-otp     gets user token
7. User   GET  /api/profile        uses token
```

---

## Token Lifecycle

```
verify-otp returns:
  accessToken   expires 15 min   use for all protected requests
  refreshToken  expires 7 days   use to get new accessToken

When accessToken expires:
  POST /api/refresh { "refreshToken": "eyJ..." }
  returns new accessToken

When logout:
  POST /api/logout
  refreshToken deleted from DB
  user must login again from scratch
```

---

## Postman Setup

Create environment `node-auth-dev`:

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:3000/api` |
| `admin_token` | auto filled after admin login |
| `user_token` | auto filled after user login |
| `otp` | auto filled after login |

**POST /api/login — Scripts — Post-response:**
```js
const data = pm.response.json();
if (data.otp) pm.environment.set('otp', data.otp);
```

**POST /api/verify-otp — Scripts — Post-response:**
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

**Test order:**
```
1. POST  {{base_url}}/login          { "phone": "9999999999" }
2. POST  {{base_url}}/verify-otp     { "phone": "9999999999", "otp": "{{otp}}" }
3. POST  {{base_url}}/admin/status   { "phone": "8888888888", "status": "approved" }
4. POST  {{base_url}}/login          { "phone": "8888888888" }
5. POST  {{base_url}}/verify-otp     { "phone": "8888888888", "otp": "{{otp}}" }
6. GET   {{base_url}}/profile        Bearer {{user_token}}
```

---

## Admin Dashboard

```
http://localhost:3000/admin-dashboard.html
```

- Login with admin phone and OTP
- View all users with live metrics
- View full user profile and activity log in popup
- Edit user details directly
- Delete user with confirmation
- Approve or reject pending users
- Search by phone or name, filter by role

---

## Notes

- NODE_ENV=development — OTP returned in API response for Postman testing
- NODE_ENV=production — OTP sent via SMS using Fast2SMS
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- OTP expires in 10 minutes
- Rate limit 10 requests per 15 min on auth routes
- If duplicate key error on email — run db.users.dropIndexes() in mongosh then restart

---

## Links

GitHub: https://github.com/tiwarishiv014-a11y/node-auth

LinkedIn: https://linkedin.com/in/shivansh-tiwari-72ab57315