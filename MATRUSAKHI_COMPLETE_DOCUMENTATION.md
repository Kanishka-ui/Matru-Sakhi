# 🤰 MatruSakhi — Complete Project Documentation

> **Version:** 1.0.0 | **Last Updated:** March 18, 2026  
> **Tech Stack:** Next.js 16 (Frontend) + FastAPI + MongoDB (Backend) + AI (Groq/OpenAI)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Environment Setup & Running](#5-environment-setup--running)
6. [Feature List & Detailed Working](#6-feature-list--detailed-working)
7. [Backend — File-by-File Documentation](#7-backend--file-by-file-documentation)
8. [Frontend — File-by-File Documentation](#8-frontend--file-by-file-documentation)
9. [File Interconnection Map](#9-file-interconnection-map)
10. [Database Collections & Schema](#10-database-collections--schema)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Environment Variables](#12-environment-variables)
13. [How to Resume / Continue Development](#13-how-to-resume--continue-development)

---

## 1. Project Overview

**MatruSakhi** (मातृसखी — "Mother's Companion") is an AI-powered maternal health web application designed for expectant and new mothers. It provides:

- AI health chatbot for pregnancy-related queries
- Health record tracking (vitals, mood, symptoms, approx. kick counts)
- Medical report upload & AI-powered analysis
- SOS emergency alert system with SMS/voice call support
- Educational content library with 27+ articles
- Appointment management
- Danger sign detection & health alerts
- Email verification system
- Personalized content recommendations

The platform follows **Indian healthcare standards (ICMR/WHO guidelines)** and supports Indian dietary and cultural practices.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER (Browser)                    │
│            http://localhost:3000                     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API Calls (Axios)
                       ▼
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 16)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Auth     │ │ Protected│ │ Components       │    │
│  │ Pages    │ │ Pages    │ │ (Dropdown, etc.) │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Zustand  │ │ Axios    │                          │
│  │ Store    │ │ API Lib  │                          │
│  └──────────┘ └──────────┘                          │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT Bearer Token)
                       ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Routes   │ │Middleware │ │ Services         │    │
│  │ (API)    │ │ (Auth)   │ │ (Business Logic) │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Models   │ │ Schemas  │ │ Core (Config,    │    │
│  │ (DB Docs)│ │(Pydantic)│ │ Security)        │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ Motor (Async Driver)
                       ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB (Database)                      │
│  Collections: users, conversations, health_records,  │
│  milestones, appointments, alerts, content, reports, │
│  sos_alerts                                          │
└─────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────┐          ┌──────────────────┐
│ Groq/OpenAI   │          │ Twilio (SMS/Call) │
│ (AI Chat &    │          │ (SOS Alerts)      │
│  Report       │          │                   │
│  Analysis)    │          │ SMTP (Email       │
│               │          │  Verification)    │
└───────────────┘          └──────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (React) + TypeScript | UI, routing, SSR |
| **Styling** | Vanilla CSS (globals.css) | Dark theme, glassmorphism |
| **State Management** | Zustand | Client-side auth state |
| **HTTP Client** | Axios | API calls with JWT interceptor |
| **Backend** | FastAPI (Python 3.12+) | REST API server |
| **Database** | MongoDB + Motor (async) | Document database |
| **Authentication** | JWT (python-jose) + bcrypt | Token-based auth |
| **AI** | Groq (Llama 3.1) / OpenAI (GPT-4o-mini) | Chat & report analysis |
| **SMS/Voice** | Twilio | SOS emergency notifications |
| **Email** | SMTP (Gmail/Outlook) | Email verification |
| **PDF Parsing** | PyPDF2 | Report text extraction |
| **OCR** | Tesseract (optional) | Image report extraction |

---

## 4. Project Structure

```
Matru-Sakhi/
├── backend/                      # FastAPI Backend
│   ├── .env                      # Environment variables
│   ├── requirements.txt          # Python dependencies
│   ├── venv/                     # Python virtual environment
│   ├── uploads/reports/          # Uploaded medical reports
│   └── app/
│       ├── __init__.py
│       ├── main.py               # ★ FastAPI app entry point
│       ├── api/
│       │   ├── middleware/
│       │   │   └── auth_middleware.py  # JWT auth dependency
│       │   └── routes/
│       │       ├── auth.py       # Auth endpoints
│       │       ├── chat.py       # AI chat endpoints
│       │       ├── health.py     # Health records endpoints
│       │       ├── appointments.py # Appointment endpoints
│       │       ├── alerts.py     # Alert endpoints
│       │       ├── content.py    # Resources/articles endpoints
│       │       ├── reports.py    # Report upload endpoints
│       │       └── sos.py        # SOS alert endpoints
│       ├── core/
│       │   ├── config.py         # Settings (env vars)
│       │   └── security.py       # JWT & bcrypt functions
│       ├── db/
│       │   └── database.py       # MongoDB connection
│       ├── models/               # MongoDB document structures
│       │   ├── user.py
│       │   ├── chat.py
│       │   ├── health.py
│       │   ├── appointment.py
│       │   ├── alert.py
│       │   ├── content.py
│       │   ├── report.py
│       │   └── sos.py
│       ├── schemas/              # Pydantic request/response models
│       │   ├── user.py
│       │   ├── chat.py
│       │   ├── health.py
│       │   ├── appointment.py
│       │   ├── alert.py
│       │   └── content.py
│       ├── services/             # Business logic layer
│       │   ├── auth_service.py
│       │   ├── chat_service.py
│       │   ├── health_service.py
│       │   ├── appointment_service.py
│       │   ├── alert_service.py
│       │   ├── content_service.py
│       │   ├── seed_articles.py
│       │   ├── report_service.py
│       │   ├── sos_service.py
│       │   └── email_service.py
│       └── templates/            # Email HTML templates
│
├── client/                       # Next.js Frontend
│   ├── .env.local                # Frontend env vars
│   ├── package.json              # Node dependencies
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        # Root layout
│       │   ├── page.tsx          # Landing → redirects to /login
│       │   ├── globals.css       # ★ Complete CSS design system
│       │   ├── (auth)/           # Auth pages (no sidebar)
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── verify-email/page.tsx
│       │   └── (protected)/      # Authenticated pages (sidebar + topbar)
│       │       ├── layout.tsx    # ★ Protected layout (sidebar, SOS button)
│       │       ├── dashboard/page.tsx
│       │       ├── chat/page.tsx
│       │       ├── health/page.tsx
│       │       ├── appointments/page.tsx
│       │       ├── alerts/page.tsx
│       │       ├── content/page.tsx
│       │       ├── reports/page.tsx
│       │       ├── sos/page.tsx
│       │       └── profile/page.tsx
│       ├── components/
│       │   └── Dropdown.tsx      # Reusable dropdown component
│       ├── lib/
│       │   └── api.ts            # ★ Axios instance with JWT interceptor
│       └── stores/
│           └── authStore.ts      # ★ Zustand auth state management
│
├── test_api.py                   # API test scripts
├── test_report.py
├── test_sos.py
├── test_verify.py
└── .gitignore
```

---

## 5. Environment Setup & Running

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB (running on localhost:27017)

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Windows
pip install -r requirements.txt
# Copy .env.example to .env and fill in values
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd client
npm install
# Ensure .env.local has NEXT_PUBLIC_API_URL=http://localhost:8000
npx next dev --port 3000
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs

---

## 6. Feature List & Detailed Working

### 6.1 🔐 Authentication & Email Verification

**How it works:**
1. User registers with name, email, password, pregnancy info
2. Password is hashed with bcrypt (12 rounds) and stored in MongoDB
3. A JWT access token (60 min) and refresh token (7 days) are created
4. A verification email is sent via SMTP with a signed JWT link (24 hours)
5. User clicks the link → frontend sends token to `/api/auth/verify-email`
6. On login, credentials are verified and new tokens are issued
7. The Axios interceptor auto-refreshes expired access tokens using the refresh token

**User Flow:** Register → Receive Email → Click Verify Link → Login → Dashboard

### 6.2 🤖 AI Health Chatbot

**How it works:**
1. User sends a message from the chat page
2. Frontend calls `POST /api/chat/send` with the message and optional conversation_id
3. Backend builds a context-aware prompt including the user's pregnancy week, age, blood group
4. The message is sent to AI provider (priority: Groq → OpenAI → Rule-based fallback)
5. The AI response follows the system prompt that enforces WHO/ICMR guidelines
6. Both user and AI messages are stored in the `conversations` collection
7. If no AI key is configured, a keyword-based fallback system matches topics (nausea, nutrition, exercise, danger signs, sleep) and returns pre-written responses

**AI Providers:**
- **Groq** (free, fast): Uses Llama 3.1 8B
- **OpenAI**: Uses GPT-4o-mini
- **Fallback**: Rule-based keyword matching

### 6.3 ❤️ Health Records & Tracking

**Types of records:**
- **Vitals:** Blood pressure (systolic/diastolic), weight, temperature
- **Mood:** Emotional state tracking (happy, calm, anxious, sad, stressed)
- **Symptoms:** Log pregnancy symptoms (nausea, fatigue, back pain, etc.)
- **Approx. Kick Count:** Daily fetal movement tracking

**How it works:**
1. User logs health data from the Health page
2. Data is stored in `health_records` collection with user_id and record_type
3. Dashboard displays latest vitals, mood, approx. kick count, and symptoms
4. Pregnancy milestones are auto-initialized (11 milestones from Week 4 to Week 40)
5. Symptom logging triggers automatic danger sign detection via `alert_service`

### 6.4 📋 Medical Report Upload & Analysis

**How it works:**
1. User uploads a PDF or image of a medical report
2. File is saved to `backend/uploads/reports/`
3. **PDF extraction:** PyPDF2 extracts text from each page
4. **Image extraction:** Tesseract OCR (if available) extracts text from images
5. Extracted text is sent to AI with a specialized analysis prompt
6. AI returns structured JSON with:
   - Summary in simple language
   - Key medical values (hemoglobin, blood sugar, thyroid, etc.) with normal/low/high status
   - Plain-language insights explaining what each finding means
   - Risk flags for concerning values
   - Diet suggestions based on results
   - Next steps
7. If AI is unavailable, a regex-based fallback detects common values (hemoglobin, blood sugar, thyroid, BP, platelets)
8. Report analysis is saved in the `reports` collection
9. Blood group is auto-extracted and saved to user profile if detected

### 6.5 🆘 SOS Emergency Alert System

**3 Severity Levels:**

| Level | Name | Trigger | Actions |
|-------|------|---------|---------|
| 1 | Need Help | Single tap | SMS to emergency contacts |
| 2 | Urgent | Press & hold 3 seconds | SMS with priority flag |
| 3 | Emergency | Triple tap or hold 5 seconds | SMS + Voice call with pre-recorded message + Siren alarm |

**How it works:**
1. SOS button is available on ALL protected pages (fixed bottom-right, red pulsing button)
2. User navigates to SOS page and selects severity level
3. GPS location is fetched from the browser
4. Backend sends SMS to all emergency contacts with location link (Google Maps)
5. For Level 3: Twilio makes an automated voice call reading a pre-recorded emergency message
6. Alert is stored in `sos_alerts` collection with status "active"
7. User can "Resolve" (safe) or "Cancel" (false alarm) — contacts are notified
8. Direct dial buttons allow calling emergency contacts from the app
9. If Twilio is not configured, all messages are logged to console (for testing)

**SMS Template Example:**
```
🆘 EMERGENCY from {user_name}!
She needs immediate help! Location: {location_url}
Time: {time}
Please call her and rush to her location!
```

### 6.6 📚 Resources & Content Library

**27 articles across 15 categories:**
- 🙏 Garbhasanskar (spiritual practices, mantras, meditation)
- ✅ Dos & Don'ts (trimester-wise safety guide)
- 🥗 Nutrition (Indian diet plans, iron-rich foods, food safety)
- 🏃 Exercise (prenatal yoga, daily exercises)
- 💉 Vaccination (TT, flu, COVID, baby vaccination schedule)
- 🤰 Body Changes (trimester-wise changes, discomfort remedies)
- 👗 Clothing Tips (Indian wear, maternity essentials)
- 🧠 Mental Health (anxiety, depression, father's guide, relationships)
- 👶 Baby Development (week-by-week growth)
- 🩺 Prenatal Care (checkup schedule)
- 🏥 Labor & Delivery (signs, stages, hospital bag)
- 🤱 Postpartum (4th trimester, Jaapa traditions)
- 🍼 Breastfeeding (basics, positions)
- 🚨 Danger Signs (emergency warnings)

**Recommendation Engine:**
1. Fetches articles matching user's current pregnancy week
2. Sorts by popularity (likes)
3. Fills remaining slots with recent articles
4. Displays as "✨ Recommended For You" section

**Content is seeded on app startup** — if fewer articles than expected exist in the DB, it re-seeds.

### 6.7 📅 Appointment Management

**How it works:**
1. User creates appointments with title, type, date, time, provider, location
2. Appointments can be filtered by status (scheduled, completed, cancelled)
3. Each appointment has a dropdown menu (⋮) with actions: Edit, Complete/Reopen, Cancel, Delete
4. Appointments are stored in MongoDB sorted by date

### 6.8 🔔 Health Alerts & Danger Sign Detection

**How it works:**
1. When user logs symptoms, the system automatically checks against a database of 11 danger signs
2. Each danger sign has a severity level (critical/warning) and specific recommendations
3. If a danger sign is detected, an alert is created in the `alerts` collection
4. Alerts are shown on the Alerts page with severity badges (Critical 🔴, Warning 🟡, Info 🔵)
5. Users can mark alerts as read or dismiss them

**Danger Signs Detected:**
- Vaginal bleeding, severe headache, blurred vision, high fever
- Reduced fetal movement, seizures, severe abdominal pain
- Swelling, painful urination, persistent vomiting, water breaking

### 6.9 👤 Profile Management

**Features:**
1. View/edit personal information (name, phone, pregnancy week, due date, blood group)
2. Change password (requires current password verification)
3. Resend email verification
4. Actions dropdown with quick access to Edit, Change Password, and Verify options

### 6.10 🎛️ Dropdown Menus (Platform-Wide)

A reusable `Dropdown` component is used across the platform:
- **Sidebar footer:** User profile → Profile, SOS Settings, Upload Report, Sign Out
- **Mobile top bar:** Menu → Profile, Upload Report, SOS Emergency, Sign Out
- **Every data row:** ⋮ menus for appointments, health records, reports, alerts
- **Filter controls:** Category dropdowns for Resources, Alerts

---

## 7. Backend — File-by-File Documentation

### 7.1 `app/main.py` — Application Entry Point
**Purpose:** Creates the FastAPI app, registers middleware, includes all routers.

**What it does:**
- Defines a lifespan handler that connects to MongoDB on startup and disconnects on shutdown
- Seeds the content collection with educational articles on startup
- Registers CORS middleware allowing frontend origins
- Includes all 8 route modules
- Provides health check endpoints (`/` and `/api/status`)

**Connections:** Imports all routers from `api/routes/`, config from `core/config.py`, database functions from `db/database.py`, and `seed_content` from `services/content_service.py`.

---

### 7.2 `app/core/config.py` — Configuration
**Purpose:** Centralized settings management using pydantic-settings.

**Key Settings:**
- `MONGODB_URL`, `MONGODB_DB_NAME` — Database connection
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` — JWT configuration
- `CORS_ORIGINS` — Allowed frontend origins
- `OPENAI_API_KEY`, `GROQ_API_KEY` — AI provider keys
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` — Email server
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS/voice
- `FRONTEND_URL` — For email verification links
- `MAX_UPLOAD_SIZE`, `UPLOAD_DIR` — File upload limits

**Connections:** Read by every service and middleware. Loaded from `backend/.env` file.

---

### 7.3 `app/core/security.py` — Security Utilities
**Purpose:** Password hashing and JWT token creation/verification.

**Functions:**
| Function | Purpose |
|----------|---------|
| `hash_password(password)` | Hash with bcrypt (12 rounds, 72-byte limit) |
| `verify_password(plain, hashed)` | Verify password against hash |
| `create_access_token(data)` | JWT with 60-min expiry, type="access" |
| `create_refresh_token(data)` | JWT with 7-day expiry, type="refresh" |
| `decode_token(token)` | Decode & validate JWT, returns payload or None |

**Connections:** Used by `auth_service.py` (login/register), `auth_middleware.py` (token validation), and `email_service.py` (verification tokens).

---

### 7.4 `app/db/database.py` — Database Connection
**Purpose:** Async MongoDB connection using Motor driver.

**Functions:**
| Function | Purpose |
|----------|---------|
| `connect_to_database()` | Creates Motor client, sets global `db` variable |
| `close_database_connection()` | Closes Motor client |
| `get_database()` | Returns the database instance |
| `get_collection(name)` | Returns a specific collection from the database |

**Connections:** Called by `main.py` on startup/shutdown. `get_collection()` is used by ALL services.

---

### 7.5 `app/api/middleware/auth_middleware.py` — Auth Middleware
**Purpose:** JWT authentication dependency for protected routes.

**Functions:**
| Function | Purpose |
|----------|---------|
| `get_current_user(credentials)` | FastAPI dependency: extracts JWT from Authorization header, validates it, fetches user from DB, checks if active |
| `require_role(*roles)` | Factory for role-based access control (e.g., admin-only routes) |

**How it works:**
1. Extracts Bearer token from `Authorization` header
2. Decodes JWT using `security.decode_token()`
3. Validates token type is "access"
4. Fetches user from database using `auth_service.get_user_by_id()`
5. Checks if the user's account is active
6. Returns user dict to the route handler

**Connections:** Used as `Depends(get_current_user)` in every protected route. Imports `decode_token` from `core/security.py` and `get_user_by_id` from `services/auth_service.py`.

---

### 7.6 `app/api/routes/auth.py` — Auth Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/profile` | Yes | Update user profile |
| POST | `/api/auth/change-password` | Yes | Change password |
| GET | `/api/auth/verify-email` | No | Verify email with token |
| POST | `/api/auth/resend-verification` | No | Resend verification email |

**Connections:** Calls `services/auth_service.py` for all business logic.

---

### 7.7 `app/api/routes/chat.py` — Chat Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/chat/send` | Yes | Send message & get AI response |
| GET | `/api/chat/conversations` | Yes | List user's conversations |
| GET | `/api/chat/conversations/{id}` | Yes | Get specific conversation |
| DELETE | `/api/chat/conversations/{id}` | Yes | Delete a conversation |

**Connections:** Calls `services/chat_service.py`. Passes user context (pregnancy_week, age, blood_group) from the authenticated user to the AI.

---

### 7.8 `app/api/routes/health.py` — Health Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/health/records` | Yes | Create health record |
| GET | `/api/health/records` | Yes | List records (filterable) |
| GET | `/api/health/records/{id}` | Yes | Get single record |
| DELETE | `/api/health/records/{id}` | Yes | Delete record |
| GET | `/api/health/milestones` | Yes | Get pregnancy milestones |
| POST | `/api/health/milestones/init` | Yes | Initialize milestones |
| PUT | `/api/health/milestones/{id}` | Yes | Toggle milestone completion |
| GET | `/api/health/summary` | Yes | Dashboard health summary |
| POST | `/api/health/check-symptoms` | Yes | Danger sign checker |

**Connections:** Calls `services/health_service.py` and `services/alert_service.py` (for danger sign detection).

---

### 7.9 `app/api/routes/appointments.py` — Appointment Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/appointments/` | Yes | Create appointment |
| GET | `/api/appointments/` | Yes | List appointments |
| GET | `/api/appointments/{id}` | Yes | Get single appointment |
| PUT | `/api/appointments/{id}` | Yes | Update appointment |
| DELETE | `/api/appointments/{id}` | Yes | Delete appointment |

---

### 7.10 `app/api/routes/alerts.py` — Alert Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/alerts/` | Yes | Get all alerts |
| POST | `/api/alerts/read` | Yes | Mark alerts as read |
| POST | `/api/alerts/{id}/dismiss` | Yes | Dismiss alert |

---

### 7.11 `app/api/routes/content.py` — Content Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/content/` | No | List content (filterable) |
| GET | `/api/content/recommended` | Yes | Personalized recommendations |
| GET | `/api/content/{id}` | No | Get single article |
| POST | `/api/content/{id}/like` | Yes | Like an article |
| POST | `/api/content/` | Yes (Admin) | Create new content |
| POST | `/api/content/seed` | No | Seed default content |

---

### 7.12 `app/api/routes/reports.py` — Report Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/reports/upload` | Yes | Upload & analyze report |
| GET | `/api/reports/` | Yes | List user's reports |
| GET | `/api/reports/{id}` | Yes | Get report with analysis |
| DELETE | `/api/reports/{id}` | Yes | Delete report |

---

### 7.13 `app/api/routes/sos.py` — SOS Routes
**Endpoints:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/sos/trigger` | Yes | Trigger SOS alert |
| POST | `/api/sos/{id}/resolve` | Yes | Mark as resolved (safe) |
| POST | `/api/sos/{id}/cancel` | Yes | Cancel (false alarm) |
| GET | `/api/sos/active` | Yes | Get active SOS alert |
| GET | `/api/sos/history` | Yes | Get SOS history |

---

### 7.14 `app/models/` — MongoDB Document Structures

Each model file defines:
- `create_*_document()` — Creates a dict for MongoDB insertion
- `*_serializer()` — Converts MongoDB doc (with ObjectId) to JSON-safe dict

| Model File | Collection | Key Fields |
|-----------|-----------|------------|
| `user.py` | users | full_name, email, hashed_password, role, profile, health_data |
| `chat.py` | conversations | user_id, title, messages[], created_at |
| `health.py` | health_records, milestones | user_id, record_type, data, week |
| `appointment.py` | appointments | user_id, title, date, time, status |
| `alert.py` | alerts | user_id, alert_type, severity, is_read, is_dismissed |
| `content.py` | content | title, body, category, tags, pregnancy_week_range |
| `report.py` | reports | user_id, filename, file_path, status, analysis, key_values |
| `sos.py` | sos_alerts | user_id, severity, location, notified_contacts, status |

---

### 7.15 `app/schemas/` — Pydantic Validation Models

Request/response validation for each module:
- `user.py` — UserRegisterRequest, UserLoginRequest, UserProfileUpdateRequest
- `chat.py` — ChatMessageRequest, ChatResponse
- `health.py` — HealthRecordCreateRequest, SymptomCheckRequest
- `appointment.py` — AppointmentCreateRequest, AppointmentUpdateRequest
- `alert.py` — MarkReadRequest
- `content.py` — ContentCreateRequest, ContentResponse, ContentListResponse

---

### 7.16 `app/services/` — Business Logic

| Service | Purpose |
|---------|---------|
| `auth_service.py` | Register, login, token refresh, profile update, password change, email verify |
| `chat_service.py` | AI chat with Groq/OpenAI/fallback, conversation CRUD |
| `health_service.py` | Health record CRUD, milestones, dashboard summary |
| `appointment_service.py` | Appointment CRUD with date filtering |
| `alert_service.py` | Danger sign detection (11 signs), alert CRUD |
| `content_service.py` | Article CRUD, seeding, recommendation engine |
| `seed_articles.py` | 20 extended articles (Garbhasanskar, vaccination, etc.) |
| `report_service.py` | File upload, PDF/image text extraction, AI analysis |
| `sos_service.py` | SOS trigger, SMS/voice dispatch, resolve/cancel |
| `email_service.py` | SMTP email sending, verification token create/decode |

---

## 8. Frontend — File-by-File Documentation

### 8.1 `src/lib/api.ts` — Axios API Client
**Purpose:** Central HTTP client for all API calls.

**What it does:**
- Creates an Axios instance pointing to `NEXT_PUBLIC_API_URL` (default: localhost:8000)
- **Request interceptor:** Attaches JWT access token from localStorage to every request
- **Response interceptor:** On 401 errors, automatically tries to refresh the token using the refresh token. If refresh fails, redirects to /login

**Connections:** Imported by every page and the auth store.

---

### 8.2 `src/stores/authStore.ts` — Authentication State
**Purpose:** Zustand store managing user authentication state.

**State:**
- `user` — Current user object (loaded from localStorage on init)
- `isAuthenticated` — Boolean (checks localStorage for access_token)
- `isLoading`, `error` — UI state

**Actions:**
| Action | What it does |
|--------|-------------|
| `register(data)` | POST /api/auth/register → saves tokens + user to localStorage |
| `login(data)` | POST /api/auth/login → saves tokens + user to localStorage |
| `logout()` | Clears all localStorage tokens + user |
| `fetchUser()` | GET /api/auth/me → refreshes user from server |
| `updateProfile(data)` | PUT /api/auth/profile → updates user locally + server |
| `changePassword(...)` | POST /api/auth/change-password |

**Connections:** Used by all auth pages and protected layout. Depends on `lib/api.ts`.

---

### 8.3 `src/components/Dropdown.tsx` — Reusable Dropdown
**Purpose:** Flexible dropdown menu component used across the entire platform.

**Props:**
- `trigger` — The element that opens the dropdown (button, icon, etc.)
- `items` — Array of { label, icon, onClick, danger?, disabled?, divider? }
- `align` — "left" or "right" alignment

**Features:** Outside-click dismiss, fade-in animation, divider support, danger styling.

**Used in:** Layout sidebar, top bar, Appointments, Health, Reports, Alerts, Content, Profile pages.

---

### 8.4 `src/app/globals.css` — Complete Design System
**Purpose:** The entire visual design of the application.

**Design Tokens:**
- Dark theme with deep purple/navy background
- Pink/rose primary color (`#e85d75`)
- Glassmorphism effects (backdrop-filter: blur)
- CSS custom properties for all colors, spacing, typography

**Key Classes:** `.btn`, `.form-input`, `.card`, `.badge`, `.modal-overlay`, `.sidebar`, `.content-grid`, `.content-card`, `.empty-state`, `.spinner`, `.tag`, etc.

---

### 8.5 `src/app/(auth)/` — Auth Pages

| Page | Purpose |
|------|---------|
| `login/page.tsx` | Email/password login form → calls `authStore.login()` → redirects to /dashboard |
| `register/page.tsx` | Registration form with fields: name, email, password, phone, pregnancy week, due date, blood group, age, emergency contact → date-of-birth calendar input for age |
| `verify-email/page.tsx` | Reads `?token=` from URL → calls `/api/auth/verify-email` → shows success/error |

---

### 8.6 `src/app/(protected)/layout.tsx` — Protected Layout
**Purpose:** Wraps all authenticated pages with sidebar, top bar, and SOS button.

**Components:**
- **Sidebar:** Navigation links (Dashboard, AI Chat, Health, Appointments, Reports, Resources, Alerts, SOS, Profile) + user dropdown menu at bottom
- **Top Bar:** Hamburger menu (mobile), page breadcrumb, user dropdown
- **Floating SOS Button:** Fixed bottom-right, red pulsing animation, links to /sos (hidden on SOS page itself)
- **Auth Guard:** Redirects to /login if no access token

---

### 8.7 `src/app/(protected)/` — Protected Pages

| Page | Key Features |
|------|-------------|
| `dashboard/page.tsx` | Pregnancy week progress, days remaining, latest vitals, mood, approx. kick count, upcoming milestones, recent symptoms |
| `chat/page.tsx` | AI chat interface — conversation list (left), message thread (right), send messages, create/delete conversations |
| `health/page.tsx` | 3 tabs: Log (vitals, mood, symptoms, approx. kicks), Records (list with dropdown actions), Milestones (toggleable checkboxes) |
| `appointments/page.tsx` | Create/edit appointments, filter by status, row action dropdowns |
| `alerts/page.tsx` | Danger sign alerts list, severity filter dropdown, per-alert action dropdown |
| `content/page.tsx` | "Recommended For You" section, 15 category filter pills (color-coded), article grid with detail modal, like/view counts |
| `reports/page.tsx` | Upload form (PDF/image), upload progress, report list with analysis view modal, risk flags, diet suggestions |
| `sos/page.tsx` | 3 severity buttons (tap/hold/triple-tap), GPS fetching, active alert display, resolve/cancel, direct dial, siren alarm, history |
| `profile/page.tsx` | User info display, edit form, change password, actions dropdown |

---

## 9. File Interconnection Map

### Request Flow (Example: User sends a chat message)

```
User types message in chat/page.tsx
            │
            ▼
api.post("/api/chat/send", { message })     ← lib/api.ts adds JWT header
            │
            ▼
auth_middleware.py: get_current_user()       ← Validates JWT, fetches user
            │
            ▼
routes/chat.py: send_message()              ← Route handler
            │
            ▼
services/chat_service.py: send_message()    ← Business logic
            │
            ├──► db/database.py: get_collection("conversations")
            │
            ├──► _get_ai_response()
            │    ├──► Try Groq API (Llama 3.1)
            │    ├──► Try OpenAI API (GPT-4o-mini)
            │    └──► _get_fallback_response()  ← Rule-based
            │
            └──► Save user + AI messages to MongoDB
```

### Key Dependency Chains

```
Frontend Page → api.ts → Backend Route → Middleware → Service → Database
                                                        ↓
                                                     Model (doc structure)
                                                     Schema (validation)
```

```
config.py ←──── Every service, middleware, security module
security.py ←── auth_middleware.py, auth_service.py, email_service.py
database.py ←── Every service module
```

### Cross-Service Interactions

```
health_service.py ──► alert_service.py    (symptom check triggers danger detection)
report_service.py ──► auth_service.py     (updates user health data from report)
sos_service.py ────► auth_service.py      (fetches emergency contacts from user profile)
content_service.py ─► seed_articles.py    (imports extended article library)
main.py ───────────► content_service.py   (seeds content on app startup)
```

---

## 10. Database Collections & Schema

| Collection | Key Fields | Indexed On |
|-----------|-----------|-----------|
| `users` | _id, full_name, email, hashed_password, role, is_verified, profile{}, health_data{} | email (unique), phone (sparse) |
| `conversations` | _id, user_id, title, messages[], created_at, updated_at | user_id + updated_at |
| `health_records` | _id, user_id, record_type, data{}, notes, created_at | user_id + record_type + created_at |
| `milestones` | _id, user_id, week, title, description, is_completed, completed_at | user_id + week |
| `appointments` | _id, user_id, title, appointment_type, date, time, status | user_id + date |
| `alerts` | _id, user_id, alert_type, severity, title, message, is_read, is_dismissed | user_id + created_at |
| `content` | _id, title, body, content_type, category, tags[], pregnancy_week_range, views, likes | category + content_type, tags |
| `reports` | _id, user_id, filename, file_path, file_type, extracted_text, status, analysis, key_values[], insights[], risk_flags[] | user_id + created_at |
| `sos_alerts` | _id, user_id, severity, latitude, longitude, address, status, notified_contacts[], voice_call_made | user_id + status |

---

## 11. API Endpoints Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | ❌ | Register |
| POST | /login | ❌ | Login |
| POST | /refresh | ❌ | Refresh token |
| GET | /me | ✅ | Get profile |
| PUT | /profile | ✅ | Update profile |
| POST | /change-password | ✅ | Change password |
| GET | /verify-email?token= | ❌ | Verify email |
| POST | /resend-verification | ❌ | Resend verification |

### Chat (`/api/chat`)
| POST | /send | ✅ | Send message |
| GET | /conversations | ✅ | List conversations |
| GET | /conversations/{id} | ✅ | Get conversation |
| DELETE | /conversations/{id} | ✅ | Delete conversation |

### Health (`/api/health`)
| POST | /records | ✅ | Create record |
| GET | /records | ✅ | List records |
| GET | /records/{id} | ✅ | Get record |
| DELETE | /records/{id} | ✅ | Delete record |
| GET | /milestones | ✅ | Get milestones |
| POST | /milestones/init | ✅ | Initialize milestones |
| PUT | /milestones/{id} | ✅ | Toggle milestone |
| GET | /summary | ✅ | Dashboard summary |
| POST | /check-symptoms | ✅ | Check danger signs |

### Appointments (`/api/appointments`)
| POST | / | ✅ | Create |
| GET | / | ✅ | List (filterable) |
| GET | /{id} | ✅ | Get one |
| PUT | /{id} | ✅ | Update |
| DELETE | /{id} | ✅ | Delete |

### Alerts (`/api/alerts`)
| GET | / | ✅ | List alerts |
| POST | /read | ✅ | Mark as read |
| POST | /{id}/dismiss | ✅ | Dismiss |

### Content (`/api/content`)
| GET | / | ❌ | List articles |
| GET | /recommended | ✅ | Personalized recs |
| GET | /{id} | ❌ | Get article |
| POST | /{id}/like | ✅ | Like |
| POST | / | ✅ (Admin) | Create article |
| POST | /seed | ❌ | Seed content |

### Reports (`/api/reports`)
| POST | /upload | ✅ | Upload & analyze |
| GET | / | ✅ | List reports |
| GET | /{id} | ✅ | Get report detail |
| DELETE | /{id} | ✅ | Delete report |

### SOS (`/api/sos`)
| POST | /trigger | ✅ | Trigger alert |
| POST | /{id}/resolve | ✅ | Resolve (safe) |
| POST | /{id}/cancel | ✅ | Cancel (false alarm) |
| GET | /active | ✅ | Get active alert |
| GET | /history | ✅ | Alert history |

---

## 12. Environment Variables

### Backend (`backend/.env`)
```env
# App
APP_NAME=MatruSakhi API
APP_VERSION=1.0.0
DEBUG=true

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=matrusakhi

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# AI (at least one required for AI features)
GROQ_API_KEY=gsk_your_groq_key
OPENAI_API_KEY=sk-your_openai_key
AI_MODEL=gpt-4o-mini

# Email (for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Twilio (for SOS)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=uploads
```

### Frontend (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 13. How to Resume / Continue Development

### If you lost everything and need to restart:

1. **Clone the repo** (or restore from backup)
2. **Install dependencies:**
   ```bash
   # Backend
   cd backend && python -m venv venv && .\venv\Scripts\activate
   pip install -r requirements.txt
   
   # Frontend
   cd client && npm install
   ```
3. **Set up MongoDB** — Install and start MongoDB on localhost:27017
4. **Configure `.env` files** — Set API keys, SMTP, Twilio configs
5. **Start servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   
   # Terminal 2: Frontend
   cd client && npx next dev --port 3000
   ```
6. **Seed content:** Visit `http://localhost:8000/api/content/seed` (POST)
7. **Register a user** at `http://localhost:3000/register`

### Key patterns to follow when adding new features:

1. **Create model** in `backend/app/models/` — document structure + serializer
2. **Create schema** in `backend/app/schemas/` — Pydantic validation
3. **Create service** in `backend/app/services/` — business logic
4. **Create route** in `backend/app/api/routes/` — API endpoints
5. **Register route** in `backend/app/main.py` — `app.include_router()`
6. **Create frontend page** in `client/src/app/(protected)/` — React component
7. **Add navigation** in `client/src/app/(protected)/layout.tsx` — sidebar link

### Architecture rules:
- Routes should be thin — delegate to services
- Services own all database logic — never import `get_collection` in routes
- Models define document structure — services use model functions
- Schemas validate input/output — routes use schema types
- Auth middleware protects routes — use `Depends(get_current_user)`

---

*This document was generated on March 18, 2026, covering the complete MatruSakhi codebase.*
