# Node Auth — Backend API

REST API backend for a phone-based authentication and AI platform. Handles OTP login, admin workflows, multi-session AI chat, PDF Q&A (RAG), and voice (STT/TTS).

Paired with a separate React frontend — this repo is **backend only**.

| | Backend (this repo) | Frontend |
|---|---|---|
| **Repo** | [node-auth](https://github.com/tiwarishiv014-a11y/node-auth) | [node-auth-frontend](https://github.com/tiwarishiv014-a11y/node-auth-frontend) |
| **Stack** | Node.js · Express 5 · MongoDB | React · Vite |
| **Live** | https://node-auth-u2f2.onrender.com | https://node-auth-frontend-zeta.vercel.app |

---

## Architecture

```text
React Frontend (:5173 / Vercel)
        │
        │  HTTP + JWT (Authorization: Bearer …)
        ▼
Express API (:3000 / Render)  ──►  MongoDB
        │
        ├── Sarvam AI   (chat, STT, TTS)
        └── Groq AI     (chat, PDF RAG)
```

**Request flow:** Route → `authMiddleware` → Controller → Model / external API → JSON response.

```text
node-auth/
├── index.js                 # Entry point, CORS, route mounting
├── config/env.js            # dotenv loader (import first)
├── controllers/             # Business logic
│   ├── authController.js
│   ├── chatController.js
│   ├── pdfController.js
│   └── voiceController.js
├── middleware/
│   ├── authMiddleware.js    # JWT + admin role checks
│   ├── errorHandler.js
│   └── upload.js            # Profile picture uploads
├── models/
│   ├── User.js
│   ├── Chat.js
│   └── PdfDocument.js
├── routes/
│   ├── userRoutes.js        # Auth, profile, admin
│   ├── chatRoutes.js
│   ├── pdfRoutes.js
│   └── voiceRoutes.js
├── utils/
│   ├── token.js             # JWT helpers
│   ├── otp.js
│   └── AppError.js
├── validator/
│   └── userValidator.js
├── public/
│   └── admin-dashboard.html # Standalone admin UI
└── uploads/                 # Profile pictures (created at runtime)
```

---

## Features

| Area | Details |
|------|---------|
| **Auth** | Phone-only OTP login — no password required for the main flow |
| **Approval** | New users are `pending` until an admin approves them |
| **JWT** | Access token (30 min) + refresh token (7 days), stored in DB |
| **Roles** | `user` and `admin` with route-level guards |
| **AI Chat** | Sarvam (`sarvam-30b`) or Groq (`llama-3.1-8b-instant`), multi-session history |
| **PDF RAG** | Upload PDF → chunk text → keyword retrieval → Groq answers from context |
| **Voice** | Sarvam STT (`saaras:v3`) and TTS (`bulbul:v2`) |
| **Admin** | Dashboard, user CRUD, ban/unban, activity logs, usage insights |
| **Profile** | Update fields, upload profile picture via Multer |

---

## Tech Stack

Node.js (ES modules) · Express 5 · MongoDB · Mongoose · JWT · bcrypt · Multer · express-validator · cors · axios · Groq SDK · pdf-parse · Sarvam AI

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Sarvam AI](https://sarvam.ai) and [Groq](https://groq.com) API keys

### Install

```bash
git clone https://github.com/tiwarishiv014-a11y/node-auth.git
cd node-auth
npm install
mkdir uploads
```

### Environment

Copy `.env.example` to `.env` and fill in the values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/node-auth
ACCESS_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
SARVAM_API_KEY=your_sarvam_api_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
PORT=3000
OTP_EXPIRY=30
```

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `ACCESS_SECRET` / `REFRESH_SECRET` | JWT signing secrets |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | Token lifetimes (e.g. `30m`, `7d`) |
| `SARVAM_API_KEY` | Sarvam AI (chat, voice) |
| `GROQ_API_KEY` | Groq AI (chat, PDF RAG) |
| `OTP_EXPIRY` | OTP validity in **minutes** |
| `NODE_ENV` | `development` returns OTP in login response for testing |

### Run

```bash
# Backend
npm run dev          # http://localhost:3000

# Frontend (separate repo)
cd ../node-auth-frontend
npm run dev          # http://localhost:5173
```

CORS allows `http://localhost:5173` and the Vercel production frontend.

Admin dashboard (served by this API): `http://localhost:3000/admin-dashboard.html`

---

## API Reference

All protected routes require:

```http
Authorization: Bearer <accessToken>
```

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Legacy registration with password |
| POST | `/api/login` | Send phone → OTP (or create pending user) |
| POST | `/api/verify-otp` | Verify OTP → receive tokens |
| POST | `/api/refresh` | Exchange refresh token for new access token |

### User (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get current user profile |
| POST | `/api/update` | Update profile fields |
| POST | `/api/upload-picture` | Upload profile picture (`multipart/form-data`) |
| POST | `/api/logout` | Invalidate refresh token |

### AI Chat (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (`message`, `aiModel`, optional `chatId`, `language`) |
| GET | `/api/chat/sessions` | List chat sessions |
| GET | `/api/chat/:chatId` | Get single session |
| DELETE | `/api/chat/:chatId` | Delete session |
| DELETE | `/api/chat/clear/all` | Delete all sessions |

**Chat body example:**

```json
{
  "message": "How do I reset my OTP?",
  "aiModel": "groq",
  "language": "en-IN",
  "chatId": "optional-existing-session-id"
}
```

### PDF RAG (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pdf/upload` | Upload PDF (`multipart/form-data`, field: `pdf`, max 10 MB) |
| POST | `/api/pdf/chat` | Ask a question (`question`, `docId`) |
| GET | `/api/pdf/list` | List uploaded PDFs |
| DELETE | `/api/pdf/:id` | Delete a PDF document |

### Voice (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/transcribe` | Speech-to-text (`multipart/form-data`, field: `audio`) |
| POST | `/api/voice/speak` | Text-to-speech (`text`, optional `language`, `speaker`) |

### Admin (admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Metrics + recent users |
| GET | `/api/admin/pending` | Pending approval requests |
| POST | `/api/admin/status` | Approve or reject user (`phone`, `status`) |
| GET | `/api/admin/user/:phone` | User detail |
| PUT | `/api/admin/user/:phone` | Edit user |
| DELETE | `/api/admin/user/:phone` | Delete user |
| GET | `/api/users` | Paginated user list (`page`, `limit`, `status`, `role`) |
| GET | `/api/admin/logs/ai` | AI chat activity logs |
| GET | `/api/admin/logs/pdf` | PDF chat activity logs |
| GET | `/api/admin/insights` | Per-user chat/PDF usage stats |
| GET | `/api/admin/user-chats/:userId` | Chats for a specific user |
| GET | `/api/admin/user-pdfs/:userId` | PDFs for a specific user |
| POST | `/api/admin/ban` | Ban user (`phone`, optional `reason`) |
| POST | `/api/admin/unban` | Unban user (`phone`) |
| POST | `/api/admin/reset-otp` | Clear OTP lockout for a user |

---

## Core Flows

### Phone login

```text
POST /api/login { phone }
        │
        ├─ Not in DB        → create user (pending), return 200
        ├─ status: pending  → 403
        ├─ status: rejected → 403
        └─ status: approved → generate OTP, return otp_sent
                                    (OTP included in response when NODE_ENV=development)

POST /api/verify-otp { phone, otp }
        │
        ├─ attempts >= 3  → 429
        ├─ OTP expired    → 400
        ├─ OTP wrong      → 400 (increments attempts)
        └─ success        → accessToken + refreshToken
```

### PDF RAG

```text
Upload PDF → pdf-parse extracts text → split into ~1000-char chunks
→ save to PdfDocument → ask question → keyword match top chunks
→ Groq answers from context only → Q&A saved in chatHistory
```

- Text-based PDFs only (not scanned images)
- One active PDF per user (previous PDF deleted on new upload)

### AI chat

```text
POST /api/chat → route to Sarvam or Groq → save messages in Chat model
→ return reply + chatId + history (last 100 messages kept per session)
```

### Token lifecycle

```text
verify-otp  → accessToken (30 min) + refreshToken (7 days)
/api/refresh → new accessToken (refresh token must match DB)
/api/logout  → refreshToken cleared from DB
```

---

## Security

- JWT authentication on protected routes
- Role-based admin authorization
- OTP expiry and attempt limiting (max 3 wrong attempts)
- Input validation via express-validator
- Refresh token stored server-side and validated on refresh
- Centralized error handling
- CORS restricted to known frontend origins

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Backend | Render | https://node-auth-u2f2.onrender.com |
| Frontend | Vercel | https://node-auth-frontend-zeta.vercel.app |

Set all environment variables on Render. Point the frontend `VITE_API_URL` (or equivalent) at the Render backend URL.

---

## Author

**Shivansh Tiwari**

- GitHub: [tiwarishiv014-a11y](https://github.com/tiwarishiv014-a11y)
- Frontend: [node-auth-frontend](https://github.com/tiwarishiv014-a11y/node-auth-frontend)
- LinkedIn: [shivansh-tiwari-72ab57315](https://linkedin.com/in/shivansh-tiwari-72ab57315)
