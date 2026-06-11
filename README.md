# 🔐 Node.js Authentication & AI Chat Platform

A production-ready REST API combining **phone-based OTP authentication**, **admin approval workflow**, **AI-powered chat**, and **voice capabilities (Speech-to-Text & Text-to-Speech)**.

> Built with Node.js · Express.js · MongoDB · JWT · Sarvam AI

---

## What this project does

* New users login with their **phone number only** — no password
* First-time users are held in **pending** status until an admin approves them
* Approved users receive an **OTP** to verify and get their JWT token
* Users can interact with an AI assistant through chat
* Users can use voice input via Speech-to-Text (STT)
* AI responses can be converted to speech via Text-to-Speech (TTS)
* Chat history is stored in MongoDB
* Admins manage everything from a **live HTML dashboard**

---

## Tech Stack

Node.js · Express.js · MongoDB · JWT · bcrypt · Multer · express-validator · cors · express-rate-limit · Sarvam AI

---

## Key Features

| Feature           | Details                                               |
| ----------------- | ----------------------------------------------------- |
| Phone OTP Login   | No password — OTP sent on every login                 |
| Admin Approval    | New users stay pending until admin approves           |
| JWT Auth          | Access token (15min) + Refresh token (7d)             |
| Role-based Access | Admin and user roles with protected routes            |
| AI Chat           | Sarvam AI powered conversations                       |
| Chat History      | Stores conversations in MongoDB                       |
| Speech-to-Text    | Convert voice input to text                           |
| Text-to-Speech    | Convert AI responses to audio                         |
| Admin Dashboard   | View, edit, delete, approve users from browser        |
| Activity Log      | Tracks login, OTP requests, failures, logout per user |
| File Upload       | Profile picture upload via Multer                     |
| Rate Limiting     | 10 requests / 15 min on auth routes                   |

---

## Project Structure

```text
node-auth/
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   └── voiceController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── upload.js
├── models/
│   ├── User.js
│   └── Chat.js
├── public/
│   └── admin-dashboard.html
├── routes/
│   ├── userRoutes.js
│   ├── chatRoutes.js
│   └── voiceRoutes.js
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
SARVAM_API_KEY=your_sarvam_api_key
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

| Method | Endpoint          | Description                   |
| ------ | ----------------- | ----------------------------- |
| POST   | `/api/register`   | Register an admin user        |
| POST   | `/api/login`      | Login with phone              |
| POST   | `/api/verify-otp` | Verify OTP and receive tokens |
| POST   | `/api/resend-otp` | Resend OTP                    |
| POST   | `/api/refresh`    | Refresh access token          |

### User (token required)

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| GET    | `/api/profile`        | Get profile            |
| POST   | `/api/update`         | Update profile         |
| POST   | `/api/upload-picture` | Upload profile picture |
| POST   | `/api/logout`         | Logout                 |

### Admin (admin token required)

| Method | Endpoint                 | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| GET    | `/api/admin/dashboard`   | Metrics and all users in one call     |
| GET    | `/api/admin/pending`     | All pending users                     |
| POST   | `/api/admin/status`      | Approve or reject a user              |
| GET    | `/api/admin/user/:phone` | Single user detail and activity log   |
| PUT    | `/api/admin/user/:phone` | Edit user                             |
| DELETE | `/api/admin/user/:phone` | Delete user                           |
| GET    | `/api/users`             | All users with pagination and filters |

### AI Chat

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/api/chat`         | Send message to AI  |
| GET    | `/api/chat/history` | Get chat history    |
| DELETE | `/api/chat/history` | Delete chat history |

### Voice

| Method | Endpoint                | Description    |
| ------ | ----------------------- | -------------- |
| POST   | `/api/voice/transcribe` | Speech-to-Text |
| POST   | `/api/voice/speak`      | Text-to-Speech |

---

## How Login Works

```text
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

* Phone not found — user created with status pending, must wait for admin
* Found but pending — blocked with 403
* Found but rejected — blocked with 403
* Found and approved — OTP generated, saved to DB, returned in response (dev mode)

---

## How Verify OTP Works

```text
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

* Max 3 wrong attempts — locked out, must login again for new OTP
* OTP expires in 10 minutes
* On success — OTP cleared from DB, tokens returned, activity logged

---

## How Admin Approval Works

```text
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

* Admin must have a valid JWT with role: admin
* Updates status field to approved or rejected
* After approval — user next login gets OTP instead of pending message

---

## AI Chat Flow

```text
User sends message
        |
        v
Backend receives request
        |
        v
Sarvam AI API
        |
        v
AI generates response
        |
        v
Store chat history in MongoDB
        |
        v
Return response to frontend
```

* Supports conversational AI interactions
* Stores user and assistant messages
* Retrieves previous chat history
* Protected using JWT authentication

---

## Voice Flow

### Speech-to-Text

```http
POST /api/voice/transcribe
```

Flow:

```text
User records audio
        |
        v
Backend receives file
        |
        v
Sarvam STT API
        |
        v
Transcribed text
        |
        v
Return text response
```

### Text-to-Speech

```http
POST /api/voice/speak
```

Flow:

```text
User sends text
        |
        v
Backend receives text
        |
        v
Sarvam TTS API
        |
        v
Generate audio
        |
        v
Return audio response
```

---

## Complete Flow

```text
1. User   POST /api/login
2. Admin  approves user
3. User   POST /api/verify-otp
4. User   receives JWT token
5. User   POST /api/chat
6. AI     generates response
7. Chat   stored in MongoDB
8. User   can use STT endpoint
9. User   can use TTS endpoint
```

---

## Token Lifecycle

```text
verify-otp returns:

accessToken   expires 15 min
refreshToken  expires 7 days

When accessToken expires:

POST /api/refresh

returns new accessToken

When logout:

POST /api/logout

refreshToken deleted from DB
user must login again
```

---

## Admin Dashboard

```text
http://localhost:3000/admin-dashboard.html
```

Features:

* Login with admin phone and OTP
* View all users with live metrics
* View user profile and activity logs
* Edit user details
* Delete users
* Approve or reject pending users
* Search and filter users

---

## Security Features

* JWT Authentication
* Refresh Tokens
* OTP Verification
* Role-Based Authorization
* Request Rate Limiting
* Protected Routes
* Input Validation
* Centralized Error Handling

---

## Notes

* NODE_ENV=development — OTP returned in API response for testing
* NODE_ENV=production — OTP sent via SMS provider
* Access token expires in 15 minutes
* Refresh token expires in 7 days
* OTP expires in 10 minutes
* Rate limit 10 requests per 15 min on auth routes
* Chat endpoints require authentication
* Voice endpoints require authentication
* Sarvam AI API key required for chat and voice services

---

## Future Enhancements

* Streaming AI responses
* Multiple AI providers
* Voice conversations
* Chat export
* Conversation analytics
* Multi-language voice support

---

## Author

Shivansh Tiwari

GitHub:
https://github.com/tiwarishiv014-a11y/node-auth

LinkedIn:
https://linkedin.com/in/shivansh-tiwari-72ab57315
